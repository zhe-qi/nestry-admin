function updateEntityCode(
  entityName,
  hasBaseDomain,
  hasUpdateTime,
  reqUserName,
) {
  if (hasBaseDomain) {
    return `${entityName} = { ...${entityName}, updateTime: nowDateTime(), updateBy: ${reqUserName} }`;
  } else if (hasUpdateTime) {
    return `${entityName}["updateTime"] = nowDateTime();`;
  }
  return '';
}

export function getControllerTemplate(data: Record<string, any>) {
  const { className, functionName, filename, moduleName, businessName, UpperPkName, entityName, BusinessName, modelName1, pkName, pkColumn, hasBaseDomain, hasCreateTime, hasUpdateTime } = data;

  return `import { Body, Controller, Delete, Get, Param, ParseArrayPipe, ParseIntPipe, Post, Put, Query, Req, Res } from '@nestjs/common';
import { ParseIntArrayPipe } from '@/common/pipe/parse-int-array.pipe';
import Result from '@/common/utils/result';
import { ApiBody, ApiOperation, ApiQuery, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { RequirePermission } from '@/common/decorator/require-premission.decorator';
import { nowDateTime } from '@/common/utils';
import { ${className}Service } from './service/${filename}.service';
import { Query${className}Dto, Create${className}Dto, Update${className}Dto } from './dto/index';
import { Response } from 'express';
import { ${modelName1} } from '@prisma/client';
import { TableDataInfo } from '@/common/domain/table';

@ApiTags("${functionName}")
@ApiBearerAuth()
@Controller('${moduleName}/${businessName}')
export class ${className}Controller {
  constructor(private ${businessName}Service: ${className}Service) {}

  @ApiOperation({ summary: "查询${functionName}列表" })
  @ApiResponse({ type: TableDataInfo<${modelName1}> })
  @RequirePermission("${moduleName}:${businessName}:list")
  @Get("/list")
  async list${BusinessName}(@Query() q: Query${className}Dto) {
    return Result.TableData(await this.${businessName}Service.select${BusinessName}List(q));
  }

  @ApiOperation({ summary: "查询${functionName}所有" })
  @ApiResponse({ type: Result<${modelName1}[]> })
  @RequirePermission("${moduleName}:${businessName}:list")
  @Get("/data")
  async list${BusinessName}Data() {
    return Result.ok(await this.${businessName}Service.select${BusinessName}All());
  }

  @ApiOperation({ summary: "导出${functionName}xlsx文件" })
  @RequirePermission("${moduleName}:${businessName}:export")
  @Get("/export")
  async export(@Res() res: Response): Promise<void> {
    return this.${businessName}Service.export${BusinessName}(res);
  }

  @ApiOperation({ summary: "查询${functionName}详细" })
  @ApiResponse({ type: Result<${modelName1}> })
  @RequirePermission("${moduleName}:${businessName}:list")
  @Get("/:${pkName}")
  async get${BusinessName}(@Param("${pkName}"${pkColumn.javaType.toLowerCase() === 'number' ? ', ParseIntPipe' : ''}) ${pkName}: ${pkColumn.javaType.toLowerCase()}) {
    return Result.ok(await this.${businessName}Service.select${BusinessName}By${UpperPkName}(${pkName}));
  }

  @ApiOperation({ summary: "新增${functionName}" })
  @ApiResponse({ type: Result<${modelName1}> })
  @ApiBody({ type: Create${className}Dto })
  @RequirePermission("${moduleName}:${businessName}:add")
  @Post("/")
  async add${BusinessName}(@Body() ${entityName}: Create${className}Dto, @Req() req) {
    ${hasBaseDomain
    ? `${entityName} = {
      ...${entityName},
      createTime: nowDateTime(),
      updateTime: nowDateTime(),
      createBy: req.user?.userName,
      updateBy: req.user?.userName
    };`
    : `${hasCreateTime ? `${entityName}["createTime"] = nowDateTime();` : ''}
    ${hasUpdateTime ? `${entityName}["updateTime"] = nowDateTime();` : ''}`}
    return Result.ok(await this.${businessName}Service.add${BusinessName}(${entityName}));
  }

  @ApiOperation({ summary: "修改${functionName}" })
  @ApiResponse({ type: Result<any> })
  @ApiBody({ type: Update${className}Dto })
  @RequirePermission("${moduleName}:${businessName}:edit")
  @Put("/")
  async update${BusinessName}(@Body() ${entityName}: Update${className}Dto, @Req() req) {
    ${updateEntityCode(
    entityName,
    hasBaseDomain,
    hasUpdateTime,
    'req.user?.userName',
  )}
    await this.${businessName}Service.update${BusinessName}(${entityName});
    return Result.ok("修改成功！");
  }

  @ApiOperation({ summary: "删除${functionName}" })
  @ApiResponse({ type: Result<any> })
  @RequirePermission("${moduleName}:${businessName}:remove")
  @Delete("/:ids")
  async del${BusinessName}(@Param("ids", ${pkColumn.javaType.toLowerCase() === 'number' ? 'ParseIntArrayPipe' : 'ParseArrayPipe'}) ${pkName}s: ${pkColumn.javaType.toLowerCase()}[]) {
    let { count } = await this.${businessName}Service.delete${BusinessName}By${UpperPkName}s(${pkName}s);
    return Result.toAjax(count);
  }
}`;
}
