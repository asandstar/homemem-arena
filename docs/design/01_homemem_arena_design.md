# 记忆宅邸：失忆管家 - 功能与系统设计

> 状态：当前工程设计文档  
> 最近更新：2026-07-14  
> 产品、游戏性和研究目标以 [产品、游戏与研究设计基线](docs/product-research-game-design.md) 为准。本文描述如何在工程上实现该基线。

## 1. 系统目标

**记忆宅邸：失忆管家**是一个 React + Three.js 的 3D 长程家务任务游戏。玩家层使用“MEM-07 记忆故障机器人”的叙事；研究层将 MEM-07 视为具有限制工作记忆的机器人代理。

系统必须保证：

- 四个关卡（含一个教学关卡）逻辑可完成、可失败、可重试；
- 游戏挑战来自记忆管理、路线规划和环境变化，而非操作缺陷；
- 相同玩家意图只通过一套命令和状态转换实现；
- 每个研究字段都有真实采集来源；
- 原始事件可重放、派生指标可重算；
- 对话系统能触发场景氛围描述和 NPC 个性对话。

## 2. 当前技术栈

| 层级 | 技术 |
|---|---|
| UI | React 19、React Router 7、Tailwind CSS 4、Lucide |
| 3D | Three.js、React Three Fiber、drei、GLB + 程序化 fallback |
| 状态 | Zustand 5 |
| 语言/构建 | TypeScript 6 strict、Vite 8 |
| 质量 | Vitest、Testing Library、Oxlint、自定义 QA 脚本 |

## 3. 分层架构

```text
页面与 HUD
  ↓ 产生 Player Intent
Game Command 层
  ↓ 原子执行
Domain/Game State ─────────→ 即时反馈、3D 渲染
  ↓ 发出 Domain Events
Session Recorder ──────────→ 原始 Session / 状态 delta
  ↓ 游戏结束并完成 Probe
Analysis Pipeline ─────────→ 指标、失败模式、策略建议
```

### 3.1 GameStore

负责当前世界状态：

- 生命周期、任务、实体、容器、持有物；
- 玩家位置、房间、相机模式；
- 历史目标里程碑和终局条件；
- 记忆槽、分数、Combo、混乱值；
- 脚本事件状态和即时视觉反馈。

GameStore 不应直接承担研究数据序列化，也不应在多个 UI 组件中复制业务流程。

### 3.2 SessionStore / Recorder

负责不可变的历史记录：

- 命令、观察、动作、移动、脚本事件；
- 对象和容器状态 delta；
- 记忆写入、覆盖、锁定、失效和再次验证；
- goal milestone、terminal state、Probe；
- 版本、seed、实验 condition 和最终分析。

Recorder 应订阅领域事件或由命令执行器统一调用，不应依赖页面组件“顺便记录”。

### 3.3 UiStore

只负责面板开合、小地图缩放和 HUD 偏好。UI 状态不能影响实验规则；如果某个 UI 条件会影响难度，必须记录为实验 condition。

## 4. 生命周期

```typescript
type GamePhase =
  | 'idle'
  | 'briefing'
  | 'playing'
  | 'probing'
  | 'analyzing'
  | 'result'
  | 'aborted'
```

| 阶段 | 允许的行为 |
|---|---|
| `briefing` | 阅读、查看帮助、返回；计时和扰动暂停 |
| `playing` | 移动、交互、记忆、计时、事件、目标判定 |
| `probing` | 场景冻结，只记录 Probe 答案与反应时间 |
| `analyzing` | 生成派生指标，不再修改原始轨迹 |
| `result` | 查看结果、导出、重试 |

标准路由流程：

```text
/tasks
  → /play/:taskId
  → /probe/:taskId
  → /result/:sessionId（目标形态）
  → /data/:sessionId
```

当前实现的结果/数据路由仍使用 `taskId`，持久化 Session 完成后再迁移为 `sessionId`。

## 5. 统一命令模型

鼠标点击、`F`、未来的触屏和手柄只能产生 Player Intent，不能分别实现拾取/放置逻辑。

```typescript
type GameCommand =
  | { type: 'move'; input: MoveInput }
  | { type: 'transition-room'; doorwayId: string }
  | { type: 'pick'; entityId: string }
  | { type: 'place'; containerId: string }
  | { type: 'toggle-container'; containerId: string }
  | { type: 'save-memory'; entityId: string }
  | { type: 'lock-memory'; slotIndex: number }
  | { type: 'clear-memory'; slotIndex: number }
```

每次离散命令的执行顺序固定：

1. 校验生命周期和前置条件；
2. 计算领域状态变化；
3. 写入 step 和 domain event；
4. 更新/失效记忆；
5. 评估目标和失败条件；
6. 生成分数、音效、Toast 等反馈。

失败命令也要记录原因，但不一定增加有效动作计数。移动轨迹使用固定频率降采样，不把每帧渲染当作一步。

## 6. 任务配置

```typescript
interface TaskConfig {
  id: string
  version: string
  name: string
  description: string
  difficulty: 'easy' | 'medium' | 'hard'
  memoryTypes: MemoryType[]
  rooms: RoomId[]
  objects: ObjectSpec[]
  containers: ContainerSpec[]
  goals: GoalSpec[]
  scriptedEvents: ScriptedEventSpec[]
  probes: ProbeQuestionSpec[]
  timeLimit?: number
  briefing: string
}
```

### 6.1 目标类型

长流程不能只用当前快照的布尔 predicate 表达。建议将目标区分为：

```typescript
type GoalKind = 'milestone' | 'terminal-constraint'

interface GoalSpec {
  id: string
  kind: GoalKind
  stage?: string
  description: string
  memoryType: MemoryType
  predicate: (context: GoalContext) => boolean
}
```

- `milestone`：曾经完成即记入 `achievedGoalIds`，例如“早餐已摆上餐桌”；
- `terminal-constraint`：结束时仍须成立，例如“牛奶已回冰箱”“所有容器已关闭”。

早餐关必须按 `prepare → consume/confirm → restore → close` 阶段推进，不能要求准备状态和归位状态在同一快照中同时成立。

### 6.2 关卡矩阵

| 顺序 | ID | 名称 | 房间 | 目标数 | 时间 |
|---|---|---|---:|---:|---:|
| 1 | `task-clean-table` | 餐桌混乱 | 餐厅、厨房、客厅 | 5 | 75s |
| 2 | `task-leave-home` | 出门大作战 | 客厅、卧室、玄关、厨房 | 3 | 180s |
| 3 | `task-laundry-sort` | 洗衣幽灵 | 洗衣房 | 4 | 90s |
| 4 | `task-breakfast` | 早餐时间循环 | 厨房、餐厅 | 11（需改为阶段目标） | 120s |

## 7. 脚本事件与实验条件

脚本事件是研究自变量的一部分，不只是剧情 Toast。

每个事件至少记录：

- `eventId`、task/event version；
- 触发条件与实际触发时间/step；
- 受影响实体；
- old/new state；
- 是否使某条记忆失效；
- 玩家是否看见事件；
- session seed 和 condition。

事件调度要求：

- 不在渲染帧中直接做未归一化概率抽样；
- 使用 seed PRNG；
- 时间随机按固定 tick 或 hazard rate 计算；
- 事件移动对象时同步清理旧 `placedIn`/容器成员关系；
- 同一事件只触发一次，除非显式配置重复策略；
- 关键扰动提供可感知但不一定暴露答案的反馈。

## 8. 记忆系统

### 8.1 玩家工作记忆槽

默认 3 个槽位，支持保存、覆盖、锁定、更新和过期标记。每个槽位至少包含：

- 物体身份；
- 房间和容器；
- 状态；
- 写入时间/step；
- 置信度；
- 是否锁定、是否过期。

### 8.2 研究记忆事件

工作记忆 UI 与 Session MemoryEntry 必须由同一操作生成。需要区分：

- `memory_write`：写入空槽；
- `memory_overwrite`：覆盖旧槽；
- `memory_update`：更新同一对象；
- `memory_lock/unlock`；
- `memory_invalidated`：环境变化使记忆过期；
- `memory_verified`：重新观察后恢复可信度；
- `memory_used`：玩家基于记忆作出动作（可通过规则推断或实验操作显式记录）。

## 9. 3D 场景与控制

- 世界单位为米，Y 轴向上，X-Z 为地面；
- 第一人称和俯视模式使用同一 robot pose；
- 移动、房间边界、门洞和家具碰撞统一由 `game/` 纯函数计算；
- 任务对象和容器使用统一的世界坐标、表面高度和模型高度注册表；
- GLB 缺失时使用可识别的程序化 fallback，不阻塞关卡；
- 关键物体可读性优先于写实程度。

当前操作：

| 输入 | 行为 |
|---|---|
| `WASD` / 方向键 | 移动 |
| 鼠标左键拖动 | 调整 yaw/pitch |
| `V` | 切换第一/俯视 |
| `E` | 保存/更新附近物体记忆 |
| `F` | 拾取、放置、开关容器 |
| `Tab` | 任务面板 |
| `R` | 事件日志 |
| `H` / `Esc` | HUD/帮助恢复 |

## 10. 高频状态与性能

渲染帧和领域逻辑必须解耦：

- 相机平滑、模型 bob 和粒子动画保留在 R3F ref；
- robot pose 按固定频率写入 Store/Recorder；
- 计时和混乱值使用固定 tick，而非每帧触发全局 React 更新；
- Zustand 组件使用 selector，只订阅需要的字段；
- 首页、3D 游戏、结果分析按路由拆包；
- 阴影、灯光和模型实例使用性能预算。

建议预算：桌面常见设备 60 FPS 目标，低性能模式至少 30 FPS；主线程长任务 < 50ms；非 3D 首屏不加载完整 Three.js 游戏包。

### 10.1 像素艺术风格渲染优化

游戏采用复古像素艺术风格，通过以下方式实现：

- 模型材质使用 `NearestFilter` 纹理过滤，关闭 mipmap 生成；
- 所有材质启用 `flatShading` 平面着色；
- 自定义像素化后处理 Pass（`PixelationPass`），可调节像素大小；
- 统一的复古像素配色方案（16-bit 风格色彩）；
- 阴影贴图分辨率优化为 1024×1024，减少 GPU 负担。

### 10.2 代码拆分优化

ArenaPage 关键组件采用 React.lazy 动态导入：

- `Scene3D` - 3D 场景渲染组件；
- `HUD` - 游戏界面 HUD；
- `DialogBox` - 对话弹窗；
- `ItemHintIndicator` - 寻物方向指示器。

## 11. Session 与分析

Session 原始层和派生层分开：

```typescript
interface SessionEnvelope {
  schema_version: string
  app_version: string
  task_version: string
  scene_version: string
  analysis_version?: string
  seed: string
  condition_id?: string
  raw: RawSessionData
  derived?: DerivedSessionAnalysis
}
```

派生分析只能在 Probe 完成后执行，并应可从 `raw` 重算。最终分析包括：

- 游戏表现：完成、用时、路径、动作、错误、Combo、混乱；
- 记忆表现：槽位使用、失效、更新、Probe 正确率和反应时间；
- 失败模式：错放、遗漏、位置遗忘、顺序偏差、超时；
- 策略建议：与具体证据和记忆类型关联。

规则式诊断在 UI 中可以称为“自动诊断”或“策略分析”。只有接入真实模型时才应描述为大模型生成。

## 12. 测试策略

### 单元测试

- 坐标、移动、碰撞、摆放；
- 目标 milestone/terminal 语义；
- 事件调度和 seed 重放；
- 计分、混乱、记忆槽；
- 指标从原始 Session 的确定性计算。

### 集成测试

- 每种输入方式产生相同 command/event；
- 事件移动对象时实体与容器关系一致；
- 游戏结束后进入 Probe，再 finalize；
- Session 导出通过 schema 校验。

### E2E

- 四关最短合法通关路径；
- 超时、混乱失败和重试；
- 刷新/直接路由恢复；
- 键盘完成全流程；
- 结果页重玩和数据下载。

## 13. 当前实现状态

已具备：

- 4 个数据驱动关卡和 6 个共享房间；
- 3D 场景、碰撞、门洞、小地图、fallback 模型；
- 记忆槽、混乱值、计分、Combo、事件视觉反馈；
- Session 类型、观察/action 事件、Probe UI、结果与 JSON 页面；
- 显式生命周期、简报暂停和真实 `timeLimit`；
- 统一键盘/鼠标/E 记忆命令管线；
- 历史 milestone 与终局 constraint 目标语义；
- 单一当前专注目标，以及 20/45 秒两级停滞救援；
- `flow_intervention` 事件、最长目标间隔和操作成功率代理指标；
- 游戏结束后进入 Probe，再 finalize Session；
- 路由拆包、缺失模型静默 fallback 和安全 JSON 预览；
- 全绿 lint 和可用的生产构建（当前测试结果以 QA_REPORT.md 和实际 `npm test` 输出为准，不在本文档重复维护精确数量）。

尚未达到本设计契约：

- session seed、可配置实验 condition 和完整状态 delta；
- 完整 Session Recorder、持久化和 schema；
- 四关浏览器 E2E 和离线 QA；
- 基于真人试玩的时间、扰动、辅助阈值和平衡曲线校准。

已完成的性能优化：

- Arena chunk 代码拆分（React.lazy 动态导入）；
- 像素艺术风格渲染优化（NearestFilter、flatShading、后处理）；
- 阴影贴图分辨率优化（1024×1024）；
- 模型材质优化（关闭 mipmap、统一配色）。

实施优先级见 [产品、游戏与研究设计基线](docs/product-research-game-design.md#10-当前优先级)。
