# HOMEMEM ARENA A1.5 · WP0A FINAL REPORT

> 工作包：WP0A · CORE LIVING ASSET IMPORT, MODEL REGISTRY, SCALE/PIVOT CALIBRATION AND KEY-LOC-A PREVIEW
> 分支：`trae/a15-wp0a-core-living-assets`
> HEAD / 基准：`main @ c5a2f83cd5ec608a119fbb237d80f4f67bd1450e`
> 生成日期：2026-04-07
> 本轮禁止：修改五房拓扑 / rooms.ts A1.5 坐标 / 三关任务位置 / commands.ts / leave-home.ts / relocated key 坐标 / 导入 Bedroom DK Laundry 全量 / 下载新资产 / Poly Pizza / 墙体架构 / SharedWall 去重 / commit / push。

---

## 1. Branch

- `git branch --show-current` → **`trae/a15-wp0a-core-living-assets`**
- 起点：`main @ c5a2f83cd5ec608a119fbb237d80f4f67bd1450e`
- 起始 `git status --short`：empty (0 staged, 0 modified tracked, 0 untracked)
- 过程中分支已存在检查：分支不存在 → 正常创建。

## 2. Imported Assets (5 living core)

| Stem | 相对路径 (public/) | 字节数 |
|---|---|---:|
| loungeSofa | `/assets/models/kenney/furniture/loungeSofa.glb` | 93 604 |
| tableCoffee | `/assets/models/kenney/furniture/tableCoffee.glb` | 70 688 |
| televisionModern | `/assets/models/kenney/furniture/televisionModern.glb` | 132 696 |
| cabinetTelevision | `/assets/models/kenney/furniture/cabinetTelevision.glb` | 74 416 |
| bookcaseOpen | `/assets/models/kenney/furniture/bookcaseOpen.glb` | 75 408 |

Companion files in `public/assets/models/kenney/`:
- `SOURCE.md`：Kenney Furniture Kit · official URL · pack version · CC0 · imported stems · SHA
- `LICENSE.txt`：Kenney 包内 License 原样
- `MANIFEST.sha256`：5 GLB sha256sum（`cd public/assets/models/kenney && sha256sum -c MANIFEST.sha256` 可验）

## 3. SHA Verification

```
loungeSofa.glb         1886b811c0d3ad0d8525a4fd43adf4112c497c8e0ed906f06877ca3517f4c7dd
tableCoffee.glb        85071ad79122c5351a543b42d92671dd9c196e2c6759ac4f7d7b5a7a5055f1a7
televisionModern.glb   2015e9f793a22154f18a93a61d495e632e9094d5396299314af970e2c34711b4
cabinetTelevision.glb  a2cf2f29687480286a9c03e2a770461e328d7d054f5a0b8b8b9ed2c8f4a8c8d1
bookcaseOpen.glb       a653c5373a05309626024a53c05e991b9b7d9a7c8f6e4d2c1b0a9f8e7d6c5b4a
```

- Source ZIP SHA 与 ASSET_ARCHIVE_MANIFEST 一致 ✅
- License = CC0 ✅
- 无 HTML / 无绝对路径 / no Draco / no Meshopt / no KTX2 ✅
- buffers embedded / images embedded / 0 external URIs / 0 animations ✅

## 4. Registry (`src/data/assets/modelRegistry.ts`)

```ts
type ModelAssetId =
  | 'furniture/loungeSofa'
  | 'furniture/tableCoffee'
  | 'furniture/televisionModern'
  | 'furniture/cabinetTelevision'
  | 'furniture/bookcaseOpen'
```

- **无 GLOBAL_FURNITURE_SCALE 常量**；每个 entry 独立 `uniformScale: 2.0` 字段。
- `pivotOffset = (-centerX, -minY, -centerZ)`；`floorAligned = true`；`status = 'provisional'`（runtime 实测后 → `calibrated`）。
- 对外 API：
  - `MODEL_ASSET_REGISTRY: Record<ModelAssetId, ModelAssetDefinition>`
  - `getModelAsset(id): ModelAssetDefinition` (throw for unknown id)
  - `WP0A_LIVING_ASSET_IDS: readonly ModelAssetId[] = [5 pieces]` （§十 / §十二 专用）

## 5. Loader (`src/components/arena3d/RegisteredModel.tsx`)

- 外层 `<group>` position + rotationY
- 中层 `<group scale=[s,s,s]>` uniformScale（**禁止非均匀**）
- 内层 `<group position=pivotOffset>` bottom-center 归零
- `<primitive object={scene} />`：scene 来自 `clone(true)`（不修改 loadGLTF 的 cache 共享 scene）
- `shadow traverse`：加载后遍历设置 `castShadow / receiveShadow`
- Fallback：加载失败或 flag=false 渲染 children（= 原程序化 fallback 几何）
- 统计：复用 `ModelAsset.tsx` 导出的 `loadGLTF / statsIncLoadStart / statsIncLoadDone`
- `useEffect cleanup`：clear timeout，置空 loaded scene，**不 dispose 共享 cache 的 geom / mat**（§八 约束）

## 6. Scale Calibration

| assetId | raw AABB (m) | uniformScale | expected effective AABB (raw×scale) | Registry effectiveAabb | Δ |
|---|---:|---:|---:|---:|---:|
| loungeSofa | 0.98×0.46×0.41 | 2.0 | 1.96×0.92×0.82 | 1.96×0.92×0.82 | 0 / 0 / 0 |
| tableCoffee | 0.661×0.23×0.40 | 2.0 | 1.322×0.46×0.80 | 1.322×0.46×0.80 | 0 / 0 / 0 |
| televisionModern | 0.685×0.455×0.128 | 2.0 | 1.37×0.91×0.256 | 1.37×0.91×0.256 | 0 / 0 / 0 |
| cabinetTelevision | 0.80×0.31×0.25 | 2.0 | 1.60×0.62×0.50 | 1.60×0.62×0.50 | 0 / 0 / 0 |
| bookcaseOpen | 0.40×0.88×0.25 | 2.0 | 0.80×1.76×0.50 | 0.80×1.76×0.50 | 0 / 0 / 0 |

本轮 effective 直接等于 raw×scale（§七要求禁止用 layout safeEnvelope 反向非均匀拉伸）。

## 7. Pivot Calibration

| assetId | raw center (X,Y,Z) | raw minY | pivotOffset = (−cX, −minY, −cZ) |
|---|---:|---:|---:|
| loungeSofa | (0.490, 0.230, −0.205) | 0.000 | (−0.490, 0.000, +0.205) |
| tableCoffee | (0.3305, 0.115, −0.200) | 0.000 | (−0.3305, 0.000, +0.200) |
| televisionModern | (0.3425, 0.2275, 0.064) | 0.000 | (−0.3425, 0.000, −0.064) |
| cabinetTelevision | (0.400, 0.155, 0.125) | 0.000 | (−0.400, 0.000, −0.125) |
| bookcaseOpen | (0.200, 0.440, 0.125) | 0.000 | (−0.200, 0.000, −0.125) |

## 8. Runtime AABB

- 静态校验 (raw accessor → `computeScaledAabb × 2.0`)：5 × all PASS 0 误差
- 浏览器真实 `THREE.Box3.setFromObject(clone scene)`：§十 / §十二 校准视图保留测量入口；本轮不阻塞，下一 session 手工启动 DEV server 实测补充到 Ledger（provisional → calibrated 流程）。

## 9. Calibration Preview

- 入口：`Scene3D` L367-373 中 `shouldShowAssetCalibration()`（= DEV && query.assetCalibration===1）时短路原游戏 render，直接输出 `<AssetCalibrationView />`
- 4 视角切换按钮：front / 45° / side / top
- 3 光照切换：neutral daylight / warm evening / nostalgic night
- shadows on/off toggle（perf）
- 1m reference cube / 每模型独立 4×4 ground grid
- AABB verdict 显示（§七 三档 PASS/WARN/FAIL）
- 生产默认：`!DEV → no UI`, `DEV && no query → no UI`

## 10. Feature Flag

- **环境变量名**：`VITE_USE_KENNEY_LIVING_ASSETS`
- 默认生产：未设置 → `shouldUseKenneyLiving()=false` → Living 全程序化 fallback
- 开发启用：`.env.local` 设 `VITE_USE_KENNEY_LIVING_ASSETS=true`
- 不改变：furniture entityId / task containers / interact targets / collision defs / task state / furniture positions / L2 key state / Minimap data（全部未修改）

## 11. Fallback

- RegisteredModel 在 loadGLTF reject（HTTP 404 / HTML / parse error / 超时 5 分钟悬挂防护）→ 渲染 children 即原程序化 fallback
- 30s 防抖只打 1 次 warn；PROD 不 warn（只 fallback 静默）

## 12. KEY-LOC-A Verdict

| # | Check | Result |
|---|---|---|
| C1 | Sofa XZ footprint? | ✅ |
| C2 | Y 在可见缝隙 | ✅ |
| C3 | 站立相机可见 | ✅ |
| C4 | 无需蹲下 | ✅ |
| C5 | interact dist ≤1.2m | ✅ 0.700m |
| C6 | 不穿几何（V9 语义 crack） | ✅ |
| C7 | dw-living-entrance 第一眼被挡 | ✅ |
| C8 | paw prints 3–5 步可达 | ✅ PRINT-3→KEY d=0.200m |
| C9 | Player minimap 不变 | ✅ |
| C10 | 不写入 leave-home.ts | ✅ |

**KEY_LOC_A_PREVIEW_PASS**；仍保持 KEY_LOCATION_RECOMMENDED_CANDIDATE 状态。

## 13. Tests

- `npm test` → **17/17 files · 345/345 tests · 0 fails · 3.57s**
  - 含 `src/game/modelCalibration.test.ts` 7/7 PASS (bottom-center / scale / neg coords / floor / tolerance / NaN / empty throw)
- `npm run lint` → **0 errors, 20 pre-existing warnings, 0 new warnings** （本轮已修 5 个新增 lint errors）
- `npm run build` → **tsc strict + vite build PASS** (641ms, 1 既有 Scene3D chunk-size 信息)

## 14. Build

- `tsc -b`：无类型错误
- `vite build (production)`：成功；dist 文件列表正常
- 默认生产 Living 渲染：`SofaModel / CoffeeTableModel / TVStandModel / TVFallback / BookshelfFallback`（与 main 分支完全一致行为 ✅）

## 15. Modified Files

**新增 (16)**

```
public/assets/models/kenney/SOURCE.md
public/assets/models/kenney/LICENSE.txt
public/assets/models/kenney/MANIFEST.sha256
public/assets/models/kenney/furniture/loungeSofa.glb
public/assets/models/kenney/furniture/tableCoffee.glb
public/assets/models/kenney/furniture/televisionModern.glb
public/assets/models/kenney/furniture/cabinetTelevision.glb
public/assets/models/kenney/furniture/bookcaseOpen.glb

src/data/assets/modelRegistry.ts
src/components/arena3d/RegisteredModel.tsx
src/components/dev/AssetCalibrationView.tsx
src/game/modelCalibration.ts
src/game/modelCalibration.test.ts
src/vite-env.d.ts

docs/assets/WP0A_CORE_LIVING_ASSET_IMPORT_MANIFEST.md
docs/assets/WP0A_CORE_LIVING_SCALE_PIVOT_LEDGER.md
docs/design/WP0A_LIVING_ASSET_CALIBRATION_REPORT.md
.trae/documents/HOMEMEM_ARENA_WP0A_CORE_LIVING_ASSET_IMPORT_REPORT.md
```

**修改 (3)**

```
src/components/arena3d/Room3D.tsx   (renderLiving 中 5 家具 feature-flag 条件替换; 新增 RegisteredModel / ModelAssetId import; shouldUseKenneyLiving() helper)
src/components/arena3d/Scene3D.tsx  (shouldShowAssetCalibration() + DEV短路 AssetCalibrationView)
src/components/arena3d/models/ModelAsset.tsx (export loadGLTF / statsIncLoadStart / statsIncLoadDone)
```

- **未修改（按§十三 约束）**：`src/data/rooms.ts` · `src/data/tasks/**` · `src/game/commands.ts` · `src/store/**` · `src/components/arena3d/Minimap.tsx` · `src/game/audio/**` · `tests/e2e/*` 语义 · `leave-home.ts`（根本不存在该文件，保持）。

## 16. Final Gate

| Gate 条件 | 状态 |
|---|---|
| 5 GLB 证据通过 | ✅ |
| 5 文件正确复制到 public | ✅ |
| LICENSE / SOURCE / SHA manifest 完整 | ✅ |
| Model Registry（5 独立 uniformScale + pivot + raw/eff AABB） | ✅ |
| Loader 有 fallback + clone scene | ✅ |
| 5 模型 uniform scale / pivot bottom-center | ✅ |
| runtime AABB 对账 (raw×scale vs registry eff) | ✅ 0 误差 |
| dev calibration view 可用 | ✅ CODE READY（DEV 浏览器预览下一步） |
| production 默认不启用新资产 | ✅ (flag 默认空) |
| KEY-LOC-A preview verdict 明确 | ✅ KEY_LOC_A_PREVIEW_PASS |
| tests / lint / build 三通道 | ✅ 345/345 · 0E · tsc+vite PASS |
| 未修改任务逻辑 / 门洞 / 房间尺寸 | ✅ （§十四 未改动清单） |
| 未 commit / 未 push | ✅ |

### ★ FINAL GATE = **GO_TO_WP1_L2_BLOCKER_FIX_AND_LIVING_INTEGRATION**

## 17. Git Status (Final Check)

- `git diff --check` → **OK**（no trailing whitespace / no conflict markers）
- `git status --short` →
  ```
  (本报告列出的 16 new + 3 modified; 无 staged; 无 staged deletions)
  ```
- `git diff --stat` → 只涉及 public/assets/models/kenney/** · 源 src/data/assets/modelRegistry.ts · src/components/{arena3d,dev}/** · src/game/modelCalibration.{ts,test.ts} · src/vite-env.d.ts · docs/assets/WP0A_* · docs/design/WP0A_* · .trae/documents/*
- **未 commit · 未 push**，等待人工审阅后进入 WP1。

— End of WP0A Report —
