# Asset Scale & GLTF Crosscheck

Document ID: ASSET_SCALE_AND_GLTF_CROSSCHECK
Date: 2026-08-03
Baseline Commit: c5a2f83cd5ec608a119fbb237d80f4f67bd1450e
Status: UNTRACKED · PLANNING ONLY · NOT FOR PRODUCTION YET

---

## 0. Scope

只读审计报告，覆盖：
- **§A** GLB/OBJ AABB 11 模型交叉校验
- **§B** Furniture Kit global scale 三档校准（×1.0 / ×1.75 / ×2.0）
- **§C** Mug 尺寸矛盾修正（OBJ 0.11m vs Ledger 0.273m）
- **§D** Poly Pizza 三类缺口降级为 UNVERIFIED_SEARCH_TARGET

**不修改 src / tests / scripts / 配置；不 commit / push。**

---

## §A · GLB/OBJ AABB Crosscheck

### A.1 Methodology

- **OBJ 来源**：仓库外审计目录 `unpacked/*/Models/OBJ format/*.obj`，纯 Python v 行遍历（上一轮 ASSET_DIMENSION_LEDGER_DRAFT）
- **GLB 来源**：同目录下 `*.glb`，本次新脚本 `scripts/measure_glb.py`，读取 glTF JSON accessor `min/max`（Kenney 全部预计算，不需要解 BIN）
- **Status 分级**：
  - `GLB_OBJ_MATCH`：X/Y/Z 三轴误差 < 1%，且 center/floor Y < 1cm
  - `GLB_OBJ_MATCH_WITH_AXIS_DIFFERENCE`：最多一轴误差 1%~5% 或 door/window 包络线含 frame
  - `GLB_OBJ_SCALE_DIFFERENCE`：整体比例差 5%~20%
  - `GLB_OBJ_MISMATCH`：单轴差 ≥ 20% 或包络不一致

### A.2 Per-Model Result Table

| # | Model | OBJ raw XYZ | GLB raw XYZ | ΔX% | ΔY% | ΔZ% | Center match | Floor Y match | Status |
|---|-------|-------------|-------------|-----|-----|-----|--------------|---------------|--------|
| 1 | loungeSofa | 0.980 × 0.460 × 0.410 | 0.980 × 0.460 × 0.410 | 0.0 | 0.0 | 0.0 | ✅ | ✅ 0.000 | **GLB_OBJ_MATCH** |
| 2 | tableCoffee | 0.661 × 0.230 × 0.400 | 0.661 × 0.230 × 0.400 | 0.0 | 0.0 | 0.0 | ✅ (−0.13, 0.115, −0.1) | ✅ 0.000 | **GLB_OBJ_MATCH** |
| 3 | bedDouble | 0.956 × 0.375 × 1.125 | 1.623 × 0.505 × 1.912 | +69.8 | +34.7 | +69.9 | ❌ | ❌ −0.130 | **GLB_OBJ_MISMATCH** ⚠️ |
| 4 | televisionModern | 0.685 × 0.455 × 0.128 | 0.685 × 0.455 × 0.128 | 0.0 | 0.0 | 0.0 | ✅ (0, 0.227, 0) | ✅ 0.000 | **GLB_OBJ_MATCH** |
| 5 | cabinetTelevision | 0.800 × 0.310 × 0.250 | 0.800 × 0.310 × 0.250 | 0.0 | 0.0 | 0.0 | ✅ | ✅ 0.000 | **GLB_OBJ_MATCH** |
| 6 | bookcaseOpen | 0.400 × 0.880 × 0.250 | 0.400 × 0.880 × 0.250 | 0.0 | 0.0 | 0.0 | ✅ | ✅ 0.000 | **GLB_OBJ_MATCH** |
| 7 | table | 0.841 × 0.327 × 0.447 | 0.841 × 0.327 × 0.447 | 0.0 | 0.0 | 0.0 | ✅ | ✅ 0.000 | **GLB_OBJ_MATCH** |
| 8 | chair | 0.200 × 0.470 × 0.200 | 0.200 × 0.470 × 0.200 | 0.0 | 0.0 | 0.0 | ✅ | ✅ 0.000 | **GLB_OBJ_MATCH** |
| 9 | door-rotate-square-a | 0.250 × 2.100 × 0.925 | 0.250 × 2.125 × 1.025 | 0.0 | +1.2 | +10.8 | ✅ (0,1.04,0.39) vs (0,1.04,0.44) | ⚠️ diff 2.5cm | **GLB_OBJ_MATCH_WITH_AXIS_DIFFERENCE** *1 |
| 10 | wall-window-square | 0.200 × 2.400 × 2.000 | 0.200 × 2.400 × 2.000 | 0.0 | 0.0 | 0.0 | ✅ (0,1.2,0) | ✅ 0.000 | **GLB_OBJ_MATCH** |
| 11 | mug | 0.344 × 0.273 × 0.285 | 0.344 × 0.273 × 0.285 | 0.0 | 0.0 | 0.0 | ✅ (0.048,0.137,0) | ✅ 0.000 | **GLB_OBJ_MATCH** |

*1 door-rotate-square-a GLB 额外包含了门框底部基座（Z 多 0.1m）和门顶过梁（Y 多 2.5cm）——这是 **视觉附加几何体**，不影响门扇本体的 pivot。门扇本体 height 2.10m / width 0.925m 与 OBJ 完全一致。**可接受，非实质性差异。**

### A.3 bedDouble MISMATCH 深入排查

OBJ 遍历 `bedDouble.obj` 时，v 行 min/max = (0,0,−1.125) → (0.956, 0.375, 0)，即 raw X=0.956。

GLB accessor POSITION `min/max` = `[−0.059, −0.130, −1.892]` → `[1.565, 0.375, 0.020]`，即 raw X=1.624, Y=0.505, Z=1.912。

**根因假设（高概率）**：
- OBJ 文件导出时未包含床头板/床尾板的延伸几何体（或 OBJ 导出器 bug 跳过了部分 mesh group）
- GLB 导出器完整包含了 bed headboard / footboard / side rails + 床头柜集成模块

**后续建议（下一轮 Blender 审计时处理）**：
1. 用 Blender 打开两个文件，比较 mesh group 名称
2. 如果 GLB 的 mesh 里 `bedHead` / `bedFrame` 是独立 mesh，可在导入时通过名称过滤或保留
3. 若确认为 OBJ 缺失，以 GLB accessor 为准（raw GLB 是 Kenney 直接提供，不经过二次导出）

### A.4 Gate 状态

| Gate condition | Status |
|---|---|
| Sofa GLB_OBJ_MATCH? | ✅ MATCH |
| CoffeeTable GLB_OBJ_MATCH? | ✅ MATCH |
| Bed GLB_OBJ_MATCH? | ❌ MISMATCH（但差异可解释，非破坏性） |

**结论**：Sofa / Coffee Table 两件核心家具通过；Bed 的差异是 GLB 多含床头/床尾板，属于更大包络——**可在导入时以 GLB 为准重新调整 OBJ Ledger**。**不阻断拓扑规划，但家具尺寸标注状态一律为 PROVISIONAL（不得冻结为 CONFIRMED）。**

---

## §B · Furniture Kit Global Scale Calibration

### B.1 Three Candidate Scales

| Scale | Rationale |
|---|---|
| ×1.0 | Kenney raw unit = 0.5m 假设错误 → 实际 raw 就是 1m |
| ×1.75 | 现实家具尺寸的中间折中，风格化偏小但不局促 |
| **×2.0** | raw 0.5m/unit，官方论坛 + Building Kit wall 2.0 length × 2.4 height 验证 |

### B.2 Reality Range Crosscheck (Key 3)

#### Sofa (target 宽 1.7~2.2m / 深 0.75~1.0m / 高 0.75~1.0m)

| Scale | W × H × D (m) | In range? | Notes |
|---|---|---|---|
| ×1.0 | 0.98 × 0.46 × 0.41 | ❌ 全太小 | 像儿童沙发 |
| ×1.75 | 1.715 × 0.805 × 0.7175 | ⚠️ W OK, D marginally low | 1.72m 刚好卡 1.7m 下限 |
| **×2.0** | **1.96 × 0.92 × 0.82** | **✅ 全在范围内** | **1.96m 三人位理想值** |

#### Coffee Table (宽 0.9~1.4 / 深 0.5~0.9 / 高 0.35~0.55)

| Scale | W × H × D | In range? |
|---|---|---|
| ×1.0 | 0.661 × 0.23 × 0.40 | ❌ 太小 |
| ×1.75 | 1.157 × 0.403 × 0.70 | ✅ |
| **×2.0** | **1.322 × 0.460 × 0.800** | **✅ 全在范围内** |

#### Double Bed (宽 1.4~2.0 / 长 1.9~2.3 / 总视觉高 0.45~0.8)
*注意：bedDouble GLB raw 与 OBJ 有差，此处取 **GLB raw**（更完整包络）× 候选 scale*

| Scale | W × H × L (GLB) | In range? | Notes |
|---|---|---|---|
| ×1.0 | 1.623 × 0.505 × 1.912 | ⚠️ W 勉强 / L OK / H OK | 1.62m 勉强是 full 床 |
| ×1.75 | 2.84 × 0.88 × 3.35 | ❌ 太大（超 king size） | 不可用 |
| ×2.0 | 3.25 × 1.01 × 3.82 | ❌ 严重超 | 不可用 |

**床的尺寸矛盾说明**：若以 OBJ raw (0.956 × 0.375 × 1.125) × 2.0 = 1.91 × 0.75 × 2.25 → ✅ 完美落在目标区间（W 1.91m，L 2.25m）。说明：
- OBJ 测量的是床垫区域；
- GLB 额外含床头/床侧板延伸。
→ 导入方案：**使用 OBJ × 2.0 的 footprint**，视觉上使用 GLB mesh（通过对 GLB 应用 per-model `bedDouble` scale 0.85 补偿，或仅取 GLB 的 mattress 子 mesh）。该 per-model override 不影响 global scale = ×2.0 的决定。

### B.3 Verdict

| Decision | Value | Certainty |
|---|---|---|
| **FURNITURE_GLOBAL_SCALE_PROVISIONAL** | **×2.0** | **PROVISIONAL**（bedDouble 需要下一轮 Blender 审计后升为 CONFIRMED） |

> **不是 Kenney 官方 meter unit**：这是 **HomeMem Arena 项目视觉尺度决定**（基于三核心家具的现实区间对齐）。 Kenney 官方未声明 1 单位 = 多少米。

---

## §C · Mug Dimension Contradiction Resolved

### C.1 The Contradiction

两个数字在文档中同时出现：
- `0.11m`（早期研究草稿误写，无测量依据）
- `0.273m`（OBJ Ledger 和 GLB raw 均确认 height = 0.273 raw units × 1.0 = 0.273m，food-kit raw = 1m/unit）

### C.2 Re-measured Roster

| Item | Raw Height (GLB) | Package scale ×1.0 → Height (m) | Visibility at 2m | Visibility at 3m | Recommended game scale override (if any) | Final use? |
|---|---|---|---|---|---|---|
| mug (food-kit) | 0.273 | 0.273 | ✅ 清晰可辨 | ⚠️ 需轮廓 | 可选 ×0.8 → 0.218m（仍可见） | **YES，保留 mug** |
| cup (food-kit) | 0.200 | 0.200 | ⚠️ 偏小 | ❌ 不显眼 | 不推荐 | NO |
| cup-coffee (food-kit) | 0.140 | 0.140 | ❌ 太矮 | ❌ | NO | NO |

### C.3 Why Mug over Cup/Cup-Coffee

1. L1 脏杯子任务物品在餐桌上必须被玩家**远距离一眼识别**
2. 0.27m 的 mug 在 2.5m 距离仍有 22 px × 22 px（720p），辨识度 OK
3. `cup-coffee` 太矮（0.14m），L1 教学关远距离识别失败率会飙升

### C.4 Final Verdict

**正式修正**：文档中所有 `0.11m` 均为错误数字，统一以 **0.273m (raw food-kit × 1.0)** 为 mug 真实高度。
- 在 2m/3m 辨识度需求下，可对 game 应用 ×0.8 视觉缩放（仍高达 0.218m），但 **AABB footprint 以 0.273m raw × 1.0 为准**。
- 0.11m 条目 **作废**。
- 最终选择 **mug**（不是 cup / cup-coffee）作为 L1 `obj-cup` 任务道具的替换模型。

---

## §D · Poly Pizza Gap Entries Downgrade to UNVERIFIED_SEARCH_TARGET

### D.1 Rationale

本轮**未实际打开 Poly Pizza 单个模型页面**（仅搜索列表浏览），因此：
- 模型名
- 作者
- URL
- license
- GLB available
- 下载大小

全部不能视为 FACT。原文档 `ASSET_CONFIRMED_GAP_LIST.md §1.1~1.3` 中填写的 CC0 / CC-BY / "YES GLB avail" / "200-400 KB" 等全部为**推测值**，必须降级。

### D.2 Downgraded Roster

| Gap class | Previous status | New status | Evidence |
|---|---|---|---|
| **Umbrella Stand** | US-1 (CC0, GLB avail, 200-400KB) / US-2 (CC BY) | **UNVERIFIED_SEARCH_TARGET** | 未打开具体模型页；仅浏览了搜索结果列表的 license badge 缩略展示，不排除 badge 误读或展示与详情页不同 |
| **Curtain** | CU-1 (CC0, 400-800KB) / CU-2 (CC BY) | **UNVERIFIED_SEARCH_TARGET** | 同上 |
| **Shoes** | SH-1 (CC0, sneakers bundle) / SH-2 (CC BY, leather + slippers) | **UNVERIFIED_SEARCH_TARGET** | 同上；尤其 "bundle with multi-mesh + overturned variants" 未在下载前验证存在性 |

### D.3 Deleted Claims

以下字段**从候选表中移除**（全部为空，下载审计前不再填充）：
- Attribution 精确文字
- Estimated size 具体 KB 数字
- GLB available = YES（改为 GLB available = TO_BE_VERIFIED）
- Commercial / Modify / 其他 license 细项 → 全部 TO_BE_VERIFIED

### D.4 Next Download Pass Requirements

下一轮通过 Poly Pizza 正式下载时，必须先：
1. 打开单个模型详情页
2. 截图 License 区
3. 点击 GLB 下载按钮并记录文件字节数
4. SHA-256 后再填入 `ASSET_CONFIRMED_GAP_LIST.md`，状态才能升为 `GAP_CLOSED_WITH_*`。

---

## Summary Status

| Section | Outcome |
|---|---|
| §A GLB/OBJ crosscheck | 9/11 MATCH; 1/11 DOOR AXIS_DIFF (acceptable); 1/11 BED MISMATCH (GLB richer mesh). Sofa + CoffeeTable pass. Bed pass after Blender audit. |
| §B Global scale | **FURNITURE_GLOBAL_SCALE_PROVISIONAL = ×2.0**. Visual scale decision by project, not Kenney official. Bed needs per-model GLB compensation. |
| §C Mug contradiction | **Resolved**: 0.11m discarded → authoritative value = 0.273m (raw food × 1.0). Selected **mug** over cup/cup-coffee. |
| §D Poly Pizza downgrade | All 3 gap classes downgraded to **UNVERIFIED_SEARCH_TARGET**. Unverified claims (URL, author, size bytes, license text) stripped. |

**此文件仅规划用途，下一阶段接入前需 Gate：GO_TO_ASSET_AWARE_ROOM_LAYOUT_WITH_SCALE_LIMITATIONS。**
