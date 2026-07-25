/**
 * 定时任务时间配置
 * 集中化管理所有定时任务的执行时间
 */

export interface CronTimeConfig {
  minute: string; // 分钟 (0-59, 或 */N)
  hour: string; // 小时 (0-23, 或 */N)
  dayOfMonth: string; // 日期 (1-31, 或 */N)
  month: string; // 月份 (1-12)
  dayOfWeek: string; // 星期 (0-7, 0 和 7 都是周日)
}

/**
 * 生成 cron 表达式
 */
export function generateCronExpression(config: CronTimeConfig): string {
  return `${config.minute} ${config.hour} ${config.dayOfMonth} ${config.month} ${config.dayOfWeek}`;
}

/**
 * 定时任务时间配置表
 *
 * 设计原则：
 * 1. 预刷新任务：每 12 小时执行一次，分散在不同分钟，避免同时调用 API
 * 2. 缓存清理：每天凌晨执行，避开业务高峰期
 * 3. 城市同步：每 3 天执行一次，凌晨时段
 */
export const CRON_SCHEDULES: Record<string, CronTimeConfig> = {
  // ============================================
  // 天气预刷新任务（每 12 小时一次）
  // ============================================

  // ZTE 天气预刷新：0:00, 12:00（每天 2 次）
  ZTE_FORECAST_UPDATE: {
    minute: '0',
    hour: '*/12',
    dayOfMonth: '*',
    month: '*',
    dayOfWeek: '*',
  },

  // HTC AccuWeather 天气预刷新：0:30, 12:30（每天 2 次）
  HTC_ACCU_FORECAST_UPDATE: {
    minute: '30',
    hour: '*/12',
    dayOfMonth: '*',
    month: '*',
    dayOfWeek: '*',
  },

  // HTC 华风天气预刷新：与 Accu 同时执行（0:30, 12:30）
  HTC_HUAFENG_FORECAST_UPDATE: {
    minute: '30',
    hour: '*/12',
    dayOfMonth: '*',
    month: '*',
    dayOfWeek: '*',
  },

  // HTC G13 天气预刷新：与 Accu、华风同时执行（0:30, 12:30）
  HTC_G13_FORECAST_UPDATE: {
    minute: '30',
    hour: '*/12',
    dayOfMonth: '*',
    month: '*',
    dayOfWeek: '*',
  },

  // ============================================
  // 缓存清理任务（每天凌晨）
  // ============================================

  /** ZTE 缓存清理：每天 00:00 */
  ZTE_CACHE_CLEANUP: {
    minute: '0',
    hour: '0',
    dayOfMonth: '*',
    month: '*',
    dayOfWeek: '*',
  },

  /** HTC AccuWeather 缓存清理：每天 01:00（与 ZTE 错开） */
  HTC_ACCU_CACHE_CLEANUP: {
    minute: '0',
    hour: '1',
    dayOfMonth: '*',
    month: '*',
    dayOfWeek: '*',
  },

  // ============================================
  // 活跃城市清理任务（每周日凌晨）
  // ============================================

  /** ZTE 活跃城市清理：每周日 05:00（清理 3 天未请求的城市） */
  ZTE_ACTIVE_CITY_CLEANUP: {
    minute: '0',
    hour: '5',
    dayOfMonth: '*',
    month: '*',
    dayOfWeek: '0', // 周日
  },

  /** HTC AccuWeather 活跃城市清理：每周日 05:30 */
  HTC_ACCU_ACTIVE_CITY_CLEANUP: {
    minute: '30',
    hour: '5',
    dayOfMonth: '*',
    month: '*',
    dayOfWeek: '0',
  },

  /** HTC 华风天气活跃城市清理：每周日 06:00 */
  HTC_HUAFENG_ACTIVE_CITY_CLEANUP: {
    minute: '0',
    hour: '6',
    dayOfMonth: '*',
    month: '*',
    dayOfWeek: '0',
  },

  /** HTC G13 活跃城市清理：每周日 06:30 */
  HTC_G13_ACTIVE_CITY_CLEANUP: {
    minute: '30',
    hour: '6',
    dayOfMonth: '*',
    month: '*',
    dayOfWeek: '0',
  },

  // ============================================
  // 城市列表同步任务（每 3 天凌晨）
  // ============================================

  /** ZTE 城市列表同步：每 3 天 02:30 */
  ZTE_CITY_SYNC: {
    minute: '30',
    hour: '2',
    dayOfMonth: '*/3',
    month: '*',
    dayOfWeek: '*',
  },

  /** HTC AccuWeather 城市列表同步：每 3 天 03:00（与 ZTE 错开） */
  HTC_ACCU_CITY_SYNC: {
    minute: '0',
    hour: '3',
    dayOfMonth: '*/3',
    month: '*',
    dayOfWeek: '*',
  },

  /** HTC 华风天气城市列表同步：每 3 天 03:30 */
  HTC_HUAFENG_CITY_SYNC: {
    minute: '30',
    hour: '3',
    dayOfMonth: '*/3',
    month: '*',
    dayOfWeek: '*',
  },

  /** HTC G13 城市列表同步：每 3 天 04:00 */
  HTC_G13_CITY_SYNC: {
    minute: '0',
    hour: '4',
    dayOfMonth: '*/3',
    month: '*',
    dayOfWeek: '*',
  },
};

/**
 * 获取 cron 表达式字符串
 */
export function getCronExpression(taskName: string): string {
  const config = CRON_SCHEDULES[taskName];
  if (!config) {
    throw new Error(`Unknown cron task: ${taskName}`);
  }
  return generateCronExpression(config);
}

/**
 * 获取所有任务的执行时间描述
 */
export function getCronDescription(taskName: string): string {
  const config = CRON_SCHEDULES[taskName];
  if (!config) {
    throw new Error(`Unknown cron task: ${taskName}`);
  }

  // 根据任务类型生成描述
  if (taskName.includes('FORECAST_UPDATE')) {
    const brand = taskName.split('_')[0];
    const hourInterval = config.hour.replace('*/', '');
    return `${brand} forecast update: every ${hourInterval} hours at minute ${config.minute}`;
  }

  if (taskName.includes('CACHE_CLEANUP')) {
    const brand = taskName.split('_')[0];
    return `${brand} cache cleanup: every day at ${config.hour.padStart(2, '0')}:${config.minute.padStart(2, '0')}`;
  }

  if (taskName.includes('ACTIVE_CITY_CLEANUP')) {
    const brand = taskName.split('_')[0];
    return `${brand} active city cleanup: every Sunday at ${config.hour.padStart(2, '0')}:${config.minute.padStart(2, '0')} (remove cities not requested in 3 days)`;
  }

  if (taskName.includes('CITY_SYNC')) {
    const brand = taskName.split('_')[0];
    const dayInterval = config.dayOfMonth.replace('*/', '');
    return `${brand} city sync: every ${dayInterval} days at ${config.hour.padStart(2, '0')}:${config.minute.padStart(2, '0')}`;
  }

  return `Custom task: ${JSON.stringify(config)}`;
}

export default {
  CRON_SCHEDULES,
  generateCronExpression,
  getCronExpression,
  getCronDescription,
};
