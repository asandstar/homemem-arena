// AI 策略建议组件

import { Lightbulb } from 'lucide-react'
import type { PolicySuggestion } from '../../types/session'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'

interface PolicySuggestionsProps {
  suggestions: PolicySuggestion[]
}

export function PolicySuggestions({ suggestions }: PolicySuggestionsProps) {
  if (suggestions.length === 0) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb size={20} className="text-warning" />
          <h3 className="font-semibold text-text">AI 策略建议</h3>
        </div>
        <p className="text-sm text-text-muted">暂无策略建议。</p>
      </Card>
    )
  }

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb size={20} className="text-warning" />
        <h3 className="font-semibold text-text">AI 策略建议</h3>
      </div>
      <ul className="space-y-3">
        {suggestions.map((suggestion, index) => (
          <li
            key={index}
            className="border border-border rounded-lg p-3 bg-surface/50"
          >
            <div className="flex items-start gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold shrink-0">
                {index + 1}
              </span>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-text text-sm">{suggestion.title}</span>
                  <Badge variant={(suggestion.memoryType as any) ?? 'default'} className="text-[10px]">
                    {suggestion.memoryType}
                  </Badge>
                </div>
                <p className="text-xs text-text-muted">{suggestion.description}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  )
}
