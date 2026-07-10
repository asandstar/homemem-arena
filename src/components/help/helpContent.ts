export interface HelpTab {
  id: string
  icon: string
  label: string
  sections: HelpSection[]
}

export interface HelpSection {
  title: string
  items: HelpItem[]
}

export interface HelpItem {
  label?: string
  description?: string
  tip?: string
}

export const helpTabs: HelpTab[] = [
  {
    id: 'controls',
    icon: '🎮',
    label: '操作说明',
    sections: [
      {
        title: '基础操作',
        items: [
          { label: 'WASD', description: '移动角色' },
          { label: '拖动鼠标', description: '转动视角（第一人称模式）' },
          { label: 'V', description: '切换视角（第一人称 / 俯视）' },
          { label: 'F', description: '与物体/容器交互（拾取/放置/开关）' },
          { label: '点击物体', description: '也可以直接点击物体进行拾取或交互' },
          { label: 'E', description: '保存当前看到的物体到记忆槽' },
          { label: 'Tab', description: '显示/隐藏任务面板' },
          { label: 'R', description: '展开/收起事件日志' },
          { label: 'H', description: '打开/关闭帮助面板' },
          { label: 'ESC', description: '关闭弹窗 / 暂停（任务简报时）' },
        ],
      },
      {
        title: '交互方式',
        items: [
          {
            description: '拾取物品：靠近物品后按 F 键，或直接点击物品',
            tip: '手中只能拿一个物品',
          },
          {
            description: '放置物品：手持物品时，靠近容器按 F 键，或点击容器',
            tip: '注意：要放在正确的位置才能得分！',
          },
          {
            description: '打开/关闭容器：手中没有物品时，靠近容器按 F 键',
            tip: '有些容器打开后才能看到里面的东西',
          },
          {
            description: '从容器中拿东西：打开容器后点击里面的物品',
          },
        ],
      },
    ],
  },
  {
    id: 'memory',
    icon: '🧠',
    label: '记忆系统',
    sections: [
      {
        title: '为什么要保存记忆？',
        items: [
          {
            description: '游戏中有些物体会被移动或藏起来，你需要靠记忆找到它们。',
          },
          {
            description: '按下 E 键可以把眼前的物体保存到记忆槽，方便之后回顾。',
          },
          {
            description: '记忆是有限的（只有 4 个槽位），所以要慎重选择保存什么！',
          },
        ],
      },
      {
        title: '记忆状态说明',
        items: [
          { label: '置信度', description: '记忆的准确程度，会随着时间和干扰逐渐降低' },
          { label: '过期（红色）', description: '物体可能已经被移动了，这条记忆不可靠！', tip: '过期的记忆仍然可以参考，但不要完全相信' },
          { label: '锁定（锁图标）', description: '锁定的记忆不会被新记忆覆盖，也不会过期', tip: '重要的物品位置记得锁定！' },
          { label: '删除（垃圾桶图标）', description: '手动删除不需要的记忆，腾出槽位' },
        ],
      },
      {
        title: '使用技巧',
        items: [
          { description: '任务开始时，先到处逛逛，把重要物品的位置保存下来' },
          { description: '异常事件发生后，检查相关记忆是否过期了' },
          { description: '关键物品（如钥匙）的记忆一定要锁定！' },
        ],
      },
    ],
  },
  {
    id: 'chaos',
    icon: '⚠️',
    label: '混乱值',
    sections: [
      {
        title: '什么是混乱值？',
        items: [
          {
            description: '混乱值代表家里的"失控程度"。越高代表越混乱。',
          },
          {
            description: '混乱值会随时间缓慢上升，异常事件会让它大幅上升。',
          },
        ],
      },
      {
        title: '混乱值高了会怎样？',
        items: [
          { description: '物品更容易被移动或藏起来' },
          { description: '记忆更容易过期，置信度下降更快' },
          { description: '可能触发更多异常事件' },
          { description: '最终评分会受到影响' },
        ],
      },
      {
        title: '怎么降低混乱值？',
        items: [
          { description: '把物品放回正确的位置 ✅' },
          { description: '完成任务目标' },
          { description: '保持家里整洁有序' },
          { tip: '连续正确放置物品可以获得 Combo 加分，也能更快降低混乱值！' },
        ],
      },
    ],
  },
  {
    id: 'goal',
    icon: '🎯',
    label: '游戏目标',
    sections: [
      {
        title: '怎么算完成任务？',
        items: [
          {
            description: '每个任务有多个目标，完成所有目标就算通关。',
          },
          {
            description: '目标可能是：把某个物品放到正确位置、把东西洗干净、整理房间等。',
          },
          {
            description: '左上角的任务面板会显示当前进度，完成的目标会变绿。',
          },
        ],
      },
      {
        title: '评分机制',
        items: [
          { label: '基础分', description: '正确放置物品获得基础分数' },
          { label: 'Combo 加成', description: '连续正确放置可以累计 Combo，分数翻倍！' },
          { label: '混乱值惩罚', description: '混乱值越高，最终得分越低' },
          { label: '步数惩罚', description: '用的步数越多，得分越低' },
          { label: '评级', description: 'S > A > B > C > D，争取拿 S 级评价！' },
        ],
      },
      {
        title: '小提示',
        items: [
          { description: '俯视视角更容易找到物品，第一人称视角交互更有沉浸感' },
          { description: '小地图可以看到你所在房间和周围物品的大致位置' },
          { description: '不确定的事情，先存个记忆再说！' },
          { description: '听到奇怪的声音？可能有异常事件要发生了...' },
        ],
      },
    ],
  },
]
