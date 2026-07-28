export type SfxId = 'pick' | 'place_success' | 'place_error' | 'memory_save' | 'memory_outdated' | 'cat_event' | 'phone_ring' | 'level_complete' | 'chaos_warning' | 'footstep' | 'door_open' | 'door_close' | 'drawer_open' | 'drawer_close' | 'character_speak_plate' | 'character_speak_sock' | 'character_speak_alarm' | 'character_speak_cat' | 'drag_object' | 'fridge_open' | 'fridge_close' | 'cabinet_open' | 'cabinet_close' | 'sink_water' | 'dishwasher_start' | 'trash_drop' | 'time_warning' | 'task_start' | 'task_complete' | 'room_enter'

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
  footstep: {
    frequency: 800,
    duration: 0.1,
    type: 'triangle',
    volume: 0.12,
    slide: { start: 600, end: 200 },
    envelope: { attack: 0.005, decay: 0.05, sustain: 0.1, release: 0.045 },
  },
  door_open: {
    frequency: 150,
    duration: 0.4,
    type: 'sawtooth',
    volume: 0.18,
    slide: { start: 180, end: 100 },
    envelope: { attack: 0.02, decay: 0.15, sustain: 0.2, release: 0.23 },
  },
  door_close: {
    frequency: 120,
    duration: 0.3,
    type: 'sawtooth',
    volume: 0.2,
    slide: { start: 150, end: 80 },
    envelope: { attack: 0.01, decay: 0.1, sustain: 0.3, release: 0.19 },
  },
  drawer_open: {
    frequency: 300,
    duration: 0.25,
    type: 'square',
    volume: 0.15,
    slide: { start: 350, end: 200 },
    envelope: { attack: 0.02, decay: 0.08, sustain: 0.2, release: 0.15 },
  },
  drawer_close: {
    frequency: 250,
    duration: 0.2,
    type: 'square',
    volume: 0.18,
    slide: { start: 300, end: 150 },
    envelope: { attack: 0.01, decay: 0.06, sustain: 0.3, release: 0.13 },
  },
  character_speak_plate: {
    frequency: 880,
    duration: 0.5,
    type: 'sine',
    volume: 0.15,
    slide: { start: 880, end: 1320 },
    envelope: { attack: 0.05, decay: 0.15, sustain: 0.4, release: 0.3 },
  },
  character_speak_sock: {
    frequency: 440,
    duration: 0.6,
    type: 'triangle',
    volume: 0.12,
    slide: { start: 440, end: 660 },
    envelope: { attack: 0.08, decay: 0.2, sustain: 0.3, release: 0.32 },
  },
  character_speak_alarm: {
    frequency: 1000,
    duration: 0.4,
    type: 'square',
    volume: 0.18,
    slide: { start: 1000, end: 1500 },
    envelope: { attack: 0.02, decay: 0.1, sustain: 0.3, release: 0.28 },
  },
  character_speak_cat: {
    frequency: 600,
    duration: 0.35,
    type: 'triangle',
    volume: 0.2,
    slide: { start: 500, end: 800 },
    envelope: { attack: 0.03, decay: 0.08, sustain: 0.4, release: 0.24 },
  },
  drag_object: {
    frequency: 300,
    duration: 0.08,
    type: 'sawtooth',
    volume: 0.1,
    slide: { start: 350, end: 250 },
    envelope: { attack: 0.005, decay: 0.03, sustain: 0.2, release: 0.045 },
  },
  fridge_open: {
    frequency: 180,
    duration: 0.5,
    type: 'sawtooth',
    volume: 0.12,
    slide: { start: 200, end: 120 },
    envelope: { attack: 0.03, decay: 0.15, sustain: 0.2, release: 0.32 },
  },
  fridge_close: {
    frequency: 140,
    duration: 0.35,
    type: 'sawtooth',
    volume: 0.15,
    slide: { start: 160, end: 90 },
    envelope: { attack: 0.02, decay: 0.1, sustain: 0.3, release: 0.23 },
  },
  cabinet_open: {
    frequency: 280,
    duration: 0.35,
    type: 'square',
    volume: 0.14,
    slide: { start: 320, end: 180 },
    envelope: { attack: 0.02, decay: 0.1, sustain: 0.25, release: 0.23 },
  },
  cabinet_close: {
    frequency: 220,
    duration: 0.25,
    type: 'square',
    volume: 0.16,
    slide: { start: 260, end: 140 },
    envelope: { attack: 0.01, decay: 0.08, sustain: 0.3, release: 0.16 },
  },
  sink_water: {
    frequency: 400,
    duration: 0.8,
    type: 'sawtooth',
    volume: 0.1,
    slide: { start: 500, end: 300 },
    envelope: { attack: 0.05, decay: 0.2, sustain: 0.3, release: 0.55 },
  },
  dishwasher_start: {
    frequency: 350,
    duration: 0.6,
    type: 'sawtooth',
    volume: 0.12,
    slide: { start: 400, end: 250 },
    envelope: { attack: 0.03, decay: 0.15, sustain: 0.25, release: 0.42 },
  },
  trash_drop: {
    frequency: 120,
    duration: 0.4,
    type: 'sawtooth',
    volume: 0.18,
    slide: { start: 180, end: 60 },
    envelope: { attack: 0.02, decay: 0.15, sustain: 0.2, release: 0.23 },
  },
  time_warning: {
    frequency: 600,
    duration: 0.3,
    type: 'square',
    volume: 0.2,
    slide: { start: 600, end: 400 },
    envelope: { attack: 0.02, decay: 0.08, sustain: 0.2, release: 0.2 },
  },
  task_start: {
    frequency: 523.25,
    duration: 0.5,
    type: 'sine',
    volume: 0.25,
    slide: { start: 523.25, end: 1046.5 },
    envelope: { attack: 0.05, decay: 0.15, sustain: 0.3, release: 0.3 },
  },
  task_complete: {
    frequency: 523.25,
    duration: 1.0,
    type: 'sine',
    volume: 0.3,
    envelope: { attack: 0.05, decay: 0.15, sustain: 0.5, release: 0.3 },
  },
  room_enter: {
    frequency: 659.25,
    duration: 0.35,
    type: 'sine',
    volume: 0.15,
    slide: { start: 523.25, end: 659.25 },
    envelope: { attack: 0.03, decay: 0.1, sustain: 0.3, release: 0.22 },
  },
}

let audioContext: AudioContext | null = null
let isEnabled = true
let chaosAmbientStoppedAt = 0

const SFX_MIN_INTERVAL_MS = 15
const lastPlayedAtBySoundId: Partial<Record<SfxId, number>> = {}

let activeSfxRegistry: Map<
  number,
  {
    soundId: SfxId
    oscillators: OscillatorNode[]
    gains: GainNode[]
    bufferSources: AudioBufferSourceNode[]
    otherNodes: AudioNode[]
  }
> = new Map()
let activeSfxSeq = 0
const activeSfxIdsBySeq: Partial<Record<number, SfxId>> = {}

function registerActiveSfx(
  soundId: SfxId,
  oscillators: OscillatorNode[],
  gains: GainNode[],
  bufferSources: AudioBufferSourceNode[] = [],
  otherNodes: AudioNode[] = [],
): number {
  const seq = ++activeSfxSeq
  activeSfxRegistry.set(seq, { soundId, oscillators, gains, bufferSources, otherNodes })
  activeSfxIdsBySeq[seq] = soundId
  return seq
}

function unregisterActiveSfx(seq: number): void {
  activeSfxRegistry.delete(seq)
  delete activeSfxIdsBySeq[seq]
}

export function initAudio(): void {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
  }
}

export function getSfxAudioContext(): AudioContext | null {
  return audioContext
}

export function getSfxContextState(): AudioContextState | 'closed' {
  if (!audioContext) return 'closed'
  return audioContext.state
}

export function resumeSfxContext(): Promise<void> {
  if (!audioContext) {
    initAudio()
  }
  if (!audioContext) return Promise.resolve()
  if (audioContext.state === 'suspended') {
    return audioContext.resume().catch(() => {})
  }
  if (audioContext.state === 'closed') {
    audioContext = null
    initAudio()
  }
  return Promise.resolve()
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

interface PlaySfxOptions {
  /** 覆盖全局 volume 系数（0-1） */
  volumeMultiplier?: number
}

function playSfxInternal(sfxId: SfxId, options: PlaySfxOptions = {}): void {
  if (!isEnabled) return
  const nowTs = Date.now()
  const prev = lastPlayedAtBySoundId[sfxId] ?? 0
  if (nowTs - prev < SFX_MIN_INTERVAL_MS) return
  lastPlayedAtBySoundId[sfxId] = nowTs

  if (!audioContext) return
  const config = SFX_CONFIG[sfxId]
  if (!config) return

  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()

  const seq = registerActiveSfx(sfxId, [oscillator], [gainNode])

  oscillator.type = config.type
  const now = audioContext.currentTime
  oscillator.frequency.setValueAtTime(config.frequency, now)

  if (config.slide) {
    try {
      oscillator.frequency.linearRampToValueAtTime(
        config.slide.end,
        now + config.duration,
      )
    } catch {
      // ignore ramp errors on closed/suspended contexts
    }
  }

  const envelope = config.envelope || { attack: 0.01, decay: 0.1, sustain: 0.3, release: 0.1 }
  const volume = Math.max(0, Math.min(1, config.volume * (options.volumeMultiplier ?? 1)))

  try {
    gainNode.gain.setValueAtTime(0, now)
    gainNode.gain.linearRampToValueAtTime(volume, now + envelope.attack)
    gainNode.gain.linearRampToValueAtTime(volume * envelope.sustain, now + envelope.attack + envelope.decay)
    gainNode.gain.linearRampToValueAtTime(0, now + config.duration)
  } catch {
    // ignore scheduled value errors
  }

  const cleanupOnce = () => {
    const entry = activeSfxRegistry.get(seq)
    if (!entry) return
    try { oscillator.stop() } catch { /* ignore */ }
    try { oscillator.disconnect() } catch { /* ignore */ }
    try { gainNode.disconnect() } catch { /* ignore */ }
    for (const n of entry.otherNodes) { try { n.disconnect() } catch { /* ignore */ } }
    unregisterActiveSfx(seq)
  }

  oscillator.onended = cleanupOnce
  try {
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    oscillator.start(now)
    oscillator.stop(now + config.duration)
  } catch {
    cleanupOnce()
  }
}

export function playSfx(sfxId: SfxId, options: PlaySfxOptions = {}): void {
  playSfxInternal(sfxId, options)
}

/**
 * @deprecated 已与 playSfx 合并为同一内部实现 playSfxInternal。
 * 保留此签名用于兼容旧调用方，语义与 playSfx 完全一致。
 */
export function playSfxWithControl(sfxId: SfxId): void {
  playSfxInternal(sfxId)
}

export function stopAllSfxInstances(): void {
  const ctx = audioContext
  const now = ctx?.currentTime ?? 0
  for (const [seq, entry] of activeSfxRegistry) {
    for (const g of entry.gains) {
      try {
        if (ctx) g.gain.cancelScheduledValues(now)
        g.gain.setValueAtTime(0, now)
      } catch { /* ignore */ }
    }
    for (const osc of entry.oscillators) {
      try { osc.stop(now) } catch { /* ignore */ }
      try { osc.disconnect() } catch { /* ignore */ }
    }
    for (const src of entry.bufferSources) {
      try { src.stop(now) } catch { /* ignore */ }
      try { src.disconnect() } catch { /* ignore */ }
    }
    for (const n of entry.otherNodes) {
      try { n.disconnect() } catch { /* ignore */ }
    }
    unregisterActiveSfx(seq)
  }
  activeSfxRegistry.clear()
  for (const k of Object.keys(activeSfxIdsBySeq)) {
    delete activeSfxIdsBySeq[Number(k)]
  }
}

export function getActiveSfxCount(): number {
  return activeSfxRegistry.size
}

export function getActiveSfxIds(): SfxId[] {
  const result: SfxId[] = []
  for (const [, entry] of activeSfxRegistry) {
    result.push(entry.soundId)
  }
  return result
}

export function playCharacterSpeak(speaker: string): void {
  switch (speaker) {
    case 'plate-spirit':
      playSfx('character_speak_plate')
      break
    case 'sock-ghost':
      playSfx('character_speak_sock')
      break
    case 'alarm-clock':
      playSfx('character_speak_alarm')
      break
    case 'cat':
    case 'narrator':
      playSfx('character_speak_cat')
      break
    default:
      playSfx('character_speak_cat')
  }
}

export function playChord(frequencies: number[], duration: number, volume: number = 0.2): void {
  if (!isEnabled || !audioContext) return

  const now = audioContext.currentTime
  const oscillators: OscillatorNode[] = []
  const gains: GainNode[] = []

  let seq = -1
  for (const freq of frequencies) {
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    oscillators.push(oscillator)
    gains.push(gainNode)

    oscillator.type = 'sine'
    oscillator.frequency.value = freq

    try {
      gainNode.gain.setValueAtTime(0, now)
      gainNode.gain.linearRampToValueAtTime(volume, now + 0.05)
      gainNode.gain.linearRampToValueAtTime(0, now + duration)
    } catch { /* ignore */ }

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
  }

  if (oscillators.length) {
    seq = registerActiveSfx('task_complete', oscillators, gains)
  }

  for (let i = 0; i < oscillators.length; i++) {
    const osc = oscillators[i]
    const registeredSeq = seq
    const cleanupChordOnce = () => {
      const entry = activeSfxRegistry.get(registeredSeq)
      if (!entry) return
      for (const o of entry.oscillators) { try { o.stop() } catch { /* ignore */ } try { o.disconnect() } catch { /* ignore */ } }
      for (const g of entry.gains) { try { g.disconnect() } catch { /* ignore */ } }
      unregisterActiveSfx(registeredSeq)
    }
    osc.onended = cleanupChordOnce
    try {
      osc.start(now)
      osc.stop(now + duration)
    } catch {
      cleanupChordOnce()
    }
  }
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
    if (Date.now() - chaosAmbientStoppedAt < 500) return
    console.log('SFX: creating chaos ambient')
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
  chaosAmbientStoppedAt = Date.now()
  if (ambientOscillator) {
    if (ambientGain && audioContext) {
      const now = audioContext.currentTime
      ambientGain.gain.cancelScheduledValues(now)
      ambientGain.gain.setValueAtTime(0, now)
    }
    try {
      ambientOscillator.stop()
      ambientOscillator.disconnect()
    } catch {
      // ignore already stopped/disconnected errors
    }
    ambientOscillator = null
  }
  if (ambientLfo) {
    try {
      ambientLfo.stop()
      ambientLfo.disconnect()
    } catch {
      // ignore already stopped/disconnected errors
    }
    ambientLfo = null
  }
  if (ambientGain) {
    try {
      ambientGain.disconnect()
    } catch {
      // ignore disconnect errors
    }
    ambientGain = null
  }
  if (ambientLfoGain) {
    try {
      ambientLfoGain.disconnect()
    } catch {
      // ignore disconnect errors
    }
    ambientLfoGain = null
  }
}

export function resetChaosAudio(): void {
  stopChaosAmbient()
}

let lastFootstepTime = 0
const FOOTSTEP_INTERVAL = 350

export function playFootstep(speed: number): void {
  if (!isEnabled || !audioContext) return
  const now = Date.now()
  const adjustedInterval = FOOTSTEP_INTERVAL / (speed / 3)
  if (now - lastFootstepTime < adjustedInterval) return
  lastFootstepTime = now
  playSfx('footstep')
}

let roomAmbientOscillator: OscillatorNode | null = null
let roomAmbientGain: GainNode | null = null
let currentRoomType: string | null = null
let roomAmbientTimer: ReturnType<typeof setTimeout> | null = null
let isRoomAmbientStopped = false

const ROOM_AMBIENT_CONFIG: Record<string, { freq: number; volume: number; type: OscillatorType }> = {
  living: { freq: 440, volume: 0.03, type: 'sine' },
  bedroom: { freq: 330, volume: 0.02, type: 'sine' },
  kitchen: { freq: 523, volume: 0.04, type: 'triangle' },
  dining: { freq: 392, volume: 0.03, type: 'sine' },
  entrance: { freq: 440, volume: 0.025, type: 'sine' },
  laundry: { freq: 494, volume: 0.035, type: 'triangle' },
}

/**
 * 旧版 Room Ambient（与 ambient.ts 新版重复）。
 * @deprecated 本函数保留仅为兼容旧实现，生产代码不应再调用。
 *             生产路径的 Room Ambient 应仅使用 src/audio/ambient.ts。
 *             建议逐步移除 HUD useEffect(updateRoomAmbient) 的调用。
 */
export function updateRoomAmbient(roomId: string): void {
  if (isRoomAmbientStopped) return
  if (!isEnabled || !audioContext) return
  if (currentRoomType === roomId) return

  const config = ROOM_AMBIENT_CONFIG[roomId] || ROOM_AMBIENT_CONFIG.living

  if (roomAmbientTimer) {
    clearTimeout(roomAmbientTimer)
    roomAmbientTimer = null
  }

  if (roomAmbientOscillator) {
    const now = audioContext.currentTime
    if (roomAmbientGain) {
      roomAmbientGain.gain.cancelScheduledValues(now)
      roomAmbientGain.gain.setValueAtTime(0, now)
    }
    roomAmbientOscillator.stop()
    roomAmbientOscillator.disconnect()
    roomAmbientOscillator = null
    if (roomAmbientGain) {
      roomAmbientGain.disconnect()
      roomAmbientGain = null
    }
  }

  startRoomAmbient(config)
  currentRoomType = roomId
}

function startRoomAmbient(config: { freq: number; volume: number; type: OscillatorType }): void {
  if (!audioContext || isRoomAmbientStopped) return
  roomAmbientOscillator = audioContext.createOscillator()
  roomAmbientGain = audioContext.createGain()

  roomAmbientOscillator.type = config.type
  roomAmbientOscillator.frequency.value = config.freq

  roomAmbientGain.gain.value = 0
  roomAmbientGain.gain.linearRampToValueAtTime(config.volume, audioContext.currentTime + 1)

  roomAmbientOscillator.connect(roomAmbientGain)
  roomAmbientGain.connect(audioContext.destination)

  roomAmbientOscillator.start()
}

export function stopRoomAmbient(): void {
  isRoomAmbientStopped = true
  if (roomAmbientTimer) {
    clearTimeout(roomAmbientTimer)
    roomAmbientTimer = null
  }
  if (roomAmbientOscillator) {
    if (roomAmbientGain && audioContext) {
      const now = audioContext.currentTime
      roomAmbientGain.gain.cancelScheduledValues(now)
      roomAmbientGain.gain.setValueAtTime(0, now)
    }
    try {
      roomAmbientOscillator.stop()
      roomAmbientOscillator.disconnect()
    } catch {
      // ignore already stopped/disconnected errors
    }
    roomAmbientOscillator = null
  }
  if (roomAmbientGain) {
    try {
      roomAmbientGain.disconnect()
    } catch {
      // ignore disconnect errors
    }
    roomAmbientGain = null
  }
  currentRoomType = null
}

export function resetRoomAmbientFlag(): void {
  isRoomAmbientStopped = false
}

/**
 * @deprecated 旧版 Room Ambient 的活跃检查，保留仅用于 e2e 调试。
 *             生产默认已停止调用 updateRoomAmbient，因此正常情况返回 false。
 */
export function isLegacyRoomAmbientActive(): boolean {
  return roomAmbientOscillator !== null
}

/**
 * 停止所有持续音源（混乱环境音 + 旧房间环境音）+ 所有登记的 SFX 实例。
 * 用于离开 ArenaPage / 统一硬停止入口。
 */
export function stopAllSfx(): void {
  stopChaosAmbient()
  stopRoomAmbient()
  stopAllSfxInstances()
}

/**
 * @deprecated 已被 isLegacyRoomAmbientActive 替代；旧名保留为兼容。
 */
export function hasActiveRoomAmbient(): boolean {
  return isLegacyRoomAmbientActive()
}

/**
 * 是否有活跃的混乱环境音。
 */
export function hasActiveChaosAmbient(): boolean {
  return ambientOscillator !== null
}

/**
 * @deprecated 已被 isLegacyRoomAmbientActive + hasActiveChaosAmbient 替代。
 */
export function getActiveContinuousSfxCount(): number {
  let count = 0
  if (roomAmbientOscillator) count++
  if (ambientOscillator) count++
  return count
}