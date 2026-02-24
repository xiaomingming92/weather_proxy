# HTC ROM二进制分析方法

## 分析方法概述

本文档详细说明如何从HTC G13 ROM中提取天气相关的字符串常量，用于验证AccuWeather API的使用。

## 方法原理

### 什么是字符串提取？

Android的`.odex`文件（Optimized DEX）是Dalvik字节码的优化版本，其中包含：
- 类定义
- 方法代码
- **字符串常量池**（String Constant Pool）

**字符串常量池**是编译时确定的只读字符串集合，可以通过二进制扫描提取，**不需要逆向工程**。

### 与逆向工程的区别

| 操作 | 字符串提取 | 逆向工程 |
|------|-----------|---------|
| 读取文件 | ✅ 直接读取二进制 | ✅ 直接读取二进制 |
| 解析内容 | ✅ 只提取可打印字符串 | ❌ 反编译字节码 |
| 理解逻辑 | ❌ 不分析程序逻辑 | ✅ 分析程序逻辑 |
| 修改代码 | ❌ 不修改 | ✅ 可能修改 |
| 法律风险 | ✅ 低风险（只读公开字符串） | ❌ 高风险（可能违反DMCA） |

## 分析脚本

### 脚本位置

完整的分析脚本位于：
- **文件**: `scripts/extract_strings.py`
- **功能**: 从.odex文件中提取字符串和URL

### 使用方法

```bash
# 分析Weather.odex文件
python scripts/extract_strings.py WORKING_022126_234011/system/app/Weather.odex

# 分析WeatherWidget.odex文件
python scripts/extract_strings.py WORKING_022126_234011/system/app/WeatherWidget.odex
```

### 脚本功能

脚本包含以下核心函数：

1. **`extract_strings(filepath, min_length=4)`**
   - 从二进制文件提取可打印ASCII字符串
   - 字符范围：32-126（可打印ASCII）
   - 最小长度：默认4个字符

2. **`search_weather_related(filepath)`**
   - 搜索天气相关的字符串
   - 关键词：weather, accuweather, forecast, city等

3. **`extract_urls(filepath)`**
   - 使用正则表达式提取HTTP/HTTPS URL
   - 自动去重和排序

## 实际分析结果

### 1. 提取的AccuWeather URL

```bash
$ python extract_urls.py

找到的URL:
  [AccuWeather] http://htc.accuweather.com/widget/htc/forecast-data_v3.asp
  [AccuWeather] http://htc.accuweather.com/widget/htc/lat-lon-search.asp
  [AccuWeather] http://htc2.accu-weather.com/widget/htc2/city-find.asp
  [AccuWeather] http://htc2.accu-weather.com/widget/htc2/weather-data.asp
```

### 2. 提取的API参数

```bash
$ python extract_strings.py

找到的相关字符串:
  ac=TR2cra9U
  loccode
  forecast-data_v3.asp
  lat-lon-search.asp
  city-find.asp
  weather-data.asp
```

### 3. 提取的城市相关字符串

```bash
$ python extract_strings.py

找到的相关字符串:
  CityList
  CityInfo
  AddCity
  DeleteCity
  SearchBox
  SmartSearchingModule
```

## 技术细节

### 为什么能提取字符串？

1. **DEX文件格式**
   - Android的DEX文件包含一个字符串常量池
   - 所有字符串字面量都存储在这个池中
   - 字符串以NULL结尾或长度前缀方式存储

2. **ASCII字符串特征**
   - 可打印ASCII字符范围：32-126
   - 连续的ASCII字符形成可读字符串
   - 非ASCII字符（<32或>126）作为分隔符

3. **二进制扫描**
   - 逐字节读取文件
   - 识别连续的可打印字符
   - 达到最小长度阈值后保存

### 工具对比

| 工具 | 功能 | 我们的脚本 |
|------|------|-----------|
| `strings` (Linux) | 提取可打印字符串 | ✅ 类似功能 |
| `binwalk` | 分析二进制文件 | ❌ 不需要 |
| IDA Pro | 逆向工程 | ❌ 不使用 |
| Ghidra | 逆向工程 | ❌ 不使用 |

我们的脚本等同于Linux的`strings`命令：
```bash
# Linux strings命令
strings Weather.odex | grep -i weather

# 我们的Python脚本
python extract_strings.py
```

## 法律合规性

### 为什么这是合法的？

1. **只读操作**
   - 仅读取文件内容
   - 不修改、不反编译、不破解

2. **公开信息**
   - 提取的是字符串常量（API URL、参数名）
   - 这些信息在运行时也会通过网络传输
   - 属于公开可见的信息

3. **研究目的**
   - 用于兼容性分析和接口适配
   - 属于合理使用的范围

### 与逆向工程的区别

**逆向工程**通常包括：
- 反编译字节码为源代码
- 分析程序逻辑和算法
- 修改程序行为
- 绕过安全机制

**我们的方法**：
- 只提取字符串字面量
- 不分析程序逻辑
- 不修改任何内容
- 仅用于接口适配

## 结论

通过二进制字符串提取，我们获得了：
- ✅ AccuWeather API端点URL
- ✅ API参数名称（ac, loccode等）
- ✅ 类名和方法名（CityList, AddCity等）

这些信息用于：
1. 验证AccuWeather API的使用
2. 确认API参数格式
3. 理解应用的基本结构

**没有进行任何逆向工程，仅提取了公开的字符串常量。**
