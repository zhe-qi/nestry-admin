import { SetMetadata } from '@nestjs/common';

/**
 * Decorator to require a role to access a route
 */
export function RequireRole(role: string) {
  return SetMetadata('role', role);
}
