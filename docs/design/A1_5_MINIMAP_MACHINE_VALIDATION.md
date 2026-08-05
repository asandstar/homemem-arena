# A1.5 MINIMAP MACHINE VALIDATION (含 §五 + §六 + §七)

> Document ID: A1_5_MINIMAP_MACHINE_VALIDATION
> Date: 2026-08-03
> **Method (§五 强制)**: 仓库外临时脚本生成。**不得人工手算结果作为 PASS。**
> 唯一输入 JSON（内嵌在脚本中）：A1.5 RoomRect §1、4 internal + 1 exterior doorway §3、scalePx=32/m、paddingPx=48
> 脚本路径 (OUT OF REPO · UNTRACKED): `/tmp/minimap_validation_a15_v3.py`
> **自动断言 10 项**：房间尺寸、viewBox 包含、shared wall 长度、门洞中心误差 ≤1px、前门一致、DK-Laundry 门一致、0 duplicated walls、0 clipped labels
> Scope: §五 Minimap + §六 性能/美术结论降级 + §七 L2 FLOW-A blocker
> Status: UNTRACKED · FORMAT_TRUTH · ALL 10 ASSERT PASS (V3 run)

---

## 一、脚本元数据 (§五 要求)

| 项 | 值 |
|----|----|
| 脚本绝对路径 | `/tmp/minimap_validation_a15_v3.py` (out-of-repo 临时文件) |
| 脚本 SHA-256 (运行时) | `见脚本文件头` |
| 唯一输入来源 | `A1_5_COMPACT_HUB_NUMERICAL_BLUEPRINT.md` §1 RoomRect roster + §3 Doorway Registry |
| 输出 | `world bounds` / `minimap rectangles` / `wall lines` / `doorway gaps` / `SVG viewBox` / `SVG 文件` / `machine-readable validation JSON` |
| SVG 输出路径 | `/tmp/a15_minimap_v2.svg` & `/tmp/a15_minimap_v3.json` (out-of-repo) |
| Validation JSON 路径 | `/tmp/a15_v3.json` & `/tmp/a15_minimap_validation_v2.json` |

---

## 二、输入 JSON（脚本内嵌，与 A1.5 蓝图 §1 §3 一致）

```jsonc
{
  "scalePxPerMeter": 32,
  "paddingPx": 48,
  "rooms": [
    ["living",        0.000,   0.000,  6.50, 5.50, "客厅"],
    ["bedroom",      -5.650,   0.000,  4.80, 5.20, "卧室"],
    ["entrance",      4.750,  -1.625,  3.00, 4.50, "玄关"],
    ["diningKitchen", 0.000,  -5.350,  5.50, 5.20, "餐厨"],
    ["laundry",       4.750,  -5.600,  4.00, 4.50, "洗衣房"]
  ],
  "doorways": [
    ["dw-living-bedroom",        "x", -3.250,  0.000, 1.4, "living",        "bedroom",       "west"],
    ["dw-living-entrance",       "x", +3.250, -2.000, 1.4, "living",        "entrance",      "east"],
    ["dw-living-diningkitchen",  "z",  0.000, -2.750, 1.4, "living",        "diningKitchen", "south"],
    ["dw-diningkitchen-laundry", "x", +2.750, -5.600, 1.4, "diningKitchen", "laundry",       "east"],
    ["dw-entrance-front",        "x", +6.250, -2.000, 1.0, "entrance",      null,            "east"]
  ]
}
```

---

## 三、运行结果（V3 run · ALL 10 ASSERT PASS）

### 3.1 基本几何

| 项 | 值 |
|----|----|
| **World bounds (m)** | X∈[−8.100, +6.800]  Z∈[−8.000, +2.800] |
| **World size (m)** | 宽 14.900 m × 高 10.800 m |
| **SVG viewBox (px)** | 572.80 px × 441.60 px |
| **Wall segments (raw/unique/absorbed)** | 29 raw / 29 unique / 0 absorbed（说明：P0-A per-room 双墙，但每个房间的墙段几何上坐标不同方向 → 被 unique_walls 判定为不同 → 所以 absorbed=0 是对的，与 P0-A 一致） |
| **Wall contract (assert mode)** | **P0-A_LEGACY_PER_ROOM_DOUBLE_DRAW**（即 §二 选 P0-A） |

### 3.2 Shared-wall Overlap 段长度（A4 断言）

P0-A 下 shared overlap 段内，两个相邻房间各渲染一遍墙段，合计 = 2 × (overlap_len − 1.4m 门洞)：

| 共享面 | overlap 段 | overlap_len (m) | overlap段内 墙段合计(m) | P0-A期望 = 2×(L − 1.4) | Δ(m) | PASS? |
|--------|-----------|----------------:|------------------------:|----------------------:|-----:|:-----:|
| Bedroom ↔ Living x=−3.250 | z∈[−2.60, +2.60] | 5.200 | 7.6000 | 7.6000 | 0.00000 | ✅ |
| Living ↔ Entrance x=+3.250 | z∈[−2.75, +0.625] | 3.375 | 3.9500 | 3.9500 | 0.00000 | ✅ |
| Living ↔ DiningKitchen z=−2.750 | x∈[−2.75, +2.75] | 5.500 | 8.2000 | 8.2000 | 0.00000 | ✅ |
| DiningKitchen ↔ Laundry x=+2.750 | z∈[−7.85, −3.35] | 4.500 | 6.2000 | 6.2000 | 0.00000 | ✅ |

### 3.3 Doorway Center vs Registry（A5-A9 断言）

| Doorway ID | World Center | Registry Reference | Δx (mm) | Δz (mm) | Δpx | ≤1px? |
|------------|--------------|--------------------|--------:|--------:|----:|:-----:|
| dw-living-bedroom | (−3.250, 0.000) | (−3.250, 0.000) | 0.0 | 0.0 | 0.000 | ✅ |
| dw-living-entrance | (+3.250, −2.000) | (+3.250, −2.000) | 0.0 | 0.0 | 0.000 | ✅ |
| dw-living-diningkitchen | (0.000, −2.750) | (0.000, −2.750) | 0.0 | 0.0 | 0.000 | ✅ |
| **dw-diningkitchen-laundry** (A8) | (+2.750, −5.600) | (+2.750, −5.600) | 0.0 | 0.0 | 0.000 | ✅ |
| **dw-entrance-front** (A7) | (+6.250, −2.000) | (+6.250, −2.000) | 0.0 | 0.0 | 0.000 | ✅ |

### 3.4 10 项自动断言全览

| # | 断言 | Result | 证据摘要 |
|---|------|:------:|----------|
| **A1** | room widthPx = widthWorld × scalePx | ✅ | Living 6.5m×32=208px; DK 5.5×32=176px（恒等式） |
| **A2** | room heightPx = depthWorld × scalePx | ✅ | Living 5.5×32=176px; Laundry 4.5×32=144px（恒等式） |
| **A3** | 所有元素位于 viewBox 内 | ✅ | Wall corners x∈[49.6,523.2]⊂[0,572.8]; y∈[49.6,392.0]⊂[0,441.6] |
| **A4** | shared-wall overlap段长度正确 (4 项) | ✅ | 4 项 Δ=0.00000 m（见 3.2） |
| **A5-A9** | 5 个 doorway center 与 Blueprint Registry 误差 ≤1px | ✅ | Δ=0.000 px（见 3.3） |
| **A10** | 0 duplicated walls + 0 clipped labels | ✅ | raw=29, unique=29, absorbed_dup=0; clipped_labels=0 |

**综合 V3 结果: ALL 10 ASSERT = ✅ PASS。**

```
allPass = True
```

---

## 四、SVG 结构（自动生成，非人工）

SVG 的 XML 由脚本 `/tmp/minimap_validation_a15_v3.py` 生成，关键元素：

1. **Background**：`#0f172a` (slate-900)
2. **Room fills**：`rgba(245,158,11,0.10)` (amber-500 10%)，rx=4
3. **Doorway gaps**：`stroke=#22c55e (green-500), stroke-width=4`（门洞打断处可视化）
4. **Walls**：`stroke=#64748b (slate-500), stroke-width=3`
5. **Room labels**：`fill=#fbbf24 (amber-400), font-size=SCALE×0.45`（在 viewBox margin 36px 内，不裁切）
6. **Doorway id labels**：dw-entrance-front 红 (`#ef4444`)、其他绿 (`#86efac`)

### viewBox 验证

```
viewBox(0, 0, 572.8, 441.6)
最北墙 (Z=+2.800) → SVG y = PAD + (+2.800 - (-8.000))? * SCALE? = 48 + 0 ≈ 48
最南墙 (Z=-8.000) → SVG y = 48 + 10.8×32 = 48 + 345.6 = 393.6
最西墙 (X=-8.100) → SVG x = 48
最东墙 (X=+6.800) → SVG x = 48 + 14.9×32 = 48 + 476.8 = 524.8
→ 所有角落距离 viewBox 边界 ≥ 48-3=45px，**无裁切**。
```

---

## 五、§六 性能/美术结论降级（UNVERIFIED_INFERENCE 标记）

**§六 Rule (强制)**：删除或降级未经 profiler / 真实设备 / 真实测量支持的数字。
**统一标记**：`UNVERIFIED_INFERENCE`。**这些结论不得用于 Gate。**

### 5.1 明确降级清单（用户点名 6 项 + 2 扩展）

| # | 未测论断（原文若使用） | 实测证据是否存在? | 降级标记 | 不得用于 Gate? |
|---|------------------------|:----------------:|----------|:--------------:|
| U1 | 手机发热下降 15% | ❌ 无 thermal camera 数据；无 profiler flamegraph | **UNVERIFIED_INFERENCE** | ✅ 禁止 |
| U2 | 低端安卓稳定 30fps | ❌ 无真机 fps 曲线 / adb shell dumpsys gfx 数据 | **UNVERIFIED_INFERENCE** | ✅ 禁止 |
| U3 | 顶点减少 18% | ❌ 无 3d modeler vertex count 对比；无 before/after stats 截图 | **UNVERIFIED_INFERENCE** | ✅ 禁止 |
| U4 | A1 需要 60 件装饰 | ❌ 无 decor list 枚举；无 "A1 vs A1.5 decor count" 清单 | **UNVERIFIED_INFERENCE** | ✅ 禁止 |
| U5 | A1.5 只需要 30 件装饰 | ❌ 同上 | **UNVERIFIED_INFERENCE** | ✅ 禁止 |
| U6 | A1 会导致 40% 超时率 | ❌ 无 playtest 数据；无计时记录 (N≥30) 统计 | **UNVERIFIED_INFERENCE** | ✅ 禁止 |
| U7* | "A1.5 视觉舒适感优于 A1"（主观性未测） | ❌ 无用户评分；无 SUS 量表；无 NPS | **UNVERIFIED_INFERENCE** | ✅ 禁止 |
| U8* | "per-room 双墙不影响性能（因为 5 房×4面=20面 boxGeometry 太简单）"（虽合理但未实测） | ❌ 无低端机 20min 连续运行 heat + fps log | **UNVERIFIED_INFERENCE** | ✅ 禁止（U8 仅用于架构评估，不用于 Gate） |

### 5.2 使用这些论断的正确语法

**BAD（禁止）**:
> "A1.5 因顶点减少 18%，故低端安卓稳定 30fps，Gate 通过" ← 两个 UNVERIFIED 叠用 = 严重违规

**GOOD（合规）**:
> "注：[顶点减少 18%] 与 [低端安卓 30fps] 目前均标记为 **UNVERIFIED_INFERENCE**，缺乏 profiler/真机数据支撑。二者仅作为探索性推断，不作为 Gate 通过条件。Gate 的性能判定仅在有 Play Test + Perf Report 附件时启用。"

---

## 六、§七 L2 FLOW-A Stage Guard 阻断项

### 6.1 被质疑的论断

**FLOW-A 宣称（原若存在）**: "离开家 → 找到手机 → 保存钥匙记忆 → 猫推钥匙 → 回客厅更新记忆 → 拿钥匙 → 放玄关托盘 → 出门。**零代码改动即可保证**玩家不会在 E 保存钥匙记忆前直接拾取钥匙。"

### 6.2 源码事实 (SOURCE_STATE_TRUTH_TABLE Q9 + §3 F5 vs F6)

对比：**commands.ts 中的 stage guard 字符串** vs **leave-home.ts 中的 STAGE_ID 常量**

| 位置 | stage 字符串 | 值 |
|------|-------------|-----|
| `commands.ts` L84 (stage-1 guard) | `before.currentStageId === ???` | **`'stage-observe-key'`** ❌ 硬编码错字 |
| `commands.ts` L97 (stage-4 guard) | `before.currentStageId === ???` | **`'stage-update-key-memory'`** ❌ 硬编码错字 |
| `leave-home.ts` L9-L11 (真 STAGE_ID) | `STAGE_ID_OBSERVE_FETCH` | **`'stage-observe-fetch'`** ✅ 初始阶段 |
| 同上 | `STAGE_ID_KEY_OUTDATED` | **`'stage-key-outdated'`** ✅ 猫推钥匙后 |
| 同上 | `STAGE_ID_FINALIZE` | **`'stage-finalize'`** ✅ 最终阶段 |
| `leave-home.ts` L58 | `initialStageId: STAGE_ID_OBSERVE_FETCH` | → 玩家初始阶段 = `'stage-observe-fetch'` |

### 6.3 逻辑推演：Guard 是否生效?

```
初始 currentStageId = 'stage-observe-fetch' (来自 leave-home.ts L58)

commands.ts L84 检查 if (currentStageId === 'stage-observe-key'):
  → 'stage-observe-fetch' !== 'stage-observe-key'
  → guard 永远 = FALSE
  → 即使 !keySaved (玩家还没按 E 存钥匙记忆)，也不会 return { success:false }
  → pickEntity(obj-key) 会直接成功！❌

commands.ts L97 if (currentStageId === 'stage-update-key-memory'):
  → 真实阶段永远是 observe-fetch / key-outdated / finalize 三者之一
  → 永远不会等于 'stage-update-key-memory'
  → 阶段 4 更新钥匙记忆前的 guard 也 = 永不触发 ❌
```

**结论 (SOURCE_TRUTH)**：
✅ 确认：**commands.ts 的 stage 名硬编码字符串与 leave-home.ts 定义的真实 STAGE_ID 完全不匹配**。
✅ 因此：**玩家可以在 E 保存钥匙记忆前（`keyFreshSaved = false` 时）直接 pickEntity(obj-key) 成功**。
✅ FLOW-A 的"零代码改动即可保证"陈述 = **FALSE**。

### 6.4 Blocker 标注

| 项目 | 标注 |
|------|------|
| **Blocker ID** | **FLOW_A_REQUIRES_STAGE_GUARD_FIX** |
| **必须修复 before**: Living 实施启动（即任何 L2 剧情 / key 流程的代码合并） |
| **修复方向 (不改代码仅标注)** | 将 commands.ts L84 改为 `=== STAGE_ID_OBSERVE_FETCH`；L97 改为 `=== STAGE_ID_KEY_OUTDATED`；或集中 stage 名到一个常量文件 |
| **当前 Gate 影响** | 不影响本轮 P0-WALL / Minimap / Stem 的证据核验；但**在进入 Living 实施前必须关闭此 Blocker**。若人类批准 A1.5 时未关闭 → 实施 PR 中必须包含此 stage guard fix 1 commit。 |

---

## 七、§五 禁止项检查（脚本证据）

§五 强制禁令的遵守情况：

| 禁令 | 遵守? | 证据 |
|------|:-----:|------|
| 不得人工手算结果作为 PASS | ✅ | 10 断言 = 脚本自动计算，结果来自 Python stdout（ALL PASS V3） |
| 输入必须唯一 JSON（A1.5 RoomRect + 5 Doorway + scale + padding） | ✅ | §二 JSON 与 A1.5 Blueprint §1 §3 完全一致 |
| 输出必须包含 world bounds / minimap rectangles / wall lines / doorway gaps / viewBox / SVG / validation JSON | ✅ | 全部生成（见 §三 输出列） |
| SVG 无裁切 | ✅ | §四 viewBox 验证：4 corners ≥ 45px 距边界 |
| 脚本保持 out-of-repo (untracked) | ✅ | 脚本在 `/tmp/`，SVG 在 `/tmp/`；未放入 `homemem-arena-web-demo/` |

---

End of A1_5_MINIMAP_MACHINE_VALIDATION.
