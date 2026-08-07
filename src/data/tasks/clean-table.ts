// 关卡 1：餐桌整理（Symbolic Memory 符号记忆）
// 目标：记住餐桌上的四件餐具（计数 + 物体识别），归位时发现猫移走了勺子
// 记忆类型：符号记忆（Symbolic Memory）—— counting + visual grounding
// 难度：新手入门
//
// 研究展示（RoboMEME / 三关 MVP · L1）：
// - Symbolic Memory 擅长 counting 与 visual grounding
// - 玩家需先记住"桌上有 4 件餐具"（counting）及分别是什么（grounding）
// - 保持间隔：玩家必须离开餐桌去厨房水槽（触发扰动），再回到餐桌发现变化
// - 猫确定性移走勺子后，计数记忆与现状不符，展示符号记忆的脆弱性
// - 研究数据点：计数准确率、缺失物识别、记忆保存时机（仅在 Probe 采集，不中途答题）

import type { EntityStateSnapshot, StageContext, TaskConfig } from '../../types/task'
import type { RoomId } from '../../types/room'

const STAGE_ID_OBSERVE = 'stage-observe'
const STAGE_ID_PERTURBED = 'stage-perturbed'

// 厨房水槽在 dining 房间内的局部坐标（用于 cat 事件触发时的距离判定）
const KITCHEN_SINK_LOCAL = { x: 1.8, z: 1.8 }
const SINK_PROXIMITY_THRESHOLD = 1.6

function entityPlacedIn(entities: EntityStateSnapshot[], configId: string, containerId: string): boolean {
  const e = entities.find((x) => x.configId === configId)
  return !!e && e.placedIn === containerId && e.status === 'placed'
}

export const cleanTableTask: TaskConfig = {
  id: 'task-clean-table',
  name: '餐桌整理',
  description: '🍽️ 欢迎来到记忆宅邸！MEM-07 的记忆模块出了故障。先从餐桌整理开始——记住桌上有几件餐具、分别是什么，然后把它们归位。注意：猫可能会捣乱！',
  memoryTypes: ['spatial', 'object'],
  difficulty: 'tutorial',
  rooms: ['dining'],
  iconKey: 'dish',
  tags: ['新手入门', '符号记忆'],
  timeLimit: 240,
  spawnPosition: { x: 0, z: -1.5 },
  spawnRotation: 0,
  initialStageId: STAGE_ID_OBSERVE,

  stages: [
    {
      id: STAGE_ID_OBSERVE,
      playerObjective: '观察桌上餐具，记住一共有几件及分别是什么。靠近物品按 E 保存位置记忆。',
      entryCondition: () => true,
      // 编码→保持间隔：玩家必须先保存记忆，再去厨房水槽触发扰动；扰动发生后才进入下一阶段
      completionCondition: (ctx: StageContext) =>
        ctx.memorySlots.some((s) => s !== null) &&
        ctx.triggeredEvents.has('se-cat-moves-spoon'),
      nextStage: STAGE_ID_PERTURBED,
    },
    {
      id: STAGE_ID_PERTURBED,
      playerObjective: '桌面发生了变化！回忆原来有几件，找到被移动的勺子，把四件餐具归位。',
      entryCondition: (ctx: StageContext) => ctx.triggeredEvents.has('se-cat-moves-spoon'),
      completionCondition: (ctx: StageContext) =>
        entityPlacedIn(ctx.entities, 'obj-mug', 'cnt-kitchen-sink') &&
        entityPlacedIn(ctx.entities, 'obj-spoon', 'cnt-kitchen-sink') &&
        entityPlacedIn(ctx.entities, 'obj-plate', 'cnt-cabinet') &&
        entityPlacedIn(ctx.entities, 'obj-fork', 'cnt-cabinet'),
      nextStage: null,
    },
  ],

  briefing: `🍽️ 记忆宅邸 · 第一关（符号记忆）

MEM-07：「你好，我是 MEM-07。我的记忆模块出了故障。」

「餐桌上有四件餐具需要归位——马克杯、盘子、叉子和勺子。先记住桌上有几件、分别是什么。」

「⚠️ 这很重要：归位前你需要先去厨房水槽看看——猫可能趁你不注意捣乱！」

操作说明：
• WASD / 方向键 — 移动
• 鼠标 — 转视角
• E — 靠近餐桌物品保存位置记忆（先做）
• F — 保存记忆后拾取 / 放置物品

💡 归位目标：马克杯、勺子 → 水槽；盘子、叉子 → 橱柜`,

  completionText: '🎉 太棒了！你完成了餐桌整理！\nMEM-07：「符号记忆已校准。接下来的挑战会更有趣——也会更难。」',

  failureText: '⏰ 时间到了...没关系，再来一次！\nMEM-07：「别灰心。记住：按 E 保存记忆，按 F 拾取和放置物品。」',

  systemPrompt: '【MEM-07 日志】L1 符号记忆关卡。物品数量：4（mug/plate/fork/spoon）。时限：240秒。记忆类型：符号记忆（计数+识别）。扰动事件：猫移走勺子（保存记忆+靠近水槽后确定性触发）。Probe 采集：计数、缺失物识别、位置。研究数据：计数准确率、缺失物识别率、记忆保存时机。',

  objects: [
    {
      id: 'obj-mug',
      name: '马克杯',
      category: 'cup',
      initialRoom: 'dining',
      initialPosition: { x: -0.5, y: 0, z: 0.2 },
      surfaceContainerId: 'cnt-dining-table',
      size: { x: 0.1, y: 0.1, z: 0.1 },
      color: '#d1d5db',
      modelAssetId: 'food/mug',
    },
    {
      id: 'obj-plate',
      name: '盘子',
      category: 'plate',
      initialRoom: 'dining',
      initialPosition: { x: 0.5, y: 0, z: 0.2 },
      surfaceContainerId: 'cnt-dining-table',
      size: { x: 0.18, y: 0.018, z: 0.18 },
      color: '#f3f4f6',
      modelAssetId: 'food/plate',
    },
    {
      id: 'obj-fork',
      name: '叉子',
      category: 'fork',
      initialRoom: 'dining',
      initialPosition: { x: 0, y: 0, z: -0.3 },
      surfaceContainerId: 'cnt-dining-table',
      size: { x: 0.05, y: 0.2, z: 0.0084 },
      color: '#b8c0c4',
      modelAssetId: 'food/utensil-fork',
    },
    {
      id: 'obj-spoon',
      name: '勺子',
      category: 'spoon',
      initialRoom: 'dining',
      initialPosition: { x: -0.3, y: 0, z: -0.2 },
      surfaceContainerId: 'cnt-dining-table',
      size: { x: 0.073, y: 0.2, z: 0.061 },
      color: '#cbd5e1',
      modelAssetId: 'food/utensil-spoon',
    },
  ],

  containers: [
    {
      id: 'cnt-dining-table',
      name: '餐桌',
      room: 'dining',
      // position.y=0 让 furniture/table GLB 贴地；surfaceHeight 对齐 effectiveAabb.y=0.653
      position: { x: 0, y: 0, z: 0 },
      size: { x: 1.683, y: 0.653, z: 0.895 },
      surfaceHeight: 0.653,
      color: '#92400e',
      initialOpen: true,
      acceptedCategories: [],
      acceptAny: false,
      modelAssetId: 'furniture/table',
    },
    {
      id: 'cnt-kitchen-sink',
      name: '厨房水槽',
      room: 'dining',
      // position.y=0 让 furniture/kitchenSink GLB 贴地；surfaceHeight 对齐 effectiveAabb.y=0.613
      position: { x: KITCHEN_SINK_LOCAL.x, y: 0, z: KITCHEN_SINK_LOCAL.z },
      size: { x: 0.538, y: 0.613, z: 0.600 },
      surfaceHeight: 0.613,
      color: '#a3a3a3',
      initialOpen: true,
      acceptedCategories: ['cup', 'spoon'],
      isTargetZone: true,
      targetLabel: '水槽（杯、勺放这里）',
      modelAssetId: 'furniture/kitchenSink',
    },
    {
      id: 'cnt-cabinet',
      name: '橱柜',
      room: 'dining',
      // position.y=0 让 furniture/kitchenCabinetDrawer GLB 贴地；surfaceHeight 对齐 effectiveAabb.y=0.563
      position: { x: -1.8, y: 0, z: 1.8 },
      size: { x: 0.538, y: 0.563, z: 0.600 },
      surfaceHeight: 0.563,
      color: '#92400e',
      initialOpen: true,
      acceptedCategories: ['plate', 'fork'],
      isTargetZone: true,
      targetLabel: '橱柜（盘、叉放这里）',
      modelAssetId: 'furniture/kitchenCabinetDrawer',
    },
  ],

  goals: [
    {
      id: 'g-mug-sink',
      description: '马克杯放入水槽',
      memoryType: 'object',
      relatedObjectIds: ['obj-mug'],
      predicate: (entities: EntityStateSnapshot[]) => {
        const mug = entities.find((e) => e.configId === 'obj-mug')
        return mug?.placedIn === 'cnt-kitchen-sink'
      },
      achievedMessage: '马克杯已放入水槽！',
    },
    {
      id: 'g-plate-cabinet',
      description: '盘子放入橱柜',
      memoryType: 'object',
      relatedObjectIds: ['obj-plate'],
      predicate: (entities: EntityStateSnapshot[]) => {
        const plate = entities.find((e) => e.configId === 'obj-plate')
        return plate?.placedIn === 'cnt-cabinet'
      },
      achievedMessage: '盘子已放入橱柜！',
    },
    {
      id: 'g-fork-cabinet',
      description: '叉子放入橱柜',
      memoryType: 'object',
      relatedObjectIds: ['obj-fork'],
      predicate: (entities: EntityStateSnapshot[]) => {
        const fork = entities.find((e) => e.configId === 'obj-fork')
        return fork?.placedIn === 'cnt-cabinet'
      },
      achievedMessage: '叉子已放入橱柜！',
    },
    {
      id: 'g-spoon-sink',
      description: '勺子放入水槽',
      memoryType: 'object',
      relatedObjectIds: ['obj-spoon'],
      predicate: (entities: EntityStateSnapshot[]) => {
        const spoon = entities.find((e) => e.configId === 'obj-spoon')
        return spoon?.placedIn === 'cnt-kitchen-sink'
      },
      achievedMessage: '勺子已放入水槽！',
    },
    {
      id: 'g-observe',
      description: '保存过位置记忆',
      kind: 'milestone',
      memoryType: 'spatial',
      predicate: (_entities: EntityStateSnapshot[], _snapshot?: EntityStateSnapshot[], ctx?: StageContext) =>
        (ctx?.memorySlots ?? []).some((s) => s !== null),
      achievedMessage: '已记录物品位置！',
    },
  ],

  scriptedEvents: [
    {
      id: 'se-welcome',
      trigger: (step: number) => step === 1,
      type: 'message',
      message: '👋 MEM-07：「欢迎！看看餐桌上有四件餐具——马克杯、盘子、叉子和勺子。记住有几件、分别是什么。」',
      description: '欢迎提示，介绍四件物品',
      memoryType: 'spatial',
      toastType: 'info' as const,
    },
    {
      id: 'se-memory-hint',
      trigger: (
        step: number,
        _entities: EntityStateSnapshot[],
        _currentRoom: RoomId,
        _rooms: Record<string, { id: RoomId; name?: string; center?: { x: number; z?: number; y?: number } }> | undefined,
        ctx: StageContext | undefined,
      ) => (step ?? 0) >= 2 && (ctx?.memorySlots ?? []).every((s) => s === null),
      type: 'message',
      message: '🧠 MEM-07：「先靠近一件餐具，按 E 键保存它的位置记忆。一定要先存记忆再操作！」',
      description: '提示按 E 保存记忆（未保存记忆时出现）',
      memoryType: 'spatial',
      toastType: 'info' as const,
    },
    {
      id: 'se-place-hint',
      trigger: (
        _step: number,
        _entities: EntityStateSnapshot[],
        _currentRoom: RoomId,
        _rooms: Record<string, { id: RoomId; name?: string; center?: { x: number; z?: number; y?: number } }> | undefined,
        ctx: StageContext | undefined,
      ) => {
        const held = ctx?.heldEntityConfigId
        return !!held && !(ctx?.triggeredEvents ?? new Set()).has('se-place-hint')
      },
      type: 'message',
      message: '📦 MEM-07：「拿着物品靠近发光的目标区，按 F 键放置。马克杯、勺子 → 水槽；盘子、叉子 → 橱柜。」',
      description: '拾取手持后提示放置',
      memoryType: 'object',
      toastType: 'info' as const,
    },
    {
      id: 'se-cat-moves-spoon',
      // 确定性触发（OVERRIDES）：玩家保存记忆 + 靠近厨房水槽后触发，固定位置，不随机
      trigger: (
        _step: number,
        _entities: EntityStateSnapshot[],
        currentRoom: RoomId,
        rooms: Record<string, { id: RoomId; name?: string; center?: { x: number; z?: number; y?: number } }> | undefined,
        ctx: StageContext | undefined,
      ) => {
        if (!ctx) return false
        if (ctx.triggeredEvents.has('se-cat-moves-spoon')) return false
        // 1) 必须已保存记忆
        if (!ctx.memorySlots.some((s) => s !== null)) return false
        // 2) 必须在 dining 房间
        if (currentRoom !== 'dining') return false
        // 3) 必须靠近厨房水槽（世界坐标距离判定）
        const diningCenter = rooms?.dining?.center
        if (!diningCenter) return false
        const sinkWorldX = diningCenter.x + KITCHEN_SINK_LOCAL.x
        const sinkWorldZ = (diningCenter.z ?? 0) + KITCHEN_SINK_LOCAL.z
        const dx = ctx.playerPosition.x - sinkWorldX
        const dz = ctx.playerPosition.z - sinkWorldZ
        return Math.hypot(dx, dz) <= SINK_PROXIMITY_THRESHOLD
      },
      type: 'move-entity',
      targetId: 'obj-spoon',
      targetPosition: { room: 'dining', x: 0.8, y: 0.025, z: 0.6 },
      message: '🐱 突然，一只猫跳上餐桌，把勺子拨到了地上！\nMEM-07：「我的计数记忆...桌上原来有 4 件餐具，现在少了一件。记得找到勺子！」',
      description: '猫把勺子从餐桌移到地上，触发符号记忆失效',
      memoryType: 'object',
      markMemoryOutdated: 'obj-spoon',
      eventEffect: 'cat-prints',
      toastType: 'cat' as const,
    },
    {
      id: 'se-perturbed-hint',
      trigger: (
        _step: number,
        _entities: EntityStateSnapshot[],
        _currentRoom: RoomId,
        _rooms: Record<string, { id: RoomId; name?: string; center?: { x: number; z?: number; y?: number } }> | undefined,
        ctx: StageContext | undefined,
      ) => {
        if (!ctx) return false
        // StageContext 不暴露 currentStageId；猫事件触发后阶段即切到 stage-perturbed，
        // 故以 cat 事件已触发且本提示未出现过为判定
        return ctx.triggeredEvents.has('se-cat-moves-spoon') &&
          !(ctx.triggeredEvents ?? new Set()).has('se-perturbed-hint')
      },
      type: 'message',
      message: '🔍 MEM-07：「勺子被猫移到了地上！找到它，把四件餐具归位：杯、勺 → 水槽；盘、叉 → 橱柜。」',
      description: '扰动后提示找回勺子并归位',
      memoryType: 'object',
      toastType: 'info' as const,
    },
  ],

  probes: [
    {
      id: 'p-count-items',
      type: 'count',
      question: '餐桌上一开始共有几件餐具？',
      options: ['2', '3', '4', '5'],
      correctAnswer: '4',
      dependsOnMemoryType: 'object',
      difficulty: 'easy',
      hint: '想想猫来之前桌上的情况',
    },
    {
      id: 'p-missing-item',
      type: 'recognition',
      question: '哪件餐具被猫移走了？',
      options: ['马克杯', '盘子', '叉子', '勺子'],
      correctAnswer: '勺子',
      dependsOnMemoryType: 'object',
      difficulty: 'medium',
      hint: '回忆猫的恶作剧',
    },
    {
      id: 'p-mug-location',
      type: 'location',
      question: '马克杯一开始放在哪里？',
      options: ['餐桌上', '水槽里', '橱柜里'],
      correctAnswer: '餐桌上',
      dependsOnMemoryType: 'spatial',
      difficulty: 'easy',
    },
    {
      id: 'p-spoon-destination',
      type: 'location',
      question: '勺子应该归位到哪里？',
      options: ['水槽', '橱柜', '餐桌'],
      correctAnswer: '水槽',
      dependsOnMemoryType: 'procedural',
      difficulty: 'easy',
    },
  ],
}
