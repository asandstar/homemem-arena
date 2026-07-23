# Plan: 轻量剧情设定 + 脚本化物体移动系统（验证与收尾）

**状态**: 实现已完成（上一轮会话），本轮目标为验证 + 收尾
**日期**: 2026-07-09

---

## 一、当前状态分析（Phase 1 探索结果）

经过代码库探索，**所有实现部分均已落地**，无需重新开发。以下是验证清单：

### Part A — 文档输出 ✅ 已完成
- [NARRATIVE_DESIGN.md](../../NARRATIVE_DESIGN.md) — 世界观、MEM-07 设定、四关剧情表、文案风格规范、AI 诊断语气规范
- [NPC_REPRESENTATION_AUDIT.md](../../NPC_REPRESENTATION_AUDIT.md) — 7 项 NPC 表现审计

### Part B — 叙事文案与类型扩展 ✅ 已完成
- [src/types/task.ts](../../src/types/task.ts#L56-L100)
  - `ScriptedEventSpec.toastType?: 'cat' | 'phone' | 'warning' | 'event' | 'info'`（L57）
  - `TaskConfig.completionText?` / `failureText?` / `systemPrompt?`（L95-L100）
- 四个关卡文件均含 briefing（主人便签风）、completionText、failureText、systemPrompt：
  - [leave-home.ts](../../src/data/tasks/leave-home.ts#L18-L27)
  - [clean-table.ts](../../src/data/tasks/clean-table.ts#L18-L27)（含室友事件 toast）
  - [laundry-sort.ts](../../src/data/tasks/laundry-sort.ts#L25-L27)（含 2 个猫事件 + eventEffect: 'cat-prints'）
  - [breakfast.ts](../../src/data/tasks/breakfast.ts#L26-L28)
- toast 类型自动判断 + toastType 覆盖逻辑已在 useGameStore.ts 实现
- [ResultPage.tsx](../../src/pages/ResultPage.tsx#L36-L40) — MEM-07 诊断语气（"MEM-07 诊断报告。"开头）

### Part C — 猫影子效果 ✅ 已完成
- [CatShadowEffect.tsx](../../src/components/arena3d/feedback/CatShadowEffect.tsx) — 扁平黑色椭圆 + 4 段拖尾，0.8s lerp 动画
- [Scene3D.tsx](../../src/components/arena3d/Scene3D.tsx#L170-L212) — 集成 CatShadowEffect + CatPrintsEffect 双反馈，动态读取 lastMoveAnimation 位置
- 保留 CatPrintsEffect，无 lastMoveAnimation 时回退到客厅硬编码位置（向后兼容）

### Part D — 主人便签 UI + 叙事弹窗 ✅ 已完成
- [ArenaPage.tsx](../../src/pages/ArenaPage.tsx#L240-L330)
  - Briefing 改为黄色便签纸风格（bg-yellow-100/95, -rotate-1）
  - 上方新增 MEM-07 systemPrompt（青色终端风格）
  - 关卡完成/失败叙事弹窗（绿/红渐变，pointer-events-none）

### Part E — 脚本化物体移动动画系统 ✅ 已完成
- [useGameStore.ts](../../src/store/useGameStore.ts#L52-L61) — `MoveAnimation` 接口
- `startMoveAnimation`（L725-L749）: 设置 `_moving: true`，duration = 600-1000ms，存入 moveAnimations + lastMoveAnimation
- `updateMoveAnimations`（L751-L786）: 每帧 lerp 插值更新位置，完成后设置最终位置 + 房间 + `_moving: false`
- `applyScriptedMove`（L722）: 调用 startMoveAnimation 替代瞬移
- `tickElapsed`（L691）: 开头调用 updateMoveAnimations
- [Object3D.tsx](../../src/components/arena3d/Object3D.tsx#L105-L106) — `isMoving` 检查，动画中不可拾取
- 第一关猫事件：钥匙从茶几 (−1.2, 0.42, −1.0) 平滑移动到地毯边 (0.5, 0.02, −1.5)

### 音效集成 ✅ 已确认
- [sfx.ts](../../src/audio/sfx.ts) — 含 `cat_event` 和 `phone_ring` 音效类型

---

## 二、NPC 审计结果（用户要求输出）

| 问题 | 答案 |
|------|------|
| 1. 是否有 robot 模型 | ❌ 无。MEM-07 通过 HUD、系统字幕、记忆槽、扫描框表现 |
| 2. 是否有 cat 模型 | ❌ 无完整模型。通过 CatPrintsEffect（脚印）+ CatShadowEffect（影子）轻量表现 |
| 3. 是否有 owner/roommate 模型 | ❌ 无。主人通过便签 UI + 任务说明出现；室友通过事件 toast + 物品移动出现 |
| 4. 当前猫事件如何表现 | CatPrintsEffect（地面脚印）+ CatShadowEffect（移动影子）+ cat_event 音效 + cat 类型 toast |
| 5. 主人/室友是否只通过文本 | ✅ 是。主人便签式 briefing；室友 toast 文案 + move-entity 物品移动 |
| 6. 是否需要新增模型 | 本轮不需要。轻量表现已满足叙事需求 |
| 7. 如新增优先哪些 | 未来可优先：低模猫 fallback（带简单 idle 动画） |

**设计方向符合用户要求**：无人形 NPC 模型，猫用影子+脚印，主人用便签，室友用 toast。

---

## 三、四关文案表（用户要求输出）

### 关卡 1：出门大作战（恢复空间记忆）
| 类型 | 文案 |
|------|------|
| systemPrompt | MEM-07 启动中... 记忆模块：3/128 槽位可用。空间感知优先加载。 |
| briefing（便签） | 📝 早上好 MEM-07！我快迟到了！！钥匙在客厅茶几上，手机在卧室，雨伞在厨房。帮我把它们放到玄关托盘上，我五分钟后出门。—— 主人 P.S. 别理那只猫。 |
| 猫事件 toast | 🐱 啪嗒。有什么东西被推到了地毯边上。 |
| 手机事件 toast | 📳 嗡嗡声从卧室方向传来。信号源：手机。 |
| completionText | 三件物品归位。主人已出门。本机空间记忆校准完成，准确率提升 12%。 |
| failureText | 主人迟到了。本机记录到 3 次记忆遗漏，建议增加记忆槽数量。或者少养猫。 |

### 关卡 2：餐桌混乱（恢复物体状态记忆）
| 类型 | 文案 |
|------|------|
| systemPrompt | MEM-07 继续运行... 物体状态辨识模块加载中。相似物体区分度：低。 |
| briefing | 📝 MEM-07，餐桌灾难现场需要清理。脏杯子、干净杯子、盘子混在一起，75 秒内分好。—— 主人 P.S. 室友今天在家，东西可能会"自己跑回来"。 |
| 室友事件 toast | 📦 室友经过餐桌，留下了一个脏盘子。/ 📦 室友又经过餐桌，留下了一个脏杯子。 |
| completionText | 餐桌清理完毕。脏净分类准确率：可接受。物体状态辨识模块上线。 |
| failureText | 清理超时。餐桌混乱指数已超出本机处理阈值。建议：增加清洁频率，或减少室友数量。 |

### 关卡 3：洗衣幽灵（恢复时间和计数记忆）
| 类型 | 文案 |
|------|------|
| systemPrompt | MEM-07 运行中... 时序与计数模块尝试恢复。检测到异常移动物体。 |
| 猫事件 toast | 🐱 幽灵猫咪！它把白袜子扒拉到了毛巾篮附近。/ 🐱 又是那道影子。毛巾的位置变了。 |
| completionText | 衣物分类完成。时序与计数模块恢复。本机现在能记住数字了，这是一大进步。 |
| failureText | 分类失败。本机丢失了若干衣物的位置记录。幽灵假设：成立。概率：3%。 |

### 关卡 4：早餐时间循环（恢复流程记忆）
| 类型 | 文案 |
|------|------|
| systemPrompt | MEM-07 最终测试... 完整流程记忆链路重建中。所有模块协同模式：ON。 |
| completionText | 早餐流程完成。所有物品归位，容器已关闭。完整流程记忆链路重建。本机...好像想起了什么。 |
| failureText | 流程中断。时间循环未完成。本机记录到多处流程偏差。建议：从头再来，这次记住顺序。 |

---

## 四、剩余工作：验证

实现已全部完成，**唯一剩余任务是验证构建和 QA 通过**。

### 验证步骤
1. **`npm run build`** — 必须通过（TypeScript 编译 + Vite 构建）
2. **`npm run qa`** — 必须通过（不新增 Blocker/Critical/Major 问题）
3. 检查 QA_REPORT.md 是否更新

### 已知潜在风险点（验证时关注）
- `noUnusedLocals: true` — 上一轮已修复 CatShadowEffect 的 `trailPositions` 和 ArenaPage 的 `Brain` 导入，但需确认无其他未使用变量
- MoveAnimation 的 `_moving` 属性写入 `properties` 字段，需确认 QA 脚本不会将其误判为异常
- toastType 的 `as const` 断言需确认 TypeScript 接受

### 如果验证失败
- 根据报错信息定位并修复
- 修复后重新运行 build + qa
- 不引入新依赖，不扩大改动范围

---

## 五、假设与决策

1. **实现已完成** — 基于 Phase 1 探索确认所有文件、类型、逻辑均已落地，无需重新开发
2. **不新增功能** — 严格按用户原始需求，不添加 NPC AI、物理引擎、新依赖
3. **验证优先** — 本轮唯一目标是确认 build + qa 通过
4. **向后兼容** — CatPrintsEffect 保留硬编码位置回退，toastType 保留自动判断回退

---

## 六、验证完成后的交付物

- NARRATIVE_DESIGN.md（剧情设计文档）
- NPC_REPRESENTATION_AUDIT.md（NPC 审计文档）
- 4 个关卡文件含完整叙事文案
- CatShadowEffect + CatPrintsEffect 双反馈系统
- MoveAnimation lerp 动画系统（0.6-1.0s）
- 主人便签 UI + 叙事弹窗
- MEM-07 诊断语气结算页
- npm run build ✅
- npm run qa ✅
