import { AuthService } from '@/module/system/auth/auth.service';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private authService: AuthService, private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const req = context.switchToHttp().getRequest();
    const role = this.reflector.getAllAndOverride('role', [
      context.getClass(),
      context.getHandler(),
    ]);
    // 不需要鉴权
    if (role == null) { return true; }
    // 调用鉴权
    return this.authService.hasRole(role, req.userId);
  }
}
