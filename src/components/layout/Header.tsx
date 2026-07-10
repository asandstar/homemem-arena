import { Link } from 'react-router-dom'
import { Home, ListTodo, Brain } from 'lucide-react'

export function Header() {
  return (
    <header className="bg-white border-b border-border sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-primary font-bold text-lg">
          <Brain size={22} />
          HomeMem Arena
        </Link>
        <nav className="flex items-center gap-4">
          <Link
            to="/"
            className="flex items-center gap-1 text-sm text-muted hover:text-foreground transition-colors"
          >
            <Home size={16} />
            首页
          </Link>
          <Link
            to="/tasks"
            className="flex items-center gap-1 text-sm text-muted hover:text-foreground transition-colors"
          >
            <ListTodo size={16} />
            任务
          </Link>
        </nav>
      </div>
    </header>
  )
}
