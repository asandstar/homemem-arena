import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AudioInitializer } from './components/AudioInitializer'
import { GlobalErrorBoundary } from './components/GlobalErrorBoundary'
import { installE2eTestApi } from './utils/e2eTestApi'

// 仅在 DEV && (MODE === 'e2e' || VITE_E2E === 'true') 时挂载测试 API
installE2eTestApi()

// NOTE: C1 诊断临时关闭 StrictMode —— 验证后应恢复
// 背景：StrictMode 双挂载导致 R3F WebGLRenderer 瞬时 dispose/recreate，
// 在部分浏览器/驱动下触发"真丢失"无法自动恢复。
createRoot(document.getElementById('root')!).render(
  <GlobalErrorBoundary>
    <AudioInitializer />
    <App />
  </GlobalErrorBoundary>,
)
