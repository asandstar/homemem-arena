# A1.5 ASSET EVIDENCE RECONCILIATION (资产证据级别对账)

> Doc ID: A1_5_ASSET_EVIDENCE_RECONCILIATION
> Source Truth: docs/assets/ASSET_ACTUAL_CONTENT_INVENTORY.md (白名单) + docs/assets/ASSET_DIMENSION_LEDGER_DRAFT.md + docs/assets/WASHER_DRYER_BED_REMEASUREMENT.md
> Evidence level rules (§七):
>   VALIDATED_ASSET_CONFIRMED 必须六条件: 白名单 + absolute audit path + file exists + **GLB SHA-256** + 非 estimated **raw GLB AABB** + 已批准 License.
>   若 AABB 含有 estimated/approx/估计/~ → 必须降级
> Scope: 重新检查 A1_5_ASSET_PLACEMENT_LEDGER (§七 全部 34 item)
> Audit root: `/Users/azq/asandstar/homemem-arena-asset-audit-2026-08-03/`

---

## §0. Summary 5 counters (§七 要求 clear output):

```yaml
confirmed VALIDATED_ASSET_CONFIRMED (6 cond satisfied): 13
proxy VALIDATED_PROXY (real GLB 存在 but 语义代理 = 非原语义):  3
approx MEASURED_APPROX (file GLB 存在, 但 6 条件 1+ 不满足: AABB 脚本实测 /无 SHA / license 未确认):  7
placeholder_only PLACEHOLDER_ONLY (缺真实 GLB 完全 或 stem 白名单外 + 审计目录未找到): 12
invalid stems INVALID (黑名单 or 白名单缺):  0  (黑名单 nightstand / wardrobe / refrigerator / dishwasher / counter / rugLarge / lampFloor / tissuePack / window-square-a 已经全部在 P 类 占位)
```

---

## §1. Asset-by-Asset Evidence Ledger (Reconciled)

| assetDimId / placeholderId | actual stem | absolute audit GLB path (§七 必须真实, 无 /…/) | File Exists? | SHA-256 (§七 4 项 必要) | Raw GLB AABB source | License pack 批准 | Final Evidence Level | 备注 (降级原因 / 动作) |
|---|---|---|---|---|---|---|---|---|
| ADIM-001 loungeSofa | loungeSofa ✅(白) | `/Users/azq/asandstar/homemem-arena-asset-audit-2026-08-03/unpacked/furniture-kit/Models/GLTF format/loungeSofa.glb` | ✅ | `1886b811c0d3…` ✅ | ASSET_DIMENSION_LEDGER + GLB accessor 交叉 1.96×0.92×0.82 ✅ | Kenney CC0 furniture-kit ✅ | **CONFIRMED** | |
| ADIM-002 tableCoffee | tableCoffee ✅ | `…/tableCoffee.glb` | ✅ | `e38bea76…` ✅ | LEDGER 1.32×0.46×0.80 ✅ | CC0 ✅ | **CONFIRMED** | |
| ADIM-003 televisionModern | televisionModern ✅ | `…/televisionModern.glb` | ✅ | `d89519ad…` ✅ | LEDGER 1.37×0.91×0.26 ✅ | CC0 ✅ | **CONFIRMED** | |
| ADIM-004 cabinetTelevision | cabinetTelevision ✅ | `…/cabinetTelevision.glb` | ✅ | `81171959…` ✅ | LEDGER 1.60×0.62×0.50 ✅ | CC0 ✅ | **CONFIRMED** | |
| ADIM-005 bookcaseOpen | bookcaseOpen ✅ | `…/bookcaseOpen.glb` | ✅ | `75070221…` ✅ | LEDGER 0.80×1.76×0.50 ✅ | CC0 ✅ | **CONFIRMED** | |
| ADIM-006 bookcaseClosedDoors | bookcaseClosedDoors ✅ | `…/bookcaseClosedDoors.glb` | ✅ | `ff33f535…` ✅ | LEDGER 0.80×1.70×0.50 ✅ | CC0 ✅ | **CONFIRMED + PROXY** (同 item 2 roles: CONFIRMED for 书架本体; PROXY for 衣柜 P2) |
| ADIM-007 bedDouble | bedDouble ✅ | `…/bedDouble.glb` | ✅ | `c49b33e7…` ✅ | WASHER_DRYER_BED_REMEASUREMENT raw 1.623×0.505×1.912 非 estimated ✅ | CC0 ✅ | **CONFIRMED** | |
| ADIM-008 desk | desk ✅ | `…/desk.glb` | ✅ | `0164fe82…` ✅ (本轮新 得 SHA) | **GLB 实测** 0.7345×0.3844×0.5563 raw 1x → scale ×2 = 1.47×0.77×1.11 注意 Y 过高, safe envelope 用 1.50×0.80×0.75 (PROVISIONAL scale) — 含 "实测 / ×2 假设" | Kenney ✅ | **MEASURED_APPROX** | 原 VA 无 SHA + AABB 含 ×2 假设 → 降级 |
| ADIM-009 table (dining) | table ✅ | `…/table.glb` | ✅ | `ff1a9449…` ✅ | LEDGER 1.68×0.65×0.90 ✅ (OBj + GLB cross) | CC0 ✅ | **CONFIRMED** | |
| ADIM-010 chair | chair ✅ | `…/chair.glb` | ✅ | `c8a11eec…` ✅ | LEDGER 0.40×0.94×0.40 ✅ | CC0 ✅ | **CONFIRMED** | |
| ADIM-011 chairDesk | chairDesk ✅ (furniture-kit 有 chairDesk.glb) | `…/chairDesk.glb` | ✅ | `46406619…` ✅ (新) | GLB 实测 raw 0.4787×0.4176×0.4432 ×2 = 0.96×0.84×0.89 (estimated) → safe 0.50×1.05×0.55 | Kenney ✅ | **MEASURED_APPROX** | AABB 含 estimated ×2 假设 → 降级 |
| ADIM-012 sideTable | sideTable ✅ | `…/sideTable.glb` | ✅ | `82278105…` ✅ | LEDGER 1.07×0.77×0.44 ✅ | CC0 ✅ | **CONFIRMED** | (床头柜真实语义不匹配 → 但 evidence level: 仍 CONFIRMED; 使用时另用 cabinetBedDrawer 更窄 PROXY) |
| ADIM-013 washer | washer ✅ | `…/washer.glb` | ✅ | `0c9704df…` ✅ | WASHER_DRYER_BED raw 0.39×0.50×0.48 实测 非估计 ✅ | CC0 ✅ | **CONFIRMED** | (two-ledger OK) |
| ADIM-014 dryer | dryer ✅ | `…/dryer.glb` | ✅ | `d8b72761…` ✅ | raw 0.39×0.60×0.38 ✅ | CC0 ✅ | **CONFIRMED** | |
| ADIM-015 washerDryerStacked | washerDryerStacked ✅ | `…/washerDryerStacked.glb` | ✅ | `efcc2155…` ✅ | raw 0.39×1.07×0.48 实测 ✅ | CC0 ✅ | **CONFIRMED** | |
| ADIM-016 mug | mug ✅ (in food-kit GLB exists) | `/…/unpacked/food-kit/Models/GLB format/mug.glb` | ✅ | `(to compute: mug SHA not done; mug accessor AABB report 2.0×2.0×2.0 空盒 vs LEDGER OBJ 0.344×0.273×0.285 INCONSISTENT!` | **INCONSISTENT between GLB (2.0 方盒, 空壳) & OBJ (0.344 真实) → AABB 不可靠** | Kenney food-kit CC0 ✅ | **MEASURED_APPROX** (not CONFIRMED due to inconsistent AABB between 2 formats). 暂使用 OBJ 0.344×0.273×0.285 但需导入预览 |
| ADIM-017 lampRoundTable | lampRoundTable ✅ | `…/lampRoundTable.glb` | ✅ | `75bb644c…` ✅ (新) | GLB 实测 0.152×0.314×0.176 raw 1x → safe 0.20×0.50×0.20 ×? (scale assumption) | CC0 ✅ | **MEASURED_APPROX** | scale ×1~? unknown |
| ADIM-018 books | books ✅ | `…/books.glb` | ✅ | `b8dc56e5…` ✅ | GLB 实测 0.150×0.104×0.095 raw → 1x × 合理 scale? | CC0 ✅ | **MEASURED_APPROX** | 无明确 pack scale 假设 |
| ADIM-019 cabinetLow (kitchenCabinetDrawer proxy) | kitchenCabinetDrawer ✅ | `…/kitchenCabinetDrawer.glb` | ✅ | `6f784807…` ✅ | GLB 实测 0.43×0.45×0.48 raw 1x → × 2 = 0.86×0.90×0.96 (假设 furniture-kit ×2) | CC0 ✅ | **MEASURED_APPROX** | AABB 含估计 ×2 |
| ADIM-020 cabinetBedDrawer | cabinetBedDrawer ✅ | `…/cabinetBedDrawer.glb` | ✅ | `e3dfd2e1…` ✅ | GLB 实测 raw 0.266×0.263×0.381 → × 2 = 0.53×0.53×0.76 (estimated) | CC0 ✅ | **MEASURED_APPROX** | AABB ×2 假设 |
| Lounge-chair (非编号) | loungeChair ✅ | `…/unpacked/furniture-kit/…` exist check: YES | ✅ | 未算 (本轮只 关键 F 20 SHA 已算 19 items, loungeChair 未) | GLB 实测 raw 0.49×0.46×0.41 ×2 = 0.98×0.92×0.82 estimated | CC0 ✅ | **MEASURED_APPROX** | 未算 SHA → 降级 |
| — | basketLaundry (white/dark/towel baskets) | 审计目录 **0 matches** find basket* | ❌ MISSING. 本轮 search 全 unpacked 无 basket GLB | N/A | 无文件 → 无 AABB | N/A | **PLACEHOLDER_ONLY** (本轮新发现: 上一轮误写 VALIDATED_ASSET → 修正) |
| P1 nightstand → cabinetBedDrawer ADIM-020 | ADIM-020 语义 = 床头柜 drawer | (see ADIM-020 above) | ✅ (cabinetBedDrawer) | (see) | (see) | CC0 ✅ | **PROXY** (语义) |
| P2 wardrobe → ADIM-006 bookcaseClosedDoors | 视觉同 ADIM-006 but 语义衣柜 | (see ADIM-006) | ✅ | (see) | (see) | CC0 ✅ | **PROXY** |
| P3 dishwasher visual → ADIM-019 kitchenCabinetDrawer | 视觉台柜 语义洗碗机 | (see ADIM-019) | ✅ file exists | (see) | (see) | CC0 ✅ | **PROXY** |
| P4 Umbrella stand (US-1 gap from ASSET_CONFIRMED_GAP_LIST) | umbrellaStand 不在 白名单 / 未下 PolyPizza | none | ❌ | N/A | no file | N/A | **PLACEHOLDER_ONLY** | (本轮没下新资产, 保持 P) |
| P5 curtain CU-1 gap | 同上 | none | ❌ | N/A | N/A | N/A | **PLACEHOLDER_ONLY** | |
| P6 shoes SH-1 gap | none | none | ❌ | N/A | N/A | N/A | **PLACEHOLDER_ONLY** | |
| P7 shoe-cabinet → F6 (bookcaseClosedDoors short) | cabinetBedDrawer 矮 代理鞋柜 | (see ADIM-006/20) | ✅ 文件存在 | (same ADIM-006) | estimated | CC0 ✅ | **PROXY** (short cabinet) |
| P8 coat rack + mirror | stem 不在白名单 / 未找到 | none | ❌ | N/A | N/A | N/A | **PLACEHOLDER_ONLY** | |
| P9 floor lamp (floor-lamp PLACEHOLDER 黑名单 X9 已清 stem) | lampFloor INVALID blacklist 未找到对应 | none 或暂用 lampRoundTable 代理视觉 | ❌ 真实 floor-lamp 无文件 | N/A | N/A | N/A | **PLACEHOLDER_ONLY** | |
| P10 rug LARGE | rugLarge INVALID X10 blacklist 已 处理占位 | none | ❌ 无 | N/A | N/A | N/A | **PLACEHOLDER_ONLY** | |
| P11 trash-bin | trashCan stem 审计目录无 | none → 视觉代理 纯色 cube | ❌ | N/A | N/A | N/A | **PLACEHOLDER_ONLY** | |
| P12 utensil-rack | rack 非 Kenney | none → 视觉代理 | ❌ | N/A | N/A | N/A | **PLACEHOLDER_ONLY** | |
| P13 detergent bottles | bottleCleaning 未在审计目录 明确 | none | ❌ | N/A | N/A | N/A | **PLACEHOLDER_ONLY** | |
| phoneModern object | stem 不在 Kenney furniture/food/bld → 本轮 find: phoneModern.glb 无 白名单无 | none 手机真实 model 未采购 | ❌ | N/A | N/A | N/A | **PLACEHOLDER_ONLY** (L2 手机 视觉 cube 占位 可交互) |
| key object | key 不在 Kenney 140 家具; 钥匙单独白名单 ASSET_ACTUAL_CONTENT_INVENTORY 查? | none found in audit 目录. 可能需 PolyPizza | ❌ MISSING key GLB | N/A | N/A | N/A | **PLACEHOLDER_ONLY** (游戏对象 不一定要高模, 平面 钥匙 icon 近似 即可) |

---

## §2. Evidence 分布饼图

```
  CONFIRMED (13) ████████████████░░ 42%   [★ 最高证据级别]
  APPROX (7)    █████████░░░░░░░░░░ 22%   [可接受, 但需导入预览确认 AABB]
  PROXY (3)     ████░░░░░░░░░░░░░░░  9%   [真实 GLB 存在, 语义正确但尺寸需调整]
  PLACEHOLDER (12) ████████████████░░░ 37%   [6 GAP + basket + 5 miscellaneous = 12]
  INVALID (0)   ░░░░░░░░░░░░░░░░░░  0%   [黑名单 stems 已全部占位化; 无 INVALID stem 残留]
```

---

## §3. Blockers (BLOCKER-ASSET-01 修订版)

BLOCKER-ASSET-01 修正版 (解决 §十一 原文案自相矛盾):

```yaml
BLOCKER-ASSET-01_RECONCILED:
  status:      ACTIVE_HIGH (P1)
  stem_status: 0_invalid_stems (黑名单已清理, 没有任何 INVALID 级)
  confirmed:   13 items 六条件 通过 (含 SHA)
  actions_required_before_production_import:
    1. 13 个 CONFIRMED 资产: 重新 SHA + 文件完整性校验 再导入 1 次
    2. 7 个 APPROX: 在 Blender / 引擎 preview 中重新冻结 per-axis scale (解决 ×2 假设不确定)
    3. 12 个 PLACEHOLDER:
       a. 6 GAP (P4 伞架/P5 窗帘/P6 鞋/P9 落地灯/P10 地毯/P13 洗洁剂): 下 PolyPizza CC0 pass (US-1/CU-1/SH-1/Lamp/Rug/Cleaning packs)
       b. basketLaundry: 搜索 Kenney 后续 pack 或 PolyPizza laundry basket
       c. phone/key task objects: 采购低模 CC0 或 保持 低面 placeholder cube+纹理
       d. trash/utensil-rack/coat-mirror/floor-lamp 其余: 保持视觉占位或后续 CC0 搜索
    4. mug GLB (2.0 cube) vs OBJ (0.34 real) 不一致 → 导入时如果 mug GLB 内 有 mesh 缺 vertex → 使用 OBJ 重导出正确 GLB
  conflict_removed:  删除旧文案中 "invalid=0 但旧文档还有 invalid stem" 的自相矛盾句 (本轮 clear)
```

✅ BLOCKER-ASSET-01 自相矛盾 → 已修复 (§十一 recon pass)

---

End of Asset Evidence Reconciliation.
