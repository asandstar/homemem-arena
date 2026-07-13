# HomeMem Arena - 开发环境搭建

## 1. 环境要求

| 依赖 | 版本要求 |
|------|---------|
| Node.js | >= 20.x |
| npm | >= 10.x |
| Git | >= 2.x |

## 2. 安装步骤

### 2.1 克隆项目

```bash
git clone https://github.com/your-repo/homemem-arena-web-demo.git
cd homemem-arena-web-demo
```

### 2.2 安装依赖

```bash
npm install
```

### 2.3 启动开发服务器

```bash
npm run dev
```

开发服务器默认运行在 `http://localhost:5173`

### 2.4 构建生产版本

```bash
npm run build
```

构建产物会输出到 `dist/` 目录

### 2.5 预览生产版本

```bash
npm run preview
```

## 3. 项目结构

```
homemem-arena-web-demo/
├── src/                    # 源代码
│   ├── audio/              # 音频系统
│   ├── components/         # UI和3D组件
│   ├── game/               # 游戏逻辑
│   ├── store/              # Zustand状态管理
│   ├── data/               # 游戏数据
│   ├── types/              # TypeScript类型
│   ├── effects/            # 效果系统
│   ├── save/               # 存档系统
│   ├── hooks/              # 自定义Hooks
│   └── pages/              # 页面组件
├── docs/                   # 文档
│   ├── design/             # 设计文档
│   ├── tech/               # 技术文档
│   ├── data/               # 数据文档
│   ├── dev/                # 开发指南
│   └── archive/            # 归档文档
├── public/                 # 静态资源
├── tests/                  # 测试文件
├── index.html              # HTML入口
├── package.json            # 项目配置
├── vite.config.ts          # Vite配置
├── tsconfig.json           # TypeScript配置
├── tailwind.config.js      # Tailwind配置
└── README.md               # 项目说明
```

## 4. 常用命令

| 命令 | 用途 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 构建生产版本 |
| `npm run preview` | 预览生产版本 |
| `npm run test` | 运行单元测试 |
| `npm run test:ui` | 运行UI测试 |
| `npm run lint` | 代码检查 |
| `npm run lint:fix` | 自动修复代码问题 |
| `npm run e2e` | 运行端到端测试 |
| `npm run e2e:ui` | 运行端到端测试（UI模式） |

## 5. 环境变量

项目支持以下环境变量配置：

| 变量 | 默认值 | 用途 |
|------|-------|------|
| `VITE_APP_NAME` | HomeMem Arena | 应用名称 |
| `VITE_SAVE_INTERVAL` | 30000 | 自动保存间隔(毫秒) |
| `VITE_MAX_MEMORIES` | 3 | 最大记忆槽数 |
| `VITE_AUTO_SAVE_ENABLED` | true | 是否启用自动保存 |
| `VITE_CHAOS_ENABLED` | true | 是否启用混乱值系统 |

创建 `.env.local` 文件自定义环境变量：

```bash
VITE_APP_NAME="My Arena"
VITE_SAVE_INTERVAL=60000
```

## 6. 开发工具

### 6.1 VS Code 推荐插件

| 插件 | 用途 |
|------|------|
| TypeScript and JavaScript Language Features | TypeScript支持 |
| Prettier - Code formatter | 代码格式化 |
| ESLint | 代码检查 |
| Tailwind CSS IntelliSense | Tailwind提示 |
| React Developer Tools | React调试 |

### 6.2 调试配置

在 VS Code 中创建 `.vscode/launch.json`：

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Launch Chrome",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:5173",
      "webRoot": "${workspaceFolder}/src"
    }
  ]
}
```

## 7. 常见问题

### Q: 安装依赖失败

A: 尝试清理缓存后重新安装：
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Q: 开发服务器无法启动

A: 检查端口5173是否被占用，或更换端口：
```bash
npm run dev -- --port 5174
```

### Q: TypeScript类型错误

A: 运行类型检查：
```bash
npm run lint
```

### Q: 3D渲染异常

A: 检查浏览器是否支持WebGL，建议使用Chrome或Firefox

## 8. CI/CD

项目使用 GitHub Actions 进行持续集成：

| 工作流 | 触发条件 | 执行内容 |
|--------|---------|---------|
| Build | push/pull_request | 构建项目 |
| Test | push/pull_request | 运行测试 |
| Lint | push/pull_request | 代码检查 |
