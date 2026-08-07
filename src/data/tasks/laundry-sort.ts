// 关卡 3：洗衣分拣（Integrated Memory 整合记忆）
// 目标：六件衣物三类分拣 + 记忆验证
// 记忆类型：工作记忆(规则保持) + 物体记忆(身份对应) + 空间记忆(位置追踪) + 程序记忆(执行序列)
// EXECUTION OVERRIDES：本轮启用篮子交换干扰 + 记忆验证阶段

import type { EntityStateSnapshot, StageContext, TaskConfig } from '../../types/task'
import { sharedRooms } from '../rooms'
import type { RoomId } from '../../types/room'

const LAUNDRY_ROOM_ID: RoomId = 'laundry'

const STAGE_RULES = 'stage-rules-encoding'
const STAGE_SWAP = 'stage-baskets-swapped'
const STAGE_SORT = 'stage-sort-six-items'
const STAGE_VERIFY = 'stage-memory-verification'

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
function allItemsPlaced(ctx: StageContext): boolean {
  return whiteAllPlaced(ctx) && darkAllPlaced(ctx) && towelAllPlaced(ctx)
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
 */
function toLaundryLocal(world: { x?: number; y?: number; z?: number } | undefined | null): { x: number; y: number; z: number } {
  const base = sharedRooms[LAUNDRY_ROOM_ID]?.center ?? { x: 0, y: 0, z: 0 }
  return {
    x: (world?.x ?? 0) - (base.x ?? 0),
    y: (world?.y ?? 0) - (base.y ?? 0),
    z: (world?.z ?? 0) - (base.z ?? 0),
  }
}

/** 是否离开后墙编码区：本地 z>=-0.2 靠门口一侧。 */
function leftBackEncodingZone(ctx: StageContext): boolean {
  const local = toLaundryLocal(ctx.playerPosition ?? null)
  return local.z >= -0.2
}

/** 与任一个目标篮距离 <=1.6m（本地坐标）；优先读取 containerOverrides 记录的运行时位置 */
function nearAnyTargetBasket(ctx: StageContext): boolean {
  if (!ctx.playerPosition) return false
  const local = toLaundryLocal(ctx.playerPosition)
  const positions = [
    { x: -1.1, z: -1.3 },
    { x: 0, z: -1.3 },
    { x: 1.1, z: -1.3 },
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

/** 靠近折叠桌验证区（西墙 x≈-1.2, z≈-0.3） */
function nearVerificationZone(ctx: StageContext): boolean {
  if (!ctx.playerPosition) return false
  const local = toLaundryLocal(ctx.playerPosition)
  const dx = local.x - (-1.2)
  const dz = local.z - (-0.3)
  return Math.sqrt(dx * dx + dz * dz) <= 1.2
}

export const laundrySortTask: TaskConfig = {
  id: 'task-laundry-sort',
  name: '洗衣分拣',
  description: '🧺 整合记忆挑战：六件衣物、三类分拣。先观察三个篮子的规则（浅色→白篮，深色→蓝篮，毛巾→橙篮）。⚠️ 注意：分类前去做别的事（靠近门口等待），篮子会被移动！请记住最初篮子的身份，而不是只记当前位置。错误类别会被篮子拒绝！',
  memoryTypes: ['temporal', 'object', 'spatial', 'procedural'],
  difficulty: 'hard',
  rooms: ['laundry'],
  iconKey: 'shirt',
  tags: ['整合记忆', '工作记忆', '空间记忆', '程序记忆', '分类', '位置交换干扰'],
  timeLimit: 300,
  spawnPosition: { x: -1.5, z: -1.7 },
  spawnRotation: Math.PI,
  initialStageId: STAGE_RULES,

  stages: [
    {
      id: STAGE_RULES,
      playerObjective: '【工作记忆 · 规则编码】三个篮子在后墙排成一排。靠近每个篮子，按 E 把它的颜色和类别记进记忆槽——白篮放浅色，蓝篮放深色，橙篮放毛巾。你必须同时在工作记忆中保持这三条规则。记满三条规则后，走到门口（z≥0）让时间推进。',
      entryCondition: () => true,
      completionCondition: (ctx: StageContext) =>
        (ctx.memorySlots.some((s) => s !== null) || anyItemPlaced(ctx)) && leftBackEncodingZone(ctx),
      nextStage: STAGE_SWAP,
    },
    {
      id: STAGE_SWAP,
      playerObjective: '【空间记忆 · 规则切换】钥匙猫「喵~」一声窜过洗衣房，白篮和蓝篮被它撞得互换位置！你的工作记忆中"左白中蓝右橙"的空间布局已失效——必须依靠每个篮子的颜色（身份记忆）而非位置（空间记忆）来判断。回到后墙重新确认，按 E 更新过期记忆。',
      entryCondition: (ctx: StageContext) =>
        (ctx.memorySlots.some((s) => s !== null) || anyItemPlaced(ctx)) && leftBackEncodingZone(ctx),
      completionCondition: nearAnyTargetBasket,
      nextStage: STAGE_SORT,
    },
    {
      id: STAGE_SORT,
      playerObjective: '【程序记忆 · 执行序列】主人：「衣服别放错篮子，会染色的！」按正确的分类逻辑将六件衣物逐一归位——每放入一件都要验证你的工作记忆规则是否仍然正确。放错会被篮子拒绝，连续错误会扣分。',
      entryCondition: nearAnyTargetBasket,
      completionCondition: allItemsPlaced,
      nextStage: STAGE_VERIFY,
    },
    {
      id: STAGE_VERIFY,
      playerObjective: '【验证 · 记忆巩固】所有衣物已分拣完毕。走到西侧折叠桌旁（按 F 互动），确认你对分拣规则的记忆是否仍然准确——这将验证你的整合记忆模块是否真正"记住了"而不只是"做对了"。',
      entryCondition: allItemsPlaced,
      completionCondition: nearVerificationZone,
      nextStage: null,
    },
  ],

  briefing: `🧺 洗衣房 · 整合记忆分拣（第四关·Level 3）

下午，主人抱着一堆衣服冲进洗衣房——昨晚聚餐的餐桌布混着今天换的衬衫、浴巾和深色牛仔裤。更糟的是：洗衣篮的分类标签全被撕了，地上还散落着几片嚼烂的纸屑。钥匙猫蹲在洗衣机上，脖子的旧钥匙叮当作响，眼神无辜得像从没见过任何篮子。

主人：「小橡，这只猫把我的分类标签全撕了！这批衣服分三类——浅色、深色、毛巾——放错会染色，你帮我分拣。」

MEM-07：「整合记忆模块激活。检测到四类记忆需求：
  ① 工作记忆：同时保持三条分类规则（白篮←浅色、蓝篮←深色、橙篮←毛巾）
  ② 物体记忆：记住每件衣物的类别属性
  ③ 空间记忆：追踪篮子位置（钥匙猫可能随时挪动）
  ④ 程序记忆：按正确序列执行分拣

警告：钥匙猫仍在屋内活动。它可能会在你记完规则后挪动篮子位置——必须用记忆槽锁定身份，不要只记位置。」

📋 分拣规则（请全部记住）：
  · 白篮 ← 浅色衣物（2 件，枕头模型）
  · 蓝篮 ← 深色衣物（2 件，蓝色枕头模型）
  · 橙篮 ← 毛巾（2 条，长枕头模型）

💡 多记忆协同策略：
  · 先靠近后墙每个篮子，按 E 保存规则记忆（物体记忆）
  · 同时在脑中保持三条规则（工作记忆）
  · 走到门口让时间推进，钥匙猫会交换篮子位置
  · 回来后靠篮子颜色而非位置判断身份（空间记忆 + 物体记忆）
  · 逐件分拣时，每放入一件验证规则是否正确（程序记忆）`,

  completionText: '六件衣物分拣完毕，主人回来检查：「完美！小橡比洗衣机还好用，还不会把红袜子洗进白衬衫里。」\n钥匙猫：「喵~」（从洗衣机上跳下，似乎对没能制造更多混乱感到失望）\nMEM-07：「整合记忆模块校准完成。\n  · 工作记忆：三条规则保持完整 ✓\n  · 物体记忆：6/6 件物品身份识别正确 ✓\n  · 空间记忆：篮子位移后仍能定位 ✓\n  · 程序记忆：执行序列无错误 ✓\n综合评价：A级 · 长期记忆策略已验证。」',

  failureText: '时间到了，衣物还是乱成一堆。主人：「算了，我送干洗店吧……」\n钥匙猫：「喵呜~」（得意地蜷在洗衣机上）\nMEM-07：「记忆模块诊断：工作记忆过载导致规则遗忘；空间记忆与物体记忆发生冲突。\n建议策略：\n  ① 先逐一靠近篮子保存记忆（建立物体-位置绑定）\n  ② 用记忆槽锁定身份，不要只依赖视觉位置\n  ③ 分拣时每放入一件回溯规则，确认无误后再处理下一件」',

  systemPrompt: '【MEM-07 日志】任务：六件衣物三类分拣 + 记忆验证。策略：四型记忆协同——工作记忆保持规则、物体记忆绑定身份、空间记忆追踪位置、程序记忆执行序列。错误类别将被篮子拒绝。',

  objects: [
    {
      id: 'obj-white-1',
      name: '浅色衣物',
      category: 'white-clothes',
      initialRoom: 'laundry',
      initialPosition: { x: -0.8, y: 0.05, z: 0.8 },
      size: { x: 0.4, y: 0.05, z: 0.5 },
      color: '#f9fafb',
      modelAssetId: 'furniture/pillow',
    },
    {
      id: 'obj-white-2',
      name: '浅色衣物',
      category: 'white-clothes',
      initialRoom: 'laundry',
      initialPosition: { x: 0.5, y: 0.05, z: 1.6 },
      size: { x: 0.4, y: 0.05, z: 0.5 },
      color: '#f9fafb',
      modelAssetId: 'furniture/pillow',
    },
    {
      id: 'obj-dark-1',
      name: '深色衣物',
      category: 'dark-clothes',
      initialRoom: 'laundry',
      initialPosition: { x: 1.0, y: 0.05, z: 0.6 },
      size: { x: 0.4, y: 0.05, z: 0.5 },
      color: '#1e3a5f',
      modelAssetId: 'furniture/pillowBlue',
    },
    {
      id: 'obj-dark-2',
      name: '深色衣物',
      category: 'dark-clothes',
      initialRoom: 'laundry',
      initialPosition: { x: -0.5, y: 0.05, z: 1.4 },
      size: { x: 0.4, y: 0.05, z: 0.5 },
      color: '#1e3a5f',
      modelAssetId: 'furniture/pillowBlue',
    },
    {
      id: 'obj-towel-1',
      name: '毛巾',
      category: 'towel',
      initialRoom: 'laundry',
      initialPosition: { x: 0.8, y: 0.05, z: 1.2 },
      size: { x: 0.5, y: 0.05, z: 0.3 },
      color: '#d97706',
      modelAssetId: 'furniture/pillowLong',
    },
    {
      id: 'obj-towel-2',
      name: '毛巾',
      category: 'towel',
      initialRoom: 'laundry',
      initialPosition: { x: -1.0, y: 0.05, z: 1.0 },
      size: { x: 0.5, y: 0.05, z: 0.3 },
      color: '#d97706',
      modelAssetId: 'furniture/pillowLong',
    },
  ],

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
    {
      id: 'g-memory-verification',
      description: '走到折叠桌旁验证记忆（确认你能回忆起三条分类规则）',
      memoryType: 'procedural',
      relatedObjectIds: [],
      predicate: (entities: EntityStateSnapshot[]) =>
        WHITE_IDS.every((id) => entityPlacedIn(entities, id, WHITE_BASKET)) &&
        DARK_IDS.every((id) => entityPlacedIn(entities, id, DARK_BASKET)) &&
        TOWEL_IDS.every((id) => entityPlacedIn(entities, id, TOWEL_BASKET)),
      achievedMessage: '整合记忆验证完成',
    },
  ],

  scriptedEvents: [
    {
      id: 'se-rules-display',
      trigger: 1,
      type: 'message',
      message: '📋 三型记忆协同启动：\n  · 工作记忆：保持三条规则同时在线\n  · 物体记忆：E 键保存每个篮子的身份\n  · 空间记忆：追踪篮子位置变化\n  · 程序记忆：按序分拣不跳步\n先靠近后墙篮子，按 E 保存规则！',
      description: '展示四型记忆协同框架',
      memoryType: 'temporal',
      toastType: 'info' as const,
    },
    {
      id: 'se-sort-hint',
      trigger: (step, _entities, _room, _rooms, ctx) =>
        step >= 2 && !!ctx?.heldEntityConfigId,
      type: 'message',
      message: '💡 程序记忆提示：确认手中物品的类别 → 回忆对应规则 → 找到正确篮子 → 放入。每一步都在验证你的工作记忆是否准确。',
      description: '玩家手持物品时触发程序记忆提示',
      memoryType: 'procedural',
      toastType: 'info' as const,
    },
    {
      id: 'se-baskets-swap',
      trigger: (_step, _entities, _room, _rooms, ctx) =>
        !!ctx && ctx.currentStageId === STAGE_SWAP,
      type: 'swap-containers',
      swapContainerIds: [WHITE_BASKET, DARK_BASKET],
      message: '🔀 空间记忆干扰！钥匙猫把白篮和蓝篮的位置互换了。你记忆中"左白中蓝"的空间布局已失效。现在必须靠篮子颜色（物体记忆）而非位置（空间记忆）来判断身份——这就是整合记忆的核心挑战！',
      description: '干扰：白篮与深蓝篮交换位置，制造"空间记忆 vs 物体记忆"冲突',
      memoryType: 'spatial',
      toastType: 'warning' as const,
      eventEffect: 'container-swap',
    },
    {
      id: 'se-verification-hint',
      trigger: (_step, _entities, _room, _rooms, ctx) =>
        !!ctx && ctx.currentStageId === STAGE_VERIFY,
      type: 'message',
      message: '✅ 分拣完成！现在走到西侧折叠桌旁验证你的记忆——这将检测你是否真的"记住了"规则，而不仅仅是"做对了"。',
      description: '进入验证阶段时提示玩家',
      memoryType: 'temporal',
      toastType: 'info' as const,
    },
  ],

  probes: [
    {
      id: 'p-sort-white',
      type: 'object-id',
      question: '【物体记忆】浅色衣物应该放进哪个篮子？',
      options: ['白篮', '蓝篮', '橙篮'],
      correctAnswer: '白篮',
      dependsOnMemoryType: 'object',
      difficulty: 'easy',
    },
    {
      id: 'p-sort-dark',
      type: 'object-id',
      question: '【物体记忆】深色衣物应该放进哪个篮子？',
      options: ['白篮', '蓝篮', '橙篮'],
      correctAnswer: '蓝篮',
      dependsOnMemoryType: 'object',
      difficulty: 'easy',
    },
    {
      id: 'p-sort-towel',
      type: 'object-id',
      question: '【物体记忆】毛巾应该放进哪个篮子？',
      options: ['白篮', '蓝篮', '橙篮'],
      correctAnswer: '橙篮',
      dependsOnMemoryType: 'object',
      difficulty: 'easy',
    },
    {
      id: 'p-count-items',
      type: 'count',
      question: '【工作记忆】一共有几件衣物需要分类？',
      options: ['3', '4', '5', '6'],
      correctAnswer: '6',
      dependsOnMemoryType: 'temporal',
      difficulty: 'easy',
    },
    {
      id: 'p-basket-position',
      type: 'object-id',
      question: '【空间记忆】篮子被挪动后，你应该靠什么判断哪个篮子是白篮？',
      options: ['记住它原来的位置', '看篮子的颜色', '数篮子的顺序', '闻气味'],
      correctAnswer: '看篮子的颜色',
      dependsOnMemoryType: 'spatial',
      difficulty: 'medium',
    },
    {
      id: 'p-sequence',
      type: 'sequence',
      question: '【程序记忆】正确的分拣执行顺序是什么？',
      options: ['随意拿', '先分拣浅色，再深色，最后毛巾', '先分拣毛巾，再浅色，最后深色', '同时拿多件'],
      correctAnswer: '先分拣浅色，再深色，最后毛巾',
      dependsOnMemoryType: 'procedural',
      difficulty: 'medium',
    },
  ],
}
