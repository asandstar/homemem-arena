import { useState, useCallback, useEffect } from 'react'
import { useGameStore } from '../store/useGameStore'
import { useToastStore } from '../store/useToastStore'
import type { DialogSequence, DialogChoice, DialogState } from './dialog'
import { getDialogSequenceByTrigger } from './dialogs'

const initialDialogState: DialogState = {
  currentSequenceId: null,
  currentNodeIndex: 0,
  isOpen: false,
  history: [],
}

export function useDialog() {
  const [dialogState, setDialogState] = useState<DialogState>(initialDialogState)
  const [currentSequence, setCurrentSequence] = useState<DialogSequence | null>(null)
  
  const { addScore } = useGameStore()
  const { addToast: addUiToast } = useToastStore()

  const currentNode = currentSequence?.nodes[dialogState.currentNodeIndex] ?? null

  const openDialog = useCallback((sequence: DialogSequence) => {
    setCurrentSequence(sequence)
    setDialogState({
      currentSequenceId: sequence.id,
      currentNodeIndex: 0,
      isOpen: true,
      history: [],
    })
  }, [])

  const closeDialog = useCallback(() => {
    setDialogState((prev) => ({ ...prev, isOpen: false }))
    setCurrentSequence(null)
  }, [])

  const triggerDialog = useCallback((
    triggerType: 'start' | 'roomEnter' | 'event' | 'time' | 'goalComplete',
    triggerValue: string | number
  ) => {
    const sequence = getDialogSequenceByTrigger(triggerType, triggerValue)
    if (sequence) {
      openDialog(sequence)
    }
  }, [openDialog])

  const handleChoice = useCallback((choice: DialogChoice) => {
    if (choice.effect) {
      switch (choice.effect.type) {
        case 'score':
          addScore(choice.effect.value as number)
          addUiToast('success', `获得 ${choice.effect.value} 分！`)
          break
        case 'hint':
          addUiToast('info', choice.effect.value as string)
          break
        case 'memory':
          break
        case 'chaos':
          break
      }
    }

    if (choice.nextDialogId) {
      const nextSequence = getDialogSequenceByTrigger('start', choice.nextDialogId)
      if (nextSequence) {
        openDialog(nextSequence)
        return
      }
    }

    setDialogState((prev) => ({
      ...prev,
      history: [...prev.history, choice.id],
      currentNodeIndex: prev.currentNodeIndex + 1,
    }))
  }, [addScore, addUiToast, openDialog])

  const handleNext = useCallback(() => {
    setDialogState((prev) => {
      if (currentSequence && prev.currentNodeIndex >= currentSequence.nodes.length - 1) {
        return { ...prev, isOpen: false }
      }
      return {
        ...prev,
        currentNodeIndex: prev.currentNodeIndex + 1,
      }
    })
  }, [currentSequence])

  useEffect(() => {
    if (!dialogState.isOpen) {
      setCurrentSequence(null)
    }
  }, [dialogState.isOpen])

  return {
    dialogState,
    currentSequence,
    currentNode,
    openDialog,
    closeDialog,
    triggerDialog,
    handleChoice,
    handleNext,
  }
}