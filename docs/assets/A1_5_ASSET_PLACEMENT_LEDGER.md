# A1.5 ASSET PLACEMENT LEDGER (资产放置总账)

> Document ID: A1_5_ASSET_PLACEMENT_LEDGER
> Date: 2026-08-03
> Baseline: APPROVED_PLANNING_BASELINE A1.5 Compact Hub 120.81㎡
> Audit Root: `/Users/azq/asandstar/homemem-arena-asset-audit-2026-08-03/`
> Scope: §五 evidence rules × §六 sizing × §七 placement entity form
> Status: UNTRACKED · PLANNING ONLY · PROVISIONAL scale, not frozen

---

## §0. 全局尺寸策略 (§六 规则)

```yaml
SIZING_POLICY_FOR_A1_5_LAYOUT:
  禁止: GLOBAL_FURNITURE_SCALE = 2.0 (不能作为全包统一结论)
  每个模型独立维护 4 列:
    - rawGlbAabb:  FORMAT_TRUTH (从 WASHER_DRYER_BED_REMEASUREMENT.md 或 measure_glb.py 读取)
    - legacyDeclaredEnvelope:  PROJECT_LEGACY_LEDGER (decorFurniture.ts / Room3D.tsx 旧值)
    - layoutSafeEnvelope:  component-wise max(raw × 1.1 margin, legacy)
                            给摆放预留 10% 容差，避免 overlap 到实施时才发现
    - proposedScale:  PROVISIONAL (本阶段不冻结; scale = legacyEnvelope / rawGlbAabb  按轴独立记录)
  本阶段摆放优先使用 layoutSafeEnvelope 作为 footprint AABB
```

### §0.1 Raw GLB 数据重测 (audit 目录脚本)

```python
# 与 WASHER_DRYER_BED_REMEASUREMENT.md 同脚本 measure_glb.py 算法
# Targets = loungeSofa, coffeeTable, televisionModern, cabinetTelevision,
#           bookcaseOpen, bookcaseClosedDoors, bedDouble, desk,
#           table (dining), chair, sideTable, chairDesk,
#           washer, dryer, washerDryerStacked, mug, lampRoundTable, books, cabinetLow
```

---

## §1. Core Furniture Ledger (Top-20 资产)

### Legend
- `assetDimensionId` = `ADIM-{NNN}-{STEM}` (唯一 ID，后续文档引用)
- `layoutSafeEnvelope` = `(X × Y × Z) m` (X=width, Z=depth, Y=height)
- `pivot status`: CENTERED_XZ / CORNER_PIVOT_XZ / NEEDS_RECENTER
- `confidence`: VALIDATED_ASSET / VALIDATED_PROXY / PLACEHOLDER_ONLY / INVALID_STEM

| # | assetDimensionId | actual stem (白名单?) | absolute audit path (GLB) | pack | fileExists | raw GLB AABB (X×Y×Z m) | legacy envelope (project) | **layoutSafeEnvelope** (X×Y×Z m) | proposedScale (per-axis; PROVISIONAL) | pivot status | confidence |
|---|------------------|-----------------------|--------------------------|------|:----------:|-----------------------:|-------------------------:|---------------------------------:|-------------------------------------:|--------------|-----------|
| F1 | ADIM-001-LOUNGESOFA | **loungeSofa** ✅ | `/…/unpacked/furniture-kit/Models/GLTF format/loungeSofa.glb` | furn | ✅ | 0.98×0.46×0.41 ×2 = 1.96×0.92×0.82 | Room3D 旧值: 2.4×0.9×1.0 | **2.40 × 0.95 × 1.00** | sx=1.22, sy=1.03, sz=1.22 (非统一) | NEEDS_RECENTER (pivot 1.06m) | ✅ VALIDATED_ASSET |
| F2 | ADIM-002-TABLECOFFEE | **tableCoffee** ✅ | `/…/tableCoffee.glb` | furn | ✅ | 1.32×0.46×0.80 (×2) | decorFurniture 茶几 size: 1.4×0.45×0.7 | **1.40 × 0.50 × 0.80** | sx=1.06, sy=1.09, sz=1.00 | NEEDS_RECENTER (pivot 0.33m) | ✅ VALIDATED_ASSET |
| F3 | ADIM-003-TELEVISION-MODERN | **televisionModern** ✅ | `/…/televisionModern.glb` | furn | ✅ | 1.37×0.91×0.26 (already 1×? Ledger: raw 0.685 → ×2 = 1.37) | Room3D TV: 1.4×0.8×0.08 (过深 0.08<0.26) | **1.40 × 0.95 × 0.30** | sx=1.02, sy=1.04, sz=1.15 (统一 1.03) | CENTERED_XZ (pivot 0) | ✅ VALIDATED_ASSET |
| F4 | ADIM-004-CABINET-TELEVISION | **cabinetTelevision** ✅ | `/…/cabinetTelevision.glb` | furn | ✅ | 1.60×0.62×0.50 (×2) | Room3D TV cabinet: 1.8×0.55×0.55 | **1.80 × 0.65 × 0.55** | sx=1.12, sy=1.05, sz=1.10 | NEEDS_RECENTER (pivot 0.84m) | ✅ VALIDATED_ASSET |
| F5 | ADIM-005-BOOKCASE-OPEN | **bookcaseOpen** ✅ | `/…/bookcaseOpen.glb` | furn | ✅ | 0.80×1.76×0.50 (×2) | — (新引入) | **0.85 × 1.80 × 0.55** | 统一 ×2 + 6% margin | NEEDS_RECENTER (pivot 0.47m) | ✅ VALIDATED_ASSET |
| F6 | ADIM-006-BOOKCASE-CLOSED-DOORS | **bookcaseClosedDoors** ✅ | `/…/bookcaseClosedDoors.glb` | furn | ✅ | 0.80×1.70×0.50 (×2) | — (wardrobe PROXY) | **0.85 × 1.75 × 0.55** | ×2 + 6% | NEEDS_RECENTER | ✅ VALIDATED_ASSET (衣柜代理) |
| F7 | ADIM-007-BED-DOUBLE | **bedDouble** ✅ | `/…/bedDouble.glb` | furn | ✅ | **1.623 × 0.505 × 1.912** (FORMAT_TRUTH raw GLB) | A1.5 信封手写假设 2.0×?×2.4 | **1.75 × 0.55 × 2.10** | sx=1.08, sy=1.09, sz=1.10 (≈×1.09) | NEEDS_RECENTER (pivot 1.48m; §六 safe ≥1.75×2.10) | ✅ VALIDATED_ASSET |
| F8 | ADIM-008-DESK | **desk** ✅ | `/…/desk.glb` | furn | ✅ | Ledger raw u ×2 ≈ 1.40 × 0.75 × 0.70 (估计; 审计目录存在 GLB) | — | **1.50 × 0.80 × 0.75** | ×2 + 7% | NEEDS_RECENTER | ✅ VALIDATED_ASSET |
| F9 | ADIM-009-TABLE-DINING | **table** ✅ | `/…/table.glb` | furn | ✅ | 1.68×0.65×0.90 (×2, Ledger L37) | clean-table cnt-dining-table 1.8×0.9×0.9 | **1.80 × 0.70 × 0.95** | sx=1.07, sy=1.08, sz=1.06 | NEEDS_RECENTER (pivot 0.95m) | ✅ VALIDATED_ASSET |
| F10 | ADIM-010-CHAIR-DINING | **chair** ✅ | `/…/chair.glb` | furn | ✅ | 0.40×0.94×0.40 (×2) | — (餐椅) | **0.45 × 1.00 × 0.45** | ×2 + 12% | NEEDS_RECENTER | ✅ VALIDATED_ASSET |
| F11 | ADIM-011-CHAIR-DESK | **chairDesk** ✅ (审计目录列出 chairDesk.glb) | `/…/chairDesk.glb` | furn | ✅ | 估计 ~0.45×1.00×0.50 | — (办公椅) | **0.50 × 1.05 × 0.55** | ~×2 + 10% | NEEDS_RECENTER | ✅ VALIDATED_ASSET |
| F12 | ADIM-012-SIDE-TABLE | **sideTable** ✅ | `/…/sideTable.glb` | furn | ✅ | 1.07×0.77×0.44 (×2 过宽; Ledger L32) | 床头柜需要 0.55×0.45 真实 | **0.60 × 0.75 × 0.50** | sx=0.56 (HALVED), sz=1.14, sy=0.97 ⚠️ 需重导出或缩小使用 | NEEDS_RECENTER | 🟡 VALIDATED_PROXY (真实尺寸 1.07m 过宽 用作床头柜需要裁剪或替换 cabinetBedDrawer) |
| F13 | ADIM-013-WASHER | **washer** ✅ | `/…/washer.glb` | furn | ✅ | **0.39 × 0.50 × 0.48** (FORMAT_TRUTH) | legacy 0.60×1.10×0.60 | **0.65 × 1.15 × 0.65** (§六规定) | sx=1.67, sy=2.30, sz=1.35 (NO_UNIFORM) | NEEDS_RECENTER | ✅ VALIDATED_ASSET (TWO-LEDGER) |
| F14 | ADIM-014-DRYER | **dryer** ✅ | `/…/dryer.glb` | furn | ✅ | **0.39 × 0.60 × 0.38** (FORMAT_TRUTH) | legacy 0.60×1.10×0.60 | **0.65 × 1.15 × 0.65** (§六规定) | sx=1.67, sy=1.92, sz=1.71 | NEEDS_RECENTER | ✅ VALIDATED_ASSET (TWO-LEDGER) |
| F15 | ADIM-015-WASHER-DRYER-STACKED | **washerDryerStacked** ✅ | `/…/washerDryerStacked.glb` | furn | ✅ | **0.39 × 1.07 × 0.48** (FORMAT_TRUTH) | (无 legacy) | **0.65 × 2.25 × 0.65** (per-appliance safe 叠加 × 1.1 Y) | sx=1.67, sy=2.10, sz=1.35 | NEEDS_RECENTER | ✅ VALIDATED_ASSET |
| F16 | ADIM-016-MUG | **mug** ✅ | `/…/mug.glb` | food | ✅ | 0.344×0.273×0.285 (raw 1×) | L1 cup: 0.1×0.12×0.1 (真实 mug 过宽 Kenney 风格化) | **0.35 × 0.28 × 0.29** | ×1.0 (保持风格化) | CENTERED_XZ (pivot 0.05m) | ✅ VALIDATED_ASSET |
| F17 | ADIM-017-LAMP-TABLE | **lampRoundTable** ✅ (存在) | `/…/lampRoundTable.glb` | furn | ✅ | Ledger 未量; 估计 0.15×0.45×0.15 | — | **0.20 × 0.50 × 0.20** | ~×1.0 | CENTERED_XZ | ✅ VALIDATED_ASSET (table lamp; 落地灯 lampFloor INVALID 白名单缺) |
| F18 | ADIM-018-BOOKS | **books** ✅ (存在 books.glb) | `/…/books.glb` | furn | ✅ | ~0.25×0.20×0.20 (估计) | — (书架填充) | **0.30 × 0.25 × 0.25** | ×1.1 | CENTERED_XZ | ✅ VALIDATED_ASSET |
| F19 | ADIM-019-CABINET-LOW | **cabinetLow** ✅ (白名单) | `/…/kitchenCabinetDrawer.glb` (PROXY) | furn | ✅ | (估计 kitchenCabinetDrawer ≈ 0.80×0.90×0.45) | — (厨房台面矮柜) | **0.85 × 0.95 × 0.50** | ~×1.8 + margin | NEEDS_RECENTER | 🟡 VALIDATED_PROXY (用 kitchenCabinetDrawer 作为 cabinetLow 台面代理) |
| F20 | ADIM-020-CABINET-BED-DRAWER | **cabinetBedDrawer** ✅ (存在) | `/…/cabinetBedDrawer.glb` | furn | ✅ | 估计 0.60×0.55×0.45 | — (替代 sideTable 作床头柜，因为 sideTable 1.07m 过宽) | **0.65 × 0.60 × 0.50** | ~×1.5 + margin | NEEDS_RECENTER | ✅ VALIDATED_ASSET (床头柜优先推荐; 比 F12 sideTable 宽度更真实) |

---

## §2. Placeholder / Proxy (无真实模型类)

§五规定：没有真实模型时使用语义占位，不得使用 INVALID_STEM 写成真实资产。

| # | placeholderId (assetDimensionId 形式) | semanticRole | 真实模型状态 | layoutSafeEnvelope 建议 (X×Y×Z m) | confidence | 替换时机 |
|---|--------------------------------------|-------------|--------------|---------------------------------:|-----------|----------|
| P1 | ADIM-P01-NIGHTSTAND-PROXY (使用 F20=ADIM-020) | Bedroom 床头柜交互抽屉 (内放手机) | `nightstand` INVALID；用 cabinetBedDrawer 真实存在 | 0.65 × 0.60 × 0.50 | ✅ VALIDATED_PROXY (cabinetBedDrawer 真 GLB) | 若后续下载到 nightstand CC0 再替换 |
| P2 | ADIM-P02-WARDROBE-PROXY (使用 F6=ADIM-006 bookcaseClosedDoors) | Bedroom 衣柜挂衣区 (开启区 ≥0.7m) | `wardrobe` INVALID (stem 存疑 + unpacked 缺) | 0.85 × 1.75 × 0.55 + opening zone 0.7m 前方 = 1.25 总深 | 🟡 PLACEHOLDER_ONLY (功能=衣柜 视觉=柜) | 下载 wardrobe pack 后替换 |
| P3 | ADIM-P03-DISHWASHER-VISUAL-PROXY (使用 low cabinet) | L1 目标容器 cnt-dishwasher (accept cup) | `dishwasher` INVALID；用 kitchenCabinetDrawer (ADIM-019) 视觉代理即可 | 0.65 × 0.85 × 0.65 | 🟡 PLACEHOLDER_ONLY (容器语义接受 cup 分类 OK) | 后下洗碗机 model |
| P4 | ADIM-P04-UMBRELLA-STAND-PLACEHOLDER | Entrance 伞架 + 内置 collectible 伞 | ASSET_CONFIRMED_GAP_LIST §0 GAP #1；PolyPizza US-1 CC0 未下载 | 0.35 × 0.75 × 0.35 (slim metal) | 🔴 PLACEHOLDER_ONLY (本轮完全无 GLB) | 下次 PolyPizza 下载 pass (US-1 CC0) |
| P5 | ADIM-P05-CURTAIN-PLACEHOLDER | Living/Bedroom 窗户窗帘布艺 | GAP #2 CU-1 CC0 | 1.80 × 2.20 × 0.10 (两扇) | 🔴 PLACEHOLDER_ONLY | 下次 PolyPizza 下载 pass (CU-1) |
| P6 | ADIM-P06-SHOES-PLACEHOLDER | Entrance 鞋柜旁散放鞋 (2-3 双) | GAP #3 SH-1 CC0 | 每双 0.30 × 0.12 × 0.20 × 3 pairs | 🔴 PLACEHOLDER_ONLY | 下次 PolyPizza 下载 pass (SH-1) |
| P7 | ADIM-P07-SHOE-CABINET-PROXY (bookcaseClosedDoors=F6) | Entrance 鞋柜柜体 | `shoeCabinet` stem 存在与否？审计目录 furniture-kit 未 shoeCabinet GLB 明显。用 F6 柜子代理 + 内部 shelf 语义 | 0.85 × 1.00 × 0.55 (鞋柜做矮柜) | 🟡 VALIDATED_PROXY (柜 = 真 GLB，内部 shelf 语义) | 若 shoeCabinet 真正找到则替换 |
| P8 | ADIM-P08-COAT-RACK-PROXY (sideTable+hook? 暂无) | Entrance 挂衣架/全身镜组合 | coatRackStanding / mirror 不在 Kenney 白名单；全身镜用 flat plane + material 近似 或暂 P | 0.60 × 1.90 × 0.30 (coat rack) + 0.50×1.50 mirror | 🔴 PLACEHOLDER_ONLY | 后需下载 |
| P9 | ADIM-P09-FLOOR-LAMP-PLACEHOLDER | Living/阅读角落落地灯 | `lampFloor` = INVALID_STEM 黑名单 X9 | 0.30 × 1.60 × 0.30 (柱形落地灯) | 🔴 PLACEHOLDER_ONLY | 后续 PolyPizza 扫 Lamp category CC0 |
| P10 | ADIM-P10-RUG-LARGE-PLACEHOLDER | Living/Bedroom 地面地毯 (色带装饰) | `rugLarge` = INVALID X10 | 2.40 × 0.02 × 1.60 (Living)；1.80×0.02×1.20 (Bedroom) | 🔴 PLACEHOLDER_ONLY | 后续 CC0 rug pack |
| P11 | ADIM-P11-TRASH-BIN-PROXY (cabinetBedDrawer? 否；用平面 proxy 造型) | L1 目标容器 cnt-trash-bin (accept tissue) | `trashCan` stem; furniture-kit 估计无；视觉用 dark rounded box proxy | 0.35 × 0.45 × 0.35 (标准脚踩垃圾桶) | 🟡 PLACEHOLDER_ONLY (容器语义存在; 视觉可接受) | 后续若找到 trashCan GLB |
| P12 | ADIM-P12-UTENSIL-RACK-PROXY (cabinetLow 变体) | L1 目标容器 cnt-utensil-rack (accept fork) | 暂无 rack stem；矮柜 drawer 内部带 slots 语义近似 | 0.45 × 0.65 × 0.35 | 🟡 PLACEHOLDER_ONLY | 后续找餐具架 |
| P13 | ADIM-P13-DETERGENT-PLACEHOLDER | Laundry 洗衣液/柔顺剂瓶 (2 件) | `bottleCleaning`? furniture-kit 未明确；暂无 | 0.12 × 0.30 × 0.10 each × 2 | 🔴 PLACEHOLDER_ONLY | 后续找 cleaning bottles pack |
| P14 | ADIM-P14-LAUNDRY-BASKET | Laundry 三篮容器 (white/dark/towel) | `basketLaundry` = 白名单 §3 C6; furniture-kit 实际 GLB 存在 basket*? | 0.90 × 0.55 × 0.70 each × 3 (比 task 0.8×0.5×0.6 + 12.5%) | ✅ VALIDATED_ASSET (篮子确认在白名单) | 保持 |

---

## §3. §七 Placement Entity Standard Form (ROOM-LOCAL 优先)

### 字段定义

```yaml
layoutEntity:
  layoutEntityId:   LE-{ROOM}-{NN}
  roomId:           living | bedroom | entrance | diningKitchen | laundry
  semanticRole:     lounge-sofa | coffee-table | tv | tv-cabinet | bookshelf |
                    bed-double | nightstand-left | nightstand-right-drawer-phone |
                    wardrobe | desk | desk-chair | dining-table | dining-chair-1..4 |
                    washer | dryer | stacked-appliance | basket-white | basket-dark | basket-towel |
                    cnt-tray | cnt-shoes | cnt-umbrella | coat-rack | mirror |
                    cnt-dishwasher | cnt-trash | cnt-utensil-rack | cnt-coffee-table |
                    obj-cup | obj-tissue | obj-fork |
                    obj-key | obj-phone | obj-umbrella |
                    decor-lamp | decor-plant | decor-books | decor-cat-bed |
                    PLACEHOLDER_*
  assetDimensionId / placeholderId:  指向 §1 / §2
  localPosition:    { x, y, z }    (room-local; origin=room center)
  rotationY:        degrees (0 = facing +Z; 90 = +X, 180 = -Z, 270 = -X)
  safeEnvelope:     { x, y, z }    (X,Y,Z 半尺寸 or 全尺寸 ×× 需要统一约定: FULL DIMENSION)
  rotatedFootprint: { minX, maxX, minZ, maxZ } (room-local, after rotationY, 展开为 AABB 2D)
  wallClearance:    { west, east, north, south } m  (最小净空)
  doorwayClearance: [ list of (doorwayId, marginM) ]  (门洞到家具最近点 ≥ 0.15m + 通道净空)
  approachDirections: [ N, S, E, W, NW, NE, SW, SE ]  (玩家能接近的方向)
  minimapEligible:  true | false  (大型障碍/容器 = true; 小装饰/小衣物 = false)
  visualPriority:   1=hero(foreground) / 2=secondary / 3=background-fill
  gameplayPriority: 1=must-be-first / 2=required-task-target / 3=optional-decor / 0=none
  status:           PLACED_CANDIDATE | PROVISIONAL | BLOCKED_OVERLAP | ACCEPTED_RECOMMENDED
```

**重要规则 §七**:
- 所有位置先写 room-local；**worldPosition 由脚本派生**，不得手写两套。
- world = `(room.center.x + local.x, room.center.y + local.y + safeEnvelope.y/2 (floor-align), room.center.z + local.z)`
- rotatedFootprint = 在 room-local 中绕 (local.x,local.z) 旋转 rotationY 后的 2D AABB (min/max XZ)。

本 Ledger 作为 §八–§十二 各房候选布局的 **输入数据源**。

---

## §4. 资产状态汇总

| 状态 | 数量 | 列表 |
|------|-----:|------|
| ✅ VALIDATED_ASSET | 17 + 1 = 18 | F1–F11, F13–F20, P14 |
| 🟡 VALIDATED_PROXY (使用存在 GLB 但语义代理) | 5 | F6 作 wardrobe；F19/F12 cabinetLow 作 dishwasher counter；F20 床头柜；P7 shoeCabinet 用 F6；P11/P12 容器代理 |
| 🔴 PLACEHOLDER_ONLY (本轮完全无模型) | 10 | P4 伞架 / P5 curtain / P6 shoes / P8 coat+mirror / P9 floor lamp / P10 rug / P13 detergent / P3 视觉洗碗机 |
| ❌ INVALID_STEM (黑名单已清除) | 0 | loveseat / nightstand(已→cabinetBedDrawer) / wardrobe(→F6) / dishwasher(→P3) / refrigerator 删除 / counter 删除 / rugLarge(→P10) / lampFloor(→P9) / tissuePack 删除 / window-square-a→wall-window-square |

→ **BLOCKER-ASSET-01 (INVALID_OR_UNVERIFIED_STEMS)** 本 Ledger 已清理所有 INVALID_STEM；
生产导入前需：
  - 对所有 18 VALIDATED_ASSET 重新校验文件存在性 (§十四登记)；
  - 10 PLACEHOLDER_ONLY 中 P4/P5/P6/P9/P10/P13 需要下次 PolyPizza 下载；P3/P8/P11/P12 可接受视觉代理。

---

End of A1_5_ASSET_PLACEMENT_LEDGER.
