# HomeMem Arena 复赛 Vertical Slice 规划

> 版本：v1.0  
> 日期：2026-07-21  
> 状态：规划阶段，未修改代码

## 一、统一产品真值源

### 1.1 当前实际关卡数量

代码中实际定义了 **5 个关卡**，来源：[src/data/tasks/index.ts#L9-L15](../src/data/tasks/index.ts#L9-L15)

```typescript
export const taskTemplates: TaskConfig[] = [
  cleanTableTask,      // 第1关：初次整理（教学关）
  leaveHomeTask,       // 第2关：出门大作战（核心展示关）
  laundrySortTask,     // 第3关：洗衣幽灵
  breakfastTask,       // 第4关：早餐时间循环
  nightPatrolTask,     // 第5关：深夜巡逻
]
```

### 1.2 关卡数量不一致问题

| 位置 | 声称关卡数 | 实际情况 | 文件 |
|------|----------|---------|------|
| README.md 特色 | 5 关 | "一天时间线"列出 5 个时间段" | [README.md#L23](../README.md#L23) |
| README.md 关卡表格 | 4 关 | "四个关卡"标题 + 4 行表格（缺早餐时间循环） | [README.md#L26-L34](../README.md#L26-L34) |
| README.md 代码结构 | 4 关 | "四个任务配置" | [README.md#L85](../README.md#L85) |
| README.md 路由表 | 5 个关卡 | "选择 5 个关卡" | [README.md#L105](../README.md#L105) |
| HomePage | 4 关 | 硬编码 `levels` 数组 4 项（缺深夜巡逻） | [HomePage.tsx#L10-L15](../src/pages/HomePage.tsx#L10-L15) |
| HomePage 核心数据 | 4 关 | "4 关卡设计"数字 | [HomePage.tsx#L98-L99](../src/pages/HomePage.tsx#L98-L99) |
| TaskSelectPage | 5 关 | 使用 `taskTemplates`（5项） | [TaskSelectPage.tsx#L4](../src/pages/TaskSelectPage.tsx#L4) |
| TaskSelectPage 时间线 | 5 段 | `timeSlots` 5 个时间段 | [TaskSelectPage.tsx#L10-L16](../src/pages/TaskSelectPage.tsx#L10-L16) |

**README 内部矛盾**：特色部分说"五个关卡，但表格只列了 4 个（缺少第 3 关"早餐时间循环"），代码结构也写"四个任务配置"，但路由表又写 5 个。实际 5 关：初次整理、出门大作战、洗衣幽灵、早餐时间循环、深夜巡逻。

### 1.3 HomePage 硬编码问题

[HomePage.tsx#L10-L15](../src/pages/HomePage.tsx#L10-L15) 中硬编码了独立的关卡列表：

```typescript
const levels = [
  { icon: '🚪', name: '出门大作战', desc: '...' },
  { icon: '🍽️', name: '餐桌混乱', desc: '...' },
  { icon: '👕', name: '洗衣幽灵', desc: '...' },
  { icon: '⏰', name: '早餐时间循环', desc: '...' },
]
```

问题：
- 与实际 `taskTemplates` 顺序不一致（出门大作战排第一，但实际是第二关）
- 缺少第 5 关（深夜巡逻）
- 名称不一致（"餐桌混乱" vs "初次整理"）
- 描述文案与任务配置中的 description 不同步

### 1.4 统一展示元数据设计

**方案**：在 `src/data/tasks/index.ts` 中导出 `taskPresentationById` 对象，存储页面展示需要的元数据。`taskTemplates` 继续作为任务数量和顺序的唯一真值源。

`taskPresentationById` 结构：
```typescript
type TaskRole = 'tutorial' | 'semifinal-core' | 'challenge'

interface TaskPresentation {
  role: TaskRole
  shortDescription: string
  estimatedMinutes: number
  icon?: string
}

export const taskPresentationById: Record<string, TaskPresentation> = {
  'task-clean-table': { role: 'tutorial', shortDescription: '...', estimatedMinutes: 2 },
  'task-leave-home': { role: 'semifinal-core', shortDescription: '...', estimatedMinutes: 4 },
  // ...
}
```

**修改文件**：
- `src/data/tasks/index.ts` — 新增 `taskPresentationById` 导出
- `src/pages/HomePage.tsx` — 遍历 `taskTemplates`，按 `taskId` 获取展示元数据
- `src/pages/TaskSelectPage.tsx` — 遍历 `taskTemplates`，按 `taskId` 获取展示元数据
- `README.md` — 对齐为 5 关，明确标注教学关和核心展示关

### 1.5 关卡定位

| 顺序 | 关卡 ID | 名称 | 定位 |
|------|---------|------|------|
| 1 | task-clean-table | 初次整理 | **教学关** — 60-90 秒学会基本操作 |
| 2 | task-leave-home | 出门大作战 | **复赛核心展示关** — 3-5 分钟完整记忆循环 |
| 3 | task-laundry-sort | 洗衣幽灵 | 后续挑战 — 计数记忆 + 幽灵扰动 |
| 4 | task-breakfast | 早餐时间循环 | 后续挑战 — 程序记忆 + 时间循环 |
| 5 | task-night-patrol | 深夜巡逻 | 后续挑战 — 黑暗环境 + 夜间扰动 |

---

## 二、压缩教学关

### 2.1 当前教学关分析

根据 [clean-table.ts](../src/data/tasks/clean-table.ts) 实际代码：

**物品和容器**：
- 3 件物品：脏杯子、餐巾纸、叉子
- 4 个容器：餐桌（放置面）、洗碗机（目标）、垃圾桶（目标）、餐具架（目标）

**脚本事件（共 12 个）**：
- `se-tutorial-welcome` (step=1) — 欢迎提示
- `se-tutorial-pickup` (step=2) — 拾取教学
- `se-tutorial-memory` (step=3) — 记忆教学
- `se-tutorial-place` (step=4) — 放置教学
- `se-cat-warning` (step=5) — 猫咪警告
- `se-cat-moves-fork` (step=8) — 猫咪移动叉子，标记记忆过期
- `se-cat-moves-tissue` (step=10) — 猫咪移动餐巾纸，标记记忆过期
- `se-tutorial-encourage` (step=12) — 鼓励玩家
- `se-tutorial-hint-dishwasher` (step=14) — 提示洗碗机位置
- `se-tutorial-hint-trash` (step=16) — 提示垃圾桶位置
- `se-tutorial-hint-fork` (step=18) — 提示餐具架位置

**当前问题**：
1. 事件过多（12 个），流程冗长，step 触发不考虑玩家进度
2. 猫咪移动事件（`se-cat-moves-fork`、`se-cat-moves-tissue`）只检查 step 数字，不检查玩家是否保存了该物品的记忆，导致"玩家保存了餐巾纸记忆，却让叉子记忆过期"的不合理情况
3. 所有目标答案持续显示在 HUD
4. 物体上有永久悬浮标签和距离数字
5. 没有渐进式引导（第一件全引导 → 第二件提示 → 第三件自主）
6. 完成后没有直接引导进入核心关

### 2.2 目标时长：60–90 秒

### 2.3 设计流程（Sprint D 执行）

| 阶段 | 内容 | 提示方式 | 预计时长 |
|------|------|---------|---------|
| 开场对话 | MEM-07 自我介绍，说明记忆故障 | 对话框 | 10 秒 |
| 第一件：杯子 | 全引导：指向杯子 → 按 F 拾取 → 指向洗碗机 → 按 F 放置 | 高亮 + 箭头 + 文字提示 | 20 秒 |
| 教学 E 键 | 靠近物品时提示按 E 保存记忆 | 浮窗提示 | 10 秒 |
| 第二件：餐巾纸 | 只提示目标："餐巾纸扔进垃圾桶"，不指示位置 | 当前目标文字 | 15 秒 |
| 小捣乱 | 猫咪移动已保存记忆的物品，标记记忆过期 | Toast 提示 | 5 秒 |
| 第三件：叉子 | 玩家自主完成，无额外提示 | 当前目标文字 | 20 秒 |
| 完成对话 | 恭喜 + 引导进入出门大作战 | 对话框 + 按钮 | 10 秒 |

### 2.4 记忆流程规则（Sprint D 执行）

**关键规则**：被猫移动的物品必须是玩家已经保存过记忆的物品。

- 猫咪事件触发条件必须包含：`玩家已保存该物品的记忆`
- 标记记忆过期的物品必须与被移动的物品一致
- 不允许：玩家保存了餐巾纸记忆，却让叉子记忆过期
- 不允许：玩家没有保存任何记忆，猫咪事件却触发并标记记忆过期

### 2.5 保留内容

- 三件物品（杯子、餐巾纸、叉子）和三个目标容器
- WASD 移动、F 拾取/放置、E 保存记忆
- 猫咪捣乱事件（简化为一次，只动玩家已保存记忆的物品）
- 记忆系统（3 个槽位）

### 2.6 删除内容

- 餐巾纸被移动事件（减少复杂度，只保留一次猫咪捣乱）
- 过多的提示 Toast（保存提示、更新提示、锁定提示）
- 任务面板中的完整目标列表（只保留当前单一目标）
- 物体上的永久悬浮名称和距离数字

### 2.7 修改文件（Sprint D 执行）

- `src/data/tasks/clean-table.ts` — 简化脚本事件，修正猫咪事件触发条件
- `src/dialog/dialogs.ts` — 重写教学关对话序列
- `src/components/arena3d/HUD.tsx` — 默认只显示当前单一目标
- `src/components/arena3d/Object3D.tsx` — 移除永久悬浮标签
- `src/components/arena3d/Container3D.tsx` — 移除永久悬浮距离

---

## 三、重做出门大作战核心循环

### 3.1 当前状态分析

当前 [leave-home.ts](../src/data/tasks/leave-home.ts) 包含：
- 3 件物品：钥匙（客厅茶几）、手机（卧室床头柜抽屉）、雨伞（玄关伞架）
- 目标：全部放入玄关托盘
- 脚本事件：
  - `se-cat-pushes-key`：step>2 且离开客厅时，钥匙被推到沙发旁
  - `se-phone-ringing`：手机响铃提示位置
  - `se-save-hint`：step=2 记忆系统提示
  - `se-owner-urgent-msg`：step=8 主人催促
  - `se-update-hint`：step=10 更新记忆提示
  - `se-memory-lock-hint`：step=4 记忆锁定提示

### 3.2 核心循环设计

必须确保玩家经历完整的记忆生命周期：

```
发现钥匙 → 保存钥匙记忆 → 离开客厅 → 猫移动钥匙
→ 旧记忆明确过期 → 玩家重新搜索 → 更新钥匙记忆
→ 找齐物品 → 放入玄关托盘 → 进入结算
```

### 3.3 问题与修复

#### 问题 1：猫事件可能绕过

**当前触发条件** [leave-home.ts#L173-L176](../src/data/tasks/leave-home.ts#L173-L176)：
```typescript
trigger: (step, entities, currentRoom) => {
  const key = entities.find((e) => e.configId === 'obj-key')
  return step > 2 && currentRoom !== 'living' && key?.currentRoom === 'living' && key?.status === 'free'
}
```

**问题**：如果玩家先拿了钥匙再离开客厅，事件不会触发。

**修复**：增加"玩家已保存钥匙记忆"作为触发条件之一。玩家可以拿了钥匙再保存，但必须至少保存过一次钥匙记忆，猫事件才会触发。

#### 问题 2：过期记忆反馈不足

**当前已有**：
- 记忆槽红边 + glitch 动画 [HUD.tsx#L608-L610](../src/components/arena3d/HUD.tsx#L608-L610)
- 红色 "!" 标记 [HUD.tsx#L625-L627](../src/components/arena3d/HUD.tsx#L625-L627)
- 音效 `memory_outdated` [memorySlice.ts#L172](../src/store/slices/memorySlice.ts#L172)
- 粒子效果 `playMemoryExpireEffect` [memorySlice.ts#L176-L177](../src/store/slices/memorySlice.ts#L176-L177)
- 全屏红色脉冲 [HUD.tsx#L246-L255](../src/components/arena3d/HUD.tsx#L246-L255)

**增强**（hypothesis：当前反馈已经不错，但需要更明确的文字提示）：
- 记忆过期时显示简短 Toast："⚠️ 钥匙的记忆过期了！"
- 靠近过期记忆的物品时，强化提示"按 E 更新记忆"

#### 问题 3：更新记忆奖励不足

**当前已有**：
- 更新记忆 +30 分 [memorySlice.ts#L72](../src/store/slices/memorySlice.ts#L72)
- 类型加分 [memorySlice.ts#L74-L78](../src/store/slices/memorySlice.ts#L74-L78)
- 浮动文字 + 粒子效果

**保留**：当前奖励机制已足够，无需新增。

#### 问题 4：手机抽屉提示太直接

**当前**：`se-phone-ringing` 事件直接说"卧室方向传来手机铃声！快去床头柜找找吧！"

**优化**：只说"📱 手机响了..."，不直接给答案。玩家需要自己去卧室找。抽屉打开后才能看到手机。

#### 问题 5：雨伞是无意义跑腿

**当前**：雨伞在玄关伞架上，目标也是玄关托盘。玩家只需要走几步。

**判断**：保留雨伞有两个理由：
1. 3 件物品对应 3 个记忆槽，教学意义明确
2. 雨伞在起点附近，给玩家一个"快速胜利"的正反馈
3. 难度递增：雨伞（简单）→ 钥匙（中等，有捣乱）→ 手机（难，要开抽屉）

**优化**：雨伞不作为第一个目标引导，让玩家自己发现。把"当前目标"聚焦在钥匙上。

### 3.4 三个目标保留判断

| 物品 | 保留？ | 理由 |
|------|--------|------|
| 🔑 钥匙 | ✅ 保留 | 核心记忆循环载体：保存 → 过期 → 更新 |
| 📱 手机 | ✅ 保留 | 增加探索深度（抽屉交互），铃声提示位置 |
| ☂️ 雨伞 | ✅ 保留 | 3 槽对应 3 物，难度梯度，快速正反馈 |

### 3.5 修改后的事件顺序

| 事件 | 触发条件 | 效果 |
|------|---------|------|
| 开场对话 | 任务开始 | 介绍任务和钥匙猫 |
| 保存提示 | 第一次靠近钥匙 | "按 E 保存钥匙位置记忆" |
| 猫移动钥匙 | 玩家已保存钥匙记忆 **且** 离开客厅 | 钥匙从茶几 → 沙发旁，记忆标记过期 |
| 过期提示 | 钥匙记忆过期 + 玩家回到客厅 | "⚠️ 钥匙的记忆过期了，找到后按 E 更新" |
| 手机铃声 | step >= 5 且手机未拿到 | "📱 手机响了..."（不说位置） |
| 主人催促 | 剩余 60 秒 | "公交车要来了！" |

### 3.6 修改文件

- `src/data/tasks/leave-home.ts` — 重写脚本事件触发条件
- `src/dialog/dialogs.ts` — 调整出门大作战对话
- `src/components/arena3d/HUD.tsx` — 强化过期记忆提示
- `src/store/slices/memorySlice.ts` — （可选）增加过期 Toast

---

## 四、精简 HUD

### 4.1 当前 HUD 元素分析

当前 [HUD.tsx](../src/components/arena3d/HUD.tsx) 包含：

| 位置 | 元素 | 状态 |
|------|------|------|
| 左上 | 任务面板（任务名 + 目标列表 + 当前专注） | 默认展开，可收起 |
| 顶部中央 | 得分 + 评级 + 时间 + 位置 + Combo + 混乱值 + 进度 | 永久显示 |
| 右上 | 小地图 + 房间清理状态 | 默认展开，可收起 |
| 左下 | 事件日志（默认隐藏，R 键切换） | 默认隐藏 |
| 左下 | 操作提示（默认隐藏） | 默认隐藏 |
| 底部中央 | 记忆槽（默认隐藏？） | 看 `memoryBarOpen` 状态 |
| 右下 | 交互提示 + 记忆保存/更新提示 | 靠近物体时显示 |
| 顶部中央偏下 | 事件 Toast | 事件触发时显示 |
| 全屏 | 混乱值特效（暗角、噪点、扫描线） | 混乱值 >20% 时 |
| 全屏 | 过期记忆红色脉冲 | 有过期记忆时 |
| 中央 | 反馈弹窗（成功/失败/事件） | 触发时 |

**问题**：
- 顶部中央信息条信息密度过高，遮挡场景
- 小地图太大（360px），占据右上大量空间
- 得分和评级在游戏过程中不必要
- 房间英文 ID 显示（`currentRoom`）对普通玩家无意义

### 4.2 游戏模式默认 HUD

**保留（5 项）**：

| 位置 | 元素 | 说明 |
|------|------|------|
| 左上 | 当前单一目标 | 只显示当前最高优先级目标，不是完整列表 |
| 底部中央 | 3 个记忆槽 | 常驻显示，小尺寸 |
| 中下 | 临时交互提示 | 靠近物体/容器时显示 |
| 顶部中央（小） | 混乱值 | 细条 + 百分比，很小 |
| 底部（持有物时） | 持有物提示 | 只在持有物品时显示 |

**默认隐藏/移除（8 项）**：

| 元素 | 处理方式 |
|------|---------|
| 实时评级 | 移到结算页 |
| 房间英文 ID | 删除 |
| 完整目标列表 | Tab 键展开查看，默认只显示当前目标 |
| 房间清理状态 | 移到研究面板或删除 |
| 大尺寸小地图 | 缩小为迷你图标，点击展开，默认收起 |
| 事件日志 | 保持 R 键切换，默认隐藏 |
| 持续操作说明 | 删除，教学关已经教过 |
| 距离数字和调试标签 | 从物体和容器悬浮标签中删除 |

### 4.3 HUD 布局草图

#### 1280×720 布局

```
┌─────────────────────────────────────────────────────────────┐
│ [当前目标]                                         [混乱值] │
│                                                             │
│                                                             │
│                                                             │
│                                                             │
│                    3D 场景区域                              │
│                                                             │
│                                                             │
│                                                             │
│                                                             │
│              [记忆槽 1] [记忆槽 2] [记忆槽 3]               │
│                  [交互提示（靠近时）]                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

尺寸：
- 当前目标：左上，宽 ~240px，高 ~60px
- 混乱值：右上，宽 ~120px，高 ~24px（细条）
- 记忆槽：底部中央，每个 ~64×48px，间距 8px
- 交互提示：记忆槽下方，文字 + 按键提示

#### 1440×900 布局

```
┌─────────────────────────────────────────────────────────────────┐
│ [当前目标]                                               [混乱值]│
│                                                                 │
│                                                                 │
│                                                                 │
│                                                                 │
│                      3D 场景区域                                │
│                                                                 │
│                                                                 │
│                                                                 │
│                                                                 │
│                                                                 │
│                [记忆槽 1] [记忆槽 2] [记忆槽 3]                 │
│                    [交互提示（靠近时）]                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

尺寸：
- 当前目标：左上，宽 ~280px，高 ~70px
- 混乱值：右上，宽 ~140px，高 ~28px
- 记忆槽：底部中央，每个 ~80×56px，间距 12px
- 交互提示：记忆槽下方，文字 + 按键提示

### 4.4 可展开的高级信息

- **Tab 键**：展开完整目标列表
- **M 键** 或点击小地图图标：展开小地图
- **R 键**：展开事件日志
- **H 键**：隐藏所有 HUD（拍照模式）

### 4.5 修改文件

- `src/components/arena3d/HUD.tsx` — 大幅精简，重构布局
- `src/components/arena3d/Object3D.tsx` — 移除悬浮标签中的距离数字
- `src/components/arena3d/Container3D.tsx` — 移除悬浮标签中的距离数字
- `src/components/arena3d/Minimap.tsx` — 增加迷你模式
- `src/store/useUiStore.ts` — 调整 UI 状态默认值

---

## 五、场景和视觉方向

### 5.1 风格定义

**"温暖低多边形家庭场景 + 像素化机器人系统 UI"**

- 场景：低多边形、暖色调、生活化、有温度
- UI：像素风、科技感、机器人系统界面（对比场景的温暖）
- 过渡：HUD 像素边框 + 半透明深色背景

### 5.2 当前场景问题

基于 [Room3D.tsx](../src/components/arena3d/Room3D.tsx) 和 [Scene3D.tsx](../src/components/arena3d/Scene3D.tsx) 分析：

| 问题 | 位置 | 说明 |
|------|------|------|
| 餐厅像测试场 | [Room3D.tsx#L765-L861](../src/components/arena3d/Room3D.tsx#L765-L861) | 餐桌在正中央，周围空荡荡，像目标容器测试场 |
| 房间名称悬浮标签 | [Room3D.tsx#L1071-L1085](../src/components/arena3d/Room3D.tsx#L1071-L1085) | 永久显示的大 Billboard，破坏沉浸感 |
| 大面积空墙 | 各房间 | 纯色墙没有装饰，显得空洞 |
| 物体永久悬浮标签 | [Object3D.tsx#L251-L287](../src/components/arena3d/Object3D.tsx#L251-L287) | hover 时显示名称、类别、距离、操作 |
| 目标物体永久高亮 | [Object3D.tsx#L289-L291](../src/components/arena3d/Object3D.tsx#L289-L291) | `TaskTargetGlow` 永久显示金色光环和 "★ 名称" |
| 家具布局合理性 | 各房间 | hypothesis：部分家具位置可能不符合真实家庭逻辑 |

### 5.3 餐厅改造（教学关场景）

**目标**：从"目标容器测试场"变成"真实的家庭餐厅"

调整方向：
- 餐桌不要在房间正中央，稍微偏一点
- 增加餐椅（已有 2 把，增加到 4 把）
- 增加餐边柜或置物架
- 墙上增加装饰（画、时钟已有）
- 地面地毯（已有）
- 减少空墙面积

**注意**：不新增模型采购，用现有的 Fallback 模型组合。

### 5.4 客厅和玄关主视线

出门大作战的主移动路径：玄关 ↔ 客厅 ↔ 卧室

优化方向：
- 玄关：入口 → 鞋架 → 玄关托盘 → 伞架 → 客厅门，形成清晰动线
- 客厅：沙发 + 茶几（钥匙位置）+ TV，形成主视线
- 确保关键物体（钥匙、手机、雨伞）有足够的识别度

### 5.5 关键物体高识别度

当前 [Object3D.tsx](../src/components/arena3d/Object3D.tsx) 中：
- 钥匙：金色 `#fbbf24`，特殊 glow 颜色 [Object3D.tsx#L91-L92](../src/components/arena3d/Object3D.tsx#L91-L92)
- 任务目标物体：永久金色光环 + "★ 名称" [Object3D.tsx#L289-L358](../src/components/arena3d/Object3D.tsx#L289-L358)

**优化**：
- 移除永久金色光环和 ★ 标签（太像答案了）
- 改为：靠近时才显示交互提示
- 关键物体（钥匙）用独特的颜色和形状保证识别度
- 不需要额外标记，玩家应该自己发现

### 5.6 装饰物增加生活感

**已有装饰物**（来自 Room3D）：
- 地毯、植物、画、时钟、灯、书架、抱枕、鞋子
- 小物件：遥控器、水果碗、书、相框

**可以增加的**（用现有模型组合，不新增采购）：
- 更多墙上装饰（画、时钟、架子）
- 地面更多小物件
- 桌上更多杂物（书、杯子、遥控器）

**原则**：装饰物不增加交互负担，纯视觉。

### 5.7 减少纯色大面积空墙

方法：
- 增加墙饰（画、架子、挂钩）
- 增加靠窗的感觉（hypothesis：当前没有窗户模型）
- 墙色增加细微变化或纹理

### 5.8 取消永久悬浮信息

需要移除/修改：

| 元素 | 当前状态 | 修改后 |
|------|---------|--------|
| 房间名称 Billboard | 永久显示 [Room3D.tsx#L1071-L1085](../src/components/arena3d/Room3D.tsx#L1071-L1085) | 删除，或进入房间时短暂显示后消失 |
| 物体名称 + 类别 + 距离 | hover 时显示 [Object3D.tsx#L251-L287](../src/components/arena3d/Object3D.tsx#L251-L287) | hover 时只显示名称 + 操作提示，删除距离和类别 |
| 容器名称 + 距离 | hover 或目标区时显示 [Container3D.tsx#L201-L237](../src/components/arena3d/Container3D.tsx#L201-L237) | hover 时只显示名称 + 操作提示，删除距离 |
| 目标物体金色光环 | 永久显示 [Object3D.tsx#L289-L291](../src/components/arena3d/Object3D.tsx#L289-L291) | 删除永久显示，改为靠近时微光 |
| 目标区悬浮标签 | 永久显示 [Container3D.tsx#L163-L199](../src/components/arena3d/Container3D.tsx#L163-L199) | 删除永久显示，靠近时才显示 |

### 5.9 修改文件

- `src/components/arena3d/Room3D.tsx` — 删除房间名称 Billboard，增加餐厅装饰
- `src/components/arena3d/Object3D.tsx` — 精简 hover 标签，移除永久目标光环
- `src/components/arena3d/Container3D.tsx` — 精简 hover 标签，移除永久目标标签
- `src/components/arena3d/Scene3D.tsx` — （可选）调整房间光照

---

## 六、首页和任务选择页

### 6.1 当前首页分析

当前 [HomePage.tsx](../src/pages/HomePage.tsx) 结构：
1. 顶部：标题 + 副标题 + 赛道标签
2. 中间大卡片：
   - 失忆的家务机器人介绍
   - 4 个特色卡片（有限记忆槽、捣乱事件、混乱值系统、星级评分）
   - 核心数据（3 记忆槽、4 关卡、5+ 记忆类型、3D 场景）
   - 关卡一览（4 关硬编码）
   - 记忆类型介绍
   - 主要 CTA："开始闯关"
   - 音效开关
3. 底部：版权信息

**问题**：
- 首屏信息太多，核心概念不突出
- 没有"立即开始 5 分钟体验"的快速入口
- 技术原理入口不明显
- 关卡数量与实际不一致（4 vs 5）
- 硬编码关卡列表

### 6.2 首页首屏设计

**首屏必须包含**：

1. **一句话核心概念**  
   "你是记忆有限的家务机器人，在会捣乱的房子里完成任务。"

2. **立即开始 5 分钟体验按钮**  
   大按钮，直接进入教学关（不是任务选择页）  
   文案："🎮 立即开始 5 分钟体验"

3. **了解技术原理的次级入口**  
   小按钮或文字链接，跳转到下方或单独页面  
   文案："了解研究背景 →"

**首屏下方**放置详细内容：
- 游戏特色
- 关卡介绍
- 记忆类型
- 研究数据说明

### 6.3 任务选择页优化

当前 [TaskSelectPage.tsx](../src/pages/TaskSelectPage.tsx) 用时间线布局，5 关都一样重要。

**优化**：
- 教学关和核心展示关视觉上更突出（更大、更亮）
- 其他 3 关标记为"后续挑战"，可以稍暗或加锁图标
- 增加"快速开始"按钮，直接进入核心展示关
- 统一从 `gameManifest` 读取关卡顺序和元数据

### 6.4 修改文件

- `src/pages/HomePage.tsx` — 重排首页结构，首屏精简
- `src/pages/TaskSelectPage.tsx` — 突出教学关和核心关
- `src/data/tasks/index.ts` — 新增 `gameManifest`

---

## 七、结算页

### 7.1 当前结算页状态

当前 [ResultPage.tsx](../src/pages/ResultPage.tsx) 已经包含：

**已有的指标（第 179-228 行）**：
- 完成时间、最大 Combo、混乱峰值、错误放置
- 保存记忆、更新记忆、过期记忆、有效记忆率、重复搜索次数
- 记忆类型分析报告（空间、物体、时间、程序）

**已有的内容**：
- 星级评分 + 等级称号
- AI 机器人诊断报告
- 失败原因分析
- 策略优化建议
- 研究数据 JSON 下载

**缺少的**：
- "你的机器人记忆策略"一句话总结（更贴近玩家的人性化标签）
- 记忆相关指标在视觉上不够突出，和其他指标混在一起

### 7.2 优化方向

**突出记忆玩法特色**：
- 把记忆相关的 5 个指标（保存、更新、过期、有效率、重复搜索）在视觉上组成一个独立区块
- 增加"你的机器人记忆策略"一句话总结

策略类型（hypothesis，需要设计规则）：
| 策略类型 | 判断规则 | 标签文案 |
|---------|---------|---------|
| 谨慎保存型 | 保存少（≤3）但有效率高（≥80%） | "你是谨慎的记忆策略家——每一条记忆都用在刀刃上" |
| 记忆达人型 | 保存多（≥5）且更新及时 | "你是记忆管理大师——信息随时保持最新" |
| 裸奔挑战型 | 几乎不用记忆（保存=0） | "你选择了hard模式——完全靠脑内导航" |
| 混乱挣扎型 | 过期多（≥3），重复搜索多 | "你在混乱中艰难前行——建议多更新记忆" |
| 稳健平衡型 | 其他情况 | "你找到了属于自己的记忆节奏" |

### 7.3 研究数据处理

- 研究数据保持可展开查看（当前已有 JSON 下载按钮）
- 默认收起，不抢占普通玩家主界面
- 记忆类型分析报告可以保留，但放在记忆策略区块之后

### 7.4 修改文件

- `src/pages/ResultPage.tsx` — 调整布局，增加记忆策略一句话总结
- `src/game/scoring.ts` — （可选）增加策略判断函数
- `src/store/useGameStore.ts` — （如需要）补充统计字段

---

## 八、性能和工程边界

### 8.1 必要的小范围优化

#### 8.1.1 HUD 使用精确 Zustand selector

**问题**：当前 [HUD.tsx#L37-L63](../src/components/arena3d/HUD.tsx#L37-L63) 一次性订阅了大量状态：
```typescript
const {
  task, phase, currentRoom, chaosValue, score, combo,
  memorySlots, heldEntityId, entities, containerStates,
  // ... 共 20+ 个字段
} = useGameStore()
```

这会导致任何状态变化都触发 HUD 重渲染。

**优化**：使用多个 `useGameStore` 调用，每个只订阅需要的字段，或使用 `shallow` 比较。

**影响范围**：HUD 组件性能提升
**回归风险**：低（只是重构订阅方式）

#### 8.1.2 Container3D 动画避免每帧 React setState

**问题**：当前 [Container3D.tsx#L90-L99](../src/components/arena3d/Container3D.tsx#L90-L99) 中：
```typescript
useFrame((_, delta) => {
  setPulseTime((prev) => prev + delta)
  setOpenProgress((prev) => { ... })
})
```

每帧调用 `setState` 触发 React 重渲染。

**优化**：使用 `useRef` 存储动画值，直接操作 Three.js 对象，不走 React 状态。

**影响范围**：Container3D 性能提升
**回归风险**：中（需要确保动画逻辑正确）

#### 8.1.3 部署 workflow 增加门禁

当前 [deploy.yml](../.github/workflows/deploy.yml) 只有：
- Type check（`npx tsc -b`）[deploy.yml#L33-L34](../.github/workflows/deploy.yml#L33-L34)
- Build（`npx vite build`）[deploy.yml#L36-L37](../.github/workflows/deploy.yml#L36-L37)

**需要增加**：
- `npm run lint` — 代码检查
- `npm test` — 单元测试
- `npm run qa` — 完整 QA 门禁

**位置**：在 Build 步骤之前增加这些检查，任何一个失败都不部署。

### 8.2 不做的事（边界）

1. ❌ 不重构 Scene Graph
2. ❌ 不拆分整个 Store
3. ❌ 不进行大型架构重写
4. ❌ 不新增关卡
5. ❌ 不新增复杂系统
6. ❌ 不扩展研究功能

### 8.3 修改文件

- `src/components/arena3d/HUD.tsx` — 优化 selector
- `src/components/arena3d/Container3D.tsx` — 优化动画
- `.github/workflows/deploy.yml` — 增加 lint/test/qa 门禁

---

## 九、输出实施计划

### P0：复赛前必须完成

#### P0-1：统一关卡真值源

| 项目 | 内容 |
|------|------|
| **problem** | 首页、任务页、README 的关卡数量和名称不一致，HomePage 硬编码列表 |
| **evidence** | [HomePage.tsx#L10-L15](../src/pages/HomePage.tsx#L10-L15) 硬编码 4 关；[tasks/index.ts#L9-L15](../src/data/tasks/index.ts#L9-L15) 实际 5 关；[README.md#L26-L34](../README.md#L26-L34) 写 4 关 |
| **proposedChange** | 在 tasks/index.ts 新增 gameManifest，HomePage 和 TaskSelectPage 统一从该来源读取，README 对齐 |
| **affectedFiles** | src/data/tasks/index.ts, src/pages/HomePage.tsx, src/pages/TaskSelectPage.tsx, README.md |
| **implementationSize** | 小（~200 行） |
| **regressionRisk** | 低 |
| **automatedTest** | 现有单元测试 + 构建通过 |
| **manualTest** | 检查首页和任务页的关卡数量、名称、顺序一致 |
| **expectedPlayerImpact** | 消除困惑，明确哪关是教学、哪关是核心 |

#### P0-2：精简 HUD 布局

| 项目 | 内容 |
|------|------|
| **problem** | HUD 元素过多，遮挡场景，信息密度过高 |
| **evidence** | [HUD.tsx](../src/components/arena3d/HUD.tsx) 有 10+ 个 UI 区块同时显示 |
| **proposedChange** | 默认只保留：当前目标、记忆槽、交互提示、混乱值、持有物。其他可通过快捷键展开 |
| **affectedFiles** | src/components/arena3d/HUD.tsx, src/store/useUiStore.ts |
| **implementationSize** | 中（~300 行改动） |
| **regressionRisk** | 中（HUD 改动影响所有关卡） |
| **automatedTest** | HUD 组件渲染测试 |
| **manualTest** | 1280×720 和 1440×900 下无重叠，所有功能可达 |
| **expectedPlayerImpact** | 视野更清晰，专注游戏体验 |

#### P0-3：移除永久悬浮标签和目标高亮

| 项目 | 内容 |
|------|------|
| **problem** | 物体和容器上有永久悬浮信息，像作弊提示；房间名称大标签破坏沉浸感 |
| **evidence** | [Object3D.tsx#L251-L358](../src/components/arena3d/Object3D.tsx#L251-L358) hover 标签 + 永久目标光环；[Room3D.tsx#L1071-L1085](../src/components/arena3d/Room3D.tsx#L1071-L1085) 房间名称 Billboard；[Container3D.tsx#L201-L237](../src/components/arena3d/Container3D.tsx#L201-L237) 悬浮距离 |
| **proposedChange** | 删除房间名称 Billboard、删除永久目标光环和标签、hover 时只显示名称 + 操作提示（删除距离） |
| **affectedFiles** | src/components/arena3d/Object3D.tsx, src/components/arena3d/Container3D.tsx, src/components/arena3d/Room3D.tsx |
| **implementationSize** | 中（~150 行改动） |
| **regressionRisk** | 低（主要是删除和精简） |
| **automatedTest** | 现有测试 |
| **manualTest** | 靠近物体时有交互提示，不靠近时干净 |
| **expectedPlayerImpact** | 更像真实游戏，减少作弊感 |

#### P0-4：重做出门大作战核心循环

| 项目 | 内容 |
|------|------|
| **problem** | 猫事件可能被绕过（拿了钥匙再走），不保证玩家经历保存→过期→更新循环 |
| **evidence** | [leave-home.ts#L173-L176](../src/data/tasks/leave-home.ts#L173-L176) 触发条件不包含"玩家已保存记忆" |
| **proposedChange** | 猫事件触发条件增加"玩家已保存钥匙记忆"；调整提示文案；手机铃声不直接给答案 |
| **affectedFiles** | src/data/tasks/leave-home.ts, src/dialog/dialogs.ts |
| **implementationSize** | 小（~100 行改动） |
| **regressionRisk** | 中（事件逻辑变化可能影响通关路径） |
| **automatedTest** | 任务脚本事件测试 |
| **manualTest** | 走通完整流程：保存钥匙 → 离开 → 回来发现位置变了 → 更新记忆 → 完成 |
| **expectedPlayerImpact** | 确保每个玩家都体验到完整的记忆生命周期 |

#### P0-5：压缩教学关到 90 秒内

| 项目 | 内容 |
|------|------|
| **problem** | 教学关事件多、提示多、流程长 |
| **evidence** | [clean-table.ts](../src/data/tasks/clean-table.ts) 有 6+ 个脚本事件 |
| **proposedChange** | 简化为渐进式引导：第一件全引导 → 第二件提示目标 → 第三件自主。减少事件数量 |
| **affectedFiles** | src/data/tasks/clean-table.ts, src/dialog/dialogs.ts |
| **implementationSize** | 中（~200 行改动） |
| **regressionRisk** | 中（教学关是新手第一印象） |
| **automatedTest** | 任务完成测试 |
| **manualTest** | 计时测试：新玩家 90 秒内完成教学关 |
| **expectedPlayerImpact** | 更快进入核心玩法，减少流失 |

### P1：明显提升体验

#### P1-1：首页首屏精简

| 项目 | 内容 |
|------|------|
| **problem** | 首页信息过载，核心概念不突出，没有快速开始入口 |
| **evidence** | [HomePage.tsx](../src/pages/HomePage.tsx) 首屏有 6+ 个信息区块 |
| **proposedChange** | 首屏只保留：一句话概念 + 立即开始按钮 + 技术原理入口。详细内容放下方 |
| **affectedFiles** | src/pages/HomePage.tsx |
| **implementationSize** | 中（~200 行改动） |
| **regressionRisk** | 低 |
| **automatedTest** | 首页渲染测试 |
| **manualTest** | 10 秒内理解项目核心概念 |
| **expectedPlayerImpact** | 更高的转化率，更多人点击开始 |

#### P1-2：任务选择页突出核心关

| 项目 | 内容 |
|------|------|
| **problem** | 5 关平铺，不知道哪关是重点 |
| **evidence** | [TaskSelectPage.tsx](../src/pages/TaskSelectPage.tsx) 时间线布局，每关视觉权重相同 |
| **proposedChange** | 教学关和核心展示关更突出，其他标记为"后续挑战" |
| **affectedFiles** | src/pages/TaskSelectPage.tsx |
| **implementationSize** | 小（~100 行改动） |
| **regressionRisk** | 低 |
| **automatedTest** | 任务页渲染测试 |
| **manualTest** | 一眼看出哪关是教学、哪关是核心 |
| **expectedPlayerImpact** | 引导玩家按正确顺序体验 |

#### P1-3：结算页增加记忆策略总结

| 项目 | 内容 |
|------|------|
| **problem** | 结算页记忆相关指标和其他指标混在一起，缺少记忆玩法特色的人格化总结 |
| **evidence** | [ResultPage.tsx#L202-L228](../src/pages/ResultPage.tsx#L202-L228) 已有 5 个记忆指标，但视觉上不突出，缺少一句话策略标签 |
| **proposedChange** | 把记忆指标组成独立区块，增加"你的机器人记忆策略"一句话总结（5 种策略类型） |
| **affectedFiles** | src/pages/ResultPage.tsx, src/game/scoring.ts |
| **implementationSize** | 小（~100 行改动） |
| **regressionRisk** | 低 |
| **automatedTest** | 结算页渲染测试 |
| **manualTest** | 完成一关后查看结算页记忆策略标签是否合理 |
| **expectedPlayerImpact** | 强化记忆玩法印象，增加重玩动力 |

### P2：时间允许再做

#### P2-1：餐厅场景视觉升级

| 项目 | 内容 |
|------|------|
| **problem** | 教学关餐厅像测试场，不够生活化 |
| **evidence** | [Room3D.tsx#L765-L861](../src/components/arena3d/Room3D.tsx#L765-L861) |
| **proposedChange** | 调整家具布局，增加装饰物，减少空墙 |
| **affectedFiles** | src/components/arena3d/Room3D.tsx |
| **implementationSize** | 中（~200 行改动） |
| **regressionRisk** | 低（纯视觉变化） |
| **automatedTest** | 场景加载测试 |
| **manualTest** | 视觉检查：餐厅看起来像真实家庭餐厅 |
| **expectedPlayerImpact** | 更强的沉浸感和代入感 |

#### P2-2：部署 workflow 增加 lint/test/qa 门禁

| 项目 | 内容 |
|------|------|
| **problem** | 当前部署只有 type check 和 build，缺少 lint、单元测试和 QA 门禁 |
| **evidence** | [deploy.yml#L33-L37](../.github/workflows/deploy.yml#L33-L37) 只有 Type check 和 Build 两步 |
| **proposedChange** | 在 Build 前增加 `npm run lint`、`npm test`、`npm run qa` 三步检查，任何失败都不部署 |
| **affectedFiles** | .github/workflows/deploy.yml |
| **implementationSize** | 小（~20 行改动） |
| **regressionRisk** | 低（新增检查步骤，不影响现有构建逻辑） |
| **automatedTest** | CI 流程本身就是验证 |
| **manualTest** | 推送代码后确认 CI 按预期执行所有检查 |
| **expectedPlayerImpact** | 更高的部署质量，减少有问题的版本上线 |

---

## 十、复赛验收标准

### 10.1 产品体验

1. ✅ **首页 10 秒内理解项目**  
   新玩家打开首页，10 秒内能回答："这是什么游戏？核心玩法是什么？"

2. ✅ **教学关 90 秒内完成**  
   第一次玩的玩家，90 秒内完成教学关（初次整理）

3. ✅ **陌生玩家无需口头帮助进入核心关**  
   从首页到出门大作战第一分钟，不需要问"我该干什么"

4. ✅ **玩家必然经历一次保存、过期、更新**  
   出门大作战中，设计保证每个玩家都会经历完整的记忆生命周期

5. ✅ **出门关 3–5 分钟完成**  
   核心展示关时长控制在 3-5 分钟内

6. ✅ **HUD 不遮挡主要场景**  
   HUD 元素占据屏幕面积 < 15%，主要视线区域无遮挡

7. ✅ **没有永久调试标签**  
   游戏过程中没有房间名、距离数字、目标答案等永久悬浮信息

8. ✅ **1280×720 无明显 UI 重叠**  
   最低分辨率下所有 UI 元素正常显示，不重叠、不溢出

### 10.2 工程质量

9. ✅ **npm test、lint、build、qa、e2e 全绿**  
   所有检查命令通过，CI 门禁生效

### 10.3 玩家意愿

10. ✅ **3 名陌生玩家中至少 2 名愿意重玩**  
    玩完出门大作战后，问"你愿意再玩一次试试不同策略吗？"，至少 2/3 答"愿意"

---

## 附录：文件引用索引

| 文件 | 用途 | 关键行 |
|------|------|--------|
| [README.md](../README.md) | 项目说明 | L26-L34 关卡数 |
| [src/data/tasks/index.ts](../src/data/tasks/index.ts) | 任务注册表 | L9-L15 5 个任务 |
| [src/data/tasks/clean-table.ts](../src/data/tasks/clean-table.ts) | 教学关配置 | — |
| [src/data/tasks/leave-home.ts](../src/data/tasks/leave-home.ts) | 核心关配置 | L170-L235 脚本事件 |
| [src/pages/HomePage.tsx](../src/pages/HomePage.tsx) | 首页 | L10-L15 硬编码关卡 |
| [src/pages/TaskSelectPage.tsx](../src/pages/TaskSelectPage.tsx) | 任务选择页 | L10-L16 时间线 |
| [src/components/arena3d/HUD.tsx](../src/components/arena3d/HUD.tsx) | 游戏 HUD | — |
| [src/components/arena3d/Object3D.tsx](../src/components/arena3d/Object3D.tsx) | 物体 3D 渲染 | L251-L358 悬浮标签 |
| [src/components/arena3d/Container3D.tsx](../src/components/arena3d/Container3D.tsx) | 容器 3D 渲染 | L201-L237 悬浮标签 |
| [src/components/arena3d/Scene3D.tsx](../src/components/arena3d/Scene3D.tsx) | 场景主组件 | — |
| [src/components/arena3d/Room3D.tsx](../src/components/arena3d/Room3D.tsx) | 房间渲染 | L1071-L1085 房间名标签 |
| [src/components/arena3d/Minimap.tsx](../src/components/arena3d/Minimap.tsx) | 小地图 | — |
| [src/game/commands.ts](../src/game/commands.ts) | 游戏命令 | L119-L166 保存记忆 |
| [src/store/slices/memorySlice.ts](../src/store/slices/memorySlice.ts) | 记忆状态 | L28-L136 saveMemory |
| [src/store/slices/taskSlice.ts](../src/store/slices/taskSlice.ts) | 任务状态 | L320-L415 脚本事件 |
| [src/pages/ResultPage.tsx](../src/pages/ResultPage.tsx) | 结算页 | L202-L228 记忆指标 |
| [src/game/scoring.ts](../src/game/scoring.ts) | 计分系统 | — |
| [.github/workflows/deploy.yml](../.github/workflows/deploy.yml) | 部署工作流 | L33-L37 Type check + Build |
