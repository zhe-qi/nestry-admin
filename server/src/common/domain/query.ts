import { IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PageDomain } from './page';

export class QueryDomain extends PageDomain {
  @ApiProperty({ description: '查询附加参数', required: false })
  @IsOptional()
  params: { [key: string]: any } = {};
}
