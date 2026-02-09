/*
 * @Author       : Z2-WIN\xmm wujixmm@gmail.com
 * @Date         : 2026-02-09 14:31:08
 * @LastEditors  : Z2-WIN\xmm wujixmm@gmail.com
 * @LastEditTime : 2026-02-09 14:33:08
 * @FilePath     : \decompile\weather_proxy\src\config\env.ts
 * @Description  :
 */
// 统一环境变量加载模块
// 使用 import.meta.url 确保路径正确，不依赖工作目录

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 计算项目根目录路径
const projectRoot = path.resolve(__dirname, '..', '..');

// 确定环境变量文件
import fs from 'fs';

let envFile = '.env';
const prodEnvPath = path.resolve(projectRoot, '.env.prod');
const devEnvPath = path.resolve(projectRoot, '.env');

// 优先检查 .env.prod 文件是否存在
if (fs.existsSync(prodEnvPath)) {
  envFile = '.env.prod';
  console.log('[Config] Production environment detected, using .env.prod');
} else if (fs.existsSync(devEnvPath)) {
  console.log('[Config] Development environment detected, using .env');
} else {
  console.error('[Config] No environment file found!');
  throw new Error('No environment file found (.env or .env.prod)');
}

const envFilePath = path.resolve(projectRoot, envFile);
console.log(`[Config] Loading environment variables from: ${envFilePath}`);

// 加载环境变量
try {
  dotenv.config({ path: envFilePath });
  console.log('[Config] Environment variables loaded successfully');
} catch (error) {
  console.error('[Config] Error loading environment variables:', error);
  throw error;
}

// 验证必需的环境变量
export function validateEnvVariables() {
  const requiredVars = ['DATABASE_URL'];
  const missingVars = [];

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  }

  if (missingVars.length > 0) {
    const errorMsg = `[Config] Missing required environment variables: ${missingVars.join(', ')}`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  console.log('[Config] All required environment variables are present');
}

// 导出环境变量访问器
export const env = {
  get: (key: string, defaultValue?: string): string => {
    return process.env[key] || defaultValue || '';
  },
  getNumber: (key: string, defaultValue: number): number => {
    const value = process.env[key];
    return value ? parseInt(value) : defaultValue;
  },
  getBoolean: (key: string, defaultValue: boolean): boolean => {
    const value = process.env[key];
    if (value === undefined) return defaultValue;
    return value.toLowerCase() === 'true';
  },
};

// 导出配置文件路径
export const configPaths = {
  projectRoot,
  envFile: envFilePath,
};
