# HomeMem Arena

[![在线试玩](https://img.shields.io/badge/🎮_在线试玩-GitHub_Pages-purple?style=for-the-badge)](https://asandstar.github.io/homemem-arena/)
&nbsp;
[![React](https://img.shields.io/badge/React-19-61dafb?style=flat&logo=react)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-R3F-000000?style=flat&logo=three.js)](https://threejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178c6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue?style=flat)](./LICENSE)
[![Tests](https://img.shields.io/badge/tests-291-green?style=flat)]()

> 一款让你顺便练记忆的 3D 网页小游戏。你是记忆有限的家政机器人「小橡」，在会捣乱的房子里完成家务，应对调皮的记忆小妖。
>
> 同时也是一个轻量研究平台：游戏记录完整的观察、操作、记忆更新与环境扰动数据，用于研究家务机器人的长期记忆策略。

**[立即在线试玩](https://asandstar.github.io/homemem-arena/)**

## 游戏特色

- **有限记忆槽** — 只能同时记住 3 件物品，需要策略性地选择保存什么
- **捣乱事件** — 钥匙猫、餐盘精、袜子幽灵、时间循环，物品会自己"长腿跑了"
- **混乱值系统** — 混乱越高环境越不稳定，考验临场应变与记忆策略
- **多维度评分** — 速度、连击、记忆测试正确率，多种策略路径拿高分
- **一天时间线** — 清晨 → 上午 → 下午 → 深夜 → 凌晨，五个关卡串联完整叙事
- **复古像素风格** — 像素化材质渲染、16-bit 复古配色、像素化后处理效果

## 五个关卡

| 顺序 | 时间 | 关卡 | 主要记忆能力 | 核心挑战 |
|:---:|:---:|:---|:---|:---|
| 1 | 🌅 清晨 | 餐桌混乱 | 物体、程序、空间 | 区分脏净盘子，室友还会偷偷放回来 |
| 2 | ☀️ 上午 | 出门大作战 | 空间、物体 | 跨房间找钥匙手机，应对钥匙猫的恶作剧 |
| 3 | 🌆 下午 | 洗衣幽灵 | 计数、物体、空间、时序 | 分类多件衣物，幽灵交换篮子位置 |
| 4 | 🌙 深夜 | 早餐时间循环 | 程序、时序、空间、物体 | 按正确流程准备早餐，困在时间循环里 |
| 5 | 🌌 凌晨 | 深夜巡逻 | 空间、时序、程序 | 在黑暗中寻找遗漏物品，应对夜间扰动 |

游戏包含 6 个共享房间、3 个可管理记忆槽、脚本化环境事件、混乱值、Combo、评分、四类记忆 Probe 和结构化 Session 导出。HUD 会突出当前专注目标；连续 20 秒无目标进展时给出轻提示，45 秒时升级为记忆策略提示，取得进展后立即清除。

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
├── data/                  # 房间、平衡参数、四个任务配置
├── game/                  # 碰撞、移动、摆放、计分、混乱、记忆槽
├── pages/                 # 首页、任务、游戏、Probe、结果、数据
├── store/                 # Game / Session / UI / Toast 状态
├── types/                 # 任务、物体、事件、记忆、Session 类型
└── utils/
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
| 任务选择 | `/tasks` | 选择 5 个关卡 |
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
- **部署分支**：`gh-pages`（由 Actions 自动管理）
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
| 关卡设计 | [docs/design/levels.md](docs/design/levels.md) | 各关卡详细设计 |

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
