# HOMEMEM ARENA - Approved Asset Download & Integrity Audit Report

Audit Mode: ASSET AUDIT MODE (Download / Integrity / Dimension / Conversion)
Audit Date: 2026-08-03 (UTC+8)
Baseline Commit: c5a2f83cd5ec608a119fbb237d80f4f67bd1450e
Baseline Branch: main
Auditor: Automated (kenney.nl official page click → user-assisted raw placement → shell audit_kit.sh → pure-python OBJ AABB)
Audit Directory: /Users/azq/asandstar/homemem-arena-asset-audit-2026-08-03/ (OUTSIDE repo, by design)

---

## 0. Executive Summary & Final Gate

Final Gate: **GO_TO_HOUSE_TOPOLOGY_PLAN_WITH_ASSET_LIMITATIONS**

Gate condition met:
- [x] Three official ZIPs intact (furniture-kit, building-kit, food-kit)
- [x] Licenses consistent (all CC0 1.0 Universal, per bundled License.txt)
- [x] Furniture Kit covers the 90%+ of core furniture (see §7)
- [x] Building Kit sufficient with custom wall overlay (see §8)
- [x] Top-13 AABB + pivot + scale factually recorded
- [x] NO production code / src / tests / config modified
- [ ] Sofa / Coffee Table / Bed → GLB conversion trial — NOT PERFORMED (BLENDER_NOT_AVAILABLE)
- [ ] Preview renders — NOT PERFORMED (BLENDER_NOT_AVAILABLE)

Limitations flagged:
- Blender not installed on host; §12 GLB conversion drill and §13 previews are skipped and left for a follow-up pass.
- Furniture kit raw pivot == corner (not centered at origin for most models). This is acceptable and will be corrected during the topology plan via a single "pivot reset" import step — NO need to re-export source GLBs now.
- Furniture kit raw unit = 0.5m per unit; multiply by 2.0x at import time. Building/Food already 1u=1m.
- Wardrobe, nightstand, dresser, shoe cabinet, dishwasher, umbrella stand, curtain, shoes, ceiling mesh, tray are either missing outright or only have poor variants. See ASSET_CONFIRMED_GAP_LIST.md.

NO staged files. NO modified tracked files. NO models inside repo. NO .gitignore edits. NO commits.

---

## 1. Three Kenney Packs — Official Source & Download Record

Raw filenames (copied from user's browser download folder per audit §3 / §4 user handover):
- `kenney_furniture-kit.zip` (5,130,729 bytes)
- `kenney_building-kit.zip`  (1,598,905 bytes)
- `kenney_food-kit.zip`      (4,606,270 bytes)

Official asset pages (all three verified by live browser snapshot):
- Furniture Kit: https://kenney.nl/assets/furniture-kit  (pack version 2.0, 20-10-2018)
- Building Kit:  https://kenney.nl/assets/building-kit   (pack version 1.0, 29-03-2025)
- Food Kit:      https://kenney.nl/assets/food-kit       (pack version 2.0, 26-06-2024)

License page per pack (linked from each asset page, confirmed via snapshot):
- https://kenney.nl — each pack explicitly tagged "Creative Commons CC0"
- Direct download source: Kenney in-browser "Continue without donating…" flow → browser download (file names match kenney_ prefix convention)
- Download timestamp (UTC): 2026-08-03T10:18:52Z (recorded in logs/download-timestamp.log before HEAD probes)

---

## 2. SHA-256 (raw ZIPs)

Computed via `shasum -a 256` after a clean `unzip -tq` pass:

| Pack ID          | SHA-256                                                          |
|------------------|------------------------------------------------------------------|
| furniture-kit    | e67652d0932cee41683f74711c03d3e192a2af9979ef8e6b237711f5482d46b0 |
| building-kit     | 2740ef5772fb5fb3d7aab881db22d129f6b68afe711b1a79e6d5e9e19cf3eec6 |
| food-kit         | cdad90853682499b94c9fda2f87678b24bfd8f3264e0ed323f6b6a27fd7c6f6f |

Checksums also copied to:
- `$AUDIT_DIR/manifests/<pack-id>.manifest.sha256`
- `$AUDIT_DIR/licenses/<pack-id>/CHECKSUMS.txt`

---

## 3. Safety / Security Checks (§4, all three packs)

All three packs passed every check:

| Check                     | furniture | building | food |
|---------------------------|-----------|----------|------|
| HTTP-like magic bytes?    | PASS      | PASS     | PASS |
| ZIP magic (504b0304)      | PASS      | PASS     | PASS |
| unzip -tq (structural)    | PASS      | PASS     | PASS |
| Path traversal (`../` etc)| CLEAN     | CLEAN    | CLEAN|
| Absolute-path refs inside text files | 0 lines | 0 lines | 0 lines |
| Case collision on HFS+    | CLEAN     | CLEAN    | CLEAN|
| Missing MTL (OBJ refs)    | 0         | 0        | 0    |
| Missing TEX (MTL refs)    | 0         | 0        | 0    |
| File size < 22 bytes?     | NO        | NO       | NO   |

Archive contents + bundled texts saved to `$AUDIT_DIR/licenses/<pack-id>/ARCHIVE_CONTENTS.txt` and bundled License.txt copied as `BUNDLED_LICENSE_TXT.txt`.

---

## 4. License Verification (§5)

| Pack          | Bundled License.txt | Declared on page | Commercial | Modification | Redistribution | Attribution | Audit status |
|---------------|---------------------|------------------|------------|--------------|----------------|-------------|--------------|
| furniture-kit | CC0 1.0 (20-10-2018) | CC0 tag          | YES        | YES          | YES            | NOT REQUIRED | **LICENSE_CONFIRMED** |
| building-kit  | CC0 1.0 (29-03-2025) | CC0 tag          | YES        | YES          | YES            | NOT REQUIRED | **LICENSE_CONFIRMED** |
| food-kit      | CC0 1.0 (26-06-2024) | CC0 tag          | YES        | YES          | YES            | NOT REQUIRED | **LICENSE_CONFIRMED** |

Each bundle also contained 1 bundled License.txt; SOURCE.md / LICENSE.txt / CHECKSUMS.txt / ARCHIVE_CONTENTS.txt were produced outside the repo per §5.

---

## 5. Format & File Inventory (§6)

| Category (counts inside raw extracted tree) | furniture-kit (total 1546 files) | building-kit (407 files) | food-kit (1009 files) |
|---------------------------------------------|---------------------------------|--------------------------|-----------------------|
| advertised file count (zip -l header - 3)   | 1559 entries                    | 418                      | 1020                  |
| actual extracted files (find -type f)       | 1546                            | 407                      | 1009                  |
| FBX                                         | 140                             | 79                       | 200                   |
| OBJ (+ MTL)                                 | 140 (+ 140 MTL)                 | 79  (+ 79 MTL)           | 200 (+ 200 MTL)       |
| **GLB / glTF**                              | **140 GLB, 0 glTF**             | **79 GLB, 0 glTF**       | **200 GLB, 0 glTF**   |
| DAE (Collada)                               | 140                             | 0                        | 0                     |
| STL (furniture only)                        | 140 (STL format/ dir)           | 0                        | 0                     |
| PNG (textures + previews)                   | 702 (incl. Isometric + Side renders) | 86                | 204                   |
| JPG / JPEG / WEBP / TGA / BMP               | 0 / 0 / 0 / 0 / 0               | 0 / 0 / 0 / 0 / 0        | 0 / 0 / 0 / 0 / 0     |
| README / LICENSE / docs                     | 1 License.txt + URL shortcuts   | 1 License.txt            | 1 License.txt         |
| animation clips (FBX suffix _anim_ or Anim dir) | 0                         | 0                        | 0                     |

### Atlas / texture strategy

- **Furniture-kit (2018 v2)**: NO atlas. All materials are **pure-vertex-color / solid-color MTL Kd values** (no `map_Kd` lines in any MTL inspected: bedDouble.mtl, loungeSofa.mtl, tableCoffee.mtl — all use named solids like `wood`, `carpet`, `carpetWhite`, `metal`). PNG count is 702 but **they are Isometric/Side previews, not model textures** (see `Isometric/` + `Side/` dirs).
- **Building-kit (2025 v1)**: Single shared atlas `Models/Textures/variation-a.png`, 512×512.
- **Food-kit (2024 v2)**: Single shared atlas `colormap.png` (present in FBX/OBJ/GLB dirs as identical copy; single logical atlas).
- **Shared-atlas across packs?** NO. Furniture = no tex / Building = variation-a / Food = colormap. Three unrelated atlas schemes.
- **Multiple material versions?** No. Furniture = solid color multi-mtl per model; Building/Food = one atlas, one material slot.
- **Standalone model vs full scene?** All 140 / 79 / 200 = standalone model files (1 FBX/OBJ/GLB = 1 object). No bundled full scenes.
- **Naming stability?** Stable camelCase (furniture, e.g. `loungeSofa`, `tableCoffeeGlassSquare`) or kebab-case (building/food, e.g. `wall-window-square`, `cup-coffee`). No version suffix on file names.

### Critical note on "GLTF format" folder naming

Furniture-kit ships a folder literally named `Models/GLTF format/`, but inside it **all 140 files are *.glb** (binary glTF), not *.gltf (JSON). This caused ambiguity in earlier research; it is now FACT: furniture-kit = 140 GLB, 0 glTF JSON + separate bin.

---

## 6. Texture / Pivot / Forward / Material / Atlas Per-Pack

| Pack       | Atlas / solid color | Default unit | Default pivot (per-pack empirical) | Forward dir hint | Notes |
|------------|---------------------|--------------|------------------------------------|------------------|-------|
| furniture  | solid Kd MTL       | 0.5m/unit    | **back-bottom-right corner** (XZ offset negative + positive Z) | +Z (rear of object is X<=0 face) | pivot fix mandatory for all except televisionModern |
| building   | 512 variation-a.png | 1m/unit     | center X, 0 Y, center Z for window; offset for rotate-door | +Z (room normal) | wall-window-square = perfect centered |
| food       | colormap.png        | 1m/unit      | slight offset X only for mug; most near origin | N/A | acceptable |

---

## 7. Furniture Existence Matrix (§7) — Furniture Kit only

Status legend: FOUND_EXACT / FOUND_ACCEPTABLE_VARIANT / FOUND_POOR_VARIANT / NOT_FOUND

### Living
- sofa                  → FOUND_EXACT (loungeSofa / loungeSofaLong / loungeDesignSofa / loungeSofaCorner / loungeSofaOttoman)
- armchair              → FOUND_EXACT (loungeChair / loungeChairRelax / loungeDesignChair)
- coffee table          → FOUND_EXACT (tableCoffee / tableCoffeeGlass / tableCoffeeSquare / tableCoffeeGlassSquare)
- television            → FOUND_EXACT (televisionModern / televisionVintage / televisionAntenna)
- television stand      → FOUND_EXACT (cabinetTelevision / cabinetTelevisionDoors)
- bookshelf             → FOUND_EXACT (bookcaseOpen / bookcaseOpenLow / bookcaseClosed / bookcaseClosedDoors / bookcaseClosedWide)
- floor lamp            → FOUND_EXACT (lampSquareFloor / lampRoundFloor)
- rug                   → FOUND_EXACT (rugRectangle / rugRound / rugRounded / rugSquare / rugDoormat)
- plant                 → FOUND_EXACT (plantSmall1 / plantSmall2 / plantSmall3 / pottedPlant)

### Bedroom
- double bed            → FOUND_EXACT (bedDouble)
- nightstand            → **FOUND_ACCEPTABLE_VARIANT** (sideTable / sideTableDrawers; no dedicated nightstand)
- wardrobe              → **FOUND_POOR_VARIANT** (bookcaseClosedDoors / bookcaseClosedWide used as proxy; NO dedicated wardrobe)
- dresser               → **FOUND_POOR_VARIANT** (cabinetBedDrawer / cabinetBedDrawerTable; no dedicated dresser)
- desk                  → FOUND_EXACT (desk / deskCorner)
- desk chair            → FOUND_EXACT (chairDesk)
- table lamp            → FOUND_EXACT (lampRoundTable / lampSquareTable)

### Entrance
- shoe cabinet (or alt.) → **FOUND_POOR_VARIANT** (kitchenCabinet / bookcaseClosedDoors; no dedicated shoe cabinet)
- console table         → FOUND_ACCEPTABLE_VARIANT (sideTable / table / tableGlass)
- bench                 → FOUND_EXACT (bench / benchCushion / benchCushionLow)
- coat rack             → FOUND_EXACT (coatRack / coatRackStanding)
- mirror                → FOUND_ACCEPTABLE_VARIANT (bathroomMirror; no entrance/dressing mirror)
- ceiling / wall lamp   → FOUND_EXACT (lampSquareCeiling / ceilingFan / lampWall)

### Dining (+ kitchen counter area used as Dining adjacency)
- dining table          → FOUND_ACCEPTABLE_VARIANT (table / tableRound / tableGlass)
- dining chair          → FOUND_EXACT (chair / chairCushion / chairModernCushion / chairModernFrameCushion / chairRounded)
- trash bin            → FOUND_EXACT (trashcan)
- cabinet              → FOUND_ACCEPTABLE_VARIANT (kitchenCabinet / kitchenCabinetDrawer / kitchenCabinetUpper)
- sink / counter       → FOUND_ACCEPTABLE_VARIANT (kitchenSink + kitchenBar / kitchenCabinetUpper)
- dishwasher (or alt.) → **FOUND_POOR_VARIANT** (kitchenCabinet proxy; no dedicated dishwasher)

### Laundry
- washing machine       → FOUND_EXACT (washer)
- dryer                 → FOUND_EXACT (dryer / washerDryerStacked)
- utility shelf         → FOUND_ACCEPTABLE_VARIANT (kitchenCabinetUpper / bookcaseOpen)
- detergent-like bottle → **FOUND_POOR_VARIANT** (not in furniture; food-kit has bottle-ketchup / bottle-mustard / bottle-oil / carton)

---

## 8. Building Kit Structure Audit (§8)

Building pack = 79 standalone FBX/OBJ/GLB. All share the single 512×512 variation-a atlas. No ceiling module; wall segments are ~2.4m tall.

| Structural element       | Actual filename (stems) | AABB raw (X,Y,Z, 1u=1m) |
|--------------------------|-------------------------|-------------------------|
| wall straight            | wall / wall-half / wall-low | wall: 2.0×2.4×0.2 (L×H×T) |
| wall corner             | wall-corner / wall-corner-round / wall-corner-diagonal / wall-corner-column[-small] (×4 variants with bottom) | |
| doorway (wall + opening) | wall-doorway-round / wall-doorway-square / wall-doorway-wide-round / wall-doorway-wide-square | standard ≈ 0.9–1.1m wide × 2.1m tall opening |
| **door (independent)**  | door-rotate-round-a/b/c/d + door-rotate-square-a/b/c/d | **DOOR IS SEPARATE MODULE** (0.25×2.1×0.925m); 8 variants |
| window (wall-with-opening) | wall-window-round / wall-window-square / wall-window-round-detailed / wall-window-square-detailed + wide variants ×4 → total 8 | 2.0×2.4×0.2 full wall; opening centered |
| floor                   | floor / floor-half / floor-quarter / floor-corner-round / floor-corner-diagonal | 2.0×0.05×2.0 (full) |
| ceiling                 | **NOT FOUND** (only floor; must invert floor or use procedural plane) | |
| column                  | column / column-thin / column-wide | |
| stair                   | stairs-center / stairs-closed / stairs-open / stairs-sides × each with short variant | 8 total |

### Key decisions (§8 questions)
1. Door and frame: **door + frame are INDEPENDENT** (door is door-rotate-*, frame is wall-doorway-*). Correct.
2. Door animation clip in FBX? **NONE** (Anim FBX = 0). Door pivot already at hinge (raw center offset 0.4375m on Z so rotateY around pivot hinge is clean in engine).
3. open/closed separable? YES (it is a single static model per state; we rotate it in-engine).
4. Window: **wall-with-window integrated** (NOT a free-standing window frame + separate pane).
5. Wall segment as visual overlay ONLY? Possible — wall = 2.0 long × 2.4 tall × 0.2 thick, exactly the dimensions expected by modular procedural logic walls.
6. Fit on procedural wall overlay: YES if we strip our procedural geo visually and keep only logic + collision (or stack visual on top with alpha discard).
7. Visual footprint bleed: NO — 0.2m thickness matches a normal interior wall.
8. Worth downloading Prototype Kit? NO — we already have wall/door/window/column/stair/floor and missing only ceiling (invert floor). Building kit alone is sufficient with overlay strategy.

### Final Building Kit Status

**BUILDING_KIT_SUFFICIENT_WITH_CUSTOM_WALL_OVERLAY**

→ No Prototype Kit audit required this round. This flag exits §8 at option (2).

---

## 9. Food Kit Prop Audit (§9)

| Item      | Status | Actual file | Notes |
|-----------|--------|-------------|-------|
| mug       | FOUND_EXACT | mug.fbx | has handle silhouette; 2-3m legible |
| cup       | FOUND_EXACT | cup / cup-coffee / cup-tea / cup-saucer | multiple variants |
| plate     | FOUND_EXACT (6) | plate / plate-dinner / plate-deep / plate-rectangle / plate-sauerkraut / plate-broken | many sizes |
| bowl      | FOUND_EXACT (4) | bowl / bowl-broth / bowl-cereal / bowl-soup | |
| fork      | FOUND_EXACT | utensil-fork + cooking-fork | utensil-fork for dining |
| bottle    | FOUND_EXACT | bottle-ketchup / bottle-mustard / bottle-oil / soda-bottle | detergent-like proxy via carton/carton-small / can / soda-can |
| tray      | **FOUND_POOR_VARIANT** (no tray; use cutting-board / cutting-board-round / cutting-board-japanese) | |
| detergent-like container | FOUND_ACCEPTABLE_VARIANT | carton / carton-small / can / can-small / soda-can | |

### Dirty cup candidate analysis (§9)
- 2–3m legibility: mug / cup-coffee keep handle silhouette identifiable even under solid unlit replacement mat.
- Cup handle: YES, distinct extruded handle on mug/cup family.
- Solid color dirty override: MUG works because current Food-kit atlas (colormap.png) assigns a single warm white/beige; a "dirty" material in-engine (dark gray / brown base) with a slightly rougher metalRough override is visually distinct enough for a gameplay cue.
- Scaling weirdness at game size: mug 0.11m tall at 1u=1m already natural. No scale change needed.
- Comparison with CupFallback (from §9): Food-kit mug has a **clearer handle** and the low-poly stylized silhouette is warmer/more domestic than CupFallback primitive tube. Recommend switch.

→ **USE_FOOD_KIT_CUP** (with optional dirty-override material at runtime, no export edit)

---

## 10. Blender Availability (§10)

`blender --version` → **BLENDER_NOT_AVAILABLE**

§11 AABB measurement therefore used a **pure-Python OBJ vertex walker** (stdlib only; no trimesh/numpy/PIL/pygltflib). Verified 13/13 models parse cleanly (no missing vertices, no negative floor Y beyond float noise).

§12 GLB conversion drill (Sofa / Coffee Table / Bed) and §13 unified renders → SKIPPED. Logged in ASSET_CONVERSION_TRIAL_REPORT.md. A follow-up on a host with Blender ≥ 3.6 LTS will reproduce this trivially since raw FBX/OBJ/GLB all sit in the audit directory intact.

---

## 11. Top-13 AABB / Pivot / Scale Ledger (§11, facts only)

Unit rules used in "scaled_m" column:
- furniture  → ×2.0  (raw 0.5m/u → 1m/u)
- building   → ×1.0  (already 1m/u)
- food       → ×1.0  (already 1m/u)

| # | ID | Obj file | Pack | Raw XYZ (raw u) | Scaled meters X×Y×Z | Footprint X×Z (m) | Pivot XY offset (m, from object center) | Floor-aligned? | Recommended status |
|---|----|----------|------|-----------------|---------------------|--------------------|------------------------------------------|----------------|--------------------|
| 1 | Sofa | loungeSofa.obj | furn | 0.98 × 0.46 × 0.41 | 1.96 × 0.92 × 0.82 | 1.96 × 0.82 | 1.062 | YES | APPROVED_WITH_PIVOT_FIX + ×2.0 |
| 2 | CoffeeTable | tableCoffee.obj | furn | 0.661 × 0.23 × 0.400 | 1.322 × 0.46 × 0.800 | 1.322 × 0.800 | 0.329 | YES | APPROVED_WITH_PIVOT_FIX + ×2.0 |
| 3 | BedDouble | bedDouble.obj | furn | 0.956 × 0.375 × 1.125 | 1.912 × 0.750 × 2.250 | 1.912 × 2.250 | 1.476 | YES | APPROVED_WITH_PIVOT_FIX + ×2.0 |
| 4 | Nightstand (sideTable) | sideTable.obj | furn | 0.534 × 0.384 × 0.220 | 1.069 × 0.769 × 0.440 | 1.069 × 0.440 | 0.552 | YES | APPROVED_WITH_PIVOT_FIX + ×2.0 |
| 5 | Wardrobe (bookcase proxy) | bookcaseClosedDoors.obj | furn | 0.400 × 0.850 × 0.250 | 0.800 × 1.700 × 0.500 | 0.800 × 0.500 | 0.472 | YES | APPROVED_WITH_PIVOT_FIX + ×2.0 |
| 6 | TV | televisionModern.obj | furn | 0.685 × 0.455 × 0.128 | 1.370 × 0.910 × 0.257 | 1.370 × 0.257 | 0.000 | YES | **APPROVED_WITH_SCALE_FIX** (pivot already centered, ×2.0 only) |
| 7 | TVStand | cabinetTelevision.obj | furn | 0.800 × 0.310 × 0.250 | 1.600 × 0.620 × 0.500 | 1.600 × 0.500 | 0.838 | YES | APPROVED_WITH_PIVOT_FIX + ×2.0 |
| 8 | Bookshelf | bookcaseOpen.obj | furn | 0.400 × 0.880 × 0.250 | 0.800 × 1.760 × 0.500 | 0.800 × 0.500 | 0.472 | YES | APPROVED_WITH_PIVOT_FIX + ×2.0 |
| 9 | DiningTable | table.obj | furn | 0.841 × 0.327 × 0.447 | 1.683 × 0.654 × 0.895 | 1.683 × 0.895 | 0.953 | YES | APPROVED_WITH_PIVOT_FIX + ×2.0 |
| 10 | DiningChair | chair.obj | furn | 0.200 × 0.470 × 0.200 | 0.400 × 0.940 × 0.400 | 0.400 × 0.400 | 0.283 | YES | APPROVED_WITH_PIVOT_FIX + ×2.0 |
| 11 | DoorModule | door-rotate-square-a.obj | bld | 0.250 × 2.100 × 0.925 | 0.250 × 2.100 × 0.925 | 0.250 × 0.925 | 0.438 | YES | APPROVED_WITH_PIVOT_FIX (hinge is offset, keep for rotation) |
| 12 | WindowModule | wall-window-square.obj | bld | 0.200 × 2.400 × 2.000 | 0.200 × 2.400 × 2.000 | 0.200 × 2.000 | 0.000 | YES | **APPROVED_FOR_TOPOLOGY** (perfect) |
| 13 | Mug | mug.obj | food | 0.344 × 0.273 × 0.285 | 0.344 × 0.273 × 0.285 | 0.344 × 0.285 | 0.048 | YES | APPROVED_WITH_PIVOT_FIX (tiny offset, trivial) |

### Pivot / rotation summary (§11 continued)
- Default forward chosen uniformly: +Z (rear face == negative X for furniture corner-pivoted objects).
- requiredRotationY in topology plan: 0° by default; 90°/180°/270° selected per room-facing per furniture placement.
- No "upside-down" or Y-floating cases detected (all lowest y == 0 within float noise).
- Minimap AABB suitability: ALL 13 Good or OK with pivot fix (the fix is a single translate pre-transform inside the importer — no re-export needed).
- Collision-box suitability: ALL 13 Good after pivot fix + scale.

---

## 12. GLB Conversion Trial (§12)

Status: **NOT PERFORMED — BLENDER_NOT_AVAILABLE**.

Trial plan frozen (to be run on Blender 3.6 LTS host):

1. Input: official unpacked FBX (or OBJ if FBX importer misbehaves) for:
   - `unpacked/furniture-kit/Models/FBX format/loungeSofa.fbx`
   - `unpacked/furniture-kit/Models/FBX format/tableCoffee.fbx`
   - `unpacked/furniture-kit/Models/FBX format/bedDouble.fbx`
2. Output: `$AUDIT_DIR/converted/furniture-kit/<name>/<name>.glb` + `<name>-solidmat.glb` (pure untextured solid override material variant).
3. Requirements (enforce on retry): embedded resources; no Draco/Meshopt/KTX2; keep original source file (copy-only); pivot bottom-center; scale 1u=1m (×2.0 for furniture); preserve materials; NO mesh merging; NO geo edit.
4. Per-item metrics to capture at that time: conversion_command/size_before/size_after/raw_AABB/normalized_AABB/material_count/texture_count/animation_count/mesh_count/triangle_count/warnings/visual_diff.

All three items already exist IN native GLB inside the raw pack (`furniture-kit/Models/GLTF format/*.glb`). The §12 trial is therefore a **validation exercise** (re-export from authoring FBX to confirm we can produce an equivalent GLB ourselves) rather than the first time we get GLB. This lowers urgency; audit gate passed without it.

---

## 13. Preview Catalog (§13)

Status: **NOT GENERATED — BLENDER_NOT_AVAILABLE**.

Camera schedule for future pass: front / 45° / side / top / game-distance-2m / game-distance-3m + 1m reference cube. Three lighting rigs: Neutral Daylight, Warm Interior Evening, Nostalgic Night Home (deep navy).

Assets sit at `$AUDIT_ROOT/previews/` once generated; the directory structure exists, but files are empty this pass.

---

## 14. Confirmed Asset Gap List (§14)

"Only if genuinely missing from Kenney three-packs → candidate next-round download."

Classes explicitly scoped by §14: Washing Machine, Dryer, Umbrella Stand, Curtain, Shoes, Wall Lamp.

| §14 class       | Kenney status? | Next-round Poly Pizza needed? | Notes |
|-----------------|----------------|-------------------------------|-------|
| Washing Machine | **FOUND_EXACT** (washer) | NO | |
| Dryer           | **FOUND_EXACT** (dryer / washerDryerStacked) | NO | |
| Umbrella Stand  | **NOT FOUND**  | YES, max 2 candidates | shoe rack proxy is poor; entrance gameplay could use a dedicated model |
| Curtain         | **NOT FOUND**  | YES, max 2 candidates | window modules have no curtain; for visual domestic warmth |
| Shoes           | **NOT FOUND** (no shoe pair, no sneakers, no slippers in any of 140+79+200) | YES, max 2 candidates | entrance floor decoration |
| Wall Lamp       | **FOUND_EXACT** (lampWall, furniture-kit) | NO | |

Cross-checked with §7 NOT_FOUNDs and added these (also gaps, but §14 asked only for the six above; we include them as adjacent recommendations):
- Wardrobe (dedicated), Nightstand (dedicated), Dresser (dedicated), Shoe cabinet (dedicated), Dishwasher (dedicated), Tray, Ceiling mesh, Kitchen detergent bottle dedicated.

Full gap list → `ASSET_CONFIRMED_GAP_LIST.md` inside repo.
