# PRODUCT V2 — P0.1 事实纠正报告

代号：Product V2 · P0.1 FACT CORRECTION AND FREEZE
日期：2026-07-30
事实基线：
- `DEFAULT_LEVEL_BALANCE.memorySlotCount = 3`（唯一记忆槽事实源）
- `docs/LEAVE_HOME_LAYOUT_FACT_CHECK.md` A-D 节
- 当前本地源码（`src/data/levelBalance.ts` / clean-table / leave-home / laundry-sort / tasks/index / memorySlice / commands / session / README）
- 当前 HEAD

范围：仅纠正事实，不改代码、不新增产品概念、不 commit / push。

---

## 1. 修正前后记忆槽数量

| 维度 | 修正前（旧文档中散落的"默认槽 4"描述） | 修正后（唯一事实源） |
|---|---|---|
| 默认记忆槽数量 | 4（多处文档散落写成"默认槽 4"、"4 ≥ 目标数"等） | **3**（硬事实：`src/data/levelBalance.ts` L40 `memorySlotCount: 3`；`memorySlice.ts` L25 `new Array(...).fill(null)`） |
| L2 预算论证（槽 3 vs 物 3） | 多写为"4 ≥ 3，预算充足"，让研究问题"玩家是否存、存什么、何时覆盖"显不出决策压力 | **槽 3 = 物 3（严格临界）**：锁定任意 1 条都不会让其余 2 条被覆盖，但跨房间 + 顺序依赖 + 手持 1 硬约束，让玩家的"是否存、存什么、何时覆盖"成真实决策 |
| L3 预算论证（槽 3 vs 物 9） | 多写为"4 槽对比 9 物，预算压力 4 < 9"甚至"4 ≥ 目标数" | **3 槽面对 9 物体**（但**必须审查**：玩家是否真的需要逐物体记忆，还是只要记住类别（白/深/毛巾 3 类）+ 区域（x=-3/0/+3 三列天然分区）就能通过。若只记类别/区域，则 3 槽预算压力可能未真正触发。→ 结论留给 P4 真实玩家观察后决定，本轮不打散布局） |
| 删除所有"4 ≥ 目标数"描述 | 文档中散落出现 | **全部删除**，统一改为：默认槽 3（唯一事实源：`DEFAULT_LEVEL_BALANCE.memorySlotCount = 3`） |

---

## 2. L1 物体与容器修正（以 `src/data/tasks/clean-table.ts` 为准）

### 修正前错误（旧文档中混入了不属于当前关卡的内容）
- 物体：bowl、plate、bottle、milk、cereal、cup/plate 泛称等
- 容器：fridge、cabinet、sink、food-waste container 等
- Golden Path 各种教学路径不一致

### 修正后（代码真实发生，3 物体 + 4 容器）

**物体（3 件，`clean-table.ts` L82-L113）：**
1. `obj-dirty-cup`（脏杯子，category=cup，x=-0.6 餐桌左侧）
2. `obj-tissue`（餐巾纸，category=tissue，x=+0.6 餐桌右侧）
3. `obj-fork`（叉子，category=fork，x=0 z=-0.3 餐桌下方）

**容器（4 个，L116-L168）：**
1. `cnt-dining-table`（餐桌，acceptedCategories=[]，isTargetZone=false，表面容器）
2. `cnt-dishwasher`（洗碗机，acceptedCategories=['cup']，isTargetZone=true，杯子放这里）
3. `cnt-trash-bin`（垃圾桶，acceptedCategories=['tissue']，isTargetZone=true，餐巾纸扔这里）
4. `cnt-utensil-rack`（餐具架，acceptedCategories=['fork']，isTargetZone=true，叉子放这里）

**已彻底从 L1 描述中删除的内容（均不在 clean-table.ts 当前配置中）：**
- bowl、plate、bottle、milk、cereal（5 件物体）
- fridge、cabinet、sink、food-waste container（4 个容器）
- 任何与上述 9 项相关的目标/步骤描述

**L1 Golden Path 固定为（§三 要求）：**
```
观察餐桌（3 件物）
  → E 保存至少一条位置记忆
    → 看见记忆槽变化（HUD 槽图标、文本、颜色闪一下）
      → F 拾取 1 件
        → F 放入正确目标容器（杯→洗碗机 / 纸→垃圾桶 / 叉→餐具架）
          → 重复直至完成三件归位
            → Probe（p-cup-location / p-trash-destination / p-fork-destination，任务结束后发生）
              → Result
```

---

## 3. L2 事件 ID 与 Golden Path 修正

### 3.1 猫事件 ID 纠正

| 修正前（旧文档错误写法） | 修正后（代码真实事实） | 证据 |
|---|---|---|
| `se-cat-moves-key` | **`se-cat-pushes-key`**（全文统一，不得再出现旧 ID） | `src/data/tasks/leave-home.ts` L285：`id: 'se-cat-pushes-key'`；同文件 L223 goal predicate 用 `triggeredEvents.has('se-cat-pushes-key')`；`commands.ts` L98 L135 均引用正确 ID |

### 3.2 se-cat-pushes-key 实际效果（逐项核实，仅写代码真实发生）
- 类型：`move-entity`
- 移动物体：仅 `obj-key`（钥匙）
- 目标位置：从茶几表面 → living room world `x=-3.2, y=0, z=-3.2`（客厅西北角，沙发侧）
- 触发条件（L286-297，两条满足任一即触发，且均要求 `keyFree=true` 即钥匙不被 hold、仍在客厅 free 状态）：
  - 条件 A：钥匙记忆 fresh + 钥匙 free + 玩家已离开客厅（currentRoom !== living）
  - 条件 B：钥匙 free + 玩家已取得手机（hasPhoneObtained(ctx)==true，不限于是否存过钥匙记忆）
- 副作用：
  - 消息：`🐱 啪嗒——钥匙猫扒拉了你的钥匙！它不在原来的位置了…客厅西北角（沙发侧）找找？按 E 更新记忆吧。`
  - `markMemoryOutdated(obj-key)`：所有 obj-key 相关记忆槽标记 outdated=true
  - 视觉：cat-prints + toast type='cat'
- **不发生的行为（本报告明确排除，不写入文档）：**
  - 不移动茶几、不交换家具、不生成或显示神秘物品

### 3.3 Golden Path 固定为（§四 要求，允许手机/雨伞顺序交换，但每次拾取下一件前必须先腾手）

```
[Phase 1 · 建立信念 + 前两件归位]
  living 出生 (0, -1.5)
    → 观察茶几钥匙
      → E 保存"钥匙在茶几上"（obj-key surface=cnt-coffee-table）
        → 钥匙留在茶几保持 status=free（确保 se-cat-pushes-key 触发条件满足）
          → 去 bedroom：F 开床头柜抽屉（cnt-nightstand initialOpen:false → open:true）
            → F 取 obj-phone
              → 去 entrance：F 把手机放入 cnt-entrance-tray（目标区）→ 腾出手（合法腾手 #1）
                → [分支 A：继续伞] F 取 obj-umbrella（伞架）→ F 放入 cnt-entrance-tray → 腾出手（合法腾手 #2）
                → [分支 B：先伞再手机，也允许，但每次拾取下一件前必须先腾手]
                  （允许手机/雨伞互换顺序，但"拾取下一件前先腾手"规则必须满足）

[Phase 2 · 环境扰动]
  触发 se-cat-pushes-key（钥匙 free 时发生；猫脚印效果；钥匙移到 living -3.2,-3.2）
    → markMemoryOutdated(obj-key) 钥匙记忆槽 outdated=true
      → 玩家视觉：记忆槽显示"已过期"状态
        → 硬约束：未更新钥匙记忆时不得进入最终成功
          （STAGE_ID_FINALIZE entryCondition 要求 catFired + hasKeyFreshMemory + memoryUpdateCount>=1；
           executePlace 中 key->tray 在 catFired && !keyFresh 时直接拒绝："先更新钥匙记忆，再完成出门准备。"）

[Phase 3 · 发现差异 + 更新记忆 + 腾手调度]
  玩家回 living 茶几 → 发现"茶几上空"或钥匙不在记忆位置
    → 合法选择：
      A：继续相信记忆 → 撞空 → 游荡 → 最终"游荡超时"失败（研究失败样本，不推荐）
      B：重新搜索 → 发现西北角 → E 更新钥匙记忆（覆盖或新槽位，memoryUpdateCount++）
      C：手里仍有物品时 → 先放回 cnt-entrance-tray / 茶几 / 合法容器腾手，再拿钥匙
        → 大多数玩家应走 B +（必要时）C

[Phase 4 · 恢复并完成]
  F 拾钥匙（新位置 status=free）
    → 钥匙放入 cnt-entrance-tray
      → 完成
        → Probe（任务结束后）
          → Result
```

### 3.4 明确禁止的目标流程（不得作为有效策略写入文档；不破坏研究闭环）
1. 保存钥匙 → F 立即拿钥匙 → 再拿手机/雨伞（不做任何腾手动作，直接拿第二件）
   → 手持 1 硬约束会挡住：pickEntity 时 `if (heldEntityId) return {success:false, reason:'手里已经拿着东西了'}`（entitySlice.ts L32）
2. 手机还在手里直接拿雨伞；雨伞还在手里直接拿钥匙
   → 同上，手持 1 硬约束挡，必须"放回 → 腾手 → 再 pick"
3. 猫事件触发后**不更新钥匙记忆**，直接把钥匙放入玄关托盘并成功进入 Finalize
   → 代码硬拦（§3.3 中 entryCondition + executePlace 双重拒绝），不允许绕过

### 3.5 "提前拾取钥匙不得设计成 90% 失败"的正确要求（§二 统一标准）
- **正确要求（统一写入文档）**：
  1. 提前拾取钥匙时有明确反馈为什么当前不应拿：toast / HUD objective 提示（例如 commands.ts L84-L110 的分支返回 reason 文案，或 L2 stage obj 文字，如"先去卧室拿手机/雨伞、出门前最后拿钥匙更顺"或"钥匙还在茶几上先不着急拿，否则猫就不会捣乱了——你可以放回茶几再试试"等）；
  2. 玩家可以**放回合法位置**（cnt-coffee-table 茶几表面 或 cnt-entrance-tray 玄关托盘 等合法容器/表面），不硬卡关；
  3. 放回后**钥匙恢复 status=free**；
  4. 猫事件 se-cat-pushes-key 仍可在**后续**满足条件时触发（不因为玩家曾拿过钥匙就永久禁用）；
  5. 不形成不可恢复软锁；
  6. 自动验收：**3/3 提前拿钥匙路径**（拿了钥匙→再拿手机失败、拿了钥匙→去 entrance 放托盘、拿钥匙→放回茶几）均可以恢复；**0 个不可恢复软锁**。
- **禁止写法（§二 已全部删除）**："提前拾取钥匙 90% 失败"、"提前拾取钥匙失败率 ≥ 90%"、"硬卡关不让拿"等不提供恢复路径的设计。

---

## 4. L3 Probe / Mystery Shirt / 扰动修正

### 4.1 Probe 时机纠正

| 修正前（旧文档错误策略描述） | 修正后（代码真实事实） |
|---|---|
| "S4 Probe 辅助策略：游戏中靠 Probe 答案补记忆、恢复分类" | **Probe 只在任务结束后发生，游戏中不存在 Probe。** `laundry-sort.ts` L389-L427 定义的 probes 数组由 ProbePage `/probe/:taskId` 在任务完成后读取；不存在"游戏内答题补记忆"机制。→ 彻底删除 S4 Probe 辅助策略的描述。 |

### 4.2 神秘衬衫（obj-mystery-shirt）纠正

| 修正前（旧文档错误描述） | 修正后（代码真实事实） |
|---|---|
| "袜子幽灵 step=7 时变出神秘衬衫（脚本事件生成/show/create）"、"mystery shirt 通过 se-mystery-item-appears 创建" | **obj-mystery-shirt 是 initial object，从一开始就存在。**<br>证据：`laundry-sort.ts` L168-L176 直接在 `objects` 数组中定义：id=`obj-mystery-shirt`，category=`white-clothes`，initialPosition=`x=-2.7,z=1.4`，初始就在白堆旁边。<br>`se-mystery-item-appears`（L323-L329）**仅为 message 类型**，不做 show/create/生成任何物体行为，只是提示玩家"哦这里多了件彩色衬衫"。<br>→ 不得写为"脚本事件生成"，除非后续源码新增实际 show/create event（当前未发现）。 |

### 4.3 se-cat-moves-towel 实际效果逐项核实（仅写代码真实发生的行为）

`laundry-sort.ts` L291-L301：

| 维度 | 实际行为（代码真实） | 未发生的行为（明确排除） |
|---|---|---|
| 是否移动毛巾？ | **是，但仅移动小方巾 obj-towel-small 一件（L294 targetId=`obj-towel-small`）** | 不移动大浴巾 obj-towel-large；不移动其他任何毛巾/衣物 |
| 移动到哪里？ | laundry room world `x=-3.0, y=0.05, z=1.4`（白色篮子附近，白堆 x=-3 列） | — |
| 是否交换篮子？ | **否**（type=move-entity，targetId=毛巾，不是 basket；代码中无任何 swap basket 位置的行为） | 不交换 cnt-white-basket / cnt-dark-basket / cnt-towel-basket 三个 basket 的 ContainerSpec.position |
| 是否生成或显示神秘衬衫？ | **否**（se-cat-moves-towel 不含任何 object create / show 动作；obj-mystery-shirt 本来就在 objects 数组里） | 不生成、不显示 mystery shirt |
| 触发条件是什么？ | 固定 `step === 9`（L292 trigger: step => step===9） | 不基于 RNG、不基于 seed；与玩家行为无关的纯 step 阈值触发 |
| 其他副作用 | message 提示 + cat-prints 效果 + toast type=cat + memory type 关联标记为 spatial | — |

补充：同关其他扰动的实际行为，确认不扩大扰动范围：
- `se-cat-moves-clothes` L279-L289：step=5，仅移白袜子 obj-white-socks → 毛巾篮附近
- `se-cat-hides-dark-socks` L303-L313：step=13，仅移黑袜子 obj-dark-socks → 洗衣机后 x=-1.5,z=1.6
- `se-baskets-swapped` L315-L321：step=16，**仅 message，无实际 move baskets**（type=message，无 targetId 无 position）
- `se-time-warning` L349-L356：step=18，仅 message
- `se-celebrate-progress` L358-L386：触发条件"完成任一类（4白/3深/2毛巾）且 step>5"，仅 message

### 4.4 "错放后无法取出"标记为待核查假设（不规划新增 L3 专属取回命令）

事实核实现状：
1. **错误类别放置时 executePlace 的行为**（entitySlice.ts L111-L141）：
   - L125-L141：当 `!isAccepted` 时，函数**直接返回 {success:false, reason:friendlyMsg}**，并执行扣分、扣混乱、shake、错误 toast；
   - **heldEntityId 保持不变**（未执行后续的 clearHeld / set entity.status=placed）。
   - → 结论：**错类别放置时，玩家手里仍拿着物品，不算"放进去了"，所以不存在"从容器里取回"的问题。**
2. **正确放置后能否重新 pick 回手持？**
   - `pickEntity`（entitySlice.ts L30-66）逻辑：
     - 只检查 heldEntityId、物体不存在、不在当前房间、status=hidden（hidden 物体需要开抽屉）；
     - **没有显式禁止 `status=placed` 的物体被 pick**；但也未看到专门的"pick from container"分支。
   - **未核实**：interactionTargets 系统 / F 键交互圈是否在物体已 placed 时仍高亮；UI 是否允许再次 F。
   - **未核实**：pickEntity 中后续的状态是否正确处理 `status=placed` 物体（是否清除 placedIn、更新 containerStates.containedIds）。

→ **本轮结论（§五 要求）**：
   - "错放后无法取出"目前只标记为**待代码进一步核实的假设**（仅"正确放置后能否取回"部分存疑，错类别放置的情况已核实为 heldEntityId 保留）。
   - 在没有完整代码证据前，**不得规划新增 L3 专属取回命令**，不得在文档中写"P4 新增 pick-from-placed API"作为必须项。
   - 如果 P4 验证发现"正确放置后取回"确实失败，再作为 Bug 记录到 gap report（当前 gap report 已按 §五 要求标记 G-L3-1 为待核查假设）。

---

## 5. Seed 定义修正

### 5.1 修正前错误定义
- 散落写成"session id 可作为 seed"、"step 触发扰动即近似可复现"、"Date.now() + random 作为 seed"等
- 未定义 reproducible seed 的硬条件

### 5.2 修正后定义（§八 强制要求 + §四 统一 P0.2，只有同时满足以下三点才能称为 reproducible seed）

```
reproducible seed ⟺
  (1) 独立 seed 字段进入 Session 中（即 SessionData 结构中存在独立 seed 字段，非 session id 或其他随机字段）
  AND
  (2) 所有随机机制（猫事件 / 衣物扰动 / 任何非确定性 step/state 触发的概率性机制）消费同一个 seedable RNG（如 mulberry32、alea，可由 seed 复现完整随机序列）
  AND
  (3) 相同 task_version + scene_version + seed + command_sequence ⇒ 能复现状态演变（相同扰动在相同 step/玩家行为下 1:1 复现）
```

### 5.2.1 复赛允许二选一（A/B 方案，禁止伪 Seed 中间方案）
- **方案 A = NOT_NEEDED_FOR_SEMIFINAL**：保持当前确定性 step / state 触发（不引入 seed 字段；扰动仍基于 step 阈值或 player state 组合触发）；Session 中 seed 字段可写 `NOT_NEEDED_FOR_SEMIFINAL` 或不存在。
- **方案 B = 完整实现 reproducible seed 三条件**：完整实现 (1)(2)(3) 三条件。
- **禁止的伪 Seed 中间方案（全文删除，不得再出现）**：
  - 用 `Date.now() + random` 在 session start 时写入一次当 seed；
  - 把随机 UUID 的 session id 改名叫 seed（或声称 session id 可作为 seed）；
  - "写一个随机数字"就声称"任务可复现"；
  - 任何只满足 (1) 不满足 (2)(3) 的中间方案。

### 5.3 当前状态 = MISSING（三点均不满足 + 未选择复赛方案，不得声称可复现）
- **条件 (1) 不满足**：`src/types/session.ts` L114-L154 的 SessionData 接口中**无 seed 字段**（仅有 id、episode_id，两者是随机 UUID，不可作为 seed）；SaveData 无 seed。
- **条件 (2) 不满足**：源码中未引入任何 seedable RNG 封装；所有 scriptedEvents 触发条件均基于 step 阈值（leave-home 的 se-cat-pushes-key 基于行为但非 RNG；laundry-sort 的 6 个扰动全基于 `step === N`）或基于 player state 组合，但不基于统一 seed 随机数序列。未见 mulberry32 / alea 等常见 seedable RNG。
- **条件 (3) 不满足**：因为 (1)(2) 都不存在，所以无法验证复现性。
- 猫事件 / 衣物扰动**基于 step 阈值触发或 step 阈值 + 行为触发**，不基于 seed 随机。

→ **不得把 session id 称为"seed"**；**不得在任何产品/研究文档中声称"任务可复现"或"session seed 提供可复现实验"**。gap report R-05 / MVP-02 均标 MISSING，实施计划 P5 才处理。

---

## 6. 路线图提交节奏修正

### 6.1 修正前错误
- P2 禁止事项原第 7 条：`commit / push（P2 仍属于中间版本，P2 全段 + P3 通过后再考虑一次合并提交）`
- Golden Path 中散落出现"P2 + P3 完成后一次性提交"

### 6.2 修正后（§十 强制要求，逐阶段独立 commit）

独立 commit 节奏（每个阶段验收通过后单独一个 commit；不得合并跳过）：

| 阶段 | 触发 | commit 内容范围 |
|---|---|---|
| P0.1 | 本文档 + 5 份文档全部通过自动验收（321 tests 通过 / src diff 0 / README diff 0）+ 人工验收（8 项全过） | 仅 docs 变更（6 份文档，不含 src/tests/scripts/README） |
| P1 | L1 教学闭环小规模内部试验通过（开发者 2 次 + 3 陌生用户 2/3 比例等） | 仅 L1 教学相关 + 可能的 dining SV 修改（不触碰 L2/L3） |
| **P2.1 Living** | Living 空间正确性验收通过（自动 4 项 + 人工 5 项全过） | 仅 Living 相关文件（decorFurniture.living 等） |
| **P2.2 Bedroom** | Bedroom 空间正确性验收通过 | 仅 Bedroom 相关文件（decorFurniture.bedroom + leave-home 的 cnt-nightstand 等） |
| **P2.3 Entrance** | Entrance 空间正确性验收通过 | 仅 Entrance 相关文件（leave-home 的 tray/umbrella-stand + 必要的 Room3D 小范围） |
| P3 | L2 认知与长程任务闭环验收通过 | 仅 L2 认知闭环相关修改（memory HUD / leave-home 任务提示 / failureReasons 细化等，不触碰 L1/L3） |
| P4–P8 | 按后续实施计划，每完成一个里程碑独立 commit | 严格按 scope 限制 |

→ **彻底删除** "P2 + P3 完成后一次性提交" 的所有描述。实施计划 P2 禁止事项 7 已改为"commit / push 合并跳步"不允许；P3 停止标准末尾已明确写"通过后：P3 独立 commit"。

---

## 7. 所有仍待代码核实的假设

> 本轮 P0.1 只纠正事实，不修改代码验证。以下假设在进入对应工作包（P1/P3/P4/P5）**之前必须先核实现状**，避免文档错误继续扩散。

| 编号 | 待核实假设 | 影响工作包 | 核实方法（不修改代码） | 当前 P0.1 暂定结论 |
|---|---|---|---|---|
| H-COMMANDS-1 | **正确放置（category accepted）的物体，能否再次 F pick 回手持？**（错类别放置已核实为 heldEntityId 保留，无需取回） | P4 L3 的错放恢复审查 | (a) QA 真人试玩 L3：将一件白衬衫正确放入 cnt-white-basket 后，再靠近篮子按 F 是否能重新拿起来；(b) 读 interactionTargets + F 键处理逻辑，确认 placed 状态的 object 是否仍进入交互目标列表 | **待核实（gap report G-L3-1 已标）**。P0.1 不规划新增取回命令。 |
| H-COMMANDS-2 | `commands.ts` L84、L97 中 L2 的 `stage-observe-key` / `stage-update-key-memory` 两个 stage id 在 leave-home 实际不存在（实际 stages 是 `stage-observe-fetch` / `stage-key-outdated` / `stage-finalize`）。→ 这两个分支**永远不会命中**，是否存在"提前拾取钥匙完全不被拦截"的问题？ | P3 L2 认知闭环的"提前拿钥匙"反馈 | 对比 commands.ts L82-111 的 stage id 检查分支与 leave-home.ts L9-11 的 stage 常量定义 | **P0.1 已发现不一致（分支条件永不命中）**。不修改代码，只记录为 P3 必须前置处理的事实（原 commands.ts 预期在 stage 上做拦截，但 stage id 不匹配导致实际未生效；当前只有 place 时 key->tray 在猫事件+非 fresh 时被拦）。 |
| H-MEMORY-1 | memorySlot 的 outdated=true 在 HUD 上是否有**肉眼明显可见**的视觉反馈（颜色/边框/过期图标/灰化/抖动）？ | P3 L2 认知闭环（玩家必须"看出来旧信念过期"才会主动 Verify） | 读取 HUD 记忆槽 UI 代码（MemorySlots.tsx / MemorySlotItem 等组件，是否基于 outdated flag 渲染不同样式） | **待 P1/P3 前核实**。当前 V2 文档假设"应有明显过期视觉"，但未读 UI 代码确认。 |
| H-L3-PROBE-1 | `laundry-sort.ts` 的 Probe `p-count-white` L391-L398 correctAnswer='3'，但 `whiteAllPlaced(ctx)` 判定的是 **4 件**（obj-white-shirt / obj-white-socks / obj-white-towel-small / obj-mystery-shirt）。→ Probe 答案 3 与任务判定 4 不一致，属于 SV7。 | P4 L3 策略分化（若 Probe 与任务判定不一致，玩家会被误导） | 对比 laundry-sort.ts L18 `whiteIds = [4 件]` 与 probes L395 `correctAnswer: '3'` 以及 options 为 ['2','3','4','5'] | **P0.1 已确认不一致（gap report G-L3-6 已标 SV7）**。P0.1 不改 Probe，只记录。 |
| H-L3-BUDGET-1 | 9 件物天然 x=-3/0/+3 三列分区（白 x=-3，深 x=0，毛巾 x=+3），神秘衬衫也在 x=-2.7 白堆旁 → S3 全抓派（完全不按 E 存记忆，只看颜色/分区 pick/place）是否能高概率通关？槽 3 的预算压力是否未真正触发？ | P4 L3 策略分化 S1/S2/S3 ≥ 3 类可分 | P4 真实玩家试玩后，用 session JSON 聚类：(a) 按 totalMemories 分是否 ≥ 3；(b) 按 firstSaveBeforeFirstPick ratio；(c) 手动看 strategy_cluster_label 是否 3 类可分 | **待 P4 真实玩家观察后判定**。如果 S3 占 > 80%，则考虑轻量打散，否则保留现状（P0.1 不做）。 |
| H-L3-SEED-1 | scriptedEvents 扰动全部基于 step 阈值（5/7/9/13/16/18）+ celebrate 基于行为，当前完全不依赖随机数。→ P5 接入 seedable RNG 时需要把哪些 trigger 从"固定 step"改为"RNG + 范围 step"？当前留多少 RNG 接入点合适？ | P5 seed 最小研究契约 | 在 P5 前讨论：扰动改为固定 step + seed RNG 小范围 jitter，还是完整改成 seed RNG 触发概率 | **待 P5 设计决定**。P0.1 只标记状态为 MISSING，不做设计。复赛允许选方案 A（NOT_NEEDED_FOR_SEMIFINAL，保持 step 触发，不引入 seed）。 |
| H-L3-EVENT-ID-1 | **se-cat-hides-sock vs se-cat-hides-dark-socks 的 ID 一致性已核实（源码事实，§八 统一）**：`se-cat-hides-sock` @ step=9 = **message only**（猫往洗衣机后面钻 + 布料摩擦声，不实际移动任何物体）；`se-cat-hides-dark-socks` @ step=13 = **move-entity 实际移动物体**（obj-dark-socks → 洗衣机后 x=-1.5,z=1.6）。六份文档中不得把这两个 ID 混用，不得出现多个不同的黑袜子事件 ID。 | P4 L3 扰动逐项核实 + 跨文档 ID 一致性 | 对比 laundry-sort.ts L303-L313（se-cat-hides-dark-socks，type=move-entity）与 L331-L341（se-cat-hides-sock，type=message 无 targetId 无 position） | **P0.2 已核实为源码真实事实，两份事件 ID 不同且行为不同。六份文档已统一：移黑袜子的真实 ID = se-cat-hides-dark-socks；se-cat-hides-sock = message only。** |
| H-SV-INVALID-1 | SessionData 中目前**无 `build_version` / `task_version` / `scene_version` 字段**（gap report R-01-R-04 全 MISSING），所以版本级 QA 的 version 三元组无法和 Session 绑定。→ P5 新增字段前，如何人工标注一个 Session 的 build/task/scene version？ | 所有研究数据的 spatial validity 继承 | 采用"附件 QA 认证 JSON + session id 手动对齐"的临时方案（P0.1 已在 spatial_validity_contract §5.3/5.4 定义） | **已用附件方案记录（不修改 Session 类型）**。P5 再补字段。 |
| H-INTERACTION-1 | Q 键在 commands.ts / 键盘处理代码中完全无生产功能（README 的游戏操作表也没 Q），确认 Q 键彻底未使用（debug 绑定也未挂 Q？） | 本文件 §六 的输入说明 | 全局 Grep src 下所有 `KeyQ` / `'KeyQ'` / `key === 'q'` 等绑定 | **P0.1 已基于 README 和 commands.ts 确认 Q 无生产功能**，已从玩家层输入语言删除。如有 debug 层使用，不影响玩家层声明。 |

---

## 8. 输入说明纠正（§六 要求）

### 真实按键（仅保留 README.md §"游戏操作"与当前生产代码实际存在且可使用的）

| 功能 | 按键 | 证据 |
|---|---|---|
| 移动 | `WASD` / 方向键 | README L43；FirstPersonControls 实际消费 |
| 调整视角 | 鼠标移动（自动跟随）或按住左键拖动 | README L44 |
| 缩放视野 | 鼠标滚轮 | README L45 |
| 释放/锁定鼠标 | `Esc` 释放，点击画面重新锁定 | README L46 |
| 切换第一人称/俯视 | `V` | README L47 |
| 保存或更新附近物体记忆 | `E` | README L48；commands.ts executeSaveMemory；memorySlice.saveMemory |
| 拾取、放置、打开或关闭容器 | `F` | README L49；commands.ts executePick / executePlace / executeToggleContainer / executeContainerInteraction |
| 显示/隐藏任务面板 | `Tab` | README L50 |
| 显示/隐藏事件日志 | `R` | README L51 |
| 显示/隐藏辅助 HUD | `H` | README L52 |

### 已删除的按键
- **Q：确认无生产功能**。commands.ts / memorySlice / README 游戏操作表中完全不存在 Q 键。已从 Product V2 玩家层输入语言中删除。
- 任何其他未在上面表格列出的按键（如 P、C 等），如果未在 README 游戏操作表中声明，统一不进入 Product V2 玩家层输入语言。

---

## 9. 研究验收标准修正（§七 要求）

### 9.1 P1 小规模内部试验（3 陌生用户 + 2 开发者，不是 10 人）
- **开发者**：自然通关 L1 × **2 次**（非 Debug、不使用瞬移）
- **陌生用户**：**3 名**（非开发者、第一次玩游戏）
- **陌生用户比例要求（明确人数，不用百分比）**：
  - 至少 **2/3** 不看帮助完成首次 E（不阅读额外文档、不看源码、仅 briefing + 通用帮助）
  - 至少 **2/3** 完成 L1 通关（含失败重试 ≤ 3 次；使用引导文字也允许）
- **未在 P1 出现的要求（全部移到 P7）**：
  - 10 人规模试玩
  - 5 名普通玩家
  - 2 名 AI/机器人学习者

### 9.2 P7 最终 5+2 试玩（统一放 P7，不在 P1 重复）
- **5 名普通玩家 + 2 名 AI/机器人学习者 = 7 人**
- P7 章节已明确写：7 人规模；验收标准 L1 ≥ 5/7 首次通关、L2 至少 3/5 普通走 Golden Path、L3 普通人通关率 ≥ 4/7
- 文档中所有"P1 要 10 人"等字样已删除

### 9.3 L2 / L3 百分比指标改为明确人数（样本 < 10 时）
- 原：L2 "至少 40% 玩家回 living 搜索" → 现：`至少 2/5 陌生用户`
- 原：L3 "至少 60% 玩家执行再观察" → 现：`至少 3/5 陌生用户`
- 原："mystery shirt 正确分类率 80%" → 现：`至少 3/5`
- 所有无法解释的 20%、30%、40% 等散落在文档中的百分比已改为具体人数比例（如 2/5、3/5）

---

## 10. git diff --stat

```
（说明：当前工作目录下本批 6 份文档均为未跟踪的新文件/目录（untracked files），
 git diff 仅对比 tracked + staged 与 HEAD 之间的差异。
 因此 `git diff --stat` 的输出为空（0 行改动，因为所有变更都在 untracked 状态）。
 实际的文件级改动清单见下方 §11 git status。）

$ git diff --stat
（无输出）
```

---

## 11. git status

```
$ git status
On branch main
Your branch is up to date with 'origin/main'.

Untracked files:
  (use "git add <file>..." to include in what will be committed)
        docs/LEAVE_HOME_LAYOUT_FACT_CHECK.md
        docs/design/00_product_research_game_design_v2_draft.md
        docs/design/product_v2_fact_correction_report.md
        docs/design/product_v2_gap_report.md
        docs/design/spatial_validity_contract.md
        docs/design/three_level_research_game_matrix.md
        docs/roadmap/

nothing added to commit but untracked files present (use "git add" to track)
```

- **src/ 目录 diff：0 行**（未修改任何源码）
- **tests/ 目录 diff：0 行**（未修改测试）
- **scripts/ 目录 diff：0 行**（未修改脚本）
- **README.md diff：0 行**（未修改 README）
- 未执行任何 commit / push

---

## 12. 本轮修改的五份文档 + 一份新增报告清单（共 6 份）

| # | 文件 | 主要修改点 | 引用事实源 |
|---|---|---|---|
| 1 | `docs/design/00_product_research_game_design_v2_draft.md` | 槽 4→3；L1 物体/容器真实 3+4；L2 事件 ID 统一 se-cat-pushes-key + 腾手流程；L3 扰动逐项核实 + Probe 仅任务结束 + mystery shirt 为 initial object；输入说明删 Q；空间认证改为版本级；seed=MISSING；删除所有不可能策略 | levelBalance / clean-table / leave-home / laundry-sort / memorySlice / commands / README |
| 2 | `docs/design/three_level_research_game_matrix.md` | L1 彻底删 bowl/plate/bottle/milk/cereal/fridge/cabinet/sink/food-waste；L2 Golden Path 固定腾手流程 + 禁止捷径；L3 se-cat-moves-towel 逐项行为；Probe 不游戏中；错放取回标待核；停止标准改人数；神秘衬衫 initial；S4 Probe 策略删除 | clean-table / leave-home / laundry-sort / entitySlice |
| 3 | `docs/design/product_v2_gap_report.md` | seed R-05=MISSING 三点定义；G-L3-1 错放恢复标"待核查假设不新规划 API"；P7 5+2 移动；空间有效性认证方式改为版本级 §7；所有百分比改人数 | levelBalance / session.ts / entitySlice |
| 4 | `docs/roadmap/product_v2_implementation_plan.md` | P1 验收 3 陌生用户 + 2/3；P7 5+2；P2 提交节奏拆 Living/Bedroom/Entrance 各独立 commit；P3 独立 commit；删除 P2+P3 一次性提交；P2 禁止 7 改为禁止合并跳步；P5 seed 三点定义=MISSING | 产品约束 §十 / §七 / §八 |
| 5 | `docs/design/spatial_validity_contract.md` | §5 整段改为"版本级 QA 认证优先，普通 Session 继承 certification，4 类 invalid 单独剔除"；§7.1 七条件执行粒度改为版本级全人工 + 普通 Session 继承 + ≥5% 抽样；研究对外声明规范更新 | 产品约束 §九 |
| 6（新增） | `docs/design/product_v2_fact_correction_report.md`（本文件） | 8 项修正（记忆槽 / L1 物体容器 / L2 事件流程 / L3 Probe+衬衫+扰动 / Seed 定义 / 提交节奏 / 输入说明 / 研究验收）+ 7 条仍待代码核实的假设 + git diff --stat + git status | 以上所有事实源综合 |

---

**本轮 P0.1 FACT CORRECTION 停止。**

禁止修改范围确认：
- 未修改 src/ 下任何文件
- 未修改 tests/ 下任何文件
- 未修改 scripts/ 下任何文件
- 未修改 README.md
- 未修改布局 / 任务 / 碰撞 / 材质 / 模型
- 未 commit
- 未 push
- 未扩写新的产品概念（仅纠正事实）

下一步：按 P0.1 停止标准执行自动验收（npm run test / src diff 0 / README diff 0）+ 人工 8 项，通过后 P0.1 独立 commit，再进入 P1。
