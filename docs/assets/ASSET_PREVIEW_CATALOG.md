# Asset Preview Catalog

Document ID: ASSET_PREVIEW_CATALOG
Date: 2026-08-03
Scope: §13 unified preview renders for the three conversion drill candidates (Sofa, Coffee Table, Bed Double)
Status: U N T R A C K E D — NOTE: Not generated this audit (BLENDER_NOT_AVAILABLE). This document describes the plan so re-run on a Blender host or headless three.js viewer host is deterministic.

---

## 0. Preview Inventory Status

| Candidate | Front | 45° | Side | Top | Game-dist 2m | Game-dist 3m | +1m reference cube overlay |
|-----------|-------|-----|------|-----|--------------|--------------|----------------------------|
| loungeSofa     (orig mat + warm interior lighting B) | SKIPPED | SKIPPED | SKIPPED | SKIPPED | SKIPPED | SKIPPED | SKIPPED |
| loungeSofa-solidmat + three lighting rigs (A/B/C)     | SKIPPED | SKIPPED | SKIPPED | SKIPPED | SKIPPED | SKIPPED | SKIPPED |
| tableCoffee    (orig mat + solid × 3 lights)          | SKIPPED | SKIPPED | SKIPPED | SKIPPED | SKIPPED | SKIPPED | SKIPPED |
| bedDouble      (orig mat + solid × 3 lights)          | SKIPPED | SKIPPED | SKIPPED | SKIPPED | SKIPPED | SKIPPED | SKIPPED |

Target output root on re-run:
```
$AUDIT_DIR/previews/
└── furniture-kit/
    ├── loungeSofa/
    │   ├── <camera>_<light>.png            (7 cameras × 3 lights = 21)
    │   └── <camera>_<light>_solidmat.png   (21 solid-mat variant)
    ├── tableCoffee/  (same 42)
    └── bedDouble/    (same 42)
```

Total expected = 126 PNG. Add `previews/INDEX.html` auto-generated thumbnails page (optional on Blender host, not required).

---

## 1. Camera Definitions

All cameras are **orthographic** for scale-comparability, except 2m/3m game-distance shots which are **perspective** matching HOMEMEM ARENA default vertical FOV = 60°.

Camera list, per model, using world axes after pivot-fix + scale (see §11 / ledger):

| Camera ID | Projection | View | Placement (look-at target = model footprint center, height 0.4×H up from floor) | FOV / Orthographic size |
|-----------|------------|------|------------------------------------------------------|-------------------------|
| `front`     | Orthographic | Front (−Z face) | camera @ (0, 0.6×H, −3m), target = model visual center | ortho size = 3m |
| `diag45`    | Orthographic | 45° isometric-ish | camera @ (+3m, +2.5m, −3m) rotated 45° around Y, target center | 4m |
| `side`      | Orthographic | Side (+X) | camera @ (+3m, 0.6×H, 0), target center | 3m |
| `top`       | Orthographic | Top-down | camera @ (0, +4m, 0.01), target center, looking down | 3m |
| `game2m`    | Perspective (FOVy 60°) | Player eye distance 2.0 m | eye @ (2.0, 1.55, −0.1) looking slightly down to model visual center; model front faces −Z per §11 ledger | 60° |
| `game3m`    | Perspective (FOVy 60°) | Player eye distance 3.0 m | eye @ (3.0, 1.55, −0.1) | 60° |
| `refcube`   | Orthographic | Same as diag45, with a 1×1×m reference cube rendered wireframe around/beside the model | — |

Reference cube (refcube view): origin corner at (0,0,0), opposite corner at (1,1,1). Lines in 10% gray dashed. Purpose: eyeball that model scale ×2.0 landed us in sane meters.

---

## 2. Three Lighting Rigs (§13.A/B/C)

### 13.A — Neutral Daylight
- Ambient 0.35 gray (not tinted)
- Key sun: vector roughly (+X, +Y, −Z) rotated 35° above horizon, color 6500 K, intensity 1.0
- Fill: opposite direction, intensity 0.25, neutral
- Background: very light warm white, not pure white (sofas still read)
- Tone mapping: Aces / standard, exposure 1.0

### 13.B — Warm Interior Evening
- Ambient: deep cream (#f4d9b5, 0.22)
- Key: 2700 K warm point light placed 1.5 m 45° above + side (floor lamp style), radius 0.15, intensity 120 lm
- Rim: 2200 K secondary 1.8 m behind sofa opposite direction (ceiling lamp style), 12 lm
- Background: #1a120b (warm dark brown)
- Tone mapping: filmic, exposure +0.3

### 13.C — Nostalgic Night Home (scifi tint)
- Ambient: navy blue (#0f1935, 0.24) — nostalgic domestic scifi
- Key: 2400 K warm orange desk-lamp point light close above side table position, 80 lm
- Subtle rim: 4800 K cool blue from TV side (cyan-ish #6e9bff), 8 lm only
- Background: #0b1226 (night deep blue)
- Tone mapping: filmic / ACES variant, exposure 0.9 to keep darks deep
- Strong rim on mug (sofa / bed) handles to test silhouette in the intended final "dark kitchen with a stray light on" mood.

Preview purpose per §13:
- A → check stylistic silhouette.
- B → verify warm evening light doesn't collapse everything into a single brown blob (multi-mtl Kenney solid colors should separate).
- C → verify handle silhouette and dark-blue-night readability for the dirty mug gameplay cues; verify carpet vs wood vs metal still separable under nostalgic scifi palette.

---

## 3. Preview Acceptance Checklist (to be filled by re-run operator)

Per model per rig:

- [ ] Warm lighting B: sofa body vs wood frame vs cushion read as three distinct tones, not a blob.
- [ ] Warm lighting B: coffee table wood tone does NOT merge with background warm brown.
- [ ] Night lighting C: mug handle silhouette readable on 2m shot (pixel width of handle ≥ 2 px at 1280×720).
- [ ] Night lighting C: bed bedding vs carpet base vs wood frame visually separable.
- [ ] Top view footprint of every model equals ASSET_DIMENSION_LEDGER_DRAFT.md top-down AABB.
- [ ] Ref-cube overlay shows sofa between 1.9 and 2.0 m long; bed double between 1.9 and 2.0 m wide × 2.25 m long; coffee table ~1.3 m long.
- [ ] Solid-mat variant renders confirm no shading artifacts (missing normals, inverted faces).
- [ ] No clipping / flipped faces in any view.

---

## 4. Relationship to Art Direction Research

Per `VISUAL_AUDIO_DIRECTION_NOSTALGIC_DOMESTIC_SCIFI.md`, the previews here are explicitly **NOT** the final scene setup. They are a pure single-item scale/style check to:
- Reject a model whose proportions collapse at game distance.
- Reject a model whose solid-mat variant (used by fallbacks) looks out of place with the direction.
- Reject a candidate whose dark-scene legibility is bad (important for leave-home "last 20 seconds" lighting).

All three current candidates (sofa / coffee / bed) are expected to pass, but we need the renders to confirm before topology hard-codes dimensions. Skipping this does **not** block Gate, because:
- Ledger dimensions are FACT from vertices.
- Kenney packs are consistent CC0 and match prior research stylistic selection.
- Art direction research already picked Kenney as the primary pack; nothing in the vertex data contradicts.

---

## 5. Headless three.js Alternative (if Blender still unavailable)

If a future host still lacks Blender, we can generate the 126 PNGs with `three.js` + `puppeteer` headless:
- Write `scripts/render_three_preview.html` — load the candidate GLB, set up cameras A/B/C, render to offscreen canvas, call puppeteer `screenshot()`.
- `puppeteer` uses 1280×720 viewport.
- The three.js scene matches the exact camera matrices + lighting intensity/Kelvin/position definitions from §1.

Output filenames stay identical.

Either way (Blender or three), the final deliverable is a folder of 126 PNGs in the audit directory plus a thumbs index.

---

End of catalog. To be executed on a host with Blender ≥ 3.6 LTS or equivalent headless renderer.

