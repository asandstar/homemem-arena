// 关卡 2：出门大作战
// 目标：找到钥匙、手机、雨伞放到玄关托盘（必须使用记忆：保存→过期→更新）
// 记忆类型：空间记忆 + 物体位置记忆
// 核心循环：观察→保存记忆→离开→猫事件移动钥匙→记忆过期→重新确认→更新记忆→完成
// 策略要点：3 个记忆槽对应 3 个目标物品；关键物品锁定仅防覆盖，不阻止真实世界导致的过期

import type { EntityStateSnapshot, StageContext, TaskConfig } from '../../types/task'

const STAGE_ID_OBSERVE_KEY = 'stage-observe-key'
const STAGE_ID_FETCH_PHONE = 'stage-fetch-phone'
const STAGE_ID_KEY_OUTDATED = 'stage-key-outdated'
const STAGE_ID_UPDATE_KEY = 'stage-update-key-memory'
const STAGE_ID_FINALIZE = 'stage-finalize'

function hasKeySavedMemory(ctx: StageContext): boolean {
  return ctx.memorySlots.some((s) => s !== null && s.entityConfigId === 'obj-key' && !s.outdated)
}

function hasKeyFreshMemory(ctx: StageContext): boolean {
  return ctx.memorySlots.some((s) => s !== null && s.entityConfigId === 'obj-key' && !s.outdated)
}

function hasKeyOutdatedMemory(ctx: StageContext): boolean {
  return ctx.memorySlots.some((s) => s !== null && s.entityConfigId === 'obj-key' && s.outdated)
}

function catEventTriggered(ctx: StageContext): boolean {
  return ctx.triggeredEvents.has('se-cat-pushes-key')
}

function entityPlacedIn(entities: EntityStateSnapshot[], configId: string, containerId: string): boolean {
  const e = entities.find((x) => x.configId === configId)
  return !!e && e.placedIn === containerId && e.status === 'placed'
}

function hasPhoneObtained(ctx: StageContext): boolean {
  // 手机已经被"取得"的判定：手持中，或已放置到玄关托盘
  if (ctx.heldEntityConfigId === 'obj-phone') return true
  if (entityPlacedIn(ctx.entities, 'obj-phone', 'cnt-entrance-tray')) return true
  const phone = ctx.entities.find((e) => e.configId === 'obj-phone')
  return !!phone && phone.status === 'held'
}

export const leaveHomeTask: TaskConfig = {
  id: 'task-leave-home',
  name: '出门大作战',
  description:
    '🌅 早上八点，主人要出门上班啦！可是钥匙猫又开始调皮了，把钥匙扒拉得到处都是。快找到钥匙、手机和雨伞，在主人迟到之前放到玄关托盘上吧！',
  memoryTypes: ['spatial', 'object'],
  difficulty: 'easy',
  rooms: ['living', 'entrance', 'bedroom'],
  iconKey: 'door',
  tags: ['空间记忆', '限时挑战', '钥匙猫'],
  initialStageId: STAGE_ID_OBSERVE_KEY,
  briefing: `🌅 早上 8:00 · 主人还有 10 分钟出门

玄关贴着便签：「小橡！钥匙！手机！雨伞！拜托了！——再不走就赶不上公交了」

📋 物品清单：
  🔑 钥匙 → 客厅茶几上（金色小物件）
  📱 手机 → 卧室床头柜抽屉里（需要先打开抽屉）
  ☂️ 雨伞 → 玄关伞架上

⚠️ 注意：沙发上有只猫，眼神不太 innocent...手机可能会响铃提示位置！
💡 提示：你只有3个记忆槽，合理分配很重要！关键物品记得锁定！锁定≠阻止过期哦，锁只防止被覆盖。`,
  completionText:
    '主人冲出门前看了一眼托盘：「钥匙、手机、雨伞都找到了！小橡你太靠谱了！」\n猫跳上窗台，甩了甩尾巴。明天，它大概还会来。',
  failureText:
    '主人翻遍口袋，叹了口气：「算了...今天蹭同事车吧。」\n似乎听见沙发缝里传来金属碰撞声。猫的耳朵动了一下。',
  systemPrompt:
    '【MEM-07 日志】任务：协助主人出门。当前状态：钥匙位置待确认，手机位置待搜索，雨伞位置已知。策略：优先确认关键物品，合理分配记忆槽。注意，锁定只能防止覆盖，不能阻止真实世界导致的过期。',
  timeLimit: 180,
  spawnPosition: { x: 0, z: -1.5 },
  spawnRotation: Math.PI,

  stages: [
    {
      id: STAGE_ID_OBSERVE_KEY,
      playerObjective: '靠近钥匙，按 E 记录它的位置。',
      entryCondition: () => true,
      completionCondition: (ctx) => hasKeySavedMemory(ctx),
      nextStage: STAGE_ID_FETCH_PHONE,
    },
    {
      id: STAGE_ID_FETCH_PHONE,
      playerObjective: '找到手机。钥匙的记忆已经过期，拿到手机后回客厅确认。',
      entryCondition: (ctx) => hasKeySavedMemory(ctx),
      // Sprint B.1 修正：必须同时满足"猫事件触发" + "手机已取得（held 或已放托盘）"，才推进到 key-outdated。
      // 猫叫一声 ≠ 玩家已经找到手机。
      completionCondition: (ctx) => catEventTriggered(ctx) && hasPhoneObtained(ctx),
      nextStage: STAGE_ID_KEY_OUTDATED,
    },
    {
      id: STAGE_ID_KEY_OUTDATED,
      playerObjective: '钥匙的位置记忆已经过期。回到客厅，重新搜索确认钥匙位置。',
      entryCondition: (ctx) => catEventTriggered(ctx) && (hasKeyOutdatedMemory(ctx) || !hasKeyFreshMemory(ctx)),
      // Sprint B.1 修正：不能用"玩家在客厅 + 钥匙 free"就等于"已经找到钥匙"。
      // 必须玩家靠近到钥匙（距离小于交互范围）才算真正"找到"。
      // 使用双重保险：优先用 ctx.nearbyEntityConfigId；同时用 ctx.playerPosition 计算钥匙距离兜底（阈值 0.5 约等于附近可交互）。
      completionCondition: (ctx) => {
        const key = ctx.entities.find((e) => e.configId === 'obj-key')
        if (!key) return false
        const playerPos = (ctx as any).playerPosition as { x: number; z: number } | undefined
        let closeToKey = false
        if (ctx.nearbyEntityConfigId === 'obj-key') {
          closeToKey = true
        } else if (key.position && playerPos) {
          const dx = key.position.x - playerPos.x
          const dz = key.position.z - playerPos.z
          const dist = Math.hypot(dx, dz)
          // 2.0 是 ctx.nearbyEntityConfigId 默认阈值，用 0.5 兜底确保足够近
          if (dist < 0.5) closeToKey = true
        }
        return (
          catEventTriggered(ctx) &&
          hasKeyOutdatedMemory(ctx) &&
          key.currentRoom === 'living' &&
          key.status === 'free' &&
          ctx.currentRoom === 'living' &&
          closeToKey
        )
      },
      nextStage: STAGE_ID_UPDATE_KEY,
    },
    {
      id: STAGE_ID_UPDATE_KEY,
      playerObjective: '按 E 更新钥匙的位置记忆。',
      // entry 条件放宽：只要猫事件已触发且玩家在客厅看到钥匙（free）就可以进入；过期状态不是必须（避免 save 之后瞬时回退）
      entryCondition: (ctx) => {
        const key = ctx.entities.find((e) => e.configId === 'obj-key')
        return (
          catEventTriggered(ctx) &&
          ctx.memoryUpdateCount < 1 &&
          !!key &&
          key.currentRoom === 'living' &&
          key.status === 'free' &&
          ctx.currentRoom === 'living'
        )
      },
      // 完成：钥匙记忆已经新鲜，且 updateCount>=1（确认更新过）
      completionCondition: (ctx) =>
        hasKeyFreshMemory(ctx) && ctx.memoryUpdateCount >= 1 && catEventTriggered(ctx),
      nextStage: STAGE_ID_FINALIZE,
    },
    {
      id: STAGE_ID_FINALIZE,
      playerObjective: '把钥匙、手机、雨伞都放入玄关托盘，完成出门准备。',
      entryCondition: (ctx) =>
        catEventTriggered(ctx) &&
        hasKeyFreshMemory(ctx) &&
        ctx.memoryUpdateCount >= 1 &&
        ctx.memoryUsedCount >= 1,
      completionCondition: (ctx) =>
        entityPlacedIn(ctx.entities, 'obj-key', 'cnt-entrance-tray') &&
        entityPlacedIn(ctx.entities, 'obj-phone', 'cnt-entrance-tray') &&
        entityPlacedIn(ctx.entities, 'obj-umbrella', 'cnt-entrance-tray') &&
        hasKeyFreshMemory(ctx) &&
        ctx.memoryUpdateCount >= 1 &&
        catEventTriggered(ctx) &&
        ctx.memoryUsedCount >= 1,
      nextStage: null,
    },
  ],

  objects: [
    {
      id: 'obj-key',
      name: '钥匙',
      category: 'key',
      initialRoom: 'living',
      initialPosition: { x: -0.5, y: 0, z: -0.3 },
      surfaceContainerId: 'cnt-coffee-table',
      size: { x: 0.2, y: 0.06, z: 0.14 },
      color: '#fbbf24',
    },
    {
      id: 'obj-phone',
      name: '手机',
      category: 'phone',
      initialRoom: 'bedroom',
      initialPosition: { x: 0.5, y: 0, z: 0.75 },
      surfaceContainerId: 'cnt-nightstand',
      hiddenInContainer: 'cnt-nightstand',
      size: { x: 0.18, y: 0.09, z: 0.02 },
      color: '#1f2937',
    },
    {
      id: 'obj-umbrella',
      name: '雨伞',
      category: 'umbrella',
      initialRoom: 'entrance',
      initialPosition: { x: -2.5, y: 0, z: 1.0 },
      surfaceContainerId: 'cnt-umbrella-stand',
      size: { x: 0.15, y: 0.8, z: 0.15 },
      color: '#3b82f6',
    },
  ],

  containers: [
    {
      id: 'cnt-coffee-table',
      name: '茶几',
      room: 'living',
      position: { x: -0.5, y: 0.2, z: -0.3 },
      size: { x: 1.4, y: 0.45, z: 0.7 },
      surfaceHeight: 0.45,
      color: '#8b5a2b',
      initialOpen: true,
      acceptedCategories: [],
    },
    {
      id: 'cnt-sofa-main',
      name: '主沙发',
      room: 'living',
      position: { x: 0, y: 0, z: -1.2 },
      size: { x: 2.4, y: 0.9, z: 1.0 },
      surfaceHeight: 0.45,
      color: '#8b5a2b',
      initialOpen: true,
      acceptedCategories: [],
    },
    {
      id: 'cnt-nightstand',
      name: '床头柜',
      room: 'bedroom',
      position: { x: 0.5, y: 0.4, z: 0.8 },
      size: { x: 0.6, y: 0.5, z: 0.4 },
      surfaceHeight: 0.5,
      color: '#4a3728',
      initialOpen: false,
      acceptedCategories: [],
      isDrawer: true,
      containsObjectIds: ['obj-phone'],
    },
    {
      id: 'cnt-umbrella-stand',
      name: '伞架',
      room: 'entrance',
      position: { x: -2.5, y: 0.4, z: 1.0 },
      size: { x: 0.3, y: 0.4, z: 0.3 },
      surfaceHeight: 0.4,
      color: '#6b7280',
      initialOpen: true,
      acceptedCategories: [],
    },
    {
      id: 'cnt-entrance-tray',
      name: '玄关托盘',
      room: 'entrance',
      position: { x: -1.4, y: 0.5, z: 1.0 },
      size: { x: 0.8, y: 0.1, z: 0.4 },
      surfaceHeight: 0.55,
      color: '#f59e0b',
      initialOpen: true,
      acceptedCategories: ['key', 'phone', 'umbrella'],
      isTargetZone: true,
      targetLabel: '玄关托盘（目标区）',
    },
  ],

  goals: [
    // ========== 阶段里程碑 ==========
    {
      id: 'g-stage-observe-key',
      description: '至少保存过一次钥匙的位置记忆',
      priority: 'high',
      memoryType: 'spatial',
      kind: 'milestone',
      stage: STAGE_ID_OBSERVE_KEY,
      predicate: (_entities: EntityStateSnapshot[], _snap: EntityStateSnapshot[] | undefined, ctx: StageContext | undefined) => {
        return !!ctx?.memorySlots.some(
          (s: { entityConfigId: string; outdated: boolean; locked: boolean; confidence: number; timestamp: number } | null) => s && s.entityConfigId === 'obj-key',
        )
      },
      achievedMessage: '已记录钥匙位置！',
    },
    {
      id: 'g-stage-cat-fired',
      description: '钥匙猫事件已触发',
      priority: 'high',
      memoryType: 'temporal',
      kind: 'milestone',
      stage: STAGE_ID_FETCH_PHONE,
      dependsOnGoalIds: ['g-stage-observe-key'],
      predicate: (_entities: EntityStateSnapshot[], _snap: EntityStateSnapshot[] | undefined, ctx: StageContext | undefined) => !!ctx?.triggeredEvents.has('se-cat-pushes-key'),
      achievedMessage: '调皮的钥匙猫来过了，注意更新记忆！',
    },
    {
      id: 'g-stage-key-updated',
      description: '至少更新过一次钥匙的位置记忆',
      priority: 'high',
      memoryType: 'temporal',
      kind: 'milestone',
      stage: STAGE_ID_UPDATE_KEY,
      dependsOnGoalIds: ['g-stage-cat-fired'],
      predicate: (_entities: EntityStateSnapshot[], _snap: EntityStateSnapshot[] | undefined, ctx: StageContext | undefined) => !!ctx && ctx.memoryUpdateCount >= 1,
      achievedMessage: '已更新钥匙记忆！',
    },
    {
      id: 'g-stage-key-fresh',
      description: '钥匙记忆当前未过期',
      priority: 'high',
      memoryType: 'spatial',
      kind: 'terminal-constraint',
      stage: STAGE_ID_FINALIZE,
      dependsOnGoalIds: ['g-stage-key-updated'],
      predicate: (_entities: EntityStateSnapshot[], _snap: EntityStateSnapshot[] | undefined, ctx: StageContext | undefined) =>
        !!ctx?.memorySlots.some((s: { entityConfigId: string; outdated: boolean; locked: boolean; confidence: number; timestamp: number } | null) => s && s.entityConfigId === 'obj-key' && !s.outdated),
      achievedMessage: '钥匙记忆状态完好，顺利出门！',
    },

    // ========== 归位目标（物品本身） ==========
    {
      id: 'g-key-on-tray',
      description: '钥匙放到玄关托盘',
      priority: 'high',
      memoryType: 'spatial',
      stage: STAGE_ID_FINALIZE,
      dependsOnGoalIds: ['g-stage-key-updated', 'g-stage-key-fresh'],
      predicate: (entities: EntityStateSnapshot[]) => entityPlacedIn(entities, 'obj-key', 'cnt-entrance-tray'),
      achievedMessage: '钥匙已归位！',
    },
    {
      id: 'g-phone-on-tray',
      description: '手机放到玄关托盘',
      priority: 'high',
      memoryType: 'object',
      stage: STAGE_ID_FINALIZE,
      predicate: (entities: EntityStateSnapshot[]) => entityPlacedIn(entities, 'obj-phone', 'cnt-entrance-tray'),
      achievedMessage: '手机已归位！',
    },
    {
      id: 'g-umbrella-on-tray',
      description: '雨伞放到玄关托盘',
      priority: 'medium',
      memoryType: 'spatial',
      stage: STAGE_ID_FINALIZE,
      predicate: (entities: EntityStateSnapshot[]) =>
        entityPlacedIn(entities, 'obj-umbrella', 'cnt-entrance-tray'),
      achievedMessage: '雨伞已归位！',
    },
  ],

  scriptedEvents: [
    {
      id: 'se-cat-pushes-key',
      trigger: (_step: number, entities: EntityStateSnapshot[], currentRoom: import('../../types/room').RoomId, _rooms: Record<string, { id: import('../../types/room').RoomId; name?: string; center?: { x: number; z?: number; y?: number } }> | undefined, ctx: StageContext | undefined) => {
        // 阶段机前置：必须已经保存过钥匙记忆（不是过期的那种必须是有效的）；
        // 并且玩家离开客厅；
        // 钥匙仍处于可移动状态（free，不是 held/placed/hidden）
        const key = entities.find((e: EntityStateSnapshot) => e.configId === 'obj-key')
        const keySaved =
          !!ctx?.memorySlots.some(
            (s: { entityConfigId: string; outdated: boolean; locked: boolean; confidence: number; timestamp: number } | null) => s && s.entityConfigId === 'obj-key' && !s.outdated,
          )
        const keyFree = !!key && key.currentRoom === 'living' && key.status === 'free'
        const leftLiving = currentRoom !== 'living'
        return !!keySaved && !!keyFree && !!leftLiving
      },
      type: 'move-entity',
      targetId: 'obj-key',
      targetPosition: { room: 'living', x: 1.5, y: 0, z: -1.5 },
      message: '🐱 啪嗒——钥匙猫扒拉了你的钥匙！它不在原来的位置了…你关于钥匙位置的记忆可能已经过期，需要回到客厅重新搜索确认。',
      description: '钥匙猫把钥匙从茶几推到了新的位置',
      memoryType: 'spatial',
      markMemoryOutdated: 'obj-key',
      eventEffect: 'cat-prints',
      toastType: 'cat',
    },
    {
      id: 'se-phone-ringing',
      trigger: (step: number, entities: EntityStateSnapshot[], currentRoom: import('../../types/room').RoomId, _rooms: Record<string, { id: import('../../types/room').RoomId; name?: string; center?: { x: number; z?: number; y?: number } }> | undefined, ctx: StageContext | undefined) => {
        const phone = entities.find((e: EntityStateSnapshot) => e.configId === 'obj-phone')
        if (!phone) return false
        // 必须在进入 stage-fetch-phone（钥匙记忆已保存）后才允许响铃
        const stageReached =
          !!ctx?.memorySlots.some((s: { entityConfigId: string; outdated: boolean; locked: boolean; confidence: number; timestamp: number } | null) => s && s.entityConfigId === 'obj-key' && !s.outdated)
        return (
          !!stageReached &&
          step >= 3 &&
          phone.status !== 'placed' &&
          phone.currentRoom === 'bedroom' &&
          currentRoom !== 'bedroom'
        )
      },
      type: 'message',
      message: '📱 卧室方向传来手机铃声！快去床头柜找找吧！',
      description: '手机响铃提示位置',
      memoryType: 'object',
      toastType: 'phone',
    },
    {
      id: 'se-save-hint',
      trigger: (_step: number, _entities: EntityStateSnapshot[], _currentRoom: import('../../types/room').RoomId, _rooms: Record<string, { id: import('../../types/room').RoomId; name?: string; center?: { x: number; z?: number; y?: number } }> | undefined, ctx: StageContext | undefined) => {
        // 提示：玩家在 playing 初期仍未保存钥匙（stage-observe-key 中，且 step>=2 时提醒）
        const keySaved = !!ctx?.memorySlots.some((s: { entityConfigId: string; outdated: boolean; locked: boolean; confidence: number; timestamp: number } | null) => s && s.entityConfigId === 'obj-key')
        return !keySaved && ((_step ?? 0) >= 2)
      },
      type: 'message',
      message:
        '💡 提示：靠近物品时按 E 保存位置记忆。本关必须先记录钥匙位置，否则你会在之后找不到它真正的位置哦！',
      description: '记忆系统引导提示',
      memoryType: 'object',
      toastType: 'info',
    },
    {
      id: 'se-owner-urgent-msg',
      trigger: (_step: number, _entities: EntityStateSnapshot[], _currentRoom: import('../../types/room').RoomId, _rooms: Record<string, { id: import('../../types/room').RoomId; name?: string; center?: { x: number; z?: number; y?: number } }> | undefined, ctx: StageContext | undefined) => {
        // 主人催促：只有在猫事件触发后（stage-key-outdated 之后）才出现，避免前期信息过载
        const fired = !!ctx?.triggeredEvents.has('se-cat-pushes-key')
        return fired && ((_step ?? 0) >= 8)
      },
      type: 'message',
      message: '📱 主人消息：「小橡找到了吗？钥匙、手机、雨伞都要带！我公交车来了！！」',
      description: '主人催促消息',
      memoryType: 'object',
      toastType: 'phone',
    },
    {
      id: 'se-update-hint',
      trigger: (_step: number, _entities: EntityStateSnapshot[], _currentRoom: import('../../types/room').RoomId, _rooms: Record<string, { id: import('../../types/room').RoomId; name?: string; center?: { x: number; z?: number; y?: number } }> | undefined, ctx: StageContext | undefined) => {
        const fired = !!ctx?.triggeredEvents.has('se-cat-pushes-key')
        const outdated = !!ctx?.memorySlots.some(
          (s: { entityConfigId: string; outdated: boolean; locked: boolean; confidence: number; timestamp: number } | null) => s && s.entityConfigId === 'obj-key' && s.outdated,
        )
        return fired && outdated && ((_step ?? 0) >= 10)
      },
      type: 'message',
      message:
        '💡 提示：记忆过期了不要慌！找到物品的新位置之后，再按一次 E 就会更新这条记忆。更新会给你额外的分数哦！',
      description: '更新记忆引导提示',
      memoryType: 'object',
      toastType: 'info',
    },
    {
      id: 'se-memory-lock-hint',
      trigger: (_step: number, _entities: EntityStateSnapshot[], _currentRoom: import('../../types/room').RoomId, _rooms: Record<string, { id: import('../../types/room').RoomId; name?: string; center?: { x: number; z?: number; y?: number } }> | undefined, ctx: StageContext | undefined) => {
        // 锁定提示：完成 stage-fetch-phone（即猫事件触发之后，已经有过期/更新经验之后），或第一次 updateCount>=1 且玩家没锁定过时。
        const updateCount = (ctx?.memoryUpdateCount ?? 0) >= 1
        const usedCount = (ctx?.memoryUsedCount ?? 0) >= 2
        return updateCount && usedCount && ((_step ?? 0) >= 4)
      },
      type: 'message',
      message:
        '🔒 提示：点击记忆槽上的锁图标可以锁定记忆！锁定的记忆不会被新记忆覆盖，但注意——锁定不能阻止真实世界变化导致的记忆过期哦！',
      description: '记忆锁定引导提示',
      memoryType: 'object',
      toastType: 'info',
    },
  ],

  probes: [
    {
      id: 'p-loc-key-original',
      type: 'location',
      question: '钥匙最初放在哪个房间的什么位置？',
      options: ['客厅茶几上', '卧室床头柜抽屉里', '厨房台面上', '玄关伞架旁'],
      correctAnswer: '客厅茶几上',
      dependsOnMemoryType: 'spatial',
      difficulty: 'medium',
    },
    {
      id: 'p-loc-key-moved',
      type: 'location',
      question: '钥匙猫把钥匙推到了哪里？',
      options: ['沙发旁边', '茶几上', '卧室里', '玄关托盘'],
      correctAnswer: '沙发旁边',
      dependsOnMemoryType: 'spatial',
      difficulty: 'medium',
    },
    {
      id: 'p-loc-phone',
      type: 'location',
      question: '手机最初放在哪个房间的什么位置？',
      options: ['卧室床头柜抽屉里', '客厅茶几上', '厨房台面上', '玄关托盘上'],
      correctAnswer: '卧室床头柜抽屉里',
      dependsOnMemoryType: 'object',
      difficulty: 'medium',
    },
    {
      id: 'p-loc-umbrella',
      type: 'location',
      question: '雨伞最初放在哪个房间的什么位置？',
      options: ['玄关伞架上', '客厅沙发上', '卧室床头柜上', '厨房角落里'],
      correctAnswer: '玄关伞架上',
      dependsOnMemoryType: 'spatial',
      difficulty: 'easy',
    },
    {
      id: 'p-memory-used',
      type: 'state',
      question: '你是否使用了记忆系统保存物品位置？',
      options: ['是', '否'],
      correctAnswer: '是',
      dependsOnMemoryType: 'object',
      difficulty: 'easy',
    },
    {
      id: 'p-memory-locked',
      type: 'state',
      question: '你是否使用了记忆锁定功能保护重要物品？（提示：锁定防止覆盖，不阻止过期）',
      options: ['是', '否'],
      correctAnswer: '是',
      dependsOnMemoryType: 'object',
      difficulty: 'easy',
    },
  ],
}
