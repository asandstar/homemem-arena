// 失败原因组件

import { AlertTriangle } from 'lucide-react'
import type { FailureReason } from '../../types/session'
import { Card } from '../ui/Card'

interface FailureBreakdownProps {
  reasons: FailureReason[]
}

function categoryLabel(category: FailureReason['category']): string {
  switch (category) {
    case 'wrong-container':
      return '错放容器'
    case 'missed-object':
      return '遗漏目标'
    case 'forgot-location':
      return '忘记位置'
    case 'sequence-error':
      return '顺序错误'
    case 'timeout':
      return '超时'
    case 'memory-error':
      return '记忆错误'
    default:
      return category
  }
}

export function FailureBreakdown({ reasons }: FailureBreakdownProps) {
  if (reasons.length === 0) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle size={20} className="text-warning" />
          <h3 className="font-semibold text-text">失败原因分类</h3>
        </div>
        <p className="text-sm text-text-muted">未检测到明显失败原因，表现良好！</p>
      </Card>
    )
  }

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle size={20} className="text-warning" />
        <h3 className="font-semibold text-text">失败原因分类</h3>
      </div>
      <ul className="space-y-3">
        {reasons.map((reason, index) => (
          <li key={index} className="flex items-start gap-3 text-sm">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-danger/10 text-danger text-xs shrink-0 font-semibold">
              {index + 1}
            </span>
            <div className="flex-1">
              <div className="text-xs font-semibold text-danger uppercase tracking-wider">
                {categoryLabel(reason.category)}
              </div>
              <div className="text-text mt-0.5">{reason.description}</div>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  )
}
