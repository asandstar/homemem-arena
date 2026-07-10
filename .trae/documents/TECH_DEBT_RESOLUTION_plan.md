# 四大技术债务解决计划

## 一、当前状态分析

### 债务1：useGameStore 过大（1328行，52个action）

**精确状态**：
- 文件：[useGameStore.ts](file:///Users/azq/asandstar/homemem-arena-web-demo/src/store/useGameStore.ts) 共 **1328行**
- 状态字段：**35个**（phase, task, robotPosition, entities, memorySlots, chaosValue, score, combo, feedback, floatingTexts, eventToasts, moveAnimations, flowHintLevel 等）
- 暴露的action：**52个**
- 被 **15+** 个组件/模块直接引用

**状态分类**：
| 领域 | 字段数 | Action数 | 说明 |
|------|-------|---------|------|
| 任务生命周期 | 3 | 4 | phase, task, startPlaying, initializeTask |
| 玩家/相机 | 5 | 5 | robotPosition, robotRotation, cameraPitch, moveForward, rotateRobot |
| 物体交互 | 3 | 4 | entities, heldEntityId, pickEntity, placeEntity, useContainer |
| 记忆系统 | 4 | 5 | memorySlots, saveMemory, lockMemorySlot, clearMemorySlot, markMemoryOutdated |
| 混乱系统 | 3 | 4 | chaosValue, chaosPeak, incrementChaos, triggerChaosEffect |
| 得分/统计 | 8 | 8 | score, combo, maxCombo, addScore, addCombo, wrongPlaceCount 等 |
| 视觉反馈 | 7 | 8 | feedback, floatingTexts, eventToasts, showFeedback, addFloatingText 等 |
| 动画 | 3 | 3 | moveAnimations, startMoveAnimation, updateMoveAnimations |
| 心流辅助 | 4 | 2 | flowHintLevel, activeFlowHint, updateFlowState |
| 目标/事件 | 4 | 4 | achievedGoalIds, checkLevelCompletion, triggerScriptedEvents |

**直接引用者**：ArenaPage, HUD, Scene3D, Room3D, Object3D, Container3D, FirstPersonControls, ProbePage, ResultPage, commands.ts, flow.ts, interactionTargets.ts 等。

### 债务2：程序记忆未实现

**精确状态**：
- `MemoryType = 'temporal' | 'spatial' | 'object' | 'procedural'` 已定义
- `GoalSpec.memoryType` 和 `ScriptedEventSpec.memoryType` 已配置
- **实际使用**：procedural 在 breakfast.ts(5处)、clean-table.ts(1处)、laundry-sort.ts(1处) 中有配置
- **但未实现任何程序记忆的游戏机制**：没有顺序检查、没有步骤记忆、没有序列验证

### 债务3：Scene Graph 缺失

**精确状态**：
- 物体位置：分散在 `entities[].position` + `entities[].currentRoom`
- 容器关系：分散在 `containerStates` + `ContainerSpec.containsObjectIds`
- 房间邻接：分散在 `sharedRooms[].doorways`
- 没有统一的场景图数据结构，查询物体位置需要遍历 `entities` 数组

### 债务4：事件系统碎片化

**精确状态**：
- `useGameStore.recentEvents`：仅保存 `{step, message, description, type}` 的简化信息，用于HUD显示
- `useSessionStore.events`：保存完整的 8 种类型事件，用于结果分析
- `commands.ts`：在命令执行时手动向 sessionStore 记录事件
- `useGameStore.triggerScriptedEvents()`：内部触发事件，但不统一记录到 sessionStore
- **问题**：同一事件在2个地方以不同格式存储，脚本事件未进入session记录

---

## 二、解决方案

### 方案A：useGameStore 内部模块化拆分（低风险）

**策略**：不改变外部接口，将1328行代码拆分为多个内部模块文件，在store中组合。所有组件引用方式保持不变。

**拆分后的文件结构**：

```
src/store/
├── useGameStore.ts           # 主store（~200行，只保留接口和组合逻辑）
├── slices/
│   ├── playerSlice.ts        # 玩家移动/相机/视角（~150行）
│   ├── entitySlice.ts        # 物体交互/拾取/放置（~200行）
│   ├── memorySlice.ts        # 记忆槽/保存/过期（~150行）
│   ├── chaosSlice.ts         # 混乱值/特效（~100行）
│   ├── scoreSlice.ts         # 得分/Combo/统计（~150行）
│   ├── feedbackSlice.ts      # 浮动文字/Toast/反馈（~150行）
│   ├── animationSlice.ts     # 移动动画（~100行）
│   ├── flowSlice.ts          # 心流辅助（~100行）
│   └── taskSlice.ts          # 任务初始化/目标判定/脚本事件（~200行）
```

**每个 slice 文件模式**：
```typescript
// slices/playerSlice.ts
export interface PlayerSlice {
  robotPosition: Vec3
  robotRotation: number
  cameraPitch: number
  currentRoom: RoomId
  viewMode: ViewMode
  visitedRooms: Set<RoomId>
  moveToRoom: (toRoom: RoomId, position: Vec3) => void
  rotateRobot: (deltaRot: number) => void
  // ...
}

export const createPlayerSlice = (set: any, get: any): PlayerSlice => ({
  // 状态和action实现
})
```

**主store组合**：
```typescript
export const useGameStore = create<GameStore>((set, get) => ({
  ...createTaskSlice(set, get),
  ...createPlayerSlice(set, get),
  ...createEntitySlice(set, get),
  ...createMemorySlice(set, get),
  ...createChaosSlice(set, get),
  ...createScoreSlice(set, get),
  ...createFeedbackSlice(set, get),
  ...createAnimationSlice(set, get),
  ...createFlowSlice(set, get),
}))
```

**风险**：低。外部接口完全不变，只是内部代码组织方式改变。

---

### 方案B：程序记忆机制实现

**策略**：在现有框架上添加轻量的"序列验证"机制，不改变核心玩法。

**机制设计**：

1. **新增 `ProceduralMemory` 数据结构**（在 memory.ts 中）：
```typescript
interface ProceduralMemory {
  sequence: string[]           // 步骤ID列表
  completedSteps: string[]     // 已完成步骤
  currentStepIndex: number     // 当前步骤索引
}
```

2. **在 `GoalSpec` 中新增可选字段**：
```typescript
interface GoalSpec {
  // ...现有字段
  /** 程序记忆：要求的操作序列（仅当 memoryType === 'procedural' 时生效） */
  requiredSequence?: string[]   // 如 ['pick-bread', 'place-plate', 'place-table']
}
```

3. **在 `useGameStore` 中维护 `proceduralMemories: Record<string, ProceduralMemory>`**：
   - 键为 goalId，值为该目标的程序记忆状态
   - 每次 pick/place 操作时，检查是否匹配当前步骤
   - 步骤正确：继续下一步
   - 步骤错误：`incrementChaos(5)` + 提示"顺序错误"
   - 全部完成：目标达成

4. **在 breakfast.ts 中已有 procedural 的目标上添加 `requiredSequence`**：
   - 例如"制作三明治"目标：sequence = ['pick-bread', 'pick-ham', 'place-plate']

**风险**：低。完全向后兼容，不改变非procedural目标的逻辑。

---

### 方案C：Scene Graph 运行时查询层

**策略**：不改动任何现有数据结构，创建一个轻量的运行时查询层。

**新增文件**：`src/engine/sceneGraph.ts`

**数据结构**：
```typescript
interface SceneGraph {
  nodes: Map<string, SceneNode>     // 物体/容器/房间
  edges: SceneEdge[]                // 关系
}

type SceneNode = 
  | { type: 'entity'; id: string; name: string; room: RoomId; position: Vec3; state: string }
  | { type: 'container'; id: string; name: string; room: RoomId; position: Vec3; contents: string[]; open: boolean }
  | { type: 'room'; id: RoomId; name: string; center: Vec3; adjacent: RoomId[] }
```

**API 设计**：
```typescript
// 从当前 gameStore 状态构建场景图
function buildSceneGraph(state: GameState): SceneGraph

// 查询API
function findEntity(graph: SceneGraph, configId: string): SceneNode | undefined
function getEntitiesInRoom(graph: SceneGraph, roomId: RoomId): SceneNode[]
function getContainerContents(graph: SceneGraph, containerId: string): string[]
function getAdjacentRooms(graph: SceneGraph, roomId: RoomId): RoomId[]
function getEntityPath(graph: SceneGraph, from: RoomId, toEntityId: string): RoomId[] | null
function isEntityAccessible(graph: SceneGraph, entityId: string): boolean
```

**使用方式**：
- 在 `useGameStore.getEntitySnapshot()` 中使用 sceneGraph 替代手动遍历
- 在 `findActiveGoal` 中使用 sceneGraph 查询
- 在 `interactionTargets.ts` 中使用 sceneGraph 优化查找
- 在 AI 分析中使用 sceneGraph 进行空间推理

**风险**：极低。纯新增文件，不改动任何现有代码。

---

### 方案D：事件系统统一

**策略**：建立统一的事件总线，所有事件产生后通过单一入口分发到所有消费者。

**当前问题分析**：
- `recentEvents` 在 GameStore 中维护，但只存简化信息
- `sessionStore.events` 存完整信息，但只在 commands.ts 中写入
- `triggerScriptedEvents()` 触发的事件不进入 sessionStore

**解决方案**：

1. **新增 `src/engine/eventBus.ts`**：
```typescript
type EventHandler = (event: SessionEvent) => void

const listeners: Set<EventHandler> = new Set()

export function subscribeEvent(handler: EventHandler): () => void
export function emitEvent(event: SessionEvent): void
```

2. **修改 `commands.ts`**：所有命令产生的 event 改为通过 `emitEvent` 分发

3. **修改 `useGameStore.triggerScriptedEvents()`**：脚本事件也通过 `emitEvent` 分发

4. **修改 `useSessionStore`**：订阅事件总线，自动记录所有事件

5. **修改 `HUD`**：订阅事件总线，自动更新 recentEvents 显示

6. **删除 `useGameStore.recentEvents`**：HUD 直接从事件总线获取

**风险**：中低。需要修改 commands.ts、useGameStore、useSessionStore、HUD 四个文件，但逻辑清晰。

---

## 三、执行进度与依赖关系

```
Phase 1: Scene Graph ✅ 已完成
   │
   ▼
Phase 2: 事件系统统一 ✅ 已完成
   │
   ▼
Phase 3: useGameStore 拆分 🔄 进行中（Slice已创建，主Store待重写）
   │
   ▼
Phase 4: 程序记忆实现 ⏳ 待做
```

### 当前实际进度

| Phase | 状态 | 关键交付物 |
|-------|------|-----------|
| Phase 1 | ✅ 完成 | `src/engine/sceneGraph.ts` (384行, 18个API), `sceneGraph.test.ts` (16测试通过) |
| Phase 2 | ✅ 完成 | `src/engine/eventBus.ts` (41行), `useSessionStore.ts` 已订阅事件总线, `recentEvents` 已从 GameStore 删除 |
| Phase 3 | 🔄 50% | 9个Slice文件已创建，但 `useGameStore.ts` 仍为1328行单体store，未改为组合模式 |
| Phase 4 | ⏳ 未开始 | 类型定义中 `memoryType='procedural'` 已存在，但无对应游戏机制 |

**优先级理由**：
1. **Scene Graph 最先**：零风险、不改动现有接口、为后续所有查询需求提供基础设施
2. **事件系统第二**：解决数据一致性问题，为 Store 拆分做准备
3. **Store 拆分第三**：最大的重构，但有了Scene Graph和统一事件后，拆分更干净
4. **程序记忆最后**：需要游戏设计层面的决策（序列如何定义、如何验证），应在前三个基础稳固后实施

---

## 四、详细执行步骤

### Phase 1: Scene Graph 运行时查询层

**修改文件**：
- **新增** `src/engine/sceneGraph.ts`：SceneGraph 数据结构和查询API
- **修改** `src/game/interactionTargets.ts`：使用 sceneGraph 优化查找
- **修改** `src/game/flow.ts`：使用 sceneGraph 查询
- **修改** `src/ai/analyzeSession.ts`：可选，使用 sceneGraph 进行空间分析

**验证**：
- 所有现有测试通过
- 交互距离计算结果与之前一致
- 目标判定结果与之前一致

### Phase 2: 事件系统统一

**修改文件**：
- **新增** `src/engine/eventBus.ts`：事件总线
- **修改** `src/store/useGameStore.ts`：
  - 删除 `recentEvents` 字段
  - `triggerScriptedEvents()` 改为通过事件总线分发
- **修改** `src/store/useSessionStore.ts`：订阅事件总线
- **修改** `src/game/commands.ts`：通过事件总线记录事件
- **修改** `src/components/arena3d/HUD.tsx`：从事件总线读取事件

**验证**：
- 所有现有测试通过
- 事件日志显示与之前一致
- SessionData 包含所有事件（包括脚本事件）

### Phase 3: useGameStore 内部模块化拆分（剩余工作）

**已完成**：
- ✅ `src/store/slices/` 目录及9个slice文件已创建
- ✅ 每个slice已提取对应的状态和action实现

**待完成**：
1. **重写 `src/store/useGameStore.ts`**：
   - 保留所有类型定义（GameState, GameStats, MemorySlot, FloatingText, EventToast, MoveAnimation, FeedbackState 等）
   - 保留 `isGoalSatisfied` 辅助函数和 `roomCenter` 辅助函数
   - 保留 `ViewMode` 和 `GamePhase` 类型导出
   - 保留 `toEntitySnapshots` 辅助函数
   - 删除所有状态初始值和action实现（已迁移到slice）
   - 改为组合模式：导入9个 `createXxxSlice(set, get)` 并展开
   - 保留 `getGameStats`（跨slice聚合数据，不适合放在单个slice中）

2. **类型和导入整理**：
   - slice文件中部分使用了 `any` 类型（如 `(e: any)`），需要确认是否影响编译
   - `memorySlice.ts` 从 `../useGameStore` 导入 `MemorySlot`，拆分后需改为在slice内部定义或从types导入
   - `scoreSlice.ts` 从 `../../game/scoring` 导入 `calcMemoryEffectiveRate` 但实际未使用，需清理

3. **验证**：
   - `npm run build` 通过
   - `npx vitest run` 所有测试通过（当前258个）
   - 游戏功能完全正常（第一关和第二关可稳定试玩）

### Phase 4: 程序记忆机制实现

**修改文件**：
- **修改** `src/types/task.ts`：GoalSpec 新增 `requiredSequence?: string[]`
- **修改** `src/types/memory.ts`：新增 `ProceduralMemory` 接口
- **修改** `src/store/useGameStore.ts`（或对应taskSlice）：新增 `proceduralMemories` 字段和序列验证逻辑
- **修改** `src/data/tasks/breakfast.ts`：在已有 procedural 目标上添加 `requiredSequence`
- **修改** `src/game/commands.ts`：pick/place 时检查程序记忆序列
- **修改** `src/components/arena3d/HUD.tsx`：显示当前程序记忆进度

**验证**：
- 所有现有测试通过
- breakfast 关卡的 procedural 目标可正常按序列完成
- 顺序错误时混乱值增加

---

## 五、风险评估

| 债务 | 风险等级 | 主要风险 | 缓解措施 |
|------|---------|---------|---------|
| useGameStore拆分 | 中 | 拆分时引入bug、测试覆盖不足 | 保持外部接口不变，逐一迁移并测试 |
| 程序记忆 | 低 | 游戏设计需要反复调整 | 先在最简单的关卡验证 |
| Scene Graph | 极低 | 无 | 纯新增，不改变现有代码 |
| 事件系统统一 | 低-中 | 事件丢失或重复 | 逐步替换，每步验证 |

---

## 六、假设与决策

1. **假设**：外部组件引用 `useGameStore` 的方式保持不变，只改内部实现
2. **决策**：Scene Graph 采用"运行时构建"而非"持久化存储"，保持简单
3. **决策**：事件总线采用同步模式，不引入异步复杂度
4. **决策**：程序记忆的序列验证只检查操作类型（pick/place/use），不检查具体对象
5. **决策**：Store 拆分为9个slice，而非更少或更多，因为每个领域（玩家/实体/记忆/混乱/得分/反馈/动画/心流/任务）的职责足够独立
