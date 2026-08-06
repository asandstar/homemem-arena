# LIVING_A CONSTRAINT FREEZE

> ROUND B1 + B1.5 · 观察与设计冻结文档。未修改任何生产代码。

## 0. 坐标轴约定

| 方向 | 轴 | 说明 |
|---|---|---|
| East | +X | 朝 Entrance door |
| West | -X | 朝 Bedroom door |
| North | -Z | 朝 DiningKitchen door |
| South | +Z | 朝南墙 |

门洞位置：
- **Bedroom doorway**: West wall, X=-3.25, Z=0
- **Entrance doorway**: East wall, X=+3.25, Z=-1.1
- **DiningKitchen doorway**: North wall, Z=-2.75, X=0

## 1. Door Clearance Zones

数据源：[rooms.ts](../../src/data/rooms.ts) Living doorways，clearance = width/2 + 0.15m，深度 1.20m。

| Doorway | Wall | Clearance AABB (local X×Z) |
|---|---|---|
| Bedroom | West X=-3.25 | X[-3.25, -2.05] × Z[-0.85, +0.85] |
| Entrance | East X=+3.25 | X[+2.05, +3.25] × Z[-1.95, -0.25] |
| DiningKitchen | North Z=-2.75 | X[-0.85, +0.85] × Z[-2.75, -1.55] |

Living local bounds (margin=0.10): X[-3.15, +3.15] × Z[-2.65, +2.65]
PLAYER_RADIUS = 0.30m (from [playerControls.ts](../../src/game/playerControls.ts))

## 2. Hard Constraints

| ID | Constraint |
|---|---|
| LIV-H1 | 所有落地家具 effective AABB 完整位于 Living 内，margin ≥ 0.10m |
| LIV-H2 | 落地家具不得与三个 doorway clearance zone 相交 |
| LIV-H3 | Bedroom→Entrance 通行路径净宽 ≥ 0.90m (含 PLAYER_RADIUS) |
| LIV-H4 | Spawn(0,-1.5)→Dining doorway 通行路径净宽 ≥ 0.90m (含 PLAYER_RADIUS) |
| LIV-H5 | 主沙发必须靠墙 |
| LIV-H6 | TV cabinet 与 television 位置重合、朝向一致 |
| LIV-H7 | TV 组合面向主沙发，朝向误差 ≤ 15° |
| LIV-H8 | Coffee table 位于沙发前方（proj 0.1~0.9），不切断主路线 |
| LIV-H9 | Bookcase 靠墙，不进入任何 doorway clearance |
| LIV-H10 | 同一家具视觉/碰撞/小地图坐标来自同一条数据 |
| A6-H1 | Coffee table / initial key 从 spawn 可发现：≤45°转头，1.0~2.5m |
| A6-H2 | Relocated key 到 sofa footprint ≤0.40m，不在碰撞盒内，有站立交互点 ≤1.20m |
| A6-H3 | Relocated key 从 Entrance 门口第一视角不可直接看见 |
| A6-H4 | 猫脚印 3~6 个，相邻 0.25~0.75m，不穿墙和大型家具 |
| A6-H5 | L2 路线每段含 PLAYER_RADIUS 后净宽 ≥0.90m |
| A6-H6 | TV/cabinet/bookcase 不得侵入任何 doorway clearance |
| A6-H7 | Task coffee-table 与 visual coffee-table 只有一个视觉所有者 |

## 3. Soft Constraints (DESIGN_HEURISTIC)

| Weight | Category | Criteria |
|---|---|---|
| 40% | Gameplay Route | 三门通道畅通、L2 行进路线、交互区域可达 |
| 25% | Domestic Plausibility | 沙发-茶几-电视关系合理、家具靠墙、负空间充足 |
| 20% | First-Person Composition | spawn 第一眼构图、钥匙/茶几可识别、TV 墙不挤门 |
| 15% | Kenney Asset Showcase | 5 个模型在视频中易被看到、不被 fallback 遮挡 |

---

## 4. REJECTED: A5 (Playability Conflict)

**状态: REJECTED_A5_PLAYABILITY_CONFLICT**

拒绝原因：

1. **KEY-LOC-A (-0.4, +2.0) 距 sofa (-2.0, -2.24) 中心 4.53m** — 不满足"位于沙发附近"
2. **spawn 第一视角无法发现 coffee table** — coffee 在 spawn 身后（spawn 朝南，coffee 在西北）
3. **TV 组合遮挡 KEY-LOC-A 的判断错误** — 2D LOS 分析显示 TV cabinet 不在 Entrance→key 视线上
4. **task cnt-coffee-table (0, 0.3) 与 decor coffee (-2.0, -1.3) 位置不一致** — 会重复渲染两个茶几

A5 原坐标（仅存档）：
```
loungeSofa:        (-2.0, 0, -2.24)  rot=0     [North wall]
tableCoffee:       (-2.0, 0, -1.3)   rot=0
cabinetTelevision: (-2.0, 0, 2.1)    rot=π     [South wall]
televisionModern:  (-2.0, 0.62, 2.1) rot=π
bookcaseOpen:      (2.75, 0, 1.5)    rot=-π/2  [East wall]
```

---

## 5. CANDIDATE A6 (Playability Priority) — FINAL

```
                 North wall (z=-2.75)
    ┌──────────────────────────────────┐
    │         [TV CAB]                 │
    │  X[-2.80,-1.20]                  │
    │  Z[-2.35,-1.85]                  │
    │                                  │
    │  [Dining door]                   │
    │  X[-0.85,0.85]                   │
    │  Z[-2.75,-1.55]                  │
    │                                  │
    │         [COFFEE]    [book]       │
 -Z │  X[-0.66,0.66]     X[2.50,3.00]  │ +Z
    │  Z[-0.10,0.70]     Z[1.10,1.90]  │
    │                                  │
    │  spawn(0,-1.5)                   │
    │  ← faces South                   │
    │                                  │
    │  [Bedroom door]   [Entrance]     │
    │                                  │
    │  [SOFA]                          │
    │  X[-2.48,-0.52]                  │
    │  Z[1.83,2.65]                    │
    │                                  │
    │  KEY(-2.6,1.9)                   │
    └──────────────────────────────────┘
                 South wall (z=+2.75)
```

### 五件家具坐标

| Furniture | Local Pos (x, y, z) | rotationY | Effective Footprint (X×Z) |
|---|---|---|---|
| loungeSofa | (-1.5, 0, 2.24) | π | [-2.48, -0.52] × [1.83, 2.65] |
| tableCoffee | (0, 0, 0.3) | 0 | [-0.66, 0.66] × [-0.10, 0.70] |
| cabinetTelevision | (-2.0, 0, -2.1) | 0 | [-2.80, -1.20] × [-2.35, -1.85] |
| televisionModern | (-2.0, 0.62, -2.1) | 0 | [-2.69, -1.31] × [-2.23, -1.97] (collisionMode='none') |
| bookcaseOpen | (2.75, 0, 1.5) | -π/2 | [2.50, 3.00] × [1.10, 1.90] |

### 关键物品坐标

| Item | Local Pos (x, y, z) | 说明 |
|---|---|---|
| initial key | (0, 0.45, 0.3) | 在 coffee table 表面 |
| relocated key | (-2.6, 0, 1.9) | sofa 西侧 0.12m |
| cnt-coffee-table (task) | (0, 0.2, 0.3) | 与 decor coffee 对齐 |
| cat event targetPosition | {room:'living', x:-2.6, y:0, z:1.9} | |

### 猫脚印

| Print | (x, z) | 距上一点 |
|---|---|---|
| P0 (start) | (0, 0.3) | — |
| P1 | (-0.5, 0.8) | 0.71m |
| P2 | (-1.2, 1.0) | 0.73m |
| P3 | (-1.8, 1.0) | 0.60m |
| P4 | (-2.4, 1.2) | 0.63m |
| P5 (end) | (-2.6, 1.9) | 0.73m |

路径绕过 coffee table 北侧 → 西行 → 南折到达 sofa 西侧。

### optional lounge chair: REMOVE

理由：程序化侧沙发侵入 Bedroom-Entrance 走廊。移除后走廊净宽充足。

---

## 6. Machine Checks (A6)

| Check | Result |
|---|---|
| furniture-inside-room (H1) | ✅ PASS |
| doorway-overlap Bedroom (H2) | ✅ PASS |
| doorway-overlap Entrance (H2) | ✅ PASS |
| doorway-overlap DiningKitchen (H2) | ✅ PASS |
| Bedroom→Entrance route (H3, PR=0.3) | ✅ PASS (北侧绕行通道 6.5m 宽) |
| Spawn→Dining route (H4, PR=0.3) | ✅ PASS |
| furniture overlap | ✅ PASS (tv collisionMode='none') |
| TV faces sofa (H7) | ✅ 6.6° error ≤15° |
| coffee in front of sofa (H8) | ✅ proj=0.40 |
| sofa against wall (H5) | ✅ South wall (z2=2.65) |
| bookcase not in clearance (H9) | ✅ PASS |
| spawn discoverability (A6-H1) | ✅ angle=0°, dist=1.80m |
| relocated key near sofa (A6-H2) | ✅ 0.12m ≤0.40m, not inside furniture |
| standing interaction (A6-H2) | ✅ 0.30m ≤1.20m |
| cat prints (A6-H4) | ✅ 5 prints, all 0.25~0.75m, no furniture |
| LOS 2D (A6-H3) | ✅ sofa blocks at t=0.978, coffee blocks at t=0.444 |
| LOS 3D (A6-H3) | **LOS_UNVERIFIED** (需 THREE.Raycaster 或截图) |
| duplicate coffee (A6-H7) | ✅ task(0,0.3) = decor(0,0.3) aligned |
| **Hard constraint fails** | **0** |

### L2 Golden Path 路线

| Segment | From → To | Distance | Min Width (PR=0.3) |
|---|---|---|---|
| 1 | spawn(0,-1.5) → coffee(0,0.3) | 1.80m | 6.50m ✅ |
| 2 | coffee → Bedroom door(-3.25,0) | 3.40m | 5.90m ✅ |
| 3 | Bedroom → Entrance door(3.25,-1.1) | 6.59m | 5.90m ✅ |
| 4 | Entrance → relocated key(-2.6,1.9) | 6.15m | 5.90m ✅ |
| 5 | key → Entrance door | 6.15m | 5.90m ✅ |

### Soft Score (DESIGN_HEURISTIC)

- Gameplay 40%: 38/40 (spawn 正对 coffee，L2 路线全通，key 可达)
- Domestic 25%: 21/25 (sofa-coffee-TV 轴线合理，但 TV 在北墙靠近 dining 门)
- Composition 20%: 18/20 (spawn 第一眼看到 coffee table + TV 墙，key 在身后被 sofa 遮挡)
- Kenney 15%: 13/15 (5 模型全可见，sofa 在南墙略远)
- **Total: 90/100**

---

## 7. Recommended Candidate

**CANDIDATE A6** — 0 hard constraint fails，LOS 3D 标记为 LOS_UNVERIFIED。

推荐五件家具坐标：

```
loungeSofa:        { x: -1.5,  y: 0,    z:  2.24 }  rotationY: π        [South wall]
tableCoffee:       { x:  0,    y: 0,    z:  0.3  }  rotationY: 0
cabinetTelevision: { x: -2.0,  y: 0,    z: -2.1  }  rotationY: 0        [North wall]
televisionModern:  { x: -2.0,  y: 0.62, z: -2.1  }  rotationY: 0        collisionMode: 'none'
bookcaseOpen:      { x:  2.75, y: 0,    z:  1.5  }  rotationY: -π/2     [East wall]
```

- initial key: `{ x: 0, y: 0, z: 0.3 }` (on coffee table surface)
- relocated key: `{ x: -2.6, y: 0, z: 1.9 }` (west of sofa, 0.12m from footprint)
- optional lounge chair: **REMOVE**
- LOS verdict: **LOS_UNVERIFIED** (2D 分析显示 sofa + coffee 双重遮挡，但需 3D raycast 确认)

---

## 8. Single Source Migration Plan

目标结构（本轮不实施）：

```
rooms.ts          → 房间与 doorway 真值（已有，不改）
decorFurniture.ts → Living 家具真值（id/position/size/rotationY/collisionMode/modelAssetId）
Room3D.tsx        → 读取 decorFurniture 渲染，删除手写 5 件核心家具坐标
collision.ts      → 读取同一 decorFurniture（已有 resolveFurnitureCollision，不改逻辑）
Minimap.tsx       → 读取同一 decorFurniture（已有 roomDecorFurniture 读取，不改逻辑）
```

实施时需修改的最少文件：

1. **src/data/decorFurniture.ts** — 用 A6 坐标替换 living 数组中的 5 件核心家具 + 移除 decor-sofa-side
2. **src/components/arena3d/Room3D.tsx** — renderLiving() 中 5 件核心家具改为从 decorFurniture 读取
3. **src/data/tasks/leave-home.ts** — cnt-coffee-table position 改为 (0, 0.2, 0.3) [已对齐]；obj-key initialPosition 改为 (0, 0, 0.3)；cat event targetPosition 改为 {room:'living', x:-2.6, y:0, z:1.9}
4. **scripts/qa-layout.ts** — 新增 decorFurniture in-room + doorway-overlap 检查（QA gap 补齐）

总修改文件数：4 个

### A6-H7 重复茶几修复

当前状态：
- Task `cnt-coffee-table` position: (0, 0.2, 0.3) — 已与 decor coffee (0, 0, 0.3) 对齐
- 实施时需确保 Room3D 不再独立渲染第二个 coffee table fallback
- `cnt-coffee-table` 作为 invisible interaction container，decor coffee 作为唯一视觉所有者
