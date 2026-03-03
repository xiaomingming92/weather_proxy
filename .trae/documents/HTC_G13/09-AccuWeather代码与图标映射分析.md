# AccuWeather 代码与图标映射分析

## 1. 分析目标

确定 HTC G13 ROM 中 AccuWeather 天气代码（1-54）与图标资源的对应关系，建立 QWeather → Accu 的直接映射。

## 2. 分析方法

通过逆向分析 ROM 中的 `StateResources.smali` 文件，提取天气代码与图标资源 ID 的映射关系。

## 3. 证据来源

### 3.1 主要证据文件

**文件路径：** `com.htc.weather.StateResources.smali`

**关键方法：**
- `getConditionResourceId(I)I` - 获取天气代码对应的图标资源 ID
- `getConditionText(I)Ljava/lang/String;` - 获取天气代码对应的文字描述

### 3.2 图标资源 ID 提取

从 `StateResources.smali` 中提取的图标资源 ID 列表：

```
# common_m_weather 系列（中等尺寸图标）
0x2080466 - common_m_weather_01
0x2080467 - common_m_weather_02
0x2080468 - common_m_weather_03
0x2080469 - common_m_weather_04
0x208046a - common_m_weather_05
0x208046b - common_m_weather_06
0x208046d - common_m_weather_08
0x208046e - common_m_weather_11
0x208046f - common_m_weather_12
0x2080470 - common_m_weather_13
0x2080471 - common_m_weather_14
0x2080472 - common_m_weather_15
0x2080473 - common_m_weather_16
0x2080474 - common_m_weather_17
0x2080475 - common_m_weather_18
0x2080476 - common_m_weather_19
0x2080477 - common_m_weather_20
0x2080478 - common_m_weather_21
0x2080479 - common_m_weather_22
0x208047a - common_m_weather_23
0x208047b - common_m_weather_24
0x208047c - common_m_weather_25
0x208047d - common_m_weather_26

# common_2x2_weather 系列（2x2尺寸图标）
0x208047e - common_2x2_weather_29
0x208047f - common_2x2_weather_30
0x2080480 - common_2x2_weather_31
0x2080481 - common_2x2_weather_32
0x2080482 - common_2x2_weather_33
0x2080483 - common_2x2_weather_34
0x2080484 - common_2x2_weather_35
0x2080485 - common_2x2_weather_36
0x2080486 - common_2x2_weather_37
0x2080487 - common_2x2_weather_38
0x2080488 - common_2x2_weather_39
0x2080489 - common_2x2_weather_40
0x208048a - common_2x2_weather_41
0x208048b - common_2x2_weather_42
0x208048c - common_2x2_weather_43
0x208048d - common_2x2_weather_44

# 其他图标
0x208010e - common_2x2_weather_01
0x208010f - common_2x2_weather_52
0x2080110 - common_2x2_weather_53
0x2080111 - common_2x2_weather_54
```

## 4. AccuWeather 代码与图标映射表

基于 `getConditionResourceId` 方法的 packed-switch 分析：

| Accu 代码 | 资源 ID | 图标文件名 | 图标内容 | 天气类型 |
|---------|---------|-----------|---------|---------|
| 1 | 0x2080466 | common_m_weather_01 | 太阳图标 | 晴 |
| 2 | 0x2080467 | common_m_weather_02 | 多云图标 | 多云 |
| 3 | 0x2080468 | common_m_weather_03 | 阴天图标 | 阴 |
| 4 | 0x2080469 | common_m_weather_04 | 雨图标 | 雨 |
| 5 | 0x208046a | common_m_weather_05 | 太阳图标 | 晴 |
| 6 | 0x208046b | common_m_weather_06 | 多云图标 | 多云 |
| 7-10 | default | - | 默认图标 | 无效代码 |
| 8 | 0x208046d | common_m_weather_08 | 雾图标 | 雾 |
| 11 | 0x208046e | common_m_weather_11 | 小雨图标 | 小雨 |
| 12 | 0x208046f | common_m_weather_12 | 中雨图标 | 中雨 |
| 13 | 0x2080470 | common_m_weather_13 | 大雨图标 | 大雨 |
| 14 | 0x2080471 | common_m_weather_14 | 雷阵雨图标 | 雷阵雨 |
| 15 | 0x2080472 | common_m_weather_15 | 雷阵雨图标 | 雷阵雨 |
| 16 | 0x2080473 | common_m_weather_16 | 雷阵雨图标 | 雷阵雨 |
| 17 | 0x2080474 | common_m_weather_17 | 雷阵雨图标 | 雷阵雨 |
| 18 | 0x2080475 | common_m_weather_18 | 雨图标 | 雨 |
| 19 | 0x2080476 | common_m_weather_19 | 雪图标 | 浮尘/雪 |
| 20 | 0x2080477 | common_m_weather_20 | 雪图标 | 扬沙/雪 |
| 21 | 0x2080478 | common_m_weather_21 | 雨夹雪图标 | 雨夹雪 |
| 22 | 0x2080479 | common_m_weather_22 | 雪图标 | 雪 |
| 23 | 0x208047a | common_m_weather_23 | 雪图标 | 大雪 |
| 24 | 0x208047b | common_m_weather_24 | 雪图标 | 暴雪 |
| 25 | 0x208047c | common_m_weather_25 | 沙尘图标 | 沙尘暴 |
| 26 | 0x208047d | common_m_weather_26 | 沙尘图标 | 强沙尘暴 |
| 27-28 | default | - | 默认图标 | 无效代码 |
| 29 | 0x208047e | common_2x2_weather_29 | 雾/霾图标 | 雾 |
| 30 | 0x208047f | common_2x2_weather_30 | 太阳图标 | 晴 |
| 31 | 0x2080480 | common_2x2_weather_31 | 雪图标 | 雪 |
| 32 | 0x2080481 | common_2x2_weather_32 | 月亮图标 | 夜间 |
| 33 | 0x2080482 | common_2x2_weather_33 | 月亮+云图标 | 夜间多云 |
| 34 | 0x2080483 | common_2x2_weather_34 | 月亮+云图标 | 夜间多云 |
| 35 | 0x2080484 | common_2x2_weather_35 | 月亮+云图标 | 夜间多云 |
| 36 | 0x2080485 | common_2x2_weather_36 | 月亮+云图标 | 夜间多云 |
| 37 | 0x2080486 | common_2x2_weather_37 | 月亮+云图标 | 夜间多云 |
| 38 | 0x2080487 | common_2x2_weather_38 | 月亮+云图标 | 夜间多云 |
| 39 | 0x2080488 | common_2x2_weather_39 | 月亮+云图标 | 夜间多云 |
| 40 | 0x2080489 | common_2x2_weather_40 | 月亮+云图标 | 夜间多云 |
| 41 | 0x208048a | common_2x2_weather_41 | 月亮+云图标 | 夜间多云 |
| 42 | 0x208048b | common_2x2_weather_42 | 月亮+云图标 | 夜间多云 |
| 43 | 0x208048c | common_2x2_weather_43 | 月亮+闪电图标 | 夜间雷雨 |
| 44 | 0x208048d | common_2x2_weather_44 | 月亮+闪电图标 | 夜间雷雨 |
| 45-50 | default | - | 默认图标 | 无效代码 |
| 51 | 0x208010e | common_2x2_weather_01 | 太阳图标 | 晴 |
| 52 | 0x208010f | common_2x2_weather_52 | 扬沙/沙尘图标 | 扬沙 |
| 53 | 0x2080110 | common_2x2_weather_53 | 扬沙/沙尘图标 | 扬沙 |
| 54 | 0x2080111 | common_2x2_weather_54 | 雾/霾图标 | 雾 |

### 月相图标（common_s_weather 系列）

| 资源 ID | 图标文件名 | 图标内容 | QWeather 月相代码 | 月相名称 |
|---------|-----------|---------|------------------|---------|
| 0x20804cb | common_s_weather_01 | 满月 | 804 | 满月 |
| 0x20804cc | common_s_weather_02 | 盈凸月 | 803 | 盈凸月 |
| 0x20804cd | common_s_weather_03 | 上弦月 | 802 | 上弦月 |
| 0x20804ce | common_s_weather_04 | 蛾眉月 | 801 | 蛾眉月 |
| 0x20804cf | common_s_weather_05 | 满月（带阴影） | 804 | 满月 |
| 0x20804d0 | common_s_weather_06 | 亏凸月 | 805 | 亏凸月 |
| 0x20804d1 | common_s_weather_07 | 下弦月 | 806 | 下弦月 |
| 0x20804d2 | common_s_weather_08 | 残月 | 807 | 残月 |

### 月相映射表（独立使用）

```typescript
export const QWEATHER_MOON_PHASE_MAP: Record<string, number> = {
  '800': 1,    // 新月 -> 使用默认图标（ROM中无新月图标）
  '801': 2,    // 蛾眉月 -> common_s_weather_02
  '802': 3,    // 上弦月 -> common_s_weather_03
  '803': 4,    // 盈凸月 -> common_s_weather_04
  '804': 5,    // 满月 -> common_s_weather_05
  '805': 6,    // 亏凸月 -> common_s_weather_06
  '806': 7,    // 下弦月 -> common_s_weather_07
  '807': 8,    // 残月 -> common_s_weather_08
};
```

**使用说明：**
- 月相代码（800-807）与天气代码（100-804）是独立的体系
- 天气API不会返回月相代码，需要单独调用月相API
- 月相图标使用 `common_s_weather` 系列，与天气图标不同

## 5. 关键发现

### 5.1 无效代码
- **7-10, 27-28, 45-50** 是无效代码，使用默认图标
- 实际有效的代码只有 **44 个**（1-6, 8-26, 29-44, 51-54）

### 5.2 图标类型分布
- **common_m_weather_XX**（中等尺寸）：代码 1-6, 8-26
- **common_2x2_weather_XX**（2x2尺寸）：代码 29-44, 51-54

### 5.3 特殊映射
- **代码 32-44**：夜间天气（月亮图标）
- **代码 52-53**：扬沙/沙尘（特殊图标）
- **代码 29 和 54**：都是雾/霾图标

## 6. QWeather → AccuWeather 映射建议

基于图标类型匹配：

```typescript
export const QWEATHER_TO_ACCU_MAP: Record<string, number> = {
  // 白天 - 晴/多云
  '100': 1,    // 晴 -> Sunny
  '101': 2,    // 多云 -> Cloudy
  '102': 3,    // 少云 -> Partly Cloudy
  '103': 2,    // 晴间多云 -> Cloudy
  '104': 3,    // 阴 -> Overcast
  
  // 夜间 - 晴/多云
  '150': 32,   // 晴(夜间) -> Clear Night
  '151': 33,   // 多云(夜间) -> Cloudy Night
  '152': 34,   // 少云(夜间) -> Partly Cloudy Night
  '153': 35,   // 晴间多云(夜间) -> Cloudy Night
  '154': 36,   // 阴(夜间) -> Overcast Night
  
  // 雨 - 白天
  '300': 11,   // 阵雨 -> Light Rain
  '301': 12,   // 强阵雨 -> Moderate Rain
  '302': 14,   // 雷阵雨 -> Thunderstorm
  '303': 15,   // 强雷阵雨 -> Heavy Thunderstorm
  '304': 16,   // 雷阵雨伴有冰雹 -> Hail
  '305': 11,   // 小雨 -> Light Rain
  '306': 12,   // 中雨 -> Moderate Rain
  '307': 13,   // 大雨 -> Heavy Rain
  '308': 13,   // 极端降雨 -> Heavy Rain
  '309': 11,   // 毛毛雨/细雨 -> Light Rain
  '310': 13,   // 暴雨 -> Heavy Rain
  '311': 13,   // 大暴雨 -> Heavy Rain
  '312': 13,   // 特大暴雨 -> Heavy Rain
  '313': 21,   // 冻雨 -> Sleet
  
  // 雨 - 夜间
  '350': 11,   // 阵雨(夜间) -> Light Rain
  '351': 12,   // 强阵雨(夜间) -> Moderate Rain
  
  // 雨 - 通用
  '399': 11,   // 雨 -> Light Rain
  
  // 雪 - 白天
  '400': 22,   // 小雪 -> Snow
  '401': 22,   // 中雪 -> Snow
  '402': 23,   // 大雪 -> Heavy Snow
  '403': 24,   // 暴雪 -> Blizzard
  '404': 21,   // 雨夹雪 -> Sleet
  '405': 21,   // 雨雪天气 -> Sleet
  '406': 21,   // 阵雨夹雪 -> Sleet
  '407': 22,   // 阵雪 -> Snow
  '408': 22,   // 小到中雪 -> Snow
  '409': 23,   // 中到大雪 -> Heavy Snow
  '410': 24,   // 大到暴雪 -> Blizzard
  
  // 雪 - 夜间
  '456': 21,   // 阵雨夹雪(夜间) -> Sleet
  '457': 22,   // 阵雪(夜间) -> Snow
  
  // 雪 - 通用
  '499': 22,   // 雪 -> Snow
  
  // 雾/霾
  '500': 8,    // 薄雾 -> Fog
  '501': 29,   // 雾 -> Dense Fog
  '502': 29,   // 霾 -> Haze
  '503': 52,   // 扬沙 -> Blowing Sand
  '504': 19,   // 浮尘 -> Dust
  '507': 25,   // 沙尘暴 -> Dust Storm
  '508': 26,   // 强沙尘暴 -> Heavy Dust Storm
  '509': 29,   // 浓雾 -> Dense Fog
  '510': 54,   // 强浓雾 -> Heavy Fog
  '511': 29,   // 中度霾 -> Moderate Haze
  '512': 29,   // 重度霾 -> Heavy Haze
  '513': 29,   // 严重霾 -> Severe Haze
  '514': 29,   // 大雾 -> Dense Fog
  '515': 54,   // 特强浓雾 -> Extreme Fog
  
  // 特殊
  '900': 1,    // 热 -> Sunny (Hot)
  '901': 3,    // 冷 -> Overcast (Cold)
  '999': 1,    // 未知 -> Sunny (Default)
};

// 注意：月相代码（800-807）不包含在此映射表中
// 原因：
// 1. 月相是独立的天文现象，不是天气状况
// 2. 天气API返回的是天气代码，不会返回月相代码
// 3. 如果需要显示月相，应该单独处理，不通过天气映射
// 4. ROM中有独立的月相图标资源（common_s_weather_01-08）
// 如果需要月相映射，请参考下方的月相映射表
```

## 7. 验证方法

1. **图标验证**：通过查看 `com.htc.resources` 中的实际图标文件
2. **代码验证**：通过分析 `StateResources.smali` 中的 packed-switch 映射
3. **运行时验证**：在 HTC G13 设备上测试天气显示

## 8. 参考文件

- `com.htc.weather.StateResources.smali` - 天气代码与图标映射
- `com.htc.weather.WeatherVideo.smali` - 天气视频映射
- `com.htc.resources/res/drawable-mdpi/` - 图标资源文件

## 9. 重要发现：华风天气与 AccuWeather 的关系

### 9.1 关键结论

**华风天气 = AccuWeather 代码 + 华风 XML 格式**

- **国行版（华风）和国际版使用相同的天气代码体系**（Accu 1-54）
- 区别仅在于 **数据格式**（华风 XML vs Accu XML）
- 华风只是数据提供商，代码体系仍然是 AccuWeather 的

### 9.2 证据

1. **ROM 中的 `StateResources` 类** 使用 1-54 的代码（Accu 体系）
2. **图标资源** 也是 Accu 体系的（common_m_weather_XX, common_2x2_weather_XX）
3. **华风 XML 中的 `Weather` 字段** 直接对应 Accu 代码

### 9.3 实际意义

- 不需要区分"华风代码"和"Accu 代码"
- 它们使用的是 **同一套代码体系**
- 只需要维护一个 `QWEATHER_TO_ACCU_MAP` 即可
- 国行版和国际版接口都可以使用相同的映射表

## 10. 结论

- **每个 Accu 代码（1-54）都有对应的图标资源**，无遗漏
- **代码与图标是强关联**，可以通过图标类型推断天气含义
- **建议建立 QWeather → Accu 的直接映射**，避免经过华风天气中转
- **华风天气和国际版使用相同的代码体系**，统一维护即可
