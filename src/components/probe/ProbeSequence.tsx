import { useState } from 'react'
import type { ProbeQuestionSpec } from '../../types/task'
import type { ProbeAnswer } from '../../types/session'
import { ProbeCard } from './ProbeCard'

interface ProbeSequenceProps {
  probes: ProbeQuestionSpec[]
  onComplete: (answers: ProbeAnswer[]) => void
  onQuestionStart?: () => void
}

export function ProbeSequence({ probes, onComplete, onQuestionStart }: ProbeSequenceProps) {
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState<ProbeAnswer[]>([])

  const handleAnswer = (answer: string, responseTime: number) => {
    const probe = probes[currentIdx]
    const isCorrect = answer === probe.correctAnswer
    
    const newAnswer: ProbeAnswer = {
      question: probe.question,
      correctAnswer: probe.correctAnswer,
      userAnswer: answer,
      memoryType: probe.dependsOnMemoryType,
      relatedObjectIds: probe.relatedObjectIds,
      relatedEventIds: probe.relatedEventIds,
      responseTime,
      isCorrect,
    }
    
    const newAnswers = [...answers, newAnswer]
    setAnswers(newAnswers)

    setTimeout(() => {
      if (currentIdx < probes.length - 1) {
        setCurrentIdx(currentIdx + 1)
        onQuestionStart?.()
      } else {
        onComplete(newAnswers)
      }
    }, 1500)
  }

  if (currentIdx >= probes.length) {
    return null
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-surface rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${((currentIdx + 1) / probes.length) * 100}%` }}
          />
        </div>
        <span className="text-sm text-text-muted whitespace-nowrap">
          {currentIdx + 1} / {probes.length}
        </span>
      </div>

      <ProbeCard
        probe={probes[currentIdx]}
        index={currentIdx}
        total={probes.length}
        onAnswer={handleAnswer}
        showFeedback
      />
    </div>
  )
}
