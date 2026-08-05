# HomeMem Arena - 技术架构

本文档描述的架构、模块、文件名均与当前代码（2026-08，main 分支）一一对应；若你发现不一致，以**实际代码为准**，并顺手同步本文件。

## 1. 技术栈

版本号严格对齐 [package.json](../../package.json)：

| 领域 | 技术 | 版本 | 说明 |
|------|------|------|------|
| 前端框架 | React | 19.2.7 | Strict Mode 开启 |
| 语言 | TypeScript | ~6.0.2 | 构建使用 `tsc -b` 多项目引用 |
| 构建工具 | Vite | 8.1.1 | 生产构建 `base: /homemem-arena/` |
| 3D 渲染 | Three.js / React Three Fiber 9 / drei 10 | three 0.185.1 | 所有 3D 模型为独立 GLB，经 Kenney 校准 |
| 状态管理 | Zustand | 5.0.14 | 组合式 slice，单字段 selector 订阅 |
| 路由 | React Router | 7.18.1 | BrowserRouter（SPA fallback 依赖 404.html） |
| 样式 | Tailwind CSS | 4.3.2 | 使用 `@tailwindcss/vite` 插件（Vite 8 原生兼容） |
| 测试 | Vitest 4.1.10 / Playwright 1.61.1 | + Testing Library / jsdom | 单元测试 345 项（含 schema、数据一致性、数值回归） |
| 静态检查 | Oxlint | 1.71.0 | Rust 实现的 ESLint 兼容检查器 |
| 部署 | GitHub Pages（Artifact Deploy） | - | `deploy.yml` 不使用 gh-pages 分支 |

## 2. 整体架构

按从上到下分层。**同一层内严格单向依赖**：UI 组件只通过 store action 调用游戏逻辑；游戏逻辑纯 TS，不得依赖 React。

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ① 用户界面层                                                             │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │  2D 组件 (src/components/* / src/pages/*)                         │  │
│  │   - 首页/任务选择/Arena/Probe/结果/SessionData 路由页面           │  │
│  │   - HUD / 任务面板 / 小地图 / 事件日志 / 帮助 / Toast / DialogBox │  │
│  │   - Header/Layout/ProbeCard/FailureBreakdown/MemoryTypeCards…    │  │
│  └───────────────────────────────┬───────────────────────────────────┘  │
│  ┌───────────────────────────────┴───────────────────────────────────┐  │
│  │  3D 组件 (src/components/arena3d/*)                                │  │
│  │   - Scene3D（组合房间、实体、容器、灯光、HUD 注入）                 │  │
│  │   - Room3D / Container3D / Object3D / Door3D                      │  │
│  │   - FirstPersonControls（Pointer Lock 相机）/ VirtualJoystick     │  │
│  │   - HUD / Minimap / ItemHintIndicator                             │  │
│  │   - models/: FurnitureModel / PropModel / FallbackModels /        │  │
│  │              RegisteredModel / ModelAsset / resolveAssetUrl        │  │
│  │   - effects/: ParticleRenderer / PixelationPass / feedback/*      │  │
│  │   - materials/: stylizedMaterials / palette / colors              │  │
│  └───────────────────────────────┬───────────────────────────────────┘  │
└──────────────────────────────────┼──────────────────────────────────────┘
                                   │ 组件通过单字段 selector 订阅 zustand
                                   │ 交互指令通过 store.dispatch / useGameStore actions
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ ② 状态管理层 (src/store)                                                │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐        │
│  │ useGameStore│  │useSessionSt│  │ useUiStore │  │useToastStore│        │
│  │  10 slices  │  │  研究数据  │  │ HUD/面板   │  │ 操作反馈   │        │
│  └─────┬──────┘  └──────┬─────┘  └─────┬──────┘  └─────┬──────┘        │
└────────┼────────────────┼───────────────┼───────────────┼───────────────┘
         │ action 调用    │ Session 写入  │ 用户偏好读写   │ Toast action
         ▼                ▼               ▼               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ ③ 纯逻辑层（无 React 依赖）                                              │
│  src/game/*    collision / commands / scoring / chaos / flow /          │
│               memorySlots / proceduralMemory / placement /             │
│               playerMovement / modelCalibration / interactionTargets   │
│  src/dialog/*  对话文本 + useDialog hook                                │
│  src/engine/*  sceneGraph（AABB / 父子层次 / 容器查找）                 │
│  src/effects/* particleSystem                                           │
│  src/save/*    saveSystem（本地存档，未接入自动化触发）                  │
│  src/ai/*      analyzeSession / updateRobotMemory（离线会话诊断）       │
└────────┬───────────────────────────────────────────────────────────────┘
         │ 读取配置
         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ ④ 静态数据层                                                             │
│  src/data/tasks/    clean-table / leave-home / laundry-sort（3 关）     │
│  src/data/assets/   modelRegistry（Kenney 模型尺寸 / 来源）             │
│  src/data/         rooms / decorFurniture / furnitureOwnership / levelBalance
│  public/assets/models/*  furniture/props/decor/kenney/*.glb            │
└─────────────────────────────────────────────────────────────────────────┘
```

## 3. 目录结构

> 仅列出关键模块与入口文件；具体 `.test.ts` 详见对应目录。

```
src/
├── App.tsx                        # 路由根，挂载 <Routes/> + <AudioInitializer/>
├── main.tsx                       # React 入口 + React.StrictMode + <BrowserRouter basename>
├── routes.tsx                     # 路由表：/tasks /play/:id /probe/:id /result/:id /data/:id
├── index.css                      # Tailwind 指令 + 动画 keyframes（combo-pop / cat-step …）
├── vite-env.d.ts                  # ImportMetaEnv（当前无 VITE_* 变量）
├── ai/                            # 离线会话诊断（非实时）
│   ├── analyzeSession.ts          # 输入完整 Session → 指标+失败模式+策略建议
│   └── updateRobotMemory.ts
├── audio/                         # Web Audio 音频系统
│   ├── audioManager.ts            # 音频上下文生命周期：解锁/静音/页面可见性切换
│   ├── bgm.ts                     # BGM 淡入淡出、层切换
│   ├── sfx.ts                     # 拾取/放置/开门/记忆保存 等音效
│   └── ambient.ts                 # 环境音（根据房间切换）
├── components/
│   ├── arena3d/                   # 3D 场景组件（R3F）
│   │   ├── Scene3D.tsx            # 场景根：灯光、天空/雾、房间、实体、HUD 注入、tickElapsed
│   │   ├── Room3D.tsx             # 程序化墙壁/门洞/地板/天花板
│   │   ├── Container3D.tsx        # 橱柜/咖啡桌/书架…，含开闭动画 + 内部物品位置
│   │   ├── Object3D.tsx           # 单个道具（模型+高亮+距离检测）
│   │   ├── Door3D.tsx             # 门模型+开关插值
│   │   ├── HUD.tsx                # 顶部状态条（时间/分数/评级/混乱值/记忆槽）+ Toast 堆 + 浮动文字
│   │   ├── Minimap.tsx            # SVG 小地图 + 玩家/房间/交互点
│   │   ├── FirstPersonControls.tsx # Pointer Lock + WASD + 旋转（对话打开时避让）
│   │   ├── VirtualJoystick.tsx    # 移动端触摸摇杆（可选）
│   │   ├── ChaosEffect.tsx        # 混乱值视觉（PixelationPass + 彩点）
│   │   ├── ItemHintIndicator.tsx  # 最近可交互物体高亮（名称/快捷键/距离）
│   │   ├── models/                # 模型渲染子层
│   │   │   ├── FallbackModels.tsx    # GLB 缺失时使用的几何替代体 + stylizedMaterials
│   │   │   ├── FurnitureModel.tsx    # 家具主渲染（cabinet/sofa/bed/…）+ 纹理剥离
│   │   │   ├── PropModel.tsx         # 小道具渲染（cup/bowl/key/…）
│   │   │   ├── ModelAsset.tsx        # GLB 加载 + stripAllTextures
│   │   │   ├── ModelRegistry.ts      # 模型 stem → 路径映射
│   │   │   ├── RegisteredModel.tsx   # 与 modelRegistry.ts 绑定的注册式加载器
│   │   │   └── resolveAssetUrl.ts    # import.meta.env.BASE_URL + public/assets/models
│   │   ├── effects/                 # 3D 特效
│   │   │   ├── ParticleRenderer.tsx    # 3D 粒子（记忆小妖痕迹）
│   │   │   └── PixelationPass.tsx      # 像素化后处理
│   │   ├── feedback/                # 特殊反馈特效
│   │   │   ├── CatPrintsEffect.tsx     # 猫脚印地板
│   │   │   ├── CatShadowEffect.tsx     # 猫恶作剧影子
│   │   │   └── PhoneRingEffect.tsx     # 电话铃声抖动
│   │   ├── materials/               # 材质调色
│   │   │   ├── stylizedMaterials.ts   # 复古像素材质（flatShading / vertexColors）
│   │   │   ├── palette.ts             # 16-bit 风格主色板
│   │   │   └── colors.ts / modelIds.ts
│   │   └── ObjectGeometries.tsx     # Fallback 的 Box/Capsule 几何表
│   ├── dialog/DialogBox.tsx        # 对话 UI + data-dialog-root 标记，避让 Pointer Lock
│   │       └── CharacterAvatar.tsx
│   ├── help/HelpPanel.tsx + helpContent.ts   # 快捷键/机制教学
│   ├── home/MemoryTypeCards.tsx    # 首页 4 种记忆类型介绍
│   ├── layout/Header / Footer / Layout.tsx
│   ├── probe/ProbeCard.tsx / ProbeSequence.tsx   # Probe 页 UI
│   ├── result/FailureBreakdown / MetricCards / PolicySuggestions
│   ├── tasks/TaskCard / TaskList
│   ├── ui/Badge / Button / Card / Toast
│   ├── data/DownloadButton / JsonPreview
│   ├── dev/AssetCalibrationView.tsx   # 3D 资产尺寸校准视图（研发用）
│   └── AudioInitializer.tsx       # 首次用户交互时解锁 AudioContext
├── data/                          # 静态数据
│   ├── assets/modelRegistry.ts    # 所有模型 stem → （glb 路径/尺寸/pivot/license）
│   ├── tasks/
│   │   ├── clean-table.ts         # 第 1 关：初次整理
│   │   ├── leave-home.ts          # 第 2 关：出门大作战
│   │   ├── laundry-sort.ts        # 第 3 关：洗衣幽灵
│   │   ├── index.ts               # 三关聚合 + 公开范围过滤
│   │   └── *.test.ts              # 关卡一致性测试
│   ├── rooms.ts                   # 6 个共享房间定义（入口/客厅/厨房餐厅/洗衣/卧室/工作间）
│   ├── decorFurniture.ts          # 装饰 + 家具静态摆放表
│   ├── furnitureOwnership.ts      # 家具归属（哪个家具属于哪个房间 / 谁的）
│   └── levelBalance.ts            # 关卡数值平衡：时间限制、奖励分、混乱系数
├── dialog/dialog.ts / dialogs.ts / useDialog.ts
├── effects/particleSystem.ts
├── engine/
│   ├── sceneGraph.ts              # 纯数据场景图：AABB、findRoom、container/entity 空间索引
│   └── sceneGraph.test.ts
├── game/                          # 纯逻辑层（所有 exports 均不含 React）
│   ├── chaos.ts                   # 混乱值事件：阈值/惩罚/对摆放的干扰
│   ├── collision.ts               # 玩家 vs 房间 vs 家具 AABB 阻挡
│   ├── commands.ts                # 交互命令：pickup/place/open/close/saveMemory / probe submit
│   ├── flow.ts                    # 心流：activeGoal、停滞提示、goal progress
│   ├── interactionTargets.ts      # 最近可交互容器与实体（findNearestInteractable*）
│   ├── memorySlots.ts             # 4 种记忆（spatial/object/temporal/procedural）+ 过期
│   ├── modelCalibration.ts        # Kenney stems 尺寸补偿（对摆放与 AABB 的修正）
│   ├── placement.ts               # 容器内摆放：坐标网格、堆叠、碰撞检测
│   ├── playerControls.ts          # 按键表 + 命令映射（F/E/V/Tab…）
│   ├── playerMovement.ts          # WASD 移动 + 墙滑 + 步频
│   ├── proceduralMemory.ts        # 记忆小妖：按概率触发记忆过期 + 重新发现
│   ├── scoring.ts                 # 分数/评级/Combo 计算
│   ├── sceneSchema.ts             # 关卡 schema 校验（objects/containers/goals 全链路）
│   ├── probeConsistency.test.ts / sceneSchema.test.ts / *.test.ts
│   └── threeLevelBackendSim.test.ts  # 三关后台模拟（无浏览器，只跑命令序列）
├── pages/                         # 路由页面
│   ├── HomePage.tsx               # 世界观 + 入口
│   ├── TaskSelectPage.tsx         # 三关卡片 + 关卡状态
│   ├── ArenaPage.tsx              # 3D 游戏主页面：<Layout/> + <Scene3D/> + 简报
│   ├── ProbePage.tsx              # 记忆评估探针
│   ├── ResultPage.tsx             # 分数 + 失败模式 + 策略建议
│   └── SessionDataPage.tsx        # Session JSON 下载 + 分析摘要
├── save/saveSystem.ts             # 本地 localStorage 存档（未接入自动保存）
├── store/                         # Zustand 状态
│   ├── slices/                    # 10 个 slice，全部被 useGameStore 组合
│   │   ├── animationSlice.ts      # 通用动画标志位（toast pop / combo flash）
│   │   ├── chaosSlice.ts          # chaosValue / 混乱事件触发 / addEventToast 封装
│   │   ├── entitySlice.ts         # entities[] / heldEntityId / containerStates
│   │   ├── feedbackSlice.ts       # eventToasts / feedback / hideFeedback / addEventToast
│   │   ├── flowSlice.ts           # 当前目标、停滞时间、心流提示
│   │   ├── memorySlice.ts         # memorySlots / 锁定/解锁/保存记忆
│   │   ├── playerSlice.ts         # robotPosition / robotRotation / isMoving / 步频
│   │   ├── progressSlice.ts       # goal 完成度、已达成 goal id、关卡阶段切换
│   │   ├── scoreSlice.ts          # score / combo / 最大 combo / 分数历史
│   │   └── taskSlice.ts           # task / phase / elapsedMs / seed / 当前房间、关卡初始化
│   ├── useGameStore.ts            # 主 store：10 个 slice 组合 + 公共类型 + useGameStore.test.ts
│   ├── useSessionStore.ts         # Session：events / probe answers / ai analysis
│   ├── useToastStore.ts           # 轻量操作反馈（瞬时反馈 Toast，与 eventToasts 职责不同）
│   ├── useUiStore.ts              # HUD 面板开关：任务面板 / 事件日志 / 小地图 / 帮助 / HUD 隐藏 / 音频
│   └── gameTypes.ts               # 通用切片类型
├── types/                         # 纯类型（不应 export 值）
│   ├── event.ts                   # 事件类型（scriptedEvent / playerAction / memoryEvent …）
│   ├── memory.ts                  # MemorySlot / MemoryType / MemoryConfidence
│   ├── object.ts                  # EntityState / ContainerState / ContainerSpec
│   ├── room.ts                    # RoomId / RoomSpec / DoorSpec
│   ├── session.ts                 # Session / ProbeAnswer / AnalysisResult
│   └── task.ts                    # TaskSpec / GoalSpec / Phase / ProbeSpec
└── utils/
    ├── e2eTestApi.ts              # window.__HOMEMEM_E2E__：Playwright 专用钩子
    ├── e2eTestApi.types.ts
    └── format.ts                  # 持续时间格式化、评级 S/A/B/C/D
```

## 4. 状态管理架构

### 4.1 四层 store 划分

| Store | 负责 | 典型字段 | 典型消费者 |
|-------|------|---------|-----------|
| `useGameStore` | 游戏进行中的即时世界状态 | task, phase, entities, containers, memorySlots, chaosValue, score, combo, elapsedMs, robotPosition | Scene3D / HUD / Minimap / ItemHintIndicator / commands.ts |
| `useSessionStore` | 研究数据：长期可导出 | events[], probeAnswers[], aiAnalysis, capturedProbes, sessionId | ProbePage / ResultPage / SessionDataPage / analyzeSession |
| `useUiStore` | HUD 布局偏好（非游戏数据） | taskPanelOpen, eventLogOpen, minimapOpen, controlsOpen, memoryBarOpen, hudHidden, audioEnabled | HUD / Layout / Header / AudioInitializer |
| `useToastStore` | 瞬时操作反馈 Toast（命中/未命中/距离过远） | toasts[] | commands.ts + HUD（右上角飘字） |

> 注意：`addEventToast`（记录事件并进入 Session）在 `feedbackSlice`，和 `useToastStore` 的瞬时反馈**不是同一回事**。前者是研究数据，后者是 UX。不要混用。

### 4.2 useGameStore 的 10 个 slice（真实存在）

每个 slice 都是一个函数 `(set, get) => Partial<GameState & GameActions>`，在 [useGameStore.ts](../../src/store/useGameStore.ts) 中按顺序 compose 到一起。调用其他 slice 的 action 时必须用 `get().otherAction(...)` 或 `set(...)`，**禁止在 slice 顶层 import useGameStore**（循环依赖会导致 undefined）。

```
useGameStore
├── animationSlice      # animateOpen、comboFlashTimer 等
├── chaosSlice          # chaosValue、applyChaosPenaltyOnEvent、连续错误惩罚
├── entitySlice         # entities[]、heldEntityId、containerStates、spawn/place/move
├── feedbackSlice       # eventToasts[]、feedback、hideFeedback、addEventToast(含对象入参守卫)
├── flowSlice           # activeGoalId、stagnationMs、activeFlowHint
├── memorySlice         # memorySlots[]、lock/unlock/save memory、confidenceDecay
├── playerSlice         # robotPosition / robotRotation / isMoving / visitedRooms
├── progressSlice       # achievedGoalIds[]、phase 切换（briefing → playing → probe → final）
├── scoreSlice          # score、combo、maxCombo、comboStreakMs
└── taskSlice           # task、phase、elapsedMs、seed、currentRoom、tickElapsed
```

### 4.3 状态更新流程（避免无限循环的约定）

```
用户输入  →  commands.ts 纯逻辑计算  →  useGameStore action + useSessionStore write
   ▲                                                  │
   │                                                  ▼
React 组件  ←── useXxxStore(selector 单字段订阅)  ←── setState / setState 批
```

订阅**禁止跨 store 写**。若组件需要在 A 状态变化时写 B：
1. 优先在 action 层一次性原子写入（commands.ts 示例：pickup 同步更新 entity + feedback + score）；
2. 其次用 `useEffect` + 显式依赖，内部用 `getState()` 取其他 store 快照，**不要把 state 放进依赖导致循环**（参考我们修过的 [ProbePage.tsx](../../src/pages/ProbePage.tsx) 的模式）。

高频订阅陷阱：
- `elapsedMs` 在 taskSlice 中每帧 60fps 更新；HUD **不要订阅 elapsedMs**，而是用独立的 4fps 轮询组件 `TimeDisplay`（见 [HUD.tsx](../../src/components/arena3d/HUD.tsx)）。
- `openProgress` / `pulseTime` 等 3D 动画驱动量：必须用 `useRef` + 直改 Three.js 对象，**不要每帧 setState**（见 [Container3D.tsx](../../src/components/arena3d/Container3D.tsx) 的 `openProgressRef` / `pulseTimeRef` 模式）。

## 5. 3D 渲染架构

### 5.1 React Three Fiber 组件层次（真实文件）

```
<ArenaPage>
  <Layout>
    <Canvas shadows={false} dpr={[1,1.5]} frameloop="always">
      <Scene3D>
        {/* 场景设置 */}
        <color attach="background" /> <fog attach="fog" />
        <ambientLight />, <directionalLight />, <hemisphereLight />
        {/* 房间层 */}
        <Room3D key={roomId} />  * 6 房间
        {/* 交互层 */}
        <Container3D key={containerId} /> * N
        <Object3D    key={entityId}    /> * M
        <Door3D      key={doorId}      /> * K
        {/* 反馈层 */}
        <ChaosEffect />
        <ParticleRenderer />
        <ItemHintIndicator />
        {/* 控制层 */}
        <FirstPersonControls />
        {/* HUD 层（通过 R3F 的 <Html/> 或外部 sibling 渲染） */}
        <HUD/>
        {/* 后处理 */}
        <PixelationPass/>
      </Scene3D>
    </Canvas>
  </Layout>
</ArenaPage>
```

### 5.2 纹理 / 模型加载约定

- **剥离纹理**：所有外部 GLB 经 [ModelAsset.tsx](../../src/components/arena3d/models/ModelAsset.tsx) 的 `stripAllTextures`，将材质 `map/normalMap/roughnessMap/metalnessMap/emissiveMap` 字段逐一置为 `null` 并 `dispose()`，避免因为 Kenney 模型的纹理命名差异触发 404 网络请求，降低 WebGL 上下文崩溃风险。
- **Fallback 几何体**：GLB 加载失败或未配置 stem 时使用 [FallbackModels.tsx](../../src/components/arena3d/models/FallbackModels.tsx) 的 Box/Capsule/RoundedBox 几何体 + stylizedMaterials 平涂渲染。
- **URL 解析**：模型 URL 统一走 [resolveAssetUrl.ts](../../src/components/arena3d/models/resolveAssetUrl.ts)，内部拼 `import.meta.env.BASE_URL + public/assets/models/<category>/<stem>.glb`，保证 GitHub Pages 部署与本地 dev 路径一致。
- **Kenney 子包**：新增的 Kenney 核心 living asset 五个 stem（bookcaseOpen / cabinetTelevision / loungeSofa / tableCoffee / televisionModern）放在独立目录 `public/assets/models/kenney/furniture/`，与既有 `furniture/` 解耦，附带独立 [SOURCE.md](file:///Users/azq/asandstar/homemem-arena-web-demo/public/assets/models/kenney/SOURCE.md) + LICENSE.txt + MANIFEST.sha256。

### 5.3 渲染优化策略（已落地）

| 优化项 | 落地位置 | 实现方式 |
|--------|---------|---------|
| 容器 pulse/开关 去 setState | Container3D | `useRef` 存 `pulseTimeRef / openProgressRef`，useFrame 直接改 mesh 的 scale/opacity/intensity；仅当 openProgress 真变化时 `setOpenTick` 同步一次 React |
| HUD 时间刷新降频 | HUD → TimeDisplay | 250ms 轮询 `useGameStore.getState().elapsedMs`，秒数变化再 setState，HUD 不订阅 elapsedMs |
| HUD 单字段 selector | HUD 全部订阅行 | 一个 useGameStore 一行，禁止取整个 `s => s`；相等比较是 zustand 的浅比较，大对象必须拆字段 |
| GLB 纹理剥离 | ModelAsset stripAllTextures | 消除缺失纹理的 GET 404；降低 GPU 纹理单元压力 |
| Pointer Lock 避让对话 | FirstPersonControls + DialogBox | DialogBox 挂 `data-dialog-root`；FP handleMouseDown 里若查到该标记直接 return，不请求锁定；DialogBox 挂载时主动 `exitPointerLock()` |
| fallback 复用几何体 | ObjectGeometries + stylizedMaterials | 相同 stem 共享 Box/Sphere/Cylinder 声明，避免每实例重建 |

## 6. 音频系统架构

### 6.1 音频模块划分

```
audio/
├── audioManager.ts   # 单例 AudioContext 管理
│                    #  - 首次用户手势解锁 context（与 AudioInitializer.tsx 配合）
│                    #  - 标签页可见性切换时的 suspend/resume
│                    #  - useUiStore audioEnabled 开关 → masterGain 0 或 1
│                    #  - 防止上下文 suspend 后 GC
├── bgm.ts            # 多轨 BGM 分层播放 + 混乱值越高压榨越强烈
├── sfx.ts            # 一次性音效：pickup / place / open / saveMemory / wrong-action / cat-meow
└── ambient.ts        # 房间环境音层：客厅 TV、厨房排风声、卧室空调等，根据 currentRoom 切换
```

### 6.2 生命周期要点（P0 已实现）

- **解锁时机**：[AudioInitializer.tsx](../../src/components/AudioInitializer.tsx) 监听首次 `pointerdown / keydown / touchend` 后调 `audioManager.resume()`，满足浏览器"AudioContext 必须由用户手势启动"的限制。
- **标签页切后台**：`document.visibilitychange` → 若切 hidden，suspend context 并记录状态；切回 visible 时 restore。避免后台长时间占用 Audio 线程。
- **静音/恢复**：`useUiStore.getState().audioEnabled` 变化时只改 masterGain，不重建 context。
- **组件卸载不 dispose**：audioManager 是单例，**任何组件卸载都不要 dispose AudioContext**。

## 7. 碰撞与交互

### 7.1 三级空间查询

| 层级 | 代码位置 | 方式 | 频率 |
|------|---------|------|------|
| 玩家 vs 房间 / 家具 AABB 阻挡 | game/collision.ts | 轴对齐包围盒，沿墙滑动分解轴，先 X 后 Z | 每帧 playerMovement |
| 最近可交互容器/实体 | game/interactionTargets.ts  `findNearestInteractableContainer/Entity` | 遍历 + 距离 + 朝向夹角（`dot(viewDir, toTarget)` 阈值 >0.6） | 每帧 Scene3D → ItemHintIndicator |
| 容器内摆放 | game/placement.ts + ContainerSpec size/slots | 网格对齐 + 容器 AABB 内 + 与已放物品 AABB 不相交 | 每次 place 命令 |

### 7.2 交互命令

所有高级交互走 [commands.ts](../../src/game/commands.ts) 的纯函数，参数为世界状态（`useGameStore.getState()`）+ 命令类型。`commands.ts` 返回 `{ success, feedback, events, statePatch, scoreDelta }`，调用方（`ArenaPage` + Scene3D 的键盘/Pointer 事件处理）再一次性 apply 到 store 和 Session，保证 Session 事件日志与实际状态 100% 对应，不会出现"状态改了但研究日志没记录"的分裂。

## 8. 事件 / 心流 / 混乱脚本系统

| 子系统 | 代码 | 触发条件 | 典型行为 |
|-------|------|---------|---------|
| 心流停滞提示 | flow.ts + HUD 中的 activeFlowHint | 同一 goal 20s 无进度 → 轻提示；45s → 记忆策略提示 | 写入 `eventToasts`，不扣分 |
| 连续错误惩罚 | chaosSlice.applyChaosPenaltyOnEvent | 3 次同类型错误（放错容器/距离过远等） | chaosValue += 阈值，并显示 `⚠️ 连续错误操作！混乱值增加！` 事件 |
| 过期记忆"小妖" | proceduralMemory.ts | 按 `P0_PERTURB_PROBABILITY` 的概率，在 `P0_PERTURB_INTERVAL_MS` 触发 | 记忆槽 confidence 下降；超过阈值时标记过期；下次 E 可重新写入 |
| 混乱值全局扰动 | chaos.ts tick | chaosValue >= 60 时 | 非关键家具轻微抖动、PixelationPass 强化；HUD 混乱条渐红 |

## 9. 存档与研究数据

### 9.1 saveSystem

`src/save/saveSystem.ts` 提供读写 `localStorage` 的工具函数，但**目前没有接入每 30 秒自动保存、离开保存、玩家手动保存按钮**（之前 setup.md/architecture.md 写的"每 30 秒自动保存"是虚构功能）。后续若要接入，应当：
1. 在 Scene3D 的 useEffect 里 `setInterval(60_000)` 周期性调用；
2. Phase 从 playing 退出时写入；
3. 与 useSessionStore 的事件日志合并成可恢复的完整快照。

### 9.2 Session 数据（研究路径）

研究数据走 `useSessionStore`，与 play 游戏状态严格解耦。一条完整 Session 的数据流转：

```
ArenaPage 初始化  →  session.new()  seed + taskId + 开始时间
  每一条命令/事件   →  session.pushEvent(playerAction | scriptedEvent | memoryEvent | goalEvent)
ProbePage 完成     →  session.setProbeAnswers(probeId, [{ optionId, reactionMs, isCorrect }])
ResultPage 挂载   →  const analysis = analyzeSession(session)
                     session.setAiAnalysis(analysis)
SessionDataPage    →  session.exportJSON()（自动触发下载）
                     + 渲染 analysis.summary / failureBreakdown / policySuggestions
```

字段完整定义见 [src/types/session.ts](../../src/types/session.ts)；分析算法定义见 [src/ai/analyzeSession.ts](../../src/ai/analyzeSession.ts)。

## 10. 数据流转（高层）

```
[ src/data/* + tasks ]
       │  初始化 Task/房间/家具摆放
       ▼
useGameStore.initializeTask(taskId)
       │
       ▼
user actions ──commands.ts──▶ patch game state + push Session event
       │                          │
       ▼                          ▼
HUD/Scene rerender            useSessionStore.events
       │                          │
       │                          ├─ probe → useSessionStore.setProbeAnswers
       │                          └─ finalize → analyzeSession
       │                                                     │
       ▼                                                     ▼
play/playing → probe → final 阶段                       ResultPage / SessionDataPage
```

## 11. 测试策略与入口

| 测试类型 | 命令 | 位置 | 职责 |
|---------|------|------|------|
| 单元/集成 | `npm test` | `src/**/*.test.ts` （345 项） | 纯逻辑：碰撞/指令/混乱/心流/摆放/记忆槽/模型校准/数值回归/关卡 schema |
| 数据一致性 QA | `npm run qa` 中的 `qa:assets / qa:rooms / qa:tasks / qa:layout` | `scripts/qa-*.ts` | 房间拓扑、资产 stem、关卡目标可达性、小地图坐标契约 |
| 类型 | `npm run qa:static` | tsc --noEmit | 类型 + 引用完整 |
| 端到端 | `npm run e2e` | `playwright.config.ts` + `tests/e2e/` | 三关黄金路径、dev 路由直接跳转、canvas 首帧稳定判空 |

## 12. 构建与部署

### 12.1 构建命令（真实）

| 命令 | 用途 |
|------|------|
| `npm run dev` / `dev:stable` | 本地开发 |
| `npm run build` | tsc -b（类型） + vite build（产物 dist/） |
| `npm run preview` | 预览 dist/ |
| `npm run cache:clean` | 清空 Vite 预编译 + TS buildinfo，构建出错时第一条命令 |

### 12.2 部署流程（实际）

**不使用 gh-pages 分支**。而是 push `main` 触发 [.github/workflows/deploy.yml](../../.github/workflows/deploy.yml)：

1. lint → test → `npm run qa`（含 build）；
2. `actions/configure-pages@v5` 准备 Pages Environment；
3. `actions/upload-pages-artifact@v3` 把 `dist/` 打包上传；
4. `actions/deploy-pages@v4` 部署到 `asandstar.github.io/homemem-arena/`。

非 `main` 分支 push 时触发 [ci-preview.yml](../../.github/workflows/ci-preview.yml)，只跑 lint/test/qa/build，并把 `dist/` 作为 artifact 上传保留 3 天，方便 PR 预览。

---

**最后**：本文档与 [setup.md](../dev/setup.md) / [coding-standard.md](../dev/coding-standard.md) / 代码是互相依赖的三份事实。每次改 slices 划分、状态管理约定、3D 组件树或部署链路后，应同步更新本文件对应章节，避免"文档=想象"。
