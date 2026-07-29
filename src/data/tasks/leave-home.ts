// 关卡 2：出门大作战
// 目标：找到钥匙、手机、雨伞放到玄关托盘（必须使用记忆：保存→过期→更新）
// 记忆类型：空间记忆 + 物体位置记忆
// 核心循环：观察→保存记忆→离开→猫事件移动钥匙→记忆过期→重新确认→更新记忆→完成
// 策略要点：3 个记忆槽对应 3 个目标物品；关键物品锁定仅防覆盖，不阻止真实世界导致的过期

import type { EntityStateSnapshot, StageContext, TaskConfig } from '../../types/task'

const STAGE_ID_OBSERVE_FETCH = 'stage-observe-fetch'
const STAGE_ID_KEY_OUTDATED = 'stage-key-outdated'
const STAGE_ID_FINALIZE = 'stage-finalize'

function hasKeySavedAnyMemory(ctx: StageContext): boolean {
  return ctx.memorySlots.some((s) => s !== null && s.entityConfigId === 'obj-key')
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
  if (ctx.heldEntityConfigId === 'obj-phone') return true
  if (entityPlacedIn(ctx.entities, 'obj-phone', 'cnt-entrance-tray')) return true
  const phone = ctx.entities.find((e) => e.configId === 'obj-phone')
  return !!phone && phone.status === 'held'
}

function hasUmbrellaObtained(ctx: StageContext): boolean {
  if (ctx.heldEntityConfigId === 'obj-umbrella') return true
  if (entityPlacedIn(ctx.entities, 'obj-umbrella', 'cnt-entrance-tray')) return true
  const u = ctx.entities.find((e) => e.configId === 'obj-umbrella')
  return !!u && u.status === 'held'
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
  initialStageId: STAGE_ID_OBSERVE_FETCH,
  briefing: `🌅 早上 8:00 · 主人出门前准备

📋 找到 3 样东西并放到「玄关托盘」：
  🔑 钥匙   → 客厅茶几（金色小件）
  📱 手机   → 卧室床头柜抽屉（先按 F 开抽屉）
  ☂️ 雨伞   → 玄关伞架

💡 小贴士：靠近物品按 E 保存位置记忆；沙发上的猫会扒拉钥匙！`,
  completionText:
    '主人冲出门前看了一眼托盘：「钥匙、手机、雨伞都找到了！小橡你太靠谱了！」\n猫跳上窗台，甩了甩尾巴。明天，它大概还会来。',
  failureText:
    '主人翻遍口袋，叹了口气：「算了...今天蹭同事车吧。」\n似乎听见沙发缝里传来金属碰撞声。猫的耳朵动了一下。',
  systemPrompt:
    '【MEM-07 日志】任务：协助主人出门。三件物品：钥匙客厅茶几；手机卧室床头柜抽屉（需开抽屉）；雨伞玄关伞架。策略：先 save 再取，猫会在玩家离开客厅或拿到手机后扒拉钥匙，记得更新记忆。',
  timeLimit: 180,
  spawnPosition: { x: 0, z: -1.5 },
  spawnRotation: Math.PI,

  stages: [
    {
      id: STAGE_ID_OBSERVE_FETCH,
      playerObjective: '找到钥匙、手机、雨伞。靠近物品时按 E 保存它们的位置！',
      entryCondition: () => true,
      completionCondition: (ctx) => hasKeySavedAnyMemory(ctx) && hasPhoneObtained(ctx) && hasUmbrellaObtained(ctx),
      nextStage: STAGE_ID_KEY_OUTDATED,
    },
    {
      id: STAGE_ID_KEY_OUTDATED,
      playerObjective: '🔴 钥匙记忆已过期！回到客厅重新找到钥匙，找到后按 E 更新记忆。',
      entryCondition: (ctx) => {
        if (!catEventTriggered(ctx)) return false
        // 要么已过期，要么压根没 fresh 的，都算进入"过期更新阶段"
        if (hasKeyOutdatedMemory(ctx)) return true
        if (!hasKeyFreshMemory(ctx) && hasKeySavedAnyMemory(ctx)) return true
        return false
      },
      completionCondition: (ctx) => catEventTriggered(ctx) && ctx.memoryUpdateCount >= 1 && hasKeyFreshMemory(ctx),
      nextStage: STAGE_ID_FINALIZE,
    },
    {
      id: STAGE_ID_FINALIZE,
      playerObjective: '把钥匙、手机、雨伞都放进玄关托盘，完成出门准备！',
      entryCondition: (ctx) => catEventTriggered(ctx) && hasKeyFreshMemory(ctx) && ctx.memoryUpdateCount >= 1,
      completionCondition: (ctx) => {
        const keyOnTray = entityPlacedIn(ctx.entities, 'obj-key', 'cnt-entrance-tray')
        const phoneOnTray = entityPlacedIn(ctx.entities, 'obj-phone', 'cnt-entrance-tray')
        const umbrellaOnTray = entityPlacedIn(ctx.entities, 'obj-umbrella', 'cnt-entrance-tray')
        // 钥匙在 tray 上时允许 memory 过期（因为物理上已经归位了，记忆过期不再是问题）
        const keyMemoryOk = keyOnTray || (hasKeyFreshMemory(ctx) && ctx.memoryUpdateCount >= 1)
        return keyOnTray && phoneOnTray && umbrellaOnTray && catEventTriggered(ctx) && keyMemoryOk
      },
      nextStage: null,
    },
  ],

  objects: [
    {
      id: 'obj-key',
      name: '钥匙',
      category: 'key',
      initialRoom: 'living',
      initialPosition: { x: 0, y: 0, z: 0.3 },
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
      position: { x: 0, y: 0.2, z: 0.3 },
      size: { x: 1.4, y: 0.45, z: 0.7 },
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
      stage: STAGE_ID_OBSERVE_FETCH,
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
      stage: STAGE_ID_OBSERVE_FETCH,
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
      stage: STAGE_ID_KEY_OUTDATED,
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
      // 放宽依赖：只要钥匙已经被更新过（里程碑已到）就行，不强制 fresh（因为钥匙可能先被放好）
      dependsOnGoalIds: ['g-stage-key-updated'],
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
        const key = entities.find((e: EntityStateSnapshot) => e.configId === 'obj-key')
        const keyFreshSaved =
          !!ctx?.memorySlots.some(
            (s: { entityConfigId: string; outdated: boolean; locked: boolean; confidence: number; timestamp: number } | null) => s && s.entityConfigId === 'obj-key' && !s.outdated,
          )
        const keyFree = !!key && key.currentRoom === 'living' && key.status === 'free'
        const leftLiving = currentRoom !== 'living'
        // 放宽触发：(a) 原条件（存了 fresh 钥匙 + 离开客厅 + 钥匙 free）
        //        或 (b) 玩家已经拿到手机（不管有没有存钥匙记忆，都让猫捣乱）
        const phoneObtained = hasPhoneObtained(ctx as StageContext)
        return (!!keyFreshSaved && !!keyFree && !!leftLiving) || (!!keyFree && phoneObtained)
      },
      type: 'move-entity',
      targetId: 'obj-key',
      targetPosition: { room: 'living', x: -6, y: 0, z: -3 },
      message: '🐱 啪嗒——钥匙猫扒拉了你的钥匙！它不在原来的位置了…客厅沙发附近找找？按 E 更新记忆吧。',
      description: '钥匙猫把钥匙从茶几推到了沙发旁边',
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
        // 阶段 1 期间，或钥匙记忆已保存时，响铃提示手机位置
        const keySaved =
          !!ctx?.memorySlots.some((s: { entityConfigId: string; outdated: boolean; locked: boolean; confidence: number; timestamp: number } | null) => s && s.entityConfigId === 'obj-key')
        const stageStarted = true
        return (
          !!stageStarted &&
          !!keySaved &&
          (step ?? 0) >= 3 &&
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
        const keySaved = !!ctx?.memorySlots.some((s: { entityConfigId: string; outdated: boolean; locked: boolean; confidence: number; timestamp: number } | null) => s && s.entityConfigId === 'obj-key')
        return !keySaved && ((_step ?? 0) >= 2)
      },
      type: 'message',
      message:
        '💡 提示：靠近物品时按 E 保存位置记忆。',
      description: '记忆系统引导提示',
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
  ],
}
