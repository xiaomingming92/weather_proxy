# VPS 数据库备份与恢复 Spec

## Why

在 VPS 部署过程中，Prisma 迁移可能会破坏现有测试数据。需要建立标准化的备份和恢复流程，确保：
1. 部署前能完整备份现有数据
2. 迁移失败时能快速恢复
3. 有清晰的文档供后续复盘

## What Changes

### 新增文档和脚本
- **ADDED**: 数据库备份脚本 `scripts/db-backup.sh`
- **ADDED**: 数据库恢复脚本 `scripts/db-restore.sh`
- **ADDED**: 部署流程文档 `docs/vps-deployment.md`
- **ADDED**: 测试数据生成脚本 `scripts/generate-test-data.ts`

### 修改部署流程
- **MODIFIED**: `.github/workflows/deploy.yml` - 集成备份步骤

## Impact

### Affected specs
- CI/CD 部署流程

### Affected code
- `.github/workflows/deploy.yml`
- 新增 `scripts/` 目录下的备份恢复脚本

## ADDED Requirements

### Requirement: 部署前自动备份
The system SHALL automatically backup database before deployment.

#### Scenario: GitHub Actions 部署触发
- **GIVEN** 代码推送到 main 分支触发部署
- **WHEN** 执行部署流程
- **THEN** 在 `prisma migrate deploy` 之前自动备份数据库
- **AND** 备份文件保存到 VPS 项目目录下的 `./backups/` 目录
- **AND** 备份文件名包含时间戳

#### Scenario: 手动备份
- **GIVEN** 运维人员登录 VPS
- **WHEN** 执行 `./scripts/db-backup.sh`
- **THEN** 生成完整的 MySQL 备份文件

### Requirement: 测试数据生成
The system SHALL provide test data generation for development.

#### Scenario: 生成 ZTE 测试数据
- **GIVEN** 运行测试数据生成脚本
- **WHEN** 指定设备类型为 ZTE
- **THEN** 插入 ZteCity、ZteWeatherCache、ZteCachePolicy 测试数据

#### Scenario: 生成 HTC 测试数据
- **GIVEN** 运行测试数据生成脚本
- **WHEN** 指定设备类型为 HTC
- **THEN** 插入 HtcCity、HtcWeatherCache、HtcCachePolicy 测试数据

### Requirement: 数据库恢复
The system SHALL support database restore from backup.

#### Scenario: 迁移失败恢复
- **GIVEN** `prisma migrate deploy` 失败
- **WHEN** 执行 `./scripts/db-restore.sh <备份文件>`
- **THEN** 数据库恢复到备份时的状态

#### Scenario: 恢复到特定时间点
- **GIVEN** 有多个备份文件
- **WHEN** 选择特定时间点的备份
- **THEN** 恢复到该时间点的数据状态

## MODIFIED Requirements

### Requirement: CI/CD 部署流程
**原需求**: 直接执行 migrate deploy
**新需求**: 先备份再迁移

#### Scenario: 安全部署
- **GIVEN** 部署工作流启动
- **WHEN** 执行到数据库步骤
- **THEN** 按顺序执行：备份 → migrate deploy → 验证
- **AND** 如果 migrate deploy 失败，自动恢复备份

## REMOVED Requirements

无
