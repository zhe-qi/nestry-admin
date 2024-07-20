import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response } from 'express';
import { Constants } from '@/common/constant/constants';
import { AuthorizationException } from '@/common/exception/authorization';
import { AuthService } from '@/module/system/auth/auth.service';
import { RedisService } from '@/module/redis/redis.service';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private authService: AuthService, private redis: RedisService) {}

  async use(req: Request & { userId: number, token: string, user: any }, _res: Response, next: () => void) {
    const token = this.extractToken(req);
    try {
      const { userId, tokenId } = await this.authService.verifyToken(token);
      await this.validateToken(tokenId, userId);
      const userInfo = await this.getUserInfo(userId);
      req.userId = userId;
      req.token = token;
      req.user = userInfo;
      next();
    } catch {
      throw new AuthorizationException('无效的token！');
    }
  }

  private extractToken(req: Request): string {
    const token = req.headers.authorization;
    if (!token || !token.startsWith('Bearer ')) {
      throw new AuthorizationException('无效的token！');
    }
    return token.slice(7);
  }

  private async validateToken(tokenId: string, _userId: number): Promise<void> {
    const tokenExists = await this.redis.get(Constants.LOGIN_TOKEN_KEY + tokenId);
    if (!tokenExists) {
      throw new AuthorizationException('无效的token！');
    }
  }

  private async getUserInfo(userId: number): Promise<any> {
    const userInfo = await this.redis.get(Constants.LOGIN_CACHE_TOKEN_KEY + userId);
    if (!userInfo) {
      throw new AuthorizationException('无效的token！');
    }
    return JSON.parse(userInfo);
  }
}
