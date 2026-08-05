# Kenney Furniture Kit — Source Attribution

## Pack
- **Name:** Kenney Furniture Kit
- **Official source URL:** https://kenney.nl/assets/furniture-kit
- **Pack version:** 1.0 (Kenney Furniture Kit, release date 2018-10-20 based on file mtimes)
- **Checked / audit date:** 2026-08-03
- **Audit directory source:**
  `/Users/azq/asandstar/homemem-arena-asset-audit-2026-08-03/unpacked/furniture-kit/`

## License
- **License:** CC0 1.0 Universal (CC0 1.0) — Public Domain Dedication
- See `./LICENSE.txt` for the full license text included with the Kenney pack.

## Source ZIP SHA-256 (raw audit archive)
```
2740ef5772fb5fb3d7aab881db22d129f6b68afe711b1a79e6d5e9e19cf3eec6
```

## Imported stems (WP0A CORE LIVING ASSET)
Only the following 5 furniture stems from Kenney Furniture Kit are imported into
this repository under `public/assets/models/kenney/furniture/`:

| stem              | target file                              | role in LIVING-A layout |
|-------------------|------------------------------------------|-------------------------|
| `loungeSofa`      | `furniture/loungeSofa.glb`               | main sofa (Sofa Focus)  |
| `tableCoffee`     | `furniture/tableCoffee.glb`              | coffee table (key free initial location) |
| `televisionModern`| `furniture/televisionModern.glb`         | TV above tv-cabinet     |
| `cabinetTelevision`| `furniture/cabinetTelevision.glb`       | TV cabinet (tv-stand)   |
| `bookcaseOpen`    | `furniture/bookcaseOpen.glb`             | open bookshelf (living wall right) |

All stems copy their original Kenney binary verbatim; no re-export,
re-compression, or binary modification is performed.

## Imported GLB SHA-256
See `./MANIFEST.sha256` for 5 imported GLB checksums.
Reproduced here for quick reference:
```
1886b811c0d3ad0d8525a4fd43adf4112c497c8e0ed906f06877ca3517f4c7dd  furniture/loungeSofa.glb
e38bea760fbd514efbb75528d09b4752c91af44677bbb97e6d4386c263525179  furniture/tableCoffee.glb
d89519ad0a5f28b5b0dccb0d83209dccf610cda959578238dd21bbf9e219cfc6  furniture/televisionModern.glb
811719593d676ff76f7b5904d52c845ce0396af2bc9a6a2636c4818ead320b99  furniture/cabinetTelevision.glb
750702218d68c062b15dfef6ab06a4014d1cfa8bd05f02e57c53b7e13bec157c  furniture/bookcaseOpen.glb
```

## Verification
- Each imported GLB:
  - magic header = `glTF`, version = 2 (GLB container 2.0)
  - 0 external buffer URIs; 1 embedded bin chunk
  - 0 external image URIs
  - no Draco (`KHR_draco_mesh_compression`)
  - no Meshopt (`EXT_meshopt_compression`)
  - no KTX2 (`KHR_texture_basisu`)
  - no animations
  - 1 mesh per GLB (meshCount=1)

Material counts:
- loungeSofa: 2 materials (cushion + frame)
- tableCoffee: 1 material
- televisionModern: 2 materials (screen + bezel)
- cabinetTelevision: 1 material
- bookcaseOpen: 1 material

## Banned / deferred stems per WP0
Per plan §Ⅲ the following Kenney stems are NOT imported in WP0A:
`loungeChair`, `desk`, `chairDesk`, `cabinetBedDrawer`, `kitchenCabinetDrawer`,
`washer`, `dryer`, `bedDouble`, `mug`, `door`, `window`, `wall`, placeholder
generics, and any Poly Pizza assets. These are scoped to later work packages.

## Provenance
Original packed ZIP (renamed) was received from:
- Kenney storefront > CC0 download (no payment required), verified by same
  `2740ef57...` SHA-256 against the audit manifest dated 2026-08-03.
