SOLO Coder

思考过程

是的，你可以创建 .env.prod 文件来专门用于生产环境的配置。以下是完整的部署和更新流程：

## 1. 生产环境配置文件
在VPS上创建 .env.prod 文件：

```
# 在VPS上创建.env.prod文件
touch .env.prod

# 编辑.env.prod文件，添加数据库连接信息
# 格式：mysql://用户名:密码@主机:端口/数据库名
DATABASE_URL="mysql://username:password@localhost:3306/weather_proxy"
NODE_ENV="production"
PORT=1888
HOST=0.0.0.0
```
## 2. 修改启动脚本
修改 package.json 文件，添加使用 .env.prod 的启动脚本：

```
"scripts": {
  "dev": "set NODE_ENV=development && tsx watch src/server.ts",
  "build": "tsc",
  "start": "set NODE_ENV=production && node dist/server.js",
  "start:prod": "set NODE_ENV=production && set PORT=1888 && set HOST=0.0.0.0 && 
  node dist/server.js",
  "start:env": "export $(cat .env.prod | xargs) && node dist/server.js"
}
```
## 3. 初始化Prisma（首次部署）
首次部署时的Prisma初始化流程：

```
# 进入项目目录
cd weather_proxy

# 安装依赖
npm install

# 设置环境变量（使用.env.prod）
export $(cat .env.prod | xargs)

# 生成Prisma客户端
npx prisma generate

# 运行数据库迁移
npx prisma migrate dev --name init

# 构建项目
npm run build

# 启动服务
npm run start:env
```
## 4. 后续表结构变化的处理
当代码库中的表结构发生变化时（例如修改了 prisma/schema.prisma 文件），更新流程如下：

```
# 拉取最新代码
git pull

# 设置环境变量
export $(cat .env.prod | xargs)

# 运行数据库迁移（自动更新表结构）
npx prisma migrate dev --name update

# 重新生成Prisma客户端
npx prisma generate

# 重新构建项目
npm run build

# 重启服务
pm2 restart weather-proxy
```
## 5. 关键点说明
### 环境变量处理
- 使用 .env.prod 文件专门存储生产环境的配置，与开发环境分离
- 通过 export $(cat .env.prod | xargs) 命令加载环境变量
### Prisma迁移
- npx prisma migrate dev --name init - 首次初始化时使用
- npx prisma migrate dev --name update - 后续更新时使用，会自动检测schema变化并生成新的迁移文件
- 迁移过程会自动更新数据库表结构，无需手动操作
### 部署流程
1. 首次部署：安装依赖 → 初始化数据库 → 构建 → 启动
2. 后续更新：拉取代码 → 运行迁移 → 重新构建 → 重启服务
### 注意事项
- 确保 .env.prod 文件中的数据库连接信息正确
- 确保VPS上的MySQL服务正在运行
- 确保数据库用户有足够的权限创建和修改表结构
- 使用PM2等进程管理工具确保服务稳定运行
这样，你就可以在VPS上成功部署和维护使用Prisma的weather_proxy服务了。

09:51
用户78677211265

输出prisma的使用文档吧

SOLO Coder

思考过程

# Prisma使用文档
## 1. Prisma简介
Prisma是一个现代的ORM（对象关系映射）工具，用于Node.js和TypeScript应用程序。它提供了一种类型安全的方式来与数据库交互，支持多种数据库系统，包括MySQL、PostgreSQL、SQLite等。

### 核心组件
- Prisma Client ：自动生成的类型安全数据库客户端
- Prisma Schema ：定义数据库模型和连接配置的声明式文件
- Prisma Migrate ：数据库迁移工具，用于管理数据库模式的变化
## 2. 项目结构
在我们的项目中，Prisma相关文件的结构如下：

```
weather_proxy/
├── prisma/
│   ├── schema.prisma        # Prisma模式定义文件
│   └── migrations/          # 数据库迁移文件目录
├── src/
│   ├── generated/
│   │   └── prisma/          # 生成的Prisma客户端
│   ├── services/
│   │   └── prisma-cache.ts  # Prisma缓存服务实现
│   └── config.ts            # 配置文件
├── .env                     # 环境变量文件
└── prisma.config.ts         # Prisma配置文件
```
## 3. 配置Prisma
### 3.1 数据库连接配置
在 .env 文件中配置数据库连接信息：

```
# MySQL数据库连接字符串
# 格式: mysql://用户名:密码@主机:端口/数据库名
DATABASE_URL="mysql://username:password@localhost:3306/weather_proxy"
```
### 3.2 Prisma模式定义
在 prisma/schema.prisma 文件中定义数据库模型：

```
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "mysql"
}

model City {
  id        Int      @id @default(autoincrement())
  name      String   @unique
  cityId    String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // 关联到天气数据
  weatherData WeatherData[]
}

model WeatherData {
  id           Int      @id @default(autoincrement())
  cityId       String
  dataType     String
  xmlData      String
  createdAt    DateTime @default(now())
  expiresAt    DateTime
  
  // 外键关联
  city         City?    @relation(fields: [cityId], references: [cityId])
  
  // 复合唯一索引
  @@unique([cityId, dataType])
}

model CacheConfig {
  id               Int      @id @default(autoincrement())
  key              String   @unique
  value            String
  description      String?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
}
```
### 3.3 Prisma配置文件
在 prisma.config.ts 文件中配置Prisma：

```
// This file was generated by Prisma, and assumes you have installed the following:
// npm install --save-dev prisma dotenv
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
```
## 4. 使用Prisma
### 4.1 初始化Prisma
首次使用Prisma时，需要初始化并生成客户端：

```
# 生成Prisma客户端
npx prisma generate

# 运行数据库迁移
npx prisma migrate dev --name init
```
### 4.2 基本数据库操作 查询数据
```
// 查询单个城市
const city = await prisma.city.findUnique({
  where: { name: "北京" }
});

// 查询多个城市
const cities = await prisma.city.findMany({
  where: {
    name: { contains: "北" }
  }
});
``` 创建数据
```
// 创建新城市
const newCity = await prisma.city.create({
  data: {
    name: "上海",
    cityId: "101020100"
  }
});
``` 更新数据
```
// 更新城市信息
const updatedCity = await prisma.city.update({
  where: { name: "上海" },
  data: {
    cityId: "101020100"
  }
});
``` 删除数据
```
// 删除城市
await prisma.city.delete({
  where: { name: "上海" }
});
```
### 4.3 高级操作 事务
```
// 使用事务执行多个操作
const result = await prisma.$transaction(async (prisma) => {
  // 创建城市
  const city = await prisma.city.create({
    data: {
      name: "广州",
      cityId: "101280101"
    }
  });

  // 创建天气数据
  const weatherData = await prisma.weatherData.create({
    data: {
      cityId: city.cityId,
      dataType: "ztewidgetsk",
      xmlData: "<weather>...</weather>",
      expiresAt: new Date(Date.now() + 3 * 60 * 1000)
    }
  });

  return { city, weatherData };
});
``` 批量操作
```
// 批量创建城市
const cities = await prisma.city.createMany({
  data: [
    { name: "北京", cityId: "101010100" },
    { name: "上海", cityId: "101020100" },
    { name: "广州", cityId: "101280101" }
  ]
});
```
## 5. 数据库迁移
### 5.1 生成新的迁移
当修改了 prisma/schema.prisma 文件后，需要生成新的迁移：

```
# 生成新的迁移
npx prisma migrate dev --name update
```
### 5.2 查看迁移历史
```
# 查看迁移历史
npx prisma migrate status
```
### 5.3 重置数据库
```
# 重置数据库（删除所有数据并重新应用迁移）
npx prisma migrate reset
```
## 6. 生产环境部署
### 6.1 环境配置
在生产环境中，建议使用专门的 .env.prod 文件：

```
# .env.prod
DATABASE_URL="mysql://username:password@localhost:3306/weather_proxy"
NODE_ENV="production"
PORT=1888
HOST=0.0.0.0
```
### 6.2 部署流程
1. 安装依赖 ： npm install
2. 设置环境变量 ： export $(cat .env.prod | xargs)
3. 生成Prisma客户端 ： npx prisma generate
4. 运行数据库迁移 ： npx prisma migrate dev --name init
5. 构建项目 ： npm run build
6. 启动服务 ： npm run start:env
### 6.3 监控和维护 查看数据库状态
```
# 查看数据库状态
npx prisma db pull
``` 查看Prisma客户端版本
```
# 查看Prisma版本
npx prisma --version
```
## 7. 常见问题和解决方案
### 7.1 数据库连接失败
问题 ：Prisma无法连接到数据库 解决方案 ：

- 检查 .env 文件中的数据库连接字符串是否正确
- 确保数据库服务正在运行
- 确保数据库用户有正确的权限
- 检查网络连接和防火墙设置
### 7.2 迁移失败
问题 ：数据库迁移失败 解决方案 ：

- 检查数据库连接是否正常
- 确保数据库用户有创建和修改表的权限
- 检查迁移文件是否与当前数据库状态一致
- 尝试使用 npx prisma migrate reset 重置数据库
### 7.3 类型错误
问题 ：TypeScript类型错误，找不到Prisma类型 解决方案 ：

- 重新生成Prisma客户端： npx prisma generate
- 确保导入路径正确： import { PrismaClient } from '../generated/prisma/client'
- 重新构建项目： npm run build
### 7.4 缓存问题
问题 ：缓存数据与数据库不一致 解决方案 ：

- 确保缓存服务正确更新数据库和缓存
- 检查缓存过期时间设置是否合理
- 定期清理过期缓存： await prismaCache.cleanupExpiredCache()
## 8. 最佳实践
1. 使用环境变量 ：将数据库连接信息等敏感配置存储在环境变量中
2. 定期备份 ：定期备份数据库，防止数据丢失
3. 使用事务 ：对于相关操作，使用事务确保数据一致性
4. 合理设置缓存 ：根据数据类型设置合理的缓存过期时间
5. 监控性能 ：监控数据库性能，优化查询和索引
6. 版本控制 ：将Prisma模式文件和迁移文件纳入版本控制
7. 测试 ：在部署前测试数据库迁移，确保不会破坏现有数据
