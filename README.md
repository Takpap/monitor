# SMZDM Monitor (Nuxt + Bun + shadcn)

基于 `Nuxt 3 + Bun + shadcn-nuxt` 的什么值得买监控系统重构版。

## 功能

- 关键词订阅（支持 `any` / `all` 匹配）
- 排除关键词
- 热度阈值过滤（`minComments`）
- 首轮启动只建索引不推送（可配置）
- 去重持久化（SQLite）
- 自动轮询 + 手动触发
- 多 owner 作用域（`ownerId` 维度隔离）
- 通知插件化：`console` + `webhook` 通道
- 异步通知队列（内存队列，支持重试）
- metrics 接口（JSON + Prometheus 文本）
- 规则模拟预览接口（命中/排除词解释）
- 通知通道测试接口（不写入命中记录）
- 订阅规则版本化（创建/更新/删除/回滚都记录快照）
- 事件中心高级筛选 + 游标分页
- 前端管理台：总览 / 规则管理 / 事件中心

## 技术栈

- Nuxt 3
- Bun (`bun:sqlite`)
- Tailwind CSS
- shadcn-nuxt（组件工程化）
- Zod（服务端参数校验）

## 快速开始

```bash
bun install
bun run dev
bun test
```

访问：`http://localhost:3000`

## 生产构建

```bash
bun run build
bun run start
```

## 代码结构（重构后）

- `pages/index.vue`：页面壳层（头部、owner 作用域、分区切换）
- `components/monitor/*`：`总览 / 规则管理 / 事件中心` 三个业务面板组件
- `composables/useMonitorConsole.ts`：前端核心状态编排（聚合状态、交互流程）
- `composables/monitor-console/http.ts`：前端 API 访问层（统一请求入口）
- `composables/monitor-console/format.ts`：前端格式化/解析工具（错误、时间、header、版本动作文案）
- `composables/monitor-console/utils.ts`：前端通用纯函数（关键词、筛选参数）
- `server/utils/validators.ts`：服务端 Zod 参数校验（含 hits 查询 schema）
- `server/utils/http.ts`：服务端通用路由参数解析
- `server/utils/db.ts`：数据库门面（对外 API 稳定入口）
- `server/internal/db/*`：数据库实现分层（client/schema/normalize/repositories）
- `types/monitor-console.ts`：前后端交互与页面状态类型定义
- `tests/*`：前端工具函数与 hits 查询校验单测

请使用 `bun` 启动服务。若使用 `node` 直接启动，可能出现：
`Only URLs with a scheme in: file, data, and node are supported ... Received protocol 'bun:'`。

## 环境变量

- `MONITOR_DB_PATH`：SQLite 文件路径（默认 `./data/monitor.db`）
- `DISABLE_MONITOR_SCHEDULER=1`：禁用自动轮询（仅手动触发）

## API 概览

- `GET /api/settings`
- `PUT /api/settings`
- `GET /api/subscriptions?ownerId=...`
- `POST /api/subscriptions`
- `PUT /api/subscriptions/:id`
- `DELETE /api/subscriptions/:id`
- `GET /api/hits?ownerId=...&limit=50&cursorId=...&subscriptionId=...&keyword=...&commentMin=...&commentMax=...`
- `GET /api/metrics?ownerId=...`
- `GET /api/metrics?format=prometheus&ownerId=...`
- `GET /api/monitor/status`
- `POST /api/monitor/run`
- `POST /api/subscriptions/preview`
- `GET /api/subscriptions/versions?subscriptionId=...&ownerId=...&limit=...`
- `POST /api/subscriptions/rollback`
- `POST /api/notifier/test`

## 已实现的扩展点

1. 多 owner 化：`subscriptions`、`hits`、`deliveries` 均支持 `ownerId`。
2. 通知通道插件化：新增 `server/utils/notifier.ts`，内置 `console` 与 `webhook`。
3. 任务队列化：新增 `server/utils/notification-queue.ts`，异步发送通知并自动重试。
4. 可观测性：新增 `GET /api/metrics`（JSON）和 `GET /api/metrics?format=prometheus`。
