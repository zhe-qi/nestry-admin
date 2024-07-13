import { SysUser } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';
import { TableDataInfo } from '@/common/domain/table';

/**
 * vo 的一个示例，效果可以去swagger查看
 *
 * 1. 找到prisma生成的类型，然后ts定位进去
 * 2. 复制到这里，然后让ai根据ts类型一键补齐注释
 * 3. 根据实际情况，删除不需要的字段然后审核一下
 */

export class SysUserVo implements SysUser {
  @ApiProperty({ description: '用户ID' })
  userId: number;

  @ApiProperty({ description: '部门ID', required: false })
  deptId: number | null;

  @ApiProperty({ description: '用户名' })
  userName: string;

  @ApiProperty({ description: '昵称' })
  nickName: string;

  @ApiProperty({ description: '用户类型', required: false })
  userType: string | null;

  @ApiProperty({ description: '电子邮件', required: false })
  email: string | null;

  @ApiProperty({ description: '电话号码', required: false })
  phonenumber: string | null;

  @ApiProperty({ description: '性别', required: false })
  sex: string | null;

  @ApiProperty({ description: '头像', required: false })
  avatar: string | null;

  @ApiProperty({ description: '密码', required: false })
  password: string | null;

  @ApiProperty({ description: '状态', required: false })
  status: string | null;

  @ApiProperty({ description: '最后登录IP', required: false })
  loginIp: string | null;

  @ApiProperty({ description: '最后登录时间', required: false })
  loginDate: string | null;

  @ApiProperty({ description: '创建者', required: false })
  createBy: string | null;

  @ApiProperty({ description: '创建时间', required: false })
  createTime: string | null;

  @ApiProperty({ description: '更新者', required: false })
  updateBy: string | null;

  @ApiProperty({ description: '更新时间', required: false })
  updateTime: string | null;

  @ApiProperty({ description: '备注', required: false })
  remark: string | null;
}

export class SysUserTableDataInfo extends TableDataInfo<SysUserVo> {
  @ApiProperty({
    type: [SysUserVo],
    example: [],
    description: '列表数据',
  })
  rows: SysUserVo[];

  constructor(
    rows: SysUserVo[],
    total: number,
    code?: number,
    msg?: string,
  ) {
    super(
      rows,
      total,
      code,
      msg,
    );
    this.rows = rows;
  }
}
