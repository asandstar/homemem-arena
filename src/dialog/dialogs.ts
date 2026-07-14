import type { DialogSequence } from './dialog'

export const dialogSequences: DialogSequence[] = [
  // ===== 教学关卡：初次整理 =====
  {
    id: 'ds-tutorial-start',
    name: '初次整理开场',
    trigger: { type: 'start', value: 'task-clean-table' },
    priority: 10,
    nodes: [
      {
        id: 'dtut-1',
        speaker: 'system',
        speakerName: 'MEM-07',
        text: '你好，我是 MEM-07——这栋宅邸的家务机器人。不过...我的记忆模块出了点故障，只能同时记住 3 件物品的位置。',
      },
      {
        id: 'dtut-2',
        speaker: 'system',
        speakerName: 'MEM-07',
        text: '让我们从简单的任务开始。餐桌上有一个脏杯子和一张餐巾纸。脏杯子放进洗碗机，餐巾纸扔进垃圾桶。就这么简单！',
      },
      {
        id: 'dtut-3',
        speaker: 'system',
        speakerName: 'MEM-07',
        text: '靠近物品时按 F 拾取，拿着物品靠近目标区再按 F 放置。如果需要记住物品位置，按 E 保存记忆。',
        choices: [
          {
            id: 'c-dtut-ready',
            text: '明白了，开始吧！',
            effect: { type: 'score', value: 50 },
          },
          {
            id: 'c-dtut-hint',
            text: '能再解释一下操作吗？',
            effect: { type: 'hint', value: 'WASD移动，F拾取/放置，E保存记忆。脏杯子→洗碗机（右边），餐巾纸→垃圾桶（左边）' },
          },
        ],
      },
    ],
  },
  {
    id: 'ds-tutorial-goal-cup',
    name: '杯子归位',
    trigger: { type: 'goalComplete', value: 'g-dirty-cup' },
    priority: 8,
    nodes: [
      {
        id: 'dtut-gc-1',
        speaker: 'system',
        speakerName: 'MEM-07',
        text: '脏杯子已放入洗碗机！干得漂亮。还剩一张餐巾纸需要处理。',
        autoContinue: true,
        autoContinueDelay: 2000,
      },
    ],
  },
  {
    id: 'ds-tutorial-goal-tissue',
    name: '垃圾清理',
    trigger: { type: 'goalComplete', value: 'g-tissue' },
    priority: 8,
    nodes: [
      {
        id: 'dtut-gt-1',
        speaker: 'system',
        speakerName: 'MEM-07',
        text: '垃圾已清理！基础操作全部掌握。接下来会面临更有趣的挑战——不过别担心，你已经准备好了。',
        autoContinue: true,
        autoContinueDelay: 2500,
      },
    ],
  },
  {
    id: 'ds-tutorial-complete',
    name: '教学完成',
    trigger: { type: 'event', value: 'level_complete_task-clean-table' },
    priority: 15,
    nodes: [
      {
        id: 'dtut-comp-1',
        speaker: 'system',
        speakerName: 'MEM-07',
        text: '任务完成！你的学习速度比预期快 47%——看来记忆模块的故障并不影响学习能力。',
      },
      {
        id: 'dtut-comp-2',
        speaker: 'narrator',
        speakerName: '记忆宅邸',
        text: '餐厅恢复了整洁，阳光透过窗户洒在干净的餐桌上。宅邸的某个角落，似乎有什么东西在蠢蠢欲动...',
        autoContinue: true,
        autoContinueDelay: 3000,
      },
      {
        id: 'dtut-comp-3',
        speaker: 'system',
        speakerName: 'MEM-07',
        text: '下一关：主人要出门了，可是钥匙不见了...听说宅邸里住着一只爱藏东西的猫？',
        choices: [
          {
            id: 'c-dtut-next',
            text: '期待下一个挑战！',
            effect: { type: 'score', value: 100 },
          },
        ],
      },
    ],
  },

  // ===== 出门大作战 =====
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
        text: '🌅 清晨的阳光透过窗帘，轻轻唤醒了记忆宅邸。客厅的钟指向八点——主人还有十分钟出门！',
        autoContinue: true,
        autoContinueDelay: 2500,
      },
      {
        id: 'dlh-master-1',
        speaker: 'character',
        speakerName: '主人',
        text: '哎呀都八点了！我的钥匙呢？昨晚明明放在桌上...不对，手机也不见了！拜托拜托，帮我找找吧，今天那个会议真的不能迟到！辛苦你了！',
        autoContinue: true,
        autoContinueDelay: 2500,
      },
      {
        id: 'dlh-2',
        speaker: 'character',
        speakerName: '钥匙猫',
        text: '喵~ 又是新的一天！我是钥匙猫，这栋宅邸的守护者。钥匙、手机、雨伞...主人要带的东西可真多呢~',
      },
      {
        id: 'dlh-3',
        speaker: 'character',
        speakerName: '钥匙猫',
        text: '不过嘛...钥匙这种小东西，我可是最喜欢玩的！想帮主人出门？先找到钥匙再说喵~',
        choices: [
          {
            id: 'c-dlh-ready',
            text: '我准备好了，开始任务！',
            effect: { type: 'score', value: 50 },
          },
          {
            id: 'c-dlh-hint',
            text: '能给我一些提示吗？',
            effect: { type: 'hint', value: '钥匙在客厅茶几上，手机在卧室抽屉里，雨伞在玄关伞架旁。目标是玄关托盘。' },
          },
        ],
      },
    ],
  },
  {
    id: 'ds-leave-home-room-living',
    name: '进入客厅',
    trigger: { type: 'roomEnter', value: 'living' },
    priority: 5,
    nodes: [
      {
        id: 'dlh-living-1',
        speaker: 'system',
        speakerName: 'MEM-07',
        text: '客厅扫描完毕。茶几上似乎有物品——记得按 E 保存位置记忆，以防万一。',
        autoContinue: true,
        autoContinueDelay: 2000,
      },
    ],
  },
  {
    id: 'ds-leave-home-room-bedroom',
    name: '进入卧室',
    trigger: { type: 'roomEnter', value: 'bedroom' },
    priority: 5,
    nodes: [
      {
        id: 'dlh-bedroom-1',
        speaker: 'narrator',
        speakerName: '记忆宅邸',
        text: '卧室里静悄悄的，床头柜的抽屉微微透出一丝光亮...似乎有什么东西在里面震动。',
        autoContinue: true,
        autoContinueDelay: 2000,
      },
    ],
  },
  {
    id: 'ds-leave-home-room-entrance',
    name: '进入玄关',
    trigger: { type: 'roomEnter', value: 'entrance' },
    priority: 5,
    nodes: [
      {
        id: 'dlh-entrance-1',
        speaker: 'system',
        speakerName: 'MEM-07',
        text: '玄关到了。托盘在这里——把钥匙、手机、雨伞放到托盘上就完成任务。',
        autoContinue: true,
        autoContinueDelay: 2000,
      },
    ],
  },
  {
    id: 'ds-leave-home-goal-key',
    name: '钥匙归位',
    trigger: { type: 'goalComplete', value: 'g-key-on-tray' },
    priority: 8,
    nodes: [
      {
        id: 'dlh-gk-1',
        speaker: 'character',
        speakerName: '钥匙猫',
        text: '喵呜？！这都被你找到了？喵喵喵...人家明明把钥匙藏在最有趣的角落了喵！',
        autoContinue: true,
        autoContinueDelay: 2000,
      },
      {
        id: 'dlh-gk-2',
        speaker: 'character',
        speakerName: '钥匙猫',
        text: '哼哼，算你厉害喵~ 不过别得意太早，手机和雨伞还在跟我玩捉迷藏呢！咕噜咕噜...',
        autoContinue: true,
        autoContinueDelay: 2200,
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
        text: '哈哈哈！抓到了喵！钥匙我帮你"保管"一会儿~ 追我呀！',
        choices: [
          {
            id: 'c-dlh-cat-calm',
            text: '冷静分析，不慌不忙地找。',
            effect: { type: 'chaos', value: -10 },
          },
          {
            id: 'c-dlh-cat-rush',
            text: '气急败坏地满屋追赶！',
            effect: { type: 'chaos', value: 15 },
          },
        ],
      },
      {
        id: 'dlh-cat-2',
        speaker: 'narrator',
        speakerName: '记忆宅邸',
        text: '钥匙猫叼着钥匙一溜烟跑向了客厅角落...原来的记忆已经失效了！',
        autoContinue: true,
        autoContinueDelay: 2500,
      },
    ],
  },
  {
    id: 'ds-leave-home-complete',
    name: '出门大作战完成',
    trigger: { type: 'event', value: 'level_complete_task-leave-home' },
    priority: 15,
    nodes: [
      {
        id: 'dlh-comp-1',
        speaker: 'character',
        speakerName: '钥匙猫',
        text: '喵呜...主人居然准时出门了。你比我想象的厉害嘛！下次我会把钥匙藏到更有趣的地方！',
      },
      {
        id: 'dlh-comp-2',
        speaker: 'narrator',
        speakerName: '记忆宅邸',
        text: '主人的脚步声渐渐远去，宅邸又恢复了安静。钥匙猫跳上窗台，甩了甩尾巴，眯起了眼睛...',
        autoContinue: true,
        autoContinueDelay: 3000,
      },
      {
        id: 'dlh-comp-3',
        speaker: 'system',
        speakerName: 'MEM-07',
        text: '下一关：餐桌上杯盘狼藉...听说有个餐盘精喜欢把脏盘子偷偷放回去？',
        choices: [
          {
            id: 'c-dlh-next',
            text: '继续挑战！',
            effect: { type: 'score', value: 100 },
          },
        ],
      },
    ],
  },

  // ===== 洗衣幽灵 =====
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
        text: '👻 洗衣房里传来窸窸窣窣的声音...三只篮子整齐地排成一排，空气中似乎漂浮着什么。',
        autoContinue: true,
        autoContinueDelay: 2500,
      },
      {
        id: 'dls-2',
        speaker: 'character',
        speakerName: '袜子幽灵',
        text: '嘿！新来的帮手？这些衣服我可是藏了好久呢~ 白色、深色、毛巾，分错了会染色的哦！',
        choices: [
          {
            id: 'c-dls-ready',
            text: '我来挑战！开始分类！',
            effect: { type: 'score', value: 50 },
          },
          {
            id: 'c-dls-hint',
            text: '能给我一些提示吗？',
            effect: { type: 'hint', value: '白衣服放白篮子，深色放黑篮子，毛巾放黄篮子。注意那件彩色衬衫也算白色衣物！' },
          },
        ],
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
    id: 'ds-laundry-sort-complete',
    name: '洗衣幽灵完成',
    trigger: { type: 'event', value: 'level_complete_task-laundry-sort' },
    priority: 15,
    nodes: [
      {
        id: 'dls-comp-1',
        speaker: 'character',
        speakerName: '袜子幽灵',
        text: '呜...所有衣服都分类好了！我的游戏输了...下次我会把所有袜子都藏起来！哈哈哈！',
      },
      {
        id: 'dls-comp-2',
        speaker: 'narrator',
        speakerName: '记忆宅邸',
        text: '三只篮子整整齐齐，洗衣房终于恢复了平静...',
        autoContinue: true,
        autoContinueDelay: 2500,
      },
    ],
  },

  // ===== 早餐时间循环 =====
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
        autoContinueDelay: 2500,
      },
      {
        id: 'dbf-2',
        speaker: 'character',
        speakerName: '早餐闹钟',
        text: '嘀嘀嘀！错误！流程不对！重新开始！嘀嘀嘀！必须按照流程图来！',
      },
      {
        id: 'dbf-3',
        speaker: 'system',
        speakerName: 'MEM-07',
        text: '检测到时间异常循环。冰箱上贴着流程图：第一阶段—牛奶→麦片→碗→杯子放到餐桌。第二阶段—全部归位并关好容器。',
        choices: [
          {
            id: 'c-dbf-ready',
            text: '我来打破这个循环！',
            effect: { type: 'score', value: 50 },
          },
          {
            id: 'c-dbf-hint',
            text: '流程是什么？',
            effect: { type: 'hint', value: '第一阶段：按序取出牛奶→麦片→碗→杯子放到餐桌。第二阶段：全部归位，牛奶回冰箱，杯碗放洗碗机，麦片放橱柜，关好容器。' },
          },
        ],
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
        id: 'dbf-goal-1',
        speaker: 'character',
        speakerName: '早餐闹钟',
        text: '嘀嘀...准备阶段完成。接下来是归位阶段！记得关好所有容器！',
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
        id: 'dbf-event-1',
        speaker: 'character',
        speakerName: '早餐闹钟',
        text: '嘀嘀嘀！麦片放错地方了！应该在上层橱柜！嘀嘀嘀！',
      },
      {
        id: 'dbf-event-2',
        speaker: 'narrator',
        speakerName: '记忆宅邸',
        text: '麦片盒自己飞了起来，稳稳地落在了上层橱柜的架子上...',
        autoContinue: true,
        autoContinueDelay: 2000,
      },
    ],
  },
  {
    id: 'ds-breakfast-complete',
    name: '早餐时间循环完成',
    trigger: { type: 'event', value: 'level_complete_task-breakfast' },
    priority: 15,
    nodes: [
      {
        id: 'dbf-comp-1',
        speaker: 'character',
        speakerName: '早餐闹钟',
        text: '嘀嘀嘀！流程正确！时间循环已打破！恭喜你！',
      },
      {
        id: 'dbf-comp-2',
        speaker: 'narrator',
        speakerName: '记忆宅邸',
        text: '闹钟的指针终于停了下来，厨房恢复了正常的时间流动。深夜十一点的月光洒在干净的台面上...',
        autoContinue: true,
        autoContinueDelay: 3000,
      },
      {
        id: 'dbf-comp-3',
        speaker: 'system',
        speakerName: 'MEM-07',
        text: '所有关卡完成！你的记忆能力远超预期——也许故障反而是一种优势？',
        choices: [
          {
            id: 'c-dbf-finale',
            text: '谢谢你，MEM-07。',
            effect: { type: 'score', value: 200 },
          },
        ],
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

  // ===== 扩展事件对话：角色互动与个性 =====
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
  triggerValue: string | number
): DialogSequence | undefined {
  return dialogSequences.find((seq) => 
    seq.trigger.type === triggerType && seq.trigger.value === triggerValue
  )
}

export function getDialogSequenceById(id: string): DialogSequence | undefined {
  return dialogSequences.find((seq) => seq.id === id)
}
