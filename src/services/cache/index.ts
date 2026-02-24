// 缓存服务统一导出
// 使用策略模式组织 ZTE 和 HTC 的缓存服务

export { default as zteCache } from './zte-cache.js';
export { default as htcCache } from './htc-cache.js';
export {
  CacheStrategy,
  CacheCity,
  CacheWeatherData,
  CacheContext,
  DeviceType,
  createCacheStrategy,
} from './cache-strategy.js';
