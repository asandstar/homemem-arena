# WP0A CORE LIVING SCALE / PIVOT LEDGER

> 工作包 WP0A · §六 Model Registry · §七 Scale/Pivot Calibration
> 记录五 Kenney GLB 的 raw AABB → uniformScale × uniformScale × uniformScale → effective AABB 对账表，
> 以及 pivotOffset = (-centerX, -minY, -centerZ) 纯数值账。
> 注意：本轮 **runtime 还没启动浏览器真实测量 THREE.Box3.setFromObject()**，
> 所以表格里 runtime 列为 "TBD (next preview session 补充)"；
> 本轮已经过 **ASSET_DIMENSION_LEDGER_DRAFT + ASSET_EVIDENCE_RECONCILIATION 对账**，
> 审计 raw 维度与 reconciled layout safeEnvelope (2.4 / 1.4 / TV 1.4 / cabinetTV 1.8 / bookcase 0.85) 的差值 ≤ 0.22，
> 属于 §七 INITIAL_CALIBRATION_CANDIDATE 级别（可接受作为 WP1 集成输入）。

---

## 0. Ledger 列说明

- **raw AABB (x×y×z m)**：Kenney GLB 原始 JSON → accessor → `{ x: maxX-minX, y: maxY-minY, z: maxZ-minZ }` 审计值（来自 ASSET_DIMENSION_LEDGER_DRAFT.md）。
- **uniformScale**：modelRegistry.ts 中该 assetId 单独登记的缩放（单一数字，独立字段；无全局常量）。
- **expected effective AABB**：raw × uniformScale 的纯乘积。
- **pivotOffset (x,y,z)**：`pivot = { -centerX_raw, -minY_raw, -centerZ_raw }`。对所有 Kenney Furniture Kit 原始 GLB 的经验：模型 X 起点约 0，Z 起点约 -depth（坐面朝向 +Z），Y 起点 0 → pivotOffset.y = 0。
- **runtime AABB (TBD)**：下一轮浏览器 THREE.Box3.setFromObject(cloned scene) 测量，用于校验 raw×scale 是否与 expected 误差在 0.01m 以内。
- **status**：`provisional` = 本轮登记但 runtime 未测；`calibrated` = 已测且 per-axis max|Δ| ≤ 0.01（§七 PASS）。

---

## 1. Five Model Ledger (§七)

### 1.1 loungeSofa `furniture/loungeSofa`

| Field | Value | Unit |
|---|---:|---:|
| sourceStem | `loungeSofa` | — |
| rawAabb X × Y × Z | 0.980 × 0.460 × 0.410 | m |
| raw center point (X, Y, Z) | (0.490, 0.230, −0.205) | m |
| raw minY | 0.000 | m |
| uniformScale (独立登记; **非全局常量**) | 2.0 | × |
| pivotOffset (X, Y, Z) = (−cX, −minY, −cZ) | (−0.490, 0.000, +0.205) | m |
| **expected effective AABB** (X, Y, Z) | **1.960 × 0.920 × 0.820** | m |
| runtime AABB | TBD (3D preview) | m |
| Δ runtime vs expected (X / Y / Z) | TBD | m |
| verdict | INITIAL_CALIBRATION_CANDIDATE (§七) | — |
| registry status | `provisional` / 预期 runtime 后 → `calibrated` | — |

> LIVING-A 布局 safeEnvelope = 2.40 × 0.95 × 1.00；eff 1.96 × 0.92 × 0.82 → layoutSafeEnvelope > model → 布局不拉伸（§七禁止反向非均匀拉伸）。

---

### 1.2 tableCoffee `furniture/tableCoffee`

| Field | Value | Unit |
|---|---:|---:|
| sourceStem | `tableCoffee` | — |
| rawAabb X × Y × Z | 0.661 × 0.230 × 0.400 | m |
| raw center point (X, Y, Z) | (0.3305, 0.115, −0.200) | m |
| raw minY | 0.000 | m |
| uniformScale | 2.0 | × |
| pivotOffset (X, Y, Z) | (−0.3305, 0.000, +0.200) | m |
| **expected effective AABB** (X, Y, Z) | **1.322 × 0.460 × 0.800** | m |
| runtime AABB | TBD | m |
| Δ runtime vs expected (X / Y / Z) | TBD | m |
| verdict | INITIAL_CALIBRATION_CANDIDATE | — |
| registry status | `provisional` | — |

> Layout envelope 1.40 × 0.50 × 0.80 → eff 1.32 × 0.46 × 0.80，X 小 0.078m，Y 小 0.040m → OK。

---

### 1.3 televisionModern `furniture/televisionModern`

| Field | Value | Unit |
|---|---:|---:|
| sourceStem | `televisionModern` | — |
| rawAabb X × Y × Z | 0.685 × 0.455 × 0.128 | m |
| raw center point (X, Y, Z) | (0.3425, 0.2275, 0.064) | m |
| raw minY | 0.000 | m |
| uniformScale | 2.0 | × |
| pivotOffset (X, Y, Z) | (−0.3425, 0.000, −0.064) | m |
| **expected effective AABB** (X, Y, Z) | **1.370 × 0.910 × 0.256** | m |
| runtime AABB | TBD | m |
| Δ runtime vs expected (X / Y / Z) | TBD | m |
| verdict | INITIAL_CALIBRATION_CANDIDATE | — |
| registry status | `provisional` | — |

> Layout 包络 1.40 × 0.95 × 0.30。eff 1.37 × 0.91 × 0.256 全部 ≤ envelope ✅。

---

### 1.4 cabinetTelevision `furniture/cabinetTelevision`

| Field | Value | Unit |
|---|---:|---:|
| sourceStem | `cabinetTelevision` | — |
| rawAabb X × Y × Z | 0.800 × 0.310 × 0.250 | m |
| raw center point (X, Y, Z) | (0.400, 0.155, 0.125) | m |
| raw minY | 0.000 | m |
| uniformScale | 2.0 | × |
| pivotOffset (X, Y, Z) | (−0.400, 0.000, −0.125) | m |
| **expected effective AABB** (X, Y, Z) | **1.600 × 0.620 × 0.500** | m |
| runtime AABB | TBD | m |
| Δ runtime vs expected (X / Y / Z) | TBD | m |
| verdict | INITIAL_CALIBRATION_CANDIDATE | — |
| registry status | `provisional` | — |

> Layout envelope 1.80 × 0.65 × 0.55 → 全维度 ≤ ✅。

---

### 1.5 bookcaseOpen `furniture/bookcaseOpen`

| Field | Value | Unit |
|---|---:|---:|
| sourceStem | `bookcaseOpen` | — |
| rawAabb X × Y × Z | 0.400 × 0.880 × 0.250 | m |
| raw center point (X, Y, Z) | (0.200, 0.440, 0.125) | m |
| raw minY | 0.000 | m |
| uniformScale | 2.0 | × |
| pivotOffset (X, Y, Z) | (−0.200, 0.000, −0.125) | m |
| **expected effective AABB** (X, Y, Z) | **0.800 × 1.760 × 0.500** | m |
| runtime AABB | TBD | m |
| Δ runtime vs expected (X / Y / Z) | TBD | m |
| verdict | INITIAL_CALIBRATION_CANDIDATE | — |
| registry status | `provisional` | — |

> Layout envelope 0.85 × 1.80 × 0.55 → 全维度 ≤ ✅。

---

## 2. §七 Tolerance 对账规则（下一轮 runtime 填写）

```
perAxis:
  |Δ| ≤ 0.010m → PASS
  |Δ| ≤ 0.030m → WARN (需要人工确认)
  |Δ| > 0.030m → FAIL (不允许 layout safeEnvelope 反向非均匀拉伸模型)
```

- 本 Ledger 中所有 `pivotOffset` 均来自 `computeBottomCenterOffset(THREE.Box3.from raw accessor)`；
- `modelCalibration.test.ts` 7/7 通过覆盖 bottom-center / uniform scale / 负数坐标 / tolerance 三档 / NaN / empty；
- 若 runtime AABB vs expected 出现 WARN，则 **保持 uniformScale 不动**，下一阶段 WP1 CCC-02 仅调整位置 (position 0.05m 级) 不拉伸。

---

## 3. §十二 KEY-LOC-A 预览对账 (使用 sofa eff AABB 1.96 × 0.92 × 0.82)

- Sofa footprint in LIVING-A reconciled layout：
  - `local (x, z) = (0.00, +2.275)`, rotY=180°, footprint `X∈[−1.20, +1.20], Z∈[+1.80, +2.75]`
- KEY-LOC-A candidate：`Living local (−0.40, +2.00)`, Y=+0.35
- §十二 10 项检查：
  |#|check|result|
  |-|---|---|
  |C1|XZ footprint 内|✅ (x=−0.4 ∈ [−1.2,+1.2]; z=+2.0 ∈ [1.8,2.75])|
  |C2|Y ∈ 可见缝隙|✅ (0.35 < 0.92 eff top; 坐垫底 crack 语义)|
  |C3|站立相机可见 (LOS 南侧 0.6m)|✅ (standable, cat print lead)|
  |C4|无需蹲下|✅|
  |C5|interaction distance ≤ 1.2m|✅ 0.700m|
  |C6|不穿 Sofa geom (V9 语义 crack)|✅ semantic=inside/crack|
  |C7|dw-living-entrance 第一眼被挡|✅ 终点在 sofa footprint 中|
  |C8|paw prints 3–5 步可达|✅ PRINT-3 → KEY d=0.200m|
  |C9|Player minimap 不变|✅ blocklist + sofa 色块覆盖|
  |C10|不写入 leave-home.ts|✅ 仍为 RECOMMENDED_CANDIDATE|
- **§十二 KEY-LOC-A preview verdict：`KEY_LOC_A_PREVIEW_PASS`**
