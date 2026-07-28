import { vi } from 'vitest'

function makeAudioParam(initialValue: number) {
  let value = initialValue
  return {
    get value() { return value },
    set value(v: number) { value = v },
    setValueAtTime: (v: number) => { value = v; return {} as any },
    linearRampToValueAtTime: () => ({}) as any,
    exponentialRampToValueAtTime: () => ({}) as any,
    setTargetAtTime: () => ({}) as any,
    setValueCurveAtTime: () => ({}) as any,
    cancelScheduledValues: () => ({}) as any,
    cancelAndHoldAtTime: () => ({}) as any,
  }
}

class AudioContextStub {
  state: AudioContextState = 'running'
  sampleRate = 44100
  destination: any = {}
  currentTime = 0
  listener: any = {}
  audioWorklet: any = null

  createGain() {
    return {
      gain: makeAudioParam(1),
      connect: () => ({}) as any,
      disconnect: () => ({}) as any,
    } as any
  }
  createOscillator() {
    return {
      type: 'sine',
      frequency: makeAudioParam(440),
      detune: makeAudioParam(0),
      connect: () => ({}) as any,
      disconnect: () => ({}) as any,
      start: () => {},
      stop: () => {},
    } as any
  }
  createBufferSource() {
    return {
      buffer: null,
      loop: false,
      loopStart: 0,
      loopEnd: 0,
      playbackRate: makeAudioParam(1),
      connect: () => ({}) as any,
      disconnect: () => ({}) as any,
      start: () => {},
      stop: () => {},
    } as any
  }
  createStereoPanner() {
    return {
      pan: makeAudioParam(0),
      connect: () => ({}) as any,
      disconnect: () => ({}) as any,
    } as any
  }
  createBiquadFilter() {
    return {
      type: 'lowpass',
      frequency: makeAudioParam(1000),
      Q: makeAudioParam(1),
      gain: makeAudioParam(0),
      connect: () => ({}) as any,
      disconnect: () => ({}) as any,
    } as any
  }
  createBuffer(channels: number, length: number, sampleRate: number) {
    return {
      numberOfChannels: channels,
      length,
      sampleRate,
      duration: length / sampleRate,
      getChannelData: (ch: number) => new Float32Array(length),
      copyFromChannel: () => {},
      copyToChannel: () => {},
    } as any
  }
  decodeAudioData(data: ArrayBuffer) {
    return Promise.resolve(null as any)
  }
  resume() { return Promise.resolve() }
  suspend() { return Promise.resolve() }
  close() { return Promise.resolve() }
}

if (typeof window !== 'undefined') {
  ;(window as any).AudioContext = AudioContextStub
  ;(window as any).webkitAudioContext = AudioContextStub
}

globalThis.structuredClone ??= (v: any) => {
  if (v === undefined || v === null || typeof v !== 'object') return v
  try {
    return JSON.parse(JSON.stringify(v))
  } catch {
    return v
  }
}

if (typeof window !== 'undefined') {
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb: any) => setTimeout(cb, 0) as any)
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((id: any) => clearTimeout(id))
}
