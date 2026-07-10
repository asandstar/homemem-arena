# Echo House: Memory Butler - 3D 模型升级 PRD

## Overview
- **Summary**: 将游戏的 3D 模型策略从"纯程序化几何体拼搭"升级为"轻量 GLB 模型资产 + 程序化 fallback"方案。建立完整的资产管线，统一 low-poly cozy home 风格，提升视觉品质到独立小游戏 Demo 水平。
- **Purpose**: 解决当前模型过于简单、像几何体测试场的问题，让游戏第一眼看起来像 stylized indie game，同时保持轻量、可扩展、易于替换资产的架构。
- **Target Users**: 游戏玩家、AI 创造力比赛评委、Demo 展示受众

## Goals
- 建立 GLB 资产加载管线，支持运行时加载和 fallback
- 关键任务物体从程序化模型升级为可识别的 stylized low-poly 模型
- 家具和容器模型具备清晰的用途识别和状态表现
- 每个房间有足够的装饰锚点，建立生活感
- 统一材质调色板和光照体系，形成 cohesive art style
- 保持性能流畅，不引入重型资产
- GLB 缺失时 fallback 仍然可用且可识别

## Non-Goals (Out of Scope)
- 不引入大型写实模型和高面数贴图资产
- 不做复杂后处理（bloom、SSAO、DOF 等）
- 不做角色动画和骨骼系统
- 不做物理模拟
- 不做 PBR 材质和贴图烘焙

## Background & Context
当前项目使用 Three.js 基础几何体（box、sphere、cylinder、torus）拼搭所有物体。虽然已有 5-12 个几何体组合，但整体观感仍然像"色块方块 Demo"，缺乏 stylized game 的质感。需要引入轻量 GLB 资产来提升视觉层次，同时保留 fallback 以便迭代。

## Functional Requirements

### FR-1: 资产目录与加载管线
- 建立 `public/assets/models/` 目录结构（props / furniture / decor）
- 实现 ModelRegistry，按 category 映射模型路径、scale、rotation、fallback
- 实现 ModelAsset 组件：useGLTF 加载 + Suspense + 错误降级 + 自动阴影
- 支持模型加载失败时静默切换到 fallback，不白屏

### FR-2: 任务物体模型库（PropModel）
- 12 个关键任务物体：key、phone、umbrella、milk_carton、cereal_box、cup、bowl、plate、remote、cloth_white、cloth_dark、towel、trash
- 每个物体有 GLB 路径 + 程序化 fallback（至少 5-12 个几何体组合）
- 任务物体比背景装饰更醒目（更高饱和度、轻微发光）
- hover 时有高亮描边和地面光圈
- 可拾取时有轻微浮动动画
- 支持 selected / interactable / target 三种视觉状态

### FR-3: 家具容器模型库（FurnitureModel）
- 10 个家具模型：fridge、cabinet、sink、dishwasher、sofa、coffee_table、bed、desk、laundry_basket、entrance_tray
- 容器保留 open / close 状态表现（门板旋转、内部空间可见）
- 目标容器有柔和目标光圈
- 每个家具有清晰的用途识别特征（把手、面板、布艺纹理感等）
- 不允许家具像纯色大方块

### FR-4: Fallback 模型库
- 所有 GLB 模型都有对应的程序化 fallback
- 每个 fallback 至少由 5 到 12 个几何体组合
- 有可识别剪影，缩小后仍能辨别是什么
- 不允许单个 box 代表关键物体
- Fallback 只在 GLB 缺失或加载失败时使用

### FR-5: 材质统一系统
- 建立 cozy low-poly palette：背景家具低饱和暖色，任务物体更高饱和
- 记忆相关使用蓝紫色 glow，正确交互绿色 pulse，错误交互红色 warning
- 不同材质类型有不同 roughness / metalness / emissive 配置
- 所有 mesh 自动设置 castShadow / receiveShadow
- 地面和墙面使用温暖低饱和色，不全白/全灰

### FR-6: 房间生活感增强
- 玄关：门、鞋柜、托盘、伞架、地垫、挂钩
- 客厅：沙发、茶几、电视柜、地毯、落地灯、靠枕
- 厨房：冰箱、橱柜、水槽、垃圾桶、洗碗机、台面
- 卧室：床、床头柜、书桌、衣柜、台灯、散落衣物
- 洗衣区：洗衣机、三个洗衣篮、毛巾架、洗衣液
- 餐厅：餐桌、椅子、吊灯、餐具

### FR-7: 光照与阴影
- 环境光 + 主方向光 + 房间点光源三层光照
- 客厅偏暖，厨房略冷，卧室柔和
- 开启 shadows，接触阴影防止漂浮感
- 关键物体 hover 时增加轻微 rim glow
- 混乱值升高时 HUD glitch，但场景不过暗

### FR-8: Object3D 重构
- 不再直接渲染简单几何体
- 改为调用 PropModel
- 根据 entity.category 决定使用哪个模型
- 保留 pick、hover、tooltip、held 状态逻辑
- 保留 shake、successPulse、错误反馈动画

### FR-9: Container3D 重构
- 不再直接渲染简单大方块
- 改为调用 FurnitureModel
- 保留 open / close 动画
- 保留 place、target zone、hover 逻辑
- 保留内部物体展示

## Non-Functional Requirements
- **NFR-1**: 所有 GLB 模型单文件不超过 500KB
- **NFR-2**: 场景总面数不超过 50,000 tris
- **NFR-3**: 首屏加载时间不超过 3 秒（普通网络）
- **NFR-4**: 帧率保持 60fps（中低端设备 30fps 以上）
- **NFR-5**: npm run build 通过，无 TypeScript 错误
- **NFR-6**: 控制台无红色严重错误

## Constraints
- **Technical**: React + TypeScript + Vite + @react-three/fiber + drei + zustand
- **Business**: AI 创造力比赛 Demo，需要展示 AI + 游戏 + 记忆研究
- **Dependencies**: 需新增 @react-three/drei 的 useGLTF、useProgress 等 hooks

## Assumptions
- 用户会后续补充 .glb 模型文件到 public/assets/models/
- 初期 fallback 模型承担主要渲染，GLB 到位后自动升级
- 保持现有游戏逻辑不变，只改视觉呈现

## Acceptance Criteria

### AC-1: 资产管线架构正确
- **Given**: 项目已建立 ModelRegistry 和 ModelAsset
- **When**: 尝试加载一个不存在的 GLB 模型
- **Then**: 自动显示 fallback 模型，不白屏，控制台有 warning
- **Verification**: `programmatic`

### AC-2: 任务物体可识别
- **Given**: 玩家进入第一关
- **When**: 看到钥匙、手机、雨伞、牛奶、麦片、杯子
- **Then**: 能一眼识别出是什么，不像色块或方块
- **Verification**: `human-judgment`

### AC-3: 家具有明确用途
- **Given**: 玩家进入各个房间
- **When**: 看到冰箱、橱柜、沙发、床、洗衣篮、玄关托盘
- **Then**: 能明显看出家具用途，不像纯色大方块
- **Verification**: `human-judgment`

### AC-4: 房间有生活感
- **Given**: 玩家探索所有房间
- **When**: 观察每个房间的装饰和家具
- **Then**: 每个房间至少有 3 个视觉锚点，能区分房间功能
- **Verification**: `human-judgment`

### AC-5: 风格统一
- **Given**: 游戏运行中
- **When**: 整体观察场景视觉风格
- **Then**: 有统一的 low-poly / cozy home / stylized game 感觉
- **Verification**: `human-judgment`

### AC-6: 阴影和光照
- **Given**: 场景中有物体和家具
- **When**: 观察光影效果
- **Then**: 有阴影或接触阴影，物体不漂浮，有房间氛围光
- **Verification**: `human-judgment`

### AC-7: 交互反馈完整
- **Given**: 玩家与物体交互
- **When**: hover、拾取、正确放置、错误放置、保存记忆
- **Then**: 都有明显的视觉反馈（发光、脉冲、抖动等）
- **Verification**: `human-judgment`

### AC-8: 第一关完整可玩
- **Given**: 模型升级完成
- **When**: 玩第一关「出门大作战」
- **Then**: 可以正常拾取、放置、触发事件、完成任务
- **Verification**: `programmatic`

### AC-9: 其他三关可进入
- **Given**: 模型升级完成
- **When**: 进入其他三个关卡
- **Then**: 场景正常渲染，没有崩溃
- **Verification**: `programmatic`

### AC-10: 构建通过
- **Given**: 所有代码修改完成
- **When**: 运行 npm run build
- **Then**: 构建成功，无 TypeScript 错误
- **Verification**: `programmatic`

### AC-11: 无严重报错
- **Given**: 游戏运行中
- **When**: 观察浏览器控制台
- **Then**: 没有红色严重错误
- **Verification**: `programmatic`

## Open Questions
- [ ] GLB 模型的具体面数上限是否需要更精确的数值？
- [ ] 是否需要添加模型加载进度条？
- [ ] 装饰物是否需要支持交互（如开关灯）？
