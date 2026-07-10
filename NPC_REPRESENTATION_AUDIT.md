# NPC Representation Audit

> **历史审计快照**：本文记录 2026-07-09 的角色资产状态。当前角色定位与双层世界观见 [NARRATIVE_DESIGN.md](NARRATIVE_DESIGN.md)。

**项目**: Echo House: Memory Butler (记忆宅邸：失忆管家)
**审计日期**: 2026-07-09

---

## 1. 当前是否有 robot 模型

**否。** 项目中没有 MEM-07 机器人的 3D 模型。

- `ModelRegistry.ts` 注册了 29 个模型，全部为道具/家具/装饰，无角色模型
- `FallbackModels.tsx` 导出 29 个程序化 fallback，无机器人 fallback
- `public/assets/models/` 下无 `characters/` 或 `creatures/` 目录
- 代码中 "robot" 仅指玩家第一人称视角（`robotPosition` / `robotRotation`），用于碰撞检测和视野判断，无可见 3D 表示

**表现方式**: HUD、系统字幕、记忆槽、扫描框、第一人称视角

---

## 2. 当前是否有 cat 模型

**否。** 项目中没有猫的 3D 模型。

- `ModelRegistry.ts` 无 cat 相关注册项
- `FallbackModels.tsx` 无猫几何体 fallback
- `public/assets/models/` 下无猫模型文件

**当前猫事件表现方式**:
- `CatPrintsEffect.tsx` — 地面猫爪印（3 个 circleGeometry 组成），4 秒淡出
- `sfx.ts` 中 `cat_event` 音效 — triangle 波合成，800Hz，0.4 秒
- `HUD.tsx` 中 EventToast `type: 'cat'` — 琥珀色背景 + Cat 图标
- 位置硬编码在 `Scene3D.tsx`（living 房间茶几到地毯）

---

## 3. 当前是否有 owner 或 roommate 模型

**否。** 项目中没有主人或室友的 3D 模型。

- `ModelRegistry.ts` 无人形角色注册项
- `FallbackModels.tsx` 无人形 fallback
- `public/assets/models/` 下无人形模型文件

**当前表现方式**:
- 主人 — 仅通过 `task.briefing` 文本和 `scriptedEvents` message 出现
- 室友 — 仅通过 `clean-table.ts` 中 `scriptedEvents` 的 message 文本出现（"室友把脏盘子放回桌上"）

---

## 4. 当前猫事件是如何表现的

| 层次 | 实现 | 文件位置 |
|------|------|----------|
| 3D 效果 | CatPrintsEffect（地面爪印 + 淡出） | `feedback/CatPrintsEffect.tsx` |
| 音效 | cat_event（triangle 波 800Hz） | `audio/sfx.ts:52-59` |
| Toast | EventToast type='cat'（琥珀色 + Cat 图标） | `HUD.tsx:453-475` |
| 触发逻辑 | triggerScriptedEvents → 硬编码判断 targetId.includes('key') | `useGameStore.ts:631` |
| 位置 | 硬编码 living 房间 | `Scene3D.tsx:169-182` |

**问题**: 只有第一关 leave-home 的猫推钥匙事件有完整视觉反馈，其他关卡的猫/室友 move-entity 事件只有文字 toast，无 3D 效果。

---

## 5. 当前主人/室友是否只通过文本事件表现

**是。**

- 主人：通过 `task.briefing` 字段（纯文本）和 ArenaPage 浮层显示
- 室友：通过 `clean-table.ts` 的 `scriptedEvents` message 字段（纯文本 toast）
- 两者都没有 3D 模型、动画、或独立 UI 组件

---

## 6. 是否需要新增模型

**不需要人形 NPC 模型。** 按设计方向：

- MEM-07 机器人 — 不做完整 3D 模型，用 HUD/系统字幕/第一人称视角表现
- 主人 — 通过便签 UI、手机通知、任务说明出现，不做 3D 模型
- 室友 — 通过事件 toast 和物品移动出现，不做 3D 模型
- 猫 — 核心捣乱角色，需要轻量视觉表现

---

## 7. 如果新增，优先新增哪些

### 优先级 1: CatShadowEffect（轻量 3D 影子）

- 一个扁平的黑色椭圆影子 + 拖尾，从 A 点快速移动到 B 点
- 触发猫事件时"一道黑影掠过"的视觉效果
- 不需要完整猫模型，只是影子动画
- 与 CatPrintsEffect（地面爪印）叠加使用

### 优先级 2: 主人便签 UI

- 黄色便签纸风格的关卡 briefing 浮层
- 替代当前的纯文本 briefing 弹窗
- 不需要 3D 模型

### 不新增

- 机器人 3D 模型 — 第一人称视角已足够
- 人形 NPC 模型 — 本轮不做
- 完整猫 3D 模型 + 动画 — 影子效果已足够
