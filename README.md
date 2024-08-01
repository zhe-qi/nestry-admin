<div  align="center">
 <img src="admin/public/nest.svg" alt="68747470733a2f2f6e6573746a732e636f6d2f6c6f676f2d736d616c6c2d6772616469656e742e37363631363430352e737667" style="width: 25%;" />
 <h1>nestry-admin全栈管理系统</h1>
 <h3 >一款基于Nestjs+Vue前后端分离的仿若依后台框架</h3>
</div>

# 介绍
**该项目长期维护，且永久开源免费**

> !Node.js版本尽量大于等于LTS版本，新版更安全同时性能更好

临时文档地址：[https://zheqi.netlify.app/admin/](https://zheqi.netlify.app/admin/)

## 当前fork分支路线图（不包含第一版发布更改）

> 当前版本快速迭代中，不是很稳定，且更新频繁，请勿上生产环境！！！

进行中的任务代表未完成的任务，很可能包含bug和一部分未完成功能

- 持续优化代码性能，代码结构，优化若依UI，解耦代码 [持续进行中]
- 添加 DockerFile 和 DockerCompose [已完成]
- 添加基于npx prisma db push，和 seed.ts 的数据库初始化脚本 [已完成]
- 添加 swc 和 webpack 支持 [已完成]
- 密码加密从crypto改为bcrypt，从bcrypt改为node自带scrypt，添加Helmet [已完成]
- 从node-xlsx迁移到exceljs [已完成]
- 从直接导入config迁移到@nestjs/config [已完成]
- 重构上传模块 [已完成]
- redis修改为redis模块，redis services [已完成]
- 添加定时任务页面 [已完成]
- 将vm模板改成模板字符串 [已完成]
- 添加定时任务日志页面 [已完成]
- 准备添加 concurrently [已完成]

- 从 mysql 迁移到 postgresql [未开始] [待定]
- 修改为 passport 全家桶 [未开始] [待定]
- 从 express 替换至 fastify [未开始] [待定]
- 添加请求日志 [未开始] [待定]
- 优化模板引擎，优化模板 [未开始]
- 重构前端 admin 部分，使用 geeker、pure、vben 等后台开源框架整合版本 [未开始]
- 添加详细文档 [未开始]
- 添加单元测试 vitest [未开始]
- 进行性能测试 [未开始]
- 投入生产环境 [未开始]

如果有好的想法或者建议，欢迎提出issue，加入到任务队列  

目前版本以混合优先，会参考所有现有nest后台开源项目  

不定期同步ruoyi-vue3和carole-admin的部分更新。  

！！！ 导出excel方法在 controller 不能在最后一个，否则报错，情况未知

定时任务测试案例，添加调用方法为`testJob`，表达式为 `* * * * * *`，可以发现每秒都在执行控制台输出

模板引擎刚迁移到模板字符串后续优化，很有可能有bug

关于代码生成，代码质量不高问题，到时候肯定会优化的  

关于 prisma 迁移造成的重置数据库问题，目前默认执行迁移文件名会带上时间戳，所以不会有问题，否则请使用单调递增命名法，1_migration  

关于 prisma 生成，得益于 postinstall ，在任意端执行 pnpm install 都会执行 npx prisma generate  

关于 monorepo，方便安装和一键启动，不用切换目录，不用开两个命令窗口，仅此而已，项目实际还是分开的

本地快速启动流程
```bash
# 安装最新版 mysql8 和 redis 并运行，建议使用docker安装，docker需要魔法加速，建议使用orbStack，轻量级，速度快

# 以下操作均在根目录执行

# 安装依赖
pnpm install

# prisma 确保有环境变量mysql地址结尾的数据库，使用docker启动自动创建
# 生成表和字段, 生成客户端ts类型和代码, 初始化数据 db push + db seed 等同于 source init.sql
pnpm prisma:init

# 启动，等待项目完全运行后，打开访问前端地址 http://localhost:3001/
pnpm dev
```

> 注意，该项目属于fork二次开发后改动量巨大所以迁移出来，详细可以对比两个项目的代码  
> 原作者 github: https://github.com/Carole007/carole-admin  
> 原作者演示地址：[https://carole.top](https://carole.top)
