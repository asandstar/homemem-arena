# 第一关「出门大作战」重构计划

## 概述
重构 `src/data/tasks/leave-home.ts`，精简目标、调整时间、重写脚本事件，使关卡更聚焦于核心记忆玩法。

## 变更清单

### 1. 基础信息调整
- **timeLimit**: 90 → 180 秒
- **description**: 更新描述（移除充电宝相关内容）
- **briefing**: 重写为更短更游戏化的版本

### 2. 物体调整
- 保留钥匙（客厅茶几上）
- 保留手机（卧室床头柜抽屉里，隐藏）
- 保留雨伞（玄关伞架旁）
- **充电宝**：保留在 `objects` 数组中（作为隐藏 bonus），但从 `goals` 移除

### 3. 目标调整（goals）
从 4 个精简为 3 个：
- ✅ 钥匙放到玄关托盘
- ✅ 手机放到玄关托盘
- ✅ 雨伞放到玄关托盘或伞架
- ❌ 充电宝从 goals 移除

### 4. 脚本事件重写（scriptedEvents）
从 6 个事件精简为 3 个，基于玩家行为/状态触发而非固定 step：

#### 事件 1：猫推钥匙
```
id: 'se-cat-pushes-key'
trigger: step > 4 且钥匙 status === 'free' 且 currentRoom === 'living'
type: 'move-entity'
targetId: 'obj-key'
targetPosition: { room: 'living', x: 0.5, y: 0.02, z: -1.5 }
message: '🐱 你听到客厅传来"啪嗒"一声...猫咪好像碰掉了什么东西！'
description: '猫把钥匙从茶几推到了地毯边上'
memoryType: 'spatial'
```

#### 事件 2：手机响铃
```
id: 'se-phone-rings'
trigger: step >= 3 且手机 status 不是 'picked' 也不是 'placed'
type: 'message'
message: '📳 嗡嗡...你听到手机震动了一下，似乎是从卧室方向传来的。'
description: '手机响铃提示所在房间方向'
memoryType: 'object'
```
> 注：由于 trigger 函数签名限制 `(step, entities)`，无法直接获取 `visitedRooms`，用 step >= 3 近似表示玩家已探索一段时间。

#### 事件 3：雨伞倒下
```
id: 'se-umbrella-falls'
trigger: step >= 12 且雨伞 currentRoom === 'entrance' 且 status !== 'placed'
type: 'move-entity'
targetId: 'obj-umbrella'
targetPosition: { room: 'entrance', x: -0.8, y: 0.05, z: 5.0 }
message: '🌂 哐当！门口的伞倒了...'
description: '雨伞从伞架倒下'
memoryType: 'spatial'
```

### 5. 其他字段
- **probes**: 暂时保留（不影响主玩法）
- **containers**: 保持不变
- **import 结构**: 保持不变

## 注意事项
- `markMemoryOutdated` 和 `roomHint` 字段在现有 `ScriptedEventSpec` 类型中不存在，暂不添加
- 所有事件 trigger 使用现有类型支持的 `(step: number, entities: EntityStateSnapshot[]) => boolean` 签名
- 充电宝保留在 objects 数组中作为隐藏 bonus，但不参与目标判定

## 修改文件
- `src/data/tasks/leave-home.ts`
