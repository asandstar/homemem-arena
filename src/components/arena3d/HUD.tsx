import { useEffect, useCallback, useState } from 'react'
import { useGameStore } from '../../store/useGameStore'
import { useUiStore } from '../../store/useUiStore'
import { Target, Clock, CheckCircle2, AlertTriangle, Zap, Package, Keyboard, Brain, Lock, Unlock, Trash2, ChevronDown, ChevronUp, Skull, AlertCircle, X, Cat, Smartphone, RotateCcw, Volume2, VolumeX, HelpCircle, Eye, EyeOff, MapPin, Box, History, Play } from 'lucide-react'
import { Minimap } from './Minimap'
import { initAudio, updateRoomAmbient } from '../../audio/sfx'
import { playBgm, setBgmVolume, getBgmVolume } from '../../audio/bgm'
import type { GoalSpec } from '../../types/task'
import { HelpPanel } from '../help/HelpPanel'
import { useSessionStore } from '../../store/useSessionStore'
import {
  findNearestInteractableContainer,
  findNearestInteractableEntity,
} from '../../game/interactionTargets'
import { findActiveGoal } from '../../game/flow'

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

function getMemoryTypeIcon(memoryType?: string) {
  switch (memoryType) {
    case 'spatial': return <MapPin size={10} className="text-green-400" />
    case 'object': return <Box size={10} className="text-purple-400" />
    case 'temporal': return <History size={10} className="text-blue-400" />
    case 'procedural': return <Play size={10} className="text-orange-400" />
    default: return null
  }
}



export function HUD() {
  const {
    task,
    phase,
    currentRoom,
    chaosValue,
    score,
    combo,
    memorySlots,
    heldEntityId,
    entities,
    containerStates,
    feedback,
    hideFeedback,
    lockMemorySlot,
    clearMemorySlot,
    visitedRooms,
    robotPosition,
    robotRotation,
    savingMemorySlotIndex,
    flashingSlotIndex,
    elapsedMs,
    floatingTexts,
    eventToasts,
    resetTask,
    isGoalAchieved,
    achievedGoalIds,
    activeFlowHint,
  } = useGameStore()
  const { currentSession } = useSessionStore()

  const {
    taskPanelOpen,
    eventLogOpen,
    minimapOpen,
    controlsOpen,
    memoryBarOpen,
    hudHidden,
    audioEnabled,
    toggleTaskPanel,
    toggleEventLog,
    toggleMinimap,
    toggleControls,
    toggleMemoryBar,
    toggleHudHidden,
    toggleAudioEnabled,
  } = useUiStore()

  const heldEntity = heldEntityId ? entities.find(e => e.id === heldEntityId) : null
  const nearbyEntity = findNearestInteractableEntity(entities, robotPosition, currentRoom)
  const nearbyContainer = findNearestInteractableContainer(task, robotPosition, currentRoom)
  const interactionPrompt = heldEntity && nearbyContainer
    ? `放入 ${nearbyContainer.name}`
    : !heldEntity && nearbyEntity
      ? `拾取 ${nearbyEntity.name}`
      : !heldEntity && nearbyContainer
        ? `${containerStates[nearbyContainer.id]?.open ? '关闭' : '打开'} ${nearbyContainer.name}`
        : null

  const [helpOpen, setHelpOpen] = useState(false)
  const [helpDefaultTab, setHelpDefaultTab] = useState('controls')
  const [memoryTooltipOpen, setMemoryTooltipOpen] = useState(false)
  const [chaosTooltipOpen, setChaosTooltipOpen] = useState(false)
  const [isCompact, setIsCompact] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [minimapFullscreen, setMinimapFullscreen] = useState(false)

  useEffect(() => {
    const checkCompact = () => {
      setIsCompact(window.innerWidth < 1280)
      setIsMobile(window.innerWidth < 768)
    }
    checkCompact()
    window.addEventListener('resize', checkCompact)
    return () => window.removeEventListener('resize', checkCompact)
  }, [])

  const openHelp = useCallback((tab = 'controls') => {
    setHelpDefaultTab(tab)
    setHelpOpen(true)
  }, [])

  function formatEventMessage(event: any): string {
    if (!event) return '事件触发'
    switch (event.type) {
      case 'scripted_event':
      case 'move-entity':
      case 'hide-entity':
      case 'show-entity':
      case 'message':
        return event.description || event.message || '脚本事件触发'
      case 'action':
        switch (event.action) {
          case 'pick': return `拾取：${event.objectName || event.targetId || '物体'}`
          case 'place': return `放置：${event.objectName || event.targetId || '物体'}`
          case 'open': return `打开：${event.objectName || event.targetId || '容器'}`
          case 'close': return `关闭：${event.objectName || event.targetId || '容器'}`
          case 'use': return `使用：${event.objectName || event.targetId || '物体'}`
          default: return '执行操作'
        }
      case 'memory_write':
        return `保存记忆：${event.content || event.objectName || event.memoryType || '新记忆'}`
      case 'task_progress':
        return `目标完成：${event.description || event.goalId || '未知目标'}`
      case 'observation':
        return `观察到 ${event.visibleEntityIds?.length || 0} 个物体`
      case 'movement':
        return `移动到 ${event.toRoom || '新区域'}`
      default:
        return event.message || event.description || event.type || '事件触发'
    }
  }

  const achievedGoals = task?.goals.filter((goal: GoalSpec) => isGoalAchieved(goal)).length ?? 0
  const totalGoals = task?.goals.length ?? 0
  const progress = totalGoals > 0 ? (achievedGoals / totalGoals) * 100 : 0
  const roomUncollectedItems = entities.filter(e =>
    e.type === 'object' &&
    e.currentRoom === currentRoom &&
    (e.status === 'free' || e.status === 'hidden')
  )
  const isRoomCleared = roomUncollectedItems.length === 0
  const activeGoal = findActiveGoal(
    task,
    entities.map((entity) => ({
      configId: entity.configId,
      status: entity.status,
      currentRoom: entity.currentRoom,
      placedIn: entity.placedIn,
      category: entity.category,
      properties: entity.properties,
    })),
    achievedGoalIds,
  )
  const displayTimeMs = task?.timeLimit
    ? Math.max(0, task.timeLimit * 1000 - elapsedMs)
    : elapsedMs

  const chaosColor = chaosValue < 30 ? 'from-green-500 to-emerald-500' : chaosValue < 60 ? 'from-yellow-500 to-orange-500' : 'from-red-500 to-pink-500'

  const getRating = (score: number): string => {
    if (score >= 900) return 'S'
    if (score >= 700) return 'A'
    if (score >= 500) return 'B'
    if (score >= 300) return 'C'
    return 'D'
  }

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
    if (helpOpen) {
      if (e.key === 'Escape') {
        setHelpOpen(false)
      }
      return
    }
    switch (e.key.toLowerCase()) {
      case 'tab':
        e.preventDefault()
        toggleTaskPanel()
        break
      case 'r':
        e.preventDefault()
        toggleEventLog()
        break
      case 'h':
        e.preventDefault()
        toggleHudHidden()
        break
      case 'escape':
        if (hudHidden) {
          toggleHudHidden()
        }
        break
    }
  }, [helpOpen, toggleTaskPanel, toggleEventLog, toggleHudHidden, hudHidden])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  useEffect(() => {
    if (phase === 'playing' && task) {
      playBgm(task.id)
    }
  }, [phase, task])

  useEffect(() => {
    if (phase === 'playing') {
      updateRoomAmbient(currentRoom)
    }
  }, [currentRoom, phase])

  

  if (hudHidden) {
    return (
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-auto">
          <button
            onClick={toggleHudHidden}
            className="bg-slate-900/70 backdrop-blur-sm rounded-lg px-4 py-2 text-xs text-slate-400 hover:text-white transition-colors"
          >
            按 H 或 ESC 恢复 HUD
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="absolute inset-0 pointer-events-none" data-testid="arena-hud">
      {chaosValue > 20 && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: Math.min(1, (chaosValue - 20) / 80),
          }}
        >
          <div className="absolute inset-0 chaos-vignette" />
          {chaosValue > 50 && (
            <div
              className="absolute inset-0"
              style={{
                opacity: Math.min(0.15, (chaosValue - 50) / 100),
                mixBlendMode: 'overlay',
              }}
            >
              <div className="absolute inset-0 chaos-noise" />
              <div className="absolute inset-0 chaos-scanlines" />
            </div>
          )}
        </div>
      )}

      <div className={`absolute top-4 left-4 pointer-events-auto transition-all duration-300 ${isMobile ? 'max-w-[140px]' : isCompact ? 'max-w-[200px]' : 'max-w-[280px]'} w-full z-20`} data-testid="task-panel">
        <div className="bg-slate-900/95 backdrop-blur-md rounded-xl p-3 shadow-xl border border-purple-500/30">
          <div className="flex items-center justify-between mb-2">
            <h2 className={`font-bold text-white flex items-center gap-2 ${isMobile ? 'text-xs' : 'text-sm'}`}>
              <Target size={isMobile ? 12 : 16} className="text-purple-400" />
              {task?.name ?? '任务'}
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleTaskPanel}
                className="p-1 rounded hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
                title="按 Tab 切换"
              >
                <X size={isMobile ? 10 : 14} />
              </button>
            </div>
          </div>
          {task?.goals && task.goals.length > 0 && (
            <div className="space-y-1 overflow-y-auto pr-1" style={{ maxHeight: isMobile ? '10vh' : isCompact ? '15vh' : '25vh' }}>
              <div className="flex items-center justify-between px-2 py-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-300/80">目标进度</span>
                <span className="text-[10px] font-bold text-purple-300">{achievedGoals}/{totalGoals}</span>
              </div>
              {taskPanelOpen && (
                <>
                  {activeGoal && (
                    <div className="mb-2 rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-2.5 py-2">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-cyan-300">
                        当前专注{activeGoal.stage ? ` · ${activeGoal.stage}` : ''}
                      </div>
                      <div className="mt-0.5 text-xs font-semibold leading-relaxed text-white">
                        {activeGoal.description}
                      </div>
                      {activeFlowHint?.goalId === activeGoal.id && (
                        <div className="mt-1.5 border-t border-cyan-300/20 pt-1.5 text-[11px] leading-relaxed text-cyan-100/90">
                          {activeFlowHint.message}
                        </div>
                      )}
                    </div>
                  )}
                  {task.goals.map((goal: GoalSpec) => {
                    const isAchieved = isGoalAchieved(goal)
                    return (
                      <div
                        key={goal.id}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded transition-all ${
                          isAchieved
                            ? 'bg-green-500/10'
                            : 'hover:bg-slate-800/50'
                        }`}
                      >
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isAchieved
                            ? 'bg-green-500 border-green-500 animate-pulse'
                            : 'border-2 border-slate-500 bg-slate-800/30'
                        }`}>
                          {isAchieved && <CheckCircle2 size={12} className="text-white" />}
                        </span>
                        <span className={`text-xs font-medium flex-1 ${
                          isAchieved
                            ? 'text-green-400 line-through opacity-60'
                            : 'text-white'
                        }`}>
                          {goal.description}
                        </span>
                        {getMemoryTypeIcon(goal.memoryType)}
                      </div>
                    )
                  })}
                  <div className="text-[10px] text-purple-400/60 mt-2 pt-2 border-t border-slate-700/50 text-center">
                    按 Tab 隐藏任务面板 · 按 R 显示事件日志
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className={`absolute ${isMobile ? 'top-16' : 'top-4'} left-1/2 -translate-x-1/2 pointer-events-auto z-10`}>
        <div className={`bg-slate-900/90 backdrop-blur-md rounded-xl shadow-xl border border-slate-700/50 w-full ${isMobile ? 'max-w-[280px] p-2' : 'max-w-[400px] p-4'}`}>
          <div className={`flex items-center justify-between mb-2 ${isMobile ? 'gap-1' : 'mb-3 gap-3'}`}>
            <div className="flex items-center gap-2">
              <div className="text-center">
                <div className={`${isMobile ? 'text-[8px]' : 'text-[10px]'} text-slate-400`}>得分</div>
                <div className={`font-bold text-white ${isMobile ? 'text-lg' : 'text-2xl'}`}>{score}</div>
              </div>
              <div className={`w-px bg-slate-700 ${isMobile ? 'h-6' : 'h-8'}`} />
              <div className="text-center">
                <div className={`${isMobile ? 'text-[8px]' : 'text-[10px]'} text-slate-400`}>评级</div>
                <div className={`font-bold ${isMobile ? 'text-lg' : 'text-2xl'} ${getRating(score) === 'S' ? 'text-yellow-400' : getRating(score) === 'A' ? 'text-green-400' : getRating(score) === 'B' ? 'text-blue-400' : getRating(score) === 'C' ? 'text-purple-400' : 'text-slate-400'}`}>
                  {getRating(score)}
                </div>
              </div>
              <div className={`w-px bg-slate-700 ${isMobile ? 'h-6' : 'h-8'}`} />
              <div className="text-center">
                <div className={`${isMobile ? 'text-[8px]' : 'text-[10px]'} text-slate-400`}>时间</div>
                <div className={`font-bold text-slate-200 flex items-center gap-1 ${isMobile ? 'text-sm' : 'text-lg'}`}>
                  <Clock size={isMobile ? 10 : 12} className="text-cyan-400" />
                  {formatDuration(displayTimeMs)}
                </div>
              </div>
              {!isMobile && (
                <>
                  <div className="w-px h-8 bg-slate-700" />
                  <div className="text-center">
                    <div className="text-[10px] text-slate-400">位置</div>
                    <div className="text-sm font-semibold text-purple-300">{currentRoom}</div>
                  </div>
                </>
              )}
            </div>
            {combo > 0 && (
              <div
                key={combo}
                className="flex items-center gap-1 bg-yellow-500/20 px-3 py-1.5 rounded-full animate-combo-pop"
              >
                <Zap size={14} className="text-yellow-400" />
                <span className="text-yellow-400 font-bold text-sm">{combo} COMBO!</span>
              </div>
            )}
          </div>
          <div
            className="flex items-center justify-between mb-2 cursor-help relative"
            data-testid="chaos-meter"
            onMouseEnter={() => setChaosTooltipOpen(true)}
            onMouseLeave={() => setChaosTooltipOpen(false)}
            onClick={() => {
              setChaosTooltipOpen(false)
              openHelp('chaos')
            }}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle size={14} className={chaosValue > 70 ? 'text-red-400 animate-pulse' : chaosValue > 40 ? 'text-yellow-400' : 'text-green-400'} />
              <span className="text-xs font-semibold text-white">混乱值</span>
              <HelpCircle size={10} className="text-slate-500" />
            </div>
            <span className={`text-xs font-bold ${chaosValue > 70 ? 'text-red-400' : chaosValue > 40 ? 'text-yellow-400' : 'text-green-400'}`}>
              {Math.floor(chaosValue)}%
            </span>
            {chaosTooltipOpen && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-slate-800/95 border border-red-500/30 rounded-lg p-3 shadow-xl z-20">
                <p className="text-xs text-white font-medium mb-2">⚠️ 混乱值</p>
                <p className="text-xs text-slate-300 leading-relaxed">
                  代表系统的失控程度。越高物品越容易被移动，记忆也越容易过期。
                </p>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${chaosColor} transition-all duration-300`}
                style={{ width: `${chaosValue}%` }}
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs text-slate-400">{achievedGoals}/{totalGoals}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute top-4 right-4 pointer-events-auto z-20" data-testid="minimap" style={{ width: isMobile ? '160px' : isCompact ? '220px' : '280px' }}>
        <div className={`bg-slate-900/90 backdrop-blur-md rounded-xl shadow-xl border border-slate-700/50 ${isMobile ? 'p-2' : 'p-3'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400">小地图</span>
            <button
              onClick={toggleMinimap}
              className="p-1 rounded hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
              title="收起小地图"
            >
              {minimapOpen ? <Eye size={12} /> : <EyeOff size={12} />}
            </button>
          </div>
          {minimapOpen && (
            <Minimap
              currentRoom={currentRoom}
              visitedRooms={Array.from(visitedRooms)}
              robotPosition={robotPosition}
              robotRotation={robotRotation}
              observedObjects={entities.filter((e) => e.currentRoom === currentRoom && e.status !== 'hidden' && e.status !== 'held')}
              taskRooms={task?.rooms}
              isMobile={isMobile}
              isFullscreen={minimapFullscreen}
              onToggleFullscreen={() => setMinimapFullscreen(!minimapFullscreen)}
            />
          )}
          {heldEntity && !minimapOpen && (
            <div className="mt-2 pt-2 border-t border-slate-700 flex items-center gap-2">
              <Package size={12} className="text-purple-400 flex-shrink-0" />
              <span className="text-xs text-white truncate">持有: {heldEntity.name}</span>
            </div>
          )}
          <div className="mt-2 pt-2 border-t border-slate-700 flex items-center justify-between">
            <span className="text-[10px] text-slate-500">房间状态</span>
            {isRoomCleared ? (
              <span className="text-[10px] text-green-400 flex items-center gap-1 font-semibold">
                <CheckCircle2 size={10} /> 已清理
              </span>
            ) : (
              <span className="text-[10px] text-amber-400 flex items-center gap-1">
                <Package size={10} /> {roomUncollectedItems.length} 个待收集
              </span>
            )}
          </div>
          <button
            onClick={() => {
              if (!task) return
              resetTask()
              useSessionStore.getState().startSession(task.id, task.name, task.briefing)
              useGameStore.getState().startPlaying()
            }}
            className="w-full mt-2 pt-2 border-t border-slate-700 flex items-center justify-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors"
          >
            <RotateCcw size={12} />
            重新开始
          </button>
          <button
            onClick={() => {
              toggleAudioEnabled()
              const enabled = useUiStore.getState().audioEnabled
              if (enabled) initAudio()
            }}
            className="w-full mt-2 flex items-center justify-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            {audioEnabled ? <Volume2 size={12} /> : <VolumeX size={12} />}
            {audioEnabled ? '音效开启' : '音效关闭'}
          </button>
          <div className="mt-2 pt-2 border-t border-slate-700">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-slate-500">背景音乐</span>
              <span className="text-[10px] text-slate-400">{Math.round(getBgmVolume() * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={Math.round(getBgmVolume() * 100)}
              onChange={(e) => setBgmVolume(Number(e.target.value) / 100)}
              className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
          </div>
        </div>
      </div>

      {eventLogOpen && (
        <div className="absolute bottom-4 left-4 pointer-events-auto z-10" style={{ maxHeight: isCompact ? '150px' : '200px' }}>
          <div className="bg-slate-900/80 backdrop-blur-md rounded-lg overflow-hidden shadow-xl border border-slate-700/50">
            <button
              onClick={toggleEventLog}
              className="w-full px-3 py-2 flex items-center justify-between text-slate-300 text-xs hover:bg-slate-800/50"
            >
              <span className="font-semibold">事件日志 (R)</span>
              {eventLogOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            <div className="px-3 pb-3 space-y-1.5 max-h-48 overflow-y-auto">
              {(currentSession?.events.length ?? 0) === 0 ? (
                <div className="text-xs text-slate-500 py-2 text-center">暂无事件</div>
              ) : (
                currentSession!.events.slice(-20).map((event: any, index: number) => {
                  const displayText = formatEventMessage(event)
                  return (
                    <div key={index} className="text-xs text-slate-300 flex items-start gap-2 leading-relaxed">
                      <span className="text-slate-500 flex-shrink-0 mt-0.5">[{event.step ?? '?'}]</span>
                      <span className="break-words">{displayText}</span>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}

      {controlsOpen && !isMobile && !eventLogOpen && (
        <div className="absolute bottom-4 left-4 pointer-events-auto z-10">
          <div className="bg-slate-900/70 backdrop-blur-sm rounded-lg px-3 py-2 text-xs shadow-lg border border-slate-700/50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Keyboard size={12} className="text-purple-400" />
                <span className="font-semibold text-white">操作提示</span>
              </div>
              <button
                onClick={toggleControls}
                className="p-1 rounded hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
              >
                <X size={12} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-x-3 gap-y-1">
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-white text-[10px] font-mono">WASD</kbd>
                <span className="text-slate-400">移动</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-white text-[10px] font-mono">拖动</kbd>
                <span className="text-slate-400">视角</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-white text-[10px] font-mono">V</kbd>
                <span className="text-slate-400">切换</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-white text-[10px] font-mono">Tab</kbd>
                <span className="text-slate-400">任务</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-white text-[10px] font-mono">E</kbd>
                <span className="text-slate-400">存记忆</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-white text-[10px] font-mono">F</kbd>
                <span className="text-slate-400">交互</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-white text-[10px] font-mono">H</kbd>
                <span className="text-slate-400">隐藏</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-white text-[10px] font-mono">R</kbd>
                <span className="text-slate-400">日志</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-white text-[10px] font-mono">ESC</kbd>
                <span className="text-slate-400">恢复</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {memoryBarOpen && (
        <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-auto z-10`}>
          <div className="bg-slate-900/90 backdrop-blur-md rounded-xl p-3 shadow-xl border border-slate-700/50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Brain size={14} className="text-purple-400" />
                <span className="text-xs text-slate-400">记忆槽 (按 E 保存)</span>
                <div className="flex items-center gap-1 ml-2">
                  <span className="text-[10px] text-green-400 flex items-center gap-0.5"><MapPin size={8} />空间</span>
                  <span className="text-[10px] text-purple-400 flex items-center gap-0.5"><Box size={8} />物体</span>
                  <span className="text-[10px] text-blue-400 flex items-center gap-0.5"><History size={8} />时间</span>
                  <span className="text-[10px] text-orange-400 flex items-center gap-0.5"><Play size={8} />程序</span>
                </div>
                <div className="flex items-center gap-1 ml-2 pl-2 border-l border-slate-700">
                  <span className="text-[10px] text-green-400 flex items-center gap-0.5"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />高</span>
                  <span className="text-[10px] text-yellow-400 flex items-center gap-0.5"><span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" />中</span>
                  <span className="text-[10px] text-red-400 flex items-center gap-0.5"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" />模糊</span>
                  <span className="text-[10px] text-orange-400 flex items-center gap-0.5"><span className="w-2 h-2 rounded-full bg-orange-400 inline-block" />关键</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={toggleMemoryBar}
                  className="p-1 rounded hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
                >
                  <X size={12} />
                </button>
                <button
                  onClick={() => {
                    setMemoryTooltipOpen(false)
                    openHelp('memory')
                  }}
                  onMouseEnter={() => setMemoryTooltipOpen(true)}
                  onMouseLeave={() => setMemoryTooltipOpen(false)}
                  className="p-1 rounded hover:bg-slate-700/50 text-slate-500 hover:text-purple-400 transition-colors"
                >
                  <HelpCircle size={14} />
                </button>
              </div>
              {memoryTooltipOpen && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-slate-800/95 border border-purple-500/30 rounded-lg p-3 shadow-xl z-20">
                  <p className="text-xs text-white font-medium mb-2">🧠 记忆系统</p>
                  <p className="text-xs text-slate-300 leading-relaxed mb-2">
                    保存物体位置，之后可以回顾。记忆会随时间过期，重要的记得锁定！
                  </p>
                  <p className="text-[10px] text-purple-400">点击查看详细说明 →</p>
                </div>
              )}
            </div>
            <div className="flex gap-2" data-testid="memory-slots">
              {memorySlots.map((slot, index) => (
                <div
                  key={index}
                  className={`relative rounded-lg border-2 p-2 transition-all ${
                    savingMemorySlotIndex === index
                      ? 'animate-memory-save border-purple-400 bg-purple-900/50 shadow-lg shadow-purple-500/50'
                      : flashingSlotIndex === index
                        ? 'animate-pulse border-green-400 bg-green-900/30 shadow-lg shadow-green-500/30'
                        : slot
                          ? slot.outdated
                            ? 'bg-red-900/30 border-red-500/70 animate-outdated-glitch'
                            : slot.locked
                              ? 'bg-purple-900/50 border-purple-500'
                              : slot.confidence > 60
                                ? 'bg-green-900/30 border-green-500/60'
                                : slot.confidence > 30
                                  ? 'bg-yellow-900/30 border-yellow-500/60'
                                  : 'bg-red-900/30 border-red-500/60'
                            : 'bg-slate-800/30 border-dashed border-slate-600'
                  }`}
                  style={{
                    width: isCompact ? '48px' : '96px',
                    height: isCompact ? '40px' : '56px',
                    ...(slot && !slot.outdated && slot.confidence < 30 ? { filter: 'blur(0.6px)' } : {}),
                  }}
                >
                  {slot ? (
                    <>
                      {slot.priority === 'high' && (
                        <span className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-orange-400" title="任务关键" />
                      )}
                      <button
                        onClick={() => lockMemorySlot(index)}
                        className="absolute top-1 right-1 p-0.5 rounded hover:bg-white/10"
                      >
                        {slot.locked ? (
                          <Lock size={isCompact ? 8 : 10} className="text-purple-400" />
                        ) : (
                          <Unlock size={isCompact ? 8 : 10} className="text-slate-400" />
                        )}
                      </button>
                      <button
                        onClick={() => clearMemorySlot(index)}
                        className="absolute top-1 right-8 p-0.5 rounded hover:bg-red-500/20"
                      >
                        <Trash2 size={isCompact ? 8 : 10} className="text-red-400" />
                      </button>
                      <div className="text-xs text-white mt-3">
                        <div className="font-semibold truncate flex items-center gap-1">
                          {slot.objectName}
                          {slot.outdated && <span className="text-red-400 text-[8px]">!</span>}
                          {!slot.outdated && slot.confidence < 30 && <span className="text-red-400 text-[8px]">模糊</span>}
                        </div>
                        <div className={`text-[10px] ${slot.outdated ? 'text-red-400' : 'text-slate-400'} flex items-center gap-1`}>
                          {slot.roomName}
                          {getMemoryTypeIcon(slot.memoryType)}
                        </div>
                        <div className="w-full h-1 bg-slate-700 rounded-full mt-1">
                          <div
                            className={`h-full rounded-full transition-all ${
                              slot.confidence > 60 ? 'bg-green-500' : slot.confidence > 30 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${slot.confidence}%` }}
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-slate-600 text-xs">按 E 保存</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {phase === 'playing' && (interactionPrompt || nearbyEntity) && (
        <div className="absolute bottom-4 right-4 pointer-events-none flex flex-col items-end gap-1 z-10">
          {interactionPrompt && (
            <div className="px-3 py-1.5 rounded-lg bg-slate-950/85 border border-cyan-400/40 text-sm text-white shadow-lg">
              <kbd className="mr-2 px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono">F</kbd>
              {interactionPrompt}
            </div>
          )}
          {nearbyEntity && (
            <div className="px-2 py-1 rounded bg-slate-950/70 text-xs text-purple-200">
              <kbd className="mr-1.5 font-mono text-purple-400">E</kbd>
              保存/更新 {nearbyEntity.name} 的记忆
            </div>
          )}
          {nearbyEntity?.configId === 'obj-key' && memorySlots.every((s) => s === null) && (
            <div className="mt-2 max-w-[260px] px-3 py-2 rounded-lg bg-gradient-to-br from-purple-500/30 to-pink-500/30 border border-purple-400/50 text-[11px] text-purple-100 shadow-lg animate-pulse">
              💡 第一次靠近物体！按 E 保存它的位置记忆，捣乱事件后可以回顾。保存一次 +50 分！
            </div>
          )}
        </div>
      )}

      {feedback?.type === 'combo' && (
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 pointer-events-none z-30">
          <div className="animate-float-up text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 drop-shadow-lg">
            {feedback.message}
          </div>
        </div>
      )}

      {(feedback?.type === 'success' || feedback?.type === 'error') && (
        <div className={`absolute inset-0 pointer-events-none animate-flash z-30 ${
          feedback.type === 'success' ? 'bg-green-500/20' : 'bg-red-500/20'
        }`}>
          <div className="absolute inset-0 border-4 border-white/30 rounded-lg"
               style={{ borderColor: feedback.type === 'success' ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)' }}>
          </div>
        </div>
      )}

      {feedback?.type === 'event' && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center bg-black/50 backdrop-blur-sm z-30">
          <div className="bg-slate-900/95 border border-red-500/50 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl animate-event-popup pointer-events-auto">
            <button onClick={hideFeedback} className="absolute top-3 right-3 p-1 hover:bg-red-500/20 rounded-lg">
              <X size={18} className="text-red-400" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <Skull size={24} className="text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-white">异常事件</h3>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed mb-4">
              {feedback.message}
            </p>
            <div className="flex items-center gap-2 text-xs text-red-400">
              <AlertCircle size={14} />
              <span>混乱值上升！</span>
            </div>
          </div>
        </div>
      )}

      <div className="absolute top-36 left-1/2 -translate-x-1/2 pointer-events-none space-y-2 z-20">
        {eventToasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded-lg shadow-xl backdrop-blur-md animate-toast-in flex items-center gap-3 max-w-sm ${
              toast.type === 'cat'
                ? 'bg-amber-900/80 border border-amber-500/50'
                : toast.type === 'phone'
                  ? 'bg-blue-900/80 border border-blue-500/50'
                  : toast.type === 'warning'
                    ? 'bg-red-900/80 border border-red-500/50'
                    : 'bg-slate-900/80 border border-slate-600/50'
            }`}
          >
            {toast.type === 'cat' && <Cat size={20} className="text-amber-400 flex-shrink-0" />}
            {toast.type === 'phone' && <Smartphone size={20} className="text-blue-400 flex-shrink-0 animate-pulse" />}
            {toast.type === 'warning' && <AlertTriangle size={20} className="text-red-400 flex-shrink-0" />}
            {toast.type === 'event' && <AlertCircle size={20} className="text-purple-400 flex-shrink-0" />}
            {toast.type === 'info' && <AlertCircle size={20} className="text-blue-400 flex-shrink-0" />}
            <span className="text-white text-sm font-medium">{toast.message}</span>
          </div>
        ))}
      </div>

      <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
        {floatingTexts.map((ft) => (
          <div
            key={ft.id}
            className={`absolute animate-float-up font-bold text-lg ${
              ft.type === 'score'
                ? 'text-green-400'
                : ft.type === 'error'
                  ? 'text-red-400'
                  : ft.type === 'combo'
                    ? 'text-yellow-400'
                    : ft.type === 'memory'
                      ? 'text-purple-400'
                      : 'text-white'
            }`}
            style={{
              left: `${50 + (ft.x % 20 - 10)}%`,
              top: `${40 + (ft.y % 10)}%`,
              textShadow: '0 2px 4px rgba(0,0,0,0.5)',
            }}
          >
            {ft.text}
          </div>
        ))}
      </div>

      <HelpPanel isOpen={helpOpen} onClose={() => setHelpOpen(false)} defaultTab={helpDefaultTab} />

      <style>{`
        @keyframes hud-shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        @keyframes float-up {
          0% { opacity: 1; transform: translateY(0) scale(0.8); }
          50% { opacity: 1; transform: translateY(-30px) scale(1.2); }
          100% { opacity: 0; transform: translateY(-80px) scale(1); }
        }
        @keyframes flash {
          0% { opacity: 0; }
          20% { opacity: 1; }
          40% { opacity: 0.5; }
          60% { opacity: 1; }
          80% { opacity: 0.3; }
          100% { opacity: 0; }
        }
        @keyframes event-popup {
          0% { opacity: 0; transform: scale(0.9) translateY(20px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes memory-save {
          0% { transform: scale(0.8); opacity: 0; box-shadow: 0 0 0 0 rgba(168, 85, 247, 0.7); }
          30% { transform: scale(1.1); box-shadow: 0 0 0 10px rgba(168, 85, 247, 0); }
          60% { transform: scale(1); box-shadow: 0 0 0 0 rgba(168, 85, 247, 0); }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-float-up {
          animation: float-up 1.5s ease-out forwards;
        }
        .animate-flash {
          animation: flash 1.5s ease-out forwards;
        }
        .animate-event-popup {
          animation: event-popup 0.3s ease-out forwards;
        }
        .animate-memory-save {
          animation: memory-save 1.5s ease-out forwards;
        }
        @keyframes toast-in {
          0% { opacity: 0; transform: translateY(-20px) scale(0.9); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-toast-in {
          animation: toast-in 0.3s ease-out forwards;
        }
        @keyframes combo-pop {
          0% { transform: scale(0.5); opacity: 0.5; }
          50% { transform: scale(1.3); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-combo-pop {
          animation: combo-pop 0.4s ease-out;
        }
        @keyframes outdated-glitch {
          0%, 100% { opacity: 1; transform: translateX(0); }
          25% { opacity: 0.8; transform: translateX(-1px); }
          50% { opacity: 1; transform: translateX(1px); }
          75% { opacity: 0.9; transform: translateX(-1px); }
        }
        .animate-outdated-glitch {
          animation: outdated-glitch 0.5s infinite;
        }
        .chaos-vignette {
          background: radial-gradient(ellipse at center, transparent 40%, rgba(127, 29, 29, 0.6) 100%);
          animation: vignette-pulse 3s ease-in-out infinite;
        }
        @keyframes vignette-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.85; }
        }
        .chaos-noise {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
          animation: noise-move 0.5s steps(5) infinite;
          opacity: 0.4;
        }
        .chaos-scanlines {
          background: repeating-linear-gradient(
            0deg,
            rgba(0, 0, 0, 0.15),
            rgba(0, 0, 0, 0.15) 1px,
            transparent 1px,
            transparent 2px
          );
          animation: scanline-move 8s linear infinite;
        }
        @keyframes noise-move {
          0% { transform: translate(0, 0); }
          20% { transform: translate(-5%, -5%); }
          40% { transform: translate(5%, -10%); }
          60% { transform: translate(-10%, 5%); }
          80% { transform: translate(10%, 10%); }
          100% { transform: translate(0, 0); }
        }
        @keyframes scanline-move {
          0% { transform: translateY(0); }
          100% { transform: translateY(100px); }
        }
      `}</style>
    </div>
  )
}
