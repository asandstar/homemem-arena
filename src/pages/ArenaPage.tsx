// 3D Arena 页面 - 整合 3D 场景 + HUD + 操作面板

import { useEffect, useCallback, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/useGameStore'
import { useSessionStore } from '../store/useSessionStore'
import { useToastStore } from '../store/useToastStore'
import { Scene3D } from '../components/arena3d/Scene3D'
import { HUD } from '../components/arena3d/HUD'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { initAudio, stopAllSfx, resetRoomAmbientFlag } from '../audio/sfx'
import { stopBgmImmediate, resetArenaCleanupFlag } from '../audio/bgm'
import { executeContainerInteraction, executePick } from '../game/commands'
import { getTaskById } from '../data/tasks'
import { DialogBox } from '../components/dialog/DialogBox'
import { useDialog } from '../dialog/useDialog'

export function ArenaPage() {
  const { taskId } = useParams<{ taskId: string }>()
  const navigate = useNavigate()

  const {
    task,
    phase,
    currentRoom,
    initializeTask,
    startPlaying,
    levelCompleted,
    levelFailed,
  } = useGameStore()

  const { startSession } = useSessionStore()
  const { addToast } = useToastStore()

  const [briefingOpen, setBriefingOpen] = useState(true)
  const [narrativeText, setNarrativeText] = useState<string | null>(null)

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
    }
  }, [currentRoom, phase, briefingOpen, triggerDialog])

  // 初始化任务
  useEffect(() => {
    if (!taskId || !getTaskById(taskId)) {
      navigate('/tasks', { replace: true })
      return
    }
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
      stopAllSfx()
    }

    const handleBeforeUnload = () => {
      handleCleanup()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      handleCleanup()
    }
  }, [])

  // 关卡完成或失败后进入记忆测试，最终分析在 Probe 完成后执行
  useEffect(() => {
    if (levelCompleted || levelFailed) {
      if (levelCompleted && task?.completionText) {
        setNarrativeText(task.completionText)
      } else if (levelFailed && task?.failureText) {
        setNarrativeText(task.failureText)
      }

      const timer = setTimeout(() => {
        navigate(`/probe/${taskId}`)
      }, 1500)

      return () => clearTimeout(timer)
    }
  }, [levelCompleted, levelFailed, task, taskId, navigate])

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
        <Scene3D
          onEntityClick={handleEntityClick}
          onContainerClick={handleContainerClick}
        />
      </div>

      {/* HUD 覆盖层 */}
      <HUD />

      {/* 游戏中返回任务列表按钮 */}
      {!briefingOpen && task && phase === 'playing' && (
        <button
          data-testid="back-to-tasks"
          onClick={() => {
            stopBgmImmediate()
            stopAllSfx()
            navigate('/tasks')
          }}
          className="absolute top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-auto bg-slate-900/70 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs text-slate-400 hover:text-white transition-colors shadow-lg border border-slate-700/50"
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
      {narrativeText && (
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

      {dialogState.isOpen && currentNode && (
        <DialogBox
          node={currentNode}
          onClose={closeDialog}
          onChoice={handleChoice}
          onNext={handleNext}
        />
      )}

    </div>
  )
}
