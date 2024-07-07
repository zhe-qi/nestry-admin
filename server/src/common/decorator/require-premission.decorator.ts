import { SetMetadata } from '@nestjs/common';

export function RequirePermission(permission: string) {
  return SetMetadata('permission', permission);
}
