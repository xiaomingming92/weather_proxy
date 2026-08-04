import dotenv from 'dotenv';
import { existsSync } from 'fs';
// 加载顺序与 src/config/env.ts 保持一致：.env.prod（生产）> .env.development > .env
// 服务器部署只有 .env.prod（git 不跟踪 env 文件），prisma generate/migrate 必须能读到
for (const f of [
  '.env.prod',
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
