# P2 ROOM-BY-ROOM 实施清单与验收

任务：task-leave-home（出门大作战）
阶段：P2.0 CHECKLIST（仅文档，0 源码修改，不 commit，不 push）
执行顺序：P2.1 Living → 验收 → P2.2 Bedroom → 验收 → P2.3 Entrance → 全房联调验收
前置文档（必须通读才能开工）：
  - docs/design/LEAVE_HOME_REALISTIC_LAYOUT_BLUEPRINT.md（蓝图 §1-§4，坐标表/所有权/走行带）
  - docs/design/LEAVE_HOME_ASSET_DIMENSION_BUDGET.md（§六 资产预算，尺寸基准）
  - docs/design/spatial_validity_contract.md（SV1-SV8 研究数据有效性约束）
  - docs/LEAVE_HOME_LAYOUT_FACT_CHECK.md（事实核查 §A-§D，基线事实）

本清单分 3 房（Living / Bedroom / Entrance）+ 1 跨房联调，共 4 个阶段。每个房间清单结构：
  A. BEFORE 问题（当前 HEAD 状态事实）
  B. Proposed Top-Down ASCII（蓝图俯视图）
  C. Room-Local 坐标表（可直接复制到源码）
  D. World 坐标换算表（验证不越墙）
  E. 唯一视觉所有权表（避免重复视觉）
  F. 门洞走行带（验证最小通道）
  G. 关键路径（任务动线畅通）
  H. 自动验收（CI / QA 工具自动检查）
  I. 人工验收（真人 WASD + F + E 操作）
  J. 允许修改文件（白名单，其他一律不动）
  K. 禁止修改文件（黑名单，坚决不动）

============================================================
0. 全局实施原则
============================================================

0.1 分房隔离
  - P2.1 只改 Living（不碰 Bedroom/Entrance 任何代码）
  - P2.2 只改 Bedroom（不碰 Living 已实施完的任何代码，Entrance 不动）
  - P2.3 只改 Entrance（Living/Bedroom 已验收完不动）
  - 分房验收不通过 → 回滚本房改动，禁止「先跳过后面补」

0.2 改动粒度
  - 每次最多改 3 个文件：1× decorFurniture.ts + 1× tasks/leave-home.ts + 1× Room3D.tsx
  - 改动按坐标表逐项改完 → lint/build 绿 → 跑本房自动验收 → 跑本房人工验收
  - 不新增文件（禁止新建任何 .ts/.tsx/.md 文件，除本清单 P2.0 阶段已建完的 3 个）

0.3 验证顺序
  1. npm run lint
  2. npm run build
  3. npm run qa（空间有效性契约 QA 工具 → SV 红线 0 出现）
  4. 本房自动验收清单（§.H）
  5. 本房人工验收清单（§.I）
  6. 本阶段（P2.1/2.2/2.3）通过 → 下一房；否则回滚修

============================================================
P2.1 Living 实施清单
============================================================
验收要求：自动验收 7/7 + 人工验收 7/7 通过

P2.1-A. BEFORE 问题（HEAD 状态事实，来自 FactCheck §D.1）
  1. L-B1  DF 14 条仅 4 条匹配（画/钟/植物2），其余 DF ↔ Room 整体错位
  2. L-B2  cnt-coffee-table TC(0,0.3) vs Room3D 茶几外壳 L201(-0.5,-0.3) → 双份茶几视觉
  3. L-B3  decor-sofa-main DF (0,-3.0) vs Room 主沙发 (0,-1.2) → 沙发撞空气
  4. L-B4  落地灯1/2、植物1、椅子、边几的 DF z/x 南北/东西对调
  5. L-B5  猫只存在 Room 视觉无碰撞无 sofa 表面约束（用户 §三.7 要求放沙发表面）
  6. L-B6  TV stand DF 靠南墙 z=-3.0 vs Room 靠东墙 z=-1.0（用户 §三.4 要求靠东墙）
  7. L-B7  落地灯2 DF (-3,0.5) 距 bedroom 门洞 z=0 仅 0.5m（§三.8 门洞附近禁灯）

P2.1-B. Proposed Top-Down ASCII（见蓝图 §1.2）
  - 主沙发靠南墙 rl (0,-2.5)
  - cnt-coffee-table 唯一茶几 (0,0.3)
  - TV stand + 书架靠东墙 (+2.9,-1.0) / (+3.4,-1.5)
  - 落地灯2 移到西北角落 rl (-3.0, +2.0)（原 (-3.0,+0.5) → 新）
  - 猫移到主沙发表面 rl (+0.3, -2.7)，y=沙发面 0.45
  - 边几（小茶几）从 DF 删除 + Room 视觉改为非茶几 modelId 或删除
  - Room L201-239 茶几外壳 + 茶几装饰删除（或对齐 TC）

P2.1-C. Room-Local 坐标表（源码目标值 — decorFurniture.ts living 数组）

| decor id | rl pos(x,z)【新】 | size(x,y,z)【新】 | rot y【新】 | Room3D 对应源码行同步目标 |
|---|---|---|---|---|
| decor-sofa-main | (0, -2.5) | 2.4, 0.9, 1.0 | 0 | Room L174 SofaModel group position = [center.x, 0, center.z - 2.5] |
| decor-sofa-side | (-2.0, -0.5) | 1.6, 0.85, 0.9 | +π/2 | Room L196 SofaModel position [center.x-2, 0, center.z-0.5] rot y π/2（不变）|
| decor-tv-stand | (+2.9, -1.0) | 2.2, 0.55, 0.45 | -π/2 | Room L271 TVStandModel 【不变】（本蓝图靠东墙原位置已正确，DF 对齐 Room 原视觉）|
| decor-tv | (+3.0, -1.0) | 1.8, 1.0, 0.15 | -π/2 | Room L277 TVFallback 【不变】|
| decor-bookshelf | (+3.4, -1.5) | 0.8, 1.8, 0.35 | 0 | Room L283 BookshelfFallback 【不变】|
| decor-shelf | (-3.4, +1.0) | 0.7, 1.2, 0.2 | 0 | Room L289 ShelfFallback 【不变】|
| decor-painting | (-3.7, +1.5) | 0.8, 0.6, 0.05 | π | Room L295 PaintingFallback 【不变】(rot y π) |
| decor-clock | (+3.7, 0) | 0.4, 0.4, 0.05 | 0 | Room L301 ClockFallback 【不变】|
| decor-floor-lamp-1 | (+3.0, -2.0) | 0.4, 1.8, 0.4 | 0 | Room L307 LampFallback 【不变】|
| decor-floor-lamp-2 | (-3.0, +2.0) 【改】| 0.35, 1.6, 0.35 | 0 | Room L313 LampFallback group → [center.x-size/2+1.0, 0, center.z+2.0]（z 从 +0.5 → +2.0）|
| decor-plant-1 | (-3.4, -2.0) | 0.5, 1.2, 0.5 | 0 | Room L319 PlantFallback 【不变】|
| decor-plant-2 | (+3.4, +2.0) | 0.35, 0.8, 0.35 | 0 | Room L325 PlantFallback 【不变】|
| decor-chair | (+1.5, +1.0) | 0.5, 0.7, 0.5 | 0 | Room L337 ChairFallback 【不变】|
| decor-side-table | **从 living 数组删除**（条目移除）| — | — | Room L342-346 CoffeeTableModel group → 【删除】或 modelId 改为 ChairFallback（禁止 CoffeeTableModel 避免茶几重复语义）|

Room3D 其他改动：
  - L201-205 茶几外壳 CoffeeTableModel → 删除；或改为 [center.x, 0.225, center.z+0.3] 对齐 TC（推荐直接删除保持简洁）
  - L207-L239 茶几上的装饰（书/杯/遥控器/茶盘/水果碗） → 删除或随茶几外壳一起删除
  - L241-L268 猫 group 位置 → 从当前 center.x+1.5 → center.x+0.3；y 从 0 → 沙发表面 y=0.45；center.z 不变或改到 z-2.7（沙发深度中心）

P2.1-D. World 坐标换算检查（验证项，非改动项）

living center=(0,0,0) size=8×8，world x∈[-4,4], z∈[-4,4]（含 PLAYER_RADIUS 0.3 → [-3.7,3.7]）

| 条目 | rl (x,z) | world (x,z) | 家具 footprint 是否在房间内？ | 结论 |
|---|---|---|---|---|
| decor-sofa-main | (0,-2.5) | (0,-2.5) | x∈[-1.2,1.2] z∈[-3.0,-2.0] | ✓ |
| decor-floor-lamp-2 新 | (-3.0,+2.0) | (-3.0,+2.0) | x∈[-3.175,-2.825] z∈[1.825,2.175] | ✓ x min -3.175 ≥ -3.7 |
| 猫新位置 (+0.3,-2.7) y=0.45 | (+0.3,-2.7) | (+0.3,-2.7) | 视觉（无碰撞）| ✓ |
| decor-side-table 已删除 | — | — | 删除无冲突 | ✓ |

全部在范围内 ✓

P2.1-E. 唯一视觉所有权表（改动验证项，改完后 npm run qa 红橙线 0）

| 语义 | 唯一视觉 VS（改完后）| 唯一碰撞 CS（改完后）| 验收（改完后）|
|---|---|---|---|
| 茶几（放钥匙）| TC cnt-coffee-table 唯一视觉 | TC cnt-coffee-table size=1.4×0.45×0.7 | 删 Room 茶几外壳 + 小边几 CoffeeTableModel → SV 唯一 ✓ |
| 主三人位沙发 | Room SofaModel (0,-2.5) 新位置 | DF decor-sofa-main (0,-2.5) | DF 对齐 Room → 唯一 ✓ |
| 西侧 L 型沙发 | Room SofaModel (-2,-0.5) | DF (-2,-0.5) | 已对齐 → 唯一 ✓ |
| TV + stand + 书架 + 挂钟 + 置物架 + 画 | Room 视觉对应位置 | DF + None（挂画无碰撞）| DF 对齐 → 唯一 ✓ |
| 落地灯 1/2 | Room LampFallback（2 移 rl z=+2）| DF（2 移 rl z=+2）| 对齐 → 唯一 ✓ |
| 植物 1/2 | Room PlantFallback | DF | 对齐 → 唯一 ✓ |
| 椅子 + 边几非茶几化 | Room ChairFallback / 删除 | DF 删除 side-table | 不出现第二茶几语义 → 唯一 ✓ |
| 猫 | Room 手绘猫 group 沙发表面 | None（无碰撞）| 唯一 ✓ |
| 钥匙 | Object3D obj-key on TC surface | None | 唯一 ✓ |

P2.1-F. 门洞走行带检查（§三.5 最小通道 1.2m）

F-1 bedroom doorway（rl (-4,0)，宽 1.5，走行带 x∈[-5.05,-2.95] z∈[-1.05,1.05]）
  - 家具与走行带相交 0 处：
    - 落地灯 2 新位置 z=+2.0 → z 不相交
    - 侧沙发 L x∈[-2.45,-1.55] 东边界 -1.55 距门洞西侧边界 -2.95 净距 1.4m ✓
  - 有效通道宽度：门洞本宽 1.5 ≥ 1.2 ✓

F-2 entrance doorway（rl (0,+4)，宽 1.5，走行带 x∈[-1.05,1.05] z∈[2.95,5.05]）
  - 家具相交 0 处：植物2 z+2.0 < 2.95；椅子/茶几 z 都 < 2.95
  - 有效通道宽度 1.5 ≥ 1.2 ✓

P2.1-G. 关键路径（任务动线 §二 1-3 步 + 钥匙回找）

G-1 spawn (0,-1.5) → coffee table (0,0.3)：直线距离 1.8m，无家具阻挡
G-2 coffee table (0,0.3) → bedroom doorway (-4,0)：西南走向
G-3 spawn → entrance doorway (0,+4)：北向，z 走行带空
G-4 cat moved key (-3.2,-3.2) 2+ 方向可达（东向/东北向绕过沙发北侧）

P2.1-H. 自动验收（P2.1 通过标准：7 项全 ✓）

命令：
  npm run lint && npm run build && npm run qa

| ID | 检查项 | 工具 | 通过标准 |
|---|---|---|---|
| H-L1 | 家具 footprint 房间内 | qa tool (SV1) | 0 out-of-room |
| H-L2 | 门洞走行带不相交 | qa tool (SV3) | 0 doorway-furniture intersect |
| H-L3 | 任务容器 vs Room3D 茶几唯一 | qa tool (SV2/SV4) | 0 duplicate-coffee-table 语义 count=1 |
| H-L4 | spawn 不落入碰撞体 | qa tool (SV6) | spawn (0,-1.5) 距离最近 collision ≥ PLAYER_RADIUS=0.3 |
| H-L5 | 茶几≥1 接近方向 | qa tool (SV5) | cnt-coffee-table approachable count≥1（目标4）|
| H-L6 | cat moved key ≥2 方向可达 | qa tool (SV5+) | 钥匙 (-3.2,-3.2) 可达方向 ≥2 |
| H-L7 | visual/collision owner 唯一 | qa tool (SV7/SV8) | 0 duplicate VS / duplicate CS 警告 |

必须：以上 7 项全绿 = H-L 总 7/7 通过。
若有任何一项红橙 → 修正 Living 实施 → 重新 lint/build/qa。

P2.1-I. 人工验收（P2.1 通过标准：7 项全 ✓）

方式：npm run dev → 浏览器访问，进入任务选择 → 「出门大作战」关卡 → 仅测试 Living 区域（拿到钥匙后不动，不进其他房）

| ID | 操作 | 通过标准 |
|---|---|---|
| I-L1 | 进入任务后立即松手 5 秒 | 不被碰撞推挤（玩家无位移），画面不抖 |
| I-L2 | 走 4 条路径接近茶几（南/北/西/东），每条接近后按 F | 4 条路径都走通；按 F 弹出「茶几」（或对应 cnt-coffee-table 提示）；橙圈出现；交互正常 |
| I-L3 | 10 次 spawn → bedroom 门洞（站在 rl (-4,0) 世界 (-4,0) 处）| 10/10 顺利通过，不被 DF 家具 / Room 视觉卡死或隐形墙弹回 |
| I-L4 | 10 次 spawn → entrance 门洞（world (0,4)）| 10/10 顺利通过 |
| I-L5 | 两条独立路径走到 cat moved key 位置 (-3.2,-3.2) world (-3.2,-3.2)，走到距 key 2m 内（obj-key 猫 moved 后出现在这里，模拟移动后位置）| 2 条路径（东向/东北向各 1 条）各走 5 次 → 10/10 进入 2m 交互圈 |
| I-L6 | 全 Living 绕家具一圈 × 3 | 0「看得到过不去」，0「过得去隐形墙」；穿模次数 = 0 |
| I-L7 | top-down 模式（按 M 切换）对照视觉 | Top-down 绿色家具块中心坐标与 Room3D 视觉一致（误差 ≤ 0.2m）；不出现家具与碰撞 AABB 大偏离 |

必须：I-L 7/7 通过。
任何一项出现失败 ≥2/10 次数 → 修正实施 → 重来。

P2.1-J. 允许修改文件（白名单）

| 文件 | 改动范围 | 行数（约）|
|---|---|---|
| src/data/decorFurniture.ts | living 数组 14 项 → 13 项（删除 side-table）；剩余 13 项 position/size 按 P2.1-C 表更新（主要 sofa-main z=-3.0→-2.5；floor-lamp-2 z=+0.5→+2.0；其他大部分 DF 视觉不变） | 约 60-80 |
| src/components/arena3d/Room3D.tsx → renderLiving() | 主沙发 group z 位置；落地灯 2 z 位置；茶几外壳 L201-239 删除或对齐；小边几 L342-346 删除或改非茶几 modelId；猫 group 移到沙发表面位置（center.x+0.3, sofa surface y, center.z-2.7）| 约 40-50 |
| （可选）src/components/arena3d/models/ModelRegistry.ts | 如需新增非茶几 fallack modelId 时改动（如 side-table 改用 ChairFallback 则不动 Registry，新增才改）| 约 0-10 |

J 总允许文件 = 2-3 个（默认 2 个，仅需改 Registry 时 +1）
J 总改动行数 ≤ 150 行。

P2.1-K. 禁止修改文件（黑名单，1 字节都不能动）

| 文件 | 原因 |
|---|---|
| src/data/tasks/leave-home.ts | Living cnt-coffee-table 为唯一真值，位置保持 (0,0.3) 不动（§三.2）；P2.2/P2.3 会改本文件，但 P2.1 Living 不动 |
| src/data/rooms.ts | 门洞 size/offset 不动；spawn/spawnRotation 不动 |
| src/game/collision.ts | 碰撞系统不改（含 XZ 圆矩 / wall collision / doorway transition）|
| src/game/interactionTargets.ts | 交互半径 / 容器 target 检测不动 |
| src/components/arena3d/FirstPersonControls.tsx | 控制 / Toast / E F 键逻辑不动 |
| src/components/arena3d/Container3D.tsx | 容器渲染链不动 |
| src/components/arena3d/models/*.tsx | 除 ModelRegistry 外其他模型文件（FallbackColorizer / ModelAsset 等）不动 |
| src/data/decorFurniture.ts → bedroom / entrance 数组 | 分房隔离，P2.1 只改 living |
| 其他任务（clean-table / laundry-sort）任何代码 | 跨任务污染禁止 |
| docs/*（除截图外） | 本 P2.0 文档阶段已结束，实施阶段不改 docs（除非验收未通过要更新实施记录，但本轮禁止）|

============================================================
P2.2 Bedroom 实施清单
============================================================
前置条件：P2.1 Living 自动 7/7 + 人工 7/7 全绿后，才能进入本房
验收要求：自动 6/6 + 人工 6/6 通过

P2.2-A. BEFORE 问题（FactCheck §D.2）
  1. B-B1  DF 10 条 position 全部写错（world / 反向 rl）→ 卧室全空碰撞，穿墙
  2. B-B2  cnt-nightstand rl (0.5,0.8) vs Room 右床头柜 rl (+1.5,-1.5) → 完全错位，OT 核心 Bug
  3. B-B3  书架 Room 视觉 rl (+3.4,+1.0) → 紧贴门洞北侧，DF 修正后挡门（DD=Yes）
  4. B-B4  床视觉横跨中轴但 DF 碰撞空 → 视觉穿床违和
  5. B-B5  左柜有 DF 条目但 cnt-nightstand 绑定右柜，左柜碰撞空
  6. B-B6  衣柜/书桌/斗柜 Room 视觉有但 DF 全错 → 穿墙

P2.2-B. Proposed Top-Down ASCII（蓝图 §2.2）
  - 床靠南西南区域 rl (0,-0.8) 2.0×2.4
  - 左柜 rl (-3.15,-1.5) 床西侧；右柜 rl (+1.5,-1.5) 床东侧 = cnt-nightstand 位置
  - 衣柜靠西墙 (-3.15,+0.6)；书桌靠东南 (+1.6,+1.0)；椅子 (+2.5,+1.0)
  - 书架从 (+3.4,+1.0) 门洞旁 → (+3.4,+2.0) 移离门洞（§四.5）
  - 西北植物 (-2.8,+2.0)；挂钟 (+3.7,-1.5)；北墙画 (0,+3.7)
  - TC cnt-nightstand 从旧 (0.5,0.8) → (+1.5,-1.5) 对齐右床头柜视觉
  - obj-phone initialPosition 同步移到右柜抽屉内部

P2.2-C. Room-Local 坐标表

decorFurniture.ts bedroom 数组（10 条，全修正为正确 rl = world - (-8,0) = xw+8, zw）

| decor id | rl pos(x,z)【新】 | size(x,y,z)【新】 | rot y【新】 | Room3D 源码同步目标 |
|---|---|---|---|---|
| decor-bed | (0, -0.8) | 2.0, 1.0, 2.4 | 0 | Room L522 BedModel 【不变，Room 位置本正确，DF 对齐】 |
| decor-nightstand-left | (-3.15, -1.5) | 0.55, 0.55, 0.45 | 0 | Room L556 NightstandModel 【不变】（左柜 rl 位置：world -11.15 → rl x=-11.15-(-8)=-3.15 正确）|
| decor-nightstand-right 【可选加？原 DF 仅 left 一条】 | **（或从 nightstand-right 新条目？若 DF 中已有仅 left 1 条，不加；若 cnt-nightstand 承担右柜 TC，则不需要 DF nightstand-right 条目）**| | | Room L544 NightstandModel（右柜视觉）→ 位置不变（TC 对齐 Room 视觉位置）|
| decor-desk | (+1.6, +1.0) | 1.3, 0.75, 0.65 | 0 | Room L568 DeskModel 【不变】|
| decor-desk-chair / decor-chair | (+2.5, +1.0) | 0.45, 0.65, 0.45 | π（面向书桌）| Room L580 ChairFallback rot y=π 【不变】|
| decor-wardrobe | (-3.15, +0.6) | 1.8, 2.1, 0.65 | 0 | Room L586 WardrobeModel 【不变】（西墙衣柜）|
| decor-dresser | (-1.5, +1.5) | 1.2, 0.9, 0.45 | 0 | Room L592 DresserFallback 【不变】|
| decor-bookshelf | (+3.4, +2.0) 【改 z+1.0→z+2.0】| 0.7, 1.6, 0.3 | 0 | Room L598 BookshelfFallback group z 从 +1.0 → +2.0 |
| decor-painting | (0, +3.7) | 0.7, 0.5, 0.05 | π | Room L604 PaintingFallback 【不变】|
| decor-clock | (+3.7, -1.5) | 0.35, 0.35, 0.05 | 0 | Room L610 ClockFallback 【不变】|
| decor-plant / decor-plant-1 | (-2.8, +2.0) | 0.4, 0.9, 0.4 | 0 | Room L627 PlantFallback group z 从 +0.8 → +2.0，x 同步 |

tasks/leave-home.ts（P2.2 允许改本文件）：
  - cnt-nightstand（第二个容器？containers[1]）：
    - position: { x: +1.5, y: 0.275, z: -1.5 }（size 高 0.55 / 2 = 0.275 底面中心 y = 0.275）
    - size: { x: 0.55, y: 0.55, z: 0.45 }
    - surfaceHeight: 0.55（桌面高）
    - modelId: "nightstand"（与 Room 右柜视觉唯一对齐）
  - obj-phone initialPosition：{ x: +1.5 + 0.2, y: 0.275 - 0.1, z: -1.5 + 0.1 }（右柜抽屉内部，x 向床偏移 0.2，y 抽屉中部，z 前侧）
    - surfaceContainerId: "cnt-nightstand"
    - hiddenInContainer: "cnt-nightstand"（抽屉打开才显示）

P2.2-D. World 坐标换算

bedroom center=(-8,0,0) size=8×8 → world x∈[-12,-4], z∈[-4,4]

| 条目 | rl (x,z) | world (x,z) | footprint x/z range | 是否在 [-12,-4]×[-4,4]？ |
|---|---|---|---|---|
| decor-bed | (0,-0.8) | (-8,-0.8) | x∈[-9,-7] z∈[-2.8,0.4] | ✓ |
| cnt-nightstand 新 | (+1.5,-1.5) | (-6.5,-1.5) | x∈[-6.775,-6.225] z∈[-1.725,-1.275] | ✓ x max -6.225 ≤ -4（player 半直径 0.3 → -4 - 0.3 = -4.3，没问题 |
| decor-bookshelf 新 z+2 | (+3.4,+2.0) | (-4.6,+2.0) | x∈[-4.95,-4.25] z∈[+1.85,+2.15] | ✓ x min -4.95 ≥ -12，x max -4.25 ≤ -4（门洞 x=-4 墙东侧无问题）|
| decor-dresser + chair | (-1.5,+1.5)/(+2.5,+1.0) | (-9.5,1.5)/(-5.5,1.0) | | ✓ |

全部在范围内 ✓

P2.2-E. 唯一视觉所有权（改完后）

| 语义 | VS 唯一 | CS 唯一 |
|---|---|---|
| 右床头柜抽屉 = cnt-nightstand | Room L544 NightstandModel（右柜视觉）位置（+1.5,-1.5）= TC 位置 cnt-nightstand(+1.5,-1.5) 统一 | TC cnt-nightstand 唯一（DF 不需要额外加 nightstand-right 条目，TC 碰撞即唯一）|
| 左床头柜（纯装饰）| Room L556 NightstandModel 左柜 | DF decor-nightstand-left（+ DF 新位置 (-3.15,-1.5)）|
| 大床 | Room BedModel | DF decor-bed (0,-0.8) 对齐 |
| 衣柜 + 斗柜 + 书桌 + 椅子 | Room 视觉对应位置 | DF 对应对齐后 |
| 书架（移离门洞）| Room BookshelfFallback rl (+3.4,+2.0) 新 z | DF decor-bookshelf z=+2.0 |
| 西北植物 | Room PlantFallback (-2.8,+2.0) | DF decor-plant 新位置 |
| 挂钟/画 | Room ClockFallback/Painting | None |
| 手机 obj-phone | Object3D obj-phone（hiddenInContainer） | None |

全部唯一（改完后）

P2.2-F. 门洞走行带（§四.7 路径畅通）

living doorway：rl (+4,0)，宽 1.5，走行带 x∈[+2.95,+5.05] z∈[-1.05,+1.05]

| 家具 | footprint 与走行带相交？ | 结论 |
|---|---|---|
| decor-bookshelf 新 z+2.0 | x∈[3.05,3.75] z∈[1.85,2.15] z+1.85 > 走行带 z max 1.05 → 不相交 ✓ | DD=No（原 Yes → No）|
| decor-desk | x∈[0.95,2.25] z∈[0.675,1.325] x max 2.25 < 走行带 x min 2.95 → 净距 0.7 ≥ 0.3 → 不相交 ✓ | |
| decor-chair | x∈[2.275,2.725] z∈[0.775,1.225] x 2.725 < 2.95，净距 0.225 轻微接近但路径可南绕 → 不卡 | |

门洞有效宽度 1.5m ≥ 1.2m ✓
路径：门洞 → 右床头柜畅通（§2.6 验证 ✓）

P2.2-G. 关键路径（固定动线 §二 Stage 1 的 ③→④→⑤ 段）

  G-B1 living → bedroom 门洞进入（rl +4,0）→ 右床头柜 cnt-nightstand (+1.5,-1.5)：走 10 次畅通
  G-B2 bedroom 门洞 → 回到 living 门洞（返回）：10 次畅通

P2.2-H. 自动验收（6/6 通过）

| ID | 检查项 | 通过标准 |
|---|---|---|
| H-B1 | 家具 footprint 房间内 | 0 out-of-room |
| H-B2 | 门洞走行带相交 0 | 0 doorway intersect（书架 DD=No）|
| H-B3 | cnt-nightstand 与 Room 右柜位置差 ≤ 0.1m | 位置误差 ≤ 0.1m |
| H-B4 | obj-phone 初始位置 rl +1.5 右柜抽屉内 | x∈[+1.2, +1.8]（右柜 x 范围内），z∈[-1.725,-1.275]（右柜 z 范围内）|
| H-B5 | 右床头柜 ≥ 1 接近方向（南方向）| approachable ≥ 1（目标 3 方向）|
| H-B6 | visual/collision 唯一 | 0 duplicate VS/CS |

P2.2-I. 人工验收（6/6 通过）

| ID | 操作 | 标准 |
|---|---|---|
| I-B1 | living ↔ bedroom 往返 10 次 | 10/10 不卡（书架/椅子/书桌均不挡）|
| I-B2 | Room 视觉右床头柜（东侧那只）按 F → 抽屉打开 → toast 手机出现 → 再按 F 拾取手机 | 3 步全通；「床头柜」提示与视觉位置严格对应（误差 <0.2m）|
| I-B3 | 走到床边 → 南北方向反复 push 前进 | 碰撞阻挡（不穿床）；视觉床边缘与碰撞边界差 ≤ 0.2m |
| I-B4 | 门洞 → 床头柜路径 10 次 | 10/10 顺利到达，不被任何东西挡住 |
| I-B5 | 卧室全房绕一圈 × 3 | 0 穿模，0 隐形墙，0 过不去 |
| I-B6 | top-down 模式观察 | 绿色碰撞块对齐视觉，大偏差 = 0 |

P2.2-J. 允许修改文件（白名单）

| 文件 | 改动 |
|---|---|
| src/data/decorFurniture.ts → bedroom 数组 | 10 条 position 按 P2.2-C 全改（world → 正确 rl），bookshelf z+1.0→+2.0，plant 同步 |
| src/data/tasks/leave-home.ts | cnt-nightstand position/size/surfaceHeight 改到右柜位置；obj-phone initialPosition 改到右柜抽屉内部 |
| src/components/arena3d/Room3D.tsx → renderBedroom() | BookshelfFallback group 位置 z +1.0→+2.0；PlantFallback 植物位置同步改到 (-2.8,+2.0) |

P2.2-K. 禁止修改文件（黑名单）
  - src/data/decorFurniture.ts living 数组（P2.1 已验收完，禁止回滚或改动）+ entrance 数组（分房隔离）
  - src/data/rooms.ts
  - src/game/*
  - FirstPersonControls.tsx / Container3D.tsx
  - 其他任务代码（clean-table / laundry-sort）
  - ModelAsset / FallbackColorizer 等模型渲染链（除非必要）

============================================================
P2.3 Entrance 实施清单
============================================================
前置条件：P2.1 + P2.2 全房全绿后，才能进 Entrance
验收要求：自动 5/5 + 人工 7/7 通过

P2.3-A. BEFORE 问题（FactCheck §D.3）
  1. E-B1  玄关托盘双份：Room 假托盘 L101-105 (rl -0.4,-2.3) 门洞旁直觉位 + TC cnt-entrance-tray rl (-1.4,+1.0) 西北角 → 完全错位，玩家按视觉位 F 不反应
  2. E-B2  伞架+雨伞 4 处重复：Room 鞋柜上小伞 2 把 + 门洞旁大伞 2 把共 4 处视觉 + TC 伞架西北角又 1 处
  3. E-B3  Room 假托盘上还有钥匙/钱币装饰（L80-93），玩家以为是任务托盘
  4. E-B4  托盘 TC shallow XZ 碰撞 depth 0.1，但碰撞纯 XZ → 可能挡住表面交互
  5. E-B5  DF entrance 数组 8 条位置完美匹配（唯一好消息，DF 不动）

P2.3-B. Proposed Top-Down ASCII（蓝图 §3.2）
  - 玄关方案统一「西北鞋柜论」：鞋柜（decor-shoe-cabinet）rl (-2.4,-0.5) 作为 entrance_console 承担玄关桌角色
  - cnt-entrance-tray 放鞋柜表面上方（x,z 与鞋柜同 (-2.4,-0.5)，y 抬高 1.10+0.05=1.15）
  - cnt-umbrella-stand 放鞋柜靠门南侧（更靠近 living 门）：rl (-2.4,+0.3)，地面位置
  - 删除 Room3D 假托盘（L101-105）+ 假托盘装饰小物（L80-93）
  - 删除 Room3D 全部 4 处装饰伞：L67-78 鞋柜上小红伞/小蓝伞 2 把；L107-131 大装饰伞 2 把
  - obj-umbrella initialPosition 对齐伞架 rl (-2.4,+0.3)

P2.3-C. Room-Local 坐标表

tasks/leave-home.ts containers 修改（entrance 两个 TC 容器）：

| TC id | rl pos(x,z)【新】 | size(x,y,z)【新】 | surfaceHeight【新】 | 备注 |
|---|---|---|---|---|
| cnt-entrance-tray | (-2.4, -0.5) | 0.8, 0.1, 0.4 | 1.15（鞋柜顶 1.10 + 托盘底 0.05）| 位于鞋柜表面；modelId 保持 entrance_tray |
| cnt-umbrella-stand | (-2.4, +0.3) | 0.3, 0.8, 0.3 | 0.8（伞桶顶）| 位于鞋柜南侧靠 living 门一侧 |
| obj-umbrella initialPosition | (-2.4, +0.3)，y = 0.8 - 0.4 = 0.4（伞柄插入伞桶 0.4m）| 0.15, 0.8, 0.15 | surfaceContainerId: cnt-umbrella-stand | |

Room3D.renderEntrance() 删除内容（精准代码行范围需 P2.3 实施时核对实际源码行号）：
  * 假托盘组：EntranceTrayFallback 调用（1 组 group）
  * 假托盘上小物：钥匙 / 硬币 / 钥匙扣 等 mesh（L80-93 区域，约 13 行）
  * 鞋柜上装饰伞 1：小红伞 mesh（L67-72，约 6 行）
  * 鞋柜上装饰伞 2：小蓝伞 mesh（L73-78，约 6 行）
  * 大装饰伞 1：红伞（L107-118 区域，约 12 行）
  * 大装饰伞 2：蓝伞（L119-131 区域，约 13 行）
  * 删除后保留：ShoeCabinetModel / ShoesFallback / HookFallback / Painting / Clock / Plant1 / Plant2 / Shelf

DF entrance 数组 8 条：不变（FactCheck E-B5 说明已完美匹配 ✓）

P2.3-D. World 坐标换算

entrance center=(0,0,8) size=6×6 → world x∈[-3,3], z∈[5,11]

| 条目 | rl (x,z) | world (x,z) | 范围检查 |
|---|---|---|---|
| cnt-entrance-tray | (-2.4,-0.5) | (-2.4,7.5) | x -2.4 ∈ [-2.7,2.7] ✓；z 7.5 ∈ [5.3,10.7] ✓ |
| cnt-umbrella-stand | (-2.4,+0.3) | (-2.4,8.3) | ✓ |
| obj-umbrella | (-2.4,+0.3) | (-2.4,8.3) | ✓ |
| 其他 DF 8 条（不变）| 原位置 | 原 world | ✓（FactCheck 已验证过）|

全部在范围内 ✓

P2.3-E. 唯一视觉所有权（改完后）

| 语义 | VS 唯一（改完后）| CS 唯一（改完后）| 验收（是否完成删除）|
|---|---|---|---|
| 玄关托盘（目标区）| TC cnt-entrance-tray 唯一视觉（鞋柜台面上方，1 处）| TC cnt-entrance-tray 唯一碰撞 | ✓ Room 假托盘 + 托盘装饰全部删除 → 唯一 |
| 伞架 + 雨伞 | TC cnt-umbrella-stand（鞋柜南侧地面，1 处）+ obj-umbrella（伞架内，1 处）| TC cnt-umbrella-stand 唯一碰撞 | ✓ 删除 Room 4 处装饰伞（67-78/107-131）→ 唯一 |
| 鞋柜 entrance_console | Room ShoeCabinetModel rl (-2.4,-0.5) | DF decor-shoe-cabinet rl (-2.4,-0.5) | ✓ 对齐（DF 不动）|
| 鞋子装饰 | Room ShoesFallback | DF decor-shoes | ✓ 对齐 |
| 挂钩/画/钟/植物1/植物2/层架 | Room 视觉 | DF 条目 或 None | ✓ 原位置不动 |

全部唯一（删除重复后）

P2.3-F. 门洞走行带（§五.1 中央通道畅通）

living doorway：rl (0,-3) 宽 1.5 走行带 x∈[-1.05,1.05] z∈[-5.05,-0.95]（entrance rl）

  中央通道方向 +Z（门洞 → 玄关深处），x=0 为中线：
  - 鞋柜 x∈[-3,-1.8] 不挡中线 [-1.05,1.05]
  - 伞架 x∈[-2.55,-2.25] 在西侧，不挡中线
  - 植物1 x=-2.0，植物2 x=+2.0，层架 x=+2.5 均不碰中线
  - 通道宽度（中线 0 东侧最近家具植物2 x+1.875，距中线 x0 净距 1.875m；西侧距鞋柜东边界 x=-1.8 净距 1.8m；综合净宽 = 1.8 + 1.875 = 3.675m？不对，西侧 x -1.8 到 东侧 x +1.875 之间 3.675m 宽，远超 1.2m 最小宽度）→ 超级畅通 ✓

P2.3-G. 关键路径（固定动线 §二 Stage 1 的 ⑥→⑦→⑧ 连续动作）

G-E1 进入玄关后（living 门洞 → entrance 世界 (0,5)）：
  动作 ① 向西走 x=0→x=-2.4，z=5（rl z=-3）→z=7.5（rl z=-0.5）鞋柜托盘 → 按 F 放手机
  动作 ② 向北走 z=7.5（rl -0.5）→ z=8.3（rl +0.3）同 x=-2.4 → 伞架 → 按 F 拿雨伞
  动作 ③ 向南走 z=8.3→z=7.5，回托盘 → 按 F 放雨伞
  顺手动线 = 沿 x=-2.4 同线 z 前后走 0.8m 来回，极其顺手 ✓（§五.8 要求）

P2.3-H. 自动验收（5/5 通过）

| ID | 检查项 | 标准 |
|---|---|---|
| H-E1 | 家具 footprint 房间内 | 0 out-of-room |
| H-E2 | 门洞走行带不相交 | 0 intersect；中央通道 x∈[-1.05,1.05] z∈[-3,-0.95] 无家具 |
| H-E3 | 托盘 + 伞架 visual 唯一（仅 TC 各 1 处，Room 假视觉数 = 0）| 假托盘 count=0；装饰伞 count=0 |
| H-E4 | 托盘 ≥1 接近方向（东侧 x+方向接近鞋柜正面，无阻挡）；伞架 ≥1 接近方向（南侧/东侧方向）| 两者都 approachable ≥1 |
| H-E5 | visual/collision 唯一 | 0 duplicate VS / CS 警告 |

P2.3-I. 人工验收（7/7 通过）

| ID | 操作 | 通过标准 |
|---|---|---|
| I-E1 | living ↔ entrance 往返 10 次（走中央通道）| 10/10 顺畅，不被任何家具（鞋柜、植物、伞架、层架）卡住 |
| I-E2 | 鞋柜表面（上方）看到橙色托盘圈（cnt-entrance-tray 视觉）→ 按 F → 弹出「玄关托盘（目标区）」提示 | 成功；位置与托盘视觉 1:1 |
| I-E3 | 鞋柜南侧地面伞架 cnt-umbrella-stand → 按 F 开抽屉（或直接）→ 伞出现在伞架内 → 再按 F 拾取伞 | 成功；「伞被拿」toast 出现 |
| I-E4 | 连续动作 test（Stage 1 ⑥⑦⑧）：拿手机后进入玄关，按路径放手机 → 拿伞 → 放伞（按上述动线），走 5 次 | 5/5 全部成功，无操作失败，无定位错位 |
| I-E5 | 全房扫描（门洞旁 / 鞋柜上 / 柜子旁）→ 假托盘 / 装饰伞出现次数 | 假托盘 = 0；红伞蓝伞小伞大伞 = 0；只存在 TC 托盘 + TC 伞架 + obj-umbrella 三处任务语义视觉 |
| I-E6 | 全房绕一圈 × 3 | 0 穿模，0 隐形墙，0 过不去 |
| I-E7 | top-down 模式 | 绿色碰撞块与视觉对齐；DF 鞋柜与 TC 托盘/伞架堆叠层次正确 |

P2.3-J. 允许修改文件（白名单）

| 文件 | 改动 |
|---|---|
| src/data/tasks/leave-home.ts | cnt-entrance-tray position/size/surfaceHeight 改到鞋柜台面上方 rl (-2.4, -0.5)；cnt-umbrella-stand 改到鞋柜南侧 rl (-2.4, +0.3)；obj-umbrella initialPosition 同步对齐伞架 |
| src/components/arena3d/Room3D.tsx → renderEntrance() | 删除：假托盘组 + 假托盘装饰小物 + 鞋柜上小伞 2 把 + 大装饰伞 2 把（约 6 个 group 删除，累计约 50 行删除）|
| （可选）src/components/arena3d/models/ModelRegistry.ts | 如需新增 umbrella_stand 专属 Fallback 时改动；若先用 cabinet fallack 则不动 |

P2.3-K. 禁止修改文件（黑名单）
  - src/data/decorFurniture.ts 任何数组（Living/Bedroom 已验收完；Entrance DF 8 条已完美匹配不动）
  - src/data/rooms.ts
  - src/game/*
  - FirstPersonControls / Container3D / ModelAsset / FallbackColorizer
  - clean-table / laundry-sort 任务代码
  - 其他任务场景文件

============================================================
跨房联调验收（P2.3 通过后执行，最后一步）
============================================================
前置条件：P2.1 + P2.2 + P2.3 三房单独 100% 全绿后

C-1 任务全流程通关 × 2（固定动线 §二 12 步全走一遍）：
  C-1.1 通关 1（Run A）：正常流程：
    ① spawn → ② coffee-table E 保存钥匙 → ③→④ bedroom 右柜 F 开抽屉取手机 → ⑤→⑥ entrance tray F 放手机 → ⑦ umbrella-stand F 拿伞 → ⑧ 回 tray F 放伞 → ⑨ 回 living 走到猫 moved key (-3.2,-3.2) → ⑩ E 更新钥匙记忆 → ⑪ entrance tray F 放钥匙 → ⑫ 关卡完成 → Probe → Result 正常
  C-1.2 通关 2（Run B）：故意多走回头路验证不卡死：
    每两个步骤之间从 living → bedroom → living → entrance → living，多走完整房间遍历 × 3，最后完成 12 步。

C-2 通关标准（C-1 必需全满足）：
  - 2/2 全流程完成，不出现软锁（score 0 且目标完成不了）
  - 关键容器（茶几/床头柜/玄关托盘/伞架）的 F 交互与视觉位置 100% 对应（无错位点按 F 无反应）
  - 任何房间穿墙次数 = 0
  - 无「隐形墙（过得去过不去 / 看得到过不去）」出现次数 = 0
  - 跨房间穿门 10 次 0 卡（每次通过耗时 ≤ 1s，无反弹）

C-3 最终自动 QA：
  npm run lint && npm run build && npm test && npm run qa
  - lint 0 error / 0 warning（或与 P1 基线一致 warning 数）
  - build 成功（TypeScript 0 error）
  - test 全部 passed（L1/L2/L3 单元测试）
  - qa 工具 SV1-SV8 红橙线 = 0（SV7 红线 0：无 mesh bounds 直接当碰撞）

C-4 人工走查（可选真人 2 名交叉测）：
  - 玩家 A：走动线 × 3
  - 玩家 B：乱走（WASD 疯狂按）× 2 分钟，找穿模/卡死/隐形墙

============================================================
清单结束说明
============================================================
本清单到此结束。P2.1/P2.2/P2.3 三房全通过 + 跨房联调 C-1~C-4 通过 → P2 布局阶段结束。
本轮（P2.0 文档阶段）禁止：改源码 / 下载模型 / 改任务逻辑 / 开始 P2.1 / commit / push。
所有实施操作必须由 P2.1-P2.3 分房阶段执行，本阶段仅交付上述文档与清单三张，完成后停止。
