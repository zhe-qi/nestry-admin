import * as path from 'node:path';

export function configuration() {
  return {
    // HTTP服务监听端口，默认值为3000。
    port: 3000,
    // 应用全局URL前缀。
    contextPath: '/v1',
    swagger: {
      // 控制Swagger文档生成功能是否启用。
      enable: true,
      // Swagger文档的访问路径。
      prefix: '/api',
    },
    http: {
      timeout: 5000,
    },
    captcha: {
      // 验证码生成模式，支持'math'（数学计算）或'text'（文本）。
      mode: 'math',
      // 验证码有效期，单位为秒。
      expiresIn: 60 * 2,
    },
    // API接口限流配置，限制在2分钟内同一接口的请求次数。
    rateLimit: {
      // 限流数据存储方式，支持'redis'或'memory'。
      storage: 'redis',
      // 时间窗口长度，单位为毫秒。
      ttl: 2 * 60 * 1000,
      // 在时间窗口内允许的最大请求次数。
      limit: 60,
    },
    // token配置。
    token: {
      // 用于token生成的加密密钥。
      secret: process.env.tokenSecret,
      // token的有效期，单位为秒。
      expiresIn: 60 * 60 * 24,
    },
    // 数据库连接配置。
    prisma: {
      // 控制是否输出SQL执行日志。
      logEnable: false,
      // 指定输出哪些类型的日志。
      log: ['query', 'info', 'warn', 'error'] as ['query', 'info', 'warn', 'error'],
      // 数据库连接地址。
      DATABASE_URL: process.env.DATABASE_URL,
    },
    // Redis数据库连接配置。
    redis: {
      // Redis服务器地址。
      host: process.env.VITE_REDIS_HOST as string,
      // Redis服务器端口。
      port: 6379,
      // 使用的Redis数据库索引。
      db: 5,
      // Redis连接密码（如果有）。
      password: null,
    },
    // 文件上传配置。
    file: {
      // 是否为本地文件服务或cos。
      isLocal: true,
      // 文件上传后存储目录，相对路径（相对本项目根目录）或绝对路径。
      location: './_upload',
      // 文件上传后查找目录，绝对路径。
      rootPath: path.resolve(__dirname, '../../_upload'),
      // 文件服务器地址，这是开发环境的配置 生产环境请自行配置成可访问域名。
      domain: 'http://localhost:3000',
      // 文件虚拟路径, 必须以 / 开头， 如 http://localhost:8081/static/****.jpg  , 如果不需要则 设置 ''。
      serveRoot: '/_upload',
      // 文件大小限制，单位M。
      maxSize: 10,
    },
    // 代码生成工具配置。
    gen: {
      // 代码作者标识。
      author: 'admin',
      // 默认生成的模块包名。
      packageName: 'admin',
      // 生成代码的子模块目录。
      moduleName: 'system',
      // 是否自动移除表名前缀。
      autoRemovePre: false,
      // 表名前缀列表，生成的类名不会包含这些前缀。
      tablePrefix: ['sys_'],
    },
    // 邮件发送配置。
    mail: {
      // 控制邮件发送功能是否启用。
      enable: false,
      // 发送邮件的超时时间，单位为毫秒。
      timeout: 30 * 1000,
      config: {
        // 邮件服务器地址。
        host: process.env.mailHost,
        // 邮件服务器端口。
        port: 465,
        auth: {
          // 邮件服务器登录用户名。
          user: process.env.mailUser,
          // 邮件服务器登录密码。
          pass: process.env.mailPass,
        },
        // 是否使用安全连接。
        secure: true,
        tls: {
          // 是否拒绝未经授权的服务器证书。
          rejectUnauthorized: false,
        },
      },
    },
    // 腾讯云对象存储服务配置。
    cos: {
      secretId: '',
      secretKey: '',
      bucket: '',
      region: '',
      domain: '',
      location: '',
    },
  };
}
