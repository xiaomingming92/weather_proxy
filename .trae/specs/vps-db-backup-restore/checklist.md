# Checklist

## 备份脚本检查点
- [ ] `scripts/db-backup.sh` 文件存在且可执行
- [ ] 脚本能从 `.env.prod` 正确读取 DATABASE_URL
- [ ] 使用 mysqldump 成功导出完整数据库
- [ ] 备份文件保存到 `~/backups/` 目录，文件名包含时间戳
- [ ] 脚本保留最近 10 个备份，自动清理旧备份
- [ ] 脚本有错误处理和日志输出

## 恢复脚本检查点
- [ ] `scripts/db-restore.sh` 文件存在且可执行
- [ ] 脚本接受备份文件路径作为参数
- [ ] 恢复前有确认提示
- [ ] 使用 mysql 命令成功导入数据
- [ ] 恢复后有验证步骤
- [ ] 脚本有错误处理和日志输出

## 测试数据生成脚本检查点
- [ ] `scripts/generate-test-data.ts` 文件存在
- [ ] 脚本使用 Prisma Client 连接数据库
- [ ] 能生成 ZTE 测试数据（ZteCity、ZteWeatherCache、ZteCachePolicy）
- [ ] 能生成 HTC 测试数据（HtcCity、HtcWeatherCache、HtcCachePolicy）
- [ ] 支持命令行参数（--device=zte/htc/all）
- [ ] package.json 中有运行配置

## 部署文档检查点
- [ ] `docs/vps-deployment.md` 文件存在
- [ ] 文档包含部署前检查清单
- [ ] 文档包含备份步骤说明
- [ ] 文档包含迁移步骤说明
- [ ] 文档包含恢复步骤说明
- [ ] 文档包含故障排查指南
- [ ] 文档包含实际数据库连接信息
- [ ] 文档包含测试数据示例

## CI/CD 工作流检查点
- [ ] `.github/workflows/deploy.yml` 已修改
- [ ] 在 `prisma migrate deploy` 前有备份步骤
- [ ] 备份失败时终止部署
- [ ] 部署流程文档化

## 端到端测试检查点
- [ ] 在本地成功运行测试数据生成脚本
- [ ] 在 VPS 成功运行备份脚本
- [ ] 在 VPS 成功运行恢复脚本
- [ ] 验证测试数据完整性
- [ ] 验证备份文件可恢复
