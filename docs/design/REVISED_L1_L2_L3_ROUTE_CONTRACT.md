# REVISED L1 / L2 / L3 ROUTE CONTRACT (基于源码 CARRY_ONE 与真实房间尺寸重算)

Document ID: REVISED_L1_L2_L3_ROUTE_CONTRACT
Date: 2026-08-03
Baseline Commit: c5a2f83
CARRY_CAPACITY: CARRY_ONE (CONFIRMED FACT from entitySlice.ts L32)
Status: UNTRACKED · PLANNING ONLY · ALL ROUTES USE REAL A1.5 GEOMETRY

---

## §0. 全局手持容量假设 (MANDATORY)

```yaml
CARRY_CAPACITY: CARRY_ONE (严格单持)
  - heldEntityId: string | null (单值)
  - 拿 cup 后试图 pick tissue → FAIL ("手里已经拿着东西了")
  - 必须 place 到某接受容器后才能 pick 下一个
  - 台面 acceptAny=true 的容器可以临时换手 (例如 L1 餐桌上)
```

由此，旧文档中"一次捡起 cup + tissue + fork 再分别投放"的推荐路线 **正式废弃**。

---

## §1. L1 (task-clean-table, DiningKitchen 单房) 教学关路线

### 1.0 三目标基础位置 (A1.5 DiningKitchen: center (0, 0, −5.35))

| 物体 | spawn (room-local) | world 坐标 | 目标容器 | 容器 room-local | 容器 world |
|------|---------------------|------------|----------|-----------------|------------|
| cup (脏杯子) | DK: (−0.6, 0, 0) on table | (−0.6, 0, −5.35) | cnt-dishwasher | DK: (+2.2, 0, +0.5) (东墙北) | (2.2, 0, −4.85) |
| tissue (餐巾纸) | DK: (+0.6, 0, 0) on table | (+0.6, 0, −5.35) | cnt-trash-bin | DK: (−2.2, 0, +0.5) (西墙北) | (−2.2, 0, −4.85) |
| fork (叉子) | DK: (0, 0, −0.3) on table | (0, 0, −5.65) | cnt-utensil-rack | DK: (−1.5, 0, 0) (西墙中) | (−1.5, 0, −5.35) |

Player spawn: DK center (0, 0, −5.35) rotated π (朝南 = −Z，看向餐桌南沿)。
Table center = DK (0, 0, 0) local → world (0, 0, −5.35).

### 1.1 CARRY_ONE 下三种可能顺序 (每次往返必须单独回餐桌)

#### 顺序 A: Cup → Tissue → Fork (推荐教学顺序, 逻辑 = 先液体后垃圾后餐具)

```
Step 1: 教学 E: spawn → 靠近 cup (DK: −0.6,0,0) → E 保存 cup 位置
Step 2: F pick cup (CARRY_ONE: held = cup)
Step 3: 走 cup→dishwasher: distance DK(−0.6,0)→(+2.2,+0.5) = √(2.8²+0.5²) ≈ 2.84m
Step 4: F place cup into cnt-dishwasher (✅)
Step 5: 返回餐桌中心: (2.2, 0.5)→(0, 0) = √(2.2²+0.5²) ≈ 2.26m
Step 6: E 保存 tissue 位置 (靠近 tissue at +0.6,0,0)
Step 7: F pick tissue
Step 8: 走 tissue→trash: (+0.6,0)→(−2.2,+0.5) = √(2.8²+0.5²) ≈ 2.84m
Step 9: F place tissue into cnt-trash-bin (✅)
Step 10: 返回餐桌中心: (−2.2, 0.5)→(0, −0.3) = √(2.2²+0.8²) ≈ 2.34m (去 fork 位置)
Step 11: E 保存 fork 位置 (near DK: 0,0,−0.3)
Step 12: F pick fork
Step 13: 走 fork→utensil-rack: (0, −0.3)→(−1.5, 0) = √(1.5²+0.3²) ≈ 1.53m
Step 14: F place fork into cnt-utensil-rack (✅)
```

顺序 A 总计:
- 走路距离 ≈ 2.84 + 2.26 + 2.84 + 2.34 + 1.53 = **11.81m**
- 返回餐桌次数: 3 次 (spawn→cup at table; dishwasher→table→tissue; trash→table→fork)
- 第一次交互时间 (F pick cup): ≈ step 2 (玩家 2 秒内到达，180s 限内可忽略)
- 操作次数 (F): pick 3 + place 3 = 6 次 F；E 保存记忆 3 次 (cup/tissue/fork 各一次，L1 教学强制要求)
- 是否需要来回穿过餐桌主通道: 是 (杯→东，纸→西，叉→西北，三条线都经过餐桌主通道 X=−0.6~+0.6, Z=−0.3~0)
- 预计完成时间 (新手): ≈ 45~70 秒，180s 时限 × 0.3~0.4 占用，合理

#### 顺序 B: Fork → Tissue → Cup (最坏顺序，因为 utensil rack 在西中，trash 在西北，dishwasher 在东北，需要横穿桌子两次对角)

```
Fork→rack 1.53 → return→table→tissue ≈2.0 → tissue→trash 2.84 → return→table→cup ≈1.5 → cup→dishwasher 2.84
Total distance ≈ 1.53 + 2.0 + 2.84 + 1.5 + 2.84 = **10.71m** (看似更短，但叉放完后要走对角到杯 → 操作思考时间长)
```

**最坏时间:** 新手可能困惑为什么先放叉再放杯 (液体/垃圾/餐具的认知顺序颠倒)，思考 + 走 = 70~100s，仍在 180s 限内。

#### 顺序 C: Tissue → Cup → Fork (中间路线)

距离 ≈ 12.30m，比 A 略长。

### 1.2 A1 / A1.5 / A2 相同家具位置的路线长度比较

| Route | A1 (DK 6×6) | A1.5 (DK 5.5×5.2) | A2 (DK 5.5×5.0) |
|-------|------------:|------------------:|----------------:|
| 顺序 A (cup→tissue→fork) | 13.8m | 11.81m | 11.5m |
| 最坏顺序 B | 12.5m | 10.71m | 10.4m |
| 教学提示是否需要在 HUD 标注 | 可选 | 推荐 (先液体后垃圾) | 推荐 |
| 是否穿过餐桌主通道 | 是，走更多 | 是，正常 | 是，距离短 |

**结论**: A1.5 L1 路线长度最优 (11.8m，走路不过长也不太短，给 E 记忆保存留出认知时间)。

### 1.3 L1 记忆保存次数建议

- **最少 E 次数**: 1 次 (L1 stage 1 只要求 "至少保存过一件记忆" 即可通过 stage-observe-table，clean-table.ts L36)
- **推荐 E 次数**: 3 次 (每 pick 前一次) — 教学关目的就是让玩家学会 E→F 组合
- 玩家能否走捷径 (只存 1 次记忆，然后 pickup 3 次): 可以 (commands 只限制 stage-observe-table 期间禁止 pick，见 L114-128)；一旦过了 stage 1，stage 2 起不限制 pick 前必须 E。但教学设计上推荐 HUD 上显示"💡 按 E 保存 fork 的位置"作为软引导。

---

## §2. L2 (task-leave-home) 旗舰关路线 + 事件顺序

### 2.1 L2 当前源码声明活动房间 + 物品分布

| Room | 物体 / 容器 |
|------|------------|
| Living | key (initially on coffee table at L (0,0,+0.3)), cnt-coffee-table (茶几), 猫 (沙发), TV+书架+落地灯装饰 |
| Bedroom | phone (initially hidden in cnt-nightstand drawer at B (0.5,0,+0.75)), cnt-nightstand (drawer), bed, wardrobe, desk |
| Entrance | umbrella (initially on cnt-umbrella-stand at E (−2.5,0,+1.0)), cnt-umbrella-stand, cnt-entrance-tray E (−1.4,0,+1.0) |

L2 当前源码 rooms: `['living', 'entrance', 'bedroom']` ✅ (NOT cross-room to DK / Laundry — 因此 `L2 rooms` 本身是单房+两邻接，不含跨 DK/Ly)

### 2.2 L2 推荐路线 (基于 A1.5 真实尺寸，car = CARRY_ONE)

```
Spawn: Living (0, 0, −1.5) (茶几南侧), rotation π (朝北 = +Z，面向茶几)
Time limit: 180s. Goal: 3 items placed on entrance tray.
```

#### L2 Phase 1: Observe + 保存 key 记忆 (E) + 触发猫事件的 OR 双条件

Cat trigger (OR 双条件 from leave-home L292-303):
- (a) keyFreshSaved + keyFree + leftLiving
- (b) keyFree + phoneObtained

**推荐流程 L2-FLOW-A · KEY-FIRST (改动最小，不需要改任务状态机)**

```
Step 1 (L spawn): 玩家在 Living，先观察茶几 → 走到茶几 key 位置 (0, +0.3)
Step 2: E 保存 key 记忆 (keyFreshSaved = true ✓，key 仍 free 在茶几上)
Step 3: 离开 Living → 去 Bedroom 拿手机 (穿过 dw-living-bedroom at x=−3.25, z=0)
  → 到达 Bedroom 瞬间: currentRoom !== living ✓
  → 此时 (a) 三条件都满足 → Cat event 自动触发！
  → message: 🐱 钥匙猫扒拉了钥匙…客厅西北角(沙发侧)找找？(toast 显示)
  → 此时玩家已在 Bedroom，看不到 key 实际被挪走，stale memory = 心理冲击正确
Step 4: Bedroom: find nightstand at B (+0.5,+0.8) → F open drawer → phone 从 hidden→free
Step 5: E 保存 phone 位置 → F pick phone → 返回 Living (穿过 B→L 门洞)
  → 此时玩家在 Living，观察茶几 → key 不在 (stale memory 灰红虚圆在 minimap 上显示原来的茶几位置!)
  → 玩家意识到 "记忆过期了!" (与 HUD stage-key-outdated 对应 leave-home L87)
Step 6: 按照 cat 提示去客厅西北角 sofa 下 → 找到 displaced key at L (−3.2,−3.2)
Step 7: E 更新 key 记忆 (memoryUpdateCount += 1, key 记忆变 fresh ✓; stage-key-outdated 完成, 进入 stage-finalize)
Step 8: F pick key (CARRY_ONE: 手里必须放下 phone 才能 pick key)
  → OPTIMAL: 临时把 phone 放回茶几台面 (cnt-coffee-table acceptAny=true)
  → pick key → 拿 key 走 Living→Entrance
Step 9: Place key 到 cnt-entrance-tray (E: −1.4, +1.0) → key ✅归位
Step 10: 返回 Living → 从茶几台面 pick 起刚才临时放的 phone → 走 L→E
Step 11: Place phone 到 tray → phone ✅归位
Step 12: 在 Entrance 看到 umbrella on stand (E: −2.5, +1.0) → E 保存 → F pick umbrella
Step 13: Place umbrella 到 tray → 三件全 tray ✅ → cat event ✓ + key fresh → 任务完成!
```

L2-FLOW-A 走路距离 (A1.5):
```
Spawn(0,−1.5)→茶几(0,0.3): 1.8m
茶几→B 门洞(−3.25,0): 3.3m
门洞→B nightstand(−5.65+0.5=−5.15, 0+0.8=+0.8): 2.15m (B room local (0.5,0.8) to door offset)
B→L 门洞: 2.15m (返回)
L 茶几→Living NW 搜索区 L (−3.2,−3.2): √(3.2²+3.5²) ≈ 4.75m
Key found → 回茶几放 phone + pk key: 4.75m (反向)
茶几 → E 门洞 (L +3.25,−2.0): √(3.25²+2.0²) ≈ 3.82m
E 门洞 → tray E (4.75−1.4=3.35, −1.625+1.0=−0.625): √((3.35−3.25)²+(−0.625−(−2.0))²) ≈ 1.38m
Tray → back to L coffee table (取 phone): 3.82+1.38 ≈ 5.2m
茶几→E tray (带 phone): 5.2m (同上反向)
Tray → umbrella stand E (4.75−2.5=2.25, −1.625+1.0=−0.625): √((3.35−2.25)²+0) ≈ 1.1m
Stand → tray: 1.1m
Total ≈ 1.8+3.3+2.15+2.15+4.75+4.75+3.82+1.38+5.2+5.2+1.1+1.1 ≈ **36.65m**
```

在 180s 内正常可行 (新手 ≈ 130~160s，留有 ~20s buffer)。

---

## §3. L3 (task-laundry-sort) 范围冻结: L3-A · Laundry 单房

### 3.1 L3 CURRENT_CODE_BASELINE rooms 声明

```typescript
laundry-sort.ts L38: rooms: ['laundry']   // FACT
```

**L3 严禁跨房 (Living → DK → Laundry → Living 等交替文档描述必须废弃)。**

### 3.2 冻结的 L3 活动房间范围契约 (L3_ACTIVE_ROOM_CONTRACT)

```yaml
L3_ACTIVE_ROOM_CONTRACT · FROZEN for Phase 1:
  activeRoomIds: ['laundry']   # 仅洗衣房单房
  spawnRoom: 'laundry'         # L42 spawnPosition (x=0,z=+2.0) 在 Laundry 内部
  completionRoom: 'laundry'    # 所有 containers + objects 全部 initialRoom: 'laundry'
  transitionAllowed: false     # 不允许 doorway 传送离开 Laundry
  why this choice:
    - L2 已经是三关旗舰 (3 rooms)，L3 应聚焦分类机制 (时间记忆+篮子位置交换)，不是走路
    - 三篮可见性: 三篮并排在 N 墙 (3 个篮 x=±3/0, z=−2.0)，玩家一回头就同时看见
    - 衣物辨识: 所有衣物在 S 墙附近 (z=+1.0~+1.4)，南北间距 3.4m，不跨房看得清
    - 学习成本: 单房 = 低，玩家专注于颜色分类，不用记忆 doorway 位置
    - L2/L3 房间复用: L2 用 L/B/E，L3 用 Laundry 单独不冲突
    - 小地图复杂度: 单房 minimap = 极简 (默认模式只画 Laundry，不会混乱)
    - 关卡时长: 单房 240s 限已经够 (9 件衣物 × pick 2m + place 2m ≈ 4m×9 = 36m 走路)
  alternative L3-B (DK + Laundry 双房) 评估:
    - rooms 改动: 需在 laundry-sort.ts L38 加 'kitchen'/'dining' → 违反"只改 tests/e2e + ≤3 ArenaPage"禁令
    - 行走距离 × 1.5~2.0 (Dk↔Ly 门洞往返)
    - 分类清晰度下降 (人在 DK 看不见 Laundry 三篮颜色光圈)
    - 三篮可见性: DK 看不到 Laundry 篮 (需要 minimap 辅助，认知负担高)
    - 关卡时长: 240s 紧，跨房走路多导致超时率 ↑
    - 增加无意义搬运 (衣服本来就应该在 Laundry 内分类，搬到 DK 无剧情动机)
  → DECISION: 默认 L3-A · Laundry 单房 FROZEN。除非后续发现代码 bug 否则不修改。
```

---

## §4. 三关路线总体 A1.5 可行性总结

| 关 | rooms | CARRY_ONE 下的路线长度 | 时限占用 | 记忆机制是否有足够张力 |
|----|-------|----------------------|----------|----------------------|
| L1 clean-table | DiningKitchen 单 | ~11.8m (A 序) | 45~70s / 180s | ✅ 三件物品距离刚好让玩家意识到 "存 E 再 pick F" |
| L2 leave-home | L+B+E 三 | ~36.7m (FLOW-A) | 130~160s / 180s | ✅ stale memory 冲击力合适；key 搜索 ~5s 发现 |
| L3 laundry-sort | Laundry 单 | ~36m (9 件 × 4m) + 位置交换 | 180~220s / 240s | ✅ 猫挪衣 + 篮子交换 = 时间记忆张力 |

A1.5 三关全部可在时限内通关，且记忆认知机制的"学习曲线坡度"合理。

---

End of REVISED_L1_L2_L3_ROUTE_CONTRACT.
