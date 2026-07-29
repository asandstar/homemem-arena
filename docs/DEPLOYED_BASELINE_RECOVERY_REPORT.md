# DEPLOYED BASELINE RECOVERY REPORT

生成时间：2026-07-29

## 1. WIP 保全信息

### WIP Commit SHA
```
9a64fd1d9e463e1c6c30e6bdd66bd1d21f52561a
```

### Commit 文件列表 (6 files, +879/-38)
| 文件路径 | 变更 |
|---------|------|
| `.trae/documents/FIX_MODEL_LOADING_ISSUES_plan.md` | +189 新增 |
| `qa-artifacts/e2e/level-1-result.png` | 二进制更新 (54263 → 54542 bytes) |
| `qa-artifacts/qa-assets-report.json` | +303 新增 |
| `scripts/qa-assets.ts` | +163/-38 修改 |
| `src/components/arena3d/Scene3D.tsx` | +12 修改 |
| `src/components/arena3d/models/ModelAsset.tsx` | +212 修改 |

### WIP 提交后状态
分支：`rescue/local-wip-20260729`
状态：已提交全部修改，无未跟踪或未提交文件（working tree clean）
⚠️ 已按要求**未 push** 该分支

## 2. 部署基线 Commit

### 部署 SHA
```
544071f (HEAD -> semifinal/deployed-baseline, origin/main)
```

Commit Message: `docs: add audio lifecycle and interaction visual reports`

## 3. 部署来源证据

### GitHub Pages 部署方式
工作流文件：`.github/workflows/deploy.yml`
- 触发条件：`push: branches: [main]` + `workflow_dispatch`
- 构建步骤：`npm ci` → `npm run lint` → `npm test` → `npm run qa` → vite build
- 部署方式：`actions/deploy-pages@v4`，部署产物目录：`dist/`

### gh CLI 状态
```
gh: To use GitHub CLI in automation, set the GH_TOKEN environment variable.
```
由于缺少 GH_TOKEN，无法直接查询 `gh run list`。

### SHA 选择证据（构建产物内容哈希匹配）
通过 `curl` 拉取线上 `https://asandstar.github.io/homemem-arena/` 的 `index.html`，与本地基于 `544071f` 执行 `npm run build` 生成的 `dist/index.html` 对比，**所有 Vite contenthash 完全一致**：

| 资源类型 | 本地构建产物 | 线上实际文件 | 匹配 |
|---------|------------|-----------|-----|
| 主入口 JS | `index-XOYbrghS.js` | `index-XOYbrghS.js` | ✅ |
| 主样式 CSS | `index-SLiWId73.css` | `index-SLiWId73.css` | ✅ |
| JSX Runtime | `jsx-runtime-n5LQ9ujS.js` | `jsx-runtime-n5LQ9ujS.js` | ✅ |
| React Bundle | `react-_aben_Gf.js` | `react-_aben_Gf.js` | ✅ |

**结论**：`544071f` 即为当前 GitHub Pages 线上部署对应的源码基线，非猜测。

## 4. 基线验证结果

### npm ci
```
added 214 packages in 4s
37 packages are looking for funding
```
✅ 通过

### npm run build (tsc -b && vite build)
```
vite v8.1.3 building client environment for production...
transforming...✓ 2428 modules transformed.
dist/index.html                                 1.07 kB
dist/assets/index-SLiWId73.css                108.71 kB
dist/assets/index-XOYbrghS.js                 408.97 kB
dist/assets/Scene3D-Dp8O5sHB.js             1,207.04 kB
...
✓ built in 588ms
```
⚠️ 仅一个非阻塞警告：`Scene3D-Dp8O5sHB.js` (1.2MB) 与 `index-XOYbrghS.js` (409KB) 超过 500KB chunk size 建议阈值
✅ 通过

### npm test (vitest run)
```
Test Files  13 passed (13)
     Tests  306 passed (306)
  Duration  2.29s
```
✅ 306/306 全通过

### npm run dev
```
VITE v8.1.3  ready in 231 ms
➜  Local:   http://localhost:5175/homemem-arena/
```
✅ 启动成功

## 5. 线上 vs 本地基线差异

### 5.1 首页
| 检查项 | 本地 (localhost:5175) | 线上 (GitHub Pages) | 差异 |
|--------|---------------------|-------------------|-----|
| 页面标题 | 回声屋 · 记忆宅邸 \| HomeMem Arena | 回声屋 · 记忆宅邸 \| HomeMem Arena | 无 |
| 导航栏 | HomeMem Arena / 首页 / 任务 | HomeMem Arena / 首页 / 任务 | 无 |
| 主操作按钮 | 开始闯关 / 音效开启 | 开始闯关 / 音效开启 | 无 |
| 主标题 | 记忆宅邸：失忆管家 | 记忆宅邸：失忆管家 | 无 |
| 副标题 | 3D网页小游戏文案 | 3D网页小游戏文案 | 无 |

**结论**：✅ 首页完全一致

### 5.2 任务列表页
| 检查项 | 本地 | 线上 | 差异 |
|--------|-----|------|-----|
| 关卡卡片数量 | 5 | 5 | 无 |
| 初次整理 | 🏠 icon + 文案 | 🏠 icon + 文案 | 无 |
| 出门大作战 | 🚪 icon + 文案 | 🚪 icon + 文案 | 无 |
| 洗衣幽灵 | 👕 icon + 文案 | 👕 icon + 文案 | 无 |
| 早餐时间循环 | ⏰ icon + 文案 | ⏰ icon + 文案 | 无 |
| 深夜巡逻 | 🌙 icon + 文案 | 🌙 icon + 文案 | 无 |

**结论**：✅ 任务列表完全一致

### 5.3 第一关（初次整理）& 第二关（出门大作战）初始画面
| 检查项 | 状态 | 备注 |
|--------|-----|------|
| 路由跳转 | ✅ 通过 | /arena/clean-table, /arena/leave-home 可正常跳转 |
| HUD 渲染 | ⚠️ 部分 BLOCKED | 3D 页面主渲染存在加载波动，HUD 元素 DOM 结构可识别但完整画面需等待 WebGL 初始化 |
| 家具布局 | ⚠️ 部分 BLOCKED | 同 3D 渲染波动 |
| 玩家初始位置 | ⚠️ 部分 BLOCKED | 同 3D 渲染波动 |
| 操作流程（菜单导航） | ✅ 通过 | 首页→任务→选关→返回均正常 |

**差异总结**：除 3D WebGL 场景的初始化加载波动外（基线已知问题，非回归），路由、DOM 结构、2D UI 与线上一致。

## 6. 第一关与第二关已知基线问题

### 通用（两关共有）

#### 6.1 模型加载 404 → Fallback 到程序化 Primitive
以下模型路径在基线中持续返回 HTTP 404，触发 `[ModelAsset] GLTF load failed, fallback to primitive` 警告：

| 模型路径 | 关卡 | 影响 |
|---------|-----|-----|
| `/assets/models/props/cup.glb` | clean-table | 杯子使用 fallback 方块 |
| `/assets/models/furniture/coffee_table.glb` | clean-table | 茶几使用 fallback 方块 |
| `/assets/models/furniture/laundry_basket.glb` | clean-table / 其他 | 洗衣篮使用 fallback 方块 |
| `/assets/models/props/key.glb` | leave-home | 钥匙使用 fallback 方块 |
| `/assets/models/furniture/entrance_tray.glb` | leave-home | 玄关托盘使用 fallback 方块 |

基线行为：ModelAsset.tsx 中 fallback 机制正常触发，不阻断交互，仅视觉为程序化颜色方块。

#### 6.2 开发环境路径前缀缺失
开发环境 `vite.config.ts` 配置 `base: '/homemem-arena/'`，但模型注册表中路径为绝对路径 `/assets/models/...`，dev server 实际监听 `http://localhost:5175/homemem-arena/`，但模型请求被解析为 `http://localhost:5175/assets/models/...`（缺少 /homemem-arena 前缀）→ 404。
**生产构建无此问题**（vite build 时 base 被正确处理）。

#### 6.3 WebGL Context Lost 风险
```
[info] THREE.WebGLRenderer: Context Lost.
```
在部分浏览器/机器配置下（长时间 idle、多标签页、WebView 内嵌）可能触发 WebGL 上下文丢失，导致 3D 画面白屏。基线未做上下文恢复处理。

### 第一关（clean-table · 初次整理）特有
- 茶几模型缺失（`coffee_table.glb` 404），影响家具视觉识别
- 杯子模型缺失（`cup.glb` 404），影响拾取目标视觉识别
- 基线中 clean-table 任务数据与家具位置均正常

### 第二关（leave-home · 出门大作战）特有
- 钥匙模型缺失（`key.glb` 404），影响核心拾取物视觉识别
- 玄关托盘模型缺失（`entrance_tray.glb` 404），影响放钥匙目标位置识别
- 基线中 leave-home 任务流程（找钥匙→放托盘→出门）逻辑正常

## 7. 当前 Git 状态

### 当前分支
```
On branch semifinal/deployed-baseline
nothing to commit, working tree clean
```

### 分支对照
| 分支 | 用途 | 状态 |
|-----|------|-----|
| `rescue/local-wip-20260729` | 本地 WIP 保全（可玩性实验修改） | 已提交，未 push |
| `semifinal/deployed-baseline` | 本次恢复的线上部署基线 | 干净，HEAD = 544071f |
| `origin/main` | 远程主分支 | HEAD = 544071f |

### 与 WIP 分支差异总览
```
16 files changed, 120 insertions(+), 1796 deletions(-)
```
主要差异为 WIP 分支新增的模型加载修复代码（ModelAsset.tsx / Scene3D.tsx / qa-assets.ts）及相关文档，基线中未包含这些内容。

## 8. 本轮执行确认

✅ 已保存本地 WIP → `rescue/local-wip-20260729`（未 push）
✅ 已通过构建产物 hash 匹配确认线上部署 SHA → `544071f`
✅ 已基于部署 SHA 创建 → `semifinal/deployed-baseline`（未从 WIP 恢复任何文件）
✅ 已运行基线验证：`npm ci` ✅ / `npm run build` ✅ / `npm test 306/306` ✅ / `npm run dev` ✅
✅ 已对比首页与任务列表 → 与线上无差异
✅ 已输出第一关/第二关基线已知问题清单
✅ 已生成本报告

⚠️ 本轮**未修改**任何产品代码、测试、家具布局、DoorwaySpec
⚠️ 本轮**未 push** 任何分支
