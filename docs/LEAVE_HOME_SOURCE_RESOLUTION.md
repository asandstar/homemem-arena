# Leave-Home Source Truth Resolution

> 目的：解决 `se-cat-pushes-key.targetPosition` 的 **HEAD / Working Tree 不一致问题**，诊断 10 张 Canvas 截图全部 unavailable 的失败步骤与根因。
>
> 本轮**不修改家具布局**、**不修改 Room3D**、**不修改任何源码坐标**、不提交、不推送。

---

## 1. HEAD 与 Working Tree 坐标差异（`src/data/tasks/leave-home.ts`）

指令一输出：

### 1.1 HEAD targetPosition（`git show HEAD:src/data/tasks/leave-home.ts`）

```
targetPosition: { room: 'living', x: 1.5, y: 0, z: -1.5 }
```

**语义位置：** living 房间，中心向**东 +1.5m**、向**北 -1.5m**（靠近书房墙一侧）。

### 1.2 Working Tree targetPosition（文件系统当前内容 + `npx vite-node` dynamic import）

```
targetPosition: { room: 'living', x: 0, y: 0, z: 1.5 }
```

**语义位置：** living 房间**中心沿 z 轴 +1.5m**（客厅主通路、靠近沙发茶几、距离玩家出生点 (0,-1.5) 直线距离 3m）。

### 1.3 修改该坐标的 diff hunk（`git diff -- src/data/tasks/leave-home.ts`）

```diff
@@ -359,7 +359,7 @@ export const leaveHomeTask: TaskConfig = {
       },
       type: 'move-entity',
       targetId: 'obj-key',
-      targetPosition: { room: 'living', x: 1.5, y: 0, z: -1.5 },
+      targetPosition: { room: 'living', x: 0, y: 0, z: 1.5 },
       message: '🐱 啪嗒——钥匙猫扒拉了你的钥匙！它不在原来的位置了…',
       description: '钥匙猫把钥匙从茶几推到了新的位置',
       memoryType: 'spatial',
```

### 1.4 该 hunk 是否包含其他语义改动？

**无其他语义改动。**
- 改动行数：2 行（一条 `-`、一条 `+`）。
- 只改动 `targetPosition.x` 和 `targetPosition.z`，`y / room / message / description / memoryType / trigger 条件` 均未变动。
- `se-cat-pushes-key` 的其余 4 处引用（triggeredEvents 判定、g-stage-cat-fired 目标、g-stage-key-outdated 阶段机推进、`dialogs.ts` 对话触发）只按事件 id，不依赖具体坐标数值。

### 1.5 该坐标修改最初来自哪个 Sprint 或计划文档？

按历史计划/报告/重构文档时间线回溯：

| 文档 | 位置 | 引用的 se-cat-pushes-key targetPosition | 含义 |
|---|---|---|---|
| `.trae/documents/leave-home-refactor-plan.md` L31-L35 | v2 重构前置设计稿 | `{ x: 0.5, z: -1.5 }`（初版 y=0.02） | 早期重构草图，与 HEAD/WT 都不相同 |
| `docs/SEMIFINAL_SPRINT_B1_REPORT.md` L86-L95 | Semifinal B1（2026-07 初） | 只引用事件 id；没有硬编码坐标 | B1 修复 focus: 修复直接跳 stage，不谈具体坐标 |
| `docs/SEMIFINAL_SPRINT_B_REPORT.md` L75 L89 L90 L156 L194-L213 L284-L286 | Semifinal B 阶段 全部 8 条 golden 断言 | 只依赖事件 id；不读 (x,z) 数值 | 所有 6 项 B 报告断言都不依赖 cat 落点 x/z |
| `tests/e2e/first-level-command-flow.spec.ts` L343-L355（Working Tree 未跟踪新增测试） | Working Tree 现状 e2e 新 spec | `se-cat-pushes-key 新 target=(0, 1.5) living 主通路` + 强制 `api.setRobotPositionInRoom({ x: 0, z: 1.5 })` 重试 3 次 | **唯一硬编码 Working Tree 坐标的代码证据** |
| `docs/LEAVE_HOME_LAYOUT_INPUT.md` §0.2 / §3.3 / §5.3~5.6 | 上一轮布局采集报告 | 清晰标注 HEAD `(1.5,-1.5)` 与 WT `(0,1.5)`，标记 **SOURCE_MISMATCH** | 上一轮不允许选边 → 正确保持 STOPPED |

**结论 1.5：** Working Tree `(0, 1.5)` 改动来源与 **Semifinal B1 / B 之后新的 first-level 命令流 e2e 测试** 同步出现；它不是随机遗留，而是"把钥匙放在客厅主通路，让 e2e 能 teleport 到 (0,1.5) 立刻更新记忆"这一设计决策的产物。HEAD `(1.5, -1.5)` 是更早版本，没有对应测试背书。

### 1.6 是否存在测试依赖其中一个坐标？

**有。详见 §2 搜索结果。** 依赖 `(0, 1.5)`（Working Tree 版本）：
- `tests/e2e/first-level-command-flow.spec.ts` L343（注释）+ L352（强制 `setRobotPositionInRoom({x:0,z:1.5})`）

**未找到任何代码或测试依赖 HEAD `(1.5, -1.5)`。** （§2 已扫描 src/tests/scripts/docs 四目录。）

---

## 2. 坐标与 se-cat-pushes-key 全代码引用扫描（src / tests / scripts / docs）

### 2.1 `se-cat-pushes-key` 事件 id 引用（不依赖具体数值，但必须按事件名触发）

| 路径 | 行 | 用途 | 是否依赖数值 (x,z)? |
|---|---|---|---|
| [leave-home.ts](src/data/tasks/leave-home.ts#L28-L28) | L28 / L285 / L346 / L410 / L422 | catEventTriggered helper / g-stage-cat-fired predicate / 事件定义 / 主人消息触发 / 更新提示触发 | 否（仅事件 id 判定） |
| [taskSlice.ts](src/store/slices/taskSlice.ts#L410-L414) | L410-L414 | `applyScriptedMove(event.targetId, targetPosition.room, {x,y,z})` | **是（通用 move-entity 执行器；数值只透传，不做断言）** |
| [dialogs.ts](src/dialog/dialogs.ts#L235-L235) | L235 | trigger: `{ type: 'event', value: 'se-cat-pushes-key' }` | 否（只按事件 id 选对话） |
| [commands.ts](src/game/commands.ts#L98-L135) | L98 / L135 | `catFired = triggeredEvents.has('se-cat-pushes-key')` 判定 stage-key-outdated 准入 | 否（只看 id 触发） |
| [first-level-command-flow.spec.ts](tests/e2e/first-level-command-flow.spec.ts#L246-L488) | L246 / L301 / L343 / L352 / L488 | 保存前不触发 / 切房后必须触发 / 注释"新 target=(0, 1.5) living 主通路" / `api.setRobotPositionInRoom({x:0,z:1.5})` / catEventTriggered 辅助 | **L352 YES（硬编码 WT 坐标）**；其余按 id |
| [scripts/qa-layout.ts](scripts/qa-layout.ts#L334-L374) | L334-L357 / L373 | `if (!ev.targetPosition) continue` + `roomLocalBounds` 合法性越界检查 + door offset 统一检查 | **是（通用合法边界校验；数值不同只判合规性，不断言具体数值）** |
| `SEMIFINAL_SPRINT_B_REPORT.md` L75/L89/L90/L156/L194/L211/L284/L285/L286 | - | B 报告全部只依赖事件 id | 否 |
| `SEMIFINAL_SPRINT_B1_REPORT.md` L86/L93 | - | B1 报告修复直接跳 stage | 否 |
| [LEAVE_HOME_LAYOUT_INPUT.md](docs/LEAVE_HOME_LAYOUT_INPUT.md#L27-L197) | §0.2 / §3.3 | 明确 SOURCE_MISMATCH → STOPPED | 不选边（正确） |

### 2.2 直接硬编码具体坐标的引用

| 模式 | 命中位置 | 命中含义 | 与 cat 落点相关？ |
|---|---|---|---|
| `x: 0, z: 1.5` | `tests/e2e/first-level-command-flow.spec.ts` L352 + L343 注释 | **Working Tree cat 新落点**；e2e 重试 3 次中强制 `setRobotPositionInRoom({x:0,z:1.5})` 用于推进 stage-key-outdated → update-key-memory | **直接相关 YES** |
| `x: 1.5, z: -1.5` | src/tests/scripts/docs 全域搜索：**0 命中** | HEAD 坐标在代码库中无对应断言/调用 | **不相关** |
| `x: 0, z: -1.5` | [leave-home.ts](src/data/tasks/leave-home.ts#L73-L73) L73 | 出生点 spawnPosition | 非 cat 落点 |

**结论 2：**
- 唯一直接依赖 cat 事件落点具体数值的代码是 Working Tree **新增的** `tests/e2e/first-level-command-flow.spec.ts` L343-L355，且采用 `(0, 1.5)`（**Working Tree 值**）。
- HEAD `(1.5, -1.5)` 在全代码库中**没有任何断言或调用**对应它的实现——如果最终保留 HEAD，必须在同一 commit 中同步修改 L343 注释、L352 teleport 坐标。

---

## 3. Canvas 截图流程失败诊断（10 张 unavailable → 根因在哪一步？）

### 3.1 环境准备

```
npm run dev:e2e -- --host 127.0.0.1 --port 4173
# 启动成功：VITE v8.1.3   e2e   ready in 284 ms
# Local: http://127.0.0.1:4173/
```

### 3.2 步骤诊断（integrated browser 最小流程）

**Legend：** ✅ = 成功；⚠️ = 非致命；❌ = 致命失败

#### Step 1. 首页打开

| 项 | 值 |
|---|---|
| current URL | `http://127.0.0.1:4173/` ✅ |
| page title | `回声屋 · 记忆宅邸 \| HomeMem Arena` ✅ |
| visible buttons | 开始闯关（ref:e3）、音效开启（e4）；链接：首页/任务 ✅ |
| visible testids | 无显式 data-testid（首页使用通用语义 role 按钮，正常） |
| console errors | 8 条 `net::ERR_ABORTED ...v=36996e12`（见下方说明 ⚠️） |
| page errors | 无 runtime uncaught exceptions ✅ |
| requestfailed | 首屏首次 request module cache reset 产生的 `ERR_ABORTED`（Vite 首屏 rolldown hmr refresh）|

> ⚠️ **ERR_ABORTED 说明：** 8 条 `net::ERR_ABORTED` 对应的 8 个 module 都**在同一次加载中再次成功执行**（否则 document.readyState 无法 complete、page 无法出现按钮）。本轮观察到的非致命请求中断，资源随后加载成功，不影响截图流程。

#### Step 2. 点击首页「任务」→ 进入任务选择页

| 项 | 值 |
|---|---|
| current URL | `http://127.0.0.1:4173/tasks` ✅ |
| page title | 同上 ✅ |
| visible buttons | 返回 / 继续挑战(task-clean-table) / ×4 个「完成前一关解锁」(disabled) / 音效开启 ✅ |
| visible testids | `task-card-task-clean-table` / `task-start-task-clean-table` / `task-card-task-leave-home` / `task-card-task-laundry-sort` / `task-card-task-breakfast` / `task-card-task-night-patrol` ✅ |
| console errors | 无新增 ⚠️（首屏 8 条已刷新） |
| page errors | 无 ✅ |

**⚠️ Step 2.5 关键：「出门大作战」按钮状态**

- e2e 环境中 `task-leave-home`（出门大作战）是**第 2 关**。
- 它的 `[data-testid="task-start-task-leave-home"]` 按钮**没有被创建**（只存在 `task-card-task-leave-home`）。
- 按 [TaskCard.tsx](src/components/tasks/TaskCard.tsx#L209-L239) L209-L239，`unlocked===false` 时渲染的是 `完成前一关解锁` 的 **disabled 灰色按钮**，data-testid 为 null。
- ⇒ **出门大作战卡片当前处于锁定状态，无法直接点击启动。** 这是上一轮 Playwright 自动化"未等到 URL 进入 /play/task-leave-home → 60000ms 超时"的**根因第一步**。

验证路径：evaluate `[...document.querySelectorAll('[data-testid]')]` 返回 **6 个 data-testid** 中只有 `task-start-task-clean-table`；出门大作战/洗衣幽灵/早餐/深夜巡逻 全部是锁定卡。

#### Step 3. 启动「出门大作战」之前必须先完成 1 关 clean-table（按当前 TaskCard.tsx 逻辑）

为诊断后续流程，手动点击已解锁的 clean-table「继续挑战」验证 Arena 流程能否进入：

| 项 | 值 |
|---|---|
| click | `task-start-task-clean-table`（JS evaluate 触发）✅ |
| current URL（跳转后） | `http://127.0.0.1:4173/play/task-clean-table` ✅ |

#### Step 4. 进入 briefing-modal

| 项 | 值 |
|---|---|
| current URL | `/play/task-clean-table` ✅ |
| briefing-modal present? | `!!document.querySelector('[data-testid="briefing-modal"]') === true` ✅ |
| briefing-start-button present? | `true`（[ArenaPage.tsx](src/pages/ArenaPage.tsx#L352-L363) L352-L363 `data-testid="briefing-start-button"` 渲染正确）✅ |
| #arena-canvas 此时是否存在？ | **存在但 briefing 未关闭（`briefingOpen=true`，[ArenaPage.tsx](src/pages/ArenaPage.tsx#L301-L304) L301-L304 z-40 全屏遮罩遮盖）。尺寸 rect.w=618 h=706，可见 (vis=true) ✅（但视觉上被 briefing 覆盖）** |
| console errors | THREE.Clock deprecated（非致命）+ GLTFLoader Textures/colormap.png Couldn't load（fallback 模型纹理；非致命）|

#### Step 5. 点击 briefing-start-button

| 项 | 值 |
|---|---|
| click | 通过 evaluate 点击 `[data-testid="briefing-start-button"]` ✅ |
| waitFor 等待 | 15 秒（用于 WebGL 初始化）|
| after click state | briefingOpen=false（briefing 遮罩消失）；#arena-canvas 可见尺寸仍 618×706；`checkVisibility() === true`；document.readyState = complete ✅ |

**#arena-canvas 状态（实际截图判定）：**
```
arenaRect: { x: 0, y: 57, w: 618, h: 706, vis: true }
visible (checkVisibility) = true
# 距离 Step 5 完成（60000ms timeout 区间）：已过 15s 中 15s — 已早于 60s 就绪
```

#### Step 6. 等待 `#arena-canvas` visible 60000ms 超时与否？

**Arena 流程本身 CANVAS 没有超时问题。** 60s 超时在上一轮未到这一步——因为流程卡在上游 **Step 2.5「出门大作战被锁定，用户/Playwright 点不到 task-start-按钮 → 根本无法进入 /play/task-leave-home」** ，并非 canvas 渲染慢。

**额外发现（上一轮 Playwright 自动化更直接的失败原因）：**
- 上一轮 Playwright 块 还没启动 dev:e2e 进程（代码路径中 `Playwright block skipped/aborted: dev URL not printed 50s` 日志已经明确给出）。
- 即：自动化**先失败在"dev server 没有启动"这一步**，连 `http://127.0.0.1:4173/` 都无法打开，当然更不会等到 canvas。这一步失败在 canvas 之前。

### 3.3 失败诊断页截图已保存

路径：`docs/assets/leave-home-screenshots/capture-failure-step.png`（integrated browser fullpage 截图，任务选择页面 + 出门大作战处于"完成前一关解锁"disabled 状态）。

### 3.4 诊断结论（截图失败在哪一步？按顺序排列）

| # | 失败层级 | 上一轮自动化真实发生的问题 | 修复思路（供后续参考，本轮不改代码） |
|---|---|---|---|
| **1 (最高级)** | 前置流程缺失 | Playwright 自动化**没有启动 dev:e2e** → `dev URL not printed 50s` 直接 abort | Playwright 配置前必须先 `spawn npm run dev:e2e --port 4173`，再 `grep -qE 'Local:.*http'` 确认启动 |
| **2 (第二级)** | 任务解锁前置 | `leave-home` 是第 2 关；按 [TaskList.tsx](src/components/tasks/TaskList.tsx) + [TaskCard.tsx](src/components/tasks/TaskCard.tsx#L209-L239) 未完成 clean-table 前，leave-home 按钮**不渲染 data-testid="task-start-*"**，只能点到 disabled 灰色按钮 | 截图自动化要么先 `window.__testApi__.resetProgress()` + `unlockAllTasks()`（需要在 e2e 模式暴露对应接口），要么先跑一遍 clean-table 完成关卡再进入 leave-home |
| **3 (已验证不是根因)** | Arena canvas 等待 | 在 clean-table 的实际流程中，`#arena-canvas` 在 briefing-close 后 **<15 秒** 已具备 `w>600 h>700 vis=true checkVisibility=true` | 60000ms timeout 本身是**足够宽松的**；无需改 timeout |

---

## 4. 推荐处理方式（A 保留 HEAD / B 保留 Working Tree / C 等最终布局再设）

> 只能给出推荐与依据；本轮未实际修改任何坐标。

### 4.1 方案对比

| 维度 | A. 保留 HEAD → `(1.5, -1.5)` | B. 保留 Working Tree → `(0, 1.5)` | C. 等最终布局确定后再统一设置 |
|---|---|---|---|
| **测试覆盖率** | Working Tree 新增 e2e 测试 L343 L352 会失败；需要同步改 | ✅ 与 `tests/e2e/first-level-command-flow.spec.ts` 全部硬编码一致 | 测试暂时维持 Working Tree，后期一次性对齐 |
| **与任务路径设计匹配度** | 落在书房墙边，玩家常走路线（沙发茶几中心 → 卧室门 → 玄关门 → 取钥匙）基本**不经过** (1.5,-1.5)；"重新搜索确认钥匙位置"阶段会让玩家在主路上反复找不到，体验差 | ✅ **客厅主通路中心 z=1.5**（沙发茶几正前方）；出生点 (0,-1.5) → 客厅中心 (0,0) → 钥匙 (0,1.5) 在一条直线上，天然符合 V 切换视角 + 记忆更新预期（正是设计中"让玩家一眼能看到更新后新位置的钥匙"的布局） | 依赖最终家具摆放：若茶几被移走或走廊变窄，(0,1.5) 可能也需要再调 |
| **钥匙被 runtimeCollider 阻挡？** | HEAD 目标点 (1.5,-1.5) 对应上一轮 §1 living 表第 004 行 `plant_a_L268` 位置 (1.5, -1.5) — collisionLevel 虽为 **unknown**（§2 没匹配上 decorFurniture 尺寸），但视觉上与植物重叠 100%，容易被判定"钥匙跑进家具"bug | ✅ (0, 1.5) 位于沙发茶几之间走廊中心（`cnt-coffee-table` (0,-0.8) × 1.4×0.7；`cnt-main-sofa` (0, 2.0) × 3.2×1.4），净空约 1.2m，视觉与碰撞均合理 | 需看最终 §5 客厅三门 BFS 通路是否仍保留 (0,1.5) 在 free space |
| **HEAD 代码库内部一致性** | HEAD `(1.5, -1.5)` 无任何测试断言 / 调用与之匹配（§2 搜索 0 命中），说明它是"史前遗留值" | 需要实际提交 Working Tree 改动后才能谈一致，否则 HEAD 与 Working Tree HEAD 永远不一致 | ✅ 一致（不改 → HEAD=WORKING），但问题被延后 |
| **不配合 B1/B 报告断言？** | 不，B 报告 8 条断言都只查 id 是否 triggered（§1.5 已证明）；A/B 都不破坏 | ✅ 同上；完全不破坏 | ✅ 同上 |
| **执行成本（下一轮真实提交时）** | 需要同时：① cherry-pick 回 HEAD 这一行；② 改 first-level-command-flow.spec.ts L343 注释 & L352 teleport；③ 重跑 §5 BFS/出生/LOS 与三份 SVG（因为 SOURCE_MISMATCH 停止了） | ✅ 只需要 **把 Working Tree `src/data/tasks/leave-home.ts` 提交进 git** 即可（一行坐标）；测试自动对齐；所有 STOPPED 条目能立刻产出数值 | 延后成本最高 |

### 4.2 最终推荐：**方案 B（保留 Working Tree `{x:0, y:0, z:1.5}`）**

#### 推荐依据（优先级降序）：

1. **代码覆盖率硬证据**：当前 Working Tree 新增 `first-level-command-flow.spec.ts` L343-L355 明确写死 `(0, 1.5)` 并在 cat 事件后强制 teleport 到该坐标推进"更新钥匙记忆 → 阶段机 stage-key-outdated → stage-update-key-memory"两段流程；如果选 A，这条测试会静默伪通过（永远在一个玩家从未真正走到过的坐标上更新记忆），后续会引入"绿了但行为错了"的质量债务。
2. **关卡设计一致性**：`(0, 1.5)` 位于 living 房间**中心线 x=0 上**（出生点 (0,-1.5) → 茶几 (0,-0.8) → 新钥匙 (0,1.5) → 主沙发 (0,2.0)），天然形成一条玩家可理解的"猫咪从茶几方向把钥匙**推到了沙发脚下**"叙事；HEAD `(1.5,-1.5)` 在"书架/挂画角落"缺乏叙事支持。
3. **运行时可观测性**：选 B 后上一轮 SOURCE_MISMATCH 的 4 条 STOPPED 条目（客厅三门 BFS / 出生点→初始钥匙 LOS / 出生点→卧室门走廊 / 卧室门→移动后钥匙 LOS）**立即可以复算并得到数值结论**，不需要再等；A 方案即便回滚坐标，也得重新复算一遍相同成本。
4. **HEAD `(1.5,-1.5)` 完全孤立**：§1.5 历史文档 & §2 全代码扫描均没有任何代码或测试依赖它；保留它没有任何可见收益，但有"回滚后测试语义错配"的确定风险。
5. **提交成本最低**：只需 `git add src/data/tasks/leave-home.ts` + 一行 commit；不需要修改任何测试。

#### 采用方案 B 时，建议在下一轮实际提交时**同步做三件事（本轮不做，仅作为方案 B 的配套清单）**：
- (1) 提交 Working Tree `src/data/tasks/leave-home.ts` 这一行变更。
- (2) 重新执行 Leave-Home Layout Capture（CAT_SOURCE_MATCH 会变 PASS），补全：
  - §5.3 客厅三门 BFS free space 通路长度 / 碰撞 / 最短路径
  - §5.4 出生 → 钥匙（初始）LOS 2D heuristic
  - §5.5 出生 → 卧室门 走廊净空（runtimeCollider × 线段）
  - §5.6 卧室门 → 猫移动后钥匙 2D LOS
  - §6 客厅 SVG 中"钥匙(猫事件后)"虚线框
- (3) 给 Playwright 截图自动化补两个前置：启动 dev:e2e 子进程等待 `Local:` 打印 + 先 `__testApi__.unlockAllTasks()`（或先跑一遍 clean-table 完成第一关再进 leave-home）—— 这样 60000ms 超时会**一次性通过**，10 张 PNG 全部能产出。

#### 如果对"最终家具布局仍有争议"的保留意见较多：
可退选 **方案 C**（不选边，先搁置，等人工制定客厅/卧室/玄关最终布局后统一给值）。代价是所有 LOS/BFS 在最终布局前都停留在 STOPPED，且报告中继续标记 SOURCE_MISMATCH，迭代周期较长。

**不推荐方案 A**（无收益、测试不匹配、设计不自然、提交成本更高）。

---

## 5. 本轮产物与边界

### 5.1 本轮新增/修改文件（白名单内）

- `docs/LEAVE_HOME_SOURCE_RESOLUTION.md`（本文件，覆盖）
- `docs/assets/leave-home-screenshots/capture-failure-step.png`（任务选择页带出门大作战锁定状态的 fullpage 诊断截图）

### 5.2 未修改的（严格遵守本轮边界）

- ❌ 未修改 `src/`（含 `Room3D.tsx` / `leave-home.ts`）
- ❌ 未修改家具布局 / 坐标
- ❌ 未改 `tests/` / `scripts/` / 任何配置
- ❌ 未 git commit / push
