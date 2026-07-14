// 3D Arena 页面 - 整合 3D 场景 + HUD + 操作面板

import { useEffect, useCallback, useState, lazy, Suspense } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/useGameStore'
import { useSessionStore } from '../store/useSessionStore'
import { useToastStore } from '../store/useToastStore'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { initAudio, stopAllSfx, resetRoomAmbientFlag } from '../audio/sfx'
import { stopBgmImmediate, resetArenaCleanupFlag, updateBgmState } from '../audio/bgm'
import { playRoomAmbient, stopAmbientImmediate } from '../audio/ambient'
import { executeContainerInteraction, executePick } from '../game/commands'
import { getTaskById } from '../data/tasks'
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

  const {
    task,
    phase,
    currentRoom,
    chaosValue,
    achievedGoalIds,
    combo,
    wrongPlaceCount,
    activeFlowHint,
    initializeTask,
    startPlaying,
    levelCompleted,
    levelFailed,
    saveCurrentGame,
    getGameStats,
    memorySlots,
  } = useGameStore()

  const { startSession } = useSessionStore()
  const { addToast } = useToastStore()

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
    // briefingOpen 守卫：ArenaPage 重新挂载时 Zustand store 中 phase 可能仍为上一局的 'playing'，
    // 此时不应触发 dialog。只有在 briefing 关闭后（用户点击开始任务）才触发。
    if (phase === 'playing' && task && !briefingOpen) {
      triggerDialog('start', task.id)
    }
  }, [phase, task, briefingOpen, triggerDialog])

  useEffect(() => {
    if (phase === 'playing' && !briefingOpen) {
      triggerDialog('roomEnter', currentRoom)
      playRoomAmbient(currentRoom)
    }
  }, [currentRoom, phase, briefingOpen, triggerDialog])

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
    }
  }, [chaosValue, phase, task, achievedGoalIds])

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

  // 初始化任务
  useEffect(() => {
    if (!taskId || !getTaskById(taskId)) {
      navigate('/tasks', { replace: true })
      return
    }
    setNarrativeText(null)
    initializeTask(taskId)
    setBriefingOpen(true)
  }, [taskId, initializeTask, navigate])

  // 离开 ArenaPage 时停止所有音频，避免浏览器后退后继续播放
  useEffect(() => {
    resetArenaCleanupFlag()
    resetRoomAmbientFlag()

    const handleCleanup = () => {
      ;(window as any).__arenaCleanupCalled = true
      ;(window as any).__lastCleanupTime = Date.now()
      ;(window as any).__cleanupCallCount = ((window as any).__cleanupCallCount || 0) + 1
      stopBgmImmediate()
      stopAmbientImmediate()
      stopAllSfx()
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
    if (levelCompleted || levelFailed) {
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
  }, [levelCompleted, levelFailed, task])

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

  if (!task) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-text-muted">加载中...</p>
      </div>
    )
  }

  return (
    <div className="flex-1 relative h-full overflow-hidden">
      {/* 3D 场景 */}
      <div className="absolute inset-0">
        <Suspense fallback={null}>
          <Scene3D
            onEntityClick={handleEntityClick}
            onContainerClick={handleContainerClick}
          />
        </Suspense>
      </div>

      {/* HUD 覆盖层 */}
      <Suspense fallback={null}>
        <HUD />
      </Suspense>

      {/* 寻物方向指示器 */}
      {!briefingOpen && phase === 'playing' && (
        <Suspense fallback={null}>
          <ItemHintIndicator />
        </Suspense>
      )}

      {/* 游戏中返回任务列表按钮 - 移到左上角 */}
      {!briefingOpen && task && phase === 'playing' && (
        <button
          data-testid="back-to-tasks"
          onClick={() => {
            stopBgmImmediate()
            stopAllSfx()
            navigate('/tasks')
          }}
          className="absolute top-4 left-4 z-30 pointer-events-auto bg-slate-900/70 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs text-slate-400 hover:text-white transition-colors shadow-lg border border-slate-700/50"
        >
          ← 返回任务列表
        </button>
      )}

      {/* 任务简报浮层 - 主人便签风格 */}
      {briefingOpen && task && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-40" data-testid="briefing-modal">
          <div className="max-w-lg mx-4 w-full">
            {/* MEM-07 系统提示 */}
            {task.systemPrompt && (
              <div className="bg-slate-950/90 border border-cyan-500/30 rounded-lg p-3 mb-3 font-mono text-xs text-cyan-400">
                <span className="text-cyan-600">{'>'}</span> {task.systemPrompt}
              </div>
            )}

            {/* 主人便签 */}
            <div className="bg-yellow-100/95 rounded-lg p-6 shadow-2xl transform -rotate-1 border border-yellow-300/50">
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

              <div className="flex gap-3">
                <Button
                  className="flex-1 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold"
                  data-testid="briefing-start-button"
                  onClick={() => {
                    initAudio()
                    startSession(task.id, task.name, task.briefing)
                    startPlaying()
                    setBriefingOpen(false)
                  }}
                >
                  开始任务
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
      {narrativeText && !showStats && (
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
      {showStats && (
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
                  navigate(`/probe/${taskId}`)
                }}
              >
                继续
              </Button>
              <Button
                variant="secondary"
                className="border border-slate-500 text-slate-300 hover:bg-slate-800"
                onClick={() => {
                  stopBgmImmediate()
                  stopAllSfx()
                  navigate('/tasks')
                }}
              >
                返回
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 对话弹窗 */}
      {dialogState.isOpen && currentNode && (
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
