// 研究数据页面 - 3D 版本

import { useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSessionStore } from '../store/useSessionStore'
import { JsonPreview } from '../components/data/JsonPreview'
import { DownloadButton } from '../components/data/DownloadButton'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'

export function SessionDataPage() {
  useParams<{ taskId: string }>() // 路由参数当前不需要直接使用
  const navigate = useNavigate()
  const { currentSession } = useSessionStore()

  useEffect(() => {
    if (!currentSession) {
      navigate('/tasks')
    }
  }, [currentSession, navigate])

  const json = useMemo(() => {
    if (!currentSession) return ''
    return JSON.stringify(currentSession, null, 2)
  }, [currentSession])

  if (!currentSession) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-text-muted">加载数据中...</p>
      </div>
    )
  }

  return (
    <div className="flex-1 p-4 md:p-6 max-w-5xl mx-auto w-full space-y-6 overflow-y-auto">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-text">研究数据</h1>
        <p className="text-text-muted mt-1">任务：{currentSession.taskName}</p>
      </div>

      <Card className="p-4 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="font-semibold text-text">Session JSON</h2>
          <DownloadButton
            filename={`homemem-session-${currentSession.id}.json`}
            json={json}
          />
        </div>
        <JsonPreview json={json} />
      </Card>

      <Card className="p-4 space-y-3">
        <h2 className="font-semibold text-text">AI 研究摘要</h2>
        <div className="prose prose-sm max-w-none text-text whitespace-pre-wrap">
          {currentSession.aiSummary || '暂无摘要'}
        </div>
      </Card>

      <div className="flex justify-center">
        <Button variant="ghost" onClick={() => navigate('/tasks')}>
          返回任务列表
        </Button>
      </div>
    </div>
  )
}
