# HOMEMEM ARENA 白屏 + 模型加载失败 · 系统化诊断与修复计划
（BUGFIX MODE · 研究化假设验证）

**目标**：L2 leave-home 在 `VITE_USE_KENNEY_LIVING_ASSETS=false`（旧程序化）、`true`（Kenney 替换）、`?assetCalibration=1`（校准页）三场景均能正常渲染、非白屏、无 console SyntaxError、模型进度闭合。

**方法**：先假设后验证，每层实验可证伪；验证顺序按成本从低到高（网络/日志 → DOM/CSS → WebGL 查询 → R3F 内部 → 二进制 GLB 校验），高成本实验仅在低成本假设被证伪后执行。

---

## 0 · 现状快照（P0 · 已收集）

### 0.1 硬观测（可重复，无主观）
| # | 观测 | 证据位置 |
|---|------|----------|
| O1 | old/new 共 9 张截图中央均为空白，HUD/Minimap/任务状态正常 | 2026-08-05 浏览器截图 |
| O2 | `ready.modelTotal=30, loaded=22, failed=8, inflight=0` → 进度闭合但 8/30 失败 | 5173 ready signal 2026-08-05T09:24 |
| O3 | `canvas.clientHeight / vpH = 1.0 (763/763)`，display=block，visibility=visible，opacity=1 | 同上浏览器 evaluate |
| O4 | `THREE.WebGLRenderer: Context Lost` 出现在 Console info 级别，随后 `[RenderReady] WebGL context lost (debounced, epoch=1)` warn | Console 2026-08-05T09:24 |
| O5 | `gl.isContextLost() === true`（用 `{preserveDrawingBuffer:true}` 新建 context 再查询），但 ready signal 当时仍显示 `webglContextLost=false` → 检测频率过低 | 同上 |
| O6 | 两个 modelRegistry 文件分离：`src/data/assets/modelRegistry.ts`（Kenney 5 条纯数据）vs `src/components/arena3d/models/ModelRegistry.ts`（fallback 组件 + 加载路径） | 源码 2026-08-05 |
| O7 | `src/components/arena3d/models/ModelRegistry.ts` 中 `tv / bookshelf / chair / dresser / painting / clock / shelf / cat / entray` 共 9 条登记为 `assetAvailable:false`，但其中 `tv` 和 `bookshelf` 对应 Kenney 的 `televisionModern` 与 `bookcaseOpen`，路径未更新 | ModelRegistry.ts L448-554 |
| O8 | Kenney 家具 `sofa / coffee_table / cabinet / television` 在 `MODEL_REGISTRY` 中路径指向旧版 `/assets/models/furniture/*.glb`（位于 public 目录），但 VITE_USE_KENNEY_LIVING_ASSETS=true 时预期应加载新版 Kenney 路径 `/assets/models/kenney/furniture/*.glb` → 两套路径不一致 | 源码 + public 文件 |

### 0.2 本轮已提交的未验收修改
- Scene3D.tsx：外层 div / Canvas 加 `#0f152a` 背景色（三重保险）、`preserveDrawingBuffer=true`、context 丢失防抖从 250ms → 120ms、兜底同步从 60 帧 → 6 帧
- AssetCalibrationView.tsx：同样外层 div + Canvas 背景色，`preserveDrawingBuffer=true`
- 未 commit，未 push

### 0.3 已知未触及（避免误判）
- 未修改 tasks / rooms / decorFurniture / spawn* / surfaceHeight
- 未修改旧程序化家具几何生成

---

## 1 · 假设树（P1 · 每层附可证伪实验）

### 层级 A · 白屏根因 5 类（按验证成本由低到高）
每类假设给出：**假设陈述**、**证伪实验**、**若证实 → 修复方向**、**预计耗时**。

#### A1 · CSS / DOM 遮挡层假设
- **陈述**：Canvas 实际绘制了深蓝色场景，但被某个绝对定位的零透明度 / 纯白子元素（HUD wrapper、弹层、Briefing 返回按钮 overlay）以 `z-index` 覆盖在中央；或 Canvas 被 `pointer-events:none` 不影响但视觉上有 overlay。
- **证伪实验（成本=10min）**：
  1. 浏览器 DevTools → Elements → 选中 `<canvas id=arena-canvas>` → 右键 "Scroll into view" → Computed 检查：`z-index`、`box-shadow`、`outline`、`mask-image`、`backdrop-filter`；
  2. 在 Console 执行：
     ```js
     document.querySelectorAll('body *').forEach(el => {
       const s = getComputedStyle(el)
       if (s.position === 'absolute' || s.position === 'fixed') {
         const bg = s.backgroundColor
         const op = Number(s.opacity || 1)
         if ((bg.startsWith('rgba(255,255,255') || bg === '#ffffff' || bg === 'white') && op > 0.5 && el.clientWidth > 300) {
           console.log('SUSPECT WHITE OVERLAY:', el.tagName, el.className, bg, op, el.getBoundingClientRect())
         }
       }
     })
     ```
  3. 对 Canvas 直接截图并 readPixels：
     ```js
     const c = document.getElementById('arena-canvas')
     const gl = c.getContext('webgl2', {preserveDrawingBuffer:true}) || c.getContext('webgl', {preserveDrawingBuffer:true})
     const w = gl.drawingBufferWidth, h = gl.drawingBufferHeight
     const p = new Uint8Array(w*h*4)
     gl.readPixels(0,0,w,h,gl.RGBA,gl.UNSIGNED_BYTE,p)
     // 统计 RGB 均 >245 的近白像素比例、方差、A>245 比例
     ```
- **若证实**：定位遮挡元素，移除错误 `background` / 调整 z-index 分层
- **若证伪**：Canvas 本身确实没画，往 A2 走

#### A2 · WebGL Context Lost 未恢复假设
- **陈述**：Context Lost 是真实丢失（非瞬时），从未触发 `webglcontextrestored`，导致 WebGLRenderer 持续用失效 gl；因此 Canvas 实际绘制内容为"未定义"（在部分浏览器显示为透明，透出外层白色背景 → 之前没加外层背景色时视觉为白，加了外层背景色后应当变深蓝但仍非"场景正确渲染"）。
- **证伪实验（成本=20min）**：
  1. Console 挂监听：
     ```js
     const c = document.getElementById('arena-canvas')
     let lostAt = null, restoredAt = null
     c.addEventListener('webglcontextlost', e => { lostAt = Date.now(); console.log('[MON] CONTEXT LOST', new Date().toISOString(), e) }, false)
     c.addEventListener('webglcontextrestored', e => { restoredAt = Date.now(); console.log('[MON] CONTEXT RESTORED, gap_ms=', restoredAt - lostAt) }, false)
     // 等待 15 秒看 restoredAt 是否非空
     setTimeout(() => console.log('[MON] 15s status: lostAt=', lostAt, 'restoredAt=', restoredAt, 'gl.isContextLost=', (() => { const gl = c.getContext('webgl2')||c.getContext('webgl'); return gl?.isContextLost?.() })()), 15000)
     ```
  2. 如果 gap_ms < 100ms → 瞬时丢失，属于 StrictMode 假卸载 / GPU 调度抢占；否则 = 真丢失
  3. 对比：用 Chrome `chrome://gpu/` 查看是否有 "Renderer event: context lost" 日志，与浏览器 Console 时间戳对齐
- **若证实**：
  - 瞬时丢失（gap<100ms）：在 FirstFrameTracker onRestored 中主动调用 `gl.resetState()` 并 `invalidateFramebuffer`
  - 真丢失（gap>1000ms 或无 restored）：尝试 `gl = canvas.getContext('webgl2', {failIfMajorPerformanceCaveat:false, antialias:false})` 降低门槛；或加 R3F `<Canvas fallback={...}>` 用程序化 DOM 渲染兜底
- **若证伪**：Context 状态健康，往 A3 走

#### A3 · Camera / Frustum / Clear 层假设
- **陈述**：WebGL 健康，但 `<color attach=background>` 没挂载成功（被 Suspense 打断？），R3F clear 走了默认 `(0,0,0,1)` 黑但加了外层 `#0f152a` 时应显示深蓝（不是白），所以更可能：Camera position `[0,1.7,3]` 旋转 `[0,PI,0]` → 面朝 -Z，但 Living Room 场景几何实际在 +Z，相机看向背面墙，视锥体内无内容 → 视觉上单一 clearColor 纯色。
- **证伪实验（成本=25min）**：
  1. 在 R3F 里加临时调试球（不提交，只在浏览器 DevTools 挂 useThree 临时 patch，或者改 Scene3D.tsx playing scene 顶部加：`<mesh position={[0,1,-2]}><sphereGeometry args={[0.5,16,16]}/><meshBasicMaterial color="yellow" /></mesh>` 然后 HMR）
  2. 如果调试球可见但房间不可见 → frustum 剔除（相机位置/方向错）
  3. 如果调试球也不可见 → 到 A4
- **若证实**：
  - 相机朝向错：查 `spawnPosition` + `spawnRotation`，`robotPosition` 初始值；在 camera 加 `lookAt` 调试
  - Clear 色错：确认 `<color attach=background>` 不在 Suspense boundary 内部且在场景根直接子节点
- **若证伪**：往 A4 走

#### A4 · Scene3D 结构分支假设
- **陈述**：`phase=briefing` 时 SceneContents 返回 `BriefingScene` → `startTask` 后 phase → `playing` → 返回 `PlayingSceneContents`。但 React 18 StrictMode 下 BriefingScene 挂载了两次 → 第二次挂载时 Canvas 内部 state 没 reset，或 `PlayingSceneContents` 依赖的 `task.rooms` 为空数组导致 `roomsToRender=[]` → 没渲染任何房间。
- **证伪实验（成本=20min）**：
  1. PlayingSceneContents 顶部加临时 Console：
     ```js
     console.log('[AUDIT] roomsToRender=', roomsToRender.map(r => r.id), 'currentRoom=', currentRoom, 'task=', task?.id, 'phase=', phase)
     ```
  2. 确认 BriefingScene → PlayingSceneContents 切换时，`<Room3D key=room.id>` 是否从 1 个（living）→ 多个（living + entrance + laundry）
  3. 是否有 React Error Boundary 捕获 Error 后 fallback=null 覆盖整个 SceneContents
- **若证实**：
  - roomsToRender 空：debug `task.rooms` 来源，`sharedRooms[id]` 是否 undefined
  - Error Boundary：在 Canvas 外层加 `<ErrorBoundary Fallback={...}>` 并 log error stack
- **若证伪**：往 A5 走

#### A5 · 单模型阻塞全局 Suspense 假设
- **陈述**：ArenaPage 中仍有顶级 `<Suspense fallback=null>` 包裹整个 Scene3D；当 8 个模型之一处于 PENDING 状态（未到 FAIL 也未到 SUCCESS），Suspense fallback=null 把 Canvas 替换成空白，模型统计里 inflight 显示 0 是因为"unmount 前 start 的任务在 unmount 后才 callback"，造成统计闭合但实际未渲染。
- **证伪实验（成本=30min）**：
  1. 搜索代码库所有 `<Suspense` 与 `lazy()`：
     ```bash
     grep -rn "Suspense\|React\.lazy\|lazy(()" src --include=*.tsx --include=*.ts
     ```
  2. 给每个 Suspense boundary 的 fallback 打不同颜色背景的 div（红/黄/蓝），看哪一个在白屏期间可见
  3. 看 R3F Canvas 是否有 `ConcurrentMode` + Suspense 组合：`react-three-fiber` 内部对异步资源（useGLTF / useTexture）默认走 Suspense，若未包边界会冒泡到顶级
- **若证实**：Suspense 下沉到单模型级（`RegisteredModel / FurnitureModel` 级单独包 `<Suspense fallback=<ProgrammaticFallback/>`），禁止顶级 Suspense fallback=null
- **若证伪**：需要 higher cost 诊断（R3F profiler / three inspector）

---

### 层级 B · 模型加载失败 8/30 根因 7 类
按 O2: 8 failed，但登记 `assetAvailable=false` 只有 9 条（O7），数量对不上 → 需要区分"真实 GLB 加载失败"vs"assetAvailable=false 未请求但被统计成 failed"。

#### B1 · assetAvailable=false 被统计成 failed 假设
- **陈述**：`MODEL_REGISTRY[id].assetAvailable===false` 的家具在 `ModelAsset` 被短路直接 `markDone(false)` → 计入 failed，所以"8 failed"其实是"8 条登记为 assetAvailable=false 的模型被标记失败"，并非真实网络请求失败。
- **证伪实验（成本=15min）**：
  1. DevTools → Network → Filter by `.glb` → 看实际发出请求数 N_req；与 `total - assetAvailable_false_count` 比较
  2. 在 Console 看 `loadStats.failedIds` 数组是否 = `['tv','bookshelf','chair','dresser','painting','clock','shelf','cat']`（共 8 条，正好对上 failed=8）
- **若证实**：统计分类修正 — `assetAvailable=false` 的 short-circuit 不算 failed，引入新字段 `skipped`，或直接不进入 `statsIncLoadStart/Done`；`progress = (loaded+failed)/(total-skipped)`；同时修改 HUD 文案"N failed"排除 skipped
- **若证伪**：failedIds 中包含 `sofa/coffee_table/fridge` 等有 GLB 的模型 → 往 B2 走

#### B2 · public 文件 SHA-256 不匹配 / 文件损坏假设
- **陈述**：Kenney 5 个 GLB 文件在 `public/assets/models/kenney/furniture/`，但下载时被截断（文件大小 < registry 记录），或 SHA-256 与 `MANIFEST.sha256` 不符 → GLTFLoader 解析到一半报 `SyntaxError: Invalid GLB header`。
- **证伪实验（成本=20min）**：
  1. 本地脚本：
     ```bash
     cd public/assets/models/kenney/furniture
     ls -l *.glb
     shasum -a 256 *.glb > /tmp/actual.sha
     cat MANIFEST.sha256  (在上一级)
     diff -u ../MANIFEST.sha256 /tmp/actual.sha
     ```
  2. 如 size<1KB：文件肯定损坏（重新 download）
- **若证实**：重新用 curl 下载 Kenney pack（或从已验证的备份恢复）；更新 MANIFEST
- **若证伪**：往 B3 走

#### B3 · resolveAssetUrl base 拼接错误假设（URL 路径 bug）
- **陈述**：Vite `base=/homemem-arena/`，但 `MODEL_ASSET_REGISTRY` 中 url 为 `/assets/models/kenney/...`；resolveAssetUrl 把 `/assets/` 开头的路径转成 `base/assets/...` → 但实际 fetch URL 要看 DevTools Network 的 `Request URL` 是否为 `http://host/homemem-arena/assets/models/kenney/furniture/loungeSofa.glb`。如果拼接出了 `//` 或多了一次 base（`/homemem-arena/homemem-arena/assets/...` → 404），那就是 B3。
- **证伪实验（成本=10min）**：
  1. DevTools Network → 点任一失败 `.glb` → Headers → `Request URL` vs `Response 404 / 200`
  2. 或 Console：`fetch(resolveAssetUrl('/assets/models/kenney/furniture/loungeSofa.glb')).then(r=>console.log(r.status, r.url))`
- **若证实**：修 resolveAssetUrl，增加"路径已含 BASE_URL 时不重复拼接"的 guard（目前实现是做了 raw.startsWith(normalizedBase) 判断，但要验证实际拼接结果）
- **若证伪**：往 B4 走

#### B4 · MIME 错误 / HTML 被当 GLB 解析假设
- **陈述**：路由配置中，访问不存在的路径返回 basename-warning HTML（200 OK + `text/html`），而不是 404；`GLTFLoader.load()` 收到 200+HTML，尝试用二进制解析 → 报 `SyntaxError: Invalid or unexpected token`（用户 O 提到的那条）。
- **证伪实验（成本=15min）**：
  1. 对每个失败的 .glb Network entry：看 Response Headers `Content-Type`，如果是 `text/html` 而不是 `model/gltf-binary` 或 `application/octet-stream` → 证实
  2. 看 Response body 前 200 bytes：是否是 `<!DOCTYPE html><html>...`（basename-warning 页）
- **若证实**：把 basename warning 页从 200 OK 改成 404 Status；或给 `/assets/**` 路由加 static file 优先级（必须在 catch-all 路由之前）
- **若证伪**：往 B5 走

#### B5 · GLTFLoader 纹理加载失败未算入 done 导致 fallback 假设
- **陈述**：GLB 主体加载成功，但内部引用的外部贴图 `.png/.jpg` 404 或 CORS 失败 → GLTFLoader 抛出 partial error，进入 ModelAsset 的 catch 分支 → 整个模型被标记 failed 并 fallback，但其实二进制 geometry 本身可正常显示。
- **证伪实验（成本=20min）**：
  1. DevTools Network → 看失败请求除 `.glb` 外，是否还有 `.png/.jpg/.bin/.ktx2`
  2. Console 把 `_rateLimitedWarn` 的 `WARN_COOLDOWN_MS` 临时改成 0，看完整 stack：是否含 `TextureLoader` / `set from object URL`
- **若证实**：GLB 内联纹理（用 gltf-transform 把外部资源 embed），或给 GLTFLoader 加 manager 的 onError handler 把 texture fail 降级为 warn 不整个失败
- **若证伪**：往 B6 走

#### B6 · Vite 缓存 / HMR chunk 损坏假设
- **陈述**：`node_modules/.vite` 中 three 的 GLTFLoader chunk 被截断 / rolldown 早期版本 bug；我们已执行过 `rm -rf node_modules/.vite`，但可能 HMR 推送的增量更新仍有错误。
- **证伪实验（成本=15min）**：
  1. Network → 看 `three/examples/jsm/loaders/GLTFLoader.js?v=xxx` 响应 Content-Length 与内容：是否完整包含 `parseGLTF / parseGLB` 函数
  2. 用生产构建验证：`npm run build && npm run preview -- --port 4173`，如果 build 版本能正常加载模型 → DEV 环境 HMR chunk 损坏
- **若证实**：升级 Vite / 锁定 Vite 版本号；关闭 HMR 某模型模块自动刷新
- **若证伪**：往 B7 走

#### B7 · 超时 12s 过短假设（Kenney 模型文件较大）
- **陈述**：loungeSofa.glb + 内嵌纹理 > 3MB，本地 127.0.0.1 下 12s 应该够，但如果机器磁盘慢 / 病毒扫描 I/O 阻塞，第一次冷启动可能超时；表现为第一次访问失败，刷新成功。
- **证伪实验（成本=10min）**：
  1. 第一次访问 → 看 failedId；刷新第二次 → 同一个 id 是否仍 failed；
  2. 把 `MODEL_TEXTURE_CACHE` 清空（`MODEL_TEXTURE_CACHE.clear()` 再刷新），看是否复现
- **若证实**：DEV 超时从 12s → 25s，并在 first load 时显示 `Loading large asset...` HUD；缓存命中时不走超时
- **若证伪**：需要 binary-level 审计（B6 生产构建对比已足够覆盖）

---

### 层级 C · WebGL Context Lost 根因 5 类
O4 明确有 Context Lost，但区分"瞬时可恢复"vs"真丢失"决定修复方向。

#### C1 · StrictMode 双挂载触发瞬时丢失假设
- **陈述**：React 18 StrictMode 下 FirstFrameTracker useLayoutEffect 挂 `onContextLost` 监听，第一次假 unmount → `gl.domElement` canvas 的事件监听器被 remove 又加回来，过程中 R3F 内部 `WebGLRenderer` dispose → 瞬时 create → 触发 lost 然后 restored（gap<100ms）。
- **证伪实验（成本=15min）**：
  1. `vite.config.ts` 临时 `react({ strictMode: false })`，重跑 3 次看是否还有 lost 日志
  2. 或 FirstFrameTracker 把 lost 事件时间戳与 epoch 对照，看 lost 发生是否总在 epoch=1（第一次 mount）后 50~150ms
- **若证实**：
  - 对 lost gap<150ms 不标记为真丢失（debounce + gap check）
  - 或在 `onContextLost` 里 `event.preventDefault()` 阻止浏览器默认销毁（让应用保持旧 context 不回收）
- **若证伪**：非 StrictMode 下仍有 lost → 往 C2 走

#### C2 · Canvas 尺寸 + dpr=2 显存压力假设
- **陈述**：Viewport 1440×900 × dpr=[1,2] → 实际 drawingBuffer 2880×1800 ≈ 5.2 MPix；加上 shadow map 1024×1024、postprocess PixelationPass 的两个 RT；在某些集成 GPU（Intel UHD 6xx）上超出 per-context 资源限额 → 浏览器 kill context。
- **证伪实验（成本=15min）**：
  1. Canvas 临时 `dpr={1}`、`shadows={false}`、移除 `PixelationPass`；观察是否还 lost
  2. `chrome://gpu` → Graphics Feature Status → WebGL 列；在 lost 时间点有没有 "Major performance caveat: yes"
- **若证实**：根据 `navigator.hardwareConcurrency<4 && GPU=Intel UHD` 动态 dpr=1 且 shadows 关；在 Scene3D 加自适应：
  ```ts
  const lowEnd = navigator.deviceMemory !== undefined && navigator.deviceMemory < 4
  <Canvas dpr={lowEnd ? 1 : [1,1.5]} shadows={!lowEnd && {type: THREE.PCFShadowMap}} />
  ```
- **若证伪**：往 C3 走

#### C3 · 多 Canvas 同时渲染（Minimap 独立 canvas）假设
- **陈述**：Minimap 组件渲染独立 Canvas 也用 WebGL context；浏览器限制单 tab WebGL context 数（通常 16 个，但 StrictMode 双 mount + Briefing/Playing 切换可能瞬时达 ≥2 active → 旧 context 被回收）。
- **证伪实验（成本=10min）**：
  1. DevTools → Performance → 录制 10s；看 Canvas: WebGL section 有几个 context id
  2. 临时把 Minimap Canvas 换成 2D canvas（不画 WebGL），看 Arena canvas 是否还 lost
- **若证实**：Minimap 改为 2D canvas 渲染（降低 context 压力），或共享主 Canvas 的 offscreen
- **若证伪**：往 C4 走

#### C4 · three/Timer 弃用触发内部错误假设
- **陈述**：Console 有 `[warn] THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.`；R3F 新版本与 three 新版本不兼容导致 loop 异常 → GPU 端长时间无指令 → watchdog 触发 context lost。
- **证伪实验（成本=15min）**：
  1. 检查 `package.json` 中 `three / @react-three/fiber / @react-three/drei` 版本兼容性（通常 drei 发布说明里写了兼容 three 版本范围）
  2. 搜代码是否某处还 `new THREE.Clock()`（应当改用 R3F 内部 `useThree().clock` 或 THREE.Timer）
- **若证实**：升级 R3F/ drei 到兼容 three 版本；或全局把 THREE.Clock 替换成 wrapper
- **若证伪**：往 C5 走

#### C5 · 浏览器 headless / 自动化环境 GPU 资源抢占假设
- **陈述**：之前的 BrowserUse / Playwright / 多个 Vite server（5173/5174）竞争同一 GPU，导致 context 被回收；但用户本地真实浏览器访问不 lost。
- **证伪实验（成本=10min）**：
  1. 仅开 1 个 Vite server，关闭 5174，新开 Chrome 普通窗口（非自动化 / 非 headless）访问 → 5 分钟是否还 lost
  2. 同时把 5173 最小化后台 → 看是否 lost（后台 tab GPU 降频策略）
- **若证实**：仅自动化环境 lost，不影响用户体验 → 只在 E2E 脚本里 `--disable-gpu-rasterization` 或 `webglcontextrestored` 等待信号；不影响生产代码

---

## 2 · 验证顺序（P2 · 成本从低到高）

按"2 小时内验证所有低成本假设"的总预算，顺序如下：

**第 1 轮（≤60min，纯浏览器 + 网络，零源码改动）**：
| 顺序 | 执行项 | 验证假设 | 产出 |
|------|--------|----------|------|
| 1 | A1: DOM 遮挡检测脚本 + Canvas readPixels 统计 | A1 遮挡 / 真 Canvas 空白 | 白像素比例 / 透明度 |
| 2 | B1: 看 Network `.glb` 实际请求数 + `failedIds` 内容 | B1 assetAvailable=false 被误统计 | `failedIds.length === 8 && 全是登记为 assetAvailable=false 的 id`？ |
| 3 | C1: 关 strictMode 重跑 3 次 | C1 StrictMode 瞬时 lost | lost 日志是否消失 |
| 4 | A2: Context 监听 15s 看 lost/restored gap | A2/C 类分层 | 真丢失 vs 瞬时 |
| 5 | B3+B4: 每个失败 `.glb` 的 RequestURL + Status + Content-Type | B3 URL / B4 HTML 被当 GLB | 是否有 404 / text/html |

**第 1 轮 GO/NO-GO**：若以上 5 项中 ≥3 项找到根因 → 直接进入修复（第 3 节）；若 5 项全证伪 → 进入第 2 轮。

**第 2 轮（≤60min，允许源码局部 patch 但不 commit）**：
| 顺序 | 执行项 | 验证假设 |
|------|--------|----------|
| 6 | A3: 临时加黄色调试球在相机前 2m 处 | A3 相机 frustum 错 |
| 7 | A4: 打 roomsToRender + task.rooms 日志 | A4 rooms 空 |
| 8 | A5: 搜索所有 Suspense 边界，给 fallback 上色 | A5 单模型阻塞全局 |
| 9 | B2: MANIFEST sha256 对比 + 文件大小 | B2 文件损坏 |
| 10 | B6: `npm run build` → preview 端口 4173 重跑 | B6 Vite HMR chunk 损坏 |
| 11 | C2+C3+C4: dpr=1 + 关 shadows + 关 minimap webgl + 搜 THREE.Clock | C 类 GPU / three 兼容 |

**第 2 轮后仍未定位** → 升级到"高成本诊断"：three inspector 插件、R3F Profiler、WebGL 调用 trace（Chrome `about://tracing` → webgl 类别）。

---

## 3 · 每假设证实后的修复 Gate 与验收

所有修复先在一个 feature patch 上实施，验收标准（对应原 BUGFIX MODE §八）：
| Gate 项 | 指标 | 通过阈值 |
|---------|------|----------|
| G-old | 旧场景白屏检测 | whitePixelRatio<20%, pixelVariance>阈值, canvasOpaqueRatio>90% |
| G-new | Kenney 新场景白屏检测 | 同上 |
| G-cal | 校准场景白屏检测 | 同上 |
| G-progress | 模型统计闭合 | `pending===0 && loaded+failed+skipped===total`，"skipped" 不进 failed |
| G-syntax | Console SyntaxError 计数 | 0 |
| G-webgl | webglContextLost（稳态 5s 后） | false 且 onRestored 被调用 0 或 ≥1 次但最终稳态 false |
| G-singleFail | 故意把 1 个 GLB 重命名成 .bak → 只有该家具显示 fallback；其余仍可见（不卡 66%，不全白） | 视觉确认 + HUD 显示 `failed=1` |
| G-reentry | 路由返回首页再进关卡 3 次 | 每次 pending 最终都归 0，不复现 66% 卡死 |
| G-diff | old vs new 截图 | 像素差异 > 5%（证明 Kenney 模型确实被替换） |

---

## 4 · 回滚策略（高风险修复项）

| 修复内容 | 风险 | 回滚方法 |
|----------|------|----------|
| B1 统计分类改法：新增 skipped 字段 | HUD 组件耦合改字段名 → 未找到字段 NPE | git revert 单个 patch；或在 HUD 加 `?? 0` 兜底 |
| A5 Suspense 下沉到单模型级 | R3F 内部 `<Suspense>` 与 GLTFLoader 冲突 → 无限 loading | 回滚为顶级 Suspense，加非空 fallback div |
| C2 动态降 dpr / 关 shadow | 视觉品质严重下降 → 用户投诉 | 改成 localStorage flag 控制，默认关（不启用降级） |
| A2 `e.preventDefault()` 在 onContextLost | 某些浏览器不支持 preventDefault → context 照样 lost，但代码抛错 | try/catch 包一层 |

---

## 5 · 预计工作量与 Gate 决策点

- 第 1 轮验证：≤60min
- 第 2 轮验证：≤60min
- 所有发现根因的修复：≤90min
- 最终 G-old/G-new/G-cal 截图 + 白屏检测：≤30min
- **总预算 ≤ 4h**，超时未完成 → 回到主线：优先恢复"旧程序化场景"渲染（先不碰 Kenney 新模型），保证 demo 可玩

**NO-GO 判定点**：
- 第 1 轮完成后，A1/A2 证实为 WebGL 真丢失且关闭 StrictMode/dpr=1/shadows=false 仍未解决 → 报告为"机器/GPU 环境问题"，不继续代码修复
- B1 证实（8 failed = assetAvailable=false 误统计）→ 修复统计分类后，模型问题即告一段落，不深挖 B2~B7
- B1 证伪且失败模型实际是 Kenney 5 个中的 ≥3 个 → 启动 B2/B3 优先；如果 ≥3 个 SHA 不匹配 → 批量重新下载 Kenney pack（30min）

---

## 6 · 与禁令 / 下阶段 WP 的边界一致

- 不修改 `src/data/tasks/*.ts` / `src/data/rooms.ts` / `src/data/decorFurniture.ts`
- 不修改 `spawnPosition / spawnRotation / surfaceHeight`
- 不新增公开关卡 / 不激活 Scene Graph
- 允许修改：`Scene3D.tsx / ModelAsset.tsx / ModelRegistry.ts / resolveAssetUrl.ts / AssetCalibrationView.tsx / vite.config.ts (strictMode 临时调试)` —— 都在允许范围
- 所有修改不 push / 不 commit（除非 9 项 Gate 全通过再单独 commit）
- 完成后下一步才是：WP1 L2 blocker fix + Living integration

---

（待用户审阅本计划后，按顺序执行；执行中每一层假设的证实/证伪结果实时更新到本文件对应假设条目。）
