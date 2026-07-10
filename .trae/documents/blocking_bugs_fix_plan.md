# 阻塞级体验修复计划

## 问题诊断

### 1. 房间和小地图不一致的根因
- **Minimap.tsx 第 48-69 行**：遍历 `Object.entries(sharedRooms)` 显示所有定义的房间（living, bedroom, kitchen, entrance, laundry, dining 共 6 个）
- **Scene3D.tsx 第 103-106 行**：只渲染 `task.rooms` 中的房间
- **结果**：小地图显示 6 个房间，但 3D 场景可能只渲染 2-4 个，导致玩家看到无法到达的房间

### 2. 画面抖动的根因
- **HUD.tsx 第 136-142 行**：`animate-pulse` 类作用于整个 HUD 容器，`isShaking` 状态触发 `hud-shake` 动画
- **CSS 动画**：全局 HUD 容器有 filter hue-rotate 和 pulse 动画
- **混乱值**：`chaosWarning` 为 true 时每 1.5-2.5 秒触发一次抖动

### 3. 门像关闭的根因
- **Room3D.tsx 第 553-586 行**：门模型是棕色 `boxGeometry`，尺寸 `[0.05, hh, ww]`，看起来像关闭的门板
- **墙体逻辑**：已经正确留出 doorway 空间，但门框/门洞没有明显开放提示
- **玩家困惑**：不知道门能不能通过

### 4. 模型白色的可能原因
- GLB 文件存在于 `public/assets/models/` 目录
- `ModelAsset.tsx` 使用 `FallbackColorizer` 处理 fallback
- `Room3D.tsx` 中直接使用 fallback 组件并传入颜色
- 需要验证：GLB 是否 404、FallbackColorizer 是否正确执行

### 5. 混乱值开局过高
- 需要检查 `useGameStore.ts` 初始化和 `initializeTask` 函数

---

## 修复计划

### 第一优先：禁用画面抖动

**文件**: `src/components/arena3d/HUD.tsx`

**修改内容**:
1. 移除 HUD 容器上的 `animate-pulse` 类（第 136 行）
2. 移除 `isShaking` 状态和 `setIsShaking` 逻辑（第 105-113 行）
3. 移除 `style` 中的 `animation: hud-shake`（第 139 行）
4. 保留混乱值条的颜色变化和轻微 hue-rotate filter（但限制强度）
5. 第一关教学阶段（前 30 秒）完全禁用 glitch 效果

### 第二优先：修复小地图和房间一致

**文件**: `src/components/arena3d/Minimap.tsx`

**修改内容**:
1. 新增 `taskRooms: RoomId[]` prop，只显示当前任务需要的房间
2. 移除遍历 `sharedRooms`，改为遍历 `taskRooms`
3. 高亮当前房间和相邻可进入房间
4. 显示中文房间名（已有）

**文件**: `src/components/arena3d/HUD.tsx`

**修改内容**:
1. 传递 `task?.rooms` 到 Minimap 组件

### 第三优先：修复门和房间入口显示

**文件**: `src/components/arena3d/Room3D.tsx`

**修改内容**:
1. **移除门板模型**（第 553-586 行的棕色盒子），只保留开放门洞
2. 在门洞位置添加发光边框/门框（使用 `ringGeometry` 或 `torusGeometry`）
3. 门洞地面添加箭头指向下一个房间（使用 `coneGeometry`）
4. 门洞上方添加房间名标签（已有 Billboard，需要在门洞处也添加）
5. 门洞使用不同颜色的地面贴条提示"可通行"

**文件**: `src/components/arena3d/FirstPersonControls.tsx`

**修改内容**:
1. 玩家靠近门洞时显示提示："进入客厅 / 进入卧室" 等
2. 增大门口触发区域（当前 `dist < 1.0`，改为 `dist < 1.5`）

### 第四优先：彻底修复模型白色问题

**诊断步骤**:
1. 在浏览器控制台检查 GLB 加载是否有 404
2. 在 `ModelAsset.tsx` 添加 console.log 调试输出

**文件**: `src/components/arena3d/models/ModelAsset.tsx`

**修改内容**:
1. 确认 GLB 加载成功时保留原始材质颜色（已实现）
2. 在开发模式下添加 debug label 显示模型来源（GLB/fallback）

**文件**: `src/components/arena3d/Room3D.tsx`

**修改内容**:
1. 检查所有 fallback 组件的颜色传入是否正确
2. 确保每个 `group` 包裹的 fallback 组件都通过 FallbackColorizer

### 第五优先：新增新手引导

**文件**: `src/components/arena3d/HUD.tsx`

**修改内容**:
1. 新增 `TutorialHint` 组件，显示当前步骤提示
2. 第一关开始时显示 5 秒任务说明
3. 屏幕中央显示："第一步：移动到客厅，寻找钥匙"
4. 靠近可交互物体时显示："F 拾取钥匙"
5. 第一次按 E 时记忆槽明显闪烁

### 第六优先：修复混乱值初始化

**文件**: `src/store/useGameStore.ts`

**修改内容**:
1. 检查 `initializeTask` 函数，确保 `chaosValue` 初始化为 0 或低值（如 5）
2. 第一关教学阶段（前 30 秒）混乱值增长减半

### 第七优先：房间名中文化

**文件**: `src/components/arena3d/HUD.tsx`

**修改内容**:
1. 右上角位置显示中文化："客厅" / "餐厅" 等（当前已有，检查是否正确）

---

## 验收标准

1. 进入第一关后画面稳定，无抖动
2. 小地图只显示当前任务的房间（客厅、卧室、厨房、玄关）
3. 门洞明显可通行，有发光边框和房间名标签
4. 沙发、桌子、柜子等有颜色，不纯白
5. WASD 方向正确
6. 玩家能从客厅走到卧室，再到玄关
7. 第一关能在 2-4 分钟内完成
8. npm run build 通过
9. 控制台无严重红色错误

---

## 实施顺序

1. 禁用画面抖动（HUD.tsx）
2. 修复小地图和房间一致（Minimap.tsx + HUD.tsx）
3. 修复门和房间入口显示（Room3D.tsx）
4. 诊断并修复模型白色问题（ModelAsset.tsx + Room3D.tsx）
5. 新增新手引导（HUD.tsx）
6. 修复混乱值初始化（useGameStore.ts）
7. npm run build 验证
8. 试玩验证