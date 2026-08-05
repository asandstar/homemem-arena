# FINAL EVIDENCE INTEGRITY REPORT (最终证据完整性报告)

> Document ID: FINAL_EVIDENCE_INTEGRITY_REPORT
> Date: 2026-08-03
> Scope: 汇总 §一 ~ §七 所有核验结果 + §二 P0-WALL 契约唯一选择 + **最终 Gate 判定**
> Status: UNTRACKED · EVIDENCE COMPLETE · FINAL GATE BELOW
> **本轮禁令（强制）**: 不得批准 A1.5；不得开始 Asset-Aware Room Layout；本轮只做证据核验 + 算术修复；不得设计新方案。

---

## §0. 执行摘要

| 章节 | 内容 | 结果 | 有无矛盾？ |
|------|------|------|:----------:|
| §一 | 源码状态重新取证 (7 文件) | SHA-256 + Lines + Key Excerpts 全部记录；9 项唯一事实明确 | ❌ 无 |
| §二 | P0-WALL 墙体契约消除自相矛盾 | 选 **P0-A**（per-room 双墙 = LEGACY_CURRENT_STATE） | ❌ 消除 |
| §三 | 资产 stem 白名单审计 | 10 项黑名单 INVALID；白名单 40+ stem CONFIRMED | ❌ 无 |
| §四 | washer/dryer/stacked/bedDouble 重测量 | 完整 SHA + AABB；TWO-LEDGER 冲突保留 | ❌ 无 |
| §五 | Minimap 10 项机器验证 | **ALL 10 ASSERT PASS** (V3 run) | ❌ 无 |
| §六 | 性能/美术未测结论降级 | 8 项 UNVERIFIED_INFERENCE 标记；禁止用于 Gate | ❌ 无 |
| §七 | L2 FLOW-A Stage Guard | **阻断成立**，标记 FLOW_A_REQUIRES_STAGE_GUARD_FIX Blocker | ❌ 无 |

**执行摘要结论**: 7 章节全部完成，无证据内自相矛盾 → 满足 "源码状态无矛盾"、"P0 墙体契约无双重定义"、"stem 白名单来自真实审计"、"W/D/B 测量可追溯"、"Minimap 脚本 10 PASS"、"SVG 无裁切"、"所有门洞中心一致"、"性能结论降级"、"L2 stage guard 标记 blocker" **9 条 Gate 条件全满足**。

→ 最终 Gate = **A1_5_HUMAN_APPROVAL_REQUIRED**（等人类确认 P0-A / Blockers 接受度后再批准 A1.5，机器无法自行批准）

---

## §一 源码状态（引用 SOURCE_STATE_TRUTH_TABLE.md）

详见 [SOURCE_STATE_TRUTH_TABLE.md](./SOURCE_STATE_TRUTH_TABLE.md)。

### 1.1 9 项事实汇总（无矛盾）

| # | 事实 | 最终值 | 证据文件 |
|---|------|--------|----------|
| F1 | Minimap.tsx 完整性 | **完整实现，非 placeholder**（597 行；缺 memory marker + active rooms 分层） | `Minimap.tsx` SHA=`4dc970d7…7917d` |
| F2 | Room3D.tsx 生成墙体? | **是**（per-room `buildWallSegments` × 4 faces） | `Room3D.tsx` SHA=`d708eabc…6a6151`, L887 |
| F3 | 视觉墙厚度 | **0.100 m** (t=0.1) | `Room3D.tsx` L887: `const t = 0.1` |
| F4 | 碰撞墙厚度 | **INFERRED = 0.10 m**（sceneSchema.ts 无独立常量，仅由视觉几何同源推断） | `sceneSchema.ts` (104 行仅 Decor/Container) |
| F5 | shared wall 是否 double-draw? | **是，PER-ROOM 双墙 (P0-A)**（相邻房间各自独立生成接触面） | `Room3D.tsx` 外层 rooms.map() 独立 buildWallSegments |
| F6 | CARRY_CAPACITY | **CARRY_ONE (单件)**（`heldEntityId: string | null`） | `entitySlice.ts` L12, L32 |
| F7 | cat trigger 条件 | **OR 双条件**: (a) freshSaved+free+leftLiving; (b) free+phoneObtained | `leave-home.ts` L292-303 |
| F8 | relocated key baseline | `{x:-3.2, y:0, z:-3.2}` → ⚠️ **A1.5 Living 中 z=-3.2 < -2.75 越界 0.45m** | `leave-home.ts` L307 + A1.5 Living minZ=-2.75 |
| F9 | L3 rooms | **`['laundry']` 单房** | `laundry-sort.ts` L22 |

### 1.2 矛盾检查

SOURCE_STATE_TRUTH_TABLE §2 矩阵 C1–C8 全部 **CLEAN** → 源码无互斥矛盾。
→ **§一 Gate: PASS**。

---

## §二 P0-WALL 墙体契约治理（必须二选一 · 消除双重定义）

### 2.0 冲突原文（已存在于历史文档，必须清除）

```
文档 α 写道："shared wall 禁止重复生成（single source of truth）"
文档 β 写道："Phase 1 允许 Room A / Room B double-draw shared wall 两次"
→ 二者互斥；禁止并存。
```

### 2.1 二选一声明

**本轮强制选择 → P0-A**。
理由：
- 当前 `Room3D.tsx` L820–L920 事实：`rooms.map(room => <group> ... buildWallSegments(room) ... </group>)`，相邻两房独立生成 mesh → **物理上面面俱到地 double-draw**。
- Minimap 机器验证 V3 的 A4 shared-wall overlap 段长度断言：**合计墙段 = 2×(overlap_len − 1.4)** → 证明 P0-A 与当前几何一致。
- 选择 P0-B（去重后单 wall render list）需要重构 Room3D.tsx + Minimap.tsx 的墙体构建逻辑，属于"新方案设计/代码重构" → 本轮**禁止设计新方案** → P0-B 不允许在本轮被作为"未来状态即当前事实"使用。

### 2.2 P0-A 正式定义（单一定义 · 禁止任何互斥陈述）

```
P0-WALL ::= P0-A_LEGACY_PER_ROOM_DOUBLE_DRAW

语义:
  1. 墙体生成 = 以 Room 为单位，每个 Room 独立生成 4 面外墙（含门洞切分）
  2. shared wall（两房接触面）会被相邻两房各自生成一次 mesh → double-draw 客观存在
  3. polygonOffset 仅作为 z-fighting hack 用于渲染层；不是"去重/治理方案"（§五 禁止 polygonOffset 作为正式治理）
  4. 本状态 = LEGACY_CURRENT_STATE（遗留当前态）；不得称为 FROZEN / SINGLE SOURCE / FINAL
  5. 未来若要去重 → 在进入 "Phase 1 wall refactor" 工作包时启动；本轮不得开始该工作包。
```

### 2.3 禁止条款（严格）

- ❌ 不得在同一文档同时出现 "P0-A double-draw 存在" 与 "未来 Phase 1 single wall render list 已生效"。
- ❌ 不得称 "P0-A 是优化的 / 高效的 / 单一数据源的"——它是 legacy。
- ❌ 不得使用 polygonOffset 作为 "治理 shared-wall 的正式方案" 证据；只能作为临时 hack。

### 2.4 互斥状态清理

| 现存互斥陈述原文 | 清理动作 |
|------------------|----------|
| "共享墙禁止重复生成（单一数据源）" | ⚠️ 删除或改写为："共享墙禁止重复生成是 Phase 1 refactor 目标，当前 P0-A 未实现" |
| "Phase 1 已经使用去重 single wall render list" | ❌ 删除（当前代码不存在此逻辑；属于对未来状态的冒充） |
| "polygonOffset 解决了 double-draw" | 改写为："polygonOffset 作为临时 z-fighting hack，并非正式治理" |

→ **§二 Gate: PASS（P0-A 唯一选择，双重定义已消除）**。

---

## §三 资产 stem 白名单（引用 ASSET_STEM_WHITELIST_AUDIT.md）

详见 [ASSET_STEM_WHITELIST_AUDIT.md](../assets/ASSET_STEM_WHITELIST_AUDIT.md)。

核心结论：
- 白名单 = `docs/assets/ASSET_ACTUAL_CONTENT_INVENTORY.md`（唯一）
- 已解析 valid stems 40+（见 §1 Group A/B/C）
- 10 项黑名单 INVALID:
  - `loveseatSofa` → 替换 `loungeSofa`
  - `nightstand` → 替换 `tableBedside`
  - `wardrobe` → INVALID (stem 可能白名单但 unpacked 缺失)，替换 `bookcaseClosedDoors` 或写 `WARDROBE_NOT_PACKED`
  - `dishwasher`, `refrigerator`, `counter`, `tissuePack`, `lampFloor`, `rugLarge` → 全 INVALID；使用 *_NOT_PACKED 标记或改用白名单存在的替代
  - `window-square-a` → 替换 `wall-window-square`
- 不得对任何 INVALID stem 写 CONFIRMED / 填尺寸 / 声称来自未下载的新 pack。

→ **§三 Gate: PASS**。

---

## §四 washer / dryer / stacked / bedDouble 重测量（引用 REMEASUREMENT.md）

详见 [WASHER_DRYER_BED_REMEASUREMENT.md](../assets/WASHER_DRYER_BED_REMEASUREMENT.md)。

核心事实：

| 模型 | Raw GLB AABB FORMAT_TRUTH (X×Y×Z m) | Source ZIP SHA | GLB SHA | Project Scale | 冲突政策 |
|------|------------------------------------:|---------------|---------|---------------|----------|
| washer | 0.390 × 0.500 × 0.480 | `e67652…4d46b0` | `0c9704…b81abf` | **NO_UNIFORM_SCALE** (sx=1.54, sy=2.2, sz=1.25) | TWO-LEDGER 保留 legacy (0.6×1.1×0.6) + raw |
| dryer | 0.390 × 0.600 × 0.380 | 同上 | `d8b727…c8303c` | **NO_UNIFORM_SCALE** (sx=1.54, sy=1.83, sz=1.58) | TWO-LEDGER 保留 legacy + raw |
| washerDryerStacked | 0.390 × 1.070 × 0.480 | 同上 | `efcc21…275676` | NO_UNIFORM_SCALE (无 legacy 冲突) | 保留 Raw + 三种 scaled AABB 备选 |
| bedDouble | 1.623 × 0.505 × 1.912 | 同上 | `c49b33…3e476c` | 项目 legacy 未设置（冲突仅在 A1.5 手写 2.0×2.4 信封） | TWO-LEDGER：Raw = 标准双人床区间合理；旧信封 = 设计估算，不覆盖 Raw |

→ 未预设 scale=1 或 scale=2；所有路径/SHA 可追溯；冲突采用 TWO-LEDGER 政策，未覆盖旧值。
→ **§四 Gate: PASS**。

---

## §五 Minimap 10 项机器验证（引用 MACHINE_VALIDATION.md）

详见 [A1_5_MINIMAP_MACHINE_VALIDATION.md](./A1_5_MINIMAP_MACHINE_VALIDATION.md)。

V3 run 结果：**ALL 10 ASSERT PASS = True**

| 断言 | PASS? |
|------|:-----:|
| A1. room widthPx = widthWorld × scalePx | ✅ |
| A2. room heightPx = depthWorld × scalePx | ✅ |
| A3. 所有元素位于 viewBox 内 | ✅ |
| A4. 4 对 shared-wall overlap 段长度正确 (Δ=0.00000m) | ✅×4 |
| A5-A9. 5 个 doorway center 与 Blueprint 误差 ≤1px (0.000px) | ✅×5 |
| A10. 0 duplicated walls (几何去重后 absorbed=0) + 0 clipped labels | ✅ |

**机器生成的 SVG** 存放在仓库外：`/tmp/a15_minimap_v2.svg`
**机器生成的 validation JSON** 存放在仓库外：`/tmp/a15_v3.json`、`/tmp/a15_minimap_validation_v2.json`

→ 人工手算结果 **0 次** 用于证据；全部断言由脚本直接 assert。
→ **§五 Gate: PASS**。

---

## §六 性能与美术结论降级

所有未测论断（8 项）统一标记 **UNVERIFIED_INFERENCE**，禁止用于 Gate：

- U1 手机发热下降 15%（无 thermal 数据）
- U2 低端安卓稳定 30fps（无 fps 曲线）
- U3 顶点减少 18%（无 vertex count 对比）
- U4 A1 需要 60 件装饰（无枚举清单）
- U5 A1.5 只需要 30 件装饰（无枚举清单）
- U6 A1 会导致 40% 超时率（无 playtest N≥30）
- U7* 主观舒适感优于 A1（无 SUS/NPS）
- U8* 双墙不影响性能（虽合理但无 20min 真机日志）

→ **§六 Gate: PASS**。

---

## §七 L2 FLOW-A Stage Guard Blocker

### 7.1 事实

- commands.ts L84 硬编码 `currentStageId === 'stage-observe-key'`
- commands.ts L97 硬编码 `currentStageId === 'stage-update-key-memory'`
- leave-home.ts L9-11 真实 STAGE_ID = `'stage-observe-fetch'` / `'stage-key-outdated'` / `'stage-finalize'`
- **四个字符串 100% 不匹配** → 两个阶段 guard 永不触发 → 玩家可以在 E 保存钥匙记忆前直接拿 key。

### 7.2 Blocker

```
Blocker ID:  FLOW_A_REQUIRES_STAGE_GUARD_FIX
Fix before:  Living 实施启动 / L2 剧情代码合并
Severity:    HIGH（直接导致 L2 记忆教学张力失效）
Fix scope:   命令式：commands.ts L84/L97 的 stage 字符串改为 leave-home.ts 的常量
             OR：将 STAGE_ID 集中到一个常量文件，两处都引用
当前 Gate 影响：不阻断本轮 Evidence Integrity 核验；但在 A1.5 被 HUMAN APPROVAL 后、
              进入 Living 代码实施前，必须关闭此 Blocker。
```

### 7.3 FLOW-A 宣称修正

- ❌ 原若宣称 "零代码改动即可保证 L2 钥匙流程" → 必须删除 / 改写
- ✅ 合规宣称："**FLOW-A_REQUIRES_STAGE_GUARD_FIX** Blocker 已登记；在 Living 实施首 commit 中完成 stage guard 字符串修复后，FLOW-A 才能宣称零额外逻辑改动。"

→ **§七 Gate: PASS（Blocker 已正确标记）**。

---

## 最终 Gate 判定

### 9 项 Gate 条件逐条检验（用户要求）

| # | Gate 条件 | 是否满足? | 引用章节 |
|---|----------|:---------:|----------|
| G1 | 源码状态无矛盾 | ✅ | §一 C1–C8 全部 CLEAN |
| G2 | P0 墙体契约无双重定义 | ✅ | §二 选 P0-A 唯一，互斥陈述已清理 |
| G3 | 资产 stem 全部来自真实白名单 | ✅ | §三 10 项 INVALID 已列黑名单 + 白名单已审计 |
| G4 | washer/dryer/bed 测量可追溯 | ✅ | §四 ZIP/OBJ/GLB SHA 齐全；Raw/Ledger TWO-LEDGER 并存 |
| G5 | Minimap 由脚本验证通过 (10 ASSERT) | ✅ | §五 V3 ALL 10 PASS=True |
| G6 | SVG 无裁切 | ✅ | §五 §四 viewBox 含 ≥45px margin |
| G7 | 所有门洞中心一致 (≤1px 误差) | ✅ | §五 §3.3 Δ=0.000px × 5 门 |
| G8 | 未测性能结论已降级 (UNVERIFIED_INFERENCE) | ✅ | §六 U1–U8 全部降级禁止 Gate |
| G9 | L2 stage guard 被正确标记为 blocker | ✅ | §七 FLOW_A_REQUIRES_STAGE_GUARD_FIX 已登记 |

### 最终 Gate（三选一）

```
FINAL GATE = A1_5_HUMAN_APPROVAL_REQUIRED
```

**机器无法代替人类批准 A1.5**。人类在批准 A1.5 前需要确认：
1. 接受 P0-A（per-room 双墙 LEGACY_CURRENT_STATE）作为短期墙体契约；或需要立即进入 Phase 1 wall refactor。
2. 接受 F8（relocated key baseline 在 A1.5 Living 中 Z=-3.2 越界 0.45m）是 A1.5 落地前必须解决的**数值几何修正项**（不阻断本轮 Evidence，但阻断生产代码）。
3. 接受 FLOW_A_REQUIRES_STAGE_GUARD_FIX 在 Living 实施首 commit 中必须修复。
4. 接受 stem 白名单 INVALID（特别是 wardrobe / dishwasher / refrigerator 缺失）对家具布置的实际影响。
5. 接受 washer/dryer/bedDouble 尺寸 TWO-LEDGER 状态，并选定落地时使用的 scale 方案（A 真实 / B 统一×2 / C 保持手写）。

### 其他 Gate 选项排除

- ❌ **EVIDENCE_INTEGRITY_REPAIR_FAILED**: 不选（7 文件无矛盾；§一–§七无互斥）
- ❌ **NO_GO**: 不选（9 项 Gate 子条件全部满足；本轮目标已达成）

---

## 输出清单（保持 untracked，不得 commit/push）

| # | 文档路径 | 状态 |
|---|----------|------|
| 1 | `docs/design/FINAL_EVIDENCE_INTEGRITY_REPORT.md` (本文件) | ✅ UNTRACKED |
| 2 | `docs/design/SOURCE_STATE_TRUTH_TABLE.md` | ✅ UNTRACKED |
| 3 | `docs/assets/ASSET_STEM_WHITELIST_AUDIT.md` | ✅ UNTRACKED |
| 4 | `docs/assets/WASHER_DRYER_BED_REMEASUREMENT.md` | ✅ UNTRACKED |
| 5 | `docs/design/A1_5_MINIMAP_MACHINE_VALIDATION.md` | ✅ UNTRACKED |
| 6* | (out-of-repo) `/tmp/minimap_validation_a15_v3.py` 临时验证脚本 | ✅ 仓库外 |
| 7* | (out-of-repo) `/tmp/a15_minimap_v2.svg` 机器生成 SVG | ✅ 仓库外 |
| 8* | (out-of-repo) `/tmp/a15_v3.json` / `a15_minimap_validation_v2.json` | ✅ 仓库外 |

> 严禁：修改代码 / commit / push。本轮仅产生 untracked 证据文件。

---

**End of FINAL_EVIDENCE_INTEGRITY_REPORT.**
