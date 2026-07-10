# 第三关"早餐时间循环"模型摆放修复计划

## 摘要

第三关截图显示严重问题：
1. **白模型**：碗/杯子看起来是 fallback 几何体（白色椭圆+圆柱）
2. **悬空**：碗悬在桌面之上
3. **角度错误**：场景视角混乱，椅子挤在一起
4. **桌面与吊灯错位**：吊灯悬在桌面上方
5. **洗碗机穿透**：洗碗机在桌面边缘内部

本计划将**系统性重写模型/容器的尺寸定义规范**，让所有物体自然贴合到容器表面上。

---

## 当前状态分析

### 问题1：模型size与MODEL_HEIGHTS不一致

[breakfast.ts](file:///Users/azq/asandstar/homemem-arena-web-demo/src/data/tasks/breakfast.ts) 中物体定义：

| 物体 | objSpec.size | MODEL_HEIGHTS | 问题 |
|------|--------------|---------------|------|
| obj-milk | 0.12×0.25×0.1 | milk_carton: 0.2 | ✅ 基本一致 |
| obj-cereal | 0.2×0.3×0.1 | cereal_box: 0.25 | ✅ 基本一致 |
| obj-cup | 0.1×0.12×0.1 | cup: 0.12 | ✅ 一致 |
| obj-bowl | 0.15×**0.08**×0.15 | bowl: 0.08 | ✅ 一致 |
| obj-spoon | 0.18×**0.02**×0.04 | spoon: 0.02 | ✅ 一致 |

实际看截图，**cup 看起来太大，bowl 太白**——说明 GLB 模型的size可能与objSpec定义不匹配。

### 问题2：scaling 计算逻辑反了

[PropModel.tsx 36-41行](file:///Users/azq/asandstar/homemem-arena-web-demo/src/components/arena3d/models/PropModel.tsx#L36-L41)：

```typescript
const modelScale = useMemo(() => {
  if (!size) return 1
  const baseSize = 0.5
  const maxDim = Math.max(size.x, size.y, size.z)
  return maxDim / baseSize
}, [size])
```

**问题**：
- 假设 GLB 模型的"基础大小"是 0.5m
- 但实际下载的 GLB 模型可能单位不一致（有些用米，有些用厘米，有些用英寸）
- poly.pizza 的模型可能是 Blender 默认单位（1 单位=1m 或 0.01m）
- 缩放系数 = `objSpec.size.maxDim / 0.5`——如果模型本身是 1m，缩放后变成 2×size

### 问题3：obj-cup / obj-bowl 出现 fallback 几何体

看 [ModelRegistry.ts](file:///Users/azq/asandstar/homemem-arena-web-demo/src/components/arena3d/models/ModelRegistry.ts)：

```typescript
cup: {
  path: '/assets/models/props/cup.glb',
  fallback: CupFallback,
},
```

`assetAvailable` 字段已被移除——说明应该会加载 GLB。但**如果 GLB 文件下载失败、URL 路径错误或 GLB 单位异常**，会回退到 CupFallback（白色椭圆+绿色圆柱）。

### 问题4：悬空——surfaceHeight 逻辑不统一

在 [breakfast.ts 185-186行](file:///Users/azq/asandstar/homemem-arena-web-demo/src/data/tasks/breakfast.ts#L185-L186)：

```typescript
position: { x: 0, y: 0.45, z: 0 },
size: { x: 1.8, y: 0.9, z: 0.9 },
```

`getContainerSurfaceY` 计算：
- container.position.y = 0.45
- modelHeight = 0.9 (dining_table)
- surfaceY = 0.45 + 0.9/2 = **0.9** ✅

如果 PropModel 缩放后实际渲染的模型高度是 1.8m（因为GLB单位是cm），那 surfaceY 计算就正确，但视觉上物体一半埋在桌面里、一半露出来——看起来还是悬空。

---

## 优化方案

### 改动1：修正模型缩放基准（PropModel.tsx）

**问题**：下载的 GLB 模型（来自 poly.pizza / kenney）单位不统一。

**方案**：**为每个模型定义显式的 `displayScale`**，覆盖全局的 `maxDim/0.5` 公式。

修改 [ModelRegistry.ts](file:///Users/azq/asandstar/homemem-arena-web-demo/src/components/arena3d/models/ModelRegistry.ts)：

```typescript
export interface ModelConfig {
  path: string
  fallback: FallbackComponent
  displayScale?: number  // 显式缩放，覆盖 size 推断
  pivotOffsetY?: number  // 模型局部坐标系到地面的偏移
}

cup: {
  path: '/assets/models/props/cup.glb',
  fallback: CupFallback,
  displayScale: 0.15,  // poly.pizza 杯子原始大小约 0.15m
  pivotOffsetY: 0,
},
bowl: {
  path: '/assets/models/props/bowl.glb',
  fallback: BowlFallback,
  displayScale: 0.15,
  pivotOffsetY: 0,
},
plate: {
  path: '/assets/models/props/plate.glb',
  fallback: PlateFallback,
  displayScale: 0.20,
  pivotOffsetY: 0,
},
milk_carton: {
  path: '...',
  displayScale: 0.12,
  pivotOffsetY: 0,
},
cereal_box: {
  displayScale: 0.20,
  pivotOffsetY: 0,
},
```

修改 [PropModel.tsx](file:///Users/azq/asandstar/homemem-arena-web-demo/src/components/arena3d/models/PropModel.tsx#L36-L41)：

```typescript
const modelScale = useMemo(() => {
  if (config?.displayScale) return config.displayScale
  if (!size) return 1
  const baseSize = 0.5
  const maxDim = Math.max(size.x, size.y, size.z)
  return maxDim / baseSize
}, [size, config])
```

**好处**：
- 不用测量 GLB 模型的真实尺寸
- 可以快速调整单个模型的大小
- 不会因模型单位混乱导致悬空

### 改动2：添加模型Pivot原点对齐

**问题**：Kenney/Poly Pizza 的 GLB 模型原点不一定在底部中心。

**方案**：在 ModelRegistry 中添加 `pivotOffsetY` 字段。

修改 [ModelAsset.tsx](file:///Users/azq/asandstar/homemem-arena-web-demo/src/components/arena3d/models/ModelAsset.tsx)：

```typescript
<primitive
  object={scene.clone(true)}
  scale={[modelScale, modelScale, modelScale]}
  position={[0, -(config?.pivotOffsetY ?? 0) * modelScale, 0]}
/>
```

但这需要先用 Blender 把模型 pivot 移到地面。这里先用 `pivotOffsetY: 0` 占位。

### 改动3：重新定义餐桌容器的"桌面 Y 坐标"

**问题**：餐桌 `position.y=0.45, size.y=0.9` 计算出的 surfaceY=0.9，**但 PropModel 渲染的桌子实际高度可能不是 0.9m**（因为餐桌模型本身可能有误差）。

**方案**：用 `surfaceHeight` 显式指定：

修改 [breakfast.ts 181-192行](file:///Users/azq/asandstar/homemem-arena-web-demo/src/data/tasks/breakfast.ts#L181-L192)：

```typescript
{
  id: 'cnt-dining-table',
  name: '餐桌',
  room: 'dining',
  position: { x: 0, y: 0, z: 0 },        // 桌子底部 y=0
  size: { x: 1.8, y: 0.9, z: 0.9 },
  surfaceHeight: 0.9,                    // 显式指定桌面高度
  color: '#92400e',
  initialOpen: true,
  acceptedCategories: ['milk', 'cereal', 'cup', 'bowl', 'spoon'],
  isTargetZone: true,
  targetLabel: '餐桌（早餐准备区）',
},
```

修改 [placement.ts 99-106行](file:///Users/azq/asandstar/homemem-arena-web-demo/src/game/placement.ts#L99-L106)：

确保 `getContainerSurfaceY` 优先使用 `surfaceHeight`：

```typescript
export function getContainerSurfaceY(container: ContainerSpec): number {
  if (container.surfaceHeight !== undefined) {
    return container.surfaceHeight  // ✅ 优先级最高
  }
  // 否则用模型高度推断
  const modelId = getContainerModelId(container)
  const modelHeight = CONTAINER_MODEL_HEIGHTS[modelId] ?? container.size.y
  return container.position.y + modelHeight / 2
}
```

这个逻辑已经存在了，所以**问题不在这里**。问题在于：

**当 placement.ts 用模型推断表面Y时，模型的视觉高度与 CONTAINER_MODEL_HEIGHTS 不匹配**。

### 改动4：修正 dinner_table 视觉高度

**问题**：`CONTAINER_MODEL_HEIGHTS.dining_table = 0.9`，但 Room3D 中渲染的餐桌模型实际视觉高度可能不是 0.9m（因为缩放系数 + GLB 原生尺寸导致的误差）。

**方案**：直接用 `surfaceHeight` 字段明确指定，不再依赖模型高度推断。

修改 [clean-table.ts](file:///Users/azq/asandstar/homemem-arena-web-demo/src/data/tasks/clean-table.ts) 和 [breakfast.ts](file:///Users/azq/asandstar/homemem-arena-web-demo/src/data/tasks/breakfast.ts)：

```typescript
{
  id: 'cnt-dining-table',
  surfaceHeight: 0.9,  // 显式指定，placement.ts 优先使用
  // 移除 size.y 推断的依赖
}
```

**等等——已经这么写了**。所以悬空问题不是 placement 引起的，而是**视觉上的桌子模型本身就有误差**。

### 改动5：检查 Room3D 中餐桌模型实际渲染高度

[Room3D.tsx 376-380行](file:///Users/azq/asandstar/homemem-arena-web-demo/src/components/arena3d/Room3D.tsx#L376-L380) 渲染餐桌：

```tsx
<FallbackColorizer modelId="dining_table" color="#8b7355">
  <group position={[center.x, 0.45, center.z]} castShadow receiveShadow>
    <TableGeometry size={{ x: 1.8, y: 0.9, z: 0.9 }} />
  </group>
</FallbackColorizer>
```

但 ModelRegistry 中**没有 `dining_table` 字段**！它只有 `cabinet`, `fridge`, `coffee_table` 等。

所以 `<FallbackColorizer modelId="dining_table">` 会拿到 `undefined` config，**不会给 `cabinet` 等fallback**——它走的可能是**没有 `config` 时的通用 fallback 路径**。

让我搜一下 Room3D 的 TableGeometry 实现：

---

## 真实根因（核心发现）

### 根因1：Room3D 中渲染的是 **TableGeometry**（程序化几何体），不是 GLB 模型

[Room3D.tsx](file:///Users/azq/asandstar/homemem-arena-web-demo/src/components/arena3d/Room3D.tsx#L20) 用了 `TableGeometry`、`ChairGeometry` 等**程序化几何体**——它们是手写的 mesh 代码，**完全没有用 ModelAsset 加载 GLB**。

所以餐桌/椅子/橱柜等**根本就没有 GLB 模型被加载**——它们都是程序化生成的。

### 根因2：MODEL_HEIGHTS 中 dining_table=0.75，但 CONTAINER_MODEL_HEIGHTS 中 dining_table=0.9

[placement.ts 38行 vs 76行](file:///Users/azq/asandstar/homemem-arena-web-demo/src/game/placement.ts#L38)：

```typescript
// MODEL_HEIGHTS
dining_table: 0.75,

// CONTAINER_MODEL_HEIGHTS
dining_table: 0.9,
```

**两个表里的 dining_table 高度不一致**！导致：
- 物体放在桌面上时，placement 用 CONTAINER_MODEL_HEIGHTS 计算 → surfaceY = 0.45 + 0.9/2 = 0.9
- 物体作为实体渲染时，size.y 用 0.75 / 2 = 0.375 halfHeight
- 实际模型高度是 size.y = 0.75（不是 0.9）
- 结果：物体的中心应该在 0.9 + 0.375 = 1.275，但视觉上桌子只有 0.75 高
- 物体视觉上**漂浮在桌面上方约 0.15m**

### 根因3：第三关"白模型"——是程序化 fallback 的渲染效果

截图里：
- 白色椭圆（碗）：是 `BowlFallback` 的 cylinderGeometry，颜色是 `FALLBACK_COLORS.bowl.primary` = '#9ca3af' (灰色)
- 但**没有应用颜色覆盖**（因为 PropModel 传了 entity.color，可能没生效）

看 [Object3D.tsx 64行](file:///Users/azq/asandstar/homemem-arena-web-demo/src/components/arena3d/Object3D.tsx#L64)：

```typescript
const baseColor = entity['color'] || '#f87171'
```

**注意**：这里用 `entity['color']`（带引号），但 entity 类型可能没有 `color` 字段！如果 entity 是 `EntityState`，它确实没有 `color`，所以这里**永远是 `#f87171'**（红橙色）。

这就是为什么**所有物体在屏幕上都是同一种颜色**——`baseColor` 永远是 `#f87171`。

但是看 PropModel，它接收了 `color={displayColor}`，displayColor 在 `isDirty` 时是灰色，否则是 `baseColor`。所以：

- obj-cup（蓝色 #60a5fa）→ 实际显示 `#f87171'（错）
- obj-bowl（黄色 #fbbf24）→ 实际显示 `#f87171'（错）

但截图里**没看到红色物体**——只看到白色。

可能原因：
- PropModel 没有把 `color` 传递给 ModelContent
- ModelContent 没有把 color 用上

看 [ModelAsset.tsx ModelContent](file:///Users/azq/asandstar/homemem-arena-web-demo/src/components/arena3d/models/ModelAsset.tsx#L191)：

```tsx
function ModelContent({ modelId, color, hovered, ... })
```

但**它从未使用 `color` 参数**！只在 `config?.path` 加载 GLB。**如果 GLB 加载失败或失败回退到 fallback 时，color 也没有传给 FallbackColorizer**。

这导致了：
1. GLB 文件可能下载失败（比如 poly.pizza 假地址）
2. 回退到 `BowlFallback` / `CupFallback`
3. FallbackColorizer 用默认的 `FALLBACK_COLORS[modelId]`
4. 显示成白色/灰色

**这就是白模型的真凶！**

---

## 修复方案

### 修复1：统一 MODEL_HEIGHTS 和 CONTAINER_MODEL_HEIGHTS 中的 dining_table

[placement.ts](file:///Users/azq/asandstar/homemem-arena-web-demo/src/game/placement.ts)：

```typescript
export const MODEL_HEIGHTS: Record<string, number> = {
  // ...
  dining_table: 0.9,  // 改 0.75 → 0.9
  // ...
}
```

### 修复2：让 ModelContent 使用 color 参数传递给 GLB 和 Fallback

[ModelAsset.tsx](file:///Users/azq/asandstar/homemem-arena-web-demo/src/components/arena3d/models/ModelAsset.tsx)：

```tsx
function ModelContent({ modelId, color, hovered, ... }) {
  // 1. 修改 GLB 材质 color
  clonedScene.traverse((child) => {
    if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
      if (color) {
        child.material.color.set(color)
      }
    }
  })

  // 2. 修复 fallback 颜色：把 color 传下去
  // ModelErrorBoundary 渲染 fallback 时也要传 color
}
```

### 修复3：检查 GLB 文件实际下载情况

让我看一下下载的 GLB 文件大小。如果文件都很小（几KB），说明下载失败。

### 修复4：让 Room3D 中的家具也用 ModelAsset（可选）

把 `TableGeometry`、`ChairGeometry` 改为 `<ModelAsset modelId="dining_table" />`。

但这会改变视觉风格——`TableGeometry` 之前是手写的有"腿"的桌子，GLB 模型可能更简单。

**建议**：保留 `TableGeometry`，但**修正 position.y 让视觉桌面与 surfaceHeight 对齐**。

看 [Room3D.tsx 376-380](file:///Users/azq/asandstar/homemem-arena-web-demo/src/components/arena3d/Room3D.tsx#L376-L380)：

```tsx
<group position={[center.x, 0.45, center.z]}>
  <TableGeometry size={{ x: 1.8, y: 0.9, z: 0.9 }} />
</group>
```

`TableGeometry` 是手写的桌子模型，**以中心为原点**（y=0 是桌子中心）。所以桌面顶部 = 0.45 + 0.45 = 0.9 ✅

但这意味着**桌子中心 = 0.45，桌面在 0.9**。如果改 `size.y=0.75`（MODEL_HEIGHTS 里的值）：
- 桌子中心 = 0.45/2 = 0.225
- 桌面顶部 = 0.225 + 0.75/2 = 0.6 ❌

所以**保持 size.y=0.9 与 CONTAINER_MODEL_HEIGHTS 一致**。

### 修复5：重写 `entity['color']` 访问

[Object3D.tsx 64](file:///Users/azq/asandstar/homemem-arena-web-demo/src/components/arena3d/Object3D.tsx#L64)：

```typescript
const baseColor = entity['color'] || '#f87171'
//                ^^^^^^^^^^^^^^^^
//   这个属性在 EntityState 中不存在！
```

应该改为：

```typescript
const baseColor = (entity as any).color || '#f87171'
```

或者在 EntityState 类型中加 `color?: string` 字段。

---

## 修改文件清单

| 文件 | 修改类型 | 关键改动 |
|------|----------|----------|
| [placement.ts](file:///Users/azq/asandstar/homemem-arena-web-demo/src/game/placement.ts) | 1行修改 | `dining_table: 0.75` → `dining_table: 0.9` |
| [ModelAsset.tsx](file:///Users/azq/asandstar/homemem-arena-web-demo/src/components/arena3d/models/ModelAsset.tsx) | 逻辑修复 | 把 `color` 传给 GLB 材质和 fallback |
| [Object3D.tsx](file:///Users/azq/asandstar/homemem-arena-web-demo/src/components/arena3d/Object3D.tsx) | 1行修复 | 修正 `entity['color']` 访问 |
| [Room3D.tsx](file:///Users/azq/asandstar/homemem-arena-web-demo/src/components/arena3d/Room3D.tsx) | 0行 | 保持 TableGeometry size.y=0.9 |

---

## 详细描述模型/容器的方案

回答你的问题——**如何详细描述模型摆放**：

### 模型描述应包含：

```typescript
{
  id: 'obj-cup',                      // 唯一ID
  name: '杯子',                       // 显示名
  category: 'cup',                    // 类别（用于模型查询）
  initialRoom: 'dining',              // 初始房间
  initialPosition: { x: 0.5, z: 0.3 },// 在房间内的相对坐标
  size: { x: 0.1, y: 0.12, z: 0.1 },  // 物理尺寸（米）
  color: '#60a5fa',                   // 主色（用于 fallback）
  surfaceContainerId: 'cnt-table',    // 可选：初始放在哪个容器上
  stateProperties: {                  // 状态属性
    cleanliness: 'clean',
    status: 'on-table'
  }
}
```

### 容器描述应包含：

```typescript
{
  id: 'cnt-dining-table',
  name: '餐桌',
  room: 'dining',
  position: { x: 0, y: 0.45, z: 0 },  // 容器中心点（米）
  size: { x: 1.8, y: 0.9, z: 0.9 },   // 容器尺寸（米）
  surfaceHeight: 0.9,                 // 物体落下时的 Y 坐标
  color: '#92400e',                   // 主色
  initialOpen: true,                  // 是否打开
  acceptedCategories: ['cup'],        // 接受哪些类别
  containsObjectIds: [],              // 初始包含哪些物体
  isTargetZone: true,                 // 是否是目标区
  targetLabel: '餐桌'                 // 目标区标签
}
```

### 关键原则：

1. **size.y 就是模型高度**（中心点到顶部/底部）
2. **surfaceHeight 决定物体放下的位置**
3. **三者必须一致**：MODEL_HEIGHTS[modelId] === container.size.y === entity.size.y
4. **color** 必须被模型渲染管线真正使用（目前有bug）

---

## 验证步骤

1. 检查下载的 GLB 文件大小（如果 < 1KB，说明下载失败）
2. `npm run build` 通过
3. `npm run dev`，进入第三关"早餐时间循环"
4. 检查：
   - 餐桌上的碗/杯子不再是白色
   - 物体都贴在桌面上，不再悬空
   - 颜色与 entity.color 一致

---

## 假设与决策

1. **GLB 文件可能下载失败**：需要先验证文件大小
2. **保持 TableGeometry 手写模型**：与 GLB 视觉差异大，但稳定
3. **修复 color 传递**：作为最高优先级
4. **MODEL_HEIGHTS 修正**：修正到 0.9 与 CONTAINER_MODEL_HEIGHTS 一致