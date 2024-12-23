import { ValidationException } from '@/common/exception/validation';
import { AuthorizationFilter, BadRequestFilter, ForbiddenExceptionFilter, GlobalErrorFilter, MulterErrFilter, NotFoundErrFilter, PayloadTooLargeFilter, ThrottlerExceptionFilter, ValidationExceptionFilter } from '@/common/filter/global-error.filter';
import { PermissionGuard } from '@/common/guard/permission.guard';
import { RoleGuard } from '@/common/guard/role.guard';
import { ThrottlerCustomGuard } from '@/common/guard/throttler-custom.guard';
import { RemoveThrottleHeadersInterceptor } from '@/common/interceptors/remove-throttle-headers.interceptor';
import { AuthMiddleware } from '@/common/middleware/auth.middleware';
import { RedisModule } from '@/module/redis';
import { HttpModule } from '@nestjs/axios';
import { MiddlewareConsumer, Module, NestModule, ValidationError, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from 'nestjs-throttler-storage-redis';
import { configuration } from './config/index';
import { AxiosModule } from './module/axios/axios.module';
import { CaptchaModule } from './module/common/captcha/captcha.module';
import { UploadModule } from './module/common/upload/upload.module';
import { GenModule } from './module/gen/gen.module';
import { CacheModule } from './module/monitor/cache/cache.module';
import { OnlineModule } from './module/monitor/online/online.module';
import { ServerModule } from './module/monitor/server/server.module';
import { PrismaModule } from './module/prisma/prisma.module';
import { RedisService } from './module/redis/redis.service';
import { AuthModule } from './module/system/auth/auth.module';
import { SystemModule } from './module/system/system.module';

import '@/common/utils/email';

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      load: [configuration],
      isGlobal: true,
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = new URL(config.get('redis.url'));
        return {
          throttlers: [{ name: 'default', ttl: config.get('rateLimit.ttl'), limit: config.get('rateLimit.limit') }],
          storage: config.get('rateLimit.storage') === 'redis'
            && new ThrottlerStorageRedisService({
              db: config.get('redis.db'),
              host: url.hostname,
              port: Number.parseInt(url.port),
              password: config.get('redis.password'),
              disconnectTimeout: 60 * 5 * 1000,
            }),
        };
      },
    }),
    ServeStaticModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return [{
          rootPath: config.get('file.location'),
          serveRoot: config.get('file.serveRoot'),
        }];
      },
    }),
    RedisModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return {
          type: 'single',
          url: config.get('redis.url'),
          options: {
            ...(config.get('redis.password') ?? {}),
            db: config.get('redis.db') ?? 0,
            disconnectTimeout: 60 * 5 * 1000,
          },
        };
      },
    }),
    ScheduleModule.forRoot(),
    HttpModule,
    AxiosModule,
    CaptchaModule,
    GenModule,
    SystemModule,
    UploadModule,
    PrismaModule,
    AuthModule,
    ServerModule,
    CacheModule,
    OnlineModule,
  ],
  providers: [
    PermissionGuard,
    RoleGuard,
    RedisService,
    {
      provide: APP_PIPE,
      useFactory: () => new ValidationPipe({ whitelist: true, exceptionFactory }),
    },
    { provide: APP_GUARD, useClass: ThrottlerCustomGuard },
    { provide: APP_GUARD, useClass: PermissionGuard },
    { provide: APP_GUARD, useClass: RoleGuard },
    { provide: APP_INTERCEPTOR, useClass: RemoveThrottleHeadersInterceptor },
    { provide: APP_FILTER, useClass: GlobalErrorFilter },
    { provide: APP_FILTER, useClass: BadRequestFilter },
    { provide: APP_FILTER, useClass: ThrottlerExceptionFilter },
    { provide: APP_FILTER, useClass: PayloadTooLargeFilter },
    { provide: APP_FILTER, useClass: AuthorizationFilter },
    { provide: APP_FILTER, useClass: ForbiddenExceptionFilter },
    { provide: APP_FILTER, useClass: ValidationExceptionFilter },
    { provide: APP_FILTER, useClass: MulterErrFilter },
    { provide: APP_FILTER, useClass: NotFoundErrFilter },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).exclude('/login', '/logout', '/captchaImage').forRoutes('*');
  }
}

function exceptionFactory(errors: ValidationError[]) {
  const messages = errors.map(error => Object.values(error.constraints)).flat();
  return new ValidationException(`参数验证失败: ${messages[0]}`);
}
