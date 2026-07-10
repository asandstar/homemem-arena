# 房间切换和白色模型修复计划

## 问题诊断

### 问题 1：餐厅桌子和椅子仍然是白色

**根因**：`TableGeometry` 和 `ChairGeometry` 返回的是 `<group>` 包含多个 `<mesh>`，每个 mesh 只有 geometry 没有 material。在 Room3D.tsx 中的写法：

```jsx
<mesh position={[center.x, 0.45, center.z]} castShadow receiveShadow>
  <TableGeometry size={{...}} />
  <meshStandardMaterial color="#8b7355" />
</mesh>
```

这是错误的！`TableGeometry` 返回 `<group>`，放在 `<mesh>` 里，material 只会应用到外层 mesh（没有 geometry），内部 mesh 还是默认白色。

**修复方案**：用 `FallbackColorizer` 包裹这些 Geometry 组件。

### 问题 2：无法进入另一个房间

**根因**：第二关「餐桌混乱」的房间配置有误：
- `rooms: ['dining', 'kitchen']`
- dining 的门口连接到 kitchen ✓
- kitchen 的门口只连接到 living ✗（没有连接回 dining）

**结果**：从 dining 可以走到 kitchen，但从 kitchen 只能走到 living（第二关没有 living），而且从 kitchen 不能回到 dining。

**修复方案**：给 kitchen 添加一个连接到 dining 的门口。

### 问题 3：房间布局不一致

dining 和 kitchen 的中心坐标都是 `{ x: 0, y: 0, z: 0 }`，这意味着它们完全重叠！

**修复方案**：调整 dining 的中心坐标，让它和 kitchen 相邻。

---

## 修复计划

### 修复 1：Room3D.tsx 中 TableGeometry 和 ChairGeometry 用 FallbackColorizer 包裹

**文件**：`src/components/arena3d/Room3D.tsx`

**修改内容**：
- `renderDining()` 中的餐桌和椅子改为用 FallbackColorizer 包裹

### 修复 2：rooms.ts 中给 kitchen 添加连接到 dining 的门口

**文件**：`src/data/rooms.ts`

**修改内容**：
- kitchen 添加第二个 doorway，连接到 dining
- 调整 dining 的中心坐标，让它和 kitchen 相邻

### 修复 3：确保餐厅能看到门口提示

检查 dining 和 kitchen 的门口位置是否正确，确保玩家能看到门口。

---

## 验收标准

1. 餐厅桌子和椅子有颜色（木色）
2. 从餐厅能走到厨房
3. 从厨房能走回餐厅
4. npm run build 通过