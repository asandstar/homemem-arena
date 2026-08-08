import { useEffect } from 'react'
import { Play, RotateCcw, Home, Pause } from 'lucide-react'
import { useGameStore } from '../../store/useGameStore'
import { useNavigate } from 'react-router-dom'
import {
  resumeAudioContexts,
  suspendAllAudioContextsImmediate,
} from '../../audio/audioManager'
import { autosaveGame } from '../../save/saveSystem'

/**
 * 暂停菜单：ESC 在 briefing / playing 阶段触发。
 * - 打开时：立刻 suspend 3 个 AudioContext；触发一次自动存档
 * - 关闭时：resume AudioContext；若此前鼠标被锁定，由 FirstPersonControls 按需重新锁定
 *
 * 暂停菜单本身不控制游戏状态冻结：tickElapsed / useFrame 等已在 isPaused=true 时 return，
 * 这里只负责 UI、音频和存档触发。
 */
export function PauseMenu() {
  const isPaused = useGameStore((s) => s.isPaused)
  const phase = useGameStore((s) => s.phase)
  const taskId = useGameStore((s) => s.task?.id ?? null)
  const setPaused = useGameStore((s) => s.setPaused)
  const resetTask = useGameStore((s) => s.resetTask)
  const navigate = useNavigate()

  // 暂停/恢复 → 音频上下文切换 + 进入时自动存档
  useEffect(() => {
    if (!isPaused) {
      resumeAudioContexts().catch(() => {})
      return
    }
    // 比赛版：暂停菜单打开时强制退出 Pointer Lock，确保玩家能自由点击暂停菜单按钮
    // （不依赖 ESC 路径——如果未来有点击按钮进入暂停的路径也能正确释放鼠标）
    try {
      if (document.pointerLockElement) {
        document.exitPointerLock?.()
      }
    } catch {
      // 忽略：某些 iframe 上下文下 exitPointerLock 可能报错
    }
    suspendAllAudioContextsImmediate()
    if (taskId && phase === 'playing') {
      try {
        autosaveGame(taskId)
      } catch (e) {
        console.warn('[PauseMenu] autosave failed:', e)
      }
    }
  }, [isPaused, phase, taskId])

  // 非游戏阶段（result/probe/idle）一律不显示
  const visible = isPaused && (phase === 'playing' || phase === 'briefing')
  if (!visible) return null

  const onResume = () => {
    setPaused(false)
  }

  const onRestart = () => {
    setPaused(false)
    resetTask()
  }

  const onBackToTasks = () => {
    setPaused(false)
    navigate('/tasks')
  }

  return (
    <div
      data-pause-menu
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm pointer-events-auto"
      role="dialog"
      aria-modal="true"
      aria-label="游戏暂停"
    >
      <div className="w-[min(92vw,520px)] rounded-2xl border border-slate-800 bg-slate-900/95 shadow-2xl p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/30 to-violet-500/20 flex items-center justify-center border border-indigo-500/30">
            <Pause size={22} className="text-indigo-300" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-100">游戏暂停</div>
            <div className="text-xs text-slate-400 mt-0.5">
              时间、混乱值、脚本事件均已冻结
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={onResume}
            className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-semibold flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-900/40"
          >
            <Play size={18} />
            继续游戏
          </button>

          <button
            onClick={onRestart}
            className="w-full h-12 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold flex items-center justify-center gap-2 transition border border-slate-700"
          >
            <RotateCcw size={18} />
            重新开始本关
          </button>

          <button
            onClick={onBackToTasks}
            className="w-full h-12 rounded-xl bg-slate-800/60 hover:bg-slate-700/80 text-slate-300 font-semibold flex items-center justify-center gap-2 transition border border-slate-700/70"
          >
            <Home size={18} />
            返回关卡选择
          </button>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] leading-relaxed text-slate-500">
          小提示：暂停时会自动保存一次当前进度，离开页面后可在关卡页点「继续」恢复。
        </div>
      </div>
    </div>
  )
}
