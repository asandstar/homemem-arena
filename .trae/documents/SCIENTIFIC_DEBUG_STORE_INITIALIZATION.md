# 科学 Debug 计划：Store 初始化与关卡进入

## 问题背景

用户反馈：刷新后进关卡卡在"准备中"，控制台报 `[ARENA EFFECT #1 FATAL]`。**已反复修复多轮，每次修完暂时好转，很快又复现或换一种形式崩溃。**

## 为什么我们一直反复修同样的问题？（根因分析）

回顾整个修复链，问题不是技术难度，而是 **debug 方法的系统性缺陷**：

### 修复历史时间线（症状驱动的恶性循环）

| 轮次 | 症状 | 修复动作 | 引入的新问题 |
|---|---|---|---|
| R1 | MAX_DEPTH 死循环 | 引入 `withSafeSnapshot` 包装器 | selector 引用仍不稳定 |
| R2 | MAX_DEPTH 仍在 | v5: 用 `useCallback([])` 稳定 selector | remount 时 state 变 `{}`，action 全 undefined |
| R3 | `Cannot read properties of null` | 各页面加 `s?.field` null-safe | 只改了 2 个页面，其他 12 个文件没改 |
| R4 | `getState()` 返回 null | 加 `getGameState()` 绕过 | selector 路径仍然失败，remount 仍崩 |
| R5 | FATAL 还在 | 加重试逻辑 | 重试 10 次也没用，因为根因没解决 |

### 根本方法论问题

1. **症状驱动而非假设驱动**：看到报错就改报错那行，没建立"为什么会这样"的假设
2. **没有隔离变量**：同时改多个地方，无法确认哪个修复有效
3. **没有证伪思维**：只验证"修好了吗"，不验证"我的假设对吗"
4. **修复范围不完整**：102 处 selector 只改了 2 个页面的十几个，其余 80+ 处还是不安全写法
5. **没有回归基线**：每次修完没跑完整验证，不知道是否引入新问题

## 科学假设（3 个可证伪的假设）

### 假设 H1：`withSafeSnapshot` 的 `stableSelector` 是根因

**假设**：`withSafeSnapshot` 第 70-75 行的 `const safe = s ?? EMPTY`（`EMPTY = {}`）在 React Router remount 时，把 zustand 传来的 null/stale snapshot 替换成空对象 `{}`，导致所有 `s?.initializeTask` 返回 `undefined`。

**预测**：
- 如果 H1 为真，则在 ArenaPage remount 时，`stableSelector` 收到的 `s` 参数会是 null/undefined
- 如果 H1 为真，则直接调用 `_rawGameStore.getState()` 永远返回完整 state（133 keys），只有经过 wrapper 的 selector 路径才失败

**验证方法**：
- 在 `stableSelector` 内部加日志：`console.log('[H1] stableSelector input:', s === null ? 'NULL' : s === undefined ? 'UNDEFINED' : typeof s === 'object' ? `OBJECT(${Object.keys(s).length} keys)` : typeof s)`
- 进关卡 → 返回 → 再进关卡（触发 remount）
- 观察日志是否显示 `NULL` 或 `UNDEFINED`

**证伪条件**：如果 `stableSelector` 始终收到完整 state object（133 keys），则 H1 证伪，问题在别处。

---

### 假设 H2：完全移除 `withSafeSnapshot` 会导致 102 处 selector 崩溃

**假设**：当前 102 处 `useGameStore((s) => s.field)` 中，大部分没有 null-safe 写法（`s?.field`），如果移除 wrapper，在首帧 null 窗口期会崩溃。

**预测**：
- 如果 H2 为真，则移除 wrapper 后首次加载就会崩溃
- 如果 H2 为真，则崩溃点在那些 `s.field`（非可选链）的 selector 上

**验证方法**：
- 临时改 `export const useGameStore = _rawGameStore`（移除 wrapper）
- 打开首页 → 进关卡 → 观察是否崩溃
- 如果崩溃，记录崩溃的 selector 位置

**证伪条件**：如果移除 wrapper 后不崩溃（zustand v5 原生处理了首帧 null），则 H2 证伪，可以安全移除 wrapper。

---

### 假设 H3：zustand v5 原生 `useSyncExternalStore` 不会返回 null

**假设**：zustand v5 的 `create()` 返回的 store，其 `useSyncExternalStore` 实现 inistal snapshot 永远是 `createState()` 的返回值，不会是 null。当初的 "首帧 null" 问题是误判，真正的问题是 selector 引用不稳定（MAX_DEPTH），而非 snapshot 为 null。

**预测**：
- 如果 H3 为真，则移除 wrapper 后不会出现 "首帧 null"
- 如果 H3 为真，则 MAX_DEPTH 问题的正确解法是稳定 selector 引用（zustand v5 已内置处理），而非用 wrapper 替换 null

**验证方法**：
- 同 H2 的验证（移除 wrapper）
- 额外检查：是否有 MAX_DEPTH 报错

**证伪条件**：如果移除 wrapper 后出现 "Cannot read properties of null" 或 MAX_DEPTH，则 H3 证伪。

## 修复方案（基于假设验证后的方向）

### 方案 A：如果 H2/H3 证伪（移除 wrapper 安全）—— 推荐

```
1. useGameStore.ts: export const useGameStore = _rawGameStore（移除 withSafeSnapshot）
2. 保留 getGameState() / setGameState() 辅助函数
3. ArenaPage/TaskSelectPage 的非 React 上下文用 getGameState()
4. 清除 Vite 缓存，验证 3 关都能进出
```

改动范围：1 个文件（useGameStore.ts），1 行代码
风险：低（如果 H2/H3 验证通过）

### 方案 B：如果 H2 成立（移除 wrapper 会崩）—— 保守

```
1. 保留 withSafeSnapshot，但修复 stableSelector：
   - 不再用 EMPTY={} 替换 null，而是让 null 直接传给 userSelector
   - userSelector 用 s?.field 已经能处理 null
2. 全量审计 102 处 selector，把 s.field 改成 s?.field ?? fallback
3. 非 React 上下文统一用 getGameState()
```

改动范围：14 个文件，102 处 selector
风险：中（改动量大，但逐个改可控）

### 方案 C：如果 H1 成立但不想动 wrapper —— 当前方案

```
1. 保留 withSafeSnapshot 原样
2. 所有非 React 上下文（useEffect、事件回调）用 getGameState()
3. React 上下文内 selector 全部 null-safe
4. ArenaPage tryInitialize 优先用 getGameState()
```

改动范围：渐进式，当前已部分完成
风险：高（治标不治本，wrapper 的其他潜在问题仍在）

## 实施步骤（方案 A 优先）

### Step 1: 验证假设 H2 + H3（5 分钟，只读验证）

**目的**：确认移除 withSafeSnapshot 是否安全

**操作**：
1. 临时修改 `useGameStore.ts` 第 344 行：`export const useGameStore = _rawGameStore`
2. 清除 Vite 缓存：`rm -rf node_modules/.vite`
3. 打开浏览器，进首页 → 进第一关 → 返回 → 进第二关
4. 观察控制台：
   - 有无 "Cannot read properties of null"？
   - 有无 MAX_DEPTH？
   - 关卡能否正常进入？

**判定**：
- 无崩溃 → H2 证伪，H3 成立 → 执行 Step 2（方案 A）
- 有崩溃 → H2 成立 → 执行 Step 3（方案 B）
- 有 MAX_DEPTH → H3 证伪 → 需要稳定 selector 引用（另开方案）

### Step 2: 如果 Step 1 验证通过 —— 移除 wrapper（方案 A）

**文件**：`src/store/useGameStore.ts`
**改动**：
- 第 344 行：`export const useGameStore = _rawGameStore`
- 保留 `getGameState()` / `setGameState()` 导出
- 移除诊断日志（已在上一轮加的）

**验证**：
- `npm run dev:stable`
- 3 关都能进出
- 控制台无 FATAL / null 错误
- 返回后再进不崩溃

### Step 3: 如果 Step 1 验证失败 —— 全量 null-safe（方案 B）

**文件**：14 个使用 `useGameStore((s) => s.field)` 的文件
**改动**：
- 所有 `s.field` → `s?.field ?? fallback`
- 非 React 上下文用 `getGameState()`
- 保留 withSafeSnapshot 但修复 `stableSelector` 的 EMPTY 替换逻辑

**验证**：
- 同 Step 2

### Step 4: 回归验证

1. `npm run lint` 通过
2. `npm test` 通过
3. `npm run build` 通过
4. 浏览器手动验证：
   - 首页 → 任务选择 → 进第一关 → briefing → 开始任务 → playing → 返回
   - 任务选择 → 进第二关 → 同上
   - 任务选择 → 进第三关 → 同上
   - 每关都做"进→返回→再进"验证 remount 不崩

## 为什么这次会成功（方法论改进）

1. **先验证假设，再改代码**：Step 1 只做验证，不做永久修改
2. **隔离变量**：每次只改一个东西，确认效果
3. **可证伪**：每个假设都有明确的证伪条件
4. **回归基线**：验证 3 关都能进出，不只是"不报错"
5. **根因修复**：移除问题源头（withSafeSnapshot），而非再加一层绕过

## 关键文件

- [safeStore.ts](file:///Users/azq/asandstar/homemem-arena-web-demo/src/store/safeStore.ts) — withSafeSnapshot 实现（第 48-146 行）
- [useGameStore.ts](file:///Users/azq/asandstar/homemem-arena-web-demo/src/store/useGameStore.ts) — store 创建 + getGameState（第 215-364 行）
- [ArenaPage.tsx](file:///Users/azq/asandstar/homemem-arena-web-demo/src/pages/ArenaPage.tsx) — 初始化 effect（第 263-337 行）
- [TaskSelectPage.tsx](file:///Users/azq/asandstar/homemem-arena-web-demo/src/pages/TaskSelectPage.tsx) — 解锁判断（第 74-89 行）
- [MAX_DEPTH_HOTFIX_plan.md](file:///Users/azq/asandstar/homemem-arena-web-demo/.trae/documents/MAX_DEPTH_HOTFIX_plan.md) — withSafeSnapshot 引入背景
