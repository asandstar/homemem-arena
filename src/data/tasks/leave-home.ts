// 关卡 1：出门大作战
// 目标：在 180 秒内找到钥匙、手机、雨伞，放到玄关托盘
// 记忆类型：空间记忆 + 物体位置记忆
// 捣乱事件：钥匙猫推钥匙、手机响铃

import type { TaskConfig } from '../../types/task'
import type { EntityStateSnapshot } from '../../types/task'

export const leaveHomeTask: TaskConfig = {
  id: 'task-leave-home',
  name: '出门大作战',
  description: '🌅 早上八点，主人要出门上班啦！可是钥匙猫又开始调皮了，把钥匙扒拉得到处都是。快找到钥匙、手机和雨伞，在主人迟到之前放到玄关托盘上吧！',
  memoryTypes: ['spatial', 'object'],
  difficulty: 'medium',
  rooms: ['living', 'bedroom', 'kitchen', 'entrance'],
  iconKey: 'door',
  tags: ['空间记忆', '限时挑战', '钥匙猫'],
  briefing: `🌅 早上 8:00 · 主人还有 3 分钟出门

玄关贴着便签：「小橡！钥匙手机雨伞！拜托了！——再不走就赶不上公交了」
钥匙应该在茶几上，手机在卧室，猫蹲在沙发背上舔爪子，眼神不太 innocent。`,
  completionText: '主人冲出门前看了一眼托盘：「全齐了！小橡你太靠谱了！」\n猫跳上窗台，甩了甩尾巴。明天，它大概还会来。',
  failureText: '主人翻遍口袋，叹了口气：「算了...今天蹭同事车吧。」\n似乎听见沙发缝里传来金属碰撞声。猫的耳朵动了一下。',
  systemPrompt: '【MEM-07 日志】任务：协助主人出门。当前状态：物品位置待确认，疑似猫科干预。策略：冷静搜索，记录位置，效率优先。',
  timeLimit: 180,
  spawnPosition: { x: 0, z: -1.5 },
  spawnRotation: Math.PI,

  objects: [
    // 钥匙 - 在客厅茶几上（玩家左前方）
    {
      id: 'obj-key',
      name: '钥匙',
      category: 'key',
      initialRoom: 'living',
      initialPosition: { x: -1.2, y: 0, z: 0.5 },
      surfaceContainerId: 'cnt-coffee-table',
      size: { x: 0.15, y: 0.05, z: 0.1 },
      color: '#fbbf24',
    },
    // 手机 - 在卧室床头柜（被遮挡）
    {
      id: 'obj-phone',
      name: '手机',
      category: 'phone',
      initialRoom: 'bedroom',
      initialPosition: { x: -7.2, y: 0, z: -0.8 },
      size: { x: 0.08, y: 0.16, z: 0.005 },
      color: '#1f2937',
      hiddenInContainer: 'cnt-bedside-drawer',
    },
    // 雨伞 - 在玄关伞架
    {
      id: 'obj-umbrella',
      name: '雨伞',
      category: 'umbrella',
      initialRoom: 'entrance',
      initialPosition: { x: -1.2, y: 0, z: 4.5 },
      surfaceContainerId: 'cnt-umbrella-stand',
      size: { x: 0.1, y: 1.0, z: 0.1 },
      color: '#ef4444',
    },
  ],

  containers: [
    // 客厅 - 茶几（玩家左前方）
    {
      id: 'cnt-coffee-table',
      name: '茶几',
      room: 'living',
      position: { x: -1.2, y: 0.2, z: 0.5 },
      size: { x: 1.0, y: 0.4, z: 0.6 },
      surfaceHeight: 0.4,
      color: '#8b5a2b',
      initialOpen: true,
      acceptedCategories: [],
    },
    // 卧室 - 床头柜（关着的，藏手机）
    {
      id: 'cnt-bedside-drawer',
      name: '床头柜抽屉',
      room: 'bedroom',
      position: { x: -7.2, y: 0.3, z: -0.8 },
      size: { x: 0.5, y: 0.5, z: 0.4 },
      surfaceHeight: 0.55,
      color: '#a16207',
      initialOpen: false,
      acceptedCategories: [],
      containsObjectIds: ['obj-phone'],
    },
    // 玄关 - 伞架
    {
      id: 'cnt-umbrella-stand',
      name: '伞架',
      room: 'entrance',
      position: { x: -1.2, y: 0.3, z: 4.5 },
      size: { x: 0.3, y: 0.6, z: 0.3 },
      surfaceHeight: 0.6,
      color: '#475569',
      initialOpen: true,
      acceptedCategories: ['umbrella'],
    },
    // 玄关 - 托盘（目标区）
    {
      id: 'cnt-entrance-tray',
      name: '玄关托盘',
      room: 'entrance',
      position: { x: 0.5, y: 0.5, z: 5.5 },
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
      memoryType: 'spatial',
      predicate: (entities: EntityStateSnapshot[]) => {
        const key = entities.find((e) => e.configId === 'obj-key')
        return key?.placedIn === 'cnt-entrance-tray' && key.status === 'placed'
      },
      achievedMessage: '钥匙已归位！',
    },
    {
      id: 'g-phone-on-tray',
      description: '手机放到玄关托盘',
      memoryType: 'object',
      predicate: (entities: EntityStateSnapshot[]) => {
        const phone = entities.find((e) => e.configId === 'obj-phone')
        return phone?.placedIn === 'cnt-entrance-tray' && phone.status === 'placed'
      },
      achievedMessage: '手机已归位！',
    },
    {
      id: 'g-umbrella-on-tray',
      description: '雨伞放到玄关托盘或伞架',
      memoryType: 'spatial',
      predicate: (entities: EntityStateSnapshot[]) => {
        const umbrella = entities.find((e) => e.configId === 'obj-umbrella')
        return (umbrella?.placedIn === 'cnt-entrance-tray' || umbrella?.placedIn === 'cnt-umbrella-stand') && umbrella.status === 'placed'
      },
      achievedMessage: '雨伞已归位！',
    },
  ],

  scriptedEvents: [
    {
      id: 'se-cat-pushes-key',
      trigger: (step, entities) => {
        const key = entities.find((e) => e.configId === 'obj-key')
        return step > 4 && key?.currentRoom === 'living' && key?.status === 'free'
      },
      type: 'move-entity',
      targetId: 'obj-key',
      targetPosition: { room: 'living', x: 2.0, y: 0, z: -2.5 },
      message: '🐱 啪嗒——钥匙猫一爪子把钥匙从茶几扒拉到了客厅角落的沙发缝旁！（钥匙猫：追我呀喵~）',
      description: '钥匙猫把钥匙从茶几推到了客厅角落沙发缝旁',
      memoryType: 'spatial',
      markMemoryOutdated: 'obj-key',
      eventEffect: 'cat-prints',
      toastType: 'cat' as const,
    },
    {
      id: 'se-cat-pushes-key-2',
      trigger: (step, entities) => {
        const key = entities.find((e) => e.configId === 'obj-key')
        return step > 10 && key?.currentRoom === 'living' && key?.status === 'free'
      },
      type: 'move-entity',
      targetId: 'obj-key',
      targetPosition: { room: 'bedroom', x: 2.5, y: 0, z: 0 },
      message: '🐱 嗖——钥匙猫叼起钥匙，一溜烟钻进了卧室，把钥匙丢在了卧室门口的地毯上！（钥匙猫：来抓我呀喵~）',
      description: '钥匙猫把钥匙从客厅叼到了卧室门口',
      memoryType: 'spatial',
      markMemoryOutdated: 'obj-key',
      eventEffect: 'cat-prints',
      toastType: 'cat' as const,
    },
    {
      id: 'se-phone-rings',
      trigger: (step, entities) => {
        const phone = entities.find((e) => e.configId === 'obj-phone')
        return step >= 2 && phone?.status !== 'held' && phone?.status !== 'placed'
      },
      type: 'message',
      message: '📳 嗡嗡嗡——卧室的床头柜方向传来手机震动声。也许该打开抽屉看看？',
      description: '手机响铃提示所在房间方向和容器',
      memoryType: 'object',
      roomHint: 'bedroom',
      eventEffect: 'phone-ring',
      toastType: 'phone' as const,
    },
    {
      id: 'se-owner-urgent-msg',
      trigger: (step) => step === 3,
      type: 'message',
      message: '📱 主人消息：「小橡找到了吗？我公交车来了！！」',
      description: '主人催促消息',
      memoryType: 'object',
      toastType: 'phone' as const,
    },
    {
      id: 'se-cat-observes',
      trigger: (step) => step === 8,
      type: 'message',
      message: '🐱 似乎检测到猫科生物在卧室门口活动。尾部摆动频率异常。',
      description: '猫在卧室门口观察',
      memoryType: 'spatial',
      toastType: 'cat' as const,
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
      id: 'p-loc-phone-original',
      type: 'location',
      question: '手机一开始放在哪里？',
      options: ['客厅茶几上', '卧室床头柜抽屉里', '厨房台面上', '玄关托盘上'],
      correctAnswer: '卧室床头柜抽屉里',
      dependsOnMemoryType: 'spatial',
      difficulty: 'medium',
    },
    {
      id: 'p-state-phone',
      type: 'state',
      question: '手机最初是否可见？',
      options: ['可见，在茶几上', '不可见，藏在抽屉里'],
      correctAnswer: '不可见，藏在抽屉里',
      dependsOnMemoryType: 'object',
      difficulty: 'easy',
    },
    {
      id: 'p-count-items',
      type: 'count',
      question: '需要带到玄关的物品一共有几件？',
      options: ['2', '3', '4', '5'],
      correctAnswer: '3',
      dependsOnMemoryType: 'temporal',
      difficulty: 'easy',
    },
  ],
}
