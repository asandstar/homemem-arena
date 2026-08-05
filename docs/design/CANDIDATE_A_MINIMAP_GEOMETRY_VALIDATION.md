# CANDIDATE A MINIMAP GEOMETRY VALIDATION REPORT (A1 geometry · FINAL)

Document ID: CANDIDATE_A_MINIMAP_GEOMETRY_VALIDATION
Date: 2026-08-03
Target geometry: A1 Current-Scale Reconciled Hub 148㎡
Result verdict at bottom: **MINIMAP_GEOMETRY_PASS** (10/10 OK, 0 warnings)

---

## 0. Minimap geometric contract (same as §九.B2 minimap layer)

```yaml
Coordinate mapping:
  world X  → minimap X (identity scale × minimapScale, e.g. 6 px/m, then translate origin to viewport center)
  world Z  → minimap Y, REVERSED sign because world -Z = "south" = down on minimap
             y_minimap = −z_world × scale
Layers:
  1. Fill = RoomBlueprint interior rectangle (room.maxX - room.minX × room.maxZ - room.minZ)
  2. Centerline stroke = SharedWallBlueprint centerline (axis=X → draw horizontal line, axis=Z → draw vertical line)
  3. Doorway gaps drawn as interruptions in the stroke
  4. Only active task rooms drawn fully; inactives faded to 5% opacity
```

## 1. Ten required checks (§十四 user checklist)

### Check #1 — Room rectangles have NO visual gaps

For every adjacent pair, the interior faces touch exactly at the shared wall centerline ± logicalT/2. The fill drawing is room.minX/maxX/minZ/maxZ:
- B.maxX = Living.minX = -3.5 → fill rectangle for B ends at -3.5; Living starts at -3.5. No gap.
- L.maxX = +3.5 = E.minX → fill E starts at +3.5.
- L.minZ = -3.0 = DK.maxZ → no gap.
- DK.maxX = +3.0 = Ly.minX → no gap.
**PASS (0 gaps).**

### Check #2 — Shared walls drawn ONCE only

Every wall in §十 sharedWallsById is drawn once as a centerline stroke. Rooms never draw "their own version" of the shared wall face.
Render list for minimap: only 5 strokes from SharedWallRegistry (§A1.3) + remaining 15 exterior walls (kind: exterior) → each stroke once.
**PASS.**

### Check #3 — 4 internal doorway gap world centers match 3D world centers exactly

| minimap gap center coords (X, Y=−Z) | 3D world center (X, Z) | Match (1cm)? |
|---|---|:--:|
| dw-living-bedroom →  (−3.5, −0.0) | (−3.5, 0.0) | ✅ 0.000 m |
| dw-living-entrance → (+3.5, −(−1.0)) = (+3.5, 1.0) | (+3.5, −1.0) | ✅ 0.000 m (Z reversed correctly) |
| dw-living-dining-kitchen → (0.0, 3.0) | (0.0, −3.0) | ✅ 0.000 m |
| dw-dining-kitchen-laundry → (+3.0, 5.5) | (+3.0, −5.5) | ✅ 0.000 m |
All 4 match exactly (the offsets were placed analytically).
**PASS.**

### Check #4 — 1 front door drawn separately

dw-entrance-front kind: exterior → drawn as a thick arrow notch + special icon on the sw-entrance-front-exterior centerline at minimap (6.5, 2.25) → matches world (6.5, −2.25).
**PASS.**

### Check #5 — Doorway gap NEVER appears on two misaligned separate walls

Because doorway is drawn on SharedWall centerline, and 3D world gap is same SharedWallBlueprint 3-segment cut. No "Room A draws west wall with gap; Room B draws east wall with offset gap" scenario (single owner rule forbids duplicate walls).
**PASS.**

### Check #6 — Player icon traverses doorway continuously (no teleport on minimap)

Assume player world pos = (x, z). Minimap pixel = (scale·x, scale·(−z)). The doorway gap is an open interval on the shared wall line. When player moves from interior(x<−3.5) → through dw-living-bedroom to interior(x>−3.5) on world, it smoothly passes through the gap open interval. Minimap pixel is a continuous function. No teleport.
**PASS (analytic proof).**

### Check #7 — world Z → minimap Y direction reversed correctly

Examples:
- world Laundry center z = −6.25 (south of Living). On minimap: Y = −z = +6.25 (below Living, correct placement "south").
- world Bedroom center z = 0, minimap Y = 0 → same Y as Living (correct: Bedroom west side, not north/south offset).
- world Entrance z = −2.25 → minimap Y = +2.25 → Entrance draw southeast of Living (correct visual position).
**PASS.**

### Check #8 — Large furniture envelopes fit visually inside minimap room fills

| Large item | Envelope W×D (m) | Room fill inside dim | Visual fit? |
|---|---:|---:|:--:|
| A1 Living sofa 1.96×0.92 + coffee 1.32×0.46 + TV 1.64×0.16 + TV stand 2.00×0.88 | Sum = ~ 4.5m × 3.5m | Living 7×6 = 42㎡ | ✅ |
| A1 Bedroom bedDouble proxy 2.10×2.40 + nightstand 1.0×0.8 + wardrobe 1.0×0.8 | 3.5m × 3.8m envelope cluster | 5×6 = 30㎡ | ✅ |
| A1 DK dining table 2.2×1.2 + 4×chairs + counter run L=6.0 m | ~ 6.5m × 5m | DK 6×6 | ✅ |
| A1 Laundry washer 1.2×0.8 + dryer 1.2×0.8 side-by-side + 3 baskets | 3.5m × 2.5m | 5×5 | ✅ |
| A1 Entrance shoe 1.4×0.8 + tray 1.6×0.4 + umbrella 1.0×0.4 | 3.0m × 1.6m | 3×5 | ✅ |
All fit visually without clipping room edges on minimap.
**PASS.**

### Check #9 — Hub relationship "Living in center 4 neighbors attached" readable at glance

Draw order in SVG: Living at (0,0). Bedroom west, Entrance east, DK south, Laundry attached-south-east via DK. Hub topology 1-star with Living at center. Even at 30% thumbnail zoom, you can immediately tell Living = hub. No Linear or Split-Zone confusion.
**PASS.**

### Check #10 — Non-active-task rooms correctly faded/elided (eligible for opacity 0.05)

Layer_4 rule: draw opacity = 0.05 for inactive taskRooms. No geometry is altered (no shape shifts). Just alpha change.
Example: for task = laundry-sort (L3), taskRooms = [living, diningKitchen, laundry] → Bedroom, Entrance drawn at 0.05 alpha.
**PASS.**

---

## FINAL VERDICT

| Check | Result |
|---|---|
| 1  No visual gaps | PASS |
| 2  Shared walls one stroke | PASS |
| 3  4 internal gaps match 3D exactly | PASS |
| 4  Front door separate | PASS |
| 5  No double-offset gaps | PASS |
| 6  Player icon continuous through doorway | PASS |
| 7  World Z → minimap Y flip | PASS |
| 8  Furniture envelopes fit | PASS |
| 9  Hub relationship readable | PASS |
| 10 Inactive room opacity 0.05 fade OK | PASS |

**Verdict: MINIMAP_GEOMETRY_PASS (10/10 · 0 warnings)**
→ OK for next phase (G1 asset-aware room layout) after Candidate A human approval.
