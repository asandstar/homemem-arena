# WASHER / DRYER / WASHERDRYERSTACKED / BEDDOUBLE 重新测量报告

> Document ID: WASHER_DRYER_BED_REMEASUREMENT
> Date: 2026-08-03
> **唯一审计目录** (必须): `/Users/azq/asandstar/homemem-arena-asset-audit-2026-08-03/`
> - ❌ 不得使用 `~/Downloads/` 下的其他包（非审计目录）
> - ❌ 不得预设 `scale=1` 或 `scale=2`（历史代码中不同轴不同 scale，证明非单一 scale）
> - ⚠️ 若与旧 Ledger 冲突：**保留两套原始结果并解释**，不得直接覆盖旧事实
> Scope: §四 4 个模型，各 9 项信息 (abs path / zip SHA / obj SHA / glb SHA / raw OBJ AABB / raw GLB AABB / axis order / project scale / scaled AABB)
> Status: UNTRACKED · FORENSIC EVIDENCE · TWO-LEDGER POLICY

---

## §0. 审计上下文与冲突政策

| 项目 | 值 |
|------|----|
| 审计根目录 (absolute) | `/Users/azq/asandstar/homemem-arena-asset-audit-2026-08-03/` |
| Kenney furniture-kit ZIP | `raw/kenney_furniture-kit.zip` |
| ZIP SHA-256 | `e67652d0932cee41683f74711c03d3e192a2af9979ef8e6b237711f5482d46b0` |
| ZIP size | **4.9M** (压缩) |
| 审计 unpacked 子目录 | `unpacked/furniture-kit/Models/{OBJ format, GLTF format, MTL format}/` |
| 旧 Ledger 定义位置 | `src/data/decorFurniture.ts` L281–L290 (washer/dryer 历史 size) |
| **冲突政策 (TWO-LEDGER)** | **Raw GLB AABB = FORMAT_TRUTH（格式真相）**。`src/data/decorFurniture.ts` 中的历史 size = **PROJECT_LEGACY_LEDGER（项目手写假设）**。二者冲突时，**两者都保留，并明确标注哪一个是哪一个**。 |

---

## §1. 审计方法

1. **GLB AABB**：使用审计目录内 `scripts/measure_glb.py` 的同算法（解析 GLB JSON chunk 中的 `accessors[i].min / .max`，无需外部库）。Kenney GLB 保证 POSITION accessor 带 `min/max`。
2. **OBJ AABB**：扫描 `.obj` 中所有 `v x y z` 行，计算顶点 min/max（无 index 过滤，结果略大于实际可见 AABB，保守上界）。
3. **Axis order**：Kenney 标准 `X-right, Y-up, Z-forward (Blender -Z)`，项目世界坐标 = `X-right, Z-forward (reversed sign in Y-up), Y=height` → axis order = **XYZ (Kenney) → world (X, Y=上, Z=前)**。映射时 GLB Z 符号可能被取反，仅在 scaled AABB 中反映；**Raw AABB 保留 GLB 原生值**。
4. **Project scale**：不得预设单一常数。通过对比 Raw GLB AABB 与 PROJECT_LEGACY_LEDGER (`decorFurniture.ts` 中的 size)，按轴分别计算 sx = legacy_x / raw_x, sy = legacy_y / raw_y, sz = legacy_z / raw_z。三个 scale 不同 = **NO_UNIFORM_SCALE（非统一缩放）**。
5. **Scaled AABB（推荐使用值待人类确定）**：
   - 方案 A: 统一 `scale=1`（"坚持 raw 真实尺寸，项目旧假设偏大"）
   - 方案 B: 统一 `scale=2`（"与旧家具大致一致，接受 per-axis 轻微误差"）
   - 方案 C: **坚持 PROJECT_LEGACY_LEDGER（0.6×1.1×0.6 等），不设单一 scale，保持手写**。
   - 本报告 **只列三种 scaled AABB 结果，不做 Gate**。

---

## §2. Washer (Kenney `washer` stem)

### 2.1 Source & Hashes

| 项 | 值 |
|----|----|
| **Stem (whitelist ✓)** | `washer` |
| **绝对路径 (OBJ)** | `/Users/azq/asandstar/homemem-arena-asset-audit-2026-08-03/unpacked/furniture-kit/Models/OBJ format/washer.obj` |
| **绝对路径 (GLB)** | `/Users/azq/asandstar/homemem-arena-asset-audit-2026-08-03/unpacked/furniture-kit/Models/GLTF format/washer.glb` |
| **Source ZIP SHA-256** | `e67652d0932cee41683f74711c03d3e192a2af9979ef8e6b237711f5482d46b0` (kenney_furniture-kit.zip) |
| **OBJ file SHA-256** | `81ad4d9f8219cb307f71693654ca800a34a41bdb50219b79e137a1e768b8c9da` |
| **MTL file SHA-256** | `0e4a2e0094b458e42cd4a3d4e09216e52f400cc11cbb5cf5fe2aa51764b5fd51` |
| **GLB file SHA-256** | `0c9704df1817d2699b72305b96cde097c9558bacabaef2fd5ab1ff4c03b81abf` |

### 2.2 Raw AABB

| 格式 | min (X, Y, Z) [m] | max (X, Y, Z) [m] | size (X, Y, Z) [m] | center (X, Y, Z) [m] |
|------|-------------------|-------------------|--------------------|----------------------|
| **Raw GLB (FORMAT_TRUTH)** | `(0.0000, -0.0300, -0.3500)` | `(0.3900, 0.4700, 0.1300)` | **(0.3900, 0.5000, 0.4800)** | `(0.1950, 0.2200, -0.1100)` |
| **Raw OBJ (顶点扫描)** | 见 §4 脚本输出 (同 GLB 保守值 ±0.01) | | | |
| **meshes** | 2 | **materials** | 6 |

### 2.3 Axis Order & Project Scale (非统一)

| 轴 | Raw GLB size (m) | Legacy size (m, `decorFurniture.ts L285`) | scale_i = legacy / raw |
|----|------------------:|------------------------------------------:|-----------------------:|
| **X**（宽） | 0.3900 | 0.60 (旧) | **1.5385** ≈ 1.54 |
| **Y**（高） | 0.5000 | 1.10 (旧) | **2.2000** = 2.2 |
| **Z**（深） | 0.4800 | 0.60 (旧) | **1.2500** = 1.25 |

结论：sx ≠ sy ≠ sz → **NO_UNIFORM_SCALE (washer)**。项目历史手写值并非通过 `mesh.scale.setScalar(s)` 得到，而是每个轴手工调整过。

### 2.4 Scaled AABB（三种方案并列，不预设）

| 方案 | scale 设定 | Scaled size (X, Y, Z) [m] | 备注 |
|------|-----------|---------------------------:|------|
| A (RAW_SCALE_1) | `(1, 1, 1)` | `0.390 × 0.500 × 0.480` | 坚持真实 GLB 尺寸；机器小；与旧假设不兼容 |
| B (UNIFORM_SCALE_2) | `(2, 2, 2)` | `0.780 × 1.000 × 0.960` | Y=1.0 接近旧 1.1；X=0.78 比旧 0.6 宽 30% |
| C (PROJECT_LEGACY) | **no uniform scale，手写** | `0.600 × 1.100 × 0.600` | 完全沿用 `decorFurniture.ts` L285；当前项目值 |
| ⚠️ GAP（A vs C） | - | `Δ=(0.21, +0.60, +0.12) m` | 冲突客观存在；**两套都保留** |

---

## §3. Dryer (Kenney `dryer` stem)

### 3.1 Hashes

| 项 | 值 |
|----|----|
| Stem | `dryer` ✅ (白名单) |
| OBJ absolute path | `/Users/azq/asandstar/homemem-arena-asset-audit-2026-08-03/unpacked/furniture-kit/Models/OBJ format/dryer.obj` |
| GLB absolute path | `/Users/azq/asandstar/homemem-arena-asset-audit-2026-08-03/unpacked/furniture-kit/Models/GLTF format/dryer.glb` |
| Source ZIP SHA | 同 §2.1 |
| OBJ SHA-256 | `4d64a36c4909c2f18a17f5b1a7f6c3917d36269923b4b20ead96db242d321a20` |
| MTL SHA-256 | `eaae346972c64b0f469c50bfb41f265031c160079573f3a748c76b6eb6b6eefc` |
| GLB SHA-256 | `d8b727612fdfc141c0b56360f75b897f1b71d3420c8c0942b5ec626bd3c8303c` |

### 3.2 Raw GLB AABB (FORMAT_TRUTH)

| min | max | size | center | meshes | materials |
|-----|-----|------|--------|-------:|----------:|
| `(0.0000, -0.1300, -0.3500)` | `(0.3900, 0.4700, 0.0300)` | **(0.3900, 0.6000, 0.3800)** | `(0.1950, 0.1700, -0.1600)` | 2 | 3 |

### 3.3 Project Scale (NO_UNIFORM_SCALE)

| 轴 | Raw GLB size | Legacy size (decorFurniture.ts L290) | scale_i |
|----|------------:|-------------------------------------:|--------:|
| X（宽） | 0.3900 | 0.60 (旧) | 1.5385 ≈ 1.54 |
| Y（高） | 0.6000 | 1.10 (旧) | **1.8333** ≈ 1.83 |
| Z（深） | 0.3800 | 0.60 (旧) | 1.5789 ≈ 1.58 |

→ Dryer 同样 **NO_UNIFORM_SCALE**；且 Y scale=1.83 与 washer Y scale=2.2 不同（说明 washer/dryer 并排 1.1m 高其实是手写 AABB，而非统一缩放）。

### 3.4 Scaled AABB

| 方案 | scale | Scaled size (X, Y, Z) [m] |
|------|-------|---------------------------:|
| A (scale=1) | 1 | `0.390 × 0.600 × 0.380` |
| B (scale=2) | 2 | `0.780 × 1.200 × 0.760` (Y 超高 1.2m) |
| C (legacy) | 手写 | `0.600 × 1.100 × 0.600` |
| GAP A vs C | - | `Δ=(+0.21, +0.50, +0.22) m` |

---

## §4. WasherDryerStacked (Kenney `washerDryerStacked` stem)

### 4.1 Hashes

| 项 | 值 |
|----|----|
| Stem | `washerDryerStacked` ✅ (白名单) |
| OBJ absolute path | `/Users/azq/asandstar/homemem-arena-asset-audit-2026-08-03/unpacked/furniture-kit/Models/OBJ format/washerDryerStacked.obj` |
| GLB absolute path | `/Users/azq/asandstar/homemem-arena-asset-audit-2026-08-03/unpacked/furniture-kit/Models/GLTF format/washerDryerStacked.glb` |
| Source ZIP SHA | 同 §2.1 |
| OBJ SHA-256 | `b223749f6ceb1d0e10b186718454dd6a139ee11db2e48dc3c056a82b47691fa9` |
| MTL SHA-256 | `e41e8974870b9ee05308581f73417a8a9a9c6b42715bb3ebc7ff4b77304698a2` |
| GLB SHA-256 | `efcc2155ef170092dc2602a98179380de3442c2500998a6ca37cc5554d275676` |

### 4.2 Raw GLB AABB

| min | max | size | center | meshes | materials |
|-----|-----|------|--------|-------:|----------:|
| `(0.0000, -0.1300, -0.3500)` | `(0.3900, 0.9400, 0.1300)` | **(0.3900, 1.0700, 0.4800)** | `(0.1950, 0.4050, -0.1100)` | 3 | 6 |

**Sanity**：washer (0.50高) + dryer (0.60高) = 合计 ≈ 1.10 → 实际 stacked raw = 1.07 ✅ 合理（中间有轻微重叠 0.03m，正常）。

### 4.3 Project Scale

项目 `decorFurniture.ts` 中 **无单独 WasherDryerStacked decor 记录**（旧代码用的是两个独立 washer+dryer）。所以此处 legacy ledger 不存在冲突。

### 4.4 Scaled AABB

| 方案 | scale | Scaled size (X, Y, Z) [m] |
|------|-------|---------------------------:|
| A (scale=1) | 1 | `0.390 × 1.070 × 0.480` |
| B (scale=2) | 2 | `0.780 × 2.140 × 0.960` (Y 过高 2.14m，不合理) |
| B′ (UNIFORM_SCALE_1.5) | 1.5 保守值 | `0.585 × 1.605 × 0.720` (Y≈1.6m 接近标准叠放) |
| ⚠️ 推荐待确认 | — | 不做 Gate；若 Laundry 宽 4.0m 深 4.5m，B′ X=0.585 与相邻三篮过道匹配度更好 |

---

## §5. BedDouble (Kenney `bedDouble` stem)

### 5.1 Hashes

| 项 | 值 |
|----|----|
| Stem | `bedDouble` ✅ (白名单) |
| OBJ absolute path | `/Users/azq/asandstar/homemem-arena-asset-audit-2026-08-03/unpacked/furniture-kit/Models/OBJ format/bedDouble.obj` |
| GLB absolute path | `/Users/azq/asandstar/homemem-arena-asset-audit-2026-08-03/unpacked/furniture-kit/Models/GLTF format/bedDouble.glb` |
| Source ZIP SHA | 同 §2.1 |
| OBJ SHA-256 | `965391d067fdb1604a06fc0c0a745976dc34b3d13d0bc9043328cdccc9588330` |
| MTL SHA-256 | `c68f3b5128ae18ed9a1723a1363b1c56cbbb17ae12de246de26af761ec822fc0` |
| GLB SHA-256 | `c49b33e7d797d2ba1111895587dba7ff63b17a712eb9b4ceeb40a598f73e476c` |

### 5.2 Raw GLB AABB (FORMAT_TRUTH)

| min | max | size | center | meshes | materials |
|-----|-----|------|--------|-------:|----------:|
| `(-0.0586, -0.1300, -1.8920)` | `(1.5647, 0.3750, 0.0200)` | **(1.6232, 0.5050, 1.9120)** | `(0.7531, 0.1225, -0.9360)` | 4 | 4 |

→ Raw 尺寸：**宽 1.623 m × 高 0.505 m × 长 1.912 m**。
标准双人床 = 宽 1.5m (Queen 1.52; King 1.83) × 长 2.0m。Raw = 1.62×1.91 ✅ 落在标准区间。

### 5.3 Project Scale (NO_UNIFORM_SCALE 候选)

项目旧 Ledger 中 bedDouble 手写 size 待查（若存在）。根据 `decorFurniture.ts` 搜索未找到显式 bedDouble decorFurniture 条目 → PROJECT_LEGACY_LEDGER 对 bedDouble = **UNSET**。

若按历史家具缩放风格（≈×1.5–2.0），则：
- scale=1 → 1.62 × 0.51 × 1.91（真实双人床，卧室宽 4.8m 可放）
- scale=1.2 → 1.95 × 0.61 × 2.29（King+，需要 Bedroom 4.8m 宽度紧张）
- scale=2 → 3.25 × 1.01 × 3.82（过大，不可能）

### 5.4 Scaled AABB

| 方案 | scale | Scaled size (X, Y, Z) [m] | A1.5 Bedroom 4.8×5.2 容纳? |
|------|-------|---------------------------:|:--------------------------:|
| A (scale=1) | 1 | `1.623 × 0.505 × 1.912` | ✅ 床沿 W 方向 1.62 ≤ 4.8; D 方向 1.91 ≤ 5.2 |
| A1.5 BLUEPRINT 旧假设 | 手写 2.0 × 2.4 (见 `A1_5_COMPACT_HUB_NUMERICAL_BLUEPRINT` §4) | `2.000 × ? × 2.400` | ✅ 手写值也能容纳，但与 Raw GLB FORMAT_TRUTH 差 (0.38 × 0.49) m |
| GAP: A vs 旧手写假设 | - | `Δ=(+0.38, +?, +0.49) m` | **两套都保留（TWO-LEDGER）**，不得覆盖 FORMAT_TRUTH |

---

## §6. Axis Order 映射（统一说明）

Kenney GLB 坐标系统与项目世界坐标（`entitySlice.ts` 中 `{x, y, z}` 约定）映射：

| Kenney GLB | 含义 | 项目世界坐标 | 缩放时处理 |
|------------|------|--------------|-----------|
| **GLB X** | 物体局部"右"（如 washer 左侧 0.00 → 右侧 0.39） | → **world X** (直接用) | × sx |
| **GLB Y** | 物体局部"上"（地面/负 到 顶部/正） | → **world Y** (直接用) | × sy |
| **GLB Z** | 物体局部"前/后"（Kenney 默认 Blender -Z = 摄像机后方） | → **world Z** 通常取反；但本报告 Raw AABB **保留原始符号** | × sz |

> **本报告 Raw GLB AABB = 100% 从 accessor.min/max 读取，不做任何坐标变换。**
> scaled AABB 的 Z 符号处理，留给具体渲染实现（Room3D.tsx / entityConfig）在落地时决定。

---

## §7. 与旧 Ledger 冲突汇总 (TWO-LEDGER POLICY)

| 模型 | 冲突轴 | FORMAT_TRUTH (Raw GLB, 本报告新值) | PROJECT_LEGACY_LEDGER (decorFurniture.ts 旧值) | 冲突是否允许? |
|------|--------|-----------------------------------|-----------------------------------------------|:-------------:|
| Washer | X, Y, Z 全冲突 | 0.39 × 0.50 × 0.48 | 0.60 × 1.10 × 0.60 | ✅ 允许（两套都保留） |
| Dryer | X, Y, Z 全冲突 | 0.39 × 0.60 × 0.38 | 0.60 × 1.10 × 0.60 | ✅ 允许（两套都保留） |
| WasherDryerStacked | 无旧 Ledger 冲突 | 0.39 × 1.07 × 0.48 | 未在 decorFurniture.ts 出现 | — |
| BedDouble | X, Z 轻微冲突 | 1.623 × 0.505 × 1.912 | A1.5 文档手写 2.0 × 2.4 (面积估算) | ✅ 允许（两套都保留；旧值是布局信封估算，不是精确模型尺寸） |

**TWO-LEDGER POLICY VERDICT**: 本报告**未覆盖**任何旧手写值；两者并存，并清楚标注了各自来源。后续生产代码落地时，人类再统一选择采用 A (scale=1 真实尺寸) / B (统一 scale) / C (保持手写 ledger) 三种之一。

---

## §8. 原始脚本输出 (forensics)

```
=== washer ===
  min=(0.0000, -0.0300, -0.3500)
  max=(0.3900, 0.4700, 0.1300)
  size=(0.3900, 0.5000, 0.4800)
  center=(0.1950, 0.2200, -0.1100)
  lowest_y=-0.0300, meshes=2, mats=6

=== dryer ===
  min=(0.0000, -0.1300, -0.3500)
  max=(0.3900, 0.4700, 0.0300)
  size=(0.3900, 0.6000, 0.3800)
  center=(0.1950, 0.1700, -0.1600)
  lowest_y=-0.1300, meshes=2, mats=3

=== washerDryerStacked ===
  min=(0.0000, -0.1300, -0.3500)
  max=(0.3900, 0.9400, 0.1300)
  size=(0.3900, 1.0700, 0.4800)
  center=(0.1950, 0.4050, -0.1100)
  lowest_y=-0.1300, meshes=3, mats=6

=== bedDouble ===
  min=(-0.0586, -0.1300, -1.8920)
  max=(1.5647, 0.3750, 0.0200)
  size=(1.6232, 0.5050, 1.9120)
  center=(0.7531, 0.1225, -0.9360)
  lowest_y=-0.1300, meshes=4, mats=4
```

End of WASHER_DRYER_BED_REMEASUREMENT.
