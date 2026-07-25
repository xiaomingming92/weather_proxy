# WeatherWidget数据流转分析

## 整体架构

WeatherWidget是一个天气小部件，通过ContentProvider获取天气数据，并在小部件上显示当前天气和未来两天的天气预报。

### 核心组件

| 组件 | 职责 |
|-----|------|
| TypeBWeatherWidget | 小部件主类，负责发起查询和更新UI |
| QueryHandler | 处理数据库查询结果，解析天气数据 |
| WeatherProvider | ContentProvider，提供天气数据的URI |
| WeatherCurrentCondition | 当前天气数据模型 |
| WeatherForecastCondition | 天气预报数据模型 |

### 扩展组件（第二阶段新增）

| 组件 | 职责 |
|-----|------|
| IndicesHandler | 处理天气指数数据的解析和存储 |
| MultiDayForecastHandler | 处理多天天气预报数据的解析和存储 |
| WeatherIndicesCondition | 天气指数数据模型 |
| WeatherMultiDayForecastCondition | 多天天气预报数据模型 |

## 触发机制

### 1. 初始化触发

WeatherWidget的初始化过程涉及多个组件的创建和初始化：

1. 调用父类构造函数（ZTEWidget2DBase）
2. 初始化标志位（firstStart = true）
3. 创建Handler（mHandler用于线程通信）
4. 初始化触摸、时间、动画相关变量
5. 创建city_weather ArrayList缓存
6. 创建刷新任务（mRefreshTask）
7. 创建延迟查询Handler（mDelayQueryHandler）
8. 创建广播接收器（mDateTimeReceiver）
9. 创建内容观察者（mWeatherObserver）
10. 初始化扩展组件（indicesHandler, multiDayForecastHandler）

### 2. 定时触发

WeatherWidget通过AlarmManager或Handler实现定期天气更新。扩展后同时触发指数和多天预报的更新。

### 3. 手动触发

用户可通过点击小部件或进入设置页面手动触发天气更新。扩展后手动触发会同时更新指数和多天预报数据。

## 请求接口

### ContentProvider URI

```
content://com.android.ztewidget2d.weather/weather
```

### 扩展URI（第二阶段新增）

```
content://com.android.ztewidget2d.weather/indices       // 指数数据
content://com.android.ztewidget2d.weather/forecast/multi // 多天预报
```

### 查询参数

WeatherWidget主要使用城市ID作为查询参数：

1. **位置信息来源**: 从WeatherSetting中获取"主城市"信息（NowCityName/NowCityId）
2. **URI构建**:
   - 标准查询: `content://com.android.ztewidget2d.weather/weather`
   - 按ID查询: `content://com.android.ztewidget2d.weather/weather/{cityId}`
   - 指数查询: `content://com.android.ztewidget2d.weather/indices/{cityId}`
   - 多天预报查询: `content://com.android.ztewidget2d.weather/forecast/multi/{cityId}`

### 配置城市参数逻辑

1. **获取主城市**: `WeatherSetting.getMainCity()`从配置数据库查询
2. **存储配置**: 城市信息存储在SharedPreferences中（NowCityId/NowCityName）
3. **使用配置**: `WeatherService.getCityNamesAndIds()`读取并遍历城市列表

## 数据流转

### 1. 基础天气数据流转

```
TypeBWeatherWidget
    ↓ 发起查询
QueryHandler
    ↓ 执行查询
WeatherProvider
    ↓ 查询数据库/API
代理服务/QWeather API
    ↓ 返回数据
WeatherProvider
    ↓ 解析结果
QueryHandler
    ↓ 更新UI
TypeBWeatherWidget
```

### 2. 指数数据流转（扩展）

```
TypeBWeatherWidget
    ↓ 发起指数查询
IndicesHandler
    ↓ 执行指数查询
WeatherProvider
    ↓ 调用指数API
代理服务/QWeather指数API
    ↓ 返回指数数据
WeatherProvider
    ↓ 解析指数结果
IndicesHandler
    ↓ 更新指数UI
TypeBWeatherWidget
```

### 3. 多天预报数据流转（扩展）

```
TypeBWeatherWidget
    ↓ 发起多天预报查询
MultiDayForecastHandler
    ↓ 执行多天预报查询
WeatherProvider
    ↓ 调用每日预报API
代理服务/QWeather每日预报API
    ↓ 返回多天预报数据
WeatherProvider
    ↓ 解析多天预报结果
MultiDayForecastHandler
    ↓ 更新多天预报UI
TypeBWeatherWidget
```

## 数据结构

### 1. 当前天气数据模型（WeatherCurrentCondition）

| 字段 | 类型 | 说明 |
|-----|------|------|
| cityName | String | 城市名称 |
| reportTime | String | 报告时间 |
| condition | int | 天气代码 |
| temp | String | 当前温度 |

### 2. 天气预报数据模型（WeatherForecastCondition）

| 字段 | 类型 | 说明 |
|-----|------|------|
| cityName | String | 城市名称 |
| reportTime | String | 报告时间 |
| startTime1/endTime1 | String | 第一天起止时间 |
| week1 | String | 第一天星期 |
| condition1 | int | 第一天天气代码 |
| tempMin1/tempMax1 | String | 第一天温度范围 |
| startTime2/endTime2 | String | 第二天起止时间 |
| week2 | String | 第二天星期 |
| condition2 | int | 第二天天气代码 |
| tempMin2/tempMax2 | String | 第二天温度范围 |

### 3. WeatherItem内部数据结构

| 字段 | 类型 | 说明 |
|-----|------|------|
| cityName | String | 城市名称 |
| curCondition | int | 当前天气代码 |
| curTemp | String | 当前温度 |
| maxTemp | String | 最高温度 |
| minTemp | String | 最低温度 |
| refreshTime | String | 刷新时间 |

### 4. 天气指数数据模型（WeatherIndicesCondition）- 扩展

| 字段 | 类型 | 说明 |
|-----|------|------|
| cityName | String | 城市名称 |
| reportTime | String | 报告时间 |
| indicesName | String | 指数名称 |
| indicesLevel | int | 指数等级 |
| indicesDesc | String | 指数描述 |
| indicesCategory | String | 指数类别 |

### 5. 多天预报数据模型（WeatherMultiDayForecastCondition）- 扩展

| 字段 | 类型 | 说明 |
|-----|------|------|
| cityName | String | 城市名称 |
| reportTime | String | 报告时间 |
| forecastDate | String | 预报日期 |
| sunrise | String | 日出时间 |
| sunset | String | 日落时间 |
| tempMax | String | 最高温度 |
| tempMin | String | 最低温度 |
| condition | int | 天气代码 |

## 数据缓存机制

### 1. 数据库缓存

WeatherWidget使用SQLite数据库缓存天气数据，ContentProvider从数据库中读取数据。

### 2. 内存缓存

使用`city_weather` ArrayList缓存解析后的天气数据：

```java
iget-object v6, v6, Lcom/zte/WeatherWidget/TypeBWeatherWidget;->city_weather:Ljava/util/ArrayList;
invoke-virtual {v6}, Ljava/util/ArrayList;->clear()V
```

### 3. 扩展缓存（第二阶段新增）

- **indicesCache**: 缓存指数数据的ArrayList
- **multiDayForecastCache**: 缓存多天预报数据的ArrayList

## 与代理服务的交互

### 数据流转流程

1. **WeatherWidget请求**: 通过ContentProvider请求天气数据
2. **ContentProvider处理**: 调用代理服务获取数据
3. **代理服务请求**: 调用QWeather API获取天气数据
4. **数据转换**: 代理服务将QWeather数据转换为WeatherWidget期望格式
5. **数据返回**: 代理服务返回转换后的数据
6. **数据显示**: WeatherWidget更新UI

### API集成

| API类型 | 接口地址 | 用途 |
|--------|---------|------|
| 逐小时预报 | /v7/weather/{hours} | 3小时预报数据 |
| 每日预报 | /v7/weather/{days} | 多天预报数据 |
| 天气指数 | /v7/indices/{days} | 生活指数数据 |

## 技术细节

### QueryHandler工作原理

继承自AsyncQueryHandler，在后台线程执行数据库查询：

1. **发起查询**: 通过startQuery方法
2. **处理结果**: 在onQueryComplete方法中
3. **解析数据**: 从Cursor读取并解析为WeatherItem
4. **更新UI**: 将数据传递给TypeBWeatherWidget

### WeatherProvider数据库操作

| 操作 | 方法 | 说明 |
|-----|------|------|
| 初始化 | onCreate | 初始化SQLite数据库 |
| 查询 | query | 执行数据库查询 |
| 插入 | insert | 插入新的天气数据 |
| 更新 | update | 更新天气数据 |
| 删除 | delete | 删除天气数据 |

### 错误处理机制

1. **空数据处理**: 查询结果为空时创建默认WeatherItem
2. **异常捕获**: 捕获ActivityNotFoundException和SecurityException
3. **日志记录**: 使用Log.e记录错误信息
