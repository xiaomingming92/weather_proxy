# ORM与数据库设计

## 背景

为支持WeatherTV和WeatherWidget的不同数据需求，需要完善数据库结构和类型定义，确保能够存储和缓存两种应用类型的天气数据。

## Prisma Schema设计

### 1. City模型

```prisma
model City {
  id        Int      @id @default(autoincrement())
  name      String   @unique
  cityId    String   @unique
  
  // 站点信息（WeatherTV需要）
  stationId   String?   // 气象站点ID
  longitude   String?   // 经度
  latitude    String?   // 纬度
  postcode    String?   // 邮编
  
  // 时间信息
  sunrise     String?   // 日出时间
  sunset      String?   // 日落时间
  
  createdAt   BigInt
  updatedAt   BigInt
  weatherData WeatherData[]
}
```

### 2. WeatherData模型

```prisma
model WeatherData {
  id           Int      @id @default(autoincrement())
  cityId       String
  dataType     String
  appType      String   @default("unknown")  // weathertv / weatherwidget
  xmlData      String   @db.Text
  timestamp    BigInt
  timezone     String   @default("Asia/Shanghai")
  expiresAt    BigInt
  cacheDuration Int     @default(30)          // 缓存时长（分钟）
  createdAt    BigInt
  updatedAt    BigInt
  
  city         City?    @relation(fields: [cityId], references: [cityId])
  
  @@unique([cityId, dataType, appType])
  @@index([expiresAt])
  @@index([appType, dataType])
}
```

### 3. CachePolicy模型

```prisma
model CachePolicy {
  id          Int      @id @default(autoincrement())
  dataType    String   @unique
  appType     String            // weathertv / weatherwidget
  duration    Int               // 缓存时长（分钟）
  description String?
  createdAt   BigInt
  updatedAt   BigInt
}
```

### 4. CacheConfig模型

```prisma
model CacheConfig {
  id          Int      @id @default(autoincrement())
  key         String   @unique
  value       String
  description String?
  createdAt   BigInt
  updatedAt   BigInt
}
```

## 数据库迁移

### 迁移步骤1：添加新字段

```sql
-- 扩展City表
ALTER TABLE City ADD COLUMN stationId VARCHAR(255);
ALTER TABLE City ADD COLUMN longitude VARCHAR(255);
ALTER TABLE City ADD COLUMN latitude VARCHAR(255);
ALTER TABLE City ADD COLUMN postcode VARCHAR(255);
ALTER TABLE City ADD COLUMN sunrise VARCHAR(255);
ALTER TABLE City ADD COLUMN sunset VARCHAR(255);

-- 扩展WeatherData表
ALTER TABLE WeatherData ADD COLUMN appType VARCHAR(50) DEFAULT 'unknown';
ALTER TABLE WeatherData ADD COLUMN cacheDuration INT DEFAULT 30;

-- 创建新索引
CREATE INDEX idx_weatherdata_expires ON WeatherData(expiresAt);
CREATE INDEX idx_weatherdata_app_type ON WeatherData(appType, dataType);

-- 修改唯一索引
ALTER TABLE WeatherData DROP INDEX cityId_dataType;
CREATE UNIQUE INDEX idx_weatherdata_unique ON WeatherData(cityId, dataType, appType);
```

### 迁移步骤2：创建CachePolicy表

```sql
CREATE TABLE CachePolicy (
  id INT AUTO_INCREMENT PRIMARY KEY,
  dataType VARCHAR(255) UNIQUE NOT NULL,
  appType VARCHAR(50) NOT NULL,
  duration INT NOT NULL,
  description VARCHAR(500),
  createdAt BIGINT NOT NULL,
  updatedAt BIGINT NOT NULL
);

-- 初始化缓存策略
INSERT INTO CachePolicy (dataType, appType, duration, description, createdAt, updatedAt) VALUES
('zte', 'weathertv', 30, 'WeatherTV主天气数据', UNIX_TIMESTAMP()*1000, UNIX_TIMESTAMP()*1000),
('ztewidgetsk', 'weathertv', 30, 'WeatherTV Widget实况', UNIX_TIMESTAMP()*1000, UNIX_TIMESTAMP()*1000),
('ztewidgetcf', 'weathertv', 60, 'WeatherTV Widget预报', UNIX_TIMESTAMP()*1000, UNIX_TIMESTAMP()*1000),
('ztev3widgetskall', 'weatherwidget', 30, 'WeatherWidget实况', UNIX_TIMESTAMP()*1000, UNIX_TIMESTAMP()*1000),
('ztev3widgetcfall', 'weatherwidget', 60, 'WeatherWidget预报', UNIX_TIMESTAMP()*1000, UNIX_TIMESTAMP()*1000),
('allcity', 'weathertv', 1440, '城市列表', UNIX_TIMESTAMP()*1000, UNIX_TIMESTAMP()*1000);
```

## TypeScript类型定义

### DataType枚举

```typescript
export enum DataType {
  // WeatherWidget类型
  CURRENT_WEATHER_V3 = 'ztev3widgetskall',
  FORECAST_WEATHER_V3 = 'ztev3widgetcfall',
  
  // WeatherTV Widget类型
  WIDGET_SK = 'ztewidgetsk',
  WIDGET_CF = 'ztewidgetcf',
  
  // WeatherTV主类型
  MAIN_DATA = 'zte',
  
  // 城市列表
  CITY_LIST = 'allcity',
}
```

### AppType枚举

```typescript
export enum AppType {
  WEATHER_WIDGET = 'weatherwidget',
  WEATHER_TV = 'weathertv',
  UNKNOWN = 'unknown',
}
```

### WeatherData接口

```typescript
export interface WeatherData {
  now?: {
    temp: string;
    icon: string;
    updateTime: string;
    humidity?: string;
    pressure?: string;
    windSpeed?: string;
    windDir?: string;
    windScale?: string;  // 风力等级
    vis?: string;
    feelsLike?: string;
  };
  
  forecast?: {
    daily?: Array<{
      fxDate: string;
      tempMin: string;
      tempMax: string;
      iconDay: string;
      textDay?: string;
      windDirDay?: string;
      windScaleDay?: string;
      windSpeedDay?: string;
      humidity?: string;
      pressure?: string;
      sunrise?: string;
      sunset?: string;
      week?: string;
    }>;
    updateTime: string;
  };
  
  hourly?: {
    hourly?: Array<{
      fxTime: string;
      temp: string;
      icon: string;
      windDir: string;
      windScale: string;
      windSpeed: string;
      humidity: string;
      pressure: string;
    }>;
    updateTime: string;
  };
  
  indices?: {
    daily?: Array<{
      date: string;
      type: string;
      name: string;
      category: string;
      text: string;
      level?: string;
    }>;
    updateTime: string;
  };
  
  city?: {
    id: string;
    name: string;
    sunrise?: string;
    sunset?: string;
    stationId?: string;
    longitude?: string;
    latitude?: string;
    postcode?: string;
  };
  
  advertisement?: {
    cfFlag?: string;
    skFlag?: string;
    zuFlag?: string;
  };
  
  updateTime?: string;
}
```

### CachedWeatherData接口

```typescript
export interface CachedWeatherData {
  id: string;
  cityId: string;
  dataType: string;
  appType: string;
  xmlData: string;
  createdAt: Date;
  expiresAt: Date;
  cacheDuration: number;
}
```

### CachePolicy接口

```typescript
export interface CachePolicy {
  dataType: string;
  appType: string;
  duration: number;
  description?: string;
}
```

## 缓存策略配置

| 数据类型 | 应用类型 | 缓存时长 | 说明 |
|---------|---------|---------|------|
| zte | weathertv | 30分钟 | WeatherTV主天气数据 |
| ztewidgetsk | weathertv | 30分钟 | WeatherTV Widget实况 |
| ztewidgetcf | weathertv | 60分钟 | WeatherTV Widget预报 |
| ztev3widgetskall | weatherwidget | 30分钟 | WeatherWidget实况 |
| ztev3widgetcfall | weatherwidget | 60分钟 | WeatherWidget预报 |
| allcity | weathertv | 1440分钟 | 城市列表 |

## 实施步骤

1. **更新Prisma Schema** - 添加新字段和模型
2. **生成迁移文件** - `npx prisma migrate dev`
3. **更新类型定义** - 修改`src/types/index.ts`
4. **更新缓存服务** - 修改`src/services/prisma-cache.ts`
5. **更新数据转换服务** - 修改`src/services/data-transform.ts`
6. **测试数据库操作** - 验证CRUD操作正常

## 注意事项

1. **向后兼容** - 新字段都设置为可选（nullable），避免影响现有数据
2. **索引优化** - 添加复合索引提高查询性能
3. **缓存策略** - 不同数据类型使用不同的缓存时长
4. **数据迁移** - 现有数据需要补充stationId等字段
