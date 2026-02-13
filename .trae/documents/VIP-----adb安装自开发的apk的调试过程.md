<!--
 * @Author       : Z2-WIN\xmm wujixmm@gmail.com
 * @Date         : 2026-02-12 16:00:00
 * @LastEditors  : Z2-WIN\xmm wujixmm@gmail.com
 * @LastEditTime : 2026-02-13 12:55:53
 * @FilePath     : \decompile\weather_proxy\.trae\documents\VIP-----adb安装自开发的apk的调试过程.md
 * @Description  : 小白级ADB调试指南 - 以WeatherWidget为例
-->

# 小白级 ADB 调试指南 - 以 WeatherWidget 为例

## 什么是 ADB Logcat？

`adb logcat` 是 Android 的日志查看工具，就像浏览器的开发者工具控制台，可以看到 App 运行时的所有日志信息：
- 网络请求
- 错误信息
- 调试输出
- 系统事件

---

## 基础命令解释
- 以ZTE V880的WeatherWidget为例子
```powershell
powershell -Command "adb logcat -s 'fz' 'ZTEWidget2DWeather' 'WeatherService' '*:E'"
```

拆解：
- `powershell -Command` - 用 PowerShell 执行命令（解决 Git Bash 路径问题）
- `adb logcat` - 查看 Android 日志
- `-s` - 只显示指定标签的日志（silent mode，过滤掉其他无关日志）
- `'fz'` - WeatherWidget 的日志标签之一
- `'ZTEWidget2DWeather'` - WeatherWidget 主类的日志标签
- `'WeatherService'` - 天气服务的日志标签
- `'*:E'` - 显示所有标签的错误信息（Error级别）

---

## WeatherWidget 调试完整流程

### 第一步：连接设备

```powershell
# 检查设备是否连接
adb devices

# 应该显示：
# List of devices attached
# 0123456789ABCDEF    device
```

### 第二步：清除旧日志（重要！）

```powershell
# 先清除之前的日志，避免干扰
adb logcat -c
```

### 第三步：开始监控日志

打开 **两个** PowerShell 窗口：

**窗口 1 - 监控 WeatherWidget 专属日志：**
```powershell
powershell -Command "[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; adb logcat -d -s 'fz' 'ZTEWidget2DWeather' 'WeatherService' 'CurrentWeatherRequest' 'ForecastWeatherRequest'"
```

**窗口 2 - 监控所有网络请求和错误：**
```powershell
powershell -Command "adb logcat | Select-String -Pattern 'http|192.168|8.153.104|request|error|Error|ERROR|Exception'"
```
**窗口 3 - 监控 WeatherTV 服务日志：**
```powershell
powershell -Command "adb logcat -s 'WidgetService' 'WidgetService_SK' 'hf.weather' 'DefaultCityMain' 'CityDataMain'"
```
### 第四步：操作 App 触发请求

在手机上操作：
1. 添加 WeatherWidget 到桌面
2. 点击 Widget 进入设置
3. 选择城市
4. 等待刷新

### 第五步：观察日志输出

#### 正常情况应该看到：

```
D/fz      (  285): WeatherService: Starting download task
D/ZTEWidget2DWeather(  285): Requesting weather for 北京
D/CurrentWeatherRequest(  285): Request URL: http://192.168.2.188/api/weather
D/CurrentWeatherRequest(  285): Response received: 200 OK
D/fz      (  285): XML parsed successfully
D/ZTEWidget2DWeather(  285): Weather updated: 25°C
```

#### 如果看到错误：

**错误 1：连接超时**
```
W/System.err(  285): java.net.SocketTimeoutException: Connection timed out
```
→ 说明请求发出来了，但连不上服务器，检查：
- 电脑防火墙是否关闭
- 手机和电脑是否在同一个 WiFi
- weather_proxy 是否正常运行

**错误 2：找不到主机**
```
W/System.err(  285): java.net.UnknownHostException: 192.168.2.188
```
→ 说明手机无法解析或连接到该 IP，检查：
- IP 地址是否正确
- 手机和电脑是否在同一网段

**错误 3：HTTP 错误**
```
E/CurrentWeatherRequest(  285): HTTP error: 404
```
→ 说明连上了，但接口不对，检查：
- weather_proxy 接口路径是否正确
- 请求参数是否正确

---

## 常用调试命令速查表

### 基础命令

| 命令 | 作用 |
|------|------|
| `adb devices` | 查看连接的设备 |
| `adb logcat -c` | 清除日志缓存 |
| `adb logcat` | 查看所有日志（会刷屏） |
| `adb logcat -d` | 查看日志后退出（不持续监控） |

### 过滤日志

| 命令 | 作用 |
|------|------|
| `adb logcat -s TAG` | 只看指定 TAG 的日志 |
| `adb logcat *:E` | 只看错误信息 |
| `adb logcat -s TAG *:E` | 看 TAG 的日志 + 所有错误 |
| `adb logcat | grep "关键字"` | 过滤包含关键字的行（Linux/Mac） |
| `adb logcat | Select-String "关键字"` | 过滤包含关键字的行（PowerShell） |

### WeatherWidget 专用调试

```powershell
# 查看 WeatherWidget 所有日志
adb logcat -s fz ZTEWidget2DWeather WeatherService CurrentWeatherRequest ForecastWeatherRequest

# 查看网络相关日志
adb logcat | Select-String -Pattern "http|request|response|error"

# 查看特定 IP 的日志
adb logcat | Select-String -Pattern "192.168.2.188|8.153.104.150"
```

---

## 实战：调试 WeatherWidget 接口

### 场景 1：确认请求是否发出

**目标**：确认 WeatherWidget 是否真的发起了网络请求

**操作**：
```powershell
# 监控所有 HTTP 请求
adb logcat | Select-String -Pattern "http://|https://"
```

**预期结果**：
```
D/CurrentWeatherRequest(  285): http://192.168.2.188/api/weather
```

**如果没有输出**：
- Widget 没有触发请求
- 可能还没有到刷新时间
- 尝试：删除 Widget 重新添加，或进入设置选择城市

---

### 场景 2：确认服务器是否响应

**目标**：确认 weather_proxy 是否收到了请求

**操作**：
1. 在手机上添加 Widget
2. 在电脑上查看 weather_proxy 终端输出
3. 同时查看手机日志

**预期结果**：
- 电脑 weather_proxy 显示：`Request received: POST /api/weather`
- 手机日志显示：`Response received: 200 OK`

---

### 场景 3：排查连接问题

**目标**：为什么 Widget 一直显示"加载中..."

**操作**：
```powershell
# 查看所有错误
adb logcat *:E
```

**常见问题**：

1. **超时错误** - 服务器没响应
   ```
   W/System.err(  285): java.net.SocketTimeoutException
   ```
   → 检查 weather_proxy 是否运行，防火墙是否关闭

2. **连接拒绝** - 端口不对或服务器没启动
   ```
   W/System.err(  285): java.net.ConnectException: Connection refused
   ```
   → 检查 weather_proxy 端口是否为 80

3. **找不到主机** - IP 不对或网络不通
   ```
   W/System.err(  285): java.net.UnknownHostException
   ```
   → 检查 IP 地址是否正确

---

## 高级技巧

### 保存日志到文件

```powershell
# 保存日志到文件，方便分析
adb logcat -d > log.txt

# 持续保存（按 Ctrl+C 停止）
adb logcat > log.txt
```

### 只查看最新日志

```powershell
# 清除旧日志，只看新的
adb logcat -c
adb logcat
```

### 同时监控多个标签

```powershell
# 监控 WeatherWidget 所有相关组件
adb logcat -s fz:D ZTEWidget2DWeather:D WeatherService:D CurrentWeatherRequest:D ForecastWeatherRequest:D *:E
```

---

## 调试检查清单

- [ ] 手机已开启 USB 调试
- [ ] 电脑已安装 ADB 驱动
- [ ] `adb devices` 能显示设备
- [ ] weather_proxy 在电脑上正常运行
- [ ] 手机和电脑在同一 WiFi
- [ ] 已清除旧日志 `adb logcat -c`
- [ ] 已打开日志监控窗口
- [ ] 已操作 App 触发请求
- [ ] 能在日志中看到请求 URL
- [ ] 能在日志中看到响应状态

---

## 常见问题 FAQ

**Q: 为什么日志一直在刷屏？**
A: 这是正常的，Android 系统一直在产生日志。使用 `-s` 参数过滤指定标签。

**Q: 为什么看不到 WeatherWidget 的日志？**
A: 可能原因：
1. Widget 还没有触发请求（等一会儿或重新添加 Widget）
2. 日志标签不对（尝试用 `*:D` 查看所有调试日志）
3. App 没有运行（检查是否已安装到 system/app）

**Q: 怎么确认请求发到了我的电脑？**
A: 三个地方确认：
1. 手机日志显示请求 URL
2. 电脑 weather_proxy 显示收到请求
3. 电脑防火墙日志显示连接

**Q: 日志显示 "Connection refused" 是什么意思？**
A: 手机连上了电脑，但端口不对或服务没启动。检查：
- weather_proxy 是否运行
- 端口是否为 80
- 防火墙是否关闭
