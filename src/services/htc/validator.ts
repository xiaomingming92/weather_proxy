/**
 * HTC天气服务 - 参数校验器
 * 严格的入参校验，避免FC
 */

import {
  HTCAccuForecastRequest,
  HTCAccuLatLonSearchRequest,
  HTCAccuCityFindRequest,
  HTCAccuWeatherDataRequest,
  HTC_ACCU_API_KEY,
} from './types.js';

/**
 * 校验结果
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * 校验天气预报请求
 */
export function validateForecastRequest(
  query: Record<string, unknown>
): ValidationResult {
  const { ac, loccode } = query;

  // 检查ac参数
  if (!ac) {
    return { valid: false, error: 'Missing required parameter: ac' };
  }
  if (ac !== HTC_ACCU_API_KEY) {
    return { valid: false, error: 'Invalid API key' };
  }

  // 检查loccode参数
  if (!loccode) {
    return { valid: false, error: 'Missing required parameter: loccode' };
  }
  if (typeof loccode !== 'string') {
    return { valid: false, error: 'Invalid loccode format' };
  }

  // 验证loccode格式（ASI|CN|BJ|Beijing）
  const loccodeStr = loccode as string;
  if (loccodeStr.length < 2) {
    return { valid: false, error: 'loccode too short' };
  }

  return { valid: true };
}

/**
 * 校验经纬度搜索请求
 */
export function validateLatLonSearchRequest(
  query: Record<string, unknown>
): ValidationResult {
  const { ac, lat, lon } = query;

  // 检查ac参数
  if (!ac) {
    return { valid: false, error: 'Missing required parameter: ac' };
  }
  if (ac !== HTC_ACCU_API_KEY) {
    return { valid: false, error: 'Invalid API key' };
  }

  // 检查lat参数
  if (!lat) {
    return { valid: false, error: 'Missing required parameter: lat' };
  }
  const latNum = parseFloat(lat as string);
  if (isNaN(latNum) || latNum < -90 || latNum > 90) {
    return { valid: false, error: 'Invalid latitude' };
  }

  // 检查lon参数
  if (!lon) {
    return { valid: false, error: 'Missing required parameter: lon' };
  }
  const lonNum = parseFloat(lon as string);
  if (isNaN(lonNum) || lonNum < -180 || lonNum > 180) {
    return { valid: false, error: 'Invalid longitude' };
  }

  return { valid: true };
}

/**
 * 校验城市查找请求
 */
export function validateCityFindRequest(
  query: Record<string, unknown>
): ValidationResult {
  const { q } = query;

  // 检查q参数
  if (!q) {
    return { valid: false, error: 'Missing required parameter: q' };
  }
  if (typeof q !== 'string') {
    return { valid: false, error: 'Invalid query format' };
  }

  const qStr = q as string;
  if (qStr.length < 1) {
    return { valid: false, error: 'Query too short' };
  }
  if (qStr.length > 100) {
    return { valid: false, error: 'Query too long' };
  }

  return { valid: true };
}

/**
 * 校验天气数据请求
 */
export function validateWeatherDataRequest(
  query: Record<string, unknown>
): ValidationResult {
  const { city } = query;

  // 检查city参数
  if (!city) {
    return { valid: false, error: 'Missing required parameter: city' };
  }
  if (typeof city !== 'string') {
    return { valid: false, error: 'Invalid city format' };
  }

  const cityStr = city as string;
  if (cityStr.length < 1) {
    return { valid: false, error: 'City code too short' };
  }

  return { valid: true };
}

/**
 * 解析loccode获取城市名
 * 格式：ASI|CN|BJ|Beijing
 * @param loccode 城市代码
 * @returns 城市名
 */
export function parseLocCode(loccode: string): string {
  // 按|分割
  const parts = loccode.split('|');

  // 取最后一部分作为城市名
  if (parts.length > 0) {
    const cityName = parts[parts.length - 1];
    // 替换下划线为空格
    return cityName.replace(/_/g, ' ');
  }

  return loccode;
}

/**
 * 生成错误响应XML
 */
export function generateErrorXml(error: string): string {
  return `<?xml version="1.0" encoding="utf-8"?><error>${escapeXml(error)}</error>`;
}

/**
 * XML转义
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
