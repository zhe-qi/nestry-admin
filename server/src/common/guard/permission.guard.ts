import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { AuthService } from '@/module/system/auth/auth.service';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private reflector: Reflector, private authService: AuthService) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const req = context.switchToHttp().getRequest();
    const prem = this.reflector.getAllAndOverride('permission', [
      context.getClass(),
      context.getHandler(),
    ]);
    // 不需要鉴权
    if (prem == null) { return true; }
    // 调用鉴权
    return this.authService.hasPermission(prem, req.userId);
  }
}
