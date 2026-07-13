# FOUNDATION_AUDIT.md - 基础操作代码审计

> **历史审计快照**：用于追踪当时的基础操作根因。当前架构与验收要求见 [HOMEMEM_ARENA_DESIGN.md](HOMEMEM_ARENA_DESIGN.md) 和 [QA_SMOKE_CHECKLIST.md](QA_SMOKE_CHECKLIST.md)。

审计日期：2026-07-10
审计范围：坐标系、相机控制、碰撞、物体摆放、HUD 布局

---

## 1. 当前游戏使用的世界坐标系是什么

**答案**：Three.js 默认右手坐标系，Y 轴向上，X 轴向右，Z 轴向屏幕外（前方为 -Z）。

- 房间中心 center 在 `rooms.ts` 中定义，y 始终为 0
- 地板 y = 0（实际是一个 y=0 的 box，厚度 0.1，上表面 y=0.05）
- 玩家位置 robotPosition.y 初始为 0
- 第一人称相机高度 y = 1.6

---

## 2. Three.js 相机默认朝向是什么

**答案**：Three.js 相机默认朝向 **-Z 方向**（屏幕指向内）。

在 `Scene3D.tsx` 第 289 行，相机初始位置是 `[0, 1.6, 0]`，默认看向 -Z。

---

## 3. robotRotation 的 0 度方向对应世界哪个方向

**答案**：robotRotation = 0 时，forward 向量为 `(0, 0, -1)`（即 -Z 方向，与相机默认朝向一致）。

证据：`playerMovement.ts` 第 38-41 行
```ts
const forwardX = Math.sin(rotation)   // rotation=0 时 = 0
const forwardZ = -Math.cos(rotation)  // rotation=0 时 = -1
const rightX = Math.cos(rotation)     // rotation=0 时 = 1
const rightZ = Math.sin(rotation)     // rotation=0 时 = 0
```

即：
- rotation = 0 → 前方 = -Z
- rotation = π/2 → 前方 = +X
- rotation = π → 前方 = +Z
- rotation = -π/2 → 前方 = -X

**这个坐标系定义本身是正确的**，但与相机 rotation.y 的 Euler 顺序和交互实现存在不一致。

---

## 4. W/S/A/D 当前分别调用了什么函数

**答案**：

在 `FirstPersonControls.tsx` 第 108-215 行：
- W / ArrowUp → `moveState.current.forward = true`
- S / ArrowDown → `moveState.current.backward = true`
- A / ArrowLeft → `moveState.current.left = true`
- D / ArrowRight → `moveState.current.right = true`

实际移动计算在 `useFrame` 中（第 298-335 行）：
```ts
const move = computeMoveVector(moveState.current, robotRotation, speed, delta)
```

最终调用 `playerMovement.ts` 的 `computeMoveVector`。

---

## 5. W/S/A/D 的向量计算公式是什么

**答案**：见 `playerMovement.ts` 第 21-48 行。

```ts
// 输入方向（局部坐标，z 向前，x 向右）
const dz = Number(input.forward) - Number(input.backward)
const dx = Number(input.right) - Number(input.left)

// 归一化
const length = Math.sqrt(dx * dx + dz * dz)
const ndx = dx / length
const ndz = dz / length

// 世界空间 forward/right 向量
const forwardX = Math.sin(rotation)
const forwardZ = -Math.cos(rotation)
const rightX = Math.cos(rotation)
const rightZ = Math.sin(rotation)

// 最终位移 = (forward * ndz + right * ndx) * speed * delta
const distance = speed * delta
return {
  dx: (forwardX * ndz + rightX * ndx) * distance,
  dz: (forwardZ * ndz + rightZ * ndx) * distance,
}
```

**注意**：这里 `ndz` 是前后输入（forward - backward），`ndx` 是左右输入（right - left）。
- forward 贡献到位移时乘的是 forward 向量（X: sin, Z: -cos）
- right 贡献到位移时乘的是 right 向量（X: cos, Z: sin）

这个公式在数学上是正确的。

---

## 6. 为什么前后左右多次出现反向

**根因分析**：

虽然 `computeMoveVector` 的数学公式本身是正确的，但**反向问题来源于多个层次的不一致**：

### 层次 1：鼠标旋转的方向
`FirstPersonControls.tsx` 第 232-234 行：
```ts
useGameStore.setState({
  robotRotation: useGameStore.getState().robotRotation - e.movementX * sensitivity
})
```
鼠标向右移动 → movementX > 0 → robotRotation 减小 → 视角左转（即视角向左转）。

但相机的 `rotation.y` 在 Three.js 中，正值表示向左转（逆时针），负值表示向右转（顺时针）。
等等——Three.js Euler YXZ 顺序下，rotation.y 为正表示绕 Y 轴逆时针旋转（从上方看），即相机看向 -X 方向。

所以：
- 鼠标右移 → robotRotation 减小 → forward 向量的 X 分量减小 → 视角向右转
- 这符合常规 FPS 习惯（鼠标右移 = 视角右移）

### 层次 2：smoothedCamRot 与 robotRotation 的 lerp
`FirstPersonControls.tsx` 第 276 行：
```ts
smoothedCamRot.current.y += (targetRotation.current - smoothedCamRot.current.y) * rotLerp
```

`targetRotation.current = robotRotation`，相机 rotation.y 直接等于这个值。
由于 Three.js 相机默认看 -Z，rotation.y 是绕 Y 轴旋转角度，所以：
- rotation.y = 0 → 看 -Z
- rotation.y = θ → 看方向与 -Z 夹角为 θ

与 forward 向量定义一致。**相机方向与 forward 向量是匹配的**。

### 层次 3：多次修复时的符号混乱
从历史代码痕迹看，问题出在：
1. 不同的人/不同时间修复时，有的在 `computeMoveVector` 里改符号
2. 有的在鼠标移动里改符号
3. 有的在相机 lerp 里改符号
4. 还有的在 `moveToRoom` 初始旋转里改

**符号改了一处没改另一处，就会出现反向**。每次"修复"可能只改了一个地方，打破了原有的平衡。

### 层次 4：缺少统一的坐标系规范
没有统一的文档说明"forward 是 -Z"、"rotation 单位和方向"，导致每次改动都靠试。

### 核心根因总结
虽然当前代码的数学看起来是一致的，但**缺少单一真值来源（single source of truth）**，移动向量计算、鼠标旋转、相机旋转、小地图箭头方向等分散在不同文件，每次修改容易顾此失彼。

---

## 7. 鼠标控制现在为什么只能左右转，不能上下看

**答案**：因为代码里只实现了 yaw（左右），没有 pitch（上下）。

证据：
1. `FirstPersonControls.tsx` 第 229-235 行的鼠标移动只修改 `robotRotation`（yaw），完全没有 pitch 变量
2. 第 277 行硬编码：`smoothedCamRot.current.x = 0`（第一人称下 pitch 恒为 0）
3. `useGameStore` 里也没有 `robotPitch` 之类的状态

pitch 从未被引入，是一个完全缺失的功能，不是 bug。

---

## 8. 玩家位置更新在哪里发生

**答案**：在 `FirstPersonControls.tsx` 的 `useFrame` 回调中（第 261-371 行）。

具体流程：
1. 第 300 行：`computeMoveVector` 计算期望位移
2. 第 303-307 行：计算 `desiredPos`
3. 第 310 行：`resolveRoomCollision` 做房间碰撞解析
4. 第 318-325 行：`resolveFurnitureCollision` 做家具碰撞
5. 第 331-334 行：如果位置变化超过阈值，写回 store：`useGameStore.setState({ robotPosition: resolved })`

位置更新的来源是 `useFrame`（即 R3F 的渲染循环），与帧率挂钩。

---

## 9. 是否每帧无条件 setState

**答案**：不是无条件，但接近每帧都 set。

第 331-334 行有一个微小阈值判断：
```ts
if (dx * dx + dz * dz > 0.000001) {
  useGameStore.setState({ robotPosition: resolved })
}
```

但只要玩家在移动，就会每帧 setState。

**更严重的问题**：
- 第 232-234 行：鼠标移动时也会 `setState({ robotRotation })`，每一次 mousemove 事件都触发
- 这会导致整个订阅了 `robotRotation` 的组件都重新渲染
- `robotPosition` 同理

虽然位置有 0.000001 的阈值过滤，但旋转没有。鼠标稍微移动一下就触发 setState。

---

## 10. 碰撞检测在哪里发生

**答案**：在 `playerMovement.ts` 中，主要有两套碰撞：

### 房间墙体碰撞
- 函数：`resolveRoomCollision`（第 121-178 行）
- 原理：AABB 矩形碰撞，玩家是圆形（radius = 0.3），房间是矩形
- 策略：先检查目标位置是否在房间内；如果不在，尝试仅 x 方向滑动、仅 z 方向滑动；都不行就 clamp 到边界

### 家具碰撞
- 函数：`resolveFurnitureCollision`（第 313-355 行）
- 原理：圆-矩形碰撞，逐个家具检查
- 策略：发现碰撞后尝试单轴滑动

### 门洞通行
- 函数：`isInsideDoorway`（第 50-84 行）
- 原理：在墙的位置开一个"缺口"，玩家在缺口内不算出界
- 函数：`checkDoorwayTransition`（第 180-241 行）
- 原理：玩家越过墙体外侧一定距离后，触发房间切换

---

## 11. 为什么玩家会穿墙

**根因分析**：

### 原因 1：碰撞解析顺序问题
`FirstPersonControls.tsx` 第 310 行先做 `resolveRoomCollision`，然后第 318 行做 `resolveFurnitureCollision`。
但家具碰撞解析后**没有再次检查房间边界**。如果家具把玩家推出了房间边界，就会穿墙。

### 原因 2：移动步长与碰撞精度
- `resolveRoomCollision` 是"检查目标位置是否在房间内"的离散检测，不是连续碰撞
- 当帧率低或速度快时，单帧位移可能超过墙体厚度，直接穿墙
- 墙体厚度只有 0.1（`Room3D.tsx` 第 469 行 `t = 0.1`），玩家半径 0.3
- 碰撞检测用的是 AABB 矩形房间边界（`size.x/2` 和 `size.z/2`），即房间内部尺寸
- 视觉墙体在边界上（厚度 0.1，一半在室内一半在室外）

### 原因 3：房间切换时的位置跳跃
`checkDoorwayTransition` 触发后，玩家位置被直接设置到目标房间的 `targetPosition`（第 343 行）。
如果 targetPosition 计算有误，玩家可能直接出现在墙外。

### 原因 4：家具碰撞可能把人推到墙外
`resolveFurnitureCollision` 的 push-out 逻辑：
- 第 348-349 行：`result.x += collision.pushX; result.z += collision.pushZ`
- 如果家具靠近墙边，push-out 方向可能指向墙外
- 而家具碰撞后没有二次检查房间边界

### 原因 5：视觉墙和逻辑墙不一致
- 逻辑墙：`room.size.x / 2`（房间内部边界）
- 视觉墙：`Room3D.tsx` 第 474-477 行，墙体位置在边界上，厚度 0.1
- 玩家半径 0.3，碰撞边界 = 房间边界 - 0.3
- 玩家离墙还有 0.3 距离就会被挡住，而视觉上墙在 0 距离处
- 这个不一致本身不会导致穿墙，但会让玩家感觉"离墙很远就不能动了"

**核心根因**：碰撞是单步离散检测，且家具碰撞后不回查房间边界。

---

## 12. 物体 y 坐标如何计算

**答案**：通过 `game/placement.ts` 中的 `snapEntityToWorld` 函数计算（第 94-105 行）。

```ts
export function snapEntityToWorld(entity, task): Vec3 {
  if (entity.status === 'held' || entity.status === 'hidden') {
    return { ...entity.position }
  }
  const context = getEntityPlacementContext(entity, task)
  const y = getObjectGroundY(entity, context)
  return { x: entity.position.x, y, z: entity.position.z }
}
```

计算逻辑：
1. 放在容器上的物体：`y = containerSurfaceY + entitySize.y / 2 + 0.01`
2. 放在地上的物体：`y = 0 + entitySize.y / 2 + 0.01`

物体的 y 坐标代表**物体的中心点**。

---

## 13. 为什么物体会悬空

**根因分析**：

### 原因 1：size.y 不一定等于实际视觉高度
`getEntityVisualHeight` 直接返回 `entity.size.y`（`placement.ts` 第 11-13 行）。
但 `PropModel` 里的模型可能并不是按 size.y 等比缩放的：
- 如果模型 pivot 在中心，且模型本身有一定高度，size.y 就是总高度——没问题
- 但如果模型的几何中心不在高度中心，或者 scale 计算有问题，就会出现偏差

### 原因 2：容器 surfaceHeight 不一致
`getContainerSurfaceY` 逻辑：
```ts
if (container.surfaceHeight !== undefined) {
  return container.surfaceHeight
}
return container.position.y + container.size.y / 2
```

- 有的 container 定义了 `surfaceHeight`，有的没有
- 没定义的用 `position.y + size.y / 2`（假设 position.y 是底部中心，size.y 是总高度）
- 但家具模型不一定是"底部在 position.y"——FurnitureModel 的几何锚点可能不是底部

### 原因 3：FurnitureModel 几何的 pivot 不统一
不同家具模型（Fallback 模型）的几何锚点可能不一致：
- 有的模型是"中心在原点"
- 有的是"底部在原点"
- 导致 `position.y + size.y / 2` 的假设有时候不对

### 原因 4：任务数据里手调 y 坐标
从历史代码看，之前的修复方式是"在 task 文件里改 y 坐标"。
但 `snapEntityToWorld` 会覆盖 y 坐标（除非是 held/hidden 状态）。
手调 y 被 snap 覆盖了 → 看起来"修了也没效果"。

### 原因 5：GLB 模型与 fallback 模型高度不一致
PropModel 有 GLB 和 fallback 两套实现，两者的几何中心、缩放逻辑可能不同。
切换模型后高度就变了。

**核心根因**：没有统一的"模型高度"注册表，每个模型的实际视觉高度和 pivot 位置不明确，snap 计算依赖的 size.y 不可靠。

---

## 14. HUD 哪些面板是 fixed，哪些会重叠

**答案**：所有 HUD 面板都是 `absolute` 定位（相对于全屏容器），本质上等同于 fixed。

面板清单（来自 `HUD.tsx`）：

| 面板 | 位置 | 尺寸估计 | 状态 |
|------|------|----------|------|
| 任务面板 | top-4 left-4 | 320px 宽 | 默认展开，Tab 切换 |
| 混乱值面板 | top-4 水平居中 | 320px 宽 | 常驻 |
| 得分/评级面板 | top-4 right-4 | 200px 宽 | 常驻 |
| 操作提示 | bottom-4 left-4 | 约 280px 宽 | 常驻 |
| 小地图 | bottom-4 right-4 | 260x260px | 常驻 |
| 记忆槽 | bottom-4 水平居中 | 约 400px 宽 | 常驻 |
| 事件日志 | bottom-4 right-24 | 220px 宽 | 默认收起 |
| 反馈效果 | 全屏各处 | - | 动态 |

### 重叠问题：
1. **事件日志与小地图重叠**：事件日志在 `bottom-4 right-24`（第 466 行），小地图在 `bottom-4 right-4`（第 358 行），两者在右下角非常接近，事件日志展开时会挡小地图。

2. **重新开始按钮位置**：得分面板里有"重新开始"按钮，面板宽度 200px，不会直接挡小地图，但视觉上拥挤。

3. **1280px 以下宽度**：
   - 左：任务面板 320px + 操作提示 ~280px
   - 右：得分面板 200px + 小地图 260px + 事件日志 220px
   - 中间：混乱值 320px + 记忆槽 ~400px
   - 总宽度需求：320 + 400 + 260 + 24*4 边距 ≈ 1080px 水平方向还够
   - 但垂直方向：底部有操作提示、记忆槽、小地图、事件日志，高度可能不够

4. **H 键隐藏功能缺失**：用户提到的"按 H 隐藏全部辅助 UI"目前 H 键绑定的是帮助面板（第 125 行），不是隐藏 HUD。

---

## 15. 小地图为什么不能看全

**根因分析**：

### 原因 1：默认缩放适配逻辑
`Minimap.tsx` 第 72-80 行 `computeFitZoom`：
```ts
const scaleX = width / (rangeX * paddingFactor)
const scaleY = height / (rangeZ * paddingFactor)
return Math.min(scaleX, scaleY)
```

这个逻辑本身是正确的——按较小的比例缩放，确保全部可见。
但 `dimensions` 是 canvas 的物理像素尺寸（乘了 DPR），而 `bounds` 是世界坐标，比例计算后应该能显示全。

### 原因 2：followPlayer 模式下的视角
当 `followPlayer = true` 时，小地图以玩家为中心。
如果玩家在房间边缘，相邻房间可能只有一部分可见，或者完全在视野外。

### 原因 3：小地图尺寸有限
小地图只有 260x260px（第 294-295 行），要显示多个房间的话：
- 第一关 3 个房间（玄关 + 客厅 + 卧室）：横向约 6+6=12 单位，纵向约 6+4=10 单位
- 260px / 12 ≈ 22px/单位，每个房间 6 单位 = 132px，还行
- 但加上 padding 和 UI 元素，可能显得局促

### 原因 4：没有"查看全部房间"的视角
用户说"不能看全"更可能是指：
- 默认跟随玩家，看不到全局
- 虽然有拖动缩放功能，但用户可能不知道
- 或者 reset view 后也不是全局视角

实际上 `handleReset` 调用的是 `computeFitZoom()`，应该能看全。但初始状态是 `followPlayer = true`，所以打开时是跟随视角，不是全局视角。

### 核心根因
小地图默认 `followPlayer = true`，以玩家为中心，用户看不到全局。需要默认 fit-to-view 或者明确的"查看全部"按钮。

---

## 根因汇总

| 问题 | 根因 |
|------|------|
| 前后左右反复反向 | 缺少单一真值来源，移动/鼠标/相机/小地图分散在不同文件，改一处忘另一处 |
| 鼠标不能上下看 | pitch 功能完全缺失，只有 yaw |
| 玩家穿墙 | 离散碰撞检测 + 家具碰撞后不回查房间边界 + 房间切换位置跳跃 |
| 物体悬空 | 没有统一的模型高度注册表，size.y 不等于实际视觉高度，pivot 不统一 |
| HUD 重叠 | 右下角小地图和事件日志接近，缺少收起机制，无 compact 模式 |
| 小地图看不全 | 默认跟随玩家视角，初始不是全局视角 |

---

## 建议的修复方向

1. **建立 `playerControls.ts` 作为唯一的坐标系/移动计算来源**
2. **加入 pitch 支持，限制在 -60° ~ +60°**
3. **重构碰撞：连续碰撞 + 家具碰撞后回查房间边界**
4. **建立模型高度注册表 `modelHeights`，统一 snap 计算**
5. **HUD 面板全部支持收起，加入 compact 模式**
6. **小地图默认 fit-to-view，支持拖动/缩放/重置**
