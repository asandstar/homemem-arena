import { Link, useLocation } from 'react-router-dom'
import { Home, ListTodo, Brain } from 'lucide-react'

export function Header() {
  const location = useLocation()
  const isGamePage = location.pathname.startsWith('/play')
    || location.pathname.startsWith('/probe')
    || location.pathname.startsWith('/result')

  // 游戏页：改为更紧凑的半透明顶栏，但仍保留「首页 / 任务」导航，方便随时退出。
  // 之前在 /play/* 直接 return null，导致玩家被困在游戏里无法回到任务列表。
  if (isGamePage) {
    return (
      <header className="bg-slate-900/70 backdrop-blur-md border-b border-slate-800/60 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-10 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-purple-400 font-bold text-sm hover:text-purple-300 transition-colors">
            <Brain size={18} />
            HomeMem Arena
          </Link>
          <nav className="flex items-center gap-3">
            <Link
              to="/"
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
            >
              <Home size={14} />
              首页
            </Link>
            <Link
              to="/tasks"
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
            >
              <ListTodo size={14} />
              任务
            </Link>
          </nav>
        </div>
      </header>
    )
  }

  return (
    <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-purple-400 font-bold text-lg hover:text-purple-300 transition-colors">
          <Brain size={22} />
          HomeMem Arena
        </Link>
        <nav className="flex items-center gap-4">
          <Link
            to="/"
            className="flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <Home size={16} />
            首页
          </Link>
          <Link
            to="/tasks"
            className="flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <ListTodo size={16} />
            任务
          </Link>
        </nav>
      </div>
    </header>
  )
}
