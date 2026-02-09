import axios from 'axios';
import { config } from '../config/index.js';
import { SignJWT, importPKCS8 } from 'jose';
import fs from 'fs';
import { env } from '../config/env.js';
import prismaCache from './prisma-cache.js';

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

// 定义天气数据接口
interface WeatherData {
  now: any;
  forecast: any;
  city: CityInfo;
}

class WeatherApi {
  private baseUrl: string;
  private jwtConfig: JwtConfig;
  private privateKey: string;

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

      // 2. 获取当前天气
      const nowWeather = await this.getNowWeather(cityId);

      // 3. 获取天气预报
      const forecast = await this.getForecast(cityId);

      console.log('Weather data retrieved successfully');
      return {
        now: nowWeather,
        forecast: forecast,
        city: cityInfo.location[0],
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
}

export default new WeatherApi();
