/**
 * 拼音转换工具
 * 将中文城市名转换为拼音
 */

import { pinyin } from 'pinyin-pro';

/**
 * 将中文转换为拼音（小写，无音调）
 * @param chinese 中文字符串
 * @returns 拼音字符串
 */
export function getPinyin(chinese: string): string {
  try {
    return pinyin(chinese, { toneType: 'none', type: 'array' })
      .join('')
      .toLowerCase();
  } catch (error) {
    console.error(`[Pinyin] Failed to convert "${chinese}":`, error);
    // 如果转换失败，返回原始字符串的小写形式
    return chinese.toLowerCase();
  }
}

/**
 * 将中文转换为拼音（带分隔符）
 * @param chinese 中文字符串
 * @param separator 分隔符，默认为空字符串
 * @returns 拼音字符串
 */
export function getPinyinWithSeparator(
  chinese: string,
  separator: string = ''
): string {
  try {
    return pinyin(chinese, { toneType: 'none', type: 'array' })
      .join(separator)
      .toLowerCase();
  } catch (error) {
    console.error(`[Pinyin] Failed to convert "${chinese}":`, error);
    return chinese.toLowerCase();
  }
}
