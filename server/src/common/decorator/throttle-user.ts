import { SetMetadata } from '@nestjs/common';

export const THROTTLE_USER_KEY = 'throttleUser';

export function ThrottleUser() {
  return SetMetadata(THROTTLE_USER_KEY, true);
}
