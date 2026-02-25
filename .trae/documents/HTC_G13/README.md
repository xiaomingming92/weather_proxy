# HTC G13 天气服务适配文档

## 文档导航

### 基础分析文档

| 文档 | 说明 | 状态 |
|------|------|------|
| [01_AccuWeather_API分析与适配背景](./01_AccuWeather_API分析与适配背景.md) | AccuWeather API 版本历史与 HTC 定制分析 | ✅ 完成 |
| [02_QWeather到AccuWeather适配实现](./02_QWeather到AccuWeather适配实现.md) | 和风天气到 AccuWeather 格式的转换实现 | ✅ 完成 |
| [03_AccuWeather天气代码对照表](./03_AccuWeather天气代码对照表.md) | 天气代码映射表 | ✅ 完成 |
| [04_HTC_ROM二进制分析方法](./04_HTC_ROM二进制分析方法.md) | ROM 反编译分析方法 | ✅ 完成 |

### 阶段实施文档

| 阶段 | 文档 | 说明 | 状态 |
|------|------|------|------|
| 第一阶段 | [05_第一阶段-华风天气接口分析](./05_第一阶段-华风天气接口分析.md) | 华风天气 API 逆向分析 | ✅ 完成 |
| 第二阶段 | [06_第二阶段-全量接口劫持方案](./06_第二阶段-全量接口劫持方案.md) | 所有接口劫持方案 | ✅ 完成 |

### 历史文档 (old/)

- `AccuWeather_API历史版本与HTC定制分析.md`
- `AccuWeather_天气代码对照表.md`
- `HTC_QWeather_AccuWeather_适配证据.md`
- `HTC_ROM二进制分析方法.md`

## 和 ZTE V880 文档对比

| ZTE V880 | HTC G13 | 说明 |
|----------|---------|------|
| 01_第一阶段-基础服务搭建 | 05_第一阶段-华风天气接口分析 | 都是第一阶段，内容不同 |
| 02_第二阶段-WeatherTV精准适配 | 06_第二阶段-全量接口劫持方案 | 都是第二阶段 |
| 03_WeatherTV_XML解析组件分析 | 已有 03_天气代码对照表 | 对应 |
| 04_WeatherWidget数据流转分析 | 已有 02_适配实现 | 对应 |
| 05_ORM与数据库设计 | `prisma/schema.prisma` | HTC 已实现 |
| 06_附加功能-时间同步方案 | `99sync_time_rdate` | HTC 已实现（rdate/ntpdate） |

## 项目背景

HTC G13 (Wildfire S) 国行版使用华风天气服务，而非国际版的 AccuWeather。本项目的目的是通过代理服务器劫持天气 API 请求，将现代天气服务（和风天气）的数据转换为 HTC G13 期望的格式。

## 关键发现

1. **双服务架构**: 国行版同时支持华风天气（中国）和 AccuWeather（国际）
2. **城市代码区分**: 中国城市以 `*` 开头（如 `*01011712`）使用华风接口
3. **XML 格式不同**: 华风和 AccuWeather 使用完全不同的 XML 格式
4. **需要全量劫持**: 6 个域名、10+ 个接口需要劫持

## 接口总览

### 华风天气接口
- `htc-mobile.mywtv.cn/getweatheru.asmx/getData`

### AccuWeather 接口
- `htc.accuweather.com/widget/htc/forecast-data_v3.asp`
- `htc.accuweather.com/widget/htc/lat-lon-search.asp`
- `htc2.accu-weather.com/widget/htc2/city-find.asp`
- `htc2.accu-weather.com/widget/htc2/weather-data.asp`

### WCR 配置接口
- `wcr.htcsense.com/wcr/weather`
- `ec2-122-248-192-161.ap-southeast-1.compute.amazonaws.com:8080/wcr/weather`

## 实施进度

- [x] AccuWeather 接口适配
- [ ] 华风天气接口适配
- [ ] WCR 配置接口适配
- [ ] 全量测试验证

## 相关代码

- `src/routes/htc-weather.ts` - AccuWeather 端点实现
- `src/routes/huafeng-weather.ts` - 华风天气端点实现（待完善）
- `src/services/htc/data-transform.ts` - 数据转换器
- `src/services/htc/types.ts` - 类型定义和代码映射
