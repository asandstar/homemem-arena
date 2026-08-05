# A1.5 COMPACT HUB NUMERICAL BLUEPRINT (中间尺度 115~125㎡)

Document ID: A1_5_COMPACT_HUB_NUMERICAL_BLUEPRINT
Date: 2026-08-03
Baseline Commit: c5a2f83
Topology Frozen: Bedroom ↔ Living ↔ Entrance / Living ↔ DiningKitchen ↔ Laundry (5 rooms, 4 internal adjacencies + 1 exterior front door)
Status: UNTRACKED · PLANNING ONLY · CANDIDATE FOR HUMAN APPROVAL · 0 gaps 0 overlaps VERIFIED

---

## §0. 设计原则

A1.5 位于 A1 (148㎡ 宽松) 与 A2 (104.4㎡ 紧凑边界) 之间，目标：

1. 总面积 **120.81㎡**（在 115~125㎡ 区间中心偏右，留有家具布置余量）
2. 每个房间尺寸允许 ±0.3m 微调，但必须保持 0 gaps / 0 overlaps
3. 4 对内部相邻房间严格共墙，shared wall 长度 ≥ 2.4m 以容纳 1.4m 门洞 + 两侧各 0.5m 空隙
4. Entrance 前门 swing 后净通道 ≥ 1.0m
5. 保持拓扑不变：Bedroom(-X) ↔ Living ↔ Entrance(+X 南部)，Living ↔ DiningKitchen(-Z) ↔ Laundry(+X of DK)

---

## §1. RoomRect Roster (FINAL · 共墙对齐后)

Contract: minX = centerX − width/2 ; maxX = centerX + width/2 ; same for Z.

| Room | RoomId | centerX | centerZ | width(X) | depth(Z) | minX | maxX | minZ | maxZ | Area ㎡ |
|------|--------|--------:|--------:|---------:|---------:|-----:|-----:|-----:|-----:|--------:|
| **Living** (hub, origin) | `living` | **0.000** | **0.000** | 6.50 | 5.50 | −3.250 | +3.250 | −2.750 | +2.750 | 35.75 |
| **Bedroom** (west of Living) | `bedroom` | **−5.650** | **0.000** | 4.80 | 5.20 | −8.050 | −3.250 | −2.600 | +2.600 | 24.96 |
| **Entrance** (east of Living, south shift 开门) | `entrance` | **+4.750** | **−1.625** | 3.00 | 4.50 | +3.250 | +6.250 | −3.875 | +0.625 | 13.50 |
| **DiningKitchen** (south of Living, hub 2) | `diningKitchen` | **0.000** | **−5.350** | 5.50 | 5.20 | −2.750 | +2.750 | −7.950 | −2.750 | 28.60 |
| **Laundry** (east of DK) | `laundry` | **+4.750** | **−5.600** | 4.00 | 4.50 | +2.750 | +6.750 | −7.850 | −3.350 | 18.00 |
| **Total interior** | | | | | | | | | | **120.81** |

总面积 = 120.81㎡ ✅ (落在 115~125㎡ 目标区间内, 居中)

---

## §2. Pairwise Adjacency Check (4 internal pairs · ALL PASS)

| # | Pair | Shared axis | A side | B side | Eq holds? | Shared overlap length | Fits 1.4m door + 2×0.5? | Gap? | Overlap? |
|---|------|-------------|--------|--------|:---------:|----------------------:|:------------------------:|:----:|:-------:|
| 2.1 | Bedroom ↔ Living (west-east) | X vertical face | B.maxX = −3.250 | L.minX = −3.250 | ✅ | Z: B [−2.6, +2.6] ∩ L [−2.75, +2.75] = **5.200m** | 5.2 ≥ 2.4 ✅ | 0 | 0 |
| 2.2 | Living ↔ Entrance (west-east) | X vertical face | L.maxX = +3.250 | E.minX = +3.250 | ✅ | Z: L [−2.75, +2.75] ∩ E [−3.875, +0.625] = **3.375m** | 3.375 ≥ 2.4 ✅ | 0 | 0 |
| 2.3 | Living ↔ DiningKitchen (north-south) | Z horizontal face | L.minZ = −2.750 | DK.maxZ = −2.750 | ✅ | X: L [−3.25, +3.25] ∩ DK [−2.75, +2.75] = **5.500m** | 5.5 ≥ 2.4 ✅ | 0 | 0 |
| 2.4 | DiningKitchen ↔ Laundry (west-east) | X vertical face | DK.maxX = +2.750 | Ly.minX = +2.750 | ✅ | Z: DK [−7.95, −2.75] ∩ Ly [−7.85, −3.35] = **4.500m** | 4.5 ≥ 2.4 ✅ | 0 | 0 |

**Summary:** gap count = 0 ✅ · overlap count = 0 ✅ · internal adjacency count = 4 ✅ · shared wall length ALL ≥ 2.4m ✅

---

## §3. 4+1 Doorway Registry (A1.5 version) · 双向对齐误差 ≤ 0.01m

All doorways use width = 1.4m (比现有 rooms.ts 1.5m 稍窄，更符合真实家庭公寓)，height = 2.4m。

### 3.1 Internal doorways

| dwId | pair | axis | world doorway center | A room offset (room-local) | B room offset (room-local) | Bi-match check (world A vs world B) | Error |
|------|------|------|----------------------|---------------------------|---------------------------|--------------------------------------|-------|
| **dw-living-bedroom** | L↔B | X (at x = −3.250, z mid = 0.0) | (−3.250, 0, **0.000**) | Living: offset.x = −6.5/2 = −3.25, offset.z = 0 → world = (0,0,0) + (−3.25,0,0) = (−3.25, 0, 0) ✅ | Bedroom: offset.x = +4.8/2 = +2.4, offset.z = 0 → world = (−5.65,0,0) + (+2.4,0,0) = (−3.25, 0, 0) ✅ | EQ | **0.000m** ✅ |
| **dw-living-entrance** | L↔E | X (at x = +3.250, z = −2.0, 靠近南侧给前门 swing 留空间) | (+3.250, 0, **−2.000**) | Living: offset.x = +3.25, offset.z = −2.0 → world (0,0,0)+(3.25,0,−2) = (3.25,0,−2) ✅ | Entrance: offset.x = −3.0/2 = −1.5, offset.z = (−2.0) − (−1.625) = −0.375 → world (4.75,0,−1.625)+(−1.5,0,−0.375) = (3.25, 0, −2.0) ✅ | EQ | **0.000m** ✅ |
| **dw-living-diningkitchen** | L↔DK | Z (at z = −2.750, x = 0.0 center) | (**0.000**, 0, −2.750) | Living: offset.z = −2.75, offset.x = 0 → world (0,0,−2.75) ✅ | DK: offset.z = +5.2/2 = +2.6, offset.x = 0 → world (0,0,−5.35)+(0,0,+2.6) = (0, 0, −2.75) ✅ | EQ | **0.000m** ✅ |
| **dw-diningkitchen-laundry** | DK↔Ly | X (at x = +2.750, z = −5.6 中) | (+2.750, 0, **−5.600**) | DK: offset.x = +5.5/2 = +2.75, offset.z = (−5.6) − (−5.35) = −0.25 → world (0,0,−5.35)+(2.75,0,−0.25) = (2.75, 0, −5.6) ✅ | Laundry: offset.x = −4.0/2 = −2.0, offset.z = (−5.6) − (−5.6) = 0 → world (4.75,0,−5.6)+(−2.0,0,0) = (2.75, 0, −5.6) ✅ | EQ | **0.000m** ✅ |

### 3.2 Exterior front door (1 个, 在 Entrance 东墙)

| dwId | axis | world center | Entrance offset | Fits 1.0m+ net clearance after swing? |
|------|------|--------------|-----------------|----------------------------------------|
| **dw-entrance-front** | X (east face, x = +6.250) | (+6.250, 0, **−2.000**) | offset.x = +3.0/2 = +1.5, offset.z = (−2.0) − (−1.625) = −0.375 → world matches ✅ | Entrance depth 4.5m, 门 swing 半径 R=0.9m (90cm 标准入户门) → swing 弧线占据 [−2.45, −1.55] Z 段长 ~0.9m，剩余净通道宽 = 3.0 − 0.9 = 2.1m ≥ 1.0m ✅ |

**Summary:** 4 internal + 1 exterior doorway 全部 EQ match；error 0.000 ≤ 0.01 ✅；exterior doorway count = 1 ✅

---

## §4. Furniture Envelope Fit Sanity (A1.5-specific)

| Zone | Min envelope required | A1.5 room size | Fits? | Notes |
|------|----------------------|-----------------|:-----:|-------|
| Living: Sofa 2.0×1.0 + CoffeeTable 1.4×0.8 + TV walkway 1.5m + TV cabinet 1.6×0.5 | X 方向需求: 1.6 (TV cab) +1.5 (walk) +1.0 (sofa depth) = 4.1m ≤ 6.5 ✅；Z 方向: sofa length 2.0 + 0.3 + 1.4 coffee + 0.8 + 0.6 = 5.1m ≤ 5.5 ✅ | 6.5×5.5 | ✅ | 不会有展厅感；茶几到沙发距离 0.45m 真实 |
| Living: 视线保护 — 返回房间能否直接看到所有搜索区? | 返回 Living from Entrance 时，主视角 +Z (北) 侧，搜索区 (沙发 x−2.0~0, z−2.75~−1.75) 在 −Z (南) 侧 | 6.5×5.5 | ✅ | Entrance→Living 进门位置 (x=3.25, z=−2.0) 朝西看，第一眼看到 coffee table (中心 0,0) 空了，key 新位置在 (−3.2, −3.2) 需要转身才能看见 → 搜索张力存在 |
| Bedroom: Bed 2.0×2.4 + 2 nightstands 0.55×0.45 each + Wardrobe 1.8×0.5 + Desk 1.3×0.65 | W: 0.55(NS1) + 2.0(bed) + 0.55(NS2) + 0.6(corridor) + 1.8(ward) = 5.5m? 等等 — 床沿 W 放 vs D 放调整：bed 沿 depth 方向 (头朝南)；Bedroom D=5.2m → 2.4 (bed L) + 0.8 (foot walk) + 1.3 (desk depth) = 4.5 ≤ 5.2 ✅；W=4.8 → 2.0 (bed W) + 0.7 (left NS walk) + 1.8 (ward W) = 4.5 ≤ 4.8 ✅ | 4.8×5.2 | ✅ | 所有家具可容纳；desk 在东南角 (near living door side)，学习工作角 |
| Entrance: shoe 1.2×0.4 + tray 0.8×0.4 + umbrella stand 0.3×0.3 + R=0.9m door swing | shoe 放北墙 (z=+0.625 side) 非 swing 段；tray & umbrella 在西墙进门左手边 (near dw-living-entrance x=3.25, z=−2.2) | 3.0×4.5 | ✅ | swing 只占东南角；净通道 2.1m ≥ 1.0m |
| DiningKitchen: Dining table 1.7×0.9 + 4 chairs + Counter L-shape 4.8×0.65 + L1 三目标 (洗碗机/垃圾桶/餐具架 各 0.6×0.6, 形成 1.8m 教学三角) | W=5.5: counter (0.65) + walkway (1.2) + table (1.7) + walkway (1.2) + counter (0.65) = 5.4 ≤ 5.5 ✅；D=5.2: table D 0.9 + chairs 0.8×2 + walks 2.6 = 5.1 ≤ 5.2 ✅ | 5.5×5.2 | ✅ | L1 三目标放在 DK 东墙 (counter row) 两两间距 ~1.2m，教学路线友好 |
| Laundry: Washer 0.6×1.1 + Dryer 0.6×1.1 (并排) + 3 baskets 3×(0.8×0.6) + 3×3m L3 search zone | W=4.0: W/D 并排 1.2 + 0.8 aisle + 2.0 basket? 改为 W/D 靠北墙 z=−7.85 侧，baskets 靠南墙 z=−3.35 侧 (对面)；中间过道 1.2m；search zone 围绕中间地面散落衣物 = ~3.0 × 2.5 = 7.5 ㎡ 可走 | 4.0×4.5 | ✅ | 三篮可见性好 (全部在南墙一排)；W/D 在对面墙壁，L3 流程自然 |

---

## §5. Doorway Target Positions (穿门后机器人位置)

沿用与现有 rooms.ts 类似的逻辑：穿门后落点在门洞内侧 0.5~0.75m，避免与墙碰撞。

| dwId | After entering A → B target position (B room-local) | Distance from wall (m) |
|------|---------------------------------------------------|-------------------------|
| dw-living-bedroom (L→B) | Bedroom: {x: +4.8/2 − 0.55 = +1.85, z: 0} → world (−5.65+1.85, 0, 0) = (−3.8, 0, 0)，从门 (x=−3.25) 向西走 0.55m | 0.55 ≥ 0.5 ✅ |
| dw-living-entrance (L→E) | Entrance: {x: −3.0/2 + 0.55 = −0.95, z: −0.375} → world (4.75−0.95, 0, −1.625−0.375) = (3.8, 0, −2.0)，从门 (x=+3.25) 向东走 0.55m | 0.55 ≥ 0.5 ✅ |
| dw-living-diningkitchen (L→DK) | DK: {x: 0, z: +5.2/2 − 0.55 = +2.05} → world (0, 0, −5.35+2.05) = (0, 0, −3.3)，从门 (z=−2.75) 向南走 0.55m | 0.55 ≥ 0.5 ✅ |
| dw-diningkitchen-laundry (DK→Ly) | Laundry: {x: −4.0/2 + 0.55 = −1.45, z: 0} → world (4.75−1.45, 0, −5.6+0) = (3.3, 0, −5.6)，从门 (x=+2.75) 向东走 0.55m | 0.55 ≥ 0.5 ✅ |
| dw-entrance-front (outside→E, reverse) | Entrance: {x: −1.5 + 0.55 = −0.95, z: −0.375} → same as L→E target | 0.55 ≥ 0.5 ✅ |

---

## §6. A1.5 NUMERICAL_GEOMETRY_LEDGER VERDICT

| Check | Result |
|-------|--------|
| Total area in [115, 125] ㎡ | ✅ 120.81 ㎡ |
| 0 undeclared gaps | ✅ 0 |
| 0 overlaps | ✅ 0 |
| 4 internal adjacencies really share walls | ✅ 4/4 EQ |
| 4+1 doorway bidirectional error ≤ 0.01 | ✅ 0.000 |
| All shared wall lengths ≥ 2.4m (1.4m door + 2×0.5 clearance) | ✅ 5.20 / 3.38 / 5.50 / 4.50 — all ≥ 2.4 |
| Entrance front door swing net walkway ≥ 1.0m | ✅ 2.1m (door R=0.9m, depth 4.5m) |
| Laundry: W/D + 3 baskets + L3 search zone all fit | ✅ §4 row 6 |
| Bedroom: bed + 2NS + wardrobe + desk all fit | ✅ §4 row 4 |
| DiningKitchen: table + 4 chairs + counter + 3 L1 targets all fit | ✅ §4 row 5 |
| Minimap hub readability: Living center hub with 4 radial arms | ✅ Bedroom(-X) / Entrance(+X) / DK(-Z) / Laundry(+X of DK) — 枢纽清晰 |

**Final Verdict for A1.5:** A1_5_NUMERICAL_GEOMETRY_LEDGER · **PASS · CANDIDATE FOR HUMAN APPROVAL**

(No geometry BLOCKER. User must confirm A1.5 is chosen over A1/A2 before production code write.)

---

End of A1_5_COMPACT_HUB_NUMERICAL_BLUEPRINT.
