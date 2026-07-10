# HomeMem Arena / 回声屋 · 记忆宅邸

[![在线试玩](https://img.shields.io/badge/🎮_在线试玩-GitHub_Pages-purple?style=for-the-badge)](https://asandstar.github.io/homemem-arena/)
&nbsp;
[![React](https://img.shields.io/badge/React-19-61dafb?style=flat&logo=react)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-R3F-000000?style=flat&logo=three.js)](https://threejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178c6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/tests-287-green?style=flat)]()

> 🎮 **一款让你顺便练记忆的 3D 网页小游戏** — 你是记忆有限的家政小精灵"小橡"，在会捣乱的房子里完成家务，应对调皮的记忆小妖。
>
> 🔬 **研究平台** — 在研究层，小橡对应有限工作记忆的机器人代理 `MEM-07`；游戏记录完整的观察、操作、记忆更新与环境扰动数据，用于研究家务机器人长期记忆策略。

**👉 [立即在线试玩](https://asandstar.github.io/homemem-arena/)**

---

## ✨ 游戏特色

- 🧠 **有限记忆槽** — 只能同时记住 3 件物品，策略性选择保存什么
- 🐱 **捣乱事件** — 钥匙猫、餐盘精、袜子幽灵、时间循环...物品会自己"长腿跑了"
- 📈 **混乱值系统** — 混乱越高环境越不稳定，考验临场应变与记忆策略
- 🏆 **多维度评分** — 速度、连击、记忆测试正确率，多种策略路径拿高分
- 🌅 **一天时间线** — 清晨→上午→下午→深夜，四个关卡串联完整叙事

## 🎯 四个关卡

| 时间 | 关卡 | 主要记忆能力 | 核心挑战 |
|---|---|---|---|
| 🌅 清晨 | 出门大作战 | 空间、物体 | 跨房间找钥匙手机，应对钥匙猫的恶作剧 |
| ☀️ 上午 | 餐桌混乱 | 物体、程序、空间 | 区分脏净盘子，室友还会偷偷放回来 |
| 🌆 下午 | 洗衣幽灵 | 计数、物体、空间、时序 | 分类多件衣物，幽灵交换篮子位置 |
| 🌙 深夜 | 早餐时间循环 | 程序、时序、空间、物体 | 按正确流程准备早餐，困在时间循环里 |

游戏包含 6 个共享房间、3 个可管理记忆槽、脚本化环境事件、混乱值、Combo、评分、四类记忆 Probe 和结构化 Session 导出。HUD 会突出一个当前专注目标；连续 20 秒无目标进展时给出轻提示，45 秒时升级为记忆策略提示，取得进展后立即清除。

当前产品与研究基线见 [产品、游戏与研究设计基线](docs/product-research-game-design.md)。

---

## 设计目标

HomeMem Arena 的功能只有同时满足以下三点才算完成：

- **工程正确**：关卡可完成，状态逻辑自洽，不同输入方式产生一致结果。
- **游戏好玩**：目标明确、反馈及时、挑战来自有意义的记忆取舍，熟练后可以优化策略。
- **研究有效**：环境扰动可控、Session 数据完整、实验可复现、指标能回答长期记忆问题。

## 当前内容

| 顺序 | 关卡 | 主要记忆能力 | 核心挑战 |
|---|---|---|---|
| 1 | 餐桌混乱 | 物体、程序、空间 | 区分脏净状态并正确归位 |
| 2 | 出门大作战 | 空间、物体 | 跨房间寻找物品，处理位置变化 |
| 3 | 洗衣幽灵 | 计数、物体、空间、时序 | 分类多件衣物并应对位置扰动 |
| 4 | 早餐时间循环 | 程序、时序、空间、物体 | 完成“准备→归位→关闭”的多阶段流程 |

游戏包含 6 个共享房间、3 个可管理记忆槽、脚本化环境事件、混乱值、Combo、评分、四类记忆 Probe 和结构化 Session 导出。HUD 会突出一个当前专注目标；连续 20 秒无目标进展时给出轻提示，45 秒时升级为记忆策略提示，取得进展后立即清除。

## 技术栈

- React 19
- TypeScript 6（strict mode）
- Vite 8
- React Three Fiber / drei / Three.js
- Zustand
- React Router 7
- Tailwind CSS 4
- Vitest + Oxlint

## 快速开始

```bash
npm install
npm run dev
```

常用检查：

```bash
npm test
npm run lint
npm run build
npm run qa
```

> 当前 QA 脚本使用 `vite-node`；在依赖补齐前，离线环境执行 `npm run qa` 可能尝试访问 npm registry。详见下方“当前工程状态”。

## 游戏操作

| 操作 | 按键 |
|---|---|
| 移动 | `WASD` / 方向键 |
| 调整视角 | 按住鼠标左键拖动 |
| 切换第一人称/俯视 | `V` |
| 保存或更新附近物体记忆 | `E` |
| 拾取、放置、打开或关闭 | `F` |
| 显示/隐藏任务面板 | `Tab` |
| 显示/隐藏事件日志 | `R` |
| 显示/隐藏辅助 HUD | `H` / `Esc` |

## 标准体验流程

```text
首页 → 任务选择 → 欢迎/任务简报 → 3D 游戏
    → 记忆 Probe → Session 分析 → 结果页 → JSON 导出
```

只有处于 `playing` 阶段时才应进行计时、混乱增长和事件触发。Probe 完成后才能 finalize Session 并生成最终指标。

## 路由

| 页面 | 路径 | 说明 |
|---|---|---|
| 首页 | `/` | 世界观、玩法价值与入口 |
| 任务选择 | `/tasks` | 选择 4 个关卡 |
| 3D 游戏 | `/play/:taskId` | 核心交互与 HUD |
| 记忆 Probe | `/probe/:taskId` | 任务后的记忆评估 |
| 结果分析 | `/result/:taskId` | 得分、失败模式与策略建议 |
| 研究数据 | `/data/:taskId` | Session JSON 与研究摘要 |

路由参数当前仍使用 `taskId`；未来支持持久化 Session 后，结果和数据页应迁移为稳定的 `sessionId` 路由。

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

- `useGameStore`：当前世界和即时游戏状态；
- `useSessionStore`：可导出的事件历史和研究数据；
- `useUiStore`：HUD 布局与小地图偏好；
- `useToastStore`：即时操作反馈。

## 研究数据原则

正式研究版 Session 应包含并校验：

- schema/app/task/scene/analysis 版本；
- session seed 与实验 condition；
- 玩家命令、观察、姿态轨迹和实体/容器状态变化；
- 记忆写入、更新、失效和使用记录；
- 脚本扰动、目标里程碑和终局状态；
- Probe 答案、正确率和反应时间；
- 可从原始事件重新计算的派生指标。

正式众包前还需要补充知情说明、匿名参与者标识、数据用途、保留期限和退出机制。

## 当前工程状态

截至 2026-07-10：

- `npm test`：287 个测试通过（11 个测试文件）；
- `npm run lint`：0 error / 0 warning；
- `npm run build`：通过；
- 页面已经按路由拆包，非游戏入口主包约 300 KB；3D Arena chunk 约 1.2 MB（含 Three.js）；
- 已加入显式生命周期、简报暂停、真实倒计时、统一交互命令、阶段目标和游戏→Probe→结果流程；
- 已加入当前专注目标、两级停滞救援，以及 `flow_intervention`、最长目标间隔、操作成功率等可审计过程数据；
- 已实现场景图查询、统一事件总线、Zustand Slice 架构、程序记忆系统等基础设施；
- 自定义 QA 对未声明的 `vite-node` 有运行时依赖；
- Session schema/version/seed、完整状态 delta、本地持久化和研究数据审计仍属于 P1 工作。

当前版本已具备更稳定的可玩闭环，适合原型演示和系统化试玩；在完成研究验收门槛前，不应直接用于正式科研数据采集。

## 文档索引

当前规范：

- [产品、游戏与研究设计基线](docs/product-research-game-design.md)
- [功能设计与系统架构](HOMEMEM_ARENA_DESIGN.md)
- [叙事设计](NARRATIVE_DESIGN.md)
- [视觉与交互规格](docs/design-polish-spec.md)
- [QA Smoke Checklist](QA_SMOKE_CHECKLIST.md)

历史快照：

- `FOUNDATION_AUDIT.md` / `FOUNDATION_QA.md`
- `PLAYTEST_REPORT.md` / `PLAYTEST_REPORT_V2.md`
- `QA_REPORT.md`
- `NPC_REPRESENTATION_AUDIT.md`

历史报告用于追踪当时的发现，不代表当前事实或未来验收标准。

## 构建与部署

### 本地构建

```bash
npm run build
```

产物位于 `dist/`。部署到静态托管平台时必须配置 SPA fallback，使 `/play/*`、`/probe/*`、`/result/*` 和 `/data/*` 回退到 `index.html`。

### GitHub Pages 自动部署

项目已配置 GitHub Actions 工作流（`.github/workflows/deploy.yml`），每次 push 到 `main` 分支后自动构建并部署到 GitHub Pages。

- **在线试玩地址**：[https://asandstar.github.io/homemem-arena/](https://asandstar.github.io/homemem-arena/)
- **部署分支**：`gh-pages`（由 Actions 自动管理）
- **Base Path**：`/homemem-arena/`（已在 `vite.config.ts` 中配置）
