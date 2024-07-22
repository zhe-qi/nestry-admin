import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query, Req, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { SysPost } from '@prisma/client';
import { PostService } from './post.service';
import { CreateSysPostDto, QuerySysPostDto, UpdateSysPostDto } from './dto/index';
import { ParseIntArrayPipe } from '@/common/pipe/parse-int-array.pipe';
import Result from '@/common/utils/result';
import { RequirePermission } from '@/common/decorator/require-premission.decorator';
import { nowDateTime } from '@/common/utils';
import { TableDataInfo } from '@/common/domain/table';

@ApiTags('岗位信息表')
@ApiBearerAuth()
@Controller('system/post')
export class PostController {
  constructor(private postService: PostService) {}

  @ApiOperation({ summary: '查询岗位信息表列表' })
  @ApiQuery({ type: QuerySysPostDto })
  @ApiResponse({ type: TableDataInfo<SysPost> })
  @RequirePermission('system:post:query')
  @Get('/list')
  async listPost(@Query() q: QuerySysPostDto) {
    return Result.TableData(await this.postService.selectPostList(q));
  }

  @ApiOperation({ summary: '导出岗位信息表xlsx文件' })
  @RequirePermission('system:post:export')
  @Get('/export')
  async export(@Res() res: Response): Promise<void> {
    return this.postService.exportPost(res);
  }

  @ApiOperation({ summary: '查询岗位信息表详细' })
  @ApiResponse({ type: Result<SysPost> })
  @RequirePermission('system:post:query')
  @Get('/:postId')
  async getPost(@Param('postId', ParseIntPipe) postId: number) {
    return Result.ok(await this.postService.selectPostByPostId(postId));
  }

  @ApiOperation({ summary: '新增岗位信息表' })
  @ApiResponse({ type: Result<SysPost> })
  @ApiBody({ type: CreateSysPostDto })
  @RequirePermission('system:post:add')
  @Post('/')
  async addPost(@Body() sysPost: CreateSysPostDto, @Req() req) {
    sysPost = {
      ...sysPost,
      createTime: nowDateTime(),
      updateTime: nowDateTime(),
      createBy: req.user?.userName,
      updateBy: req.user?.userName,
    };
    return Result.ok(await this.postService.addPost(sysPost));
  }

  @ApiOperation({ summary: '修改岗位信息表' })
  @ApiResponse({ type: Result<any> })
  @ApiBody({ type: UpdateSysPostDto })
  @RequirePermission('system:post:edit')
  @Put('/')
  async updatePost(@Body() sysPost: UpdateSysPostDto, @Req() req) {
    sysPost = {
      ...sysPost,
      updateTime: nowDateTime(),
      updateBy: req.user?.userName,
    };
    await this.postService.updatePost(sysPost);
    return Result.ok('修改成功！');
  }

  @ApiOperation({ summary: '删除岗位信息表' })
  @ApiResponse({ type: Result<any> })
  @RequirePermission('system:post:remove')
  @Delete('/:ids')
  async delPost(@Param('ids', ParseIntArrayPipe) postIds: number[]) {
    const { count } = await this.postService.deletePostByPostIds(postIds);
    return Result.toAjax(count);
  }
}
