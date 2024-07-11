import { SysJob } from '@prisma/client';
import * as dayjs from 'dayjs';

export const jobData: SysJob[] = [
  {
    jobId: 1,
    jobName: '系统默认（无参）',
    jobGroup: 'DEFAULT',
    invokeTarget: 'ryTask.ryNoParams',
    cronExpression: '0/10 * * * * ?',
    misfirePolicy: '3',
    concurrent: '1',
    status: '1',
    createBy: 'admin',
    createTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    updateBy: '',
    updateTime: null,
    remark: '',
  },
  {
    jobId: 2,
    jobName: '系统默认（有参）',
    jobGroup: 'DEFAULT',
    invokeTarget: 'ryTask.ryParams(\'ry\')',
    cronExpression: '0/15 * * * * ?',
    misfirePolicy: '3',
    concurrent: '1',
    status: '1',
    createBy: 'admin',
    createTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    updateBy: '',
    updateTime: null,
    remark: '',
  },
  {
    jobId: 3,
    jobName: '系统默认（多参）',
    jobGroup: 'DEFAULT',
    invokeTarget: 'ryTask.ryMultipleParams(\'ry\', true, 2000L, 316.50D, 100)',
    cronExpression: '0/20 * * * * ?',
    misfirePolicy: '3',
    concurrent: '1',
    status: '1',
    createBy: 'admin',
    createTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    updateBy: '',
    updateTime: null,
    remark: '',
  },
];
