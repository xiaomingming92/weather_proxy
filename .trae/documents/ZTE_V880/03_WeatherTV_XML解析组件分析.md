# WeatherTV XML解析组件分析

## 概述

WeatherTV_V880+使用SAX解析器处理XML数据，包含多个Handler类分别处理不同类型的XML结构。

## Handler类（XML解析器）

### 1. CityDataHandler

**文件**: `hf/weather/dataclass/CityDataHandler.smali`

**处理的XML标签和属性**:

| 标签 | 属性 | 说明 |
|-----|------|------|
| CityMeteor | CityName | 城市名称 |
| StationInfo | Latitude, Longitude, Postcode, Sunrise, Sunset, Stationid | 站点信息 |
| CF | ReportTime | 天气预报开始 |
| Period (CF内) | Timestart, Timeend, Weather, WindDir, WindPower, Tmin, Tmax, Week | 预报时段 |
| SK | ReportTime | 实况天气开始 |
| Info (SK内) | **Weather**, **Temperature**, **WindDir**, **WindPower**, **WindSpeed**, **Humidity**, **Pressure** | 实况详情（7个属性全部必需） |
| ZU | ReportTime | 指数预报开始 |
| Type (ZU内) | **Name**, **Val** | 指数类型（ZU直接包含Type子节点，不需要Period包装） |
| CF3h | ReportTime | 3小时预报开始 |
| Period (CF3h内) | Timestart, Timeend, Weather, WindDir, WindPower | 3小时时段 |
| AdvFile | - | 广告文件 |
| Adv | Type, Flag | 广告类型(CF/SK/ZU) |

**关键约束**:
- SK节点的Info必须包含全部7个属性
- ZU节点直接包含Type子节点，不需要Period包装
- ZU节点必须始终存在，否则点击"指数"按钮会导致FC

### 2. WidgetSKHandler

**文件**: `hf/weather/widgetdata/WidgetSKHandler.smali`

**处理的XML标签和属性**:

| 标签 | 属性 | 说明 |
|-----|------|------|
| CityMeteor | CityName | 城市名称 |
| SK | ReportTime | 实况时间 |
| Info | Weather, Temperature | 天气和温度 |

### 3. WidgetCFHandler

**文件**: `hf/weather/widgetdata/WidgetCFHandler.smali`

**处理的XML标签和属性**:

| 标签 | 属性 | 说明 |
|-----|------|------|
| CityMeteor | CityName | 城市名称 |
| CF | ReportTime | 预报时间 |
| Period | Timestart, Timeend, Tmax, Tmin, Weather | 预报时段 |

### 4. ChCityListHandler

**文件**: `hf/weather/citylist/ChCityListHandler.smali`

**处理的XML标签和属性**:

| 标签 | 属性 | 说明 |
|-----|------|------|
| Province | ch | 省份名称 |
| District | ch | 城市名称 |

## 数据类（Data Class）结构

### 1. CityData

```
CityData
├── name: String                    // 城市名称
├── Latitude: double                // 纬度
├── Longitude: double               // 经度
├── postcode: String                // 邮编
├── stationid: int                  // 站点ID
├── sunrise: Date                   // 日出时间
├── sunset: Date                    // 日落时间
├── cfPart: CfPart                  // 天气预报
├── skPart: SkPart                  // 实况天气
├── zuPart: ZuPart                  // 指数预报
├── cf3hPart: Cf3hPart              // 3小时预报
└── advertisement: Advertisement    // 广告信息
```

### 2. SkPart（实况天气）

```
SkPart
├── repotrtime: String      // 报告时间
├── Weather: int            // 天气代码 (0-35)
├── Temperature: String     // 温度
├── WindDir: int            // 风向 (0-9)
├── WindPower: int          // 风力 (0-9)
├── WindSpeed: int          // 风速
├── Humidity: String        // 湿度
└── Pressure: String        // 气压
```

### 3. CfPart（天气预报）

```
CfPart
├── ReportTime: String                          // 报告时间
└── allTimeReport: ArrayList<CfPart_TimeScale>  // 时段列表
```

### 4. CfPart_TimeScale（预报时段）

```
CfPart_TimeScale
├── TimeBegin: String       // 开始时间
├── TimeOver: String        // 结束时间
├── Weather: int            // 天气代码
├── WindDir: int            // 风向
├── WindPower: int          // 风力
├── Tmin: String            // 最低温度
├── Tmax: String            // 最高温度
├── Week: String            // 星期
├── Temperature: String     // 温度
└── low: boolean            // 是否低温
```

### 5. Cf3hPart（3小时预报）

```
Cf3hPart
├── ReportTime: String                            // 报告时间
└── allTimeReport: ArrayList<Cf3hPart_TimeScale>  // 时段列表
```

### 6. Cf3hPart_TimeScale（3小时时段）

```
Cf3hPart_TimeScale
├── TimeBegin: String       // 开始时间
├── TimeOver: String        // 结束时间
├── Weather: int            // 天气代码
├── WindDir: int            // 风向
├── WindPower: int          // 风力
└── Temperature: int        // 温度
```

### 7. ZuPart（指数预报）

```
ZuPart
├── reporttime: String              // 报告时间
└── allzuTypes: ArrayList<ZuType>   // 指数类型列表
```

### 8. ZuType（指数类型）

```
ZuType
├── typename: String         // 类型名称 (GM/XC/ZWX/CY/YD)
├── typeval: int             // 类型值
├── typevalStr: String       // 类型值字符串
├── typeinfo: String         // 类型信息
├── typechineseStr: String   // 中文名称
└── typeimg: int             // 图片资源ID
```

**支持的指数类型**:
- GM - 感冒指数
- XC - 洗车指数
- ZWX - 紫外线指数
- CY - 穿衣指数
- YD - 运动指数

### 9. WidgetSK（Widget实况）

```
WidgetSK
├── cityname: String        // 城市名称
├── reporttime: String      // 报告时间
├── weather: String         // 天气代码
└── temperature: String     // 温度
```

### 10. WidgetCF（Widget预报）

```
WidgetCF
├── cityname: String                      // 城市名称
├── reporttime: String                    // 报告时间
└── cfperiods: ArrayList<WidgetCFPeriod>  // 预报时段列表
```

### 11. WidgetCFPeriod（Widget预报时段）

```
WidgetCFPeriod
├── timebg: String          // 开始时间
├── timeend: String         // 结束时间
├── Tmax: String            // 最高温度
├── Tmin: String            // 最低温度
└── weather: String         // 天气代码
```

## Network类（网络请求）

### 1. Network

**文件**: `hf/weather/network/Network.smali`

| 方法 | URL | 参数 | 用途 |
|-----|-----|------|------|
| getCityData() | http://8.153.104.150/api/weather | dataType=zte, sname, code=1D765B | 获取城市完整天气数据 |
| getCityList() | http://8.153.104.150/api/weather | flag=allcity | 获取城市列表 |

### 2. WidgetNetwork

**文件**: `hf/weather/network/WidgetNetwork.smali`

| 方法 | URL | 参数 | 用途 |
|-----|-----|------|------|
| getSKData() | http://8.153.104.150/api/weather | dataType=ztewidgetsk, sname, code=1D765B | Widget实况数据 |
| getCFData() | http://8.153.104.150/api/weather | dataType=ztewidgetcf, sname, code=1D765B | Widget预报数据 |

## 关键发现

### 1. 1500字符长度要求

**来源**: `Network.smali L354`

```smali
const/16 v9, 0x5dc  # 1500
if-ge v8, v9, :cond_0
const-string v7, "err:length"
```

### 2. SK节点Info属性要求

**来源**: `CityDataHandler.smali L715-787`

- 所有7个属性都是必需的：Weather, Temperature, WindDir, WindPower, WindSpeed, Humidity, Pressure
- 缺少任何一个属性都会导致解析后数据不完整

### 3. ZU节点结构要求

**来源**: `CityDataHandler.smali L636-665, L794-838`

- ZU节点直接包含Type子节点，不需要Period包装
- 每个Type必须有Name和Val属性
- ZU节点必须始终存在，否则点击"指数"按钮会导致FC

### 4. 风向字段转换映射

**来源**: `DecodeData.smali L403-502, L2470-2569`

| 数字代码 | 中文风向 | 说明 |
|---------|---------|------|
| 0 | 无/无风向 | 无持续风向 |
| 1 | 东北风 | 东北方向 |
| 2 | 东风 | 正东方向 |
| 3 | 东南风 | 东南方向 |
| 4 | 南风 | 正南方向 |
| 5 | 西南风 | 西南方向 |
| 6 | 西风 | 正西方向 |
| 7 | 西北风 | 西北方向 |
| 8 | 北风 | 正北方向 |
| 9 | 旋风 | 旋转风 |

**重要说明**: 和风天气API返回的`windDir`是中文风向（如"东南风"），但WeatherTV期望的是数字代码（0-9）。

### 5. 和风天气API字段映射

| 和风天气字段 | WeatherTV属性 | 说明 |
|-------------|--------------|------|
| temp | Temperature | 温度 |
| icon | Weather | 天气图标代码（需要转换） |
| humidity | Humidity | 相对湿度 |
| pressure | Pressure | 大气压强 |
| windDir | WindDir | 风向（需要转换） |
| windSpeed | WindSpeed | 风速 |
| windScale | WindPower | 风力等级 |

## XML数据结构示例

### 1. 主天气数据接口（dataType=zte）

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
        <!-- 更多Period节点（至少6个） -->
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

长度要求: ≥ 1500字符（0x5dc）

### 2. Widget实况接口（dataType=ztewidgetsk）

```xml
<CityMeteor CityName="北京">
    <SK ReportTime="2024-01-01 12:00:00">
        <Info Weather="0" Temperature="25" />
    </SK>
</CityMeteor>
```

### 3. Widget预报接口（dataType=ztewidgetcf）

```xml
<CityMeteor CityName="北京">
    <CF ReportTime="2024-01-01 12:00:00">
        <Period 
            Timestart="2024-01-01 08:00:00" 
            Timeend="2024-01-01 20:00:00" 
            Tmax="25" 
            Tmin="15" 
            Weather="0" />
        <Period 
            Timestart="2024-01-01 20:00:00" 
            Timeend="2024-01-02 08:00:00" 
            Tmax="18" 
            Tmin="12" 
            Weather="1" />
    </CF>
</CityMeteor>
```

### 4. 城市列表接口（flag=allcity）

```xml
<CityList>
    <Province ch="北京市">
        <District ID="54511" ch="北京" />
    </Province>
    <Province ch="上海市">
        <District ID="58367" ch="上海" />
    </Province>
    <!-- 更多省份和城市 -->
</CityList>
```
