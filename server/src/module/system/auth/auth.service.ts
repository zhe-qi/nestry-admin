import { randomUUID } from 'node:crypto';
import { BadRequestException, Injectable } from '@nestjs/common';
import * as bowser from 'bowser';
import { SysLogininfor, SysRole, SysUser } from '@prisma/client';
import * as jwt from 'jsonwebtoken';
import * as requestIp from 'request-ip';
import { Request } from 'express';
import { capitalize } from 'lodash';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import type { MenuItem, RawItem } from './types';
import { LoginBody } from './dto/LoginBody';
import { PrismaService } from '@/module/prisma/prisma.service';
import { AxiosService } from '@/module/axios/axios.service';
import { Constants } from '@/common/constant/constants';
import { nowDateTime } from '@/common/utils';
import { ValidationException } from '@/common/exception/validation';
import { RedisService } from '@/module/redis/redis.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly axiosService: AxiosService,
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly configService: ConfigService,
  ) {}

  /** @desc 登录 */
  async login(loginBody: LoginBody, req: Request) {
    const { username, password, uuid } = loginBody;

    // 用户登录日志
    const loginInfo = await this.recordLoginInfo(username, req);

    // 登录验证码是否开启
    await this.validateCaptcha(uuid, loginBody.code);

    // ip是否被封禁
    await this.checkBlacklistedIP(loginInfo.ipaddr, loginInfo);

    type UnpackPromise<T> = T extends Promise<infer U> ? U : T;
    let user: UnpackPromise<ReturnType<typeof this.validateUser>>;

    // 验证用户
    try {
      user = await this.validateUser(username, password);
    } catch (e) {
      loginInfo.msg = e.response?.message;

      await this.prisma.sysLogininfor.create({
        data: loginInfo,
      });

      throw new BadRequestException(e.message);
    }

    loginInfo.status = '1';
    loginInfo.msg = '登录成功';

    await this.prisma.sysLogininfor.create({
      data: loginInfo,
    });

    const cacheInfo = {
      tokenId: randomUUID(),
      userId: user.userId,
      deptName: user.dept?.deptName,
      userName: loginInfo.userName,
      ipaddr: loginInfo.ipaddr,
      loginLocation: loginInfo.loginLocation,
      browser: loginInfo.browser,
      os: loginInfo.os,
      loginTime: loginInfo.loginTime,
    };

    const token = this.createToken(cacheInfo);

    // 存储token
    await this.redis.set(Constants.LOGIN_TOKEN_KEY + cacheInfo.tokenId, JSON.stringify(cacheInfo), this.configService.get('token.expiresIn'));

    // 初始化用户信息存到reids缓存包括权限。。
    await this.refreshUserInfo(user.userId);

    return token;
  }

  // 获取用户信息，包括权限和角色
  async getUserInfo(userId: number) {
    // 如果redis有用户信息直接返回
    const userinfo: SysUser & { roles: string[], permissions: string[] }
      = JSON.parse((await this.redis.get(Constants.LOGIN_CACHE_TOKEN_KEY + userId))
      || null);
    if (userinfo !== null) { return userinfo; }
    const user = await this.prisma.sysUser.findFirst({
      where: {
        userId,
        status: '1', // 正常状态
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
    if (!user) { return null; }
    const ro = user.roles.map(v => v.role).filter(v => v.status === '1');
    const permissions = await this.getRolePermission(ro);
    const result = {
      ...user,
      roles: ro.map(v => v.roleKey),
      permissions,
    };
    // 存储到redis缓存，下次直接拿
    await this.redis.set(Constants.LOGIN_CACHE_TOKEN_KEY + userId, JSON.stringify(result), this.configService.get('token.expiresIn'));
    return result;
  }

  // 强制刷新redis缓存的用户信息
  async refreshUserInfo(userId: number) {
    const user = await this.prisma.sysUser.findFirst({
      where: {
        userId,
        status: '1', // 正常状态
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
    if (!user) { return null; }
    const ro = user.roles.map(v => v.role).filter(v => v.status === '1');
    const permissions = await this.getRolePermission(ro);
    const result = {
      ...user,
      roles: ro.map(v => v.roleKey),
      permissions,
    };
    // 存储到redis缓存，下次直接拿
    await this.redis.set(Constants.LOGIN_CACHE_TOKEN_KEY + userId, JSON.stringify(result), this.configService.get('token.expiresIn'));
    return true;
  }

  // 获取用户能访问的路由
  async getRouters(userId: number) {
    // 超级管理员，返回全部信息
    if (await this.isAdmin(userId)) {
      const r = await this.prisma.sysMenu.findMany({
        where: {
          menuType: {
            in: ['M', 'C'],
          },
          status: '1',
        },
        orderBy: [
          {
            parentId: 'asc',
          },
          {
            orderNum: 'asc',
          },
        ],
      });
      return this.MenuTree(
        r,
        'menuId',
        'parentId',
        0,
      );
    } else {
      const r: any = await this.prisma
        .$queryRaw`select distinct m.menu_id as menuId, m.parent_id as parentId, m.menu_name as menuName, m.path, m.component, m.query, m.visible, m.status, ifnull(m.perms,'') as perms, m.is_frame as isFrame, m.is_cache as isCache, m.menu_type as menuType, m.icon, m.order_num as orderNum, m.create_time as createTime
      from sys_menu m
       left join sys_role_menu rm on m.menu_id = rm.menu_id
       left join sys_user_role ur on rm.role_id = ur.role_id
       left join sys_role ro on ur.role_id = ro.role_id
       left join sys_user u on ur.user_id = u.user_id
      where u.user_id = ${userId} and m.menu_type in ('M', 'C') and m.status = 1  and ro.status = 1
      order by m.parent_id, m.order_num`;
      return this.MenuTree(
        r,
        'menuId',
        'parentId',
        0,
      );
    }
  }

  // 获取角色组所有权限
  async getRolePermission(roles: SysRole[]) {
    // 如果角色具有所有权限
    if (roles.some(v => v.dataScope === '1')) { return ['*:*:*']; }
    const perms: string[] = [];
    for (let i = 0; i < roles.length; i++) {
      const r: { perms: string }[] = await this.prisma
        .$queryRaw`select distinct a.perms from sys_menu a 
      left join sys_role_menu b on a.menu_id = b.menu_id
      where a.status = '1' and b.role_id = ${roles[i].roleId}`;
      for (const item of r) {
        if (item && item.perms?.includes(':') && !perms.includes(item.perms)) {
          perms.push(item.perms);
        }
      }
    }
    return perms;
  }

  // 获取用户角色
  async getUserRoles(userId: number) {
    return (await this.getUserInfo(userId)).roles;
  }

  // 获取用户权限
  async getUserPermissions(userId: number) {
    return (await this.getUserInfo(userId)).permissions;
  }

  // 检查用户是否含有权限
  async hasPermission(permission: string, userId: number) {
    const AllPermission = '*:*:*';
    const permissions = await this.getUserPermissions(userId);
    return (
      permissions.includes(AllPermission)
      || permissions.includes(permission)
    );
  }

  // 检测用户是否属于某个角色
  async hasRole(role: string, userId: number) {
    const roles = await this.getUserRoles(userId);
    return roles.includes(role);
  }

  // 检测用户是否管理员
  async isAdmin(userId: number) {
    return (
      userId === 1 || (await this.getUserPermissions(userId)).includes('*:*:*')
    );
  }

  /** @desc 菜单树形化 */
  MenuTree(
    arr: RawItem[] = [],
    id: string = 'id',
    pid: string = 'pid',
    rootValue: string | number = 0,
  ): MenuItem[] {
    const result: MenuItem[] = [];
    const map: Record<string, MenuItem> = {};

    arr.forEach((item) => {
      const newItem: MenuItem = {
        component: item.component,
        hidden: item.visible == 0,
        name: capitalize(item.path?.replaceAll('/', '')),
        path: item.path,
        meta: {
          icon: item.icon,
          link: null,
          noCache: item.isCache == 0,
          title: item.menuName,
        },
        children: [],
      };

      map[item[id]] = newItem;

      if (item[pid] === rootValue) {
        this.handleRootItem(item, newItem, result);
      } else {
        map[item[pid]] ? map[item[pid]].children.push(newItem) : map[item[pid]] = { children: [newItem] };
      }
    });

    Object.values(map).forEach((item) => {
      if (!item.children.length) {
        delete item.children;
      } else {
        item.alwaysShow = true;
        item.redirect = 'noRedirect';
        item.component = item.component || 'ParentView';
      }
    });

    return result;
  }

  handleRootItem(item, newItem, result) {
    if (item.menuType === 'M') {
      Object.assign(newItem, {
        alwaysShow: true,
        component: newItem.component || 'Layout',
        redirect: 'noRedirect',
        path: `/${newItem.path || newItem.path}`,
      });
      result.push(newItem);
    } else if (item.menuType === 'C') {
      if (item.isFrame == '1') {
        newItem.component = 'Layout';
        newItem.name = item.path;
        result.unshift(newItem);
      } else {
        result.unshift({
          path: '/',
          component: 'Layout',
          hidden: newItem.hidden,
          meta: newItem.meta,
          children: [newItem],
        });
      }
    }
  }

  /**
   * @desc 检查验证码是否正确
   */
  async validaCaptcha(uuid: string, code: string) {
    const r = await this.redis.get(Constants.CAPTCHA_CODE_KEY + uuid);
    if (r != code) {
      this.redis.del(Constants.CAPTCHA_CODE_KEY + uuid);
      return false;
    } else {
      return true;
    }
  }

  /**
   * @desc 密码加密
   */
  encrypt(str: string): string {
    return bcrypt.hashSync(str, bcrypt.genSaltSync(10));
  }

  /** @desc 创建token */
  createToken(payload) {
    return jwt.sign(payload, this.configService.get('token.secret'), {
      expiresIn: this.configService.get('token.expiresIn'),
    });
  }

  /** @desc 解析token */
  verifyToken(token: string) {
    return new Promise((resolve, reject) => {
      jwt.verify(token, this.configService.get('token.secret'), (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  }

  /** @desc 记录登录信息 */
  async recordLoginInfo(username: string, req): Promise<SysLogininfor> {
    const loginInfo: SysLogininfor = {
      infoId: undefined,
      userName: username,
      ipaddr: req.ip,
      loginLocation: '未知',
      browser: '未知',
      os: '未知',
      status: '0',
      msg: '',
      loginTime: nowDateTime(),
    };

    try {
      if (req.ip?.includes('127.0.0.1') || req.ip == '::1') {
        loginInfo.ipaddr = '127.0.0.1';
        loginInfo.loginLocation = '内网IP';
      } else {
        const clientIp = requestIp.getClientIp(req) || req.ip;
        loginInfo.loginLocation = await this.axiosService.ipToCity(clientIp);
      }
    } catch {}

    const agent = req.headers['user-agent'];

    try {
      const d = bowser.parse(agent);
      loginInfo.os = `${d.os.name} ${d.os.versionName}`;
      loginInfo.browser = `${d.browser.name} ${d.browser?.version?.split('.')?.[0]}` || '';
    } catch {}

    return loginInfo;
  }

  /** @desc 验证验证码 */
  async validateCaptcha(uuid: string, code: string): Promise<boolean> {
    const enable = await this.redis.get(`${Constants.SYS_CONFIG_KEY}sys.account.captchaEnabled`);
    const captchaEnabled: boolean = enable == '' ? true : enable === 'true';
    if (captchaEnabled) {
      if (!uuid || !code) {
        throw new ValidationException('参数不正确！');
      }
      code = code.toLowerCase();
      const isPass = await this.validaCaptcha(uuid, code);
      if (!isPass) {
        throw new BadRequestException('验证码错误！');
      }
      return true;
    }
    return false;
  }

  /** @desc 检查黑名单ip */
  async checkBlacklistedIP(reqIp: string, loginInfo: any): Promise<void> {
    const ips = (await this.redis.get(`${Constants.SYS_CONFIG_KEY}sys.login.blackIPList`)).split(',');
    if (ips.length) {
      const isBlack = ips.includes(reqIp);
      if (isBlack) {
        loginInfo.msg = `ip:${loginInfo.ipaddr}被封禁`;
        await this.prisma.sysLogininfor.create({
          data: loginInfo,
        });
        throw new BadRequestException('你的ip已经被封禁！');
      }
    }
  }

  /** @desc 验证用户 */
  async validateUser(username: string, password: string) {
    const user = await this.prisma.sysUser.findFirst({
      where: {
        userName: username,
      },
      select: {
        userId: true,
        password: true,
        status: true,
        dept: {
          select: {
            deptName: true,
          },
        },
      },
    });

    if (!user) {
      throw new BadRequestException('用户不存在');
    }

    if (!bcrypt.compareSync(password, user.password)) {
      throw new BadRequestException('密码不正确');
    }

    if (user.status !== '1') {
      throw new BadRequestException('账号被封禁');
    }

    return user; // 返回验证通过的用户信息
  }
}
