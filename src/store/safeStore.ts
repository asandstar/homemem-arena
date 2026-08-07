import { useMemo } from 'react'
import type { UseBoundStore } from 'zustand'
import type { StoreApi } from 'zustand'

/**
 * Hotfix 2026-08-07 v2: 代码分包 / 路由懒加载 → zustand 内部 useSyncExternalStore 首帧
 * getSnapshot 短暂返回 null，组件里任何 selector(s) => s.field 都会抛 "Cannot read
 * properties of null"。统一在 hook 层包装后导出，所有消费者自动获得 null-安全。
 *
 * v2 修复 MAX_DEPTH 死循环：不再每次 render 都 inline 创建新 selector 匿名函数传
 * 给 zustand（会导致 useSyncExternalStoreWithSelector 以为"订阅变了 → 取消再订阅 →
 * forceStoreRerender → 再 render → 再变 → 无限嵌套"），改为用 React.useMemo 把我
 * 们包的合成 selector 缓存住，dep 只有用户本身传进来的 selector —— 用户自己 inline
 * `s => s.foo` 每次变引用是 zustand 原生就支持的场景（它内部只比较 selector 返回值
 * 的 Object.is，不会 loop，我们只保证自己包的那层不再额外制造不稳定引用。
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
    const safeSelector = useMemo(() => {
      if (typeof selector !== 'function') {
        // zustand 4 默认无 selector 等价于返回整个 state（identity）
        return (s: S | null): S => (s ?? EMPTY)
      }
      return (s: S | null): any => selector(s ?? EMPTY)
    }, [selector])
    return (rawStore as any)(safeSelector, equalityFn)
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
