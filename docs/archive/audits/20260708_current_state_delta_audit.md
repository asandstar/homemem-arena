# Current-State Delta Audit

> 审计时间：2026-07-12
> 审计基线：当前 `main` 分支代码（commit 未变更，只读审计）
> 真值源优先级：`docs/product-research-game-design.md` > 实际代码 > 历史报告快照
> 审计范围：架构、文档、稳定性、UI/导航、测试能力
> 审计约束：不修改业务代码、不修改现有文档、不修改 package.json、不提交 Git

---

## 1. 仓库当前状态摘要

| 维度 | 当前值 | 证据 |
|---|---|---|
| 测试数量 | 287 passed (11 files) | `npm test` 运行结果（2026-07-12 11:15:29） |
| Lint 结果 | 3 warnings / 0 errors | `npm run lint` 运行结果 |
| 构建结果 | success (569ms) | `npm run build` 运行结果 |
| QA 结果 | success (518ms 末段构建) | `npm run qa` 运行结果 |
| E2E 命令 | missing | `package.json` 第 6-20 行无 `e2e` 脚本 |
| 主要依赖 | React 19、Three.js R185、Zustand 5、React Router 7、Vite 8、Vitest 4 | `package.json` 第 21-47 行 |
| 部署 | GitHub Pages 自动部署 | `README.md` 第 205-211 行 |
| 在线地址 | https://asandstar.github.io/homemem-arena/ | `README.md` 第 3、14 行 |

**总体结论**：构建链全绿，QA 全绿，单元测试全绿，但部分历史文档与代码已脱节，存在 1 项 Critical 内容冲突（breakfast Probe 答案与脚本事件不符）、2 项 Major（Scene Graph 死代码、HUD 音频 cleanup 缺失）、5 项 Minor 文档漂移。第一关已具备对外试玩条件，第四关流程可走通但 Probe 答案存在内容性错误。

---

## 2. 当前真实架构

### 2.1 useGameStore Slice 组合架构

**已确认**：`useGameStore` 由 9 个 Slice 组合，非单体文件。

- 文件：`src/store/useGameStore.ts`
- 第 6-14 行：import 9 个 Slice 工厂
- 第 192-201 行：Slice 组合
  ```ts
  export const useGameStore = create<GameStore>((set, get) => ({
    ...createTaskSlice(set, get),
    ...createPlayerSlice(set, get),
    ...createEntitySlice(set, get),
    ...createMemorySlice(set, get),
    ...createChaosSlice(set, get),
    ...createScoreSlice(set, get),
    ...createFeedbackSlice(set, get),
    ...createAnimationSlice(set, get),
    ...createFlowSlice(set, get),
  ```
- 第 204-238 行：跨切片聚合方法 `getGameStats` 和 `isGoalAchieved`，不属于任何单一 Slice

**9 个 Slice 职责**：

| Slice | 文件 | 职责 |
|---|---|---|
| taskSlice | `src/store/slices/taskSlice.ts` | 任务初始化、阶段切换、脚本事件触发、关卡完成判定、程序记忆顺序校验 |
| playerSlice | `src/store/slices/playerSlice.ts` | 机器人位置、旋转、相机俯仰、房间切换 |
| entitySlice | `src/store/slices/entitySlice.ts` | 实体拾取/放置/容器交互，调用 `checkProceduralAction` |
| memorySlice | `src/store/slices/memorySlice.ts` | 3 槽位空间/物体/时间/程序记忆写入、更新、失效 |
| chaosSlice | `src/store/slices/chaosSlice.ts` | 混乱值累加与峰值追踪 |
| scoreSlice | `src/store/slices/scoreSlice.ts` | 分数、Combo、最大 Combo |
| feedbackSlice | `src/store/slices/feedbackSlice.ts` | 浮动文字、事件 Toast、记忆保存特效 |
| animationSlice | `src/store/slices/animationSlice.ts` | 实体移动动画、相机震动 |
| flowSlice | `src/store/slices/flowSlice.ts` | 心流提示两级（20s/45s）救援 |

### 2.2 Scene Graph 存在但为死代码

- 文件：`src/engine/sceneGraph.ts`（384 行）
- 提供 17 个查询 API：`buildSceneGraph`、`getEntitiesInRoom`、`findNearestEntity`、`getRoomPath` 等
- **关键发现**：Grep 全量搜索 `sceneGraph|buildSceneGraph|getEntitiesInRoom` 在 `src/` 下仅命中 2 个文件：
  - `src/engine/sceneGraph.ts`（定义本身）
  - `src/engine/sceneGraph.test.ts`（测试）
- **生产代码零引用**：`commands.ts`、`taskSlice.ts`、`ArenaPage.tsx`、`Scene3D.tsx`、`useGameStore.ts` 等均未 import
- `README.md` 第 170 行声称"已实现场景图查询"，但实际未被任何业务路径调用
- **结论**：Scene Graph 当前是 384 行死代码，仅有 16 个测试覆盖

### 2.3 Event Bus 存在并实际使用

- 文件：`src/engine/eventBus.ts`（41 行）
- 4 个 API：`subscribeEvent`、`emitEvent`、`getListenerCount`、`clearListeners`
- 同步发布-订阅模式
- **发布方**：
  - `src/game/commands.ts` 第 4、57、160、190 行（action、memory、movement 事件）
  - `src/store/slices/taskSlice.ts` 第 13、249、367 行（goal、scripted event）
- **订阅方**：
  - `src/store/useSessionStore.ts` 第 6、22、90、97、286、288 行（在 `startSession` 时订阅，`endSession` 时取消）
- **结论**：Event Bus 真实接入，是 commands→session 的统一事件通道

### 2.4 Commands 统一处理交互

- 文件：`src/game/commands.ts`（201 行）
- 6 个导出函数：
  - `executePick(entityId)` 第 72 行
  - `executePlace(containerId)` 
  - `executeToggleContainer(containerId)`
  - `executeContainerInteraction(containerId)`（组合 place + toggle）
  - `executeSaveMemory(entity)`
  - `executeRoomTransition(toRoom)`
- 第 19-24 行：`ensurePlaying()` 守卫，非 `playing` 阶段直接拒绝
- 第 32-35 行：`processPostCommand()` 统一后处理（触发脚本事件 + 检查关卡完成）
- **结论**：交互入口已统一，`ArenaPage.tsx` 第 87-123 行通过 `executePick`/`executeContainerInteraction` 调用

### 2.5 程序记忆系统已接入 breakfast

- 文件：`src/game/proceduralMemory.ts`（含 `ProceduralProgress` 类型）
- 接入点：`src/store/slices/taskSlice.ts`
  - 第 60 行：`proceduralProgress: Record<string, ProceduralProgress>` 状态字段
  - 第 74 行：`checkProceduralAction` 方法签名
  - 第 90 行：初始化 `proceduralProgress: {}`
  - 第 189 行：`initializeTask` 时调用 `initialProceduralProgress`
  - 第 426-457 行：`checkProceduralAction` 实现，校验 pick/place/use 三动作顺序
- **调用方**：`src/store/slices/entitySlice.ts`
  - 第 71 行：`pickEntity` 调用 `checkProceduralAction('pick', entity.configId)`
  - 第 172 行：`placeEntity` 调用 `checkProceduralAction('place', heldEntity.configId)`
  - 第 278 行：`useContainer` 调用 `checkProceduralAction('use', containerId)`
- breakfast 任务配置：`src/data/tasks/breakfast.ts` 第 281-286 行 `requiredSequence` 字段定义上桌顺序（牛奶→麦片→碗→杯子）
- **结论**：程序记忆系统真实接入 breakfast 关卡，三动作均触发顺序校验

### 2.6 当前页面和路由

- 文件：`src/routes.tsx`（41 行）
- 路由器：`createBrowserRouter`，basename 取自 `import.meta.env.BASE_URL`（第 4 行）
- 6 条路由 + 1 条 fallback：

| 路径 | 组件 | 行号 |
|---|---|---|
| `/` | `HomePage` | 第 14 行 |
| `/tasks` | `TaskSelectPage` | 第 18 行 |
| `/play/:taskId` | `ArenaPage` | 第 22 行 |
| `/probe/:taskId?` | `ProbePage` | 第 26 行 |
| `/result/:taskId` | `ResultPage` | 第 30 行 |
| `/data/:taskId` | `SessionDataPage` | 第 34 行 |
| `*` | `<Navigate to="/tasks" replace />` | 第 36 行 |

- 所有页面使用 `lazy()` 异步加载，已按路由拆包
- 构建产物：`ArenaPage-gBnNyMJp.js` 1,243 KB（含 Three.js），主包 `index-DdvPS3P8.js` 301 KB

### 2.7 当前 QA 命令

- 文件：`package.json` 第 6-20 行
- 13 个 scripts：

| 命令 | 作用 | 行号 |
|---|---|---|
| `dev` | Vite 开发服务器 | 第 7 行 |
| `build` | `tsc -b && vite build` | 第 8 行 |
| `lint` | Oxlint | 第 9 行 |
| `preview` | Vite preview | 第 10 行 |
| `test` | `vitest run` | 第 11 行 |
| `test:watch` | `vitest` | 第 12 行 |
| `qa` | static + assets + rooms + tasks + build | 第 13 行 |
| `qa:static` | `tsc --noEmit -p tsconfig.app.json` | 第 14 行 |
| `qa:assets` | `vite-node scripts/qa-assets.ts` | 第 15 行 |
| `qa:rooms` | `vite-node scripts/qa-rooms.ts` | 第 16 行 |
| `qa:tasks` | `vite-node scripts/qa-tasks.ts` | 第 17 行 |
| `qa:report` | `vite-node scripts/qa-report.ts` | 第 18 行 |
| `qa:all` | qa + qa:report | 第 19 行 |

- **无 `e2e` 命令**：已确认 missing
- **vite-node 依赖**：`devDependencies` 未显式声明 `vite-node`，但 `vite` 自带，`npm run qa` 实际成功执行

### 2.8 Playwright / E2E 测试

- **不存在**：`package.json` 无 `e2e` 脚本，无 `@playwright/test` 依赖
- `src/` 下无 `e2e/` 或 `playwright/` 目录
- **结论**：当前零浏览器 E2E 测试

---

## 3. 已有文档清单

| 文档 | 路径 | exists | lastUpdated | isOutdated | conflictsWithCode |
|---|---|---|---|---|---|
| 产品研究游戏设计基线 | `docs/product-research-game-design.md` | ✅ | unknown | 否（最高优先级真值源） | 无（作为基准） |
| 功能设计与系统架构 | `HOMEMEM_ARENA_DESIGN.md` | ✅ | unknown | 是 | 是（测试数量、useGameStore 描述） |
| 叙事设计 | `NARRATIVE_DESIGN.md` | ✅ | unknown | unknown | unknown |
| 视觉与交互规格 | `docs/design-polish-spec.md` | ✅ | unknown | unknown | unknown |
| QA Smoke Checklist | `QA_SMOKE_CHECKLIST.md` | ✅ | unknown | unknown | unknown |
| README | `README.md` | ✅ | 2026-07-10（第 162 行） | 部分 | 是（关卡顺序、lint 结果） |
| Foundation Audit | `FOUNDATION_AUDIT.md` | ✅ | unknown | 是（历史快照） | 不适用（历史） |
| Foundation QA | `FOUNDATION_QA.md` | ✅ | unknown | 是（历史快照） | 不适用（历史） |
| Playtest Report | `PLAYTEST_REPORT.md` | ✅ | unknown | 是（历史快照） | 不适用（历史） |
| Playtest Report V2 | `PLAYTEST_REPORT_V2.md` | ✅ | unknown | 是（历史快照） | 不适用（历史） |
| QA Report | `QA_REPORT.md` | ✅ | unknown | 是（历史快照） | 不适用（历史） |
| NPC Representation Audit | `NPC_REPRESENTATION_AUDIT.md` | ✅ | unknown | 是（历史快照） | 不适用（历史） |

**历史报告处理原则**：本审计不直接沿用历史报告结论，所有当前问题均经代码验证后列出。

---

## 4. 已有 QA 和测试能力

### 4.1 QA 脚本能力

| 脚本 | 路径 | 检查内容 |
|---|---|---|
| `qa-assets.ts` | `scripts/qa-assets.ts` | 模型/纹理资源存在性 + fallback |
| `qa-rooms.ts` | `scripts/qa-rooms.ts` | 房间布局、doorway 双向、中心不重叠 |
| `qa-tasks.ts` | `scripts/qa-tasks.ts` | 任务配置：objects/containers/goals 引用一致性 |
| `qa-report.ts` | `scripts/qa-report.ts` | 生成 `QA_REPORT.md` |
| `qa:static` | tsconfig | TypeScript 类型检查 |

### 4.2 单元测试能力

- 框架：Vitest 4 + jsdom 29
- 测试文件：11 个
- 测试用例：287 个，全部通过

| 测试文件 | 用例数 | 覆盖模块 |
|---|---|---|
| `src/engine/sceneGraph.test.ts` | 16 | Scene Graph 查询 API（但生产代码未用） |
| `src/game/memorySlots.test.ts` | 36 | 记忆槽位计算 |
| `src/game/placement.test.ts` | 38 | 物体放置高度计算 |
| `src/game/collision.test.ts` | 36 | 碰撞检测 |
| `src/game/playerMovement.test.ts` | 25 | 玩家移动 + 房间切换 |
| `src/game/scoring.test.ts` | 39 | 计分、Combo |
| `src/game/commands.test.ts` | 3 | 命令层（覆盖较薄） |
| `src/store/useGameStore.test.ts` | 44 | Store 集成 |
| `src/game/chaos.test.ts` | 34 | 混乱值 |
| `src/game/proceduralMemory.test.ts` | 13 | 程序记忆顺序校验 |
| `src/game/flow.test.ts` | 3 | 心流提示（覆盖较薄） |

### 4.3 测试能力边界

- **无浏览器 E2E**：无法自动跑通任意关卡 Golden Path
- **无视觉回归**：无法验证 HUD 重叠、物体悬空、碰撞体与可见家具一致
- **无 console error 检查**：无 Playwright/Puppeteer 层
- **commands.test.ts 仅 3 用例**：对 6 个导出函数覆盖不足
- **flow.test.ts 仅 3 用例**：对两级停滞救援覆盖不足

---

## 5. 文档与代码冲突

### 5.1 README 关卡顺序前后不一致【Major】

- 文件：`README.md`
- 第 28-33 行（"四个关卡"表格）：
  ```
  | 🌅 清晨 | 出门大作战 | ...
  | ☀️ 上午 | 餐桌混乱 | ...
  | 🌆 下午 | 洗衣幽灵 | ...
  | 🌙 深夜 | 早餐时间循环 | ...
  ```
- 第 51-56 行（"当前内容"表格）：
  ```
  | 1 | 餐桌混乱 | ...
  | 2 | 出门大作战 | ...
  | 3 | 洗衣幽灵 | ...
  | 4 | 早餐时间循环 | ...
  ```
- **冲突**：第 28-33 行顺序为 出门→餐桌→洗衣→早餐；第 51-56 行顺序为 餐桌→出门→洗衣→早餐
- **权威源**：`docs/product-research-game-design.md`（未读取到具体行号，标记为需对照），但 `src/data/tasks/leave-home.ts` 第 1 行注释"关卡 1"、`src/data/tasks/clean-table.ts` 应为关卡 2、`src/data/tasks/laundry-sort.ts` 第 1 行注释"关卡 3"、`src/data/tasks/breakfast.ts` 第 1 行注释"关卡 4"
- **结论**：第 28-33 行的"清晨→上午→下午→深夜"叙事顺序与代码注释一致；第 51-56 行的"餐桌为第 1 关"与代码冲突

### 5.2 玩家名称在多文档间混用【Minor】

- `README.md` 第 10 行："家政小精灵'小橡'"
- `README.md` 第 12 行："`MEM-07`"
- `src/data/tasks/leave-home.ts` 第 20 行：便签称"小橡"
- `src/data/tasks/leave-home.ts` 第 24 行：systemPrompt 称"MEM-07 日志"
- `src/data/tasks/breakfast.ts` 第 24 行：completionText 称"小橡你做到了"
- `src/data/tasks/breakfast.ts` 第 26 行：systemPrompt 称"MEM-07 日志"
- **结论**：项目已确立"正式型号 MEM-07 + 主人昵称小橡"的双名约定，文档与代码内部一致，但 `README.md` 第 10 行同时使用"家政小精灵"可能造成第三种身份混淆

### 5.3 游戏流程为 Arena → Probe → Result【一致】

- `README.md` 第 104-107 行：`首页 → 任务选择 → 欢迎/任务简报 → 3D 游戏 → 记忆 Probe → Session 分析 → 结果页 → JSON 导出`
- `src/routes.tsx` 第 21-30 行：`/play/:taskId` → `/probe/:taskId?` → `/result/:taskId`
- `src/pages/ArenaPage.tsx` 第 78-80 行：`levelCompleted || levelFailed` 后 `navigate('/probe/${taskId}')`
- `src/pages/ProbePage.tsx` 第 104 行：`setGamePhase('result')`，第 110-113 行 `handleGoToResult` 跳转 `/result/${taskId}`
- **结论**：文档与代码一致

### 5.4 文档声称 useGameStore 是单体文件【已过时】

- 文件：`HOMEMEM_ARENA_DESIGN.md`
- 需对照具体行号验证是否仍声称"单体文件"
- **实际代码**：`src/store/useGameStore.ts` 第 192-201 行已由 9 个 Slice 组合
- **结论**：若文档仍称"单体"，则与代码冲突；标记为需对照（未在本次审计中定位到具体声明行，unknown）

### 5.5 文档记录的测试数量不一致【Minor】

- 文件：`HOMEMEM_ARENA_DESIGN.md`
- 第 333 行："258 个测试、全绿 lint 和可用的生产构建。"
- **实际**：287 个测试（`npm test` 运行结果）
- **冲突**：少 29 个测试
- `README.md` 第 8 行徽章正确显示"tests-287"，第 164 行正确写"287 个测试通过"
- **结论**：`HOMEMEM_ARENA_DESIGN.md` 第 333 行过时

### 5.6 文档描述的脚本事件是否真的改变状态【部分冲突，Critical】

- 文件：`src/data/tasks/breakfast.ts`
- Probe `p-object-state-fridge`（第 426-435 行）：
  - 问题："🔒 早餐闹钟会对冰箱做什么？"
  - 正确答案：`'自动关上冰箱门'`（第 430 行）
- 对应脚本事件 `se-fridge-auto-close`（第 358-364 行）：
  - `type: 'message'`（第 360 行）
  - 仅显示消息"早餐闹钟瞪着冰箱门...好像在催你记得关好冰箱门"
- **冲突**：Probe 答案声称"自动关上冰箱门"，但事件类型是 `message`，不实际改变冰箱开关状态
- 验证：`src/store/slices/taskSlice.ts` 第 308 行仅对 `type === 'move-entity'` 调用 `applyScriptedMove`，`message` 类型不触发任何状态变化
- **结论**：玩家在 Probe 中答"自动关上冰箱门"会被判正确，但实际冰箱从未被自动关闭，构成内容性错误

- 同理，Probe `p-temporal-penalty`（第 480-489 行）：
  - 问题："❌ 牛奶离开冰箱多久会第一次被扣分？"
  - 正确答案：`'15 步'`（第 484 行）
  - 对应事件 `se-milk-deduct-points`（第 366-372 行）`type: 'message'`，仅显示催促消息，**不实际扣分**
- **结论**：Probe 答案声称"扣分"，但事件仅发消息，构成第二处内容性错误

### 5.7 文档中的关卡目标与 task 配置一致性【基本一致】

- `README.md` 第 30-33 行描述四关核心挑战
- `src/data/tasks/leave-home.ts`：找钥匙、手机、雨伞放到玄关托盘（与文档一致）
- `src/data/tasks/breakfast.ts` 第 188-344 行：准备阶段 + 归位阶段（与文档"准备→归位→关闭"一致）
- **结论**：基本一致

### 5.8 文档中的房间布局与 rooms.ts 一致性【一致】

- 文件：`src/data/rooms.ts`
- 第 5 行：`id: 'living'`
- 第 37 行：`id: 'bedroom'`
- 第 55 行：`id: 'kitchen'`
- 第 80 行：`id: 'entrance'`
- 第 98 行：`id: 'laundry'`
- 第 116 行：`id: 'dining'`
- 共 6 个房间，与 `README.md` 第 35、58 行"6 个共享房间"一致
- leave-home 任务第 15 行 `rooms: ['living', 'bedroom', 'kitchen', 'entrance']` 含客厅、卧室、厨房、玄关，满足 project_memory 中"第一关必须含 living、bedroom、entrance"约束

### 5.9 文档中的操作方式与 FirstPersonControls 一致性【一致】

- `README.md` 第 91-100 行操作表
- `src/components/arena3d/FirstPersonControls.tsx` 第 95、173 行处理 `KeyW`（WASD）
- `src/components/arena3d/HUD.tsx` 第 537 行显示 `WASD` 提示
- **结论**：WASD 移动、鼠标拖动视角、V 切换视角、E 保存记忆、F 交互、Tab/R/H/Esc 面板切换均与代码一致

### 5.10 README 工程状态 lint 结果过时【Minor】

- `README.md` 第 165 行："`npm run lint`：0 error / 0 warning"
- **实际**：3 warnings / 0 errors
- 警告位置：`src/components/arena3d/FirstPersonControls.tsx` 第 312 行（useEffect 依赖数组）
- **结论**：lint warning 数量与文档不符

---

## 6. 当前 Blocker

**无 Blocker**。

经代码验证：
- 构建通过（`npm run build` 569ms success）
- 测试全绿（287 passed）
- QA 全绿（`npm run qa` success）
- 第一关可进入、可交互、可完成、可进入 Probe、可进入 Result（见第 10 节）
- 路由 fallback 完整（`src/routes.tsx` 第 36 行 `*` → `/tasks`）
- 无白屏风险（`ArenaPage.tsx` 第 125-129 行有 loading fallback）

---

## 7. 当前 Critical

### C1: breakfast 关卡 Probe 答案与脚本事件类型不符【内容性错误】

- **位置**：`src/data/tasks/breakfast.ts`
- **证据**：
  - Probe `p-object-state-fridge` 第 426-435 行，正确答案 `'自动关上冰箱门'`（第 430 行）
  - 对应事件 `se-fridge-auto-close` 第 358-364 行，`type: 'message'`（第 360 行），不实际关冰箱
  - Probe `p-temporal-penalty` 第 480-489 行，正确答案 `'15 步'`（第 484 行），声称"扣分"
  - 对应事件 `se-milk-deduct-points` 第 366-372 行，`type: 'message'`，不实际扣分
- **影响**：玩家在 Probe 中给出的"正确答案"与游戏实际发生的事件不符，研究数据有效性受损
- **修复建议**（不在本轮执行）：将 Probe 答案改为与事件一致的描述（如"提醒玩家关冰箱门"），或将事件改为实际触发状态变化

---

## 8. 当前 Major

### M1: Scene Graph 为 384 行死代码【工程债务】

- **位置**：`src/engine/sceneGraph.ts`（384 行）+ `src/engine/sceneGraph.test.ts`（16 用例）
- **证据**：Grep 全量搜索 `sceneGraph|buildSceneGraph|getEntitiesInRoom` 在 `src/` 下仅命中 2 个文件（定义本身 + 测试）
- **影响**：维护成本（384 行 + 16 测试需同步维护），误导开发者以为有查询能力可用
- **修复建议**：要么接入业务路径（如 AI 记忆生成、最近物体查找），要么删除并移除测试

### M2: HUD 音频 useEffect 缺少 unmount cleanup【资源泄漏】

- **位置**：`src/components/arena3d/HUD.tsx`
- **证据**：
  - 第 211-217 行：BGM useEffect，无 return cleanup 函数
  - 第 219-223 行：房间环境音 useEffect，无 return cleanup 函数
- **场景**：玩家在 ArenaPage（phase='playing'）按浏览器后退到 `/tasks`，ArenaPage 卸载，但：
  - phase 仍为 `'playing'`（store 未重置），BGM effect 最后一次执行的是 `playBgm(task.id)`，无 cleanup 触发 `stopBgm()`
  - BGM 持续播放
- **影响**：浏览器后退后音频不停止，用户体验受损
- **修复建议**：在两个 useEffect 中添加 `return () => { stopBgm(); }` 和 `return () => { stopRoomAmbient(); }`

### M3: 两个独立 AudioContext 永不关闭【资源泄漏】

- **位置**：
  - `src/audio/sfx.ts` 第 123、128 行：`let audioContext: AudioContext | null = null` + `new AudioContext()`
  - `src/audio/bgm.ts` 第 3、55、94 行：另一个独立 `audioContext`
- **证据**：Grep 搜索 `AudioContext` 在 `src/audio/` 下命中 2 处 `new AudioContext`，0 处 `.close()`
- **影响**：浏览器音频资源累积，多次进出关卡后可能触发浏览器 AudioContext 数量上限
- **修复建议**：统一为单一 AudioContext，或在路由切换时调用 `audioContext.close()`

---

## 9. 当前 Minor

### m1: HOMEMEM_ARENA_DESIGN.md 测试数量过时

- `HOMEMEM_ARENA_DESIGN.md` 第 333 行："258 个测试"，实际 287

### m2: README lint warning 数量不符

- `README.md` 第 165 行："0 error / 0 warning"，实际 3 warnings

### m3: README 关卡顺序第二处表格错误

- `README.md` 第 51-56 行"当前内容"表格以餐桌为第 1 关，与代码注释（leave-home 为关卡 1）和第 28-33 行叙事顺序冲突

### m4: WelcomeModal 为死代码

- 文件：`src/components/help/WelcomeModal.tsx`
- 证据：Grep 搜索 `WelcomeModal` 在 `src/` 下仅命中该文件本身，无任何 import
- **影响**：维护负担，可能误导开发者以为有欢迎弹窗在使用

### m5: useGameStore.ts.backup 残留

- 文件：`src/store/useGameStore.ts.backup`
- 证据：Grep 命中第 16、718、836 行（旧单体 store 的 emitEvent 调用）
- **影响**：仓库整洁度，可能被误读

### m6: HUD.tsx.bak 残留

- 文件：`src/components/arena3d/HUD.tsx.bak`
- 证据：Grep 命中第 227 行
- **影响**：同 m5

---

## 10. 第一关是否可对外试玩

**判定：可对外试玩**。

| 检查项 | 状态 | 证据 |
|---|---|---|
| 可进入关卡 | ✅ | `src/routes.tsx` 第 21 行 `/play/:taskId`，`ArenaPage.tsx` 第 60-67 行初始化任务 |
| Briefing 显示 | ✅ | `ArenaPage.tsx` 第 66 行 `setBriefingOpen(true)`，`leave-home.ts` 第 18-21 行 briefing 文案 |
| WASD 移动 | ✅ | `FirstPersonControls.tsx` 第 95、173 行 `KeyW` 处理 |
| 鼠标视角 | ✅ | `FirstPersonControls.tsx` 第 209-240 行 mouse/touch 事件 |
| 物体拾取 | ✅ | `ArenaPage.tsx` 第 87-101 行 `handleEntityClick` → `executePick` |
| 容器交互 | ✅ | `ArenaPage.tsx` 第 103-123 行 `handleContainerClick` → `executeContainerInteraction` |
| 记忆保存 | ✅ | `commands.ts` `executeSaveMemory`，HUD E 键 |
| 脚本事件触发 | ✅ | `taskSlice.ts` `triggerScriptedEvents`，leave-home 含钥匙猫、手机响铃事件 |
| 目标完成判定 | ✅ | `taskSlice.ts` `checkLevelCompletion`，leave-home 第 188 行后 goals 定义 |
| 时间限制 | ✅ | `leave-home.ts` 第 25 行 `timeLimit: 180` |
| 进入 Probe | ✅ | `ArenaPage.tsx` 第 78-80 行完成后 navigate `/probe/${taskId}` |
| Probe 答题 | ✅ | `ProbePage.tsx` 第 75-108 行提交答案、计算指标、finalize |
| 进入 Result | ✅ | `ProbePage.tsx` 第 110-113 行 `handleGoToResult` |
| 重玩/返回 | ✅ | `ResultPage.tsx` 第 359 行重玩 `/play/${taskId}`，第 366 行返回 `/tasks` |
| 构建产物可用 | ✅ | `npm run build` success，`ArenaPage` chunk 1.2 MB |
| 在线部署 | ✅ | `README.md` 第 209 行 GitHub Pages 地址 |

**风险提示**：
- 浏览器后退时 BGM 可能不停止（见 M2），但不影响核心玩法
- 无 E2E 自动化验证，需人工试玩确认

---

## 11. 四关当前可玩状态

| 关卡 | taskId | 可进入 | 流程完整 | 已知问题 |
|---|---|---|---|---|
| 出门大作战 | `task-leave-home` | ✅ | ✅ Golden Path 可完成 | 无 Critical |
| 餐桌混乱 | `task-clean-table` | ✅ | ✅ | unknown（未深入验证餐具位置） |
| 洗衣幽灵 | `task-laundry-sort` | ✅ | ✅ | unknown（未深入验证篮子交换） |
| 早餐时间循环 | `task-breakfast` | ✅ | ⚠️ 流程可走通，但 Probe 答案与事件不符 | C1：两处 Probe 答案内容性错误 |

**证据**：
- 四个任务文件均存在于 `src/data/tasks/`
- `package.json` QA 包含 `qa:tasks` 检查，`npm run qa` 全绿
- `breakfast.ts` 第 8-490 行配置完整（objects、containers、goals、scriptedEvents、probes）
- breakfast Probe 冲突见第 7 节 C1

---

## 12. 场景、UI、导航和稳定性风险

### 12.1 场景风险

| 风险 | 状态 | 证据 |
|---|---|---|
| 家具渲染与碰撞数据双源 | 已修复 | 上一轮已对齐 `decorFurniture.ts` 与 `Room3D.tsx`（见会话历史） |
| 任务物体放置高度 | ✅ 统一 | `src/game/placement.ts` + 38 个测试 |
| 门视觉与 doorway 一致 | ✅ | `qa-rooms.ts` 检查 doorway 双向 |
| GLB fallback 安全 | ✅ | 三层保护：assetAvailable 预检 + ModelErrorBoundary + clonedScene null 检查 |
| Scene Graph 死代码 | ⚠️ | 见 M1 |

### 12.2 UI 风险

| 风险 | 状态 | 证据 |
|---|---|---|
| HUD 1280×720 重叠 | unknown | 无视觉回归测试，无法自动验证 |
| HUD 1440×900 重叠 | unknown | 同上 |
| HUD 1920×1080 重叠 | unknown | 同上 |
| 小地图溢出 | 已修复 | 上一轮移动端隐藏重置/跟随按钮 |
| Toast 双轨制 | ⚠️ 设计如此 | `useToastStore`（全局）vs `useGameStore.eventToasts`（游戏内），非 bug |

### 12.3 导航风险

| 风险 | 状态 | 证据 |
|---|---|---|
| 无效 taskId | ✅ 处理 | `ArenaPage.tsx` 第 60-64 行 `if (!taskId || !getTaskById(taskId)) navigate('/tasks')` |
| 页面刷新 | ⚠️ 状态丢失 | `useGameStore` 无 persist，刷新后 phase 重置，`ArenaPage` 重新 `initializeTask`；`ResultPage.tsx` 第 122-126 行检测 `currentSession` 为空时跳转 `/tasks` |
| 浏览器后退 | ⚠️ 音频泄漏 | 见 M2 |
| 路由 fallback | ✅ | `routes.tsx` 第 36 行 `*` → `/tasks` |

### 12.4 稳定性风险

| 风险 | 状态 | 证据 |
|---|---|---|
| 重新开始状态重置 | ✅ | `taskSlice.ts` `resetTask` + `useSessionStore.ts` `endSession` 第 286-288 行取消订阅 |
| 关卡结束 tick 停止 | ✅ | `commands.ts` 第 19-24 行 `ensurePlaying` 守卫，非 playing 阶段拒绝操作 |
| AudioContext 累积 | ⚠️ | 见 M3 |
| Pointer Lock | ✅ 不适用 | `FirstPersonControls.tsx` 不使用 pointer lock（Grep 未命中 `requestPointerLock`） |

---

## 13. 测试覆盖缺口

| 缺口 | 影响 | 优先级 |
|---|---|---|
| 无浏览器 E2E | 无法自动跑通 Golden Path，回归依赖人工 | 高 |
| 无视觉回归 | 无法验证 HUD 重叠、物体悬空、碰撞体可见性 | 高 |
| 无 console error 检查 | 运行时 warning 可能未被发现 | 中 |
| `commands.test.ts` 仅 3 用例 | 6 个导出函数覆盖不足，pick/place/use/save 逻辑依赖集成测试 | 中 |
| `flow.test.ts` 仅 3 用例 | 两级停滞救援覆盖不足 | 中 |
| Scene Graph 16 测试覆盖死代码 | 维护成本，测试通过但不反映生产可用性 | 低 |
| 无路由切换资源释放测试 | M2/M3 无法被测试捕获 | 中 |
| 无 Probe 答案与事件类型一致性测试 | C1 无法被测试捕获 | 高 |

---

## 14. 下一轮最多应修复的 5 个问题

按优先级排序：

1. **C1 — 修复 breakfast Probe 答案与脚本事件一致性**
   - 文件：`src/data/tasks/breakfast.ts`
   - 修改 Probe `p-object-state-fridge` 第 430 行答案或修改 `se-fridge-auto-close` 第 360 行 type
   - 修改 Probe `p-temporal-penalty` 第 484 行答案或修改 `se-milk-deduct-points` 第 368 行 type
   - 理由：研究数据有效性受损，影响核心研究价值

2. **M2 — HUD 音频 useEffect 添加 cleanup**
   - 文件：`src/components/arena3d/HUD.tsx` 第 211-223 行
   - 添加 `return () => { stopBgm(); }` 和 `return () => { stopRoomAmbient(); }`
   - 理由：用户可感知的音频泄漏，修复成本低

3. **m3 + 5.1 — 修正 README 关卡顺序第二处表格**
   - 文件：`README.md` 第 51-56 行
   - 将顺序改为 出门→餐桌→洗衣→早餐，与第 28-33 行一致
   - 理由：对外文档一致性，修复成本极低

4. **m1 + m2 — 同步历史文档测试与 lint 数量**
   - 文件：`HOMEMEM_ARENA_DESIGN.md` 第 333 行（258→287）、`README.md` 第 165 行（0 warning→3 warning）
   - 理由：文档可信度，修复成本极低

5. **M1 决策 — Scene Graph 接入或删除**
   - 文件：`src/engine/sceneGraph.ts` + `sceneGraph.test.ts`
   - 二选一：接入业务路径（如 `commands.ts` 用 `findNearestEntity` 替代当前查找逻辑），或删除文件 + 测试
   - 理由：消除 384 行死代码 + 16 测试的维护负担
   - 注意：若删除需同步更新 `README.md` 第 170 行"已实现场景图查询"声明

---

## 15. 是否允许新增功能

**判定：不允许**。

理由：
- C1（breakfast Probe 答案错误）属于内容正确性问题，影响研究数据有效性，应优先修复
- M2/M3（音频资源泄漏）属于稳定性问题，影响用户体验
- 当前无 E2E 测试，新增功能缺乏回归保护
- project_memory 明确约束："Pause new gameplay feature development to prioritize building a unified QA inspection system"
- 当前 287 单元测试 + QA 脚本覆盖配置层，但运行时行为（路由切换、音频释放、Probe-事件一致性）缺乏自动化验证

**例外**：若新增功能是为了修复上述 5 个问题之一（如为修复 C1 而调整事件类型），允许最小化变更。

---

## 16. 是否允许进入游戏性调优

**判定：不允许**。

理由：
- C1 未修复前，breakfast 关卡的研究数据有效性存疑，调优基于不可靠数据
- 无 E2E 自动化 Golden Path 验证，调优效果难以客观度量
- project_memory 约束："First phase only requires the first level to be fully playable"——目前第一关可玩，但第四关存在内容性错误
- 历史教训（project_memory）："Gameplay needs to be enhanced to avoid mechanical object finding/placing"——调优需要先建立可度量的基线（如 E2E 完成时间、操作步数、记忆使用率），当前缺乏此基线

**进入调优的前置条件**：
1. 修复 C1
2. 修复 M2、M3
3. 建立至少 1 个关卡的 E2E Golden Path 自动化测试
4. 同步历史文档（m1、m2、m3）
5. 重新运行本轮审计确认无新增 Blocker/Critical

---

## 附录：审计命令执行记录

| 命令 | 执行时间 | 结果 |
|---|---|---|
| `npm test` | 2026-07-12 11:15:29 | 287 passed (11 files), 2.04s |
| `npm run lint` | 2026-07-12 | 3 warnings, 0 errors, 30ms |
| `npm run build` | 2026-07-12 | success, 569ms, ArenaPage chunk 1,243 KB |
| `npm run qa` | 2026-07-12 | success, 末段构建 518ms |
| `npm run e2e` | — | missing（package.json 无此脚本） |

## 附录：审计边界声明

- 本审计未修改任何业务代码
- 本审计未修改任何现有文档
- 本审计未修改 package.json
- 本审计未新增 QA 脚本
- 本审计未提交 Git
- 本审计未推送远程
- 本审计未重复创建已有文档
- 标记为 `unknown` 的项需进一步人工验证
- 历史报告（FOUNDATION_AUDIT.md、PLAYTEST_REPORT.md 等）中的问题均经代码重新验证后才列为当前问题
