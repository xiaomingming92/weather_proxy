import dotenv from 'dotenv';
import path from 'path';

// 加载对应环境的变量文件
const envFile =
  process.env.NODE_ENV === 'production' ? '.env.prod' : '.env.dev';
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '1888'),
  host: process.env.HOST || 'localhost',
  qweather: {
    apiKey: process.env.QWEATHER_API_KEY || '',
    publicKey: process.env.QWEATHER_PUBLIC_KEY || '',
    apiHost: process.env.APIHost || 'api.qweather.com',
    authMethod: process.env.QWEATHER_AUTH_METHOD || 'jwt', // apiKey or jwt
    jwt: {
      kid: process.env.QWEATHER_JWT_KID || '',
      sub: process.env.QWEATHER_JWT_SUB || '',
      privateKeyPath: process.env.QWEATHER_JWT_PRIVATE_KEY_PATH || '',
    },
  },
  cache: {
    ttl: parseInt(process.env.CACHE_TTL || '3600'),
  },
};
