// 关卡 4：早餐时间循环
// 目标：在时间循环中完成早餐准备与归位，小心强迫症的早餐闹钟！
// 记忆类型：procedural（流程） + spatial（空间） + object（物体状态） + temporal（时序） + container（容器状态）

import type { EntityStateSnapshot, StageContext, TaskConfig } from '../../types/task'

const STAGE_ID_PREPARE_FRIDGE_CABINET = 'stage-prepare-fridge-cabinet'
const STAGE_ID_SERVE_BREAKFAST = 'stage-serve-breakfast'
const STAGE_ID_RETURN_MILK_CEREAL = 'stage-return-milk-cereal'
const STAGE_ID_FINALIZE = 'stage-finalize-kitchen'

function entityPlacedIn(entities: EntityStateSnapshot[], configId: string, containerId: string): boolean {
  const e = entities.find((x) => x.configId === configId)
  return !!e && e.placedIn === containerId && e.status === 'placed'
}

function entityTakenOut(ctx: StageContext, configId: string): boolean {
  const e = ctx.entities.find((x) => x.configId === configId)
  return !!e && (e.status === 'free' || e.status === 'held')
}

function allFourTakenOut(ctx: StageContext): boolean {
  const ids = ['obj-milk', 'obj-cereal', 'obj-cup', 'obj-bowl']
  return ids.every((id) => entityTakenOut(ctx, id))
}

function allFourOnTable(ctx: StageContext): boolean {
  const ids = ['obj-milk', 'obj-cereal', 'obj-cup', 'obj-bowl']
  return ids.every((id) => entityPlacedIn(ctx.entities, id, 'cnt-dining-table'))
}

function milkReturned(ctx: StageContext): boolean {
  const milk = ctx.entities.find((e) => e.configId === 'obj-milk')
  return !!milk && (milk.placedIn === 'cnt-fridge' || milk.status === 'hidden')
}

function cerealReturned(ctx: StageContext): boolean {
  const cereal = ctx.entities.find((e) => e.configId === 'obj-cereal')
  return (
    !!cereal &&
    (cereal.placedIn === 'cnt-cabinet-upper' ||
      cereal.placedIn === 'cnt-cabinet-lower' ||
      cereal.status === 'hidden')
  )
}

function cupBowlInDishwasherOrSink(ctx: StageContext): boolean {
  const cup = ctx.entities.find((e) => e.configId === 'obj-cup')
  const bowl = ctx.entities.find((e) => e.configId === 'obj-bowl')
  const cupOk = !!cup && (cup.placedIn === 'cnt-dishwasher' || cup.placedIn === 'cnt-sink')
  const bowlOk = !!bowl && (bowl.placedIn === 'cnt-dishwasher' || bowl.placedIn === 'cnt-sink')
  return cupOk && bowlOk
}

export const breakfastTask: TaskConfig = {
  id: 'task-breakfast',
  name: '早餐时间循环',
  description: '⏰ 深夜十一点，厨房的闹钟突然响了...早餐闹钟又被困在时间循环里了！它必须每天重复同样的早餐流程才能安心。在 120 秒内完成早餐准备和归位，帮它从循环里解脱出来吧！',
  memoryTypes: ['procedural', 'spatial', 'object', 'temporal'],
  difficulty: 'hard',
  rooms: ['dining'],
  iconKey: 'breakfast',
  tags: ['限时挑战', '早餐闹钟', '流程陷阱', '扣分机制', '记忆大师'],
  timeLimit: 120,
  // 出生在 dining 东南角（距两墙各 0.5m），翻转 180° → 朝东南对角线外，面朝房间中心 + 厨房任务区
  spawnPosition: { x: 2.2, z: 2.1 },
  spawnRotation: (3 * Math.PI) / 4,
  initialStageId: STAGE_ID_PREPARE_FRIDGE_CABINET,

  stages: [
    {
      id: STAGE_ID_PREPARE_FRIDGE_CABINET,
      playerObjective: '打开冰箱和下层橱柜，取出食材。',
      entryCondition: () => true,
      completionCondition: (ctx: StageContext) => allFourTakenOut(ctx),
      nextStage: STAGE_ID_SERVE_BREAKFAST,
    },
    {
      id: STAGE_ID_SERVE_BREAKFAST,
      playerObjective: '按顺序把牛奶、麦片、碗、杯子放到餐桌。',
      entryCondition: (ctx: StageContext) => allFourTakenOut(ctx),
      completionCondition: (ctx: StageContext) => allFourOnTable(ctx),
      nextStage: STAGE_ID_RETURN_MILK_CEREAL,
    },
    {
      id: STAGE_ID_RETURN_MILK_CEREAL,
      playerObjective: '麦片跑上层橱柜了！把牛奶回冰箱、麦片回橱柜。',
      entryCondition: (ctx: StageContext) => allFourOnTable(ctx),
      completionCondition: (ctx: StageContext) => milkReturned(ctx) && cerealReturned(ctx),
      nextStage: STAGE_ID_FINALIZE,
    },
    {
      id: STAGE_ID_FINALIZE,
      playerObjective: '杯碗放洗碗机，冰箱和橱柜全部关好。',
      entryCondition: (ctx: StageContext) => milkReturned(ctx) && cerealReturned(ctx),
      completionCondition: (ctx: StageContext) => {
        const milk = ctx.entities.find((e) => e.configId === 'obj-milk')
        const cereal = ctx.entities.find((e) => e.configId === 'obj-cereal')
        return (
          cupBowlInDishwasherOrSink(ctx) &&
          !!milk &&
          milk.status === 'hidden' &&
          !!cereal &&
          cereal.status === 'hidden'
        )
      },
      nextStage: null,
    },
  ],

  briefing: `⏰ 深夜 11:00 · 厨房闹钟响了

冰箱上贴着主人的流程图：「第一阶段—上桌顺序：牛奶→麦片→碗→杯子。第二阶段—归位：所有物品放回原位，容器全部关好。」
猫蹲在橱柜顶上，尾巴有节奏地拍打着天花板。`,
  completionText: '所有物品归位，容器关闭。闹钟的指针终于停了。\n主人发来消息：「小橡你做到了？我循环了 47 次都没成功...」猫打了个哈欠。',
  failureText: '闹钟的指针疯狂倒转。「错误！错误！流程重置！」\n猫安静地坐在台面上，看着一切重置。它的眼神好像在说：又来了。',
  systemPrompt: '【MEM-07 日志】任务：执行早餐流程并归位。第一阶段：按序上桌（牛奶→麦片→碗→杯子）。第二阶段：全部归位，容器关闭。检测到时间异常，猫科生物可能干扰计时。',

  objects: [
    // 牛奶 - 在冰箱里（需要先打开）
    {
      id: 'obj-milk',
      name: '牛奶',
      category: 'milk',
      initialRoom: 'dining',
      initialPosition: { x: 1.9, y: 0.6, z: 0 },
      size: { x: 0.12, y: 0.25, z: 0.1 },
      color: '#e5e7eb',
      hiddenInContainer: 'cnt-fridge',
      stateProperties: { temperature: 'cold', status: 'in-fridge' },
    },
    // 麦片盒 - 初始在下层橱柜
    {
      id: 'obj-cereal',
      name: '麦片',
      category: 'cereal',
      initialRoom: 'dining',
      initialPosition: { x: 1.9, y: 0.6, z: 0.15 },
      size: { x: 0.2, y: 0.3, z: 0.1 },
      color: '#f59e0b',
      hiddenInContainer: 'cnt-cabinet-lower',
      stateProperties: { opened: false },
    },
    // 杯子 - 在下层橱柜
    {
      id: 'obj-cup',
      name: '杯子',
      category: 'cup',
      initialRoom: 'dining',
      initialPosition: { x: 1.9, y: 0.6, z: -0.1 },
      size: { x: 0.1, y: 0.12, z: 0.1 },
      color: '#60a5fa',
      hiddenInContainer: 'cnt-cabinet-lower',
      stateProperties: { cleanliness: 'clean', status: 'in-cabinet' },
    },
    // 碗 - 在下层橱柜
    {
      id: 'obj-bowl',
      name: '碗',
      category: 'bowl',
      initialRoom: 'dining',
      initialPosition: { x: 1.9, y: 0.6, z: 0.2 },
      size: { x: 0.15, y: 0.08, z: 0.15 },
      color: '#fbbf24',
      hiddenInContainer: 'cnt-cabinet-lower',
      stateProperties: { cleanliness: 'clean', status: 'in-cabinet' },
    },
    // 勺子 - 已经在桌上
    {
      id: 'obj-spoon',
      name: '勺子',
      category: 'spoon',
      initialRoom: 'dining',
      initialPosition: { x: 0.3, y: 0.5, z: 0 },
      size: { x: 0.18, y: 0.02, z: 0.04 },
      color: '#a3a3a3',
      stateProperties: { status: 'on-table' },
    },
  ],

  containers: [
    // 厨房 - 冰箱（西南角，远离东墙 laundry 门洞）
    {
      id: 'cnt-fridge',
      name: '冰箱',
      room: 'dining',
      position: { x: -2.0, y: 0.9, z: -1.8 },
      size: { x: 0.7, y: 1.8, z: 0.7 },
      surfaceHeight: 1.8,
      color: '#e5e7eb',
      initialOpen: false,
      acceptedCategories: ['milk'],
      containsObjectIds: ['obj-milk'],
    },
    // 厨房 - 上层橱柜（空，用于归位麦片）
    {
      id: 'cnt-cabinet-upper',
      name: '上层橱柜',
      room: 'dining',
      position: { x: 1.9, y: 1.8, z: 0 },
      size: { x: 0.8, y: 0.5, z: 0.4 },
      surfaceHeight: 2.05,
      color: '#a16207',
      initialOpen: false,
      acceptedCategories: ['cereal'],
      containsObjectIds: [],
    },
    // 厨房 - 下层橱柜（放杯子、碗、麦片）
    {
      id: 'cnt-cabinet-lower',
      name: '下层橱柜',
      room: 'dining',
      position: { x: 1.9, y: 0.6, z: 0 },
      size: { x: 0.8, y: 0.6, z: 0.4 },
      surfaceHeight: 1.2,
      color: '#a16207',
      initialOpen: false,
      acceptedCategories: ['cup', 'bowl', 'cereal'],
      containsObjectIds: ['obj-cereal', 'obj-cup', 'obj-bowl'],
    },
    // 厨房 - 台面（沿南墙内侧，z=-1.9 半宽 0.3 → -2.2~-1.6 ∈ [-2.25,2.25]）
    {
      id: 'cnt-kitchen-counter',
      name: '厨房台面',
      room: 'dining',
      position: { x: 0.8, y: 0.5, z: -1.9 },
      size: { x: 1.5, y: 0.7, z: 0.6 },
      surfaceHeight: 0.7,
      color: '#94a3b8',
      initialOpen: true,
      acceptedCategories: ['milk', 'cereal'],
    },
    // 厨房 - 水槽（台面东侧紧挨）
    {
      id: 'cnt-sink',
      name: '水槽',
      room: 'dining',
      position: { x: 1.85, y: 0.45, z: -1.9 },
      size: { x: 0.5, y: 0.7, z: 0.5 },
      surfaceHeight: 0.72,
      color: '#9ca3af',
      initialOpen: true,
      acceptedCategories: ['cup', 'bowl'],
    },
    // 厨房 - 洗碗机（沿北墙内侧，z=1.9 半宽 0.3 → 1.6~2.2 ∈ [-2.25,2.25]）
    {
      id: 'cnt-dishwasher',
      name: '洗碗机',
      room: 'dining',
      position: { x: 1.7, y: 0.4, z: 1.9 },
      size: { x: 0.6, y: 0.8, z: 0.6 },
      surfaceHeight: 0.82,
      color: '#a3a3a3',
      initialOpen: true,
      acceptedCategories: ['cup', 'bowl'],
      isTargetZone: true,
      targetLabel: '洗碗机（餐具归位区）',
    },
    // 厨房 - 垃圾桶（北墙最东角，距洗碗机中心 0.7m，AABB 无重叠）
    {
      id: 'cnt-trash-bin',
      name: '垃圾桶',
      room: 'dining',
      position: { x: 2.15, y: 0.2, z: 1.1 },
      size: { x: 0.3, y: 0.4, z: 0.3 },
      surfaceHeight: 0.42,
      color: '#1f2937',
      initialOpen: true,
      acceptedCategories: [],
    },
    // 餐厅 - 餐桌
    {
      id: 'cnt-dining-table',
      name: '餐桌',
      room: 'dining',
      position: { x: 0, y: 0.45, z: 0 },
      size: { x: 1.8, y: 0.9, z: 0.9 },
      surfaceHeight: 0.9,
      color: '#92400e',
      initialOpen: true,
      acceptedCategories: ['milk', 'cereal', 'cup', 'bowl', 'spoon'],
      isTargetZone: true,
      targetLabel: '餐桌（早餐准备区）',
    },
  ],

  goals: [
    // === 准备阶段 ===
    {
      id: 'g-open-fridge',
      description: '打开冰箱',
      kind: 'milestone',
      stage: '准备',
      memoryType: 'procedural',
      relatedObjectIds: ['obj-milk'],
      predicate: (entities: EntityStateSnapshot[]) => {
        const milk = entities.find((e) => e.configId === 'obj-milk')
        return milk?.status === 'free' || milk?.status === 'held'
      },
      achievedMessage: '冰箱已打开！',
    },
    {
      id: 'g-open-cabinet',
      description: '打开下层橱柜',
      kind: 'milestone',
      stage: '准备',
      memoryType: 'procedural',
      relatedObjectIds: ['obj-cup'],
      predicate: (entities: EntityStateSnapshot[]) => {
        const cup = entities.find((e) => e.configId === 'obj-cup')
        return cup?.status === 'free' || cup?.status === 'held'
      },
      achievedMessage: '橱柜已打开！',
    },
    {
      id: 'g-get-milk',
      description: '取出牛奶',
      kind: 'milestone',
      stage: '准备',
      dependsOnGoalIds: ['g-open-fridge'],
      memoryType: 'object',
      relatedObjectIds: ['obj-milk'],
      predicate: (entities: EntityStateSnapshot[]) => {
        const milk = entities.find((e) => e.configId === 'obj-milk')
        return milk?.status === 'free' || milk?.status === 'held'
      },
      achievedMessage: '牛奶已取出！',
    },
    {
      id: 'g-get-cup',
      description: '取出杯子',
      kind: 'milestone',
      stage: '准备',
      dependsOnGoalIds: ['g-open-cabinet'],
      memoryType: 'object',
      relatedObjectIds: ['obj-cup'],
      predicate: (entities: EntityStateSnapshot[]) => {
        const cup = entities.find((e) => e.configId === 'obj-cup')
        return cup?.status === 'free' || cup?.status === 'held'
      },
      achievedMessage: '杯子已取出！',
    },
    {
      id: 'g-get-bowl',
      description: '取出碗',
      kind: 'milestone',
      stage: '准备',
      dependsOnGoalIds: ['g-open-cabinet'],
      memoryType: 'object',
      relatedObjectIds: ['obj-bowl'],
      predicate: (entities: EntityStateSnapshot[]) => {
        const bowl = entities.find((e) => e.configId === 'obj-bowl')
        return bowl?.status === 'free' || bowl?.status === 'held'
      },
      achievedMessage: '碗已取出！',
    },
    {
      id: 'g-get-cereal',
      description: '取出麦片',
      kind: 'milestone',
      stage: '准备',
      dependsOnGoalIds: ['g-open-cabinet'],
      memoryType: 'object',
      relatedObjectIds: ['obj-cereal'],
      predicate: (entities: EntityStateSnapshot[]) => {
        const cereal = entities.find((e) => e.configId === 'obj-cereal')
        return cereal?.status === 'free' || cereal?.status === 'held'
      },
      achievedMessage: '麦片已取出！',
    },
    {
      id: 'g-prepare-breakfast',
      description: '把牛奶、麦片、杯子、碗放到餐桌（早餐准备完成）',
      kind: 'milestone',
      stage: '上桌',
      dependsOnGoalIds: ['g-get-milk', 'g-get-cup', 'g-get-bowl', 'g-get-cereal'],
      memoryType: 'procedural',
      relatedObjectIds: ['obj-milk', 'obj-cereal', 'obj-cup', 'obj-bowl'],
      predicate: (entities: EntityStateSnapshot[]) => {
        const ids = ['obj-milk', 'obj-cereal', 'obj-cup', 'obj-bowl']
        return ids.every((id) => {
          const e = entities.find((ent) => ent.configId === id)
          return e?.placedIn === 'cnt-dining-table'
        })
      },
      achievedMessage: '早餐准备完成！',
      requiredSequence: [
        { action: 'place', targetId: 'obj-milk', label: '先放牛奶到桌上' },
        { action: 'place', targetId: 'obj-cereal', label: '再放麦片到桌上' },
        { action: 'place', targetId: 'obj-bowl', label: '然后放碗到桌上' },
        { action: 'place', targetId: 'obj-cup', label: '最后放杯子到桌上' },
      ],
    },
    // === 归位阶段 ===
    {
      id: 'g-return-milk',
      description: '把牛奶放回冰箱',
      kind: 'terminal-constraint',
      stage: '归位',
      dependsOnGoalIds: ['g-prepare-breakfast'],
      memoryType: 'object',
      relatedObjectIds: ['obj-milk'],
      predicate: (entities: EntityStateSnapshot[]) => {
        const milk = entities.find((e) => e.configId === 'obj-milk')
        return milk?.placedIn === 'cnt-fridge' || milk?.status === 'hidden'
      },
      achievedMessage: '牛奶已归位！',
    },
    {
      id: 'g-return-cereal',
      description: '把麦片放回橱柜',
      kind: 'terminal-constraint',
      stage: '归位',
      dependsOnGoalIds: ['g-prepare-breakfast'],
      memoryType: 'object',
      relatedObjectIds: ['obj-cereal'],
      predicate: (entities: EntityStateSnapshot[]) => {
        const cereal = entities.find((e) => e.configId === 'obj-cereal')
        return cereal?.placedIn === 'cnt-cabinet-upper' || cereal?.placedIn === 'cnt-cabinet-lower' || cereal?.status === 'hidden'
      },
      achievedMessage: '麦片已归位！',
    },
    {
      id: 'g-return-cup-bowl',
      description: '把杯子和碗放到洗碗机',
      kind: 'terminal-constraint',
      stage: '归位',
      dependsOnGoalIds: ['g-prepare-breakfast'],
      memoryType: 'object',
      relatedObjectIds: ['obj-cup', 'obj-bowl'],
      predicate: (entities: EntityStateSnapshot[]) => {
        const cup = entities.find((e) => e.configId === 'obj-cup')
        const bowl = entities.find((e) => e.configId === 'obj-bowl')
        return (cup?.placedIn === 'cnt-dishwasher' || cup?.placedIn === 'cnt-sink') &&
               (bowl?.placedIn === 'cnt-dishwasher' || bowl?.placedIn === 'cnt-sink')
      },
      achievedMessage: '餐具已归位！',
    },
    {
      id: 'g-close-containers',
      description: '关闭冰箱和橱柜',
      kind: 'terminal-constraint',
      stage: '收尾',
      dependsOnGoalIds: ['g-return-milk', 'g-return-cereal', 'g-return-cup-bowl'],
      memoryType: 'procedural',
      relatedObjectIds: ['obj-milk', 'obj-cereal'],
      predicate: (entities: EntityStateSnapshot[]) => {
        const milk = entities.find((e) => e.configId === 'obj-milk')
        const cereal = entities.find((e) => e.configId === 'obj-cereal')
        return milk?.status === 'hidden' && cereal?.status === 'hidden'
      },
      achievedMessage: '容器已关闭！',
    },
  ],

  scriptedEvents: [
    {
      id: 'se-cereal-moved-to-cabinet',
      trigger: (step) => step === 8,
      type: 'move-entity',
      targetId: 'obj-cereal',
      targetPosition: { room: 'dining', x: 1.9, y: 1.5, z: 0 },
      message: '⏰ 叮铃——麦片盒跑到上层橱柜去了！（早餐闹钟：放错地方了！应该在这里！）',
      description: '早餐闹钟把麦片移动到了上层橱柜',
      memoryType: 'spatial',
    },
    {
      id: 'se-fridge-auto-close',
      trigger: (step) => step === 12,
      type: 'message',
      message: '⏰ 早餐闹钟瞪着冰箱门...好像在催你记得关好冰箱。（早餐闹钟：开着冰箱门不礼貌！）',
      description: '早餐闹钟提醒玩家注意冰箱门状态',
      memoryType: 'object',
    },
    {
      id: 'se-milk-deduct-points',
      trigger: (step) => step === 15,
      type: 'message',
      message: '⏰ 牛奶在外面太久了！快放回去！（早餐闹钟：牛奶要冰的才对！）',
      description: '牛奶放置时间过长，早餐闹钟催促放回',
      memoryType: 'temporal',
    },
    {
      id: 'se-milk-deduct-more',
      trigger: (step) => step === 25,
      type: 'message',
      message: '⏰ 还没放回去？牛奶要变质了！（早餐闹钟：快快快！流程要对！）',
      description: '牛奶放置时间过长第二次催促',
      memoryType: 'temporal',
    },
    {
      id: 'se-wrong-affordance-use',
      trigger: (_step, entities) => {
        const cup = entities.find((e) => e.configId === 'obj-cup')
        const bowl = entities.find((e) => e.configId === 'obj-bowl')
        return (cup?.placedIn === 'cnt-trash-bin') || (bowl?.placedIn === 'cnt-trash-bin')
      },
      type: 'message',
      message: '⏰ 错错错！杯子碗怎么能扔垃圾桶！（早餐闹钟：流程完全不对！）',
      description: '把干净餐具错误放入垃圾桶触发惩罚',
      memoryType: 'procedural',
    },
    {
      id: 'se-owner-flowchart',
      trigger: (step) => step === 3,
      type: 'message',
      message: '📋 主人的流程图备注：「P.S. 牛奶必须最后放回去，不然会变温。别问我怎么知道的。」',
      description: '主人补充流程说明',
      memoryType: 'procedural',
      toastType: 'info' as const,
    },
    {
      id: 'se-cat-timer',
      trigger: (step) => step === 18,
      type: 'message',
      message: '🐱 检测到猫在闹钟附近活动。指针的转速似乎...不太稳定？',
      description: '猫疑似干扰计时',
      memoryType: 'temporal',
      toastType: 'cat' as const,
    },
  ],

  probes: [
    {
      id: 'p-spatial-cereal-location',
      type: 'location',
      question: '🔍 一开始，麦片放在哪个位置？',
      options: ['上层橱柜', '下层橱柜', '冰箱里', '餐桌上'],
      correctAnswer: '下层橱柜',
      dependsOnMemoryType: 'spatial',
      difficulty: 'medium',
      relatedObjectIds: ['obj-cereal'],
      relatedEventIds: ['se-cereal-moved-to-cabinet'],
    },
    {
      id: 'p-object-state-fridge',
      type: 'state',
      question: '🔒 早餐闹钟对冰箱门有什么反应？',
      options: ['提醒玩家记得关冰箱门', '自动关上冰箱门', '把牛奶拿出来', '把冰箱搬走'],
      correctAnswer: '提醒玩家记得关冰箱门',
      dependsOnMemoryType: 'object',
      difficulty: 'medium',
      relatedObjectIds: ['obj-milk'],
      relatedEventIds: ['se-fridge-auto-close'],
    },
    {
      id: 'p-temporal-order',
      type: 'sequence',
      question: '⏰ 准备早餐时，下面哪个顺序更合理？',
      options: ['取杯子 → 取牛奶', '取牛奶 → 取杯子', '取麦片 → 取碗', '取碗 → 取麦片'],
      correctAnswer: '取牛奶 → 取杯子',
      dependsOnMemoryType: 'temporal',
      difficulty: 'medium',
      relatedEventIds: ['g-get-milk', 'g-get-cup'],
    },
    {
      id: 'p-procedural-missing-step',
      type: 'sequence',
      question: '🚨 吃完早餐后，哪件事最着急？',
      options: ['把牛奶放回冰箱', '把杯子放到餐桌上', '把勺子放到水槽', '打开橱柜'],
      correctAnswer: '把牛奶放回冰箱',
      dependsOnMemoryType: 'procedural',
      difficulty: 'medium',
      relatedObjectIds: ['obj-milk'],
      relatedEventIds: ['g-return-milk'],
    },
    {
      id: 'p-spatial-cereal-final',
      type: 'location',
      question: '🔮 早餐闹钟把麦片移动到了哪里？',
      options: ['下层橱柜', '上层橱柜', '冰箱里', '餐桌上'],
      correctAnswer: '上层橱柜',
      dependsOnMemoryType: 'spatial',
      difficulty: 'hard',
      relatedObjectIds: ['obj-cereal'],
      relatedEventIds: ['se-cereal-moved-to-cabinet'],
      hint: '回忆早餐闹钟的强迫症',
    },
    {
      id: 'p-object-state-milk',
      type: 'state',
      question: '🥛 牛奶一开始是什么状态？',
      options: ['在冰箱里（冰的）', '在台面上（常温）', '在餐桌上（已使用）', '在洗碗机里（脏的）'],
      correctAnswer: '在冰箱里（冰的）',
      dependsOnMemoryType: 'object',
      difficulty: 'easy',
      relatedObjectIds: ['obj-milk'],
    },
    {
      id: 'p-temporal-penalty',
      type: 'state',
      question: '⏰ 系统在第几步第一次提醒牛奶需要归位？',
      options: ['10 步', '15 步', '20 步', '25 步'],
      correctAnswer: '15 步',
      dependsOnMemoryType: 'temporal',
      difficulty: 'medium',
      relatedObjectIds: ['obj-milk'],
      relatedEventIds: ['se-milk-deduct-points'],
    },
  ],
}
