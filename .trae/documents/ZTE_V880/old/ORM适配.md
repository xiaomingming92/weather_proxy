# ORM 适配计划

## 背景

为了支持 WeatherTV 和 WeatherWidget 的不同数据需求，需要完善数据库结构和类型定义，确保能够存储和缓存两种应用类型的天气数据。

## 当前状态分析

### 1. 当前 Prisma Schema

```prisma
model City {
  id        Int      @id @default(autoincrement())
  name      String   @unique
  cityId    String   @unique
  createdAt BigInt
  updatedAt BigInt
  weatherData WeatherData[]
}

model WeatherData {
  id           Int      @id @default(autoincrement())
  cityId       String
  dataType     String
  xmlData      String @db.Text
  timestamp    BigInt
  timezone     String   @default("Asia/Shanghai")
  expiresAt    BigInt
  createdAt    BigInt
  updatedAt    BigInt
  city         City?    @relation(fields: [cityId], references: [cityId])
  @@unique([cityId, dataType])
}
```

### 2. 当前 DataType 枚举

```typescript
export enum DataType {
  CURRENT_WEATHER_V3 = 'ztev3widgetskall',  // WeatherWidget 实况
  CURRENT_WEATHER = 'ztewidgetsk',          // WeatherTV Widget 实况
  FORECAST_WEATHER = 'ztewidgetcf',         // WeatherTV Widget 预报
  FORECAST_WEATHER_V3 = 'ztev3widgetcfall', // WeatherWidget 预报
  ZTE = 'zte',                              // WeatherTV 主数据
}
```

## 需要完善的部分

### 1. 扩展 DataType 枚举

需要添加新的数据类型以支持所有 WeatherTV 接口：

```typescript
export enum DataType {
  // WeatherWidget 类型
  CURRENT_WEATHER_V3 = 'ztev3widgetskall',  // Widget 实况（完整版）
  FORECAST_WEATHER_V3 = 'ztev3widgetcfall', // Widget 预报（完整版）
  
  // WeatherTV Widget 类型
  WIDGET_SK = 'ztewidgetsk',                // Widget 实况（简化版）
  WIDGET_CF = 'ztewidgetcf',                // Widget 预报（简化版）
  
  // WeatherTV 主类型
  MAIN_DATA = 'zte',                        // 主天气数据（完整）
  
  // 城市列表
  CITY_LIST = 'allcity',                    // 城市列表
}
```

### 2. 扩展 WeatherData 类型

需要添加 WeatherTV 特有的字段：

```typescript
export interface WeatherData {
  // 现有字段保持不变...
  
  // 新增：站点信息（用于 WeatherTV StationInfo 节点）
  stationInfo?: {
    stationId: string;      // 站点ID
    longitude: string;      // 经度
    latitude: string;       // 纬度
    postcode?: string;      // 邮编
  };
  
  // 新增：广告信息（用于 WeatherTV AdvFile 节点）
  advertisement?: {
    cfFlag?: string;        // 预报广告标识
    skFlag?: string;        // 实况广告标识
    zuFlag?: string;        // 指数广告标识
  };
}
```

### 3. 扩展 City 模型

添加 WeatherTV 需要的额外城市信息：

```prisma
model City {
  id        Int      @id @default(autoincrement())
  name      String   @unique
  cityId    String   @unique
  
  // 新增：站点信息
  stationId   String?   // 气象站点ID
  longitude   String?   // 经度
  latitude    String?   // 纬度
  postcode    String?   // 邮编
  
  // 新增：时间戳信息
  sunrise     String?   // 日出时间
  sunset      String?   // 日落时间
  
  createdAt   BigInt
  updatedAt   BigInt
  weatherData WeatherData[]
}
```

### 4. 扩展 WeatherData 模型

添加缓存策略和应用类型标识：

```prisma
model WeatherData {
  id           Int      @id @default(autoincrement())
  cityId       String
  dataType     String
  appType      String   // 新增：应用类型 (weathertv / weatherwidget)
  xmlData      String   @db.Text
  timestamp    BigInt
  timezone     String   @default("Asia/Shanghai")
  expiresAt    BigInt
  
  // 新增：缓存策略
  cacheDuration Int     // 缓存时长（分钟）
  
  createdAt    BigInt
  updatedAt    BigInt
  city         City?    @relation(fields: [cityId], references: [cityId])
  
  // 修改复合索引
  @@unique([cityId, dataType, appType])
  @@index([expiresAt])
  @@index([appType, dataType])
}
```

### 5. 新增 CachePolicy 模型

为不同数据类型配置缓存策略：

```prisma
model CachePolicy {
  id          Int      @id @default(autoincrement())
  dataType    String   @unique  // 数据类型
  appType     String            // 应用类型
  duration    Int               // 缓存时长（分钟）
  description String?             // 描述
  createdAt   BigInt
  updatedAt   BigInt
}
```

## 数据库迁移计划

### 迁移步骤 1：添加新字段

```sql
-- 扩展 City 表
ALTER TABLE City ADD COLUMN stationId VARCHAR(255);
ALTER TABLE City ADD COLUMN longitude VARCHAR(255);
ALTER TABLE City ADD COLUMN latitude VARCHAR(255);
ALTER TABLE City ADD COLUMN postcode VARCHAR(255);
ALTER TABLE City ADD COLUMN sunrise VARCHAR(255);
ALTER TABLE City ADD COLUMN sunset VARCHAR(255);

-- 扩展 WeatherData 表
ALTER TABLE WeatherData ADD COLUMN appType VARCHAR(50) DEFAULT 'unknown';
ALTER TABLE WeatherData ADD COLUMN cacheDuration INT DEFAULT 30;

-- 创建新索引
CREATE INDEX idx_weatherdata_expires ON WeatherData(expiresAt);
CREATE INDEX idx_weatherdata_app_type ON WeatherData(appType, dataType);

-- 修改唯一索引
ALTER TABLE WeatherData DROP INDEX cityId_dataType;
CREATE UNIQUE INDEX idx_weatherdata_unique ON WeatherData(cityId, dataType, appType);
```

### 迁移步骤 2：创建 CachePolicy 表

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
('zte', 'weathertv', 30, 'WeatherTV 主天气数据', UNIX_TIMESTAMP()*1000, UNIX_TIMESTAMP()*1000),
('ztewidgetsk', 'weathertv', 30, 'WeatherTV Widget 实况', UNIX_TIMESTAMP()*1000, UNIX_TIMESTAMP()*1000),
('ztewidgetcf', 'weathertv', 60, 'WeatherTV Widget 预报', UNIX_TIMESTAMP()*1000, UNIX_TIMESTAMP()*1000),
('ztev3widgetskall', 'weatherwidget', 30, 'WeatherWidget 实况', UNIX_TIMESTAMP()*1000, UNIX_TIMESTAMP()*1000),
('ztev3widgetcfall', 'weatherwidget', 60, 'WeatherWidget 预报', UNIX_TIMESTAMP()*1000, UNIX_TIMESTAMP()*1000),
('allcity', 'weathertv', 1440, '城市列表', UNIX_TIMESTAMP()*1000, UNIX_TIMESTAMP()*1000);
```

## Prisma Schema 最终版本

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "mysql"
}

model City {
  id        Int      @id @default(autoincrement())
  name      String   @unique
  cityId    String   @unique
  
  // 站点信息
  stationId   String?
  longitude   String?
  latitude    String?
  postcode    String?
  
  // 时间信息
  sunrise     String?
  sunset      String?
  
  createdAt   BigInt
  updatedAt   BigInt
  weatherData WeatherData[]
}

model WeatherData {
  id           Int      @id @default(autoincrement())
  cityId       String
  dataType     String
  appType      String   @default("unknown")
  xmlData      String   @db.Text
  timestamp    BigInt
  timezone     String   @default("Asia/Shanghai")
  expiresAt    BigInt
  cacheDuration Int     @default(30)
  createdAt    BigInt
  updatedAt    BigInt
  
  city         City?    @relation(fields: [cityId], references: [cityId])
  
  @@unique([cityId, dataType, appType])
  @@index([expiresAt])
  @@index([appType, dataType])
}

model CachePolicy {
  id          Int      @id @default(autoincrement())
  dataType    String   @unique
  appType     String
  duration    Int
  description String?
  createdAt   BigInt
  updatedAt   BigInt
}

model CacheConfig {
  id          Int      @id @default(autoincrement())
  key         String   @unique
  value       String
  description String?
  createdAt   BigInt
  updatedAt   BigInt
}
```

## 类型定义更新

```typescript
// 数据类型枚举
export enum DataType {
  // WeatherWidget 类型
  CURRENT_WEATHER_V3 = 'ztev3widgetskall',
  FORECAST_WEATHER_V3 = 'ztev3widgetcfall',
  
  // WeatherTV Widget 类型
  WIDGET_SK = 'ztewidgetsk',
  WIDGET_CF = 'ztewidgetcf',
  
  // WeatherTV 主类型
  MAIN_DATA = 'zte',
  
  // 城市列表
  CITY_LIST = 'allcity',
}

// 应用类型枚举
export enum AppType {
  WEATHER_WIDGET = 'weatherwidget',
  WEATHER_TV = 'weathertv',
  UNKNOWN = 'unknown',
}

// 天气数据接口
export interface WeatherData {
  now?: {
    temp: string;
    icon: string;
    updateTime: string;
    humidity?: string;
    pressure?: string;
    windSpeed?: string;
    windDir?: string;
    vis?: string;
    feelsLike?: string;
    dew?: string;
    cloud?: string;
    precip?: string;
    uvIndex?: string;
    windScale?: string;  // 新增：风力等级
  };
  
  forecast?: {
    daily?: Array<{
      fxDate: string;
      tempMin: string;
      tempMax: string;
      iconDay: string;
      iconNight?: string;
      textDay?: string;
      textNight?: string;
      wind360Day?: string;
      wind360Night?: string;
      windDirDay?: string;
      windDirNight?: string;
      windScaleDay?: string;
      windScaleNight?: string;
      windSpeedDay?: string;
      windSpeedNight?: string;
      humidity?: string;
      precip?: string;
      pressure?: string;
      vis?: string;
      cloud?: string;
      uvIndex?: string;
      sunrise?: string;
      sunset?: string;
      week?: string;  // 新增：星期
    }>;
    updateTime: string;
  };
  
  hourly?: {
    hourly?: Array<{
      fxTime: string;
      temp: string;
      icon: string;
      text: string;
      wind360: string;
      windDir: string;
      windScale: string;
      windSpeed: string;
      humidity: string;
      precip: string;
      pressure: string;
      vis: string;
      cloud: string;
      dew: string;
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
      level?: string;  // 新增：指数等级
    }>;
    updateTime: string;
  };
  
  city?: {
    id: string;
    name: string;
    sunrise?: string;
    sunset?: string;
    // 新增：站点信息
    stationId?: string;
    longitude?: string;
    latitude?: string;
    postcode?: string;
  };
  
  // 新增：广告信息
  advertisement?: {
    cfFlag?: string;
    skFlag?: string;
    zuFlag?: string;
  };
  
  updateTime?: string;
}

// 缓存数据接口
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

// 缓存策略接口
export interface CachePolicy {
  dataType: string;
  appType: string;
  duration: number;
  description?: string;
}
```

## 实施步骤

1. **更新 Prisma Schema** - 添加新字段和模型
2. **生成迁移文件** - `npx prisma migrate dev`
3. **更新类型定义** - 修改 `src/types/index.ts`
4. **更新缓存服务** - 修改 `src/services/prisma-cache.ts`
5. **更新数据转换服务** - 修改 `src/services/data-transform.ts`
6. **测试数据库操作** - 验证 CRUD 操作正常

## 注意事项

1. **向后兼容** - 新字段都设置为可选（nullable），避免影响现有数据
2. **索引优化** - 添加复合索引提高查询性能
3. **缓存策略** - 不同数据类型使用不同的缓存时长
4. **数据迁移** - 现有数据需要补充 stationId 等字段
