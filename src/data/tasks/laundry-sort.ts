// 关卡 3：洗衣分拣（Integrated Memory 整合记忆）
// 目标：六件衣物三类分拣——浅色 → 白篮 / 深色 → 蓝篮 / 毛巾 → 橙篮
// 记忆类型：物体记忆 + 空间记忆（规则编码 → 位置交换干扰 → 分类 → Probe）
// EXECUTION OVERRIDES：本轮启用篮子交换干扰

import type { EntityStateSnapshot, StageContext, TaskConfig } from '../../types/task'
import { sharedRooms } from '../rooms'
import type { RoomId } from '../../types/room'

const LAUNDRY_ROOM_ID: RoomId = 'laundry'

const STAGE_RULES = 'stage-rules-encoding'
const STAGE_SWAP = 'stage-baskets-swapped'
const STAGE_SORT = 'stage-sort-six-items'

const WHITE_IDS = ['obj-white-1', 'obj-white-2'] as const
const DARK_IDS = ['obj-dark-1', 'obj-dark-2'] as const
const TOWEL_IDS = ['obj-towel-1', 'obj-towel-2'] as const

const WHITE_BASKET = 'cnt-white-basket'
const DARK_BASKET = 'cnt-dark-basket'
const TOWEL_BASKET = 'cnt-towel-basket'

function entityPlacedIn(entities: EntityStateSnapshot[], configId: string, containerId: string): boolean {
  const e = entities.find((x) => x.configId === configId)
  return !!e && e.placedIn === containerId && e.status === 'placed'
}

function whiteAllPlaced(ctx: StageContext): boolean {
  return WHITE_IDS.every((id) => entityPlacedIn(ctx.entities, id, WHITE_BASKET))
}
function darkAllPlaced(ctx: StageContext): boolean {
  return DARK_IDS.every((id) => entityPlacedIn(ctx.entities, id, DARK_BASKET))
}
function towelAllPlaced(ctx: StageContext): boolean {
  return TOWEL_IDS.every((id) => entityPlacedIn(ctx.entities, id, TOWEL_BASKET))
}

function anyItemPlaced(ctx: StageContext): boolean {
  const all = [...WHITE_IDS, ...DARK_IDS, ...TOWEL_IDS]
  const bucketOf: Record<string, string> = {
    'obj-white-1': WHITE_BASKET,
    'obj-white-2': WHITE_BASKET,
    'obj-dark-1': DARK_BASKET,
    'obj-dark-2': DARK_BASKET,
    'obj-towel-1': TOWEL_BASKET,
    'obj-towel-2': TOWEL_BASKET,
  }
  return all.some((id) => entityPlacedIn(ctx.entities, id, bucketOf[id]))
}

/**
 * 转换玩家世界坐标 → laundry room 本地坐标。
 * 所有容器 position / spawnPosition 都是房间本地坐标，
 * 但 StageContext.playerPosition 给的是世界坐标，统一转到本地后再判定距离/区域。
 */
function toLaundryLocal(world: { x?: number; y?: number; z?: number } | undefined | null): { x: number; y: number; z: number } {
  const base = sharedRooms[LAUNDRY_ROOM_ID]?.center ?? { x: 0, y: 0, z: 0 }
  return {
    x: (world?.x ?? 0) - (base.x ?? 0),
    y: (world?.y ?? 0) - (base.y ?? 0),
    z: (world?.z ?? 0) - (base.z ?? 0),
  }
}

/** 是否离开后墙编码区（laundry 房间本地坐标）：spawn (0,1.5)；后墙篮子在 z≈-1.3；本地 z>=-0.2 就算已经走到靠门口一侧。 */
function leftBackEncodingZone(ctx: StageContext): boolean {
  const local = toLaundryLocal(ctx.playerPosition ?? null)
  return local.z >= -0.2
}

/** 与任一个目标篮距离 <=1.6m（本地坐标）；优先读取 ctx.containerOverrides 记录的运行时位置（也是本地） */
function nearAnyTargetBasket(ctx: StageContext): boolean {
  if (!ctx.playerPosition) return false
  const local = toLaundryLocal(ctx.playerPosition)
  const positions = [
    { x: -1.1, z: -1.3 }, // 白篮原始
    { x: 0, z: -1.3 }, // 深篮原始
    { x: 1.1, z: -1.3 }, // 毛巾篮原始
  ] as const
  const ids = [WHITE_BASKET, DARK_BASKET, TOWEL_BASKET] as const
  for (let i = 0; i < 3; i++) {
    const id = ids[i]
    const override = ctx.containerOverrides?.[id]?.position
    const p = override ?? positions[i]
    const dx = local.x - p.x
    const dz = local.z - p.z
    if (Math.sqrt(dx * dx + dz * dz) <= 1.6) return true
  }
  return false
}

export const laundrySortTask: TaskConfig = {
  id: 'task-laundry-sort',
  name: '洗衣分拣',
  description: '🧺 整合记忆挑战：六件衣物、三类分拣。先观察三个篮子的规则（浅色→白篮，深色→蓝篮，毛巾→橙篮）。⚠️ 注意：分类前去做别的事（靠近门口等待），篮子会被移动！请记住最初篮子的身份，而不是只记当前位置。错误类别会被篮子拒绝！',
  memoryTypes: ['object', 'spatial'],
  difficulty: 'medium',
  rooms: ['laundry'],
  iconKey: 'shirt',
  tags: ['整合记忆', '分类', '位置交换干扰'],
  timeLimit: 300,
  spawnPosition: { x: 0, z: 1.5 },
  spawnRotation: Math.PI,
  initialStageId: STAGE_RULES,

  stages: [
    {
      id: STAGE_RULES,
      playerObjective: '📋 规则编码：靠近后墙三个篮子，按 E 记住它们的身份（白/蓝/橙）。完成后，走到门口（z>=0）让时间推进，触发洗衣篮位置交换。',
      entryCondition: () => true,
      completionCondition: (ctx: StageContext) =>
        (ctx.memorySlots.some((s) => s !== null) || anyItemPlaced(ctx)) && leftBackEncodingZone(ctx),
      nextStage: STAGE_SWAP,
    },
    {
      id: STAGE_SWAP,
      playerObjective: '😲 篮子被挪动了！回到后墙看看现在哪个篮子在哪，重新确认规则对应的篮子位置。',
      entryCondition: (ctx: StageContext) =>
        (ctx.memorySlots.some((s) => s !== null) || anyItemPlaced(ctx)) && leftBackEncodingZone(ctx),
      completionCondition: nearAnyTargetBasket,
      nextStage: STAGE_SORT,
    },
    {
      id: STAGE_SORT,
      playerObjective: '把六件衣物分类到对应的篮子。记住：白篮=浅色衣物，蓝篮=深色衣物，橙篮=毛巾。',
      entryCondition: nearAnyTargetBasket,
      completionCondition: (ctx: StageContext) =>
        whiteAllPlaced(ctx) && darkAllPlaced(ctx) && towelAllPlaced(ctx),
      nextStage: null,
    },
  ],

  briefing: `🧺 洗衣房 · 整合记忆分拣

主人的便签：「这批衣服分三类，浅色 / 深色 / 毛巾——放错会染色，拜托了小橡！」

三个篮子摆在洗衣房后墙：
  · 白篮 ← 浅色衣物（2 件）
  · 蓝篮 ← 深色衣物（2 件）
  · 橙篮 ← 毛巾（2 条）

💡 提示：
  · 先观察篮子颜色与对应类别，按 E 保存规则记忆。
  · 把六件衣物逐一放进对应的篮子。
  · 错误类别放入篮子会被拒绝——观察篮子颜色与衣物颜色匹配！`,

  completionText: '六件衣物分拣完毕。主人回复：「完美！小橡比洗衣机还好用！」\n（篮子交换干扰本轮 DEFERRED——基础分类达成。）',
  failureText: '时间到了，衣物还是乱成一堆。主人：「算了，我送干洗店吧...」',
  systemPrompt: '【MEM-07 日志】任务：六件衣物三类分拣。策略：编码篮子规则→按颜色匹配归位。整合物体记忆与空间记忆，错误类别将被篮子拒绝。',

  objects: [
    {
      id: 'obj-white-1',
      name: '浅色衣物',
      category: 'white-clothes',
      initialRoom: 'laundry',
      initialPosition: { x: -1.2, y: 0.05, z: 1.0 },
      size: { x: 0.4, y: 0.05, z: 0.5 },
      color: '#f9fafb',
      modelAssetId: 'furniture/pillow',
    },
    {
      id: 'obj-white-2',
      name: '浅色衣物',
      category: 'white-clothes',
      initialRoom: 'laundry',
      initialPosition: { x: -1.2, y: 0.05, z: 1.4 },
      size: { x: 0.4, y: 0.05, z: 0.5 },
      color: '#f9fafb',
      modelAssetId: 'furniture/pillow',
    },
    {
      id: 'obj-dark-1',
      name: '深色衣物',
      category: 'dark-clothes',
      initialRoom: 'laundry',
      initialPosition: { x: 0, y: 0.05, z: 1.0 },
      size: { x: 0.4, y: 0.05, z: 0.5 },
      color: '#1e3a5f',
      modelAssetId: 'furniture/pillowBlue',
    },
    {
      id: 'obj-dark-2',
      name: '深色衣物',
      category: 'dark-clothes',
      initialRoom: 'laundry',
      initialPosition: { x: 0, y: 0.05, z: 1.4 },
      size: { x: 0.4, y: 0.05, z: 0.5 },
      color: '#1e3a5f',
      modelAssetId: 'furniture/pillowBlue',
    },
    {
      id: 'obj-towel-1',
      name: '毛巾',
      category: 'towel',
      initialRoom: 'laundry',
      initialPosition: { x: 1.2, y: 0.05, z: 1.0 },
      size: { x: 0.5, y: 0.05, z: 0.3 },
      color: '#d97706',
      modelAssetId: 'furniture/pillowLong',
    },
    {
      id: 'obj-towel-2',
      name: '毛巾',
      category: 'towel',
      initialRoom: 'laundry',
      initialPosition: { x: 1.2, y: 0.05, z: 1.4 },
      size: { x: 0.5, y: 0.05, z: 0.3 },
      color: '#d97706',
      modelAssetId: 'furniture/pillowLong',
    },
  ],

  // L3 三个篮子只由 task container 渲染（唯一视觉所有权）
  // 不配 modelAssetId —— 保持程序化篮子的高辨识度颜色编码
  containers: [
    {
      id: WHITE_BASKET,
      name: '白色衣物篮',
      room: 'laundry',
      position: { x: -1.1, y: 0.25, z: -1.3 },
      size: { x: 0.8, y: 0.5, z: 0.6 },
      surfaceHeight: 0.55,
      color: '#f9fafb',
      initialOpen: true,
      acceptedCategories: ['white-clothes'],
      isTargetZone: true,
      targetLabel: '白色衣物篮',
    },
    {
      id: DARK_BASKET,
      name: '深色衣物篮',
      room: 'laundry',
      position: { x: 0, y: 0.25, z: -1.3 },
      size: { x: 0.8, y: 0.5, z: 0.6 },
      surfaceHeight: 0.55,
      color: '#1e3a5f',
      initialOpen: true,
      acceptedCategories: ['dark-clothes'],
      isTargetZone: true,
      targetLabel: '深色衣物篮',
    },
    {
      id: TOWEL_BASKET,
      name: '毛巾篮',
      room: 'laundry',
      position: { x: 1.1, y: 0.25, z: -1.3 },
      size: { x: 0.8, y: 0.5, z: 0.6 },
      surfaceHeight: 0.55,
      color: '#d97706',
      initialOpen: true,
      acceptedCategories: ['towel'],
      isTargetZone: true,
      targetLabel: '毛巾篮',
    },
  ],

  goals: [
    {
      id: 'g-white-1-basket',
      description: '浅色衣物 #1 放入白色衣物篮',
      memoryType: 'object',
      relatedObjectIds: ['obj-white-1'],
      predicate: (entities: EntityStateSnapshot[]) => entityPlacedIn(entities, 'obj-white-1', WHITE_BASKET),
      achievedMessage: '浅色衣物 #1 归位',
    },
    {
      id: 'g-white-2-basket',
      description: '浅色衣物 #2 放入白色衣物篮',
      memoryType: 'object',
      relatedObjectIds: ['obj-white-2'],
      predicate: (entities: EntityStateSnapshot[]) => entityPlacedIn(entities, 'obj-white-2', WHITE_BASKET),
      achievedMessage: '浅色衣物 #2 归位',
    },
    {
      id: 'g-dark-1-basket',
      description: '深色衣物 #1 放入深色衣物篮',
      memoryType: 'object',
      relatedObjectIds: ['obj-dark-1'],
      predicate: (entities: EntityStateSnapshot[]) => entityPlacedIn(entities, 'obj-dark-1', DARK_BASKET),
      achievedMessage: '深色衣物 #1 归位',
    },
    {
      id: 'g-dark-2-basket',
      description: '深色衣物 #2 放入深色衣物篮',
      memoryType: 'object',
      relatedObjectIds: ['obj-dark-2'],
      predicate: (entities: EntityStateSnapshot[]) => entityPlacedIn(entities, 'obj-dark-2', DARK_BASKET),
      achievedMessage: '深色衣物 #2 归位',
    },
    {
      id: 'g-towel-1-basket',
      description: '毛巾 #1 放入毛巾篮',
      memoryType: 'object',
      relatedObjectIds: ['obj-towel-1'],
      predicate: (entities: EntityStateSnapshot[]) => entityPlacedIn(entities, 'obj-towel-1', TOWEL_BASKET),
      achievedMessage: '毛巾 #1 归位',
    },
    {
      id: 'g-towel-2-basket',
      description: '毛巾 #2 放入毛巾篮',
      memoryType: 'object',
      relatedObjectIds: ['obj-towel-2'],
      predicate: (entities: EntityStateSnapshot[]) => entityPlacedIn(entities, 'obj-towel-2', TOWEL_BASKET),
      achievedMessage: '毛巾 #2 归位',
    },
  ],

  scriptedEvents: [
    {
      id: 'se-rules-display',
      trigger: 1,
      type: 'message',
      message: '📋 篮子规则：浅色衣物 → 白篮 / 深色衣物 → 蓝篮 / 毛巾 → 橙篮。先按 E 保存规则，再开始分类！',
      description: '展示三个篮子的分类规则',
      memoryType: 'object',
      toastType: 'info' as const,
    },
    {
      id: 'se-sort-hint',
      trigger: (step, _entities, _room, _rooms, ctx) =>
        step >= 2 && !!ctx?.heldEntityConfigId,
      type: 'message',
      message: '💡 提示：把衣物放进与它颜色相同的篮子（白→白篮 / 蓝→蓝篮 / 橙→橙篮）。',
      description: '玩家手持物品时提示对应篮子颜色',
      memoryType: 'spatial',
      toastType: 'info' as const,
    },
    // ========== 容器位置交换干扰（白篮 ↔ 深蓝篮） ==========
    // 触发条件：进入 STAGE_SWAP（编码完成 + 玩家离开后墙 z>=-0.2）后的第 1 步（step 阈值）
    {
      id: 'se-baskets-swap',
      trigger: (_step, _entities, _room, _rooms, ctx) =>
        !!ctx && ctx.currentStageId === STAGE_SWAP,
      type: 'swap-containers',
      swapContainerIds: [WHITE_BASKET, DARK_BASKET],
      message: '🔀 咦？洗衣篮被挪动了！白篮和蓝篮的位置被交换了。小心不要只记"左中右"哦，要靠篮子本身的颜色判断身份！',
      description: '干扰：白篮与深蓝篮交换位置，制造"位置记忆 vs 身份记忆"冲突',
      memoryType: 'spatial',
      toastType: 'warning' as const,
      eventEffect: 'container-swap',
    },
  ],

  probes: [
    {
      id: 'p-sort-white',
      type: 'object-id',
      question: '浅色衣物应该放进哪个篮子？',
      options: ['白篮', '蓝篮', '橙篮'],
      correctAnswer: '白篮',
      dependsOnMemoryType: 'object',
      difficulty: 'easy',
    },
    {
      id: 'p-sort-dark',
      type: 'object-id',
      question: '深色衣物应该放进哪个篮子？',
      options: ['白篮', '蓝篮', '橙篮'],
      correctAnswer: '蓝篮',
      dependsOnMemoryType: 'object',
      difficulty: 'easy',
    },
    {
      id: 'p-sort-towel',
      type: 'object-id',
      question: '毛巾应该放进哪个篮子？',
      options: ['白篮', '蓝篮', '橙篮'],
      correctAnswer: '橙篮',
      dependsOnMemoryType: 'object',
      difficulty: 'easy',
    },
    {
      id: 'p-count-items',
      type: 'count',
      question: '一共有几件衣物需要分类？',
      options: ['3', '4', '5', '6'],
      correctAnswer: '6',
      dependsOnMemoryType: 'object',
      difficulty: 'easy',
    },
  ],
}
