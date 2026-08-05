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

/** 生成 MEM-07 机器人观察日志
 *  风格：第一人称、科幻感（编号日志口吻）、真实数据解读，
 *  避免"模块/编码/索引"等伪 AI 术语；不玩 meta 梗；
 *  最多 1 条轻度吐槽（如猫），其余为客观观察。
 */
export function generateRobotDiagnosis(session: SessionData): string {
  const { metrics, memories, failureReasons, taskName } = session

  const memByType: Record<string, number> = {}
  for (const m of memories) {
    memByType[m.type] = (memByType[m.type] ?? 0) + 1
  }

  const obs: string[] = []
  const adv: string[] = []

  // ===== 基础事实（从不撒谎，只讲数据）=====
  obs.push(
    `本次任务「${taskName ?? '未命名'}」目标完成度 ${metrics.goalsAchieved}/${metrics.goalsTotal}，` +
    `共执行 ${metrics.stepCount} 步，跨房间移动 ${metrics.roomTransitions} 次。`,
  )

  const probeTotal = session.events.filter((e) => e.type === 'probe_answer').length
  const probeWrong = session.events.filter((e) => e.type === 'probe_answer' && !e.isCorrect).length
  if (probeTotal > 0) {
    const acc = Math.round(((probeTotal - probeWrong) / probeTotal) * 100)
    obs.push(`记忆自检 ${probeTotal} 题，正确率 ${acc}%${probeWrong > 0 ? `，错误 ${probeWrong} 题` : ''}。`)
  }

  // ===== 记忆写入分布（讲人话，不说"模块"）=====
  if (memories.length > 0) {
    const parts: string[] = []
    if ((memByType.spatial ?? 0) > 0) parts.push(`位置记忆 ${memByType.spatial} 条`)
    if ((memByType.object ?? 0) > 0) parts.push(`物品记忆 ${memByType.object} 条`)
    if ((memByType.temporal ?? 0) > 0) parts.push(`时间记忆 ${memByType.temporal} 条`)
    if ((memByType.procedural ?? 0) > 0) parts.push(`流程记忆 ${memByType.procedural} 条`)
    if (parts.length > 0) {
      obs.push(`共写入 ${memories.length} 条记忆：${parts.join('，')}。`)
    }
  } else {
    adv.push('本轮没有使用记忆槽。遇到关键物品位置时按 E 记录，之后能节省大量寻找时间。')
  }

  // ===== 回头路次数（重复搜索）=====
  const repeatedSearch = metrics.repeatedSearchCount
  if (repeatedSearch >= 3) {
    obs.push(`检测到 ${repeatedSearch} 次重复进入同一房间——大概率是在找东西时迷了路。`)
    adv.push('下一轮建议：先花 10 秒把当前房间扫一遍，再去下一个房间，减少来回。')
  } else if (repeatedSearch > 0) {
    obs.push(`有 ${repeatedSearch} 次短程折返，整体动线尚可。`)
  }

  // ===== 放错次数 =====
  if (metrics.wrongPlacements > 0) {
    obs.push(`有 ${metrics.wrongPlacements} 次物品放错了容器。`)
    adv.push('放置前看一眼容器上方提示的颜色/图标，和手上物品对比一下再按 F。')
  }

  // ===== 目标未完成 =====
  const missedGoals = metrics.goalsTotal - metrics.goalsAchieved
  if (missedGoals > 0 && failureReasons.length > 0) {
    const top = failureReasons[0].description
    obs.push(`最主要的障碍：${top}`)
  }

  // ===== 混乱峰值 / 猫吐槽（保留 1 条轻度吐槽，且要自然）=====
  // 注意：这里不直接访问 gameStats.chaosPeak，因为 SessionData 里没有 chaosPeak，
  // 用 failureReasons 里如果提到"猫"相关，再触发吐槽。
  const hasCatEvent = session.events.some((e) =>
    (e as any).eventId?.toLowerCase?.().includes('cat') ||
    String((e as any).description ?? '').toLowerCase().includes('cat') ||
    String((e as any).description ?? '').includes('猫咪') ||
    String((e as any).description ?? '').includes('猫'),
  )
  if (hasCatEvent) {
    // 唯一 1 条轻度吐槽，且与真实剧情事件挂钩
    adv.push('另外：有猫咪活动痕迹的房间，离开前再扫一眼桌面——你懂的。')
  }

  // ===== 正面收尾（如果表现好就不要给建议，给肯定）=====
  if (missedGoals === 0 && adv.length === 0) {
    adv.push('本轮动线流畅、记忆使用合理，保持这个节奏即可。')
  }

  const lines: string[] = []
  if (obs.length > 0) lines.push(obs.join(' '))
  if (adv.length > 0) lines.push(`建议：${adv.join(' ')}`)

  return lines.join(' ')
}
