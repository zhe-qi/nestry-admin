import { ApiProperty } from '@nestjs/swagger';
import { QueryDomain } from '@/common/domain/query';
import { IsOptional } from '@/common/decorator/dto-optional-property.decorator';

export class QueryJobLogDto extends QueryDomain {
  @ApiProperty({ description: '任务名称' })
  @IsOptional()
  jobName: string;

  @ApiProperty({ description: '任务组名' })
  @IsOptional()
  jobGroup: string;

  @ApiProperty({ description: '执行状态' })
  @IsOptional()
  status: string;
}