# ASSET DIMENSION SOURCE CONTRACT (唯一资产尺寸数据源 + 关键资产 stem 映射)

Document ID: ASSET_DIMENSION_SOURCE_CONTRACT
Baseline Commit: c5a2f83
Date: 2026-08-03
Status: UNTRACKED · PLANNING ONLY · FROZEN as SINGLE SOURCE for Phase 1

---

## §0. 数据源冻结声明

**唯一权威资产尺寸文档:**
> [ASSET_DIMENSION_LEDGER_DRAFT.md](file:///Users/azq/asandstar/homemem-arena-web-demo/docs/assets/ASSET_DIMENSION_LEDGER_DRAFT.md)

**该文档是 Phase 1 资产尺寸唯一来源。**
其他文档 (路线、拓扑、布局、Minimap) 不得手写以下数值：
- model name
- raw AABB (原始模型 AABB)
- scaled AABB (项目比例调整后 AABB)
- pivot
- footprint

**引用方式：通过 `assetDimensionId` 引用，不得抄录数值。**

### 引用格式示例

```yaml
# 错误方式 (禁止):
coffeeTable:
  model: "coffeeTableLong"
  AABB: 1.8 × 1.0 × 0.6m   # ❌ 手写数值 = 漂移风险
  footprint: 1.8 ㎡
  layoutZone: Living center

# 正确方式 (唯一允许):
coffeeTable:
  assetDimensionId: furniture/tableCoffee
  placement:
    roomLocalX: 0
    roomLocalZ: +0.3
  whyCentered:
    - from ledger: furniture/tableCoffee.scaledAABB = (1.4 × 0.8 × 0.6)m
    - from ledger: furniture/tableCoffee.footprint = 1.12㎡
    - ⚠️ NO NUMERIC COPY: reader should look up assetDimensionId in the ledger
```

如果布局阶段发现某 asset 需要覆盖 scale (例如 BedDouble OBJ 和 GLB AABB 差异), 修改应写回 **ASSET_DIMENSION_LEDGER_DRAFT.md** (更新该条目的 scaled AABB), 而不是在布局文档内手写私有数值。

---

## §1. 关键 assetDimensionId 与实际 Kenney stem 映射 (禁止使用不存在于资产清单的虚构 stem)

| 规划常用中文名 | assetDimensionId | Kenney 实际 stem (来自 ASSET_ACTUAL_CONTENT_INVENTORY.md) | 包来源 | Ledger status |
|----------------|------------------|----------------------------------------------------------|--------|---------------|
| 长沙发 / 三人沙发 | `furniture/loungeSofa` | `loungeSofa` (Kenney Furniture Pack 1, exact match) | Furniture Pack 1 | ✅ CONFIRMED |
| 双人沙发 | `furniture/loveseatSofa` | `loveseatSofa` | Furniture Pack 1 | ✅ CONFIRMED |
| 单人扶手椅 | `furniture/loungeChair` | `loungeChair` | Furniture Pack 1 | ✅ CONFIRMED |
| 茶几 | `furniture/tableCoffee` | `tableCoffee` (stem 确实存在! ❌ 禁止使用不存在的 stem coffeeTableLong) | Furniture Pack 1 | ✅ CONFIRMED |
| 电视柜 | `furniture/cabinetTelevision` | `cabinetTelevision` (存在! ❌ 禁止 cabinetLowLong) | Furniture Pack 1 | ✅ CONFIRMED |
| 电视 | `furniture/televisionModern` | `televisionModern` | Furniture Pack 1 | ✅ CONFIRMED |
| 落地灯 | `furniture/lampFloor` | `lampFloor` | Furniture Pack 1 | ✅ CONFIRMED |
| 地毯 | `furniture/rugLarge` | `rugLarge` | Furniture Pack 1 | ✅ CONFIRMED |
| 书架 (开放式) | `furniture/bookcaseOpen` | `bookcaseOpen` | Furniture Pack 1 | ✅ CONFIRMED |
| 床 (大床双人床) | `furniture/bedDouble` | `bedDouble` (OBJ AABB ≠ GLB AABB, 使用 SAFE_ENVELOPE, 见 §十六) | Furniture Pack 1 | ⚠️ DEFERRED_ASSET_IMPORT_DECISION |
| 床头柜 | `furniture/nightstand` | `nightstand` (单抽) | Furniture Pack 1 | ✅ CONFIRMED |
| 衣柜 / 衣橱 | `furniture/wardrobe` | `wardrobe` (2 门) | Furniture Pack 1 | ✅ CONFIRMED |
| 梳妆台 / 书桌 | `furniture/desk` | `desk` | Furniture Pack 1 | ✅ CONFIRMED |
| 餐椅 (普通椅) | `furniture/chair` | `chair` (无扶手; ❌ 禁止 chairDining) | Furniture Pack 1 | ✅ CONFIRMED |
| 餐桌 | `furniture/table` | `table` (普通桌; ❌ 禁止 tableDiningLong) | Furniture Pack 1 | ✅ CONFIRMED |
| 洗碗机 | `appliance/dishwasher` | `dishwasher` | Furniture Pack 2 (Kitchen Appliances) | ✅ CONFIRMED |
| 冰箱 | `appliance/refrigerator` | `refrigerator` | Furniture Pack 2 | ✅ CONFIRMED |
| 洗衣机 | `appliance/washer` | `washer` | Home Kit Interior Appliances | ✅ FOUND_EXACT (实测尺寸见 WASHER_DRYER_DIMENSION_ADDENDUM) |
| 干衣机 | `appliance/dryer` | `dryer` | Home Kit Interior Appliances | ✅ FOUND_EXACT (实测尺寸见 WASHER_DRYER_DIMENSION_ADDENDUM) |
| 垃圾桶 | `furniture/trashCan` | `trashCan` | Furniture Pack 1 或 2 | ✅ CONFIRMED |
| 厨房台面/料理台 | `furniture/counter` | `counter` (Kitchen counters) | Furniture Pack 2 | ✅ CONFIRMED |
| 前门 (旋转门 方形) | `structure/doorRotateSquareA` | `door-rotate-square-a` (stem, ❌ 不要凭空乱编 door) | Home Kit Exterior — 但 Home Interiors & Kitchen 也有 door variants | ✅ CONFIRMED |
| 窗户 | `structure/windowSquareA` | `window-square-a` | Home Interiors & Kitchen (浴室/厨房窗) | ✅ CONFIRMED |
| 马克杯 | `prop/foodMug` | `mug` (Food and Beverages Pack) | Food + Drinks | ✅ CONFIRMED |
| 盘子 | `prop/foodPlate` | `plate` (stem plate) | Food + Drinks | ✅ CONFIRMED |
| 叉子 | `prop/foodUtensilFork` | `utensilFork` | Food + Drinks | ✅ CONFIRMED |
| 纸巾 | `prop/tissueBox` 或 `prop/tissuePack` | `tissuePack` (stem 需确认) | Toiletries Pack | ✅ FOUND_NEAR_EXACT |
| 衣物 T恤 | `prop/clothingTshirt` / `prop/clothesShirt` | 衣物 stems 见 Home Kit Interiors | Home Interiors | ✅ CONFIRMED |
| 袜子 | `prop/clothingSocks` | `socks` | Home Interiors | ✅ CONFIRMED |
| 内裤 | `prop/clothingBriefs` | `briefs` | Home Interiors | ✅ CONFIRMED |
| 钥匙 (一串) | `prop/key` | `key` 或 `keyRing` (多种 variants，挑一个 LOD 低的) | Toiletries 或 Other Pack | ✅ CONFIRMED |
| 手机 | `prop/phone` | `phone` 或 `smartphone` | Generic (多包有) | ✅ CONFIRMED |
| 雨伞 | `prop/umbrella` | `umbrella` | Generic Props | ✅ CONFIRMED |
| 猫 | `creature/cat` | cat 模型 (Home interiors 有 cat bed + 独立 cat prop? 或者用 Kenney Animals Pack?) | To be confirmed during import | ⚠️ DEFERRED (猫视觉模型 — 如果 Kenney Animals Pack 有 cat 就用，否则用 LOD 低的简单几何) |

---

## §2. 必须废弃的虚构 stem (从未出现在 Kenney 实际包资产清单中)

以下 stem 在旧文档中出现，**必须全部替换成真实 stem** (或 assetDimensionId)：

| ❌ 虚构 stem (删除) | ✅ 替换为 (真实 stem 或 assetDimensionId) | 出现在哪些旧文档 (保留为历史) |
|-------------------|-----------------------------------------|-------------------------------|
| `coffeeTableLong` | `furniture/tableCoffee` (真实 stem: tableCoffee) | CANDIDATE_A_RECONCILED_TOPOLOGY_BLUEPRINT.md |
| `cabinetLowLong` | `furniture/cabinetTelevision` | 同上 |
| `tableDiningLong` | `furniture/table` (真实 stem: table) | 同上 |
| `chairDining` | `furniture/chair` (真实 stem: chair) | 同上 |
| `wallStraightA` | `structure/wall` (注意: 墙按 P0-WALL 用程序化生成，GLB 仅参考外观，不作为 footprint 权威) | WALL_THICKNESS_AND_SHARED_WALL_CONTRACT.md |
| 不存在的 `washer/` 虚构 AABB | `appliance/washer` (实测尺寸在 WASHER_DRYER_DIMENSION_ADDENDUM.md) | 旧路线规划文档 |

---

## §3. assetDimension 条目字段契约 (写回 Ledger 的格式)

每条 assetDimension 在 ASSET_DIMENSION_LEDGER_DRAFT.md 中需要以下字段 (MANDATORY):

```yaml
assetDimensionId: furniture/tableCoffee          # lookup key, stable
  authoritativeDocument: ASSET_DIMENSION_LEDGER_DRAFT.md
  status: CONFIRMED | DEFERRED_ASSET_IMPORT_DECISION | MEASURED_APPROX | FOUND_NEAR_EXACT
  sourceModel: Kenney/FurniturePack1/OBJ/tableCoffee.obj   # 原始模型路径 (资产文件夹外)
  sourceModelGLB: Kenney/FurniturePack1/GLB/kenney_furniture-kit-1.glb::tableCoffee (if GLB exists)
  rawAABBObj: { x: 1.2, y: 0.3, z: 0.7 } m        # OBJ 原始 AABB 中心
  rawAABBGlb: { x: 1.2, y: 0.3, z: 0.7 } m        # GLB 原始 AABB (如果有)
  rawAABBMatchStatus: MATCH | MISMATCH_MINOR | MISMATCH_MAJOR
  projectScale: 1.0                               # 项目统一比例 (phase1: 全部 1.0)
  effectiveAABB: { x: 1.4, y: 0.8, z: 0.6 } m     # 最终在场景中使用的 AABB
  floorAlignment: BOTTOM_PIVOT (y=0 touches floor)| CENTER_PIVOT | OTHER
  pivotStatus: CONFIRMED_BOTTOM | MISMATCH_BED_CASE (例如 Bed OBJ = mattress only)
  footprint: 1.4 × 0.8 = 1.12㎡                   # effective xz area
  height: 0.6m                                    # effective y
  confidence: HIGH | MEDIUM | LOW
  lastVerified: 2026-08-03
  notes:
    - OBJ AABB slightly different (x off 0.02m) due to OBJ export group origin drift
```

禁止缺字段；禁止 CONFIRMED_HIGH 条目最后更新在 2 个月之前。

---

## §4. 资产尺寸字段被哪些代码字段消费 (FACT audit)

| 资产尺寸字段 | 当前代码消费路径 | 影响 |
|--------------|-----------------|------|
| `size: {x, y, z}` 在 decorFurniture.ts / furnitureOwnership.ts 中 declaredSize (如果存在) | Object3D.tsx L40-47: declaredSize 若存在，则用它代替实际 bbox 计算 shadow 大小和交互点击球 (F) 半径 | ⚠️ declaredSize 影响交互可达性。如果 declaredSize 写得太大，玩家会在 4m 外就能 pick — 游戏体验假。如果写得太小，玩家贴脸也 pick 不到。**必须与 assetDimensionId 的 effective AABB 完全一致**。 |
| actual bbox (sceneSchema.ts L71 `bboxFromModel(modelGLB)` 或 declaredSize fallback) | `useInteractionRadius` from placement.ts — 生成 (F) 交互按钮的 distance threshold (influences isNear() check) | 同上 |
| collision (src/game/collision.ts: circle collider = Math.max(size.x,size.z)/2 或 override) | 玩家 walk 与家具碰撞 — 如果家具 collision 半径比模型 AABB 大，会产生"空气墙"；如果小，玩家能走到家具里穿模 | **必须匹配 effective footprint** (使用 AABB.x × AABB.z 的圆或盒近似) |
| ContainerModel 内部 slot positions | 例如 cnt-dishwasher 内部放盘的位置 (x y z slot) — 如果 dishwasher declaredSize 与实际 GLB 不匹配，plates 会浮在洗碗机门外或嵌入箱体内部 | 必须在 Layout 阶段按 actual GLB 校正 slots |

**重要**: 因此 ASSET_DIMENSION_SOURCE_CONTRACT 不仅是规划文档的单源要求 — **代码中 declaredSize 也必须直接从同一 ledger 抄录**。任何一方修改，另一方同步更新。

---

End of ASSET_DIMENSION_SOURCE_CONTRACT. Frozen as single authority for Phase 1.
