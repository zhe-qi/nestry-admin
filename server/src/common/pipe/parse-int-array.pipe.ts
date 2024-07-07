import { Injectable, PipeTransform } from '@nestjs/common';
import { ValidationException } from '@/common/exception/validation';

@Injectable()
export class ParseIntArrayPipe implements PipeTransform<string, number[]> {
  transform(value: string): number[] {
    const array = value.split(',').map((item) => {
      const trimmedItem = item.trim();
      if (trimmedItem === '') {
        throw new ValidationException('参数不能为空字符串');
      }
      const parsedNumber = Number.parseInt(trimmedItem, 10);
      if (Number.isNaN(parsedNumber)) {
        throw new ValidationException('参数不正确');
      }
      return parsedNumber;
    });
    return array;
  }
}
