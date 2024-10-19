import { Constants } from '@/common/constant/constants';
import { addDateRangeConditions, buildQueryCondition } from '@/common/utils';
import { exportTable } from '@/common/utils/export';
import { PrismaService } from '@/module/prisma/prisma.service';
import { RedisService } from '@/module/redis/redis.service';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { isNotEmpty } from 'class-validator';
import { Response } from 'express';
import { CreateSysConfigDto, QuerySysConfigDto, UpdateSysConfigDto } from './dto';

@Injectable()
export class ConfigService {
  constructor(private prisma: PrismaService, private readonly redis: RedisService) {
    this.initSysConfigData();
  }

  /** @desc 初始化系统配置到redis缓存 */
  async initSysConfigData() {
    const configData = await this.prisma.sysConfig.findMany({
      select: {
        configKey: true,
        configValue: true,
      },
    });
    for (const item of configData) {
      await this.redis.set(Constants.SYS_CONFIG_KEY + item.configKey, item.configValue);
    }
  }

  /** @description 查询参数配置所有 */
  async selectConfigAll() {
    return this.prisma.sysConfig.findMany();
  }

  /** @description 分页查询参数配置列表 */
  async selectConfigList(q: QuerySysConfigDto) {
    const conditions = {
      configId: () => ({ equals: q.configId }),
      configName: () => ({ contains: q.configName }),
      configKey: () => ({ contains: q.configKey }),
      configValue: () => ({ equals: q.configValue }),
      configType: () => ({ equals: q.configType }),
      createBy: () => ({ equals: q.createBy }),
      updateBy: () => ({ equals: q.updateBy }),
    };

    const queryCondition = buildQueryCondition<QuerySysConfigDto, Prisma.SysConfigWhereInput>(q, conditions);

    const dateRanges: Record<string, [string, string]> = {
      createTime: ['beginCreateTime', 'endCreateTime'],
      updateTime: ['beginUpdateTime', 'endUpdateTime'],
    };

    addDateRangeConditions(queryCondition, q.params, dateRanges);

    return {
      rows: await this.prisma.sysConfig.findMany({
        skip: (q.pageNum - 1) * q.pageSize,
        take: q.pageSize,
        where: queryCondition,
      }),
      total: await this.prisma.sysConfig.count({
        where: queryCondition,
      }),
    };
  }

  /** @description 查询参数配置详情 */
  async selectConfigByConfigId(configId: number) {
    return this.prisma.sysConfig.findUnique({
      where: {
        configId,
      },
    });
  }

  /** @description 新增参数配置 */
  async addConfig(sysConfig: CreateSysConfigDto) {
    // 删除掉空值
    for (const key in sysConfig) {
      !isNotEmpty(sysConfig[key]) && delete sysConfig[key];
    }
    const d = await this.prisma.sysConfig.create({
      data: sysConfig,
    });
    await this.redis.set(Constants.SYS_CONFIG_KEY + sysConfig.configKey, sysConfig.configValue);
    return d;
  }

  /** @description 修改参数配置 */
  async updateConfig(sysConfig: UpdateSysConfigDto) {
    // 删除掉空值
    for (const key in sysConfig) {
      !isNotEmpty(sysConfig[key]) && delete sysConfig[key];
    }
    await this.prisma.sysConfig.update({
      where: {
        configId: sysConfig.configId,
      },
      data: sysConfig,
    });
    await this.redis.set(Constants.SYS_CONFIG_KEY + sysConfig.configKey, sysConfig.configValue);
    return true;
  }

  /** @description 批量删除参数配置 */
  async deleteConfigByConfigIds(configIds: number[]) {
    const r = await this.prisma.sysConfig.deleteMany({
      where: {
        configId: {
          in: configIds,
        },
      },
    });
    await this.initSysConfigData();
    return r;
  }

  /** @description 单个删除参数配置 */
  async deleteConfigByConfigId(configId: number) {
    const r = this.prisma.sysConfig.delete({
      where: {
        configId,
      },
    });
    await this.initSysConfigData();
    return r;
  }

  /** @description 导出参数配置所有数据为xlsx */
  async exportConfig(res: Response) {
    const title = [
      '参数主键',
      '参数名称',
      '参数键名',
      '参数键值',
      '系统内置',
      '创建者',
      '创建时间',
      '更新者',
      '更新时间',
      '备注',
    ];
    const data = (await this.prisma.sysConfig.findMany()).map(v =>
      Object.values(v));
    data.unshift(title);
    exportTable(data, res);
  }
}
