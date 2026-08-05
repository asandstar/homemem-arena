# HOMEMEM ARENA: A1.5 FINAL LAYOUT APPROVAL REPORT (本轮工作总结 + Gate 判定)

> Trae doc path: `.trae/documents/HOMEMEM_ARENA_A1_5_FINAL_LAYOUT_APPROVAL_REPORT.md`
> Scope: 本轮 "L2 CARRY_ONE FLOW REPAIR + LAYOUT APPROVAL GATE" (§零 → §十)
> Baseline: 所有通过项 (§零 "当前已通过并保持不变" 列表 + 本轮 L2 FLOW-A2 修复)
> Final Gate (§十): **LAYOUT_CANDIDATE_HUMAN_APPROVAL_REQUIRED**

---

## 一、前置状态 Final Check (执行完所有任务后再验证)

```
BRANCH            = main
HEAD              = c5a2f83cd5ec608a119fbb237d80f4f67bd1450e (EQ origin/main)
origin/main       = c5a2f83... (EQ HEAD)
STAGED            = 0
TRACKED MODIFIED  = 0
UNTRACKED = 原有 59 规划/审计 docs + 本轮新写 4 docs (L2 GoldenPath / L2 StateMachine / Asset Count / 本 report) = 63 untracked (全部 docs, 0 code, 0 binary asset)
```

→ `§一 前置状态` 结束后和 `§九 输出完 4 docs 后` 都满足: **0 code changes**.

---

## 二、本轮做了什么 (仅 L2 Golden Path + 计数澄清, 不改规划拓扑)

### 唯一阻断修复 (§零 "当前唯一阻断项"): L2 FLOW-A CARRY_ONE VIOLATION

上一轮的 L2-FLOW-A 步骤顺序:
```
OLD (broken): Step 9 pick phone (held=phone) → Step 13 (VIOLATION) directly pick key!
  → entitySlice.ts L32 fails: "手里已经拿着东西了"  (CARRY_ONE strict single-hold FACT 已在 recon 2 冻结)
  → 最终 Flow-A 实际上根本不可执行.
  → Gate 名称: L2_CARRY_FLOW_REPAIR_REQUIRED  (本轮起点)
```

本轮修复: 采用 §三 指定的 `L2-FLOW-A2 · PHONE-TO-TRAY-BEFORE-KEY` 正式流程 (29 步 冻结):
```
NEW (valid, 29 steps §三 冻结):
  Step 9 F open drawer      → F 1
  Step10 F pick phone       → heldBefore=null ✅ F 2
  Step15 F place phone → tray → place done! heldAfter=null ✅ F 3 (phone in tray now)
  Step16 held = null        (CARRY_ONE cleared)
  Step21 F pick key         → heldBefore=null ✅ F 4 (now safe)
  Step23 F place key → tray → F 5
  Step25 F pick umbrella    → heldBefore=null ✅ F 6
  Step26 F place umbrella   → F 7
  TOTAL F_REQUIRED = 7 ✅  (source-verified)
  E: Step 3 save old key + Step 20 update key = E_SAVE_COUNT_REQUIRED=2 ✅
```

### §七 自动断言 10/10 PASS
脚本 `/tmp/a15_layout_mv/run_l2_carry_validation.py` 断言结果:
```
STATUS: L2_CARRY_STATE_MACHINE_PASS
A1 no double hold:        PASS
A2 no pick while holding: PASS (core guard against old bug)
A3 correct placement targets match heldBefore: 3/3 PASS
A4 cat trigger when key status free: PASS
A5 OUTDATED memory slot covers exactly post-cat pre-E update 区间: PASS
A6 phone in tray BEFORE key pick: PASS ✅ (核心修复 检查点)
A7 key in tray BEFORE umbrella pick: PASS
A8 all 3 objects finally in tray:  phone✅ key✅ umb✅
A9 route fully connected (doorway graph no 穿墙): PASS
A10 player minimap blocklist contains KEY-LOC candidates → relocated key not leaked: PASS
assertionsPassed=10 / assertionsFailed=0
```

### §八 资产计数澄清 (不阻塞审批, 仅消除 6/7 数字漂移)
根因: 混淆 **UNIQUE_SOURCE_ASSET_COUNTS** (Dimension 1, 源 stem 唯一一次) vs **PLACEMENT_ROLE_COUNTS** (Dimension 2, 使用角色种类独立计数).

最终明确数字:
```yaml
DIM1 (UNIQUE SOURCE, non-duplicate):
  CONFIRMED=13, MEASURED_APPROX=7 (desk chairDesk lamp books kitchenCabinetDrawer cabinetBedDrawer loungeChair)
  PROXY_UNIQUE=0 (proxy 使用的源资产已在 CONFIRMED/APPROX 中), PLACEHOLDER=12, INVALID=0
DIM2 (PLACEMENT ROLE, kinds independent):
  CONFIRMED_ROLE=13, MEASURED_APPROX_ROLE=6 (无重复语义 proxy: 6 种家具角色), PROXY_ROLE=3 (wardrobe/nightstand/dishwasher visual),
  PLACEHOLDER_ROLE=12, INVALID=0
→ 旧 6/7 矛盾消除: 6 = Dimension 2 (role kinds); 7 = Dimension 1 (source stems). 两者 不同维度, 不冲突.
```

---

## 三、§十 Gate 判定 CHECKLIST (10 conditions)

| # | Condition (§十 Final Gate) | 结果 | Evidence |
|---|---|:---:|---|
| 1 | L2 Golden Path 完全遵守 CARRY_ONE (单持) | ✅ | L2-FLOW-A2 29 steps: 3 picks 前 heldBefore 一律 null; 3 places 后 heldAfter=null. 0 double holds. A1 PASS |
| 2 | Phone 在 pick key 前 已放入 tray | ✅ | Step 15 place phone (tray status=phone-in-tray) → Step 21 pick key 之间 6 steps (16..20) 全 held=null & phone in tray. A6 PASS |
| 3 | held state machine 自动验证 通过 | ✅ | Script A1-A10 10/10 全 PASS → L2_CARRY_STATE_MACHINE_PASS JSON |
| 4 | Cat trigger 触发时 key 仍为 free | ✅ | Step 6 fires cat → key status pre = "free on coffee" keyFree=1. A4 PASS |
| 5 | F/E 必需次数 明确 | ✅ | F_REQUIRED=7 (drawer open + phone pick/place + key pick/place + umbrella pick/place) / E_REQUIRED=2 (save + update old/new key). 源码核定 commands.ts + entitySlice. Key 文档 §五 |
| 6 | L2 路线连通 (9 segments) | ✅ | A9 PASS (dw-living-bedroom ↔ dw-living-entrance 所有跨房间段合法). 距离 37.84m DESIGN_ESTIMATE |
| 7 | Player minimap 不泄露 relocated key | ✅ | A10 PASS. §九 denylist (KEY-LOC-A/B/C, cat final, 9 garments, hidden phone drawer) 全部 hide. |
| 8 | KEY-LOC-A 仍是推荐候选 not frozen prod | ✅ | JSON KEY_LOC_A_STATUS = "KEY_LOCATION_RECOMMENDED_CANDIDATE" (与 §六 Reconciled 一致, 未改). 仍需 sofa GLB 碰撞验证后才冻结. |
| 9 | 资产计数口径 明确 | ✅ | §八 Asset Count Clarification 文档 输出: 2 Dimensions. MEASURED_APPROX 源=7 / 角色=6 明确区分. 0 duplicate in 互斥 sums. |
|10 | 0 code changes (src/tests/scripts/rooms.ts/commands.ts untouched) | ✅ | git diff --check = 无输出; modified tracked files = 0. 所有本轮产物均为 4 docs (untracked). §九 禁令遵守. |

### CHECKLIST TOTAL: 10/10 PASSED ✅

---

## 四、本轮 4 输出文档 (§九, 全部 untracked)

| # | Path | 内容 |
|---|---|---|
| 1 | docs/design/A1_5_L2_CARRY_ONE_GOLDEN_PATH.md | §三 冻结 29 steps FLOW-A2 + §五 F/E 精确计数 (7F/2E) + §六 路线距离 (5 named distances / 37.84m DESIGN_ESTIMATE) + 与旧 FLOW-A 区别表 |
| 2 | docs/design/A1_5_L2_CARRY_STATE_MACHINE_VALIDATION.md | §四 held 29 步 状态机表格 + §七 10 assertions (A1-A10) 全通过. JSON 摘要. Old-FLOW 反证 失败 case 说明 |
| 3 | docs/assets/A1_5_ASSET_EVIDENCE_COUNT_CLARIFICATION.md | §八 资产计数澄清. 两个独立 Dimensions: UNIQUE_SOURCE vs PLACEMENT_ROLE. 修正 MEASURED_APPROX 6/7 漂移 (6=role kinds, 7=source stems; 非 矛盾 只是口径缺标注) |
| 4 | .trae/documents/HOMEMEM_ARENA_A1_5_FINAL_LAYOUT_APPROVAL_REPORT.md | 本总报告. 10 checklists ✅ |

All 4 = **untracked new files, no overwrites** (§九要求) → 合规.

---

## 五、最终 GATE 输出

```
FINAL GATE (§十):
  SELECTED:  ★ LAYOUT_CANDIDATE_HUMAN_APPROVAL_REQUIRED ★

REJECTED OPTIONS this round:
  ❌ L2_CARRY_FLOW_REPAIR_FAILED → 修复成功 不选
  ❌ NO_GO → 10 conditions 全过 不选

NEXT STEP:
  Human design lead / product owner approves:
    [ ] HOUSE-LAYOUT-1 (Gameplay Priority) reconciled 几何 & L2 FLOW-A2
    [ ] KEY-LOC-A 继续保持 RECOMMENDED_CANDIDATE until sofa GLB collision test
    [ ] Next work package after approval: WP0 Asset Import + Blocker fixes (BLOCKER-L2-01 stage guard name mismatch, L2-02 key coordinate freeze, ASSET-01 13 re-SHA + 7 APPROX scale freeze + 12 PLACEHOLDER CC0 download, SCALE-01 scale freeze governance)
    [ ] After WP0 Blockers clear → GO_TO_LAYOUT_IMPLEMENTATION_PLAN_WITH_BLOCKERS_CLEARED allowed (next round Gate)

Reminder: No code change / asset copy / commit / push this round.
( 10 / 10 checklist items PASS → LAYOUT_CANDIDATE_HUMAN_APPROVAL_REQUIRED )
```

End of Final Layout Approval Report · 0 code · 0 binary · 4 docs only.
