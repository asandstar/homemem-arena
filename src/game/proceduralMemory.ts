/**
 * 程序记忆系统
 *
 * 追踪和验证操作序列，用于 procedural 类型的目标。
 * 玩家必须按指定顺序执行操作，才能达成程序记忆目标。
 */

import type { GoalSpec } from '../types/task'

export interface ProceduralProgress {
  /** 当前步骤索引（0-based），表示下一个需要完成的步骤 */
  currentStepIndex: number
  /** 错误次数（用于统计和反馈） */
  mistakeCount: number
  /** 是否已完成所有步骤 */
  completed: boolean
}

export interface ProceduralCheckResult {
  /** 是否匹配当前步骤 */
  matched: boolean
  /** 推进后的进度（如果匹配）或保持不变（如果不匹配） */
  progress: ProceduralProgress
  /** 是否刚刚完成了整个序列 */
  justCompleted: boolean
  /** 步骤描述（用于提示） */
  stepLabel?: string
}

export function initProceduralProgress(): ProceduralProgress {
  return {
    currentStepIndex: 0,
    mistakeCount: 0,
    completed: false,
  }
}

/**
 * 检查一个操作是否匹配目标的程序记忆序列的当前步骤
 */
export function checkProceduralStep(
  goal: GoalSpec,
  currentProgress: ProceduralProgress,
  action: 'pick' | 'place' | 'use',
  targetId: string,
): ProceduralCheckResult {
  const sequence = goal.requiredSequence
  if (!sequence || sequence.length === 0) {
    return { matched: true, progress: currentProgress, justCompleted: false }
  }

  if (currentProgress.completed) {
    return { matched: true, progress: currentProgress, justCompleted: false }
  }

  const currentStep = sequence[currentProgress.currentStepIndex]
  if (!currentStep) {
    return { matched: true, progress: currentProgress, justCompleted: false }
  }

  const matches = currentStep.action === action && currentStep.targetId === targetId

  if (matches) {
    const nextIndex = currentProgress.currentStepIndex + 1
    const completed = nextIndex >= sequence.length
    return {
      matched: true,
      progress: {
        ...currentProgress,
        currentStepIndex: nextIndex,
        completed,
      },
      justCompleted: completed,
      stepLabel: currentStep.label,
    }
  }

  // 不匹配：检查这个操作是否属于序列中的任何步骤（如果是，就是顺序错误）
  const isStepInSequence = sequence.some(
    (step) => step.action === action && step.targetId === targetId,
  )

  if (isStepInSequence) {
    return {
      matched: false,
      progress: {
        ...currentProgress,
        mistakeCount: currentProgress.mistakeCount + 1,
      },
      justCompleted: false,
      stepLabel: currentStep.label,
    }
  }

  // 操作不在序列中：忽略（可能是其他目标的操作）
  return { matched: true, progress: currentProgress, justCompleted: false }
}

/**
 * 检查是否所有步骤都已完成（即使 predicate 还没满足，也表示程序记忆部分完成）
 */
export function isSequenceCompleted(
  goal: GoalSpec,
  progress: ProceduralProgress,
): boolean {
  if (!goal.requiredSequence || goal.requiredSequence.length === 0) return true
  return progress.completed
}

/**
 * 获取当前步骤描述
 */
export function getCurrentStepLabel(
  goal: GoalSpec,
  progress: ProceduralProgress,
): string | null {
  const sequence = goal.requiredSequence
  if (!sequence || sequence.length === 0) return null
  if (progress.completed) return null
  const step = sequence[progress.currentStepIndex]
  return step?.label ?? null
}

/**
 * 计算序列完成百分比（0-100）
 */
export function getSequenceProgressPercent(
  goal: GoalSpec,
  progress: ProceduralProgress,
): number {
  const sequence = goal.requiredSequence
  if (!sequence || sequence.length === 0) return 100
  if (progress.completed) return 100
  return Math.round((progress.currentStepIndex / sequence.length) * 100)
}
