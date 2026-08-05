# HomeMem Arena - 开发环境搭建

## 1. 环境要求

CI 使用 Node 24（见 [.github/workflows/deploy.yml](../.github/workflows/deploy.yml)），本地推荐 >= 20.19（Vite 8 要求）。

| 依赖 | 版本要求 | 说明 |
|------|---------|------|
| Node.js | >= 20.19，推荐 24.x | 与 CI 版本一致可避免构建差异 |
| npm | >= 10.x | |
| Git | >= 2.x | |
| 浏览器 | Chrome / Edge / Firefox 最新两个大版本 | 需支持 WebGL 2、Pointer Lock |

## 2. 安装步骤

### 2.1 克隆项目

```bash
git clone https://github.com/asandstar/homemem-arena.git
cd homemem-arena
```

### 2.2 安装依赖

```bash
npm install
```

### 2.3 启动开发服务器

```bash
npm run dev          # 启动在 http://localhost:5173
npm run dev:stable   # 固定 127.0.0.1:5173 与严格端口（排错时推荐）
npm run dev:e2e      # Playwright 专用端口 4173，带 e2e 模式 e2eTestApi
```

### 2.4 构建生产版本

```bash
npm run build        # tsc -b && vite build，产物在 dist/
```

### 2.5 预览生产版本

```bash
npm run preview
```

## 3. 项目结构

下面的目录树与当前仓库实际文件一致（2026-08，不含 `docs/archive/` 等历史快照）。

```
homemem-arena/
├── src/                        # 源代码
│   ├── ai/                     # 会话分析（探针评估/指标/诊断）
│   │   ├── analyzeSession.ts
│   │   └── updateRobotMemory.ts
│   ├── audio/                  # Web Audio 音频系统（BGM/SFX/环境音/audioManager）
│   ├── components/             # UI + 3D 组件
│   │   ├── arena3d/            # 3D 场景、HUD、小地图、模型、控制器、特效
│   │   │   ├── effects/        # PixelationPass / ParticleRenderer
│   │   │   ├── feedback/       # CatPrints / CatShadow / PhoneRing
│   │   │   ├── materials/      # 复古像素材质 + PALETTE
│   │   │   └── models/         # FallbackModels / FurnitureModel / PropModel
│   │   ├── dev/                # 开发校准视图（AssetCalibrationView）
│   │   ├── dialog/             # DialogBox / CharacterAvatar
│   │   ├── help/               # HelpPanel + helpContent
│   │   ├── home/               # 首页 MemoryTypeCards
│   │   ├── layout/             # Header / Footer / Layout
│   │   ├── probe/              # 探针卡片/序列
│   │   ├── result/             # 结果页：失败模式/指标/策略建议
│   │   ├── tasks/              # 任务卡片/列表
│   │   └── ui/                 # 通用 Badge / Button / Card / Toast
│   ├── data/                   # 静态配置
│   │   ├── assets/             # modelRegistry（3D 资产注册表）
│   │   ├── tasks/              # 关卡配置：clean-table / leave-home / laundry-sort
│   │   └── rooms.ts / decorFurniture.ts / furnitureOwnership.ts / levelBalance.ts
│   ├── dialog/                 # 对话文本与 useDialog 钩子
│   ├── effects/                # 粒子系统
│   ├── engine/                 # sceneGraph（场景图、AABB、容器/实体位置）
│   ├── game/                   # 纯逻辑层（无 React 依赖）
│   │   ├── collision.ts
│   │   ├── commands.ts         # 交互命令：拾取/放置/打开/开关…
│   │   ├── chaos.ts            # 混乱值（惩罚/阈值/事件关联）
│   │   ├── flow.ts             # 心流：目标进度、停滞提示
│   │   ├── interactionTargets.ts
│   │   ├── memorySlots.ts
│   │   ├── modelCalibration.ts # Kenney 资产尺寸校准
│   │   ├── placement.ts        # 容器内物品摆放规则
│   │   ├── playerControls.ts
│   │   ├── playerMovement.ts
│   │   ├── proceduralMemory.ts # 记忆小妖（过期程序）
│   │   ├── scoring.ts
│   │   └── *.test.ts           # 对应单元测试
│   ├── pages/                  # 路由页：HomePage / TaskSelectPage / ArenaPage
│   │   └── / ProbePage / ResultPage / SessionDataPage
│   ├── save/                   # saveSystem（本地存档，未接入会话导出）
│   ├── store/                  # Zustand 状态
│   │   ├── slices/             # animation / chaos / entity / feedback / flow / memory / player / progress / score / task
│   │   ├── useGameStore.ts     # 主 store（10 个 slice 组合）
│   │   ├── useSessionStore.ts  # 研究数据：事件历史 + 探针
│   │   ├── useToastStore.ts    # 即时操作反馈 Toast
│   │   └── useUiStore.ts       # HUD 布局偏好（任务面板/小地图/…开关）
│   ├── types/                  # task / object / room / session / memory / event
│   └── utils/                  # e2eTestApi（暴露给 Playwright）、format
├── scripts/                    # QA 脚本：qa-assets / qa-rooms / qa-tasks / qa-layout / qa-report
├── public/                     # 静态资源：3D 模型 / favicon / 404.html（SPA 回退）
│   └── assets/models/          # furniture / props / decor / kenney/（独立 Kenney 子包）
├── .github/workflows/
│   ├── deploy.yml              # push main → lint/test/qa/build → 部署到 GitHub Pages
│   └── ci-preview.yml          # 非 main 分支 → lint/test/qa/build，不部署，上传 dist 预览
├── docs/
│   ├── assets/                 # 资产台账、尺寸、许可证、预览图
│   ├── design/                 # 设计蓝图、拓扑、布局契约
│   ├── dev/                    # setup + coding-standard
│   ├── roadmap/                # 实现清单、v2 计划
│   └── reports/                # 生产 QA、音频、关卡报告
├── package.json
├── vite.config.ts
└── tsconfig*.json
```

## 4. 常用命令

下表严格对齐 [package.json](../package.json) `scripts` 字段，不包含文档中"想象出来"的命令。

| 命令 | 用途 |
|------|------|
| `npm run dev` | 启动开发服务器（默认 http://localhost:5173） |
| `npm run dev:stable` | 固定 `127.0.0.1:5173` 严格端口，方便排错 |
| `npm run dev:e2e` | E2E 模式，`127.0.0.1:4173`，启用 e2eTestApi |
| `npm run build` | 生产构建：`tsc -b` 类型检查 + `vite build` |
| `npm run preview` | 本地预览 `dist/` 产物 |
| `npm test` | 运行 Vitest 单元测试（watchless，CI 用） |
| `npm run test:watch` | Vitest watch 模式（开发中用） |
| `npm run lint` | 静态检查（使用 oxlint，速度很快） |
| `npm run qa` | **生产门禁全集**：qa:static + qa:assets + qa:rooms + qa:tasks + qa:layout + build |
| `npm run qa:static` | `tsc --noEmit -p tsconfig.app.json`，仅类型 |
| `npm run qa:assets` / `qa:rooms` / `qa:tasks` / `qa:layout` | 各类数据一致性校验 |
| `npm run qa:report` | 生成 QA_REPORT.md（未纳入 git） |
| `npm run qa:all` | `npm run qa && npm run qa:report` |
| `npm run e2e` | Playwright 端到端（需先 `npm run dev:e2e` 或配置 server） |
| `npm run e2e:headed` / `e2e:debug` | Playwright 可视图模式 / 调试模式 |
| `npm run cache:clean` | 清理 Vite 预编译缓存 + TS buildinfo |
| `npm run dev:clean` | cache:clean 后启动 dev |

## 5. 环境变量

目前代码中**没有使用任何 `VITE_*` 环境变量**。所有运行时开关（是否启用混乱值、最大记忆槽等）都通过 zustand store 的字段暴露，并由任务配置（`src/data/tasks/*`）或 QA 脚本的常量控制。

如需添加环境变量：
1. 在 [src/vite-env.d.ts](../src/vite-env.d.ts) 的 `ImportMetaEnv` 中补类型；
2. 在 `.env.local` 中写值（`.gitignore` 已忽略本地变量）；
3. 代码中仅通过 `import.meta.env.VITE_XXX` 读取（ESM 环境，`process.env` 不可用）。

## 6. 开发工具

### 6.1 VS Code 推荐插件

| 插件 | 用途 |
|------|------|
| TypeScript and JavaScript Language Features | TS 支持（VS Code 内置，启用即可） |
| Tailwind CSS IntelliSense | Tailwind 4 类名 / 主题补全 |
| Simple React Snippets（或同类） | 快速生成组件骨架 |
| GLTF Lint / Three.js 调试器（可选） | 3D 资产检视 |

> 项目使用 `oxlint`（ESLint 兼容但 Rust 实现），无需安装 ESLint 插件；不启用 Prettier，格式化遵循仓库现有风格（见 [coding-standard.md](./coding-standard.md)）。

### 6.2 调试配置

在 VS Code 中创建 `.vscode/launch.json`：

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Launch Chrome (local dev)",
      "type": "chrome",
      "request": "launch",
      "url": "http://127.0.0.1:5173",
      "webRoot": "${workspaceFolder}/src"
    }
  ]
}
```

调试 Vitest：使用 VS Code "Testing" 面板或命令面板的 "Vitest: Run"。

## 7. 常见问题

### Q: 依赖安装后第一次启动 dev 非常慢 / 控制台大量 `optimize dependencies`

A: Vite 首次启动会预编译依赖到 `node_modules/.vite/`，属于正常现象。之后会被缓存。也可以手动：

```bash
npm run cache:clean && npm run dev
```

### Q: 开发服务器起不来：`Error: Port 5173 is already in use`

A: 改用 `--port` 或：

```bash
npm run dev:stable   # 会报错并退出而不是换端口，避免 e2e/书签不一致
```

### Q: TypeScript 类型错误

A: 按优先级排：
1. `npm run qa:static` 看具体哪个文件（比 `lint` 给出的类型信息更准）；
2. 若报错指向 `node_modules/.vite-temp/*.d.ts`：`npm run cache:clean` 再试。

### Q: 3D 渲染黑屏 / 白屏

A: 按顺序排查：
1. 浏览器控制台是否有 `WebGL context lost` → 降低其他标签页的 GPU 压力，Chrome 可在 `chrome://gpu` 查看；
2. 是否有 404 纹理请求 → 模型是否选择了正确的 `FallbackModels` 路径，纹理剥离逻辑 `stripAllTextures` 已生效；
3. 页面 `DOMContentLoaded` 后 canvas height 是否为 0 → 检查 ArenaPage `<Layout>` + `Scene3D` 的容器高度。

### Q: dev 模式下对话选项点不了

A: 本仓库最近修复了这个问题。若你基于某个更旧分支开发，请 cherry-pick 如下两处：
- [DialogBox.tsx](../src/components/dialog/DialogBox.tsx)：挂载时 `exitPointerLock` + `data-dialog-root` 属性。
- [FirstPersonControls.tsx](../src/components/arena3d/FirstPersonControls.tsx)：对话打开时不请求锁定。

### Q: `npm run qa` 失败，日志指向某个 task 或 room 的几何

A: 先单独跑出错的 QA 子命令，再看对应配置。例如：

```bash
npm run qa:tasks
npm run qa:layout
```

再对比 [src/data/tasks/index.ts](../src/data/tasks/index.ts) 中的 objects 与 containers 是否能在 `findActiveGoal` 中找到依赖。

## 8. CI/CD

项目使用 GitHub Actions，工作流文件全部在 `.github/workflows/` 下：

| 工作流 | 触发条件 | 执行内容 | 是否部署 |
|--------|---------|---------|----------|
| `deploy.yml` | push `main`，或手动 workflow_dispatch | lint → test → qa → build → Verify dist → Setup Pages → Upload artifact → Deploy | ✅ 部署到 GitHub Pages |
| `ci-preview.yml` | push 到**非 main** 分支，或手动触发 | lint → test → qa → build → Upload `dist/` 到 Artifacts（保留 3 天） | ❌ 仅构建验证，不上线 |

并发/取消策略：
- 部署工作流 `concurrency: pages`，`cancel-in-progress: false`，保证部署顺序，不中途取消旧部署。
- CI 预检 `concurrency: ci-preview-${github.ref}`，`cancel-in-progress: true`，**同名分支的旧构建会被新 push 的取消**，节约 CI 时长。
