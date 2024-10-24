import { RequirePermission } from '@/common/decorator/require-premission.decorator';
import { ParseIntArrayPipe } from '@/common/pipe/parse-int-array.pipe';
import { nowDateTime } from '@/common/utils';
import Result from '@/common/utils/result';
import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query, Req, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SysDept } from '@prisma/client';
import { Response } from 'express';
import { DeptService } from './dept.service';
import { CreateSysDeptDto, QuerySysDeptDto, UpdateSysDeptDto } from './dto/index';

@ApiBearerAuth()
@ApiTags('部门管理')
@Controller('system/dept')
export class DeptController {
  constructor(private deptService: DeptService) { }

  @ApiOperation({ summary: '查询部门管理列表' })
  @ApiQuery({ type: QuerySysDeptDto })
  @ApiResponse({ type: Result<SysDept[]> })
  @RequirePermission('system:dept:query')
  @Get('/list')
  async listDept(@Query() q: QuerySysDeptDto) {
    return Result.ok<any>(await this.deptService.selectDeptList(q));
  }

  @ApiOperation({ summary: '查询部门列表（排除节点）' })
  @ApiQuery({ type: QuerySysDeptDto })
  @ApiResponse({ type: Result<SysDept[]> })
  @RequirePermission('system:dept:query')
  @Get('list/exclude/:deptId')
  async listDeptExcludeChild(@Param('deptId', ParseIntPipe) deptId: number) {
    return Result.ok(await this.deptService.listDeptExcludeChild(deptId));
  }

  @ApiOperation({ summary: '导出部门管理xlsx文件' })
  @RequirePermission('system:dept:export')
  @Get('/export')
  async export(@Res() res: Response): Promise<void> {
    return this.deptService.exportDept(res);
  }

  @ApiOperation({ summary: '查询部门管理详细' })
  @ApiResponse({ type: Result<SysDept> })
  @RequirePermission('system:dept:query')
  @Get('/:deptId')
  async getDept(@Param('deptId', ParseIntPipe) deptId: number) {
    return Result.ok(await this.deptService.selectDeptByDeptId(deptId));
  }

  @ApiOperation({ summary: '新增部门管理' })
  @ApiResponse({ type: Result<SysDept> })
  @ApiBody({ type: CreateSysDeptDto })
  @RequirePermission('system:dept:add')
  @Post('/')
  async addDept(@Body() sysDept: CreateSysDeptDto, @Req() req) {
    sysDept = {
      ...sysDept,
      createTime: nowDateTime(),
      updateTime: nowDateTime(),
      createBy: req.user?.userName,
      updateBy: req.user?.userName,
    };
    return Result.ok(await this.deptService.addDept(sysDept));
  }

  @ApiOperation({ summary: '修改部门管理' })
  @ApiResponse({ type: Result<any> })
  @ApiBody({ type: UpdateSysDeptDto })
  @RequirePermission('system:dept:edit')
  @Put('/')
  async updateDept(@Body() sysDept: UpdateSysDeptDto, @Req() req) {
    sysDept = {
      ...sysDept,
      updateTime: nowDateTime(),
      updateBy: req.user?.userName,
    };
    await this.deptService.updateDept(sysDept);
    return Result.ok('修改成功！');
  }

  @ApiOperation({ summary: '删除部门管理' })
  @ApiResponse({ type: Result<any> })
  @RequirePermission('system:dept:remove')
  @Delete('/:ids')
  async delDept(@Param('ids', ParseIntArrayPipe) deptIds: number[]) {
    const { count } = await this.deptService.deleteDeptByDeptIds(deptIds);
    return Result.toAjax(count);
  }
}
