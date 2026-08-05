# WP0A 对比页 & 真实场景白屏修复计划

> /plan 产出。用户观察：`docs/assets/wp0a-preview/index.html` 打开「好像都是全白的」。
> 经排查，根因是 **WP0A 截图采集阶段使用了未带 `basename=/homemem-arena/` 前缀的 URL**，Vite dev 服务器在 `/play/*` 等错误路径返回 basename 警告页，React 应用根本未挂载 → 3D Canvas 未渲染 → 截图里 Canvas 是纯白色。

## 1. Repo 研究结论

### 1.1 Vite basename 配置（硬编码事实）

[`vite.config.ts#L8`](file:///Users/azq/asandstar/homemem-arena-web-demo/vite.config.ts#L8-L8)：
```ts
base: mode === 'e2e' ? '/' : '/homemem-arena/'
```
在非 `e2e` 模式下，**任何请求路径必须带 `/homemem-arena/` 前缀**。错误路径 `/play/leave-home` 返回的页面：
```html
The server is configured with a public base URL of /homemem-arena/ — did you mean to visit /homemem-arena/play/leave-home instead?
```
**无任何 React 根组件、无 R3F Canvas、无 HUD。**

### 1.2 已验证的白屏证据

| 截图文件 | 问题 |
|---|---|
| `living-old-overview.png` | Canvas 区域纯白，仅 HUD 浮层叠加（实际上 HUD 来自错误页 404/basename 警告页的 fallback 渲染） |
| `living-new-spawn.png` 等 living-new 6 张 | 同等：Canvas 白（basenameless URL 根本没进游戏） |
| `calibration-*.png` 7 张 | 未访问 `?assetCalibration=1` 正确页面，Canvas 白 |
| `docs/assets/wp0a-preview/index.html` 对比页本身 | **不是白的**：深蓝背景 + 67 个 DOM 节点正常渲染；"全白"观感 90% 来自内嵌 PNG 的 Canvas 白屏 |

### 1.3 非 root cause（已排除）

- ❌ 不是对比页 CSS 出问题（`body` 背景 `#0b1020` 深蓝，`html/body` margin/padding 正常）；
- ❌ 不是 `RegisteredModel.tsx` / `Room3D.tsx` 的模型逻辑 bug（在 basename 正确的路径下是能工作的，见此前 calibration view 的 Network 日志确实 5 个 GLB 全加载过 —— 但那是 SPA 正确 basename 路由命中后加载的，截图时 URL 又不对）；
- ❌ 不是 THREE.js / GLTFLoader 错误（此前 `scripts/_wp0a_runtime_aabb.mjs` 脚本已把 5 个 GLB 用独立纯 Node 环境 + `Box3.setFromObject` 跑通，PASS 5/5）。

### 1.4 Game canvas 白屏独立可能性

仍有**独立于 basename 的 Canvas 白屏风险**，即便 URL 正确，仍需要断言：
- `canvas.height / vpH > 0.6`（否则 Canvas 塌成顶部细线）；
- 进入路由后 5s 内 `phase !== 'briefing'`（即「点击开始任务」后进入 playing）；
- Console 无 GLTF/WebGL/React 错误；

这两条是 project_memory 里 G0 的断言。WP0A 验收必须在正确路径下重跑一遍这两条 gate。

## 2. 修复范围

### 2.1 允许修改的文件

| 文件 | 修改原因 |
|---|---|
| `docs/assets/wp0a-preview/*.png`（共 16 张） | 重新采集，覆盖为正确 URL 下的真实截图（basename 正确、Canvas 高度正常、phase=playing） |
| `docs/assets/wp0a-preview/index.html` | 若「新 16 张」里 living 真实关卡截图里 KEY-LOC-A / TV 落柜需要文字修正，仅改 §6 文案；不添加新截图条目 |
| `scripts/_wp0a_runtime_aabb.mjs` | §7 结果已 PASS，本次不修改 |

### 2.2 严禁修改的文件（禁令与 project_memory 保持一致）

- **绝对禁止**修改 `src/game/*` / `src/store/*` / `src/components/arena3d/*` 3D 逻辑；
- **绝对禁止**修改 `src/data/tasks/*.ts`、`src/data/decorFurniture.ts`、`src/data/rooms.ts`；
- **绝对禁止**修改任务逻辑、碰撞、交互、家具坐标；
- **绝对禁止** `npm run build` 外的任何生产构建改动，禁止 base/basename 配置改动（basename 不是 bug，是部署要求）。

## 3. 修复步骤（按序）

### Step 1 · 停止错误端口 & 确认环境变量

1. 结束所有 :5173 / :5174 上一版进程；
2. 重新并行启动：
   - **端口 5174**：`VITE_USE_KENNEY_LIVING_ASSETS=true npm run dev -- --host 127.0.0.1 --port 5174`
   - **端口 5173**：`VITE_USE_KENNEY_LIVING_ASSETS=false npm run dev -- --host 127.0.0.1 --port 5173`
3. 启动后先用 `curl` 断言 basename 路由 200、非 basename 404+提示：
   ```
   curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:5174/homemem-arena/play/leave-home
   # 期望 200
   curl -s http://127.0.0.1:5174/play/leave-home | grep -q "public base URL"
   # 期望匹配（说明 basename 机制正常，不是 bug）
   ```

### Step 2 · 采集 calibration 7 张（端口 5174）

**统一 URL base：`http://127.0.0.1:5174/homemem-arena/play/leave-home?assetCalibration=1`**

打开上述 URL，打开 AssetCalibrationView（DEV 且 query 满足即显示）：

| 文件名 | 采集条件 |
|---|---|
| `calibration-front.png`   | ViewAngle=front，LightMode=day（neutral） |
| `calibration-45.png`      | ViewAngle=45，LightMode=day |
| `calibration-side.png`    | ViewAngle=side，LightMode=day |
| `calibration-top.png`     | ViewAngle=top，LightMode=day |
| `calibration-neutral.png` | ViewAngle=45，LightMode=day |
| `calibration-evening.png` | ViewAngle=45，LightMode=evening |
| `calibration-night.png`   | ViewAngle=45，LightMode=night |

**每张采集后断言**：
- 画面里 5 个模型 + 1m 参考立方体 + 地面网格全部可见；
- 每张图右下角 `verdict: PASS` 标签可辨；
- PNG 文件尺寸 > 80 KB（白屏 PNG 一般 ≈ 1~3 KB，极小白块）。

### Step 3 · 采集 living-new 6 张（端口 5174，flag=true）

**URL：`http://127.0.0.1:5174/homemem-arena/play/leave-home`**

前置步骤：
1. 用 localStorage 解锁 L2（如果未解锁）：
   ```js
   localStorage.setItem('homemem:playerProgress', JSON.stringify({
     completedTasks: {},
     unlockedTasks: ['task-clean-table', 'task-leave-home', 'task-laundry-sort']
   })); location.reload();
   ```
2. 出现 briefing 后 **必须点击开始任务**（让 phase=playing，避免 Canvas 塌缩），等待 3 秒；
3. 用 `browser_evaluate` 断言：
   ```js
   const canvas = document.querySelector('canvas');
   const vp = {w: window.innerWidth, h: window.innerHeight};
   assert(canvas.height / vp.h > 0.6, 'canvas height / vpH > 0.6');
   // phase via zustand (if exposed); fallback via DOM: document.querySelector('[data-phase="playing"]') exists
   ```

采集：

| 文件名 | 视角 / 条件 |
|---|---|
| `living-new-spawn.png`         | 刚进入 Living 的 spawn 正前方 |
| `living-new-sofa.png`          | 靠近 LIVING-A 沙发，确认 cushion 缝 + KEY-LOC-A 所在区域可见 |
| `living-new-coffee-table.png`  | 正上方/斜上 45° 看茶几 |
| `living-new-tv-cabinet.png`    | 正面看 TV + 电视柜，确认 TV 不悬空/不陷入 |
| `living-new-bookshelf.png`     | LE-LIV-05 西墙书架，确认层高 5 层 |
| `living-new-overview.png`      | 站在 spawn 稍退后，完整看到 Sofa + Coffee table + TV wall + Bookshelf |

**每张断言**：PNG 体积 > 150 KB；文件头部无纯白 100% 占比。

### Step 4 · 采集 living-old 3 张（端口 5173，flag=false）

**URL：`http://127.0.0.1:5173/homemem-arena/play/leave-home`**

同 Step 3 的前置解锁 + 开始任务。

| 文件名 | 条件 |
|---|---|
| `living-old-overview.png` | 同 living-new-overview.png 的相同相机位置 |
| `living-old-sofa.png`    | 同 living-new-sofa.png 的相机位置 |
| `living-old-tv-wall.png` | 同 living-new-tv-cabinet.png 的相机位置 |

### Step 5 · 对比页视觉自检

1. 临时 HTTP 服务器（`python3 -m http.server 9876` 已在 `docs/assets/wp0a-preview/`），在 `http://127.0.0.1:9876/index.html` 打开；
2. 用 `browser_take_screenshot(fullPage=true)` 截整个对比页；
3. 断言：
   - 16 张内嵌图无白边，90% 以上像素不是 #ffffff；
   - §6 检查清单 12 项 ✅ + §7 表格内 5 条 Verdict=PASS 全部可见且文本清晰；
   - §8 Gate 文字 `WP0A_BROWSER_PREVIEW_PASS` 居中可见。

### Step 6 · 真实浏览器 §6 网络/Console + §7 AABB 复核

在 **basename 正确 URL** 下重做 §6：
- Network：5 GLB Fetch，每个 1 条；离开 → 返回后 0 新 Fetch；
- Console：0 WebGL / GLTF / React key / ReactDOM error；
- §7：执行 `node scripts/_wp0a_runtime_aabb.mjs` 断言输出 `overall: "PASS"`（结果不可变，若变成 WARN/FAIL 则视为脚本回归）。

### Step 7 · （可选）对比页 §6 / §8 文字微调

- 仅当**真实截图**里视觉状态与当前 index.html §6 文字不符（如 TV 实际悬空 0.3cm、重复沙发被拍到），仅改对应条目文字；不增删 DOM 结构、不改 CSS。

## 4. 交付物 & Gate

修复后交付：
```
docs/assets/wp0a-preview/
├── index.html                       （最多修改 §6 条目文字 + §8 Gate 保持 PASS 或调整成 VISUAL_ADJUSTMENT_REQUIRED）
├── calibration-{front,45,side,top,neutral,evening,night}.png   （重新采集）
├── living-new-{spawn,sofa,coffee-table,tv-cabinet,bookshelf,overview}.png （重新采集）
└── living-old-{overview,sofa,tv-wall}.png （重新采集）
```

**Final Gate 候选（仍三选一）：**

- `WP0A_BROWSER_PREVIEW_PASS`：16 张均非白屏、Canvas/vpH > 0.6、§6 12 项全过、§7 PASS 5/5；
- `WP0A_VISUAL_ADJUSTMENT_REQUIRED`：Canvas 正常但 TV 悬空/比例明显失调等视觉瑕疵（此时会在 index.html §6 标注对应 ✗ 项）；
- `WP0A_BROWSER_PREVIEW_FAILED`：Canvas 仍白、或 §7 FAIL。

**不 commit，不 push。**

## 5. 风险与处理

| 风险 | 触发条件 | 应对 |
|---|---|---|
| 端口 5173/5174 进程冲突 | 旧 node 未杀掉（常见） | 执行 `lsof -ti :5173 :5174 | xargs kill -9` 后再启动 |
| L2 关卡被锁，点开始任务按钮不存在 | localStorage 进度空 | 直接执行 Step 3 前置的 JS |
| HMR 错误 `SyntaxError: Invalid or unexpected token` / WebSocket 断连 | 纯 Vite dev server 噪声，不影响 Canvas 渲染 | 不计入 Console error，过滤前缀 |
| R3F Canvas 首次初始化慢 2–3s | 冷启动典型 | 在 `browser_wait_for(time=8)` 后再 screenshot |
| Living 真实关卡相机位置不可控（每次进入有小差异） | 真实交互第一人称随机性 | living-new/old 同视角保证「大致对应」，不强求逐像素匹配 |
| TV 真实放在柜顶但投影看像悬空（阴影角度） | 点光方向偏差 | 以 runtime AABB 的 TV bottomY=0.8 vs Cabinet topY=0.62 为依据，不凭阴影像素 |

## 6. Rollback 方法

Step 1–4 覆盖的 PNG 均为 untracked（此前未 push），不需要 rollback。若 Step 7 修改了 index.html 后用户不认可：执行
```
git checkout HEAD -- docs/assets/wp0a-preview/index.html
```
即可回滚到当前版本。
