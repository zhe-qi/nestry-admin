import { IsOptional } from '@/common/decorator/dto-optional-property.decorator';
import { BaseDomain } from '@/common/domain/base';
import { QueryDomain } from '@/common/domain/query';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

/** @description 查询参数配置Dto */
export class QuerySysConfigDto extends QueryDomain {
  @ApiProperty({ description: '参数主键' })
  @IsOptional()
  @Transform(v => +v.value)
  @IsNumber()
  configId: number | null;

  @ApiProperty({ description: '参数名称' })
  @IsOptional()
  configName: string | null;

  @ApiProperty({ description: '参数键名' })
  @IsOptional()
  configKey: string | null;

  @ApiProperty({ description: '参数键值' })
  @IsOptional()
  configValue: string | null;

  @ApiProperty({ description: '系统内置' })
  @IsOptional()
  configType: string | null;

  @ApiProperty({ description: '创建者' })
  @IsOptional()
  createBy: string | null;

  @ApiProperty({ description: '更新者' })
  @IsOptional()
  updateBy: string | null;
}

/** @description 创建参数配置Dto */
export class CreateSysConfigDto extends BaseDomain {
  @ApiProperty({ description: '参数名称' })
  @IsNotEmpty({ message: '参数名称不能为空' })
  @IsString()
  configName: string;

  @ApiProperty({ description: '参数键名' })
  @IsNotEmpty({ message: '参数键名不能为空' })
  @IsString()
  configKey: string;

  @ApiProperty({ description: '参数键值' })
  @IsNotEmpty({ message: '参数键值不能为空' })
  @IsString()
  configValue: string;

  @ApiProperty({ description: '系统内置' })
  @IsOptional()
  @IsString()
  configType?: string;

  @ApiProperty({ description: '创建者' })
  @IsOptional()
  @IsString()
  createBy?: string;

  @ApiProperty({ description: '创建时间' })
  @IsOptional()
  @IsString()
  createTime?: string;

  @ApiProperty({ description: '更新者' })
  @IsOptional()
  @IsString()
  updateBy?: string;

  @ApiProperty({ description: '更新时间' })
  @IsOptional()
  @IsString()
  updateTime?: string;

  @ApiProperty({ description: '备注' })
  @IsOptional()
  @IsString()
  remark?: string;
}

/** @description 更新参数配置Dto */
export class UpdateSysConfigDto extends BaseDomain {
  @ApiProperty({ description: '参数主键' })
  @IsNotEmpty({ message: '参数主键不能为空' })
  @Transform(v => +v.value)
  @IsNumber()
  configId: number;

  @ApiProperty({ description: '参数名称' })
  @IsNotEmpty({ message: '参数名称不能为空' })
  @IsString()
  configName: string;

  @ApiProperty({ description: '参数键名' })
  @IsNotEmpty({ message: '参数键名不能为空' })
  @IsString()
  configKey: string;

  @ApiProperty({ description: '参数键值' })
  @IsNotEmpty({ message: '参数键值不能为空' })
  @IsString()
  configValue: string;

  @ApiProperty({ description: '系统内置' })
  @IsOptional()
  @IsString()
  configType?: string;

  @ApiProperty({ description: '创建者' })
  @IsOptional()
  @IsString()
  createBy?: string;

  @ApiProperty({ description: '创建时间' })
  @IsOptional()
  @IsString()
  createTime?: string;

  @ApiProperty({ description: '更新者' })
  @IsOptional()
  @IsString()
  updateBy?: string;

  @ApiProperty({ description: '更新时间' })
  @IsOptional()
  @IsString()
  updateTime?: string;

  @ApiProperty({ description: '备注' })
  @IsOptional()
  @IsString()
  remark?: string;
}
