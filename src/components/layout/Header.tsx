import { Link, useLocation } from 'react-router-dom'
import { Home, ListTodo, Brain } from 'lucide-react'

export function Header() {
  const location = useLocation()
  const isGamePage = location.pathname.startsWith('/play')
    || location.pathname.startsWith('/probe')
    || location.pathname.startsWith('/result')

  if (isGamePage) return null

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
