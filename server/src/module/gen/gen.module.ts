import { Module } from '@nestjs/common';
import { GenController } from './gen.controller';
import { GenService } from './gen.service';

@Module({
  controllers: [GenController],
  providers: [GenService],
})
export class GenModule {}
