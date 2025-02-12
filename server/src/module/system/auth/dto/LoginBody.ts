import { IsOptional } from '@/common/decorator/dto-optional-property.decorator';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginBody {
  @IsNotEmpty({ message: '用户名不能为空！' })
  @MinLength(4, { message: '用户名格式不正确' })
  @IsString()
  username: string;

  @IsNotEmpty({ message: '密码不能为空！' })
  @MinLength(5, { message: '密码格式不正确' })
  @IsString()
  password: string;

  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  uuid?: string;
}
