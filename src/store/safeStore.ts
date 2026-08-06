import type { UseBoundStore } from 'zustand'
import type { StoreApi } from 'zustand'

/**
 * Hotfix 2026-08-07: 代码分包 / 路由懒加载 → zustand 内部 useSyncExternalStore 首帧
 * getSnapshot 短暂返回 null，组件里任何 selector(s) => s.field 都会抛 "Cannot read
 * properties of null"。统一在 hook 层包装后导出，所有消费者自动获得 null-安全。
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
    if (typeof selector !== 'function') {
      // zustand 4 默认无 selector 等价于返回整个 state（identity）
      return (rawStore as any)((s: S | null) => (s ?? EMPTY), equalityFn)
    }
    return (rawStore as any)((s: S | null) => selector(s ?? EMPTY), equalityFn)
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
