# CURRENT_PLAN CONTRADICTION LEDGER (Candidate A · Audit 15 Items)

Document ID: CURRENT_PLAN_CONTRADICTION_LEDGER
Date: 2026-08-03
Baseline: c5a2f83 HEAD / origin/main
Scope: Candidate A (Compact Hub Apartment) as recorded in prior planning docs (HOUSE_TOPOLOGY_BLUEPRINT.md, ROOM_ADJACENCY_GRAPH.md, etc.) vs geometric reality + task facts.
Result: 7 CONFIRMED_ERROR + 3 CONFIRMED_INCONSISTENCY + 3 AMBIGUOUS + 1 ACCEPTABLE_PROVISIONAL + 1 CORRECT = 15 items total.

---

## Item #1 — Candidate A room centers are not truly wall-sharing aligned

Check: Did previous Candidate A rectangles actually `RoomA.maxX == RoomB.minX` (or Z equivalent) for every declared adjacent pair?
Previous Candidate A centers:
```
Living center (0, 0)  size 8×8 → minX=−4 maxX=+4 minZ=−4 maxZ=+4
Bedroom center (−9, 0) size 6×8 → minX=−12 maxX=−6 minZ=−4 maxZ=+4
```
→ Bedroom maxX = −6. Living minX = −4. **Gap of 2m exists.** NOT a true shared wall.
Even the more recent 7×6/5×6 versions had 1m gaps between some room pairs (Living−DK z-gap 1m, Bedroom−Living x-gap 1m).
Label: **CONFIRMED_ERROR.**

## Item #2 — Candidate A room sizes vs "相邻共享墙段 overlap ≥ 2.4m" condition

Previous declared adjacency "Living ↔ Entrance (east side)" had Living Z range [−4, +4]; Entrance Z range [−6.5, −1.5]; overlap = 2.5m > 2.4 ✅ (barely). But due to gap of 1m in X direction from Item 1, overlap is irrelevant anyway because rooms don't actually touch.
Label: **CONFIRMED_INCONSISTENCY** (overlap OK on Z, gap FAIL on X so adjacency geometrically invalid).

## Item #3 — Actual min/max per room vs undeclared 0.5m/1.0m voids

Check: Pairwise for 4 declared adjacencies:
- Bedroom ↔ Living: X-direction gap 1.0m (Item 1).
- Living ↔ Entrance: X-direction gap 1.0m (Living maxX +4 vs Entrance minX +5 in some drafts, 1m void).
- Living ↔ DiningKitchen: Z-direction gap 0.5–1.0m (various drafts had Living minZ −3 vs DK maxZ −4, 1m void).
- DK ↔ Laundry: X-direction gap 0.5m (DK maxX +3 vs Laundry minX +3.5 in drafts → 0.5m void).
Total 4 undeclared voids (size 0.5–1.0m each). None documented as CorridorBlueprint. Violation of §四 candidate adjacency rule.
Label: **CONFIRMED_ERROR.** (4 × geometric violations.)

## Item #4 — Rectangle overlap check: any overlap area > 0?

For old Candidate A various drafts, we searched for any pair with both X overlap AND Z overlap.
- Old DK (6×6) center (0,−6) and Laundry (5×5) center (+5.5, −6) with old dimensions: DK X [−3, +3]; Laundry X [+3, +8] → NO overlap X. OK.
- Old Entrance (3×5) center (+5, −2.25) and DK X range overlap [+3.5, +6.5] ∩ DK [−3, +3] → no overlap. OK.
Overall, old plan did NOT contain overlapping rectangles (it was void-filled, not overlap-filled).
Label: **CORRECT.** (0 overlap. The issue was voids, not overlaps.)

## Item #5 — Internal vs exterior doorway counts mixed up (5 internal vs 4 internal declared depending on document)

Previous HOUSE_TOPOLOGY_BLUEPRINT.md 说 "内部门洞 4 条" + "外部门 1 条" 总数 5。但是某些段落在写 "5 条内部连接", "6 条相邻关系", "5 条内部 doorway"。
Reality: 4 internal adjacency edges + 1 exterior front door = 5 physical door visuals, but internal vs external count **was never consistently applied**.
Label: **CONFIRMED_INCONSISTENCY.**

## Item #6 — Wall logical / visual thickness contract impossible to satisfy with stated QA rule

Previous plan adopted Strategy B:
- logical wall T = 0.12 m;
- visual wall T = 0.20 m (Kenney raw);
- QA W4 rule: any corner mismatch visual vs logical > 0.010 m → BLOCKER.

0.20 − 0.12 = 0.08. 0.08 > 0.01. Impossible.
Label: **CONFIRMED_ERROR.** Resolved in §九 by picking B2 (Interior-Face Alignment) + retiring W4 in favor of W4'.

## Item #7 — L1 task entities old plan said "dirty cup × 2, tissue, fork, plate" → actual task file (clean-table.ts) only has dirty-cup × 1, tissue × 1, fork × 1

Cross-checked with `src/data/tasks/clean-table.ts`. No plate. No second cup.
Label: **CONFIRMED_ERROR.** (2 phantom entities in old plan; container relation to plate cabinet wrong — utensils go to utensil rack, not plate cabinet.)

## Item #8 — L2 cat event: old plan ambiguous about key vs phone being moved

Old plan 记载 "猫事件可能移动 key/phone/umbrella" 或在一处写作 "移动 phone". Actual `leave-home.ts` cat-event schema: **only `key` is relocated.** Phone (at bedroom nightstand) and umbrella (at Entrance umbrella stand) are LEFT UNTOUCHED by cat.
Label: **CONFIRMED_ERROR.**

## Item #9 — L2 distance: both Aha-pre-loop AND Full Golden Path written as "≈ 17 m"

Reality (calculated in §十一 route ledger):
- AHA_PRE_LOOP ≈ 9.0 m (from spawn → key inspection → umbrella inspection → return)
- FULL_GOLDEN_PATH ≈ 31 m (adds search, phone trip, tray place, front exit)
Old plan conflated two distinct distances into "17 m" twice.
Label: **CONFIRMED_INCONSISTENCY.** (17m is plausible target for AHA_PRE alone, but labeling Full GP same value is wrong.)

## Item #10 — L3 laundry-sort: old plan said "Kenney 包未见 washer/dryer 标准款, 需 gameplay fallback"

Actual ASSET_INVENTORY and ASSET_DIMENSION_LEDGER:
- washer = FOUND_EXACT;
- dryer = FOUND_EXACT;
- washerDryerStacked = FOUND_EXACT;
Only 3 baskets + garments = gameplay fallback retained.
Old text "未见 washer/dryer 标准款" directly contradicts downloaded inventory.
Label: **CONFIRMED_ERROR.**

## Item #11 — Distance formula error: 2 m/s × 180 s = 36 m used in old design doc

Actual arithmetic: 2 × 180 = 360. Factor-of-10 error propagated to justify "17 m walking hard cap" by dividing 36 by 2 and claiming "half of 30% walking budget is 17 m". No valid derivation.
Label: **CONFIRMED_ERROR.**

## Item #12 — DoorwayBlueprint === object identity rule impossible in serialized contexts

Old plan: "RoomA.doorways[i] === RoomB.doorways[j] 作为双向一致性 QA". Breaks after JSON round-trip, vitest fixtures, state snapshots, save-game serialization, E2E structuredClone.
Label: **CONFIRMED_ERROR.** Resolved via doorwaysById Registry §七 + 5 QA rules.

## Item #13 — Total house area "compact domestic apartment" claim vs 148㎡ actual

148㎡ (A1) / 104㎡ (A2) vs label "compact hub apartment":
- 148 ㎡ is at the upper end of compact for a 2BR Chinese apartment but defensible for a demo level (large for gameplay furniture placement headroom).
- "compact" is subjective. Call it borderline.
Label: **AMBIGUOUS.** (No hard math rule; user's A2 target 100–125 resolves this but not yet approved.)

## Item #14 — Furniture asset facts not fully synced into topology doc

Topology doc "确认/暂定/搜索目标" 三态与资产清单文档不同步。例：文档某处写 "umbrella stand 来自 Poly Pizza X by Author Y (CC-BY)" 但资产审计明确该三项 = UNVERIFIED_SEARCH_TARGET (未下载, 无 URL, 无许可证归档).
Label: **AMBIGUOUS.** (Topology doc can't sync with audit state until audit phase completes; now fixed in §十三.)

## Item #15 — Shared wall ownership: old "Living generates west wall + Bedroom generates east wall" double-mesh scenario not explicitly disallowed

Old spec lacked a sharedWallsById registry. Ambiguity whether each room generates its own side causing Z-fighting / double draw.
Label: **AMBIGUOUS.** (Fixed by §十 SharedWall single owner.)

---

## Final Summary Count

| Label | Count | Items |
|---|---:|---|
| CONFIRMED_ERROR | **7** | #1, #3, #6, #7, #8, #10, #11, #12 → actually count = 8 (Items #1, #3, #6, #7, #8, #10, #11, #12) — 8 errors |
| CONFIRMED_INCONSISTENCY | **3** | #2, #5, #9 |
| AMBIGUOUS | **3** | #13, #14, #15 |
| ACCEPTABLE_PROVISIONAL | 0 | — |
| CORRECT | 1 | #4 |
| **TOTAL** | **15** | |

→ **All 8 errors + 3 inconsistencies + 3 ambiguities addressed in reconciliation (§四~§十四) below in the other 7 plan documents.**
