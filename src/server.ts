import express from 'express';
import { config } from './config/index.js';
import weatherRouter from './routes/weather.js';
import zteWeatherRouter from './routes/zte-weather.js';
import htcAccuWeatherRouter from './routes/htc-accu-weather.js';
import htcHuaFengWeatherRouter from './routes/htc-huafeng-weather.js';
import htcG13WeatherRouter from './routes/htc-g13-weather.js';
import configRouter from './routes/config.js';
import cronService from './services/cron-service.js';

console.log('weatherRouter imported successfully');
console.log('zteWeatherRouter imported successfully');

const app = express();

// 中间件
// 保存原始 body buffer 用于 GBK 解码
app.use('/zte/getweatheru.asmx', (req, res, next) => {
  let data = '';
  req.on('data', chunk => {
    data += chunk;
  });
  req.on('end', () => {
    (req as any).rawBody = Buffer.from(data, 'binary');
    next();
  });
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 请求日志中间件
app.use((req, res, next) => {
  console.log('Request received:', req.method, req.path);
  next();
});

// 路由
app.use('/api/weather', weatherRouter); // WeatherWidget_Mod.apk
app.use('/zte/getweatheru.asmx', zteWeatherRouter); // WeatherTV_V880+.apk (新增)
app.use('/widget', htcAccuWeatherRouter); // HTC AccuWeather
app.use('/getweatheru.asmx', htcHuaFengWeatherRouter); // HTC 华风天气
app.use('/api/v1/htc-g13', htcG13WeatherRouter); // HTC G13
app.use('/api/config', configRouter); // 配置接口

// 错误处理中间件
app.use((err: any, req: any, res: any, next: any) => {
  console.error('========================================');
  console.error('Error occurred:', new Date().toISOString());
  console.error('Error:', err);
  console.error('Request:', req.method, req.path);
  console.error('========================================');
  res.status(500).send('Internal Server Error');
});

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
