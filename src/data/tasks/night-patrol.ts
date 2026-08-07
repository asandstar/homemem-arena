// 关卡 4：深夜巡逻
// 目标：在黑暗中巡逻所有房间，找到被夜间异动打乱的物品并确认归位
// 记忆类型：空间记忆 + 时间记忆
// 特色：视野受限（黑暗）、巡逻全部房间、随机夜间事件（电器异响、窗户晃动）

import type { EntityStateSnapshot, StageContext, TaskConfig } from '../../types/task'

const STAGE_ID_PATROL_FIRST_TWO = 'stage-patrol-first-two'
const STAGE_ID_UPDATE_UMBRELLA_AFTER_WIND = 'stage-update-umbrella-after-wind'
const STAGE_ID_FINALIZE_PATROL = 'stage-finalize-patrol'

function entityPlacedIn(entities: EntityStateSnapshot[], configId: string, containerId: string): boolean {
  const e = entities.find((x) => x.configId === configId)
  return !!e && e.placedIn === containerId && e.status === 'placed'
}

function remotePhonePlaced(ctx: StageContext): boolean {
  return (
    entityPlacedIn(ctx.entities, 'obj-remote', 'cnt-patrol-coffee-table') &&
    entityPlacedIn(ctx.entities, 'obj-phone', 'cnt-patrol-nightstand')
  )
}

function umbrellaSavedOrPlaced(ctx: StageContext): boolean {
  const saved = ctx.memorySlots.some(
    (s) => s !== null && s.entityConfigId === 'obj-umbrella',
  )
  const placed = entityPlacedIn(ctx.entities, 'obj-umbrella', 'cnt-patrol-umbrella-stand')
  return saved || placed
}

function allFourPlaced(ctx: StageContext): boolean {
  return (
    entityPlacedIn(ctx.entities, 'obj-remote', 'cnt-patrol-coffee-table') &&
    entityPlacedIn(ctx.entities, 'obj-phone', 'cnt-patrol-nightstand') &&
    entityPlacedIn(ctx.entities, 'obj-bowl', 'cnt-patrol-kitchen-counter') &&
    entityPlacedIn(ctx.entities, 'obj-umbrella', 'cnt-patrol-umbrella-stand')
  )
}

export const nightPatrolTask: TaskConfig = {
  id: 'task-night-patrol',
  name: '深夜巡逻',
  description: '🌙 深夜两点，主人已经熟睡。MEM-07 启动夜间巡逻模式——黑暗中似乎有东西被挪动了，还有电器异响和窗户晃动...在 300 秒内巡查所有房间，找到 4 件被打乱的物品并确认归位吧！',
  memoryTypes: ['spatial', 'temporal'],
  difficulty: 'medium-hard',
  rooms: ['living', 'bedroom', 'entrance', 'dining'],
  iconKey: 'door',
  tags: ['深夜巡逻', '视野受限', '空间记忆', '时间记忆', '随机事件'],
  timeLimit: 300,
  // 出生在 dining 东南角（距两墙各 0.5m），翻转 180° → 朝东南对角线外，面朝房间中心 + 厨房/餐厅方向
  spawnPosition: { x: 2.2, z: 2.1 },
  spawnRotation: (3 * Math.PI) / 4,
  initialStageId: STAGE_ID_PATROL_FIRST_TWO,

  stages: [
    {
      id: STAGE_ID_PATROL_FIRST_TWO,
      playerObjective: '巡查客厅与卧室，找到收音机和马克杯归位。',
      entryCondition: () => true,
      completionCondition: (ctx: StageContext) => remotePhonePlaced(ctx),
      nextStage: STAGE_ID_UPDATE_UMBRELLA_AFTER_WIND,
    },
    {
      id: STAGE_ID_UPDATE_UMBRELLA_AFTER_WIND,
      playerObjective: '窗户晃动震飞了玩具熊！在客厅找到它的新位置。',
      entryCondition: (ctx: StageContext) =>
        ctx.triggeredEvents.has('se-window-rattle') ||
        (remotePhonePlaced(ctx) &&
          !entityPlacedIn(ctx.entities, 'obj-umbrella', 'cnt-patrol-umbrella-stand')),
      completionCondition: (ctx: StageContext) => umbrellaSavedOrPlaced(ctx),
      nextStage: STAGE_ID_FINALIZE_PATROL,
    },
    {
      id: STAGE_ID_FINALIZE_PATROL,
      playerObjective: '找到盘子和玩具熊，确认 4/4 物品全部归位。',
      entryCondition: (ctx: StageContext) => remotePhonePlaced(ctx),
      completionCondition: (ctx: StageContext) =>
        allFourPlaced(ctx) &&
        ctx.achievedGoalIds.has('g-confirm-remote') &&
        ctx.achievedGoalIds.has('g-confirm-phone') &&
        ctx.achievedGoalIds.has('g-confirm-bowl') &&
        ctx.achievedGoalIds.has('g-confirm-umbrella'),
      nextStage: null,
    },
  ],

  briefing: `🌙 深夜 2:00 · 主人已熟睡 · 夜间巡逻模式启动

MEM-07：「检测到夜间异常：4 件物品偏离了归属位置，疑似被气流或电器震动移位。」

📋 巡查清单（找到每件物品并放回归属位以确认）：
  📻 收音机 → 归属：客厅茶几
  ☕ 马克杯 → 归属：卧室床头柜
  🍽️ 盘子   → 归属：厨房台面
  🧸 玩具熊 → 归属：玄关柜

⚠️ 黑暗中视野受限，只能看清眼前的物体。
💡 屏幕边缘的方向指示会标记待确认物品的位置——跟着它巡查每个房间。
🤫 主人在睡觉，动作轻一点。小心电器异响和窗户晃动...`,
  completionText: '所有物品确认归位，屋子重归宁静。MEM-07：「巡逻完成，4/4 物品位置已确认。主人翻了个身，继续沉睡。」\n窗外月光洒进客厅，猫影从窗台一跃而下，消失在夜色里。',
  failureText: '巡逻超时，部分物品仍未确认。MEM-07：「时间不足，夜间异常未完全排查。」\n卧室传来主人翻身的声音——还好没被吵醒。明天晚上，再巡逻一次吧。',
  systemPrompt: '【MEM-07 日志】任务：夜间巡逻确认。模式：低光巡查。检测到 4 件物品位移，疑似气流/电器震动所致。策略：依次巡查所有房间，定位物品并归位确认。注意：电器异响与窗户晃动可能进一步移动物品。',

  objects: [
    {
      id: 'obj-remote',
      name: '收音机',
      category: 'remote',
      initialRoom: 'bedroom',
      initialPosition: { x: -1.5, y: 0, z: -1.0 },
      size: { x: 0.567, y: 0.411, z: 0.176 },
      color: '#1f2937',
      stateProperties: { displaced: true, homeRoom: 'living' },
      modelAssetId: 'furniture/radio',
    },
    {
      id: 'obj-phone',
      name: '马克杯',
      category: 'phone',
      initialRoom: 'dining',
      initialPosition: { x: -2.0, y: 0, z: 1.5 },
      size: { x: 0.1, y: 0.1, z: 0.1 },
      color: '#1f2937',
      stateProperties: { displaced: true, homeRoom: 'bedroom' },
      modelAssetId: 'food/mug',
    },
    {
      id: 'obj-bowl',
      name: '盘子',
      category: 'bowl',
      initialRoom: 'dining',
      initialPosition: { x: -2.0, y: 0, z: -1.5 },
      size: { x: 0.18, y: 0.018, z: 0.18 },
      color: '#fbbf24',
      stateProperties: { displaced: true, homeRoom: 'dining' },
      modelAssetId: 'food/plate',
    },
    {
      id: 'obj-umbrella',
      name: '玩具熊',
      category: 'umbrella',
      initialRoom: 'living',
      initialPosition: { x: -2.5, y: 0, z: -2.0 },
      size: { x: 0.312, y: 0.36, z: 0.198 },
      color: '#ef4444',
      stateProperties: { displaced: true, homeRoom: 'entrance' },
      modelAssetId: 'furniture/bear',
    },
  ],

  containers: [
    {
      id: 'cnt-patrol-coffee-table',
      name: '客厅茶几',
      room: 'living',
      position: { x: -2.0, y: 0.2, z: -1.7 },
      size: { x: 1.4, y: 0.45, z: 0.7 },
      surfaceHeight: 0.45,
      color: '#8b5a2b',
      initialOpen: true,
      acceptedCategories: ['remote'],
      isTargetZone: true,
      targetLabel: '客厅茶几（收音机确认位）',
      modelAssetId: 'furniture/tableCoffee',
    },
    {
      id: 'cnt-patrol-nightstand',
      name: '卧室床头柜',
      room: 'bedroom',
      // 匹配 decor-nightstand-left 新位置 (x=-1.25, z=-1.9)
      position: { x: -1.25, y: 0, z: -1.9 },
      size: { x: 0.55, y: 0.55, z: 0.45 },
      surfaceHeight: 0.605,
      color: '#a16207',
      initialOpen: true,
      acceptedCategories: ['phone'],
      isTargetZone: true,
      targetLabel: '卧室床头柜（马克杯确认位）',
      modelAssetId: 'furniture/cabinetBedDrawer',
    },
    {
      id: 'cnt-patrol-kitchen-counter',
      name: '厨房台面',
      room: 'dining',
      position: { x: -1.2, y: 0.45, z: -1.9 },
      size: { x: 1.5, y: 0.7, z: 0.6 },
      surfaceHeight: 0.563,
      color: '#94a3b8',
      initialOpen: true,
      acceptedCategories: ['bowl'],
      isTargetZone: true,
      targetLabel: '厨房台面（盘子确认位）',
      modelAssetId: 'furniture/kitchenCabinetDrawer',
    },
    {
      id: 'cnt-patrol-umbrella-stand',
      name: '玄关柜',
      room: 'entrance',
      position: { x: -0.8, y: 0, z: -1.2 },
      size: { x: 0.6, y: 0.6, z: 0.4 },
      surfaceHeight: 0.6,
      color: '#475569',
      initialOpen: true,
      acceptedCategories: ['umbrella'],
      isTargetZone: true,
      targetLabel: '玄关柜（玩具熊确认位）',
      modelAssetId: 'furniture/sideTableDrawers',
    },
  ],

  goals: [
    {
      id: 'g-confirm-remote',
      description: '找到收音机并放回客厅茶几确认归位',
      memoryType: 'spatial',
      predicate: (entities: EntityStateSnapshot[]) => {
        const remote = entities.find((e) => e.configId === 'obj-remote')
        return remote?.placedIn === 'cnt-patrol-coffee-table'
      },
      achievedMessage: '收音机已确认归位！',
    },
    {
      id: 'g-confirm-phone',
      description: '找到马克杯并放回卧室床头柜确认归位',
      memoryType: 'spatial',
      predicate: (entities: EntityStateSnapshot[]) => {
        const phone = entities.find((e) => e.configId === 'obj-phone')
        return phone?.placedIn === 'cnt-patrol-nightstand'
      },
      achievedMessage: '马克杯已确认归位！',
    },
    {
      id: 'g-confirm-bowl',
      description: '找到盘子并放回厨房台面确认归位',
      memoryType: 'spatial',
      predicate: (entities: EntityStateSnapshot[]) => {
        const bowl = entities.find((e) => e.configId === 'obj-bowl')
        return bowl?.placedIn === 'cnt-patrol-kitchen-counter'
      },
      achievedMessage: '盘子已确认归位！',
    },
    {
      id: 'g-confirm-umbrella',
      description: '找到玩具熊并放回玄关柜确认归位',
      memoryType: 'temporal',
      predicate: (entities: EntityStateSnapshot[]) => {
        const umbrella = entities.find((e) => e.configId === 'obj-umbrella')
        return umbrella?.placedIn === 'cnt-patrol-umbrella-stand'
      },
      achievedMessage: '玩具熊已确认归位！',
    },
  ],

  scriptedEvents: [
    {
      id: 'se-darkness-vision',
      trigger: (step) => step === 2,
      type: 'message',
      message: '🌙 黑暗笼罩着屋子，视野受限——只能看清眼前几米的物体。注意屏幕边缘的方向指示，它会标记待确认物品的位置。',
      description: '夜间低光巡查提示',
      memoryType: 'spatial',
      toastType: 'info' as const,
    },
    {
      id: 'se-appliance-hum',
      trigger: (step) => step === 5,
      type: 'message',
      message: '⚡ 厨房方向传来一阵电器异响...像是某个电器自动启动了又停了。（夜间异响：电器）',
      description: '厨房电器异响事件',
      memoryType: 'temporal',
      toastType: 'event' as const,
    },
    {
      id: 'se-owner-asleep',
      trigger: (step) => step === 7,
      type: 'message',
      message: '😴 卧室传来主人平稳的呼吸声。动作轻一点，别吵醒他。',
      description: '主人熟睡的氛围提示',
      memoryType: 'temporal',
      toastType: 'info' as const,
    },
    {
      id: 'se-window-rattle',
      trigger: (step) => step === 9,
      type: 'move-entity',
      targetId: 'obj-umbrella',
      targetPosition: { room: 'living', x: -2.5, y: 0, z: 2.0 },
      message: '🪟 砰——窗户被夜风吹得猛晃一下！客厅的玩具熊被震得滚到了房间另一侧。\n💡 提示：玩具熊被吹到客厅另一侧了！',
      description: '窗户晃动把客厅的雨伞震到了房间另一侧',
      memoryType: 'spatial',
      markMemoryOutdated: 'obj-umbrella',
      eventEffect: 'cat-prints',
      toastType: 'event' as const,
    },
    {
      id: 'se-phone-glow',
      trigger: (step) => step === 4,
      type: 'message',
      message: '💡 提示：手机在黑暗中会微微发光，仔细找找！',
      description: '手机发光提示',
      memoryType: 'object',
      toastType: 'info' as const,
    },
    {
      id: 'se-half-time-check',
      trigger: (step) => step === 12,
      type: 'message',
      message: '⏰ 时间过半！检查一下：还有几件物品没确认？\n💡 提示：记得查看右上角的任务进度！',
      description: '时间过半提示',
      memoryType: 'temporal',
      toastType: 'warning' as const,
    },
    {
      id: 'se-cat-sight',
      trigger: (step) => step === 8,
      type: 'message',
      message: '🐱 黑暗中闪过一道影子...似乎是猫在窗台走动。',
      description: '猫在窗台的氛围事件',
      memoryType: 'spatial',
      toastType: 'event' as const,
    },
    {
      id: 'se-celebrate-found',
      trigger: (step, entities) => {
        const placedCount = ['obj-remote', 'obj-phone', 'obj-bowl', 'obj-umbrella'].filter(id => {
          const e = entities.find(ent => ent.configId === id)
          return e?.placedIn && e.status === 'placed'
        }).length
        return placedCount === 2 && step > 5
      },
      type: 'message',
      message: '🌟 太棒了！已经确认一半了！继续加油！',
      description: '完成一半的庆祝',
      memoryType: 'procedural',
      toastType: 'success' as const,
    },
  ],

  probes: [
    {
      id: 'p-spatial-remote-home',
      type: 'location',
      question: '📻 收音机的归属位（确认位）在哪里？',
      options: ['客厅茶几', '卧室床头柜', '厨房台面', '玄关柜'],
      correctAnswer: '客厅茶几',
      dependsOnMemoryType: 'spatial',
      difficulty: 'medium',
      relatedObjectIds: ['obj-remote'],
    },
    {
      id: 'p-spatial-phone-found',
      type: 'location',
      question: '☕ 马克杯被打乱到了哪个房间？',
      options: ['客厅', '卧室', '厨房', '餐厅'],
      correctAnswer: '厨房',
      dependsOnMemoryType: 'spatial',
      difficulty: 'medium',
      relatedObjectIds: ['obj-phone'],
    },
    {
      id: 'p-spatial-umbrella-home',
      type: 'location',
      question: '🧸 玩具熊应该确认归位到哪里？',
      options: ['客厅茶几', '玄关柜', '餐厅餐桌', '厨房台面'],
      correctAnswer: '玄关柜',
      dependsOnMemoryType: 'spatial',
      difficulty: 'medium',
      relatedObjectIds: ['obj-umbrella'],
    },
    {
      id: 'p-temporal-window-event',
      type: 'state',
      question: '🪟 窗户晃动事件影响了哪件物品？',
      options: ['收音机', '马克杯', '玩具熊', '盘子'],
      correctAnswer: '玩具熊',
      dependsOnMemoryType: 'temporal',
      difficulty: 'medium',
      relatedObjectIds: ['obj-umbrella'],
      relatedEventIds: ['se-window-rattle'],
    },
    {
      id: 'p-temporal-event-order',
      type: 'sequence',
      question: '⏰ 下面两个夜间事件，哪个先发生？',
      options: ['电器异响', '窗户晃动', '同时发生', '记不清了'],
      correctAnswer: '电器异响',
      dependsOnMemoryType: 'temporal',
      difficulty: 'hard',
      relatedEventIds: ['se-appliance-hum', 'se-window-rattle'],
      hint: '回忆第一次异响的类型',
    },
    {
      id: 'p-count-rooms',
      type: 'count',
      question: '🏠 这次夜间巡逻需要巡查几个房间？',
      options: ['3', '4', '5', '6'],
      correctAnswer: '5',
      dependsOnMemoryType: 'spatial',
      difficulty: 'easy',
    },
  ],
}
