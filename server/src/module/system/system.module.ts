import { Module } from '@nestjs/common';

import { ConfigController } from './config/config.controller';
import { ConfigService } from './config/config.service';
import { DeptController } from './dept/dept.controller';
import { DeptService } from './dept/dept.service';
import { DictDataController } from './dict-data/dict-data.controller';
import { DictDataService } from './dict-data/dict-data.service';
import { DictTypeController } from './dict-type/dict-type.controller';
import { SysDictTypeService } from './dict-type/dict-type.service';
import { LogininforController } from './logininfor/logininfor.controller';
import { LogininforService } from './logininfor/logininfor.service';

import { MenuController } from './menu/menu.controller';
import { MenuService } from './menu/menu.service';
import { NoticeController } from './notice/notice.controller';
import { NoticeService } from './notice/notice.service';
import { PostController } from './post/post.controller';
import { PostService } from './post/post.service';
import { RoleController } from './role/role.controller';
import { RoleService } from './role/role.service';
import { UserController } from './user/user.controller';
import { UserService } from './user/user.service';

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
    DeptController,
    DictTypeController,
    DictDataController,
    MenuController,
    RoleController,
    UserController,
    PostController,
    NoticeController,
    LogininforController,
    ConfigController,
  ],
})
export class SystemModule {}
