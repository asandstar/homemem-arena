import type { EntityStateSnapshot, GoalSpec, TaskConfig } from '../types/task'

export const FLOW_HINT_LEVEL_ONE_MS = 20_000
export const FLOW_HINT_LEVEL_TWO_MS = 45_000

const MEMORY_STRATEGIES: Record<GoalSpec['memoryType'], string> = {
  spatial: '回想物体最后出现的房间；不确定时用 E 保存关键位置。',
  object: '先核对物体状态和容器，再执行一次明确的拾取或放置。',
  temporal: '回顾刚才发生的环境变化，旧位置可能已经失效。',
  procedural: '把流程拆成一步：先完成当前动作，再考虑后续收尾。',
}

export function findActiveGoal(
  task: TaskConfig | null,
  entities: EntityStateSnapshot[],
  achievedGoalIds: Set<string>,
): GoalSpec | null {
  if (!task) return null

  return task.goals.find((goal) => {
    const dependenciesMet = (goal.dependsOnGoalIds ?? []).every((id) => achievedGoalIds.has(id))
    if (!dependenciesMet) return false
    if (goal.kind === 'milestone' && achievedGoalIds.has(goal.id)) return false
    return !goal.predicate(entities)
  }) ?? null
}

export function buildFlowHint(goal: GoalSpec, level: 1 | 2): string {
  if (level === 1) return `当前只专注一件事：${goal.description}`
  return `${MEMORY_STRATEGIES[goal.memoryType]} 当前目标：${goal.description}`
}
