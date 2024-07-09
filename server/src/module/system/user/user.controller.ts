import { BadRequestException, Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query, Req, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { SysDept, SysUser } from '@prisma/client';
import { QuerySysDeptDto } from '../dept/dto';
import { UserService } from './user.service';
import { CreateSysUserDto, QuerySysUserDto, UpdateSysUserDto, UpdateSysUserStatusDto, resetPasswordDto, updateProfileDto } from './dto/index';
import { SysUserTableDataInfo } from './vo';
import { DeptService } from '@/module/system/dept/dept.service';
import { ParseIntArrayPipe } from '@/common/pipe/parse-int-array.pipe';
import Result from '@/common/utils/result';
import { RequirePermission } from '@/common/decorator/require-premission.decorator';
import { nowDateTime, tree } from '@/common/utils';
import { RequireRole } from '@/common/decorator/require-role.decorator';
import { PrismaService } from '@/module/prisma/prisma.service';

@ApiTags('用户管理')
@ApiBearerAuth()
@Controller('system/user')
export class UserController {
  constructor(
    private userService: UserService,
    private deptService: DeptService,
    private prisma: PrismaService,
  ) {}

  @ApiOperation({ summary: '获取岗位和角色选择' })
  @RequirePermission('system:user:add')
  @Get('/')
  async getRolePost() {
    const roles = await this.prisma.sysRole.findMany({
      where: { roleId: { not: 1 } },
    });
    const posts = await this.prisma.sysPost.findMany();
    return {
      ...Result.ok(),
      roles,
      posts,
    };
  }

  @ApiOperation({ summary: '查询用户管理列表' })
  @ApiQuery({ type: QuerySysUserDto })
  @ApiResponse({ type: SysUserTableDataInfo })
  @RequirePermission('system:user:query')
  @Get('/list')
  async listUser(@Query() q: QuerySysUserDto) {
    return Result.TableData<SysUser>(await this.userService.selectUserList(q));
  }

  @ApiOperation({ summary: '查询部门列表' })
  @ApiQuery({ type: QuerySysDeptDto })
  @ApiResponse({ type: Result<SysDept[]> })
  @RequirePermission('system:dept:query')
  @Get('/deptTree')
  async listDept(@Query() q: QuerySysDeptDto) {
    const depts = (await this.deptService.selectDeptList(q)).map(v => ({
      ...v,
      id: v.deptId,
      label: v.deptName,
    }));
    return Result.ok(tree(
      depts,
      'id',
      'parentId',
      0,
    ));
  }

  @ApiOperation({ summary: '导出用户管理xlsx文件' })
  @RequirePermission('system:user:export')
  @Get('/export')
  async export(@Res() res: Response): Promise<void> {
    return this.userService.exportUser(res);
  }

  @ApiOperation({ summary: '查询授权角色' })
  @RequireRole('admin')
  @Get('/authRole/:userId')
  async getAuthRole(@Param('userId', ParseIntPipe) userId: number): Promise<any> {
    const userInfo = await this.userService.getAuthRole(userId);
    const roles = (
      await this.prisma.sysRole.findMany({
        where: {
          roleId: {
            not: 1,
          },
        },
        orderBy: {
          roleSort: 'asc',
        },
      })
    ).map((v) => {
      return {
        ...v,
        flag: userInfo.roles.find(z => z.roleId === v.roleId),
      };
    });
    return {
      ...Result.ok(),
      user: userInfo,
      roles,
    };
  }

  @ApiOperation({ summary: '保存授权角色' })
  @RequireRole('admin')
  @ApiResponse({ type: Result<null> })
  @Put('/authRole')
  async updateAuthRole(@Query('userId', ParseIntPipe) userId: number, @Query('roleIds', ParseIntArrayPipe) roleIds: number[]) {
    await this.userService.updateAuthRole(userId, roleIds);
    return Result.ok();
  }

  @ApiOperation({ summary: '查询用户信息' })
  @Get('/profile')
  async getUserProfile(@Req() req): Promise<any> {
    const userInfo = await this.userService.getUserProfile(req.userId);
    return {
      ...Result.ok(userInfo),
      roleGroup: userInfo.roleGroup,
      postGroup: userInfo.postGroup,
    };
  }

  @ApiOperation({ summary: '修改用户个人基础信息' })
  @Put('/profile')
  async updateUserProfile(@Req() req, @Body() user: updateProfileDto) {
    await this.userService.updateUserProfile(req.userId, user);
    return Result.ok();
  }

  @ApiOperation({ summary: '修改个人密码' })
  @Put('/profile/updatePwd')
  async updateUserPwd(
  @Req() req, @Query('oldPassword')
    oldPassword: string, @Query('newPassword')
    newPassword: string,
  ) {
    await this.userService.updateUserPwd(
      req.userId,
      oldPassword,
      newPassword,
    );
    return Result.ok();
  }

  /**
   * @description 用户头像上传
   */

  @Post('/profile/avatar')
  async updateAvatar(@Body() body, @Req() req) {
    const userId = req.userId;
    if (!body.avatar) { return Result.BadRequest('请选择上传头像！'); }
    await this.userService.updateAvatar(userId, body.avatar);
    return {
      ...Result.ok(),
      imgUrl: body.avatar,
    };
  }

  @ApiOperation({ summary: '查询用户管理详细' })
  @RequirePermission('system:user:query')
  @Get('/:userId')
  async getUser(@Param('userId', ParseIntPipe) userId: number): Promise<any> {
    const user = await this.userService.selectUserByUserId(userId);
    const roles = await this.prisma.sysRole.findMany({
      where: { roleId: { not: 1 } },
    });
    const posts = await this.prisma.sysPost.findMany();
    return {
      ...Result.ok(user),
      roles,
      posts,
      roleIds: user.roles.map(v => v.roleId),
      postIds: user.posts.map(v => v.postId),
    };
  }

  @ApiOperation({ summary: '新增用户管理' })
  @ApiResponse({ type: Result<SysUser> })
  @ApiBody({ type: CreateSysUserDto })
  @RequirePermission('system:user:add')
  @Post('/')
  async addUser(@Body() sysUser: CreateSysUserDto, @Req() req) {
    sysUser = {
      ...sysUser,
      createTime: nowDateTime(),
      updateTime: nowDateTime(),
      createBy: req.user?.userName,
      updateBy: req.user?.userName,
    };
    // 过滤掉设置超级管理员角色
    sysUser.roleIds = sysUser.roleIds.filter(v => v !== 1);
    return Result.ok(await this.userService.addUser(sysUser));
  }

  @ApiOperation({ summary: '修改用户管理' })
  @ApiResponse({ type: Result<any> })
  @ApiBody({ type: UpdateSysUserDto })
  @RequirePermission('system:user:edit')
  @Put('/')
  async updateUser(@Body() sysUser: UpdateSysUserDto, @Req() req) {
    // 不能修改超级管理员
    if (sysUser.userId === 1) { throw new BadRequestException('非法操作！'); }
    // 过滤掉设置超级管理员角色
    sysUser.roleIds = sysUser.roleIds.filter(v => v !== 1);
    // 当前用户不能修改自己的状态
    if (sysUser.userId === req.userId) {
      delete sysUser.status;
    }
    sysUser = {
      ...sysUser,
      updateTime: nowDateTime(),
      updateBy: req.user?.userName,
    };
    await this.userService.updateUser(sysUser);
    return Result.ok('修改成功！');
  }

  @ApiOperation({ summary: '删除用户管理' })
  @ApiResponse({ type: Result<any> })
  @RequirePermission('system:user:remove')
  @Delete('/:ids')
  async delUser(@Req() req, @Param('ids', ParseIntArrayPipe) userIds: number[]) {
    // 不能删除自己或者超级管理员的账号
    userIds = userIds.filter(v => v !== 1 && v != req.userId);
    const { count } = await this.userService.deleteUserByUserIds(userIds);
    return Result.toAjax(count);
  }

  @ApiOperation({ summary: '重置用户密码' })
  @ApiResponse({ type: Result<any> })
  @ApiBody({ type: resetPasswordDto })
  @RequireRole('admin')
  @Put('/resetPwd')
  async resetPassword(@Body() sysUser: resetPasswordDto) {
    await this.userService.resetPassword(sysUser);
    return Result.ok('修改成功！');
  }

  @ApiOperation({ summary: '修改用户状态' })
  @ApiResponse({ type: Result<any> })
  @ApiBody({ type: UpdateSysUserStatusDto })
  @RequireRole('admin')
  @Put('/changeStatus')
  async updateUserStatus(@Body() sysUser: UpdateSysUserStatusDto) {
    await this.userService.updateStatus(sysUser);
    return Result.ok('修改成功！');
  }
}
