import { configuration } from '@/config';
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

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
