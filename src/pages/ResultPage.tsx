import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSessionStore } from '../store/useSessionStore'
import { useGameStore, type GameStats } from '../store/useGameStore'
import { useUiStore } from '../store/useUiStore'
import { Download, RotateCcw, Home, Trophy, Zap, Clock, AlertCircle, Lightbulb, Star, Bot, Brain, AlertTriangle, RefreshCw, Volume2, VolumeX, MapPin, Box, History, Play, BarChart3, ArrowRight, CheckCircle2 } from 'lucide-react'
import { getRank, getTitle } from '../game/scoring'
import { getNextPublicTaskId, getTaskById, isPublicTaskId, isHiddenTaskId } from '../data/tasks'

/** 模块级安全 env 访问，避免 SyntaxError: Cannot use 'import.meta' outside a module */
const _SAFE_ENV: { DEV: boolean; PROD: boolean } = (() => {
  try {
    const env = (import.meta as any)?.env
    return { DEV: Boolean(env?.DEV), PROD: Boolean(env?.PROD) }
  } catch {
    return { DEV: false, PROD: true }
  }
})()

function StarIcon({ filled, index }: { filled: boolean; index: number }) {
  return (
    <Star
      size={40}
      className={`transition-all duration-500 ${
        filled
          ? 'text-game-gold fill-game-gold'
          : 'text-game-border'
      } ${filled ? 'animate-star-pulse' : ''}`}
      style={{ animationDelay: `${index * 0.2}s` }}
    />
  )
}

function getStars(score: number): number {
  if (score >= 1200) return 5
  if (score >= 900) return 4
  if (score >= 650) return 3
  if (score >= 400) return 2
  return 1
}

function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
}

function generateDiagnosis(stats: GameStats): string {
  const lines: string[] = []

  // ===== 1. 头：完成/失败 =====
  if (stats.levelCompleted) {
    lines.push('任务完成。')
  } else {
    lines.push(`任务未完成：${stats.failureReason || '没能找到最后一件关键物品。'}`)
  }

  // ===== 2. 记忆槽使用情况 =====
  if (stats.memoryUsedCount > 0) {
    const rate = Math.round(stats.memoryEffectiveRate * 100)
    if (rate >= 80) {
      lines.push(`你很会用记忆——${stats.memoryUsedCount} 条记录里有效率达到 ${rate}%。`)
    } else if (rate >= 50) {
      lines.push(`用了 ${stats.memoryUsedCount} 次记忆，有效率 ${rate}%。`)
      lines.push('建议：物品位置变了之后尽快按 E 覆盖旧记录，别让过期记忆占着槽。')
    } else {
      lines.push(`记忆槽用了 ${stats.memoryUsedCount} 次，但有效率只有 ${rate}%——`)
      lines.push('记录完之后，如果发生了猫咪捣乱、幽灵交换篮子这种事，要记得更新记录。')
    }
  } else {
    lines.push('没有使用记忆槽。记住：看到重要物品时按 E 存个位置，省得之后满屋子找。')
  }

  // ===== 3. 过期记忆 =====
  if (stats.outdatedMemoryCount > 0) {
    lines.push(`有 ${stats.outdatedMemoryCount} 条记录已经过期了——它们指向的位置早就变了。`)
  }

  // ===== 4. 放错物品 =====
  if (stats.wrongPlaceCount > 0) {
    lines.push(`放错了 ${stats.wrongPlaceCount} 次。`)
    lines.push('提示：把物品移到容器上方时，留意容器图标和物品颜色是否对得上。')
  }

  // ===== 5. 混乱值（最后唯一 1 条轻度猫吐槽，要自然）=====
  if (stats.chaosPeak >= 80) {
    lines.push(`混乱值最高到过 ${Math.round(stats.chaosPeak)}%。`)
    lines.push('如果房间里有猫，记得多回头看看桌面。')
  } else if (stats.chaosPeak >= 60) {
    lines.push(`混乱峰值 ${Math.round(stats.chaosPeak)}%，中间有几次小波澜，总体控制住了。`)
  } else {
    lines.push(`混乱峰值只有 ${Math.round(stats.chaosPeak)}%，很稳。`)
  }

  // ===== 6. Combo =====
  if (stats.maxCombo >= 5) {
    lines.push(`最流畅的一次连击：${stats.maxCombo} 步连续正确。手感不错。`)
  }

  return lines.join(' ')
}

export function ResultPage() {
  const { taskId } = useParams<{ taskId: string }>()
  const navigate = useNavigate()
  // ⚠️ 用单字段 selector 避免 getSnapshot 引用变化 → 无限循环
  const currentSession = useSessionStore((s) => s.currentSession)
  const getGameStats = useGameStore((s) => s.getGameStats)
  const audioEnabled = useUiStore((s) => s.audioEnabled)
  const toggleAudioEnabled = useUiStore((s) => s.toggleAudioEnabled)
  const gameStats = getGameStats()

  const handleDownloadJson = () => {
    if (!currentSession) return
    const data = JSON.stringify(currentSession, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `session-${currentSession.id}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const rankInfo = getRank(gameStats.score)
  const stars = getStars(gameStats.score)
  const title = getTitle(
    gameStats.score,
    gameStats.maxCombo,
    gameStats.wrongPlaceCount,
    gameStats.chaosPeak,
    gameStats.memoryEffectiveRate,
    gameStats.levelCompleted
  )

  const diagnosis = generateDiagnosis(gameStats)

  useEffect(() => {
    if (taskId && _SAFE_ENV.PROD && isHiddenTaskId(taskId)) {
      navigate('/tasks', { replace: true })
      return
    }
    if (!currentSession && gameStats.taskName === null) {
      navigate('/tasks', { replace: true })
    }
  }, [taskId, currentSession, gameStats.taskName, navigate])

  if (!currentSession && gameStats.taskName === null) {
    return (
      <div className="flex items-center justify-center h-full bg-game-bg">
        <p className="text-game-text-muted">加载结果中...</p>
      </div>
    )
  }

  const { failureReasons, policySuggestions, aiSummary } = currentSession || { failureReasons: [], policySuggestions: [], aiSummary: '' }

  return (
    <div className="min-h-screen bg-game-bg p-4 md:p-8 overflow-y-auto" data-testid="result-page">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 mb-4">
            <Trophy className="text-game-gold" size={32} />
            <span className="text-game-text-muted text-sm tracking-widest uppercase">
              {gameStats.levelCompleted ? 'Mission Complete' : 'Mission Failed'}
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-game-text mb-2">
            {gameStats.levelCompleted ? '任务完成！' : '任务失败'}
          </h1>
          <p className="text-game-text-muted">{gameStats.taskName || '未知任务'}</p>
        </div>

        <div className="bg-game-surface rounded-xl p-6 md:p-8 shadow-[var(--shadow-game-card)]">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col items-center">
              <div className={`text-8xl md:text-9xl font-black ${rankInfo.color} mb-2`}>
                {rankInfo.rank}
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <StarIcon key={i} filled={i <= stars} index={i} />
                ))}
              </div>
            </div>

            <div className="flex flex-col items-center">
              <div className="text-game-text-muted text-sm mb-1">最终得分</div>
              <div className="text-5xl md:text-6xl font-bold text-game-neon-blue">
                {gameStats.score.toLocaleString()}
              </div>
              <div className="mt-2 px-6 py-2 bg-game-surface-light rounded-full border border-game-border">
                <span className="text-game-gold font-bold text-lg">{title}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-game-surface rounded-lg p-4 text-center border border-game-border">
            <Clock className="text-game-neon-blue mx-auto mb-2" size={24} />
            <div className="text-game-text-muted text-xs">完成时间</div>
            <div className="text-game-text font-bold">{formatTime(gameStats.elapsedMs)}</div>
          </div>
          <div className="bg-game-surface rounded-lg p-4 text-center border border-game-border">
            <Zap className="text-game-gold mx-auto mb-2" size={24} />
            <div className="text-game-text-muted text-xs">最大 Combo</div>
            <div className="text-game-text font-bold">{gameStats.maxCombo}</div>
          </div>
          <div className="bg-game-surface rounded-lg p-4 text-center border border-game-border">
            <AlertTriangle className="text-game-warning mx-auto mb-2" size={24} />
            <div className="text-game-text-muted text-xs">混乱峰值</div>
            <div className="text-game-text font-bold">{Math.round(gameStats.chaosPeak)}%</div>
          </div>
          <div className="bg-game-surface rounded-lg p-4 text-center border border-game-border">
            <AlertCircle className="text-game-d-rank mx-auto mb-2" size={24} />
            <div className="text-game-text-muted text-xs">错误放置</div>
            <div className="text-game-text font-bold">{gameStats.wrongPlaceCount}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-game-surface rounded-lg p-4 text-center border border-game-border">
            <Brain className="text-game-neon-purple mx-auto mb-2" size={24} />
            <div className="text-game-text-muted text-xs">保存记忆</div>
            <div className="text-game-text font-bold">{gameStats.memoryUsedCount}</div>
          </div>
          <div className="bg-game-surface rounded-lg p-4 text-center border border-game-border">
            <RefreshCw className="text-game-warning mx-auto mb-2" size={24} />
            <div className="text-game-text-muted text-xs">更新记忆</div>
            <div className="text-game-text font-bold">{gameStats.memoryUpdateCount}</div>
          </div>
          <div className="bg-game-surface rounded-lg p-4 text-center border border-game-border">
            <AlertCircle className="text-game-d-rank mx-auto mb-2" size={24} />
            <div className="text-game-text-muted text-xs">过期记忆</div>
            <div className="text-game-text font-bold">{gameStats.outdatedMemoryCount}</div>
          </div>
          <div className="bg-game-surface rounded-lg p-4 text-center border border-game-border">
            <Bot className="text-game-neon-green mx-auto mb-2" size={24} />
            <div className="text-game-text-muted text-xs">有效记忆率</div>
            <div className="text-game-text font-bold">{Math.round(gameStats.memoryEffectiveRate * 100)}%</div>
          </div>
          <div className="bg-game-surface rounded-lg p-4 text-center border border-game-border md:col-span-1 col-span-2">
            <RotateCcw className="text-game-text-muted mx-auto mb-2" size={24} />
            <div className="text-game-text-muted text-xs">重复搜索</div>
            <div className="text-game-text font-bold">{gameStats.repeatSearchCount}</div>
          </div>
        </div>

        <div className="bg-game-surface rounded-xl p-6 border border-game-border">
          <h3 className="font-semibold text-game-text mb-4 flex items-center gap-2">
            <BarChart3 className="text-cyan-400" size={20} />
            记忆类型分析报告
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <MapPin size={14} className="text-green-400" />
                <span className="text-xs text-slate-400">空间记忆</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {gameStats.spatialMemoryUsed || 0}
              </div>
              <div className="text-xs text-slate-500">次使用</div>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Box size={14} className="text-purple-400" />
                <span className="text-xs text-slate-400">物体记忆</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {gameStats.objectMemoryUsed || 0}
              </div>
              <div className="text-xs text-slate-500">次使用</div>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <History size={14} className="text-blue-400" />
                <span className="text-xs text-slate-400">时间记忆</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {gameStats.temporalMemoryUsed || 0}
              </div>
              <div className="text-xs text-slate-500">次使用</div>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Play size={14} className="text-orange-400" />
                <span className="text-xs text-slate-400">程序记忆</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {gameStats.proceduralMemoryUsed || 0}
              </div>
              <div className="text-xs text-slate-500">次使用</div>
            </div>
          </div>
          <div className="mt-4 p-4 bg-slate-900/30 rounded-lg">
            <div className="text-xs text-slate-400 font-mono mb-2">MEMORY EFFECTIVENESS BY TYPE</div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MapPin size={10} className="text-green-400" />
                <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: `${Math.min(100, (gameStats.spatialMemoryUsed || 0) * 20)}%` }} />
                </div>
                <span className="text-xs text-slate-400 w-12">{Math.round(Math.min(100, (gameStats.spatialMemoryUsed || 0) * 20))}%</span>
              </div>
              <div className="flex items-center gap-2">
                <Box size={10} className="text-purple-400" />
                <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full" style={{ width: `${Math.min(100, (gameStats.objectMemoryUsed || 0) * 20)}%` }} />
                </div>
                <span className="text-xs text-slate-400 w-12">{Math.round(Math.min(100, (gameStats.objectMemoryUsed || 0) * 20))}%</span>
              </div>
              <div className="flex items-center gap-2">
                <History size={10} className="text-blue-400" />
                <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, (gameStats.temporalMemoryUsed || 0) * 20)}%` }} />
                </div>
                <span className="text-xs text-slate-400 w-12">{Math.round(Math.min(100, (gameStats.temporalMemoryUsed || 0) * 20))}%</span>
              </div>
              <div className="flex items-center gap-2">
                <Play size={10} className="text-orange-400" />
                <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500 rounded-full" style={{ width: `${Math.min(100, (gameStats.proceduralMemoryUsed || 0) * 20)}%` }} />
                </div>
                <span className="text-xs text-slate-400 w-12">{Math.round(Math.min(100, (gameStats.proceduralMemoryUsed || 0) * 20))}%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-game-surface rounded-xl p-6 border border-game-border">
          <h3 className="font-semibold text-game-text mb-4 flex items-center gap-2">
            <Bot className="text-game-neon-purple" size={20} />
            AI 机器人诊断报告
          </h3>
          <div className="space-y-4">
            <div className="p-4 bg-game-surface-light rounded-lg">
              <p className="text-game-text-muted text-sm leading-relaxed">
                {aiSummary || diagnosis}
              </p>
            </div>

            {failureReasons && failureReasons.length > 0 && (
              <div className="p-4 bg-danger/10 rounded-lg border border-danger/30">
                <h4 className="font-medium text-danger mb-2 flex items-center gap-2">
                  <AlertCircle size={16} /> 失败原因分析
                </h4>
                <ul className="space-y-2">
                  {failureReasons.map((reason, index) => (
                    <li key={index} className="text-sm text-game-text">
                      • {reason.description}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {policySuggestions && policySuggestions.length > 0 && (
              <div className="p-4 bg-success/10 rounded-lg border border-success/30">
                <h4 className="font-medium text-success mb-2 flex items-center gap-2">
                  <Lightbulb size={16} /> 策略优化建议
                </h4>
                <ul className="space-y-3">
                  {policySuggestions.map((suggestion, index) => (
                    <li key={index} className="text-sm">
                      <span className="font-medium text-game-text">{suggestion.title}</span>
                      <p className="text-game-text-muted mt-1">{suggestion.description}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {taskId && isPublicTaskId(taskId) && gameStats.levelCompleted && (() => {
          const nextTaskId = getNextPublicTaskId(taskId)
          const nextTask = nextTaskId ? getTaskById(nextTaskId) : null
          if (nextTaskId && nextTask) {
            return (
              <div className="flex justify-center mb-2">
                <button
                  onClick={() => navigate(`/play/${nextTaskId}`)}
                  data-testid="next-level-button"
                  className="px-6 py-3 bg-gradient-to-r from-violet-600 to-pink-600 text-white font-bold rounded-lg hover:from-violet-500 hover:to-pink-500 transition-all shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2"
                >
                  <span>进入下一关：{nextTask.name}</span>
                  <ArrowRight size={20} />
                </button>
              </div>
            )
          }
          return (
            <div className="flex justify-center mb-2">
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-emerald-500/15 to-cyan-500/15 border border-emerald-500/30 rounded-xl">
                <CheckCircle2 size={22} className="text-emerald-400" />
                <span className="text-emerald-300 font-semibold">已完成当前版本的全部挑战</span>
              </div>
            </div>
          )
        })()}

        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button
            onClick={() => navigate(`/play/${taskId}`)}
            data-testid="replay-button"
            className="px-6 py-3 bg-game-neon-blue text-game-bg font-bold rounded-lg hover:bg-opacity-80 transition-all shadow-[var(--shadow-game-glow-neon)] flex items-center justify-center gap-2"
          >
            <RotateCcw size={20} />
            再玩一次
          </button>
          <button
            onClick={() => navigate('/tasks')}
            className="px-6 py-3 bg-game-surface-light text-game-text font-bold rounded-lg hover:bg-game-surface transition-all border border-game-border flex items-center justify-center gap-2"
          >
            <Home size={20} />
            返回关卡选择
          </button>
          <button
            onClick={handleDownloadJson}
            className="px-6 py-3 bg-game-surface text-game-text-muted hover:text-game-text rounded-lg hover:bg-game-surface-light transition-all border border-game-border flex items-center justify-center gap-2"
          >
            <Download size={20} />
            下载 JSON
          </button>
        </div>
        <div className="flex justify-center">
          <button
            onClick={toggleAudioEnabled}
            className="flex items-center gap-2 text-sm text-game-text-muted hover:text-game-text transition-colors"
          >
            {audioEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            {audioEnabled ? '音效开启' : '音效关闭'}
          </button>
        </div>
      </div>
    </div>
  )
}
