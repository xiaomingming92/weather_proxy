/*
 * @Author       : Z2-WIN\xmm wujixmm@gmail.com
 * @Date         : 2026-02-06 13:20:58
 * @LastEditors  : Z2-WIN\xmm wujixmm@gmail.com
 * @LastEditTime : 2026-02-06 13:21:23
 * @FilePath     : \decompile\weather_proxy\ecosystem.config.cjs
 * @Description  : 
 */
module.exports = {
  apps: [
    {
      name: 'weather-proxy',
      script: 'dist/server.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: '1888',
        HOST: '0.0.0.0'
      },
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
      log_max_size: '10M'
    },
  ],
};
