import { useNavigate } from 'react-router-dom'
import { ArrowRight, Brain, AlertTriangle, Trophy, Volume2, VolumeX, MapPin, Box, History, Play } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { useUiStore } from '../store/useUiStore'
import { taskTemplates, taskPresentationById } from '../data/tasks'

export function HomePage() {
  const navigate = useNavigate()
  const { audioEnabled, toggleAudioEnabled } = useUiStore()

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

      <div className="relative z-1 flex-1 flex flex-col items-center justify-center px-4 py-16">
        {/* 头部 */}
        <div className="text-center mb-12">
          <div className="text-6xl mb-4" style={{ animation: 'pulse 3s ease-in-out infinite' }}>🏠</div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            <span className="bg-gradient-to-r from-violet-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
              记忆宅邸：失忆管家
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-300 mb-6">
            一款让你在玩游戏时顺便练记忆的 3D 网页小游戏
          </p>
          <div className="inline-flex items-center gap-2 px-5 py-2 bg-purple-500/20 border border-purple-500/30 rounded-full text-sm text-violet-300">
            <span>🎮</span>
            <span>生活娱乐赛道 · 记忆训练 · 休闲闯关</span>
          </div>
        </div>

        {/* 创意介绍 */}
        <div className="bg-slate-800/60 backdrop-blur-md rounded-2xl p-8 max-w-3xl w-full mb-8 border border-slate-700/50 shadow-xl">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-100 mb-3">🤖 失忆的家务机器人</h3>
            <p className="text-slate-300 leading-relaxed text-sm mb-4">
              你是一台记忆模块出了故障的家务机器人 <span className="text-cyan-400 font-bold">MEM-07</span>，
              只能同时记住 <span className="text-purple-400 font-bold">3 件物品</span> 的位置。
              在一栋"会捣乱"的房子里，你需要限时完成各种家务任务：找钥匙、收拾餐桌、分类衣物、准备早餐...
              而房子里的猫咪、室友、幽灵甚至时间循环，都会不断干扰你的记忆。
            </p>
          </div>

          {/* 游戏特色 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/30 text-center hover:border-purple-500/30 hover:-translate-y-1 transition-all duration-300">
              <Brain className="text-purple-400 w-8 h-8 mx-auto mb-2" />
              <div className="text-sm font-medium text-slate-200 mb-1">有限记忆槽</div>
              <div className="text-xs text-slate-400">策略性选择保存什么</div>
            </div>
            <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/30 text-center hover:border-pink-500/30 hover:-translate-y-1 transition-all duration-300">
              <AlertTriangle className="text-pink-400 w-8 h-8 mx-auto mb-2" />
              <div className="text-sm font-medium text-slate-200 mb-1">捣乱事件</div>
              <div className="text-xs text-slate-400">猫咪、幽灵、时间循环</div>
            </div>
            <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/30 text-center hover:border-cyan-500/30 hover:-translate-y-1 transition-all duration-300">
              <div className="text-cyan-400 text-2xl mb-2">📈</div>
              <div className="text-sm font-medium text-slate-200 mb-1">混乱值系统</div>
              <div className="text-xs text-slate-400">环境越乱越考验应变</div>
            </div>
            <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/30 text-center hover:border-yellow-500/30 hover:-translate-y-1 transition-all duration-300">
              <Trophy className="text-yellow-400 w-8 h-8 mx-auto mb-2" />
              <div className="text-sm font-medium text-slate-200 mb-1">星级评分</div>
              <div className="text-xs text-slate-400">多维度评价表现</div>
            </div>
          </div>

          {/* 核心数据 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent mb-1">3</div>
              <div className="text-xs text-slate-400">记忆槽上限</div>
            </div>
            <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent mb-1">{taskTemplates.length}</div>
              <div className="text-xs text-slate-400">关卡设计</div>
            </div>
            <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent mb-1">5+</div>
              <div className="text-xs text-slate-400">记忆类型</div>
            </div>
            <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent mb-1">3D</div>
              <div className="text-xs text-slate-400">沉浸式场景</div>
            </div>
          </div>

          {/* 关卡一览 */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            {taskTemplates.map((task) => {
              const presentation = taskPresentationById[task.id]
              return (
                <div key={task.id} className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/30 hover:border-pink-500/30 hover:-translate-y-1 transition-all duration-300">
                  <div className="text-2xl mb-1">{presentation?.emoji || '📦'}</div>
                  <div className="text-sm font-medium text-slate-200 mb-1">{task.name}</div>
                  <div className="text-xs text-slate-400 leading-relaxed">{presentation?.shortDescription || task.description}</div>
                </div>
              )
            })}
          </div>

          {/* 记忆类型 */}
          <div className="bg-slate-900/50 rounded-xl p-4 mb-6 border border-slate-700/30">
            <div className="text-xs text-slate-400 mb-3 font-mono">MEMORY TYPE TAXONOMY</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-green-400" />
                <span className="text-xs text-slate-300">空间记忆</span>
              </div>
              <div className="flex items-center gap-2">
                <Box size={14} className="text-purple-400" />
                <span className="text-xs text-slate-300">物体记忆</span>
              </div>
              <div className="flex items-center gap-2">
                <History size={14} className="text-blue-400" />
                <span className="text-xs text-slate-300">时间记忆</span>
              </div>
              <div className="flex items-center gap-2">
                <Play size={14} className="text-orange-400" />
                <span className="text-xs text-slate-300">程序记忆</span>
              </div>
            </div>
          </div>

          <Button
            size="lg"
            data-testid="home-primary-cta"
            className="w-full bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white font-bold text-lg py-6 rounded-xl shadow-lg shadow-purple-500/25 transition-all transform hover:scale-105"
            onClick={() => navigate('/tasks')}
          >
            开始闯关
            <ArrowRight size={24} className="ml-2" />
          </Button>
          <button
            onClick={toggleAudioEnabled}
            className="w-full mt-4 flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            {audioEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            {audioEnabled ? '音效开启' : '音效关闭'}
          </button>
        </div>

        {/* 底部 */}
        <div className="text-center">
          <p className="text-xs text-slate-500">
            🏠 记忆宅邸：失忆管家 · Memory Butler
          </p>
          <p className="text-xs text-slate-600 mt-1">
            React + Three.js + TypeScript · 网页即开即玩
          </p>
        </div>
      </div>
    </div>
  )
}
