import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Sun, Coffee, CloudMoon, Moon, Volume2, VolumeX, Sparkles, Play } from 'lucide-react'
import { taskTemplates } from '../data/tasks'
import { TaskCard } from '../components/tasks/TaskCard'
import { useUiStore } from '../store/useUiStore'
import { getSaveList, loadGame } from '../save/saveSystem'
import { useGameStore } from '../store/useGameStore'

const timeSlots = [
  { icon: Sun, label: '清晨 07:30', color: 'text-yellow-400', emoji: '🌅' },
  { icon: Coffee, label: '上午 08:00', color: 'text-orange-400', emoji: '☕' },
  { icon: CloudMoon, label: '下午 15:00', color: 'text-purple-400', emoji: '🌆' },
  { icon: Moon, label: '深夜 23:00', color: 'text-blue-400', emoji: '🌙' },
  { icon: Moon, label: '凌晨 02:00', color: 'text-indigo-400', emoji: '🌌' },
]

export function TaskSelectPage() {
  const navigate = useNavigate()
  const { audioEnabled, toggleAudioEnabled } = useUiStore()
  const { loadFromSave, initializeTask, initializeProgress, getLevelProgress, isLevelUnlocked, levelProgress } = useGameStore()

  const saveList = getSaveList()

  useEffect(() => {
    initializeProgress(taskTemplates.map(t => t.id))
  }, [initializeProgress])

  const handleStart = (taskId: string) => {
    navigate(`/play/${taskId}`)
  }

  const handleContinue = (saveId: string) => {
    const saveData = loadGame(saveId)
    if (saveData) {
      initializeTask(saveData.taskId)
      loadFromSave(saveData)
      navigate(`/play/${saveData.taskId}`)
    }
  }

  const getLatestSaveForTask = (taskId: string) => {
    return saveList.find(s => s.taskId === taskId)
  }

  const getNextUnlockedTaskIndex = () => {
    for (let i = 0; i < taskTemplates.length; i++) {
      const progress = levelProgress[taskTemplates[i].id]
      if (!progress?.completed) {
        return i
      }
    }
    return taskTemplates.length - 1
  }

  const completedCount = taskTemplates.filter(t => levelProgress[t.id]?.completed).length
  const nextIndex = getNextUnlockedTaskIndex()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/50 to-slate-900 flex flex-col relative overflow-hidden">
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
            <span className="text-4xl">{timeSlots[0].emoji}</span>
            <span className="text-4xl animate-pulse">{timeSlots[1].emoji}</span>
            <span className="text-4xl">{timeSlots[2].emoji}</span>
            <span className="text-4xl animate-pulse">{timeSlots[3].emoji}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-violet-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
              小橡的一天
            </span>
          </h1>
          <p className="text-slate-400 text-lg mb-4">从清晨到深夜，四段记忆挑战在等你~</p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-purple-500/20 border border-purple-500/30 rounded-full text-xs text-violet-300">
              <Sparkles size={12} />
              按时间顺序玩，故事更连贯
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-slate-800/60 border border-slate-700/50 rounded-full text-xs text-slate-400">
              <span className="text-green-400">{completedCount}</span> / {taskTemplates.length} 已完成
            </div>
          </div>
        </div>

        <div className="relative max-w-4xl w-full">
          <div className="absolute left-8 md:left-1/2 top-8 bottom-8 w-1 bg-gradient-to-b from-yellow-500/30 via-orange-500/30 via-purple-500/30 via-blue-500/30 to-indigo-500/30" />

          <div className="space-y-6">
            {taskTemplates.map((task, index) => {
              const progress = getLevelProgress(task.id)
              const unlocked = isLevelUnlocked(task.id, taskTemplates.map(t => t.id))
              const isNext = index === nextIndex && unlocked && !progress.completed
              const isCompleted = progress.completed

              return (
                <div key={task.id} className="relative">
                  <div className="absolute left-6 md:left-1/2 top-8 -translate-x-1/2 z-20">
                    <div className={`
                      w-6 h-6 rounded-full flex items-center justify-center
                      ${isCompleted
                        ? 'bg-gradient-to-br from-green-400 to-emerald-500 shadow-lg shadow-green-500/30'
                        : unlocked
                          ? 'bg-gradient-to-br from-purple-400 to-pink-500 shadow-lg shadow-purple-500/30 animate-pulse'
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
                      w-full md:w-[calc(50%-2rem)] ${index % 2 === 0 ? 'md:pr-8' : 'md:pl-8'}
                    `}>
                      <TaskCard
                        task={task}
                        levelNumber={index + 1}
                        onStart={handleStart}
                        timeLabel={timeSlots[index].label}
                        timeIcon={timeSlots[index].emoji}
                        saveInfo={getLatestSaveForTask(task.id)}
                        onContinue={handleContinue}
                        progress={progress}
                        unlocked={unlocked}
                        isNextToUnlock={isNext}
                      />
                    </div>
                  </div>

                  {index < taskTemplates.length - 1 && (
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
