import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

// 加载 .env.development
const devEnvPath = path.resolve(projectRoot, '.env.development');
const defaultEnvPath = path.resolve(projectRoot, '.env');
if (fs.existsSync(devEnvPath)) {
  dotenv.config({ path: devEnvPath });
} else if (fs.existsSync(defaultEnvPath)) {
  dotenv.config({ path: defaultEnvPath });
}

export default {
  schema: path.resolve(__dirname, 'schema.prisma'),
  datasource: {
    url: process.env['DATABASE_URL'],
  },
};
