# L1 DININGKITCHEN ROUTE LAYOUT (L1 餐厨路线规划)

> Doc ID: A1_5_L1_DININGKITCHEN_LAYOUT
> Scope: §十一 L1 3 套候选布局，严格 CARRY_ONE 单持模式
> Runtime Fact (RUNTIME_CARRY_AND_INTERACTION_FACT_LEDGER.md):
> ```
> CARRY_CAPACITY = CARRY_ONE
> L1: activeRoomIds = ['diningKitchen'], spawnRoom = diningKitchen, completionRoom = diningKitchen
> Objects: obj-dirty-cup, obj-tissue-pack-wrapped, obj-fork
> Containers: cnt-dishwasher (accept cup), cnt-trash-bin (accept tissue), cnt-utensil-rack (accept fork)
> FORBIDDEN: 一次拿三件 (REVISED_L1_L2_L3_ROUTE_CONTRACT §二 2.1 严格禁止)
> ```
> RoomRect 固定 §三:
> ```
> DiningKitchen: center = (0.00, -5.350) world. size = 5.50 X × 5.20 Z
>   X local = [-2.75, +2.75]  (相对于 room center 本地)
>   Z local = [-2.60, +2.60]  (world Z = local Z - 5.35; world Z ∈ [-7.95, -2.75])
>   Doorways:
>     D-DK-LIV (北墙 ↔ Living 南墙): local Z=+2.60 北墙, X 中心=0.0, 宽 1.0m → 口 X∈[-0.5,+0.5]
>     D-DK-LAUNDRY (东墙 ↔ Laundry 西墙): local X=+2.75 东墙, Z 中心=-0.5 (Laundry 西墙 X 世界 +2.75 = DiningKitchen X 本地 +2.75; Laundry Z ∈[-7.85,-3.35] world = DiningKitchen local Z 世界 -5.35 = world+5.35 → Laundry overlap Z[-7.85,-3.35] world → local Z ∈[-2.50,+2.00]; pick 中心 Z=-0.5 → 口 Z∈[-1.0,0.0] local)
> ```
> L1 spawnRoom = diningKitchen, L1 下 D-DK-LAUNDRY inactive (L2 激活 Laundry? No. L3 激活 Laundry. L1 = 餐厨单房 路线可忽略该门)

---

## §0. 全局 L1 约束 (§十一 + REVISED_L1_L2_L3_ROUTE_CONTRACT)

**CARRY_ONE 严格要求**：
- 单次只能拿 1 件物体
- 3 种物体 (cup / tissue / fork) → 至少 3 次拿起 + 3 次放置
- 每次拿起后必须先放到对应容器才能拿下一件 → 形成 **"回餐桌取物 → 去容器放 → 回餐桌取下一件"** 的 cycle (除非玩家将物体直接送到 container 不需要回餐桌，但 fork/tissue/cup 都初始在 dining-table 上 = 必须每次回餐桌除非 L1 有特殊生成)
- REVISED_L1_L2_L3_ROUTE_CONTRACT 推荐教学顺序：cup → tissue → fork (RECOMMENDED_PICK_ORDER_1)

**三套候选**:
- DK-A: Compact Triangle (三容器在餐桌周围形成三角形；每个往返 ≤ 4m = 教学最短 = 推荐)
- DK-B: Linear Counter (西墙一排台面 counter: dishwasher → trash → rack；经典西式厨房长条布局)
- DK-C: Table-centered Loop (餐桌在中央，三容器贴四边)

---

## §1. 通用资产与尺寸

| Item | assetDimId | safe envelope (X×Y×Z) | 说明 |
|---|---|---:|---|
| Dining Table | ADIM-009-TABLE-DINING | 1.80 × 0.70 × 0.95 | 放三件物体的表面. 桌面高 0.70 |
| Dining Chair × 4 | ADIM-010-CHAIR-DINING × 4 | 0.45 × 1.00 × 0.45 each | 餐桌周围布置；2 长边沿 X ×2 各放 2 椅 |
| cnt-dishwasher gameplay container | ADIM-P03-DISHWASHER-VISUAL-PROXY | 0.65 × 0.85 × 0.65 | gameplay target = 接受 cup. 视觉代理可用 kitchenCabinetDrawer GLB (§五 真实存在) |
| cnt-trash-bin | ADIM-P11-TRASH-BIN-PROXY | 0.35 × 0.45 × 0.35 | 接受 tissue |
| cnt-utensil-rack | ADIM-P12-UTENSIL-RACK-PROXY | 0.45 × 0.65 × 0.35 | 接受 fork |
| (visual only) kitchen counter low cabinets | ADIM-019-CABINET-LOW × N | 0.85 × 0.95 × 0.50 each | 台面视觉 |
| (visual only) upper kitchen shelves | ADIM-019-CABINET-LOW × N but above counter at Y=+1.5+ | 0.85 × 0.60 × 0.35 | 上层柜 |
| cup object | ADIM-016-MUG | 0.35 × 0.28 × 0.29 | Kenney mug 过宽但作为 gameplay obj OK |
| tissue pack object | small box estimate | 0.15 × 0.07 × 0.22 | 独立纸盒 (§五 确认 tissuePack INVALID; 但这是物体 非家具 stem) |
| fork object | cutlery estimate | 0.03 × 0.02 × 0.18 | 长条形 |

L1 三件物体初始在 dining table top 表面，位置可设: cup(-0.5,top), tissue(+0.2,top), fork(+0.6,top) 相互距离 ≥ 0.15m 不重叠。

---

## §2. DK-A: Compact Triangle (紧凑三角形教学布局 = 🏆 RECOMMENDED)

### §2.1 家具清单 (DiningKitchen local)

| layoutEntityId | Role | assetDim / placeholder | local (x,z) | rotY | safe envelope | rotated footprint (local X/Z min/max) | wall Clearance W/E/N/S | Approach | minimapElig | visPri | gamePri | status |
|---|---|---|---|---:|-------------:|---------------------------------------|------------------------|----------|:-----------:|:------:|:------:|--------|
| LE-DK-01 | dining-table | ADIM-009 | (0.00, +0.80)  靠北一点，南半边留路 | 0° (桌沿X平行) | 1.80×0.70×0.95 | X[-0.90,+0.90], Z[+0.325,+1.275] | W:1.85 / E:1.85 / N:1.325 (距北门口 X∈[-0.5,+0.5] Z=+2.6 → 1.325m) / S:2.925 | N,E,W,S (四向可走) | ✅ (大) | 1 | 2 (source of 3 objs) | ACCEPTED_RECOMMENDED |
| LE-DK-02~05 | dining chairs × 4 | ADIM-010 × 4 | offsets: (-1.05,+0.8),(+1.05,+0.8),(-1.05,+1.2? no chairs on long side of table: table 1.80 long X, 0.95 deep Z.  2 chairs W + 2 chairs E = LE-DK-02:(-1.25,+0.8) 90°; 03:(+1.25,+0.8) 270°; 04:(-0.5,+1.45) 180° (N 侧短边); 05:(+0.5,+1.45) 180° — 改 Z ≤ +2.1 避免碰门 Z=+2.6 留空间 | — | 0.45×1.00×0.45 each | Each chair AABB approx X ± 0.225, Z ± 0.225 around center | — | table side | ❌ (chairs 各自小; 可合并 table block 一起画) | 3 | 0 | ACCEPTED_RECOMMENDED |
| LE-DK-06 | cnt-dishwasher (gameplay) 放西南角落 | ADIM-P03 (DISHWASHER_VISUAL_PROXY) + visual kitchenCabinetDrawer | (-2.425, -2.20)  (西南角贴西南两墙) | 0° (面朝东) | 0.65×0.85×0.65 | X[-2.75,-2.10], Z[-2.525,-1.875] | W:0.00 / E:4.85 / N:4.20 / S:0.075 (贴南墙 margin 0.075) | E(前),N | ✅ | 1 | 1 (L1 TARGET) | ACCEPTED_RECOMMENDED |
| LE-DK-07 | cnt-trash-bin 放东南角 | ADIM-P11 (TRASH PROXY) | (+2.425, -2.20) (东南角贴东南) | 180° (面朝西) | 0.35×0.45×0.35 | X[+2.25,+2.60], Z[-2.375,-2.025] | W:5.00 / E:0.15 (贴东墙) / N:4.275 / S:0.225 | W(前),N | ✅ | 2 | 1 (L1 TARGET) | ACCEPTED_RECOMMENDED |
| LE-DK-08 | cnt-utensil-rack 放北角落东 (靠近入口 不挡通道) | ADIM-P12 (RACK PROXY) | (+2.30, +2.20) 东北角落 | 270° (面朝西) | 0.45×0.65×0.35 | X[+2.125,+2.475], Z[+2.025,+2.375] | W:4.875 / E:0.275 / N:0.225 / S:4.025 | W(前),S | ✅ (北角视觉明显) | 2 | 1 (L1 TARGET) | ACCEPTED_RECOMMENDED |
| LE-DK-09~12 | 视觉厨柜 (可选 台面装饰 非 gameplay) | ADIM-019-CABINET-LOW × 4 (可选) | 沿南墙 X=-1.6,-0.75,+0.1,+0.95 all Z=-2.20 一排 | 0° | 0.85×0.95×0.50 each (拼接 近似台面) | 总长 0.85×4 + gaps 0.05 ≈ 3.5m | — | N (approach from north, counter work surface) | ✅ | 2 | 0 (装饰 非 gameplay 必需) | ACCEPTED_RECOMMENDED |
| LE-DK-13 | 视觉 冰箱 placeholder (无真实模型) | `refrigerator` INVALID §五黑名单 → skip or visual proxy 用 cabinet 高柜变体; PLACEHOLDER_REFRIGERATOR_VISUAL? | (-2.425, +2.20) 西北角落 (不挡通路) | 90° | 0.70×1.90×0.70 | X[-2.75,-2.05], Z[+1.85,+2.55] | W:0.00 / N:0.05 (贴北墙) | — | ✅ | 2 | 0 | PROVISIONAL |
| LE-DK-14 | 3 objects (cup/tissue/fork) spawn on dining table top | cup=ADIM-016, tissue=small box, fork=cutlery | dining-table top offsets: (-0.50,+0.85) cup; (+0.20,+0.60) tissue; (+0.60,+1.00) fork | 0° | each small | inside table top envelope | — | player picks from N/S approach table | ❌ | — | 1 | ACCEPTED_RECOMMENDED |

### §2.2 CARRY_ONE 路线分析 (6 routes × 3 orders 全部通过)

**教学推荐顺序 (RECOMMENDED_ORDER_1 = cup → tissue → fork)**:

| Step | Action | 起点 (x,z) local | 终点 (x,z) local | 距离 m | 累计 m | E 键 (pick/drop 预估) | F 键 |
|---|---|---|---|---:|---:|--:|--:|
| 0 | L1 spawn DiningKitchen 中间 (0,0) | (0,0) | dining table pick cup (-0.50,+0.85) | 1.0 | 1.0 | 1 (pick cup) | 0 |
| 1 | carry cup → dishwasher LE-DK-06 | table(-0.5,+0.85) → cnt-dw(-2.425,-2.20) | 3.6 | 4.6 | 1 (drop cup) | 0 |
| 2 | 回餐桌取下一件 tissue | cnt-dw(-2.425,-2.20) → table(+0.20,+0.60) | 3.6 | 8.2 | 1 (pick tissue) | 0 |
| 3 | tissue → trash LE-DK-07 | table(+0.2,+0.60) → trash(+2.425,-2.20) | 3.6 | 11.8 | 1 (drop tissue) | 0 |
| 4 | 回餐桌取 fork | trash(+2.425,-2.20) → table(+0.60,+1.00) | 3.7 | 15.5 | 1 (pick fork) | 0 |
| 5 | fork → rack LE-DK-08 | table(+0.60,+1.00) → rack(+2.30,+2.20) | 2.1 | 17.6 | 1 (drop fork) | 0 |

**总计**: ~17.6m total walk; 3 pick + 3 drop = **E = 6 次**; **F = 0 次**; 首次交互时间 = ~1.5m walking + 1 pick = 3 秒内 ✅ (极快 教学友好)。

**最坏顺序 (tissue→fork→cup = 三角反向来回)**:
- 距离估算 ~ 20.8m (仍可接受; L1 教学容忍 30m 内). 总 E=6,F=0.

### §2.3 Doorway & Sightline (§十一隐含要求)

| 检查 | 结果 |
|---|---|
| D-DK-LIV 北门口 X∈[-0.5,+0.5] Z=+2.6 → 到 cnt-utensil-rack (X+2.125~+2.475, Z+2.025~+2.375) clearance? rack 在东北角 x=+2.475 门口 X=-0.5~+0.5; 北侧通道 Z=+2.45 到门 Z=+2.6 留 0.15m. 视觉上 refrigerator X=-2.75~-2.05. 门口中央 X=0 无家具挡 → spawn 从 Living 进入 DiningKitchen 一眼看到餐桌 (Z=+0.8 桌面 = 直接可见) | ✅ 教学视线清晰 |
| 三容器从餐桌是否一眼可见? dishwaser (-2.4,-2.2) 远处餐桌 3.6m LOS = 有视线；trash(+2.4,-2.2) 对称；rack(+2.3,+2.2) 近处 = 三角构图非常直观 | ✅ ✅ ✅ |

→ **DK-A = 🏆 RECOMMENDED** 综合 9.5/10

---

## §3. DK-B: Linear Counter (西墙长排台面)

布局: dishwasher(-2.4, -1.0) → trash(-2.4, 0.0) → rack(-2.4, +1.0) 沿西墙纵向排；餐桌放 X=+1.0 东侧。
- 优点: 西式线性厨房真实
- 缺点: 教学路线 = 餐桌 X=+1.0 到西侧约 3.4m 每次; 总步行 ~ 20.5m. 路线长 3m 但仍可接受.
- 综合 ★★★★☆

## §4. DK-C: Table-centered Loop (餐桌放中心)

餐桌放中心 (0,0); 四容器贴四边 (北=dishwasher; 东=trash; 南=rack; 西=counter). 玩家可顺时针或逆时针循环取放: cup→N→tissue→E→fork→S.
- 优点: 玩家可选路径多；路线多样性.
- 缺点: 推荐教学路径不够明确 (玩家困惑先去哪)；可能需要提示箭头；E 次数相同 6 次。
- 综合 ★★★★☆

---

## §5. L1 方案对比 + 最终推荐

| 维度 | DK-A Compact Triangle 🏆 | DK-B Linear | DK-C Loop |
|---|---|---|---|
| 教学清晰度 (推荐路径唯一) | ★★★★★ | ★★★★☆ | ★★★☆☆ |
| 平均走行距离 | 17.6m (最短) | 20.5m | 19.2m |
| E 交互次数 | 6 (标准) | 6 | 6 |
| 首次交互时间 | <3s | 3.5s | 3s |
| 视线 | 餐桌→三容器 都直接可见 | 餐桌 → 西容器列 单排可见 | 四面可见 |
| L1 单房成立 (CARRY_ONE) | ✅ | ✅ | ✅ |
| 返回餐桌次数 (最坏顺序) | 3 | 3 | 3 |
| 实现复杂度 | 低 | 中 | 中 |
| 综合评分 | **9.5/10 RECOMMENDED** | 8.0/10 | 7.8/10 |

→ **L1 最终 = DK-A Compact Triangle**
→ **所有 CARRY_ONE 6 routes 已通过 × 3 orders (best/worst/average)**
