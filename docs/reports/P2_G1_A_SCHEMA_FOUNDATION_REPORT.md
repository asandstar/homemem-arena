# P2.G1-A 阶段交付报告 — SCENE COLLISION SCHEMA FOUNDATION

任务：task-leave-home（出门大作战）
阶段：P2.G1-A SCENE COLLISION SCHEMA FOUNDATION（本阶段）
日期：2026-08-02
前置：P2.G0-R NO-GO P2.1（见 P2_0_BLUEPRINT_RED_TEAM_REVIEW.md / GLOBAL_SCENE_GOVERNANCE_AUDIT.md）
退出：P2.G1-A 完成；未进入 P2.G1-B / P2.0-R / P2.1

================================================================
1. 实际修改文件
================================================================

本轮 P2.G1-A 新增或修改的代码文件（仅与本阶段直接相关的部分）：

| # | 文件路径 | 改动类型 | 说明 |
|---|---|---|---|
| 1 | [src/types/object.ts](file:///Users/azq/asandstar/homemem-arena-web-demo/src/types/object.ts) | 修改 | ContainerSpec 新增 semanticKey / collisionMode / visualOwner 三字段；新增 ContainerCollisionMode / ContainerVisualOwner 类型别名 |
| 2 | [src/data/decorFurniture.ts](file:///Users/azq/asandstar/homemem-arena-web-demo/src/data/decorFurniture.ts) | 修改 | DecorFurnitureSpec 新增 semanticKey / rotationY / collisionMode / visualOwner 四字段；新增 DecorCollisionMode / DecorVisualOwner 类型别名 |
| 3 | [src/game/sceneSchema.ts](file:///Users/azq/asandstar/homemem-arena-web-demo/src/game/sceneSchema.ts) | 新增 | 三纯函数：getRotatedFootprint / shouldDecorProvideCollision / shouldContainerProvideCollision；再导出相关类型 |
| 4 | [src/game/sceneSchema.test.ts](file:///Users/azq/asandstar/homemem-arena-web-demo/src/game/sceneSchema.test.ts) | 新增 | 14 个单元测试（footprint 7 + Decor collisionMode 3 + Container collisionMode 4） |
| 5 | [docs/reports/P2_G1_A_SCHEMA_FOUNDATION_REPORT.md](file:///Users/azq/asandstar/homemem-arena-web-demo/docs/reports/P2_G1_A_SCHEMA_FOUNDATION_REPORT.md) | 新增 | 本报告文件 |

注意：`git status --short` 中可见的其他 M 文件（FirstPersonControls / HUD / ModelAsset / clean-table / commands / HomePage / e2eTestApi 等 10 项）属于**前序会话遗留未提交修改**，非本轮 P2.G1-A 的交付内容。本轮未修改上述文件的任何代码。

================================================================
2. 最终类型字段
================================================================

§2.1 DecorFurnitureSpec（src/data/decorFurniture.ts，原字段 3 → 7 字段，全部新增可选）

| 最终字段名 | 类型 / 枚举值 | 默认语义（缺失时） | 命名说明 |
|---|---|---|---|
| id | string | — | 原字段 |
| position | Vec3 | — | 原字段 |
| size | Vec3 | — | 原字段 |
| semanticKey? | string（如 'sofa_main' / 'umbrella_stand'） | 未设置视为 legacy，不参与去重检查 | 使用与代码风格一致的 camelCase 命名；表示"语义家具"唯一标识，跨 TC/DF/Room3D 三方配对 |
| rotationY? | number（弧度，Y 轴旋转） | 缺失 = 0（正 Z 基准） | 采用 rotationY 而非 yaw / angle，与 EntityState.rotation（Y 轴弧度）一致的命名风格 |
| collisionMode? | 'self' \| 'none'（DecorCollisionMode） | 缺失 = 'self' | 自解释命名；self = 自身承担碰撞（向后兼容）；none = 跳过（墙挂/柜顶装饰） |
| visualOwner? | 'room' \| 'decor' \| 'task-container'（DecorVisualOwner） | 缺失 = legacy 未迁移，不改变当前渲染行为 | room=Room3D 硬编码承担；decor=未来 DF 渲染组件；task-container=对应任务容器承担；三选一避免双重视觉 |

§2.2 ContainerSpec（src/types/object.ts，原字段 16 → 19 字段，全部新增可选）

| 最终字段名 | 类型 / 枚举值 | 默认语义（缺失时） | 命名说明 |
|---|---|---|---|
| ... | 原 16 字段保留未动 | — | ContainerSpec 原有 id / name / room / position / size / color / initialOpen / acceptedCategories / containsObjectIds / isTargetZone / targetLabel / surfaceHeight / isDrawer / acceptAny 均未动 |
| semanticKey? | string（如 'nightstand_right' / 'entrance_tray'） | 未设置视为 legacy，不参与去重 | 与 Decor 对称，确保同语义家具的 TC/DF/Room3D 三方配对一致 |
| collisionMode? | 'self' \| 'static-furniture' \| 'none'（ContainerCollisionMode） | 缺失 = 'self' | self=TC 自身承担碰撞（向后兼容）；static-furniture=转由 DF 承担（TC 跳过）；none=完全跳过（空中托盘/墙挂） |
| visualOwner? | 'room' \| 'task-container'（ContainerVisualOwner） | 缺失 = legacy，保持当前 Container3D 渲染 | room=Room3D 硬编码视觉；task-container=Container3D 自身承担；二选一避免双重视觉 |

向后兼容性保障：
  - 所有 7 个新增字段均为可选（?:），不补字段的旧配置 100% 通过类型检查
  - 默认值逻辑在纯函数 shouldDecorProvideCollision / shouldContainerProvideCollision 中统一判定（见 §4）
  - 未给任何现有家具或容器批量补字段（遵守严格禁止事项）

================================================================
3. 默认兼容行为
================================================================

| 字段 | 缺失时的纯函数行为 | 运行时表现 |
|---|---|---|
| DecorFurnitureSpec.rotationY | getRotatedFootprint(size, undefined) → 视为 0 → 返回原尺寸 | 与旧 collision.ts 直接取 size.x / size.z 纯 XZ 行为 100% 等价 |
| DecorFurnitureSpec.collisionMode | shouldDecorProvideCollision({}) → 返回 true | 旧 DF 全部继续参与 allFurniture 碰撞链 → 碰撞行为不变 |
| DecorFurnitureSpec.visualOwner | 不参与运行时，仅 QA 用（视觉去重） | 当前 Room3D / Container3D 渲染选择不变 |
| ContainerSpec.collisionMode | shouldContainerProvideCollision({}) → 返回 true | 旧 TC 全部继续参与 allFurniture 碰撞链 → 碰撞行为不变 |
| ContainerSpec.visualOwner | 不参与运行时 | Container3D 照旧渲染 → 视觉不变 |
| 各 semanticKey | 不参与运行时 | 不影响任何游戏逻辑 |

本阶段未将 shouldDecor/ContainerProvideCollision 接入 FirstPersonControls 的 allFurniture 拼接（见 §8），
因此实际生产运行时的碰撞链与修改前完全一致。

================================================================
4. footprint 数学公式
================================================================

纯函数：getRotatedFootprint(size, rotationY?)（src/game/sceneSchema.ts）

数学定义（Y 轴 yaw 后 AABB 轴对齐包络）：

  给定输入：
    size.x = 未旋转时家具的 X 方向完整宽度
    size.z = 未旋转时家具的 Z 方向完整深度
    yaw   = rotationY ?? 0（弧度，缺失为 0）

  中间量：
    c = cos(yaw)
    s = sin(yaw)
    absC = |c|
    absS = |s|

  输出（轴对齐完整尺寸，非 half-extent）：
    fullX = absC * size.x + absS * size.z
    fullZ = absS * size.x + absC * size.z

  浮点误差吸收：
    对结果 x/z 做 EPS=1e-9 截断（|x| < EPS 时归 0），
    防止 sin(π/2)≈1.0 浮点尾部把 1.0 误写为 0.9999999999999999。

特性：
  - 纯函数：不修改输入 size 对象
  - 非 Three.js 依赖：仅 Math.cos / Math.sin / Math.abs
  - 不读 mesh 不读 rooms
  - 对 0、π/2、π、-π/2 正交角度 exact 命中（cos 或 sin=0，另一=1，因此交换 x/z 或还原）
  - 对 π/4 等非正交角度返回保守的 x=z 对称包络（包围盒 >= 实际旋转矩形）
  - 不实现"90° 时 swap x/z"特判；通用公式自然覆盖所有 yaw

================================================================
5. 单元测试列表
================================================================

测试文件：src/game/sceneSchema.test.ts，vitest 风格，15 test suites × 1 file。

§5.1 getRotatedFootprint（7 个用例）

| # | 输入 size | 输入 rotationY | 断言类型 | 预期输出要点 |
|---|---|---|---|---|
| F1 | {x:2.4, z:1.0}（主沙发） | 0 | 数值精确 | x=2.4, z=1.0（原尺寸不变） |
| F2 | 同上 | π/2（90°） | 数值精确 | x=1.0, z=2.4（完美 x/z 交换） |
| F3 | 同上 | π（180°） | 数值精确 | x=2.4, z=1.0（AABB 对称，还原） |
| F4 | 同上 | -π/2（-90°） | 数值精确 | x=1.0, z=2.4（abs(cos/sin) 与 90° 相同） |
| F5 | 同上 | π/4（45°） | 数值精确 + 边界 | x=z≈2.40416（= (2.4+1.0)*√2/2），且 x/z 均大于原长边 2.4（保守包络） |
| F6 | 同上 | undefined（缺失） | 数值精确 | x=2.4, z=1.0（等价 0） |
| F7 | 同上（带前后快照对比） | 任意（π/7） | 不变性 | 调用后 size.x / size.z 与快照严格相等（证明不修改输入） |

§5.2 shouldDecorProvideCollision（3 个用例）

| # | spec 输入 | 预期 |
|---|---|---|
| D1 | { collisionMode: 'self' } | true |
| D2 | { collisionMode: 'none' } | false |
| D3 | {}（缺失 collisionMode） | true（向后兼容默认） |

§5.3 shouldContainerProvideCollision（4 个用例）

| # | spec 输入 | 预期 |
|---|---|---|
| C1 | { collisionMode: 'self' } | true |
| C2 | { collisionMode: 'static-furniture' } | false（转 DF 承担） |
| C3 | { collisionMode: 'none' } | false |
| C4 | {}（缺失 collisionMode） | true（向后兼容默认） |

测试总计：7 + 3 + 4 = 14 个，全部断言具体 boolean 或 9 位小数精度数值，
全部非"只断言不抛异常"的弱断言。

================================================================
6. lint / build / test / qa 真实结果
================================================================

运行顺序：npm run lint → npm run build → npx vitest run sceneSchema.test.ts → npm test → npm run qa。全部 exit 0。

§6.1 lint（oxlint）
  - 结果：exit 0
  - warnings：14（与基线一致，为 tests/e2e/FirstPersonControls/exhaustive-deps 等既有 warning）
  - errors：0
  - 本轮新增代码 0 warning 0 error

§6.2 build（tsc -b + vite build）
  - 结果：exit 0
  - tsc：0 error
  - vite：2427 modules，built in 643ms（首次）/ 568ms（qa 内重跑）
  - chunk size warning：Scene3D chunk 1.2MB gzip 318KB（与基线一致，既有 warning，本轮未引入更大 chunk）

§6.3 新增测试单独执行（npx vitest run sceneSchema.test.ts）
  - 结果：exit 0
  - Test Files：1 passed
  - Tests：14 passed（7 footprint + 3 Decor + 4 Container）
  - Duration：5ms tests / 853ms total

§6.4 全部测试（npm test = vitest run）
  - 结果：exit 0
  - Test Files：15 passed（含 14 个既有文件 + 1 新文件）
  - Tests：335 passed（321 既有 + 14 新增）
  - 回归 0 失败
  - 最长单测：chaos.test.ts 模拟 180 秒 861ms（与基线一致）

§6.5 qa（qa:static → qa:assets → qa:rooms → qa:tasks → qa:layout → build）
  - 结果：exit 0
  - 布局检查总数：150 项全部 Pass
  - 按任务：
      task-clean-table  24/24（0 blocker/critical/major/minor）
      task-leave-home   29/29
      task-laundry-sort 27/27
      task-breakfast    40/40
      task-night-patrol 30/30
  - 0 Blocker 0 Critical 0 Major 0 Minor
  - build step：二次通过（qa 末尾再次执行 build，确保 typescript 类型扩展后仍可生产构建）

================================================================
7. git diff --stat（本阶段实际增量）
================================================================

git diff --stat 的完整输出（含工作区既有遗留 M 文件）：

  src/components/arena3d/FirstPersonControls.tsx |  28 +-
  src/components/arena3d/HUD.tsx                 |  48 ++-
  src/components/arena3d/models/ModelAsset.tsx   |  98 +++---
  src/data/decorFurniture.ts                     |  33 ++
  src/data/tasks/clean-table.ts                  |  86 +++--
  src/game/commands.test.ts                      |  14 +-
  src/game/commands.ts                           |  18 ++
  src/pages/HomePage.tsx                         |   4 +-
  src/types/object.ts                            |  27 ++
  src/utils/e2eTestApi.ts                        |  17 +
  src/utils/e2eTestApi.types.ts                  |   6 +
  tests/e2e/clean-table-command-flow.spec.ts     | 415 +++++++++++++++++++++++++
  12 files changed, 706 insertions(+), 88 deletions(-)

本阶段（P2.G1-A）净新增贡献：
  - src/data/decorFurniture.ts：+33 行（类型扩展，无数据改动）
  - src/types/object.ts：+27 行（类型扩展，无旧字段变动）
  - src/game/sceneSchema.ts：+105 行（新文件）
  - src/game/sceneSchema.test.ts：+118 行（新文件）
  - 本报告文件：docs/reports/P2_G1_A_SCHEMA_FOUNDATION_REPORT.md（新文件）
  - 合计净新增约 283 行（不含前序遗留）

遗留 M 文件（非本轮修改，勿在下一阶段误 commit）：
  FirstPersonControls / HUD / ModelAsset / clean-table / commands / HomePage / e2eTestApi 共 10 项
  及对应 e2e 测试。这些属于前序会话的未提交工作，本轮未触碰。

================================================================
8. 本轮是否修改运行时行为
================================================================

明确声明：**未修改任何游戏运行时行为**。

证据链：
  1. 未修改 src/game/collision.ts 的 resolveFurnitureCollision 或任何碰撞算法
  2. 未修改 FirstPersonControls.tsx 的 allFurniture 拼接逻辑；
     shouldDecor/ContainerProvideCollision 纯函数虽已定义，但尚未接入（留 P2.G1-B 接入）
  3. 未修改 Container3D / Room3D / Object3D / Door3D / Scene3D 任何渲染组件
  4. 未修改 interactionTargets.ts / placement.ts / commands.ts / flow.ts 等核心游戏逻辑
  5. 未修改 task-leave-home.ts 或其他任务配置的 position/size/物体/脚本事件
  6. 未修改 surfaceHeight、玩家按键、任务阶段条件或目标判定
  7. 全量回归 335 tests 通过，qa 150 项 0 fail（证明运行时回归 0）

玩家实际游戏体验：视觉、碰撞、移动、交互、记忆、探针、混乱度，与本轮修改前 **100% 无差异**。

================================================================
9. 本轮是否修改任何坐标
================================================================

明确声明：**未修改任何坐标 / 尺寸 / 初始位置 / 脚本化目标点**。

未修改项：
  - rooms.ts：房间尺寸、中心、门洞 offset 未动
  - decorFurniture.ts：现有 DF 数组中每个 position/size 完全保持（仅在 DecorFurnitureSpec 接口定义处增加可选字段，未改数据）
  - leave-home.ts / breakfast.ts / clean-table.ts 等 6 个任务：
    TC position/size、obj initialPosition、scriptedEvent targetPosition 全部保持原值
  - 没有任何家具或容器被批量补 semanticKey / rotationY / collisionMode / visualOwner

git diff -- src/data/decorFurniture.ts src/data/tasks/：
  仅 decorFurniture.ts 的 interface 定义 33 行变更 + clean-table.ts 既有遗留变更（非本轮动），
  本阶段**零坐标变更**。

================================================================
10. 下一阶段 P2.G1-B 的建议范围
================================================================

下一阶段 ID：P2.G1-B SCENE COLLISION SCHEMA RUNTIME INTEGRATION

建议范围（仅建议，实际以 P2.G1-B 任务指令正式为准）：

1. **运行时接入碰撞模式过滤**
   - FirstPersonControls allFurniture = [...TC.filter(shouldContainerProvideCollision), ...DF.filter(shouldDecorProvideCollision)]
   - 单元测试验证：TC collisionMode='static-furniture' 不再进链；DF collisionMode='none' 不再进链
   - 回归：P2.G1-A 阶段 qa 150 项仍然 0 fail（证明默认行为不变）

2. **碰撞 footprint 旋转一致性升级（结构性 DTS-001）**
   - collision.ts resolveFurnitureCollision 或其包装中：
     对 DecorFurnitureSpec 先做 size = getRotatedFootprint(spec.size, spec.rotationY) 再做圆矩相交
   - 单元测试：注入带 rotationY=π/2 的 DF，验证碰撞 AABB 与视觉方向一致（sofa-side 不再撞空气）
   - 回归：HEAD 无 rotationY 的 DF 结果与旧实现完全相同（因默认 0 等价 size 不变）

3. **QA 扩展基础（GLOBAL_LAYOUT_QA_SPEC.md §3.1 交付 1.3 第 1 批）**
   - 新增 G1（DF 在房间内）、G2（DF 不压门）、R3（scripted target 净空 ≥1.2m 2 方向）
     三个纯函数实现，放入 qa-layout.ts 或新增 qa-governance.ts
   - 不急着接 npm run qa 流水线（P2.G1-C 再挂）

4. **严格禁止进入 P2.G1-B 的范围**
   - 不修改任何 room / furniture / container / object 坐标
   - 不批量补 semanticKey / collisionMode 数据迁移（留 P2.0-R）
   - 不修改 Room3D 渲染组件
   - 不开始 P2.0-R 坐标重算
   - 不开始 P2.1 Living 实施
   - 不 commit / push

P2.G1-B 交付预期：
  - 运行时 collisionOwner 过滤接入（P2.G0-R DTS-002/007 根因修复）
  - 旋转 footprint 碰撞算法升级（DTS-001 根因修复）
  - 3 个 QA 纯函数新实现 + 单测
  - 保持 0 坐标变动 + 0 运行时视觉变动 + 全量回归通过

================================================================
11. git status
================================================================

git status --short：

  M src/components/arena3d/FirstPersonControls.tsx   （前序遗留，非本轮）
  M src/components/arena3d/HUD.tsx                    （前序遗留，非本轮）
  M src/components/arena3d/models/ModelAsset.tsx      （前序遗留，非本轮）
  M src/data/decorFurniture.ts                        （本轮：类型扩展，无坐标数据改）
  M src/data/tasks/clean-table.ts                     （前序遗留，非本轮）
  M src/game/commands.test.ts                         （前序遗留，非本轮）
  M src/game/commands.ts                              （前序遗留，非本轮）
  M src/pages/HomePage.tsx                            （前序遗留，非本轮）
  M src/types/object.ts                               （本轮：ContainerSpec 类型扩展）
  M src/utils/e2eTestApi.ts                           （前序遗留，非本轮）
  M src/utils/e2eTestApi.types.ts                     （前序遗留，非本轮）
  M tests/e2e/clean-table-command-flow.spec.ts        （前序遗留，非本轮）
  ?? docs/design/GLOBAL_LAYOUT_QA_SPEC.md             （P2.G0-R 产出）
  ?? docs/design/GLOBAL_SCENE_GOVERNANCE_AUDIT.md     （P2.G0-R 产出）
  ?? docs/design/LEAVE_HOME_ASSET_DIMENSION_BUDGET.md （P2.G0-R 产出）
  ?? docs/design/LEAVE_HOME_REALISTIC_LAYOUT_BLUEPRINT.md （P2.G0-R 产出）
  ?? docs/design/P2_0_BLUEPRINT_RED_TEAM_REVIEW.md    （P2.G0-R 产出）
  ?? docs/reports/                                    （新增目录 + 本报告）
  ?? docs/roadmap/P2_ROOM_BY_ROOM_IMPLEMENTATION_CHECKLIST.md （P2.G0-R 产出）
  ?? src/game/sceneSchema.test.ts                     （本轮：14 个单测）
  ?? src/game/sceneSchema.ts                          （本轮：3 纯函数）

工作区状态总结：
  - 12 modified：其中本轮实际修改 2 个（decorFurniture.ts / object.ts 类型扩展），余 10 个前序遗留
  - 10 untracked：其中本轮实际新增 3 个（sceneSchema.ts / sceneSchema.test.ts / 本报告），余 7 个 P2.G0-R 文档

================================================================
§12. 禁止事项执行声明
================================================================

所有本轮禁止事项逐条核实通过：

  ✅ 未修改任何 room position（rooms.ts 未动）
  ✅ 未修改任何 furniture position（decorFurniture.ts 数组未动，仅 interface）
  ✅ 未修改任何 container position（task-leave-home.ts / 其他 tasks 未动）
  ✅ 未修改任何 object initialPosition
  ✅ 未修改任何 scripted event target
  ✅ 未修改 Room3D.tsx
  ✅ 未修改 decorFurniture.ts 现有数据（仅改类型定义）
  ✅ 未修改 leave-home.ts 现有数据
  ✅ 未修改 collision.ts 的生产碰撞算法（resolveFurnitureCollision 未动）
  ✅ 未修改 FirstPersonControls 的 allFurniture 组合逻辑（should* 函数未接入）
  ✅ 未修改 Container3D 渲染
  ✅ 未修改 surfaceHeight（字段和数据全未动）
  ✅ 未修改玩家按键
  ✅ 未修改 L1/L2/L3 任务逻辑
  ✅ 未修改任何模型资产
  ✅ 未修改 README
  ✅ 未开始 P2.G1-B（仅提出建议范围，实际未动）
  ✅ 未开始 P2.0-R
  ✅ 未开始 P2.1
  ✅ 未 commit
  ✅ 未 push

本轮结束。
