import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { QueryDomain } from '@/common/domain/query';
import { IsOptional } from '@/common/decorator/dto-optional-property.decorator';

export class queryDictTypeDto extends QueryDomain {
  @ApiProperty({ description: '字典名称' })
  @IsString()
  @IsOptional()
  dictName?: string | null;

  @ApiProperty({ description: '字典类型' })
  @IsString()
  @IsOptional()
  dictType?: string | null;

  @ApiProperty({ description: '字典状态' })
  @IsString()
  @IsOptional()
  status?: string | null;

  @IsOptional()
  params: {
    beginTime: string | null
    endTime: string | null
  };
}
