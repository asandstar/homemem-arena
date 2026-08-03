# GLOBAL LAYOUT QA SPEC（全局布局 QA 规范）

任务：task-leave-home（出门大作战）
阶段：P2.G0-R GLOBAL SCENE GOVERNANCE AUDIT
日期：2026-08-02
前置文档：P2_0_BLUEPRINT_RED_TEAM_REVIEW.md（本规范为 §6 的扩展落地计划）
状态：DRAFT / CANDIDATE ONLY / NOT APPROVED FOR IMPLEMENTATION

================================================================
§0. 规范目标
================================================================

本规范定义「场景布局」类 QA 的：
  1. 现有能力矩阵（§1）：npm run qa 实际已覆盖的检查
  2. 缺口清单（§2）：P2.0 蓝图所需但未实现的 Gate
  3. 扩展路线图（§3）：P2.G1 → P2.0-R → P2.1 各阶段的 QA 增量
  4. 新检查项的实现规格（§4）：每个 NOT_AUTOMATED Gate 的算法、输入、输出、验收
  5. 手动验收兜底流程（§5）：自动化缺失时的人工操作 SOP

原则：
  - 单一事实源：所有 QA 检查必须从同一 TypeScript 类型系统读数据（rooms.ts / decorFurniture.ts / task-leave-home.ts / collision.ts 为权威）
  - 失败即阻断：BLOCKER / MAJOR 级不通过时，npm run qa 必须 exit 1
  - 可扩展：新增检查项通过「新增独立函数 + 在 checkTaskLayout 或新增 checkTaskGovernance 中注册」的方式接入
  - 不与蓝图值硬编码：QA 不读 md 文档，只读 src/data/* 的当前实现

================================================================
§1. 现有 QA 能力矩阵（HEAD 快照）
================================================================

§1.1 npm run qa 调用链

  qa:static  (tsc --noEmit)                         → 类型检查
  qa:assets  (scripts/qa-assets.ts)                 → 模型 ID / 贴图 / Fallback 存在性
  qa:rooms   (scripts/qa-rooms.ts)                  → 房间尺寸 / 门洞 offset / 连通性
  qa:tasks   (scripts/qa-tasks.ts)                  → 任务容器 / 物体 / 阶段引用完整性
  qa:layout  (scripts/qa-layout.ts)                 ← 本规范主要扩展目标
  qa:report  (scripts/qa-report.ts)                 → 汇总报告（暂未接入 CI）

§1.2 qa-layout.ts 当前能力（HEAD）

| Gate ID | 检查项 | 覆盖范围 | 当前自动化级别 | 严重级 |
|---|---|---|---|---|
| L1 | spawn 在房间内 | TC（task spawnPosition） | CURRENTLY_AUTOMATED | blocker |
| L2 | object initialPosition 在房间内 | ObjectSpec | CURRENTLY_AUTOMATED | blocker |
| L3 | container position 在房间内 | ContainerSpec | CURRENTLY_AUTOMATED | blocker |
| L4 | 落地容器间无 AABB 重叠 | ContainerSpec（跳过 wall-mounted / sink-in-counter） | CURRENTLY_AUTOMATED | major |
| L5 | 落地容器不压门洞 | ContainerSpec | CURRENTLY_AUTOMATED | major |
| L6 | surfaceHeight 与 fallback 差 ≤1.0 | ContainerSpec | CURRENTLY_AUTOMATED | minor |
| L7 | surfaceHeight ≤ boxTop+0.5 | ContainerSpec | CURRENTLY_AUTOMATED | minor |
| L8 | object XZ 在 surfaceContainerId 上方 | ObjectSpec + ContainerSpec | CURRENTLY_AUTOMATED | major |
| L9 | move-entity target 在房间内 | ScriptedEvent | CURRENTLY_AUTOMATED | blocker |
| L10 | containsObjectIds 引用有效 | ContainerSpec → ObjectSpec | CURRENTLY_AUTOMATED | major |
| L11 | 最近容器距门 0.8~4.5m（启发式） | ContainerSpec + doorway | PARTIALLY_AUTOMATED | minor |
| L12 | 每个房间至少 1 可交互 | rooms × containers+objects | CURRENTLY_AUTOMATED | blocker |
| L13 | spawn 不落入家具碰撞体 | 未实现（L1 只查在房间内） | PARTIALLY_AUTOMATED | major |

§1.3 本规范需要新增的能力（缺口清单）

见 §2。

================================================================
§2. P2.0 蓝图所需 QA Gate 缺口清单
================================================================

缺口来源：P2_0_BLUEPRINT_RED_TEAM_REVIEW.md §6

§2.1 数据治理类（TC + DF + Room3D 三方交叉）

| Gate ID | 检查项 | 输入源 | 当前级别 | 目标级别（P2.G1 后） | 严重级 |
|---|---|---|---|---|---|
| G1 | DF 家具 footprint 在房间内 | decorFurniture.ts | NOT_AUTOMATED | CURRENTLY_AUTOMATED | blocker |
| G2 | DF 家具不压门洞走行带 | decorFurniture.ts × rooms.ts doorways | NOT_AUTOMATED | CURRENTLY_AUTOMATED | major |
| G3 | 同一 semanticKey 无重复 visual owner | TC.modelId × Room3D hardcoded models × DF（未来加 semanticKey 字段） | MANUAL_ONLY | CURRENTLY_AUTOMATED | blocker |
| G4 | 同一 XZ 区域无双重 collision owner | TC + DF 交叉（AABB 重叠 + 语义配对） | NOT_AUTOMATED | CURRENTLY_AUTOMATED | blocker |
| G5 | DF 与 TC 语义配对后，同一语义不出现两个 collision（如 TC coffee-table 与 DF side-table 都是茶几） | 语义 key + position 偏差 | NOT_AUTOMATED | CURRENTLY_AUTOMATED | blocker |

§2.2 空间可达性类（关键路径 + 容器接近方向）

| Gate ID | 检查项 | 输入源 | 当前级别 | 目标级别（P2.G1 后） | 严重级 |
|---|---|---|---|---|---|
| R1 | 每个容器 ≥1 可达接近方向（射线 / BFS） | TC + TC/DF collision list | NOT_AUTOMATED | CURRENTLY_AUTOMATED | major |
| R2 | spawn 到每个 TC 关键路径无阻塞（A*） | spawn × TC × allFurniture collision | MANUAL_ONLY | PARTIALLY_AUTOMATED（启发式） | blocker |
| R3 | scripted move-entity target 周围净空 ≥1.2m（至少 2 方向） | ScriptedEvent × DF/TC | NOT_AUTOMATED | CURRENTLY_AUTOMATED | major |
| R4 | cat moved key 至少 2 个方向可达 | 具体 target + 相邻 DF/TC | MANUAL_ONLY | CURRENTLY_AUTOMATED | major |
| R5 | 容器交互方向与容器朝向一致（TV 等正向朝向玩家路径） | 未来加 approachableDirection 字段 | NOT_AUTOMATED | NOT_AUTOMATED（P2.G2+） | minor |

§2.3 碰撞语义一致性类

| Gate ID | 检查项 | 输入源 | 当前级别 | 目标级别（P2.G1 后） | 严重级 |
|---|---|---|---|---|---|
| C1 | DF 有 rotation 字段时，collision footprint 的 x/z 正确 swap | collision.ts resolveFurnitureCollision × DF.rotation（需扩展类型） | NOT_AUTOMATED | CURRENTLY_AUTOMATED | blocker |
| C2 | ContainerSpec.collisionOwner = none 时，不出现在 allFurniture 链 | 未来加 collisionOwner 字段 | NOT_AUTOMATED | CURRENTLY_AUTOMATED | major |
| C3 | collisionOwner = static-furniture 时，对应 TC 不出现在 allFurniture | TC.collisionOwner + DF | NOT_AUTOMATED | CURRENTLY_AUTOMATED | major |
| C4 | shallow tray（TC size.y < 0.15 且 position.y > 1.0 且下方有 DF）自动建议 collisionOwner=none | TC + DF 垂直叠加检测 | NOT_AUTOMATED | PARTIALLY_AUTOMATED（启发式告警） | major |
| C5 | wall decor（size.z < 0.15 且贴墙）自动跳过碰撞或告警 | DF | NOT_AUTOMATED | PARTIALLY_AUTOMATED（告警） | minor |

§2.4 语义字段一致性类

| Gate ID | 检查项 | 输入源 | 当前级别 | 目标级别（P2.G1 后） | 严重级 |
|---|---|---|---|---|---|
| S1 | 所有 TC / DF surfaceHeight 写法统一（size.y 型 vs 绝对 y 型二选一，且文档一致） | TC.surfaceHeight 规则引擎 | PARTIALLY_AUTOMATED | CURRENTLY_AUTOMATED | major |
| S2 | object.initialPosition.y 在有 surfaceContainerId / hiddenInContainer 时告警（建议写 0，因为会被忽略） | ObjectSpec | NOT_AUTOMATED | CURRENTLY_AUTOMATED | minor |
| S3 | object.initialPosition 的 room-local XZ 在对应 surfaceContainerId TC XZ 内（已 L8，扩展 DF 版） | ObjectSpec + TC + 未来 DF-Container | CURRENTLY_AUTOMATED | CURRENTLY_AUTOMATED | major |
| S4 | TC.position 与 Room3D 硬编码视觉 position 偏差 ≤ 0.5m（同一房间同一语义） | TC × Room3D（需暴露 semanticKey 映射） | MANUAL_ONLY | PARTIALLY_AUTOMATED（需要先扩展 Room3D 导出） | major |

§2.5 缺口覆盖统计（当前 → P2.G1 目标）

| 级别 | 当前数 | P2.G1 目标 | 增量 |
|---|---|---|---|
| CURRENTLY_AUTOMATED | 11 | 21 | +10 |
| PARTIALLY_AUTOMATED | 3 | 6 | +3 |
| NOT_AUTOMATED | 10 | 0 | -10 |
| MANUAL_ONLY | 3 | 1 | -2 |

→ 目标：P2.G1 完成后，自动化率从 44% 提升到 85%+，剩余 1 项 S4 人工（Room3D 代码结构改造未完成前）。

================================================================
§3. 扩展路线图（三阶段）
================================================================

§3.1 阶段 1：P2.G1 UNIFIED SCENE SPEC（数据模型 + QA 基础能力扩展）

与 P2_0_BLUEPRINT_RED_TEAM_REVIEW.md §11 对齐。

交付 1.1：DecorFurnitureSpec 类型扩展
  - 新增字段：rotation（number，弧度，y 轴）
  - 新增字段：semanticKey（string，如 "sofa_main" / "coffee_table_left"）
  - 新增字段：collisionOwner（'DF' | 'none'，默认 'DF'）
  - 新增字段：visualOwner（'Room3D' | 'DF' | 'TC'，默认 'Room3D' 用于过渡）
  QA 要求：新增 G1（DF 在房间内）、G2（DF 不压门）、C1（rotation swap x/z）

交付 1.2：ContainerSpec 类型扩展
  - 新增字段：collisionOwner（'TC' | 'static-furniture' | 'none'，默认 'TC'）
  - 新增字段：semanticKey（string，与 DF / Room3D 对齐）
  - surfaceHeight 语义统一规则（选一种，见 S1）：
    * 推荐规则 A：surfaceHeight = 绝对 world Y（玩家交互时的物体底部高度）
    * 与 Container3D.tsx getContainerSurfaceY 的实现对齐后定最终规则
  QA 要求：新增 C2（collisionOwner=none 不进链）、C3（static-furniture 不进链）、C4（shallow tray 告警）、S1（surfaceHeight 统一）

交付 1.3：qa-layout.ts 扩展（新模块 qa-governance.ts 或在 qa-layout.ts 中新增函数）

  新增函数清单：
    checkDecorFurnitureInsideRoom()           → G1
    checkDecorFurnitureDoorwayClearance()     → G2
    checkSemanticVisualUniqueness()           → G3（需要先建立 semanticKey 注册表）
    checkCollisionOwnerUniqueness()           → G4/G5（TC 与 DF 不双重 collision）
    checkContainerApproachableDirection()     → R1（射线法：4 方向扫，至少 1 方向无阻挡且距墙 ≥ 0.6m）
    checkScriptedTargetClearance()            → R3（target 周围 0.6m 圈不与 DF/TC 重叠；2 正交方向无阻挡）
    checkRotationFootprintSwap()              → C1（单测式：注入一组带 rotation 的 DF，检查碰撞 AABB 方向正确）
    checkSurfaceHeightConvention()            → S1（规则引擎：size.y 型 vs 绝对 y 型不混用）
    checkObjectSurfaceIgnoredY()              → S2（有 surfaceContainerId 时 y!=0 告警）

  回归要求：
    - npm run qa 对 HEAD 数据执行后 fail 数不增加（新增检查默认 minor 起步，确定需要 blocker 再升级）
    - 新增的每个函数配套 1 个 vitest 单测（tests/qa-layout.test.ts）

交付 1.4：FirstPersonControls.tsx collisionOwner 过滤（代码支持）
  - allFurniture 拼接处加过滤：
    decorFurniture.filter(d => d.collisionOwner !== 'none')
    taskContainers.filter(c => c.collisionOwner !== 'static-furniture' && c.collisionOwner !== 'none')
  QA 要求：C2 / C3 通过（对应单元测试验证）

§3.2 阶段 2：P2.0-R BLUEPRINT REVISION（根据 P2.G1 类型重新算坐标）

交付 2.1：根据 P2.G1 扩展后的类型，重新输出以下文档的 APPROVED 版本：
  - LEAVE_HOME_REALISTIC_LAYOUT_BLUEPRINT.md（坐标修正后）
  - LEAVE_HOME_ASSET_DIMENSION_BUDGET.md（rotation 纳入尺寸）
  - P2_ROOM_BY_ROOM_IMPLEMENTATION_CHECKLIST.md（验收 Gate 引用本规范 §4 的 ID）

交付 2.2：坐标修订完成后，qa-layout.ts + qa-governance.ts 全部检查 PASS（0 blocker / 0 major）
  退出标准：
    npm run qa  exit 0
    本规范 §4 新增检查项全部 CURRENTLY_AUTOMATED，且 0 失败
    人工验收 G3（visual owner 唯一）：截图比对

§3.3 阶段 3：P2.1-P2.3（分房实施）

与 P2_ROOM_BY_ROOM_IMPLEMENTATION_CHECKLIST.md 对齐。
新增门禁：
  - 每个房间完成实施后必须 npm run qa 全部通过
  - P2.1 Living 完成后，R2（关键路径）必须从 PARTIALLY 升级为 CURRENTLY_AUTOMATED 或有明确手动 SOP
  - P2.2 Bedroom 完成后，C1（rotation swap）单测覆盖 sofa / bed / nightstand
  - P2.3 Entrance 完成后，C2/C3（collisionOwner 去重）单测覆盖 entrance-tray on counter

================================================================
§4. 新检查项实现规格（每个 NOT_AUTOMATED 的算法说明）
================================================================

§4.1 G1：checkDecorFurnitureInsideRoom
  输入：decorFurniture.ts → 每个房间 DF 列表
  算法：
    for each (roomId, dfs) of decorFurniture:
      for each df of dfs:
        bounds = roomLocalBounds(roomId, margin=0.35)
        bb = localAabbMinMax(df.position, df.size)
        if bb.x1 < bounds.minX or bb.x2 > bounds.maxX or bb.z1 < bounds.minZ or bb.z2 > bounds.maxZ:
          fail(blocker, `DF ${df.id} 在 ${roomId} 越界`)
  输出：pass/fail
  严重级：blocker

§4.2 G2：checkDecorFurnitureDoorwayClearance
  输入：DF × rooms[].doorways
  算法：
    for each df of dfs:
      if df.collisionOwner === 'none': continue
      if WALL_MOUNTED_RE.test(df.id): continue
      for each doorBox of doorwayBoxes(roomId):
        dfBox = localAabbMinMax(rotatedSize(df))   ← 见 C1 helper
        if boxesOverlap2D(dfBox, doorBox, 0):
          fail(major, `DF ${df.id} 压门洞`)
  严重级：major
  依赖：C1 的 rotatedSize helper（支持 rotation 交换 x/z）

§4.3 G3/G4/G5：Semantic & Collision Ownership Uniqueness
  G3 输入：
    TC.semanticKey × DF.semanticKey × Room3D 导出的模型清单（需要扩展 Room3D 暴露 semanticKey → modelId 映射，或先硬编码白名单）
  算法：
    构建 map: semanticKey → list of {owner, source, position, id}
    if any key.list.length > 1:
      fail(blocker, `semanticKey ${key} 有多个视觉 owner: ${list.map(...)}`)
      允许例外：collisionOwner=static-furniture 的 TC 与 DF 配合（TC 做交互，DF 做碰撞），但 visualOwner 必须只有 1 个
  G4 算法：
    for each TC of task.containers:
      if TC.collisionOwner === 'none' or 'static-furniture': continue
      for each DF of decorFurniture[TC.room]:
        if DF.collisionOwner === 'none': continue
        overlap = boxesOverlap2D(TCBox, DFBox, -0.05)
        sameSemantic = TC.semanticKey === DF.semanticKey
        if overlap and (overlap ratio > 0.8 or sameSemantic):
          fail(blocker, `TC ${TC.id} 与 DF ${DF.id} 碰撞重叠 ${overlap}%`)
  G5 算法（TC 与 DF 语义配对不重复碰撞）：
    same as G4，但专门检查 semanticKey 相同的情况（即使 overlap 低，同一 semanticKey 也只能有 1 个 collision owner）

  严重级：G3/G4/G5 全是 blocker

§4.4 R1：checkContainerApproachableDirection
  输入：TC × allFurniture（collisionOwner != none 的 TC + DF）
  算法（射线 / 方向扫）：
    4 方向 = [+x, -x, +z, -z]
    对每个 TC：
      candidate = []
      for dir of 4 directions:
        testPoint = TC.position + dir × (0.6 + PLAYER_RADIUS)
        用 resolveFurnitureCollision 或圆矩相交测试 testPoint 是否自由（与所有家具不重叠）
        同时 testPoint 不贴墙（距房间边界 ≥ 0.35）
        若自由 → candidate.push(dir)
      if candidate.length === 0:
        fail(major, `TC ${TC.id} 无可达接近方向`)
      else:
        pass(info, candidate directions)
  扩展：P2.G2+ 支持对角线 8 方向和斜向路径。
  严重级：major

§4.5 R3：checkScriptedTargetClearance
  输入：ScriptedEvent.targetPosition × DF + TC in targetRoom
  算法：
    1. 检查 0.6m 半径圈不与任何家具 AABB 重叠（圆矩不相交）
    2. 至少 2 个正交方向（比如 +x 和 +z）可以从 0.6m 处向外走 1.0m 不碰撞
    不满足 → fail(major)
  严重级：major
  对 cat moved key 专项扩展：2 方向要求为强约束（不是 1 方向）

§4.6 C1：Rotation Footprint Swap（类型 + 算法 + 单测）
  helper: rotatedSize(df: DecorFurnitureSpec): {x:number, z:number}
    if rotation % (PI/2) is near odd multiple:
      return { x: df.size.z, z: df.size.x }
    else:
      return df.size
  QA 检查：
    构造 1 组测试 DF：size (2.4, 1.0), rotation = PI/2
    → 碰撞 AABB 应为 x=1.0 half, z=2.4 half
    单元测试验证 resolveFurnitureCollision 的实际 AABB 与预期一致
  严重级：blocker（类型 + collision.ts 逻辑不支持时）

§4.7 S1：surfaceHeight 写法统一
  推荐规则（待 P2.G1 定版）：
    RULE_A（绝对 Y）：对每个 TC，surfaceHeight = getContainerSurfaceY 返回的 world Y（绝对高度）
    检查：
      |TC.surfaceHeight - (TC.position.y + TC.size.y)| <= 0.02（顶面）或
      |TC.surfaceHeight - (TC.position.y + TC.size.y/2)| <= 0.02（中心）或
      |TC.surfaceHeight - TC.size.y| <= 0.02（size.y 型，当前 coffee/night/umbrella 的 pattern）
    同一任务中 3 种 pattern 不允许混合，统一选 1 种（推荐 RULE_A + 全改成绝对 Y）
  QA 算法：
    统计每个任务 TC 的 3 种 pattern 命中数
    if 命中 pattern 种类 > 1:
      fail(major, `任务 ${task.id} surfaceHeight 写法不统一：pattern 分布 ${stats}`)
  严重级：major

================================================================
§5. 手动验收兜底 SOP（自动化缺失时的人工操作）
================================================================

适用于：P2.G1 完成前（当前阶段）和 P2.G2+ 仍为 MANUAL_ONLY 的项。

§5.1 人工验收清单（Leave-home 专项）

| 人工验收 ID | 对应自动化 Gate | 操作步骤 | 通过标准 | 负责人/方式 |
|---|---|---|---|---|
| M-G3 | duplicate semantic visual | 1. npm run dev 进入 leave-home；2. 按 V 切 top-down；3. 截图记录每个房间的家具位置与视觉模型 ID 清单（浏览器 DevTools 抓 Scene 树中的 name）；4. 与 TC / DF semanticKey 列表交叉比对 | 每个 semanticKey 在 Room3D TC DF 三处中只有 1 处渲染（不含 FallbackColorizer 自动生成的 mesh） | 人工 + 截图存档 |
| M-R2 | critical path 可达性 | 1. 进入游戏 spawn；2. 按固定顺序走：spawn → coffee-table（E 存钥匙记忆）→ bedroom（west door）→ nightstand（F 取手机）→ back living → entrance（north door）→ entrance-tray（F 放手机）→ umbrella-stand（F 取伞）→ entrance-tray（F 放伞）→ living search cat-key → E 更新记忆 → entrance-tray（F 放钥匙）；3. 每步记录是否被卡住、卡位置、净空目测 | 每步玩家移动无卡顿，路径上每段通道目测宽度 ≥ 1.2m；玩家不需要侧身或挤入家具之间；猫移动钥匙位置可从 2 方向接近拾取 | 人工走通 + 录屏（失败时） |
| M-C1 | rotation footprint swap（沙发床等大件） | 1. 进入 first-person 模式；2. 走近 sofa-side TV nightstand 等带 90° rotation 的家具；3. 目测角色中心（第一人称视线 1.5m 前）与家具视觉边缘对齐后，慢慢靠近，检查碰撞墙是否与视觉边缘重合 | 碰撞边界与视觉边缘偏差 ≤ 0.15m；不出现「看到空处但走不过去」或「撞到空气」；误差在 corner 处允许 ≤ 0.3m | 人工 + top-down 叠加 AABB 调试（可临时加 dev 模式 AABB 渲染） |
| M-S4 | TC 与 Room3D 视觉位置对齐 | 1. DevTools 检查 TC 的 Container3D position 与 Room 中相同语义的 FallbackModel / GLB position；2. 截图比对 world XZ | 同一语义的 TC 和 Room3D 视觉 position 偏差 ≤ 0.5m；不出现「茶几在 TC 是空墙但 Room 里有另一个茶几」的双重视觉 | 人工 + 截图存档 |
| M-F5~F8 | 布局真实性（沙发电视朝向等） | 1. 截图房间整体 4 视角；2. 逐条对照 §F 8 项真实性评级 | F 系列 16 项中 UNREALISTIC ≤ 3 且 BLOCKING = 0；沙发与电视朝向夹角 ≤ 30°；玄关动线无折返 | 人工评审 |

§5.2 人工验收记录格式

每次人工验收必须产出：
  - 时间戳
  - 构建 commit SHA
  - 操作者
  - M-* 每条的 Pass / Fail + 截图 / 录屏链接
  - 结论：GO（进入下一阶段）/ REWORK（列出具体修复项）

================================================================
§6. 门禁退出标准（P2.G1 → P2.0-R 转移）
================================================================

满足所有以下条件，QA 规范从 DRAFT 升级为 APPROVED，且允许进入 P2.0-R：

1. G1~G5（数据治理类）全部 CURRENTLY_AUTOMATED 并单测覆盖
2. R1 + R3（可达性）CURRENTLY_AUTOMATED；R2 至少 PARTIALLY_AUTOMATED（启发式不告警）或 M-R2 人工走通存档
3. C1 + C2 + C3（碰撞一致性）CURRENTLY_AUTOMATED；C4/C5 至少 PARTIALLY_AUTOMATED（告警存在）
4. S1（surfaceHeight 统一）CURRENTLY_AUTOMATED 并通过 HEAD 和新 TC 数据检查
5. 本规范 §4 新增函数全部有 vitest 单测（每个函数 ≥ 1 正例 + 1 反例）
6. npm run qa 对 HEAD 数据 exit 0（不引入新的 blocker / major 回归）
7. M-G3 / M-R2 / M-C1 / M-S4 人工验收 SOP 文档化（本规范 §5 已覆盖）

================================================================
§7. 禁止事项（与 P2.G0-R 约束一致）
================================================================

- 本规范为 DRAFT，不得直接作为 npm run qa 的通过依据
- 不得把 P2.0 蓝图坐标当成已批准事实写入 QA（QA 只读 src/data/*）
- 不得修改源码、测试、脚本（本规范定义的扩展仅在 P2.G1 阶段实施，本轮不改）
- 不得 commit / push

本轮结束。
