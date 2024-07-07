import { SetMetadata } from '@nestjs/common';

export function RequireRole(role: string) {
  return SetMetadata('role', role);
}
