# 门渲染问题修复计划

## 问题概述

用户反馈三个门相关问题：
1. **门重复渲染**：每个门洞出现两个门，形成异常视觉效果
2. **门框位置不对**：门看起来从中间打开，铰链位置错误
3. **开门方向**：开新门时门应转向 connectsTo（新房间）方向

## 根因分析

### 根因 1：棕色装饰薄板未去重（重复渲染）

[Room3D.tsx](file:///Users/azq/asandstar/homemem-arena-web-demo/src/components/arena3d/Room3D.tsx) 有两套"门"渲染：

- **Door3D 组件**（第 609-619 行）：已通过 `spec.id < door.connectsTo` 去重，每个共享门洞只渲染一次（共 5 次）。✓
- **墙体循环内的 `isDoor: true` 棕色薄板**（第 515-520 行 X 墙、第 551-556 行 Z 墙）：遍历 `spec.doorways` 时对**每个 doorway 都 push**，**没有去重**。每个共享门洞被两个相邻房间各渲染一次（共 10 次），形成两片平行薄板。

例如 living-entrance 门洞：
- entrance 渲染薄板在 z=3.1（sign=+1）
- living 渲染薄板在 z=2.9（sign=-1）
- 两片薄板相距 0.2（= 2 × 墙厚 t=0.1），视觉上像"两个门"

### 根因 2：铰链落在门板正中间（门从中间打开）

[Door3D.tsx](file:///Users/azq/asandstar/homemem-arena-web-demo/src/components/arena3d/Door3D.tsx#L125-L131) 几何计算：

```
铰链 group local position = [hingeX, 0, 0] = [halfD, 0, 0] = [0.72, 0, 0]  // 门洞右边缘
门板 mesh local position  = [-halfW + hingeX, 0, 0] = [-0.72 + 0.72, 0, 0] = [0, 0, 0]  // ← BUG
门板 boxGeometry          = [doorWidth, doorHeight, doorThickness] = [1.44, H, 0.06]
```

铰链 group 的原点 = 旋转中心。门板 mesh position = `[0,0,0]` 意味着门板几何中心在旋转中心。因此门板顶点相对旋转中心 `x ∈ [-0.72, +0.72]`，**铰链在门板正中间**，门从中间向两侧打开。

正确应为：铰链在门板一端，门板从铰链向另一侧延伸覆盖门洞。

### 根因 3：开门方向（逻辑正确，被根因 2 掩盖）

`swing = isPositiveSide ? 1 : -1` 的方向逻辑经数学验证是正确的：

| 场景 | isPositiveSide | swing | 门板远端世界坐标 | connectsTo 方向 | 正确？ |
|------|----------------|-------|------------------|-----------------|--------|
| X 墙东（bedroom→living） | true | +1 | +X（东） | living 在东 | ✓ |
| X 墙西（living→bedroom） | false | -1 | -X（西） | bedroom 在西 | ✓ |
| Z 墙南（living→entrance） | true | +1 | +Z（南） | entrance 在南 | ✓ |
| Z 墙北（entrance→living） | false | -1 | -Z（北） | living 在北 | ✓ |

但因铰链在门板中间，门板向两侧对称打开，方向感丢失。修复根因 2 后方向自动正确。

## 修改方案

### 修改 1：Door3D.tsx — 修复铰链位置

**文件**：`src/components/arena3d/Door3D.tsx`

**改动**：门板 mesh position 从 `[-halfW + hingeX, 0, 0]` 改为 `[-halfW, 0, 0]`，使门板几何中心在铰链 local `(-halfW, 0, 0)`，门板顶点相对旋转中心 `x ∈ [-1.44, 0]`，铰链在门板右端（`x=0`）。门板从铰链向 -X 延伸覆盖整个门洞。

**门把手 position** 同步调整：从 `[-halfW + hingeX * 2 + 0.1, 0, ...]` 改为 `[-doorWidth + 0.15, 0, doorThickness / 2 + 0.01]`，让把手位于门板远离铰链的一端（铰链 local `x ≈ -1.29`）。

**具体代码**（第 125-134 行）：

修改前：
```tsx
<group ref={doorGroupRef} position={[hingeX, 0, 0]}>
  <mesh position={[-halfW + hingeX, 0, 0]} castShadow receiveShadow>
    <boxGeometry args={[doorWidth, doorHeight, doorThickness]} />
    <meshStandardMaterial color="#8b5a2b" roughness={0.6} metalness={0.1} />
  </mesh>
  {/* 门把手 */}
  <mesh position={[-halfW + hingeX * 2 + 0.1, 0, doorThickness / 2 + 0.01]}>
    <sphereGeometry args={[0.04, 8, 8]} />
    <meshStandardMaterial color="#d4a574" metalness={0.8} roughness={0.3} />
  </mesh>
</group>
```

修改后：
```tsx
<group ref={doorGroupRef} position={[hingeX, 0, 0]}>
  <mesh position={[-halfW, 0, 0]} castShadow receiveShadow>
    <boxGeometry args={[doorWidth, doorHeight, doorThickness]} />
    <meshStandardMaterial color="#8b5a2b" roughness={0.6} metalness={0.1} />
  </mesh>
  {/* 门把手 - 位于门板远离铰链的一端 */}
  <mesh position={[-doorWidth + 0.15, 0, doorThickness / 2 + 0.01]}>
    <sphereGeometry args={[0.04, 8, 8]} />
    <meshStandardMaterial color="#d4a574" metalness={0.8} roughness={0.3} />
  </mesh>
</group>
```

### 修改 2：Room3D.tsx — 移除重复的 isDoor 棕色薄板

**文件**：`src/components/arena3d/Room3D.tsx`

**改动**：移除墙体循环中 `isDoor: true` 的棕色薄板 push（X 墙第 515-520 行、Z 墙第 551-556 行）。这些薄板与 Door3D 的绿色门框功能重复，且未去重导致每个门洞渲染两次。

保留门洞上方墙体（第 490-495 行、第 526-531 行）和门洞两侧墙体（第 497-513 行、第 533-549 行），这些是墙体本身，不重复。

**具体代码**：

X 墙分支（第 515-520 行），删除：
```tsx
wallList.push({
  position: [x + sign * t, hh / 2, center.z + dz],
  size: [0.05, hh + 0.05, ww],
  color: '#8b5a2b',
  isDoor: true,
})
```

Z 墙分支（第 551-556 行），删除：
```tsx
wallList.push({
  position: [center.x + dx, hh / 2, z + sign * t],
  size: [ww, hh + 0.05, 0.05],
  color: '#8b5a2b',
  isDoor: true,
})
```

同时可移除 `WallMesh` 类型中的 `isDoor` 字段（第 471 行）和相关引用，保持类型整洁。由于 `isDoor` 在渲染时未被使用（第 577-591 行的 wall.map 只用 position/size/color），可直接删除该字段。

## 验证步骤

1. **构建检查**：`npm run build`
2. **测试检查**：`npx vitest run`（确认 287 测试仍通过）
3. **浏览器验证**（5 个门洞）：
   - living ↔ bedroom 门（位置 x=-3, z=0）：门板从右侧铰链向左覆盖，靠近时向 living（东）打开
   - living ↔ kitchen 门（位置 x=3, z=0）：靠近时向 kitchen（东）打开
   - living ↔ entrance 门（位置 x=0, z=3）：靠近时向 entrance（南）打开
   - kitchen ↔ dining 门（位置 x=9, z=0）：靠近时向 dining（东）打开
   - dining ↔ laundry 门（位置 x=15, z=0）：靠近时向 laundry（东）打开
4. **确认无重复**：每个门洞只有 1 个绿色门框 + 1 扇门板，不再有棕色薄板重叠

## 假设与决策

- **假设**：Door3D 的绿色门框（左右上三块）足以标识门洞轮廓，移除棕色薄板后视觉上不会"空洞"
- **决策**：不修改 `swing` 逻辑（已正确），只修复铰链位置
- **决策**：不修改墙体门洞上方/两侧的墙体（这些是必要的墙体，不重复）
- **风险**：移除 isDoor 薄板后，若门板处于关闭状态，门洞轮廓由绿色门框勾勒，需视觉确认效果可接受
