# 05 ORM 与数据库设计 - 华风天气适配

## 问题背景

当前 `prisma/schema.prisma` 中的 HTC 相关表（`HtcCity`, `HtcWeatherCache`, `HtcCachePolicy`）仅适配了 **AccuWeather 国际版**接口：

- `HtcWeatherCache.endpoint` 枚举值：`forecast-data_v3`, `city-find`, `lat-lon-search`, `weather-data`
- 缺少国行版华风天气的 `getweatheru.asmx/getData` 端点

## ZTE V880 vs HTC G13 华风天气差异

| 特性 | ZTE V880 | HTC G13 |
|------|----------|---------|
| **服务器** | `my.tv189.cn` | `htc-mobile.mywtv.cn` |
| **API 路径** | `/weather/...` | `/getweatheru.asmx/getData` |
| **请求方式** | GET/POST | GET |
| **参数格式** | 自定义参数 | `dataType=htc&code=ED926B&sname={城市代码}` |
| **响应格式** | `<CityMeteor>...</CityMeteor>` | `<root><CityMeteor>...</CityMeteor></root>` |
| **城市代码** | 内部编码 | 华风城市代码（如 `01011712`） |
| **天气代码** | 0-37 | 0-36（映射到 AccuWeather） |

### XML 格式对比

**ZTE V880 (WeatherTV/WeatherWidget)**:
```xml
<?xml version="1.0" encoding="utf-8"?>
<CityMeteor CityName="南京">
  <StationInfo Stationid="..." Longitude="..." Latitude="..."/>
  <SK ReportTime="...">
    <Info Weather="1" Temperature="25" WindDir="3" .../>
  </SK>
  <CF ReportTime="...">
    <Period Timestart="..." Timeend="..." Weather="1" Tmax="28" Tmin="15" .../>
  </CF>
  <ZU ReportTime="...">
    <Type Name="GM" Val="1">...</Type>
  </ZU>
</CityMeteor>
```

**HTC G13 (华风天气)**:
```xml
<?xml version="1.0" encoding="utf-8"?>
<root>
  <CityMeteor CityName="南京">
    <StationInfo Stationid="..." Longitude="..." Latitude="..."/>
    <CF ReportTime="...">
      <Period TimeStart="..." TimeEnd="..." 
              Weather="1" Tmax="28" Tmin="15" Week="1"
              WindDir="东南风" WindPower="3"/>
    </CF>
    <SK>
      <Info Weather="1" Temperature="25" 
            WindDir="东南风" WindPower="3" 
            WindSpeed="12" Humidity="45"/>
    </SK>
  </CityMeteor>
</root>
```

**关键差异**:
1. HTC G13 有外层 `<root>` 标签
2. HTC G13 的 `<SK>` 在 `<CF>` 之后
3. HTC G13 使用中文风向（如"东南风"），ZTE 使用数字代码
4. HTC G13 有 `Week` 属性，ZTE 没有
5. HTC G13 的 `<SK>` 没有 `ReportTime` 属性

## 数据库适配方案

### 方案 1: 扩展现有 HtcWeatherCache 表

```prisma
model HtcWeatherCache {
  id            Int      @id @default(autoincrement())
  cityId        String
  endpoint      String   // 新增: huafeng-getData
  xmlData       String   @db.Text
  timestamp     BigInt
  expiresAt     BigInt
  cacheDuration Int      @default(30)
  createdAt     BigInt
  updatedAt     BigInt
  
  @@unique([cityId, endpoint])
  @@index([expiresAt])
  @@index([endpoint])
}
```

### 方案 2: 创建独立的华风天气缓存表（推荐）

```prisma
// ============================================
// HTC 华风天气缓存表（国行版专用）
// ============================================
model HtcHuafengCache {
  id            Int      @id @default(autoincrement())
  cityCode      String   // 华风城市代码，如 "01011712"
  cityName      String   // 城市名称
  xmlData       String   @db.Text  // 华风格式 XML
  timestamp     BigInt
  expiresAt     BigInt
  cacheDuration Int      @default(30)
  createdAt     BigInt
  updatedAt     BigInt
  
  @@unique([cityCode])
  @@index([expiresAt])
}

// ============================================
// HTC 华风城市代码映射表
// ============================================
model HtcHuafengCity {
  id          Int      @id @default(autoincrement())
  cityCode    String   @unique  // 华风代码，如 "01011712"
  cityName    String            // 城市名称
  qweatherId  String?           // 和风天气城市ID
  longitude   String?
  latitude    String?
  createdAt   BigInt
  updatedAt   BigInt
}
```

## 华风天气代码映射表

```typescript
// 华风代码 -> AccuWeather 代码
const HUAfeng_TO_ACCU: Record<number, number> = {
  0: 1,   // 晴
  1: 6,   // 多云
  2: 8,   // 阴
  3: 18,  // 雨
  4: 15,  // 雷阵雨
  5: 51,  // 雾
  6: 29,  // 雪
  7: 14,  // 雨夹雪
  8: 13,  // 小雨
  9: 18,  // 中雨
  10: 15, // 大雨
  11: 22, // 暴雨
  // ... 共36个代码
};

// 夜间代码映射
const HUAfeng_NIGHT_TO_ACCU: Record<number, number> = {
  0: 33,  // 晴(夜间)
  1: 38,  // 多云(夜间)
  // ...
};
```

## 实现计划

1. **数据库迁移**
   - [ ] 创建 `HtcHuafengCache` 表
   - [ ] 创建 `HtcHuafengCity` 表
   - [ ] 填充华风城市代码映射数据

2. **服务端点实现**
   - [ ] `/getweatheru.asmx/getData` 端点
   - [ ] 和风天气数据 -> 华风 XML 转换器
   - [ ] 缓存逻辑

3. **数据转换器**
   - [ ] 天气代码映射
   - [ ] 风向转换（中文 -> 数字）
   - [ ] 温度、湿度等字段映射

## 参考代码

- ZTE V880 数据转换器: `src/services/zte/data-transform.ts`
- HTC G13 华风天气端点: `src/routes/huafeng-weather.ts` (需完善)
- 华风天气解析器: `htc_g13_weather/WeatherSyncProvider_jadx/com/htc/sync/provider/weather/ChinaWeatherData.java`
