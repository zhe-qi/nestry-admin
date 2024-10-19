import { addDateRangeConditions, buildQueryCondition, tree } from '@/common/utils';
import { exportTable } from '@/common/utils/export';
import { PrismaService } from '@/module/prisma/prisma.service';
import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { isNotEmpty } from 'class-validator';
import { Response } from 'express';
import { CreateSysDeptDto, QuerySysDeptDto, UpdateSysDeptDto } from './dto';

@Injectable()
export class DeptService {
  constructor(private prisma: PrismaService) {}
  /** @description 分页查询部门管理列表 */
  async selectDeptList(q: QuerySysDeptDto) {
    const conditions = {
      deptId: () => ({ equals: q.deptId }),
      parentId: () => ({ equals: q.parentId }),
      ancestors: () => ({ contains: q.ancestors }),
      deptName: () => ({ contains: q.deptName }),
      orderNum: () => ({ equals: q.orderNum }),
      leader: () => ({ equals: q.leader }),
      phone: () => ({ equals: q.phone }),
      email: () => ({ equals: q.email }),
      status: () => ({ equals: q.status }),
      createBy: () => ({ equals: q.createBy }),
      updateBy: () => ({ equals: q.updateBy }),
    };

    const queryCondition = buildQueryCondition<QuerySysDeptDto, Prisma.SysDeptWhereInput>(q, conditions);

    const dateRanges: Record<string, [string, string]> = {
      createTime: ['beginCreateTime', 'endCreateTime'],
      updateTime: ['beginUpdateTime', 'endUpdateTime'],
    };

    addDateRangeConditions(queryCondition, q.params, dateRanges);

    return await this.prisma.sysDept.findMany({
      where: queryCondition,
    });
  }

  /** @description 分页查询部门管理列表 */
  async listDeptExcludeChild(deptId: number) {
    return this.prisma.sysDept.findMany({
      where: {
        deptId: {
          not: deptId,
        },
      },
      orderBy: {
        orderNum: 'asc',
      },
    });
  }

  /** @description 查询部门管理详情 */
  async selectDeptByDeptId(deptId: number) {
    return this.prisma.sysDept.findUnique({
      where: {
        deptId,
      },
    });
  }

  /** @description 新增部门管理 */
  async addDept(sysDept: CreateSysDeptDto) {
    // 删除掉空值
    for (const key in sysDept) {
      !isNotEmpty(sysDept[key]) && delete sysDept[key];
    }
    return await this.prisma.sysDept.create({
      data: sysDept,
    });
  }

  /** @description 修改部门管理 */
  async updateDept(sysDept: UpdateSysDeptDto) {
    // 删除掉空值
    for (const key in sysDept) {
      !isNotEmpty(sysDept[key]) && delete sysDept[key];
    }
    return await this.prisma.sysDept.update({
      where: {
        deptId: sysDept.deptId,
      },
      data: sysDept,
    });
  }

  /** @description 批量删除部门管理 */
  async deleteDeptByDeptIds(deptIds: number[]) {
    const dept = await this.prisma.sysDept.findFirst({
      where: {
        parentId: {
          in: deptIds,
        },
      },
    });
    if (dept) {
      throw new BadRequestException('存在子部门,不允许删除!');
    }
    const dept1 = await this.prisma.sysRoleDept.findFirst({
      where: { deptId: { in: deptIds } },
    });
    if (dept1) {
      throw new BadRequestException('部门已分配,不允许删除!');
    }
    const dept2 = await this.prisma.sysUser.findFirst({
      where: { deptId: { in: deptIds } },
    });
    if (dept2) {
      throw new BadRequestException('部门已分配,不允许删除!');
    }
    return this.prisma.sysDept.deleteMany({
      where: {
        deptId: {
          in: deptIds,
        },
      },
    });
  }

  /** @description 单个删除部门管理 */
  async deleteDeptByDeptId(deptId: number) {
    const dept = await this.prisma.sysDept.findFirst({
      where: {
        parentId: deptId,
      },
    });
    if (dept) {
      throw new BadRequestException('存在子部门,不允许删除!');
    }
    const dept1 = await this.prisma.sysRoleDept.findFirst({
      where: { deptId },
    });
    if (dept1) {
      throw new BadRequestException('部门已分配角色,不允许删除!');
    }
    const dept2 = await this.prisma.sysUser.findFirst({ where: { deptId } });
    if (dept2) {
      return new BadRequestException('部门已分配用户,不允许删除!');
    }
    return this.prisma.sysDept.deleteMany({
      where: {
        deptId,
      },
    });
  }

  /** @description 导出部门管理所有数据为xlsx */
  async exportDept(res: Response) {
    const title = [
      '部门id',
      '父部门',
      '祖级列表',
      '部门名称',
      '显示顺序',
      '负责人',
      '联系电话',
      '邮箱',
      '部门状态（0停用,1正常）',
      '删除标志（0删除,1存在 ）',
      '创建者',
      '创建时间',
      '更新者',
      '更新时间',
    ];
    const data = (await this.prisma.sysDept.findMany()).map(v =>
      Object.values(v));
    data.unshift(title);
    exportTable(data, res);
  }

  async getDeptTree() {
    return tree((await this.prisma.sysDept.findMany()).map(v => ({
      id: v.deptId,
      pid: v.parentId,
      label: v.deptName,
    })));
  }
}
