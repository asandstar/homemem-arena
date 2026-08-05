import { useEffect } from 'react'
import { useUiStore } from '../store/useUiStore'
import { initAudioEnabled } from '../audio/sfx'
import {
  ensureGlobalPageLifecycleAudioHookOnce,
  stopAllAudioImmediate,
  closeAllAudioContextsBestEffort,
  releaseAudioPlaybackMutex,
} from '../audio/audioManager'

export function AudioInitializer() {
  const audioEnabled = useUiStore((state) => state.audioEnabled)

  // ===== Effect 1：全局生命周期钩子（只与挂载/卸载有关，不依赖 audioEnabled）=====
  // 确保不会因为 audioEnabled 从未改变而跳过 cleanup（StrictMode 除外）。
  useEffect(() => {
    const cleanupLifecycle = ensureGlobalPageLifecycleAudioHookOnce()
    return () => {
      try {
        stopAllAudioImmediate()
        closeAllAudioContextsBestEffort()
        releaseAudioPlaybackMutex()
        if (typeof window !== 'undefined') {
          try { (window as any).__HARD_STOP_AUDIO__?.() } catch { /* ignore */ }
        }
      } catch { /* ignore */ }
      cleanupLifecycle()
    }
  }, [])

  // ===== Effect 2：audioEnabled 开关切换（只负责把最新值同步给 SFX 模块；cleanup 不做停止）=====
  // 之前合并在一个 effect 里的问题：
  //   audioEnabled 从未变化时 cleanup 只在卸载时触发一次还好；
  //   但用户切开关后，每次都会触发 return 函数停止所有音频 → 刚切 on 又停了。
  useEffect(() => {
    initAudioEnabled(audioEnabled)
  }, [audioEnabled])

  return null
}
