// 关卡 2：出门大作战
// 目标：找到钥匙、手机、雨伞放到玄关托盘
// 记忆类型：空间记忆 + 物体位置记忆 + 程序记忆
// 核心循环：发现物品 → 保存记忆 → 事件触发移动 → 记忆过期 → 更新记忆 → 完成任务
// 策略要点：3个记忆槽对应3个目标物品，需要合理分配，关键物品优先锁定

import type { TaskConfig } from '../../types/task'
import type { EntityStateSnapshot } from '../../types/task'

export const leaveHomeTask: TaskConfig = {
  id: 'task-leave-home',
  name: '出门大作战',
  description: '🌅 早上八点，主人要出门上班啦！可是钥匙猫又开始调皮了，把钥匙扒拉得到处都是。快找到钥匙、手机和雨伞，在主人迟到之前放到玄关托盘上吧！',
  memoryTypes: ['spatial', 'object'],
  difficulty: 'easy',
  rooms: ['living', 'entrance', 'bedroom'],
  iconKey: 'door',
  tags: ['空间记忆', '限时挑战', '钥匙猫'],
  briefing: `🌅 早上 8:00 · 主人还有 10 分钟出门

玄关贴着便签：「小橡！钥匙！手机！雨伞！拜托了！——再不走就赶不上公交了」

📋 物品清单：
  🔑 钥匙 → 客厅茶几上（金色小物件）
  📱 手机 → 卧室床头柜抽屉里（需要先打开抽屉）
  ☂️ 雨伞 → 玄关伞架上

⚠️ 注意：沙发上有只猫，眼神不太 innocent...手机可能会响铃提示位置！
💡 提示：你只有3个记忆槽，合理分配很重要！关键物品记得锁定！`,
  completionText: '主人冲出门前看了一眼托盘：「钥匙、手机、雨伞都找到了！小橡你太靠谱了！」\n猫跳上窗台，甩了甩尾巴。明天，它大概还会来。',
  failureText: '主人翻遍口袋，叹了口气：「算了...今天蹭同事车吧。」\n似乎听见沙发缝里传来金属碰撞声。猫的耳朵动了一下。',
  systemPrompt: '【MEM-07 日志】任务：协助主人出门。当前状态：钥匙位置待确认，手机位置待搜索，雨伞位置已知。策略：优先确认关键物品，合理分配记忆槽。',
  timeLimit: 180,
  spawnPosition: { x: 0, z: -1.5 },
  spawnRotation: Math.PI,

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
      initialPosition: { x: 0.3, y: 0, z: 0.5 },
      surfaceContainerId: 'cnt-nightstand',
      size: { x: 0.18, y: 0.09, z: 0.02 },
      color: '#1f2937',
    },
    {
      id: 'obj-umbrella',
      name: '雨伞',
      category: 'umbrella',
      initialRoom: 'entrance',
      initialPosition: { x: -2.5, y: 0, z: -2.3 },
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
    },
    {
      id: 'cnt-umbrella-stand',
      name: '伞架',
      room: 'entrance',
      position: { x: -2.5, y: 0.4, z: -2.3 },
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
      position: { x: -1.4, y: 0.5, z: -2.3 },
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
    {
      id: 'g-key-on-tray',
      description: '钥匙放到玄关托盘',
      priority: 'high',
      memoryType: 'spatial',
      relatedObjectIds: ['obj-key'],
      predicate: (entities: EntityStateSnapshot[]) => {
        const key = entities.find((e) => e.configId === 'obj-key')
        return key?.placedIn === 'cnt-entrance-tray' && key.status === 'placed'
      },
      achievedMessage: '钥匙已归位！',
    },
    {
      id: 'g-phone-on-tray',
      description: '手机放到玄关托盘',
      priority: 'high',
      memoryType: 'object',
      relatedObjectIds: ['obj-phone'],
      predicate: (entities: EntityStateSnapshot[]) => {
        const phone = entities.find((e) => e.configId === 'obj-phone')
        return phone?.placedIn === 'cnt-entrance-tray' && phone.status === 'placed'
      },
      achievedMessage: '手机已归位！',
    },
    {
      id: 'g-umbrella-on-tray',
      description: '雨伞放到玄关托盘',
      priority: 'medium',
      memoryType: 'spatial',
      relatedObjectIds: ['obj-umbrella'],
      predicate: (entities: EntityStateSnapshot[]) => {
        const umbrella = entities.find((e) => e.configId === 'obj-umbrella')
        return umbrella?.placedIn === 'cnt-entrance-tray' && umbrella.status === 'placed'
      },
      achievedMessage: '雨伞已归位！',
    },
  ],

  scriptedEvents: [
    {
      id: 'se-cat-pushes-key',
      trigger: (step, entities, currentRoom) => {
        const key = entities.find((e) => e.configId === 'obj-key')
        return step > 2 && currentRoom !== 'living' && key?.currentRoom === 'living' && key?.status === 'free'
      },
      type: 'move-entity',
      targetId: 'obj-key',
      targetPosition: { room: 'living', x: 1.5, y: 0, z: -1.5 },
      message: '🐱 啪嗒——钥匙猫一爪子把钥匙从茶几扒拉到了沙发旁边！（钥匙猫：往沙发方向找找呀喵~）',
      description: '钥匙猫把钥匙从茶几推到了沙发旁',
      memoryType: 'spatial',
      markMemoryOutdated: 'obj-key',
      eventEffect: 'cat-prints',
      toastType: 'cat' as const,
    },
    {
      id: 'se-phone-ringing',
      trigger: (step, entities, currentRoom) => {
        const phone = entities.find((e) => e.configId === 'obj-phone')
        return step >= 3 && phone?.status !== 'placed' && phone?.currentRoom === 'bedroom' && currentRoom !== 'bedroom'
      },
      type: 'message',
      message: '📱 卧室方向传来手机铃声！快去床头柜找找吧！',
      description: '手机响铃提示位置',
      memoryType: 'object',
      toastType: 'phone' as const,
    },
    {
      id: 'se-save-hint',
      trigger: (step) => step === 2,
      type: 'message',
      message: '💡 提示：靠近物品时按 E 保存位置记忆，就算被移动了也能回顾！你有3个记忆槽，合理分配哦！',
      description: '记忆系统引导提示',
      memoryType: 'object',
      toastType: 'info' as const,
    },
    {
      id: 'se-owner-urgent-msg',
      trigger: (step) => step === 8,
      type: 'message',
      message: '📱 主人消息：「小橡找到了吗？钥匙、手机、雨伞都要带！我公交车来了！！」',
      description: '主人催促消息',
      memoryType: 'object',
      toastType: 'phone' as const,
    },
    {
      id: 'se-update-hint',
      trigger: (step) => step === 10,
      type: 'message',
      message: '💡 提示：如果记忆过期了，找到物品新位置后按 E 更新记忆！更新记忆还能获得额外分数！',
      description: '更新记忆引导提示',
      memoryType: 'object',
      toastType: 'info' as const,
    },
    {
      id: 'se-memory-lock-hint',
      trigger: (step) => step === 4,
      type: 'message',
      message: '🔒 提示：点击记忆槽上的锁图标可以锁定记忆！锁定的记忆不会过期，也不会被覆盖！',
      description: '记忆锁定引导提示',
      memoryType: 'object',
      toastType: 'info' as const,
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
      question: '你是否使用了记忆锁定功能保护重要物品？',
      options: ['是', '否'],
      correctAnswer: '是',
      dependsOnMemoryType: 'object',
      difficulty: 'easy',
    },
  ],
}
