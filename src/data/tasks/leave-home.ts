// 关卡 2：钥匙猫的清晨恶作剧（Spatial Memory 空间记忆 · 旗舰关）
// 目标：90 秒内跨 4 房间找回被钥匙猫藏匿的 4 件物品，放回客厅茶几
// 记忆类型：空间记忆（Spatial Memory · 物体位置 + 房间布局）
// 核心循环：跨房间寻物 → 钥匙猫二次恶作剧（物品位移）→ 重新寻找 → 归位茶几
//
// 设计文档：docs/DESIGN_LEVEL_TASKS.md §3.2
// 资产：全部物品/容器有 GLB 模型（furniture/books, food/mug, furniture/bear, furniture/radio,
//       furniture/tableCoffee）
//
// TECH_DEBT：内部 task id 仍为 'task-leave-home'（历史出门大作战），显示名已改为
//            "钥匙猫的清晨恶作剧"。避免破坏 PUBLIC_LEVEL_ORDER / 存档 / 路由 / e2e 等下游引用。

import type { EntityStateSnapshot, StageContext, TaskConfig } from '../../types/task'
import type { RoomId } from '../../types/room'

/** 房间元信息快照类型（与 ScriptedEventSpec.trigger 的 rooms 参数一致） */
type RoomMap = Record<string, { id: RoomId; name?: string; center?: { x: number; z?: number; y?: number } }>

const ALL_OBJECT_IDS = ['obj-books', 'obj-mug', 'obj-bear', 'obj-radio'] as const

function entityPlacedIn(entities: EntityStateSnapshot[], configId: string, containerId: string): boolean {
  const e = entities.find((x) => x.configId === configId)
  return !!e && e.placedIn === containerId && e.status === 'placed'
}

/** 已"找到"的物品数（被拾取过或已放置） */
function foundCount(entities: EntityStateSnapshot[]): number {
  return entities.filter(
    (e) =>
      (ALL_OBJECT_IDS as readonly string[]).includes(e.configId) &&
      (e.status === 'held' || e.status === 'placed'),
  ).length
}

export const leaveHomeTask: TaskConfig = {
  id: 'task-leave-home',
  name: '钥匙猫的清晨恶作剧',
  description:
    '🐱 上午 8:30，主人准备出门，发现客厅茶几上的书、马克杯、玩具熊、收音机全不见了！钥匙猫清晨恶作剧，把 4 件物品藏到了不同房间。90 秒内找回全部物品并放回客厅茶几——小心钥匙猫会二次捣乱！',
  memoryTypes: ['spatial'],
  difficulty: 'easy',
  rooms: ['living', 'bedroom', 'dining', 'entrance'],
  iconKey: 'door',
  tags: ['空间记忆', '跨房间寻物', '限时', '钥匙猫', '物品位移'],
  timeLimit: 90,
  // 出生在 living 东北角（距两墙各 0.5m），朝西南对角线方向
  //   开局即可看到沙发区、茶几、电视柜、书架，视野覆盖最大化
  spawnPosition: { x: 2.7, z: -2.2 },
  spawnRotation: (5 * Math.PI) / 4,

  briefing: `🐱 钥匙猫的清晨恶作剧 · 第二关（空间记忆）

早晨八点，主人拎着公文包冲进客厅，翻遍沙发垫、摸遍玄关抽屉——那本要还的图书馆书、上班用的马克杯、送孩子的玩具熊、厨房里听新闻的收音机，全都不翼而飞。

主人：「小橡！是不是那只猫又捣乱了？我赶时间！」

钥匙猫从沙发背后探出脑袋，脖子上挂着那把永远丢不掉的旧钥匙，舔了舔爪子，眼神无辜得像什么都没发生过。

MEM-07：「扫描完成。四件物品被分散藏匿于客厅、卧室、餐厨、玄关四个房间。钥匙猫的活动轨迹显示它至少搬运了两次。」

📋 任务目标（90 秒内完成）：
  📖 书     → 藏在客厅沙发
  ☕ 马克杯 → 藏在卧室床头柜
  🧸 玩具熊 → 藏在厨房台面
  📻 收音机 → 藏在玄关

🎯 归位：找到后全部放回客厅茶几

⚠️ 警告：钥匙猫可能会在你找到 2 件后再次捣乱，叼走已找到的物品！
💡 提示：按 E 记住每件物品藏在哪个房间——猫会把物品叼走，记忆过期后需要重新寻找。养成记忆习惯才能在限时内完成。`,

  completionText:
    '主人：「太及时了！东西都找到了！小橡你真靠谱。」\n钥匙猫：「喵~」（跳上书架，尾巴甩了甩，似乎在策划下一次）\nMEM-07：「空间记忆模块校准完成。但钥匙猫……它的活动模式我还没完全掌握。」',
  failureText:
    '主人：「来不及了，我先走了……东西回来再收拾。」\n钥匙猫：「喵呜~」（得意地蜷在窗台，尾巴盖住鼻子）\nMEM-07：「时间不足。建议策略：先去最近的房间找一件，按 E 记住位置后再移动，避免反复跑空。」',
  systemPrompt:
    '【MEM-07 日志】任务：钥匙猫清晨恶作剧，90秒内找回 4 件物品。物品：书(客厅沙发)、马克杯(卧室床头柜)、玩具熊(厨房台面)、收音机(玄关)。目标区：客厅茶几。扰动：step>=8 且找到≥2件时钥匙猫叼走玩具熊到卧室(move-entity+markMemoryOutdated)。记忆类型：空间记忆。策略：跨房间搜寻→拾取→带回茶几放置。',

  objects: [
    {
      id: 'obj-books',
      name: '书',
      category: 'book',
      initialRoom: 'living',
      // 放在客厅沙发座面上（decor-sofa-main 在 (-1.5, 0, 0.8)，座面高约 0.45）
      initialPosition: { x: -1.5, y: 0.45, z: 0.8 },
      size: { x: 0.22, y: 0.08, z: 0.16 },
      color: '#3b82f6',
      modelAssetId: 'furniture/books',
    },
    {
      id: 'obj-mug',
      name: '马克杯',
      category: 'cup',
      initialRoom: 'bedroom',
      // 放在卧室床头柜右侧台面（decor-nightstand-right 在 (1.35, 0, -2.0)，台面 0.605）
      initialPosition: { x: 1.35, y: 0.605, z: -2.0 },
      size: { x: 0.14, y: 0.12, z: 0.14 },
      color: '#dc2626',
      modelAssetId: 'food/mug',
    },
    {
      id: 'obj-bear',
      name: '玩具熊',
      category: 'toy',
      initialRoom: 'dining',
      // 放在厨房台面（decor-kit-cabinet-2 在 (0.6, 0, -2.1)，台面 0.563）
      initialPosition: { x: 0.6, y: 0.563, z: -1.9 },
      size: { x: 0.22, y: 0.28, z: 0.20 },
      color: '#a16207',
      modelAssetId: 'furniture/bear',
    },
    {
      id: 'obj-radio',
      name: '收音机',
      category: 'remote',
      initialRoom: 'entrance',
      // 放在玄关鞋柜台面（decor-entrance-shoe-cabinet 在 (0.5, 0, -1.9)，台面 0.615）
      initialPosition: { x: 0.5, y: 0.615, z: -1.8 },
      size: { x: 0.567, y: 0.411, z: 0.176 },
      color: '#1f2937',
      modelAssetId: 'furniture/radio',
    },
  ],

  containers: [
    {
      id: 'cnt-coffee-table',
      name: '客厅茶几',
      room: 'living',
      // 居于客厅圆形地毯中央（decor-living-rug-round 在 (-1.5, 0, -0.2)）
      // 沙发 (z=0.8) 与电视柜 (z=-2.4) 之间，合理交互距离
      position: { x: -1.5, y: 0.2, z: -0.5 },
      size: { x: 1.4, y: 0.45, z: 0.7 },
      surfaceHeight: 0.45,
      color: '#8b5a2b',
      initialOpen: true,
      // 茶几是唯一目标区，接受 4 件物品的所有类别
      acceptedCategories: [],
      acceptAny: true,
      isTargetZone: true,
      targetLabel: '客厅茶几（4 件物品都放这里）',
      modelAssetId: 'furniture/tableCoffee',
    },
  ],

  goals: [
    {
      id: 'g-books-table',
      description: '书放回客厅茶几',
      memoryType: 'spatial',
      relatedObjectIds: ['obj-books'],
      predicate: (entities: EntityStateSnapshot[]) =>
        entityPlacedIn(entities, 'obj-books', 'cnt-coffee-table'),
      achievedMessage: '📖 书已放回茶几！',
    },
    {
      id: 'g-mug-table',
      description: '马克杯放回客厅茶几',
      memoryType: 'spatial',
      relatedObjectIds: ['obj-mug'],
      predicate: (entities: EntityStateSnapshot[]) =>
        entityPlacedIn(entities, 'obj-mug', 'cnt-coffee-table'),
      achievedMessage: '☕ 马克杯已放回茶几！',
    },
    {
      id: 'g-bear-table',
      description: '玩具熊放回客厅茶几',
      memoryType: 'spatial',
      relatedObjectIds: ['obj-bear'],
      predicate: (entities: EntityStateSnapshot[]) =>
        entityPlacedIn(entities, 'obj-bear', 'cnt-coffee-table'),
      achievedMessage: '🧸 玩具熊已放回茶几！',
    },
    {
      id: 'g-radio-table',
      description: '收音机放回客厅茶几',
      memoryType: 'spatial',
      relatedObjectIds: ['obj-radio'],
      predicate: (entities: EntityStateSnapshot[]) =>
        entityPlacedIn(entities, 'obj-radio', 'cnt-coffee-table'),
      achievedMessage: '📻 收音机已放回茶几！',
    },
  ],

  scriptedEvents: [
    {
      id: 'se-welcome',
      trigger: (step: number) => step === 1,
      type: 'message',
      message: '🐱 MEM-07：「钥匙猫清晨恶作剧！4 件物品被藏到了不同房间。90 秒内找回并放到客厅茶几。注意——钥匙猫可能会再次捣乱！」',
      description: '开场提示，介绍任务目标与警告',
      memoryType: 'spatial',
      toastType: 'info' as const,
    },
    {
      id: 'se-search-hint',
      trigger: (
        step: number,
        _entities: EntityStateSnapshot[],
        _currentRoom: RoomId,
        _rooms: RoomMap | undefined,
        ctx: StageContext | undefined,
      ) => step >= 3 && !ctx?.heldEntityConfigId && !ctx?.triggeredEvents.has('se-search-hint'),
      type: 'message',
      message: '💡 MEM-07：「去其他房间找找——书在客厅沙发，杯子在卧室床头柜，小熊在厨房台面，收音机在玄关。」',
      description: '寻物提示（未手持物品时出现一次）',
      memoryType: 'spatial',
      toastType: 'info' as const,
    },
    {
      id: 'se-found-first',
      trigger: (
        _step: number,
        entities: EntityStateSnapshot[],
        _currentRoom: RoomId,
        _rooms: RoomMap | undefined,
        ctx: StageContext | undefined,
      ) => {
        if (ctx?.triggeredEvents.has('se-found-first')) return false
        return foundCount(entities) >= 1
      },
      type: 'message',
      message: '✨ MEM-07：「找到一件了！记得它的位置——钥匙猫可能会再动它。」',
      description: '找到第 1 件物品鼓励',
      memoryType: 'spatial',
      toastType: 'success' as const,
    },
    {
      id: 'se-cat-second-prank',
      trigger: (
        step: number,
        entities: EntityStateSnapshot[],
        _currentRoom: RoomId,
        _rooms: RoomMap | undefined,
        ctx: StageContext | undefined,
      ) => {
        if (step < 8) return false
        if (ctx?.triggeredEvents.has('se-cat-second-prank')) return false
        // 找到 ≥2 件且玩具熊尚未放回茶几时，钥匙猫叼走玩具熊
        if (entityPlacedIn(entities, 'obj-bear', 'cnt-coffee-table')) return false
        return foundCount(entities) >= 2
      },
      type: 'move-entity',
      targetId: 'obj-bear',
      // 叼到卧室床头枕头区（对齐 decor-toy-bear 位置 0.5, 0.32, -2.0）
      targetPosition: { room: 'bedroom', x: 0.5, y: 0.32, z: -2.0 },
      message: '🐱 钥匙猫趁你不注意，叼走了玩具熊跑到卧室！位置记忆已失效，请重新寻找。',
      description: '钥匙猫二次恶作剧：把玩具熊从厨房移到卧室床上',
      memoryType: 'spatial',
      markMemoryOutdated: 'obj-bear',
      eventEffect: 'cat-prints',
      toastType: 'cat' as const,
    },
    {
      id: 'se-time-warning',
      trigger: (
        _step: number,
        _entities: EntityStateSnapshot[],
        _currentRoom: RoomId,
        _rooms: RoomMap | undefined,
        ctx: StageContext | undefined,
      ) => {
        if (!ctx) return false
        if (ctx.triggeredEvents.has('se-time-warning')) return false
        // 剩余约 30 秒（elapsedMs > 60s）时提示
        return ctx.elapsedMs >= 60000
      },
      type: 'message',
      message: '⏰ MEM-07：「还剩 30 秒！主人已经在门口跺脚了。」',
      description: '剩余 30 秒时间警告',
      memoryType: 'spatial',
      toastType: 'warning' as const,
    },
    {
      id: 'se-found-three',
      trigger: (
        _step: number,
        entities: EntityStateSnapshot[],
        _currentRoom: RoomId,
        _rooms: RoomMap | undefined,
        ctx: StageContext | undefined,
      ) => {
        if (ctx?.triggeredEvents.has('se-found-three')) return false
        return foundCount(entities) >= 3
      },
      type: 'message',
      message: '🌟 MEM-07：「已经找到 3 件了！就差最后一件！」',
      description: '找到 3 件物品鼓励',
      memoryType: 'spatial',
      toastType: 'success' as const,
    },
  ],

  probes: [
    {
      id: 'p-books-room',
      type: 'location',
      question: '📖 书被钥匙猫藏在了哪个房间？',
      options: ['客厅', '卧室', '厨房', '玄关'],
      correctAnswer: '客厅',
      dependsOnMemoryType: 'spatial',
      difficulty: 'easy',
      relatedObjectIds: ['obj-books'],
    },
    {
      id: 'p-mug-room',
      type: 'location',
      question: '☕ 马克杯被藏在了哪个房间？',
      options: ['客厅', '卧室', '厨房', '玄关'],
      correctAnswer: '卧室',
      dependsOnMemoryType: 'spatial',
      difficulty: 'easy',
      relatedObjectIds: ['obj-mug'],
    },
    {
      id: 'p-bear-room',
      type: 'location',
      question: '🧸 玩具熊被藏在了哪个房间？',
      options: ['客厅', '卧室', '厨房', '玄关'],
      correctAnswer: '厨房',
      dependsOnMemoryType: 'spatial',
      difficulty: 'medium',
      relatedObjectIds: ['obj-bear'],
    },
    {
      id: 'p-radio-room',
      type: 'location',
      question: '📻 收音机被藏在了哪个房间？',
      options: ['客厅', '卧室', '厨房', '玄关'],
      correctAnswer: '玄关',
      dependsOnMemoryType: 'spatial',
      difficulty: 'medium',
      relatedObjectIds: ['obj-radio'],
    },
    {
      id: 'p-bear-moved',
      type: 'state',
      question: '🦁 钥匙猫二次恶作剧把玩具熊叼到了哪个房间？',
      options: ['客厅', '卧室', '厨房', '玄关'],
      correctAnswer: '卧室',
      dependsOnMemoryType: 'spatial',
      difficulty: 'medium',
      relatedObjectIds: ['obj-bear'],
      relatedEventIds: ['se-cat-second-prank'],
      hint: '回忆钥匙猫叼走玩具熊后的去向',
    },
    {
      id: 'p-target-zone',
      type: 'location',
      question: '🎯 找到的物品应该放回到哪里？',
      options: ['客厅茶几', '卧室床头柜', '厨房台面', '玄关柜'],
      correctAnswer: '客厅茶几',
      dependsOnMemoryType: 'spatial',
      difficulty: 'easy',
    },
  ],
}
