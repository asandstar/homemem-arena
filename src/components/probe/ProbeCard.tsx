// 单题记忆测试卡

import { useState } from 'react'
import { Check, X } from 'lucide-react'
import type { ProbeQuestionSpec } from '../../types/task'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'

interface ProbeCardProps {
  probe: ProbeQuestionSpec
  index: number
  total: number
  onAnswer: (answer: string, responseTime: number) => void
  showFeedback?: boolean
}

export function ProbeCard({ probe, index, total, onAnswer, showFeedback }: ProbeCardProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [startTime] = useState(Date.now())

  const handleSubmit = () => {
    if (!selected) return
    setSubmitted(true)
    const responseTime = Date.now() - startTime
    onAnswer(selected, responseTime)
  }

  const isCorrect = selected === probe.correctAnswer

  const typeLabel = {
    location: '空间记忆',
    state: '物体状态',
    sequence: '时序记忆',
    count: '计数',
    'object-id': '物体识别',
    recognition: '再认',
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <Badge variant={probe.dependsOnMemoryType as any}>
          {typeLabel[probe.type] || probe.dependsOnMemoryType}
        </Badge>
        <span className="text-sm text-text-muted">
          第 {index + 1} / {total} 题
        </span>
      </div>

      <h3 className="text-lg font-semibold text-text mb-4">{probe.question}</h3>

      {probe.options && (
        <div className="space-y-2 mb-6">
          {probe.options.map((option) => {
            const isThisCorrect = option === probe.correctAnswer
            const isThisSelected = option === selected
            return (
              <button
                key={option}
                type="button"
                onClick={() => !submitted && setSelected(option)}
                disabled={submitted}
                className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                  submitted
                    ? isThisCorrect
                      ? 'border-success bg-success/10'
                      : isThisSelected
                        ? 'border-danger bg-danger/10'
                        : 'border-border bg-surface'
                    : isThisSelected
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary'
                }`}
              >
                <div className="flex items-center gap-2">
                  {submitted && isThisCorrect && <Check size={16} className="text-success" />}
                  {submitted && isThisSelected && !isThisCorrect && <X size={16} className="text-danger" />}
                  <span className="text-sm">{option}</span>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {showFeedback && submitted && (
        <div
          className={`p-3 rounded-lg mb-4 ${
            isCorrect ? 'bg-success/10 text-success-foreground' : 'bg-danger/10 text-danger-foreground'
          }`}
        >
          {isCorrect ? '✓ 答对了' : '✗ 答错了'}
          {!isCorrect && (
            <div className="text-sm mt-1">正确答案：{probe.correctAnswer}</div>
          )}
          {probe.hint && !isCorrect && (
            <div className="text-xs mt-1 opacity-80">提示：{probe.hint}</div>
          )}
        </div>
      )}

      <Button onClick={handleSubmit} disabled={!selected || submitted} className="w-full">
        {submitted ? '已提交' : '提交答案'}
      </Button>
    </Card>
  )
}
