// 时间处理工具函数
// 实现UTC时间到本地时间的转换

/**
 * 将UTC时间转换为本地时间
 * @param utcTime UTC时间（Date对象或时间字符串）
 * @returns 本地时间的Date对象
 */
export function utcToLocalTime(utcTime: Date | string): Date {
  const date = typeof utcTime === 'string' ? new Date(utcTime) : utcTime;
  // 转换为本地时间：UTC时间 + 时区偏移
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000);
}

/**
 * 格式化本地时间为可读格式
 * @param date 日期对象
 * @param format 格式化选项
 * @returns 格式化后的时间字符串
 */
export function formatLocalTime(
  date: Date | string,
  format: 'iso' | 'local' | 'date' = 'local'
): string {
  const localDate = typeof date === 'string' ? new Date(date) : date;

  switch (format) {
    case 'iso':
      return localDate.toISOString();
    case 'date':
      return localDate.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    case 'local':
    default:
      return localDate.toLocaleString('zh-CN', {
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
 * 获取当前本地时间
 * @returns 当前本地时间的Date对象
 */
export function getCurrentLocalTime(): Date {
  return utcToLocalTime(new Date());
}

/**
 * 计算过期时间（本地时间）
 * @param minutesFromNow 从现在开始的分钟数
 * @returns 过期时间的Date对象
 */
export function calculateExpiryTime(minutesFromNow: number): Date {
  const now = getCurrentLocalTime();
  return new Date(now.getTime() + minutesFromNow * 60 * 1000);
}
