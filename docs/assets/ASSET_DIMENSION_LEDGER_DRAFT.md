# Asset Dimension Ledger (DRAFT)

Document ID: ASSET_DIMENSION_LEDGER_DRAFT
Date: 2026-08-03
Scope: Top-13 candidate models measured from raw OBJ vertices (std-lib Python walker; no Blender / no trimesh / no numpy)
Status: U N T R A C K E D — DRAFT, to be refined with Blender pass once a Blender host is available

---

## 0. Measurement Method

- Source: raw unpacked `.obj` files for each candidate model.
- Vertex walker reads every `v x y z` line.
- Computes raw min / max / size / center; "floor aligned" means `abs(lowest_y) < 0.005`.
- "Scaled meters" applies per-pack unit assumption:
  - furniture-kit 2018 → raw u = 0.5 m → × 2.0.
  - building-kit 2025 → raw u = 1.0 m → × 1.0 (wall 2.0 length × 2.4 height confirms).
  - food-kit 2024 → raw u = 1.0 m → × 1.0 (mug height 0.27 m, plausible).
- Pivot XY offset = Euclidean distance from object XZ-center to world origin (0,0), in scaled meters.

This method does NOT read FBX pivot metadata; it only infers the pivot from the OBJ vertex placement relative to world origin. This is enough for topology planning and for the G1 production GLB importer to apply a single "recenter to origin + align to floor" post-transform.

---

## 1. Ledger

| # | Model ID | Source file | Pack | Raw XYZ (raw units) | Scaled meters W×H×D (X×Y×Z) | Footprint m² W×D | Pivot XY offset (m) | Floor aligned? | Minimap AABB | Collision box | Rec status |
|---|----------|-------------|------|---------------------|------------------------------|------------------|---------------------|----------------|--------------|---------------|------------|
| 1 | Sofa | loungeSofa.obj | furn | 0.980 × 0.460 × 0.410 | 1.960 × 0.920 × 0.820 | 1.960 × 0.820 | 1.062 | YES | OK_WITH_PIVOT_FIX | GOOD | APPROVED_WITH_PIVOT_FIX + ×2.0 |
| 2 | CoffeeTable | tableCoffee.obj | furn | 0.661 × 0.230 × 0.400 | 1.322 × 0.460 × 0.800 | 1.322 × 0.800 | 0.329 | YES | OK_WITH_PIVOT_FIX | GOOD | APPROVED_WITH_PIVOT_FIX + ×2.0 |
| 3 | BedDouble | bedDouble.obj | furn | 0.956 × 0.375 × 1.125 | 1.912 × 0.750 × 2.250 | 1.912 × 2.250 | 1.476 | YES | OK_WITH_PIVOT_FIX | GOOD | APPROVED_WITH_PIVOT_FIX + ×2.0 |
| 4 | Nightstand (sideTable proxy) | sideTable.obj | furn | 0.534 × 0.384 × 0.220 | 1.069 × 0.769 × 0.440 | 1.069 × 0.440 | 0.552 | YES | OK_WITH_PIVOT_FIX | GOOD | APPROVED_WITH_PIVOT_FIX + ×2.0 |
| 5 | Wardrobe (bookcaseClosedDoors proxy) | bookcaseClosedDoors.obj | furn | 0.400 × 0.850 × 0.250 | 0.800 × 1.700 × 0.500 | 0.800 × 0.500 | 0.472 | YES | OK_WITH_PIVOT_FIX | GOOD | APPROVED_WITH_PIVOT_FIX + ×2.0 |
| 6 | TV | televisionModern.obj | furn | 0.685 × 0.455 × 0.128 | 1.370 × 0.910 × 0.257 | 1.370 × 0.257 | 0.000 | YES | GOOD | GOOD | **APPROVED_WITH_SCALE_FIX** only |
| 7 | TVStand | cabinetTelevision.obj | furn | 0.800 × 0.310 × 0.250 | 1.600 × 0.620 × 0.500 | 1.600 × 0.500 | 0.838 | YES | OK_WITH_PIVOT_FIX | GOOD | APPROVED_WITH_PIVOT_FIX + ×2.0 |
| 8 | Bookshelf | bookcaseOpen.obj | furn | 0.400 × 0.880 × 0.250 | 0.800 × 1.760 × 0.500 | 0.800 × 0.500 | 0.472 | YES | OK_WITH_PIVOT_FIX | GOOD | APPROVED_WITH_PIVOT_FIX + ×2.0 |
| 9 | DiningTable | table.obj | furn | 0.841 × 0.327 × 0.447 | 1.683 × 0.654 × 0.895 | 1.683 × 0.895 | 0.953 | YES | OK_WITH_PIVOT_FIX | GOOD | APPROVED_WITH_PIVOT_FIX + ×2.0 |
| 10 | DiningChair | chair.obj | furn | 0.200 × 0.470 × 0.200 | 0.400 × 0.940 × 0.400 | 0.400 × 0.400 | 0.283 | YES | OK_WITH_PIVOT_FIX | GOOD | APPROVED_WITH_PIVOT_FIX + ×2.0 |
| 11 | DoorModule | door-rotate-square-a.obj | bld | 0.250 × 2.100 × 0.925 | 0.250 × 2.100 × 0.925 | 0.250 × 0.925 | 0.438 | YES | OK_WITH_PIVOT_FIX | GOOD | APPROVED_WITH_PIVOT_FIX (hinge offset preserved for rotation; not moved to center) |
| 12 | WindowModule | wall-window-square.obj | bld | 0.200 × 2.400 × 2.000 | 0.200 × 2.400 × 2.000 | 0.200 × 2.000 | 0.000 | YES | **GOOD** | **GOOD** | **APPROVED_FOR_TOPOLOGY** (perfect centered + floor) |
| 13 | Mug | mug.obj | food | 0.344 × 0.273 × 0.285 | 0.344 × 0.273 × 0.285 | 0.344 × 0.285 | 0.048 | YES | OK_WITH_PIVOT_FIX | GOOD | APPROVED_WITH_PIVOT_FIX |

---

## 2. Visual Center / Forward / Rotation

- Default forward direction for all corner-pivoted furniture objects: **+Z**. (Rear face == most-negative X face; pivot X is negative; depth is +Z axis.)
- requiredRotationY_deg default = 0. Per-face rotation chosen later during topology plan by room cardinal direction.
- Visual center = `raw_center` in scaled meters. All furniture visual centers ≈ footprint geometric center; only offset ≡ world origin vs object center.

---

## 3. Pivot / Scale Strategy for the Topology Plan

Every model (except TV, WindowModule) is **APPROVED_WITH_PIVOT_FIX or APPROVED_WITH_SCALE_FIX**. The unified import-time transform for G1 will be:

1. **Scale** by the factor from column "Rec status".
   - furniture-kit: uniform × 2.0
   - building-kit / food-kit: uniform × 1.0 (or 1.01 nominal)
2. **Translate XZ** by `−raw_center × scale` so post-transform, model footprint is **centered at world origin X=0, Z=0** (for 9 of 13; keep DoorModule hinge offset by −0.438 Z so its rotateY hinge passes through hinge line at world origin; keep TV and Window centered already).
3. **Translate Y** by `−lowest_vertex_y × scale` (trivially 0 because all 13 are floor-aligned already).
4. **Meshopt / Draco / KTX2**: deferred to G1; per §12 NOT enabled in the audit conversion (would have been disabled).

This step does not require re-exporting source GLBs. A runtime pre-transform on import (in ModelRegistry loader) is acceptable; or a Blender pass later bakes the transform. This ledger intentionally does both by reporting raw + scaled.

---

## 4. Minimap AABB Suitability

Definition: a minimap cell renders the top-down AABB of a model onto a 2D grid. "Good" = post-recenter the AABB = `[−size_x/2, size_x/2] × [−size_z/2, size_z/2]`.

- **GOOD** (2): TV (already center); WindowModule (already center).
- **OK_WITH_PIVOT_FIX** (11): remaining. Becomes GOOD after the trivial XZ translate.
- No "BAD" minimap suitability (no weird Z-fighting or diagonal-off-axis footprints — all axis-aligned box AABB candidates).

For the 9 furniture + DoorModule items, perform the XZ offset at bake time, then you get a clean 2D projection suitable for room topology layout.

---

## 5. Collision Box Suitability

- All 13 have clean axis-aligned bounding boxes.
- No convex-hull-only collisions required at this stage. Simple Box3 per model after pivot fix will match visual footprint within a few centimeters.
- Recommended: use the "raw_size × scale" box, then subtract 2–3 cm from X/Z to give a small collision skin so doors open and chairs tuck.

---

## 6. Discrepancies / Risks

- Wardrobe (#5) uses bookcaseClosedDoors as proxy — depth is only 0.5 m at scale × 2. A real wardrobe is typically 0.6 m. Acceptable for v1.
- Nightstand (#4) uses sideTable — 1.07 m width at scale × 2 is too wide for a true nightstand. Use bookcaseClosedDoors instead or halve it (but then it becomes too narrow; the real gap is a dedicated nightstand).
- Mug (#13) 0.344 m width is oversized for a real mug (0.1 m). This is Kenney's stylized scale, acceptable (the gameplay task relies on visibility, not realism). If realism needed later, ×0.3.
- Sofa (#1) 0.82 m depth is a bit shallow for a 2-seater at 1.96 m length. Acceptable stylized. Will not re-scale during topology; keep consistent with pack ×2.0.
- No triangulation count; OBJ walker only reads vertices. Triangle budget deferred to Blender-based follow-up (§12).

---

## 7. Forward Compatibility with Blender Audit

When Blender is available, run `blender --background --python scripts/measure_blender.py` (to be written) to cross-check:
- FBX native pivot (`object.location`, object `data.transform`);
- FBX forward axis / up axis at export time;
- triangle counts per mesh;
- vertex color vs UV channel sanity for furniture-kit solid-color multi-matl meshes;
- Kenney material names → in-engine THREE.Material slot mapping (solid-color MTL → MeshStandardMaterial flatShading likely).

This DRAFT ledger is authoritative for the topology plan and only needs a Blender sign-off before G1 import bakes; the raw OBJ numbers above are FACT for this audit.

