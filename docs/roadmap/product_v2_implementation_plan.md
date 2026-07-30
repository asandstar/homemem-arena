# Product V2 实施路线图

代号：HomeMem Arena · Long-Horizon Mobile Manipulation Research Game Alignment
基线：docs/LEAVE_HOME_LAYOUT_FACT_CHECK.md（A-D 事实）；文档 00_product_research_game_design_v2_draft.md
阶段：P0（本文件）— 仅规划，不改代码
禁止：任何源码 / 测试 / 任务 / 布局 / Session / Scene Graph / README 修改；任何 commit / push。

---

## P0.1：产品定义文档事实纠正与冻结（PRODUCT V2 — P0.1 FACT CORRECTION AND FREEZE · 当前阶段）

### 目标
对 5 份已有文档做事实基线纠正：以当前 HEAD 源码 + LEAVE_HOME_LAYOUT_FACT_CHECK.md A-D 节 + DEFAULT_LEVEL_BALANCE.memorySlotCount 为唯一事实，纠正旧数据、错误事件名、不可能的 Golden Path、相互冲突的验收标准；产出第 6 份文档 `docs/design/product_v2_fact_correction_report.md`；**P0.1 结束后独立 commit**（用户 §十 强制要求）。

### 事实基线（唯一证据源）
1. 源码文件：`src/data/levelBalance.ts`、`src/data/tasks/clean-table.ts`、`leave-home.ts`、`laundry-sort.ts`、`index.ts`、`src/store/slices/memorySlice.ts`、`src/game/commands.ts`、`src/types/session.ts`、`README.md`；不允许用旧报告中的物品数代替当前代码。
2. `docs/LEAVE_HOME_LAYOUT_FACT_CHECK.md` A-D 节。
3. 当前本地 HEAD（不引用未来版本、不引用假设。
4. `DEFAULT_LEVEL_BALANCE.memorySlotCount = 3`（记忆槽唯一事实，默认槽 3）。

### 本轮必须纠正的 11 项事实（完整列表见修正报告）
1. 默认记忆槽从"4"统一改到"3"并重算 L2/L3 预算论证，删除所有"4 ≥ 目标数"，L3 写成：3 槽位面对 9 个物体，但需审查是否真的需要逐物体记忆（可能只需记类别+区域）。
2. L1 实际配置纠正为：物体 = obj-dirty-cup / obj-tissue / obj-fork；容器 = cnt-dining-table / cnt-dishwasher / cnt-trash-bin / cnt-utensil-rack；删除 bowl/plate/bottle/milk/cereal/fridge/cabinet/sink/food-waste 等不属于当前关卡的描述。
3. L1 Golden Path 固定为：观察 → E 保存至少一条位置记忆 → 看见记忆槽变化 → F 拾取 → F 放入正确目标容器 → 完成三件归位 → Probe → Result。
4. L2 猫事件 ID 统一为 `se-cat-pushes-key`（不得再写 `se-cat-moves-key`）；Golden Path 固定为：E 保存钥匙位置 → 钥匙留在茶几保持 free → 去卧室开床头柜拿手机 → 手机放入玄关托盘腾手 → 拿雨伞 → 雨伞放入玄关托盘腾手（手机与雨伞顺序可换，但每次拾取下一件前必须先有合法腾手动作）→ 猫移动钥匙并使记忆过期 → 回客厅重新搜索 → E 更新钥匙记忆 → F 拾取钥匙 → 钥匙放入托盘 → 完成 → Probe → Result；禁止拿手机直接拿雨伞、拿雨伞直接拿钥匙、不更新钥匙记忆直接进入最终阶段；"提前拾取钥匙"不得设计成 90% 失败，要求明确反馈、可放回茶几或合法容器、不形成不可恢复软锁、能恢复到 Golden Path。
5. L3 机制纠正：Probe 只在任务结束后发生（删除"靠 Probe 答案补记忆"游戏中策略）；神秘衬衫 obj-mystery-shirt 是 initial object（不是脚本事件生成，除非当前源码确实有 show/create event——se-mystery-item-appears 目前仅 message 不生成）；逐项核实 se-cat-moves-towel 实际效果（只移小方巾、不交换篮子、不生成或显示神秘衬衫，触发条件 step=9 固定）；"错放后无法取出"目前只标记为待核查假设，先检查 commands.ts（错误类别放置是否直接拒绝、heldEntityId 是否保留、已放置物体能否再次拾取），在无代码证据前不规划新增 L3 专属取回命令。
6. 输入说明纠正：Q 键目前无生产功能（见 README.md 游戏操作表未列出；commands.ts 无 Q 对应命令），从 Product V2 玩家层输入语言中删除 Q，只保留真实存在并可使用的按键（E / F / V / Tab / R / H + WASD + 鼠标 + Esc + 鼠标滚轮）。
7. 研究验收标准修订：P1 只做小规模内部试验 = 开发者自然通关 2 次 + 3 名陌生用户试用 + 3 人中至少 2 人不看帮助完成首次 E + 至少 2 人完成 L1；最终 5 名普通玩家 + 2 名 AI/机器人学习者统一放 P7，不在 P1 重复要求 10 人；L2/L3 百分比指标在样本少于 10 时一律改成明确人数（如 2/5、3/5），不得用无法解释的 20%、30%。
8. P5 Seed 定义修订：只有同时满足以下三点才能称为 reproducible seed = (1) Seed 写入 Session 字段；(2) 所有随机事件使用 seedable RNG（当前未见，使用 Math.random 或 step 阈值触发）；(3) 相同 task_version + scene_version + seed + command_sequence 能复现相同扰动。如果当前随机系统尚未接入 seedable RNG → 状态标记为 MISSING；不得把随机 session id 称为 seed；不得声称任务可复现。
9. 空间有效性认证方式修订：空间有效性优先按 build_version + task_version + scene_version 做版本级认证；同一已认证构建中的普通 Session 可引用该版本的 QA certification；不要求每个普通玩家 Session 都由人工重新走完整七项 checklist；玩家报告新空间 Bug / 使用 Debug 或 teleport / 不可恢复软锁 / 当前构建或场景版本与认证版本不一致 → 单独标 invalid。
10. 提交节奏修订（§十 强制：P0.1 文档冻结后独立 commit；P1 完成后独立 commit；P2 = Living 验收后独立 commit + Bedroom 验收后独立 commit + Entrance 验收后独立 commit；P3 完成后独立 commit。不得继续写"P2 + P3 完成后一次性提交"。
11. 本轮只修改 5 份文档 + 新增 product_v2_fact_correction_report.md；不得修改任何 src / tests / scripts / README；不得 commit、不得 push。

### 允许修改范围（本轮严格 scope）
- 修改：`docs/design/00_product_research_game_design_v2_draft.md`、`docs/design/three_level_research_game_matrix.md`、`docs/design/product_v2_gap_report.md`、`docs/design/spatial_validity_contract.md`、`docs/roadmap/product_v2_implementation_plan.md`
- 新增：`docs/design/product_v2_fact_correction_report.md`（8 项修正 + 待核实假设 + git diff --stat + git status）

### 禁止事项（本轮，违反即 P0.1 FAIL）
1. 任何 src / tests / scripts 下改动
2. 改 README / 部署工作流 / 任务布局 / 源码
3. 改 Session 类型 / GameStore / SceneGraph 激活（Scene Graph 仍 KEEP_FROZEN）
4. commit / push（P0.1 结束后允许 P0.1 单独 commit，但本轮**不允许**立即 commit，需交付文档后再按节奏执行）
5. 扩写新的产品概念（新的玩法、新关卡设计、新研究方向——本轮仅做事实纠正）

### 自动验收（P0.1 结束时）
1. 6 份文档存在并已更新：
   - 5 份原文档已纠正上述 11 项
   - 新增 `docs/design/product_v2_fact_correction_report.md`，至少包含：(1)修正前后记忆槽数量；(2)L1 物体与容器修正；(3)L2 事件 ID 与 Golden Path 修正；(4)L3 Probe / mystery shirt / 扰动修正；(5)Seed 定义修正；(6)路线图提交节奏修正；(7)所有仍待代码核实的假设；(8)git diff --stat；(9)git status
2. `npm run test` 全部通过（321 tests baseline）
3. 源码 / tests / scripts / README 的 `git diff` 为空（0 行改动）

### 人工验收（P0.1 结束时 QA）
1. 文档中所有"默认槽 4"已全部替换为"默认槽 3"，L3 预算审查已写为：3 槽 vs 9 物但需审查是否真需逐物体记忆，而非默认 4 ≥ 9 或类似表述。
2. L1 描述中已彻底删除 bowl/plate/bottle/milk/cereal/fridge/cabinet/sink/food-waste container 等不属于当前 clean-table.ts 的物体和容器名称。
3. L2 猫事件全文统一使用 `se-cat-pushes-key`，不再出现 `se-cat-moves-key`；Golden Path 明确写出每次拾取下一件前必须先腾手的流程。
4. 研究验收标准中 P1 = 开发者 2 次 + 3 名陌生用户 + 2/3 比例，未在 P1 出现 10 人要求；最终 5 + 2 被明确标注"统一放在 P7"。
5. 路线图 §十提交节奏：已拆分为 P0.1 / P1 / P2-Living / P2-Bedroom / P2-Entrance / P3 各独立 commit；**不存在"P2 + P3 一起提交"字样**。
6. 空间有效性认证：全文已改写为"版本级优先，普通 session 继承 QA certification + 4 类 invalid 触发条件"，不再出现"每个玩家 session 都要人工走完整七项 checklist 的要求"。
7. P5 seed：状态标 MISSING；不得出现"session id 即 seed"、"step 触发扰动就是可复现"、或"Date.now() + random 可作 seed"等表述。
8. 输入说明：已删除玩家层语言中的 Q 键（若存在的话），未出现 Q 作为生产功能的描述。

### 停止标准
P0.1 的自动 3 项 + 人工 8 项全通过。**通过后：P0.1 独立 commit（仅 docs 变更）**，然后进入 P1。

### 对比赛评分维度的影响
产品完成度 +30 的"产品文档完整度 + 事实一致性"项；技术实现 30 分的"架构定义清晰 + 数据基线一致"项；实用性 20 分的"策略/教育价值论证基线"项；创新性 20 的"研究闭环可落地证据的文档基线"项。

---

## P0：产品定义和事实基线冻结（P0.1 通过后即视为 P0 完成，不再单独工作包）

P0 = P0.1（文档事实纠正）全部通过后，冻结声明自动生效。不再新增独立 P0 代码任务。

> （历史说明：旧版路线图中的"P0 仅规划、不改代码"已被 P0.1 吸收，P0.1 通过即 P0 冻结完成。）

---

---

## P1：L1 教学闭环（小规模内部试验，用户 §七 P1 验收标准）

### 目标
小规模内部试验验证 L1 task-clean-table：让非开发者的陌生用户在 30 秒内自然理解 E 保存记忆、F 交互、记忆槽 3 格的作用，并在 P1 结束后**独立 commit**。

> **最终 5 名普通玩家 + 2 名 AI/机器人学习者试玩统一放在 P7，不在 P1 重复要求 10 人**（用户 §七 P1/P7 拆分要求）。

### 前置依赖
- P0.1 全通过（文档事实纠正已独立 commit）
- L1 Spatial Validity 人工小审计（Dining 房间关键路径 / DF ↔ Room 视觉 / TC ↔ visual 匹配），若存在严重 SV 问题，作为 L1 空间子任务（在 P1 内单独处理，不扩散到 P2 三关）

### 允许修改范围
1. L1 Task Dialog / Briefing / Stage objective 文字仅允许**增量补注释**或**新增可跳过提示**；禁止改变已有 completionCondition 语义
2. HUD / HelpPanel 帮助文字和视觉提示增量（允许加 UI 引导层，允许移除；禁止改 HUD 布局核心位置）
3. L1 scriptedEvent 触发顺序：仅允许在"先提示保存→再提示操作"语义方向修正；禁止改变 goal predicate / scoring / stage id
4. 如果出现 L1 专属空间 SV 问题，允许修改 dining Room3D.renderDining / decorFurniture.dining / L1 TC 数据；**严格仅限 dining；不允许修改 P2 三关的 living/bedroom/entrance**

### 禁止事项
1. 改 L2 / L3 的任何任务配置
2. 改移动 / 碰撞 / 命令管线
3. 激活 Scene Graph（P1 禁止任何 SG 消费）
4. 新增家具所有权 / 碰撞系统文件（已有管线复用）
5. 在 P1 就执行 10 人以上大规模试玩（大规模试玩放 P7）

### 自动验收
- `npm run test`（321 tests baseline）保持全通过
- 新增或更新 L1 教学相关的 unit / vitest 测试（如 dialog / tutorial 顺序）全通过
- L1 命令链路自动化（clean-table-command-flow.spec）持续通过

### 人工验收（P1 小规模内部试验 = 用户 §七 固定标准）
1. 开发者自然通关 L1 × **2 次**（非 Debug、不使用瞬移）
2. **3 名陌生用户**（非开发者、第一次玩游戏）试用
3. 3 人中**至少 2/3 不看帮助完成首次 E**（不阅读额外文档、不看源码、仅 briefing + 通用帮助）
4. 3 人中**至少 2/3 完成 L1 通关**（含失败重试 ≤ 3 次；使用引导文字也允许）
5. 抽样：3 名陌生用户口头"明白记忆槽 3 格是什么、大概什么时候该按 E"至少 2/3

> **P1 未覆盖的大规模试玩、AI/机器人学习者覆盖率，统一在 P7 执行：5 普通玩家 + 2 AI/机器人学习者 = 7 人规模。P7 验收标准在 P7 章节明确。**

### 停止标准
人工验收 5 条（含开发者 2 次 + 3 陌生用户 2/3 比例 4 条）+ 自动验收 3 条全通过。
→ **通过后：P1 独立 commit**（仅 L1 教学相关 + 可能的 dining SV 修改，不触碰 L2/L3），然后进入 P2。

### 对比赛评分维度的影响
产品完成度：教学有效性；实用性：普通玩家能上手；技术实现：引导体系；创新性：首次 Encode→操作闭环证据。

---

## P2：L2 空间正确性（3 房间逐房，先 Living，Bedroom 验收后再 Entrance）

### 目标
逐房过 Spatial Validity Gate 七条件；消除 SV1–SV8 无效混杂；leave-home 的 Session 才可进入 research-valid 池。

顺序严格：Living → Bedroom → Entrance。前一房间 100% 通过再进下一房间。

### 前置依赖
- P1 完成（或 P1 / P2 串行时先做 P1；若 P1 风险评估可延后单独做，允许先 P2 Living 子步，但 P2 全完成前 P1 必须先过）
- Living room 空间：Fact Check D.1 已详细列明 DF / TC ownership

### 允许修改范围（仅限 P2 的每个子房间，每条严格 scope）
**每次只改一个房间**。

#### P2.1 Living
1. `src/data/decorFurniture.ts` 的 living 条目 position（ROOM-LOCAL，遵循 §一.3 坐标约定）
2. 不允许修改：cnt-coffee-table position；leave-home stages；任何 bedroom/entrance/dining/kitchen/laundry 文件
3. 不允许改 FirstPersonControls / collision.ts / placement.ts（用户约束 + P2 不碰管线）
4. 不允许新增文件

#### P2.2 Bedroom（Living 验收 PASS 后才启动）
1. `src/data/decorFurniture.ts` 的 bedroom 条目 10 条 position 改回正确 ROOM-LOCAL
2. `src/data/tasks/leave-home.ts` 的 cnt-nightstand position + size 对齐 Room3D.renderBedroom 可见右床头柜 visual
3. 必要：Room3D.renderBedroom 门口书架 position（北移 z +1）或 size 调整（仅在 DF 修正后出现 DD 时做最小化；不允许改其他家具位置/风格）
4. 不允许：改 living；改 entrance；改 scenes/材质/调色/模型风格/ FallbackModels 全局

#### P2.3 Entrance（Bedroom 验收 PASS 后才启动）
1. `src/data/tasks/leave-home.ts` 的 cnt-umbrella-stand / cnt-entrance-tray（含 obj-umbrella initialPosition）对齐 Room 视觉直觉位置（门洞旁随手放位置或统一西北角后，二选一，由真人验证通过）
2. 若统一到门洞旁：Room3D.renderEntrance 小范围 group position 调整（仅调整 2 处 tray 位置 group；不允许改 palette / model / global lighting / 调色板）
3. 不允许：改 entrance DF（8 条 DF 正确，禁止动）；改 living/bedroom

### 提交节奏（P2 逐房独立 commit · 用户 §十 强制要求）
- **P2.1 Living 验收通过后 → 独立 commit**（仅 Living 相关文件）
- **P2.2 Bedroom 验收通过后 → 独立 commit**（仅 Bedroom 相关文件）
- **P2.3 Entrance 验收通过后 → 独立 commit**（仅 Entrance 相关文件）
- 不得"P2 全段 + P3 通过后一次性提交"。
- P3 完成后再独立 commit。
- P0.1 / P1 各自独立 commit（见 P0.1 / P1 章节停止标准）。

### 禁止事项（P2 全段通用）
1. 改研究指标 / 内存结构 / Scene Graph（KEEP_FROZEN 未到 GO 条件）
2. 改 breakfast / night-patrol / clean-table task / laundry-sort
3. 改 scoring / timeLimit / stages 名称 / briefing / completionText（P3 之前不能动任务阶段机）
4. 新增任何 .ts 通用架构文件（用户约束 4：不新增通用架构除非当前系统无法完成最小修复——P2 Living 只需改动 decorFurniture position，不需要新增）
5. 改 palette.ts / stylizedMaterials.ts / FallbackModels.tsx 全局（E.5：不改模型风格和全局调色板）
6. 改 README
7. commit / push 合并跳步（必须按 Living → Bedroom → Entrance 逐房独立 commit；P0.1/P1/P2 各房间/P3 各自独立，不得合并跳过）

### 自动验收
- `npm run test` 保持 baseline 321 tests 100% 全通过
- `npm run typecheck`（`tsc --noEmit`）0 errors
- layout qa 脚本（如 scripts/qa-layout.ts 存在）对每个目标房间：
  - 所有 DF world 落在房间 size/2 合法范围内
  - TC 与 DF XZ 重叠 < 10%（避免纯 duplicate collision，DC 检查）
  - 门洞中心 ± (width/2 + PLAYER_RADIUS) XZ 范围无家具 footprint

### 人工验收（每个子房间必做真人行走）
1. 出生点稳，不被任何家具碰撞立刻推挤
2. 从 living ↔ bedroom ↔ entrance 双向往返过门洞 10 次，无 DD 卡 / 家具碰撞推到墙上
3. 每个关键目标：
   - Living：cnt-coffee-table (0, 0.3) 4 方向 F 交互 + 周围 0.5m 碰撞匹配 visual
   - Bedroom：Room 可见右床头柜 F → 打开抽屉 → toast"床头柜打开"→ 手机出现（hiddenInContainer）→ F 拾取（3 步全通）
   - Entrance：cnt-entrance-tray 位置 F 能交互（目标橙圈）；cnt-umbrella-stand 位置 F 能拿起雨伞；Room 手绘托盘位置（如仍保留）不会误导（要么改 TC 对齐，要么删除该 visual，但禁止双份）
4. 全房走一圈（每个墙贴边走 1 次），"看得到过不去""过得去隐形墙挡"0 出现
5. top-down 模式（V 键）与 first-person 碰撞行为一致（不要求完全数值一致，只要求"不穿模""不卡死"）

### 停止标准（每个子房间独立 list）
- Living 5 项 + 自动验收 4 项全过 → 可进入 Bedroom
- Bedroom 5 项 + 自动验收 + 特别项（书架不挡门 × 10 次往返）全过 → 可进入 Entrance
- Entrance 5 项 + 自动验收 + 特别项（双份托盘/伞架视觉 0）全过 → P2 全段结束

### 对比赛评分的影响
**最关键的评分放大器**：产品完成度可达性 / 技术实现一致性 / 实用性通关率 / 创新性样本可信度 四个维度**同时显著加分**；P2 不通过则研究闭环的任何 evidence 均为无效混杂。

---

## P3：L2 认知与长程任务闭环

### 目标
leave-home 达到 §五 定义的 Golden Path：E 存 → 放钥匙 → 子目标 A/B → 猫扰动 → 过期 → 主动核验 → 更新 → 恢复 → 三件到托盘 → 完成；不允许"先拿钥匙再拿手机"的捷径触发 scripted 成功。

### 前置依赖
- P2 Living/Bedroom/Entrance 100% PASS（空间基线）
- L2 session 可稳定采集（P0 研究契约基线无缺口）

### 允许修改范围
1. leave-home task 的：
   - scriptedEvents 触发条件 / 阈值（允许改时间、改门次数；不允许改变核心行为：钥匙 status=free 时才移动）
   - markMemoryOutdated 的调用链（仅允许修复"HUD 过期标识不明显"类视觉缺陷；不允许改变 memorySlot 数值模型）
   - stage objective 文案（仅在 objective ↔ predicate 不一致时修正为 predicate 真实要求；不改变 completionCondition 本身）
   - 手持 1 限制相关的错误反馈文字 / toast / 帮助（不改变手持 1 数量）
2. memorySlice HUD 过期标识视觉（让 outdated 一眼看懂；不改数据结构）
3. failureReasons / FailureBreakdown（ResultPage）分类细化：新增"空间错配导致"类目但仅在人工验收过 SV 的 session 上不触发，即 P2 已通过时该类为 0；纯统计用，不修改数据 schema）
4. Probe 在"发现钥匙过期 → 更新"阶段前后的命中条件（不新增 Probe 类型；仅改触发 timing/文案）

### 禁止事项
1. 改 L1 / L3
2. 新增 research 指标字段到 Session 类型（P3 禁止 schema 修改；P5 统一做）
3. 激活 Scene Graph（仍 KEEP_FROZEN）
4. 改玩家移动 / 碰撞 / 交互管线

### 自动验收
- tests 321 baseline 100% 全过
- e2e：leave-home-command-flow（如存在）spec 100% 全过或仅在可接受范围内更新 gold path
- 自动化"先拿钥匙再拿手机"行为的 se-cat-pushes-key 不触发率 ≥ 95%（保证钥匙 free 条件硬生效）

### 人工验收（5 名普通玩家 + 2 名 AI/机器人学习者）
1. 5 人至少 3 人走通 Golden Path（不是"先拿钥匙绕过去"）
2. 猫事件后，≥ 2/5 玩家主动执行"E 更新记忆"（正确路径）
3. 至少 1/5 玩家出现错误（直接相信旧记忆）但最终通过重试找到钥匙 → failureReasons 分类"forgot-location"合理
4. Debrief ResultPage PolicySuggestions 至少 1 条能显式对应玩家行为（例如"推荐在回房间确认后再更新记忆"）
5. **（§二 统一删除"提前拿钥匙失败率 ≥ 90%"）** 提前拾取钥匙的**恢复性验收**，统一为：
   - 提前拾取钥匙时有明确反馈为什么当前不应拿（toast 或 objective 文字）；
   - 玩家可以放回合法位置（茶几 cnt-coffee-table 或 cnt-entrance-tray 等合法容器/表面），不硬卡关；
   - 放回后钥匙恢复 status=free；
   - 猫事件 se-cat-pushes-key 仍可在后续满足条件时触发（不因为玩家曾拿过钥匙就永久禁用）；
   - 不形成不可恢复软锁；
   - 自动验收：3/3 提前拿钥匙路径（拿了钥匙→再拿手机失败、拿了钥匙→去 entrance 放托盘、拿钥匙→放回茶几）均可恢复；**0 个不可恢复软锁**。

### 停止标准
人工验收 5 项 + 自动验收 3 项全通过。若玩家走捷径比例过高（> 3/5 全是先拿钥匙），增加 P3.5 子任务：在 briefing 或 stage obj 中增加更明显的"先记不拿"提示，**但不得改变钥匙 free 条件本身**。

→ **通过后：P3 独立 commit**（仅 L2 认知闭环相关修改，不触碰 L1/L3/SV），然后进入 P4。

### 对比赛评分维度的影响
创新性 20 分的"核心证据"：用户可见的"环境变化→记忆过期→重新观察→更新→复盘"完整闭环数据 + 复盘页展示。

---

## P4：L3 简化为有限记忆 + 多目标策略挑战

### 目标
将 laundry-sort 从"重复搬运 9 件"降格为"有限预算 + 策略差异可观测 + 有意义 4 分钟挑战"；保证普通人至少 **3/5 通关**，策略分化只保留 **S1/S2/S3 ≥ 2 种明显可观测**。

### 前置依赖
- P1 教学闭环（否则玩家不懂 E/F/记忆）
- P3 L2 空间 + 认知闭环（通过则 L3 是难度放大器，不是试验田）

### 允许修改范围
1. laundry-sort task：
   - 允许删除 / 合并 1–2 件衣物（最高合并到 7 件；不降到 < 6 件，否则预算压力消失）
   - basket position / 视觉 / 标签（如存在 SV 问题）仅限小量位置调整
   - 扰动强度：se-cat-moves-towel 触发条件可调；神秘衬衫 category 与 briefing 是否显式标注 pink 归 white
   - 物品初始分布：若 S3 全抓派占比 > 80%（说明 x 分三列策略意义消失），允许轻量打散，但仍保留类簇结构（白/深/毛巾各一区域）
2. P4 启动前必须做 laundry L3 专属 spatial validity 小 audit（laundry DF / Room / TC 三文件对齐；同 P2 Living 标准）
3. **（§三 统一删除"未核实前必须新增 pick-from-placed 命令"要求）** 正确放置后的物体能否再次拾取先标为 **待代码和真人双核实假设**；未完成实际代码和真人验证前，**不规划新增任何 L3 专属取回命令（如 pick-from-placed）**；P4 前置再核实现状：如果现状是「错放 category 正确的物体后无法取」，则在 P4 gap 中记录为 Bug，再决定修代码修命令或只改提示。

### 禁止事项
1. 新增第四分类（预算压力本质会变）
2. 移动 / 碰撞 / 命令管线全局改动
3. 改 L1/L2 任何代码

### 自动验收
- tests baseline 321 全过
- laundry-sort-command-flow.spec（存在则）100%
- **（§三 统一删除"strategy cluster purity ≥ 0.7"要求；后处理仅打标 S1/S2/S3，不要求 purity 阈值）**

### 人工验收（5 名陌生用户；§三 统一）
1. 至少 **3/5 通关**（含失败重试 3 次内；删除"≥ 5/10"）
2. **至少观察到 2 种明显不同策略**（S1 分类派 / S2 计数派 / S3 全抓派 中至少出现 2 类；删除"S2/S4"，S4 游戏内 Probe 辅助策略已全文清除，Probe 仅在任务结束后发生，不影响游戏中策略）
3. 神秘衬衫最终入白篮正确比例 **至少 3/5**（删除"≥ 60%"）
4. 错放后至少 1 人能取回（如 feature 已加）且 5/5 均"不会因一次错放就 hard 失败"；正确放置后的物体能否再次拾取先标为**待核实**（不影响 P4 验收通过）

### 停止标准
以上全部通过。若神秘衬衫分类 SV 问题持续（粉色衬衫持续被误判到深 / 毛巾），归为 SV 问题，进入 P4.1 子任务把 pink 改成浅白或显式在 briefing 提示"分类按标签不按颜色"。

### 对比赛评分维度的影响
创新性 20 分：L3 预算压力 + 策略差异的数据证据（5 人分 3 类）；实用性 20 分：多目标排序 / 分类的教学意义。

---

## P5：最小研究契约与事件完整性

### 目标
覆盖研究契约 9 项 minimum viable baseline，P5 完成后 session 可用于轻量原型分析；**不引入后端 / 图数据库 / 正式存储服务**。

### 前置依赖
- P3 L2 认知闭环通过（最小研究样本来源）
- P4 L3 策略分化通过（多目标样本）
- P0 Gap 报告 §7 明确标注 IMPLEMENTED / PARTIAL / MISSING

### 允许修改范围
1. `src/types/session.ts`：允许新增以下轻量字段（但每条需先有对应 events/状态写入消费者；禁止空字段）
   - schema_version / app_version / task_version / scene_version（以常量注入）
   - seed（**§四 统一：reproducible seed = 同时满足三点：(1) 独立 seed 字段进入 Session；(2) 所有随机机制消费同一个 seedable RNG；(3) 相同 task_version + scene_version + seed + command_sequence 能复现状态演变。复赛允许二选一，禁止伪 Seed 中间方案（不得用 Date.now()+random / 随机 UUID session id / "写个随机数字"等伪 seed 方案）**：方案 A = **NOT_NEEDED_FOR_SEMIFINAL**（保持当前确定性 step / state 触发，不引入 seed 字段；Session 中 seed 写 NOT_NEEDED_FOR_SEMIFINAL）；方案 B = 完整实现 reproducible seed 三条件。**严禁**在 P5 中写"Date.now()+random 写入当 seed"、"把 session id 改名叫 seed"、"写一个随机数字即可声称可复现"等任何伪 Seed 中间方案）
   - condition_id（实验条件：当前默认 'default-public-scope' 即可）
   - spatial_validity_status：**§五 统一认证方式**：build_version + task_version + scene_version 对应一份**版本级 certification**（完整七项 audit）；普通 Session 记录 `spatial_certification_id`（certification ID）；仅抽样或异常 Session（玩家报告空间 Bug / Debug 使用 / 软锁 / 版本不匹配）才附 Session 级 QA review；spatial_validity_status 对普通 Session 不强制人工签，只有 invalid 条件触发时才标 invalid；抽样 ≥ 5% 人工复核 + invalid 全部人工复核（删除之前"QA 人工签过的 session 标 PASS，其它 session 不自动标 PASS / not-audited"说法，改为 certification ID 机制）
   - reaction_times / probe answers 的 response_time 聚合
   - analysis_version（用于 ResultPage 计算结果的版本号）
2. useSessionStore 或 saveSystem：在事件写出时补全；不新增持久化服务
3. ResultPage：在下载 JSON 时带 schema_version / analysis_version 头部
4. 若分析脚本（ai/analyzeSession 等）存在则补 version 字段；不新增新分析方法

### 禁止事项
1. 新增正式后端 / 云存储 / 数据库
2. 引入图数据库 / SG index / SG build（仍 KEEP_FROZEN）
3. 改变 Session 已有字段语义（如 events 结构，保持向后兼容）
4. 新增 furnitureOwnership.ts / furnitureCollision.ts（研究契约不依赖这两个文件）

### 自动验收
- tests 321 baseline 100% 全过
- `scripts/b2v2-verify`（如存在）校验 session schema_version ≥ 1 且必备 9 项全存在
- 10 次连续 leave-home session 采集，spatial_validity_status 字段存在且默认 'not-audited'

### 人工验收
1. 一个 L2 通过 spatial validity 的 QA session 手动标 PASS；ResultPage 能显示研究契约 9 项的 checklist
2. 下载的 session JSON 能用离线脚本打开 → 读取 → 聚合 probe/过期/恢复指标 0 error
3. 10 个 session 的 JSON 大小控制在 3MB 以内（平均），localStorage 未爆

### 停止标准
以上全通过。

### 对比赛评分维度的影响
技术实现 30 分的"数据契约完整性"；创新性 20 分的"实验可复现证据"。

---

## P6：结果页认知时间线与策略复盘

### 目标
ResultPage 增加"认知时间线"可视化：按 E/过期/更新/Pick/Place/scripted event / Stage change 着色，玩家一眼能看到自己的记忆失效→恢复过程。

### 前置依赖
- P5 研究契约完成（events 已打齐标签）
- P3 通过（至少 L2 有足够研究事件）

### 允许修改范围
1. `src/pages/ResultPage.tsx` 及其子组件（MetricCards / FailureBreakdown / PolicySuggestions / 新增 Timeline 子组件）
2. 时间线只消费已有 Session.events / memory_updates / scripted_events / subgoal 完成时间，不新增 Session schema
3. 新增 ResultPage 上"是否 research-valid"徽标显示 + QA checklist summary（来自 P5 spatial_validity_status）

### 禁止事项
1. 激活 Scene Graph（即使 timeline 想画房间→家具→物体关系，也必须先用已有 events / entities 快照；SG GO 条件未达，禁止引入 SG 依赖）
2. 改 Session schema（消费 P5 schema_version 即可）
3. 改游戏过程中任何逻辑

### 自动验收
- tests baseline 321 全过
- 对 3 个 fixture session（通关 / 过期失败 / 错放失败），timeline 渲染无 crash

### 人工验收
- 3 个玩家看自己的 L2 timeline，能口头说出"这里我记错了""这里猫搞了事情"
- PolicySuggestions 中至少 1 条与 timeline 视觉一致（例如"过期→再观察"会在时间线高亮处显示）

### 停止标准
以上全通过。

### 对比赛评分的影响
产品完成度"复盘可解释性"；实用性"教育反馈质量"；创新性"研究复盘可视化"。

---

## P7：5 普通玩家 + 2 AI / 机器人学习者试玩

### 目标
复赛公开版之前，用 7 人 (5 普通 + 2 AI / Robotics) 试玩三关，收集 session JSON + 结构化访谈，确认通关率、策略分化、SV 问题均在预期范围内。

### 前置依赖
- P1–P6 全部通过
- P5 session 下载 + QA 人工签 spatial validity 流程可用

### 允许修改范围
1. 仅 P7 过程中发现的 **阻断级 / 严重级 SV 或 P3 认知 bug**：按 P2/P3 同样 scope 修复，但数量限定 ≤ 3 项，否则回 P2/P3 重做该子模块
2. 帮助面板 HelpPanel.helpContent 仅做增量 clarifying 文字（不改变结构）

### 禁止事项
- 大改关卡 / 任务机制（> 3 处修复即属于机制问题，不允许在 P7 边测边改）

### 自动验收
baseline tests 100% 全过。

### 人工验收（明确指标）
1. L1：7 人中 ≥ 5 人首次通关（P1 通过标准）
2. L2：5 普通玩家中至少 3 人走 Golden Path 路线（P3 通过标准）
3. L3：普通人通关率 ≥ 4/7（P4 通过标准，学习者允许 2/2 通过则更优）
4. 空间有效性报告：SV1–SV8 各问题出现次数（≥ 1 次即记录，若 SV1/SV2 > 2 次，说明 P2 存在未覆盖场景）
5. 结构化访谈：至少 5/7 玩家能说出"我记住了 3 样东西，因为 E 保存"（记忆机制理解）
6. 无严重崩溃、localStorage 爆、性能 < 20 fps 问题

### 停止标准
以上全部通过；若阻断级修复 > 3 项或 SV 问题 > 5 人次，则回到对应 P2/P3/P4 子任务修复后重新 P7。

### 对比赛评分的影响
所有评分维度最终证据：公开版的试玩数据即是产品完成度、实用性、研究有效性的直接证明。

---

## P8：视觉统一 + Mobile Manipulator 展示增强

### 目标
在保证 P0–P7 研究闭环不被破坏的前提下，做视觉/展示层面统一：
- 三关家具 / 道具 视觉风格一致性（已有 FallbackModels 与 palette）
- HUD / 结果页 品牌感
- 首页 TaskSelectPage 三关卡片的 Mobile Manipulator 展示（例如"机器人代理正在执行任务"的小预览图）

**明确：P8 不得提前到 P1–P4 之前。** 若有人提议先美化，答案："P8 在 P7 之后。"

### 前置依赖
- P7 通过（产品/研究/教学闭环已经有效）；否则先做 P2/P3/P4

### 允许修改范围
1. `components/arena3d/materials/`、`FallbackModels.tsx`、`palette.ts`：仅做增量统一（已有模型不变），不改变家具 scale / position / collision（position 属于 P2 scope，P8 禁止）
2. `pages/HomePage.tsx` / `TaskSelectPage.tsx` 的展示层；首页卡片 / 标签 / 简介 / 机器人代理展示 icon 或小动画
3. Minimap 或 HUD 小细节微调（颜色、spacing、统一圆角等；不改变位置与控件布局逻辑）

### 禁止事项
1. 改 collision / DF position / TC position（→ P2 已经过 spatial validity 签过 PASS，不允许再改位置）
2. 改任务 / stages / scoring / timeLimit
3. 激活 Scene Graph
4. 引入新 GLB 大模型资产（除非是首页展示静态贴图；不允许在 arena 3d 里放新家具模型改变碰撞）

### 自动验收
- tests baseline 321 100%
- 所有 P2/P3/P4 的人工验收 checklist 回归 100% 仍然通过（即 P8 视觉改动未破坏 SV / 认知闭环）

### 人工验收
1. 3 人（P7 中至少 3 位回头客）说"风格更统一 / 看得更舒服"比例 ≥ 2/3
2. 产品完成度的视觉统一子项 QA 确认通过
3. 移动端（触摸 + 摇杆）基础操作（L1 通关）仍可用

### 停止标准
以上全通过。

### 对比赛评分的影响
产品完成度 30 分：视觉呈现；创新性 20 分：机器人代理感展示。

---

## 研究场景与 SG 的未来 GO 路线（未进入本路线图执行）

本节仅列计划路径，不进入实施。

Scene Graph GO ≥ 2 个实际消费者时才启动。候选消费者：
1. **L2 / L3 真实 vs 记忆关系 mismatch 检测**（在 Verify / Update 阶段自动算"记忆 vs world relation diff"作为 failureReasons 补充标签）
2. **ResultPage 认知 timeline 的关系视图着色**（object on surface / container inside / room contains）
3. **Session 导出 semantic 视图**（调试、QA 辅助）
4. **语义所有权 QA**（duplicate visual / DC / DD / OT 自动扫描）

当 1 或 2 或 3 或 4 中至少 **2 项**被明确列为独立工作包的交付物（且这些工作包在路线图 P5 之后），才单独新开一个 SG 激活工作包。该工作包严格遵守：
- 只加 consumers，不加新 schema 字段
- 每帧 build 改为"按需 build"（仅在需要 diff / 导出 / 时间线查询时 build 一次）
- 保留 GameStore 真值源不变，SG 只作派生视图

---

## 路线图总览（执行顺序 = 依赖顺序）

```
P0 (冻结)
 → P1 (L1 教学)
   → P2 (Living → Bedroom → Entrance 空间正确性)
     → P3 (L2 认知长程闭环)
       → P4 (L3 策略简化)
         → P5 (研究契约最小完整)
           → P6 (认知复盘时间线)
             → P7 (5+2 试玩)
               → P8 (视觉与代理展示)
```

任意中间节点未过验收不进入下一节点。任何时候出现"为了通过下一关而改上一关空间正确性 / 任务语义"的情况 → 回到对应节点重做，直至该节点验收 checklist 100% 全过才前进。
