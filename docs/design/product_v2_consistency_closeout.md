# PRODUCT V2 — P0.2 跨文档一致性修正报告

代号：Product V2 · P0.2 CROSS-DOCUMENT CONSISTENCY CLOSEOUT
日期：2026-07-30
范围：P0.1 的六份文档进行最后一次跨文档一致性修正；不修改任何源码 / 测试 / 脚本 / README；不新增产品概念；不 commit / 不 push。

---

## 1. 修复的跨文档冲突

| # | 冲突项 | 修复前（六份文档不一致写法） | 修复后（六份文档统一） |
|---|---|---|---|
| C1 | 机制描述是否标记 CURRENT/V2 | 部分文档把 V2 Golden Path 写成当前已实现，部分文档未区分 | **全文强制要求**：所有机制描述必须明确标记 `CURRENT IMPLEMENTATION` 或 `V2 TARGET` |
| C2 | L2 猫事件触发时机 | 写成"手机+雨伞都放入托盘后猫才推钥匙"或"Golden Path 时 cat step=9/12" | 统一为 **CURRENT IMPLEMENTATION：保存钥匙并离开客厅后猫即可移动钥匙（或取得手机后）；不需要等手机和雨伞都放入托盘**；V2 TARGET：玩家执行其他子目标期间扰动，返回客厅发现旧记忆失效。 |
| C3 | P3 提前拿钥匙标准 | 写成"失败率 ≥ 90%"或"硬卡关不让拿" | 统一为**恢复性验收**：有明确反馈 → 可放回合法位置 → 钥匙恢复 free → 猫事件仍可后续触发 → 0 软锁；自动验收 3/3 恢复，0 软锁。 |
| C4 | P4 策略 & 指标 | 保留 S4 Probe 游戏内策略 / S2/S4 表述 / 5/10 / 60% / purity ≥ 0.7 / 未核实前必须新增 pick-from-placed | 统一为：**策略 S1/S2/S3 仅保留三种**；5 名陌生用户；至少观察到 2 种明显不同策略；至少 3/5 通关；神秘衬衫至少 3/5 正确分类；pick-from-placed 改为待核实，不规划新命令。 |
| C5 | P5 Seed 定义 | "Date.now()+random 当 seed" / "session id 可作为 seed" / "写个随机数字就声称可复现" 等伪 Seed 中间方案 | 统一为：**reproducible seed = 同时满足三条件（独立 seed 字段 / 统一 seedable RNG / 同参数复现状态演变）**；复赛允许二选一（A=NOT_NEEDED_FOR_SEMIFINAL，B=完整实现）；**严禁任何伪 Seed 中间方案**。 |
| C6 | Spatial Validity Certification 粒度 | "每个普通 Session 必须附完整七项 QA checklist" | 统一为：**版本级 certification**（build + task + scene 三版本对应一份）；普通 Session 记录 certification ID；只有抽样 ≥5% 或异常 Session（空间 Bug / Debug / 软锁 / 版本不匹配）才做 Session 级 QA review；修正 spatial_validity_contract.md 末尾 L335 原冲突条款。 |
| C7 | L1 验收边界 | 写成 L1 验收"新增/更新/过期"三种视觉 | 统一为：**L1 只验收**：新记忆卡出现；玩家理解 E 保存；玩家理解 F 交互；2/3 陌生用户不看帮助完成首次 E；2/3 陌生用户完成 L1。记忆更新视觉 / 过期视觉放入 L2/P3 验收。 |
| C8 | Encode 决策描述 | "玩家选择槽位"（与 saveMemory 自动选槽冲突） | 统一为：**玩家不直接选择槽位**；玩家决定"是否保存、是否锁定、是否接受系统自动覆盖低优先级记忆"；saveMemory 按「同实体已有槽自动更新 → 空槽 → 自动覆盖可覆盖槽」三优先级自动选槽（CURRENT IMPLEMENTATION）。 |
| C9 | L3 事件 ID | se-cat-moves-clothes / se-cat-moves-towel / 黑袜子 ID / se-mystery-item-appears / se-baskets-swapped / se-time-warning 多份文档不一致或多个 ID 混用 | 统一为源码真实 ID：黑袜子隐藏事件 = `se-cat-hides-dark-socks`（step=13，move-entity 移黑袜子）；`se-cat-hides-sock` = step=9 message only（不实际移动任何物体）。 |

---

## 2. Current 与 V2 Target 的区分原则

1. 所有机制描述必须显式打标：
   - `CURRENT IMPLEMENTATION`：当前 HEAD 源码中真实实现、可复现、可验证的行为（必须能在对应 `src/` 文件中找到证据）。
   - `V2 TARGET`：未来 Golden Path / 未来希望达到的体验，但当前源码中**尚未实现**的部分。
2. 禁止混用：禁止把 V2 TARGET 写成当前已实现的事实。
3. 跨文档所有 CURRENT/V2 标记对齐；若某份文档未标记，则视为描述的是 CURRENT IMPLEMENTATION（无歧义）。

---

## 3. L2 猫事件（se-cat-pushes-key）真实时机

### CURRENT IMPLEMENTATION（`src/data/tasks/leave-home.ts` L286-297 事实）

`se-cat-pushes-key` 在 `keyFree=true`（钥匙不被玩家持有、仍处于 free 状态）的前提下，以下**任一条件成立即触发**：
1. 条件 A：`keyFreshSaved && keyFree && leftLiving`（玩家**保存了钥匙记忆**且钥匙 free 且已离开客厅 currentRoom!==living）
2. 条件 B：`keyFree && phoneObtained`（钥匙 free 且玩家已取得手机）

**CURRENT IMPLEMENTATION 结论**：保存钥匙并离开客厅后，猫即可移动钥匙；**不需要等手机和雨伞都放入托盘**。因此当前猫事件可能在玩家第一次离开 living 时立即发生。

### V2 TARGET 目标体验

玩家在执行其他子目标（卧室拿手机 / 玄关放伞等）期间发生扰动（猫推钥匙），并在返回客厅时发现旧记忆失效（茶几上没钥匙、记忆槽显示 outdated），从而触发「重新观察 → 更新记忆 → 恢复」的完整认知闭环。

---

## 4. P3 恢复性验收标准（§二 统一，删除"提前拿钥匙失败率 ≥ 90%"）

提前拾取钥匙的**正确要求（六份文档统一）**：
1. 提前拾取钥匙时有明确反馈（toast 或 HUD objective 文字提示为什么当前不应拿）；
2. 玩家可以**放回合法位置**（cnt-coffee-table 茶几表面 或 cnt-entrance-tray 玄关托盘 等合法容器/表面），不硬卡关；
3. 放回后**钥匙恢复 status=free**；
4. 猫事件 se-cat-pushes-key 仍可在**后续**满足条件时触发（不因为玩家曾拿过钥匙就永久禁用）；
5. 不形成不可恢复软锁。

**自动验收**：3/3 提前拿钥匙路径（拿了钥匙→再拿手机失败、拿了钥匙→去 entrance 放托盘、拿钥匙→放回茶几）均可以恢复；**0 个不可恢复软锁**。

---

## 5. P4 策略统一标准（§三 统一）

- 策略只保留 **S1 分类派 / S2 计数派 / S3 全抓派** 三种；**删除 S4 Probe 游戏内策略**（Probe 仅在任务结束后发生，游戏中不存在，不影响策略）。
- 人工验收人数：**5 名陌生用户**（非开发者、第一次玩游戏）。
- 策略观察要求：至少观察到 **2 种明显不同策略**（S1/S2/S3 中至少出现 2 类）。
- 通关率：**至少 3/5 通关**（含失败重试 ≤ 3 次内）。
- 神秘衬衫分类：神秘衬衫最终入白篮正确比例 **至少 3/5**。
- 正确放置后的物体能否再次拾取：先标为**待代码和真人双核实假设**；未完成实际代码和真人验证前，**不规划新增任何 L3 专属取回命令（如 pick-from-placed）**。

**删除的写法（全文不得再出现）**：S4 / S2/S4 表述 / 5/10 / 60% / strategy cluster purity ≥ 0.7 / "未核实前必须新增 pick-from-placed 命令"。

---

## 6. P5 Seed 决策（§四 统一）

### reproducible seed 定义（只有同时满足以下三条件才能称为 seed）
1. **独立 seed 字段进入 Session 中**（SessionData 结构中存在独立 seed 字段，不是 session id 或其他随机字段）；
2. **所有随机机制消费同一个 seedable RNG**（猫事件触发 / 衣物扰动 / 时间扰动等均使用统一 seedable RNG，如 mulberry32 / alea，不得混用 Math.random 或 step 阈值与 seed 混合）；
3. **相同 task_version + scene_version + seed + command_sequence 能复现状态演变**（同条件下 1:1 复现扰动和世界状态）。

### 复赛允许二选一（禁止任何伪 Seed 中间方案）
- **方案 A = NOT_NEEDED_FOR_SEMIFINAL**：保持当前确定性 step / state 触发（不引入 seed 字段；扰动仍基于 step 阈值或 player state 组合触发）；Session 中 seed 字段可写 `NOT_NEEDED_FOR_SEMIFINAL` 或不存在。
- **方案 B = 完整实现 reproducible seed**：完整实现上述 (1)(2)(3) 三条件。

### 严禁的伪 Seed 中间方案（全文删除，不得再出现）
- 用 `Date.now() + random` 在 session start 时写入一次当 seed；
- 把随机 UUID 的 session id 改名叫 seed（或声称 session id 可作为 seed）；
- "写一个随机数字"就声称"任务可复现"；
- 任何只满足 (1) 不满足 (2)(3) 的中间方案。

---

## 7. 版本级 Spatial Validity Certification（§五 统一）

**统一为版本级认证 + 抽样/异常 Session 级复核机制（删除"每个普通 Session 附完整七项 QA checklist"）：**

1. **版本级 certification**：`build_version + task_version + scene_version` 三版本组合**对应一份版本级 certification**（完整执行 SV1-SV7 七项 QA，生成 certification_id，如 `CERT_LEAVE_HOME_L2_P2_FIXED_2026XXXX`）。版本级 certification 随 release 发布一次，不随每份 Session 重复。
2. **普通 Session 只记录 ID**：普通玩家 Session 写字段 `spatial_certification_id = certification_id` 即可。
3. **Invalid 条件（满足任一单独标 invalid）**：
   - 玩家主动在 Feedback 里报告空间 Bug 且 post-hoc 核实属于新异常；
   - 使用了 Debug（瞬移 / setRobotPosition / e2e 命令 / force-place 等）；
   - 进入软锁 ≥ 30 秒且无恢复路径；
   - spatial_certification_id 与实际运行代码版本不匹配。
4. **人工复核**：随机抽样**至少 5%** 的 valid Session 做人工复核；外加所有 invalid Session **全部**人工复核。
5. **只有抽样或异常 Session 才附 Session 级 QA review**；普通 Session 不附完整七项 checklist。

**已修正的冲突条款**：`spatial_validity_contract.md` 原末尾 L335 "每份 session 附 QA checklist JSON" 已全文删除，替换为上述版本级认证机制。

---

## 8. L1 验收边界（§六 统一）

### L1 只验收以下 5 项（§六 统一）
1. 新记忆卡出现（3/3 陌生用户口头确认"按下 E 后 HUD 多了一张卡/一条记录"）；
2. 玩家理解 E 是保存记忆（3/3 陌生用户能口头说出"按 E 记位置"）；
3. 玩家理解 F 是交互（3/3 陌生用户能说出"按 F 拿东西/放东西"）；
4. 3 名陌生用户试用：至少 **2/3 不看帮助完成首次 E**（仅 briefing+通用帮助，不阅读额外文档）；
5. 3 名陌生用户试用：至少 **2/3 完成 L1 通关**（含失败重试 ≤ 3 次，允许使用引导文字）。

### 放入 L2 / P3 验收的内容
- 记忆更新视觉（记忆被 update/覆盖后 HUD 的视觉变化）；
- 记忆过期视觉（outdated=true 后的肉眼可见视觉反馈，如颜色/边框/过期图标/灰化/抖动）。

---

## 9. 最终残留搜索结果分类

### §九 残留搜索正则：
```
rg -n "失败率.*90|S4|S2/S4|5/10|60%|purity|Date.now|session id.*seed|每份 session.*checklist|每个 Session.*人工|选择槽位|新增/更新/过期.*L1|se-cat-moves-key|se-cat-hides-sock|se-cat-hides-dark-socks" docs/design docs/roadmap
```

### 分类结果（docs/ 范围内）

| 文件:行 | 匹配内容 | 分类 | 说明 |
|---|---|---|---|
| mechanics.md:54 | "30-60% 混乱度" | 合法事实 | mechanics 文档混乱度分级，非 P4 验收 60%，合法 |
| 00_product_research_game_design_v2_draft.md:81 | "不再要求普通玩家每个 Session 都由人工重新走完整七项 checklist" | 历史纠正说明 | C6 冲突的纠正声明，合法 |
| 00_product_research_game_design_v2_draft.md:127 | "玩家不直接选择槽位：CURRENT IMPLEMENTATION = saveMemory 三优先级自动选槽" | 历史纠正说明 | C8 冲突的纠正声明，合法 |
| 00_product_research_game_design_v2_draft.md:265-266/319 | "CURRENT IMPLEMENTATION 保存钥匙并离开客厅后猫即可移动钥匙" / "V2 TARGET 体验" | 合法事实 | C2 修正后的 CURRENT/V2 标记，合法 |
| product_v2_implementation_plan.md:25/29/55/59 | "每个 session 都走 checklist 删除" / "Seed 定义修订" / "se-cat-moves-key 修正前写法" / "session id 即 seed 禁止" | 历史纠正说明 | P0.1 自动验收清单中对纠正内容的引用，合法 |
| product_v2_implementation_plan.md:238 | "§二 统一删除'提前拿钥匙失败率 ≥ 90%'..." | 历史纠正说明 | 对 C3 旧写法的纠正声明，合法 |
| product_v2_implementation_plan.md:282 | "§三 统一删除 purity ≥ 0.7..." | 历史纠正说明 | 对 C4 旧写法的纠正声明，合法 |
| product_v2_implementation_plan.md:285-287 | "删除 ≥ 5/10" / "删除 S2/S4" / "删除 ≥ 60%" | 历史纠正说明 | 对 C4 旧写法的纠正声明，合法 |
| product_v2_implementation_plan.md:311 | "Date.now()+random / session id 等伪 seed 禁止" | 历史纠正说明 | 对 C5 旧写法的纠正声明，合法 |
| product_v2_fact_correction_report.md:71 | "se-cat-moves-key → se-cat-pushes-key（修正前写法）" | 历史纠正说明 | 旧 ID 与新 ID 的纠正对照表，合法 |
| product_v2_fact_correction_report.md:142 | "禁止写法：提前拾取钥匙 90% 失败..." | 历史纠正说明 | 对 C3 禁止写法的说明，合法 |
| product_v2_fact_correction_report.md:152 | "S4 Probe 辅助策略（修正前写法）→ 删除" | 历史纠正说明 | 旧策略与新策略的纠正对照表，合法 |
| product_v2_fact_correction_report.md:175/273 | "se-cat-hides-dark-socks step=13 移黑袜子" / "se-cat-hides-sock step=9 message only vs se-cat-hides-dark-socks 区分" | 合法事实 | C9 源码真实 ID 引用，合法 |
| product_v2_fact_correction_report.md:204/222/223/233 | "Date.now()+random / session id seed 旧写法删除" / "不得把 session id 称为 seed" | 历史纠正说明 | 对 C5 旧写法的纠正声明，合法 |
| product_v2_fact_correction_report.md:322 | "原：至少 60% → 现：至少 3/5" | 历史纠正说明 | 旧标准与新标准对照表，合法 |
| product_v2_fact_correction_report.md:375 | "S4 Probe 策略删除（写入已完成工作）" | 历史纠正说明 | 已完成工作项引用，合法 |
| product_v2_gap_report.md:97-98/124 | "R-05 seed：A/B 方案 + 禁止 Date.now()/session id 伪 seed" | 合法事实 | C5 统一后的 gap 描述，合法 |
| product_v2_gap_report.md:223 | "S4 Probe 游戏中策略不存在" | 历史纠正说明 | C4 纠正引用，合法 |
| product_v2_gap_report.md:238 | "3/10（L1 顺序倒置评分）" | 合法事实 | §5 比赛评分对齐的子维度估算分（分母 10 的评分），不是 P4 验收 5/10，合法 |
| product_v2_gap_report.md:248-249 | "7/10、5/10（评分维度子分数估算）" | 合法事实 | §5 评分维度子项估算，不是 P4 验收 5/10，合法 |
| spatial_validity_contract.md:338 | "§五 统一修正：删除每份 session 附 QA checklist JSON" | 历史纠正说明 | C6 纠正声明，合法 |
| three_level_research_game_matrix.md:17 | "se-cat-hides-sock step=9 message only / se-cat-hides-dark-socks step=13 move-entity" | 合法事实 | C9 源码真实 ID 引用，合法 |
| three_level_research_game_matrix.md:221-222 | "se-cat-hides-sock message only / se-cat-hides-dark-socks 移黑袜" | 合法事实 | C9 源码真实 ID 逐项核实，合法 |
| three_level_research_game_matrix.md:231/235/295 | "策略只保留 S1/S2/S3；删除 S4 Probe 辅助策略" | 历史纠正说明 | C4 纠正声明，合法 |
| LEAVE_HOME_FINAL_LAYOUT_OPTIONS.md:113-114 | "S4 = MovedKey→EN 门中心（动线段 S4）" | 合法事实 | L2 动线四段命名（S1=Spawn→茶几 / S2=茶几→BN 门 / S3=BN→钥匙 / S4=MovedKey→EN 门），不是产品策略 S4，合法 |
| archive/playtest-reports/*.md | "5/10 评分" / etc. | 历史归档文档，不处理 | 用户目标文档不包括 archive 目录；为历史试玩报告打分，不处理 |

### 分类结论
- **0 条仍需删除的残留**：所有匹配项均为"合法事实（源码引用 / 评分估算 / 动线段名）"或"历史纠正说明（引用旧写法 + 明确声明已删除 / 替换）"。
- **0 条真正的矛盾残留**：P0.2 修正后，六份目标文档中已不存在"失败率 90% / S4 Probe 游戏策略 / S2/S4 / 5/10 验收 / 60% 验收 / purity / Date.now 当 seed / session id seed / 每份 session checklist / 选择槽位 / 新增更新过期 L1 / se-cat-moves-key / 混乱的 se-cat-hides-sock vs se-cat-hides-dark-socks"等残留矛盾写法。

---

## 10. git status

```
?? docs/design/00_product_research_game_design_v2_draft.md
?? docs/design/product_v2_consistency_closeout.md
?? docs/design/product_v2_fact_correction_report.md
?? docs/design/product_v2_gap_report.md
?? docs/design/spatial_validity_contract.md
?? docs/design/three_level_research_game_matrix.md
?? docs/roadmap/
```

（注：6 份目标文档 + 本报告共 7 份 docs 修改；未触及任何源码 / 测试 / 脚本 / README；未 commit；未 push。）
