import { Injectable } from '@nestjs/common';
import { Response } from 'express';
import { Prisma } from '@prisma/client';
import { isNotEmpty } from 'class-validator';
import { CreateSysNoticeDto, QuerySysNoticeDto, UpdateSysNoticeDto } from './dto';
import { exportTable } from '@/common/utils/export';
import { PrismaService } from '@/module/prisma/prisma.service';
import { buildQueryCondition } from '@/common/utils';

@Injectable()
export class NoticeService {
  constructor(private prisma: PrismaService) {}

  /** @description 查询通知公告表所有 */
  async selectNoticeAll() {
    return this.prisma.sysNotice.findMany();
  }

  /** @description 分页查询通知公告表列表 */
  async selectNoticeList(q: QuerySysNoticeDto) {
    const conditions = {
      noticeTitle: () => ({ contains: q.noticeTitle }),
      noticeType: () => ({ equals: q.noticeType }),
      status: () => ({ equals: q.status }),
    };

    const queryCondition = buildQueryCondition<QuerySysNoticeDto, Prisma.SysNoticeWhereInput>(q, conditions);

    return {
      rows: await this.prisma.sysNotice.findMany({
        skip: (q.pageNum - 1) * q.pageSize,
        take: q.pageSize,
        where: queryCondition,
      }),
      total: await this.prisma.sysNotice.count({
        where: queryCondition,
      }),
    };
  }

  /** @description 查询通知公告表详情 */
  async selectNoticeByNoticeId(noticeId: number) {
    return this.prisma.sysNotice.findUnique({
      where: {
        noticeId,
      },
    });
  }

  /** @description 新增通知公告表 */
  async addNotice(sysNotice: CreateSysNoticeDto) {
    // 删除掉空值
    for (const key in sysNotice) {
      !isNotEmpty(sysNotice[key]) && delete sysNotice[key];
    }
    return await this.prisma.sysNotice.create({
      data: sysNotice,
    });
  }

  /** @description 修改通知公告表 */
  async updateNotice(sysNotice: UpdateSysNoticeDto) {
    // 删除掉空值
    for (const key in sysNotice) {
      !isNotEmpty(sysNotice[key]) && delete sysNotice[key];
    }
    return await this.prisma.sysNotice.update({
      where: {
        noticeId: sysNotice.noticeId,
      },
      data: sysNotice,
    });
  }

  /** @description 批量删除通知公告表 */
  async deleteNoticeByNoticeIds(noticeIds: number[]) {
    return this.prisma.sysNotice.deleteMany({
      where: {
        noticeId: {
          in: noticeIds,
        },
      },
    });
  }

  /** @description 单个删除通知公告表 */
  async deleteNoticeByNoticeId(noticeId: number) {
    return this.prisma.sysNotice.delete({
      where: {
        noticeId,
      },
    });
  }

  /** @description 导出通知公告表所有数据为xlsx */
  async exportNotice(res: Response) {
    const title = [
      '公告ID',
      '公告标题',
      '公告类型（1通知 2公告）',
      '公告内容',
      '公告状态（0关闭 1正常）',
      '创建者',
      '创建时间',
      '更新者',
      '更新时间',
      '备注',
    ];
    const data = (await this.prisma.sysNotice.findMany()).map(v =>
      Object.values(v));
    data.unshift(title);
    exportTable(data, res);
  }
}
