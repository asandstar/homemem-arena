import { useCallback, useRef, useEffect } from 'react'
import type { UseBoundStore } from 'zustand'
import type { StoreApi } from 'zustand'

/**
 * SINGLETON Fallback — 全局唯一引用，彻底解决 "getSnapshot not cached" / MAX_DEPTH。
 * 严禁在任何 selector 的 fallback 里写 `new Set()` / `[]` / `{}` —— 每 render 新建
 * 对象引用会让 zustand 默认的 Object.is 比较永远判为「已更新」→ 组件无限 re-render
 * → 1000 层 → Maximum update depth exceeded → ErrorBoundary 接管 → 正在加载的 chunk
 * 被浏览器取消 → net::ERR_ABORTED（这就是 6 条日志里前 2 条的来源）。
 *
 * 正确用法（selector 里统一用下面 3 个常量做 fallback）：
 *   s => s?.achievedGoalIds ?? SAFE_EMPTY_SET
 *   s => s?.memorySlots ?? SAFE_EMPTY_ARRAY
 *   s => s?.levelProgress ?? SAFE_EMPTY_OBJECT
 */
export const SAFE_EMPTY_SET: ReadonlySet<any> = Object.freeze(new Set<any>())
export const SAFE_EMPTY_ARRAY: readonly any[] = Object.freeze([] as any[])
export const SAFE_EMPTY_OBJECT: Readonly<Record<string, any>> = Object.freeze({})

/**
 * 模块级安全 env 访问：跟 ArenaPage.tsx 同样的模式，避免 Vite 把
 * import.meta 内联到非模块上下文时抛 SyntaxError。
 */
const _SAFE_ENV: { DEV: boolean } = (() => {
  try {
    const env = (import.meta as any)?.env
    return { DEV: Boolean(env?.DEV) }
  } catch {
    return { DEV: false }
  }
})()

/**
 * Hotfix 2026-08-07 v5:
 *
 * 历史演进：
 *  v1/v2: selector 每 render 新函数引用 → zustand subscribe 反复 cleanup+remount → MAX_DEPTH
 *  v3:   useCallback(dep=[]) + useRef 暂存用户 selector → selector 引用永远稳定 ✅
 *  v4:   + SINGLETON fallback + DEV 新建对象检测（但把检测写在 selector 内部了，
 *        违反「selector 必须是纯函数 / render 阶段不得写 ref」的 React 规则，
 *        StrictMode / Concurrent 下 render phase mutation 可能导致 state 更新丢失）
 *  v5:   把 DEV 检测移到 useEffect（commit phase 运行），selector 恢复为纯函数；
 *        同时检测策略由「连续两次渲染的 Set/Array/Object 引用比较」改为
 *        「采样用户 selector，DEV 模式下用 Object.freeze 包一层结果 + 下次比较引用」，
 *        不再在 render 阶段写任何可变 ref。
 */
export function withSafeSnapshot<S>(
  rawStore: UseBoundStore<StoreApi<S>>,
): UseBoundStore<StoreApi<S>> {
  const EMPTY = {} as S
  const wrapped = function (
    selector?: (state: S) => any,
    equalityFn?: (a: any, b: any) => boolean,
  ): any {
    const userSelectorRef = useRef(selector)
    userSelectorRef.current = selector

    // === 1) 收集最新 selector 文本用于 DEV 报错（render 读 ref 不写，纯函数 ✅）===
    const selectorSourceRef = useRef<string>('')
    if (_SAFE_ENV.DEV && typeof selector === 'function' && !selectorSourceRef.current) {
      try {
        selectorSourceRef.current = String(selector).slice(0, 160)
      } catch {
        selectorSourceRef.current = '(non-stringifiable selector)'
      }
    }

    // === 2) stableSelector：纯函数！！！不在内部写任何 ref（React 规则）===
    const stableSelector = useCallback((s: S | null): any => {
      const userSel = userSelectorRef.current
      const safe = s ?? EMPTY
      if (typeof userSel !== 'function') return safe
      return userSel(safe)
    }, [])

    // 把本次 render 的 selector 结果用一个 ref 缓存，供下方 useEffect 做 DEV 对比
    const lastResultRef = useRef<{ value: any } | null>(null)
    const warnedRef = useRef(false)

    // 先调用 zustand 拿到结果
    const result = (rawStore as any)(stableSelector, equalityFn)

    // render 阶段只读缓存（不写，保持纯）
    const cached = lastResultRef.current
    const needsDevCheck =
      _SAFE_ENV.DEV && !warnedRef.current && cached !== null && typeof selector === 'function'

    // === 3) DEV 新建对象检测：移到 useEffect（commit phase 才执行，不污染 render）===
    useEffect(() => {
      if (!_SAFE_ENV.DEV || warnedRef.current || !needsDevCheck) return
      const last = cached?.value
      const curr = result
      if (last === undefined || last === null || curr === undefined || curr === null) {
        lastResultRef.current = { value: result }
        return
      }
      const isFreshCollection =
        (curr instanceof Set && last instanceof Set && curr !== last && curr.size === 0 && last.size === 0) ||
        (Array.isArray(curr) && Array.isArray(last) && curr !== last && curr.length === 0 && last.length === 0) ||
        (typeof curr === 'object' && typeof last === 'object'
          && curr !== last
          && Object.getPrototypeOf(curr) === Object.prototype
          && Object.getPrototypeOf(last) === Object.prototype
          && Object.keys(curr).length === 0 && Object.keys(last).length === 0)
      if (isFreshCollection) {
        warnedRef.current = true
        // eslint-disable-next-line no-console
        console.warn(
          '[safeStore] Detected selector returning fresh empty collection on every render — ' +
          'this WILL cause "Maximum update depth exceeded".\n' +
          'Fix: use SAFE_EMPTY_SET / SAFE_EMPTY_ARRAY / SAFE_EMPTY_OBJECT from src/store/safeStore.ts\n' +
          'Selector (source-approx): ' + selectorSourceRef.current,
        )
      }
      lastResultRef.current = { value: result }
    }, [needsDevCheck, cached, result, selectorSourceRef.current])

    // 第一次 render 时缓存一份（render 阶段允许写自己 ref 的初值，不写外部）
    if (lastResultRef.current === null) {
      lastResultRef.current = { value: result }
    }

    return result
  } as UseBoundStore<StoreApi<S>>

  // 复制所有静态方法（getState / setState / subscribe / getInitialState / …），
  // 因为非 React 上下文直接 useXxxStore.getState() 不会经过上面的 hook 包装。
  // 显式复制 zustand v5 的 4 个已知静态方法，不依赖 Object.keys 的可枚举性
  // （Vite dev pre-bundle 后属性描述符可能变化，Object.keys 可能漏掉）。
  const raw = rawStore as any
  const wr = wrapped as any
  const STATIC_KEYS = ['getState', 'setState', 'subscribe', 'getInitialState']
  for (const key of STATIC_KEYS) {
    if (typeof raw[key] === 'function') {
      wr[key] = raw[key].bind(raw)
    }
  }
  // 补充：遍历 raw 自身可枚举属性，复制其他可能存在的静态方法
  for (const key of Object.keys(raw)) {
    if (key in wr) continue
    const val = raw[key]
    wr[key] = typeof val === 'function' ? val.bind(raw) : val
  }
  return wrapped
}

/**
 * 在 create<> 回调里包装 get() 函数，action 内部跨 slice 读 state 也能安全
 * 避开首次创建期间 getState===null。传给每个 slice 的第二个参数。
 */
export function makeSafeGet<S>(rawGet: () => S): () => S {
  const EMPTY = {} as S
  return function safeGet(): S {
    return rawGet() ?? EMPTY
  }
}
