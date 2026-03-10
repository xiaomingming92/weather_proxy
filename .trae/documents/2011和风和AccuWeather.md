# HTC G13 华风天气与 AccuWeather 天气码映射表

> **版本**: 2011年标准  
> **来源**: HTC G13 ROM (WeatherSyncProvider/ChinaWeatherData.java)  
> **最后更新**: 2026-03-04

---

## 一、AccuWeather 2011 官方天气码 (1-54)

### 基础天气

| Accu Code | 英文描述 | 中文含义 |
|-----------|----------|----------|
| 1 | Sunny | 晴 |
| 2 | Mostly Sunny | 大部晴朗 |
| 3 | Partly Sunny | 局部晴朗 |
| 4 | Intermittent Clouds | 间歇云 |
| 5 | Hazy Sunshine | 朦胧阳光 |
| 6 | Mostly Cloudy | 大部多云 |
| 7 | Cloudy | 多云 |
| 8 | Dreary (Overcast) | 阴沉 |

### 雾/霾

| Accu Code | 英文描述 | 中文含义 |
|-----------|----------|----------|
| 11 | Fog | 雾 |

### 雨

| Accu Code | 英文描述 | 中文含义 |
|-----------|----------|----------|
| 12 | Showers | 阵雨 |
| 13 | Mostly Cloudy w/ Showers | 大部多云有阵雨 |
| 14 | Partly Sunny w/ Showers | 局部晴朗有阵雨 |
| 15 | T-Storms | 雷阵雨 |
| 18 | Rain | 雨 |
| 51 | Light Rain | 小雨 |

### 雪

| Accu Code | 英文描述 | 中文含义 |
|-----------|----------|----------|
| 19 | Flurries | 小雪 |
| 21 | Partly Sunny w/ Flurries | 局部晴朗有小雪 |
| 22 | Snow | 雪 |
| 23 | Mostly Cloudy w/ Snow | 大部多云有雪 |
| 52 | Light Snow | 轻雪 |
| 53 | Blowing Snow | 风雪 |

### 其他

| Accu Code | 英文描述 | 中文含义 |
|-----------|----------|----------|
| 24 | Ice | 冰 |
| 26 | Freezing Rain | 冻雨 |
| 29 | Rain and Snow | 雨夹雪 |
| 30 | Hot | 热 |
| 31 | Cold | 冷 |
| 32 | Windy | 大风 |
| 54 | Ice Pellets | 冰粒 |

### 夜间

| Accu Code | 英文描述 | 中文含义 |
|-----------|----------|----------|
| 33 | Clear (Night) | 晴朗(夜间) |
| 34 | Mostly Clear | 大部晴朗 |
| 35 | Partly Cloudy | 局部多云 |
| 36 | Intermittent Clouds (Night) | 间歇云(夜间) |
| 37 | Hazy Moonlight | 朦胧月光 |
| 38 | Mostly Cloudy (Night) | 大部多云(夜间) |
| 39 | Partly Cloudy w/ Showers | 局部多云有阵雨(夜间) |
| 40 | Mostly Cloudy w/ Showers | 大部多云有阵雨(夜间) |
| 41 | Partly Cloudy w/ T-Storms | 局部多云有雷暴(夜间) |
| 42 | Mostly Cloudy w/ T-Storms | 大部多云有雷暴(夜间) |
| 43 | Partly Cloudy w/ Flurries | 局部多云有小雪(夜间) |
| 44 | Mostly Cloudy w/ Snow | 大部多云有雪(夜间) |

---

## 二、华风天气码 (0-35) 与 AccuWeather 映射

### 官方映射表 (来自 ChinaWeatherData.java)

```java
private static final int[] TABLE_CONDITION_CHINA2ACCU = new int[]{
    1, 6, 8, 18, 15, 51, 29, 14, 13, 18, 15, 22, 22, 23, 21, 19, 
    22, 22, 11, 26, 52, 13, 15, 15, 15, 15, 19, 22, 22, 53, 52, 52, 
    32, 54, 19, 11
};
```

### 完整华风映射AccuWeather表，最关键

| 华风码 | 白天Accu | 夜间Accu | 中文含义 | 备注 |
|--------|----------|----------|----------|------|
| 0 | 1 | 33 | 晴 | Sunny/Clear |
| 1 | 6 | 38 | 多云 | Mostly Cloudy |
| 2 | 8 | 8 | 阴 | Dreary (Overcast) |
| 3 | 18 | 18 | 中雨 | Rain |
| 4 | 15 | 15 | 雷阵雨 | T-Storms |
| 5 | 51 | 51 | 小雨 | Light Rain |
| 6 | 29 | 29 | 雨夹雪 | Rain and Snow |
| 7 | 14 | 14 | 阵雨 | Partly Sunny w/ Showers |
| 8 | 13 | 13 | 阴有阵雨 | Mostly Cloudy w/ Showers |
| 9 | 18 | 18 | 大雨 | Rain |
| 10 | 15 | 15 | 雷暴 | T-Storms |
| 11 | 22 | 22 | 中雪 | Snow |
| 12 | 22 | 22 | 大雪 | Snow |
| 13 | 23 | 23 | 阴有雪 | Mostly Cloudy w/ Snow |
| 14 | 21 | 21 | 阵雪 | Partly Sunny w/ Flurries |
| 15 | 19 | 19 | 小雪 | Flurries |
| 16 | 22 | 22 | 暴雪 | Snow |
| 17 | 22 | 22 | 强降雪 | Snow |
| **18** | **11** | **11** | **雾** | **Fog** |
| 19 | 26 | 26 | 冻雨 | Freezing Rain |
| 20 | 52 | 52 | 小雪(轻) | Light Snow |
| 21 | 13 | 13 | 阴阵雨 | Mostly Cloudy w/ Showers |
| 22 | 15 | 15 | 雷阵雨 | T-Storms |
| 23 | 15 | 15 | 强雷阵雨 | T-Storms |
| 24 | 15 | 15 | 雷雨 | T-Storms |
| 25 | 15 | 15 | 暴雷 | T-Storms |
| 26 | 19 | 19 | 小阵雪 | Flurries |
| 27 | 22 | 22 | 中阵雪 | Snow |
| 28 | 22 | 22 | 大阵雪 | Snow |
| 29 | 53 | 53 | 风雪 | Blowing Snow |
| 30 | 52 | 52 | 小雪 | Light Snow |
| 31 | 52 | 52 | 中雪 | Light Snow |
| 32 | 32 | 32 | 大风 | Windy |
| 33 | 54 | 54 | 冰粒 | Ice Pellets |
| 34 | 19 | 19 | 零星小雪 | Flurries |
| **35** | **11** | **11** | **浓雾** | **Fog** |

### 关键发现

1. **华风 18 和 35 都映射到 Accu 11 (Fog)** - 都是雾/浓雾
2. **华风 5 映射到 Accu 51 (Light Rain)** - 小雨，不是雾
3. **华风 29-31 映射到 Accu 52/53** - 雪系列
4. **夜间映射** - 只有华风 0 和 1 与白天不同

---

## 三、HTC 的"压缩映射"策略

HTC 并没有一一对应所有 54 种 Accu 天气码，而是做了压缩：

### 1. 合并雷暴类
- 华风 4, 10, 22-25 → 统一映射到 Accu 15 (T-Storms)

### 2. 合并降雪等级
- 华风 11, 12, 16, 17, 27, 28 → 统一映射到 Accu 22 (Snow)
- 华风 20, 30, 31 → 统一映射到 Accu 52 (Light Snow)

### 3. 合并降雨强度
- 华风 3, 9 → 统一映射到 Accu 18 (Rain)
- 华风 5 → 映射到 Accu 51 (Light Rain)

---

## 四、QWeather → 华风天气码映射

基于上述映射表，QWeather 代码应映射为：

### 晴
- 100 (晴) → 0
- 150 (晴夜间) → 0

### 多云
- 101-103 (多云/少云/晴间多云) → 1
- 151-153 (夜间) → 1

### 阴
- 104 (阴) → 2

### 雨
- 300-302 (阵雨/雷阵雨) → 7-8
- 303-304 (强雷阵雨) → 4
- 305 (小雨) → 5
- 306-309 (中雨/毛毛雨) → 3
- 310-318 (大雨/暴雨) → 9-13

### 雪
- 400 (小雪) → 15
- 401 (中雪) → 11
- 402 (大雪) → 12
- 403 (暴雪) → 16
- 404-406 (雨夹雪) → 6-7
- 407 (阵雪) → 14

### 雾/霾
- 500-501 (薄雾/雾) → **18**
- 502-508 (霾/浓雾) → **35**
- 509-511 (浓雾系列) → **35**

### 沙尘
- 800-804 (浮尘/扬沙/沙尘暴) → 19-28

---

## 五、参考文件

- **源码**: `WeatherSyncProvider_java/com/htc/sync/provider/weather/ChinaWeatherData.java`
- **华风 API**: `http://htc-mobile.mywtv.cn/getweatheru.asmx/getData`
- **ROM 框架**: `com.htc.framework.jar`

---

**文档维护**: 根据实际测试结果更新映射表



这些编号确实存在于早期的 AccuWeather icon 体系中，但：

部分是 旧版遗留

部分是 Web 端使用，Android SDK 未必内置

部分是 极少使用的过渡编号

下面给你完整补齐。

一、9 / 10
Code	含义	说明
9	Not Used	预留编号
10	Not Used	预留编号

早期文档中直接标注为 unused。

二、16 / 17
Code	英文	含义
16	Mostly Cloudy w/ T-Storms	多云伴雷暴
17	Partly Sunny w/ T-Storms	局部晴伴雷暴

后来被 41 / 42 体系替代：

41 = Partly Cloudy w/ T-Storms

42 = Mostly Cloudy w/ T-Storms

HTC 多数 ROM 直接跳过 16/17。

三、20
Code	英文	含义
20	Mostly Cloudy w/ Flurries	多云伴小阵雪

后来被 43 替代：

43 = Mostly Cloudy w/ Flurries

四、25
Code	英文	含义
25	Sleet	雨夹冰粒

注意：

29 = Rain and Snow（雨夹雪）

25 = 冰雨夹雪（更偏冰粒）

很多 Android 客户端直接压缩到 26 或 29。

五、27 / 28
Code	英文	含义
27	Mostly Cloudy w/ Sleet	多云伴雨夹冰
28	Partly Sunny w/ Sleet	局部晴伴雨夹冰

这两个极少出现在移动端。

六、45–50

这是 Web 端扩展 severe 系列。

Code	英文	含义
45	Thundershowers	雷阵雨
46	Snow Showers	阵雪
47	Isolated T-Storms	局部雷暴
48	Scattered T-Storms	分散雷暴
49	Freezing Drizzle	冻毛毛雨
50	Drizzle	毛毛雨

但：

Android 2011 SDK 基本不使用 45–50

HTC ROM 资源包里通常没有对应动画目录

通常被压缩到 12 / 15 / 22

七、为什么你在 HTC 映射表里看不到这些

因为 HTC 当年只保留：

1–44 + 51–54 中常用部分

并且进一步压缩。

也就是说：

这些 code 在 Accu 标准体系里存在，
但在 HTC 2011 Android 实现里基本未用。