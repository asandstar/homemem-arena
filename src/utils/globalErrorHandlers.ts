/**
 * 全局错误兜底：window.onerror + unhandledrejection
 * 是 GlobalErrorBoundary（捕获同步渲染异常）的补充，覆盖以下场景：
 * 1. 异步 Promise 链中的未处理 rejection
 * 2. setTimeout/requestAnimationFrame 等宏任务抛出的异常
 * 3. 第三方库内部（R3F / Three.js）抛出的非 React 生命周期错误
 * 4. 动态 import() / 资源加载失败（chunk load error）
 */

export function installGlobalErrorHandlers() {
  if (typeof window === 'undefined') return

  const MAX_LOG = 20
  const errorRing: Array<{
    t: number
    type: 'error' | 'rejection'
    msg: string
  }> = []

  const pushLog = (type: 'error' | 'rejection', msg: string) => {
    errorRing.push({ t: Date.now(), type, msg: msg.slice(0, 400) })
    if (errorRing.length > MAX_LOG) errorRing.shift()
  }

  // 全局暴露便于调试：在控制台输入 __HM_ERROR_LOG__ 即可查看
  ;(window as any).__HM_ERROR_LOG__ = errorRing

  window.addEventListener(
    'error',
    (event) => {
      const msg = event.message ?? String(event.error ?? 'unknown error')
      // 忽略资源加载失败（字体/favicon/第三方脚本）这类不影响功能的错误
      if (
        typeof event.target !== 'undefined' &&
        event.target !== null &&
        ((event.target as any).tagName === 'LINK' ||
          (event.target as any).tagName === 'SCRIPT' ||
          (event.target as any).tagName === 'IMG')
      ) {
        return
      }
      console.error('[GlobalError] onerror:', msg, event.error)
      pushLog('error', msg)

      // chunk load error 或 HMR 损坏 chunk：尝试一次软刷新
      if (
        typeof msg === 'string' &&
        (msg.includes('ChunkLoadError') ||
          msg.includes('Loading chunk') ||
          msg.includes('Failed to fetch dynamically imported module') ||
          msg.includes('import.meta') ||
          msg.includes('Unexpected token') ||
          msg.includes('SyntaxError')) &&
        !(window as any).__HM_FORCE_REFRESHED__
      ) {
        ;(window as any).__HM_FORCE_REFRESHED__ = true
        try {
          const url = new URL(window.location.href)
          url.searchParams.set('__hm_recover', '1')
          window.location.href = url.toString()
        } catch {
          window.location.reload()
        }
      }
    },
    true,
  )

  window.addEventListener(
    'unhandledrejection',
    (event) => {
      const reason =
        typeof event.reason === 'string'
          ? event.reason
          : event.reason instanceof Error
            ? event.reason.message ?? String(event.reason)
            : JSON.stringify(event.reason ?? {}).slice(0, 300)
      console.error('[GlobalError] unhandledrejection:', reason)
      pushLog('rejection', reason)

      // AudioContext 恢复失败 / Three.js 上下文丢失 / Pointer Lock 退出：静默忽略，后续 UI 层有独立兜底
      if (
        reason.includes('AudioContext') ||
        reason.includes('WebGL context') ||
        reason.includes('pointer lock') ||
        reason.includes('exited the lock')
      ) {
        return
      }
    },
    true,
  )
}
