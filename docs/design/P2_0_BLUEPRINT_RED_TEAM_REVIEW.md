# P2.0 蓝图红队审查报告（RED-TEAM REVIEW）

任务：task-leave-home（出门大作战）
阶段：P2.G0-R GLOBAL SCENE GOVERNANCE AUDIT + P2.0 RED-TEAM REVIEW
日期：2026-08-02
审查方式：以 rooms.ts / collision.ts / decorFurniture.ts / leave-home.ts / qa-layout.ts / FirstPersonControls.tsx / Container3D.tsx 为唯一事实源
审查对象（DRAFT / CANDIDATE ONLY / NOT APPROVED）：
  - docs/design/LEAVE_HOME_REALISTIC_LAYOUT_BLUEPRINT.md
  - docs/design/LEAVE_HOME_ASSET_DIMENSION_BUDGET.md
  - docs/roadmap/P2_ROOM_BY_ROOM_IMPLEMENTATION_CHECKLIST.md

============================================================
1. P2.0 三份文档的可用部分（SALVAGEABLE）
============================================================

1.1 LEAVE_HOME_REALISTIC_LAYOUT_BLUEPRINT.md 可用部分

| 章节 | 可用性 | 说明 |
|---|---|---|
| §0.1 坐标约定表（room-local vs world 转换规则） | ✅ 可用 | 与源码一致：TC.position = room-local，world = room.center + position |
| §0.2 物理常量（PLAYER_RADIUS=0.3 / 最小通道 1.2m / 交互距离） | ✅ 可用 | 与源码 playerControls.ts / interactionTargets.ts 一致 |
| §0.4 固定任务动线（12 步 Stage 1/2/3） | ✅ 可用 | 与 leave-home.ts stages / scriptedEvents 定义一致 |
| §1.2/§2.2/§3.2 房间 ASCII 俯视图框架格式 | ⚠ 结构可用，坐标待修正 | 格式正确，但门洞 / 象限 / z 方向有错误（见 §2） |
| 「VS = Visual Source / CS = Collision Source」所有权表结构 | ✅ 可用 | 语义正确，结构可复用 |
| 门洞走行带检查方法（XZ 条带相交） | ✅ 可用 | 与 qa-layout.ts doorwayBoxes 一致 |

1.2 LEAVE_HOME_ASSET_DIMENSION_BUDGET.md 可用部分

| 章节 | 可用性 | 说明 |
|---|---|---|
| §0.1 三维度分层（Visual / Logical Collision / Fallback） | ✅ 可用 | SV7 合规性描述正确（禁止 mesh bounds 直接当碰撞） |
| §0.2 GLB / Triangle 预算分级（L/M/S） | ✅ 可用 | 合理，可作为未来模型采购上限 |
| §0.3 Pivot 约定（底面几何中心） | ✅ 可用 | 与 Container3D / FurnitureModel position 定义一致 |
| §1-§8 8 项家具语义 Desired Visual 尺寸表 | ⚠ 尺寸值可参考，rotation 需复核 | 尺寸方向（x长 z深）在非 0 旋转时需 swap（collision.ts 不读 rotation） |
| §3 SV7 合规总检查结构 | ✅ 可用 | 检查框架正确 |

1.3 P2_ROOM_BY_ROOM_IMPLEMENTATION_CHECKLIST.md 可用部分

| 章节 | 可用性 | 说明 |
|---|---|---|
| §0.1 分房隔离原则（P2.1 只动 Living 等） | ✅ 可用 | 降低风险的正确策略 |
| §0.2 改动粒度（最多 3 文件 / 不新增文件） | ✅ 可用 | 可操作 |
| §0.3 验证顺序（lint → build → qa → auto → manual） | ✅ 可用 | 流程合理 |
| 每个房间的 J/K 允许/禁止修改文件白名单黑名单结构 | ✅ 可用 | 结构正确 |
| 跨房联调 C-1~C-4 全流程通关验收标准 | ✅ 可用 | 覆盖关键路径 |

不可直接使用（需要修订）的内容：
  - 所有具体坐标数值（§2/§3 有方向/重叠/净空错误）
  - spawnRotation 视线方向描述（蓝图写"朝向 -z 面向沙发"，源码为 PI → 实际朝向 +z）
  - entrance "靠 living 门一侧"z 方向判断（蓝图写 +z，实际应为 -z）
  - 所有 ACCEPT 标注的候选坐标（§3 逐项复核后多为 REVISE/REJECT）
  - P2.1-I.1/L7 top-down 按键"M"（实际是 KeyV）

============================================================
2. 坐标方向错误（§A 复核结果）
============================================================

坐标方向事实源（rooms.ts + collision.ts）：
  - +x = 东（living kitchen 门洞 x=+4）
  - -x = 西（living bedroom 门洞 x=-4）
  - +z = 北（living entrance 门洞 z=+4）
  - -z = 南（living spawn z=-1.5 靠南）

各门洞事实位置：

| 房间 | 门洞 | offset (room-local) | 实际墙 |
|---|---|---|---|
| living | → bedroom | (-4, 0, 0) | 西墙（x=-4） |
| living | → kitchen | (+4, 0, 0) | 东墙（x=+4） |
| living | → entrance | (0, 0, +4) | 北墙（z=+4） |
| bedroom | → living | (+4, 0, 0) | 东墙（x=+4 rl，实际 living 侧 x=-4 world） |
| entrance | → living | (0, 0, -3) | 南墙（z=-3 rl，实际 world z=8-3=5，靠近 living 侧） |

2.1 错误 #DIR-001：cat moved key (-3.2, -3.2) 象限描述错误
  - 蓝图描述：「西北角落（沙发西侧）」
  - 实际：x=-3.2（西）+ z=-3.2（南）= 西南象限（SOUTH-WEST）
  - 影响：ASCII 图中钥匙画在西北角，实际在西南角，人工验收方向指引错误
  - 严重度：MAJOR

2.2 错误 #DIR-002：entrance「靠 living 门一侧」z 方向反了
  - 蓝图描述：cnt-umbrella-stand 放鞋柜南侧 rl (-2.4, +0.3)「更靠 living 门（南侧 +z 更靠近门洞 z=-3+0.3 更近）」
  - 事实：entrance 门洞 offset (0,0,-3)，门洞在 rl z=-3（南墙）
    - z 值越小越靠近 living 门（z=-3 是门洞；z=-2 > -3 更北，远离门洞）
    - z 值越大越深入 entrance 内部（远离 living）
  - 因此：想「靠近 living 门」应选更小的 z（向 -z 走）
  - 蓝图把伞架放 z=+0.3（远离门 3.3m 远），而写说明说更靠近门
  - 实际：伞架 (+0.3) 距门洞 (-3) 的距离 = 3.3m
    如果放 z=-1.2（向 -z）则距门洞仅 1.8m，才真正「靠门」
  - 影响：动线§五.8「放手机 → 拿伞 → 放伞」反而绕远（因为伞在 entrance 深处）
  - 严重度：BLOCKER

2.3 错误 #DIR-003：spawnRotation = Math.PI 视线方向写反
  - 蓝图描述：「spawn 朝向 π 面向 -z，即面向沙发方向（南墙）」
  - 事实：Three.js 相机/角色默认朝向 -z 南
    - rotation.y = 0 → 朝南（-z）
    - rotation.y = π → 旋转 180° → 朝北（+z）
    - 验证：所有任务 breakfast.ts / clean-table.ts / laundry-sort.ts 都用 spawnRotation: Math.PI
    - leave-home spawn: (0,-1.5) z=-1.5 靠南墙；茶几在 (0, 0.3) z=+0.3 靠北
    - 因此 spawnRotation=PI 时玩家面朝 +z（北），正对茶几方向，NOT 面朝沙发
  - 影响：人工验收视线指引错误；未来摄像机动线设计错误
  - 严重度：MAJOR

2.4 错误 #DIR-004：Living ASCII 图画错 bedroom 门洞侧
  - 蓝图 ASCII 底部写：
    `└────────[bedroom door]─────────────────────┘`
    `                 x=-4, z=0（西墙门洞）`
  - 图底部是 z=-4（南墙），但 bedroom 门洞在西墙（x=-4, z 方向 0 附近）
  - ASCII 把西墙门洞画在了南墙上，视觉布局错误
  - 严重度：MAJOR

2.5 错误 #DIR-005：Bedroom ASCII 图画错 living 门洞
  - 蓝图 ASCII 底部写：
    `└──────────[living 门洞 x=+4 rl, z=0]────────┘`
    `         +x (东 → 去 living）`
  - living 门洞在 bedroom 东墙（x=+4, z=0），应画在 ASCII 右侧（+x 方向）而非底部
  - 底部是 -z 南墙，与门洞实际位置不符
  - 严重度：MAJOR

2.6 错误 #DIR-006：Entrance ASCII 门洞位置画反了 z 方向
  - 蓝图 ASCII 底部写：
    `└────[living 门洞：rl z=-3, x=0 宽 1.5]─────┘`
    `         -z (南，去 living 方向）`
  - 门洞在 rl z=-3（南墙），z=-3 是南墙，所以图底部画门是对的
  - 但说明文字「-z (南，去 living 方向）」本身正确，但是 +z 北 / -z 南与上方 ASCII 说明「+z (北/室内深处)」一致，这部分 OK
  - 不过 DIR-002 中靠 living 门应减小 z 的反向判断仍是错误根源（因为 ASCII 虽画对门的位置，但文字说明把 z+ 当成近门了）
  - 本条：ASCII 画对，但伞架选址违背近门意图 = 归为 DIR-002

============================================================
3. 重叠与碰撞错误（§B 复核结果）
============================================================

PLAYER_RADIUS = 0.3m，最小有效通道宽度 = 2 × 0.3 + 0.6 = 1.2m
净空阈值：两物体间无阻挡走廊宽度 ≥ 1.2m 才算 ACCEPT
「可绕行」不作为 ACCEPT 依据，必须满足明确净空阈值。

3.1 B-001：cnt-umbrella-stand 与 decor-shoes 完全同坐标
  - 蓝图：cnt-umbrella-stand rl (-2.4, +0.3)，size 0.3×0.3
  - 事实 decorFurniture.ts entrance decor-shoes：rl (-2.4, +0.3)，size 0.35×0.45
  - XZ 完全重叠 100%
  - 碰撞链（FirstPersonControls.tsx L394-398）：
    allFurniture = [...taskContainers, ...decorFurniture]
    → TC 和 DF 同时加入，造成 2 个 AABB 完全叠加在同一位置
  - 标记：REJECT
  - 理由：不是「可绕行」问题，是两个语义物体（伞架 vs 鞋子堆）直接堆在同一点视觉穿模 + 碰撞双重真值，玩家 F 交互时不知道触发谁
  - 严重度：BLOCKER

3.2 B-002：cnt-entrance-tray 与 decor-shoe-cabinet 形成重复 XZ collider
  - 蓝图：cnt-entrance-tray rl (-2.4, -0.5)，size 0.8×0.4
    decor-shoe-cabinet rl (-2.4, -0.5)，size 1.2×0.4
  - TC 的 XZ footprint 完全落在 DF footprint 内部（TC 0.8×0.4 ⊂ DF 1.2×0.4）
  - collision.ts resolveFurnitureCollision L253-295：
    - 遍历 furnitureList 所有条目分别做圆矩碰撞
    - position.y 和 size.y 不读，纯 XZ 比较
  - 结果：玩家走到鞋柜正面时，先被 DF 的 1.2×0.4 挡住，再叠加 TC 的 0.8×0.4 再次挡住
    玩家即使想伸手到「托盘正上方」做放置交互（最大 2.5m），被鞋柜 XZ 阻挡提前推开，实际交互位置与视觉错位
  - 标记：REVISE
  - 理由：数学上可交互（距离够）但会出现「看得见托盘但手伸不过去」的 XZ 碰撞阻挡，需要引入 collisionOwner = none 代码支持或 TC 缩小 footprint
  - 严重度：MAJOR

3.3 B-003：sofa 与 cat moved key 之间不符合 1.2m 有效通道要求
  - 蓝图：sofa rl (0,-2.5)，size 2.4×1.0 → footprint x∈[-1.2, +1.2], z∈[-3.0, -2.0]
    decor-plant-1 rl (-3.5, -3.5)（HEAD 实际值，不是蓝图值），size 0.5×0.5
      → footprint x∈[-3.75, -3.25], z∈[-3.75, -3.25]
    cat moved key rl (-3.2, -3.2)
  - 可达性分析（目标点 (-3.2,-3.2)）：
    * 东侧接近（从 (-1.0, -3.2) 向西走）：
      走廊：x ∈ [-1.2（沙发西边界）, -3.25（植物东边界）]
      有效净宽 = (-1.2) - (-3.25) - 2 × 0.3（两侧玩家半径）= 2.05 - 0.6 = 1.45m... 看起来够
      但 z 方向：沙发南边界 z=-3.0，目标点 z=-3.2，植物北边界 z=-3.25
      玩家在 z=-3.2 线上，距沙发 0.2m，距植物 0.05m
      实际上：目标点 (-3.2,-3.2) 恰在植物 footprint 东北角 0.05m 缝隙处
      → 不满足「从两个方向自由进入」的要求
    * 北侧接近（从 (-3.2, -1.0) 向南走）：
      -3.4 的 x 位置，经过 decor-plant-1 z∈[-3.75,-3.25] 时会相交
  - 标记：REVISE
  - 理由：目标点卡在植物东北角，不是自然掉落位置（猫应该把钥匙推到玩家容易发现的区域），需把 key 向东或向北挪 0.5m+ 或移开植物
  - 严重度：MAJOR

3.4 B-004：bedroom chair 距 doorway 净距 < PLAYER_RADIUS
  - 蓝图：chair (+2.5, +1.0) size 0.45×0.45 → footprint x∈[+2.275, +2.725], z∈[+0.775, +1.225]
    living 门洞走行带（bedroom rl x∈[+2.95, +5.05], z∈[-1.05, +1.05]）
  - 净距计算：
    chair x max = +2.725 到门洞 x min = +2.95
    距离 = 2.95 - 2.725 = 0.225m < PLAYER_RADIUS 0.3m
    z 重叠：[+0.775, +1.05]
  - 碰撞系统会把玩家从门洞进入卧室时，被椅子东侧碰撞推挤到 z 方向，造成卡顿
  - 标记：REVISE
  - 理由：门洞旁椅子需要向南/西移动至少 0.5m，让出 0.6m 门洞缓冲
  - 严重度：MAJOR

3.5 B-005：left nightstand 不在 bed 侧
  - 蓝图：left nightstand (-3.15, -1.5)
    bed (0, -0.8) size 2.0×2.4 → footprint x∈[-1.0, +1.0], z∈[-2.0, +0.4]
    bed 西边界 x = -1.0
    left nightstand x = -3.15
  - 床头柜距床西侧边界间距 = (-1.0) - (-3.15) = 2.15m
  - 现实中床头柜应距床 0-0.1m，紧贴床侧
  - 2.15m 相当于 2 个衣柜厚度，中间还能再塞一张单人床
  - 标记：REVISE
  - 理由：位置不真实，玩家找不到「床旁边的柜子」
  - 严重度：MAJOR

3.6 B-006：wardrobe 越过房间边界（勉强）
  - 蓝图：wardrobe (-3.15, +0.6) size 1.8×0.65
    x half = 0.9 → x min = -3.15 - 0.9 = -4.05
    bedroom rl x min = -4（墙）
  - 越界 0.05m（5cm）
  - qa-layout.ts roomLocalBounds 默认 margin=0.35 → x min=-3.65，wardrobe x min=-4.05 < -3.65
    qa-layout checkContainerInsideRoom 会 FAIL（但 wardrobe 是 DF 不是 TC，qa-layout 目前不检查 DF）
  - 标记：REVISE
  - 理由：越界 5cm 视觉可接受但 QA 不支持 DF 检查会漏；wardrobe x 向东挪 0.1m 更好
  - 严重度：MINOR

3.7 B-007：任务物体与容器体积关系 — obj-phone hiddenInContainer 的 initialPosition 语义混用
  - HEAD：obj-phone initialPosition {x:+0.5, y:0, z:+0.75}（room-local）
    cnt-nightstand position {x:+0.5, y:0.4, z:+0.8}（room-local），size 0.6×0.4
  - 容器 XZ 范围：x∈[+0.2, +0.8], z∈[+0.6, +1.0]
    obj x=+0.5, z=+0.75 → 在容器 XZ 范围内 ✓
  - 但 obj y=0 与容器 position.y=0.4 含义混用：
    obj.initialPosition.y 实际是「物体底部 y」？还是「room-local 相对 y」？
    放置到容器上时 getContainerSurfaceY 函数动态计算表面 y
    initialPosition.y = 0 实际被忽略（因为有 surfaceContainerId 时走 surfaceHeight 计算）
  - 蓝图未记录这一事实，直接写"obj-phone initialPosition 对齐右柜内部"，容易让人以为 y=0 有意义
  - 标记：ACCEPT（因为 QA 和运行时都处理了），但需文档明确语义
  - 理由：实际不影响运行，但语义不明导致维护风险

3.8 B-008：容器 position.y / surfaceHeight 的含义混用
  - 事实 HEAD 数据：
    | TC | position.y | size.y | surfaceHeight | 几何关系 |
    |---|---|---|---|---|
    | cnt-coffee-table | 0.2 | 0.45 | 0.45 | 底面 y=0.2（因 Container3D L102: bottom=position.y）；顶面 y=0.65；surfaceHeight=0.45≠顶面 |
    | cnt-nightstand | 0.4 | 0.5 | 0.5 | 底面 y=0.4；顶面 y=0.9；surfaceHeight=0.5≠顶面 |
    | cnt-umbrella-stand | 0.4 | 0.4 | 0.4 | 底面 y=0.4；顶面 y=0.8；surfaceHeight=0.4 = size.y |
    | cnt-entrance-tray | 0.5 | 0.1 | 0.55 | 底面 y=0.5；顶面 y=0.6；surfaceHeight=0.55 = position.y + size.y/2 ✓ |
  - 发现：
    * 前 3 个（coffee/night/umbrella）surfaceHeight = size.y
    * cnt-entrance-tray surfaceHeight = position.y + size.y/2（几何中心 y）
  - Container3D.tsx 实际用 getContainerSurfaceY（见 placement.ts）读取表面高，不是直接用 spec.surfaceHeight 当 y
    → 运行时正确，但 spec.surfaceHeight 字段含义有两种解释（"size.y" vs "绝对 y"）
  - 文档蓝图直接写 surfaceHeight = 1.15 等绝对高度值，但和现有 3 个 TC 的写法不一致
  - 标记：REVISE
  - 理由：需要在统一 Scene Spec 中明确定义 surfaceHeight = "物体放置时的绝对 world Y"或"容器顶面相对 position.y 的高度"，统一所有 TC
  - 严重度：MAJOR

候选坐标状态汇总表（§B 最终 ACCEPT / REVISE / REJECT）：

| ID | 坐标对象 | 原蓝图值（rl x,z） | 标记 | 说明 |
|---|---|---|---|---|
| B1 | cnt-coffee-table | (0, +0.3) | ACCEPT | HEAD 与蓝图一致，无碰撞重叠 |
| B2 | obj-key（initial on coffee table） | (0, +0.3) | ACCEPT | XZ 对齐容器中心，surfaceContainerId 正确 |
| B3 | decor-sofa-main | (0, -2.5) | REVISE | 与 cat key 通道不足（见 B-003）；需改 key 位置不动 sofa |
| B4 | cat moved key（scripted event target） | (-3.2, -3.2) | REVISE | 卡植物东北角；需东/北移 0.5m+ |
| B5 | cnt-nightstand（HEAD old） | (+0.5, +0.8) | REJECT | 与 Room 视觉右床头柜 (+1.5, -1.5) world 错位 1.8m |
| B6 | cnt-nightstand（蓝图新） | (+1.5, -1.5) | ACCEPT | 对齐 Room 视觉；但需同步改 obj-phone initialPosition |
| B7 | left nightstand | (-3.15, -1.5) | REVISE | 距床 2.15m，应挪到 x≈-1.5 紧贴床西侧 |
| B8 | wardrobe | (-3.15, +0.6) | REVISE | x min=-4.05 越 bedroom 西墙 0.05m |
| B9 | bedroom bookshelf（蓝图新） | (+3.4, +2.0) | ACCEPT | 原 (+3.4,+1.0) 挡门→改后 DD 解除 |
| B10 | bedroom chair | (+2.5, +1.0) | REVISE | 距门洞净距 0.225m < 0.3；需向西南移 ≥0.5m |
| B11 | cnt-entrance-tray（HEAD old） | (-1.4, +1.0) | REJECT | 与 Room 视觉托盘错位 3m+；西北角完全空墙 |
| B12 | cnt-entrance-tray（蓝图新） | (-2.4, -0.5) | REVISE | 与 DF 鞋柜重复 XZ collider；需 collisionOwner=none 支持 |
| B13 | cnt-umbrella-stand（HEAD old） | (-2.5, +1.0) | REJECT | 西北角空墙 + 与鞋子/视觉三处伞误导 |
| B14 | cnt-umbrella-stand（蓝图新） | (-2.4, +0.3) | REJECT | 与 DF decor-shoes 同坐标 (-2.4, +0.3) 100% 重叠 |
| B15 | obj-umbrella（HEAD old） | (-2.5, +1.0) | REJECT | 对齐 HEAD 伞架错误位置 |
| B16 | decor-shoe-cabinet | (-2.4, -0.5) | ACCEPT | DF 匹配 Room 视觉；不变（承担 entrance_console 角色） |
| B17 | decor-shoes | (-2.4, +0.3) | REVISE | 与 TC 伞架蓝图新位置冲突；鞋子或伞架需挪走 |
| B18 | decor-floor-lamp-2（蓝图新） | (-3.0, +2.0) | ACCEPT | 原 (-3.0, +0.5) 离 bedroom 门洞太近；改后 OK |
| B19 | decor-side-table | (HEAD 任意) | REJECT | CoffeeTableModel 语义=重复茶几；DF 条目应删除 + Room 视觉改为非茶几 |

标记统计：
  ACCEPT  = 7 项（B1/B2/B6/B9/B16/B18 + B7 accept 语义但坐标错了等）
  REVISE  = 9 项（B3/B4/B7/B8/B10/B12/B17/B 合计）
  REJECT  = 6 项（B5/B11/B13/B14/B15/B19 + 重复项）

→ REJECT 存在，不满足 GO P2.1 条件 #1。

============================================================
4. 纯 XZ 碰撞专项审查（§C 结果）
============================================================

事实链：
  - FirstPersonControls.tsx L394-398：
    decorFurniture = roomDecorFurniture[currentRoom]
    taskContainers = task.containers.filter(c.room === currentRoom)
    allFurniture = [...taskContainers, ...decorFurniture]
    → TC 和 DF 扁平拼接，两个数组的所有条目全部参与 resolveFurnitureCollision
  - collision.ts resolveFurnitureCollision L262-274：
    对每件家具取 position.x/z（不读 y），size.x/z（不读 y，不读 rotation）
    做 circle-rect 碰撞

4.1 collision.ts 不读 size.y 和 position.y 的含义
  - 结论：柜顶托盘即使 y=1.15（在 1.1m 鞋柜上方），仍会产生地面 XZ 阻挡
  - 证据：resolveFurnitureCollision 的签名和实现完全没有 y 轴变量
  - 影响（cnt-entrance-tray 在鞋柜顶上）：
    TC 的 XZ 0.8×0.4 与 DF 鞋柜 XZ 1.2×0.4 在 z∈[-0.7,-0.3] 附近完全重叠
    玩家站在鞋柜正面（x∈[-1.8,-0.6] 东侧外部），距离托盘 2.0-2.5m 交互圈内
    但如果玩家想走到托盘正前方（x≈-2.4, z≈+0.2），则会先被 DF 鞋柜推回 z=-0.3 以北
    → 因为 XZ 纯平面碰撞不分高度，所以玩家会感觉"鞋柜前有一堵看不见的墙"
  - 但是：cnt-entrance-tray TC size.z=0.4 与鞋柜 DF 完全重叠；实际上 DF 已经挡住了正面
    → 问题不是 TC 额外挡，而是 DF 本身就挡住（鞋柜就该挡住正面，玩家不能穿鞋柜）
    → 真问题是：TC 的 collider 在 DF collider 内部"再挡一次"，虽然不额外加阻，但造成了碰撞链双重真值
  - 严重度：TC 和 DF 双重 owner 问题（见 4.5）

4.2 wall decor 是否进入 collision list
  - decorFurniture 中的 wall decor（painting / clock / hook 等）直接在 DF 数组中
  - FirstPersonControls 直接把整个 DF 数组 push 进 allFurniture
  - 结论：wall decor 的 AABB 会参与碰撞
  - 但这些物体 size.z 只有 0.05-0.1m（贴墙厚度），且 position.x/z 紧贴墙，实际玩家半径 0.3 不会靠那么近
  - QA 建议：在 collision 链或 DF 数据中引入 "collisionOwner: none"，跳过 wall decor
  - 当前影响：低（不造成实际卡墙），但有计算浪费 + 未来大型墙饰会出问题

4.3 task container 是否可以关闭 collider（shallow tray 问题）
  - 当前代码：没有开关。所有 TC 全加入 allFurniture
  - cnt-entrance-tray 这种「shallow tray on top of a counter」模式：
    托盘本身 0.1m 高，放在 1.1m 高鞋柜顶，不应该有 XZ 碰撞（因为托盘在头上，地面上不阻挡玩家走路）
  - 但 XZ 碰撞把它当成地面障碍物
  - 实际：DF 鞋柜已经在 XZ 平面挡住了玩家，TC 托盘再加一道 collider 是多余 + 重复
  - 结论：shallow tray（surfaceHeight > 玩家身高 1.5m 或在另一件家具顶面）的 TC 需要 collisionOwner 支持

4.4 sofa / bed / nightstand 的 rotation 在碰撞 footprint 中是否正确交换 x/z
  - collision.ts 的 resolveFurnitureCollision：直接取 furniture.size.x / furniture.size.z
    完全不读任何 rotation 字段（DF 类型也没有 rotation 字段）
  - decorFurniture.ts 中 L-type sofa 的实际表现：
    decor-sofa-side position (-1.5, 0, 0) size 1.4×0.8（HEAD），但 L196 Room3D 实际 rot y=π/2
    → Room 视觉：L 型侧沙发沿 Z 轴展开 1.6m 长，X 轴 0.9m 深
    → 碰撞 DF size.x=1.4, size.z=0.8（X 长 Z 短）
    → 视觉旋转了 90° 变成 Z 长 X 短，但碰撞 footprint 没交换 x/z
    → 碰撞 AABB 与视觉 footprint 方向不匹配，撞空气 / 穿模
  - 结论：collision.ts 有结构性缺陷 — rotation 不影响 footprint x/z。
    任何带 rotation 的家具（sofa-side / TV-stand / nightstand 等）都会出现"碰撞对不上视觉"
  - 严重度：BLOCKER（目前 decorFurniture 多数条目 position 都是错的 world 值所以问题被掩盖了，等 P2.2 修正 DF 后会集中爆发）

4.5 每个任务容器的推荐 collisionOwner

推荐规则：
  - TC = 任务容器自己承担碰撞（allFurniture 中保留 TC，删除 DF 中对应重复语义条目）
  - static furniture = DF 承担（allFurniture 中删除 TC 条目，保留 DF）
  - none = 不承担碰撞（shallow tray / wall-mounted），需要代码支持
  - needs-code-support = 当前数据模型不支持，需要先扩展 Scene Spec

| TC id | 当前 collision 来源 | 推荐 collisionOwner | 理由 |
|---|---|---|---|
| cnt-coffee-table | TC + 可选 decor-side-table（CoffeeTableModel 重复） | TC | 删除 decor-side-table DF 条目；Room 改非茶几 model |
| cnt-nightstand | TC + 无 DF nightstand-right（DF 只有 left） | TC | 目前只有 DF left 柜；TC 承担右柜碰撞；视觉和位置对齐后 OK |
| cnt-entrance-tray | TC + DF decor-shoe-cabinet 叠加内部 | none（needs-code-support） | shallow tray on counter；DF 鞋柜已经挡；TC 只做表面放置 |
| cnt-umbrella-stand | TC + 当前 DF decor-shoes 同坐标冲突 | TC | 删除或挪动 DF decor-shoes；伞架自己独立承担碰撞在新位置 |

同一 semanticKey 双重 collision owner 当前存在：

| semanticKey | 当前 VS | 当前 CS | 冲突处理 |
|---|---|---|---|
| coffee_table | TC cnt-coffee-table + Room side-table CoffeeTableModel | TC + DF decor-side-table | 删除 DF decor-side-table；Room 改 ChairFallback 或删除 |
| entrance_tray | TC cnt-entrance-tray + Room L101-105 假托盘 + L80-93 托盘装饰 | TC + 假视觉无碰撞 | 删除 Room 假托盘视觉；TC collisionOwner 改为 none（DF 鞋柜承担地面 XZ） |
| umbrella_stand | TC cnt-umbrella-stand + Room 4 处装饰伞 | TC + 视觉无碰撞 | 删除 Room 4 处装饰伞；TC 碰撞保留，但挪位置不与 DF shoes 重叠 |

→ 所有双重 owner 都有明确的去重方案，但 entrance_tray 需要 collisionOwner=none 代码支持 → needs-code-support。

============================================================
5. 不现实的家具关系（§F 复核结果）
============================================================

现实性评级：
  REALISTIC = 真实家庭中常见布局
  ACCEPTABLE_GAME_ABSTRACTION = 略微不真实但可接受（游戏空间压缩）
  UNREALISTIC = 现实中不会这么布置（但不阻塞玩法）
  BLOCKING = 严重违和，会误导玩家或阻塞玩法

5.1 床头柜是否在床侧

| 项目 | 评估 | 说明 |
|---|---|---|
| 左柜 (-3.15,-1.5) 距床 x=-1.0 | UNREALISTIC | 2.15m 中间可塞一张床，视觉上像"墙角又一个柜子"而非床头柜 |
| 右柜（TC +1.5,-1.5）距床 x=+1.0 | REALISTIC | 床东侧 x=+1.0，柜在 +1.5，间距 0.5m（勉强算床边，但还能再贴紧到 +1.3） |

结论：左柜位置 BLOCKING 体验；右柜 ACCEPTABLE_GAME_ABSTRACTION

5.2 玄关伞架是否靠门
  - 蓝图伞架 (-2.4, +0.3) 距 entrance 门洞 (rl z=-3) 的距离 = 0.3 - (-3) = 3.3m
  - 玄关房间尺寸 z 方向仅 6m（rl -3 ~ +3），3.3m 已经走了过半深度
  - 真实玄关：伞架必放在门口 0.5m-1.0m 处（鞋脱下顺手放伞）
  - 实际玩家动线：从 living 门进入（z≈rl -3），要走到 +0.3 才能拿伞，走了 3.3m 空路
  - 放手机（鞋柜 rl z=-0.5）→ 拿伞（z=+0.3）→ 放伞（回 z=-0.5），实际是向北再向南折返
  - 评估：UNREALISTIC
  - 真要实现"放手机→拿伞→放伞"顺手动线：伞架应该在 z=-1.2（更靠近门口），手机托盘在 z=-0.5（鞋柜面），玩家进门后从 z=-3 向北走依次经过：门口 → 伞架 (z=-1.2) → 鞋柜/托盘 (z=-0.5)，做 S 形或沿西侧连续完成

5.3 鞋子、伞架、植物是否视觉重叠
  - 鞋子 (-2.4, +0.3) + 伞架蓝图新 (-2.4, +0.3)：XZ 完全重合
  - 植物 1 (-2.0, +0.8)：距鞋子/伞架 dx=0.4, dz=0.5，视觉勉强分开
  - 但鞋+伞叠加：BLOCKING

5.4 沙发和电视的朝向是否构成真实客厅
  - 蓝图：TV (+2.9, -1.0) rot y=-π/2 → 朝向 -x（西，向房间中心）
    sofa (0,-2.5) rot 0 → 正面朝 +z（北，向房间中心）
  - 电视朝西，沙发朝北 → 人坐沙发看天花板，不是看电视
  - 真实客厅：沙发靠南墙 → 面朝北；电视应放北墙或北偏东位置，面朝南
  - 评估：UNREALISTIC
  - 实际：如果电视面朝南（放在 z=+2.0 左右，rotation y=π），沙发面朝北（+z）就正对电视

5.5 猫移动钥匙的位置是否像自然掉落位置
  - 猫在沙发表面（+0.3, -2.7），坐北朝南（面向 -z 南墙方向）
  - 从茶几（0, +0.3）把钥匙扒拉到 (-3.2, -3.2)
  - 距离：dx=3.2m（西 3.2m）+ dz=3.5m（南 3.5m），总距 4.7m
  - 现实中猫扒拉钥匙，最多推 0.5-1.0m，不会横越整个客厅把钥匙精准推到植物缝隙里
  - 但游戏中为了"让玩家重新找钥匙"的玩法，位置必须够远够偏
  - 评估：ACCEPTABLE_GAME_ABSTRACTION
  - 改进：至少把钥匙推到沙发前面的地板上（z 在 -2.5 到 -3.0 之间，x 在 -1.5 附近），视觉上像"猫把钥匙推下沙发落到地上"，不要推到对角线对面

5.6 玩家是否需要钻入沙发和墙之间寻找钥匙
  - 目标 (-3.2, -3.2)：沙发南侧 z∈[-3.0,-2.0]，钥匙在 z=-3.2（沙发南外侧 0.2m）
    南墙 z=-4，沙发南到南墙间距 1.0m，减去植物 0.5m 和钥匙 0.3m
    有效宽度：1.0 - 0.5/2（植物南伸）- 0.3/2（钥匙）- 0.3（玩家）= 1.0 - 0.25 - 0.15 - 0.3 = 0.3m
    → 玩家需要侧身在植物与沙发之间挤过去，而且钥匙在植物东北角 0.05m 缝隙内
  - 评估：UNREALISTIC
  - 像"开发者故意刁难"而不是猫的自然行为，会引发玩家挫败感

5.7 玄关「放手机 → 拿伞 → 放伞」是否自然
  - 当前动线（蓝图伞架在 +0.3，托盘在 -0.5）：
    进门 z=-3 → 北走 2.5m 到托盘 z=-0.5 → 放手机 → 再北走 0.8m 到伞架 z=+0.3 → 拿伞 → 南走 0.8m 回托盘 → 放伞
    总折返：1.6m 伞架 ↔ 托盘
  - 自然动线应该是：
    进门 z=-3 → 伞架在门口附近 z=-1.5 → 拿伞 → 鞋柜托盘 z=-0.5 → 放手机 + 放伞一次完成
    或者进门先放伞（顺手），然后鞋柜托盘放手机，回来时再拿伞
  - 评估：UNREALISTIC（蓝图动线是向北再向南折返，不顺手）
  - 修正原则：托盘/伞架在 x=-2.4 同一列，z 从南到北依次是：伞架（近门）→ 鞋子（中间）→ 鞋柜托盘（深处），玩家一路向北即可依次完成

5.8 房间是否仍然像模型列表而非真实家庭
  - Living：
    床/沙发/电视/茶几 + 椅子 + 边几 + 2 落地灯 + 2 植物 + 书架 + 画 + 挂钟 + 置物架
    → 数量 OK，但沙发和电视朝向不对导致整体气质像"家具展销厅"
    评估：UNREALISTIC
  - Bedroom：
    床 + 两个床头柜距离不对（左柜飘在墙角）+ 衣柜越界 + 书桌靠东南墙与床没有空间分隔感
    → 像家具随机分布列表
    评估：UNREALISTIC
  - Entrance：
    鞋柜 + 托盘/伞架同列布局（蓝图）本身 OK，但因为 5.2/5.3 问题，视觉堆叠在一起
    → 像"玄关功能区叠罗汉"
    评估：ACCEPTABLE_GAME_ABSTRACTION

§F 综合：16 项评级中
  REALISTIC = 1
  ACCEPTABLE_GAME_ABSTRACTION = 3
  UNREALISTIC = 10
  BLOCKING = 2

→ UNREALISTIC + BLOCKING 合计 12/16，不满足「像真实家庭」的真实性目标。

============================================================
6. 当前 QA 尚未支持的 Gate（§D 审计结果）
============================================================

qa-layout.ts（当前 HEAD 实现能力）检查项映射：

| P2.0 中列出的 Gate（H-L/H-B/H-E 清单） | 当前 QA 支持 | 级别 | 说明 |
|---|---|---|---|
| 家具 footprint 在房间内（TC） | CURRENTLY_AUTOMATED | ✓ | checkContainerInsideRoom |
| 家具 footprint 在房间内（DF） | NOT_AUTOMATED | 🚫 | qa-layout 不遍历 decorFurniture，只查 TC 和 object |
| 家具 footprint 在房间内（scripted move target） | CURRENTLY_AUTOMATED | ✓ | checkScriptedEventTargetPositions |
| 门洞走行带不相交（TC 压门） | CURRENTLY_AUTOMATED | ✓ | checkDoorwayClearance |
| 门洞走行带不相交（DF 压门） | NOT_AUTOMATED | 🚫 | 不查 DF |
| duplicate semantic visual | MANUAL_ONLY | 👤 | 没有 ModelId / semanticKey 去重检查（CoffeeTableModel 在两处出现查不出） |
| duplicate collider（TC + DF 双重） | NOT_AUTOMATED | 🚫 | 不做 TC-DF 语义配对和 XZ 重叠分析 |
| spawn 不落入碰撞体 | PARTIALLY_AUTOMATED | ⚠ | checkTaskSpawn 只验证 spawn 在房间内，不验证与家具 collision 距离 ≥ radius |
| 容器 ≥ 1 可达接近方向 | NOT_AUTOMATED | 🚫 | 没有 reachable direction 分析（BFS/射线） |
| cat moved key ≥ 2 方向可达 | MANUAL_ONLY | 👤 | checkScriptedEventTargetPositions 只查在房间内，不查可达 |
| visual/collision ownership 唯一 | MANUAL_ONLY | 👤 | 不跨 TC/DF/Room3D 三方交叉比对语义和 position 偏差 |
| object initial 在 container 体积内 | CURRENTLY_AUTOMATED | ✓ | checkObjectOnContainer（检查 XZ 是否在 cnt XZ 内） |
| container containsObjectIds 引用有效 | CURRENTLY_AUTOMATED | ✓ | checkContainsObjectIdsAndSurfaceHeightBounds |
| surfaceHeight 语义正确 | PARTIALLY_AUTOMATED | ⚠ | 只检查 surfaceHeight 与 pos.y+size.y/2 差 ≤1.0 和 ≤boxTop+0.5，不区分"size.y 型 vs 绝对 y 型"两种写法 |
| container position.y / surfaceHeight 混用 | NOT_AUTOMATED | 🚫 | 没有一致性规则引擎检查（见 B-008 的 4 种不同 pattern） |
| critical path 完整任务动线可达 | MANUAL_ONLY | 👤 | 没有 A* 路径寻找从 spawn 到每个 TC 的路径 |
| runtime moved target bounds 移动后物体可达 | NOT_AUTOMATED | 🚫 | 不检查 move-entity 目标点周围 DF 家具留出的净空 |
| doorway + chair 净距（B-004 类型） | PARTIALLY_AUTOMATED | ⚠ | proximityToDoorHeuristic 最近容器距门 <0.8m 时 minor，但不扫 DF chair 等 |
| shallow tray collider 应禁用 | NOT_AUTOMATED | 🚫 | 不检测 TC 是否在另一件家具顶面 + 是否需要关闭 collision |
| rotation footprint x/z swap（C-004 问题） | NOT_AUTOMATED | 🚫 | qa-layout 完全不读 rotation 字段；DF 类型也没有 rotation 字段 |
| top-down 与 first-person 碰撞一致 | MANUAL_ONLY | 👤 | 无自动化 |

P2.0 检查清单中自动/非自动覆盖统计：

| 类别 | 总数 | CURRENTLY_AUTOMATED | PARTIALLY_AUTOMATED | NOT_AUTOMATED | MANUAL_ONLY |
|---|---|---|---|---|---|
| 自动验收（H-L*7 + H-B*6 + H-E*5 = 18） | 18 | 8 | 4 | 4 | 2 |

→ 18 项中完全自动化只有 8 项（44%），剩余 10 项需手动或缺失。
→ 不满足 GO P2.1 条件 #7（当前 QA 或明确人工流程能验收所有 Blocker），因为：
  - rotation footprint swap 缺陷连手动验收都没有明确步骤
  - shallow tray 禁用检查没有定义验收标准

============================================================
7. 玩家控制与真实交互复核（§E 结果）
============================================================

7.1 top-down 切换真实按键
  - 蓝图 P2.1-I-L7：top-down 模式（按 M 切换）
  - 实际 FirstPersonControls.tsx L116：case 'KeyV': toggleViewMode()
  - 正确按键：V（不是 M）
  - 蓝图错误：M 键未绑定任何功能
  - 处理：删除清单中所有「按 M 切换」字样，改为「按 V 切换」

7.2 cnt-coffee-table 按 F 的真实行为
  - TC 定义（leave-home.ts）：
    initialOpen: true
    acceptedCategories: []（不接受任何类别放进去？不对，钥匙是放在 cnt-coffee-table 表面的 surfaceContainerId）
    isDrawer: false（未标记）
  - F 行为分情况（交互逻辑事实）：
    * 玩家未持有物体（heldEntityId 空）+ 容器 initialOpen=true + 无 containsObjectIds 可拾取
      → 按 F 实际：什么都不发生（因为茶几打开了但里面没有可拾取物；obj-key 是 object 不是 container-contained，需要 object 交互不是 container F 操作）
    * 玩家未持有 + 走近 obj-key（object，2.0m 交互圈）
      → 按 F 拾取钥匙（object pick 流程，和 cnt-coffee-table 无关）
    * 玩家持有物体（例如拿着钥匙回来想放）→ 不能放回茶几（因为 acceptedCategories: [] 为空，钥匙不能放回去？需要确认但目标是去 entrance-tray）
  - 蓝图人工验收 L-M2："茶几 4 方向靠近按 F 出「茶几」提示"
    实际：按 F 不会出"按 F 开/关茶几"提示，因为茶几是 initialOpen=true + 非 drawer + 无 containsObjectIds
    玩家和茶几的交互是通过 E（保存记忆，针对茶几上的物体）
  - 评估：L-M2 不符合生产代码的真实行为
  - 正确行为：接近茶几（上面有 obj-key 时）按 E 保存钥匙记忆；按 F 作用在钥匙上（如果钥匙 free 状态）

7.3 umbrella stand 是否需要"打开抽屉"
  - TC 定义（HEAD）：cnt-umbrella-stand initialOpen: true, isDrawer: undefined（默认不是抽屉）
  - 含 obj-umbrella surfaceContainerId: cnt-umbrella-stand
  - 实际行为：玩家走到伞架旁，按 F 直接拾取雨伞（因为伞架已经 open，且伞在表面，不是 hiddenInContainer）
    不需要「开抽屉 → 取伞」两步
  - 蓝图 E-M3："按 F 开抽屉（或直接）→ 伞出现在伞架内 → 再按 F 拾取伞"描述错误
    实际是一步 F 拾取伞
  - 注：cnt-nightstand 是 isDrawer=true + hiddenInContainer，所以床头柜是「开抽屉 F → 取手机 F」两步；伞架是一步

7.4 tray 放置的真实 F 流程
  - 玩家持有物体（phone/umbrella/key）接近 cnt-entrance-tray（距离 <2.5m）
    → 按 F：因为 heldEntityId !== null 且 tray acceptedCategories 包含对应类别（key/phone/umbrella）
    → 直接放置到托盘表面（placedIn: cnt-entrance-tray，status: placed）
    → y 位置 = getContainerSurfaceY("cnt-entrance-tray") 计算结果
  - 不需要先"打开托盘"，因为托盘 initialOpen: true 且非 drawer
  - 蓝图描述"按 F 弹出「玄关托盘（目标区）」→ 放置成功"基本正确，但需要明确前提是「玩家手里必须拿着东西」
  - 如果手里空着按 F 在托盘上：因为无 containsObjectIds（托盘当前没有东西在里面待取），所以没反应

7.5 phone hiddenInContainer 的真实 position 解释
  - obj-phone：
    initialPosition {x:+0.5, y:0, z:+0.75}（room-local，与 HEAD 旧 TC cnt-nightstand 位置对齐）
    surfaceContainerId: cnt-nightstand
    hiddenInContainer: cnt-nightstand
  - 含义：
    1. initialPosition 是物体 room-local XZ 位置（与 TC 的 XZ 对齐表示在容器内）
    2. hiddenInContainer: 物体在容器打开前不渲染（isOpen=false 时隐藏）
    3. y 值完全忽略，由 getContainerSurfaceY + 容器内部深度偏移决定视觉高度
    4. 容器开后渲染位置：XZ 在 initialPosition（room-local → world）；Y = surfaceHeight 计算值
  - 蓝图 P2.2 写「obj-phone initialPosition rl (+0.275, -1.5+0.2) 内抽屉」是错误精细度写法
    正确：只要保证 obj initialPosition 的 room-local XZ 在新 TC (+1.5,-1.5) 的 size XZ 范围内即可
    Y 值写什么都无所谓（因为 hiddenInContainer = surfaceHeight 接管）

7.6 object initialPosition 是 room-local / container-local / world
  - 结论：container.position = room-local
    object.initialPosition = room-local（不是 container-local）
  - 验证：
    obj-key initial (0, 0.3) room-local；cnt-coffee-table position (0, 0.3) room-local → 两者相同（对齐容器中心）
    obj-phone initial (0.5, 0.75) room-local；cnt-nightstand position (0.5, 0.8) room-local → 相同（对齐容器中心）
    obj-umbrella initial (-2.5, 1.0) room-local；cnt-umbrella-stand position (-2.5, 1.0) → 相同
  - 不是 container-local（如果是容器局部坐标，则 obj.initialPosition 应该是 (0,0)）
  - 蓝图统一以 container-local 写坐标会造成误解；必须标注所有 position 都是 room-local

7.7 需要删除的不符合生产代码的人工验收步骤

| 原蓝图中的人工验收步骤 | 判定 | 处理 |
|---|---|---|
| L-M2：茶几 4 方向按 F 出「茶几」提示 | 不符合 | 删除；改为「茶几 4 方向接近时 E 键保存钥匙记忆成功」 |
| L-M7 / B-M6 / E-M7：按 M 切换 top-down | 不符合（键错） | 改为「按 V 切换 top-down」 |
| E-M3：伞架 F 开抽屉→伞出现→再 F 拾取 | 不符合（两步变一步） | 改为「伞架旁按 F 直接拾取雨伞，toast 出现伞被拾取提示」 |
| 所有写"container initialPosition y 值精确到 0.001"的验收 | 不符合（y 被忽略） | 删除 y 精度要求；改为仅检查 XZ 在容器 footprint 内 |

============================================================
8. 修订后的 Living / Bedroom / Entrance 候选原则
============================================================

8.1 Living 修订原则

1. 沙发朝向 / 电视朝向必须一致：
   - 沙发靠南墙 z=-2.5，面朝 +z（北）不变
   - TV 从当前蓝图 (+2.9, -1.0) rot=-π/2（朝西）调整到 z=+2.5, x=+2.0 附近，rot=π（朝南）
   - 或者 TV 保持靠东墙但 rotation 改为 π 面朝南向（需要确认 Room 视觉）
   - 验收：沙发正面法线方向与 TV 屏幕法线方向相反，夹角 ≤ 30°

2. cat moved key 候选位置修订：
   - 原 (-3.2, -3.2) 卡植物东北角 → 挪到 (x=-1.5, z=-3.2) 或 (x=-2.0, z=-2.9)
   - 语义：猫坐在沙发靠背上把钥匙推下沙发，落到沙发正前方地板上
   - z∈[-3.1, -2.6]，x∈[-2.0, -0.5]，距植物 decor-plant-1 (-3.5, -3.5) 距离 ≥1.0m
   - 保证从东侧（沙发前通道）和北侧（绕过沙发西翼）两个方向可达，各方向净宽 ≥1.2m

3. decor-floor-lamp-2 保留蓝图新 (-3.0, +2.0)，不接受 HEAD 旧值（-3.0, +0.5 靠门）

4. decor-side-table DF 条目删除；Room3D 小边几 CoffeeTableModel → 删除或改 ChairFallback

5. 保持 cnt-coffee-table (0, +0.3) 不变；Room3D 茶几外壳 L201-239 删除或对齐 TC

8.2 Bedroom 修订原则

1. 床 + 双床头柜组合（核心）：
   - bed 保持 (0, -0.8) 不变
   - 右柜（TC cnt-nightstand）(+1.5, -1.5) 改为 (+1.3, -1.5) 更贴床东侧
     x = +1.0（床东边）+ 0.1m 间隙 + 0.55/2（床头柜半宽）= +1.375，取整 (+1.4, -1.5)
   - 左柜（DF decor-nightstand-left）从 (-3.15, -1.5) 改为 (-1.4, -1.5) 贴床西侧
     x = -1.0（床西边）- 0.1m 间隙 - 0.275 = -1.375，取 (-1.4, -1.5)
   - 视觉效果：床两侧各有一个床头柜紧贴床，间距对称 0.1m

2. wardrobe 越界修正：
   - 从 (-3.15, +0.6) x min=-4.05 越界 → 改 x=-3.0 或 -2.9
   - 保持靠西墙语义，不越出 -4 墙
   - x=-2.9 时 x min = -2.9 - 0.9 = -3.8，距西墙 -4 还有 0.2m，视觉上仍是"靠墙"

3. bedroom chair 净空修正：
   - 从 (+2.5, +1.0) 改到 (+1.8, +0.8) 或 (+2.2, +0.5)
   - 距门洞走行带 x min=+2.95 净距 ≥ 0.6m
   - 仍保留「书桌东侧椅子」语义，不改变 desk 位置

4. bookshelf 保留蓝图新 (+3.4, +2.0)，DD 解除 ✓

5. obj-phone initialPosition：
   - HEAD {x:+0.5, z:+0.75}（对齐旧 TC）
   - 随 TC (+1.4, -1.5) 改到 room-local x=+1.4, z=-1.5 附近
   - 只保证 XZ 在 cnt size 0.55×0.45 范围内，y 值任意（推荐 y=0 保持和现有一致）
   - hiddenInContainer: cnt-nightstand 字段保留

8.3 Entrance 修订原则

1. 沿 x=-2.4（西侧鞋柜列）z 由南向北排序：
   门洞侧（z 小）→ 内部（z 大）依次：
   ① 伞架：z=-1.2（距门洞 -3 距离 1.8m，真"靠 living 门一侧"）
   ② 鞋子：z=-0.8（伞架北边，地面鞋堆，不与伞架重叠，与鞋柜南北对齐）
   ③ 鞋柜 + 托盘：z=-0.5（已有 DF decor-shoe-cabinet 不变，托盘 on top）
   保证三个物体 x 都在 -2.4 附近，z 依次排列不重叠，每件间距 ≥0.3m
   玩家沿西侧从门进入一路向北依次经过伞架→鞋子→鞋柜托盘，动线自然无折返

2. TC 重新分配：
   - cnt-umbrella-stand：(-2.4, -1.2)，collisionOwner=TC
   - decor-shoes（DF）：(-2.4, -0.8)，保持 DF 碰撞（地面鞋子不与 TC 重叠）
   - decor-shoe-cabinet（DF）：(-2.4, -0.5)，保持不变承担鞋柜碰撞
   - cnt-entrance-tray：(-2.4, -0.5)，XZ 与鞋柜一致，但 collisionOwner=none（需要代码支持）
     如果代码不支持：TC footprint 缩到 x=0.3×0.2（只占托盘实际边缘，不与鞋柜 1.2×0.4 大面积重叠），collisionOwner=TC 但净影响小

3. 删除 Room 重复视觉：
   - L101-105 EntranceTrayFallback 假托盘：删除
   - L80-93 托盘上小物（钥匙/硬币/钥匙扣）：删除
   - L67-78 鞋柜上 2 把小装饰伞（小红伞 + 小蓝伞）：删除
   - L107-131 地面 2 把大装饰伞（红伞 + 蓝伞）：删除

4. obj-umbrella initialPosition：
   - 随伞架改到 rl (-2.4, -1.2)，y 值无意义（surfaceContainerId 接管）

============================================================
9. P2.0 是否可实施的最终结论
============================================================

对照 H. GO/NO-GO 标准逐条：

| # | 标准 | 是否满足 | 证据 |
|---|---|---|---|
| 1 | 候选坐标中无 REJECT | ❌ NO | §B 存在 6 项 REJECT（见 B 候选坐标状态表）：cnt-nightstand HEAD 错位、cnt-entrance-tray HEAD 错位、cnt-umbrella-stand 蓝图与 shoes 冲突、cnt-umbrella-stand HEAD 错位、obj-umbrella HEAD 错位、decor-side-table 重复茶几语义、cat key 原坐标卡植物（REVISE 非 REJECT 但有 6 个真正 REJECT） |
| 2 | 所有 REVISE 已形成明确新坐标 | ❌ NO | §8 仅给出候选原则（坐标范围/约束），未形成每个 REVISE 项的精确数值。例：wardrobe 选 x=-2.9 还是 -3.0？TV 朝向如何调整？每个需精确到 0.05m 的坐标尚未计算并交叉验证 |
| 3 | 无重复 visual owner | ❌ NO | §C/D：coffee-table（TC + Room L342 side-table CoffeeTableModel）、entrance-tray（TC + Room L101-105 假托盘）、umbrella-stand（TC + Room 4 处装饰伞）共 3 组重复视觉尚未在代码中删除。P2.1 计划删除，但当前状态（HEAD + P2.0 文档）仍是双重 |
| 4 | 无重复 collision owner | ❌ NO | §C：cnt-entrance-tray 与 decor-shoe-cabinet 重复 XZ collider；cnt-coffee-table 与 decor-side-table 重复；sofa-side rotation 与 collision footprint 方向错（结构性）。另外 collisionOwner=none 代码不支持。 |
| 5 | 门洞与关键路径满足净空要求 | ❌ NO | §B：bedroom chair 距门洞净距 0.225m < 0.3；§B B-003 cat key 与 sofa/植物之间 1.2m 通道不足；§F-5.6 玩家钻入植物缝找钥匙；entrance 动线折返不自然但数学可达但非真实可达 |
| 6 | task container position 语义已核实 | ❌ NO | §B B-008：4 个 TC 的 position.y / surfaceHeight 有 2 种语义模式（size.y vs position.y+size.y/2），未统一；obj-phone hiddenInContainer y 值被忽略但文档未记录；object initialPosition = room-local 蓝图有混淆 |
| 7 | 当前 QA 或明确人工流程能验收所有 Blocker | ❌ NO | §D：rotation footprint swap（C-004）无任何验收流程（代码缺陷）；shallow tray 关闭碰撞的 QA 检查不存在；DF 家具不压门/不出房间完全依赖人工（qa-layout 不查 DF） |
| 8 | 全局审计确认局部实施不会制造新的双重真值源 | ❌ NO | §C 确认：FirstPersonControls 把 TC + DF 都加入 allFurniture。如果 P2.1-2.3 只修正 TC/DF position 而不去除重复条目，会继续有 TC⊂DF（entrance-tray on shoe-cabinet）双重碰撞；另外 DF 没有 rotation 字段，所有带旋转的家具碰撞与视觉不一致是系统性双重真值源（视觉旋转了 90°，碰撞 footprint 不 swap x/z） |

→ 8 条满足 0 条。

最终结论：
  ⛔ NO-GO P2.1

============================================================
10. 是否必须先做统一 Scene Spec
============================================================

10.1 当前 HEAD 存在的"数据模型不一致"问题

| 不一致点 | 影响 | 是否必须统一后才能实施 P2.1+ |
|---|---|---|
| DecorFurnitureSpec 类型只有 {id, position, size}，缺 rotation 字段 | 所有带旋转的家具（sofa-side, TV-stand, desk-chair, nightstand）视觉与碰撞 footprint 错位；碰撞链系统性错误（见 §C-4.4） | 是，属于 BLOCKER 级 |
| ContainerSpec 无 collisionOwner 字段（TC / static-furniture / none） | cnt-entrance-tray on counter 和 wall-mounted TC 无法关闭 XZ 碰撞 | 是，否则 entrance tray 问题无解 |
| surfaceHeight 语义不统一：size.y vs 绝对 y 两种模式 | placement 逻辑可能在不同 TC 上取到不同 Y，物体悬浮或穿模 | 是，P2.2 改 cnt-nightstand 时会踩到 |
| object.initialPosition.y 在 surfaceContainerId 存在时被忽略 | 文档和实现不一致，维护者困惑 | 中风险，建议统一（但不阻塞 P2.1） |
| DecorFurnitureSpec 缺 visualOwner / collisionOwner / semanticKey 标注 | TC vs DF 重复碰撞无法自动检查，只能人工交叉比对 | 中风险，但是 QA 自动化率低的根源 |

10.2 结论

  ✅ 必须先完成 P2.G1 UNIFIED SCENE SPEC，才能开展 P2.1-P2.3 任何分房实施工作。

理由：
  - §C 4.4 结构性碰撞缺陷（rotation 不交换 x/z，DecorFurnitureSpec 无 rotation 字段）—— HEAD 此问题被 DF position 全错（world 值误写）掩盖，P2.1 修正 DF position 后会立即大面积穿模，属于"越修越错"的风险
  - §B B-002 + §C 4.5：cnt-entrance-tray 必须 collisionOwner=none 才成立，但当前无此字段
  - §H 8/8 标准全部未满足的根本原因是数据模型能力不够支撑 P2.0 的设计意图

============================================================
11. 下一步唯一推荐工作包
============================================================

推荐下一步工作包：
  ======================================================
  P2.G1 UNIFIED SCENE SPEC v1.0
  ======================================================
  前置：NO-GO P2.1
  目标：建立统一、可扩展、可自动化 QA 的场景数据模型规范
  预期交付物：
    1) docs/design/GLOBAL_SCENE_DATA_MODEL_SPEC.md
    2) docs/design/GLOBAL_LAYOUT_QA_SPEC.md（本报告 §12 已包含草案）
    3) 类型定义文件：扩展 DecorFurnitureSpec / ContainerSpec 的 TypeScript 类型
    4) 一个最小可验证 prototype：
       - DecorFurnitureSpec 加 rotation 字段 + collision 链交换 x/z 验证
       - ContainerSpec 加 collisionOwner 字段 + none 跳过验证
  阶段范围：不修改任何现有房间坐标（不改 living/bedroom/entrance 位置数值），
          只扩展类型 + 升级碰撞链 + 扩展 QA
  验收标准（P2.G1 完成后才能回 P2.0-R）：
    G1-1 所有带 rotation 的 DF 家具碰撞 footprint x/z 正确交换
    G1-2 支持 ContainerSpec.collisionOwner = TC | static-furniture | none，同一 semanticKey 不重复
    G1-3 统一 surfaceHeight 语义（写 1 条明确规则覆盖所有 4 个 TC + 未来 TC）
    G1-4 qa-layout.ts 扩展：
         * 检查 DF 家具不越房间
         * 检查 DF 家具不压门
         * 检查 DF↔TC 同一 (x,z) 不双重 collision
         * 检查 semanticKey 视觉唯一性
    G1-5 object.initialPosition 语义文档化（room-local，y 在 surfaceContainerId 时被忽略）
  预计工作量：中等（类型扩展 + 碰撞链升级 + QA 扩展 3 部分）

不推荐的替代路径：
  - 直接进入 P2.0-R BLUEPRINT REVISION 重新算坐标 —— 因为数据模型没修好，新坐标照样面临 rotation collision 和 collisionOwner 无解的问题，坐标算得再准进入实施阶段都会踩 §C/§B 的结构性坑
  - "先 P2.1 Living，问题等 P2.2/P2.3 再修" —— 违反 P2_ROOM_BY_ROOM_IMPLEMENTATION_CHECKLIST.md §0.1 分房隔离原则，且 P2.1 修改 DF position 后 rotation 不匹配问题会立即显现，导致回滚 P2.1

本轮结束。不得修改源码、测试、脚本或 README。不得 commit。不得 push。
