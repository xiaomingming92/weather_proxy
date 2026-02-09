// 时区处理工具函数
// 支持不同时区的时间转换和处理

/**
 * 根据时区转换时间戳
 * @param timestamp 时间戳
 * @param timezone 时区（如 "Asia/Shanghai"）
 * @returns 转换后的Date对象
 */
export function timestampToTimezone(
  timestamp: number,
  timezone: string = 'Asia/Shanghai'
): Date {
  const date = new Date(timestamp);

  // 这里可以使用更复杂的时区转换库
  // 目前使用简单的实现，后续可以扩展
  return date;
}

/**
 * 获取指定时区的当前时间戳
 * @param timezone 时区（如 "Asia/Shanghai"）
 * @returns 调整后的时间戳
 */
export function getTimezoneTimestamp(
  timezone: string = 'Asia/Shanghai'
): number {
  // 目前返回服务器时间戳
  // 后续可以根据时区进行调整
  return Date.now();
}

/**
 * 将时间戳格式化为指定时区的可读时间
 * @param timestamp 时间戳
 * @param timezone 时区
 * @param format 格式化选项
 * @returns 格式化后的时间字符串
 */
export function formatTimestamp(
  timestamp: number,
  timezone: string = 'Asia/Shanghai',
  format: 'iso' | 'local' | 'date' = 'local'
): string {
  const date = new Date(timestamp);

  switch (format) {
    case 'iso':
      return date.toISOString();
    case 'date':
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    case 'local':
    default:
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
  }
}

/**
 * 计算不同时区的时间差
 * @param timestamp1 第一个时间戳
 * @param timestamp2 第二个时间戳
 * @returns 时间差（毫秒）
 */
export function getTimeDifference(
  timestamp1: number,
  timestamp2: number
): number {
  return Math.abs(timestamp1 - timestamp2);
}

/**
 * 判断时间戳是否在指定的时间范围内
 * @param timestamp 要检查的时间戳
 * @param startTime 开始时间戳
 * @param endTime 结束时间戳
 * @returns 是否在范围内
 */
export function isTimestampInRange(
  timestamp: number,
  startTime: number,
  endTime: number
): boolean {
  return timestamp >= startTime && timestamp <= endTime;
}

/**
 * 获取支持的时区列表
 * @returns 时区列表
 */
export function getSupportedTimezones(): string[] {
  return [
    'Asia/Shanghai', // 上海
    'Asia/Beijing', // 北京
    'Asia/Tokyo', // 东京
    'Asia/Seoul', // 首尔
    'Asia/Hong_Kong', // 香港
    'Asia/Singapore', // 新加坡
    'Asia/Dubai', // 迪拜
    'Europe/London', // 伦敦
    'Europe/Paris', // 巴黎
    'Europe/Berlin', // 柏林
    'America/New_York', // 纽约
    'America/Los_Angeles', // 洛杉矶
    'America/Chicago', // 芝加哥
    'Australia/Sydney', // 悉尼
    'Australia/Melbourne', // 墨尔本
  ];
}

/**
 * 获取时区的偏移量（分钟）
 * @param timezone 时区
 * @returns 时区偏移量
 */
export function getTimezoneOffset(timezone: string = 'Asia/Shanghai'): number {
  // 简单实现，后续可以扩展
  const timezoneOffsets: Record<string, number> = {
    'Asia/Shanghai': 480, // UTC+8
    'Asia/Beijing': 480, // UTC+8
    'Asia/Tokyo': 540, // UTC+9
    'Asia/Seoul': 540, // UTC+9
    'Asia/Hong_Kong': 480, // UTC+8
    'Asia/Singapore': 480, // UTC+8
    'Asia/Dubai': 240, // UTC+4
    'Europe/London': 0, // UTC+0
    'Europe/Paris': 60, // UTC+1
    'Europe/Berlin': 60, // UTC+1
    'America/New_York': -300, // UTC-5
    'America/Los_Angeles': -480, // UTC-8
    'America/Chicago': -360, // UTC-6
    'Australia/Sydney': 600, // UTC+10
    'Australia/Melbourne': 600, // UTC+10
  };

  return timezoneOffsets[timezone] || 480; // 默认上海时区
}
