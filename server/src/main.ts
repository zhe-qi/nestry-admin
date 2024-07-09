import 'module-alias/register';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

declare const module: any;

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const config = app.get(ConfigService);

  app.set('trust proxy', true);
  app.disable('x-powered-by');
  app.setGlobalPrefix(config.get('contextPath') || '/');
  app.enableCors();

  // web 安全，防常见漏洞
  // 注意： 开发环境如果开启 nest static module 需要将 crossOriginResourcePolicy 设置为 false 否则 静态资源 跨域不可访问
  app.use(helmet({ crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' }, crossOriginResourcePolicy: false }));

  await configureStaticAssets(app, config);
  await configureSwagger(app, config);

  await app.listen(config.get('port'));

  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());

    // eslint-disable-next-line no-console
    console.log(`Server is running at http://localhost:${config.get('port')}`);
  }
}

bootstrap();

/**
 * 配置Swagger
 * @param app NestExpressApplication
 */
async function configureSwagger(app: NestExpressApplication, config: ConfigService) {
  if (config.get('swagger.enable')) {
    const options = new DocumentBuilder()
      .setTitle('全栈后台管理系统接口文档')
      .setDescription('全栈后台管理系统接口文档')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, options);
    SwaggerModule.setup(
      `${config.get('contextPath').replace(/\/$/, '')}${config.get('swagger.prefix')}`,
      app,
      document,
    );
  }
}

/**
 * 配置静态资源
 * @param app NestExpressApplication
 */
async function configureStaticAssets(app: NestExpressApplication, config: ConfigService) {
  const staticConfig = {
    prefix: `${config.get('contextPath').replace(/\/$/, '')}/file`,
    maxAge: 86400000 * 365, // 1 year
  };
  app.useStaticAssets(config.get('upload.path'), staticConfig);
}
