/*
 * @Author       : Z2-WIN\xmm wujixmm@gmail.com
 * @Date         : 2026-02-06 09:21:52
 * @LastEditors  : Z2-WIN\xmm wujixmm@gmail.com
 * @LastEditTime : 2026-02-09 13:08:59
 * @FilePath     : \decompile\weather_proxy\prisma.config.ts
 * @Description  :
 */
import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env['DATABASE_URL'],
  },
});
