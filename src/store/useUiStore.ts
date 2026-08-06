import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { setAudioEnabled, resetRoomAmbientFlag, initAudio as initSfxAudio } from '../audio/sfx'
import { stopAllAudioImmediate, resumeAudioContexts, getAudioContextStates } from '../audio/audioManager'
import { withSafeSnapshot, makeSafeGet } from './safeStore'

interface UiState {
  taskPanelOpen: boolean
  eventLogOpen: boolean
  minimapOpen: boolean
  controlsOpen: boolean
  memoryBarOpen: boolean
  hudHidden: boolean
  audioEnabled: boolean
  audioPromptAnswered: boolean

  minimapZoom: number
  minimapPan: { x: number; y: number }
  minimapFollowPlayer: boolean

  toggleTaskPanel: () => void
  toggleEventLog: () => void
  toggleMinimap: () => void
  toggleControls: () => void
  toggleMemoryBar: () => void
  toggleHudHidden: () => void
  toggleAudioEnabled: () => void
  answerAudioPrompt: (enabled: boolean) => void
  setMinimapZoom: (zoom: number | ((prev: number) => number)) => void
  setMinimapPan: (pan: { x: number; y: number }) => void
  setMinimapFollowPlayer: (follow: boolean | ((prev: boolean) => boolean)) => void
  resetMinimapView: () => void
  resetUi: () => void
}

// Hotfix 2026-08-07: 首帧 getSnapshot=null 全局兜底（详见 safeStore.ts）
const _rawUiStore = create<UiState>()(
  persist(
    (set, rawGet) => {
      const get = makeSafeGet(rawGet)
      return {
      taskPanelOpen: true,
      eventLogOpen: false,
      minimapOpen: true,
      controlsOpen: true,
      memoryBarOpen: true,
      hudHidden: false,
      audioEnabled: false,
      audioPromptAnswered: false,

      minimapZoom: 1,
      minimapPan: { x: 0, y: 0 },
      minimapFollowPlayer: false,

      toggleTaskPanel: () => set((state) => ({ taskPanelOpen: !state.taskPanelOpen })),
      toggleEventLog: () => set((state) => ({ eventLogOpen: !state.eventLogOpen })),
      toggleMinimap: () => set((state) => ({ minimapOpen: !state.minimapOpen })),
      toggleControls: () => set((state) => ({ controlsOpen: !state.controlsOpen })),
      toggleMemoryBar: () => set((state) => ({ memoryBarOpen: !state.memoryBarOpen })),
      toggleHudHidden: () => {
        const { hudHidden } = get()
        if (!hudHidden) {
          set({ hudHidden: true })
        } else {
          set({ hudHidden: false })
        }
      },
      toggleAudioEnabled: () => {
        const currentEnabled = get().audioEnabled
        const ctxStates = getAudioContextStates()
        const allCtxActuallyRunning =
          ctxStates.sfx === 'running' &&
          ctxStates.bgm === 'running' &&
          ctxStates.ambient === 'running'

        if (currentEnabled && !allCtxActuallyRunning) {
          setAudioEnabled(true)
          initSfxAudio()
          resetRoomAmbientFlag()
          void resumeAudioContexts()
          return
        }

        set((state) => {
          const newValue = !state.audioEnabled
          setAudioEnabled(newValue)
          if (newValue) {
            initSfxAudio()
            resetRoomAmbientFlag()
            void resumeAudioContexts()
          } else {
            stopAllAudioImmediate()
          }
          return { audioEnabled: newValue }
        })
      },
      answerAudioPrompt: (enabled: boolean) => {
        setAudioEnabled(enabled)
        if (enabled) {
          initSfxAudio()
          resetRoomAmbientFlag()
          void resumeAudioContexts()
        } else {
          stopAllAudioImmediate()
        }
        set({ audioEnabled: enabled, audioPromptAnswered: true })
      },
      setMinimapZoom: (zoom) => set((state) => ({ minimapZoom: typeof zoom === 'function' ? zoom(state.minimapZoom) : zoom })),
      setMinimapPan: (pan) => set({ minimapPan: pan }),
      setMinimapFollowPlayer: (follow) => set((state) => ({ minimapFollowPlayer: typeof follow === 'function' ? follow(state.minimapFollowPlayer) : follow })),
      resetMinimapView: () => set({ minimapZoom: 1, minimapPan: { x: 0, y: 0 }, minimapFollowPlayer: false }),
      resetUi: () => {
        setAudioEnabled(true)
        initSfxAudio()
        resetRoomAmbientFlag()
        set({
          taskPanelOpen: true,
          eventLogOpen: false,
          minimapOpen: true,
          controlsOpen: true,
          memoryBarOpen: true,
          hudHidden: false,
          audioEnabled: true,
          minimapZoom: 1,
          minimapPan: { x: 0, y: 0 },
          minimapFollowPlayer: false,
        })
      },
    }
    },
    {
      name: 'home-mem-ui-state',
      version: 2,
      // v1 → v2 迁移：强制把 audioEnabled 重置为 false（默认静音），
      // 并重置 audioPromptAnswered，让用户重新走声音选择弹窗。
      // 老用户持久化里的 audioEnabled=true 会被清除，避免"明明改了默认 false 还是有声音"。
      migrate: (persistedState: any, version: number) => {
        if (version < 2 && persistedState) {
          persistedState.audioEnabled = false
          persistedState.audioPromptAnswered = false
        }
        return persistedState
      },
      onRehydrateStorage: () => (state) => {
        if (state) {
          setAudioEnabled(state.audioEnabled)
          if (state.audioEnabled) {
            initSfxAudio()
            resetRoomAmbientFlag()
          } else {
            stopAllAudioImmediate()
          }
        }
      },
    }
  )
)

export const useUiStore = withSafeSnapshot(_rawUiStore)
