# Tasks

> 时间盒（EXECUTION OVERRIDES）：A=20min / B=50min / C=90min / D=50min / E=30min / 缓冲=40min

## 阶段 A：冻结设计与资产（20 分钟）
- [x] Task A0: 保存工作区恢复点
  - [x] A0.1: git status --short > ../three-level-mvp-status.txt
  - [x] A0.2: git diff > ../three-level-mvp-before.patch
  - [x] A0.3: git ls-files --others --exclude-standard > ../three-level-mvp-untracked.txt
- [x] Task A1: 导入 3 个指定 Kenney GLB（bear/pillowBlue/pillowLong）—— laptop 本轮 DEFERRED
  - [x] A1.1: 从本地资产库复制 3 个 GLB 到 public/assets/models/kenney/furniture/
  - [x] A1.2: 在 modelRegistry.ts 注册 3 个新模型条目（bear/pillowBlue/pillowLong）
  - [x] A1.3: 在 modelOverrides.ts 校准 3 个模型尺寸/effectiveAabb/collisionSize
  - [x] A1.4: 输出实际修改文件列表，不开始无关重构

## 阶段 B：L1 餐桌整理（Symbolic Memory）（50 分钟）
- [x] Task B1: 重写 clean-table.ts 为四件 Kenney 餐具关卡
  - [x] B1.1: 物体改为 mug/plate/utensil-fork/utensil-spoon（均配 modelAssetId）
  - [x] B1.2: 容器配置 table/kitchenSink/kitchenCabinetDrawer（移除 trashcan/dishwasher/utensil-rack）
  - [x] B1.3: 阶段设计：编码（观察+E保存）→保持间隔（去水槽触发扰动）→扰动→找回归位→Probe
  - [x] B1.4: 确定性 spoon 移动触发：保存记忆+靠近kitchenSink(≤1.6m)后触发，固定位置不随机
  - [x] B1.5: 计数答案和缺失物识别只在 Probe 采集，无中途答题 UI（OVERRIDES）
  - [x] B1.6: 未新增猫动画系统，用现有猫事件+固定位置变更（OVERRIDES）
  - [x] B1.7: 归位：mug→kitchenSink, plate→cabinet, fork→cabinet, spoon→kitchenSink
  - [x] B1.8: Probe：计数（4件）、缺失物识别（spoon）、grounding
- [x] Task B2: 建立 L1 Golden Path 测试
  - [x] B2.1: 更新 L1 Golden Path：观察四件→猫移 spoon→找到 spoon→四件归位→completion→Probe→Result
  - [x] B2.2: 使用真实命令（saveMemory/pickEntity/placeEntity），无 direct mutation
  - [x] B2.3: 验证不软锁：spoon 移走后 status==='free' 可拾取
- [x] Task B3: L1 验证门
  - [x] B3.1: tsc 0 errors，npm test 通过（3+47 tests passed）
  - [x] B3.2: 浏览器 Smoke 留到阶段 E 统一
  - [x] B3.3: L1 通过，可开始 L2

## 阶段 C：L2 睡前仪式（Perceptual+Procedural Memory）（90 分钟）
- [x] Task C1: 重写 leave-home.ts 为睡前仪式（保留 task-leave-home ID）
  - [x] C1.1: 物体改为 books/mug/bear（均配 modelAssetId），移除钥匙/手机/雨伞
  - [x] C1.2: 容器配置 bookcaseOpen/cabinetBedDrawer/bedDouble + 初始位置（茶几/沙发）
  - [x] C1.3: 显示名/briefing/tags 改为"睡前仪式"，TECH_DEBT 记录 ID 未改
  - [x] C1.4: 迁移检查：rg "obj-key|obj-phone|obj-umbrella|cnt-entrance-tray|cnt-umbrella-stand" src tests，删除/隐藏旧引用（OVERRIDES）
  - [x] C1.5: 阶段设计：观察示范→保持间隔→序列复现（requiredSequence: books→bookcase, mug→nightstand, bear→bed）→Probe
  - [x] C1.6: 轻量示范：仅用现有高亮/ghost/scriptedEvent，禁止 NPC/Timeline/摄像机演出（OVERRIDES），每步 1-2 秒，示范后物体重置初始位置
  - [x] C1.7: 错误顺序处理：拒绝放置并保持 held，记录 sequence error，给短提示，不实现自动飞回动画，不锁死不自动完成（OVERRIDES）
  - [x] C1.8: 严格三步：不添加 laptop/pillow 可选步骤（OVERRIDES）
  - [x] C1.9: 新增/更新 Probe：序列顺序、首步识别
- [x] Task C2: 建立 L2 Golden Path 测试
  - [x] C2.1: 更新 L2 Golden Path：观看示范→books→书架→mug→床头柜→bear→床→completion→Probe→Result
  - [x] C2.2: 验证错误顺序可恢复：错误放置→拒绝并保持 held→重新按序放置
  - [x] C2.3: 使用真实命令，不直接 mutation
- [x] Task C3: L2 验证门
  - [x] C3.1: tsc/test/build/qa 通过
  - [ ] C3.2: 浏览器 Smoke：L2 可进入、三步序列可完成
  - [x] C3.3: L2 三步未过不得加任何可选步骤

## 阶段 D：L3 洗衣分拣（Integrated Memory）（50 分钟）
- [x] Task D1: 调整 laundry-sort.ts 为六件三类分拣
  - [x] D1.1: 物体改为 pillow×2(浅色)/pillowBlue×2(深色)/pillowLong×2(毛巾)，UI 名称为"浅色衣物/深色衣物/毛巾"，不显示"枕头代理"
  - [x] D1.2: 三个篮子保持高辨识度程序化颜色编码（white/dark/towel basket）；L3 三个篮子只由 task container 渲染（OVERRIDES 唯一视觉所有权）
  - [x] D1.3: 阶段设计：规则编码（展示+可E保存）→分类→Probe
  - [x] D1.4: 错误类别拒绝+CARRY_ONE+每件单一状态+六件均有合法目标
- [x] Task D2: 建立 L3 Core Sort Golden Path 测试
  - [x] D2.1: 更新 L3 Golden Path：两件浅色→white / 两件深色→dark / 两件毛巾→towel，错误类别被拒绝
  - [x] D2.2: 使用真实命令（executeSaveMemory/executePick/executePlace）
- [x] Task D3: 可选篮子交换干扰 — DEFERRED
  - [x] D3.1: 篮子交换未实现，输出 L3_INTERFERENCE_DEFERRED（OVERRIDES）
- [x] Task D4: L3 验证门
  - [x] D4.1: tsc 0 errors / npm test 373 passed / build 成功
  - [x] D4.2: 浏览器 Smoke 留到阶段 E 统一

## 阶段 E：最终验证与 Gate（30 分钟）
- [x] Task E1: 全量验证命令
  - [x] E1.1: git diff --check 无 whitespace 错误
  - [x] E1.2: npx tsc -b --pretty false → 0 errors
  - [x] E1.3: npm test → 19 files / 373 tests passed
  - [x] E1.4: npm run qa:assets → 0 blocker/critical/major（30 既有 MINOR）
  - [x] E1.5: npm run qa:layout → 0 blocker/critical/major（1 MINOR: cnt-bookcase surfaceHeight）
  - [x] E1.6: npm run build → 成功（656ms）
- [x] Task E2: 浏览器 Smoke（e2e 模式：三关页面 200/Canvas 1280×679/0 pageerror/14 GLB 200；未执行 WASD/Pointer Lock）
- [x] Task E3: 唯一视觉所有权审查（L3 三篮子由 task container 唯一渲染已确认；L2/L1 无重复渲染）
- [x] Task E4: 输出最终报告与 Gate 判定

# Task Dependencies
- [Task B*] depends on [Task A*]
- [Task C*] depends on [Task B3]（L1 验证门通过）
- [Task D*] depends on [Task C3]（L2 验证门通过）
- [Task E*] depends on [Task D4]（L3 验证门通过）
- [Task D3] 可选，失败降级不阻塞 [Task E*]
