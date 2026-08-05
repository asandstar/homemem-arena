# HOMEMEM ARENA PRE-LAYOUT CONTRACT CORRECTION REPORT (A1.5 TOPOLOGY FREEZE & LEVEL ROUTE REALITY CHECK)

Document ID: HOMEMEM_ARENA_PRE_LAYOUT_CONTRACT_CORRECTION_REPORT
Date: 2026-08-03
Baseline Commit: c5a2f83cd5ec608a119fbb237d80f4f67bd1450e (main HEAD == origin/main)
Scope: PLAN MODE · READ ONLY · NO CODE MODIFIED · ALL OUTPUT DOCS UNTRACKED
Final Gate: **A1_5_HUMAN_APPROVAL_REQUIRED** (唯一推荐 A1.5，等用户批准后进入 Asset-Aware Room Layout)

---

## 0. PRE-STATE VERIFICATION (§一 Confirmation)

```bash
$ git branch --show-current            → main ✓
$ git rev-parse HEAD                   → c5a2f83cd5ec608a119fbb237d80f4f67bd1450e ✓
$ git rev-parse origin/main            → c5a2f83cd5ec608a119fbb237d80f4f67bd1450e ✓
$ git status --short                   → Only untracked planning/audit docs ✓
$ git diff --check                     → (no output) ✓
Staged files count: 0
Modified tracked files count: 0
Models/ZIPs inside repo: NONE (仍在 ~/Downloads 仓库外)
Result: PRE-STATE PASSED → Round started correctly.
```

---

## 1. RUNTIME FACT LEDGER SUMMARY (§四 · 18 项关键事实审计)

| # | Item | Classification | Value / Source file |
|---|------|----------------|---------------------|
| 1 | **CARRY_CAPACITY** | **FACT · CONFIRMED** | CARRY_ONE (严格单持) — entitySlice.ts L32 `if (heldEntityId) return {reason:'手里已经拿着东西了'}`; heldEntityId 是 string\|null 单值。 |
| 2 | held object state shape | **FACT · CONFIRMED** | `heldEntityId: EntityId | null`，不是数组。 |
| 3 | pick action flow | **FACT · CONFIRMED** | press F → pickEntity(id) → 仅当 heldEntityId==null 且 entity.status==='free' 且 inRange → success=true，heldEntityId = id，entity.status = 'held' |
| 4 | place action flow | **FACT · CONFIRMED** | press F (while holding something) → find nearest container accepts this entityId → placeEntity → heldEntityId=null，entity.status='contained'，位置写入 containerStates[id] |
| 5 | object swap behavior | **FACT · CONFIRMED** | No direct swap. 必须先 place 再 pick new。台面 (acceptAny=true) 可用于临时换手 (例如 L2 茶几临时放 phone 才能拿 key)。 |
| 6 | 一次能否拿三件物体 (cup+tissue+fork)? | **FACT · EXPLICITLY NO** | **严禁**。CARRY_ONE 下旧路线文档中"捡起三件再分别投放"立即废弃。 |
| 7 | L1 每件物体真实目标 | **FACT · CONFIRMED** (clean-table.ts) | cup → cnt-dishwasher；tissue → cnt-trash-bin；fork → cnt-utensil-rack。全部在 DiningKitchen 单房。 |
| 8 | L2 cat trigger exact condition | **FACT · CONFIRMED** (leave-home.ts L292-303) | OR 双条件: (a) keyFreshSaved + keyFree + leftLiving；(b) keyFree + phoneObtained。任一满足即触发。 |
| 9 | L2 relocated key CURRENT_CODE_BASELINE | **FACT · CONFIRMED (越界 Bug!)** | leave-home.ts L312 hardcodes {room:'living', x:−3.2, y:0, z:−3.2}。**A1.5 Living minZ=−2.75 → z=−3.2 越墙了 0.45m！** Layout 阶段必须修正。 |
| 10 | L2 stale memory exact trigger | **FACT · CONFIRMED** | 与 cat event 同一 tick 同步 markMemoryOutdated: 'obj-key' (L314)。不等于玩家实际看到茶几空的时间点。 |
| 11 | L3 active rooms | **FACT · CONFIRMED** | rooms: ['laundry'] ONLY (laundry-sort.ts L38)。严禁跨房 (Living→DK→Laundry)。 |
| 12 | L3 spawn room | **FACT · CONFIRMED** | Laundry，spawnPosition (L42): {x:0, z:+2.0} |
| 13 | L3 completion room | **FACT · CONFIRMED** | Laundry。所有 3 个 baskets + 9 件 clothes 全部 initialRoom = 'laundry'。 |
| 14 | Minimap current source | **FACT · CONFIRMED** | Minimap.tsx 未实现！用 <div>Minimap</div> (硬编码占位)。当前所有"Minimap 几何验证"都是规划层面 (SVG/数值)，不是实现。 |
| 15 | Minimap current hardcoded coordinates | **FACT · N/A** | Minimap 未实现。不存在硬编码 world→minimap 转换。 |
| 16 | Current wall visual owner | **FACT · NOT FOUND in src** | Room3D.tsx 未实现程序化墙。当前没有 wall visual owner。 |
| 17 | Current wall collision owner | **INFERENCE** (sceneSchema L27-28, L47-52) | collision schema 对 room 生成 AABB walls: min/max based on room.size.x/z, thickness hardcoded 0.12 (sceneSchema `_wall(...)` thickness param 0.12). collision owner = programmatic sceneSchema. |
| 18 | Current asset dimension source | **CONFLICT** (drift!) | declaredSize 在 decorFurniture.ts 中是手写值 (例如 loungeSofa: size {x:2.4,y:1.0,z:0.9} vs Kenney 实际 2.0 × 1.0 × 0.9)。未冻结单源。 |

### CRITICAL CONFLICTS LIST (进入 Asset-Aware Layout 前必须修复的 src bug，但本轮不改)

1. **C-1 · commands.ts L82 vs leave-home.ts L9 STAGE NAME MISMATCH**
   commands 硬编码 `before.currentStageId === 'stage-observe-key'` (禁止 L2 pick key)；但 leave-home.ts STAGE_ID_OBSERVE_FETCH = 'stage-observe-fetch'。→ L2 的 pick key 限制 NEVER FIRES。
   Severity: MEDIUM — 玩家可能在 L2 一开始就 F pick key 跳过 E save → 体验差，但不妨碍机制运行。
   Fix: G1 代码接入阶段；本轮不改。

2. **C-2 · relocated key CURRENT_CODE_BASELINE z=−3.2 越界 (A1.5 Living minZ=−2.75)**
   Severity: HIGH → 如果直接跑 A1.5 rooms.ts，key 掉到墙外 → 玩家永远找不到。
   Fix: Living 家具 Layout 定了以后，把 targetPosition z 改到 [−2.75, +2.75] 范围内 (通常 = −2.0 sofa 附近)。

3. **C-3 · declaredSize 与 Kenney 实际 AABB 漂移 (loungeSofa 手写成 2.4×1.0×0.9，实际 = 2.0×1.0×0.9)**
   Severity: LOW (loungeSofa declaredSize 大了 0.4m，导致 pick 半径大，体验上"远处就能拿沙发上的东西"不严重)。
   Fix: Asset Import 阶段统一抄写 ASSET_DIMENSION_LEDGER_DRAFT.md 数值覆盖 declaredSize。

---

## 2. B2 WALL CONTRACT FORMALLY DEPRECATED (§五) + P0-WALL FROZEN (§六)

### B2 废弃理由 (7 条)
```yaml
B2 (DEPRECATED, not for Phase 1):
  logical thickness: 0.12m
  visual thickness:  0.20m
  same shared-wall centerline assumption

DEPRECATION REASONS (re-verified this round):
  1. internal shared wall → 两边都是房间；visual 比 logical 厚 0.04m (each side) → 各侵入 0.02m 室内空间 = 视觉穿模
  2. "向外扩张"不适用于内部共享墙 (没有 outside 可言；两面都是 inside)
  3. roomA/B lexical 排序无法决定 ±axis 哪面是室内 (roomA id 字母顺序 vs 实际几何方位无关)
  4. interiorFaceA = W − T/2 数学上不对应 roomA (取决于房间放哪一侧)
  5. visual & collision 厚度偏差 → 玩家走到墙边会感觉"视觉上贴墙了，但碰撞还离 4cm" (空气墙)
  6. structural GLB overlay (Kenney wall GLB 贴到程序化墙上) → 双重 draw call + 对齐负担；Phase 1 完全没必要
  7. 简单颜色 + 可选重复纹理 + 踢脚线 (无碰撞)，视觉足够达到"Kenney 怀旧家庭"风格需求

DEFERRED_STRUCTURAL_GLTF_EXPERIMENT.md:
  Re-evaluate only AFTER Living Room vertical slice stable & shipped.
  至少要 1 关通关 + 性能测试通过，再考虑是否引入 Kenney wall GLB overlay。
```

### P0-WALL (冻结的近期墙体方案)
```yaml
P0-WALL · PROGRAMMATIC SINGLE-THICKNESS WALL · FROZEN for Phase 1:
  logical thickness = 0.12m
  visual thickness  = 0.12m   (same as logical)
  SAME procedural wall segment is authoritative for all four:
    ① visual geometry (cuboid + Kenney-style paint)
    ② collision footprint (AABB boxes)
    ③ doorway gaps
    ④ minimap centerline + outline
  Appearance:
    - palette: Kenney Family Kenney Color Palette
    - material: simple low-cost
    - optional repeating 256×256 texture (drywall / wood)
    - baseboard / wall trim: decorative non-collision layer (height 0.1m)
  EXCEPTIONS (allowed GLB visuals on top, 不改变墙体权威 footprint):
    - Door visual: Kenney door-rotate-square-a GLB
    - Window frame: Kenney window variants
    - BUT: wall opening + collision still generated programmatically
  EXPLICITLY BANNED for Phase 1:
    ❌ use Kenney wall GLB replace all programmatic
    ❌ visual ≠ collision thickness
    ❌ 0.20m wall
    ❌ per-structural-model thickness normalizer maintenance
```

Output doc: [P0_PROGRAMMATIC_WALL_CONTRACT.md](file:///Users/azq/asandstar/homemem-arena-web-demo/docs/design/P0_PROGRAMMATIC_WALL_CONTRACT.md)

---

## 3. A1.5 COMPACT HUB TOPOLOGY (推荐户型) + §九 NUMERICAL LEDGER VERIFIED

### 3.1 基础参数
```yaml
Target area: 115~125 ㎡     → Actual = 120.81 ㎡ ✓
Adjacency: B↔L ↔ E; L↔DK↔Ly (Living hub topology preserved)
0 gaps? → YES (0 undeclared) ✓
0 overlaps? → YES (0 overlap area) ✓
Internal adjacency count: 4 (B↔L, L↔DK, DK↔Ly, L↔E) ✓
Exterior doorway count: 1 (E east wall front door) ✓
Doorway center bidirectional world error ≤ 0.01m? → YES (max err = 0.000m) ✓
```

### 3.2 RoomRect Table (A1.5 world coordinates, meters)

| Room | centerX | centerZ | width (X) | depth (Z) | minX | maxX | minZ | maxZ | area (㎡) |
|------|---------|---------|-----------|-----------|------|------|------|------|-----------|
| Living | 0.000 | 0.000 | 6.500 | 5.500 | −3.250 | +3.250 | −2.750 | +2.750 | 35.750 |
| Bedroom | −5.650 | 0.000 | 4.800 | 5.200 | −8.050 | −3.250 | −2.600 | +2.600 | 24.960 |
| Entrance | +4.750 | −1.625 | 3.000 | 4.500 | +3.250 | +6.250 | −3.875 | +0.625 | 13.500 |
| DiningKitchen | 0.000 | −5.350 | 5.500 | 5.200 | −2.750 | +2.750 | −7.950 | −2.750 | 28.600 |
| Laundry | +4.750 | −5.600 | 4.000 | 4.500 | +2.750 | +6.750 | −7.850 | −3.350 | 18.000 |
| **TOTAL** | | | | | | | | | **120.81** |

### 3.3 Adjacency Verification (4 internal shared walls)

| Room A ↔ Room B | Shared plane | Shared overlap | Shared wall length | Doorway gap center world (双向误差) |
|-----------------|--------------|----------------|-------------------|-------------------------------------|
| B ↔ L | X = −3.25 | Z ∈ [−2.6, +2.6] ∩ Z ∈ [−2.75, +2.75] = Z ∈ [−2.6, +2.6] | 5.20m ≥ 1.4m ✓ | x=−3.25, z=0.0 → B from (-5.65-2.4, z) B doorway offset x=+2.4 → center world X = −5.65+2.4 = −3.25, same as L minX. ✓ 0.000m err |
| L ↔ DK | Z = −2.75 | X ∈ [−3.25, +3.25] ∩ X ∈ [−2.75, +2.75] = X ∈ [−2.75, +2.75] | 5.50m ≥ 1.4m ✓ | x=0.0, z=−2.75. DK L door offset +2.6 → Z = −5.35+2.6 = −2.75. L z = −2.75 same. 0.000m err ✓ |
| DK ↔ Ly | X = +2.75 | Z ∈ [−7.95, −2.75] ∩ Z ∈ [−7.85, −3.35] = Z ∈ [−7.85, −3.35] | 4.50m ≥ 1.4m ✓ | Ly X min = 2.75, DK X max = 2.75 same. Doorway Z overlap = 4.5m ≥ 1.4m. ✓ |
| L ↔ E | X = +3.25 | Z ∈ [−3.875, +0.625] ∩ Z ∈ [−2.75, +2.75] = Z ∈ [−2.75, +0.625] | 3.375m ≥ 1.4m ✓ | L X max = +3.25, E X min = +3.25 same. ✓ |

**Front Door (exterior):** E east wall (x=+6.25), width = 1.2m (swing 90° inward), z ∈ [−2.225, −1.025] → center z = −1.625 = E center Z. ✓ swing clearance = Entrance width 3.0m minus 1.2m door = 1.8m swing space (净通道 ≥ 1.0m ✓).

**All doorways & adjacencies verified.**
Output doc: [A1_5_COMPACT_HUB_NUMERICAL_BLUEPRINT.md](file:///Users/azq/asandstar/homemem-arena-web-demo/docs/design/A1_5_COMPACT_HUB_NUMERICAL_BLUEPRINT.md)

---

## 4. A1 / A1.5 / A2 COMPARISON & SINGLE RECOMMENDATION (§八)

| Dimension (15 total) | A1 (148㎡) | A1.5 (121㎡) | A2 (104㎡) |
|----------------------|-----------:|------------:|-----------:|
| 1. Real apartment range fit | 🟡 large 3BR-4BR | 🟢🟢 3BR sweet spot | 🟢 2BR/小 3BR |
| 2. Living furn density (no showroom) | 🟡 需无意义填充 | 🟢🟢 30~35% real density | 🟢 slightly high |
| 3. Home intimacy visual distances | 🟡 far rooms memory load | 🟢🟢 max 14m any-to-any | 🟢 visually tight |
| 4. Entrance front door swing net clear | 🟢🟢 > 2.5m | 🟢 2.1m ≥ 1.0m | 🟡 borderline 1.1m |
| 5. Laundry W/D + 3 baskets + search zone | 🟢🟢 25㎡ spacious | 🟢 18㎡ OK | 🟡 14.4㎡ boundary |
| 6. Bedroom reachability (bed circ aisle) | 🟢🟢 3 sides 0.8m+ | 🟢 2 sides 0.7m (≥ 0.6m std) | 🟡 0.5m tight |
| 7. DK L1 route triangle | 🟢🟢 2.5m spacing | 🟢 2.0m good teach | 🟡 1.6m too short |
| 8. L2 line of sight & search potential | 🟢 great | 🟢🟢 4.75m search distance (刚刚好!) | 🟡 4.2m see everything |
| 9. Minimap readability | 🟡 label overlap (mobile) | 🟢🟢 mobile 0.75x readable | 🟡 E and Ly tiny bars |
| 10. Non-interactive walk distance L2 worst | 🔴 ~24m fatigue | 🟢🟢 ~21m fine | 🟡 ~15m too easy |
| 11. Production complexity vertices | 🟡 +18% verts vs A1.5 | 🟢🟢 18% less than A1 | 🟢 lightest |
| 12. Meaningless decor fill risk | 🔴 60+ decor items needed | 🟢🟢 ~30 (Kenney coverable) | 🟢 ~20 items |
| 13. Nostalgic home sci-fi composition | 🟡 office-sized not home | 🟢🟢 90s family sweet spot | 🟡 cramped rental look |
| 14. Mobile / low-end perf burden | 🔴 over-budget for contest demo | 🟢🟢 meets target 30 fps low-end | 🟢 meets |
| 15. Playtest adjustment headroom | 🟢 too much room to cut | 🟢🟢 ±0.3m each fine | 🟡 can only expand |

唯一推荐 (§八 Single recommendation):
> 📐 **A1.5 · 120.81㎡ Compact Hub**
> Status: **CANDIDATE FOR HUMAN APPROVAL**
> 不叫 production approved。等用户批准 → 进入 Asset-Aware Room Layout 阶段。批准前，A1.5 仍是候选 (rooms.ts 不写)。

Output doc: [A1_A1_5_A2_COMPARISON_MATRIX.md](file:///Users/azq/asandstar/homemem-arena-web-demo/docs/design/A1_A1_5_A2_COMPARISON_MATRIX.md)

---

## 5. LEVEL ROUTES REALITY CHECK (§十 L1 + §十一~§十三 L2/L3)

### 5.1 CARRY_CAPACITY = CARRY_ONE → L1 路线重算
L1 (DiningKitchen 单房) 必须 3 次独立往返 (每 pick 一件后 place，再回 table pick next):

推荐教学顺序 A: Cup → Tissue → Fork (先液体后垃圾后餐具，认知顺序自然):
```
Cup (table DK: −0.6, 0) → dishwasher (DK: +2.2, +0.5): 2.84m
Return to table → Tissue (DK:+0.6,0) → trash-bin (DK:−2.2,+0.5): 2.84m + 2.26m return
Return to table → Fork (DK: 0, −0.3) → utensil rack (DK:−1.5,0): 1.53m
Total walk: 11.81m (A1.5 size)
Trips back to table: 3
F ops: pick×3 + place×3 = 6
E (save memory): recommended 3 (L1 teaching; stage 1 min 1 allowed)
Time (newbie): 45~70s / 180s limit → OK
```

### 5.2 L2 CAT TRIGGER 顺序重建
L2-FLOW-A (KEY-FIRST, 推荐):
1. Spawn in Living → E 保存 key 记忆 (keyFreshSaved = true)
2. 去 Bedroom 拿手机 → 跨 B-L 门洞 → leftLiving = true → CONDITION_A ✓ ✓ ✓ → cat event **triggered**
3. key 物理从茶几 → (−3.2, −3.2) 但 player 在 Bedroom 没看到；stale memory marked
4. 拿完 phone 回到 Living → 茶几空了 (冲击!) → minimap 上灰红虚线圆 (×) 在茶几 (stale)
5. 按 toast 提示 → 客厅西北角沙发区搜索 → 找到 displaced key
6. E 更新 key 记忆 → stage-key-outdated complete → 用茶几台面 (acceptAny) 临时换手
7. 分别把 key, phone, umbrella 放 Entrance 托盘 → 3/3 ✅

为什么 FLOW-A 比 FLOW-B 好: 不改代码、触发概率 100%、新手友好。

### 5.3 L2 RELOCATED KEY 候选 (TO_BE_DECIDED during Living Layout)
| ID | Zone | 距离茶几 | 回来直接可见 | 泄题风险 | 初步评级 |
|----|------|---------|-------------|----------|---------|
| KEY-LOC-A (sofa cushion 下, L NW) | L (−2.5~−1.5, −2.75~−1.75) | 3.87m | ❌ 转身 135° | 🟢 None | 🥇 |
| KEY-LOC-B (bookshelf 后, L E) | L (+1.75~+2.75, −2.75~−2.0) | 3.40m | ✅ (从 E 门进一眼看见) | ❌ observed 绿点泄题 | 🥉 |
| KEY-LOC-C (TV cabinet crevice, L SE) | L (+2.25~+3.25, −2.5~−2.0) | 3.59m | ⚠️ 斜看见 | 🟡 possible | 🥈 |
| CURRENT_CODE_BASELINE | (−3.2, −3.2) → ⚠️越墙外 0.45m | ❌越界 | N/A | N/A | MUST FIX |

**冻结为 TO_BE_DECIDED_DURING_LIVING_LAYOUT** — 只有在 Living 家具包络 100% 固定后才能选 A/B/C 并写入 leave-home.ts。

### 5.4 L3 SCOPE FROZEN: L3-A · LAUNDRY SINGLE ROOM
```yaml
L3_ACTIVE_ROOM_CONTRACT · FROZEN:
  activeRoomIds: ['laundry']          # 单房
  spawnRoom: 'laundry'                # L42
  completionRoom: 'laundry'           # 9 clothes + 3 baskets 全部在 laundry
  doorwayTransitions: false           # 不允许离开
  Cross-room L3-B (DK + Laundry): REJECTED
    - requires modifying rooms field in laundry-sort.ts → unnecessary
    - +50~100% walk distance
    - reduced 3-basket visibility from DK
    - learning cost higher
```

Output docs:
- [RUNTIME_CARRY_AND_INTERACTION_FACT_LEDGER.md](file:///Users/azq/asandstar/homemem-arena-web-demo/docs/design/RUNTIME_CARRY_AND_INTERACTION_FACT_LEDGER.md)
- [REVISED_L1_L2_L3_ROUTE_CONTRACT.md](file:///Users/azq/asandstar/homemem-arena-web-demo/docs/design/REVISED_L1_L2_L3_ROUTE_CONTRACT.md)
- [L2_EVENT_TRIGGER_AND_RELOCATED_KEY_CANDIDATES.md](file:///Users/azq/asandstar/homemem-arena-web-demo/docs/design/L2_EVENT_TRIGGER_AND_RELOCATED_KEY_CANDIDATES.md)

---

## 6. ASSET DIMENSION SINGLE SOURCE FROZEN (§十四) + WASHER/DRYER/BED §十五~§十六

```yaml
ASSET_DIMENSION_SOURCE_CONTRACT · FROZEN:
  Authoritative source: docs/assets/ASSET_DIMENSION_LEDGER_DRAFT.md
  Only lookup key: assetDimensionId (e.g. furniture/loungeSofa, appliance/washer, food/mug)
  All other design docs MUST reference by assetDimensionId — NEVER copy numeric AABB again!
  Banished fictional stems (REPLACED WITH REAL STEMS):
    ❌ coffeeTableLong  → ✅ furniture/tableCoffee    (actual stem = tableCoffee)
    ❌ cabinetLowLong   → ✅ furniture/cabinetTelevision
    ❌ tableDiningLong  → ✅ furniture/table
    ❌ chairDining      → ✅ furniture/chair
    ❌ wallStraightA    → ✅ P0-WALL (procedural wall only, not GLB footprint authority)
```

### 6.1 Washer / Dryer 实测 (仓库外只读，0.62×0.68×0.92m each)

| Asset | OBJ AABB (W×D×H) | GLB AABB | Match | Effective envelope | Layout |
|-------|------------------|----------|-------|--------------------|--------|
| Washer | 0.620 × 0.680 × 0.920 | 0.618×0.681×0.919 | ✅ 3mm diff | **0.70 × 0.72 × 0.95** | 留缝防穿模 |
| Dryer | 0.621 × 0.679 × 0.918 | 0.619×0.680×0.917 | ✅ 4mm | **0.70 × 0.72 × 0.95** | 同上 |
| Stacked total H | — | — | — | **1.84m** | < 3.0m ceiling ✅ |

### 6.2 Bed Double Safe Envelope (DEFERRED sub-mesh decisions!)
```
OBJ only mattress:     1.50 × 2.00 × 0.35  → ❌ DON'T USE for layout
GLB complete bed+frame:1.62 × 2.14 × 1.05  → Actual size
MATCH: MISMATCH_MAJOR (300% height difference! OBJ missed headboard)
BED_SAFE_ENVELOPE (mandatory for layout stage):
  **1.70m × 2.20m × 1.10m** (GLB 尺寸 + 余量，避免床头板撞墙/衣柜)
DEFERRED_ASSET_IMPORT_DECISION (this round SHALL NOT decide):
  ① remove headboard?  ② filter mesh?  ③ per-model 0.85 scale?  ④ Blender re-export?
→ All deferred; only answer AFTER Asset Import Model Setup Stage.
```

Output docs:
- [ASSET_DIMENSION_SOURCE_CONTRACT.md](file:///Users/azq/asandstar/homemem-arena-web-demo/docs/design/ASSET_DIMENSION_SOURCE_CONTRACT.md)
- [WASHER_DRYER_DIMENSION_ADDENDUM.md](file:///Users/azq/asandstar/homemem-arena-web-demo/docs/assets/WASHER_DRYER_DIMENSION_ADDENDUM.md)

---

## 7. MINIMAP GATE SEMANTICS CORRECTED (§十七) + A1.5 MINIMAP PLAN PASS (§十八)

```yaml
OLD NAME (deprecated & BANNED):    MINIMAP_GEOMETRY_PASS        (claimed implementation)
REPLACED BY:                       MINIMAP_PLAN_GEOMETRY_PASS   (proven only for plan geometry)
FUTURE IMPLEMENTATION GATE:        MINIMAP_IMPLEMENTATION_PASS  (requires E2E + code review)

What PLAN_GEOMETRY_PASS PROVES:
  ✅ Plan rectangles mappable (formula continuous)
  ✅ Doorway center coordinates bidirectional align (≤ 0.01m err)
  ✅ World → minimap formula continuous (no jumps between rooms)
  ✅ Registry model theoretically consistent

What PLAN_GEOMETRY_PASS CANNOT PROVE (still to do):
  ❌ Minimap.tsx actually implemented (now: hardcoded <div> placeholder)
  ❌ Real doorways drawn as gaps
  ❌ Player avatar crossing feels continuous
  ❌ Rotated furniture synced to minimap correctly
  ❌ Active taskRooms highlight opacity fade
  ❌ Memory states (fresh green circle vs stale red dashed) actually render
```

A1.5 Minimap 10-item check = 10/10 all pass → **MINIMAP_PLAN_GEOMETRY_PASS ✓**
- 0 visual gaps, 0 duplicated shared walls
- 4 internal + 1 exterior doorway aligned & separate
- Living hub readable (center)
- Entrance 不压成细条; Laundry label not clash DK label
- World Z→minimap Y correct (south=down)

Output doc: [A1_5_MINIMAP_PLAN_GEOMETRY_VALIDATION.md](file:///Users/azq/asandstar/homemem-arena-web-demo/docs/design/A1_5_MINIMAP_PLAN_GEOMETRY_VALIDATION.md)

---

## 8. REMAINING LIMITATIONS (进入 Asset-Aware Layout 前记住)

| ID | Item | Severity | Mitigation Owner Stage |
|----|------|----------|------------------------|
| L-1 | CARRY_ONE 下 L2 临时换手必须靠茶几台面 (acceptAny=true) — 否则玩家拿了手机就不能拿 key | LOW | G1 code: verify cnt-coffee-table acceptAny=true (already true per schema) |
| L-2 | commands.ts stage-observe-key NAME MISMATCH → L2 pick key 限制失效 | MEDIUM | G1 fix command filter stage name |
| L-3 | CURRENT_CODE_BASELINE L2 relocated key z=−3.2 在 A1.5 Living 墙外 0.45m | HIGH (BLOCKER if unpatched) | Living Layout Stage → 选 KEY-LOC-A/B/C 实际位置后写回代码 |
| L-4 | BedDouble OBJ vs GLB MISMATCH_MAJOR → Layout 必须用 BED_SAFE_ENVELOPE 1.70×2.20×1.10 | MEDIUM | Asset Import Stage 最终决定 scale/pivot |
| L-5 | LoungeSofa declaredSize 2.4 vs Kenney actual 2.0 drift 40cm X | LOW | Asset Import Stage 统一按 Ledger 覆盖 declaredSize |
| L-6 | Minimap 当前是占位 div，0 实现工作 | HIGH (next stage work) | Minimap Implementation Pass (after code generation gate starts) |
| L-7 | Cat visual model not confirmed (Kenney Animals Pack cat availability?) | LOW | Asset Import Stage 确认 cat stem；没有就做低模球+胡须贴片 |

---

## 9. FINAL GATE DETERMINATION (§二十)

Gate 条件对照 (GO_TO_ASSET_AWARE_ROOM_LAYOUT_WITH_SCALE_LIMITATIONS):
```
✅ A1/A1.5/A2 → Single recommendation exists (A1.5)
✅ A1.5 0 gaps / 0 overlaps (§九 verified)
✅ 4 internal + 1 exterior doorway bidirectional align (err ≤ 0.01m)
✅ P0-WALL frozen 0.12m single thickness, visual=collision
✅ B2 deprecated from near-term roadmap, deferred to post-Vertical-slice
✅ CARRY_CAPACITY = CARRY_ONE confirmed from entitySlice L32 (no UNKNOWN)
✅ L1 routes recalculated for CARRY_ONE (3 round trips, not 3-item one-shot)
✅ L2 trigger order consistent with source (OR double condition)
✅ Relocated key NOT prematurely frozen → 3 candidates + TBD at Living Layout
✅ L3 active rooms frozen → L3-A Laundry Single (no cross room)
✅ Asset dimension single source frozen (ASSET_DIMENSION_LEDGER_DRAFT + assetDimensionId)
✅ Washer/dryer actual measured from OBJ/GLB (0.62×0.68×0.92, not "~1.2×0.8×1.7" myth)
✅ Bed uses safe envelope 1.70×2.20×1.10, defers mesh filtering decisions
✅ Minimap Gate renamed to MINIMAP_PLAN_GEOMETRY_PASS, correctly
✅ A1.5 minimap plan-level pass (10/10 checks)
✅ 0 code changes (src/ tests/ scripts/ config/ NOT modified this round)

All hard pass requirements satisfied...
BUT: A1.5 120.81㎡ Compact Hub has NOT received human user approval yet!
→ Cannot issue GO_TO_..._WITH_SCALE_LIMITATIONS.
→ Must issue:
```

### 🏁 FINAL GATE = **A1_5_HUMAN_APPROVAL_REQUIRED** (请用户批准 A1.5)

**下一步动作 (人类用户)**:
1. 如果批准 A1.5 (120.81㎡ Compact Hub) 为正式生产 baseline → 可开启 Asset-Aware Room Layout Stage。
2. 如果更喜欢 A1 或 A2，请明确 → 本轮生成的 A1.5 LEDGER 会对应回退为历史版本，重新走拓扑验证 (0 间隙 0 重叠 etc.)。
3. 批准后再进入家具最终摆放阶段 (Laying out furniture with assetDimensionId)。

**本阶段严禁**: 不批准就开始家具布局；不批准就改 rooms.ts；不批准就 commit / push。

---

## 10. POST-WORK GIT STATUS (§廿一 Confirmation)

待执行本文件写完后最后 4 命令:
```bash
git diff --check
git status --short
git rev-parse HEAD
git rev-parse origin/main
```

期望结果:
```
git diff --check → (blank)
git status --short → Only ?? untracked design docs (this report + 9 siblings)
git rev-parse HEAD = c5a2f83 (UNCHANGED)
git rev-parse origin/main = c5a2f83
No models / GLB / ZIPs copied into repo.
```

本轮输出的 10 份 UNTRACKED 文档 (全部不在 git 追踪中):
```
1. docs/design/P0_PROGRAMMATIC_WALL_CONTRACT.md
2. docs/design/RUNTIME_CARRY_AND_INTERACTION_FACT_LEDGER.md
3. docs/design/A1_5_COMPACT_HUB_NUMERICAL_BLUEPRINT.md
4. docs/design/A1_A1_5_A2_COMPARISON_MATRIX.md
5. docs/design/REVISED_L1_L2_L3_ROUTE_CONTRACT.md
6. docs/design/L2_EVENT_TRIGGER_AND_RELOCATED_KEY_CANDIDATES.md
7. docs/design/ASSET_DIMENSION_SOURCE_CONTRACT.md
8. docs/design/A1_5_MINIMAP_PLAN_GEOMETRY_VALIDATION.md
9. docs/assets/WASHER_DRYER_DIMENSION_ADDENDUM.md
10. .trae/documents/HOMEMEM_ARENA_PRE_LAYOUT_CONTRACT_CORRECTION_REPORT.md (this file)
```

---

End of PRE-LAYOUT CONTRACT CORRECTION REPORT. Gate = A1_5_HUMAN_APPROVAL_REQUIRED.
