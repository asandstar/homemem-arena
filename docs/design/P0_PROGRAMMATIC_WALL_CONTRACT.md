# P0 PROGRAMMATIC WALL CONTRACT (近期生产冻结方案)

Document ID: P0_PROGRAMMATIC_WALL_CONTRACT
Date: 2026-08-03
Baseline Commit: c5a2f83
Status: UNTRACKED · PLANNING ONLY · PHASE-1 PRODUCTION BASELINE (FROZEN)
Supersedes: WALL_THICKNESS_AND_SHARED_WALL_CONTRACT.md (B2 方案从近期路线移除)

---

## §0. 为什么废弃 B2 作为近期生产方案

B2 方案（logicalT = 0.12m, visualT = 0.20m, 同一 shared-wall centerline）存在以下经重新验证的矛盾，不适合作为第一阶段生产基线：

| # | 矛盾项 | 说明 |
|---|--------|------|
| 1 | internal shared wall 两边都是房间 | 视觉墙比逻辑墙厚出的 0.04m 会同时进入两侧房间内部空间；Room A / Room B 排序不能自动决定"向房间外扩张"的方向 |
| 2 | interiorFaceA 并不总是对应 roomA | 公式 interiorFaceA = W − Tl/2 的语义只在 wall owner = roomA 时成立，但 shared wall 同时属于两个房间，owner 概念不清晰 |
| 3 | 视觉与碰撞边界偏差增加 | 视觉 face 在 collision face 内侧 0.04m 或外侧 0.04m，随机取决于 room 排序，给玩家"为什么能看见但走不过去"的不一致感 |
| 4 | 实现复杂度 | 需维护 structural GLB overlay + normalizer 表，第一阶段没有必要承担这个复杂度（当前 Room3D 实际 wall mesh 已经是程序化生成，t=0.1） |
| 5 | 墙体所有权含糊 | B2 声称 SharedWallBlueprint 唯一所有权，但代码层面（Room3D lines 881-1038）仍是每个房间自画四面墙，shared face 会被两个房间都绘制 → 潜在 Z-fighting |

**结论：B2 方案正式从近期生产路线移除，标记为 DEFERRED_STRUCTURAL_GLTF_EXPERIMENT。**

---

## §1. P0-WALL · 程序化单厚度墙体 — 正式冻结定义

```yaml
Contract: P0-WALL · PROGRAMMATIC SINGLE-THICKNESS WALL
Applicable scope: Phase 1 (Living 垂直切片稳定前所有 rooms)
```

### 1.1 核心参数 (不可修改)

| 参数 | 值 | 说明 |
|------|----|------|
| logicalThickness Tl | **0.12 m** | 碰撞厚度；minimap centerline 宽度；room 内净尺寸边界 |
| visualThickness Tv | **0.12 m** | 与 logical 完全一致；程序化墙 mesh 同时负责 visual geometry |
| wall height H | **3.0 m** (默认) | 与 rooms.ts size.y 对齐；个别房间不同时取 rooms.ts 值 |
| lintel height | roomH − doorwayH | doorway 上方过梁与墙体同厚度 |

### 1.2 墙段职责 (单一程序化墙段负责全部)

| 职责 | 由谁负责 | 说明 |
|------|----------|------|
| visual geometry (墙面渲染) | P0 程序化 mesh | 使用 Kenney 风格色板 + 简单低成本材质；可选重复纹理 |
| collision footprint | P0 程序化 mesh (AABB) | 与 visual 几何完全一致，无偏差 |
| doorway gap (门洞缺口) | P0 程序化 buildWallSegments | 按 doorway offset + width 自动留空，上方画过梁 |
| minimap centerline / outline | P0 程序化 wall centerline | 墙段中线 = logical 墙中心线；draw stroke width ≈ Tl |
| baseboard / wall trim (可选) | 独立无碰撞装饰层 | 贴地细梁，不影响碰撞和 footprint |

### 1.3 第一阶段绝对禁止项

以下操作 **严禁** 在 Phase 1 生产代码中出现：

```
❌ 不得使用 Kenney wall GLB 替换所有墙
❌ 不得生成双层视觉墙 (visual-inner + visual-outer)
❌ 不得让 visualThickness 和 logicalThickness 不同
❌ 不得修改墙厚至 0.20m (B2 Tv 值)
❌ 不得为每个结构模型维护 thickness normalizer 表
❌ 不得让 Room3D 在 shared-wall face 上重复绘制墙体（Room A 和 Room B 都画）
```

### 1.4 Door / Window 例外条款

Door visual 和 Window frame visual **允许** 使用独立模型，但以下约束不变：

| 项 | 墙体权威 (不变) | 模型可覆盖 (仅视觉) |
|----|------------------|---------------------|
| 墙体缺口 (门洞/窗洞 size 和位置) | P0 程序化墙决定，数值来自 rooms.ts doorways[] + future windows[] | ✅ 可叠加 Door3D / Window3D visual overlay 美化 |
| 墙体碰撞 footprint | P0 程序化墙决定 (doorway gap = 可通行区) | ❌ 不得让 door frame / window frame 改变碰撞 |
| 墙体在 minimap 上的 outline | P0 centerline 决定 | ❌ window / door visual 不得影响 minimap 绘制 |

### 1.5 与现有 Room3D 代码的对应关系

当前 Room3D.tsx (lines 882-1039) 的实现 **已经非常接近 P0-WALL**：

```
现状: t = 0.10 m (line 887)
目标: t = 0.12 m (后续 G1 接入时调整 1 行)
```

其他逻辑（buildWallSegments 门洞分段、四面墙顺序、过梁绘制）均可直接复用。无需引入新的 wall 渲染管线。

---

## §2. DEFERRED_STRUCTURAL_GLTF_EXPERIMENT

以下实验 **只能在 Living 垂直切片稳定后 (Phase 2+) 重新评估**，Phase 1 不得开启：

| 实验项 | 触发条件 (Phase 2+) | 回滚方案 |
|--------|---------------------|----------|
| Kenney wallStraightA / wallCorner 等 GLB 视觉替换 | Living 垂直切片 3 回合 E2E 全过且 performance profiler 显示 wall mesh draw call 占比 > 15% | 切回 P0 程序化 mesh |
| visualT ≠ logicalT (B2 复活) | 美术提出明确视觉需求且用户验收发现 P0 视觉"太单薄不像真实房子" | 切回 P0 Tv=Tl=0.12 |
| SharedWallBlueprint 唯一所有权 + 跨房间渲染 | Scene Graph 激活且 rooms.ts 支持 sharedWallIds 外键 | 回退到房间各自画墙，Z-fighting 时取 depthOffset 0.001 |
| wall 纹理 / 材质 atlas | 全 5 房 L2 旗舰关美术 Review 指出"纯色像游戏原型" | 切回纯色 Material + 细梁 baseboard |

---

## §3. 墙体视觉 / 碰撞所有权划分 (FROZEN for Phase 1)

| 概念 | visual owner | collision owner |
|------|--------------|-----------------|
| 内部 shared wall (4 面: B↔L, L↔E, L↔DK, DK↔Ly) | P0 程序化 mesh (**由位置较大的 room 绘制半边 + 位置较小 room 绘制半边，合计一条完整墙；或 Phase 1 允许两条墙段在 Tl/2 公差内，视觉上看起来是一条，因为两房间同材质同色**) | P0 程序化 mesh (两房间各自的 AABB 在 shared centerline ±Tl/4 处接壤，通过 0.01m tolerance 不穿透即可) |
| 外墙 (约 15 面) | P0 程序化 mesh，由该 face 所属 room 独立绘制 | 同上 |
| doorway gap 可通行区 | P0 程序化 mesh (不绘制那段) | same — 无碰撞 mesh 即为通路 |
| baseboard / trim (可选) | 独立装饰 mesh (Phase 2) | 不参与碰撞 |
| door visual (Kenney door GLB) | Door3D 组件 | 不参与碰撞（doorway gap 是永久 open 的 corridor） |

### 3.1 Phase 1 对 shared-wall double-draw 的临时容忍

现有代码中 Room A 和 Room B 会各自绘制自己的那面 shared wall（例如 Living 画东墙，Entrance 画西墙；两面墙在 X=±3.5m 处，厚度各 0.1，实际视觉会重叠 0.08m）。

**Phase 1 处理规则：两面墙材质相同 (rooms.ts wallColor 对称) 且墙段尺寸一致 → 视觉上像一面墙，允许存在。** 不通过 wall drawing 去重来优化 draw call；该问题属于 Phase 2 SharedWallRenderer 范畴。

只有当 Z-fighting / 闪烁出现时，才给较小 roomId 的墙加 `polygonOffset 1,1`（例如 living 的 id 比 bedroom 字母序大，则 bedroom 画墙时 polygonOffset=ON）。

---

## §4. GO / NO-GO 条件 (for this document being declared valid)

- GO: P0-WALL 参数 0.12m × 0.12m 被本规划文档采纳，且代码接入时只需调整 Room3D.tsx line 887 的 `t = 0.1` → `t = 0.12`
- NO-GO: 出现视觉 artifact 无法通过材质调整解决，必须引入 visualT > logicalT → 本契约作废，进入 DEFERRED 分支评审

---

End of P0_PROGRAMMATIC_WALL_CONTRACT. Frozen for Phase 1.
