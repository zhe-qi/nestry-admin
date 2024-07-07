import { ApiProperty } from '@nestjs/swagger';
import { QueryDomain } from '@/common/domain/query';

export class queryDataBaseDto extends QueryDomain {
  @ApiProperty({ description: '表名称' })
  tableName: string | null;

  @ApiProperty({ description: '表描述' })
  tableComment: string | null;
}
