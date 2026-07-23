# SEMIFINAL SPRINT B 报告：Deterministic Core Memory Loop

关二：出门大作战 (task-leave-home)
日期：2026-07-23
目标：让出门大作战成为一个真正需要使用记忆机制的 3–5 分钟核心展示关。

## 1. 修改前后的流程图

### 1.1 修改前（Sprint A 遗留状态）

```
任务开始 (Briefing)
  ↓
玩家自由探索（无明确当前目标）
  ↓
自由拿起钥匙 → 自由放托盘
  ↓
自由拿手机 → 自由放托盘
  ↓
自由拿雨伞 → 自由放托盘
  ↓
脚本事件（猫移动钥匙）可能在 step>某个固定阈值后触发，且：
  · 不要求钥匙记忆已保存
  · 钥匙记忆不存在时也无条件 fallback 触发
  ↓
若物品全归位，没有记忆也能通关（记忆是装饰不是刚需）
```

**绕过分析（修改前全部成立）：**
1. 猫事件不要求保存钥匙记忆（固定 step 触发为主）
2. 先拿钥匙（step<阈值内完成）可以直接绕过猫事件
3. 更新钥匙记忆不是必需步骤，猫事件后仍可直接放托盘过关
4. 物品三件归位即可通关，不需要任何记忆存在

### 1.2 修改后（Semifinal Sprint B）

```
任务开始 (Briefing)
  ↓
[阶段 1] stage-observe-key
  当前目标：靠近钥匙，按 E 记录它的位置。
  · 手机铃声 / 主人催促 / 猫事件均被前置条件锁住（不触发）
  · 尝试拾取钥匙 → 被拒绝："先记录钥匙位置"（不扣步、不加混乱）
  · 完成条件：memorySlots 中存在 obj-key 记忆
  ↓
[阶段 2] stage-fetch-phone
  当前目标：找到手机；离开客厅后注意——钥匙的位置可能已经变了。
  · 玩家离开客厅（currentRoom != living）后触发猫事件
  · 猫事件前置检查：
    1. 钥匙记忆已保存（slot 存在）
    2. 钥匙记忆未过期（!outdated）
    3. 猫事件尚未触发过
    4. 钥匙仍在客厅且 free
  · 不通过固定 step 触发；不设置"无记忆也无条件触发"的 fallback
  · 猫事件执行：钥匙从茶几 → 沙发附近
  · 对应钥匙记忆 slot.outdated = true；播放过期音效 + 视觉变化
  ↓
[阶段 3] stage-key-outdated
  当前目标：钥匙的位置记忆已经过期。回到客厅，重新确认钥匙位置。
  · 不显示新精确位置答案（需玩家自己找）
  · 完成条件：玩家在客厅 + 钥匙在客厅 free（即玩家"已经找到"）
  ↓
[阶段 4] stage-update-key-memory
  当前目标：按 E 更新钥匙的位置记忆。
  · 完成条件：outdated=false 且 memoryUpdateCount >= 1 且 猫事件已触发
  · 未更新前，若玩家拿着钥匙去玄关托盘 → 被拒绝："先更新钥匙记忆，再完成出门准备。"（不扣步、不加混乱）
  ↓
[阶段 5] stage-finalize
  当前目标：把钥匙、手机、雨伞都放入玄关托盘，完成出门准备。
  · 终局必须同时满足 7 条（见第 8 节要求）：
    1. 钥匙在托盘
    2. 手机在托盘
    3. 雨伞在托盘
    4. 钥匙记忆至少保存过一次（achievedGoalIds 包含 g-stage-observe-key）
    5. 猫事件已触发（triggeredEvents 包含 se-cat-pushes-key）
    6. 钥匙记忆至少更新过一次（memoryUpdateCount >= 1）
    7. 钥匙记忆当前不是 outdated
  ↓
Probe → Result
```

## 2. 新阶段状态机

### 2.1 阶段定义

| 阶段 ID | playerObjective | entryCondition | completionCondition | nextStage |
|---------|----------------|----------------|---------------------|-----------|
| stage-observe-key | 靠近钥匙，按 E 记录它的位置。 | 恒 true（任务起点） | memorySlots 中存在 obj-key 记忆（按 E 保存钥匙记忆） | stage-fetch-phone |
| stage-fetch-phone | 找到手机。钥匙的记忆已经过期，拿到手机后回客厅确认。 | 钥匙记忆已保存 | 猫事件 se-cat-pushes-key 已触发 AND 手机已取得（手持手机 or 手机已在玄关托盘） | stage-key-outdated |
| stage-key-outdated | 钥匙的位置记忆已经过期。回到客厅，重新搜索确认钥匙位置。 | 猫事件触发 & 钥匙记忆过期/不再新鲜 | 猫事件触发 & 钥匙记忆过期 & 钥匙在客厅 free & 玩家在客厅 & 玩家距离钥匙 < 0.5 | stage-update-key-memory |
| stage-update-key-memory | 按 E 更新钥匙的位置记忆。 | 猫事件触发 & memoryUpdateCount<1 & 钥匙在客厅 free & 玩家在客厅 | 猫事件触发 & memoryUpdateCount>=1 & 钥匙记忆 fresh(!outdated) | stage-finalize |
| stage-finalize | 把钥匙、手机、雨伞都放入玄关托盘，完成出门准备。 | 猫事件触发 & 记忆 fresh & updateCount>=1 & usedCount>=1 | 三物品都在玄关托盘 cnt-entrance-tray 内 & 记忆 fresh & cat 触发 & updateCount>=1 & usedCount>=1 | null（终端阶段） |

### 2.2 阶段机推进算法

代码位置：[taskSlice.ts createTaskSlice.evaluateStageTransitions](../src/store/slices/taskSlice.ts#L581-L615)

```
从 currentStageId 开始：
  While 阶段推进次数 < 阶段总数（防环）：
    1. 取当前阶段 spec
    2. 若 completionCondition 不满足 → 停在当前阶段（保持）
    3. 若满足，看 nextStage：
       · 若 nextStage 为 null 或等于自身 → 停止（终端阶段）
       · 否则取 nextStage 的 spec，检查其 entryCondition：
         - 若通过 → stageId = nextStage，继续循环
         - 若不通过 → 留在当前阶段，停止
最后：若 stageId 与原来不同（或首次初始化），写入 currentStageId/currentObjective
```

注意：**entryCondition 只作为"进入下一阶段的门槛"，不是当前阶段的保持条件**，避免瞬时状态（如 save 之后 outdated=false）导致下一阶段的 entryCondition 瞬时不通过而卡在上一个阶段。

### 2.3 状态机上下文（StageContext）

代码位置：[types/task.ts StageContext](../src/types/task.ts#L138-L157)

所有 predicate / trigger / stage 判定统一使用只读快照，避免直接依赖 Zustand：
- stepCount, elapsedMs, currentRoom
- entities[]（EntityStateSnapshot 快照）
- memorySlots[]（只读：entityConfigId / outdated / locked / confidence / timestamp）
- achievedGoalIds、triggeredEvents（ReadonlySet）
- memoryUpdateCount、memoryUsedCount、outdatedMemoryCount
- heldEntityConfigId、containerStates

## 3. 记忆里程碑

### 3.1 里程碑 goal（玩家可见的阶段目标）

| Goal ID | 说明 | 对应阶段 | 依赖 | 绑定的记忆语义 |
|---------|------|---------|------|---------------|
| g-stage-observe-key | 至少保存过一次钥匙的位置记忆 | stage-observe-key | (无) | 空间记忆：钥匙初始位置 |
| g-stage-cat-fired | 钥匙猫事件已触发 | stage-fetch-phone | g-stage-observe-key | 时序记忆：猫干扰事件 |
| g-stage-key-updated | 至少更新过一次钥匙的位置记忆 | stage-update-key-memory | g-stage-cat-fired | 时序+空间：记忆刷新行为 |
| g-stage-key-fresh | 钥匙记忆当前未过期（终局约束） | stage-finalize | g-stage-key-updated | 空间记忆有效性（终端约束，必须在结算时仍成立） |
| g-key-on-tray / g-phone-on-tray / g-umbrella-on-tray | 三物品归位 | stage-finalize | (key 依赖 update+fresh) | 物品归位本身 |

### 3.2 记忆系统语义调整（Sprint B 确定产品行为）

**锁定记忆：锁只防止覆盖，不阻止真实世界变化导致的过期。**

| 行为 | 产品决定 | 代码影响位置 |
|------|---------|------------|
| 其他物品想覆盖锁定的 slot | 禁止 | [memorySlots.ts findOverwriteableSlot](../src/game/memorySlots.ts) + [memorySlice.ts createMemorySlice.saveMemory](../src/store/slices/memorySlice.ts#L28-L83) |
| 同物品 (entityConfigId 相同) 刷新位置（即使 slot 锁定） | 允许更新，保留 locked=true | memorySlice.saveMemory.isUpdate 分支：不再因 locked 而拒绝，保留原 locked 字段 |
| markMemoryOutdated (obj-key) 锁定 slot | 仍然过期（推荐产品行为） | [memorySlots.ts markOutdatedByEntityConfigId](../src/game/memorySlots.ts#L46-L57)：条件从 "!locked" 改为 "!outdated" |
| 记忆 decay（confidence 随时间下降） | 锁定记忆仍然会 decay（锁定≠时间冻结） | updateMemoryConfidence 保持不变 |

### 3.3 阶段对脚本事件的前置闸门

修改前：cat 事件使用 step>固定数；phone-ring/owner-urgent 在任务开始后随时可触发。

修改后（触发条件必须检查 ctx.memorySlots / ctx.triggeredEvents）：

| Event ID | 修改后触发条件（要点） |
|----------|----------------------|
| se-cat-pushes-key | 钥匙记忆已保存 & 未过期 + 钥匙在客厅 free + 玩家离开客厅（不再使用 step>X 为主，也无 fallback） |
| se-phone-ringing | 必须已保存钥匙记忆（即进入 stage-fetch-phone 之后）+ step>=3 + 手机在卧室没拿 + 玩家不在卧室 |
| se-save-hint | 未保存钥匙 + step>=2（仅 stage-observe-key 期间提醒） |
| se-owner-urgent-msg | 猫事件已触发（stage-key-outdated 之后）+ step>=8（避免前期信息过载） |
| se-update-hint | 猫触发 + 钥匙记忆仍 outdated + step>=10 |
| se-memory-lock-hint | updateCount>=1 & usedCount>=2 & step>=4（玩家已完整经历"过期→更新"后才引导锁定） |

## 4. 所有绕过路径处理结果

### 绕过 1：不按 E 直接拿钥匙 → 失败（已封堵）

```
路径：任务开始 → living → 直接 pickByConfigId(obj-key)
结果：
  success = false
  reason = "先记录钥匙位置。"
  stepCount 不变（不推进）
  chaosValue 不变（不加混乱）
代码位置：[commands.ts executePick](../src/game/commands.ts#L73-L105)
  仅当 task.id='task-leave-home' 且 currentStageId='stage-observe-key' 且钥匙记忆未保存时生效。
```

### 绕过 2：不更新直接放钥匙 → 失败（已封堵）

```
路径：save key → transition(entrance) → cat触发 → living拿钥匙 → entrance放托盘(未更新记忆)
结果：
  success = false
  reason = "先更新钥匙记忆，再完成出门准备。"
  不扣步（被拦截的 place 本身不推进 step 计数）
代码位置：[commands.ts executePlace](../src/game/commands.ts#L107-L141)
  条件：task=leave-home & 目标容器=玄关托盘 & 手持=钥匙 & (cat触发 & 记忆仍 outdated)
```

### 绕过 3：通过快速切房间绕过猫事件 → 失败（已封堵）

```
路径：不 save key → living→entrance→living→bedroom→living→entrance（来回切房）
预期：没有任何一次切房触发 se-cat-pushes-key
原因：猫事件的第一前置条件是 "钥匙记忆已保存(!outdated)"，
      不 save key 的玩家永远不可能满足此条件。
实现：se-cat-pushes-key.trigger：
  keySaved = ctx.memorySlots.some(s && s.entityConfigId==='obj-key' && !s.outdated)
  return keySaved && keyFree && leftLiving
```

### 绕过 4：锁定旧钥匙记忆 → 触发猫事件 → 仍然过期（推荐产品行为落地）

```
路径：
  1) save obj-key 记忆（slot[0]=obj-key, locked=false, outdated=false）
  2) toggleMemoryLock(0) → slot[0].locked=true
  3) transition(entrance) → 猫触发
  4) 读 slot[0]
结果：
  triggeredEvents 包含 se-cat-pushes-key ✔
  slot[0].outdated === true ✔（锁定不阻止过期）
  slot[0].locked === true ✔（保留锁定状态）
之后：玩家回到 living 重新 save key（isUpdate 分支）→ 允许，
     outdated=false，locked 仍保留，memoryUpdateCount++。
```

## 5. 测试结果

### 5.1 单测：npm test

```
Test Files 13 passed (13)
Tests      301 passed (301)
  - src/engine/sceneGraph.test.ts           16 ✓
  - src/game/memorySlots.test.ts            36 ✓ （新增：锁定记忆仍然过期的用例）
  - src/game/placement.test.ts              38 ✓
  - src/game/collision.test.ts              36 ✓
  - src/game/playerMovement.test.ts         25 ✓
  - src/game/scoring.test.ts                39 ✓
  - src/game/commands.test.ts                3 ✓
  - src/store/useGameStore.test.ts          44 ✓
  - src/game/chaos.test.ts                  34 ✓
  - src/game/flow.test.ts                    3 ✓
  - src/game/proceduralMemory.test.ts       13 ✓
  - src/game/probeConsistency.test.ts        4 ✓
  - src/data/tasks/taskConsistency.test.ts  10 ✓
Duration 1.44s
```

### 5.2 Lint：npm run lint

```
oxlint
Found 0 warnings and 0 errors.
Finished in 14ms on 138 files with 103 rules using 10 threads.
```

### 5.3 Build：npm run build

```
tsc -b && vite build
✓ built in 345ms
dist/index-*.js            397 KB  (gzip 124 KB)
dist/Scene3D-*.js        1,233 KB  (gzip 324 KB)
注：chunk 大小警告与 Sprint B 无关（是 Scene3D monolith，属于以后 Sprint 的性能优化项）
```

### 5.4 QA：npm run qa

通过（等同于 build + QA 资源校验；exit 0）

### 5.5 E2E Chromium：npm run e2e -- --project=chromium（retries=0, 1 worker）

```
Running 10 tests using 1 worker
10 passed (1.1m)
```

**测试清单与覆盖项：**

| # | 测试 | 类型 | 覆盖的需求项 |
|---|------|------|------------|
| 1 | Golden Path: 保存→猫→过期→找钥匙→更新→放三件→Probe→Result | 第二关新增 | 断言 1-8 全量覆盖（p1-p8） |
| 2 | 绕过路径 1: 不按 E 直接拿钥匙 | 第二关新增 | 第 4 节要求 4.4（拒绝+reason） |
| 3 | 绕过路径 2: 不更新直接放钥匙 | 第二关新增 | 第 7 节要求 7.3/7.4 |
| 4 | 绕过路径 3: 快速切房绕过猫 | 第二关新增 | 第 5 节要求 5.3/5.6/5.7 |
| 5 | 绕过路径 4: 锁定记忆→猫→仍然过期 | 第二关新增 | 第九节"锁定记忆明确产品行为" |
| 6 | 第一关旧流程: 完整通关 save→cat→pick→place→Probe→Result→重玩 | 原有，适配新流程 | 确保新闸门不破坏原有 command-backed 核心通关路径（床头柜容器修正 + 必更新记忆后才放钥匙） |
| 7-10 | arena-smoke.spec.ts 4 个冒烟 | 原有不变 | 首页 / 任务选择 / 两关能加载 |

**Golden Path 8 条断言结果：**
1. ✅ 保存前拾取钥匙失败：reason 含 "先记录钥匙位置"
2. ✅ 没保存记忆时切房，triggeredEvents 不含 se-cat-pushes-key
3. ✅ 保存后离开客厅（entrance），triggeredEvents 必含 se-cat-pushes-key
4. ✅ 猫事件后，obj-key slot.outdated === true
5. ✅ 未更新记忆时尝试把钥匙放入托盘：success=false，reason 含 "先更新钥匙记忆"
6. ✅ save 更新后，slot.outdated === false
7. ✅ memoryStats.memoryUpdateCount >= 1
8. ✅ levelCompleted === true，Probe + Result 页面可正常跳转

### 5.6 git diff --check

```
(无输出 → 无尾随空格 / 无冲突标记 / 无错误格式变更)
exit code 0
```

## 6. 当前剩余 Blocker / Critical / Major

### Blocker（P0，阻塞进入下一 Sprint）

- 无。

### Critical（P1，需要下一 Sprint 早期处理）

- 无。

### Major（P2，下一 Sprint 按优先级处理，不阻塞）

1. chunk 体积：Scene3D 单包 >1.2 MB（旧问题，属于视觉/性能 Sprint 的优化项，不影响当前流程正确性）
2. HUD 当前目标展示：currentObjective 已写入 GameState，但 HUD.tsx 还未从 currentObjective 取字符串展示（使用的是旧 goals 列表渲染）。本 Sprint 明确"不重做 HUD"，所以留到 HUD & 视觉打磨 Sprint 处理。
3. 记忆过期时 slot 视觉"闪红/灰"是已有粒子 + 音效，但 slot 卡片样式的"过期视觉"是否需要强样式（边框变色等）属于 HUD 视觉打磨，不在本轮范围。

### Minor / Nice to have（P3，不跟踪）

- se-save-hint 文案可以再细化；
- 猫事件触发的 toast 可以增加 2 秒后自动消失的动画（当前由 HUD 控制）；
- 床头柜抽屉的打开音效在 iOS Safari 上可能 muted（全局音频设置问题）。

## 7. 是否允许进入 HUD 和视觉打磨 Sprint

**允许。**

Semifinal Sprint B 核心目标"Deterministic Core Memory Loop"已达成：
- 关二必须：先 save → 触发 cat → 再 update → 才能放三件物品；四者（save/cat/update/place）构成一个无法绕过的确定性闭环；
- 四条绕过路径（抢拿钥匙 / 不更新就放 / 快速切房避猫 / 锁记忆防过期）都已封堵或按产品决定落地；
- 记忆系统的"锁定语义"已明确：锁防覆盖、不防真实世界过期 → 写进测试与单元测试；
- 质量门禁（npm test / lint / build / qa / chromium E2E 10 条全过 / git diff --check 全净）全部通过；
- 未触碰边界项：关一关三关四关五、首页任务选择 Result 大布局、Session schema、研究 condition、D 标签、模型系统。

下一 Sprint（HUD 和视觉打磨）建议起手式：
1. 在 HUD.tsx 中展示 currentObjective（本 Sprint 已写入状态，只需要加一个 display block）
2. 把阶段分组（stage-observe-key / fetch-phone / key-outdated / update-key / finalize）挂到 goals 的 stage 字段分组显示
3. 过期 slot 卡片视觉强化（不改变逻辑）
4. 猫事件的 3D 效果：cat-prints 纹理或小猫咪型（当前是 scripted move 本身）
5. 基于 Golden Path 视频录制的 Demo 脚本准备（3-5 分钟展示关）

完成。本轮不提交、不推送。
