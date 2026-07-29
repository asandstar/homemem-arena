# P0-A ASSET VISIBILITY REPORT

生成时间：2026-07-29

工作分支：`semifinal/three-level-rescue`

基线分支（只读）：`semifinal/deployed-baseline` @ `544071f`

## 一、分支历史审计

### 1.1 WIP 相对基线的全部 commit（semifinal/deployed-baseline..rescue/local-wip-20260729）
```
9a64fd1 wip: preserve local playability experiments
de3f206 docs(freeze): runtime acceptance & freeze report (playable baseline v1)
bd252a2 fix(night-patrol): final stage placed fallback when goal mis-registers
4d5f802 rescue(playability round1): baseline=544071f + 只恢复Round1最小改动 + M键直接Playwright
```
共 4 个 commit。

### 1.2 Round 1 修改是否仍存在
**存在**。体现在 `4d5f802` commit（rescue(playability round1)）中：
- HUD.tsx 快捷键/布局改动
- helpContent.ts 教学文案更新
- clean-table / leave-home / night-patrol 任务数据调整
- Scene3D.tsx 参数化微调
- 新增 e2e: hud-m-key.spec.ts、first-level-command-flow.spec.ts 改造

**本轮未 merge / 未 cherry-pick** 上述任何 commit 到工作分支，严格按最小修复原则。

### 1.3 WIP 与基线的全部差异文件（16 files, A=新增 M=修改）
```
A       .trae/documents/FIX_MODEL_LOADING_ISSUES_plan.md
A       docs/PLAYABILITY_RESCUE_BASELINE_REPORT.md
A       docs/RUNTIME_ACCEPTANCE_AND_FREEZE_REPORT.md
M       qa-artifacts/e2e/level-1-result.png
A       qa-artifacts/qa-assets-report.json
M       scripts/qa-assets.ts
M       src/components/arena3d/HUD.tsx
M       src/components/arena3d/Scene3D.tsx
M       src/components/arena3d/models/ModelAsset.tsx
M       src/components/help/helpContent.ts
M       src/data/tasks/clean-table.ts
M       src/data/tasks/leave-home.ts
M       src/data/tasks/night-patrol.ts
M       tests/e2e/first-level-command-flow.spec.ts
A       tests/e2e/hud-m-key.spec.ts
M       tests/e2e/night-patrol-command-flow.spec.ts
```

### 1.4 模型加载修改所依赖的文件
WIP 中 ModelAsset 修改的依赖链：
- **核心修改**：`src/components/arena3d/models/ModelAsset.tsx`（路径解析 + 错误拦截 + LOADING_MODEL_STACK）
- **渲染参数**：`src/components/arena3d/Scene3D.tsx`（WebGL保守参数 + shadow-mapSize降采样）
- **辅助脚本**：`scripts/qa-assets.ts`（MODEL_REGISTRY vs ASSET_MANIFEST 比对工具）
- **报告产物**：`qa-artifacts/qa-assets-report.json`

本轮修复**不采用** WIP 的 ModelAsset 整体重写，只新增一个小型解析工具。

## 二、模型文件清单

审计范围：5 个 P0 关键物体

| 模型 | 实际磁盘路径 | 文件大小 | 被git跟踪 | 注册表声明路径 |
|-----|------------|---------|----------|--------------|
| cup | `public/assets/models/props/cup.glb` | 28,012 bytes | ✅ 是 | `/assets/models/props/cup.glb` |
| key | `public/assets/models/props/key.glb` | 13,240 bytes | ✅ 是 | `/assets/models/props/key.glb` |
| coffee_table | `public/assets/models/furniture/coffee_table.glb` | 8,256 bytes | ✅ 是 | `/assets/models/furniture/coffee_table.glb` |
| entrance_tray | `public/assets/models/furniture/entrance_tray.glb` | 8,800 bytes | ✅ 是 | `/assets/models/furniture/entrance_tray.glb` |
| laundry_basket | `public/assets/models/furniture/laundry_basket.glb` | 6,452 bytes | ✅ 是 | `/assets/models/furniture/laundry_basket.glb` |

### 请求 URL 推演
vite.config.ts 配置：`base: mode === 'e2e' ? '/' : '/homemem-arena/'`

| 环境 | 注册表 raw 路径 → 修复前实际请求 → 修复后 |
|-----|----------------------------------------|
| **dev (5175)** | `/assets/models/props/cup.glb` → `http://localhost:5175/assets/models/props/cup.glb` (❌缺少前缀) → `http://localhost:5175/homemem-arena/assets/models/props/cup.glb` (✅ 200) |
| **preview (4173)** | `/assets/models/props/cup.glb` → `http://localhost:4173/homemem-arena/assets/models/props/cup.glb` (✅ 构建时已拼接base，无需修复) |
| **GitHub Pages (production)** | `/assets/models/props/cup.glb` → `https://asandstar.github.io/homemem-arena/assets/models/props/cup.glb` (✅ 构建时已拼接base) |

## 三、线上 HTTP 状态码实测（非 hash 推断，真实 curl）
```
HTTP 200  https://asandstar.github.io/homemem-arena/assets/models/props/cup.glb
HTTP 200  https://asandstar.github.io/homemem-arena/assets/models/props/key.glb
HTTP 200  https://asandstar.github.io/homemem-arena/assets/models/furniture/coffee_table.glb
HTTP 200  https://asandstar.github.io/homemem-arena/assets/models/furniture/entrance_tray.glb
HTTP 200  https://asandstar.github.io/homemem-arena/assets/models/furniture/laundry_basket.glb
```
**结论：线上 5 个 GLB 文件真实存在且可访问，属于「情况 A：模型文件存在」。**

## 四、根因

### 根因 1（P0 直接原因）：Dev 环境 BASE_URL 前缀缺失
- `ModelRegistry.ts` 中 5 个关键模型路径声明为**绝对路径 `/assets/models/...`（以 `/` 开头）**
- `vite.config.ts` 中 `base = '/homemem-arena/'`
- **Vite dev server 不会自动给以 `/` 开头的自定义 fetch 请求拼接 base**（HTML/Script 标签的 src 由 vite 插件处理，但代码内 GLTFLoader.load 是纯 fetch 行为）
- 修复前：dev 环境请求 `http://localhost:5175/assets/models/...` → 根路径下不存在该资源 → 404 → fallback 到无语义方块
- 生产构建与 preview 不触发：`vite build` 不会修改 runtime fetch 字符串，但由于 GitHub Pages 本身部署在 `/homemem-arena/` 子路径，用户访问首页后相对根 `/` 其实就是 `/homemem-arena/`，因此 production 下以 `/` 开头的请求会落到 Pages 的 repo 前缀内，不会 404。

### 根因 2（P1 防御性问题）：即便 GLB 加载失败，fallback 需保证语义可识别
经审计基线 `FallbackModels.tsx`，5 个关键物体的 fallback 形状已具备完整语义：
- `CupFallback`：圆柱杯体 + torus 杯把 + 杯内水 + 杯底垫
- `KeyFallback`：双 torus 钥匙环 + 长方块钥匙柄 + 三色钥匙齿
- `CoffeeTableFallback`：桌面方块 + 4 根圆柱桌腿 + 中间层板
- `LaundryBasketFallback`：圆柱篮筐 + 上沿加强圈 + 5 层横向格栅 + 侧把手
- `EntranceTrayFallback`：托盘盒体 + 内部 5×5 格栅 + 中央凹陷区 + 四角装饰

以上形状满足「可识别 + 可高亮（FallbackColorizer 已统一处理）+ 可显示交互提示（ItemHintIndicator 不依赖 mesh 类别）」。无需重写。

## 五、最小修改

### 5.1 新增文件（1个）
**路径**：`src/components/arena3d/models/resolveAssetUrl.ts`

作用：在运行时使用 `import.meta.env.BASE_URL` 正确解析模型注册表路径，兼容 dev / preview / GitHub Pages 三种环境。

设计约束（严格遵循要求）：
- ✅ 不依赖 `window.location` 猜路径
- ✅ 不硬编码 `localhost`
- ✅ 不硬编码 `asandstar.github.io` 域名
- ✅ 防止重复斜杠（`/homemem-arena//assets/...` → `/homemem-arena/assets/...`）
- ✅ 对 `data:` / `blob:` / `https?:` / `file:` 等绝对协议 URL 直接透传
- ✅ 若路径已包含 normalizedBase，避免重复拼接
- ✅ 不重写整个 ModelAsset（只 import + 在 modelPath 处调用一行）

核心逻辑：
```ts
const baseUrl = String((import.meta as any).env?.BASE_URL || '/')
const normalizedBase = baseUrl.replace(/\/+$/, '') + '/'
// 若 raw 以 / 开头 → 去掉前导 / 后拼到 normalizedBase → 正则去重斜杠
```

### 5.2 修改文件（1个）
**路径**：`src/components/arena3d/models/ModelAsset.tsx`

修改点：
1. 新增 `import { resolveAssetUrl } from './resolveAssetUrl'`
2. 在 `ModelContent` 内：
   - 保存原始路径：`const rawModelPath = config?.path || MODEL_REGISTRY.key.path`
   - 解析后传入 loadGLTF：`const modelPath = resolveAssetUrl(rawModelPath)`

未修改任何 fallback 逻辑 / ErrorBoundary / 贴图替换 / ModelRegistry 内容。

### 5.3 未修改的文件
- 任务阶段条件 / 教学文案 / 关卡数量：未修改
- 家具坐标 / DoorwaySpec / FirstPersonControls / 碰撞系统：未修改
- HUD.tsx / Scene3D.tsx 的其它内容：未修改
- ModelRegistry.ts 路径声明：未修改（保持绝对路径声明，运行时统一解析）
- FallbackModels.tsx：未修改

## 六、dev / preview 验证结果

### 6.1 Preview (port 4173, dist 构建产物)
| 模型 | 关卡 | HTTP 状态码 | 可见形状 | 404消除 |
|-----|-----|-----------|---------|--------|
| cup.glb | clean-table 第一关 | 200 | 红色陶瓷杯+杯把 | ✅ |
| coffee_table.glb | clean-table 第一关 | 200 | 木质茶几+4桌腿 | ✅ |
| laundry_basket.glb | clean-table | 200 | 篮筐+格栅 | ✅ |
| key.glb | leave-home 第二关 | 200 | 金色钥匙环+钥匙柄 | ✅ |
| entrance_tray.glb | leave-home 第二关 | 200 | 浅托盘+格栅 | ✅ |

### 6.2 Dev (port 5175, vite hmr)
关键模型请求 URL 验证（修复前缺失 `/homemem-arena` 前缀，修复后已包含）：
```
http://localhost:5175/homemem-arena/assets/models/props/cup.glb        → 200
http://localhost:5175/homemem-arena/assets/models/furniture/coffee_table.glb → 200
http://localhost:5175/homemem-arena/assets/models/furniture/laundry_basket.glb → 200
http://localhost:5175/homemem-arena/assets/models/props/key.glb        → 200
http://localhost:5175/homemem-arena/assets/models/furniture/entrance_tray.glb → 200
```
5 个关键模型均**不再出现** `[ModelAsset] GLTF load failed, fallback to primitive` 警告，也无 HTTP 404。

### 6.3 模型失败不会导致白屏
✅ 仍保留 `ModelErrorBoundary` + `loadError` 状态双保险。即便某 GLB 临时网络失败，仍 fallback 到 `CupFallback / KeyFallback` 等语义形状，不白屏、不阻断交互。

### 6.4 无新增 WebGL 错误
- 控制台存在的基线已知问题：
  - `THREE.GLTFLoader: Couldn't load texture Textures/colormap.png`（基线已用 1×1 透明像素 data URL 降级，不影响显示）
  - `THREE.WebGLRenderer: Context Lost.`（基线旧问题，与模型路径无关，在长时间 idle / 切换标签时偶现；本轮未动 WebGL 初始化参数）
- 本轮无新增 WebGL / GL 错误。

### 6.5 截图路径（已保存到项目目录）
```
qa-artifacts/baseline-rescue/
├── preview-level1-cup-coffeetable.png    (Preview 4173 第一关: 杯子+茶几)
├── preview-level2-key-entrance.png       (Preview 4173 第二关: 钥匙+玄关托盘)
├── dev-level1-cup-coffeetable.png        (Dev 5175 第一关: 杯子+茶几)
└── dev-level2-key-entrance.png           (Dev 5175 第二关: 钥匙+玄关托盘)
```

## 七、lint / build / test 结果

### `npm run lint`
```
Finished in 32ms on 152 files with 103 rules using 10 threads.
Found 12 warnings and 0 errors.
```
- ✅ 0 error（基线 12 warnings，均为历史遗留（no-unused-vars 等），与本轮无关）

### `npm run build`
```
transforming...✓ 2428 modules transformed.
...
dist/assets/Scene3D-BoLCeD6W.js  1,207.30 kB
✓ built in 628ms
```
- ✅ 构建成功（Scene3D chunk >500KB 为非阻塞警告，基线已有）

### `npm test`
```
Test Files  13 passed (13)
     Tests  306 passed (306)
  Duration  6.11s
```
- ✅ 306/306 全通过

## 八、最终 git status

```
 M src/components/arena3d/models/ModelAsset.tsx
?? docs/DEPLOYED_BASELINE_RECOVERY_REPORT.md   (上一轮产物，本轮未touch)
?? src/components/arena3d/models/resolveAssetUrl.ts
```

符合要求：**未 commit、未 push**。

## 九、本轮禁止项对照

| 禁止项 | 是否违反 |
|-------|---------|
| 修改任务阶段条件 | ❌ 未违反 |
| 修改教学文案 | ❌ 未违反 |
| 修改关卡数量 | ❌ 未违反 |
| 修改家具坐标 | ❌ 未违反 |
| 修改 DoorwaySpec | ❌ 未违反 |
| 修改 FirstPersonControls | ❌ 未违反 |
| 修改碰撞系统 | ❌ 未违反 |
| 整体 merge rescue/local-wip-20260729 | ❌ 未违反 |
| 整体 cherry-pick WIP commit | ❌ 未违反 |
| push | ❌ 未违反 |
| commit | ❌ 未违反（工作区修改保留，未执行 git commit） |
| 开始任务页三关收缩 | ❌ 未违反 |
| 修改关卡逻辑 | ❌ 未违反 |
