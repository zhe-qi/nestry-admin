import { Module } from '@nestjs/common';
import { ServerController } from './server.controller';

@Module({
  providers: [],
  controllers: [ServerController],
})
export class ServerModule {}
