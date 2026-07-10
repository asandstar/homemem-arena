import { beforeEach, describe, expect, it } from 'vitest'
import { executePick, executeSaveMemory } from './commands'
import { useGameStore } from '../store/useGameStore'
import { useSessionStore } from '../store/useSessionStore'

describe('统一游戏命令管线', () => {
  beforeEach(() => {
    useSessionStore.getState().resetSession()
    useGameStore.getState().initializeTask('task-clean-table')
  })

  it('简报阶段拒绝交互且不产生 step 或 Session 事件', () => {
    const entity = useGameStore.getState().entities.find((item) => item.status === 'free')!
    const result = executePick(entity.id)

    expect(result.success).toBe(false)
    expect(useGameStore.getState().stepCount).toBe(0)
    expect(useSessionStore.getState().currentSession).toBeNull()
  })

  it('playing 阶段的拾取原子地更新状态、step 和 Session action', () => {
    const task = useGameStore.getState().task!
    useSessionStore.getState().startSession(task.id, task.name, task.briefing)
    useGameStore.getState().startPlaying()
    const entity = useGameStore.getState().entities.find((item) => (
      item.status === 'free' && item.currentRoom === useGameStore.getState().currentRoom
    ))!

    const result = executePick(entity.id)

    expect(result.success).toBe(true)
    expect(useGameStore.getState().stepCount).toBe(1)
    expect(useGameStore.getState().heldEntityId).toBe(entity.id)
    const actions = useSessionStore.getState().currentSession?.actions ?? []
    expect(actions).toHaveLength(1)
    expect(actions[0]).toMatchObject({ type: 'action', action: 'pick', result: 'success', step: 1 })
  })

  it('E 保存记忆同时更新三槽记忆和研究 Session', () => {
    const task = useGameStore.getState().task!
    useSessionStore.getState().startSession(task.id, task.name, task.briefing)
    useGameStore.getState().startPlaying()
    const entity = useGameStore.getState().entities.find((item) => (
      item.status === 'free' && item.currentRoom === useGameStore.getState().currentRoom
    ))!

    const result = executeSaveMemory(entity.id)

    expect(result.success).toBe(true)
    expect(useGameStore.getState().memorySlots[0]?.entityConfigId).toBe(entity.configId)
    expect(useSessionStore.getState().currentSession?.memories).toHaveLength(1)
    expect(useSessionStore.getState().currentSession?.events.some((event) => event.type === 'memory_write')).toBe(true)
  })
})
