<div  align="center">
 <img src="admin/public/nest.svg" alt="68747470733a2f2f6e6573746a732e636f6d2f6c6f676f2d736d616c6c2d6772616469656e742e37363631363430352e737667" style="width: 25%;" />
 <h1>nestry-admin全栈管理系统</h1>
 <h3 >一款基于Nestjs+Vue前后端分离的仿若依后台框架</h3>
</div>

# 介绍
**该项目长期维护，且永久开源免费**

临时文档地址：[https://zheqi.netlify.app/admin/](https://zheqi.netlify.app/admin/)

## 当前fork分支路线图

> 当前版本快速迭代中，不是很稳定，且更新频繁，请勿上生产环境！！！

- 持续优化代码性能，代码结构，优化若依UI，解耦代码 [持续进行中]
- 添加 DockerFile 和 DockerCompose [已完成]
- 添加基于npx prisma db push，和 seed.ts 的数据库初始化脚本 [已完成]
- 添加 swc 支持 [已完成]
- 密码加密从crypto改为bcrypt，添加Helmet [已完成]
- 从node-xlsx迁移到exceljs [已完成]
- 从直接导入config迁移到@nestjs/config [已完成]
- 重构上传模块 [已完成]
- redis修改为redis模块，redis services [已完成]

- 修改为passport全家桶 [未开始] [待定]
- 从 express 替换至 fastify [未开始] [待定]
- 优化模板引擎，优化模板 [未开始]
- 添加详细文档 [未开始]
- 添加单元测试 vitest [未开始]
- 进行性能测试 [未开始]
- 投入生产环境 [未开始]

如果有好的想法或者建议，欢迎提出issue，加入到任务队列

不定期同步ruoyi-vue3和carole-admin的部分更新。

本地快速启动流程
```bash
# 安装最新版mysql和redis并运行，建议使用docker安装

# /server 目录下

# 安装依赖
pnpm install

# 复制一份环境变量
cp .env.example .env

# prisma 确保有环境变量mysql地址结尾的数据库，使用docker启动自动创建
# 生成表和字段
npx prisma db push
# 生成客户端ts类型和代码
npx prisma generate
# 初始化数据 db push + db seed 等同于 source init.sql
npx prisma db seed

# 基于swc编译ts，比tsc快20倍
pnpm dev

# /admin 目录下

# 安装依赖
pnpm install

# 启动
pnpm dev
```

> 注意，该项目属于fork二次开发后改动量巨大所以迁移出来，详细可以对比两个项目的代码  
> 原作者 github: https://github.com/Carole007/carole-admin  
> 原作者演示地址：[https://carole.top](https://carole.top)
