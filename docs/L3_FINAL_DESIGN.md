# L3 FINAL DESIGN — UPDATE (Stale Object-Location Memory)

> **研究梯度**：L3 = UPDATE — 一个原本正确的位置记忆，在环境变化后失效，
> 玩家必须发现冲突、重新观察并更新记忆。

---

## PART 1: SCENE DESIGN

### 1.1 研究问题

> 一个之前正确的 object-location memory，在物体被移动以后过期；
> 玩家能否发现旧记忆与现实冲突，重新观察并完成 memory update？

### 1.2 房间基础

**Dining/Kitchen 房间**（id: `dining`）：
- 房间尺寸：5.5m (X) × 5.2m (Z)
- 房间中心（世界）：(0, 0, -5.35)
- 门洞：
  - 南墙 z=+2.6 → living（宽 1.4m）
  - 东墙 x=+2.75 z=-0.25 → laundry（宽 1.4m）

### 1.3 区域划分

```
┌──────────────────────────────────────────────────────┐
│                        z=-2.6                        │
│          【STORAGE / ENCODE ZONE - 北墙】             │
│                                                      │
│  FRIDGE    LOWER_CAB     SINK    UPPER_CAB   STOVE  │
│  (-2.3)    (-0.6)        (0.0)   (+0.6)      (+1.2) │
│  z=-2.1    z=-2.1        z=-2.1  z=-2.1      z=-2.1 │
│                                                      │
│         ┌─── UPPER 新位置 (z=-2.1, y=1.5) ───┐       │
│         │  cereal 移动后在这里                │       │
│         └────────────────────────────────────┘       │
│                                                      │
│                   ← 0.9m 通道 →                      │
│                                                      │
│  ┌──────────────────────────────────────────┐        │
│  │           SERVE ZONE - 餐桌               │        │
│  │           (0, 0, 0)  1.8×0.9             │        │
│  │  bowl/cup/spoon/milk/cereal 上桌处        │        │
│  └──────────────────────────────────────────┘        │
│                                                      │
│         ← 0.9m 通道 →                                │
│                                                      │
│  ┌──────────┐              ┌──────────┐             │
│  │  椅子     │              │  椅子     │             │
│  │(-1.3,0.3)│              │(1.3, 0.3)│             │
│  └──────────┘              └──────────┘             │
│                                                      │
│           椅子(0, 1.1)                               │
│                        z=+2.6                        │
│                   【南门 → living】                   │
└──────────────────────────────────────────────────────┘
         x=-2.75              x=0              x=+2.75
```

### 1.4 ASCII Top-Down（精确坐标）

```
     x=-2.75  x=-2.3  x=-0.6  x=0   x=+0.6  x=+1.2  x=+2.75
     │        │        │       │      │       │        │
z=-2.6├──北墙──────────────────────────────────东墙──┤
     │        │        │       │      │       │        │
z=-2.1│  [FRD] │ [LCAB] │[SINK]│[UCAB]│[STOVE]│        │
     │ 冰箱    │下橱    │ 水槽 │上橱   │ 灶台  │        │
     │ (-2.3) │ (-0.6) │ (0)  │(+0.6)│ (+1.2)│        │
     │        │        │      │      │       │        │
     │        │  ← cereal 初始在下橱 →  ← 移动后到上橱→│
     │        │        │      │      │       │        │
z=-1.5│        │        │      │      │       │        │
     │        │   ← 0.6m 操作区（北墙前沿到桌沿）→     │
z=-0.5│        │        ┌──────┴──────┴───────┐        │
     │        │        │    餐桌 TABLE         │        │
z= 0.0│        │        │   (0, 0, 0) 1.8×0.9 │        │
     │        │        │  ← cereal/milk/bowl  │        │
     │        │        │     /cup/spoon 上桌→ │        │
z=+0.5│        │        └──────┬──────┬───────┘        │
     │  [CHR] │         [CHR]  │     [CHR]              │
z=+1.1│(-1.3) │         (0)    │     (0,+1.1)          │
     │        │        └───────┘                       │
z=+2.0│        │              [PLANT]                  │
     │        │              (+2.4)                    │
z=+2.6├──南门(1.4m)──────────────────────东门(1.4m)──┤
     │   → living                              →laundry│
```

### 1.5 核心家具 Position / Rotation

| 家具 | 容器 ID | 位置 (局部) | 尺寸 (X×Y×Z) | surfaceHeight | modelAssetId | 状态 |
|------|---------|-------------|-------------|----------------|--------------|------|
| 冰箱 | `cnt-fridge` | (-2.0, 0.9, -1.8) | 0.7×1.8×0.7 | 1.8 | `furniture/kitchenFridge` | 现有 |
| 下层橱柜 | `cnt-cabinet-lower` | (1.9, 0.6, 0) | 0.8×0.6×0.4 | 1.2 | `furniture/kitchenCabinetDrawer` | 现有 |
| **上层橱柜** | `cnt-cabinet-upper` | **(1.9, 1.5, 0)** | 0.8×0.5×0.4 | **2.05** | **`furniture/kitchenCabinetUpper`** | **需注册** |
| 水槽 | `cnt-sink` | (1.85, 0.45, -1.9) | 0.5×0.7×0.5 | 0.72 | `furniture/kitchenSink` | 现有 |
| 餐桌 | `cnt-dining-table` | (0, 0.45, 0) | 1.8×0.9×0.9 | 0.9 | `furniture/table` | 现有 |

**注意**：当前 breakfast.ts 中 lower/upper cabinet 的位置 `(1.9, *, 0)` 在东墙区域，
与北墙的 `decor-kit-cabinet-2 (0.6, *, -2.1)` 是**不同家具**。

**建议**：L3 应将 lower cabinet 复用北墙的 `decor-kit-cabinet-1 (-0.6, -2.1)` 或 `decor-kit-cabinet-2 (0.6, -2.1)`，
upper cabinet 放在同一位置的高处（y=1.5），形成"同一列上下层"的视觉关系。
这样玩家看到 lower cabinet 空了，抬头就能看到 upper cabinet。

### 1.6 建议位置修正（L3 专用 task-container）

如果 L3 作为独立任务（不是在当前 breakfast 基础上改），建议：

| 容器 | 建议位置（局部） | 说明 |
|------|------------------|------|
| `cnt-fridge` | (-2.0, 0.9, -1.8) | 保持，冰箱在西北角 |
| `cnt-cabinet-lower` | **(-0.6, 0.6, -1.9)** | 复用北墙 cabinet-1 位置，贴墙 |
| `cnt-cabinet-upper` | **(-0.6, 1.5, -1.9)** | 在 lower 正上方，y=1.5 |
| `cnt-sink` | (0, 0.45, -1.9) | 保持，水槽在北墙中间 |
| `cnt-dining-table` | (0, 0.45, 0) | 保持，餐桌在房间中心 |

### 1.7 Support Relationship

```
FRIDGE (1.8m 高)
  └─ obj-milk 放在冰箱内部（hiddenInContainer）
     → 冰箱门关闭时不可见，打开后可见

LOWER CABINET (0.6m 高, 台面 0.563m)
  └─ obj-cereal 初始放在内部（hiddenInContainer）
     → 橱柜门关闭时不可见，打开后可见
  └─ obj-cup, obj-bowl 也在此

UPPER CABINET (1.5m 高, 底板 1.5m)
  └─ obj-cereal 移动后放在内部（hiddenInContainer）
     → 橱柜门关闭时不可见，打开后可见
     → 比 lower 高 0.9m，视觉上明确分层

DINING TABLE (0.45m 高, 台面 0.9m)
  └─ obj-milk, obj-cereal, obj-bowl, obj-cup, obj-spoon
     → 放在桌面上，可见

SINK (0.45m 高, 台面 0.72m)
  └─ obj-cup, obj-bowl 归位至此
```

### 1.8 Door Clearance

| 门洞 | 位置 | 宽度 | 最近家具 | 间距 | 合规 |
|------|------|------|----------|------|------|
| dining→living | z=+2.6 | 1.4m | 椅子 (0, +1.1) | 1.5m | ✅ >0.6m |
| dining→laundry | x=+2.75, z=-0.25 | 1.4m | 灶台 (1.2, -2.1) | 1.55m | ✅ >0.6m |

### 1.9 Player Path

```
出生点 → (0, 0, +2.0) 东南角，朝西北

ENCODE PATH:
  出生 → 走向北墙 → 打开 lower cabinet → 看到 cereal
  → 形成 memory: cereal → lower cabinet

DISTRACTOR PATH:
  → 转身到餐桌 → 放 bowl/spoon 到桌上

ENVIRONMENT CHANGE (玩家不在场):
  cereal 从 lower cabinet → upper cabinet
  → 旧 memory: cereal → lower cabinet 变为 STALE

RETRIEVE PATH:
  → 系统要求取 cereal
  → 玩家凭记忆去 lower cabinet → 打开 → 空！
  → CONFLICT: "我记得在这里，但不在了"
  → 抬头/环顾 → 发现 upper cabinet
  → 打开 upper cabinet → 找到 cereal
  → UPDATE memory: cereal → upper cabinet
  → APPLY: 拿 cereal 到桌上
```

### 1.10 Sightlines

```
ENCODE SIGHTLINE:
  玩家站在 (-0.6, 0, -1.3) 面朝北 (yaw=0)
  → 视野覆盖 lower cabinet (-0.6, -2.1)
  → 距离 0.8m，清晰看到 cereal 在橱柜内

OLD-MEMORY CONFLICT SIGHTLINE:
  玩家回到 (-0.6, 0, -1.3) 面朝北
  → 打开 lower cabinet → 内部空
  → 视觉反馈：橱柜内部无物体
  → "空"的视觉信号明确

NEW-LOCATION SIGHTLINE:
  玩家抬头 ~30° → 看到 upper cabinet (-0.6, 1.5, -2.1)
  → 距离 1.2m（水平 0.8m + 垂直 0.9m）
  → upper cabinet 与 lower 在同一 XZ 位置，只差 Y
  → 不需要大范围视觉搜索，抬头即见
```

---

## PART 2: TASK DESIGN

### 2.1 任务流程

```
┌─────────────────────────────────────────────────────────┐
│  ENCODE                                                  │
│  玩家进入餐厨，打开 lower cabinet，看到 cereal。         │
│  系统（MEM-07）自动记录 memory:                          │
│    cereal → lower cabinet                                │
│  玩家可按 E 主动保存。                                    │
└───────────────────────┬─────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────┐
│  SAVE                                                    │
│  memory: { object: cereal, location: lower_cabinet }    │
│  状态: valid                                             │
└───────────────────────┬─────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────┐
│  DISTRACTOR                                              │
│  系统提示："先把碗和勺子放到餐桌上。"                     │
│  玩家从 lower cabinet 取出 bowl, cup, spoon → 放到餐桌。 │
│  短动作，~15-20 秒，让注意力离开 cereal 位置。           │
└───────────────────────┬─────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────┐
│  ENVIRONMENT CHANGE (玩家背对橱柜 / 在餐桌旁)            │
│  cereal 从 lower cabinet → upper cabinet                │
│  不告诉玩家新位置。                                      │
│  旧 memory: cereal → lower_cabinet 标记为 OUTDATED       │
│  (但玩家不知道)                                          │
└───────────────────────┬─────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────┐
│  STALE                                                   │
│  memory: { object: cereal, location: lower_cabinet,     │
│            status: OUTDATED }                            │
└───────────────────────┬─────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────┐
│  RETRIEVE                                                │
│  系统提示："现在取麦片，放到餐桌上完成早餐。"             │
│  玩家凭记忆前往 lower cabinet。                          │
└───────────────────────┬─────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────┐
│  CONFLICT  ★ AHA MOMENT ★                                │
│  玩家打开 lower cabinet → 空！                           │
│  "我明明记得麦片在这里——但这个记忆已经过期了。"          │
│  系统 toast: "⚠️ 这里的东西好像被移动过…"               │
│  (不告诉新位置)                                          │
└───────────────────────┬─────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────┐
│  RE-OBSERVE                                              │
│  玩家环顾厨房 → 发现 upper cabinet（同一位置上方）       │
│  → 打开 upper cabinet → 看到 cereal                     │
└───────────────────────┬─────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────┐
│  UPDATE                                                  │
│  玩家拾取 cereal → memory 更新:                          │
│    cereal → upper_cabinet                                │
│  系统 toast: "✓ 记忆已更新：麦片 → 上层橱柜"            │
└───────────────────────┬─────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────┐
│  APPLY                                                   │
│  玩家把 cereal 放到餐桌 → 早餐完成                        │
└─────────────────────────────────────────────────────────┘
```

### 2.2 物品清单

| 物品 ID | 名称 | 初始位置 | 初始容器 | modelAssetId | 状态 |
|---------|------|----------|----------|--------------|------|
| obj-cereal | 麦片 | lower cabinet | `cnt-cabinet-lower` | **`food/carton`** (需注册) | 核心对象 |
| obj-milk | 牛奶 | 冰箱 | `cnt-fridge` | **`food/carton`** (需注册) | 辅助 |
| obj-bowl | 碗 | lower cabinet | `cnt-cabinet-lower` | **`food/bowl`** (需注册) | distractor |
| obj-cup | 杯子 | lower cabinet | `cnt-cabinet-lower` | **`food/cup`** (需注册) | distractor |
| obj-spoon | 勺子 | 餐桌上 | 无（桌面） | `food/utensil-spoon` | 现有 |

### 2.3 资产注册需求

**需注册的 Food Kit GLB（当前 Registry 缺失）**：

| modelAssetId | url | 用途 |
|--------------|-----|------|
| `food/carton` | `/assets/models/kenney/food/carton.glb` | milk + cereal（同一模型两种用途，或用 `carton-small` 区分） |
| `food/bowl` | `/assets/models/kenney/food/bowl.glb` | bowl |
| `food/cup` | `/assets/models/kenney/food/cup.glb` | cup |
| `furniture/kitchenCabinetUpper` | `/assets/models/kenney/furniture/kitchenCabinetUpper.glb` | upper cabinet |

**已注册可直接使用**：

| modelAssetId | 用途 |
|--------------|------|
| `furniture/kitchenFridge` | 冰箱 |
| `furniture/kitchenCabinetDrawer` | lower cabinet |
| `furniture/kitchenSink` | 水槽 |
| `furniture/table` | 餐桌 |
| `food/utensil-spoon` | 勺子 |

### 2.4 ScriptedEvents 设计

| Event ID | 触发条件 | 类型 | 行为 |
|----------|----------|------|------|
| `se-encode-cereal` | step=1 | message | "📦 MEM-07: 麦片在下层橱柜。记住它的位置。" |
| `se-distractor-serve` | 玩家取走 bowl/cup/spoon | message | "🥣 先把碗和杯子放到餐桌上。" |
| `se-cereal-moved` | 玩家把 bowl 放到餐桌后 + step≥6 | **move-entity** | cereal 从 lower → upper；**markMemoryOutdated: obj-cereal** |
| `se-retrieve-cereal` | cereal 移动后 | message | "📦 现在取麦片，放到餐桌上完成早餐。" |
| `se-conflict-detected` | 玩家打开 lower cabinet 且 cereal 不在 | message | "⚠️ 麦片不在这里了…好像被移动过。" |
| `se-memory-updated` | 玩家从 upper cabinet 拾取 cereal | message | "✓ 记忆已更新：麦片 → 上层橱柜。" |

### 2.5 Goals 设计

```
g1: 打开 lower cabinet（看到 cereal）         — milestone, procedural
g2: 取出 bowl + cup + spoon 放到餐桌           — milestone, procedural (distractor)
g3: [ENVIRONMENT CHANGE] cereal moved to upper — 自动触发，无玩家操作
g4: 打开 upper cabinet 取出 cereal             — milestone, spatial UPDATE
g5: cereal 放到餐桌                            — terminal, 早餐完成
g6: bowl + cup 归位到 sink                     — terminal, 清理
```

### 2.6 关键设计约束

1. **cereal 是唯一的 stale-memory 对象**：只有 cereal 的位置会变化，其他物品不变。
2. **移动方向是垂直的**（lower → upper），不是跨房间。玩家在同一个位置就能发现冲突和新位置。
3. **不告诉新位置**：`se-conflict-detected` 只说"不在这里了"，不说"在上层"。
4. **新位置可发现性**：upper cabinet 在 lower cabinet 正上方，抬头即见，不需要大范围搜索。
5. **Aha Moment**：打开 lower cabinet 看到空的瞬间 → "我明明记得麦片在这里——但这个记忆已经过期了。"

### 2.7 METRIC

| 指标 | 含义 | 预期 |
|------|------|------|
| conflictDetectionTime | 从打开 lower(空) 到打开 upper 的时间 | 5–15s |
| staleMemoryUpdateSuccess | 是否成功从 upper 取出 cereal | true/false |
| returnToLowerCount | 验证后再次返回 lower 的次数 | 0（理想） |
| completionTime | 通关总时长 | 60–90s |

### 2.8 CONFOUNDS

| 混淆 | 缓解 |
|------|------|
| 视觉搜索（乱找） | upper 在 lower 正上方，不需要搜索 |
| 读 HUD | HUD 不显示 cereal 的具体位置 |
| 操作熟练度 | L1/L2 已训练开柜/拾取 |
| 导航 | 全部在 dining 一个房间内，无跨房间 |

---

## PART 3: 与 L2 的区分

| 维度 | L2 RECALL | L3 UPDATE |
|------|-----------|-----------|
| 环境 | 稳定不变 | 有 1 次环境变化 |
| 记忆失效 | 不会 | 核心机制 |
| Aha Moment | "我记得它在那个房间" | "我记得它在这里——但过期了" |
| 搜索范围 | 4 房间 | 1 房间内垂直 |
| 干扰 | 猫 distractor（不改世界） | 物体实际移动 |

---

## PART 4: 需要修改的文件

| 文件 | 修改内容 | 风险 |
|------|----------|------|
| [src/data/assets/modelRegistry.ts](file:///Users/azq/asandstar/homemem-arena-web-demo/src/data/assets/modelRegistry.ts) | 注册 `food/carton`, `food/bowl`, `food/cup`, `furniture/kitchenCabinetUpper` | 低：只新增条目 |
| [src/data/tasks/breakfast.ts](file:///Users/azq/asandstar/homemem-arena-web-demo/src/data/tasks/breakfast.ts) | 重写为 L3 UPDATE 任务（或新建 `src/data/tasks/breakfast-update.ts`） | 中：任务逻辑重构 |
| [src/data/tasks/index.ts](file:///Users/azq/asandstar/homemem-arena-web-demo/src/data/tasks/index.ts) | 将 L3 从 `task-laundry-sort` 改为 `task-breakfast`（如果 promote breakfast） | 低：改 PUBLIC_LEVEL_ORDER |
| [src/pages/ArenaPage.tsx](file:///Users/azq/asandstar/homemem-arena-web-demo/src/pages/ArenaPage.tsx) | 无需修改（任务驱动） | — |

---

## PART 5: 不增加第四种机制

L3 只有 3 个核心机制：
1. **Encode**（记忆形成）
2. **Stale**（记忆过期）
3. **Update**（记忆更新）

不再增加第四种新机制。

---

## 等待人审核

以上为设计草案，**未修改任何代码**，等待开发者审核确认。
