# 任务列表：ZTE 城市列表接口适配

## 任务 1：创建省份映射工具

**描述**: 创建省份名称到编码的映射表

**文件**: `src/services/zte/province-mapping.ts`

**内容**:
```typescript
export const provinceMapping: Record<string, { code: string; pinyin: string }> = {
  '北京': { code: '0101', pinyin: 'beijing' },
  '安徽': { code: '0102', pinyin: 'anhui' },
  '澳门': { code: '0103', pinyin: 'macao' },
  '重庆': { code: '0104', pinyin: 'chongqing' },
  '福建': { code: '0105', pinyin: 'fujian' },
  '甘肃': { code: '0106', pinyin: 'gansu' },
  '广东': { code: '0107', pinyin: 'guangdong' },
  '广西': { code: '0108', pinyin: 'guangxi' },
  '贵州': { code: '0109', pinyin: 'guizhou' },
  '海南': { code: '0110', pinyin: 'hainan' },
  '河北': { code: '0111', pinyin: 'hebei' },
  '河南': { code: '0112', pinyin: 'henan' },
  '黑龙江': { code: '0113', pinyin: 'heilongjiang' },
  '湖北': { code: '0114', pinyin: 'hubei' },
  '湖南': { code: '0115', pinyin: 'hunan' },
  '吉林': { code: '0116', pinyin: 'jilin' },
  '江苏': { code: '0117', pinyin: 'jiangsu' },
  '江西': { code: '0118', pinyin: 'jiangxi' },
  '辽宁': { code: '0119', pinyin: 'liaoning' },
  '内蒙古': { code: '0120', pinyin: 'neimenggu' },
  '宁夏': { code: '0121', pinyin: 'ningxia' },
  '青海': { code: '0122', pinyin: 'qinghai' },
  '山东': { code: '0123', pinyin: 'shandong' },
  '山西': { code: '0124', pinyin: 'shanxi' },
  '陕西': { code: '0125', pinyin: 'shanxi' },
  '上海': { code: '0126', pinyin: 'shanghai' },
  '四川': { code: '0127', pinyin: 'sichuan' },
  '台湾': { code: '0128', pinyin: 'taiwan' },
  '天津': { code: '0129', pinyin: 'tianjin' },
  '西藏': { code: '0130', pinyin: 'xizang' },
  '香港': { code: '0131', pinyin: 'hongkong' },
  '新疆': { code: '0132', pinyin: 'xinjiang' },
  '云南': { code: '0133', pinyin: 'yunnan' },
  '浙江': { code: '0134', pinyin: 'zhejiang' },
};
```

---

## 任务 2：创建嵌套 XML 生成函数

**描述**: 创建函数将城市数据转换为嵌套 XML 格式

**文件**: `src/services/zte/citylist-xml-builder.ts`

**函数签名**:
```typescript
export function buildNestedCityListXml(cities: ZteCity[]): string
```

**逻辑**:
1. 按省份分组城市
2. 为每个省份生成 Province 标签
3. 为每个城市生成 District 标签
4. 组合成完整的 XML

**输出示例**:
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

---

## 任务 3：修改 GET /getStationList 接口

**描述**: 修改 `zte-weather.ts` 中的 GET 接口，返回嵌套 XML 格式

**文件**: `src/routes/zte-weather.ts`

**修改内容**:
1. 检测查询参数 `dataType=zte` 和 `code=1D765B`
2. 从数据库获取所有城市数据
3. 调用 `buildNestedCityListXml()` 生成 XML
4. 设置正确的 Content-Type: `application/xml; charset=utf-8`
5. 返回 XML 响应

**代码逻辑**:
```typescript
router.get('/getStationList', async (req, res) => {
  const { dataType, code } = req.query;
  
  // 如果是 WeatherWidget 的请求
  if (dataType === 'zte' && code === '1D765B') {
    const cities = await prisma.zteCity.findMany({
      select: {
        cityId: true,
        name: true,
        province: true,
        latitude: true,
        longitude: true,
      },
      orderBy: [{ province: 'asc' }, { name: 'asc' }],
    });
    
    const xml = buildNestedCityListXml(cities);
    res.set('Content-Type', 'application/xml; charset=utf-8');
    res.send(xml);
    return;
  }
  
  // 原有逻辑（WeatherTV 或其他）
  // ...
});
```

---

## 任务 4：添加城市拼音转换

**描述**: 为城市名称添加拼音转换功能

**方案**: 使用 `pinyin` 库或预定义的映射表

**文件**: `src/services/zte/pinyin-utils.ts`

**函数**:
```typescript
export function getPinyin(chinese: string): string
```

---

## 任务 5：测试验证

**描述**: 验证接口返回的 XML 格式正确

**测试步骤**:
1. 启动服务
2. 访问 `GET /zte/getweatheru.asmx/getStationList?dataType=zte&code=1D765B`
3. 检查响应是否为嵌套 XML 格式
4. 检查标签名是否为 `Citylist`、`Nation`、`Province`、`District`
5. 检查属性名是否为 `ID`、`ch`、`en`

---

## 任务 6：更新文档

**描述**: 更新接口文档，说明两种格式的区别

**文件**: `README.md` 或相关文档

**内容**:
- GET 接口支持两种格式
- 带 `dataType=zte&code=1D765B` 参数返回嵌套 XML（WeatherWidget）
- 不带参数返回逗号分隔列表（WeatherTV）
