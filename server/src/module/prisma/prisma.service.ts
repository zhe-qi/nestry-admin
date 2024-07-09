import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { configuration } from '@/config';

const Config = configuration();

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: Config.prisma.logEnable ? Config.prisma.log : [],
      datasourceUrl: Config.prisma.DATABASE_URL,
    });
  }

  async onModuleInit() {
    this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
