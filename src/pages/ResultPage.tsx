import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSessionStore } from '../store/useSessionStore'
import { useGameStore, type GameStats } from '../store/useGameStore'
import { useUiStore } from '../store/useUiStore'
import { Download, RotateCcw, Home, Trophy, Zap, Clock, AlertCircle, Lightbulb, Star, Bot, Brain, AlertTriangle, RefreshCw, Volume2, VolumeX, MapPin, Box, History, Play, BarChart3 } from 'lucide-react'
import { getRank, getTitle } from '../game/scoring'

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
  const parts: string[] = ['MEM-07 诊断报告。']

  if (stats.levelCompleted) {
    parts.push('任务完成。')
  } else {
    parts.push(`任务失败：${stats.failureReason || '未知原因'}。`)
  }

  if (stats.memoryUsedCount > 0) {
    const rate = Math.round(stats.memoryEffectiveRate * 100)
    if (rate >= 80) {
      parts.push(`记忆表现优秀，有效记忆率达到 ${rate}%。`)
    } else if (rate >= 50) {
      parts.push(`记忆利用率为 ${rate}%，建议更频繁地更新记忆。`)
    } else {
      parts.push(`记忆系统需要维护，有效记忆率仅 ${rate}%。`)
    }
  } else {
    parts.push('本机检测到：记忆槽未被使用。按 E 可以保存重要物品位置。')
  }

  if (stats.outdatedMemoryCount > 0) {
    parts.push(`检测到 ${stats.outdatedMemoryCount} 条过期记忆——建议在捣乱事件后优先重新验证。`)
  }

  if (stats.wrongPlaceCount > 0) {
    parts.push(`记录到 ${stats.wrongPlaceCount} 次错误放置。放置前请确认容器类型。`)
  }

  if (stats.chaosPeak >= 80) {
    parts.push(`混乱值峰值 ${Math.round(stats.chaosPeak)}%，系统曾接近过载。本机建议：少养猫。`)
  } else if (stats.chaosPeak >= 60) {
    parts.push(`混乱值峰值 ${Math.round(stats.chaosPeak)}%，处于中等水平。`)
  } else {
    parts.push(`混乱值峰值仅 ${Math.round(stats.chaosPeak)}%，系统运行稳定。`)
  }

  if (stats.maxCombo >= 5) {
    parts.push(`最高 Combo ${stats.maxCombo} 次，操作流畅度：令人印象深刻（对于一个记忆只有 3 槽的机器人来说）。`)
  }

  if (stats.levelCompleted) {
    parts.push('记忆模块自检完成。')
  }

  return parts.join(' ')
}

export function ResultPage() {
  const { taskId } = useParams<{ taskId: string }>()
  const navigate = useNavigate()
  const { currentSession } = useSessionStore()
  const { getGameStats } = useGameStore()
  const { audioEnabled, toggleAudioEnabled } = useUiStore()
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
    if (!currentSession && gameStats.taskName === null) {
      navigate('/tasks', { replace: true })
    }
  }, [currentSession, gameStats.taskName, navigate])

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
