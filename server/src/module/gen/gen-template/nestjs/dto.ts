export function getDtoTemplate(data: Record<string, any>) {
  const { functionName, className, columns, hasBaseDomain, pkColumn } = data;

  return `import { BaseDomain } from "@/common/domain/base"
import { ApiProperty } from "@nestjs/swagger"
import { Transform } from "class-transformer"
import { IsNotEmpty, IsNumber, IsString, IsOptional } from "class-validator"
import { QueryDomain } from "@/common/domain/query";
import { IsOptional } from '@/common/decorator/dto-optional-property.decorator';

/**@description 查询${functionName}Dto */
export class Query${className}Dto extends QueryDomain {
${getQueryDto(columns)}
}

/**@description 创建${functionName}Dto */
export class Create${className}Dto ${hasBaseDomain ? 'extends BaseDomain ' : ''}{
${getCreateDto(columns, pkColumn)}
}

/**@description 更新${functionName}Dto */
export class Update${className}Dto ${hasBaseDomain ? 'extends BaseDomain ' : ''}{
${getUpdateDto(columns, pkColumn)}
}
`;
}

function getUpdateDto(columns: Record<string, any>[], pkColumn: Record<string, any>) {
  return columns
    .filter(column => column.columnName != pkColumn.columnName && column.edit)
    .map(column => generatePropertyDefinition(column))
    .join('\n\n');
}

function getCreateDto(columns: Record<string, any>[], pkColumn: Record<string, any>) {
  return columns
    .filter(column => column.columnName != pkColumn.columnName || !pkColumn.increment)
    .map(column => generatePropertyDefinition(column))
    .join('\n\n');
}

function getQueryDto(columns: Record<string, any>[]) {
  return columns
    .filter(column => column.query && column.queryType != 'BETWEEN')
    .map(column => generatePropertyDefinition(column, true, column.javaType === 'Number'))
    .join('\n\n');
}

function generatePropertyDefinition(column: Record<string, any>, includeOptional: boolean = true, includeTransform: boolean = true) {
  const { javaField, javaType, columnComment, required } = column;
  const lines = [
    `  @ApiProperty({ description: "${columnComment}" })`,
    ...(required ? [`  @IsNotEmpty({ message: "${columnComment}不能为空" })`] : includeOptional ? ['  @IsOptional()'] : []),
    ...(javaType === 'Number' && includeTransform ? ['  @Transform((v) => +v.value)', '  @IsNumber()'] : ['  @IsString()']),
    `  ${javaField}${!required && includeOptional ? '?' : ''}: ${javaType.toLowerCase()}${includeOptional ? ' | null' : ''};`,
  ];
  return lines.join('\n');
}
