// 关卡 1：三件餐具入门（基础操作 + 第一次位置记忆）
// 能力阶梯：先学会按 E 保存 1 条简单记忆，再练习移动、拾取和归位。

import type { EntityStateSnapshot, StageContext, TaskConfig } from '../../types/task'
import type { RoomId } from '../../types/room'

type RoomMap = Record<string, { id: RoomId; name?: string; center?: { x: number; z?: number; y?: number } }>

const TABLE = 'cnt-dining-table'
const SINK = 'cnt-sink'
const CABINET = 'cnt-cabinet'
const TUTORIAL_OBJECT_IDS = ['obj-mug-1', 'obj-plate-1', 'obj-fork-1'] as const
const STAGE_LEARN_MEMORY = 'stage-learn-first-memory'
const STAGE_PUT_AWAY = 'stage-put-away-three-items'

function entityPlacedIn(entities: EntityStateSnapshot[], configId: string, containerId: string): boolean {
  const entity = entities.find((candidate) => candidate.configId === configId)
  return entity?.status === 'placed' && entity.placedIn === containerId
}

function hasTutorialMemory(ctx: StageContext): boolean {
  return ctx.memorySlots.some((slot) => !!slot
    && !slot.outdated
    && (TUTORIAL_OBJECT_IDS as readonly string[]).includes(slot.entityConfigId))
}

function allThreePlaced(ctx: StageContext): boolean {
  return entityPlacedIn(ctx.entities, 'obj-mug-1', SINK)
    && entityPlacedIn(ctx.entities, 'obj-plate-1', CABINET)
    && entityPlacedIn(ctx.entities, 'obj-fork-1', CABINET)
}

export const cleanTableTask: TaskConfig = {
  id: 'task-clean-table',
  name: '餐桌整理入门',
  description: '🍽️ 用 3 件餐具学习核心操作：先靠近任意餐具按 E 保存一条位置记忆，再用 F 拾取并归位。马克杯→水槽，盘子和叉子→橱柜。',
  memoryTypes: ['object', 'procedural'],
  difficulty: 'tutorial',
  rooms: ['dining'],
  iconKey: 'dish',
  tags: ['新手入门', '第一次记忆', '基础交互'],
  spawnPosition: { x: -1.5, z: -1.5 },
  spawnRotation: (3 * Math.PI) / 4,
  initialStageId: STAGE_LEARN_MEMORY,

  stages: [
    {
      id: STAGE_LEARN_MEMORY,
      playerObjective: '【学习记忆】靠近任意一件餐具，按 E 保存它的位置记忆。保存成功后才能开始拾取。',
      entryCondition: () => true,
      completionCondition: hasTutorialMemory,
      nextStage: STAGE_PUT_AWAY,
    },
    {
      id: STAGE_PUT_AWAY,
      playerObjective: '【练习操作】按 F 拾取餐具并放到发光目标区：马克杯→水槽，盘子和叉子→橱柜。',
      entryCondition: hasTutorialMemory,
      completionCondition: allThreePlaced,
      nextStage: null,
    },
  ],

  briefing: `🍽️ 记忆宅邸 · 第一关（基础操作 + 第一次记忆）

MEM-07 的记忆模块刚刚启动。先用三件餐具完成一次最简单的校准：

  ① 靠近任意餐具，按 E 保存一条位置记忆
  ② 按 F 拾取和放置物品
  ③ 马克杯放进水槽
  ④ 盘子和叉子放进橱柜

本关没有时间限制，也没有干扰。先学会“观察并记住”，再慢慢完成操作。`,

  completionText: '🎉 三件餐具全部归位！\nMEM-07：「基础操作和第一条位置记忆都掌握了。下一关，物品会分散在不同房间，你需要建立一张真正的空间记忆地图。」',
  failureText: '这只是练习，不用着急。先靠近餐具按 E，再按 F 拾取；马克杯→水槽，盘子和叉子→橱柜。',
  systemPrompt: '【MEM-07 日志】L1 教程：3 件可见餐具、单房间、无时限。必须先对任意餐具按 E 保存 1 条位置记忆，之后完成基础拾取与归位。',

  objects: [
    {
      id: 'obj-mug-1',
      name: '马克杯',
      category: 'cup',
      initialRoom: 'dining',
      initialPosition: { x: -0.5, y: 0, z: 0.2 },
      surfaceContainerId: TABLE,
      size: { x: 0.151, y: 0.12, z: 0.125 },
      color: '#d1d5db',
      modelAssetId: 'food/mug',
    },
    {
      id: 'obj-plate-1',
      name: '盘子',
      category: 'plate',
      initialRoom: 'dining',
      initialPosition: { x: 0.15, y: 0, z: 0.1 },
      surfaceContainerId: TABLE,
      size: { x: 0.22, y: 0.022, z: 0.22 },
      color: '#f3f4f6',
      modelAssetId: 'food/plate',
    },
    {
      id: 'obj-fork-1',
      name: '叉子',
      category: 'fork',
      initialRoom: 'dining',
      initialPosition: { x: 0.65, y: 0, z: -0.1 },
      surfaceContainerId: TABLE,
      size: { x: 0.2, y: 0.007, z: 0.033 },
      color: '#b8c0c4',
      modelAssetId: 'food/utensil-fork',
    },
  ],

  containers: [
    {
      id: TABLE,
      name: '餐桌',
      room: 'dining',
      position: { x: 0, y: 0, z: 0 },
      size: { x: 1.683, y: 0.653, z: 0.895 },
      surfaceHeight: 0.653,
      color: '#92400e',
      initialOpen: true,
      openable: false,
      acceptedCategories: [],
      acceptAny: false,
      modelAssetId: 'furniture/table',
    },
    {
      id: SINK,
      name: '厨房水槽',
      room: 'dining',
      position: { x: 0, y: 0, z: -2.15 },
      size: { x: 0.538, y: 0.613, z: 0.2 },
      surfaceHeight: 0.613,
      color: '#a3a3a3',
      initialOpen: true,
      openable: false,
      acceptedCategories: ['cup'],
      isTargetZone: true,
      targetLabel: '水槽（马克杯放这里）',
      visualOwner: 'room',
      collisionMode: 'static-furniture',
    },
    {
      id: CABINET,
      name: '橱柜',
      room: 'dining',
      position: { x: -0.6, y: 0, z: -2.15 },
      size: { x: 0.538, y: 0.563, z: 0.2 },
      surfaceHeight: 0.563,
      color: '#92400e',
      initialOpen: true,
      acceptedCategories: ['plate', 'fork'],
      isTargetZone: true,
      targetLabel: '橱柜（盘子、叉子放这里）',
      visualOwner: 'room',
      collisionMode: 'static-furniture',
    },
  ],

  goals: [
    {
      id: 'g-save-first-memory',
      description: '按 E 保存第一条餐具位置记忆',
      kind: 'milestone',
      memoryType: 'object',
      relatedObjectIds: [...TUTORIAL_OBJECT_IDS],
      predicate: (_entities, _snapshot, ctx) => !!ctx && hasTutorialMemory(ctx),
      achievedMessage: '✓ 第一条位置记忆已保存',
    },
    {
      id: 'g-mug-1-sink',
      description: '马克杯放入水槽',
      dependsOnGoalIds: ['g-save-first-memory'],
      memoryType: 'procedural',
      relatedObjectIds: ['obj-mug-1'],
      predicate: (entities) => entityPlacedIn(entities, 'obj-mug-1', SINK),
      achievedMessage: '✓ 马克杯已放入水槽',
    },
    {
      id: 'g-plate-1-cabinet',
      description: '盘子放入橱柜',
      dependsOnGoalIds: ['g-save-first-memory'],
      memoryType: 'procedural',
      relatedObjectIds: ['obj-plate-1'],
      predicate: (entities) => entityPlacedIn(entities, 'obj-plate-1', CABINET),
      achievedMessage: '✓ 盘子已放入橱柜',
    },
    {
      id: 'g-fork-1-cabinet',
      description: '叉子放入橱柜',
      dependsOnGoalIds: ['g-save-first-memory'],
      memoryType: 'procedural',
      relatedObjectIds: ['obj-fork-1'],
      predicate: (entities) => entityPlacedIn(entities, 'obj-fork-1', CABINET),
      achievedMessage: '✓ 叉子已放入橱柜',
    },
  ],

  scriptedEvents: [
    {
      id: 'se-welcome',
      trigger: 1,
      type: 'message',
      message: '🧠 先靠近任意餐具按 E。紫色记忆槽出现记录后，再用 F 拾取。',
      description: '引导玩家完成第一次位置记忆',
      memoryType: 'object',
      toastType: 'info',
    },
    {
      id: 'se-demo-sink',
      trigger: 2,
      type: 'message',
      message: '💡 马克杯放进水槽；拿着物品靠近发光区域按 F。',
      description: '高亮水槽目标',
      memoryType: 'procedural',
      toastType: 'info',
      highlightDemo: { targetContainerId: SINK, color: '#60a5fa', durationMs: 1800 },
    },
    {
      id: 'se-demo-cabinet',
      trigger: 4,
      type: 'message',
      message: '💡 盘子和叉子都放进橱柜。',
      description: '高亮橱柜目标',
      memoryType: 'procedural',
      toastType: 'info',
      highlightDemo: { targetContainerId: CABINET, color: '#f59e0b', durationMs: 1800 },
    },
    {
      id: 'se-place-hint',
      trigger: (
        _step: number,
        _entities: EntityStateSnapshot[],
        _currentRoom: RoomId,
        _rooms: RoomMap | undefined,
        ctx: StageContext | undefined,
      ) => !!ctx?.heldEntityConfigId && !ctx.triggeredEvents.has('se-place-hint'),
      type: 'message',
      message: '📦 拿着物品走到发光目标区，再按 F 放下。',
      description: '第一次拾取后的放置提示',
      memoryType: 'procedural',
      toastType: 'info',
    },
    {
      id: 'se-almost-done',
      trigger: (
        _step: number,
        entities: EntityStateSnapshot[],
        _currentRoom: RoomId,
        _rooms: RoomMap | undefined,
        ctx: StageContext | undefined,
      ) => !ctx?.triggeredEvents.has('se-almost-done')
        && entities.filter((entity) => entity.status === 'placed').length >= 2,
      type: 'message',
      message: '🌟 已经完成两件，只剩最后一件！',
      description: '完成两件后的鼓励',
      memoryType: 'procedural',
      toastType: 'success',
    },
  ],

  probes: [
    {
      id: 'p-memory-key',
      type: 'state',
      question: '想保存眼前物品的位置记忆，应该按哪个键？',
      options: ['E', 'F', 'V', 'Tab'],
      correctAnswer: 'E',
      dependsOnMemoryType: 'object',
      difficulty: 'easy',
    },
    {
      id: 'p-cup-destination',
      type: 'location',
      question: '马克杯应该归位到哪里？',
      options: ['水槽', '橱柜', '餐桌', '地面'],
      correctAnswer: '水槽',
      dependsOnMemoryType: 'procedural',
      difficulty: 'easy',
    },
    {
      id: 'p-plate-fork-destination',
      type: 'location',
      question: '盘子和叉子应该归位到哪里？',
      options: ['橱柜', '水槽', '餐桌', '冰箱'],
      correctAnswer: '橱柜',
      dependsOnMemoryType: 'procedural',
      difficulty: 'easy',
    },
  ],
}
