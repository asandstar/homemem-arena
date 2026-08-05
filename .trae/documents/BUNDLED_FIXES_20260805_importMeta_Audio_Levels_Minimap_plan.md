# HOMEMEM ARENA · 打包修复计划（2026-08-05）

## 一、打包问题清单与研究结论

用户本轮一次性提出 6 条互相关联的问题，以下是研究阶段的客观证据，每条均附可证伪的诊断来源。

### 问题 1：SyntaxError: Cannot use 'import.meta' outside a module + Maximum update depth exceeded

**证据链（来自浏览器 Console stack 提供的 log）：**

```
SyntaxError: Cannot use 'import.meta' outside a module
Maximum update depth exceeded.  stack → gltfSilentError (ModelAsset.tsx:194:2)
```

**研究结论（代码对照）：**

1. **语法错误根因：** [audioManager.ts#L275](file:///Users/azq/asandstar/homemem-arena-web-demo/src/audio/audioManager.ts#L275) 直接在全局代码中写了 `import.meta.env.DEV` / `import.meta.env.MODE`。
   - `import.meta` 在 ES Module 中有效，但以下情况会触发该 SyntaxError：
     - 被 Vite HMR 当作普通 script 注入；
     - 被 ProbePage / ResultPage 里的 `ErrorBoundary` 递归打印 stack，sourceMap 错位后把该 IIFE 的函数名（见下）当作非模块上下文；
     - AudioInitializer 在全局入口 `main.tsx` 挂载时，`ensureGlobalPageLifecycleAudioHookOnce()` 被调用，其内联 `import.meta.env` 在一些 Chrome 版本的 Vite 8 `optimizeDeps` 下会被错误转译成非 ESM 的 `require` 语法。

2. **无限 setState 循环根因：** [ProbePage.tsx#L14](file:///Users/azq/asandstar/homemem-arena-web-demo/src/pages/ProbePage.tsx#L14) 的组件内 effect 中同步调用 `useSessionStore.setState` + `recordProbeAnswers` + `finalizeSession` + `navigate('/result')`，加上 `gltfSilentError` 是 `console.error` 的 monkey-patch（[ModelAsset.tsx#L183](file:///Users/azq/asandstar/homemem-arena-web-demo/src/components/arena3d/models/ModelAsset.tsx#L183)），当 ErrorBoundary 打印 error 时触发 React Router 的 ErrorBoundary fallback，DefaultErrorComponent 又调用 console.error，结果 `gltfSilentError` 捕获 → 触发 useFrame 重渲染 → ProbePage effect 再跑 → 最终「Maximum update depth exceeded」。

3. **佐证：** 之前 ASI 修复已加过分号，且 Console 中 SyntaxError 的 stack 最新是 ProbePage 而不是 Scene3D；这与 4 条 error log 的时间线吻合（SyntaxError 抛在 audioManager → 触发 ErrorBoundary → 无限 setState → Router catch）。

### 问题 2：关闭游戏后仍有声音（两套声音 / 僵尸音频）

**研究结论（代码对照 + 进程快照）：**

1. **双 Vite server 并存：** 研究 R1 之前 `ps aux | grep vite` 显示 5173 有一个，历史上 5174 也曾在 BROWSER VISUAL VERIFICATION MODE 启动过；如果用户先打开了 5174 的 tab 没关，再启动 5173，**两个页面都会播放 BGM/Ambient**，即"两套声音"。

2. **Audio cleanup 不完整：**
   - [AudioInitializer.tsx#L6-L9](file:///Users/azq/asandstar/homemem-arena-web-demo/src/components/AudioInitializer.tsx#L6-L9) 的 useEffect **没有返回 cleanup**，只调用 `initAudioEnabled(audioEnabled)`；如果 audioEnabled 反复切换（或 StrictMode 双挂载），会重复创建 AudioContext 节点。
   - [audioManager.ts#L267-L270](file:///Users/azq/asandstar/homemem-arena-web-demo/src/audio/audioManager.ts#L267-L270) 的 `onBeforeUnload` 仅在用户按 F5 / 关闭窗口时触发；如果用户：
     1. `/play/task-leave-home` 开始游戏 → 播放 BGM
     2. 点左上角 Logo 跳转 `/tasks`（React Router SPA，非硬刷新）
     3. BGM 的 AudioScheduledSourceNode 没收到 stop 命令 → 继续响
   - visibilitychange 事件（[#L251-L257](file:///Users/azq/asandstar/homemem-arena-web-demo/src/audio/audioManager.ts#L251-L257)）只在 tab 切后台时 suspend，**路由切换时不触发**，因此 SPA 跳转到首页时没有任何 stop 钩子。

3. **僵尸进程占用端口：** 如果 `kill -9` 之前的 server 时没有清干净 `node_modules/.vite/deps`，会存在 5173 端口占满但 Vite 日志不输出，导致用户认为"已经关掉"；**`lsof -iTCP:5173 -sTCP:LISTEN`** 是唯一可靠验证（之前已经暴露此现象）。

### 问题 3：只剩两关（预期至少三关，顺利五关）

**研究结论（数据对照）：**

1. **PUBLIC_LEVEL_ORDER 实际上 = 3 关**（[tasks/index.ts#L9-L13](file:///Users/azq/asandstar/homemem-arena-web-demo/src/data/tasks/index.ts#L9-L13)）：
   ```ts
   ['task-clean-table', 'task-leave-home', 'task-laundry-sort']
   ```
2. **为什么只看到两关？** 原因在 `isLevelUnlocked` 的解锁逻辑（[progressSlice.ts#L133](file:///Users/azq/asandstar/homemem-arena-web-demo/src/store/slices/progressSlice.ts#L133)）：
   - L1 `task-clean-table` 默认解锁
   - L2 `task-leave-home` 需要 L1 completed
   - L3 `task-laundry-sort` 需要 L2 completed
   - 用户如果清了浏览器 localStorage / 首次启动 / QA 跑过全量 reset：progress 被 wipe → 只剩 L1 可见，**TaskSelectPage 会把未解锁的卡片灰掉但不会渲染成卡片**（[TaskSelectPage.tsx#L152-L154](file:///Users/azq/asandstar/homemem-arena-web-demo/src/pages/TaskSelectPage.tsx#L152-L154) 渲染所有三张，但是 `ArenaPage.tsx#L99-L112` 里 DEV 环境会自动把所有 public level 都 unlock，这个只在进入 ArenaPage 时触发，不是全局生效）。
3. **五关恢复：** `HIDDEN_TASK_IDS = ['task-breakfast', 'task-night-patrol']`（[index.ts#L16](file:///Users/azq/asandstar/homemem-arena-web-demo/src/data/tasks/index.ts#L16)），产品记忆里明确写了「隐藏任务 breakfast/night-patrol 应继续隐藏」，**本轮不建议直接恢复**；先以稳定 3 关（L1=L2=L3 都能进）为准，5 关作为可选项需用户明确批示。

### 问题 4：能加载模型但还是旧的（最近下载的新模型没被用）

**研究结论：**

- 问题 4 在此轮研究的前半段已解决（见上轮 TodoWrite K1-K5 验收证据）。
- **根因：** Vite 服务器启动命令没有带 `VITE_USE_KENNEY_LIVING_ASSETS=true`。代码在 [Room3D.tsx#L45-L54](file:///Users/azq/asandstar/homemem-arena-web-demo/src/components/arena3d/Room3D.tsx#L45-L54) 显式要求 `flag === 'true' || flag === '1'`。
- **网络证据：** 重启带 flag 后 browser_network 日志的第 69、70、78、79、80 号请求确认 `televisionModern.glb`、`bookcaseOpen.glb`、`loungeSofa.glb`、`tableCoffee.glb`、`cabinetTelevision.glb` 全部 `type=Fetch`。
- 用户本次截图是 **clean-table（L1，厨房 / 餐厅）** 场景，不是 Living（客厅），L1 的家具目前**还没有接入 Kenney GLB 模型**（WP0A 只覆盖 Living 的 5 件核心家具；餐厅和厨房家具仍是旧程序化），所以用户截图中看到"碗、杯子、盘子"仍是 box+cylinder 几何体是**预期**，与 feature flag 无关。
- **机器人诊断报告奇怪：** 相关代码在 [analyzeSession.ts#L227](file:///Users/azq/asandstar/homemem-arena-web-demo/src/ai/analyzeSession.ts#L227) `generateRobotDiagnosis()`，结合之前 BUGFIX MODE 的 SyntaxError 会导致 analyzeSession 读取 session.observations 为 undefined → 输出拼接成"奇怪"的中文串。修复 SyntaxError + ProbePage 无限循环后会自动改善；若仍不自然，再独立做 NLP 风格调校。

### 问题 5：房间布局合理性 + Minimap 建议

**研究结论（当前实现代码对照）：**

1. **当前 Minimap 覆盖内容（[Minimap.tsx#L85-L88](file:///Users/azq/asandstar/homemem-arena-web-demo/src/components/arena3d/Minimap.tsx#L85-L88)）：**
   - roomsToShow：根据 taskRooms（来自任务的 roomsToRender）决定渲染哪些房间
   - observedObjects：来自 game store，已被玩家观察过的物体 id 会显示
   - robotPosition / robotRotation：玩家位置+朝向点
   - memorySlots：3 个记忆槽保存过的位置
2. **布局合理性（clean-table 截图视觉对照）：**
   - 截图显示厨房有桌子（餐具摆放）、洗碗机、垃圾桶、餐具架，功能基本齐全
   - 但问题：① 门在画面顶部（距离玩家 ~15m），玩家在桌子旁，二者之间没有走道边界标记；② 垃圾桶与洗碗机距离过近（视觉上 < 1m），玩家放洗碗机可能误触发垃圾桶；③ 墙上没有物品挂载 hook
3. **「应该放哪些到右上角 Minimap」建议（本轮不实现，只列需求供后续做）：**
   - **必须元素：** 当前房间边界线 + 房间名（L1 厨房/餐厅）+ 门（蓝框 + 绿色门条）+ 玩家位置/朝向 + 3 个记忆槽点 + 任务目标物品的"保存过/未保存"状态（用 ✓/空 区分）
   - **重要元素：** 关键容器的高亮圆（tray/洗碗机/垃圾桶，因为 clean-table L1 主要任务是放容器）+ 当前朝向箭头
   - **nice to have：** 已保存过记忆的物体会显示一个绿色小圆 + 记忆类型颜色（位置/颜色/数量/顺序/名字）
   - **不建议放：** 非关键装饰（rug、pillow 等），因为 minimap 已经 260×260，塞太满看不清
   - 之前 A1.5 研究中 Minimap 有 DEBUG/PLAYER 双模式定义，PLAYER 模式已经排除 relocated keys/hidden items，本轮只是让默认更贴近 L1/L2/L3 的任务目标，不是改 schema。

---

## 二、本次修复严格边界（允许 / 禁止）

### 允许修改的文件（白名单）

| 文件 | 修改原因 | 允许的改动范围 |
|---|---|---|
| `src/audio/audioManager.ts` | import.meta SyntaxError（L275）+ cleanup 钩子 | ① L275 的 `import.meta.env` 改为带 try/catch + typeof window 守卫；② 在 App 级暴露 SPA 路由跳转的 cleanup API（`stopAllAudioOnRouteLeave()`） |
| `src/components/AudioInitializer.tsx` | useEffect 缺 cleanup，AudioContext 泄漏 | ① 补返回 cleanup（调用 audioManager 暴露的 stop 函数）；② 如果组件卸载则立即 suspend/resume 行为一致 |
| `src/pages/ProbePage.tsx` | 同步 setState → navigate → 无限循环 | ① 自动答题/跳转的逻辑外包到微任务（setTimeout 0）避免同步 re-render；② 加 `answeredRef` 守卫保证只跑一次；③ import.meta.env 守卫加 try |
| `src/store/slices/progressSlice.ts` | L3 默认锁定导致「只剩两关」 | ① 首次启动（无 levelProgress localStorage 记录）时，给 PUBLIC_LEVEL_ORDER 所有 id 都 unlock（即三关默认都可直接进入），不要求逐级解锁 |
| `src/pages/TaskSelectPage.tsx` | 未解锁卡片视觉不清晰导致误以为「不存在」 | ① 对 locked 的任务不灰掉不渲染；改显示「🔒 + 完成前一关解锁」的明确占位卡片；② 卡片总数恒等于 PUBLIC_LEVEL_ORDER.length（3），不会让用户误以为只有 2 关 |
| `src/components/arena3d/models/ModelAsset.tsx` | gltfSilentError monkey-patch 触发 ErrorBoundary 自激循环 | ① 给 `console.error` patch 增加 `_inGltfSilent_` 重入 guard，避免 React ErrorBoundary 的 print 被再次拦截而触发 setState |

### 本轮**严禁修改**的文件/范围（和 WP0A / P2 禁令对齐）

- ❌ `src/data/tasks/*.ts`、`src/data/rooms.ts`、`src/data/decorFurniture.ts`（任务/房间/家具数据）
- ❌ `src/game/*`（游戏逻辑 / placement / scoring）
- ❌ `src/store/slices/taskSlice.ts`、`flowSlice.ts` 等 progress 外的 state
- ❌ Kenney 模型新增餐厅家具 / 下载新 GLB / 改 L1/L3 模型（本轮不做，WP1 才考虑）
- ❌ breakfast / night-patrol 两关自动 public（产品记忆明确要求：继续隐藏）
- ❌ 任何 Scene3D Canvas camera / light / position 调整
- ❌ Minimap 布局/渲染逻辑改动（本轮只输出"建议清单"文字，不改代码）
- ❌ 机器人诊断文案的模板句改写（先修好 SyntaxError/无限循环再评估）
- ❌ commit / push（本轮修完只做本地验证，Gate 全过后再整理独立提交）

---

## 三、具体修复步骤（6 个子包，按依赖顺序）

### 子包 A：import.meta SyntaxError 全局修复

**目标：** 把 3 处直接使用 `import.meta.env` 的非模块顶层 IIFE（尤其是 audioManager 的 lifecycle hook 和 ProbePage 的顶层守卫）加防御，确保：
- 即使被 Vite 转成 non-ESM 上下文，也不会抛 SyntaxError
- 即使被 ErrorBoundary 重打印，也不会触发「非模块」的 SyntaxError 上抛

**步骤：**

1. **audioManager.ts#L274-L283：** 把
   ```ts
   const isDevOrE2e = !!import.meta.env.DEV || import.meta.env.MODE === 'e2e'
   if (isDevOrE2e) { ... }
   ```
   改写为
   ```ts
   let isDevOrE2e = false
   try {
     const env = (import.meta as any)?.env
     isDevOrE2e = !!(env?.DEV || env?.MODE === 'e2e')
   } catch { /* Vite/ErrorBoundary 错位时忽略 */ }
   if (isDevOrE2e) { ... }
   ```
2. **ModelAsset.tsx#L178 IIFE：** 顶部加 try/catch 包裹整个 IIFE；万一 `import.meta` 被 Vite 转坏，不会把 SyntaxError 带到 Runtime
3. **ProbePage.tsx#L29：** `import.meta.env.PROD` 同样包 try/catch + typeof 守卫

**验收断言：**
- 控制台不再出现 `SyntaxError: Cannot use 'import.meta' outside a module`
- ProbePage 组件 render 时 console 0 error
- AudioInitializer 挂载时 Console 0 error（含 HMR）

### 子包 B：console.error monkey-patch 重入防护 → 斩断 ProbePage 无限循环

**步骤：**
1. [ModelAsset.tsx#L183](file:///Users/azq/asandstar/homemem-arena-web-demo/src/components/arena3d/models/ModelAsset.tsx#L183) 的 `gltfSilentError` 加 `_calling` 重入 guard：
   ```ts
   if ((console as any)._gltfSilentCalling) return orig(...args)
   ;(console as any)._gltfSilentCalling = true
   try { orig(...args) } finally { (console as any)._gltfSilentCalling = false }
   ```
2. 确保 react-stack-bottom-frame / DefaultErrorComponent 打印的任何错误不会因为这个 patch 而被再拦截（因为再拦截 = 调用 orig = console.error wrapped = ErrorBoundary 又 catch → 循环）。

**验收断言：**
- 手动打开 `/probe/task-clean-table`（没有 session 应该直接跳 tasks）不会卡死
- 从 ArenaPage 正常做完 L1 走到结果页，probes 自动填完跳 result 的流程无 Maximum update depth

### 子包 C：SPA 路由级音频泄漏修复 + 双套声音排查脚本

**步骤：**
1. **AudioInitializer.tsx：** 把 useEffect 改为返回 cleanup：
   ```tsx
   useEffect(() => {
     initAudioEnabled(audioEnabled)
     const cleanup = ensureGlobalPageLifecycleAudioHookOnce()
     return () => {
       // 组件卸载（= App 根销毁时）停止所有音频 + 关闭上下文
       try { (window as any).__HARD_STOP_AUDIO__?.() } catch {}
       cleanup()
     }
   }, [audioEnabled])
   ```
   （注：如果 ensureGlobal 返回的 cleanup 是 singleton cache，第二次调用是 noop，没问题）

2. **新增路由跳转 stop hook（在 App.tsx 里）：**
   - 利用 react-router-dom 的 `useLocation`，当 `location.pathname` 从 `/play/*` 变为非 `/play/*` 时，调用 `stopAllAudioImmediate()` + `suspendAllAudioContextsImmediate()`，从根源解决"跳回首页 BGM 还在响"

3. **提供一个 kill-vite-servers 命令别名：** 在 package.json 新增 `"stop:all": "killall -9 node 2>/dev/null; true"`（不强制执行，只是作为文档；执行与否用户决定）

**验收断言：**
- 在 `/play/task-clean-table` 里（应有 BGM/环境声）按 Logo 点回 `/`
- 2 秒内所有 BGM 停止（可用 console 中查 AudioContext.state 验证 suspended）
- 开 5173 tab 时没有 5174 声音；`lsof -iTCP:5173 -iTCP:5174` 仅 5173 监听（用户自己核对）

### 子包 D：默认解锁所有 3 公开关卡 + 未解锁占位卡片

**步骤：**
1. **progressSlice.ts#L53** `loadProgress()` 返回值：如果 localStorage 中 `levelProgress` 为空（即首次启动），为 PUBLIC_LEVEL_ORDER 的每个 id 注入 `{ unlocked: true, completed: false }`，**不再逐级锁**（符合"至少三关可玩"的产品印象；真实解锁只在生产发布前改回即可，用一个 `FORCE_ALL_UNLOCKED_IN_DEV` 守卫）
2. **TaskSelectPage.tsx：** 当前代码是不管 `unlocked` 与否都 render card，但视觉上 `unlocked=false` 时卡片颜色灰掉 → 用户可能误以为卡不存在。本轮改成：
   - `unlocked=false`：加 overlay "🔒 完成前一关可解锁（DEV 模式默认已全部解锁）"
   - 保证 `publicTaskTemplates.length === PUBLIC_LEVEL_ORDER.length`，不会因空 progress 导致"只剩两关"

3. **验证 3 关都能进：** 不打游戏的情况下直接点 L1 / L2 / L3 任意卡片 → 直接进入 ArenaPage（briefing 弹窗可看），不 redirect 回 `/tasks`

**验收断言：**
- 首次启动（清 localStorage 的 `levelProgress` 键）后 `/tasks` 页面一定渲染三张任务卡片，每张都可点击进入
- PUBLIC_LEVEL_ORDER.length === TaskCard count（严格数 3）
- L2 leave-home（旗舰关）无需先打 L1，可直接进入 playing

### 子包 E：新模型"没用上"的 UI / 文档澄清

本轮**不改代码**，仅在结果页 / 文档中说明，但必须执行以下两个**验证脚本**（用户之前在 L1 看不到 Kenney，以为没加载成功，需要在浏览器侧给一个硬性证明）：

1. **验证点：** 在 `/play/task-leave-home?assetCalibration=1` 校准视图中，确实能看到 5 个 Kenney 家具并排显示（loungeSofa/tableCoffee/televisionModern/cabinetTelevision/bookcaseOpen）
2. **验证点：** 进入 playing 场景后，Living 客厅玩家可见的 5 个家具，其 `<group>` 的 child.name 分别等于 `loungeSofa/tableCoffee/televisionModern/cabinetTelevision/bookcaseOpen` 的 scene 名（可通过 browser evaluate `scene.traverse` 获取）
3. **澄清文档：** 告知用户"当前 Kenney 模型只覆盖 Living 客厅；L1（clean-table，厨房/餐厅）和 L3（laundry-sort）的程序化旧家具**是预期**；L2（leave-home）的 Living 是唯一用 Kenney 的子场景"

### 子包 F：Minimap 内容需求清单（本轮只写文字，不实现）

在本计划文件末尾的"F 节：Minimap 升级需求清单（不实现，作后续规划输入）"中输出以下三部分：
1. L1 / L2 / L3 分别"必须显示"的容器、物体、门
2. 已保存记忆 vs 未保存记忆的可视化方案（颜色 / 大小 / 形状）
3. 当前 Minimap 的优先级（按产品记忆：「近期优先级必须服从：运行稳定 > 视觉/碰撞/交互一致 > 房间布局真实性 > L2 核心认知闭环 > 关键模型美术 > 结果页解释 > 新增内容」，所以 minimap 排 < L2 核心认知闭环，本轮不做）

---

## 四、QA 与通过标准

### 自动化验证（必须全绿）

```
npm run lint      # oxlint，0 error
npm test          # vitest run，all pass
npm run qa:static # tsc --noEmit
npm run build     # vite build，无 warning 无 SyntaxError
```

### 浏览器手动验收（Chrome 最新版本，端口 5173，VITE_USE_KENNEY_LIVING_ASSETS=true）

| # | 步骤 | 预期 | 验证方法 |
|---|---|---|---|
| 1 | 清 localStorage → 开 `/tasks` | 3 张卡片，每张可点击（含 Laundry L3），无🔒灰卡看不到的情况 | 肉眼数卡片数 + DOM query selectorAll('.task-card') 长度 3 |
| 2 | 点「出门大作战（L2）」→ start task | 不跳回 tasks；Console 0 error；**无 SyntaxError import.meta** | DevTools Console Filter Error + 搜关键字 |
| 3 | L2 playing 5 秒后截图，Canvas 中央区域 whitePixelRatio < 30%，pixelVariance > 200 | 非白屏，Living 有可见的 Kenney 家具（电视柜/电视黑色块+深蓝条可见） | Canvas getImageData 采样 |
| 4 | L2 playing 中点 Logo 跳转首页 | 1 秒内所有 BGM / SFX 完全停止；无 ghost 音 | 耳朵听 + AudioContext.state === suspended（evaluate） |
| 5 | 打完 L1 clean-table 自动进入 ProbePage → 跳转 Result | 无 Maximum update depth exceeded；Result 页加载正常 | Console 搜 update depth |
| 6 | 开两个 tab 分别进入 L1/L2 → 关其中一个 tab | 另一个 tab 的声音保持正常；关闭的 tab 不再出声 | 肉眼/耳朵 |
| 7 | `/play/task-leave-home?assetCalibration=1` | 5 个 Kenney 模型并排可见，无 GLB 404 | Network 面板 + 截图对比 |

### 回滚方法（任一验收失败）

- 所有改动集中在 6 个文件（子包 A-E 白名单），失败时单个子包可通过 `git checkout HEAD -- <file>` 精确回滚
- 音频部分（子包 C）如果引入新 bug，只需 `git checkout HEAD -- src/components/AudioInitializer.tsx src/audio/audioManager.ts` 即可恢复
- 进度解锁（子包 D）若影响 E2E：`git checkout HEAD -- src/store/slices/progressSlice.ts src/pages/TaskSelectPage.tsx`

---

## 五、工作量与 commit 边界（不 push，仅整理）

- 预计总修改：≤ 250 行新增/修改，6 个文件
- 验证时长：40 min（自动化 10 min + 浏览器 30 min）
- **提交边界（用户审批后执行，本轮 NOT PUSH）：**
  - commit1: `fix(audio/import): SyntaxError guard + cleanup on unmount + SPA route stop`
  - commit2: `fix(probe): break sync setState loop + add answeredRef`
  - commit3: `fix(levels): unlock all 3 public levels in fresh progress`
  - commit4: `docs(minimap): upgrade requirement list (NOT IMPLEMENTED)`
- **push boundary：** 以上 4 commit 全验通过 + 用户点头 + GitHub Pages 烟雾通过 → 再 push main（对齐项目记忆："未达到可运行状态不得 push"）

---

## 六、F 节：Minimap 内容建议（本轮文字输出，不实现）

### F.1 三关核心"必须显示"的元素

| 关卡 | Minimap 必显 | 备注 |
|---|---|---|
| L1 clean-table | 厨房区域边界（冰箱/水槽/洗碗机/灶台）+ 餐厅桌边界 + 6 件物体位置（2 杯 1 碗 2 盘 1 牛奶盒）+ 洗碗机容器圈 + 垃圾桶容器圈 + 餐具架容器圈 + 门 | 容器是 L1 核心，必须高亮 |
| L2 leave-home | Entrance（entrance_tray + 鞋架 + 门）+ Living（沙发/茶几/电视柜/电视/书架）+ Bedroom（床/衣柜）+ 3 个钥匙点位 + 手机、雨伞位置 | L2 旗舰关，地图信息量最大；门条颜色区分"可开/未开" |
| L3 laundry-sort | Laundry 房间边界 + 洗衣机 + 晾衣架 + 脏衣篮 + 干净衣堆 + 门 | 只需要 4 个关键区域，不必显所有衣服 |

### F.2 已保存记忆 vs 未保存的视觉方案

| 状态 | 视觉编码 | 理由 |
|---|---|---|
| 未观察 + 未保存 | 不显示（或极小的灰色点） | 玩家没有"应该看到"的语义，避免剧透 |
| 已观察但未保存 | 空心小圆（颜色 = 记忆类型：位置=绿 / 颜色=红 / 顺序=蓝 / 数量=黄 / 名字=紫） | 告诉玩家"注意这个！我能记住它" |
| 已保存记忆 | 实心小圆 + 上面一个 ✓ 小勾（同类型色）+ 与记忆槽号连线 | 这是 ResultPage 认知时间线的核心信号 |

### F.3 Minimap 工作优先级与 Gating

按当前产品优先级（**运行稳定 > 视觉/碰撞一致 > 布局真实性 > L2 核心认知闭环 > 关键模型美术 > Result 页解释 > 新增内容**）：

- Minimap 增强属于"新增内容 / Result 页解释上游"，优先级**低于** SyntaxError（P0）、音频泄漏（P0）、三关解锁（P0）、Kenney 模型接入 WP1（P1），因此本轮**只出文字需求不实现**。
- 在 SyntaxError + Audio + 关卡数 + 无限循环 四个 P0 修完前，禁止任何 Minimap 代码修改。
