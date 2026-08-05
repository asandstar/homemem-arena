# A1.5 AUTHORITATIVE DOORWAY SNAPSHOT v1 (门洞唯一来源快照)

> Doc ID: A1_5_AUTHORITATIVE_DOORWAY_SNAPSHOT_v1
> Source Authority (§四): `docs/design/A1_5_COMPACT_HUB_NUMERICAL_BLUEPRINT.md` §3 4+1 Doorway Registry
> Usage: 所有布局文档从今起不得重新定义 doorway width/height/center/wall. 只能引用 doorwayId 列在下表. 若文档中有手写坐标 = DRIFT (见 Recon Report §四).
> Date: 2026-08-04
> Commit: c5a2f83

---

## §1. SNAPSHOT 表格

| doorwayId | kind | roomA | roomB | wallA (roomA 上的面) | wallB (roomB 上的面) | world center (Cx, Cz) **(权威)** | **width_m (权威 1.40)** | height_m (权威 2.40) | AABB world (X min..max, Z min..max) (用于 clearance 检查, 0.15 墙厚) |
|---|---|---|---|---|---|---|---:|---:|---|
| **dw-living-bedroom** | internal (shared) | living | bedroom | WEST | EAST | (−3.250, 0.000) | 1.40 m | 2.40 m | X∈[-3.325, −3.175]; Z∈[-0.700, +0.700] |
| **dw-living-entrance** | internal (shared) | living | entrance | **EAST (偏南)** | WEST | (+3.250, **−2.000**) ← 给前门 swing 留空间 (A1.5 Blueprint §3) | 1.40 m | 2.40 m | X∈[+3.175, +3.325]; Z∈[−2.700, −1.300] |
| **dw-living-dining-kitchen** | internal (shared) | living | diningKitchen | SOUTH | NORTH | (0.000, −2.750) | 1.40 m | 2.40 m | X∈[−0.700, +0.700]; Z∈[−2.825, −2.675] |
| **dw-dining-kitchen-laundry** | internal (shared) | diningKitchen | laundry | EAST | WEST | (+2.750, **−5.600**) | 1.40 m | 2.40 m | X∈[+2.675, +2.825]; Z∈[−6.300, −4.900] |
| **dw-entrance-front** | **exterior (outside)** | entrance | outside | **EAST FACE (NOT NORTH!)** | N/A | (+6.250, **−2.000**) ← 与 dw-living-entrance Z 正对 = 真实户型 | 1.40 m (入户门标准宽) | 2.40 m (门高) | X∈[+6.175, +6.325]; Z∈[−2.700, −1.300] |

### Drift 修复历史 (对比 previous round 9 docs):

| doorwayId | Previous round 错误值 | Drift Type | Action Taken |
|---|---|---|---|
| dw-living-bedroom | width = 1.0m (写死 1.0m 口) | DRIFT_WIDTH (权威 = 1.4m) | 改为只引用 doorwayId; 不写宽度值 |
| dw-living-entrance | 世界 Z = −1.500 (Entrance 中心 Z=-1.625 + local 0.125 = Z=-1.5) → 偏离权威值 -2.0 足足 0.5m 偏北, 挤压 front door swing 空间 | DRIFT_CENTER | 改为只引用 doorwayId |
| dw-living-dining-kitchen | center 近似, width 1.0m | MINOR DRIFT_WIDTH | 同上 |
| dw-dining-kitchen-laundry | DK local Z = -0.5 → world Z = -5.35 + (-0.5) = -5.85, 偏离权威 -5.6 达 0.25m | DRIFT_CENTER 0.25m | 改为只引用 doorwayId |
| dw-entrance-front | wall = NORTH, center Z 北墙 | DRIFT_WALL + DRIFT_CENTER (蓝图 §3.2 明确 east face X=+6.25) | 改为只引用 doorwayId; 墙方向 = east |

Counts: MATCH = 1; DRIFTED = 4; REMOVED_DUPLICATE (手写 doorway 参数 8 文档全部清除) = ∞ (所有 layout 文档只保留 `clearance to <doorwayId>: PASS` 语句)

---

## §2. 各房 Entrance / Exit 引用表 (§四 每房间只能引用 doorwayId)

| Room | 门洞 | doorwayId 引用 | Clearance (机器验证 §八 A3 PASS result) |
|---|---|---|---|
| Living | 西: Bedroom ↔ | dw-living-bedroom | nearest furniture clearance = 0.85m ≥ 0.12m ✅ |
| Living | 东: Entrance ↔ | dw-living-entrance | nearest = LE-ENT-02 (shoes-cabinet after adjustment 南移) = 1.15m ✅ |
| Living | 南: DK ↔ | dw-living-dining-kitchen | nearest = armchair (X=+1.0,Z=-1.5) = 1.2m ✅ |
| Bedroom | 东: Living ↔ | dw-living-bedroom | nearest furniture = bed X [-0.875,+0.875], door X=-3.25. 无家具挡 ✅ |
| Entrance | 西: Living ↔ | dw-living-entrance | ✅ 同上 shoes-cabinet 调整后 ≥ 0.12m |
| Entrance | 东: Front Door (outside) | dw-entrance-front | LE-ENT-05 coat+mirror 调整到 lz=-2.10 world -3.725 → clearance ≥ 1.58m ✅ (A3+A6 pass) |
| DiningKitchen | 北: Living ↔ | dw-living-dining-kitchen | clear ✅ |
| DiningKitchen | 东: Laundry ↔ | dw-dining-kitchen-laundry | nearest = cnt-utensil 约 Z=-3.15 world (机器验证 A3 pass) ✅ |
| Laundry | 西: DK ↔ | dw-dining-kitchen-laundry | clear ✅ (L3 inactive 门 暗化) |

---

## §3. Front Door Swing 净通 (dw-entrance-front, east face X=+6.25)

- **Swing direction**: Hinge on SOUTH corner of doorway (Z=-2.7 at world), 门逆时针向内 open 90° (into Entrance X 减少方向)
- **Arc radius**: R ≈ 0.9 m (标准入户门宽 R = door width × 0.64 ≈ 1.4 × 0.64 = 0.9m)
- **Swing AABB 近似 zone (矩形覆盖)**: X∈[+6.25 − 0.9 = 5.35, +6.25] = [+5.35, +6.25]; Z∈[-2.7, −1.85]
- **Result**: LE-ENT-02 鞋 (now world X=3.525~3.95, Z=-3.425~-3.15) → 不重叠 X 3.5 vs X 5.35 距离 ≥ 1.4m. LE-ENT-05 coat+mirror (X 5.6~6.2 world, Z = entrance cz -1.625 + (-2.10) lz = -3.725 world). 不重叠 swing Z max -1.85 vs min -3.725 dist ≥ 1.87m. All pass (§八 A6 pass).

End of AUTHORITATIVE_DOORWAY_SNAPSHOT_v1. 后续文档使用本表唯一权威 doorwayId.
