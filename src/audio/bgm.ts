import { isAudioEnabled } from './sfx'

let audioContext: AudioContext | null = null
let masterGain: GainNode | null = null
let isPlaying = false
let currentTaskId: string | null = null
/**
 * 快照：currentTaskId 在被 stop/cleanup 设 null 之前的最后一个有效值。
 * 用于 "切后台 stopAllTimers → 切回前台 resume" 场景下，重新建立 BGM 调度器，否则 BGM 永久死亡。
 * 同时用于 "用户 OFF → ON 点按钮" 恢复 BGM。
 */
let lastTaskIdSnapshot: string | null = null
let isArenaCleaningUp = false
let currentVolume = 0.5

export function getBgmContextState(): AudioContextState | 'closed' {
  if (!audioContext) return 'closed'
  return audioContext.state
}

export function getBgmAudioContext(): AudioContext | null {
  return audioContext
}

export function getCurrentBgmTaskId(): string | null {
  return currentTaskId
}

export function getLastBgmTaskIdSnapshot(): string | null {
  return lastTaskIdSnapshot
}

/**
 * 当前登记的 BGM track timer 数量（=trackStates.filter(t=>t.timer!=null).length）
 * 用于 E2E 诊断 bgmTimerCount。
 */
export function getActiveBgmTimerCount(): number {
  let count = 0
  for (const s of trackStates) {
    if (s.timer != null) count++
  }
  return count
}

export function resumeBgmContext(): Promise<void> {
  if (!audioContext) {
    initAudioContext()
  }
  if (!audioContext) return Promise.resolve()
  if (audioContext.state === 'suspended') {
    return audioContext.resume().catch(() => {})
  }
  if (audioContext.state === 'closed') {
    audioContext = null
    masterGain = null
    initAudioContext()
  }
  return Promise.resolve()
}

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

export function playBgm(taskId: string, options: { forceRestart?: boolean } = {}): void {
  if (!isAudioEnabled() || isArenaCleaningUp) return
  initAudioContext()

  if (!options.forceRestart && currentTaskId === taskId && isPlaying) return

  stopBgm()

  if (isArenaCleaningUp) return

  const config = BGM_CONFIG[taskId] || DEFAULT_BGM
  currentTaskId = taskId
  // 记录 snapshot（每次成功选定任务后），用于 hidden→visible 或 OFF→ON 时恢复调度器
  lastTaskIdSnapshot = taskId

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
    try {
      masterGain.gain.cancelScheduledValues(audioContext.currentTime)
      masterGain.gain.value = 0
      masterGain.gain.linearRampToValueAtTime(0.5, audioContext.currentTime + 3)
    } catch { /* ignore */ }
  }

  if (isArenaCleaningUp) {
    isPlaying = false
    currentTaskId = null
    return
  }

  startAllLayers(config)
}

export function stopBgm(options: { fadeSeconds?: number } = {}): void {
  if (!isPlaying) return

  // snapshot 记录：在 null 化之前保存
  if (currentTaskId) lastTaskIdSnapshot = currentTaskId
  isPlaying = false
  currentTaskId = null
  clearAllTracks()

  const fadeSeconds = Math.max(0, options.fadeSeconds ?? 2)
  if (masterGain && audioContext) {
    try {
      const now = audioContext.currentTime
      masterGain.gain.cancelScheduledValues(now)
      const current = masterGain.gain.value
      masterGain.gain.setValueAtTime(current, now)
      if (fadeSeconds === 0) {
        masterGain.gain.setValueAtTime(0, now)
      } else {
        masterGain.gain.linearRampToValueAtTime(0, now + fadeSeconds)
      }
    } catch { /* ignore */ }
  }
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

export function stopBgmImmediate(): void {
  // snapshot 记录：在 null 化之前保存
  if (currentTaskId) lastTaskIdSnapshot = currentTaskId
  isPlaying = false
  currentTaskId = null
  clearAllTracks()

  if (masterGain && audioContext) {
    try {
      masterGain.gain.cancelScheduledValues(audioContext.currentTime)
      masterGain.gain.setValueAtTime(0, audioContext.currentTime)
    } catch { /* ignore */ }
  }

  if (audioContext && audioContext.state !== 'closed') {
    const ctx = audioContext
    const ctxState = ctx.state
    audioContext = null
    masterGain = null
    if (ctxState !== 'closed') {
      Promise.resolve()
        .then(() => ctx.close())
        .catch(() => {
          // ignore: "Cannot close a closed AudioContext." 幂等需要。
        })
    }
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

/**
 * 同步立刻挂起 BGM 的 AudioContext（≈1ms 内完成，能在 beforeunload/pagehide 极短时间窗口内生效）。
 * vs close()：close() 是异步 Promise，关闭 tab 时浏览器会 kill；suspend() 同步立即生效最可靠。
 */
export function suspendBgmContext(): void {
  if (!audioContext) return
  if (audioContext.state === 'running') {
    try { audioContext.suspend() } catch { /* ignore */ }
  }
}

/**
 * 立刻停止 BGM 的所有 setInterval/setTimeout 调度器，并把 isPlaying=false。
 * 保证切后台后下一次 setTimeout 回调触发时，playTrack 一进来就 return（不会再创建新 osc）。
 */
export function stopBgmTimers(): void {
  // snapshot：在 null 化之前记录 lastTaskIdSnapshot
  if (currentTaskId) lastTaskIdSnapshot = currentTaskId
  clearAllTracks()
  isPlaying = false
  currentTaskId = null
}

/**
 * 如果存在 lastTaskIdSnapshot，则用它重新启动 BGM（forceRestart 保证清旧的再启动）。
 * 用于：visibilitychange.visible、用户 OFF→ON 点按钮 之后恢复调度器。
 * （只恢复是不够的：必须真的 playBgm 把 trackStates 和定时器重新建起来）
 */
export function restartBgmWithLastTaskIdIfNeeded(): void {
  if (!isAudioEnabled()) return
  if (!lastTaskIdSnapshot) return
  if (isPlaying && currentTaskId === lastTaskIdSnapshot) return
  try {
    playBgm(lastTaskIdSnapshot, { forceRestart: true })
  } catch {
    /* ignore */
  }
}

/**
 * 尽力关闭 BGM AudioContext（异步 Promise 不等待；用于页面真正离开或用户主动关闭音效时）。
 */
export function closeBgmContextBestEffort(): void {
  // snapshot：在 null 化之前记录
  if (currentTaskId) lastTaskIdSnapshot = currentTaskId
  stopBgmTimers()
  if (masterGain && audioContext) {
    try {
      masterGain.gain.cancelScheduledValues(audioContext.currentTime)
      masterGain.gain.setValueAtTime(0, audioContext.currentTime)
    } catch { /* ignore */ }
  }
  if (audioContext && audioContext.state !== 'closed') {
    const ctx = audioContext
    audioContext = null
    masterGain = null
    Promise.resolve().then(() => ctx.close()).catch(() => {})
  }
}
