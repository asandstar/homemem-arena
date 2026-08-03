# 三关手玩通关 + 失败诊断 + 解决方案与经验总结 计划文档

> 生成时间：2026-08-03
> 目标：依次进入三关公开教学关卡（task-clean-table / task-leave-home / task-laundry-sort），用浏览器自动化代理「手玩」尝试通关；若失败，则结合：
>   - 3D 场景前端交互（玩家移动/拾取/放置/开关门/保存记忆/阶段机 UI 反馈/可视化提示）
>   - 后端判定实现（TaskConfig 内 goals predicate / placement.ts / commands.ts / flow.ts / stages StageContext 构造 / entity & container state）
>   做交叉验证，找出「为何玩家（代理）的正确操作没有被判成通关」，输出两份文档：
>   1. `THREE_LEVEL_PLAYTHROUGH_DIAGNOSIS.md` — 三关实玩记录 + 问题定位（含失败的证据链）
>   2. `THREE_LEVEL_PLAYTHROUGH_SOLUTIONS_AND_LESSONS.md` — 修复建议 + 可复用经验

---

## 0. 仓库调研结论（作为计划输入）

### 0.1 三关公开关卡与阶段机

三关在 `PUBLIC_LEVEL_ORDER` 中的顺序：
- L1 `task-clean-table`（教学 / dining 单间 / 阶段数 3：observe→cup+tissue→fork）
- L2 `task-leave-home`（核心 / living+entrance+bedroom 三间 / 阶段数 3：observe→key outdated→finalize）
- L3 `task-laundry-sort`（挑战 / laundry 单间 / 阶段数 4：observe→white+dark→towel→finalize+mystery）

阶段机判定入口：`useGameStore.evaluateStageTransitions()` + `StageContext` 构造（见 `e2eTestApi.buildStageContext`、`src/game/flow.ts`、`src/data/tasks/{clean-table,leave-home,laundry-sort}.ts`）。

### 0.2 后端关键代码模块（用于失败后「反查为什么 predicate 没过」）

| 职责 | 文件（绝对路径） | 关键字段/函数 |
|---|---|---|
| 玩家指令执行（pick/place/use/open） | `src/game/commands.ts` | `executePick` / `executePlace` / `executeUseContainer` |
| 物体放置合法性与容器语义 | `src/game/placement.ts` | `canPlaceInto` / `surface vs enclosed container` / `placedIn` 写入 |
| 阶段机上下文快照 | `src/utils/e2eTestApi.ts` `buildStageContext(useGameStore.getState)`、`src/types/task.ts StageContext` | `entities[]` / `containerStates` / `memorySlots` / `achievedGoalIds` / `heldEntityConfigId` |
| 当前 active goal 解析 | `src/game/flow.ts#findActiveGoal` | 依赖 `goal.predicate(entities)` 返回 true = 已达成 |
| 目标判定 predicates 真实实现 | `src/data/tasks/*.ts` 的 `goals[].predicate`、`stages[].completionCondition(entryCondition)` | 通关必须依赖的真值来源 |
| 实体 & 容器状态 | `src/store/slices/entitySlice.ts`、`containerStates`（由 commands 修改） | `entity.status = held / placed / hidden`、`entity.placedIn = containerId or null` |
| 混乱事件（影响 L2/L3 的记忆过期与位置） | `src/game/chaos.ts`、`ScriptedEventSpec.trigger` / `type: move-entity | hide-entity` | L2：`se-cat-pushes-key`；L3：`se-cat-moves-towel` 等 |
| 完成/失败判定与分数结算 | `src/store/slices/taskSlice.ts`、`src/game/scoring.ts`、`ResultPage`（看 FailureBreakdown 字段） | `levelCompleted` / `elapsedMs vs timeLimit` |

### 0.3 前端交互映射（玩家操作键位，自动化代理必须遵守）

> 以 HelpPanel 与 VirtualJoystick/FirstPersonControls 为准：

```
移动：WASD / 方向键
视角：鼠标拖动（或 browser_evaluate 通过 FirstPersonControls set yaw/pitch）
交互：
  E = 保存/更新当前最近物体的位置记忆（lockMemorySlot / saveMemory）
  F = 拾取或放置最近物体（executePick / executePlace + openable 先开抽屉再取）
  Q = 锁定槽位（辅助教学用，但 L1/L2 非必须）
  Tab / M = 打开帮助、切地图、看 Minimap
房间切换：靠近门洞走到门边界（碰撞检测见 playerMovement.ts / collision.ts）
```

### 0.4 DEV E2E 测试 API（自动化代理可调用，能直接读内部状态验证「代理判定失败=真的没放进去」还是「判定 bug」）

在 `DEV && VITE_E2E=true` 时 `window.__testApi__`（见 `src/utils/e2eTestApi.ts`），暴露：
- 状态读取：`getEntities / getContainerStates / getAchievedGoalIds / getCurrentStageId / getCurrentObjective / getHeldEntityId / getCurrentRoom / getRobotPosition / getElapsedMs / getLevelCompleted / getMemorySlots`
- 指令：`pickupEntity(configId) / placeIntoContainer(containerId) / useContainer(containerId) / switchRoom(toRoom) / startLevel / moveBy / saveMemoryFor(configId) / lockMemorySlot / debugSetNearbyEntityFor(configId)`
- 验证辅助：`evaluateStageTransitionsNow / tickGameLogic(stepCount, elapsedMsDelta) / evaluateGoals`

如果 VITE_E2E 没开，可以在启动 dev server 时追加 `--mode e2e` 或 `VITE_E2E=true npm run dev`。

### 0.5 三关通关的「形式化目标」（用于自动化代理精确知道要做什么）

#### L1 task-clean-table（dining 单间）
- 初始阶段：必须先有 ≥1 条记忆（`memorySlots.some(s !== null)`）→ 否则阶段机卡死（教学故意要求先 E 再 F）
- 目标 predicate（关键三条，g-* 还要 achievedGoalIds 命中）：
  1. `obj-dirty-cup` placedIn `cnt-dishwasher`
  2. `obj-tissue` placedIn `cnt-trash-bin`
  3. `obj-fork` placedIn `cnt-utensil-rack`
  4. 最终阶段还要求 `achievedGoalIds.has(g-dirty-cup & g-tissue & g-fork)` 同时为 true（注意 goals 不自带里程碑 sticky，需要 evaluateGoals 每 tick 触发）

#### L2 task-leave-home（living + entrance + bedroom）
- 阶段 1：钥匙有任意记忆 + 手机被 obtain（held 或 on-tray）+ 伞 obtain
- 阶段 2：**猫事件 `se-cat-pushes-key` 触发之后** 完成 1 次 `memoryUpdateCount >= 1` 且钥匙有 fresh 记忆
- 阶段 3：三物全部 on `cnt-entrance-tray` + 猫事件触发过 + 钥匙 memory 满足（on-tray 或 fresh）

**注意 L2 隐性门坎**：如果玩家（代理）一直不离开 living / 不拿手机触发猫事件，就永远进不了阶段 2 & 3。需要 verifyScriptedEventsTick 被调用或以「玩家切房 / 持有手机」作为 trigger 条件。如果 predicate 拿 se-cat-pushes-key 作为必需条件，那么代理要确保事件已触发。

#### L3 task-laundry-sort（laundry 单间）
- 阶段 1：要么 ≥1 记忆，要么步数 ≥3（对自动化很宽容，主要不卡）
- 阶段 2 白：4 件白 `obj-white-shirt / socks / small-white-towel / mystery-shirt` → `cnt-white-basket`
- 阶段 2 深：3 件深 `obj-black-tshirt / jeans / dark-socks` → `cnt-dark-basket`
- 阶段 3：毛巾 `obj-towel-large / small` → `cnt-towel-basket`（此阶段依赖毛巾被猫事件移走后再按新位置 pick→place）
- 最终阶段：`g-white-sorted & g-dark-sorted & g-towel-sorted & g-mystery-item`（mystery-shirt 本身就属于白，所以只要阶段 2 放了它就过）

### 0.6 可能「玩不赢」的典型原因（前期预判，供失败后作为排查清单）

1. **阶段机 tick 不足**：`evaluateStageTransitions()` 只在玩家做动作/切房时跑。自动化代理原地按 F，阶段机不转 → predicate 虽然 true 但 completionCondition 没 check → 以为没完成。
2. **placedIn 写的是 containerId 但目标 predicate 看的是 status=placed**：`entityPlacedIn()` 工具函数是 `placedIn===containerId && status==='placed'` 双条件，少一个都算 false。placeIntoContainer 没写对 → 放了等于没放。
3. **Openable 家具（抽屉、伞架）必须先 `useContainer`（按 F/use 打开）再取物**：L2 手机在 `cnt-bedside-drawer`，先 pick 会失败，因为抽屉关着。
4. **Scripted event 不触发 → L2 永远过不了阶段 2**：猫推钥匙的触发条件（step 数、切房、持有手机）要精确匹配 commands.ts 中 `triggerScriptedEvents` 的参数。
5. **物品在 surfaceContainer（餐桌/茶几）上「看起来在」但 placedIn 是空**：如果 initial 状态里只设置 surfaceContainerId，而 predicate 看的是 `placedIn === cnt-surfaceContainer`，那么一开始被视为「不在那里」，需要走 place 流程再取回 → 造成多余步骤。
6. **拾取/放置的「最近实体」选不到**：player 位置与实体距离大于 `interactionTargets.ts` 内的 `INTERACTION_RADIUS`（默认 2.0m？），pickupEntity 直接失败。自动化代理要走到 `nearbyEntityConfigId != null` 才能 F。
7. **room 切换后 entities.currentRoom 没变**：跨房移动后实体仍在旧房间，于是在目标房间里 pick 不到（因为 playerMovement 切房后只更新玩家 currentRoom，实体不跟随）。
8. **evaluateGoals 漏跑**：`achievedGoalIds.has(g-*)` 需要 predicate 返回 true 被写入 set；如果只在 `checkLevelCompletion` 里评估，而没跑 `evaluateGoals`，L1 最终阶段会卡死。
9. **「记忆过期」（outdated=true）触发条件不满足（L2）**：stage 2 `entryCondition` 要求 `hasKeyOutdatedMemory(ctx)`。如果 `markMemoryOutdated` 在猫事件里没调用，就永远进不了阶段 2。
10. **Minimap 房间切换箭头/门不可见**：前端渲染了 `Door3D` 但玩家被 invisible collider 卡住，无法越界到新房间（`collision.test.ts` 已有用例可交叉验证）。

---

## 1. 要产出的文档与文件改动

### 1.1 文档 1（必输出）：`docs/playtest-reports/THREE_LEVEL_PLAYTHROUGH_DIAGNOSIS_YYYYMMDD.md`
包含：
- **三关实玩执行记录**（每关 1 节）：
  - 输入参数：dev server URL、启动 flag、代理实际操作序列（step+操作+目标）
  - 截图：起点 / 每阶段结束 / 失败瞬间（使用 browser_take_screenshot）
  - 关键状态快照：`getAchievedGoalIds`、`getCurrentStageId`、`getEntities`（只列关键 obj-cup/key/毛巾 的 placedIn / status / currentRoom）
- **是否通关（二进制 True/False + 分数/Rank）**：从 ResultPage 或 `getLevelCompleted + getScore + rank` 抓
- **失败证据链**（对每关「没通关」给出为什么）：
  - 证据 A：predicate（x）为 false 的一行具体字段（entities 中 obj-xxx 状态）
  - 证据 B：commands.executePlace 返回 {success:false, reason:xxx} 的调用栈
  - 证据 C：阶段机 `entryCondition/completionCondition` 的依赖没被满足（例如需要 catEvent 触发但 triggeredEvents 没 se-cat-pushes-key）
- **根因二分结论**：「前端交互问题（键位/距离/门卡住）」 vs 「后端判定 bug（predicate 条件错/漏/工具函数 entityPlacedIn 强约束）」 vs 「游戏设计问题（提示不足/流程反直觉）」

### 1.2 文档 2（必输出）：`docs/playtest-reports/THREE_LEVEL_PLAYTHROUGH_SOLUTIONS_AND_LESSONS_YYYYMMDD.md`
包含：
- **按问题根因类别的修复建议**（每类问题：现象→修复补丁→回归验证步骤）：
  - 类 A：交互 → 增加 HUD 提示/缩小 pickup 半径/FirstPersonControls 调参
  - 类 B：判定 → 改 goals.predicate 或 entityPlacedIn 工具函数（给出 1-2 处精确代码 edit 建议 + patch snippet）
  - 类 C：设计 → briefing 补提示 / 阶段 objective 改措辞 / tutorial 卡 UI 增加可视化箭头
- **可复用经验 Lessons Learned**（跨项目通用，适合 `.trae/documents/PLAYTEST_NOTES.md` 追加内容）：
  - L1-3 阶段机模式下的「最少 tick 数通关路径」（给后续 E2E 写 spec 用）
  - 常见 10 类「看起来对但判定没通过」的 checklist
  - 对未来新关卡的 authoring 约束：「如何写一个关卡 TaskConfig，保证自动化代理能通」

### 1.3 代码改动（可选，只在「确定是 bug 且 2-5 行能修好，风险为 0」时才做）
- 不允许大规模重构。
- 若定位到明确的单行级 bug（例如 `entityPlacedIn()` 多了一个 `&& status==='placed'` 导致 surface 放置不合法；或 `triggerScriptedEvents` 在 L2 缺少切房触发），要写「建议代码」进文档的「修复建议」里，但执行前走 notify 流程。
- 计划的默认路径是「**零代码改动，只出两份文档**」。

---

## 2. 修改步骤（分 Phase）

### Phase A：环境启动 & 基础能力自测（约 10%）
1. 确认 dev server（已在 5174 跑；如果 VITE_E2E 没开，则 `VITE_E2E=true npm run dev -- --port 5174` 重启一次，确保 `window.__testApi__` 可用）
2. 浏览器打开首页 → snapshot 拿到开始闯关按钮 → 进入任务选择页 → 定位 L1 卡片 ref
3. 打开 Console 验证 `window.__testApi__?.startLevel?.('task-clean-table')` 返回非 null（证明 E2E API 挂载成功）
4. 若 E2E API 不可用：回退到「纯键鼠模拟 + browser_evaluate 直接调 `useGameStore.getState()`」，但 API 优先。

### Phase B：三关按顺序玩，每关做到「要么通关，要么拿齐失败证据链」（约 70%）

**通用协议（每关都遵守）：**
- T0：进入关卡前 resetGameState → 保存一张起点截图
- T0.5：记录 HUD 当前阶段 objective（`__testApi__.getCurrentObjective()`）
- T1：按「形式化目标」分解成 step-by-step 操作序列
- 每一步操作后立即调用：`evaluateStageTransitionsNow() + evaluateGoals()`（主动 tick，避免「我做对了但判定没跑」）
- T_end：
  - 成功：截图 + 记录 `getScore() / rank / levelCompleted`
  - 失败：截图 + 记录
    - `getAchievedGoalIds()`（缺哪个 g-*）
    - 关键 obj 的 `{configId, status, placedIn, currentRoom}`
    - 关键 container 的 `containerStates[id].containedIds`
    - `triggeredEvents`（L2/L3 重点）
    - `memoryUpdateCount + outdatedMemoryCount`（L2/L3 重点）
    - 当前阶段 `currentStageId` 与阶段机最后一个 `completionCondition` 的「逐项布尔值（手动展开）」

#### B1：L1 task-clean-table（dining）
操作序列（最少步数版）：
1. spawn 在餐厅门口。走 → 最近实体 obj-dirty-cup（`nearbyEntity = cup`）→ E（save）
2. Evaluate → check 当前阶段由 observe → sort-cup-tissue（阶段 2 进入条件：memorySlots 非空）
3. F（pick cup）→ 走到洗碗机 → F（place into cnt-dishwasher）
4. 走到 obj-tissue → F（pick）→ 走到垃圾桶 → F（place into cnt-trash-bin）
5. Evaluate → 进入阶段 3（fork）
6. 走到 obj-fork → F → 走到 cnt-utensil-rack → F
7. `evaluateGoals() + checkLevelCompletion()`
8. 若没过 → 输出：缺哪个 g-*；如果 placedIn 正确但 g-* 没写入，说明 evaluateGoals 没被调用 → 属于「Phase C 类 B 判定 bug」

#### B2：L2 task-leave-home（3 间）
操作序列：
1. Spawn 在客厅 → 观察茶几 obj-key 位置 → E（save key）
2. 走门洞切房到 bedroom → 开 `cnt-bedside-drawer`（useContainer）→ pick 手机 → pick 完 hold
3. 切回 entrance（此时已触发「离开客厅+持有手机」 → se-cat-pushes-key）
4. 拿伞架的伞（或直接 pick 伞 obj-umbrella）
5. 回到 living → 找到钥匙新位置（cat event 移了）→ E（update key memory，此时 key 变 fresh 且 memoryUpdateCount ≥ 1）→ pick key
6. 三物都到 entrance 前 → F 分别放到 cnt-entrance-tray
7. `evaluateStageTransitionsNow()` → 阶段 3 completionCondition 全部展开；若没过：
   - 最常见原因：`catEventTriggered(ctx) = false`（cat 事件没触发）→ 看 commands.ts triggerScriptedEvents 的依赖
   - 或 `keyMemoryOk = false`（放钥匙到托盘前，没按 E 更新记忆 → 阶段 2 没进入，直接跳 finalize 被卡）

#### B3：L3 task-laundry-sort
操作序列：
1. 先走 3 步（满足阶段 1），或对白衬衫 E（save）
2. 4 白（白衬衫、白袜、小白巾、mystery 衬衫）依次 pick → cnt-white-basket → place
3. 3 深（黑 T、牛仔裤、深色袜）→ cnt-dark-basket
4. 此时 se-cat-moves-towel 应触发（移走毛巾）→ 找到毛巾新位置 → pick → cnt-towel-basket（2 件毛巾分别放置）
5. `evaluateGoals()` → 检查 `g-white / g-dark / g-towel / g-mystery-item`
6. 若没过：最常见是「mystery-item 的 placedIn 没算在 white-basket」（看 goals 里 g-mystery-item 的 predicate，是不是单独的一个？如果是，那么白的 4 件放进去还不够）

### Phase C：失败 → 代码交叉验证 + 证据链归档（约 15%）
对「没过」的关卡，做代码级交叉验证：
1. 把操作时 `getEntities()` 中的「关键 obj 状态快照」拿出来，**手动调用对应关卡 goals[i].predicate(snapshot)**（把快照当 entities 参数），打印每一项谓词的布尔结果。
   - 若手动调用也返回 false → 说明「真的没做到位」（placing 错误 / 缺东西 / 状态不对）。
   - 若手动调用返回 true，但 achievedGoalIds 里没写 → 说明「evaluateGoals 调用不够 / 写入逻辑被 guard 挡了」（类 B bug）。
2. 对阶段机：把 `buildStageContext(getState)` 返回的 ctx，手动执行 `stages[i].completionCondition(ctx)`，对比 `currentStageId` 为什么还没跳。
3. 证据链写入文档 1 的「失败证据链」表格。

### Phase D：写两份文档（约 5%）
- 文档 1 先写（Phase A+B+C 期间顺手做记录，最后统一整理成 md）
- 文档 2 基于文档 1 的根因结果写，按 A/B/C 三类修复建议分组；lessons learned 写在最后一节。

---

## 3. 潜在依赖 / 注意事项

1. **VITE_E2E=true 依赖**：`src/utils/e2eTestApi.ts` 只在 DEV && `VITE_E2E === 'true'` 才挂 `window.__testApi__`。若启动时没带 flag，自动化代理的状态读取会退化成「browser_evaluate + useGameStore.getState()」路径（仍可用，但没封装得方便）。
2. **浏览器自动化的「键鼠模拟精确度」**：R3F 的 FirstPersonControls 是 pointer lock 模式（点击 canvas 后才接管鼠标）。自动化代理要先 click canvas，才能让 `KeyDown` 事件生效（否则 WASD 没反应）。这一点如果触发失败，会被误判为「游戏卡住」。
3. **Canvas 3D 场景加载需要时间（~5s）**：每次进入关卡要 `browser_wait_for({selector: 'canvas', timeout: 15})` 再动手。
4. **本计划不引入任何新依赖**。已有 Playwright/Vitest（tests/e2e）用于回归，但本计划不用它们，用内置 TRAE-browseruse 即可。
5. **如果 3 关都一次性通关了**（小概率）：文档 1 记录「通关截图 + 每关得分 + 每阶段步数 + 每关最少步数路径」；文档 2 把「可复用经验」按「通关路径」反推为 E2E 测试规范（用于后续 `tests/e2e/*.spec.ts`），不会白做。

---

## 4. 风险处理

| 风险 | 概率 | 缓解措施 |
|---|---|---|
| 自动化代理 3D 键盘事件收不到（canvas 没 focus） | 中 | 进入 canvas 前先 `browser_click` canvas 元素（或 `browser_evaluate: document.querySelector('canvas')?.focus() + canvas.requestPointerLock?.()`） |
| E2E API 挂不上 → 无法读内部状态 | 中 | 回退到 `browser_evaluate: window.useGameStore_unstable = useGameStore`（从 module import 路径抓）或直接读 DOM HUD 上的文字状态做黑盒判定 |
| 三关全通了，没 bug 可修 → 产出不足 | 低 | 重点产出「最少步数通关路径 + 每关阶段机的真值表」（作为后续新关卡 authoring 的 golden 模板） |
| 某关卡 5 次重复玩都在同一阶段卡死 | 低（说明 bug 稳定） | 切「手动构造状态 + 单元测试」路径：写一个 `vitest` case，构造 entities ctx，调用 predicate/阶段机 completionCondition 定位哪一项返回 false，截图式贴到文档 1 |
| 3D 视角问题：agent 看不到物品位置 | 中 | 用 E2E API `getEntities()[i].{currentRoom, position}` 直接拿坐标，然后 `moveTo` 走到物品附近（避免迷路） |

---

## 5. 验收标准（计划执行完毕的 Definition of Done）

满足以下 5 条即视为本计划验收通过：
1. ✅ 三份公开关卡的「实玩证据链」都存在（至少 1 次完整尝试 + 截图 + 状态快照）
2. ✅ 每关都二进制明确标记：通关 / 未通关（不能模糊）
3. ✅ 文档 1 对所有「未通关关卡」给出了证据链 + 根因分类（A/B/C 三类之一）
4. ✅ 文档 2 对所有根因给出了「可落地的修复建议」（代码类：含可应用 patch 片段；交互/设计类：含 UI 改法描述）
5. ✅ 文档 2 最后有一节「可复用 Lessons Learned」，至少 5 条独立的跨关卡通用经验。
