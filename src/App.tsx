import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { useEffect } from 'react'
import { Layout } from './components/layout/Layout'
import { router as _originalRouter } from './routes'
import {
  ensureGlobalPageLifecycleAudioHookOnce,
  getAudioLifecycleDiagnostics,
  getAudioContextStates,
  getStopAllAudioCallCount,
} from './audio/audioManager'
import { useUiStore } from './store/useUiStore'

// 加 try/catch 守卫：避免 SyntaxError: Cannot use 'import.meta' outside a module
let _basename = '/'
try {
  const baseUrl = String((import.meta as any)?.env?.BASE_URL || '/')
  _basename = baseUrl.replace(/\/$/, '') || '/'
} catch {
  /* ignore */
}

/**
 * 说明：GitHub Pages 404 fallback 的「stored 路径恢复」已经交给 index.html 的 inline script 处理：
 *   public/404.html             → location.replace(base + '#spa-redirect=' + encodeURIComponent(stored))
 *                                  （sessionStorage 写为兜底，兼容旧缓存的 index.html）
 *   index.html <head> inline    → 优先从 hash 读 #spa-redirect=...，decode 后
 *                                  history.replaceState(origin + basename + stored)
 * 这样做的理由：
 *   - inline script 在 React Router Provider 渲染之前（甚至在 React 还没初始化时）就已执行，
 *     保证首帧 HTML doc 渲染时 window.location.pathname 已是正确深路径（含 basename 前缀）。
 *   - RouterProvider.createBrowserRouter 首次初始化时，会读取 window.location 的真实 pathname，
 *     再减去 basename 前缀后做 routes tree 匹配 → 正确命中 /tasks 或 /play/* children，
 *     不会走 routes.tsx 最后一条 '*' fallback Navigate('/tasks')。
 *   - 全程使用 history.replaceState，不会触发新 HTTP 请求，也就不会再次让 preview/GitHub Pages
 *     对深路径文件不存在返回 404.html → 不会再触发 stored 重新写入死循环。
 *   - hash 方案无跨文档 sessionStorage 持久化竞态，根除深链接间歇性回落根路径问题。
 */
const _routes = _originalRouter.routes.map((r) => {
  if (r.path === '/') return { ...r, element: <Layout /> }
  return r
})
const router = createBrowserRouter(_routes, { basename: _basename })

try {
  // 调试暴露：便于 Playwright 验证运行时 basename 与 vite.config.ts 的 base 是否一致。
  // 生产构建时 tree-shake 不影响运行。
  let envBaseUrl = '/'
  try { envBaseUrl = String((import.meta as any)?.env?.BASE_URL || '/') } catch { /* ignore */ }
  ;(window as unknown as { __SPA_FALLBACK_DEBUG__?: unknown }).__SPA_FALLBACK_DEBUG__ = {
    basename: _basename,
    BASE_URL: envBaseUrl,
  }
} catch {
  /* ignore */
}

/**
 * Section 四：E2E 只读诊断（MODE==='e2e' 守卫，生产安全）。
 * 只暴露 readonly 访问：audioEnabled / 3 context states / active node count / 2 timer counts / BGM taskId / Ambient roomId
 *           stopAll call count。
 * 不提供任何"强制创建/绕过 UI 或写操作。
 */
function ensureE2eAudioDiagnosticsOnce(): void {
  if (typeof window === 'undefined') return
  // 加 try/catch 守卫：避免 SyntaxError: Cannot use 'import.meta' outside a module
  let isE2e = false
  try { isE2e = (import.meta as any)?.env?.MODE === 'e2e' } catch { /* ignore */ }
  if (!isE2e) return
  const w = window as any
  if (w.__AUD_DIAG__) return
  w.__AUD_DIAG__ = Object.freeze({
    snapshot: () => getAudioLifecycleDiagnostics(),
    contextStates: () => getAudioContextStates(),
    stopAllCallCount: () => getStopAllAudioCallCount(),
    storeAudioEnabled: () => useUiStore.getState().audioEnabled,
  })
}

function App() {
  // 全局一次性注册：visibilitychange + pagehide + beforeunload 音频生命周期钩子
  // → 返回 cleanup：React StrictMode/HMR/测试 组件卸载时安全 removeEventListener 避免 listener 泄漏
  useEffect(() => {
    ensureE2eAudioDiagnosticsOnce()
    const cleanup = ensureGlobalPageLifecycleAudioHookOnce()
    return () => {
      cleanup()
    }
  }, [])

  return <RouterProvider router={router} />
}

export default App

