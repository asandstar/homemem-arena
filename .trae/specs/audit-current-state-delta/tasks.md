# Tasks

- [x] Task 1: 运行检查命令并记录结果
  - [x] SubTask 1.1: 运行 `npm test` 并记录测试数量和结果
  - [x] SubTask 1.2: 运行 `npm run lint` 并记录结果
  - [x] SubTask 1.3: 运行 `npm run build` 并记录结果
  - [x] SubTask 1.4: 运行 `npm run qa` 并记录结果（如 vite-node 缺失则记录为 QA 工具链问题）
  - [x] SubTask 1.5: 确认 `npm run e2e` 不存在，记录为 missing

- [x] Task 2: 审计当前真实架构
  - [x] SubTask 2.1: 确认 useGameStore 由 9 个 Slice 组合（引用 useGameStore.ts 行号）
  - [x] SubTask 2.2: 列出所有 Slice 文件和职责
  - [x] SubTask 2.3: 确认 Scene Graph 存在并实际使用（引用 sceneGraph.ts 和调用方）
  - [x] SubTask 2.4: 确认 Event Bus 存在并实际使用（引用 eventBus.ts 和调用方）
  - [x] SubTask 2.5: 确认 Commands 统一处理交互（引用 commands.ts）
  - [x] SubTask 2.6: 确认程序记忆系统接入 breakfast（引用 proceduralMemory.ts 和 taskSlice.ts）
  - [x] SubTask 2.7: 列出当前页面和路由（引用 routes.tsx）
  - [x] SubTask 2.8: 列出当前 QA 命令（引用 package.json）

- [x] Task 3: 审计已有文档与代码的冲突
  - [x] SubTask 3.1: 盘点所有已有文档（README.md、docs/、根目录 .md 文件）
  - [x] SubTask 3.2: 检查 README 中关卡顺序是否一致
  - [x] SubTask 3.3: 检查玩家名称是否混用（小橡/MEM-07/家政小精灵/机器人）
  - [x] SubTask 3.4: 检查游戏流程描述是否为 Arena → Probe → Result
  - [x] SubTask 3.5: 检查文档是否仍声称 useGameStore 是单体文件
  - [x] SubTask 3.6: 检查文档记录的测试数量是否一致
  - [x] SubTask 3.7: 检查文档描述的脚本事件是否真的改变状态
  - [x] SubTask 3.8: 检查文档中的关卡目标是否和 task 配置一致
  - [x] SubTask 3.9: 检查文档中的房间布局是否和 rooms.ts 一致
  - [x] SubTask 3.10: 检查文档中的操作方式是否和 FirstPersonControls 一致

- [x] Task 4: 审计当前稳定性
  - [x] SubTask 4.1: 检查第一关 Golden Path 是否可完成
  - [x] SubTask 4.2: 检查第二关餐桌和餐具位置
  - [x] SubTask 4.3: 检查家具渲染和碰撞数据一致性
  - [x] SubTask 4.4: 检查任务物体放置高度
  - [x] SubTask 4.5: 检查门视觉、doorway 和碰撞
  - [x] SubTask 4.6: 检查小地图显示范围
  - [x] SubTask 4.7: 检查重新开始状态重置
  - [x] SubTask 4.8: 检查关卡结束后 tick 停止
  - [x] SubTask 4.9: 检查 GLB fallback 安全性
  - [x] SubTask 4.10: 检查 HUD 重叠风险（1280×720 / 1440×900 / 1920×1080）

- [x] Task 5: 审计 UI、导航和关卡流程
  - [x] SubTask 5.1: 检查页面流程 HomePage → TaskSelectPage → ArenaPage → ProbePage → ResultPage
  - [x] SubTask 5.2: 检查 WelcomeModal 与 Briefing 是否重复
  - [x] SubTask 5.3: 检查无效 taskId 处理
  - [x] SubTask 5.4: 检查页面刷新行为
  - [x] SubTask 5.5: 检查浏览器后退安全性
  - [x] SubTask 5.6: 检查路由切换时 Pointer Lock、AudioContext、Store 释放

- [x] Task 6: 审计测试覆盖能力
  - [x] SubTask 6.1: 列出所有测试文件和覆盖模块
  - [x] SubTask 6.2: 确认是否有浏览器 E2E
  - [x] SubTask 6.3: 确认是否有视觉回归测试
  - [x] SubTask 6.4: 确认是否能自动完成 Golden Path
  - [x] SubTask 6.5: 确认是否检查 console error

- [x] Task 7: 生成 `docs/CURRENT_STATE_DELTA_AUDIT.md` 报告
  - [x] SubTask 7.1: 撰写 16 个章节
  - [x] SubTask 7.2: 确保所有结论引用具体文件和行号
  - [x] SubTask 7.3: 标记无法确认的内容为 unknown

# Task Dependencies

- Task 7 depends on Task 1, 2, 3, 4, 5, 6
- Task 2, 3, 4, 5, 6 可并行执行
