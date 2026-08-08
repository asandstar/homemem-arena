// 关卡 2：稳定空间记忆（RECALL）
// 能力阶梯：L1 保存 1 条简单记忆 → L2 为 3 件跨房间物品分别编码并回忆 → L3 更新过期记忆。

import type { EntityStateSnapshot, StageContext, TaskConfig } from '../../types/task'
import type { RoomId } from '../../types/room'

type RoomMap = Record<string, { id: RoomId; name?: string; center?: { x: number; z?: number; y?: number } }>

const COFFEE_TABLE = 'cnt-coffee-table'
const RECALL_OBJECT_IDS = ['obj-books', 'obj-mug', 'obj-radio'] as const
const STAGE_ENCODE_MAP = 'stage-encode-stable-map'
const STAGE_RECALL_ITEMS = 'stage-recall-stable-map'

function entityPlacedIn(entities: EntityStateSnapshot[], configId: string, containerId: string): boolean {
  const entity = entities.find((candidate) => candidate.configId === configId)
  return entity?.status === 'placed' && entity.placedIn === containerId
}

function encodedObjectIds(ctx: StageContext): Set<string> {
  return new Set(ctx.memorySlots
    .filter((slot) => !!slot && !slot.outdated)
    .map((slot) => slot!.entityConfigId))
}

function hasStableSpatialMap(ctx: StageContext): boolean {
  const encoded = encodedObjectIds(ctx)
  return RECALL_OBJECT_IDS.every((id) => encoded.has(id))
}

function allRecallItemsReturned(ctx: StageContext): boolean {
  return RECALL_OBJECT_IDS.every((id) => entityPlacedIn(ctx.entities, id, COFFEE_TABLE))
}

function foundCount(entities: EntityStateSnapshot[]): number {
  return entities.filter((entity) => (RECALL_OBJECT_IDS as readonly string[]).includes(entity.configId)
    && (entity.status === 'held' || entity.status === 'placed')).length
}

export const leaveHomeTask: TaskConfig = {
  id: 'task-leave-home',
  name: '钥匙猫的稳定记忆考验',
  description: '🐱 先巡查客厅、卧室和玄关，分别按 E 记住书、马克杯和收音机的位置；三条记忆建立后，再依靠稳定记忆把它们带回客厅茶几。猫会制造假动静，但不会移动物品。',
  memoryTypes: ['object', 'spatial'],
  difficulty: 'medium',
  rooms: ['living', 'bedroom', 'entrance'],
  iconKey: 'door',
  tags: ['稳定记忆', '空间回忆', '跨房间', '钥匙猫'],
  timeLimit: 240,
  spawnPosition: { x: 2.7, z: -2.2 },
  spawnRotation: (-3 * Math.PI) / 4,
  initialStageId: STAGE_ENCODE_MAP,

  stages: [
    {
      id: STAGE_ENCODE_MAP,
      playerObjective: '【建立空间地图】巡查三个房间，靠近书、马克杯和收音机分别按 E；三个记忆槽都记录后才能拾取。',
      entryCondition: () => true,
      completionCondition: hasStableSpatialMap,
      nextStage: STAGE_RECALL_ITEMS,
    },
    {
      id: STAGE_RECALL_ITEMS,
      playerObjective: '【稳定记忆回忆】根据三条位置记忆找回物品，全部放到客厅茶几。猫的声音只是干扰，物品不会移动。',
      entryCondition: hasStableSpatialMap,
      completionCondition: allRecallItemsReturned,
      nextStage: null,
    },
  ],

  briefing: `🐱 记忆宅邸 · 第二关（RECALL：稳定空间记忆）

钥匙猫把三件日常物品分散到了不同房间，但这次环境是稳定的：

  📖 书在客厅
  ☕ 马克杯在卧室
  📻 收音机在玄关

第一阶段不是搬运，而是建立空间记忆：
  ① 依次找到三件物品
  ② 靠近每件物品按 E，填满三个记忆槽
  ③ 三条记忆建立后，再按 F 拾取
  ④ 把三件物品全部带回客厅茶几

⚠️ 钥匙猫会制造声音和脚印干扰，但不会改变现实。看到假动静时，学会相信仍然有效的记忆。`,

  completionText: '✅ 三件物品全部回到客厅茶几！\nMEM-07：「稳定环境中的空间回忆完成。下一关更难：现实会真的发生变化，正确的旧记忆也可能过期。」',
  failureText: '⏰ 时间到了。先走一遍三个房间并按 E 建立三条位置记忆，再按记忆规划取回路线，会比反复乱找更快。',
  systemPrompt: '【MEM-07 日志】L2 RECALL：3 件物品、3 个房间、3 个记忆槽。必须先分别按 E 编码全部位置，才能进入取回阶段。环境稳定，猫只制造假干扰，不移动物品。',

  objects: [
    {
      id: 'obj-books',
      name: '书',
      category: 'book',
      initialRoom: 'living',
      initialPosition: { x: -1.5, y: 0.45, z: 0.8 },
      size: { x: 0.22, y: 0.08, z: 0.16 },
      color: '#3b82f6',
      modelAssetId: 'furniture/books',
    },
    {
      id: 'obj-mug',
      name: '马克杯',
      category: 'cup',
      initialRoom: 'bedroom',
      initialPosition: { x: 1.35, y: 0.605, z: -2.0 },
      size: { x: 0.14, y: 0.12, z: 0.14 },
      color: '#dc2626',
      modelAssetId: 'food/mug',
    },
    {
      id: 'obj-radio',
      name: '收音机',
      category: 'remote',
      initialRoom: 'entrance',
      initialPosition: { x: 0.5, y: 0.615, z: -1.8 },
      size: { x: 0.567, y: 0.411, z: 0.176 },
      color: '#1f2937',
      modelAssetId: 'furniture/radio',
    },
  ],

  containers: [
    {
      id: COFFEE_TABLE,
      name: '客厅茶几',
      room: 'living',
      position: { x: -1.5, y: 0.2, z: -0.5 },
      size: { x: 1.4, y: 0.45, z: 0.7 },
      surfaceHeight: 0.45,
      color: '#8b5a2b',
      initialOpen: true,
      acceptedCategories: [],
      acceptAny: true,
      isTargetZone: true,
      targetLabel: '客厅茶几（三件物品都放这里）',
      modelAssetId: 'furniture/tableCoffee',
    },
  ],

  goals: [
    {
      id: 'g-encode-stable-map',
      description: '按 E 记住书、马克杯和收音机的位置',
      kind: 'milestone',
      memoryType: 'spatial',
      relatedObjectIds: [...RECALL_OBJECT_IDS],
      predicate: (_entities, _snapshot, ctx) => !!ctx && hasStableSpatialMap(ctx),
      achievedMessage: '✓ 三个房间的位置记忆已经建立',
    },
    {
      id: 'g-books-table',
      description: '根据记忆把书带回客厅茶几',
      dependsOnGoalIds: ['g-encode-stable-map'],
      memoryType: 'spatial',
      relatedObjectIds: ['obj-books'],
      predicate: (entities) => entityPlacedIn(entities, 'obj-books', COFFEE_TABLE),
      achievedMessage: '✓ 书已带回茶几',
    },
    {
      id: 'g-mug-table',
      description: '根据记忆把马克杯带回客厅茶几',
      dependsOnGoalIds: ['g-encode-stable-map'],
      memoryType: 'spatial',
      relatedObjectIds: ['obj-mug'],
      predicate: (entities) => entityPlacedIn(entities, 'obj-mug', COFFEE_TABLE),
      achievedMessage: '✓ 马克杯已带回茶几',
    },
    {
      id: 'g-radio-table',
      description: '根据记忆把收音机带回客厅茶几',
      dependsOnGoalIds: ['g-encode-stable-map'],
      memoryType: 'spatial',
      relatedObjectIds: ['obj-radio'],
      predicate: (entities) => entityPlacedIn(entities, 'obj-radio', COFFEE_TABLE),
      achievedMessage: '✓ 收音机已带回茶几',
    },
  ],

  scriptedEvents: [
    {
      id: 'se-welcome',
      trigger: 1,
      type: 'message',
      message: '🧠 这一关要建立三条稳定记忆：每找到一件物品，都先按 E，再去下一个房间。',
      description: '提示三物品编码阶段',
      memoryType: 'spatial',
      toastType: 'info',
    },
    {
      id: 'se-map-ready',
      trigger: (_step, _entities, _room, _rooms, ctx) => !!ctx
        && ctx.currentStageId === STAGE_RECALL_ITEMS
        && !ctx.triggeredEvents.has('se-map-ready'),
      type: 'message',
      message: '✓ 三条记忆已建立。现在按记忆取回物品，全部送到客厅茶几。',
      description: '空间地图编码完成',
      memoryType: 'spatial',
      toastType: 'success',
    },
    {
      id: 'se-found-first',
      trigger: (
        _step: number,
        entities: EntityStateSnapshot[],
        _currentRoom: RoomId,
        _rooms: RoomMap | undefined,
        ctx: StageContext | undefined,
      ) => !ctx?.triggeredEvents.has('se-found-first') && foundCount(entities) >= 1,
      type: 'message',
      message: '✨ 第一件取回成功。剩下两件的位置仍然没有变化，继续相信你的记忆。',
      description: '第一件取回后的强化反馈',
      memoryType: 'spatial',
      toastType: 'success',
    },
    {
      id: 'se-cat-second-prank',
      trigger: (
        step: number,
        entities: EntityStateSnapshot[],
        _currentRoom: RoomId,
        _rooms: RoomMap | undefined,
        ctx: StageContext | undefined,
      ) => step >= 8
        && !ctx?.triggeredEvents.has('se-cat-second-prank')
        && foundCount(entities) >= 1,
      type: 'message',
      message: '🐱 走廊传来奔跑声，地上多了几枚猫脚印……但记忆没有变红，物品位置仍然可信。',
      description: '不改变世界状态的假干扰，训练玩家判断记忆仍有效',
      memoryType: 'spatial',
      eventEffect: 'cat-prints',
      toastType: 'cat',
    },
    {
      id: 'se-time-warning',
      trigger: (
        _step: number,
        _entities: EntityStateSnapshot[],
        _currentRoom: RoomId,
        _rooms: RoomMap | undefined,
        ctx: StageContext | undefined,
      ) => !!ctx && ctx.elapsedMs >= 180000 && !ctx.triggeredEvents.has('se-time-warning'),
      type: 'message',
      message: '⏰ 还剩不到一分钟。查看记忆槽，确认剩余物品所在房间。',
      description: '剩余时间提示',
      memoryType: 'spatial',
      toastType: 'warning',
    },
  ],

  probes: [
    {
      id: 'p-books-room',
      type: 'location',
      question: '书最初位于哪个房间？',
      options: ['客厅', '卧室', '玄关', '餐厨'],
      correctAnswer: '客厅',
      dependsOnMemoryType: 'spatial',
      difficulty: 'easy',
      relatedObjectIds: ['obj-books'],
    },
    {
      id: 'p-mug-room',
      type: 'location',
      question: '马克杯最初位于哪个房间？',
      options: ['卧室', '客厅', '玄关', '餐厨'],
      correctAnswer: '卧室',
      dependsOnMemoryType: 'spatial',
      difficulty: 'easy',
      relatedObjectIds: ['obj-mug'],
    },
    {
      id: 'p-radio-room',
      type: 'location',
      question: '收音机最初位于哪个房间？',
      options: ['玄关', '卧室', '客厅', '餐厨'],
      correctAnswer: '玄关',
      dependsOnMemoryType: 'spatial',
      difficulty: 'easy',
      relatedObjectIds: ['obj-radio'],
    },
    {
      id: 'p-cat-distractor',
      type: 'state',
      question: '钥匙猫制造假动静后，物品位置发生变化了吗？',
      options: ['没有，记忆仍然有效', '三件都移动了', '只有书移动了', '只有收音机移动了'],
      correctAnswer: '没有，记忆仍然有效',
      dependsOnMemoryType: 'spatial',
      difficulty: 'medium',
      relatedEventIds: ['se-cat-second-prank'],
    },
  ],
}
