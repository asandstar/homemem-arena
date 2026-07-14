// 关卡 5：深夜巡逻
// 目标：在黑暗中巡逻所有房间，找到被夜间异动打乱的物品并确认归位
// 记忆类型：空间记忆 + 时间记忆
// 特色：视野受限（黑暗）、巡逻全部房间、随机夜间事件（电器异响、窗户晃动）

import type { TaskConfig } from '../../types/task'
import type { EntityStateSnapshot } from '../../types/task'

export const nightPatrolTask: TaskConfig = {
  id: 'task-night-patrol',
  name: '深夜巡逻',
  description: '🌙 深夜两点，主人已经熟睡。MEM-07 启动夜间巡逻模式——黑暗中似乎有东西被挪动了，还有电器异响和窗户晃动...在 480 秒内巡查所有房间，找到 5 件被打乱的物品并确认归位吧！',
  memoryTypes: ['spatial', 'temporal'],
  difficulty: 'hard',
  rooms: ['living', 'bedroom', 'kitchen', 'entrance', 'dining'],
  iconKey: 'door',
  tags: ['深夜巡逻', '视野受限', '空间记忆', '时间记忆', '随机事件'],
  timeLimit: 480,
  spawnPosition: { x: 0, z: -1.5 },
  spawnRotation: Math.PI,
  briefing: `🌙 深夜 2:00 · 主人已熟睡 · 夜间巡逻模式启动

MEM-07：「检测到夜间异常：5 件物品偏离了归属位置，疑似被气流或电器震动移位。」

📋 巡查清单（找到每件物品并放回归属位以确认）：
  🎮 遥控器 → 归属：客厅茶几
  📱 手机   → 归属：卧室床头柜
  🥣 碗     → 归属：厨房台面
  ☂️ 雨伞   → 归属：玄关伞架
  ☕ 杯子   → 归属：餐厅餐桌

⚠️ 黑暗中视野受限，只能看清眼前的物体。
💡 屏幕边缘的方向指示会标记待确认物品的位置——跟着它巡查每个房间。
🤫 主人在睡觉，动作轻一点。小心电器异响和窗户晃动...`,
  completionText: '所有物品确认归位，屋子重归宁静。MEM-07：「巡逻完成，5/5 物品位置已确认。主人翻了个身，继续沉睡。」\n窗外月光洒进客厅，猫影从窗台一跃而下，消失在夜色里。',
  failureText: '巡逻超时，部分物品仍未确认。MEM-07：「时间不足，夜间异常未完全排查。」\n卧室传来主人翻身的声音——还好没被吵醒。明天晚上，再巡逻一次吧。',
  systemPrompt: '【MEM-07 日志】任务：夜间巡逻确认。模式：低光巡查。检测到 5 件物品位移，疑似气流/电器震动所致。策略：依次巡查所有房间，定位物品并归位确认。注意：电器异响与窗户晃动可能进一步移动物品。',

  objects: [
    // 遥控器 - 被打乱到卧室地板（归属：客厅茶几）
    {
      id: 'obj-remote',
      name: '遥控器',
      category: 'remote',
      initialRoom: 'bedroom',
      initialPosition: { x: 1.5, y: 0, z: -1.0 },
      size: { x: 0.18, y: 0.05, z: 0.05 },
      color: '#1f2937',
      stateProperties: { displaced: true, homeRoom: 'living' },
    },
    // 手机 - 被打乱到厨房地板（归属：卧室床头柜）
    {
      id: 'obj-phone',
      name: '手机',
      category: 'phone',
      initialRoom: 'kitchen',
      initialPosition: { x: -2.0, y: 0, z: 1.5 },
      size: { x: 0.08, y: 0.16, z: 0.015 },
      color: '#1f2937',
      stateProperties: { displaced: true, homeRoom: 'bedroom' },
    },
    // 碗 - 被打乱到餐厅地板（归属：厨房台面）
    {
      id: 'obj-bowl',
      name: '碗',
      category: 'bowl',
      initialRoom: 'dining',
      initialPosition: { x: 2.0, y: 0, z: -1.5 },
      size: { x: 0.15, y: 0.08, z: 0.15 },
      color: '#fbbf24',
      stateProperties: { displaced: true, homeRoom: 'kitchen' },
    },
    // 雨伞 - 被打乱到客厅地板（归属：玄关伞架）
    {
      id: 'obj-umbrella',
      name: '雨伞',
      category: 'umbrella',
      initialRoom: 'living',
      initialPosition: { x: 2.5, y: 0, z: -2.0 },
      size: { x: 0.1, y: 1.0, z: 0.1 },
      color: '#ef4444',
      stateProperties: { displaced: true, homeRoom: 'entrance' },
    },
    // 杯子 - 被打乱到玄关地板（归属：餐厅餐桌）
    {
      id: 'obj-cup',
      name: '杯子',
      category: 'cup',
      initialRoom: 'entrance',
      initialPosition: { x: -1.5, y: 0, z: 1.5 },
      size: { x: 0.1, y: 0.12, z: 0.1 },
      color: '#60a5fa',
      stateProperties: { displaced: true, homeRoom: 'dining' },
    },
  ],

  containers: [
    // 客厅 - 茶几（遥控器归属位）
    {
      id: 'cnt-patrol-coffee-table',
      name: '客厅茶几',
      room: 'living',
      position: { x: -1.5, y: 0.2, z: 0.5 },
      size: { x: 0.8, y: 0.4, z: 0.5 },
      surfaceHeight: 0.4,
      color: '#8b5a2b',
      initialOpen: true,
      acceptedCategories: ['remote'],
      isTargetZone: true,
      targetLabel: '客厅茶几（遥控器确认位）',
    },
    // 卧室 - 床头柜（手机归属位）
    {
      id: 'cnt-patrol-nightstand',
      name: '卧室床头柜',
      room: 'bedroom',
      position: { x: -1.5, y: 0.3, z: -0.8 },
      size: { x: 0.5, y: 0.5, z: 0.4 },
      surfaceHeight: 0.55,
      color: '#a16207',
      initialOpen: true,
      acceptedCategories: ['phone'],
      isTargetZone: true,
      targetLabel: '卧室床头柜（手机确认位）',
    },
    // 厨房 - 台面（碗归属位）
    {
      id: 'cnt-patrol-kitchen-counter',
      name: '厨房台面',
      room: 'kitchen',
      position: { x: 2.5, y: 0.45, z: -2.0 },
      size: { x: 1.5, y: 0.7, z: 0.6 },
      surfaceHeight: 0.7,
      color: '#94a3b8',
      initialOpen: true,
      acceptedCategories: ['bowl'],
      isTargetZone: true,
      targetLabel: '厨房台面（碗确认位）',
    },
    // 玄关 - 伞架（雨伞归属位）
    {
      id: 'cnt-patrol-umbrella-stand',
      name: '玄关伞架',
      room: 'entrance',
      position: { x: -1.5, y: 0.3, z: 2.0 },
      size: { x: 0.3, y: 0.6, z: 0.3 },
      surfaceHeight: 0.6,
      color: '#475569',
      initialOpen: true,
      acceptedCategories: ['umbrella'],
      isTargetZone: true,
      targetLabel: '玄关伞架（雨伞确认位）',
    },
    // 餐厅 - 餐桌（杯子归属位）
    {
      id: 'cnt-patrol-dining-table',
      name: '餐厅餐桌',
      room: 'dining',
      position: { x: 0, y: 0.45, z: 0 },
      size: { x: 1.8, y: 0.9, z: 0.9 },
      surfaceHeight: 0.9,
      color: '#92400e',
      initialOpen: true,
      acceptedCategories: ['cup'],
      isTargetZone: true,
      targetLabel: '餐厅餐桌（杯子确认位）',
    },
  ],

  goals: [
    {
      id: 'g-confirm-remote',
      description: '找到遥控器并放回客厅茶几确认归位',
      memoryType: 'spatial',
      predicate: (entities: EntityStateSnapshot[]) => {
        const remote = entities.find((e) => e.configId === 'obj-remote')
        return remote?.placedIn === 'cnt-patrol-coffee-table'
      },
      achievedMessage: '遥控器已确认归位！',
    },
    {
      id: 'g-confirm-phone',
      description: '找到手机并放回卧室床头柜确认归位',
      memoryType: 'spatial',
      predicate: (entities: EntityStateSnapshot[]) => {
        const phone = entities.find((e) => e.configId === 'obj-phone')
        return phone?.placedIn === 'cnt-patrol-nightstand'
      },
      achievedMessage: '手机已确认归位！',
    },
    {
      id: 'g-confirm-bowl',
      description: '找到碗并放回厨房台面确认归位',
      memoryType: 'spatial',
      predicate: (entities: EntityStateSnapshot[]) => {
        const bowl = entities.find((e) => e.configId === 'obj-bowl')
        return bowl?.placedIn === 'cnt-patrol-kitchen-counter'
      },
      achievedMessage: '碗已确认归位！',
    },
    {
      id: 'g-confirm-umbrella',
      description: '找到雨伞并放回玄关伞架确认归位',
      memoryType: 'temporal',
      predicate: (entities: EntityStateSnapshot[]) => {
        const umbrella = entities.find((e) => e.configId === 'obj-umbrella')
        return umbrella?.placedIn === 'cnt-patrol-umbrella-stand'
      },
      achievedMessage: '雨伞已确认归位！',
    },
    {
      id: 'g-confirm-cup',
      description: '找到杯子并放回餐厅餐桌确认归位',
      memoryType: 'temporal',
      predicate: (entities: EntityStateSnapshot[]) => {
        const cup = entities.find((e) => e.configId === 'obj-cup')
        return cup?.placedIn === 'cnt-patrol-dining-table'
      },
      achievedMessage: '杯子已确认归位！',
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
      message: '🪟 砰——窗户被夜风吹得猛晃一下！客厅那把雨伞被震得滚到了房间另一侧。（夜间异响：窗户晃动）',
      description: '窗户晃动把客厅的雨伞震到了房间另一侧',
      memoryType: 'spatial',
      markMemoryOutdated: 'obj-umbrella',
      eventEffect: 'cat-prints',
      toastType: 'event' as const,
    },
    {
      id: 'se-fridge-buzz',
      trigger: (step) => step === 14,
      type: 'message',
      message: '⚡ 又是一阵电器嗡嗡声...冰箱好像在自动除霜。得快点确认完所有物品。',
      description: '冰箱自动除霜的电器异响',
      memoryType: 'temporal',
      toastType: 'event' as const,
    },
    {
      id: 'se-cat-shadow',
      trigger: (step) => step === 18,
      type: 'message',
      message: '🐱 黑暗中似乎有个猫影一闪而过，尾巴尖微微发亮...它大概也在夜间巡逻。',
      description: '黑暗中的猫影',
      memoryType: 'spatial',
      toastType: 'cat' as const,
    },
    {
      id: 'se-window-rattle-2',
      trigger: (step) => step === 24,
      type: 'message',
      message: '🪟 窗户又晃了一下，这次声音小多了。希望没有别的东西被震移位。',
      description: '窗户第二次轻微晃动',
      memoryType: 'temporal',
      toastType: 'event' as const,
    },
  ],

  probes: [
    {
      id: 'p-spatial-remote-home',
      type: 'location',
      question: '🎮 遥控器的归属位（确认位）在哪里？',
      options: ['客厅茶几', '卧室床头柜', '厨房台面', '玄关伞架'],
      correctAnswer: '客厅茶几',
      dependsOnMemoryType: 'spatial',
      difficulty: 'medium',
      relatedObjectIds: ['obj-remote'],
    },
    {
      id: 'p-spatial-phone-found',
      type: 'location',
      question: '📱 手机被打乱到了哪个房间？',
      options: ['客厅', '卧室', '厨房', '餐厅'],
      correctAnswer: '厨房',
      dependsOnMemoryType: 'spatial',
      difficulty: 'medium',
      relatedObjectIds: ['obj-phone'],
    },
    {
      id: 'p-spatial-umbrella-home',
      type: 'location',
      question: '☂️ 雨伞应该确认归位到哪里？',
      options: ['客厅茶几', '玄关伞架', '餐厅餐桌', '厨房台面'],
      correctAnswer: '玄关伞架',
      dependsOnMemoryType: 'spatial',
      difficulty: 'medium',
      relatedObjectIds: ['obj-umbrella'],
    },
    {
      id: 'p-temporal-window-event',
      type: 'state',
      question: '🪟 窗户晃动事件影响了哪件物品？',
      options: ['遥控器', '手机', '雨伞', '杯子'],
      correctAnswer: '雨伞',
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
