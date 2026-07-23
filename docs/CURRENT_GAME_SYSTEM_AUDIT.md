# HomeMem Arena 当前游戏系统审计

> 生成时间：2026-07-23
> 审计方法：只读取仓库，不修改代码、不格式化文件、不提交推送
> 审计范围：HEAD + 当前未提交 27 files (+ 3 untracked) 的实际代码

---

## 审计前真实命令记录

### Git 快照

```
$ git status --short
 M .env.e2e, .github/workflows/deploy.yml, .gitignore, README.md, playwright.config.ts
 M scripts/qa-assets.ts, scripts/qa-models.ts
 M src/components/arena3d/FirstPersonControls.tsx, Object3D.tsx, ObjectGeometries.tsx, Scene3D.tsx
 M src/components/arena3d/modelIds.ts, models/FallbackModels.tsx, models/ModelRegistry.ts
 M src/components/tasks/TaskCard.tsx, src/data/tasks/index.ts
 M src/dialog/useDialog.ts, src/game/flow.test.ts
 M src/main.tsx, src/pages/HomePage.tsx, src/pages/TaskSelectPage.tsx
 M src/store/useGameStore.test.ts
 M src/utils/e2eTestApi.ts, src/utils/e2eTestApi.types.ts
 M tests/e2e/arena-smoke.spec.ts, first-level-command-flow.spec.ts, helpers.ts
?? docs/SEMIFINAL_SPRINT_A_REPORT.md
?? docs/SEMIFINAL_VERTICAL_SLICE_PLAN.md
?? src/data/tasks/taskConsistency.test.ts

$ git diff --check   # 无输出
$ git diff --stat HEAD
 33 files changed (含 qa-artifacts 6 png，已在 23 号 Sprint A 回退)，当前实际代码改动 27 files，+429 −87

$ git log -8 --oneline
38641d1 feat: 增强游戏策略性 - 记忆系统、混乱值、评分优化
1b2cb59 docs: 更新游戏文档和README
ff09d50 feat: 更新类型定义以支持新物品和难度等级
d346cce fix: 修复任务容器位置与实际家具不匹配
d02445e fix: 修复物品位置一致性
3e6fee1 fix: 修复视角、像素风格、小地图和音乐滑块
6185977 fix: 修复任务选择页面崩溃 + 更新文档
c838c6a docs: 更新设计文档记录像素艺术风格与性能优化
```

### 自动化门禁真实结果

| 命令 | 结果 | 备注 |
|------|------|------|
| `npm test` | ✅ 13 files / 301 passed (1.46s) | 含 taskConsistency.test.ts (10)、proceduralMemory.test.ts (13)、probeConsistency.test.ts (4)、chaos.test.ts (34) |
| `npm run lint` | ✅ 0 warning / 0 error（138 files, 103 rules） | oxlint |
| `npm run build` | ✅ 通过 | chunk Scene3D 1233 kB 警告（非错误） |
| `npm run qa` | ✅ 通过（qa:static + qa:assets + qa:rooms + qa:tasks + build） | 0 Blocker / 0 Critical / 0 Major / 0 Minor |
| `npm run e2e -- --project=chromium` | ✅ 5 passed (30.8s) | 不包含 @real-browser 的 arena-smoke |
| `npm run e2e`（全项目） | ⚠️ 未全部跑通 | arena-smoke 标 `@real-browser` 不在 chromium 项目内，本次未运行 headed 版本 |

> 注意：未运行 `npm run e2e:headed -- --project=real-browser`，因此 Arena 真实键盘+ 3D 移动交互无通过证据。

---

## 一、项目当前状态（17 子系统审计表）

| system | status | implementedEvidence | missingOrBroken | affectedFiles | playerImpact | researchImpact |
|--------|--------|---------------------|-----------------|---------------|--------------|----------------|
| 1. 首页和任务选择 | implemented | `HomePage` 派生自 `taskTemplates.length` 五关卡片；`TaskSelectPage` 解锁进度来自 `localStorage homemem-level-progress`；CTA 跳转 `/tasks` | `HomePage.tsx` 仍有旧关卡文案需要同步（已在 Sprint A diff 修正） | [HomePage.tsx](../src/pages/HomePage.tsx) / [TaskSelectPage.tsx](../src/pages/TaskSelectPage.tsx) / [index.ts](../src/data/tasks/index.ts#L9-L15) | 低：首页/任务选择能正确进入五关 | 无 |
| 2. 五关加载和解锁 | implemented | 每关有唯一 id / objects / containers / goals / scriptedEvents / probes；`taskSlice.initializeTask` 正确构造 entities、containerStates、firstRoom、achievedGoalIds、proceduralProgress；`setLevelCompleted` 解锁下一关写 localStorage | 第 3/4/5 关脚本事件和玩法成熟度弱于 1/2 关（见 §3）；`nightPatrol` 的黑暗视觉限制只在文案，未见真实 shader/视野裁剪 | [taskSlice.ts](../src/store/slices/taskSlice.ts#L94-L198) | 低：可加载但后续关卡游戏深度差异大 | 中：只有关 1/2 可以做研究，关 3/4/5 需进一步平衡 |
| 3. 第一人称移动 | partial | `playerSlice.moveForward` + `FirstPersonControls useFrame` + delta 前进后退左右；mouse/pointer lock yaw/pitch | pointer lock 与视角/门洞/墙壁碰撞仍为 E2E @real-browser 未验证；`getWorldDirection` 在 headless 为 0 向量；`FirstPersonControls.handleKeyDown` 改用 `getState().phase` 防御性读取（Sprint A diff） | [playerSlice](../src/store/slices/playerSlice.ts) / [FirstPersonControls.tsx](../src/components/arena3d/FirstPersonControls.tsx) | 中：手感/碰撞需要人工验证 | 中：若移动不准，会污染重复搜索/房间跃迁数据 |
| 4. 俯视视角 | partial | `viewMode: first-person` 切换 `toggleViewMode`；Scene3D 有 orthographic topdown Camera | 未在 HUD/按键热区做模式切换引导；俯视角拾取、标签显示效果未验证 | [Scene3D.tsx](../src/components/arena3d/Scene3D.tsx) / [useGameStore](../src/store/useGameStore.ts#L59) （viewMode） | 低：V 键可切，切了仍能操作 | 无 |
| 5. 拾取和放置 | implemented | `pickEntity` / `placeEntity` 有 room/distance/category 三重检查；错误 placement 扣 30 + 混乱 + breakCombo；正确则 combo 分数增益；触发 `recordAction('pick'/'place')` 与 session 记录 | `pickEntity` 的 hiddenInContainer 只检查包含关系，不验证容器是否真的是 `surfaceContainerId`（hypothesis） | [entitySlice.ts](../src/store/slices/entitySlice.ts#L30-L189) / [commands.ts](../src/game/commands.ts#L72-L117) | 中：拾取/放置核心 OK，但与视觉/距离的 3D 交互仍需人工确认 | 高：拾取/放置/错误都会记录 |
| 6. 容器打开关闭 | implemented | `useContainer` 切换 open/close + containerStates[].containedIds；`hiddenInContainer` → 容器打开时 entity 变为 `free` + surface 位置；关闭时根据 proximity 重新收集为 hidden；按 F 根据 `heldEntityId` 分派 place vs toggle | 嵌套容器 / 多个物体在同一表面时关闭容器的 containedIds 可能误收集（`d<0.6`）；床头柜抽屉的 open 过程只有状态变化，无动画（无 broken，只是视觉 placeholder） | [entitySlice.ts#L191-L316](../src/store/slices/entitySlice.ts#L191-L316) / [commands.ts#L99-L117](../src/game/commands.ts#L99-L117) | 中：逻辑 OK | 高：use/open/close action 都会记录 |
| 7. 目标完成 | implemented | `checkLevelCompletion` 每 command 后跑所有 goal.predicate；每个 goal 首次 achieved 加 toast + +DEFAULT_LEVEL_BALANCE.validMemoryUseScore + 时间戳 + clear flow hint；all goals achieved → 进入 probing 并加 finalBonus = timeBonus + comboBonus − chaosPenalty | goal.predicate **完全不依赖玩家记忆槽**：只看 entity.placedIn/status/category；即不使用记忆也能通关。记忆只影响评分、Probe 正确率，不影响完成 | [taskSlice.ts#L265-L318](../src/store/slices/taskSlice.ts#L265-L318) | **高**：记忆≠通关（核心发现） | **高**：D(k) 研究缺少完成度依赖 |
| 8. 计时与失败 | implemented | `tickElapsed` 每帧 delta；task.timeLimit (clean-table=180s, leave-home=180s, laundry=120s, breakfast=120s, night=300s)；超时 setLevelFailed('任务超时')；chaos≥100 setLevelFailed('混乱值过载')；30s/10s audio warning + 粒子 | 只有 timeout / chaos 两种失败；无步数失败、无错误次数失败；`setLevelFailed` 后仍去 Probe（phase=probing）这是设计选择不是 broken | [taskSlice.ts#L417-L467](../src/store/slices/taskSlice.ts#L417-L467) | 中：玩家会经历时间压力 | 高：elapsedMs / failedReason 都在 session 内 |
| 9. 混乱值 | implemented | `chaosValue / chaosPeak` (0–100)；incrementChaos 来源：过期记忆 × outdatadMemoryChaos，脚本事件 × eventChaos，错放 × wrongPlacementChaos，连续错误 3 次 +15；decrement 来源：连续成功 5 次 −10，覆盖 high priority 记忆 +5；confidence decay 随混沌 1× / 1.5× / 2× / 3×；≥80 警告音频 | 随机事件（`checkRandomEvent`）只有 markOutdated，未真正移动物体（只做 toast + 调用 `markMemoryOutdated`，不修改实体）；随机事件在单元测试中有覆盖但未见 E2E | [chaosSlice.ts](../src/store/slices/chaosSlice.ts) | 中：混乱会改置信度衰变，但不改任务完成逻辑 | 中：混沌峰已记入结果；但 random event 未实际搬物 → D(k) 缺失「真实扰动」 |
| 10. 评分与 Combo | implemented | 正确 pickup：基础 pickTargetScore；正确 place：基础 × calcComboMultiplier(combo)；时间/早完成 bonus；记忆效率 0.8→bonus；过期记忆 penalty 在 finalBonus 里只有 chaosPenalty 直接影响 score；combo break：错放/连续 3 错；结果页 Rank S/A/B/C/D，4 种 Title 含 1 条「记忆守护专家」锁定 + memoryEffectiveRate>0.8 条件 | score/Combo 与「记忆影响决策」唯一的通道是 `calcMemoryEfficiencyBonus` 但只在结果页生效；不中途影响成功概率 | [scoring.ts](../src/game/scoring.ts) / [scoreSlice](../src/store/slices/scoreSlice.ts) | 中：有完整得分系统 | 中：可作为 outcome 指标 |
| 11. 对话 | partial | `useDialog` 对话 hook；dialog/dialogs.ts（当前工作区已回到 HEAD 版本空内容）；简报弹窗、关卡结束 MEM-07/猫对话、Probe 前后 | 对话与任务状态的双向绑定弱：对话结果不会改变任务进度；文案仍需 Sprint D patch 来完整 | [useDialog.ts](../src/dialog/useDialog.ts) | 低：对话是展示型 | 低：dialog action 未写入 Session event |
| 12. 音效和 BGM | partial | `bgm.ts` 根据 task.id 播放；`sfx.ts` pick/place/open/close/memory save/outdated/chaos warning/time warning / cat_event / phone_ring；`isAudioEnabled` 开关 | `audio state changed` console.log 仍有 2 处（HEAD 遗留）；无头环境 BGM 不启动（正确）；移动端首次手势解锁 AudioContext 未显式处理（unknown） | [audio/sfx.ts](../src/audio/sfx.ts) / [audio/bgm.ts](../src/audio/bgm.ts) | 中：反馈完整但未在真机测 | 低：音效无研究价值（除 audio cue） |
| 13. 存档 | partial | `save/saveSystem.ts`（ProgressSlice 引用）保存解锁进度/最高分/完成状态到 localStorage；`saveCurrentGame / loadFromSave` 有接口；完整关卡回放（entity + container + memorySlots + elapsedMs）未见 UI 入口 | `loadFromSave` 只在 GameStore 接口；Result/Data Page 无「恢复存档」按钮；无 seed/condition 复现 | [useGameStore.ts#L172-L174](../src/store/useGameStore.ts#L172-L174) / [progressSlice](../src/store/slices/progressSlice.ts) | 低：玩家进度保存 OK | 中：可复现性存档不足 |
| 14. Probe | implemented | 每关带 probes 数组（leave-home 6 题：钥匙原位置/猫位置/手机位置/雨伞位置/是否用了记忆/是否锁定）；`ProbePage` 记录答案+反应时间；`recordProbeAnswers` 按 memoryType 分别算 accuracy/spatial/object/temporal/procedural 并写入 metrics | 所有 Probe 选项固定、正确答案固定；**p-memory-used / p-memory-locked 的「是」正确答案** → 会鼓励玩家在训练中必须按 E / 锁定，但关卡完成本身不需要 | [ProbePage.tsx](../src/pages/ProbePage.tsx#L19-L177) / [useSessionStore.ts#L200-L243](../src/store/useSessionStore.ts#L200-L243) | **高**：回答正确性≠记忆必要性 | **高**：Probe 题面本身就是研究条件，需更严格区分「玩家选择」和「强迫回答是」 |
| 15. Result | implemented | 结果页：Rank/Stars/Title；完成时间/Combo/chaos 峰/错误放置；保存/更新/过期/有效率/重复搜索 5 格；按 4 memoryType 分别 accuracy；MEM-07 诊断；JSON 下载；重玩；「记忆守护专家」需 lockCount>0 & memoryEffort>0.8 & score≥1200 | 策略分析只基于 memoryEffectiveRate & outdated count；没有按记忆内容做「检索正确/错误」分析；过期记忆对玩家动作的具体影响未量化 | [ResultPage.tsx](../src/pages/ResultPage.tsx) | 中：完整分数与排名展示 | 中：可出结果；但未到 research-grade |
| 16. Session 数据导出 | partial | `useSessionStore.currentSession`：events/memories/actions/scripted_events/visible_objects_per_step/memory_updates/probe_answers；`SessionDataPage.tsx`（README 中 `/data/:taskId`）可导出 session JSON | 没有每步 robotPose / cameraPose 轨迹；visible_objects_per_step 字段声明了但只在 `addEvent` 对含有 visibleEntityIds 的事件写入，目前没见代码真正填充；seed、condition 字段已在 ai_research_annotation 但空；可重放所需 entity/container state 未按 step 保存 | [useSessionStore.ts](../src/store/useSessionStore.ts) / [SessionDataPage.tsx](../src/pages/SessionDataPage.tsx) | 中：JSON 可下载 | **高**：D(0)/D(1)/D(k) 研究需补轨迹、实体快照、条件 |
| 17. 单元测试、QA、E2E 和部署 | partial | 单测 301 全绿；`oxlint` 全绿；`qa:*` 四个脚本 + build；deploy.yml GitHub Pages deploy（Sprint A diff 加 lint/test/qa）；E2E 3 套：navigation-audio(2)、first-level-command-flow(1) 全绿；arena-smoke 标 @real-browser（headed） | 缺少真实 3D 寻路 E2E（门洞、WASD、鼠标）；缺少关 2/3/4/5 的 command-backed 通关 E2E；只有关 1 / 关 2 有首屏截图基线（golden） | [playwright.config.ts](../playwright.config.ts) / [.github/workflows/deploy.yml](../.github/workflows/deploy.yml) | 中：基础门禁完备 | 高：部署可重复，但实验条件（headless/seed/condition）不固定 |

---

## 二、记忆系统能力清单（16 项）

判定规则：**存在状态变化 + 有玩家可触发路径**才算 implemented；只有 UI 或 types 不算。

| # | 能力 | implemented | playerCanSee | changesDecision | changesOutcome | loggedInSession | tested |
|---|------|:---:|:---:|:---:|:---:|:---:|:---:|
| 1 | 保存记忆 | ✅ Yes | ✅ HUD 3 槽 UI 显示名字/房间/置信度/锁图标 | ❌ 否（goal.predicate 不看记忆） | ⚠️ 只影响 score / probe accuracy | ✅ `useSessionStore.addMemory` + eventBus `memory_write` event | ✅ E2E `saveMemoryByConfigId` 断言 slot.entityConfigId；proceduralMemory.test |
| 2 | 更新已有记忆 | ✅ Yes | ✅ 槽位 +10 分/记忆更新分 + typeBonus | ❌ 否 | ⚠️ 只影响 `memoryUpdateCount` / 分数 | ✅ `memory_updates` 追加 / incrementMemoryUpdate | ✅ `findSlotByEntityConfigId` 单测；E2E 未直接测 |
| 3 | 三槽限制 | ✅ Yes | ✅ HUD 只渲染 3 格；`DEFAULT_LEVEL_BALANCE.memorySlotCount` 默认 3 | ✅ 部分：第 4 件物品必须覆盖 | ⚠️ 覆盖 high priority 加 5 混乱，不阻止完成 | ✅ 不单独记录，但覆盖时的 toast 有视觉 | ✅ `findOverwriteableSlot` 单测 |
| 4 | 槽位覆盖 | ✅ Yes | ✅ 覆盖时「记忆已覆盖」floating text；覆盖 high priority 加 ⚠️ 浮字 + 5 混乱 | ❌ 否（不改后续 goal 判定） | ⚠️ 只影响 score/chaos | ⚠️ 覆盖 action 未单独记 event，只是 addMemory 再写一次 | ✅ `findOverwriteableSlot` priority/timestamp 逻辑测试 |
| 5 | 槽位锁定 | ✅ Yes | ✅ 槽位 Lock/Unlock 切换；saveMemory 对 locked slot 返回失败 | ✅ 是：阻止「更新」和「覆盖」（`if (oldSlot?.locked) return false` 且 findOverwriteableSlot 跳过） | ⚠️ 只影响 4 条 Title 之一「记忆守护专家」条件；不影响通关 | ⚠️ memory slot.locked 状态存在，但切换 lock 行为未记录 action event | ⚠️ 未见锁定-覆盖组合测试；有 UI |
| 6 | 置信度 | ✅ Yes | ✅ HUD 进度条色 + 百分比；confidence decay 按 0.005/sec × chaos × priorityFactor | ⚠️ 只在 UI：`outdated = outdated or confidence<40` 自动变过期 | ⚠️ 间接通过 outdated 产生 penalty/chaos | ✅ 不在单独字段，但记忆槽会 decay；无 step 级置信度快照 | ✅ `updateMemoryConfidence` 参数化（无专门单测） |
| 7 | 记忆类型 | ✅ Yes | ✅ HUD 用 MapPin/Box/History/Play 四个 icon；MemoryType 影响 scoreBonus (spatial50 / object30 / temporal40 / procedural60) 和 chaosReduction | ❌ 否 | ⚠️ 只改加成分数；探针 accuracy 按类型统计 | ✅ slot.memoryType 存；probe 分类 accuracy 有 | ⚠️ 类型映射在 `memorySlice.getMemoryTypeForEntity` 只有 4 个 spatial/3 个 object/2 个 temporal 硬编码；其余 fallback='spatial' |
| 8 | 记忆过期 | ✅ Yes | ✅ 旧位置脉冲遮罩 `animate-outdated-pulse`；outdated flag + confidence*0.5 cap 20 | ❌ 否（玩家仍可直接去旧位置找不到，但自己走过去发现即可） | ⚠️ 只影响 `incrementOutdatedMemory + 8 混乱`（DEFAULT_LEVEL_BALANCE.outdatedMemoryChaos 读取默认值） | ✅ `memory_outdated` 有 SFX + flash；incrementOutdatedMemory count 记入 stats | ✅ `markOutdatedByEntityConfigId`；E2E 关 2 断言 slot.outdated === true （猫事件） |
| 9 | 半过期或连锁过期 | ✅ Yes | ⚠️ 玩家看不到关联（只在 slot 内一次性标 outdated + confidence*0.7 下限 20） | ❌ 否 | ❌ 否：只改槽位状态 | ✅ markRelatedMemoryOutdated 通过 eventBus 无单独事件 | ✅ `markRelatedMemoryOutdated` 单测无；relatedMap 只有 key/phone/umbrella/tray 四类 |
| 10 | 正确记忆奖励 | ✅ Yes | ✅ 保存记忆后 scoreBonus/spatial50/object30 浮字；记忆更新分 +10；有效记忆率 memoryEfficiencyBonus(40/20) 结果页奖励 | ❌ 否 | ⚠️ 只影响最终分数 | ⚠️ 只有最终 memoryEffectiveRate，无"正确使用某条记忆完成拾取/放置"的事件 | ⚠️ 无单测验证有效率门槛 |
| 11 | 过期记忆惩罚 | ✅ Yes | ✅ incrementChaos(8 / outdatedMemoryChaos 读取)；chaos 峰值提升结果页诊断 | ❌ 否（仍能完成） | ⚠️ 通过 chaotic 改 decay 和 randomEvent 概率 | ✅ outdatedMemoryCount 在 stats/结果页 | ✅ `incrementOutdatedMemory` 被 `markMemoryOutdated` 调用 |
| 12 | 记忆影响混乱值 | ✅ Yes | 见上 | ❌ 否 | ⚠️ 混沌≥100 → 任务失败（只有路径） | ✅ | 单元测试 `chaos.test.ts` 34 项 |
| 13 | 记忆影响任务完成 | ❌ **No** | ❌ 无 UI 显示需要记忆才能完成 | ❌ 所有 goal.predicate 只看 entity/placedIn/status | ❌ No | 不适用 | ❌ 无测试（也不应测"无记忆失败"，因为现在无记忆不会失败） |
| 14 | 记忆使用记录 | partial | ❌ 玩家看不到"我何时用了哪条记忆做出决策"；只有记忆槽 UI 快照 | ❌ 系统不知道玩家到底是看记忆槽还是看物体/标签 | ❌ 不适用 | ⚠️ session.memories 有写入记录，但无"使用/查取"动作 | ❌ 无代码追踪「决策前是否查询记忆槽」 |
| 15 | 记忆检索或回顾 | ⚠️ placeholder | ✅ 玩家可以在 HUD 记忆槽点 Trash 删除 / Lock / Hover | ❌ 没有检索面板；HUD 不是"回顾/搜索 UI" | ❌ No | ⚠️ 有记忆槽可见，但没有 review 模式 | ⚠️ No dedicated "retrieve" |
| 16 | Result 中的记忆策略分析 | partial | ✅ 有 memoryUsed/outdated/updateCount/有效率、4 类 accuracy、MEM-07 诊断文案、「记忆守护专家」Title | ❌ 诊断只依赖 memoryUsed/outdated/count，不与真实动作结合 | ⚠️ 只改变 Title/Diagnosis 文本 | ✅ memory stats 字段齐 | ✅ `calcMemoryEffectiveRate` 单测无，但 `getTitle` 条件在代码中可验证 |

> **核心审计发现**：记忆系统在"状态+UI+评分+探针"层面 13+2/16 implemented；但能力 #13（改变任务完成判定）为 ❌。这意味着：即使玩家全程不按 E、锁任何记忆，只要完成 goal.predicate 的实体归位，五关都可以通关（§3 验证）。

---

## 三、逐关卡记忆必要性矩阵

判定规则：
- memoryCurrentlyUseful：使用记忆有可感知帮助；
- memoryCurrentlyNecessary：**不使用记忆（不按 E、不锁、不更新）就无法完成目标，或在合理流程中必然**因此失败。

### 3.1 task-clean-table（初次整理 / 教学关）

| segmentId | segmentDescription | currentRequiredAction | memoryCurrentlyUseful | memoryCurrentlyNecessary | canCompleteWithoutMemory | memoryFailureConsequence | supportingCode | confidence |
|-----------|--------------------|-----------------------|:---:|:---:|:---:|--------------------------|----------------|------------|
| seg-ct-1 | 桌面上有 3 件物体 → briefing 已明确目标映射（脏杯子→洗碗机/餐巾纸→垃圾桶/叉子→餐具架） | 进 dining → 拾取 3 个 → 放 3 个容器 | ❌ 否：简报直接写了所有位置/映射 | ❌ **否** | ✅ 是：全程按 briefing 就能放对 | 无 | [clean-table.ts goals#L125-L159](../src/data/tasks/clean-table.ts#L125-L159) | confirmed |
| seg-ct-2 | se-tutorial-* 教学消息（step 触发 welcome/pickup/memory/place/encourage） | 消息仅文字；无 move-entity / hide / markMemoryOutdated | ❌ 否 | ❌ 否 | ✅ 是 | 无 | [clean-table scriptedEvents](../src/data/tasks/clean-table.ts#L161-L200) | confirmed |
| seg-ct-3 | 3 件物体都在同一房间同一餐桌表面，容器 3 个都在同房间，位置视觉显眼 | 3 pick + 3 place 完成 | ❌ 否；标签（Object3D name）+ 容器 targetLabel 显眼 | ❌ 否 | ✅ 是 | 只有错放扣分 +3 秒 | [Task targets](../src/data/tasks/clean-table.ts#L72-L123) | confirmed |

### 3.2 task-leave-home（出门大作战 / 核心展示关）

| segmentId | segmentDescription | currentRequiredAction | memoryCurrentlyUseful | memoryCurrentlyNecessary | canCompleteWithoutMemory | memoryFailureConsequence | supportingCode | confidence |
|-----------|--------------------|-----------------------|:---:|:---:|:---:|--------------------------|----------------|------------|
| seg-lh-1 | 3 房间 + 3 物品（钥匙→客厅茶几/手机→床头柜抽屉里/雨伞→玄关伞架）→ briefing 全披露初始位置 | 直接按 briefing 路线搜 3 个位置 | ⚠️ 部分：若玩家忘记钥匙位置，HUD 标签/物体名字仍可见 | ❌ **否** | ✅ 是：按 briefing 全搜就行 | 只会多走 + 多重复搜索 | [leave-home briefing#L19-L29](../src/data/tasks/leave-home.ts#L19-L29) / 见 §4 | confirmed |
| seg-lh-2 | 猫事件（step>2 且 currentRoom!==living 且 key free → 把钥匙从茶几推到沙发旁 + 标记忆过期） | 触发后：需要重新拾取 | ✅ 有用：保存钥匙记忆的话，过期时视觉 pulse 提醒 | ❌ **否**：若玩家先拿钥匙再离开客厅 → 事件永不触发！；即使事件触发，玩家也可回 living 通过物体名/金色标签直接找到新位置 | ✅ 是：①先拿钥匙 bypass；②或猫移动后重搜客厅都可以 | ① 不触发事件 → 无；②触发后只多 20 秒内重搜客厅 | [se-cat-pushes-key trigger#L172-L186](../src/data/tasks/leave-home.ts#L172-L186)；「key.status === 'held' 不满足 free」→ 事件未触发 | confirmed |
| seg-lh-3 | 手机位置提示（step>=3 且手机 not placed 且 currentRoom!==bedroom → 📱铃声 toast） | 提示手机在卧室床头柜里；先得 F 开抽屉 | ❌ 否（toast + briefing 双提示） | ❌ 否 | ✅ 是 | 无 | [se-phone-ringing#L187-L198](../src/data/tasks/leave-home.ts#L187-L198) | confirmed |
| seg-lh-4 | 3 件都放玄关托盘 → 通关 | 3 place 都验证 acceptedCategories=[key,phone,umbrella] | ❌ 否（目标区有 targetLabel + 高亮容器） | ❌ 否 | ✅ 是 | 只有错放扣分/扣分 | [goals#L131-L168](../src/data/tasks/leave-home.ts#L131-L168) | confirmed |

### 3.3 task-laundry-sort（洗衣幽灵）

| segmentId | segmentDescription | currentRequiredAction | useful | necessary | canCompleteWithoutMemory | consequence | supportingCode | confidence |
|-----------|--------------------|-----------------------|:---:|:---:|:---:|--------------------------|----------------|------------|
| seg-ls-1 | 9 件衣物 3 颜色分类 → 3 个篮子 room laundry 同房间 | 9 pick + 9 place；只看 category 匹配 | ❌ 否（篮子颜色显眼 + 物体颜色直接显示） | ❌ **否** | ✅ 是 | 错放 penalty（wrongPlacePenalty + 15 chaos） | [containers acceptedCategories](../src/data/tasks/laundry-sort.ts#L113-L153) | likely |
| seg-ls-2 | 篮位置交换/幽灵藏袜脚本事件 | 在 HEAD 任务定义中未发现 move-entity type 的 scriptedEvents（当前 HEAD 文件只有 goals/probes/containers 的定义；未发现篮子交换 scriptedEvent） | — | ❌ 否：代码中未实现 → 即使不记忆也不会出错 | ✅ 是 | 无：无 move 事件 | `grep move-entity laundry-sort.ts` 命中 0 | confirmed |

### 3.4 task-breakfast（早餐时间循环）

| segmentId | segmentDescription | currentRequiredAction | useful | necessary | canCompleteWithoutMemory | consequence | supportingCode | confidence |
|-----------|--------------------|-----------------------|:---:|:---:|:---:|--------------------------|----------------|------------|
| seg-bf-1 | 第一阶段：上桌序列 requiredSequence：牛奶→麦片→碗→杯子 | pick/open/place 顺序错 → `checkProceduralStep wrongOrder` → chaos+5 + break combo + 浮字；但不阻止 pickup | ✅ 有帮助：记流程顺序就不会每次扣分 | ❌ **否**：顺序错只扣分，最终仍只要所有物品归位可通关 | ✅ 是（只多扣分和失败） | 错顺序 × N 扣分 + chaos，但 timeout 前仍有机会做完 | [requiredSequence 在 goals](../src/data/tasks/breakfast.ts#L196-L220)（HEAD 文件需进一步看，但 proceduralMemory 已接口接入并测试） | likely |
| seg-bf-2 | 第二阶段：归位和所有容器关闭 → 牛奶→冰箱、麦片→上层、餐具→洗碗机/水槽 | 所有 goals predicate 只看 placedIn | ❌ 否：容器都有名字 | ❌ 否 | ✅ 是 | 无 | HEAD breakfast 待进一步阅读，但接口一致 | hypothesis |

### 3.5 task-night-patrol（深夜巡逻）

| segmentId | segmentDescription | currentRequiredAction | useful | necessary | canCompleteWithoutMemory | consequence | supportingCode | confidence |
|-----------|--------------------|-----------------------|:---:|:---:|:---:|--------------------------|----------------|------------|
| seg-np-1 | 4 件 displaced 物品：遥控器/手机/碗/雨伞，都有「归属位」4 个目标容器，每个房间一间 | 跨 5 房间各 1 个 pickup + 1 place。简报直接披露初始位置和归属位 | ⚠️ 部分：5 房间之间走记路有用，但方向指示 UI（屏幕边缘箭头）会直接指示未确认物品位置 | ❌ **否**：只要按「方向指示走 + 看物体标签」就能完成 | ✅ 是 | 只有超时/走错 | [briefing#L21-L33](../src/data/tasks/night-patrol.ts#L21-L33) / 方向指示假设（Sprint A Scene3D 需要阅读，但代码有"屏幕边缘方向指示会标记"文案，说明已实现） | hypothesis |
| seg-np-2 | 黑暗视野受限 / 电器异响 / 窗户晃动（night scripted events 只有消息） | 只是文字，不改实体位置 / 可视性 | ❌ 否 | ❌ 否：没有真正 darkness shader | ✅ 是 | 无：只有消息 | [night scripted events](../src/data/tasks/night-patrol.ts#L179-L200) | likely |

### 3.6 特殊检查

1. **完全不按 E 是否能通关**：✅ 五关全部可以（所有 goal 只看 entity placedIn/status；记忆对 goal 无贡献）。
2. **不更新过期记忆是否仍能通关**：✅ 是（钥匙猫事件发生 → 去 living 重搜即可；HUD 标签+颜色让重搜几乎不费力）。
3. **锁定记忆是否真正改变结果**：⚠️ 只改变 score（记忆守护专家 Title）+ 防止覆盖；不影响完成。
4. **记忆槽满是否产生真实取舍**：⚡️ 只有关 2 出现 3 个目标物品 = 3 槽 = 不会满；关 3/4 物品数 > 3 但仍可全程不保存 → 无取舍。关 2 保存了 3 条之后如果再看到"想存第 4 条"会触发覆盖，但玩家可以不按 E。
5. **是否能通过 HUD/标签/小地图绕过记忆**：✅ 是：物体 Object3D 有 name label、容器有 targetLabel、简报有初始位置、钥匙/手机还有 toast 提示、night 边缘方向指示。**记忆槽对当前关卡完成信息增益约 ≤ 20%**（hypothesis，仅从代码分析）。
6. **随机/脚本事件是否依赖玩家保存过记忆**：❌ 否——leave-home 的猫事件 trigger 只检查 step>2 && not in living && key free，不检查玩家是否保存了钥匙记忆。直接 bypass（先拿钥匙再走客厅）就不会触发。
7. **记忆当前影响的是成功率/时间/分数/展示**：✅ 主要是**分数**（save/update/type/efficiency/title bonus）+ **探针得分**（若玩家真的回忆记忆则 probe 正确）+ 展示（HUD 槽脉冲），对**成功率/时间**只有间接影响（过期后再去找会多几秒，不决定成败）。

---

## 四、出门大作战核心循环审计

设计文档中的理想循环：
发现钥匙 → 保存钥匙记忆 → 离开客厅 → 猫移动钥匙 → 钥匙记忆过期 → 玩家发现旧位置错误 → 重新搜索钥匙 → 更新钥匙记忆 → 完成任务

实际代码逐步核对：

| step | trigger | precondition | stateChange | playerFeedback | canBeSkipped | canBeBypassed | automatedTest | currentStatus |
|------|---------|--------------|-------------|----------------|:---:|:---:|:---:|:---:|
| 1. 发现钥匙 | 首次进入 living，钥匙初始在茶几 | 游戏进入 playing | 机器人视觉见 Object3D 金色 label 钥匙 | Briefing 文字 + 目标列表 + 容器 targetLabel | ❌ 否（必见） | ❌ 否 | ⚠️ 只有 command-backed，未真视觉 | implemented |
| 2. 保存钥匙记忆 | 玩家按 E（`executeSaveMemory(entityId)`） | entity 在附近 + phase playing | saveMemory → slot 新增 + addMemoryWrite event + 粒子 + SFX + +50 spatial typeBonus | HUD 新槽 + "记忆已保存"浮字 | ✅ 是（玩家可不按 E） | ❌ 不影响后续完成 | ✅ E2E 断言 saveResult.success=true / slot.entityConfigId=obj-key | implemented |
| 3. 离开客厅 | transitionToRoom('bedroom' 或 'entrance') | step>2（通常 1 次 saveMemory + 进其他房间即 step 累积） | currentRoom + visitedRooms | no | ❌ 否（任务必跨房间） | ✅ **是**：如果先进 living 先捡钥匙→钥匙 held → step>2 时 currentRoom!==living 但 key.status!=='free' → 下一条触发条件 fail，整个事件被跳过 | ⚠️ 命令式 E2E 用 transitionToRoom('entrance') 触发，但未测试"先 pick 钥匙→事件不触发"路径 | partial |
| 4. 猫移动钥匙 | `se-cat-pushes-key.trigger`(step, entities, currentRoom): **step>2 && currentRoom!=='living' && key.currentRoom==='living' && key.status==='free'** | 3 条全满足 | applyScriptedMove 改变钥匙实体 position → sofa near；`markMemoryOutdated(obj-key)`；incrementChaos(DEFAULT_LEVEL_BALANCE.eventChaos) | toast 🐱 啪嗒 + 猫 SFX + chaosEffect | ✅ **是**（先 pick 钥匙就完全跳过） | ✅ **是**：① 不离开 living；② 先 pick；③ step ≤2 快速完成 | ✅ E2E：执行 transition('bedroom')+toggleContainer + pickByConfigId(phone)+transition(entrance) 后断言 key 位置变了，且 slot.outdated=true（先 saveMemory 再跨房间） | implemented |
| 5. 钥匙记忆过期 | 猫事件触发后调用 `markMemoryOutdated` | slot 存在 matching entityConfigId 且 !locked | slot.outdated=true + confidence 折半（下限 20）；若触发连锁则 markRelatedMemoryOutdated(obj-key) 关联手机+玄关 | HUD pulse(animate-outdated-pulse) + `记忆过期 SFX` | ❌ 否（若有槽且事件触发必标记） | ✅ **是**：① 没有该记忆 → `hasMatchingSlot=false` 直接 return；② 锁定 → 标记过期时 locked 跳过不标过期 | ✅ E2E：assert slot.outdated=true | implemented |
| 6. 玩家发现旧位置错误 | 玩家回到 living 原茶几位置 → 见不到钥匙 | 视觉 | 茶几上空（但物体仍在客厅沙发侧，有物体标签/金色） | ❌ 否（猫事件触发必发生） | ✅ 是：看一眼就知道不在→换客厅别处搜；**HUD 标签可以直接找到新位置**；无需"先查记忆槽→知道过期→重新搜" | ❌ 无自动化 | hypothesis |
| 7. 重新搜索钥匙 | 视觉看客厅各处 → 沙发旁有金色钥匙 | — | 见物体名 | 同 6 | ✅ 是：有标签几分钟内能找到 | ❌ 无自动化 | placeholder |
| 8. 更新钥匙记忆 | 靠近沙发旁钥匙再按 E → saveMemory 检查 existingIndex（entityConfigId=obj-key 已存在槽） | 槽 not locked → 更新；locked → 失败返回 | newSlots[existingIndex] = {new, keep id}；incrementMemoryUpdate + +10 memoryUpdateScore + typeBonus；toast；粒子 | 记忆槽信息刷新 + "+记忆更新分"浮字 | ✅ 是（玩家可不按 E） | ❌ 对完成不影响 | ⚠️ No automated | partial |
| 9. 完成任务：3 件 placedIn= cnt-entrance-tray 且 status=placed | all goals predicate(true) | — | 任务完成 → setLevelCompleted → phase probing；final bonus 计算；unlock next level | 成功浮字/toast | ❌ 否：最终必达成才通关 | ❌ 不能 bypass predicate | ✅ E2E：assert key/phone/umbrella.placedIn / levelCompleted=true | implemented |

### 对 §4 七个问题的逐一回答

1. **猫事件是否要求钥匙记忆已经保存？**
   ❌ 不需要。触发条件中未检查 memorySlots 是否包含 obj-key 记录（[leave-home trigger#L173-L176](../src/data/tasks/leave-home.ts#L173-L176) 只看 step/currentRoom/key.room/key.status）。

2. **玩家直接拿走钥匙能否绕过事件？**
   ✅ 可以。`key.status === 'free'` 在第 4 步是必要条件，若玩家先 pick 钥匙使 `status='held'` → 事件 trigger 永远为假，猫不会"动"任何东西。

3. **玩家是否必须使用一次过期记忆？**
   ❌ 不必。同时满足 3 条即可：a) 不按 E 保存记忆 → 没有槽 → 不会有过期 pulse；b) 先拿钥匙 → 猫事件不触发 → 根本不会过期。

4. **玩家是否必须更新记忆？**
   ❌ 不必：可在重搜客厅后直接 pick → 再去玄关 place；跳过「按 E 更新」。

5. **完全不用记忆时是否仍能轻松通关？**
   ✅ 是。Briefing 给了所有 3 件起点 + 终点 + 开抽屉步骤；目标容器是 targetLabel；手机还会响铃 toast。**不用 E 通关是当前最优、最快路径**（省去 save/update 动作，无任何惩罚）。

6. **手机和雨伞是否创造了有意义的记忆决策？**
   ⚠️ 雨伞 initialRoom=entrance 且就在伞架上，玩家到玄关只需要「F 拾取 → 一步 → F 放到托盘」。手机是 1 个卧室床头柜抽屉（先开抽屉），但 briefing 给了位置 + 铃声提醒。因此 3 件物品唯一有「后续位置风险」的是钥匙，但先拿钥匙可完全消除。

7. **当前 E2E 是否覆盖完整记忆生命周期？**
   ✅ 只覆盖了「saveMemory → 触发猫事件 → assert slot.outdated=true → 最终 place」的 command-backed 浏览器流程（[first-level-command-flow.spec.ts#L32-L191](../tests/e2e/first-level-command-flow.spec.ts#L32-L191)）。未覆盖：① 绕过路径（先 pick 钥匙→事件不触发）；② 玩家 lock→覆盖失败；③ 更新记忆。

> **结论**：关 2 的「记忆循环骨架」完整（7/9 步有状态变化），但触发条件中**未正确绑定「记忆已保存」**，并且玩家可以用「先拿钥匙再离开」或「全程不按 E」bypass 掉整个循环。当前更接近「记忆影响评分/探针」而非「记忆是必要能力」。

---

## 五、D(0)、D(1)、D(k) 适配审计

定义回顾：
- D(0)：当前观察和状态足够完成决策（不需要历史）。
- D(1)：需要上一步或一个近期事件的信息。
- D(k)：需要跨多步保留、检索、更新历史。

### 5.1 五关各阶段候选 D 需求

| 关卡 / 阶段 | candidateDemand | requiredEvidence | counterfactualPerturbation（intact/masked/stale/swapped/distractor） | currentLoggingSupport | implementationGap |
|-------------|-----------------|-------------------|--------------------------|----------------------|-----------------|
| **task-clean-table 所有阶段** | D(0) | 单房间 3 目标，所有容器/物体就在眼前；同房间可见标签 + targetLabel | intact/masked/swap 都通过实体状态直接重完成；无需记忆 | 可见 action + entity 状态 change 完整 + timestamp 对齐 | 1. 当前无需改动；2. 加 step 级 entity 快照（日志字段）即可做研究 |
| **task-leave-home seg-lh-1 找物品初始位置** | D(0) | Briefing 披露起点；容器标签；物体标签 | intact=100% 可完成；stale 简报若出错仍可房间搜 | actions + entity placedIn 都有记录 | 只需要 condition 字段标注「简报是否提示准确」即可实验 |
| **task-leave-home seg-lh-2 猫事件后重找钥匙** | **D(1)** | 需要「钥匙原来放茶几，但猫可能移动→找沙发旁」 | **stale**（记忆过期→旧位置错误）是设计目标；**swapped**（钥匙→雨伞交换）当前无代码但可在扰动层实现；**intact vs stale** 目前玩家成功率差异几乎为 0（因为标签可见） | 有 scripted_event/ markMemoryOutdated；缺失「player visited茶几位置失败的证据」(当前没记录去了旧位置) | ① 需要记录「在过期房间停留/搜索/交互过」(step 级位置轨迹 + 到茶几的近距离未拾取动作)；② 需要保证「标签可见程度不消除 stale 和 intact 的差」（目前标签直接消除差，需要改 UI 或真黑暗） |
| **task-leave-home seg-lh-4 最终放置** | D(0) | 容器 targetLabel 直接指示 | 都 OK（只要 3 件在手） | place action 完整 | 无 |
| **task-laundry-sort seg-ls-1 分类** | D(0) | 颜色/类别直接肉眼 + 容器颜色对应 | 所有扰动都可直接肉眼（distractor 加第 10 件会 D(1)） | actions 完整 | 当前无必要 |
| **task-breakfast seg-bf-1 流程顺序** | **D(1) / procedural** | 牛奶→麦片→碗→杯子 requiredSequence | **stale**（忘记到哪一步）会扣顺序 chaos；**swapped**（牛奶和杯子顺序）会触发 wrongOrder 惩罚 + 浮字。但 wrongOrder 只是扣分，不会 reset 状态。proceduralProgress 记录完成度，有接口但需完整检查 | 有 proceduralMemory.progress + wrongOrder action feedback（floating text）但 session 内无 per-step sequence index | 1. 加 proceduralProgress stepIndex 到 session events；2. 当前 D(1) 只影响评分，不影响完成（若要 D(1) 改变完成则需 wrongOrder 达到 N 次直接 fail 或 reset，可能过强，不建议复赛前做） |
| **task-night-patrol 跨 5 房间** | **D(k) 假设** | 4 件物品在 5 个 room，跨房间保持"我已确认过哪几件在哪" | intact：无记忆也靠方向指示完成；stale：电器异响脚本事件当前只文字，不改实体位置 → 不改变成功率；distractor：方向指示只有 4 个正确目标 → 无 distractor | step 级 position 缺失；room transitions 有；方向指示朝向未记；黑暗仅文字 | ① 轨迹必需（robotPose/cameraPose per step）；② 真黑暗 shader；③ 实体扰动（不仅文字）。这 3 项都属于 **改变玩法级**，不建议复赛前做 |

### 5.2 分级清单

| 现状 | 具体 | 备注 |
|------|------|------|
| 🏁 **当前游戏已经支持** | D(0) 观察→决策（五关所有基础任务、关 2 初始搜索、关 4 最终归位）；关 2 seg-lh-2 D(1) 骨架（猫事件 → stale）但缺触发绑定 | 状态 + 事件都 OK；但记忆不是必要 |
| 🔧 **加日志字段即可支持** | seed、condition、per-step robot/camera pose、per-step entity snapshot container snapshot、记忆查询（看槽）动作、proceduralProgress index、错误动作的目标期望记忆 | 字段定义都在 types/session.ts 中可扩；只需在 tickElapsed / handleKeyDown / execute* 时 write |
| 🎮 **需要改玩法** | 让记忆真正改变完成（D(1)/D(k)）：① goal.predicate 中增加「记忆必须存在/未过期才能判定」或② 扰动后没有记忆则搜索时间耗尽或错误惩罚到失败；③ 标签/HUD 弱化；④ 真黑暗 shader + 方向指示不直接指向未拾取物体 | 属于玩法大改动，需 Sprint 规划 |
| ❌ **复赛前不应该做** | 关 3/4/5 大规模平衡 / 新 scripted 事件 / 研究端 ML agent 接入 / 众包知情同意流程 | 分散注意力；当前 P0 是关 2 D(1) 闭环和日志 |

---

## 六、Session 与研究数据审计

字段状态颜色：
- ✅ alreadyLogged：addEvent / addMemory 等接口在命令流中会写入；
- ➡️ derivable：可由其他字段推导，但没有直接列；
- ❌ missing：无代码生成。

| # | Session 字段 | alreadyLogged | derivable | missing | privacyConcern | neededForSemifinal | neededForResearch |
|---|-------------|:---:|:---:|:---:|:---:|:---:|:---:|
| 1 | segment 或阶段 ID | ❌ — | ⚠️ 可用 event.scriptedEvent + achievedGoalId 粗略推导 | ✅ 缺少「阶段进度 id 字段」 | 无 | ✅ 复赛做最小 D(1)/D(k) 实验必须（给 D(1) 触发前后打标） | ✅ 必要 |
| 2 | 当前目标（activeGoal） | ❌ — | ✅ findActiveGoal 函数可按实体快照重算，但 session 没存 | ✅ 缺失（每次 flowIntervention 只存 message，不存 goalId 之外的快照） | 无 | ⚠️ 复赛结果分析有帮助 | ✅ 必要 |
| 3 | 玩家观察（visibleEntityIds per step） | ⚠️ 只有含 visibleEntityIds 的 event 时写入 → 几乎为空（代码里没有地方真正定期发 observation） | ❌ 不能由 actions 推出 | ✅ 严重缺失 | 无 | ⚠️ 可选 | ✅ **必须**：D(0) 观测基线 |
| 4 | 房间变化 | ✅ movement events（fromRoom、toRoom、crossedDoorway=true）；metrics.roomTransitions 计数 | ✅ 全量 | — | 无 | ✅ 已够 | ✅ 已够 |
| 5 | 拾取放置 | ✅ actions：pick/place/open/close action + targetId + result + room + step | ✅ 全量（commands.recordAction） | — | 无 | ✅ 已够 | ✅ 已够 |
| 6 | 记忆写入 | ✅ session.memories + memory_updates 同时写；`memory_write` eventBus → addEvent → scripted_events 没有，但 actions 有 | ✅ 全量 | — | 无 | ✅ 已够 | ✅ 已够 |
| 7 | 记忆更新 | ⚠️ 通过「new memory 有相同 entityConfigId、timestamp 更新」可推，但 action event 中无 `update-memory` 类型 | ➡️ 从 timestamp + repeated subject 推 | ✅ 缺"更新 vs 写入"事件类型区分 | 无 | ⚠️ 复赛分析有帮助 | ✅ 推荐 |
| 8 | 记忆过期 | ⚠️ outdated memory count 只在 stats 有；具体哪条 slot 何时过期、由哪个 event 触发，在 Session events 中：`scripted_event + markMemoryOutdated` 可关联但没有「slot X outdated」event | ➡️ 通过 triggeredEvents + markMemoryOutdated 字段结合推出 | ✅ 缺少过期级别的 per-slot 事件 | 无 | ⚠️ 复赛必要（D(1) 触发点对齐） | ✅ 必要 |
| 9 | 记忆锁定 | ❌ 切换 lockMemorySlot 只改 store 状态，不 recordAction 或 addEvent | ❌ 无法从现有 events 推出 | ✅ 缺失 lock 时间戳 | 无 | ✅ 结果标题需要，所以建议加 | ✅ 必要 |
| 10 | 环境扰动（真正搬物/隐藏） | ⚠️ scripted_events 会记录（type + id + affectedEntityIds）；但 **checkRandomEvent 只 toast，不搬实体** | — | ✅ 缺少真实实体级扰动（只有关 2 的 cat move） | 无 | ✅ 复赛只研究关 2 够用 | ✅ 全关卡需更多 |
| 11 | 错误操作 | ✅ action 中 result='fail' 都记；reason 字段有语义 | ✅ | — | 无 | ✅ 已够 | ✅ 已够 |
| 12 | 重复搜索 | ⚠️ 只在 calculateMetrics 中用「同一房间访问>2 次当重复」近似（非真的搜索同一实体） | — | ✅ 需要「回到同一实体位置但未拾取」这种真正 repeat-search 事件 | 无 | ⚠️ 可选 | ✅ 必要 |
| 13 | 任务里程碑 | ✅ task_progress event.goalId=goal.id 触发 achieved status + step | ✅ | — | 无 | ✅ 已够 | ✅ 已够 |
| 14 | Probe 答案与时间 | ✅ probe_answers 完整（responseTime、isCorrect、memoryType、userAnswer/correctAnswer）；probe_questions 列表同步；reaction 有 metrics | ✅ 全量 | — | ❗ Probe correctAnswer 不应该在导出到众包的 JSON 中出现（训练数据泄漏）；本地下载包含 correctAnswer 是合理的 | ✅ 已够（本地） | ⚠️ 对外数据需移除 correctAnswer |
| 15 | seed | ❌ task 中没有 seed；entity 位置全是 deterministic（entities 无随机初始化） | ❌ 不能推 | ✅ 完全缺失（types/session 可能有字段但代码无生成） | 无 | ⚠️ 复赛只要 deterministic 就可，但推荐固定 seed 字段写 0/任务 hash | ✅ **必要**（复现实验） |
| 16 | condition | ❌ ai_research_annotation 中 condition 有定义但总是空。没有 D(0)/D(1)/D(k) 的对照组条件。 | ❌ 不能推 | ✅ 缺失（需从入口读或 URL query 设置） | 无 | ✅ **必要**：对照实验最小化 | ✅ **必要** |
| 17 | 可重放所需状态 | ❌ 无 entitySnapshot per-step / containerStatesSnapshot per-step / robotPoseSnapshot per-step；只有最终态 + action stream（动作日志） | ❌ 动作回放需要 3D 环境和交互顺序完全一致，不够 | ✅ **严重缺失**（决定是否能离线 replay） | 无 | ⚠️ 复赛不需要真实 replay | ✅ **非常必要** |

---

## 七、当前玩家体验状态

> 本章节没有真人证据，所有判断均为 **hypothesis**（除非标注 confirmed）。

1. **首页 10 秒内能否理解？** hypothesis ✅ 能。Header 有中文「记忆宅邸 3D 网页」，Hero 主标题「HomeMem Arena：家务机器人的记忆挑战」+ 5 段价值点 + CTA「立即体验」。理解障碍：可能把它理解为"演示站"而不是"游戏"（确认的：README badge 链接直接跳到在线版本）。

2. **教学关是否能在 90 秒内完成？** hypothesis ⚠️ 90 秒偏紧（房间内 3 pick + 3 place + 开/关对话 + 3 段教学 toast 分步提示）。当前 180 秒时间限，估计真人第一次 120–150 秒；熟练后 60 秒能做完。→ 建议：**2 分钟（120 秒）是更合理的教学关时间**，但当前不是 broken。

3. **玩家是否知道 E 和 F 的区别？** hypothesis ❌ 不知道。HUD 底部 interaction prompt 只显示「拾取 X」/「放入 Y」/「打开/关闭 Z」（统一 F 提示）；E 记忆保存没有同等显眼的 Prompt。HUD 记忆槽只有当存了记忆才显意义。HelpPanel 有，但需手动按 `?` 或 Tab/R/H 热区，首次玩家很难注意。

4. **HUD 是否遮挡场景？** hypothesis ⚠️ 中央大卡片（任务目标 / Top bar 时钟 / 记忆槽 3 行 / 底栏 interaction prompt + held item / 左下小地图 / 右下 combo + floatingTexts）遮挡在 1280px 以下严重（代码内 isCompact 在 <1280 触发），但 HUD 有 H 隐藏切换，ESC/H 提示可见。

5. **小地图、悬浮标签是否让记忆失去意义？** hypothesis **✅ 是（核心风险）**：所有 Object3D hover 时显示物体名，容器有 targetLabel，简报披露起点终点，night 关方向指示；即使记忆过期，玩家几乎可以纯靠视觉标签完成 80% 搜索。记忆的相对信息价值因此锐减。这一条是「记忆当前更接近展示功能」的主要体验证据。

6. **当前第一关和复赛核心展示关是否明确？** confirmed ✅ 明确。taskPresentationById 定义 `tutorialTaskId = 'task-clean-table'`、`coreTaskId = 'task-leave-home'`；首页 5 个卡片中第二张高亮「复赛核心展示关」图标/文字；任务页 role='semifinal-core' 有 Badge。任务选择页文案也统一「五段记忆挑战」顺序。

7. **结果页是否能解释玩家的记忆策略？** hypothesis ⚠️ 部分能。5 个记忆统计卡片 + 4 类 accuracy × 卡片 + MEM-07 诊断解释 + Title（如「记忆守护专家」需要 lockCount>0）。但无法解释「哪条记忆被更新了几次、哪条过期导致重复搜客厅 2 次」这种粒度 → 更偏展示。

8. **手机/平板/低性能风险？** hypothesis ❗ Scene3D = 1,233 kB（gzip 324 kB），低端 Android 可能卡顿。E2E 没有 mobile 视口 smoke。low-perf PC：`--enable-unsafe-swiftshader`（playwright 中）给 Linux/CI，这部分已 Sprint A 加在 launch 参数。**移动端（真实手机）没有 smoke。**

---

## 八、工作区范围审计（A–F 分类）

参考文件清单（27 modified + 3 untracked）：

### A. Sprint A 必需（本轮允许提交；产品/任务统一）
| 文件 | 修改概要 | 判断理由 |
|------|---------|---------|
| README.md | 五关统一、测试徽章、门禁命令 | 产品文档核心 |
| src/data/tasks/index.ts | taskTemplates、taskPresentationById、tutorialTaskId/coreTaskId | 五关真值源统一 |
| src/pages/HomePage.tsx | 五段挑战派生展示、不再硬编码 4 关 | 与真值源同步 |
| src/pages/TaskSelectPage.tsx | 语义统一、正确关卡顺序 | 同上 |
| src/components/tasks/TaskCard.tsx | testid=`task-start-${task.id}` | 任务选择 E2E 所需 |
| .github/workflows/deploy.yml | lint/test/qa 门禁加入 deploy | Sprint A 门禁增强 |
| docs/SEMIFINAL_SPRINT_A_REPORT.md（untracked） | Sprint A 最终报告 | 本轮交付物（人工文档，可独立 commit doc） |
| src/data/tasks/taskConsistency.test.ts（untracked） | 10 条一致性测试 | 任务真值源测试（属于 Sprint A 新增质量保障） |

### B. 测试和 QA 修复（属于基础修复，不改变玩法）
| 文件 | 修改概要 | 判断理由 |
|------|---------|---------|
| .env.e2e | VITE_E2E=true 保留兼容，MODE=e2e 为主 | 与 MODE 判定配合 |
| .gitignore | qa-artifacts/e2e/*.png、QA_REPORT.md | 排除产物 |
| playwright.config.ts | darwin-only --use-angle=metal；chromium(grepInvert @real-browser) vs real-browser(grep) 双项目 | 跨平台 launch 修复；arena-smoke 发布检查不做 headless 门禁 |
| scripts/qa-assets.ts | fallback 模型路径格式检查 assetAvailable:false 不报错 | 与视觉修复 C 类关联 |
| scripts/qa-models.ts | 删除/禁用缺失引用（避免未实现 model 路径 QA 崩） | 同上 |
| src/dialog/useDialog.ts | lint 清 warning（unused e 等） | Sprint A lint 修复 |
| src/game/flow.test.ts | 硬编码实体数/容器 id → 动态取 | 原单测因任务修改失败的修复 |
| src/store/useGameStore.test.ts | 原 5 + 1 hardcode 失败用例修复；动态 timeLimit；实体数推导 | 同上 |
| src/utils/e2eTestApi.ts | IS_E2E_MODE 常量（MODE==='e2e' 或 VITE_E2E==='true'） | E2E 条件统一 |
| src/utils/e2eTestApi.types.ts | 类型跟随 | 同上 |
| src/main.tsx | TestApi 安装条件改为 MODE/VITE_E2E 双 | 同上 |
| tests/e2e/helpers.ts | 入口 navigate 改为 task-start task id；E2E 错误提示更新为 MODE/VITE_E2E | 配合 B 类 |
| tests/e2e/arena-smoke.spec.ts | @real-browser 标签 + 头注释（不得伪造通过率）+ heading 中文说明 | 方案 B: 移到 real-browser 发布检查 |
| tests/e2e/first-level-command-flow.spec.ts | 解锁所有关 → 走关 2(leave-home) 完整 command-backed + 断言 slot.outdated | 恢复 Baseline E2E：覆盖记忆写入→过期→放置→Probe→Result→重玩 |
| docs/SEMIFINAL_VERTICAL_SLICE_PLAN.md（untracked） | 独立规划文档 | 属于文档，可纳入 doc commit 或 Sprint B 分支 |

### C. 模型视觉修复（可单独提交或并入 Sprint A；不改产品行为）
| 文件 | 修改概要 | 判断理由 |
|------|---------|---------|
| src/components/arena3d/Object3D.tsx | fork 悬浮 label | 视觉修复（仅标签） |
| src/components/arena3d/ObjectGeometries.tsx | SpoonModel / ForkModel / TissueModel 几何体 | 视觉修复 |
| src/components/arena3d/modelIds.ts | spoon→spoon（原 cup 错）、fork→fork（新增）、tissue→tissue（原 trash 错）| HEAD 视觉 bug 修复（原映射错→显示成其他物体） |
| src/components/arena3d/models/FallbackModels.tsx | Fallback 视觉实现（无外部模型依赖的 fallback） | 视觉修复 |
| src/components/arena3d/models/ModelRegistry.ts | 注册 spoon/fork/tissue（assetAvailable:false 仅 fallback）| 同上 |
| src/components/arena3d/Scene3D.tsx | 删除无效 `filter: pixelate(4px)` inline style；PixelationPass 在 E2E MODE==='e2e' 下禁用；注释写明 CSS 不生效 | E2E 环境 + 无效 CSS 清理 |
| src/components/arena3d/FirstPersonControls.tsx | handleKeyDown 改为 getState().phase（防御性读取实时 phase；不称为 bug） | 输入防御性修复 |

### D. 教学关玩法和内容变化（已在 Sprint A 回退；保存为 Sprint D patch）
| 文件 | 修改概要 | 处理 |
|------|---------|------|
| ~~src/data/tasks/clean-table.ts~~ | cat 事件、记忆 step 触发改、提示更新 | **已回退到 HEAD**，patch 保存在 `/tmp/sprint-d/`（Sprint A 审计前报告） |
| ~~src/dialog/dialogs.ts~~ | dtut-2/3 重写 + dtut-4 新节点 + goal-fork 对话序列 | 同上 |

> 注意：Sprint A 工作区这两个文件当前与 HEAD 无 diff。

### E. 调试或自动生成产物（应删除/加入 .gitignore）
| 文件 | 处理 |
|------|------|
| qa-artifacts/e2e/*.png（6 张基线截图）| 保留 HEAD 版（本轮已回退，不在 diff 中）；.gitignore 已改 ignore 后续重写（避免不小心替换基线）。仓库明确要求提交基线。 |
| QA_REPORT.md | 已删除 + .gitignore 加入（自动产物，不应提交） |

### F. 来源不明
**无来源不明文件**（所有 27 modified + 3 untracked 均已在 A/B/C/D/E 归类完毕；Grep 无 `__moveState / TEMP DEBUG / __debug`）。

### 建议去向
- **A + B + C** → 按 SEMIFINAL_SPRINT_A_REPORT.md 中 4 commits 方案：
  1. feat: unify semifinal task presentation（A 的大部分 + consistency test）
  2. fix(input): read live phase in keyboard controls + test/qa 恢复基线（B + Scene3D/FirstPersonControls）
  3. feat(models): add tableware fallback models（C）
- **D 类**：保留 patch，不进入 Sprint A 提交。
- **E 类**：qa-artifacts 仍保留 HEAD 基线；QA_REPORT.md + 临时脚本不在 diff 中。
- **未跟踪文档**：SEMIFINAL 两个 md → 文档独立 commit；CURRENT_GAME_SYSTEM_AUDIT.md（本报告）新建 → 单独 doc commit。

---

## 九、优先级结论（≤ 8 项下一步）

### P0：复赛前必须
| # | problem | evidence | minimalChange | affectedFiles | risk | acceptanceTest |
|---|---------|----------|---------------|---------------|------|---------------|
| 1 | 游戏能否完整跑通（3D 交互层面）？ | 当前 E2E 只有 command-backed；arena-smoke @real-browser 只在 headed 运行，未有人工/headed 绿 | 跑一次 `npm run e2e:headed -- --project=real-browser` 并保存失败截图+ trace；若真浏览器失败修复输入/拾取；否则记录「已手动通过」签名日期 | 无修改 → 只运行；若失败再 Sprint A+ 补丁修 FirstPersonControls/Scene3D | 高（如果真浏览器不能玩，复赛无法展示） | 10 分钟内 headed arena-smoke 通过 或 人工 Gold Path 10 条通过签字 |
| 2 | 关 2 的钥匙猫事件触发条件不检查「玩家是否已保存钥匙记忆」→ 整个 D(1) 循环可以被 bypass | 猫事件 trigger 无 memorySlot 前置条件（leave-home.ts#L172-L186） | 在 cat trigger `&&` 末尾加：`&& memorySlots.some(s => s && s.entityConfigId === 'obj-key' && !s.outdated)`（或改为：必须 `step>saveMemory(obj-key)` 后才允许跨房间触发；实现方式在 taskSlice 上下文决定或传递 getState 到 trigger call）| `data/tasks/leave-home.ts`；若需要也改 taskSlice trigger 调用签名传入 memorySlots 或通过 get() 访问 | 中：改了触发条件后猫事件发生概率更符合设计，但要防止「永远不保存 → 永远不触发」导致玩家根本见不到猫（需 fallback：step>12 不管记忆都触发一次）| ① 不按 E + 先拿钥匙不再触发；② 正常路径（按 E→离开客厅→猫跳出来+过期）仍触发；③ 完全不按 E 但 step 超过 12 的 fallback 触发至少有一次猫提示 toast |
| 3 | 记忆不影响任务完成（goal.predicate 全不依赖记忆槽）→ 「记忆系统是展示功能」的核心结论 | §3 所有关的所有 goal 只看实体状态（§1 system#7；§3 所有 confidence=confirmed clean-table/leave-home/night） | 不应该直接把完成判定绑记忆（可能造成体验 bug）。最小替代：**「必须至少保存过 1 条记忆」+「探针 memory-used 正确回答」条件加进评分 Title 外的一个额外 result-level 完成度徽章**，并在结束 dialog 内强烈反馈「本次未使用记忆→未达到记忆评价模式」。如要改变完成判定（仅用于研究 condition），则在 goal predicate 里按 session.condition 加入「至少 N 条（未过期）记忆」开关 | minimal: `ResultPage.generateDiagnosis`/dialog；如研究条件：`taskSlice.checkLevelCompletion` 加 condition flag。 | 中：不能让老玩家直接失败；推荐先只在"记忆徽章"不影响最终 success/failed | 新徽章（"Memory Aware"）出现且仅当 memoryUsedCount>=1 & outdated 不超过 half；若走研究 condition 分支：N=2 条有效（未过期）保存才达成 completed（否则在 result 给 reached-goals 但 incomplete-memory 状态）|
| 4 | HUD 标签/容器 targetLabel/简报/方向指示 使得纯视觉可完成所有关卡 → 记忆信息增益太小 → §7 结论 5（hypothesis） | Object3D 名称 + 容器 targetLabel（`isTargetZone=true` 已高亮）+ 简报文字 + night 关方向指示箭头 | 只做最小化：① 简报只给「目标物品名字」不给房间+具体位置（leave-home/night 特别）；② targetLabel 只在"接近目标容器时"（1.5m 内）才高亮（现在 findNearestInteractableContainer 2.5m 就提示）；③ 保留物体标签但加距离淡入淡出（>4m 透明度 0.2，<2m 全显） | Scene3D/Object3D；各关 task briefing 文案 | 低-中（降低标签会增加上手难度，需要配合关 1 的教学提示） | 10 名真人试验：不按 E 使用记忆完成关 2 的玩家数（百分比降低 50% 以上为成功；否则需要更激进）|
| 5 | 当前单元测试、E2E 结果 301/5 + lint/build/qa 全绿 无 arena-smoke（headed）记录 → 展示前最少 1 次 headed 真浏览器签名 | §1 子系统「第一人称移动」= partial | 记录一次 Gold Path 10 项日期；失败项写对应 bug issue；不伪造 | 无代码 | 低（只流程）| 人工第 7 节 10 项全部 ⚪→✅ 或者 8 项 ✅ 加 2 项 ⚠️ 说明 |

### P1：核心体验增强
| # | problem | evidence | minimalChange | affectedFiles | risk | acceptanceTest |
|---|---------|----------|---------------|---------------|------|---------------|
| 6 | 玩家不知道 E 和 F 区别（§7.3 hypothesis） | interaction prompt 只有 F；E 没有同级显示 | 在 HUD 底部交互提示栏加「附近可记忆物体：按 E 保存 [objectName]」，并在 F 提示行并排显示 | HUD.tsx（interaction prompt 组合）+ interactionTargets 导出 2 个 nearest 目标 | 低（纯展示）| 新手进入关 1，不打开 HelpPanel 也能在 10 秒内知道 E 能保存记忆 |

### P2：科研接口预留
| # | problem | evidence | minimalChange | affectedFiles | risk | acceptanceTest |
|---|---------|----------|---------------|---------------|------|---------------|
| 7 | Session 缺少 seed/condition/activeGoalId/lockMemory event/per-step entity snapshot | §6 共 7 missing 字段为研究必须 | ① 加固定 seed（Math.hash(taskId) 或 URL ?seed=）；② condition 从 URL ?condition= 取（默认 D(0)_intact）写入 ai_research_annotation.condition；③ lockMemorySlot 动作追加 action event 'lock-slot' type；④ `tickElapsed` 每 250ms 追加一次「entitySnapshot + robotPose + activeGoalId」压缩日志（只在 condition==='research'）| types/session.ts + useSessionStore + taskSlice.tickElapsed + executeSaveMemory/lockMemory | 中：日志量增加，需要节流（250ms 以上或「只研究条件」开启）| 导出 session.json 检查 7 字段每一个不为空；可从快照恢复近似实体状态回放（离线肉眼对照）|

### P3：复赛后研究
| # | problem | evidence | minimalChange | affectedFiles | risk | acceptanceTest |
|---|---------|----------|---------------|---------------|------|---------------|
| 8 | 关 3/4/5 玩法脚本事件/视觉/扰动不完整，仅 D(0) 可研究 | laundry 无 move-entity；breakfast requiredSequence 有实现但只有扣分；night 黑暗仅文案（§3.5/3.4） | ① laundry 增加至少 1 次 swap basket；② breakfast wrongOrder 3 次触发 reset to 序列起点（或只在研究 condition）；③ 真正 darkness fog shader + 距离剔除 Object3D label | laundry/breakfast/night task 定义 + Scene3D shader postprocessing | 高：需要平衡与设计资源，不建议复赛前做 | 关 3/4/5 每关各有至少 1 个 D(1) 扰动 + 1 D(k) 轨迹需要，并且记忆不使用会超时或错误次数过多而失败（失败率 >30% 才算真的需要记忆）|

> **注**：P0 ≤ 5 项，严格优先排序（1 > 2 > 3 > 4 > 5）。没有 P0 全部通过之前，不进入 P1/P2/P3。

---

## 十、最终结论（只答 4 问）

### 1. 当前游戏完成度大约处于什么阶段？
**Vertical Slice Alpha（功能骨架齐备，核心玩法验证不足）。**

- 五关任务系统、状态机、HUD、Probe、Result、Session JSON 导出 全部 「能跑」（17 子系统中：12 implemented + 4 partial + 1 broken=0，§1）
- 自动化门禁 test/lint/build/qa/chromium E2E 全部绿色；
- **但**：真实 3D 交互（WASD+鼠标+3D 拾取）未自动化通过（P0-1）；关 2 核心记忆循环未绑定"记忆保存前置条件"（P0-2）；记忆≠通关（§3 全部 confirmed）。
- 完成度类比：**工程正确性 80% / 游戏好玩 30–40% / 研究有效 20–25%**。

### 2. 当前记忆系统是核心玩法、辅助玩法，还是展示功能？
**主要是「辅助 + 展示功能」；尚未成为完成任务所必要的核心能力。**

- 状态与 UI：save/update/lock/slot/expire/confidence/type 等 14/16 项已 implemented（§2），对 Score/Combo/Probe Answer Accuracy/MEM-07 诊断/Title 均有影响；
- 但是：§3 confidence=confirmed 结论——**五关全部可以不按 E、不锁、不更新记忆直接通关**；goal.predicate 不依赖记忆槽；§4 leave-home 循环有 3 条 bypass 路径（先拿钥匙、快速完成 step<=2、或不在客厅直接搜）。
- 玩家信息获取来源：简报/物体标签/容器 targetLabel/方向指示/手机铃声 toast > HUD 记忆槽的信息增益 ≥ 4:1（hypothesis，§7.5）。
- **一句话**：记忆系统有完整的机制，但在当前关卡内容 + UI 暴露强度下 **≈评分/探针装饰 + 未来预留接口**。

### 3. 是否现在适合加入 D(0)/D(1)/D(k)？
**只适合做「D(0) 基线 + 日志字段级 D(1) 预留」；不适合立即加入真实 D(k) 实验条件。**

- 适合现在：
  - D(0)：五关所有阶段，完全可跑（§5.1 多数段落在 D(0)）。
  - 日志字段（seed / condition / lock event / step entity snapshot + pose + activeGoalId）：P2-7 只需加写入，不改玩法 → 应立即预留。
- 尚不适合：
  - D(1) 关 2：必须先修 P0-2（触发前置记忆保存 + fallback 不跳过）+ P0-4（降低标签），再运行「intact vs stale」对照实验才有用；
  - D(k)：night-patrol/laundry/breakfast 需真实扰动/黑暗/流程重置；属于「改变玩法」，当前不改不做。

### 4. 下一轮应该执行哪个最小 Sprint？
**执行 Sprint A.2（Minimal Gate Sprint，范围 = P0 1–5，预计 1–2 天工作量），不启动 Sprint B。**

- 目标 1：跑通 headed arena-smoke（或记录人工 Gold Path 10 项签字+日期）；
- 目标 2：修复关 2 钥匙猫前置条件（含 fallback step>=12 保底）；
- 目标 3：加入「记忆徽章」（非完成判定，仅 result 标注）+ P0-4 简报/Target Label 距离最小化降低；
- 目标 4：预留 seed/condition + lock action event（少量字段，不做实体快照每步只在研究条件）。

**不做**：关 3/4/5 新事件、3D 重构、真黑暗、大 HUD 重设计、大规模平衡性调节。

> 只有当 P0-1 ~ P0-5 全部达成，才允许进入下一个 Sprint（建议命名 Sprint B：Semifinal Demo Polishing & D(1) First Experiment，进入条件为本报告 §11 P0 全部 OK）。

---

### 文件引用（所有结论均基于以下实际代码位置）

- 关键状态：[useGameStore](../src/store/useGameStore.ts) / [taskSlice](../src/store/slices/taskSlice.ts) / [memorySlice](../src/store/slices/memorySlice.ts) / [chaosSlice](../src/store/slices/chaosSlice.ts) / [entitySlice](../src/store/slices/entitySlice.ts) / [useSessionStore](../src/store/useSessionStore.ts)
- 任务：[index.ts](../src/data/tasks/index.ts) / [clean-table.ts](../src/data/tasks/clean-table.ts) / [leave-home.ts](../src/data/tasks/leave-home.ts) / [laundry-sort.ts](../src/data/tasks/laundry-sort.ts) / [breakfast.ts](../src/data/tasks/breakfast.ts) / [night-patrol.ts](../src/data/tasks/night-patrol.ts)
- 游戏逻辑：[commands.ts](../src/game/commands.ts) / [flow.ts](../src/game/flow.ts) / [scoring.ts](../src/game/scoring.ts) / [memorySlots.ts](../src/game/memorySlots.ts) / [interactionTargets.ts](../src/game/interactionTargets.ts)
- 页面与组件：[HomePage.tsx](../src/pages/HomePage.tsx) / [TaskSelectPage.tsx](../src/pages/TaskSelectPage.tsx) / [ProbePage.tsx](../src/pages/ProbePage.tsx) / [ResultPage.tsx](../src/pages/ResultPage.tsx) / [HUD.tsx](../src/components/arena3d/HUD.tsx)
- AI 分析与 E2E：[analyzeSession.ts](../src/ai/analyzeSession.ts) / [first-level-command-flow.spec.ts](../tests/e2e/first-level-command-flow.spec.ts) / [playwright.config.ts](../playwright.config.ts)
