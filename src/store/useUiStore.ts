import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { setAudioEnabled, resetRoomAmbientFlag, initAudio as initSfxAudio } from '../audio/sfx'
import { stopAllAudioImmediate, resumeAudioContexts, getAudioContextStates } from '../audio/audioManager'

interface UiState {
  taskPanelOpen: boolean
  eventLogOpen: boolean
  minimapOpen: boolean
  controlsOpen: boolean
  memoryBarOpen: boolean
  hudHidden: boolean
  audioEnabled: boolean

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
  setMinimapZoom: (zoom: number | ((prev: number) => number)) => void
  setMinimapPan: (pan: { x: number; y: number }) => void
  setMinimapFollowPlayer: (follow: boolean | ((prev: boolean) => boolean)) => void
  resetMinimapView: () => void
  resetUi: () => void
}

export const useUiStore = create<UiState>()(
  persist(
    (set, get) => ({
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
        // 关键：当前 audioEnabled=true 且任一 AudioContext 非 running 时，用户点击按钮 = 提供了可靠用户手势，
        // 先走 resumeAudioContexts() 尝试恢复声音，不错误切换到 USER_OFF。
        // 只有当 audioEnabled=true 且 全部 3 个 context 都已经处于 running 状态时，本次点击才视为"用户要关声音"。
        // 当 audioEnabled=false 时，点击 = 明确用户要开声音，直接切换到 true + 恢复。
        const currentEnabled = get().audioEnabled
        const ctxStates = getAudioContextStates()
        const allCtxActuallyRunning =
          ctxStates.sfx === 'running' &&
          ctxStates.bgm === 'running' &&
          ctxStates.ambient === 'running'

        if (currentEnabled && !allCtxActuallyRunning) {
          // 视为"恢复手势"：不改变 audioEnabled（保持 true），只触发 resume（内部会重建 scheduler 当 AC 跑起来后）
          setAudioEnabled(true)
          initSfxAudio()
          resetRoomAmbientFlag()
          void resumeAudioContexts()
          return
        }

        // 其余情况：true + 都 running → toggle OFF；false → toggle ON
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
    }),
    {
      name: 'home-mem-ui-state',
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
