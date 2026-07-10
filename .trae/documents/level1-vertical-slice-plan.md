# 第一关「出门大作战」Vertical Slice 实现计划

## 一、当前状态诊断

### 已完成的基础工作
1. ✅ `src/data/levelBalance.ts` - 关卡数值配置已创建（timeLimit: 180, chaosGrowthPerSecond: 0.25 等）
2. ✅ `src/game/scoring.ts` - 得分计算模块（combo 倍率、时间奖励、评级、称号）
3. ✅ `src/game/chaos.ts` - 混乱值计算模块
4. ✅ `src/game/memorySlots.ts` - 记忆槽工具模块
5. ✅ `src/store/useGameStore.ts` - 大部分状态已就绪（记忆槽、混乱值、得分、combo、浮动文字、事件 toast 接口）
6. ✅ `src/data/tasks/leave-home.ts` - 第一关 3 个目标 + 脚本事件
7. ✅ `src/components/arena3d/HUD.tsx` - 基本 HUD 结构
8. ✅ `src/pages/ResultPage.tsx` - 基本结算页

### 主要缺失项
1. ❌ `useGameStore` 中多个函数只有接口声明没有实现（`incrementOutdatedMemory`, `addEventToast`, `removeEventToast`, `markMemoryOutdated`, `triggerEventEffect`, `removeFloatingText`）
2. ❌ `tickElapsed` 中混乱值增长是硬编码的 `incrementChaos(1)`，没有用 `calcChaosGrowth`
3. ❌ 脚本事件触发时没有调用 `markMemoryOutdated`、`addEventToast`、`triggerEventEffect`
4. ❌ HUD 中没有渲染 `floatingTexts` 和 `eventToasts`
5. ❌ 没有 3D 反馈效果（猫脚印、手机信号波纹）
6. ❌ 关卡完成后跳转到 probe 页而不是 ResultPage
7. ❌ ResultPage 缺少记忆统计（过期记忆、有效记忆率、混乱值峰值）
8. ❌ 第一关事件触发条件需要调整（猫事件应在玩家离开客厅后触发）
9. ❌ `ScriptedEventSpec` 类型缺少 `markMemoryOutdated`、`eventEffect`、`roomHint` 字段
10. ❌ `getGameStats` 返回数据不完整（缺少 chaosPeak, outdatedMemoryCount, memoryUpdateCount, memoryEffectiveRate）

---

## 二、实现步骤

### Phase 1: 完善 useGameStore 核心逻辑
**目标：让所有状态函数真正可用**

1.1 实现缺失的 store 函数：
   - `incrementOutdatedMemory()` - 过期记忆计数+1
   - `addEventToast()` - 添加事件 toast
   - `removeEventToast()` - 移除事件 toast
   - `markMemoryOutdated(entityConfigId)` - 标记某物体相关记忆为过期
   - `triggerEventEffect(effectName)` - 触发事件效果
   - `removeFloatingText()` - 移除浮动文字

1.2 修正 `tickElapsed` 混乱值增长：
   - 使用 `calcChaosGrowth(deltaMs, DEFAULT_LEVEL_BALANCE)` 替代硬编码

1.3 完善 `triggerScriptedEvents`：
   - 事件触发时，如果有 `markMemoryOutdated` 字段，调用 `markMemoryOutdated`
   - 事件触发时，调用 `addEventToast` 显示剧情提示
   - 事件触发时，如果有 `eventEffect` 字段，调用 `triggerEventEffect`
   - 使用 `DEFAULT_LEVEL_BALANCE.eventChaos` 替代硬编码的 5

1.4 完善 `getGameStats`：
   - 添加 `chaosPeak`, `outdatedMemoryCount`, `memoryUpdateCount`, `memoryEffectiveRate`
   - 使用 `calcMemoryEffectiveRate` 计算有效记忆率

1.5 修正 `incrementRepeatSearch`：
   - 使用 `DEFAULT_LEVEL_BALANCE.repeatSearchPenalty` 和 `DEFAULT_LEVEL_BALANCE.repeatSearchChaos`

### Phase 2: 重构第一关配置
**目标：让第一关流程符合修订版要求**

2.1 更新 `ScriptedEventSpec` 类型：
   - 添加可选字段：`markMemoryOutdated?: string`
   - 添加可选字段：`eventEffect?: string`
   - 添加可选字段：`roomHint?: string`

2.2 重构 `leave-home.ts`：
   - 移除充电宝（保持 objects 里但不加入 goals，作为 bonus 或暂时隐藏）
   - 修正猫事件触发条件：玩家离开过客厅（step > 4 且 钥匙仍在客厅 free 状态）
   - 修正手机事件触发条件：玩家进入过卧室或客厅后
   - 雨伞倒下事件可以保留但降低优先级
   - 更新 briefing 文案

### Phase 3: HUD 反馈系统
**目标：让玩家能看到所有反馈**

3.1 在 HUD 中添加 EventToast 渲染：
   - 顶部中央偏下位置显示事件 toast
   - 支持不同类型（info, warning, event, cat, phone）
   - 自动消失动画

3.2 在 HUD 中添加 FloatingText 渲染：
   - 跟随物体位置的 2D 投影（简化：直接在屏幕上用固定位置模拟）
   - 支持不同类型（score, combo, error, memory, info）
   - 浮动上升 + 淡出动画

3.3 优化 MemorySlotBar 视觉：
   - 过期记忆添加 glitch 效果或警告边框
   - 置信度显示
   - 确保 3 个槽位清晰可见

3.4 优化 ChaosComboBar：
   - 混乱值进度条更醒目
   - combo 显示更突出
   - glitch 效果在 chaos > 60 时启用

### Phase 4: 3D 场景反馈效果
**目标：猫脚印和手机响铃有视觉表现**

4.1 创建 CatPrintsEffect 组件：
   - 在地面上显示 3-5 个猫脚印
   - 从原位置指向新位置
   - 渐隐动画
   - 在 Scene3D 中根据 `activeEventEffects` 状态渲染

4.2 创建 PhoneRingEffect 组件：
   - 手机周围显示信号波纹
   - 脉冲动画
   - 在 Scene3D 中根据 `activeEventEffects` 状态渲染

4.3 集成到 Scene3D：
   - 监听 `activeEventEffects` 状态
   - 根据效果名称渲染对应的 3D 效果

### Phase 5: 关卡流程调整
**目标：完成关卡后进入结算页**

5.1 修改 ArenaPage：
   - 监听 `levelCompleted` 和 `levelFailed` 状态
   - 关卡完成/失败后自动跳转到 ResultPage
   - 移除"前往记忆测试"按钮（第一关不需要）
   - 简化右下角控制按钮

5.2 保存游戏统计到 session：
   - 关卡完成时把 gameStats 写入 session
   - 供 ResultPage 使用

### Phase 6: 升级 ResultPage
**目标：结算页显示完整的游戏数据**

6.1 更新 ResultPage 显示项：
   - 添加混乱值峰值显示
   - 添加记忆保存次数、过期记忆次数、记忆更新次数
   - 添加有效记忆率
   - 修正评级阈值（匹配新得分规则）

6.2 修正评级和称号：
   - S: score >= 1200 且 chaosPeak < 45 且 noWrongPlacement
   - A: score >= 900
   - B: score >= 650
   - C: score >= 400
   - D: 其他
   - 称号匹配用户要求的版本

6.3 AI 诊断报告：
   - 基于游戏统计生成简单的诊断文案
   - 不需要复杂 AI，用模板生成即可

### Phase 7: 构建验证和回归测试
**目标：确保构建通过，其他关卡不受影响**

7.1 运行 `npm run build`
7.2 修复所有 TypeScript 错误
7.3 验证其他三个关卡仍可进入
7.4 检查控制台无严重红色错误

---

## 三、需要修改的文件清单

### 新增文件
- `src/components/arena3d/feedback/CatPrintsEffect.tsx` - 猫脚印 3D 效果
- `src/components/arena3d/feedback/PhoneRingEffect.tsx` - 手机响铃 3D 效果

### 修改文件
1. `src/types/task.ts` - 添加 ScriptedEventSpec 新字段
2. `src/store/useGameStore.ts` - 实现缺失函数，完善逻辑
3. `src/data/tasks/leave-home.ts` - 重构第一关事件和目标
4. `src/components/arena3d/HUD.tsx` - 添加 event toast 和 floating text 渲染
5. `src/components/arena3d/Scene3D.tsx` - 集成 3D 反馈效果
6. `src/pages/ArenaPage.tsx` - 关卡完成跳转逻辑
7. `src/pages/ResultPage.tsx` - 升级结算页显示

---

## 四、数据结构变更说明

### ScriptedEventSpec 新增字段
```typescript
export interface ScriptedEventSpec {
  // ... 现有字段
  markMemoryOutdated?: string  // 标记哪个物体的记忆为过期
  eventEffect?: string          // 触发的 3D 效果名称
  roomHint?: string             // 房间方向提示
}
```

### GameStats 新增字段
```typescript
export interface GameStats {
  // ... 现有字段
  chaosPeak: number
  outdatedMemoryCount: number
  memoryUpdateCount: number
  memoryEffectiveRate: number
}
```

### activeEventEffects 状态
- 类型：`string[]`
- 存储当前激活的 3D 效果名称列表
- 事件触发时添加，效果结束后移除

---

## 五、风险与注意事项

1. **时间预算**：严格控制范围，只做 P0 必需功能
2. **其他关卡兼容**：确保修改不破坏第二、三、四关
3. **TypeScript 类型安全**：所有修改必须通过类型检查
4. **性能**：3D 效果要轻量，不能影响帧率
5. **渐进式实现**：按 Phase 顺序实现，每完成一个 Phase 验证一次

---

## 六、验收标准

1. ✅ `npm run build` 通过
2. ✅ 第一关从开始到结算完整可玩
3. ✅ 玩家能清楚看到并使用 3 个记忆槽
4. ✅ 猫事件真实移动钥匙，并让旧记忆变成 outdated
5. ✅ 手机事件有可感知提示
6. ✅ 正确放置、错误放置、保存记忆、combo 增加都有反馈
7. ✅ 混乱值会增长，并能导致失败
8. ✅ 结算页显示评级、称号、得分、combo、混乱值峰值、记忆统计和 AI 诊断
9. ✅ 其他三个关卡仍然能进入
10. ✅ 控制台没有严重红色错误
