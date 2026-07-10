import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getTaskById } from '../data/tasks'
import type { TaskConfig } from '../types/task'
import type { ProbeAnswer } from '../types/session'
import { useSessionStore } from '../store/useSessionStore'
import { ProbeSequence } from '../components/probe/ProbeSequence'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { CheckCircle } from 'lucide-react'
import { useGameStore } from '../store/useGameStore'
import {
  analyzeFailures,
  calculateMetrics,
  generateRobotDiagnosis,
  generateSuggestions,
} from '../ai/analyzeSession'

export function ProbePage() {
  const { taskId } = useParams<{ taskId: string }>()
  const navigate = useNavigate()
  const { addEvent, recordProbeAnswers, currentSession, setAiSummary, finalizeSession } = useSessionStore()

  const [task, setTask] = useState<TaskConfig | null>(null)
  const [isCompleted, setIsCompleted] = useState(false)

  useEffect(() => {
    if (!taskId) {
      navigate('/tasks')
      return
    }
    const config = getTaskById(taskId)
    if (!config) {
      navigate('/tasks')
      return
    }
    setTask(config)

    if (!currentSession) {
      navigate('/tasks', { replace: true })
      return
    }

    if (currentSession && currentSession.probe_questions.length === 0) {
      useSessionStore.setState({
        currentSession: {
          ...currentSession,
          probe_questions: config.probes.map((p) => ({
        id: p.id,
        question: p.question,
        type: p.type,
        options: p.options,
        correctAnswer: p.correctAnswer,
        memoryType: p.dependsOnMemoryType,
        difficulty: p.difficulty,
        relatedObjectIds: p.relatedObjectIds,
        relatedEventIds: p.relatedEventIds,
          })),
        },
      })
    }
  }, [taskId, navigate, currentSession])

  const handleComplete = (answers: ProbeAnswer[]) => {
    if (!task) return

    recordProbeAnswers(answers)

    answers.forEach((answer, index) => {
      const probe = task.probes[index]
      addEvent({
        type: 'probe_answer',
        questionId: probe.id,
        questionType: probe.type,
        userAnswer: answer.userAnswer,
        correctAnswer: answer.correctAnswer,
        isCorrect: answer.isCorrect,
        reactionTime: answer.responseTime,
        memoryType: answer.memoryType,
        relatedObjectIds: answer.relatedObjectIds,
        relatedEventIds: answer.relatedEventIds,
      }, useGameStore.getState().stepCount)
    })

    const gameStore = useGameStore.getState()
    gameStore.setGamePhase('analyzing')
    const session = useSessionStore.getState().currentSession
    if (session) {
      const goalStatus = new Map<string, boolean>()
      task.goals.forEach((goal) => goalStatus.set(goal.id, gameStore.isGoalAchieved(goal)))
      const goalsAchieved = [...goalStatus.values()].filter(Boolean).length
      const metrics = calculateMetrics(session, task.goals.length, goalsAchieved, gameStore.elapsedMs)
      const failures = analyzeFailures(session, goalStatus)
      const analyzedSession = { ...session, metrics, failureReasons: failures }
      const suggestions = generateSuggestions(analyzedSession, goalStatus, failures)
      const diagnosis = generateRobotDiagnosis(analyzedSession)
      setAiSummary(diagnosis)
      finalizeSession(
        gameStore.levelCompleted ? 'completed' : 'failed',
        metrics,
        failures,
        suggestions,
      )
      gameStore.setGamePhase('result')
    }

    setIsCompleted(true)
  }

  const handleGoToResult = () => {
    if (!taskId) return
    navigate(`/result/${taskId}`)
  }

  const handleDemoComplete = () => {
    if (!task) return

    const answers: ProbeAnswer[] = task.probes.map((probe) => ({
      question: probe.question,
      correctAnswer: probe.correctAnswer,
      userAnswer: probe.correctAnswer,
      memoryType: probe.dependsOnMemoryType,
      relatedObjectIds: probe.relatedObjectIds,
      relatedEventIds: probe.relatedEventIds,
      responseTime: 1000,
      isCorrect: true,
    }))

    handleComplete(answers)
  }

  if (!task) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-text-muted">加载题目中...</p>
      </div>
    )
  }

  return (
    <div className="flex-1 p-4 md:p-6 max-w-4xl mx-auto w-full">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-text">记忆测试</h1>
        <p className="text-text-muted mt-1">任务：{task.name} · 共 {task.probes.length} 题</p>
      </div>

      {isCompleted ? (
        <Card className="p-8 text-center space-y-4">
          <div className="flex justify-center">
            <CheckCircle size={48} className="text-success" />
          </div>
          <h2 className="text-xl font-semibold text-text">测试完成</h2>
          <p className="text-text-muted">所有题目已作答，点击下方按钮查看分析结果。</p>
          <Button onClick={handleGoToResult}>
            查看结果分析
          </Button>
        </Card>
      ) : (
        <>
          <ProbeSequence
            probes={task.probes}
            onComplete={handleComplete}
          />
          <div className="text-center mt-4">
            <button
              type="button"
              onClick={handleDemoComplete}
              className="text-sm text-text-muted underline hover:text-text"
            >
              [演示] 自动填入正确答案
            </button>
          </div>
        </>
      )}
    </div>
  )
}
