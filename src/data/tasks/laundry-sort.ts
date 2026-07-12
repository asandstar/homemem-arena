// 关卡 3：洗衣幽灵
// 目标：在袜子幽灵的捣乱下完成衣物分类，小心篮子位置被交换！
// 记忆类型：时间记忆 + 计数记忆 + 重复动作记忆 + 空间记忆

import type { TaskConfig } from '../../types/task'
import type { EntityStateSnapshot } from '../../types/task'

export const laundrySortTask: TaskConfig = {
  id: 'task-laundry-sort',
  name: '洗衣幽灵',
  description: '👻 下午三点，洗衣房传来窸窸窣窣的声音...原来是害羞的袜子幽灵在玩捉迷藏！它会偷偷移动衣物、交换篮子位置，还会变出神秘的彩色衬衫！在 90 秒内完成衣物分类吧！',
  memoryTypes: ['temporal', 'procedural', 'object', 'spatial'],
  difficulty: 'medium',
  rooms: ['laundry'],
  iconKey: 'shirt',
  tags: ['限时挑战', '袜子幽灵', '位置交换', '分类大师'],
  timeLimit: 90,
  spawnPosition: { x: 0, z: 2.0 },
  spawnRotation: Math.PI,
  briefing: `👻 下午 3:00 · 洗衣房异动

主人的便签：「这批衣服分三类，白/深/毛巾，放错会染色——拜托了小橡！」
洗衣篮旁散落着衣物，检测到猫正用爪子拨弄一只袜子。`,
  completionText: '所有衣物分类完毕。主人回复：「完美！小橡比洗衣机还好用！」\n猫蹲在空篮子里，盯着分类好的衣物，尾巴不耐烦地甩动。',
  failureText: '时间到了，衣物还是乱成一堆。主人：「算了，我送干洗店吧...」\n检测到洗衣机后方似乎有猫的袜子收藏阵。至少有 7 只。',
  systemPrompt: '【MEM-07 日志】任务：衣物分类。检测到物品位置异常变动，疑似猫科搬运。策略：追踪位置变化，按颜色分类，计数防遗漏。',

  objects: [
    // 白色衣物
    {
      id: 'obj-white-shirt',
      name: '白衬衫',
      category: 'white-clothes',
      initialRoom: 'laundry',
      initialPosition: { x: -3.0, y: 0.4, z: 1.0 },
      size: { x: 0.4, y: 0.05, z: 0.5 },
      color: '#f9fafb',
    },
    {
      id: 'obj-white-socks',
      name: '白袜子',
      category: 'white-clothes',
      initialRoom: 'laundry',
      initialPosition: { x: -2.4, y: 0.05, z: 1.2 },
      size: { x: 0.15, y: 0.05, z: 0.15 },
      color: '#ffffff',
    },
    {
      id: 'obj-white-towel-small',
      name: '小白巾',
      category: 'white-clothes',
      initialRoom: 'laundry',
      initialPosition: { x: -3.5, y: 0.4, z: 1.4 },
      size: { x: 0.25, y: 0.05, z: 0.25 },
      color: '#f3f4f6',
    },
    // 深色衣物
    {
      id: 'obj-black-tshirt',
      name: '黑 T 恤',
      category: 'dark-clothes',
      initialRoom: 'laundry',
      initialPosition: { x: 0, y: 0.4, z: 1.0 },
      size: { x: 0.4, y: 0.05, z: 0.5 },
      color: '#1f2937',
    },
    {
      id: 'obj-jeans',
      name: '牛仔裤',
      category: 'dark-clothes',
      initialRoom: 'laundry',
      initialPosition: { x: 0.6, y: 0.4, z: 1.2 },
      size: { x: 0.4, y: 0.05, z: 0.7 },
      color: '#1e3a8a',
    },
    // 毛巾
    {
      id: 'obj-towel-large',
      name: '大浴巾',
      category: 'towel',
      initialRoom: 'laundry',
      initialPosition: { x: 3.0, y: 0.4, z: 1.0 },
      size: { x: 0.6, y: 0.05, z: 0.8 },
      color: '#fcd34d',
    },
    {
      id: 'obj-towel-small',
      name: '小方巾',
      category: 'towel',
      initialRoom: 'laundry',
      initialPosition: { x: 3.6, y: 0.05, z: 1.2 },
      size: { x: 0.2, y: 0.05, z: 0.2 },
      color: '#fbbf24',
    },
    // 神秘彩色条纹衬衫（特殊物品）
    {
      id: 'obj-mystery-shirt',
      name: '彩色条纹衬衫',
      category: 'white-clothes',
      initialRoom: 'laundry',
      initialPosition: { x: 1.5, y: 0.05, z: 1.4 },
      size: { x: 0.4, y: 0.05, z: 0.5 },
      color: '#ec4899',
      stateProperties: { mystery: true, specialItem: true },
    },
  ],

  containers: [
    // 白色篮子
    {
      id: 'cnt-white-basket',
      name: '白色衣物篮',
      room: 'laundry',
      position: { x: -3.0, y: 0.25, z: -2.0 },
      size: { x: 0.8, y: 0.5, z: 0.6 },
      color: '#f9fafb',
      initialOpen: true,
      acceptedCategories: ['white-clothes'],
      isTargetZone: true,
      targetLabel: '白色衣物篮',
    },
    // 深色篮子
    {
      id: 'cnt-dark-basket',
      name: '深色衣物篮',
      room: 'laundry',
      position: { x: 0, y: 0.25, z: -2.0 },
      size: { x: 0.8, y: 0.5, z: 0.6 },
      color: '#1f2937',
      initialOpen: true,
      acceptedCategories: ['dark-clothes'],
      isTargetZone: true,
      targetLabel: '深色衣物篮',
    },
    // 毛巾篮
    {
      id: 'cnt-towel-basket',
      name: '毛巾篮',
      room: 'laundry',
      position: { x: 3.0, y: 0.25, z: -2.0 },
      size: { x: 0.8, y: 0.5, z: 0.6 },
      color: '#fcd34d',
      initialOpen: true,
      acceptedCategories: ['towel'],
      isTargetZone: true,
      targetLabel: '毛巾篮',
    },
  ],

  goals: [
    {
      id: 'g-white-sorted',
      description: '所有白色衣物（包括神秘彩色衬衫）放入白色衣物篮',
      memoryType: 'object',
      predicate: (entities: EntityStateSnapshot[]) => {
        const whiteIds = ['obj-white-shirt', 'obj-white-socks', 'obj-white-towel-small', 'obj-mystery-shirt']
        return whiteIds.every((id) => {
          const e = entities.find((ent) => ent.configId === id)
          return e?.placedIn === 'cnt-white-basket'
        })
      },
      achievedMessage: '白色衣物分类完成！',
    },
    {
      id: 'g-dark-sorted',
      description: '所有深色衣物放入深色衣物篮',
      memoryType: 'object',
      predicate: (entities: EntityStateSnapshot[]) => {
        const darkIds = ['obj-black-tshirt', 'obj-jeans']
        return darkIds.every((id) => {
          const e = entities.find((ent) => ent.configId === id)
          return e?.placedIn === 'cnt-dark-basket'
        })
      },
      achievedMessage: '深色衣物分类完成！',
    },
    {
      id: 'g-towel-sorted',
      description: '所有毛巾放入毛巾篮',
      memoryType: 'object',
      predicate: (entities: EntityStateSnapshot[]) => {
        const towelIds = ['obj-towel-large', 'obj-towel-small']
        return towelIds.every((id) => {
          const e = entities.find((ent) => ent.configId === id)
          return e?.placedIn === 'cnt-towel-basket'
        })
      },
      achievedMessage: '毛巾分类完成！',
    },
    {
      id: 'g-mystery-item',
      description: '神秘彩色条纹衬衫放入白色衣物篮',
      memoryType: 'object',
      predicate: (entities: EntityStateSnapshot[]) => {
        const mystery = entities.find((ent) => ent.configId === 'obj-mystery-shirt')
        return mystery?.placedIn === 'cnt-white-basket'
      },
      achievedMessage: '神秘物品已处理！',
    },
  ],

  scriptedEvents: [
    {
      id: 'se-cat-moves-clothes',
      trigger: (step) => step === 5,
      type: 'move-entity',
      targetId: 'obj-white-socks',
      targetPosition: { room: 'laundry', x: 2.5, y: 0.05, z: 1.4 },
      message: '👻 嗖——白袜子不见了！（袜子幽灵：嘿嘿，找不到了吧~）',
      description: '袜子幽灵把白袜子移到了毛巾篮附近',
      memoryType: 'spatial',
      eventEffect: 'cat-prints',
      toastType: 'cat' as const,
    },
    {
      id: 'se-cat-moves-towel',
      trigger: (step) => step === 9,
      type: 'move-entity',
      targetId: 'obj-towel-small',
      targetPosition: { room: 'laundry', x: -1.0, y: 0.05, z: 1.4 },
      message: '👻 呼——小方巾也飘走了！（袜子幽灵：捉迷藏真好玩~）',
      description: '袜子幽灵把小方巾移到了白色篮子那边',
      memoryType: 'spatial',
      eventEffect: 'cat-prints',
      toastType: 'cat' as const,
    },
    {
      id: 'se-baskets-swapped',
      trigger: (step) => step === 12,
      type: 'message',
      message: '🔄 袜子幽灵在篮子旁边飘来飘去...是不是想搞什么鬼？（袜子幽灵：嘿嘿，我什么都没做~）',
      description: '袜子幽灵在篮子旁徘徊，暗示可能会交换位置',
      memoryType: 'spatial',
    },
    {
      id: 'se-mystery-item-appears',
      trigger: (step) => step === 7,
      type: 'message',
      message: '❓ 一件彩色条纹衬衫凭空出现了...（袜子幽灵：这是我...我收藏的宝贝~）',
      description: '袜子幽灵变出了一件神秘的彩色条纹衬衫',
      memoryType: 'object',
    },
    {
      id: 'se-owner-reminder',
      trigger: (step) => step === 3,
      type: 'message',
      message: '📱 主人消息：「那件白衬衫别和深色一起洗！会变粉的！」',
      description: '主人提醒分类规则',
      memoryType: 'object',
      toastType: 'info' as const,
    },
    {
      id: 'se-cat-hides-sock',
      trigger: (step) => step === 9,
      type: 'message',
      message: '🐱 似乎看到猫往洗衣机后面钻。听见了布料摩擦的声音。',
      description: '猫疑似在藏衣物',
      memoryType: 'spatial',
      toastType: 'cat' as const,
    },
  ],

  probes: [
    {
      id: 'p-count-white',
      type: 'count',
      question: '白色衣物一共有几件？',
      options: ['2', '3', '4', '5'],
      correctAnswer: '3',
      dependsOnMemoryType: 'temporal',
      difficulty: 'easy',
    },
    {
      id: 'p-count-towel',
      type: 'count',
      question: '毛巾一共有几条？',
      options: ['1', '2', '3', '4'],
      correctAnswer: '2',
      dependsOnMemoryType: 'temporal',
      difficulty: 'easy',
    },
    {
      id: 'p-classify-jeans',
      type: 'object-id',
      question: '牛仔裤属于哪一类？',
      options: ['白色衣物', '深色衣物', '毛巾'],
      correctAnswer: '深色衣物',
      dependsOnMemoryType: 'procedural',
      difficulty: 'easy',
    },
    {
      id: 'p-socks-final',
      type: 'recognition',
      question: '白袜子最后被移到了哪里？',
      options: ['白色篮子附近', '深色篮子附近', '毛巾篮附近', '原来位置'],
      correctAnswer: '毛巾篮附近',
      dependsOnMemoryType: 'spatial',
      difficulty: 'medium',
      hint: '回忆袜子幽灵的恶作剧',
    },
  ],
}
