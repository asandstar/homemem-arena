# Asset Conversion Trial Report

Document ID: ASSET_CONVERSION_TRIAL_REPORT
Date: 2026-08-03
Scope: Sofa / Coffee Table / Bed Double → GLB (§12)
Status: U N T R A C K E D

---

## 0. Status Summary

Trial status: **SKIPPED — BLENDER_NOT_AVAILABLE**.

`blender --version` on this host returned no binary (§10 check result: BLENDER_NOT_AVAILABLE). Per §10 rule, this audit STOPS the conversion drill rather than auto-installing, and instead records the intended plan with enough detail that rerunning on any Blender 3.6+ LTS host can reproduce the same audit in under 10 minutes.

This does **not** block the Gate. Since §12 is a drill (not a production bake), and Kenney packs already ship native GLB binaries for all three candidates, the conversion can be validated later without affecting the topology plan.

---

## 1. Original §12 Scope

Audit scope, still enforced (not expanded):
- Only THREE candidates: Sofa (loungeSofa), Coffee Table (tableCoffee), Bed Double (bedDouble).
- NO batch conversion of all 140 / 79 / 200.
- NO copying converted GLBs into `public/assets/models`.
- Output ONLY inside `$AUDIT_DIR/converted/furniture-kit/<name>/`.

### Intended Inputs (official pack)

| # | Model  | Chosen authoring input | Fallback |
|---|--------|-------------------------|----------|
| 1 | Sofa | `unpacked/furniture-kit/Models/FBX format/loungeSofa.fbx` | `…/OBJ format/loungeSofa.obj` if the FBX importer trips on legacy 2018 FBX flags |
| 2 | Coffee Table | `…/FBX format/tableCoffee.fbx` | `…/OBJ format/tableCoffee.obj` |
| 3 | Bed Double | `…/FBX format/bedDouble.fbx` | `…/OBJ format/bedDouble.obj` |

Reason: Kenney FBXes are typically the "source of truth" format for their newer packs; OBJ used only as fallback because we confirmed it parses in §11 with zero missing MTL/TEX references.

### Intended Outputs (per model)

```
$AUDIT_DIR/converted/furniture-kit/
├── loungeSofa/
│   ├── loungeSofa.glb                    ← embedded resources, pivot-corrected, scale ×2.0, original atlas (solids)
│   ├── loungeSofa-solidmat.glb           ← pure solid untextured variant for style tests
│   └── loungeSofa.CONVERSION_LOG.txt     ← command/script used, warnings, sizes, tris, meshes, mats
├── tableCoffee/
│   ├── tableCoffee.glb
│   ├── tableCoffee-solidmat.glb
│   └── tableCoffee.CONVERSION_LOG.txt
└── bedDouble/
    ├── bedDouble.glb
    ├── bedDouble-solidmat.glb
    └── bedDouble.CONVERSION_LOG.txt
```

---

## 2. Requirements Still Enforced on Re-run

Per §12 the re-run MUST:

1. Embedded resources (not external textures / bin).
2. No Draco, no Meshopt, no KTX2 — plain GLB 2.0.
3. Keep original model copy elsewhere (raw archive is already read-only and preserved; converted copy is additive only).
4. Pivot reset to **bottom-center XZ**. Specifically: for furniture-kit the origin is at rear corner; after correction, object `localToWorld(0,0,0)` must land at the point below the visual center of the footprint at floor level.
5. Scale normalized to 1 unit = 1 meter (furniture-kit FBX raw unit = 0.5 m → apply uniform × 2.0 at bake).
6. Preserve original material names and color Kd values (furniture-kit is solid-color MTL). No baking to textures.
7. Emit a solid-material variant: `*-solidmat.glb` — all meshes share one single standard material (flat shading, no textures) for style comparison.
8. Do NOT merge unrelated meshes. For furniture-kit multi-mtl objects (e.g. bedDouble = carpetWhite + wood + metal + carpet), keep meshes/materials per-part.
9. Do NOT edit geometry. No decimation, no vertex welding, no re-triangulation beyond the importer default.
10. Preserve the original copy intact (it is, we never touch raw/ or unpacked/).

---

## 3. Blender Script Sketch (for re-run)

Place in `$AUDIT_DIR/scripts/blender_convert_three.py` (to be written on Blender host):

```python
# Blender background CLI:
#   blender --background --python scripts/blender_convert_three.py -- \
#       --pack-root /path/to/audit/unpacked/furniture-kit \
#       --out-root  /path/to/audit/converted/furniture-kit
import bpy, sys, os, shutil
args = sys.argv[sys.argv.index("--")+1:]
# … parse args …
JOBS = [
    ("loungeSofa",   "FBX format/loungeSofa.fbx",   2.0),
    ("tableCoffee",  "FBX format/tableCoffee.fbx",  2.0),
    ("bedDouble",    "FBX format/bedDouble.fbx",    2.0),
]
for name, rel, scale in JOBS:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    src = os.path.join(pack_root, rel)
    bpy.ops.import_scene.fbx(filepath=src)
    obs = [o for o in bpy.context.scene.objects if o.type == 'MESH']
    # --- 1. compute global AABB at raw scale ---
    import mathutils
    mn = mathutils.Vector(( 1e9, 1e9, 1e9))
    mx = mathutils.Vector((-1e9,-1e9,-1e9))
    for o in obs:
        for v in o.bound_box:
            p = o.matrix_world @ mathutils.Vector(v)
            mn.x = min(mn.x, p.x); mn.y = min(mn.y, p.y); mn.z = min(mn.z, p.z)
            mx.x = max(mx.x, p.x); mx.y = max(mx.y, p.y); mx.z = max(mx.z, p.z)
    center = (mn + mx) * 0.5
    tx = -center.x
    ty = -mn.y          # floor align (already 0, keeps it)
    tz = -center.z
    # --- 2. bake move to root + scale 1u=1m into mesh data ---
    for o in obs:
        o.select_set(True)
        o.location.x += tx
        o.location.y += ty
        o.location.z += tz
        o.scale *= scale
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    out_dir = os.path.join(out_root, name)
    os.makedirs(out_dir, exist_ok=True)
    base = os.path.join(out_dir, name)
    # --- 3. export original-material GLB ---
    bpy.ops.export_scene.gltf(
        filepath=base + ".glb",
        export_format='GLB',
        export_draco_mesh_compression_enable=False,
        export_meshopt_compression=False,
        export_image_format='AUTO',
        export_apply=True,
        export_animations=False,
    )
    # --- 4. emit solidmat variant (one shared material) ---
    solid = bpy.data.materials.new(name="SolidAudit")
    solid.use_nodes = False
    solid.diffuse_color = (0.76, 0.72, 0.68, 1.0)  # warm domestic scifi primer
    for o in obs:
        for s in o.material_slots:
            s.material = solid
    bpy.ops.export_scene.gltf(
        filepath=base + "-solidmat.glb",
        export_format='GLB', export_draco_mesh_compression_enable=False,
        export_meshopt_compression=False, export_image_format='NONE',
        export_apply=True, export_animations=False,
    )
    # --- 5. append CONVERSION_LOG.txt manually outside this sketch ---
```

On rerun, also run the §13 previews script which sets up 7 cameras × 3 lighting rigs per model, emits PNG to `$AUDIT_DIR/previews/furniture-kit/<name>/<camera>_<light>.png`.

---

## 4. Captured During §11 (Partial Metrics)

Even without Blender, we know the raw geometry, so here is the "before" size and raw AABB for all three candidates (the rest are to be filled in after Blender runs):

| Model | Input size (OBJ bytes proxy) | Raw AABB (raw units) | Normalized AABB after ×2.0 (m) | Meshes (estimated) | Materials (named MTL count) | Animations |
|-------|------------------------------|----------------------|--------------------------------|--------------------|----------------------------|------------|
| loungeSofa.glb (already in pack!) | `…/GLTF format/loungeSofa.glb` inside Kenney pack = native GLB already | 0.98 × 0.46 × 0.41 u | 1.96 × 0.92 × 0.82 m | ~4 (frame, cushion, legs, detail) | 2 (carpet, wood) from MTL | 0 |
| tableCoffee | already native GLB in pack | 0.661 × 0.230 × 0.400 u | 1.322 × 0.460 × 0.800 m | ~5 (top, legs, cross-brace) | 1 (wood) | 0 |
| bedDouble | already native GLB in pack | 0.956 × 0.375 × 1.125 u | 1.912 × 0.750 × 2.250 m | ~6 (frame, mattress, pillows, carpet base, headboard, metal) | 4 (carpetWhite, wood, metal, carpet) | 0 |

### Expected outputs on a healthy re-run

- GLB size per furniture piece: between 20 KB and 200 KB (low-poly meshes, no textures → furniture-kit solid color mats bake to tiny GLB).
- Triangle count (all ≤2000 tris; typically <1000 for Kenney stylized).
- No conversion warnings in the glTF exporter (Kenney geometry is clean).

This report will be amended on Blender-hosted rerun with exact sizes, tris, meshes, and warnings. Currently all three rows are left incomplete by design.

---

## 5. Visual Difference / Warnings

- Visual difference between native Kenney GLB and re-exported GLB (the actual point of the drill) is expected to be zero within floating point — both are low-poly triangulated meshes with the same vertex color or solid MTL inputs.
- The only intended delta is the pivot recenter + scale ×2.0 + optional single-solid-mat override variant.

No visual difference or warnings are captured this pass.

---

## 6. §13 Preview Catalog (Linked)

Same blocker: previews require either Blender cycles/Eevee render or a three.js headless viewer script. Not generated.

Full preview directory plan and lighting rigs are documented in ASSET_PREVIEW_CATALOG.md (§13 companion doc).

---

## 7. Audit Gate Impact

Final Gate flags §12 conversion drill as **INCOMPLETE_LIMITATION → GO_TO_HOUSE_TOPOLOGY_PLAN_WITH_ASSET_LIMITATIONS**.

- The topology plan proceeds on the numbers in ASSET_DIMENSION_LEDGER_DRAFT.md (which is FACT).
- Before G1 actual import bakes (future workstream), re-run this conversion drill once on a Blender host and compare Kenney-native GLB vs our re-exported GLB. If they agree within 1 mm, choose the Kenney-native GLB directly (simpler pipeline) and apply the ×2.0 + pivot-fix in the loader only. If they diverge (FBX importer bug), then use our own Blender-baked GLBs.

