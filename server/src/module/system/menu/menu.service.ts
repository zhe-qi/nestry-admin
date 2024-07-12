import { BadRequestException, Injectable } from '@nestjs/common';
import { Response } from 'express';
import { Prisma } from '@prisma/client';
import { isNotEmpty } from 'class-validator';
import { CreateSysMenuDto, QuerySysMenuDto, UpdateSysMenuDto } from './dto';
import { buildQueryCondition, tree } from '@/common/utils';
import { exportTable } from '@/common/utils/export';
import { PrismaService } from '@/module/prisma/prisma.service';

@Injectable()
export class MenuService {
  constructor(private prisma: PrismaService) {}
  /** @description 查询菜单管理所有 */
  async selectMenuAll() {
    return this.prisma.sysMenu.findMany();
  }

  /** @description 查询菜单管理列表 */
  async selectMenuList(q: QuerySysMenuDto) {
    const conditions = {
      menuName: () => ({ contains: q.menuName }),
      orderNum: () => ({ equals: q.orderNum }),
      path: () => ({ equals: q.path }),
      component: () => ({ equals: q.component }),
      query: () => ({ equals: q.query }),
      isFrame: () => ({ equals: q.isFrame }),
      isCache: () => ({ equals: q.isCache }),
      menuType: () => ({ equals: q.menuType }),
      visible: () => ({ equals: q.visible }),
      status: () => ({ equals: q.status }),
      perms: () => ({ equals: q.perms }),
      icon: () => ({ equals: q.icon }),
    };

    const queryCondition = buildQueryCondition<QuerySysMenuDto, Prisma.SysMenuWhereInput>(q, conditions);

    return this.prisma.sysMenu.findMany({
      where: queryCondition,
      orderBy: {
        orderNum: 'asc',
      },
    });
  }

  /** @description 查询菜单管理详情 */
  async selectMenuByMenuId(menuId: number) {
    return this.prisma.sysMenu.findUnique({
      where: {
        menuId,
      },
    });
  }

  /** @description 新增菜单管理 */
  async addMenu(sysMenu: CreateSysMenuDto) {
    // 删除掉空值
    for (const key in sysMenu) {
      !isNotEmpty(sysMenu[key]) && delete sysMenu[key];
    }
    return await this.prisma.sysMenu.create({
      data: sysMenu,
    });
  }

  /** @description 修改菜单管理 */
  async updateMenu(sysMenu: UpdateSysMenuDto) {
    // 删除掉空值
    for (const key in sysMenu) {
      !isNotEmpty(sysMenu[key]) && delete sysMenu[key];
    }
    return await this.prisma.sysMenu.update({
      where: {
        menuId: sysMenu.menuId,
      },
      data: sysMenu,
    });
  }

  /** @description 批量删除菜单管理 */
  async deleteMenuByMenuIds(menuIds: number[]) {
    const menu = await this.prisma.sysMenu.findFirst({
      where: {
        parentId: {
          in: menuIds,
        },
        menuType: {
          in: ['M', 'C'],
        },
      },
    });
    if (menu) {
      throw new BadRequestException('存在子菜单,不允许删除!');
    }
    const menu1 = await this.prisma.sysRoleMenu.findFirst({
      where: { menuId: { in: menuIds } },
    });
    if (menu1) {
      throw new BadRequestException('菜单已被分配,不允许删除!');
    }
    return this.prisma.sysMenu.deleteMany({
      where: {
        OR: [
          {
            menuId: { in: menuIds },
          },
          {
            menuType: 'F',
            parentId: { in: menuIds },
          },
        ],
      },
    });
  }

  /** @description 单个删除菜单管理 */
  async deleteMenuByMenuId(menuId: number) {
    const menu = await this.prisma.sysMenu.findFirst({
      where: {
        parentId: menuId,
        menuType: {
          in: ['M', 'C'],
        },
      },
    });
    if (menu) {
      throw new BadRequestException('存在子菜单,不允许删除!');
    }
    const menu1 = await this.prisma.sysRoleMenu.findFirst({
      where: { menuId },
    });
    if (menu1) {
      throw new BadRequestException('菜单已被分配,不允许删除!');
    }
    return this.prisma.sysMenu.deleteMany({
      where: {
        OR: [
          {
            menuId,
          },
          {
            menuType: 'F',
            parentId: menuId,
          },
        ],
      },
    });
  }

  /** @description 导出菜单管理所有数据为xlsx */
  async exportMenu(res: Response) {
    const title = [
      '菜单ID',
      '菜单名称',
      '父菜单ID',
      '显示顺序',
      '路由地址',
      '组件路径',
      '路由参数',
      '是否为外链（0否 1是）',
      '是否缓存（0不缓存 1缓存）',
      '菜单类型（M目录 C菜单 F按钮）',
      '菜单状态（0隐藏 1显示）',
      '菜单状态（0停用 1正常）',
      '权限标识',
      '菜单图标',
      '创建者',
      '创建时间',
      '更新者',
      '更新时间',
      '备注',
    ];
    const data = (await this.prisma.sysMenu.findMany()).map(v =>
      Object.values(v));
    data.unshift(title);
    exportTable(data, res);
  }

  async selectMenuTree() {
    const menus = tree((await this.prisma.sysMenu.findMany()).map(v => ({
      id: v.menuId,
      label: v.menuName,
      pid: v.parentId,
    })));
    return menus;
  }

  async roleMenuTreeselect(roleId: number) {
    const menus = await this.selectMenuTree();
    const checkedKeys = (
      await this.prisma.sysRoleMenu.findMany({ where: { roleId } })
    ).map(v => v.menuId);
    return { menus, checkedKeys };
  }
}
