import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import iconv from 'iconv-lite';

@Injectable()
export class AxiosService {
  constructor(private readonly httpService: HttpService) {}

  async ipToCity(ip: string) {
    try {
      const response = await this.httpService.axiosRef(`https://whois.pconline.com.cn/ipJson.jsp?ip=${ip}&json=true`, {
        responseType: 'arraybuffer',
        transformResponse: [
          function (data) {
            const str = iconv.decode(data, 'gbk');
            return JSON.parse(str);
          },
        ],
      });
      return response.data.addr;
    } catch {
      return '未知';
    }
  }
}
