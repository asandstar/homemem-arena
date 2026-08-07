import type { DialogSequence } from './dialog'

export const dialogSequences: DialogSequence[] = [
  // ===== L1：基础操作 + 第一次记忆 =====
  {
    id: 'ds-tutorial-start',
    name: '餐桌整理入门开场',
    trigger: { type: 'start', value: 'task-clean-table' },
    priority: 10,
    nodes: [
      {
        id: 'dtut-1',
        speaker: 'system',
        speakerName: 'MEM-07',
        text: '欢迎来到记忆宅邸。第一关只有三件餐具，没有时间限制。我们先学习最重要的动作：观察并保存一条位置记忆。',
      },
      {
        id: 'dtut-2',
        speaker: 'system',
        speakerName: 'MEM-07',
        text: '先靠近任意餐具按 E。记忆槽出现记录后，再按 F 拾取：马克杯放水槽，盘子和叉子放橱柜。',
        choices: [
          {
            id: 'c-dtut-ready',
            text: '明白了，先按 E 记住！',
            effect: { type: 'score', value: 50 },
          },
          {
            id: 'c-dtut-hint',
            text: '再说一次操作键',
            effect: { type: 'hint', value: 'WASD 移动；E 保存位置记忆；F 拾取或放置；马克杯→水槽，盘子和叉子→橱柜。' },
          },
        ],
      },
    ],
  },
  {
    id: 'ds-tutorial-memory-saved',
    name: '第一条记忆已保存',
    trigger: { type: 'goalComplete', value: 'g-save-first-memory' },
    priority: 9,
    nodes: [
      {
        id: 'dtut-memory-1',
        speaker: 'system',
        speakerName: 'MEM-07',
        text: '第一条位置记忆保存成功！现在按 F 拾取餐具，靠近发光目标区再按 F 放下。',
        autoContinue: true,
        autoContinueDelay: 2200,
      },
    ],
  },
  {
    id: 'ds-tutorial-complete',
    name: '餐桌整理入门完成',
    trigger: { type: 'event', value: 'level_complete_task-clean-table' },
    priority: 15,
    nodes: [
      {
        id: 'dtut-comp-1',
        speaker: 'system',
        speakerName: 'MEM-07',
        text: '三件餐具全部归位。你已经会保存一条记忆，也掌握了拾取和放置。',
      },
      {
        id: 'dtut-comp-2',
        speaker: 'system',
        speakerName: 'MEM-07',
        text: '下一关会把三件物品分散到三个房间。你需要分别记住它们，建立一张稳定的空间地图。',
        choices: [
          {
            id: 'c-dtut-next',
            text: '进入稳定记忆考验！',
            effect: { type: 'score', value: 100 },
          },
        ],
      },
    ],
  },

  // ===== L2：稳定空间记忆 RECALL =====
  {
    id: 'ds-leave-home-start',
    name: '稳定空间记忆开场',
    trigger: { type: 'start', value: 'task-leave-home' },
    priority: 10,
    nodes: [
      {
        id: 'dlh-1',
        speaker: 'narrator',
        speakerName: '记忆宅邸',
        text: '🐱 钥匙猫把书、马克杯和收音机分别留在客厅、卧室和玄关。主人希望把它们收回客厅茶几。',
        autoContinue: true,
        autoContinueDelay: 2400,
      },
      {
        id: 'dlh-2',
        speaker: 'system',
        speakerName: 'MEM-07',
        text: '先巡查三个房间，靠近每件物品分别按 E。三个记忆槽都记录后，才进入取回阶段。',
      },
      {
        id: 'dlh-3',
        speaker: 'character',
        speakerName: '钥匙猫',
        text: '喵~ 我会制造一点声音和脚印。不过这次我不移动东西，你敢相信自己的记忆吗？',
        choices: [
          {
            id: 'c-dlh-ready',
            text: '先建立三条稳定记忆',
            effect: { type: 'score', value: 50 },
          },
          {
            id: 'c-dlh-hint',
            text: '这一关和第三关有什么不同？',
            effect: { type: 'hint', value: '第二关环境稳定：记忆没有变红就仍然可信。第三关现实会变化，需要更新过期记忆。' },
          },
        ],
      },
    ],
  },
  {
    id: 'ds-leave-home-room-living',
    name: '客厅编码提示',
    trigger: { type: 'roomEnter', value: 'living' },
    priority: 5,
    nodes: [
      {
        id: 'dlh-living-1',
        speaker: 'system',
        speakerName: 'MEM-07',
        text: '客厅里有书。找到后先按 E，让记忆槽记录它的位置。',
        autoContinue: true,
        autoContinueDelay: 1800,
      },
    ],
  },
  {
    id: 'ds-leave-home-room-bedroom',
    name: '卧室编码提示',
    trigger: { type: 'roomEnter', value: 'bedroom' },
    priority: 5,
    nodes: [
      {
        id: 'dlh-bedroom-1',
        speaker: 'system',
        speakerName: 'MEM-07',
        text: '卧室里有马克杯。观察它的位置并按 E，不要急着拾取。',
        autoContinue: true,
        autoContinueDelay: 1800,
      },
    ],
  },
  {
    id: 'ds-leave-home-room-entrance',
    name: '玄关编码提示',
    trigger: { type: 'roomEnter', value: 'entrance' },
    priority: 5,
    nodes: [
      {
        id: 'dlh-entrance-1',
        speaker: 'system',
        speakerName: 'MEM-07',
        text: '玄关里有收音机。按 E 保存第三条记忆后，空间地图就完整了。',
        autoContinue: true,
        autoContinueDelay: 1800,
      },
    ],
  },
  {
    id: 'ds-leave-home-map-ready',
    name: '稳定空间地图完成',
    trigger: { type: 'goalComplete', value: 'g-encode-stable-map' },
    priority: 9,
    nodes: [
      {
        id: 'dlh-map-1',
        speaker: 'system',
        speakerName: 'MEM-07',
        text: '三条位置记忆都已建立。现在按记忆找回物品，全部送到客厅茶几。',
        autoContinue: true,
        autoContinueDelay: 2200,
      },
    ],
  },
  {
    id: 'ds-leave-home-cat-event',
    name: '钥匙猫假干扰',
    trigger: { type: 'event', value: 'se-cat-second-prank' },
    priority: 10,
    nodes: [
      {
        id: 'dlh-cat-1',
        speaker: 'character',
        speakerName: '钥匙猫',
        text: '喵呜！走廊这么大动静，你是不是要怀疑自己的记忆啦？',
      },
      {
        id: 'dlh-cat-2',
        speaker: 'system',
        speakerName: 'MEM-07',
        text: '记忆没有变红，现实也没有冲突。继续相信原来的稳定位置。',
        autoContinue: true,
        autoContinueDelay: 2000,
      },
    ],
  },
  {
    id: 'ds-leave-home-complete',
    name: '稳定空间记忆完成',
    trigger: { type: 'event', value: 'level_complete_task-leave-home' },
    priority: 15,
    nodes: [
      {
        id: 'dlh-comp-1',
        speaker: 'system',
        speakerName: 'MEM-07',
        text: 'RECALL 校准完成：你建立了三条空间记忆，并在假干扰中正确地继续相信它们。',
      },
      {
        id: 'dlh-comp-2',
        speaker: 'character',
        speakerName: '钥匙猫',
        text: '喵~ 稳定的记忆难不倒你。下一次，我可真的要改变现实了。',
      },
      {
        id: 'dlh-comp-3',
        speaker: 'system',
        speakerName: 'MEM-07',
        text: '下一关：一条原本正确的位置记忆会突然过期。你必须发现冲突，并主动更新它。',
        choices: [
          {
            id: 'c-dlh-next',
            text: '进入记忆更新考验！',
            effect: { type: 'score', value: 100 },
          },
        ],
      },
    ],
  },

  // ===== L3：过期记忆 UPDATE =====
  {
    id: 'ds-laundry-sort-start',
    name: '过期的早餐记忆开场',
    trigger: { type: 'start', value: 'task-laundry-sort' },
    priority: 10,
    nodes: [
      {
        id: 'dls-1',
        speaker: 'narrator',
        speakerName: '记忆宅邸',
        text: '🥣 餐厨里飘着早餐香气。麦片、碗和杯子收在北墙下层橱柜，勺子已经在餐桌上。',
        autoContinue: true,
        autoContinueDelay: 2300,
      },
      {
        id: 'dls-2',
        speaker: 'system',
        speakerName: 'MEM-07',
        text: '上一关记忆始终可信；这一关现实会变化。先按 E 记住麦片，再去摆餐具。回来发现冲突时，要重新观察并再次按 E 更新。',
        choices: [
          {
            id: 'c-dls-ready',
            text: '明白了：编码、核对、更新',
            effect: { type: 'score', value: 50 },
          },
          {
            id: 'c-dls-hint',
            text: '怎么判断记忆过期？',
            effect: { type: 'hint', value: '回到记忆中的旧位置，如果现实与记录不一致，记忆就已过期。重新观察附近，找到后按 E 更新。' },
          },
        ],
      },
    ],
  },
  {
    id: 'ds-laundry-sort-event-moves-cereal',
    name: '麦片位置变化',
    trigger: { type: 'event', value: 'se-cereal-moved' },
    priority: 10,
    nodes: [
      {
        id: 'dls-event-1',
        speaker: 'system',
        speakerName: 'MEM-07',
        text: '警告：麦片记忆已经变红。先回旧位置核对现实，不要直接相信，也不要立刻丢弃。',
      },
      {
        id: 'dls-event-2',
        speaker: 'narrator',
        speakerName: '记忆宅邸',
        text: '身后传来很轻的柜门声，但系统没有告诉你麦片的新位置。',
        autoContinue: true,
        autoContinueDelay: 2000,
      },
    ],
  },
  {
    id: 'ds-laundry-sort-memory-updated',
    name: '麦片记忆更新完成',
    trigger: { type: 'goalComplete', value: 'g-update-cereal-memory' },
    priority: 9,
    nodes: [
      {
        id: 'dls-update-1',
        speaker: 'system',
        speakerName: 'MEM-07',
        text: '新位置已经写入记忆槽。现在这条记忆重新可信，可以据此完成早餐。',
        autoContinue: true,
        autoContinueDelay: 2200,
      },
    ],
  },
  {
    id: 'ds-laundry-sort-complete',
    name: '过期记忆更新完成',
    trigger: { type: 'event', value: 'level_complete_task-laundry-sort' },
    priority: 15,
    nodes: [
      {
        id: 'dls-comp-1',
        speaker: 'system',
        speakerName: 'MEM-07',
        text: 'UPDATE 校准完成：你先相信稳定记忆，发现现实冲突后又正确更新了过期记忆。',
      },
      {
        id: 'dls-comp-2',
        speaker: 'narrator',
        speakerName: '记忆宅邸',
        text: '麦片已经上桌，碗和杯子也收进水槽。三阶段记忆训练全部完成。',
        autoContinue: true,
        autoContinueDelay: 2500,
      },
    ],
  },

  // ===== 通用事件对话 =====
  {
    id: 'ds-memory-save',
    name: '记忆保存反馈',
    trigger: { type: 'event', value: 'memory_save' },
    priority: 6,
    nodes: [
      {
        id: 'dm-save-1',
        speaker: 'system',
        speakerName: 'MEM-07',
        text: '📝 记忆已保存。位置信息已记录到记忆槽。',
        autoContinue: true,
        autoContinueDelay: 1500,
      },
    ],
  },
  {
    id: 'ds-memory-expire',
    name: '记忆过期警告',
    trigger: { type: 'event', value: 'memory_expire' },
    priority: 7,
    nodes: [
      {
        id: 'dm-expire-1',
        speaker: 'system',
        speakerName: 'MEM-07',
        text: '⚠️ 记忆已过期——该物品的位置可能已发生变化，需要重新确认。',
        autoContinue: true,
        autoContinueDelay: 2000,
      },
    ],
  },
  {
    id: 'ds-rank-s',
    name: 'S级评价',
    trigger: { type: 'event', value: 'rank_s' },
    priority: 20,
    nodes: [
      {
        id: 'dr-s-1',
        speaker: 'system',
        speakerName: 'MEM-07',
        text: '🏆 S 级评价！你的记忆能力达到了专业水准——也许我的记忆模块该向你学习。',
        autoContinue: true,
        autoContinueDelay: 2500,
      },
    ],
  },
  {
    id: 'ds-rank-a',
    name: 'A级评价',
    trigger: { type: 'event', value: 'rank_a' },
    priority: 20,
    nodes: [
      {
        id: 'dr-a-1',
        speaker: 'system',
        speakerName: 'MEM-07',
        text: '🌟 A 级评价！表现非常出色！',
        autoContinue: true,
        autoContinueDelay: 1500,
      },
    ],
  },
  {
    id: 'ds-wrong-place',
    name: '放错位置',
    trigger: { type: 'event', value: 'wrong_place' },
    priority: 4,
    nodes: [
      {
        id: 'dw-wrong-1',
        speaker: 'system',
        speakerName: 'MEM-07',
        text: '❌ 这个物品不属于这里。看看目标区的提示吧。',
        autoContinue: true,
        autoContinueDelay: 1500,
      },
    ],
  },
  {
    id: 'ds-event-wrong-pick',
    name: '拾取错误物品',
    trigger: { type: 'event', value: 'wrong_pick' },
    priority: 6,
    nodes: [
      {
        id: 'dwp-1',
        speaker: 'system',
        speakerName: 'MEM-07',
        text: '⚠️ 数据核对失败：该物品与当前任务目标不匹配。建议立即放下——错误拾取平均会消耗 8.3 秒决策时间。',
        autoContinue: true,
        autoContinueDelay: 2200,
      },
      {
        id: 'dwp-2',
        speaker: 'narrator',
        speakerName: '记忆宅邸',
        text: '手中的物品轻轻颤动，仿佛在低语："我并不是你寻找的那一个..."',
        autoContinue: true,
        autoContinueDelay: 2000,
      },
    ],
  },
  {
    id: 'ds-event-stagnation',
    name: '长时间停留提示',
    trigger: { type: 'event', value: 'stagnation' },
    priority: 5,
    nodes: [
      {
        id: 'dst-1',
        speaker: 'narrator',
        speakerName: '记忆宅邸',
        text: '时间的尘埃在脚下静静堆积，这间屋子的空气似乎凝固了...等待着一个动作来打破沉寂。',
        autoContinue: true,
        autoContinueDelay: 2200,
      },
      {
        id: 'dst-2',
        speaker: 'system',
        speakerName: 'MEM-07',
        text: '检测到停留时长超出阈值。建议切换房间搜索——其他房间的物品或许正在等你发现。',
        autoContinue: true,
        autoContinueDelay: 2000,
      },
    ],
  },
  {
    id: 'ds-event-combo-3',
    name: '连击赞美',
    trigger: { type: 'event', value: 'combo_3' },
    priority: 12,
    nodes: [
      {
        id: 'dc3-1',
        speaker: 'system',
        speakerName: 'MEM-07',
        text: '🎯 三连击达成！连续正确率 100%——你的操作序列比我的预测模型还要精准 0.7 个标准差。看来偶尔的故障，也未必是坏事。',
        choices: [
          {
            id: 'c-dc3-score',
            text: '谢谢，我会保持节奏！',
            effect: { type: 'score', value: 80 },
          },
          {
            id: 'c-dc3-memory',
            text: '能扩展一下记忆容量吗？',
            effect: { type: 'memory', value: 1 },
          },
        ],
      },
    ],
  },
]

export function getDialogSequenceByTrigger(
  triggerType: 'start' | 'roomEnter' | 'event' | 'time' | 'goalComplete',
  triggerValue: string | number,
): DialogSequence | undefined {
  return dialogSequences.find(
    (sequence) => sequence.trigger.type === triggerType && sequence.trigger.value === triggerValue,
  )
}

export function getDialogSequenceById(id: string): DialogSequence | undefined {
  return dialogSequences.find((sequence) => sequence.id === id)
}
