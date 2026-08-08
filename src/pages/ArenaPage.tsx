// 3D Arena 页面 - 整合 3D 场景 + HUD + 操作面板
// ⚠️ 重要：useGameStore 的 selector **绝对不能**每次返回新对象。
// Zustand 通过 useSyncExternalStore 订阅，getSnapshot 引用每帧变化 → React 报 "Maximum update depth exceeded"。
// 解决方式：1) 单字段调用；2) 或把 selector 定义在组件外 + 用 useMemo 固定引用。

import { useEffect, useCallback, useState, useRef, lazy, Suspense } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useGameStore, getGameState, type GameStats } from '../store/useGameStore'
import { SAFE_EMPTY_SET, SAFE_EMPTY_ARRAY } from '../store/safeStore'
import { useSessionStore } from '../store/useSessionStore'
import { useToastStore } from '../store/useToastStore'
import { useUiStore } from '../store/useUiStore'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { initAudio, resetRoomAmbientFlag, updateChaosAmbient as updateChaosAmbientSfx, stopChaosAmbient } from '../audio/sfx'
import { resetArenaCleanupFlag, updateBgmState, playBgm, stopBgm } from '../audio/bgm'
import { stopAmbient, stopAmbientImmediate } from '../audio/ambient'
import { stopAllAudioImmediate, resumeAudioContexts } from '../audio/audioManager'
import { executeContainerInteraction, executePick } from '../game/commands'
import { getRank } from '../game/scoring'
import { getTaskById, isHiddenTaskId, PUBLIC_LEVEL_ORDER } from '../data/tasks'
import { useDialog } from '../dialog/useDialog'
import { startAutoSave, stopAutoSave, autosaveGame, hasSavedGame, restoreSave } from '../save/saveSystem'
import { subscribeEvent } from '../engine/eventBus'

const Scene3D = lazy(() => import('../components/arena3d/Scene3D').then((m) => ({ default: m.Scene3D })))
const HUD = lazy(() => import('../components/arena3d/HUD').then((m) => ({ default: m.HUD })))
const DialogBox = lazy(() => import('../components/dialog/DialogBox').then((m) => ({ default: m.DialogBox })))
const PauseMenu = lazy(() => import('../components/arena3d/PauseMenu').then((m) => ({ default: m.PauseMenu })))
const TutorialOverlay = lazy(() => import('../components/arena3d/TutorialOverlay').then((m) => ({ default: m.TutorialOverlay })))

/**
 * 模块级安全 env 访问：import.meta 在非模块上下文（ErrorBoundary、HMR 损坏 chunk、
 * 极少数 worker/shim 场景）下会抛 SyntaxError: Cannot use 'import.meta' outside a module。
 * 这里在模块加载时读一次并缓存，避免每次 render 都 try/catch。
 */
const _SAFE_ENV: { DEV: boolean; PROD: boolean; MODE: string; VITE_E2E?: string } = (() => {
  try {
    const env = (import.meta as any)?.env
    return {
      DEV: Boolean(env?.DEV),
      PROD: Boolean(env?.PROD),
      MODE: String(env?.MODE ?? 'production'),
      VITE_E2E: env?.VITE_E2E === undefined ? undefined : String(env.VITE_E2E),
    }
  } catch {
    return { DEV: false, PROD: true, MODE: 'production', VITE_E2E: undefined }
  }
})()

export function ArenaPage() {
  const { taskId } = useParams<{ taskId: string }>()
  const navigate = useNavigate()
  const location = useLocation()

  const audioEnabled = useUiStore((s) => s.audioEnabled)
  const audioPromptAnswered = useUiStore((s) => s.audioPromptAnswered)
  const answerAudioPrompt = useUiStore((s) => s.answerAudioPrompt)
  const toggleAudioEnabled = useUiStore((s) => s.toggleAudioEnabled)

  // 所有状态都用「单字段 selector」，绝对不要每次创建新对象。
  // Hotfix 2026-08-07: 代码分包 / 懒加载首帧 zustand selector snapshot 可能为 null，
  // 统一加可选链 + call site 做 typeof 检查，避免 Cannot read properties of null。
  const task = useGameStore((s) => s?.task ?? null)
  const phase = useGameStore((s) => s?.phase ?? 'idle')
  const currentRoom = useGameStore((s) => s?.currentRoom ?? 'living')
  const chaosValue = useGameStore((s) => s?.chaosValue ?? 0)
  const achievedGoalIds = useGameStore((s) => s?.achievedGoalIds ?? (SAFE_EMPTY_SET as Set<string>))
  const combo = useGameStore((s) => s?.combo ?? 0)
  const wrongPlaceCount = useGameStore((s) => s?.wrongPlaceCount ?? 0)
  const activeFlowHint = useGameStore((s) => s?.activeFlowHint ?? null)
  const memorySlots = useGameStore((s) => s?.memorySlots ?? (SAFE_EMPTY_ARRAY as (null | any)[]))
  const levelCompleted = useGameStore((s) => !!s?.levelCompleted)
  const levelFailed = useGameStore((s) => !!s?.levelFailed)
  // 函数引用：Zustand 中 action 函数引用是稳定的（set/get 绑定在 slice 创建时），直接安全解构
  const initializeTask = useGameStore((s) => s?.initializeTask)
  const startPlaying = useGameStore((s) => s?.startPlaying)
  const getGameStats = useGameStore((s) => s?.getGameStats)

  // Hotfix 2026-08-07: 一次性安全包装 stats，避免 JSX 里 12+ 处 typeof 重复检查 / 首帧 null。
  // stats 直接每 render 重新计算（只是属性读取，没有性能问题），保证与上面 selectors 同步更新。
  const EMPTY_STATS: GameStats = {
    score: 0, maxCombo: 0, wrongPlaceCount: 0, repeatSearchCount: 0,
    memoryUsedCount: 0, outdatedMemoryCount: 0, memoryUpdateCount: 0,
    memoryEffectiveRate: 0, spatialMemoryUsed: 0, objectMemoryUsed: 0,
    temporalMemoryUsed: 0, proceduralMemoryUsed: 0, elapsedMs: 0, stepCount: 0,
    chaosValue: 0, chaosPeak: 0, levelCompleted: false, levelFailed: false,
    failureReason: null, taskName: null,
  }
  let stats: GameStats = EMPTY_STATS
  if (typeof getGameStats === 'function') {
    try {
      const raw = getGameStats() ?? EMPTY_STATS
      stats = { ...EMPTY_STATS, ...raw }
    } catch {
      stats = EMPTY_STATS
    }
  }

  // ⚠️ 用单字段 selector 避免 getSnapshot 引用变化 → 无限循环
  const startSession = useSessionStore((s) => s.startSession)
  const addToast = useToastStore((s) => s.addToast)

  const [briefingOpen, setBriefingOpen] = useState<boolean>(() => {
    // G0-E2E 快路径：window.__E2E_G0__ = true 时不显示简报，直接走 FIX-3 启动游戏。
    // 解决 E2E test 依赖 brief button click 的间歇性失败。
    try {
      if (typeof window !== 'undefined' && Boolean((window as any).__E2E_G0__)) return false
    } catch {}
    return true
  })
  const [narrativeText, setNarrativeText] = useState<string | null>(null)
  const [showStats, setShowStats] = useState(false)
  const [showTutorial, setShowTutorial] = useState(false)

  // start dialog 触发标记：避免 tutorial 关闭后反复 openDialog('start')
  const startDialogTriggeredRef = useRef(false)

  // [DEV ONLY · WP0A CALIBRATION HELPER] 计算一次即可，非 state 避免 re-render 抖动
  const isCalibrationMode: boolean = (() => {
    try {
      if (!_SAFE_ENV.DEV || typeof window === 'undefined') return false
      return /[?&]assetCalibration=(1|true|yes)/i.test(window.location.search)
    } catch {
      return false
    }
  })();

  // 当进入 calibration 模式时，ArenaPage 的 Briefing 弹层仍会显示，但 Scene3D 内部已短路为 AssetCalibrationView，
  // Briefing Modal 叠在校准页上方挡模型，同时 Briefing 的 canvas 与校准 view 都出现。
  // 这里直接关弹层：保持视觉验收能看到完整的 Calibration UI。
  useEffect(() => {
    if (!_SAFE_ENV.DEV || typeof window === 'undefined') return
    if (/[?&]assetCalibration=(1|true|yes)/i.test(window.location.search)) {
      setBriefingOpen(false)
    }
  }, [taskId, location.key])

  const {
    dialogState,
    currentNode,
    closeDialog,
    triggerDialog,
    handleChoice,
    handleNext,
  } = useDialog()

  // 把 React 层 overlay 状态同步到 useUiStore.overlayBlocking，
  // 供 taskSlice.tickElapsed / ArenaPage 100ms tick 在弹窗打开时冻结游戏循环。
  const setOverlayBlocking = useUiStore((s) => s.setOverlayBlocking)
  useEffect(() => {
    setOverlayBlocking(briefingOpen || showTutorial || (dialogState.isOpen && !!currentNode))
  }, [briefingOpen, showTutorial, dialogState.isOpen, currentNode, setOverlayBlocking])

  useEffect(() => {
    if (taskId && _SAFE_ENV.PROD && isHiddenTaskId(taskId)) {
      navigate('/tasks', { replace: true })
    }
  }, [taskId, navigate])

  // [DEV ONLY · WP0A CALIBRATION HELPER]
  // 当 URL query 包含 assetCalibration=1 / devUnlock=1 / devUnlockAll=1 时，
  // 自动把 PUBLIC_LEVEL_ORDER 所有任务标记为 unlocked + completed，
  // 确保 browser 自动化 / 视觉验收无需手动打通 L1 即可进入 L2=L3。
  // 生产环境：_SAFE_ENV.DEV === false，该 effect 整段被 tree-shake 删除（不写 localStorage）。
  useEffect(() => {
    if (!_SAFE_ENV.DEV || typeof window === 'undefined') return
    const search = window.location.search
    const shouldUnlock = /[?&](assetCalibration|devUnlock|devUnlockAll)=(1|true|yes)/i.test(search)
    if (!shouldUnlock) return
    const state = useGameStore.getState()
    const existing = state.levelProgress ?? {}
    const updated: typeof existing = { ...existing }
    let changed = false
    ;(PUBLIC_LEVEL_ORDER as readonly string[]).forEach((id) => {
      const cur = updated[id]
      if (!cur || !cur.unlocked || !cur.completed) {
        updated[id] = {
          taskId: id,
          unlocked: true,
          completed: true,
          rank: cur?.rank ?? 'S',
          bestScore: cur?.bestScore ?? 9500,
          completionTime: cur?.completionTime ?? 45_000,
          attempts: (cur?.attempts ?? 0) + (cur?.completed ? 0 : 1),
        }
        changed = true
      }
    })
    if (!changed) return
    try {
      const STORAGE_KEY = 'homemem-level-progress'
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    } catch { /* quota / disabled storage — ignore */ }
    useGameStore.setState({ levelProgress: updated })
  }, [taskId, location.key])

  useEffect(() => {
    // briefingOpen 守卫：ArenaPage 重新挂载时 Zustand store 中 phase 可能仍为上一局的 'playing'，
    // 此时不应触发 dialog。只有在 briefing 关闭后（用户点击开始任务）才触发。
    // tutorial 守卫：教程打开时不触发对话，等玩家关闭教程后再出现开场对话，
    // 避免教程和对话弹窗同时叠加。
    if (phase === 'playing' && task && !briefingOpen && !showTutorial && !startDialogTriggeredRef.current) {
      startDialogTriggeredRef.current = true
      triggerDialog('start', task.id)
    }
  }, [phase, task, briefingOpen, showTutorial, triggerDialog])

  useEffect(() => {
    if (phase === 'playing' && !briefingOpen) {
      triggerDialog('roomEnter', currentRoom)
      if (audioEnabled) {
        // 关键修复：在 playing 阶段开始时，强制停止所有非 BGM 音频源
        // 确保只有 BGM 在 playing 阶段播放，避免多套音频系统同时发声
        try { stopChaosAmbient() } catch { /* ignore */ }
        try { stopAmbientImmediate() } catch { /* ignore */ }
        void resumeAudioContexts({ restoreBgm: true, restoreAmbient: false })
      }
    }
  }, [currentRoom, phase, briefingOpen, audioEnabled, triggerDialog])

  // 监听事件总线触发对话
  useEffect(() => {
    if (!task || briefingOpen) return

    const unsubscribe = subscribeEvent((event) => {
      if (event.type === 'task_progress' && event.status === 'achieved') {
        if (event.goalId === 'level_complete') {
          triggerDialog('event', `level_complete_${event.taskId}`)
        } else {
          triggerDialog('goalComplete', event.goalId)
        }
      } else if (event.type === 'memory_write') {
        triggerDialog('event', 'memory_save')
      }
    })

    return unsubscribe
  }, [task, briefingOpen, triggerDialog])

  useEffect(() => {
    if (phase === 'playing') {
      const totalGoals = task?.goals?.length ?? 1
      const completedGoals = achievedGoalIds?.size ?? 0
      const progress = completedGoals / totalGoals
      updateBgmState(chaosValue, progress)
      if (audioEnabled && task) {
        playBgm(task.id, { forceRestart: false })
      }
    }
  }, [chaosValue, phase, task, achievedGoalIds, audioEnabled])

  // 连击对话触发
  useEffect(() => {
    if (!task || briefingOpen || phase !== 'playing') return
    if (combo >= 3) {
      triggerDialog('event', 'combo_3')
    }
  }, [combo, task, briefingOpen, phase, triggerDialog])

  // 错误操作对话触发
  useEffect(() => {
    if (!task || briefingOpen || phase !== 'playing') return
    if (wrongPlaceCount > 0) {
      triggerDialog('event', 'wrong_pick')
    }
  }, [wrongPlaceCount, task, briefingOpen, phase, triggerDialog])

  // 停滞对话触发（通过 flow hint）
  useEffect(() => {
    if (!task || briefingOpen || phase !== 'playing') return
    if (activeFlowHint && activeFlowHint.level >= 2) {
      triggerDialog('event', 'stagnation')
    }
  }, [activeFlowHint, task, briefingOpen, phase, triggerDialog])

  // 初始化任务（每次进入，无论是 taskId 改变还是 location.key 改变 —— 例如从 ResultPage 重新开始相同 taskId）
  useEffect(() => {
    console.log('[ARENA EFFECT #1 INIT] taskId=', taskId, 'locKey=', location.key?.slice(0,6))
    if (!taskId || !getTaskById(taskId)) {
      navigate('/tasks', { replace: true })
      return
    }
    // 重置/切任务前停止旧音频（保证 ambient 不随相同房间而残留）
    stopAllAudioImmediate()
    setNarrativeText(null)
    setShowStats(false)
    // 重置 start dialog 触发标记，让新关卡能再次触发开场对话
    startDialogTriggeredRef.current = false
    // 重置 overlay 阻塞标志，避免上一局 briefing/tutorial 关闭后残留为 true 冻结新关卡
    try { useUiStore.getState().setOverlayBlocking(false) } catch { /* ignore */ }

    const calibMode = _SAFE_ENV.DEV && typeof window !== 'undefined'
      && /[?&]assetCalibration=(1|true|yes)/i.test(window.location.search)
    const savedContinue = typeof window !== 'undefined'
      ? sessionStorage.getItem(`hm_continue_${taskId}`) === '1'
      : false
    if (savedContinue) {
      try { sessionStorage.removeItem(`hm_continue_${taskId}`) } catch {}
    }

    if (closeDialog) closeDialog()
    
    // 修复：更健壮的 initializeTask 重试逻辑
    // 关键：优先用 React selector 获取的 initializeTask（有 withSafeSnapshot 的 EMPTY fallback 保护），
    // getState() 在 withSafeSnapshot 包装下可能返回 null，只作为 fallback。
    const maxRetries = 10
    let retries = 0
    let _DIAG = 0

    const tryInitialize = () => {
      // 路径1: React selector 的 initializeTask（withSafeSnapshot 保护下不会 null 崩溃）
      if (typeof initializeTask === 'function') {
        console.log('[ARENA EFFECT #1] initializeTask via selector ✅')
        initializeTask(taskId)
        return
      }

      // 路径2: 用 getGameState() 绕过 withSafeSnapshot 的 getState bug
      const s = getGameState() as any
      if (s && typeof s.initializeTask === 'function') {
        console.log('[ARENA EFFECT #1] initializeTask via getGameState ✅')
        s.initializeTask(taskId)
        return
      }

      // ⚠️ 路径3 (EMERGENCY RECOVERY): state 被 sweepExpiredDemoHighlights 损坏了
      // 用 _rawGameStore.setState(getInitialState(), true) 整体替换当前损坏的 state
      try {
        const rawStoreRef = (useGameStore as any)
        const _raw = rawStoreRef?.__rawStore
          ?? (typeof rawStoreRef?.getInitialState === 'function' ? rawStoreRef : null)
        if (_raw) {
          const _init = typeof _raw.getInitialState === 'function' ? _raw.getInitialState() : null
          if (_init && typeof _init.initializeTask === 'function') {
            console.warn('[ARENA EFFECT #1] EMERGENCY: state 已损坏，通过 getInitialState 完整重建')
            const _setState = typeof (rawStoreRef as any)?.setRaw === 'function'
              ? (rawStoreRef as any).setRaw
              : typeof (_raw as any).setState === 'function'
                ? (_raw as any).setState
                : null
            if (typeof _setState === 'function') {
              _setState(_init, true)  // replace=true → 恢复完整 133 keys
              retries = Math.max(0, retries - 3)
            }
          }
        }
      } catch (err) {
        console.warn('[ARENA EFFECT #1] emergency rebuild 尝试失败:', err)
      }

      if (_DIAG < 2) {
        _DIAG++
        console.error('[ARENA DIAG] getGameState type=', typeof s, 'keys=', s ? Object.keys(s).slice(0, 30) : 'null', 'hasInit=', typeof s?.initializeTask, 'selectorInit=', typeof initializeTask)
      }

      retries++
      if (retries < maxRetries) {
        requestAnimationFrame(tryInitialize)
      } else {
        console.error('[ARENA EFFECT #1 FATAL] selector 和 getGameState 都无法获取 initializeTask')
      }
    }
    
    // 开始第一次尝试
    tryInitialize()

    // "继续"进入：restoreSave 覆盖 initializeTask 的默认状态，然后跳过 briefing 直接进入 playing
    // 若存档校验失败（version/hash 不一致），hasSavedGame 会返回 false，照常显示 briefing 重新开始
    if (savedContinue && taskId && hasSavedGame(taskId).ok) {
      const ok = restoreSave(taskId)
      if (ok) {
        setBriefingOpen(false)
        // 存档里 phase 若是 briefing/playing，都直接切到 playing（保证玩家"继续"时立刻可操作）
        const gs = getGameState() as any
        if (gs && (gs.phase === 'briefing' || gs.phase === 'playing') && typeof gs.setGamePhase === 'function') {
          gs.setGamePhase('playing')
        }
        return
      }
    }

    // 校准模式也不显示 briefing。E2E G0 模式下直接跳过简报（window.__E2E_G0__=true）。正常新开局显示 briefing。
    const e2eG0Skip = typeof window !== 'undefined' && Boolean((window as any).__E2E_G0__)
    setBriefingOpen((calibMode || e2eG0Skip) ? false : true)
  }, [taskId, location.key, initializeTask, navigate, closeDialog])

  // 离开 ArenaPage 时停止所有音频，避免浏览器后退后继续播放
  useEffect(() => {
    resetArenaCleanupFlag()
    resetRoomAmbientFlag()

    const handleCleanup = () => {
      ;(window as any).__arenaCleanupCalled = true
      ;(window as any).__lastCleanupTime = Date.now()
      ;(window as any).__cleanupCallCount = ((window as any).__cleanupCallCount || 0) + 1
      stopAllAudioImmediate()
      stopAutoSave()
      if (taskId) {
        try { autosaveGame(taskId) } catch { /* ignore */ }
      }
    }

    const handleBeforeUnload = () => {
      handleCleanup()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      handleCleanup()
    }
  }, [taskId])

  // probing 阶段（任务完成/失败）fade out BGM/Ambient，立即停 chaos 低频
  useEffect(() => {
    if (phase === 'probing' || phase === 'analyzing' || phase === 'result' || phase === 'aborted') {
      try { updateChaosAmbientSfx(0) } catch { /* ignore */ }
      stopBgm({ fadeSeconds: 0.5 })
      stopAmbient({ fadeSeconds: 0.3 })
    }
  }, [phase])

  // 阶段切换存档：除了定时 60 秒存一次，关键过渡（进入 probing / 进入 playing / 任务完成 / 失败）也要存一次。
  // 避免玩家"刚进入探针就刷新丢了进度"的糟糕体验。
  useEffect(() => {
    if (!task || !taskId) return
    if (phase === 'playing' || phase === 'probing' || phase === 'analyzing' || phase === 'result') {
      try { autosaveGame(taskId) } catch {}
    }
  }, [phase, taskId, task])

  // 自动保存：playing 阶段 60 秒一次。暂停时不重复保存（saveSystem.startAutoSave 内部已检查 isPaused 跳过）
  useEffect(() => {
    if (phase === 'playing') {
      startAutoSave()
    }
    return () => {
      stopAutoSave()
    }
  }, [phase])

  // FIX-3 兜底：简报已关闭（或跳过）但 phase 还在 briefing 时，强制进入 playing
  // 避免 E2E/自动化/特殊入口下，简报按钮没点导致所有指令被 ensurePlaying 拦截
  useEffect(() => {
    if (!briefingOpen && phase === 'briefing' && task) {
      console.warn('[FIX-3] briefing 已关闭但 phase=briefing，兜底补 startPlaying() 调用')
      if (typeof startPlaying === 'function') startPlaying()
    }
  }, [briefingOpen, phase, task, startPlaying])

  // G0-E2E 兜底：测试环境 (window.__testApi__ 存在) 下 briefing 打开超时 ≥8s 自动跳过
  // 防止 headless chromium 内简报按钮 click 失败导致全部断言挂在 HUD 不可见
  useEffect(() => {
    if (!task || !briefingOpen) return
    if (typeof window === 'undefined') return
    const inE2e = !!(window as any).__testApi__ || _SAFE_ENV.MODE === 'e2e' || _SAFE_ENV.VITE_E2E === 'true'
    if (!inE2e) return
    const id = window.setTimeout(() => {
      setBriefingOpen(false)
    }, 8_000)
    return () => window.clearTimeout(id)
  }, [task, briefingOpen])

  // AUTO-1：阶段机主动 tick（100ms 间隔）。解决"玩家站着不动/pure E2E 脚本下，
  // evaluateStageTransitions/triggerScriptedEvents 只在玩家动作时跑，导致条件满足但阶段不切、事件不触发"的问题
  useEffect(() => {
    if (phase !== 'playing') return
    const s = useGameStore.getState()
    // 函数可用性校验：只在全部存在时启动，避免老版本 store 崩溃
    const hasAll = typeof s.evaluateStageTransitions === 'function'
      && typeof s.triggerScriptedEvents === 'function'
      && typeof s.checkLevelCompletion === 'function'
      && typeof s.updateMoveAnimations === 'function'
    if (!hasAll) return

    const tick = () => {
      const st = useGameStore.getState()
      // 阻塞型 overlay 打开时冻结脚本事件与阶段推进，避免弹窗背后悄悄触发钥匙猫/手机响等事件
      if (useUiStore.getState().overlayBlocking) return
      // updateMoveAnimations 100ms 足够驱动袜子幽灵等缓慢动画
      try { if (typeof st.updateMoveAnimations === 'function') st.updateMoveAnimations() } catch { /* ignore */ }
      // 触发事件（钥匙猫推、手机响）先跑，产生的状态变化再喂给阶段机
      try { if (typeof st.triggerScriptedEvents === 'function') st.triggerScriptedEvents() } catch { /* ignore */ }
      // 阶段机判定：根据实体/容器/记忆状态做阶段切换
      try { if (typeof st.evaluateStageTransitions === 'function') st.evaluateStageTransitions() } catch { /* ignore */ }
      // 终局判定：所有目标 achieved + completionCondition 通过 → levelCompleted=true
      try { if (typeof st.checkLevelCompletion === 'function') st.checkLevelCompletion() } catch { /* ignore */ }
    }
    const id = window.setInterval(tick, 100)
    // 启动时立刻跑一次，避免首帧等待 100ms
    tick()
    return () => window.clearInterval(id)
  }, [phase])

  const getMemoryStrategyComment = () => {
    // 使用包装后的 stats（已经做过 safe check），避免首帧 getGameStats 为 undefined
    if (stats.levelFailed) {
      return '时间到了！下次记得更快一点哦！'
    }
    if (stats.memoryUsedCount >= 2 && stats.memoryUpdateCount >= 1) {
      return '记忆大师！你完美地保存并更新了记忆，简直是记忆系统的最佳使用者！'
    }
    if (stats.memoryUsedCount >= 1 && stats.memoryUpdateCount >= 1) {
      return '反应迅速！事件后你很快找到了物品并更新了记忆，效率很高！'
    }
    if (stats.memoryUsedCount >= 1) {
      return '做得不错！你使用了记忆系统保存位置，下次试试更新记忆吧！'
    }
    return '记忆新手！这次你没有使用记忆系统，但仍然完成了任务。试试保存记忆，会更轻松！'
  }

  // 关卡完成或失败后进入记忆测试，最终分析在 Probe 完成后执行
  useEffect(() => {
    if (!briefingOpen && phase !== 'briefing' && (levelCompleted || levelFailed)) {
      if (levelCompleted && task?.completionText) {
        setNarrativeText(task.completionText)
      } else if (levelFailed && task?.failureText) {
        setNarrativeText(task.failureText)
      }

      const timer = setTimeout(() => {
        setShowStats(true)
      }, 1500)

      return () => clearTimeout(timer)
    }
  }, [levelCompleted, levelFailed, task, briefingOpen, phase])

  // 处理点击物体
  const handleEntityClick = useCallback(
    (entityId: string) => {
      const entity = useGameStore.getState().entities.find((e) => e.id === entityId)
      if (!entity) return

      const result = executePick(entityId)

      if (result.success) {
        addToast('success', `已拾取 ${entity.name}`)
      } else if (result.reason) {
        addToast('error', result.reason)
      }
    },
    [addToast]
  )

  // 处理点击容器
  const handleContainerClick = useCallback(
    (containerId: string) => {
      const state = useGameStore.getState()
      const container = state.task?.containers.find((c) => c.id === containerId)
      if (!container) return

      const result = executeContainerInteraction(containerId)

      if (result.success) {
        if (result.action === 'place') {
          addToast('success', `已放置到 ${container.name}`)
        } else {
          addToast('info', result.action === 'close' ? `已关闭 ${container.name}` : `已打开 ${container.name}`)
        }
      } else if (result.reason) {
        addToast('error', result.reason)
      }
    },
    [addToast]
  )

  return (
    <div className="flex-1 relative h-full min-h-0 w-full overflow-hidden" style={{ background: '#0f172a' }} data-testid="arena-page-root" data-phase={phase} data-briefing={briefingOpen ? 'open' : 'closed'}>
      {/* 3D 场景：始终渲染，briefing 阶段也提供背景画面，避免"后面白屏/透明"被误认为模型加载失败 */}
      <Suspense fallback={
        <div className="absolute inset-0 flex items-center justify-center" style={{ background: '#0f172a' }}>
          <div className="text-center text-slate-400 text-sm">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
            <div>3D 场景加载中...</div>
          </div>
        </div>
      }>
        <Scene3D onEntityClick={handleEntityClick} onContainerClick={handleContainerClick} />
      </Suspense>

      {/* HUD 覆盖层：只有 task ready + briefing 关闭后 再渲染，避免 briefing 阶段 HUD/Minimap 内部更新 UiStore → 循环
          D12 调查结论（2026-08-06）：
          - 非模块级循环导入，而是 render-time 写回循环：Minimap 的 fit effect
            （Minimap.tsx ~L115-122）在 dimensions/currentRoom 变化时调用
            setMinimapZoom/setMinimapPan 写回 UiStore，触发订阅链重渲染。
          - briefing 阶段容器尺寸未稳定（多次 setDimensions），每次变更级联
            effect→UiStore update→re-render，叠加其他 briefing 订阅可能触发
            "Maximum update depth exceeded" 或 WebGL Context Lost。
          - 已加 dimensions 有效性守卫（width/height > 0 才执行 fit）减轻级联。
          - 完全修复需将 fit 计算改为 lazy/derived（不写回 store），属 P1 后续工作。
          - 修复后方可将本条件改为：phase !== 'ended' && task */}
      {task && !briefingOpen && !isCalibrationMode && (
        <Suspense fallback={null}>
          <HUD />
        </Suspense>
      )}

      {/* 寻物方向指示器已禁用：原 ItemHintIndicator 会泄露未收集物品的房间、距离、方向，
          破坏 L2/L3 的空间回忆与记忆更新测量。需要时再设计不泄题的提示系统。 */}

      {/* 任务简报浮层 - 主人便签风格：
          briefingOpen 时始终渲染（即使 task 还没 ready），task 空时显示骨架卡片。
          这样用户任何时刻都能看到"开始任务"按钮（或禁用状态的骨架按钮），
          彻底杜绝之前 L282 提前 return 导致的 "根本看不到开始任务按钮" 问题。 */}
      {briefingOpen && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-40" data-testid="briefing-modal">
          <div className="max-w-[34rem] mx-4 w-full max-h-[88vh] overflow-y-auto overflow-x-hidden px-4 py-3 scrollbar-none" data-testid="briefing-scroll-container">
            {/* MEM-07 系统提示：不再显示给玩家，这是 AI 内部指令。仅 DEV 模式下可通过控制台查看 */}
            {/* {task?.systemPrompt ? (
              <div className="bg-slate-950/90 border border-cyan-500/30 rounded-lg p-3 mb-3 font-mono text-xs text-cyan-400">
                <span className="text-cyan-600">{'>'}</span> {task.systemPrompt}
              </div>
            ) : (
              <div className="bg-slate-950/70 border border-slate-700/50 rounded-lg p-3 mb-3 font-mono text-xs text-slate-500 animate-pulse">
                <span className="text-slate-600">{'>'}</span> MEM-07 系统初始化中...
              </div>
            )} */}

            {/* 主人便签（task 未 ready 时显示骨架卡片 + 转圈按钮，但仍保持便签样式） */}
            <div className="bg-yellow-100/95 rounded-lg p-6 shadow-2xl transform -rotate-1 border border-yellow-300/50">
              {task ? (
                <>
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-yellow-300/50">
                    <Badge className="bg-yellow-200 text-yellow-800 border-yellow-300">
                      {task.memoryTypes.join(' + ')}
                    </Badge>
                    <h2 className="text-xl font-bold text-yellow-900">{task.name}</h2>
                  </div>

                  <div className="text-yellow-900 text-sm leading-relaxed whitespace-pre-line mb-4">
                    {task.briefing}
                  </div>

                  {/* 操作提示 */}
                  <div className="bg-yellow-200/50 rounded-lg p-3 mb-4">
                    <h4 className="text-xs font-semibold text-yellow-800 mb-2 flex items-center gap-1">
                      <span>🎮</span> 操作提示
                    </h4>
                    <ul className="text-xs text-yellow-800 space-y-2">
                      <li className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <kbd className="px-1.5 py-0.5 bg-yellow-300/70 rounded text-yellow-900 text-[10px] font-mono">WASD</kbd>
                        <span>移动</span>
                        <kbd className="px-1.5 py-0.5 bg-yellow-300/70 rounded text-yellow-900 text-[10px] font-mono">点击画面</kbd>
                        <span>锁定后移动鼠标转视角</span>
                      </li>
                      <li className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <kbd className="px-1.5 py-0.5 bg-yellow-300/70 rounded text-yellow-900 text-[10px] font-mono">V</kbd>
                        <span>切换视角</span>
                        <kbd className="px-1.5 py-0.5 bg-yellow-300/70 rounded text-yellow-900 text-[10px] font-mono">E</kbd>
                        <span className="text-yellow-700">保存位置记忆</span>
                        <kbd className="px-1.5 py-0.5 bg-yellow-300/70 rounded text-yellow-900 text-[10px] font-mono">F</kbd>
                        <span>交互/拾放</span>
                      </li>
                      <li className="text-yellow-700 text-[11px] mt-1">
                        {task.id === 'task-clean-table'
                          ? '💡 第一关先靠近任意餐具按 E；记忆槽亮起后，再按 F 拾取和放置。'
                          : task.id === 'task-leave-home'
                            ? '💡 先巡查三个房间并分别按 E；三条位置记忆都建立后，才能开始取回。'
                            : '💡 记忆变红说明现实已变化：回旧位置核对，再找到物品按 E 更新。'}
                      </li>
                    </ul>
                  </div>
                </>
              ) : (
                <>
                  {/* !task 骨架：保持相同布局，避免 layout shift */}
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-yellow-300/50">
                    <div className="h-5 w-20 bg-yellow-200/60 rounded animate-pulse" />
                    <div className="flex-1 h-6 bg-yellow-300/50 rounded animate-pulse" />
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="h-3 w-full bg-yellow-200/60 rounded animate-pulse" />
                    <div className="h-3 w-11/12 bg-yellow-200/50 rounded animate-pulse" />
                    <div className="h-3 w-10/12 bg-yellow-200/40 rounded animate-pulse" />
                    <div className="h-3 w-9/12 bg-yellow-200/30 rounded animate-pulse" />
                  </div>
                  <div className="bg-yellow-200/50 rounded-lg p-3 mb-4 opacity-60">
                    <div className="h-3 w-20 bg-yellow-300/60 rounded mb-2 animate-pulse" />
                    <div className="h-2 w-full bg-yellow-300/40 rounded mb-1 animate-pulse" />
                    <div className="h-2 w-10/12 bg-yellow-300/40 rounded animate-pulse" />
                  </div>
                </>
              )}

              {/* 声音选择：首次进入时询问，选择后显示当前状态 + 切换按钮 */}
              {!audioPromptAnswered ? (
                <div className="bg-cyan-50 border border-cyan-300 rounded-lg p-3 mb-3" data-testid="audio-prompt">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base">🔊</span>
                    <span className="text-sm font-semibold text-cyan-900">是否开启游戏声音？</span>
                  </div>
                  <p className="text-[11px] text-cyan-700 mb-2">默认静音。游戏中可按 M 键或点右下角按钮随时切换。</p>
                  <div className="flex gap-2">
                    <Button
                      className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold"
                      data-testid="audio-prompt-enable"
                      onClick={() => answerAudioPrompt(true)}
                    >
                      开启声音
                    </Button>
                    <Button
                      className="flex-1 border border-cyan-400 text-cyan-700 hover:bg-cyan-100 bg-cyan-50/60 text-sm font-semibold"
                      data-testid="audio-prompt-disable"
                      onClick={() => answerAudioPrompt(false)}
                    >
                      保持静音
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-100/80 border border-slate-300 rounded-lg px-3 py-2 mb-3 flex items-center justify-between text-xs">
                  <span className="text-slate-700">
                    {audioEnabled ? '🔊 声音已开启' : '🔇 声音已关闭'}
                  </span>
                  <button
                    type="button"
                    className="text-cyan-700 hover:underline font-medium"
                    data-testid="audio-prompt-toggle"
                    onClick={() => toggleAudioEnabled()}
                  >
                    切换
                  </button>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  className={
                    task
                      ? 'flex-1 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold'
                      : 'flex-1 bg-gradient-to-r from-slate-400 to-slate-500 text-white font-bold cursor-not-allowed opacity-80'
                  }
                  data-testid="briefing-start-button"
                  disabled={!task}
                  onClick={() => {
                    if (!task) return
                    // 仅在用户已选择开启声音时初始化/恢复音频；否则保持静音
                    if (audioEnabled) {
                      initAudio()
                      void resumeAudioContexts()
                    }
                    startSession(task.id, task.name, task.briefing)
                    if (typeof startPlaying === 'function') startPlaying()
                    setBriefingOpen(false)
                    setShowTutorial(true)
                  }}
                >
                  {task ? (
                    '开始任务'
                  ) : (
                    <span className="inline-flex items-center justify-center gap-2">
                      <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      开始任务（准备中...）
                    </span>
                  )}
                </Button>
                <Button
                  className="border border-yellow-400 text-yellow-800 hover:bg-yellow-200/70 bg-yellow-100/60"
                  data-testid="back-to-tasks"
                  onClick={() => navigate('/tasks')}
                >
                  返回
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 新手引导浮层 - 开始任务后显示，首次进入关卡时 */}
      {!briefingOpen && phase === 'playing' && showTutorial && task && !isCalibrationMode && (
        <Suspense fallback={null}>
          <TutorialOverlay
            taskName={task.name}
            taskGoal={task.goals?.[0]?.description ?? '完成所有任务目标'}
            onClose={() => setShowTutorial(false)}
          />
        </Suspense>
      )}

      {/* 叙事弹窗 - 关卡完成/失败 */}
      {!briefingOpen && phase !== 'briefing' && narrativeText && !showStats && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 pointer-events-none">
          <div className={`max-w-md mx-4 p-6 rounded-2xl shadow-2xl border ${
            levelCompleted
              ? 'bg-gradient-to-br from-emerald-900/90 to-slate-900 border-emerald-500/30'
              : 'bg-gradient-to-br from-red-900/90 to-slate-900 border-red-500/30'
          }`}>
            <div className="text-center">
              {levelCompleted ? (
                <p className="text-2xl mb-2">✅</p>
              ) : (
                <p className="text-2xl mb-2">❌</p>
              )}
              <p className={`text-sm leading-relaxed ${
                levelCompleted ? 'text-emerald-200' : 'text-red-200'
              }`}>
                {narrativeText}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 结算统计弹窗 */}
      {!briefingOpen && phase !== 'briefing' && showStats && !isCalibrationMode && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 pointer-events-auto">
          <div className={`max-w-md mx-4 p-6 rounded-2xl shadow-2xl border ${
            levelCompleted
              ? 'bg-gradient-to-br from-emerald-900/95 to-slate-900 border-emerald-500/30'
              : 'bg-gradient-to-br from-red-900/95 to-slate-900 border-red-500/30'
          }`}>
            <div className="text-center mb-6">
              {levelCompleted ? (
                <p className="text-4xl mb-2">🎉</p>
              ) : (
                <p className="text-4xl mb-2">⏰</p>
              )}
              <h2 className={`text-xl font-bold ${
                levelCompleted ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {levelCompleted ? '任务完成！' : '时间到！'}
              </h2>
            </div>

            {/* 得分和评级 */}
            <div className="flex justify-center items-center gap-6 mb-6">
              <div className="text-center">
                <div className="text-xs text-slate-400">得分</div>
                <div className="text-3xl font-bold text-white">{stats.score}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-slate-400">评级</div>
                <div className="text-3xl font-bold text-yellow-400">
                  {getRank(stats.score).rank}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-slate-400">用时</div>
                <div className="text-2xl font-bold text-cyan-400">
                  {Math.round(stats.elapsedMs / 1000)}s
                </div>
              </div>
            </div>

            {/* 记忆表现 */}
            <div className="bg-slate-800/50 rounded-xl p-4 mb-4">
              <h3 className="text-sm font-semibold text-purple-300 mb-3 flex items-center gap-2">
                <span>🧠</span> 记忆表现
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-700/30 rounded-lg p-2 text-center">
                  <div className="text-xs text-slate-400">保存次数</div>
                  <div className="text-lg font-bold text-green-400">{stats.memoryUsedCount}</div>
                </div>
                <div className="bg-slate-700/30 rounded-lg p-2 text-center">
                  <div className="text-xs text-slate-400">有效记忆</div>
                  <div className="text-lg font-bold text-blue-400">
                    {memorySlots.filter(s => s && !s.outdated).length}
                  </div>
                </div>
                <div className="bg-slate-700/30 rounded-lg p-2 text-center">
                  <div className="text-xs text-slate-400">过期记忆</div>
                  <div className="text-lg font-bold text-red-400">
                    {memorySlots.filter(s => s && s.outdated).length}
                  </div>
                </div>
                <div className="bg-slate-700/30 rounded-lg p-2 text-center">
                  <div className="text-xs text-slate-400">更新次数</div>
                  <div className="text-lg font-bold text-yellow-400">{stats.memoryUpdateCount}</div>
                </div>
                <div className="bg-slate-700/30 rounded-lg p-2 text-center col-span-2">
                  <div className="text-xs text-slate-400">记忆效率</div>
                  <div className="text-lg font-bold text-purple-400">
                    {stats.memoryUsedCount > 0
                      ? Math.round((memorySlots.filter(s => s && !s.outdated).length / stats.memoryUsedCount) * 100)
                      : 0}%
                  </div>
                </div>
              </div>
            </div>

            {/* 个性化评价 */}
            <div className="bg-gradient-to-r from-purple-900/40 to-pink-900/40 rounded-xl p-4 mb-6 border border-purple-500/30">
              <h3 className="text-sm font-semibold text-purple-300 mb-2 flex items-center gap-2">
                <span>🤖</span> 你的机器人记忆策略
              </h3>
              <p className="text-sm text-slate-200 leading-relaxed">
                {getMemoryStrategyComment()}
              </p>
            </div>

            {/* 按钮 */}
            <div className="flex gap-3">
              <Button
                className="flex-1 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold"
                onClick={() => {
                  // 公开版本：跳过做题，直接进入结果分析页（ProbePage 会自动完成答卷并跳转）
                  navigate(`/probe/${taskId}`)
                }}
              >
                查看分析结果
              </Button>
              <Button
                variant="secondary"
                className="border border-slate-500 text-slate-300 hover:bg-slate-800"
                data-testid="result-back-to-tasks"
                onClick={() => {
                  stopAllAudioImmediate()
                  navigate('/tasks')
                }}
              >
                返回任务列表
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 对话弹窗：仅 briefing 关闭后才允许弹出，避免挡住 briefing 开始任务按钮。
          tutorial 打开时也不显示对话，保证"先关教程，再出现对话"的顺序。 */}
      {dialogState.isOpen && currentNode && !briefingOpen && !showTutorial && !isCalibrationMode && (
        <Suspense fallback={null}>
          <DialogBox
            node={currentNode}
            onChoice={handleChoice}
            onNext={handleNext}
            onClose={closeDialog}
          />
        </Suspense>
      )}

      {/* 暂停菜单：z-[60] 顶在 HUD/Dialog/校准弹层之上 */}
      <Suspense fallback={null}>
        <PauseMenu />
      </Suspense>
    </div>
  )
}
