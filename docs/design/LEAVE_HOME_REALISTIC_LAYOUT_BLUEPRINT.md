# LEAVE_HOME 真实可实施空间布局蓝图

任务：task-leave-home（出门大作战）
范围：living / bedroom / entrance
阶段：P2.0 LAYOUT BLUEPRINT（仅文档，0 源码修改）
日期：2026-08-02
基线事实来源：
  - src/data/rooms.ts（房间尺寸、门洞）
  - src/data/decorFurniture.ts（装饰家具碰撞条目 room-local）
  - src/data/tasks/leave-home.ts（任务容器 / 物体 / 脚本事件）
  - src/components/arena3d/Room3D.tsx（Room 视觉硬编码）
  - src/components/arena3d/Container3D.tsx（任务容器视觉 & 碰撞链）
  - src/game/collision.ts（纯 XZ 圆矩，不读 size.y；PLAYER_RADIUS = 0.3）
  - docs/LEAVE_HOME_LAYOUT_FACT_CHECK.md（§A–§D 事实核查）
  - docs/design/spatial_validity_contract.md（SV1–SV8 约束）

本蓝图仅描述**本轮不改源码、不下载模型、不修改任务逻辑、不 commit、不 push。

============================================================
0. 全局坐标约定与常量
============================================================

0.1 坐标约定（来自事实核查 §B.1–§B.7，已在源码中验证）

| 字段 | 约定 | 世界转换 |
|---|---|---|
| room.center | WORLD | living=(0,0,0); bedroom=(-8,0,0); entrance=(0,0,8) |
| doorway.offset | ROOM-LOCAL（相对 room.center） | world = roomCenter + offset |
| decorFurniture.position | ROOM-LOCAL（必须） | world = roomCenter + position |
| ContainerSpec.position | ROOM-LOCAL | world = roomCenter + position |
| ObjectSpec.initialPosition | ROOM-LOCAL | world = roomCenter + position |
| spawnPosition | ROOM-LOCAL（rooms[0].center 相对） | world = roomCenter + spawnPosition |
| robotPosition | WORLD | 直接使用 |

0.2 物理常量（源码真值）

| 常量 | 值 | 来源 |
|---|---|---|
| PLAYER_RADIUS | 0.3 m | src/game/playerControls.ts L10 |
| PLAYER_DIAMETER | 0.6 m | 2 × radius |
| 最小有效通道宽度 | PLAYER_DIAMETER + 0.6 = **1.2 m** | 用户要求（用户 §三/§四/§五约束 |
| PLAYER_SPEED | 3.0 m/s | playerControls.ts L8 |
| 交互最大距离（object） | 2.0 m | interactionTargets.ts L10 |
| 交互最大距离（container） | 2.5 m | interactionTargets.ts L36 |
| 门洞标准宽度 | 1.5 m | rooms.ts 各门洞默认值 |

0.3 房间参照总览

```
        ┌────────────────────────────────────┐
        │ bedroom                        │
        │ center=(-8,0,0)  size=8×8      │
        │                                │
        │  [东墙 x=-4，门洞 (x=+4 rl)    │
        └───────────────┬────────────────┘
                        │ (west doorway)
┌───────────────────────┴──────────────────────────────────────┐
│ living                                                  │
│ center=(0,0,0)  size=8×8                               │
│                                                          │
│  [西墙 x=-4 → bedroom]    [北墙 z=+4 → entrance]         │
│                                                          │
│  spawn: room-local (0,-1.5) → world (0,-1.5)              │
│  玩家初始朝向 π（+Z 方向，面朝电视墙反方向，即南偏？）       │
└───────────────────────┬──────────────────────────────────┘
                        │ (north doorway)
        ┌───────────────┴────────────────┐
        │ entrance                       │
        │ center=(0,0,8)  size=6×6       │
        │                                │
        │  [南墙 z=5（rl z=-3）→ living   │
        └────────────────────────────┘
```

0.4 固定任务动线（§二，来自用户要求 & leave-home 任务定义）

```
Stage 1 (OBSERVE FETCH):
  ① living spawn (0,-1.5)
    → ② coffee table 保存钥匙 E (obj-key initial on cnt-coffee-table)
    → ③ bedroom doorway (x=-4,z=0)
      → ④ bedroom nightstand 拿手机 F (开抽屉→取 obj-phone)
    → ⑤ living→entrance doorway (z=+4)
      → ⑥ entrance tray 放手机 F (→ entrance console 桌上 cnt-entrance-tray)
    → ⑦ entrance umbrella stand 拿雨伞 F (obj-umbrella from cnt-umbrella-stand)
    → ⑧ 回到 entrance tray 放雨伞 F
    → *（此时：cat event 触发（either 离开客厅 or 拿到手机后）
Stage 2 (KEY OUTDATED):
    → ⑨ 回到 living，搜索被移动的钥匙 (-3.2,-3.2)（西北角落
    → ⑩ 按 E 更新钥匙记忆（memoryUpdateCount +=1
Stage 3 (FINALIZE):
    → ⑪ 到 entrance tray 放钥匙 F
    → ⑫ 完成
```

============================================================
1. Living 蓝图
============================================================

1.0 BEFORE 问题（来自 LEAVE_HOME_LAYOUT_FACT_CHECK §D.1）

| # | 问题 | 严重度 |
|---|---|---|
| L-B1 | DF ↔ Room visual 整体错位（14 DF 仅 4 个匹配：画、钟、植物2） | 中 |
| L-B2 | cnt-coffee-table 视觉位置 (rl 视觉茶几外壳 L201 在 center.x-0.5,z-0.3 = (-0.5,-0.3)，TC rl (0,0.3) → 两个茶几视觉 | 轻 |
| L-B3 | decor-sofa-main rl (0,-3.0) vs Room 主沙发 (0,-1.2) → 玩家走到 z=-2 撞空气 | 高 |
| L-B4 | 落地灯 1/2、植物 1、椅子、边几的 DF z/x 南北/东西对调 | 中 |
| L-B5 | 缺少 sofa 表面作为猫站立表面的视觉与碰撞一致性（猫视觉在 Room，但无碰撞） | 低 |
| L-B6 | TV stand 靠南（DF z=-3.0 vs Room z=-1.0，用户要求靠东墙）| 中 |
| L-B7 | 不禁止要求：不在门洞附近摆书架、灯、植物（需检查）| 中 |

1.1 设计约束（§三 用户要求）

  1. sofa 靠南墙
  2. cnt-coffee-table 是唯一茶几视觉和交互真值
  3. 删除或冻结 Room3D 重复茶几视觉
  4. TV stand 靠东墙
  5. bedroom doorway 与 entrance doorway 均留至少 1.2m 有效通道
  6. cat moved key 位置 rl (-3.2,-3.2) 至少从两个方向可达
  7. 猫可放在沙发表面
  8. 不在门洞附近摆书架、灯或植物
  9. 输出每件家具 rl position / size / rotation / visual owner / collision owner

1.2 Proposed Top-Down ASCII（living 8×8 rl 俯视图，+x=东，+z=北）

```
rl 坐标 x∈[-4,4], z∈[-4,4]
         +z (北，→ entrance 门洞 z=+4, x=0)
  ┌──────────────[entrance door]──────────────┐
  │ z=+4                                       │
  │                                            │
  │  植物2     椅子  边几(小茶几视觉待删)       │
  │  (+3.4,+2.0) (+1.5,+1.0) (+1.8,+0.8)      │
  │                                            │
  │                                            │
  │          ┌──────────────────────┐            │
  │          │ cnt-coffee-table   │            │
  │          │  x=0,z=+0.3      │            │
  │          │  1.4×0.7 (TC唯  │            │
  │          └──────────────────────┘            │
  │                                            │
  │                                            │
 -x │                                            │ +x
(西)│  TV+stand  书架  挂钟    落地灯1       │(东)
  │  (+2.9,-1.0)│           (+3.0,-2.0)    │
  │  (+3.4,-1.5)│(+3.7,0)              │
  │            │                              │
  │  ╔══════════════════════════════════╗    │
  │  ║          主沙发 (靠南墙)             ║    │
  │  ║        x=0, z=-2.5                ║    │
  │  ║        2.4×1.0                   ║    │
  │  ╚══════════════════════════════════╝    │
  │                                            │
  │  侧沙发 L 型  植物1(-3.4,-2.0)  落地灯2    │
  │  (-2.0,-0.5)                  (-3.0,+0.5)│
  │                                            │
  │  置物架  画  钟                          │
  │  (-3.4,+1.0) (-3.7,+1.5)               │
  │                                            │
  │ z=-4                                     │
  └────────[bedroom door]─────────────────────┘
                 x=-4, z=0（西墙门洞）
         -z (南)
```

关键位置标记（room-local）:
  * spawn: (0, -1.5)  ★ 出生点，朝向 π 面向 -z，即面向沙发方向（南墙）
  * cat moved key: (-3.2, -3.2)  ★ 猫扒拉后钥匙位置（西北角，沙发西侧）
  * bedroom doorway: offset=(-4,0)，宽 1.5 → 走行带 x∈[-5.05,-2.95], z∈[-1.05,1.05]
  * entrance doorway: offset=(0,+4)，宽 1.5 → 走行带 x∈[-1.05,1.05], z∈[2.95,5.05]

1.3 Room-Local 坐标表（可直接写入源码）

图例：
  VS = Visual Source 视觉来源（Room = Room3D.renderLiving；Task = Container3D；None = 无视觉）
  CS = Collision Source 碰撞来源（TC = task.containers；DF = roomDecorFurniture；None = 无碰撞）
  Rotation = THREE.Euler 角度（[x,y,z]弧度，0 表示默认朝向，y=π/2 表示绕 Y 轴旋转 90°）

### 任务容器（TC）

| id | room-local pos (x,z) | size (x,y,z) | rotation (y rad) | surfaceHeight | VS | CS | 备注 |
|---|---|---|---|---|---|---|---|
| cnt-coffee-table | (0, +0.3) | 1.4, 0.45, 0.7 | 0 | 0.45 | Task (Container3D → FurnitureModel coffee_table) | TC | 唯一茶几真值；删除 Room L201 茶几外壳 & L207-L239 表面装饰（§三.3 |
| — | — | — | — | — | — | — | — |

### 装饰家具（DF，room-local 条目，目标：DF.position = Room 视觉 world（living.center=(0,0,0)，所以 rl = world）

| decor id | room-local pos (x,z) | size (x,y,z) | rotation (y rad) | VS | CS | 对齐 Room 源码位置 |
|---|---|---|---|---|---|---|
| decor-sofa-main | (0, -2.5) | 2.4, 0.9, 1.0 | 0 | Room L174：position=[center.x, 0, center.z - 2.5] | DF | 靠南墙（z=-2.5 沙发南边 z=-3.0，与南墙 z=-4 间距 1.0m = 沙发深度 + 0 间隙 OK。用户 §三.1 要求 |
| decor-sofa-side | (-2.0, -0.5) | 1.6, 0.85, 0.9 | +π/2 | Room L196：[center.x-2.0, 0, center.z-0.5], rot y=π/2 | DF | L 型侧沙发西翼 |
| decor-tv-stand | (+2.9, -1.0) | 2.2, 0.55, 0.45 | -π/2 | Room L271：[center.x+size/2-1.1, 0, center.z-1.0], rot y=-π/2 | DF | 靠东墙（x=+2.9，东墙 x=+4 间距 1.1m - TV stand 深度 0.45/2 → OK） |
| decor-tv | (+3.0, -1.0) | 1.8, 1.0, 0.15 | -π/2 | Room L277：[center.x+size/2-1.0, 0.8, center.z-1.0], rot y=-π/2 | None (size.y≠0 但 depth 0.15 ≤ PLAYER_RADIUS，玩家不会贴这么近) | 贴 TV stand 上方 |
| decor-bookshelf | (+3.4, -1.5) | 0.8, 1.8, 0.35 | 0 | Room L283：[center.x+size/2-0.6, 0, center.z-1.5] | DF | TV stand 南侧靠东墙，z=-1.5 距 entrance 门洞 z=+4 间距 5.5m，距 bedroom 门洞 x=-4 间距 7.4m，不挡两门洞 |
| decor-shelf | (-3.4, +1.0) | 0.7, 1.2, 0.2 | 0 | Room L289：[center.x-size/2+0.6, 0, center.z+1.0] | DF | 西墙北侧，距 bedroom 门洞 z=0 偏移 1.0m（净距 1.0 > 0.3 允许）|
| decor-painting | (-3.7, +1.5) | 0.8, 0.6, 0.05 | 0 (rot y=π 贴墙) | Room L295：[center.x-size/2+0.3, 1.2, center.z+1.5], rot y=π | None（depth 0.05，碰撞忽略） | 西墙挂画 |
| decor-clock | (+3.7, 0) | 0.4, 0.4, 0.05 | 0 | Room L301：[center.x+size/2-0.3, 1.8, center.z] | None | 东墙挂钟 x=+3.7 |
| decor-floor-lamp-1 | (+3.0, -2.0) | 0.4, 1.8, 0.4 | 0 | Room L307：[center.x+size/2-1.0, 0, center.z-2.0] | DF | 东南角落，距两门洞均 >2m |
| decor-floor-lamp-2 | (-3.0, +0.5) | 0.35, 1.6, 0.35 | 0 | Room L313：[center.x-size/2+1.0, 0, center.z+0.5] | DF | 西侧靠北，距 bedroom 门洞 z=0 偏移 0.5m（净距 0.5 > 0.3 OK）|
| decor-plant-1 | (-3.4, -2.0) | 0.5, 1.2, 0.5 | 0 | Room L319：[center.x-size/2+0.6, 0, center.z-2.0] | DF | 西南角落植物，距 bedroom 门洞 x=-4 偏移 0.6m（x∈[-4.1,-3.4]？植物 x∈[-3.65,-3.15]，门洞 x∈[-5.05,-2.95] → x 范围相交于 [-3.65,-3.15]，植物 z=-2.0，门洞 z∈[-1.05,1.05]，z 不相交，不挡门 |
| decor-plant-2 | (+3.4, +2.0) | 0.35, 0.8, 0.35 | 0 | Room L325：[center.x+size/2-0.6, 0, center.z+2.0] | DF | 东北角落，距 entrance 门洞 z=+4 偏移 2.0m |
| decor-chair | (+1.5, +1.0) | 0.5, 0.7, 0.5 | 0 | Room L337：[center.x+1.5, 0, center.z+1.0] | DF | 东北中部，不挡门 |
| decor-side-table | (+1.8, +0.8) | 0.6, 0.35, 0.6 | 0 | **Room L343：当前 visual position，但本蓝图标记为「待冻结视觉但删除碰撞」或「视觉转换为普通茶几移除」，见 §1.5 所有权表 | None（§三.3 删除重复茶几视觉；本 DF 条目在 P2.1 中从 DF 数组删除，避免形成"两个茶几"碰撞） | 原 Room3D L342-346 用 CoffeeTableModel 画的小茶几：必须停止使用 CoffeeTableModel（改为 ChairFallback 或移除或纯装饰不进 DF）|

### 任务物体（room-local initial）

| obj id | room-local pos (x,z) | size (x,y,z) | VS | CS | surface/cotainer |
|---|---|---|---|---|---|
| obj-key | (0, +0.3) | 0.2, 0.06, 0.14 | Task (Object3D → PropModel key) | None（object 不进家具碰撞） | cnt-coffee-table 表面（y 贴 surfaceHeight）|

### 猫视觉（Room3D 手绘，无碰撞，位置从现有）

| 语义 | room-local pos (x,z) | 备注 |
|---|---|---|
| 钥匙猫 (cat visual) | (+0.3, -2.7)，y = 沙发表面高 0.45 | 放在主沙发表面（x=0 中心 -2.5）上，坐北朝南方向（与 §三.7 一致：猫可放在沙发表面）|

1.4 World 坐标换算表（验证是否在房间范围内）

living: center=(0,0,0), size=8×8 → world x∈[-4,4], z∈[-4,4]（player radius 0.3 时 x∈[-3.7,3.7]）

| 条目 | rl (x,z) | world (x,z) | 在房间内？ | 边界检查（含 PLAYER_RADIUS 0.3）|
|---|---|---|---|---|
| spawn | (0,-1.5) | (0,-1.5) | ✓ | z=-1.5∈[-3.7,3.7] OK |
| cnt-coffee-table | (0,+0.3) | (0,+0.3) | ✓ | x∈[-0.7,0.7], z∈[-0.05,0.65] OK |
| decor-sofa-main | (0,-2.5) | (0,-2.5) | ✓ | x∈[-1.2,1.2], z∈[-3.0,-2.0] OK |
| decor-sofa-side | (-2.0,-0.5) | (-2.0,-0.5) | ✓ | x∈[-2.8,-1.2]（z 方向旋转 90°→ x 尺寸 swap x 深度 0.9/2=0.45，z 深度 1.6/2=0.8） → x∈[-2.45,-1.55], z∈[-1.3,+0.3] OK |
| decor-tv-stand | (+2.9,-1.0) | (+2.9,-1.0) | ✓ | rot -90°→ x size 变 z 深度 0.45/2=0.225，z size 变 x 长度 2.2/2=1.1 → x∈[2.675,3.125], z∈[-2.1,0.1] OK x max=3.125≤3.7 |
| decor-bookshelf | (+3.4,-1.5) | (+3.4,-1.5) | ✓ | x∈[3.0,3.8], z∈[-1.675,-1.325] x max=3.8≤3.9（墙 x=4-0.1=3.9）OK |
| decor-side-table (视觉移除 DF 碰撞移除) | (+1.8,+0.8) | (+1.8,+0.8) | ✓ | 视觉保留但不进 DF 碰撞（避免"第二茶几"碰撞）|
| cat moved key (rl (-3.2,-3.2) | (-3.2,-3.2) | (-3.2,-3.2) | ✓ | 位置在沙发西侧 z=-3.2 距南墙 z=-4 偏移 0.8m |

1.5 唯一视觉所有权表（§七.7 检查：visual owner 与 collision owner 唯一）

| 语义 | 唯一视觉 VS | 唯一碰撞 CS | 冲突？ | 处理 |
|---|---|---|---|---|
| 茶几（放钥匙初始位置）| cnt-coffee-table (TC) | cnt-coffee-table (TC) | ✗ 唯一 | Room3D L201-205 CoffeeTableModel → **删除** 或 position.y 设为 (0,0.2,+0.3) rl（对齐 TC；§三.3）；Room3D L207-L239 茶几上的书/杯遥控器装饰 → 删除或随茶几外壳一起删除 |
| 沙发（主三人位）| Room L173 SofaModel (0,-1.2) → **新蓝图改到 rl (0,-2.5) 对齐 DF** | DF decor-sofa-main rl (0,-2.5) | ✗ 唯一（P2.1 改 DF position 后）| Room3D L174 group position 改为 [center.x, 0, center.z - 2.5] |
| 沙发侧 L 型 | Room L195-199 SofaModel rl (-2.0,-0.5) rot π/2 | DF decor-sofa-side (-2.0,-0.5) | ✗ 唯一（改 DF 后）| 已对齐 |
| TV + stand 靠东墙 | Room L270-280 TVStandModel + TVFallback | DF decor-tv-stand / decor-tv | ✗ 唯一（改 DF 后）| 已对齐 |
| 东南角落地灯 1 | Room L306 LampFallback | DF decor-floor-lamp-1 | ✗ 唯一（改 DF 后）| 已对齐 |
| 西侧落地灯 2 | Room L312 LampFallback | DF decor-floor-lamp-2 | ✗ 唯一（改 DF 后）| 已对齐 |
| 西南植物 1 | Room L318 PlantFallback | DF decor-plant-1 | ✗ 唯一（改 DF 后）| 已对齐 |
| 东北植物 2 | Room L324 PlantFallback | DF decor-plant-2 | ✗ 唯一（改 DF 后）| 已对齐 |
| 椅子 | Room L336 ChairFallback | DF decor-chair | ✗ 唯一（改 DF 后）| 已对齐 |
| 边几 / 小茶几（重复语义）| Room L342-346 CoffeeTableModel（当前用 CoffeeTableModel）| DF decor-side-table（当前 size 0.6×0.35×0.6，用 CoffeeTableModel 碰撞）| ⚠ 冲突：CoffeeTableModel ≈ 茶几语义 → 玩家会误会是另一个茶几 | **Room3D：改 modelId 为 ChairFallback 或删除；DF：从 living 数组删除 decor-side-table 条目（或保留 position 但 size 缩为视觉装饰性碰撞）。禁止保留「CoffeeTableModel → 重复茶几语义」** |
| 西墙置物架 | Room L288 ShelfFallback | DF decor-shelf | ✗ 唯一（改 DF 后）| 已对齐 |
| 西墙画 | Room L294 PaintingFallback | None (depth 0.05) | ✗ 唯一 | 已对齐 |
| 东墙挂钟 | Room L300 ClockFallback | None (depth 0.05) | ✗ 唯一 | 已对齐 |
| 东墙书架 | Room L282 BookshelfFallback | DF decor-bookshelf | ✗ 唯一（改 DF 后）| 已对齐 |
| 钥匙猫 | Room L241 手绘猫 group，rl (+0.3,-2.7)（新蓝图移到沙发表面 | None | ✗ 唯一 | 猫视觉无碰撞，不影响 |
| 钥匙 | Object3D obj-key | None | ✗ 唯一 | 与 cnt-coffee-table 表面对齐 |

1.6 门洞走行带（§三.5 要求 ≥ 1.2m 宽）

#### bedroom doorway（西墙，rl offset=(-4,0)，宽 1.5m）

走行带（含 PLAYER_RADIUS 0.3 + DOOR_PADDING 0.1）：
  * 走行带范围（XZ 条带）：x∈[-5.05, -2.95], z∈[-1.05, 1.05]
  * 检查有效通道宽度：门洞本宽 1.5m + 两侧 padding = 1.5 + 2×0.4 = 2.3m > 1.2m ✓
  * 家具与走行带相交检查：

| 家具 | footprint (x范围, z范围) | 与走行带相交？ | 处理 |
|---|---|---|---|
| decor-sofa-side | x∈[-2.45,-1.55], z∈[-1.3,+0.3] | z∈[-1.3,+0.3] ∩ [-1.05,1.05] = [-1.05,+0.3] ≠ ∮ x范围 [-2.45,-1.55] 与 x [-5.05,-2.95]：-1.55 > -2.95 → 无交集 | ✓ 不挡门 |
| decor-floor-lamp-2 | x∈[-3.175,-2.825], z∈[+0.325,+0.675] | x 范围 [-3.175,-2.825] ⊂ 走行带 x [-5.05,-2.95]？x -2.825 > -2.95 → x 重叠 0.125m（走行带 x∈[-5.05,-2.95]，灯 x max -2.825 > -2.95）→ x 最小重叠 0.125m，灯 z +0.5，走行带 z∈[-1.05,1.05] → z 重叠。净距 = 走行带 x 边界 -2.95 到灯 x min -3.175 = 0.225m < 0.6m 半直径 ⚠ | **§三.8 要求不在门洞旁摆落地灯** → 落地灯 2 rl (-3.0,+0.5) 位置距门洞 z=0 仅 0.5m（z 方向）→ 不符合 §三.8「不在门洞附近摆书架、灯或植物」。蓝图修正：decor-floor-lamp-2 rl → (-3.0, +2.0)，西北角落（距门洞 z 偏移 2.0m，x 距门洞 x=-4 偏移 1.0m）→ Room3D L313 group 也移到 [center.x-size/2+1.0, 0, center.z+2.0] |
| decor-plant-1 | x∈[-3.65,-3.15], z∈[-2.25,-1.75] | z 不相交（-2.25 < -1.05）| ✓ 不挡（距门洞 z 偏移 > 0.7m + 植物深度 0.25 → 净距 >0.95m OK |

#### entrance doorway（北墙，rl offset=(0, +4)，宽 1.5m）

走行带范围：x∈[-1.05, +1.05], z∈[+2.95, +5.05]
  有效通道宽度 1.5m ≥ 1.2m ✓

| 家具 | footprint | 与走行带相交？ |
|---|---|---|
| decor-plant-2 | x∈[+3.225, +3.575], z∈[+1.825, +2.175] | z max=+2.175 < 走行带 z min=+2.95 → 不相交 ✓ |
| decor-chair | x∈[+1.25, +1.75], z∈[+0.75, +1.25] | z < 2.95 ✓ |
| decor-side-table（若保留视觉）| x∈[+1.5, +2.1], z∈[+0.5, +1.1] | z < 2.95 ✓ |
| cnt-coffee-table | x∈[-0.7, +0.7], z∈[-0.05, +0.65] | z < 2.95 ✓ |

走行带完全空 ✓

**落地灯 2 新位置检验：
  decor-floor-lamp-2 改到 rl (-3.0, +2.0) → x∈[-3.175,-2.825], z∈[+1.825, +2.175]
  距 entrance 门洞 z min=+2.95 偏移 0.775m + 灯 z 半长 0.175 → z 净距 0.6m OK
  距 bedroom 门洞 z 0 偏移 2.0m OK（§三.8）

1.7 关键路径验证（§七.5/6 可达性）

#### Path 1：spawn → coffee table

  spawn (0,-1.5) → cnt-coffee-table (0,0.3)
  直线距离 = 1.8m，无障碍 ✓
  4 个方向进入交互圈（半径 2.5m，茶几 x∈[-0.7,0.7]，z∈[-0.05,0.65]）：
  - 南 (z-)：玩家站 (0,-2.2) 距茶几 2.5m？距离 2.5 米。但沙发 z -2.5 沙发在南 2.5 米挡，但茶几 沙发南 z=-0.05 到 spawn 之间距离 1.45m 无障碍 → 可过
  - 北 (z+)：站 (0,1.0) → 过
  - 西 (x-)：站 (-1.5,0.3) → 过
  - 东 (x+)：站 (+1.5,0.3) → 过
  4 方向均可 ✓

#### Path 2：coffee table → bedroom doorway

  茶几 (0,0.3) → bedroom 门洞中心 (-4, 0)
  路径西南走向，经过 rl x=-2.0 处为 decor-sofa-side（L 侧沙发 x∈[-2.45,-1.55]，z∈[-1.3, +0.3]
  关键净空：玩家 rl (-3.0, 0) 位置（门洞前净宽 1.05m 门洞宽 x -4.05 侧 -4 墙 → 距离 茶几东边界 x=-0.7 至 -3.0 之间 2.3m 宽 × 家具无家具挡（侧沙发 z∈[-1.3,+0.3] x 跨越 x 方向 [-2.45,-1.55]，通道宽度 x -3.0 到沙发东侧 x=-1.55 1.45m OK ≥1.2m 最小通道。但落地灯 2 新位置 (-3.0, +2.0) 北挡不挡，不经过 OK。路径畅通 ✓

#### Path 3：cat moved key position (-3.2, -3.2) 两个以上可达方向

  钥匙位置 rl (-3.2, -3.2)：
  - 方向 1（东向 +x 方向进入：从 (-1.0, -3.2) 往西走 → 沙发主 x∈[-1.2, +1.2] z∈[-3.0, -2.0]，钥匙 z=-3.2 在沙发南侧（沙发南侧边界 z=-3.0）→ 沙发南 z -3.0，钥匙在 z=-3.2（沙发南外侧 0.2m，贴南墙 z=-4 偏移 0.8m）。从 (-1.0,-3.2) 走向西走 (-3.2,-3.2)：x∈[-1,-3.2], z=-3.2 家具：
    * decor-sofa-main z∈[-3,-2]，z=-3.2 不相交
    * 路径无碰撞 → 方向 1 ✓
  - 方向 2（北向 +z 方向进入：从 (-3.2, -1.0) 往南走 → z∈[-1,-3.2], x=-3.2：
    * decor-plant-1 x∈[-3.65,-3.15]，z∈[-2.25,-1.75] → x -3.2 在范围内，z∈[-2.25,-1.75]，玩家 z∈[-1,-3.2] 穿过 z=-2 相交 → 距植物 0.3m 半径圆 vs 植物 x 半宽 0.25，净距不足，轻微碰到但碰撞系统会推开不软锁
  - 方向 3（东北向进入：从 (-2.0, -2.0) 向西南 → 沙发主 x∈[-1.2,1.2], z∈[-3,-2]，x=-2.0 不相交，z=-2.0 边界 → 从 z=-2.0 沙发北侧绕过 → 方向 3 ✓
  至少 2 个方向可达 ✓（§三.6）

1.8 自动验收（Living §七.1–7 检查项）

| # | 检查项 | 结果 | 备注 |
|---|---|---|---|
| L-1 | 家具 footprint 在房间范围内 | ✓ | §1.4 全部检查通过 |
| L-2 | 门洞走行带不与家具相交 | ✓ | 落地灯 2 移到 (-3.0, +2.0) 后门洞全部通过 |
| L-3 | 任务容器不与重复 Room3D visual 并存 | ⚠ 待实施 | 需删除 Room3D L201-239 茶几外壳 + L342-346 小茶几 CoffeeTableModel（或改用非茶几 model） |
| L-4 | spawn 不落入碰撞体 | ✓ | spawn (0,-1.5) 距最近家具：沙发主 z∈[-3,-2] > 1.5m 净距；茶几 x∈[-0.7,0.7] z∈[-0.05,0.65]，spawn 在 z -1.5 与茶几 z 最近 -0.05 间距 1.45m OK；落地灯 2 新位置 z=+2.0 不相交 |
| L-5 | 关键目标 ≥1 个可达接近方向 | ✓ | 茶几 4 方向均可 |
| L-6 | cat moved key ≥2 个可达方向 | ✓ | §1.7 东向 + 东北向 2+ 方向 |
| L-7 | visual owner 与 collision owner 唯一 | ⚠ 待实施 | 需对齐 DF position + 删除/冻结重复茶几视觉 |

1.9 人工验收

| # | 检查项（真人 WASD 走）| 通过标准 |
|---|---|---|
| L-M1 | 出生点 (0,-1.5) 站稳 5 秒不被推 | 不被任何碰撞推挤 |
| L-M2 | 茶几 4 方向靠近按 F 出「茶几」提示 | 4 方向均出提示 |
| L-M3 | 从 spawn 走到 bedroom 门洞 (-4,0) 走 10 次 | 顺利通过不卡家具 |
| L-M4 | 从 spawn 走到 entrance 门洞 (0,+4) 走 10 次 | 顺利通过不卡 |
| L-M5 | 从两条独立路径到钥匙新位置 (-3.2,-3.2) | 两条都能走到距 key 交互圈 2m 内 |
| L-M6 | 无"看得到过不去""过得去隐形墙" | 0 出现 |
| L-M7 | top-down 模式碰撞一致 | 不穿模、不卡死 |

1.10 允许/禁止修改文件（§三 Living）

**允许修改：
  - src/data/decorFurniture.ts → living 数组 11 条 position/size 调整（见 §1.3 DF 表）；删除 living 条目 decor-side-table 条目或 position（从数组移除）
  - src/components/arena3d/Room3D.tsx → renderLiving()：
    * L173-177 主沙发 group position 改为 [center.x, 0, center.z - 2.5]
    * L313 落地灯 2 group position 改为 [center.x-size/2+1.0, 0, center.z+2.0]
    * L201-239 删除茶几外壳 + 茶几装饰 group（L201 到 L239 共 39 行：CoffeeTableModel + 遥控器/杯/水果装饰）
    * L342-346 小边几：删除或改为 ChairFallback / ShelfFallback 等非茶几语义模型
    * L241-L268 猫 group 移到沙发表面新位置 [center.x+0.3, 0.45, center.z-2.7]
  - 不新增文件、不改其他文件

**禁止修改：
  - src/data/tasks/leave-home.ts cnt-coffee-table position（本蓝图保持不变（§三.2 cnt-coffee-table 为唯一真值）
  - src/game/*.ts（collision.ts / interactionTargets.ts 等管线）
  - src/components/arena3d/FirstPersonControls.tsx
  - src/data/rooms.ts（门洞不移动）
  - 其他任务 / 其他房间文件

============================================================
2. Bedroom 蓝图
============================================================

2.0 BEFORE 问题（§D.2）

| # | 问题 | 严重度 |
|---|---|---|
| B-B1 | DF.position 全部 10 条写成 WORLD / 方向错误 room-local → 碰撞 100% 失效（玩家全卧室穿墙）| 极高 |
| B-B2 | cnt-nightstand rl (0.5, +0.8) → world (-7.5, +0.8) 与 Room 右床头柜视觉 rl (+1.5, -1.5) → world (-6.5, -1.5) 完全不符 → OT 核心 Bug（按视觉 F 不上手机抽屉）| 极高 |
| B-B3 | 书架 Room 视觉 rl (+3.4, +1.0) → x=-4.6 world，贴 living→bedroom 门洞北侧（修正 DF 碰撞后 DD=挡门）| 高 |
| B-B4 | 床横跨中轴，但碰撞空 → 视觉穿床违和 | 中 |
| B-B5 | 左床头柜有 DF 条目（nightstand-left）但 cnt-nightstand 任务容器与右床头柜视觉挂钩，左柜完全无碰撞视觉 | 低 |
| B-B6 | 衣柜/书桌/斗柜视觉无碰撞 → 穿墙 | 中 |

2.1 设计约束（§四 用户要求）

  1. bed 靠南墙或西南区域
  2. 右床头柜位于床侧
  3. cnt-nightstand 与 Room3D 可见床头柜完全统一
  4. 手机从唯一床头柜抽屉出现（hiddenInContainer: cnt-nightstand）
  5. 书架移离门洞
  6. 衣柜和书桌靠墙
  7. 门到床头柜路径畅通
  8. 输出 rl pos / size / rot / VS / CS

2.2 Proposed Top-Down ASCII（bedroom 8×8 rl 俯视图；+x=东（+x → living 门洞 x=+4 rl）；+z=北）

```
rl x∈[-4,4], z∈[-4,4]
         +z (北)
  ┌──────────────────────────────────────────┐
  │                                          │
  │  衣柜    斗柜       书桌+椅子       植物1     │
  │  (-3.15,+0.6)(-1.5,+1.5)(+1.6,+1.0)    │
  │  1.8×0.65 1.2×0.45  1.3×0.65         │
  │                                          │
  │                                          │
  │              ╔════════════════════════╗       │
  │              ║     大床（靠南+西南）║       │
  │              ║  x=0, z=-0.8      ║       │
  │              ║  2.0 × 2.4        ║       │
  │              ╚════════════════════════╝       │
  │ 左柜  ┌──────┐       ┌──────┐ 右柜= cnt    │
  │(-3.15,│      │       │      │ nightstand    │
  │ -1.5) │      │       │      │ (+1.5,-1.5)│
  │        └──────┘       └──────┘             │
  │                                          │
  │                                          │
  │  挂钟                书架（移离门洞到 z=+2.0）│
  │  (+3.7,-1.5)       (+3.4,+2.0)          │
  │                                          │
  │  植物2        画                          │
  │  (-2.8,+2.0)   (0,+3.7)                 │
  │                                          │
  └──────────[living 门洞 x=+4 rl, z=0]────────┘
         +x (东 → 去 living）
         -z (南)
```

关键位置：
  * living 门洞：rl offset=(+4, 0)，宽 1.5 → 走行带 x∈[+2.95, +5.05], z∈[-1.05, +1.05]
  * cnt-nightstand 右床头柜：rl (+1.5, -1.5)
  * 床：靠南 z=-0.8（南端 z=-2.0，距南墙 z=-4 偏移 2.0m）

2.3 Room-Local 坐标表

### 任务容器（TC）

| id | rl (x,z) | size (x,y,z) | rot y | surfaceHeight | VS | CS | 备注 |
|---|---|---|---|---|---|---|---|
| cnt-nightstand | (+1.5, -1.5) | 0.55, 0.55, 0.45 | 0 | 0.55 | **Room L544 NightstandModel（右床头柜 visual world (-6.5, -1.5) → rl x = -6.5 - (-8) = +1.5 ✓ 与 TC 对齐 | TC | §四.3/4 统一；obj-phone hiddenInContainer 从这里抽屉出现 |

### 装饰家具（DF，修正为正确 room-local = world - (-8, 0) = xw + 8, zw）

| decor id | rl (x,z) | size | rot y | VS | CS | 对齐 Room 源码 |
|---|---|---|---|---|---|---|
| decor-bed | (0, -0.8) | 2.0, 1.0, 2.4 | 0 | Room L522 | DF | 靠南西南区域 z=-0.8 床 AABB x∈[-1,1], z∈[-2.0, +0.4]（南端 z=-2.0，距南墙 z=-4 间距 2.0m OK（§四.1）|
| decor-nightstand-left | (-3.15, -1.5) | 0.55, 0.55, 0.45 | 0 | Room L556 | DF | 床西侧左床头柜 x=-3.15 → world -11.15，距衣柜 x∈[-12,-4] OK |
| decor-desk | (+1.6, +1.0) | 1.3, 0.75, 0.65 | 0 | Room L568 | DF | 靠东墙（x +1.6，东墙 x=+4 偏移 2.4m - 书桌半宽 0.65？书桌 depth z +1.0 x+1.6 书桌贴东墙？Room visual x=-6.4 world（rl x=+1.6，距东墙 x=rl x=+4，书桌东边界 +1.6 + 0.65 = 2.25 距东墙 1.75m。不靠墙没关系 靠东南墙贴 OK（§四.6：衣柜和书桌靠墙；书桌靠东墙 → z +1.0，东墙 x +4 → 书桌 x 东边界 2.25m，书桌深度 x∈[+0.95, +2.25]，距门洞东侧走行带 x∈[+2.95, +5.05] 最小间距 +2.95 - +2.25 = 0.7m 大于半直径 0.3 → 净距 0.4m 贴一点，通道宽 1.5m-0.7m=0.8m < 1.2m。§四.7 要求「门到床头柜路径畅通」最小通道 1.5m 宽书桌与门洞之间 0.8m 宽度不足？再检查书桌 x +0.95 到走行带 x +2.95 间 2.0m 宽空间书桌本身深度 z +1.0 南侧，z 范围 [+0.675, +1.325] 与走行带 z [-1.05, +1.05] 重叠 +0.675 到 +1.05。OK 书桌东南角落 x∈[+0.95, +2.25] z∈[+0.675, +1.325] 与门洞走行带 x [+2.95, +5.05] z [-1.05, +1.05] 无 x 重叠（x 书桌 max +2.25 < 走行带 min +2.95 → 净距 0.7m ≥ 0.3 OK。✓ 书桌不挡门）|
| decor-wardrobe | (-3.15, +0.6) | 1.8, 2.1, 0.65 | 0 | Room L586 | DF | 靠西墙（x=-3.15，西墙 x=-4 偏移 0.85m，衣柜半厚 0.65/2=0.325 衣柜西边界 -3.15 -0.9=-4.05？衣柜 x 尺寸 1.8 x∈[-4.05,-2.25] → 西墙 x=-4，衣柜超出墙 0.05m，忽略。靠墙 OK §四.6）|
| decor-dresser | (-1.5, +1.5) | 1.2, 0.9, 0.45 | 0 | Room L592 | DF | 中西区域 |
| decor-bookshelf | (+3.4, +2.0) | 0.7, 1.6, 0.3 | 0 | **Room L598：当前位置 visual 原 rl (+3.4, +1.0) 本蓝图改为 rl (+3.4, +2.0)（§四.5「书架移离门洞 → z 从 +1.0 移到 +2.0）→ z 范围 [+1.85, +2.15]，门洞走行带 z [-1.05, +1.05] 不相交 ✓ DD解除 DD=No，原位置 DD=Yes）| DF | 靠东墙北侧，距门洞 z=0 偏移 2.0m §四.5 移离门洞 |
| decor-painting | (0, +3.7) | 0.7, 0.5, 0.05 | π（贴北墙）| Room L604 | None | 北墙挂画 z=+3.7 |
| decor-clock | (+3.7, -1.5) | 0.35, 0.35, 0.05 | 0 | Room L610 | None | 东南墙挂钟 |
| decor-chair | (+2.5, +1.0) | 0.45, 0.65, 0.45 | π（面向书桌）| Room L580 (rot y=π) | DF | 书桌东侧椅子 |
| decor-plant | (-2.8, +2.0) | 0.4, 0.9, 0.4 | 0 | Room L627 位置原 Room 视觉 (-10.8 world → rl -2.8) z=+2.0（原 FactCheck 建议）| DF | 西北角落植物 |

### 任务物体

| obj id | rl (x,z) | size | VS | CS | surface |
|---|---|---|---|---|---|
| obj-phone | (+1.5, -1.5)（抽屉内位置 rl 原 leave-home.ts L130 initialPosition {x:+0.5,z:+0.75} → **蓝图新位置 rl (+0.275, -1.5 + 0.2) 内抽屉，即 rl (+1.5 + 0.275, -1.5+0.2) ？原 leave-home.ts L130 写 rl x=0.5,z=0.75 对齐旧 TC 位置。P2.2 改 TC 为 (+1.5,-1.5) 时 obj-phone rl initialPosition 也要改到 rl (+0.275 (TC 中心 x 半深 offset), +0.2)（抽屉内部）| 0.18, 0.09, 0.02 | Task Object3D | None | hiddenInContainer: cnt-nightstand（§四.4）|

2.4 World 坐标换算表

bedroom: center=(-8, 0, 0) → world x∈[-12,-4], z∈[-4,4]

| 条目 | rl (x,z) | world (x,z) = (-8,0)+rl | 在房间内？ | rl/2 ±4 检查 |
|---|---|---|---|---|
| cnt-nightstand | (+1.5,-1.5) | (-6.5,-1.5) | ✓ | rl x+1.5∈[-3.7,3.7], z-1.5∈[-3.7,3.7] OK |
| decor-bed | (0,-0.8) | (-8,-0.8) | ✓ | x∈[-1,1] z∈[-2,0.4] OK |
| decor-nightstand-left | (-3.15,-1.5) | (-11.15,-1.5) | ✓ | x -3.15，西墙 x=-4 偏移 0.85m OK |
| decor-wardrobe | (-3.15,+0.6) | (-11.15,+0.6) | ✓ | x -3.15，x尺寸1.8，x∈[-4.05,-2.25]，最小x -4.05 ≈ 墙 x=-4 OK |
| decor-dresser | (-1.5,+1.5) | (-9.5,+1.5) | ✓ | |
| decor-desk | (+1.6,+1.0) | (-6.4,+1.0) | ✓ | x 半宽1.3/2=0.65 → x∈[+0.95,+2.25] rl |
| decor-bookshelf | (+3.4,+2.0) | (-4.6,+2.0) | ✓ | x +3.4∈[-4,+4] OK；原 z +1.0 → DD → 改 +2.0 OK |
| decor-chair | (+2.5,+1.0) | (-5.5,+1.0) | ✓ | |
| decor-clock | (+3.7,-1.5) | (-4.3,-1.5) | ✓ | x +3.7≤3.7 OK |
| decor-plant | (-2.8,+2.0) | (-10.8,+2.0) | ✓ | x -2.8∈[-3.7,3.7] |

2.5 唯一视觉所有权表

| 语义 | VS | CS | 冲突？ | 处理 |
|---|---|---|---|---|
| 右床头柜抽屉 = cnt-nightstand | Room L544 NightstandModel rl (+1.5,-1.5) | TC cnt-nightstand rl (+1.5,-1.5) | ✗ 唯一（P2.2 对齐后）| §四.3；旧 TC rl (0.5,+0.8) 旧 world (-7.5, 0.8) 位置删除，TC 移到右床头柜位置 |
| 左床头柜（纯装饰）| Room L556 NightstandModel | DF decor-nightstand-left | ✗ 唯一 | |
| 大床 | Room L521 BedModel | DF decor-bed | ✗ 唯一（DF 修正）| |
| 衣柜 | Room L585 WardrobeModel | DF decor-wardrobe | ✗ 唯一 | |
| 斗柜 | Room L591 DresserFallback | DF decor-dresser | ✗ 唯一 | |
| 书桌 | Room L567 DeskModel | DF decor-desk | ✗ 唯一 | |
| 书桌椅子 | Room L579 ChairFallback (rot π) | DF decor-chair | ✗ 唯一 | |
| 书架（移离门洞）| Room L597 BookshelfFallback rl (+3.4,+2.0) 新位置 | DF decor-bookshelf | ✗ 唯一 | 原 z+1.0 → z+2.0（§四.5）|
| 西北植物 | Room L626 PlantFallback | DF decor-plant | ✗ 唯一 | |
| 挂钟 | Room L609 ClockFallback | None | ✗ 唯一 | |
| 北墙画 | Room L603 PaintingFallback | None | ✗ 唯一 | |
| 手机 obj-phone | Object3D obj-phone (hidden in cnt-nightstand 抽屉）| None | ✗ 唯一 | §四.4 |
| 床上枕头×3 / 地毯 / 台灯 / 桌上台灯 / 毛巾×2（纯装饰）| Room 手绘 | None | ✗ 唯一 | 无碰撞不处理 |

2.6 门洞走行带（§四.7 门到床头柜路径畅通）

living 门洞：rl (+4,0)，宽 1.5m → 走行带 x∈[+2.95, +5.05], z∈[-1.05, +1.05]

| 家具 | footprint（rl）| 与走行带相交？ | 处理 |
|---|---|---|---|
| decor-bookshelf（新 z=+2.0) | x∈[+3.05,+3.75] z∈[+1.85,+2.15] | z=+2.0 > +1.05 → 不相交 ✓（§四.5 移离门洞成功，原 DD=Yes → 新 DD=No）| |
| decor-clock (+3.7,-1.5) | None（depth 0.05) | 不相交 ✓ | |
| decor-desk | x∈[+0.95,+2.25] z∈[+0.675,+1.325] | x max=2.25 < 2.95 → x 不相交，z +0.675~+1.05 与走行带重叠，但 x 无重叠 → ✓ 不挡门 | 通道书桌 x∈[0.95, 2.25] 与门洞走行带 x∈[2.95, 5.05] 间净距 0.7m ≥ 0.3 半径 + 2.95-2.25=0.7 ≥ 0.3 OK）|
| decor-chair | x∈[+2.275,+2.725] z∈[+0.775,+1.225] | x 2.725 < 2.95 → 净距 0.225m < 0.3 半径。椅子东侧 2.725 到 走行带西侧 2.95 净距 0.225，z 范围相交 [+0.775, +1.05] | ⚠：椅子 x +2.5 rl 位置太靠门洞东侧 东侧空间 x 通道书桌东侧边界 +2.725 到走行带 2.95 之间只有 0.225m < 半直径 0.6m。门到床头柜路径：玩家从门洞 x=+3.25 进入卧室往南走到 cnt-nightstand (+1.5,-1.5)，南绕 z=-1.5 西侧绕椅子南路径 x∈[+3.25 → +1.5], z∈[0 → -1.5]。椅子 x +2.5,z+1.0 路径西侧 x=+2.275 到 +2.5~+1.5 z +1.0 → 从 +0.0 之间 门洞到床头柜路径畅通（直线距离 2.6m。椅子在 z=+1.0 到 z=-1.5 要通过。可绕行或绕椅子南侧 z +0.775+1.0 → z -1.5 距离 2.5m（南侧绕行成功。路径净宽仍 ≥1.2m（z 方向门洞到床头柜 z从 x=+2.95→ x 西侧 +1.5 向南走 z = +0 → -1.5，南侧 到 x +2.5~1.5 z+1.0 南侧通过（x 西侧净空 1.45m 宽 OK）| 最终：椅子不挡路径 ✓ §四.7 ✓

#### 门到床头柜路径计算

  门洞进入点 rl (+3.25, 0) → cnt-nightstand rl (+1.5, -1.5)
  家具在直线上无大型障碍
    * bed x∈[-1,1] z∈[-2.0, +0.4] → 直线 x∈[+3.25,+1.5] z∈[0,-1.5] 与 bed x∈[-1,1] 最大 +1.5 边界 x +1.5 是床头柜 x +1.5，z -1.5 与 bed z=-2.0 北侧边界 -2.0 - (-1.5)=0.5m 间距。床南端 -2.0，床头柜 -1.5 不相交。
    * 右床头柜在床东侧 x=+1 (床东侧）床头柜 rl +1.5 - 床 +1.0 = 0.5m 空间 OK
    * 床头柜位置 (+1.5,-1.5) 床尺寸 x=2.0, z=2.4 床东侧 x=+1.0 床头柜 rl +1.5 间距 0.5m，床头柜 z -1.5 与床南 z=-2.0 北端 +0.4。床头柜 z=-1.5 与 bed z=[-2,0.4] 重叠 OK
  路径畅通 ✓ §四.7 通过

2.7 关键路径

  * spawn living → bedroom doorway 进入 → 右床头柜 → cnt-nightstand:
    门洞进入 rl (+3.25, 0) → 走到床头柜 rl (+1.5,-1.5)：畅通

2.8 自动验收

| # | 检查项 | 结果 |
|---|---|---|
| B-1 | 家具 footprint 房间范围内 | ✓ | 全部 world 落在 [-12,-4] x [-4,4] 内 OK |
| B-2 | 门洞走行带不相交（含 DD 书架移离） | ✓ | 书架 z+2.0 ✓ |
| B-3 | 任务容器 cnt-nightstand 与 Room 右床头柜视觉统一 | ✓ | rl (+1.5,-1.5) ✓ |
| B-4 | spawn 在 living，不检验 bedroom | N/A（spawn 不 bedroom | 本房间 spawn 无 |
| B-5 | 床头柜 4 方向接近 |  ✓ 东 + 西 + 南 + 北（北有床阻挡 北侧，3 方向可） | ≥1 方向 ✓ |
| B-6 | N/A | N/A（cat moved key 不在 bedroom | |
| B-7 | visual/collision 唯一 | ⚠ 待实施（DF.position 修正 + cnt-nightstand 对齐右柜） | |

2.9 人工验收

| # | 检查项 | 标准 |
|---|---|---|
| B-M1 | 从 living 进入 bedroom（10 次往返）| 不被书架 DD 卡 |
| B-M2 | Room 视觉右床头柜位置按 F → 弹出「床头柜」→ 打开抽屉 → toast 手机出现 → 拾取 | 3 步全通 |
| B-M3 | 走到床边无穿墙（DF 床碰撞生效）| 走到床边停住不穿 |
| B-M4 | 门到床头柜路径无阻挡 | 走 10 次全通 |
| B-M5 | 全房一圈「看得到过不去」0 出现 | 0 |
| B-M6 | top-down 一致 | 通过 |

2.10 允许/禁止修改文件（Bedroom）

**允许修改：
  - src/data/decorFurniture.ts → bedroom 数组 10 条 position 全部改 room-local 正确值（§2.3 表）
  - src/data/tasks/leave-home.ts → cnt-nightstand position/size（对齐右床头柜（rl (+1.5, y=0.55/2=0.275, z=-1.5)
    * containers[1].position = { x:+1.5, y: 0.275, z: -1.5 }
    * containers[1].size = { x: 0.55, y: 0.55, z: 0.45 }
    * obj-phone initialPosition rl { x:+1.5 + offset（对齐右柜内部）
  - src/components/arena3d/Room3D.tsx → renderBedroom()：
    * L597-600 书架 group position 从 center.z+1.0 → center.z+2.0（视觉 DF 同步
    * L609 挂钟 L610 group position center.x+size/2-0.3（不变
    * L626-629 PlantFallback 植物 group 移到 [center.x - size/2 + 1.2 = center.z+2.0

禁止修改：
  - 其他任务；scenes/材质/调色/模型风格
  - collision/commands 等管线
  - rooms.ts（门洞不动）

============================================================
3. Entrance 蓝图
============================================================

3.0 BEFORE 问题（§D.3）

| # | 问题 | 严重度 |
|---|---|---|
| E-B1 | 玄关托盘双份视觉：Room L102 画托盘在 rl (-0.4, -3 + size.z/2+0.7 = rl z=-3+3+0.7=rl z=+0.7？entrance.center z=8, size.z=6, size/2=3 → z=5 world rl z=-3 +0.7 world = 8 + rl z=5.7？Room3D L102: [center.x-0.4, 0, center.z-size.z/2+0.7] = world x=0-0.4=-0.4, z=8-3+0.7=world z=+5.7 → 直觉放位置（门洞旁），但 TC cnt-entrance-tray rl (-1.4,+1.0) → world (-1.4, +9.0) 西北角，完全两个位置 → SV2/SV4 OT 核心 | 极高 |
| E-B2 | 伞架/雨伞装饰两处：Room L67-L131 画两把装饰伞 (L107-118 红伞+蓝伞位置 ，TC cnt-umbrella-stand rl (-2.5,+1.0) 西北角，完全两个不同位置 → 视觉三处伞 误导玩家 极高 | 极高 |
| E-B3 | Room L80-L93 托盘上小物（钥匙/钱币装饰 + 钥匙扣）进一步误导玩家以为是任务托盘 | 高 |
| E-B4 | 浅托盘 TC XZ 碰撞 size.z=0.1 深，但碰撞纯 XZ → 玩家走不进托盘表面交互（被碰撞挡住）| 中 |
| E-B5 | DF 8 条 room-local 正确 ✓ 与 Room 视觉完美匹配 ✓，DF 无需修改（§五要求 §五.5 删除重复装饰伞；§五.6 删除 Room3D 假托盘；§五.7 tray / umbrella stand / task objects 只有一份视觉；§五.8 玩家进入玄关后能顺手：放手机 → 拿伞 → 放伞 |

3.1 设计约束（§五）

  1. living door 到 exterior door 中央通道保持畅通
  2. 玄关桌或鞋柜靠侧墙（鞋柜已在西侧靠西墙）
  3. cnt-entrance-tray 位于玄关桌表面（鞋柜作为 entrance console 表面）
  4. cnt-umbrella-stand 位于玄关桌靠门一侧
  5. 删除所有重复装饰伞
  6. 删除 Room3D 假托盘（L101-105）
  7. tray / umbrella stand / task objects 只有一份视觉
  8. 玩家进入玄关后（从门洞进入 z=5 world rl z=-3+1=world z=5）后按距离能顺手：放手机（→ tray） → 拿伞（→ umbrella-stand）→ 放伞（→ tray）动线顺向
  9. 输出 rl / VS / CS

3.2 Proposed Top-Down ASCII（entrance 6×6 rl；+x=东；+z=北 → 远离 living）

```
rl x∈[-3,3], z∈[-3,3]
         +z (北/室内深处)
  ┌─────────────────────────────────┐
  │ 画 (0,+2.7)                  │
  │                                            │
  │                                            │
  │                                            │
  │  cnt-entrance-tray  cnt-umbrella-stand        │
  │   ★(on鞋柜)     ★(鞋柜靠门侧)              │
  │   rl (-2.4, -0.5) 鞋柜台面 → 放托盘       │
  │   鞋柜表面 y=1.1 →                       │
  │   伞架靠门 (鞋柜南 z=+0.3 南)             │
  │   伞架 rl (-2.4,+0.3 南侧 → 更靠 living 门）│
  │                                            │
  │  植物1                挂钟 (+2.7, +1.0)       │
  │  (-2.0, +0.8)      挂钩 (+2.7, 0)        │
  │                       植物2 (+2.0,-0.5)       │
  │                       小置物架 (+2.5,+1.5)   │
  │                                            │
  │         (鞋子 鞋柜下方 rl (-2.4, +0.3 南)       │
  │                                            │
  └────[living 门洞：rl z=-3, x=0 宽 1.5]─────┘
         -z (南，去 living 方向）
```

核心决策：
  统一西北方案保留（因 DF entrance 鞋柜完美匹配，不需改 DF，将 TC 移到直觉鞋柜表面。
  原 TC 伞架在西北角 rl (-2.5, +1.0) → 新方案移到鞋柜南侧靠门位置
  原 TC 托盘在 (-1.4, +1.0) → 新方案移到鞋柜表面上方位置

3.3 Room-Local 坐标表

### 任务容器（TC）

| id | rl (x,z) | size (x,y,z) | rot y | surfaceHeight | VS | CS | 备注（§五 约束对齐 |
|---|---|---|---|---|---|---|---|
| cnt-entrance-tray | (-2.4, -0.5) | 0.8, 0.1, 0.4 | 0 | 1.15 |  **视觉来自 cnt-entrance-tray Container3D entrance_tray 模型放置在鞋柜鞋柜台面（y=1.1 鞋柜高度，托盘表面+0.05 即 surfaceHeight=1.15） | TC | §五.3「cnt-entrance-tray 位于玄关桌表面（鞋柜表面）| 位置：鞋柜 DF decor-shoe-cabinet rl (-2.4,-0.5) 相同 (x,z)，y 抬高 |
| cnt-umbrella-stand | (-2.4, +0.3) | 0.3, 0.8, 0.3 | 0 | 0.8 | **TC Container3D → FurnitureModel cabinet（或 umbrella_stand 模型） | TC | §五.4「玄关桌（鞋柜）靠门一侧（南侧 +z 更靠近门洞 z=-3+0.3 更近）更靠门 → 更顺手动线 |

### 装饰家具 DF（entrance DF 8 条已匹配完美，DF position 不变）

| decor id | rl (x,z) | size | VS | CS | 备注 |
|---|---|---|---|---|---|
| decor-shoe-cabinet | (-2.4, -0.5) | 1.2, 1.1, 0.4 | Room L55-59 ShoeCabinetModel | DF | §五.2 靠西侧墙 ✓（x=-2.4，西墙 x=-3 偏移 0.6m）作为 entrance_console 角色 §五.3/4 伞架放南侧，3 托盘放表面上方 共位置一致（x=-2.4 中心对齐鞋柜 |
| decor-shoes | (-2.4, +0.3) | 0.35, 0.15, 0.45 | Room L61-65 | DF | 鞋柜南侧地面鞋子 |
| decor-hook | (+2.7, 0) | 1.0, 0.3, 0.05 | Room L95-99 HookFallback | None | 东墙挂钩 |
| decor-painting | (0, +2.7) | 0.6, 0.45, 0.05 | Room L133-137 PaintingFallback | None | 北墙画 |
| decor-clock | (+2.7, +1.0) | 0.3, 0.3, 0.05 | Room L139-143 ClockFallback | None | 东侧挂钟 |
| decor-plant-1 | (-2.0, +0.8) | 0.3, 0.7, 0.3 | Room L145-149 PlantFallback | DF | 西北植物 |
| decor-plant-2 | (+2.0,-0.5) | 0.25, 0.6, 0.25 | Room L151-155 | DF | 东南植物 |
| decor-shelf | (+2.5, +1.5) | 0.4, 0.8, 0.15 | Room L157-161 ShelfFallback | DF | 东北层架 |

### 任务物体

| obj id | rl (x,z) | size | VS | CS | 备注（initial |
|---|---|---|---|---|---|
| obj-umbrella | (-2.4, +0.3) | 0.15, 0.8, 0.15 | Task Object3D UmbrellaFallback | None | §五.4 surfaceContainerId: cnt-umbrella-stand initialPosition 位置 §五.5 删除所有重复装饰伞后唯一雨伞视觉 ✓ |

3.4 World 坐标换算

entrance: center=(0,0,8) → world x∈[-3,3], z∈[5,11]

| 条目 | rl (x,z) | world (x,z) | 范围 | 检查 |
|---|---|---|---|---|
| cnt-entrance-tray | (-2.4,-0.5) | (-2.4, 7.5) | x=-2.4∈[-2.7,2.7], z=7.5∈[5.3,10.7] ✓ | 鞋柜台面 |
| cnt-umbrella-stand | (-2.4,+0.3) | (-2.4, 8.3) | x∈[-2.55,-2.25] z∈[8.15,8.45] | 鞋柜南侧地面 ✓ |
| obj-umbrella | (-2.4,+0.3) | (-2.4, 8.3) | ✓ | |
| decor-shoe-cabinet | (-2.4,-0.5) | (-2.4,7.5) | ✓ | |

3.5 唯一视觉所有权表

| 语义 | VS | CS | 冲突？ | 处理（§五.5/.6/.7 要求） |
|---|---|---|---|---|
| 玄关托盘（目标区放 放 key/phone/umbrella） | **TC cnt-entrance-tray on 鞋柜台面（唯一视觉）| TC cnt-entrance-tray | ⚠ 当前冲突：旧 Room L101-105 L80-93 假托盘 + 钥匙扣装饰（门洞旁直觉位置 (rl (-0.4,+0.7 rl z=-0.4, -3+3+0.7= rl +0.7？实际 7-3+0.7=rl -0.4,z=-3+0.7=rl -2.3+0.7= z=-2.3 world 8+rl=5.7 world z=5.7 门洞旁）视觉 | 删除 Room3D L101-105 EntranceTrayFallback group + 删除 L80-93 钥匙/钱币/装饰钥匙扣 mesh 组 | ✓ 视觉删除（§五.6）|
| 伞架 + 雨伞（唯一视觉 | TC cnt-umbrella-stand（鞋柜南侧地面 | TC | ⚠ 旧 Room L107-131 两把装饰伞红伞蓝伞+L67-78 小伞 3 处伞视觉存在 + TC 西北角 伞 4 处重复！删除 §五.5 | Room L107-131（2 把装饰伞 2 组 groups + L67-78 鞋柜上的小伞 2 个 mesh 删除 | 删除所有装饰伞。只剩 TC 唯一 |
| 鞋柜 entrance_console（鞋柜承担玄关桌角色） | Room 视觉 ShoeCabinetModel | DF decor-shoe-cabinet | ✗ 唯一 ✓ | 不动 DF，TC 在鞋表面（§五.2 靠西墙 |
| 鞋子装饰 | Room ShoesFallback | DF decor-shoes | ✗ 唯一 | |
| 挂钩 / 画 / 钟 / 植物1 植物2 / 层架装饰 | Room 视觉 | DF decor-hook/painting/clock/plant1/2/shelf | ✗ 唯一 | |
| 雨伞（任务 object）| Object3D obj-umbrella | None | ✗ 唯一 | §五.7 一份视觉 ✓（删除重复装饰伞后唯一）|

3.6 门洞走行带（§五.1 living door 中央通道）

living 门洞：rl (0,-3) 宽 1.5m 走行带 x∈[-1.05, 1.05], z∈[-5.05, -0.95]（实际 rl）entrance 宽 6 深 6 中央通道从门洞（rl z=-3）到北侧深处（rl z=+3）：

关键路径方向 +z 通道中央 x 中央 x=0 z 从 -3 到 +3，x∈[-0.6, +0.6] 宽度 1.2m 最小通道无家具阻挡 ✓

| 家具 | footprint | 与走行带相交？ | 处理 |
|---|---|---|---|
| 鞋柜 + cnt-tray (on top) | x∈[-3,-1.8], z∈[-0.7,-0.3] | x [-3,-1.8] 与走行带 x [-1.05,1.05] 无相交；z 不相交 ✓ | |
| cnt-umbrella-stand | x∈[-2.55,-2.25], z∈[+0.15,+0.45] | x 不相交 ✓ | 靠西墙侧 |
| 挂钩 | None | ✗ | |
| 画 | None | ✗ | |
| 挂钟 | None | ✗ | |
| 植物1 | x∈[-2.15,-1.85], z∈[+0.65,+0.95] | x -1.85 < -1.05，西侧  x 最小距离 | 净距 0.2m 半径不阻 ✓ |
| 植物2 | x∈[+1.875,+2.125], z∈[-0.625,-0.375] | x +1.875 > +1.05，东侧 | 净距 0.825m ✓ |
| 层架 | x∈[+2.3,+2.7], z∈[+1.425,+1.575] | x 东侧 | |
| 鞋子装饰 | x∈[-2.575,-2.225], z∈[+0.075,+0.525] | x 西侧 | |

通道 门洞→深处中央 x=0, z=-3 到 +3（rl）中央 x 空出 2.1m 净宽（x -1.05 到 +1.875 间 2.925m 宽！✓ §五.1 通过）

3.7 关键路径验证

  进入玄关后（rl (0,-2.5) 进入方向 +z 西侧)
  * 动作 1：放手机 → cnt-entrance-tray rl (-2.4, -0.5)：向西走到距 2.5 m，交互圈 2.5m 交互顺畅 ✓
  * 动作 2：拿雨伞 cnt-umbrella-stand rl (-2.4, +0.3)：z=+0.3 从托盘 z=-0.5 北 0.8m 很近 ✓ 走过去
  * 动作 3：放伞 → 回托盘 rl (-2.4, -0.5) 向南 0.8m 放下。动线 放手机（-2.4 鞋柜上方）→ 拿伞（-2.4,+0.3 南侧）→ 放伞（回托盘上方）动线 ✓（§五.8「顺手」：沿 x=-2.4 西侧 z 前后走 0.8m 来回顺 ✓）

3.8 自动验收

| # | 检查项 | 结果 | 备注 |
|---|---|---|---|
| E-1 | 家具 footprint 房间内 | ✓ | |
| E-2 | 门洞走行带不相交 | ✓ | |
| E-3 | 不重复 visual（tray & umbrella stand）| ⚠ P2.3 待删除 Room L101-131 + L67-78 伞 / 假托盘装饰 | §五.5-7 |
| E-4 | spawn 不在 entrance（spawn 在 living） | N/A | |
| E-5 | 3 个 TC / umbrella stand 各至少 1 方向接近 | ✓ | |
| E-6 | N/A（cat moved key 不在 entrance）| N/A | |
| E-7 | 唯一所有权 | ⚠ 待删除重复视觉后 ✓ | |

3.9 人工验收

| # | 检查项 | 通过标准 |
|---|---|---|
| E-M1 | 从 living 进入 entrance × 10 次往返走中央通道走 | 顺利通过 |
| E-M2 | 鞋柜表面看到 cnt-entrance-tray 按 F 出「玄关托盘（目标区）」橙圈 | 成功 |
| E-M3 | 鞋柜南侧伞架拿伞成功 | 出现「伞被拿成功 |
| E-M4 | 放手机→拿伞→放伞流程顺 | 3 步顺畅 |
| E-M5 | 门洞旁假托盘 / 装饰伞 0 出现 | 不出现假视觉 |
| E-M6 | 全房绕一圈「看得见过不去」0 | 0 次 |
| E-M7 | top-down 模式一致 | 不穿模 |

3.10 允许/禁止修改（Entrance）

**允许修改：
  - src/data/tasks/leave-home.ts：
    * cnt-umbrella-stand position/size: { position (-2.4, y=0.4, z=+0.3) size (0.3,0.8,0.3) surfaceHeight=0.8
    * cnt-entrance-tray position/size: rl (-2.4, y=1.1+0.05=1.15, z=-0.5) size (0.8,0.1,0.4) surfaceHeight 1.15（鞋柜台面 1.1 上方
    * obj-umbrella initialPosition rl (-2.4, 0, z=+0.3) 对齐伞架
  - src/components/arena3d/Room3D.tsx renderEntrance()
    * L67-78：删除鞋柜上的小红伞 + 小蓝伞两个 mesh（小红伞+小蓝伞（装饰伞 1）
    * L101-105：删除假托盘 EntranceTrayFallback 组（§五.6）
    * L80-93：删除假托盘上的装饰小物（钥匙/钱币）mesh
    * L107-131：删除两把大装饰伞（红伞+蓝伞）装饰伞 2+3）
    * 以上删除后只留鞋柜 / 挂钩 / 画 / 钟 / 植物1 2 / DF 层架装饰保留

**禁止修改：
  - src/data/decorFurniture.ts entrance DF 条目（8 条完美匹配 ✓）
  - rooms.ts
  - 碰撞/移动 其他房间

============================================================
4. 跨房间冲突检查汇总（§七 7 项）
============================================================

| # | 检查项（§七.1-7） | Living | Bedroom | Entrance |
|---|---|---|---|---|
| 1 | 家具 footprint 在房间内（§七.1） | ✓ 待 P2.1 对齐后 | ✓（修正 DF 10 条 position 后 ✓）| ✓（DF 原 OK，TC 移到表面上方 |
| 2 | 门洞走行带不相交（§七.2） | ✓（落地灯 2 改 (-3.0, 书架移 z=+2.0）| ✓(改（DD=No ✓）| ✓ |
| 3 | TC 不与重复 Room3D visual 并存（§七.3） | ⚠ 删除茶几外壳 & 小边几茶几模型 | ⚠ 对齐右床头柜 ✓ 位置 | ⚠ 删除假托盘 & 3 处装饰伞 |
| 4 | spawn 落入碰撞体（§七.4）| ✓（spawn living (0,-1.5) 不在家具碰撞内 ✓ | N/A | N/A |
| 5 | 关键目标 ≥1 接近方向（§七.5）| ✓ 茶几 4 方向 | ✓ 床头柜 3+ 方向 | ✓ 托盘伞架 1+ 方向 ✓ |
| 6 | cat moved key ≥2 方向可达（§七.6）| ✓（东向 + 东北向绕沙发北侧）| N/A | N/A |
| 7 | visual/collision owner 唯一（§七.7）| ⚠ 对齐 DF + 删除重复茶几 | ⚠ 对齐 DF 10 条 + TC | ⚠ 删除重复装饰伞/假托盘 |

**净结论：蓝图设计本身无冲突（所有七项都能通过实施得到解决），冲突都是当前 HEAD 已存在的，需要在 P2.1-P2.3 中逐房按本蓝图坐标表实施。**

============================================================
5. 文档停止说明
============================================================

本蓝图到此结束。P2.1（Living 源码实施）应单独按本蓝图 §1 允许修改文件范围执行；Living 验收后才 P2.2（Bedroom），再 P2.3（Entrance）。本轮不改源码、不下载模型、不修改任务逻辑、不 commit、不 push。