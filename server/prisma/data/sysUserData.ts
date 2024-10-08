import { randomBytes, scryptSync } from 'node:crypto';
import { SysUser } from '@prisma/client';

export const sysUserData: SysUser[] = [
  {
    userId: 1,
    deptId: 103,
    userName: 'admin',
    nickName: 'admin',
    userType: '00',
    email: 'admin@admin.top',
    phonenumber: '18888888888',
    sex: '0',
    avatar: '',
    password: encrypt('123456'),
    status: '1',
    loginIp: '127.0.0.1',
    loginDate: '2023-12-21 15:19:31',
    createBy: 'admin',
    createTime: '2023-12-18 14:59:02',
    updateBy: '',
    updateTime: '2024-01-20 21:49:45',
    remark: '管理员',
  },
  {
    userId: 2,
    deptId: 103,
    userName: 'test',
    nickName: 'test',
    userType: '00',
    email: 'test@admin.top',
    phonenumber: '18888888888',
    sex: '0',
    avatar: '',
    password: encrypt('123456'),
    status: '1',
    loginIp: '127.0.0.1',
    loginDate: '2023-12-21 15:19:31',
    createBy: 'admin',
    createTime: '2024-06-07 16:47:07',
    updateBy: 'admin',
    updateTime: '2024-06-07 17:09:14',
    remark: 'test',
  },
];

function encrypt(str: string) {
  const salt = randomBytes(16).toString('hex');
  const hashedPassword = scryptSync(str, salt, 64).toString('hex');
  return `${salt}$${hashedPassword}`;
}
