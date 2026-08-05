# Asset Archive Manifest

Document ID: ASSET_ARCHIVE_MANIFEST
Scope: HOMEMEM ARENA approved Kenney three-pack audit
Date: 2026-08-03
Status: U N T R A C K E D (do not commit)

---

## 1. Audit Location (OUTSIDE REPO)

```
/Users/azq/asandstar/homemem-arena-asset-audit-2026-08-03/
├── raw/            three official Kenney ZIPs untouched
├── unpacked/       per-pack extracted tree (generated via unzip -q)
├── converted/      GLB conversion drill (EMPTY this pass — Blender not installed)
├── previews/       render drill (EMPTY this pass)
├── licenses/       SOURCE.md / LICENSE.txt / CHECKSUMS.txt / ARCHIVE_CONTENTS.txt per pack
├── manifests/      contents lists, sha256, dimension ledger TSV/JSON
├── scripts/        audit_kit.sh + future Blender .py
└── logs/           head requests, audit logs, download timestamps
```

No models, textures, or archives were copied into the project repo.

---

## 2. Raw File Inventory

| # | Pack ID | Filename in raw/       | Bytes       | HTTP CDN provenance                          |
|---|---------|------------------------|-------------|----------------------------------------------|
| 1 | furniture-kit | kenney_furniture-kit.zip | 5,130,729 | Kenney in-browser download (CC0 page tag + donate dialog bypass via "Continue without donating…" button) — user-assisted copy from Downloads to raw |
| 2 | building-kit  | kenney_building-kit.zip  | 1,598,905 | same flow |
| 3 | food-kit      | kenney_food-kit.zip      | 4,606,270 | same flow |

Head probes `curl -sS -I -L https://kenney.nl/content/<pack>.zip` returned HTTP/2 404 (content URL pattern deprecated); direct `cdn.kenney.nl` hit returned SSL MITM self-signed. Both paths were rejected per §4. Browser download through the real `kenney.nl/assets/<pack>` donate-continue flow (the same flow a human user would take) was used, which is the most official source available in this network environment.

---

## 3. Magic + Integrity

Magic bytes (offset 0..3): all three ZIP = `50 4B 03 04` (standard local file header).

### §4 Safety results

| Test | furniture-kit | building-kit | food-kit |
|------|---------------|--------------|----------|
| unzip -tq (no errors) | PASS | PASS | PASS |
| HTML false-positive head scan | PASS | PASS | PASS |
| Path traversal / absolute links | CLEAN | CLEAN | CLEAN |
| Case-insensitive name collision | CLEAN | CLEAN | CLEAN |
| OBJ → MTL reference broken | 0 | 0 | 0 |
| MTL → TEX reference broken | 0 | 0 | 0 |
| Bundled License text count | 1 | 1 | 1 |

### §4 SHA-256

| Pack | SHA-256 |
|------|---------|
| furniture-kit | e67652d0932cee41683f74711c03d3e192a2af9979ef8e6b237711f5482d46b0 |
| building-kit  | 2740ef5772fb5fb3d7aab881db22d129f6b68afe711b1a79e6d5e9e19cf3eec6 |
| food-kit      | cdad90853682499b94c9fda2f87678b24bfd8f3264e0ed323f6b6a27fd7c6f6f |

Original source of truth: `manifests/<pack-id>.manifest.sha256` and `licenses/<pack-id>/CHECKSUMS.txt` in the audit directory.

---

## 4. Unpacked File Counts

| Pack | Listed entries (zip -l) | Extracted files (find -type f) | Delta explanation |
|------|--------------------------|--------------------------------|-------------------|
| furniture-kit | 1559 | 1546 | 13 directory rows (non-file) in the zip -l listing |
| building-kit  | 418 | 407 | 11 directory rows |
| food-kit      | 1020 | 1009 | 11 directory rows |

All deltas are directory-vs-file accounting; no hidden files and no silent extraction failures.

---

## 5. Per-Pack Directory Topology

### furniture-kit (v2.0, 2018-10-20)
```
unpacked/furniture-kit/
├── Isometric/             (140 PNG renders per model, per-view isometric sheets → 562 PNGs here)
├── Side/                  (140 PNG orthographic renders)
├── Models/
│   ├── FBX format/        (+Textures/ empty → solid color MTL)
│   ├── OBJ format/        (+Textures/ empty)
│   ├── GLTF format/       (misnomer; 140 *.glb)
│   ├── DAE format/        (140 Collada)
│   └── STL format/        (140 3D-printable STL)
├── Preview.png
├── Sample.png
├── License.txt
└── Instructions.url / Kenney.url / Patreon.url
```

### building-kit (v1.0, 2025-03-29)
```
unpacked/building-kit/
├── Models/
│   ├── FBX format/
│   ├── OBJ format/
│   ├── GLB format/
│   └── Textures/          (variation-a.png, 512×512 single atlas)
├── Previews/              (81 PNG module previews, one per module)
├── Preview*.png (×2)
├── Sample.png
├── Overview.html          (interactive browser for 79 modules)
├── License.txt
└── *.url (3)
```

### food-kit (v2.0, 2024-06-26)
```
unpacked/food-kit/
├── Models/
│   ├── FBX format/        (+Textures/colormap.png)
│   ├── OBJ format/        (+Textures/colormap.png duplicate)
│   └── GLB format/        (+Textures/colormap.png duplicate)
├── Previews/              (202 PNGs one per prop)
├── Preview.png
├── Overview.html          (interactive browser for 200 props)
├── License.txt
└── *.url (3)
```

---

## 6. Naming Convention

Stable naming across formats — for model `<stem>`:
- `Models/FBX format/<stem>.fbx`
- `Models/OBJ format/<stem>.obj` + `<stem>.mtl`
- `Models/GLB format/<stem>.glb` (building/food) — or `Models/GLTF format/<stem>.glb` furniture (misnomer dir name)

No per-format stem mangling.

---

## 7. OBJ-FBX-GLB Correspondence

Per-pack cross-format correspondence confirmed 100% by name:
- furniture 140: 140 FBX ↔ 140 OBJ ↔ 140 GLB ↔ 140 DAE ↔ 140 STL (same stems)
- building 79: 79 FBX ↔ 79 OBJ ↔ 79 GLB
- food 200: 200 FBX ↔ 200 OBJ ↔ 200 GLB

No missing-format holes.

---

End of manifest. Next doc: ASSET_LICENSE_VERIFICATION.md
