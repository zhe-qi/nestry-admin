import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response } from 'express';
import { Constants } from '@/common/constant/constants';
import { AuthorizationException } from '@/common/exception/authorization';
import { AuthService } from '@/module/common/auth/auth.service';
import { redisUtils } from '@/common/utils/redisUtils';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private authService: AuthService) {}

  async use(
    req: Request & { userId: number, token: string, user: any },
    res: Response,
    next: () => void,
  ) {
    const token = this.extractToken(req);
    try {
      const { userId, tokenId } = await this.verifyToken(token);
      await this.validateToken(tokenId, userId);
      const userInfo = await this.getUserInfo(userId);
      this.assignRequestProperties(
        req,
        userId,
        token,
        userInfo,
      );
      next();
    } catch (error) {
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

  private async verifyToken(token: string): Promise<{ userId: number, tokenId: string }> {
    return this.authService.verifyToken(token) as Promise<{ userId: number, tokenId: string }>;
  }

  private async validateToken(tokenId: string, _userId: number): Promise<void> {
    const tokenExists = await redisUtils.get(Constants.LOGIN_TOKEN_KEY + tokenId);
    if (!tokenExists) {
      throw new AuthorizationException('无效的token！');
    }
  }

  private async getUserInfo(userId: number): Promise<any> {
    const userInfo = await redisUtils.get(Constants.LOGIN_CACHE_TOKEN_KEY + userId);
    if (!userInfo) {
      throw new AuthorizationException('无效的token！');
    }
    return JSON.parse(userInfo);
  }

  private assignRequestProperties(
    req: Request & { userId: number, token: string, user: any },
    userId: number,
    token: string,
    userInfo: any,
  ): void {
    req.userId = userId;
    req.token = token;
    req.user = userInfo;
  }
}
