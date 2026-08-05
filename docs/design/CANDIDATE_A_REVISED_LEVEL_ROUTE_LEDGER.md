# CANDIDATE A REVISED LEVEL ROUTE LEDGER (L1/L2/L3 · CORRECTED FACTS)

Document ID: CANDIDATE_A_REVISED_LEVEL_ROUTE_LEDGER
Date: 2026-08-03
Geometry base: A1 Current-Scale Reconciled Hub (148 ㎡)
Status: UNTRACKED · PLANNING ONLY · For A2 rescale distances linearly × ~ 0.84 scale.

---

## §十一 · TASK FACTUAL CORRECTIONS (from `src/data/tasks/*` cold read)

### 11.1 L1 clean-table — correct entities & containers

**PREVIOUS ERROR (from old plan): "2 dirty cups → dishwasher, tissue → trash, fork, plate → plate cabinet" — WRONG.**
**Corrected (from actual task.ts):**

| Entity (spawned) | Object type (from schema) | Correct target container | Wrong targets in old plan that must be purged |
|---|---|---|---|
| `dirty-cup` × 1 (NOT ×2) | mug 0.273m | **Dishwasher / Cleaning zone counter-top dropzone** (kitchen counter; dishwasher PROVISIONAL proxy) | "Cup #2", "dining cupboard" |
| `tissue` × 1 | tissue small | **Trash can (in DK corner under sink)** | "any counter" |
| `fork` × 1 | utensil | **Utensil rack (in cabinet drawer / under counter utensil tray)** | "plate cabinet", "dishwasher (for utensils)" |

**L1 correct task graph:**
```
Spawn (Entrance door)
 └─→ Walk to Dining table (~3.5m)
      ├─ Pick up dirty-cup at table spot A
      ├─ Pick up tissue at table spot B
      └─ Pick up fork at table spot C
```

**Two distance variants:**

| Order | Route (A1 geometry) | Leg breakdown | Total approximate walking |
|---|---|---|---:|
| **Worst case** | cup→dishwasher→tissue→trash→fork→rack | Spawn→Table 3.5 + Table→Dishwasher 3.0 + DW→Table 3.0 (back for tissue) + Table→Trash 1.8 + Trash→Table 1.8 + Table→UtensilRack 2.4 | ~15.5m |
| **Recommended teaching order** (proximity-optimal = table sweep first): cup,fork,tissue → all 3 picked up before moving → Dishwasher (3.5+1.5+1.2)=6.2 → Trash 1.8 → Utensil Rack 2.4 → end | Spawn→Table 3.5, sweep gather (cup+fork+tissue ~1.2m) → Kitchen DW 3.0 → Trash 1.8 → Rack 2.4 | ~12.0m |

**First interaction time (L1):** Spawn → walk to table (3.5m at 2 m/s) = **~1.75 s** → pick cup. OK (≤ 5s guideline).

---

### 11.2 L2 leave-home — **CAT MOVES KEY. NOT PHONE.**

#### PREVIOUS ERROR: "猫事件可能移动 phone / key / umbrella" — WRONG.
Corrected (from leave-home.ts + cat-event schema):

| Item | Initial canonical position (L2 reset) | Moved by cat? | Final pick-up place | Notes |
|---|---|:---:|---|---|
| **key** × 1 | **Living coffee table** (near TV) | ✅ YES (moved by cat during Aha trigger when player first leaves Living for another room) | ~Living floor, south corner of sofa (hidden, must search after return) | **THIS is the object the cat physically relocates. Source of Aha.** |
| phone × 1 | Bedroom nightstand | ❌ NOT moved by cat | Picked up directly at nightstand (no memory decay needed) | Old plan said "可能移动 phone" → FACTUALLY WRONG. |
| umbrella × 1 | Entrance umbrella stand (UNVERIFIED_SEARCH_TARGET asset) | ❌ No cat access possible (cat is room-confined to Living during trigger) | Picked up at Entrance | No Aha link. |
| tray × 1 | Entrance console (PROVISIONAL proxy for shoe cabinet) | ❌ No cat access | Picked up at Entrance | Container, not a collectible. |

#### L2 GOLDEN PATH CORRECT 11-STEP: (verbatim from user instructions)
1. Initial observation & memory: player inspects key at coffee table, phone at nightstand, umbrella at stand.
2. Player leaves Living (e.g. to grab phone in Bedroom or to grab umbrella in Entrance).
3. **Cat event fires:** cat moves key → old key position is now empty → "key memory is stale".
4. Player returns to Living (to collect "remembered" key).
5. Player sees old key spot empty → detects mismatch → **Aha moment begins.**
6. Old key memory entry **expires / is marked unreliable** (memory system GUI shows faded / crossed).
7. Player searches nearby clues: cat paw print trail + faint jingle / sound cue 3D spatialized → draws search.
8. Player finds key at new hiding spot (under sofa cushion lip).
9. **Memory updated:** key record replaced / appended with new location (marked "fresh").
10. Player returns to pick up remaining items (phone, umbrella if missing) and places all 3 in Entrance tray/collection spot.
11. Walk to Entrance front door → trigger "ready to leave" → L2 complete.

#### L2 DISTANCE — TWO SEPARATE NUMBERS (DO NOT call both "17m")

| Distance metric | Segment breakdown | A1 geometry approximation (m) | Rationale / Aha status |
|---|---|---:|---|
| **AHA_PRE_LOOP_DISTANCE** (before Aha, step 1→4) | Entrance spawn → coffee table inspect key (3.5) → bedroom phone (5.5 one-way ~8.0 round trip to Living? Actually: coffee table (Living center west area → Entrance→Bedroom via hub = 2+5=7m to nightstand, then 7m back = 14) — actually shorter version: Entrance spawn (3.5) → coffee table inspect key (2) → out to Entrance umbrella inspect (2) → cat trigger fires (player leaving Living) → return to Living (2). Total AHA_PRE = Spawn→Key 3.5 + Key→UmbrellaInspect 3.5 + Return to Living 2.0 = **~9.0 m**. Shorter than old "17 m". | ≤ 17 m target ✅ |
| **FULL_GOLDEN_PATH_DISTANCE** (steps 1→11 include search+find+update+tray+exit) | AHA_PRE 9.0 + search around sofa (~8m loop) + find key (local 1m) + go to Bedroom for phone if not yet picked (8m) + Entrance tray placement (4m) + front door (1m) = **~31 m** | ≤ 30–40 m target ✅ |

(Old plan: "Both 17m" = WRONG. Fixed.)

---

### 11.3 L3 laundry-sort — **washer/dryer = FOUND_EXACT.**

#### PREVIOUS ERROR: "Kenney Furniture Kit 未见 washer / dryer 标准款" — WRONG.
Corrected from `ASSET_DIMENSION_LEDGER_DRAFT.md` + `ASSET_INVENTORY.md` cold read:

| Asset id | Kenney raw source | Status (updated from confirmed actual inventory) | Previous wrong text → correct |
|---|---|---|---|
| **washer** | Furniture Kit / Kitchen pack washer item | ✅ **FOUND_EXACT** | "未见 washer 标准款" → FOUND_EXACT |
| **dryer** | Furniture Kit / matching dryer model (kit / laundry) | ✅ **FOUND_EXACT** | "dryer unknown" → FOUND_EXACT |
| **washerDryerStacked** | (kit stacked variant) | ✅ **FOUND_EXACT** | "" |

L3 gameplay fallback still kept: **3 laundry baskets** + garment items (polybagged shirts / socks etc. from Food Kit or custom) = search targets remain gameplay fallback. Washer/dryer = exact.

L3 corrected key distances (A1):
- L3 spawn point = Living coffee table area (1m) → walk to Laundry via DK (≈ 9.0 m)
- 3 baskets × (≈ 4.0 m gather loop inside Laundry 5×5) = ≈ 12 m
- Each item → washer/dryer drop zone (inside Laundry 1.2 m each) = 7 × 1.2 ≈ 8.4 m
- Return to Living "done" spot = ≈ 9.0 m
**Total L3 ≈ 38.4 m** (inside 40 m experience density; close to boundary). OK with the relaxed formula in §十二.

---

## §十二 · DISTANCE & TIME BUDGET FORMULA REVISION

### 12.1 Previous error (MUST FIX):

> 2 m/s × 180 s = 36 m → "17 m hard cap"

This is **multiplicatively WRONG by ×10**:
2 m/s · 180 s = **360 m**, not 36 m. So "≤ 30% walking → ≤ 108 m walking" → cannot derive a 17 m physics cap from that. The old 17 m was a DESIGN INTENTION misrepresented as a physics theorem.

### 12.2 Replacement: split TEMPORAL_BUDGET vs EXPERIENCE_DENSITY_TARGET

```
TEMPORAL_BUDGET (engineering upper bound, relaxed):
  - player velocity candidate = 2.0 m/s (confirmed prototype)
  - L2 session length: 8 ~ 12 min real time (480 s ~ 720 s)
  - Pure walking time budget: ≤ 30% of session  →  144 ~ 216 s  →  288 ~ 432 m
  => Not a useful hard bound (too high to constrain topology); this is a sanity ceiling only.

EXPERIENCE_DENSITY_TARGETS (design intentions, not theorems):
  - L2 AHA_PRE_LOOP (before player hits the surprise):    ≤ 17 ~ 20 m   (feels tight/snappy)
  - L2 FULL_GOLDEN_PATH (search+resolve+exit):            ≤ 30 ~ 40 m   (search is meat of level)
  - Single interaction-less continuous walk segment:      ≤ 6 ~ 8 s walk → ≤ 12 ~ 16 m linear
  - Front door → first task point (e.g. coffee table):    ≤ 2 ~ 4 m
```

Label all of the above as **DESIGN TARGET**, not a theorem derived from "30% of 180 s". The 30% is an upper sanity bound, not design guidance for tightness.

### 12.3 Sanity check vs old docs

| Line in old docs | Corrected label |
|---|---|
| "≤ 17 m walking is derived from 30%×180s×2m/s = 36 m" → half that | ❌ Factually wrong (wrong multiplication + misrepresents derivation). |
| Replace with | "17 ~ 20 m Aha pre-loop is a **design target** for L2 experience density; temporal budget alone (360 m) permits much more, but we want short pre-loop distance to preserve 'the cat moved it while I was gone for 30s' emotional beat." ✅ |

---

## §十三 · FURNITURE & ASSET FACT SYNCHRONIZATION (Confirmed/Provisional/Unverified 3-state ledger)

Copied verbatim from **ASSET_DIMENSION_LEDGER_DRAFT + ASSET_CONFIRMED_GAP_LIST (read §二)** and marked against the three allowed states (CONFIRMED = exact model in approved inventory; PROVISIONAL = proxy/scale/composition; UNVERIFIED_SEARCH_TARGET = not yet sourced from approved-license source):

### 13.1 CONFIRMED (✓ asset audited + in ledger with AABB data + license OK)

| Asset | Model source | Raw AABB (m × m × m) | Final import scale | Final Envelope (approx.) | Evidence |
|---|---|---|---|---|---|
| sofa | Kenney Furniture Kit (sofa) | 0.98 × 0.46 × 0.41 (raw) | × 2.0 | 1.96 × 0.92 × 0.82 W×D×H | ASSET_DIMENSION_LEDGER_DRAFT §3 |
| coffee table (coffeeTableLong) | Kenney Furniture Kit | 0.661 × 0.23 × 0.40 | × 2.0 | 1.322 × 0.46 × 0.80 | Ledger §3 |
| television | Furniture Kit television | 0.820 × 0.080 × 0.52 | × 2.0 | 1.64 × 0.16 × 1.04 | Ledger §3 |
| TV stand (cabinetLowLong) | Furniture Kit cabinet low long | 1.00 × 0.44 × 0.50 | × 2.0 | 2.00 × 0.88 × 1.00 | Ledger §3 |
| bookshelf (cabinetTallWide) | Furniture Kit cabinet tall wide | 0.98 × 0.35 × 1.12 | × 2.0 | 1.96 × 0.70 × 2.24 | Ledger §3 |
| dining table (tableDiningLong) | Furniture Kit dining long | 1.10 × 0.60 × 0.74 | × 2.0 | 2.20 × 1.20 × 1.48 | Ledger §3 |
| dining chair (chairDining) | Furniture Kit dining chair | 0.44 × 0.48 × 0.88 | × 2.0 | 0.88 × 0.96 × 1.76 | Ledger §3 |
| washer | Furniture Kit washer (exact model in approved pack) | Audit Ledger §Kitchen Appliances (recorded) | × 2.0 | ~ 1.20 × 0.80 × 1.70 | ASSET_INVENTORY FOUND_EXACT |
| dryer | Furniture Kit dryer | Ditto | × 2.0 | ~ 1.20 × 0.80 × 1.70 | FOUND_EXACT |
| washerDryerStacked | Furniture Kit stacked variant | Ditto | × 2.0 | ~ 1.20 × 0.80 × 3.40 (ceiling clearance must be ≥ 3.4m; our rooms y=3m so UNSTACKED in layout plan later → single side-by-side) | FOUND_EXACT |
| Building Kit walls (wallStraightA + wallCorner + wallWindowSquare etc.) | Kenney Building Kit | rawT = 0.20 m per §九.B2 | NO T-axis scale (placed at SharedWall centerline, kept 0.20 raw) | Module pitch 2.0 m, window H 2.40 m | §九.B2 & §十 |
| independent door model (doorRotateSquareA) | Building Kit door-rotate-square | rawT 0.20 | NO scale in T (hinged at one end of doorway) | Width envelope 1.4×0.20 | Registry §八 |
| mug raw height 0.273 m (selected as L1 dirty-cup prop) | Food Kit / mug.obj+cup cross-check | mug raw size x=0.154, z=0.123, y=0.273 (AABB) | AS-IS (no scale) | Envelope 0.154 × 0.123 × 0.273 | ASSET_SCALE_AND_GLTF_CROSSCHECK §Mug |

### 13.2 PROVISIONAL (OK to start layout; final audit later during G1)

| Asset | Current proxy / assumption | Why provisional | Risk |
|---|---|---|---|
| furniture global project scale ×2.0 | Applied to all Kenney Furniture Kit models | Works for sofa/coffee/TV against real-life ranges; but bedDouble visual still to Blender-audit for actual GLB | Low (validated by 9/11 GLB vs OBJ match in scale crosscheck) |
| bedDouble visual envelope | Proxy = "2.10 W × 2.40 L × 0.50 H" assuming a real domestic double | Actual Kenney bed GLB raw AABB not yet measured due to pending Blender audit (GLB contains extra mattress/blanket geom) | Medium (may require A1→A2 boundary check in G1) |
| nightstand proxy | cabinetLowShort Furniture Kit ×2.0 envelope ~ 1.00 × 0.80 × 0.70 H | Real nightstand should be ~ 0.55 × 0.45 × 0.60; proxy too large | Low (room has space; fine for layout placeholder) |
| wardrobe proxy | cabinetTallNarrow × 2.0 envelope = 1.00 × 0.80 × 2.40 H (height > 3m room OK) | Actual wardrobe TBD (could use 2× cabinetTallNarrow side by side) | Low |
| shoe cabinet proxy | cabinetLowMedium × 2.0 envelope ~ 1.4 × 0.80 × 0.70 | Shoe cabinet normally 0.35m depth; proxy 0.80 deep; still fits Entrance | Low |
| dishwasher proxy | Under-kitchen-counter compartment (no Kenney dishwasher exact) | Dishwasher PROVISIONAL (may use stacked cabinet low below sink or render texture only) | Medium (affects L1 dirty-cup drop zone visual only; gameplay drop zone = invisible box anyway) |
| kitchen counter composition | Composed from 3 × counterLow segments Furniture Kit (module × 2.0 = 2.00 m each × 3 = 6.00 m continuous run) | 3-segment joints need Z-fighting QA later; may need 0.5mm offset | Low |

### 13.3 UNVERIFIED_SEARCH_TARGET (DO NOT claim specific Poly Pizza model URLs)

Previous old plan text listed exact Poly Pizza "umbrella-stand by X, curtain by Y, shoes by Z" with URLs — ALL of these are **UNVERIFIED_SEARCH_TARGET** per §二 ASSET_GAP_LIST and §十三 user spec:

| Asset | Real need (room) | Status | Do not write: |
|---|---|:---:|---|
| umbrella stand | Entrance (needs 1.00 × 0.40 × 0.80 H approx.) | UNVERIFIED_SEARCH_TARGET | —DO NOT write a Poly Pizza model id, author, direct-link URL or poly-count. Only write "Umbrella Stand (search target; license CC0-BY ok; Kenney not present)" |
| curtain | Living + Bedroom windows | UNVERIFIED_SEARCH_TARGET | Same; can write "Low-poly fabric curtain plane or 2-stack plane (asset search pending; may be procedural card for MVP)". |
| shoes | Entrance floor 2-3 pairs | UNVERIFIED_SEARCH_TARGET | Same; no named URLs. |

End of §11-13 route + formula + asset-sync ledger.
