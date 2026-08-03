// 3D Arena 页面 - 整合 3D 场景 + HUD + 操作面板
// ⚠️ 重要：useGameStore 的 selector **绝对不能**每次返回新对象。
// Zustand 通过 useSyncExternalStore 订阅，getSnapshot 引用每帧变化 → React 报 "Maximum update depth exceeded"。
// 解决方式：1) 单字段调用；2) 或把 selector 定义在组件外 + 用 useMemo 固定引用。

import { useEffect, useCallback, useState, lazy, Suspense } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useGameStore } from '../store/useGameStore'
import { useSessionStore } from '../store/useSessionStore'
import { useToastStore } from '../store/useToastStore'
import { useUiStore } from '../store/useUiStore'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { initAudio, resetRoomAmbientFlag, updateChaosAmbient as updateChaosAmbientSfx } from '../audio/sfx'
import { resetArenaCleanupFlag, updateBgmState, playBgm, stopBgm } from '../audio/bgm'
import { playRoomAmbient, stopAmbient } from '../audio/ambient'
import { stopAllAudioImmediate, resumeAudioContexts } from '../audio/audioManager'
import { executeContainerInteraction, executePick } from '../game/commands'
import { getTaskById, isHiddenTaskId } from '../data/tasks'
import { useDialog } from '../dialog/useDialog'
import { startAutoSave, stopAutoSave } from '../save/saveSystem'
import { subscribeEvent } from '../engine/eventBus'

const Scene3D = lazy(() => import('../components/arena3d/Scene3D').then((m) => ({ default: m.Scene3D })))
const HUD = lazy(() => import('../components/arena3d/HUD').then((m) => ({ default: m.HUD })))
const DialogBox = lazy(() => import('../components/dialog/DialogBox').then((m) => ({ default: m.DialogBox })))
const ItemHintIndicator = lazy(() => import('../components/arena3d/ItemHintIndicator').then((m) => ({ default: m.ItemHintIndicator })))

export function ArenaPage() {
  const { taskId } = useParams<{ taskId: string }>()
  const navigate = useNavigate()
  const location = useLocation()

  const audioEnabled = useUiStore((s) => s.audioEnabled)

  // 所有状态都用「单字段 selector」，绝对不要每次创建新对象。
  const task = useGameStore((s) => s.task)
  const phase = useGameStore((s) => s.phase)
  const currentRoom = useGameStore((s) => s.currentRoom)
  const chaosValue = useGameStore((s) => s.chaosValue)
  const achievedGoalIds = useGameStore((s) => s.achievedGoalIds)
  const combo = useGameStore((s) => s.combo)
  const wrongPlaceCount = useGameStore((s) => s.wrongPlaceCount)
  const activeFlowHint = useGameStore((s) => s.activeFlowHint)
  const memorySlots = useGameStore((s) => s.memorySlots)
  const levelCompleted = useGameStore((s) => s.levelCompleted)
  const levelFailed = useGameStore((s) => s.levelFailed)
  // 函数引用：Zustand 中 action 函数引用是稳定的（set/get 绑定在 slice 创建时），直接安全解构
  const initializeTask = useGameStore((s) => s.initializeTask)
  const startPlaying = useGameStore((s) => s.startPlaying)
  const saveCurrentGame = useGameStore((s) => s.saveCurrentGame)
  const getGameStats = useGameStore((s) => s.getGameStats)

  // ⚠️ 用单字段 selector 避免 getSnapshot 引用变化 → 无限循环
  const startSession = useSessionStore((s) => s.startSession)
  const addToast = useToastStore((s) => s.addToast)

  const [briefingOpen, setBriefingOpen] = useState(true)
  const [narrativeText, setNarrativeText] = useState<string | null>(null)
  const [showStats, setShowStats] = useState(false)

  const {
    dialogState,
    currentNode,
    closeDialog,
    triggerDialog,
    handleChoice,
    handleNext,
  } = useDialog()

  useEffect(() => {
    if (taskId && import.meta.env.PROD && isHiddenTaskId(taskId)) {
      navigate('/tasks', { replace: true })
    }
  }, [taskId, navigate])

  useEffect(() => {
    // briefingOpen 守卫：ArenaPage 重新挂载时 Zustand store 中 phase 可能仍为上一局的 'playing'，
    // 此时不应触发 dialog。只有在 briefing 关闭后（用户点击开始任务）才触发。
    if (phase === 'playing' && task && !briefingOpen) {
      triggerDialog('start', task.id)
    }
  }, [phase, task, briefingOpen, triggerDialog])

  useEffect(() => {
    if (phase === 'playing' && !briefingOpen) {
      triggerDialog('roomEnter', currentRoom)
      if (audioEnabled) {
        void resumeAudioContexts()
        playRoomAmbient(currentRoom, { forceRestart: false })
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
    setBriefingOpen(true)
    if (closeDialog) closeDialog()
    initializeTask(taskId)
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
      saveCurrentGame()
    }

    const handleBeforeUnload = () => {
      saveCurrentGame()
      handleCleanup()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      handleCleanup()
    }
  }, [saveCurrentGame])

  // probing 阶段（任务完成/失败）fade out BGM/Ambient，立即停 chaos 低频
  useEffect(() => {
    if (phase === 'probing' || phase === 'analyzing' || phase === 'result' || phase === 'aborted') {
      try { updateChaosAmbientSfx(0) } catch { /* ignore */ }
      stopBgm({ fadeSeconds: 0.5 })
      stopAmbient({ fadeSeconds: 0.3 })
    }
  }, [phase])

  // 自动保存
  useEffect(() => {
    if (phase === 'playing') {
      startAutoSave(() => {
        saveCurrentGame()
      })
    }
    return () => {
      stopAutoSave()
    }
  }, [phase, saveCurrentGame])

  // FIX-3 兜底：简报已关闭（或跳过）但 phase 还在 briefing 时，强制进入 playing
  // 避免 E2E/自动化/特殊入口下，简报按钮没点导致所有指令被 ensurePlaying 拦截
  useEffect(() => {
    if (!briefingOpen && phase === 'briefing' && task) {
      console.warn('[FIX-3] briefing 已关闭但 phase=briefing，兜底补 startPlaying() 调用')
      startPlaying()
    }
  }, [briefingOpen, phase, task, startPlaying])

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
    const stats = getGameStats()
    if (stats.levelFailed) {
      return '时间到了！下次记得更快一点找到钥匙哦！'
    }
    if (stats.memoryUsedCount >= 2 && stats.memoryUpdateCount >= 1) {
      return '记忆大师！你完美地保存并更新了记忆，简直是记忆系统的最佳使用者！'
    }
    if (stats.memoryUsedCount >= 1 && stats.memoryUpdateCount >= 1) {
      return '反应迅速！猫事件后你很快找到了钥匙并更新了记忆，效率很高！'
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
    <div className="flex-1 relative h-full min-h-screen w-full overflow-hidden" style={{ background: '#0f172a' }} data-testid="arena-page-root">
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
          TODO: 修复 Minimap/UiStore 循环后改为：phase !== 'ended' && task */}
      {task && !briefingOpen && (
        <Suspense fallback={null}>
          <HUD />
        </Suspense>
      )}

      {/* 寻物方向指示器：task ready + briefing closed + playing 时才显示 */}
      {task && !briefingOpen && phase === 'playing' && (
        <Suspense fallback={null}>
          <ItemHintIndicator />
        </Suspense>
      )}

      {/* 任务简报浮层 - 主人便签风格：
          briefingOpen 时始终渲染（即使 task 还没 ready），task 空时显示骨架卡片。
          这样用户任何时刻都能看到"开始任务"按钮（或禁用状态的骨架按钮），
          彻底杜绝之前 L282 提前 return 导致的 "根本看不到开始任务按钮" 问题。 */}
      {briefingOpen && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-40" data-testid="briefing-modal">
          <div className="max-w-lg mx-4 w-full">
            {/* MEM-07 系统提示（task 未 ready 时灰掉占位，不消失） */}
            {task?.systemPrompt ? (
              <div className="bg-slate-950/90 border border-cyan-500/30 rounded-lg p-3 mb-3 font-mono text-xs text-cyan-400">
                <span className="text-cyan-600">{'>'}</span> {task.systemPrompt}
              </div>
            ) : (
              <div className="bg-slate-950/70 border border-slate-700/50 rounded-lg p-3 mb-3 font-mono text-xs text-slate-500 animate-pulse">
                <span className="text-slate-600">{'>'}</span> MEM-07 系统初始化中...
              </div>
            )}

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
                    <ul className="text-xs text-yellow-800 space-y-1">
                      <li className="flex items-center gap-2">
                        <kbd className="px-1.5 py-0.5 bg-yellow-300/70 rounded text-yellow-900 text-[10px] font-mono">WASD</kbd>
                        <span>移动</span>
                        <kbd className="px-1.5 py-0.5 bg-yellow-300/70 rounded text-yellow-900 text-[10px] font-mono">拖动鼠标</kbd>
                        <span>转视角</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <kbd className="px-1.5 py-0.5 bg-yellow-300/70 rounded text-yellow-900 text-[10px] font-mono">V</kbd>
                        <span>切换视角</span>
                        <kbd className="px-1.5 py-0.5 bg-yellow-300/70 rounded text-yellow-900 text-[10px] font-mono">E</kbd>
                        <span>保存记忆</span>
                        <kbd className="px-1.5 py-0.5 bg-yellow-300/70 rounded text-yellow-900 text-[10px] font-mono">F</kbd>
                        <span>交互</span>
                      </li>
                      <li className="text-yellow-700 text-[11px] mt-1">
                        💡 有些物品藏在抽屉里，靠近后按 F 打开抽屉，再按 F 拿取物品
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
                    initAudio()
                    void resumeAudioContexts()
                    startSession(task.id, task.name, task.briefing)
                    startPlaying()
                    setBriefingOpen(false)
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
      {!briefingOpen && phase !== 'briefing' && showStats && (
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
                <div className="text-3xl font-bold text-white">{getGameStats().score}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-slate-400">评级</div>
                <div className="text-3xl font-bold text-yellow-400">
                  {getGameStats().score >= 900 ? 'S' : getGameStats().score >= 700 ? 'A' : getGameStats().score >= 500 ? 'B' : getGameStats().score >= 300 ? 'C' : 'D'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-slate-400">用时</div>
                <div className="text-2xl font-bold text-cyan-400">
                  {Math.round(getGameStats().elapsedMs / 1000)}s
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
                  <div className="text-lg font-bold text-green-400">{getGameStats().memoryUsedCount}</div>
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
                  <div className="text-lg font-bold text-yellow-400">{getGameStats().memoryUpdateCount}</div>
                </div>
                <div className="bg-slate-700/30 rounded-lg p-2 text-center col-span-2">
                  <div className="text-xs text-slate-400">记忆效率</div>
                  <div className="text-lg font-bold text-purple-400">
                    {getGameStats().memoryUsedCount > 0
                      ? Math.round((memorySlots.filter(s => s && !s.outdated).length / getGameStats().memoryUsedCount) * 100)
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

      {/* 对话弹窗：仅 briefing 关闭后才允许弹出，避免挡住 briefing 开始任务按钮 */}
      {dialogState.isOpen && currentNode && !briefingOpen && (
        <Suspense fallback={null}>
          <DialogBox
            node={currentNode}
            onChoice={handleChoice}
            onNext={handleNext}
            onClose={closeDialog}
          />
        </Suspense>
      )}
    </div>
  )
}
