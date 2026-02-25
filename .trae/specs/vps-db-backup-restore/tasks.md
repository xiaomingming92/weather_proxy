# Tasks

## Task 1: 创建数据库备份脚本
创建 VPS 上可执行的 MySQL 备份脚本
- [ ] SubTask 1.1: 创建 `scripts/db-backup.sh` 脚本
  - [ ] 从 `.env.prod` 读取 DATABASE_URL
  - [ ] 使用 mysqldump 导出完整数据库
  - [ ] 备份文件保存到 `./backups/weather_proxy_YYYYMMDD_HHMMSS.sql`
  - [ ] 保留最近 10 个备份，自动清理旧备份
- [ ] SubTask 1.2: 添加执行权限和错误处理
- [ ] SubTask 1.3: 本地测试脚本

## Task 2: 创建数据库恢复脚本
创建从备份文件恢复数据库的脚本
- [ ] SubTask 2.1: 创建 `scripts/db-restore.sh` 脚本
  - [ ] 接受备份文件路径作为参数
  - [ ] 恢复前确认提示
  - [ ] 使用 mysql 命令导入数据
  - [ ] 验证恢复结果
- [ ] SubTask 2.2: 添加错误处理和日志
- [ ] SubTask 2.3: 本地测试恢复流程

## Task 3: 创建测试数据生成脚本
创建可重复生成测试数据的 TypeScript 脚本
- [ ] SubTask 3.1: 创建 `scripts/generate-test-data.ts`
  - [ ] 使用 Prisma Client 连接数据库
  - [ ] 生成 ZTE 测试数据（ZteCity、ZteWeatherCache、ZteCachePolicy）
  - [ ] 生成 HTC 测试数据（HtcCity、HtcWeatherCache、HtcCachePolicy）
  - [ ] 生成通用数据（City、WeatherData、CachePolicy）
- [ ] SubTask 3.2: 添加命令行参数支持（--device=zte/htc/all）
- [ ] SubTask 3.3: 添加 tsx 运行配置到 package.json

## Task 4: 创建部署流程文档
编写详细的 VPS 部署和恢复文档
- [ ] SubTask 4.1: 创建 `docs/vps-deployment.md`
  - [ ] 部署前检查清单
  - [ ] 备份步骤说明
  - [ ] 迁移步骤说明
  - [ ] 恢复步骤说明
  - [ ] 故障排查指南
- [ ] SubTask 4.2: 包含实际的数据库连接信息（从 .env.dev）
- [ ] SubTask 4.3: 包含测试数据示例

## Task 5: 修改 CI/CD 工作流
在 GitHub Actions 中集成备份步骤
- [ ] SubTask 5.1: 修改 `.github/workflows/deploy.yml`
  - [ ] 在 `prisma migrate deploy` 前添加备份步骤
  - [ ] 备份失败时终止部署
  - [ ] 迁移失败时自动恢复（可选）
- [ ] SubTask 5.2: 添加备份文件上传（可选，上传到 artifact）

## Task 6: 测试完整流程
验证整个备份恢复流程
- [ ] SubTask 6.1: 在本地测试数据生成脚本
- [ ] SubTask 6.2: 手动运行备份脚本到 VPS
- [ ] SubTask 6.3: 手动运行恢复脚本到 VPS
- [ ] SubTask 6.4: 验证测试数据完整性

# Task Dependencies

- Task 2 依赖 Task 1（恢复依赖备份）
- Task 4 依赖 Task 1、2、3（文档需要脚本完成）
- Task 5 依赖 Task 1（CI/CD 需要备份脚本）
- Task 6 依赖所有其他任务

# Parallelizable Work

- Task 1 和 Task 3 可以并行
- Task 2 可以在 Task 1 完成后开始
