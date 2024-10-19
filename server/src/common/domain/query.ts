import { IsOptional } from '@/common/decorator/dto-optional-property.decorator';
import { ApiProperty } from '@nestjs/swagger';
import { PageDomain } from './page';

export class QueryDomain extends PageDomain {
  @ApiProperty({ description: '查询附加参数', required: false })
  @IsOptional()
  params: { [key: string]: any } = {};
}
