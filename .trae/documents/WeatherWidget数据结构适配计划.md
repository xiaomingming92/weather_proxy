# WeatherWidget数据结构适配计划

## 目标

调整weather\_proxy的响应数据结构，使其与WeatherWidget期望的数据格式完全匹配，确保WeatherWidget能够正确解析和显示天气数据。

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

### 当前weather\_proxy实现

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

## 适配计划

### 1. 调整数据转换逻辑

修改 `src/services/data-transform.ts` 文件，实现以下调整：

#### 1.1 增强天气代码映射

* 确保天气代码映射与WeatherWidget期望的代码完全匹配

* 添加缺失的天气代码映射

#### 1.2 调整当前天气XML结构

* 保持现有的XML结构，但确保字段名称和格式与WeatherWidget期望一致

* 确保温度格式正确（例如，不包含单位）

#### 1.3 重构天气预报XML结构

* 修改 `generateForecastXml` 方法，生成符合WeatherWidget期望的结构

* 为每一天的预报添加正确的字段：startTime、endTime、week、condition、tempMin、tempMax

* 确保只返回两天的预报数据（WeatherWidget只显示未来两天）

### 2. 优化数据获取逻辑

修改 `src/services/weather-api.ts` 文件，确保获取的数据包含所有需要的字段：

#### 2.1 增强城市信息获取

* 确保获取完整的城市信息，包括名称、ID等

#### 2.2 优化天气数据获取

* 确保获取的天气数据包含所有需要的字段，例如星期、详细时间等

### 3. 测试适配效果

#### 3.1 API测试

* 测试当前天气API响应：`/api/weather?sname=北京&dataType=ztev3widgetskall`

* 测试天气预报API响应：`/api/weather?sname=北京&dataType=ztewidgetcf`

* 验证返回的XML结构是否符合WeatherWidget期望

#### 3.2 数据结构验证

* 验证当前天气数据字段是否完整

* 验证天气预报数据字段是否完整

* 验证天气代码映射是否正确

### 4. 文档更新

#### 4.1 更新技术文档

* 创建新的文档，详细说明适配后的API响应结构

* 记录WeatherWidget数据结构与API响应的对应关系

## 预期成果

1. **适配后的API响应**：

   * 当前天气API返回符合WeatherWidget期望的XML结构

   * 天气预报API返回符合WeatherWidget期望的XML结构

2. **数据结构匹配**：

   * WeatherWidget能够正确解析和显示API返回的天气数据

   * 所有必要的字段都包含在API响应中

3. **文档完善**：

   * 提供详细的API文档，说明适配后的响应结构

   * 记录数据结构适配的关键决策

## 实施步骤

1. **分析WeatherWidget数据结构**：仔细研究WeatherWidget的代码，确认其数据结构需求
2. **修改数据转换逻辑**：调整data-transform.ts文件，实现数据结构适配
3. **优化数据获取**：确保weather-api.ts能够获取所有需要的数据
4. **测试API响应**：验证适配后的API响应是否符合要求
5. **更新文档**：创建新的文档，说明适配后的API结构

## 技术要点

* **XML结构匹配**：确保返回的XML结构与WeatherWidget期望的结构完全一致

* **字段名称一致性**：确保所有字段名称与WeatherWidget期望的名称一致

* **数据格式正确性**：确保温度、天气代码等数据的格式正确

* **错误处理**：添加适当的错误处理，确保API在各种情况下都能返回有效的响应

* 数据请求的除了区分是来自WeatherWidget、WeatherTV之外，是不是要区分入参是城市名称\城市的默认坐标，或者是精确的定位坐标？这个事情我没明白

* 如果是城市名称查询，qweather的\`

  ```typescript
  `https://${config.qweather.apiHost}/geo/v2/city/lookup`;
  ```

  \`返回的数据是这个城市的关联子地区的数组吧，要如何确认是哪个子地区还是默认地区？

* 还有我看请求的数据没有做地区的持久化，难道是app端做了？也是不明白

