import { Injectable, PipeTransform } from '@nestjs/common';
import { ValidationException } from '@/common/exception/validation';

@Injectable()
export class ParseIntArrayPipe implements PipeTransform<string, number[]> {
  transform(value: string): number[] {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
      throw new ValidationException('参数不能为空');
    }

    const items = trimmedValue.split(',');
    const numbers = Array.from<number>({ length: items.length });

    for (let i = 0; i < items.length; i++) {
      const parsedNumber = Number.parseInt(items[i].trim(), 10);
      if (Number.isNaN(parsedNumber)) {
        throw new ValidationException('参数不正确');
      }
      numbers[i] = parsedNumber;
    }

    return numbers;
  }
}
