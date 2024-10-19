import { randomUUID } from 'node:crypto';
import { Constants } from '@/common/constant/constants';
import { createMath, createText } from '@/common/utils/captcha';
import Result from '@/common/utils/result';
import { RedisService } from '@/module/redis/redis.service';
import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import CaptchaImageVo from './vo/CaptchaImageVo';

@ApiTags('验证码模块')
@Controller('/captchaImage')
export class CaptchaController {
  constructor(private readonly configService: ConfigService, private readonly redis: RedisService) {}

  @ApiOperation({
    summary: '获取验证码',
  })
  @ApiOkResponse({
    type: CaptchaImageVo,
  })
  @Get()
  @Throttle({
    default: {
      limit: 8,
      ttl: 1000 * 60,
    },
  })
  async getCaptchaImage() {
    const map = {
      math: createMath,
      text: createText,
    };

    // 根据配置的是math还是text自动调用方法生成数据
    const captchaInfo = map[this.configService.get('captcha.mode')]();
    // 是否开启验证码
    const enable = await this.redis.get(`${Constants.SYS_CONFIG_KEY}sys.account.captchaEnabled`);
    const captchaEnabled: boolean = enable == '' ? true : enable === 'true';
    const data = {
      captchaEnabled,
      img: captchaInfo.data,
      uuid: randomUUID(),
    };

    try {
      await this.redis.set(Constants.CAPTCHA_CODE_KEY + data.uuid, captchaInfo.text.toLowerCase(), this.configService.get('captcha.expiresIn'));
      return data;
    } catch {
      return Result.Error('生成验证码错误，请重试');
    }
  }
}
