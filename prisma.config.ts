import dotenv from 'dotenv';
import { existsSync } from 'fs';
for (const f of [
  '.env.development.local',
  '.env.development',
  '.env.local',
  '.env',
]) {
  if (existsSync(f)) {
    dotenv.config({ path: f });
    break;
  }
}
import { defineConfig, env } from 'prisma/config';

// weather_proxy 双库：prisma/schema.prisma → MariaDB(WEATHER_DATABASE_URL)
//                 prisma/add/schema.prisma → PostgreSQL(DATABASE_URL)
// 注意：schema 必须指向单文件而非目录，否则 Prisma 7 目录模式会递归加载
//       prisma/add.prisma（sync 产物）与 prisma/add/ 子目录 → 模型重复 P1012
const dbUrl = env('WEATHER_DATABASE_URL') || env('DATABASE_URL');

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: dbUrl,
    // 迁移历史验证/开发迁移用的 shadow 库（可选，默认不启用）
    shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL,
  },
});
