import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Sun, Coffee, CloudMoon, Volume2, VolumeX, Sparkles, Play, Lock } from 'lucide-react'
import { PUBLIC_LEVEL_ORDER, HIDDEN_TASK_IDS, getPublicTaskTemplates as _getPublicTaskTemplates, isHiddenTaskId } from '../data/tasks'
import { TaskCard } from '../components/tasks/TaskCard'
import { useUiStore } from '../store/useUiStore'
import { hasSavedGame } from '../save/saveSystem'
import { useGameStore, getGameState } from '../store/useGameStore'
import { SAFE_EMPTY_OBJECT } from '../store/safeStore'

const timeSlots = [
  { icon: Sun, label: '清晨 07:30', color: 'text-yellow-400', emoji: '🌅' },
  { icon: Coffee, label: '上午 08:00', color: 'text-orange-400', emoji: '☕' },
  { icon: CloudMoon, label: '下午 15:00', color: 'text-purple-400', emoji: '🌆' },
  { icon: CloudMoon, label: '黄昏 18:00', color: 'text-pink-400', emoji: '🌇' },
  { icon: CloudMoon, label: '深夜 23:00', color: 'text-indigo-400', emoji: '🌙' },
]

const PUBLIC_LEVEL_CAPTION: Record<string, string> = {
  'task-clean-table': '第一章 · 失忆管家初次启动',
  'task-leave-home': '第二章 · 钥匙猫的清晨恶作剧',
  'task-laundry-sort': '第三章 · 过期的早餐记忆',
}

interface SaveInfo {
  ok: boolean
  timestamp: number
  elapsedMs: number
  score: number
}

export function TaskSelectPage() {
  const navigate = useNavigate()
  // ⚠️ 用单字段 selector 避免 getSnapshot 引用变化 → 无限循环
  const audioEnabled = useUiStore((s) => s.audioEnabled)
  const toggleAudioEnabled = useUiStore((s) => s.toggleAudioEnabled)
  // Hotfix 2026-08-07: 代码分包 / 懒加载会让 zustand selector 首帧拿到 null，
  // 所有 useGameStore selector 统一加可选链 + 下方 useEffect/callback 做 typeof 检查。
  const initializeProgress = useGameStore((s) => s?.initializeProgress)
  const getLevelProgress = useGameStore((s) => s?.getLevelProgress)
  const levelProgress = useGameStore((s) => s?.levelProgress ?? (SAFE_EMPTY_OBJECT as Record<string, any>))

  // 新增：用 state 存储解锁状态，避免 React 首帧 null 导致的解锁判断错误
  const [unlockedMap, setUnlockedMap] = useState<Record<string, boolean>>({})

  // hasSavedGame 做的是 localStorage 同步读，挂 component 内的 useMemo 即可；
  // 额外依赖 remountTrigger 让"继续失败后 fallback 清空存档"能立刻移除按钮。
  // 保留 useState 以便后续扩展"主动删除存档"按钮。
  const [remountTrigger] = useState(0)
  const saveMap = useMemo<Record<string, SaveInfo>>(() => {
    const map: Record<string, SaveInfo> = {}
    ;([...PUBLIC_LEVEL_ORDER, ...HIDDEN_TASK_IDS] as readonly string[]).forEach((id) => {
      const r = hasSavedGame(id)
      if (r.ok) map[id] = { ok: true, timestamp: r.timestamp, elapsedMs: r.elapsedMs, score: r.score }
    })
    return map
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remountTrigger])
  // 用 src/data/tasks 里的权威 getPublicTaskTemplates（DEV 环境下 VITE_UNLOCK_HIDDEN_LEVELS=true 会返回 5 关）
  const publicTaskTemplates = useMemo(() => _getPublicTaskTemplates(), [])
  // 解锁序列使用 PUBLIC_LEVEL_ORDER 顺序（隐藏关排在后面，用前一关完成解锁）
  const unlockOrder = useMemo<string[]>(() => {
    return [...PUBLIC_LEVEL_ORDER, ...HIDDEN_TASK_IDS]
  }, [])

  useEffect(() => {
    // 初始化所有显示关卡的 progress
    if (typeof initializeProgress !== 'function') return
    initializeProgress(publicTaskTemplates.map((t) => t.id))
  }, [initializeProgress, publicTaskTemplates])

  // 新增：用 getGameState() 获取真实的解锁状态，绕过 withSafeSnapshot 的 getState bug
  useEffect(() => {
    const state = getGameState() as any
    if (!state || typeof state.isLevelUnlocked !== 'function') {
      console.warn('[TaskSelectPage] getGameState 无 isLevelUnlocked → 默认全部解锁')
      const fallbackMap: Record<string, boolean> = {}
      publicTaskTemplates.forEach((t) => { fallbackMap[t.id] = true })
      setUnlockedMap(fallbackMap)
      return
    }
    const map: Record<string, boolean> = {}
    publicTaskTemplates.forEach((t) => {
      map[t.id] = state.isLevelUnlocked(t.id, unlockOrder)
    })
    setUnlockedMap(map)
  }, [publicTaskTemplates, unlockOrder])

  const handleStart = (taskId: string) => {
    // 点"开始任务" → 清掉可能残留的 sessionStorage 标记，避免 ArenaPage 当成继续入口
    try { sessionStorage.removeItem(`hm_continue_${taskId}`) } catch {}
    navigate(`/play/${taskId}`)
  }

  const handleContinue = (taskId: string) => {
    // 点"继续游戏" → 先标记 sessionStorage，ArenaPage 初始化时会读这个标记并 restoreSave
    if (!hasSavedGame(taskId).ok) {
      // 存档不合法（被过期版本扫到/手动删了）→ 直接 fallback 到新开局
      handleStart(taskId)
      return
    }
    try { sessionStorage.setItem(`hm_continue_${taskId}`, '1') } catch {}
    navigate(`/play/${taskId}`)
  }

  const getLatestSaveForTask = (taskId: string) => {
    const s = saveMap[taskId]
    if (!s) return undefined
    return { id: `autosave_${taskId}`, taskId, timestamp: s.timestamp, elapsedMs: s.elapsedMs, score: s.score }
  }

  const getNextUnlockedTaskIndex = () => {
    const order = publicTaskTemplates.map((t) => t.id)
    for (let i = 0; i < order.length; i++) {
      const progress = levelProgress[order[i]]
      if (!progress?.completed) {
        return i
      }
    }
    return Math.max(0, order.length - 1)
  }

  const completedCount = publicTaskTemplates.filter((t) => levelProgress[t.id]?.completed).length
  const nextIndex = getNextUnlockedTaskIndex()
  const isFiveLevelMode = publicTaskTemplates.length >= 5

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/50 to-slate-900 flex flex-col relative overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-[5%] left-[5%] w-[350px] h-[350px] rounded-full opacity-25"
          style={{
            background: 'radial-gradient(circle, rgba(168,85,247,0.3) 0%, transparent 70%)',
            animation: 'float 8s ease-in-out infinite',
          }}
        />
        <div
          className="absolute bottom-[5%] right-[5%] w-[450px] h-[450px] rounded-full opacity-15"
          style={{
            background: 'radial-gradient(circle, rgba(236,72,153,0.2) 0%, transparent 70%)',
            animation: 'float 10s ease-in-out infinite reverse',
          }}
        />
        <div
          className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-5"
          style={{
            background: 'radial-gradient(circle, rgba(0,245,255,0.2) 0%, transparent 70%)',
          }}
        />
      </div>

      <div className="relative z-1 p-4 md:p-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          返回
        </button>
      </div>

      <div className="relative z-1 flex-1 flex flex-col items-center px-4 pb-16 pt-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-4">
            {timeSlots.slice(0, isFiveLevelMode ? 5 : 3).map((t, i) => (
              <span
                key={i}
                className={`text-4xl ${i === Math.min(nextIndex, timeSlots.length - 1) ? 'animate-pulse' : ''}`}
              >
                {t.emoji}
              </span>
            ))}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-violet-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
              {isFiveLevelMode ? '五个关卡（含预览）' : '三个关卡，全部开放'}
            </span>
          </h1>
          <p className="text-slate-400 text-lg mb-4">
            {isFiveLevelMode
              ? 'DEV 预览模式：3 个公开关 + 2 个隐藏关内测版（正式版默认只显示 3 关）'
              : '跟随 MEM-07 在记忆宅邸中找回失落的记忆碎片，三幕剧情递进展开~'}
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-purple-500/20 border border-purple-500/30 rounded-full text-xs text-violet-300">
              <Sparkles size={12} />
              全部关卡开放，自由选择
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-slate-800/60 border border-slate-700/50 rounded-full text-xs text-slate-400">
              <span className="text-green-400">{completedCount}</span> / {publicTaskTemplates.length} 已完成
            </div>
            {isFiveLevelMode && (
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-500/20 border border-amber-500/30 rounded-full text-xs text-amber-300">
                <Lock size={12} />
                DEV 预览：2 个隐藏关已解锁显示
              </div>
            )}
          </div>
        </div>

        <div className="relative max-w-4xl w-full">
          <div className="absolute left-8 md:left-1/2 top-8 bottom-8 w-1 bg-gradient-to-b from-yellow-500/30 via-orange-500/30 to-purple-500/30" />

          <div className="space-y-6">
            {publicTaskTemplates.map((task, index) => {
              const progress = typeof getLevelProgress === 'function'
                ? getLevelProgress(task.id)
                : { taskId: task.id, unlocked: true, completed: false, rank: null, bestScore: 0, completionTime: null, attempts: 0 }
              // 修复：使用 unlockedMap state 而非 isLevelUnlocked selector
              // 避免 React 首帧 null 导致的解锁判断错误
              const unlocked = unlockedMap[task.id] ?? true
              const isHidden = isHiddenTaskId(task.id)
              const isNext = index === nextIndex && unlocked && !progress.completed
              const isCompleted = progress.completed
              const caption = PUBLIC_LEVEL_CAPTION[task.id] || task.description
              const displayTask = { ...task, description: caption }
              const slot = timeSlots[index] ?? timeSlots[timeSlots.length - 1]

              return (
                <div key={task.id} className="relative">
                  <div className="absolute left-6 md:left-1/2 top-8 -translate-x-1/2 z-20">
                    <div className={`
                      w-6 h-6 rounded-full flex items-center justify-center
                      ${isCompleted
                        ? 'bg-gradient-to-br from-green-400 to-emerald-500 shadow-lg shadow-green-500/30'
                        : unlocked
                          ? isHidden
                            ? 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-orange-500/30 animate-pulse'
                            : 'bg-gradient-to-br from-purple-400 to-pink-500 shadow-lg shadow-purple-500/30 animate-pulse'
                          : 'bg-slate-700 border-2 border-slate-600'
                      }
                    `}>
                      {isCompleted ? (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : unlocked ? (
                        <Play size={10} className="text-white" fill="white" />
                      ) : null}
                    </div>
                  </div>

                  <div className={`
                    flex ${index % 2 === 0 ? 'md:justify-start' : 'md:justify-end'}
                  `}>
                    <div className={`
                      w-full md:w-[calc(50%-2rem)] ${index % 2 === 0 ? 'md:pr-8' : 'md:pl-8'} relative
                    `}>
                      <TaskCard
                        task={displayTask}
                        levelNumber={index + 1}
                        onStart={handleStart}
                        timeLabel={slot.label}
                        timeIcon={slot.emoji}
                        saveInfo={getLatestSaveForTask(task.id)}
                        onContinue={handleContinue}
                        progress={progress}
                        unlocked={unlocked}
                        isNextToUnlock={isNext}
                      />
                      {/* 未解锁关卡：加上锁蒙层，明确告诉用户"这关存在，但暂时不能玩"，避免误以为只有 1~2 关 */}
                      {!unlocked && (
                        <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-slate-950/85 backdrop-blur-sm pointer-events-none z-10 border-2 border-slate-700/60">
                          <div className="text-center px-4">
                            <div className="text-4xl mb-2">🔒</div>
                            <div className="text-sm font-semibold text-slate-300 mb-1">
                              第 {index + 1} 关 · 待解锁
                            </div>
                            <div className="text-xs text-slate-500 leading-relaxed">
                              完成前一关后自动解锁
                              <br />
                              <span className="text-slate-400">（DEV 模式默认已全部解锁）</span>
                            </div>
                          </div>
                        </div>
                      )}
                      {/* 隐藏关卡内测标签：只在 DEV 5 关预览模式下显示 */}
                      {isHidden && unlocked && (
                        <div className="absolute top-3 left-3 z-20 px-2 py-1 rounded text-[10px] font-bold text-amber-200 bg-amber-500/25 border border-amber-500/40 pointer-events-none">
                          🔬 DEV 预览 · 未正式开放
                        </div>
                      )}
                    </div>
                  </div>

                  {index < publicTaskTemplates.length - 1 && (
                    <div className="absolute left-6 md:left-1/2 top-16 -translate-x-1/2 z-10">
                      <div className={`
                        w-0.5 h-8
                        ${isCompleted ? 'bg-gradient-to-b from-green-400/50 to-green-500/30' : 'bg-slate-700/50'}
                      `} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-6 px-6 py-3 bg-slate-800/40 border border-slate-700/30 rounded-xl">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-gradient-to-br from-purple-400 to-pink-500" />
              <span className="text-xs text-slate-400">进行中</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-gradient-to-br from-green-400 to-emerald-500" />
              <span className="text-xs text-slate-400">已完成</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-slate-700 border-2 border-slate-600" />
              <span className="text-xs text-slate-400">未解锁</span>
            </div>
            {isFiveLevelMode && (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-gradient-to-br from-amber-400 to-orange-500" />
                <span className="text-xs text-slate-400">DEV 预览</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="relative z-1 py-6 text-center text-slate-500 text-sm">
        <button
          onClick={toggleAudioEnabled}
          className="mt-4 flex items-center justify-center gap-2 mx-auto text-sm text-slate-400 hover:text-white transition-colors"
        >
          {audioEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          {audioEnabled ? '音效开启' : '音效关闭'}
        </button>
      </div>
    </div>
  )
}
