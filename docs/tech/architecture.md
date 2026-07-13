# HomeMem Arena - 技术架构

## 1. 技术栈

| 领域 | 技术 | 版本 |
|------|------|------|
| 前端框架 | React | 19 |
| 语言 | TypeScript | 6 |
| 构建工具 | Vite | 8 |
| 3D渲染 | Three.js / React Three Fiber / drei | 0.165+ |
| 状态管理 | Zustand | 4.5 |
| 路由 | React Router | 7 |
| 样式 | Tailwind CSS | 4 |
| 测试 | Vitest + Oxlint + Playwright | - |

## 2. 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                      用户界面层                             │
│  ┌──────────────────┐  ┌─────────────────────────────────┐  │
│  │   2D UI 组件      │  │         3D 场景组件              │  │
│  │  HUD、菜单、      │  │  Scene3D、相机控制、实体渲染     │  │
│  │  对话框、小地图    │  │  容器渲染、粒子效果              │  │
│  └────────┬─────────┘  └──────────────┬──────────────────┘  │
└───────────┼───────────────────────────┼─────────────────────┘
            │                           │
            ▼                           ▼
┌─────────────────────────────────────────────────────────────┐
│                      状态管理层                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ task     │ │ entity   │ │ memory   │ │ player   │       │
│  │ slice    │ │ slice    │ │ slice    │ │ slice    │       │
│  │ (任务)   │ │ (实体)   │ │ (记忆)   │ │ (玩家)   │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ ui       │ │ audio    │ │ particle │ │ save     │       │
│  │ slice    │ │ slice    │ │ slice    │ │ slice    │       │
│  │ (界面)   │ │ (音频)   │ │ (粒子)   │ │ (存档)   │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│                      游戏逻辑层                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ collision│ │ movement │ │ scoring  │ │ scripting│       │
│  │ (碰撞)   │ │ (移动)   │ │ (计分)   │ │ (脚本)   │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│                      数据层                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ tasks    │ │ entities │ │ rooms    │ │ config   │       │
│  │ (任务)   │ │ (实体)   │ │ (房间)   │ │ (配置)   │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
└─────────────────────────────────────────────────────────────┘
```

## 3. 目录结构

```
src/
├── audio/                    # 音频系统
│   ├── bgm.ts               # 背景音乐管理
│   ├── sfx.ts               # 音效管理
│   ├── ambient.ts           # 环境音效管理
│   └── index.ts
├── components/              # UI和3D组件
│   ├── arena3d/            # 3D场景相关
│   │   ├── Scene3D.tsx     # 主场景组件
│   │   ├── CameraControl.tsx # 相机控制
│   │   ├── EntityRenderer.tsx # 实体渲染
│   │   ├── ContainerRenderer.tsx # 容器渲染
│   │   ├── RoomRenderer.tsx # 房间渲染
│   │   ├── effects/        # 效果组件
│   │   │   └── ParticleRenderer.tsx
│   │   └── ui/             # 3D UI组件
│   │       └── FloatingText.tsx
│   ├── ui/                 # 2D UI组件
│   │   ├── HUD.tsx         # 游戏HUD
│   │   ├── MemorySlot.tsx  # 记忆槽组件
│   │   ├── DialogBox.tsx   # 对话框
│   │   ├── Minimap.tsx     # 小地图
│   │   └── Toast.tsx       # 提示框
│   └── common/             # 通用组件
├── game/                   # 游戏逻辑
│   ├── collision.ts        # 碰撞检测
│   ├── movement.ts         # 移动逻辑
│   ├── scoring.ts          # 计分系统
│   ├── scripting.ts        # 脚本事件
│   └── time.ts             # 时间管理
├── store/                  # Zustand状态管理
│   ├── slices/             # 状态切片
│   │   ├── taskSlice.ts    # 任务状态
│   │   ├── entitySlice.ts  # 实体状态
│   │   ├── memorySlice.ts  # 记忆状态
│   │   ├── playerSlice.ts  # 玩家状态
│   │   ├── uiSlice.ts      # UI状态
│   │   ├── audioSlice.ts   # 音频状态
│   │   ├── particleSlice.ts # 粒子状态
│   │   └── saveSlice.ts    # 存档状态
│   ├── useGameStore.ts     # 主Store
│   └── middleware/         # 中间件
├── data/                   # 游戏数据
│   ├── tasks/              # 任务配置
│   │   ├── leave-home.ts
│   │   ├── clean-table.ts
│   │   ├── laundry-sort.ts
│   │   ├── breakfast.ts
│   │   └── index.ts
│   └── rooms/              # 房间配置
├── types/                  # TypeScript类型
│   ├── task.ts             # 任务类型
│   ├── entity.ts           # 实体类型
│   ├── memory.ts           # 记忆类型
│   ├── audio.ts            # 音频类型
│   └── game.ts             # 游戏通用类型
├── effects/                # 效果系统
│   └── particleSystem.ts   # 粒子效果管理
├── save/                   # 存档系统
│   └── saveSystem.ts       # 存档管理
├── hooks/                  # 自定义Hooks
│   ├── useGameLoop.ts      # 游戏循环
│   ├── useKeyboard.ts      # 键盘输入
│   ├── useMouse.ts         # 鼠标输入
│   └── useAudio.ts         # 音频控制
├── pages/                  # 页面组件
│   ├── HomePage.tsx        # 首页
│   ├── TaskSelectPage.tsx  # 任务选择
│   └── ArenaPage.tsx       # 游戏主页面
├── App.tsx                 # 应用入口
├── main.tsx                # React入口
└── index.css               # 全局样式
```

## 4. 状态管理架构

### 4.1 Zustand Store 结构

```
gameStore
├── task        # 任务相关状态
│   ├── currentTask
│   ├── phase
│   ├── goals
│   ├── scriptedEvents
│   └── probes
├── entity      # 实体相关状态
│   ├── entities
│   ├── containers
│   └── selectedEntity
├── memory      # 记忆相关状态
│   ├── slots
│   ├── memories
│   └── confidenceDecay
├── player      # 玩家相关状态
│   ├── position
│   ├── rotation
│   ├── isMoving
│   └── inventory
├── ui          # UI相关状态
│   ├── dialogs
│   ├── toasts
│   ├── minimapVisible
│   └── hudVisible
├── audio       # 音频相关状态
│   ├── bgmVolume
│   ├── sfxVolume
│   └── ambientVolume
├── particle    # 粒子相关状态
│   └── activeEffects
└── save        # 存档相关状态
    ├── saves
    └── lastSaveTime
```

### 4.2 状态更新流程

```
用户操作 → Store Action → 状态变更 → React组件重渲染
     ↓              ↓              ↓
   键盘/鼠标     setState        自动订阅更新
   输入事件     (Zustand)       (useGameStore)
```

## 5. 3D渲染架构

### 5.1 React Three Fiber 组件层次

```
<Canvas>
  <Scene3D>
    <RoomRenderer />        # 房间模型
    <ContainerRenderer />   # 容器模型
    <EntityRenderer />      # 实体模型
    <ParticleRenderer />    # 粒子效果
    <CameraControl />       # 相机控制
    <FloatingText />        # 浮动文字
  </Scene3D>
</Canvas>
```

### 5.2 渲染优化策略

| 优化项 | 实现方式 |
|--------|---------|
| 实例化渲染 | 使用 InstancedMesh 渲染大量相同物体 |
| 视锥剔除 | React Three Fiber 自动处理 |
| 层级LOD | 根据距离切换模型精度 |
| 阴影优化 | 限制阴影贴图大小和范围 |

## 6. 音频系统架构

### 6.1 音频模块划分

```
audio/
├── bgm.ts          # 背景音乐（多层音轨）
├── sfx.ts          # 音效（角色、容器、系统）
├── ambient.ts      # 环境音效（房间专属）
└── index.ts        # 统一导出
```

### 6.2 BGM 多层音轨

```
BGM系统
├── Melody Track    # 主旋律
├── Chords Track    # 和弦背景
├── Bass Track      # 低音支撑
└── Percussion Track # 打击乐
```

### 6.3 动态音频效果

- 根据混乱值调整音量和频率
- 根据房间切换环境音效
- 根据游戏事件触发音效

## 7. 碰撞检测系统

### 7.1 碰撞类型

| 类型 | 检测方式 |
|------|---------|
| 房间边界 | AABB碰撞检测 |
| 家具碰撞 | AABB碰撞检测 |
| 交互范围 | 距离检测 |

### 7.2 碰撞响应

- 边界阻挡：阻止玩家移出房间
- 滑动碰撞：沿墙滑动避免卡住
- 交互高亮：进入范围时高亮可交互物体

## 8. 脚本事件系统

### 8.1 事件类型

| 类型 | 描述 |
|------|------|
| move-entity | 移动实体位置 |
| message | 显示消息提示 |
| change-state | 改变实体状态 |
| trigger-memory | 触发记忆过期 |

### 8.2 事件触发机制

```
游戏循环 → 检查事件触发条件 → 执行事件 → 更新状态 → 播放反馈
```

## 9. 存档系统

### 9.1 存档数据结构

```
SaveData
├── id              # 存档ID
├── timestamp       # 保存时间
├── taskId          # 当前任务ID
├── taskPhase       # 当前阶段
├── entities        # 实体状态
├── playerState     # 玩家状态
├── memoryState     # 记忆状态
├── score           # 当前分数
└── chaosLevel      # 当前混乱值
```

### 9.2 存档策略

- **自动保存**：每30秒自动保存
- **退出保存**：离开游戏时保存
- **手动保存**：玩家手动触发

## 10. 数据流转

```
配置数据 (data/)
    ↓
游戏初始化 → Store 加载状态
    ↓
玩家操作 → Store Action
    ↓
状态变更 → 组件重渲染 + 效果触发
    ↓
事件触发 → 状态更新 → 反馈播放
    ↓
游戏结束 → 结果保存 → 返回任务选择
```

## 11. 开发环境

### 11.1 构建命令

| 命令 | 用途 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 构建生产版本 |
| `npm run test` | 运行单元测试 |
| `npm run lint` | 代码检查 |
| `npm run e2e` | 运行端到端测试 |

### 11.2 环境变量

| 变量 | 默认值 | 用途 |
|------|-------|------|
| `VITE_APP_NAME` | HomeMem Arena | 应用名称 |
| `VITE_SAVE_INTERVAL` | 30000 | 自动保存间隔(ms) |
| `VITE_MAX_MEMORIES` | 3 | 最大记忆槽数 |
