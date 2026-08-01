import express from 'express';
import { config } from './config/index.js';
import weatherRouter from './routes/weather.js';
import configRouter from './routes/config.js';
import cronService from './services/cron-service.js';

// DeviceRegistry 自动注册路由（替代手动 app.use）
import { deviceRegistry } from './services/device-registry.js';
// 导入设备配置触发注册（副作用：deviceRegistry.register()），并等待注册完成避免异步竞态
import { deviceRegistration } from './config/devices.js';

const app = express();

// 中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 请求日志中间件
app.use((req, res, next) => {
  console.log('Request received:', req.method, req.path);
  next();
});

// 路由 — DeviceRegistry 自动挂载（替代手动 app.use）
app.use('/api/weather', weatherRouter); // WeatherWidget_Mod.apk

// 启动定时任务服务
cronService.start();

// 等待设备注册完成后挂载路由并启动服务（修复异步竞态：registerAll 动态 import 未完成时路由挂载会 404）
const bootstrap = async () => {
  await deviceRegistration;
  deviceRegistry.applyRoutes(app);
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

  // 启动服务
  app.listen(config.port, config.host, () => {
    console.log(
      `Weather proxy server running on ${config.host}:${config.port}`
    );
    console.log(`Environment: ${config.env}`);
    console.log('Cron service started');
  });
};

bootstrap().catch(err => {
  console.error('Bootstrap failed:', err);
  process.exit(1);
});
