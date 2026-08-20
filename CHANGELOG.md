# 更新历史

本文件记录 HomeMem Arena 的版本演进与关键变更，便于回溯开发迭代过程。

## 2026-08-08 · 三关记忆阶梯重构

- **L1 缩减为 3 件可见餐具**：必须先按 E 保存第一条记忆，再学习拾取与归位。
- **L2 改为 3 房间稳定 RECALL**：书、马克杯、收音机全部编码后才能搬运；钥匙猫只制造假干扰。
- **L3 改为早餐 UPDATE**：保存麦片旧位置 → 发现冲突 → 重新观察 → 按 E 更新过期记忆。
- 三关目标均提供逐项横幅和清单勾选；真实 Chromium 连续通关测试覆盖最终结算。

## 2026-08-07 · 关键 Bug 修复

| 问题 | 修复 |
|------|------|
| L1 初始视角没翻转 180°，玩家背对任务区 | `spawnRotation` 改为 `3π/4`，相机初始化 useEffect 依赖 `[phase, robotRotation]` 任务初始化后同步 |
| 小地图箭头方向与实际朝向相反，L2 寻物找不到方向 | 修正 Minimap 3D→2D 坐标变换公式 `fy = y - cos(yaw)*L` 取反 |
| ESC 无法释放鼠标锁定，Dialog 打开时 ESC 被拦截 | 直接检查 `document.pointerLockElement`，加 Dialog 存在性检查与 `try-catch` 保护 |
| 两套音频系统同时发声（BGM+Chaos/Room Ambient 叠加） | `playing` 阶段开始时强制 `stopChaosAmbient()` + `stopAmbientImmediate()`，避免多音频叠加 |
| L2 有 6 个悬浮枕头（床上/沙发位置坐标错误）+ 4 把餐椅围着不存在的餐桌 | 修正枕头坐标（卧室加 room center、沙发跟随新位置），餐椅只在配置了餐桌时渲染 |
| L3 冰箱/微波炉/吊柜不靠墙 | 北墙工作区整体北移 0.2m，冰箱精确贴西墙 |
| 黑色的"0"出现在任务卡片上（`attempts===0` 被 React 当文本渲染） | 改为显式三元判断，`0 && ...` 短路不再返回数字 0 |
| 视角手感粘手、俯仰角太极端、机器人太高 | 俯仰角收窄到 ±50°，灵敏度降低 27%，机器人身高 1.5→1.35m |
| 模型加载报错 `exited the lock`（ESC 退出 Pointer Lock 时中断 GLTF 加载） | `gltfSilentError` 静默该错误，全局 `unhandledrejection` 处理器同步忽略 |

## 2026-08-07 · 范围精简

- 移除独立的 `task-breakfast` 第 4 关和第 5 关（深夜巡逻）；早餐记忆更新核心已整合为当前 L3，并保留历史路由 ID `task-laundry-sort`
- 删除对应任务配置、BGM、对话、测试、BGM 引用，代码体量减少 ~1.5k 行
- 测试从 414 精简到 403，全部通过；构建从 ~780ms 降到 ~695ms

## 2026-08-06 · 更早关键修复

| 问题 | 修复 |
|------|------|
| Store 初始化失败：`Cannot read properties of null (reading 'addScore')` | 修复 `withSafeSnapshot` 包装器，现在正确复制 `getState`/`setState`/`subscribe`/`getInitialState` 4 个静态方法 |
| 关卡锁定：DEV 模式下旧存档导致关卡被锁定 | `isLevelUnlocked` 直接返回 `true`，所有关卡默认解锁 |
| UI 文案乱码：`font-mono` 导致中文渲染错误（"靠近"→"爱国"） | 移除 AI 系统指令的玩家端渲染，修复 Flex 布局防止文字挤压 |
| 游戏卡住：点击"开始任务"后一直卡在"准备中" | Store 初始化修复解决了所有下游的 null 引用问题 |

## 2026-08-06 · 新增功能

| 功能 | 说明 |
|------|------|
| **视线遮挡（LOS）** | 从相机发射射线（Ray-AABB Slab method）检测遮挡物，高亮/脉动环效果会被墙壁和家具遮挡 |
| **猫脚印避让** | 点-OBB 2D 包含检测 + 推出算法，确保猫脚印不落在家具内部（推到最近边 + 0.1m 缓冲外） |
| **GLB fallback 尺寸对齐** | 程序化几何体通过 `effectiveAabb` 动态注入尺寸，确保视觉与碰撞盒、GLB 模型一致 |
| **抽屉交互** | 部分物品（如床头柜抽屉、厨房抽屉）支持打开/关闭交互，带专用音效 |

## 2026-08-06 · 架构改进

| 改进 | 说明 |
|------|------|
| `src/store/safeStore.ts` | 新增安全 store 包装器，保护 React 首帧 `getSnapshot=null` 的情况，同时保证静态方法完整 |
| `src/game/lineOfSight.ts` | 新增视线遮挡工具模块，纯数学实现，零外部依赖 |
| `src/utils/nudgeFootprintAway.ts` | 新增脚印避让工具模块 |
| `src/utils/resolveFallbackSize.ts` | 新增 fallback 尺寸解析器，统一视觉/碰撞/模型尺寸 |
