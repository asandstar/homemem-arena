// 关卡 3：过期的早餐记忆（UPDATE / stale object-location memory）
//
// 保留历史 task id `task-laundry-sort`，避免破坏公开关卡顺序、存档和路由；
// 展示内容与玩法按 docs/L3_FINAL_DESIGN.md 重做。

import type { EntityStateSnapshot, StageContext, TaskConfig } from '../../types/task'
import { sharedRooms } from '../rooms'

const STAGE_ENCODE = 'stage-encode-cereal'
const STAGE_DISTRACTOR = 'stage-set-table'
const STAGE_STALE = 'stage-stale-memory'
const STAGE_UPDATE = 'stage-update-memory'
const STAGE_SERVE = 'stage-serve-cereal'
const STAGE_CLEANUP = 'stage-breakfast-cleanup'

const LOWER_CABINET = 'cnt-cabinet-lower'
const UPPER_CABINET = 'cnt-cabinet-upper'
const DINING_TABLE = 'cnt-breakfast-table'
const SINK = 'cnt-breakfast-sink'

const CEREAL = 'obj-cereal'
const BOWL = 'obj-breakfast-bowl'
const CUP = 'obj-breakfast-cup'
const SPOON = 'obj-breakfast-spoon'

const DINING_CENTER = sharedRooms.dining.center
const UPPER_LOCAL = { x: 1.0, y: 0.9, z: -1.9 }
// applyScriptedMove 内部会自动叠加 room.center，所以这里传**房间局部坐标**
const UPPER_WORLD = {
  room: 'dining' as const,
  x: UPPER_LOCAL.x,
  y: UPPER_LOCAL.y + 0.55,
  z: UPPER_LOCAL.z,
}

function entityPlacedIn(entities: EntityStateSnapshot[], configId: string, containerId: string): boolean {
  const entity = entities.find((candidate) => candidate.configId === configId)
  return entity?.status === 'placed' && entity.placedIn === containerId
}

function tableIsSet(ctx: StageContext): boolean {
  return [BOWL, CUP, SPOON].every((id) => entityPlacedIn(ctx.entities, id, DINING_TABLE))
}

function cleanupFinished(ctx: StageContext): boolean {
  return entityPlacedIn(ctx.entities, BOWL, SINK)
    && entityPlacedIn(ctx.entities, CUP, SINK)
    && entityPlacedIn(ctx.entities, SPOON, DINING_TABLE)
}

function cerealMemory(ctx: StageContext) {
  return ctx.memorySlots.find((slot) => slot?.entityConfigId === CEREAL) ?? null
}

function hasFreshCerealMemory(ctx: StageContext): boolean {
  const memory = cerealMemory(ctx)
  return !!memory && !memory.outdated
}

function hasStaleCerealMemory(ctx: StageContext): boolean {
  return cerealMemory(ctx)?.outdated === true
}

function toDiningLocal(position: StageContext['playerPosition']) {
  return {
    x: position.x - DINING_CENTER.x,
    z: position.z - DINING_CENTER.z,
  }
}

function nearLocal(ctx: StageContext, target: { x: number; z: number }, distance = 1.15): boolean {
  const local = toDiningLocal(ctx.playerPosition)
  return Math.hypot(local.x - target.x, local.z - target.z) <= distance
}

function cerealMovedToUpper(ctx: StageContext): boolean {
  const cereal = ctx.entities.find((entity) => entity.configId === CEREAL)
  return cereal?.placedIn === UPPER_CABINET && cereal.status === 'hidden'
}

export const laundrySortTask: TaskConfig = {
  id: 'task-laundry-sort',
  name: '过期的早餐记忆',
  description: '🥣 在 L2 的稳定回忆基础上继续升级：先按 E 编码麦片位置，完成分心任务后核对旧记忆；现实发生变化时，必须发现冲突、重新观察并再次按 E 更新。',
  memoryTypes: ['object', 'spatial', 'temporal'],
  difficulty: 'hard',
  rooms: ['dining'],
  iconKey: 'dish',
  tags: ['记忆更新', '过期记忆', '单房间', '早餐任务'],
  timeLimit: 360,
  spawnPosition: { x: 0, z: 1.9 },
  spawnRotation: 0,
  initialStageId: STAGE_ENCODE,

  stages: [
    {
      id: STAGE_ENCODE,
      playerObjective: '【形成记忆】打开北墙左侧的下层橱柜，找到麦片；靠近麦片按 E，记住它现在的位置。',
      entryCondition: () => true,
      completionCondition: hasFreshCerealMemory,
      nextStage: STAGE_DISTRACTOR,
    },
    {
      id: STAGE_DISTRACTOR,
      playerObjective: '【分散注意】把碗、杯子和勺子放到餐桌上。先不要拿麦片——让注意力离开刚才的位置。',
      entryCondition: hasFreshCerealMemory,
      completionCondition: tableIsSet,
      nextStage: STAGE_STALE,
    },
    {
      id: STAGE_STALE,
      playerObjective: '【旧记忆冲突】现在去取麦片。先按记忆回到下层橱柜；如果那里空了，说明这个记忆已经过期。',
      entryCondition: tableIsSet,
      completionCondition: (ctx) => ctx.triggeredEvents.has('se-conflict-detected'),
      nextStage: STAGE_UPDATE,
    },
    {
      id: STAGE_UPDATE,
      playerObjective: '【重新观察并更新】旧位置已经失效。重新观察北墙附近，找到麦片的真实位置；靠近后按 E 更新记忆，再按 F 拾取。',
      entryCondition: (ctx) => ctx.triggeredEvents.has('se-conflict-detected'),
      completionCondition: (ctx) => hasFreshCerealMemory(ctx) && ctx.memoryUpdateCount >= 1,
      nextStage: STAGE_SERVE,
    },
    {
      id: STAGE_SERVE,
      playerObjective: '【应用新记忆】按更新后的位置拿到麦片，把它放到餐桌上。',
      entryCondition: (ctx) => hasFreshCerealMemory(ctx) && ctx.memoryUpdateCount >= 1,
      completionCondition: (ctx) => entityPlacedIn(ctx.entities, CEREAL, DINING_TABLE),
      nextStage: STAGE_CLEANUP,
    },
    {
      id: STAGE_CLEANUP,
      playerObjective: '【收尾】早餐准备好了。把碗和杯子放进水槽，勺子留在餐桌上，完成任务。',
      entryCondition: (ctx) => entityPlacedIn(ctx.entities, CEREAL, DINING_TABLE),
      completionCondition: cleanupFinished,
      nextStage: null,
    },
  ],

  briefing: `🥣 记忆宅邸 · 第三关（UPDATE：过期记忆更新）

上一关训练的是 RECALL：环境稳定时，相信仍然有效的空间记忆。
这一关升级为 UPDATE：主人准备早餐时临时接到电话，请 MEM-07 帮忙摆桌。麦片、碗和杯子都在北墙的下层橱柜里，勺子已经在餐桌上。

这次真正考验的不是“找东西”，而是判断记忆是否仍然可信：
  ① 打开下层橱柜，找到麦片并按 E 保存位置记忆
  ② 先把碗、杯子、勺子摆上餐桌
  ③ 回来取麦片时，旧位置可能已经变空
  ④ 发现冲突后重新观察，找到麦片并按 E 更新记忆
  ⑤ 把麦片放到餐桌，最后把碗和杯子收进水槽

⚠️ 小地图和 HUD 不会告诉你麦片的新位置。旧记忆变红不是失败，而是在提醒你：现实已经变化。`,

  completionText: '✅ 早餐和清理都完成了！\nMEM-07：「旧记忆不是答案，只是一次有时间戳的观察。发现冲突、重新观察、更新后再行动——UPDATE 模块校准完成。」',
  failureText: '⏰ 时间到了，但这次失败不会清空你的思路。\n提示：先用 E 记住麦片；摆好餐具后回下层柜确认冲突，再在附近重新观察并用 E 更新。',
  systemPrompt: '【MEM-07 日志】L3 UPDATE。唯一会移动的核心对象是麦片：下层橱柜 → 邻近的较高橱柜。必须先保存旧记忆，环境变化后发现冲突，再保存一次新记忆，才能完成。',

  objects: [
    {
      id: CEREAL,
      name: '麦片盒',
      category: 'cereal',
      initialRoom: 'dining',
      initialPosition: { x: -1.0, y: 0.6, z: -1.9 },
      hiddenInContainer: LOWER_CABINET,
      size: { x: 0.28, y: 0.42, z: 0.18 },
      color: '#f59e0b',
      modelAssetId: 'food/carton',
    },
    {
      id: BOWL,
      name: '早餐碗',
      category: 'bowl',
      initialRoom: 'dining',
      initialPosition: { x: -1.0, y: 0.6, z: -1.9 },
      hiddenInContainer: LOWER_CABINET,
      size: { x: 0.24, y: 0.1, z: 0.24 },
      color: '#f8fafc',
      modelAssetId: 'food/bowl',
    },
    {
      id: CUP,
      name: '早餐杯',
      category: 'cup',
      initialRoom: 'dining',
      initialPosition: { x: -1.0, y: 0.6, z: -1.9 },
      hiddenInContainer: LOWER_CABINET,
      size: { x: 0.14, y: 0.16, z: 0.14 },
      color: '#60a5fa',
      modelAssetId: 'food/cup',
    },
    {
      id: SPOON,
      name: '早餐勺',
      category: 'spoon',
      initialRoom: 'dining',
      initialPosition: { x: 0.45, y: 0, z: 0 },
      surfaceContainerId: DINING_TABLE,
      size: { x: 0.073, y: 0.2, z: 0.061 },
      color: '#cbd5e1',
      modelAssetId: 'food/utensil-spoon',
    },
  ],

  containers: [
    {
      id: LOWER_CABINET,
      name: '下层橱柜',
      room: 'dining',
      position: { x: -1.0, y: 0, z: -1.9 },
      size: { x: 0.8, y: 0.56, z: 0.45 },
      surfaceHeight: 0.56,
      color: '#92400e',
      initialOpen: false,
      containsObjectIds: [CEREAL, BOWL, CUP],
      acceptedCategories: [],
      acceptAny: false,
      modelAssetId: 'furniture/kitchenCabinetDrawer',
    },
    {
      id: UPPER_CABINET,
      name: '较高的橱柜',
      room: 'dining',
      position: UPPER_LOCAL,
      size: { x: 0.8, y: 0.56, z: 0.45 },
      surfaceHeight: 1.46,
      color: '#a16207',
      initialOpen: false,
      containsObjectIds: [],
      acceptedCategories: [],
      acceptAny: false,
      modelAssetId: 'furniture/kitchenCabinetUpper',
    },
    {
      id: DINING_TABLE,
      name: '早餐餐桌',
      room: 'dining',
      position: { x: 0, y: 0, z: 0 },
      size: { x: 1.683, y: 0.653, z: 0.895 },
      surfaceHeight: 0.653,
      color: '#92400e',
      initialOpen: true,
      acceptedCategories: ['cereal', 'bowl', 'cup', 'spoon'],
      isTargetZone: true,
      targetLabel: '早餐餐桌',
      modelAssetId: 'furniture/table',
    },
    {
      id: SINK,
      name: '厨房水槽',
      room: 'dining',
      position: { x: 0, y: 0, z: -1.95 },
      size: { x: 0.55, y: 0.72, z: 0.45 },
      surfaceHeight: 0.72,
      color: '#94a3b8',
      initialOpen: true,
      acceptedCategories: ['bowl', 'cup'],
      isTargetZone: true,
      targetLabel: '水槽（碗、杯收这里）',
      modelAssetId: 'furniture/kitchenSink',
    },
  ],

  goals: [
    {
      id: 'g-encode-cereal-memory',
      description: '记住麦片最初在下层橱柜',
      kind: 'milestone',
      memoryType: 'object',
      relatedObjectIds: [CEREAL],
      predicate: (_entities, _snapshot, ctx) => !!ctx && hasFreshCerealMemory(ctx),
      achievedMessage: '✓ 已形成记忆：麦片在下层橱柜',
    },
    {
      id: 'g-set-breakfast-table',
      description: '碗、杯子、勺子摆到餐桌',
      kind: 'milestone',
      dependsOnGoalIds: ['g-encode-cereal-memory'],
      memoryType: 'procedural',
      relatedObjectIds: [BOWL, CUP, SPOON],
      predicate: (_entities, _snapshot, ctx) => !!ctx && tableIsSet(ctx),
      achievedMessage: '✓ 餐具已经摆好',
    },
    {
      id: 'g-detect-stale-memory',
      description: '回到下层橱柜，发现旧记忆已过期',
      kind: 'milestone',
      dependsOnGoalIds: ['g-set-breakfast-table'],
      memoryType: 'temporal',
      relatedObjectIds: [CEREAL],
      predicate: (_entities, _snapshot, ctx) => !!ctx?.triggeredEvents.has('se-conflict-detected'),
      achievedMessage: '✓ 发现现实与旧记忆冲突',
    },
    {
      id: 'g-update-cereal-memory',
      description: '找到麦片并按 E 更新位置记忆',
      kind: 'milestone',
      dependsOnGoalIds: ['g-detect-stale-memory'],
      memoryType: 'spatial',
      relatedObjectIds: [CEREAL],
      predicate: (_entities, _snapshot, ctx) => !!ctx && hasFreshCerealMemory(ctx) && ctx.memoryUpdateCount >= 1,
      achievedMessage: '✓ 记忆已更新：麦片的新位置已保存',
    },
    {
      id: 'g-serve-cereal',
      description: '麦片放到早餐餐桌',
      kind: 'terminal-constraint',
      dependsOnGoalIds: ['g-update-cereal-memory'],
      memoryType: 'spatial',
      relatedObjectIds: [CEREAL],
      predicate: (entities) => entityPlacedIn(entities, CEREAL, DINING_TABLE),
      achievedMessage: '✓ 麦片已经上桌',
    },
    {
      id: 'g-clean-breakfast-dishes',
      description: '碗和杯子放进水槽，勺子留在餐桌',
      kind: 'terminal-constraint',
      dependsOnGoalIds: ['g-serve-cereal'],
      memoryType: 'procedural',
      relatedObjectIds: [BOWL, CUP, SPOON],
      predicate: (_entities, _snapshot, ctx) => !!ctx && cleanupFinished(ctx),
      achievedMessage: '✓ 早餐收尾完成',
    },
  ],

  scriptedEvents: [
    {
      id: 'se-encode-cereal',
      trigger: 1,
      type: 'message',
      message: '📦 先打开下层橱柜，靠近麦片按 E。只有保存过旧位置，之后才谈得上“更新记忆”。',
      description: '提示玩家形成麦片的初始位置记忆',
      memoryType: 'object',
      toastType: 'info',
      highlightDemo: { targetContainerId: LOWER_CABINET, color: '#f59e0b', durationMs: 2200 },
    },
    {
      id: 'se-cereal-moved',
      trigger: (_step, _entities, _room, _rooms, ctx) => !!ctx && ctx.currentStageId === STAGE_STALE,
      type: 'move-entity',
      targetId: CEREAL,
      targetPosition: UPPER_WORLD,
      targetContainerId: UPPER_CABINET,
      markMemoryOutdated: CEREAL,
      message: '🐱 身后传来一声轻响。你关于麦片的记忆变红了——它可能已经不再可靠。',
      description: '麦片从下层橱柜被移动到邻近的较高橱柜，旧记忆过期',
      memoryType: 'temporal',
      toastType: 'warning',
      eventEffect: 'cat-prints',
    },
    {
      id: 'se-conflict-detected',
      trigger: (_step, _entities, _room, _rooms, ctx) => !!ctx
        && ctx.currentStageId === STAGE_STALE
        && hasStaleCerealMemory(ctx)
        && cerealMovedToUpper(ctx)
        && nearLocal(ctx, { x: -1.0, z: -1.9 }),
      type: 'message',
      message: '⚠️ 下层橱柜空了。你没有记错——是这个记忆已经过期。重新观察附近，但系统不会直接告诉你新位置。',
      description: '玩家回到旧位置并发现记忆与现实冲突',
      memoryType: 'temporal',
      toastType: 'warning',
    },
    {
      id: 'se-memory-updated',
      trigger: (_step, _entities, _room, _rooms, ctx) => !!ctx
        && ctx.currentStageId === STAGE_UPDATE
        && hasFreshCerealMemory(ctx)
        && ctx.memoryUpdateCount >= 1,
      type: 'message',
      message: '✓ 记忆已更新：麦片的新位置已写入。现在可以相信这条新记忆并完成早餐。',
      description: '玩家重新观察并主动更新麦片记忆',
      memoryType: 'spatial',
      toastType: 'success',
    },
  ],

  probes: [
    {
      id: 'p-cereal-old-location',
      type: 'location',
      question: '麦片最初在哪里？',
      options: ['下层橱柜', '较高的橱柜', '冰箱', '餐桌'],
      correctAnswer: '下层橱柜',
      dependsOnMemoryType: 'object',
      difficulty: 'easy',
      relatedObjectIds: [CEREAL],
    },
    {
      id: 'p-cereal-new-location',
      type: 'location',
      question: '环境变化后，你在哪里重新找到了麦片？',
      options: ['下层橱柜', '较高的橱柜', '水槽', '地面'],
      correctAnswer: '较高的橱柜',
      dependsOnMemoryType: 'spatial',
      difficulty: 'easy',
      relatedObjectIds: [CEREAL],
      relatedEventIds: ['se-cereal-moved'],
    },
    {
      id: 'p-stale-response',
      type: 'sequence',
      question: '发现记忆与现实冲突时，正确做法是什么？',
      options: ['坚持旧记忆', '重新观察并更新记忆', '直接看小地图答案', '跳过任务'],
      correctAnswer: '重新观察并更新记忆',
      dependsOnMemoryType: 'temporal',
      difficulty: 'medium',
    },
  ],
}
