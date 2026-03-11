# 验收清单：ZTE 城市列表接口适配

## 功能验收

### 接口功能

- [ ] GET `/zte/getweatheru.asmx/getStationList?dataType=zte&code=1D765B` 返回嵌套 XML
- [ ] POST `/zte/getweatheru.asmx/getStationList` 返回逗号分隔城市列表（原有功能保持不变）
- [ ] POST `/zte/getweatheru.asmx/getData` 天气数据接口正常工作

### XML 格式验证

- [ ] 根标签为 `<Citylist>`（不是 `<CityList>`）
- [ ] 包含 `<Nation ID="0101" en="zhongguo" ch="中国">`
- [ ] 包含 `<Province ID="..." en="..." ch="...">` 标签
- [ ] 包含 `<District ID="..." en="..." ch="..." zip="" />` 标签
- [ ] District ID 格式为 `01010101`（8位数字）
- [ ] XML 声明为 `<?xml version="1.0" encoding="utf-8"?>`
- [ ] Content-Type 为 `application/xml; charset=utf-8`

### 数据完整性

- [ ] 包含所有省份
- [ ] 每个省份包含对应的城市
- [ ] 城市 ID 正确
- [ ] 城市名称正确
- [ ] 省份编码正确

## 兼容性验收

### WeatherWidget 兼容性

- [ ] APK 能成功下载城市列表 XML
- [ ] XML 能正确解析（不报错）
- [ ] 城市列表能正确显示
- [ ] 模糊搜索功能正常
- [ ] 精确搜索功能正常

### WeatherTV 兼容性

- [ ] 城市列表接口正常工作
- [ ] 天气数据接口正常工作

## 性能验收

- [ ] 接口响应时间 < 2秒
- [ ] XML 大小合理（< 500KB）
- [ ] 内存使用正常

## 代码质量

- [ ] 代码通过 TypeScript 编译
- [ ] ESLint 检查通过
- [ ] 代码有适当的注释
- [ ] 错误处理完善

## 部署验收

- [ ] VPS 上接口正常工作
- [ ] 80 端口可访问
- [ ] 日志记录正常
