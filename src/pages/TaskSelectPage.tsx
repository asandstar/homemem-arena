import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Sun, Coffee, CloudMoon, Moon, Volume2, VolumeX, Sparkles } from 'lucide-react'
import { taskTemplates } from '../data/tasks'
import { TaskCard } from '../components/tasks/TaskCard'
import { useUiStore } from '../store/useUiStore'
import { getSaveList, loadGame } from '../save/saveSystem'
import { useGameStore } from '../store/useGameStore'

const timeSlots = [
  { icon: Sun, label: '清晨 07:30', color: 'text-yellow-400' },
  { icon: Coffee, label: '早上 08:00', color: 'text-orange-400' },
  { icon: CloudMoon, label: '下午 15:00', color: 'text-purple-400' },
  { icon: Moon, label: '深夜 23:00', color: 'text-blue-400' },
]

export function TaskSelectPage() {
  const navigate = useNavigate()
  const { audioEnabled, toggleAudioEnabled } = useUiStore()
  const { loadFromSave, initializeTask } = useGameStore()

  const saveList = getSaveList()

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col relative overflow-hidden">
      {/* 浮动背景装饰 */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-[10%] left-[10%] w-[300px] h-[300px] rounded-full opacity-30"
          style={{
            background: 'radial-gradient(circle, rgba(168,85,247,0.3) 0%, transparent 70%)',
            animation: 'float 8s ease-in-out infinite',
          }}
        />
        <div
          className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle, rgba(236,72,153,0.2) 0%, transparent 70%)',
            animation: 'float 10s ease-in-out infinite reverse',
          }}
        />
      </div>

      <div className="relative z-1 p-4 md:p-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
          返回
        </button>
      </div>

      <div className="relative z-1 flex-1 flex flex-col items-center justify-center px-4 pb-16">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-violet-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
              小橡的一天
            </span>
          </h1>
          <p className="text-slate-400 text-lg mb-4">从清晨到深夜，四段记忆挑战在等你~</p>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-purple-500/20 border border-purple-500/30 rounded-full text-xs text-violet-300">
            <Sparkles size={12} />
            按时间顺序玩，故事更连贯
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full">
          {taskTemplates.map((task, index) => (
            <div key={task.id} className="relative" data-testid={`task-card-${task.id}`}>
              <div className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 hidden md:block">
                <div className={`${timeSlots[index].color} bg-slate-900/80 rounded-full p-2 border border-slate-700`}>
                  {(() => {
                    const Icon = timeSlots[index].icon
                    return <Icon size={20} />
                  })()}
                </div>
              </div>
              <TaskCard
                  task={task}
                  levelNumber={index + 1}
                  onStart={handleStart}
                  timeLabel={timeSlots[index].label}
                  saveInfo={getLatestSaveForTask(task.id)}
                  onContinue={handleContinue}
                />
            </div>
          ))}
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
