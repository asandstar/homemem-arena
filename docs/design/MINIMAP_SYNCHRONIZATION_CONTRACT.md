# Minimap Single-Source Synchronization Contract

Document ID: MINIMAP_SYNCHRONIZATION_CONTRACT
Date: 2026-08-03
Baseline: Candidate A (Compact Hub) — CANDIDATE FOR HUMAN APPROVAL
Status: UNTRACKED · PLANNING ONLY · NOT FOR PRODUCTION YET

---

## 0. Scope

小地图 **必须从 RoomBlueprint 派生**，不得手写 CSS 坐标或单独维护一份房间坐标表。

三层显示：
1. 固定结构层（房间轮廓/墙/门洞缺口/窗户标记/房间名）
2. 大型障碍层（大型家具 2D AABB 投影）
3. 动态层（玩家/当前目标/任务容器/记忆状态）

---

## §10.1 Minimap Render Source Graph (Single-Source DAG)

```
                    ┌─────────────────────┐
                    │   src/data/rooms.ts │
                    │   (RoomBlueprint)   │
                    └─────────┬───────────┘
                              │ owns
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
     RoomBlueprint[]   DoorwayBlueprint[]  WindowBlueprint[]
      (center,size)    (wall,offset,w,h)   (wall,offset,w,h)
              │               │               │
              └───────────────┴───────────────┘
                              │ derives
              ┌───────────────┴───────────────┐
              ▼                               ▼
   ┌─────────────────────┐        ┌─────────────────────┐
   │ Fixed structure     │        │ Large obstacle      │
   │ renderer (SVG/2D)   │        │ renderer (from      │
   │ (walls, gaps, names)│        │ decorFurniture +    │
   └─────────────────────┘        │ eligibility filter) │
                                   └─────────┬───────────┘
                                             │
              ┌──────────────────────────────┼─────────────────────────────┐
              ▼                              ▼                             ▼
   ┌──────────────────┐         ┌───────────────────────┐      ┌──────────────────────┐
   │ Dynamic: player  │         │ Dynamic: task         │      │ Dynamic: memory      │
   │ position/facing  │         │ containers + goal     │      │ states (L2/L3 only)   │
   │ (from store)     │         │ (from taskRuntime)    │      │ (from memoryStore)    │
   └──────────────────┘         └───────────────────────┘      └──────────────────────┘
```

**绝对禁止：** `Minimap.tsx` 里硬编码 `x=123 y=456` 的房间坐标。

---

## §10.2 Fixed Structure Layer (Authoritative)

从 RoomBlueprint 直接渲染：

| Element | Source | Render rule |
|---------|--------|-------------|
| Room interior fill | `bp.size × bp.center` | world→minimap 变换后，绘制 4-vertex 填充矩形；颜色 = `minimapStyle.fillColor` |
| Wall outline | `bp.size + wallThicknessVisual` | 沿矩形外框画 2–3 px stroke；颜色 = `outlineColor`；**墙本身不占额外面积**，轮廓即墙的视觉位置 |
| **Doorway gap** (关键) | `DoorwayBlueprint.{wall,offset,width}` | 在 wall stroke 上 **擦除一段** width 长度的线段（或画一段白色/背景色 stroke）；位置 = 沿墙从 `offset - width/2` 到 `offset + width/2` |
| Window notch (可选) | `WindowBlueprint.{wall, offset, width}` | 与 doorway gap 同样方法，只画 1-2 px 颜色标记；不打断墙体 |
| Room name label | `bp.displayName` or `minimapStyle.labelOverride` | 在 room rect 中心或 `labelAnchor` 指定位置写字；字号随 canvas 缩放 |

**Doorway gap 双向一致性：** 因为 Living 和 Bedroom 共用 **同一个 DoorwayBlueprint 引用**，两房在墙上的 gap 中心点必然完全相同 → minimap 上缺口对齐。

---

## §10.3 Large Obstacle Layer (Eligibility Filter)

家具必须通过 **minimap eligibility** 判定才显示。不显示全部装饰（避免小地图变彩图）。

```typescript
interface MinimapEligibilityResult { show: boolean; reason: string }

function isMinimapEligible(
  furniture: DecorFurniture | TaskContainer,
  runtime?: TaskRuntimeState
): MinimapEligibilityResult {
  // 条件 1：物理 footprint ≥ 阈值
  const rotatedFootprint = getRotatedFootprint(furniture.size, furniture.rotationY)
  const area = rotatedFootprint.x * rotatedFootprint.z
  if (area >= 1.2) return { show: true, reason: 'large-footprint' } // sofa / bed / dining-table ≥ 1.2 ㎡

  // 条件 2：navigationObstacle = true（下阶段 schema 增加字段；当前 PROVISIONAL 写死列表）
  const NAV_OBSTACLE_TYPES = ['wardrobe', 'kitchen-counter', 'bookshelf-tall', 'shoe-cabinet']
  if (NAV_OBSTACLE_TYPES.includes(furniture.type)) return { show: true, reason: 'nav-obstacle' }

  // 条件 3：taskContainer = true（本关 L2/L3 的容器）
  if (furniture.kind === 'TaskContainer') return { show: true, reason: 'task-container' }

  // 条件 4：currentObjective = true（当前任务目标高亮）
  if (runtime && runtime.currentObjective?.entityId === furniture.id) return { show: true, reason: 'objective' }

  return { show: false, reason: 'too-small / not-relevant' }
}
```

**默认显示（ALL tasks）**：
- `Sofa`, `Bed (double)`, `Dining table + chairs group`, `Wardrobe`, `Kitchen counter/peninsula`, `Washer + Dryer`, `Large TV cabinet / bookshelf (≥0.8m wide)`
- 全部 `TaskContainer`（entrance tray / sink / three baskets）

**默认隐藏**：
- 每株植物、台灯、落地灯、杯叉袜子、抱枕、地毯、挂画、单个椅子等。

---

## §10.4 Dynamic Layer (Per-task rules)

### 10.4.1 Dynamic Element Roster

| Element | Source (store) | Render |
|---------|---------------|--------|
| Player position + facing | `robotState.position / heading` | 三角形或圆形 + 方向短射线；5–7 px |
| **Current goal room** (L2) | `taskRuntime.currentGoalRoomId` | Goal 房间边框 pulse 蓝色 highlight |
| **Task containers** (all) | `taskRuntime.containers[*]` | Rect outline + 颜色编码（L1 三容器三色，L2 托盘金色，L3 三篮三色） |
| **Fresh memory** location (L2) | `memoryStore.freshMemories[*].entityWorldPos` | 淡蓝 3 px 圆 |
| **Outdated memory** location (L2) | `memoryStore.outdatedMemories[*].entityWorldPos` | 红色虚线圆 + 中心 `?` |
| **Updated memory** (post-reconcile) | `memoryStore.updatedMemories[*]` | 金色短脉冲 300ms 一次后恢复正常容器颜色 |
| Disturbance evidence (L2 catEvent) | `taskRuntime.disturbanceMarkerPos` | 猫脚印 icon 1× 闪现（不常驻） |
| L3 three basket identities | `taskLaundrySort.basketLabels` | 三个篮子的颜色编码 + 文字 tag（白/深/彩） |

---

## §11 · Memory System Expression on Minimap (L1 / L2 / L3 分关)

### 11.1 L1 (clean-table — 教学关)

**原则：极简，避免认知过载。**

| Element | Show? |
|---------|-------|
| Small minimap or hidden by default | **默认极简/小尺寸（≤ 150px 方）**；玩家可手动放大 |
| Complex memory states | **不显示任何 memory dot**（L1 只有 1 个叉子+2 个杯子，记忆需求为零） |
| Task containers | 显示三容器 + 餐桌（颜色编码：水槽=蓝，盘子柜=橙，垃圾桶=灰） |
| Player facing | 显示 |

**L1 minimap 目标：** 只教玩家「小地图上有我、有目标房」；不引入记忆概念。

---

### 11.2 L2 (leave-home — 旗舰关)

**原则：暗示但不泄题。区分新鲜/过期/更新后的记忆，Aha moment 必须由玩家自己发现。**

| Element | Expression | Rule |
|---------|-----------|------|
| Fresh memory location (刚记住时) | 🟦 淡蓝色实心小圆 (3 px) | 出现在玩家「saveMemory」那一刻看到的 key memory entity 的 world pos |
| **Outdated memory** (猫事件之后) | 🔴 红色虚线圆 + 中心问号 `?` | **关键：不直接告诉你新位置在哪。**只提示「旧位置不可靠了」。玩家必须根据家中视觉线索找新钥匙位置。 |
| Updated memory (玩家重新发现并 saveMemory 后) | 🟡 金色脉冲 300ms，然后恢复为 **容器颜色**（不是金色常驻） | 奖励玩家的重新发现 |
| Cat disturbance marker | 🐾 猫脚印，在玩家第一次返回 Living 进入 cat-trigger zone 时闪现 2 秒，不常驻 | 不直接指示钥匙位置，只提示「猫来过这一带」 |
| **Leak prevention (严格禁止)** | 任何情况下 **不得把新钥匙位置在 L2 minimap 上直接标金/高亮** | 这破坏核心玩法：玩家得自己看 + 自己想 |
| Current goal room | Pulse blue highlight（去卧室 → 去拿手机 → 去玄关 → 放托盘） | 导航指引，不破坏记忆玩法 |

---

### 11.3 L3 (laundry-sort — 分类关)

**原则：颜色编码稳定，不被夜间风格破坏；显示三篮身份，不显示全部散落衣物。**

| Element | Expression |
|---------|-----------|
| Three basket identities | 三个矩形容器 + 颜色标签（White=米白框 / Dark=深蓝框 / Color=彩红框）+ 1-2字（白/深/彩） |
| Scattered 9 clothes locations | **默认不显示**。玩家走近某件衣物后，该件衣物在 minimap 上临时出现 3 px 圆点（颜色=其正确篮色）。 |
| Color vs night style conflict | **强制使用 solid color 边框 + 文字 tag**，不使用浅色 tint 在深色底上（因为 L3 夜间风格 minimap 可能是暗背景） |
| Fresh/Outdated memory | L3 不启用记忆系统（纯分类），无 memory dots |

---

## §10.5 Eligibility Examples (Furniture → 是否在 minimap 显示)

| Furniture | Rotated area (㎡) | Eligible? | Reason |
|-----------|-------------------|-----------|--------|
| Sofa (1.96×0.82) | 1.607 | ✅ | large-footprint (≥1.2㎡) |
| Coffee table (1.32×0.80) | 1.056 | ⚠️ 边缘（<1.2） | 可手动标 navigationObstacle=true，因为挡主通道 |
| Bed Double (1.91×2.25，OBJ×2.0) | 4.298 | ✅ | large-footprint |
| Dining Table (1.68×0.90，table×2.0) | 1.512 | ✅ | large-footprint |
| Wardrobe (PROVISIONAL 1.6×0.6) | 0.96 | ✅ via NAV_OBSTACLE | wardrobe 类型 |
| Kitchen counter (PROVISIONAL 2.4×0.6) | 1.44 | ✅ | large-footprint |
| Washer + Dryer (each 0.7×0.7) | each 0.49 → group as 1.4×0.7 = 0.98 | ✅ via TASK 区域 | 或标 navigationObstacle |
| TV cabinet (1.60×0.50) | 0.80 | ⚠️ 可 nav-obstacle | 靠 Living 南墙，不挡主通道，默认不强制显示 |
| Bookcase open (0.8×0.5) | 0.40 | ❌ 太小 | 但 Living 东墙的 tall bookcase 如果 ≥ 0.8m 宽 → 可显示 |
| Lamp / Plant / Mug / Single Chair (<0.3×0.3) | <0.09 | ❌ | 全部隐藏 |
| cnt-entrance-tray (TaskContainer) | N/A (area small) | ✅ | task-container 强制 |
| L1 cnt-sink / cnt-plate-cabinet / cnt-trash | N/A | ✅ | task-container 强制 |
| L3 three baskets | N/A | ✅ | task-container 强制 |

---

End of Minimap Contract.
