# 计划：五关场景模型位置合理性检查 + 重新布局（Level Layout Review & Reposition）

> 计划生成时间：2026-07-23  
> 触发：用户反馈「很多关卡的场景里模型位置摆放并不合理，检查并重新布局一下」  
> 范围：全部 5 关（clean-table / leave-home / laundry-sort / breakfast / night-patrol）**仅改位置/尺寸/高度等坐标参数**，不改玩法语义、不改 Stage 状态机、不改目标描述。  
> 前置结论：Sprint B/B.1 只动了「出门大作战（第 2 关）」的玩法和 HUD，1/3/4/5 关的场景坐标确实长期未系统性审查 → 本计划就是补这个审查 + 重排。

---

## 一、代码库调研结论（Repo Research Conclusion）

### 1.1 真值源位置（坐标都硬编码，无布局生成器）

| 数据 | 唯一真值源文件 | 存储格式 |
|------|--------------|---------|
| **房间（6 个共享房间）** | `src/data/rooms.ts` | `sharedRooms: Record<RoomId, RoomSpec>` · 每房含 `center / size / doorways[].offset / targetPosition` |
| **任务 spawn / 房间清单 / 时间 / briefing** | `src/data/tasks/{clean-table,leave-home,laundry-sort,breakfast,night-patrol}.ts` 各自 `export const xxxTask: TaskConfig` 顶部 | `rooms: RoomId[]` + `spawnPosition:{x,z}` + `spawnRotation:number` |
| **实体初始位置（关键！）** | 同上 5 关 `entities[]` 数组每项 | `initialRoom: RoomId` + **`initialPosition:{x,y?,z}`**（世界坐标，**非房间局部**）+ 可选 `surfaceContainerId`（放在某容器上）+ `size` + `color` |
| **容器（家具）位置** | 同上 5 关 `containers[]` 数组每项 | `room: RoomId` + **`position:{x,y?,z}`**（世界坐标）+ `size` + **`surfaceHeight`**（物体放在上面时 y 值，常用来算 实体.y = surfaceHeight）+ 可选 `containedIds: entityConfigId[]` 预放物品 |
| **猫脚本 / 事件重置物品位置** | 同上 5 关 `scriptedEvents[]` 每项 `moveEntity` action 内部 | **`targetPosition:{room,x,y?,z}`**（世界坐标） |

### 1.2 现有检查能力（严重缺失！→ 这就是为什么会摆得乱）

- `qa-rooms.ts` 只查：**房间 ID 唯一 / size>0 / 房间 AABB 不重叠 / doorway 指向存在 / 任务房间都在 sharedRooms / Level1/2 硬编码规则**
  - ❌ **完全没检查实体/容器是否在所属房间 AABB 内！**（`checkInsideRoom` 不存在，grep 验证）
  - ❌ 完全没检查容器放在房间里但**压在 doorway 上**
  - ❌ 完全没检查多个容器 AABB 重叠 / 实体 AABB 重叠（空间冲突）
  - ❌ 完全没检查「surfaceHeight 声明 vs 容器 y+size.y」一致性
  - ❌ 完全没检查「实体有 surfaceContainerId 但 initialPosition 不在容器 surface 上方」
  - ❌ 完全没检查 scripted event `targetPosition` 不在目标房间内
  - ❌ 完全没检查 spawnPosition 不在任务 `rooms[]` 任何房间内

### 1.3 快速审计发现的明确问题（抽样，不全）

> 基于 `rooms.ts` AABB = `[center.x ± size.x/2, center.z ± size.z/2]` 验算，先列几条已经可以确定是 Bug 的摆放，证明审查有必要：

| 问题（编号供追踪） | 文件 | 行号位置 | 问题描述（世界坐标 vs 房间 AABB） |
|------------------|------|---------|----------------------------------|
| P-01 | `breakfast.ts` spawnPosition | L18 `spawnPosition: { x:0, z:-1.5 }` | `breakfast.rooms = ['kitchen','dining']`，厨房 center=(8,0,0) 8×8 → z∈[-4,4] x∈[4,12]；餐厅 center=(16,0,0) 8×8 → z∈[-4,4] x∈[12,20]。**x=0 既不在厨房也不在餐厅**，玩家会生成在房间外面。这就是「摆到不合法位置」的典型。 |
| P-02 | `night-patrol.ts` spawnPosition | L19 `spawnPosition: { x:0, z:-1.5 }`，rooms = living/bedroom/kitchen/entrance/dining | 虽在 living 内，但 living 门去 entrance 在 `offset: (0,0,4)` 侧（+z），生成在 -z 侧导致**一进入直接贴着餐厅方向，需走完整间 living 才到玄关入口**，不符合「深夜巡逻从家门往里走」的叙述。 |
| P-03 | `clean-table.ts` rooms | L15 `rooms: ['dining']` | 房间只有 dining（center=(16,0,0) 8×8），但 spawnPosition L19 `x=0 z=-2.5` → **x=0 完全在 dining 外（12~20）**，生成到 living 里。更严重：所有实体 initialRoom='dining' initialPosition `x=-0.6 / 0.6 / 0` → **这些实体都在 living**。 |
| P-04 | `laundry-sort.ts` 容器位置 vs 重叠 | L117 `cnt-laundry-basket-white position=(21,-2.0,z=-2.0) size=(0.8,0.5,0.6)` / L130 `cnt-basket-dark (24,-2) size=(0.8,0.5,0.6)` / L144 `cnt-basket-towel (26.5,-2) size=(0.8,0.5,0.6)` | laundry 房间 center=(24,0,0) 8×8 → z∈[-4,4] OK；但 x: `21 ±0.4=20.6~21.4 / 24±0.4=23.6~24.4 / 26.5±0.4=26.1~26.9` → laundry.x∈[20,28] OK，但是三个篮子都放在 z=-2，且洗衣房 doorway 在 laundry 的 x=-4 侧（x=20 位置）→ 所有篮子集中在**远离门的远端墙面 1 条线上**，玩家要走 4~6m 才能拿到最近的白篮，没有动线合理性。「摆放不合理」的表现。 |
| P-05 | `breakfast.ts` 厨房 4 个容器位置 | `counter / upper-cabinet / dining-cabinet / sink / fridge` 全写 position `x=2.5~3.0`，但 kitchen 房间 center=(8,0,0) 8×8 → kitchen.x∈[4,12]，**x=2.5~3.0 全部在厨房外（living 侧墙根）**！→ 这些家具直接摆到客厅里了，穿墙。 |
| P-06 | `night-patrol` 实体 `obj-cup / obj-umbrella` 等 | L44 `bedroom initialPosition x=-6.5` 刚好在卧室边界 x=-8~0 ✓；L74 `living obj-umbrella (2.5, 0, -2.0)` ✓ 在 living.x∈[-4,4]、z∈[-4,4] 内 OK —— 这一条为正例，说明**不是所有坐标都错，部分是对的**，所以可以先自动化筛选。 |

### 1.4 已有的「可复用规则」（可以直接拿来转成 QA 检查代码 + 布局约束）

- 空间 AABB 算法：`qa-rooms.ts::roomsOverlap` 已实现（L32~L41），可直接泛化做「实体/容器在房间 AABB 内」「两容器 AABB 冲突」
- 房间清单唯一 ID 规则：`qa-tasks` 虽没写 insideRoom 算法，但 taskConsistency 10 tests 的模式可以借鉴（断言式）
- 玩家交互距离：leave-home 阶段机用 `dist(player,key)<0.5` 作为「靠近」，可参考为「实体需要距离玩家可达区域 2m 内」约束
- 容器 `surfaceHeight` 与实体.y：`surfaceHeight` 应该约等于 `container.y + size.y`（允许 ±0.05 容差），这是硬物理

---

## 二、要修改的文件和模块（Files / Modules to Edit）

### 2.1 核心 5 个任务定义文件（99% 改动量在这里，都是硬编码坐标）

按「仅改 initialPosition / position / size / surfaceHeight / targetPosition / spawnPosition，不改语义」原则，5 关各改各自的 `entities[] / containers[] / scriptedEvents[] / spawnPosition`：

1. [clean-table.ts](file:///Users/azq/asandstar/homemem-arena-web-demo/src/data/tasks/clean-table.ts)
   - 修复 P-03：`rooms` / `spawnPosition` 与 dining 匹配（**关键风险：整个关只有 dining，但是 spawn 错到 living、实体坐标全部写成 living 中心附近的 (0, z=-0.3)，要整体做一个坐标平移**：所有写着 dining 的实体/容器 x += 16，把「living 坐标系的 dining 内容」搬到真实 dining 中心点）
   - 验证：改完后 3 实体（spoon/fork/knife 或具体对应 clean-table 的 items）都在 dining AABB x∈[12,20]、z∈[-4,4]，并且在 cnt-dining-table（x=16 中心）表面上
2. [leave-home.ts](file:///Users/azq/asandstar/homemem-arena-web-demo/src/data/tasks/leave-home.ts)
   - **注意：这关坐标在前几轮 Sprint 里实际跑通 E2E 10/10**，只做「微调优化」（让雨伞不再堵门、钥匙不压在 doorway 线上），不要大动以免把已通过的 E2E 跑挂
   - 检查并修正：雨伞衣柜位置、玄关托盘距离 doorway ≥1.2m、客厅钥匙/猫事件震落位置不与沙发/茶几 AABB 重叠
3. [laundry-sort.ts](file:///Users/azq/asandstar/homemem-arena-web-demo/src/data/tasks/laundry-sort.ts)
   - 修复 P-04：三个洗衣篮按「白 → 黑 → 毛巾」由近及远排在**进门侧墙面**（z=+2，门在 x=20 侧，进门向右看即按顺序）；让最近的 basket 在距门 targetPosition (23.25, 0, 0) 步行 1.2m 内
   - 实体（10 件衣物）按类别就近放在对应篮子附近地面，不出现「白袜子放在黑篮 3m 外远处」的反直觉
4. [breakfast.ts](file:///Users/azq/asandstar/homemem-arena-web-demo/src/data/tasks/breakfast.ts)
   - **最高优先级修复 P-01 + P-05**：
     - spawnPosition 从 `(0, -1.5)` → 餐厅 `targetPosition` 侧，例如 `(12.5, 0, 0)`（进门就是 dining）
     - 厨房 5 个家具（counter/upper-cabinet/dining-cabinet/sink/fridge）全部做坐标平移：x += 8，把现在写在 living 的「x=2.5~3.0 厨房区域」平移到**真实 kitchen 中心 x=8** 的 `kitchen.x∈[4,12]` 对应位置，且与 doorway（kitchen.x=-4 侧 = x=4）留 ≥0.8m 过道
     - 麦片盒/牛奶/碗/勺等实体 initialPosition 跟随各自容器平移（y 保持 surfaceHeight）
     - scriptedEvents 里 `se-cereal-to-shelf targetPosition (3.2, 1.5, 0)`（L371）的 x=3.2 也平移到 kitchen 内（加 8 或重算到 upper-cabinet 上方）
5. [night-patrol.ts](file:///Users/azq/asandstar/homemem-arena-web-demo/src/data/tasks/night-patrol.ts)
   - 修复 P-02：spawnPosition 改为 entrance 门内侧 `(0, 0, 6.5)` 区域（「从家门进入」，entrance center.z=8 6×6 → z∈[5,11]），让巡逻叙述一致
   - 检查 4 个分散在 living/bedroom/kitchen/dining 的物件（眼镜/笔记本/零食/雨伞/闹钟？看具体 entities）都在各自房间 AABB 内；脚本事件雨伞震落位置 (L212 `-2.5, 0, 2.0`) 在 living 内 ✓，不改

### 2.2 共享房间（有必要的话，0~1 个改动）

6. [rooms.ts](file:///Users/azq/asandstar/homemem-arena-web-demo/src/data/rooms.ts)
   - 默认**不动房间结构**（6 房整体中心/尺寸已被 5 关依赖，动了会雪崩）
   - 仅当发现某任务根本无法在给定房间 AABB 内摆下所有内容时（如 clean-table 的 dining 理论上 8×8 放 1.8m 餐桌+餐椅 3 件完全 OK，实际不会触发此条件）才最小化调整 size，并同步更新所有 5 关依赖此房的坐标（整体平移）

### 2.3 新增 QA 检查脚本（**必须先写，再改坐标，作为回归守卫**）

7. 新增 `scripts/qa-layout.ts`（或扩展 `qa-tasks.ts`），实现：
   - `isPositionInsideRoom(pos, roomId): boolean`（AABB，给 0.4m 外 margin 防贴墙）
   - `checkAllEntitiesAndContainersInsideRoom(taskId): QaResult[]`（遍历 entities / containers / scriptedEvents.targetPosition）
   - `checkSpawnInsideTaskRooms(task): QaResult`
   - `checkNoContainerOverlapWithinRoom(task, roomId)`（用 qa-rooms 的 roomsOverlap 算法）
   - `checkSurfaceHeightMatches(task)`：容器 `|surfaceHeight - (position.y + size.y)| < 0.06`
   - `checkEntityOnContainerIfSpecified(task)`：entity 有 `surfaceContainerId` 时，其 xz 距容器中心 xz < 容器 size.x/2 - 0.1
   - `checkDoorwayClearance(task, roomId)`：容器 AABB 不与 doorway 矩形（`doorway.offset ± width/2, z方向 ±0.3`）相交
   - 所有检查分 Blocker（越界/穿墙） / Major（重叠/压门） / Minor（动线不合理的 heuristic 告警，非强制）

### 2.4 测试（单元 + 非 E2E）

8. [taskConsistency.test.ts](file:///Users/azq/asandstar/homemem-arena-web-demo/src/data/tasks/taskConsistency.test.ts) 追加 4~6 个断言：
   - 「每个任务所有 entities initialPosition inside initialRoom AABB」
   - 「每个任务所有 containers position inside room AABB」
   - 「每个任务 spawnPosition inside 某 task.rooms」
   - 「脚本事件 moveEntity 时 targetPosition inside 目标 room」
   - （轻量断言：直接调用 qa-layout 暴露的纯函数，不依赖浏览器）

---

## 三、修改步骤（按顺序，可分步提交 ≈ 6 commits）

### Step 0：备份 + 预检（0 改坐标，纯代码 + 跑检查）
1. `git diff > /tmp/layout-before-reposition.patch` 备份
2. 实现 `scripts/qa-layout.ts` 纯函数检查（Section 2.3 列的 7 条）
3. 实现 `taskConsistency.test.ts` 追加断言
4. `npm run qa` + `npm test` → **必然 FAIL**（P-01/P-03/P-05 等 Blocker 会爆出来，作为「基线失败」留证据）
5. 生成 5 关初始问题报告 `docs/archive/qa-reports/20260723_layout_initial_findings.md`（自动脚本输出 + P-01~P-06 人工标级）

### Step 1：紧急修复 P-01 / P-03 / P-05（**这三条是「生成在房间外」的 Blocker，先搞定**）
- Step 1.1 clean-table：`spawnPosition` 修正 + 「rooms=dining」的整体坐标平移 16 m（x→x+16）；3 个餐具保持在 dining-table 表面相对位置不变；4 个容器（餐桌/餐椅/高椅/垃圾桶）一起平移
- Step 1.2 breakfast：所有 kitchen 容器平移 x+8（从 living 侧 x=2.5~3 改到 kitchen 中心附近 x=10.5~11）；spawnPosition 改餐厅入口侧；脚本事件 targetPosition 跟随
- **提交点 1**：`chore(layout): Blocker 修复 - clean-table/breakfast 房间外坐标平移进正确房间`
- 验证：qa-layout 对应 blocker 数量从 ≥3 → 0；`npm test`（新增断言）/ `npm run build` 通过

### Step 2：leave-home 微调（**只改 Minor 动线，不碰关键坐标以免 E2E 变黄**）
- 检查：雨伞衣柜在 bedroom 中不压 living→bedroom doorway；玄关托盘不压 living→entrance doorway；客厅钥匙/猫事件新位置不与 coffee_table/sofa AABB 相交
- 若发现重叠：做 0.3~0.6 m 的小位移；**保留 obj-key 初始大致在 bedroom 同一侧墙、更新后在 living (1.5,-1.5) 这两个「E2E 强依赖坐标」不变**（最多 ±0.2）
- **提交点 2**：`chore(layout): leave-home 动线与家具不压门微调（保 E2E）`
- 验证：`npm run e2e -- --project=chromium` 必须 10/10 通过（这是这个步骤的 gate）

### Step 3：laundry-sort 布局重排（按「由近及远」动线）
- 三个篮子按进门侧墙面（z=+2 或进门可见面）排成「白/黑/毛巾」由近及远，最近的距门 1~1.5m
- 10 件衣物按白/黑/毛巾/小物件分类放在对应篮子 0.4~1.0m 地面圆圈内（模拟「刚扔下来还没整理」的合理感）
- **提交点 3**：`chore(layout): laundry-sort 篮子与衣物动线合理重排`
- 验证：qa-layout Major 中「容器压门」=0；Minor heuristic（最近实体距门 <2m）通过

### Step 4：night-patrol spawn 改玄关入口 + 边界检查
- spawnPosition 改 entrance 内（叙述一致）；其他实体/脚本事件位置若已在 AABB 内则不动；若脚本事件把物品震到房间外则修
- **提交点 4**：`chore(layout): night-patrol spawn 玄关入口对齐叙述 + 脚本事件越界修复（如有）`
- 验证：QA layout 所有 5 关 Blocker=0 / Major=0

### Step 5：收尾 + QA 回归 + 视觉基线
1. 运行 `npm run qa`（含新 qa-layout）要求：**0 Blocker / 0 Critical / 0 Major**（Minor 可留作后续优化）
2. 运行 `npm test` → 301+4~6 ≈ 307 tests 通过
3. 运行 `npm run build` / `npm run lint` → 0w0e
4. 运行 `npm run e2e -- --project=chromium` → 10/10 通过（核心断言 leave-home 没被 Step 2 破坏）
5. （可选人工）启动 `npm run dev`，逐关进入 1 分钟，肉眼看：
   - 玩家不是浮在墙里/穿墙
   - 家具/物品都在房间内，没有一半在墙上
   - 走几步能到达目标物
6. **提交点 5**：`chore(qa): 新增 qa-layout 检查 + taskConsistency 坐标断言（5 关全 0 Blocker）`
7. **提交点 6**（若需要）：`docs: 生成 20260723_layout_reposition_report.md 记录每关改动前后坐标表`

---

## 四、潜在依赖 / 注意事项（Dependencies & Considerations）

1. **leave-home 的 E2E 是脆弱依赖**：`tests/e2e/first-level-command-flow.spec.ts` 的辅助函数会用 `setRobotPositionInRoom(ent.position)` 定位到实体位置拾取，如果 key/phone/umbrella 容器位置改了 ±1m 量级可能仍 OK，但改 5m 以上会让 `forceEvaluateStageTransitions` 的阶段推进判定里的距离条件（dist<0.5）触发概率变低 → **所以 Step 2 严格限制只做 0.6m 以内微调**。
2. **surfaceHeight 与实体 y 的一致性**：很多关写了 entity.initialPosition.y=0（地面），但其实应该在容器 surfaceHeight 上 → 这是 QA 布局检查要捕捉的 Major 级问题；修 y 后注意 size.y 的值避免「叉子 z 尺寸穿到桌面下」，一般实体 y = surfaceHeight（size.y 方向自底向上或居中，按 Scene3D 渲染约定）。
3. **breakfast 的 kitchen 容器平移后，milk/carton/cup 实体跟随**：用 `entity.xz = container_center.xz + 原相对偏移量` 的方式保持桌面物品相对布局不变，避免「平移完家具后杯子还在原来空气里」。
4. **clean-table 的 rooms = ['dining'] 要不要扩？** 不扩。理论上 dining 16±4 放 1.8m 餐桌 + 4 餐椅（每只 0.4 宽，距桌边 0.3）完全 OK；**只要把写在 x=0 侧的 dining 内容整体加 16 到真实 dining 中心点**，问题就解决；扩 rooms 会影响 taskConsistency 断言 + QA rooms 任务范围扫描，风险更大。
5. **脚本事件的 targetPosition 越界**：脚本事件触发时，代码层（`moveEntity` 命令）没有 AABB 校验 —— 也就是说如果脚本坐标写错，物体会飞到空气里（这是玩家常说「模型摆得不合理」的来源之一），本计划 QA 检查会补这一条，但**不会改命令层执行逻辑去拒绝越界**（那算玩法变化），只在测试层保证不会写出这种坐标。

---

## 五、风险处理（Risk Handling）

| 风险 | 概率 | 影响 | 处理策略 |
|------|------|------|---------|
| **R1：Step 2 leave-home 微调后 Chromium E2E 9/10** | 中 25% | 高（门禁挂红） | 立即 `git checkout HEAD -- src/data/tasks/leave-home.ts` 回退坐标；把问题坐标记录到 `20260723_layout_reposition_report.md` 的「待下轮优化」栏，不强行修到 10/10 为止。Step 2 commit message 明确写「保 E2E 10/10 下的微调」，CI 挂就 revert 单 commit 不影响其他 4 关。 |
| **R2：clean-table 平移 x+16 后，后续 scriptedEvents（如有）把物品移回 0 附近** | 低 10% | 中（物品飞出房间） | QA layout L7 检查 `scriptedEvents.targetPosition inside room` 直接拦截；单元测试断言必挂，CI 红。修法：把对应脚本事件的 targetPosition.x 也同步 +16（Step 1.1 一起做，按 grep 结果列出所有 moveEntity action targetPosition 一次性扫）。 |
| **R3：厨房容器 x+8 后，玩家交互的「可拾取距离」因新位置墙阻挡无法 pick** | 中 20% | 中（breakfast 无法正常玩） | 新坐标计算时先预留：kitchen 东墙 x=12，柜子 x 最大设 11.2，size.x 0.8 → 东缘 x=11.6，留 0.4m 通道；且 breakfast 所有实体放在 x∈[9.5, 11.5] 区间（厨房中部靠东，靠近 dining 方向 doorway 在 x=4，玩家从 dining→kitchen 走进来伸手能拿）。 |
| **R4：有人直接改房间 size（如 laundry 扩到 10×10），然后忘记同步更新 leave-home/night-patrol 引用 laundry 的坐标** | 低 5%（本计划默认不调房间） | 高（全游戏越界） | 在 Section 2.2 明确「默认不动 rooms.ts」；若必须调，则在同一 commit 内 grep 所有 `sharedRooms\[.*\].size / center` 引用并 5 关回归检查。并在 qa-layout 加警告：「本任务某房间 size 与上一个 commit 差值 > 0.5m 需要 review 标记」。 |
| **R5：QA layout 写得太严格，把合法的「物体放在地毯上（客厅）」判定为重叠** | 中 20% | 低（仅告警噪音，非阻塞） | 容器重叠检测：给 `roomsOverlap` 加「padding=-0.05」容差；表面一致性检查容差 0.06m；doorway clearance 0.3m；Minor 级 heuristic 只打印不 fail（除非用户要求严格）。Blocker 只做「越出房间 AABB」。 |

---

## 六、成功判据（Gate 标准，执行完 Step 5 后要全部满足）

1. ✅ Blocker = 0：**所有 5 关 实体/容器/spawn/脚本事件 targetPosition 均在所属房间 AABB 内**
2. ✅ Major = 0：**无容器 AABB 重叠、无容器压 doorway、surfaceHeight 与 y+size.y 一致、surfaceContainerId 实体在容器上方**
3. ✅ 单元测试：`npm test` **0 failed**（含新增 ~6 条 layout 断言）
4. ✅ leave-home E2E 回归：`npm run e2e -- --project=chromium` **10/10**
5. ✅ 质量门禁：`npm run lint` 0w0e · `npm run build` 通过 · `npm run qa`（含新 qa-layout）0 Blocker/Critical/Major
6. ✅ 文档：`docs/archive/qa-reports/20260723_layout_initial_findings.md` + `20260723_layout_reposition_report.md`（每关改前改后坐标对比表，供后续 review 回溯）

---

## 七、建议提交计划（按 Step 分 6 commits，每步可单独回退）

```
commit 1: chore(qa): 新增 scripts/qa-layout.ts + taskConsistency 坐标越界断言（初始必挂留基线）
commit 2: chore(layout): Blocker 修复 - clean-table/breakfast 房间外坐标平移进正确房间（P-01/P-03/P-05）
commit 3: chore(layout): leave-home 动线与家具不压门微调（E2E 10/10 保护下，位移 ≤0.6m）
commit 4: chore(layout): laundry-sort 篮子与衣物由近及远动线重排
commit 5: chore(layout): night-patrol spawn 玄关入口 + 脚本事件越界修复（如有）
commit 6: docs: 新增 20260723_layout_* 报告 + 最终门禁 0 Blocker/0 Major 截图
```
