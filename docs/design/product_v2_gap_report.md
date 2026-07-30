# Product V2 Gap Report

范围：Product Definition V2 + 研究契约 + 四层状态模型 + 指标体系 vs 当前 HEAD = 5de8037
方法：以源码为证据，不根据注释和推断；缺失项标 MISSING / PARTIAL / IMPLEMENTED / NOT_NEEDED_FOR_SEMIFINAL

---

## 0. 导航

1. 四层状态模型 Gap（True World / Belief / Task Subgoal / Session Trace）
2. 研究契约逐项 Gap（24 项 Session 清单 + 复赛 MVP 9 条）
3. 指标体系 Gap（A 游戏结果 / B 长程 / C 记忆 / D 操作 / E 空间）
4. 三关能力阶梯专属 Gap（L1/L2/L3 各关硬问题）
5. 比赛评分对齐 Gap（30/30/20/20 四维度）
6. 总 Top-5 实现差距（给 V2 最终摘要用）
7. spatial_validity_status 的类型 Gap（本轮不改代码，仅列出接入计划）

---

## 1. 四层状态模型 Gap

真值源/实现文件/写入者/消费者/持久化/结果分析/当前状态/V2 目标

### 1.1 L1 True World State

| 子项 | 当前状态 | 证据 | V2 目标 |
|---|---|---|---|
| robotPosition (world) | IMPLEMENTED | `FirstPersonControls` L561 写 `useGameStore.setState({ robotPosition })`；SaveData L12 saveSystem.ts | 保持；加 spatial validity QA 确认不被隐形碰撞推挤 |
| entities（9 个 objects L2 / 7+ L1 / 9 L3） | IMPLEMENTED | taskSlice L158 entities 初始化；commands.ts pick/place 更新 position/placedIn/status；saveSystem L15 持久化 | 保持 |
| containerStates（open / containedIds） | IMPLEMENTED | taskSlice L138-L156 初始化；commands.ts open/pick/place 修改 `containedIds`；SaveData L16 持久化 | 保持 |
| currentRoom + visitedRooms | IMPLEMENTED | `executeRoomTransition` 写 currentRoom（FirstPersonControls L583）；SaveData L14/L20 | 保持 |
| elapsedMs + stepCount | IMPLEMENTED | progressSlice / tickElapsed 更新；SaveData L18/L19 | 保持 |
| heldEntityId（手持 1 限制） | IMPLEMENTED | commands.ts pick/place 切换；saveSystem L17 | 保持 |
| decorFurniture 坐标正确性（room-local） | PARTIAL | collision L263 约定 room-local；Bedroom 10/10 错（见 Fact Check B.3） | **P2 Bedroom 必改** |
| Room3D 视觉 ↔ DF 碰撞一致性 | PARTIAL | Living 10/14 错位（Fact Check D.1）；Entrance 8/8 OK；Bedroom 全错位（因为 DF 飞出） | **P2 Living/Bedroom/Entrance 分房修复** |
| 唯一视觉所有权（TC ↔ Room 视觉一一对应） | PARTIAL | Entrance 托盘 ×2（Room L102 + TC L188）；伞架 ×2（Room 装饰伞 L67 + TC L177）；Living 茶几外壳 + Container ×2；Bedroom 右床头柜 visual ×1 vs TC 另一个位置完全不重合 | **P2 Living/Bedroom/Entrance 修复** |
| 纯 XZ 碰撞 ↔ 扁平物体 | PARTIAL | entrance tray size.y=0.1 仍会挡路（纯 XZ circleRect 不看 y）；挂画/挂钟 depth=0.05 但 XZ footprint ≤ radius 被认为不会挡 → DF 数据没问题；但 tray 属于 task container，应确认 entrance TC tray 的 XZ 不挡关键路径 | **P2 Entrance 处理 tray 位置（挡门洞风险）** |
| 关键路径无 DD（家具挡门） | PARTIAL | Fact Check D.2 #9：Bedroom 书架 x=-4.6 z=1.0 → DF 修正后 DD=Yes（挡住 living→bedroom 门洞北侧） | **P2 Bedroom 书架北移 z +1** |
| TaskContainers 有可见视觉 | PARTIAL | cnt-nightstand 在 bedroom 不可见（TC 在 (-7.5,0.8)，Room visual 在 (-6.5,-1.5)，完全两个位置 → TC 视觉是 Container3D，但"空地上一个抽屉柜"没有视觉归属） | **P2 Bedroom 对齐 TC ↔ Room visual** |
| Scene Graph（L1 未来语义视图） | KEEP_FROZEN · NOT_NEEDED_FOR_SEMIFINAL | sceneGraph.ts 存在，但生产 0 调用（Grep 仅 test 文件）；不管理 L1 真坐标；不驱动碰撞；不影响记忆过期 | 保持 KEEP_FROZEN；待至少 2 个 consumer 再 GO |

### 1.2 L2 Belief / Memory State

| 子项 | 当前状态 | 证据 | V2 目标 |
|---|---|---|---|
| Save + Update 写 memorySlots | IMPLEMENTED | memorySlice.saveMemory / updateMemory；SaveData L21 saveSystem.ts memorySlots 持久化；槽数默认 3（DEFAULT_LEVEL_BALANCE.memorySlotCount=3，唯一事实源） | 保持；槽数默认 3 是硬事实，不再引用默认 4 |
| markMemoryOutdated（过期触发） | IMPLEMENTED | memorySlice.markMemoryOutdated；triggerScriptedEvents（L2 se-cat-pushes-key 触发）写入 | 保持；**P3 强化 HUD 过期视觉** |
| decayMemories（时间衰减） | IMPLEMENTED | memorySlice.decayMemories；flowSlice.updateFlowState 每 tick 调 decay | 保持 |
| MemoryEntry 结构（id / content / memoryType / createdAt / entityId / position? / outdated / strength） | IMPLEMENTED | `src/types/memory.ts` MemoryEntry 定义；totalMemories L16 在 metrics 聚合 | 保持 |
| MemoryEntry memory_type 写入 trace | PARTIAL | MemoryEntry.memoryType 有字段，但 Session `memory_updates` L137 直接存 MemoryEntry[]。检查：是否在 write event 时对每个 encode 显式标注 procedural / spatial / temporal / object？commands.ts 的 saveMemory 是否对不同 object 显式指定？ | **P5 最小研究契约：加 memory_type 在 memory write trace** |
| overwrite（覆盖）vs save（新槽）决策记录 | MISSING | memorySlots 满时的覆盖/放弃选择事件未在 Session.events 记录（只有 saveMemory event，看不到"覆盖哪条旧槽"） | P5 补 coverage / override event |
| memory updates 的时间戳（过期→更新→再过期） | PARTIAL | MemoryEntry.createdAt 有；MemoryEntry.outdated 有；更新到新槽时是否保留旧槽 id？当前可能直接覆盖旧槽 entry，丢失 "哪条旧槽被替代" 链路 | P5 补 update-to 关联（旧槽 id → 新槽 id，可在 MemoryEntry 加 predecessorId 或 event 记录；不强制 schema 改动） |
| memory invalidations（哪些 scripted event 导致哪些 memory 过期） | PARTIAL | markMemoryOutdated 触发后写入 outdated=true；但 session 中"过期与 scripted_event 的关联"只在时间戳接近时推断，无直接 event 关联 id | P5 最小契约：outdated event 加 causedByEventId（非强制，可后处理） |

### 1.3 L3 Task / Subgoal Graph

| 子项 | 当前状态 | 证据 | V2 目标 |
|---|---|---|---|
| stages (id / playerObjective / entryCondition / completionCondition / nextStage) | IMPLEMENTED | `src/types/task.ts` StageSpec；flow.ts evaluateStageTransitions 每 tick 调 | 保持 |
| goals（id / predicate / achievedMessage / memoryType / relatedObjectIds） | IMPLEMENTED | `src/types/task.ts` GoalSpec；flow.goals 评估；achievedGoalIds 持久化 SaveData L27 | 保持 |
| stage 切换事件 | PARTIAL | 在 Session.events 是否显式写 STAGE_TRANSITION？（需查 useSessionStore / ArenaPage tick 写出实现）Session.session.ts 中 outcome_metrics / scripted_events 有，但 subgoal milestones 无独立数组 | **P5 最小契约：新增 subgoal_milestones[] 或 events 明确 stage_change** |
| Encode (E) / Pick (F) / Place (F) / Verify / Update 5 类事件 | PARTIAL | commands.ts 有 command:pick/place/open/save_memory 等写 events；但"Verify"没有独立事件（只能用 probe 或 observations 间接推断）；Update 即 saveMemory 的二次写 | P5：为 Verify（markMemoryOutdated 后重新观察）增加弱事件（可从 observations + outdated 组合后处理） |
| stage objective ↔ predicate 一致（SV7） | PARTIAL | L1：用户指令 §五 明确标记"先要求记忆存在，但 scriptedEvents 中先提示 F 拾取，再提示 E 保存"（顺序倒置）→ objective 文字 predicate 语义矛盾 | **P1 L1 教学闭环修复** |
| 子目标完成绝对时间 | IMPLEMENTED（可从 achievedGoalIds + step/timestamp 后处理） | flow.advanceStage 时间戳 + achievedMessage 写入时间 | P5 补子目标完成时间数组（goal_achieved_times[]，便于分析） |
| subgoal 依赖图（先 stage X → 再 Y 等） | IMPLEMENTED（任务 stages 数组 + nextStage DAG） | leave-home 4 stages；clean-table N stages；laundry-sort 4 stages | 保持 |

### 1.4 L4 Session Trace

| 子项 | 当前状态 | 证据 | V2 目标 |
|---|---|---|---|
| SessionData 根结构（114–154 types/session.ts） | IMPLEMENTED（22 根字段） | id / episode_id / taskId / scene_id / status / events / memories / metrics / failureReasons / policySuggestions / aiSummary / agent_pose_trace / camera_pose_trace / observations / visible_objects_per_step / actions / object_state_changes / container_state_changes / memory_updates / scripted_events / probe_questions / probe_answers / outcome_metrics / failure_modes / ai_research_annotation | 保持 |
| events[]（SessionEvent 命令） | IMPLEMENTED | commands.ts 写 event；SessionData.events L124；actions L134（可能重复） | 保持；**P5 清理重复（actions 是否 events 子集？若子集则可保留但标 deprecated）** |
| pose trace（agent + camera） | IMPLEMENTED（agent_pose_trace L130; camera_pose_trace L131，含 timestamp/x/y/z/rotation） | ArenaPage / session store tick；FirstPersonControls 触发 | 保持；P5 统一采样率（当前可能非固定 30Hz，看实现） |
| observations[]（可见物体/容器） | IMPLEMENTED | L132 observations with visibleObjectIds/visibleContainerIds | 保持；可后处理出首次看到/最后看到目标物时间 |
| object_state_changes[] | IMPLEMENTED（70–76）：timestamp/step/objectId/configId/property/old→new | pick/place/status 写 change events | 保持 |
| container_state_changes[] | IMPLEMENTED（78–85） | open/close/containedIds 变化写 change | 保持 |
| memory_updates[] | IMPLEMENTED（L137 MemoryEntry[]） | memory_slice 写 updates | 保持（配合 §1.2 memory_type 补强） |
| scripted_events[] | IMPLEMENTED（L138 ScriptedEventRecord id/timestamp/step/type/description/affectedEntityIds） | triggerScriptedEvents 写出 | 保持 |
| probe_questions / probe_answers | IMPLEMENTED（L139-L150 含 response_time/isCorrect/memoryType/relatedObjectIds/relatedEventIds） | ProbePage + ProbeSequence | 保持 |
| failure_modes[] + failureReasons[] | IMPLEMENTED（L96-L102 / L32-L36） | scoring / flow 失败分类 | 保持 |
| ai_research_annotation（AIResearchAnnotation L104-L112） | IMPLEMENTED（task_type/difficulty_level/memory_types_tested/scenario_summary/key_challenges/suggested_robot_policy） | analyzeSession 或 start session 写 | 保持 |

---

## 2. 研究契约逐项 Gap（24 项清单 + MVP 9 条）

逐项按用户指令 §七 24 条清单。

### 2.1 24 项清单

| 编号 | 字段 / 需求 | 当前状态（I/P/M/N） | 证据 / 在 SessionData 中的位置 |
|---|---|---|---|
| R-01 | schema_version | **MISSING** | SessionData 114–154 中无该字段；SaveData 无；ResultPage 无版本号 |
| R-02 | app_version | **MISSING** | 同上；package.json 有 version 但 Session 中未写 |
| R-03 | task_version | **MISSING** | tasks 无 version；taskSlice 初始化时无版本元数据 |
| R-04 | scene_version | **MISSING** | rooms / decorFurniture 无 version；Room3D.tsx / decorFurniture.ts 无结构版本字段 |
| R-05 | seed | **MISSING（复赛允许二选一，禁止伪 Seed 中间方案）** | reproducible seed 定义：只有同时满足以下三点才能称为 seed：（1）**独立 seed 字段**进入 Session 类型；（2）**所有随机机制消费同一个 seedable RNG**（猫事件触发 / 衣物扰动 / 时间扰动等不得混用 Math.random 或 step 阈值）；（3）**相同 task_version + scene_version + seed + command_sequence 能复现状态演变**。**复赛允许选择 A/B，禁止任何伪 Seed 中间方案：** A = **NOT_NEEDED_FOR_SEMIFINAL**（保持当前确定性 step / state 触发，不引入 seed 字段）；B = 完整实现 reproducible seed 三条件。**严禁**：用 `Date.now() + random` 在 session start 时写入一次当 seed；把随机 UUID 的 session id 改名叫 seed；"写一个随机数字"就声称"任务可复现"。当前三条均不满足：无 seed 字段；无 seedable RNG；猫事件 / 衣物扰动基于 step 阈值触发、不基于 seed 随机。 | **MISSING（不得声称可复现；复赛选方案 A 则 seed 字段不必存在但文档要标 NOT_NEEDED_FOR_SEMIFINAL）** |
| R-05-注 | （不能把随机 UUID 的 session id 当 seed，不得把 step 触发当作"可复现"，禁止 Date.now()+random、session id、手写随机数等伪 seed 中间方案） | 用户约束 §四 §八 P0.2 | 不满足 reproducible seed 三条件前，对外不得写"session seed 用于可复现实验"。复赛选方案 A 则在文档中明确 seed=NOT_NEEDED_FOR_SEMIFINAL。 | MISSING（实际状态） |
| R-06 | condition_id（实验条件 ID） | **MISSING** | 3 个任务 × 公开 scope default 只有 1 条件，未标 'default-public-scope' |
| R-07 | commands（玩家命令 trace） | **IMPLEMENTED**（events L124 + actions L134 双写，可过滤出 command:*） | commands.ts command:* events |
| R-08 | observations（观察记录） | **IMPLEMENTED**（observations L132 + visible_objects_per_step L133） | L55-L66 Observation interface |
| R-09 | pose trace | **IMPLEMENTED**（agent_pose_trace L130 + camera_pose_trace L131） | 4-vector 每帧/每 tick 采样 |
| R-10 | object state changes | **IMPLEMENTED**（L135 object_state_changes[]） | L68-L76 ObjectStateChange |
| R-11 | container state changes | **IMPLEMENTED**（L136 container_state_changes[]） | L78-L85 ContainerStateChange |
| R-12 | memory writes（编码入记忆） | **PARTIAL**（memory_updates L137 有，但"首次写入" vs "覆盖"无区分；memory_type 未显式关联） | MemoryEntry 写 memorySlice.saveMemory → memory_updates |
| R-13 | memory updates（更新旧记忆） | **PARTIAL**（同 R-12） | memorySlice.updateMemory → memory_updates |
| R-14 | memory invalidations（过期标记） | **PARTIAL**（MemoryEntry.outdated 有，但 caused_by_scripted_event 关联无字段） | markMemoryOutdated → outdated flag |
| R-15 | scripted events | **IMPLEMENTED**（scripted_events L138） | L87-L94 ScriptedEventRecord |
| R-16 | subgoal milestones | **PARTIAL**（achievedGoalIds + stepCount + elapsedMs 可后处理，但无显式 goal_achieved_times[]；stage 切换 events 未显式写） | SaveData.achievedGoalIds L27 |
| R-17 | terminal state（in-progress/completed/failed/aborted） | **IMPLEMENTED**（status L123，类型 SessionStatus L5） | L5 type SessionStatus |
| R-18 | probe answers（含反应时间） | **IMPLEMENTED**（probe_answers L150：response_time L51 + isCorrect L52） | L44-L53 ProbeAnswer interface |
| R-19 | reaction times（除 Probe 外的首次反应：F/E 按键 latency 等） | **MISSING** | probe 有；其它命令的 reaction_time 与 observations 无显式绑定（可从 agent_pose_trace + command events 的时差推断，但无字段） |
| R-20 | analysis_version（结果页计算版本） | **MISSING**（ai_research_annotation 无 version，metrics 无计算版本） | L7-L30 SessionMetrics 无 version 字段 |
| R-21 | spatial_validity_status（research-valid / invalid / not-audited） | **MISSING**（本轮不新增类型） | §7 详述 |
| R-22 | heldObjectId 变化（手持 1 限制的显式 trace） | **PARTIAL**（observations L62 heldObjectId 每 observation 含，可 diff 出 change 事件；但无单独 held_change event） | Observation.heldObjectId L62 |
| R-23 | stepCount / elapsedMs / roomTransitions / repeatedSearchCount 等 summary | **IMPLEMENTED**（metrics L7-L30 SessionMetrics 25 个字段） | durationMs/stepCount/roomTransitions/repeatedSearchCount/probeAccuracy/goalsAchieved/.../actionSuccessRate L29 |
| R-24 | wrongPlacements / containerMistakes / memoryError 等失败归因 | **IMPLEMENTED**（metrics L23-L25 wrongPlacements/containerMistakes/missedCleanupSteps；FailureReasons L32-L36 6 类） | failureReasons.category L33 |

### 2.2 复赛 Minimum Viable Research Contract 9 条

| 编号 | MVP 条目 | 当前状态 | 对应 R- 编号 | 最小改动路径（P5） |
|---|---|---|---|---|
| MVP-01 | task / scene / build 版本号 | MISSING | R-01–R-04 | session start 时写入：schema_version=1，app_version=package.json.version，task_version=task.id+taskHash，scene_version=roomDecorHash |
| MVP-02 | session seed（reproducible seed 三条件） | **MISSING**（不得把 session id 或 step 触发近似当作可复现 seed） | R-05 | P5：session 加 seed 字段 + 引入 seedable RNG（mulberry32 / alea 等）+ 所有 scriptedEvents 触发条件接入同种子 RNG；当前不得写 "可复现"。 |
| MVP-03 | 玩家命令 + 状态变化 trace | IMPLEMENTED | R-07,10,11,22 | 保留；P5 文档标注 commands 从 events 提取 |
| MVP-04 | 记忆写入 / 过期 / 更新 trace | PARTIAL | R-12–14 | memory_updates 补 memory_type + overwrite_flag + outdated_caused_by_event_id |
| MVP-05 | 关键环境扰动 | IMPLEMENTED | R-15 | scripted_events 保持 |
| MVP-06 | 子目标完成时间 | PARTIAL | R-16 | goal_achieved_times: { goalId, timestamp }[] 新增（可从 achievedMessage + 事件时间戳，不在本轮改 schema） |
| MVP-07 | Probe（问题 + 答案 + 反应时） | IMPLEMENTED | R-18 | probe_questions + probe_answers 保持 |
| MVP-08 | 可解释结果指标 | IMPLEMENTED | R-17,23,24 | metrics + failureReasons + PolicySuggestions 保持 |
| MVP-09 | Spatial Validity 人工验收记录 | MISSING（本轮不加字段） | R-21 | 随 session 下载 / 上传额外的 QA checklist JSON，不入 SessionData；ResultPage 只展示"本 session QA 签过名"徽标 |

复赛 MVP 9 条现状：**3 IMPLEMENTED / 4 PARTIAL / 2 MISSING**（MVP-07: Yes IMPLEMENTED；MVP-01~02/04/06 需 P5；MVP-09 先不入 Session 类型用附件）

---

## 3. 指标体系 Gap（A–E 五大类）

每个指标：当前已有？来源？需新增采集？展示给谁？（玩家 / 仅研究 QA）

### A. 游戏结果类（6 项）A1–A6

| ID | 指标 | 已有？ | 原始事件 / 来源 | 需新增采集？ | 展示？ |
|---|---|---|---|---|---|
| A1 | Completion Rate（是否通关） | ✓ Yes | metrics.status L123 terminal state + goalsAchieved==goalsTotal L13/14 | No | 玩家页（MetricCards "是否完成"） |
| A2 | 总耗时 durationMs（秒） | ✓ Yes | SessionMetrics L8 durationMs | No | 玩家 |
| A3 | 目标完成率 goalsAchieved / goalsTotal | ✓ Yes | L13/L14 | No | 玩家 |
| A4 | 失败分类（wrong-container/missed-object/forgot-location/sequence-error/timeout/memory-error） | ✓ Yes | failureReasons L32-L36 category 6 类 | No | 玩家 FailureBreakdown |
| A5 | 失败次数 failure_modes（type/description/relatedEntities） | ✓ Yes | failure_modes L96-L102 | No | 玩家 + QA |
| A6 | 是否在 spatial validity 七条件下运行 | **MISSING**（附件，不入类型） | MVP-09 QA checklist 附件 | 人工采集 | 仅研究 / QA；玩家页只给 QA-PASS 徽标 |

### B. 长程任务类（6 项）B1–B6

| ID | 指标 | 已有？ | 来源 | 需新增？ | 展示？ |
|---|---|---|---|---|---|
| B1 | 房间切换次数 roomTransitions | ✓ Yes | SessionMetrics L10 | No | 研究 + 玩家（可隐藏在高级面板） |
| B2 | 最大子目标间隔 longestGoalGapMs | ✓ Yes | L28 | No | 研究 |
| B3 | 子目标完成时间（逐个 goal） | PARTIAL | §2.2 MVP-06（后处理） | P5 可聚合 | 研究 |
| B4 | 阶段切换时间 stage_transition_times | PARTIAL | events 推断 | P5 显式 | 研究 |
| B5 | 环境扰动（scripted events）命中数 / 触发率 | ✓ Yes | scripted_events L138.length + type 分组 | No | 研究 |
| B6 | 扰动→完成恢复时间（disturbance→recovery_ms） | PARTIAL | scripted timestamp → 下一次 achieved goal timestamp（后处理） | 可后处理 | 研究 |

### C. 记忆策略类（8 项）C1–C8

| ID | 指标 | 已有？ | 来源 | 需新增？ | 展示？ |
|---|---|---|---|---|---|
| C1 | 总记忆数 totalMemories | ✓ Yes | L16 | No | 玩家 |
| C2 | 记忆命中类型 precision（spatial/object/temporal/procedural Accuracies） | ✓ Yes | L17-L20 spatialAccuracy/objectAccuracy/temporalAccuracy/proceduralAccuracy | No | 玩家 |
| C3 | 记忆过期次数（memory invalidations） | PARTIAL | memory_updates.filter(m.isOutdated).length 或 markMemoryOutdated 触发次数事件 | P5 显式计数 | 研究 |
| C4 | 过期→更新转化率（outdated_to_updated_rate） | PARTIAL | 后处理 memory_updates + memory_entry predecessor 关联 | P5 predecessor 弱关联 | 研究 + ResultPage PolicySuggestions |
| C5 | 重复搜索 repeatedSearchCount | ✓ Yes | L11 | No | 研究（玩家 MetricCards 有？） |
| C6 | 保存记忆 vs 首次拾取顺序（firstSaveBeforeFirstPick） | **MISSING** | 后处理：saveMemory 时间戳 vs first pick 时间戳 | 可后处理 | 研究 / L1 教学 QA |
| C7 | 覆盖记忆占比 overwrite_ratio（槽满时覆盖的比例） | **MISSING**（§1.2） | events 补 override/coverage 事件 | P5 | 研究 |
| C8 | Probe 准确率 + 平均反应时 probeAccuracy / avgProbeReactionTime | ✓ Yes | L12/L15 | No | 玩家 + 研究 |

### D. 操作行为类（9 项）D1–D9

| ID | 指标 | 已有？ | 来源 | 需新增？ | 展示？ |
|---|---|---|---|---|---|
| D1 | 总命令数 totalActions | ✓ Yes | L21 totalActions | No | 玩家 |
| D2 | 命令成功率 actionSuccessRate | ✓ Yes | L29 | No | 玩家 |
| D3 | 错误放置 wrongPlacements | ✓ Yes | L23 | No | 玩家 FailureBreakdown |
| D4 | 容器错误 containerMistakes | ✓ Yes | L24 | No | 玩家 |
| D5 | 不必要重访 unnecessaryRevisits | ✓ Yes | L22 | No | 研究 |
| D6 | 漏清理步骤 missedCleanupSteps | ✓ Yes | L25（L1 用） | No | 玩家 FailureBreakdown（L1） |
| D7 | 手持占用切换 held_switch_count | PARTIAL | observations.heldObjectId（L62）diff 出来 | 可后处理 | 研究 |
| D8 | 非必要拾取-再放回 pick_then_place_same_id（来回搬运） | **MISSING** | object_state_changes (pick→place same container target) 可后处理 | 可后处理 | 研究 |
| D9 | 交互反应时 time_to_first_F_on_object（看见→首次按 F 时长） | **MISSING**（§2 R-19） | observations.first_visible_timestamp - first_F_command_timestamp - reaction_time（需结合 events+observations+pose） | 可后处理（R-19 MVP 可暂跳过） | 研究 |

### E. 空间有效性类（候选 QA 人工指标，本轮不自动采集，不加入 Session 类型）

| ID | 指标 | 自动？ | 人工采集来源 | 用途？ | 展示？ |
|---|---|---|---|---|---|
| E1 | blockedRouteCount（家具/隐形碰撞挡关键路径的次数） | No（人工） | 真人走查 checklist（每次 DD / 隐形墙 1 次） | QA，spatial validity Gate 条件 1/5 | QA / 研究 |
| E2 | visualCollisionMismatchCount（视觉 ↔ 碰撞错位件数，ε > 0.2 XZ m） | No | 真人走查 / DF vs Room3D 逐件 diff（Living D.1 10 件错位即 10） | Gate 条件 4 | QA / 研究 |
| E3 | duplicateTaskVisualCount（同语义任务家具双份件数） | No | Fact Check D：D.1 茶几双份；D.2 床头柜不重合；D.3 托盘×2 + 伞架×2 = 合计 4 件双份 | Gate 条件 3 | QA / 研究 |
| E4 | failedInteractionAtVisibleTarget（"看得见的 F 圈/容器，按 F 无反应"次数，若实际是 TC 错位） | No | 真人记录（Bedroom cnt-nightstand 典型 bug：D.2 #8 OT 核心 bug → 失败次数 ≥ 1/1） | Gate 条件 2/3 | QA / 研究 |
| E5 | spatialSoftlockCount（因手持/路径/容器错放，进入无法继续的状态 ≥ 30 秒且无恢复） | No | 真人记录（若 P2/P3/P4 修复 hand 限制恢复路径则为 0） | Gate 条件 5 | QA / 研究 |
| E6 | Debug / 瞬移使用标志 | Yes（但当前是否有？e2eTestApi 中 setRobotPosition 仅测试用） | e2e API 调用日志；正常玩家路径不会用 | Gate 条件 6 | QA / 研究 |
| E7 | stage_objective ↔ predicate 不一致计数 | Yes（单关 L1 已知倒置 1 条，§五 G-L1-1） | 阶段 text 与 completionCondition diff | Gate 条件 7 | QA / 研究 |

**E 类结论：**全部 7 指标属于 Spatial Validity QA 人工验收 Checklist（MVP-09 附件），不在本轮进入 Session 类型，不采集自动字段。

---

## 4. 三关能力阶梯专属 Gap（L1 / L2 / L3）

| 关卡 | Gap 编号 | Gap | 严重度 | 对应工作包 |
|---|---|---|---|---|
| L1 clean-table | G-L1-1 | 教学顺序倒置：先 F 再 E 的 dialog/objective 与 predicate 不一致 | 中高 | P1 L1 教学闭环 |
| L1 clean-table | G-L1-2 | 新手不懂记忆槽 UI（E 作用不清） | 中 | P1 |
| L1 clean-table | G-L1-3 | 手持 1 限制 + 目标近 → 玩家"先拿再记"绕过 E 训练闭环 | 中 | P1（增加轻微惩罚或引导） |
| L1 clean-table | G-L1-4 | Dining 无 spatial validity audit（DF/Room/TC） | 低 | P1 前置小 audit |
| L2 leave-home | D.1 Living SV | DF 10/14 错位 + 茶几×2 visual | 高 | P2 Living |
| L2 leave-home | D.2 Bedroom SV | DF 10/10 全飞 + TC 错位 + 门口书架 DD | 极高 | P2 Bedroom |
| L2 leave-home | D.3 Entrance SV | 托盘×2 + 伞架×2 + 浅托盘碰撞挡门洞 | 极高 | P2 Entrance |
| L2 leave-home | G-L2-1 | Golden Path 的"存→不拿→去拿手机/伞"玩家自然触发比例过低（玩家先拿钥匙绕） | 中（看 P3） | P3 认知闭环（文字引导 / 提示） |
| L2 leave-home | G-L2-2 | 猫事件后记忆过期视觉不明显 → 玩家以为是 bug 而非记忆过期 | 中高 | P3 HUD 过期视觉 |
| L2 leave-home | G-L2-3 | 手持 1 限制下，拿了伞后无法回 living 立即拿钥匙 → 玩家需先把伞放到托盘，但 TC 托盘（西北角）动线与 "living 查钥匙"动线冲突 | 中 | P2 Entrance（托盘位置统一到门洞旁，与 living↔entrance 动线一致即可缓解） + P3 引导 |
| L3 laundry-sort | G-L3-1 | 已放置物体能否再 pick 回手持？错类别放时 executePlace 是否拒绝（heldEntityId 是否保留）？放对容器后又想取回是否允许？——**目前仅标记为待核查假设，不规划新增 L3 专属取回命令**，P4 核实现状后确认为 bug 再修。 | 高（阻塞 P4 恢复审查） | P4 前置 commands + pickEntity 行为验证 |
| L3 laundry-sort | G-L3-2 | 槽 3 vs 9 件物 3 列分区 → S3 全抓派无需工作记忆（先 x=-3 拿完、x=0 拿完、x=+3 拿完即可）→ 预算压力可能未真正出现。 | 中 | P4 真实玩家策略观察后再决定是否轻量打散 |
| L3 laundry-sort | G-L3-3 | 真正 move 扰动只 3/9 件（白袜 step5、小方巾 step9、黑袜 step13）；se-baskets-swapped 仅 message 不实际 swap；白/深 6 件不动 → 玩家可先完成不动的 6 件绕过记忆压力。 | 中 | P4 后处理玩家数据观察后再评估扰动强度 |
| L3 laundry-sort | G-L3-4 | 神秘衬衫初始即存在（不是脚本事件生成），色粉但 category=white-clothes；Probe 全在任务结束后发生（无游戏中 Probe 补记忆路径）。 | 中高 | P4 briefing 明示类别规则或观察标签；不改 S4 Probe 游戏中策略（不存在） |
| L3 laundry-sort | G-L3-5 | Laundry 房间无 spatial validity audit（DF/Room/TC/挡门）。 | 低 | P4 前置 laundry audit |
| L3 laundry-sort | G-L3-6 | Probe `p-count-white` correctAnswer='3'，但 whiteAllPlaced(ctx) 实际 id=4（含 obj-mystery-shirt）→ Probe 题与判定不一致，属 SV7。 | 高（SV7） | P4/P5 修复 Probe（不改代码，先列 gap） |

---

## 5. 比赛评分对齐 Gap

产品 30 / 技术 30 / 实用 20 / 创新 20。

### 5.1 产品完成度 30（当前估算基线 12–16 / 30）

| 子维度 | 当前 | V2 目标路径 | Blockers（Top） |
|---|---|---|---|
| 产品文档完整 | ~7/10（有旧 PRD，V2 新文档刚写入） | P0 5 份 docs → 10/10 | — |
| 教学与上手 | 3/10（L1 顺序倒置，新手不清楚 E 作用） | P1 通过 → 8.5/10 | G-L1-1 / L1-2 |
| 三关可达性与稳定性 | 2/10（L2 三关 SV 双份/错位/DD 严重） | P2 三房间分房通过 → 9/10 | D.1/D.2/D.3 SV（Living/Bedroom/Entrance） |
| 复盘可解释 | 0/10（无认知时间线，仅有 failure breakdown + metrics cards） | P6 Timeline 通过 → 8/10 | P5 契约 / P6 Timeline |

主要 Blockers：L1 教学；L2 SV；P6 复盘时间线。

### 5.2 技术实现 30（基线 18–22 / 30）

| 子维度 | 当前 | V2 路径 | Blockers |
|---|---|---|---|
| 四层状态模型一致 | 7/10（I 大量字段已实现，但 L1 True World SV 不一致；Belief 的 memory trace 缺少数项） | P2 SV + P5 契约补齐 → 9.5/10 | D.2 Bedroom DF / §1 memory trace 补强 |
| 数据契约 & 研究采集完整性 | 5/10（MVP-09 中 3 条全有，但 2 MISSING + 4 PARTIAL） | P5 9 条齐全 → 9/10 | §2 R-01–06 / 12–14 / 16 / 19 / 20 / 21 |
| 稳定性 + 测试覆盖 | 6/7（321 tests 通过，e2e Playwright？） | 保持 + P7 回归 → 7/7 | — |
| 代码一致性与复用 | 3/3（已有管道 FirstPersonControls/commands/flow/memory 复用 OK，没有两套家具碰撞，SceneGraph 不激活） | 保持 | — |

主要 Blockers：§2 研究契约 MVP 补齐；§1 L1/L2 SV。

### 5.3 实用性 20（基线 6–9 / 20）

| 子维度 | 当前 | V2 路径 | Blockers |
|---|---|---|---|
| 普通人可玩通关率（L1 2/3） | 2/5（L1 未知；L2 空间错位导致"认为是 bug"流失率极高） | P1 L1 至少 2/3 陌生用户 + P2 L2 至少 2/5 + P4 L3 至少 3/5 → 4.5/5 | L2 SV / L3 G-L3-1 错放恢复核实 |
| 普通玩家学到点东西（教育价值） | 2/5（目前只靠 ResultPage 简短 cards） | P3 认知闭环 + P6 Timeline → 4/5 | L2 Golden Path 陌生用户覆盖率至少 2/5 |
| Mobile / Touch / Joystick 可用 | 1/5（VirtualJoystick 存在但未经 P7 5 普通玩家 + 2 AI 机器人学习者试玩验证） | P1/P7 回归 + P8 展示 → 3.5/5 | 仅 P7 可验证（P7 = 5 普通玩家 + 2 AI/机器人学习者，不在 P1 重复要求 10 人） |
| Session JSON 可下载 / 可解释 | 2/5（有下载但字段不齐；MVP 9 条缺失；spatial validity 无标注） | P5 + P6 → 4.5/5 | §2 MVP 字段 |

### 5.4 创新性 20（基线 4–8 / 20，注意：不是有 SG 文件就加分，必须 user-visible loop）

| 子维度 | 当前 | V2 路径 | Blockers |
|---|---|---|---|
| 观察 → 编码 → 过期 → 更新 → 恢复 闭环 证据 | 1.5/7（L2 机制在代码里已全部存在，但 SV 错配导致"实际运行样本几乎全为无效混杂"，无法作为证据） | P2 SV + P3 认知闭环覆盖率至少 2/5 陌生用户 → 6.5/7 | D.1/D.2/D.3 SV 三大问题 |
| 有限记忆预算下策略差异证据（L3） | 1/7（L3 机制在代码里存在，但 §4 L3 有 S3 绕过 + G-L3-3 扰动偏轻；槽默认 3 vs 9 物但可能玩家根本不用逐物记） | P4 通过（≥3 策略可分，至少 3/5 陌生玩家不用 S3 全抓） → 5.5/7 | G-L3-1 错放恢复 / G-L3-3 扰动强度 / G-L3-6 Probe SV7 |
| Probe 与记忆类型验证 | 1.5/3（probe questions/answers L139-L150 已有；但记忆类型标注 §1.2 PARTIAL，R-12–14 不全） | P5 + P7 玩家数据 → 2.5/3 | R-12 memory_type trace |
| SceneGraph 或 Semantic 分析可视化 | 0/3（KEEP_FROZEN；ResultPage 无认知 Timeline 着色） | P6 Timeline（先不激活 SG，用 events 直接渲染） → 2/3（不是 SG 驱动但可用） | P6 Timeline + 未来 SG GO 条件 |

关键 Blockers：**创新分必须靠"可见闭环证据"，不靠代码文件数量**；当前 L2 闭环代码有但运行样本因 SV 变为无效混杂 → 创新性最核心风险（不解决就只有 1–2 分）。

---

## 6. Top-5 最大实现差距（按依赖顺序 + 对比赛评分影响排序）

1. **L2 Leave-Home 空间正确性（Living/Bedroom/Entrance SV）**：§4 L2 三个子项 D.1/D.2/D.3 + §5 产品/技术/实用/创新四维共同的第一 Block。不解决 → 研究闭环的运行样本均为无效混杂，创新分 / 实用 / 产品完成度归 0。→ **P2**
2. **研究契约最小 MVP（9 条）**：§2 MVP 3I/4P/2M → schema_version / app_version / task_version / scene_version / seed + memory 写入覆盖过期 caused_by / subgoal 时间戳 7 项需 P5 完成；spatial_validity_status 本轮不改类型，用 QA 附件。→ **P5**
3. **L1 教学闭环（E-F 顺序 + 记忆槽理解度）**：§4 G-L1-1 / -2 / -3 + §5 产品完成度 10/30 的 blocker，同时是 L2 能否真正走到"玩家自然 E 保存"的前提。→ **P1**
4. **L2 认知闭环覆盖率（保存→不拿→扰动→核验→更新→恢复）**：§5 创新性第 1 子项的直接决定因素。若玩家全部"先拿钥匙"绕过，即使用户研究闭环代码实现也没证据。→ **P3**
5. **L3 硬失败可恢复性与策略分化**：G-L3-1 放错能不能取回（否则错放即失败，hard failure 会让 L3 "多目标预算策略"变成"一次错就 GameOver"的惩罚游戏；同时绕过 S1/S2 策略差异）。→ **P4 前置**

（Scene Graph 激活未入 Top-5，因为 §4.2 明确 KEEP_FROZEN，且未来 GO 条件 ≥ 2 consumers。）

---

## 7. spatial_validity_status 类型 Gap（仅规划，本轮不改代码）

当前 SessionData（session.ts L114-154）**无 spatial_validity_status 字段**。产品 V2 §二 与 §三 已将其作为研究有效性的硬条件，但禁止本轮修改类型。

### 7.1 修订后的认证方式（版本级优先，非每 session 人工七项）
- **P0.1 / P0：认证粒度按「build_version + task_version + scene_version」进行版本级 QA**
  - 同一份已通过 QA 的认证版本，普通玩家 Session 只需：
    1. Session 的 build/task/scene version 与认证版本完全一致；
    2. Session 未触发以下 invalid 触发条件 → 可继承版本级的 spatial_validity_status=qa-pass（或 equivalent 标识，不入类型用附件）。
  - 不再要求"普通玩家每次都重新走完整七项 checklist 人工走查"。

- **单独标 invalid 的 Session 情况（触发任一即 invalid）**：
  1. 玩家报告了新的空间 Bug，并被 QA 核实（即该 Session 命中了新版本未发现的 SV1-SV8）；
  2. 玩家使用了 Debug API / teleport / setRobotPosition 等；
  3. 发生不可恢复软锁（卡 ≥ 30 s 且无合法放回路径）；
  4. 当前构建或场景版本与认证版本不一致。

- **QA 人工七项 checklist 的使用场景**：
  - 每次发布新 build / 修改 task / 改 scene（含 layout）后，QA 必须跑完整七项，出具一份版本级 certification；
  - 对疑似被空间 Bug 影响的失败 Session 抽样复核；
  - 对研究数据集的随机抽样子集做人工验证（≥ 5% session）。

### 7.2 接入顺序
- **P2 完成前**：所有 session 默认 "not-audited"（版本级 certification 缺失）
- **P2 三房间分房完成后**：对 L2（task-leave-home）+ L1（task-clean-table）+ L3（task-laundry-sort）各出具一份版本级 QA certification（七条件通过）
- **P5 可选**：若 P0–P4 通过，可在类型中加 `spatial_validity_status: 'qa-pass-version-level' | 'qa-fail' | 'not-audited' | 'invalidated-by-report'`
  - `qa-pass-version-level`：继承版本级认证（自动，不人工逐 session）
  - `qa-fail`：该 session 命中 QA 流程 / 自动脚本的空间 bug
  - `invalidated-by-report`：玩家反馈空间 bug 被核实
- 不允许：根据 memory failureReasons 自动推断为 qa-fail → 必须人工+脚本双重签字

研究层声明规范：**任何"HomeMem Arena 显示玩家有 X% 遗忘率 / Y% 恢复率"的公开结论前，必须注明使用 session 的 build_version / task_version / scene_version 均已通过版本级 spatial_validity QA，且剔除了 invalidated-by-report / teleport / softlock 四类 session。** 否则结论可信度归 0。
