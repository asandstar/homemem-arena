# Room Adjacency Graph

Document ID: ROOM_ADJACENCY_GRAPH
Date: 2026-08-03
Baseline: Candidate A (Compact Hub) — CANDIDATE FOR HUMAN APPROVAL
Status: UNTRACKED · PLANNING ONLY

---

## 0. Scope

- 房间邻接图（Adjacency Matrix + Graph + 连接一致性 QA）
- 每条连接的 world doorway 中心一致性
- 8 项自动 QA 定义（同 WALL_AND_DOORWAY spec §八 合并引用）

---

## §1 · Room Adjacency Matrix (Candidate A)

|              | Living | Bedroom | Entrance | Dining-Kitchen | Laundry |
|--------------|:------:|:-------:|:--------:|:--------------:|:-------:|
| **Living**   |  —     | ✅ 连    | ✅ 连      | ✅ 连           | ❌       |
| **Bedroom**  | ✅ 连   | —       | ❌        | ❌             | ❌       |
| **Entrance** | ✅ 连   | ❌      | —         | ❌             | ❌       |
| **Dining-Kitchen** | ✅ 连 | ❌  | ❌       | —              | ✅ 连    |
| **Laundry**  | ❌      | ❌      | ❌        | ✅ 连           | —       |

Total edges = 5 (Living↔B, Living↔E, Living↔DK, DK↔Ly, Front door non-traversable不算)

---

## §2 · Room Adjacency SVG Graph (Candidate A)

```svg
<svg viewBox="-200 -150 450 320" width="720" height="480"
     xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .room { fill: #fff7e6; stroke: #8b6f47; stroke-width: 3; rx: 12; ry: 12; }
      .room-l2 { fill: #ffe0ec; }
      .room-l1 { fill: #e7f5ff; }
      .room-l3 { fill: #ecebff; }
      .label { font-family: "PingFang SC", sans-serif; font-size: 16px;
               font-weight: 600; fill: #2d2a26; text-anchor: middle; }
      .sub { font-size: 12px; font-weight: 400; fill: #6b6157; }
      .edge { stroke: #8b6f47; stroke-width: 6; stroke-linecap: round; }
      .edge-dk { stroke-dasharray: 8 6; }
      .task-badge { font-size: 11px; fill: white; font-weight: 700; }
    </style>
  </defs>

  <!-- Edges first (under rooms) -->
  <line class="edge" x1="20"  y1="0"   x2="100" y2="0"   />           <!-- Living ←→ Bedroom -->
  <line class="edge" x1="180" y1="0"   x2="260" y2="40"  />           <!-- Living ←→ Entrance -->
  <line class="edge edge-dk" x1="100" y1="40" x2="100" y2="110" />     <!-- Living ←→ DK (南) -->
  <line class="edge edge-dk" x1="180" y1="130" x2="240" y2="130"/>    <!-- DK ←→ Laundry -->

  <!-- Bedroom (L2 only) -->
  <rect class="room room-l2" x="-80" y="-40" width="100" height="80" />
  <text class="label" x="-30" y="-5">Bedroom</text>
  <text class="sub"   x="-30" y="15">5.0 × 6.0 m</text>
  <text class="sub"   x="-30" y="32">（L2 only · 手机）</text>

  <!-- Living · Hub (L1 sight / L2 core / L3 optional) -->
  <rect class="room room-l2" x="100" y="-55" width="80" height="110" />
  <text class="label" x="140" y="-15">Living</text>
  <text class="sub"   x="140" y="5">7.0 × 6.0 m</text>
  <text class="sub"   x="140" y="22">枢纽 · 猫事件</text>
  <text class="sub"   x="140" y="42">x:0, z:+3</text>

  <!-- Entrance (L2) -->
  <rect class="room room-l2" x="260" y="10" width="90" height="70" />
  <text class="label" x="305" y="40">Entrance</text>
  <text class="sub"   x="305" y="58">3.0 × 5.0 m</text>
  <text class="sub"   x="305" y="74">（伞架+托盘）</text>

  <!-- Dining-Kitchen (L1 core + L3 pass) -->
  <rect class="room room-l1" x="40" y="110" width="120" height="80" />
  <text class="label" x="100" y="145">Dining-Kitchen</text>
  <text class="sub"   x="100" y="165">6.0 × 6.0 m</text>
  <text class="sub"   x="100" y="182">（L1 餐桌+三容器）</text>

  <!-- Laundry (L3 only) -->
  <rect class="room room-l3" x="240" y="100" width="110" height="80" />
  <text class="label" x="295" y="135">Laundry</text>
  <text class="sub"   x="295" y="155">5.0 × 5.0 m</text>
  <text class="sub"   x="295" y="172">（L3 三篮+九衣）</text>

  <!-- Per-room task badges -->
  <g transform="translate(-30, -40)">
    <circle cx="0" cy="0" r="10" fill="#e11d48"/><text class="task-badge" x="0" y="4">L2</text>
  </g>
  <g transform="translate(175, -55)">
    <circle cx="0" cy="0" r="10" fill="#f59e0b"/><text class="task-badge" x="0" y="4">★</text>
  </g>
  <g transform="translate(260, 10)">
    <circle cx="0" cy="0" r="10" fill="#e11d48"/><text class="task-badge" x="0" y="4">L2</text>
  </g>
  <g transform="translate(40, 110)">
    <circle cx="0" cy="0" r="10" fill="#2563eb"/><text class="task-badge" x="0" y="4">L1</text>
  </g>
  <g transform="translate(240, 100)">
    <circle cx="0" cy="0" r="10" fill="#7c3aed"/><text class="task-badge" x="0" y="4">L3</text>
  </g>
</svg>
```

*此 SVG 可直接贴入文档。Minimap 实现时由 RoomBlueprint + Minimap spec 程序化生成等价渲染，不手写此 SVG。*

---

## §3 · Shared Doorway Reference Map (Candidate A)

**原则：每条连接 = 一个 DoorwayBlueprint 单例，被两房同时引用。**

```yaml
doorways:
  dw-living-bedroom:
    roomA: living         wallA: west    offsetA: 3.0m (wall西中点)
    roomB: bedroom        wallB: east    offsetB: 3.0m (wall东中点)
    width: 1.4m  height: 2.2m
    hingeSide: right (从 living 看入 bedroom 门右手边 = 房间北侧装铰链)
    openingDirection: both (L2 玩家频繁往返，允许两边开)

  dw-living-entrance:
    roomA: living         wallA: east    offsetA: 3.0m
    roomB: entrance       wallB: west    offsetB: 2.5m (Entrance z 方向宽 5m → 中点)
    width: 1.4m  height: 2.2m
    hingeSide: left (living 看入 entrance 左手 = 北侧装铰链，避免挡 umbrella stand)

  dw-living-diningkitchen:
    roomA: living         wallA: south   offsetA: 3.5m
    roomB: dining-kitchen wallB: north   offsetB: 3.0m
    width: 1.4m  height: 2.2m
    hingeSide: left (防止挡 Dining 桌操作)

  dw-diningkitchen-laundry:
    roomA: dining-kitchen wallA: east    offsetA: 3.0m
    roomB: laundry        wallB: west    offsetB: 2.5m
    width: 1.4m  height: 2.2m
    hingeSide: right
```

---

## §4 · §八 Room Connection Consistency QA (8 Items)

每条连接必须满足 8 条件。以下为自动 QA 脚本未来实现的 8 项断言头（headless vitest）：

```typescript
// 8 automated QA for every doorway + room pair:
type QAFindingSeverity = 'BLOCKER' | 'WARN' | 'INFO'

interface AdjacencyQA {
  // Q1: 不对称邻接 — A 说它连 B，但 B 没反过来连 A
  asymmetricAdjacency: (a: RoomId, b: RoomId, blueprints: Record<RoomId, RoomBlueprint>) => QAFindingSeverity

  // Q2: 双方的 DoorwayBlueprint 不是同一个对象引用 (===)
  unmatchedDoorwayBlueprintRef: (dw: DoorwayBlueprint, a: RoomBlueprint, b: RoomBlueprint) => QAFindingSeverity

  // Q3: 同一 id 的 DoorwayBlueprint 出现 2+ 次（重复对象）
  duplicateDoorway: (all: DoorwayBlueprint[]) => QAFindingSeverity

  // Q4: world doorway center 不匹配（反算后差值 > 2cm）
  misalignedWorldDoorwayCenter: (dw: DoorwayBlueprint, worldA: Vec3, worldB: Vec3) => QAFindingSeverity

  // Q5: 双方 width / height 不一致 (> 1cm)
  mismatchedDoorwayWidthOrHeight: (dwA: DoorwayBlueprint, dwB: DoorwayBlueprint) => QAFindingSeverity

  // Q6: 逻辑墙碰撞体覆盖了门洞通行区域 (即玩家站在门洞被墙碰撞卡住)
  wallCollisionCoveringDoorway: (room: RoomBlueprint, dw: DoorwayBlueprint) => QAFindingSeverity

  // Q7: 视觉墙 mesh 覆盖了门洞（应三段式绕开）
  visualWallCoveringDoorway: (room: RoomBlueprint, dw: DoorwayBlueprint) => QAFindingSeverity

  // Q8: minimap 缺口缺失 / 两侧 minimap 缺口不重合
  minimapGapMissingOrMisaligned: (a: RoomBlueprint, b: RoomBlueprint, dw: DoorwayBlueprint) => QAFindingSeverity

  // R9 (extra): unreachable room — BFS 从 L2 spawn 走不到某房
  unreachableRoomByBFS: (start: RoomId, blueprints: Record<RoomId, RoomBlueprint>) => QAFindingSeverity
}
```

### §4.1 Candidate A Pre-flight (8 项初步评估)

| QA | dw-living-bedroom | dw-living-entrance | dw-living-DK | dw-DK-laundry |
|---|---|---|---|---|
| Q1 asymmetric | ✅ PASS | ✅ PASS | ✅ PASS | ✅ PASS |
| Q2 ref-equal | 待 P2.0-R 实施后查 | 同上 | 同上 | 同上 |
| Q3 dup | 无 dup | 无 dup | 无 dup | 无 dup |
| Q4 world center | 需要精确坐标后查 | — | — | — |
| Q5 width | 统一 1.4m | 1.4m | 1.4m | 1.4m |
| Q6 collides | 门在墙正中，offset ± 0.7m 内无家具预留 | 同 | 同 | 同 |
| Q7 visual | 三段式墙预留 2×left/right+top 无覆盖 | 同 | 同 | 同 |
| Q8 minimap | 四向在房间墙中线上，缺口易对齐 | 同 | 同 | 同 |
| R9 reachable (L2) | ✅ Living→B/E/DK/Ly 全连 | — | — | — |

**Candidate A 在 8+1 项上结构上全部可过。**

---

## §5 · Per-Task Roaming Restriction

为保证三关独立，关卡 taskConfig 限制可达房间（不修改全局 sharedRooms；仅 collision + minimap 限制）：

| Task | 激活房 (taskRooms) | 说明 |
|---|---|---|
| L1 clean-table | `[dining-kitchen]` | 仅 Dining-Kitchen；minimap 其余 4 房灰且不可穿 |
| L2 leave-home | `[living, bedroom, entrance]` (可看见 dining-kitchen minimap 但灰) | 核心动线；dining-kitchen 若被撞就 minimap 不激活；Laundry 完全不连 |
| L3 laundry-sort | `[dining-kitchen, laundry]` | 最小；L1 Dining 容器也不显示颜色交互 |
| breakfast (隐藏) | `[dining-kitchen, living, entrance]` | 保持现有 |
| night-patrol (隐藏) | `[living, bedroom, dining-kitchen]` | 保持现有 |

*注：dining-kitchen 被 L1/L3 同时用但时间错开，不冲突；L1 的餐桌 zone 与 L3 通过走廊（dining-kitchen 东 1/3 条带）空间上不重叠（见 ENVELOPE 文档）。*

---

End of Adjacency Graph.
