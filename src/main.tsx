import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AudioInitializer } from './components/AudioInitializer'
import { GlobalErrorBoundary } from './components/GlobalErrorBoundary'
import { installE2eTestApi } from './utils/e2eTestApi'
import { installGlobalErrorHandlers } from './utils/globalErrorHandlers'

// 全局错误兜底（覆盖异步/Promise/ChunkLoad 非 React 生命周期错误）
installGlobalErrorHandlers()

// 仅在 DEV && (MODE === 'e2e' || VITE_E2E === 'true') 时挂载测试 API
installE2eTestApi()

// NOTE: 已知 R3F 限制 — StrictMode 双挂载导致 WebGLRenderer 瞬时 dispose/recreate，
// 在部分浏览器/驱动下触发 WebGL 上下文丢失无法自动恢复。保持关闭直到 R3F 官方修复。
createRoot(document.getElementById('root')!).render(
  <GlobalErrorBoundary>
    <AudioInitializer />
    <App />
  </GlobalErrorBoundary>,
)
