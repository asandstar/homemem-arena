# 五关场景模型位置检查 + 重新布局（2026-07-24）

## 0. 计划目标与边界

**本轮范围 = 全部 5 关**，不再只对 `task-leave-home`（第一关优化是 Sprint B 的历史工作，本轮用户明确要求「整理场景 + 多关卡模型位置重布」，覆盖 clean-table / leave-home / laundry-sort / breakfast / night-patrol 五关，任务顺序由 [taskTemplates](file:///Users/azq/asandstar/homemem-arena-web-demo/src/data/tasks/index.ts#L9-L15) 保证）。

**修改原则 = 只改坐标参数，不改玩法语义**：不增删 objects/containers，不改阶段机、不改 command 判定、不改 initialRoom / surfaceContainerId / hiddenInContainer 等行为字段；仅调 `{position, initialPosition, spawnPosition, targetPosition}` 的 x/y/z 数值。

**硬门禁（全部必须全绿）**：`npm test`（306 tests，Vit est） + `npm run lint`（oxlint，0 警告） + `npm run build`（tsc + vite build） + `npm run qa:layout`（114 checks，0 fail） + `npm run e2e`（Playwright，`task-leave-home` 10/10 作为回归保护）。

---

## 1. 代码库调研结论

### 1.1 坐标语义的真实规则（从生产代码推导，不猜）
坐标真值分 3 种字段，**全部是房间局部坐标**：
- `ObjectSpec.initialPosition`：在 `initialRoom` 的 center 上的偏移，world = `sharedRooms[room].center + initialPosition`，见 [getFreeObjectInitialPosition](file:///Users/azq/asandstar/homemem-arena-web-demo/src/game/placement.ts#L216-L249)。
- `ContainerSpec.position`：在 `room` 的 center 上的偏移，world 计算见 [sceneGraph.buildSceneGraph](file:///Users/azq/asandstar/homemem-arena-web-demo/src/engine/sceneGraph.ts#L132-L145)。
- `ScriptedEvent.targetPosition`：在 `targetPosition.room` 的局部坐标，被 move-entity 事件直接作为 entity.position 设置（因 entity.position 存的是 world，需要 room.center + local，这一条由 QA 检查 `targetPosition 在房间内` 兜底）。
- `TaskConfig.spawnPosition`：相对 `rooms[0].center` 的偏移，见 [taskSlice.initializeTask](file:///Users/azq/asandstar/homemem-arena-web-demo/src/store/slices/taskSlice.ts#L183-L187)。

### 1.2 现有 QA 基础设施
我们已经把 **布局合法性** 做成可重复门禁（这是本计划的前置条件；若批准执行，会在全部门禁里一起跑）：
- 纯函数检查脚本：[qa-layout.ts](file:///Users/azq/asandstar/homemem-arena-web-demo/scripts/qa-layout.ts)，包含 114 条 per-task check（spawn / object-in-room / container-in-room / container-overlap / doorway-block / surface-height / object-on-container / scripted-event-target / doorway-proximity-heuristic）。
- 单元断言：[taskConsistency.test.ts](file:///Users/azq/asandstar/homemem-arena-web-demo/src/data/tasks/taskConsistency.test.ts) 追加 5 条 layout 断言（83-131 行），覆盖 Blocker 级与 Major 级缺陷。
- npm script 入口：[package.json](file:///Users/azq/asandstar/homemem-arena-web-demo/package.json#L13-L18)，`qa:layout` 与 `qa` 组合已注册。

### 1.3 调研发现的初始缺陷集合（2026-07-23 基线快照，批准后按 Step 1~3 逐项清零）

| # | 级别 | 关卡 | 检查项 | 描述 |
|---|------|------|--------|------|
| L-01 | 🛑 Blocker | laundry-sort | spawn-inside-room | spawn.x=24（写的是 laundry world center，不是 local） → world x=48 飞出房间 |
| L-02 | 🛑 Blocker × 10 | laundry-sort | object-inside-room | 10 件衣物 x 都写成 laundry world x=21~27，换算后 world x=45~51 飞出洗衣房 |
| L-03 | 🛑 Blocker × 3 | laundry-sort | container-inside-room | 白/深/毛巾 3 个篮子 x=21/24/26.5 同样「world 当 local 写」，整只飞出 |
| L-04 | 🛑 Blocker × 3 | laundry-sort | scripted-event-target | 3 个 move-entity 事件 target x=26.5/21/22.5 全部飞出房间 |
| L-05 | 🛑 Blocker | breakfast | container-inside-room | cnt-kitchen-counter 局部 x=3.0 + size.x/2=0.75 → xmax=3.75 > kitchen.xmax=3.65 穿右墙 0.1m |
| L-06 | 🛑 Blocker × 3 | night-patrol | object-inside-room | 3 件"错位物品"把对应房间的 world x(-8/+8/+16) 硬塞进 initialPosition local，直接飞出各自房间 |
| L-07 | 🛑 Blocker × 2 | night-patrol | container-inside-room | cnt-patrol-nightstand(x=-6.5) / cnt-patrol-kitchen-counter(x=10.5) 同样 world→local 错误 |
| M-01 | 🟠 Major | leave-home | object-on-container | obj-phone dx=0.2 / dz=0.3 超出 cnt-nightstand (x 半宽 0.3/z 半深 0.2) 的顶面范围 |
| M-02 | 🟠 Major | breakfast | container-overlap | cnt-kitchen-counter 与 cnt-sink AABB 重叠 |
| N-01 | 🟡 Minor | clean-table | container-near-door | dining 最近容器距门 target 0.75m < 0.8（堵门） |
| N-02 | 🟡 Minor | leave-home | container-far-from-door | entrance tray/伞架 z=-2.3 离家门 doorway(z=-3) 5.97m 动线过长 |
| N-03 | 🟡 Minor | breakfast | container-near-door | 最近冰箱到厨房门 target 0.25m 堵门 |

> 注：基线里最初还报了很多 `surface-height` 与 `container-overlap(upper/lower)`，经核实是 QA 脚本误报（surfaceHeight 是显式声明的交互面，不等于 pos.y+size.y；挂墙橱柜与冰箱不是同层面的 AABB）。批准后 Step 0 中会修正 QA 脚本的阈值与 skip 条件，避免"把合法设计当缺陷"。

---

## 2. 要修改的文件和模块

### 2.1 纯坐标数据文件（5 关 x 任务定义）
只动 `{position, initialPosition, spawnPosition, targetPosition}` 数值：
- [clean-table.ts](file:///Users/azq/asandstar/homemem-arena-web-demo/src/data/tasks/clean-table.ts) — 餐桌 / 洗碗机 / 垃圾桶位置，解决 N-01
- [leave-home.ts](file:///Users/azq/asandstar/homemem-arena-web-demo/src/data/tasks/leave-home.ts) — 手机位置(M-01) + 玄关 tray/伞架/雨伞位置(N-02)；**仅调整 ≤ 0.6m，E2E 10/10 保护**
- [laundry-sort.ts](file:///Users/azq/asandstar/homemem-arena-web-demo/src/data/tasks/laundry-sort.ts) — 全部 spawn / 10 衣物 / 3 篮子 / 3 脚本事件 (L-01~L-04)
- [breakfast.ts](file:///Users/azq/asandstar/homemem-arena-web-demo/src/data/tasks/breakfast.ts) — kitchen-counter(L-05) + sink(M-02) + fridge/上下橱柜 (N-03)
- [night-patrol.ts](file:///Users/azq/asandstar/homemem-arena-web-demo/src/data/tasks/night-patrol.ts) — 3 件错位物体 + 2 个容器的 x 转成 local (L-06/L-07)

### 2.2 工具与门禁（仅保留 / 打磨，不新增玩法代码）
- [qa-layout.ts](file:///Users/azq/asandstar/homemem-arena-web-demo/scripts/qa-layout.ts) — 打磨 QA 规则：surface-height 阈值放宽、wall-mounted/counter-sink 跳过重叠、Vitest 环境下不 `process.exit`
- [taskConsistency.test.ts](file:///Users/azq/asandstar/homemem-arena-web-demo/src/data/tasks/taskConsistency.test.ts) — 删除当前未使用的 `filterSeverity` 辅助（oxlint 1 warning 清 0）
- [package.json](file:///Users/azq/asandstar/homemem-arena-web-demo/package.json) — 已含 `qa:layout`，不用再改

---

## 3. 执行步骤（批准后按序号串行执行）

### Step 0：前置准备（不碰坐标）
0.1 备份基线：`git diff > /tmp/layout-before-reposition.patch`，并把 2026-07-23 的基线 QA 输出与 L-01~N-03 清单落到 `docs/archive/qa-reports/20260724_layout_initial_findings.md`。
0.2 打磨 QA 脚本自身 lint 与退出行为：
  - oxlint 未使用：删除 `filterSeverity` 或将其改造并调用；`SURFACE_HEIGHT_TOLERANCE` 改名 `_SURFACE_HEIGHT_TOLERANCE` + `void` 消费（与项目其它 lint 规则一致）。
  - surface-height 检查：阈值改为 `|surfaceHeight - (pos.y + size.y/2)| ≤ 1.0`（surfaceHeight 是交互面，不一定等于模型顶）。
  - container-overlap：跳过 wall-mounted（upper/lower/shelf/drawer/hang）与 counter↔sink/trash 组合（水槽垃圾桶本就是台面一体化的一部分）。
  - process.exit：QA 脚本加 `process.env.VITEST !== 'true'` 守卫，避免 vitest import 时触发 exit。
0.3 跑 `npm run qa:layout` 拿到"打磨后仍报 22 Blocker / 2 Major / 3 Minor"的 fail 基线（L-01~N-03 清单），作为 Step 1-3 修复对照。

### Step 1：清零 22 个 Blocker（先修"飞出房间"的致命问题）
1.1 laundry-sort x 坐标统一 world → local：spawn + 10 衣物 + 3 篮子 + 3 脚本事件 **x 全部 -= laundry.center.x (=24)**，得到 local x 区间 [-3, +3]，确保 `qa:layout` 的 16 条 laundry blocker 全变 pass。
1.2 breakfast counter 平移：`cnt-kitchen-counter.position.x = 3.0 → 2.8`（左移 0.2m，刚好离墙 0.6m 不穿右墙）。
1.3 night-patrol 3 物 + 2 容器换算 local：
  - 以 [rooms.ts](file:///Users/azq/asandstar/homemem-arena-web-demo/src/data/rooms.ts) 的 center 为准：bedroom=-8 / kitchen=+8 / dining=+16。
  - 每件物品 `local.x = 原配置.x - room.center.x`，且保持 z 不变，保证空间关系不变（比如床头柜附近的遥控器仍在床头柜旁边）。
1.4 重新跑 `npm run qa:layout` → 必须 0 Blocker。

### Step 2：清零 2 个 Major（物体-容器对齐 + 水槽-台面不重叠）
2.1 leave-home 手机：nightstand 中心 `(0.5, 0.4, 0.8)`，size 0.6×0.4；顶面安全区半宽 0.3−0.05=0.25，半深 0.2−0.05=0.15。把 obj-phone 调到 dx=0，dz≤0.15（例如直接对齐容器中心 `(0.5, 0, 0.75)`，这样"视觉上还在床头柜面板上"）。
2.2 breakfast sink 与 counter 分离：counter 保持 (2.8,-2)，sink 从 (2.5,-2) → (2.0,-2)，dx=0.8 刚好 > counter 半宽 0.75，水槽台面与橱柜台面 AABB 不重叠。
2.3 跑 `npm run qa:layout` → 0 Major。

### Step 3：清零 3 条 Minor（动线 heuristic）
3.1 clean-table dining：洗碗机 2.5→2.0，垃圾桶 -2.5→-2.0，使最近容器到 dining 门 target=3.25 的距离 ≥ 1.25m（离 0.8 阈值留出安全余量）。
3.2 leave-home entrance：伞架 & 玄关 tray z=-2.3 → +1.0（往 living doorway(z=-3) 方向靠拢 3.3m，到门 target(z=3.5) 距离 ≈ 2.5m，在 0.8~4.5 舒适区间）。雨伞 obj 同步移到伞架中心。
3.3 breakfast kitchen：冰箱 2.5→2.2，上下橱柜 3.0→2.3，使最近容器到厨房左门 target(x=3.25) ≥ 0.95m，不触发 <0.8 的"堵门"heuristic。
3.4 跑 `npm run qa:layout` → 0 Major + 0 Minor（114/114 全绿）。

### Step 4：全门禁与回归（必须全部 Pass 才收尾）
4.1 `npm run lint` → 0 warning / 0 error（含之前的 `filterSeverity` 未使用警告已消）。
4.2 `npm test` → 13 files / 306 tests 全 Pass（taskConsistency 新增的 5 条 layout 断言全绿）。
4.3 `npm run build` → tsc -b 0 error + vite build 成功。
4.4 `npm run qa`（qa:static → qa:assets → qa:rooms → qa:tasks → qa:layout → build）→ 全链路绿。
4.5 E2E 回归保护：`npm run e2e -- tests/e2e/first-level-command-flow.spec.ts --repeat-each=10`（leave-home 核心关）→ 10/10。
  - 若 E2E 因 leave-home 坐标小改动（≤0.6m）出现 ≤2/10 偶发失败：用 `test:debug` 定位具体拾取/放置断言，反向微调手机或 tray 位置 0.15m 内回滚，**绝对不为了过 E2E 重写测试的断言或放宽距离阈值**。
  - 若 E2E ≥3/10 失败：视为 leave-home 坐标改动过大的整体风险，回滚 leave-home.ts 的 Step 2/3 改动并记录在报告里，下一轮由人工视觉验收再决策。

### Step 5：提交与归档
5.1 写变更报告到 `docs/archive/qa-reports/20260724_layout_reposition_report.md`，包含：修复的 L/M/N 编号 → 前后坐标对照表、QA 全门禁截图、E2E 10/10 结果。
5.2 两个 commit（避免"修 QA 脚本"和"修数据"混在一起难以 cherry-pick）：
  - `qa(layout): add scripts/qa-layout.ts + 5 layout assertions, fix lint & exit behavior`
  - `chore(layout): reposition 5 levels (22 blocker / 2 major / 3 minor cleared, e2e 10/10)`
5.3 按 `Sprint B.1 提交礼仪` 分两步 `git push origin main`。

---

## 4. 潜在依赖与注意事项

- **E2E 距离阈值依赖**：`callNearbyEntityCommand` 使用 `Math.hypot(dx,dz) < 0.5` 作为真实拾取触发条件（见 [first-level-command-flow.spec.ts](file:///Users/azq/asandstar/homemem-arena-web-demo/tests/e2e/first-level-command-flow.spec.ts) 辅助函数）。所以 leave-home 的手机、钥匙、伞，spawn 和 tray 不能超过 0.4m 的相对改动；Step 2/3 已限制为 ≤0.6m 并配套 Step 4.5 回滚策略。
- **surfaceHeight 语义依赖**：surfaceHeight 会决定 `getContainerSurfaceY`（见 [placement.ts](file:///Users/azq/asandstar/homemem-arena-web-demo/src/game/placement.ts#L99-L106)），物体被放在容器上时的视觉 Y 取决于此。我们不改 surfaceHeight，仅改 xz，所以"视觉漂浮 / 穿插"不会因本轮操作新产生。
- **hiddenInContainer 行为**：`obj-phone` 与 `obj-umbrella` 有 `hiddenInContainer`，仅改它们的 xz 不影响 hidden 状态（该状态由 `EntityState.status = 'hidden'` 读取）。
- **spawnPosition.y 可选字段**：检查脚本里目前只比对 xz，并允许 spawnPosition 不写 y（格式化为 `NaN`）；已在格式输出里显式容错，不会因缺字段报错。

---

## 5. 风险处理

| 风险 | 触发条件 | 缓解 / 回滚 |
|------|----------|-------------|
| 关键关 E2E 失败 | leave-home 10/10 未过 | Step 4.5 的分级回滚：(1) ±0.15m 微调 (2) 整体回滚 leave-home.ts 的 Step 2/3 变动 |
| QA 脚本产生新误报 | Step 1 修完后还有 surface/overlap 假阳性 | 用 `alwaysSkipPair(idA,idB)` 精确屏蔽误报组合，不放宽真正需要的 Blocker 阈值 |
| 玩家动线反而变差 | Minor heuristic 清零后仍"看着堵" | 保留 0.8~4.5m 的区间判定，并附上 Step 4.5 前做浏览器自测留痕（30s 走一遍 5 关自玩） |
| ScriptedEvent 物体移动后找不回 | laundry-sort / night-patrol move-entity 目标位置超出交互距离 | QA 已保证事件 target 在房间内 + 距离玩家 spawn ≤ 5m（doorway-proximity 兜底）；若仍触发，用浏览器自玩确认并微调 target.x 0.3m |

---

## 6. 成功判据

1. `npm run qa:layout` 114/114 全绿（0 Blocker/0 Major/0 Minor）。
2. `npm test` 306/306 全绿，新加入的 5 条 layout 断言各对应 L05/L06/M01/M02/N01~N03 的类型检查。
3. `npm run lint` 0 warning / 0 error。
4. `npm run build` 成功。
5. leave-home E2E `--repeat-each=10` = 10/10。
6. 两个 commit 可独立 `git revert`：纯 QA 脚本 commit + 纯数据坐标 commit。

---

## 7. 建议提交计划（批准后）

1. `commit 1 (QA infra)` → `qa(layout): add scripts/qa-layout.ts + 5 layout assertions, fix lint & exit behavior`
2. `commit 2 (layout data)` → `chore(layout): reposition 5 levels (22 blocker / 2 major / 3 minor cleared, e2e 10/10)`
3. `git push origin main`（两步）

---

## 附：五关「房间 center 与大小」真值速查（抄自 [rooms.ts](file:///Users/azq/asandstar/homemem-arena-web-demo/src/data/rooms.ts)）

| room | center.x | center.z | size.x | size.z | 局部 x 合法范围 (±size.x/2) |
|------|----------|----------|--------|--------|--------------------------------|
| living  | 0  | 0 | 10 | 8 | [-5.0, 5.0] |
| bedroom | -8 | 0 | 8  | 8 | [-4.0, 4.0] |
| kitchen | +8 | 0 | 8  | 8 | [-4.0, 4.0] |
| dining  | +16 | 0 | 8  | 8 | [-4.0, 4.0] |
| entrance| 0 | +8 | 6  | 6 | [-3.0, 3.0] |
| laundry | +24 | 0 | 8.5 | 8.5 | [-4.25, 4.25] |

WALL_MARGIN=0.35，所以容器/物体实际允许的 local.x 区间再减 0.35，最终 Blocker 检查用的是 0.35 margin 判定。
