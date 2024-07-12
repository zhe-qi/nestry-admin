import { BadRequestException, Injectable } from '@nestjs/common';
import { Response } from 'express';
import { Prisma } from '@prisma/client';
import { isNotEmpty } from 'class-validator';
import { isArray } from 'lodash';
import { CreateSysUserDto, QuerySysUserDto, UpdateSysUserDto, UpdateSysUserStatusDto, resetPasswordDto, updateProfileDto } from './dto';
import { AuthService } from '@/module/system/auth/auth.service';
import { exportTable } from '@/common/utils/export';
import { PrismaService } from '@/module/prisma/prisma.service';
import Result from '@/common/utils/result';
import { Constants } from '@/common/constant/constants';
import { RedisService } from '@/module/redis/redis.service';
import { addDateRangeConditions, buildQueryCondition } from '@/common/utils';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService, private authService: AuthService, private readonly redis: RedisService) {}

  /** @description 查询用户所有 */
  async selectUserAll() {
    return this.prisma.sysUser.findMany();
  }

  /** @description 分页查询用户列表 */
  async selectUserList(q: QuerySysUserDto) {
    // 定义查询条件的处理规则
    const conditions = {
      deptId: () => ({ equals: q.deptId }),
      userName: () => ({ contains: q.userName }),
      nickName: () => ({ contains: q.nickName }),
      userType: () => ({ equals: q.userType }),
      email: () => ({ contains: q.email }),
      phonenumber: () => ({ contains: q.phonenumber }),
      sex: () => ({ equals: q.sex }),
      avatar: () => ({ equals: q.avatar }),
      password: () => ({ equals: q.password }),
      status: () => ({ equals: q.status }),
      loginIp: () => ({ equals: q.loginIp }),
    };

    // 使用全局通用处理函数构建查询条件
    const queryCondition = buildQueryCondition<QuerySysUserDto, Prisma.SysUserWhereInput>(q, conditions);

    // 处理日期范围查询条件
    const dateRanges: Record<string, [string, string]> = {
      loginDate: ['beginLoginDate', 'endLoginDate'],
      createTime: ['beginCreateTime', 'endCreateTime'],
      updateTime: ['beginUpdateTime', 'endUpdateTime'],
    };

    // 调用封装的日期范围查询条件处理函数
    addDateRangeConditions(queryCondition, q.params, dateRanges);

    // 查询结果
    const rows = await this.prisma.sysUser.findMany({
      skip: (q.pageNum - 1) * q.pageSize,
      take: q.pageSize,
      where: queryCondition,
      include: {
        dept: true,
      },
    });

    const total = await this.prisma.sysUser.count({ where: queryCondition });

    return { rows, total };
  }

  /** @description 查询用户详情 */
  async selectUserByUserId(userId: number) {
    return this.prisma.sysUser.findUnique({
      where: {
        userId,
      },
      include: {
        roles: true,
        posts: true,
      },
    });
  }

  /** @description 新增用户 */
  async addUser(sysUser: CreateSysUserDto) {
    const { roleIds, postIds, ...user } = sysUser;
    user.password = this.authService.encrypt(user.password); // 直接在解构后的user对象上操作
    // 使用Object.entries进行迭代，以便同时获取键和值
    Object.entries(user).forEach(([key, value]) => {
      if (!isNotEmpty(value)) {
        delete user[key]; // 删除空值属性
      }
    });
    return this.prisma.$transaction(async (db) => {
      const addUser = await db.sysUser.create({
        data: user,
      });
      const { userId } = addUser;
      // 使用Promise.all来同时执行角色和岗位的添加操作，提高效率
      const roleAndPostPromises = [];
      if (isArray(roleIds) && roleIds.length) {
        roleAndPostPromises.push(db.sysUserRole.createMany({
          data: roleIds.map(roleId => ({ userId, roleId })),
        }));
      }
      if (isArray(postIds) && postIds.length) {
        roleAndPostPromises.push(db.sysUserPost.createMany({
          data: postIds.map(postId => ({ userId, postId })),
        }));
      }
      await Promise.all(roleAndPostPromises); // 并行处理角色和岗位的添加
      return addUser;
    });
  }

  /** @description 修改用户 */
  async updateUser(sysUser: UpdateSysUserDto) {
    const { roleIds, postIds, userId, status, ...user } = sysUser;
    // 删除掉空值
    Object.keys(user).forEach((key) => {
      if (!isNotEmpty(user[key])) {
        delete user[key];
      }
    });
    await this.prisma.$transaction(async (db) => {
      // 使用Promise.all优化删除操作
      await Promise.all([
        db.sysUserPost.deleteMany({ where: { userId } }),
        db.sysUserRole.deleteMany({ where: { userId } }),
      ]);
      // 使用Promise.all优化添加操作
      const addRolesAndPosts = [];
      if (isArray(roleIds) && roleIds.length) {
        addRolesAndPosts.push(db.sysUserRole.createMany({
          data: roleIds.map(roleId => ({ userId, roleId })),
        }));
      }
      if (isArray(postIds) && postIds.length) {
        addRolesAndPosts.push(db.sysUserPost.createMany({
          data: postIds.map(postId => ({ userId, postId })),
        }));
      }
      await Promise.all(addRolesAndPosts);
      // 更新用户信息
      await db.sysUser.update({
        where: { userId },
        data: user,
      });
    });
    // 如果为禁用状态，我们把用户的token删除，禁用账户！
    if (status === '0') {
      await this.redis.del(Constants.LOGIN_TOKEN_KEY + userId);
    }
    return Result.ok();
  }

  /** @description 修改用户密码 */
  async resetPassword(sysUser: resetPasswordDto) {
    sysUser.password = this.authService.encrypt(sysUser.password);
    // 删除掉空值
    const res = await this.prisma.sysUser.update({
      where: {
        userId: sysUser.userId,
      },
      data: {
        password: sysUser.password,
      },
    });
    await this.redis.del(Constants.LOGIN_TOKEN_KEY + sysUser.userId);
    return res;
  }

  /** @description 修改用户状态 */
  async updateStatus(sysUser: UpdateSysUserStatusDto) {
    const res = await this.prisma.sysUser.update({
      where: {
        userId: sysUser.userId,
      },
      data: {
        status: sysUser.status,
      },
    });
    // 如果为禁用状态，我们把用户的token删除，禁用账户！
    if (sysUser.status === '0') {
      await this.redis.del(Constants.LOGIN_TOKEN_KEY + sysUser.userId);
    }
    return res;
  }

  /** @description 批量删除用户 */
  async deleteUserByUserIds(userIds: number[]) {
    return this.prisma.$transaction(async (db) => {
      // 并行删除用户相关的岗位和角色
      await Promise.all([
        db.sysUserPost.deleteMany({ where: { userId: { in: userIds } } }),
        db.sysUserRole.deleteMany({ where: { userId: { in: userIds } } }),
      ]);
      // 删除用户
      const res = await db.sysUser.deleteMany({ where: { userId: { in: userIds } } });
      // 并行清空用户的登录token
      await Promise.all(userIds.map(id => this.redis.del(Constants.LOGIN_TOKEN_KEY + id)));
      return res;
    });
  }

  /** @description 单个删除用户 */
  async deleteUserByUserId(userId: number) {
    return this.prisma.$transaction(async (db) => {
      // 使用Promise.all来并行执行删除操作，提高效率
      await Promise.all([
        db.sysUserPost.deleteMany({ where: { userId } }),
        db.sysUserRole.deleteMany({ where: { userId } }),
        this.redis.del(Constants.LOGIN_TOKEN_KEY + userId), // 将redis操作也并行执行
      ]);
      // 最后删除用户本身，确保前置依赖被清除
      return db.sysUser.delete({ where: { userId } });
    });
  }

  /** @description 导出用户所有数据为xlsx */
  async exportUser(res: Response) {
    const title = [
      '用户ID',
      '部门ID',
      '用户账号',
      '用户昵称',
      '用户类型（00系统用户）',
      '用户邮箱',
      '手机号码',
      '用户性别（0男 1女 2未知）',
      '头像地址',
      '密码',
      '帐号状态（0停用,1正常 ）',
      '删除标志（0删除，1可用）',
      '最后登录IP',
      '最后登录时间',
      '创建者',
      '创建时间',
      '更新者',
      '更新时间',
      '备注',
    ];
    const data = (await this.selectUserAll()).map(v => Object.values(v));
    data.unshift(title);
    exportTable(data, res);
  }

  /**
   * @description 查询授权角色
   */
  async getAuthRole(userId: number) {
    const user = await this.prisma.sysUser.findUnique({
      where: {
        userId,
      },
      include: {
        dept: true,
        roles: {
          include: {
            role: true,
          },
        },
      },
    });
    return {
      ...user,
      roles: user.roles.map(v => v.role),
    };
  }

  /**
   * @description 保存授权角色
   */
  async updateAuthRole(userId: number, roleIds: number[]) {
    await this.prisma.$transaction(async (db) => {
      // 删除现有角色关联
      await db.sysUserRole.deleteMany({ where: { userId } });
      // 批量创建新的角色关联，仅当roleIds非空时执行
      if (roleIds.length > 0) {
        await db.sysUserRole.createMany({
          data: roleIds.map(roleId => ({ userId, roleId })),
        });
      }
    });
    // 刷新用户信息缓存
    return this.authService.refreshUserInfo(userId);
  }

  /**
   * @description 查询用户个人信息
   */
  async getUserProfile(userId) {
    const user = await this.prisma.sysUser.findUnique({
      where: { userId },
      include: {
        dept: true,
        posts: { include: { post: true } },
        roles: { include: { role: true } },
      },
    });
    if (!user) { return null; } // 检查用户是否存在
    // 直接在返回对象中构造roleGroup和postGroup，避免额外变量分配
    return {
      ...user,
      roleGroup: user.roles.map(({ role }) => role.roleName).join(','),
      postGroup: user.posts.map(({ post }) => post.postName).join(','),
    };
  }

  /**
   * @description 修改用户个人信息
   */
  async updateUserProfile(userId: number, user: updateProfileDto) {
    await this.prisma.sysUser.update({
      where: {
        userId,
      },
      data: user,
    });
    return this.authService.refreshUserInfo(userId);
  }

  /** 修改头像 */
  async updateAvatar(userId: number, avatar: string) {
    await this.prisma.sysUser.update({
      where: {
        userId,
      },
      data: {
        avatar,
      },
    });
    return this.authService.refreshUserInfo(userId);
  }

  /** 修改密码 */
  async updateUserPwd(userId: number, oldPassword: string, newPassword: string) {
    if (!isNotEmpty(oldPassword) || !isNotEmpty(newPassword)) {
      throw new BadRequestException('请检查参数！');
    }
    if (oldPassword.length < 6 || newPassword.length < 6) {
      throw new BadRequestException('请检查参数！');
    }
    const user = await this.prisma.sysUser.findUnique({
      where: {
        userId,
      },
    });
    if (this.authService.encrypt(oldPassword) !== user.password) {
      throw new BadRequestException('验证失败：旧密码不正确！');
    }
    const res = await this.prisma.sysUser.update({
      where: {
        userId,
      },
      data: {
        password: this.authService.encrypt(newPassword),
      },
    });
    await this.redis.del(Constants.LOGIN_TOKEN_KEY + userId);
    return res;
  }
}
