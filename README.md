# HomeMem Arena

[![在线试玩](https://img.shields.io/badge/🎮_在线试玩-GitHub_Pages-purple?style=for-the-badge)](https://asandstar.github.io/homemem-arena/)
&nbsp;
[![React](https://img.shields.io/badge/React-19-61dafb?style=flat&logo=react)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-R3F-000000?style=flat&logo=three.js)](https://threejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178c6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue?style=flat)](./LICENSE)
[![Tests](https://img.shields.io/badge/tests-416-green?style=flat)]()

> 一款让你顺便练记忆的 3D 网页小游戏。你是记忆有限的家政机器人「小橡」，在会捣乱的房子里完成家务，应对调皮的记忆小妖。
>
> 同时也是一个轻量研究平台：游戏记录完整的观察、操作、记忆更新与环境扰动数据，用于研究家务机器人的长期记忆策略。

**[立即在线试玩](https://asandstar.github.io/homemem-arena/)**

## 游戏特色

- **有限记忆槽** — 只能同时记住 3 件物品，需要策略性地选择保存什么
- **稳定与变化** — 先学习相信仍有效的记忆，再识别现实变化并更新过期记忆
- **混乱值系统** — 混乱越高环境越不稳定，考验临场应变与记忆策略
- **多维度评分** — 速度、连击、记忆测试正确率，多种策略路径拿高分
- **递进记忆阶梯** — 第一次 ENCODE → 稳定 RECALL → 过期 UPDATE，三关都必须真正使用记忆机制
- **复古像素风格** — 像素化材质渲染、16-bit 复古配色、像素化后处理效果
- **视线遮挡（LOS）** — 高亮效果会被墙壁和家具遮挡，真实的 3D 视野体验
- **猫脚印避让** — 猫脚印会自动避开家具，不会穿墙而过
- **抽屉交互** — 部分物品藏在抽屉里，靠近后按 F 打开抽屉取物
- **GLB 模型 Fallback** — 即使 3D 模型加载失败，程序化几何体会作为后备方案，保证视觉和碰撞盒一致
- **全关卡解锁** — 所有关卡默认解锁，无需通关前置关卡

## 三个关卡

| 关 | 章节 | 时间 | 记忆类型 | 核心玩法 |
|:---:|:---|:---:|:---|:---|
| 1 | **餐桌整理入门** | 🍽️ 清晨 07:30 | 物体+程序性 | 单房间、3 件餐具、无时限。先对任意餐具按 E 保存第一条记忆，再拾取归位 |
| 2 | **钥匙猫的稳定记忆考验** | 🐱 上午 08:00 | 物体+空间 | 在客厅、卧室、玄关分别保存书、马克杯、收音机的位置；三条记忆建立后再取回。猫只制造假干扰，时限 150 秒 |
| 3 | **过期的早餐记忆** | 🥣 上午 08:30 | 物体+空间+时间 | 保存麦片旧位置，完成摆桌后发现现实变化，核对冲突并按 E 更新记忆，时限 240 秒 |

所有关卡默认解锁，无需通关前置。游戏包含共享房间、3 个记忆槽、脚本化环境事件、混乱值、Combo、评分、记忆 Probe 和结构化 Session 导出。HUD 会突出当前专注目标；连续 20 秒无目标进展时给出轻提示，45 秒时升级为记忆策略提示，取得进展后立即清除。

## 最近更新（2026-08-08）

### 🧠 三关记忆阶梯重构（2026-08-08）

- L1 缩减为 3 件可见餐具，必须先按 E 保存第一条记忆，再学习拾取与归位。
- L2 改为 3 房间稳定 RECALL：书、马克杯、收音机全部编码后才能搬运；钥匙猫只制造假干扰。
- L3 改为早餐 UPDATE：保存麦片旧位置 → 发现冲突 → 重新观察 → 按 E 更新过期记忆。
- 三关目标均提供逐项横幅和清单勾选；真实 Chromium 连续通关测试覆盖最终结算。

### 🐛 关键 Bug 修复（2026-08-07）

| 问题 | 修复 |
|------|------|
| L1 初始视角没翻转 180°，玩家背对任务区 | `spawnRotation` 改为 `3π/4`，相机初始化 useEffect 依赖 `[phase, robotRotation]` 任务初始化后同步 |
| 小地图箭头方向与实际朝向相反，L2 寻物找不到方向 | 修正 Minimap 3D→2D 坐标变换公式 `fy = y - cos(yaw)*L` 取反 |
| ESC 无法释放鼠标锁定，Dialog 打开时 ESC 被拦截 | 直接检查 `document.pointerLockElement`，加 Dialog 存在性检查与 `try-catch` 保护 |
| 两套音频系统同时发声（BGM+Chaos/Room Ambient 叠加） | `playing` 阶段开始时强制 `stopChaosAmbient()` + `stopAmbientImmediate()`，避免多音频叠加 |
| L2 有 6 个悬浮枕头（床上/沙发位置坐标错误）+ 4 把餐椅围着不存在的餐桌 | 修正枕头坐标（卧室加 room center、沙发跟随新位置），餐椅只在配置了餐桌时渲染 |
| L3 冰箱/微波炉/吊柜不靠墙 | 北墙工作区整体北移 0.2m，冰箱精确贴西墙 |
| 黑色的"0"出现在任务卡片上（`attempts===0` 被 React 当文本渲染） | 改为显式三元判断，`0 && ...` 短路不再返回数字 0 |
| 视角手感粘手、俯仰角太极端、机器人太高 | 俯仰角收窄到 ±50°，灵敏度降低 27%，机器人身高 1.5→1.35m |
| 模型加载报错 `exited the lock`（ESC 退出 Pointer Lock 时中断 GLTF 加载） | `gltfSilentError` 静默该错误，全局 `unhandledrejection` 处理器同步忽略 |

### 🧹 范围精简（2026-08-07）

- 移除独立的 `task-breakfast` 第 4 关和第 5 关（深夜巡逻）；早餐记忆更新核心已整合为当前 L3，并保留历史路由 ID `task-laundry-sort`
- 删除对应任务配置、BGM、对话、测试、BGM 引用，代码体量减少 ~1.5k 行
- 测试从 414 精简到 403，全部通过；构建从 ~780ms 降到 ~695ms

### 🐛 更早关键修复

| 问题 | 修复 |
|------|------|
| Store 初始化失败：`Cannot read properties of null (reading 'addScore')` | 修复 `withSafeSnapshot` 包装器，现在正确复制 `getState`/`setState`/`subscribe`/`getInitialState` 4 个静态方法 |
| 关卡锁定：DEV 模式下旧存档导致关卡被锁定 | `isLevelUnlocked` 直接返回 `true`，所有关卡默认解锁 |
| UI 文案乱码：`font-mono` 导致中文渲染错误（"靠近"→"爱国"） | 移除 AI 系统指令的玩家端渲染，修复 Flex 布局防止文字挤压 |
| 游戏卡住：点击"开始任务"后一直卡在"准备中" | Store 初始化修复解决了所有下游的 null 引用问题 |

### ✨ 新增功能

| 功能 | 说明 |
|------|------|
| **视线遮挡（LOS）** | 从相机发射射线（Ray-AABB Slab method）检测遮挡物，高亮/脉动环效果会被墙壁和家具遮挡 |
| **猫脚印避让** | 点-OBB 2D 包含检测 + 推出算法，确保猫脚印不落在家具内部（推到最近边 + 0.1m 缓冲外） |
| **GLB fallback 尺寸对齐** | 程序化几何体通过 `effectiveAabb` 动态注入尺寸，确保视觉与碰撞盒、GLB 模型一致 |
| **抽屉交互** | 部分物品（如床头柜抽屉、厨房抽屉）支持打开/关闭交互，带专用音效 |

### 🏗️ 架构改进

| 改进 | 说明 |
|------|------|
| `src/store/safeStore.ts` | 新增安全 store 包装器，保护 React 首帧 `getSnapshot=null` 的情况，同时保证静态方法完整 |
| `src/game/lineOfSight.ts` | 新增视线遮挡工具模块，纯数学实现，零外部依赖 |
| `src/utils/nudgeFootprintAway.ts` | 新增脚印避让工具模块 |
| `src/utils/resolveFallbackSize.ts` | 新增 fallback 尺寸解析器，统一视觉/碰撞/模型尺寸 |

## 游戏操作

| 操作 | 按键 |
|:---|:---|
| 移动 | `WASD` / 方向键 |
| 调整视角 | 鼠标移动（自动跟随）或按住左键拖动 |
| 缩放视野 | 鼠标滚轮 |
| 释放/锁定鼠标 | `Esc` 释放，点击画面重新锁定 |
| 切换第一人称/俯视 | `V` |
| 保存或更新附近物体记忆 | `E` |
| 拾取、放置、打开或关闭 | `F` |
| 显示/隐藏任务面板 | `Tab` |
| 显示/隐藏事件日志 | `R` |
| 显示/隐藏辅助 HUD | `H` |

## 快速开始

```bash
npm install
npm run dev
```

常用检查命令：

```bash
npm test        # 运行单元测试
npm run lint    # 代码静态检查
npm run build   # 生产构建
npm run qa      # 完整 QA 门禁（类型检查 + 资产 + 房间 + 任务 + 构建）
```

## 技术栈

- React 19 + TypeScript 6（strict mode）
- Vite 8
- React Three Fiber / drei / Three.js
- Zustand（状态管理）
- React Router 7
- Tailwind CSS 4
- Vitest + Oxlint

## 代码结构

```text
src/
├── ai/                    # 规则式记忆生成、指标与诊断
├── audio/                 # Web Audio 游戏音效
├── components/arena3d/    # 3D 场景、控制、HUD、小地图、模型
│   ├── feedback/          # 视觉反馈效果（猫脚印等）
│   ├── models/            # GLB 模型加载与 fallback
│   └── ...
├── data/                  # 房间、平衡参数、三个关卡任务配置
├── game/                  # 碰撞、移动、摆放、计分、混乱、记忆槽
│   ├── lineOfSight.ts     # 视线遮挡（LOS）Ray-AABB 检测
│   └── ...
├── pages/                 # 首页、任务、游戏、Probe、结果、数据
├── store/                 # Game / Session / UI / Toast 状态
│   ├── safeStore.ts       # 安全 store 包装器（首帧 null 保护）
│   └── slices/            # Zustand slices
├── types/                 # 任务、物体、事件、记忆、Session 类型
└── utils/
    ├── nudgeFootprintAway.ts  # 猫脚印避让家具算法
    └── resolveFallbackSize.ts # GLB fallback 尺寸对齐
```

核心状态职责：

- `useGameStore`：当前世界和即时游戏状态（由 9 个 slice 组合）
- `useSessionStore`：可导出的事件历史和研究数据
- `useUiStore`：HUD 布局与小地图偏好
- `useToastStore`：即时操作反馈

## 路由

| 页面 | 路径 | 说明 |
|:---|:---|:---|
| 首页 | `/` | 世界观、玩法价值与入口 |
| 任务选择 | `/tasks` | 选择三个递进关卡 |
| 3D 游戏 | `/play/:taskId` | 核心交互与 HUD |
| 记忆 Probe | `/probe/:taskId` | 任务后的记忆评估 |
| 结果分析 | `/result/:taskId` | 得分、失败模式与策略建议 |
| 研究数据 | `/data/:taskId` | Session JSON 与研究摘要 |

标准体验流程：

```text
首页 → 任务选择 → 任务简报 → 3D 游戏 → 记忆 Probe → Session 分析 → 结果页 → JSON 导出
```

只有处于 `playing` 阶段时才进行计时、混乱增长和事件触发。Probe 完成后才能 finalize Session 并生成最终指标。

## 设计目标

HomeMem Arena 的功能只有同时满足以下三点才算完成：

1. **工程正确** — 关卡可完成，状态逻辑自洽，不同输入方式产生一致结果
2. **游戏好玩** — 目标明确、反馈及时、挑战来自有意义的记忆取舍，熟练后可以优化策略
3. **研究有效** — 环境扰动可控、Session 数据完整、实验可复现、指标能回答长期记忆问题

## 研究数据

正式研究版 Session 应包含并校验：

- schema / app / task / scene / analysis 版本
- session seed 与实验 condition
- 玩家命令、观察、姿态轨迹和实体/容器状态变化
- 记忆写入、更新、失效和使用记录
- 脚本扰动、目标里程碑和终局状态
- Probe 答案、正确率和反应时间
- 可从原始事件重新计算的派生指标

正式众包前还需要补充知情说明、匿名参与者标识、数据用途、保留期限和退出机制。

## 构建与部署

### 本地构建

```bash
npm run build
```

产物位于 `dist/`。部署到静态托管平台时必须配置 SPA fallback，使 `/play/*`、`/probe/*`、`/result/*` 和 `/data/*` 回退到 `index.html`。

### GitHub Pages 自动部署

项目已配置 GitHub Actions 工作流（`.github/workflows/deploy.yml`），每次 push 到 `main` 分支后自动构建并部署到 GitHub Pages。

- **在线试玩地址**：https://asandstar.github.io/homemem-arena/
- **部署方式**：push `main` → [.github/workflows/deploy.yml](.github/workflows/deploy.yml) 运行 `lint/test/qa/build`，通过后用 `actions/upload-pages-artifact@v3` + `actions/deploy-pages@v4` 直接把 `dist/` 部署到 GitHub Pages（不使用 `gh-pages` 分支）。
- **Base Path**：`/homemem-arena/`（已在 `vite.config.ts` 中配置）

## 文档索引

### 📖 设计文档

| 文档 | 路径 | 说明 |
|:---|:---|:---|
| 产品与研究设计基线 | [docs/design/00_product_research_game_design.md](docs/design/00_product_research_game_design.md) | 产品定位与研究目标 |
| 游戏设计文档 | [docs/design/01_homemem_arena_design.md](docs/design/01_homemem_arena_design.md) | 功能设计与系统架构 |
| 叙事设计 | [docs/design/02_narrative_design.md](docs/design/02_narrative_design.md) | 故事背景与角色设定 |
| 视觉与交互规格 | [docs/design/03_design_polish_spec.md](docs/design/03_design_polish_spec.md) | UI/UX设计规范 |
| 游戏设计概览 | [docs/design/overview.md](docs/design/overview.md) | 游戏简介与核心玩法 |
| 核心机制 | [docs/design/mechanics.md](docs/design/mechanics.md) | 记忆系统、混乱值、交互等 |
| 当前三关权威入口 | [docs/design/levels.md](docs/design/levels.md) | ENCODE → RECALL → UPDATE 的当前实现规格 |
| L1 FINAL | [docs/L1_FINAL_DESIGN.md](docs/L1_FINAL_DESIGN.md) | 第一次记忆与基础操作 |
| L2 FINAL | [docs/L2_FINAL_DESIGN.md](docs/L2_FINAL_DESIGN.md) | 稳定空间记忆回忆 |
| L3 FINAL | [docs/L3_FINAL_DESIGN.md](docs/L3_FINAL_DESIGN.md) | 过期记忆核对与更新 |

### 🔧 技术文档

| 文档 | 路径 | 说明 |
|:---|:---|:---|
| 技术架构 | [docs/tech/architecture.md](docs/tech/architecture.md) | 整体架构与目录结构 |
| 技术债务登记 | [docs/tech/01_technical_debt_register.md](docs/tech/01_technical_debt_register.md) | 技术债务追踪 |

### 🚀 开发指南

| 文档 | 路径 | 说明 |
|:---|:---|:---|
| 环境搭建 | [docs/dev/setup.md](docs/dev/setup.md) | 开发环境配置与常用命令 |
| 编码规范 | [docs/dev/coding-standard.md](docs/dev/coding-standard.md) | 代码风格与最佳实践 |

### 📦 归档文档（历史快照）

| 类型 | 路径 | 说明 |
|:---|:---|:---|
| 测试报告 | [docs/archive/playtest-reports/](docs/archive/playtest-reports/) | 测试报告历史 |
| 审计报告 | [docs/archive/audits/](docs/archive/audits/) | 项目审计历史 |
| QA报告 | [docs/archive/qa-reports/](docs/archive/qa-reports/) | QA测试报告 |
| 计划文档 | [docs/archive/old-plans/](docs/archive/old-plans/) | 旧开发计划 |

## License

本项目采用 [Apache License 2.0](./LICENSE) 开源协议。

Copyright 2026 asandstar

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
