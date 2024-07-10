import { SetMetadata } from '@nestjs/common';

export const THROTTLE_USER_KEY = 'throttleUser';

/**
 * Decorator to throttle user requests
 */
export function ThrottleUser() {
  return SetMetadata(THROTTLE_USER_KEY, true);
}
