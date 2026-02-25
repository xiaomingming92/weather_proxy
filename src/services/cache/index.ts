/*
 * @Author       : Z2-WIN\xmm wujixmm@gmail.com
 * @Date         : 2026-02-24 16:48:45
 * @LastEditors  : Z2-WIN\xmm wujixmm@gmail.com
 * @LastEditTime : 2026-02-24 16:54:26
 * @FilePath     : \decompile\weather_proxy\src\services\cache\index.ts
 * @Description  :
 */
// 缓存服务统一导出
// 使用策略模式组织 ZTE、HTC 和HTC华风天气的缓存服务

export { default as zteCache } from './zte-cache.js';
export { default as htcAccuCache } from './htc-accu-cache.js';
// 兼容导出
export { default as htcCache } from './htc-accu-cache.js';
export { default as htcHuaFengCache } from './htc-huafeng-cache.js';
export {
  type CacheStrategy,
  type CacheCity,
  type CacheWeatherData,
  CacheContext,
  type DeviceType,
  createCacheStrategy,
} from './cache-strategy.js';
