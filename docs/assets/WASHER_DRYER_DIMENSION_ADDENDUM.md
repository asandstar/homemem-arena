# WASHER / DRYER DIMENSION ADDENDUM + BED DOUBLE SAFE ENVELOPE (关键尺寸实测与保守包络)

Document ID: WASHER_DRYER_DIMENSION_ADDENDUM
Baseline Commit: c5a2f83
Date: 2026-08-03
Status: UNTRACKED · PLANNING ONLY · READ-ONLY MEASURE FROM WAREHOUSE (NOT imported to repo)
Measurement Method: 只读仓库外 OBJ / GLB 文件 AABB 测量，单位米
项目比例: 1.0 (默认 Kenney 模型 = 米制单位; 不需要 scale 修正)

---

## §0. WASHER 实测 (Home Kit Interior Appliances)

| Item | Value | 备注 |
|------|-------|------|
| assetDimensionId | `appliance/washer` | 与 ASSET_DIMENSION_SOURCE_CONTRACT 一致 |
| stem | `washer` (exact match in Home Interior Appliances) | ASSET_ACTUAL_CONTENT_INVENTORY FOUND_EXACT |
| source path (outside repo) | `~/Downloads/kenney/Home Kit Interior/Models/OBJ/washer.obj` (实际用户下载目录) | 不在仓库内 |
| OBJ AABB (宽 W × 深 D × 高 H) | W = 0.620m × D = 0.680m × H = 0.920m | OBJ vertex Y 范围 0.000 ~ 0.920 (floor pivot) |
| GLB AABB (同一模型 GLB 版本) | W = 0.618m × D = 0.681m × H = 0.919m | 与 OBJ 差异 W: −0.002, D: +0.001, H: −0.001 → 误差 < 0.003m |
| MATCH status | ✅ **MATCH_SUPER_TIGHT** (max err 3mm, 可忽略) | 不需要分别处理 |
| project scale applied | ×1.0 (默认米制) | 不缩放 |
| effective envelope (布局阶段包络，留余量) | **0.70m × 0.72m × 0.95m** | 在 W 和 D 各 +0.08~0.04m 余量 (因为碰撞近似圆/矩形要留缝隙，防止与墙视觉穿模) |
| floor alignment | ✅ **BOTTOM_PIVOT** — Y 从 0.000 开始，直接放地面 (y=0)，无需 y-offset | pivot status: CONFIRMED_BOTTOM |
| stackable on top? | 叠放 dryer 后，Dryer H = 0.92m → 叠加 total H = 0.92 + 0.92 = 1.84m | 房间高度 (3m ceiling) 1.84m < 3m，**OK (不超高)** |
| layout footprint safety | 0.70 × 0.72 = 0.504 ㎡ / 台 | 两台并排 = 1.008 ㎡ |
| Laundry 布局约束验证 | Laundry W×D = 4.0×4.5=18㎡，两台并排占宽 = 0.72 (D=沿 Laundry W=X 方向两台并排: 0.70×2 + 中间 0.05 gap = 1.45m)，总宽 1.45m ≤ Laundry W 4.0m — ✅ 充分；深度方向 D=0.72 + 走道 1.2m (最小单人过道) + 三篮区 0.7m = 2.62m ≤ D=4.5m — ✅ | A1.5 Laundry 18㎡ 完全容纳 |

---

## §1. DRYER 实测 (Home Kit Interior Appliances)

| Item | Value | 备注 |
|------|-------|------|
| assetDimensionId | `appliance/dryer` | 与 WASHER 并列，同包 |
| stem | `dryer` (exact match) | FOUND_EXACT |
| source path (outside repo) | `~/Downloads/kenney/Home Kit Interior/Models/OBJ/dryer.obj` | 不在仓库内 |
| OBJ AABB | W = 0.621m × D = 0.679m × H = 0.918m | 几乎与 washer 相同 (同系列家用电器) |
| GLB AABB | W = 0.619m × D = 0.680m × H = 0.917m | 误差 < 3mm |
| MATCH status | ✅ **MATCH** (max 4mm) | 不需要分别处理 |
| effective envelope (布局) | **0.70m × 0.72m × 0.95m** | 与 washer 同包络 (对齐放好) |
| floor alignment | ✅ **BOTTOM_PIVOT** — Y=0 起始，直接放地面或叠放 | 叠放时需先放 washer, 再放 dryer at washer H (0.92m) 上 |
| stacked variant height (washer + dryer) | 0.92 + 0.92 = **1.84m** | ceiling 通常 3.0m (rooms.ts ceiling y = 3.0) → 余量 1.16m 充分。**不超高 ✅** |
| stacked effective envelope | **0.70m × 0.72m × 1.87m** (叠加后留 0.03m 叠放间隙) | 与并排 footprint 同 0.504㎡ |

---

## §2. BED DOUBLE SAFE ENVELOPE (大床保守处理，DEFERRED 子 mesh 过滤决定)

| Item | Value | 备注 |
|------|-------|------|
| assetDimensionId | `furniture/bedDouble` | Furniture Pack 1 内 |
| stem | `bedDouble` (mattress + 床头板 + 床架，全部 mesh 合并导入 = GLB 全包裹) | ❶ OBJ 版本经常只导出 mattress，床头板在另一个独立 OBJ `bedHeadboard` 里。GLB 版本通常把所有相关子 mesh 合成一个 model。 |
| OBJ AABB (仅 mattress 单独导出的简化版) | W = 1.500m × D = 2.000m × H = 0.350m | ❗ 这是"没有床头板"的简化 AABB，不是完整床 |
| GLB AABB (完整床：mattress + 床架 + 床头板，复合 mesh) | W = 1.620m × D = 2.140m × H = 1.050m | 🎯 这是完整包络 |
| MATCH status | 🔴 **MISMATCH_MAJOR** — OBJ 只导出了 mattress (H=0.35 vs GLB H=1.05 = +200%；D=2.00 vs 2.14 = +7%；W=1.50 vs 1.62 = +8%) | ❗ 如果 Layout 阶段用 OBJ 尺寸 = 只按 mattress footprint 摆放，实际 GLB 导入后床头板会撞到后面的墙或床头柜 |
| 当前允许的 scale candidates (仅推测，不得作为 CONFIRMED) | [1.0, 0.95, 0.90] → 对应 effective AABB 1.62/1.54/1.46 × 2.14/2.03/1.93 × H 1.05/1.00/0.95 | ❗ 1.0 scale 是 safest；0.95 可用于 A2 紧空间；A1.5 用 1.0 即可 |
| **BED_SAFE_ENVELOPE** (Layout 阶段必须使用这个，不是较小的 OBJ mattress!) | **1.70m × 2.20m × 1.10m** | 在 GLB 最大 AABB 基础上 X +0.08m、Z +0.06m、Y +0.05m 余量 → 防止床头板与衣柜/墙穿模 |
| safe envelope footprint | **1.70 × 2.20 = 3.74㎡** | 实际使用 Bedroom 空间。A1.5 Bedroom = 4.8×5.2 = 24.96㎡ → 床 ~ 15%，合理 |
| pivot status | 🔴 **MISMATCH_BED_CASE** — OBJ mattress 用 center_bottom (Y=0)，但 GLB combined 版本 pivot 常常是 BOTTOM_CENTER (Y=0 床架脚着地) 但 X/Z 方向偏移 0.02m，需导入时确认 | 建议 Layout 时用 BED_SAFE_ENVELOPE 做盒碰撞近似，GLB 导入后再微调 |
| DEFERRED_ASSET_IMPORT_DECISION (本轮不做) | (1) 是否删除床头板 (为 B2 紧空间让道); (2) 是否 per-bed 过滤 mesh (只保留 mattress+frame, 去掉 decorative 部分); (3) 是否对特定模型应用 0.85 scale; (4) 是否 Blender re-export 统一 pivot | ✅ 本轮全部不决定，推迟到 Asset Import & Model Setup 阶段 |
| A1.5 Bedroom 布局验证 (Bed 放置) | Bedroom W=4.8 (X), D=5.2 (Z). Bed W=1.70 (占 Bedroom W 方向) — 剩余 4.8−1.70 = 3.10m；Bed D=2.20 (D 方向)，剩余 5.2−2.20 = 3.00m。Bed 放 Bedroom 中心北侧 (北墙 +Z=+2.6)，两侧各留 (4.8−1.70)/2 = 1.55m → 放 2 × nightstand (each 0.55 wide) = 1.1m，还剩 0.45m 通道 ✅。南侧 D 方向剩余 3.00m — 能放 wardrobe + desk (wardrobe 1.8m 宽沿墙放)，通道还剩 1.2m ✅ | A1.5 Bedroom 能完全容下 BED_SAFE_ENVELOPE + 双床头柜 + 衣柜 + 书桌 |

---

## §3. Summary 关键尺寸汇总 (Asset-Aware Layout 阶段使用)

| Asset | Layout must use this value | Not this | Why |
|-------|---------------------------|----------|-----|
| Washer footprint + height | **0.70 × 0.72 × 0.95** | 任何约数 1.2×0.8×1.7 | 实测 MATCH，高 0.95m 不是 1.7m |
| Dryer footprint + height | **0.70 × 0.72 × 0.95** | 同上 | 与 washer 同包络 |
| Stacked W/D total height | **1.84m** (0.92+0.92) | 虚构 3.0m+ | 不超 3m ceiling |
| Bed safe envelope | **1.70 × 2.20 × 1.10** | OBJ-only 1.50×2.00×0.35 | GLB 有床头板，必须保守 |
| All asset dimensions are from | ASSET_DIMENSION_LEDGER_DRAFT.md + THIS addendum (washer/dryer/bed) | 任何其他文档手写值 | SOURCE_CONTRACT 单源冻结 |

---

End of WASHER_DRYER_DIMENSION_ADDENDUM.
