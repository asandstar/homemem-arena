# PRE-IMPLEMENTATION BLOCKER REGISTER (实施前阻断项登记)

> Doc ID: A1_5_PRE_IMPLEMENTATION_BLOCKER_REGISTER
> Scope: §十四 5 个生产实施前阻断项 + 严重性 / 要求 / 修复建议 / 修复范围
> 注意：本 Register 中的 5 Blockers 是 A1.5 LAYOUT RECOMMENDED → 代码实施必须修复的工作包首个任务。
> 本阶段是文档（本轮不修。

---

## BLOCKER-L2-01 (§十四 14.1) — FLOW_A_REQUIRES_STAGE_GUARD_FIX

| 字段 | 内容 |
|---|---|
| Blocker ID | **BLOCKER-L2-01** |
| 标题 | FLOW-A (KEY-FIRST) 需要 stage guard 名字不一致修复 |
| 严重度 | 🔴 P0 CRITICAL (L2 无法在错误 stage 会不触发 cat relocate; 直接失败) |
| 原因源码事实 | commands.ts line~审计: stage-observe-key 两个阶段|
| — | 真实任务 leave-home.ts 使用: `stage-observe-fetch` + `stage-key-outdated` |
| 当前状态 | 源码中硬编码 2 个错误 stage 名 → 进入代码实施 L2 时 FLOW-A 不会启动。 |
| Runtime 影响 | OR 双条件 (keyFreshSaved&leftLiving / phoneObtained) 触发猫事件，但 relocate 若 stage guard 失败，key 不移动。表现为猫走了但 key 仍在原位。 |
| 修复要求 (§十四) | 进入 Living / L2 代码实施的**首个工作包**中修复。 |
| 修复范围 (工作包建议) | `src/game/commands.ts` stage-observe-key → stage-observe-fetch；stage-update-key-memory → stage-key-outdated。同时做反向检查 leave-home.ts stages 名匹配。 |
| 验证方法 | 运行 task: 单测：(a) leave-home stages 列举；(b) commands.ts 中所有 stage 名引用；(c) 手动 FLOW-A 跑；(d) 断言 key 确实 relocate。 |
| 关联 Layout | 与 LIVING-A relocated key 坐标 (BLOCKER-L2-02 输出) 一起交付 |
| 负责模块 | commands.ts + leave-home.ts task |
| Planning confidence | 修复方案明确，风险低 |
| Blocker 状态 | ❌ NOT FIXED |

---

## BLOCKER-L2-02 (§十四 14.2) — RELOCATED_KEY_BASELINE_OUT_OF_BOUNDS

| 字段 | 内容 |
|---|---|
| Blocker ID | **BLOCKER-L2-02** |
| 标题 | L2 代码中 relocated key 目标位置在 A1.5 Living 外越界 |
| 严重度 | 🔴 P0 CRITICAL (key 掉出房间 → 玩家永远找不到 = L2 死锁) |
| 原因 | 当前 `leave-home.ts` / `tasks/` 中 relocated key targetPosition 硬编码 **(-3.2, -3.2)** Living local or world. 现在 Living A1.5 Z range = [-2.75, +2.75]. -3.2 < -2.75 → Z 方向越界 0.45m。 |
| 布局推荐新值 (§十五 4.1 + §八 Living-A §1.3) | KEY-LOC-A: **Living local (-0.4, +2.0)** = world (-0.4, +2.0). (Living center=0,0 → local=world)。语义：sofa 西端座垫下。 |
| 修复要求 | 最终 Living 布局确定 key 位置后更新。→ 本轮已推荐，**必须改成 (-0.4, +2.0)。 |
| 修复范围 | `src/data/tasks/leave-home.ts` (或 key 新位置所在任务配置文件). 任何写死 relocatedTarget 的所有位置数组同步更新。 |
| 关联 Blocker | 更新后必须配合 BLOCKER-L2-01 同时交付 (stage guard + key new loc = 一个工作包) |
| Out-of-bounds 旧值确认 | |
| — Living X range | [-3.25, +3.25] | -3.2 ✅ 勉强 (X OK) |
| — Living Z range | [-2.75, +2.75] | -3.2 ❌ 越界 0.45m OUT |
| 新值检查 | (-0.40, +2.00) 完全在内部 ✅ margin X=|-3.25 - (-0.4)|=2.85m；|+2.75 - (+2.0)|=0.75m 都 ≥ 0.1 |
| Blocker 状态 | ❌ NOT FIXED |

---

## BLOCKER-ASSET-01 (§十四 14.3) — INVALID_OR_UNVERIFIED_STEMS

| 字段 | 内容 |
|---|---|
| Blocker ID | **BLOCKER-ASSET-01** |
| 标题 | 资产 stem 未验证 / 黑名单 stem 未清理 |
| 严重度 | 🟠 P1 HIGH (资产缺失时 placeholder 可见；生产发布前必须真实 GLB 存在) |
| 原因 | 部分 PLACEHOLDER_ONLY 类 (10 项) 无真实 GLB；且 VALIDATED_ASSET (18 项) 的文件存在性需在导入时再次核验。§五 资产选择证据规则要求四条件同时满足 (stem in inventory / 文件存在 / GLB path 可列出 / Kenney CC0)。本轮 Ledger 已经清理所有 INVALID_STEM (10 项黑名单移除)。生产导入前再逐件核验。 |
| 修复要求 | 生产导入前逐件验证实际文件存在。4 类动作：(a) 18 VALIDATED_ASSET → 逐个列 GLB path + md5 校验；(b) 5 VALIDATED_PROXY → 逐个列代理 GLB 存在；(c) 10 PLACEHOLDER_ONLY → 下次 PolyPizza/CC0 扫包下载 US-1, CU-1, SH-1, Lamp, Rug, cleaning 等；(d) 任何 stem 未通过 FILE 检查 → 立刻移除或替换为 PROXY，不得 INVALID。 |
| 修复范围 | `docs/assets/A1_5_ASSET_PLACEMENT_LEDGER.md` status 列 导入后状态从 PROVISIONAL → FROZEN_IMPORTED；源码 decorFurniture.ts ownership 资产导入. |
| Gap list 下载工作包 | P4 (伞架) / P5 (curtain) / P6 (shoes) / P9 (floor lamp) / P10 (rug) / P13 (detergent) 共 6 项 PolyPizza 下载任务 (US-1 CU-1 SH-1 Lamp CC0 catalog search)。 |
| 本轮处理 | INVALID_STEM = 0 已清。  |
| Blocker 状态 | 🟡 IN_PROGRESS_VALIDATION_REQUIRED |

---

## BLOCKER-SCALE-01 (§十四 14.4) — PER_ASSET_EFFECTIVE_SCALE_NOT_FROZEN

| 字段 | 内容 |
|---|---|
| Blocker ID | **BLOCKER-SCALE-01** |
| 标题 | 每个资产的最终 effective scale 未冻结；禁止全包 ×2 |
| 严重度 | 🟠 P1 HIGH |
| 原因 | §六 明确**禁止 GLOBAL_FURNITURE_SCALE = 2.0** 作为统一结论。A1_5_ASSET_PLACEMENT_LEDGER §1 F1-F20 20 项 proposedScale 均标记为 PROVISIONAL (非统一, 非冻结)。 例如 loungeSofa sx=1.22 sy=1.03 sz=1.22 非统一；Washer sx=1.67 sy=2.30 sz=1.35 NO_UNIFORM scale。需要导入预览阶段逐件冻结。 |
| 修复要求 | 资产导入和预览阶段逐件冻结，不允许全包 ×2。流程：1) 导入 raw GLB → 显示 AABB 与 layoutSafeEnvelope 对齐 → 2) 计算 per-axis sx/sy/sz = layoutSafeEnvelope / rawGlbAabb；3) 在 Blender 或引擎内 scale 烘焙到 AABB≈safeEnvelope；4) 写入 asset_dimensions.ts 每个 assetDimensionId 对应 per-axis scale FROZEN。 |
| 特殊项处理 | |
| — sideTable (ADIM-012) raw X 1.07m 太宽，床头柜需要 0.6m  → sx=0.56 HALVED → 必须重导出或裁剪 mesh (建议替换 cabinetBedDrawer (F20 ADIM-020) 代替 sideTable 作床头柜更合适，天然 0.65m ×0.60m × 尺寸更接近真实床头柜 |
| — mug (ADIM-016) Kenney mug 风格化 0.344m 偏大 → 保持 × 1 倍 允许 |
| — F19 kitchenCabinetDrawer → dishwasher visual proxy → scale 缩到 0.85×0.95×0.50 合适 |
| Blocker 状态 | ❌ NOT FROZEN (PROVISIONAL) |

---

## BLOCKER-WALL-01 (§十四 14.5 = §四) — LEGACY_SHARED_WALL_DOUBLE_DRAW

| 字段 | 内容 |
|---|---|
| Blocker ID | **BLOCKER-WALL-01** |
| 标题 | 遗留 per-room 双墙重复渲染 P0-A_LEGACY_PER_ROOM_DOUBLE_DRAW |
| 严重度 | 🟡 P2 MEDIUM (视觉 artifact，但不是 layout blocker) |
| 原因 | Room3D.tsx 按房间分别生成墙体 (§四现状)。相邻房间共享墙重叠渲染 double；视觉厚度 ~0.10m。尚未实现 SharedWall 单一生成 (Polygon offset 临时方案不算正式治理)。本轮布局规划时已预留墙重叠区域家具不放入。 |
| 修复要求 (§四) | 允许布局规划继续 (DEFERRED_TO_IMPLEMENTATION_GOVERNANCE)。生产实现阶段不得宣称已治理。正式治理需：抽取 SharedWall edges，shared edge → 只生成一次 mesh，两端房间墙体剪去 gap + doorway 一致化。 |
| 视觉影响 | 家具不得放入 shared wall overlap 区域 (本蓝图规划时已确保所有 furniture footprint 与 shared wall 至少 ≥0.1m 间距) |
| Minimap 影响 | SVG 中 P0-A 双墙 红色 dashed 标注 (见 MINIMAP_LAYOUT_OVERLAY.md)，提醒实施前视觉修复 |
| 与 Layout 相关性 | 不阻塞本轮布局规划 (DEFERRED) |
| Blocker 状态 | 🟡 DEFERRED_TO_IMPLEMENTATION_GOVERNANCE |

---

## 汇总矩阵

| ID | 标题 | Severity | 修复工作包所属阶段 | 状态 |
|---|---|:---:|---|---|
| BLOCKER-L2-01 | FLOW-A stage guard fix | 🔴 P0 | L2 首个实施 WP1 | ❌ 未修 |
| BLOCKER-L2-02 | Relocated key out-of-bounds | 🔴 P0 | L2 首个 WP1 (same as L2-01) | ❌ 未修 (目标值: Living local (-0.4, +2.0)) |
| BLOCKER-ASSET-01 | Stems 文件验证 + 6 placeholder 下载 | 🟠 P1 | 资产导入 WP0 (pre-WP1) | 🟡 需验证 |
| BLOCKER-SCALE-01 | Per-asset scale 冻结 | 🟠 P1 | 资产导入 WP0 同包 | ❌ PROVISIONAL → FROZEN |
| BLOCKER-WALL-01 | Shared wall 双画 | 🟡 P2 | Implementation Governance 后期 (layout不阻塞) | 🟡 DEFERRED |

### 推荐实施工作包顺序

```
WP0 (ASSET IMPORT PACKAGE):
  BLOCKER-ASSET-01 FILE check + PolyPizza 6 downloads
  BLOCKER-SCALE-01 scale freeze → decorFurniture + assetDimensions ledger

WP1 (L2 CORE FIX PACKAGE + WALL DEFER DOC):
  BLOCKER-L2-01 stage guard fix (commands.ts + leave-home.ts)
  BLOCKER-L2-02 key new loc (-0.4, +2.0)
  BLOCKER-WALL-01 Governance doc 登记 (DEFERRED 不实施治理只写治理计划)

WP2 (ROOM GEOMETRY PACKAGE):
  rooms.ts sharedRooms 6.5×5.5 etc 改 A1.5 蓝图尺寸
  doorway 4 gaps + 1 front door
  furniture 51 entities 坐标写入

WP3 (LEVEL WP):
  L1 DK-A positions cup/tissue/fork + 3 containers
  L2 Key + Cat event
  L3 Laundry-A 9 garments + 3 baskets + machines

WP4 (MINIMAP + QUALITY):
  Minimap entitySlice → SVG 对齐
  Minimap 不泄露 new key
  10 minimap assertions 实现层 pass
```

---

All 5 Blockers registered.
