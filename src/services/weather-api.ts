import axios from 'axios';
import { config } from '../config/index.js';
import { SignJWT, importPKCS8 } from 'jose';
import fs from 'fs';
import { env } from '../config/env.js';
import prismaCache from './prisma-cache.js';
import { WeatherData } from '../types/index.js';

// 定义JWT配置接口
interface JwtConfig {
  kid: string;
  sub: string;
  privateKeyPath: string;
}

// 定义城市信息接口
interface CityInfo {
  id: string;
  name: string;
}

class WeatherApi {
  private baseUrl: string;
  private jwtConfig: JwtConfig;
  private privateKey: string;
  private readonly MAX_RETRIES = 1; // 最大重试次数
  private readonly RETRY_DELAY = 500; // 重试延迟（毫秒）

  constructor() {
    // 构建基础URL，使用配置的API Host
    this.baseUrl = `https://${config.qweather.apiHost}/v7`;
    console.log('Using API Host:', config.qweather.apiHost);

    // 初始化JWT配置
    this.jwtConfig = config.qweather.jwt;
    console.log('JWT Config:', this.jwtConfig);

    // 读取私钥文件
    try {
      const privateKeyPath = env.getPrivateKeyPath();

      this.privateKey = fs.readFileSync(privateKeyPath, 'utf8');
      console.log('Private key loaded successfully');
    } catch (error) {
      console.error('Failed to read private key file:', error);
      throw new Error('Private key file not found or unreadable');
    }
  }

  // 带重试的请求方法
  private async requestWithRetry<T>(
    requestFn: () => Promise<T>,
    validateFn: (data: T) => boolean,
    operationName: string
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        console.log(
          `${operationName} - Attempt ${attempt + 1}/${this.MAX_RETRIES + 1}`
        );
        const result = await requestFn();

        // 检查数据是否完整
        if (validateFn(result)) {
          console.log(`${operationName} - Success on attempt ${attempt + 1}`);
          return result;
        }

        console.log(
          `${operationName} - Invalid data on attempt ${attempt + 1}, retrying...`
        );
      } catch (error) {
        lastError = error as Error;
        console.log(
          `${operationName} - Failed on attempt ${attempt + 1}:`,
          error
        );

        if (attempt < this.MAX_RETRIES) {
          console.log(
            `${operationName} - Waiting ${this.RETRY_DELAY}ms before retry...`
          );
          await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
        }
      }
    }

    throw (
      lastError || new Error(`${operationName} - All retry attempts failed`)
    );
  }

  // 验证实时天气数据是否完整
  private isValidNowWeather(data: any): boolean {
    console.log('实况天气数据:', data);
    const isValid =
      data &&
      data.now &&
      data.now.temp !== undefined &&
      data.now.humidity !== undefined &&
      data.now.pressure !== undefined &&
      data.now.windDir !== undefined &&
      data.now.windSpeed !== undefined &&
      data.now.windScale !== undefined;

    if (!isValid) {
      console.log(
        'Now weather data validation failed:',
        JSON.stringify(data, null, 2)
      );
    }
    return isValid;
  }

  // 生成JWT令牌
  private async generateJWT(): Promise<string> {
    try {
      const privateKey = await importPKCS8(this.privateKey, 'EdDSA');
      const customHeader = {
        alg: 'EdDSA',
        kid: this.jwtConfig.kid,
      };
      const iat = Math.floor(Date.now() / 1000) - 30;
      const exp = iat + 900; // 15分钟过期
      const customPayload = {
        sub: this.jwtConfig.sub,
        iat: iat,
        exp: exp,
      };

      return await new SignJWT(customPayload)
        .setProtectedHeader(customHeader)
        .sign(privateKey);
    } catch (error) {
      console.error('Failed to generate JWT:', error);
      throw new Error('Failed to generate JWT');
    }
  }

  async getWeather(cityName: string): Promise<WeatherData> {
    try {
      console.log('Getting weather for city:', cityName);

      // 1. 获取城市ID
      const cityInfo = await this.getCityId(cityName);
      if (!cityInfo || !cityInfo.location || cityInfo.location.length === 0) {
        throw new Error('City not found');
      }

      const cityId = cityInfo.location[0].id;
      console.log('Found city ID:', cityId);

      // 2. 获取当前天气（带重试）
      const nowWeather = await this.requestWithRetry(
        () => this.getNowWeather(cityId),
        data => this.isValidNowWeather(data),
        'GetNowWeather'
      );

      // 3. 获取天气预报
      const forecast = await this.getForecast(cityId);

      // 4. 获取24小时预报
      const hourlyForecast = await this.getHourlyForecast(cityId);

      // 5. 获取天气指数
      const weatherIndices = await this.getWeatherIndices(cityId);

      // 6. 提取日出日落数据（如果有）
      let sunrise = '';
      let sunset = '';
      if (forecast && forecast.daily && forecast.daily.length > 0) {
        sunrise = forecast.daily[0].sunrise || '';
        sunset = forecast.daily[0].sunset || '';
      }

      console.log('Weather data retrieved successfully');
      return {
        now: nowWeather,
        forecast: forecast,
        hourly: hourlyForecast,
        indices: weatherIndices,
        city: {
          ...cityInfo.location[0],
          sunrise,
          sunset,
        },
      };
    } catch (error) {
      console.error('Weather API error:', error);
      throw error;
    }
  }

  private async getCityId(cityName: string) {
    // 检查缓存
    const cachedCity = await prismaCache.getCityByName(cityName);
    if (cachedCity) {
      console.log('Using cached city ID for:', cityName);
      // 返回与API响应格式相同的对象
      return {
        location: [
          {
            id: cachedCity.cityId,
            name: cachedCity.name,
          },
        ],
      };
    }

    const token = await this.generateJWT();
    // city/lookup API 使用 v2 版本，路径包含 /geo 前缀
    const url = `https://${config.qweather.apiHost}/geo/v2/city/lookup`;
    console.log('Request URL:', url);
    console.log('Request params:', { location: cityName });
    console.log('Request headers:', {
      Authorization: `Bearer ${token.substring(0, 50)}...`, // 只显示前50个字符
      'Accept-Encoding': 'gzip, deflate',
    });

    try {
      const response = await axios.get(url, {
        params: {
          location: cityName,
          lang: 'zh',
        },
        headers: {
          Authorization: `Bearer ${token}`,
          'Accept-Encoding': 'gzip, deflate',
        },
        decompress: true,
        validateStatus: function (status) {
          console.log('Response status:', status);
          return true; // 允许所有状态码
        },
      });

      console.log('Response data:', response.data);

      // 缓存城市信息
      if (response.data.location && response.data.location.length > 0) {
        const cityInfo = response.data.location[0];
        await prismaCache.createCity(cityInfo.name, cityInfo.id);
        console.log('Cached city info for:', cityInfo.name);
      }

      return response.data;
    } catch (error) {
      console.error('Request error:', error);
      if (axios.isAxiosError(error)) {
        console.error('Axios error:', error.response?.data);
        console.error('Status:', error.response?.status);
        console.error('Headers:', error.response?.headers);
        if (error.response?.data && error.response.data.error) {
          console.error('Error details:', error.response.data.error);
          if (error.response.data.error.invalidParams) {
            console.error(
              'Invalid params:',
              error.response.data.error.invalidParams
            );
          }
        }
      }
      throw error;
    }
  }

  private async getNowWeather(cityId: string) {
    const token = await this.generateJWT();
    const url = `${this.baseUrl}/weather/now`;
    console.log('Request URL:', url);
    console.log('Request params:', { location: cityId });
    console.log('Request headers:', {
      Authorization: `Bearer ${token.substring(0, 50)}...`, // 只显示前50个字符
      'Accept-Encoding': 'gzip, deflate',
    });

    try {
      const response = await axios.get(url, {
        params: {
          location: cityId,
          lang: 'zh',
        },
        headers: {
          Authorization: `Bearer ${token}`,
          'Accept-Encoding': 'gzip, deflate',
        },
        decompress: true,
        validateStatus: function (status) {
          console.log('Response status:', status);
          return true; // 允许所有状态码
        },
      });

      console.log('Response data:', response.data);
      return response.data;
    } catch (error) {
      console.error('Request error:', error);
      if (axios.isAxiosError(error)) {
        console.error('Axios error:', error.response?.data);
        console.error('Status:', error.response?.status);
        console.error('Headers:', error.response?.headers);
        if (error.response?.data && error.response.data.error) {
          console.error('Error details:', error.response.data.error);
          if (error.response.data.error.invalidParams) {
            console.error(
              'Invalid params:',
              error.response.data.error.invalidParams
            );
          }
        }
      }
      throw error;
    }
  }

  private async getForecast(cityId: string) {
    const token = await this.generateJWT();
    const url = `${this.baseUrl}/weather/7d`;
    console.log('Request URL:', url);
    console.log('Request params:', { location: cityId });
    console.log('Request headers:', {
      Authorization: `Bearer ${token.substring(0, 50)}...`, // 只显示前50个字符
      'Accept-Encoding': 'gzip, deflate',
    });

    try {
      const response = await axios.get(url, {
        params: {
          location: cityId,
          lang: 'zh',
        },
        headers: {
          Authorization: `Bearer ${token}`,
          'Accept-Encoding': 'gzip, deflate',
        },
        decompress: true,
        validateStatus: function (status) {
          console.log('Response status:', status);
          return true; // 允许所有状态码
        },
      });

      console.log('Response data:', response.data);
      return response.data;
    } catch (error) {
      console.error('Request error:', error);
      if (axios.isAxiosError(error)) {
        console.error('Axios error:', error.response?.data);
        console.error('Status:', error.response?.status);
        console.error('Headers:', error.response?.headers);
        if (error.response?.data && error.response.data.error) {
          console.error('Error details:', error.response.data.error);
          if (error.response.data.error.invalidParams) {
            console.error(
              'Invalid params:',
              error.response.data.error.invalidParams
            );
          }
        }
      }
      throw error;
    }
  }

  private async getHourlyForecast(cityId: string) {
    const token = await this.generateJWT();
    const url = `${this.baseUrl}/weather/24h`;
    console.log('Request URL:', url);
    console.log('Request params:', { location: cityId });
    console.log('Request headers:', {
      Authorization: `Bearer ${token.substring(0, 50)}...`, // 只显示前50个字符
      'Accept-Encoding': 'gzip, deflate',
    });

    try {
      const response = await axios.get(url, {
        params: {
          location: cityId,
          lang: 'zh',
        },
        headers: {
          Authorization: `Bearer ${token}`,
          'Accept-Encoding': 'gzip, deflate',
        },
        decompress: true,
        validateStatus: function (status) {
          console.log('Response status:', status);
          return true; // 允许所有状态码
        },
      });

      console.log('Response data:', response.data);
      return response.data;
    } catch (error) {
      console.error('Request error:', error);
      if (axios.isAxiosError(error)) {
        console.error('Axios error:', error.response?.data);
        console.error('Status:', error.response?.status);
        console.error('Headers:', error.response?.headers);
        if (error.response?.data && error.response.data.error) {
          console.error('Error details:', error.response.data.error);
          if (error.response.data.error.invalidParams) {
            console.error(
              'Invalid params:',
              error.response.data.error.invalidParams
            );
          }
        }
      }
      throw error;
    }
  }

  private async getWeatherIndices(cityId: string) {
    const token = await this.generateJWT();
    const url = `${this.baseUrl}/indices/1d`;
    console.log('Request URL:', url);
    console.log('Request params:', { location: cityId });
    console.log('Request headers:', {
      Authorization: `Bearer ${token.substring(0, 50)}...`, // 只显示前50个字符
      'Accept-Encoding': 'gzip, deflate',
    });

    try {
      const response = await axios.get(url, {
        params: {
          location: cityId,
          lang: 'zh',
          type: '1,2,3,5,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25',
        },
        headers: {
          Authorization: `Bearer ${token}`,
          'Accept-Encoding': 'gzip, deflate',
        },
        decompress: true,
        validateStatus: function (status) {
          console.log('Response status:', status);
          return true; // 允许所有状态码
        },
      });

      console.log('Response data:', response.data);
      return response.data;
    } catch (error) {
      console.error('Request error:', error);
      if (axios.isAxiosError(error)) {
        console.error('Axios error:', error.response?.data);
        console.error('Status:', error.response?.status);
        console.error('Headers:', error.response?.headers);
        if (error.response?.data && error.response.data.error) {
          console.error('Error details:', error.response.data.error);
          if (error.response.data.error.invalidParams) {
            console.error(
              'Invalid params:',
              error.response.data.error.invalidParams
            );
          }
        }
      }
      throw error;
    }
  }
}

export default new WeatherApi();
