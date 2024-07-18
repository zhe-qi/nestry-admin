import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { QueryDomain } from '@/common/domain/query';
import { IsOptional } from '@/common/decorator/dto-optional-property.decorator';
import { BaseDomain } from '@/common/domain/base';

export class QueryJobMainDto extends QueryDomain {
  @ApiProperty({ description: '任务名称' })
  @IsOptional()
  jobName: string;

  @ApiProperty({ description: '任务组名' })
  @IsOptional()
  jobGroup: string;

  @ApiProperty({ description: '任务状态' })
  @IsOptional()
  status: string;
}

export class CreateJobMainDto extends BaseDomain {
  @ApiProperty({ description: '任务名称' })
  @IsNotEmpty({ message: '任务名称不能为空' })
  @IsString()
  jobName: string;

  @ApiProperty({ description: '任务组名' })
  @IsOptional()
  @IsString()
  jobGroup: string;

  @ApiProperty({ description: '调用目标字符串' })
  @IsNotEmpty({ message: '调用目标字符串不能为空' })
  @IsString()
  invokeTarget: string;

  @ApiProperty({ description: 'cron执行表达式' })
  @IsNotEmpty({ message: 'cron执行表达式不能为空' })
  @IsString()
  cronExpression: string;

  @ApiProperty({ description: 'misfire策略（1立即执行 2执行一次 3放弃执行）' })
  @IsNotEmpty({ message: 'misfire策略不能为空' })
  @Transform(v => `${v.value}`)
  misfirePolicy: string;

  @ApiProperty({ description: '是否并发执行（0允许 1禁止）' })
  @IsNotEmpty({ message: '是否并发执行不能为空' })
  @Transform(v => `${v.value}`)
  concurrent: string;

  @ApiProperty({ description: '状态（0正常 1暂停）' })
  @IsNotEmpty({ message: '状态不能为空' })
  @IsString()
  status: string;
}

export class UpdateJobMainDto extends BaseDomain {
  @ApiProperty({ description: '任务ID' })
  @IsNotEmpty({ message: '任务ID不能为空' })
  @IsNumber()
  jobId: number;

  @ApiProperty({ description: '任务名称' })
  @IsOptional()
  @IsString()
  jobName: string;

  @ApiProperty({ description: '任务组名' })
  @IsOptional()
  @IsString()
  jobGroup: string;

  @ApiProperty({ description: '调用目标字符串' })
  @IsOptional()
  @IsString()
  invokeTarget: string;

  @ApiProperty({ description: 'cron执行表达式' })
  @IsOptional()
  @IsString()
  cronExpression: string;

  @ApiProperty({ description: 'misfire策略（1立即执行 2执行一次 3放弃执行）' })
  @IsOptional()
  @Transform(v => `${v.value}`)
  misfirePolicy: string;

  @ApiProperty({ description: '是否并发执行（0允许 1禁止）' })
  @IsOptional()
  @Transform(v => `${v.value}`)
  concurrent: string;

  @ApiProperty({ description: '状态（0正常 1暂停）' })
  @IsOptional()
  @IsString()
  status: string;
}

export class ChangeJobMainStatusDto {
  @ApiProperty({ description: '任务ID' })
  @IsNotEmpty({ message: '任务ID不能为空' })
  @Transform(v => +v.value)
  jobId: number;

  @ApiProperty({ description: '状态（0正常 1暂停）' })
  @IsNotEmpty({ message: '状态不能为空' })
  @Transform(v => `${v.value}`)
  status: string;
}
