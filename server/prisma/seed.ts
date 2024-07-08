import { PrismaClient } from '@prisma/client';
import { genTableColumn, genTableData, sysConfigData, sysDeptData, sysDictData, sysDictTypeData, sysLogininforData, sysMenuData, sysNoticeData, sysPostData, sysRoleData, sysRoleDeptData, sysRoleMenuData, sysUserData, sysUserPostData, sysUserRoleData } from './data';

const prisma = new PrismaClient();

async function main() {
  // 禁用外键检查
  await prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 0;`;

  await prisma.genTable.createMany({ data: genTableData });
  await prisma.genTableColumn.createMany({ data: genTableColumn });
  await prisma.sysConfig.createMany({ data: sysConfigData });
  await prisma.sysDept.createMany({ data: sysDeptData });
  await prisma.sysDictData.createMany({ data: sysDictData });
  await prisma.sysDictType.createMany({ data: sysDictTypeData });
  await prisma.sysLogininfor.createMany({ data: sysLogininforData });
  await prisma.sysMenu.createMany({ data: sysMenuData });
  await prisma.sysNotice.createMany({ data: sysNoticeData });
  await prisma.sysPost.createMany({ data: sysPostData });
  await prisma.sysRole.createMany({ data: sysRoleData });
  await prisma.sysRoleDept.createMany({ data: sysRoleDeptData });
  await prisma.sysRoleMenu.createMany({ data: sysRoleMenuData });
  await prisma.sysUser.createMany({ data: sysUserData });
  await prisma.sysUserRole.createMany({ data: sysUserRoleData });
  await prisma.sysUserPost.createMany({ data: sysUserPostData });

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
