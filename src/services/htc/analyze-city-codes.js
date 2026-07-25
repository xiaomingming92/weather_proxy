#!/usr/bin/env node
/**
 * 华风编码与和风编码转换分析工具
 * 验证编码转换的正确率
 */

const fs = require('fs');
const path = require('path');

// 已知的华风编码映射（从项目中获取）
const knownHuafengCodes = {
  '01011713': '北京',
  '01011714': '上海',
  '01011721': '重庆',
  '01012601': '天津',
  '01011712': '南京',
  '01011715': '广州',
  '01011716': '深圳',
  '01011717': '杭州',
  '01011718': '成都',
  '01011719': '武汉',
  '01011720': '西安',
};

// 解析CSV文件
function parseCSV(content) {
  const lines = content.trim().split('\n');
  const data = [];

  for (let i = 2; i < lines.length; i++) {
    const values = lines[i].split(',');
    if (values.length >= 12) {
      data.push({
        cityId: values[0], // CN101010100
        cityEn: values[1], // beijing
        cityCn: values[2], // 北京
        provinceCn: values[7], // 北京
        latitude: values[10],
        longitude: values[11],
      });
    }
  }

  return data;
}

// 和风编码转换为华风编码
function convertToHuafeng(heWeatherId) {
  // 去掉 cn 前缀
  if (!heWeatherId.startsWith('CN')) return null;

  const code = heWeatherId.substring(2); // 101010100

  // 取前8位作为华风编码
  // 10101010 -> 0101010 (去掉第一个1，前面补0)
  if (code.length >= 8) {
    const huafengCode = '0' + code.substring(1, 8);
    return huafengCode;
  }

  return null;
}

// 主分析函数
function analyzeCodes() {
  const csvPath = path.join(__dirname, 'heweather-city-list.csv');

  if (!fs.existsSync(csvPath)) {
    console.error('CSV文件不存在:', csvPath);
    return;
  }

  const content = fs.readFileSync(csvPath, 'utf-8');
  const cities = parseCSV(content);

  console.log('=== 华风/和风编码转换分析 ===\n');
  console.log(`总城市数: ${cities.length}`);

  // 1. 统计转换结果
  let convertible = 0;
  let notConvertible = 0;
  const convertedCodes = {};

  for (const city of cities) {
    const huafengCode = convertToHuafeng(city.cityId);
    if (huafengCode) {
      convertible++;
      if (!convertedCodes[huafengCode]) {
        convertedCodes[huafengCode] = {
          heId: city.cityId,
          cityCn: city.cityCn,
          provinceCn: city.provinceCn,
        };
      }
    } else {
      notConvertible++;
    }
  }

  console.log(`\n可转换编码数: ${convertible}`);
  console.log(`不可转换编码数: ${notConvertible}`);
  console.log(`转换率: ${((convertible / cities.length) * 100).toFixed(2)}%`);

  // 2. 验证已知编码的匹配率
  console.log('\n=== 已知编码验证 ===');
  let matched = 0;
  let notMatched = 0;
  const matchDetails = [];

  for (const [huafengCode, expectedCity] of Object.entries(knownHuafengCodes)) {
    const converted = convertedCodes[huafengCode];
    if (converted) {
      // 检查城市名是否匹配（或包含关系）
      const isMatch =
        converted.cityCn.includes(expectedCity) ||
        expectedCity.includes(converted.cityCn) ||
        converted.provinceCn.includes(expectedCity) ||
        expectedCity.includes(converted.provinceCn);

      if (isMatch) {
        matched++;
        matchDetails.push({
          huafengCode,
          expectedCity,
          matchedCity: `${converted.cityCn}(${converted.provinceCn})`,
          status: '✓ 匹配',
        });
      } else {
        notMatched++;
        matchDetails.push({
          huafengCode,
          expectedCity,
          matchedCity: `${converted.cityCn}(${converted.provinceCn})`,
          status: '✗ 不匹配',
        });
      }
    } else {
      notMatched++;
      matchDetails.push({
        huafengCode,
        expectedCity,
        matchedCity: null,
        status: '✗ 未找到',
      });
    }
  }

  console.log(`\n验证样本数: ${Object.keys(knownHuafengCodes).length}`);
  console.log(`匹配成功: ${matched}`);
  console.log(`匹配失败: ${notMatched}`);
  console.log(
    `匹配率: ${((matched / Object.keys(knownHuafengCodes).length) * 100).toFixed(2)}%`
  );

  // 3. 详细匹配结果
  console.log('\n=== 详细匹配结果 ===');
  for (const detail of matchDetails) {
    console.log(
      `${detail.status} ${detail.huafengCode} -> 期望: ${detail.expectedCity}, 实际: ${detail.matchedCity || 'N/A'}`
    );
  }

  // 4. 示例转换
  console.log('\n=== 转换示例 ===');
  const examples = cities.slice(0, 10);
  for (const city of examples) {
    const huafengCode = convertToHuafeng(city.cityId);
    console.log(
      `${city.cityId} -> ${huafengCode || 'N/A'} (${city.cityCn}, ${city.provinceCn})`
    );
  }

  // 5. 生成转换后的JSON
  console.log('\n=== 生成转换后的映射表 ===');
  const huafengToHeWeather = {};

  for (const city of cities) {
    const huafengCode = convertToHuafeng(city.cityId);
    if (huafengCode && !huafengToHeWeather[huafengCode]) {
      huafengToHeWeather[huafengCode] = {
        city: city.cityCn,
        heWeatherId: city.cityId,
        lat: city.latitude,
        lon: city.longitude,
      };
    }
  }

  const outputPath = path.join(__dirname, 'huafeng-to-heweather-mapping.json');
  fs.writeFileSync(
    outputPath,
    JSON.stringify(huafengToHeWeather, null, 2),
    'utf-8'
  );
  console.log(`映射表已保存: ${outputPath}`);
  console.log(`映射条目数: ${Object.keys(huafengToHeWeather).length}`);
}

// 运行分析
analyzeCodes();
