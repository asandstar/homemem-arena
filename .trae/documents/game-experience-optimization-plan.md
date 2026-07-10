# 游戏体验优化计划

## 摘要

当前游戏体验有两个核心问题：
1. **鼠标控制需要拖动**——玩家必须按住鼠标左键拖动才能转视角，操作繁琐不符合FPS直觉
2. **游戏逻辑耦合严重**——FirstPersonControls.tsx 混合了输入/相机/移动/碰撞/房间切换等职责，代码难以维护

本计划将重构为**标准FPS Pointer Lock控制模式**，同时拆分职责、简化同步逻辑。

---

## 当前状态分析

### 问题1：鼠标拖动控制（FirstPersonControls.tsx 196-233行）

```
mousedown → isDragging=true → cursor='grabbing'
mousemove → 仅在isDragging时更新yaw/pitch
mouseup   → isDragging=false → cursor='grab'
```

**痛点**：
- 每次转视角都要按下去再拖动，频繁操作手指累
- 视角边缘无法继续转（鼠标移出canvas就停止）
- 没有FPS游戏的沉浸感

### 问题2：FirstPersonControls.tsx 职责混乱（405行）

当前包含：
| 代码块 | 职责 | 行数 |
|--------|------|------|
| useEffect + keydown/keyup | 键盘输入处理 | 85-192 |
| useEffect + mousedown/move/up | 鼠标输入处理 | 194-233 |
| useFrame前半段 | 相机位置/旋转平滑插值 | 235-293 |
| useFrame后半段 | 玩家移动 + 碰撞检测 + 房间切换 + doorway提示 | 295-401 |

**痛点**：
- 相机平滑逻辑与移动逻辑混在一起
- 视角同步用了3套变量（targetYawRef/lastSyncedYawRef/store.robotRotation）来回同步
- 碰撞检测、房间切换、提示全部塞在一个useFrame里

### 问题3：HUD交互提示与FirstPersonControls重复计算

- FirstPersonControls用 `findNearbyEntity()` 判断E键保存记忆
- HUD用 `findNearestInteractableEntity()` 显示交互提示
- ArenaPage用 `executePick()` 处理点击拾取
- 三个地方各自调用，逻辑分散

---

## 优化方案

### 改动1：鼠标控制改为Pointer Lock模式（核心）

**目标**：点击canvas后锁定鼠标，鼠标移动直接控制视角，无需按住拖动。

**具体实现**：

```typescript
// FirstPersonControls.tsx 鼠标事件部分重构

const isPointerLockedRef = useRef(false)

useEffect(() => {
  const canvas = gl.domElement

  // 点击canvas请求pointer lock
  const handleClick = () => {
    if (phase !== 'playing') return
    if (document.pointerLockElement !== canvas) {
      canvas.requestPointerLock()
    }
  }

  // pointer lock状态下，鼠标移动直接控制视角
  const handleMouseMove = (e: MouseEvent) => {
    if (document.pointerLockElement !== canvas) return
    targetYawRef.current -= e.movementX * MOUSE_SENSITIVITY
    targetPitchRef.current = clampPitch(targetPitchRef.current - e.movementY * MOUSE_SENSITIVITY)
  }

  // pointer lock状态变化监听
  const handleLockChange = () => {
    isPointerLockedRef.current = document.pointerLockElement === canvas
  }

  canvas.addEventListener('click', handleClick)
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('pointerlockchange', handleLockChange)

  return () => {
    canvas.removeEventListener('click', handleClick)
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('pointerlockchange', handleLockChange)
  }
}, [gl, phase])
```

**修改文件**：`src/components/arena3d/FirstPersonControls.tsx`
**涉及行数**：替换196-233行的鼠标事件逻辑

**HUD提示更新**：
 briefing里的操作提示从"拖动鼠标 转视角"改为"移动鼠标 转视角"

---

### 改动2：简化视角同步逻辑

**当前问题**：
- `targetYawRef`：当前帧目标视角
- `lastSyncedYawRef`：上一次同步到store的视角
- `store.robotRotation`：store里的视角
- 每帧比较3个值来决定是否同步

**优化后**：
- 以 `targetYawRef` / `targetPitchRef` 为唯一真值来源
- 每帧直接写入store，无需比较
- 从store读取只在初始化时做一次

```typescript
// 移除 lastSyncedYawRef / lastSyncedPitchRef
// 移除 ROTATION_SYNC_THRESHOLD 比较逻辑
// useFrame中直接：
useGameStore.setState({
  robotRotation: targetYawRef.current,
  cameraPitch: targetPitchRef.current,
})
```

**修改文件**：`src/components/arena3d/FirstPersonControls.tsx`
**涉及行数**：删除38行定义，简化235-293行同步逻辑

---

### 改动3：提取PlayerMovement到独立hook

**目标**：将FirstPersonControls中的移动/碰撞/房间切换逻辑提取出来，让FirstPersonControls只负责输入和相机。

**新建文件**：`src/components/arena3d/usePlayerMovement.ts`

```typescript
export function usePlayerMovement(
  moveState: React.MutableRefObject<MoveInput>,
  targetYawRef: React.MutableRefObject<number>
) {
  const lastPosRef = useRef({ x: 0, z: 0 })
  const doorCooldownRef = useRef(0)
  const lastHintRef = useRef<string | null>(null)

  useFrame((_, delta) => {
    const state = useGameStore.getState()
    if (state.phase !== 'playing') return

    // 1. 计算移动向量
    const speed = state.viewMode === 'top-down' ? TOP_DOWN_SPEED : PLAYER_SPEED
    const move = computeMovementVector(moveState.current, targetYawRef.current, speed, delta)

    if (move.dx === 0 && move.dz === 0) return

    // 2. 房间碰撞 + 家具碰撞
    const resolved = resolveMovement(state, move)

    // 3. 应用位置
    if (resolved.moved) {
      useGameStore.setState({ robotPosition: resolved.position })
      lastPosRef.current = { x: resolved.position.x, z: resolved.position.z }
    }

    // 4. 房间切换检测
    checkAndExecuteRoomTransition(state, doorCooldownRef, lastPosRef, lastHintRef)
  })
}
```

**修改文件**：
- **新建** `src/components/arena3d/usePlayerMovement.ts`
- **修改** `src/components/arena3d/FirstPersonControls.tsx` — 删除移动/碰撞/房间切换逻辑，调用usePlayerMovement

---

### 改动4：统一交互目标查找（可选优化）

**当前问题**：HUD和FirstPersonControls各自调用findNearestInteractableEntity

**优化方案**：在useGameStore中缓存当前帧的"附近可交互目标"，避免重复计算。

由于这个改动涉及store结构变更，影响面较大，建议作为Phase 2处理。本次计划不执行。

---

## 修改文件清单

| 文件 | 修改类型 | 说明 |
|------|----------|------|
| `src/components/arena3d/FirstPersonControls.tsx` | 大幅重构 | 改为pointer lock + 简化同步 + 提取移动逻辑 |
| `src/components/arena3d/usePlayerMovement.ts` | 新建 | 玩家移动/碰撞/房间切换逻辑 |
| `src/pages/ArenaPage.tsx` | 小幅修改 | briefing操作提示文字 |

---

## 验证步骤

1. `npm run build` — TypeScript编译通过
2. `npm run test` — 现有测试通过
3. `npm run dev` — 手动验证：
   - 点击canvas后鼠标消失，移动鼠标可转视角
   - WASD移动正常
   - 按Esc鼠标恢复，可点击UI
   - 再次点击canvas重新锁定
   - 碰撞/房间切换正常

---

## 假设与决策

1. **Pointer Lock兼容性**：假设目标浏览器支持Pointer Lock API（现代浏览器均支持）
2. **不改动 top-down 模式**：top-down模式下不启用pointer lock，保留现有逻辑
3. **不提取键盘输入**：键盘事件处理仍保留在FirstPersonControls中（与pointer lock耦合）
4. **不做大范围store重构**：本次只聚焦输入体验优化，store拆分作为后续计划
