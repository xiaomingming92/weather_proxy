## WeatherTV_V880+ XML 解析组件完整分析
### 一、Handler 类（XML 解析器）
1. CityDataHandler
文件 : hf/weather/dataclass/CityDataHandler.smali

处理的 XML 标签和属性 :

标签 属性 说明
CityMeteor CityName 城市名称 
StationInfo Latitude , Longitude , Postcode , Sunrise , Sunset , Stationid 站点信息 
CF ReportTime 天气预报开始 
Period (CF内) Timestart , Timeend , Weather , WindDir , WindPower , Tmin , Tmax , Week 预报时段 
SK ReportTime 实况天气开始 
Info (SK内) **Weather** , **Temperature** , **WindDir** , **WindPower** , **WindSpeed** , **Humidity** , **Pressure** 实况详情（7个属性全部必需）
ZU ReportTime 指数预报开始 
Type (ZU内) **Name** , **Val** 指数类型（ZU 直接包含 Type 子节点，不需要 Period 包装） 
CF3h ReportTime 3小时预报开始 
Period (CF3h内) Timestart , Timeend , Weather , WindDir , WindPower 3小时时段 
AdvFile - 广告文件
Adv Type , Flag 广告类型(CF/SK/ZU)

方法 :

- startDocument() - 初始化 CityData
- startElement() - 解析开始标签
- endElement() - 解析结束标签
- characters() - 解析文本内容
- getCityData() - 获取解析结果

2. WidgetSKHandler
文件 : hf/weather/widgetdata/WidgetSKHandler.smali

处理的 XML 标签和属性 :

标签 属性 说明 
CityMeteor CityName 城市名称 
SK ReportTime 实况时间 
Info Weather , Temperature 天气和温度

方法 :

- startElement() - 解析标签
- getWidgetSK() - 获取解析结果 

3. WidgetCFHandler
文件 : hf/weather/widgetdata/WidgetCFHandler.smali

处理的 XML 标签和属性 :

标签 属性 说明 
CityMeteor CityName 城市名称 
CF ReportTime 预报时间 
Period Timestart , Timeend , Tmax , Tmin , Weather 预报时段

方法 :

- startElement() - 解析标签
- getWidgetCF() - 获取解析结果 

4. ChCityListHandler
文件 : hf/weather/citylist/ChCityListHandler.smali

处理的 XML 标签和属性 :

标签 属性 说明 
Province ch 省份名称 
District ch 城市名称

方法 :

- startDocument() - 初始化 ChCityListData
- startElement() - 解析标签
- endElement() - 结束标签处理
- getChCityListData() - 获取解析结果 

5. AdvHandler
文件 : hf/weather/advdata/AdvHandler.smali

处理的 XML 标签和属性 :

标签 属性 说明 
Image Type 图片类型 
imgData Date , Size , FileType 图片元数据

方法 :

- startDocument() - 初始化 Advgroup
- startElement() - 解析标签
- endElement() - 结束标签处理
- characters() - 解析图片数据
- getAdvgroup() - 获取解析结果

### 二、数据类（Data Class）结构 
1. CityData
文件 : hf/weather/dataclass/CityData.smali

```PlainText
CityData
├── name: String                    // 城市名称
├── Latitude: double                // 纬度
├── Longitude: double               // 经度
├── postcode: String                // 邮编
├── stationid: int                  // 站点ID
├── sunrise: Date                   // 日出时间
├── sunset: Date                    // 日落时间
├── cfPart: CfPart                  // 天气预报
├── skPart: SkPart                  // 实况天气
├── zuPart: ZuPart                  // 指数预报
├── cf3hPart: Cf3hPart              // 3小时预报
└── advertisement: Advertisement    // 广告信息
``` 
2. SkPart（实况天气）
文件 : hf/weather/dataclass/SkPart.smali

```PlainText
SkPart
├── repotrtime: String      // 报告时间
├── Weather: int            // 天气代码 (0-35)
├── Temperature: String     // 温度
├── WindDir: int            // 风向 (0-9)
├── WindPower: int          // 风力 (0-9)
├── WindSpeed: int          // 风速
├── Humidity: String        // 湿度
└── Pressure: String        // 气压
``` 
3. CfPart（天气预报）
文件 : hf/weather/dataclass/CfPart.smali

```PlainText
CfPart
├── ReportTime: String                      // 报告时间
└── allTimeReport: ArrayList<CfPart_TimeScale>  // 时段列表
``` 
4. CfPart_TimeScale（预报时段）
文件 : hf/weather/dataclass/CfPart_TimeScale.smali

```PlainText
CfPart_TimeScale
├── TimeBegin: String       // 开始时间
├── TimeOver: String        // 结束时间
├── Weather: int            // 天气代码
├── WindDir: int            // 风向
├── WindPower: int          // 风力
├── Tmin: String            // 最低温度
├── Tmax: String            // 最高温度
├── Week: String            // 星期
├── Temperature: String     // 温度
└── low: boolean            // 是否低温
``` 
5. Cf3hPart（3小时预报）
文件 : hf/weather/dataclass/Cf3hPart.smali

```PlainText
Cf3hPart
├── ReportTime: String                          // 报告时间
└── allTimeReport: ArrayList<Cf3hPart_TimeScale>  // 时段列表
``` 
6. Cf3hPart_TimeScale（3小时时段）
文件 : hf/weather/dataclass/Cf3hPart_TimeScale.smali

```PlainText
Cf3hPart_TimeScale
├── TimeBegin: String       // 开始时间
├── TimeOver: String        // 结束时间
├── Weather: int            // 天气代码
├── WindDir: int            // 风向
├── WindPower: int          // 风力
└── Temperature: int        // 温度
``` 
7. ZuPart（指数预报）
文件 : hf/weather/dataclass/ZuPart.smali

```PlainText
ZuPart
├── reporttime: String                      // 报告时间
└── allzuTypes: ArrayList<ZuType>           // 指数类型列表
``` 
8. ZuType（指数类型）
文件 : hf/weather/dataclass/ZuType.smali

```PlainText
ZuType
├── typename: String        // 类型名称 (GM/XC/ZWX/CY/YD)
├── typeval: int            // 类型值
├── typevalStr: String      // 类型值字符串
├── typeinfo: String        // 类型信息
├── typechineseStr: String  // 中文名称
└── typeimg: int            // 图片资源ID
```
支持的指数类型 :

- GM - 感冒指数
- XC - 洗车指数
- ZWX - 紫外线指数
- CY - 穿衣指数
- YD - 运动指数 
``` 
9. Advertisement（广告）
文件 : hf/weather/dataclass/Advertisement.smali

```PlainText
Advertisement
├── CFID: String            // 预报广告ID
├── SKID: String            // 实况广告ID
└── ZUID: String            // 指数广告ID
``` 
10. WidgetSK（Widget实况）
文件 : hf/weather/widgetdata/WidgetSK.smali

```PlainText
WidgetSK
├── cityname: String        // 城市名称
├── reporttime: String      // 报告时间
├── weather: String         // 天气代码
└── temperature: String     // 温度
``` 
11. WidgetCF（Widget预报）
文件 : hf/weather/widgetdata/WidgetCF.smali

```PlainText
WidgetCF
├── cityname: String                            // 城市名称
├── reporttime: String                          // 报告时间
└── cfperiods: ArrayList<WidgetCFPeriod>        // 预报时段列表
``` 
12. WidgetCFPeriod（Widget预报时段）
文件 : hf/weather/widgetdata/WidgetCFPeriod.smali

```PlainText
WidgetCFPeriod
├── timebg: String          // 开始时间
├── timeend: String         // 结束时间
├── Tmax: String            // 最高温度
├── Tmin: String            // 最低温度
└── weather: String         // 天气代码
``` 
13. ChCity（城市）
文件 : hf/weather/citylist/ChCity.smali

```PlainText
ChCity
├── provincename: String                        // 省份名称
└── cityname: ArrayList<String>                 // 城市列表
``` 
14. ChCityListData（城市列表）
文件 : hf/weather/citylist/ChCityListData.smali

```PlainText
ChCityListData
└── AllChCity: ArrayList<ChCity>                // 所有城市数据
``` 
15. Adv（广告）
文件 : hf/weather/advdata/Adv.smali

```PlainText
Adv
├── type: String            // 类型
├── Date: String            // 日期
├── Size: String            // 大小
├── FileType: String        // 文件类型
└── Data: String            // 数据内容
``` 
16. Advgroup（广告组）
文件 : hf/weather/advdata/Advgroup.smali

```PlainText
Advgroup
└── advs: ArrayList<Adv>                        // 广告列表
``` 
### 三、Network 类（网络请求）
1. Network
文件 : hf/weather/network/Network.smali

请求类型 :

方法 URL 参数 用途 
getCityData() http://8.153.104.150/api/weather dataType=zte , sname , code=1D765B 获取城市完整天气数据 
getCityList() http://8.153.104.150/api/weather flag=allcity 获取城市列表 
HttpTest() - typename 网络连接测试 isNetworkAvailable() - - 检查网络可用性

2. WidgetNetwork
文件 : hf/weather/network/WidgetNetwork.smali

请求类型 :

方法 URL 参数 用途 
getSKData() http://8.153.104.150/api/weather dataType=ztewidgetsk , sname , code=1D765B Widget实况数据 
getCFData() http://8.153.104.150/api/weather dataType=ztewidgetcf , sname , code=1D765B Widget预报数据

3. AdvNetwork
文件 : hf/weather/network/AdvNetwork.smali

请求类型 :

方法 URL 参数 用途 
getADVData() http://hf-mobile.mywtv.cn/zte/getadv.asmx/getAdvs dataType=zte , advType 获取广告数据

4. RadarNetwork / YuntuNetwork
文件 : hf/weather/network/RadarNetwork.smali , hf/weather/network/YuntuNetwork.smali

- 空实现类，预留接口
### 四、组件树状图
```
WeatherTV_V880+ XML解析架构
│
├── Handler（XML解析器）
│   ├── CityDataHandler ──────── 解析完整天气XML
│   │   ├── CityMeteor (CityName)
│   │   ├── StationInfo (Latitude, Longitude, Postcode, Sunrise, Sunset, 
Stationid)
│   │   ├── CF (ReportTime) + Period (Timestart, Timeend, Weather, WindDir, 
WindPower, Tmin, Tmax, Week)
│   │   ├── SK (ReportTime) + Info (Weather, Temperature, WindDir, WindPower, 
WindSpeed, Humidity, Pressure)
│   │   ├── ZU (ReportTime) + Type (Name, Val)
│   │   ├── CF3h (ReportTime) + Period (Timestart, Timeend, Weather, WindDir, 
WindPower)
│   │   └── AdvFile + Adv (Type, Flag)
│   │
│   ├── WidgetSKHandler ──────── 解析Widget实况XML
│   │   ├── CityMeteor (CityName)
│   │   ├── SK (ReportTime)
│   │   └── Info (Weather, Temperature)
│   │
│   ├── WidgetCFHandler ──────── 解析Widget预报XML
│   │   ├── CityMeteor (CityName)
│   │   ├── CF (ReportTime)
│   │   └── Period (Timestart, Timeend, Tmax, Tmin, Weather)
│   │
│   ├── ChCityListHandler ────── 解析城市列表XML
│   │   ├── Province (ch)
│   │   └── District (ch)
│   │
│   └── AdvHandler ───────────── 解析广告XML
│       ├── Image (Type)
│       └── imgData (Date, Size, FileType)
│
├── DataClass（数据模型）
│   ├── CityData ─────────────── 根数据对象
│   │   ├── SkPart ───────────── 实况数据
│   │   ├── CfPart ───────────── 预报数据 (含 CfPart_TimeScale列表)
│   │   ├── ZuPart ───────────── 指数数据 (含 ZuType列表)
│   │   ├── Cf3hPart ─────────── 3小时预报 (含 Cf3hPart_TimeScale列表)
│   │   └── Advertisement ────── 广告数据
│   │
│   ├── WidgetSK ─────────────── Widget实况
│   ├── WidgetCF ─────────────── Widget预报 (含 WidgetCFPeriod列表)
│   ├── ChCityListData ───────── 城市列表 (含 ChCity列表)
│   └── Advgroup ─────────────── 广告组 (含 Adv列表)
│
├── Network（网络层）
│   ├── Network ──────────────── 主网络请求
│   │   ├── getCityData() ────── 完整天气数据
│   │   └── getCityList() ────── 城市列表
│   │
│   ├── WidgetNetwork ────────── Widget网络请求
│   │   ├── getSKData() ──────── Widget实况
│   │   └── getCFData() ──────── Widget预报
│   │
│   └── AdvNetwork ───────────── 广告网络请求
│       └── getADVData() ─────── 广告数据
│
└── DecodeData（数据解码器）
    ├── decode_weather() ─────── 天气代码转中文
    ├── decode_SKweather() ───── 实况天气转图标
    ├── decode_weatherPic() ──── 天气代码转图片资源
    ├── decode_windDir() ─────── 风向代码转中文
    ├── decode_windPower() ───── 风力代码转中文
    ├── decode_zutype() ──────── 指数类型解码
    └── decode_week() ────────── 星期代码转中文
```
### 五、XML 数据结构示例
### 1. 主天气数据接口（dataType=zte）
请求 : POST http://8.153.104.150/api/weather 参数 : dataType=zte&sname=北京&code=1D765B

XML 响应格式 :
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
        <Period 
            Timestart="2024-01-01 20:00:00" 
            Timeend="2024-01-02 08:00:00" 
            Weather="1" 
            WindDir="3" 
            WindPower="2" 
            Tmin="12" 
            Tmax="18" 
            Week="1" />
        <!-- 更多 Period 节点（至少6个） -->
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
长度要求 : ≥ 1500 字符（ 0x5dc ）

### 2. Widget 实况接口（dataType=ztewidgetsk）
请求 : POST http://8.153.104.150/api/weather 参数 : dataType=ztewidgetsk&sname=北京&code=1D765B

XML 响应格式 :

```xml
<CityMeteor CityName="北京">
    <SK ReportTime="2024-01-01 12:00:00">
        <Info Weather="0" Temperature="25" />
    </SK>
</CityMeteor>
```
### 3. Widget 预报接口（dataType=ztewidgetcf）
请求 : POST http://8.153.104.150/api/weather 参数 : dataType=ztewidgetcf&sname=北京&code=1D765B

XML 响应格式 :

```xml
<CityMeteor CityName="北京">
    <CF ReportTime="2024-01-01 12:00:00">
        <Period 
            Timestart="2024-01-01 08:00:00" 
            Timeend="2024-01-01 20:00:00" 
            Tmax="25" 
            Tmin="15" 
            Weather="0" />
        <Period 
            Timestart="2024-01-01 20:00:00" 
            Timeend="2024-01-02 08:00:00" 
            Tmax="18" 
            Tmin="12" 
            Weather="1" />
    </CF>
</CityMeteor>
```
### 4. 城市列表接口（flag=allcity）
请求 : POST http://8.153.104.150/api/weather 参数 : flag=allcity

XML 响应格式 :

```xml
<CityList>
    <Province ch="北京市">
        <District ID="54511" ch="北京" />
    </Province>
    <Province ch="上海市">
        <District ID="58367" ch="上海" />
    </Province>
    <!-- 更多省份和城市 -->
</CityList>
```
### 5. 广告数据接口
请求 : POST http://hf-mobile.mywtv.cn/zte/getadv.asmx/getAdvs 参数 : dataType=zte&advType=CF

XML 响应格式 :

```xml
<AdvFile>
    <Image Type="CF">
        <imgData Date="2024-01-01" Size="1024" FileType="jpg">
            [Base64 encoded image data]
        </imgData>
    </Image>
</AdvFile>
```
## 关键发现总结
1. 1500 字符长度要求 （ Network.smali L354 ）：
   
```smali
  const/16 v9, 0x5dc  # 1500
  if-ge v8, v9, :cond_0
  const-string v7, "err:length"
```
2. 示例文件 newdata.xml 实际长度 : 2107 字符

3. **SK 节点 Info 属性要求**（CityDataHandler.smali L715-787）：
   - 所有 7 个属性都是**必需**的：Weather, Temperature, WindDir, WindPower, WindSpeed, Humidity, Pressure
   - 缺少任何一个属性都会导致解析后数据不完整

4. **ZU 节点结构要求**（CityDataHandler.smali L636-665, L794-838）：
   - ZU 节点**直接包含** Type 子节点，**不需要** Period 包装
   - 每个 Type 必须有 Name 和 Val 属性
   - ZU 节点必须始终存在，否则点击"指数"按钮会导致 FC

5. **和风天气 API 字段映射**：
   | 和风天气字段 | WeatherTV 属性 | 说明 |
   |-------------|---------------|------|
   | `temp` | `Temperature` | 温度 |
   | `icon` | `Weather` | 天气图标代码（需要转换） |
   | `humidity` | `Humidity` | 相对湿度 |
   | `pressure` | `Pressure` | 大气压强 |
   | `windDir` | `WindDir` | 风向（需要转换） |
   | `windSpeed` | `WindSpeed` | 风速 |
   | `windScale` | `WindPower` | 风力等级 |

6. **风向字段转换映射**（基于 DecodeData.smali 逆向代码）：

   **重要说明**：和风天气 API 返回的 `windDir` 是**中文风向**（如"东南风"），但 WeatherTV 期望的是**数字代码**（0-9）。需要进行如下转换：

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

   **证据来源**：
   - `DecodeData.smali` L403-502：`decode_SKwindDir(I)` 方法定义了实况风向的数字到中文映射
   - `DecodeData.smali` L2470-2569：`decode_windDir(I)` 方法定义了预报风向的数字到中文映射
   - `newdata.xml` L23：示例数据 `WindDir="3"` 对应"东南风"

   **实现要求**：
   - SK 节点 Info 属性的 `WindDir` 需要转换
   - CF 节点 Period 属性的 `WindDir` 需要转换
   - CF3h 节点 Period 属性的 `WindDir` 需要转换

以上是对 WeatherTV_V880+ 逆向代码中所有 XML 解析相关组件的完整分析