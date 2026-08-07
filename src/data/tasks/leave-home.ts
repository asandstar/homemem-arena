// 关卡 2：睡前仪式（旗舰关）
// 目标：观察主人的睡前仪式示范，记住动作顺序，然后按序把书放书架、杯子放床头柜、小熊放床上
// 记忆类型：程序记忆（Procedural Memory · 动作序列）+ 空间记忆（物体位置）
// 核心循环：观察示范（scriptedEvent 轻量演示）→ 按序复现三步动作序列 → 完成
// 策略要点：3 件物品初始都在客厅茶几上；仪式顺序为 📖书→☕杯子→🧸小熊（place 序列）；
//           错误顺序时拒绝放置并保持 held，玩家可放回茶几换手后重新按序放置
//
// TECH_DEBT：内部 task id 仍为 'task-leave-home'（历史出门大作战），显示名已改为"睡前仪式"。
//            避免破坏 PUBLIC_LEVEL_ORDER / 存档 / 路由 / e2e 等下游引用。
//
// 研究展示（RoboMEME）：
// - Procedural Memory 用于 motion mimicking（动作模仿）
// - 玩家先观察主人睡前的固定仪式（scriptedEvent 演示），再在 REPRODUCE 阶段复现动作序列
// - 序列错误时拒绝放置并保持 held，给出短提示，玩家可放回茶几换手重新按序放置来纠正
// - 研究数据点：序列复现准确率、错误步骤分布、纠正策略、观察→复现延迟

import type { EntityStateSnapshot, StageContext, TaskConfig } from '../../types/task'

const STAGE_ID_DEMO = 'STAGE_DEMO'
const STAGE_ID_REPRODUCE = 'STAGE_REPRODUCE'

// 睡前仪式序列 goal id（与 requiredSequence 关联，proceduralProgress 以此为 key）
const GOAL_ID_RITUAL = 'g-ritual-sequence'

/**
 * Proceptual/Procedural Memory：睡前仪式动作序列是否已按序复现完成。
 * requiredSequence 为 place 序列（📖书→☕杯子→🧸小熊），由 checkProceduralAction 推进。
 * 玩家若乱序放置到目标区，placeEntity 会拒绝放置并保持 held（不推进进度）；
 * 玩家可放回茶几（非目标区，不触发序列检查）换手后重新按序放置。
 */
function hasRitualSequenceCompleted(ctx: StageContext): boolean {
  const progress = ctx.proceduralProgress?.[GOAL_ID_RITUAL]
  return !!progress?.completed
}

export const leaveHomeTask: TaskConfig = {
  id: 'task-leave-home',
  name: '睡前仪式',
  description:
    '🌙 临睡前，主人有一套固定的睡前仪式。观察主人的示范，记住动作顺序，然后依次把书放回书架、杯子放到床头柜、小熊放到床上——顺序可不能错哦！',
  memoryTypes: ['procedural', 'spatial'],
  difficulty: 'easy',
  rooms: ['living', 'bedroom'],
  iconKey: 'door',
  tags: ['程序记忆', '动作序列', '睡前仪式', '观察复现'],
  initialStageId: STAGE_ID_DEMO,
  briefing: `🌙 临睡前 · 主人的睡前仪式

📋 观察主人的睡前仪式示范，记住三步动作顺序：
  📖 书     → 客厅书架
  ☕ 杯子   → 卧室床头柜
  🧸 小熊   → 卧室床上

🧠 程序记忆（Procedural Memory · 记住顺序！）：
  ① 📖 先把书放回书架
  ② ☕ 再把杯子放到床头柜
  ③ 🧸 最后把小熊放到床上

💡 小贴士：三件物品都在客厅茶几上；放错顺序会被拒绝，可放回茶几换手重试。`,
  completionText:
    '主人看着整齐的书架、放好的杯子和床上的小熊，微笑着说：「小橡你记性真好，仪式一步不差！」夜色温柔，灯光渐暗。',
  failureText:
    '主人揉揉眼睛：「顺序怎么不对呀……今晚算了，明天再练吧。」小熊从床上滚落，似乎也在摇头。',
  systemPrompt:
    '【MEM-07 日志】任务：协助主人完成睡前仪式。三件物品均在客厅茶几上：书、杯子、小熊。主人睡前仪式顺序：📖书→书架 → ☕杯子→床头柜 → 🧸小熊→床（Procedural Memory 动作序列，REPRODUCE 阶段按序放置到目标区）。策略：先观看示范，再按序拾取并放置。放错顺序会被拒绝并保持手持，可放回茶几换手重试。',
  timeLimit: 180,
  spawnPosition: { x: -0.5, z: 1.5 },
  spawnRotation: Math.PI,

  stages: [
    {
      id: STAGE_ID_DEMO,
      playerObjective: '👀 观看主人的睡前仪式示范，记住动作顺序！',
      entryCondition: () => true,
      completionCondition: (ctx) => ctx.triggeredEvents.has('se-ritual-demo-done'),
      nextStage: STAGE_ID_REPRODUCE,
    },
    {
      id: STAGE_ID_REPRODUCE,
      playerObjective: '🧠 按睡前仪式顺序依次放置：📖书→书架 → ☕杯子→床头柜 → 🧸小熊→床。放错可放回茶几换手！',
      entryCondition: (ctx) => ctx.triggeredEvents.has('se-ritual-demo-done'),
      completionCondition: (ctx) => hasRitualSequenceCompleted(ctx),
      nextStage: null,
    },
  ],

  objects: [
    {
      id: 'obj-books',
      name: '书',
      category: 'book',
      initialRoom: 'living',
      initialPosition: { x: -0.3, y: 0, z: 0.3 },
      surfaceContainerId: 'cnt-coffee-table',
      size: { x: 0.22, y: 0.08, z: 0.16 },
      color: '#3b82f6',
      modelAssetId: 'furniture/books',
    },
    {
      id: 'obj-mug',
      name: '马克杯',
      category: 'cup',
      initialRoom: 'living',
      initialPosition: { x: 0.3, y: 0, z: 0.3 },
      surfaceContainerId: 'cnt-coffee-table',
      size: { x: 0.14, y: 0.12, z: 0.14 },
      color: '#dc2626',
      modelAssetId: 'food/mug',
    },
    {
      id: 'obj-bear',
      name: '玩具熊',
      category: 'toy',
      initialRoom: 'living',
      initialPosition: { x: 0, y: 0, z: 0.3 },
      surfaceContainerId: 'cnt-coffee-table',
      size: { x: 0.22, y: 0.28, z: 0.20 },
      color: '#a16207',
      modelAssetId: 'furniture/bear',
    },
  ],

  containers: [
    {
      id: 'cnt-coffee-table',
      name: '茶几',
      room: 'living',
      position: { x: 0, y: 0.2, z: 0.3 },
      size: { x: 1.4, y: 0.45, z: 0.7 },
      surfaceHeight: 0.45,
      color: '#8b5a2b',
      initialOpen: true,
      acceptedCategories: [],
      // 台面是"表面"语义，拿起东西后可以临时放回台面换手
      acceptAny: true,
      // A6-H7：茶几唯一视觉所有者。Container3D 检测此字段后使用 RegisteredModel
      // 渲染 Kenney tableCoffee GLB；加载失败回退到 FurnitureModel 程序化 CoffeeTable。
      modelAssetId: 'furniture/tableCoffee',
    },
    {
      id: 'cnt-bookcase',
      name: '书架',
      room: 'living',
      // 与 decor-bookshelf (x=2.75, z=1.5) 同位：作为目标区放置点。
      // 不设 modelAssetId（由 decor-bookshelf 承担 GLB 视觉），避免双重渲染。
      // 小尺寸 + isTargetZone pulseRing 作为"放书到这里"的标记。
      // size.x=0.30 使 AABB 边缘 2.75+0.15=2.90 ≤ living 房间边界 2.90（WALL_MARGIN=0.35）
      // position.y=0.85 + size.y=0.05 → 盒顶在 y=0.90，与 surfaceHeight 对齐，
      //   书落下后正好落在 Kenney bookcaseOpen GLB 的中间层板高度（~0.8~1.0m），
      //   既不悬浮也不穿过模型；同时满足 qa-layout "surfaceHeight ≤ 盒顶+0.5" 的约束。
      position: { x: 2.75, y: 0.85, z: 1.5 },
      size: { x: 0.30, y: 0.05, z: 0.4 },
      surfaceHeight: 0.9,
      color: '#92400e',
      initialOpen: true,
      acceptedCategories: ['book'],
      isTargetZone: true,
      targetLabel: '书架（目标区）',
    },
    {
      id: 'cnt-nightstand',
      name: '床头柜',
      room: 'bedroom',
      position: { x: 0.95, y: 0.4, z: 0.95 },
      size: { x: 0.58, y: 0.605, z: 0.84 },
      surfaceHeight: 0.605,
      color: '#4a3728',
      initialOpen: true,
      acceptedCategories: ['cup'],
      isTargetZone: true,
      targetLabel: '床头柜（目标区）',
      // task-container 唯一视觉所有者：Container3D 用 RegisteredModel 渲染 cabinetBedDrawer GLB。
      modelAssetId: 'furniture/cabinetBedDrawer',
    },
    {
      id: 'cnt-bed',
      name: '床',
      room: 'bedroom',
      // 与 decor-bed (0, -0.8) 同位：作为目标区放置点。
      // 不设 modelAssetId（由 decor-bed 承担 GLB 视觉），避免双重渲染。
      // 小尺寸 + isTargetZone pulseRing 作为"放小熊到这里"的标记。
      position: { x: 0, y: 0, z: -0.8 },
      size: { x: 0.6, y: 0.05, z: 0.4 },
      surfaceHeight: 0.5,
      color: '#7c3aed',
      initialOpen: true,
      acceptedCategories: ['toy'],
      isTargetZone: true,
      targetLabel: '床（目标区）',
    },
  ],

  goals: [
    // ========== Perceptual/Procedural Memory · 睡前仪式动作序列 ==========
    // 玩家观察主人睡前仪式示范（se-ritual-demo-*）后，在 REPRODUCE 阶段按序复现：
    //   📖书 → 书架  →  ☕杯子 → 床头柜  →  🧸小熊 → 床
    // requiredSequence 仅在 STAGE_DEMO 完成（se-ritual-demo-done 触发）后激活，
    // 因为 goal 无 dependsOnGoalIds，checkProceduralAction 在所有阶段都会检查。
    // 但 placeEntity 仅对 isTargetZone 容器调用 checkProceduralAction，
    // 且 STAGE_DEMO 期间玩家拾取/放回茶几不影响序列（非目标区不检查）。
    // 玩家放错顺序到目标区会被拒绝并保持 held，可放回茶几换手后重新按序放置。
    {
      id: GOAL_ID_RITUAL,
      description: '按睡前仪式顺序放置：📖书→书架 → ☕杯子→床头柜 → 🧸小熊→床',
      priority: 'high',
      memoryType: 'procedural',
      kind: 'terminal-constraint',
      stage: STAGE_ID_REPRODUCE,
      predicate: (_entities: EntityStateSnapshot[], _snap: EntityStateSnapshot[] | undefined, ctx: StageContext | undefined) =>
        hasRitualSequenceCompleted(ctx ?? ({} as StageContext)),
      achievedMessage: '🧠 睡前仪式序列复现成功！Procedural Memory 已固化。',
      requiredSequence: [
        { action: 'place', targetId: 'obj-books', label: '① 把📖书放回书架' },
        { action: 'place', targetId: 'obj-mug', label: '② 把☕杯子放到床头柜' },
        { action: 'place', targetId: 'obj-bear', label: '③ 把🧸小熊放到床上' },
      ],
    },
  ],

  scriptedEvents: [
    // ========== 轻量示范（仅 scriptedEvent 消息 + 3D 高亮，OVERRIDES 禁止 NPC/Timeline/摄像机演出） ==========
    // 每步 1-2 秒，通过 step 计数触发，示范后物体仍在茶几上（无需重置）。
    {
      id: 'se-ritual-demo-1',
      trigger: (step: number) => step === 2,
      type: 'message',
      message: '📖 示范第 1 步：主人把书放回书架。「睡前先收好书。」',
      description: '睡前仪式示范第 1 步：书→书架',
      memoryType: 'procedural',
      toastType: 'info',
      highlightDemo: {
        targetObjectId: 'obj-books',
        targetContainerId: 'cnt-bookcase',
        color: '#f59e0b',
        durationMs: 1800,
      },
    },
    {
      id: 'se-ritual-demo-2',
      trigger: (step: number) => step === 4,
      type: 'message',
      message: '☕ 示范第 2 步：主人把杯子放到床头柜。「水杯放床边。」',
      description: '睡前仪式示范第 2 步：杯子→床头柜',
      memoryType: 'procedural',
      toastType: 'info',
      highlightDemo: {
        targetObjectId: 'obj-mug',
        targetContainerId: 'cnt-nightstand',
        color: '#60a5fa',
        durationMs: 1800,
      },
    },
    {
      id: 'se-ritual-demo-3',
      trigger: (step: number) => step === 6,
      type: 'message',
      message: '🧸 示范第 3 步：主人把小熊放到床上。「小熊该睡觉啦。」',
      description: '睡前仪式示范第 3 步：小熊→床',
      memoryType: 'procedural',
      toastType: 'info',
      highlightDemo: {
        targetObjectId: 'obj-bear',
        targetContainerId: 'cnt-bed',
        color: '#f472b6',
        durationMs: 1800,
      },
    },
    {
      id: 'se-ritual-demo-done',
      trigger: (step: number) => step === 8,
      type: 'message',
      message: '✅ 示范结束！现在请你按照刚才的顺序完成睡前仪式：📖书→书架 → ☕杯子→床头柜 → 🧸小熊→床。',
      description: '睡前仪式示范完成，进入复现阶段',
      memoryType: 'procedural',
      toastType: 'success',
    },
  ],

  probes: [
    {
      id: 'p-ritual-sequence',
      type: 'sequence',
      question: '🧠 睡前仪式的正确顺序是？',
      options: [
        '📖书→☕杯子→🧸小熊',
        '☕杯子→📖书→🧸小熊',
        '🧸小熊→📖书→☕杯子',
        '📖书→🧸小熊→☕杯子',
      ],
      correctAnswer: '📖书→☕杯子→🧸小熊',
      dependsOnMemoryType: 'procedural',
      difficulty: 'medium',
      hint: '回忆主人睡前的三步示范',
      relatedEventIds: ['se-ritual-demo-1', 'se-ritual-demo-2', 'se-ritual-demo-3'],
    },
    {
      id: 'p-ritual-first-step',
      type: 'sequence',
      question: '🧠 睡前仪式中，第一件该放回原位的是？',
      options: ['📖 书', '☕ 杯子', '🧸 小熊', '先关灯'],
      correctAnswer: '📖 书',
      dependsOnMemoryType: 'procedural',
      difficulty: 'easy',
      hint: '主人睡前第一件事是收好书',
      relatedEventIds: ['se-ritual-demo-1'],
    },
  ],
}
