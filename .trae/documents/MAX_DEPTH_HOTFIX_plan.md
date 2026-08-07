# MAX_DEPTH_HOTFIX · React "Maximum update depth exceeded" 死循环修复计划

**日期**: 2026-08-07
**触发条件**: 打开任何一关（进入 ArenaPage 路由）立刻崩溃，堆栈里有 `forceStoreRerender → updateStoreInstance → commitHookEffectListMount`，React 嵌套 setState 超深度限制。

## 1. 仓库溯源结论

### 1.1 症状解读

React 堆栈关键字：
- `commitHookEffectListMount` / `commitHookPassiveMountEffects`
- `updateStoreInstance` / `forceStoreRerender`
- `react_stack_bottom_frame`

这是典型的 **useEffect 订阅-清理-再订阅 循环**。React 发现 `useSyncExternalStore` 的订阅依赖在每次 render 时都变，导致它反复执行 useEffect（cleanup → mount → cleanup → mount），每轮都触发 `forceStoreRerender` → 又一次 render → 再变 → 又一轮，最终爆 1000 层嵌套深度。

### 1.2 高概率根因：`store/safeStore.ts` 的 `withSafeSnapshot` 每次 render 都 inline 创建新 selector

```ts
const wrapped = function (selector?, equalityFn?) {
  if (typeof selector !== 'function') {
    // ❌ 每次 render 都创建新匿名函数！
    return rawStore((s) => s ?? EMPTY, equalityFn)
  }
  // ❌ 每次 render 都创建新匿名函数！
  return rawStore((s) => selector(s ?? EMPTY), equalityFn)
}
```

zustand v4/v5 内部用的是 React `useSyncExternalStoreWithSelector`（from `use-sync-external-store` shim）。这个 hook 比较"上一次的 selector 引用"时，如果变了就会**重跑一遍订阅逻辑**，即便 selector 语义等价。每次传入新的 selector function → 认为"订阅变了 → 需要取消旧订阅 + 新建订阅" → 触发 useEffect cleanup + mount → 触发 `forceStoreRerender` → 新 render → selector 又变 → 无限循环。

这种"selector 引用不稳定"在 zustand v4 里对用户的 inline selector 也会发生，但 zustand 本身在内部用 `useMemo` 包了 selector 的调用，不会无限循环。问题是我们在**外层再包一层**又新建了一层匿名函数，这个最外层函数引用每次都变，绕过了 zustand 的内部 memo。

### 1.3 佐证

- 上一轮（commit `162a610` 引入 withSafeSnapshot）之前 **没有** 这个 MAX_DEPTH 报错。
- 崩溃 100% 复现：任何一关（甚至首页）打开就炸，只要路由懒加载导致挂载 useXxxStore 订阅就行。
- 153 处 store hook 调用点（22 个文件），一旦 wrapper 有问题就是全站范围爆，符合现状。

### 1.4 回滚验证思路

把 4 个 store 从 `export const useXxx = withSafeSnapshot(_rawXxx)` 改回直接 `export const useXxx = create<XState>(...)`，跑起来看死循环是否消失。消失 → 100% 确认 wrapper 根因。

---

## 2. 修改文件 & 模块

### 必须改的文件

| 文件 | 修改内容 |
|---|---|
| `src/store/safeStore.ts` | **重写 `withSafeSnapshot`**：用 `useMemo` 缓存合成的 selector，保证 selector 引用稳定；"无 selector 场景"改回 zustand 原生 identity 路径不包新函数。 |
| `src/store/useGameStore.ts` | 阶段 1：暂时回滚为原始 create 直接导出，确认死循环消失。阶段 3：恢复 rawStore + 新 withSafeSnapshot 导出。 |
| `src/store/useSessionStore.ts` | 同上。makeSafeGet 应用于 create 回调的 get 参数保留（无副作用）。 |
| `src/store/useToastStore.ts` | 同上。 |
| `src/store/useUiStore.ts` | 同上（含 persist 中间件）。 |

### 潜在次要排查（仅阶段 1 回滚后死循环仍存在时）

| 文件 | 排查点 |
|---|---|
| `src/components/arena3d/Scene3D.tsx` | useFrame RAF 循环里是否调了 zustand setState 且无 guard，导致每帧 setState → 订阅组件 rerender → RAF 继续跑 → 又 set。 |
| `src/store/useUiStore.ts` L139-149 | `persist.onRehydrateStorage` 回调里是否在 persist 内部 setState 期间又外部 `setAudioEnabled` → 触发 rehydrate 副作用循环。 |
| `src/dialog/useDialog.ts` | 是否在 render 里直接调 `addScore`（纯函数变副作用）。 |

---

## 3. 执行步骤

### 阶段 1：紧急回滚 wrapper（解除死循环，给你立刻能玩的版本）

- 4 个 store 全部恢复成 create 结果直接导出，不调用 withSafeSnapshot。
- `makeSafeGet` 在 create 回调内的 `get = makeSafeGet(rawGet)` **保留**（仅作用于 action 内部 state 读取，不影响订阅层 selector）。
- 保留 `src/store/safeStore.ts` 文件（不删除），阶段 2 修完再启用。
- `git diff` 验证：这次改动只有 4 个 store 文件的 ~3 行导出变化。

### 阶段 2：重写 safeStore.ts · withSafeSnapshot v2

目标：让 wrapper 永远不再产生每次 render 新 selector 引用。

**核心改动**：用 React `useMemo` 把合成后的 selector cache 住，dep 只有用户传进来的 `selector` 本身。用户自己 inline 写 `s => s.foo` 时 selector 也会每次变 —— 但那是 zustand 原生就支持的场景（zustand 内部对 selector 结果做了 Object.is 比较，不会 loop）。我们只保证**我们包的那一层不再额外制造不稳定引用**。

```ts
// 伪代码
import { useMemo } from 'react'

export function withSafeSnapshot<S>(rawStore) {
  const EMPTY = {} as S
  const wrapped = function (selector?, equalityFn?) {
    // 只有用户 selector 变时才重建我们的包装函数
    const safeSelector = useMemo(() => {
      if (typeof selector !== 'function') {
        // 用户没传 selector：就用 EMPTY 兜底 identity
        return (s: S | null) => s ?? EMPTY
      }
      return (s: S | null) => selector(s ?? EMPTY)
    }, [selector])
    return rawStore(safeSelector, equalityFn)
  }
  // 静态方法复制（getState/setState/subscribe 等）—— 原样保留
  // 这个只执行一次（模块初始化时），不是每 render 都跑，所以没问题
  return assignStaticMethods(wrapped, rawStore)
}
```

**补充**：为避免 TS 6133 `A` 未使用 —— 已在上次修正了 `withSafeSnapshot<S>` 泛型签名（只保留 `S`）。

### 阶段 3：应用 v2 wrapper

4 个 store 恢复 `const _raw = create<...>(...)`，再 `export const useXxx = withSafeSnapshot(_raw)`。

注意：`useUiStore` 的 persist 包装在 create 外层，顺序不变：`const _rawUiStore = create<UiState>()(persist(...))` → 依然能包 withSafeSnapshot（persist 返回的 store 也是 UseBoundStore 类型）。

### 阶段 4：验证

1. **手动 Smork 测试**
   - `npm run dev:stable` 跑起来
   - 首页 → L1餐桌整理 → 点"进入任务" → 看 briefing 不炸 → 走 10 步（WASD + 拾取）
   - 快速切 L2 睡前仪式、L3 洗衣分拣：确认每关 briefing 都不报 MAX_DEPTH
2. **自动化**
   - `npx tsc -b`：0 errors
   - `npx vitest run`：373 passed
   - `npm run qa:all`：0 Blocker / 0 Critical / 0 Major（qa-layout 应该 138/138 全绿）
   - `npm run build`：通过

---

## 4. 潜在依赖 & 注意事项

### 4.1 withSafeSnapshot v2 是 React hook wrapper

`useMemo` 是 React hook，所以我们包出来的 `useXxxStore` 仍然必须在组件/其他 hook 里调用（这个本来就是 zustand store 的硬性要求），**不增加新约束**。

### 4.2 阶段 1 期间的"临时不安全"

阶段 1 回滚 wrapper 后，首帧 `getSnapshot()` 返回 null 的隐患理论上又回来了。但你今天试玩时走的是「普通 dev server，无代码分包按需加载」路径（我们用的是 `npm run dev:stable`，Vite 在开发模式下会做模块 eager transform，而不是生产的 runtime chunk split），所以这个首帧 null 窗口出现的概率极低；真遇到了组件层 TaskSelectPage/ArenaPage/useDialog 里我们已经加了可选链防御，不会炸成白屏。

### 4.3 persist onRehydrateStorage 循环的边缘情况

useUiStore 的 persist 有 `onRehydrateStorage` 回调（设置音频状态）。如果 persist 中间件在 React 渲染期间 hydrate 后立即 setState，可能与 wrapper 的 mount effect 竞争形成循环。阶段 2 修复后再观察。

---

## 5. 风险处理

| 风险 | 触发条件 | 降级方案 |
|---|---|---|
| **withSafeSnapshot v2 还是死循环** | useMemo 无法稳定 selector（用户 selector 本身就是 inline）导致 loop 仍发生 | 放弃"store 层全局包装"，改为一次性 grep 所有 **153 处 store hook 调用点**（22 个源文件），每个 selector 加 `(s) => s?.field ?? default` 防御，并把"裸函数选择器"像 `useGameStore(s => s.initializeTask)` 改成 `useGameStore((s) => s?.initializeTask ?? noop)`。工作量是 22 文件 × 平均 7 处调用，约 1 小时。 |
| **阶段 1 回滚了还死循环** | 根因不在 wrapper（极小概率） | 立刻进入 `1.4 潜在次要排查`：停 Scene3D RAF、临时注释 persist.onRehydrateStorage、二分法禁用组件定位最小复现组件。 |
| **TS 类型错误** | withSafeSnapshot 复杂类型推断炸 | 临时 `as unknown as UseBoundStore<StoreApi<S>>` 绕过类型（类型断言不影响运行时安全，我们用 373 tests + 手动测试保证正确性）。 |
