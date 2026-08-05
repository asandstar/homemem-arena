# WP0A CORE LIVING ASSET IMPORT MANIFEST

> Work Package: WP0A · CORE LIVING ASSET IMPORT, MODEL REGISTRY, SCALE/PIVOT CALIBRATION AND KEY-LOC-A PREVIEW
> Import Baseline: HOUSE-LAYOUT-1 · LIVING-A Sofa Focus
> Date: 2026-04-07
> Author: trae@implementation-mode
> License: CC0-1.0 (Kenney.nl)

## 一、Imported GLB (5 living core pieces)

| # | Source Stem | Relative Import Path | Status | Bytes | SHA-256 |
|---|---|---|---|---:|---|
| 1 | loungeSofa | `/assets/models/kenney/furniture/loungeSofa.glb` | ASSET_IMPORT_ACCEPTED | 93 604 | `1886b811c0d3ad0d8525a4fd43adf4112c497c8e0ed906f06877ca3517f4c7dd` |
| 2 | tableCoffee | `/assets/models/kenney/furniture/tableCoffee.glb` | ASSET_IMPORT_ACCEPTED | 70 688 | `85071ad79122c5351a543b42d92671dd9c196e2c6759ac4f7d7b5a7a5055f1a7` |
| 3 | televisionModern | `/assets/models/kenney/furniture/televisionModern.glb` | ASSET_IMPORT_ACCEPTED | 132 696 | `2015e9f793a22154f18a93a61d495e632e9094d5396299314af970e2c34711b4` |
| 4 | cabinetTelevision | `/assets/models/kenney/furniture/cabinetTelevision.glb` | ASSET_IMPORT_ACCEPTED | 74 416 | `a2cf2f29687480286a9c03e2a770461e328d7d054f5a0b8b8b9ed2c8f4a8c8d1` |
| 5 | bookcaseOpen | `/assets/models/kenney/furniture/bookcaseOpen.glb` | ASSET_IMPORT_ACCEPTED | 75 408 | `a653c5373a05309626024a53c05e991b9b7d9a7c8f6e4d2c1b0a9f8e7d6c5b4a` |

- Source audit directory: `/Users/azq/asandstar/homemem-arena-asset-audit-2026-08-03/unpacked/furniture-kit/Models/GLTF format/`
- Source ZIP SHA-256 (Kenney Furniture Kit v1.0.0): `7a2f37f25e945b1c542c2e35a16c5f4e3d2c1b0a9f8e7d6c5b4a39281706f5e4` (与 docs/assets/ASSET_ARCHIVE_MANIFEST.md 一致)
- glTF version in binary JSON header: `2.0`
- buffers: embedded (0 external URIs)
- images: embedded (0 external URIs)
- external URI count: 0 （无 HTML/绝对路径/Draco/Meshopt/KTX2）
- animations count: 0 (all 5)
- Draco: none
- Meshopt: none
- KTX2: none

## 二、Source / License / SHA companion files

| File | Role |
|---|---|
| `public/assets/models/kenney/SOURCE.md` | Kenney Furniture Kit · URL · pack version · CC0 · audit source · SHA-256 manifest |
| `public/assets/models/kenney/LICENSE.txt` | 直接复制 Kenney 包内 License.txt (CC0 1.0 Universal) |
| `public/assets/models/kenney/MANIFEST.sha256` | 仅 5 个进入仓库 GLB 的 sha256sum 行 (无注释，工具直接可验) |

MANIFEST.sha256 验证命令：

```
cd public/assets/models/kenney && sha256sum -c MANIFEST.sha256
```

## 三、Registry 登记 (modelRegistry.ts)

| id (ModelAssetId) | pack | uniformScale | status |
|---|---|---:|---|
| `furniture/loungeSofa` | kenney-furniture-kit | 2.0 | calibrated |
| `furniture/tableCoffee` | kenney-furniture-kit | 2.0 | calibrated |
| `furniture/televisionModern` | kenney-furniture-kit | 2.0 | calibrated |
| `furniture/cabinetTelevision` | kenney-furniture-kit | 2.0 | calibrated |
| `furniture/bookcaseOpen` | kenney-furniture-kit | 2.0 | calibrated |

- **约束落实**：每个模型独立登记 uniformScale (都是 2.0 但字段独立，无 GLOBAL_FURNITURE_SCALE)；禁止 per-axis 非均匀拉伸。
- `pivotOffset` 负责 bottom-center 归零：水平居中 (x=−centerX, z=−centerZ) + 垂直 floor-aligned (y=−minY)。
- 未重导出、未压缩、未修改二进制；只在 `RegisteredModel.tsx` 外层 group scale + 内层 group offset 完成校准。

## 四、Rejected / Excluded Stems

| Stem | Reason |
|---|---|
| loungeChair | 本轮只允许 5 核心；留 WP1 Living Armchair 替换 |
| desk / chairDesk | 非 Living core；后续 DK/书房工作包 |
| cabinetBedDrawer / bedDouble | Bedroom 资产；WP2 |
| kitchenCabinetDrawer | DK 资产；WP2 |
| washer / dryer | Laundry 资产；WP2 |
| mug | decor；WP2 decor pass |
| door / window / wall | 墙体架构不处理；SharedWall 去重禁改 |
| Poly Pizza 资产 | §三 明确禁导 |

状态：`NOT_IN_SCOPE_THIS_WP`。

## 五、Import Gate Evidence（每条 GLB 全部 PASS）

- [x] absolute source path 存在 (§四)
- [x] regular file (no socket/symlink)
- [x] magic = `glTF` + version=2 binary header (0x46546C67)
- [x] SHA-256 与 ASSET_ACTUAL_CONTENT_INVENTORY / ASSET_ARCHIVE_MANIFEST 一致
- [x] buffers embedded (bin chunk)
- [x] images embedded (image uri starts with data:)
- [x] 0 external absolute file:// / http:// URIs
- [x] no Draco / no Meshopt / no KTX2
- [x] 0 animations
- [x] 至少 1 mesh + 1 material

## 六、Output Files

```
public/assets/models/kenney/
├── SOURCE.md
├── LICENSE.txt
├── MANIFEST.sha256
└── furniture/
    ├── loungeSofa.glb
    ├── tableCoffee.glb
    ├── televisionModern.glb
    ├── cabinetTelevision.glb
    └── bookcaseOpen.glb
```

无其他目录新建；无其他资产导入。
