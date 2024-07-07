import { Global, Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AxiosService } from './axios.service';

@Global()
@Module({
  imports: [HttpModule],
  providers: [AxiosService],
  exports: [AxiosService],
})
export class AxiosModule {}
