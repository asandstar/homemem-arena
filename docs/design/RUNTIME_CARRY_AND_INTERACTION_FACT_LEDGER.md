# RUNTIME CARRY AND INTERACTION FACT LEDGER (源码审计结论, 不可推断)

Document ID: RUNTIME_CARRY_AND_INTERACTION_FACT_LEDGER
Date: 2026-08-03
Baseline Commit: c5a2f83
Audit Scope: entitySlice.ts, commands.ts, task types, all 3 task files, Minimap.tsx, Room3D.tsx
Status: UNTRACKED · PLANNING ONLY · 18 FACT ITEMS (FROM SOURCE CODE VERBATIM)

---

## 审计规则

每条事实使用以下三标签之一标记：
- **FACT** — 直接从源码可读，无需推断
- **INFERENCE** — 从多段代码组合可逻辑确定，无歧义
- **CONFLICT** — 不同文档 / 代码与文档之间有矛盾，需修正
- **NOT_FOUND** — 源码中不存在对应条目，需新建

---

## §1. CARRY_CAPACITY (手持容量) — 结论: CARRY_ONE

| # | 条目 | 标签 | 证据 (源文件 + line) | 值 |
|---|------|------|---------------------|----|
| 1 | carrying capacity (玩家同时手持数量上限) | FACT | entitySlice.ts line 32: `if (heldEntityId) return { success: false, reason: '手里已经拿着东西了' }` | **CARRY_ONE** · 严格单持，一次只能拿一件 |
| 2 | held object state shape (手持状态字段类型) | FACT | entitySlice.ts line 12: `heldEntityId: string \| null` — entity id (string, uuid-like), not configId | **单值字符串**: `string \| null`；heldEntityConfigId 是 StageContext 中的派生字段（taskSlice.ts line 93） |
| 3 | pick action 真实调用链 | FACT | FirstPersonControls → executePick (commands.ts L73-136) → before.pickEntity(entitySlice.ts L30) → set heldEntityId → advanceStep() → processPostCommand() | 完整链: DOM keydown(F/空格) → controls hook → commands.executePick → store.pickEntity（**禁止在 F 之前未保存记忆时 pick**，commands.ts L114-128 对 L1 教学阶段限制） |
| 4 | place action 真实调用链 | FACT | executePlace → before.placeEntity(L89) → category 接受判断(L111-141) → 正确放置 branch(L143+) → snapEntityToWorld → set heldEntityId=null | 返回 `{success, reason}`；放置错误扣分 + chaos + breakCombo |
| 5 | object swap behavior (拿着物体再尝试 pick 另一个会怎样) | FACT | entitySlice.ts L32 直接失败，不会"替换"或"自动放下" | 行为 = FAIL_WITH_REASON；玩家必须先将手里物体放置到任意接受容器（含 acceptAny 的台面）后才能拿起新物体 |
| 6 | 是否允许一次拿三件物体 (cup + tissue + fork) | FACT | CARRY_ONE 且无队列/背包字段 | **不允许**；L1 必须分三次往返（详见 REVISED_L1_L2_L3_ROUTE_CONTRACT） |
| 7 | E 保存记忆 与 手持状态 关联 | INFERENCE | commands.ts L194 executeSaveMemory → 读取 gameStore.entities 中 nearby 的 entity → 写 memorySlots；无任何代码检查 heldEntityId | **独立操作**：拿物体时也能按 E 保存记忆；不要求先放下再保存 |

---

## §2. L1 每件物体真实目标 (clean-table) — FACT from src/data/tasks/clean-table.ts

| # | 条目 | 标签 | 值 / 证据 |
|---|------|------|-----------|
| 8a | L1 cup 目标 | FACT | obj-dirty-cup (category='cup') → cnt-dishwasher (acceptedCategories=['cup'], isTargetZone=true) (L130-141) |
| 8b | L1 tissue 目标 | FACT | obj-tissue (category='tissue') → cnt-trash-bin (acceptedCategories=['tissue'], isTargetZone=true) (L143-154) |
| 8c | L1 fork 目标 | FACT | obj-fork (category='fork') → cnt-utensil-rack (acceptedCategories=['fork'], isTargetZone=true) (L156-167) |
| 8d | L1 active rooms | FACT | clean-table.ts L23: `rooms: ['dining']` — 严格单房 |

---

## §3. L2 CAT EVENT & KEY (leave-home.ts)

| # | 条目 | 标签 | 值 / 证据 |
|---|------|------|-----------|
| 9 | L2 cat trigger exact condition (猫事件精确触发条件) | FACT | leave-home.ts L292-303: **OR** (a) `keyFreshSaved && keyFree && leftLiving` (b) `keyFree && phoneObtained`；其中 keyFreshSaved = memorySlot 有 obj-key 且 !outdated；keyFree = key 在 living 且 status='free'；leftLiving = currentRoom !== 'living'；phoneObtained = phone held 或已放 tray |
| 10 | L2 relocated key CURRENT_CODE_BASELINE (代码中已硬编码的 canonical 新位置) | FACT | leave-home.ts L307: `targetPosition: { room: 'living', x: -3.2, y: 0, z: -3.2 }` — 客厅西北角，对应文案 "沙发侧" |
| 11 | L2 stale memory exact trigger | FACT | 事件 se-cat-pushes-key 字段 `markMemoryOutdated: 'obj-key'` (L311)；触发后立刻把 memorySlots 中 key 记忆标为 outdated（无论玩家是否已实际观察到 mismatch） |
| 11b | L2 rooms 范围 (任务声明) | FACT | leave-home.ts L55: `rooms: ['living', 'entrance', 'bedroom']` — 不含 kitchen/dining/laundry |

---

## §4. L3 (laundry-sort.ts)

| # | 条目 | 标签 | 值 / 证据 |
|---|------|------|-----------|
| 12 | L3 active rooms | FACT | laundry-sort.ts L38: `rooms: ['laundry']` — **严格单房 L3-A** |
| 13 | L3 spawn room | FACT | laundry-sort.ts L42: `spawnPosition: { x: 0, z: 2.0 }` (洗衣房局部坐标，入口附近南侧) |
| 14 | L3 completion room | FACT | 所有 containers + objects 全部 `initialRoom: 'laundry'` (L99-223)；完成条件也全在洗衣房内判定 |

---

## §5. MINIMAP (Minimap.tsx)

| # | 条目 | 标签 | 值 / 证据 |
|---|------|------|-----------|
| 15 | Minimap current source (输入数据来源) | FACT | Minimap.tsx L2: `import { sharedRooms } from '../../data/rooms'` — **直接读 rooms.ts**，无任何 registry / blueprint 中间层；props 只带 currentRoom, robotPosition(XYZ world), robotRotation, observedObjects, memorySlots, taskRooms |
| 16 | Minimap current hardcoded coordinates | FACT | Minimap.tsx L99-100: 从 currentRoomSpec.center, currentRoomSpec.size 取；room-local 到 minimap 的变换: L244-245 `x = roomSpec.center.x * scale + offsetX; y = -roomSpec.center.z * scale + offsetY` (注意 Z 翻转, world Z → minimap -Y)；**hardcoded 适配当前 rooms.ts 的 8m rooms**；不读 sharedWallsById / doorwaysById |
| 16b | Minimap 全房绘制 vs 单房绘制 | FACT | L238-282 isFullscreen=true 时画全部 taskRooms 或 sharedRooms；default (L269-382) 只画当前房间 + 门洞缺口 + 相邻房间标签 |

---

## §6. WALL OWNERSHIP (Room3D.tsx)

| # | 条目 | 标签 | 值 / 证据 |
|---|------|------|-----------|
| 17a | current wall visual owner | FACT | Room3D.tsx L881-1038: 每个房间独立调用自己的 walls useMemo，画自己房间的四面墙段；**无 shared wall 去重**；两相邻房间在 shared face 各画自己的墙段（厚度 t=0.1） |
| 17b | current wall collision owner | FACT | 同上 — mesh standard material + castShadow/receiveShadow，但 AABB 由 Three.js 从 boxGeometry 生成；collision 不是独立系统（当前场景 collision 仍为 TBD，无 NavMesh / Rapier 配置）；wall collision 也由每个房间各自承担 |

---

## §7. ASSET DIMENSION SOURCE (当前资产尺寸真实消费者)

| # | 条目 | 标签 | 值 / 证据 |
|---|------|------|-----------|
| 18 | current asset dimension source | FACT | (a) FurnitureModel / ObjectGeometries 中的 boxGeometry args 直接硬编码 size；(b) task 中的 containers[] / objects[] 各自带 size 字段 (e.g. cnt-coffee-table size L154: `{x:1.4, y:0.45, z:0.7}`)；(c) **没有统一读取 ASSET_DIMENSION_LEDGER 的集中式 AssetRegistry** — 三个地方各自写尺寸，潜在不一致 → CONFLICT 风险 |

**CONFLICT 记录**: 当前代码中家具模型 (SofaModel/CoffeeTableModel 等) 的 size 是调用方传入的（Room3D renderLiving L175 `SofaModel size={{x:2.4,y:0.9,z:1.0}}` vs Ledger 中的 scaled 1.96×0.92×0.82 → **两组数字不一致**）。布局阶段必须确定 Ledger 为 authoritative 源，还是 Room3D 手写值为源。本规划冻结 Ledger 为唯一源（详见 ASSET_DIMENSION_SOURCE_CONTRACT）。

---

## §8. CONCLUSION GATE

| 结论项 | 值 |
|--------|----|
| CARRY_CAPACITY | **CARRY_ONE** (FACT CONFIRMED · 非 UNKNOWN · 可继续计算 L1 路线) |
| L2 cat trigger resolved | YES (FACT · OR 双条件) |
| L3 active rooms resolved | YES (FACT · Laundry-only L3-A) |
| Minimap implementation vs plan GAP | CONFIRMED (Minimap 直接读 rooms.ts，不读 shared wall registry) |
| Asset dimension single-source GAP | CONFIRMED (目前三处硬编码；本规划后续建立唯一契约) |

下一文档: P0_PROGRAMMATIC_WALL_CONTRACT.md (B2 废弃 + P0 冻结)

---

End of RUNTIME_FACT_LEDGER. 18/18 items audited. No BLOCKER on CARRY_CAPACITY.
