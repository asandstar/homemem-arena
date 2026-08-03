import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { router as _originalRouter } from './routes'

const _basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/'

/**
 * 说明：GitHub Pages 404 fallback 的「stored 路径恢复」已经交给 index.html 的 inline script 处理：
 *   public/404.html             → 存 sessionStorage['spa-redirect']（basename 之后相对路径 + search + hash）
 *   index.html <head> inline    → history.replaceState(origin + basename + stored)
 * 这样做的理由：
 *   - inline script 在 React Router Provider 渲染之前（甚至在 React 还没初始化时）就已执行，
 *     保证首帧 HTML doc 渲染时 window.location.pathname 已是正确深路径（含 basename 前缀）。
 *   - RouterProvider.createBrowserRouter 首次初始化时，会读取 window.location 的真实 pathname，
 *     再减去 basename 前缀后做 routes tree 匹配 → 正确命中 /tasks 或 /play/* children，
 *     不会走 routes.tsx 最后一条 '*' fallback Navigate('/tasks')。
 *   - 全程使用 history.replaceState，不会触发新 HTTP 请求，也就不会再次让 preview/GitHub Pages
 *     对深路径文件不存在返回 404.html → 不会再触发 stored 重新写入死循环。
 */
const _routes = _originalRouter.routes.map((r) => {
  if (r.path === '/') return { ...r, element: <Layout /> }
  return r
})
const router = createBrowserRouter(_routes, { basename: _basename })

try {
  // 调试暴露：便于 Playwright 验证运行时 basename 与 vite.config.ts 的 base 是否一致。
  // 生产构建时 tree-shake 不影响运行。
  ;(window as unknown as { __SPA_FALLBACK_DEBUG__?: unknown }).__SPA_FALLBACK_DEBUG__ = {
    basename: _basename,
    BASE_URL: import.meta.env.BASE_URL,
  }
} catch {
  /* ignore */
}

function App() {
  return <RouterProvider router={router} />
}

export default App

