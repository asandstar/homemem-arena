import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AudioInitializer } from './components/AudioInitializer'
import { installE2eTestApi } from './utils/e2eTestApi'

// 仅在 DEV && (MODE === 'e2e' || VITE_E2E === 'true') 时挂载测试 API
installE2eTestApi()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AudioInitializer />
    <App />
  </StrictMode>,
)
