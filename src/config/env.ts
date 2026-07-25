/*
 * @Author       : Z2-WIN\xmm wujixmm@gmail.com
 * @Date         : 2026-02-09 14:31:08
 * @LastEditors  : Z2-WIN\xmm wujixmm@gmail.com
 * @LastEditTime : 2026-02-09 15:02:17
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
const devEnvPath = path.resolve(projectRoot, '.env.development');
const defaultEnvPath = path.resolve(projectRoot, '.env');

// 优先级: .env.prod > .env.development > .env
if (fs.existsSync(prodEnvPath)) {
  envFile = '.env.prod';
  console.log('[Config] Production environment detected, using .env.prod');
} else if (fs.existsSync(devEnvPath)) {
  envFile = '.env.development';
  console.log('[Config] Development environment detected, using .env.development');
} else if (fs.existsSync(defaultEnvPath)) {
  console.log('[Config] Using .env');
} else {
  console.error('[Config] No environment file found!');
  throw new Error('No environment file found (.env.development, .env, or .env.prod)');
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
  const requiredVars = ['WEATHER_DATABASE_URL'];
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

// 计算私钥文件的绝对路径
export function getPrivateKeyPath(): string {
  const privateKeyPath = process.env.QWEATHER_JWT_PRIVATE_KEY_PATH;

  if (!privateKeyPath) {
    throw new Error(
      'QWEATHER_JWT_PRIVATE_KEY_PATH environment variable is not set'
    );
  }

  // 计算绝对路径
  const privateKeyFullPath = path.resolve(projectRoot, privateKeyPath);

  console.log('[Config] Private key path:', privateKeyFullPath);

  // 验证文件存在性
  if (!fs.existsSync(privateKeyFullPath)) {
    throw new Error(`Private key file not found: ${privateKeyFullPath}`);
  }

  // 验证文件可读性
  try {
    fs.accessSync(privateKeyFullPath, fs.constants.R_OK);
    console.log('[Config] Private key file is readable');
  } catch (error) {
    throw new Error(`Private key file is not readable: ${privateKeyFullPath}`);
  }

  return privateKeyFullPath;
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
  getPrivateKeyPath,
};

// 导出配置文件路径
export const configPaths = {
  projectRoot,
  envFile: envFilePath,
};
