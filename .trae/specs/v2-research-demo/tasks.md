# HomeMem Arena v2 - Research Demo Enhancement - Implementation Plan

## [x] Task 1: 升级早餐准备与归位任务配置
- **Priority**: high
- **Depends On**: None
- **Description**: 
  - 扩展早餐任务配置，添加完整流程：取餐具→取牛奶→取麦片→摆桌→标记完成→归位→关闭容器
  - 添加脚本事件：roommate_moved_cereal、milk_left_out_too_long、fridge_left_open、wrong_affordance_use
  - 添加四类记忆测试题（spatial、object state、temporal、procedural）
- **Acceptance Criteria Addressed**: AC-1, AC-2, AC-4
- **Test Requirements**:
  - `programmatic` TR-1.1: 早餐任务配置包含至少 9 个目标（取物×4 + 摆桌 + 归位×3 + 关容器）
  - `programmatic` TR-1.2: 早餐任务配置包含至少 4 个脚本事件
  - `programmatic` TR-1.3: 早餐任务配置包含至少 4 道记忆测试题（每类各一道）
  - `human-judgment` TR-1.4: 任务流程逻辑合理，步骤顺序符合实际家务场景
- **Notes**: 需要更新 src/data/tasks/breakfast.ts

## [x] Task 2: 提升 3D 场景真实度 - 物体几何优化
- **Priority**: high
- **Depends On**: Task 1
- **Description**: 
  - 创建自定义几何组件：牛奶盒（长方体带标签）、麦片盒（高盒子）、杯子（圆柱形）、碗（浅圆盘）、冰箱（高柜体带门）、橱柜（带门板）、洗碗机（带门和把手）
  - 更新 Object3D 和 Container3D 组件以使用这些自定义几何
  - 添加容器打开后显示内部物体的逻辑
- **Acceptance Criteria Addressed**: AC-1, AC-3
- **Test Requirements**:
  - `programmatic` TR-2.1: 关键物体（牛奶、麦片、杯子、碗）使用非方块几何
  - `human-judgment` TR-2.2: 物体轮廓可识别，不需要文字标签也能辨认
  - `human-judgment` TR-2.3: 容器打开后内部物体可见
- **Notes**: 需要更新 src/components/arena3d/Object3D.tsx 和 src/components/arena3d/Container3D.tsx，可能需要创建新的几何组件文件

## [x] Task 3: 实现小地图组件
- **Priority**: high
- **Depends On**: Task 1
- **Description**: 
  - 创建 Minimap 组件，显示房间轮廓、机器人位置、已访问房间
  - 小地图上不显示未观察到的任务物体
  - 集成到 HUD 右下角
- **Acceptance Criteria Addressed**: AC-3
- **Test Requirements**:
  - `programmatic` TR-3.1: 小地图正确显示当前房间和已访问房间
  - `programmatic` TR-3.2: 未观察过的物体不在小地图上显示
  - `human-judgment` TR-3.3: 小地图清晰易读，位置更新及时
- **Notes**: 需要创建 src/components/arena3d/Minimap.tsx

## [x] Task 4: 实现快捷键系统和视角切换
- **Priority**: high
- **Depends On**: Task 1
- **Description**: 
  - 实现 Tab 键显示任务目标面板
  - 实现 M 键打开记忆库
  - 实现 R 键打开研究数据面板
  - 实现 V 键切换第一人称/俯视视角
  - 集成到 ArenaPage 和 HUD 组件
- **Acceptance Criteria Addressed**: AC-7
- **Test Requirements**:
  - `programmatic` TR-4.1: Tab 键触发任务面板显示/隐藏
  - `programmatic` TR-4.2: M 键触发记忆库显示/隐藏
  - `programmatic` TR-4.3: R 键触发研究数据面板显示/隐藏
  - `programmatic` TR-4.4: V 键触发视角切换
- **Notes**: 需要更新 src/components/arena3d/HUD.tsx 和 src/pages/ArenaPage.tsx

## [x] Task 5: 升级记忆测试系统
- **Priority**: high
- **Depends On**: Task 1
- **Description**: 
  - 扩展 ProbeQuestionSpec 类型，添加 related_object_ids、related_event_ids 字段
  - 更新 ProbeCard 和 ProbeSequence 组件以支持四类 probe
  - 更新事件记录，记录完整的 probe 回答元数据
- **Acceptance Criteria Addressed**: AC-4
- **Test Requirements**:
  - `programmatic` TR-5.1: ProbeAnswerEvent 包含所有要求字段（question、correct_answer、user_answer、memory_type、related_object_ids、related_event_ids、response_time、is_correct）
  - `human-judgment` TR-5.2: 四类 probe 题目格式清晰，选项合理
- **Notes**: 需要更新 src/types/task.ts、src/components/probe/ProbeCard.tsx、src/components/probe/ProbeSequence.tsx

## [x] Task 6: 升级科研数据导出
- **Priority**: high
- **Depends On**: Task 5
- **Description**: 
  - 扩展 SessionData 类型，添加所有要求字段（episode_id、scene_id、agent_pose_trace、camera_pose_trace、observations、visible_objects_per_step、object_state_changes、container_state_changes、memory_updates、scripted_events、probe_questions、probe_answers、outcome_metrics、failure_modes、ai_research_annotation）
  - 更新 useSessionStore 以记录完整数据
  - 更新 JsonPreview 和 DownloadButton 组件
- **Acceptance Criteria Addressed**: AC-5
- **Test Requirements**:
  - `programmatic` TR-6.1: 导出的 JSON 文件包含所有要求的顶级字段
  - `programmatic` TR-6.2: 每个 observation 包含所有要求的字段
  - `programmatic` TR-6.3: 文件可成功下载，格式正确
- **Notes**: 需要更新 src/types/session.ts、src/store/useSessionStore.ts、src/components/data/JsonPreview.tsx

## [x] Task 7: 升级结果页为研究报告格式
- **Priority**: high
- **Depends On**: Task 5, Task 6
- **Description**: 
  - 实现四类记忆评分展示（空间、物体状态、时序、程序）
  - 添加 Timeline 可视化组件
  - 更新 MetricCards、FailureBreakdown、PolicySuggestions 组件
  - 添加 JSON 下载按钮
- **Acceptance Criteria Addressed**: AC-6
- **Test Requirements**:
  - `human-judgment` TR-7.1: 结果页显示四类记忆评分
  - `human-judgment` TR-7.2: Timeline 可视化清晰展示事件序列
  - `human-judgment` TR-7.3: AI 失败诊断和策略建议有价值
- **Notes**: 需要更新 src/pages/ResultPage.tsx、src/components/result/MetricCards.tsx

## [x] Task 8: 调整 UI 布局
- **Priority**: medium
- **Depends On**: Task 3, Task 4
- **Description**: 
  - 调整 HUD 布局：左上角任务 checklist、右上角状态栏、右下角小地图、左下角操作提示
  - 添加底部事件日志（可折叠）
  - 调整中央提示区域（短暂显示）
- **Acceptance Criteria Addressed**: AC-7
- **Test Requirements**:
  - `human-judgment` TR-8.1: UI 布局符合规范，不遮挡关键游戏区域
  - `human-judgment` TR-8.2: 事件日志可折叠，不影响游戏视野
- **Notes**: 需要更新 src/components/arena3d/HUD.tsx

## [ ] Task 9: 验证另外三个任务
- **Priority**: medium
- **Depends On**: Task 1-8
- **Description**: 
  - 确保"准备出门"、"收拾餐桌"、"洗衣分类"任务仍然可进入、可完成、可记录数据
  - 修复可能因代码重构导致的问题
- **Acceptance Criteria Addressed**: AC-8
- **Test Requirements**:
  - `human-judgment` TR-9.1: 三个任务均可正常进入
  - `human-judgment` TR-9.2: 三个任务均可完成所有目标
  - `human-judgment` TR-9.3: 三个任务的 session 数据均可正常记录和导出
- **Notes**: 需要测试 src/data/tasks/leave-home.ts、src/data/tasks/clean-table.ts、src/data/tasks/laundry-sort.ts

## [x] Task 10: 构建验证和代码检查
- **Priority**: high
- **Depends On**: Task 1-9
- **Description**: 
  - 执行 `npm run build` 确保构建通过
  - 执行 `npm run lint` 确保代码质量
  - 检查控制台是否有严重错误
- **Acceptance Criteria Addressed**: AC-9, AC-10
- **Test Requirements**:
  - `programmatic` TR-10.1: `npm run build` 返回 exit code 0
  - `programmatic` TR-10.2: `npm run lint` 返回 exit code 0
  - `human-judgment` TR-10.3: 浏览器控制台无未捕获异常
- **Notes**: 需要在终端执行命令
