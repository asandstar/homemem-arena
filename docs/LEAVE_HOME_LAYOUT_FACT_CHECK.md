# LEAVE_HOME 布局事实核查报告

任务：task-leave-home（出门大作战）
范围：living / bedroom / entrance
日期：2026-07-30
审计阶段：第一阶段 · 纯事实审计（无源码修改）

本文档所有结论均来自实际源码行号引用，不根据注释推断，不做主观假设。

## A. 真实运行时碰撞链

从键盘输入到玩家 position 更新的完整链路，含实际文件、函数和行号。

### A.1 输入组件

文件：`src/components/arena3d/FirstPersonControls.tsx`

| 环节 | 函数/代码位置 | 说明 |
|---|---|---|
| 键盘 down | L93 `handleKeyDown`；L200 `window.addEventListener('keydown', handleKeyDown)` | WASD / 方向键 → `moveState.current` 对应 flag 设 true |
| 键盘 up | L180 `handleKeyUp`；L201 `window.addEventListener('keyup', handleKeyUp)` | 按键释放 → 对应 flag 设 false |
| 鼠标拖动 | L279 `handleMouseMove` L283-L284 | `targetYawRef -= movementX × MOUSE_SENSITIVITY`；`targetPitchRef = clampPitch(targetPitch - movementY × SENSITIVITY)` |
| 触摸滑动 | L321 `handleTouchMove` L331-L332 | 同样更新 targetYaw / targetPitch（sensitivity × 1.5） |
| 虚拟摇杆 | `VirtualJoystick.tsx` 存在 | 注意：FirstPersonControls 内部 useFrame 仅消费 `moveState.current` 的 4 个 flag；Joystick 写入 moveState 的对接点需在 VirtualJoystick 中确认（不在本链路内） |

### A.2 移动向量计算（useFrame 内）

文件：`src/components/arena3d/FirstPersonControls.tsx`，L368 `useFrame((_, delta) => { ... })`

| 行号 | 说明 |
|---|---|
| L430-L495 | 根据 viewMode 分支计算 moveDx / moveDz。first-person 模式下用 cameraForward × forward + cameraRight × right 得到目标方向，做 lerp 平滑（L488-L489），再乘 currentSpeedRef × delta 得到 dx/dz（L491-L494） |
| L433-L456 | top-down 模式直接按相机朝向计算一次距离，无平滑 |

速度 / 半径常量：
- `PLAYER_SPEED = 3.0` / `TOP_DOWN_SPEED = 4.5`：`src/game/playerControls.ts` L8-L9
- `PLAYER_RADIUS = 0.3`：`src/game/playerControls.ts` L10
- `MOUSE_SENSITIVITY = 0.0015`：`src/game/playerControls.ts` L14

### A.3 墙碰撞（第一次）

文件：
- 调用：`src/components/arena3d/FirstPersonControls.tsx` L519-L526
- 实现：`src/game/collision.ts` L108-L150 `resolveRoomCollision`

调用参数：
```
currentPos2D  = { robotPosition.x, robotPosition.z }           (world)
desiredPos2D  = { robotPosition.x + moveDx, robotPosition.z + moveDz }  (world)
roomCenter    = { x: roomSpec.center.x, z: roomSpec.center.z }  (world)
roomSize      = { x: roomSpec.size.x, z: roomSpec.size.z }
effectiveDoorways = roomSpec.doorways 仅保留 task.rooms 内的 connectsTo
  结构（FirstPersonControls L510-L516）:
    { offsetX, offsetZ, width, connectsTo, targetPosition }
```

执行逻辑（`resolveRoomCollision`）：
1. L116：先判断 desiredPos 是否合法（在房间内 OR 在任一门洞内）。合法直接返回。
   - `isInsideRoomBounds`（L39-L54）：`localX = pos.x - bounds.centerX`，做房间半径边界判断
   - `isInsideDoorway`（L56-L88）：L66 `dx = doorway.offsetX`，L67 `dz = doorway.offsetZ`，与 `localX / localZ` 比较（见 B.2 doorway.offset 约定）
2. L120：尝试 slideX（只走 X 轴分量）。
3. L125：尝试 slideZ（只走 Z 轴分量）。
4. L130-L149：都不合法则转为 room-local 坐标 clamp：
   - `localX = desired.x - bounds.centerX`
   - `clampedX = Math.max(-halfX + radius, Math.min(halfX - radius, localX))` （Z 同理）
   - 若不在门洞内才 clamp（L141 `if (!inAnyDoorway)`）
   - 返回 world 坐标：`centerX + clampedX`（L146-L148）

### A.4 家具碰撞

#### A.4.1 家具合并点（用户约束 1 验证点）

文件：`src/components/arena3d/FirstPersonControls.tsx` L528-L530

```ts
const decorFurniture = roomDecorFurniture[currentRoom] || []   // L528
const taskContainers = task?.containers.filter((c) => c.room === currentRoom) || []  // L529
const allFurniture = [...taskContainers, ...decorFurniture]   // L530
```

结论：
- task.containers（TC） 与 roomDecorFurniture（DF）**在同一数组中合并**，顺序 TC 先、DF 后。
- L532 `if (allFurniture.length > 0 && roomSpec)` 才进入 `resolveFurnitureCollision`——**两者同时进入碰撞链**。
- **用户约束 1 得到源码证明：原计划"decorFurniture 未进入运行时碰撞"不成立。**

#### A.4.2 家具碰撞实现

文件：
- 调用：`src/components/arena3d/FirstPersonControls.tsx` L532-L539
- 实现：`src/game/collision.ts` L253-L295 `resolveFurnitureCollision`

调用参数：
```
currentPos  = { robotPosition.x, robotPosition.z }  (world)
desiredPos  = 上面第一次 resolveRoomCollision 返回的 resolved2D  (world)
furnitureList  = allFurniture = [...taskContainers, ...decorFurniture]
roomCenter  = { x: roomSpec.center.x, z: roomSpec.center.z }
radius      = PLAYER_RADIUS = 0.3
```

关键坐标转换（用户约束 2 验证点）—— L263-L264：
```ts
const fwX = roomCenter.x + furniture.position.x   // L263
const fwZ = roomCenter.z + furniture.position.z   // L264
```

这意味着 **`furniture.position`（无论是 ContainerSpec 还是 DecorFurnitureSpec 的 position）约定必须为 ROOM-LOCAL**，运行时才加 roomCenter 得到世界位置。该项结论直接推翻"decorFurniture.position 是 world"的假设。

碰撞算法（`circleRectCollision` L218-L251）：
- 纯 XZ 平面 circle-vs-AABB；完全不使用 `size.y`。
- 对每个家具用的参数是 `furniture.size.x` × `furniture.size.z`（L272-L273）。
- **用户约束 3 得到源码证明：任何 Y 高度（浅托盘、桌面、悬挂画）只要 position.xz + size.xz 与 player 圆 (radius=0.3) 相交，就会发生碰撞。不得认为托盘或桌面很矮就不会阻挡玩家。**

碰撞解算（L276-L291）：
- 发生碰撞后先尝试 testX（沿 X 滑）、再 testZ（沿 Z 滑）、否则直接沿法线推（L288-L289）。
- 结果累积赋值回 `result`，下一家具用更新后的 result 继续检测（L262 `for...of` 按数组顺序逐项）。

### A.5 墙碰撞（第二次修正）

文件：`src/components/arena3d/FirstPersonControls.tsx` L541-L548

家具碰撞推出后，可能把玩家推到墙外或洞外，再做一次 `resolveRoomCollision` 做最终 clamp（与 A.3 同函数，同参数）。

### A.6 最终 resolved position 写入 Store

文件：`src/components/arena3d/FirstPersonControls.tsx` L551-L563

```ts
const resolved = { x: resolved2D.x, y: robotPosition.y, z: resolved2D.z }   // L551-L554
// ...
const dx = resolved.x - lastPosRef.current.x   // L557
const dz = resolved.z - lastPosRef.current.z   // L558
if (dx * dx + dz * dz > 0.000001) {             // L560
  useGameStore.setState({ robotPosition: resolved })   // L561
  lastPosRef.current = { x: resolved.x, z: resolved.z }
}
```

注意：`robotPosition.y` 全程保持原值（=0，由 spawnPosition 写入），没有跳跃/楼梯。

### A.7 房间过渡（位置重置）

文件：
- 调用：`src/components/arena3d/FirstPersonControls.tsx` L566-L590
- 实现：`src/game/collision.ts` L152-L216 `checkRoomTransition`

当玩家圆（PLAYER_RADIUS=0.3）的远边界越过门洞 0.5×radius 阈值（L185 L194），并且冷却已过（L160）：
```ts
targetPos.x = targetRoom.center.x + door.targetPosition.x   // collision.ts L208
targetPos.z = targetRoom.center.z + door.targetPosition.z   // collision.ts L209
```
然后通过 `executeRoomTransition` 更新 `robotPosition` 与 `currentRoom`（L583）。

### A.8 碰撞链数据流总览

```
moveState (键盘/鼠标/触摸 → WASD flag)
   ↓ useFrame (FirstPersonControls.tsx L368)
moveDx, moveDz (world delta, L491-L494)
   ↓
desiredPos2D = robotPosition + (moveDx, moveDz)  (world, L500-L503)
   ↓ resolveRoomCollision (1st, L519-L526)
resolved_room1 = 墙/门洞合法点  (world)
   ↓ resolveFurnitureCollision (L532-L539)
   ├─ taskContainers = task.containers.filter(room==current)
   │    (ContainerSpec.position 约定 ROOM-LOCAL，见 A.4.2 L263)
   ├─ decorFurniture = roomDecorFurniture[currentRoom]
   │    (DecorFurnitureSpec.position 约定 ROOM-LOCAL，见 A.4.2 L263)
   ├─ 合并 allFurniture = [...TC, ...DF]
   └─ 每件家具: fwWorld = roomCenter + furniture.position (L263-L264);
              圆矩碰撞 (L266-L274) → 解算 push → 累积 result
resolved_furn = 家具推出后 (world)
   ↓ resolveRoomCollision (2nd, L541-L548)
resolved_final = 最终合法点 (world)
   ↓ L551-L563
useGameStore.setState({ robotPosition: resolved_final })  (L561)
```

## B. 坐标约定

每项结论均引用实际调用代码，不根据注释推断。

### B.1 `room.center`

定义：`src/data/rooms.ts`
- living L7：`center: { x: 0,  y: 0, z: 0 }`
- bedroom L39：`center: { x: -8, y: 0, z: 0 }`
- entrance L82：`center: { x: 0,  y: 0, z: 8 }`

约定：**WORLD**（绝对坐标原点）。

使用点（5 处源码证明）：
1. `resolveRoomCollision` 调用方直接作为世界中心传：FirstPersonControls.tsx L522 `{ x: roomSpec.center.x, z: roomSpec.center.z }`
2. `resolveFurnitureCollision` L263-L264（collision.ts）：`fwX = roomCenter.x + furniture.position.x`
3. `Room3D` 地板 mesh 位置（Room3D.tsx L1044 附近的墙段构建）：所有 group 用 `position={[center.x, 0, center.z]}` 作为 Three.js world position。视觉函数中：
   - renderLiving L174 主沙发：`position={[center.x, 0, center.z - 1.2]}`
   - renderBedroom L522 大床：`position={[center.x, 0, center.z - 0.8]}`
   - renderEntrance L50 地毯：`position={[center.x, 0, center.z + size.z/2 - 0.8]}`
   —— center.x / center.z 直接参与 Three.js world position 计算。
4. `Container3D` L103-L106：worldPos = [roomSpec.center.x + spec.position.x, spec.position.y, roomSpec.center.z + spec.position.z]
5. `Scene3D` 点光源 L48：`room.center.x + config.positionOffset[0]`

### B.2 `doorway.offset`

定义：`src/data/rooms.ts` L14 / L21 / L28 / L46 / L89 等
- living→bedroom：`offset: { x: -4, y: 0, z: 0 }`，`targetPosition: { x: 3.25, y: 0, z: 0 }`
- living→entrance：`offset: { x: 0, y: 0, z: 4 }`，`targetPosition: { x: 0, y: 0, z: -2.5 }`
- bedroom→living：`offset: { x: 4, y: 0, z: 0 }`，`targetPosition: { x: -3.25, y: 0, z: 0 }`
- entrance→living：`offset: { x: 0, y: 0, z: -3 }`，`targetPosition: { x: 0, y: 0, z: 3.5 }`

约定：**ROOM-LOCAL**（相对房间中心）。

运行时转换位置（4 处源码证明）：

1. `isInsideDoorway`（collision.ts L66-L67）：
   ```ts
   const dx = doorway.offsetX   // 直接拿 offsetX，不加减
   const dz = doorway.offsetZ
   ```
   然后与 `localX = pos.x - bounds.centerX`、`localZ = pos.z - bounds.centerZ`（room-local 的玩家）比较范围。→ offsetX 本身就是 room-local。

2. `checkRoomTransition` L175-L176（collision.ts）：
   ```ts
   const dx = door.offset.x
   const dz = door.offset.z
   ```
   同样与 `localX = pos.x - bounds.centerX` 比较。

3. `getNearbyDoorwayHint` L310-L311（collision.ts）：
   ```ts
   doorWorldX = room.center.x + door.offset.x
   doorWorldZ = room.center.z + door.offset.z
   ```
   → 明确 room-local → world 转换。

4. Room3D 墙段 + Door3D（Room3D.tsx L939-L1096）：门洞沿墙分段用 `door.offset` 的局部分段；Door3D 接 `roomCenter` 再做 world 定位。

targetPosition 也是 ROOM-LOCAL（相对目标房间 center）：
- `checkRoomTransition` L208-L209：`targetRoom.center.x + door.targetPosition.x`

### B.3 `decorFurniture.position`

定义：`src/data/decorFurniture.ts`（DecorFurnitureSpec L3-L7：position: Vec3, size: Vec3）

运行时转换：`collision.ts` L263-L264
```ts
const fwX = roomCenter.x + furniture.position.x
const fwZ = roomCenter.z + furniture.position.z
```

约定：**设计上必须 ROOM-LOCAL**（由 A.4.2 的使用方式决定）。

实际数据一致性核查（world = roomCenter + position，是否落在 room.size/2 内）：

**living**（center=(0,0,0)，size 8×8 → 范围 x∈[-4,4]、z∈[-4,4]）：

| id | position (x,z) | world (x,z) | 在房间内? |
|---|---|---|---|
| decor-sofa-main | (0,-3.0) | (0,-3.0) | ✓ x=0∈[-4,4], z=-3.0∈[-4,4] |
| decor-sofa-side | (-1.5,0) | (-1.5,0) | ✓ |
| decor-tv-stand | (2.8,-3.0) | (2.8,-3.0) | ✓ |
| decor-tv | (2.8,-3.0) | (2.8,-3.0) | ✓ |
| decor-bookshelf | (3.5,-2.5) | (3.5,-2.5) | ✓ x=3.5≤4-0.4=3.6, 边界 OK |
| decor-shelf | (-3.8,1.5) | (-3.8,1.5) | ✓ |
| decor-painting | (-3.7,1.5) | (-3.7,1.5) | ✓ |
| decor-clock | (3.7,0) | (3.7,0) | ✓ |
| decor-floor-lamp-1 | (3.2,2.0) | (3.2,2.0) | ✓ |
| decor-floor-lamp-2 | (3.5,1.5) | (3.5,1.5) | ✓ |
| decor-plant-1 | (-3.5,-3.5) | (-3.5,-3.5) | ✓ |
| decor-plant-2 | (3.6,2.0) | (3.6,2.0) | ✓ |
| decor-chair | (3.0,1.5) | (3.0,1.5) | ✓ |
| decor-side-table | (3.8,-2.0) | (3.8,-2.0) | ✓ |

结论：living DF 全部为 **ROOM-LOCAL**，一致 ✓。

**bedroom**（center=(-8,0,0)，size 8×8 → world x∈[-12,-4]、z∈[-4,4]）：

| id | position (x,z) | world(x,z)=(-8,0)+position | 在房间内? |
|---|---|---|---|
| decor-bed | (-8,-0.8) | (-16,-0.8) | ✗ x=-16 ∉ [-12,-4] |
| decor-nightstand-left | (-11.15,-1.5) | (-19.15,-1.5) | ✗ x=-19.15 |
| decor-desk | (-6.4,1.0) | (-14.4,1.0) | ✗ x=-14.4 < -12 |
| decor-wardrobe | (-11.15,0.6) | (-19.15,0.6) | ✗ |
| decor-dresser | (-9.5,1.5) | (-17.5,1.5) | ✗ |
| decor-bookshelf | (-4.6,1.0) | (-12.6,1.0) | ✗ x=-12.6 略超出 |
| decor-painting | (-8,3.7) | (-16,3.7) | ✗ |
| decor-clock | (-4.3,-1.5) | (-12.3,-1.5) | ✗ |
| decor-chair | (-5.5,1.0) | (-13.5,1.0) | ✗ |
| decor-plant | (-4.6,2.5) | (-12.6,2.5) | ✗ |

结论：bedroom DF 全部 10 条**碰撞落在房间外**，碰撞全部失效。position 数值的绝对值范围接近 world 坐标（x≈-8~-4 是 bedroom world.x），数据是 **写成了 WORLD 或错误方向的 room-local**（如 decor-bookshelf x=-4.6 应该是 room-local x=+3.4，却写了 -4.6 即西墙外）。

**entrance**（center=(0,0,8)，size 6×6 → x∈[-3,3]、z∈[5,11]）：

| id | position (x,z) | world(x,z)=(0,8)+position | 在房间内? |
|---|---|---|---|
| decor-shoe-cabinet | (-2.4,-0.5) | (-2.4,7.5) | ✓ |
| decor-shoes | (-2.4,0.3) | (-2.4,8.3) | ✓ |
| decor-hook | (2.7,0) | (2.7,8.0) | ✓ |
| decor-painting | (0,2.7) | (0,10.7) | ✓ |
| decor-clock | (2.7,1.0) | (2.7,9.0) | ✓ |
| decor-plant-1 | (-2.0,0.8) | (-2.0,8.8) | ✓ |
| decor-plant-2 | (2.0,-0.5) | (2.0,7.5) | ✓ |
| decor-shelf | (2.5,1.5) | (2.5,9.5) | ✓ |

结论：entrance DF 全部为 **ROOM-LOCAL**，一致 ✓。

### B.4 `ContainerSpec.position`（task.containers[*].position）

类型定义：`src/types/object.ts` L55-L85
使用：`src/data/tasks/leave-home.ts` L149-L197

leave-home 容器：
- cnt-coffee-table (living)：L153 `position { x: 0, y: 0.2, z: 0.3 }`
- cnt-nightstand (bedroom)：L164 `position { x: 0.5, y: 0.4, z: 0.8 }`
- cnt-umbrella-stand (entrance)：L177 `position { x: -2.5, y: 0.4, z: 1.0 }`
- cnt-entrance-tray (entrance)：L188 `position { x: -1.4, y: 0.5, z: 1.0 }`

运行时转换（2 处证明）：

1. 碰撞链：FirstPersonControls L529-L530 → `taskContainers` spread 进 allFurniture → 同 DF 走 `fwX = roomCenter.x + furniture.position.x`（collision.ts L263）
2. 视觉链：Container3D L103-L106
   ```ts
   const worldPos = [
     roomSpec.center.x + spec.position.x,
     spec.position.y,
     roomSpec.center.z + spec.position.z,
   ]
   ```
   → 明确 ROOM-LOCAL → world。

约定：**ROOM-LOCAL** ✓，数据一致 ✓。

### B.5 `ObjectSpec.initialPosition`

类型定义：`src/types/object.ts` L40-L41
使用：`src/data/tasks/leave-home.ts` L114-L145
- obj-key (living) L120：`{ x: 0, y: 0, z: 0.3 }`
- obj-phone (bedroom) L130：`{ x: 0.5, y: 0, z: 0.75 }`
- obj-umbrella (entrance) L141：`{ x: -2.5, y: 0, z: 1.0 }`

运行时转换：`src/game/placement.ts` L216-L249 `getFreeObjectInitialPosition`
```ts
const room = sharedRooms[objSpec.initialRoom]
const baseX = room.center.x + objSpec.initialPosition.x   // L221
const baseZ = room.center.z + objSpec.initialPosition.z   // L222
```
→ 明确 ROOM-LOCAL。

y 单独处理（L227-L249）：surfaceContainerId → 贴容器表面；否则贴地。此处 x/z 加 roomCenter，y 不经过 x/z 转换。

写出后的 `EntityState.position` 即为 **WORLD**（taskSlice L158-L166 `entities.push({ position: worldPos })`）。后续 `Object3D` 中 `snapEntityToWorld`（placement.ts L194-L205）直接用 `entity.position.x/z`，只修正 y。

约定：**ROOM-LOCAL** → 写 EntityState 后转 **WORLD**。

### B.6 `spawnPosition`

类型：`src/types/task.ts` L198（`spawnPosition?: { x: number; z: number }`）
使用：`src/data/tasks/leave-home.ts` L74：`spawnPosition: { x: 0, z: -1.5 }`，spawnRotation L75 `Math.PI`

运行时转换：`src/store/slices/taskSlice.ts` L183-L188
```ts
const firstRoom = task.rooms[0]                     // living
const firstRoomCenter = roomCenter(firstRoom)       // (0,0,0)
const startPos = task.spawnPosition
  ? { x: firstRoomCenter.x + task.spawnPosition.x, y: 0, z: firstRoomCenter.z + task.spawnPosition.z }
  : firstRoomCenter
```
→ spawnPosition 是 ROOM-LOCAL（相对 rooms[0].center），加 roomCenter → world robotPosition。

leave-home 实际出生点 world = (0, 0, -1.5)，living 内部安全点。

### B.7 坐标约定汇总表

| 字段 | 设计约定 | 运行时转换位置 | leave-home 数据一致性 |
|---|---|---|---|
| `room.center` | WORLD | 3D / 碰撞 / 视觉多处 | ✓ |
| `doorway.offset` | ROOM-LOCAL | collision.ts L66, L175, L310-L311; Room3D 墙段 | ✓ |
| `doorway.targetPosition` | 目标房间 ROOM-LOCAL | collision.ts L208-L209 | ✓ |
| `decorFurniture.position` | ROOM-LOCAL（因 collision.ts L263 加 roomCenter） | collision.ts L263-L264 | living/entrance ✓；bedroom 写为 WORLD/方向错误 → ✗ 全部碰撞失效 |
| `ContainerSpec.position` | ROOM-LOCAL | Container3D L103-L106; collision.ts L263-L264 | ✓ |
| `ObjectSpec.initialPosition` | ROOM-LOCAL | placement.ts L221-L222 | ✓ |
| `EntityState.position`（运行时） | WORLD | taskSlice L158; Object3D 内 snapEntityToWorld | ✓ |
| `spawnPosition` | ROOM-LOCAL（rooms[0].center 相对） | taskSlice L185-L186 | ✓ |
| `robotPosition` | WORLD | FirstPersonControls / Scene3D 等 | ✓ |

## C. 当前 Scene Graph 状态

### C.1 类型定义位置

`src/engine/sceneGraph.ts`
- EntityNode / ContainerNode / RoomNode：L19-L53
- SceneEdge / SceneEdgeType：L59-L70
- SceneGraph（根结构：nodes Map + edges 数组 + 分类 ids）：L76-L85

### C.2 构建位置

`src/engine/sceneGraph.ts` L94-L187 `buildSceneGraph(entities, containerStates, task)`

纯函数构造：
- ContainerNode.position world 转换 L141-L145
  ```ts
  x: roomSpec.center.x + container.position.x  // Container.position ROOM-LOCAL → world
  ```
- EntityNode.position 直接引用 entity.position（L167，已是 world，见 B.5）
- 边：adjacent / accessible-from / located-in / placed-in / contains

### C.3 更新位置

**无**。

`buildSceneGraph` 是纯函数，没有：
- useFrame 或 tick 驱动的增量更新
- 被 `tickElapsed / triggerScriptedEvents / evaluateStageTransitions` 调用
- 持久化的 SceneGraph 实例保存在 useGameStore 或 useSessionStore

### C.4 消费位置

Grep `sceneGraph` 整个 `src/` 目录，结果仅 2 个文件：
- `src/engine/sceneGraph.ts`（定义自身）
- `src/engine/sceneGraph.test.ts`（单元测试）

生产代码（components / store / game / pages）：**0 处 import、0 处调用**。

### C.5 是否影响记忆过期

否。记忆过期链路：
- 触发：`triggerScriptedEvents` 中 `ScriptedEventSpec.markMemoryOutdated` → `markMemoryOutdated(entityConfigId)`（memorySlice）
- 衰减：`decayMemories(deltaMs)` 由 flowSlice 的 updateFlowState 调用

以上链路不引用 `sceneGraph.ts`。

### C.6 是否进入 Session

否。Session 数据来自 `useSessionStore`（`saveSystem.ts` / `SessionDataPage.tsx`），保存字段：taskId、stepCount、entities 快照、memorySlots 等。Session schema 中无 SceneGraph dump 字段。

### C.7 是否进入 ResultPage

否。ResultPage（`src/pages/ResultPage.tsx` + `MetricCards` / `FailureBreakdown`）消费 `getGameStats()` 的纯计数统计 + probes。不经过 SceneGraph。

### C.8 是否为死代码

- 生产调用图：0 引用
- 唯一消费者：sceneGraph.test.ts（单测存在，可跑）
- build / query / path / counts API 齐全但未落地

结论：**功能性死代码（production unreachable）**，但有单元测试且接口完整，有未来激活对接点。

### C.9 semanticId / ownership 对接点保留

Scene Graph 已天然以 entity/container/room 为节点，承担 ownership / 语义归属：
- EntityNode.placedIn / EntityNode.room（L28-L29）= 所有权归属
- ContainerNode.contents / ContainerNode.room（L40-L41）= containership 归属
- `findNearestEntity / findNearestContainer`（L229-L277）返回的 node.id 可直接作为语义锚点

但目前未对接：
- 未接入 `evaluateStageTransitions` / flow / probing
- 未作为 `interactionTargets.ts` 的 find 函数替代
- 无独立 semanticId 字段（目前 entity.id / configId / container.id 充当语义标识）

保留对接点，不修改不激活。

### C.10 结论

**KEEP_FROZEN**

理由：
- 0 处生产消费，本轮不激活、不重写（遵守用户约束 7）
- 带完整类型 + build + 查询 API + 单元测试，不可直接删
- 已天然承担 semanticId / ownership 表达能力，保留作为未来接入点
- 本轮默认优先 KEEP_FROZEN（用户约束）

## D. leave-home 三房间所有权清单

范围：living / bedroom / entrance。
约束：不处理 dining / kitchen / laundry；不修改 breakfast / night-patrol。

字段定义：
- **VS**（Visual Source）：Room = Room3D.RoomDecorations 手写；Task = Scene3D 的 Object3D/Container3D；None = 无视觉
- **CS**（Collision Source）：TC = task.containers（FirstPersonControls L529 合并 allFurniture 前半段）；DF = roomDecorFurniture（同文件 L528 合并后半段）；None = 无碰撞
- **TCS**（Task Container Source）：task.containers 对应 id（VS=Task & CS=TC 时一致，列出便于 audit）
- **SID**（Semantic ID）：当前代码实际充当语义主键的 id（entity.id 运行时生成，不可复现；此处列 configId / containerId / decorId）
- **DV**（Duplicate Visual）：Room 与 Task 的同语义物体在同一 XZ 位置 ±0.5m 内各画一次
- **DC**（Duplicate Collision）：TC 与 DF 条目 XZ 平面 footprint 重叠 ≥ 50%（纯 XZ，不看 Y）
- **DD**（Door Blocking）：家具 AABB 任一角距门洞中心 < 门洞宽/2 + 家具 footprint 对应轴半长 + PLAYER_RADIUS(0.3)
- **OT**（Occludes Target）：玩家走到目标物交互圈默认半径 2.5m 必须穿过该家具碰撞，或家具碰撞推挤使目标不可达

房间参照：
```
living  : center=(0,0,0), size=8×8, doorways
  西墙 x=-4 → bedroom (width=1.5, center (local) x=-4,z=0)
  东墙 x=+4 → kitchen (本轮 ignore)
  北墙 z=+4 → entrance (width=1.5, center x=0,z=+4)

bedroom : center=(-8,0,0), size=8×8 → world x∈[-12,-4], z∈[-4,4]
  东墙 x=+4 (room-local) → world x=-4, 连 living (width=1.5, center world x=-4,z=0)

entrance: center=(0,0,8), size=6×6 → world x∈[-3,3], z∈[5,11]
  南墙 z=-3 (room-local) → world z=5, 连 living (width=1.5, center x=0,z=5)
```

### D.1 Living

task.containers in living：cnt-coffee-table
task.objects in living：obj-key（surfaceContainerId=cnt-coffee-table）

Room3D.renderLiving：Room3D.tsx L165-L348

| # | 家具/物件 | VS 源码位置 (world x,z) | CS | TCS | SID | DV | DC | DD | OT |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 主沙发 (大) | Room L174 `(0, center.z-1.2)` → **(0, -1.2)**；SofaModel 2.4×1.0×0.9 | DF: decor-sofa-main | — | decor-sofa-main | 严重：Room (0,-1.2) vs DF (0,-3.0) → z 差 1.8 > 沙发深 1.0 → 视觉/碰撞完全两个位置；玩家走到 z=-2 会撞空气 | 否（两位置不相交） | 否：DF (0,-3.0) 距 living→bedroom 门洞 (-4,0) 距离 >4m；距 living→entrance (0,+4) 距离 7m | 否：key 在茶几 (0,0.3)，路径畅通（茶几 x=0±0.7, z=0.3±0.35；沙发 DF 在 z=-3±0.5 不挡） |
| 2 | L 沙发 (侧) | Room L196 `(center.x-2.0, center.z-0.5)` → **(-2.0, -0.5)**，rot 90°；size 1.6×0.9 | DF: decor-sofa-side (-1.5, 0) | — | decor-sofa-side | 轻微：Room (-2.0,-0.5) vs DF (-1.5,0) → 偏移 < 各自 footprint 半长；相交约 30% | 轻度 | 否 | 否 |
| 3 | 茶几 | Task Container3D: cnt-coffee-table room-local (0,0.3) → world **(0, 0.3)**；size 1.4×0.45×0.7 | TC: cnt-coffee-table | cnt-coffee-table | cnt-coffee-table | 否：Room L201-L205 画茶几外壳 (center.x-0.5, z-0.3) = (-0.5,-0.3)，但 Task 画茶几在 (0, 0.3) → x 差 0.5, z 差 0.6 → 不重合但接近，茶几"两副本"视觉 | 否：无同语义 DF | 否：距 living→bedroom(-4,0) 4m，距 living→entrance(0,+4) 3.7m | 本身承载 obj-key；茶几碰撞 x∈[-0.7,0.7], z∈[-0.05,0.65] |
| 3b | 茶几表面装饰（遥控器/杯/书） | Room L207-L239，与茶几外壳同位置 (center.x-0.8≈-0.8, z-0.5≈-0.5) 附近 | None (DF 无对应小物) | — | — | 否 | 否 | 否 | 否 |
| 4 | 电视 | Room L277 `(center.x + size/2 - 1.0 = +3.0, center.z - 1.0 = -1.0)` → **(3.0,-1.0)**，rot -90° | DF: decor-tv | — | decor-tv | 是：Room (3.0,-1.0) vs DF (2.8,-3.0) → z 差 2m，贴东墙不同段 | 否 | 否（不挡 living→kitchen 门洞 (4,0)） | 否 |
| 5 | 电视柜 | Room L271 `(center.x + size/2 - 1.1 = +2.9, center.z - 1.0 = -1.0)` → **(2.9,-1.0)** | DF: decor-tv-stand | — | decor-tv-stand | 严重：Room (2.9,-1.0) vs DF (2.8,-3.0) → z 差 2m | 否 | 视觉 DD（living→kitchen，本轮 ignore）；不挡 bedroom/entrance 门洞 | 否 |
| 6 | 书架 | Room L283 `(center.x + size/2 - 0.6 = +3.4, center.z - 1.5 = -1.5)` → **(3.4,-1.5)** | DF: decor-bookshelf | — | decor-bookshelf | 是：Room (3.4,-1.5) vs DF (3.5,-2.5) → z 差 1m | 否 | 否 | 否 |
| 7 | 左墙置物架 | Room L289 `(center.x - size/2 + 0.6 = -3.4, center.z + 1.0 = +1.0)` → **(-3.4,1.0)** | DF: decor-shelf | — | decor-shelf | 轻微：Room (-3.4,1.0) vs DF (-3.8,1.5) | 轻微 | 否 | 否 |
| 8 | 画 | Room L295 `(center.x - size/2 + 0.3 = -3.7, center.z + 1.5 = +1.5)` → **(-3.7,1.5)** | DF: decor-painting | — | decor-painting | 完美匹配 ✓ | 否（深度 0.05 ≤ PLAYER_RADIUS，玩家靠不到墙） | 否 | 否 |
| 9 | 挂钟 | Room L301 `(center.x + size/2 - 0.3 = +3.7, center.z = 0)` → **(3.7,0)** | DF: decor-clock | — | decor-clock | 完美匹配 ✓ | 否（深度 0.05） | 否 | 否 |
| 10 | 落地灯 1 (南东) | Room L307 `(center.x + size/2 - 1.0 = +3.0, center.z - 2.0 = -2.0)` → **(3.0,-2.0)** | DF: decor-floor-lamp-1 (3.2, 2.0) | — | decor-floor-lamp-1 | 严重：Room 南 z=-2 vs DF 北 z=+2 → **完全相反侧** | 否 | 否 | 否 |
| 11 | 落地灯 2 (西) | Room L313 `(center.x - size/2 + 1.0 = -3.0, center.z + 0.5 = +0.5)` → **(-3.0,0.5)** | DF: decor-floor-lamp-2 (3.5, 1.5) | — | decor-floor-lamp-2 | 严重：Room 西 (-3, 0.5) vs DF 东 (3.5,1.5) → 东西对穿 | 否 | 否 | 否 |
| 12 | 植物 1 (西西南) | Room L319 `(center.x - size/2 + 0.6 = -3.4, center.z - 2.0 = -2.0)` → **(-3.4,-2.0)** | DF: decor-plant-1 (-3.5, -3.5) | — | decor-plant-1 | 偏离：Room (-3.4,-2.0) vs DF (-3.5,-3.5) z 差 1.5 | 否 | 否 | 否 |
| 13 | 植物 2 (东北) | Room L325 `(center.x + size/2 - 0.6 = +3.4, center.z + 2.0 = +2.0)` → **(3.4,2.0)** | DF: decor-plant-2 (3.6, 2.0) | — | decor-plant-2 | 高度 ✓ | 否 | 否 | 否 |
| 14 | 植物 3 (东南) | Room L331 `(center.x + 1.5, center.z - 2.0)` → **(1.5,-2.0)** | None | — | — | 否 | 否 | 否 | 否 |
| 15 | 椅子 | Room L337 `(center.x + 1.5, center.z + 1.0)` → **(1.5,1.0)** | DF: decor-chair (3.0, 1.5) | — | decor-chair | 是：Room (1.5,1.0) vs DF (3.0,1.5) x 差 1.5 | 否 | 否 | 否 |
| 16 | 小茶几 (边几) | Room L343 `(center.x + 1.8, center.z + 0.8)` → **(1.8,0.8)** | DF: decor-side-table (3.8, -2.0) | — | decor-side-table | 严重：完全不同角落 | 否 | 否 | 否 |
| 17 | 地毯 | Room L168 `(center.x, center.z-0.5)` → **(0,-0.5)** | None | — | — | 否 | 否 | 否 | 否 |
| 18 | 抱枕×3 | Room L179-L193 (沙发上) | None | — | — | 否 | 否 | 否 | 否 |
| 19 | 钥匙猫 (动画) | Room L241-L268，主沙发上 (0.3,-1.4) | None | — | — | 否 | 否 | 否 | 否（动画，不参与碰撞） |
| 20 | 钥匙（目标物） | Task Object3D obj-key，初始 surface=cnt-coffee-table 表面 (0, world z≈0.3+surface) | None（objects 不进入家具列表） | — | obj-key | 否 | — | 否 | 本体：交互圈 world (0, 0.3)，半径 2.5m |

**D.1 汇总（Living）**
- 问题：DF 与 Room 视觉整体错位（14 个 DF 条目仅 4 个匹配：画/书/钟/植物2）
- 玩家体验症状：看得到过不去 / 过得去却被隐形墙挡 / 两个茶几视觉
- 不挡 bedroom / entrance 门洞
- 目标物 obj-key 可达

### D.2 Bedroom

task.containers in bedroom：cnt-nightstand
task.objects in bedroom：obj-phone（hiddenInContainer: cnt-nightstand，initialOpen: false，需 F 开抽屉）

Room3D.renderBedroom：Room3D.tsx L513-L638

注意：B.3 已确认 bedroom DF 的 world 位置全部飞在房间外（碰撞失效），所以 CS=DF 栏写"DF 实际位置"与"正确 room-local 后位置"对比。

| # | 家具/物件 | VS 源码位置 (world x,z) | CS | TCS | SID | DV | DC | DD | OT |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 大床 | Room L522 `(center.x, center.z-0.8)` = **(-8,-0.8)**；size 2.0×1.0×2.4 | DF: decor-bed 实际 world (-16,-0.8) ❌（房间外）；正确 room-local 应为 (0,-0.8) → world (-8,-0.8) | — | decor-bed | 是（若 DF 修正为 (0,-0.8) 则与 Room 完美 ✓；当前 DF 飞房间外，视觉重合 0%） | 否（DF 飞出房间） | 视觉 DD 否：床 x∈[-9,-7], z∈[-2.0,0.4]；门洞 (-4,0) 距离 > 3m | 玩家从门洞到 cnt-nightstand 任务容器（见 #8）必须穿过床视觉南侧 z∈[-0.4, 0.4] 部分，但床碰撞目前空 → 视觉穿床（违和） |
| 2 | 左床头柜 (含台灯) | Room L556 `(center.x - size/2 + 0.85, center.z-1.5)` = **(-11.15,-1.5)**；NightstandModel 0.55×0.55×0.45 | DF: decor-nightstand-left 实际 world (-19.15,-1.5) ❌；正确 room-local 应为 (-3.15,-1.5) → world (-11.15,-1.5) | — | decor-nightstand-left | 是（修正后匹配） | 否 | 否 | 左柜不承载任务；但影响任务动线（西墙边） |
| 3 | 右床头柜 + 台灯 | Room L544 `(center.x + 1.5, center.z - 1.5)` = **(-6.5,-1.5)**；NightstandModel 0.55×0.55×0.45 | None（DF 只有 nightstand-left，无 right 条目） | — | — | No | No | 否 | **本应为 cnt-nightstand（#8）的视觉归属，却被 #8 放在不同位置** |
| 4 | 书桌 | Room L568 `(center.x+1.6, center.z+1.0)` = **(-6.4,1.0)**；DeskModel 1.3×0.75×0.65 | DF: decor-desk 实际 world (-14.4,1.0) ❌；正确 room-local (+1.6, 1.0) → world (-6.4,1.0) | — | decor-desk | 是（修正后匹配） | 否 | 否 | 书桌视觉贴东北角，不挡手机 |
| 5 | 椅子 (书桌旁) | Room L580 `(center.x+2.5, center.z+1.0)` = **(-5.5,1.0)**，rot 180°；ChairFallback 0.45×0.65×0.45 | DF: decor-chair 实际 world (-13.5,1.0) ❌；正确 room-local (+2.5,1.0) → world (-5.5,1.0) | — | decor-chair | 是（修正后匹配） | 否 | 否 | 否 |
| 6 | 衣柜 | Room L586 `(center.x - size/2 + 0.85, center.z+0.6)` = **(-11.15,0.6)**；WardrobeModel 1.8×2.1×0.65 | DF: decor-wardrobe 实际 world (-19.15,0.6) ❌；正确 room-local (-3.15,0.6) → world (-11.15,0.6) | — | decor-wardrobe | 是（修正后匹配） | 否 | 否 | 否 |
| 7 | 斗柜 | Room L592 `(center.x - 1.5, center.z + 1.5)` = **(-9.5,1.5)**；DresserFallback 1.2×0.9×0.45 | DF: decor-dresser 实际 world (-17.5,1.5) ❌；正确 room-local (-1.5,1.5) → world (-9.5,1.5) | — | decor-dresser | 是（修正后匹配） | 否 | 否 | 否 |
| 8 | 床头柜抽屉（任务） | Task Container3D cnt-nightstand room-local (0.5, 0.8) → world **(-7.5, 0.8)**；size 0.6×0.5×0.4 | TC: cnt-nightstand | cnt-nightstand | cnt-nightstand | **严重 DV=Yes**：Room 画右床头柜在 (-6.5,-1.5)，Task 容器在 (-7.5,+0.8) → x 差 1m + z 差 2.3m，完全两个不同位置。Room 视觉暗示玩家去 (-6.5,-1.5) F 交互，但真正交互点在斗柜北侧 (-7.5,+0.8) 的地板上 | 否：DF bedroom 全飞出 | 否：距门洞 (-4,0) > 3.5m | **OT 严重**：手机 hiddenInContainer 在此，玩家按视觉会 F 错位置，一直"开不了抽屉"——核心 bug |
| 9 | 书架 | Room L598 `(center.x + size/2 - 0.6, center.z+1.0)` = **(-4.6,1.0)**；BookshelfFallback 0.7×1.6×0.3 | DF: decor-bookshelf 实际 world (-12.6,1.0) ❌；正确 room-local 应为 (+3.4,1.0) → world (-4.6,1.0)（DF 写 x=-4.6，正负反了，跑到西墙外） | — | decor-bookshelf | 是（修正后匹配） | 否 | **DD=Yes（修正后）**：Room 书架 world AABB x∈[-4.95,-4.25], z∈[0.85,1.15]；门洞 x=-4，门洞中心 x=-4,z=0，宽 1.5 → 走行空间 z∈[-0.75-radius,+0.75+radius]=[-1.05,1.05]，x∈[-4.05,-3.95]。书架 x 范围最右 -4.25 距门洞 x 边界 -4.05 = 0.2m < PLAYER_RADIUS 0.3；z 上限 1.15 超出走行 z 上限 1.05。若修正 DF 碰撞为正确位置，玩家从 living 进入 bedroom 往北走就会卡书架。| 不 OT（手机在西侧） |
| 10 | 画 | Room L604 `(center.x, center.z + size/2 - 0.3)` = **(-8,3.7)** | DF: decor-painting 实际 world (-16,3.7) ❌；正确 room-local (0, 3.7) | — | decor-painting | 是（修正后匹配） | 否（深度 0.05） | 否 | 否 |
| 11 | 挂钟 | Room L610 `(center.x + size/2 - 0.3, center.z-1.5)` = **(-4.3,-1.5)** | DF: decor-clock 实际 world (-12.3,-1.5) ❌；正确 room-local (+3.7, -1.5) | — | decor-clock | 是（修正后匹配：写 x=-4.3 → 应为 x=+3.7，DF 正负又反了） | 否 | 否 | 否 |
| 12 | 毛巾×2 | Room L615-L623 | None | — | — | 否 | 否 | 否 | 否 |
| 13 | 植物 1 (西北) | Room L627 `(center.x - size/2 + 1.2, center.z+2.0)` = **(-10.8,2.0)** | DF: decor-plant 实际 world (-12.6,2.5) ❌；正确 room-local (-2.8,2.0) | — | decor-plant | 修正后位置也不对（DF 原写 x=-4.6,z=2.5 → 若不加 roomCenter 则是东北书架旁，不是西北） | 否 | 否 | 否 |
| 14 | 地毯 | Room L516 `(center.x, center.z-0.3)` = **(-8,-0.3)** | None | — | — | 否 | 否 | 否 | 否 |
| 15 | 枕头×3 | Room L527-L540（床上） | None | — | — | 否 | 否 | 否 | 否 |
| 16 | 桌上台灯 | Room L573-L576 | None | — | — | 否 | 否 | 否 | 否 |
| 17 | 手机（任务目标） | Task Object3D: obj-phone，初始 hiddenInContainer cnt-nightstand → world x≈-7.5,z≈0.8 | None | — | obj-phone | 否 | — | 否 | 本体；由 #8 OT 根因间接影响可达 |

**D.2 汇总（Bedroom）—— 核心问题最严重：**

1. DF.position 全部 10 条为错误 world 或反向 room-local，**碰撞 100% 失效**
2. cnt-nightstand 任务容器位置 (-7.5,+0.8) 与 Room 右床头柜视觉 (-6.5,-1.5) 完全不符 → OT 核心 bug
3. 书架视觉贴 living→bedroom 门洞北侧（x∈[-4.95,-4.25], z∈[0.85,1.15]）→ 修正 DF 碰撞后 DD=Yes 必须处理
4. 床横跨卧室中轴，但碰撞空 → 视觉穿床

### D.3 Entrance

task.containers in entrance：cnt-umbrella-stand、cnt-entrance-tray
task.objects in entrance：obj-umbrella（surfaceContainerId: cnt-umbrella-stand）

Room3D.renderEntrance：Room3D.tsx L47-L163

| # | 家具/物件 | VS 源码位置 (world x,z) | CS | TCS | SID | DV | DC | DD | OT |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 鞋柜 | Room L56 `(center.x - size/2 + 0.6, center.z - 0.5)` = (-2.4, 7.5)；ShoeCabinet 1.2×1.1×0.4 | DF: decor-shoe-cabinet (-2.4,-0.5) → world **(-2.4,7.5)** ✓ | — | decor-shoe-cabinet | ✓ 完美匹配 | 否（深度 0.4，玩家 radius 0.3 不阻路） | 否：距门洞 (0,5) > 2m | 否 |
| 2 | 鞋子 | Room L62 `(-2.4, 8.3)`；ShoesFallback 0.35×0.15×0.45 | DF: decor-shoes (-2.4,0.3) → world **(-2.4,8.3)** ✓ | — | decor-shoes | ✓ 完美匹配 | 轻微（同鞋柜位置上方，但鞋子 footprint 小） | 否 | 否 |
| 3 | 小红伞+小蓝伞 (装饰) | Room L67-L131 `(center.x-size/2+0.9 ≈ -2.1, center.z+0.2≈8.2)` 附近 + `(center.x-0.4≈-0.4, center.z-size/2+0.7≈5.7)` 托盘旁 | None | — | — | 与 #10 的 Task 伞架 (obj-umbrella surface) 视觉不同位置 DV=Yes：Room 画 2 把装饰伞在 (-2.1,8.2) 和门洞旁托盘 (5.7 z)，真正 Object3D 在 cnt-umbrella-stand #10 位置 | 否 | 否 | **OT**：玩家会看到门洞旁 2 把伞去 F，但那里是纯装饰 mesh，无交互。真正 obj-umbrella 在西北角 #10 |
| 3b | 托盘小装饰 (钥匙扣硬币等) | Room L80-L93 `(center.x - 0.4, center.z - size/2 + 0.7)` = **(-0.4, 5.7)** 托盘上 | None | — | — | 与 #11 Task 玄关托盘同语义但不同位置（#11 在 (-1.4,9.0)）| 否 | 否 | **OT：进一步误导玩家以为 5.7 z 那个托盘就是目标** |
| 4 | 挂钩 | Room L96 `(center.x + size/2 - 0.3, center.z)` = (2.7, 8.0)；HookFallback 1.0×0.3×0.05 | DF: decor-hook (2.7,0) → world **(2.7,8.0)** ✓ | — | decor-hook | ✓ 完美匹配 | 否（深度 0.05） | 否 | 否 |
| 5 | 玄关托盘 (Room 手绘) | Room L102 `(center.x - 0.4, center.z - size/2 + 0.7)` = **(-0.4, 5.7)**；EntranceTrayFallback 0.5×0.1×0.35 | None（DF 无 tray 条目；但 TC 有 cnt-entrance-tray 见 #11） | — | — | **严重 DV=Yes：Room 画一个托盘在门洞旁随手放位置 (-0.4,5.7)，Task 容器在西北角 (-1.4,9.0)，完全两个位置** | 否 | 否：不挡门洞 | **OT 核心**：briefing 说"放到玄关托盘"，玩家会去 Room 画的托盘 (-0.4,5.7) 放，F 交互不上（不是 TargetZone），wrongPlaceCount 增加 → 失败 |
| 6 | 画 | Room L134 `(center.x, center.z + size/2 - 0.3)` = (0, 10.7)；PaintingFallback 0.6×0.45×0.05 | DF: decor-painting (0,2.7) → world **(0,10.7)** ✓ | — | decor-painting | ✓ 完美匹配 | 否 | 否 | 否 |
| 7 | 挂钟 | Room L140 `(center.x + size/2 - 0.3, center.z+1.0)` = (2.7, 9.0)；ClockFallback 0.3×0.3×0.05 | DF: decor-clock (2.7,1.0) → world **(2.7, 9.0)** ✓ | — | decor-clock | ✓ 完美匹配 | 否 | 否 | 否 |
| 8 | 植物 1 (西) | Room L146 `(center.x - size/2 + 1.0, center.z + 0.8)` = (-2.0, 8.8) | DF: decor-plant-1 (-2.0,0.8) → world **(-2.0,8.8)** ✓ | — | decor-plant-1 | ✓ 完美匹配 | 否 | 否 | 否 |
| 9 | 植物 2 (东) | Room L152 `(center.x + size/2 - 1.0, center.z - 0.5)` = (2.0, 7.5) | DF: decor-plant-2 (2.0,-0.5) → world **(2.0,7.5)** ✓ | — | decor-plant-2 | ✓ 完美匹配 | 否 | 否 | 否 |
| 10 | 伞架（任务）+ 雨伞（任务） | Task Container3D cnt-umbrella-stand room-local (-2.5,1.0) → world **(-2.5, 9.0)**；size 0.3×0.4×0.3 | TC: cnt-umbrella-stand | cnt-umbrella-stand | cnt-umbrella-stand | **DV=Yes**：Room 画了小红伞/蓝伞在门洞旁 (5.7 z) 和 (-2.1,8.2)，真正 umbrella-stand 在西北角 (-2.5,9.0)。两处不同的"伞"视觉。| 否：DF 无 umbrella 条目 | 否：距门洞中心 (0,5) > 4m | **OT=本体**：真正承载 obj-umbrella，但视觉误导使玩家走错位置。XZ 碰撞 0.3×0.3；玩家半径 0.3 相交即阻 |
| 11 | 玄关托盘（任务目标区） | Task Container3D cnt-entrance-tray room-local (-1.4, 1.0) → world **(-1.4, 9.0)**；size 0.8×0.1×0.4 | TC: cnt-entrance-tray | cnt-entrance-tray | cnt-entrance-tray | **DV=Yes（同 #5）**：Room 画托盘在门洞旁 (-0.4,5.7)，Task 容器在西北角 (-1.4,9.0) | 否：DF 无 tray 条目 | 否：距门洞 (0,5) > 4m | **OT 核心**：目标托盘"双份"。**XZ 碰撞注意：tray size z=0.1 深，但碰撞是纯 XZ 圆矩（用户约束3）—— 0.1 深仍会阻挡玩家**：托盘 AABB x∈[-1.8,-1.0], z∈[8.95,9.05]，半径 0.3 的玩家到中心 0.35 就被推。玩家无法走到托盘"上面"（视觉浅） |
| 12 | 地毯 | Room L50 `(center.x, center.z + size/2 - 0.8)` = (0,10.2)；RugFallback 2.0×0.04×1.2 | None | — | — | 否 | 否 | 否 | 否 |

**D.3 汇总（Entrance）**
- DF 坐标全部正确（room-local ✓），且与 Room 视觉完美匹配（8/8）
- **UX 核心 bug：伞架 + 玄关托盘双份视觉**：
  - Room 画的在门洞旁随手放直觉位置 (z≈5.7)——纯装饰 mesh，无交互，不是 TargetZone
  - Task 容器在西北角 (z≈9.0)——可交互，真正承载目标
  - briefing 文案"放到玄关托盘""雨伞→玄关伞架"天然指向门洞旁的直觉位置
  - 玩家走到门洞旁托盘 F 不上，wrongPlaceCount 一直加 → 失败
- cnt-entrance-tray XZ 碰撞 0.8×0.1（扁平），按纯 XZ 圆矩判定仍会阻挡玩家贴近表面

### D.4 三房间所有权精简矩阵

| 维度 / 房间 | Living | Bedroom | Entrance |
|---|---|---|---|
| DF.position 正确性 | room-local ✓ | 全部写成 world/方向错误 ✗✗✗ | room-local ✓ |
| DF ↔ Room 视觉匹配率（按条目） | 4/14（画、钟、植物2、画？实际为：画、钟、植物2、挂钟——4 个完美；10 个错位严重） | 0/10（全飞出房间，若修正为正确 room-local 则 7/10 匹配，2 个 position x 正负反了：bookshelf、clock；1 个植物位置不符） | 8/8 完美 ✓ |
| TaskContainer 匹配视觉位置 | cnt-coffee-table 与 Room 茶几外壳接近（x 差 0.5，z 差 0.6），算"部分匹配" | cnt-nightstand 与 Room 右床头柜视觉 (-6.5,-1.5) 完全不符（实际在 -7.5,+0.8）✗✗ | cnt-umbrella-stand / cnt-entrance-tray 与 Room 手绘物件完全两位置（门洞旁 vs 西北角）✗✗✗ |
| 挡门（视觉 DD） | 电视柜/书架挡 living→kitchen（本轮 ignore） | 书架贴 living→bedroom 门洞北侧（x=-4.6,z=1.0），修正 DF 碰撞后 DD=Yes ⚠ | 无 |
| 挡门（碰撞 DD 当前） | DF 电视柜 z=-3 远离门洞 | DF 全飞出 → 当前无碰撞 DD；修正后书架 DD=Yes ⚠ | 无 |
| 目标物 OT 风险 | 低（茶几位置接近） | 高（床头柜错位，OT 核心 bug）⚠⚠ | 极高（伞架/托盘双份视觉，完全错配）⚠⚠⚠ |
| 碰撞有效性（当前） | DF 生效但错位（看得到过不去 / 过得去被隐形墙挡） | 0%（DF 全飞出），玩家整屋穿墙 | DF 生效且匹配 ✓ |
| 主要动作项（未来 Step） | 统一 DF ↔ Room 视觉位置（改 DF，不动 Room） | 修正 DF.position 为正确 room-local（10 条全改）+ 修正 cnt-nightstand 位置对齐 Room 右床头柜 + 处理门口书架 DD ⚠⚠ | 统一伞架/玄关托盘的视觉 ↔ 容器 ↔ 语义位置（把 TC 移到门洞旁，或 Room 视觉去掉门洞旁的装饰伞/托盘）⚠⚠⚠ |

## E. 最小执行方案（修订版）

严格遵守用户限制：
- E.1-E.3 每次只改一个房间，living → bedroom → entrance，前一房间真人验收通过再下一房间
- E.4 不新增通用架构（不新增 furnitureOwnership.ts / furnitureCollision.ts / 第二套碰撞系统；不激活 Scene Graph）
- E.5 不改模型风格和全局调色板（FallbackModels / palette / stylizedMaterials 全不动）
- E.6 不改任务阶段、计时、得分、文案（leave-home.ts 的 stages/goals/timeLimit/completionText 等全不动）
- E.7 不修改隐藏关卡
- E.8 每房间修改后真人行走验证
- E.9 不处理 dining/kitchen/laundry；不修改 breakfast / night-patrol

### E.0 Step 0：前置基线验证（0 源码修改，仅手工走查 + 脚本）

耗时 ≤ 30 分钟，完成后方可进入 Step 1。

**真人走查 Checklist（Step 0 baseline）**：

| ID | 检查项（真人 WASD 走） | 当前预期（作为基线记录） |
|---|---|---|
| 0.1 | living 出生点 (0,-1.5) 站得稳 | 可站，不被任何 TC/DF 推挤 |
| 0.2 | living → bedroom 门洞（x=-4, z=0，宽 1.5）通过 | 走 -X 从 (0,-1.5) 到 (-4,0)，顺利通过 |
| 0.3 | living → entrance 门洞（z=+4，宽 1.5）通过 | 走 +Z，顺利通过 |
| 0.4 | F 与 cnt-coffee-table 交互成功 | 显示"茶几"，视觉茶几与交互位置接近 |
| 0.5 | E 保存钥匙记忆成功 | toast 成功 |
| 0.6 | 切换 top-down（V 键）并验证碰撞 | 行为一致 |
| 0.7 | bedroom：走到 Room 画的右床头柜 (-6.5,-1.5)，按 F 能否开抽屉 | 记录：失败/成功（预期失败：TC 在 (-7.5,0.8)） |
| 0.8 | bedroom：实际走到 (-7.5,0.8) 位置按 F 能否开抽屉 | 记录：失败/成功（预期成功） |
| 0.9 | entrance：门洞旁 Room 托盘 (-0.4,5.7) 按 F 能否放物体 | 记录：失败（不是目标区） |
| 0.10 | entrance：西北角 (-1.4,9.0) 按 F 能否放物体 | 记录：成功（真正目标区） |
| 0.11 | entrance：Room 画的门洞旁伞位置按 F 能否拿到雨伞 | 记录：失败（真正伞在西北） |

**脚本验证（可选，无需 commit）**：
- 对 DF 条目计算 world = roomCenter + position，判定在 size/2 范围内（bedroom 全失败）
- 对 TC 条目计算 world，与 Room3D 对应硬编码位置对比

**产出**：qa-artifacts 录屏 + checklist 勾选结果。

### E.1 Step 1：Living 修正（living 单独验收）

原则：**改 DF 位置，使碰撞 = Room 视觉位置**；不改 cnt-coffee-table 位置（D.1 评估它接近茶几视觉，偏差可接受）；不改模型风格；不改任务容器。

只改 1 个文件：`src/data/decorFurniture.ts` 的 living 数组。

具体 living DF 修正映射表（正确 room-local = Room 视觉 world（因 living.center=0））：

| decor id | 当前 DF (x,z) | Room 视觉 world (x,z) 来源 | 修正后 DF (x,z) |
|---|---|---|---|
| decor-sofa-main | (0,-3.0) | L174 (0, -1.2) | **(0,-1.2)** |
| decor-sofa-side | (-1.5,0) | L196 (-2.0,-0.5) | **(-2.0,-0.5)** |
| decor-tv-stand | (2.8,-3.0) | L271 (2.9,-1.0) | **(2.9,-1.0)** |
| decor-tv | (2.8,-3.0) | L277 (3.0,-1.0)（TV 在 stand 上方偏右 0.1） | **(3.0,-1.0)** |
| decor-bookshelf | (3.5,-2.5) | L283 (3.4,-1.5) | **(3.4,-1.5)** |
| decor-shelf | (-3.8,1.5) | L289 (-3.4,1.0) | **(-3.4,1.0)** |
| decor-floor-lamp-1 | (3.2,2.0) | L307 (3.0,-2.0)（z 南北反） | **(3.0,-2.0)** |
| decor-floor-lamp-2 | (3.5,1.5) | L313 (-3.0,0.5)（x 东西反，z 差 1m） | **(-3.0,0.5)** |
| decor-plant-1 | (-3.5,-3.5) | L319 (-3.4,-2.0) | **(-3.4,-2.0)** |
| decor-chair | (3.0,1.5) | L337 (1.5,1.0) | **(1.5,1.0)** |
| decor-side-table | (3.8,-2.0) | L343 (1.8,0.8) | **(1.8,0.8)** |

保持不变（已匹配或无对应视觉）：
- decor-painting (-3.7, 1.5) ✓（Room L295 匹配）
- decor-clock (3.7, 0) ✓（Room L301 匹配）
- decor-plant-2 (3.6, 2.0) ✓（Room L325 匹配，x 差 0.2 忽略）

**Living 真人验收 Checklist（Step 1 放行 Step 2 必需）**：

| ID | 检查项 | 验收要求 |
|---|---|---|
| L.1 | 出生点 (0,-1.5) 站得稳，不被推 | 通过 |
| L.2 | 主沙发：看得到的地方站不上去；看不见的隐形墙消失 | 通过 |
| L.3 | 落地灯 1（南东角落 (3,-2)）：撞得到 | 通过 |
| L.4 | 落地灯 2（西 (-3,0.5)）：撞得到 | 通过 |
| L.5 | 电视柜 (2.9,-1.0) 贴东墙中间：碰撞匹配视觉 | 通过 |
| L.6 | living→bedroom 门洞 (-4,0) 通过 | 通过（无东西挡） |
| L.7 | living→entrance 门洞 (0,+4) 通过 | 通过 |
| L.8 | 从茶几周围 4 个方向走到 cnt-coffee-table (0,0.3) 可交互（按 F 出提示） | 4 方向全 OK |
| L.9 | 全房绕一圈：无"看得到过不去"和"过得去被隐形墙挡" | 无 |
| L.10 | top-down 模式（V 键）碰撞行为一致 | 通过 |

以上 10 项全 PASS，才进入 Step 2（bedroom）。

### E.2 Step 2：Bedroom 修正（bedroom 单独验收）

必须在 Step 1 Living 验收通过后才开始。

改 2 个文件：
1. `src/data/decorFurniture.ts` 的 bedroom 数组（修正 position 为正确 room-local，全部 10 条）
2. `src/data/tasks/leave-home.ts` 的 cnt-nightstand position（对齐 Room 右床头柜视觉）

具体 bedroom DF 修正映射表（正确 room-local = Room 视觉 world - bedroom.center(-8,0,0) → x = world_x + 8, z = world_z）：

| decor id | 当前 DF (x,z) | Room 视觉 world (x,z) 来源 | 修正后 DF (x,z) = (x+8, z) |
|---|---|---|---|
| decor-bed | (-8,-0.8) | L522 (-8,-0.8) | **(0,-0.8)** |
| decor-nightstand-left | (-11.15,-1.5) | L556 (-11.15,-1.5) | **(-3.15,-1.5)** |
| decor-desk | (-6.4,1.0) | L568 (-6.4,1.0) | **(1.6,1.0)** |
| decor-wardrobe | (-11.15,0.6) | L586 (-11.15,0.6) | **(-3.15,0.6)** |
| decor-dresser | (-9.5,1.5) | L592 (-9.5,1.5) | **(-1.5,1.5)** |
| decor-bookshelf | (-4.6,1.0) | L598 (-4.6,1.0) → x 负号注意：Room 视觉 x=-4.6，应 room-local x = -4.6 - (-8) = +3.4 | **(3.4,1.0)**（不是 -4.6） |
| decor-painting | (-8,3.7) | L604 (-8,3.7) | **(0,3.7)** |
| decor-clock | (-4.3,-1.5) | L610 (-4.3,-1.5) → room-local x = -4.3 - (-8) = +3.7 | **(3.7,-1.5)**（不是 -4.3） |
| decor-chair | (-5.5,1.0) | L580 (-5.5,1.0) → room-local x=-5.5-(-8)=+2.5 | **(2.5,1.0)** |
| decor-plant | (-4.6,2.5) | L627 (-10.8,2.0)（Room 视觉是西墙 (-10.8,2.0)，不是东北）→ room-local x=-10.8+8=-2.8, z=2.0 | **(-2.8,2.0)** |

**cnt-nightstand 修正（对齐 Room 右床头柜视觉）**：
- 当前 L164：`position { x: 0.5, y: 0.4, z: 0.8 }` → world (-7.5, 0.8)
- Room 右床头柜 world L544：(-6.5, -1.5) → room-local x = -6.5 - (-8) = +1.5, z = -1.5
- 修正为：`position { x: 1.5, y: 0.55, z: -1.5 }`（y 对齐 Room 画的 NightstandModel 尺寸 0.55）
- size 保持 0.6×0.5×0.4，调整为与 Room 画 NightstandModel 0.55×0.55×0.45 接近：**size { x: 0.55, y: 0.55, z: 0.45 }**

**门口书架 DD 处理（DD=Yes 根因）**：
- 书架 Room 视觉：(-4.6,1.0) → x∈[-4.95,-4.25], z∈[0.85,1.15]
- 门洞走行空间：x≥-4.05（wall line x=-4 + radius0.3 - 0.05 padding），z∈[-1.05, 1.05]
- 书架 z 下限 0.85 < 走行 z 上限 1.05 → 书架在门洞北侧 z 区间内重叠，玩家穿不过
- 最小处理：书架不移除，改为 XZ 碰撞不完整遮挡。但用户约束 6 禁止新增第二套家具碰撞。
- 方案：**将书架 position z 从 1.0 北移到 2.0**（Room L598 和 DF 同时改），即 Room 画的位置也改到 z=2.0。这样书架 z∈[1.85,2.15]，不进入门洞 z 上限 1.05。桌面+2 组物品的其他位置也做对应北移，但整体空间感可接受。
- 备选：若用户不愿改 Room 视觉，将书架 XZ 的 size.x 从 0.7 缩为 0.4（只保留薄度），碰撞缩小 x∈[-4.8,-4.4]，仍可能挡门（因为 x 还是到 -4.4 < -4.05）。所以首选方案是北移。

**Bedroom 真人验收 Checklist（Step 2 放行 Step 3 必需）**：

| ID | 检查项 | 验收要求 |
|---|---|---|
| B.1 | living→bedroom 门洞通过（从 living 进入 bedroom） | 顺利通过，不被书架 DD 卡住 |
| B.2 | 床：碰撞与视觉匹配，穿不过去 | 通过 |
| B.3 | Room 右床头柜位置 (-6.5,-1.5) 按 F → 开抽屉成功 | 必须：toast "已打开 床头柜" |
| B.4 | 打开抽屉后 obj-phone 出现，F 拾取手机成功 | toast "已拾取 手机" |
| B.5 | 左床头柜 (-11.15,-1.5) 碰撞正确（撞得到） | 通过 |
| B.6 | 衣柜 / 斗柜 / 书桌 / 椅子：碰撞均匹配视觉 | 目测 + 走动无错位 |
| B.7 | 书架位置 (x 北移后) 不挡门，但撞得到 | 通过 |
| B.8 | bedroom→living 门洞返回无阻挡 | 通过 |
| B.9 | 全房走一圈：无穿墙（之前 DF 全空导致穿墙）| 无穿墙 |
| B.10 | 顶视图模式（V 键）碰撞一致 | 通过 |

10 项全 PASS 才进入 Step 3（entrance）。

### E.3 Step 3：Entrance 修正（entrance 单独验收）

必须在 Step 2 Bedroom 验收通过后才开始。

原则：**让 Task 容器的位置对齐 Room 的直觉视觉（门洞旁）**，而非反过来把 Room 手绘删掉（删掉视觉损失空间感）。不改 DF（entrance DF 已完美匹配 Room 视觉）。

改 3 处：
1. `src/data/tasks/leave-home.ts` 的 cnt-umbrella-stand position
2. `src/data/tasks/leave-home.ts` 的 cnt-entrance-tray position
3. `src/data/tasks/leave-home.ts` 的 obj-umbrella initialPosition（匹配新伞架）

具体修正：

**(1) cnt-umbrella-stand 移到 Room 视觉位置附近**
- 当前 L177：`position { x: -2.5, y: 0.4, z: 1.0 }` → world (-2.5, 9.0)
- Room 画的鞋柜在 (-2.4, 7.5) 旁边，鞋在 (-2.4, 8.3)，小红伞装饰在 (-2.1, 8.2)。取鞋柜北侧一点做伞架：room-local x = -2.0, z = +0.3（world z=8.3，鞋旁边）
- 修正为：`position { x: -2.0, y: 0.4, z: 0.3 }`（room-local，world (-2.0, 8.3)，鞋旁边）
- size 保持 0.3×0.4×0.3

**(2) obj-umbrella initialPosition 跟随新伞架**
- 当前 L141：`initialPosition { x: -2.5, y: 0, z: 1.0 }` → 与旧伞架一致
- 修正为：`initialPosition { x: -2.0, y: 0, z: 0.3 }`（与新 cnt-umbrella-stand 位置一致）
- surfaceContainerId 保持 cnt-umbrella-stand

**(3) cnt-entrance-tray 移到 Room 手绘托盘位置（门洞旁直觉位置）**
- 当前 L188：`position { x: -1.4, y: 0.5, z: 1.0 }` → world (-1.4, 9.0)
- Room 画的托盘 L102：`(center.x - 0.4, center.z - size/2 + 0.7)` = (-0.4, 5.7) → room-local x=-0.4, z=-2.3 (5.7-8=-2.3)
- 修正为：`position { x: -0.4, y: 0.1, z: -2.3 }`（y=0.1 匹配 EntranceTrayFallback 0.1 高度）
- size 保持 0.8×0.1×0.4（与 Room 画的 0.5×0.1×0.35 接近，略大是 TargetZone）

**注意 (3) 纯 XZ 碰撞影响（用户约束 3）**：新托盘位置 (-0.4, z=-2.3 room-local = world z=5.7) 正处于 entrance 门洞（world z=5 线，宽 1.5，中心 z=5）旁。门洞走行空间 z∈[5-0.75-radius, 5+0.75+radius] = [3.95, 6.05]，x∈[-0.75-radius, +0.75+radius] = [-1.05, 1.05]。托盘 x∈[-0.8,0.0], z∈[5.5,5.9] → 与门洞走行空间部分重叠（x∩[-0.8,0.0] ⊂ [-1.05,1.05]；z∩[5.5,5.9] ⊂ [3.95,6.05]）。玩家从 living 进入 entrance（从 z=5 进来）往北走第一步就会撞到托盘。→ **DD=Yes！** 必须微移：
- 托盘移到门洞旁西侧（离门洞远一点，但仍保持直觉"随手放"位置）：x=-2.0, z=-2.3（world (-2.0, 5.7)，与鞋柜并排）。Room L102 的手绘托盘也移到同位置（改 Room3D.renderEntrance 的 L102 位置）。
- 同时把 L67-L93 的装饰伞（小红/蓝伞 + 托盘装饰）也一并移过来（或删掉，避免 DV）。但用户约束 4 说每次只改一个房间。entrance 是第 3 个房间，本轮单独改。

最小化 entrance 修改的推荐版本（改 2 个文件）：

| 文件 | 改什么 | 改前 → 改后 |
|---|---|---|
| tasks/leave-home.ts cnt-umbrella-stand | position (x,z) | (-2.5, 1.0) → **(-2.0, 0.3)** |
| tasks/leave-home.ts obj-umbrella initialPosition | position (x,z) | (-2.5, 1.0) → **(-2.0, 0.3)** |
| tasks/leave-home.ts cnt-entrance-tray | position (x,y,z) | (-1.4, 0.5, 1.0) → **(-2.0, 0.1, -2.3)** (world (-2.0, 5.7)，鞋柜南侧并排，不挡门洞走行 x∈[-1.05,1.05]) |
| Room3D.tsx renderEntrance L102 托盘手绘 | group position (x,z) | (-0.4, 5.7) → **(-2.0, 5.7)** |
| Room3D.tsx renderEntrance L80-L93 托盘装饰 | group position (x,z) | (-0.4, 5.7) → **(-2.0, 5.7)** |
| Room3D.tsx renderEntrance L67-L131 红伞蓝伞 | 直接删除或移到新伞架旁（(-2.0, 8.3) 附近就不需要，因为伞架+obj-umbrella Object3D 会在这里显示） | 删除或移走 |

**Entrance 真人验收 Checklist（Step 3 完成放行）**：

| ID | 检查项 | 验收要求 |
|---|---|---|
| E.1 | living→entrance 门洞通过 | 顺利通过，不被新托盘 DD 卡 |
| E.2 | 伞架（新位置 (-2.0, 8.3) world）按 F 能捡到雨伞 | toast "已拾取 雨伞"；obj-umbrella Object3D 在此处可见 |
| E.3 | Room 画的鞋柜 / 鞋 / 植物 / 挂钟 / 画 碰撞正确（DF 原 8 条匹配） | 8 条全通过 |
| E.4 | 玄关托盘（新位置 (-2.0, 5.7) world）按 F 显示目标区（"玄关托盘（目标区）"提示） | 是 TargetZone，出现橙圈与 label |
| E.5 | 手持钥匙 / 手机 / 雨伞，走到新托盘按 F，3 件都能放上 | 3 件 toast 全成功，wrongPlaceCount 不增加 |
| E.6 | 从门洞 (z=5) 进入 entrance 往北走到伞架 (-2.0, 8.3)，路径通畅无阻挡 | 通过 |
| E.7 | entrance→living 返回通过 | 通过 |
| E.8 | 顶视图模式碰撞一致 | 通过 |
| E.9 | 全流程（observe→save→fetch key phone umbrella→cat fires→update key→finalize on tray）完整通关一遍 | 通关，无卡死 / 错 OT |

9 项全 PASS → 完成。

### E.4 Step 4：最终回归（整体走查）

三房间全部修改完成后，再做一次完整 leave-home 通关走查：
1. 从 living 出生 → 保存钥匙记忆 → 取钥匙
2. 去 bedroom → 开抽屉 → 取手机（期间猫事件触发，钥匙被推到客厅西北角 -3.2,-3.2 world，沙发一侧）
3. 去 entrance → 取雨伞
4. 回客厅重新观察钥匙位置 → 更新记忆 → 取钥匙
5. 三件放到玄关托盘 → 完成

记录：通关时间、卡顿点、是否产生 OT/DD 残留问题。全部通过 → 可以提交 commit（单 commit 包含 3 房间 + 回归通过证明）。

### E.5 通用架构与 Scene Graph 处理（本轮不动）

- **Scene Graph**：保持 C.10 结论 KEEP_FROZEN。semanticId / ownership 对接点保留在 sceneGraph.ts，不激活不重写。
- **furnitureOwnership.ts**：用户约束禁止新增。所有权归属以 D 节的清单（VS / CS / TCS / SID 字段）承担，未来需要时直接按清单落实到数据中。
- **furnitureCollision.ts**：用户约束 6 禁止新增。现有系统已证明存在（FirstPersonControls L528-L539 + collision.ts L253-L295）且正确，复用即可。
- **playerMovement.ts / Room3D.tsx 全局结构**：用户约束禁止修改整体。只局部修改 Room3D.renderEntrance 的位置（E.3 中 3 处 group 位置），不修改文件结构、不引入新组件、不改渲染管线。

### E.6 明确禁止的修改（红线）

本轮及后续 3 Step 全程禁止：
1. 修改 dining / kitchen / laundry 的 DF / 容器 / 视觉 / Room 渲染
2. 修改 breakfast / night-patrol / clean-table / laundry-sort 任务文件
3. 新增 furnitureOwnership.ts / furnitureCollision.ts / sceneGraph 消费代码
4. 激活 Scene Graph（将 buildSceneGraph 接到 flow / interaction / store 中）
5. 修改 src/game/playerMovement.ts、src/game/collision.ts、src/game/placement.ts 的函数签名或整体逻辑
6. 修改任务阶段机（stages）、timeLimit、completionText、failureText、briefing、scoring
7. 修改模型风格（FallbackModels / palette / stylizedMaterials / modelIds）和全局调色板
8. 修改隐藏关卡（若存在）
9. 任何方式在本审计阶段（本 PR / 本 branch 当前 commit）修改源代码文件
