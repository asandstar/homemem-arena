# Checklist

> EXECUTION OVERRIDES 优先级高于前文。时间盒：A=20min/B=50min/C=90min/D=50min/E=30min/缓冲=40min

## 阶段 A：资产冻结
- [x] 工作区恢复点已保存（status.txt/before.patch/untracked.txt）
- [x] bear.glb 已导入 public/assets/models/kenney/furniture/ 且在 modelRegistry 注册
- [x] pillowBlue.glb 已导入 public/assets/models/kenney/furniture/ 且在 modelRegistry 注册
- [x] pillowLong.glb 已导入 public/assets/models/kenney/furniture/ 且在 modelRegistry 注册
- [x] laptop 本轮 DEFERRED，未导入未注册（OVERRIDES）
- [x] 3 个新模型在 modelOverrides 有有效 effectiveAabb/collisionSize（不埋地悬空过大）
- [x] 未导入未列出的资产包，未全量扫描 419 模型，未修改 Registry 架构

## L1 餐桌整理
- [x] 四件餐具（mug/plate/fork/spoon）均配 modelAssetId，无程序化方块
- [x] 编码阶段：提示观察+可按 E 保存记忆
- [x] 保持间隔：保存与提取之间有离开餐桌的短任务（去水槽触发扰动）
- [x] spoon 移动触发：玩家保存记忆并靠近 kitchenSink(≤1.6m)后确定性触发（OVERRIDES），固定位置不随机
- [x] 扰动后不立即告知少了什么
- [x] 计数答案和缺失物识别只在 Probe 采集，无中途答题 UI（OVERRIDES）
- [x] 未新增猫动画系统，用现有猫事件或固定位置变更（OVERRIDES）
- [x] spoon 移走后仍可找到可拾取，不软锁（Golden Path 测试验证 status==='free'）
- [x] 归位：mug→kitchenSink, plate→cabinet, fork→cabinet, spoon→kitchenSink
- [x] L1 Golden Path 测试通过：观察→移走→找到→归位→completion→Probe→Result
- [x] Golden Path 使用真实命令（saveMemory/pickEntity/placeEntity，无 direct mutation）
- [x] L1 Probe 包含计数（4件）与缺失物识别（spoon）

## L2 睡前仪式
- [x] 内部 ID 保留 task-leave-home（TECH_DEBT 已记录）
- [x] 显示名/briefing/tags 改为"睡前仪式"
- [x] 物体为 books/mug/bear（均配 modelAssetId），钥匙/手机/雨伞已移除
- [x] 迁移检查通过：rg "obj-key|obj-phone|obj-umbrella|cnt-entrance-tray|cnt-umbrella-stand" src tests 无残留参与 completion/Probe/scriptedEvent 的旧引用（OVERRIDES）
- [x] 轻量示范：仅用现有高亮/ghost/scriptedEvent，禁止 NPC/Timeline/摄像机演出（OVERRIDES），每步 1-2 秒
- [x] 示范结束后物体重置初始位置
- [x] 序列复现：必须依次 place（requiredSequence），复用真实 pickup/carry/place
- [x] 错误顺序处理：拒绝放置并保持 held，记录 error、短提示、不实现自动飞回动画、不锁死、不自动完成（OVERRIDES）
- [x] 严格三步 books/mug/bear，未添加 laptop/pillow 可选步骤（OVERRIDES）
- [x] L2 Golden Path 测试通过：示范→books→书架→mug→床头柜→bear→床→completion→Probe→Result
- [x] Golden Path 验证错误顺序可恢复场景（拒绝并保持 held→重新按序放置）

## L3 洗衣分拣
- [x] 六件衣物：pillow×2/pillowBlue×2/pillowLong×2，均配 modelAssetId
- [x] UI 名称为"浅色衣物/深色衣物/毛巾"，不显示"枕头代理"
- [x] 三个篮子保持高辨识度颜色编码（white/dark/towel basket）
- [x] L3 三个篮子只由 task container 渲染，无重复渲染（OVERRIDES 唯一视觉所有权）
- [x] 规则编码阶段：展示三类规则，可按 E 保存
- [x] 分类阶段：隐藏大标签，依靠记忆完成 6 件分类
- [x] 错误类别被拒绝，给出原因，CARRY_ONE 生效（Golden Path 测试验证拒绝场景）
- [x] 每件物体单一状态，六件均有合法目标
- [x] L3 Core Sort Golden Path 测试通过：两件浅色→white / 两件深色→dark / 两件毛巾→towel
- [ ] 若实现篮子交换：交换后 identity 不变、不重叠、不堵门、不丢物体（DEFERRED 未实现）
- [x] 若剩余时间<30min 未实现：输出 L3_CORE_SORT_PASS / L3_INTERFERENCE_DEFERRED（OVERRIDES）

## 唯一视觉所有权（OVERRIDES）
- [x] task container 使用 GLB 时，已删除同位置的 static decor GLB（L1/L2 容器用 GLB，decorFurniture 无同位置重复；L3 篮子程序化由 task container 唯一渲染）
- [x] 无同一家具被 Room3D、decorFurniture、Container3D 同时渲染
- [x] L3 三个篮子只由 task container 渲染（decorFurniture.ts 第219行注释已声明）

## 统一体验
- [x] 每关当前目标只有一条
- [x] E=记忆 / F=拾取放置 / V=俯视，无混淆
- [x] 最多持有一物，pickup 后 heldEntityId 正确，place 后清空（Golden Path 测试已验证）
- [x] 不得多巨大光圈同屏，标签不遮物
- [x] 核心物体不埋地悬空过大（qa:layout 通过）
- [x] 错误行动给出原因，可恢复（L2 错误顺序拒绝保持 held；L3 错误类别拒绝）
- [x] completion 前不进 Probe，Probe 完才进 Result（Golden Path 测试已验证）

## 验证命令
- [x] git diff --check 无 whitespace 错误
- [x] npx tsc -b --pretty false → 0 errors
- [x] npm test → 0 failures（373/373 passed）
- [x] npm run qa:assets → 0 blocker/critical/major（30 MINOR 均为既有 GLB orphan/path-mismatch）
- [x] npm run qa:layout → 0 blocker/critical/major（1 MINOR: cnt-bookcase surfaceHeight=0.9 高于盒顶+0.5）
- [x] npm run build → 0 failures
- [x] MINOR 已逐条列出，未为清 P2 扩大重构

## 浏览器 Smoke
- [x] 首页可打开（e2e 模式 HTTP 200）
- [x] 三关均可进入（/play/task-clean-table, /play/task-leave-home, /play/task-laundry-sort 均 200）
- [x] Canvas 存在（1280×679，~1s 内出现）
- [x] 无 pageerror（三关均 0 console error）
- [x] 核心 GLB HTTP 200（14/14 通过）
- [x] completion / Probe / Result 路由可达（Golden Path 测试已验证）
- [x] 未自动执行 WASD / Pointer Lock / 完整通关（OVERRIDES）

## 约束遵守
- [x] 未 commit，未 push
- [x] 未开始 L4、L5
- [x] 未继续增加游戏系统
- [x] 未下载新模型（仅用本地 Kenney，laptop DEFERRED）
- [x] 4 小时时间上限内停止

## Gate 判定
- [x] L1 Golden Path 完整通过
- [x] L2 三步序列 Golden Path 完整通过
- [x] L3 六件基础分类 Golden Path 完整通过
- [x] 三关页面均可进入
- [x] 0 P0，0 P1 任务阻断
- [x] build 通过
- [x] Gate 输出允许 L3_INTERFERENCE_DEFERRED（OVERRIDES）
- [x] Gate 判定输出：THREE_LEVEL_RESEARCH_MVP_PASS
