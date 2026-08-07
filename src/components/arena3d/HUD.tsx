import { useEffect, useCallback, useState, useMemo, useRef } from 'react'
import { useGameStore } from '../../store/useGameStore'
import { useUiStore } from '../../store/useUiStore'
import { Target, Clock, CheckCircle2, AlertTriangle, Zap, Package, Keyboard, Brain, Lock, Unlock, Trash2, ChevronDown, ChevronUp, Skull, AlertCircle, X, Cat, Smartphone, HelpCircle, Eye, EyeOff, MapPin, Box, History, Play, Pause, Volume2, VolumeX } from 'lucide-react'
import { Minimap } from './Minimap'
import type { GoalSpec } from '../../types/task'
import { HelpPanel } from '../help/HelpPanel'
import { useSessionStore } from '../../store/useSessionStore'
import {
  findNearestInteractableContainer,
  findNearestInteractableEntity,
} from '../../game/interactionTargets'
import { findActiveGoal } from '../../game/flow'
import type { ContainerSpec } from '../../types/object'

/**
 * ⚠️ 时间显示独立组件。
 * store 中 elapsedMs 每帧（60fps）setState，若 HUD 直接订阅会导致 HUD 每帧重渲染。
 * 这里改成 250ms 轮询 getState()，仅在秒数变化时 setState，重渲染频率降到 4fps。
 * 间接降低 WebGL Context Lost 风险。
 */
function TimeDisplay({ isMobile }: { isMobile: boolean }) {
  const [displaySeconds, setDisplaySeconds] = useState(0)
  useEffect(() => {
    const TICK_MS = 250
    let last = -1
    const id = window.setInterval(() => {
      const st = useGameStore.getState()
      const rawMs = st.task?.timeLimit
        ? Math.max(0, st.task.timeLimit * 1000 - st.elapsedMs)
        : st.elapsedMs
      const s = Math.floor(rawMs / 1000)
      if (s !== last) {
        last = s
        setDisplaySeconds(s)
      }
    }, TICK_MS)
    return () => window.clearInterval(id)
  }, [])
  const m = Math.floor(displaySeconds / 60)
  const s = displaySeconds % 60
  return (
    <div className={`font-bold text-slate-200 flex items-center gap-1 ${isMobile ? 'text-sm' : 'text-lg'}`}>
      <Clock size={isMobile ? 10 : 12} className="text-cyan-400" />
      {`${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`}
    </div>
  )
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
  // ⚠️ 用单字段 selector 避免 getSnapshot 引用变化 → 无限循环
  const task = useGameStore((s) => s.task)
  const phase = useGameStore((s) => s.phase)
  const currentRoom = useGameStore((s) => s.currentRoom)
  const chaosValue = useGameStore((s) => s.chaosValue)
  const score = useGameStore((s) => s.score)
  const combo = useGameStore((s) => s.combo)
  const memorySlots = useGameStore((s) => s.memorySlots)
  const heldEntityId = useGameStore((s) => s.heldEntityId)
  const entities = useGameStore((s) => s.entities)
  const containerStates = useGameStore((s) => s.containerStates)
  const feedback = useGameStore((s) => s.feedback)
  const hideFeedback = useGameStore((s) => s.hideFeedback)
  const lockMemorySlot = useGameStore((s) => s.lockMemorySlot)
  const clearMemorySlot = useGameStore((s) => s.clearMemorySlot)
  const visitedRooms = useGameStore((s) => s.visitedRooms)
  const robotPosition = useGameStore((s) => s.robotPosition)
  const robotRotation = useGameStore((s) => s.robotRotation)
  const savingMemorySlotIndex = useGameStore((s) => s.savingMemorySlotIndex)
  const flashingSlotIndex = useGameStore((s) => s.flashingSlotIndex)
  // ⚠️ 不订阅 elapsedMs：store 每帧 60fps 更新 elapsedMs，订阅会导致 HUD 每帧重渲染。
  // 时间显示由 <TimeDisplay/> 独立轮询 4fps，见 TimeDisplay 组件注释。
  const floatingTexts = useGameStore((s) => s.floatingTexts)
  const eventToasts = useGameStore((s) => s.eventToasts)
  const isGoalAchieved = useGameStore((s) => s.isGoalAchieved)
  const achievedGoalIds = useGameStore((s) => s.achievedGoalIds)
  const activeFlowHint = useGameStore((s) => s.activeFlowHint)
  const currentStageId = useGameStore((s) => s.currentStageId)
  const currentObjective = useGameStore((s) => s.currentObjective)
  const setPaused = useGameStore((s) => s.setPaused)
  const currentSession = useSessionStore((s) => s.currentSession)

  // ⚠️ 用单字段 selector 避免 getSnapshot 引用变化 → 无限循环
  const taskPanelOpen = useUiStore((s) => s.taskPanelOpen)
  const eventLogOpen = useUiStore((s) => s.eventLogOpen)
  const minimapOpen = useUiStore((s) => s.minimapOpen)
  const controlsOpen = useUiStore((s) => s.controlsOpen)
  const memoryBarOpen = useUiStore((s) => s.memoryBarOpen)
  const hudHidden = useUiStore((s) => s.hudHidden)
  const audioEnabled = useUiStore((s) => s.audioEnabled)
  const toggleTaskPanel = useUiStore((s) => s.toggleTaskPanel)
  const toggleEventLog = useUiStore((s) => s.toggleEventLog)
  const toggleMinimap = useUiStore((s) => s.toggleMinimap)
  const toggleControls = useUiStore((s) => s.toggleControls)
  const toggleHudHidden = useUiStore((s) => s.toggleHudHidden)
  const toggleAudioEnabled = useUiStore((s) => s.toggleAudioEnabled)

  const heldEntity = heldEntityId ? entities.find(e => e.id === heldEntityId) : null
  const nearbyEntity = findNearestInteractableEntity(entities, robotPosition, currentRoom)
  const nearbyContainer = findNearestInteractableContainer(task, robotPosition, currentRoom)
  void nearbyContainer

  const [helpOpen, setHelpOpen] = useState(false)
  const [helpDefaultTab, setHelpDefaultTab] = useState('controls')
  const [chaosTooltipOpen, setChaosTooltipOpen] = useState(false)
  const [isCompact, setIsCompact] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [viewportWidth, setViewportWidth] = useState(1920)
  const [minimapFullscreen, setMinimapFullscreen] = useState(false)
  const [completedGoalBanner, setCompletedGoalBanner] = useState<{ taskId: string; id: string; description: string } | null>(null)
  const seenGoalIdsRef = useRef<Set<string>>(new Set())
  const seenGoalTaskIdRef = useRef<string | null>(task?.id ?? null)
  const goalBannerTimerRef = useRef<number | null>(null)

  // 目标完成反馈不能只依赖左上角的小图标：玩家正在操作 3D 场景时很容易错过。
  // 每次 achievedGoalIds 新增目标，都在视野中央展示短暂的大号 ✓；所有关卡共用。
  // 任务切换必须在 render 阶段同步重置“已见集合”。若放在 effect 里，玩家/测试在 HUD
  // 初次挂载后立刻完成第一个目标时，初始化 effect 可能后执行并把新目标误吞成旧状态。
  if (seenGoalTaskIdRef.current !== (task?.id ?? null)) {
    seenGoalTaskIdRef.current = task?.id ?? null
    seenGoalIdsRef.current = new Set(achievedGoalIds)
  }

  useEffect(() => {
    const newlyAchieved = Array.from(achievedGoalIds).filter((id) => !seenGoalIdsRef.current.has(id))
    seenGoalIdsRef.current = new Set(achievedGoalIds)
    const latestGoalId = newlyAchieved.at(-1)
    if (!latestGoalId) return
    const taskId = task?.id
    if (!taskId) return
    const goal = task?.goals.find((candidate) => candidate.id === latestGoalId)
    if (!goal) return

    setCompletedGoalBanner({ taskId, id: goal.id, description: goal.description.replace(/^✓\s*/, '') })
    if (goalBannerTimerRef.current !== null) window.clearTimeout(goalBannerTimerRef.current)
    goalBannerTimerRef.current = window.setTimeout(() => {
      setCompletedGoalBanner(null)
      goalBannerTimerRef.current = null
    }, 2600)
  }, [achievedGoalIds, task])

  useEffect(() => () => {
    if (goalBannerTimerRef.current !== null) window.clearTimeout(goalBannerTimerRef.current)
  }, [])

  // ---------- E 子包：DEV-only 模型模式指示（不改生产行为） ----------
  const modelModeLabel = useMemo<{ active: boolean; label: string; hint: string } | null>(() => {
    try {
      const env = (import.meta as any)?.env
      if (!env?.DEV) return null
      const flag = String(env.VITE_USE_KENNEY_LIVING_ASSETS ?? '')
      const kenney = flag === 'true' || flag === '1'
      return {
        active: kenney,
        label: kenney ? '🎨 GLB 模式' : '🧊 程序化模式',
        hint: kenney ? 'Kenney 模型已启用' : '默认程序化家具；启动时加 VITE_USE_KENNEY_LIVING_ASSETS=true 启用 GLB',
      }
    } catch {
      return null
    }
  }, [])

  // ---------- F 子包：任务房间容器（不改坐标，仅筛选透传；全屏模式下其他任务房间容器也会画出来
  // 坐标/尺寸都是房间局部坐标，Minimap 里会按 c.room 叠加对应房间中心得到世界坐标）----------
  const roomContainersForMinimap: ContainerSpec[] = useMemo(() => {
    if (!task?.containers) return []
    const rooms = new Set(task.rooms)
    return task.containers.filter((c: ContainerSpec) => rooms.has(c.room))
  }, [task?.containers, task?.rooms])

  useEffect(() => {
    const checkCompact = () => {
      const w = window.innerWidth
      setViewportWidth(w)
      setIsCompact(w < 1280)
      setIsMobile(w < 768)
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

  // Sprint B.1: 阶段进度（仅任务有 stages 时展示）
  const stages = task?.stages ?? []
  const totalStages = stages.length
  const stageIndex = totalStages > 0 ? Math.max(0, stages.findIndex(s => s.id === currentStageId)) : -1
  const stageProgress1Based = stageIndex >= 0 ? Math.min(totalStages, stageIndex + 1) : 0

  // Sprint B.1: E/F 上下文提示按阶段定制
  // 旧的 task-leave-home / task-clean-table 硬编码已改成通用：
  //   - 教学阶段 ID 取 stages[0].id（L1 即 stage-observe）
  //   - 任务物体 ID 取 task.objects 全部 objectConfigId 列表
  const firstStageId = stages[0]?.id ?? '__none__'
  const taskObjectIds = task?.objects?.map((o) => o.id) ?? []
  const anyTaskMemorySaved = memorySlots.some(
    (s) => s !== null && taskObjectIds.includes(s.entityConfigId),
  )
  // L1 教学：第一阶段且玩家尚未保存任何任务物体记忆 → 只显示 E 不显示 F 拾取教学
  const l1TeachStage = task?.id === 'task-clean-table' && currentStageId === firstStageId && !anyTaskMemorySaved
  // L1 教学：已至少保存 1 条任务记忆，或已离开观察阶段 → 不显示 E 教学，只显示 F 拾取/放置
  const l1PastTeachStage = task?.id === 'task-clean-table' && (currentStageId !== firstStageId || anyTaskMemorySaved)

  // [E] 记忆动作文案 + 原因
  let memoryActionLabel: string | null = null
  let memoryActionDisabledReason: string | null = null
  // L1 教学：已过教学阶段 → 隐藏 E 教学提示（仅不再强提示 E 本身，实际 E 键仍可用）
  const shouldHideMemoryHint = l1PastTeachStage
  if (!shouldHideMemoryHint && nearbyEntity) {
    if (memorySlots.some(s => s?.objectName === nearbyEntity.name && s.outdated)) {
      memoryActionLabel = `更新 ${nearbyEntity.name} 的记忆`
    } else {
      memoryActionLabel = `保存 ${nearbyEntity.name} 的位置记忆`
    }
  }
  // [F] 交互动作文案 + 原因
  let itemActionLabel: string | null = null
  let itemActionDisabledReason: string | null = null
  // L1 教学：尚未保存第一条任务记忆 → 隐藏 F 拾取教学提示，避免 E 和 F 同时出现
  const shouldHideInteractHint = l1TeachStage
  if (!shouldHideInteractHint) {
    if (heldEntity && nearbyContainer) {
      itemActionLabel = `放入 ${nearbyContainer.name}`
    } else if (heldEntity && !nearbyContainer) {
      // 持物无容器 → 显示放回地面选项
      itemActionLabel = `放回地面（丢弃 ${heldEntity.name}）`
    } else if (!heldEntity && nearbyEntity) {
      if (l1TeachStage && taskObjectIds.includes(nearbyEntity.configId)) {
        itemActionLabel = `拾取 ${nearbyEntity.name}`
        itemActionDisabledReason = '先按 E 记住它的位置'
      } else {
        itemActionLabel = `拾取 ${nearbyEntity.name}`
      }
    } else if (!heldEntity && nearbyContainer) {
      itemActionLabel = `${containerStates[nearbyContainer.id]?.open ? '关闭' : '打开'} ${nearbyContainer.name}`
    }
  }

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
  // ⚠️ elapsedMs 不再通过订阅获取，时间显示由 <TimeDisplay/> 独立轮询。
  // 此处仅保留 chaosColor 等与时间无关的派生计算。
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

  const hasOutdatedMemory = memorySlots.some(s => s?.outdated)

  return (
    <div className="absolute inset-0 pointer-events-none" data-testid="arena-hud">
      {hasOutdatedMemory && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: 0.08,
          }}
        >
          <div className="absolute inset-0 animate-outdated-pulse" />
        </div>
      )}
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

      <div className={`absolute top-4 left-4 pointer-events-auto transition-all duration-300 ${isMobile ? 'max-w-[240px]' : isCompact ? 'max-w-[280px]' : 'max-w-[360px]'} w-full z-20`} data-testid="task-panel">
        <div className="bg-slate-900/95 backdrop-blur-md rounded-xl p-3 shadow-xl border border-purple-500/30">
          <div className="flex items-center justify-between mb-2">
            <h2 className={`font-bold text-white flex items-center gap-2 ${isMobile ? 'text-xs' : 'text-sm'}`}>
              <Target size={isMobile ? 12 : 16} className="text-purple-400" />
              {task?.name ?? '任务'}
            </h2>
            <div className="flex items-center gap-2">
              {totalStages > 0 && stageProgress1Based > 0 && (
                <span data-testid="current-stage-progress" className={`${isMobile ? 'text-[9px]' : 'text-[10px]'} font-bold px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/40`}>
                  步骤 {stageProgress1Based}/{totalStages}
                </span>
              )}
              <button
                onClick={toggleTaskPanel}
                className="p-1 rounded hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
                title="按 Tab 展开完整目标"
              >
                {taskPanelOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>
          </div>

          {/* Sprint B.1: 当前目标 — 始终显示；最多两行；阶段切换轻量弹入 */}
          {currentObjective && (
            <div
              key={currentStageId ?? 'none'}
              data-testid="current-objective"
              className={`mb-2 rounded-lg border-2 border-cyan-400/50 bg-gradient-to-br from-cyan-500/15 to-indigo-500/10 px-3 py-2 animate-objective-pop shadow-lg shadow-cyan-500/10 ${isMobile ? 'text-[11px]' : 'text-xs'}`}
            >
              <div className="text-[10px] font-semibold uppercase tracking-wider text-cyan-300/80 mb-1">
                当前目标
              </div>
              <div className="font-semibold leading-snug text-white whitespace-pre-line line-clamp-2">
                {currentObjective}
              </div>
            </div>
          )}

          {task?.goals && task.goals.length > 0 && (
            <div className="space-y-1 overflow-y-auto pr-1" style={{ maxHeight: isMobile ? '10vh' : isCompact ? '15vh' : '25vh' }}>
              <div className="flex items-center justify-between px-2 py-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-300/80 flex items-center gap-1">
                  <Target size={10} />
                  任务进度
                </span>
                <span className={`text-[10px] font-bold ${achievedGoals === totalGoals ? 'text-green-400' : 'text-purple-300'}`}>
                  {achievedGoals}/{totalGoals}
                  {totalGoals > 0 && (
                    <span className="ml-1 inline-block w-12 h-1.5 bg-slate-700 rounded-full overflow-hidden align-middle">
                      <span
                        className="block h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </span>
                  )}
                </span>
              </div>
              {/* Always-visible: 折叠态显示已完成目标打勾 + 下一个目标 */}
              {!taskPanelOpen && (() => {
                const achievedGoalsList = task.goals.filter((g: GoalSpec) => isGoalAchieved(g))
                const nextGoal = task.goals.find((g: GoalSpec) => !isGoalAchieved(g))
                if (!nextGoal) {
                  return (
                    <div className="px-2 py-1.5 rounded-lg bg-green-500/20 border border-green-500/40 text-xs font-semibold text-green-300 flex items-center gap-2">
                      <CheckCircle2 size={14} />
                      所有任务已完成！
                    </div>
                  )
                }
                return (
                  <div className="space-y-1">
                    {/* 已完成目标打勾（最多显示 2 条，超出显示 +N） */}
                    {achievedGoalsList.length > 0 && (
                      <div className="space-y-0.5">
                        {achievedGoalsList.slice(-2).map((goal: GoalSpec) => (
                          <div key={goal.id} className="flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-green-500/5">
                            <CheckCircle2 size={11} className="text-green-400 flex-shrink-0" />
                            <span className="text-[10px] text-green-400/70 line-through truncate flex-1">
                              {goal.description}
                            </span>
                          </div>
                        ))}
                        {achievedGoalsList.length > 2 && (
                          <div className="text-[9px] text-green-400/50 px-1.5">
                            +{achievedGoalsList.length - 2} 已完成
                          </div>
                        )}
                      </div>
                    )}
                    {/* 下一个目标 */}
                    <div className="px-2 py-1.5 rounded-lg bg-slate-800/60 border border-slate-600/40">
                      <div className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">
                        下一个目标
                      </div>
                      <div className="text-xs text-white leading-snug line-clamp-1">
                        {nextGoal.description}
                      </div>
                    </div>
                  </div>
                )
              })()}
              {taskPanelOpen && (
                <>
                  {activeGoal && !currentObjective && (
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
                    按 Tab 切换完整目标面板 · 按 R 显示事件日志
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className={`absolute ${isMobile ? 'top-16' : 'top-4'} left-1/2 -translate-x-1/2 pointer-events-auto z-10`}>
        <div className={`bg-slate-900/90 backdrop-blur-md rounded-xl shadow-xl border border-slate-700/50 w-full ${isMobile ? 'max-w-[320px] p-2' : 'max-w-[440px] p-3'}`}>
          {/* 第一行：得分 / 评级 / 时间 / 位置 / COMBO（信息展示，无操作按钮，避免溢出） */}
          <div className={`flex items-center justify-between mb-2 ${isMobile ? 'gap-1' : 'gap-3'}`}>
            <div className="flex items-center gap-2 min-w-0">
              <div className="text-center flex-shrink-0">
                <div className={`${isMobile ? 'text-[8px]' : 'text-[10px]'} text-slate-400`}>得分</div>
                <div className={`font-bold text-white ${isMobile ? 'text-lg' : 'text-2xl'}`}>{score}</div>
              </div>
              <div className={`w-px bg-slate-700 flex-shrink-0 ${isMobile ? 'h-6' : 'h-8'}`} />
              <div className="text-center flex-shrink-0">
                <div className={`${isMobile ? 'text-[8px]' : 'text-[10px]'} text-slate-400`}>评级</div>
                <div className={`font-bold ${isMobile ? 'text-lg' : 'text-2xl'} ${getRating(score) === 'S' ? 'text-yellow-400' : getRating(score) === 'A' ? 'text-green-400' : getRating(score) === 'B' ? 'text-blue-400' : getRating(score) === 'C' ? 'text-purple-400' : 'text-slate-400'}`}>
                  {getRating(score)}
                </div>
              </div>
              <div className={`w-px bg-slate-700 flex-shrink-0 ${isMobile ? 'h-6' : 'h-8'}`} />
              <div className="text-center flex-shrink-0">
                <div className={`${isMobile ? 'text-[8px]' : 'text-[10px]'} text-slate-400`}>时间</div>
                <TimeDisplay isMobile={isMobile} />
              </div>
              {!isMobile && (
                <>
                  <div className="w-px h-8 bg-slate-700 flex-shrink-0" />
                  <div className="text-center flex-shrink-0">
                    <div className="text-[10px] text-slate-400">位置</div>
                    <div className="text-sm font-semibold text-purple-300">{currentRoom}</div>
                  </div>
                </>
              )}
            </div>
            {combo > 0 && (
              <div
                key={combo}
                className="flex items-center gap-1 bg-yellow-500/20 px-3 py-1.5 rounded-full animate-combo-pop flex-shrink-0"
              >
                <Zap size={14} className="text-yellow-400" />
                <span className="text-yellow-400 font-bold text-sm whitespace-nowrap">{combo} COMBO!</span>
              </div>
            )}
          </div>
          {/* 第二行：混乱值 + 任务进度 + 暂停/音频按钮（操作按钮移到此处，避免溢出） */}
          <div className="flex items-center gap-2 mb-2">
            <div
              className="flex items-center gap-1.5 cursor-help relative flex-1 min-w-0"
              data-testid="chaos-meter"
              onMouseEnter={() => setChaosTooltipOpen(true)}
              onMouseLeave={() => setChaosTooltipOpen(false)}
              onClick={() => {
                setChaosTooltipOpen(false)
                openHelp('chaos')
              }}
            >
              <AlertTriangle size={12} className={chaosValue > 70 ? 'text-red-400 animate-pulse' : chaosValue > 40 ? 'text-yellow-400' : 'text-green-400'} />
              <span className="text-[10px] font-semibold text-white whitespace-nowrap">混乱</span>
              <span className={`text-[10px] font-bold ${chaosValue > 70 ? 'text-red-400' : chaosValue > 40 ? 'text-yellow-400' : 'text-green-400'}`}>
                {Math.floor(chaosValue)}%
              </span>
              <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden min-w-0">
                <div
                  className={`h-full bg-gradient-to-r ${chaosColor} transition-all duration-300`}
                  style={{ width: `${chaosValue}%` }}
                />
              </div>
              {chaosTooltipOpen && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-slate-800/95 border border-red-500/30 rounded-lg p-3 shadow-xl z-20">
                  <p className="text-xs text-white font-medium mb-2">⚠️ 混乱值</p>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    代表系统的失控程度。越高物品越容易被移动，记忆也越容易过期。
                  </p>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <div className="flex items-center gap-1">
                <div className="w-12 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-400 whitespace-nowrap">{achievedGoals}/{totalGoals}</span>
              </div>
              <button
                onClick={() => setPaused(true)}
                title="暂停游戏（重新开始 / 返回关卡选择）"
                className="p-1.5 rounded-lg transition-colors bg-slate-800/70 text-slate-300 hover:bg-slate-700/80 hover:text-white border border-slate-600/50"
                data-testid="pause-btn"
                aria-label="暂停游戏"
              >
                <Pause size={isMobile ? 12 : 14} />
              </button>
              <button
                onClick={toggleAudioEnabled}
                title={audioEnabled ? '关闭所有音频' : '开启音频'}
                className={`p-1.5 rounded-lg transition-colors ${
                  audioEnabled
                    ? 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 hover:text-emerald-200 border border-emerald-400/30'
                    : 'bg-slate-800/70 text-slate-400 hover:bg-slate-700/80 hover:text-slate-200 border border-slate-600/50'
                }`}
                data-testid="audio-toggle-btn"
              >
                {audioEnabled ? <Volume2 size={isMobile ? 12 : 14} /> : <VolumeX size={isMobile ? 12 : 14} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute top-4 right-4 pointer-events-auto z-20" data-testid="minimap" style={{ width: minimapFullscreen ? 'auto' : isMobile ? '216px' : viewportWidth >= 1600 ? '276px' : viewportWidth >= 1280 ? '246px' : '216px' }}>
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
              observedObjects={entities.filter((e) => {
                return e.currentRoom === currentRoom && e.status !== 'hidden' && e.status !== 'held'
              })}
              taskRooms={task?.rooms}
              isMobile={isMobile}
              isFullscreen={minimapFullscreen}
              onToggleFullscreen={() => setMinimapFullscreen(!minimapFullscreen)}
              memorySlots={memorySlots}
              roomContainers={roomContainersForMinimap}
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
          {modelModeLabel && (
            <div className="mt-2 pt-2 border-t border-slate-700 flex items-center justify-between" title={modelModeLabel.hint}>
              <span className={`text-[10px] font-semibold ${modelModeLabel.active ? 'text-amber-300' : 'text-slate-400'}`}>
                {modelModeLabel.label}
              </span>
              {!modelModeLabel.active && (
                <span className="text-[9px] text-slate-500">DEV only</span>
              )}
            </div>
          )}
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
                <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-white text-[10px] font-mono">点击画面</kbd>
                <span className="text-slate-400">锁定视角</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-white text-[10px] font-mono">V</kbd>
                <span className="text-slate-400">切换视角</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-white text-[10px] font-mono">Tab</kbd>
                <span className="text-slate-400">任务面板</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-white text-[10px] font-mono">E</kbd>
                <span className="text-slate-400">存记忆</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-white text-[10px] font-mono">F</kbd>
                <span className="text-slate-400">拾取·开门·交互</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-white text-[10px] font-mono">ESC</kbd>
                <span className="text-slate-400">释放视角</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-white text-[10px] font-mono">ESC×2</kbd>
                <span className="text-slate-400">暂停菜单</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-white text-[10px] font-mono">H / R</kbd>
                <span className="text-slate-400">隐藏UI · 日志</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {memoryBarOpen && (
        <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-auto z-10`}>
          <div className="bg-slate-900/90 backdrop-blur-md rounded-xl p-3 shadow-xl border border-slate-700/50">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Brain size={14} className="text-purple-400" />
                <span className="text-xs text-slate-400">记忆槽</span>
                <span className="text-[9px] text-slate-500">
                  {task?.id === 'task-clean-table'
                    ? '先保存第一条位置记忆，再开始整理'
                    : task?.id === 'task-leave-home'
                      ? '三条稳定记忆都建立后再取回'
                      : '记忆变红时先核对，再按 E 更新'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => openHelp('memory')}
                  className="p-1 rounded hover:bg-slate-700/50 text-slate-500 hover:text-purple-400 transition-colors"
                  title="记忆系统帮助"
                >
                  <HelpCircle size={12} />
                </button>
              </div>
            </div>
            <div className="text-[9px] text-slate-500 mb-2 leading-relaxed">
              按 <kbd className="px-1 bg-slate-700 rounded text-[8px] text-purple-300">E</kbd> 记住眼前物品的位置 · 红色"已过期"表示物品可能被移动 · 按 <kbd className="px-1 bg-slate-700 rounded text-[8px] text-purple-300">E</kbd> 再次查看可更新记忆
            </div>
            <div className="flex gap-2" data-testid="memory-slots">
              {memorySlots.map((slot, index) => {
                const outdated = !!slot?.outdated
                return (
                  <div
                    key={index}
                    data-testid={outdated ? 'memory-slot-outdated' : `memory-slot-${index}`}
                    className={`relative rounded-lg border-2 p-2 transition-all ${
                      savingMemorySlotIndex === index
                        ? 'animate-memory-save border-purple-400 bg-purple-900/50 shadow-lg shadow-purple-500/50'
                        : flashingSlotIndex === index
                          ? 'animate-pulse border-green-400 bg-green-900/30 shadow-lg shadow-green-500/30'
                          : slot
                            ? outdated
                              ? 'bg-gradient-to-br from-red-900/50 to-orange-900/30 border-red-500 shadow-lg shadow-red-500/30 ring-2 ring-red-400/40 animate-outdated-glitch'
                              : slot.locked
                                ? 'bg-purple-900/50 border-purple-500 shadow shadow-purple-500/20'
                                : 'bg-slate-800/50 border-slate-500/60'
                              : 'bg-slate-800/30 border-dashed border-slate-600'
                    }`}
                    style={{
                      width: isCompact ? '72px' : '108px',
                      height: isCompact ? '52px' : '64px',
                    }}
                  >
                    {slot ? (
                      <>
                        {slot.priority === 'high' && (
                          <span className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-orange-400" title="任务关键" />
                        )}
                        {outdated && (
                          <span className="absolute top-0.5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-full bg-red-500/80 border border-red-400 text-white text-[8px] font-bold tracking-wide shadow">
                            已过期
                          </span>
                        )}
                        <button
                          onClick={() => lockMemorySlot(index)}
                          className="absolute top-1 right-6 p-0.5 rounded hover:bg-white/10"
                          title={slot.locked ? '已锁定（点击解锁）' : '点击锁定（防止覆盖）'}
                        >
                          {slot.locked ? (
                            <Lock size={isCompact ? 8 : 10} className="text-purple-400" />
                          ) : (
                            <Unlock size={isCompact ? 8 : 10} className="text-slate-400" />
                          )}
                        </button>
                        <button
                          onClick={() => clearMemorySlot(index)}
                          className="absolute top-1 right-1 p-0.5 rounded hover:bg-red-500/20"
                          title="丢弃这条记忆"
                        >
                          <Trash2 size={isCompact ? 8 : 10} className="text-red-400" />
                        </button>
                        <div className={`text-xs ${outdated ? 'text-red-100/95' : 'text-white'} mt-3`}>
                          <div className="flex items-center gap-1">
                            {getMemoryTypeIcon(slot.memoryType)}
                            <span className="font-semibold truncate">{slot.objectName}</span>
                          </div>
                          <div className={`text-[10px] ${outdated ? 'text-red-300 line-through opacity-80' : 'text-slate-400'}`}>
                            {slot.roomName}
                          </div>
                          {!isCompact && (
                            <div className="mt-1">
                              <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                                <div
                                  className={`h-full transition-all ${outdated ? 'bg-red-500/60 grayscale' : slot.confidence > 60 ? 'bg-green-500' : slot.confidence > 30 ? 'bg-yellow-500' : 'bg-orange-500'}`}
                                  style={{ width: `${slot.confidence}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-slate-600 text-xs">按 E 保存</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {phase === 'playing' && heldEntity && (
        <div
          data-testid="held-item-banner"
          className="absolute bottom-24 right-4 pointer-events-none z-10 animate-held-item-pop"
        >
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-br from-purple-900/90 to-indigo-900/90 backdrop-blur-md border-2 border-purple-400/60 shadow-2xl shadow-purple-500/20">
            <div className="p-2 rounded-lg bg-purple-500/30 flex items-center justify-center">
              <Package size={22} className="text-purple-300" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-purple-300/80 font-semibold">手持物品</span>
              <span className="text-lg font-bold text-white leading-tight">{heldEntity.name}</span>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-slate-900/60 border border-slate-600/50">
              <kbd className="text-[10px] font-mono text-cyan-300">F</kbd>
              <span className="text-[10px] text-slate-400">放置</span>
            </div>
          </div>
        </div>
      )}

      {phase === 'playing' && (itemActionLabel || memoryActionLabel || nearbyEntity || heldEntity) && (
        <div className="absolute bottom-4 right-4 pointer-events-none flex flex-col items-end gap-1 z-10">
          {/* Sprint B.1: F 交互动作（拾取/打开/放置）按阶段定制，含禁用原因 */}
          {itemActionLabel && (
            <div
              data-testid="context-item-action"
              className={`px-3 py-1.5 rounded-lg border text-sm shadow-lg ${
                itemActionDisabledReason
                  ? 'bg-slate-950/85 border-slate-600/60 text-slate-300'
                  : 'bg-slate-950/85 border-cyan-400/40 text-white'
              }`}
            >
              <kbd className={`mr-2 px-1.5 py-0.5 rounded font-mono ${itemActionDisabledReason ? 'bg-slate-700/60 text-slate-400 line-through' : 'bg-cyan-500/20 text-cyan-300'}`}>F</kbd>
              {itemActionLabel}
              {itemActionDisabledReason && (
                <span className="ml-2 text-[10px] text-red-300">（{itemActionDisabledReason}）</span>
              )}
            </div>
          )}
          {/* Sprint B.1: E 记忆动作文案（记录/更新/保存）按阶段定制 */}
          {memoryActionLabel && (
            <div data-testid="context-memory-action" className="px-2 py-1 rounded bg-slate-950/70 text-xs text-purple-200">
              <kbd className="mr-1.5 font-mono text-purple-400">E</kbd>
              {memoryActionLabel}
              {memoryActionDisabledReason && (
                <span className="ml-1.5 text-[10px] text-red-300">（{memoryActionDisabledReason}）</span>
              )}
            </div>
          )}
          {nearbyEntity && memorySlots.some(s => s?.objectName === nearbyEntity.name && s.outdated) && (
            <div className="mt-2 max-w-[260px] px-4 py-3 rounded-lg bg-gradient-to-br from-red-600/30 to-orange-600/30 border-2 border-red-400/50 text-xs text-red-100 shadow-xl animate-pulse">
              <div className="font-bold mb-1">⚠️ 记忆已过期！</div>
              <div>按 <kbd className="px-1.5 py-0.5 rounded bg-red-500/30 text-red-300 font-mono">E</kbd> 更新 {nearbyEntity.name} 的记忆</div>
              <div className="text-red-200/80 mt-1">更新记忆 +30 分！</div>
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

      {completedGoalBanner && completedGoalBanner.taskId === task?.id && (
        <div
          data-testid="goal-completion-banner"
          className="absolute top-[22%] left-1/2 -translate-x-1/2 pointer-events-none z-40 animate-event-popup"
          role="status"
          aria-live="polite"
        >
          <div className="min-w-[300px] max-w-[min(560px,90vw)] rounded-2xl border-2 border-emerald-300/80 bg-emerald-950/95 px-5 py-4 shadow-2xl shadow-emerald-500/30 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-emerald-400 text-emerald-950 shadow-lg shadow-emerald-400/40">
                <CheckCircle2 size={28} strokeWidth={3} />
              </span>
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">目标完成</div>
                <div className="mt-0.5 text-base font-bold leading-snug text-white">{completedGoalBanner.description}</div>
              </div>
            </div>
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
                    : toast.type === 'success'
                      ? 'bg-emerald-900/90 border border-emerald-400/60'
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
            className={`absolute animate-float-up font-bold text-base flex items-center gap-1 ${
              ft.type === 'score'
                ? 'text-green-400'
                : ft.type === 'error'
                  ? 'text-red-400'
                  : ft.type === 'combo'
                    ? 'text-yellow-400'
                    : ft.type === 'memory'
                      ? 'text-purple-400'
                      : 'text-cyan-300'
            }`}
            style={{
              left: `${50 + (ft.x % 20 - 10)}%`,
              top: `${40 + (ft.y % 10)}%`,
              textShadow: '0 2px 4px rgba(0,0,0,0.8)',
            }}
          >
            {ft.type === 'score' && <span className="text-sm">✨</span>}
            {ft.type === 'error' && <span className="text-sm">❌</span>}
            {ft.type === 'combo' && <span className="text-sm">🔥</span>}
            {ft.type === 'memory' && <span className="text-sm">🧠</span>}
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
        @keyframes outdated-pulse {
          0%, 100% { background-color: rgba(239, 68, 68, 0); }
          50% { background-color: rgba(239, 68, 68, 0.3); }
        }
        .animate-outdated-pulse {
          animation: outdated-pulse 1.5s ease-in-out infinite;
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
        @keyframes held-item-pop {
          0% { opacity: 0; transform: translateX(20px) scale(0.9); }
          50% { transform: translateX(-4px) scale(1.02); }
          100% { opacity: 1; transform: translateX(0) scale(1); }
        }
        .animate-held-item-pop {
          animation: held-item-pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        @keyframes objective-pop {
          0% { opacity: 0; transform: translateY(-8px) scale(0.96); }
          60% { transform: translateY(2px) scale(1.01); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-objective-pop {
          animation: objective-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>
    </div>
  )
}
