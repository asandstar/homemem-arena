// 关卡 2：餐桌混乱
// 目标：在混乱中快速识别并归类物品，小心餐盘精捣乱！
// 记忆类型：物体状态记忆 + 类别规则记忆 + 空间记忆

import type { TaskConfig } from '../../types/task'
import type { EntityStateSnapshot } from '../../types/task'

export const cleanTableTask: TaskConfig = {
  id: 'task-clean-table',
  name: '餐桌混乱',
  description: '🍽️ 清晨七点半，早餐后留下一桌子狼藉。更糟的是，调皮的餐盘精总爱把脏盘子偷偷放回桌上！快在 75 秒内把餐桌收拾干净吧！',
  memoryTypes: ['object', 'procedural', 'spatial'],
  difficulty: 'easy',
  rooms: ['dining', 'kitchen', 'living'],
  iconKey: 'dish',
  tags: ['限时挑战', '餐盘精', '状态识别', '手忙脚乱'],
  timeLimit: 75,
  briefing: `🍽️ 清晨 · 记忆宅邸餐厅

"嘻嘻嘻——新来的小精灵？"
餐桌上，一个长着小短腿的盘子精灵正蹦来蹦去，
把脏盘子推得东倒西歪。

"我是餐盘精！
干净盘子？太无聊了！
脏脏的才有意思嘛~"

⚠️ 餐盘精会把脏盘子偷偷放回来哦
⏰ 限时 1 分 15 秒
🎯 目标：脏杯子脏盘子→洗碗机/水槽，垃圾→垃圾桶，遥控器→客厅茶几`,
  completionText: '餐桌收拾干净啦！餐盘精瘫在干净的盘子上："唔...干净也不是不行啦...下次我一定赢！"',
  failureText: '餐桌还是乱糟糟的...餐盘精坐在脏盘子堆里朝你做鬼脸："嘿嘿嘿，收拾不完吧~"',
  systemPrompt: '【小橡的内心独白】餐盘精好调皮...不过没关系！看颜色区分干净和脏的，一件一件分类，我可以的！',

  objects: [
    // 脏杯子
    {
      id: 'obj-dirty-cup',
      name: '脏杯子',
      category: 'cup',
      initialRoom: 'dining',
      initialPosition: { x: -0.3, y: 0, z: 0 },
      surfaceContainerId: 'cnt-dining-table',
      size: { x: 0.1, y: 0.12, z: 0.1 },
      color: '#d1d5db',
      stateProperties: { cleanliness: 'dirty' },
    },
    // 干净杯子 (干扰项)
    {
      id: 'obj-clean-cup',
      name: '干净杯子',
      category: 'cup',
      initialRoom: 'dining',
      initialPosition: { x: 0.3, y: 0, z: 0.2 },
      surfaceContainerId: 'cnt-dining-table',
      size: { x: 0.1, y: 0.12, z: 0.1 },
      color: '#ffffff',
      stateProperties: { cleanliness: 'clean' },
    },
    // 盘子
    {
      id: 'obj-plate',
      name: '脏盘子',
      category: 'plate',
      initialRoom: 'dining',
      initialPosition: { x: 0, y: 0, z: -0.2 },
      surfaceContainerId: 'cnt-dining-table',
      size: { x: 0.25, y: 0.02, z: 0.25 },
      color: '#f3f4f6',
      stateProperties: { cleanliness: 'dirty' },
    },
    // 餐巾纸 (垃圾)
    {
      id: 'obj-tissue',
      name: '餐巾纸',
      category: 'tissue',
      initialRoom: 'dining',
      initialPosition: { x: 0.4, y: 0, z: -0.1 },
      surfaceContainerId: 'cnt-dining-table',
      size: { x: 0.1, y: 0.05, z: 0.08 },
      color: '#fef3c7',
    },
    // 遥控器
    {
      id: 'obj-remote',
      name: '遥控器',
      category: 'remote',
      initialRoom: 'dining',
      initialPosition: { x: -0.4, y: 0, z: 0.2 },
      surfaceContainerId: 'cnt-dining-table',
      size: { x: 0.18, y: 0.02, z: 0.05 },
      color: '#374151',
    },
  ],

  containers: [
    // 餐桌
    {
      id: 'cnt-dining-table',
      name: '餐桌',
      room: 'dining',
      position: { x: 0, y: 0.45, z: 0 },
      size: { x: 1.8, y: 0.9, z: 0.9 },
      surfaceHeight: 0.9,
      color: '#92400e',
      initialOpen: true,
      acceptedCategories: [],
    },
    // 厨房 - 洗碗机 (接杯子和盘子)
    {
      id: 'cnt-dishwasher',
      name: '洗碗机',
      room: 'kitchen',
      position: { x: 5.0, y: 0.4, z: -2.0 },
      size: { x: 0.6, y: 0.8, z: 0.6 },
      surfaceHeight: 0.82,
      color: '#a3a3a3',
      initialOpen: true,
      acceptedCategories: ['cup', 'plate'],
    },
    // 厨房 - 水槽 (也接杯子和盘子)
    {
      id: 'cnt-sink',
      name: '水槽',
      room: 'kitchen',
      position: { x: 6.5, y: 0.4, z: -2.0 },
      size: { x: 0.5, y: 0.8, z: 0.5 },
      surfaceHeight: 0.82,
      color: '#9ca3af',
      initialOpen: true,
      acceptedCategories: ['cup', 'plate'],
    },
    // 厨房 - 垃圾桶
    {
      id: 'cnt-trash-bin',
      name: '垃圾桶',
      room: 'kitchen',
      position: { x: 5.0, y: 0.2, z: 2.0 },
      size: { x: 0.3, y: 0.4, z: 0.3 },
      surfaceHeight: 0.42,
      color: '#1f2937',
      initialOpen: true,
      acceptedCategories: ['tissue'],
      isTargetZone: true,
      targetLabel: '垃圾桶（垃圾目标区）',
    },
    // 客厅 - 茶几 (遥控器目标区)
    {
      id: 'cnt-coffee-table',
      name: '客厅茶几',
      room: 'living',
      position: { x: 0, y: 0.2, z: 1.0 },
      size: { x: 0.8, y: 0.4, z: 0.5 },
      surfaceHeight: 0.42,
      color: '#8b5a2b',
      initialOpen: true,
      acceptedCategories: ['remote'],
      isTargetZone: true,
      targetLabel: '客厅茶几（遥控器目标区）',
    },
  ],

  goals: [
    {
      id: 'g-dirty-cup',
      description: '脏杯子放入洗碗机或水槽',
      memoryType: 'object',
      predicate: (entities: EntityStateSnapshot[]) => {
        const cup = entities.find((e) => e.configId === 'obj-dirty-cup')
        return cup?.placedIn === 'cnt-dishwasher' || cup?.placedIn === 'cnt-sink'
      },
      achievedMessage: '脏杯子已收好！',
    },
    {
      id: 'g-clean-cup',
      description: '干净杯子保持自由状态',
      memoryType: 'object',
      predicate: (entities: EntityStateSnapshot[]) => {
        const clean = entities.find((e) => e.configId === 'obj-clean-cup')
        return clean?.status === 'free' && !clean.placedIn
      },
      achievedMessage: '干净杯子未被错误处理！',
    },
    {
      id: 'g-plate',
      description: '盘子放入洗碗机或水槽',
      memoryType: 'object',
      predicate: (entities: EntityStateSnapshot[]) => {
        const plate = entities.find((e) => e.configId === 'obj-plate')
        return plate?.placedIn === 'cnt-dishwasher' || plate?.placedIn === 'cnt-sink'
      },
      achievedMessage: '盘子已收好！',
    },
    {
      id: 'g-tissue',
      description: '餐巾纸扔进垃圾桶',
      memoryType: 'object',
      predicate: (entities: EntityStateSnapshot[]) => {
        const tissue = entities.find((e) => e.configId === 'obj-tissue')
        return tissue?.placedIn === 'cnt-trash-bin'
      },
      achievedMessage: '垃圾已清理！',
    },
    {
      id: 'g-remote',
      description: '遥控器放回客厅茶几',
      memoryType: 'spatial',
      predicate: (entities: EntityStateSnapshot[]) => {
        const remote = entities.find((e) => e.configId === 'obj-remote')
        return remote?.placedIn === 'cnt-coffee-table'
      },
      achievedMessage: '遥控器已归位！',
    },
  ],

  scriptedEvents: [
    {
      id: 'se-roommate-returns-dirty-plate',
      trigger: (step) => step === 8,
      type: 'move-entity',
      targetId: 'obj-plate',
      targetPosition: { room: 'dining', x: 0.2, y: 0, z: -0.1 },
      message: '🍽️ 哗啦——脏盘子又出现在餐桌上了。（餐盘精：嘻嘻，忘记洗这个了吧~）',
      description: '餐盘精把脏盘子又放回了餐桌上',
      memoryType: 'spatial',
      toastType: 'event' as const,
    },
    {
      id: 'se-roommate-returns-dirty-cup',
      trigger: (step) => step === 12,
      type: 'move-entity',
      targetId: 'obj-dirty-cup',
      targetPosition: { room: 'dining', x: -0.2, y: 0, z: 0.1 },
      message: '🍽️ 叮——脏杯子也回来了。（餐盘精：还有这个还有这个~）',
      description: '餐盘精把脏杯子也放了回来',
      memoryType: 'spatial',
      toastType: 'event' as const,
    },
    {
      id: 'se-similar-cups-warning',
      trigger: (step) => step === 3,
      type: 'message',
      message: '💡 两个杯子长得好像...注意看颜色哦，灰色的是脏的，白色的是干净的~',
      description: '系统提醒玩家注意区分干净杯和脏杯',
      memoryType: 'object',
    },
  ],

  probes: [
    {
      id: 'p-count-cups',
      type: 'count',
      question: '餐桌上一共有几个杯子？',
      options: ['1', '2', '3', '4'],
      correctAnswer: '2',
      dependsOnMemoryType: 'temporal',
      difficulty: 'easy',
    },
    {
      id: 'p-id-dirty-cup',
      type: 'object-id',
      question: '哪个杯子需要清洗？',
      options: ['白色亮杯', '灰色杯子（杯壁有茶渍）', '两个都需要', '两个都不需要'],
      correctAnswer: '灰色杯子（杯壁有茶渍）',
      dependsOnMemoryType: 'object',
      difficulty: 'medium',
    },
    {
      id: 'p-tissue-dest',
      type: 'location',
      question: '餐巾纸应该扔到哪个容器？',
      options: ['洗碗机', '水槽', '垃圾桶'],
      correctAnswer: '垃圾桶',
      dependsOnMemoryType: 'procedural',
      difficulty: 'easy',
    },
    {
      id: 'p-remote-dest',
      type: 'location',
      question: '遥控器应该放到哪里？',
      options: ['洗碗机', '水槽', '垃圾桶', '客厅茶几'],
      correctAnswer: '客厅茶几',
      dependsOnMemoryType: 'procedural',
      difficulty: 'easy',
    },
  ],
}
