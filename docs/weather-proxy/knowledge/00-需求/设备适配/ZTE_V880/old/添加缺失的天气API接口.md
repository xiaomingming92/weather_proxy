# 添加缺失的天气API接口计划

## 1. 分析当前实现

### 现有接口
- `weather-api.ts` 包含：
  - `getWeather(cityName)` - 获取城市天气（包含城市ID、当前天气、7天预报）
  - `getCityId(cityName)` - 获取城市ID
  - `getNowWeather(cityId)` - 获取当前天气
  - `getForecast(cityId)` - 获取7天预报

### 缺失接口（基于WeatherTV数据结构）
- **3小时预报** (`Cf3hPart_TimeScale`) - 从QWeather hourly API获取
- **天气指数** (`ZuType`) - 从QWeather indices API获取
- **日出日落** - 从QWeather forecast API获取但未单独暴露

## 2. 实施计划

### 步骤1：更新数据类型定义
- 在 `types/index.ts` 中扩展 `WeatherData` 接口：
  - 添加 `hourly` 字段用于3小时预报
  - 添加 `indices` 字段用于天气指数
  - 在 `city` 接口中添加 `sunrise` 和 `sunset` 字段

### 步骤2：扩展WeatherApi类
- 在 `weather-api.ts` 中添加新方法：
  - `getHourlyForecast(cityId)` - 获取24小时预报数据
  - `getWeatherIndices(cityId)` - 获取天气指数数据
- 更新 `getWeather` 方法以包含新数据

### 步骤3：更新数据转换逻辑
- 在 `data-transform.ts` 中更新 XML 生成方法：
  - 在 `generateZteXml` 中添加3小时预报数据
  - 在 `generateZteXml` 中添加天气指数数据
  - 确保所有新数据都包含在 XML 输出中

### 步骤4：验证实现
- 测试新接口是否能正确获取数据
- 验证生成的 XML 是否符合 WeatherTV 应用的要求
- 确保所有数据结构都正确映射

## 3. 预期结果
- 完整的 WeatherTV 应用所需的所有数据接口
- 支持3小时预报、天气指数和日出日落数据
- 与 QWeather API 完整集成
- 生成符合 WeatherTV 应用要求的 XML 数据