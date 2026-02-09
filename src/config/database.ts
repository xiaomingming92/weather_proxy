// 数据库配置管理模块
// 统一管理数据库连接配置和初始化

import { env, validateEnvVariables } from './env.js';
import { PrismaClient } from '../generated/prisma/client.js';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

// 验证环境变量
validateEnvVariables();

// 获取数据库连接URL
const databaseUrl = env.get('DATABASE_URL');

if (!databaseUrl) {
  throw new Error('[Database] DATABASE_URL environment variable is not set');
}

console.log('[Database] Initializing database connection...');

// 创建PrismaMariaDb适配器
const adapter = new PrismaMariaDb(databaseUrl);

// 创建Prisma客户端
const prisma = new PrismaClient({
  adapter,
  log: [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'event',
      level: 'error',
    },
    {
      emit: 'event',
      level: 'info',
    },
    {
      emit: 'event',
      level: 'warn',
    },
  ],
});

// 监听数据库事件
prisma.$on('query', e => {
  console.log('[Database] Query:', e.query);
  console.log('[Database] Params:', e.params);
  console.log('[Database] Duration:', e.duration, 'ms');
});

prisma.$on('error', e => {
  console.error('[Database] Error:', e);
});

prisma.$on('info', e => {
  console.log('[Database] Info:', e);
});

prisma.$on('warn', e => {
  console.warn('[Database] Warning:', e);
});

// 测试数据库连接
export async function testDatabaseConnection() {
  try {
    console.log('[Database] Testing database connection...');
    await prisma.$connect();
    console.log('[Database] Database connection successful');
    return true;
  } catch (error) {
    console.error('[Database] Error connecting to database:', error);
    return false;
  }
}

// 关闭数据库连接
export async function closeDatabaseConnection() {
  try {
    console.log('[Database] Closing database connection...');
    await prisma.$disconnect();
    console.log('[Database] Database connection closed successfully');
  } catch (error) {
    console.error('[Database] Error closing database connection:', error);
  }
}

// 导出数据库配置
export const databaseConfig = {
  url: databaseUrl,
  client: prisma,
};

// 导出Prisma客户端
export default prisma;
