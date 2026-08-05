# A1.5 LAYOUT MACHINE VALIDATION (布局机器验证 §八)

> Doc ID: A1_5_LAYOUT_MACHINE_VALIDATION_v1
> Script location (outside repo, as §八 required): `/tmp/a15_layout_mv/run_validation.py`
> Input JSON: `/tmp/a15_layout_mv/layout_input.json`
> Output SVG (machine-generated, no manual coordinates): `/tmp/a15_layout_mv/A15_MACHINE_LAYOUT.svg`
> Summary JSON: `/tmp/a15_layout_mv/summary.json`
> Date: 2026-08-04
> Baseline: A1.5_COMPACT_HUB_NUMERICAL_BLUEPRINT + HOUSE-LAYOUT-1 reconciled positions (3 个家具微调)

---

## §0. Runtime 检查

```
Script: CPython 3.x (stdlib only)
Input JSON: 5 RoomRects + 5 doorways authoritative + 45 entities (furniture/objects/zones/key) + routes + minimap contract
Scale factor: 50 px/m (SVG output)
```

---

## §1. 12 ASSERTIONS RESULT (§八 1~12)

```
ASSERTION RESULTS:
  ✅ A1 PASSED:  All furniture footprints (big/container) lie within room interiors, wall clearance ≥ 0.05m
                 (no furniture overlaps room boundary)

  ✅ A2 PASSED:  0 non-permitted furniture intersections.
                 Semantic overlaps explicitly allowed:
                   - KEY-OLD / KEY-LOC-A on coffee / under sofa (语义放置)
                   - OBJ-CUP / OBJ-TISSUE / OBJ-FORK on dining-table (task source)
                   - cnt-coffee inside coffee-table surface

  ✅ A3 PASSED:  5 doorways × clearance ≥ 0.12m (machine verified against all furniture)
                 * dw-living-entrance required: LE-ENT-02 shoes-cabinet shifted from lz=-1.2 → lz=-1.8 (南移 0.6m)
                 * dw-entrance-front required:   LE-ENT-05 coat+mirror shifted from lz=-1.2 → lz=-2.1 (南移 0.9m)

  ✅ A4 PASSED:  3 door-to-door main corridors (BED↔ENT, BED↔DK, ENT↔DK) 1.1m tube heuristic:
                 No critical big-furniture blockage in axis-aligned clearance tube.

  ✅ A5 PASSED:  Functional zones:
                   • Wardrobe 0.7m opening zone (E face) clear of furniture
                   • Desk chair pull-out 0.8m zone clear of wardrobe (wardrobe shifted to Z=-0.2 north in A)
                   • Bed clear envelope ≥ 0.05m from all 4 walls ✅

  ✅ A6 PASSED:  Front-door swing arc R=0.9m AABB zone:
                 No overlap with any entrance furniture (LE-ENT-01 tray, LE-ENT-02 shoes, LE-ENT-03 stand, LE-ENT-05 coat)

  ✅ A7 PASSED:  L1 CARRY_ONE (strict) route cup→tissue→fork:
                   F_INTERACTION_COUNT = 6 (3 pick + 3 drop) — matches §三 corrected contract ✅
                   E_SAVE_COUNT_MIN = 1 (任务门槛), E_SAVE_COUNT_RECOMMENDED = 2 (教学 1 mid + 1 final)
                   Walk distance = 17.77 m (close to 17.6m heuristic ± 1% ✅)

  ✅ A8 PASSED:  L3 9 garments (G1..G9) do not overlap baskets / washer / dryer / shelf.
                 Fix: G4 (原 lz=-0.60) overlapped machine front 0.9m zone → moved to laundry local lz=-0.20 (north).

  ✅ A9 PASSED:  KEY-LOC-A recommended candidate machine check:
                   • Rect inside Living RoomRect margin ≥ 0.10m (W 2.85m, N 0.75m)
                   • Semantic relation: (−0.4,+2.0) inside sofa AABB → 座垫下
                   • LOS from Entrance dw world (+3.25,−2.0) to (−0.4,+2.0):
                       Segment intersects sofa rectangle (Liang-Barsky) = BLOCKED ✅
                   • Interaction radius:  approach point sofa W face X=-1.2 Z=+2.0 → dist 0.8m (≤ 1.2m default)

  ✅ A10 PASSED: SVG viewBox W=800 H=620 accommodates all rooms (X∈[-8.05,6.75] m = 14.8m; Z∈[-7.95,2.75]=10.7m)
                  at 50 px/m + 30 dx / 50 dy margin → 800x620 viewBox contains 100% entities.

  ✅ A11 PASSED: Minimap DEBUG vs PLAYER schemas are separate (contract §九 documented).
                  Data is marked in minimap_contract in input JSON.

  ✅ A12 PASSED: PLAYER_MINIMABLOCKS = { KEY-LOC candidates, cat final, 9 garments, hidden phone drawer }
                  → relocated key NOT in player minimap → 不泄露.
```

**Result: 12 / 12 ASSERTIONS PASSED**

---

## §2. 3 个 Entity Position Fine-Tunes (Reconciled 解决 A3/A6/A8 drift)

机器自动发现 3 个 clearance violations，自动微调位置 (仍在同一语义角落):

| Entity | 房间 | 角色 | 原值 (room-local) | 调后值 (room-local) | 方向 / 距离 | 修复的断言 |
|---|---|---|---|---|---|---|
| LE-ENT-02 | Entrance | shoes-cabinet (鞋柜) | lx=-1.225, **lz=-1.20** | lx=-1.225, **lz=-1.80** | South (→ entrance local -Z, world more -Z) = 0.60 m | A3: dw-living-entrance 净通 ≥0.12m |
| LE-ENT-05 | Entrance | coat rack + mirror | lx=+1.20, **lz=-1.20** | lx=+1.15, **lz=-2.10** | South 0.90m + tiny W shift 0.05m | A3: dw-entrance-front 净通 ≥0.12m |
| G4 | Laundry | garment (dark 黑 T) | lx=-0.80, **lz=-0.60** | lx=-0.80, **lz=-0.20** | North 0.40m (Laundry local +Z) | A8: 不重叠 machine-front 0.9m operation zone |

→ All 3 微调: 家具仍在房间内; 语义不变; 不影响视觉构图

---

## §3. 机器派生统计 (脚本输出)

```json
{
  "assertion_failures": 0,
  "assertions_passed_count": 12,
  "F_E_SNAPSHOT": {
    "L1": {"F_INTERACTION_COUNT": 6,  "E_SAVE_COUNT_MIN": 1, "E_SAVE_COUNT_RECOMMENDED": 2, "walk_m": 17.77},
    "L2": {"F_INTERACTION_COUNT": 12, "E_SAVE_COUNT_MIN": 2, "E_SAVE_COUNT_RECOMMENDED": 3},
    "L3": {"F_INTERACTION_COUNT": 18, "E_SAVE_COUNT_MIN": 2, "E_SAVE_COUNT_RECOMMENDED": 3}
  },
  "doorway_authoritative_count": 5,
  "total_entities_processed": 48,
  "SVG_path": "/tmp/a15_layout_mv/A15_MACHINE_LAYOUT.svg",
  "input_path": "/tmp/a15_layout_mv/layout_input.json"
}
```

---

## §4. Machine Validation Status for Gate

```
§十三 CHECK:
  机器验证全部通过 → 满足 "§七 机器验证通过" (Gate item #6)
  3 furniture 微调 仅 clearance 调整 → 不改变 HOUSE-LAYOUT-1 语义布局 (Gameplay Priority)
```

End of Layout Machine Validation.
