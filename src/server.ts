import express from 'express';
import { config } from './config/index.js';
import weatherRouter from './routes/weather.js';
import configRouter from './routes/config.js';
import cronService from './services/cron-service.js';

console.log('weatherRouter imported successfully');

const app = express();

// 中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 请求日志中间件
app.use((req, res, next) => {
  console.log('Request received:', req.method, req.path);
  next();
});

// 错误处理中间件
app.use((err: any, req: any, res: any, next: any) => {
  console.error('========================================');
  console.error('Error occurred:', new Date().toISOString());
  console.error('Error:', err);
  console.error('Request:', req.method, req.path);
  console.error('========================================');
  res.status(500).send('Internal Server Error');
});

// 路由
app.use('/api/weather', weatherRouter);
app.use('/api/config', configRouter);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 启动定时任务服务
cronService.start();

// 启动服务
app.listen(config.port, config.host, () => {
  console.log(`Weather proxy server running on ${config.host}:${config.port}`);
  console.log(`Environment: ${config.env}`);
  console.log('Cron service started');
});
