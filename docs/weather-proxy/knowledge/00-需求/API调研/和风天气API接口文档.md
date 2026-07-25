# 和风天气 API 接口文档

## 官方文档地址
- **开发平台**: https://dev.qweather.com/
- **API文档**: https://dev.qweather.com/docs/api/

## 接口基础信息

### 基础URL
```
https://devapi.qweather.com/v7          # 开发版（免费）
https://api.qweather.com/v7             # 商业版
https://geoapi.qweather.com/v2          # 地理信息API
```

### 认证方式
```
请求头: Authorization: Bearer {your_token}
或
查询参数: key={your_api_key}
```

---

## 1. 实时天气 API

### 接口地址
```
GET /v7/weather/now
```

### 请求参数

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| location | string | ✓ | LocationID 或 经度,纬度（如：101010100 或 116.41,39.92） |
| lang | string | ✗ | 多语言，默认中文 |
| unit | string | ✗ | 单位：m=公制（默认），i=英制 |

### 请求示例
```bash
curl -X GET --compressed \
  -H 'Authorization: Bearer your_token' \
  'https://devapi.qweather.com/v7/weather/now?location=101010100'
```

### 响应示例
```json
{
  "code": "200",
  "updateTime": "2020-06-30T22:00+08:00",
  "fxLink": "http://hfx.link/2ax1",
  "now": {
    "obsTime": "2020-06-30T21:40+08:00",
    "temp": "24",
    "feelsLike": "26",
    "icon": "101",
    "text": "多云",
    "wind360": "123",
    "windDir": "东南风",
    "windScale": "1",
    "windSpeed": "3",
    "humidity": "72",
    "precip": "0.0",
    "pressure": "1003",
    "vis": "16",
    "cloud": "10",
    "dew": "21"
  },
  "refer": {
    "sources": ["QWeather", "NMC", "ECMWF"],
    "license": ["QWeather Developers License"]
  }
}
```

### 字段说明

| 字段 | 说明 |
|------|------|
| now.temp | 温度，摄氏度 |
| now.feelsLike | 体感温度 |
| now.icon | 天气图标代码 |
| now.text | 天气描述 |
| now.windDir | 风向 |
| now.windScale | 风力等级 |
| now.windSpeed | 风速，公里/小时 |
| now.humidity | 相对湿度，% |
| now.pressure | 大气压强，百帕 |
| now.vis | 能见度，公里 |

---

## 2. 每日天气预报 API

### 接口地址
```
GET /v7/weather/{days}
```

### 路径参数

| 参数 | 说明 |
|------|------|
| days | 预报天数：3d, 7d, 10d, 15d, 30d |

### 查询参数

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| location | string | ✓ | LocationID 或 经纬度 |
| lang | string | ✗ | 多语言 |
| unit | string | ✗ | 单位 |

### 请求示例
```bash
curl -X GET --compressed \
  -H 'Authorization: Bearer your_token' \
  'https://devapi.qweather.com/v7/weather/7d?location=101010100'
```

### 响应示例
```json
{
  "code": "200",
  "updateTime": "2021-11-15T16:35+08:00",
  "fxLink": "http://hfx.link/2ax1",
  "daily": [
    {
      "fxDate": "2021-11-15",
      "sunrise": "06:58",
      "sunset": "16:59",
      "tempMax": "12",
      "tempMin": "-1",
      "iconDay": "101",
      "textDay": "多云",
      "iconNight": "150",
      "textNight": "晴",
      "windDirDay": "东北风",
      "windScaleDay": "1-2",
      "windSpeedDay": "3",
      "humidity": "65",
      "pressure": "1020",
      "vis": "25",
      "uvIndex": "3"
    }
  ],
  "refer": {
    "sources": ["QWeather", "NMC", "ECMWF"],
    "license": ["QWeather Developers License"]
  }
}
```

### 字段说明

| 字段 | 说明 |
|------|------|
| daily.fxDate | 预报日期 |
| daily.tempMax | 最高温度 |
| daily.tempMin | 最低温度 |
| daily.iconDay | 白天天气图标 |
| daily.textDay | 白天天气描述 |
| daily.iconNight | 夜间天气图标 |
| daily.textNight | 夜间天气描述 |
| daily.windDirDay | 白天风向 |
| daily.windScaleDay | 白天风力等级 |
| daily.humidity | 相对湿度 |

---

## 3. 城市搜索 API (GeoAPI)

### 接口地址
```
GET /v2/city/lookup
```

### 请求参数

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| location | string | ✓ | 城市名、LocationID 或 经纬度 |
| adm | string | ✗ | 上级行政区划（如：省名） |
| range | string | ✗ | 搜索范围：cn=中国，world=全球 |
| number | int | ✗ | 返回数量，默认10，最大20 |
| lang | string | ✗ | 多语言 |

### 请求示例
```bash
# 按城市名搜索
curl -X GET \
  'https://geoapi.qweather.com/v2/city/lookup?location=北京&key=your_key'

# 按经纬度搜索
curl -X GET \
  'https://geoapi.qweather.com/v2/city/lookup?location=116.41,39.92&key=your_key'
```

### 响应示例
```json
{
  "code": "200",
  "location": [
    {
      "name": "北京",
      "id": "101010100",
      "lat": "39.90499",
      "lon": "116.40529",
      "adm2": "北京",
      "adm1": "北京市",
      "country": "中国",
      "tz": "Asia/Shanghai",
      "utcOffset": "+08:00",
      "isDst": "0",
      "type": "city",
      "rank": "10",
      "fxLink": "http://hfx.link/2ax1"
    }
  ],
  "refer": {
    "sources": ["QWeather"],
    "license": ["QWeather Developers License"]
  }
}
```

### 字段说明

| 字段 | 说明 |
|------|------|
| location.name | 城市名称 |
| location.id | LocationID（天气查询用） |
| location.lat | 纬度 |
| location.lon | 经度 |
| location.adm1 | 一级行政区（省/州） |
| location.adm2 | 二级行政区（市/区） |
| location.country | 国家 |

---

## 4. 天气图标代码对照表

| 代码 | 中文描述 | 英文描述 |
|------|----------|----------|
| 100 | 晴 | Sunny/Clear |
| 101 | 多云 | Cloudy |
| 102 | 少云 | Few Clouds |
| 103 | 晴间多云 | Partly Cloudy |
| 104 | 阴 | Overcast |
| 150 | 晴（夜间） | Clear |
| 151 | 多云（夜间） | Cloudy |
| 152 | 少云（夜间） | Few Clouds |
| 153 | 晴间多云（夜间） | Partly Cloudy |
| 300 | 阵雨 | Shower Rain |
| 301 | 强阵雨 | Heavy Shower Rain |
| 302 | 雷阵雨 | Thundershower |
| 303 | 强雷阵雨 | Heavy Thunderstorm |
| 304 | 雷阵雨伴有冰雹 | Hail |
| 305 | 小雨 | Light Rain |
| 306 | 中雨 | Moderate Rain |
| 307 | 大雨 | Heavy Rain |
| 308 | 极端降雨 | Extreme Rain |
| 309 | 毛毛雨 | Drizzle Rain |
| 310 | 暴雨 | Storm |
| 311 | 大暴雨 | Heavy Storm |
| 312 | 特大暴雨 | Severe Storm |
| 313 | 冻雨 | Freezing Rain |
| 400 | 小雪 | Light Snow |
| 401 | 中雪 | Moderate Snow |
| 402 | 大雪 | Heavy Snow |
| 403 | 暴雪 | Snowstorm |
| 404 | 雨夹雪 | Sleet |
| 405 | 雨雪天气 | Rain And Snow |
| 406 | 阵雨夹雪 | Shower Snow |
| 407 | 阵雪 | Snow Flurry |
| 500 | 薄雾 | Mist |
| 501 | 雾 | Foggy |
| 502 | 霾 | Haze |
| 503 | 浓雾 | Moderate Fog |
| 504 | 强浓雾 | Dense Fog |
| 507 | 中度霾 | Moderate Haze |
| 508 | 重度霾 | Severe Haze |
| 509 | 严重霾 | Severe Haze |
| 510 | 大雾 | Heavy Fog |
| 511 | 特强浓雾 | Extra Heavy Fog |
| 512 | 霾（夜间） | Haze |
| 513 | 霾（白天） | Haze |
| 514 | 雾（夜间） | Foggy |
| 515 | 雾（白天） | Foggy |
| 800 | 浮尘 | Dust |
| 801 | 扬沙 | Sand |
| 802 | 沙尘暴 | Duststorm |
| 803 | 强沙尘暴 | Sandstorm |
| 804 | 龙卷风 | Tornado |
| 805 | 雾凇 | Foggy |
| 806 | 雨凇 | Freezing Rain |
| 807 | 沙尘 | Dust |

---

## 5. 状态码说明

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 204 | 请求成功，但查询的地区没有数据 |
| 400 | 请求错误，可能包含错误的请求参数或缺少必要的参数 |
| 401 | 认证失败，可能使用了错误的KEY、数字签名错误或KEY已过期 |
| 402 | 超过访问次数或余额不足以支持继续访问服务 |
| 403 | 无访问权限，可能是绑定的PackageName、BundleID、域名IP地址不一致 |
| 404 | 查询的数据或地区不存在 |
| 429 | 超过限定的QPM（每分钟访问次数） |
| 500 | 无响应或超时，接口服务异常 |

---

## 6. 使用建议

### 6.1 缓存策略
- 实时天气：缓存 10-30 分钟
- 预报数据：缓存 1-4 小时
- 城市信息：长期缓存（变化较少）

### 6.2 错误处理
```javascript
if (response.code === '200') {
  // 处理正常数据
} else if (response.code === '204') {
  // 地区无数据
} else {
  // 其他错误，记录日志
  console.error('QWeather API Error:', response.code);
}
```

### 6.3 注意事项
1. 免费版有访问次数限制（QPM）
2. 实时数据有 5-20 分钟延迟
3. 响应数据使用 Gzip 压缩
4. 海外城市需要申请权限

---

## 7. 在 weather_proxy 中的使用

### 7.1 现有集成
项目已集成和风天气API，主要使用以下接口：
- `v7/weather/now` - 实时天气
- `v7/weather/7d` - 7天预报
- `v2/city/lookup` - 城市搜索

### 7.2 配置方式
```typescript
// src/services/weather-api.ts
const QWEATHER_API_KEY = process.env.QWEATHER_API_KEY;
const QWEATHER_BASE_URL = 'https://devapi.qweather.com/v7';
const QWEATHER_GEO_URL = 'https://geoapi.qweather.com/v2';
```

### 7.3 调用示例
```typescript
// 获取实时天气
const now = await getWeatherNow('101010100');

// 获取7天预报
const forecast = await getWeather7d('101010100');

// 搜索城市
const cities = await searchCity('北京');
```
