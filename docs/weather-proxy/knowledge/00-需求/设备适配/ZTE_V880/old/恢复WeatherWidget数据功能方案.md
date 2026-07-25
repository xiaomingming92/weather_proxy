# 恢复WeatherWidget数据功能方案 - 第一阶段实施计划

## 目标

构建基于Node.js 24的天气API代理服务，支持HTTP协议，为后续对接WeatherWidget做准备。

## 技术栈

* Node.js 24

* TypeScript

* ES Module

* Express.js

* 和风天气API

## 项目结构

```
weather_proxy/
├── package.json          # 项目配置
├── tsconfig.json         # TypeScript配置
├── vite.config.ts        # 构建配置
├── src/
│   ├── server.ts         # 主服务文件
│   ├── config.ts         # 配置管理
│   ├── routes/
│   │   └── weather.ts    # 路由定义
│   ├── services/
│   │   ├── weather-api.ts    # 和风天气API服务
│   │   ├── data-transform.ts # 数据格式转换
│   │   └── cache.ts          # 缓存服务
│   └── utils/
│       └── index.ts      # 工具函数
├── public/               # 静态文件
├── .env                  # 环境变量
└── README.md             # 项目说明
```

## 实施步骤

### 1. 初始化项目

**创建package.json**：

```json
{
  "name": "weather-proxy",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "NODE_ENV=development tsx watch src/server.ts",
    "build": "tsc",
    "start": "NODE_ENV=production node dist/server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "axios": "^1.6.2",
    "dotenv": "^16.3.1",
    "node-cache": "^5.1.2",
    "xmlbuilder2": "^3.0.2"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^20.10.0",
    "tsx": "^4.6.0",
    "typescript": "^5.3.3"
  }
}
```

**TypeScript配置**：

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "node",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

### 2. 环境配置

**创建.env文件**：

```env
# 开发环境
NODE_ENV=development
PORT=1888
HOST=localhost

# 生产环境
# NODE_ENV=production
# PORT=1888
# HOST=0.0.0.0

# 和风天气API
QWEATHER_API_KEY=your_api_key_here
QWEATHER_PUBLIC_KEY=your_public_key_here

# 缓存配置
CACHE_TTL=3600
```

### 3. 核心功能实现

**配置管理** (`src/config.ts`)：

```typescript
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '1888'),
  host: process.env.HOST || 'localhost',
  qweather: {
    apiKey: process.env.QWEATHER_API_KEY || '',
    publicKey: process.env.QWEATHER_PUBLIC_KEY || ''
  },
  cache: {
    ttl: parseInt(process.env.CACHE_TTL || '3600')
  }
};
```

**主服务** (`src/server.ts`)：

```typescript
import express from 'express';
import { config } from './config';
import weatherRouter from './routes/weather';

const app = express();

// 中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 路由
app.use('/api/weather', weatherRouter);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 启动服务
app.listen(config.port, config.host, () => {
  console.log(`Weather proxy server running on ${config.host}:${config.port}`);
  console.log(`Environment: ${config.env}`);
});
```

**天气API服务** (`src/services/weather-api.ts`)：

```typescript
import axios from 'axios';
import { config } from '../config';

class WeatherApi {
  private baseUrl = 'https://api.qweather.com/v7';
  private apiKey = config.qweather.apiKey;

  async getWeather(cityName: string) {
    try {
      // 1. 获取城市ID
      const cityInfo = await this.getCityId(cityName);
      if (!cityInfo || !cityInfo.location || cityInfo.location.length === 0) {
        throw new Error('City not found');
      }

      const cityId = cityInfo.location[0].id;

      // 2. 获取当前天气
      const nowWeather = await this.getNowWeather(cityId);

      // 3. 获取天气预报
      const forecast = await this.getForecast(cityId);

      return {
        now: nowWeather,
        forecast: forecast,
        city: cityInfo.location[0]
      };
    } catch (error) {
      console.error('Weather API error:', error);
      throw error;
    }
  }

  private async getCityId(cityName: string) {
    const response = await axios.get(`${this.baseUrl}/city/lookup`, {
      params: {
        key: this.apiKey,
        location: cityName
      }
    });
    return response.data;
  }

  private async getNowWeather(cityId: string) {
    const response = await axios.get(`${this.baseUrl}/weather/now`, {
      params: {
        key: this.apiKey,
        location: cityId
      }
    });
    return response.data;
  }

  private async getForecast(cityId: string) {
    const response = await axios.get(`${this.baseUrl}/weather/7d`, {
      params: {
        key: this.apiKey,
        location: cityId
      }
    });
    return response.data;
  }
}

export default new WeatherApi();
```

**数据转换服务** (`src/services/data-transform.ts`)：

```typescript
// 天气代码映射
const weatherCodeMap: Record<string, string> = {
  '100': '0', // 晴
  '101': '1', // 多云
  '102': '2', // 少云
  '103': '3', // 晴间多云
  '104': '4', // 阴
  '150': '5', // 晴
  '151': '6', // 多云
  '152': '7', // 阴
  // 更多映射...
};

class DataTransform {
  toWidgetXml(weatherData: any, dataType: string): string {
    if (dataType === 'ztev3widgetskall' || dataType === 'ztewidgetsk') {
      return this.generateCurrentWeatherXml(weatherData);
    } else if (dataType === 'ztewidgetcf') {
      return this.generateForecastXml(weatherData);
    }
    return '<error>Invalid dataType</error>';
  }

  private generateCurrentWeatherXml(weatherData: any): string {
    const now = weatherData.now;
    const city = weatherData.city;
    
    return `<?xml version="1.0" encoding="utf-8"?>
<weather>
  <city>${city.name}</city>
  <temp>${now.now.temp}</temp>
  <weather>${weatherCodeMap[now.now.icon] || '0'}</weather>
  <reporttime>${now.now.updateTime}</reporttime>
</weather>`;
  }

  private generateForecastXml(weatherData: any): string {
    const forecast = weatherData.forecast;
    const city = weatherData.city;
    
    let forecastXml = `<?xml version="1.0" encoding="utf-8"?>
<weather>
  <city>${city.name}</city>
  <reporttime>${forecast.updateTime}</reporttime>
  <forecast>`;

    // 生成预报数据
    forecast.daily.forEach((day: any, index: number) => {
      if (index < 3) { // 只取3天预报
        forecastXml += `
    <day>
      <date>${day.fxDate}</date>
      <weather>${weatherCodeMap[day.iconDay] || '0'}</weather>
      <temp>${day.tempMax}/${day.tempMin}</temp>
    </day>`;
      }
    });

    forecastXml += `
  </forecast>
</weather>`;
    
    return forecastXml;
  }
}

export default new DataTransform();
```

**缓存服务** (`src/services/cache.ts`)：

```typescript
import NodeCache from 'node-cache';
import { config } from '../config';

class CacheService {
  private cache: NodeCache;

  constructor() {
    this.cache = new NodeCache({ stdTTL: config.cache.ttl });
  }

  get(key: string): any {
    return this.cache.get(key);
  }

  set(key: string, value: any, ttl?: number): boolean {
    return this.cache.set(key, value, ttl || config.cache.ttl);
  }

  delete(key: string): void {
    this.cache.del(key);
  }

  clear(): void {
    this.cache.flushAll();
  }
}

export default new CacheService();
```

**路由** (`src/routes/weather.ts`)：

```typescript
import express from 'express';
import weatherApi from '../services/weather-api';
import dataTransform from '../services/data-transform';
import cache from '../services/cache';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { sname, dataType, code } = req.query;

    if (!sname) {
      return res.status(400).send('<error>Missing sname parameter</error>');
    }

    // 检查缓存
    const cacheKey = `${sname}_${dataType}`;
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      res.set('Content-Type', 'application/xml');
      return res.send(cachedData);
    }

    // 调用和风天气API
    const weatherData = await weatherApi.getWeather(sname as string);

    // 转换数据格式
    const xmlData = dataTransform.toWidgetXml(weatherData, dataType as string);

    // 缓存数据
    cache.set(cacheKey, xmlData);

    res.set('Content-Type', 'application/xml');
    res.send(xmlData);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('<error>Failed to get weather data</error>');
  }
});

export default router;
```

### 4. 部署配置

**Caddy配置**：

```caddyfile
# weather.silktec.site 配置
weather.silktec.site {
  reverse_proxy localhost:3000
  
  # 保持HTTP，不强制HTTPS
  tls off
  
  # 允许CORS
  header {
    Access-Control-Allow-Origin *
    Access-Control-Allow-Methods GET, POST, OPTIONS
    Access-Control-Allow-Headers Content-Type
  }
}
```

**生产环境启动脚本**：

```json
{
  "scripts": {
    "start:prod": "NODE_ENV=production PORT=3000 HOST=0.0.0.0 node dist/server.js"
  }
}
```

### 5. 测试计划

**API测试**：

1. **健康检查**：

   * `curl http://localhost:3000/health`

2. **天气数据测试**：

   * `curl "http://localhost:3000/api/weather?sname=北京&dataType=ztev3widgetskall&code=123456"`

3. **缓存测试**：

   * 多次请求相同城市，验证响应速度

4. **错误处理**：

   * 测试不存在的城市

   * 测试缺少参数

**环境测试**：

1. **开发环境**：`npm run dev`
2. **生产环境**：`npm run build && npm run start:prod`

### 6. 部署步骤

1. **本地构建**：

   * `npm install`

   * `npm run build`

2. **VPS部署**：

   * 复制 `dist` 目录和配置文件到VPS

   * 安装依赖：`npm install --production`

   * 启动服务：`npm run start:prod`

3. **Caddy配置**：

   * 更新Caddy配置文件

   * 重启Caddy服务

4. **域名解析**：

   * 将 `weather.silktec.site` 指向VPS IP

## 技术要点

1. **HTTP协议支持**：

   * 确保所有API调用使用HTTP

   * Caddy配置中禁用HTTPS

2. **ES Module**：

   * 使用 `.mjs` 扩展名或 `type: "module"` 配置

3. **TypeScript**：

   * 提供类型安全

   * 改善代码可维护性

4. **多环境配置**：

   * 开发环境：localhost

   * 生产环境：weather.silktec.site

5. **性能优化**：

   * 实现缓存机制

   * 优化API调用

## 预期成果

* 一个功能完整的天气API代理服务

* 支持HTTP协议，兼容Android 2.2

* 提供与原Widget兼容的XML格式

* 具备缓存机制，提高性能

* 支持多环境部署

此计划专注于第一阶段的API服务构建，为后续对接WeatherWidget和WeatherTV\_V880+做好准备。
