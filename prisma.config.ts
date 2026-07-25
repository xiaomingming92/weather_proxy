import dotenv from "dotenv";
import { existsSync } from "fs";
for (const f of [".env.development.local", ".env.development", ".env.local", ".env"]) {
  if (existsSync(f)) { dotenv.config({ path: f }); break; }
}
import { defineConfig, env } from "prisma/config";

// weather_proxy 双库：prisma/schema.prisma → MariaDB(WEATHER_DATABASE_URL)
//                 prisma/add/schema.prisma → PostgreSQL(DATABASE_URL)
// prisma db push 时通过命令行覆盖：DATABASE_URL="mysql://..." npx prisma db push --schema=prisma/schema.prisma
const dbUrl = env("WEATHER_DATABASE_URL") || env("DATABASE_URL");

export default defineConfig({
  schema: "prisma",
  datasource: {
    url: dbUrl,
  },
});
