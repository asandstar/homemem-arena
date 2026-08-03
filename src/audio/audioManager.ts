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
  suspendSfxContextImmediate,
  stopSfxTimers,
  closeSfxContextBestEffort,
  getSfxContextState,
  getActiveSfxCount,
} from './sfx'
import {
  stopBgmImmediate,
  resumeBgmContext,
  suspendBgmContext,
  stopBgmTimers,
  closeBgmContextBestEffort,
  getBgmContextState,
  restartBgmWithLastTaskIdIfNeeded,
  getActiveBgmTimerCount,
  getCurrentBgmTaskId,
} from './bgm'
import {
  stopAmbientImmediate,
  resumeAmbientContext,
  suspendAmbientContextImmediate,
  stopAmbientTimers,
  closeAmbientContextBestEffort,
  getAmbientContextState,
  restartAmbientWithLastRoomIdIfNeeded,
  getActiveAmbientTimerCount,
  getCurrentAmbientRoomId,
} from './ambient'

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
 * 立即硬停止所有音频（BGM / Ambient / Chaos / Legacy Room Ambient / 活跃的一次性 SFX 实例）
 * 并同步 SUSPEND 所有 3 个 AudioContext（这是彻底避免 "关按钮/切后台 还能听到几秒残留" 的关键）。
 *
 * 规则：
 *  - 先 stop 每个模块（节点清理 + timer 清理 + 各模块独立 try/catch）
 *  - 再 suspend 3 个 AudioContext：suspend 是同步操作（≈1ms），能立刻让 schedule 的 gain 节点不再 advance
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

  // 关键：同步挂起三个 AudioContext。
  // 因为 bgm.ts 的 scheduleNextTrack / ambient 的 gain linearRampToValueAtTime 等都是 "把事件塞进 AC 的 timeline"，
  // 只要 AC 还是 running 状态，这些 schedule 事件会继续执行；suspend() 能同步立刻把 timeline freeze。
  // pagehide / beforeunload 的执行窗口只有 ~3-5ms，suspend 是唯一能在窗口内立刻生效的方法。
  try { suspendBgmContext() } catch { /* ignore */ }
  try { suspendAmbientContextImmediate() } catch { /* ignore */ }
  try { suspendSfxContextImmediate() } catch { /* ignore */ }
}

/**
 * 同步 SUSPEND 三个 AudioContext：切后台 / 点音效关闭按钮的 "立刻静音" 核心方法。
 * 比 close() 更快、100% 同步、保证 beforeunload/pagehide 窗口内能完成。
 */
export function suspendAllAudioContextsImmediate(): void {
  try { suspendBgmContext() } catch { /* ignore */ }
  try { suspendAmbientContextImmediate() } catch { /* ignore */ }
  try { suspendSfxContextImmediate() } catch { /* ignore */ }
}

/**
 * 停止三个模块的 setTimeout / setInterval（切后台/关按钮后避免 schedule 节点重新被创建）。
 */
export function stopAllAudioTimers(): void {
  try { stopBgmTimers() } catch { /* ignore */ }
  try { stopAmbientTimers() } catch { /* ignore */ }
  try { stopSfxTimers() } catch { /* ignore */ }
}

/**
 * 尽力 close 三个 AudioContext（异步 Promise 不 await；用于真正离开页面或用户关闭音效时）。
 */
export function closeAllAudioContextsBestEffort(): void {
  try { closeBgmContextBestEffort() } catch { /* ignore */ }
  try { closeAmbientContextBestEffort() } catch { /* ignore */ }
  try { closeSfxContextBestEffort() } catch { /* ignore */ }
}

/**
 * 在用户手势或音效 false→true 后统一恢复 3 套 AudioContext。
 * 规则：
 *  - suspended 时才调用 resume() 并忽略 reject 错误（用户未授权）
 *  - closed 由各模块下一次 play 调用会自动重建
 *  - 不在每帧调用，仅由显式入口
 *  - 【关键】resume AC 之后，必须重新 schedule BGM/Ambient scheduler（之前 stopAllAudioImmediate/stopAllTimers 已清 trackStates/timer），
 *    否则会出现 "resume 了但 BGM/Ambient 永久死" 的回归。
 */
export function resumeAudioContexts(): Promise<void[]> {
  if (!isAudioEnabled()) return Promise.resolve([])
  // 确保 sfx 模块 AC 已初始化（否则 resume 无意义）
  try { initSfxAudio() } catch { /* ignore */ }
  return Promise.all([
    Promise.resolve().then(() => resumeSfxContext()),
    Promise.resolve().then(() => resumeBgmContext()),
    Promise.resolve().then(() => resumeAmbientContext()),
  ]).then((results) => {
    // 关键：在 Promise.then 微任务里重新启动 scheduler（保证 AC resume 完成后再 schedule，
    // 避免 running state 尚未切换导致 schedule 异常）
    try { restoreContinuersIfNeeded() } catch { /* ignore */ }
    return results
  })
}

/**
 * 用 snapshot 恢复 BGM/Ambient 的连续 scheduler（不恢复一次性 SFX）。
 * 调用点：
 *  - resumeAudioContexts() 之后（用户 OFF→ON 点按钮 或 visibilitychange.visible）
 *  保证不会出现 "resume AC 了，BGM/Ambient 还是静默不响" 的回归。
 */
export function restoreContinuersIfNeeded(): void {
  if (!isAudioEnabled()) return
  try { restartBgmWithLastTaskIdIfNeeded() } catch { /* ignore */ }
  try { restartAmbientWithLastRoomIdIfNeeded() } catch { /* ignore */ }
}

/**
 * 诊断：stopAllAudioImmediate 调用次数。
 * 仅用于 e2e/内部诊断，不提供写能力。
 */
export function getStopAllAudioCallCount(): number {
  return lastStopAllCallCount
}

/**
 * 诊断：返回 3 个 AudioContext 的当前状态。
 * 仅用于 e2e/内部诊断，不提供写能力。
 */
export function getAudioContextStates(): {
  sfx: AudioContextState | 'closed'
  bgm: AudioContextState | 'closed'
  ambient: AudioContextState | 'closed'
} {
  return {
    sfx: getSfxContextState(),
    bgm: getBgmContextState(),
    ambient: getAmbientContextState(),
  }
}

/**
 * E2E 只读诊断快照：一次性暴露 audioEnabled / 3 个 context 状态 / 3 个 timer / 节点数 / BGM taskId / Ambient roomId。
 * 【生产安全】：上层调用者必须用 import.meta.env.MODE==='e2e' 守卫后再挂到 window。
 */
export function getAudioLifecycleDiagnostics(): {
  audioEnabled: boolean
  sfxContextState: AudioContextState | 'closed'
  bgmContextState: AudioContextState | 'closed'
  ambientContextState: AudioContextState | 'closed'
  activeSfxNodeCount: number
  bgmTimerCount: number
  ambientTimerCount: number
  currentBgmTaskId: string | null
  currentAmbientRoomId: string | null
} {
  return {
    audioEnabled: isAudioEnabled(),
    sfxContextState: getSfxContextState(),
    bgmContextState: getBgmContextState(),
    ambientContextState: getAmbientContextState(),
    activeSfxNodeCount: getActiveSfxCount(),
    bgmTimerCount: getActiveBgmTimerCount(),
    ambientTimerCount: getActiveAmbientTimerCount(),
    currentBgmTaskId: getCurrentBgmTaskId(),
    currentAmbientRoomId: getCurrentAmbientRoomId(),
  }
}

let lifecycleHookRegistered = false
let lifecycleCleanup: (() => void) | null = null

/**
 * 全局页面生命周期 Hook（全局一次性注册，模块级 flag 保证不会重复注册）。
 *
 * 行为（避免过度声明，用客观描述）：
 *  - visibilitychange:
 *    - hidden → stopAllAudioTimers() + suspendAllAudioContextsImmediate()
 *    - visible → 只当 audioEnabled=true：先 resumeAudioContexts（内部 restoreContinuersIfNeeded 会重建 scheduler）
 *  - pagehide: 同 hidden
 *  - beforeunload: stopAllAudioImmediate() + closeAllAudioContextsBestEffort()
 *
 * 返回值 cleanup 函数：React useEffect 可返回，测试/HMR/StrictMode 不泄漏 listener。
 */
export function ensureGlobalPageLifecycleAudioHookOnce(): () => void {
  if (typeof window === 'undefined') return () => {}
  if (lifecycleHookRegistered && lifecycleCleanup) {
    // 已经注册过：直接返回之前的 cleanup（允许 App StrictMode 两次调用，但不会重复 addEventListener）
    return lifecycleCleanup
  }
  lifecycleHookRegistered = true

  // ---- 通用：立刻暂停所有音频（用于切后台/pagehide）
  const pauseEverythingNow = (): void => {
    try { stopAllAudioTimers() } catch { /* ignore */ }
    try { suspendAllAudioContextsImmediate() } catch { /* ignore */ }
  }

  // ---- 通用：切回前台时，如果用户关了音效就不 resume（否则才恢复）
  const resumeIfUserEnabled = (): void => {
    try {
      if (isAudioEnabled()) {
        // resumeAudioContexts() 内部会在 Promise.then 微任务内 restoreContinuersIfNeeded() → BGM/Ambient scheduler 自动重建
        void resumeAudioContexts()
      }
    } catch {
      /* ignore */
    }
  }

  // 1) visibilitychange （切 tab / 切 App / 锁屏 / 切回来 都会触发）
  const onVisibilityChange = (): void => {
    if (document.visibilityState === 'hidden') {
      pauseEverythingNow()
    } else if (document.visibilityState === 'visible') {
      resumeIfUserEnabled()
    }
  }
  document.addEventListener('visibilitychange', onVisibilityChange, true)

  // 2) pagehide （关闭 tab / 关闭窗口 / bfcache 被冻结 都会触发，Safari/iOS 最关键的补钩）
  const onPageHide = (): void => {
    pauseEverythingNow()
  }
  window.addEventListener('pagehide', onPageHide, true)

  // 3) beforeunload （用户刷新/关窗最后一次机会，做最彻底的同步清理）
  const onBeforeUnload = (): void => {
    try { stopAllAudioImmediate() } catch { /* ignore */ }
    try { closeAllAudioContextsBestEffort() } catch { /* ignore */ }
  }
  window.addEventListener('beforeunload', onBeforeUnload, true)

  // 4) DEV/E2E 调试：控制台暴露硬停入口（PRODUCTION 不暴露，避免外部脚本调用）
  // Vite 下 `import.meta.env` 在所有 MODE 下都可用，无需 typeof import 守卫。
  const isDevOrE2e = !!import.meta.env.DEV || import.meta.env.MODE === 'e2e'
  if (isDevOrE2e) {
    try {
      ;(window as any).__HARD_STOP_AUDIO__ = (): void => {
        stopAllAudioImmediate()
        closeAllAudioContextsBestEffort()
      }
    } catch { /* ignore */ }
  }

  lifecycleCleanup = (): void => {
    try { document.removeEventListener('visibilitychange', onVisibilityChange, true) } catch { /* ignore */ }
    try { window.removeEventListener('pagehide', onPageHide, true) } catch { /* ignore */ }
    try { window.removeEventListener('beforeunload', onBeforeUnload, true) } catch { /* ignore */ }
    if (isDevOrE2e) {
      try { delete (window as any).__HARD_STOP_AUDIO__ } catch { /* ignore */ }
    }
    lifecycleHookRegistered = false
    lifecycleCleanup = null
  }
  return lifecycleCleanup
}
