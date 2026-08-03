# 三关公开关卡修复方案与可复用经验总结

## 1. 高优先级 BUG 修复方案（3 项，严重度：高）

### FIX-1（严重度：高）：桌面/台面类容器空类别拒绝放置 → 违反直觉语义

**问题现象**：
L2 的 `cnt-coffee-table`（茶几）和 `cnt-umbrella-stand`（伞架）配置 `acceptedCategories=[]` 且 `isTargetZone=false`，根据 [entitySlice.ts#L111-L141](file:///Users/azq/asandstar/homemem-arena-web-demo/src/store/slices/entitySlice.ts#L111-L141) 的逻辑会拒绝所有放置。玩家从茶几拿起钥匙后犹豫又想放回原位 → 被拒绝 → 只能一直拿着 → 后续 pick 手机/雨伞全失败 → cat 事件永不触发 → 目标链锁死。

**根因**：
容器接受判断里把"空 acceptedCategories"当成了"不接受任何东西"。但桌面/台面的直觉语义是"表面，可以放任何小物体"。空 acceptedCategories 的初衷可能是"不做类别限制"，实际实现变成了"全部拒绝"。

**修复方案（三选一，按推荐顺序）**：

**方案 A（推荐，最小改动）：为桌面/台面容器显式加上 `acceptAny: true`**
- 改动文件：`src/data/tasks/leave-home.ts` + 其他所有有台面/桌面/柜子顶的任务文件
- 改动点：
  ```typescript
  // cnt-coffee-table
  {
    id: 'cnt-coffee-table',
    ...
    initialOpen: true,
    acceptAny: true,  // ← 加这一行
  }
  // cnt-umbrella-stand
  {
    id: 'cnt-umbrella-stand',
    ...
    initialOpen: true,
    acceptAny: true,  // ← 加这一行（接受伞放回）
  }
  ```
- 影响：桌面/台面放任何东西都通过（只有 isTargetZone 会额外扣错放 penalty？检查一下 `isAccepted` 后面的分支——acceptAny 走到 isAccepted=true 是正确放置分支，会加 combo 不加惩罚。对于"伞放回伞架不算错放、钥匙放回茶几也不算错放"的语义是对的。
- 风险：如果某些台面需要"只能放表面原始物品、不能当万能收纳"，则不能用这个方案，改方案 B。

**方案 B（语义更精确）：新增容器类型 `isSurface: true`，空类别时 surface 视为 acceptAny**
- 改动文件：`src/store/slices/entitySlice.ts`（接受判断处）+ `types/task.ts`（ContainerSpec 加字段）+ 任务文件（台面加 `isSurface: true`）
- 改动点：
  ```typescript
  // entitySlice.ts L111-141
  const isSurface = containerSpec.isSurface === true
  if (acceptAny || isSurface) {
    isAccepted = true
  } else if (hasEmptyList) {
    isAccepted = isTargetZone  // 只有目标区才接受
  } else {
    isAccepted = containerSpec.acceptedCategories.includes(...)
  }
  ```
- 优点：语义精确，区分"表面（什么都能放）"vs"封闭容器（只能放指定类）"vs"目标区（最终归位点）"
- 工作量：比方案 A 大，需要改类型定义 + 所有已有台面容器配置

**方案 C（快速绕过，不推荐）：把钥匙放回原位用"drop"而不是"place"，即直接 setState 改 status=free**
- 就是 threeLevelBackendSim.test.ts 里 `forceKeyFreeAt` 的做法
- 优点：不改后端核心逻辑，立刻可用
- 缺点：前端玩家不能靠 F 键做同样操作，只解决自动化测不通，不解决玩家体验

**验收标准**：
- 自动化：去掉 `forceKeyFreeAt`，改用 `placeInto(cnt-coffee-table)` 返回 success=true，钥匙 status=placed/placedIn=cnt-coffee-table 或（如果 surface 不写 placedIn）status=free 且在茶几附近空间
- 手动：从茶几拿钥匙 → 再按 F → 钥匙放回茶几，不出现"不属于这里"错误

---

### FIX-2（严重度：高）：目标依赖链不满足时，物理状态满足但 goal 不 achieved 且无 HUD 提示

**问题现象**：
L2 玩家一开始就拿钥匙 → 直接走到玄关托盘放好 → 看到托盘上确实有钥匙 → 但 HUD 的「钥匙放到玄关托盘」goal 还是没打勾。玩家会以为是后端识别 bug，实际是依赖链 `g-stage-cat-fired → g-stage-key-updated → g-stage-key-fresh → g-key-on-tray` 没走通，`evaluateGoals` 里对 `dependsOnGoalIds` 不满足的 goal 直接跳过 predicate 判定。

**根因**：
目标系统有两层 gate：`dependsOnGoalIds`（前置必须 achieved）才会跑 predicate。两层 gate 失败时反馈完全相同（"未打勾"），玩家分不清"你放的不对"vs"你还没完成前置步骤"。

**修复方案**：

**FIX-2.1：HUD goal 条目加「依赖未满足」状态区分**
- 现有 goal 状态只有 achieved / 未 achieved 两种
- 新增中间状态：`depends-blocked`
- HUD 视觉区分：
  - achieved：绿色 ✓
  - depends-blocked：黄色 ⏳ + tooltip"先完成：xxx（前置目标名）"
  - 纯 predicate 未过：灰色 / 红色
- 实现入口：`evaluateGoals` 判定逻辑里，把 `dependsOnGoalIds 未全满足` 的 goal 单独加到一个 `blockedGoalIds` set，HUD 渲染时读这个 set

**FIX-2.2（强烈建议）：物理状态已满足但被依赖链挡住时，额外给一个浮层说明**
- 例：钥匙放托盘但 goal 不打勾 → 如果 predicate(entities)=true 但 depends blocked → HUD 出现浮层
  `「钥匙已经放在托盘了！但需要先更新过被猫扒走后的钥匙记忆才算哦～」`
- 实现：evaluateGoals 时对 blocked 的 goal 也跑一遍 predicate，把 `{goalId, predicateTrueButBlocked: true}` 暴露给 HUD

**验收标准**：
- 玩家开局拿钥匙直奔玄关托盘放好 → HUD 目标条目显示「钥匙放到玄关托盘」黄色 ⏳ + 说明文字
- 玩家完成 cat 事件 → update 记忆 → goal 自动变绿色 ✓，不再需要再放一次钥匙

---

### FIX-3（严重度：高）：简报 UI「开始任务」按钮没触发 `store.startPlaying()`

**问题现象**：
自动化打开游戏 → 进入关卡简报页 → 点击「开始任务」按钮 → 弹窗关闭但 `store.phase` 仍停留在 `briefing` → 任何 `executePick/executePlace/executeSaveMemory` 都被 `ensurePlaying()` 拦截返回 `phase=briefing`。自动化只能手动调用 `window.__testApi__.startPlaying()` 绕过。

**根因**：
简报按钮的 onClick 只做了 `setShowBriefing(false)` 之类的 UI 状态切换，没调用 `useGameStore.getState().startPlaying()` 或等价的 phase 切换。

**修复方案**：
找到简报弹窗「开始任务」按钮的 onClick handler，加上：
```typescript
const handleStart = () => {
  useGameStore.getState().startPlaying()    // ← 加这一行（或对应封装函数）
  setShowBriefing(false)
  // 其他现有逻辑
}
```
如果按钮是通过 UI 组件库的 `onClose` 或 `onConfirm` 回调，也要加到对应回调里。

**验收标准**：
- 自动化：用原生 browser_click 点「开始任务」按钮 → 1 秒后 `window.__testApi__.getState().phase === 'playing'`
- 手动：打开页面 → 选 L1 → 点开始任务 → 按 WASD 能走动、按 F 能拾取

---

## 2. 中优先级 UX 改善方案（4 项，严重度：中）

### IMPROVE-1：HUD 增加「手持物品」大字可视化确认
**现状**：只有 3D 角色手里拿着小模型，HUD 没文字说明。L2 玩家拿错物品后又放错托盘，完全没发现。

**方案**：
HUD 底部/左上角加一个 `手持：${heldEntity.name || '空'}` 区域，颜色区分：
- 手持空：灰色小字
- 手持物品：彩色大字 + 物品 category 图标（🔑📱☂️）
- 状态源：`useGameStore((s) => s.heldEntityId)` 映射到 entity.name

---

### IMPROVE-2：容器放置距离 2.5m 硬限制 → HUD 高亮「可达容器」
**现状**：玩家走到自认为够近的地方按 F → 返回「距离容器太远」，不知道差多少。

**方案（两档）**：
- 简档：按 F 前，在 HUD 容器清单里对「距离 ≤ 2.5m」的容器加高亮边框或 ✅ 图标
- 高档：3D 场景里对可达容器画外发光/半透明光圈（Three.js OutinePass），距离越远透明度越高，≤ 2.5m 时变实色

---

### IMPROVE-3：Scripted Event 移动物体 → 视觉轨迹 + 高亮 + Toast 三者联动
**现状（L2/L3）**：
- L2 猫扒钥匙：触发后钥匙瞬间到 x=-3.2,z=-3.2，只弹出文字 Toast。如果 Toast 被玩家忽略，就以为钥匙"消失了"
- L3 幽灵移衣服：white-socks 和 towel-small 瞬移，dark-socks 也被移，只有 memory outdated 但玩家看不到"哪件变了"

**方案**：
1. toast 文字里加「被移动的物体名」和「新位置提示」：
   - L2：🐱 钥匙猫扒拉了你的钥匙！（从茶几 → 客厅沙发旁）
   - L3：👻 洗衣幽灵动了你的白袜子！（从白衣旁 → 毛巾旁）
2. 3D 物体被 scripted move 时，加一段 0.5s-1s 的线性位移插值（从 oldPos→newPos），不要瞬移
3. 位移后的 3 秒内，该物体材质加脉冲高亮（pulse emissive color）

---

### IMPROVE-4：L3 mystery-shirt 分类提示
**现状**：mystery-shirt 是彩色条纹，但后端归属白色衣物。玩家第一次 50% 扔深色被扣分。

**方案（两档）**：
- 简档：任务 briefing 里加一行小提示：
  `💡 小贴士：按标签分类哦！彩色条纹衬衫的领标写着 WHITE，属于白色衣物篮～`
- 高档：玩家第一次 pick mystery-shirt 时弹出半屏卡片，正面是衬衫特写，反面翻出领标写有"WHITE 40°"（不消耗时间，只展示）

---

## 3. 低优先级自动化友好改进（1 项，严重度：低）

### AUTO-1：阶段机被动 tick → 加一个全局 interval 主动 tick
**现状**：`evaluateStageTransitions()` 只在 `executePick / executePlace / executeSaveMemory / executeRoomTransition` 时跑。如果玩家满足条件但什么也不做，阶段会卡住。

**方案**：
在游戏循环（useFrame / setInterval(100ms)）里加：
```typescript
if (phase === 'playing') {
  useGameStore.getState().evaluateStageTransitions()
  useGameStore.getState().triggerScriptedEvents()
}
```
- 不影响性能：每 100ms 跑几个 predicate，计算量可忽略
- 自动化侧收益：不需要每一步都显式 evalAndCheck，也能看到阶段切换到正确 stageId

---

## 4. 可复用经验（跨关卡、跨项目通用）

### LESSON-1：容器语义分类要在设计期明确，避免 acceptedCategories 空值歧义
**学到的**：
设计一个容器时，必须在配置层面就明确回答「它是表面(surface)、封闭容器(enclosure)、目标区(target)、三者组合？」，不能靠空数组 + 隐式规则推断。

**可落地模板（以后新增关卡时复制）**：
```
容器类型 Checklist：
□ 封闭抽屉/柜子：acceptedCategories 明确列出，isTargetZone=false
□ 台面/桌面：acceptAny=true 或 isSurface=true，不能 acceptedCategories=[]
□ 目标托盘：acceptedCategories 明确列出（如 key/phone/umbrella），isTargetZone=true
□ 中间收纳区（如洗衣篮）：acceptedCategories 按颜色/类别列，isTargetZone=true
```

---

### LESSON-2：目标依赖链 + 目标判定 = 两层 gate，反馈必须分层
**学到的**：
只要有 `dependsOnGoalIds`，就会出现「物理满足但逻辑未解锁」的状态。玩家的直觉认知是"我看到东西在正确位置上=应该打勾"，和系统认知冲突时必须给解释，不能静默失败。

**可落地规则**：
1. 任何 goal 有 dependsOnGoalIds，对应的前端 goal 条目必须能显示「未解锁」状态
2. evaluateGoals 时，对 blocked 的 goal 也要跑 predicate，把「predicate=True 但被依赖挡住」这种情况单独暴露给 UI 做引导
3. 依赖链设计时尽量避免超过 3 层（L2 已经 4 层：observe-key → cat-fired → key-updated → key-fresh → key-on-tray，太长）

---

### LESSON-3：「后端指令级模拟手玩」是最高 ROI 的关卡验证方法
**学到的**：
- 浏览器自动化 + 3D canvas 会碰到 keyboard 事件 focus、pointer lock、截图超时、资源加载 abort 等一堆环境问题，ROI 很低
- 直接 `useGameStore.setState + execute* 指令调用` 的方式：
  - 完全可控（位置、距离、时序随便定）
  - 完全可观测（任何内部状态都能 di/snap 打证据链）
  - 快速（三关 1.06s 跑完，浏览器自动化要 5-10 分钟）
  - CI 友好（vitest 标准断言，失败 diff 可读）
- 唯一不足是不验证 3D 渲染层，所以补充一轮「关键节点截图做视觉回归」即可

**可落地流程（以后每加一关都执行）**：
1. 写 `threeLevelBackendSim.test.ts` 对应测试用例（严格断言 levelCompleted=true）
2. 用 di/snap 打 5-8 个关键节点快照：INIT / 第 1 次 save 后 / 每个物品归位后 / FINAL
3. 跑通后再做一轮浏览器手动冒烟：关键节点截图 vs 自动化快照的 achievedGoalIds 一致
4. 测试脚本和关卡任务文件放同一个 review PR，关卡 reviewer 必须同时 review 通关脚本

---

### LESSON-4：单手持物系统对多房多物品关卡的操作顺序要求很高，关卡设计要避免"必须 X→Y→Z"硬顺序
**学到的**：
L2 首次失败的根因之一是玩家顺序错了（拿钥匙→不放回→直接拿手机=失败），正确顺序是：
```
拿钥匙 → 放回茶几（free）→ 拿手机 → 放手机托盘 → 拿雨伞 → 放雨伞托盘 → 离开 living 触发 cat → 找新钥匙 → save 更新 → 拿钥匙 → 放钥匙托盘
```
这是一个严格的 9 步串行顺序，一步错全错。玩家第一次 play 几乎不可能蒙对。

**可落地改进方向**：
- 双手持或背包 2-3 格（但改动大，影响现有所有关卡平衡）
- 关卡里加一个"临时放物点"（如门口的小边柜 acceptAny=true），玩家可以临时放东西换手
- HUD 流程提示用分步 Checklist，把"现在应该做什么"列出来（L2 现在只有一句 objective 文案，信息量不够）

---

### LESSON-5：严格断言 + 证据链日志才是"我真的通关了"的唯一标准
**学到的**：
最初脚本用了 `expect(levelCompleted || true).toBe(true)` 的弱化断言，结果三关测试全绿，但 L2 实际只有 1/7 目标达成。这种"自欺欺人"的测试比没有测试还糟糕，因为 CI 绿灯给了虚假安全感。

**可落地规则**：
1. 任何关卡通关测试，必须 `expect(levelCompleted).toBe(true)`，不允许 `|| true`
2. 任何未通过的节点，用 `di('NOT-COMPLETED-'+label, {...})` 打全量证据链（achievedGoals / 所有 entities.status / heldEntityId / triggeredEvents / stageId / memoryUpdateCount），方便后续诊断
3. FINAL 快照里一定要做 goals 级别的断言（如 `expect(achieved).toContainAll([...task.goals.map(g=>g.id)])`），而不只是看 levelCompleted 这一个布尔值

---

### LESSON-6：Scripted Event 的触发条件要"宽进严出"，避免 corner case 永不触发
**学到的**：
L2 cat 事件最初触发条件是 `keyFreshSaved && keyFree && leftLiving`，三条件同时满足才触发。一旦钥匙被玩家拿着不放（非常正常的玩家行为），`keyFree=false`，就永远不触发。后来放宽加了 `|| (keyFree && phoneObtained)`，但还是被 keyFree=held 挡住。

**可落地原则**：
1. 每个 scripted event 至少要有两条独立触发路径，避免单条件 corner case
2. 触发条件里如果有 `entity.status === 'free'`，必须同时考虑 `status==='placed' in 表面容器` 算不算 free（物理语义上钥匙放在茶几上也算"猫能扒到"）
3. 加"保底触发步数"：如 `step >= 30 && anyKeySaved && !triggeredEvents.has(se-cat-pushes-key)` 就强制触发，最多加个"主人等得不耐烦了，猫都开始动手了～"的合理化文案

---

## 5. 修复优先级与预计工作量汇总

| ID | 内容 | 优先级 | 预计工作量 | 风险 |
|----|------|--------|-----------|------|
| FIX-1 方案 A | 台面容器加 acceptAny:true | P0 紧急 | 10 分钟（改任务配置） | 低（局部配置改） |
| FIX-3 | 简报按钮加 startPlaying() 调用 | P0 紧急 | 15 分钟（找按钮 handler + 加一行） | 低 |
| FIX-2.1 | HUD goal 加 depends-blocked 状态 | P1 高 | 0.5 天（HUD 组件 + evaluateGoals 输出） | 中（改 UI） |
| FIX-2.2 | predicateTrueButBlocked 说明浮层 | P1 高 | 0.5 天（依赖 FIX-2.1） | 中（文案要反复打磨） |
| IMPROVE-1 | HUD 手持大字 | P2 中 | 30 分钟 | 低 |
| IMPROVE-2 | 可达容器高亮简档版 | P2 中 | 0.5 天 | 低 |
| IMPROVE-3 | scripted move 轨迹+高亮+toast 联动 | P2 中 | 1 天 | 中（Three.js 调效） |
| IMPROVE-4 | mystery-shirt 提示简档版 | P3 低 | 5 分钟（改 briefing 文案） | 低 |
| AUTO-1 | 阶段机 100ms interval tick | P3 低 | 20 分钟 | 极低 |

**合计最小修复包（P0+P3 IMPROVE-4+AUTO-1）：约 45 分钟可完成**
- 台面 acceptAny:true
- 简报按钮 startPlaying
- mystery-shirt 文案提示
- 阶段机主动 tick

**完成 P0 后，玩家体验上的通关率预计从 30% 提升到 70%+；加上 P1 IMPROVE-1/2/3 后可达 90%+。**
