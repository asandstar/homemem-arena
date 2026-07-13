import { ArrowRight, DoorOpen, Utensils, Shirt, Coffee, Star, Zap, Clock, RotateCcw } from 'lucide-react'
import type { TaskConfig } from '../../types/task'
import type { SaveMetadata } from '../../save/saveSystem'

interface TaskCardProps {
  task: TaskConfig
  levelNumber: number
  onStart: (taskId: string) => void
  timeLabel?: string
  saveInfo?: SaveMetadata
  onContinue?: (saveId: string) => void
}

function difficultyColor(difficulty: string): string {
  switch (difficulty) {
    case 'easy':
      return 'from-green-500 to-emerald-500'
    case 'medium':
      return 'from-yellow-500 to-orange-500'
    case 'hard':
      return 'from-red-500 to-pink-500'
    default:
      return 'from-blue-500 to-purple-500'
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

function getTaskIcon(iconKey?: string) {
  switch (iconKey) {
    case 'door':
      return <DoorOpen size={32} />
    case 'dish':
      return <Utensils size={32} />
    case 'shirt':
      return <Shirt size={32} />
    case 'breakfast':
      return <Coffee size={32} />
    default:
      return <DoorOpen size={32} />
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

export function TaskCard({ task, levelNumber, onStart, timeLabel, saveInfo, onContinue }: TaskCardProps) {
  return (
    <div className="relative w-full bg-slate-800/60 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 hover:border-purple-500/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-purple-500/10">
      <div className="absolute -top-3 -left-3 w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
        {levelNumber}
      </div>

      {timeLabel && (
        <div className="absolute -top-2 right-4 bg-slate-900/80 px-3 py-1 rounded-full text-xs text-slate-300 border border-slate-600">
          {timeLabel}
        </div>
      )}

      <div className="flex items-start justify-between mb-4 pt-2">
        <div className="flex items-center gap-3">
          <div className={`p-3 bg-gradient-to-br ${difficultyColor(task.difficulty)} rounded-xl text-white`}>
            {getTaskIcon(task.iconKey)}
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">{task.name}</h3>
            <div className="flex items-center gap-1 text-sm text-slate-400">
              <Zap size={12} className="text-yellow-400" />
              {task.memoryTypes.length} 种记忆类型
            </div>
          </div>
        </div>
      </div>

      <p className="text-sm text-slate-300 mb-4 leading-relaxed">{task.description}</p>

      {saveInfo && !saveInfo.levelCompleted && !saveInfo.levelFailed && (
        <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-amber-400" />
              <span className="text-xs text-amber-300">上次保存: {formatSaveTime(saveInfo.timestamp)}</span>
            </div>
            <span className="text-xs text-amber-300">已用时间: {formatElapsedTime(saveInfo.elapsedMs)}</span>
          </div>
          <button
            type="button"
            onClick={() => onContinue?.(saveInfo.id)}
            className="mt-2 flex items-center gap-1.5 text-xs text-amber-300 hover:text-amber-200 transition-colors"
          >
            <RotateCcw size={12} />
            继续游戏
          </button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Star className="text-yellow-400 size={16}" />
          <span className="text-sm text-slate-400">{difficultyLabel(task.difficulty)}</span>
        </div>
        <button
          type="button"
          onClick={() => onStart(task.id)}
          className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors"
        >
          <span className="text-sm font-medium">开始挑战</span>
          <ArrowRight size={18} className="hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  )
}
