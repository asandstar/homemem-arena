# Echo House: Memory Butler - The Implementation Plan (Decomposed and Prioritized Task List)

## [x] Task 1: 更新游戏状态管理 - 新增记忆槽、混乱值、评分、Combo 状态
- **Priority**: high
- **Depends On**: None
- **Description**: 
  - 在 useGameStore 中新增 memorySlots（3个槽位）、chaosValue（0-100）、score、combo、maxCombo 状态
  - 添加 saveMemory、lockMemorySlot、clearMemorySlot 等动作
  - 添加 incrementChaos、resetChaos 等动作
  - 添加 addScore、resetScore、addCombo、breakCombo 等动作
- **Acceptance Criteria Addressed**: AC-3, AC-4, AC-5
- **Test Requirements**:
  - `programmatic` TR-1.1: 记忆槽初始为空，最多保存3条记忆
  - `programmatic` TR-1.2: 混乱值从0开始，随时间增加，达到100触发失败
  - `programmatic` TR-1.3: 评分和 combo 初始为0，正确操作增加，错误操作减少
  - `human-judgement` TR-1.4: 锁定记忆后不会被覆盖
- **Notes**: 需要定义记忆槽数据结构，包含 objectName、roomName、containerName、state、timestamp、locked

## [x] Task 2: 首页游戏化改造
- **Priority**: high
- **Depends On**: None
- **Description**: 
  - 改造 HomePage，添加游戏标题"Echo House: Memory Butler"
  - 设计游戏风格的界面，添加开始游戏按钮
  - 添加游戏简介和特色说明
- **Acceptance Criteria Addressed**: AC-1
- **Test Requirements**:
  - `human-judgement` TR-2.1: 首页看起来像游戏首页，有游戏标题和开始按钮
  - `human-judgement` TR-2.2: 界面美观，符合游戏风格
- **Notes**: 使用深色主题，添加一些视觉效果

## [x] Task 3: 关卡选择页改造
- **Priority**: high
- **Depends On**: Task 2
- **Description**: 
  - 改造 TaskSelectPage，添加四个关卡卡片
  - 每个卡片显示关卡名、描述、难度标识
  - 添加关卡解锁状态显示
- **Acceptance Criteria Addressed**: AC-2
- **Test Requirements**:
  - `human-judgement` TR-3.1: 页面看起来像关卡选择界面
  - `human-judgement` TR-3.2: 四个关卡卡片清晰展示
- **Notes**: 使用游戏化的卡片设计，添加图标和颜色区分

## [x] Task 4: HUD 游戏化重构
- **Priority**: high
- **Depends On**: Task 1
- **Description**: 
  - 重构 HUD 组件，按照游戏化布局重新设计
  - 左上角：关卡名、任务 checklist、剩余时间
  - 顶部：混乱值 Chaos Meter、进度条、combo
  - 右上角：得分、评级预估、当前持有物体
  - 左下角：操作提示
  - 右下角：小地图（只显示已访问房间）
  - 底部中央：记忆槽 UI（3个槽位，可点击覆盖或锁定）
- **Acceptance Criteria Addressed**: AC-7
- **Test Requirements**:
  - `human-judgement` TR-4.1: HUD 布局符合游戏化要求
  - `human-judgement` TR-4.2: 记忆槽 UI 清晰显示，可交互
  - `human-judgement` TR-4.3: 混乱值、得分、combo 实时更新显示
- **Notes**: 需要添加混乱值颜色变化（绿色→黄色→红色），combo 浮动文字效果

## [x] Task 5: 有限记忆槽交互实现
- **Priority**: high
- **Depends On**: Task 1, Task 4
- **Description**: 
  - 实现按 E 键保存记忆功能
  - 实现记忆槽满时选择覆盖逻辑
  - 实现锁定/解锁记忆功能
  - 添加记忆槽闪烁效果
- **Acceptance Criteria Addressed**: AC-3
- **Test Requirements**:
  - `human-judgement` TR-5.1: 靠近物体按 E 键保存记忆
  - `human-judgement` TR-5.2: 记忆槽满时提示选择覆盖
  - `human-judgement` TR-5.3: 锁定记忆不会被覆盖
- **Notes**: 需要在 FirstPersonControls 中添加 E 键监听

## [x] Task 6: 混乱值和评分逻辑实现
- **Priority**: high
- **Depends On**: Task 1
- **Description**: 
  - 实现时间流逝增加混乱值
  - 实现放错物体增加混乱值和扣分
  - 实现重复搜索增加混乱值和扣分
  - 实现忘记关闭容器增加混乱值
  - 实现正确操作加分和增加 combo
  - 实现 combo 得分倍率
- **Acceptance Criteria Addressed**: AC-4, AC-5
- **Test Requirements**:
  - `programmatic` TR-6.1: 混乱值随时间增加（每秒+1）
  - `programmatic` TR-6.2: 放错物体混乱值+10，得分-50
  - `programmatic` TR-6.3: 正确放置得分+100，combo+1
  - `programmatic` TR-6.4: 混乱值达到100时触发关卡失败
- **Notes**: combo 倍率公式：1 + (combo - 1) * 0.1，最大2.0倍

## [x] Task 7: 第一关「出门大作战」改造
- **Priority**: high
- **Depends On**: Task 1, Task 4, Task 5, Task 6
- **Description**: 
  - 改造 leave-home.ts 任务配置，添加游戏化元素
  - 添加捣乱事件：猫把钥匙推到地毯下，手机响一次提示位置
  - 设置关卡时间限制
  - 添加任务目标 checklist
- **Acceptance Criteria Addressed**: AC-6
- **Test Requirements**:
  - `human-judgement` TR-7.1: 第一关可以正常进入和游玩
  - `human-judgement` TR-7.2: 至少有2个捣乱事件触发
  - `human-judgement` TR-7.3: 可以完成任务目标
- **Notes**: 时间限制设为60秒，捣乱事件在混乱值达到一定程度时触发

## [x] Task 8: 即时反馈效果实现
- **Priority**: medium
- **Depends On**: Task 1, Task 4
- **Description**: 
  - 正确放置时绿色发光提示
  - 错误放置时红色警告
  - 捣乱事件触发时剧情提示
  - combo 增加时浮动文字
  - 混乱值高时 HUD 故障效果
- **Acceptance Criteria Addressed**: AC-8
- **Test Requirements**:
  - `human-judgement` TR-8.1: 正确放置有绿色反馈
  - `human-judgement` TR-8.2: 错误放置有红色反馈
  - `human-judgement` TR-8.3: combo 增加有浮动文字
- **Notes**: 使用 CSS 动画实现反馈效果

## [x] Task 9: 游戏化结算页改造
- **Priority**: high
- **Depends On**: Task 1, Task 6
- **Description**: 
  - 改造 ResultPage，添加游戏化统计数据
  - 显示最终得分、评级（S/A/B/C/D）、称号
  - 显示完成时间、combo 最大值、错误放置次数等
  - 添加 AI 机器人诊断报告
- **Acceptance Criteria Addressed**: AC-9
- **Test Requirements**:
  - `human-judgement` TR-9.1: 结算页看起来像游戏结算界面
  - `human-judgement` TR-9.2: 所有统计数据正确显示
  - `human-judgement` TR-9.3: AI 诊断报告显示正确
- **Notes**: 评级规则：S(900+), A(700+), B(500+), C(300+), D(<300)

## [x] Task 10: AI 模块改造
- **Priority**: medium
- **Depends On**: Task 9
- **Description**: 
  - analyzeSession 重命名为 generateRobotDiagnosis
  - updateRobotMemory 重命名为 memorySlotSuggestion
  - 修改输出语言为机器人诊断报告风格
- **Acceptance Criteria Addressed**: AC-9
- **Test Requirements**:
  - `human-judgement` TR-10.1: AI 诊断报告语言像游戏中的机器人报告
  - `programmatic` TR-10.2: 函数调用正常工作
- **Notes**: 保留 function calling 风格，方便比赛说明

## [x] Task 11: 其他三个关卡改造和测试
- **Priority**: medium
- **Depends On**: Task 1, Task 4, Task 5, Task 6, Task 7
- **Description**: 
  - 改造关卡2「餐桌混乱」
  - 改造关卡3「洗衣幽灵」
  - 改造关卡4「早餐时间循环」
  - 测试确保每个关卡可以正常进入和游玩
- **Acceptance Criteria Addressed**: AC-10
- **Test Requirements**:
  - `human-judgement` TR-11.1: 关卡2可以正常进入和游玩
  - `human-judgement` TR-11.2: 关卡3可以正常进入和游玩
  - `human-judgement` TR-11.3: 关卡4可以正常进入和游玩
- **Notes**: 重点确保基本功能正常，捣乱事件可以后续添加

## [x] Task 12: 构建验证和错误检查
- **Priority**: high
- **Depends On**: All tasks
- **Description**: 
  - 运行 npm run build 验证构建成功
  - 检查控制台是否有严重报错
  - 修复构建错误和运行时错误
- **Acceptance Criteria Addressed**: AC-11, AC-12
- **Test Requirements**:
  - `programmatic` TR-12.1: npm run build 成功完成
  - `programmatic` TR-12.2: 控制台无红色错误
- **Notes**: 需要确保所有 TypeScript 类型正确，无类型错误

## [x] Task 13: 程序化低模模型库重构
- **Priority**: high
- **Depends On**: Task 1
- **Description**: 
  - 重构 ObjectGeometries.tsx
  - 实现 KeyModel、PhoneModel、UmbrellaModel、MilkCartonModel、CerealBoxModel、CupModel、BowlModel、PlateModel、RemoteModel、ClothModel、TowelModel、TrashModel
  - 每个模型必须由基础几何体组合而成，保持低多边形风格
  - 替换 Object3D 中原先的方块或简单占位渲染
- **Acceptance Criteria Addressed**: AC-13
- **Test Requirements**:
  - `human-judgement` TR-13.1: 关键任务物体不再像色块或方块
  - `human-judgement` TR-13.2: 玩家能一眼识别钥匙、手机、雨伞、牛奶、麦片、杯子、衣物
  - `programmatic` TR-13.3: npm run build 成功

## [x] Task 14: 家具与容器模型精致化
- **Priority**: high
- **Depends On**: Task 13
- **Description**: 
  - 优化 Container3D 和新增 Furniture 模型
  - 实现 FridgeModel、CabinetModel、SinkModel、DishwasherModel、SofaModel、CoffeeTableModel、BedModel、DeskModel、LaundryBasketModel、EntranceTrayModel
  - 容器需要保留 open / close 状态表现
  - 目标容器需要保留可放置判定和高亮
- **Acceptance Criteria Addressed**: AC-14
- **Test Requirements**:
  - `human-judgement` TR-14.1: 每个房间看起来有明确生活功能
  - `human-judgement` TR-14.2: 冰箱、柜子、洗衣篮、玄关托盘等关键容器可识别
  - `programmatic` TR-14.3: pick、place、open、close 逻辑没有被破坏

## [x] Task 15: 房间生活感和视觉锚点增强
- **Priority**: medium
- **Depends On**: Task 14
- **Description**: 
  - 优化 Room3D 和 Scene3D
  - 每个房间增加至少 3 个视觉锚点
  - 为不同房间设置不同地面或主色调
  - 添加地毯、台灯、靠枕、挂钩、鞋柜、毛巾架等轻量装饰
- **Acceptance Criteria Addressed**: AC-15
- **Test Requirements**:
  - `human-judgement` TR-15.1: 玩家能从视觉上区分玄关、客厅、厨房、卧室、洗衣区、餐厅
  - `human-judgement` TR-15.2: 场景不再像空房间测试场
  - `programmatic` TR-15.3: 帧率保持流畅

## [x] Task 16: 材质、灯光、阴影和交互反馈
- **Priority**: medium
- **Depends On**: Task 13, Task 14
- **Description**: 
  - 建立共享材质和 palette
  - 优化 Lighting 或 Scene3D 中的光照配置
  - 增加接触阴影或阴影效果
  - 增加 hover glow、正确放置脉冲、错误放置抖动、记忆保存闪烁、捣乱事件脚印或滑动轨迹
- **Acceptance Criteria Addressed**: AC-16
- **Test Requirements**:
  - `human-judgement` TR-16.1: 场景有明显光影层次
  - `human-judgement` TR-16.2: 关键物体有清晰交互反馈
  - `human-judgement` TR-16.3: 保存记忆、正确放置、错误放置、捣乱事件都有可见反馈
  - `programmatic` TR-16.4: npm run build 成功
