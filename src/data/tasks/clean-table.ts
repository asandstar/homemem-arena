// 关卡 1：初次整理（教学关卡）
// 目标：学习基本操作——移动、拾取、放置、保存记忆
// 记忆类型：空间记忆入门
// 难度：新手教学

import type { TaskConfig } from '../../types/task'
import type { EntityStateSnapshot } from '../../types/task'

export const cleanTableTask: TaskConfig = {
  id: 'task-clean-table',
  name: '初次整理',
  description: '🍽️ 欢迎来到记忆宅邸！MEM-07 的记忆模块出了故障，只能记住 3 件物品。先从简单的整理任务开始吧——把餐桌上的脏餐具和餐巾纸归位，学习基本操作。',
  memoryTypes: ['spatial'],
  difficulty: 'tutorial',
  rooms: ['dining'],
  iconKey: 'dish',
  tags: ['新手入门', '教学关卡'],
  timeLimit: 180,
  spawnPosition: { x: 0, z: -2.5 },
  spawnRotation: Math.PI,
  briefing: `🍽️ 记忆宅邸 · 第一天

MEM-07：「你好，我是 MEM-07。我的记忆模块出了故障，只能同时记住 3 件物品的位置。」

「让我们从简单的整理开始——餐桌上有三件物品需要归位：脏杯子、餐巾纸和叉子。」

操作说明：
• WASD / 方向键 — 移动
• 鼠标 — 转视角
• F — 拾取 / 放置物品
• E — 保存记忆（靠近物品时）

💡 目标：脏杯子 → 洗碗机，餐巾纸 → 垃圾桶，叉子 → 餐具架`,
  completionText: '🎉 太棒了！你完成了第一次整理任务！\nMEM-07：「基础操作已记录。接下来的挑战会更有趣——也会更难。」',
  failureText: '⏰ 时间到了...没关系，再来一次！\nMEM-07：「别灰心，每个机器人都需要练习。记住：按 E 可以保存记忆，按 F 可以拾取和放置物品。」',
  systemPrompt: '【MEM-07 日志】教学模式启动。物品数量：3。时限：180秒。混乱事件：已禁用。引导模式：分步提示。',

  objects: [
    {
      id: 'obj-dirty-cup',
      name: '脏杯子',
      category: 'cup',
      initialRoom: 'dining',
      initialPosition: { x: -0.6, y: 0, z: 0 },
      surfaceContainerId: 'cnt-dining-table',
      size: { x: 0.1, y: 0.12, z: 0.1 },
      color: '#d1d5db',
      stateProperties: { cleanliness: 'dirty' },
    },
    {
      id: 'obj-tissue',
      name: '餐巾纸',
      category: 'tissue',
      initialRoom: 'dining',
      initialPosition: { x: 0.6, y: 0, z: 0 },
      surfaceContainerId: 'cnt-dining-table',
      size: { x: 0.1, y: 0.05, z: 0.08 },
      color: '#fcd34d',
    },
    {
      id: 'obj-fork',
      name: '叉子',
      category: 'fork',
      initialRoom: 'dining',
      initialPosition: { x: 0, y: 0, z: -0.3 },
      surfaceContainerId: 'cnt-dining-table',
      size: { x: 0.08, y: 0.15, z: 0.03 },
      color: '#b8c0c4',
    },
  ],

  containers: [
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
    {
      id: 'cnt-dishwasher',
      name: '洗碗机',
      room: 'dining',
      position: { x: 2.0, y: 0.4, z: 0 },
      size: { x: 0.6, y: 0.8, z: 0.6 },
      surfaceHeight: 0.82,
      color: '#a3a3a3',
      initialOpen: true,
      acceptedCategories: ['cup'],
      isTargetZone: true,
      targetLabel: '洗碗机（杯子放这里）',
    },
    {
      id: 'cnt-trash-bin',
      name: '垃圾桶',
      room: 'dining',
      position: { x: -2.0, y: 0.2, z: 0 },
      size: { x: 0.3, y: 0.4, z: 0.3 },
      surfaceHeight: 0.42,
      color: '#1f2937',
      initialOpen: true,
      acceptedCategories: ['tissue'],
      isTargetZone: true,
      targetLabel: '垃圾桶（餐巾纸扔这里）',
    },
    {
      id: 'cnt-utensil-rack',
      name: '餐具架',
      room: 'dining',
      position: { x: -1.5, y: 0.4, z: 0 },
      size: { x: 0.4, y: 0.6, z: 0.3 },
      surfaceHeight: 0.62,
      color: '#f59e0b',
      initialOpen: true,
      acceptedCategories: ['fork'],
      isTargetZone: true,
      targetLabel: '餐具架（叉子放这里）',
    },
  ],

  goals: [
    {
      id: 'g-dirty-cup',
      description: '脏杯子放入洗碗机',
      memoryType: 'object',
      relatedObjectIds: ['obj-dirty-cup'],
      predicate: (entities: EntityStateSnapshot[]) => {
        const cup = entities.find((e) => e.configId === 'obj-dirty-cup')
        return cup?.placedIn === 'cnt-dishwasher'
      },
      achievedMessage: '脏杯子已放入洗碗机！',
    },
    {
      id: 'g-tissue',
      description: '餐巾纸扔进垃圾桶',
      memoryType: 'object',
      relatedObjectIds: ['obj-tissue'],
      predicate: (entities: EntityStateSnapshot[]) => {
        const tissue = entities.find((e) => e.configId === 'obj-tissue')
        return tissue?.placedIn === 'cnt-trash-bin'
      },
      achievedMessage: '垃圾已清理！',
    },
    {
      id: 'g-fork',
      description: '叉子放回餐具架',
      memoryType: 'object',
      relatedObjectIds: ['obj-fork'],
      predicate: (entities: EntityStateSnapshot[]) => {
        const fork = entities.find((e) => e.configId === 'obj-fork')
        return fork?.placedIn === 'cnt-utensil-rack'
      },
      achievedMessage: '餐具已归位！',
    },
  ],

  scriptedEvents: [
    {
      id: 'se-tutorial-welcome',
      trigger: (step) => step === 1,
      type: 'message',
      message: '👋 MEM-07：「欢迎！看看餐桌上有三件物品——一个脏杯子、一张餐巾纸和一把叉子。」',
      description: '欢迎提示',
      memoryType: 'spatial',
      toastType: 'info' as const,
    },
    {
      id: 'se-tutorial-pickup',
      trigger: (step) => step === 2,
      type: 'message',
      message: '💡 MEM-07：「靠近物品后按 F 键拾取。先试试拿起脏杯子吧！」',
      description: '拾取教学',
      memoryType: 'object',
      toastType: 'info' as const,
    },
    {
      id: 'se-tutorial-memory',
      trigger: (step) => step === 3,
      type: 'message',
      message: '🧠 MEM-07：「按 E 键可以保存记忆。我的记忆槽有限，只能记 3 件物品的位置——策略性地使用吧！」',
      description: '记忆教学',
      memoryType: 'spatial',
      toastType: 'info' as const,
    },
    {
      id: 'se-tutorial-place',
      trigger: (step) => step === 4,
      type: 'message',
      message: '📦 MEM-07：「拿着物品靠近发光的目标区，按 F 键放置。洗碗机在右边，垃圾桶在左边，餐具架在中间。」',
      description: '放置教学',
      memoryType: 'object',
      toastType: 'info' as const,
    },
    {
      id: 'se-tutorial-encourage',
      trigger: (step) => step === 6,
      type: 'message',
      message: '🌟 MEM-07：「做得很好！继续把剩下的物品归位吧！」',
      description: '鼓励玩家',
      memoryType: 'object',
      toastType: 'info' as const,
    },
    {
      id: 'se-tutorial-hint-dishwasher',
      trigger: (step) => step === 8,
      type: 'message',
      message: '💡 MEM-07：「提示：蓝色光圈标记的是洗碗机，杯子应该放进去。」',
      description: '提示洗碗机位置',
      memoryType: 'procedural',
      toastType: 'info' as const,
    },
    {
      id: 'se-tutorial-hint-trash',
      trigger: (step) => step === 10,
      type: 'message',
      message: '💡 MEM-07：「提示：红色光圈标记的是垃圾桶，餐巾纸应该扔进去。」',
      description: '提示垃圾桶位置',
      memoryType: 'procedural',
      toastType: 'info' as const,
    },
    {
      id: 'se-tutorial-hint-fork',
      trigger: (step) => step === 12,
      type: 'message',
      message: '💡 MEM-07：「提示：黄色光圈标记的是餐具架，叉子应该放回去。」',
      description: '提示餐具架位置',
      memoryType: 'procedural',
      toastType: 'info' as const,
    },
  ],

  probes: [
    {
      id: 'p-cup-location',
      type: 'location',
      question: '脏杯子一开始放在哪里？',
      options: ['餐桌上', '洗碗机里', '垃圾桶里'],
      correctAnswer: '餐桌上',
      dependsOnMemoryType: 'spatial',
      difficulty: 'easy',
    },
    {
      id: 'p-trash-destination',
      type: 'location',
      question: '餐巾纸应该扔到哪里？',
      options: ['洗碗机', '垃圾桶', '餐桌'],
      correctAnswer: '垃圾桶',
      dependsOnMemoryType: 'procedural',
      difficulty: 'easy',
    },
    {
      id: 'p-fork-destination',
      type: 'location',
      question: '叉子应该放到哪里？',
      options: ['洗碗机', '垃圾桶', '餐具架'],
      correctAnswer: '餐具架',
      dependsOnMemoryType: 'procedural',
      difficulty: 'easy',
    },
  ],
}
