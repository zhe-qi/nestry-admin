import { IsOptional } from '@/common/decorator/dto-optional-property.decorator';
import { BaseDomain } from '@/common/domain/base';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateDictTypeDto extends BaseDomain {
  @ApiProperty({ description: '字典名称' })
  @IsNotEmpty({ message: '字典名称不能为空' })
  @IsString()
  dictName: string;

  @ApiProperty({ description: '字典类型' })
  @IsNotEmpty({ message: '字典类型不能为空' })
  @IsString()
  dictType: string;

  @ApiProperty({ description: '字典状态（0停用，1正常）' })
  @IsOptional()
  status?: string = '1';
}
