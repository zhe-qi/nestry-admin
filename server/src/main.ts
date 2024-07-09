import 'module-alias/register';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ExceptionsFilter } from '@/common/filter/exceptions-filter';
import { HttpExceptionsFilter } from '@/common/filter/http-exceptions-filter';

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

  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.useGlobalFilters(new ExceptionsFilter());
  app.useGlobalFilters(new HttpExceptionsFilter());

  await configureSwagger(app, config);

  await app.listen(config.get('port'));

  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
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
      .setTitle('全栈管理系统接口文档')
      .setDescription('全栈管理系统接口文档')
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
