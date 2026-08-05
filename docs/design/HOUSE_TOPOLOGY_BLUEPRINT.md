# House Topology Blueprint

Document ID: HOUSE_TOPOLOGY_BLUEPRINT
Date: 2026-08-03
Status: UNTRACKED · CANDIDATE FOR HUMAN APPROVAL · NOT APPROVED FOR PRODUCTION YET
Scale status: PROVISIONAL ×2.0 (bedDouble 需 Blender 审计后升级 CONFIRMED)

---

## 0. Scope

整屋拓扑蓝图（概念设计，非最终生产坐标），定义：
1. §三 房屋拓扑设计 10 问回答
2. §四 三套候选整屋方案（A Compact Hub / B Linear / C Split-Zone）
3. 推荐方案（CANDIDATE FOR HUMAN APPROVAL）
4. RoomBlueprint 统一概念类型实例稿

**不写进 src/data/rooms.ts。下一阶段房间布局时参考此蓝图再实施。**

---

## §三 · House Topology Design Goals — 10 Questions Answered

| # | 问题 | 答案 | 理由 |
|---|------|------|------|
| 1 | 全屋中心房间是谁？ | **Living（客厅）** | 三关都依赖 Living 作为枢纽；L2 猫事件必须在 Living 发生；视觉上客厅作为"家"的情绪中心最自然。 |
| 2 | 哪些房间直接相邻？ | Living ↔ Bedroom / Living ↔ Entrance / Living ↔ Dining-Kitchen / Dining-Kitchen ↔ Laundry | 4 条相邻连接，保持紧凑。 |
| 3 | 哪些必须通过 Living？ | Bedroom、Entrance、Dining-Kitchen 进出 Laundry 必须先经 Living-Dining 走廊 | 保证 L2 的"离开 Living → 返回 Living 发现 Aha Moment"动线不被绕开。 |
| 4 | 是否需要独立走廊？ | **不需要** | 房间数少（5 房单层），Living 本身兼作走廊；独立 corridor 浪费面积且增加行走。 |
| 5 | Entrance 是否直接连 Living？ | **是** | 现实城市公寓常识；L2 出门→回家 两次经过都要穿过 Living，触发猫事件对比。 |
| 6 | Bedroom 是否直接连 Living？ | **是** | 无走廊前提下，卧室直接连客厅是标准两居布局；L2 手机动线 Bedroom→Living 最短。 |
| 7 | Dining / Kitchen 是否开放式？ | **半开放式**：Kitchen 与 Dining 共空间但与 Living 之间有门洞（无实门） | L1 教学关 Dining 区域不能被 Living 视觉干扰太大；同时保证 Living→Dining→Laundry 通达感。 |
| 8 | Laundry 是否从 Kitchen 进入？ | **是**：Laundry 紧接 Kitchen/Dining 东侧 | 现实住宅常识；L3 可独立从 Dining 进入不依赖 Living 来回搬运。 |
| 9 | 当前五房是否适合保持单层？ | **是** | 5 房总面积 ≈ 230㎡（8×8 + 6×8 + 6×6 + 8×8 + 8×8），单层足够；楼梯会增加第一人称迷路率。 |
| 10 | L1/L2/L3 如何共享房屋？ | L1 只激活 Dining+Kitchen 子区域；L2 激活 Living+Bedroom+Entrance；L3 只激活 Laundry+Dining 子区域 | 通过 `taskConfig.taskRooms` 限制 minimap / collision 可达房，三关互不干扰。 |

---

## §四 · Three Candidate Apartment Layouts

### §4.0 Common Scale Assumptions (PROVISIONAL ×2.0)

所有蓝图统一使用：
- Wall-to-wall interior (不含墙厚)
- Living 7m × 6m（比现有 8×8 略缩小，更温馨真实）
- Bedroom 5m × 6m
- Entrance 3m × 5m
- Dining-Kitchen 6m × 6m
- Laundry 5m × 5m
- Corridor width（共享通道）≥ 1.2m
- Doorway width = 1.4m（通行净宽 1.2m，PLAYER_RADIUS 0.3 × 2 + margin）
- Doorway height = 2.2m
- Wall thickness logical = 0.12m（collision），visual overlay = 0.20m（Kenney），契约见 WALL_AND_DOORWAY_GENERATION_SPEC.md §六

---

### Candidate A · Compact Hub Apartment（紧凑型枢纽公寓）

**Topology graph:**
```
        [Bedroom]
            │ (west door)
            ▼
[Entrance] ─ [Living] ─ [Dining-Kitchen] ─ [Laundry]
  (east door)   (south door)    (east door)
```

**Top-down ASCII (cardinal):**
```
                North +z

  ┌─────────────────────────────────────────────────┐
  │  [Bedroom 5×6]    │     [Living 7×6]            │
  │  x: -9 to -4      │    x: -3.5 to +3.5          │
  │  z:  0 to +6      │    z:  0 to +6              │ W
W │                   │                             │ e
e │   Door: living西墙 │    Door entrance: +z墙中     │ s
s │   z=+3 mid        │    Door kitchen: -z墙中      │ t
t │                   │                             │
  ├───────────────────┴─────────────────────────────┤
  │  [Entrance 3×5]  x:+4.5~+7.5 z:-5~0             │
  │  Door: -x墙中 连 living +z 东侧                 │
  ├─────────────────────────────────────────────────┤
  │  [Dining-Kitchen 6×6] x:-3~+3 z:-7~-1           │
  │  Door living: +z 墙中；Door laundry: +x 墙北端    │
  ├───────────────────────────┬─────────────────────┤
  │  [Laundry 5×5] x:+4~+9 z:-6~-1                 │
  │  Door: -x墙北连 D-K                             │
  └──────────────────────────────┴──────────────────┘

                South -z
```

**Candidate A Metrics Table:**

| 指标 | 数值 |
|------|------|
| Room count | 5 rooms (L/B/E/D-K/L) |
| 房间矩形数量 | 5 rectangles |
| 房间中心坐标（world x,z approx） | L:(0,+3), B:(-6.5,+3), E:(+6,-2.5), D-K:(0,-4), L:(+6.5,-3.5) |
| 候选尺寸（内净，w×d） | L:7×6, B:5×6, E:3×5, DK:6×6, L:5×5 |
| 相邻关系对 | 6 条（L-B, L-E, L-DK, DK-Ly, 重复=0） |
| 门洞数量 | 5 条 doorway |
| 玩家主要路径（L2） | E→L→B→L→E（正常） / L→B→L→DK→L→E（错路） |
| L1 使用范围 | **仅 Dining-Kitchen 6×6 西南区域（餐桌 + 三容器）** |
| L2 使用范围 | Living + Bedroom + Entrance（DK/Laundry 视觉上可见但 minimap 灰） |
| L3 使用范围 | **仅 Laundry + Dining-Kitchen 东侧一条带** |
| 纯走路估算 L2 Golden Path | E→B→E ≈ 5+7+5 = 17m |
| 纯走路估算 L3 | Laundry 内部对角线 ≈ 7m（单程） |
| Minimap 可读性 | ⭐⭐⭐⭐⭐ 5/5 四向十字形，一眼认出 |
| 门洞冲突风险 | LOW（Living 4 条门分布在 4 墙，互不打架） |
| 家具可容纳性 | HIGH（各房形状方正） |
| 怀旧家庭科幻构图潜力 | ⭐⭐⭐⭐ 4/5 现代公寓格局，缺少纵深感 |
| 实施成本 | ⭐⭐⭐⭐⭐ 5/5 最简单，基本沿用现有 sharedRooms 只需改坐标与尺寸 |

---

### Candidate B · Linear Apartment（线性一字排开公寓）

**Topology graph:**
```
[Entrance] → [Living] → [Dining-Kitchen] → [Bedroom]
                              │
                              ▼
                         [Laundry]
```

**Top-down ASCII (east-west linear):**
```
                 North +z
  ┌────────┬──────────┬──────────────┬──────────┐
  │ Ent    │  Living  │  Dining-     │ Bedroom  │
  │ 3×5    │  7×6     │  Kitchen    │ 5×6      │
  │ x:-12  │ x:-8~-1  │ 6×6         │ x:+4~+9  │ W
W │ ~-9    │          │ x:0~+6      │ z:+0~+6  │ e
e │ z:0~+5 │ z:0~+6   │ z:0~+6      │          │ s
s │        │          │             │          │ t
t ├────────┴──────────┴──────┬───────┴──────────┤
  │                         │ Laundry 5×5       │
  │                         │ x:+1~+6 z:-6~-1   │
  └─────────────────────────┴──────────────────┘
                  South -z
```

| 指标 | 数值 |
|---|---|
| 房间中心 | E:(-10.5,+2.5), L:(-4.5,+3), DK:(+3,+3), B:(+6.5,+3), Ly:(+3.5,-3.5) |
| L2 纯走路 | Entrance → Living → Bedroom → Living → Entrance ≈ (3+7+3.5) ×2 = 27m |
| Minimap 可读性 | ⭐⭐⭐ 3/5 一字型太长，两端小地图看不清 |
| 门洞冲突风险 | MEDIUM（Living 东西两条主门在同一条中轴线被家具挡概率高） |
| 家具容纳性 | HIGH（各房均方正）|
| 怀旧构图潜力 | ⭐⭐⭐⭐⭐ 5/5 长走廊 + 深透视感非常"家庭记忆" |
| 实施成本 | ⭐⭐⭐⭐ 4/5 需重新排布相邻性，门洞顺序 OK |

**致命缺点：L2 纯走路 27m 远超目标 ≤ 12m。** 玩家抱怨"走路模拟器"会直接炸锅。

---

### Candidate C · Split-Zone Apartment（分区式公寓）

**Topology graph:**
```
[Entrance] ─ [Living] ─ [Bedroom]
                │
          [Dining-Kitchen]
                │
           [Laundry]
```

**Top-down ASCII (living centered vertical stack):**
```
              North +z

  ┌───────────────────────────────────────────┐
  │ Entrance 3×5     │   Living 7×6            │
  │ x:-7~-4 z:+1~+6  │   x:-3.5~+3.5 z:-1~+5  │
  │                  │   （Living 门洞 3 条）  │
  ├──────────────────┤                         │ W
  │                  │   +z墙连 Entrance        │ e
W │                  │   -z墙连 D-K             │ s
e │ Bedroom 5×6      │   -x墙西北连 Bedroom     │ t
s │ x:-7~-2 z:-6~-1  │                         │
t │                  │                         │
  ├──────────────────┴─────────────┬───────────┤
  │ Dining-Kitchen 6×6 x:-3~+3    │ Laundry   │
  │ z:-8~-2                       │ 5×5       │
  │ +x墙东中连 Laundry             │ x:+4~+9   │
  │                                │ z:-8~-3   │
  └────────────────────────────────┴───────────┘

                 South -z
```

| 指标 | 数值 |
|---|---|
| Room centers | E:(-5.5, +3.5), L:(0, +2), B:(-4.5, -3.5), DK:(0, -5), Ly:(+6.5, -5.5) |
| L2 纯走路 | Entrance → Living → Bedroom → Living → Entrance ≈ (4+6+4)+(3+5+3) ≈ 25m |
| Minimap 可读性 | ⭐⭐⭐⭐ 4/5 类似 A 但 Bedroom 在 Living 西南角，不直观 |
| 门洞冲突风险 | MEDIUM（Living 3 条门，Bedroom 在 Living 西南斜角需要旋转门洞） |
| 家具容纳性 | HIGH（Living/Bedroom 尺寸均合理）|
| 怀旧构图潜力 | ⭐⭐⭐⭐ 4/5 分区感明显但不如图案 C 长透视 |
| 实施成本 | ⭐⭐⭐ 3/5 斜角门洞复杂 |

**缺点：Bedroom 与 Living 相邻但在西南斜角，Living 沙发摆放必须避开西北门和西南门两条线 + 南侧 D-K 门，仅剩东侧墙放 TV。灵活度偏低。**

---

### §4.1 Comparison Matrix — 三套方案对比

| 维度（满分） | A Compact Hub | B Linear | C Split-Zone |
|---|---|---|---|
| L2 走路距离（≤17m 目标） | **17m ✅** | 27m ❌ | 25m ❌ |
| L1 教学关独立区域清晰 | ✅ 5/5 | ⚠️ 3/5 线性长 | ⚠️ 4/5 OK |
| L3 Laundry 独立进入 | ✅ D-K→Laundry 独立 | ✅ 同样 | ✅ 同样 |
| Minimap 第一眼可读性 | **5/5** | 3/5 | 4/5 |
| 门洞互不打架风险 | **LOW 5/5** | MEDIUM 3/5 | MEDIUM 3/5 |
| Living 作为枢纽的中心感 | **5/5** | 4/5 | 4/5 |
| 家具摆放四面空墙 | **5/5**（Living 4 墙中 3 墙无门） | 2/5（Living 2 墙全是门） | 3/5（Living 3 墙门） |
| L2 猫事件绕过可能性 | **LOW（必须返回 Living）** | HIGH（可以从 Living 北走廊绕） | MEDIUM |
| 实施难度（低好） | **5/5（最小改动）** | 4/5 | 3/5 |
| 怀旧家庭构图纵深 | 4/5 | **5/5** | 4/5 |
| 总分 | **47 / 50** | 33 / 50 | 37 / 50 |

### §4.2 Final Recommendation

**CANDIDATE FOR HUMAN APPROVAL = Candidate A · Compact Hub Apartment**

**理由（前 3 条不可替代）：**
1. L2 Golden Path 纯走路 = 17m，完全卡进「纯走路时间 ≤ 30% × 10 分钟关卡 = ~18m 上限」的硬约束
2. Living 四向十字枢纽（西 Bedroom / 东 Entrance / 南 Dining-Kitchen / 北 Future 预留）是三关共享最稳定的拓扑
3. 门洞均位于四墙正中，与当前 `sharedRooms` 代码结构完全同构（仅需改 center 和 size，不用改 offset 逻辑）→ 实施风险最低
4. Minimap 十字形，第一人称新手玩家不用看地图都能靠"回 Living"直觉找回家

**Status = CANDIDATE FOR HUMAN APPROVAL（非 APPROVED，需人类批准后再写入 rooms.ts）。**

---

## §五 · RoomBlueprint Unified Type Concept Draft

*Planning-only types. NOT to be written into src/types/room.ts this phase.*

```typescript
/**
 * ROOM_BLUEPRINT_VERSION = '2026-08-03-CANDIDATE-A'
 *
 * Single-source-of-truth for a single room.
 * Minimap, collision walls, visual Room3D, and doorway renderers
 * all derive from this ONE object.
 */
interface RoomBlueprint {
  // —— Identity —— //
  id: RoomId                          // 'living' | 'bedroom' | 'entrance' | 'diningKitchen' | 'laundry'
  displayName: string                // '客厅' etc
  version: string                    // tie to blueprint doc version
  allowedTasks: TaskId[]             // ['leave-home', 'breakfast' ...]

  // —— World frame (single truth) —— //
  // center of the room in world coordinates (X,Z). Y = floor Y.
  center: { x: number; y: number; z: number }

  // Interior clear width × wall height × interior clear depth (不含墙厚)
  size:   { x: number; y: number; z: number }

  // —— Wall contract (see WALL_AND_DOORWAY spec) —— //
  wallThicknessLogical: number       // 0.12 default
  wallThicknessVisual: number        // 0.20 default (Kenney overlay)
  wallHeight: number                 // 2.6 or 3.0 default

  // —— Material + Lighting (visual owner) —— //
  floorMaterialId:    KenneyOrSolid // e.g. 'kenney-wood-oak' | 'solid-#d4a574'
  wallMaterialId:     KenneyOrSolid
  ceilingMaterialId:  KenneyOrSolid
  lightingProfileId:  LightingProfile // 'neutral-day' | 'nostalgic-evening' | 'night-l2'

  // —— Windows (see WindowBlueprint below) —— //
  windows: WindowBlueprint[]

  // —— Doorways — authority here — //
  // IMPORTANT: a doorway that connects Room A and Room B appears in BOTH
  // rooms' doorways list AND is backed by the SAME singleton DoorwayBlueprint
  // object identity (reference). QA enforces symmetric ownership.
  doorways: DoorwayBlueprint[]

  // —— Minimap style overrides —— //
  minimapStyle: {
    fillColor: string                // css color for room interior fill
    outlineColor: string             // css color for wall outline
    labelAnchor: 'center' | 'top' | 'bottom'
    labelOverride?: string           // optional short label
    hiddenInTasks?: TaskId[]         // hide minimap for certain tasks
  }

  // —— Future: occupancy budget for furniture envelopes —— //
  // (referenced by ROOM_ENVELOPE doc)
  envelopeBudgetId?: string          // pointer to separate envelope table
}

/**
 * WindowBlueprint.
 * A window replaces a section of wall. Does NOT block player traversal
 * (blocksTraversal=false) unless closed shutter variant.
 */
interface WindowBlueprint {
  id: string                          // 'win-living-south-1'
  roomId: RoomId
  wall: 'north' | 'south' | 'east' | 'west'  // which wall (cardinal)
  offset: number                      // offset along wall from wall's min endpoint (meters)
  width:  number                      // e.g. 1.5m
  sillHeight: number                 // bottom of window above floor (0.9m default)
  height: number                     // 1.2m default
  visualAssetId?: AssetId            // 'kenney/wall-window-square' or similar
  outsideProfileId?: 'courtyard' | 'skyline' | 'alley' | 'blind'
  blocksTraversal: false             // FIXED false for normal window
  minimapVisible: boolean            // true = draw a 2-pixel notch on outline
}

/**
 * DoorwayBlueprint — SINGLE SOURCE for a doorway that joins two rooms.
 *
 * CRITICAL RULE: The same DoorwayBlueprint instance must be referenced
 * from BOTH rooms' doorways arrays. The two rooms must NOT have
 * separately-written duplicate coordinate records. QA asymmetric adjacency
 * scan will flag any mismatch.
 */
interface DoorwayBlueprint {
  id: string                          // e.g. 'dw-living-bed'
  roomA: RoomId
  roomB: RoomId

  // —— Wall attachment (from each room's local frame) —— //
  wallA: 'north' | 'south' | 'east' | 'west'
  wallB: 'north' | 'south' | 'east' | 'west'  // MUST be opposite of wallA in shared wall
  offsetA: number   // meters from wallA's min endpoint to doorway center (along wall)
  offsetB: number   // meters from wallB's min endpoint to doorway center — MUST align after world transform

  // —— Geometry —— //
  width:  number                    // 1.4 default (净通行 1.2m + padding)
  height: number                    // 2.2 default
  traversalWidth: number            // ≤ width. Player collision clearance width.

  // —— Door leaf (visual + open-state geometry) —— //
  hingeSide: 'left' | 'right'       // when facing the door from roomA, hinge on which side
  openingDirection: 'roomA' | 'roomB' | 'both' | 'slide'
  doorVisualAssetId: AssetId        // 'kenney/door-rotate-square-a'
  swingOccupancyFootprint?: Box2    // when fully open, which floor area is covered by door leaf (so furniture doesn't collide with opening)

  // —— Minimap —— //
  minimapGapStyle: {
    gapPixels?: number              // thickness of gap drawn in minimap (default = wallThicknessVisual*scale)
    hideInTaskIds?: TaskId[]
    highlightColorWhenObjective?: string // e.g. L2 'go to bedroom' pulse blue
  }
}
```

---

## §4.3 Candidate A Room Blueprint Instance Drafts (坐标候选示例，NOT final)

*所有坐标仅为 CANDIDATE。正式实装需通过 G0 E2E 3 回合回归。*

```yaml
# Candidate A 五房 world center + size (内净)
rooms:
  living:
    center: { x: 0,    y: 0, z:  3 }  # (world x,z approx)
    size:   { x: 7.0,  y: 2.6, z: 6.0 }
    doorways_walls:
      west:   bedroom         # offset 3.0m (mid)
      east:   entrance        # offset 3.0m (mid)
      south:  dining-kitchen  # offset 3.5m (mid)
      north:  [future reserve for window]

  bedroom:
    center: { x: -6.5, y: 0, z: 3 }
    size:   { x: 5.0,  y: 2.6, z: 6.0 }
    doorways_walls:
      east: living   # the only door; west wall + south wall = window candidates

  entrance:
    center: { x: 6.0, y: 0, z: -2.5 }
    size:   { x: 3.0,  y: 2.6, z: 5.0 }
    doorways_walls:
      west: living
      east: [future: front door visual, non-traversable]

  dining-kitchen:
    center: { x: 0, y: 0, z: -4 }
    size:   { x: 6.0, y: 2.6, z: 6.0 }
    doorways_walls:
      north: living
      east:  laundry
      south: [window]
      west:  [window + kitchen counter]

  laundry:
    center: { x: 6.5, y: 0, z: -3.5 }
    size:   { x: 5.0, y: 2.6, z: 5.0 }
    doorways_walls:
      west: dining-kitchen
      south: [window]
```

---

## Status

- **CANDIDATE FOR HUMAN APPROVAL only** (Candidate A)
- Next human review check:
  1. 是否接受 Living 7×6 缩小（现 8×8）
  2. 是否接受 Laundry 放在 DK 东侧（L3 玩家需先经过 DK 才能到 Laundry，可接受？）
  3. 是否接受 Entrance 3×5 紧凑型（伞架 + 鞋架 + coatRack 三者需要严格 envelope）
- 批准后，把 **Candidate A → APPROVED**，然后下一工作包 P2.0-R 把数值导入 rooms.ts + decorFurniture。

**END OF BLUEPRINT.**
