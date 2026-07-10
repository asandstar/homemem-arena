# HomeMem Arena v2 - Research Demo Enhancement

## Overview
- **Summary**: 将 HomeMem Arena v2 从基础 3D 仿真推进到更完整的研究型 Demo，重点打造"早餐准备与归位"旗舰任务，提升场景真实度、交互可用性、记忆测试和科研数据导出能力。
- **Purpose**: 提供一个能生成高质量 embodied AI 研究数据的浏览器端 3D 家务仿真平台，对标 RoboMME 记忆能力分类，支持空间、物体、时序、程序四类记忆的系统评估。
- **Target Users**: 机器人记忆能力研究者、具身 AI 算法开发者、科研数据采集众包参与者。

## Goals
- [x] 打造"早餐准备与归位"旗舰任务，完整覆盖四类记忆挑战
- [x] 提升 3D 家庭场景真实度，关键物体有可识别轮廓
- [x] 增强第一人称交互可用性，增加小地图、快捷键、任务面板
- [x] 升级记忆测试为四类 probe，记录完整元数据
- [x] 升级科研数据导出，生成符合研究标准的 session JSON
- [x] 升级结果页为研究分析报告格式
- [x] 保持另外三个任务可进入、可完成、可记录数据

## Non-Goals (Out of Scope)
- [ ] 不实现真实物理引擎（如碰撞检测、重力、力模拟）
- [ ] 不实现真实 RGB 渲染（预留 frame_id 字段）
- [ ] 不实现机器人关节动画（简化为胶囊体）
- [ ] 不实现语音交互
- [ ] 不支持多人协作

## Background & Context
- 项目基于 react-three-fiber + zustand + vite 构建
- 已有四个任务：准备出门、收拾餐桌、洗衣分类、早餐准备
- 已实现第一人称控制、记忆库、基本事件日志、简单记忆测试
- 需要对标 RoboMME 的记忆能力分类体系

## Functional Requirements

### FR-1: 旗舰任务 - 早餐准备与归位
- **FR-1.1**: 任务包含完整流程：取餐具→取牛奶→取麦片→摆桌→标记完成→归位→关闭容器
- **FR-1.2**: 脚本事件：roommate_moved_cereal（室友移动麦片）
- **FR-1.3**: 脚本事件：milk_left_out_too_long（牛奶未及时归位）
- **FR-1.4**: 脚本事件：fridge_left_open（冰箱未关闭）
- **FR-1.5**: 脚本事件：wrong_affordance_use（错误使用物体）

### FR-2: 场景真实度提升
- **FR-2.1**: 厨房包含冰箱、橱柜、水槽、台面、餐桌、洗碗机、垃圾桶
- **FR-2.2**: 关键物体有可识别轮廓（牛奶盒、麦片盒、杯子、碗、冰箱、橱柜、洗碗机）
- **FR-2.3**: 容器打开后显示内部物体
- **FR-2.4**: 可交互物体 hover 高亮

### FR-3: 交互可用性
- **FR-3.1**: Tab 键显示任务目标面板
- **FR-3.2**: M 键打开记忆库
- **FR-3.3**: R 键打开研究数据面板
- **FR-3.4**: V 键切换第一人称/俯视视角
- **FR-3.5**: 小地图显示房间轮廓、机器人位置、已访问房间
- **FR-3.6**: 只有观察过的物体才出现在记忆面板
- **FR-3.7**: 可交互物体靠近时显示 interaction tooltip
- **FR-3.8**: HUD 显示当前持有物体
- **FR-3.9**: 任务目标显示为实时更新的 checklist

### FR-4: 记忆测试升级
- **FR-4.1**: Spatial probe（空间位置问题）
- **FR-4.2**: Object state probe（物体状态问题）
- **FR-4.3**: Temporal probe（时间顺序问题）
- **FR-4.4**: Procedural probe（流程步骤问题）
- **FR-4.5**: 每个 probe 记录：question、correct_answer、user_answer、memory_type、related_object_ids、related_event_ids、response_time、is_correct

### FR-5: 科研数据导出升级
- **FR-5.1**: Session JSON 包含：episode_id、task_id、task_instruction、scene_id、agent_pose_trace、camera_pose_trace、observations、visible_objects_per_step、actions、object_state_changes、container_state_changes、memory_updates、scripted_events、probe_questions、probe_answers、outcome_metrics、failure_modes、ai_research_annotation
- **FR-5.2**: Observation 包含：timestamp、room_id、camera_position、camera_rotation、visible_object_ids、visible_container_ids、held_object_id、task_progress
- **FR-5.3**: 预留 screenshot_url/frame_id 字段

### FR-6: 结果页升级
- **FR-6.1**: Task completion summary
- **FR-6.2**: 四类记忆评分（空间、物体状态、时序、程序）
- **FR-6.3**: 指标：总操作数、不必要重访、错放物体、容器错误、遗漏清理步骤
- **FR-6.4**: Timeline 可视化
- **FR-6.5**: AI 失败诊断和策略建议
- **FR-6.6**: JSON session 下载按钮

### FR-7: UI 布局调整
- **FR-7.1**: 左上角：任务 checklist 和当前目标
- **FR-7.2**: 右上角：时间、步数、当前持有物体、当前房间
- **FR-7.3**: 右侧抽屉：记忆库（默认收起）
- **FR-7.4**: 左下角：操作提示
- **FR-7.5**: 右下角：小地图
- **FR-7.6**: 底部：最近 5 条事件 log（半透明，可折叠）
- **FR-7.7**: 中央：短暂提示（不长期遮挡）

## Non-Functional Requirements

- **NFR-1**: 页面加载时间 < 5s
- **NFR-2**: 3D 场景帧率 > 30fps
- **NFR-3**: 事件记录延迟 < 100ms
- **NFR-4**: session JSON 导出速度 < 1s
- **NFR-5**: 响应式设计，支持移动端

## Constraints

- **Technical**: React 18 + TypeScript + Vite + react-three-fiber + zustand + tailwindcss
- **Dependencies**: three.js (@react-three/fiber), @react-three/drei
- **Platform**: 浏览器端，无后端依赖

## Assumptions

- [ ] 用户有基本的第一人称游戏操作经验（WASD 移动）
- [ ] 浏览器支持 WebGL 2.0
- [ ] 用户会按顺序完成任务（先准备后归位）

## Acceptance Criteria

### AC-1: 早餐任务可完整游玩
- **Given**: 用户进入"早餐准备与归位"任务
- **When**: 用户按流程完成所有步骤（取物→摆桌→归位→关容器）
- **Then**: 所有目标达成，任务标记为完成
- **Verification**: `human-judgment`

### AC-2: 脚本事件触发
- **Given**: 用户执行特定操作序列
- **When**: 用户离开厨房超过 5 步，或牛奶取出后超过 10 步未归位
- **Then**: 脚本事件触发并记录到事件日志和记忆库
- **Verification**: `programmatic`

### AC-3: 物体可见性与记忆
- **Given**: 用户在厨房观察到牛奶
- **When**: 用户移动到客厅
- **Then**: 牛奶不在视野内但仍在记忆库中；小地图不显示牛奶位置
- **Verification**: `programmatic`

### AC-4: 四类记忆测试题
- **Given**: 用户完成早餐任务
- **When**: 用户进入记忆测试
- **Then**: 显示至少各一道 spatial、object state、temporal、procedural probe 题目
- **Verification**: `human-judgment`

### AC-5: Session JSON 导出
- **Given**: 用户完成任务和记忆测试
- **When**: 用户点击"下载研究数据"按钮
- **Then**: 下载包含完整字段的 JSON 文件
- **Verification**: `programmatic`

### AC-6: 结果页研究报告
- **Given**: 用户完成任务和记忆测试
- **When**: 用户进入结果页
- **Then**: 显示四类记忆评分、失败诊断、策略建议
- **Verification**: `human-judgment`

### AC-7: 快捷键功能
- **Given**: 用户在游戏中按下 Tab/M/R/V 键
- **When**: 按键触发对应功能
- **Then**: 显示任务面板/记忆库/数据面板/切换视角
- **Verification**: `programmatic`

### AC-8: 另外三个任务可完成
- **Given**: 用户选择"准备出门"/"收拾餐桌"/"洗衣分类"任务
- **When**: 用户完成任务流程
- **Then**: 任务可进入、可完成、可记录数据
- **Verification**: `human-judgment`

### AC-9: 构建通过
- **Given**: 代码修改完成
- **When**: 执行 `npm run build`
- **Then**: 构建成功，无 TypeScript 错误
- **Verification**: `programmatic`

### AC-10: 无严重控制台错误
- **Given**: 用户完整游玩流程
- **When**: 查看浏览器控制台
- **Then**: 无未捕获异常和严重警告
- **Verification**: `human-judgment`

## Open Questions

- [ ] 是否需要添加更多脚本事件类型？
- [ ] 视角切换是否需要添加平滑过渡动画？
- [ ] 是否需要添加物体拾取/放置的音效反馈？
