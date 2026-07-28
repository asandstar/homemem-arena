/**
 * 全局音频生命周期统一入口
 * 集中提供：
 *  - stopAllAudioImmediate() 幂等硬停止（BGM + Ambient + Chaos + Legacy Room + SFX 实例）
 *  - resumeAudioContexts() 安全恢复三套 AudioContext（sfx/bgm/ambient）
 *
 * 依赖 sfx/bgm/ambient 三个子模块，避免在 UI 层手写不一致的“三件套/五件套”。
 */

import {
  stopChaosAmbient,
  stopRoomAmbient,
  stopAllSfxInstances,
  initAudio as initSfxAudio,
  resumeSfxContext,
  isAudioEnabled,
} from './sfx'
import { stopBgmImmediate, resumeBgmContext } from './bgm'
import { stopAmbientImmediate, resumeAmbientContext } from './ambient'

let lastStopAllCallCount = 0

function swallowExpected(e: unknown): void {
  // 已知的"幂等副作用"类 DOMException：close() 两次、stop() 未 start() 的节点等
  const msg = String((e as any)?.message ?? e ?? '')
  const isExpected =
    /Cannot close a closed AudioContext/i.test(msg) ||
    /Failed to execute 'stop' on 'AudioScheduledSourceNode'/i.test(msg) ||
    /invalid state|already started|already stopped|been disconnected/i.test(msg)
  if (isExpected) return
  // 其余：DEV 环境打印到 console.error（不静默吞未知错误）；不 re-throw（保持幂等）
  if (typeof console !== 'undefined' && typeof console.error === 'function') {
    console.error('[audioManager] stopAllAudioImmediate unexpected error:', e)
  }
}

/**
 * 立即硬停止所有音频（BGM / Ambient / Chaos / Legacy Room Ambient / 活跃的一次性 SFX 实例）。
 *
 * 规则：
 *  - 每个音频子模块独立 try/catch，单个异常不阻止其他模块清理
 *  - 每个子模块严格调用一次：不依赖"第二遍兜底调用"才能正确工作
 *  - 多次调用幂等：不抛异常、不产生副作用重复
 *  - 未知异常 DEV 下会 console.error，但不会 re-throw
 */
export function stopAllAudioImmediate(): void {
  lastStopAllCallCount++

  try { stopBgmImmediate() } catch (e) { swallowExpected(e) }
  try { stopAmbientImmediate() } catch (e) { swallowExpected(e) }
  try { stopChaosAmbient() } catch (e) { swallowExpected(e) }
  try { stopRoomAmbient() } catch (e) { swallowExpected(e) }
  try { stopAllSfxInstances() } catch (e) { swallowExpected(e) }
}

/**
 * 在用户手势或音效 false→true 后统一恢复 3 套 AudioContext。
 * 规则：
 *  - suspended 时才调用 resume() 并忽略 reject 错误（用户未授权）
 *  - closed 由各模块下一次 play 调用会自动重建
 *  - 不在每帧调用，仅由显式入口
 */
export function resumeAudioContexts(): Promise<void[]> {
  if (!isAudioEnabled()) return Promise.resolve([])
  // 确保 sfx 模块 AC 已初始化（否则 resume 无意义）
  try { initSfxAudio() } catch { /* ignore */ }
  return Promise.all([
    Promise.resolve().then(() => resumeSfxContext()),
    Promise.resolve().then(() => resumeBgmContext()),
    Promise.resolve().then(() => resumeAmbientContext()),
  ])
}

/**
 * 诊断：stopAllAudioImmediate 调用次数。
 * 仅用于 e2e/内部诊断，不提供写能力。
 */
export function getStopAllAudioCallCount(): number {
  return lastStopAllCallCount
}
