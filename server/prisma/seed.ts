import { PrismaClient } from '@prisma/client';
import { genTableColumn, genTableData, jobData, sysConfigData, sysDeptData, sysDictData, sysDictTypeData, sysLogininforData, sysMenuData, sysNoticeData, sysPostData, sysRoleData, sysRoleDeptData, sysRoleMenuData, sysUserData, sysUserPostData, sysUserRoleData } from './data';

const prisma = new PrismaClient();

async function main() {
  // 禁用外键检查
  await prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 0;`;

  const operations = [
    prisma.genTable.createMany({ data: genTableData }),
    prisma.genTableColumn.createMany({ data: genTableColumn }),
    prisma.sysConfig.createMany({ data: sysConfigData }),
    prisma.sysDept.createMany({ data: sysDeptData }),
    prisma.sysDictData.createMany({ data: sysDictData }),
    prisma.sysDictType.createMany({ data: sysDictTypeData }),
    prisma.sysLogininfor.createMany({ data: sysLogininforData }),
    prisma.sysMenu.createMany({ data: sysMenuData }),
    prisma.sysNotice.createMany({ data: sysNoticeData }),
    prisma.sysPost.createMany({ data: sysPostData }),
    prisma.sysRole.createMany({ data: sysRoleData }),
    prisma.sysRoleDept.createMany({ data: sysRoleDeptData }),
    prisma.sysRoleMenu.createMany({ data: sysRoleMenuData }),
    prisma.sysUser.createMany({ data: sysUserData }),
    prisma.sysUserRole.createMany({ data: sysUserRoleData }),
    prisma.sysUserPost.createMany({ data: sysUserPostData }),
    prisma.sysJob.createMany({ data: jobData }),
  ];

  Promise.allSettled(operations).then((results) => {
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`Operation ${index + 1} failed:`, result.reason);
      }
    });
  });

  // 启用外键检查
  await prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 1;`;

  // eslint-disable-next-line no-console
  console.log('Seed data inserted successfully');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
