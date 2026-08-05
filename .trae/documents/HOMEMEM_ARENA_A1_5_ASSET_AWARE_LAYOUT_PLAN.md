# HOMEMEM ARENA — A1.5 Asset-Aware Room & Level Layout Design (综合主计划文档)

> **Work Package ID**: A1.5-ASSET-AWARE-LAYOUT
> **Planning Baseline**: APPROVED_PLANNING_BASELINE (A1.5 Compact Hub, 120.81㎡)
> **Mode**: PLAN MODE (本轮全程不写 src/tests/scripts/config/任何任务文件/commands)
> **Output Set**: 9 documents untracked
> **Final Gate**: GO_TO_LAYOUT_IMPLEMENTATION_PLAN_WITH_BLOCKERS ✅
> **Branch Status**: main, HEAD = origin/main = c5a2f83cd5ec608a119fbb237d80f4f67bd1450e
> **Git**: staged=0, modified tracked=0, 所有模型仍在仓库外审计目录；新增只有 untracked docs

---

## 零、本轮人类审批定位 (§零)

- **审批基线 APPROVED_PLANNING_BASELINE**: A1.5 Compact Hub 总内净面积 120.81㎡
- **固定拓扑**: 5 rooms + 4 internal edges (Bedroom↔Living↔Entrance; Living↔DiningKitchen↔Laundry) + 1 front door
- **Runtime Facts frozen**: CARRY_ONE / L2 rooms=Living+Bedroom+Entrance / L3 Laundry only / Cat relocates key only (phone & 伞不动)
- **本轮禁止**: 任何 src/tests/scripts/config 修改；rooms.ts / Room3D.tsx / Minimap.tsx / tasks / commands.ts 禁改；模型不复制入仓库；不下载；不 commit；不 push；不生产实现。

---

## 一、前置状态 (§一)

✅ branch = main；HEAD c5a2f83 = origin/main；staged=0；modified tracked=0；diff --check clean

```
HEAD=c5a2f83cd5ec608a119fbb237d80f4f67bd1450e
```

---

## 二、已读取基础文档 (§二)

### 规划/设计 (8 docs)
- A1_5_COMPACT_HUB_NUMERICAL_BLUEPRINT
- A1_A1_5_A2_COMPARISON_MATRIX (推荐 A1.5)
- A1_5_MINIMAP_MACHINE_VALIDATION (V3 10 assertions PASS)
- FINAL_EVIDENCE_INTEGRITY_REPORT
- SOURCE_STATE_TRUTH_TABLE
- RUNTIME_CARRY_AND_INTERACTION_FACT_LEDGER (18 Runtime Facts)
- REVISED_L1_L2_L3_ROUTE_CONTRACT (L1 3-cycle ×1 obj)
- L2_EVENT_TRIGGER_AND_RELOCATED_KEY_CANDIDATES (FLOW-A KEY-FIRST + OR cat trigger)

### 资产 Ledger (5 docs)
- ASSET_ACTUAL_CONTENT_INVENTORY
- ASSET_DIMENSION_LEDGER_DRAFT
- ASSET_STEM_WHITELIST_AUDIT
- WASHER_DRYER_BED_REMEASUREMENT (FORMAT_TRUTH raw GLB)
- ASSET_CONFIRMED_GAP_LIST (3 confirmed gaps)

### 源码事实 (只读) 10 files
- rooms.ts / decorFurniture.ts / furnitureOwnership.ts
- clean-table.ts / leave-home.ts / laundry-sort.ts
- commands.ts (BLOCKER-L2-01 source)
- entitySlice.ts / Room3D.tsx / Minimap.tsx

---

## 三→七 → 资产 Ledger + 尺寸策略 (§五~七)

输出文档: `docs/assets/A1_5_ASSET_PLACEMENT_LEDGER.md`

核心结论:
- 20 F 类 (F1-F20) 真实 GLB: 18 ✅ VALIDATED_ASSET + 2 (F12 sideTable/F19 cabinetLow PROXY)
- 14 P 类 placeholder: 4 PROXY (P1 bedside drawer / P2 wardrobe / P7 shoe / P11 trash / P12 rack) + 10 PLACEHOLDER_ONLY (伞架 curtain shoes coat+mirror floor-lamp rug dishwasher visual trash-proxy rack-proxy detergent)
- INVALID_STEM = 0 (10 黑名单 stem 全清)
- Layout safe envelope: washer/dryer 0.65×1.15×0.65；bed ≥1.75×2.10；所有 component-wise max(raw×1.1, legacy)
- 所有坐标: 全部 room-local；world 由脚本派生；严格禁止手写两套

---

## 八 Living 3 候选 → 推荐

输出: `docs/design/LIVING_L2_LAYOUT_CANDIDATES.md`

- LIVING-A Sofa Focus 🏆 9.2/10: 北墙 2.4m sofa 朝南，东墙 TV+cabinet，西书架，东南角 armchair
- Old key 位置: coffee 中央 (0, +0.8) 5 秒内找到
- 猫脚印 3 步: coffee 前 → sofa 前 → sofa 西端坐垫下
- Relocated key 推荐 KEY-LOC-A = Living local (-0.4, +2.0) sofa underside。完全在房间内。入口第一眼被 sofa 挡看不到。
- 12 项 V1-V12 全过。

---

## 九、十 Bedroom & Entrance

输出: `docs/design/BEDROOM_AND_ENTRANCE_LAYOUT_CANDIDATES.md`

**Bedroom-A 🏆: 对称床靠北 1.75×2.10 + 两侧 cabinetBedDrawer (F20) 床头柜。右交互床头柜放手机抽屉。Wardrobe proxy 西墙 (opening 4.25m 净空)。Desk 南墙 pull-out 0.8m。
Entrance-A 🏆: Tray-first at (0, +0.5) Living→Tray 1.55m 极短。swing 安全。3 obj 三角放。CARRY_ONE 6 cycle (key→phone→umbrella × tray) 全清晰。

---

## 十一 L1 DiningKitchen CARRY_ONE

输出: `docs/design/L1_DININGKITCHEN_ROUTE_LAYOUT.md`

DK-A Compact Triangle 🏆 9.5/10:
- 餐桌北 (0, +0.8)；DW 西南(-2.4,-2.2)；Trash 东南(+2.4,-2.2)；Rack 东北(+2.3,+2.2)
- 推荐杯→纸→叉顺序: 总行走 17.6m；6 E；0 F；首次交互 <3s；最坏 20.8m。

---

## 十二 L3 Laundry

输出: `docs/design/L3_LAUNDRY_LAYOUT.md`

LAUNDRY-A Side-by-side 🏆 9.4/10:
- Washer(-1.1,-1.8) + Dryer(-0.35,-1.8) 南墙并排前操作净空 0.9m ✅
- 三篮北墙 (-1.5/-0.3/+1.0, Z=+1.7) 出生同时看见 ✅
- 9 Garment 分散中央 0.35~1.2m → 篮距离 (平均 0.8m) 合理 ✅
- L3 严格单房: 门 inactive 暗化。

---

## 十三 Minimap Layout Overlay

输出: `docs/design/A1_5_MINIMAP_LAYOUT_OVERLAY.md`

核心:
- 完整 SVG 740×535 像素 (50 px/m) 全屋俯视图，含:
  5 房间色块 / 4 内部门缺口白虚线 / 1 前门黄方红边 / 51 家具 minimap 色块 / 3 spawn / relocated key(A) 半透明隐藏标记 / P0-A 双墙红色虚线标记
- 10 断言全通
- Gate = **MINIMAP_LAYOUT_PLAN_PASS** (NOT implementation!)
- L1/L2/L3 minimap 数据与 activeRoomIds 对齐.

---

## 十四 5 实施 Blockers Register

输出: `docs/design/PRE_IMPLEMENTATION_BLOCKER_REGISTER.md`

| # | ID | Severity | 核心 | 阶段|
|---|---|---|---|---|
| 1 | BLOCKER-L2-01 | 🔴 P0 | FLOW-A stage commands 名错 2 处 → leave-home 不匹配 | WP1 L2 |
| 2 | BLOCKER-L2-02 | 🔴 P0 | key 新位置 (-3.2,-3.2) 越界 → 改为 (-0.4, +2.0) | WP1 L2 |
| 3 | BLOCKER-ASSET-01 | 🟠 P1 | 18 资产 FILE 重校验 + 6 placeholder CC0 下载 | WP0 资产 |
| 4 | BLOCKER-SCALE-01 | 🟠 P1 | 每件 scale 单独冻结 禁 × 全包统一 | WP0 资产 |
| 5 | BLOCKER-WALL-01 | 🟡 P2 | P0-A shared wall double draw → DEFERRED | Governance |

---

## 十五 3 全屋组合 + 最终推荐

输出: `docs/design/A1_5_INTEGRATED_ROOM_LAYOUT_BLUEPRINT.md`

| 组合 | 评分 | 结果 |
|---|---|---|
| HOUSE-LAYOUT-1 Gameplay Priority | **9.18/10** | 🏆 A1_5_LAYOUT_RECOMMENDED |
| HOUSE-LAYOUT-2 Domestic Realism | 8.8/10 | Runner-up |
| HOUSE-LAYOUT-3 Cinematic Nostalgic Sci-Fi | 8.4/10 | Runner-up |

A1_5_LAYOUT_RECOMMENDED = HOUSE-LAYOUT-1
Status: CANDIDATE_FOR_IMPLEMENTATION_APPROVAL
推荐 key new loc: Living local (-0.4, +2.0)

---

## 十六 输出清单 (9 docs) ✅ 全生成，全部 untracked

| # | 路径 | 状态 |
|---|---|---|
| 1 | `docs/assets/A1_5_ASSET_PLACEMENT_LEDGER.md` | ✅ created |
| 2 | `docs/design/LIVING_L2_LAYOUT_CANDIDATES.md` | ✅ created |
| 3 | `docs/design/BEDROOM_AND_ENTRANCE_LAYOUT_CANDIDATES.md` | ✅ created |
| 4 | `docs/design/L1_DININGKITCHEN_ROUTE_LAYOUT.md` | ✅ created |
| 5 | `docs/design/L3_LAUNDRY_LAYOUT.md` | ✅ created |
| 6 | `docs/design/A1_5_MINIMAP_LAYOUT_OVERLAY.md` | ✅ created (含完整 SVG) |
| 7 | `docs/design/A1_5_INTEGRATED_ROOM_LAYOUT_BLUEPRINT.md` | ✅ created |
| 8 | `docs/design/PRE_IMPLEMENTATION_BLOCKER_REGISTER.md` | ✅ created |
| 9 | `.trae/documents/HOMEMEM_ARENA_A1_5_ASSET_AWARE_LAYOUT_PLAN.md` (本文件) | ✅ |

All 9 are untracked new docs (§十六要求: 保持 untracked. 不得修改历史；不得 commit；不得 push)

---

## 十七 Final Gate

```
13/13 Gate conditions PASSED:
  [x] 五房都有唯一推荐布局
  [x] 三关路线通过 (L1/L2/L3 CARRY_ONE strict OK)
  [x] Living relocated key 有候选 (KEY-LOC-A)
  [x] key 在房间内 (X/Z 双 check)
  [x] CARRY_ONE 路线成立 (L1=3 cycles；L2=4 carries；L3=9 carries)
  [x] L3 单房 (无跨 DK)
  [x] 资产 stem 验证/proxy/placeholder 全覆盖
  [x] 每件有 layoutSafeEnvelope
  [x] Minimap Layout Plan Pass (10 assertions)
  [x] Door clearance ≥ 1.2m 全房
  [x] Blocker Register 5 件全登记
  [x] 0 modified tracked files (0 src code clean)
  [x] 综合布局 HOUSE-LAYOUT-1 显著高于其它 → 无需人类二次选择

====== FINAL GATE ======
>> GO_TO_LAYOUT_IMPLEMENTATION_PLAN_WITH_BLOCKERS
========================
```

---

End of A1.5 Layout Planning Package.
人类批准 A1_5_LAYOUT_RECOMMENDED + 5 Blockers → 下一步启动 WP0 资产导入包。
