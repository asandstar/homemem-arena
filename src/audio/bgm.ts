import { isAudioEnabled } from './sfx'

let audioContext: AudioContext | null = null
let bgmGain: GainNode | null = null
let bgmVolume = 0.3
let isPlaying = false
let currentTaskId: string | null = null

interface BgmConfig {
  notes: number[]
  tempo: number
  volume: number
  waveType: OscillatorType
}

const BGM_CONFIG: Record<string, BgmConfig> = {
  'task-leave-home': {
    notes: [523.25, 587.33, 659.25, 698.46, 783.99, 698.46, 659.25, 587.33],
    tempo: 120,
    volume: 0.25,
    waveType: 'sine',
  },
  'task-clean-table': {
    notes: [392.00, 440.00, 493.88, 523.25, 493.88, 440.00, 392.00, 349.23],
    tempo: 130,
    volume: 0.28,
    waveType: 'triangle',
  },
  'task-laundry-sort': {
    notes: [440.00, 493.88, 523.25, 587.33, 523.25, 493.88, 440.00, 392.00],
    tempo: 110,
    volume: 0.22,
    waveType: 'sine',
  },
  'task-breakfast': {
    notes: [523.25, 659.25, 783.99, 880.00, 783.99, 659.25, 523.25, 392.00],
    tempo: 140,
    volume: 0.3,
    waveType: 'triangle',
  },
}

const DEFAULT_BGM: BgmConfig = {
  notes: [440.00, 493.88, 523.25, 587.33, 523.25, 493.88, 440.00, 392.00],
  tempo: 120,
  volume: 0.25,
  waveType: 'sine',
}

let noteIndex = 0
let noteTimer: ReturnType<typeof setTimeout> | null = null

function initAudioContext(): void {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    bgmGain = audioContext.createGain()
    bgmGain.gain.value = 0
    bgmGain.connect(audioContext.destination)
  }
}

function playNote(config: BgmConfig): void {
  if (!audioContext || !bgmGain || !isAudioEnabled()) return

  const note = config.notes[noteIndex]
  const oscillator = audioContext.createOscillator()
  const noteGain = audioContext.createGain()

  oscillator.type = config.waveType
  oscillator.frequency.value = note

  const duration = 60 / config.tempo * 0.5
  const now = audioContext.currentTime

  noteGain.gain.setValueAtTime(0, now)
  noteGain.gain.linearRampToValueAtTime(config.volume * bgmVolume, now + 0.05)
  noteGain.gain.linearRampToValueAtTime(0, now + duration)

  oscillator.connect(noteGain)
  noteGain.connect(bgmGain)

  oscillator.start(now)
  oscillator.stop(now + duration)

  noteIndex = (noteIndex + 1) % config.notes.length

  noteTimer = setTimeout(() => {
    playNote(config)
  }, duration * 1000)
}

export function playBgm(taskId: string): void {
  if (!isAudioEnabled()) return
  initAudioContext()

  if (currentTaskId === taskId && isPlaying) return

  stopBgm()

  const config = BGM_CONFIG[taskId] || DEFAULT_BGM
  currentTaskId = taskId
  isPlaying = true
  noteIndex = 0

  if (bgmGain && audioContext) {
    bgmGain.gain.value = 0
    bgmGain.gain.linearRampToValueAtTime(1, audioContext.currentTime + 2)
  }

  playNote(config)
}

export function stopBgm(): void {
  if (!isPlaying) return

  isPlaying = false
  currentTaskId = null

  if (noteTimer) {
    clearTimeout(noteTimer)
    noteTimer = null
  }

  if (bgmGain && audioContext) {
    bgmGain.gain.linearRampToValueAtTime(0, audioContext.currentTime + 1)
  }
}

export function setBgmVolume(volume: number): void {
  bgmVolume = Math.max(0, Math.min(1, volume))
  if (bgmGain && audioContext) {
    bgmGain.gain.linearRampToValueAtTime(bgmVolume, audioContext.currentTime + 0.1)
  }
}

export function getBgmVolume(): number {
  return bgmVolume
}

export function isBgmPlaying(): boolean {
  return isPlaying
}