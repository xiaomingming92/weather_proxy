# ZTE 城市列表接口适配规范

## 背景

WeatherWidget APK 的城市列表功能配合不良，主要原因是 `/zte/getweatheru.asmx/getStationList` 接口返回的 XML 格式与 APK 期望的格式不匹配。

## 问题分析

### APK 期望的 XML 格式

```xml
<?xml version="1.0" encoding="utf-8"?>
<Citylist>
  <Nation ID="0101" en="zhongguo" ch="中国">
    <Province ID="010101" en="beijing" ch="北京">
      <District ID="01010101" en="beijing" ch="北京" zip="" />
    </Province>
  </Nation>
</Citylist>
```

### 当前接口返回的格式

```xml
<?xml version="1.0" encoding="UTF-8"?>
<CityList>
  <City>
    <CityID>101010100</CityID>
    <CityName>北京</CityName>
    <StationID>101010100</StationID>
    <Lat>39.92</Lat>
    <Lon>116.46</Lon>
  </City>
</CityList>
```

### 关键差异

| 项目 | APK 期望 | 当前接口 |
|------|---------|---------|
| 根标签 | `<Citylist>` | `<CityList>` |
| 结构 | 嵌套（Nation>Province>District） | 扁平（City） |
| 城市ID属性 | `ID` 属性 | `CityID` 子元素 |
| 城市名属性 | `ch` 属性 | `CityName` 子元素 |
| 编码 | `utf-8` | `UTF-8` |

### APK 解析逻辑

在 `CityHandler.smali` 中：
- 解析 `CityList` 标签（第239行）
- 解析 `Nation` 标签（第254行）
- 解析 `Province` 标签的 `ch` 属性（第272行）
- 解析 `District` 标签的 `ID` 和 `ch` 属性（第307, 315行）

## 需求规范

### 接口 1：获取完整城市列表

**URL**: `GET /zte/getweatheru.asmx/getStationList?dataType=zte&code=1D765B`

**功能**: 返回完整的嵌套 XML 城市列表，供 WeatherWidget 下载并保存到本地

**请求参数**:
- `dataType`: 固定值 `zte`
- `code`: 固定值 `1D765B`

**响应格式**:
```xml
<?xml version="1.0" encoding="utf-8"?>
<Citylist>
  <Nation ID="0101" en="zhongguo" ch="中国">
    <Province ID="010101" en="beijing" ch="北京">
      <District ID="01010101" en="beijing" ch="北京" zip="" />
      <District ID="01010102" en="haidian" ch="海淀" zip="" />
    </Province>
    <Province ID="010102" en="anhui" ch="安徽">
      <District ID="01010201" en="hefei" ch="合肥" zip="" />
      ...
    </Province>
  </Nation>
</Citylist>
```

**数据映射规则**:
- Nation ID: 固定 `0101`
- Nation en: 固定 `zhongguo`
- Nation ch: 固定 `中国`
- Province ID: 根据省份编码生成（如 `010101`）
- Province en: 省份拼音
- Province ch: 省份中文名
- District ID: 使用和风城市ID（如 `01010101`）
- District en: 城市拼音
- District ch: 城市中文名
- District zip: 固定空字符串

### 接口 2：WeatherTV 城市列表（已有，保持不变）

**URL**: `POST /zte/getweatheru.asmx/getStationList`

**功能**: 供 WeatherTV 使用，返回逗号分隔的城市名列表

**请求参数**:
- `flag`: `allcity` 返回所有城市

**响应格式**: 逗号分隔的城市名（如：`北京,上海,广州,...`）

### 接口 3：天气数据接口（已有，保持不变）

**URL**: `POST /zte/getweatheru.asmx/getData`

**功能**: 获取指定城市的天气数据

## 城市搜索功能说明

WeatherWidget 的城市搜索（模糊搜索、精确搜索）是**本地功能**，不需要后端接口：

1. **首次启动**: 调用 `CityListXMLRequest.startGetXml()` 下载城市列表 XML
2. **保存位置**: `/data/data/com.android.launcher2/files/stationlist.xml`
3. **解析**: `CityRequest.startParseXml()` 使用 SAX 解析 XML
4. **搜索**: 在解析后的内存数据中进行模糊/精确匹配

因此，只需要确保 `getStationList` 接口返回正确的 XML 格式即可。

## 数据库映射

使用现有的 `ZteCity` 表数据，按省份分组生成嵌套 XML。

省份编码映射（前4位）：
- 北京: 0101
- 安徽: 0102
- 澳门: 0103
- 重庆: 0104
- 福建: 0105
- 甘肃: 0106
- 广东: 0107
- 广西: 0108
- 贵州: 0109
- 海南: 0110
- 河北: 0111
- 河南: 0112
- 黑龙江: 0113
- 湖北: 0114
- 湖南: 0115
- 吉林: 0116
- 江苏: 0117
- 江西: 0118
- 辽宁: 0119
- 内蒙古: 0120
- 宁夏: 0121
- 青海: 0122
- 山东: 0123
- 山西: 0124
- 陕西: 0125
- 上海: 0126
- 四川: 0127
- 台湾: 0128
- 天津: 0129
- 西藏: 0130
- 香港: 0131
- 新疆: 0132
- 云南: 0133
- 浙江: 0134
