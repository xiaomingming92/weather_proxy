# Prisma持久化缓存实现计划

## 目标

使用Prisma + MySQL实现天气数据的持久化缓存，提高API响应速度，减少重复请求，支持缓存配置的动态调整。

## 技术栈

* Node.js 24

* TypeScript

* Prisma ORM

* MySQL

* Express.js

## 实施步骤

### 1. 环境配置

1. **安装Prisma依赖**

   * `npm install prisma @prisma/client`

2. **初始化Prisma**

   * `npx prisma init`

   * 配置`prisma/schema.prisma`文件

3. **创建数据库模型**

   1. 要先判断QWeather的城市数据格式、天气数据格式

      * 城市信息模型 (`City`)

      * 天气数据模型 (`WeatherData`)

      * 缓存配置模型 (`CacheConfig`)

### 2. 数据库模型设计

```prisma
// prisma/schema.prisma

model City {
  id        Int      @id @default(autoincrement())
  name      String   @unique
  cityId    String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // 关联到天气数据
  weatherData WeatherData[]
}

model WeatherData {
  id           Int      @id @default(autoincrement())
  cityId       String
  dataType     String
  xmlData      String
  createdAt    DateTime @default(now())
  expiresAt    DateTime
  
  // 外键关联
  city         City?    @relation(fields: [cityId], references: [cityId])
  
  // 复合唯一索引
  @@unique([cityId, dataType])
}

model CacheConfig {
  id               Int      @id @default(autoincrement())
  key              String   @unique
  value            String
  description      String?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
}
```

### 3. 缓存服务改造

1. **创建Prisma缓存服务**

   * 实现城市信息缓存

   * 实现天气数据缓存

   * 实现缓存过期检查

2. **改造现有缓存逻辑**

   * 在`weather-api.ts`中集成Prisma缓存

   * 在`data-transform.ts`中添加缓存检查

   * 在`routes/weather.ts`中实现缓存策略

### 4. 缓存策略实现

1. **实时查询缓存**

   * 相同城市的请求在3分钟内复用缓存

   * 实现缓存键生成和检查逻辑

2. **多天预警缓存**

   * 12小时内的相同请求复用缓存

   * 实现预报数据的定时更新

3. **缓存配置管理**

   * 添加缓存时间配置项

   * 实现配置项动态调整接口

### 5. 定时任务实现

1. **创建定时任务服务**

   * 使用`node-cron`实现定时任务

   * 每小时更新一次预报数据

2. **实现预报数据更新逻辑**

   * 遍历存在的预报缓存

   * 统一请求更新预报数据

   * 更新缓存过期时间

### 6. 配置管理接口

1. **添加缓存配置接口**

   * GET `/api/config/cache` - 获取缓存配置

   * PUT `/api/config/cache` - 更新缓存配置

2. **实现配置项动态调整**

   * 支持实时调整缓存时间

   * 支持缓存策略的配置

### 7. 时间处理

1. **分析WeatherWidget时间系统**

   * 检查WeatherWidget使用的时间格式

   * 确保缓存时间与WeatherWidget时间系统兼容

2. **实现时间同步**

   * 确保服务器时间与WeatherWidget时间同步

   * 处理时区差异

### 8. 测试和验证

1. **单元测试**

   * 测试缓存服务的基本功能

   * 测试缓存过期逻辑

2. **集成测试**

   * 测试API响应速度

   * 测试缓存命中率

   * 测试定时任务效果

3. **性能测试**

   * 测试高并发场景下的性能

   * 测试缓存失效时的降级策略

## 预期成果

1. **持久化缓存**：使用MySQL存储缓存数据，服务重启后不丢失

2. **智能缓存策略**：

   * 实时查询：3分钟内的相同请求复用缓存

   * 多天预警：12小时内的相同请求复用缓存

3. **动态配置**：支持通过API接口动态调整缓存配置

4. **定时更新**：每小时自动更新预报数据，确保数据时效性

5. **性能提升**：减少API调用次数，提高响应速度

## 技术要点

1. **Prisma ORM**：使用最新版本的Prisma，确保类型安全的数据库操作

2. **缓存键设计**：设计合理的缓存键，确保缓存的唯一性和有效性

3. **过期策略**：实现合理的缓存过期策略，平衡数据时效性和性能

4. **错误处理**：添加完善的错误处理，确保系统稳定性

5. **监控和日志**：添加缓存命中率监控和详细的日志记录

## 注意事项

1. **数据库连接**：确保MySQL数据库连接稳定

2. **缓存大小**：监控缓存大小，避免数据库过度增长

3. **安全性**：确保数据库连接信息的安全存储

4. **兼容性**：确保与现有代码的兼容性，避免破坏现有功能

5. **可扩展性**：设计可扩展的缓存系统，支持未来的功能扩展

