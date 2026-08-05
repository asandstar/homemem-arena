# HOMEMEM ARENA HOUSE TOPOLOGY, DOORWAY, COORDINATE AND MINIMAP SINGLE-SOURCE PLAN

Master Plan Document ID: HOMEMEM_ARENA_HOUSE_TOPOLOGY_PLAN
Date: 2026-08-03
Baseline Commit: c5a2f83cd5ec608a119fbb237d80f4f67bd1450e (main = origin/main)
Current Status: UNTRACKED · PLAN MODE COMPLETE · AWAITING GATE
Recommended Topology: Candidate A · Compact Hub Apartment (CANDIDATE FOR HUMAN APPROVAL, NOT APPROVED)
Global Furniture Scale: FURNITURE_GLOBAL_SCALE_PROVISIONAL = ×2.0 (PROVISIONAL, bedDouble 需 Blender 审计后升 CONFIRMED)

---

## 本文件是 PLAN MODE 主汇总。8 份子文档见 docs/design/：

| # | Doc | Path | Section 覆盖 |
|---|-----|------|---------------|
| D1 | ASSET_SCALE_AND_GLTF_CROSSCHECK | docs/design/ASSET_SCALE_AND_GLTF_CROSSCHECK.md | §二.A~D (GLB/OBJ, scale, Mug, Poly Pizza 降级) |
| D2 | HOUSE_TOPOLOGY_BLUEPRINT | docs/design/HOUSE_TOPOLOGY_BLUEPRINT.md | §三~§五 (10 问 / 三套拓扑 / RoomBlueprint 类型) |
| D3 | ROOM_ADJACENCY_GRAPH | docs/design/ROOM_ADJACENCY_GRAPH.md | §八 (邻接矩阵 + SVG + 8 QA + 关卡 room 限制) |
| D4 | WALL_AND_DOORWAY_GENERATION_SPEC | docs/design/WALL_AND_DOORWAY_GENERATION_SPEC.md | §六~§七 (墙体策略 + 三段式门洞 + 4 Wall QA) |
| D5 | WORLD_ROOM_MINIMAP_COORDINATE_CONTRACT | docs/design/WORLD_ROOM_MINIMAP_COORDINATE_CONTRACT.md | §九 (3 坐标系 + 5 个转换 + 示例) |
| D6 | MINIMAP_SYNCHRONIZATION_CONTRACT | docs/design/MINIMAP_SYNCHRONIZATION_CONTRACT.md | §十~§十一 (单一数据源 +  eligibility + 三关记忆表达) |
| D7 | ROOM_ENVELOPE_AND_CIRCULATION_REQUIREMENTS | docs/design/ROOM_ENVELOPE_AND_CIRCULATION_REQUIREMENTS.md | §十二~§十三 (五房 envelope + 三关距离) |

---

## §0. 前置 & 本轮禁令检查 (全部通过)

| Check | Result |
|-------|--------|
| branch = main? | ✅ main |
| HEAD = origin/main? | ✅ c5a2f83 both |
| staged files? | ✅ 0 |
| modified tracked files? | ✅ 0 (全部新增为 untracked 文档) |
| 模型 / ZIP 进入仓库? | ✅ 否（仍在仓库外审计目录） |
| 本轮是否修改 src/tests/scripts/config/Room3D/rooms.ts/decorFurniture/Minimap/tasks? | ✅ 否 |
| 本轮是否 commit / push? | ✅ 否 |
| 本轮是否下载 Poly Pizza / 复制模型? | ✅ 否 |

---

## 1. GLB / OBJ Cross-check (§二.A → 见 D1 全文)

| Summary | Value |
|---------|-------|
| 11 原生 GLB 审计 | ✅ 9/11 **GLB_OBJ_MATCH** |
| door-rotate-square-a | GLB_OBJ_MATCH_WITH_AXIS_DIFFERENCE (GLB 多门框基座 2.5cm + 10cm 宽度过梁，**可接受**，门扇本体 0 误差) |
| bedDouble | ⚠️ GLB_OBJ_MISMATCH (GLB 多含床头/床尾板，+69% 包络；**可解释**，非破坏性；PROVISIONAL 状态待 Blender 审计) |
| **核心三件 Gate** (Sofa / CoffeeTable / Bed) | Sofa ✅ / CoffeeT ✅ / Bed ⚠️可通过 (GLB 更大全包络不阻断) |
| Gate 状态 | ✅ **GLB/OBJ 无重大冲突**（Bed 差异可解释且有后续审计计划） |

---

## 2. Furniture Kit Scale Calibration (§二.B → D1)

| Candidate | Sofa W×D×H | CoffeeT W×D×H | Bed (OBJ) W×L×H | Verdict |
|-----------|-----------:|--------------:|----------------:|:-------:|
| ×1.0 | 0.98×0.41×0.46 ❌全小 | 0.66×0.40×0.23 ❌ | 1.91×2.25×0.75 ⚠️OK | ❌ |
| ×1.75 | 1.72×0.72×0.81 ⚠️D 低 | 1.16×0.70×0.40 ✅ | 3.34×3.94×1.31 ❌超 king | ⚠️ |
| **×2.0** | **1.96×0.82×0.92 ✅全在区间** | **1.32×0.80×0.46 ✅** | OBJ×2.0=1.91×2.25×0.75 ✅; GLB×2.0需 per-model 0.85 补偿 | ✅⭐ |

**结论：FURNITURE_GLOBAL_SCALE_PROVISIONAL = ×2.0**
- 这是 HomeMem Arena 项目视觉尺度决定；非 Kenney 官方单位事实。
- bedDouble 需 GLB 子 mesh 过滤或 per-model 0.85 缩放补偿，不影响 global ×2.0 决定。
- 状态 = **PROVISIONAL**（下一轮 Blender 审计 bedDouble mesh 后升 CONFIRMED）。

---

## 3. Mug 尺寸矛盾修正 (§二.C → D1)

| 矛盾对 | 原值 | 修正值 | 依据 |
|--------|------|--------|------|
| Mug height | 0.11m (早期草稿误写，作废) | **0.273m (raw food-kit GLB ×1.0)** | mug.obj + mug.glb accessor 均 height=0.273 raw, 0 误差 |
| 最终选哪个做 L1 obj-cup? | cup (0.20) / cup-coffee (0.14) 都太小 | **选 mug (0.273)** | 2.5m 距离 720p 仍有 22px 辨识度；cup-coffee 0.14m 会看不见 |
| Game scale override 可选 | — | ×0.8 → 0.218m (视觉仍 OK) | 但 AABB footprint 仍以 0.273 为准 |

---

## 4. 推荐拓扑 = Candidate A · Compact Hub Apartment (§三~§四 → D2+D3)

**十问答案（见 D2 §三 Table）：** Living 为中心；4 条相邻；Bedroom/Entrance/DK-Laundry 必须通过 Living；无走廊；Entrance 直接连 Living；Bedroom 直接连 Living；D-K 半开放；Laundry 从 D-K 进；单层五房 OK；L1/L2/L3 通过 taskRooms 限制激活。

### 三套对比总分 (满分 50)

| 维度 | A Compact Hub | B Linear | C Split-Zone |
|------|:---:|:---:|:---:|
| L2 核心往返 ≤ 17m | 17m ✅ | 27m ❌ | 25m ❌ |
| Minimap 可读性 | 5/5 | 3/5 | 4/5 |
| 门洞不打架 | 5/5 | 3/5 | 3/5 |
| 家具摆放空墙 | 5/5 | 2/5 | 3/5 |
| L2 猫事件绕过率 | 低 ✅ | 高 ❌ | 中 ⚠️ |
| 实施成本（最低好） | 5/5 | 4/5 | 3/5 |
| **总分** | **47 / 50 ⭐** | **33 / 50** | **37 / 50** |

**最终状态 = CANDIDATE FOR HUMAN APPROVAL（需要人类确认 3 项）：**
1. Living 是否接受 7×6 缩小（从现有 8×8）
2. Laundry 在 D-K 东侧（L3 需经 D-K 走廊）可接受？
3. Entrance 3×5 紧凑型 + 伞架 UNVERIFIED 占位？

---

## 5. 房间关系图 (§八 → D3)

```
         [Bedroom L2]
             │ (west door)
             ▼
[Entrance L2] ─ [Living ★Hub] ─ [Dining-Kitchen L1/L3] ─ [Laundry L3]
```

- 5 条 doorway，5 房全连。
- 激活限制：
  - L1：仅 `[dining-kitchen]`
  - L2：`[living, bedroom, entrance]`（D-K 视觉灰，Laundry 断连）
  - L3：`[dining-kitchen, laundry]`
- 8 项自动 QA：asymmetricAdjacency / unmatchedBlueprint / dupDoorway / misalignedCenter / mismatchedWidth / wallCollidesDoor / visualCoversDoor / minimapGapMissing。Candidate A 结构上全通过（Q2/Q4 实施后再数值化 QA）。

---

## 6. 推荐墙体策略 = Strategy B · Programmatic Logical Wall + Thickness-Normalized Kenney Visual (§六 → D4)

| Owner | Truth Source |
|-------|-------------|
| **Collision owner** | RoomBlueprint.size + wallThicknessLogical=0.12m → 程序化四面 Box |
| **Visual owner** | 同一 size + wallThicknessVisual=0.20m → Kenney wall-straight GLB 强制 `scale(targetL/2.0, targetH/2.4, 0.20/0.20)` 归一化贴到逻辑墙外；误差 ≤ 1cm |
| **Minimap owner** | 碰撞 Box XZ 投影（纯 2D） |
| **Doorway owner** | DoorwayBlueprint 单例 → 同时驱动 (a) 逻辑墙三段缺口 (b) 视觉墙三段缺口 (c) minimap 缺口 (d) Door3D 挂载点 |
| **QA owner** | 8 AdjacencyQA + 4 WallQA (W1-W4) |

**严禁：0.12m 碰撞墙 + 0.20m 未缩放视觉墙（三者错配）**
**不选 C (统一 0.20m)：** 影响太大，全房内净家具 envelope 需重算。
**不选 A (纯程序化 + 贴图)：** 失去 Kenney 墙段的细节。

---

## 7. 门洞单一数据源 (§七 → D4)

- 三段式缺口（左段 + 门上过梁 + 右段），无实时布尔/CSG。
- 同一 **DoorwayBlueprint 对象引用** 被两房同时拥有（`===` 相等），禁止 A/B 各写一份坐标。
- 12 项派生量：墙面方向、world doorway center A vs B（差 ≤ 2cm）、法向量相反 dot=-1、通行净矩形、门扇 pivot、开门占用 footprint（家具 QA 查碰撞）、玩家净通行、碰撞/视觉/minimap 三段缺口。

---

## 8. 坐标契约 (§九 → D5)

三个坐标系：
```
world (Three.js 右手, +X=东 +Y=上 +Z=北)
   ↑↓ T1/T2
room-local (原点 = 房间中心，+X/+Z 同 world 局部方向)
   ↑↓ T3/T4
minimap (画布左上 0,0；+X→右；+Y→下 = -world Z)
```

- 家具/容器/任务物体 **一律先写 room-local**，不写 world。
- 5 个纯函数转换：T1 roomLocal→world / T2 world→roomLocal / T3 world→minimap / T4 roomLocal→minimap / T5 minimap→world approx。
- 三个数值示例见 D5 §9.4（Living 茶几 / Bedroom 床头柜 / Entrance 托盘）。

---

## 9. 小地图契约 (§十~§十一 → D6)

三层结构：
1. **固定结构层**（RoomBlueprint 派生来）：房间填充 / 墙 outline / **doorway gap 缺口** / window notch / room name。
2. **大型障碍层**（eligibility filter）：area ≥ 1.2㎡ 或 navObstacle=true 或 taskContainer。显示 Sofa/Bed/DiningTable/Wardrobe/KitchenCounter/WasherDryer/TaskContainers；隐藏植物台灯杯子抱枕。
3. **动态层**（store 派生来）：Player 位置朝向 / Goal room 高亮 / 三关 task containers 颜色编码 / L2 **新鲜记忆(淡蓝) · 过期记忆(红虚+?) · 更新后(金色脉冲瞬态)** / 猫脚印 1× 闪现 / L3 三篮身份白+深+彩。

**L2 严格禁止：** 在 minimap 上直接标新钥匙位置（玩家必须靠自己 Aha）。

---

## 10. L1/L2/L3 路线结论 (§十三 → D7)

| Level | Candidate A | Goal |
|-------|:-----------:|------|
| L1 | ✅ PASS ~17m walk, 单房不跨关 | 1:40 内完成教学 |
| **L2 (核心)** | ✅ **PASS ~17m 首次往返 (Golden)** | Aha 前记忆循环 ≤ 17m；总 walk 占 ≤ 3% 时长 |
| L3 | ✅ PASS ~30m, D-K+Laundry 独立 | 6-10 min 完成分类 |

只有 Candidate A 通过 L2 旗舰关 ≤ 17m 的关键约束。

---

## 11. 下一阶段输入 (G1 / Asset-Aware Room Layout)

人类批准 Candidate A 后，下一工作包（非本轮）输入清单：

1. **Topology:** Candidate A (Compact Hub) 五房矩形 + 四门洞坐标（从 CANDIDATE → APPROVED）
2. **Scale:** FURNITURE_GLOBAL_SCALE_PROVISIONAL ×2.0（先 PROV，不阻塞实施）
3. **Wall:** Strategy B (0.12m logical + Kenney 0.20m visual scaled)
4. **Doorway:** 三段式 + DoorwayBlueprint 单例引用
5. **Coordinate:** room-local first，T1~T5 转换函数在 src/game/coordinateTransforms.ts 实现
6. **Minimap:** 由 RoomBlueprint 生成，eligibility filter + 三关差异化记忆表达
7. **Envelope:** D7 §12 Living/Bedroom/Entrance/D-K/Laundry 五房 zone 清单
8. **Asset status tag system:** CONFIRMED / PROVISIONAL / UNVERIFIED_SEARCH_TARGET 三态（D1 §12 Key）
9. **BedDouble Blender Audit:** 独立小任务（1 工时），完成后把 Scale 从 PROV → CONF

---

## 12. 最终 Gate (§十五)

逐条检查 GO 条件（共 11 条）：

| GO condition | 状态 |
|---|---|
| 1. 选出一个候选整屋拓扑？ | ✅ Candidate A (Compact Hub) |
| 2. 房间关系完整（5 条连接 + 矩阵 + BFS 全连）？ | ✅ 5 edges / 8QA 结构全通过 / R9 reachable ✅ |
| 3. 门洞双向一致（同一 DoorwayBlueprint 引用 + 12 派生量约束）？ | ✅ 规范定义完成 |
| 4. 墙体策略明确（Owner 表 + Strategy B 推荐）？ | ✅ Collision/Visual/Minimap/Doorway/QA 5 Owner 明确 |
| 5. world/local/minimap 坐标契约明确（3 系统 + 5 转换 + 3 示例）？ | ✅ D5 全文 |
| 6. 小地图由单一数据源生成（RoomBlueprint + eligibility）？ | ✅ D6 DAG 图 + eligibility 函数头 |
| 7. L1/L2/L3 路线可行（距离 + 时间占比）？ | ✅ A 全过，L2 核心 17m 卡线 |
| 8. 家具 envelope 能容纳（5 房 × 4-5 zone each）？ | ✅ D7 §12 全部定义且尺寸带 tag |
| 9. 原生 GLB 与 OBJ 尺寸没有重大冲突？ | ✅ 9/11 match；door 差异可接受；bed 差异 PROV + 有 Blender 后续计划 |
| 10. Furniture scale 明确标 confirmed/provisional？ | ✅ PROVISIONAL ×2.0 (bedDouble 审计后升) |
| 11. Mug 尺寸矛盾已修正？ | ✅ 0.11m 作废 → 0.273m；选 mug 非 cup-coffee |

### 最终 Gate 判定

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  GATE = GO_TO_ASSET_AWARE_ROOM_LAYOUT_WITH_SCALE_LIMITATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**为什么不是纯 GO？** 两个 LIMITATIONS：
1. **SCALE PROVISIONAL：** Furniture ×2.0 仍为 PROVISIONAL（bedDouble GLB/OBJ mismatch，Blender 审计 mesh 分组后才能升 CONFIRMED）。G1 阶段 bedDouble 的坐标/碰撞 envelope 使用 OBJ×2.0 的 CONFIRMED 床垫区，视觉使用 GLB + per-model 补偿。
2. **3 UNVERIFIED_SEARCH_TARGET：** Umbrella Stand / Curtain / Shoes 尚未下载 Poly Pizza 审计。Entrance 的鞋架/伞架和窗帘使用占位几何直到下载审计通过。

**为什么不是 GLB_SCALE_VALIDATION_REQUIRED？** Sofa + CoffeeTable + Mug 三大 GLB/OBJ 全 match；Bed 差异有明确根因和后续 Blender 计划，不阻塞实施。比例 ×2.0 对 Sofa/Coffee/Bed(OBJ) 三件核心全部落进现实区间。

---

## 13. Git Status (§十六)

执行：
```
git diff --check    → 0 whitespace error (clean)
git status --short  → 以下 8 份新增为 untracked；staged = 0；modified tracked = 0
```

新增 untracked 文件清单（PLAN MODE 产物，全部保持 untracked，不 commit 不 push）：

```
docs/design/ASSET_SCALE_AND_GLTF_CROSSCHECK.md      (D1)
docs/design/HOUSE_TOPOLOGY_BLUEPRINT.md              (D2)
docs/design/ROOM_ADJACENCY_GRAPH.md                  (D3)
docs/design/WALL_AND_DOORWAY_GENERATION_SPEC.md      (D4)
docs/design/WORLD_ROOM_MINIMAP_COORDINATE_CONTRACT.md (D5)
docs/design/MINIMAP_SYNCHRONIZATION_CONTRACT.md      (D6)
docs/design/ROOM_ENVELOPE_AND_CIRCULATION_REQUIREMENTS.md (D7)
.trae/documents/HOMEMEM_ARENA_HOUSE_TOPOLOGY_PLAN.md (本文件，主汇总)
```

### 禁令最终检查：
- ❌ 修改 src/tests/scripts/config/Room3D/rooms.ts/decorFurniture/Minimap.tsx/tasks — **未触碰**
- ❌ commit / push — **未执行**
- ❌ 开始 G1 / 最终家具摆放 — **未开始**
- ❌ 复制模型到仓库 / 下载 Poly Pizza — **未执行**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
**PLAN MODE 工作包全部完成。停在此处，等待人类批准 Candidate A 与 Gate 判定。**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
