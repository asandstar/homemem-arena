# LEAVE_HOME 关卡最终布局方案 B2（附条件批准几何最终版）

本方案为唯一候选批准方案；§1-§8 所有坐标均已按附条件拍板 + 几何 9 项校验通过；所有 y 位置按引擎现有语义设置，不硬写文档旧 B2 表格中的 y 值；Spawn 旋转 = Math.PI（通过 getForwardVector 正向 +z，InitialKey 正前方 0°）；§9 三个问题不影响几何正确性，待人工确认后进入生产代码。

## §1 B2 唯一坐标表（16 项）

| # | 条目 | id | room-local (x, y, z) | size (x,y,z) | 所有权归属 | 备注 |
|---|---|---|---|---|---|---|
| 1 | 主沙发 | MainSofa | (0.00,0,-3.00) | (2.40,0.90,1.00) | Room3D static | y=0，引擎 floor-base 默认语义 |
| 2 | 茶几 | CoffeeTable | (0.00,0.2,0.30) | (1.40,0.45,0.70) | Task Container3D | y=0.2，Task 容器抬高语义 surfaceHeight=0.45 |
| 3 | 电视柜 | TVStand | (2.80,0,3.00) | (2.00,0.55,0.45) | Room3D static | y=0，引擎 floor-base 默认语义 |
| 4 | 电视 | TV | (2.80,0.8,3.00) | (1.60,1.00,0.15) | Room3D static | y=0.8，引擎电视默认悬空高度 |
| 5 | 扶手椅 | ArmChair | (-1.50,0,1.50) | (1.40,0.80,0.85) | Room3D static | y=0，引擎 floor-base 默认语义 |
| 6 | 书架 | Bookshelf | (3.50,0,-2.50) | (0.80,1.80,0.35) | Room3D static | y=0，引擎 floor-base 默认语义 |
| 7 | 搁架 | Shelf | (-2.80,0,3.80) | (0.70,1.20,0.20) | Room3D static | y=0，引擎 floor-base 默认语义 |
| 8 | 落地灯1 | FloorLamp1 | (3.50,0,-3.50) | (0.40,1.80,0.40) | Room3D static | y=0，引擎 floor-base 默认语义 |
| 9 | 落地灯2 | FloorLamp2 | (-0.30,0,1.50) | (0.35,1.60,0.35) | Room3D static | y=0，引擎 floor-base 默认语义 |
| 10 | 大植物1 | Plant1 | (-3.50,0,-3.50) | (0.50,1.20,0.50) | Room3D static | y=0，引擎 floor-base 默认语义 |
| 11 | 大植物2 | Plant2 | (3.60,0,2.00) | (0.35,0.80,0.35) | Room3D static | y=0，引擎 floor-base 默认语义 |
| 12 | 休闲椅 | LoungeChair | (3.00,0,-1.50) | (0.50,0.70,0.50) | Room3D static | y=0，引擎 floor-base 默认语义 |
| 13 | 边几 | SideTable | (-1.50,0,2.60) | (0.60,0.35,0.60) | Room3D static | y=0，引擎 floor-base 默认语义 |
| 14 | 出生点 Spawn | spawn | (0.00,0,-1.50) yaw=Math.PI | (0.40,0,0.40) 玩家身体 AABB | 无 | Spawn yaw=Math.PI，通过 getForwardVector 面朝 +z，需 Browser Preview 实际验证 |
| 15 | 初始钥匙 InitialKey | obj-key | (0.00,surfaceLogic,0.30) surfaceContainerId=cnt-coffee-table | (0.10,0.10,0.05) 近似 AABB | 无 | InitialKey y 由 surfaceContainerId + surfaceHeight 放置逻辑决定，不硬编码 |
| 16 | 猫移后钥匙 MovedKey | obj-key | (-1.00,groundLogic,-2.00) | (0.10,0,0.10) 近似 AABB | 无 | MovedKey y 由引擎物体地面偏移机制自动抬升，不硬编码 0 |

## §2 完整家具 AABB 表（13 行）

| # | id | center (x,z) | halfSize (x,z) | min (x,z) | max (x,z) |
|---|---|---|---|---|---|
| 1 | MainSofa | (0.00, -3.00) | (1.20, 0.50) | (-1.20, -3.50) | (1.20, -2.50) |
| 2 | CoffeeTable | (0.00, 0.30) | (0.70, 0.35) | (-0.70, -0.05) | (0.70, 0.65) |
| 3 | TVStand | (2.80, 3.00) | (1.00, 0.23) | (1.80, 2.77) | (3.80, 3.23) |
| 4 | TV | (2.80, 3.00) | (0.80, 0.07) | (2.00, 2.92) | (3.60, 3.08) |
| 5 | ArmChair | (-1.50, 1.50) | (0.70, 0.42) | (-2.20, 1.07) | (-0.80, 1.93) |
| 6 | Bookshelf | (3.50, -2.50) | (0.40, 0.17) | (3.10, -2.67) | (3.90, -2.33) |
| 7 | Shelf | (-2.80, 3.80) | (0.35, 0.10) | (-3.15, 3.70) | (-2.45, 3.90) |
| 8 | FloorLamp1 | (3.50, -3.50) | (0.20, 0.20) | (3.30, -3.70) | (3.70, -3.30) |
| 9 | FloorLamp2 | (-0.30, 1.50) | (0.17, 0.17) | (-0.47, 1.32) | (-0.13, 1.68) |
| 10 | Plant1 | (-3.50, -3.50) | (0.25, 0.25) | (-3.75, -3.75) | (-3.25, -3.25) |
| 11 | Plant2 | (3.60, 2.00) | (0.17, 0.17) | (3.43, 1.82) | (3.77, 2.17) |
| 12 | LoungeChair | (3.00, -1.50) | (0.25, 0.25) | (2.75, -1.75) | (3.25, -1.25) |
| 13 | SideTable | (-1.50, 2.60) | (0.30, 0.30) | (-1.80, 2.30) | (-1.20, 2.90) |

## §3 三门净空校验（3×13 距离表）

| 家具 | bedroom 门 (m) | kitchen 门 (m) | entrance 门 (m) |
|---|---|---|---|
| 主沙发(MainSofa) | 1.985 | 1.985 | 5.000 |
| 茶几(CoffeeTable) | 1.800 | 1.800 | 1.850 |
| 电视柜(TVStand) | 4.652 | 1.775 | 0.800 |
| 电视(TV) | 4.894 | 1.925 | 1.000 |
| 扶手椅(ArmChair) | 0.309 | 3.301 | 0.575 |
| 书架(Bookshelf) | 5.755 | 1.325 | 5.262 |
| 搁架(Shelf) | 2.700 | 5.638 | 1.450 |
| 落地灯1(FloorLamp1) | 6.239 | 2.300 | 6.239 |
| 落地灯2(FloorLamp2) | 2.051 | 2.645 | 0.825 |
| 大植物1(Plant1) | 2.250 | 6.175 | 6.175 |
| 大植物2(Plant2) | 5.982 | 0.825 | 2.447 |
| 休闲椅(LoungeChair) | 5.256 | 0.250 | 4.138 |
| 边几(SideTable) | 1.476 | 3.922 | 0.200 |
| **结论** | All ≥ 0.05 | All ≥ 0.05 | All ≥ 0.05 |

最后行判定：All ≥ 0.05 → **PASS**（三门 clearance 与所有 13 件家具最小距离均 ≥ 5cm）

## §4 家具重叠校验

- 枚举总对数：C(13,2) = **78** 对（TV↔TVStand 上下堆叠合法跳过不计）
- 检测到重叠对数 = **0**
- 3 对不相交示例（附分离距离）：
  - MainSofa <-> CoffeeTable: 2.450m
  - MainSofa <-> TVStand: 5.309m
  - MainSofa <-> TV: 5.484m

结论：**0 重叠 → PASS**

## §5 三门 BFS 连通性校验

- 网格规模：20×20 (cell=0.4m，覆盖 x∈[-4,4], z∈[-4,4])
- blocked cells 总数 = **49**（FREE=351）
- BFS start = Bedroom clearance 中心 (-3.25, 0.00) → cell (1,10)
- BD → Kitchen (3.25, 0.00) → cell (18,10)：可达=**是**，步数=19 × 0.4m = 路径长度 **7.60m**
- BD → Entrance (0.00, 3.25) → cell (10,18)：可达=**是**，步数=17 × 0.4m = 路径长度 **6.80m**

结论：**两门都可达 → BFS 全连通 PASS**

## §6 Spawn 安全 + 初始钥匙可见性

- **Spawn 最近家具校验**：Spawn (0.00, -1.50) 玩家 body AABB 0.4×0.4 → 最近家具 = **MainSofa**，距离 = **0.800m ≥ 0.05m → PASS**
- **Spawn → InitialKey 欧氏距离** = sqrt((0.00-0.00)² + (0.30-(-1.50))²) = **1.800m ∈ [1.5, 3.0] → PASS**
- **视野锥夹角**：Spawn yaw=Math.PI，forward=(sin π, -cos π)=(0,+1)；Key 向量 V=(0,1.80)；夹角 = acos((V·F)/(|V||F|)) = **0.00° ≤ 45° → PASS**
- **LOS 视线采样**：线段 (0,-1.5)→(0,0.3) 竖直线 100 均匀采样点，严格 interior 落入家具数 = **0 → PASS**（CoffeeTable 本身不算阻挡，Key₀ 合法放置在茶几容器上）

## §7 MovedKey 几何 + 搜索难度目标设计区间

Bedroom 门入口 BD = (-4.00, 0.00) living-local；MovedKey MK = (-1.00, -2.00)；向量 V = MK-BD = (3.00, -2.00)

- **视线夹角**：进门朝 +x 方向(+1,0)，V 与 (+1,0) 夹角 = atan2(|-2.00|,3.00)×180/π = **33.69° ≥ 20° → PASS**
- **视线距离** |V| = sqrt(9+4) = sqrt(13) = **3.606m ≥ 2.5 → PASS**
- **|MK.z|** = |-2.00| = **2.00 ≥ 1.0 → PASS**
- **8 方向可交互圆环**（0.5m 半径，θ=0°..315° 每 45°）：落入家具数 = **1/8 ≤ 3 → PASS**（被挡方向：270°，其余 ≥ 5 方向可站立交互）

**搜索难度文字：目标设计区间，尚待真人试玩验证。**

## §8 A* 路径总长 + 家具所有权处置 5 条 + E2E 去硬编码实施要求

### 8.a 四段 A* 精确路径总长（20×20 网格，无 1.1/1.2 系数）

| 段号 | 路径含义 | 起点→终点 (living-local) | 网格步数 × 0.4m | 精确长度 (m) |
|---|---|---|---|---|
| S1 | Spawn → InitialKey | (0.00,-1.50) → (0.00,0.30) | 4 | 1.60 |
| S2 | InitialKey → BD 门中心 | (0.00,0.30) → (-3.25,0.00) | 11 | 4.40 |
| S3 | BD 门中心 → MovedKey | (-3.25,0.00) → (-1.00,-2.00) | 11 | 4.40 |
| S4 | MovedKey → EN 门中心 | (-1.00,-2.00) → (0.00,3.25) | 16 | 6.40 |
| **Total flow** | S1+S2+S3+S4 四段总和 | - | - | **16.80** |

### 8.b 家具所有权处置 5 条（用户拍板）

- **主沙发**：保留 Room3D static（decor-sofa-main），移除候选 task cnt-sofa-main（从 src/data/tasks/leave-home.ts containers 删除）
- **茶几**：保留 Task Container3D cnt-coffee-table（surfaceHeight=0.45 抬高容器），移除候选 Room3D static coffee table + 从 src/data/decorFurniture.ts living 列表中移除对应 collider
- **卧室床头柜**：保留 Task Container3D cnt-nightstand，保留 1 个左侧静态床头柜（bedroom 的 decor-nightstand-left），移除右侧静态床头柜 decor-nightstand-right
- **玄关托盘**：只保留 Task Container3D cnt-entrance-tray，移除静态装饰托盘 decor-entray
- **雨伞**：只保留 Task cnt-umbrella-stand + obj-umbrella（初始放伞架上），移除两把静态装饰伞 decor-umbrella-red/blue

### 8.c E2E 去硬编码实施要求

```
实施要求：tests/e2e/first-level-command-flow.spec.ts
  不得使用固定的 x/z 猫钥匙坐标。
  测试必须：
    → 触发 se-cat-pushes-key 后，从 runtime entity state 读取 obj-key.position
    → 使用确定性的固定小偏移移动到钥匙附近，固定使用 {x: key.position.x + 0.2, z: key.position.z}
    → 调用生产交互命令完成靠近、拾取、保存和更新
  禁止使用 random 偏移；禁止直接改 obj-key 状态/stage/memory counter
```

## §9 仍需人工确认最多 3 个问题

1. **TV 与电视柜视觉层叠位置**：几何位置已定 center(2.80,3.00)；电视柜 size 2.0×0.55×0.45 (y=0 floor)，TV size 1.6×1.0×0.15 (y=0.8 悬空)；颜色/像素风比例 Browser Preview 预览后再微调
2. **MovedKey 猫爪痕迹/高亮/交互描边等可发现提示**：几何位置已确认地面放置 xz=(-1.00,-2.00)；地面偏移 y 由引擎物体地面偏移机制自动抬升防 Z-fighting，不硬编码 0
3. **Armchair（扶手椅 1.4×0.8）视觉样式与摆放**：中心已定 (-1.50,1.50)；几何校验 9 项全 PASS；Browser Preview 预览后若觉得位置/体积偏，再确认是否需要微移（范围 ±0.1m）
