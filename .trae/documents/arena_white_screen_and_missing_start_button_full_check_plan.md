# Arena「白屏 + 无开始任务按键」全面检查与修复计划

<!-- 用户最开始原话："为什么在对话的时候后面是白的，加载模型失败呢？" -->
<!-- 二次反馈："/plan 还是没解决，而且并没有什么开始任务的按键，请你全面检查一下" -->

## 1. Repo Research 结论（本轮修复前真实代码状态）

### 1.1 问题 A：开始任务按钮**永不渲染**（核心真凶）

文件：[ArenaPage.tsx L282-L288](file:///Users/azq/asandstar/homemem-arena-web-demo/src/pages/ArenaPage.tsx#L282-L288)

```tsx
if (!task) {
  return (
    <div className="flex-1 flex items-center justify-center">
      <p className="text-text-muted">加载中...</p>
    </div>
  )
}
```

紧接着后面 L290 才是真正的 `return (ArenaPage main JSX)`，而 `briefing-modal`（开始任务按钮）位于 **L321-L396**，位于 `L290 的 return` 内部。

→ 因此只要 `task === null`，整个 briefing modal 连同 Scene3D、HUD、DialogBox **全部被提前 return 跳过**，用户当然看不到"开始任务"按钮，只能看到一个居中的"加载中..."文字。

### 1.2 问题 B：`initializeTask` 执行了，但没有把 `task` 同步到 React 渲染树

`ArenaPage L146-159` 的初始化 effect：
```ts
useEffect(() => {
  if (!taskId || !getTaskById(taskId)) {
    navigate('/tasks', { replace: true })
    return
  }
  // ... 
  setBriefingOpen(true)
  initializeTask(taskId)
}, [taskId, location.key, initializeTask, navigate, closeDialog])
```

- `initializeTask(taskId)` 是 `store.setState({ task: <actual-task> })`（`taskSlice.ts L149-258`）的同步调用
- 但是 `ArenaPage` 里 `const { task, phase, ... } = useGameStore()` 的 select **应该** 立即触发 rerender
- 若 getTaskById(taskId) 返回了非空，却仍然停留在 `if (!task)` 分支，有 3 种可能性：
  1. `useGameStore` 的 select 没有正确订阅（zustand 选择器浅比较 + 多值解构时不稳定引用导致丢失 rerender，需要 shallow）
  2. `initializeTask` 内部抛异常/提前 return（`taskSlice L152 if (!task) return` 走了）
  3. `location.key` 变化触发的重复清理循环（setBriefingOpen → initializeTask 触发 rerender → location.key 没变？但 React.StrictMode 双调用）

### 1.3 问题 C：`briefingOpen && task` 的双重 AND 条件下 briefing modal 不可能在 task 准备好之前作为骨架兜底

因为 L282 先 `return (加载中...)`，所以即使 briefing modal 想作为"task 加载中的骨架 UI"展示，也永远没机会走到。

### 1.4 问题 D：上一轮「Scene3D 背景修复」没机会运行

我上一轮对 Scene3D 的修复（L3 `<color attach=background>`、L162 `!task` 先渲染客厅）只在 `L290` 的 main return 之后才会运行。但 **L282 提前 return 了，所以这些修复根本不会执行**——这就是为什么用户说"还是没解决"。

### 1.5 问题 E：为什么用户能看到"对话"（dialogState.isOpen === true）但看不到开始任务按钮？

场景再现（最可能的路径）：
1. 第 1 次进入 URL `/play/task-clean-table` → `initializeTask` 运行，task 变为非 null，briefing modal 渲染，用户点"开始任务" → `setBriefingOpen(false)`、`startPlaying()` → `phase = 'playing'`
2. 此时 `L76` 的 useEffect 条件 `phase === 'playing' && task && !briefingOpen` 满足 → `triggerDialog('start', task.id)` 触发对话气泡
3. 用户刷新页面（或 React Router 重新挂载），**zustand 全局 store 没有清空**（不是持久化，只是同一页面生命周期内残留），但 React 组件的 `useState(true)` briefingOpen 是组件内的局部状态，刷新后重置回 true
4. 新挂载触发 `initializeTask(taskId)` — 但在同步更新 React 状态的间隔（几毫秒），用户此时看到的是：`phase === 'playing' (store 残留) && task 先为 null`，L76 不触发，但 dialogState 是 useDialog hook 管理的？
5. 另一种更简单的解释：`dialogState.isOpen` 可能在 useDialog 初始化时默认就是 open，或 taskSlice 有脚本教学事件在 phase=briefing 阶段就直接 open 了 dialog，根本不等 briefing 关闭

### 1.6 问题 F：Playwright 测试为何通过但用户体验坏？

因为 `tests/e2e/helpers.ts L110-150 navigateToTaskAndStart` 里面直接 `window.__testApi__.startPlaying()` 或 `data-testid=briefing-start-button click()`，Playwright 的 WebServer 是全新进程，**没有 zustand 残留问题**，所以总是能成功。但真实用户在同浏览器 tab 中经历多次 task 切换、刷新、strict mode 双调用，环境完全不同。

---

## 2. 要修改的文件 & 模块

| # | 文件 | 改动原因 |
|---|---|---|
| 1 | `src/pages/ArenaPage.tsx` | ⭐⭐⭐ 主战场：修掉 L282 提前 return → briefing modal 永远显示不出来；合并 loading 分支与主 JSX |
| 2 | `src/store/useGameStore.ts` | 验证 useGameStore 的 create + 是否有 persist 等；必要时给 task/phase/initializeTask 加 rerender 稳定性 |
| 3 | `src/store/slices/taskSlice.ts` L149 `initializeTask` | 加 try/catch + console，提前记录 initializeTask 到底在哪一步失败；确保 state.task 真的被 set |
| 4 | `src/components/arena3d/Scene3D.tsx` | L162 `!task` 先渲染客厅逻辑（已加但被 ArenaPage 截断）+ 确保 `<color attach=background>` 生效 |
| 5 | `src/dialog/useDialog.ts` | 确认 dialogState 初始值；禁止 phase=briefing 时自动弹出教学对话（避免 briefing 按钮被 Dialog 挡在后面看不见） |
| 6 | `tests/e2e/clean-table-command-flow.spec.ts` 或新增 smoke | 新增严格首屏烟测：首次进入必须有 briefing-start-button 可点击、3D canvas 有深背景色、task 初始化 <1s |

---

## 3. 修改步骤（细粒度）

### 阶段一：移除「L282 if (!task)」提前 return，改为渐进式渲染

**关键原则：briefing modal 无论 task 是否 null 都能渲染（在 task 为 null 时按钮禁用），Scene3D 和 Canvas 始终在 DOM 里。**

1. **删除 ArenaPage.tsx L282-L288 的提前 return**
2. 在 L290 main return 内部，做以下分支：
   - **场景容器（absolute inset-0 的深蓝底 + Suspense + Scene3D）：始终渲染**，不用管 task 是否 null
   - **HUD：仅当 task 非 null 时渲染**（HUD 内部也依赖 task，空时可能 crash）
   - **briefing-modal：L321 `{briefingOpen && task && (...)}`** 改为 `{briefingOpen && (<div> ... task ? (主内容) : (<骨架 Loading state="任务数据初始化中...">) </div>)}`
     - 「开始任务」按钮默认禁用（`disabled={!task}`），文案改为 `"开始任务（准备中...）"` ，当 task 就绪后自动变成"开始任务"可点击
     - 保证 briefing 浮层始终出现在用户面前，不会像现在一样消失
   - **叙事弹窗、结算弹窗、对话弹窗 DialogBox：条件保持不变**（都依赖 !briefingOpen）

### 阶段二：确保 initializeTask 不静默失败

3. **改造 `taskSlice.ts L149 initializeTask(taskId)`**
   - 开头：`const orig = Date.now()`，在每个可能的提前 return 点（L152 等）加 `console.warn('[initializeTask] ABORT at XXX:', ...)`
   - 加外层 `try { ... } catch (e) { console.error('[initializeTask] FATAL:', e); }` 包住整段
   - 末尾（setState 后）立刻验证：`const verify = get().task; if (!verify || verify.id !== taskId) console.error('[initializeTask] state.task NOT SET after init')`
4. **useGameStore 选择器浅比较**
   - 当前写法：`const { task, phase, ... , initializeTask } = useGameStore()`（多值解构不带 shallow）
   - 改成 `import { shallow } from 'zustand/shallow'` + `useGameStore(s => ({ task:s.task, phase:s.phase, ... initializeTask:s.initializeTask }), shallow)` 避免每 tick 都 rerender + 丢失必要的更新

### 阶段三：禁止 DialogBox 挡住 briefing 开始按钮（互斥）

5. **`ArenaPage.tsx L538` DialogBox 的渲染条件**改为：
   ```tsx
   {dialogState.isOpen && currentNode && !briefingOpen && (...)}
   ```
   加 `!briefingOpen` —— briefing 打开时教学对话不应该出现（这与 L76 的 triggerDialog 守卫保持语义一致，避免出现"briefing modal 没看到，DialogBox 挡在前面，用户在后面找开始任务按钮找不到"的情况）

### 阶段四：首屏骨架 Loading 一致化

6. 当 `!task` 时，统一在 3 处显示对应的骨架 Loading，不能各写各的文字：
   - briefing modal 内部卡片：`任务数据初始化中...` + 转圈按钮
   - Suspense fallback（Scene3D）：已有的"3D 场景加载中..."（保持不变）
   - 不能再有一个"独立居中的加载中..."在最顶层把整个页面盖掉（就是原来的 L282-288）

### 阶段五：Scene3D !task 时的场景预渲染验证

7. 确认 Scene3D.tsx L162 分支：`!task → return [sharedRooms.living]` 能独立运行而不依赖 task。
   - Room3D 会不会读取 task.containers 里的东西？检查 [Room3D.tsx](file:///Users/azq/asandstar/homemem-arena-web-demo/src/components/arena3d/Room3D.tsx) 里的所有 props 来源：它只接受 `spec: RoomSpec`（来自 sharedRooms），不读 task，**安全**
   - entities/containers 已在上一轮用 `{task && ...}` 包好了，**安全**

### 阶段六：QA 烟测新增 + 旧测试不变

8. **新增首屏严格烟测用例**（新 smoke 文件或在现有的 arena-smoke.spec.ts）：
   - `goto('/play/task-clean-table')`
   - `waitForSelector('data-testid=briefing-start-button')`，最长 wait 2s
   - 点击它（不能 force，必须是真的可点击）
   - 等待 `briefing-modal hidden`，等待 `getByTestId('arena-hud') visible`
   - evaluate：`document.querySelector('div#arena-canvas canvas')` 存在，canvas.__r3f.state 存在，scene.children ≥ 1
   - 必须 **0 console [error]**（glb ERR_ABORTED 算 warning 不算 error 或单独 filter）

---

## 4. 潜在依赖 / 注意事项

1. **React.StrictMode 双调用**：`initializeTask` 会被连续调用两次。MODEL_TEXTURE_CACHE（ModelAsset.tsx）是全局 Map，double-call 时第一次的 promise 已经 cache 在里面，第二次直接拿同一个 promise，安全。但 store 的重置可能有问题 — 需要 verify initializeTask 被重复调用时保持幂等。
2. **zustand shallow 引入**：当前 package.json 里有没有 zustand v4 的 shallow？检查 `package.json → zustand 版本`。若 ≥ 4，`zustand/shallow` 是官方子路径 export；若版本老则需要写 `shallow` 单独实现。
3. **DialogBox 互斥后会不会影响教学**：briefing 关闭后 `L76 useEffect` 马上 `triggerDialog('start', task.id)`，所以第一句教学对话不会丢，只是延后 50ms。
4. **`location.key` 触发重复初始化**：React Router 6 的 location.key 在同一 URL 时通常是 "default"，不会无限循环；但若 navigation-audio.spec 有 location.key 变化触发逻辑，需确保 setBriefingOpen(true) 只发生在真正切 task 时。

---

## 5. 风险处理

| 风险 | 严重度 | 处理方式 |
|---|---|---|
| 删除 L282 return 后，`task.containers` / HUD / ItemHint 里对 task 读属性的 NPE crash | 🔴 高 | 所有遍历 `task.goals / task.containers` 的地方都必须用 `{task && ...}` 包；或在 HUD/ItemHint 内部加守卫（已验证 HUD 有守卫？） |
| briefing 浮层出现后"开始任务"按钮禁用太长时间，用户以为卡死 | 🟡 中 | 禁用状态下按钮要"有动态反馈"：转圈 spinner 图标 + 灰色文字 + 1s 后若仍失败，弹 toast 提示"初始化失败，请返回任务列表重试"按钮，用户可手动回 /tasks |
| DialogBox !briefingOpen 条件加了后，之前 L1 / P1 教学流程会不会在特殊入口直接 skip 到 playing 没触发对话 | 🟡 中 | 特殊入口（如 testApi.startPlaying）在关闭 briefing 后仍会被 L76 useEffect catch 到，因为 phase=playing && !briefingOpen，所以没影响；但新增单元测试确保 startPlaying() 后 500ms 内有 dialogState.isOpen=true |
| initializeTask 加 console.error 后，Playwright 的 expectNoErrors 误判失败 | 🟢 低 | 用 `console.warn('[initializeTask] ...')` 而非 error，避免误杀；真正致命的才用 console.error；helpers.ts createErrorCollector 已允许 warn 通过 |

---

## 6. 验收标准（完成后必须逐条满足）

1. **Chrome 手动**：首次清缓存访问 `/play/task-clean-table`，1 秒内能看到 briefing 黄色便签（骨架或真内容），右下角"开始任务"按钮可见（禁用或可用）
2. **task 初始化后**：按钮变为可用的橙黄渐变；点击后 briefing 消失，Scene3D 显示深蓝底 + 房间，不会是白/灰透明
3. **DialogBox 对话**：briefing 关闭后（而非 briefing 期间）才弹出教学对话气泡，**绝不会挡住 briefing 开始任务按钮**
4. **刷新**：在 `briefing 未关闭`、`playing 中途`、`result 结算` 三种状态下分别刷新，都能重新看到 briefing 按钮，**不会出现"有对话但没有开始任务按钮"**
5. **Playwright 全部通过**：`clean-table-command-flow.spec.ts` 所有 9 条用例 0 失败；新增首屏烟测 0 失败
6. **tsc 0 error**，`npm run lint` 0 error
