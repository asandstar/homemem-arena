import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useDialog } from './useDialog'

describe('useDialog', () => {
  it('closes a dialog after choosing an option on the final node', async () => {
    const { result } = renderHook(() => useDialog())

    act(() => result.current.triggerDialog('start', 'task-clean-table'))
    act(() => result.current.handleNext())

    const finalChoice = result.current.currentNode?.choices?.[0]
    expect(finalChoice).toBeDefined()

    act(() => result.current.handleChoice(finalChoice!))

    expect(result.current.dialogState.isOpen).toBe(false)
    expect(result.current.dialogState.history).toContain(finalChoice!.id)
    await waitFor(() => expect(result.current.currentNode).toBeNull())
  })
})
