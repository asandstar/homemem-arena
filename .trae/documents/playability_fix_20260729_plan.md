# 可玩性逻辑修复计划 (playability_fix_20260729)
**生成时间：2026-07-29**
**修复目标：解决可玩性诊断报告中 P0/P1 级逻辑错误，确保"做对/做错"反馈明确，核心机制（记忆过期、难度曲线）有实际体验。**

---

## 一、仓库研究结论

### 1.1 SyntaxError: Unexpected end of input（用户选中的 console 报错）
- **根本原因**：这是本次审计中 `browser_evaluate` 脚本的**人工语法错误**（脚本缺失闭合括号 / 语句截断），**不是项目代码的 bug**。
- **验证**：检查项目 src/ 下所有 TS/TSX 均通过 `qa:static` 静态检查（之前已执行 0 失败），Vite build 无语法错误。
- **建议行动**：无需修改项目代码；但为了排除类似 DevTools 脚本误报，可以做以下辅助项：
  - 检查 HMR 入口有无不完整的代码（node_modules/.vite 缓存可能残留）
  - 可选：在 .eslintrc 里加 `no-unexpected-multiline` 规则减少未来 ASI 问题（ModelAsset.ts 之前遇到过一次）

---

### 1.2 核心逻辑问题定位

| 编号 | 严重度 | 问题摘要 | 代码位置 | 根因 |
| --- | --- | --- | --- | --- |
| **BUG-P0-1** | P0 | L1 错放物品还加 100 分（脏杯子→餐桌 = +100 分） | [clean-table.ts#L116-L127](file:///Users/azq/asandstar/homemem-arena-web-demo/src/data/tasks/clean-table.ts#L116-L127) | `cnt-dining-table.acceptedCategories = []`，空数组让 [entitySlice.ts#L111](file:///Users/azq/asandstar/homemem-arena-web-demo/src/store/slices/entitySlice.ts#L111-L124) 的 "acceptedCategories.length > 0" 短路判断直接跳过错放惩罚，走正确放置分支 + combo 加分 |
| **BUG-P0-2** | P0 | L2 钥匙猫事件后钥匙只移动了 2.5 格，玩家按旧位置走也能取到 | [leave-home.ts#L301](file:///Users/azq/asandstar/homemem-arena-web-demo/src/data/tasks/leave-home.ts#L301-L301) | `targetPosition: { x: -1, z: -2 }` 距离初始位置 (x:0, z:0.3) 的欧氏距离 ≈ 2.5，而拾取交互阈值 maxDistance=2.0 [interactionTargets.ts#L10](file:///Users/azq/asandstar/homemem-arena-web-demo/src/game/interactionTargets.ts#L10-L10)，玩家只要往记忆旧方向走一小步就能捡到 |
| **BUG-P0-3** | P0 | L3 2 分钟分类 9 件衣物 + 3 格记忆槽，新手无法完成 | [laundry-sort.ts#L41](file:///Users/azq/asandstar/homemem-arena-web-demo/src/data/tasks/laundry-sort.ts#L41-L41) + laundry-sort.ts objects 数组 = 9 件 | 时间 × 物品数 × 记忆槽压力相乘后远高于 L1/L2 的难度坡度 |
| **BUG-P1-1** | P1 | 错放反馈文案是调试用的"容器不接受 xxx 类别"，玩家看不懂 | [entitySlice.ts#L118-L121](file:///Users/azq/asandstar/homemem-arena-web-demo/src/store/slices/entitySlice.ts#L118-L121) | message 直接拼接了 category 内部枚举字符串 |
| **BUG-P1-2** | P1 | L2 transition 回 living 后 phase=probing 残留，交互全被拒绝 | 见 [commands.ts](file:///Users/azq/asandstar/homemem-arena-web-demo/src/game/commands.ts) + [taskSlice.ts#L269-L275](file:///Users/azq/asandstar/homemem-arena-web-demo/src/store/slices/taskSlice.ts#L269-L275) | 推测 transition 或 startPlaying 后某些分支把 phase 设成了 probing，缺少"非 briefing→playing 阶段时自动恢复 playing"的守卫逻辑 |
| **BUG-P1-3** | P1 | 正确放置物品 chaos 还在涨（玩家感觉"越整理越乱"） | [entitySlice.ts#L126-L186](file:///Users/azq/asandstar/homemem-arena-web-demo/src/store/slices/entitySlice.ts#L126-L186) + [taskSlice.ts#L502](file:///Users/azq/asandstar/homemem-arena-web-demo/src/store/slices/taskSlice.ts#L502-L502) | （a）chaosGrowthPerSecond 自然增长 0.3/秒 但玩家感知为"整理导致混乱"；（b）正确放置后没有降低 chaos，整理行为无"变干净"正反馈 |
| **BUG-P2-1** | P2 | 任务完成时 HUD 混乱值仍显示 93%，与"已清理"矛盾 | [taskSlice.ts#L293-L319](file:///Users/azq/asandstar/homemem-arena-web-demo/src/store/slices/taskSlice.ts#L293-L319) `setLevelCompleted()` | 关卡完成时没有重置 / 覆盖 chaosValue 为 0 |
| **BUG-P2-2** | P2 | Tab 展开目标的入口不明显，新手不会主动去找 | [TaskObjectiveHUD 组件] (需定位) | Tab 按钮无高亮 / 无教学阶段自动展开 |
| **BUG-P2-3** | P2 | L3 目标面板只有 4 条大类，没有 9 件 individual 清单 | Tab 面板 goal 渲染逻辑 | 玩家超时失败后无法定位"漏了哪件" |

---

## 二、要修改的文件 & 模块

| 模块 | 文件路径 | 主要改动 |
| --- | --- | --- |
| **L1 任务数据** | `src/data/tasks/clean-table.ts` | 餐桌容器 acceptedCategories 改为非目标类拒绝策略（见 §3.1） |
| **L2 任务数据** | `src/data/tasks/leave-home.ts` | 猫事件钥匙目标位置大幅移远；新增"过期记忆接近旧位置时弹提示"的触发事件 |
| **L3 任务数据** | `src/data/tasks/laundry-sort.ts` | 时限调整；可选：objects 缩减到 6 件或个体目标清单 |
| **通用 entity 逻辑** | `src/store/slices/entitySlice.ts` | ① 错放反馈文案人类友好化 ② 正确放置后 decreaseChaos ③ 非目标容器错放拦截（修复空数组 acceptedCategories 漏洞通用方案） |
| **任务 phase 守卫** | `src/store/slices/taskSlice.ts` + `src/game/commands.ts` | startPlaying / transitionToRoom 后 phase 异常恢复为 playing；setLevelCompleted 时 chaosValue=0 |
| **chaos 切片** | `src/store/slices/chaosSlice.ts` | 新增 decreaseChaos(amount) 方法 |
| **目标 HUD / Tab 面板** | （组件路径待定位，可能在 `src/components/ui/` 或 `src/components/hud/`） | L1 教学阶段自动闪现 Tab 面板 2 秒 |
| **QA / 测试** | `src/store/useGameStore.test.ts` | 新增：错放容器空 acceptedCategories 不再走加分分支、正确放置减 chaos、任务完成 chaos=0 用例 |

---

## 三、修复步骤

### Phase 1｜P0 级高优修复（逻辑正确性底线）
**预计改动 5-7 处**

#### 3.1 修复 BUG-P0-1：L1 错放餐桌还加分
**方案 A（推荐，通用）**：`entitySlice.ts` 的 acceptedCategories 判断逻辑修正。
- 原判断：`if (containerSpec.acceptedCategories.length > 0 && !containerSpec.acceptedCategories.includes(...))` → **空数组=接受一切**，这是 bug 根源
- 修改为：引入新字段 `containerSpec.isTargetZone`（已经存在！见 [clean-table.ts#L138](file:///Users/azq/asandstar/homemem-arena-web-demo/src/data/tasks/clean-table.ts#L138-L138) 的 `isTargetZone: true` 标记）
  - 当 `isTargetZone === true` 或 `acceptedCategories.length > 0` 时才走"分类校验 → 错放惩罚"
  - 否则（普通容器/表面）走新分支："如果当前 goal 谓词 **明确要求该物品放入特定 targetZone**，但玩家放到了非 targetZone 表面 → 判定为错放扣分；如果 goals 没规定（自由放置），则中立不给分也不扣"
- **同步**：L1 `cnt-dining-table` 保持空 acceptedCategories（它是"表面"不是 targetZone），但因为方案 A 的全局补丁生效，错放到这里会按"未进入 targetZone → 视为错放"扣分

**方案 B（局部补丁，快速修复）**：直接给 `cnt-dining-table.acceptedCategories` 填一个永远匹配不上的类别（如 `'__reject_all__'`），让它进入错放分支。
- **风险**：只修了 L1，未来新增"表面容器"时还会踩坑。
- 本次采用 **A 为主，B 作为兜底**（确保 L1 餐桌即使在旧判断下也会触发错放惩罚）。

#### 3.2 修复 BUG-P0-2：L2 钥匙移动距离过短 + 记忆过期无感
改动 2 处：
1. **[leave-home.ts#L301](file:///Users/azq/asandstar/homemem-arena-web-demo/src/data/tasks/leave-home.ts#L301-L301)**：
   - targetPosition 由 `{x:-1, z:-2}` 改为 `{x: -6, z: -3}`（living 沙发旁角落，距初始位置 0,0.3 的欧氏距离 ≈ √(6²+3.3²) ≈ 6.8，约等于 3.5 倍交互阈值）
2. **`dialog/dialogs.ts` 或新增 toast 触发**：在 `markMemoryOutdated` 后，监听"玩家进入过期记忆 position 半径 3.0 内"事件 → 强制弹出黄色 toast：「💡 记忆过期！钥匙不在这儿了，按 E 重新找新位置～」

#### 3.3 修复 BUG-P0-3：L3 时限压力过大
**[laundry-sort.ts#L41](file:///Users/azq/asandstar/homemem-arena-web-demo/src/data/tasks/laundry-sort.ts#L41-L41)**：
- `timeLimit: 120` → **`240`**（翻倍到 4 分钟，新手也有 2~3 次试错空间）
- 保持 9 件衣物不变（因为分类比 L2 跨房间简单，单房间移动距离短）
- 附带：在 Tab 面板的大类目标下，追加个体物品清单（以 subGoal 形式或面板底部列表渲染 "白衬衫✓ 白袜子×" 之类）—— 这块放到 P2 Phase。

---

### Phase 2｜P1 级通用体验逻辑修复

#### 3.4 修复 BUG-P1-1：错放反馈文案人类友好化
**[entitySlice.ts#L118-L121](file:///Users/azq/asandstar/homemem-arena-web-demo/src/store/slices/entitySlice.ts#L118-L121)**：
- 由：`容器不接受 ${heldEntity.category} 类别的物体`
- 改为：
  ```ts
  const heldName = heldEntity.name || heldEntity.configId || '这个物品'
  const containerName = containerSpec.targetLabel || containerSpec.name || '这里'
  message: `${heldName} 不属于 ${containerName}～ 再想想应该放哪里？`
  ```
  （`EntityState.name` 字段已在 objects 数组中定义，直接复用；容器用 targetLabel 优先显示"洗碗机（杯子放这里）"这种教学级文案）

#### 3.5 修复 BUG-P1-2：transition 后 phase=probing 残留
在 **`commands.ts` 的 transition 实现末尾** + **`taskSlice.ts` 的 startPlaying / initializeTask 末尾**加一个 phase 守卫断言：
```ts
// 守卫：如果任务已初始化但 phase 既非 playing 也非 briefing/result，则强制回 playing
if (get().task && !['briefing', 'playing', 'result', 'finished', 'failed'].includes(get().phase) &&
    !get().levelCompleted && !get().levelFailed) {
  set({ phase: 'playing' })
}
```
- 同时在 e2eTestApi 的 `transitionToRoom` 返回值中记录 phase，便于 QA 捕获。

#### 3.6 修复 BUG-P1-3：正确放置无 chaos 降低反馈
1. **chaosSlice.ts**：新增对称方法 `decreaseChaos(amount: number)`，下限 clamp 到 0
2. **entitySlice.ts** 正确放置分支（[L126 之后](file:///Users/azq/asandstar/homemem-arena-web-demo/src/store/slices/entitySlice.ts#L126-L126)）：
   ```ts
   get().decreaseChaos(DEFAULT_LEVEL_BALANCE.correctPlaceChaosDecrease)
   ```
3. **levelBalance.ts**：新增常量 `correctPlaceChaosDecrease: 15`
4. （可选）视觉化：HUD chaos 条在降低时用绿色闪过，增长时红色闪过

---

### Phase 3｜P2 级体验收尾 + QA 回归测试

#### 3.7 修复 BUG-P2-1：任务完成 chaos 未清零
**[taskSlice.ts `setLevelCompleted()`](file:///Users/azq/asandstar/homemem-arena-web-demo/src/store/slices/taskSlice.ts#L293-L319)**：
- 加一行：`set({ chaosValue: 0 })`（或 `setLevelCompleted` 内部同步调用 `decreaseChaos(9999)` ）

#### 3.8 修复 BUG-P2-2：Tab 面板教学阶段自动闪现
定位 ObjectiveHUD / TasksPanel 组件后（全局搜索 "按 Tab 切换完整目标面板" 文案找到 render 点）：
- 在 `phase === 'playing' && stepCount === 1` 的 L1 教学关卡首次进入时，让 TasksPanel 自动展开 3 秒再折叠（通过 state.isOpen 控制）

#### 3.9 修复 BUG-P2-3：L3 个体物品清单
给 `laundry-sort.ts` 的 4 条 goal 定义追加 `relatedObjectIds: [...]` 字段（已有的 predicate 里已有 whiteIds/darkIds/towelIds 列表），然后在 Tab 的 Goal 组件里：当 relatedObjectIds 非空时，底部渲染个体清单：
```
白色衣物 2/4 ✓
  ▸ 白衬衫 ✓
  ▸ 白袜子 ✓
  ▸ 小白巾 ✗
  ▸ 神秘彩条衫 ✗
```

---

### Phase 4｜验证
按顺序执行：
1. `npm run build` 确保 TypeScript 无类型错误
2. `npm run qa:static` 静态检查
3. `npm run qa:rooms` / `qa:tasks` / `qa:layout` 布局与任务数据验证
4. 手动 / E2E 验证以下 case：
   - L1：脏杯子放餐桌 → 期望：扣分、显示友好提示、不进入成功放置分支
   - L1：脏杯子放洗碗机 → 期望：加分、chaos 降低
   - L2：猫事件后玩家传送到钥匙旧位置 → 期望：弹"记忆过期"提示
   - L3：timeLimit 实际 > 200 秒（console 里检查）
   - 所有关卡完成 → chaos 条显示 0%

---

## 四、潜在依赖 / 注意事项
1. **`isTargetZone` 字段已存在**：在 `containerSpec` 接口中已经有声明（L1 dishwasher/trash-bin/utensil-rack 都标了 true）。修复 BUG-P0-1 时优先用这个语义化字段，不要给所有表面容器加 dummy acceptedCategories。
2. **container 类型定义**：确保修改 acceptedCategories 判断逻辑后，`types/room.ts` 或 `types/task.ts` 中的 `ContainerSpec` 类型同步声明 `isTargetZone?: boolean`（如果还没写进类型，会在 TS strict 模式报错）。
3. **chaosSlice 对称性**：新增 decreaseChaos 时记得与 incrementChaos 保持同样 clamp 策略（0 ≤ chaosValue ≤ maxChaos）。
4. **记忆过期 toast 的性能**：每帧都判"玩家是否靠近过期记忆"会造成 N×M 开销，建议在 step 事件（每 100ms 级）或 `entitySlice.executePick` 失败时做一次，而不是 rAF 级别。
5. **L3 个体清单的类型兼容**：relatedObjectIds 目前在 goal 中可能是可选字段，需要确认 `types/task.ts` 中 GoalConfig 类型是否已有 relatedObjectIds 声明，如果没有先加上。

---

## 五、风险处理
| 风险 | 影响 | 缓解方案 |
| --- | --- | --- |
| 空数组 acceptedCategories 被其他关卡用作"接受一切"语义（例如收纳类容器） | 破坏现有行为 | 在全局补丁中加入白名单字段 `acceptAny: true` 显式声明；默认按 isTargetZone 长度 >0 判断 |
| L2 钥匙移太远 → 玩家找不到产生新挫败 | 可玩性下降 | 在 cat 事件 toast 文案后追加"提示：客厅沙发附近找找看" |
| decreaseChaos 数值过大 → 混乱值永远为 0，压力消失 | 紧张感不足 | DEFAULT_LEVEL_BALANCE 里分 L1(25) / L2(15) / L3(10) 递减，或者只对"命中 goal 谓词的正确放置"减 chaos |
| Tab 面板自动闪现时机不对 → 遮挡操作 | 干扰教学 | 加"用户首次按过 Tab 之后就不再自动闪现"的 localStorage 标志 |

---

## 六、修改范围总览
- **约 8-10 个文件**（核心：3 个任务数据文件 + 3 个 store slice + 1 个 commands + 1-2 个 HUD 组件）
- **测试文件增量**：~10-15 个新用例（加在 useGameStore.test.ts）
- **破坏性改动**：无（所有容器判断通过 isTargetZone 语义字段，兼容旧数据）
- **数据迁移**：无需（task.ts 新增字段都带默认值 `?`）
