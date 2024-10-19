import { IsOptional } from '@/common/decorator/dto-optional-property.decorator';
import { QueryDomain } from '@/common/domain/query';
import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class queryDictDataDto extends QueryDomain {
  @ApiProperty({ description: '字典标签' })
  @IsString()
  @IsOptional()
  dictLabel?: string | null;

  @ApiProperty({ description: '字典名称' })
  @IsString()
  @IsOptional()
  dictType?: string | null;

  @ApiProperty({ description: '数据状态' })
  @IsString()
  @IsOptional()
  status?: string | null;
}
