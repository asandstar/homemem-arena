// AI 分析 - 从完整 session 计算指标、生成失败原因和策略建议

import type { SessionData, SessionMetrics, FailureReason, PolicySuggestion, ProbeAnswer } from '../types/session'

/** 计算指标 */
export function calculateMetrics(
  session: SessionData,
  totalGoals: number,
  goalsAchieved: number,
  gameplayDurationMs?: number,
): SessionMetrics {
  const events = session.events
  const movementEvents = events.filter((e) => e.type === 'movement')
  const probeEvents = events.filter((e) => e.type === 'probe_answer')
  const correctProbes = probeEvents.filter((e) => e.type === 'probe_answer' && e.isCorrect).length
  const probeAnswers = session.probe_answers

  // 重复搜索：同一房间访问超过 2 次
  const roomVisitCount: Record<string, number> = {}
  let repeated = 0
  for (const e of movementEvents) {
    const room = e.toRoom
    roomVisitCount[room] = (roomVisitCount[room] ?? 0) + 1
    if (roomVisitCount[room] > 2) repeated++
  }

  // 反应时间
  const reactionTimes = probeEvents
    .filter((e) => e.type === 'probe_answer')
    .map((e) => (e.type === 'probe_answer' ? e.reactionTime : 0))
  const avgReaction = reactionTimes.length > 0
    ? reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length
    : 0

  const accuracyFor = (memoryType: ProbeAnswer['memoryType']): number => {
    const matching = probeAnswers.filter((answer) => answer.memoryType === memoryType)
    return matching.length > 0
      ? matching.filter((answer) => answer.isCorrect).length / matching.length
      : 0
  }
  const gameplayEvents = events.filter((event) => event.type !== 'probe_answer')
  const durationMs = gameplayDurationMs
    ?? gameplayEvents.reduce((max, event) => Math.max(max, event.timestamp), 0)
  const stepCount = events.reduce((max, event) => Math.max(max, event.step), 0)
  const wrongPlacements = events.filter((event) => (
    event.type === 'action'
    && event.action === 'place'
    && event.result === 'fail'
  )).length
  const actionEvents = events.filter((event) => event.type === 'action')
  const successfulActions = actionEvents.filter((event) => event.type === 'action' && event.result === 'success').length
  const progressTimestamps = events
    .filter((event) => event.type === 'task_progress' && event.status === 'achieved')
    .map((event) => event.timestamp)
    .sort((a, b) => a - b)
  const progressBoundaries = [0, ...progressTimestamps, durationMs]
  const longestGoalGapMs = progressBoundaries.reduce((longest, timestamp, index) => {
    if (index === 0) return longest
    return Math.max(longest, timestamp - progressBoundaries[index - 1])
  }, 0)

  return {
    durationMs,
    stepCount,
    roomTransitions: movementEvents.length,
    repeatedSearchCount: repeated,
    probeAccuracy: probeEvents.length > 0 ? correctProbes / probeEvents.length : 0,
    goalsAchieved,
    goalsTotal: totalGoals,
    avgProbeReactionTime: avgReaction,
    totalMemories: session.memories.length,
    spatialAccuracy: accuracyFor('spatial'),
    objectStateAccuracy: accuracyFor('object'),
    temporalAccuracy: accuracyFor('temporal'),
    proceduralAccuracy: accuracyFor('procedural'),
    totalActions: events.filter((e) => e.type === 'action').length,
    unnecessaryRevisits: repeated,
    wrongPlacements,
    containerMistakes: 0,
    missedCleanupSteps: 0,
    flowInterventionCount: events.filter((event) => event.type === 'flow_intervention').length,
    longestGoalGapMs,
    actionSuccessRate: actionEvents.length > 0 ? successfulActions / actionEvents.length : 0,
  }
}

/** 分析失败原因 */
export function analyzeFailures(session: SessionData, goalStatus: Map<string, boolean>): FailureReason[] {
  const reasons: FailureReason[] = []

  // 检查未达成的目标
  for (const [goalId, achieved] of goalStatus.entries()) {
    if (!achieved) {
      const relatedEvent = session.events.find(
        (e) => e.type === 'task_progress' && e.goalId === goalId
      )
      reasons.push({
        category: 'missed-object',
        description: `目标 ${goalId} 未达成${relatedEvent && relatedEvent.type === 'task_progress' ? `: ${relatedEvent.description}` : ''}`,
        relatedEntityId: goalId,
      })
    }
  }

  // 检查错放容器
  const wrongPlaceEvents = session.events.filter(
    (e) => e.type === 'action' && e.action === 'place' && e.result === 'success'
  )
  for (const evt of wrongPlaceEvents) {
    if (evt.type !== 'action') continue
    // 简化：所有 place 都视为合理
  }

  // 重复搜索过多
  const roomVisits: Record<string, number> = {}
  for (const e of session.events) {
    if (e.type === 'movement') {
      roomVisits[e.toRoom] = (roomVisits[e.toRoom] ?? 0) + 1
    }
  }
  const overVisited = Object.entries(roomVisits).filter(([_, n]) => n >= 3)
  if (overVisited.length > 0) {
    reasons.push({
      category: 'forgot-location',
      description: `在 ${overVisited.map(([r]) => r).join('、')} 房间反复搜索，提示空间记忆可能不足`,
    })
  }

  // 记忆测试错误
  const wrongProbes = session.events.filter(
    (e) => e.type === 'probe_answer' && !e.isCorrect
  )
  if (wrongProbes.length > 0) {
    reasons.push({
      category: 'memory-error',
      description: `${wrongProbes.length} 道记忆测试题答错，需要更好的物体/空间记忆`,
    })
  }

  return reasons
}

/** 生成 AI 策略建议 */
export function generateSuggestions(
  session: SessionData,
  _goalStatus: Map<string, boolean>,
  failures: FailureReason[]
): PolicySuggestion[] {
  const suggestions: PolicySuggestion[] = []
  const metrics = session.metrics

  // 基于失败原因生成
  for (const fail of failures) {
    if (fail.category === 'forgot-location') {
      suggestions.push({
        title: '建立空间索引',
        description: '建议机器人在首次进入房间时建立"物体-房间"映射表，并定期复述强化记忆',
        memoryType: 'spatial',
      })
    }
    if (fail.category === 'memory-error') {
      suggestions.push({
        title: '强化多模态记忆',
        description: '建议机器人同时记录物体的颜色、位置、所属类别，在回忆时多线索联合检索',
        memoryType: 'object',
      })
    }
    if (fail.category === 'missed-object') {
      suggestions.push({
        title: '系统性遍历',
        description: '建议机器人按"先开容器 → 观察 → 拾取"的固定序列工作，避免遗漏',
        memoryType: 'procedural',
      })
    }
  }

  // 基于指标生成
  if (metrics.repeatedSearchCount > 0) {
    suggestions.push({
      title: '减少无效搜索',
      description: `本轮会话有 ${metrics.repeatedSearchCount} 次重复搜索，建议机器人在每次搜索前查询已有记忆`,
      memoryType: 'spatial',
    })
  }

  if (metrics.probeAccuracy < 0.6) {
    suggestions.push({
      title: '改善记忆编码',
      description: '记忆测试准确率较低，建议机器人在观察时使用更结构化的记忆编码方式',
      memoryType: 'object',
    })
  }

  if (suggestions.length === 0) {
    suggestions.push({
      title: '继续保持',
      description: '本轮表现良好，建议持续验证多任务下的泛化能力',
      memoryType: 'procedural',
    })
  }

  return suggestions
}

/** 生成 AI 自然语言摘要 */
export function generateSummary(session: SessionData): string {
  const { metrics, memories, failureReasons } = session
  const memByType: Record<string, number> = {}
  for (const m of memories) {
    memByType[m.type] = (memByType[m.type] ?? 0) + 1
  }

  const lines: string[] = []
  lines.push(`本轮会话在任务"${session.taskName}"上完成度 ${metrics.goalsAchieved}/${metrics.goalsTotal}。`)
  lines.push(`共执行 ${metrics.stepCount} 步，跨房间 ${metrics.roomTransitions} 次，记忆测试准确率 ${(metrics.probeAccuracy * 100).toFixed(0)}%。`)
  lines.push(`记忆库累计写入 ${memories.length} 条：时序 ${memByType.temporal ?? 0}、空间 ${memByType.spatial ?? 0}、物体 ${memByType.object ?? 0}、程序 ${memByType.procedural ?? 0}。`)

  if (failureReasons.length > 0) {
    lines.push(`主要问题：${failureReasons[0].description}`)
  } else {
    lines.push('未检测到明显失败。')
  }

  return lines.join(' ')
}

/** 生成机器人诊断报告 */
export function generateRobotDiagnosis(session: SessionData): string {
  const { metrics, memories } = session
  
  const memByType: Record<string, number> = {}
  for (const m of memories) {
    memByType[m.type] = (memByType[m.type] ?? 0) + 1
  }

  const diagnostics: string[] = []
  const suggestions: string[] = []

  const spatialScore = memByType.spatial ?? 0
  const objectScore = memByType.object ?? 0
  const proceduralScore = memByType.procedural ?? 0

  if (spatialScore >= 5) {
    diagnostics.push('空间记忆模块表现优秀')
  } else if (spatialScore >= 2) {
    diagnostics.push('空间记忆模块运行正常')
  } else {
    diagnostics.push('空间记忆模块数据不足')
  }

  if (objectScore >= 5) {
    diagnostics.push('物体识别模块精度达标')
  } else if (objectScore >= 2) {
    diagnostics.push('物体识别模块运行稳定')
  } else {
    diagnostics.push('物体识别模块需要校准')
  }

  if (proceduralScore >= 3) {
    diagnostics.push('流程记忆模块逻辑连贯')
  } else if (proceduralScore >= 1) {
    diagnostics.push('流程记忆模块存在断点')
  } else {
    diagnostics.push('流程记忆模块未建立')
  }

  const breakpointCount = metrics.repeatedSearchCount
  if (breakpointCount > 0) {
    diagnostics.push(`检测到 ${breakpointCount} 次记忆断点`)
    suggestions.push(`建议先锁定关键物品位置，再执行长程归位任务`)
  }

  const wrongProbes = session.events.filter(e => e.type === 'probe_answer' && !e.isCorrect).length
  if (wrongProbes > 0) {
    diagnostics.push(`记忆测试出现 ${wrongProbes} 次错误响应`)
    suggestions.push(`建议强化多模态记忆编码，建立"视觉-位置"关联索引`)
  }

  const missedGoals = metrics.goalsTotal - metrics.goalsAchieved
  if (missedGoals > 0) {
    diagnostics.push(`任务目标达成率 ${((metrics.goalsAchieved / metrics.goalsTotal) * 100).toFixed(0)}%，${missedGoals} 项未完成`)
    suggestions.push(`建议启用系统性遍历模式，按"先开容器 → 观察 → 拾取"序列工作`)
  }

  if (suggestions.length === 0) {
    suggestions.push('当前模块运行状态良好，建议持续验证多任务泛化能力')
  }

  const diagnosisParts: string[] = []
  
  if (diagnostics.length > 0) {
    diagnosisParts.push(`诊断报告：${diagnostics.join('，')}。`)
  }
  
  if (suggestions.length > 0) {
    diagnosisParts.push(`优化建议：${suggestions.join('；')}。`)
  }

  return diagnosisParts.join(' ')
}
