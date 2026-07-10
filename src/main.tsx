import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { useUiStore } from './store/useUiStore'
import { initAudioEnabled } from './audio/sfx'

function AudioInitializer() {
  const audioEnabled = useUiStore((state) => state.audioEnabled)
  useEffect(() => {
    initAudioEnabled(audioEnabled)
  }, [])
  return null
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AudioInitializer />
    <App />
  </StrictMode>,
)
