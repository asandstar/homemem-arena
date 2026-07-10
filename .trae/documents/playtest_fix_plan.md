# Echo House: Memory Butler - Playtest Bug Fix Plan

**日期**: 2026-07-09  
**版本**: P0 体验修复后 Playtest  
**状态**: Plan Mode

---

## 问题分析

基于用户报告和代码审查，发现以下问题：

### 1. WASD 方向错误（P0 - 严重）
**根因**: `FirstPersonControls.tsx` 中 forward 向量计算错误

```typescript
// 当前代码（错误）
_forward.set(Math.sin(robotRotation), 0, Math.cos(robotRotation))
// rotation=0 时: forward=(0,0,1) → 向后！

// 应该是
_forward.set(Math.sin(robotRotation), 0, -Math.cos(robotRotation))
// rotation=0 时: forward=(0,0,-1) → 向前！
```

### 2. 鼠标视角变化奇怪（P0 - 严重）
**根因**: 鼠标移动事件中的旋转方向与 camera 旋转方向不一致

### 3. 小地图看不到当前房间（P0 - 严重）
**根因**: Minimap 渲染逻辑可能存在坐标转换问题，或者当前房间高亮不明显

### 4. UI 重叠问题（P1 - 中等）
**根因**: 事件日志面板位于右上角，展开后可能遮挡其他 UI

### 5. 任务描述中的括号补充说明奇怪（P1 - 中等）
**根因**: 任务目标描述包含不必要的括号补充，如"（不是干净杯子）""（保持自由状态）"等

### 6. 桌子和组件漂浮感（P1 - 中等）
**根因**: Room3D.tsx 中桌子和椅子的位置计算可能与实际房间尺寸不匹配

---

## 修复方案

### 修改文件列表

| 文件 | 修改类型 | 优先级 |
|------|----------|--------|
| `src/components/arena3d/FirstPersonControls.tsx` | 修复移动方向和鼠标视角 | P0 |
| `src/components/arena3d/Minimap.tsx` | 修复小地图房间显示 | P0 |
| `src/components/arena3d/HUD.tsx` | 修复UI重叠 | P1 |
| `src/data/tasks/clean-table.ts` | 移除任务描述中的括号补充说明 | P1 |
| `src/components/arena3d/Room3D.tsx` | 修复漂浮模型位置 | P1 |

---

### 详细修复步骤

#### 步骤 1: 修复 WASD 方向（FirstPersonControls.tsx）

修改移动向量计算：
- 将 `_forward.set(Math.sin(robotRotation), 0, Math.cos(robotRotation))` 改为 `_forward.set(Math.sin(robotRotation), 0, -Math.cos(robotRotation))`
- 确保 W 键向前移动（朝向相机方向）

修改鼠标旋转方向：
- 将 `robotRotation - e.movementX * sensitivity` 改为 `robotRotation + e.movementX * sensitivity` 或者保持不变（取决于预期方向）

#### 步骤 2: 修复小地图（Minimap.tsx）

检查并修复：
- 当前房间高亮逻辑
- 房间名称显示
- 玩家位置指示

#### 步骤 3: 修复 UI 重叠（HUD.tsx）

调整事件日志面板位置：
- 将事件日志从右上角移到右下角或其他不遮挡的位置
- 增加面板最小宽度限制

#### 步骤 4: 修复任务描述（clean-table.ts）

移除任务目标描述中的括号补充说明：
- "脏杯子放入洗碗机或水槽（不是干净杯子）" → "脏杯子放入洗碗机或水槽"
- "干净杯子不应被当作脏杯子处理（保持自由状态）" → "干净杯子保持自由状态"

#### 步骤 5: 修复漂浮模型（Room3D.tsx）

检查并调整：
- 餐桌位置（确保在地面上）
- 椅子位置（确保与桌子对齐）
- 其他装饰模型位置

---

## 风险评估

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 方向修复可能导致其他移动问题 | 中等 | 测试所有移动方向和视角 |
| 小地图修复可能影响坐标系统 | 低 | 验证所有房间在小地图上的显示 |
| UI 调整可能影响整体布局 | 低 | 检查所有 UI 组件位置 |

---

## 验证步骤

1. **npm run build** - 确保编译通过
2. **启动 dev server** - 访问 http://localhost:5188/
3. **测试 WASD 方向**:
   - W 键向前移动
   - S 键向后移动
   - A 键向左移动
   - D 键向右移动
4. **测试鼠标视角**:
   - 鼠标左移 → 视角左转
   - 鼠标右移 → 视角右转
5. **测试小地图**:
   - 当前房间高亮显示
   - 房间名称可见
   - 玩家位置正确
6. **测试 UI**:
   - 事件日志展开后不遮挡其他内容
7. **测试任务描述**:
   - 任务目标描述简洁清晰，无多余括号
8. **测试模型位置**:
   - 桌子在地面上
   - 椅子与桌子对齐

---

## 完成标准

- [ ] WASD 方向正确（W向前，S向后，A向左，D向右）
- [ ] 鼠标视角旋转正常
- [ ] 小地图显示当前房间和玩家位置
- [ ] UI 不重叠
- [ ] 任务描述简洁清晰，无多余括号补充
- [ ] 模型没有漂浮感
- [ ] npm run build 通过