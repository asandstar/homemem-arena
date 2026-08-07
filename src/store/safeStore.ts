import { useCallback, useRef } from 'react'
import type { UseBoundStore } from 'zustand'
import type { StoreApi } from 'zustand'

/**
 * Hotfix 2026-08-07 v3: 代码分包 / 路由懒加载 → zustand 内部 useSyncExternalStore 首帧
 * getSnapshot 短暂返回 null，组件里任何 selector(s) => s.field 都会抛 "Cannot read
 * properties of null"。统一在 hook 层包装后导出，所有消费者自动获得 null-安全。
 *
 * v3 彻底解决 MAX_DEPTH（v1/v2 的 selector 引用不稳定 → zustand 订阅 effect 反复
 * 清理+挂载 → forceStoreRerender 1000 层嵌套）：
 * - 用户传进来的 selector 用 useRef 存起来，每次 render 都立刻写到 ref.current；
 * - 真正传给 zustand 的 stableSelector 是 useCallback 且 dep=[], 永远**同一个函数对象**；
 * - 它运行时从 ref 读"最新用户 selector"后执行，因此语义等价于 v1/v2，但引用稳定。
 * - 这样不管用户是不是 inline 写 `s => s.addScore`，stableSelector 永远不变，
 *   zustand 的订阅 useEffect 只跑一遍 mount，不会 cleanup → remount 造成循环。
 *
 * 用法：
 *   const _raw = create<MyStore>(...)
 *   export const useMyStore = withSafeSnapshot(_raw)
 *
 * 同时保留静态方法：useMyStore.getState() / .setState() / .subscribe() / .getInitialState()
 * （非 React 代码里直接调用这些不会经过 useSyncExternalStore，原始 zustand 已安全）
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

    // 关键点：永远同一个函数对象引用，dep 空数组 → zustand effect 不循环
    const stableSelector = useCallback((s: S | null): any => {
      const userSel = userSelectorRef.current
      const safe = s ?? EMPTY
      if (typeof userSel !== 'function') return safe
      return userSel(safe)
    }, [])
    return (rawStore as any)(stableSelector, equalityFn)
  } as UseBoundStore<StoreApi<S>>

  // 复制所有静态方法（getState / setState / subscribe / getInitialState / …），
  // 因为非 React 上下文直接 useXxxStore.getState() 不会经过上面的 hook 包装。
  const raw = rawStore as any
  const wr = wrapped as any
  for (const key of Object.keys(raw)) {
    if (!(key in wr) || typeof wr[key] === 'undefined') {
      const val = raw[key]
      wr[key] = typeof val === 'function' ? val.bind(raw) : val
    }
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
