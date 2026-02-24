# 事件驱动天气服务架构 Spec

## Why

当前的 `weather.ts` 采用传统的请求-响应模式，所有逻辑集中在一个文件中，导致：
1. 代码耦合度高，难以维护和扩展
2. 不同设备（ZTE/HTC）的逻辑混杂
3. 缓存、转换、验证逻辑纠缠在一起
4. 难以支持异步处理、批量请求等高级功能

需要引入事件驱动架构，通过命令模式、事件总线、工厂模式实现解耦和可扩展性。

## What Changes

### 架构层面
- **BREAKING**: 重构 `weather.ts` 为事件驱动架构
- **BREAKING**: 引入命令模式封装所有天气请求
- **BREAKING**: 引入事件总线解耦组件通信
- **BREAKING**: 引入工厂模式批量创建处理器

### 核心组件
1. **Command (命令)** - 封装天气请求（ZTE/HTC）
2. **EventBus (事件总线)** - 组件间异步通信
3. **Handler (处理器)** - 执行具体业务逻辑
4. **Factory (工厂)** - 批量创建命令和处理器
5. **Pipeline (管道)** - 处理链（验证→缓存→API→转换）

### 代码结构
```
src/
├── core/                           # 核心框架
│   ├── event-bus.ts               # 事件总线
│   ├── command.ts                 # 命令基类
│   ├── handler.ts                 # 处理器基类
│   └── pipeline.ts                # 管道编排
├── commands/                       # 具体命令
│   ├── weather-command.ts         # 天气查询命令
│   ├── zte-weather-command.ts     # ZTE专用命令
│   └── htc-weather-command.ts     # HTC专用命令
├── handlers/                       # 具体处理器
│   ├── validation-handler.ts      # 验证处理器
│   ├── cache-handler.ts           # 缓存处理器
│   ├── api-handler.ts             # API调用处理器
│   ├── transform-handler.ts       # 数据转换处理器
│   └── response-handler.ts        # 响应处理器
├── factories/                      # 工厂
│   ├── command-factory.ts         # 命令工厂
│   └── handler-factory.ts         # 处理器工厂
└── events/                         # 事件定义
    ├── weather-events.ts          # 天气相关事件
    └── cache-events.ts            # 缓存相关事件
```

## Impact

### Affected specs
- 第三阶段代码重构计划
- 缓存策略设计
- 路由设计

### Affected code
- `src/routes/weather.ts` - 完全重构
- `src/routes/htc-weather.ts` - 适配新架构
- `src/services/cache/` - 事件化改造
- `src/services/weather-api.ts` - 处理器化

## ADDED Requirements

### Requirement: 事件总线系统
The system SHALL provide a centralized event bus for decoupled component communication.

#### Scenario: 组件订阅事件
- **GIVEN** 缓存处理器已注册
- **WHEN** 天气查询命令执行
- **THEN** 缓存处理器自动响应并检查缓存

#### Scenario: 异步事件处理
- **GIVEN** API调用处理器已注册
- **WHEN** 缓存未命中事件发布
- **THEN** API处理器异步执行并发布结果事件

### Requirement: 命令模式封装
The system SHALL encapsulate all weather requests as command objects.

#### Scenario: 创建ZTE天气命令
- **GIVEN** 收到ZTE设备请求
- **WHEN** 工厂创建命令
- **THEN** 返回ZteWeatherCommand实例

#### Scenario: 命令执行管道
- **GIVEN** 命令已创建
- **WHEN** 执行命令
- **THEN** 按顺序通过验证→缓存→API→转换→响应管道

### Requirement: 处理器工厂
The system SHALL provide factories to batch-create handlers based on device type.

#### Scenario: ZTE处理器链
- **GIVEN** 设备类型为ZTE
- **WHEN** 工厂创建处理器链
- **THEN** 返回[Validation, ZteCache, Api, ZteTransform, Response]处理器

#### Scenario: HTC处理器链
- **GIVEN** 设备类型为HTC
- **WHEN** 工厂创建处理器链
- **THEN** 返回[Validation, HtcCache, Api, HtcTransform, Response]处理器

### Requirement: 管道编排
The system SHALL support configurable processing pipelines.

#### Scenario: 标准管道执行
- **GIVEN** 管道配置为[验证, 缓存, API, 转换, 响应]
- **WHEN** 执行天气查询
- **THEN** 按配置顺序执行各阶段

#### Scenario: 跳过缓存管道
- **GIVEN** 请求参数包含`skipCache=true`
- **WHEN** 执行天气查询
- **THEN** 跳过缓存阶段直接调用API

## MODIFIED Requirements

### Requirement: 缓存服务
**原需求**: 直接使用缓存服务
**新需求**: 缓存服务通过事件总线响应缓存事件

#### Scenario: 缓存命中
- **GIVEN** 缓存中有数据
- **WHEN** 发布`CacheCheckEvent`
- **THEN** 缓存服务响应并发布`CacheHitEvent`

#### Scenario: 缓存未命中
- **GIVEN** 缓存中无数据
- **WHEN** 发布`CacheCheckEvent`
- **THEN** 缓存服务响应并发布`CacheMissEvent`

## REMOVED Requirements

### Requirement: 直接调用缓存
**Reason**: 通过事件总线解耦，不再直接调用
**Migration**: 改为发布/订阅缓存事件

### Requirement: 路由直接处理逻辑
**Reason**: 路由只负责创建命令和触发执行
**Migration**: 逻辑移至命令和处理器
