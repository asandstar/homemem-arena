import type { DialogSequence } from './dialog'

export const dialogSequences: DialogSequence[] = [
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