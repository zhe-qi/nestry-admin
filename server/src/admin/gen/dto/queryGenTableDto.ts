import { ApiProperty } from '@nestjs/swagger';
import { QueryDomain } from '@/common/domain/query';
import { IsOptional } from '@/common/decorator/dto-optional-property.decorator';

export class queryGenTableDto extends QueryDomain {
  @ApiProperty({ description: '表名称' })
  @IsOptional()
  tableName: string | null;

  @ApiProperty({ description: '表描述' })
  @IsOptional()
  tableComment: string | null;

  @IsOptional()
  params: {
    beginTime: string | null
    endTime: string | null
  };
}
