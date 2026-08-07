# L2 FINAL DESIGN — RECALL (Object-Spatial Recall)

> **研究梯度**：L2 = RECALL — 稳定环境中的 Object-Spatial Recall。
> 环境不得移动任务物体。

---

## 1. Research Question

> 在一个稳定的、不发生环境变化的多房间场景中，
> 玩家能否在短暂编码后，跨房间保持并提取
> "物体→位置"的绑定记忆，完成寻物归位？

**核心区分**：L2 不引入环境扰动。玩家如果记住了 briefing 给出的 4 个 binding，
就能直接导航→拾取→归位；如果不记，就必须逐房间视觉搜索，效率显著下降。

---

## 2. 研究模板

### ENCODE

- **何时**：Briefing 是唯一 Encode Phase。
- **内容**：4 个 object-location bindings（书→客厅沙发、杯→卧室床头柜、熊→餐厨台面、收音机→玄关鞋柜）。
- **呈现方式**：Briefing 文本中**只出现一次**。关闭 briefing 后不再显示具体位置。
- **HUD 约束**：playing 阶段 HUD 显示目标列表（"找到书/杯/熊/收音机→放回茶几"），但**不显示每件物品在哪个房间/哪件家具**。

### RETENTION

- **时长**：从关闭 briefing 到找到该物品，通常 30–90 秒。
- **干扰**：跨房间导航本身（4 个房间、门洞穿越）构成空间认知负载。
- **不变**：物品位置在整个 playing 期间**绝对不变**。环境稳定。

### RECALL

- **触发**：玩家进入某个房间、看到某件家具时，需要回忆"这里藏着什么"。
- **输出**：直接走到正确家具→拾取。或走错→搜索→修正。

### ACTION

- 拾取 4 件物品 → 放回客厅茶几。

### METRIC

| 指标 | 含义 | 预期（有记忆） | 预期（无记忆/搜索） |
|------|------|----------------|---------------------|
| completionTime | 通关总时长 | 40–60s | 70–90s |
| repeatedSearch | 进入错误房间次数 | 0–1 | 3–6 |
| firstAttemptAccuracy | 首次进入正确房间率 | >80% | ~25% |
| memorySaveCount | 按 E 保存记忆次数 | 4+ | 0–1 |

### CONFOUNDS

| 潜在混淆 | 说明 | 缓解 |
|----------|------|------|
| 导航能力 | 玩家可能只是路感好 | 4 房间布局简单，门洞宽 1.4m，导航不是瓶颈 |
| 视觉搜索 | 玩家靠扫视而非记忆找到 | 物品在家具上不显眼（书在沙发缝隙、杯在床头柜角落），需靠近才看到 |
| 读 HUD | HUD 持续显示位置 | **本设计删除 HUD 中的位置提示** |
| 操作熟练度 | WASD/E 操作不熟练 | L1 Tutorial 已训练基本操作 |

---

## 3. 物品与位置（保持不变）

| 物品 | 初始房间 | 初始位置（局部坐标） | 目标容器 |
|------|----------|----------------------|----------|
| 书 (obj-books) | living | (-1.5, 0.45, 0.8) 沙发座面 | 客厅茶几 |
| 马克杯 (obj-mug) | bedroom | (1.35, 0.605, -2.0) 床头柜 | 客厅茶几 |
| 玩具熊 (obj-bear) | dining | (0.6, 0.563, -1.9) 厨房台面 | 客厅茶几 |
| 收音机 (obj-radio) | entrance | (0.5, 0.615, -1.8) 鞋柜 | 客厅茶几 |

目标容器：`cnt-coffee-table`（客厅茶几，acceptAny: true）

---

## 4. 精确任务流程

```
1. Briefing（Encode Phase）
   → 展示 4 个 object-location binding，一次性
   → 玩家点击"开始任务"

2. Playing（Recall Phase）
   → HUD 显示："找到 书/马克杯/玩具熊/收音机 → 放回客厅茶几"
   → HUD 不显示物品在哪个房间
   → 玩家根据记忆前往对应房间 → 拾取 → 带回茶几放置

3. 钥匙猫 Distractor（不改世界状态）
   → step≈8 时，猫叫声 + 爪印特效 + toast："🔑 钥匙猫在旁边晃来晃去…"
   → 不移动物品，不 markMemoryOutdated

4. 完成 / 超时
   → 4 件全部放回茶几 → 通关
   → 90 秒超时 → 失败
```

---

## 5. ScriptedEvents 保留 / 删除 / 修改

| Event ID | 当前行为 | 决策 | 理由 |
|----------|----------|------|------|
| `se-welcome` | 开场提示 | **保留** | 只介绍任务目标，不泄露具体位置 |
| `se-search-hint` | step≥3 泄露全部 4 个位置 | **删除** | 直接泄题，破坏 spatial recall 测量 |
| `se-found-first` | 找到第 1 件鼓励 | **保留** | 正反馈，不泄露位置 |
| `se-cat-second-prank` | 移动 bear + markMemoryOutdated | **修改 → 降级为纯 distractor** | L2 环境不得移动物体；改为只播猫叫 + 爪印 toast，不改世界状态 |
| `se-time-warning` | 剩余 30 秒警告 | **保留** | 时间压力提示 |
| `se-found-three` | 找到 3 件鼓励 | **保留** | 正反馈 |

### `se-cat-second-prank` 修改详情

**当前实现**：
```typescript
type: 'move-entity',
targetId: 'obj-bear',
targetPosition: { room: 'bedroom', x: 0.5, y: 0.32, z: -2.0 },
markMemoryOutdated: 'obj-bear',
```

**修改为**：
```typescript
type: 'message',
message: '🐱 钥匙猫从你身后溜过，爪子拍了一下地板…什么也没发生。',
// 不移动任何物体
// 不 markMemoryOutdated
toastType: 'cat',
eventEffect: 'cat-prints',  // 保留视觉 distractor
```

### `se-search-hint` 替代方案

删除后，如果玩家长时间停滞（step≥15 且未手持物品），可触发一个**不泄露位置**的通用提示：

```typescript
{
  id: 'se-search-hint-v2',
  trigger: (step, _entities, _room, _rooms, ctx) =>
    step >= 15 && !ctx?.heldEntityConfigId && !ctx?.triggeredEvents.has('se-search-hint-v2'),
  type: 'message',
  message: '💡 MEM-07：「试试回忆 briefing 里提到的位置——每件物品都在不同的房间。」',
  toastType: 'info',
}
```

---

## 6. Briefing 修改建议

**当前问题**：Briefing 直接列出"书→客厅沙发，杯→卧室床头柜，熊→厨房台面，收音机→玄关"。

**修改方向**：保留 binding 信息（这是 Encode Phase 的核心），但确保只在 briefing 中出现一次，关闭后不再回看。

建议 briefing 文本保持当前位置列表（这是编码阶段的合法信息），但：
1. playing 阶段 HUD **不显示**位置信息
2. 删除 `se-search-hint`（第二次泄露）
3. briefing 关闭后无法重新打开

---

## 7. 需要修改的文件

| 文件 | 修改内容 | 风险 |
|------|----------|------|
| [src/data/tasks/leave-home.ts](file:///Users/azq/asandstar/homemem-arena-web-demo/src/data/tasks/leave-home.ts) | 删除 `se-search-hint`；修改 `se-cat-second-prank` 为纯 message + cat-prints；可选添加 `se-search-hint-v2` | 低：只改 scriptedEvents 数组 |
| [src/data/tasks/leave-home.ts](file:///Users/azq/asandstar/homemem-arena-web-demo/src/data/tasks/leave-home.ts) | systemPrompt 同步更新（删除"钥匙猫二次捣乱叼走玩具熊"描述） | 低 |
| [src/data/tasks/leave-home.ts](file:///Users/azq/asandstar/homemem-arena-web-demo/src/data/tasks/leave-home.ts) | probes 中 `p-bear-moved` 问题需要删除或改为"钥匙猫是否移动了物品"（答案：没有） | 低 |

**不需要修改**：
- rooms.ts / decorFurniture.ts（环境不变）
- modelRegistry.ts（不新增资产）
- ArenaPage.tsx / 任何引擎代码

---

## 8. Invariant

```
L2 playing 全程：
  4 件物品 initialPosition 不变
  0 次 move-entity 事件
  0 次 markMemoryOutdated
  HUD 不显示物品位置
  Briefing 不可重新打开
```

---

## 9. 设计总结

L2 是 **RECALL** 关：测试稳定环境中的 spatial recall。

- **Encode**：Briefing 一次性呈现 4 个 binding
- **Retention**：跨房间导航延迟 30–90s
- **Recall**：玩家凭记忆导航到正确房间/家具
- **干扰**：钥匙猫的视听 distractor（不改世界状态）
- **指标**：completionTime / repeatedSearch / firstAttemptAccuracy

与 L3 的区分：L2 环境**不变**，记忆**不会过期**；L3 环境**会变**，记忆**会过期**。
