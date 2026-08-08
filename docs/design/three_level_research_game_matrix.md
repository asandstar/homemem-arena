# 三关研究游戏矩阵

> ⚠️ **历史研究快照 / 已废弃**：本文记录旧的“脏杯/纸巾、钥匙手机雨伞、衣物分类”实验方案，与当前运行时代码不一致。当前产品与研究梯度统一以 [当前公开三关设计](levels.md) 为准。

版本：Product V2
冻结基线：docs/LEAVE_HOME_LAYOUT_FACT_CHECK.md（A–D 节）
范围：task-clean-table / task-leave-home / task-laundry-sort（公开 scope 三关；不含 breakfast / night-patrol）

> 本矩阵仅为产品定义 + 事实基线映射；**不修改任何源码、布局、碰撞、任务配置。**

---

## 0. 三关对照总览

| 层级 | 任务名 | 房间 | 目标物数 | 容器数 | 外部扰动 | 工作记忆预算（默认槽 3，唯一事实源：DEFAULT_LEVEL_BALANCE.memorySlotCount = 3） | 研究问题 |
|---|---|---|---|---|---|---|---|
| L1 | task-clean-table | dining（单房间） | **3**（脏杯子 / 餐巾纸 / 叉子） | **4**（cnt-dining-table + cnt-dishwasher + cnt-trash-bin + cnt-utensil-rack） | 轻量 / 无 | 槽 3 = 物 3（预算临界；可 1 件 / 1 槽，覆盖行为会出现） | **观察如何形成能够支持后续操作的工作记忆？** |
| L2 | task-leave-home | living → bedroom → entrance（3 房间） | 3（钥匙、手机、雨伞） | 4（茶几 / 床头柜 / 伞架 / 玄关托盘） | **1 次强扰动：se-cat-pushes-key（钥匙 free 时猫推到 -3.2,-3.2）**；手机响铃（se-phone-ringing） | 槽 3 = 物 3（严格临界：锁定任意 1 条都不会让其余 2 条被覆盖，但跨房间 + 顺序依赖会让玩家"是否存、存什么、何时覆盖"成决策） | **环境变化后，代理怎样发现旧信念失效，重新观察、更新记忆并恢复长程任务？** |
| L3 | task-laundry-sort | laundry（单房间） | 9（白/深/毛巾 3 类 + 1 神秘衬衫 = 白类第 4 件） | 3（白/深/毛巾篮） | **实际扰动（以代码为准，ID 统一使用源码真实 ID）**：se-cat-moves-clothes(白袜子→毛巾篮附近) @ step=5（move-entity）；se-mystery-item-appears(message only) @ step=7；se-cat-moves-towel(小方巾→白篮附近) @ step=9（move-entity 仅 obj-towel-small）；se-cat-hides-sock @ step=9（**message only**："听见猫往洗衣机后面钻"+布料摩擦声，不实际移动任何物体）；se-cat-hides-dark-socks @ step=13（**move-entity，实际移黑袜子 obj-dark-socks → 洗衣机后 x=-1.5,z=1.6**，不是 se-cat-hides-sock 移的）；se-baskets-swapped(message only，**无实际 move baskets**) @ step=16；se-time-warning @ step=18；se-celebrate-progress（每类完成时 message only） | 槽 3 << 物 9；**但必须审查：玩家是否真的需要逐物体记忆，还是只要记住类别（白/深/毛巾）+ 区域（x=-3/0/+3 三列）就能完成。** | **目标数量超过工作记忆预算时，代理如何分配记忆预算和安排多目标顺序？** |

---

## L1：Level 1 · task-clean-table

### 研究问题
> **观察如何形成能够支持后续操作的工作记忆？**

### 目标 Golden Path 体验（V2 固定，以 clean-table.ts 实际 3 物体 + 4 容器为准）

**L1 当前真实物体（3 件，删除所有不属于当前关卡的：bowl / plate / bottle / milk / cereal / fridge / cabinet / sink / food-waste container（这些不在 L1 配置中）**
```
出生点（dining，默认 spawnPosition x=0 z=-2.5；spawnRotation=PI）
  ↓
观察餐桌（cnt-dining-table）上的 3 件物体（WASD 走动 / 鼠标 / 摇杆旋转视角）
  • obj-dirty-cup （脏杯子，x=-0.6 餐桌左侧）
  • obj-tissue    （餐巾纸，  x=+0.6 餐桌右侧）
  • obj-fork      （叉子，    x=0 z=-0.3 餐桌下方）
  ↓
观察（看清楚 3 件物品的位置和分类）
  ↓
E 保存至少一条位置记忆（HUD 记忆槽立即变可见 / 闪一下槽位）
  ↓
明确看见记忆槽变化（槽图标 + 文本 + 颜色；槽数=3 格）
  ↓
F 拾取 1 件（例如脏杯子）→ 手持 1（单手持硬约束）
  ↓
F 放入正确目标容器（cnt-dishwasher [cup] / cnt-trash-bin [tissue] / cnt-utensil-rack [fork]）
  ↓
重复直到 3 件归位（脏杯→洗碗机、纸巾→垃圾桶、叉子→餐具架，完成三件归位）
  ↓
Probe（p-cup-location / p-trash-destination / p-fork-destination）
  ↓
Result（拾取时间、错误放置、记忆命中、Probe 正确率）
```

### 机器人研究概念映射（以实际 3 物体/4 容器为准）

| 概念 | L1 对应用户行为（只保留当前关卡真实存在的） | 当前指标（来自 SessionMetrics） |
|---|---|---|
| Sensory → WM encoding | 接近目标（obj-dirty-cup / obj-tissue / obj-fork 其中之一）→ E 编码 | repeatedSearchCount；totalMemories；firstSaveBeforeFirstPick ratio（候选） |
| Picking primitive | F 拾取（commands.executePick） | actionSuccessRate；wrongPlacements；containerMistakes |
| Placing primitive | F 放置到目标容器（含 acceptedCategories 校验：cup→dishwasher、tissue→trash、fork→utensil-rack） | wrongPlacements L23；containerMistakes L24 |
| Goal monitoring | 观察 TaskList 进度条 / 3 个 stage（observe-table → sort-cup-tissue → finalize-fork）阶段推进 | goalsAchieved / goalsTotal L13-L14；stage transition times（派生） |
| Failure recovery (soft) | 放错 → 从错误容器能否回手持（假设待核：commands GAP 见 gap report G-COMMANDS-1）→ 再放正确容器 | failureReasons L33 category: wrong-container/missed-object |

### 当前实现的硬差距（**本文件只列 gap，不改源码**）

| # | Gap | 来源 / 事实 | 严重度 |
|---|---|---|---|
| G-L1-1 | 教学顺序倒置：stage observe-table 的 completionCondition 要求「先存在记忆」，但 scriptedEvents 在 step=2 先提示「F 拾取脏杯子」、step=3 才提示「E 保存记忆」。 | src/data/tasks/clean-table.ts stages L33-L38 与 scriptedEvents L206-L242 | ⚠ 中高（P1 必修） |
| G-L1-2 | 普通玩家首次进入不清楚 E 与记忆槽的关系（对新手非 self-explanatory）；记忆槽 3 格对应 3 件物体，如未教学首次玩家易"拿完就忘了"。 | 玩家层声明"管理有限记忆"但 HUD 对新玩家解释不足；L1 briefing 只在文字里提「记忆槽有限，只能记 3 件」。 | ⚠ 中 |
| G-L1-3 | 手持 1 限制让多目标子问题调度压力在 L1 勉强可显现（1 件 × 3 次 = 3 pick/place 周期），但近距离 + 无扰动 = 玩家也可以"先拿再记"绕过记忆训练目标。 | 槽 3 = 物 3；房间 dining 单房间；无外部 scripted move 事件。 | 中 |
| G-L1-4 | 空间有效性基线缺失 dining room audit（L1 不在上一轮 fact-check 范围内）；未审计 cnt-dishwasher/cnt-trash-bin/cnt-utensil-rack/cnt-dining-table 的 Room3D visual ↔ DF collision ↔ TC 交互位置一致性。 | 上一轮 audit 仅 living/bedroom/entrance；L1 房间 dining 未验 SV1-SV6。 | 低（P0 先不做） |

### 停止标准（L1 教学闭环达到；样本数少统一用人次/比例；§六 统一 L1 只验收以下 5 项，记忆更新视觉 / 记忆过期视觉放入 L2 / P3 验收）
1. 新记忆卡出现（3/3 陌生用户口头确认"按下 E 后 HUD 多了一张卡/一条记录"）；
2. 玩家理解 E 是保存记忆（3/3 陌生用户能口头说出"按 E 记位置"）；
3. 玩家理解 F 是交互（3/3 陌生用户能说出"按 F 拿东西/放东西"）；
4. 3 名陌生用户试用：至少 **2/3 不看帮助完成首次 E**（不阅读额外文档、仅 briefing+通用帮助）；
5. 3 名陌生用户试用：至少 **2/3 完成 L1 通关**（含失败重试 ≤ 3 次，使用引导文字也允许）。
（记忆更新视觉、记忆过期视觉的验收不放在 L1，统一放入 **L2 / P3** 认知闭环阶段。）

---

## L2：Level 2 · task-leave-home

### 研究问题
> **环境变化后，代理怎样发现旧信念失效，重新观察、更新记忆并恢复长程任务？**

### 目标 Golden Path（V2 固定，禁止"保存→立即拿钥匙→拿手机"捷径；
###  允许手机/雨伞顺序交换，但每次拾取下一件前必须有合法腾手动作）
```
[Phase 1 · 建立信念 + 前两件归位]
living 出生 (0, -1.5)
  ↓
观察茶几位置的钥匙 → E 保存"钥匙在茶几上"（obj-key surface=cnt-coffee-table）
  ↓
把钥匙留在茶几上（保持 status=free，因为 se-cat-pushes-key 触发条件要求钥匙 free；
                  若玩家提前拿了钥匙，应能放回茶几或合法容器，不形成软锁，
                  并明确反馈为什么当前不应拿钥匙，允许返回 Golden Path）
  ↓
去 bedroom：F 打开床头柜抽屉（cnt-nightstand initialOpen:false → open:true）
  ↓
F 取 obj-phone（status: hiddenInContainer → held）
  ↓
去 entrance：F 把手机放入 cnt-entrance-tray （目标区）→ 腾出手（合法腾手动作 #1）
  ↓
[分支 A：继续伞]
  F 取 obj-umbrella（cnt-umbrella-stand surface）→ 手持伞
  ↓
  F 把雨伞放入 cnt-entrance-tray → 腾出手（合法腾手动作 #2）
  ↓
[分支 B：先拿伞再拿手机也允许，只要每次拾取下一件前先腾手]
  （本次手机/雨伞顺序允许互换，但"拾取下一件前腾手"的规则必须满足）

[Phase 2 · 环境扰动]
  ↓  在 transition/elapsed 或 phoneObtained==true 且 keyFree==true 时
触发 se-cat-pushes-key（CatPrints 效果；钥匙 world 合法移到 living (-3.2, 0, -3.2)）
  ↓  系统
调用 markMemoryOutdated（obj-key 的相关记忆槽 outdated=true）
  ↓  玩家视觉
记忆槽显示"已过期"（或旧记忆未更新的视觉状态）
  ↓  必须：玩家未更新钥匙记忆时，不得判定进入最终成功
       （STAGE_ID_FINALIZE 的 entryCondition 要求 triggeredEvents.has(se-cat-pushes-key)
        && hasKeyFreshMemory && memoryUpdateCount >= 1；
        同时 executePlace: key->tray 在 catFired && !keyFresh 时拒绝）

[Phase 3 · 发现差异 + 更新记忆 + 腾手调度]
  ↓  玩家回 living（无论此时手持 1 件还是空）
走到茶几 → 发现"茶几上空"或钥匙不在保存的位置
  ↓  玩家选择（仅列合法选择；不允许"不更新记忆直接进 finalize 成功"）
     A：继续相信记忆 → 撞空 → 游荡 → 最终"游荡超时"失败模式
     B：回 living 全部搜索 → 发现西北角 → E 更新钥匙记忆（覆盖或新槽位）
     C：如果还有手中物品（如钥匙还没拿、手里是别的），先放 cnt-entrance-tray
        或合法容器腾出手，再来拿钥匙
  ↓  多数玩家应选择 B（重新观察+更新）+ C（必要时调度手持）

[Phase 4 · 恢复并完成]
  ↓
F 拿钥匙（status=free，在 se-cat-pushes-key 新位置）
  ↓
钥匙放入玄关托盘（cnt-entrance-tray TargetZone）
  ↓
Probe（p-loc-key-original / p-loc-key-moved / p-loc-phone / p-loc-umbrella）
  ↓
Result（过期→更新→恢复时间线可见；PolicySuggestions "先确认环境再操作"）
```

### 禁止的目标流程（V2 明确不接受为 golden，不提供便利路径）
- 保存钥匙 → F 立即拿钥匙 → 再拿手机/雨伞（不做任何腾手动作，直接拿第二件）
- 手机还在手里直接拿雨伞；雨伞还在手里直接拿钥匙（每次拾取下一件前必须先有腾手动作）
- 猫事件触发后不更新钥匙记忆，直接把钥匙放入玄关托盘并成功进入 Finalize
  （正确要求：至少 hasKeyFreshMemory && memoryUpdateCount >= 1 才允许 finalize 成功）

原因（§五）：
 1. se-cat-pushes-key 触发条件要求钥匙 status=free（且钥匙猫事件要求钥匙不被 hold 才能 move）；
 2. 手持 1 限制会让玩家拿一件时无法拾取第二件，必须"放回合法目标区 → 腾手"才允许继续，
    不形成硬腾手负担：允许放回 cnt-entrance-tray 或茶几等合法容器，不软锁；
 3. "不更新记忆直接 finalize 成功"会直接破坏「记忆失效 → 主动核验 → 更新 → 恢复」的研究闭环。

另外：
- "提前拾取钥匙"**不得设计成 90% 失败**（§二 统一标准）。正确要求统一为：
  ① 提前拾取钥匙时有明确反馈为什么当前不应拿（toast 或 HUD objective 文字提示：例如"先去卧室拿手机/雨伞、出门前最后拿钥匙更顺"；或"钥匙还在茶几上先不着急拿，否则猫就不会捣乱了——你可以放回茶几再试试"等）；
  ② 玩家可以**放回合法位置**（茶几 cnt-coffee-table / 玄关托盘 cnt-entrance-tray 等合法容器或表面），不硬卡关；
  ③ 放回后**钥匙恢复 status=free**；
  ④ 猫事件 se-cat-pushes-key 仍可在**后续**满足条件时触发（不因为玩家曾拿过钥匙就永久禁用）；
  ⑤ 不形成不可恢复软锁；
  ⑥ 自动验收：3/3 提前拿钥匙路径（拿了钥匙→再拿手机失败、拿了钥匙→去 entrance 放托盘、拿钥匙→放回茶几）均可恢复；**0 个不可恢复软锁**。

### L2 当前空间差距清单（来自 LEAVE_HOME_LAYOUT_FACT_CHECK D 节）

**Living：**
- 多数 DF 碰撞与 Room3D 视觉错位（14 DF 条 10 条错位）
- 茶几存在 Room3D 外壳 + Container3D（cnt-coffee-table）双份视觉

**Bedroom：**
- DF 坐标整体错误（10/10 碰撞落在房间外）
- 家具碰撞全空 → 玩家整屋穿墙
- cnt-nightstand 容器位置 (-7.5, 0.8 world) 与 Room 可见右床头柜 (-6.5, -1.5) 对不上
- 玩家按视觉 F 床头柜无法打开抽屉（OT 核心 bug）
- 门口（living→bedroom 门洞北侧）书架贴墙，修正 DF 后 DD=Yes（挡门）

**Entrance：**
- Room 玄关托盘可见 (-0.4, 5.7) vs TC 目标托盘 (-1.4, 9.0) 不同位置
- 装饰小红伞/蓝伞（门洞旁 / 鞋柜旁）与任务伞架 obj-umbrella / cnt-umbrella-stand 不同位置
- 浅托盘（size.y=0.1）仍进入纯 XZ 碰撞 → 阻挡玩家贴近表面

### 研究变量控制要点（仅产品规划，不改代码）
1. **记忆过期的可观察性**：记忆槽必须肉眼显式显示"旧 vs 新"（否则玩家不会主动 Verify）
2. **钥匙 new 位置可达性**：猫移到 (-3.2,-3.2) 后，无家具 DF/TC 阻挡玩家拾取（需要 P2 living 空间验收时附带确认）
3. **手持占用对阶段顺序压力**：手持 1 是硬约束；P3 需确认阶段切换不会提前（例如"玄关托盘集齐 3 件"才 finalize）

### 停止标准（L2 认知+长程闭环达到；样本少时统一写人数比例）
1. 在钥匙保持 free（不提前拾取）的 session 中，se-cat-pushes-key 触发率 = 5/5 内部开发者回归；
2. 陌生用户试玩 ≥ 5 人：至少 2/5 表现出"回 living 重新搜索钥匙"的行为；
3. 陌生用户试玩 ≥ 5 人：至少 2/5 执行"先 E 更新再 F 拾取钥匙"（正确研究路径；不要求 100%）；
4. 完成 session 的 spatial validity 七条件全满足（否则不算 research-valid）；
5. 失败玩家中"记不住新位置 vs 空间错配"可分离（通过 failure breakdown 分类 + spatial validity QA 附件）。

---

## L3：Level 3 · task-laundry-sort

### 研究问题
> **当目标数量超过工作记忆容量时，代理怎样分配记忆预算和安排多目标顺序？**

参考：laundry-sort.ts 实际配置（9 objects + 3 baskets + 4 stages + se-cat-moves-towel 扰动）

### 定义：L3 有限预算结构（代码真实行为，引用 laundry-sort.ts）
- **目标物品数：9**（白衬衫 / 白袜子 / 小白巾 / 神秘衬衫 / 黑T恤 / 牛仔裤 / 黑袜子 / 大浴巾 / 小方巾）
- **分类维度 3**：白 / 深 / 毛巾（acceptedCategories 在 baskets：白=white-clothes、深=dark-clothes、毛巾=towel）
- **容器数 3**：cnt-white-basket（x=-3.0,z=-2.0） / cnt-dark-basket（x=0,z=-2.0） / cnt-towel-basket（x=+3.0,z=-2.0）
- **记忆槽预算 3**（DEFAULT_LEVEL_BALANCE.memorySlotCount = 3）
  - **预算审查（P4 必须先做，不在本轮修改代码）**：
    玩家是否真的需要"逐物体记忆"？
    观察 x=-3/0/+3 三列天然分区 + 目标只是 3 类 → 玩家可能只记：
    "x=-3 列的都放白篮（左南）、x=0 列的都放深篮（中南）、x=+3 列的都放毛巾篮（右南）+ 神秘衬衫虽然粉但标签 category=white-clothes 所以算白"即可通过，**不触发槽 3 的真实取舍压力**。
    → V2 结论（仅规划，不改代码）：P4 审查"是否真的逐物体需要 E 记忆"与"是否需要 3 槽预算压力设计"。
- **扰动类型（按代码实际发生，逐项核实，ID 统一使用源码真实 ID）**：
  1. `se-cat-moves-clothes` @ step=5：**实际只移一件** obj-white-socks → 白袜子 world 移到 laundry x=2.7,z=1.4（毛巾篮附近）；不交换、不生成。
  2. `se-mystery-item-appears` @ step=7：**仅 message，不做 show/create 行为**；obj-mystery-shirt 是 initial object（从 L168-L177 一开始就在 laundry x=-2.7,z=1.4），不通过脚本事件生成。
  3. `se-cat-moves-towel` @ step=9：**实际只移一件** obj-towel-small（小方巾）→ world 移到 laundry x=-3.0,z=1.4（白篮附近）；**不移动大浴巾、不交换篮子**。
  4. `se-cat-hides-sock` @ step=9：**仅 message only**（"似乎看到猫往洗衣机后面钻。听见了布料摩擦的声音。"toastType=cat）；**不实际移动任何物体**。
  5. `se-cat-hides-dark-socks` @ step=13：**实际 move-entity 移黑袜子** obj-dark-socks → x=-1.5,z=1.6（洗衣机后面）；是唯一真正移动"袜子"的事件。
  6. `se-baskets-swapped` @ step=16：**仅 message，无实际 move containers 行为**；三个 basket 的 ContainerSpec.position 保持不变。
  7. `se-celebrate-progress`：触发条件"完成任一类（4白/3深/2毛巾）且 step>5"，message only。
  8. `se-time-warning` @ step=18：message only。
- **重新观察成本**：需绕 laundry 房间走动一圈重新计数（约 10–15 米，普通人 10–20 s）
- **重复搜索**：错放后能否回错误容器"取出回手持"？
  → **事实修正（待代码进一步核实，未核实前不规划新命令）**：
     需核实 commands.ts：executePlace 在 wrong category 时是否直接拒绝（如果被拒绝则 heldEntityId 仍保留在手里，不算真正"放进去了"；如果 category 通过但后续想 pick 回来，需要 GameStore.pickEntity 支持从 placed 里再 pick）。
     → **本轮结论（§三 统一）**：正确放置后的物体能否再次拾取先标为**待代码核实假设**；未完成实际代码和真人验证前，**不规划新增 L3 专属取回命令（如 pick-from-placed）**；P4 前再核实现状，如果现状是「错放后无法取」则在 P4 gap 中记录为 Bug。
- **策略差异（§三 统一：策略只保留 S1 / S2 / S3；删除 S4 Probe 辅助策略——Probe 只在任务结束后发生，游戏中不存在）**：
  - S1 分类派：先 x=-3 列白 → 白篮 → x=0 列深 → 深篮 → x=+3 列毛巾 → 毛巾篮（3 次遍历）
  - S2 计数派：每次记录完成件数，拿一件放一件，用 3 槽存计数或类别
  - S3 全抓派：每次 1 件（手持 1 限制），完全不用记忆，只靠三列分区直觉
  - **（S4 Probe 辅助策略：不生效，已删除——Probe 仅在任务结束后发生，见 probes L389-L427，不在游戏中问；旧报告中「S4 靠 Probe 答案补记忆」描述全文清除）**
- **重复游玩价值**：扰动触发 step 固定（=5/7/9/13/16/18），神秘衬衫位置固定初始（x=-2.7,z=1.4），但当前无 seedable RNG；→ 重复性依赖 P5 方案 A（NOT_NEEDED_FOR_SEMIFINAL，保持 step 触发确定性）或方案 B（完整 seed），当前 P4 不要求。

### L3 当前九件衣物 + 四阶段是否为"有意义决策"还是"重复搬运负担"？

**事实：当前配置（laundry-sort.ts L94-L260+）**

物品：
1. 白衬衫 x=-3.0 z=1.0
2. 白袜子 x=-2.4 z=1.2
3. 小白巾 x=-3.0 z=1.4
4. 神秘衬衫 x=-2.7 z=1.4（初始在白堆）
5. 黑T恤 x=0 z=1.0
6. 牛仔裤 x=0.6 z=1.2
7. 黑袜子 x=0 z=1.4
8. 大浴巾 x=3.0 z=1.0
9. 小方巾 x=3.0 z=1.2

篮子（3 个排成一排放南墙 z=-2.0）：
- 白篮：(-3.0, -2.0)
- 深篮：( 0.0, -2.0)
- 毛巾篮：(+3.0, -2.0)

空间布局分析（有意义，不是纯搬运）：
- 物品区 Z≈1.0–1.4（北侧），篮子区 Z=-2.0（南侧），每件需走 3–3.5 m
- 手持 1 → 每件一个 pick-place 周期，共 9 次 cycle = 高重复搬运
- 白/深/毛巾天然物理分区（x=-3 白，x=0 深，x=+3 毛巾）→ 对应 3 类目标
- **但**：神秘衬衫混在白堆 x=-2.7 → 这是"有意义"干扰（玩家需要观察它属于 white-clothes，且不被粉色视觉欺骗）

**判断（产品定义层，仅结论，不改代码）：**
- 搬运次数：**9 件 × 3.2 m 平均 ≈ 28.8 m 走距 + 9 pick + 9 place**。对普通人：略多但仍在 4 分钟 240 s 可承受（1 件 15–20 s 绰绰有余）
- 决策成分：**有（分类顺序 / 神秘 shirt 判断 / 预算分配 / 扰动后毛巾回哪）**
- 风险：**扰动后是否能取出错误放入的衣物？如果 container acceptedCategories 是硬约束且 place 成功后无"取出"API，则 L3 会形成 hard-failure（错放即失败）** → gap report 新增 L3-1

### 硬差距清单（仅列，不改）

| # | Gap | 来源/事实 | 严重度 |
|---|---|---|---|
| G-L3-1 | 已放置物体能否再被 pick 回手持？如果 acceptedCategories 校验错类别时直接拒放（heldEntityId 仍保留），但 category 对、放对容器后又想取回，是否存在"取出"API？——**目前只标记为待核查假设，不规划新增 L3 专属命令**。 | commands.ts executePick / executePlace 行为；GameStore.pickEntity 对 `status=placed` 物体的支持 | ⚠ 高（阻塞 P4 的错放恢复审查，但本轮不修改） |
| G-L3-2 | 记忆槽 3 vs 9 件物品 + 3 类，但物品天然 x=-3/0/+3 三列分区 → 是否真的逼出"预算分配策略"？S3 全抓派不需要任何记忆 → P4 真实玩家观察后决定需不需要轻量改造。 | 当前空间布局；策略 S3 可零记忆通关；DEFAULT_LEVEL_BALANCE.memorySlotCount=3 | 中 |
| G-L3-3 | 真正的 move 扰动只碰 3/9 件（白袜子 step=5；小方巾 step=9；黑袜子 step=13），其余 6 件全程不动；se-baskets-swapped 仅 message 不实际 swap → 总体扰动占比轻，可能让玩家"先做完 6 件不动的，再处理 3 件扰动"绕开记忆压力。 | stages L62-67 UPDATE_TOWEL 触发条件；scriptedEvents L277-L386 行为类型 | 中 |
| G-L3-4 | 神秘衬衫：初始即存在（x=-2.7,z=1.4），category=white-clothes，颜色='#ec4899'(粉)，Probe 结束后才答题 → 游戏中观察到粉色判断"算白还是算深"是唯一压力，但 briefing / 目标是否显式说明？如果 briefing 明示所有"白色类别"都入白篮，则 mystery shirt 更多是"注意观察标签"而不是记忆压力。 | 初始对象定义 laundry-sort.ts L168-L177；goal `g-mystery-item` L265-L274；Probe list L389-L427 全部 end-of-task | 中高（P4 P5 时评估观察压力 vs 记忆压力） |
| G-L3-5 | laundry 房间空间有效性未 audit（DF / Room 视觉 / TC 位置 / 挡门情况）；三个篮子 visual ↔ TC ↔ DF 一致性未验。 | 不在 living/bedroom/entrance 上一轮 scope | 低（P4 前做 laundry audit，否则 spatial validity 存疑） |
| G-L3-6 | Probe 问题 `p-count-white` 正确答案='3'（"白色衣物一共有几件？"），但白色实际 ID 是 obj-white-shirt + obj-white-socks + obj-white-towel-small + obj-mystery-shirt = **4 件**；Probe 选项 '3' 与 whiteAllPlaced(ctx) 的实际 4 件不一致。**本轮只在 gap 中标注，不修改 Probe 配置。** | L18 `const whiteIds = ['obj-white-shirt','obj-white-socks','obj-white-towel-small','obj-mystery-shirt']`；Probe L391-L398 `correctAnswer: '3'`；GAP 同步记录到 product_v2_gap_report.md。 | 高（产品定义的"阶段/判定/Probe 不一致"属于 SV7） |

### 停止标准（L3 多目标策略闭环达到；样本少时统一用人次/比例）
1. 不同玩家 session 能区分出 ≥ 3 种策略特征（S1/S2/S3 其中 3 类），不是所有玩家都全抓派；
2. 陌生用户试玩 ≥ 5 人：至少 3/5 在 UPDATE_TOWEL 阶段执行 ≥ 1 次"再观察"（走回 towel/白篮/深篮物品区）；
3. P4 简化确认后：错放可恢复（取得出）或失败明确分类为错误放置，不产生 hard-failure；
4. 普通玩家 L3 通关率 ≥ 3/5（含失败重试，不是必须一次通关）；
5. 神秘衬衫最终正确入白篮比例 ≥ 3/5（否则是视觉分类/SV7 bug，非记忆压力体现）。

---

## 三关能力阶梯 → 指标与研究价值映射

| 阶梯层级 | 主要研究变量 | 主要事件采集 | 次级 Session 字段（或 candidate 指标） |
|---|---|---|---|
| L1 教学闭环 | E vs F 顺序；首次保存时机；教学 UI 理解度 | stepCount + saveMemory events + pick/place | 首次正确保存耗时；firstSaveBeforeFirstPick ratio；tutorial drop-off |
| L2 长程 + 记忆失效 | 扰动 → re-observe → update；手持调度；door transition 顺序 | scripted_events (se-cat-pushes-key) + markMemoryOutdated + memory updates + probe answers | outdated→updated latency；repeatedSearchCount L11；keys picked-up-before vs after cat event；door transition time to living |
| L3 多目标预算 | 策略类型（S1 分类 / S2 计数 / S3 全抓；**§三 统一只保留 S1/S2/S3 三种，S4 Probe 辅助策略因 Probe 仅任务结束发生已全文清除**）；错放后恢复（待核，未核实前不规划新命令，不新增 pick-from-placed 等 L3 专属取回） | wrongPlacements L23；containerMistakes L24；mystery shirt pick time；UPDATE_TOWEL stage 进入时间 → 完成时间 | stage3_entry_ms；stage3_duration_ms；mystery_classification_error_rate；分类错误（白色放深 / 深放白 / 毛巾放错）各计数；strategy_cluster_label（后处理打标 S1/S2/S3） |

---

## 对外的三关故事线（普通玩家教育层版本）

| 关卡 | 普通人视角故事 | 教学点 |
|---|---|---|
| L1 · 餐桌收拾 | "主人留了一桌残羹冷炙，我按 E 记下位置，再去一件件收。" | E/F 的作用 + 记忆槽怎么工作 |
| L2 · 出门大作战 | "出门前要带钥匙手机和雨伞——咦，钥匙不在茶几上？猫把它搬到哪里了？我是不是记错了？" | 记忆会过期 / 需要回房间再确认 / 东西太多一次只能拿一件 |
| L3 · 洗衣幽灵 | "袜子幽灵在洗衣房捣乱！毛巾不见了？粉色衬衫算白色吗？衣服多到我记不住了..." | 东西太多记不住就要分类；先看颜色再看标签；错了别慌，重新分类 |
