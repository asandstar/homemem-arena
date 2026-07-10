export type SfxId = 'pick' | 'place_success' | 'place_error' | 'memory_save' | 'memory_outdated' | 'cat_event' | 'phone_ring' | 'level_complete' | 'chaos_warning'

export interface SfxConfig {
  frequency: number
  duration: number
  type: 'sine' | 'square' | 'sawtooth' | 'triangle'
  volume: number
  slide?: { start: number; end: number }
  envelope?: { attack: number; decay: number; sustain: number; release: number }
}

export const SFX_CONFIG: Record<SfxId, SfxConfig> = {
  pick: {
    frequency: 880,
    duration: 0.15,
    type: 'sine',
    volume: 0.25,
    envelope: { attack: 0.01, decay: 0.08, sustain: 0.3, release: 0.06 },
  },
  place_success: {
    frequency: 523.25,
    duration: 0.3,
    type: 'sine',
    volume: 0.3,
    slide: { start: 523.25, end: 1046.5 },
    envelope: { attack: 0.01, decay: 0.1, sustain: 0.4, release: 0.19 },
  },
  place_error: {
    frequency: 150,
    duration: 0.3,
    type: 'sawtooth',
    volume: 0.2,
    slide: { start: 150, end: 80 },
    envelope: { attack: 0.02, decay: 0.15, sustain: 0.2, release: 0.13 },
  },
  memory_save: {
    frequency: 1200,
    duration: 0.25,
    type: 'square',
    volume: 0.15,
    slide: { start: 800, end: 1400 },
    envelope: { attack: 0.005, decay: 0.05, sustain: 0.2, release: 0.195 },
  },
  memory_outdated: {
    frequency: 400,
    duration: 0.4,
    type: 'sawtooth',
    volume: 0.2,
    slide: { start: 600, end: 200 },
    envelope: { attack: 0.02, decay: 0.1, sustain: 0.15, release: 0.23 },
  },
  cat_event: {
    frequency: 800,
    duration: 0.4,
    type: 'triangle',
    volume: 0.18,
    slide: { start: 600, end: 1000 },
    envelope: { attack: 0.05, decay: 0.15, sustain: 0.2, release: 0.2 },
  },
  phone_ring: {
    frequency: 880,
    duration: 0.6,
    type: 'sine',
    volume: 0.15,
    envelope: { attack: 0.02, decay: 0.1, sustain: 0.3, release: 0.48 },
  },
  level_complete: {
    frequency: 523.25,
    duration: 0.8,
    type: 'sine',
    volume: 0.35,
    envelope: { attack: 0.05, decay: 0.1, sustain: 0.6, release: 0.05 },
  },
  chaos_warning: {
    frequency: 200,
    duration: 0.2,
    type: 'sawtooth',
    volume: 0.15,
    envelope: { attack: 0.02, decay: 0.08, sustain: 0.3, release: 0.1 },
  },
}

let audioContext: AudioContext | null = null
let isEnabled = true

export function initAudio(): void {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
  }
}

export function setAudioEnabled(enabled: boolean): void {
  isEnabled = enabled
}

export function isAudioEnabled(): boolean {
  return isEnabled
}

export function initAudioEnabled(enabled: boolean): void {
  isEnabled = enabled
}

export function playSfx(sfxId: SfxId): void {
  if (!isEnabled || !audioContext) return

  const config = SFX_CONFIG[sfxId]
  if (!config) return

  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()

  oscillator.type = config.type
  oscillator.frequency.setValueAtTime(config.frequency, audioContext.currentTime)

  if (config.slide) {
    oscillator.frequency.linearRampToValueAtTime(
      config.slide.end,
      audioContext.currentTime + config.duration
    )
  }

  const envelope = config.envelope || { attack: 0.01, decay: 0.1, sustain: 0.3, release: 0.1 }
  const now = audioContext.currentTime

  gainNode.gain.setValueAtTime(0, now)
  gainNode.gain.linearRampToValueAtTime(config.volume, now + envelope.attack)
  gainNode.gain.linearRampToValueAtTime(config.volume * envelope.sustain, now + envelope.attack + envelope.decay)
  gainNode.gain.linearRampToValueAtTime(0, now + config.duration)

  oscillator.connect(gainNode)
  gainNode.connect(audioContext.destination)

  oscillator.start(now)
  oscillator.stop(now + config.duration)
}

let lastChaosWarningTime = 0

export function playChaosWarning(): void {
  const now = Date.now()
  if (now - lastChaosWarningTime < 3000) return
  lastChaosWarningTime = now
  playSfx('chaos_warning')
}

let ambientOscillator: OscillatorNode | null = null
let ambientGain: GainNode | null = null
let ambientLfo: OscillatorNode | null = null
let ambientLfoGain: GainNode | null = null

export function updateChaosAmbient(chaosValue: number): void {
  if (!isEnabled || !audioContext) return

  const normalizedChaos = Math.min(1, Math.max(0, chaosValue / 100))

  if (normalizedChaos < 0.1) {
    stopChaosAmbient()
    return
  }

  if (!ambientOscillator) {
    ambientOscillator = audioContext.createOscillator()
    ambientGain = audioContext.createGain()
    ambientLfo = audioContext.createOscillator()
    ambientLfoGain = audioContext.createGain()

    ambientOscillator.type = 'sawtooth'
    ambientOscillator.frequency.value = 80

    ambientGain.gain.value = 0

    ambientLfo.type = 'sine'
    ambientLfo.frequency.value = 0.3
    ambientLfoGain.gain.value = 5

    ambientLfo.connect(ambientLfoGain)
    ambientLfoGain.connect(ambientOscillator.frequency)

    ambientOscillator.connect(ambientGain)
    ambientGain.connect(audioContext.destination)

    ambientOscillator.start()
    ambientLfo.start()
  }

  const targetFreq = 80 - normalizedChaos * 50
  const targetGain = normalizedChaos * 0.04

  const now = audioContext.currentTime
  if (ambientOscillator) {
    ambientOscillator.frequency.linearRampToValueAtTime(targetFreq, now + 1)
  }
  if (ambientGain) {
    ambientGain.gain.linearRampToValueAtTime(targetGain, now + 1)
  }
  if (ambientLfoGain) {
    ambientLfoGain.gain.linearRampToValueAtTime(5 + normalizedChaos * 15, now + 1)
  }
  if (ambientLfo) {
    ambientLfo.frequency.linearRampToValueAtTime(0.3 + normalizedChaos * 0.8, now + 1)
  }
}

export function stopChaosAmbient(): void {
  if (!ambientOscillator || !audioContext) return

  const now = audioContext.currentTime
  if (ambientGain) {
    ambientGain.gain.linearRampToValueAtTime(0, now + 0.5)
  }

  setTimeout(() => {
    if (ambientOscillator) {
      ambientOscillator.stop()
      ambientOscillator.disconnect()
      ambientOscillator = null
    }
    if (ambientLfo) {
      ambientLfo.stop()
      ambientLfo.disconnect()
      ambientLfo = null
    }
    if (ambientGain) {
      ambientGain.disconnect()
      ambientGain = null
    }
    if (ambientLfoGain) {
      ambientLfoGain.disconnect()
      ambientLfoGain = null
    }
  }, 600)
}

export function resetChaosAudio(): void {
  stopChaosAmbient()
}