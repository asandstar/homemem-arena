# WALL THICKNESS AND SHARED WALL CONTRACT (B2 Interior-Face Alignment · FINAL PICK)

Document ID: WALL_THICKNESS_AND_SHARED_WALL_CONTRACT
Date: 2026-08-03
Status: UNTRACKED · PLANNING ONLY · Replaces and supersedes the previous ambiguous "Strategy B" contract (logical=0.12, visual=0.20 undefined alignment) in WALL_AND_DOORWAY_GENERATION_SPEC.md.

---

## §1. Preamble: what was wrong and why new rule

Old "Strategy B" (inherited from previous planning):
```
logical wall thickness = 0.12 m
visual wall thickness  = 0.20 m
alignment between them = UNDEFINED.
QA W4 rule: any visual/logical corner mismatch > 0.010 m → BLOCKER.
```

This set is **mathematically INCONSISTENT (CONFIRMED_ERROR per §三 item 6)** because 0.20 − 0.12 = 0.08 m difference > 0.010 m tolerance. Either the QA rule is wrong, or the thickness pairing is. This contract resolves by:
1. **Retiring W4 1 cm absolute corner rule** and replacing it with W4' (interior-face rule).
2. **Adopting B2 · Interior-Face Alignment** as the only valid contract (supersedes old ambiguous strategy B).
3. **Shared walls are singly-owned:** no "Room A builds a visual west wall + Room B builds visual east wall at same logical position" → Z-fighting eliminated.
4. B1 (Full Normalization to 0.12m visual) is explicitly **REJECTED** in this document (reasons in §3).

---

## §2. B2 Interior-Face Alignment — formal definitions

```yaml
Contract: B2 Interior-Face Alignment (visual thicker than logical, extra OUTSIDE interior).
Applicable to: every SharedWallBlueprint (axis X or Z, cardinal only).
```

### 2.1 Key geometric definitions for one shared wall (axis = X example: wall at constant worldX = W)

```
← room A (west side) interior                     room B (east side) interior →
    │ interiorFaceA                                interiorFaceB │
    │ = W − logicalT/2                              = W + logicalT/2│
    │  (always = −0.06 from W for logicalT=0.12)                  │
    │                                                             │
    ←────── logical wall (authoritative collision) ──────────────→
    │ thickness = logicalT = 0.12 m                               │
    │                                                             │
    ←────────────── visual wall (Kenney raw T=0.20) ─────────────→
    │          visual extends beyond logical on both sides: visualT=0.20
    │          extra 0.04 m westward (into room-A OUTSIDE void? No — interior void of neighbor? No! Because wall IS the boundary. "Outside" = the wall's own thickness zone, then beyond that: room A / B are interior. Interior face is collision boundary.
```

Formally, for any SharedWallBlueprint on axis = X (worldCoord = W):
| Quantity | Value (m) | Rule |
|---|---:|---|
| logicalThickness Tl | **0.12** | Fixed constant |
| visualThickness Tv | **0.20**  | Fixed constant (Kenney raw; no T-axis scaling) |
| interiorFaceA (room A side, west) | **W − Tl/2 = W − 0.06** | This is collision authority. No furniture or player can be west of this. |
| interiorFaceB (room B side, east) | **W + Tl/2 = W + 0.06** | East interior face collision authority. |
| visualFaceA (west face of Kenney visual mesh) | **W − Tv/2 = W − 0.10** | Mesh placed with its LOCAL center at worldCoord W; no rotation around T axis; no scaling. |
| visualFaceB (east face of Kenney visual mesh) | **W + Tv/2 = W + 0.10** | 0.04m extra beyond interiorFaceB; this protrudes into "boundary" — but does NOT actually intersect Room B interior because collision stops players/furniture at interiorFaceB = +0.06. Visual 0.04 overhang is visible from camera angle looking at wall from inside the room → adds realistic depth (thin strip of mullion visible where wall meets floor). Good. |

Analogous for axis = Z.

### 2.2 Consequences (positive, no net negative to gameplay)

| Property | B2 result | Proof |
|---|---|---|
| **Room net interior area (walkable)** = blueprint `width × depth` exactly | UNCHANGED from RoomBlueprint ✅ | Collision uses interiorFaces, which align to `room.minX/maxX/minZ/maxZ` exactly. |
| **Kenney window module (rawT 0.20) needs no T-axis distortion** | PERFECT MATCH ✅ | Tv = 0.20 equals rawT of wallWindowSquare module. No T-scale 0.6 compression like in B1. |
| **Kenney door model (rawT 0.20)** | PERFECT MATCH ✅ | Fits within visual wall 0.20 natural T with zero adjustments. |
| **Shared wall duplicate mesh / Z-fighting** | IMPOSSIBLE ✅ | Each wall is generated once by SharedWallBlueprint. Rooms don't generate independent visuals on that face. |
| **Old W4 (1 cm corner tolerance) → retired and replaced** | W4': interior face coincidence ≤ 0.005 m | logicalT/2 = 0.06 → interiorFace offsets fixed analytically → W4' passes 0.000 m trivially. |
| **Minimap drawing correctness** | Room fill = RoomBlueprint logical interior. Wall stroke = SharedWall centerline. Both draw correctly with 0.0m error. | §2.4. |

---

## §3. B1 vs B2 side-by-side — why B2 WINS

| Dimension | B1 · Full Normalization (Tl=Tv=0.12, scale all visuals T-axis to 0.6) | B2 · Interior-Face (FINAL) |
|---|---|---|
| **Texture / module realism for Kenney Building Kit** | ❌ T-axis scale = 0.6 on every wall-window, wall-corner, lintel, and door module. Pattern compressed 40% along depth axis. Artifacts visible on window cross mullion depth. Door leaf hinge looks thin. | ✅ **All Kenney structural visuals loaded as-is. No T scale. Modules 1:1 with artist's intent.** |
| **Implementation cost (normalizer tables)** | ❌ Need a `STRUCTURAL_ASSET_T_AXIS_NORMALIZER` table = per GLB name → localDepthAxis (Z? X? Y?) → scale factor = 0.12 / rawT, plus QA that new visual doesn't flip normals. | ✅ **No normalizer.** Every structural mesh: load → translate → rotate → parent to SharedWall node. Zero scale, zero table. |
| **Collision / visual interior consistency** | ✅ Perfect (0.0 offset everywhere; old W4 passes trivially) | ✅ Perfect interior face (0.0 offset). Outer corner mismatch = 0.04m EXPLICITLY allowed; not a QA fail; interior view does not observe outer face in first-person camera so the mismatch is invisible inside gameplay. |
| **Future-proofing if swap to ProBuilder/Blender custom walls** | ❌ Would have to re-normalize T=0.12 on every new model. | ✅ "Interior face rule" works for ANY model T (e.g., 0.24m brick walls) simply by adjusting Tv. Tl stays 0.12. |
| **Net developer risk** | MEDIUM (1 normalizer table + 1 QA pass every new structural GLB). | LOW (zero magic constants beyond Tl=0.12 and Tv=0.20). |

**FINAL PICK = B2.** Reject B1.

---

## §4. SharedWall Blueprint single ownership rule (MANDATORY)

```yaml
Rule: For every physical wall in the house (cardinal face of any RoomRect),
the wall is generated EXACTLY ONCE.
If face is between 2 rooms → shared wall, kind = 'internal', owner = SharedWallBlueprint.
If face touches no other room → exterior wall, kind = 'exterior', owner = SharedWallBlueprint.
No room code (Room3D.tsx) ever generates "its own mesh" for a face that has a SharedWallBlueprint entry.
```

### 4.1 Ownership table for code (future mapping, not to be implemented this turn)

| Wall instance | Code entity responsible | Room blueprint involvement | Mesh count |
|---|---|---|---:|
| sw-living-bedroom (internal X wall x=−3.5) | `SharedWallRenderer.render('sw-living-bedroom')` → 1 mesh | `living.sharedWallIds` + `bedroom.sharedWallIds` → both include id; neither renders own west/east | 1 ✅ |
| sw-living-entrance (internal X wall x=+3.5) | SharedWallRenderer | living + entrance | 1 ✅ |
| sw-living-diningkitchen (internal Z wall z=−3.0) | SharedWallRenderer | living + diningKitchen | 1 ✅ |
| sw-diningkitchen-laundry (internal X wall x=+3.0) | SharedWallRenderer | diningKitchen + laundry | 1 ✅ |
| sw-entrance-front-exterior (X wall x=+6.5, exterior, front door here) | SharedWallRenderer (kind=exterior) | entrance only (roomB = null) | 1 ✅ |
| Exterior walls (e.g. Living north face, Bedroom west face, etc. 15 remaining exterior walls) | Each registered as separate SharedWallBlueprint `kind='exterior'`, roomB=null | Referenced by exactly 1 room in sharedWallIds | 1 each ✅ |

### 4.2 SharedWallBlueprint full schema (verbatim from §十)

```typescript
export interface SharedWallBlueprint {
  id: SharedWallId
  kind: 'internal' | 'exterior'
  roomA: RoomId
  roomB: RoomId | null

  // cardinal geometry (axis = X or Z only)
  axis: 'X' | 'Z'
  worldCoord: number        // if axis=X, wall is at x=worldCoord; else z=worldCoord
  rangeStart: number        // along the other axis (Z for X; X for Z)
  rangeEnd:   number
  length: number            // = rangeEnd - rangeStart

  // §九.B2 thickness pair:
  logicalThickness: 0.12
  visualThickness:  0.20
  interiorFaceA: number     // = worldCoord − logicalT/2  (roomA interior surface)
  interiorFaceB: number     // = worldCoord + logicalT/2  (roomB interior surface; =interiorFaceA for exterior kind where roomB=null? No: exterior only has roomA interior face valid; interiorFaceB points outside world)

  // openings (cuts through visual + logical + minimap stroke)
  doorwayIds: DoorwayId[]
  windowIds:  WindowId[]

  // ownership enforcement / rendering dispatch
  visualOwner:    'SharedWallBlueprint'  // rendering reads only this
  collisionOwner: 'SharedWallBlueprint'  // collision box(es) 3-segment if door/window, else one box
  minimapOwner:   'SharedWallBlueprint'  // minimap reads only this
}
```

### 4.3 3-Segment wall with doorway gap (applies to visual AND collision AND minimap stroke)

For a shared wall with `doorwayIds.length > 0` (say dw-living-bedroom on sw-living-bedroom):
```
Given:
  wall axis=X at worldCoord=−3.5, length=6.0  (Z: −3 → +3)
  doorway dw-living-bedroom: centerZ=0.0, width=1.4
Segments (each one box/meshes/polyline):
  S1: from rangeStart = −3.0 to doorway start = 0 − 0.7 = −0.7  → 2.3m long wall segment
  S2: GAP (1.4 m) — NOT rendered as collision wall. Visual: 3-segment Kenney → lintel above 2.2m y-level remains + door leaf inside this gap. Collision: no block.
  S3: from doorway end = 0 + 0.7 = +0.7 to rangeEnd = +3.0 → 2.3m long segment
```
Minimap rendering: draw SharedWall centerline stroke from rangeStart to gap-start, lift pen across gap (draw gap pixel as doorway notch symbol), then resume from gap-end to rangeEnd.

### 4.4 Minimap draw rules (§九.B2 compliant)

Fixed, non-negotiable minimap draw contract (replaces prior "three choose one" ambiguity):
```yaml
minimap_render_contract:
  layers (bottom up):
    - layer_1_room_fill:
        draw each RoomBlueprint interior rectangle as solid 2D fill
        (e.g. #EFE9E1 living; #E7E1F4 bedroom ...)
        Use world minX/maxX/minZ/maxZ → exactly interiorFace boundaries (logicalT 0.12 interior surface aligns 100%).
    - layer_2_wall_centerlines:
        For each SharedWallBlueprint (internal + exterior both):
          draw a single 2.5px stroke on the wall's CENTERLINE (worldCoord for axis).
          Apply S1/GAP/S3 rule if any doorwayIds.
          Color = #2B221C dark brown (strong contrast vs fill).
        Exterior shared walls: stroke width = 3.5px (heavier to visually see house envelope).
    - layer_3_doorway_notches:
        For each doorway id:
          internal → draw tiny gap + small door symbol (quarter-circle indicating hinge side)
          exterior (front door only) → draw front-door icon (thicker notch + arrow pointing out)
    - layer_4_task_rooms_only:
        Hide (opacity = 0.05 only, not drawn fully) any room not currently in active task taskRooms list.
        (G1 implementation detail, ignored for current §)
```
End of WALL THICKNESS CONTRACT.
