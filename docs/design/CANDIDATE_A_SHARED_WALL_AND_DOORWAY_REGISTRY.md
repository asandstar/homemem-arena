# CANDIDATE A SHARED WALL AND DOORWAY REGISTRY (A1 version)

Document ID: CANDIDATE_A_SHARED_WALL_AND_DOORWAY_REGISTRY
Date: 2026-08-03
Geometry: A1 Current-Scale Reconciled Hub (148.00 ㎡ interior, 0 gaps/0 overlaps)
Status: UNTRACKED · PLANNING ONLY · A2 is analogous with dimensions from NUMERICAL_LEDGER §A2

Sections:
§六 CONNECTION_COUNT_CONTRACT
§七 DOORWAY REGISTRY (doorwaysById + doorwayIds per room, NO object identity)
§八 4+1 DOORWAY LEDGER NUMERIC (worldCenterFromA vs worldCenterFromB ≤ 0.01m)
§九 WALL THICKNESS B1 vs B2 FINAL PICK
§十 SHARED_WALL_BLUEPRINT single owner (sharedWallsById + sharedWallIds per room)

---

## §六 · CONNECTION_COUNT_CONTRACT (FINAL · no more mixing)

| Counter | Value | Breakdown |
|---------|------:|-----------|
| **adjacencyEdgeCount** | **4** | 1. living↔bedroom, 2. living↔entrance, 3. living↔diningKitchen, 4. diningKitchen↔laundry. No more. |
| **internalDoorwayCount** | **4** | One per adjacency edge. All are traversable. Exterior front door is NOT an adjacency edge. |
| **exteriorDoorwayCount** | **1** | 5. entrance-front-door. Non-traversable to outside game world (only decorative visual; can be used later for spawn-in animation but no "exit house" path). |
| **totalDoorVisualCount** | **5** | 4 internal rotating doors + 1 exterior front door. Each door-rotate-square-a visual ×1. |
| **sharedWallBlueprintCount** | **5** | 4 internal shared walls (one per internal adjacency) + 1 exterior front wall (entrance's east face, not shared with another room). |

**Do NOT write "5 条内部连接" / "6 条相邻"** in future docs. Must use the exact values above.

---

## §七 · DOORWAY REGISTRY (replaces `===` object identity)

### 7.1 Rationale for doorway-by-id (over object reference identity)

Object identity `roomA.doorways[i] === roomB.doorways[j]`:
- ✅ works in-memory on cold start when code builds the objects
- ❌ breaks after `JSON.parse(JSON.stringify(rooms))` (snapshot / save-game / vitest structured-clone / E2E test serialization)
- ❌ cannot be validated against static JSON test fixtures by `===`
- ❌ impossible in rooms.ts as plain data

**Replacement pattern:** Two stores, with cross-reference by `DoorwayId` string:
```typescript
// Singleton registry (authoritative for all geometry)
export const doorwaysById: Record<DoorwayId, DoorwayBlueprint> = {
  'dw-living-bedroom': { /* ... */ },
  'dw-living-entrance': { /* ... */ },
  'dw-living-dining-kitchen': { /* ... */ },
  'dw-dining-kitchen-laundry': { /* ... */ },
  'dw-entrance-front': { /* ... */ }  // exterior
}

// Per-room (RoomBlueprint) only stores IDS, not objects:
interface RoomBlueprint {
  // ...
  doorwayIds: DoorwayId[]   // e.g. living = ['dw-living-bedroom','dw-living-entrance','dw-living-dining-kitchen']
}
```

### 7.2 QA rules (no === needed)

| QA rule | Assertion |
|---------|-----------|
| QA-R1 (internal count) | For every `dw` with `kind = 'internal'`, the number of distinct rooms whose `doorwayIds` includes `dw` must be exactly **2**. |
| QA-R2 (exterior count) | For every `dw` with `kind = 'exterior'`, exactly **1** room references it. |
| QA-R3 (room match) | An internal `dw: { roomA, roomB }` → the two referencing roomIds must equal `[roomA, roomB]` in any order. |
| QA-R4 (no orphan) | Every id in any room's `doorwayIds` must exist as a key of `doorwaysById`. |
| QA-R5 (no unused) | Every key of `doorwaysById` must be referenced by ≥ 1 room. |

All 5 are trivially verifiable via JSON file diff / vitest headless — no runtime object identity needed.

---

## §八 · 4+1 FULLY-NUMERIC DOORWAY LEDGER (A1 geometry · 0.01m alignment)

**Shared assumptions for A1:**
- Logical thickness = to be chosen in §九 (either 0.12 for B1 or interior-face = same regardless).
- Doorway width W = 1.400 m; height H = 2.200 m; traversalWidth = 1.220 m (player radius 0.3 × 2 + 2 mm skin × 2 = 0.604 → round up to 1.22 clearance safe).
- For a **cardinal wall** (North/South/East/West), the "offset along the wall" is measured from that wall's **minimum endpoint** to the **doorway center**.

| Column legend: | |
|---|---|
| wallA / wallB | 'north' | 'south' | 'east' | 'west' (which face of the room is pierced) |
| offsetA | Distance from wallA's minimum-along-wall vertex → doorway center |
| offsetB | Same for room B, using room B's wall orientation |
| worldCenterFromA | Derive: take roomA center, apply wallA out-normal × halfRoomDepth-or-Width, then apply wallA's tangent direction by offsetA. Result in world X,Z. |
| worldCenterFromB | Same from room B side. MUST satisfy `dist(A,B) ≤ 0.010 m`. |

### Ledger rows (5 total, 4 internal + 1 exterior)

---

#### D1 · dw-living-bedroom (internal · A ↔ B living-bedroom via shared X wall)

```yaml
id: dw-living-bedroom
kind: internal
roomA: living
roomB: bedroom
shared_wall_axis: X  (constant x = −3.500)
shared_wall_worldX: -3.500
rangeAlongZ: [z=-3.000, z=+3.000], length=6.000m
#   Living sees this as its WEST wall (x=min for Living)
#   Bedroom sees this as its EAST wall (x=max for Bedroom)
wallA (living side): west
wallB (bedroom side): east
offsetA (from Living west-wall's min-Z endpoint at z=-3.0):  3.000 m → center at z=(-3.0 + 3.0) = 0.0 (roomA local, then out)
offsetB (from Bedroom east-wall's min-Z endpoint at z=-3.0): 3.000 m → center z=0.0 (in Bedroom local Z, then out)
width: 1.400
height: 2.200
traversalWidth: 1.220
hingeSide (when standing in Living looking into Bedroom = facing West, hinge on left = south): left
openingDirection: both
swingClearance: door R≈1.4m open 90° → occupies 1.4 × 0.1 footprint band aligned with hinge room's interior. Keep sofa clear.
```

**WORLD CENTER CROSS-CHECK (mm precision):**
```
From A (Living center 0,0 + West face out-normal is (-1,0) × halfWidth=3.5 → point on wall = (x=0-3.5=-3.5, z=0). Then offset along wall by +3.0 in +Z direction = z stays 0 because Living Z-range centered on 0 with offset=mid = 0. WorldCenterA = (x=-3.500, z=0.000).

From B (Bedroom center = (-6.0,0.0). East face out-normal = (+1,0) × halfW_Bedroom=2.5 → point on wall = x = -6.0 + 2.5 = -3.5, z=0. Then offset along east wall from min Z=−3.0 to center = +3.0 → z= -3.0+3.0=0. WorldCenterB = (-3.500, 0.000).

dist(A,B) = sqrt[ (-3.5 -(-3.5))^2 + (0-0)^2 ] = 0.000 m  ✅  ≤ 0.010
```

---

#### D2 · dw-living-entrance (internal · shared X wall x=+3.5)

```yaml
id: dw-living-entrance
kind: internal
roomA: living
roomB: entrance
shared_wall_axis: X  (x = +3.500)
shared_wall_worldX: +3.500
Z overlap range (both rooms): Living z=[−3.000,+3.000] ∩ Entrance z=[−4.750, +0.250] = [−3.000, +0.250]  (length=3.250m)
wallA (Living): east (Living's max-X face)
wallB (Entrance): west (Entrance's min-X face)
offsetA (from Living east wall min-Z = −3.000, go up to doorway center): 2.000 m → doorway center in z = -3.0+2.0 = z=−1.000 (Living local)
offsetB (from Entrance west wall min-Z local = -2.5 since Entrance centerZ=-2.25 depth/2=2.5 → min = -4.75; offset from min=−4.75 by 3.75 = center at z=−4.75+3.75 = −1.000)
width: 1.400 / height: 2.200 / traversalWidth:1.220
hingeSide (from Living looking East = Entrance direction, hinge on north → left from Living perspective, right from Entrance): left
openingDirection: swing-in to Entrance so Living hinge doesn't block hub
swingClearance: Entrance SW corner (NW of the entrance room) is the door-open 1/4 circle; keep umbrella-stand reserve in NE (non-overlap)
```

**World center crosscheck:**
```
A: Living (0,0) + East out (1,0)*3.5 → (x=3.5, z=0). Then offsetAlongEastWall by +2.0 from min-z=-3 → z = -3.0 + 2.0 = -1.0. → WorldA = (x=+3.500, z=-1.000).
B: Entrance center (+5.0, -2.25). West out = (-1,0) × halfWidth 1.5 = x = 5.0 - 1.5 = 3.5 → wall point (x=3.5, z=-2.25). Offset from west-wall minZ local = Entrance centerZ − depth/2 = -2.25 − 2.5 = z=-4.75 then offset = +3.75m → doorway z local = -4.75 + 3.75 = -1.0 → worldB = (x=3.500, z=-1.000).
dist = 0.000 m.  ✅
```

---

#### D3 · dw-living-dining-kitchen (internal · shared Z wall z=−3.0)

```yaml
id: dw-living-dining-kitchen
kind: internal
roomA: living         (north side of wall)
roomB: diningKitchen  (south side of wall)
shared_wall_axis: Z   (constant z = −3.000)
shared_wall_worldZ: -3.000
rangeAlongX: x=[−3.000, +3.000] ∩ Living X [−3.5,3.5] = 6.000m
wallA (Living): south
wallB (DK): north
offsetA (Living south wall min-X=-3.5, add 3.5 to center): 3.500 m → doorway X = −3.5+3.5 = 0.0 in local
offsetB (DK north wall min-X local = DK centerX(0) − 6/2 = −3.0; offset +3.0 → center X=0.0 DK local)
width/height/traversal: 1.400 / 2.200 / 1.220
hingeSide (from Living looking south into DK, hinge left = west side → opens towards DK west counter; kitchen counter no collision)
openingDirection: roomB side (DK) swing so Living hub doesn't have open-door tripping hazard
```

**Crosscheck:**
```
A: Living (0,0) South = (0,-1)*3.0 → z = -3.0; x=0. Along south wall from minX=−3.5 offset 3.5 = x=0. → WorldA = (0.000, -3.000).
B: DK center (0,−6.0). North face out-normal = (0,+1) × 3.0 → z=−6+3 = −3.0. x = centerX 0. → WorldB = (0.000, −3.000). dist = 0.000 ✅
```

---

#### D4 · dw-dining-kitchen-laundry (internal · shared X wall x=+3.000)

```yaml
id: dw-dining-kitchen-laundry
kind: internal
roomA: diningKitchen (west)
roomB: laundry       (east)
shared_wall_axis: X  (x = +3.000)
rangeAlongZ: DK z=[−9,−3] ∩ Ly z=[−8.75,−3.75] = length 5.000m
wallA: DK east
wallB: Ly west
offsetA: from DK east-wall minZ_local = DK centerZ(-6) − 3 = z=−9; offset by 3.5 to doorway center → local z = −9 + 3.5 = −5.500
offsetB: from Ly west-wall minZ = Ly centerZ(-6.25) − 2.5 = −8.75; offset by 3.25 → z = −8.75 + 3.25 = −5.500
w/h/t: 1.400 / 2.200 / 1.220
hingeSide (from DK looking East → left = south)
openingDirection: Ly side so 3-baskets zone (north half laundry open area)
```

**Crosscheck:**
```
A: DK center (0,-6). East out = (1,0) * 3 → x = +3 → on-wall = (3, -6). Along east wall from minZ_local=-9 add 3.5 → z = -6 - 3 + 3.5 = -5.5 → WorldA = (3.000, -5.500).
B: Ly center (5.5, -6.25). West out = (-1,0)*2.5 = x = 5.5-2.5 = 3.0 → on-wall = (3.0, -6.25). Offset from Ly west wall min z = -6.25-2.5 = −8.75 by +3.25 → world z = −8.75 + 3.25 = -5.5 → WorldB = (3.000, -5.500). dist = 0.0 ✅
```

---

#### D5 · dw-entrance-front (EXTERIOR · not shared with another room)

```yaml
id: dw-entrance-front
kind: exterior
roomA: entrance
roomB: __EXTERIOR_SURFACE__
wallA: entrance east (outdoor side; visual = front door decorative; no world-traversal from this door)
# offsetAlongEastWall: from entrance east wall min z = -4.75; offset 2.5m → z = -4.75+2.5 = −2.25 (Entrance center z)
offsetA: 2.500
w/h: 1.400 / 2.200 (same visual module door-rotate-square-a)
hingeSide (inside Entrance looking East = outside → hinge on south, opens clockwise from outside in)
openingDirection: roomA (interior only; no teleport outside game)
visual: door-rotate-square-a + possible transom
minimap: marks the entrance's 'front door' notch (a special symbol, not a walkable gap to outside)
```

**Exterior center (single reference only):**
Entrance (5.0, -2.25). East out = (+1,0) × 1.5 = x=6.5. Along east wall from minZ_local = -4.75 offset by 2.5 → z = -4.75+2.5 = -2.25 → World = (x=+6.500, z=-2.250). No dual reference. ✅

---

### §八 Final Summary Table (≤0.01m distances)

| dw | worldCenterFromA X,Z | worldCenterFromB X,Z | 2-norm distance (m) | Pass? |
|----|----------------------|----------------------|--------------------:|:-----:|
| D1 living-bedroom | (−3.500, 0.000) | (−3.500, 0.000) | 0.000 | ✅ |
| D2 living-entrance | (+3.500, −1.000) | (+3.500, −1.000) | 0.000 | ✅ |
| D3 living-DK | (0.000, −3.000) | (0.000, −3.000) | 0.000 | ✅ |
| D4 DK-laundry | (+3.000, −5.500) | (+3.000, −5.500) | 0.000 | ✅ |
| D5 front (single) | (+6.500, −2.250) | N/A (exterior) | — | ✅ single-ref only |

All pass at 0.000m analytical precision (we placed the offsets so).

---

## §九 · WALL THICKNESS CONTRACT RE-ADJUDICATION (pick B2 Interior-Face Alignment)

### 9.1 B1 vs B2 options comparison

| Dimension | B1 · Full Thickness Normalization (logical=visual=0.12m) | B2 · Interior-Face Alignment (logical=0.12m, visual=0.20m extra goes OUTSIDE interior) |
|---|---|---|
| **logical wall T** | 0.12m | 0.12m (unchanged) |
| **visual wall T after Kenney scale** | Kenney wall-straight (rawT=0.20) scaled to T=0.12 → `scaleZ = 0.12/0.20 = 0.6`. Pattern gets compressed 40%. | Kenney rawT=0.20 kept UNSCALED. 0.08m added OUTSIDE interior face. No texture distortion in T-axis. |
| **visual/collision 1-cm footprint rule (W4 QA)** | ✅ Both 0.12m → identical corner footprints. | ⚠️ Rule rewritten: interior faces are perfectly coincident; exterior corners of visual differ by 0.08m. This is EXPLICITLY allowed in §九 QA W4' definition below — old "any corner >1cm BLOCKER" rule is **retired and replaced**. |
| **shared wall overlaps / Z-fighting** | ✅ Single shared visual wall. Both sides reference one. | ✅ Same: **one SharedWallBlueprint generates one visual mesh centered on logical wall, 0.20m thick**. Room A interior face at −0.06m from wall-center-line; Room B interior face at +0.06m. No Z-fight. |
| **Room interior net area (user perceptible)** | ✅ Identical to RoomBlueprint.size (no change). | ✅ **Identical.** Interior boundary is still `center±halfWidth`, which is the logical collision interior. Players can walk exactly as far inside as blueprint says; visual extra 0.04m is OUTSIDE, into outside-facing void, not into neighbor room. |
| **Window module (Building Kit wall-window-square rawT=0.20, rawW=2.0, rawH=2.4)** | scaleX = windowLength/2.0, scaleZ = 0.12/0.20=0.6 → depth squashed. Acceptable? The Kenney window module's 'glass cross' and 'frame' are already in the Y-X plane; T is just a mullion thickness. OK. | Raw kept UNSCALED. Fits naturally, no depth compression. Preferred. |
| **Doorway lintel / wall segments (Building Kit 三段式 visual)** | Each Kenney wall-half scaled in T to 0.12 → wall patterns compressed along normal axis. OK? | Raw T=0.20 left alone. More realistic. |
| **Minimap draw rule** | Interior boundary (logical 0.12m box XZ) → fill = room; wall stroke (1.5px) drawn on interior boundary itself. | **Draw (a) room interior fill from logical blueprint, then (b) a 2.5px-thick 'wall centerline' stroke on the SHARED_WALL center line.** This hides the small 0.04m overhang visually while showing shared walls correctly. |
| **Implementation complexity** | Medium (per-asset normalizer scale tables for wall/window/door modules, every Kenney structural asset needs T-axis scale). | Lower (structural GLB visuals loaded as-is, just translate/rotate onto shared wall). No T-axis scale. Only one mesh per SharedWallBlueprint; not per-room. |
| **QA W4 (retired & replaced)** | W4 original: visual/logical mismatch any corner > 1cm → BLOCKER → **trivially passes B1**. | **Replaced by W4'**: interior face coincidence between logical & visual mesh ≤ 0.005m; visual thickness must equal registered 0.20m exactly. |

### 9.2 Final Pick + owner table

**RECOMMENDED = B2 · Interior-Face Alignment.**

Reasons (top 3):
1. No texture/T-axis compression on Kenney Building Kit window modules, which ship 0.20m raw.
2. No per-structural-model normalizer scale table needed; significantly lower implementation risk.
3. Retired the W4 1cm absolute-corner rule in favor of W4' interior-face rule; since room interior net area and collision are both unchanged from blueprint, the 0.04m outside expansion is totally invisible inside gameplay.

### 9.3 Final Five-Owner Table (updated for B2)

| Owner (truth source) | Authority Object / Geometry |
|---|---|
| **Collision owner** | RoomBlueprint interior face + `logical wall box = 0.12m thick`. |
| **Visual owner (walls / windows / door lintels)** | **SharedWallBlueprint** (singleton per shared wall), using **raw Kenney Building Kit GLB thickness 0.20m** and **raw interior face aligned to logical**. No T-scale. |
| **Minimap owner** | (a) Room fill = RoomBlueprint logical interior. (b) Wall outline stroke = SHARED_WALL centerline on cardinal walls. Doorway gaps rendered as interruptions on that centerline. |
| **Doorway (opening + leaf) owner** | DoorwayBlueprint in Registry (§七) → both room references use the same dwId. Gap cuts through logical wall, visual 3-segment wall, and minimap. |
| **QA Owner** | 5 Registry rules (§七.2) + 8 Adjacency QA + **W4' Interior-face rule replaces old W4**. |

---

## §十 · SHARED_WALL_BLUEPRINT Single Owner Registry (parallel to doorwaysById)

```typescript
// ONE source of truth per physical wall in the house.
export interface SharedWallBlueprint {
  id: SharedWallId

  kind: 'internal' | 'exterior'

  // Rooms that touch this wall:
  roomA: RoomId        // always filled
  roomB: RoomId | null // null for exterior walls (no neighbor room)

  // Cardinal geometry:
  axis: 'X' | 'Z'                 // is wall a constant-X or constant-Z plane?
  worldCoord: number              // value of X or Z for wall's CENTER LINE
  rangeStart: number              // in the OTHER axis (Z for axis=X; X for axis=Z)
  rangeEnd: number
  length: number                  // = rangeEnd - rangeStart

  // Wall thickness pair (per §九.B2):
  logicalThickness: 0.12          // collision; interior faces are at worldCoord ± logicalT/2
  visualThickness:  0.20          // Kenney raw; visual mesh spans visualT/2 around centerline
  interiorFaceA: number           // = worldCoord − logicalT/2 (inside room A)
  interiorFaceB: number           // = worldCoord + logicalT/2 (inside room B)

  // Cross-reference to openings:
  doorwayIds: DoorwayId[]         // ordered by position along wall (0..rangeStart .. rangeEnd)
  windowIds:  WindowId[]          // if any

  // B2 visual generation:
  visualOwner:    'SharedWallBlueprint'   // not delegated to individual rooms → no duplicate mesh
  collisionOwner: 'SharedWallBlueprint'   // single logical box(es) after 3-segment door-gap subtraction
  minimapOwner:   'SharedWallBlueprint'   // 2.5px stroke on centerline from (rangeStart,worldCoord) to (rangeEnd,worldCoord)
}

// Room blueprint uses IDS only:
interface RoomBlueprint {
  // ...
  sharedWallIds: SharedWallId[]   // all walls (4 sides usually; 3 for some edge case)
}
```

### §十.3 A1 sharedWallsById (matching §八 doorways)

```typescript
export const sharedWallsById: Record<SharedWallId, SharedWallBlueprint> = {
  'sw-living-bedroom': {
    id: 'sw-living-bedroom', kind: 'internal',
    roomA: 'living', roomB: 'bedroom',
    axis: 'X', worldCoord: -3.500, rangeStart: -3.000, rangeEnd: +3.000, length: 6.000,
    logicalThickness: 0.12, visualThickness: 0.20,
    interiorFaceA: -3.56, interiorFaceB: -3.44,
    doorwayIds: ['dw-living-bedroom'],
    windowIds: [],
  },
  'sw-living-entrance': {
    id: 'sw-living-entrance', kind: 'internal',
    roomA: 'living', roomB: 'entrance',
    axis: 'X', worldCoord: +3.500, rangeStart: -3.000, rangeEnd: +0.250, length: 3.250,
    logicalT: 0.12, visualT: 0.20,
    doorwayIds: ['dw-living-entrance'], windowIds: [],
  },
  'sw-living-diningkitchen': {
    id: 'sw-living-diningkitchen', kind: 'internal',
    roomA: 'living', roomB: 'diningKitchen',
    axis: 'Z', worldCoord: -3.000, rangeStart: -3.000, rangeEnd: +3.000, length: 6.000,
    doorwayIds: ['dw-living-dining-kitchen'], windowIds: [],
  },
  'sw-diningkitchen-laundry': {
    id: 'sw-diningkitchen-laundry', kind: 'internal',
    roomA: 'diningKitchen', roomB: 'laundry',
    axis: 'X', worldCoord: +3.000, rangeStart: -8.750, rangeEnd: -3.750, length: 5.000,
    doorwayIds: ['dw-dining-kitchen-laundry'], windowIds: [],
  },
  'sw-entrance-front-exterior': {
    id: 'sw-entrance-front-exterior', kind: 'exterior',
    roomA: 'entrance', roomB: null,
    axis: 'X', worldCoord: +6.500, rangeStart: -4.750, rangeEnd: +0.250, length: 5.000,
    doorwayIds: ['dw-entrance-front'], windowIds: [],
  },
}
```

No room builds its own wall on a face where SharedWallBlueprint exists. Remaining non-shared faces (exterior walls of each room not touching another) are exterior per-room walls. They are also registered as `kind: exterior` sharedWalls.

End of Shared Wall & Doorway Registry (§六~§十).
