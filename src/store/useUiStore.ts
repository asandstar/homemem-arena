import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { setAudioEnabled, stopChaosAmbient } from '../audio/sfx'

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
      toggleAudioEnabled: () => set((state) => {
        const newValue = !state.audioEnabled
        setAudioEnabled(newValue)
        if (!newValue) {
          stopChaosAmbient()
        }
        return { audioEnabled: newValue }
      }),
      setMinimapZoom: (zoom) => set((state) => ({ minimapZoom: typeof zoom === 'function' ? zoom(state.minimapZoom) : zoom })),
      setMinimapPan: (pan) => set({ minimapPan: pan }),
      setMinimapFollowPlayer: (follow) => set((state) => ({ minimapFollowPlayer: typeof follow === 'function' ? follow(state.minimapFollowPlayer) : follow })),
      resetMinimapView: () => set({ minimapZoom: 1, minimapPan: { x: 0, y: 0 }, minimapFollowPlayer: false }),
      resetUi: () => set({
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
      }),
    }),
    {
      name: 'home-mem-ui-state',
    }
  )
)
