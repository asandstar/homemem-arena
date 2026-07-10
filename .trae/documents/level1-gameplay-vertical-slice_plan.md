# Echo House: Memory Butler — 第一关 Gameplay Vertical Slice 改造计划

## 一、可玩性诊断 (PLAYTEST_NOTES)

基于对当前代码库的静态分析和结构审查，以下是当前第一关「出门大作战」的 10 个核心可玩性问题：

### P-1 目标太多，教学负担过重
当前第一关有 4 个目标（钥匙、手机、雨伞、充电宝），每个都在不同房间。新玩家需要同时学习：移动、拾取、放置、开关容器、记忆槽、捣乱事件。目标数量 4 个对于教学关来说太多，应该精简为 3 个（钥匙、手机、雨伞），充电宝移到后续关卡或作为隐藏 bonus。

### P-2 没有循序渐进的教程引导
当前 briefing 是一整段文字，玩家需要自己摸索操作。缺少分步引导：
- 不知道怎么移动（WASD + 鼠标）
- 不知道怎么拾取/放置（F 键）
- 不知道怎么保存记忆（E 键）
- 不知道记忆槽有什么用
- briefing 太长，玩家不会仔细读

### P-3 记忆槽系统存在感弱，不影响决策
虽然已有 3 个记忆槽的代码实现，但：
- 玩家没有强烈的"我需要记住这个"的动机
- 记忆槽满了没有覆盖选择的交互
- 记忆过期/置信度机制未实现
- 锁定记忆槽的功能存在但玩家不知道怎么用
- 结算页没有记忆使用统计

### P-4 混乱值增长太慢，没有压力感
当前 `tickElapsed` 每秒加 1 chaos，90 秒才 90，加上事件 +5×几次，很难到 100。玩家感觉不到时间压力。错误放置、重复搜索的惩罚也太轻（+5 chaos），不足以制造决策压力。

### P-5 脚本事件触发太机械
事件按 step 数硬触发（step=5 猫推钥匙，step=6 手机响，step=8 妈妈移钥匙），感觉像"到点了就发生"而不是"因为玩家行为而发生"。应该改成基于玩家行为触发（比如第一次离开客厅后猫推钥匙），更有叙事感。

### P-6 事件反馈太弱
猫推钥匙、手机响这些事件只用 `showFeedback` 显示一行文字，没有：
- 视觉特效（脚印、信号波纹）
- 音效或震动感
- 对记忆系统的影响（旧记忆标记为过期）
- 玩家没有"哇，真的被移动了"的惊喜感

### P-7 HUD 信息过载，布局混乱
当前 HUD 把任务清单、混乱值、combo、记忆槽、事件日志、小地图、操作提示全堆在一起，像仪表盘而不是游戏界面。研究数据（事件日志、session JSON）和游戏数据混在一起，干扰沉浸感。

### P-8 缺少即时视觉反馈
- 拾取/放置物体只有文字提示，没有浮动分数
- combo 增加没有视觉冲击
- 错误操作（放错地方）没有红闪/抖动反馈
- 保存记忆没有从物体到记忆槽的视觉连线
- 目标完成没有 checklist 打勾动画

### P-9 结算页不够"游戏化"
当前结算页有评分和星级，但缺少：
- 大号 S/A/B/C/D 评级（已有但不够醒目）
- 记忆相关统计（记忆使用次数、过期次数、有效记忆率）
- 更有个性的 AI 诊断报告（已有但不够游戏化）
- 关卡完成过渡动画（直接跳结果页太突兀）

### P-10 关卡选择页不像游戏关卡
TaskSelectPage 的卡片布局普通，缺少：
- 关卡编号和进度感
- 最佳评级/通关状态
- 核心机制标签
- 剧情文案
- 未解锁/开发中的关卡视觉区分

---

## 修订版执行范围（P0 Playable Vertical Slice）

本轮严格控制范围，只做第一关 playable vertical slice：

### 本轮必做
1. PLAYTEST_NOTES.md 保留
2. levelBalance.ts + scoring.ts + chaos.ts + memorySlots.ts 最小可用版
3. useGameStore.ts 扩展：过期记忆、浮动文字、事件 toast
4. leave-home.ts：主目标精简为钥匙/手机/雨伞
5. 重构第一关事件触发条件
6. HUD 核心五区域：LevelObjectivePanel / ChaosComboBar / ScorePanel / MemorySlotBar / ContextActionHint
7. 最小反馈：FloatingText / EventToast / CatPrintsEffect / PhoneRingEffect
8. ResultPage 升级：评级/称号/得分/combo/混乱峰值/记忆统计/AI 诊断
9. 其他三关保持可进入

### 本轮不做
- 不下载/替换模型
- 不引入新依赖
- 不重写 3D 场景系统
- 不把研究数据放回主 HUD
- 不深度开发 2/3/4 关
- 不重构 TaskSelectPage

---

## 二、第一关改造方案

### 关卡定位
**教学关 + 空间记忆关** — 用 3 个目标物教玩家核心循环，引入记忆槽和捣乱事件。

### 核心目标（从 4 个精简为 3 个）
找到**钥匙**、**手机**、**雨伞**，放到玄关托盘。
（充电宝删除，或作为 bonus 目标不计入主目标）

### 时间限制
从 90 秒改为 **180 秒**（教学关需要更多学习时间，用混乱值而非时间制造压力）。

### 教程流程（可选跳过）
```
进入关卡 → Briefing 弹窗（8秒可读）
  ↓
[引导1] 移动到客厅（WASD + 鼠标）
  ↓
[引导2] 观察钥匙，按 E 保存记忆
  ↓
[引导3] 按 F 拾取钥匙
  ↓
[引导4] 走到玄关托盘，按 F 放置
  ↓
[自由探索] 手机、雨伞开放
  ↓
[事件1] 第一次离开客厅 → 猫推钥匙（记忆过期）
  ↓
[事件2] 进入卧室/客厅 → 手机响铃提示
  ↓
全部放置完成 → 结算
```

---

## 三、文件修改清单

### 新增文件

| 文件路径 | 说明 |
|---------|------|
| `src/data/levelBalance.ts` | 关卡数值配置（chaos增长、得分、combo等） |
| `src/game/scoring.ts` | 得分计算逻辑（pick/place/combo/memory/penalty） |
| `src/game/chaos.ts` | 混乱值计算逻辑（增长/事件/惩罚阈值） |
| `src/game/memorySlots.ts` | 记忆槽逻辑（保存/过期/锁定/覆盖） |
| `src/components/arena3d/hud/MemorySlotBar.tsx` | 底部中央记忆槽 UI |
| `src/components/arena3d/hud/ChaosComboBar.tsx` | 顶部中央混乱值+combo |
| `src/components/arena3d/hud/ScorePanel.tsx` | 右上角分数面板 |
| `src/components/arena3d/hud/LevelObjectivePanel.tsx` | 左上节目面板 |
| `src/components/arena3d/hud/ContextActionHint.tsx` | 左下角操作提示 |
| `src/components/arena3d/feedback/FloatingText.tsx` | 浮动文字特效 |
| `src/components/arena3d/feedback/EventToast.tsx` | 事件弹窗提示 |
| `src/components/arena3d/feedback/PulseEffect.tsx` | 脉冲光效 |
| `src/components/arena3d/feedback/CatPrintsEffect.tsx` | 猫脚印特效 |
| `src/components/arena3d/feedback/PhoneRingEffect.tsx` | 手机震动波纹 |
| `.trae/documents/PLAYTEST_NOTES.md` | 可玩性诊断文档 |

### 修改文件

| 文件路径 | 修改内容 |
|---------|---------|
| `src/store/useGameStore.ts` | 增加 confidence/outdatedMemory 字段、tutorial 状态、记忆覆盖逻辑、chaos 分级效果 |
| `src/data/tasks/leave-home.ts` | 精简为 3 个目标、重写事件触发条件、增加教程步骤、调整时间为 180s |
| `src/components/arena3d/HUD.tsx` | 重构为六大区域布局，研究数据移到右侧抽屉 |
| `src/pages/ArenaPage.tsx` | 增加教程引导、结算过渡、研究抽屉 |
| `src/pages/ResultPage.tsx` | 升级为游戏化结算（评级/称号/记忆统计/AI诊断） |
| `src/pages/TaskSelectPage.tsx` | 升级为关卡选择界面 |
| `src/components/tasks/TaskCard.tsx` | 增加关卡编号、最佳评级、通关状态 |
| `src/components/arena3d/FirstPersonControls.tsx` | 增加教程引导触发、F/E 键反馈 |
| `src/components/arena3d/Object3D.tsx` | 增加拾取/放置浮动文字、success/error 脉冲 |
| `src/components/arena3d/ChaosEffect.tsx` | 增强混乱值 glitch 效果（分级） |
| `src/ai/analyzeSession.ts` | 升级为机器人诊断风格，增加记忆分析 |

---

## 四、数据结构变更

### MemorySlot 增加字段
```typescript
interface MemorySlot {
  id: string
  objectName: string
  roomName: string
  containerName: string | null
  state: string
  timestamp: number
  locked: boolean
  // 新增
  confidence: number      // 0-100，随时间和事件衰减
  outdated: boolean       // 是否被事件标记为过期
  entityConfigId: string  // 关联的实体 configId，用于匹配更新
}
```

### GameState 增加字段
```typescript
interface GameState {
  // ... 现有字段
  tutorialStep: number               // 当前教程步骤 (-1 = 已跳过/完成)
  tutorialVisible: boolean           // 教程提示是否显示
  outdatedMemoryCount: number        // 过期记忆次数
  memoryUpdateCount: number          // 记忆更新次数
  chaosPeak: number                  // 混乱值峰值
  levelStartTransition: boolean      // 关卡开始过渡
  levelEndTransition: boolean        // 关卡结束过渡
  floatingTexts: FloatingText[]      // 浮动文字队列
  eventToasts: EventToast[]          // 事件弹窗队列
}
```

### LevelBalance 配置
```typescript
interface LevelBalanceConfig {
  timeLimit: number
  chaosGrowthPerSecond: number
  wrongPlacementChaos: number
  repeatSearchChaos: number
  outdatedMemoryChaos: number
  eventChaos: number
  maxChaos: number
  chaosGlitchThreshold: number       // 60
  chaosEventBoostThreshold: number   // 80
  memorySlotCount: number
  basePickScore: number
  baseCorrectPlaceScore: number
  baseMemoryUseScore: number
  baseMemoryUpdateScore: number
  wrongPlacePenalty: number
  repeatSearchPenalty: number
  maxComboMultiplier: number
  comboMultiplierStep: number
  timeBonusRate: number              // 每秒剩余时间奖励分
}
```

---

## 五、实施步骤（分阶段）

### Phase 1: 可玩性诊断
- 生成 PLAYTEST_NOTES.md
- 确认 10 个核心问题

### Phase 2: 数据层改造
- 创建 levelBalance.ts 配置
- 创建 scoring.ts / chaos.ts / memorySlots.ts 游戏逻辑模块
- 更新 useGameStore.ts 增加新状态和动作

### Phase 3: 第一关重构
- 精简 leave-home.ts 为 3 个目标
- 重写事件触发条件（基于玩家行为而非 step 数）
- 增加教程引导系统
- 调整时间和数值平衡

### Phase 4: HUD 重构
- 拆分为六个子组件：LevelObjectivePanel / ChaosComboBar / ScorePanel / MemorySlotBar / ContextActionHint / ResearchDrawer
- 研究数据默认收起
- 统一视觉风格

### Phase 5: 即时反馈系统
- FloatingText 浮动分数
- EventToast 事件弹窗
- PulseEffect 成功/失败脉冲
- CatPrintsEffect 猫脚印
- PhoneRingEffect 手机波纹

### Phase 6: 结算页升级
- 大号评级 S/A/B/C/D
- 称号系统
- 记忆统计（使用次数/过期次数/有效率）
- AI 机器人诊断报告
- 关卡过渡动画

### Phase 7: 关卡选择页升级
- 关卡编号、核心机制、难度、最佳评级
- 剧情文案
- 开发中标示

### Phase 8: 构建验证与联调
- npm run build 通过
- 第一关完整可玩
- 控制台无严重错误

---

## 六、假设与决策

1. **尽量复用现有结构**：所有新功能都基于 useGameStore、task config、scriptedEvents 等现有系统扩展，不重写底层。
2. **第一关优先**：其他三个关卡保持可进入、可完成，但不深度开发。
3. **研究数据保留**：事件日志、session JSON、AI 诊断全部保留，但移到右侧可收起抽屉，默认不显示。
4. **不引入新依赖**：所有特效用 CSS + Three.js 原生实现，不用额外动画库。
5. **记忆过期通过事件驱动**：脚本事件移动物体时，自动标记相关记忆为 outdated，而非时间衰减（这样更可预测、更公平）。
6. **教程可跳过**：按 ESC 或点击"跳过教程"直接进入自由探索。
7. **手机响铃给房间级提示**：不直接标位置，只提示方向/房间，保持记忆游戏的挑战性。

## 七、风险与应对

| 风险 | 应对 |
|-----|------|
| 教程引导过于线性，玩家厌烦 | 教程只引导 3 步（移动→保存→拾取放置），然后立刻开放自由探索 |
| 混乱值数值难调 | 集中配置在 levelBalance.ts，方便快速迭代 |
| HUD 重构后信息缺失 | 保留 TAB 键切换显示完整信息 |
| 特效太多影响性能 | 特效用 CSS 动画 + 简单 Three.js 几何体，控制数量 |
| 记忆系统太复杂玩家学不会 | 第一关只有钥匙会被移动，制造一次"记忆过期"的体验，让玩家明白记忆槽的价值 |
