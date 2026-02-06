## 1. TypeScript导入路径修复

### 1.1 修复相对导入路径

* 修改所有相对导入路径，添加 `.js` 扩展名

* 例如：`import weatherApi from '../services/weather-api.js'`

* 影响文件：

  * `src/routes/weather.ts`

  * `src/routes/config.ts`

  * `src/services/cron-service.ts`

  * `src/services/prisma-cache.ts`

### 1.2 类型定义完善

* 移除 `any` 类型，添加适当的接口定义

* 为 `cron.ScheduledTask` 添加类型定义

* 为缓存服务添加完整的类型定义

## 2. 项目配置优化

### 2.1 tsconfig.json 配置

* 确认 `target` 设置为 `ES2022`

* 确保 `moduleResolution` 设置为 `node16` 或 `nodenext`

* 添加适当的编译选项

### 2.2 Husky 配置

* 安装 Husky：`npm install husky --save-dev`

* 初始化 Husky：`npx husky init`

* 添加 Git 钩子，如 pre-commit、pre-push

## 3. 部署配置更新

### 3.1 deploy.yml 修改

* 更新工作流名称为当前项目

* 修改部署脚本，添加 Prisma 相关命令：

  * `npx prisma generate`

  * `npx prisma migrate dev --name update`

  * prisma的这2个命令触发难道是每次拉代码都触发？

    <br />

* 调整项目路径和构建命令

* 确保使用正确的环境变量

### 3.2 ecosystem.config.cjs 优化

* 确认脚本路径正确：`dist/server.js`

* 添加适当的环境变量配置

* 设置合理的内存限制和重启策略

## 4. 依赖管理

### 4.1 安装必要的依赖

* 添加类型定义包：`@types/node-cron`

* 确保所有依赖版本兼容

### 4.2 构建验证

* 运行 `npm run build` 验证构建成功

* 确保没有 TypeScript 错误

## 5. 测试部署流程

### 5.1 本地测试

* 测试构建过程

* 验证 TypeScript 编译无错误

### 5.2 部署验证

* 确保 GitHub Actions 工作流配置正确

* 验证 PM2 配置有效

通过以上步骤，项目将具备完整的 TypeScript 类型支持、自动化部署能力，并且解决了导入路径和类型定义的问题。
