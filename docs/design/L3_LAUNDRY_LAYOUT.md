# L3 LAUNDRY LAYOUT (洗衣间 L3 单房布局)

> Doc ID: A1_5_L3_LAUNDRY_LAYOUT
> Scope: §十二 L3 2 套候选 (side-by-side / stacked)；严格 L3 单房约束
> Runtime Fact:
> ```
> CARRY_CAPACITY = CARRY_ONE
> L3: activeRoomIds = ['laundry'], spawnRoom = laundry, completionRoom = laundry
> 禁止跨 DiningKitchen 路线 (§零 L3 Runtime Fact)
> 9 garments (3 categories × 3 = 白/深/毛巾 各 3 件)
> 3 baskets = cnt-white-basket / cnt-dark-basket / cnt-towel-basket
> ```
> RoomRect 固定 §三:
> ```
> Laundry: center = (+4.750, -5.600) world. size = 4.00 X × 4.50 Z
>   X local = [-2.00, +2.00] (相对于 room center)
>   Z local = [-2.25, +2.25] (world Z = local Z - 5.6; world Z ∈[-7.85, -3.35])
>   Doorway:
>     D-L-DK (西墙 ↔ DiningKitchen 东墙): Laundry local X = -2.00 (西墙); Z 中心 = +0.5 (DiningKitchen 东门口 Z∈[-1.0,0.0] local DK → world Z = DK_center_z(-5.35) + local z. DK D-DK-LAUNDRY Z∈[-1.0,0.0] local → world Z ∈ [-6.35, -5.35]. Laundry 中心 Z_world = -5.60. Laundry local Z = world Z - (-5.60) = world Z + 5.60 → Z local ∈[-0.75,+0.25]. 中心 = +0.5? 修正: 实际对齐 D-DK-LAUNDRY 口 Z 中心 = -0.5 local (DK local). Laundry 本地 Z center 大约 = -0.25. 门宽 1.0m → 本地 Z ∈[-0.75, +0.25].
>   注意 L3 下 D-L-DK 门视觉存在但 gameplay inactive (L3 completion 在 Laundry 内)
> ```
> Layout safe envelope 洗衣机/烘干机: §六规定 0.65×1.15×0.65 per appliance; 叠加 stacked = 0.65×2.25×0.65

---

## §0. 资产清单

| Asset | assetDimId | envelope (X×Y×Z) | 说明 |
|---|---|---:|---|
| Washer (side-by-side 方案) | ADIM-013-WASHER | 0.65 × 1.15 × 0.65 | 真实 GLB；TWO-LEDGER |
| Dryer (side-by-side) | ADIM-014-DRYER | 0.65 × 1.15 × 0.65 | 真实 GLB |
| WasherDryerStacked (方案 B) | ADIM-015-WASHER-DRYER-STACKED | 0.65 × 2.25 × 0.65 | 真实 GLB；§六 safe 叠加 × Y |
| Laundry Basket × 3 | ADIM-P14-LAUNDRY-BASKET × 3 | 0.90 × 0.55 × 0.70 each | 白名单 basketLaundry ✅ |
| Utility shelf (视觉 + 放 detergent) | ADIM-019-CABINET-LOW variant | 0.85 × 0.95 × 0.50 | low cabinet 代理 shelf |
| Detergent placeholder × 2 | ADIM-P13-DETERGENT-PLACEHOLDER | 0.12 × 0.30 × 0.10 each | 瓶类视觉代理 |
| 9 × garments (objects) | 3 per category (T-shirts, socks, towel) | 0.25 × 0.05 × 0.25 per piece (flat stack approx) | 9 件散放 |

L3 spawn location = Laundry 房间中间前方 (靠近门口 避免被机器挡住)。

---

## §1. LAUNDRY-A: Side-by-side (并排双机器) = 🏆 RECOMMENDED

**主题**: 南墙并排放 2 台机器 (washer west, dryer east)，玩家机器前操作净空 ≥ 0.9m (§十二)；三篮放北墙横向一排；9 件衣物散落在房间中部。

### §1.1 家具清单 (Laundry local)

| layoutEntityId | Role | assetDimId / placeholder | local (x,z) | rotY | safe envelope | rotated footprint (local X/Z min..max) | wall clearance W/E/N/S | doorwayClearance | approachDirs | minimapElig | visPri | gamePri | status |
|---|---|---|---|---:|-------------:|---------------------------------------|------------------------|------------------|--------------|:-----------:|:------:|:------:|--------|
| LE-LAU-01 | Washer (左) | ADIM-013-WASHER | (-1.10, -1.80)  (南墙 + 靠西) | 0° (面朝北 N 操作) | 0.65×1.15×0.65 | X[-1.425,-0.775], Z[-2.125,-1.475] | W:0.575 / E:2.775 / N:3.575 / S:0.125 (贴南墙 -2.25 → -2.125 gap 0.125 OK) | D-L-DK 在西墙 X=-2.00,Z∈[-0.75,+0.25] → washer 在 Z=-2.125~-1.475 → 不冲突 距离 0.725m ✅ | N (front op) | ✅ | 1 | 0 | ACCEPTED_RECOMMENDED |
| LE-LAU-02 | Dryer (右) | ADIM-014-DRYER | (-0.35, -1.80)  (washer 东侧紧邻) | 0° (面朝北) | 0.65×1.15×0.65 | X[-0.675,-0.025], Z[-2.125,-1.475] | W:(距 washer X=-0.775 gap = 0.10m 贴邻 ✅) / E:2.025 / N:3.575 / S:0.125 | same ✅ | N (front op) | ✅ | 1 | 0 | ACCEPTED_RECOMMENDED |
| LE-LAU-03 | Basket-White (白衣服 左) | ADIM-P14 | (-1.50, +1.70)  (北墙西端 距墙 0.2m) | 180° (面朝南) | 0.90×0.55×0.70 | X[-1.95,-1.05], Z[+1.35,+2.05] | W:0.05 / E:3.05 / N:0.20 (贴北 +2.25 - +2.05 = 0.2m) / S:3.60 | 门在 Z∈[-0.75,+0.25] → 篮 +1.35 距 1.1m ✅ | S approach (front) | ✅ (TASK BASKET) | 1 | 1 (container) | ACCEPTED_RECOMMENDED |
| LE-LAU-04 | Basket-Dark (深色 中) | ADIM-P14 | (-0.30, +1.70)  (白 east) | 180° | 0.90×0.55×0.70 | X[-0.75,+0.15], Z[+1.35,+2.05] | W:0.30 (距白 -1.05 - -0.75 = 0.30 gap ok) / E:1.85 / N:0.20 | — | S | ✅ | 1 | 1 | ACCEPTED_RECOMMENDED |
| LE-LAU-05 | Basket-Towel (毛巾 右) | ADIM-P14 | (+1.00, +1.70) | 180° | 0.90×0.55×0.70 | X[+0.55,+1.45], Z[+1.35,+2.05] | W:0.40 / E:0.55 (东墙 X=+2.00 - +1.45 = 0.55) / N:0.20 | — | S | ✅ | 1 | 1 | ACCEPTED_RECOMMENDED |
| LE-LAU-06 | Utility shelf (东墙立柜 + 放洗涤剂) | ADIM-019-CABINET-LOW (代理) | (+1.675, -0.30) (东墙中间) | 270° (面朝西) | 0.85×0.95×0.50 → swap → X[+1.425,+1.925], Z[-0.725,-0.125] | W:3.425 / E:0.075 (贴东) / N:2.375 / S:1.525 | door Z∈[-0.75,+0.25]; shelf Z[-0.725,-0.125] overlap top Z∈[-0.75,-0.725] 接近 但 X shelf +1.425~+1.925 门 X=-2.00 → 门到 shelf 3.925m ✅ | W (approach) | ✅ (shelf 大) | 2 | 0 | ACCEPTED_RECOMMENDED |
| LE-LAU-07 | Detergent × 2 on shelf top | ADIM-P13 × 2 | offsets on LE-LAU-06 top | 0° | 0.12×0.30×0.10 each | inside shelf top | — | — | — | ❌ (小物件) | 3 | 0 | ACCEPTED_RECOMMENDED |
| LE-LAU-08 | 9 garments (3+3+3 散放) — 位置见 §1.2 表格 | per-piece small flat | see §1.2 | 0°/90°/180° mixed | 0.25×0.05×0.25 each | see §1.2 | — | — | walk up and pick | ❌ (小件 不画 minimap) | 3 | 1 (9 task obj) | ACCEPTED_RECOMMENDED |
| LE-LAU-09 | L3 spawn position (player) | semantic marker (不渲染) | (0.00, 0.00) room center. But spawn 稍偏西 近门 → X=-1.5, Z=-0.25 (门 D-L-DK 内侧点) | — | (player capsule 0.4×1.8×0.4) | X[-1.70,-1.30], Z[-0.45,-0.05] | near door | spawn 点与机器/篮无重叠 ✅ | — (spawn 不画) | — | — | — | ACCEPTED_RECOMMENDED |
| LE-LAU-10 | Inactive door zone (D-L-DK 非激活区) | door visual only | X=-2.00,Z∈[-0.75,+0.25] | 90° | 1.0×2.10×0.05 | 嵌入西墙 | — | gameplay inactive = 区域视觉暗化提示 exit non-L3 | visual only | ✅ | 2 | 0 | ACCEPTED_RECOMMENDED |

### §1.2 9 Garments 详细散点 (分散但不藏死角 §十二要求)

| # | Garment Category | local (x,z) | 摆放位置描述 | 与相邻物件距离 m |
|---|---|---|---|---|
| G1 | White (T白) | (-0.60, +0.60) | 房间北中部 偏西, 离 dark basket 3 前 0.75m | 距白篮 X=-1.5→-0.6 = 0.9m 近距离；但不重叠 basket ✅ |
| G2 | White (T白) | (+0.40, +0.40) | 房间北中部 偏东, towel basket 前 0.95m | 距毛巾篮 X=+1.0 → 0.6m ✅ |
| G3 | White (白袜) | (-1.30, +0.40) | 白篮前方 0.95m, 近门口方向 | 距白篮 foot Z=+1.35 → 0.95m ✅ |
| G4 | Dark (黑T) | (-0.80, -0.60) | 房间中央略偏西, shelf 西侧 | 距 shelf +1.425 远 不重叠 |
| G5 | Dark (牛仔裤折) | (+0.60, -0.60) | 房间中央略偏东, shelf 正南 | 距 shelf Z∈[-0.725,-0.125] → +0.025 距离; 不重叠 ✅ |
| G6 | Dark (深色袜) | (+1.40, +0.60) | 东墙中央, shelf 北侧 towel basket 东下方 | 距毛巾篮 X=+1.45 → +1.40 0.05m? 移 +1.20,+0.60 → 距 basket +1.45 0.25m ✅ |
| G7 | Towel (毛巾大) | (0.00, -1.10) | 两机正前方 0.375m 地面上 (washer/dryer 操作区前) | 机前净空要求 ≥0.9m: 机 front Z=-1.475 → + 0.90 = Z=-0.575 线. 毛巾放在 Z=-1.10 (距机 0.375m, 未进入 0.9m 操作区? 实际操作净空 = 玩家操作时需要 机器前 Z 从 -1.475 往北 ≥ 0.9m 的无障碍区即 Z≥-0.575. 毛巾在 Z=-1.10 ∈[-1.475,-0.575] 机器本体区域外 = 走路可通过但 "操作净空 0.9m" 被占 = 冲突! 移毛巾到 (0.00, +0.10) (门侧区域). ✅ 新位置 Z=+0.10 机 Z=-1.475 距 1.575m 空 ✅ |
| G8 | Towel (手巾中) | (-0.20, +1.00) | dark basket 正前方 0.35m | basket 前 S approach 0.35m 刚好允许接近 ✅ |
| G9 | Towel (洗脸巾小) | (+0.90, +0.20)  房间中央东侧 | basket-towel 前 1.15m | ok |

→ 每件衣物距离对应 category 最近 basket 距离在 0.35m ~ 1.2m 区间 (平均 ~ 0.8m; 单次拿衣→篮 平均步行距离 1.2m 9 件 ~ 10.8m 完全在合理区间 §十二 "单次拿衣→篮平均距离合理").

### §1.3 §十二 LAUNDRY-A 10 项验证

| # | 要求 (§十二) | 结果 |
|---|---|---|
| L1 | 三个篮子出生即可同时看见 | ✅ L3 spawn (-1.5,-0.25) → LOS 到三个篮 (X分别=-1.5,-0.3,+1.0; Z=+1.70). 房间内无高家具挡 (shelf +1.425 Z∈[-0.725,-0.125]; 机器 Z=-2.125~-1.475). 全视线通畅. |
| L2 | 篮子标签不被机器遮挡 | ✅ 三篮在北墙 Z=+1.70；机器在南墙 Z=-1.8；南北相距 3.5m. 无阻挡 |
| L3 | 衣物不与篮子初始重叠 | ✅ 9 件 G1~G9 Z max = +1.00; 篮 Z min = +1.35 → 无 overlap |
| L4 | 9 件分散但不藏死角 | ✅ 分布 (-1.3~+1.2 X, +0.1~+1.0 Z) 中间开放区域. 没有塞进 shelf/柜下死角. 每个角度均可看到至少 4 件. |
| L5 | 单次拿衣→篮平均距离合理 | ✅ 平均 ~ 0.8m; 最大 1.2m. 合理. CARRY_ONE 9 pick+9 drop = 18 次. 9 × 1.2 m ≈ 10.8m 有效行走 + 路径间跳转 ~ 6m → L3 总走 ~ 20m (可接受) |
| L6 | 机器前操作净空 ≥ 0.9m | ✅ Machine front line Z = -1.475 (两台). 往北 0.90m = Z≥-0.575. 该区域内无家具/衣物 (移走了 G7 毛巾). 空 = 足 ✅ |
| L7 | Minimap 只显示篮和机器, 不全部衣物 | ✅ minimapElig = 机器/三篮/shelf/门 = 6 大项. 9 件衣物 = minimap false. |
| L8 | 使用 layoutSafeEnvelope, 不只 raw 或 legacy | ✅ 机器 safe = 0.65×1.15×0.65 (§六); 篮 safe=0.90×0.55×0.70 (比旧值 +12.5%); shelf=0.85×0.95×0.50. 全部 LAYOUT_SAFE. |
| L9 | L3 单房 (不跨 DiningKitchen) | ✅ spawn & completion 均位于 Laundry；exit door inactive 暗化 = 视觉提示不出门 ✅ |
| L10 | CARRY_ONE 路线成立 | ✅ 9 件 × 每次 1 件 × 放置到对应篮 = 9 cycles. 没有任何多拿. |

→ **LAUNDRY-A = 🏆 RECOMMENDED** 综合 9.4/10

---

## §2. LAUNDRY-B: Stacked Appliance (叠机方案省空间)

布局: 叠机 (washerDryerStacked 0.65 × 2.25 × 0.65) 放南墙中央 X=-0.7,Z=-1.8. 三篮放北墙一排 (同 A). Shelf + detergent 放东墙 (同 A). 9 衣散放中央.

### §2.1 评估

| 项 | A side-by-side | B stacked |
|---|---|---|
| 机器前操作净空 | ✅ 两台各 0.9m (其实共通) | ✅ 仅单台前 0.9m = 更空 |
| 三篮出生同时看见 | ✅ | ✅ |
| 9 衣放置空间 | 少 X 空间 (两台占 X 从 -1.425 到 -0.025 = 1.4m 宽) | 单台 0.65m 宽 → 多出 X 空间 = 更空 |
| 真实感 domestic (家庭洗衣间) | ★★★★★ 并排欧美主流 | ★★★★☆ 叠机小家庭空间紧凑 |
| 实现难易 (scale) | 两台独立 scale = 稍复杂 | 单台 scale = 冻结稍易 |
| 综合 | **9.4/10 推荐** | 8.8/10 (A1.5 空间 4.0×4.5=18㎡  laundry 面积其实很大 并排完全放得下; 没必要叠) |

→ **最终 L3 = LAUNDRY-A Side-by-side**
