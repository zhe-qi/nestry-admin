import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Config } from '@/config';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: Config.prisma.logEnable ? Config.prisma.log : [],
      datasourceUrl: process.env.DATABASE_URL,
    });
  }

  async onModuleInit() {
    this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
