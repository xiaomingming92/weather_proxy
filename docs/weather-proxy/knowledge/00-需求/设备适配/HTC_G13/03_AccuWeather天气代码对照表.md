# AccuWeather天气代码对照表

## 说明

### 数据来源声明

**重要：本文档中的AccuWeather天气代码来源于以下途径：**

1. **AccuWeather官方API文档**（主要来源）
   - 来源：https://developer.accuweather.com/
   - 内容：官方公布的天气状况代码（Weather Condition Codes）

2. **公开技术资料**（辅助验证）
   - 来源：开发者社区、技术博客、开源项目
   - 用途：验证和补充官方文档

3. **HTC ROM二进制分析**（辅助参考）
   - 方法：从`Weather.odex`提取字符串常量
   - 用途：确认HTC使用的AccuWeather代码范围
   - **注意：这不是逆向工程，仅提取公开的字符串常量**

### 映射逻辑说明

本文档用于和风天气(QWeather)到AccuWeather的代码映射，基于以下原则：
- 天气状况语义匹配（如：晴→Sunny）
- 图标显示一致性
- 行业标准对照

## AccuWeather天气代码表

| 代码 | 英文描述 | 中文描述 | 图标类型 |
|------|---------|---------|---------|
| 1 | Sunny | 晴 | ☀️ |
| 2 | Mostly Sunny | 大部晴朗 | 🌤️ |
| 3 | Partly Sunny | 局部晴朗 | ⛅ |
| 4 | Intermittent Clouds | 间歇多云 | 🌥️ |
| 5 | Hazy Sunshine | 朦胧阳光 | 🌫️☀️ |
| 6 | Mostly Cloudy | 大部多云 | ☁️ |
| 7 | Cloudy | 多云 | ☁️ |
| 8 | Dreary (Overcast) | 阴沉（阴天） | 🌫️ |
| 11 | Fog | 雾 | 🌫️ |
| 12 | Showers | 阵雨 | 🌦️ |
| 13 | Mostly Cloudy w/ Showers | 大部多云有阵雨 | 🌦️☁️ |
| 14 | Partly Sunny w/ Showers | 局部晴朗有阵雨 | 🌦️⛅ |
| 15 | Thunderstorms | 雷暴 | ⛈️ |
| 16 | Mostly Cloudy w/ Thunderstorms | 大部多云有雷暴 | ⛈️☁️ |
| 17 | Partly Sunny w/ Thunderstorms | 局部晴朗有雷暴 | ⛈️⛅ |
| 18 | Rain | 雨 | 🌧️ |
| 19 | Flurries | 阵雪 | 🌨️ |
| 20 | Mostly Cloudy w/ Flurries | 大部多云有阵雪 | 🌨️☁️ |
| 21 | Partly Sunny w/ Flurries | 局部晴朗有阵雪 | 🌨️⛅ |
| 22 | Snow | 雪 | ❄️ |
| 23 | Mostly Cloudy w/ Snow | 大部多云有雪 | ❄️☁️ |
| 24 | Ice | 冰 | 🧊 |
| 25 | Sleet | 雨夹雪 | 🌨️💧 |
| 26 | Freezing Rain | 冻雨 | 🧊💧 |
| 29 | Rain and Snow | 雨雪 | 🌨️💧 |
| 30 | Hot | 炎热 | 🔥 |
| 31 | Cold | 寒冷 | ❄️ |
| 32 | Windy | 大风 | 💨 |
| 33 | Clear | 晴朗（夜间） | 🌙 |
| 34 | Mostly Clear | 大部晴朗（夜间） | 🌙✨ |
| 35 | Partly Cloudy | 局部多云（夜间） | ☁️🌙 |
| 36 | Intermittent Clouds | 间歇多云（夜间） | ☁️🌙 |
| 37 | Hazy Moonlight | 朦胧月光 | 🌫️🌙 |
| 38 | Mostly Cloudy | 大部多云（夜间） | ☁️🌙 |
| 39 | Partly Cloudy w/ Showers | 局部多云有阵雨（夜间） | 🌦️🌙 |
| 40 | Mostly Cloudy w/ Showers | 大部多云有阵雨（夜间） | 🌦️☁️🌙 |
| 41 | Partly Cloudy w/ Thunderstorms | 局部多云有雷暴（夜间） | ⛈️🌙 |
| 42 | Mostly Cloudy w/ Thunderstorms | 大部多云有雷暴（夜间） | ⛈️☁️🌙 |
| 43 | Mostly Cloudy w/ Flurries | 大部多云有阵雪（夜间） | 🌨️☁️🌙 |
| 44 | Mostly Cloudy w/ Snow | 大部多云有雪（夜间） | ❄️☁️🌙 |

## 和风天气(QWeather) → AccuWeather映射表

### 映射逻辑

| 和风代码 | 和风描述 | AccuWeather代码 | AccuWeather描述 |
|---------|---------|----------------|----------------|
| 100 | 晴 | 1 | Sunny |
| 101 | 多云 | 4 | Intermittent Clouds |
| 102 | 少云 | 2 | Mostly Sunny |
| 103 | 晴间多云 | 2 | Mostly Sunny |
| 104 | 阴 | 7 | Cloudy |
| 150 | 晴（夜间） | 33 | Clear |
| 151 | 多云（夜间） | 35 | Partly Cloudy |
| 152 | 少云（夜间） | 34 | Mostly Clear |
| 153 | 晴间多云（夜间） | 34 | Mostly Clear |
| 300 | 阵雨 | 12 | Showers |
| 301 | 强阵雨 | 12 | Showers |
| 302 | 雷阵雨 | 15 | Thunderstorms |
| 303 | 强雷阵雨 | 15 | Thunderstorms |
| 304 | 雷阵雨伴有冰雹 | 15 | Thunderstorms |
| 305 | 小雨 | 18 | Rain |
| 306 | 中雨 | 18 | Rain |
| 307 | 大雨 | 18 | Rain |
| 308 | 极端降雨 | 18 | Rain |
| 309 | 毛毛雨 | 12 | Showers |
| 310 | 暴雨 | 18 | Rain |
| 311 | 大暴雨 | 18 | Rain |
| 312 | 特大暴雨 | 18 | Rain |
| 313 | 冻雨 | 26 | Freezing Rain |
| 314 | 小到中雨 | 18 | Rain |
| 315 | 中到大雨 | 18 | Rain |
| 316 | 大到暴雨 | 18 | Rain |
| 317 | 暴雨到大暴雨 | 18 | Rain |
| 318 | 大暴雨到特大暴雨 | 18 | Rain |
| 400 | 小雪 | 22 | Snow |
| 401 | 中雪 | 22 | Snow |
| 402 | 大雪 | 22 | Snow |
| 403 | 暴雪 | 22 | Snow |
| 404 | 雨夹雪 | 25 | Sleet |
| 405 | 雨雪天气 | 29 | Rain and Snow |
| 406 | 阵雨夹雪 | 25 | Sleet |
| 407 | 阵雪 | 19 | Flurries |
| 500 | 薄雾 | 11 | Fog |
| 501 | 雾 | 11 | Fog |
| 502 | 霾 | 5 | Hazy Sunshine |
| 503 | 浓雾 | 11 | Fog |
| 504 | 强浓雾 | 11 | Fog |
| 507 | 中度霾 | 5 | Hazy Sunshine |
| 508 | 重度霾 | 5 | Hazy Sunshine |
| 509 | 严重霾 | 5 | Hazy Sunshine |
| 510 | 大雾 | 11 | Fog |
| 511 | 特强浓雾 | 11 | Fog |
| 512 | 霾（夜间） | 37 | Hazy Moonlight |
| 513 | 霾（白天） | 5 | Hazy Sunshine |
| 514 | 雾（夜间） | 38 | Mostly Cloudy |
| 515 | 雾（白天） | 11 | Fog |
| 800 | 浮尘 | 5 | Hazy Sunshine |
| 801 | 扬沙 | 5 | Hazy Sunshine |
| 802 | 沙尘暴 | 5 | Hazy Sunshine |
| 803 | 强沙尘暴 | 5 | Hazy Sunshine |
| 804 | 龙卷风 | 32 | Windy |
| 805 | 雾凇 | 11 | Fog |
| 806 | 雨凇 | 26 | Freezing Rain |
| 807 | 沙尘 | 5 | Hazy Sunshine |
| 900 | 热 | 30 | Hot |
| 901 | 冷 | 31 | Cold |
| 999 | 未知 | 1 | Sunny |

## 代码实现

### TypeScript映射函数

```typescript
// src/services/htc/types.ts

/**
 * 和风天气代码 → AccuWeather代码映射
 */
export const QWEATHER_TO_ACCUWEATHER_MAP: Record<string, string> = {
  // 晴
  '100': '1',   // 晴 → Sunny
  '150': '33',  // 晴（夜间） → Clear
  
  // 多云
  '101': '4',   // 多云 → Intermittent Clouds
  '102': '2',   // 少云 → Mostly Sunny
  '103': '2',   // 晴间多云 → Mostly Sunny
  '151': '35',  // 多云（夜间） → Partly Cloudy
  '152': '34',  // 少云（夜间） → Mostly Clear
  '153': '34',  // 晴间多云（夜间） → Mostly Clear
  
  // 阴
  '104': '7',   // 阴 → Cloudy
  
  // 雨
  '300': '12',  // 阵雨 → Showers
  '301': '12',  // 强阵雨 → Showers
  '302': '15',  // 雷阵雨 → Thunderstorms
  '303': '15',  // 强雷阵雨 → Thunderstorms
  '304': '15',  // 雷阵雨伴有冰雹 → Thunderstorms
  '305': '18',  // 小雨 → Rain
  '306': '18',  // 中雨 → Rain
  '307': '18',  // 大雨 → Rain
  '308': '18',  // 极端降雨 → Rain
  '309': '12',  // 毛毛雨 → Showers
  '310': '18',  // 暴雨 → Rain
  '311': '18',  // 大暴雨 → Rain
  '312': '18',  // 特大暴雨 → Rain
  '313': '26',  // 冻雨 → Freezing Rain
  '314': '18',  // 小到中雨 → Rain
  '315': '18',  // 中到大雨 → Rain
  '316': '18',  // 大到暴雨 → Rain
  '317': '18',  // 暴雨到大暴雨 → Rain
  '318': '18',  // 大暴雨到特大暴雨 → Rain
  
  // 雪
  '400': '22',  // 小雪 → Snow
  '401': '22',  // 中雪 → Snow
  '402': '22',  // 大雪 → Snow
  '403': '22',  // 暴雪 → Snow
  '404': '25',  // 雨夹雪 → Sleet
  '405': '29',  // 雨雪天气 → Rain and Snow
  '406': '25',  // 阵雨夹雪 → Sleet
  '407': '19',  // 阵雪 → Flurries
  
  // 雾/霾
  '500': '11',  // 薄雾 → Fog
  '501': '11',  // 雾 → Fog
  '502': '5',   // 霾 → Hazy Sunshine
  '503': '11',  // 浓雾 → Fog
  '504': '11',  // 强浓雾 → Fog
  '507': '5',   // 中度霾 → Hazy Sunshine
  '508': '5',   // 重度霾 → Hazy Sunshine
  '509': '5',   // 严重霾 → Hazy Sunshine
  '510': '11',  // 大雾 → Fog
  '511': '11',  // 特强浓雾 → Fog
  '512': '37',  // 霾（夜间） → Hazy Moonlight
  '513': '5',   // 霾（白天） → Hazy Sunshine
  '514': '38',  // 雾（夜间） → Mostly Cloudy
  '515': '11',  // 雾（白天） → Fog
  
  // 沙尘
  '800': '5',   // 浮尘 → Hazy Sunshine
  '801': '5',   // 扬沙 → Hazy Sunshine
  '802': '5',   // 沙尘暴 → Hazy Sunshine
  '803': '5',   // 强沙尘暴 → Hazy Sunshine
  '804': '32',  // 龙卷风 → Windy
  '805': '11',  // 雾凇 → Fog
  '806': '26',  // 雨凇 → Freezing Rain
  '807': '5',   // 沙尘 → Hazy Sunshine
  
  // 特殊
  '900': '30',  // 热 → Hot
  '901': '31',  // 冷 → Cold
  '999': '1',   // 未知 → Sunny
};

/**
 * 获取AccuWeather代码
 * @param qweatherCode 和风天气代码
 * @returns AccuWeather代码（默认返回1-晴）
 */
export function getAccuWeatherCode(qweatherCode: string): string {
  return QWEATHER_TO_ACCUWEATHER_MAP[qweatherCode] || '1';
}
```

## 验证方法

### 1. 代码映射验证

```typescript
// 测试映射
console.log(getAccuWeatherCode('100')); // '1' (Sunny)
console.log(getAccuWeatherCode('101')); // '4' (Intermittent Clouds)
console.log(getAccuWeatherCode('305')); // '18' (Rain)
console.log(getAccuWeatherCode('999')); // '1' (默认值)
```

### 2. XML输出验证

```xml
<!-- 和风数据: icon=100 (晴) -->
<icon>1</icon>

<!-- 和风数据: icon=101 (多云) -->
<icon>4</icon>

<!-- 和风数据: icon=305 (小雨) -->
<icon>18</icon>
```

## 参考资料

1. **AccuWeather API文档**: https://developer.accuweather.com/
   - 官方天气状况代码文档
   
2. **和风天气API文档**: https://dev.qweather.com/docs/api/
   - 天气图标代码对照表
   
3. **技术社区资料**
   - 开发者博客和论坛分享的AccuWeather代码表
   - 开源天气项目中的代码映射参考

## 注意事项

1. **代码范围**: AccuWeather代码范围是1-44，不包含所有中间数字
2. **夜间代码**: 33-44是夜间专用代码
3. **默认值**: 未知代码默认映射为1（晴）
4. **多对一映射**: 多个和风代码可能映射到同一个AccuWeather代码
