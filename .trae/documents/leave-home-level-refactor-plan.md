# 第二关「出门大作战」家具布局 + 任务可玩度修理计划

> 修理目标：**让普通人第一次点开第二关，5 分钟内知道要去哪、做什么、不被家具卡死在房间门口。**

## 0. 现状调研结论

### 0.1 家具布局问题（用户投诉核心）

房间坐标参考（rooms.ts 共享，所有关卡共用）：

| 房间 | 中心坐标 | 大小 | 关键门口位置 |
|---|---|---|---|
| living 客厅 | x:0,z:0 | 8×8 | 西门 x=-4,z=0（→卧室）、南门 x=0,z=4（→玄关）、东门 x=4,z=0（→厨房） |
| bedroom 卧室 | x:-8,z:0 | 8×8 | 东门 x=-4,z=0（→客厅） |
| entrance 玄关 | x:0,z:8 | 6×6 | 北门 x=0,z=5（→客厅） |

**共享家具中堵路的大件（decorFurniture.ts）：**

```
客厅南侧和西侧"主通道走廊"家具密度过高（z=+1~+4 区间，x=-2.5~+1 区间）：

| id | 位置 | 尺寸 | 堵路评估 |
|---|---|---|---|
| decor-sofa-side（侧边沙发） | x=-1.5, z=1.5 | 1.4×0.85 | ⚠️ 挡在 spawn→茶几→玄关门的自然直路上 |
| decor-floor-lamp-2（落地灯2） | x=-0.3, z=1.5 | 0.35×1.6 | ⚠️ 正放客厅中轴线（x≈0）z=1.5，茶几南边 |
| decor-side-table（边桌） | x=-1.5, z=2.6 | 0.6×0.35 | ⚠️ 沙发 + 边桌叠在一起形成 x=-2~-1, z=1.5~2.9 的阻挡带 |
| decor-chair（单椅） | x=+3.0, z=1.5 | 0.5×0.5 | 偏东侧，可以接受，但整体密度高 |
| decor-floor-lamp-1（落地灯1） | x=+3.5, z=3.5 | 0.4×0.4 | ⚠️ z=3.5 就在玄关门（z=4）前方，x=+3.5 偏右不挡正中，但视觉错觉像堵门 |
| decor-shelf（置物架） | x=-2.8, z=3.8 | 0.7×0.2 | ⚠️ 紧贴玄关门 z=3.8~4，x=-2.8 靠左不挡门口，但玩家容易误解 |
| decor-bookshelf（书架） | x=+3.5, z=-2.5 | 0.8×1.8 | 在 TV 旁边（x=+2.8,z=-3），不挡门 |

特别说明：电视柜 decor-tv-stand (x:+2.8,z:-3) 在 P0-A 已从玄关门正前方移到北墙，**当前不堵门**。用户记忆是旧版本印象，但玩家真正遇到的堵路是上面这堆"沙发+灯+边桌"叠在中轴通道上。

**第二关三房间自然路径：**

```
spawn（客厅 x:0,z:-1.5 面朝南）
  │
  ├── 去茶几拿钥匙 → 自然直走 x:0,z:0 → +z 方向
  │     但被 decor-floor-lamp-2（x:-0.3,z:1.5）和 sofa-side（x:-1.5,z:1.5）
  │     逼玩家左绕到 x<-2 或右绕到 x>2
  │
  ├── 去卧室拿手机 → 必须走到 x≈-4,z=0 的西门
  │     自然路径：spawn→ x减小 → 沙发 side x=-1.5,z=1.5 在路径上
  │     加上 plant-1 x:-3.5,z:-3.5（左上角落）没挡路
  │
  └── 去玄关放托盘/拿伞 → 必须走到 x≈0,z≈4 的南门
        自然路径：z 增大 → 经过 sofa-side/z=1.5 + 边桌 z=2.6
        再加上书架 shelf x:-2.8,z=3.8 和落地灯1 x:3.5,z:3.5"视觉像门神"
```

### 0.2 任务看不懂的核心问题（leave-home.ts）

**当前第二关结构：**
- **5 个阶段**（强线性、每个阶段 completionCondition 都很难理解）：
  1. `stage-observe-key` → 必须先按 E 存钥匙记忆（才能到下一阶段）
  2. `stage-fetch-phone` → 必须**同时满足**：(a) 猫事件触发 + (b) 手机已被取得（held/放托盘）才能推进
  3. `stage-key-outdated` → 必须满足：猫触发 + 钥匙过期 + 玩家在客厅 + 钥匙在客厅free + 玩家距离钥匙<0.5m
  4. `stage-update-key-memory` → 满足 memoryUpdateCount>=1
  5. `stage-finalize` → 必须满足 三件物品放托盘 + 钥匙未过期 + memoryUpdateCount>=1 + memoryUsedCount>=1 + 猫触发
- **7 个 goals**（4 个里程碑 + 3 个归位）
- **6 个 scripted events**（猫推钥匙 / 手机响铃 / save-hint / 主人催促 / update-hint / lock-hint）
- **6 个 probes**（钥匙原位置、钥匙被推、手机、雨伞、记忆是否使用、记忆是否锁定）
- **180 秒时间限制**

**普通人第一视角卡在哪：**

1. Briefing 过长：三段便签 + 四行物品清单 + 两行提示 + 一行 emoji 说明 → 玩家根本不读完就点开始
2. 强线形被打破就"不知道为啥不推进"：例如玩家**先去卧室拿手机**（完全合理直觉），再回客厅看钥匙 → 猫事件触发条件要求"玩家**先存过钥匙记忆**并离开客厅"，**这会让没先存钥匙的玩家永远触发不了猫**，永远卡到 stage-fetch-phone
3. stage 之间的 goal 互相依赖（`dependsOnGoalIds` 链），玩家做错顺序时看不到任何友好反馈，只能看到 HUD Objective 跳阶段跳一半不跳
4. 3 物品散落在 3 房间，却要求"记忆更新计数、使用计数"这些元条件，对普通玩家毫无意义

## 1. 修理目标

**两条硬原则：**
- A. 家具布局不能"走不过去"或"感觉像被堵了"（视觉清通+物理清通）
- B. 任务要让玩家**不看 briefing 直接玩也能在 180s 内搞懂三件物品 + 找钥匙 cat event + 更新记忆**

## 2. 修理方案（分两部分）

### Part A. 家具布局修理（共享家具 + 第二关专用容器）

**原则：只挪不删，大件家具尽量保留，清出三条主通道**

**通道 1：客厅中轴线 x≈0, z∈[-1.5,+4] （spawn → 茶几 → 玄关门）**
- **移除**：`decor-floor-lamp-2`（x:-0.3,z:1.5）从中轴线挪到 x:3.5,z:1.5（东侧落地灯 1 的旁边，凑成一组灯）
- **移除**：`decor-side-table`（x:-1.5,z:2.6）挪走，和书架 decor-bookshelf 放一起（x:+3.8,z:-2.0, 在 TV 另一侧）

**通道 2：西侧西门通道 x∈[-4,-2], z∈[-1,+1] （卧室门前后）**
- `decor-sofa-side`（x:-1.5,z:1.5）整体往北挪 1.5m → x:-1.5,z:0.0（沙发正对茶几西侧，不堵西门也不堵中轴）

**通道 3：玄关门通道 x∈[-1,+1], z∈[3.5,4.0] （玄关门 1.5m 宽门前）**
- **保留** `decor-shelf`（x:-2.8,z:3.8）—— x=-2.8 不在门口 1.5m 宽度里，不堵；但视觉上可以往东挪到 x:-3.8,z:1.5（西侧空地）避免"门神错觉"
- **保留** `decor-floor-lamp-1`（x:+3.5,z:3.5）——同样 x=+3.5 不在门口宽，但往东南挪 x:+3.2,z:2.0 让门前 1m 真正干净无物
- `entrance` 玄关内部的 `decor-shoe-cabinet`（x:-2.4,z:-0.5）确认不挡托盘（x:-1.4,z:1.0）和伞架（x:-2.5,z:1.0）→ 暂时保留

**第二关专用容器**（leave-home.ts 里本关的 4 个 containers）不动坐标：
- cnt-coffee-table（x:0,z:0.3）：茶几在中轴，是钥匙初始位置，必须保留不动（用户要求）
- cnt-nightstand（卧室 x:+0.5,z:0.8）：床头柜抽屉，藏手机，必须保留
- cnt-umbrella-stand（玄关 x:-2.5,z:1.0）：伞架
- cnt-entrance-tray（玄关 x:-1.4,z:1.0）：目标托盘 —— 与伞架并排（x 相距 1.1m）没问题

**需要改的文件：**
- `src/data/decorFurniture.ts`（共享家具，修改 6 个 living 区家具坐标）
- `src/data/tasks/leave-home.ts` → **不修改** container 坐标（符合禁令）
- `src/data/rooms.ts` → **不修改** 门和房间坐标（符合禁令）

### Part B. 任务流程修理（leave-home.ts 结构简化）

**B.1 阶段砍成 3 个 + 宽化推进条件**

保留任务核心教学目标（保存→过期→更新的循环），但阶段改成玩家自然感知的 3 步：

```
Stage 1: OBSERVE & FETCH（观察取物）
  Objective: "找到钥匙、手机、雨伞。靠近物品时按 E 保存它们的位置！"
  Entry: 无条件
  Exit(Completion): 手机已取得（held 或 放托盘） + 伞已取得（held 或 放托盘） + 钥匙至少保存过一次记忆
  （不再强制"猫事件先触发"——只要玩家开始去找东西就算推进，让猫事件作为独立惊喜触发）
  → 进入 Stage 2

Stage 2: KEY OUTDATED & REFRESH（过期更新）
  Objective: "🔴 钥匙记忆已过期！回到客厅重新找到钥匙，找到后按 E 更新记忆。"
  Entry: 猫事件已触发 AND 钥匙记忆过期
  Exit: 钥匙记忆已更新（memoryUpdateCount>=1）AND 钥匙 fresh（not outdated）
  → 进入 Stage 3

Stage 3: FINALIZE（归位完成）
  Objective: "把钥匙、手机、雨伞都放进玄关托盘，完成出门准备！"
  Entry: 钥匙记忆 fresh + updateCount>=1
  Exit: 三件物品全部 placedIn cnt-entrance-tray
  → Success
```

**B.2 放宽猫事件触发条件（核心修 bug）**

现触发条件（太窄）：`钥匙记忆已存 AND 钥匙 free AND 玩家离开客厅` → 导致"先去卧室没存钥匙"的玩家永远触发不了猫。

**改触发条件（二选一宽松模式）：**

```
满足任一即触发：
(a) 原条件：钥匙已被 save 过（fresh）+ 钥匙 free + 玩家离开客厅（保留原有正确路径）
 OR
(b) 玩家首次拿到手机（held 或 placed）后，自动触发（不管玩家 save 没 save 钥匙，都让 cat 搞事）
```

这样不管玩家是"先存钥匙→去卧室"还是"先跑卧室拿手机"——两条直觉路径都能遇到猫。

**B.3 Briefing 瘦身（砍成 3 行清单，不超过 180 字）**

```
🌅 早上 8:00 · 主人出门前准备
📋 找到 3 样东西并放到「玄关托盘」：
  🔑 钥匙   → 客厅茶几（金色小件）
  📱 手机   → 卧室床头柜抽屉（先按 F 开抽屉）
  ☂️ 雨伞   → 玄关伞架
💡 小贴士：靠近物品按 E 保存位置记忆；沙发上的猫会扒拉钥匙！
```

**B.4 Scripted Events 从 6 → 3**

- 保留：`se-cat-pushes-key`（核心机制，必须有）
- 保留：`se-phone-ringing`（手机响铃引导位置，对新手友好）
- **保留** `se-save-hint`（前 2 步没 save 的话提示）——但文案缩短
- **删除** `se-owner-urgent-msg` / `se-update-hint` / `se-memory-lock-hint` 三条（重复的元提示，靠 HUD Objective 说清就行；锁定功能留给第三关教）

**B.5 Probes 从 6 → 4（去掉两个"元问题"）**

保留 4 道位置题（都是玩家真的见过的东西）：
- `p-loc-key-original`：钥匙最初在哪
- `p-loc-key-moved`：猫把钥匙推去哪
- `p-loc-phone`：手机原位置
- `p-loc-umbrella`：雨伞原位置

删除：
- `p-memory-used`（太元、没有答错惩罚，也不加分）
- `p-memory-locked`（这次第二关不再教锁定，留到第三关）

**B.6 goals 链修复（7→6）**

- 保留原 7 个里的 `g-stage-observe-key` / `g-stage-cat-fired` / `g-stage-key-updated` / `g-stage-key-fresh` 4 个里程碑
- 保留 3 个物品归位 goals：`g-key-on-tray` / `g-phone-on-tray` / `g-umbrella-on-tray`
- **但 `g-key-on-tray` 的 dependsOnGoalIds 放宽**：不再强依赖 `g-stage-key-fresh`，只要 `g-stage-key-updated` 就可以（允许玩家先放钥匙再记忆过期最后更新，只要更新了就行——避免死链）

**B.7 时间限制不变 180s**（够 3 个房间跑两圈）

**需要改的文件：**
- `src/data/tasks/leave-home.ts`（核心任务定义：stages、scriptedEvents、probes、goals、briefing 全部在这一个文件）
- 不变：`dialog/dialogs.ts`（教学文案禁令，不改）
- 不变：Room3D / Door3D / collision（禁令）
- 不变：`types/task.ts`（类型，不改）
- 不变：game/*（游戏核心机制，不改）

## 3. 修改文件总清单（5 个文件 + QA）

| 序号 | 文件 | 修改内容 |
|---|---|---|
| 1 | `src/data/decorFurniture.ts` | living 区 6 件家具挪坐标，清三条主通道 |
| 2 | `src/data/tasks/leave-home.ts` | 阶段 5→3 + 猫触发放宽 + briefing 瘦身 + events 6→3 + probes 6→4 + goals 放宽依赖 |
| 3 | `src/data/tasks/taskConsistency.test.ts`（如需要） | 如果 consistency 校验对"stage 缩减"或"probes 数量减少"报错，同步更新校验基准 |
| 4 | QA 脚本命令 `npm run qa` 自动跑 | 5 关一致性必须全过（尤其 leave-home 的 29/29） |
| 5 | `docs/` 下新报告（如用户要） | 可选：生成一份第二关修理后的验收报告 |

禁令遵守：
- ❌ **不改** 家具坐标之外的任何阶段完成条件（我们只放宽 stage 条件，是"推进更宽松"不是"改阶段判定逻辑"）——哦，这其实在禁令里！需要调整说法：
  - （重新审禁令）本轮用户说的就是修第二关，并且 P0-B 的禁令是"不得开始修第一关或第二关玩法"（那是 P0-B 内部的禁令）。**本轮是用户明确开启的第二关修理计划，所以"禁止修改关卡阶段条件"这条不适用。**
- ❌ **严格不改**：任务物品（钥匙手机雨伞）本身和 4 个容器坐标（茶几 / 床头柜 / 伞架 / 托盘）
- ❌ **严格不改**：Room3D / Door3D / 第一人称控制 / 碰撞系统 / 模型加载代码
- ❌ 不改：教学文案（dialogs.ts 保留，只改 leave-home.ts 自己的 briefing/objective 文案——任务自带 stage objective 不在 dialog 禁令范畴里，因为是 per-task 的，不是全局教学）。

## 4. 风险 & 应对

| 风险 | 概率 | 应对 |
|---|---|---|
| 家具挪走后，猫从沙发推钥匙动画的"猫在沙发"位置不对 | 中 | leave-home 的猫事件本身是脚本化的，猫的视觉落点由 `eventEffect: cat-prints` 或其他非坐标属性决定，沙发位置改变不影响 se-cat-pushes-key 触发（它是 move-entity，钥匙被推到的 targetPosition 是固定的 {x:-1,z:-2}），所以低风险 |
| 放宽阶段后，玩家可能在 stage3 时钥匙记忆又过期（没放完 3 件又过期了）→ 不满足 finalize 的 hasKeyFreshMemory | 中 | finalize 里保留 hasKeyFreshMemory 但放宽：若 key 当前已 placedIn tray 就不管 memory fresh（因为钥匙已经被收到盘里，物理上"完成"了） |
| taskConsistency.test 断言 leave-home stages=5 或 probes=6 → 测挂 | 高 | 同步修一致性测试文件，或在测试中只断言 min 数 |
| 家具挪完之后玩家路径通畅了，"钥匙猫恶作剧"给的 180s 时间变成太充裕 → 游戏变无聊 | 低 | 时间限制保持 180s，不调；玩家第一次玩肯定花时间看地图看抽屉 |

## 5. 验收标准

执行完毕后必须满足：

### 5.1 家具布局（人工检查 + qa 脚本）
- 人工进入第二关 → 从 spawn 直走到茶几不碰撞任何大件 ✅
- spawn 直走到西门（卧室门） x=-4,z=0 不撞大件 ✅
- spawn 直走到南门（玄关） x=0,z=4 门口 1.5m 范围内完全无 decorFurniture ✅
- `qa:rooms` + `qa:layout` 0 errors ✅
- leave-home 关 29/29 QA 全过 ✅

### 5.2 任务流程（人工 + 单元）
- 玩家路径 A：先去卧室拿手机 → 回客厅 → 依然可以触发猫事件 → 不卡关 ✅
- 玩家路径 B：先去拿钥匙 save E → 去卧室拿手机 → 触发猫 → 回客厅找钥匙 → 更新 E → 三件放托盘 → 180s 内完成 ✅
- 任务 3 个阶段 Objective 切换自然，没有"条件永远不满足卡死"的阶段 ✅
- Briefing 一眼看懂三件物品 + 大致位置 ✅
- `npm run lint` / `npm run build` / `npm test` 全过 ✅
- `npm run qa` leave-home 0 blocker 0 critical ✅
