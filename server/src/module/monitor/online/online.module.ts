import { Module } from '@nestjs/common';
import { OnlineController } from './online.controller';

@Module({
  providers: [],
  controllers: [OnlineController],
})
export class OnlineModule {}
