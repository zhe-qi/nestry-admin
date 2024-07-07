import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional as OptionalIs } from 'class-validator';

/**
 * @description Decorator that makes a property optional
 */
export function IsOptional(): PropertyDecorator {
  return function (target: any, propertyKey: string | symbol) {
    ApiPropertyOptional()(target, propertyKey);
    OptionalIs()(target, propertyKey);
  };
}
