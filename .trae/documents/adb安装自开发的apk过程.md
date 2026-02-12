<!--
 * @Author       : Z2-WIN\xmm wujixmm@gmail.com
 * @Date         : 2026-02-12 15:34:33
 * @LastEditors  : Z2-WIN\xmm wujixmm@gmail.com
 * @LastEditTime : 2026-02-12 15:37:55
 * @FilePath     : \decompile\weather_proxy\.trae\documents\adb安装过程.md
 * @Description  : ADB安装自开发APK的完整指南
-->

# ADB 安装自开发 APK 完整指南

## Windows 系统

### 普通应用安装（/data/app/）
```powershell
# 安装 APK
adb install WeatherWidget.apk

# 覆盖安装（保留数据）
adb install -r WeatherWidget.apk

# 先卸载再安装
adb uninstall com.zte.WeatherWidget
adb install WeatherWidget.apk
```

### 系统应用安装（/system/app/）
```powershell
# 1. 推送到系统目录（需要 root）
powershell -Command "adb push WeatherWidget.apk /system/app/"

# 2. 修改权限
powershell -Command "adb shell chmod 644 /system/app/WeatherWidget.apk"

# 3. 重启设备
powershell -Command "adb reboot"
```

### Windows 下的坑
1. **Git Bash 路径解析问题**
   - 错误：`adb push ./app.apk /system/app/` → 被解析为 `C:/Program Files/Git/system/app/`
   - 解决：使用 PowerShell 或 CMD，或给路径加双引号

2. **PowerShell 执行策略**
   - 可能遇到执行策略限制
   - 解决：`Set-ExecutionPolicy RemoteSigned`

3. **驱动问题**
   - Windows 需要安装 ADB 驱动
   - 解决：安装 Google USB Driver 或厂商驱动

---

## macOS 系统

### 普通应用安装
```bash
# 安装 APK
adb install WeatherWidget.apk

# 覆盖安装
adb install -r WeatherWidget.apk
```

### 系统应用安装
```bash
# 1. 推送到系统目录
adb push WeatherWidget.apk /system/app/

# 2. 修改权限
adb shell chmod 644 /system/app/WeatherWidget.apk

# 3. 重启
adb reboot
```

### macOS 下的坑
1. **权限问题**
   - 错误：`adb: command not found`
   - 解决：添加环境变量 `export PATH=$PATH:~/Library/Android/sdk/platform-tools/`

2. **M1/M2 芯片兼容**
   - 部分旧版 ADB 可能不兼容 ARM
   - 解决：使用 Homebrew 安装 `brew install android-platform-tools`

3. **路径空格问题**
   - 如果路径包含空格，需要用引号包裹
   - 正确：`adb push "/Users/name/My App/app.apk" /system/app/`

---

## Linux 系统

### 普通应用安装
```bash
# 安装 APK
adb install WeatherWidget.apk

# 覆盖安装
adb install -r WeatherWidget.apk
```

### 系统应用安装
```bash
# 1. 推送到系统目录
adb push WeatherWidget.apk /system/app/

# 2. 修改权限
adb shell chmod 644 /system/app/WeatherWidget.apk

# 3. 重启
adb reboot
```

### Linux 下的坑
1. **权限问题**
   - 错误：`no permissions (user in plugdev group)`
   - 解决：添加 udev 规则
     ```bash
     sudo tee /etc/udev/rules.d/51-android.rules <<EOF
     SUBSYSTEM=="usb", ATTR{idVendor}=="19d2", MODE="0666", GROUP="plugdev"
     EOF
     sudo udevadm control --reload-rules
     sudo udevadm trigger
     ```

2. **路径问题**
   - Linux 区分大小写
   - 确保文件名大小写正确

3. **SELinux**
   - 某些发行版可能限制 ADB 访问
   - 解决：临时禁用 `setenforce 0`

---

## 通用问题排查

### 设备未识别
```bash
# 检查设备连接
adb devices

# 如果显示 unauthorized，需要在手机上允许 USB 调试
# 如果显示 offline，重新插拔 USB 或重启 ADB
adb kill-server
adb start-server
```

### 安装失败常见错误

| 错误信息 | 原因 | 解决 |
|---------|------|------|
| `INSTALL_FAILED_ALREADY_EXISTS` | 应用已存在 | 使用 `-r` 参数或先卸载 |
| `INSTALL_FAILED_INSUFFICIENT_STORAGE` | 存储空间不足 | 清理空间 |
| `INSTALL_FAILED_VERSION_DOWNGRADE` | 版本降级 | 先卸载旧版本 |
| `INSTALL_PARSE_FAILED_INCONSISTENT_CERTIFICATES` | 签名不一致 | 卸载后重新安装 |
| `failed to copy ... No such file or directory` | 路径解析错误 | 使用绝对路径或 PowerShell |

### 系统应用安装前提
1. **设备必须 Root**
2. **/system 分区必须可写**
   ```bash
   adb root
   adb remount
   # 或
   adb shell su -c "mount -o rw,remount /system"
   ```

---

## 快速检查清单

- [ ] 开启开发者选项
- [ ] 开启 USB 调试
- [ ] 允许电脑 RSA 密钥（弹窗点击允许）
- [ ] 设备已连接：`adb devices` 显示设备
- [ ] 如果是系统应用，确保设备已 Root
- [ ] 安装后重启设备（系统应用必需）
