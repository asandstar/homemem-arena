import { isAudioEnabled } from './sfx'

let audioContext: AudioContext | null = null
let ambientGain: GainNode | null = null
let isPlaying = false
let currentRoomId: string | null = null
let clearAmbientTimer: ReturnType<typeof setTimeout> | null = null

export function getAmbientContextState(): AudioContextState | 'closed' {
  if (!audioContext) return 'closed'
  return audioContext.state
}

export function getAmbientAudioContext(): AudioContext | null {
  return audioContext
}

export function resumeAmbientContext(): Promise<void> {
  if (!audioContext) {
    initAudioContext()
  }
  if (!audioContext) return Promise.resolve()
  if (audioContext.state === 'suspended') {
    return audioContext.resume().catch(() => {})
  }
  if (audioContext.state === 'closed') {
    audioContext = null
    ambientGain = null
    initAudioContext()
  }
  return Promise.resolve()
}

interface AmbientConfig {
  frequency: number
  volume: number
  waveType: OscillatorType
  modulationFrequency?: number
  modulationDepth?: number
  noiseVolume?: number
}

const ROOM_AMBIENT: Record<string, AmbientConfig> = {
  living: {
    frequency: 120,
    volume: 0.06,
    waveType: 'triangle',
    modulationFrequency: 0.15,
    modulationDepth: 15,
    noiseVolume: 0.02,
  },
  bedroom: {
    frequency: 150,
    volume: 0.08,
    waveType: 'sine',
    modulationFrequency: 0.2,
    modulationDepth: 20,
    noiseVolume: 0.03,
  },
  kitchen: {
    frequency: 200,
    volume: 0.1,
    waveType: 'sine',
    modulationFrequency: 0.3,
    modulationDepth: 25,
    noiseVolume: 0.04,
  },
  entrance: {
    frequency: 90,
    volume: 0.05,
    waveType: 'sine',
    modulationFrequency: 0.12,
    modulationDepth: 12,
    noiseVolume: 0.025,
  },
  laundry: {
    frequency: 180,
    volume: 0.07,
    waveType: 'triangle',
    modulationFrequency: 0.28,
    modulationDepth: 22,
    noiseVolume: 0.035,
  },
  dining: {
    frequency: 140,
    volume: 0.065,
    waveType: 'sine',
    modulationFrequency: 0.18,
    modulationDepth: 18,
    noiseVolume: 0.028,
  },
}

const DEFAULT_AMBIENT: AmbientConfig = {
  frequency: 130,
  volume: 0.07,
  waveType: 'sine',
  modulationFrequency: 0.2,
  modulationDepth: 15,
  noiseVolume: 0.03,
}

let oscillators: OscillatorNode[] = []
let noiseNode: AudioBufferSourceNode | null = null
let noiseGain: GainNode | null = null
let lfoOscillators: OscillatorNode[] = []

function initAudioContext(): void {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    ambientGain = audioContext.createGain()
    ambientGain.gain.value = 0
    ambientGain.connect(audioContext.destination)
  }
}

function createPinkNoise(): AudioBuffer {
  if (!audioContext) throw new Error('AudioContext not initialized')
  const bufferSize = audioContext.sampleRate * 2
  const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate)
  const output = buffer.getChannelData(0)
  
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
  
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1
    b0 = 0.99886 * b0 + white * 0.0555179
    b1 = 0.99332 * b1 + white * 0.0750759
    b2 = 0.96900 * b2 + white * 0.1538520
    b3 = 0.90000 * b3 + white * 0.3104856
    b4 = 0.65000 * b4 + white * 0.5329522
    b5 = -0.7616 * b5 - white * 0.0168980
    output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362
    output[i] *= 0.11
    b6 = white * 0.115926
  }
  
  return buffer
}

function clearAmbient(): void {
  if (clearAmbientTimer) {
    clearTimeout(clearAmbientTimer)
    clearAmbientTimer = null
  }
  for (const osc of oscillators) {
    try {
      osc.stop()
      osc.disconnect()
    } catch {
    }
  }
  oscillators = []
  
  for (const lfo of lfoOscillators) {
    try {
      lfo.stop()
      lfo.disconnect()
    } catch {
    }
  }
  lfoOscillators = []
  
  if (noiseNode) {
    try {
      noiseNode.stop()
      noiseNode.disconnect()
    } catch {
    }
    noiseNode = null
  }
  
  if (noiseGain) {
    try { noiseGain.disconnect() } catch { /* ignore */ }
    noiseGain = null
  }
}

export function playRoomAmbient(roomId: string, options: { forceRestart?: boolean } = {}): void {
  if (!isAudioEnabled()) return
  initAudioContext()
  
  if (!options.forceRestart && currentRoomId === roomId && isPlaying) return
  
  stopAmbient()
  
  const config = ROOM_AMBIENT[roomId] || DEFAULT_AMBIENT
  currentRoomId = roomId
  isPlaying = true
  
  const now = audioContext!.currentTime
  
  const fundOsc = audioContext!.createOscillator()
  const fundGain = audioContext!.createGain()
  
  fundOsc.type = config.waveType
  fundOsc.frequency.value = config.frequency
  
  fundGain.gain.setValueAtTime(0, now)
  fundGain.gain.linearRampToValueAtTime(config.volume, now + 4)
  
  if (config.modulationFrequency && config.modulationDepth) {
    const lfo = audioContext!.createOscillator()
    const lfoGain = audioContext!.createGain()
    
    lfo.type = 'sine'
    lfo.frequency.value = config.modulationFrequency
    lfoGain.gain.value = config.modulationDepth
    
    lfo.connect(lfoGain)
    lfoGain.connect(fundOsc.frequency)
    
    lfo.start(now)
    lfoOscillators.push(lfo)
  }
  
  fundOsc.connect(fundGain)
  fundGain.connect(ambientGain!)
  
  fundOsc.start(now)
  oscillators.push(fundOsc)
  
  const harmOsc = audioContext!.createOscillator()
  const harmGain = audioContext!.createGain()
  
  harmOsc.type = 'sine'
  harmOsc.frequency.value = config.frequency * 2
  
  harmGain.gain.setValueAtTime(0, now)
  harmGain.gain.linearRampToValueAtTime(config.volume * 0.4, now + 4)
  
  harmOsc.connect(harmGain)
  harmGain.connect(ambientGain!)
  
  harmOsc.start(now)
  oscillators.push(harmOsc)
  
  if (config.noiseVolume && config.noiseVolume > 0) {
    noiseNode = audioContext!.createBufferSource()
    noiseGain = audioContext!.createGain()
    
    noiseNode.buffer = createPinkNoise()
    noiseNode.loop = true
    
    noiseGain.gain.setValueAtTime(0, now)
    noiseGain.gain.linearRampToValueAtTime(config.noiseVolume, now + 4)
    
    const filter = audioContext!.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 500
    
    noiseNode.connect(filter)
    filter.connect(noiseGain)
    noiseGain.connect(ambientGain!)
    
    noiseNode.start(now)
  }
  
  if (ambientGain) {
    ambientGain.gain.setValueAtTime(0, now)
    ambientGain.gain.linearRampToValueAtTime(1, now + 4)
  }
}

export function stopAmbient(options: { fadeSeconds?: number } = {}): void {
  if (!isPlaying) return
  
  isPlaying = false
  currentRoomId = null
  
  const now = audioContext?.currentTime || 0
  const fadeSeconds = Math.max(0, options.fadeSeconds ?? 2)
  
  if (ambientGain && audioContext) {
    try {
      ambientGain.gain.cancelScheduledValues(now)
      const current = ambientGain.gain.value
      ambientGain.gain.setValueAtTime(current, now)
      if (fadeSeconds === 0) {
        ambientGain.gain.setValueAtTime(0, now)
      } else {
        ambientGain.gain.linearRampToValueAtTime(0, now + fadeSeconds)
      }
    } catch { /* ignore */ }
  }
  
  if (clearAmbientTimer) {
    clearTimeout(clearAmbientTimer)
  }
  clearAmbientTimer = setTimeout(() => {
    clearAmbient()
  }, fadeSeconds * 1000)
}

export function stopAmbientImmediate(): void {
  isPlaying = false
  currentRoomId = null

  if (ambientGain && audioContext) {
    try {
      ambientGain.gain.cancelScheduledValues(audioContext.currentTime)
      ambientGain.gain.setValueAtTime(0, audioContext.currentTime)
    } catch { /* ignore */ }
  }

  clearAmbient()
}

export function isAmbientPlaying(): boolean {
  return isPlaying
}

export function getCurrentRoom(): string | null {
  return currentRoomId
}
