# World / Room-Local / Minimap Coordinate Contract

Document ID: WORLD_ROOM_MINIMAP_COORDINATE_CONTRACT
Date: 2026-08-03
Baseline: Candidate A (Compact Hub) — CANDIDATE FOR HUMAN APPROVAL
Status: UNTRACKED · PLANNING ONLY · NOT FOR PRODUCTION YET

---

## 0. Scope

定义三种坐标系的**权威来源**、**转换方向**、**Y 轴正负约定**、及**家具/容器/门的统一使用方式**。

- `worldPosition`：Three.js 场景全局坐标，单例。
- `roomLocalPosition`：单个 RoomBlueprint 内的局部坐标，原点 = 房间中心 (center.x, floorY, center.z)。
- `minimapPosition`：小地图 2D 画布坐标（或 CSS %），从 RoomBlueprint + 家具 eligibles 自动派生。

**约束：**
- 家具、任务物体、容器、装饰家具在 `decorFurniture.ts` / `tasks/*.ts` 中**一律先写 room-local**，不写 world。
- Room center 只在**转换层**（`src/game/coordinateTransforms.ts`，下一阶段创建）使用。
- Minimap **不手写 CSS 坐标**，全部由 RoomBlueprint → minimapPosition 转换。

---

## §9.1 Three Coordinate Systems Defined

### 9.1.1 worldPosition (World Frame)
```
Three.js 标准右手坐标系：
  +X = East (右)
  +Y = Up (上，天空)
  +Z = North (向前，玩家初始朝向)

Origin = 任意（当前 Living 中心 ≈ (0,0,0)）。
全房唯一。
```

### 9.1.2 roomLocalPosition (Room-Local Frame)
```
对每个房间独立：
  origin = (RoomBlueprint.center.x, RoomBlueprint.center.y, RoomBlueprint.center.z)
  +X_local = 沿房间 width 方向 (房间右)
  +Z_local = 沿房间 depth 方向 (房间前/北)
  +Y_local = 上 (同 world Y)

例：Living 中心在 world (0, 0, 3)，房间内东南墙角 (3.5, 0, -3) in local
  = (0 + 3.5, 0 + 0, 3 + (-3)) = (3.5, 0, 0) in world。
```

### 9.1.3 minimapPosition (Minimap 2D Frame)
```
Minimap SVG / Canvas 坐标 (CSS pixels 或百分比)：
  原点 = 画布左上角
  +X_mm = 向右 (同 world +X，需要 scale)
  +Y_mm = 向下 (注意！与 world Z 反向)

关键映射：
  minimap X = f(world X)
  minimap Y = f(-world Z)   ← 因为 Canvas/SVG Y 向下

统一使用世界 bounding box 做归一化（见 §9.3），minimap 永远显示整屋。
```

---

## §9.2 Five Transforms (Pure Functions)

*下一阶段在 `src/game/coordinateTransforms.ts` 中实现为纯函数，无副作用。*

```typescript
// T1: room-local → world
export function roomLocalToWorld(
  roomId: RoomId,
  local: { x: number; y: number; z: number },
  blueprints: Record<RoomId, RoomBlueprint>
): { x: number; y: number; z: number } {
  const bp = blueprints[roomId]
  return {
    x: bp.center.x + local.x,
    y: bp.center.y + local.y,
    z: bp.center.z + local.z,
  }
}

// T2: world → room-local (需要确定 roomId，可用 BSP 或点在矩形内测试)
export function worldToRoomLocal(
  world: { x: number; z: number },
  blueprints: Record<RoomId, RoomBlueprint>
): { roomId: RoomId; local: { x: number; y: number; z: number } } | null {
  for (const [id, bp] of Object.entries(blueprints)) {
    const hx = bp.size.x / 2, hz = bp.size.z / 2
    const dx = world.x - bp.center.x
    const dz = world.z - bp.center.z
    if (Math.abs(dx) <= hx && Math.abs(dz) <= hz) {
      return { roomId: id as RoomId, local: { x: dx, y: 0, z: dz } }
    }
  }
  return null
}

// T3: world → minimap (归一化到 [0,1]，再乘 canvasPx)
export function worldToMinimap(
  world: { x: number; z: number },
  worldBounds: { minX: number; maxX: number; minZ: number; maxZ: number },
  canvasSize: { px: number; py: number }
): { xPx: number; yPx: number } {
  const nx = (world.x - worldBounds.minX) / (worldBounds.maxX - worldBounds.minX)
  // ↓ 关键：world Z 越大（越北）→ minimap Y 越小（越靠画布上）
  const nz = 1 - (world.z - worldBounds.minZ) / (worldBounds.maxZ - worldBounds.minZ)
  return {
    xPx: nx * canvasSize.px,
    yPx: nz * canvasSize.py,
  }
}

// T4: room-local → minimap (T1 then T3)
export function roomLocalToMinimap(roomId, local, blueprints, wb, cs) {
  return worldToMinimap(roomLocalToWorld(roomId, local, blueprints), wb, cs)
}

// T5: minimap → world approx (用于 minimap 点击跳点；future)
export function minimapToWorldApprox(mm, wb, cs) {
  const nx = mm.xPx / cs.px
  const nz = 1 - (mm.yPx / cs.py) // 反向：mm Y 越大 → world Z 越小
  return {
    x: wb.minX + nx * (wb.maxX - wb.minX),
    z: wb.minZ + nz * (wb.maxZ - wb.minZ),
  }
}
```

---

## §9.3 Candidate A World Bounds (参考值)

```
Candidate A 五房 world 范围 (含墙厚的外边界)：

  X 轴 min/max:  Bedroom 西墙 (-6.5 - 2.5 - 0.12) = -9.12
                 ↔ Laundry 东墙 (+6.5 + 2.5 + 0.12) = +9.12
                 → total X span ≈ 18.24 m

  Z 轴 min/max:  Laundry/DK 南墙 (-4 - 3.0 - 0.12) = -7.12
                 ↔ Bedroom/Living 北墙 (+3 + 3.0 + 0.12) = +6.12
                 → total Z span ≈ 13.24 m

worldBounds (Cand-A approx):
  minX = -10.0, maxX = +10.0      (留 0.88m 缓冲)
  minZ =  -8.0, maxZ =  +7.0      (留 0.88m 缓冲)
```

---

## §9.4 Three Numeric Examples (Candidate A 坐标示例，CANDIDATE only)

**所有坐标仅为候选示例，不写进源码。**

### Example 1: Living Coffee Table (L2 核心视觉点)

```
Furniture: tableCoffee (raw W×D = 1.322m × 0.800m after ×2.0)
Placement intent: 客厅正中心略偏南，距南墙（D-K 门）北侧 1.5m，茶几中心正对 Sofa 中心。

room-local (Living id='living', center world (0,0,3)):
  x_local = +0.5m (房间中心略偏东，避开西 Bedroom 门和东 Entrance 门中轴线)
  y_local =  0.0m (floor level)
  z_local = -0.5m (房间中心略偏南，因为 Living 南半侧是主通行，北半侧是沙发+电视)
  → rotationY = 0 (茶几长边沿 X 轴，正对南北沙发)

world (T1, Living center = {x:0, y:0, z:3}):
  x_world = 0 + 0.5      = +0.50 m
  y_world = 0 + 0.0      =  0.00 m
  z_world = 3 + (-0.5)   = +2.50 m

minimap (T3, wb={-10,+10,-8,+7}, canvas 600×450):
  nx = (0.50 - (-10)) / (10 - (-10)) = 10.5 / 20 = 0.525
  nz = 1 - (2.50 - (-8)) / (7 - (-8)) = 1 - 10.5/15 = 1 - 0.70 = 0.30
  → xPx = 0.525 × 600 = 315 px
  → yPx = 0.30  × 450 = 135 px
  (minimap 中位于右上象限中心偏东一点 = 客厅中心偏东南 = 正确)
```

### Example 2: Bedroom Nightstand (L2 手机出生容器)

```
Furniture: cabinetNightstand (PROVISIONAL, 从 furniture-kit 取小型床头柜，预估 raw 0.4×0.35×0.5m ×2.0 → 0.8×0.7×1.0m)
Placement intent: Bed 南侧（开门侧）的右床头柜，玩家从 Bedroom 门进入后第一眼可及。

room-local (Bedroom id='bedroom', center world (-6.5,0,3)):
  x_local = +2.0m  (Bed 头朝东，床头板靠东墙内侧 0.5m → nightstand 在床南侧=右)
  y_local =  0.0m
  z_local = -1.8m  (房间南半侧，距南墙 1.2m，Bed 的南侧)
  → rotationY = 0 (长边沿 X)

world:
  x_world = -6.5 + 2.0 = -4.50 m
  y_world =  0
  z_world =   3 + (-1.8) = +1.20 m

minimap (canvas 600×450):
  nx = (-4.50 + 10) / 20 = 5.5/20 = 0.275
  nz = 1 - (1.20 + 8)/15 = 1 - 9.2/15 = 0.387
  → xPx = 165 px, yPx = 174 px
  (minimap 左上角区域 = Bedroom 西南 = 正确)
```

### Example 3: Entrance Tray (L2 最终放置容器)

```
Container: cnt-entrance-tray (视觉为 shoe cabinet / umbrella stand 顶部托盘；预估 0.8×0.3×0.9m)
Placement intent: Entrance 东墙鞋柜上，距入户门左手边，手机放下后正对 Entrance→Living 门。

room-local (Entrance id='entrance', center world (6.0, 0, -2.5)):
  x_local = +1.2m  (Entrance 房间东半侧，鞋柜靠东墙放)
  y_local =  0.0m
  z_local = +1.0m  (房间北半侧，正对 Living←→Entrance 门通道北)
  → rotationY = 0 (鞋柜长边沿 Z 轴排列 → 不对；如沿 X 则 rotationY=π/2。此处暂 0。)

world:
  x_world = 6.0 + 1.2  = +7.20 m
  y_world = 0
  z_world = -2.5 + 1.0 = -1.50 m

minimap (canvas 600×450):
  nx = (7.20 + 10) / 20 = 17.2/20 = 0.86
  nz = 1 - (-1.50 + 8)/15 = 1 - 6.5/15 = 0.567
  → xPx = 516 px, yPx = 255 px
  (minimap 右中部 = Entrance 房间内部东侧 = 正确)
```

---

## §9.5 Rotated Footprint → Minimap Mapping

`src/game/sceneSchema.ts` 中已有 `getRotatedFootprint(size, rotationY)`：

```typescript
// Minimap 中显示的家具矩形 = 旋转后 footprint 矩形（AABB），然后按 world→mm 变换。
// 例如 Sofa 初始旋转 90° (长边沿 Z) 后：
//   raw size (X × Z) = (1.96, 0.82) ×2.0 already
//   rotationY = π/2 → 旋转后 AABB = (0.82, 1.96) 交换
//   在 minimap 上画为宽 0.82m * scale × 高 1.96m * scale 的矩形
```

**规则：** 不画精确 OBB 旋转矩形（小地图上看不清），画旋转后的 XZ AABB。误差最多 40%，但 minimap 用于导航而非精确摆放。

---

End of Coordinate Contract.
