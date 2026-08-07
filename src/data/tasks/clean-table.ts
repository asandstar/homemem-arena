// 关卡 1：餐桌整理（Procedural Memory 程序记忆 · 教程关）
// 目标：将 9 件餐具按类别归位（杯勺→水槽，盘叉→橱柜），练习移动/拾取/放置/开关容器
// 记忆类型：程序记忆（Procedural Memory · 动作序列）
// 难度：新手入门 · 无时限 · 无扰动 · 纯净教程环境
//
// 设计文档：docs/DESIGN_LEVEL_TASKS.md §3.1
// 资产：全部物品/容器有 GLB 模型（food/mug, food/plate, food/utensil-fork, food/utensil-spoon,
//       furniture/table, furniture/kitchenSink, furniture/kitchenCabinetDrawer, furniture/trashcan）

import type { EntityStateSnapshot, StageContext, TaskConfig } from '../../types/task'
import type { RoomId } from '../../types/room'

/** 房间元信息快照类型（与 ScriptedEventSpec.trigger 的 rooms 参数一致） */
type RoomMap = Record<string, { id: RoomId; name?: string; center?: { x: number; z?: number; y?: number } }>

// 容器局部坐标（dining 房间内，对齐 decorFurniture.ts 的装饰家具）
// cnt-sink / cnt-cabinet 不设 modelAssetId，由 decor-kit-sink / decor-kit-cabinet-1 承担视觉
const SINK_POS = { x: 0, z: -2.1 }       // 对齐 decor-kit-sink
const CABINET_POS = { x: -0.6, z: -2.1 } // 对齐 decor-kit-cabinet-1
const TRASHCAN_POS = { x: 1.5, z: -1.5 } // decorFurniture 无垃圾桶，task-container 自渲染

function entityPlacedIn(entities: EntityStateSnapshot[], configId: string, containerId: string): boolean {
  const e = entities.find((x) => x.configId === configId)
  return !!e && e.placedIn === containerId && e.status === 'placed'
}

/** 指定 ID 集合中所有物品是否都已放入指定容器 */
function allPlacedIn(entities: EntityStateSnapshot[], ids: string[], containerId: string): boolean {
  return ids.every((id) => entityPlacedIn(entities, id, containerId))
}

const MUG_IDS = ['obj-mug-1', 'obj-mug-2']
const SPOON_IDS = ['obj-spoon-1', 'obj-spoon-2', 'obj-spoon-3']
const PLATE_IDS = ['obj-plate-1', 'obj-plate-2']
const FORK_IDS = ['obj-fork-1', 'obj-fork-2']

export const cleanTableTask: TaskConfig = {
  id: 'task-clean-table',
  name: '餐桌整理',
  description: '🍽️ 欢迎来到记忆宅邸！MEM-07 的记忆模块刚做完夜间重启，从餐桌整理开始重新校准程序记忆。把 9 件餐具按类别归位——杯勺→水槽，盘叉→橱柜。慢慢来，别急！',
  memoryTypes: ['procedural'],
  difficulty: 'tutorial',
  rooms: ['dining'],
  iconKey: 'dish',
  tags: ['新手入门', '程序记忆', '基础交互'],
  // L1 无时限：鼓励玩家慢慢探索，不设 timeLimit
  // 出生点移出冰箱 AABB（冰箱 local x∈[-2.747,-1.973], z∈[-2.595,-2.025]），
  // 选 (-1.5, -1.5)：距冰箱东沿 0.47m、南沿 0.53m，>PLAYER_RADIUS(0.3)+padding，
  // 且不在橱柜/餐桌/餐椅任何 AABB 内；朝 spawnRotation 方向能看到餐桌与厨房工作区通路。
  spawnPosition: { x: -1.5, z: -1.5 },
  spawnRotation: (3 * Math.PI) / 4,

  briefing: `🍽️ 记忆宅邸 · 第一关（程序记忆 · 教程）

清晨，主人出门前留了张便签。MEM-07——家里那台被叫作"小橡"的旧款记忆管家机器人——刚从夜间重启中醒来，程序记忆模块还在嗡嗡校准。

主人便签：「小橡，昨晚聚餐太累我忘了收拾餐桌，你先把餐具归位再充电。杯、勺放水槽，盘、叉放橱柜，慢慢来。」

MEM-07：「校准进度 87%……动作序列模块已就绪。移动、拾取、放置——这些肌肉记忆我应该还记得。」

📋 归位规则：
  ☕ 马克杯 ×2  → 厨房水槽
  🥄 勺子 ×3   → 厨房水槽
  🍽️ 盘子 ×2  → 橱柜
  🍴 叉子 ×2  → 橱柜

操作说明：
  • WASD / 方向键 — 移动
  • 鼠标 — 转视角
  • F — 拾取 / 放置物品（靠近发光目标区按 F 放置）
  • E — 保存位置记忆（可选，但养成习惯有好处——听说这屋里有一只爱偷东西的猫）

💡 提示：垃圾桶也可以打开看看——靠近它按 F 开关。准备好了吗？`,

  completionText: '🎉 9 件餐具全部归位！程序记忆校准完成度：98.7%。\nMEM-07：「剩下的 1.3% 是……我好像忘了自己有没有关垃圾桶。玩笑啦。不过我监测到客厅有异常活动轨迹——主人叫它「钥匙猫」，下一关你就要见识了。」',
  failureText: '⏰ 别灰心，再来一次！\nMEM-07：「动作序列还在校准中。记住：杯、勺 → 水槽；盘、叉 → 橱柜。靠近物品按 F 拾取，靠近目标区按 F 放置。」',
  systemPrompt: '【MEM-07 日志】L1 程序记忆教程关。物品数量：9（mug×2, spoon×3, plate×2, fork×2）。无时限。记忆类型：程序记忆（动作序列校准）。无扰动事件。归位规则：cup+spoon→sink, plate+fork→cabinet。教学目标：移动/拾取/放置/开关容器。',

  objects: [
    // ========== 马克杯 ×2（food/mug）==========
    {
      id: 'obj-mug-1',
      name: '马克杯',
      category: 'cup',
      initialRoom: 'dining',
      initialPosition: { x: -0.5, y: 0, z: 0.2 },
      surfaceContainerId: 'cnt-dining-table',
      size: { x: 0.1, y: 0.1, z: 0.1 },
      color: '#d1d5db',
      modelAssetId: 'food/mug',
    },
    {
      id: 'obj-mug-2',
      name: '马克杯',
      category: 'cup',
      initialRoom: 'dining',
      initialPosition: { x: -0.5, y: 0, z: -0.2 },
      surfaceContainerId: 'cnt-dining-table',
      size: { x: 0.1, y: 0.1, z: 0.1 },
      color: '#d1d5db',
      modelAssetId: 'food/mug',
    },
    // ========== 勺子 ×3（food/utensil-spoon）==========
    {
      id: 'obj-spoon-1',
      name: '勺子',
      category: 'spoon',
      initialRoom: 'dining',
      initialPosition: { x: -0.15, y: 0, z: 0.2 },
      surfaceContainerId: 'cnt-dining-table',
      size: { x: 0.073, y: 0.2, z: 0.061 },
      color: '#cbd5e1',
      modelAssetId: 'food/utensil-spoon',
    },
    {
      id: 'obj-spoon-2',
      name: '勺子',
      category: 'spoon',
      initialRoom: 'dining',
      initialPosition: { x: -0.15, y: 0, z: -0.2 },
      surfaceContainerId: 'cnt-dining-table',
      size: { x: 0.073, y: 0.2, z: 0.061 },
      color: '#cbd5e1',
      modelAssetId: 'food/utensil-spoon',
    },
    {
      id: 'obj-spoon-3',
      name: '勺子',
      category: 'spoon',
      initialRoom: 'dining',
      initialPosition: { x: 0.15, y: 0, z: 0.2 },
      surfaceContainerId: 'cnt-dining-table',
      size: { x: 0.073, y: 0.2, z: 0.061 },
      color: '#cbd5e1',
      modelAssetId: 'food/utensil-spoon',
    },
    // ========== 盘子 ×2（food/plate）==========
    {
      id: 'obj-plate-1',
      name: '盘子',
      category: 'plate',
      initialRoom: 'dining',
      initialPosition: { x: 0.45, y: 0, z: 0.2 },
      surfaceContainerId: 'cnt-dining-table',
      size: { x: 0.18, y: 0.018, z: 0.18 },
      color: '#f3f4f6',
      modelAssetId: 'food/plate',
    },
    {
      id: 'obj-plate-2',
      name: '盘子',
      category: 'plate',
      initialRoom: 'dining',
      initialPosition: { x: 0.45, y: 0, z: -0.2 },
      surfaceContainerId: 'cnt-dining-table',
      size: { x: 0.18, y: 0.018, z: 0.18 },
      color: '#f3f4f6',
      modelAssetId: 'food/plate',
    },
    // ========== 叉子 ×2（food/utensil-fork）==========
    {
      id: 'obj-fork-1',
      name: '叉子',
      category: 'fork',
      initialRoom: 'dining',
      initialPosition: { x: 0.75, y: 0, z: 0.2 },
      surfaceContainerId: 'cnt-dining-table',
      size: { x: 0.05, y: 0.2, z: 0.0084 },
      color: '#b8c0c4',
      modelAssetId: 'food/utensil-fork',
    },
    {
      id: 'obj-fork-2',
      name: '叉子',
      category: 'fork',
      initialRoom: 'dining',
      initialPosition: { x: 0.75, y: 0, z: -0.2 },
      surfaceContainerId: 'cnt-dining-table',
      size: { x: 0.05, y: 0.2, z: 0.0084 },
      color: '#b8c0c4',
      modelAssetId: 'food/utensil-fork',
    },
  ],

  containers: [
    {
      id: 'cnt-dining-table',
      name: '餐桌',
      room: 'dining',
      // position.y=0 让 furniture/table GLB 贴地；surfaceHeight 对齐 effectiveAabb.y=0.653
      position: { x: 0, y: 0, z: 0 },
      size: { x: 1.683, y: 0.653, z: 0.895 },
      surfaceHeight: 0.653,
      color: '#92400e',
      initialOpen: true,
      acceptedCategories: [],
      acceptAny: false,
      modelAssetId: 'furniture/table',
    },
    {
      id: 'cnt-sink',
      name: '厨房水槽',
      room: 'dining',
      // 对齐 decor-kit-sink (0, 0, -2.1)；不设 modelAssetId，由 decor 承担 GLB 视觉
      // size.z 缩到 0.3 以避免碰撞盒越界出 dining 房间（z∈[-2.25,2.25]）
      position: { x: SINK_POS.x, y: 0, z: SINK_POS.z },
      size: { x: 0.538, y: 0.613, z: 0.30 },
      surfaceHeight: 0.613,
      color: '#a3a3a3',
      initialOpen: true,
      acceptedCategories: ['cup', 'spoon'],
      isTargetZone: true,
      targetLabel: '水槽（杯、勺放这里）',
    },
    {
      id: 'cnt-cabinet',
      name: '橱柜',
      room: 'dining',
      // 对齐 decor-kit-cabinet-1 (-0.6, 0, -2.1)；不设 modelAssetId，由 decor 承担 GLB 视觉
      // size.z 缩到 0.3 以避免碰撞盒越界出 dining 房间（z∈[-2.25,2.25]）
      position: { x: CABINET_POS.x, y: 0, z: CABINET_POS.z },
      size: { x: 0.538, y: 0.563, z: 0.30 },
      surfaceHeight: 0.563,
      color: '#92400e',
      initialOpen: true,
      acceptedCategories: ['plate', 'fork'],
      isTargetZone: true,
      targetLabel: '橱柜（盘、叉放这里）',
    },
    {
      id: 'cnt-trashcan',
      name: '垃圾桶',
      room: 'dining',
      // decorFurniture 无 decor-trashcan，task-container 自渲染 GLB
      position: { x: TRASHCAN_POS.x, y: 0, z: TRASHCAN_POS.z },
      size: { x: 0.4, y: 0.6, z: 0.4 },
      surfaceHeight: 0.6,
      color: '#4b5563',
      initialOpen: false, // 教学开关容器：初始关闭，玩家按 F 打开
      acceptedCategories: [], // 不接受餐具（纯教学开关练习）
      acceptAny: false,
      modelAssetId: 'furniture/trashcan',
    },
  ],

  goals: [
    {
      id: 'g-mugs-sink',
      description: '2 个马克杯放入水槽',
      memoryType: 'procedural',
      relatedObjectIds: MUG_IDS,
      predicate: (entities: EntityStateSnapshot[]) => allPlacedIn(entities, MUG_IDS, 'cnt-sink'),
      achievedMessage: '马克杯已放入水槽！',
    },
    {
      id: 'g-spoons-sink',
      description: '3 把勺子放入水槽',
      memoryType: 'procedural',
      relatedObjectIds: SPOON_IDS,
      predicate: (entities: EntityStateSnapshot[]) => allPlacedIn(entities, SPOON_IDS, 'cnt-sink'),
      achievedMessage: '勺子已放入水槽！',
    },
    {
      id: 'g-plates-cabinet',
      description: '2 个盘子放入橱柜',
      memoryType: 'procedural',
      relatedObjectIds: PLATE_IDS,
      predicate: (entities: EntityStateSnapshot[]) => allPlacedIn(entities, PLATE_IDS, 'cnt-cabinet'),
      achievedMessage: '盘子已放入橱柜！',
    },
    {
      id: 'g-forks-cabinet',
      description: '2 把叉子放入橱柜',
      memoryType: 'procedural',
      relatedObjectIds: FORK_IDS,
      predicate: (entities: EntityStateSnapshot[]) => allPlacedIn(entities, FORK_IDS, 'cnt-cabinet'),
      achievedMessage: '叉子已放入橱柜！',
    },
  ],

  scriptedEvents: [
    {
      id: 'se-welcome',
      trigger: (step: number) => step === 1,
      type: 'message',
      message: '👋 MEM-07：「欢迎！餐桌上有 9 件餐具需要归位——杯、勺 → 水槽；盘、叉 → 橱柜。慢慢来，别急。」',
      description: '欢迎提示，介绍 9 件物品与归位规则',
      memoryType: 'procedural',
      toastType: 'info' as const,
    },
    {
      id: 'se-demo-sink',
      trigger: (step: number) => step === 2,
      type: 'message',
      message: '💡 MEM-07：「看，水槽在亮——杯子和勺子放这里。」',
      description: '示范高亮：水槽',
      memoryType: 'procedural',
      toastType: 'info' as const,
      highlightDemo: {
        targetContainerId: 'cnt-sink',
        color: '#60a5fa',
        durationMs: 1800,
      },
    },
    {
      id: 'se-demo-cabinet',
      trigger: (step: number) => step === 4,
      type: 'message',
      message: '💡 MEM-07：「橱柜在这里——盘子和叉子放这里。」',
      description: '示范高亮：橱柜',
      memoryType: 'procedural',
      toastType: 'info' as const,
      highlightDemo: {
        targetContainerId: 'cnt-cabinet',
        color: '#f59e0b',
        durationMs: 1800,
      },
    },
    {
      id: 'se-demo-trashcan',
      trigger: (step: number) => step === 6,
      type: 'message',
      message: '💡 MEM-07：「垃圾桶现在是关着的。靠近它按 F 就能打开——试试看！」',
      description: '示范高亮：垃圾桶（教学开关容器）',
      memoryType: 'procedural',
      toastType: 'info' as const,
      highlightDemo: {
        targetContainerId: 'cnt-trashcan',
        color: '#10b981',
        durationMs: 1800,
      },
    },
    {
      id: 'se-place-hint',
      trigger: (
        _step: number,
        _entities: EntityStateSnapshot[],
        _currentRoom: RoomId,
        _rooms: RoomMap | undefined,
        ctx: StageContext | undefined,
      ) => {
        const held = ctx?.heldEntityConfigId
        return !!held && !(ctx?.triggeredEvents ?? new Set()).has('se-place-hint')
      },
      type: 'message',
      message: '📦 MEM-07：「拿着物品靠近发光的目标区，按 F 放置。杯、勺 → 水槽；盘、叉 → 橱柜。」',
      description: '拾取手持后提示放置',
      memoryType: 'procedural',
      toastType: 'info' as const,
    },
    {
      id: 'se-half-done',
      trigger: (
        _step: number,
        entities: EntityStateSnapshot[],
        _currentRoom: RoomId,
        _rooms: RoomMap | undefined,
        ctx: StageContext | undefined,
      ) => {
        if (ctx?.triggeredEvents.has('se-half-done')) return false
        const placedCount = entities.filter((e) => e.status === 'placed').length
        return placedCount >= 5
      },
      type: 'message',
      message: '🌟 MEM-07：「已经放对一半了！程序记忆正在重新校准，感觉越来越顺手了对吧？」',
      description: '完成过半鼓励',
      memoryType: 'procedural',
      toastType: 'success' as const,
    },
  ],

  probes: [
    {
      id: 'p-count-items',
      type: 'count',
      question: '餐桌上一开始共有几件餐具？',
      options: ['6', '7', '9', '10'],
      correctAnswer: '9',
      dependsOnMemoryType: 'procedural',
      difficulty: 'easy',
      hint: '杯×2 + 勺×3 + 盘×2 + 叉×2',
    },
    {
      id: 'p-cup-destination',
      type: 'location',
      question: '马克杯应该归位到哪里？',
      options: ['水槽', '橱柜', '垃圾桶', '餐桌'],
      correctAnswer: '水槽',
      dependsOnMemoryType: 'procedural',
      difficulty: 'easy',
    },
    {
      id: 'p-plate-destination',
      type: 'location',
      question: '盘子应该归位到哪里？',
      options: ['水槽', '橱柜', '垃圾桶', '餐桌'],
      correctAnswer: '橱柜',
      dependsOnMemoryType: 'procedural',
      difficulty: 'easy',
    },
    {
      id: 'p-fork-destination',
      type: 'location',
      question: '叉子应该归位到哪里？',
      options: ['水槽', '橱柜', '垃圾桶', '餐桌'],
      correctAnswer: '橱柜',
      dependsOnMemoryType: 'procedural',
      difficulty: 'easy',
    },
    {
      id: 'p-spoon-count',
      type: 'count',
      question: '桌上有几把勺子？',
      options: ['1', '2', '3', '4'],
      correctAnswer: '3',
      dependsOnMemoryType: 'procedural',
      difficulty: 'medium',
    },
  ],
}
