import { useState, useCallback, useEffect, useRef } from 'react'
import { useGameStore } from '../store/useGameStore'
import { useToastStore } from '../store/useToastStore'
import { playCharacterSpeak } from '../audio/sfx'
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
  const autoContinueTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  
  const { addScore, incrementChaos } = useGameStore()
  const { addToast: addUiToast } = useToastStore()

  const currentNode = currentSequence?.nodes[dialogState.currentNodeIndex] ?? null

  const openDialog = useCallback((sequence: DialogSequence) => {
    if (autoContinueTimer.current) {
      clearTimeout(autoContinueTimer.current)
    }
    setCurrentSequence(sequence)
    setDialogState({
      currentSequenceId: sequence.id,
      currentNodeIndex: 0,
      isOpen: true,
      history: [],
    })
  }, [])

  const closeDialog = useCallback(() => {
    if (autoContinueTimer.current) {
      clearTimeout(autoContinueTimer.current)
    }
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
        case 'memory': {
          const slotCount = choice.effect.value as number
          useGameStore.setState((state) => ({
            memorySlots: [...state.memorySlots, ...new Array(slotCount).fill(null)],
          }))
          addUiToast('success', `获得 ${slotCount} 个额外记忆槽！`)
          break
        }
        case 'chaos': {
          const amount = choice.effect.value as number
          incrementChaos(amount)
          if (amount >= 0) {
            addUiToast('error', `混乱值 +${amount}`)
          } else {
            addUiToast('success', `混乱值 ${amount}`)
          }
          break
        }
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
  }, [addScore, incrementChaos, addUiToast, openDialog])

  const handleNext = useCallback(() => {
    if (autoContinueTimer.current) {
      clearTimeout(autoContinueTimer.current)
    }
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
      return
    }

    if (currentNode && currentNode.autoContinue && !currentNode.choices?.length) {
      const delay = currentNode.autoContinueDelay ?? 2000
      autoContinueTimer.current = setTimeout(() => {
        handleNext()
      }, delay)
    }

    return () => {
      if (autoContinueTimer.current) {
        clearTimeout(autoContinueTimer.current)
      }
    }
  }, [dialogState.currentNodeIndex, dialogState.isOpen, currentNode, handleNext])

  useEffect(() => {
    if (dialogState.isOpen && currentNode && currentNode.text) {
      playCharacterSpeak(currentNode.speaker)
    }
  }, [dialogState.currentNodeIndex])

  useEffect(() => {
    return () => {
      if (autoContinueTimer.current) {
        clearTimeout(autoContinueTimer.current)
      }
    }
  }, [])

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