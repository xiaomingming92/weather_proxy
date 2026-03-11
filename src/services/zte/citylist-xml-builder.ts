/**
 * 城市列表 XML 生成器
 * 生成 WeatherWidget 期望的嵌套 XML 格式
 */

import { getProvinceInfo } from './province-mapping.js';
import { getPinyin } from './pinyin-utils.js';

interface CityData {
  cityId: string;
  name: string;
  province?: string | null;
  latitude?: string | null;
  longitude?: string | null;
}

/**
 * 生成嵌套 XML 格式的城市列表
 * 格式：<?xml version="1.0" encoding="utf-8"?>
 *       <Citylist>
 *         <Nation ID="0101" en="zhongguo" ch="中国">
 *           <Province ID="010101" en="beijing" ch="北京">
 *             <District ID="01010101" en="beijing" ch="北京" zip="" />
 *           </Province>
 *         </Nation>
 *       </Citylist>
 */
export function buildNestedCityListXml(cities: CityData[]): string {
  console.log(`[CityList XML] Building nested XML for ${cities.length} cities`);

  // 按省份分组
  const groupedByProvince = groupCitiesByProvince(cities);

  // 生成 XML
  let xml = '<?xml version="1.0" encoding="utf-8" ?>\n';
  xml += '<Citylist>\n';
  xml += '<Nation ID="0101" en="zhongguo" ch="中国">\n';

  // 遍历每个省份
  for (const [provinceName, provinceCities] of Object.entries(
    groupedByProvince
  )) {
    const provinceInfo = getProvinceInfo(provinceName);
    if (!provinceInfo) {
      console.warn(
        `[CityList XML] Unknown province: ${provinceName}, skipping`
      );
      continue;
    }

    const provincePinyin = provinceInfo.pinyin;
    const provinceCode = provinceInfo.code;

    xml += `<Province ID="${provinceCode}" en="${provincePinyin}" ch="${provinceName}">\n`;

    // 遍历该省份的城市
    for (const city of provinceCities) {
      const cityPinyin = getPinyin(city.name);
      // 生成 8 位城市 ID：省份编码(4位) + 城市序号(2位，不足补0)
      const cityIndex = String(provinceCities.indexOf(city) + 1).padStart(
        2,
        '0'
      );
      const districtId = `${provinceCode}${cityIndex}`;

      xml += `  <District ID="${districtId}" en="${cityPinyin}" ch="${city.name}" zip="" />\n`;
    }

    xml += '</Province>\n';
  }

  xml += '</Nation>\n';
  xml += '</Citylist>';

  console.log(
    `[CityList XML] Generated XML with ${Object.keys(groupedByProvince).length} provinces`
  );
  return xml;
}

/**
 * 根据城市名称推断省份
 * 这是一个简化版本，实际应该使用完整的城市-省份映射表
 */
function inferProvince(cityName: string): string {
  // 直辖市
  if (cityName.includes('北京')) return '北京';
  if (cityName.includes('上海')) return '上海';
  if (cityName.includes('天津')) return '天津';
  if (cityName.includes('重庆')) return '重庆';

  // 省份关键词匹配
  const provinceKeywords: Record<string, string[]> = {
    河北: [
      '石家庄',
      '唐山',
      '秦皇岛',
      '邯郸',
      '邢台',
      '保定',
      '张家口',
      '承德',
      '沧州',
      '廊坊',
      '衡水',
    ],
    山西: [
      '太原',
      '大同',
      '阳泉',
      '长治',
      '晋城',
      '朔州',
      '晋中',
      '运城',
      '忻州',
      '临汾',
      '吕梁',
    ],
    辽宁: [
      '沈阳',
      '大连',
      '鞍山',
      '抚顺',
      '本溪',
      '丹东',
      '锦州',
      '营口',
      '阜新',
      '辽阳',
      '盘锦',
      '铁岭',
      '朝阳',
      '葫芦岛',
    ],
    吉林: [
      '长春',
      '吉林',
      '四平',
      '辽源',
      '通化',
      '白山',
      '松原',
      '白城',
      '延边',
      '长白山',
    ],
    黑龙江: [
      '哈尔滨',
      '齐齐哈尔',
      '鸡西',
      '鹤岗',
      '双鸭山',
      '大庆',
      '伊春',
      '佳木斯',
      '七台河',
      '牡丹江',
      '黑河',
      '绥化',
      '大兴安岭',
    ],
    江苏: [
      '南京',
      '苏州',
      '无锡',
      '常州',
      '南通',
      '扬州',
      '徐州',
      '连云港',
      '淮安',
      '盐城',
      '镇江',
      '泰州',
      '宿迁',
      '昆山',
    ],
    浙江: [
      '杭州',
      '宁波',
      '温州',
      '嘉兴',
      '湖州',
      '绍兴',
      '金华',
      '衢州',
      '舟山',
      '台州',
      '丽水',
    ],
    安徽: [
      '合肥',
      '芜湖',
      '蚌埠',
      '淮南',
      '马鞍山',
      '淮北',
      '铜陵',
      '安庆',
      '黄山',
      '滁州',
      '阜阳',
      '宿州',
      '六安',
      '亳州',
      '池州',
      '宣城',
    ],
    福建: [
      '福州',
      '厦门',
      '莆田',
      '三明',
      '泉州',
      '漳州',
      '南平',
      '龙岩',
      '宁德',
    ],
    江西: [
      '南昌',
      '景德镇',
      '萍乡',
      '九江',
      '新余',
      '鹰潭',
      '赣州',
      '吉安',
      '宜春',
      '抚州',
      '上饶',
    ],
    山东: [
      '济南',
      '青岛',
      '淄博',
      '枣庄',
      '东营',
      '烟台',
      '潍坊',
      '济宁',
      '泰安',
      '威海',
      '日照',
      '莱芜',
      '临沂',
      '德州',
      '聊城',
      '滨州',
      '菏泽',
    ],
    河南: [
      '郑州',
      '开封',
      '洛阳',
      '平顶山',
      '安阳',
      '鹤壁',
      '新乡',
      '焦作',
      '濮阳',
      '许昌',
      '漯河',
      '三门峡',
      '南阳',
      '商丘',
      '信阳',
      '周口',
      '驻马店',
    ],
    湖北: [
      '武汉',
      '黄石',
      '十堰',
      '宜昌',
      '襄阳',
      '鄂州',
      '荆门',
      '孝感',
      '荆州',
      '黄冈',
      '咸宁',
      '随州',
      '恩施',
      '仙桃',
      '潜江',
      '天门',
      '神农架',
    ],
    湖南: [
      '长沙',
      '株洲',
      '湘潭',
      '衡阳',
      '邵阳',
      '岳阳',
      '常德',
      '张家界',
      '益阳',
      '郴州',
      '永州',
      '怀化',
      '娄底',
      '湘西',
    ],
    广东: [
      '广州',
      '深圳',
      '珠海',
      '汕头',
      '韶关',
      '佛山',
      '江门',
      '湛江',
      '茂名',
      '肇庆',
      '惠州',
      '梅州',
      '汕尾',
      '河源',
      '阳江',
      '清远',
      '东莞',
      '中山',
      '潮州',
      '揭阳',
      '云浮',
    ],
    海南: [
      '海口',
      '三亚',
      '三沙',
      '儋州',
      '五指山',
      '琼海',
      '文昌',
      '万宁',
      '东方',
      '定安',
      '屯昌',
      '澄迈',
      '临高',
      '白沙',
      '昌江',
      '乐东',
      '陵水',
      '保亭',
      '琼中',
    ],
    四川: [
      '成都',
      '自贡',
      '攀枝花',
      '泸州',
      '德阳',
      '绵阳',
      '广元',
      '遂宁',
      '内江',
      '乐山',
      '南充',
      '眉山',
      '宜宾',
      '广安',
      '达州',
      '雅安',
      '巴中',
      '资阳',
      '阿坝',
      '甘孜',
      '凉山',
    ],
    贵州: [
      '贵阳',
      '六盘水',
      '遵义',
      '安顺',
      '毕节',
      '铜仁',
      '黔西南',
      '黔东南',
      '黔南',
    ],
    云南: [
      '昆明',
      '曲靖',
      '玉溪',
      '保山',
      '昭通',
      '丽江',
      '普洱',
      '临沧',
      '楚雄',
      '红河',
      '文山',
      '西双版纳',
      '大理',
      '德宏',
      '怒江',
      '迪庆',
    ],
    陕西: [
      '西安',
      '铜川',
      '宝鸡',
      '咸阳',
      '渭南',
      '延安',
      '汉中',
      '榆林',
      '安康',
      '商洛',
    ],
    甘肃: [
      '兰州',
      '嘉峪关',
      '金昌',
      '白银',
      '天水',
      '武威',
      '张掖',
      '平凉',
      '酒泉',
      '庆阳',
      '定西',
      '陇南',
      '临夏',
      '甘南',
    ],
    青海: ['西宁', '海东', '海北', '黄南', '海南', '果洛', '玉树', '海西'],
    台湾: ['台北', '高雄', '台中', '台南', '基隆', '新竹', '嘉义'],
    内蒙古: [
      '呼和浩特',
      '包头',
      '乌海',
      '赤峰',
      '通辽',
      '鄂尔多斯',
      '呼伦贝尔',
      '巴彦淖尔',
      '乌兰察布',
      '兴安',
      '锡林郭勒',
      '阿拉善',
    ],
    广西: [
      '南宁',
      '柳州',
      '桂林',
      '梧州',
      '北海',
      '防城港',
      '钦州',
      '贵港',
      '玉林',
      '百色',
      '贺州',
      '河池',
      '来宾',
      '崇左',
    ],
    西藏: ['拉萨', '日喀则', '昌都', '林芝', '山南', '那曲', '阿里'],
    宁夏: ['银川', '石嘴山', '吴忠', '固原', '中卫'],
    新疆: [
      '乌鲁木齐',
      '克拉玛依',
      '吐鲁番',
      '哈密',
      '昌吉',
      '博尔塔拉',
      '巴音郭楞',
      '阿克苏',
      '克孜勒苏',
      '喀什',
      '和田',
      '伊犁',
      '塔城',
      '阿勒泰',
      '石河子',
      '阿拉尔',
      '图木舒克',
      '五家渠',
      '北屯',
      '铁门关',
      '双河',
      '可克达拉',
      '昆玉',
      '胡杨河',
      '新星',
    ],
    香港: ['香港', '九龙', '新界'],
    澳门: ['澳门', '氹仔', '路环'],
  };

  for (const [province, keywords] of Object.entries(provinceKeywords)) {
    for (const keyword of keywords) {
      if (cityName.includes(keyword)) {
        return province;
      }
    }
  }

  // 如果无法推断，返回未知
  return '未知';
}

/**
 * 按省份分组城市
 */
function groupCitiesByProvince(cities: CityData[]): Record<string, CityData[]> {
  const grouped: Record<string, CityData[]> = {};

  for (const city of cities) {
    // 优先使用 city.province，如果不存在则推断
    const province = city.province || inferProvince(city.name);
    if (!grouped[province]) {
      grouped[province] = [];
    }
    grouped[province].push(city);
  }

  return grouped;
}

/**
 * 生成逗号分隔的城市列表（WeatherTV 使用）
 */
export function buildCommaSeparatedCityList(cities: CityData[]): string {
  return cities.map(city => city.name).join(',');
}
