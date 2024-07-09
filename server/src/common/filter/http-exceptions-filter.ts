import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import Result from '@/common/utils/result';

@Catch(HttpException)
export class HttpExceptionsFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();
    const message = exceptionResponse?.message ? exception.message : 'Service Error';

    response.status(200).json(Result.Error(message, status));
  }
}
