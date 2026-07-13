import type { DialogSequence } from './dialog'

export const dialogSequences: DialogSequence[] = [
  {
    id: 'ds-clean-table-start',
    name: '餐桌混乱开场',
    trigger: { type: 'start', value: 'task-clean-table' },
    priority: 10,
    nodes: [
      {
        id: 'dct-1',
        speaker: 'narrator',
        speakerName: '记忆宅邸',
        text: '🍽️ 聚餐后的餐桌一片狼藉，室友的纸条还压在脏盘子下面...',
        autoContinue: true,
        autoContinueDelay: 2000,
      },
      {
        id: 'dct-2',
        speaker: 'system',
        speakerName: 'MEM-07 系统',
        text: '检测到混合物品：脏杯子、干净杯子、脏盘子、餐巾纸、遥控器。注意区分相似物品！',
      },
      {
        id: 'dct-3',
        speaker: 'character',
        speakerName: '餐盘精',
        text: '嘿嘿嘿~ 把这些东西都放回桌子上就有趣了！',
        choices: [
          {
            id: 'c-dct-ready',
            text: '我才不会被你捣乱！开始收拾！',
            effect: { type: 'score', value: 50 },
          },
          {
            id: 'c-dct-hint',
            text: '等等，能给我一些提示吗？',
            effect: { type: 'hint', value: '脏杯子放洗碗机，餐巾纸扔垃圾桶，遥控器放客厅茶几' },
          },
        ],
      },
    ],
  },
  {
    id: 'ds-clean-table-room-dining',
    name: '进入餐厅对话',
    trigger: { type: 'roomEnter', value: 'dining' },
    priority: 5,
    nodes: [
      {
        id: 'dct-dining-1',
        speaker: 'narrator',
        speakerName: '记忆宅邸',
        text: '餐桌上杯盘狼藉，两个杯子摆在一起，一个干净一个脏...',
      },
    ],
  },
  {
    id: 'ds-clean-table-room-kitchen',
    name: '进入厨房对话',
    trigger: { type: 'roomEnter', value: 'kitchen' },
    priority: 5,
    nodes: [
      {
        id: 'dct-kitchen-1',
        speaker: 'system',
        speakerName: 'MEM-07 系统',
        text: '厨房区域已扫描：洗碗机在左侧，垃圾桶在右侧。脏餐具请送入洗碗机。',
      },
    ],
  },
  {
    id: 'ds-clean-table-room-living',
    name: '进入客厅对话',
    trigger: { type: 'roomEnter', value: 'living' },
    priority: 5,
    nodes: [
      {
        id: 'dct-living-1',
        speaker: 'narrator',
        speakerName: '记忆宅邸',
        text: '客厅的茶几上还空着，遥控器应该放这里吧...',
      },
    ],
  },
  {
    id: 'ds-clean-table-goal-first',
    name: '第一个目标完成',
    trigger: { type: 'goalComplete', value: 'g-tissue' },
    priority: 8,
    nodes: [
      {
        id: 'dct-goal-1',
        speaker: 'character',
        speakerName: '餐盘精',
        text: '咦？垃圾居然扔对了！不过别得意，盘子和杯子还在桌上呢！',
      },
    ],
  },
  {
    id: 'ds-clean-table-event-plate-back',
    name: '餐盘精捣乱',
    trigger: { type: 'event', value: 'se-roommate-returns-dirty-plate' },
    priority: 10,
    nodes: [
      {
        id: 'dct-event-1',
        speaker: 'character',
        speakerName: '餐盘精',
        text: '嘻嘻嘻！盘子我又放回来了！你记得它原来在哪里吗？',
      },
      {
        id: 'dct-event-2',
        speaker: 'narrator',
        speakerName: '记忆宅邸',
        text: '餐盘精得意地蹦跳着，脏盘子又出现在了餐桌上...',
        autoContinue: true,
        autoContinueDelay: 2000,
      },
    ],
  },
  {
    id: 'ds-leave-home-start',
    name: '出门大作战开场',
    trigger: { type: 'start', value: 'task-leave-home' },
    priority: 10,
    nodes: [
      {
        id: 'dlh-1',
        speaker: 'narrator',
        speakerName: '记忆宅邸',
        text: '🌅 清晨的阳光透过窗帘，轻轻唤醒了记忆宅邸里的一切。',
        autoContinue: true,
        autoContinueDelay: 2000,
      },
      {
        id: 'dlh-2',
        speaker: 'character',
        speakerName: '钥匙猫',
        text: '喵~ 新来的小精灵？我是这房子的钥匙守护者——钥匙猫！',
      },
      {
        id: 'dlh-3',
        speaker: 'character',
        speakerName: '钥匙猫',
        text: '想帮主人出门？先找得到钥匙再说喵~ 钥匙猫已经开始行动了哦！',
        choices: [
          {
            id: 'c-dlh-ready',
            text: '我准备好了，开始任务！',
            effect: { type: 'score', value: 50 },
          },
          {
            id: 'c-dlh-hint',
            text: '等等，能给我一些提示吗？',
            effect: { type: 'hint', value: '钥匙在客厅茶几上，手机在卧室抽屉里' },
          },
        ],
      },
    ],
  },
  {
    id: 'ds-leave-home-room-living',
    name: '进入客厅对话',
    trigger: { type: 'roomEnter', value: 'living' },
    priority: 5,
    nodes: [
      {
        id: 'dlh-living-1',
        speaker: 'system',
        speakerName: 'MEM-07 系统',
        text: '检测到客厅环境。钥匙的初始位置应该就在附近...',
      },
    ],
  },
  {
    id: 'ds-leave-home-room-bedroom',
    name: '进入卧室对话',
    trigger: { type: 'roomEnter', value: 'bedroom' },
    priority: 5,
    nodes: [
      {
        id: 'dlh-bedroom-1',
        speaker: 'narrator',
        speakerName: '记忆宅邸',
        text: '卧室里静悄悄的，床头柜的抽屉微微透出一丝光亮...',
      },
    ],
  },
  {
    id: 'ds-leave-home-goal-first',
    name: '第一个目标完成',
    trigger: { type: 'goalComplete', value: 'g-key-on-tray' },
    priority: 8,
    nodes: [
      {
        id: 'dlh-goal-1',
        speaker: 'character',
        speakerName: '钥匙猫',
        text: '哦？这么快就找到钥匙了喵？还算有点本事嘛！',
      },
      {
        id: 'dlh-goal-2',
        speaker: 'character',
        speakerName: '钥匙猫',
        text: '不过别高兴太早，手机藏在抽屉里哦~ 要不要我帮忙找找？',
        choices: [
          {
            id: 'c-dlh-no-help',
            text: '不用，我自己找！',
            effect: { type: 'score', value: 100 },
          },
          {
            id: 'c-dlh-yes-help',
            text: '告诉我在哪里吧...',
            effect: { type: 'hint', value: '手机在卧室床头柜的抽屉里' },
          },
        ],
      },
    ],
  },
  {
    id: 'ds-leave-home-cat-event',
    name: '钥匙猫事件',
    trigger: { type: 'event', value: 'se-cat-pushes-key' },
    priority: 10,
    nodes: [
      {
        id: 'dlh-cat-1',
        speaker: 'character',
        speakerName: '钥匙猫',
        text: '哈哈哈！抓到了喵！钥匙我帮你"保管"一会儿~',
      },
      {
        id: 'dlh-cat-2',
        speaker: 'narrator',
        speakerName: '记忆宅邸',
        text: '钥匙猫得意地甩着尾巴，一溜烟跑向客厅角落...',
        autoContinue: true,
        autoContinueDelay: 2000,
      },
    ],
  },
  {
    id: 'ds-laundry-sort-start',
    name: '洗衣幽灵开场',
    trigger: { type: 'start', value: 'task-laundry-sort' },
    priority: 10,
    nodes: [
      {
        id: 'dls-1',
        speaker: 'narrator',
        speakerName: '记忆宅邸',
        text: '👻 洗衣房里传来窸窸窣窣的声音，三只篮子整齐地排成一排...',
        autoContinue: true,
        autoContinueDelay: 2000,
      },
      {
        id: 'dls-2',
        speaker: 'character',
        speakerName: '袜子幽灵',
        text: '嘿！新来的帮手？这些衣服我可是藏了好久呢~ 找到它们就算你赢！',
      },
      {
        id: 'dls-3',
        speaker: 'system',
        speakerName: 'MEM-07 系统',
        text: '检测到三类待分类物品：白色衣物、深色衣物、毛巾。注意袜子幽灵可能会移动物品！',
        choices: [
          {
            id: 'c-dls-ready',
            text: '我来挑战！开始分类！',
            effect: { type: 'score', value: 50 },
          },
          {
            id: 'c-dls-hint',
            text: '等等，能给我一些提示吗？',
            effect: { type: 'hint', value: '白衣服放白篮子，深色放黑篮子，毛巾放黄篮子，注意幽灵会捣乱！' },
          },
        ],
      },
    ],
  },
  {
    id: 'ds-laundry-sort-room-laundry',
    name: '进入洗衣房对话',
    trigger: { type: 'roomEnter', value: 'laundry' },
    priority: 5,
    nodes: [
      {
        id: 'dls-laundry-1',
        speaker: 'narrator',
        speakerName: '记忆宅邸',
        text: '洗衣房里散落着各种衣物，三只篮子静静等待着。空气中似乎漂浮着什么...',
      },
    ],
  },
  {
    id: 'ds-laundry-sort-goal-white',
    name: '白色分类完成',
    trigger: { type: 'goalComplete', value: 'g-white-sorted' },
    priority: 8,
    nodes: [
      {
        id: 'dls-goal-white-1',
        speaker: 'character',
        speakerName: '袜子幽灵',
        text: '白色的居然找齐了？！那只彩色衬衫你也找到了？哼，等着瞧！',
      },
    ],
  },
  {
    id: 'ds-laundry-sort-goal-dark',
    name: '深色分类完成',
    trigger: { type: 'goalComplete', value: 'g-dark-sorted' },
    priority: 8,
    nodes: [
      {
        id: 'dls-goal-dark-1',
        speaker: 'character',
        speakerName: '袜子幽灵',
        text: '牛仔裤和 T 恤都放对了...看来你还真有点本事嘛！',
      },
    ],
  },
  {
    id: 'ds-laundry-sort-event-moves-clothes',
    name: '袜子幽灵移动衣物',
    trigger: { type: 'event', value: 'se-cat-moves-clothes' },
    priority: 10,
    nodes: [
      {
        id: 'dls-event-1',
        speaker: 'character',
        speakerName: '袜子幽灵',
        text: '嘿嘿嘿！袜子我藏起来了！你记得它原来在哪里吗？',
      },
      {
        id: 'dls-event-2',
        speaker: 'narrator',
        speakerName: '记忆宅邸',
        text: '一道白色的影子一闪而过，白袜子消失在了毛巾篮附近...',
        autoContinue: true,
        autoContinueDelay: 2000,
      },
    ],
  },
  {
    id: 'ds-breakfast-start',
    name: '早餐时间循环开场',
    trigger: { type: 'start', value: 'task-breakfast' },
    priority: 10,
    nodes: [
      {
        id: 'dbf-1',
        speaker: 'narrator',
        speakerName: '记忆宅邸',
        text: '⏰ 深夜十一点，厨房的闹钟突然响了...时间好像在倒转...',
        autoContinue: true,
        autoContinueDelay: 2000,
      },
      {
        id: 'dbf-2',
        speaker: 'character',
        speakerName: '早餐闹钟',
        text: '嘀嘀嘀！错误！流程不对！重新开始！嘀嘀嘀！',
      },
      {
        id: 'dbf-3',
        speaker: 'system',
        speakerName: 'MEM-07 系统',
        text: '检测到时间异常循环。任务：按正确流程准备早餐并归位所有物品。主人的流程图是关键！',
        choices: [
          {
            id: 'c-dbf-ready',
            text: '我来打破这个循环！开始！',
            effect: { type: 'score', value: 50 },
          },
          {
            id: 'c-dbf-hint',
            text: '等等，流程是怎样的？',
            effect: { type: 'hint', value: '第一阶段：按序取出牛奶、麦片、碗、杯子放到餐桌。第二阶段：全部归位并关好容器。' },
          },
        ],
      },
    ],
  },
  {
    id: 'ds-breakfast-room-kitchen',
    name: '进入厨房对话',
    trigger: { type: 'roomEnter', value: 'kitchen' },
    priority: 5,
    nodes: [
      {
        id: 'dbf-kitchen-1',
        speaker: 'narrator',
        speakerName: '记忆宅邸',
        text: '厨房的灯自动亮了，冰箱门上贴着主人的流程图。闹钟的指针不安地跳动着...',
      },
    ],
  },
  {
    id: 'ds-breakfast-room-dining',
    name: '进入餐厅对话',
    trigger: { type: 'roomEnter', value: 'dining' },
    priority: 5,
    nodes: [
      {
        id: 'dbf-dining-1',
        speaker: 'system',
        speakerName: 'MEM-07 系统',
        text: '餐桌已准备就绪。按主人的流程：牛奶→麦片→碗→杯子，依次放置。',
      },
    ],
  },
  {
    id: 'ds-breakfast-goal-prepare',
    name: '早餐准备完成',
    trigger: { type: 'goalComplete', value: 'g-prepare-breakfast' },
    priority: 8,
    nodes: [
      {
        id: 'dbf-goal-prepare-1',
        speaker: 'character',
        speakerName: '早餐闹钟',
        text: '嘀嘀...准备阶段完成。接下来是归位阶段！记得关好所有容器！',
      },
      {
        id: 'dbf-goal-prepare-2',
        speaker: 'narrator',
        speakerName: '记忆宅邸',
        text: '闹钟的指针似乎平静了一些，但还在不停地转动...',
        autoContinue: true,
        autoContinueDelay: 2000,
      },
    ],
  },
  {
    id: 'ds-breakfast-event-cereal-moved',
    name: '早餐闹钟移动麦片',
    trigger: { type: 'event', value: 'se-cereal-moved-to-cabinet' },
    priority: 10,
    nodes: [
      {
        id: 'dbf-event-cereal-1',
        speaker: 'character',
        speakerName: '早餐闹钟',
        text: '嘀嘀嘀！麦片放错地方了！应该在上层橱柜！嘀嘀嘀！',
      },
      {
        id: 'dbf-event-cereal-2',
        speaker: 'narrator',
        speakerName: '记忆宅邸',
        text: '麦片盒自己飞了起来，稳稳地落在了上层橱柜的架子上...',
        autoContinue: true,
        autoContinueDelay: 2000,
      },
    ],
  },
]

export function getDialogSequenceByTrigger(
  triggerType: 'start' | 'roomEnter' | 'event' | 'time' | 'goalComplete',
  triggerValue: string | number
): DialogSequence | undefined {
  return dialogSequences.find((seq) => 
    seq.trigger.type === triggerType && seq.trigger.value === triggerValue
  )
}

export function getDialogSequenceById(id: string): DialogSequence | undefined {
  return dialogSequences.find((seq) => seq.id === id)
}