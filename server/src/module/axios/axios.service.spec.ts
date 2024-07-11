import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AxiosService } from './axios.service';

describe('axiosService', () => {
  let service: AxiosService;
  let httpService: HttpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AxiosService,
        {
          provide: HttpService,
          useValue: {
            axiosRef: vi.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AxiosService>(AxiosService);
    httpService = module.get<HttpService>(HttpService);
  });

  it('should return city name for a given IP', async () => {
    const mockData = { data: { addr: '北京市' } };
    vi.spyOn(httpService, 'axiosRef').mockImplementation(() => Promise.resolve(mockData));

    const city = await service.ipToCity('127.0.0.1');
    expect(city).toEqual('北京市');
  });

  it('should return "未知" for an invalid IP', async () => {
    // eslint-disable-next-line unicorn/error-message
    vi.spyOn(httpService, 'axiosRef').mockImplementation(() => Promise.reject(new Error()));

    const city = await service.ipToCity('invalid-ip');
    expect(city).toEqual('未知');
  });
});
