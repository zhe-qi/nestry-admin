import { Body, Controller, Get, HttpCode, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { UploadService } from './upload.service';
import { ChunkFileDto, ChunkMergeFileDto, FileUploadDto, uploadIdDto } from './dto/index';

@ApiTags('通用-文件上传')
@Controller('common/upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @HttpCode(200)
  @ApiOperation({ summary: '文件上传' })
  @UseInterceptors(FileInterceptor('file'))
  @ApiBody({ type: FileUploadDto, required: true })
  singleFileUpload(@UploadedFile() file: Express.Multer.File) {
    return this.uploadService.singleFileUpload(file);
  }

  @ApiOperation({ summary: '获取切片上传任务Id' })
  @ApiBody({ required: true })
  @HttpCode(200)
  @Get('/chunk/uploadId')
  getChunkUploadId() {
    return this.uploadService.getChunkUploadId();
  }

  @ApiOperation({ summary: '文件切片上传' })
  @ApiBody({ required: true })
  @HttpCode(200)
  @Post('/chunk')
  @UseInterceptors(FileInterceptor('file'))
  chunkFileUpload(@UploadedFile() file: Express.Multer.File, @Body() body: ChunkFileDto) {
    return this.uploadService.chunkFileUpload(file, body);
  }

  @ApiOperation({ summary: '合并切片' })
  @ApiBody({ type: ChunkMergeFileDto, required: true })
  @HttpCode(200)
  @Post('/chunk/merge')
  chunkMergeFile(@Body() body: ChunkMergeFileDto) {
    return this.uploadService.chunkMergeFile(body);
  }

  @ApiOperation({ summary: '获取切片上传结果' })
  @ApiQuery({ type: uploadIdDto, required: true })
  @HttpCode(200)
  @Get('/chunk/result')
  getChunkUploadResult(@Query() query: { uploadId: string }) {
    return this.uploadService.getChunkUploadResult(query.uploadId);
  }

  @ApiOperation({ summary: '获取cos上传密钥' })
  @ApiBody({ required: true })
  @Get('/cos/authorization')
  getAuthorization(@Query() query: { key: string }) {
    return this.uploadService.getAuthorization(query.key);
  }
}
