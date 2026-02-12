<!--
 * @Author       : Z2-WIN\xmm wujixmm@gmail.com
 * @Date         : 2026-02-12 16:45:00
 * @LastEditors  : Z2-WIN\xmm wujixmm@gmail.com
 * @LastEditTime : 2026-02-12 17:25:17
 * @FilePath     : \decompile\weather_proxy\.trae\documents\v2\weatherWidget副作用-修改系统时间.md
 * @Description  : WeatherWidget 修改系统时间实现方案
-->

# WeatherWidget 副作用 - 修改系统时间实现方案

# 测试发现ZTE V880 简单的设置设置时间的权限时会导致FC

## 背景

V880 无法连接 ZTE 官方时间同步服务器，导致系统时间不准确。利用 WeatherWidget 每次获取天气数据的机会，从 weather_proxy 获取服务器时间并同步到 V880 系统。

---

## 数据来源

### 1. 时间数据来源

**来源**: weather_proxy (VPS 8.153.104.150)

**生成位置**: [data-transform.ts#L555-L560](file:///c:/Users/xmm/Desktop/v880/weather_app/decompile/weather_proxy/src/services/data-transform.ts#L555-L560)

```typescript
private formatUpdateTime(time: string | Date | undefined): string {
  return utcToLocalTime(time || new Date())
    .toISOString()
    .replace('T', ' ')
    .replace(/\.\d{3}Z/, '');
}
```

**说明**: 取 VPS 服务器的当前系统时间，格式化为 `yyyy-MM-dd HH:mm:ss`

### 2. XML 中的时间字段

**位置**: [data-transform.ts#L371](file:///c:/Users/xmm/Desktop/v880/weather_app/decompile/weather_proxy/src/services/data-transform.ts#L371)

```xml
<CityMeteor CityName="北京">
  <SK ReportTime="2026-02-12 16:30:00">
    <Info Weather="0" Temperature="15"/>
  </SK>
</CityMeteor>
```

**字段**: `SK` 标签的 `ReportTime` 属性

**格式**: `yyyy-MM-dd HH:mm:ss` (例如: 2026-02-12 16:30:00)

---

## 实现步骤

### 第一步：添加权限

**文件**: `WeatherWidget/AndroidManifest.xml`

**位置**: 在 `<uses-permission>` 标签区域添加

```xml
<uses-permission android:name="android.permission.SET_TIME"/>
```

**数据来源**: Android 官方文档 - 修改系统时间需要 SET_TIME 权限

---

### 第二步：修改 CurrentWeatherHandler

**文件**: `WeatherWidget/smali/com/zte/WeatherWidget/zteweather/CurrentWeatherHandler.smali`

**当前逻辑**: [CurrentWeatherHandler.smali#L1-L100](file:///c:/Users/xmm/Desktop/v880/weather_app/decompile/WeatherWidget/smali/com/zte/WeatherWidget/zteweather/CurrentWeatherHandler.smali)

**修改位置**: 在 `endElement` 方法中，当解析到 `SK` 标签结束时

**需要添加的代码逻辑**:

```java
// 在解析完 SK 标签后，提取 ReportTime 并修改系统时间
if (localName.equals("SK")) {
    String reportTime = current.getReportTime();  // 获取 ReportTime
    if (reportTime != null && !reportTime.isEmpty()) {
        syncSystemTime(reportTime);
    }
}

private void syncSystemTime(String reportTime) {
    try {
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
        Date date = sdf.parse(reportTime);
        long timestamp = date.getTime();
        
        // 修改系统时间
        SystemClock.setCurrentTimeMillis(timestamp);
        
        Log.d("fz", "System time synced to: " + reportTime);
    } catch (Exception e) {
        Log.e("fz", "Failed to sync time: " + e.getMessage());
    }
}
```

**Smali 实现要点**:

1. **导入需要的类**:
   - `Ljava/text/SimpleDateFormat;`
   - `Ljava/util/Date;`
   - `Landroid/os/SystemClock;`

2. **在 `endElement` 方法中添加**:
   - 检查标签名是否为 "SK"
   - 调用时间同步方法

3. **添加新方法 `syncSystemTime`**:
   - 解析时间字符串
   - 转换为时间戳
   - 调用 `SystemClock.setCurrentTimeMillis`

---

### 第三步：修改 WeatherCurrentCondition 类

**文件**: `WeatherWidget/smali/com/zte/WeatherWidget/zteweather/WeatherCurrentCondition.smali`

**修改**: 添加 `reportTime` 字段和 getter/setter

```java
private String reportTime;

public void setReportTime(String reportTime) {
    this.reportTime = reportTime;
}

public String getReportTime() {
    return reportTime;
}
```

---

### 第四步：修改 CurrentWeatherHandler 的字符处理

**文件**: `WeatherWidget/smali/com/zte/WeatherWidget/zteweather/CurrentWeatherHandler.smali`

**当前逻辑**: 在 `characters` 方法中处理 `ReportTime` 属性

**修改**: 将 `ReportTime` 属性值保存到 `WeatherCurrentCondition` 对象

---

## 完整数据流

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   VPS 服务器     │     │  weather_proxy   │     │  V880 手机      │
│  (8.153.104.150)│     │  (Node.js)       │     │  (Android 2.2)  │
└────────┬────────┘     └────────┬─────────┘     └────────┬────────┘
         │                       │                        │
         │  1. 获取系统时间       │                        │
         │──────────────────────>│                        │
         │                       │                        │
         │  2. 格式化为 XML       │                        │
         │   ReportTime="..."    │                        │
         │                       │                        │
         │                       │  3. HTTP POST 请求      │
         │                       │<───────────────────────│
         │                       │                        │
         │                       │  4. 返回 XML 响应       │
         │                       │───────────────────────>│
         │                       │                        │
         │                       │                        │  5. 解析 XML
         │                       │                        │  提取 ReportTime
         │                       │                        │
         │                       │                        │  6. 修改系统时间
         │                       │                        │  SystemClock.
         │                       │                        │  setCurrentTimeMillis()
         │                       │                        │
         │                       │                        │  7. 时间同步完成
         │                       │                        │
```

---

## 关键代码参考

### 1. CurrentWeatherHandler 原始结构

**来源**: [CurrentWeatherHandler.smali](file:///c:/Users/xmm/Desktop/v880/weather_app/decompile/WeatherWidget/smali/com/zte/WeatherWidget/zteweather/CurrentWeatherHandler.smali)

```smali
# 关键方法
.method public endElement(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)V
    # 处理 </SK> 标签
    # 需要在这里添加时间同步调用
.end method

.method public characters([CII)V
    # 处理文本内容
    # ReportTime 的值在这里获取
.end method
```

### 2. 时间格式化参考

**来源**: [data-transform.ts](file:///c:/Users/xmm/Desktop/v880/weather_app/decompile/weather_proxy/src/services/data-transform.ts)

```typescript
// 输入: new Date() 或 ISO 字符串
// 输出: "2026-02-12 16:30:00"
```

### 3. Android 修改系统时间 API

**来源**: Android SDK 文档

```java
// 需要权限: android.permission.SET_TIME
// 需要系统应用或 root
SystemClock.setCurrentTimeMillis(long millis);
```

---

## 实现检查清单

- [ ] 在 AndroidManifest.xml 添加 SET_TIME 权限
- [ ] 在 WeatherCurrentCondition 添加 reportTime 字段
- [ ] 在 CurrentWeatherHandler.characters() 中保存 ReportTime
- [ ] 在 CurrentWeatherHandler.endElement() 中调用时间同步
- [ ] 添加 syncSystemTime() 方法
- [ ] 重新打包并签名 APK
- [ ] 推送到 /system/app/ 并重启
- [ ] 验证时间是否同步

---

## 注意事项

1. **权限要求**: 必须是系统应用 (system/app) 或有 root 权限
2. **时间格式**: 确保 SimpleDateFormat 格式与 XML 一致 `yyyy-MM-dd HH:mm:ss`
3. **异常处理**: 添加 try-catch 防止解析失败导致崩溃
4. **日志输出**: 使用 `Log.d("fz", ...)` 便于调试

---

## 调试方法

```bash
# 查看时间同步日志
adb logcat -s "fz" "SystemTime" "CurrentWeatherHandler"

# 查看系统时间变化
adb shell date

# 手动触发天气刷新后再次查看
adb shell date
```
