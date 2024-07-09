import { Module } from '@nestjs/common';

import { ConfigService } from './config/sys-config.service';
import { DeptService } from './dept/dept.service';
import { SysDictTypeService } from './dict-type/dict-type.service';
import { DictDataService } from './dict-data/dict-data.service';
import { MenuService } from './menu/menu.service';
import { RoleService } from './role/role.service';
import { UserService } from './user/user.service';
import { PostService } from './post/post.service';
import { NoticeService } from './notice/notice.service';
import { LogininforService } from './logininfor/logininfor.service';

import { monitorController } from './monitor/monitor.controller';
import { DeptController } from './dept/dept.controller';
import { DictTypeController } from './dict-type/dict-type.controller';
import { DictDataController } from './dict-data/dict-data.controller';
import { MenuController } from './menu/menu.controller';
import { RoleController } from './role/role.controller';
import { UserController } from './user/user.controller';
import { PostController } from './post/post.controller';
import { NoticeController } from './notice/notice.controller';
import { LogininforController } from './logininfor/logininfor.controller';

@Module({
  providers: [
    ConfigService,
    DeptService,
    SysDictTypeService,
    DictDataService,
    MenuService,
    RoleService,
    UserService,
    PostService,
    NoticeService,
    LogininforService,
  ],
  controllers: [
    monitorController,
    DeptController,
    DictTypeController,
    DictDataController,
    MenuController,
    RoleController,
    UserController,
    PostController,
    NoticeController,
    LogininforController,
  ],
})
export class SystemModule {}
