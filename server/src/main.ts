import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import gradientString from 'gradient-string';
import helmet from 'helmet';
import { AppModule } from './app.module';
import 'module-alias/register';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const config = app.get(ConfigService);

  app.set('trust proxy', true);
  app.disable('x-powered-by');
  app.setGlobalPrefix(config.get('contextPath') || '/');
  app.enableCors();

  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  await configureSwagger(app, config);

  app.use(helmet({
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
    crossOriginResourcePolicy: false,
  }));

  await app.listen(config.get('port'), () => logInfo(config));

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
    SwaggerModule.setup(`${config.get('contextPath').replace(/\/$/, '')}${config.get('swagger.prefix')}`, app, document);
  }
}

/**
 * 打印欢迎信息
 * @param config ConfigService
 */
function logInfo(config: ConfigService<unknown, boolean>) {
  const welcomeMessage = gradientString('cyan', 'magenta').multiline(`
swagger: ${config.get('swagger.enable') ? `http://localhost:${config.get('port')}${config.get('contextPath')}${config.get('swagger.prefix')}` : 'disabled'}
admin: http://localhost:3001`);

  // eslint-disable-next-line no-console
  console.log(welcomeMessage);
}
