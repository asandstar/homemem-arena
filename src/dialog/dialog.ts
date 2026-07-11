export interface DialogChoice {
  id: string
  text: string
  nextDialogId?: string
  effect?: {
    type: 'score' | 'memory' | 'chaos' | 'hint'
    value: number | string
  }
}

export interface DialogNode {
  id: string
  speaker: 'player' | 'narrator' | 'system' | 'character'
  speakerName?: string
  text: string
  choices?: DialogChoice[]
  nextDialogId?: string
  autoContinue?: boolean
  autoContinueDelay?: number
  condition?: {
    type: 'room' | 'heldItem' | 'goalProgress' | 'time' | 'event'
    value: string | number
  }
}

export interface DialogSequence {
  id: string
  name: string
  trigger: {
    type: 'start' | 'roomEnter' | 'event' | 'time' | 'goalComplete'
    value: string | number
  }
  nodes: DialogNode[]
  priority?: number
}

export interface DialogState {
  currentSequenceId: string | null
  currentNodeIndex: number
  isOpen: boolean
  history: string[]
}

export type DialogTriggerType = 'start' | 'roomEnter' | 'event' | 'time' | 'goalComplete'