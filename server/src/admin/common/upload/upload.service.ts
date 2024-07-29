import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import iconv from 'iconv-lite';
import COS from 'cos-nodejs-sdk-v5';
import { ChunkFileDto, ChunkMergeFileDto } from './dto/index';
import Result from '@/common/utils/result';
import { PrismaService } from '@/module/common/service/prisma/prisma.service';

@Injectable()
export class UploadService {
  private thunkDir: string;
  private cos = new COS({
    // 必选参数
    SecretId: this.config.get('cos.secretId'),
    SecretKey: this.config.get('cos.secretKey'),
    // 可选参数
    FileParallelLimit: 3, // 控制文件上传并发数
    ChunkParallelLimit: 8, // 控制单个文件下分片上传并发数，在同园区上传可以设置较大的并发数
    ChunkSize: 1024 * 1024 * 8, // 控制分片大小，单位 B，在同园区上传可以设置较大的分片大小
  });

  private isLocal: boolean;
  constructor(private readonly prisma: PrismaService, private config: ConfigService) {
    this.thunkDir = 'thunk';
    this.isLocal = this.config.get('file.isLocal');
  }

  /**
   * 单文件上传
   * @param file
   * @returns
   */
  async singleFileUpload(file: Express.Multer.File) {
    const fileSize = (file.size / 1024 / 1024).toFixed(2);
    if (fileSize > this.config.get('file.maxSize')) {
      return Result.Error(`文件大小不能超过${this.config.get('file.maxSize')}MB`, 500);
    }
    let res;
    if (this.isLocal) {
      res = await this.saveFileLocal(file);
    } else {
      const targetDir = this.config.get('cos.location');
      res = await this.saveFileCos(targetDir, file);
    }
    const uploadId = randomUUID();
    await this.prisma.sysUpload.create({
      data: {
        uploadId,
        ...res,
        ext: path.extname(res.newFileName),
        size: file.size,
      },
    });
    return Result.ok(res);
  }

  /**
   * 获取上传任务Id
   * @returns
   */
  async getChunkUploadId() {
    const uploadId = randomUUID();
    return Result.ok({
      uploadId,
    });
  }

  /**
   * 文件切片上传
   */
  async chunkFileUpload(file: Express.Multer.File, body: ChunkFileDto) {
    const rootPath = process.cwd();
    const baseDirPath = path.join(rootPath, this.config.get('file.location'));
    const chunckDirPath = path.join(
      baseDirPath,
      this.thunkDir,
      body.uploadId,
    );
    if (!fs.existsSync(chunckDirPath)) {
      this.mkdirsSync(chunckDirPath);
    }
    const chunckFilePath = path.join(chunckDirPath, `${body.uploadId}${body.fileName}@${body.index}`);
    if (fs.existsSync(chunckFilePath)) {
      return Result.ok();
    } else {
      fs.writeFileSync(chunckFilePath, file.buffer);
      return Result.ok();
    }
  }

  /**
   * 检查切片是否已上传
   * @param uploadId
   * @param index
   */
  async checkChunkFile(body) {
    const rootPath = process.cwd();
    const baseDirPath = path.join(rootPath, this.config.get('file.location'));
    const chunckDirPath = path.join(
      baseDirPath,
      this.thunkDir,
      body.uploadId,
    );
    const chunckFilePath = path.join(chunckDirPath, `${body.uploadId}${body.fileName}@${body.index}`);
    if (!fs.existsSync(chunckFilePath)) {
      return Result.Error('文件不存在', 500);
    } else {
      return Result.ok();
    }
  }

  /**
   * 递归创建目录 同步方法
   * @param dirname
   * @returns
   */
  mkdirsSync(dirname) {
    if (fs.existsSync(dirname)) {
      return true;
    } else {
      if (this.mkdirsSync(path.dirname(dirname))) {
        fs.mkdirSync(dirname);
        return true;
      }
    }
  }

  /**
   * 文件切片合并
   */
  async chunkMergeFile(body: ChunkMergeFileDto) {
    const { uploadId, fileName } = body;
    const rootPath = process.cwd();
    const baseDirPath = path.join(rootPath, this.config.get('file.location'));
    const sourceFilesDir = path.join(
      baseDirPath,
      this.thunkDir,
      uploadId,
    );

    if (!fs.existsSync(sourceFilesDir)) {
      return Result.Error('文件不存在', 500);
    }

    // 对文件重命名
    const newFileName = this.getNewFileName(fileName);
    const targetFile = path.join(baseDirPath, newFileName);
    await this.thunkStreamMerge(sourceFilesDir, targetFile);
    // 文件相对地址
    const relativeFilePath = targetFile.replace(baseDirPath, '');
    const url = new URL(fileName, this.config.get('file.domain')).toString();
    const key = path.join('test', relativeFilePath);
    const data = {
      fileName: key,
      newFileName,
      url,
    };
    const stats = fs.statSync(targetFile);

    if (!this.isLocal) {
      this.uploadLargeFileCos(targetFile, key);
      data.url = new URL(key, this.config.get('cos.domain')).toString();
      // 写入上传记录
      await this.prisma.sysUpload.create({
        data: {
          uploadId,
          ...data,
          ext: path.extname(data.newFileName),
          size: stats.size,
          status: '0',
        },
      });
      return Result.ok(data);
    }
    await this.prisma.sysUpload.create({
      data: {
        uploadId,
        ...data,
        ext: path.extname(data.newFileName),
        size: stats.size,
      },
    });
    return Result.ok(data);
  }

  /**
   * 文件合并
   * @param {string} sourceFiles 源文件目录
   * @param {string} targetFile 目标文件路径
   */
  async thunkStreamMerge(sourceFilesDir, targetFile) {
    const fileList = fs
      .readdirSync(sourceFilesDir)
      .filter(file => fs.lstatSync(path.join(sourceFilesDir, file)).isFile())
      .sort((a, b) => Number.parseInt(a.split('@')[1]) - Number.parseInt(b.split('@')[1]))
      .map(name => ({
        name,
        filePath: path.join(sourceFilesDir, name),
      }));

    const fileWriteStream = fs.createWriteStream(targetFile);
    let onResolve: (value) => void;
    const callbackPromise = new Promise((resolve) => {
      onResolve = resolve;
    });
    this.thunkStreamMergeProgress(
      fileList,
      fileWriteStream,
      sourceFilesDir,
      onResolve,
    );
    return callbackPromise;
  }

  /**
   * 合并每一个切片
   * @param {Array} fileList 文件数据列表
   * @param {WritableStream} fileWriteStream 最终的写入结果流
   * @param {string} sourceFilesDir 源文件目录
   */
  thunkStreamMergeProgress(
    fileList,
    fileWriteStream,
    sourceFilesDir,
    onResolve,
  ) {
    if (!fileList.length) {
      // 删除临时目录
      fs.rmdirSync(sourceFilesDir, { recursive: true });
      onResolve();
      return;
    }

    const { filePath: chunkFilePath } = fileList.shift();
    const currentReadStream = fs.createReadStream(chunkFilePath);

    // 把结果往最终的生成文件上进行拼接
    currentReadStream.pipe(fileWriteStream, { end: false });

    currentReadStream.on('end', () => {
      // 拼接完之后进入下一次循环
      this.thunkStreamMergeProgress(
        fileList,
        fileWriteStream,
        sourceFilesDir,
        onResolve,
      );
    });
  }

  /**
   * 保存文件到本地
   * @param file
   */
  async saveFileLocal(file: Express.Multer.File) {
    const rootPath = process.cwd();
    // 文件根目录
    const baseDirPath = path.join(rootPath, this.config.get('file.location'));
    // 对文件名转码
    const originalname = iconv.decode(Buffer.from(file.originalname, 'binary'), 'utf8');
    // 重新生成文件名加上时间戳
    const newFileName = this.getNewFileName(originalname);
    // 文件路径
    const targetFile = path.join(baseDirPath, newFileName);
    // 文件目录
    const sourceFilesDir = path.dirname(targetFile);
    // 文件相对地址
    const relativeFilePath = targetFile.replace(baseDirPath, '');

    if (!fs.existsSync(sourceFilesDir)) {
      this.mkdirsSync(sourceFilesDir);
    }
    fs.writeFileSync(targetFile, file.buffer);

    // 文件服务完整路径
    const fileName = path.join(this.config.get('file.serveRoot'), relativeFilePath);
    const url = new URL(fileName, this.config.get('file.domain')).toString();

    return {
      fileName,
      newFileName,
      url,
    };
  }

  /**
   * 生成新的文件名
   * @param originalname
   * @returns
   */
  getNewFileName(originalname: string): string {
    if (!originalname) {
      return originalname;
    }
    const newFileNameArr = originalname.split('.');
    newFileNameArr[newFileNameArr.length - 2] = `${newFileNameArr[newFileNameArr.length - 2]}_${new Date().getTime()}`;
    return newFileNameArr.join('.');
  }

  /**
   *
   * @param targetFile
   * @param file
   * @returns
   */
  async saveFileCos(targetDir: string, file: Express.Multer.File) {
    // 对文件名转码
    const originalname = iconv.decode(Buffer.from(file.originalname, 'binary'), 'utf8');
    // 重新生成文件名加上时间戳
    const newFileName = this.getNewFileName(originalname);
    const targetFile = path.join(targetDir, newFileName);
    await this.uploadCos(targetFile, file.buffer);
    const url = path.join(this.config.get('cos.domain'), targetFile);
    return {
      fileName: targetFile,
      newFileName,
      url,
    };
  }

  /**
   * 普通文件上传cos
   * @param targetFile
   * @param uploadBody
   * @returns
   */
  async uploadCos(targetFile: string, buffer: COS.UploadBody) {
    const { statusCode } = await this.cosHeadObject(targetFile);
    if (statusCode !== 200) {
      // 不存在
      const data = await this.cos.putObject({
        Bucket: this.config.get('cos.bucket'),
        Region: this.config.get('cos.region'),
        Key: targetFile,
        Body: buffer,
      });
      return path.dirname(data.Location);
    }
    return targetFile;
  }

  /**
   * 获取分片上传结果
   * @param uploadId
   * @returns
   */
  async getChunkUploadResult(uploadId: string) {
    const data = await this.prisma.sysUpload.findFirst({
      where: { uploadId },
      select: {
        status: true,
        fileName: true,
        newFileName: true,
        url: true,
      },
    });

    if (data) {
      return Result.ok({
        data,
        msg: data.status === '0' ? '上传成功' : '上传中',
      });
    } else {
      return Result.Error('文件不存在', 500);
    }
  }

  /**
   *  大文件上传cos
   * @param sourceFile
   * @param targetFile
   * @returns
   */
  async uploadLargeFileCos(sourceFile: string, targetFile: string) {
    const { statusCode } = await this.cosHeadObject(targetFile);
    if (statusCode !== 200) {
      // 不存在
      await this.cos.uploadFile({
        Bucket: this.config.get('cos.bucket'),
        Region: this.config.get('cos.region'),
        Key: targetFile,
        FilePath: sourceFile,
        SliceSize: 1024 * 1024 * 5 /* 触发分块上传的阈值，超过5MB使用分块上传，非必须 */,
        onProgress(progressData) {
          /* 非必须 */
          if (progressData.percent === 1) {
            this.sysUploadEntityRep.update({ filName: targetFile }, { status: 0 });
          }
        },
      });
    }
    // 删除本地文件
    fs.unlinkSync(sourceFile);
    return targetFile;
  }

  /**
   * 检查cos资源是否存在
   * @param directory
   * @param key
   * @returns
   */
  async cosHeadObject(targetFile: string) {
    try {
      return await this.cos.headObject({
        Bucket: this.config.get('cos.bucket'),
        Region: this.config.get('cos.region'),
        Key: targetFile,
      });
    } catch (error) {
      return error;
    }
  }

  /**
   * 获取cos授权
   * @returns
   */
  async getAuthorization(Key: string) {
    const authorization = COS.getAuthorization({
      SecretId: this.config.get('cos.secretId'),
      SecretKey: this.config.get('cos.secretKey'),
      Method: 'post',
      Key,
      Expires: 60,
    });
    return Result.ok({
      sign: authorization,
    });
  }
}
