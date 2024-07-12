import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { IsOptional } from '@/common/decorator/dto-optional-property.decorator';

export class BaseDomain {
  @ApiProperty({ description: '创建者', required: false })
  @IsString()
  @IsOptional()
  createBy?: string;

  @ApiProperty({ description: '创建时间', required: false })
  @IsString()
  @IsOptional()
  createTime?: string;

  @ApiProperty({ description: '更新者', required: false })
  @IsString()
  @IsOptional()
  updateBy?: string;

  @ApiProperty({ description: '更新时间', required: false })
  @IsString()
  @IsOptional()
  updateTime?: string;

  @ApiProperty({ description: '备注', required: false })
  @IsString()
  @IsOptional()
  remark?: string;
}
