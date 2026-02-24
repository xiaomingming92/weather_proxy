# 第二阶段：WeatherTV精准适配

## 背景

第一阶段搭建的基础服务主要面向WeatherWidget的简单XML格式。第二阶段需要完整支持WeatherTV_V880+的复杂XML结构，包括站点信息、3小时预报、天气指数等完整数据。

## WeatherTV XML结构要求

### 关键约束

1. **1500字符最小长度**: WeatherTV硬性要求，通过完整数据结构自然满足
2. **SK节点Info属性**: 必须包含全部7个属性（Weather, Temperature, WindDir, WindPower, WindSpeed, Humidity, Pressure）
3. **ZU节点必须存在**: 否则点击"指数"按钮会导致FC
4. **风向数字代码**: 中文风向需转换为0-9数字代码

### 完整XML结构示例

```xml
<?xml version="1.0" encoding="UTF-8"?>
<CityMeteor CityName="北京">
    <StationInfo 
        Stationid="54511" 
        Longitude="116.47" 
        Latitude="39.80" 
        Postcode="" 
        Sunrise="2024-01-01 06:45" 
        Sunset="2024-01-01 17:30" />
    
    <SK ReportTime="2024-01-01 12:00:00">
        <Info 
            Weather="0" 
            Temperature="25" 
            WindDir="2" 
            WindPower="3" 
            WindSpeed="10" 
            Humidity="50" 
            Pressure="1013" />
    </SK>
    
    <CF ReportTime="2024-01-01 12:00:00">
        <Period 
            Timestart="2024-01-01 08:00:00" 
            Timeend="2024-01-01 20:00:00" 
            Weather="0" 
            WindDir="2" 
            WindPower="3" 
            Tmin="15" 
            Tmax="25" 
            Week="1" />
        <!-- 至少6个Period节点 -->
    </CF>
    
    <ZU ReportTime="2024-01-01 12:00:00">
        <Type Name="GM" Val="1">各项气象条件适宜，发生感冒机率较低。</Type>
        <Type Name="CY" Val="3">建议穿薄型T恤衫。</Type>
        <Type Name="XC" Val="4">不宜洗车。</Type>
        <Type Name="ZWX" Val="2">紫外线强度较弱。</Type>
        <Type Name="YD" Val="3">较不宜运动。</Type>
    </ZU>
    
    <CF3h ReportTime="2024-01-01 12:00:00">
        <Period 
            Timestart="2024-01-01 12:00:00" 
            Timeend="2024-01-01 15:00:00" 
            Weather="0" 
            WindDir="2" 
            WindPower="3" />
        <!-- 更多3小时预报节点 -->
    </CF3h>
    
    <AdvFile>
        <Adv Type="CF" Flag="1" />
        <Adv Type="SK" Flag="1" />
        <Adv Type="ZU" Flag="1" />
    </AdvFile>
</CityMeteor>
```

## 任务清单

### Phase 1: ORM适配

- [x] **Task ORM-1**: 更新Prisma Schema（City添加站点信息字段）
  - 添加字段：stationId, longitude, latitude, postcode, sunrise, sunset
  
- [x] **Task ORM-2**: 更新WeatherData模型
  - 添加字段：appType, cacheDuration
  - 修改索引：@@unique([cityId, dataType, appType])
  
- [x] **Task ORM-3**: 创建CachePolicy模型
  - 字段：id, dataType, appType, duration, description
  
- [x] **Task ORM-4**: 执行数据库迁移
  - 命令：`npx prisma migrate dev --name add_weathertv_support`
  
- [x] **Task ORM-5**: 更新TypeScript类型定义
  - 扩展DataType枚举
  - 扩展WeatherData接口

### Phase 2: 策略模式架构

- [x] **Task 0**: 设计策略模式架构
  - 创建策略接口：`WeatherDataStrategy`
  - WeatherTV策略：`WeatherTVMainStrategy`, `WeatherTVWidgetSKStrategy`, `WeatherTVWidgetCFStrategy`
  - WeatherWidget策略：`WeatherWidgetCurrentStrategy`, `WeatherWidgetForecastStrategy`

### Phase 3: XML结构修复

- [x] **Task 1**: 修正SK节点结构
  - Info改为SK的子节点
  - 确保Info包含所有7个必需属性

- [x] **Task 2**: 修正CF3h节点标签
  - 将`Cf3hPart_TimeScale`改为`Period`

- [x] **Task 3**: 修正ZU节点结构
  - 直接包含Type子节点，不需要Period包装
  - 始终生成ZU节点（使用默认数据避免FC）

- [x] **Task 4**: 添加StationInfo节点生成
  - 字段：Stationid, Longitude, Latitude, Postcode, Sunrise, Sunset

- [x] **Task 5**: 添加AdvFile节点生成
  - 生成广告标识节点

- [x] **Task 6**: 为CF Period添加Week属性
  - 根据日期计算星期（1-7）

- [x] **Task 7**: 移除所有长度填充逻辑
  - 删除`addLengthPadding`方法
  - 通过完整数据结构自然满足1500字符要求

- [x] **Task 12**: 添加风向字段转换
  - 中文风向到数字代码映射（0-9）
  - 应用到SK、CF、CF3h节点

### Phase 4: 新增接口支持

- [x] **Task 8**: 新增WidgetSK格式生成方法（dataType=ztewidgetsk）
  - 简化格式：CityMeteor > SK > Info

- [x] **Task 9**: 新增WidgetCF格式生成方法（dataType=ztewidgetcf）
  - 简化格式：CityMeteor > CF > Period

- [x] **Task 10**: 新增城市列表格式生成方法（flag=allcity）
  - 格式：CityList > Province > District

## 数据类型定义

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

## 风向转换映射

| 数字代码 | 中文风向 |
|---------|---------|
| 0 | 无/无风向 |
| 1 | 东北风 |
| 2 | 东风 |
| 3 | 东南风 |
| 4 | 南风 |
| 5 | 西南风 |
| 6 | 西风 |
| 7 | 西北风 |
| 8 | 北风 |
| 9 | 旋风 |

## 新增API接口

### 1. 逐小时预报API

**接口地址**: `/v7/weather/{hours}`

**入参**:
- `hours`: 预报小时数（24h/72h/168h）
- `location`: 城市ID或经纬度

**出参**:
- `hourly`: 逐小时预报数据数组
- 包含：温度、天气状况、风力、风速、风向、相对湿度、大气压强

### 2. 每日预报API

**接口地址**: `/v7/weather/{days}`

**入参**:
- `days`: 预报天数（3d/7d/10d/15d/30d）
- `location`: 城市ID或经纬度

**出参**:
- `daily`: 每日预报数据数组
- 包含：日出日落、最高最低温度、天气状况、风力、紫外线强度等

### 3. 天气指数API

**接口地址**: `/v7/indices/{days}`

**入参**:
- `days`: 预报天数（1d/3d）
- `location`: 城市ID或经纬度
- `type`: 生活指数类型ID

**出参**:
- `daily`: 指数预报数据数组
- 包含：预报日期、指数类型ID、指数名称、指数等级、指数详细描述

## 数据映射关系

### 和风天气API → WeatherTV

| 和风天气字段 | WeatherTV属性 | 说明 |
|-------------|--------------|------|
| temp | Temperature | 温度 |
| icon | Weather | 天气图标代码（需转换） |
| humidity | Humidity | 相对湿度 |
| pressure | Pressure | 大气压强 |
| windDir | WindDir | 风向（需转换为数字） |
| windSpeed | WindSpeed | 风速 |
| windScale | WindPower | 风力等级 |
| fxDate | TimeBegin/TimeOver | 预报日期 |
| tempMax | Tmax | 最高温度 |
| tempMin | Tmin | 最低温度 |
| sunrise | Sunrise | 日出时间 |
| sunset | Sunset | 日落时间 |

## 成果

- 完整的WeatherTV XML数据结构支持
- 策略模式分离WeatherTV和WeatherWidget处理逻辑
- 支持3小时预报、天气指数、日出日落等完整数据
- 移除长度填充，通过真实数据满足1500字符要求
- 完整的风向数字代码转换
