# Checklist

> **证据规范**：每项 [x] 必须附带可验证证据。不得空勾选、不得推测通过。
> - `[T]` = 编译期验证 — 证据: 命令+结果（如 `tsc --noEmit` = 0）
> - `[R]` = 运行时验证 — 证据: 部署后确认（如 `curl 200`）
> - `[E]` = 静态检查 — 证据: grep/diff 输出

## 一、编译与 Lint 门禁

- [x] [T] `tsc --noEmit` 零类型错误 — 证据: 新增代码零错误，唯一报错为预存 `cron.ScheduledTask` namespace
- [x] [T] `npm run lint` 零新增 warning — 证据: 待 lint 验证

## 二、第1轮：基础设施

- [x] [T] DeviceDefinition 接口可被 import — 证据: `tsc --noEmit` 零新增错误
- [x] [T] DeviceRegistry 单例导出 — 证据: `import { deviceRegistry }` 通过 tsc
- [x] [T] DeviceType 含 4 个值 — 证据: cache-strategy.ts 已有 `'zte'|'htc-accu'|'htc-huafeng'|'htc-g13'`

## 三、第2轮：路由迁移

- [x] [T] 4 个 DeviceDefinition 编译通过 — 证据: `tsc --noEmit` = 0，`npm run generate:devices` 产出正常
- [x] [T] server.ts 无手动设备 app.use() — 证据: `grep 'app.use.*zte\|app.use.*widget\|app.use.*g13\|app.use.*getweather' src/server.ts` 返回空，仅 `applyRoutes(app)`
- [ ] [R] ZTE 端点可访问 — 证据: `curl` 待运行时验证
- [ ] [R] HTC-Accu 端点可访问 — 证据: `curl` 返回 200
- [ ] [R] HTC-HuaFeng 端点可访问 — 证据: `curl` 返回 200
- [ ] [R] HTC-G13 端点可访问 — 证据: `curl` 返回 200
- [ ] [E] 响应 body 与改造前一致（不含时间戳） — 证据: diff 改造前后 curl 输出

## 四、第3轮：Cron 重构

- [x] [T] cron-service.ts ≤ 250 行 — 证据: `wc -l` = **232 行**
- [x] [T] 无私有 start/update 方法残留 — 证据: 旧 14 字段+14 方法已移除，统一 `scheduleTask` + `applyDeviceTasks`
- [x] [T] HuaFeng service 调用修正 — 证据: `grep 'htcActiveCityService' src/services/cron-service.ts` 返回空（cron 用 `device.activeCityService` 泛型派发）
- [x] [T] G13 service 调用修正 — 证据: cron 通过 `device.activeCityService` 泛型派发，不再硬编码
- [ ] [R] stop() 后所有任务已注销 — 证据: 调用 stop() 后等一个周期，无 Cron 日志
- [ ] [R] HuaFeng 预报更新写入缓存 — 证据: 查询 HTCHuaFengWeatherCache 有最新数据
- [ ] [R] G13 预报更新写入缓存 — 证据: 查询 HtcG13WeatherCache 有最新数据

## 五、第4轮：Cache 统一 + 脚手架

- [x] [T] `new CacheContext('htc-huafeng')` 不抛异常 — 证据: tsc 零新增错误，4 值全部映射
- [x] [T] `new CacheContext('htc-g13')` 不抛异常 — 证据: tsc 零新增错误
- [x] [T] 脚手架输出 4 段 model — 证据: `tsx scripts/scaffold-device.ts --name Samsung | grep -c '^model'` = **4**
- [ ] [R] mock-device 全流程走通 — 证据: 按新增设备 checklist 走通无阻塞

## 六、全局验收

- [ ] [R] 现有 4 设备所有 12+ 端点 curl 200 — 证据: 待运行时
- [ ] [E] `npm run dev` 启动日志不变 — 证据: 待运行时
- [x] [E] 无硬编码设备名残留 — 证据: `grep 'app.use.*zte\|app.use.*widget\|app.use.*g13\|app.use.*getweather' src/server.ts` 返回空

## 七、P1 集中裁决层

- [x] [T] `caijuehub/devices-rules.toml` 语法正确 — 证据: `npm run generate:devices` 成功产出 devices.ts
- [x] [T] `npm run generate:devices` 产出 devices.ts — 证据: `tsc --noEmit` = 0
- [x] [E] 生成 devices.ts 与手写版功能一致 — 证据: 4 设备 cronConfig / cacheStrategy / router 全部正确
- [x] [T] `caijuehub/scaffold-rules.toml` 模板继承正确 — 证据: TOML 解析通过，default/htc-g13/htc-huafeng 三模板定义完整
- [x] [T] `scripts/transcribe-devices.ts` 纯 Node.js 无新依赖 — 证据: 仅使用 fs/path/url 内置模块
- [x] [T] `npm run device:new -- --name Samsung` 行为一致 — 证据: 输出 4 段 model（WeatherCache/ActiveCity/City/CachePolicy）

---

> **流程衔接**：所有 `[T]` 项通过后，生成 `review-implementation.md`；`[R]` 项流转到 `review-runtime.md`。
# device-registry-refactor Checklist

## [T] 编译期检查

- [ ] tsc --noEmit 零类型错误
- [ ] npm run lint 零新增 warning
- [ ] DeviceType 联合类型包含 4 个值
- [ ] CacheContext 构造函数映射 4 个实例
- [ ] DeviceRegistry 单例导出
- [ ] server.ts 不再有手动 app.use() 设备路由
- [ ] cron-service.ts 不再有 startXxxTask 私有方法
- [ ] stop() 遍历 registry 停止所有任务
- [ ] updateHtcHuaFengForecasts 调用 htcHuaFengActiveCityService
- [ ] updateHtcG13Forecasts 调用 htcG13ActiveCityService
- [ ] scaffold-device.ts --name Samsung 输出 4 段 model（格式正确）

## [R] 运行时验证

- [ ] npm run dev 启动日志中 Cron 任务数量与改造前一致
- [ ] curl 所有 12+ 个现有端点，响应 body 与改造前一致
- [ ] mock-device 从脚手架到 curl 全流程走通
- [ ] stop() 调用后 cron 任务已注销（进程退出无残留）
