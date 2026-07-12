import { useEffect } from 'react'
import { useUiStore } from '../store/useUiStore'
import { initAudioEnabled } from '../audio/sfx'

export function AudioInitializer() {
  const audioEnabled = useUiStore((state) => state.audioEnabled)
  useEffect(() => {
    initAudioEnabled(audioEnabled)
  }, [audioEnabled])
  return null
}
