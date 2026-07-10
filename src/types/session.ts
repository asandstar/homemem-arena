import type { SessionEvent } from './event'
import type { MemoryEntry } from './memory'
import type { MemoryType } from './memory'

export type SessionStatus = 'in-progress' | 'completed' | 'failed' | 'aborted'

export interface SessionMetrics {
  durationMs: number
  stepCount: number
  roomTransitions: number
  repeatedSearchCount: number
  probeAccuracy: number
  goalsAchieved: number
  goalsTotal: number
  avgProbeReactionTime: number
  totalMemories: number
  spatialAccuracy: number
  objectStateAccuracy: number
  temporalAccuracy: number
  proceduralAccuracy: number
  totalActions: number
  unnecessaryRevisits: number
  wrongPlacements: number
  containerMistakes: number
  missedCleanupSteps: number
  /** 可观察的过程代理指标，不等同于主观心流量表 */
  flowInterventionCount: number
  longestGoalGapMs: number
  actionSuccessRate: number
}

export interface FailureReason {
  category: 'wrong-container' | 'missed-object' | 'forgot-location' | 'sequence-error' | 'timeout' | 'memory-error'
  description: string
  relatedEntityId?: string
}

export interface PolicySuggestion {
  title: string
  description: string
  memoryType: string
}

export interface ProbeAnswer {
  question: string
  correctAnswer: string | string[]
  userAnswer: string | string[]
  memoryType: MemoryType
  relatedObjectIds?: string[]
  relatedEventIds?: string[]
  responseTime: number
  isCorrect: boolean
}

export interface Observation {
  timestamp: number
  roomId: string
  cameraPosition: { x: number; y: number; z: number }
  cameraRotation: number
  visibleObjectIds: string[]
  visibleContainerIds: string[]
  heldObjectId: string | null
  taskProgress: number
  screenshotUrl?: string
  frameId?: number
}

export interface ObjectStateChange {
  timestamp: number
  step: number
  objectId: string
  configId: string
  property: string
  oldValue: unknown
  newValue: unknown
}

export interface ContainerStateChange {
  timestamp: number
  step: number
  containerId: string
  property: 'open' | 'containedIds'
  oldValue: unknown
  newValue: unknown
}

export interface ScriptedEventRecord {
  id: string
  timestamp: number
  step: number
  type: string
  description: string
  affectedEntityIds: string[]
}

export interface FailureMode {
  type: string
  description: string
  timestamp: number
  step: number
  relatedEntities: string[]
}

export interface AIResearchAnnotation {
  timestamp: number
  task_type: string
  difficulty_level: string
  memory_types_tested: MemoryType[]
  scenario_summary: string
  key_challenges: string[]
  suggested_robot_policy: string
}

export interface SessionData {
  id: string
  episode_id: string
  taskId: string
  task_instruction: string
  scene_id: string
  taskName: string
  startTime: number
  endTime?: number
  status: SessionStatus
  events: SessionEvent[]
  memories: MemoryEntry[]
  metrics: SessionMetrics
  failureReasons: FailureReason[]
  policySuggestions: PolicySuggestion[]
  aiSummary?: string
  agent_pose_trace: Array<{ timestamp: number; x: number; y: number; z: number; rotation: number }>
  camera_pose_trace: Array<{ timestamp: number; x: number; y: number; z: number; rotation: number }>
  observations: Observation[]
  visible_objects_per_step: Record<number, string[]>
  actions: SessionEvent[]
  object_state_changes: ObjectStateChange[]
  container_state_changes: ContainerStateChange[]
  memory_updates: MemoryEntry[]
  scripted_events: ScriptedEventRecord[]
  probe_questions: Array<{
    id: string
    question: string
    type: string
    options?: string[]
    correctAnswer: string | string[]
    memoryType: MemoryType
    difficulty?: string
    relatedObjectIds?: string[]
    relatedEventIds?: string[]
  }>
  probe_answers: ProbeAnswer[]
  outcome_metrics: SessionMetrics
  failure_modes: FailureMode[]
  ai_research_annotation: AIResearchAnnotation
}
