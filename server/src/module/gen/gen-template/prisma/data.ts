export function getPrismaSeedData(data: Record<string, any>) {
  const {
    functionName,
    parentMenuId,
    businessName,
    moduleName,
  } = data;

  const createTime = new Date();
  const updateTime = createTime;

  return `// 使用技巧：放入/server/prisma/data/sysMenu.ts文件中，然后执行pnpm prisma:seed
[
    {
      menu_name: functionName,
      parent_id: ${parentMenuId},
      order_num: 1,
      path: businessName,
      component: ${moduleName}/${businessName}/index,
      is_frame: 0,
      is_cache: 1,
      menu_type: 'C',
      visible: '1',
      status: '1',
      perms: ${moduleName}:${businessName}:list,
      icon: '#',
      create_by: 'admin',
      create_time: ${createTime},
      update_by: '',
      update_time: ${updateTime},
      remark: ${functionName}菜单,
    },
    {
      menu_name: ${functionName}查询,
      parent_id: '@parentId', // This will need to be replaced with the actual parent ID after insertion
      order_num: 1,
      path: '#',
      component: '',
      is_frame: 0,
      is_cache: 1,
      menu_type: 'F',
      visible: '1',
      status: '1',
      perms: ${moduleName}:${businessName}:query,
      icon: '#',
      create_by: 'admin',
      create_time: ${createTime},
      update_by: '',
      update_time: ${updateTime},
      remark: '',
    },
    {
      menu_name: ${functionName}新增,
      parent_id: '@parentId',
      order_num: 2,
      path: '#',
      component: '',
      is_frame: 0,
      is_cache: 1,
      menu_type: 'F',
      visible: '1',
      status: '1',
      perms: ${moduleName}:${businessName}:add,
      icon: '#',
      create_by: 'admin',
      create_time: ${createTime},
      update_by: '',
      update_time: ${updateTime},
      remark: '',
    },
    {
      menu_name: ${functionName}修改,
      parent_id: '@parentId',
      order_num: 3,
      path: '#',
      component: '',
      is_frame: 0,
      is_cache: 1,
      menu_type: 'F',
      visible: '1',
      status: '1',
      perms: ${moduleName}:${businessName}:edit,
      icon: '#',
      create_by: 'admin',
      create_time: ${createTime},
      update_by: '',
      update_time: ${updateTime},
      remark: '',
    },
    {
      menu_name: ${functionName}删除,
      parent_id: '@parentId',
      order_num: 4,
      path: '#',
      component: '',
      is_frame: 0,
      is_cache: 1,
      menu_type: 'F',
      visible: '1',
      status: '1',
      perms: ${moduleName}:${businessName}:remove,
      icon: '#',
      create_by: 'admin',
      create_time: ${createTime},
      update_by: '',
      update_time: ${updateTime},
      remark: '',
    },
    {
      menu_name: ${functionName}导出,
      parent_id: '@parentId',
      order_num: 5,
      path: '#',
      component: '',
      is_frame: 0,
      is_cache: 1,
      menu_type: 'F',
      visible: '1',
      status: '1',
      perms: ${moduleName}:${businessName}:export,
      icon: '#',
      create_by: 'admin',
      create_time: ${createTime},
      update_by: '',
      update_time: ${updateTime},
      remark: '',
    },
  ];`;
}