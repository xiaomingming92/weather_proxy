/**
 * 省份映射表
 * 用于生成 WeatherWidget 期望的嵌套 XML 格式
 */

export interface ProvinceInfo {
  code: string; // 4位编码，如 0101
  pinyin: string;
}

export const provinceMapping: Record<string, ProvinceInfo> = {
  北京: { code: '0101', pinyin: 'beijing' },
  安徽: { code: '0102', pinyin: 'anhui' },
  澳门: { code: '0103', pinyin: 'macao' },
  重庆: { code: '0104', pinyin: 'chongqing' },
  福建: { code: '0105', pinyin: 'fujian' },
  甘肃: { code: '0106', pinyin: 'gansu' },
  广东: { code: '0107', pinyin: 'guangdong' },
  广西: { code: '0108', pinyin: 'guangxi' },
  贵州: { code: '0109', pinyin: 'guizhou' },
  海南: { code: '0110', pinyin: 'hainan' },
  河北: { code: '0111', pinyin: 'hebei' },
  河南: { code: '0112', pinyin: 'henan' },
  黑龙江: { code: '0113', pinyin: 'heilongjiang' },
  湖北: { code: '0114', pinyin: 'hubei' },
  湖南: { code: '0115', pinyin: 'hunan' },
  吉林: { code: '0116', pinyin: 'jilin' },
  江苏: { code: '0117', pinyin: 'jiangsu' },
  江西: { code: '0118', pinyin: 'jiangxi' },
  辽宁: { code: '0119', pinyin: 'liaoning' },
  内蒙古: { code: '0120', pinyin: 'neimenggu' },
  宁夏: { code: '0121', pinyin: 'ningxia' },
  青海: { code: '0122', pinyin: 'qinghai' },
  山东: { code: '0123', pinyin: 'shandong' },
  山西: { code: '0124', pinyin: 'shanxi' },
  陕西: { code: '0125', pinyin: 'shanxi' },
  上海: { code: '0126', pinyin: 'shanghai' },
  四川: { code: '0127', pinyin: 'sichuan' },
  台湾: { code: '0128', pinyin: 'taiwan' },
  天津: { code: '0129', pinyin: 'tianjin' },
  西藏: { code: '0130', pinyin: 'xizang' },
  香港: { code: '0131', pinyin: 'hongkong' },
  新疆: { code: '0132', pinyin: 'xinjiang' },
  云南: { code: '0133', pinyin: 'yunnan' },
  浙江: { code: '0134', pinyin: 'zhejiang' },
};

/**
 * 根据省份名称获取省份信息
 */
export function getProvinceInfo(provinceName: string): ProvinceInfo | null {
  return provinceMapping[provinceName] || null;
}

/**
 * 获取所有省份列表
 */
export function getAllProvinces(): string[] {
  return Object.keys(provinceMapping);
}
