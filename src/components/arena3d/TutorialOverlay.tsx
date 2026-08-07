import { useEffect, useState } from 'react'
import { X, Target, Keyboard, Brain, Sparkles, AlertCircle, Gamepad2, Hand } from 'lucide-react'

interface TutorialOverlayProps {
  taskName: string
  taskGoal: string
  onClose: () => void
}

export function TutorialOverlay({ taskName, taskGoal, onClose }: TutorialOverlayProps) {
  const [visible, setVisible] = useState(false)
  const [fadeOut, setFadeOut] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100)
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window)
    }
    checkMobile()
    return () => clearTimeout(timer)
  }, [])

  const handleClose = () => {
    setFadeOut(true)
    setTimeout(onClose, 300)
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        handleClose()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  if (!visible) return null

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
      onClick={handleClose}
    >
      <div
        className={`relative max-w-lg w-[90%] bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-2xl border border-purple-500/40 p-6 transition-all duration-300 ${fadeOut ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-600/50 transition-colors"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={20} className="text-purple-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-purple-400">新手指引</span>
        </div>

        <h2 className="text-xl font-bold text-white mb-4">
          {taskName}
        </h2>

        <div className="bg-slate-800/60 rounded-xl p-3 mb-5 border border-slate-700/50">
          <div className="flex items-start gap-2">
            <Target size={16} className="text-cyan-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-cyan-300/80 mb-0.5">本关目标</div>
              <div className="text-sm text-white leading-snug">{taskGoal}</div>
            </div>
          </div>
        </div>

        {isMobile ? (
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="bg-slate-800/40 rounded-lg p-3 border border-slate-700/30">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Gamepad2 size={14} className="text-amber-400" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-300">移动操作</span>
              </div>
              <div className="text-xs text-slate-300 space-y-0.5">
                <div><span className="font-mono text-amber-300">左下摇杆</span> 移动</div>
                <div><span className="font-mono text-amber-300">右半屏拖动</span> 转视角</div>
                <div><span className="font-mono text-amber-300">⏸ 按钮</span> 暂停 / 重来</div>
              </div>
            </div>

            <div className="bg-slate-800/40 rounded-lg p-3 border border-slate-700/30">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Hand size={14} className="text-purple-400" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-300">核心玩法</span>
              </div>
              <div className="text-xs text-slate-300 space-y-0.5">
                <div><span className="font-mono text-purple-300">点物品</span> 拾取/放置</div>
                <div><span className="font-mono text-purple-300">点容器</span> 开/关</div>
                <div className="text-[10px] text-slate-400 italic pt-0.5">💡 记忆保存需键盘 E 键，建议桌面端体验</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="bg-slate-800/40 rounded-lg p-3 border border-slate-700/30">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Keyboard size={14} className="text-amber-400" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-300">移动操作</span>
              </div>
              <div className="text-xs text-slate-300 space-y-0.5">
                <div><span className="font-mono text-amber-300">WASD</span> 移动</div>
                <div><span className="font-mono text-amber-300">鼠标</span> 旋转视角</div>
                <div><span className="font-mono text-amber-300">ESC×2</span> 暂停 / 重来</div>
              </div>
            </div>

            <div className="bg-slate-800/40 rounded-lg p-3 border border-slate-700/30">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Brain size={14} className="text-purple-400" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-300">核心玩法</span>
              </div>
              <div className="text-xs text-slate-300 space-y-0.5">
                <div><span className="font-mono text-purple-300">F</span> 拾取/放置物品</div>
                <div><span className="font-mono text-purple-300">E</span> 保存位置记忆</div>
                <div><span className="font-mono text-purple-300">V</span> 切换视角</div>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-start gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-5">
          <AlertCircle size={16} className="text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-yellow-200/90 leading-relaxed space-y-1">
            <div>
              <span className="font-semibold text-yellow-300">记忆是通关核心！</span>
              钥匙猫会偷走并移动物品，没有记忆你将无法找回它们。
            </div>
            <div className="text-yellow-200/70">
              按 <span className="font-mono text-yellow-300">E</span> 保存物品位置 → 物品被移动后记忆变红"过期" → 再次按 <span className="font-mono text-yellow-300">E</span> 更新。养成记忆习惯才能在限时内通关。
            </div>
          </div>
        </div>

        <button
          onClick={handleClose}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold text-sm hover:from-purple-500 hover:to-pink-500 hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-200 active:scale-[0.98]"
        >
          开始挑战
          <span className="ml-2 text-xs opacity-70">({isMobile ? '点击关闭' : '按任意键关闭'})</span>
        </button>
      </div>
    </div>
  )
}
