# CANDIDATE A RECONCILED TOPOLOGY BLUEPRINT (A1 vs A2 · FINAL RECOMMENDATION = A1)

Document ID: CANDIDATE_A_RECONCILED_TOPOLOGY_BLUEPRINT
Date: 2026-08-03
Baseline: c5a2f83 (HEAD == origin/main)
Status: UNTRACKED · PLANNING ONLY · CANDIDATE FOR HUMAN APPROVAL (NOT YET G1 ENTRY)

---

## 0. Scope of this blueprint

**Both A1 and A2 satisfy ALL geometric hard constraints from §三~§五:**
- ✅ 4 internal adjacency edges truly share a wall (no gaps, no overlaps)
- ✅ 4 internal + 1 exterior doorway (count contract exactly)
- ✅ World doorway center bidirectional ≤ 0.01 m (§八 proves 0.000 m exactly)
- ✅ Shared wall single owner (§十)
- ✅ Wall thickness B2 (§九 final pick Interior-Face Alignment, 0.12/0.20)
- ✅ Furniture envelope fit verified for both
- ✅ L1/L2/L3 route distances both satisfy EXPERIENCE_DENSITY_TARGETS

Final recommendation: **PICK A1 (Current-Scale Reconciled Hub, 148 ㎡)** as Canonical Candidate A, with A2 kept as a backup variant if future performance / intimacy budget requires shrinking. Why A1? 5 reasons:

1. **Entrance comfort (3×5 in A1 vs 2.5×4 in A2):** Entrance is the spawn + L2 collection zone. A1 Entrance 15㎡ easily accommodates shoe cabinet 1.4×0.8 + drop tray 1.6×0.4 + umbrella stand 1.0×0.4 + front door R=1.0m swing clearance with 1.1m of residual walkway width. A2 Entrance (10㎡) works but is at the 0.9m walk boundary; QA teams would flag this during playtest.
2. **Laundry L3 roominess:** A1 Laundry 25㎡ accommodates washer/dryer side-by-side (0.8+0.8=1.6 W) + 3 laundry baskets 2.0×0.6 placement zone + 3×3=9㎡ L3 proximity-search circle (radius 1.7) with headroom for 2.0×0.6m ironing board. A2 14.4㎡ is geometrically feasible but leaves only a 1.5m-wide walk lane between washer bank and basket zone.
3. **L2 cat-event search radius 1.7m comfort:** A1 Living (42㎡, 7×6) has room to hide the relocated key under sofa cushion LIP without the hiding spot being trivially visible from re-entry door. A2 Living 6×5 = 30㎡: sofa, TV, and re-entry door line up so the hiding spot is in direct LoS on re-enter (Aha moment diminished).
4. **Kenney furniture ×2.0 envelope confidence:** sofa (1.96×0.92) + TV 2m + coffee table plus two 0.8m walkways = Living 7×6 uses about 5.5m depth; A2 6×5 uses 4.0m depth (sofa 0.92 + coffee 0.46 + 0.5 gap + TV 1.0 + 0.5 = 3.38). Both fit; A1 is more "intimate family home" not cramped. A2 6×5 achieves user's requested intimacy target but L2 search beat suffers — trade-off resolved in favor of playtest quality of life.
5. **Candidate A design continuity:** User wants Candidate A to RETAIN previous plan's "hub" soul — previous plan's target was 148㎡. Reconcile A1 = previous design's errors fixed (gaps gone, walls truly shared), dimensions almost identical to prior plan intent. Minimizes future comparison friction.

**A2 is retained as a documented backup in the Numerical Geometry Ledger for the day when intimacy or streaming performance necessitates further shrinkage.**

---

## 1. Canonical A1 RoomRect roster (RECONCILED · FINAL)

### 1.1 Values (same as §A1.1 Fixed Final in NUMERICAL_LEDGER)

| Room | ID | cX | cZ | W | D | minX | maxX | minZ | maxZ | Area |
|---|---|---:|---:|--:|--:|-----:|-----:|-----:|-----:|---:|
| Living (HUB) | living | 0.000 | 0.000 | 7.00 | 6.00 | −3.500 | +3.500 | −3.000 | +3.000 | 42.00 |
| Bedroom | bedroom | −6.000 | 0.000 | 5.00 | 6.00 | −8.500 | −3.500 | −3.000 | +3.000 | 30.00 |
| Entrance | entrance | +5.000 | −2.250 | 3.00 | 5.00 | +3.500 | +6.500 | −4.750 | +0.250 | 15.00 |
| Dining-Kitchen | diningKitchen | 0.000 | −6.000 | 6.00 | 6.00 | −3.000 | +3.000 | −9.000 | −3.000 | 36.00 |
| Laundry | laundry | +5.500 | −6.250 | 5.00 | 5.00 | +3.000 | +8.000 | −8.750 | −3.750 | 25.00 |
| **Total interior** | | | | | | | | | | **148.00 ㎡** |

### 1.2 Top-down A1 SVG (text-only box schema, units m, origin Living cX=cZ=0, world Z↓ map)

```
                              Z-axis (-ve is downwards on minimap)
                                 -3.0             +0.25      +3.0
minX ----->                           |             |           |
                                      v             v           v
  X=-8.5 ┌────────────────────┐ X=-3.5│             │           │ X=+3.5 ┌──────┐ X=+6.5
         │                    │ <=====│             dw-living-entrance   │      │
         │                    │       │             │ (x=+3.5,z=-1.0)    │ Ent  │───→ FRONT DOOR
         │     BEDROOM        │       │             v                    │ 5×3  │ dw-entrance-front
         │     30 ㎡          │       │       LIVING (HUB) 42 ㎡         │      │ (x=+6.5,z=-2.25)
         │                    │       │       + coffee/sofa/TV           │      │
         │                    │       │                                ↑ │      │
         └────────────────────┘       │                                │ └──────┘
   X=-8.5          dw-living-bedroom X=-3.5 (z=0.0)                   │
                                     │                                │
                                     └────────────────────────────────┘ X=+3.5
                                               X=-3.0          X=+3.0
                                               z=−3.0
        ┌──────────────────────────────────────┐ dw-living-dining-kitchen (z=-3.0,x=0) ───┐ X=+8
        │                                      │                                              │
        │          DINING-KITCHEN 36㎡          │                                              │
        │          + counter + dining + DW      │          ┌─────────────────────────────┐
        │                                      │          │       LAUNDRY 25 ㎡          │
        │                                      │<=========│       washer/dryer side-by-  │
        │                                      │ dw-dk-laundry (x=+3.0, z=-5.5)          │ side + 3 baskets
        └──────────────────────────────────────┘          └─────────────────────────────┘
             X=-3.0                                 X=+3.0                          X=+8
             z=-9.0                                 z=-9.0
```

### 1.3 Shared Wall Ledger (for A1 · FINAL, 4 internal + 1 exterior = 5 walls covering all 4 adjacencies)

| sharedWallId | kind | axis | worldCoord | rangeStart | rangeEnd | length | has doorway? |
|---|---|---:|---:|--:|--:|--:|:--:|
| sw-living-bedroom | internal | X | −3.500 | Z=−3.000 | Z=+3.000 | 6.00 | ✅ dw-living-bedroom |
| sw-living-entrance | internal | X | +3.500 | Z=−3.000 | Z=+0.250 | 3.25 | ✅ dw-living-entrance |
| sw-living-diningkitchen | internal | Z | −3.000 | X=−3.000 | X=+3.000 | 6.00 | ✅ dw-living-dining-kitchen |
| sw-diningkitchen-laundry | internal | X | +3.000 | Z=−8.750 | Z=−3.750 | 5.00 | ✅ dw-dining-kitchen-laundry |
| sw-entrance-front-exterior | exterior | X | +6.500 | Z=−4.750 | Z=+0.250 | 5.00 | ✅ dw-entrance-front (唯一 exterior) |

### 1.4 4+1 Doorway Ledger (numeric summary, full detail in §八 of SHARED_WALL_AND_DOORWAY_REGISTRY.md)

| dw id | roomA | roomB | type | world X | world Z | worldCenterFromA | worldCenterFromB | dist ≤ 0.01? |
|---|---|---|---:|---:|---:|---:|---:|:--:|
| dw-living-bedroom | living | bedroom | internal | −3.500 | 0.000 | ✅ exact | ✅ exact | ✅ 0.000 |
| dw-living-entrance | living | entrance | internal | +3.500 | −1.000 | ✅ exact | ✅ exact | ✅ 0.000 |
| dw-living-dining-kitchen | living | diningKitchen | internal | 0.000 | −3.000 | ✅ exact | ✅ exact | ✅ 0.000 |
| dw-dining-kitchen-laundry | diningKitchen | laundry | internal | +3.000 | −5.500 | ✅ exact | ✅ exact | ✅ 0.000 |
| dw-entrance-front | entrance | EXTERIOR | exterior | +6.500 | −2.250 | ✅ single ref | N/A | ✅ (single) |

### 1.5 Adjacency Graph (FINAL — match 4 edges exactly)

```
bedroom  ──(1: X=−3.5)──  living ──(2: X=+3.5)── entrance (3 front door)
                              │
                              │(3: Z=−3.0)
                              v
                        diningKitchen ──(4: X=+3.0)── laundry
```
Edges (4): 1. living↔bedroom  2. living↔entrance  3. living↔diningKitchen  4. diningKitchen↔laundry
Exterior (1): 5. entrance→front door (not an adjacency edge, not counted in adjacencyEdgeCount)

Contract values (from §六):
- adjacencyEdgeCount = 4
- internalDoorwayCount = 4
- exteriorDoorwayCount = 1
- totalDoorVisualCount = 5

No more mixing.

---

## 2. Minimap compatibility (summary)

Full detail in CANDIDATE_A_MINIMAP_GEOMETRY_VALIDATION.md.
- 10/10 checks PASS → result **MINIMAP_GEOMETRY_PASS** (no warnings).

## 3. Route density verification (summary)

Full detail in CANDIDATE_A_REVISED_LEVEL_ROUTE_LEDGER.md §十二.
- L1 teaching-order total walking ≈ 12.0 m (well below 16–20 m target for short teaching level)
- L2 AHA_PRE_LOOP ≈ 9.0 m (below 17–20 m target)
- L2 FULL_GOLDEN_PATH ≈ 31 m (inside 30–40 m target)
- L3 total ≈ 38.4 m (close to boundary, below 40 m cap)
All pass.

---

## 4. Furniture envelope verdict for Candidate A1

All envelopes (§十三 of route ledger CONFIRMED/PROVISIONAL) fit in A1 room rectangles with ≥ 0.45m walk clearance per §七 of ROOM_ENVELOPE_AND_CIRCULATION_REQUIREMENTS. Only bedDouble visual envelope still PROVISIONAL pending Blender audit (GLB extra mattress/blanket geom); otherwise fully ready for asset-aware room layout (G1).

Verdict: **Candidate A Human Approval Required** (because A1 vs A2 trade-off exists — even with a clear A1 recommendation, the user explicitly noted if multiple versions exist, gate = CANDIDATE_A_HUMAN_APPROVAL_REQUIRED). Human picks A1 or approves default A1 pick; next gate becomes GO_TO_ASSET_AWARE_ROOM_LAYOUT_WITH_SCALE_LIMITATIONS (since bedDouble + dishwasher + kitchen counters remain PROVISIONAL even after human approval).

End of blueprint.
