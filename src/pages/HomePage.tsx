import { useNavigate } from 'react-router-dom'
import { ArrowRight, Brain, AlertTriangle, Trophy, Volume2, VolumeX, MapPin, Box, History, Play, Cpu, Activity, Sparkles } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { useUiStore } from '../store/useUiStore'

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
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-cyan-500 blur-3xl opacity-10" />
            <Cpu className="relative text-cyan-400 w-24 h-24 mx-auto animate-pulse" />
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-4">
            <span className="bg-gradient-to-r from-violet-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
              HomeMem Arena
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 mb-6">
            家政记忆训练系统
          </p>
          <div className="inline-flex items-center gap-2 px-5 py-2 bg-purple-500/20 border border-purple-500/30 rounded-full text-sm text-violet-300">
            <Sparkles size={14} />
            记忆增强机器人训练平台 · 休闲闯关
          </div>
        </div>

        {/* 介绍卡片 */}
        <div className="bg-slate-800/60 backdrop-blur-md rounded-2xl p-8 max-w-3xl w-full mb-8 border border-slate-700/50 shadow-xl">
          <div className="text-center mb-6">
            <p className="text-slate-300 leading-relaxed mb-4">
              欢迎来到 <span className="text-cyan-400 font-bold">HomeMem Arena</span>！
              你是实习家政机器人 <span className="text-purple-400 font-bold">「小橡」</span>，
              正在进行记忆增强策略的训练实验。
            </p>
            <p className="text-slate-300 leading-relaxed mb-4">
              宅邸中存在记忆扰动机制——物体位置会随时间变化。
              你的 <span className="text-purple-400 font-bold">记忆容量有限</span>，
              需要合理分配记忆资源来完成任务。
            </p>
            <p className="text-slate-300 leading-relaxed">
              在 <span className="text-red-400 font-bold">混乱值</span> 达到临界点之前，
              完成所有任务目标，测试你的记忆增强策略效能！
            </p>
          </div>

          {/* 游戏特色 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/30 text-center hover:border-purple-500/30 hover:-translate-y-1 transition-all duration-300">
              <Brain className="text-purple-400 w-8 h-8 mx-auto mb-2" />
              <div className="text-sm font-medium text-slate-200 mb-1">有限记忆</div>
              <div className="text-xs text-slate-400">策略性选择保存什么</div>
            </div>
            <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/30 text-center hover:border-pink-500/30 hover:-translate-y-1 transition-all duration-300">
              <AlertTriangle className="text-pink-400 w-8 h-8 mx-auto mb-2" />
              <div className="text-sm font-medium text-slate-200 mb-1">捣乱事件</div>
              <div className="text-xs text-slate-400">猫咪、幽灵、时间循环</div>
            </div>
            <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/30 text-center hover:border-cyan-500/30 hover:-translate-y-1 transition-all duration-300">
              <Activity className="text-cyan-400 w-8 h-8 mx-auto mb-2" />
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
              <div className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent mb-1">4</div>
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
            开始实验
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

        {/* 能力卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-3xl w-full">
          <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/30 hover:border-cyan-500/30 hover:-translate-y-1 transition-all duration-300">
            <div className="text-cyan-400 font-bold mb-2 flex items-center gap-2">
              <MapPin size={14} /> 空间追踪
            </div>
            <div className="text-xs text-slate-400">记住物体位置，追踪移动轨迹</div>
          </div>
          <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/30 hover:border-purple-500/30 hover:-translate-y-1 transition-all duration-300">
            <div className="text-purple-400 font-bold mb-2 flex items-center gap-2">
              <Box size={14} /> 物体识别
            </div>
            <div className="text-xs text-slate-400">识别不同类别物体，匹配目标容器</div>
          </div>
          <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/30 hover:border-blue-500/30 hover:-translate-y-1 transition-all duration-300">
            <div className="text-blue-400 font-bold mb-2 flex items-center gap-2">
              <History size={14} /> 时序记忆
            </div>
            <div className="text-xs text-slate-400">记忆事件顺序，理解因果关系</div>
          </div>
          <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/30 hover:border-orange-500/30 hover:-translate-y-1 transition-all duration-300">
            <div className="text-orange-400 font-bold mb-2 flex items-center gap-2">
              <Play size={14} /> 程序学习
            </div>
            <div className="text-xs text-slate-400">学习操作序列，优化任务流程</div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-slate-500 font-mono">
            Inspired by RoboMME: Benchmarking and Understanding Memory for Robotic Generalist Policies
          </p>
        </div>
      </div>
    </div>
  )
}
