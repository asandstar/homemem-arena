import { isAudioEnabled } from './sfx'

let audioContext: AudioContext | null = null
let masterGain: GainNode | null = null
let isPlaying = false
let currentTaskId: string | null = null
let isArenaCleaningUp = false
let currentVolume = 0.5

interface TrackConfig {
  notes: number[]
  tempo: number
  volume: number
  waveType: OscillatorType
  delay?: number
  durationMultiplier?: number
  loopOffset?: number
}

interface BgmLayer {
  melody: TrackConfig
  chords?: TrackConfig
  bass?: TrackConfig
  percussion?: TrackConfig
}

interface BgmConfig {
  layers: BgmLayer
  key: string
  mood: 'calm' | 'mysterious' | 'urgent' | 'hopeful'
}

const BGM_CONFIG: Record<string, BgmConfig> = {
  'task-leave-home': {
    key: 'C',
    mood: 'hopeful',
    layers: {
      melody: {
        notes: [523.25, 587.33, 659.25, 698.46, 783.99, 698.46, 659.25, 587.33],
        tempo: 120,
        volume: 0.25,
        waveType: 'sine',
      },
      chords: {
        notes: [523.25, 659.25, 783.99, 659.25],
        tempo: 60,
        volume: 0.15,
        waveType: 'triangle',
        durationMultiplier: 2,
      },
      bass: {
        notes: [130.81, 164.81, 196.00, 164.81],
        tempo: 60,
        volume: 0.2,
        waveType: 'sawtooth',
        durationMultiplier: 2,
      },
    },
  },
  'task-clean-table': {
    key: 'Dm',
    mood: 'mysterious',
    layers: {
      melody: {
        notes: [392.00, 440.00, 493.88, 523.25, 493.88, 440.00, 392.00, 349.23],
        tempo: 130,
        volume: 0.28,
        waveType: 'triangle',
      },
      chords: {
        notes: [392.00, 523.25, 587.33, 523.25],
        tempo: 65,
        volume: 0.12,
        waveType: 'sine',
        durationMultiplier: 2,
      },
      bass: {
        notes: [98.00, 130.81, 146.83, 130.81],
        tempo: 65,
        volume: 0.18,
        waveType: 'sawtooth',
        durationMultiplier: 2,
      },
      percussion: {
        notes: [100, 150, 100, 150, 100, 150, 200, 150],
        tempo: 130,
        volume: 0.08,
        waveType: 'square',
      },
    },
  },
  'task-laundry-sort': {
    key: 'F',
    mood: 'calm',
    layers: {
      melody: {
        notes: [440.00, 493.88, 523.25, 587.33, 523.25, 493.88, 440.00, 392.00],
        tempo: 110,
        volume: 0.22,
        waveType: 'sine',
      },
      chords: {
        notes: [440.00, 554.37, 659.25, 554.37],
        tempo: 55,
        volume: 0.14,
        waveType: 'triangle',
        durationMultiplier: 2,
      },
      bass: {
        notes: [110.00, 138.59, 164.81, 138.59],
        tempo: 55,
        volume: 0.16,
        waveType: 'sine',
        durationMultiplier: 2,
      },
    },
  },
  'task-breakfast': {
    key: 'G',
    mood: 'hopeful',
    layers: {
      melody: {
        notes: [523.25, 659.25, 783.99, 880.00, 783.99, 659.25, 523.25, 392.00],
        tempo: 140,
        volume: 0.3,
        waveType: 'triangle',
      },
      chords: {
        notes: [523.25, 659.25, 783.99, 698.46],
        tempo: 70,
        volume: 0.16,
        waveType: 'sine',
        durationMultiplier: 2,
      },
      bass: {
        notes: [130.81, 164.81, 196.00, 174.61],
        tempo: 70,
        volume: 0.22,
        waveType: 'sawtooth',
        durationMultiplier: 2,
      },
      percussion: {
        notes: [200, 100, 150, 100, 200, 100, 150, 100],
        tempo: 140,
        volume: 0.1,
        waveType: 'square',
      },
    },
  },
}

const DEFAULT_BGM: BgmConfig = {
  key: 'C',
  mood: 'calm',
  layers: {
    melody: {
      notes: [440.00, 493.88, 523.25, 587.33, 523.25, 493.88, 440.00, 392.00],
      tempo: 120,
      volume: 0.25,
      waveType: 'sine',
    },
    chords: {
      notes: [440.00, 554.37, 659.25, 554.37],
      tempo: 60,
      volume: 0.14,
      waveType: 'triangle',
      durationMultiplier: 2,
    },
    bass: {
      notes: [110.00, 138.59, 164.81, 138.59],
      tempo: 60,
      volume: 0.16,
      waveType: 'sine',
      durationMultiplier: 2,
    },
  },
}

interface TrackState {
  noteIndex: number
  timer: ReturnType<typeof setTimeout> | null
  layerName: string
}

const trackStates: TrackState[] = []
let currentChaosValue = 0

function initAudioContext(): void {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    masterGain = audioContext.createGain()
    masterGain.gain.value = 0
    masterGain.connect(audioContext.destination)
  }
}

function clearAllTracks(): void {
  for (const state of trackStates) {
    if (state.timer) {
      clearTimeout(state.timer)
      state.timer = null
    }
  }
  trackStates.length = 0
}

function playTrack(config: TrackConfig, layerName: string): void {
  if (!isPlaying || isArenaCleaningUp || !audioContext || !masterGain || !isAudioEnabled()) return

  const state = trackStates.find(s => s.layerName === layerName)
  if (!state) return

  const note = config.notes[state.noteIndex]
  const oscillator = audioContext.createOscillator()
  const noteGain = audioContext.createGain()
  
  const duration = (60 / config.tempo * 0.5) * (config.durationMultiplier || 1)
  const now = audioContext.currentTime

  let volume = config.volume
  
  if (layerName === 'melody') {
    volume *= (0.8 + currentChaosValue * 0.004)
  } else if (layerName === 'bass') {
    volume *= (0.6 + currentChaosValue * 0.006)
  } else if (layerName === 'percussion') {
    volume *= (0.5 + currentChaosValue * 0.008)
  }

  oscillator.type = config.waveType
  
  if (layerName === 'percussion') {
    oscillator.frequency.value = note
    noteGain.gain.setValueAtTime(0, now)
    noteGain.gain.linearRampToValueAtTime(volume * 0.3, now + 0.01)
    noteGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1)
  } else {
    oscillator.frequency.value = note
    
    const attack = layerName === 'chords' ? 0.1 : 0.05
    const sustain = layerName === 'bass' ? 0.6 : 0.4
    
    noteGain.gain.setValueAtTime(0, now)
    noteGain.gain.linearRampToValueAtTime(volume, now + attack)
    noteGain.gain.linearRampToValueAtTime(volume * sustain, now + duration * 0.5)
    noteGain.gain.linearRampToValueAtTime(0, now + duration)
  }

  oscillator.connect(noteGain)
  noteGain.connect(masterGain)

  oscillator.start(now)
  oscillator.stop(now + duration)

  state.noteIndex = (state.noteIndex + 1) % config.notes.length

  state.timer = setTimeout(() => {
    playTrack(config, layerName)
  }, duration * 1000)
}

function startAllLayers(config: BgmConfig): void {
  clearAllTracks()

  const layers = [
    { name: 'melody', config: config.layers.melody },
    { name: 'chords', config: config.layers.chords },
    { name: 'bass', config: config.layers.bass },
    { name: 'percussion', config: config.layers.percussion },
  ].filter(l => l.config)

  layers.forEach((layer, index) => {
    trackStates.push({
      noteIndex: layer.config!.loopOffset || 0,
      timer: null,
      layerName: layer.name,
    })
    
    setTimeout(() => {
      playTrack(layer.config!, layer.name)
    }, index * 100)
  })
}

export function playBgm(taskId: string): void {
  if (!isAudioEnabled() || isArenaCleaningUp) return
  initAudioContext()

  if (currentTaskId === taskId && isPlaying) return

  stopBgm()

  if (isArenaCleaningUp) return

  const config = BGM_CONFIG[taskId] || DEFAULT_BGM
  currentTaskId = taskId

  if (isArenaCleaningUp) {
    currentTaskId = null
    return
  }

  isPlaying = true

  if (isArenaCleaningUp) {
    isPlaying = false
    currentTaskId = null
    return
  }

  if (masterGain && audioContext) {
    masterGain.gain.value = 0
    masterGain.gain.linearRampToValueAtTime(0.5, audioContext.currentTime + 3)
  }

  if (isArenaCleaningUp) {
    isPlaying = false
    currentTaskId = null
    return
  }

  startAllLayers(config)
}

export function updateBgmState(chaosValue: number, progress: number): void {
  currentChaosValue = chaosValue

  if (!audioContext || !masterGain || !isPlaying) return

  const chaosFactor = Math.min(chaosValue / 100, 1)
  const progressFactor = Math.min(progress, 1)

  const targetVolume = 0.5 + chaosFactor * 0.2 - progressFactor * 0.1
  masterGain.gain.linearRampToValueAtTime(targetVolume, audioContext.currentTime + 1)
}

export function getIsPlaying(): boolean {
  return isPlaying
}

export function stopBgm(): void {
  if (!isPlaying) return

  isPlaying = false
  currentTaskId = null
  clearAllTracks()

  if (masterGain && audioContext) {
    masterGain.gain.linearRampToValueAtTime(0, audioContext.currentTime + 2)
  }
}

export function stopBgmImmediate(): void {
  ;(window as any).__bgmStopCalled = true
  ;(window as any).__bgmStopTime = Date.now()
  ;(window as any).__bgmStopCount = ((window as any).__bgmStopCount || 0) + 1
  
  isPlaying = false
  currentTaskId = null
  clearAllTracks()

  if (masterGain && audioContext) {
    masterGain.gain.cancelScheduledValues(audioContext.currentTime)
    masterGain.gain.setValueAtTime(0, audioContext.currentTime)
  }

  if (audioContext) {
    audioContext.close().then(() => {
      audioContext = null
      masterGain = null
    })
  }
}

export function resetArenaCleanupFlag(): void {
}

export function setBgmVolume(volume: number): void {
  const clampedVolume = Math.max(0, Math.min(1, volume))
  currentVolume = clampedVolume
  if (audioContext && masterGain) {
    masterGain.gain.linearRampToValueAtTime(clampedVolume * 0.5, audioContext.currentTime + 0.5)
  }
}

export function getBgmVolume(): number {
  if (masterGain && audioContext) {
    return masterGain.gain.value / 0.5
  }
  return currentVolume
}

export function isBgmPlaying(): boolean {
  return isPlaying
}
