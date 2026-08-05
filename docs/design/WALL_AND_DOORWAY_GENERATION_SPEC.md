# Wall & Doorway Generation Specification

Document ID: WALL_AND_DOORWAY_GENERATION_SPEC
Date: 2026-08-03
Status: UNTRACKED · PLANNING ONLY
Related doc: HOUSE_TOPOLOGY_BLUEPRINT §五 (Room/Doorway/Window types)

---

## §六 · Three Wall Strategies Compared & Final Recommendation

比较三种墙体权威来源策略。**严禁 0.12m 碰撞墙 + 0.20m 未缩放视觉墙** 作为最终方案（视觉/碰撞/小地图三者错配）。

### 6.1 Strategy A: Programmatic Geometry + Kenney Material

| Owner       | Authority object |
|-------------|------------------|
| Visual      | 程序化 BoxGeometry (完全代码生成)，表面 apply Kenney variation-a.png 共享 atlas 纹理（从 Building Kit 512×512 复制） |
| Collision   | 同一程序化 Box（无分离） |
| Minimap     | 同一程序化 Box 的 XZ footprint |
| Doorway     | 同一程序化 Box 三段式（左墙+上墙+右墙） |
| QA          | 无额外 sync |

**Pros:**
- visual == collision == minimap footprint 三者 100% 同一来源，无 DTS 风险
- 与当前 `Room3D` 已有四面墙代码零差异 → 仅改 `MeshStandardMaterial.map` = variation-a PNG + texture repeat
- 墙厚可选 0.12 或 0.20，完全自由

**Cons:**
- 视觉：没有 Kenney 墙段的内嵌细节（例如壁龛、墙角板）；未来要加细节必须程序化贴图而非独立 GLB mesh

### 6.2 Strategy B: Programmatic Logical Wall + Thickness-Normalized Kenney Visual

| Owner       | Authority object |
|-------------|------------------|
| Visual (Kenney) | Kenney wall GLB，但被 **强制性 scaleX/scaleZ** 到与程序化墙完全相同的 length × height × thickness（误差 ≤ 1cm） |
| Collision   | 程序化 Box（同方案 A） 权威 |
| Minimap     | 程序化 Box（同方案 A） 权威 |
| Doorway     | 程序化 三段 + 视觉层上 Kenney door-rotate-square-a GLB 缩放到 doorway width 1.4m × height 2.2m（≤1cm 误差） |

**Pros:**
- 视觉上获得 Kenney Building Kit 的全套细节（window module 嵌入窗段等）
- 碰撞/小地图仍然完全稳定（权威仍是程序化 Box），DTS 风险被"强制缩放视觉到逻辑尺寸"消除

**Cons:**
- 需要一个统一的 `WallVisualNormalizer` 工具函数，把 Kenney wall-half / wall-straight 的原始 raw 2.0×2.4×0.2 缩放到任意（length, height, thickness）；需要一次 per-model 写入 normalize 参数表（wall-straight: {rawL=2.0, rawH=2.4, rawT=0.2}）
- 纹理缩放可能造成重复花纹的像素错位（可用 `wrapS = RepeatWrapping + repeat = targetL/rawL` 正确解决）

### 6.3 Strategy C: Unified 0.20m Wall Contract

- 全项目墙厚从 0.12m → 改 0.20m（Kenney Building Kit 的原生 rawT = 0.20m）
- visual / collision / minimap / doorway 四条链全部同时切换到 0.20m
- **实施成本最高**：`sharedRooms[*].size`（内净）需全部重算以保持同样内部可容纳家具；所有 5 个房的家具 envelope 需重新做 QA G1-G4

### 6.4 Comparison Matrix + Recommendation

| 维度 (10 满) | A Procedural + Kenney tex | B Logical + Visual-scaled | **C Unified 0.20m** |
|---|---|---|---|
| visual/collision/minimap 一致 | 10/10 | **10/10**（强制缩放保证） | 10/10 |
| Kenney 视觉细节（含窗墙段） | 6/10（贴图有，无窗段几何） | **10/10**（完整模型） | 10/10 |
| DTS 双重真值源风险 | 0/10（无） | **1/10（仅视觉参数表维护）** | 0/10 |
| 实施复杂度（低好） | 10/10 | **7/10** | 2/10 |
| 对内净尺寸家具 envelope 的影响 | 10/10（不变） | 10/10（不变） | 2/10（全部重算） |
| 未来换模组灵活性（可接受） | 5/10 | **9/10**（替换视觉 GLB 即可） | 5/10 |
| **总分 60** | **51** | **56** ⭐ | 39 |

### §6.5 Final Recommendation = **Strategy B (Programmatic Logical Wall + Thickness-Normalized Kenney Visual)**

| Owner (Who owns truth) | Object source |
|---|---|
| **Collision owner** | `RoomBlueprint` 的 `size (x,z)` + `wallThicknessLogical=0.12m` → 程序化四面 Box（同现有 collision.ts） |
| **Visual owner**    | `RoomBlueprint` 的同一 size + wallThicknessVisual=0.20m（Kenney raw） → 对 Kenney wall-straight GLB 做 `scale(targetLength/rawL, targetHeight/rawH, wallVisual/rawT)` 归一化后贴到逻辑墙外表面 |
| **Minimap owner**   | 碰撞 Box 的 XZ 投影（纯 2D 矩形） |
| **Doorway owner**   | **DoorwayBlueprint** 单例，同时驱动：(a) 逻辑墙的三段式缺口、(b) 视觉墙的三段式缺口、(c) minimap 缺口、(d) `Door3D` 门扇 GLB 挂载点 |
| **QA owner**        | 8 项 AdjacencyQA + 4 项 WallQA（见 §八 + 下） |

**此方案通过 project_memory 对 DTS（双重真值源）的禁令，因为 "visual 虽不同来源，但参数化缩放后尺寸 ≡ 逻辑 + 误差 ≤1cm"，且 minimap 直接来源于碰撞。**

---

## §七 · Doorway Generation Method (NO REAL-TIME BOOLEAN)

### 7.1 Three-Segment Wall Composition

**绝对禁止用 CSG / ThreeBSP 实时布尔。** 相反，每面带门洞的墙由以下 **3 段独立墙段** 构成：

```
（带门洞的南墙，顶视图，自北往南看）
                 North +z

WallWest     Doorway Lintel   WallEast
 (左段)       (door 上方过梁)    (右段)
┌────────┐   ┌──────────┐   ┌────────┐
│        │   │          │   │        │
│  0.12  │   │  height  │   │  0.12  │ ← wall thickness logical
│        │   │   0.4m   │   │        │
└────────┘   │          │   └────────┘
             └──────────┘
              ← width=1.4m →
              (door 本体)
              hinge left or right
```

For every wall that has ≥1 doorway, 3 segments are generated:

```
segments = [
  // left (west) strip of the wall, from wall's -X endpoint to doorway's left edge
  { posX: ..., sizeX: doorwayCenterX - doorwayHalfWidth - wallStartX, sizeZ: thickness, sizeY: wallHeight },
  // lintel / top strip of the wall, above doorway's height
  { posX: doorwayCenterX, sizeX: doorwayWidth, sizeZ: thickness, posY: doorwayHeight/2, sizeY: wallHeight - doorwayHeight },
  // right (east) strip of the wall, from doorway's right edge to wall's +X endpoint
  { posX: ..., sizeX: wallEndX - (doorwayCenterX + doorwayHalfWidth), ... }
]
```

### 7.2 Complete Doorway Definition (from DoorwayBlueprint)

从单一 DoorwayBlueprint 实例派生出以下 12 项几何与语义值：

| # | 派生量 | 公式（以 wallA = 'south', living 为例） |
|---|---|---|
| 1 | 房间 A 墙面方向向量 | `wall_dir_A = (1,0,0)` if east/west → X axis line; `(0,0,1)` if north/south → Z axis line |
| 2 | world doorway center (A side) | `centerA = roomA.center + ( along_wall_dir_A * offsetA ) + ( normal_out_A * (sizeA/2) )` |
| 3 | world doorway center (B side) | 必须 Q4 验证：`||centerA - centerB|| ≤ 2cm` |
| 4 | 墙面法向量 A vs B | `dot(normalA, normalB) === -1`（两墙面法向量相反） |
| 5 | 通行净矩形 XZ | `Rect2(centerA.x - traversalWidth/2, centerA.z - PLAYER_RADIUS, traversalWidth, 2*PLAYER_RADIUS)` |
| 6 | 门扇 pivot world position | `hingeSide == 'left' → centerA + wallPerpLeft(dw.width/2 - thickness/2)` |
| 7 | 门扇 opening rotation angle | `0 (closed) → ±π/2 (open)`; openingDirection='roomA' → 向 A 内开；'roomB' → 向 B 内开 |
| 8 | door-open 占用 footprint | 门扇半径 r = doorwayWidth；矩形或 1/4 圆。家具 QA 检查：任何 DF/TC footprint 不得与 door-open 占用 2D 相交 ≥ 5cm |
| 9 | 玩家净通行区域 | 8 × 2 × PLAYER_RADIUS；L2 关键 check: 玩家带 heldObject 宽 (max 0.4) 也能过 |
| 10 | 碰撞墙段缺口 | 如 7.1，三段式，left/right/top 3 Box |
| 11 | 视觉墙段缺口 | 同 10 的三段式，但 Kenney GLB 被 scale 后贴合缺口边缘（误差 ≤ 1cm） |
| 12 | minimap 缺口 | Minimap renderer 在墙中线画一段与 doorway 同宽的白色/透明 gap |

### 7.3 Forbidden Patterns

| Pattern | 禁止原因 |
|---|---|
| Room A 手写 door coord 一份 + Room B 又手写一份 | 违反 §八 Q1/Q2 单向邻接 + 蓝图必须同一引用 |
| 实时 boolean / CSG | 性能 + 几何退化风险；WebGL / R3F 无官方 robust CSG |
| 门扇与 door-open 占用 2D 重叠茶几 / 床 / 走廊 | 开门被卡 → 玩家以为 bug；见 §八 G4 QA |
| 门洞 width < 1.2m（考虑两侧门框视觉 + collision） | 通行性差，胖 radius 玩家被反复弹 |

---

## §八 · (Combined with §4 from Adjacency doc) 8+4 QA

**（与 ROOM_ADJACENCY_GRAPH §4.1 合并引用）**

§4 = 8 条 Room Connection QA。

本规范新增 **4 条 Wall-Specific QA（未来 vitest 头文件）**：

```typescript
interface WallSpecificQA {
  // W1: Logical wall thickness != 0.12m (±1mm)
  logicalWallThicknessDeviation: (room: RoomBlueprint) => QAFindingSeverity

  // W2: Visual wall thickness != 0.20m (±1cm) — Kenney raw.
  // 如果视觉 0.20 被缩放到其他值，必须在 visual-normalizer 参数表显式登记
  visualWallThicknessWithoutRegister: (room: RoomBlueprint, visualWall: ThreeMesh) => QAFindingSeverity

  // W3: A single wall has >1 doorway AND two doorways' clearance rects overlap in XZ
  doorwayClearanceOverlapOnSameWall: (room: RoomBlueprint, wall: CardinalWall) => QAFindingSeverity

  // W4: Visual (Kenney scaled) footprint vs logical box footprint
  //     axis-aligned diff in any corner > 1cm → BLOCKER
  visualLogicalMismatch: (room: RoomBlueprint, wallMesh: ThreeMesh, wallBox: Box3) => QAFindingSeverity
}
```

---

End of Wall & Doorway Spec.
