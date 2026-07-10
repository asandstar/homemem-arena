# 记忆宅邸（Memory Arena）完整实现架构文档

## 项目概览

**项目名**：记忆宅邸 / Memory Arena: Amnesia Butler  
**定位**：记忆增强机器人研究实验平台（游戏化）  
**技术栈**：React + TypeScript + Zustand + React Three Fiber (R3F) + Three.js + Vite  
**参考**：RoboMME (Benchmarking and Understanding Memory for Robotic Generalist Policies)  
**当前进度**：第一关可玩，基础系统完整，四个关卡已配置

---

## 一、系统架构总览

```
┌─────────────────────────────────────────────────────────────────────┐
│                         页面层 (Pages)                              │
│  HomePage ─ TaskSelectPage ─ ArenaPage ─ ProbePage ─ ResultPage   │
│                           │                              │          │
│                    ┌──────┴──────┐              ┌────────┴──────┐  │
│                    │  3D 渲染层   │              │   分析/AI 层   │  │
│                    │ Scene3D      │              │ analyzeSession │  │
│                    │ Room3D       │              │ updateRobotMem │  │
│                    │ Object3D     │              └───────────────┘  │
│                    │ Container3D  │                                 │
│                    │ Controls     │                                 │
│                    └──────┬──────┘                                 │
│                           │                                        │
│              ┌────────────┼────────────┐                          │
│              │         状态管理层       │                          │
│         useGameStore  useSessionStore  useUiStore                 │
│              │              │              │                       │
│       ┌──────┴──────┐       │        UI状态持久化                   │
│       │  游戏逻辑层  │       │                                       │
│       │ scoring      │       │                                       │
│       │ chaos        │       │                                       │
│       │ collision    │       │                                       │
│       │ placement    │       │                                       │
│       │ memorySlots  │       │                                       │
│       │ playerCtrl   │       │                                       │
│       │ commands     │       │                                       │
│       │ flow         │       │                                       │
│       │ interaction  │       │                                       │
│       └──────┬──────┘       │                                       │
│              │              │                                        │
│       ┌──────┴──────────────┴──────┐                                │
│       │         数据配置层          │                                │
│       │ tasks/  rooms  levelBalance │                                │
│       │ decorFurniture              │                                │
│       └─────────────────────────────┘                                │
│                                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │ 音效系统  │  │ 模型系统  │  │ 反馈系统  │  │ 类型系统  │          │
│  │ sfx.ts   │  │ ModelReg │  │ feedback/ │  │ types/*  │          │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘          │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 二、各系统详细分解

### 2.1 路由与页面层

**文件**：[routes.tsx](file:///Users/azq/asandstar/homemem-arena-web-demo/src/routes.tsx), [App.tsx](file:///Users/azq/asandstar/homemem-arena-web-demo/src/App.tsx)

| 路由 | 页面组件 | 功能 |
|------|---------|------|
| `/` | `HomePage` | 首页，介绍项目主题，引导进入 |
| `/tasks` | `TaskSelectPage` | 关卡选择，显示4个任务卡片 |
| `/play/:taskId` | `ArenaPage` | 核心3D游戏页面 |
| `/probe/:taskId` | `ProbePage` | 记忆测试问答页面 |
| `/result/:taskId` | `ResultPage` | 结果页面，显示统计和AI诊断 |
| `/session` | `SessionDataPage` | 调试用，显示原始session JSON |

**游戏流程**：`HomePage` → `TaskSelectPage` → `ArenaPage` → `ProbePage` → `ResultPage`

---

### 2.2 核心游戏状态（useGameStore）

**文件**：[useGameStore.ts](file:///Users/azq/asandstar/homemem-arena-web-demo/src/store/useGameStore.ts)（~1350行）

这是整个项目最核心的状态管理，管理所有运行时游戏数据。

#### 2.2.1 游戏阶段（GamePhase）

```
idle → briefing → playing → probing → result
                  ↓                        ↑
                aborted ──────────────────→│
```

- `idle`：未开始
- `briefing`：显示任务简介
- `playing`：核心游戏阶段
- `probing`：记忆测试阶段
- `result`：结果展示
- `aborted`：异常终止

#### 2.2.2 主要状态字段

| 类别 | 字段 | 说明 |
|------|------|------|
| **任务** | `task`, `phase`, `stepCount`, `elapsedMs` | 当前任务配置与进度 |
| **角色** | `robotPosition`, `robotRotation`, `cameraPitch`, `currentRoom`, `viewMode` | 玩家位置和视角 |
| **物体** | `entities[]`, `heldEntityId`, `containerStates` | 场景中所有物体和容器 |
| **记忆** | `memorySlots[]`, `flashingSlotIndex`, `savingMemorySlotIndex` | 3个记忆槽位 |
| **混乱** | `chaosValue`, `chaosPeak`, `chaosEffectActive` | 混乱系统 |
| **得分** | `score`, `combo`, `maxCombo` | 计分系统 |
| **目标** | `achievedGoalIds`, `triggeredEvents` | 任务完成度 |
| **反馈** | `feedback`, `floatingTexts[]`, `eventToasts[]` | 视觉反馈 |
| **心流** | `activeFlowHint`, `flowHintLevel`, `lastGoalProgressMs` | 渐进式提示 |
| **统计** | `wrongPlaceCount`, `repeatSearchCount`, `memoryUsedCount` 等 | 用于结果分析 |

#### 2.2.3 关键动作（Actions）

| 动作 | 说明 |
|------|------|
| `initializeTask(taskId)` | 从任务配置创建所有实体，初始化游戏 |
| `startPlaying()` | 开始计时，进入playing阶段 |
| `moveToRoom(roomId, pos)` | 切换房间，触发门冷却 |
| `pickEntity(entityId)` | 拾取物体 |
| `placeEntity(containerId)` | 放置物体到容器 |
| `useContainer(containerId)` | 打开/关闭容器 |
| `saveMemory(entity)` | 保存记忆到槽位 |
| `lockMemorySlot(index)` | 锁定记忆防止过期 |
| `tickElapsed(deltaMs)` | 每帧更新：时间、混乱值、记忆置信度衰减 |
| `triggerScriptedEvents()` | 检查并触发脚本化事件 |
| `setLevelCompleted()` | 通关 |

---

### 2.3 会话记录系统（useSessionStore）

**文件**：[useSessionStore.ts](file:///Users/azq/asandstar/homemem-arena-web-demo/src/store/useSessionStore.ts)

记录完整的游戏过程数据，用于研究分析。

#### 核心数据结构 `SessionData`

| 字段 | 类型 | 说明 |
|------|------|------|
| `events` | `SessionEvent[]` | 7种事件的完整时间线 |
| `memories` | `MemoryEntry[]` | 记忆写入记录 |
| `agent_pose_trace` | `Vec3[]` | 机器人位置轨迹 |
| `observations` | `Observation[]` | 每步视野记录 |
| `probe_answers` | `ProbeAnswer[]` | 记忆测试答案 |
| `metrics` | `SessionMetrics` | 22项统计指标 |
| `failureReasons` | `FailureReason[]` | 失败原因分析 |
| `policySuggestions` | `PolicySuggestion[]` | 策略优化建议 |
| `ai_research_annotation` | `AIResearchAnnotation` | AI研究标注 |

#### 7种事件类型

1. `ObservationEvent` - 周期性视野记录
2. `MovementEvent` - 房间切换
3. `ActionEvent` - 拾取/放置/开关
4. `MemoryWriteEvent` - 记忆写入
5. `TaskProgressEvent` - 目标完成
6. `FlowInterventionEvent` - 心流干预
7. `ScriptedEventTrigger` - 脚本事件触发
8. `ProbeAnswerEvent` - 探测回答

---

### 2.4 UI状态管理（useUiStore）

**文件**：[useUiStore.ts](file:///Users/azq/asandstar/homemem-arena-web-demo/src/store/useUiStore.ts)

使用 `zustand/persist` 持久化到 localStorage。

| 状态 | 说明 |
|------|------|
| `taskPanelOpen` | 任务面板开关（Tab） |
| `eventLogOpen` | 事件日志开关（R） |
| `minimapOpen` | 小地图开关 |
| `controlsOpen` | 操作提示开关 |
| `memoryBarOpen` | 记忆槽开关 |
| `hudHidden` | HUD隐藏（H） |
| `audioEnabled` | 全局音效开关（持久化） |

---

### 2.5 记忆系统

#### 类型定义

**文件**：[memory.ts](file:///Users/azq/asandstar/homemem-arena-web-demo/src/types/memory.ts)

```typescript
type MemoryType = 'temporal' | 'spatial' | 'object' | 'procedural'
```

| 记忆类型 | 颜色编码 | 游戏中的体现 | RoboMME对应 |
|---------|---------|------------|------------|
| `spatial` | 绿色 | 记住物体位置 | Permanence任务 |
| `object` | 紫色 | 识别物体类别 | Reference任务 |
| `temporal` | 蓝色 | 事件顺序/计数 | Counting任务 |
| `procedural` | 橙色 | 操作序列 | Imitation任务 |

#### 记忆槽逻辑

**文件**：[memorySlots.ts](file:///Users/azq/asandstar/homemem-arena-web-demo/src/game/memorySlots.ts)

- 3个槽位（`levelBalance.memorySlotCount`）
- 置信度随时间衰减：`decayRate = 0.005`
- 低于40%标记为过期（`outdated`）
- 锁定后不受衰减影响
- 过期记忆使用时：`confidence *= 0.5`，最低20%

#### 记忆槽数据结构（运行时）

```typescript
interface MemorySlot {
  id: string
  objectName: string      // 物体名称
  roomName: string        // 所在房间
  containerName: string | null  // 容器名称
  state: string           // 物体状态
  timestamp: number       // 保存时间
  locked: boolean         // 是否锁定
  confidence: number      // 置信度 0-100
  outdated: boolean       // 是否过期
  entityConfigId: string  // 关联实体ID
  memoryType?: string     // 记忆类型
}
```

---

### 2.6 混乱系统（Chaos）

**文件**：[chaos.ts](file:///Users/azq/asandstar/homemem-arena-web-demo/src/game/chaos.ts)

混乱值代表环境失控程度，影响游戏难度。

| 混乱级别 | 范围 | 效果 |
|---------|------|------|
| low | 0-30 | 正常 |
| medium | 30-60 | 开始出现视觉干扰 |
| high | 60-85 | Glitch阈值，物体更易被移动 |
| critical | 85-100 | Event boost阈值，极端干扰 |

**增长因素**：
- 基础增长：`0.15/秒`
- 错误放置：`+8`
- 重复搜索：`+2`
- 过期记忆：`+4`
- 事件触发：`+6`

---

### 2.7 得分系统

**文件**：[scoring.ts](file:///Users/azq/asandstar/homemem-arena-web-demo/src/game/scoring.ts)

| 得分项 | 基础值 | 说明 |
|-------|-------|------|
| 正确放置 | 100 | × Combo倍率 |
| 拾取目标 | 20 | 固定 |
| 有效记忆使用 | 50 | 固定 |
| 记忆更新 | 30 | 固定 |
| 时间奖励 | 2/秒 | 剩余时间 |
| 错误放置 | -50 | 惩罚 |
| 重复搜索 | -10 | 惩罚 |

**Combo系统**：每次正确放置+1，错误/超时重置。倍率 = `1 + (combo-1) × 0.1`，最高2.0倍

**评级**：S(≥1200) A(≥900) B(≥650) C(≥400) D(<400)

---

### 2.8 碰撞与移动系统

**文件**：[collision.ts](file:///Users/azq/asandstar/homemem-arena-web-demo/src/game/collision.ts), [playerControls.ts](file:///Users/azq/asandstar/homemem-arena-web-demo/src/game/playerControls.ts), [playerMovement.ts](file:///Users/azq/asandstar/homemem-arena-web-demo/src/game/playerMovement.ts)

#### 移动参数

| 参数 | 值 | 说明 |
|------|---|------|
| `PLAYER_SPEED` | 3.0 m/s | 第一人称移动速度 |
| `TOP_DOWN_SPEED` | 5.0 m/s | 俯视模式速度 |
| `PLAYER_HEIGHT` | 1.6m | 相机高度 |
| `PLAYER_RADIUS` | 0.3m | 碰撞半径 |
| `MOUSE_SENSITIVITY` | 0.002 | 鼠标灵敏度 |

#### 碰撞检测

- 房间碰撞：AABB检测，防止穿墙
- 家具碰撞：基于家具位置的圆柱碰撞
- 门冷却：`DOOR_COOLDOWN_MS = 500ms`，防止反复穿门
- 视角切换：第一人称 / 俯视（V键）

---

### 2.9 物体放置系统

**文件**：[placement.ts](file:///Users/azq/asandstar/homemem-arena-web-demo/src/game/placement.ts)

- `MODEL_HEIGHTS`：各种物体类别的模型高度
- `CONTAINER_MODEL_HEIGHTS`：各种容器模型的表面高度
- `surfaceHeight`：容器配置中的表面高度
- 物体Y坐标 = 容器表面高度 - 物品高度偏移
- 放置时自动吸附到容器表面

**已知问题**：某些模型高度仍需微调，fallback模型无精确高度

---

### 2.10 命令系统

**文件**：[commands.ts](file:///Users/azq/asandstar/homemem-arena-web-demo/src/game/commands.ts)

将游戏操作解耦为命令函数：

| 命令 | 说明 |
|------|------|
| `executePick` | 拾取物体 |
| `executeContainerInteraction` | 开关容器 |
| `executeRoomTransition` | 房间切换 |
| `executeSaveMemory` | 保存记忆 |

---

### 2.11 心流辅助系统（Flow）

**文件**：[flow.ts](file:///Users/azq/asandstar/homemem-arena-web-demo/src/game/flow.ts)

防止玩家长时间停滞：

| 等级 | 触发条件 | 提示内容 |
|------|---------|---------|
| Level 1 | 20秒无目标进展 | 当前目标聚焦 |
| Level 2 | 45秒无目标进展 | 记忆策略建议 |

`MEMORY_STRATEGIES`：为每种记忆类型提供策略提示文本。

---

### 2.12 3D渲染系统

**文件**：`src/components/arena3d/`

#### 场景层次

```
Canvas (R3F)
├── FirstPersonControls (相机控制 + 输入处理)
├── RoomLights (各房间灯光)
├── ChaosEffect (混乱视觉效果)
├── HeldItem (手持物品渲染)
├── Room3D[] (每个房间)
│   ├── 墙壁 + 地板 + 天花板
│   ├── FurnitureModel[] (家具模型)
│   ├── PropModel[] (装饰道具)
│   ├── Container3D[] (可交互容器)
│   └── Object3D[] (可交互物体)
├── CatPrintsEffect (猫脚印特效)
├── CatShadowEffect (猫影特效)
└── PhoneRingEffect (手机铃声特效)
```

#### 模型系统

**文件**：[ModelRegistry.ts](file:///Users/azq/asandstar/homemem-arena-web-demo/src/components/arena3d/models/ModelRegistry.ts)

- `ModelRegistry`：GLB模型路径映射
- `ModelAsset`：按需加载GLB模型，带错误边界
- `FurnitureModel`：家具渲染，优先GLB → fallback几何体
- `PropModel`：道具渲染（装饰物）
- `FallbackModels`：fallback几何体定义

**模型加载流程**：检查GLB路径 → 加载成功则使用 → 失败则使用fallback几何体

#### 颜色系统

**文件**：[colors.ts](file:///Users/azq/asandstar/homemem-arena-web-demo/src/components/arena3d/colors.ts)

- `PALETTE`：全局颜色调色板
- `ROOM_AMBIENT_COLORS`：各房间灯光颜色

---

### 2.13 HUD系统

**文件**：[HUD.tsx](file:///Users/azq/asandstar/homemem-arena-web-demo/src/components/arena3d/HUD.tsx)（~860行）

#### 当前布局

```
┌────────────────────────────────────────────────────────────────┐
│ [任务面板]        [得分/评级/时间/混乱值/进度]     [小地图]     │
│ 左上角                   顶部中央                  右上角     │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│         [Toast通知]                                            │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│ [事件日志]                   [交互提示]       [记忆槽]          │
│ 左下角                       右下角         底部中央           │
└────────────────────────────────────────────────────────────────┘
```

#### HUD组件

| 组件 | 位置 | 可折叠 | 快捷键 |
|------|------|-------|-------|
| 任务面板 | 左上角 | ✅ | Tab |
| 核心状态栏 | 顶部中央 | ❌ | - |
| 小地图+控制 | 右上角 | ✅ | - |
| 事件日志 | 左下角 | ✅ | R |
| 操作提示 | 左下角 | ✅ | - |
| 记忆槽 | 底部中央 | ✅ | - |
| 交互提示 | 右下角 | ❌ | - |
| Toast通知 | 顶部中央下方 | 自动消失 | - |
| Combo动画 | 屏幕中央 | 自动消失 | - |
| 全屏HUD | H | ✅ | H |

---

### 2.14 音效系统

**文件**：[sfx.ts](file:///Users/azq/asandstar/homemem-arena-web-demo/src/audio/sfx.ts)

- 基于 Web Audio API
- 全局开关：`useUiStore.audioEnabled`（持久化到localStorage）
- 关键音效：`pick`, `place_success`, `place_error`, `memory_save`, `memory_outdated`, `cat_event`, `phone_ring`, `level_complete`, `chaos_warning`
- `chaos_warning` 有速率限制
- AudioContext 初始化在用户交互后

---

### 2.15 AI分析系统

**文件**：[analyzeSession.ts](file:///Users/azq/asandstar/homemem-arena-web-demo/src/ai/analyzeSession.ts), [updateRobotMemory.ts](file:///Users/azq/asandstar/homemem-arena-web-demo/src/ai/updateRobotMemory.ts)

#### 功能

1. **指标计算** (`calculateMetrics`)：22项统计指标
   - 分类型准确率：`spatialAccuracy`, `objectStateAccuracy`, `temporalAccuracy`, `proceduralAccuracy`
   - 行为指标：`repeatedSearchCount`, `wrongPlacements`, `containerMistakes`
   - 心流指标：`flowInterventionCount`, `longestGoalGapMs`

2. **失败原因分析** (`generateFailureReasons`)：
   - 分类：`wrong-container`, `missed-object`, `forgot-location`, `sequence-error`, `timeout`, `memory-error`

3. **策略建议** (`generatePolicySuggestions`)：
   - 按记忆类型分类的建议
   - 对应到 RoboMME 的记忆策略

4. **机器人记忆更新** (`updateRobotMemory`)：
   - 模拟机器人策略的记忆更新逻辑

---

### 2.16 任务配置系统

**文件**：`src/data/tasks/`

#### 四个关卡

| 关卡 | 文件 | 时间线 | 记忆类型 | 难度 |
|------|------|-------|---------|------|
| 出门大作战 | [leave-home.ts](file:///Users/azq/asandstar/homemem-arena-web-demo/src/data/tasks/leave-home.ts) | 清晨 | 空间+物体 | medium |
| 餐盘精的恶作剧 | [clean-table.ts](file:///Users/azq/asandstar/homemem-arena-web-demo/src/data/tasks/clean-table.ts) | 上午 | 空间+物体 | medium |
| 袜子幽灵捉迷藏 | [laundry-sort.ts](file:///Users/azq/asandstar/homemem-arena-web-demo/src/data/tasks/laundry-sort.ts) | 下午 | 空间+物体 | hard |
| 强迫症早餐闹钟 | [breakfast.ts](file:///Users/azq/asandstar/homemem-arena-web-demo/src/data/tasks/breakfast.ts) | 深夜 | 空间+物体 | hard |

#### 任务配置结构（TaskConfig）

```typescript
interface TaskConfig {
  id, name, description          // 基本信息
  memoryTypes: MemoryType[]       // 涉及的记忆类型
  difficulty: Difficulty          // 难度
  rooms: RoomId[]                 // 使用的房间
  objects: ObjectSpec[]           // 可交互物体
  containers: ContainerSpec[]     // 可交互容器
  goals: GoalSpec[]               // 任务目标（含predicate判定）
  scriptedEvents: ScriptedEventSpec[]  // 脚本化事件
  probes: ProbeQuestionSpec[]     // 记忆测试题
  briefing, completionText, failureText  // 剧情文案
  systemPrompt                    // 小橡内心独白
  timeLimit                       // 时间限制
}
```

#### 目标判定（GoalSpec）

每个目标包含 `predicate` 函数，接收当前实体快照，返回是否达成。支持：
- `kind`: `milestone`（达成后保持）/ `terminal-constraint`（结算时必须成立）
- `dependsOnGoalIds`：依赖目标
- `memoryType`：关联的记忆类型

#### 脚本化事件（ScriptedEventSpec）

| 事件类型 | 说明 |
|---------|------|
| `move-entity` | 移动物体（如钥匙猫推钥匙） |
| `hide-entity` | 隐藏物体 |
| `show-entity` | 显示物体 |
| `message` | 仅显示消息 |

事件触发后可标记关联记忆为过期（`markMemoryOutdated`），并可触发3D特效（`eventEffect`）。

---

### 2.17 房间系统

**文件**：[rooms.ts](file:///Users/azq/asandstar/homemem-arena-web-demo/src/data/rooms.ts)

6个房间的空间布局：

```
  卧室(bedroom)    客厅(living)    厨房(kitchen)
  center:(-6,0,0)  center:(0,0,0)  center:(6,0,0)
       │                │                │
       └──── door ──────┘──── door ──────┘
                        │
                     door
                        │
                  玄关(entrance)
                  center:(0,0,6)
                        │
                     door
                        │
                  洗衣房(laundry)
                  center:(0,0,12)
                        │
                     door
                        │
                  餐厅(dining)
                  center:(12,0,0)
```

#### 房间规格（RoomSpec）

- 每个房间6m×6m×3m（X×Y×Z）
- 包含门洞定义（`DoorwaySpec`）
- 门洞定义了偏移、宽度、高度、连接目标房间、目标位置

---

### 2.18 交互系统

**文件**：[interactionTargets.ts](file:///Users/azq/asandstar/homemem-arena-web-demo/src/game/interactionTargets.ts)

- 物体交互距离：`2m`
- 容器交互距离：`2.5m`
- 基于XZ平面距离计算
- 忽略隐藏/手持/移动中的物体

---

### 2.19 数值平衡配置

**文件**：[levelBalance.ts](file:///Users/azq/asandstar/homemem-arena-web-demo/src/data/levelBalance.ts)

所有数值集中管理，避免硬编码：

| 配置项 | 默认值 | 说明 |
|-------|-------|------|
| `timeLimit` | 180秒 | 关卡时间 |
| `memorySlotCount` | 3 | 记忆槽位数 |
| `chaosGrowthPerSecond` | 0.15 | 混乱值每秒增长 |
| `correctPlaceScore` | 100 | 正确放置得分 |
| `maxComboMultiplier` | 2.0 | 最大Combo倍率 |
| ... | ... | 共21项配置 |

---

### 2.20 装饰家具系统

**文件**：[decorFurniture.ts](file:///Users/azq/asandstar/homemem-arena-web-demo/src/data/decorFurniture.ts)

每个房间的纯装饰家具定义，不参与游戏交互，仅用于场景填充。

---

## 三、数据流图

### 3.1 游戏主循环

```
FirstPersonControls (每帧)
  │
  ├── 处理WASD输入 → computeMovementVector → 碰撞检测 → moveForward
  ├── 处理鼠标拖动 → 旋转相机
  ├── 处理E键 → executeSaveMemory → useGameStore.saveMemory
  ├── 处理F键 → executePick / executeContainerInteraction
  │
  └── useFrame 回调：
       ├── tickElapsed(deltaMs)
       │    ├── 更新 elapsedMs
       │    ├── chaosValue += calcChaosGrowth(deltaMs)
       │    ├── updateMemoryConfidence(slots, deltaMs)
       │    └── 检查时间超时
       ├── triggerScriptedEvents()
       │    └── 检查每个事件的trigger条件 → 执行事件效果
       ├── checkLevelCompletion()
       │    └── 检查所有目标predicate → setLevelCompleted
       └── 心流检测
            └── lastGoalProgressMs > 阈值 → buildFlowHint
```

### 3.2 物体交互流

```
F键按下
  → 判断附近有物体还是容器
  → 如果有容器+手持物品 → placeEntity(containerId)
  → 如果有物体+空手 → pickEntity(entityId)
  → 如果有容器+空手 → useContainer(containerId)
  
placeEntity:
  → 检查容器是否接受该类别
  → 成功：addScore + addCombo + 播放音效
  → 失败：incrementWrongPlace + breakCombo + 播放错误音效

pickEntity:
  → 检查是否已有手持物品
  → 成功：heldEntityId = entityId
  → 更新实体状态
```

### 3.3 记忆系统数据流

```
E键按下
  → 查找附近可交互实体
  → executeSaveMemory(entity)
  → useGameStore.saveMemory(entity)
  → 查找空槽/已有同entityConfigId槽
  → 创建MemorySlot数据
  → 添加floatingText "记忆已保存"
  → 触发memory-save动画

tickElapsed中：
  → updateMemoryConfidence(slots, deltaMs)
  → 置信度衰减、标记过期

脚本事件触发后：
  → markMemoryOutdated(entityConfigId)
  → 相关槽位标记为过期
```

---

## 四、测试覆盖

**文件**：`src/game/*.test.ts`, `src/store/*.test.ts`

| 测试文件 | 测试数 | 覆盖模块 |
|---------|-------|---------|
| `scoring.test.ts` | 39 | Combo倍率、放置得分、时间奖励 |
| `memorySlots.test.ts` | 36 | 记忆查找、槽位管理、置信度衰减 |
| `useGameStore.test.ts` | 44 | 任务初始化、物体交互、房间切换 |
| `chaos.test.ts` | 34 | 混乱值增长、级别判定 |
| `placement.test.ts` | 38 | 物体放置高度、容器吸附 |
| `collision.test.ts` | 36 | 碰撞检测、房间切换 |
| `playerMovement.test.ts` | 25 | 移动向量计算 |
| `commands.test.ts` | 3 | 命令执行 |
| `flow.test.ts` | 3 | 心流提示 |
| **总计** | **258** | |

---

## 五、已知问题与改进方向

### 5.1 架构层面

| 问题 | 说明 | 影响 |
|------|------|------|
| **useGameStore过大** | ~1350行，职责过多 | 维护困难，测试复杂 |
| **MemorySlot类型不统一** | `useGameStore.MemorySlot` vs `memorySlots.ts.MemorySlotData` | 类型混乱 |
| **事件系统碎片化** | 事件数据分散在gameStore、sessionStore、HUD | 难以追踪完整事件链 |
| **Scene Graph缺失** | 没有统一的场景图数据结构 | 位置/关系难以查询 |
| **无观察阶段** | 直接进入playing，缺少RoboMME风格的初始观察 | 研究意味不足 |
| **程序记忆未实现** | memoryType有procedural但无对应任务 | 记忆类型框架不完整 |

### 5.2 游戏体验层面

| 问题 | 说明 | 影响 |
|------|------|------|
| **GLB模型缺失** | 部分物体仍使用fallback几何体 | 视觉不够精致 |
| **HUD布局** | 刚优化，需实测确认无重叠 | 玩家体验 |
| **移动控制** | 鼠标视角控制为拖动式，非原神式 | 操作不够自然 |
| **关卡深度** | 只有4关，程序记忆未体现 | 内容不足 |

### 5.3 研究数据层面

| 问题 | 说明 | 影响 |
|------|------|------|
| **SessionData完整性** | 部分字段未实际填充 | 研究数据不完整 |
| **E2E测试缺失** | 只有单元测试 | 无法验证完整流程 |
| **移动端适配** | 未做 | 可达性受限 |

---

## 六、文件清单

```
src/
├── main.tsx                    # 入口，AudioInitializer
├── App.tsx                     # 路由容器
├── routes.tsx                  # 路由配置
├── index.css                   # 全局样式
│
├── pages/                      # 页面组件
│   ├── HomePage.tsx            # 首页（研究风格）
│   ├── TaskSelectPage.tsx      # 关卡选择
│   ├── ArenaPage.tsx           # 3D游戏页
│   ├── ProbePage.tsx           # 记忆测试页
│   ├── ResultPage.tsx          # 结果页（含记忆分析）
│   └── SessionDataPage.tsx     # 调试数据页
│
├── store/                      # 状态管理
│   ├── useGameStore.ts         # 核心：游戏状态（~1350行）
│   ├── useSessionStore.ts      # 会话记录
│   ├── useUiStore.ts           # UI状态（持久化）
│   └── useToastStore.ts        # Toast通知
│
├── types/                      # 类型定义
│   ├── task.ts                 # 任务/目标/事件/探针
│   ├── object.ts               # 物体/容器/实体
│   ├── room.ts                 # 房间/门洞/Vec3
│   ├── memory.ts               # 记忆类型/条目
│   ├── event.ts                # 7种事件类型
│   └── session.ts              # 完整session数据
│
├── game/                       # 游戏逻辑
│   ├── scoring.ts              # 得分/评级
│   ├── chaos.ts                # 混乱值
│   ├── collision.ts            # 碰撞检测
│   ├── placement.ts            # 物体放置
│   ├── memorySlots.ts          # 记忆槽逻辑
│   ├── playerControls.ts       # 移动参数
│   ├── playerMovement.ts       # 移动向量计算
│   ├── commands.ts             # 操作命令
│   ├── flow.ts                 # 心流辅助
│   └── interactionTargets.ts   # 交互目标查找
│
├── data/                       # 数据配置
│   ├── tasks/                  # 4个关卡配置
│   │   ├── leave-home.ts
│   │   ├── clean-table.ts
│   │   ├── laundry-sort.ts
│   │   ├── breakfast.ts
│   │   └── index.ts
│   ├── rooms.ts                # 6个房间定义
│   ├── levelBalance.ts         # 数值平衡（21项）
│   └── decorFurniture.ts       # 装饰家具
│
├── components/                 # 组件
│   ├── arena3d/                # 3D渲染
│   │   ├── Scene3D.tsx         # 场景容器
│   │   ├── Room3D.tsx          # 房间渲染
│   │   ├── Object3D.tsx        # 可交互物体
│   │   ├── Container3D.tsx     # 可交互容器
│   │   ├── FirstPersonControls.tsx  # 相机+输入控制
│   │   ├── HUD.tsx             # 游戏内UI（~860行）
│   │   ├── Minimap.tsx         # 小地图
│   │   ├── ChaosEffect.tsx     # 混乱视觉
│   │   ├── colors.ts           # 颜色定义
│   │   ├── modelIds.ts         # 模型ID映射
│   │   ├── models/             # 模型系统
│   │   │   ├── ModelRegistry.ts
│   │   │   ├── ModelAsset.tsx
│   │   │   ├── FurnitureModel.tsx
│   │   │   ├── PropModel.tsx
│   │   │   └── FallbackModels.tsx
│   │   ├── materials/          # 材质
│   │   └── feedback/           # 视觉特效
│   │       ├── CatPrintsEffect.tsx
│   │       ├── CatShadowEffect.tsx
│   │       └── PhoneRingEffect.tsx
│   ├── help/                   # 帮助系统
│   ├── home/                   # 首页组件
│   ├── result/                 # 结果组件
│   ├── probe/                  # 探针组件
│   ├── tasks/                  # 任务组件
│   └── ui/                     # 通用UI组件
│
├── ai/                         # AI分析
│   ├── analyzeSession.ts       # 会话分析+策略建议
│   └── updateRobotMemory.ts    # 机器人记忆更新
│
├── audio/                      # 音效
│   └── sfx.ts                  # Web Audio API封装
│
└── utils/                      # 工具
    └── format.ts               # 格式化函数
```
