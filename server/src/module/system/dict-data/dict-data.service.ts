import { Constants } from '@/common/constant/constants';
import { buildQueryCondition } from '@/common/utils';
import { exportTable } from '@/common/utils/export';
import { PrismaService } from '@/module/prisma/prisma.service';
import { RedisService } from '@/module/redis/redis.service';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { isNotEmpty } from 'class-validator';
import { Response } from 'express';
import { groupBy } from 'lodash';
import { CreateDictDataDto } from './dto/createDictDataDto';
import { queryDictDataDto } from './dto/queryDictDataDto';
import { updateDictDataDto } from './dto/updateDictDataDto';

@Injectable()
export class DictDataService implements OnModuleInit {
  constructor(private prisma: PrismaService, private readonly redis: RedisService) {}
  onModuleInit() {
    this.initSysDictData();
  }

  // 初始化字典数据
  async initSysDictData() {
    const dictData = groupBy(await this.prisma.sysDictData.findMany(), 'dictType');
    for (const dictKey in dictData) {
      await this.redis.set(Constants.SYS_DICT_KEY + dictKey, JSON.stringify(dictData[dictKey], null, 2));
    }
  }

  // 根据字典类型更新redis字典数据
  async updateCache(dictType: string) {
    const dictDatas = await this.prisma.sysDictData.findMany({
      where: {
        dictType,
      },
    });
    return await this.redis.set(Constants.SYS_DICT_KEY + dictType, JSON.stringify(dictDatas, null, 2));
  }

  // 查询字典数据列表
  async selectDictDataList(q: queryDictDataDto) {
    const conditions = {
      dictType: () => ({ equals: q.dictType }),
      dictLabel: () => ({ contains: q.dictLabel }),
      status: () => ({ equals: q.status }),
    };

    const queryCondition = buildQueryCondition<queryDictDataDto, Prisma.SysDictDataWhereInput>(q, conditions);

    return {
      rows: await this.prisma.sysDictData.findMany({
        skip: (q.pageNum - 1) * q.pageSize,
        take: q.pageSize,
        where: queryCondition,
        orderBy: {
          dictSort: 'asc',
        },
      }),
      total: await this.prisma.sysDictData.count({
        where: queryCondition,
      }),
    };
  }

  // 查询所有数据
  async selectAllDictData() {
    return await this.prisma.sysDictData.findMany();
  }

  // 查询字典数据详细
  async selectDictDataDetail(dictCode: number) {
    return this.prisma.sysDictData.findUnique({
      where: {
        dictCode,
      },
    });
  }

  // 根据字典类型查询字典数据信息
  async selectDictDataByDictType(dictType: string) {
    return JSON.parse((await this.redis.get(Constants.SYS_DICT_KEY + dictType)) || null);
  }

  // 新增字典数据
  async addDictData(dictData: CreateDictDataDto) {
    const res = await this.prisma.sysDictData.create({
      data: dictData,
    });
    await this.updateCache(dictData.dictType);
    return res;
  }

  // 修改字典数据
  async updateDictData(dictData: updateDictDataDto) {
    const res = await this.prisma.sysDictData.update({
      where: {
        dictCode: dictData.dictCode,
      },
      data: dictData,
    });
    await this.updateCache(dictData.dictType);
    return res;
  }

  // 删除字典数据
  async deleteDictData(dictCodes: number[]) {
    const dictType = (
      await this.prisma.sysDictData.findFirst({
        select: {
          dictType: true,
        },
        where: {
          dictCode: dictCodes[0],
        },
      })
    ).dictType;
    const res = await this.prisma.sysDictData.deleteMany({
      where: {
        dictCode: {
          in: dictCodes,
        },
      },
    });
    await this.updateCache(dictType);
    return res;
  }

  // 导出xlsx文件
  async exportDictData(res: Response) {
    const title = [
      '字典编码',
      '字典排序',
      '字典标签',
      '字典键值',
      '字典类型',
      '样式属性',
      '表格回显样式',
      '是否默认',
      '状态',
      '创建者',
      '创建时间',
      '更新者',
      '更新时间',
      '备注',
    ];
    const data = (await this.prisma.sysDictData.findMany()).map(v =>
      Object.values(v));
    data.unshift(title);
    exportTable(data, res);
  }
}
