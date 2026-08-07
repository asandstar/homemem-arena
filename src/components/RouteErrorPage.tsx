import { useNavigate } from 'react-router-dom'

export function RouteErrorPage() {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-8">
      <h1 className="text-2xl font-bold text-text-primary">页面遇到问题</h1>
      <p className="text-text-muted">抱歉，页面加载时出现了错误。</p>
      <div className="flex gap-3">
        <button
          className="px-4 py-2 rounded-lg bg-accent text-white hover:opacity-80"
          onClick={() => window.location.reload()}
        >
          重新加载
        </button>
        <button
          className="px-4 py-2 rounded-lg border border-border hover:bg-surface"
          onClick={() => navigate('/tasks')}
        >
          返回任务列表
        </button>
      </div>
    </div>
  )
}
