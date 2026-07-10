import { CheckCircle, XCircle, Clock, Footprints, Search, Target, Brain, MapPin, Box, Clock4, ListChecks } from 'lucide-react'
import type { SessionMetrics } from '../../types/session'
import { formatDuration } from '../../utils/format'
import { Card } from '../ui/Card'

interface MetricCardsProps {
  metrics: SessionMetrics
  status: string
}

export function MetricCards({ metrics, status }: MetricCardsProps) {
  const statusConfig = {
    completed: {
      icon: <CheckCircle size={48} className="text-success" />,
      text: '任务完成',
      color: 'text-success',
    },
    failed: {
      icon: <XCircle size={48} className="text-danger" />,
      text: '任务未完成',
      color: 'text-danger',
    },
    'in-progress': {
      icon: <Clock size={48} className="text-warning" />,
      text: '进行中',
      color: 'text-warning',
    },
    aborted: {
      icon: <XCircle size={48} className="text-text-muted" />,
      text: '已中止',
      color: 'text-text-muted',
    },
  }

  const currentStatus = statusConfig[status as keyof typeof statusConfig] ?? statusConfig['in-progress']

  const baseMetrics = [
    {
      icon: <Clock size={24} className="text-secondary" />,
      label: '总耗时',
      value: formatDuration(metrics.durationMs),
    },
    {
      icon: <Footprints size={24} className="text-accent" />,
      label: '总步数',
      value: metrics.stepCount.toString(),
    },
    {
      icon: <Search size={24} className="text-warning" />,
      label: '重复搜索',
      value: `${metrics.repeatedSearchCount} 次`,
    },
    {
      icon: <Target size={24} className="text-success" />,
      label: '目标完成',
      value: `${metrics.goalsAchieved}/${metrics.goalsTotal}`,
    },
    {
      icon: <CheckCircle size={24} className="text-primary" />,
      label: '记忆测试',
      value: `${(metrics.probeAccuracy * 100).toFixed(0)}%`,
    },
    {
      icon: <Brain size={24} className="text-procedural" />,
      label: '记忆库',
      value: `${metrics.totalMemories} 条`,
    },
  ]

  const memoryMetrics = [
    {
      icon: <MapPin size={20} className="text-spatial" />,
      label: '空间记忆',
      value: `${(metrics.spatialAccuracy * 100).toFixed(0)}%`,
      color: 'text-spatial',
    },
    {
      icon: <Box size={20} className="text-object" />,
      label: '物体状态',
      value: `${(metrics.objectStateAccuracy * 100).toFixed(0)}%`,
      color: 'text-object',
    },
    {
      icon: <Clock4 size={20} className="text-temporal" />,
      label: '时序记忆',
      value: `${(metrics.temporalAccuracy * 100).toFixed(0)}%`,
      color: 'text-temporal',
    },
    {
      icon: <ListChecks size={20} className="text-procedural" />,
      label: '流程记忆',
      value: `${(metrics.proceduralAccuracy * 100).toFixed(0)}%`,
      color: 'text-procedural',
    },
  ]

  const detailedMetrics = [
    { label: '总操作数', value: metrics.totalActions || 0 },
    { label: '不必要重访', value: metrics.unnecessaryRevisits || 0 },
    { label: '错误放置', value: metrics.wrongPlacements || 0 },
    { label: '容器错误', value: metrics.containerMistakes || 0 },
    { label: '遗漏清理', value: metrics.missedCleanupSteps || 0 },
    { label: '心流辅助', value: `${metrics.flowInterventionCount || 0} 次` },
    { label: '最长目标间隔', value: formatDuration(metrics.longestGoalGapMs || 0) },
    { label: '操作成功率', value: `${Math.round((metrics.actionSuccessRate || 0) * 100)}%` },
  ]

  return (
    <>
      <Card className="p-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-scale-in">{currentStatus.icon}</div>
          <h2 className={`text-2xl font-bold ${currentStatus.color}`}>{currentStatus.text}</h2>
        </div>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {baseMetrics.map((item) => (
          <Card key={item.label} className="p-4 flex flex-col gap-2 hover:shadow-[var(--shadow-card-hover)]">
            {item.icon}
            <div className="text-xs text-text-muted">{item.label}</div>
            <div className="text-lg font-bold text-text">{item.value}</div>
          </Card>
        ))}
      </div>

      <Card className="p-4">
        <h3 className="font-semibold text-text mb-4">记忆类型准确率</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {memoryMetrics.map((item) => (
            <div key={item.label} className="flex flex-col items-center gap-2">
              {item.icon}
              <div className="text-xs text-text-muted">{item.label}</div>
              <div className={`text-xl font-bold ${item.color}`}>{item.value}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="font-semibold text-text mb-4">详细指标</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {detailedMetrics.map((item) => (
            <div key={item.label} className="text-center">
              <div className="text-xs text-text-muted">{item.label}</div>
              <div className="text-lg font-bold text-text">{item.value}</div>
            </div>
          ))}
        </div>
      </Card>
    </>
  )
}
