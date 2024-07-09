<div  align="center">
 <img src="admin/public/nest.svg" alt="68747470733a2f2f6e6573746a732e636f6d2f6c6f676f2d736d616c6c2d6772616469656e742e37363631363430352e737667" style="width: 25%;" />
 <h1>全栈管理系统</h1>
    <h3 >一款基于Nestjs+Vue前后端分离的仿若依后台框架，后端基于carole-admin</h3>
</div>

# 介绍

> 注意，该项目属于fork二次开发，使用需谨慎  
> 原作者 github: https://github.com/Carole007/carole-admin
> 原作者演示地址：[https://carole.top](https://carole.top)

## 当前fork分支路线图

> 当前版本不稳定，请勿上生产环境

- 持续优化代码性能，代码结构，优化若依UI，解耦代码 [持续进行中]
- 添加 DockerFile 和 DockerCompose [已完成]
- 添加基于npx prisma db push，和 seed.ts 的数据库初始化脚本 [已完成]
- 修改ExceptionsFilter、HttpExceptionsFilter，并添加更多的异常处理 [未开始]
- 修改为passport全家桶 [未开始] [待定]
- 从 express 替换至 fastify [未开始] [待定]
- 添加 swc 支持 [已完成]
- 重构若依vue3前端部分，使用geeker admin，整合其他后台框架的有点例如pure admin，vben admin等 [未开始] [待定]
- 密码加密从crypto改为bcrypt，添加Helmet [已完成]
- redis修改为redis模块，redis services [未开始] [待定]
- 从node-xlsx迁移到exceljs [未开始]
- 从直接导入config迁移到@nestjs/config [已完成]
- 优化模板引擎，优化模板 [未开始]
- 重构上传模块 [未开始]
- 添加单元测试 vitest [未开始]
- 进行性能测试 [未开始]
- 投入生产环境 [未开始]

不定期同步ruoyi-vue3和carole-admin的部分更新。

临时文档地址：[https://carole.top/docs](https://carole.top/docs)

docker 快速启动流程
```bash
# /server 目录下
pnpm install

cp .env.example .env

# 修改.env文件中的数据库和redis配置，从localhost切换到docker容器
# 配置现在还有用的镜像，或者开魔法，失败后多试几次
docker-compose up -d

# 运行结束后，执行下面的命令，记得查看docker容器有没有挂，如果挂了尝试重启一下
# 切换到本地数据库，环境变量mysql的，执行，仅数据库初始化，
# docker-compose up后会自动创建数据库，db push会自动执行npx prisma db seed
npx prisma db push

# /admin 目录下
pnpm install

pnpm dev
```
