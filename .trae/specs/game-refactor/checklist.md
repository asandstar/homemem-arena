# Echo House: Memory Butler - Verification Checklist

## 核心功能
- [x] Checkpoint 1: 首页看起来像游戏首页，有游戏标题和开始按钮
- [x] Checkpoint 2: 关卡选择页看起来像关卡选择界面，四个关卡卡片清晰展示
- [x] Checkpoint 3: 第一关「出门大作战」完整可玩，可以完成任务目标
- [x] Checkpoint 4: 有限记忆槽系统 - 3个槽位，按E保存记忆，可覆盖，可锁定
- [x] Checkpoint 5: 混乱值系统 - 随时间和错误操作增加，达到100触发关卡失败
- [x] Checkpoint 6: 评分和Combo系统 - 正确操作加分加combo，错误操作扣分断combo
- [x] Checkpoint 7: HUD游戏化布局 - 左上角任务、顶部混乱值、右上角得分、底部记忆槽

## 即时反馈
- [x] Checkpoint 8: 正确放置有绿色发光提示
- [x] Checkpoint 9: 错误放置有红色警告
- [x] Checkpoint 10: 捣乱事件触发有剧情提示
- [x] Checkpoint 11: 保存记忆有记忆槽闪烁效果
- [x] Checkpoint 12: Combo增加有浮动文字
- [x] Checkpoint 13: 混乱值高时HUD有故障效果

## 结算和AI
- [x] Checkpoint 14: 游戏化结算页 - 显示得分、评级、称号、统计数据
- [x] Checkpoint 15: AI诊断报告 - 语言像机器人诊断风格
- [x] Checkpoint 16: 其他三个关卡可以正常进入和游玩

## 技术验证
- [x] Checkpoint 17: npm run build 构建成功
- [x] Checkpoint 18: 控制台无严重报错（红色错误）

## 场景和模型精致化
- [x] Checkpoint 19: 关键任务物体不再是纯色方块，钥匙、手机、雨伞、牛奶、麦片、杯子、衣物都有可识别模型
- [x] Checkpoint 20: 冰箱、橱柜、水槽、洗碗机、沙发、床、洗衣篮、玄关托盘等家具和容器有明确形状
- [x] Checkpoint 21: 每个房间至少有 3 个视觉锚点，玩家能区分玄关、客厅、厨房、卧室、洗衣区、餐厅
- [x] Checkpoint 22: 任务物体、可交互容器、背景装饰有清晰视觉层级
- [x] Checkpoint 23: 场景有统一低多边形风格和统一色彩体系
- [x] Checkpoint 24: 场景有光照、阴影或接触阴影，物体不再像漂浮在地面上
- [x] Checkpoint 25: hover、正确放置、错误放置、保存记忆、捣乱事件都有明显视觉反馈
- [x] Checkpoint 26: 模型精致化后第一关仍然完整可玩，其他三个关卡仍然可以进入
- [x] Checkpoint 27: npm run build 构建成功，控制台无严重红色错误