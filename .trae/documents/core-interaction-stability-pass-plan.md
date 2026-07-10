# Core Interaction Stability Pass 计划

## 摘要

本轮暂停新增剧情、配音、关卡和模型资产，集中修复并验证第一关「出门大作战」和第二关「餐桌混乱」的四大核心交互稳定性：

1. 物体/家具悬空 → 表面锚定（Surface Anchoring）
2. 玩家移动卡顿 → 基于 deltaTime 的平滑移动
3. 穿墙 → 2D AABB 房间边界碰撞 + 门洞例外 + 滑动碰撞
4. 小地图看不全 → 拖动、缩放、自动 fit-to-view

根据当前代码探查，核心实现已落地：
- `src/game/placement.ts` 已提供 `getContainerSurfaceY`、`snapEntityToWorld`、`getFreeObjectInitialPosition` 等表面锚定函数。
- `src/game/playerMovement.ts` 已提供 `computeMoveVector`、`resolveRoomCollision`、`checkDoorwayTransition` 等移动碰撞函数。
- `src/components/arena3d/Minimap.tsx` 已实现 pan/zoom/fit-to-view。
- 任务配置（`leave-home.ts`、`clean-table.ts`）已为关键物体配置 `surfaceContainerId`，为容器配置 `room` 字段。

本计划以「验证 + 收尾修复」为主，确保上述代码在 build、QA 和手动试玩中稳定可用。

## 当前状态分析

### 已确认落地

| 模块 | 文件 | 状态 |
|------|------|------|
| 表面锚定 | `src/game/placement.ts` | ✅ 实现完整 |
| 玩家移动/碰撞 | `src/game/playerMovement.ts` | ✅ 实现完整 |
| 第一人称控制 | `src/components/arena3d/FirstPersonControls.tsx` | ✅ 已接入移动系统 |
| 小地图交互 | `src/components/arena3d/Minimap.tsx` | ✅ pan/zoom/reset/fit 已实现 |
| 物体视觉位置 | `src/components/arena3d/Object3D.tsx` | ✅ 使用 `snapEntityToWorld` |
| 容器位置 | `src/components/arena3d/Container3D.tsx` | ✅ 使用 `getContainerSurfaceY` |
| 类型定义 | `src/types/object.ts` | ✅ `surfaceContainerId` / `room` 已加入 |
| 关卡配置 | `src/data/tasks/leave-home.ts`、`clean-table.ts` | ✅ 已配置表面锚定和房间归属 |
| QA 脚本 | `scripts/qa-*.ts` | ✅ 已存在 |

### 已知遗留问题

1. **9 个 GLB 模型缺失**（QA_REPORT.md 已记录）：key、umbrella、cup、bowl、plate、cloth_white、cloth_dark、towel、shoes。它们会回退到 fallback 几何体。根据用户要求「暂停新增模型资产」，本轮不下载新模型，只验证 fallback 显示是否正常。
2. **第二关餐厅右侧边界漏洞**：`dining` 房间东侧门洞连接到 `laundry`，但 `laundry` 不在第二关 `task.rooms` 中。玩家可能通过门洞进入未设计的洗衣房区域。需要在碰撞或关卡配置中处理。
3. **小地图 canvas 尺寸与容器样式不一致**：`canvas` 写死 `width: 180px;height: 180px`，而 `dimensions` 使用容器实际像素 * dpr，可能导致渲染模糊或缩放异常。
4. **潜在的体验问题**：`PropModel` 的 `modelScale` 按 `maxDim / 0.5` 计算，小物体可能过小；需要在试玩中确认。

## 拟修改内容

### 1. 修复第二关餐厅右侧越界问题

**文件**：`src/data/tasks/clean-table.ts`

**问题**：第二关 `rooms: ['dining', 'kitchen', 'living']`，但 `dining` 的门洞连接到 `laundry`。玩家可通过东门洞进入未设计的洗衣房。

**修复方案**：
- 方案 A（推荐）：移除 `dining → laundry` 的门洞连接，将 `dining.doorways` 中连接到 `laundry` 的项改为不可通行或删除。
- 方案 B：保留门洞但将该 doorway 标记为 `locked: true`，碰撞系统识别为墙。

选择方案 A，简单直接，符合「第一/二关稳定可玩」目标。

### 2. 修复小地图渲染尺寸问题

**文件**：`src/components/arena3d/Minimap.tsx`

**问题**：`canvas` 的 style 尺寸写死 180x180，而内部 `dimensions` 基于容器实际尺寸 * dpr。若容器 CSS 尺寸变化，canvas 会拉伸/模糊。

**修复方案**：
- 让 `canvas` 的 style 尺寸动态等于容器尺寸（100% 宽高），不再写死。
- 保持 `dimensions` 为容器实际像素 * dpr，确保清晰。
- 保留最小/最大尺寸限制，防止 UI 遮挡。

### 3. 验证并修复 fallback 显示与表面锚定

**文件**：`src/components/arena3d/models/FallbackModels.tsx`（按需）

**问题**：缺失 GLB 模型的 fallback 几何体是否底部贴地、尺寸合理，需在试玩中确认。

**修复方案**：
- 若 fallback 物体明显悬空或过大/过小，调整对应 fallback 组件的 pivot 或尺寸。
- 优先保证第一/二关出现的物体：key、phone、umbrella、cup、plate、tissue、remote。

### 4. 可选：微调 PropModel 缩放基准

**文件**：`src/components/arena3d/models/PropModel.tsx`

**问题**：`modelScale = maxDim / 0.5` 可能使小物体（如遥控器 0.18m）缩放到 0.36 倍，视觉上偏小。

**修复方案**：
- 若试玩发现物体过小，改为 `maxDim / 0.3` 或添加最小缩放保护（如 `Math.max(0.6, scale)`）。
- 仅在确认问题后修改。

### 5. 运行 build + QA 并生成报告

**命令**：
- `npm run build`
- `npm run qa`
- `npm run qa:report`

## 验证步骤

### 自动验证

1. `npm run build` 通过，无 TypeScript 错误。
2. `npm run qa` 通过（允许已存在的 9 个 Minor GLB 缺失项）。
3. `npm run qa:report` 生成新的 `QA_REPORT.md`。

### 手动试玩

1. 进入第一关「出门大作战」。
   - 检查钥匙是否在茶几表面、雨伞是否在伞架内/旁、手机从抽屉取出后位置是否合理。
   - 连续按 W/S/A/D 移动 30 秒，确认不卡顿、不突跳。
   - 尝试撞墙，确认不能穿墙。
   - 穿过门洞进入卧室、厨房、玄关，确认自然切换。
   - 检查小地图是否完整显示客厅、卧室、玄关，支持拖动/缩放/重置。

2. 进入第二关「餐桌混乱」。
   - 检查餐桌上的杯子、盘子、遥控器、纸巾是否贴合桌面。
   - 放置到洗碗机/水槽/垃圾桶/茶几后是否贴合表面。
   - 确认餐厅右侧无法进入洗衣房（边界可靠）。
   - 检查小地图是否完整显示餐厅、厨房、客厅。

3. 控制台检查
   - 无严重红色错误。
   - 允许 GLB 404（fallback 生效）。

## 假设与决策

- **不下载新模型**：遵循「暂停新增模型资产」的指令，缺失模型使用 fallback。
- **仅修复第一/二关**：第三、四关的问题只在影响 build/QA 时顺带处理。
- **第二关洗衣房门洞删除**：因为 `laundry` 不是第二关任务房间，且用户提到「餐厅右侧边界碰撞漏洞」。
- **小地图默认 fit-to-view**：已存在，只需修复尺寸一致性问题。
