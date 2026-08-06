# Three-Level Research MVP Spec

## Why
当前项目关卡记忆机制密度不足、Aha Moment 触发率低，且部分核心物体仍为程序化方块。需要冻结设计为三关 vertical slice，每关突出一种记忆机制（符号/感知程序/整合），用本地 Kenney GLB 资产重做，形成可玩、好理解、具研究背景的研究型游戏原型。

## What Changes
- **L1 餐桌整理**：改为四件 Kenney 餐具（mug/plate/fork/spoon），确定性移走 spoon，符号记忆（计数+grounding）完整循环
- **L2 睡前仪式**：从"出门大作战"改为"睡前仪式"，三步动作序列（books→bookcase / mug→nightstand / bear→bed），Perceptual+Procedural Memory，保留 task-leave-home 内部 ID（TECH_DEBT）
- **L3 洗衣分拣**：六件衣物（pillow×2/pillowBlue×2/pillowLong×2）三类分拣，整合记忆，可选篮子交换干扰
- **资产补充**：从本地资产库导入 laptop/bear/pillowBlue/pillowLong 四个 GLB 到 public 并注册（pillow 已注册）
- **Golden Path 测试**：三关均新增/更新确定性 Golden Path 测试，使用真实命令（pick/place/saveMemory）
- **BREAKING**：L2 主题从"出门"改为"睡前仪式"，钥匙/手机/雨伞物体移除，换为 books/mug/bear

## Impact
- Affected specs: v2-research-demo（breakfast 旗舰关降级，L2 成为旗舰）
- Affected code:
  - `src/data/tasks/clean-table.ts`（L1 重做）
  - `src/data/tasks/leave-home.ts`（L2 重做，ID 保留）
  - `src/data/tasks/laundry-sort.ts`（L3 调整）
  - `src/data/assets/modelRegistry.ts`（注册 4 个新模型）
  - `src/data/assets/modelOverrides.ts`（新模型尺寸校准）
  - `public/assets/models/kenney/furniture/`（导入 4 个 GLB）
  - `src/game/threeLevelBackendSim.test.ts`（三关 Golden Path 更新）
  - `tests/e2e/`（Smoke 测试更新）

## ADDED Requirements

### Requirement: L1 Symbolic Memory Complete Loop
系统 SHALL 提供 L1 餐桌整理关卡，实现"编码→保持间隔→扰动→提取行动→Probe复盘"完整符号记忆循环。

#### Scenario: 四件餐具观察编码
- **WHEN** 玩家进入 L1，四件 Kenney 餐具（mug/plate/fork/spoon）摆在餐桌上
- **THEN** 提示"观察桌上物品，记住几件及分别是什么"，玩家可按 E 保存记忆

#### Scenario: 保持间隔与扰动
- **WHEN** 玩家离开餐桌前往水槽/橱柜完成短准备动作后
- **THEN** 猫确定性移走 spoon，桌面从 4 件变 3 件，不立即告知少了什么

#### Scenario: 找回与归位
- **WHEN** 玩家判断剩余数量、找到被移走的 spoon
- **THEN** 四件餐具归位：mug→kitchenSink, plate→kitchenCabinetDrawer, fork→kitchenCabinetDrawer, spoon→kitchenSink

#### Scenario: 不得软锁
- **WHEN** spoon 被移走
- **THEN** spoon 必须仍可找到且可拾取，不得导致永久无法完成

### Requirement: L2 Perceptual Procedural Memory Ritual
系统 SHALL 提供 L2 睡前仪式旗舰关，玩家观察三步示范后按序复现动作序列。

#### Scenario: 观察示范
- **WHEN** 玩家进入 L2
- **THEN** 轻量示范依次高亮 books→bookcaseOpen / mug→cabinetBedDrawer / bear→bedDouble 三步，每步 1-2 秒，示范结束后物体重置初始位置

#### Scenario: 序列复现
- **WHEN** 示范结束，高亮消失，仅保留目标"按刚才睡前仪式完成整理"
- **THEN** 玩家必须依次 place：books→bookcase, mug→nightstand, bear→bed，复用真实 pickup/carry/place

#### Scenario: 错误顺序可恢复
- **WHEN** 玩家错误顺序放置
- **THEN** 记录 sequence error，给短提示，物体退回或允许重新拾取，不得永久锁死，不得自动完成正确步骤

### Requirement: L3 Integrated Memory Sorting
系统 SHALL 提供 L3 洗衣分拣关，六件衣物三类分拣，可选篮子交换干扰。

#### Scenario: 规则编码与分类
- **WHEN** 玩家进入 L3，展示浅色→white basket / 深色→dark basket / 毛巾→towel basket
- **THEN** 隐藏大标签后，玩家依靠记忆完成 6 件分类（pillow×2/pillowBlue×2/pillowLong×2）

#### Scenario: 错误类别拒绝
- **WHEN** 玩家将错误类别放入篮子
- **THEN** 拒绝放置，给出原因，CARRY_ONE 生效

#### Scenario: 篮子交换干扰（可选）
- **WHEN** 玩家正确放置 3 件后
- **THEN** 交换 white/dark basket 位置但身份不变，玩家可通过颜色/记忆恢复
- **IF** 30 分钟内无法稳定实现
- **THEN** 降级保留基础分类，输出 L3_INTERFERENCE_DEFERRED

### Requirement: Kenney Asset Import
系统 SHALL 从本地资产库导入 laptop/bear/pillowBlue/pillowLong 四个 GLB 并注册到 Runtime Registry。

#### Scenario: 仅导入指定资产
- **WHEN** 阶段 A 执行资产补充
- **THEN** 只导入 4 个指定 stem，禁止全量扫描、导入未列出资产包、修改 Registry 架构、下载新模型

### Requirement: Three Golden Path Tests
系统 SHALL 为三关提供确定性 Golden Path 测试，使用真实命令。

#### Scenario: L1 Golden Path
- **WHEN** 运行 L1 测试
- **THEN** 观察四件→猫移走 spoon→找到 spoon→四件归位→completion→Probe→Result 全通过

#### Scenario: L2 Golden Path
- **WHEN** 运行 L2 测试
- **THEN** 观看示范→books→书架→mug→床头柜→bear→床→completion→Probe→Result 全通过，且验证错误顺序可恢复

#### Scenario: L3 Golden Path
- **WHEN** 运行 L3 测试
- **THEN** 两件浅色→white basket / 两件深色→dark basket / 两件毛巾→towel basket，错误类别被拒绝

## MODIFIED Requirements

### Requirement: Unified Game Experience
每关 SHALL 满足统一体验：当前目标始终只有一条；E=记忆/F=拾取放置/V=俯视；最多持有一物；不得多巨大光圈同屏；标签不遮物；核心物体不埋地悬空过大；错误给原因；可恢复；completion 前不进 Probe；Probe 完才进 Result。

### Requirement: Research Positioning
项目定位为"受 RoboMME 记忆能力分类启发的人类可交互研究型游戏原型"。不得声称已复现 RoboMME benchmark、已证明人类记忆机制、已完成正式用户实验、已获统计显著结论。

## REMOVED Requirements

### Requirement: L2 出门大作战主题
**Reason**: Kenney 包无钥匙/手机/雨伞模型，改用 books/mug/bear 实现全 Kenney 化睡前仪式
**Migration**: 保留 task-leave-home 内部 ID 避免路由重构，显示名改为"睡前仪式"，记录为 TECH_DEBT

### Requirement: breakfast/night-patrol 关卡激活
**Reason**: 本轮冻结为三关 MVP，不增加关卡
**Migration**: 继续保持隐藏，不删除数据文件

## Constraints
- 时间上限 4 小时，达到必须停止
- 不得 commit，不得 push
- 严格按阶段 A→B→C→D 顺序，L1 未过不得开始 L2，L2 三步未过不得加可选步骤
- 优先使用本地已下载 Kenney GLB
- 任务关键容器可保留程序化篮子/标签保证辨识度
- 可玩性优先于 100% GLB 覆盖率
- 不得开始 L4、L5
- 不得继续增加游戏系统

## EXECUTION OVERRIDES — FOUR-HOUR DELIVERY

> **本节优先级高于前文所有冲突要求。**

### 工作区恢复点
开始前先保存工作区恢复点：
```
git status --short > ../three-level-mvp-status.txt
git diff > ../three-level-mvp-before.patch
git ls-files --others --exclude-standard > ../three-level-mvp-untracked.txt
```
不得 commit，不得 push。

### 时间盒
- 阶段 A：20 分钟
- 阶段 B / L1：50 分钟
- 阶段 C / L2：90 分钟
- 阶段 D / L3：50 分钟
- 阶段 E：30 分钟
- 阶段缓冲：40 分钟，只处理 P0/P1

### 资产导入（覆盖前文）
仅限导入：
- `bear`
- `pillowBlue`
- `pillowLong`

`laptop` 本轮 **DEFERRED**，不导入、不注册。（覆盖前文 ADDED Requirements 中 Kenney Asset Import 的 4 个清单）

### L1 覆盖条款
- 计数答案和缺失物识别只在 Probe 中采集
- 玩家保存记忆并与 kitchenSink 交互后，确定性触发 spoon 移动
- 不新增中途答题 UI
- 不新增猫动画系统
- 可直接使用现有猫事件或固定位置变更

### L2 覆盖条款
- 禁止新增 NPC、Timeline、摄像机演出系统
- 示范只能使用现有高亮、ghost 或 scriptedEvent
- 错误顺序时拒绝放置并保持 held（不实现物体自动飞回动画）
- 本轮严格只有 books、mug、bear 三步（不添加 laptop/pillow 可选步骤）

### L3 覆盖条款
- 六件基础分类是必须项
- 篮子交换是纯可选项
- 基础分类通过后剩余时间少于 30 分钟，直接输出 `L3_INTERFERENCE_DEFERRED`

### 唯一视觉所有权
- task container 使用 GLB 时，删除同位置的 static decor GLB
- 禁止同一家具被 Room3D、decorFurniture、Container3D 同时渲染
- L3 三个篮子只由 task container 渲染

### 迁移检查
运行：
```
rg "obj-key|obj-phone|obj-umbrella|cnt-entrance-tray|cnt-umbrella-stand" src tests
```
所有旧 L2 对象引用必须删除或明确标记为隐藏旧数据。不得留下会参与 completion、Probe 或 scriptedEvent 的旧引用。

### 浏览器 Smoke
不自动执行 WASD、Pointer Lock 或完整通关。只验证页面、Canvas、Console、GLB 200 和路由。

### PASS 条件（覆盖前文 Gate）
允许：
- `L3_CORE_SORT_PASS`
- `L3_INTERFERENCE_DEFERRED`

前提是：
- L1 Golden Path PASS
- L2 三步 Golden Path PASS
- L3 六件分类 PASS
- 0 P0
- 0 P1
- build PASS
