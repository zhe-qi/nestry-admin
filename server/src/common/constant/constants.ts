/**
 * 通用常量信息
 */
export enum Constants {
  /* UTF-8 字符集 */
  UTF8 = 'UTF-8',

  /* GBK 字符集 */
  GBK = 'GBK',

  /* http请求 */
  HTTP = 'http://',

  /* https请求 */
  HTTPS = 'https://',

  /* 通用成功标识 */
  SUCCESS = '0',

  /* 通用失败标识 */
  FAIL = '1',

  /* 登录成功 */
  LOGIN_SUCCESS = 'Success',

  /* 注销 */
  LOGOUT = 'Logout',

  /* 登录失败 */
  LOGIN_FAIL = 'Error',

  /* 验证码 redis key */
  CAPTCHA_CODE_KEY = 'captcha_codes:',

  /* 登录用户 redis key */
  LOGIN_TOKEN_KEY = 'login_tokens:',

  /* 缓存用户信息 redis key */
  LOGIN_CACHE_TOKEN_KEY = 'login_cache_tokens:',

  /* 防重提交 redis key */
  REPEAT_SUBMIT_KEY = 'repeat_submit:',

  /* 验证码有效期（分钟） */
  CAPTCHA_EXPIRATION = '2',

  /* 令牌 */
  TOKEN = 'token',

  /* 令牌前缀 */
  TOKEN_PREFIX = 'Bearer ',

  /* 登录用户 key */
  LOGIN_USER_KEY = 'login_user_key',

  /* 用户ID */
  JWT_USERID = 'userid',

  /* 用户名称 */
  JWT_USERNAME = 'sub',

  /* 用户头像 */
  JWT_AVATAR = 'avatar',

  /* 创建时间 */
  JWT_CREATED = 'created',

  /* 参数管理 cache key */
  SYS_CONFIG_KEY = 'sys_config:',

  /* 字典管理 cache key */
  SYS_DICT_KEY = 'sys_dict:',

  /* 文件访问前缀 */
  FILE_PREFIX = '/upload',
}
