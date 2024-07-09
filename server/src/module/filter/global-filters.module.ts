import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { AuthorizationFilter, BadRequestFilter, ForbiddenExceptionFilter, GlobalErrorFilter, MulterErrFilter, NotFoundErrFilter, PayloadTooLargeFilter, ThrottlerExceptionFilter, ValidationExceptionFilter } from '@/common/filter/global-error.filter';

@Module({
  providers: [
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
export class GlobalFiltersModule {}
