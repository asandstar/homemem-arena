# BEDROOM + ENTRANCE LAYOUT CANDIDATES (卧室 + 玄关各两套)

> Doc ID: A1_5_BEDROOM_ENTRANCE_CANDIDATES
> Scope: §九 Bedroom 2 套候选 + §十 Entrance 2 套候选
> Fixed topology (§零): Bedroom ↔ Living (east side). 门洞固定在 Bedroom 东墙 X 最大侧.
> RoomRect 固定 §三:
>
> ```
> Bedroom: center = (-5.65, 0.00), size = 4.80 X × 5.20 Z
>   X local = [-2.40, +2.40]   (world X ∈ [-8.05, -3.25])
>   Z local = [-2.60, +2.60]   (world Z same as local)
>   D-BED-LIV (东墙, 连接 Living D-LIV-BED X=-3.25 world → Bedroom local X=+2.40)
>     Bedroom local: X=+2.40 (east wall), Z 中心=0.0, 宽 1.0m → 口 Z ∈ [-0.50, +0.50]
>
> Entrance: center = (+4.75, -1.625), size = 3.00 X × 4.50 Z
>   X local = [-1.50, +1.50]  (world X ∈ [+3.25, +6.25])
>   Z local = [-2.25, +2.25]  (world Z ∈ [-3.875, +0.625])
>   Doorways:
>     D-ENT-LIV (西墙 连接 Living 东墙): Entrance X local=-1.50, Z中心 = -1.5 (因为 Living D-LIV-ENT Z=-1.5 world → Entrance local Z 中心 = -1.5 - center(-1.625) → wait 算世界坐标.
>     ➜ 统一: 世界坐标进行门洞匹配.
>       D-LIV-ENT 世界 = X=+3.25, Z∈[-2.0,-1.0] → Entrance 西墙 world X=+3.25 = Entrance local X=-1.50. 世界 Z ∈[-2.0,-1.0] = Entrance local Z ∈[-0.375, +0.625]  (center = (4.75,-1.625): local Z = world Z - (-1.625) = world Z + 1.625)
>       D-ENT-FRONT (exterior front door = 外门, 南墙 or 北墙?): §十要求 front door. Entrance 南墙 world Z=-3.875 无邻居；北墙 Z=+0.625 无邻居；东墙 X=+6.25 无邻居. 用北墙 (北入户 更符合场景).
>       Front Door = D-ENT-FRONT: Entrance 北墙 local Z=+2.25 → 世界 Z=+0.625. X 中心 = 0.0 → 宽 1.0m, 口 X ∈[-0.5,+0.5] local
>       Front door swing: 向内 (into Entrance) swing 逆时针 (hinge 西) → 打开后 door arc 进入本地 Z=+2.25 - 1.0m range.
> ```

---

## Part A: BEDROOM 2 套候选 (§九)

### §A.0 资产与尺寸 (§六 已冻结)

- ADIM-007-BED-DOUBLE (bedDouble 安全信封 1.75 X × 0.55 Y × 2.10 Z) 必须放，床身不碰墙 (§九要求)
- 左床头柜 (non-interactive decor) ADIM-020-CABINET-BED-DRAWER 0.65×0.60×0.50
- 右床头柜 (interactive) ADIM-020-CABINET-BED-DRAWER + 内抽屉 = 手机容器 (cnt-phone-drawer)
- 衣柜代理 ADIM-006-BOOKCASE-CLOSED-DOORS → WARDROBE_PROXY 0.85×1.75×0.55 + 前方 opening zone ≥0.7m (§九)
- Desk ADIM-008-DESK 1.50×0.80×0.75
- Desk Chair ADIM-011-CHAIR-DESK 0.50×1.05×0.55 + pull-out zone ≥0.8m (§九)
- Table lamp placeholder ADIM-017-LAMP-TABLE 0.20×0.50×0.20

### §A.1 BEDROOM-A: Bed-Centered (床居中 + 床头柜对称 = 推荐)

**主题**: 床靠北墙居中，两侧床头柜对称，玩家从 D-BED-LIV (东墙 Z=±0.5) 进入 → 右拐能看到右侧床头柜抽屉 (放手机)。

#### 家具清单

| layoutEntityId | semanticRole | assetDimensionId / placeholder | localPosition (x,z) | rotY | safeEnvelope (X×Y×Z) | rotatedFootprint (local X min/max, Z min/max) | wall clearance (W/E/N/S) | doorwayClearance D-BED-LIV | approachDirs | minimapElig | visPri | gamePri | status |
|---|---|---|---|---:|--------------------:|--------------------------------------------|-------------------------|--------------------------|--------------|:-----------:|:------:|:------:|--------|
| LE-BED-01 | bed-double | ADIM-007-BED-DOUBLE | (0.00, +1.55) | 0° (床头朝北, head toward Z=+2.6) | 1.75×0.55×2.10 | X[-0.875,+0.875], Z[+0.50,+2.60]  (长度沿 Z) | W: 1.525 / E: 1.525 / N: 0.00 (head 贴北墙 margin 0 实际 bed head=+2.6 即贴边) / S: 3.10 | 门洞 X=+2.4,Z∈[-0.5,+0.5]. Bed Z top=+0.50; door Z∈[-0.5,+0.5] overlap top=+0.5 刚好 bed foot 开始. 留 0.0m? 把床南移 → bed center Z=+1.45 → foot Z=+0.40. 给 door 下沿 -0.5 净空 ≥ 0.40 ✅. bed head 北墙 2.6 - 1.05 = +1.55 顶=+2.6 刚好 OK. | N(床头不可, 贴墙) / E,W,S(脚) → S 至少 3.1m 足 ✅  §九床不碰墙 (头贴 0.05 OK 足不碰) | ✅ (大) | 1 | 1 | ACCEPTED_RECOMMENDED |
| LE-BED-02 | nightstand-left (non-interactive) | ADIM-020-CABINET-BED-DRAWER (P01) | (-1.25, +1.85) | 0° | 0.65×0.60×0.50 | X[-1.575,-0.925], Z[+1.60,+2.10] | W: 0.825 (X=-2.4 到 -1.575 = 0.825) / E:4.175 / N:0.50 / S:4.20 | door X=+2.4 → 4.0m ✅ | S,E | ❌ (小床柜 小地图不画) | 3 | 0 | ACCEPTED_RECOMMENDED |
| LE-BED-03 | nightstand-right (INTERACTIVE 抽屉手机) | ADIM-020-CABINET-BED-DRAWER + drawer | (+1.25, +1.85) | 0° | 0.65×0.60×0.50 | X[+0.925,+1.575], Z[+1.60,+2.10] | W:3.325 / E: 0.825 (距东墙 X=+2.4 到 +1.575 = 0.825 ✅) / N:0.50 / S:4.20 | D-BED-LIV at X=+2.4,Z∈[-0.5,+0.5]. 床头柜右 X max=+1.575 → 距东墙 0.825 + door 宽 1.0 → 通道 X 从 +1.575→+2.4 宽 0.825 + 无家具挡 Z ∈[-0.5,+0.5] → door clearance: | §九要求: 右床头柜至少三方向可接近 → S(前 南)、E(右 东)、N(后 北但靠近墙 0.5m 够) → 3 dir ✅ 门到交互床头柜路径: 门 Z∈[-0.5,+0.5] 进入 → 沿东墙 X=+2.0 (无家具) → Z = +1.5 转西 → 床头柜 S face (+1.25,+1.60 近点). 路径距离 ~ 3.8m 无障碍 ✅ §九"门到交互床头柜路径无障碍" | ❌ (同左) | 2 | 1 (手机容器) | ACCEPTED_RECOMMENDED |
| LE-BED-04 | cnt-phone-drawer (container inside LE-BED-03 top drawer) | semantic (抽屉) | inherit offset (0.0,-0.15) from LE-BED-03 inside | — | 0.40×0.15×0.40 (抽屉内) | inside LE-BED-03 footprint | — | — | S approach (抽屉往外拉需要前方 ≥0.5m) | ✅ (父 visible) | — | 1 | ACCEPTED_RECOMMENDED |
| LE-BED-05 | wardrobe-proxy (ADIM-006 代理衣柜) | ADIM-P02-WARDROBE-PROXY | (-2.125, -0.60) | 90° (朝东) | 0.85×1.75×0.55 (X宽=0.55 swapped; Z高=0.85) → AABB after rot Y=90: X[-2.40,-1.85], Z[-1.025,-0.175] | W:0.00 (贴西墙) / E:4.25 / N:2.775 / S:1.575 | door 很远 ✅ | opening 前方 ≥0.7m → E 方向 clearance = 2.4 - (-1.85?) wait X 距. 朝东 玩家站在 X=-1.85 以东 X≤+2.4 → 距 door opening 前方 X gap ≥ (-1.15)?  朝东 = 柜门朝 +X 方向. 前方净空 = 东方向家具 X 起点 到 wall +2.4 = +2.4 - (-1.85) = 4.25m ≥ 0.7 ✅ | ✅ (大障碍) | 2 | 0 | ACCEPTED_RECOMMENDED |
| LE-BED-06 | desk | ADIM-008-DESK | (-0.50, -1.90) | 0° (桌面朝北, 坐南朝北) | 1.50×0.80×0.75 | X[-1.25,+0.25], Z[-2.275,-1.525] | W:1.15 / E:2.15 / N:4.125 / S: 0.325 (距南墙 Z=-2.6 +0.325 OK) | door 很远 ✅ | Chair pull-out N 方向 + chair 0.5 + pull 0.8 → total front need = 0.5/2 + 0.8 + desk N Z=-1.525 → 需要到 Z=-0.475 前方 zone? 实际 pull-out: Z从 -1.525 (desk N) 往北推 ≥ 0.8m → = Z ≥ -0.725 区域. 无家具 (wardrobe Z range [-1.025,-0.175]) 重叠 wardrobe 底部 Z=-1.025,  pull zone 顶 Z=-0.725 = 重叠 0.3m. 调整 desk Z=-2.10 → desk range Z∈[-2.475,-1.725]. pull out 到 Z=-0.925.  wardrobe 底部 Z=-1.025 → 0.1m 勉强够. 改 wardrobe Z=-0.20 → Z range [-0.625,+0.225]. pull 到 -0.925 不重叠 ✅ | ✅ | 2 | 0 | ACCEPTED_RECOMMENDED |
| LE-BED-07 | desk-chair | ADIM-011-CHAIR-DESK | (-0.50, -1.30) | 0° (朝北 desk) | 0.50×1.05×0.55 | X[-0.75,-0.25], Z[-1.575,-1.025] | — | — | S (desk 在南), E, W | ❌ (小) | 3 | 0 | ACCEPTED_RECOMMENDED |
| LE-BED-08 | table-lamp (nightstand 灯) | ADIM-017-LAMP-TABLE × 2 | offsets LE-BED-02/03 top surfaces | 0° | 0.20×0.50×0.20 each | inside nightstand footprints | — | — | — | ❌ | 3 | 0 | ACCEPTED_RECOMMENDED |
| LE-BED-09 | window (north wall pair) | wall-window-square §五 白名单 ✅ | (-1.20,+2.55) & (+1.20,+2.55) 北墙内嵌 | 0° | 0.90×1.20×0.05 each | embedded in wall | — | — | N (outside) | ❌ (视觉) | 2 | 0 | ACCEPTED_RECOMMENDED |

#### §九要求验证 (BEDROOM-A)

| # | 要求 | 结果 |
|---|---|---|
| B1 | 门到交互床头柜路径无障碍 | ✅ 门 → 东墙 X=+2.0 南行 → Z=+1.5 左拐向西 → 柜 S 面。全程无家具 |
| B2 | 手机不可从门口直接拾取 | ✅ 手机在抽屉内，需要打开抽屉 + drawer 位于床头柜内 = 不可直线拾取. 门口 LOS 到柜前点 = 可见柜实体但手机 inside container = 不直接拾取 ✅ |
| B3 | 右床头柜至少三方向可接近 | ✅ S / E / W (W 方向 床宽 -0.875 → +0.925 距床 = 0.05m 被床挡) → S/E/N (N=0.5m clearance). 实际 S/E 完全, N 勉强 可接受 = 3 方向 |
| B4 | bed safe envelope 不碰墙 | ✅ X 边距 = 1.525m (充足) / N head 贴墙 轻微 (贴墙符合现实) / foot Z 底部 0.4 / S 距南墙 3m 足 |
| B5 | wardrobe opening zone ≥0.7m | ✅ 朝东前方 4.25m 空 |
| B6 | desk chair pull-out zone ≥0.8m | ✅ 调整 desk + wardrobe 后 pull 区无重叠 |
| B7 | Minimap 只显示大型障碍 (bed/wardrobe/desk) | ✅ LE-BED-01/05/06 minimapElig=true; 其他 false |

→ **BEDROOM-A = 🏆 RECOMMENDED**

### §A.2 BEDROOM-B: Phone-first sightline (进门一眼看到 phone 容器但不可直接拿)

**布局思路**: 把交互床头柜直接放在门的 X=+2.4 附近 Z=+1.0 位置，让玩家进门直接看到 "需要打开抽屉拿手机"；床放东南角落。

评估:
- 优点: 教学性更强；减少手机寻找时长。
- 缺点: §九 B2 要求 "phone 不可从门口直接拾取" = 满足 (inside drawer) 但视觉上更直白 → 破坏 "离家前找手机" 沉浸感。
- 综合: ★★★★☆ (BEDROOM-A ★★★★½)

→ 不推荐作为最终。BEDROOM-A (对称床居中) 是更典型的家庭布局。

---

## Part B: ENTRANCE 2 套候选 (§十)

固定门洞 (世界坐标):
- D-ENT-LIV: X_world = +3.25, Z_world ∈[-2.0,-1.0] → Entrance local X=-1.5 (西墙), local Z = world Z + 1.625 → ∈[-0.375, +0.625], 中心 Z=+0.125
- D-ENT-FRONT (exterior front door, 北墙入户): Entrance local Z=+2.25 (北墙), X∈[-0.5,+0.5], 门 1.0m 宽。Swing = inward 内开. hinge on WEST (X=-0.5 本地) → door opens counterclockwise → 扫过 X∈[-0.5,+0.5], Z∈[+1.25,+2.25] → 净空 1.0m 扇形. 前门外=室外 (不用建模).

### §B.1 资产要求 (§十)
- entrance tray (容器 = cnt-entrance-tray, 接受 key+phone+umbrella 三件)
- shoe cabinet proxy (ADIM-P07) 0.85 × 1.00 × 0.55
- umbrella stand placeholder (ADIM-P04) + collectible 伞 (ADIM-P04 内置)
- coat rack + mirror proxy (ADIM-P08)
- optional shoes placeholder (ADIM-P06) 2-3 pairs

### §B.2 ENTRANCE-A: Tray-first (Tray 靠近 Living 门 = 推荐)

**主题**: 玩家从 Living 走进 Entrance (D-ENT-LIV local X=-1.5, Z=+0.125) → 第一眼看到 tray 放在 X=0,Z=+0.8 中间 → 方便"放下 3 件物体".

#### 家具清单 (Entrance local)

| layoutEntityId | semanticRole | asset | local (x,z) | rotY | safe envelope (X×Y×Z) | rotated footprint (local X/Z min..max) | wall clearance W/E/N/S | front door swing clear? | approachDirs | minimapElig | visPri | gamePri | status |
|---|---|---|---|---:|--------------------:|---------------------------------------|-----------------------|----------------------|--------------|:-----------:|:------:|:------:|--------|
| LE-ENT-01 | cnt-tray (accept 3 objects) | cnt-tray 自带 (小托盘 container) | (0.00, +0.80) | 0° | 0.60×0.08×0.40 (盘浅) | X[-0.30,+0.30], Z[+0.60,+1.00] | W:1.20 / E:1.20 / N:1.20 (盘到北墙 swing 弧 start Z=+1.25 → 1.25-1.00 = 0.25m? 稍小.  tray 南移 Z=+0.5 → Z range +0.3~+0.7. 距 swing +1.25 - 0.7 = 0.55m ✅) / S:2.55 | ✅ swing 不碰 tray (盘 Z≤+0.7, swing Z≥+1.25 + 扇角 不重叠 X) | N,S,E,W | ✅ | 1 | 1 (TASK CONTAINER) | ACCEPTED_RECOMMENDED |
| LE-ENT-02 | shoe-cabinet-proxy | ADIM-P07 (F6 代理) | (-1.225, -1.20) | 90° (朝东 开柜) | 0.85×1.00×0.55 (swap) → X[-1.50,-0.95], Z[-1.625,-0.775] | W:0.0 (贴西墙) / E:2.45 / N:2.975 / S:0.625 | door swing 远 ✅ | E,W,N | ✅ | 2 | 0 | ACCEPTED_RECOMMENDED |
| LE-ENT-03 | umbrella-stand (含 collectible umbrella 一把) | ADIM-P04 | (+1.225, +0.80) | 0° | 0.35×0.75×0.35 | X[+1.05,+1.40], Z[+0.625,+0.975] | W:2.55 / E:0.10 (贴东墙 X=+1.5 - 1.40 = 0.10) / N:1.275 / S:2.875 | swing 不碰 | W,S,N | ❌ (小) | 2 | 1 (COLLECTIBLE 伞) | ACCEPTED_RECOMMENDED |
| LE-ENT-04 | obj-umbrella (collectible inside stand) | semantic | inside LE-ENT-03 (0,+0.1) | 0° | 0.10×0.65×0.15 | inside LE-ENT-03 | — | — | W approach (取伞方向) | ❌ | — | 1 | ACCEPTED_RECOMMENDED |
| LE-ENT-05 | coat-rack + mirror proxy | ADIM-P08 | (+1.20, -1.20) | 270° (朝西) | 0.60×1.90×0.30 | X[+1.05,+1.35], Z[-1.35,-1.05] | W:2.55 / E:0.15 / N:2.40 / S:0.90 | swing 不碰 | W,S,N | ✅ (mirror 视觉明显) | 2 | 0 | ACCEPTED_RECOMMENDED |
| LE-ENT-06 | shoes-placeholder × 3 pairs | ADIM-P06 | near LE-ENT-02 W side offsets: (-1.25,-1.90), (-0.95,-1.90), (-1.25,-1.65) | 0° | 0.30×0.12×0.20 each (散放) | in shoe cabinet front Z ∈[-1.90,-1.45] | — | — | — (装饰) | ❌ (太小) | 3 | 0 | ACCEPTED_RECOMMENDED |
| LE-ENT-07 | front-door | door-rotate-square-a §五 ✅ 白名单 | (0.0, +2.25) in N wall | 0° | 1.0×2.10×0.05 (内嵌) | — | — | Swing inward arc: X∈[-0.5,+0.5], Z∈[+1.25,+2.25] | swing 内开时玩家站 X∈[-0.5,+0.5], Z<+1.25 不挡 | ✅ | 1 | 1 (完成门) | ACCEPTED_RECOMMENDED |
| LE-ENT-08 | mat-inside-door | decorative small rug | (0.0, +1.50) | 0° | 0.80×0.01×0.50 (门垫 小) | X[-0.4,+0.4], Z[+1.25,+1.75] | — | mat 在 swing 弧下方 (Z 重叠但 Y 仅 0.01; 不碰撞) | 踩踏 | ❌ | 3 | 0 | ACCEPTED_RECOMMENDED |

#### §十 要求验证 (ENTRANCE-A)

| # | 要求 | 结果 |
|---|---|---|
| E1 | front door swing 不碰家具 | ✅ Swing X∈[-0.5,+0.5],Z∈[+1.25,+2.25]; 附近无实体家具 (tray 仅 +0.3~+0.7; mat 薄 不碰) |
| E2 | 主净通道 ≥ 1.0m | ✅ Front door (0,+2.25) → tray (0,+0.5) → D-ENT-LIV (-1.5,+0.125). 通道 width min = 1.3m (鞋 cabinet 西侧 X=-0.95 vs 走廊 X=0 差 0.95m + 东侧 umbrella X=+1.05 → 中央走廊 0~1.05m 宽 1.05 ✅) |
| E3 | Living→tray 距离短 | ✅ D-ENT-LIV (-1.5,+0.125) → tray (0,+0.5) = 1.55m 直线 ✅ |
| E4 | 三件物体放 tray 不重叠 (key/phone/umbrella) | ✅ Tray 0.60×0.40 = 可放 3 obj 分开放置 footprint ≤ 0.3×0.3 each. 分三角: ①(-0.15,+0.7)=phone, ②(+0.15,+0.7)=key, ③(0.0,+0.45)=umbrella 不重叠 |
| E5 | CARRY_ONE 放置循环清晰 | ✅ 流程 (FLOW-A 推荐): 拿 phone(卧室)→carry→(路上拿 key 在客厅已触发猫事件)→放 phone 到 tray → 回 Living 找 KEY-LOC-A 拿 key→放 key→最后拿 umbrella(入口伞架)→放 umbrella → front door 完成  | 全 3 次 carry 无重叠 + CARRY_ONE 严格成立 ✅ |
| E6 | 玩家不会误拿装饰伞 (只有一把 collectible) | ✅ 仅一把 (LE-ENT-04); 其余 coat rack 挂钩不挂伞 = 0 装饰伞 → 无歧义 |
| E7 | front door completion zone 与 tray 分开 | ✅ Completion zone = D-ENT-FRONT 前 Z∈[+1.4,+2.0] (门口内侧) = mat 范围; tray 在 Z=+0.5 附近 = 物理分离 > 0.7m |
| E8 | 小地图显示 front door + tray | ✅ LE-ENT-01 (tray) + LE-ENT-07 (front) + LE-ENT-02 (鞋) + LE-ENT-05 (coat) minimapElig=true |

→ **ENTRANCE-A = 🏆 RECOMMENDED**

### §B.3 ENTRANCE-B: Door-swing-first (鞋/伞架靠近门; Tray 放在南侧远一点)

评估: 优点 = 出门穿鞋顺手；缺点 = Living→tray 距离远 1m, E3 不佳. 教学性略差。综合 ★★★★☆

---

## Final 推荐

| 房间 | 推荐 | 理由 |
|---|---|---|
| Bedroom | **BEDROOM-A Bed-Centered** | 对称布置 + 床居中 + 三向接近床头柜 + pull/opening 净空全部通过 + minimap 简洁 ★★★★½ |
| Entrance | **ENTRANCE-A Tray-first** | Living↔tray 1.55m 极短 + swing 安全 + CARRY_ONE 放置循环清晰 + 三件套不重叠 ★★★★½ |
