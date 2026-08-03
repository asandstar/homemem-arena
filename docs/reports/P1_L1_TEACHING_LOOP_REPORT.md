# PRODUCT V2 — P1 L1 TEACHING LOOP IMPLEMENTATION REPORT
# P1 PRE-COMMIT ACCEPTANCE FIX（修正版）

**关 卡：** task-clean-table（L1 初次整理·教学关卡）
**冻结基线：** 产品文档 P1 L1 TEACHING LOOP（已冻结）
**报告生成日期：** 2026-07-30

---

## 1. 当前 HEAD

```
${CURRENT_HEAD_ID}
```

分支：`feat/product-v2-implementation`（或当前分支）

---

## 2. 修改文件

本轮共修改 **9 个文件**（含严格化测试 / Toast 作用域控制 / 提示过载优化）：

| 序号 | 文件 | 主要修改 |
|---|---|---|
| 1 | `src/data/tasks/clean-table.ts` | 重构 L1 `scriptedEvents`：新增 E 教学先触发、保存后才提示 F、放置提示；**优化提示过载：将 `se-tutorial-memory-saved` 由 `type: 'message'` 改为 `type: 'event'`，删除同义"真棒…按 F" Dialog，避免按 E 后 Toast + Dialog + F Toast 三条同时出现** |
| 2 | `src/game/commands.ts` | 在 `executePick` 中新增 **task-clean-table 教学阶段专属**拾取限制：stage-observe-table 且未保存三件任务物体中任何一件记忆时，拦截拾取并提示"先按 E 记住它的位置，再按 F 拾取。"；**不扣分、不加 chaos、不记为操作失败、不调用 advanceStep / recordAction**（严格无副作用） |
| 3 | `src/components/arena3d/FirstPersonControls.tsx` | **限制全局 Toast 作用域：仅 task-clean-table 显示 "已记住：<物体> 在 <位置>" 详细位置 Toast；其他任务（L2 / L3 等）保持原有"已保存记忆/已更新记忆"简洁 Toast；"现在按 F 拾取物品"仅在 task-clean-table **首次**保存记忆时触发** |
| 4 | `src/components/arena3d/HUD.tsx` | 为 task-clean-table 定制 E/F HUD 提示互斥策略：未保存记忆时 **只显示 E 提示、隐藏 F 拾取教学**；已至少保存 1 条任务记忆后 **隐藏 E 教学、只显示 F 拾取/放置** |
| 5 | `src/game/commands.test.ts` | 更新单元测试：`playing 阶段拾取` 前置调用 `executeSaveMemory`（因 L1 新拾取限制要求先存记忆）；断言从 step=1 调整为 step=2 |
| 6 | `tests/e2e/clean-table-command-flow.spec.ts` | 严格化 §7.2 副作用断言（6 条严格相等而非宽松范围）；为 A 类原主测试 3 处前置保存记忆；**11 个 Playwright E2E 测试全部通过**（含 §7.1 ~ §7.8 新增 P1 L1 教学测试） |
| 7 | `src/utils/e2eTestApi.types.ts` | **严格化测试新增 API 类型**：`getHeldEntityId / getSessionActionCount / getSessionFailedPickCount` |
| 8 | `src/utils/e2eTestApi.ts` | **严格化测试新增 API 实现**：读取 heldEntityId、Session action 事件数、Session failed pick 数；供 §7.2 严格 6 条断言使用 |
| 9 | `docs/reports/P1_L1_TEACHING_LOOP_REPORT.md`（本文件） | 日期更新为 2026-07-30；分离「预期通过」与「实际执行结果」；写入真实 Playwright 结果；删除未执行却标记为 ✅ 的描述；写入实际截图路径占位 |

---

## 3. 修改前教学顺序

| 阶段 | 触发顺序 | scriptedEvents / 玩家行为 | 问题 |
|---|---|---|---|
| 1 | briefing 后 | 欢迎提示 se-tutorial-welcome（step=1） | OK |
| 2 | **step=2** 立即触发 | `se-tutorial-pickup`：「先靠近一个物品，按 F 拾取它。」 | **先教 F** |
| 3 | step=3 才触发 | `se-tutorial-memory`：「按 E 键保存物品位置记忆。」 | **E 教学晚于 F**，与要求相反 |
| 4 | step=4 | `se-tutorial-place-hint` 放置提示 | 过早 |
| 5 | E 保存后 | 仅通用"已保存记忆：xxx"极简 toast，无位置、无槽位闪烁、无"现在按 F" | 记忆卡反馈不明确 |
| 6 | 未存记忆 → 按 F 拾取 | 直接拾取成功（无任何限制或提示） | §四 功能缺失，玩家可跳过教学 |
| 7 | HUD | E 和 F 上下文提示同时出现并列 | §五"新玩家不知道先做哪个" |
| 8 | 3 件归位 | 进入 Probe → Result | OK |

**核心缺陷：** 教学顺序先 F 后 E、记忆反馈缺失、HUD 双提示并现、未存记忆仍可直接拾取，严重偏离 Observe → E → Memory Card → F 的教学目标。

---

## 4. 修改后教学顺序（冻结文档对齐）

固定顺序：
**Observe → E Save Memory → Memory Card Appears → F Pick → F Place → Repeat → Probe → Result**

| 序号 | 触发条件 | 具体内容 | 教学目的 |
|---|---|---|---|
| 0 | briefing | **"先靠近物品按 E 保存位置，再按 F 拾取并放进正确容器。"** | 开场一句话明确优先级 |
| 1 | stage-observe-table `playerObjective` | **"先靠近餐桌上的一件物品，按 E 保存它的位置记忆。"** | 顶部 objective 只突出 E |
| 2 | step ≥ 2 **且** 记忆槽全为空 | `se-tutorial-memory-first`：「🧠 先靠近一件物品，按 E 键保存它的位置记忆。一定要先存记忆再拾取哦！」 | **明确 E 为第一步**（不出现 F） |
| 3 | 玩家按 E 成功保存任意 L1 任务物体 | • HUD 槽位闪烁 1200ms<br>• 新记忆卡立即可见<br>• Toast：**"已记住：脏杯子 在 餐桌上（dining）"**（仅 task-clean-table；其他任务保持简洁 Toast）<br>• 600ms 后 HUD Toast：**"现在按 F 拾取物品"**（仅 task-clean-table 首次保存触发）<br>• 音效沿用 `memory_save` | §三 记忆卡新增反馈 + 限制全局 Toast 作用域 |
| 4 | 记忆槽非空 且 第一次保存 | `se-tutorial-memory-saved`：**仅 event（不再弹 Dialog）**，避免与成功 Toast + F Toast 三条同时提示；触发后续 stage 推进 | §四 优化提示过载：去掉同义 Dialog，仅保留 Toast 反馈 |
| 5 | 玩家成功拾取 1 件（heldEntityConfigId != null） | `se-tutorial-place-hint`：「📦 拿着物品靠近发光的目标区，按 F 键放置。杯子→洗碗机，餐巾纸→垃圾桶，叉子→餐具架。」 | 先拿起，再提示放 |
| 6 | step=8 鼓励 | `se-tutorial-encourage`：「🌟 做得很好！继续把剩下的物品归位吧！」 | 中期鼓励 |
| 7 | step≥10/12/14 仍未放置 | dishwasher / trash / utensil rack 分层提示 | 兜底指引 |
| 8 | 3 件归位完成 | `stage-finalize-fork.completionCondition` 通过 → `levelCompleted = true` | 完成 |
| 9 | levelCompleted 后 | 点"查看分析结果"按钮（或 completion Dialog → "继续"）→ **/probe/task-clean-table** → Probe 完成后自动跳 → **/result/task-clean-table** | Probe / Result 路由保持不变（§7.8 测试已覆盖） |

- **stage id / scoring / timeLimit / 物体与容器数量：** 全部保持冻结文档不变。
- **completionCondition 与文案不再相反：** 文案先教 E、完成条件是记忆槽非空；文案再教 F，完成条件是 3 件 placed，完全对齐。

---

## 5. L1 专属拾取限制实现位置（严格无副作用）

**文件：** `src/game/commands.ts` → `executePick()`

实现核心代码（guard clause，提前 return，不触发任何副作用）：

```ts
// P1 L1：task-clean-table 教学阶段，未保存任务物体记忆前，禁止拾取三个任务物体
// 避免形成长期锁定：只要阶段不是 stage-observe-table 就永久放行
// ★ 严格无副作用：提前 return → 不调 advanceStep / 不调 recordAction / 不触发 score chaos combo break 等
if (before.task?.id === 'task-clean-table' && before.currentStageId === 'stage-observe-table') {
  const taskObjectIds = ['obj-dirty-cup', 'obj-tissue', 'obj-fork']
  if (taskObjectIds.includes(entity.configId)) {
    const anyTaskMemorySaved = before.memorySlots.some(
      (s) => s !== null && taskObjectIds.includes(s.entityConfigId),
    )
    if (!anyTaskMemorySaved) {
      return {
        success: false,
        reason: '先按 E 记住它的位置，再按 F 拾取。',
        action: 'pick',
      }
    }
  }
}
```

**为什么符合 §一「严格 6 条断言」：**

- 不调用 `advanceStep()` → `stepAfter === stepBefore` ✔
- 不调用 `recordAction()` → `sessionActionsAfter === sessionActionsBefore` 且 `failedPicksAfter === failedPicksBefore` ✔
- 不触发 `incrementChaos()` / `addScore()` / `breakCombo()` → `scoreAfter === scoreBefore`、`chaosAfter === chaosBefore` ✔
- 不调用 `pickEntity()` / 不写 `heldEntityId` → `heldEntityId` 保持 null ✔

---

## 6. 全局 Toast 作用域控制（§三）

**文件：** `src/components/arena3d/FirstPersonControls.tsx`

实现核心（task.id 条件分支）：

```ts
// 仅 task-clean-table 使用详细位置 Toast
// 其他任务（task-laundry-sort / task-leave-home / breakfast / ...）保持原有简洁 Toast
if (task?.id === 'task-clean-table') {
  const locStr = placedContainerName ? `${placedContainerName}（${roomName}）` : roomName
  addToast('success', `已记住：${nearbyEntityForMemory.name} 在 ${locStr}`)
} else if (result.isUpdate) {
  addToast('success', `已更新记忆：${nearbyEntityForMemory.name}`)
} else {
  addToast('success', `已保存记忆：${nearbyEntityForMemory.name}`)
}

// "现在按 F 拾取物品" 仅在 task-clean-table 首次保存记忆时触发
if (
  task?.id === 'task-clean-table' &&
  !lastSavedCleanTableFlagRef.current &&
  (result as any)?.isFirstTaskSave === true
) {
  lastSavedCleanTableFlagRef.current = true
  setTimeout(() => addToast('info', '现在按 F 拾取物品'), 600)
}
```

**结论（§三 合规性）：**

| 关注点 | 结论 |
|---|---|
| task-clean-table | ✅ 使用详细位置 Toast："已记住：<物体> 在 <位置>"；首次保存后 600ms 显示"现在按 F 拾取物品" |
| task-laundry-sort（L2） | ✅ 不触发 L1 专属 Toast；使用通用简洁 Toast |
| task-leave-home（L3） | ✅ 不触发 L1 专属 Toast；使用通用简洁 Toast；独立"钥匙拾取 / 门禁"逻辑不受影响 |
| 其他任务 | ✅ 保持原有 Toast 行为；**零全局副作用**，无需 L2/L3 UI 回归测试（因为实现是 task.id 精准分支而非全局 Toast 替换） |

**为什么没有选「全局 Toast」方案：** 实现是 task.id 精准分支，所以不需要额外新增 L2/L3 UI 回归测试。如果后续改为全局 Toast（所有任务都显示位置 Toast），才需要补 L2/L3 UI 回归测试。本轮保持最小改动，不做全局改动。

---

## 7. 提示是否过载检查（§四）

**原始问题（修改前）：** 按 E 后会同时出现 3 条同义提示：
1. 成功 Toast（"已记住：…"）
2. 600ms 后 F Toast（"现在按 F 拾取物品"）
3. `se-tutorial-memory-saved` 的 Dialog（"✅ 真棒，记忆槽新增了一条记录！现在可以靠近物品，按 F 键拾取它了。"）

**整改方案（当前实现）：** 将 `src/data/tasks/clean-table.ts` 中 `se-tutorial-memory-saved` 的 `type` 由 `'message'`（弹 Dialog）改为 `'event'`（仅触发事件不弹消息），删除 `message` 字段：

```ts
{
  id: 'se-tutorial-memory-saved',
  trigger: { type: 'memory-saved' },
  type: 'event',         // ★ 原 type: 'message'（删除 Dialog 弹框）
  memoryType: 'object',
  toastType: 'info' as const,
}
```

**整改后时序（按 E 保存记忆）：**
1. 主提示（Toast success）："已记住：脏杯子 在 餐桌上（dining）" — 保留
2. 轻量反馈（HUD）：记忆槽 Slot0 闪烁 1200ms（MemorySlots 组件 CSS ring） — 保留
3. 下一步提示（Toast info，600ms 延迟）："现在按 F 拾取物品" — 保留（仅 task-clean-table 首次）

**结果（同义提示仅 1 主 + 1 轻量）：** ✅ 无"连续超过两次同义提示"；无遮挡玩家操作；成功→轻量反馈→下一步 节奏清晰。

---

## 8. dining 空间检查（未改布局）

**关键路径：** spawn（相对房间 0,-2.5）→ cnt-dining-table（0,0）→ cnt-dishwasher（2,0,0）→ cnt-trash-bin（-2,0,0）→ cnt-utensil-rack（-1.5,0,0）

房间属性：
- size 8m x 8m（dining rooms.ts）
- `isCorridor: false`
- 3 个容器和 3 件物体全部 z=0 线性分布在餐桌两侧、房间中央。

| 检查项 | 预期通过 | 实际执行结果（本轮未重新执行人工空间检查） |
|---|---|---|
| 目标可见 | 桌表面 3 件物体高度 0.45-0.55m，无遮挡 | 待执行（之前基线全绿） |
| 目标可达 | spawn 距餐桌 2.5m、dishwasher 4.5m、trash 4.5m、utensil rack 4.0m，无阻挡 | 待执行（之前基线全绿） |
| 没有假容器 | 4 个 cnt-* 全部为真实 surfaceContainer 且 goal 映射正确 | 待执行（之前基线全绿） |
| 没有重复任务视觉 | 3 件物体各 1 个实例、goal count 全为 1 | 待执行（之前基线全绿） |
| F 交互位置与视觉一致 | 物体 surfaceOffset 一致、不浮空不沉 | 待执行（之前基线全绿） |
| 出生点不在碰撞体内 | spawn (0,-2.5) 距 dining-table AABB 2.5m，在碰撞体外 | 待执行（之前基线全绿） |
| qa:tasks / qa:layout | 72/72 + 150/150 全通过，24/24 task-clean-table 单项全绿 | **见 §10.2 `npm run qa` 真实结果** |

---

## 9. 自动测试结果（真实执行，非预期）

### 9.1 Playwright E2E 真实结果（§二）

**执行命令（2026-07-30 真实执行）：**
```
npx playwright test tests/e2e/clean-table-command-flow.spec.ts --reporter=list
```

**真实执行结果：**

| 项目 | 数量 | 说明 |
|---|---|---|
| ✅ **passed** | **11** | 11 / 11 测试全部一次通过 |
| ❌ failed | **0** | 无失败（无 retries、无 flaky） |
| ⏭ skipped | **0** | 无跳过 |
| 🔄 flaky retry | **0** | `exit code 0`，无任何 retry 才通过的情况 |

**11 个测试清单（严格对应预期断言）：**

| 编号 | 测试名称 | 断言要点 | 预期通过 | 实际执行结果 |
|---|---|---|---|---|
| 主 1 | `(A类) 主测试：完整通关 杯→洗碗机/纸巾→垃圾桶/叉→餐具架 → levelCompleted → Probe/Result 宽松` | 三件归位 + levelCompleted + probe/result 路由跳转 | 是 | ✅ passed (22.5s) |
| 主 2 | `绕过路径 1：放错容器不计数（杯子→垃圾桶，goal 不达成，可再捡回→洗碗机）` | wrongPlaceCount 增长 / goal 不计数 / 可重新放置 | 是 | ✅ passed (4.6s) |
| 主 3 | `绕过路径 2：重复放同一物品（杯子→洗碗机→捡回→再放洗碗机，goal 仍只算 1 次）` | 不重复计 goal，不重复 addScore | 是 | ✅ passed (5.7s) |
| **§7.1** | `未保存记忆时无法拾取 task-clean-table 三件任务物体` | stage=observe-table，记忆槽空 → 杯/纸巾/叉三件 pick 全部 success=false；reason 含"先按 E 记住它的位置"；heldEntityId === null | 是 | ✅ passed (4.7s) |
| **§7.2** | **严格化副作用：未保存记忆时拾取任务物体 → score / chaos / step / sessionActions / failedPicks / heldEntityId 全部严格相等（6 条 === 断言，无宽松范围）** | `scoreAfter === scoreBefore`；`chaosAfter === chaosBefore`；`stepAfter === stepBefore`；`sessionActionsAfter === sessionActionsBefore`；`failedPicksAfter === failedPicksBefore`；`heldEntityId === null`（**不再使用 chaos ≤ 15 / step ≤ 5 / score ≥ 初始 宽松断言**） | 是 | ✅ passed (2.4s) |
| §7.3 | `保存任意一个 L1 任务物体记忆后，可以正常拾取三件物体` | 先 save 纸巾记忆 → 杯、纸巾、叉三件 pick 全部 success=true | 是 | ✅ passed (3.4s) |
| §7.4 | `scriptedEvents 首个操作提示文字为 E（保存记忆）相关，而非 F 拾取` | 早期 steps 文本含"按 E / 保存 / 记录 / 记住"；记忆槽仍空时不允许"按 F 键拾取"先出现 | 是 | ✅ passed (3.6s) |
| §7.5 | `E 成功保存记忆后才出现 F 拾取相关提示` | 不保存 → 无 F；saveMemory → 等几轮 → 文本出现对应 F 提示 | 是 | ✅ passed (5.7s) |
| §7.6 | `L2 (task-laundry-sort) / L3 (task-leave-home)：拾取行为不受 L1 规则影响` | 进入 L2/L3 拾取时 reason 绝不会出现 L1 专属"先按 E 记住它的位置"（Toast 也不显示 L1 详细位置 Toast） | 是 | ✅ passed (3.6s) |
| §7.7 | `三件物体仍能正确完成归位：杯→洗碗机，纸巾→垃圾桶，叉→餐具架` | 前置 save 后依次 pick+place → 三件 status=placed 且 placedIn 匹配目标容器 | 是 | ✅ passed (6.5s) |
| §7.8 | `完成三件归位后，Probe 路由 → Result 路由仍然正常` | levelCompleted=true → 关 completion Dialog → 点"查看分析结果"按钮 → fallback navigate → 30s 轮询 URL 命中 `/probe/task-clean-table` 或 `/result/task-clean-table` | 是 | ✅ passed (16.8s) |

**§7.2 严格化测试的 6 条断言（真实通过，无宽松范围）：**
```ts
expect(scoreAfter).toBe(scoreBefore)                          // score 严格相等
expect(chaosAfter).toBe(chaosBefore)                          // chaos 严格相等（不再是 ≤15 增幅）
expect(stepAfter).toBe(stepBefore)                            // step 严格相等（不再是 ≤5 增幅）
expect(sessionActionsAfter).toBe(sessionActionsBefore)        // action 事件数 严格相等（不增加）
expect(failedPicksAfter).toBe(failedPicksBefore)              // failed pick 数 严格相等（不增加）
expect(heldAfter).toBeNull()                                  // heldEntityId 保持 null
```

---

### 9.2 Commands 单元测试更新（真实结果见 §10.3 `npm test`）

- 旧测试 `playing 阶段拾取`：因 L1 新规则要求先存记忆才能 pick，所以前置新增 `executeSaveMemory`，step 由 1 调整为 2。
- 预期：全部 commands 单元测试通过；
- 实际：**见 §10.3 `npm test` 真实执行结果**。

---

## 10. 最终检查（§八 真实执行结果）

> ⚠️ 预期通过：必须全部绿；真实执行结果填写在"实际"列。

| 检查 | 预期通过 | 实际执行结果（本轮真实运行后补充） |
|---|---|---|
| `npm run lint`（eslint，0 errors） | 0 errors（允许少量 warnings） | **见本轮真实运行输出** |
| `npm run build`（tsc -b + vite build） | 成功无错误 | **见本轮真实运行输出** |
| `npm test`（vitest / jest 全部单元测试） | 全部 passed，0 failed | **见本轮真实运行输出** |
| `npm run qa`（qa:static / qa:assets / qa:rooms / qa:tasks / qa:layout + build） | 全部 passed，0 Blocker / 0 Critical / 0 Major | **见本轮真实运行输出** |
| `npx playwright test tests/e2e/clean-table-command-flow.spec.ts` | 11 passed，0 failed，0 skipped，0 flaky | **§9.1 真实结果：11 passed / 0 failed** |
| `git diff --check` | 0 处行尾空白、0 处冲突标记 | **见本轮真实运行输出** |
| `git diff --stat` | 仅修改 P1 相关文件（无 P2 / L2 / L3 / Scene Graph / Session Schema） | **见本轮真实运行输出** |
| `git status --short` | 仅 P1 验收缺口文件 modified（不得 commit / 不得 push） | **见本轮真实运行输出** |

---

## 11. 两次自然通关（真实人工通关，非预期标记）

> **执行条件（必须真实人工游玩）：** 不使用 Debug API / teleport / setRobotPosition / skipStage / force-place，仅依赖默认键位 WASD + 鼠标 + E + F。
> **启动命令：** `npm run dev` 后首页 → 初次整理 → 开始任务。
> **⚠️ 严禁：** 不得将"预期步骤"标记为人工通过。必须真实完成后标记结果。

### 11.1 Run A（正常流程 E → F → 三件归位 → Probe → Result）

| 步骤 | 玩家操作（真实人工执行） | 成功反馈（真实看到才打勾） | 实际执行结果（真实完成后写 ✅/❌/备注） |
|---|---|---|---|
| A-1 | 进入 briefing | 看到"先靠近物品按 E 保存位置，再按 F 拾取并放进正确容器" | ⏳ 待用户真实执行 |
| A-2 | 点"开始任务"出生在 dining（0,-2.5）朝餐桌 | Dialog：欢迎 + 「先靠近一件物品，按 E 键保存它的位置记忆」 | ⏳ 待用户真实执行 |
| A-3 | HUD 顶部 objective 查看 | 只显示「先靠近餐桌上一件物品，按 E 保存它的位置记忆」；F 拾取教学不显示 | ⏳ 待用户真实执行 |
| A-4 | 走到脏杯子旁（<1.5m）**按 E** | ① Toast 成功：「✅ 已记住：脏杯子 在 餐桌上（dining）」② 记忆槽 Slot0 明显闪烁 1.2s ③ 新记忆卡立即可见（卡面有杯名+位置）④ **600ms 后** HUD Toast 显示：「现在按 F 拾取物品」⑤ **不再出现同义 Dialog 弹框**（§四 优化后已删） | ⏳ 待用户真实执行 |
| A-5 | 再看 HUD 上下文键位 | E 教学提示消失；只高亮 **[F] 拾取 脏杯子**（F 优先） | ⏳ 待用户真实执行 |
| A-6 | **按 F** 拾取脏杯 | 手持弹出 +「📦 杯子→洗碗机 / 纸巾→垃圾桶 / 叉→餐具架」放置提示 | ⏳ 待用户真实执行 |
| A-7 | 走到洗碗机光圈 **按 F** 放置 | Dirty cup placedIn=cnt-dishwasher，status=placed；HUD Goals 1/3 点亮 | ⏳ 待用户真实执行 |
| A-8 | 回餐桌 → 保存纸巾记忆 → F 拾取纸巾 → 垃圾桶放置 | 纸巾进 cnt-trash-bin；Goals 2/3 | ⏳ 待用户真实执行 |
| A-9 | 保存叉子记忆 → F 拾取叉子 → 餐具架放置 | 叉子进 cnt-utensil-rack；Goals 3/3 全亮 | ⏳ 待用户真实执行 |
| A-10 | 3 件归位完成 → 关卡完成弹窗 | 弹出「任务完成 / MEM-07 叙事」Dialog 底部按钮「继续」；弹出结算面板含「查看分析结果」按钮 | ⏳ 待用户真实执行 |
| A-11 | 点「继续」关闭叙事 → 点「查看分析结果」 | 路由跳转到 **/probe/task-clean-table**；Probe 问题正常渲染 | ⏳ 待用户真实执行 |
| A-12 | 做完 probe（或公开版自动跳） | 最终路由 **/result/task-clean-table**；Result Stats（rank / wrongPlaceCount / memoryEffectiveRate 等）正常渲染 | ⏳ 待用户真实执行 |

**Run A 整体结果：** ⏳ 待用户真实完成（未开始不得标记 ✅）

---

### 11.2 Run B（未保存时连按 F 三次 → 验证无副作用 → E → 正常归位 → Probe → Result）

| 步骤 | 玩家操作（真实人工执行） | 无副作用验证（真实看到才打勾） | 实际执行结果（真实完成后写 ✅/❌/备注） |
|---|---|---|---|
| B-1 | 出生后 **不按 E**，直接走到脏杯子旁 | HUD 记忆槽全空；仍显示 E 教学提示（不显示 F 拾取教学） | ⏳ 待用户真实执行 |
| B-2 | **连续按 F 三次** | ① 每次都弹 Toast：「先按 E 记住它的位置，再按 F 拾取。」② **手里始终空（heldEntity 不出现手持弹出）** ③ Score HUD：**数字不变** ④ Chaos %：**数字不变**（严格相等，非"不明显"）⑤ Step：**数字不变** ⑥ Event 日志：**不新增 pick 失败记录** ⑦ 没有 combo break 也没有错误放置计数浮字 | ⏳ 待用户真实执行 |
| B-3 | 按 E 保存纸巾记忆（任意一件任务物体） | 立刻出现"已记住…"Toast + 槽闪 + 600ms"现在按 F…" | ⏳ 待用户真实执行 |
| B-4 | 按 F 拾取脏杯子（之前被拦截的那件） | **不再被拦截**，pick success；手持弹出正常出现 | ⏳ 待用户真实执行 |
| B-5 | 正常完成杯、纸巾、叉三件归位 → Probe → Result | 与 Run A A-7~A-12 一致；Goals 3/3；Result 正常 | ⏳ 待用户真实执行 |

**Run B 整体结果：** ⏳ 待用户真实完成（未开始不得标记 ✅）

---

## 12. 截图（至少 8 张，真实人工截取后放入对应路径）

> **实际截图路径（必须真实存在才能打勾）：** `docs/screenshots/L1/`
> ⚠️ 预期：8 张全有；实际：**用户真实玩游戏时手动截取，放入对应路径，然后打勾。**

| 编号 | 场景描述 | 实际截图文件路径（固定） | 预期通过 | 实际存在？（真实截取后打勾） |
|---|---|---|---|---|
| L1-01 | 开场 briefing（文案先教 E，再教 F） | `docs/screenshots/L1/L1-01-briefing.png` | 800×450 以上，含 briefing 面板 | ⏳ 待截取 |
| L1-02 | 记忆槽全空时，HUD 只显示 E 提示、不显示 F 拾取教学 | `docs/screenshots/L1/L1-02-e-only.png` | HUD 顶部 objective + HUD 左侧上下文键位只突出 [E] | ⏳ 待截取 |
| L1-03 | 按 E 后：成功 Toast「已记住：<物体> 在 <位置>」+ 记忆槽闪烁 | `docs/screenshots/L1/L1-03-memory-saved.png` | 清晰可见 Toast + 槽位 ring 闪烁 + 新记忆卡 | ⏳ 待截取 |
| L1-04 | 按 E 后 600ms：HUD Toast「现在按 F 拾取物品」出现 | `docs/screenshots/L1/L1-04-f-only.png` | HUD 上下文键位只突出 [F] 拾取（E 教学已消失） | ⏳ 待截取 |
| L1-05 | **不存记忆时按 F**：Toast「先按 E 记住它的位置，再按 F 拾取。」且手持未出现 | `docs/screenshots/L1/L1-05-pick-blocked.png` | Toast 拦截信息可见；Score/Chaos/Step 与前一帧相同 | ⏳ 待截取 |
| L1-06 | 三件物体全部归位完成，Goals 3/3 点亮 | `docs/screenshots/L1/L1-06-goals-complete.png` | HUD Goals 面板 3/3；三件物体 placed 状态绿圈 | ⏳ 待截取 |
| L1-07 | Probe 页面（/probe/task-clean-table）正常渲染 | `docs/screenshots/L1/L1-07-probe.png` | 含 probe 题卡 + 题目内容 | ⏳ 待截取 |
| L1-08 | Result 页面（/result/task-clean-table）Rank + Stats 正常渲染 | `docs/screenshots/L1/L1-08-result.png` | 含 Result Header + rank + score/chaos/step/wrongPlaceCount 等统计 | ⏳ 待截取 |

---

## 13. 结束边界与本轮承诺

### 13.1 本轮已完成（严格在 P1 验收缺口内）
- ✅ §一 严格化副作用测试：6 条严格 === 断言，Playwright §7.2 100% 通过
- ✅ §二 Playwright E2E：11 passed / 0 failed / 0 skipped / 0 flaky retry
- ✅ §三 限制全局 Toast 影响：仅 task-clean-table 生效；L2/L3 不受影响（无需新增 L2/L3 回归测试）
- ✅ §四 提示是否过载：删除 `se-tutorial-memory-saved` Dialog 同义提示，仅保留 1 Toast 主提示 + 1 轻量反馈（槽闪）+ 1 F 提示（600ms）
- ✅ §七 报告修正：日期 2026-07-30；分离预期通过 / 实际执行结果；删除未执行却标记 ✅ 的描述；写入真实 Playwright 结果；写入实际截图路径占位

### 13.2 本轮**未执行**但在范围内（真实人工通关 / 真实截图）
- ⏳ §五 两次自然通关：Run A + Run B（必须由玩家真实玩，不得用"预期"标 ✅）
- ⏳ §六 8 张截图：docs/screenshots/L1/L1-01~L1-08（真实截取，放入指定路径）
- ⏳ §八 最终检查：`npm run lint/build/test/qa` + `git diff --check/stat/status --short`（开发者真实运行后补充）

### 13.3 本轮**绝对未开始**（严格遵守范围冻结）
- ❌ P2
- ❌ 模型替换
- ❌ L2 / L3 任务逻辑修改（§7.6 仅测试，未改 L2/L3 实现）
- ❌ Scene Graph 系统修改
- ❌ Session Schema 类型修改
- ❌ commit / push（保持工作区未提交，等开发者 & 真人通关验收通过后再自行提交）

---

## 14. 文件存在性 & gitignore 检查（§七 必做）

执行结果（真实终端运行后填充）：

```
# ls -l docs/reports/P1_L1_TEACHING_LOOP_REPORT.md
⏳ 待执行

# git check-ignore -v docs/reports/P1_L1_TEACHING_LOOP_REPORT.md || true
⏳ 待执行（预期结果：无任何输出，说明该报告文件未被 gitignore）
```
