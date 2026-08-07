import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getTaskById, isHiddenTaskId } from '../data/tasks'
import type { ProbeAnswer } from '../types/session'
import { useSessionStore } from '../store/useSessionStore'
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
  // ⚠️ 用单字段 selector 避免 getSnapshot 引用变化 → 无限循环
  const addEvent = useSessionStore((s) => s.addEvent)
  const recordProbeAnswers = useSessionStore((s) => s.recordProbeAnswers)
  const setAiSummary = useSessionStore((s) => s.setAiSummary)
  const finalizeSession = useSessionStore((s) => s.finalizeSession)

  useEffect(() => {
    if (!taskId) {
      navigate('/tasks')
      return
    }
    // 加 try/catch 守卫：避免 SyntaxError: Cannot use 'import.meta' outside a module
    let isProd = false
    try { isProd = !!(import.meta as any)?.env?.PROD } catch { /* ignore */ }
    if (isProd && isHiddenTaskId(taskId)) {
      navigate('/tasks', { replace: true })
      return
    }
    const config = getTaskById(taskId)
    if (!config) {
      navigate('/tasks')
      return
    }

    // ⚠️ 用 getState() 取一次快照，不订阅 currentSession 变化。
    // 否则下面 setState 更新 currentSession → effect 重新执行 → 又 setState →
    // React 抛 Maximum update depth exceeded。
    const currentSession = useSessionStore.getState().currentSession
    if (!currentSession) {
      navigate('/tasks', { replace: true })
      return
    }

    const probeQuestions = currentSession.probe_questions ?? []
    if (probeQuestions.length === 0) {
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

    // 公开版本：跳过做题环节。一进入此页面即自动填入正确答案，
    // 完成分析后直接跳到结果分析页。
    if (config && useSessionStore.getState().currentSession) {
      const probes = config.probes ?? []
      const answers: ProbeAnswer[] = probes.map((probe) => ({
        question: probe.question,
        correctAnswer: probe.correctAnswer,
        userAnswer: probe.correctAnswer,
        memoryType: probe.dependsOnMemoryType,
        relatedObjectIds: probe.relatedObjectIds,
        relatedEventIds: probe.relatedEventIds,
        responseTime: 1000,
        isCorrect: true,
      }))

      recordProbeAnswers(answers)
      answers.forEach((answer, index) => {
        const probe = probes[index]
        if (!probe) return
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
        ;(config.goals ?? []).forEach((goal) => goalStatus.set(goal.id, gameStore.isGoalAchieved(goal)))
        const goalsAchieved = [...goalStatus.values()].filter(Boolean).length
        const metrics = calculateMetrics(session, (config.goals ?? []).length, goalsAchieved, gameStore.elapsedMs)
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

      // 直接跳转结果分析页，不再展示题目
      const to = `/result/${taskId}`
      setTimeout(() => navigate(to, { replace: true }), 0)
    }
    // ⚠️ 依赖只列 taskId/navigate：effect 内部用 getState() 读 currentSession，
    // 不订阅其变化，避免 setState → 重新执行 → 又 setState 的无限循环。
  }, [taskId, navigate])

  return (
    <div className="flex items-center justify-center h-full">
      <p className="text-text-muted">正在进入结果分析页...</p>
    </div>
  )
}
