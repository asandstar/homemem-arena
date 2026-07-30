# 产品 V2 定义（草案）· HomeMem Arena

代号：Product Definition V2 · Long-Horizon Mobile Manipulation Research Game Alignment
冻结基线：`docs/LEAVE_HOME_LAYOUT_FACT_CHECK.md`（A–D 节）
日期：2026-07-30
注意：报告 E 节坐标/修改建议仅为候选，不视为已批准方案。

---

## 0. 一句话定义（对外 slogan 与 V2 内核）

**HomeMem Arena 是一款研究启发的 3D 家庭机器人长程任务游戏：玩家控制具有限制工作记忆的移动操作代理，在跨房间、多阶段、动态变化的家庭环境中，通过观察、记忆、规划、导航、操作、核验和恢复完成任务；系统同步记录世界状态、记忆变化、任务里程碑与失败恢复过程，生成可解释的行为复盘。**

---

## 1. 三层对外声明

### 1.A 玩家层（Player-Facing Promise）

> 在会发生变化的家中完成任务；管理有限记忆；在计划失效后恢复任务。

- 可见空间：家中房间、家具、物品会因扰动（猫/幽灵）改变
- 有限资源：记忆槽数量有限；手持数量（当前 = 1）有限
- 失败可恢复：走错、记忆过期、顺序错误均可通过重新观察继续
- 输入语言（E / F / V / Tab / R / H + WASD + 鼠标转视角 / Drag / Touch Joystick）
  - 注：按键以 README.md §"游戏操作"与当前生产代码真实存在为准。**Q 键无生产功能，已从 Product V2 玩家层输入语言中删除**，只保留真实存在并可使用的按键。

**禁止玩家层声明：**
- "提升现实记忆能力"
- "物理准确机器人模拟器"

### 1.B 教育层（Pedagogical Promise）

> 体验家庭机器人在部分可观测、有限记忆、子目标依赖和环境扰动下为何会失败，以及什么策略能减少失败。

- 为什么"先记再做"比"先做再记"更可靠（L1/L2）
- 为什么代理会"忘了位置→找不到→来回游荡→超时"（L2 记忆过期闭环）
- 为什么东西越多，越需要"分堆/排序"（L3 有限记忆预算下的策略差异）
- 为什么需要"再确认"（verify / re-observe）：世界会变，旧信念不可信

### 1.C 研究层（Research Promise · 轻量实验原型）

> 用于记录人类玩家记忆策略、环境扰动反应和失败恢复行为的轻量实验原型。

研究层提供：
- 标准化 Task Spec（TaskConfig + Room + Container + Object + ScriptedEvents）
- 可追溯 Session 数据（commands / pose / memory / scripted event / probe / milestone）
- 可解释复盘页（result + policy suggestions + failure breakdown）

**研究层硬性禁止声明（对外必须标注"仅限游戏内轻量原型"）：**
1. 不声称是正式机器人 benchmark（缺少动力学/噪声/感知不确定性）
2. 不声称玩家策略可直接迁移到真实机器人（需实物验证）
3. 不声称 Scene Graph 已驱动游戏认知逻辑（§4.3 C 中明确 KEEP_FROZEN，0 处生产消费）
4. 不声称当前数据已通过正式统计显著性验证（N=0 玩家）

---

## 2. 空间有效性契约（Spatial Validity Contract）前置嵌入

> 空间、视觉与交互正确性是研究有效性的前置条件。

本契约单独成文件：`docs/design/spatial_validity_contract.md`。此处仅嵌入最高优先级约束，后续任何工作包不得降级。

**无效混杂类型（当发生时，不得将玩家失败解释为"记忆失败"）：**

| 编号 | 无效混杂 | 研究含义 |
|---|---|---|
| SV1 | 视觉家具和碰撞体位置不同 | 玩家"看得到过不去 / 过得去被隐形墙挡" → 被解释为"无法到达子目标"而非"记忆错误" |
| SV2 | 同一任务家具出现两个视觉副本 | 玩家 F 错副本 → 被记录为 failedInteractions，实为空间误导 |
| SV3 | 玩家看见的容器无法交互 | 视觉归属错误 → 解释为"找不到容器" |
| SV4 | 可交互容器没有对应视觉 | 玩家靠 HUD 才能发现 → 并非"观察-记忆"闭环 |
| SV5 | 家具或隐形碰撞挡住必经路线 | 子目标不可达 → 解释为时间不足或游荡 |
| SV6 | 目标物被非任务装饰误导 | 与 OT（Occludes Target）同义，直接污染样本 |
| SV7 | 阶段文案与任务判定不一致 | 玩家按文案操作却未推进 → 非认知失败 |
| SV8 | 手持限制进入无法继续的路径 | 典型：L2 先拿钥匙再去拿手机 → 被判定超时或"没存记忆" |

**空间有效性认证方式（版本级优先，非每 session 人工七项）：**

优先按 **build_version + task_version + scene_version** 进行**版本级 QA 认证**：
- 同一已认证构建中的普通玩家 Session，若 build / task / scene version 与认证版本完全一致，且未命中以下任一 invalid 触发条件 → 可直接继承该版本的 QA certification（research-valid）。
- **不再要求普通玩家每个 Session 都由人工重新走完整七项 checklist**。
- 人工七项 checklist 仅用于：(a) 每次发布新 build 时出具版本级 certification；(b) 疑似空间 Bug 影响的失败 Session 抽样复核；(c) 研究数据集随机抽样 ≥ 5% 子集人工验证。

**单独标 invalid 的 Session（触发任一即不研究有效）：**
1. 玩家报告了新的空间 Bug，并被 QA 核实（命中了该版本未覆盖的 SV1–SV8）
2. 玩家使用了 Debug API / teleport / setRobotPosition 等
3. 发生不可恢复软锁（卡 ≥ 30 s 且无合法放回/腾手路径）
4. 当前构建或场景版本与认证版本不一致

**版本级 QA 的七条件（出具 certification 时必须全通过）：**

1. 所有关键路径可达（living ↔ bedroom ↔ entrance，起点 → 任务点）
2. 关键目标的视觉与交互位置一致（ε ≤ 0.5m XZ + 视觉明显归属）
3. 无重复任务家具视觉（任务容器在当前房间仅一份可见 mesh / 一份 collision）
4. 无明显视觉碰撞错位（关键家具 DF ↔ Room 视觉误差 ε ≤ 0.2m XZ）
5. 无不可恢复软锁（手持占用 → 无法完成 → 有恢复路径：放回到合法目标区）
6. 玩家未使用 Debug API、瞬移或手动 setRobotPosition
7. 任务阶段与实际判定一致（objective ↔ completionCondition 双向检查通过）

> 注意：当前 Session 类型中尚无 `spatial_validity_status` 字段，本版 V2 仅把该 Gate 写入 gap report（见 product_v2_gap_report.md §7），**本轮不修改 `src/types/session.ts`**。

---

## 3. 统一核心循环

固定：`Observe → Encode → Plan → Navigate / Manipulate → Disturbance → Verify → Update / Replan → Complete → Debrief`

每步按七个维度展开。

### 3.1 Observe — 观察

| 维度 | 内容 |
|---|---|
| 1 玩家看见什么 | 3D 场景、家具、物品、HUD 小地图、TaskList、可用记忆槽（空/满/已过期）、对话框、F/E/V 提示圈（Tab/R/H 为 HUD 辅助按键，普通玩家仅在新手期需了解） |
| 2 玩家决定 | 先看哪里 / 是否保存 / 是否靠近 |
| 3 游戏反馈 | 高亮目标圈 / 提示文字 / 语音 SFX / 手持显示 |
| 4 当前记录 | camera_pose_trace；observations（types/session.ts L132，含 visibleObjectIds/visibleContainerIds/frameId）；heldObjectId |
| 5 当前缺失 | 视线语义分割；观察行为时间戳绑定（F/E 前多少帧开始注视） |
| 6 机器人概念 | Partial Observability / Perception aliasing / Sensing coverage |
| 7 可计算指标 | 首次看目标耗时；重新观察次数 `repeatedSearchCount`（metrics L11） |

### 3.2 Encode — 编码入记忆（E）

| 维度 | 内容 |
|---|---|
| 1 玩家看见什么 | 目标 Object/Container 被 F 圈包含时出现 E 按钮提示；按下后 HUD 记忆槽出现新 entry（图标 + 文本） |
| 2 玩家决定 | 是否保存这条记忆；是否锁定某条记忆防覆盖；槽满时是否接受系统自动覆盖低优先级/未锁定/可覆盖旧记忆（**玩家不直接选择槽位**：CURRENT IMPLEMENTATION = saveMemory 按「同实体已有槽自动更新 → 空槽 → 自动覆盖可覆盖槽」三优先级自动选槽，见 memorySlice.ts L28-L136）；对不确定项是否放弃 |
| 3 游戏反馈 | toast：已保存 × × ×；记忆颜色变化；SFX；若覆盖高优先级记忆则 floatingText '⚠️ 覆盖高优先级记忆'；memory_updates（session.ts L137） |
| 4 当前记录 | memories（session.ts L125，MemoryEntry[]）；stepCount；events（saveMemory event） |
| 5 当前缺失 | 记忆类型显式标注（object/spatial/temporal/procedural — 仅存在配置无写入 trace）；覆盖/放弃决策记录 |
| 6 机器人概念 | Working memory encoding / Belief state construction / Uncertainty calibration |
| 7 可计算指标 | 保存时机 vs 扰动间隔；首次正确保存比例；覆盖数 ratio |

### 3.3 Plan — 规划

| 维度 | 内容 |
|---|---|
| 1 玩家看见什么 | 任务列表（TaskCard）+ 阶段目标；小地图（Minimap）；可能的"建议路线"（若未来加） |
| 2 玩家决定 | 先去哪间房 / 先拿什么 / 手持占用策略 / 先 E 还是先 F（此处是关键 UX 错配来源） |
| 3 游戏反馈 | scriptedEvents 触发条件会因为顺序不同而不同（如 L2 拿了钥匙就拿不到猫事件的 free 钥匙） |
| 4 当前记录 | 事件顺序（events[]）；subgoal 达成时间；触发 scripted_events 时间戳 |
| 5 当前缺失 | 玩家"口头计划"（无输入）；显式子目标排序选择（目前是通过实际行为推断） |
| 6 机器人概念 | Task and motion planning / Subgoal ordering / Resource（hand）scheduling |
| 7 可计算指标 | stage transition times；goal gap（longestGoalGapMs，L28）；actionSuccessRate（L29） |

### 3.4 Navigate / Manipulate — 导航与操作

| 维度 | 内容 |
|---|---|
| 1 玩家看见什么 | 第三人称/一人称代理；F 目标圈；门的高亮；手持物品显示；摇杆/键盘速度感 |
| 2 玩家决定 | 走路路线；F pick / place / open；V 切换视图 |
| 3 游戏反馈 | object_state_changes / container_state_changes；SFX（pick/place/open-door）；toast；cat prints 效应（leave-home） |
| 4 当前记录 | agent_pose_trace（L130）；commands（event.type = command:*）；containerMistakes（L24）；wrongPlacements（L23）；actions（L134） |
| 5 当前缺失 | 路径"失败尝试"段的单独标记（blockedRouteCount 人工指标，尚未采集） |
| 6 机器人概念 | Navigation under uncertainty / Mobile manipulation primitives / Door traversal |
| 7 可计算指标 | roomTransitions（L10）；unnecessaryRevisits（L22）；actionSuccessRate（L29） |

### 3.5 Disturbance — 扰动

| 维度 | 内容 |
|---|---|
| 1 玩家看见什么 | 猫阴影/脚印（CatShadow/CatPrintsEffect）；手机响铃 PhoneRingEffect；袜子幽灵动画（laundry）；钥匙物品视觉瞬移 |
| 2 玩家决定 | 立刻回房间检查 / 继续当前子目标 / 放弃记忆并重新观察 |
| 3 游戏反馈 | markMemoryOutdated（memorySlice 触发，HUD 槽变色或过期标记）；ChaosEffect；ScriptedEventRecord |
| 4 当前记录 | scripted_events（L138：id/timestamp/step/type/affectedEntityIds）；triggeredEvents（taskSlice）；MemoryEntry.isOutdated |
| 5 当前缺失 | 扰动前/后 agent 在哪个房间 / 持物状态（可从现有字段派生，尚未有专用聚合） |
| 6 机器人概念 | World dynamics / External non-stationarity / Execution monitoring triggers |
| 7 可计算指标 | 扰动到重新观察的时间；扰动到最终更新记忆的时间（Update 段）；affectedEntities 命中的 memory 比例 |

### 3.6 Verify — 核验

| 维度 | 内容 |
|---|---|
| 1 玩家看见什么 | 走回"记忆中的位置"；发现空；靠近物品；记忆槽过期标记 |
| 2 玩家决定 | 是看错了 / 记错了 / 环境变了；决定重新 E 还是直接拿 |
| 3 游戏反馈 | HUD 过期标记（如果当前已实现）；Probe 问题（probe_questions）；Toast "记忆可能过期" |
| 4 当前记录 | 玩家重新观察 observations；重复 F/E 事件；probe_answers（L150：responseTime / isCorrect） |
| 5 当前缺失 | 玩家"主动核验"与"被迫发现差异"的判别（需 session 级行为段标记） |
| 6 机器人概念 | Execution monitoring / Belief revision / Consistency check |
| 7 可计算指标 | probeAccuracy（L12）；avgProbeReactionTime（L15）；过期记忆被更新数 vs 覆盖数 |

### 3.7 Update / Replan — 更新与重规划

| 维度 | 内容 |
|---|---|
| 1 玩家看见什么 | 新的 TaskList 阶段；记忆槽新 entry 覆盖旧 entry；重新出现的物品位置 |
| 2 玩家决定 | 更新记忆；改子目标顺序；是否先放手里物品腾出手 |
| 3 游戏反馈 | stepCount 推进；achieve goal；memory_updates；markMemoryOutdated 恢复为 updated |
| 4 当前记录 | memory_updates；achievedGoalIds；nextStage 切换时间戳；events（place/pick 命令） |
| 5 当前缺失 | 玩家是否在"覆盖旧记忆"前执行过"先验证"（仅靠事件时间差推断） |
| 6 机器人概念 | Belief update / Replanning policy recovery / Graceful degradation |
| 7 可计算指标 | outdated → updated 转化率；记忆有效期（duration）；成功恢复率 |

### 3.8 Complete — 完成

| 维度 | 内容 |
|---|---|
| 1 玩家看见什么 | completionText；转场到 ResultPage；MetricCards；PolicySuggestions；FailureBreakdown（失败时） |
| 2 玩家决定 | 点"再玩一次"/"下载 Session JSON"/"看复盘" |
| 3 游戏反馈 | 结果页；统计数字；下载按钮（DownloadButton / JsonPreview） |
| 4 当前记录 | SessionData 完整落盘（AIResearchAnnotation / aiSummary / metrics） |
| 5 当前缺失 | 可解释时间线（timeline by memory event / by object / by subgoal）统一在 ResultPage 展示 |
| 6 机器人概念 | Terminal state evaluation / Episode summary / Benchmark run completion |
| 7 可计算指标 | goalsAchieved/total；durationMs；最终 terminal status |

### 3.9 Debrief — 复盘

| 维度 | 内容 |
|---|---|
| 1 玩家看见什么 | MetricCards：耗时、正确率、记忆命中；FailureBreakdown：错放、错容器、遗忘、顺序、超时；PolicySuggestions：策略卡片 |
| 2 玩家决定 | 下一关 / 重试本关 / 下载 raw session / 看 Probe |
| 3 游戏反馈 | ResultPage（`src/pages/ResultPage.tsx` + MetricCards/FailureBreakdown/PolicySuggestions） |
| 4 当前记录 | policySuggestions（L128）；failureReasons（L127）；failure_modes（L152）；ai_research_annotation（L153） |
| 5 当前缺失 | 认知时间线：在 ResultPage 上按记忆过期-观察-更新绘制长程任务闭环 |
| 6 机器人概念 | Explainability / Post-hoc policy review / Counterfactual reasoning |
| 7 可计算指标 | PolicySuggestion 命中率（与下一局玩家行为是否改变需跨 session 对比） |

---

## 4. 四层状态模型 + Scene Graph 决策

### 4.1 四层定义与当前真值源

| 层 | 真值源 | 当前实现文件 | 写入者 | 消费者 | 持久化 | 结果分析 | 当前状态 | V2 目标 |
|---|---|---|---|---|---|---|---|---|
| **L1 True World State**（真实世界） | robotPosition + entities + containerStates + currentRoom + elapsedMs | store/slices/entitySlice / playerSlice / taskSlice / progressSlice；`src/types/object.ts` | useGameStore reducers；FirstPersonControls；commands.ts；taskSlice triggerScriptedEvents | Scene3D 渲染；interactionTargets；FirstPersonControls；commands；placement；scoring | SaveData（saveSystem.ts L15 entities/containerStates/robotPosition） | yes（MetricCards/Score 直接从 entity/container status 算） | IMPL_PARTIAL：家具坐标 baseline 未过 spatial validity | **L1 · 过 P2 空间正确性验收，七条件 research-valid** |
| **L2 Belief / Memory State**（代理记忆） | memorySlots + MemoryEntry[]（含 outdated 标记） | `src/game/memorySlots.ts`；store/slices/memorySlice.ts；`src/types/memory.ts` | memorySlice（save/update/outdated/decay）；triggerScriptedEvents markMemoryOutdated | HUD（记忆槽 UI）；flow completionConditions；commands（在 E 时写入）；memory_test.ts | SaveData.memorySlots（L21 saveSystem.ts） | partial（totalMemories L16；memory types 精度 L17-L20 spatialAccuracy/objectAccuracy/...） | IMPL_PARTIAL：写/过期/decay 全有，但 memory type 标注未入 session | **L2 · 过期时间戳 + 更新时间戳 + isCoverage + memory_type 全量进 session trace** |
| **L3 Task / Subgoal Graph**（任务/子目标） | stages + goals + completionCondition + triggeredEvents + achievedGoalIds | `src/types/task.ts` StageContext / StageSpec；flow.ts 评估；taskSlice | flow evaluateStageTransitions；commands.goal/object/container predicate；taskSlice 初始化 stages | TaskList UI；completionCondition 下阶段判断；flow.advanceStage；scoring 计算 | SaveData.achievedGoalIds / triggeredEvents / stepCount（L26-L27） | yes（goalsAchieved/total L13-L14；longestGoalGapMs L28） | IMPL_PARTIAL：subgoal 无显式独立里程碑节点（如 E/F/P/Verify 各自一个 milestone） | **L3 · 每个 Stage 下记录关键 milestone：Encode（saveMemory）、Pick、Place、Verify、Update 五种事件 + 时间** |
| **L4 Session Trace**（会话全轨迹） | SessionData（types/session.ts L114-L154）；SaveData + useSessionStore | `src/types/session.ts`；`src/save/saveSystem.ts`；`src/store/useSessionStore.ts`；`src/pages/SessionDataPage.tsx` | ArenaPage / session store tick；命令事件；probe answers；ResultPage finish 时合成 | SessionDataPage 展示；DownloadButton；analyzeSession（ai/analyzeSession）；b2v2-verify 校验 | SaveData；localStorage session；ResultPage 可导出 JSON | yes（ResultPage 直接消费 SessionData.metrics/failure_modes/policy） | IMPL_PARTIAL：核心字段齐全但 research contract 7 条件未全（§七见 gap report） | **L4 · 研究契约九项 minimum viable；spatial_validity_status 手动+gap 标注（先不 new 字段）** |

### 4.2 Scene Graph 当前状态（硬约束）

- 类型定义：`src/engine/sceneGraph.ts` L19-L85
- 构建函数：`buildSceneGraph(entities, containerStates, task)`（L94-L187）
- 更新位置：无（无 useFrame tick）
- 消费位置：生产 0 import；仅 `sceneGraph.test.ts` 单元测试消费
- 影响记忆过期：否（markMemoryOutdated 链：triggerScriptedEvents → memorySlice，不引用 sceneGraph）
- 进入 Session：否（session.ts L114-L154 无 scene_graph 字段）
- 进入 ResultPage：否（ResultPage 直接读 metrics/失败原因/probes，不跑 graph query）
- 是否为死代码：功能性死代码（生产 unreachable），但接口/测试齐全

**V2 固定决策：KEEP_FROZEN（本轮不再评估 KEEP_ACTIVE）**

**V2 明确禁止激活方向（Scene Graph 禁区）：**
1. 让 Scene Graph 管理家具坐标 / 碰撞（→ FirstPersonControls + collision 已是现有双管线）
2. 让 Scene Graph 驱动碰撞 / 交互目标（→ interactionTargets.ts / flow / commands 已有消费者）
3. 让 Scene Graph 替代 useGameStore（→ L1 True World State 以 GameStore 为真值）
4. 将 buildSceneGraph 接入每帧 update（→ 无消费者，性能浪费）
5. 引入图数据库 / 外部索引
6. 自动路径规划（navigation graph from SG）

**Scene Graph 未来 GO 条件（同时满足 ≥ 2 个）：**
1. L2 / L3 的"真实关系 vs 记忆关系" mismatch 检测用 Scene Graph 跑（leave-home 的猫事件或 laundry-sort 毛巾位置）
2. ResultPage 认知复盘的 Timeline 视图（按关系 on-surface / inside-container / contains 着色）
3. Session 导出附语义视图（语义所有权 QA / 调试辅助）
4. 家具/容器语义所有权 QA（SV2/SV3 自动发现 duplicate visual / duplicate collision）

---

## 5. 三关能力阶梯（概要，完整见 three_level_research_game_matrix.md）

| 等级 | 关卡 | 核心研究问题 | 主要扰动（代码真实发生，以 task 文件为准） | 能力阶梯 |
|---|---|---|---|---|
| **L1** | task-clean-table（物体：obj-dirty-cup / obj-tissue / obj-fork；容器：cnt-dining-table / cnt-dishwasher / cnt-trash-bin / cnt-utensil-rack） | 观察如何形成能够支持后续操作的工作记忆？ | 小量（无外部动态；仅手持 1 占用；教学分步提示） | Observe → E 保存至少一条位置记忆 → 看见记忆槽变化 → F 拾取 → F 放入正确目标容器 → 完成三件归位 → Probe → Result（教学闭环，无 bowl/plate/bottle/milk/cereal/fridge/cabinet/sink/food-waste 等不在当前关卡） |
| **L2** | task-leave-home（事件统一：se-cat-pushes-key，不写 se-cat-moves-key） | 环境变化后，代理怎样发现旧信念失效，重新观察、更新记忆并恢复长程任务？ | **CURRENT IMPLEMENTATION（事实基线 leave-home.ts L286-L297）**：猫搬运 free 钥匙（se-cat-pushes-key，钥匙 status=free）满足 **任一条件即立即触发**：(a) 保存过钥匙 fresh 记忆 && 钥匙 free && 玩家已离开客厅（currentRoom !== living）；(b) 钥匙 free && 玩家已取得手机（hasPhoneObtained==true，不限于是否存过钥匙）。也就是说：**保存钥匙并离开客厅后，猫即可立即移动钥匙，不要求手机和雨伞都放入托盘**。效果：钥匙从茶几推到客厅西北角 -3.2,-3.2 + markMemoryOutdated(obj-key 过期) + 手机响铃提示。**V2 TARGET 体验（不等于当前已实现）**：玩家正在执行其他子目标（去卧室/取雨伞）期间扰动发生，并在返回客厅时发现旧记忆失效，形成完整"旧信念失效→核验→更新→恢复"闭环。**提前拾取钥匙不设计成 90% 失败**：应提供明确反馈为什么当前不应拿钥匙 → 玩家可放回茶几/合法容器（钥匙恢复 free）→ 猫事件仍可在后续触发 → 不形成不可恢复软锁 → 能恢复到 Golden Path。 | **Golden Path（V2 目标体验；当前实现不保证猫在手机+雨伞都放托盘后才触发，提前离客厅或拿手机就可能触发）**：E 保存钥匙位置 → 钥匙留在茶几保持 free → 去卧室开床头柜拿手机 → 手机放入玄关托盘腾手 → 拿雨伞 → 雨伞放入玄关托盘腾手（手机与雨伞顺序可换，但每次拾取下一件前必须先腾手，禁止拿手机直接拿雨伞、拿雨伞直接拿钥匙）→ 猫移动钥匙并使记忆过期 → 回客厅重新搜索 → E 更新钥匙记忆（不更新记忆不得进入最终阶段）→ F 拾取钥匙 → 钥匙放入托盘 → 完成 → Probe → Result（长程闭环） |
| **L3** | task-laundry-sort（9 件物体 / 3 类 / 3 篮；默认槽 3，需审查玩家是否真需要逐物体记忆，或只记类别 + 区域即可） | 目标数超过工作记忆预算时，代理如何分配记忆预算、安排多目标顺序？ | 实际发生的扰动：se-cat-moves-clothes 移白袜子（step=5）→ 毛巾篮附近；se-cat-moves-towel 仅移小方巾 obj-towel-small（step=9）→ 白篮附近；se-cat-hides-dark-socks 藏黑袜子（step=13）→ 洗衣机后；se-mystery-item-appears 仅 message 不生成（obj-mystery-shirt 本身是 initial object，初始就在白堆 x=-2.7,z=1.4）；se-baskets-swapped 仅 message，不实际移动篮子；**Probe 只在任务结束后发生，不做"游戏中靠 Probe 补记忆"的策略**；错放后能否取出标记为待核查假设，不规划新增 L3 专属取回命令 | 3 槽面对 9 物体（但需审查是否只记类别/区域即可）+ 扰动后重新观察 + 分类顺序策略差异（多目标闭环） |

---

## 6. 游戏性契约（What Counts as a Choice / What is Forbidden）

### 6.1 研究概念 ⇄ 玩家选择（一一对应）

| 研究概念 | 对应玩家决策 | 当前关卡可见 |
|---|---|---|
| 部分可观测（Partial Observability） | 是否回房间再确认（Verify / Re-observe） | L2/L3 |
| 有限记忆（Bounded Working Memory） | E 保存/覆盖/放弃哪条；默认槽 3（唯一事实源：DEFAULT_LEVEL_BALANCE.memorySlotCount = 3）vs 目标数 9（L3），但需审查玩家是否真的需要逐物体记忆，还是只记类别和区域即可 | L1-L3 |
| 环境变化（Non-stationary World） | 继续相信旧记忆 vs 重新观察核验（Update/Replan） | L2/L3 |
| 子目标依赖（Subgoal dependency） | 先处理哪件；是否先腾出手（手持 1 限制） | L1-L3 |
| 失败恢复（Recovery） | 原计划（记忆）失效后如何重新搜索并继续完成 | L2/L3 |

### 6.2 严格禁止的"难度来源"（都属于无效混杂，研究可信度直接作废）

1. 看不清物体（通过渲染 / 光照 / 距离制造难度）
2. 家具挡门（DD：Door Blocking）
3. 隐形碰撞（DF ↔ Room 视觉错位 / 纯 XZ 碰撞没对应视觉）
4. 双份任务模型（SV2：同一语义两个 TaskContainer / 两个 visual copy）
5. 文案与判定不一致（SV7：objective 文本与 completionCondition 不一致）
6. 为研究价值增加无意义搬运（把"策略题"降格为"苦力题"）
7. 激活没有产品消费者的 Scene Graph（§4.2 禁区）

---

## 7. 比赛评分映射与 V2 对齐

维度：产品完成度 30 / 技术实现 30 / 实用性 20 / 创新性 20。

### 7.1 当前状态 vs V2 目标

| 维度 | 当前基线（HEAD） | V2 目标 | 布局/空间一致性的影响 |
|---|---|---|---|
| 产品完成度 30 | 基础 3 关可玩，但 L2/L3 空间/交互错配严重（SV1-SV6 多发） | 过 Spatial Validity Gate；L1 教学闭环；L2 认知闭环；L3 简化为策略题；统一复盘页 | **空间错配同时扣产品完成度的"可达性""一致性""教学有效"三项子分** |
| 技术实现 30 | 三层状态 + Session + 移动/碰撞/命令管线稳定；321 tests 通过；layout fact-check 揭示数据层 bugs | 保持现有系统稳定；P2 空间正确性；P5 最小研究契约；P6 复盘时间线 | **DF 数据错误 + TC ↔ Room 视觉错位 = "数据一致性/实现严谨"扣分重灾区** |
| 实用性 20 | Session JSON 可下载；ResultPage + SessionDataPage 可查看；普通玩家能玩 1 关通关 | 三关通关率可接受；策略建议（PolicySuggestions）对普通人有教育意义；Mobile Joystick 可用 | **挡门/错位/双份托盘 = 普通玩家误以为是 Bug，不会继续 → 实用性归 0** |
| 创新性 20 | 有 SceneGraph 代码 + Session 丰富字段 + 记忆过期系统（但 SceneGraph 未驱动任何用户可见闭环） | **用户可见创新闭环证据**：e.g. L2 "猫搬钥匙→旧记忆过期→玩家更新→结果页展示"完整时间线；Probe 命中；L3 策略差异分析 | **创新分不以"有 SG 文件/字段多寡"计；必须有可见 user-visible loop** |

### 7.2 一句话创新证据要求

> "必须有至少一个 user-visible research loop：环境变化→旧信念失效→玩家发现冲突→更新记忆→复盘页面可复盘该过程。"
> 基线：L2 leave-home 的猫事件 + memory outdated HUD + ResultPage failure breakdown（若空间基线正确，即构成证据）。当前空间错配会让该闭环样本落入 SV 混杂而不可用。

---

## 8. 研究契约 Minimum Viable（复赛基线）

复赛版本必须有（9 条，完整 gap 分析见 product_v2_gap_report.md §七）：

1. task / scene / build 版本号
2. session seed（**定义 reproducible seed = 同时满足三点**：(1) Seed 字段独立进入 Session 中；(2) 所有随机机制消费同一个 seedable RNG；(3) 相同 task_version + scene_version + seed + command_sequence 能复现状态演变。**复赛允许二选一，禁止伪 Seed 中间方案（不得用 Date.now() + random、随机 UUID session id、或"写个随机数字"即声称可复现）**：方案 A = **NOT_NEEDED_FOR_SEMIFINAL**（保持当前确定性 step / state 触发，不引入 seed）；方案 B = 完整实现 reproducible seed 三条件。**当前 HEAD 状态 = MISSING + 未选择方案**：三条均不满足——无 seed 字段；无 seedable RNG；猫事件 / 衣物扰动基于 step 阈值触发而非 seed 随机。**不得把 session id 称为 seed，不得声称任务可复现**，见 gap report §2 R-05 seed=MISSING）
3. 玩家命令 + 状态变化 trace
4. 记忆写入 / 过期 / 更新 trace
5. 关键环境扰动（scripted events）
6. 子目标完成时间
7. Probe（问题 + 作答 + 反应时间）
8. 可解释结果指标（cards / failure breakdown / policy）
9. Spatial Validity 人工验收记录（attached QA 文档 / checklist，本轮不进 Session 类型）

---

## 9. 输出与实施顺序（进入实施路线图文件）

本文件不规定实施步骤，详见：
- 研究三关完整矩阵：`docs/design/three_level_research_game_matrix.md`
- 实施路线图（P0–P8）：`docs/roadmap/product_v2_implementation_plan.md`
- 研究契约与四层状态 Gap 分析：`docs/design/product_v2_gap_report.md`
- 空间有效性契约：`docs/design/spatial_validity_contract.md`

---

## 10. 冻结声明

> 产品 V2 定义（本文件）**不视为事实基线的一部分**——它是未来工作包的需求规范。**事实基线仅为 `docs/LEAVE_HOME_LAYOUT_FACT_CHECK.md`（A–D 节）**。实施时如出现"V2 需求 vs 事实"冲突，**先以事实为准修正 V2，再启动代码修改**，不得违反 P0–P2 红线。
