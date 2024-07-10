import { SetMetadata } from '@nestjs/common';

/**
 * Decorator to require a permission to access a route
 */
export function RequirePermission(permission: string) {
  return SetMetadata('permission', permission);
}
