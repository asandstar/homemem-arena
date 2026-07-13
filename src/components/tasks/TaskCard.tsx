import { Lock, Star, Zap, Clock, RotateCcw, ChevronRight } from 'lucide-react'
import type { TaskConfig } from '../../types/task'
import type { SaveMetadata } from '../../save/saveSystem'
import type { LevelProgress } from '../../store/slices/progressSlice'

interface TaskCardProps {
  task: TaskConfig
  levelNumber: number
  onStart: (taskId: string) => void
  timeLabel?: string
  timeIcon?: React.ReactNode
  saveInfo?: SaveMetadata
  onContinue?: (saveId: string) => void
  progress?: LevelProgress
  unlocked?: boolean
  isNextToUnlock?: boolean
}

function difficultyColor(difficulty: string): string {
  switch (difficulty) {
    case 'easy':
      return 'text-green-400'
    case 'medium':
      return 'text-yellow-400'
    case 'hard':
      return 'text-red-400'
    default:
      return 'text-blue-400'
  }
}

function difficultyLabel(difficulty: string): string {
  switch (difficulty) {
    case 'easy':
      return '简单'
    case 'medium':
      return '中等'
    case 'hard':
      return '困难'
    default:
      return difficulty
  }
}

function rankColor(rank: string | null): string {
  switch (rank) {
    case 'S':
      return 'text-game-s-rank'
    case 'A':
      return 'text-game-a-rank'
    case 'B':
      return 'text-game-b-rank'
    case 'C':
      return 'text-game-c-rank'
    case 'D':
      return 'text-game-d-rank'
    default:
      return 'text-slate-500'
  }
}

function rankGlow(rank: string | null): string {
  switch (rank) {
    case 'S':
      return 'shadow-[0_0_15px_rgba(255,107,157,0.5)]'
    case 'A':
      return 'shadow-[0_0_15px_rgba(74,222,128,0.5)]'
    default:
      return ''
  }
}

function formatSaveTime(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatElapsedTime(elapsedMs: number): string {
  const seconds = Math.floor(elapsedMs / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
}

export function TaskCard({
  task,
  levelNumber,
  onStart,
  timeLabel,
  timeIcon,
  saveInfo,
  onContinue,
  progress,
  unlocked,
  isNextToUnlock,
}: TaskCardProps) {
  const isCompleted = progress?.completed ?? false
  const hasSave = saveInfo && !saveInfo.levelCompleted && !saveInfo.levelFailed
  const rank = progress?.rank ?? null

  return (
    <div className={`relative group ${!unlocked ? 'opacity-60' : ''}`}>
      {unlocked && isNextToUnlock && (
        <div className="absolute -top-2 -right-2 z-20">
          <div className="bg-amber-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
            下一个
          </div>
        </div>
      )}

      <div
        className={`
          relative w-full rounded-2xl overflow-hidden transition-all duration-500
          ${unlocked
            ? isCompleted
              ? 'bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50 hover:border-purple-500/50 hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/10'
              : 'bg-gradient-to-br from-purple-900/40 to-slate-900/60 border border-purple-500/30 hover:border-purple-400/50 hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/20'
            : 'bg-slate-900/40 border border-slate-700/30'
          }
        `}
      >
        <div className={`absolute top-0 left-0 w-1 h-full ${isCompleted ? 'bg-gradient-to-b from-green-400 to-emerald-500' : unlocked ? 'bg-gradient-to-b from-purple-400 to-pink-500' : 'bg-slate-600'}`} />

        <div className="p-5 pl-6">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={`
                w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-bold
                ${isCompleted
                  ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 text-green-400 border border-green-500/30'
                  : unlocked
                    ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 text-purple-400 border border-purple-500/30'
                    : 'bg-slate-800/50 text-slate-500 border border-slate-700/30'
                }
              `}>
                {!unlocked ? <Lock size={20} /> : levelNumber}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  {timeIcon && <span className="text-slate-400">{timeIcon}</span>}
                  {timeLabel && <span className="text-xs text-slate-500">{timeLabel}</span>}
                </div>
                <h3 className={`text-xl font-bold mt-0.5 ${unlocked ? 'text-white' : 'text-slate-500'}`}>
                  {task.name}
                </h3>
              </div>
            </div>

            {isCompleted && rank && (
              <div className={`text-2xl font-black ${rankColor(rank)} ${rankGlow(rank)}`}>
                {rank}
              </div>
            )}
          </div>

          <p className={`text-sm mb-4 leading-relaxed ${unlocked ? 'text-slate-300' : 'text-slate-600'}`}>
            {task.description}
          </p>

          <div className="flex items-center gap-4 mb-4 text-xs">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Zap size={14} className={difficultyColor(task.difficulty)} />
              <span>{difficultyLabel(task.difficulty)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <Star size={14} className="text-yellow-400" />
              <span>{task.memoryTypes.length} 种记忆类型</span>
            </div>
            {progress?.attempts && progress.attempts > 0 && (
              <div className="flex items-center gap-1.5 text-slate-400">
                <RotateCcw size={14} />
                <span>尝试 {progress.attempts} 次</span>
              </div>
            )}
          </div>

          {hasSave && (
            <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-amber-400" />
                  <span className="text-xs text-amber-300">上次保存: {formatSaveTime(saveInfo.timestamp)}</span>
                </div>
                <span className="text-xs text-amber-300">已用时间: {formatElapsedTime(saveInfo.elapsedMs)}</span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              {[1, 2, 3].map((star) => (
                <Star
                  key={star}
                  size={14}
                  className={`${
                    isCompleted && (progress?.bestScore ?? 0) >= star * 300
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-slate-700'
                  }`}
                />
              ))}
            </div>

            {unlocked ? (
              <button
                type="button"
                onClick={() => {
                  if (hasSave && onContinue) {
                    onContinue(saveInfo!.id)
                  } else {
                    onStart(task.id)
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300
                  bg-gradient-to-r from-purple-600 to-pink-600 text-white
                  hover:from-purple-500 hover:to-pink-500
                  hover:shadow-lg hover:shadow-purple-500/30
                  active:scale-95"
              >
                <span>{hasSave ? '继续挑战' : '开始挑战'}</span>
                <ChevronRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                disabled
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                  bg-slate-800/50 text-slate-500 border border-slate-700/50 cursor-not-allowed"
              >
                <Lock size={14} />
                <span>完成前一关解锁</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
