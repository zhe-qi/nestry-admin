import { ApiProperty } from '@nestjs/swagger';
import { HttpStatus } from '@nestjs/common';
import { TableDataInfo } from '../domain/table';
import { nowDateTime } from '@/common/utils';

export default class Result<T> {
  @ApiProperty({
    example: 200,
    description: '响应code',
  })
  code: number = HttpStatus.OK;

  @ApiProperty({
    example: true,
    description: '请求是否成功处理',
  })
  success: boolean = true;

  @ApiProperty({
    example: '成功',
    description: '接口备注信息',
  })
  msg: string = '成功';

  @ApiProperty({
    default: null,
    description: '返回数据',
  })
  data: T = null;

  @ApiProperty({
    example: '2024-04-28 22:32:35',
    description: '处理时间',
  })
  time: string | null = null;

  constructor(
    code: number = HttpStatus.OK,
    success: boolean = true,
    msg: string = '成功',
    data: T = null,
  ) {
    this.code = code;
    this.success = success;
    this.msg = msg;
    this.data = data;
    this.time = nowDateTime();
  }

  /**
   * 创建一个表示成功的结果对象（首字母大写）
   * @param data 返回的数据
   * @param msg 返回的消息
   * @returns 返回一个成功的结果对象
   */
  static Ok<K = null>(data: K = null, msg: string = '成功') {
    return new Result<K>(
      HttpStatus.OK,
      true,
      msg,
      data,
    );
  }

  /**
   * 创建一个表示成功的结果对象
   * @param data 返回的数据
   * @param msg 返回的消息
   * @returns 返回一个成功的结果对象
   */
  static ok<K = null>(data: K = null, msg: string = '成功') {
    return new Result<K>(
      HttpStatus.OK,
      true,
      msg,
      data,
    );
  }

  /**
   * 创建一个表示错误的结果对象
   * @param msg 返回的错误消息
   * @param code 返回的HTTP状态码
   * @returns 返回一个错误的结果对象
   */
  static Error(msg: string = 'error', code: number = HttpStatus.INTERNAL_SERVER_ERROR) {
    return new Result(
      code,
      false,
      msg,
      null,
    );
  }

  /**
   * 创建一个表示请求错误的结果对象
   * @param msg 返回的错误消息
   * @returns 返回一个请求错误的结果对象
   */
  static BadRequest(msg: string = 'bad request') {
    return new Result(
      HttpStatus.BAD_REQUEST,
      false,
      msg,
      null,
    );
  }

  /**
   * 创建一个表示未找到资源的结果对象
   * @param msg 返回的错误消息
   * @returns 返回一个未找到资源的结果对象
   */
  static NotFound(msg: string = 'notFound') {
    return Result.Error(msg, HttpStatus.NOT_FOUND);
  }

  /**
   * 创建一个表示未授权的结果对象
   * @param msg 返回的错误消息
   * @returns 返回一个未授权的结果对象
   */
  static Unauthorized(msg: string = '身份校验不通过！') {
    return Result.Error(msg, HttpStatus.UNAUTHORIZED);
  }

  /**
   * 创建一个表示禁止访问的结果对象
   * @param msg 返回的错误消息
   * @returns 返回一个禁止访问的结果对象
   */
  static Forbidden(msg: string = '您没有权限！') {
    return Result.Error(msg, HttpStatus.FORBIDDEN);
  }

  /**
   * 创建一个表示参数验证失败的结果对象
   * @param msg 返回的错误消息
   * @returns 返回一个参数验证失败的结果对象
   */
  static Validation(msg: string = '参数不正确!') {
    return Result.Error(msg, HttpStatus.BAD_REQUEST);
  }

  /**
   * 创建一个表示请求过于频繁的结果对象
   * @param msg 返回的错误消息
   * @returns 返回一个请求过于频繁的结果对象
   */
  static Frequent(msg: string = '您的ip请求过于频繁!') {
    return Result.Error(msg, HttpStatus.TOO_MANY_REQUESTS);
  }

  /**
   * 根据影响的行数创建一个结果对象，用于数据库操作的反馈
   * @param affectRows 影响的行数
   * @returns 返回一个操作成功或失败的结果对象
   */
  static toAjax(affectRows: number) {
    return affectRows > 0
      ? Result.ok(null, '操作成功！')
      : Result.Error('操作失败！');
  }

  /**
   * 创建一个表示表格数据的结果对象
   */
  static TableData<L = any>(data: { rows: L[], total: number }) {
    return new TableDataInfo<L>(
      data.rows,
      data.total,
      HttpStatus.OK,
      '查询成功',
    );
  }
}
