import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Sun, Coffee, CloudMoon, Moon, Volume2, VolumeX } from 'lucide-react'
import { taskTemplates } from '../data/tasks'
import { TaskCard } from '../components/tasks/TaskCard'
import { useUiStore } from '../store/useUiStore'

const timeSlots = [
  { icon: Sun, label: '清晨 07:30', color: 'text-yellow-400' },
  { icon: Coffee, label: '早上 08:00', color: 'text-orange-400' },
  { icon: CloudMoon, label: '下午 15:00', color: 'text-purple-400' },
  { icon: Moon, label: '深夜 23:00', color: 'text-blue-400' },
]

export function TaskSelectPage() {
  const navigate = useNavigate()
  const { audioEnabled, toggleAudioEnabled } = useUiStore()

  const handleStart = (taskId: string) => {
    navigate(`/play/${taskId}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col">
      <div className="p-4 md:p-6">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
          返回
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-16">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              小橡的一天
            </span>
          </h1>
          <p className="text-slate-400 text-lg">从清晨到深夜，记忆宅邸的四只小妖在等你~</p>
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
              <TaskCard task={task} levelNumber={index + 1} onStart={handleStart} timeLabel={timeSlots[index].label} />
            </div>
          ))}
        </div>
      </div>

      <div className="py-6 text-center text-slate-500 text-sm">
        <div>💡 提示：按时间顺序玩，故事会更连贯哦~</div>
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
