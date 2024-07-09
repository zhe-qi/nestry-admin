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
    token: {
    // 用于token生成的加密密钥。
      secret: process.env.tokenSecret,
      // token的有效期，单位为秒。
      expiresIn: 60 * 60 * 24,
    },
    prisma: {
    // 控制是否输出SQL执行日志。
      logEnable: false,
      // 指定输出哪些类型的日志。
      log: ['query', 'info', 'warn', 'error'] as ['query', 'info', 'warn', 'error'],
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
    upload: {
    // 文件上传的存储基路径，建议设置为绝对路径。
      path: path.resolve(__dirname, '../_data'),
      config: {
        img: {
          fileSize: 2 * 1024 * 1024, // 单个图片文件大小限制。
          files: 1, // 同时上传图片文件的数量限制。
          fieldSize: 0.5 * 1024 * 1024, // 单个表单字段值大小限制。
          fields: 100, // 表单字段数量限制。
          fieldNameSize: 100, // 字段名最大长度。
          parts: 100, // 表单部分数量限制。
          headerPairs: 100, // 表单头部对数量限制。
        },
        file: {
          fileSize: 100 * 1024 * 1024, // 单个文件大小限制。
          files: 10, // 同时上传文件的数量限制。
          fieldSize: 0.5 * 1024 * 1024, // 单个表单字段值大小限制。
          fields: 100, // 表单字段数量限制。
          fieldNameSize: 100, // 字段名最大长度。
          parts: 100, // 表单部分数量限制。
          headerPairs: 100, // 表单头部对数量限制。
        },
      },
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
  };
}
