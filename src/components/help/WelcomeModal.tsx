import { useState, useEffect } from 'react'
import { Sparkles, HelpCircle, Play } from 'lucide-react'
import { HelpPanel } from './HelpPanel'

interface WelcomeModalProps {
  onStart: () => void
}

export function WelcomeModal({ onStart }: WelcomeModalProps) {
  const [showHelp, setShowHelp] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  const handleStart = () => {
    setIsVisible(false)
    setTimeout(() => {
      onStart()
    }, 200)
  }

  if (showHelp) {
    return <HelpPanel isOpen={true} onClose={() => setShowHelp(false)} defaultTab="controls" />
  }

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md">
      <div
        className={`max-w-md mx-4 w-full transition-all duration-300 ${
          isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'
        }`}
      >
        <div className="bg-gradient-to-br from-purple-900/90 to-slate-900/90 backdrop-blur-md rounded-2xl p-6 shadow-2xl border border-purple-500/30">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-500/20 rounded-full mb-4">
              <Sparkles size={32} className="text-purple-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">欢迎来到 HomeMem</h2>
            <p className="text-slate-400 text-sm">一个关于记忆与整理的小游戏</p>
          </div>

          <div className="space-y-3 mb-6">
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30">
              <p className="text-sm text-slate-200 leading-relaxed">
                🏠 你是一个家用机器人，需要帮主人整理家里的东西。
              </p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30">
              <p className="text-sm text-slate-200 leading-relaxed">
                🧠 但家里总是有奇怪的事情发生...物品会自己移动！
                用好你的记忆系统，记住东西都放在哪了。
              </p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30">
              <p className="text-sm text-slate-200 leading-relaxed">
                🎯 把物品放回正确的位置，完成所有任务目标！
              </p>
            </div>
          </div>

          <div className="bg-purple-500/10 rounded-lg p-3 mb-6 border border-purple-500/20">
            <p className="text-xs text-purple-300 text-center">
              💡 游戏中随时按 <kbd className="px-1.5 py-0.5 bg-purple-900/50 rounded text-purple-200 text-[10px] font-mono">H</kbd> 查看帮助
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowHelp(true)}
              className="flex-1 px-4 py-3 rounded-xl font-medium text-slate-300 bg-slate-800/70 hover:bg-slate-700/70 border border-slate-600/50 transition-all flex items-center justify-center gap-2"
            >
              <HelpCircle size={18} />
              先看帮助
            </button>
            <button
              onClick={handleStart}
              className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-lg shadow-purple-500/30 transition-all flex items-center justify-center gap-2"
            >
              <Play size={18} />
              开始游戏
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
