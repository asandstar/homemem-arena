# HomeMem Arena v2 - 3D 研究工具原型

## 项目重定位

**v1**：2D 顶层俯视 + 色块，演示用，**对研究无价值**。

**v2**：基于 **react-three-fiber + drei** 的第一人称 3D 网页仿真，专注于：
- 真实的观察空间（机器人第一人称视角）
- 真实的遮挡与可见性
- 真实的物体状态（脏/干净、已分/未分 等）
- 脚本化环境事件（"妈妈把杯子收起来了"）
- 结构化记忆库（spatio-temporal-object 三元组）
- 可导出研究数据集

## 4 个任务定义

### 任务 1：准备出门
- **目标**：找到钥匙、手机、雨伞、充电宝，放到玄关托盘
- **记忆类型**：空间记忆 + 物体位置记忆
- **核心挑战**：离开房间后记住物体最后出现位置
- **典型失败**：忘记钥匙位置、混淆手机和充电宝

### 任务 2：收拾餐桌
- **目标**：脏杯子→水槽、盘子→洗碗机、垃圾→垃圾桶、遥控器→茶几
- **记忆类型**：物体状态记忆 + 类别规则记忆
- **核心挑战**：区分脏/干净、垃圾/非垃圾
- **典型失败**：错放容器、把遥控器当垃圾

### 任务 3：洗衣分类
- **目标**：白色/深色/毛巾分别放入对应篮子
- **记忆类型**：时间记忆 + 计数记忆 + 重复动作记忆
- **核心挑战**：记住已分类数量
- **典型失败**：重复分类、遗漏

### 任务 4：早餐准备与归位
- **目标**：冰箱取牛奶→柜子取杯碗→桌上取麦片→早餐准备→归位
- **记忆类型**：流程记忆 + 容器状态 + 状态变化
- **核心挑战**：多步骤依赖、状态跟踪
- **典型失败**：忘记取物、忘记归位

## 技术架构

### 栈
- **react-three-fiber + @react-three/drei**：声明式 3D
- **zustand**：状态管理
- **typescript**：类型安全
- **vite**：构建
- **tailwindcss**：UI

### 3D 场景简化策略
- **不做真实物理**（无 rapier），物体吸附 + 位置约束
- **不做角色动画**（机器人 = 一个胶囊体）
- **不做复杂材质**（MeshStandardMaterial 即可）
- **第一版只做客厅、厨房、卧室、玄关 4 个房间**

## 数据结构

### 任务配置 (TaskConfig)
```typescript
{
  id: string
  name: string
  description: string
  memoryTypes: MemoryType[]
  difficulty: 'easy' | 'medium' | 'hard'
  rooms: RoomSpec[]
  objects: ObjectSpec[]
  containers: ContainerSpec[]
  goals: GoalSpec[]
  scriptedEvents: ScriptedEventSpec[]
  probeQuestions: ProbeQuestionSpec[]
}
```

### 物体类型 (ObjectSpec)
```typescript
{
  id: string
  name: string              // "钥匙"
  category: ObjectCategory  // 'key' | 'phone' | 'cup' | 'plate' | ...
  initialRoom: RoomId
  initialPosition: [x, y, z]
  size: [w, h, d]
  color: string
  stateProperties: {        // 任务相关状态
    cleanliness?: 'clean' | 'dirty'
    classified?: boolean
    picked?: boolean
    ...
  }
}
```

### 房间 (RoomSpec)
```typescript
{
  id: RoomId
  name: string
  center: [x, y, z]
  size: [w, h, d]
  walls: WallSpec[]         // 简化：每个房间是 1 个 box
  doors: DoorSpec[]         // 连接到其他房间的门
  ambientColor: string      // 灯光色调
}
```

### 事件 (SessionEvent)
```typescript
type SessionEvent =
  | ObservationEvent       // 周期性观察：可见物体列表
  | MovementEvent          // 机器人移动到某房间
  | ActionEvent            // 拾取/放置/打开/关闭
  | MemoryWriteEvent       // 写入记忆
  | TaskProgressEvent      // 目标达成/失败
  | ScriptedEventTrigger   // 脚本事件触发
  | ProbeAnswerEvent       // 记忆测试回答
```

### 记忆 (MemoryEntry)
```typescript
{
  id: string
  type: 'spatial' | 'object' | 'temporal' | 'procedural'
  content: string          // 自然语言描述
  subject: string          // 物体名
  room: RoomId | null      // 关联房间
  timestamp: number
  confidence: number       // 0-1
  source: 'observation' | 'action' | 'scripted'
}
```

## 组件结构

```
src/
  types/
    task.ts
    object.ts
    room.ts
    event.ts
    memory.ts
  data/
    tasks/
      leave-home.ts
      clean-table.ts
      laundry-sort.ts
      breakfast.ts
    rooms/
      shared.ts            // 4 个任务共享的房间布局
  ai/
    generateMemory.ts      // 事件 → 记忆
    generateProbes.ts      // 任务 → 记忆测试题
    analyzeSession.ts      // 完整 session → 指标/失败原因/建议
    updateMemory.ts        // 当前事件 → 更新记忆库
  store/
    useGameStore.ts
    useSessionStore.ts
    useMemoryStore.ts
  pages/
    HomePage.tsx
    TaskSelectPage.tsx
    ArenaPage.tsx          // 3D 场景
    ProbePage.tsx
    ResultPage.tsx
    SessionDataPage.tsx
  components/
    arena3d/
      Scene.tsx            // 3D 主场景
      Robot.tsx            // 机器人
      Room.tsx             // 房间
      Object3D.tsx         // 物体
      Container3D.tsx      // 容器
      Door.tsx             // 门
      HUD.tsx              // 第一人称 UI
      Minimap.tsx          // 小地图
    ui/
      Button.tsx
      Card.tsx
      Badge.tsx
      Toast.tsx
    layout/
      Header.tsx
      Footer.tsx
      Layout.tsx
    memory/
      MemoryPanel.tsx
      MemoryList.tsx
    probe/
      ProbeCard.tsx
      ProbeSequence.tsx
    result/
      MetricCards.tsx
      FailureBreakdown.tsx
      PolicySuggestions.tsx
    data/
      JsonPreview.tsx
```

## MVP 实施步骤

### 阶段 1：基础设施重构（1）
- 删除 v1 的 2D FloorPlan/GameState 相关代码
- 安装 r3f + drei 依赖
- 重写类型系统（task/object/room/event/memory）
- 改造 Zustand store 结构

### 阶段 2：3D 场景核心（2-3）
- 实现 4 个共享房间的 3D 几何
- 实现机器人胶囊体 + 第一人称相机
- 实现物体 3D 渲染
- 实现房间间导航（穿门移动）
- 实现拾取/放置/容器开合

### 阶段 3：观察系统（4）
- 第一人称 FOV 计算
- 可见性计算（基于视锥 + 射线检测遮挡）
- 周期性 ObservationEvent 生成
- 状态栏：当前房间、视野内物体数

### 阶段 4：任务配置（5）
- 实现 4 个任务数据文件
- 目标判定逻辑
- 脚本事件调度

### 阶段 5：记忆与 AI（6）
- 事件 → 记忆生成
- 记忆库 UI
- 记忆测试题生成与判定
- Session 分析函数

### 阶段 6：UI 与页面（7）
- 更新各页面
- HUD（头顶信息条）
- 小地图
- 任务选择页更新
- 结果页更新

### 阶段 7：构建与验证（8）
- npm run build 通过
- 端到端流程测试

## 风险与决策

1. **3D 资产缺失**：第一版用**程序化几何**（Box/Sphere/Cylinder），不依赖 GLTF 模型
2. **物理交互简化**：物体吸附到容器内（位置约束），不需要真实物理
3. **第一人称导航**：用 PointerLockControls（drei 提供），WASD 移动
4. **观察采样频率**：每秒 1 次采样，避免事件爆炸
5. **记忆库膨胀**：每次新观察会覆盖旧观察，限制总记忆数
