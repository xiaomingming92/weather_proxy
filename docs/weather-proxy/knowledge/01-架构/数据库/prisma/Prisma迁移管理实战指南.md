# Prisma 迁移管理实战指南（新手向）

> 写给第一次接触 Prisma 迁移的人。看完你会明白：
> 迁移是什么、日常怎么用、本项目有哪些特殊配置、以及今天（2026-07-27）遇到的两个报错（P1012 / P3005）到底是怎么回事、怎么解决。

---

## 1. 迁移是什么？先打个比方

数据库的**表结构**（有哪些表、每张表有哪些列）不是凭空出现的，它会随代码一起演化：今天加一个字段，明天改一个类型，后天删一张表。

**迁移（migration）就是数据库表结构的"Git 版本管理"**：

- 每次表结构变化，生成一个"版本文件"（迁移文件，里面是 SQL）
- 数据库里有一张 `_prisma_migrations` 表，记录"这个库已经应用到哪个版本了"
- 换一台机器/部署到服务器时，按顺序把所有没应用过的版本跑一遍，库就变成最新的

```
类比：
代码仓库        →  migrations/ 目录（一堆 SQL 文件）
git log        →  _prisma_migrations 表（已应用的记录）
git pull       →  prisma migrate deploy（把新版本应用到库）
git commit     →  prisma migrate dev --name xxx（生成新版本）
```

### 三个核心概念

| 概念 | 是什么 | 在哪 |
|---|---|---|
| **Schema** | 声明"数据库长什么样"的模型文件 | `prisma/schema.prisma` |
| **迁移文件** | 每个版本的 SQL 变更 | `prisma/migrations/2026xxxx_xxx/` |
| **迁移记录** | 库已经应用到哪个版本 | 库里的 `_prisma_migrations` 表 |

---

## 2. 本项目最重要的前提：双库架构

⚠️ **不看这一节，下面的命令全都会踩坑。**

本项目实际有**两个完全独立的数据库**：

| 库 | 用途 | 连接变量 | schema 文件 |
|---|---|---|---|
| **weather 库**（MariaDB） | 天气业务：城市、缓存、G13/ZTE 设备 | `WEATHER_DATABASE_URL` | `prisma/schema.prisma` |
| **ADD 库**（PostgreSQL） | add-coder 的审批/审计数据 | `DATABASE_URL` | 由 add-coder 自己管理 |

- **顶层 `npx prisma xxx` 命令默认操作的是 weather 库（MariaDB）**，通过 `prisma.config.ts` 的 `WEATHER_DATABASE_URL` 连接
- `prisma/add.prisma` 和 `prisma/add/` 是 add-coder `sync` 命令同步过来的**消费方副本**，真实 ADD 库由 add-coder 项目自己迁移，**我们不要碰**
- `prisma.config.ts` 的 `schema` 必须指向**单文件** `prisma/schema.prisma`，不能指向 `prisma/` 目录——否则 Prisma 7 目录模式会把 `add.prisma`、`add/schema.prisma` 一起加载，模型重复直接报 **P1012**（今天踩过）

### 当前 config（不要乱改）

```ts
// prisma.config.ts
const dbUrl = env("WEATHER_DATABASE_URL") || env("DATABASE_URL");

export default defineConfig({
  schema: "prisma/schema.prisma",              // 必须是单文件！
  datasource: {
    url: dbUrl,                                // weather 库
    shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL, // 可选，见 §5
  },
});
```

---

## 3. 日常操作流程（背下来就够了）

### 场景 A：开发中改了 schema.prisma，要应用变更

```bash
npx prisma migrate dev --name 描述性名称
```

一条命令完成三件事：
1. 对比 schema 和迁移历史 → 自动生成新的迁移文件
2. 把迁移应用到本地库
3. 重新生成 Prisma Client（代码里 `import { PrismaClient }` 的类型就会更新）

> 改 schema 之后**不要**手动去数据库里改表！**永远通过迁移改表**，否则库和迁移历史就对不上了。

### 场景 B：部署/上线，把新迁移应用到服务器

```bash
npx prisma migrate deploy
```

- 只应用 `migrations/` 里**还没应用过**的迁移
- 不会生成新迁移、不会改 schema 文件，生产环境永远用它
- 输出 `No pending migrations to apply.` 说明一切正常

### 场景 C：只想看看库和 schema 差多少

```bash
npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script
```

输出 `-- This is an empty migration.` = 完全一致。**动手改任何东西之前先跑这个。**

---

## 4. 新手必踩的坑（本项目的真实案例）

### 坑 1：P1012 —— "模型重复定义"

```
Error: The model "AddUser" cannot be defined because a model with that name already exists.
```

**原因**：`prisma.config.ts` 的 `schema` 写成了 `"prisma"`（目录），Prisma 7 会**递归加载 `prisma/` 下所有 .prisma 文件**：`add.prisma` + `add/schema.prisma` + `schema.prisma` 里的 ADD 模型互相重复。

**解决**：把 `schema` 改为单文件 `"prisma/schema.prisma"`。

### 坑 2：P3005 —— "数据库 schema 不是空的"

```
Error: P3005
The database schema is not empty.
```

**原因**：库里有表，但 `_prisma_migrations` 表里**没有任何记录**。典型场景：之前用 `prisma db push` 建的库（db push 只管建表，**不写迁移记录**）。Prisma 不敢拿迁移 SQL 去撞已存在的表，直接拒绝。

**这是今天遇到的核心问题，完整解决流程见 §5。**

### 坑 3：migrate dev 要求 reset —— 千万别手滑

```
⚠️ We need to reset the database... (会丢数据！)
```

migrate dev 检测到"库和迁移历史不一致"时，会建议 **reset 整个库**（清空所有数据）。**天气服务的城市缓存数据全在里面，绝对不能 reset。**

遇到这种情况，先停下来：
1. 跑 §3 场景 C 的 diff 看看差异
2. 如果只是"库有表但没迁移记录"（P3005），按 §5 基线化
3. 如果真有结构差异，先手动补迁移（必要时找 AI 帮忙分析）

### 坑 4：npm warn Unknown project config

```
npm warn Unknown project config "sharp_binary_host". ...
```

`.npmrc` 里的 sharp 镜像配置，npm 不认识的键会警告，**无害**，忽略即可。

---

## 5. P3005 基线化完整流程（今天实战，可复用）

**目标**：库是 db push 建的（有表、无迁移记录），要让 Prisma 认为"这些表就是迁移历史跑出来的"，之后 migrate deploy 就能正常工作。**全程不执行任何 SQL、不碰数据。**

### 第一步：双重验证（先证明库 = 迁移历史最终状态）

```bash
# 验证 1：实际库 vs schema —— 必须输出 empty migration
npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script

# 验证 2：迁移历史在空 shadow 库重放 vs schema —— 必须也输出 empty migration
SHADOW_DATABASE_URL='mysql://dev:frady@localhost:3306/weather-proxy-shadow' \
  npx prisma migrate diff --from-migrations prisma/migrations --to-schema prisma/schema.prisma --script
```

两个都为空，才能继续。含义：db push 建的库 = 按顺序跑完所有迁移会得到的库。**有一个不为空就先别继续，先分析差异。**

> 验证 2 需要 shadow 库。本项目已在 MariaDB 里建好 `weather-proxy-shadow`（空库，可反复使用）。`prisma.config.ts` 里已配置 `shadowDatabaseUrl` 读取 `SHADOW_DATABASE_URL` 环境变量。

### 第二步：把每个迁移标记为"已应用"

```bash
for m in $(ls prisma/migrations/ | grep -v migration_lock | sort); do
  npx prisma migrate resolve --applied "$m"
done
```

`migrate resolve --applied` **只往 `_prisma_migrations` 写记录，不执行任何 SQL**。这就是"基线化"：告诉 Prisma"这个库已经在这条迁移线上，别从零跑了"。

### 第三步：验证闭环

```bash
npx prisma migrate deploy
# 期望输出：No pending migrations to apply.
```

再检查迁移记录是否完整：

```bash
# 用任意 MySQL 客户端
SELECT migration_name, finished_at FROM _prisma_migrations;
# 期望：10 条记录，全部有 finished_at
```

### 为什么要双重验证？

基线化其实是"撒谎"——告诉 Prisma 迁移都跑过了。如果谎言和现实不符（比如迁移历史缺了一版、或库被手动改过），之后 migrate dev 会检测到 drift，又回到坑 3。双重验证就是确保"这个谎是完美圆上的"，一旦成立，迁移体系从此干净可用。

---

## 6. 以后改表的标准姿势

```
改 schema.prisma
    ↓
npx prisma migrate dev --name 你的描述        （本地，自动生成+应用+生成 client）
    ↓
git commit（迁移文件要一起提交！）
    ↓
部署：npx prisma migrate deploy              （服务器/生产，只应用新迁移）
```

**黄金法则**：
1. **永远通过迁移改表**，绝不手动 SQL 改表
2. 迁移文件必须**提交进 git**（换环境就靠它）
3. 生产环境只用 `migrate deploy`，不用 `migrate dev`
4. 有数据的库遇到 `migrate dev` 要 reset → 先 diff 分析，绝不盲目 reset
5. 本项目顶层命令只操作 weather 库，ADD 库别碰

---

## 7. 命令速查表

| 命令 | 作用 | 什么时候用 |
|---|---|---|
| `prisma migrate dev --name xxx` | 生成 + 应用 + 生成 client | 开发中改了 schema |
| `prisma migrate deploy` | 只应用未执行的迁移 | 部署/生产 |
| `prisma migrate resolve --applied xxx` | 标记迁移已应用（不执行 SQL） | P3005 基线化 |
| `prisma migrate diff --from-config-datasource --to-schema ...` | 库 vs schema 差异 | 动手前诊断 |
| `prisma migrate diff --from-migrations ... --to-schema ...` | 迁移历史 vs schema 差异 | 基线化验证（需 shadow 库） |
| `prisma validate` | 只校验 schema 文件语法 | 改完 schema 快速检查 |
| `prisma db push` | 直接同步表结构（不生成迁移） | ⚠️ 仅限无数据的原型阶段 |

---

## 8. 常见问题

**Q：migrate dev 和 db push 有什么区别？**
db push 只把 schema 同步到库，**不生成迁移文件、不写迁移记录**——所以用 db push 建的库后续会被 P3005 卡住。迁移是正路，db push 只适合原型期。

**Q：为什么顶层命令要加 `npx`？**
项目用的是本地 Prisma 7，`npx` 确保用的是 `node_modules` 里的版本而不是全局版本，行为一致。

**Q：迁移文件能删改吗？**
已经提交过的迁移文件**不要改**。改历史迁移 = 库和历史的对应关系断裂。要修正就新建一个迁移。

**Q：ADD 库（PostgreSQL）怎么迁移？**
不用管，那是 add-coder 的事。它自己的 `prisma/migrations/` 由 add-coder 的流程管理（`add-coder sync` 同步 schema 副本，库迁移由 add-coder 项目自己执行）。
