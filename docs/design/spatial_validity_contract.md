# 空间有效性契约（Spatial Validity Contract）

版本：Product V2
基线：docs/LEAVE_HOME_LAYOUT_FACT_CHECK.md（A–D 节事实）
作用：产品定义 §三 与研究契约 MVP-09 的独立约束文档

> 空间、视觉与交互正确性是研究有效性的前置条件。
> 任何违反本契约的 Session 均不得被解释为"记忆失败"或"策略失败"，
> 只能作为空间 Bug 样本，不计入研究数据集。

---

## 0. 导航

1. 空间有效性定义
2. 视觉与碰撞一致性（SV1 + SV4）
3. 唯一任务视觉所有权（SV2 + SV3 + SV6）
4. 关键路径验收（SV5 + DD / OT）
5. 人工试玩要求（研究数据采集的入口门槛）
6. 研究无效 Session 判定清单（什么 Session 不能算作 research-valid）
7. Spatial Validity Gate 七条件
8. 本契约的修改与生效规则

---

## 1. 空间有效性定义

### 1.1 核心定义

**空间有效性（Spatial Validity）**：
在 HomeMem Arena 的某个关卡实例（一次 Session）中，玩家"看到的世界 → 能做的交互 → 实际生效的结果 → 游戏判定"四者在几何与语义层面相互一致，且关键路径畅通；不一致属于**无效混杂（Confounding Variable）**，可直接让研究样本的解释性失效。

### 1.2 为什么是研究前置条件

V2 产品定位是"长程移动操作 + 有限工作记忆 + 动态环境扰动"的研究启发游戏。研究问题的因变量是：
- 是否记住了位置；
- 旧信念失效后是否主动核验；
- 工作记忆预算分配策略；
- 失败恢复能力。

所有这些因变量都假设自变量（"玩家能否顺利看到、走到、交互"）是常量。如果自变量本身因空间 Bug 产生巨大波动，因变量就无法解释为"记忆 / 策略"失败。

举例：
- Bedroom 里 Room 画的右床头柜在 (-6.5, -1.5)，真正的 cnt-nightstand 在 (-7.5, 0.8)
  → 玩家对着可见的家具按 F 无法打开抽屉
  → 数据记录："forgot-location"、"container mistake"
  → 实际原因：视觉与交互错位（SV1/SV3）
  → 结论：该 Session 不算研究有效样本。

---

## 2. 视觉与碰撞一致性（SV1 / SV4）

定义：对任意家具或关键目标（task container / task object / 装饰家具 DF），"玩家 Three.js 看到的 XZ 位置"与"FirstPersonControls 碰撞系统实际生效的 XZ 位置"之间的欧氏距离 ε ≤ 0.2 m；视觉与碰撞的 footprint 面积重叠 ≥ 80%。

### 2.1 真值源（基线约定，来自 LEAVE_HOME_LAYOUT_FACT_CHECK §A + §B）

视觉 XZ 位置（True Visual Position）：
- Room 装饰：`Room3D.renderXxx()` 函数中的 `position={[center.x + local.x, 0, center.z + local.z]}`
- 任务容器：`Container3D` 的 `worldPos = [room.center.x + spec.position.x, spec.position.y, room.center.z + spec.position.z]`（Container3D L103-L106）
- 任务物体：`Object3D` 的 `entity.position`（world 坐标，EntityState.position）

碰撞 XZ 位置（True Collision Position，来自 collision.ts L263-264，纯 XZ 圆矩碰撞，不使用 size.y）：
```
fwX = roomCenter.x + furniture.position.x
fwZ = roomCenter.z + furniture.position.z
footprint: size.x × size.z AABB + player.radius 0.3 circle
```

### 2.2 关键目标件数（必须 100% 满足 ε ≤ 0.2）

每个关卡都有一份"关键目标清单（Critical Target List）"。不要求 100% 装饰都一致，但**关键目标必须一致**。L2 leave-home 的关键目标（当前 HEAD = 5de8037）：

| 房间 | 关键目标 id | 语义 | 视觉来源 | 碰撞来源 | 一致性要求 |
|---|---|---|---|---|---|
| Living | cnt-coffee-table | 茶几 / 钥匙初始 surface | Room3D.renderLiving L201-L205 + Container3D | TC: cnt-coffee-table + DF: decor-xxx（茶几本身无 DF，TC 自己 collision） | 视觉外壳与 TC 位置不同（但 x 差 0.5、z 差 0.6 属轻度，P2 可二选一） |
| Living | obj-key | 任务钥匙 | Object3D（entity.position） | object 不进入家具碰撞，交互圈 2.5 m（默认） | 与 cnt-coffee-table 表面同 XZ |
| Bedroom | cnt-nightstand | 右床头柜抽屉，手机 hidden 容器 | **必须是 Room3D.renderBedroom L544 的右床头柜 visual**，但当前 TC 放在 (-7.5, 0.8) | TC: cnt-nightstand | **当前严重错位，P2 Bedroom 必需修复** |
| Bedroom | obj-phone | 手机 | Object3D hiddenInContainer → 从抽屉出来后跟随 pick/place | N/A（object 无碰撞，仅交互圈） | 与抽屉 open 位置一致 |
| Bedroom | 门口 bookshelf | 书架（修正 DF 后 DD 判断） | Room3D.renderBedroom L598 | DF: decor-bookshelf（修正后 room-local） | Room L598 visual x=-4.6,z=1.0；DF 修正后应为 (+3.4, 1.0) room-local → world x=-4.6,z=1.0，**但此处 DD=Yes，P2 必须北移** |
| Entrance | cnt-umbrella-stand | 伞架，obj-umbrella surface | Room3D.renderEntrance L67-L131 的装饰伞（*当前 visual 在门洞旁，真正 TC 在西北角*） | TC: cnt-umbrella-stand | **P2 Entrance 必需统一：要么 TC 移到门洞旁，要么 Room 删除门洞旁装饰伞 + 移 visual 到西北角** |
| Entrance | cnt-entrance-tray | 玄关托盘，3 件目标放这里 | Room3D.renderEntrance L102 画的在门洞旁 (-0.4, z=5.7)；TC 在 (-1.4, z=9.0) | TC: cnt-entrance-tray | **P2 Entrance 必须二选一** |
| Entrance | obj-umbrella | 雨伞 | Object3D initial: surface cnt-umbrella-stand | N/A | 与 umbrella stand TC 位置一致 |

### 2.3 视觉 / 碰撞不一致（SV1）的判断方法

真人走查 + 计算 diff：
- 玩家走到"能看到沙发/茶几/床头柜"的位置
- 按 W/S/A/D，判断碰撞边界与视觉边缘是否同一位置
- 若出现"走过了但没撞上 / 撞在空地上"，SV1 ≥ 1

自动 diff（可写 QA 脚本，P2 内允许，不进入生产代码）：
```
for each criticalTarget:
  vx, vz = Room visual world position 或 Container3D worldPos
  cx, cz = roomCenter + (TC.position 或 DF.position)
  dist = sqrt((vx-cx)^2 + (vz-cz)^2)
  overlap = AABB intersection area / min(visualArea, collisionArea)
  PASS: dist ≤ 0.2 AND overlap ≥ 0.8
```

> 对浅托盘（entrance tray size.y=0.1）：**不因为"y 很小"就豁免 XZ 碰撞判定**，因为 collision.ts L263-L273 纯 XZ，不读 size.y。

---

## 3. 唯一任务视觉所有权（SV2 / SV3 / SV4 / SV6）

定义：同一语义的"任务家具"（即 task.containers 中 isTargetZone=true 的容器，以及承载 task.objects 初始位置的容器）在一个房间内只能有**一个视觉归属 + 一个碰撞体 + 一个交互目标**。

### 3.1 三条硬规则

1. **唯一视觉（SV2 禁"双份任务模型"）**：
   例如"玄关托盘"语义，在 Room3D 画了一份，又用 Container3D 在另一个位置画一份 → 两个"托盘"视觉 → SV2=1。

2. **可交互目标必须有对应视觉（SV3 禁"看不见却能按 F"）**：
   例如 cnt-nightstand 在空地上，Room3D 可见的右床头柜视觉不与此挂钩 → 玩家只能靠 F 圈高亮发现目标 → 不是真实"观察→记忆"闭环。

3. **可见的任务暗示视觉必须能交互（SV4 禁"看得见的假目标"）**：
   Room3D 在直觉位置（门洞旁托盘）画了"玄关托盘"的典型视觉，但那里不是 TargetZone → 玩家走到直觉位置按 F 无反应 → 直接产生 wrongPlacements，数据被污染。

### 3.2 当前 HEAD 的双份所有权

来自 LEAVE_HOME_LAYOUT_FACT_CHECK §D：

| 语义 id | 来源 1（Room3D visual / 装饰） | 来源 2（Task Container / 真正交互） | 严重度 | 修复工作包 |
|---|---|---|---|---|
| coffee-table-top | Room L201-L205 茶几外壳 (center.x-0.5, z-0.3) | TC cnt-coffee-table (0, 0.3) → 另一个 XZ | 轻（位置接近，但视觉"两个茶几"） | P2 Living |
| nightstand-right | Room L544 右床头柜 visual world (-6.5, -1.5) | TC cnt-nightstand world (-7.5, +0.8) | **极高（完全两个位置）** | P2 Bedroom（核心修复） |
| entrance-tray | Room L102 手绘玄关托盘 (-0.4, 5.7)（门洞旁直觉位置） | TC cnt-entrance-tray (-1.4, 9.0)（西北角） | **极高（双份，玩家必走错）** | P2 Entrance（二选一路径） |
| umbrella-stand | Room L67-L131 装饰小伞（门洞旁 + 鞋柜旁两处） + 小托盘旁伞装饰 | TC cnt-umbrella-stand 西北角 world (-2.5, 9.0) | 高（两处不同"伞"视觉） | P2 Entrance |
| living-tea-table-shell vs container | Room shell + Container3D 同一语义 | TC vs DF（茶几 shell 没 collision，TC 有） | 低（但仍属视觉双份） | P2 Living 可选统一 |

### 3.3 修复时的所有权归属决策（唯一规则）

修复 SV2/SV3/SV4 的双份问题时，**禁止"两个都保留、让玩家猜哪个真"**。决策优先级：

1. 优先保留**能成为玩家自然直觉位置**的那个（例如 entrance：门洞旁的托盘直觉更合理，优先把 TC 移到 Room 视觉位置，而不是让玩家去西北角）。
2. 如果直觉位置与 DD（挡门）冲突 → 选次优但可通过 hint 文案强化的位置，并在 briefing/objective 中明确坐标。
3. 任何情况下：语义 id × 视觉 × 碰撞 × 交互点 = 四条必须一一对应；同一语义不得超过一个视觉。

---

## 4. 关键路径验收（SV5 / DD / OT）

定义：从出生点 → 每个关键目标点 → 返回下一个目标点 → 最终目标区，**所有路径都能以玩家默认速度 (PLAYER_SPEED = 3.0) 畅通通过，不被推、不被卡门洞、不需要 Debug 瞬移**。

### 4.1 L2 leave-home 的关键路径（必须全通）

```
Path A（教学路径）：
  spawn (0,-1.5 living)
    →茶几 (0, 0.3)  × 4 方向都能走到交互圈内
    →living→bedroom 门洞 (-4, 0)
    →Room 右床头柜 (-6.5, -1.5) 交互
    →living→entrance 门洞 (0, +4)
    →cnt-umbrella-stand (直觉位置或西北角)
    →cnt-entrance-tray (真正目标)
    →回 living 茶几 (猫事件后新钥匙位置)
    →返回 entrance 托盘
```

```
Path B（猫事件后路径）：
  entrance(玩家手持伞)
    →entrance→living 门洞 (0, 5)
    →living 茶几空位置 (0, 0.3)
    →新钥匙位置 (-3.2, -3.2) (cat event 后)
    →entrance 托盘
```

### 4.2 DD（Door Blocking：家具挡门洞）判定

对任一门洞：
- 门洞的 room-local offset (dx, dz) + 宽度 w = 走行带：
  XZ 条带：
  - 门洞在 X 墙（living→bedroom，offset x=-4 z=0 width 1.5）：
    走行带 = {x ∈ [-4-0.75-0.3, -4+0.75+0.3], z ∈ [0-0.75-0.3, 0+0.75+0.3]} 即 x ∈ [-5.05, -2.95], z ∈ [-1.05, 1.05]
  - 任何家具 AABB（或 circle）与该带的交集 ≥ 0.2 × 0.2 ㎡ 面积 → DD ≥ 1
  - 真人 10 次往返被卡 ≥ 1 次 → DD ≥ 1

### 4.3 当前已知的 DD 风险

- Bedroom：修正 DF 后，门口书架 world (-4.6, 1.0) x∈[-4.95,-4.25] z∈[0.85,1.15]
  → 书架 x 范围最右 -4.25 < 门洞走行带 x 边界 -2.95（OK），但 z 范围 0.85–1.15 与门洞走行 z 上限 1.05 重叠 0.1m → 玩家通过时沿 z 轴蹭到书架 → DD=Yes。
  → P2 Bedroom 必需：书架视觉 + DF 碰撞北移到 z=2.0（room-local），或者 DF size 缩到只保留薄度（仍会挡，首选北移）。

### 4.4 OT（Occludes Target：遮挡任务目标 / 阻挡接近）判定

对任一关键目标 T（交互圈默认半径 R=2.5m，可被 container 尺寸调整）：
- 玩家从"最可能的入口方向"到目标 T 的直线，必须能通过
- 从 4 个正交方向（N/S/E/W）都能进入 T 的交互圈 AABB 内（至少 1 个方向能进入）
- 若走到目标附近却被一件与任务无关的家具阻挡 ≥ 3 次尝试 → OT ≥ 1

### 4.5 当前已知的 OT 风险

- Bedroom：Room 右床头柜在 (-6.5,-1.5)，但真正交互点在 (-7.5,+0.8) →
  玩家按视觉方向 F 不到 → 错误地"找不到手机"（实际手机 hidden 在另一个容器） → OT 核心 Bug。
- Entrance：Room 画的门洞旁托盘 (-0.4,5.7) 与真正 TC (-1.4,9.0) →
  玩家把物品放门洞旁（F 不上），wrongPlacements 一直加 → OT 核心 Bug。
- Entrance：浅托盘 TC 的 XZ 碰撞 (size 0.8×0.1) 阻挡玩家贴近表面放物品 →
  玩家 F 圈进不去 → 交互失败（是否 OT 需 P2 真人实测）。

---

## 5. 研究数据采集的空间有效性认证（版本级优先，非每 session 人工）

### 5.0 认证粒度（用户 §九 强制要求：版本级优先，非每 session 人工七项）

空间有效性认证**优先按 `build_version + task_version + scene_version` 进行版本级 QA 认证**：

1. **版本级 QA 出具 certification**：
   - 每次发布新 build、改 task 配置、改 scene 布局（含 decorFurniture / Room3D / TC 位置）后，QA 必须对该版本（build + task + scene 三元组）执行一次完整七条件（§7）人工走查 + 静态 diff。
   - 七条件全通过 → 该 (build, task, scene) 版本记为 **QA-certified**，输出 certification JSON（版本号 + 日期 + 审计员签名 + 七条件通过记录）。

2. **普通玩家 Session 继承版本级认证**：
   - 同一 QA-certified 版本中的普通玩家 Session，只要：
     - Session 的 build / task / scene version 与认证版本**完全一致**；
     - 未命中以下 §5.2 四类 invalid 触发条件；
   - → 即可**直接继承该版本的 spatial_validity = research-valid**，**不再要求每个普通玩家 Session 都由人工重新走完整七项 checklist**。

3. **人工七项 checklist 的使用场景缩小为**：
   - (a) 每次新版本发布 → 出具版本级 certification；
   - (b) 疑似被空间 Bug 影响的失败 Session：抽样复核（随机 ≥ 5% 或失败集中度 top 10%）；
   - (c) 研究数据集最终打包前的随机抽样 ≥ 5% 子集人工验证。

### 5.1 单独标 invalid 的 Session（触发任一即不研究有效）

1. 玩家报告了**新的空间 Bug**，并被 QA 核实（命中了该版本 certification 未覆盖的 SV1–SV8）；
2. 玩家使用了 Debug API / teleport / setRobotPosition / skipStage 等（session 中有 debug:* 事件）；
3. 发生**不可恢复软锁**（卡 ≥ 30 s 且无合法放回 / 腾手路径）；
4. 当前构建或场景版本**与 QA-certified 版本不一致**（即 certification 已过期，build/task/scene 任一 version 变动但未重跑 QA）。

### 5.2 其他研究有效性前置（仍保留但无需每 session 人工 QA）

1. 玩家不是开发者（避免知识污染）；
2. 对扰动机制不了解（第一次玩或 N ≤ 3 次内）；
3. 试玩前仅阅读 default briefing + 通用 help 文字，不读源码；
4. 试玩过程中玩家未被任何 SV1-SV8 问题卡住 ≥ 30 s（被卡 → 按 §5.1 标 invalid，由 QA 抽样确认）。

### 5.3 版本级 QA Certification 模板（每版本一份，非每 session 一份）

```yaml
# 文件名：qa_sv_certification_<build>_<task>_<scene>.yaml
build_version: <e.g. 1.2.0>
task_id: task-leave-home
task_version: <task config hash or manual>
scene_version: <rooms + decorFurniture hash or manual>
spatial_validity_qa:
  auditor: <name>
  date: <ISO date>
  checklist:
    SV1_visual_collision_match: true
    SV2_no_duplicate_task_visual: true
    SV3_interactable_has_visual: true
    SV4_no_fake_visual_target: true
    SV5_critical_path_clear: true
    SV6_no_target_mislead_decor: true
    SV7_objective_vs_predicate_consistent: true
    SV8_no_hand_softlock_path: true
    notes: |
      本版本七条件全部通过，普通玩家 Session 可继承 research-valid 标识。
      注意：invalid Session 仍需按 §5.1 四类条件单独剔除。
  overall: qa-pass
```

### 5.4 Session 级 QA 附件（仅在抽样复核时使用）

```yaml
# 抽样复核 session 时附带
session_id: <uuid>
qa_review:
  reviewed: true/false
  invalid_trigger: none | player-reported-sv-bug | debug-api-used | softlock | version-mismatch
  auditor_note: <str>
```

---

## 6. 研究无效 Session 判定清单

出现以下任一情况 → 该 Session 不应被视为 research-valid，不得计入"记忆失败率 / 恢复率 / 策略分类"的研究数据，只能作为 QA 或 Bug Repro 样本：

| # | 情况（SV1-SV8 触发或 Gate 任一条件不满足） | 处理方式 |
|---|---|---|
| 1 | 视觉家具与碰撞错位 ≥ 0.5 m，玩家被挡 / 穿空 ≥ 1 次（SV1） | 标 invalid，计入 P2 Living/Bedroom/Entrance 修复回归样本 |
| 2 | 任务家具出现两个视觉副本（SV2），玩家 F 了假副本 1 次以上 | 标 invalid，wrongPlacements / containerMistakes 不计入研究聚合 |
| 3 | 玩家看见的容器无法交互（SV3） | 标 invalid，failureReasons 不计 forgot-location / container-mistakes（实际是 SV bug） |
| 4 | 可交互容器没有对应视觉（SV4，玩家必须靠 HUD F 圈高亮发现） | 标 invalid（不是观察→记忆闭环） |
| 5 | 家具或隐形碰撞挡住必经路线（SV5 / DD / OT） | 标 invalid，不计超时 / 游荡次数的统计聚合 |
| 6 | 非任务装饰误导玩家去错误位置 ≥ 1 次（SV6，如 entrance 装饰伞/假托盘） | 标 invalid，对应 failure_reason 不计 |
| 7 | 阶段文案 objective 与 predicate 判定不一致（SV7，如 L1 顺序倒置） | 标 invalid，对应 stage 相关的 time / 成功率 不聚合 |
| 8 | 手持 1 限制下进入无法继续的路径（SV8，如 L2 先拿钥匙+拿手机，需多次腾手但系统无合法放回目标区） | 标 invalid，不计"恢复失败"类标签（实际是顺序误导 + 路径设计） |
| 9 | 使用 Debug / 瞬移 / 代码级状态设置（Spatial Validity Gate 条件 6） | 永远不进入研究数据集 |
| 10 | 玩家报告"这是 Bug 吧？我过不去 / F 不上"且 QA 核实属于 SV1-SV8 之一 | 标 invalid |

### 6.1 不影响研究有效性但需记录的小瑕疵

以下情况可保留为 research-valid，但要在 QA 附件打标，做敏感度分析：
- 非关键装饰（如挂画、挂钟、植物、落地灯等非任务目标）视觉与碰撞错位 ε 0.2-0.5 m，且不挡关键路径
- 非关键装饰的轻微重复视觉（如茶几上遥控器有两个、沙发抱枕位置不对）
- 碰撞与视觉的 Y 高度差异（纯 Y 无影响；因为碰撞纯 XZ，不读 size.y）

---

## 7. Spatial Validity Gate 七条件

一个 Session 只有**同时满足以下 7 条**，其数据才可被标记为 **research-valid**：

1. **关键路径可达（SV5）**：从 spawn → 所有关键目标 → 完成点路径 100% 畅通（DD=0、OT=0）
2. **关键目标视觉与交互位置一致（SV1 ∩ SV3）**：关键目标清单 100% 通过 ε ≤ 0.2 m + ≥ 80% 重叠
3. **无重复任务家具视觉（SV2 ∩ SV4）**：每个任务语义只能有一份视觉 + 一份碰撞
4. **无明显视觉碰撞错位（SV1 非关键件宽松）**：非关键装饰的错位件数 ≤ 总件数 10%，且未被玩家撞上
5. **无不可恢复软锁（SV8）**：手持 1 限制下，错放后有至少一条合法放回路径（或放置失败即提示放回位置；不强制但推荐），玩家不会卡 ≥ 30 s
6. **无 Debug / 瞬移（Gate 6）**：session.events 中无 debug:* / teleport:* / setRobotPosition 调用
7. **阶段文案与判定一致（SV7）**：每个 stage 的 playerObjective 与 completionCondition ↔ predicate 双向检查通过

### 7.1 七条件的执行粒度（版本级 QA + 抽样复核，不每 session 人工）

- **版本级 QA（每 build/task/scene 版本一份 certification，执行完整七项，100% 人工 + 静态脚本）**：
  - 条件 1（关键路径可达）、2（关键目标视觉/交互一致）、3（无重复任务视觉）、4（非关键错位率 ≤ 10%）、5（无不可恢复软锁）、6（无 Debug 标志）、7（阶段文案与判定一致）**全量执行**，不自动采集。
- **普通玩家 Session（继承版本级 QA，不执行七项人工全量）**：
  - 自动条件：§5.1 的 4 类 invalid 触发条件检查（条件 6 的 Debug 使用可用 events 自动过滤；version mismatch 可自动 diff）；
  - 其余条件默认继承版本级 certification；
  - 抽样复核：研究数据集 ≥ 5% Session 按 §5.4 抽样，再跑完整七项人工复核。
- P5 之后：1（关键路径脚本化）、3（duplicate visual 自动 diff）、6（debug event 过滤）可脚本化；其余仍需 QA 人工签。
- **研究对外声明规范**：必须明确注明 "All published sessions inherit version-level Spatial Validity QA certification (build_version + task_version + scene_version). Invalid sessions (player-reported SV bug / Debug API usage / unrecoverable softlock / version mismatch) have been excluded. A ≥ 5% random subset was manually QA-verified."

---

## 8. 契约修改与生效规则

1. 本契约的任何修改（例如放松 ε 阈值、增加/删除关键目标清单条目）必须与 product_v2_gap_report.md 的 Top-5 差距对齐，且必须先经过 P0 / P1 / P2 的人工 QA 回归。
2. 不得为了让现有 Session 通过而放松 §7 的七条件。
3. 不得为了"让 Scene Graph 激活"而增加 §2-§4 的复杂度或修改真值源为 SG。
4. 生效范围：仅覆盖公开 scope 三关 task-clean-table / task-leave-home / task-laundry-sort；不扩展到 breakfast / night-patrol。
5. 研究数据的公开声明必须引用本文件版本号，并明确声明 **build_version + task_version + scene_version 对应一份版本级 certification**（执行 §7 完整七项）；普通 Session 仅记录 certification ID，不随每份 Session 附完整七项 QA checklist；只有 **随机抽样 ≥ 5%** 或异常（玩家报告空间 Bug / Debug 使用 / 软锁 / 版本不匹配）的 Session 才附 Session 级 QA review 记录。

**§五 统一修正：删除 L335 原末尾冲突条款"每份 session 附 QA checklist JSON"。** 正确的认证方式（§7.1 已写，§8.5 再次确认）：
- **版本级 certification**：build_version + task_version + scene_version 对应一份版本级 certification（完整七项 audit），生成 certification_id（如 CERT_LEAVE_HOME_L2_P2_FIXED_2026XXXX），版本级 certification 随 release 发布一次、不随每份 Session 重复。
- **普通 Session**：记录 `spatial_certification_id = certification_id` 即可。
- **Invalid 条件**：玩家报告空间 Bug、Debug 使用、软锁、版本不匹配等四种情况之一时，单独标 invalid。
- **人工复核**：随机抽样至少 5% Session 做人工复核；外加所有 invalid Session 全部人工复核。
- **只有抽样或异常 Session** 才附 Session 级 QA review；普通 Session 不附完整七项 checklist。
