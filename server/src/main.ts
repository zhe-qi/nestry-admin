import 'module-alias/register';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { Config } from '@/config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.set('trust proxy', true);
  app.disable('x-powered-by');
  app.setGlobalPrefix(Config.contextPath || '/');
  app.enableCors();

  // web 安全，防常见漏洞
  // 注意： 开发环境如果开启 nest static module 需要将 crossOriginResourcePolicy 设置为 false 否则 静态资源 跨域不可访问
  app.use(helmet({ crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' }, crossOriginResourcePolicy: false }));

  await configureStaticAssets(app);
  await configureSwagger(app);

  await app.listen(Config.port);
  // eslint-disable-next-line no-console
  console.log(`Server is running at http://localhost:${Config.port}`);
}

bootstrap();

/**
 * 配置Swagger
 * @param app NestExpressApplication
 */
async function configureSwagger(app: NestExpressApplication) {
  if (Config.swagger.enable) {
    const options = new DocumentBuilder()
      .setTitle('全栈后台管理系统接口文档')
      .setDescription('全栈后台管理系统接口文档')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, options);
    SwaggerModule.setup(
      `${Config.contextPath.replace(/\/$/, '')}${Config.swagger.prefix}`,
      app,
      document,
    );
  }
}

/**
 * 配置静态资源
 * @param app NestExpressApplication
 */
async function configureStaticAssets(app: NestExpressApplication) {
  const staticConfig = {
    prefix: `${Config.contextPath.replace(/\/$/, '')}/file`,
    maxAge: 86400000 * 365, // 1 year
  };
  app.useStaticAssets(Config.upload.path, staticConfig);
}
