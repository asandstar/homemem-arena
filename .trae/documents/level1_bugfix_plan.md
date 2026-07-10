# 第一关 Bugfix & 体验修复计划

## 📋 项目调研结论

### 已确认的问题根因

#### 1. W/S 移动方向反向
**根因**: `moveForward` 函数使用 `Math.cos(rot)` 计算 Z 轴移动，但 Three.js 相机默认朝 -Z 方向。
- 当前代码（[useGameStore.ts#L339-L348](file:///Users/azq/asandstar/homemem-arena-web-demo/src/store/useGameStore.ts#L339-L348)）：
  ```typescript
  const dx = Math.sin(robotRotation) * distance
  const dz = Math.cos(robotRotation) * distance  // 正向是 +Z，但相机朝 -Z
  ```
- 问题：按 W 时 `distance > 0`，但相机朝 -Z 方向，所以玩家感觉在后退。

#### 2. 模型大面积白色
**根因**: Fallback 模型的 mesh 没有指定材质颜色，默认使用白色。
- [FallbackModels.tsx](file:///Users/azq/asandstar/homemem-arena-web-demo/src/components/arena3d/models/FallbackModels.tsx) 中所有 `<mesh>` 都没有 `<meshStandardMaterial>`，默认材质为白色。
- GLB 加载失败后 fallback 到白色模型，造成大面积纯白。

#### 3. UI 重叠
**根因**: 
- 右上角 ScorePanel + EventLog 上下堆叠，EventLog 默认展开时占空间过大
- 右下角 Minimap 上叠加了"重新开始"按钮
- 左上角 LevelObjectivePanel 过宽

#### 4. 事件日志 undefined
**根因**: [HUD.tsx#L363-L364](file:///Users/azq/asandstar/homemem-arena-web-demo/src/components/arena3d/HUD.tsx#L363-L364) 的兜底逻辑不足：
```typescript
const displayText = 'message' in event ? event.message : 'description' in event ? event.description : event.type
```
当 `message` 和 `description` 都为 `undefined` 时，即使 `'message' in event` 为 true，值仍然是 `undefined`。

---

## 📁 需要修改的文件

| 文件 | 修改内容 |
|------|---------|
| `src/store/useGameStore.ts` | 修复 moveForward 方向（Z 轴取反） |
| `src/components/arena3d/models/FallbackModels.tsx` | 为所有 fallback mesh 添加材质颜色 |
| `src/components/arena3d/models/ModelAsset.tsx` | 保留 GLB 原始颜色，只调整 roughness/metalness |
| `src/components/arena3d/HUD.tsx` | 重构布局，修复重叠，修复 undefined |
| `src/components/arena3d/Scene3D.tsx` | 调整灯光强度，避免过曝 |
| `src/components/arena3d/Room3D.tsx` | 检查房间材质颜色 |

---

## 🔧 修复步骤

### Phase 1: 修复 W/S 移动方向
**文件**: `src/store/useGameStore.ts`

**修改**:
- `moveForward` 函数中 `dz` 取反
- `FirstPersonControls.tsx` 中左右平移的方向也需要验证

**forward vector 公式**:
```
dx = sin(rotation) * distance   // 保持不变
dz = -cos(rotation) * distance  // 取反，因为相机默认朝 -Z
```

**验收**: 按 W 向画面前方移动，按 S 后退，A/D 左右平移正确。

---

### Phase 2: 修复模型白色问题

#### 2.1 Fallback 模型添加材质
**文件**: `src/components/arena3d/models/FallbackModels.tsx`

**修改**:
- 为每个 fallback 模型的 mesh 添加 `<meshStandardMaterial>`
- 使用 `PALETTE` 中的颜色
- 家具：低饱和暖色（木色、米色、灰蓝）
- 任务物体：高饱和醒目颜色

#### 2.2 ModelAsset 保留 GLB 原始颜色
**文件**: `src/components/arena3d/models/ModelAsset.tsx`

**修改**:
- 移除无条件的 `child.material.color.set(color)`
- 只在 `color` prop 明确传入时才覆盖颜色
- 保留 roughness / metalness / castShadow / receiveShadow 的统一设置

#### 2.3 调整灯光强度
**文件**: `src/components/arena3d/Scene3D.tsx` 或 `Room3D.tsx`

**修改**:
- 降低环境光强度
- 降低方向光强度
- 避免白色模型过曝

**验收**:
- 沙发、桌子、椅子、柜子不再大面积纯白
- GLB 缺失时 fallback 仍然可用且有颜色
- 控制台没有大量 GLB 404 错误

---

### Phase 3: 修复 UI 重叠

**文件**: `src/components/arena3d/HUD.tsx`

**桌面端布局调整**:

1. **左上角 LevelObjectivePanel**:
   - 最大宽度 320px（原 ~360px+）
   - 最大高度 40vh，内部滚动
   - 默认展开，Tab 键切换

2. **顶部中央 ChaosComboBar**:
   - 宽度 340px，固定居中
   - 不遮挡中央视野

3. **右上角 ScorePanel**:
   - 宽度 200px
   - 包含"重新开始"按钮（移到这里）

4. **右侧事件日志**:
   - 默认收起（collapsed）
   - 按 R 键展开
   - 在 ScorePanel 下方，不重叠

5. **底部中央 MemorySlotBar**:
   - 保持当前位置
   - 适当缩小尺寸

6. **左下角 ContextActionHint**:
   - 保持小而清楚

7. **右下角 Minimap**:
   - 固定右下角
   - "重新开始"按钮移到 ScorePanel 内

8. **中央区域**:
   - 只保留短暂的浮动文字和事件 toast
   - 不长期显示任何 UI

**验收**:
- 小地图和重新开始按钮不重叠
- 事件日志不压住得分面板
- 任务面板不占据过多画面
- 1440px 宽度下 UI 不重叠

---

### Phase 4: 修复事件日志 undefined

**文件**: `src/components/arena3d/HUD.tsx`

**新增函数**: `formatEventMessage(event)`

**规则**:
- `scripted_event`: 显示 `event.description`，兜底为"脚本事件触发"
- `action` + `pick`: 显示"拾取：{objectName}"，兜底为"拾取物体"
- `action` + `place`: 显示"放置：{objectName} 到 {containerName}"，兜底为"放置物体"
- `action` + `open`: 显示"打开：{containerName}"，兜底为"打开容器"
- `action` + `close`: 显示"关闭：{containerName}"，兜底为"关闭容器"
- `memory_write`: 显示"保存记忆：{objectName}"，兜底为"保存记忆"
- `task_progress`: 显示"目标完成：{goalDescription}"，兜底为"目标完成"
- `observation`: 显示"观察到 {n} 个物体"，兜底为"房间观察"
- 其他类型: 显示 `event.message || event.description || event.type || "事件触发"`

**验收**: 事件日志里不再出现 undefined。

---

### Phase 5: 回归测试

1. `npm run build` 验证构建通过
2. 启动 dev server
3. 分别进入第一关和第二关
4. 检查 W/S 方向
5. 检查模型材质
6. 检查 HUD 是否重叠
7. 检查事件日志是否还有 undefined
8. 检查第一关仍然能进入并完整游玩
9. 检查其他三个关卡仍然能进入
10. 控制台没有严重红色错误

---

## ⚠️ 注意事项

1. **不改变核心玩法逻辑**，只修复 bug 和 UI 布局
2. **保持其他三个关卡可进入**，不做深度修改
3. **不引入新依赖**
4. **不继续下载模型**
5. Fallback 模型颜色要统一使用 PALETTE，不硬编码随机颜色
6. 移动方向修改后，验证俯视视角（V 键切换）下移动也正确

---

## ✅ 验收标准

1. `npm run build` 通过
2. W 前进、S 后退、A/D 左右平移方向正确
3. 模型不再大面积纯白，fallback 有合理的颜色
4. HUD 各区域不重叠，小地图不被按钮遮挡
5. 事件日志没有 undefined
6. 第一关可完整游玩
7. 其他三个关卡可进入
8. 控制台没有严重红色错误
