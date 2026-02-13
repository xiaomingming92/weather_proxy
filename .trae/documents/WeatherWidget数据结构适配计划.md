# WeatherWidget数据结构适配计划

## 目标

调整weather_proxy的响应数据结构，使其与WeatherWidget期望的数据格式完全匹配，确保WeatherWidget能够正确解析和显示天气数据。同时整合和风天气API集成，支持指数数据和多天预报功能。

## 分析

### WeatherWidget数据结构需求

1. **当前天气数据** (`WeatherCurrentCondition`)：

   * cityName：城市名称

   * reportTime：报告时间

   * condition：天气代码

   * temp：当前温度

2. **天气预报数据** (`WeatherForecastCondition`)：

   * cityName：城市名称

   * reportTime：报告时间

   * startTime1：第一天开始时间

   * endTime1：第一天结束时间

   * week1：第一天星期

   * condition1：第一天天气代码

   * tempMin1：第一天最低温度

   * tempMax1：第一天最高温度

   * startTime2：第二天开始时间

   * endTime2：第二天结束时间

   * week2：第二天星期

   * condition2：第二天天气代码

   * tempMin2：第二天最低温度

   * tempMax2：第二天最高温度

3. **内部数据结构** (`WeatherItem`)：

   * cityName：城市名称

   * curCondition：当前天气代码

   * curTemp：当前温度

   * maxTemp：最高温度

   * minTemp：最低温度

   * refreshTime：刷新时间

4. **指数数据需求**：

   * 支持多种生活指数
   * 指数等级和详细描述
   * 指数图标和类型

5. **多天预报需求**：

   * 支持3-30天天气预报
   * 日出日落、月升月落数据
   * 详细的天气状况信息

### 当前weather_proxy实现

1. **数据类型支持**：

   * `ztev3widgetskall`/`ztewidgetsk`：返回当前天气XML

   * `ztewidgetcf`：返回天气预报XML

2. **当前天气XML结构**：

   ```xml
   <weather>
     <city>城市名称</city>
     <temp>当前温度</temp>
     <weather>天气代码</weather>
     <reporttime>更新时间</reporttime>
   </weather>
   ```

3. **天气预报XML结构**：

   ```xml
   <weather>
     <city>城市名称</city>
     <reporttime>更新时间</reporttime>
     <forecast>
       <day>
         <date>日期</date>
         <weather>天气代码</weather>
         <temp>最高/最低温度</temp>
       </day>
       <!-- 更多day节点 -->
     </forecast>
   </weather>
   ```

4. **重复逻辑问题**：

   * XML长度填充逻辑（3处）
   * 额外数据添加逻辑（3处）
   * 应用类型判断逻辑（3处）

### WeatherTV_V880+返回属性清单

通过逆向工程Smali文件，识别出以下返回属性：

1. **当前天气数据** (`SkPart`)：
   * Temperature: 温度
   * Weather: 天气代码
   * Humidity: 湿度
   * Pressure: 气压
   * WindDir: 风向
   * WindPower: 风力
   * WindSpeed: 风速
   * repotrtime: 更新时间

2. **预报天气数据** (`CfPart_TimeScale`)：
   * TimeBegin: 开始时间
   * TimeOver: 结束时间
   * Tmax: 最高温度
   * Tmin: 最低温度
   * Temperature: 温度
   * Weather: 天气代码
   * Week: 星期
   * WindDir: 风向
   * WindPower: 风力
   * low: 低温标记

3. **城市数据** (`CityData`)：
   * name: 城市名称
   * postcode: 邮编
   * stationid: 站点ID
   * Longitude: 经度
   * Latitude: 纬度
   * sunrise: 日出时间
   * sunset: 日落时间
   * skPart: 当前天气数据
   * cfPart: 预报天气数据
   * cf3hPart: 3小时预报数据
   * zuPart: 指数数据
   * advertisement: 广告数据

4. **指数数据** (`ZuType`，通过`ZuPart.allzuTypes`)：
   * typechineseStr: 指数中文名称
   * typeimg: 指数图标
   * typeinfo: 指数详细信息
   * typename: 指数类型名称
   * typeval: 指数数值（整数）
   * typevalStr: 指数数值字符串

5. **3小时预报数据** (`Cf3hPart`)：
   * ReportTime: 预报更新时间
   * allTimeReport: 3小时分段预报列表，每个元素为Cf3hPart_TimeScale

6. **Cf3hPart_TimeScale**（3小时分段预报）：
   * TimeBegin: 开始时间
   * TimeOver: 结束时间
   * Temperature: 温度
   * Weather: 天气代码
   * WindDir: 风向
   * WindPower: 风力

## API集成方案

### 1. 逐小时预报API集成

**接口地址**：`/v7/weather/{hours}`

**入参**：
* `hours`：预报小时数（24h/72h/168h）
* `location`：城市ID或经纬度
* `lang`：多语言设置
* `unit`：数据单位设置

**出参**：
* `code`：状态码
* `updateTime`：更新时间
* `hourly`：逐小时预报数据数组
* 包含：温度、天气状况、风力、风速、风向、相对湿度、大气压强、降水概率、露点温度、云量

### 2. 每日预报API集成

**接口地址**：`/v7/weather/{days}`

**入参**：
* `days`：预报天数（3d/7d/10d/15d/30d）
* `location`：城市ID或经纬度
* `lang`：多语言设置
* `unit`：数据单位设置

**出参**：
* `code`：状态码
* `updateTime`：更新时间
* `daily`：每日预报数据数组
* 包含：日出日落、月升月落、最高最低温度、天气白天和夜间状况、风力、风速、风向、相对湿度、大气压强、降水量、露点温度、紫外线强度、能见度等

### 3. 天气指数API集成

**接口地址**：`/v7/indices/{days}`

**入参**：
* `days`：预报天数（1d/3d）
* `location`：城市ID或经纬度
* `type`：生活指数类型ID
* `lang`：多语言设置

**出参**：
* `code`：状态码
* `updateTime`：更新时间
* `daily`：指数预报数据数组
* 包含：预报日期、指数类型ID、指数名称、指数等级、指数级别名称、指数详细描述

## 数据结构映射

### 1. API字段与应用数据结构映射

#### 当前天气数据映射

| 和风天气API字段 | WeatherWidget字段 | WeatherTV字段 | 说明 |
|----------------|------------------|---------------|------|
| temp           | temp             | Temperature   | 温度 |
| icon           | condition        | Weather       | 天气代码 |
| windSpeed      | -                | WindSpeed     | 风速 |
| windDir        | -                | WindDir       | 风向 |
| humidity       | -                | Humidity      | 湿度 |
| pressure       | -                | Pressure      | 气压 |
| updateTime     | reportTime       | repotrtime    | 更新时间 |

#### 天气预报数据映射

| 和风天气API字段 | WeatherWidget字段 | WeatherTV字段 | 说明 |
|----------------|------------------|---------------|------|
| fxDate         | startTime1/2     | TimeBegin     | 预报日期 |
| tempMax        | tempMax1/2       | Tmax          | 最高温度 |
| tempMin        | tempMin1/2       | Tmin          | 最低温度 |
| iconDay        | condition1/2     | Weather       | 白天天气代码 |
| sunrise        | -                | sunrise       | 日出时间 |
| sunset         | -                | sunset        | 日落时间 |

#### 指数数据映射

| 和风天气API字段 | WeatherWidget字段 | WeatherTV字段 | 说明 |
|----------------|------------------|---------------|------|
| date           | -                | -             | 预报日期 |
| type           | -                | -             | 指数类型ID |
| name           | -                | typechineseStr | 指数名称 |
| level          | -                | typeval       | 指数等级 |
| category       | -                | -             | 指数级别名称 |
| text           | -                | typeinfo      | 指数详细描述 |

### 2. 代码注释策略

**API多余字段处理**：
* 使用 `// API字段：字段名 - 描述` 格式注释
* 说明字段用途和处理策略
* 标注是否在未来版本中可能使用

**示例**：
```typescript
// API字段：pop - 降水概率，WeatherTV不需要此字段
// API字段：dew - 露点温度，WeatherTV不需要此字段
// API字段：cloud - 云量，WeatherTV不需要此字段
```

### 3. 请求分流处理方案

**分离策略**：
* `fetchWeatherDataForWeatherTV()`：专门处理WeatherTV的数据请求
* `fetchWeatherDataForWeatherWidget()`：专门处理WeatherWidget的数据请求
* `transformWeatherData()`：通用数据转换函数

**实现优势**：
* 减少分支判断，提高代码可读性
* 便于单独维护和测试
* 支持不同应用的特殊需求

## 适配计划

### 1. 调整数据转换逻辑

修改 `src/services/data-transform.ts` 文件，实现以下调整：

#### 1.1 增强天气代码映射（已更新 - 含Fallback规则）

**目标**：确保天气代码映射与WeatherWidget期望的代码完全匹配，处理QWeather与Widget的差异

**QWeather 到 WeatherWidget 天气代码映射表**：

| QWeather代码 | QWeather描述 | Widget代码 | Widget描述 | 映射类型 |
|-------------|-------------|-----------|-----------|---------|
| 100 | 晴 | 0 | Sunny | 正常 |
| 101 | 多云 | 1 | Overcast | 正常 |
| 102 | 少云 | 2 | Cloudy | 正常 |
| 103 | 晴间多云 | 3 | 晴间多云 | 正常 |
| 104 | 阴 | 4 | Thundery shower | 正常 |
| 150-152 | 晴/多云/阴(夜) | 0-4 | 同上 | 正常 |
| 300-318 | 雨(各种级别) | 3-26 | Shower/Thundery/Rain | 正常 |
| 400-407 | 雪(各种级别) | 11-17 | Snow storm/... | 正常 |
| 500-502 | 雾/薄雾 | 35-37 | Fog/Light fog | 正常 |
| **503-508** | **浓雾/强浓雾/特强浓雾** | **37** | **Light fog** | **Fallback** |
| **600** | **轻风/微风** | **2** | **Cloudy(多云)** | **Fallback** |
| **601** | **和风** | **2** | **Cloudy(多云)** | **Fallback** |
| **602** | **强风/劲风** | **33** | **Squall(飑)** | **Fallback** |
| **700-708** | **轻度霾-严重霾** | **18** | **Fog(雾)** | **Fallback** |
| **800-804** | **浮尘/扬沙/沙尘暴** | **21/30-32** | **Sandstorm/Dust/Sand** | **Fallback** |

**Fallback 规则说明**：

1. **503-508 (浓雾系列)** → 映射到 **37 (Light fog)**
   - Widget只有2种雾类型，QWeather有9种
   - 超出范围的统一映射到最浓的雾(37)

2. **600-602 (风)** → 根据风力大小映射
   - **600 (轻风/微风)** → **2 (Cloudy/多云)** - 风力较小
   - **601 (和风)** → **2 (Cloudy/多云)** - 中等风力
   - **602 (强风/劲风)** → **33 (Squall/飑)** - 风力较大，用"飑"表示

3. **700-708 (霾)** → 映射到 **18 (Fog/雾)**
   - Widget没有"霾"类型
   - 视觉上最接近的是"雾"

4. **800-804 (沙尘)** → 映射到 **21/30-32 (沙尘相关)**
   - 800 → 21 (Sandstorm/沙尘暴)
   - 801 → 30 (Dust/浮尘)
   - 802 → 31 (Sand/扬沙)
   - 803-804 → 32 (Strong sandstorm/强沙尘暴)

**关键约束**：
- Widget天气代码数组长度为38（索引0-37）
- 任何超出37的代码都会导致`ArrayIndexOutOfBoundsException`
- 所有Fallback映射必须确保最终代码在0-37范围内

#### 1.2 调整当前天气XML结构

* 保持现有的XML结构，但确保字段名称和格式与WeatherWidget期望一致
* 确保温度格式正确（例如，不包含单位）

#### 1.3 重构天气预报XML结构

* 修改 `generateForecastXml` 方法，生成符合WeatherWidget期望的结构
* 为每一天的预报添加正确的字段：startTime、endTime、week、condition、tempMin、tempMax
* 确保只返回两天的预报数据（WeatherWidget只显示未来两天）

#### 1.4 优化重复逻辑

* 创建共享方法，消除重复逻辑：
  * `ensureXmlLength(xml, appType)`：统一处理XML长度填充
  * `addAdditionalData(xml, data, appType)`：统一添加额外数据
  * `isWeatherTVApp(appType)`：统一应用类型判断

### 2. 优化数据获取逻辑

修改 `src/services/weather-api.ts` 文件，确保获取的数据包含所有需要的字段：

#### 2.1 增强城市信息获取

* 确保获取完整的城市信息，包括名称、ID等
* 处理城市名称查询的子地区选择逻辑

#### 2.2 优化天气数据获取

* 确保获取的天气数据包含所有需要的字段，例如星期、详细时间等
* 集成指数和多天预报API

#### 2.3 实现请求分流

* 实现 `fetchWeatherDataForWeatherTV()` 和 `fetchWeatherDataForWeatherWidget()` 方法
* 优化数据缓存机制，减少重复请求

### 3. 测试适配效果

#### 3.1 API测试

* 测试当前天气API响应：`/api/weather?sname=北京&dataType=ztev3widgetskall`
* 测试天气预报API响应：`/api/weather?sname=北京&dataType=ztewidgetcf`
* 测试指数数据API响应：`/api/weather?sname=北京&dataType=indices`
* 验证返回的XML结构是否符合WeatherWidget期望

#### 3.2 数据结构验证

* 验证当前天气数据字段是否完整
* 验证天气预报数据字段是否完整
* 验证指数数据字段是否完整
* 验证天气代码映射是否正确

### 4. 文档更新

#### 4.1 更新技术文档

* 更新 `WeatherWidgetAPI适配说明.md`，详细说明适配后的API响应结构
* 更新 `WeatherWidget数据流转分析.md`，添加指数和多天预报的相关表述
* 记录WeatherWidget数据结构与API响应的对应关系

## 预期成果

1. **适配后的API响应**：

   * 当前天气API返回符合WeatherWidget期望的XML结构
   * 天气预报API返回符合WeatherWidget期望的XML结构
   * 指数数据API返回符合WeatherTV期望的结构

2. **数据结构匹配**：

   * WeatherWidget能够正确解析和显示API返回的天气数据
   * WeatherTV能够正确解析和显示API返回的天气数据
   * 所有必要的字段都包含在API响应中

3. **API集成效果**：

   * 成功集成和风天气API的逐小时预报
   * 成功集成和风天气API的每日预报
   * 成功集成和风天气API的天气指数

4. **性能优化效果**：

   * 消除重复逻辑，提高代码可维护性
   * 优化请求处理，提高响应速度
   * 减少API调用次数，降低网络开销

5. **文档完善**：

   * 提供详细的API文档，说明适配后的响应结构
   * 记录数据结构适配的关键决策
   * 提供完整的API集成说明

## 实施步骤

1. **分析WeatherWidget数据结构**：仔细研究WeatherWidget的代码，确认其数据结构需求
2. **修改数据转换逻辑**：调整data-transform.ts文件，实现数据结构适配和重复逻辑优化
3. **优化数据获取**：确保weather-api.ts能够获取所有需要的数据，实现请求分流
4. **集成API**：实现和风天气API的集成，支持指数和多天预报
5. **测试API响应**：验证适配后的API响应是否符合要求
6. **更新文档**：更新相关文档，说明适配后的API结构和集成效果
7. **验证系统完整性**：确保整个系统能够正常运行，无错误

## 技术要点

* **XML结构匹配**：确保返回的XML结构与WeatherWidget期望的结构完全一致
* **字段名称一致性**：确保所有字段名称与WeatherWidget期望的名称一致
* **数据格式正确性**：确保温度、天气代码等数据的格式正确
* **错误处理**：添加适当的错误处理，确保API在各种情况下都能返回有效的响应
* **API集成**：正确集成和风天气API，处理API响应和错误
* **代码优化**：消除重复逻辑，提高代码可维护性
* **请求分流**：实现不同应用的请求分离处理

## 技术细节

### 1. 城市信息处理

**城市名称查询逻辑**：
* 使用 `https://${config.qweather.apiHost}/geo/v2/city/lookup` API查询城市
* 处理返回的子地区数组，选择最合适的地区
* 优先选择行政级别较高的地区

**位置信息来源**：
* 从 `WeatherSetting` 中获取"主城市"信息（`NowCityName`/`NowCityId`）
* 这些信息存储在配置数据库或 `SharedPreferences` 中
* `WeatherService` 通过 `getCityNamesAndIds()` 方法读取这些信息

### 2. 数据缓存机制

**缓存策略**：
* 实现内存缓存，减少重复API调用
* 考虑添加本地存储缓存，提高离线访问能力
* 设置合理的缓存过期时间，确保数据时效性

### 3. 性能优化

**优化方向**：
* 减少API调用次数，合并相关请求
* 优化数据转换逻辑，提高处理速度
* 实现异步处理，避免阻塞主线程
* 使用适当的数据结构，提高数据访问效率