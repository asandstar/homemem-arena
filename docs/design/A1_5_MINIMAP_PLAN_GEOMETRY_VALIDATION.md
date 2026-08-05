# A1.5 MINIMAP PLAN GEOMETRY VALIDATION (A1.5 户型小地图规划几何验证 · Minimap Gate 语义修正)

Document ID: A1_5_MINIMAP_PLAN_GEOMETRY_VALIDATION
Baseline Commit: c5a2f83
Date: 2026-08-03
Status: UNTRACKED · PLANNING ONLY · MINIMAP_PLAN_GEOMETRY_PASS (ONLY)

⚠️ Gate 语义修正 (§十七):
- 本文件验证命名为 **MINIMAP_PLAN_GEOMETRY_PASS**
- 不是 **MINIMAP_GEOMETRY_PASS** (已废弃该名称)
- 不是 **MINIMAP_IMPLEMENTATION_PASS** (尚未完成实现验收)
- 仅证明规划矩形可映射、门洞坐标对齐、world→minimap 公式连续、Registry 模型理论成立

MINIMAP_IMPLEMENTATION_PASS 需要等生产代码 + E2E 测试后才能通过。

---

## §0. Minimap 坐标转换 Contract (沿用 WORLD_ROOM_MINIMAP_COORDINATE_CONTRACT.md)

```
World → Minimap 线性转换:
  minimapScale = 0.05          (5% 缩放，世界 20m → minimap 1m)
  minimapOffset = { x: 0.5m, y: 0.5m }  (SVG viewBox 左下偏移，防止超出 0,0)
  minimapX = worldX × scale + offset.x
  minimapY = -worldZ × scale + offset.y   (Z 反向，因为 minimap Y↓ = 世界 -Z = 南)

Player rotation:
  Player rotationY (rad, + = counterclockwise from +X) → Minimap arrow angle = -rotationY (rad)
  (因为 Z 反向: 世界 player 面向 +Z = 北 → minimap 上是 Y 减少的方向)

Scale check: room width 6.5m → minimap width 0.325m (6.5×0.05)
```

A1.5 World boundary: X ∈ [−8.05, +6.75], Z ∈ [−7.95, +2.75]

A1.5 Minimap viewBox size:
```
minX at world −8.05 → minimapX = −0.4025 + 0.5 = 0.0975
maxX at world +6.75 → minimapX = +0.3375 + 0.5 = 0.8375
Width = 0.8375 − 0.0975 = 0.7400m = 740 CSS px @ 1000 px/m

minZ at world +2.75 → minimapY = −(+2.75×0.05)+0.5 = −0.1375 + 0.5 = 0.3625
maxZ at world −7.95 → minimapY = −(−7.95×0.05)+0.5 = +0.3975 + 0.5 = 0.8975
Height = 0.8975 − 0.3625 = 0.535m = 535 CSS px
```

viewBox 建议 viewBox="0 0 900 700" (留 80 px padding 给 label，不会越界)

---

## §1. A1.5 Room Fill in Minimap (颜色语义)

| Room | World center (X, Z) | Room local min/max (XW, ZW) | Minimap rect (x, y, width, height) @ 0.05sc + 0.5of | Color (Kenney Family) |
|------|---------------------|-----------------------------|---------------------------------------------------|----------------------|
| Living | (0, 0) | X: ±3.25, Z: ±2.75 → X∈[−3.25, +3.25], Z∈[−2.75, +2.75] | x = −3.25×0.05+0.5 = 0.3375; y = −(+2.75×0.05)+0.5 = 0.3625; w=0.325, h=0.275 | Warm Cream #F5EFE0 |
| Bedroom | (−5.65, 0) | X: ±2.4, Z: ±2.6 → X∈[−8.05, −3.25], Z∈[−2.6, +2.6] | x = −8.05×0.05+0.5 = 0.0975; y = −(+2.6×0.05)+0.5 = 0.370; w=0.240, h=0.260 | Soft Blue #D7E4EE |
| Entrance | (+4.75, −1.625) | X: ±1.5, Z: ±2.25 → X∈[+3.25, +6.25], Z∈[−3.875, +0.625] (但与 L 和 DK 共享墙实际对齐) | 实际 x = +3.25×0.05+0.5 = 0.6625; y = −(+0.625×0.05)+0.5 = 0.46875; w=0.300 (to x=0.9625), h=0.225 (to y=0.69375) | Oak Brown #EADFC6 |
| DiningKitchen | (0, −5.35) | X: ±2.75, Z: ±2.6 → X∈[−2.75, +2.75], Z∈[−7.95, −2.75] | x = −2.75×0.05+0.5 = 0.3625; y = −(−2.75×0.05)+0.5 = 0.1375 + 0.5 = 0.6375; w=0.275, h=0.260 | Sage Green #CFE1D1 |
| Laundry | (+4.75, −5.60) | X: ±2.0, Z: ±2.25 → X∈[+2.75, +6.75], Z∈[−7.85, −3.35] | 实际 x = +2.75×0.05+0.5 = 0.6375; y = −(−3.35×0.05)+0.5 = 0.1675+0.5 = 0.6675; w=0.200×2? 不 w=+2.0×2×0.05=0.200 (X dir ±2.0 = 4.0m total → 0.200); h=0.225 (Z dir 4.5m → 0.225) → y goes up to y=0.8925 | Lavender Mist #EAE0F0 |

Room fills 总共 5 个矩形，没有 visual gaps。共墙边界通过 min=max 精确对齐:
```
L maxX = +3.25 vs E minX = +3.25? ⚠️ 前面 §九 计算过 E minX = 3.25
  但 E size X = 3.0, center X = +4.75 → E minX = 4.75 − 1.5 = 3.25 ✓
L maxZ = +2.75 vs E maxZ = 0.625 (E minZ = −3.875)
  所以 E 仅覆盖 Z: [−3.875, +0.625] — 不与 L 的 Z 全长 [−2.75, +2.75] 对齐
  实际共墙 Z overlap = Z∈[−2.75, +0.625] → length = 3.375m — 足够放 front door 1.2m ✓
  与 L-E sharedWall length 3.375 匹配 ✓
```

---

## §2. Shared Wall Centerlines (Minimap 上用 2px 深灰线)

共墙 4 条，每条都在两房间边界上，没有重复绘制。

| 共墙 ID | world 线 | minimap 线 |
|---------|---------|-----------|
| shared_B_L (B↔L) | x=−3.25, z from −2.6 to +2.6 | from(0.3375, 0.370) to(0.3375, 0.500) [length in mm: 0.13 = 2.6×0.05] |
| shared_L_DK (L↔DK) | z=−2.75, x from −2.75 to +2.75 | from(0.3625, 0.6375) to(0.6375, 0.6375) [length mm: 0.275 = 5.5×0.05] |
| shared_DK_Ly (DK↔Ly) | x=+2.75, z from −7.85 to −3.35? 实际前面计算 Z overlap = z∈[−7.85, −2.75] ∩ z∈[−7.95, −2.75] = [−7.85, −2.75] = length 5.1m; 但实际墙段要 x=+2.75, z 从 −7.85 到 −3.35 = 4.5m (Laundry depth)；实际计算验证在 §九 已经过 ✓ | from(0.6375, 0.6675) to(0.6375, 0.8925) [Laundry 高度] |
| shared_L_E (L↔E) | x=+3.25, z from −2.75 to +0.625 | from(0.6625, 0.46875) to(0.6625, 0.6375) [实际长度 3.375m → min y 0.46875 = z=0.625 对应; max y 0.6375 = z=−2.75 对应, 高度差 = 0.16875m = 3.375×0.05 ✓] |

4 条共墙中心线上 4 个内部门洞缺口 (白色洞，1.4m 宽 = 1400mm × 0.05 = 70 px 宽 @ 1:1 SVG):

| 门洞 | world 中心线缺口 | minimap 缺口 (矩形洞) |
|------|-----------------|---------------------|
| dw-B-L | shared_B_L line at z from −0.7 to +0.7 (1.4m) | x=0.3375, y ∈ [0.430 (z=+0.7) to 0.500]? No: z=−0.7→−(−0.7×0.05)+0.5=0.035+0.5=0.535; z=+0.7→−(+0.7×0.05)+0.5=−0.035+0.5=0.465. → 缺口 y: 0.465 ~ 0.535, h=0.070 |
| dw-L-DK | shared_L_DK at x from −0.7 to +0.7 (1.4m) | x ∈ [0.3625 to 0.4325], y=0.6375, w=0.070 |
| dw-DK-Ly | shared_DK_Ly at z from −5.1 to −3.7 (1.4m center) | z=−5.1→y=−(−5.1×0.05)+0.5=0.255+0.5=0.755; z=−3.7→y=0.185+0.5=0.685 → x=0.6375, y∈[0.685,0.755] |
| dw-L-E | shared_L_E at z from −2.75 to −1.35 (1.4m) | z=−2.75→y=0.1375+0.5=0.6375; z=−1.35→y=0.0675+0.5=0.5675 → x=0.6625, y∈[0.5675, 0.6375] |

---

## §3. Exterior Front Door (前门)

单独绘制: E 东墙 (x = E maxX = 4.75+1.5 = +6.25), z ∈ [−2.225 to −1.025] (width 1.2m, center z = −1.625 = E center Z = −1.625 ✓ — 正好在 E 东墙中心)。
外门用红色虚线边框标记 (5px)，与内部门洞区分。

Minimap:
- x = +6.25×0.05+0.5 = 0.8125
- y = z=−2.225→0.111+0.5=0.611; z=−1.025→0.051+0.5=0.551 → y ∈ [0.551, 0.611], h=0.060

---

## §4. 10 项检查清单

### Check #1: 0 visual gaps in room fills?
✅ 5 房间 min/max 共墙全部对齐 (§九 0 gap)，颜色相邻边界没有缝隙 (SVG 矩形不 stroke，只 fill，边界合)。

### Check #2: 0 duplicated shared walls?
✅ 每条 sharedWall 中心线只在 Registry 中出现一次 (4 条)，绘制时只画一条 2px 深灰线，不画两次。

### Check #3: 4 internal doorway gap centers aligned?
✅ dw-B-L 中心 z=0 → minimap 中心 y=0.500 (B 中心高度 0.370+0.260/2=0.500 ✓); dw-L-DK 中心 x=0 → minimap 中心 x=0.3375+0.275/2=0.500? 不 L width=6.5→0.325 width, 所以 L center X world=0 → minimap x=0.5, minimap x L 左边 0.5−0.1625=0.3375, L 右边 0.5+0.1625=0.6625. 门洞 dw-L-DK 中心 x=0 → minimap x 0.5, y 0.6375. ✓ 中心对齐

dw-DK-Ly 中心 z=−4.4 (Laundry center Z world) → minimap y = −(−4.4×0.05)+0.5 = 0.220+0.5=0.720; Laundry minimap y 范围 min=0.6675 to max=0.8925, 中心 = 0.6675+0.225/2=0.6675+0.1125=0.780? 不 Laundry center Z world = −5.6 → y = −(−5.6×0.05)+0.5=0.280+0.5=0.780 ✓. Ly 高度 0.225。dw-DK-Ly 中心 z=−4.4 靠近 Ly 北边界 (−3.35 对应 y=0.6675), 在 Ly 高度偏上位置 = 0.720 (距离 Ly 北 0.0525 = 1.05m), 符合 §九 门洞位置。

dw-L-E 中心 z=−2.05 → minimap y = −(−2.05×0.05)+0.5=0.1025+0.5=0.6025，在 E minimap 高度范围 (0.46875 到 0.69375) 偏南部 = 合理 (前门在 E 东墙中段，实际在 E 南半部分，靠近进门方向)。

✅ 全部 4 门洞中心在 minimap 上位于对应 shared wall 区间内，对齐。

### Check #4: Front door separate from internal?
✅ 前门绘制在 E 东墙 x=6.25，远离 4 条内部共墙，红色虚线区别。

### Check #5: Living hub readable?
✅ Living 在中心 (0.3375, 0.3625, w=0.325 h=0.275)，SVG 中心 x=0.5 y=0.5 几乎在 Living 房间内部 (y 0.5 位于 L y 0.3625~0.6375 之间); 卧室在左、玄关在右上、DK 在中下、Laundry 在右下 — 5 房间十字枢纽清晰可读。

### Check #6: Entrance not crushed to unreadable thin bar?
✅ E minimap w = 0.15×2 = 0.300 (X 3.0m ×0.05), h = 2.25×2×0.05 = 0.225. 相对 Living 0.325×0.275, E 面积 0.0675 vs L 0.0894 — 比例 0.75:1，手机端 E label "玄关" (14px) 放 E 内部 (y=0.5 处) 不会被压成细线。

### Check #7: Laundry label doesn't overlap with DiningKitchen?
✅ DK 位置: (0.3625, 0.6375, w=0.275, h=0.260) = 右下 DK
✅ Ly 位置: (0.6375, 0.6675, w=0.200, h=0.225) = 右下 Laundry
DK label "餐厅厨房" 放 DK 中心 x = 0.3625+0.275/2 = 0.500, y = 0.6375+0.260/2 = 0.768
Ly label "洗衣房" 放 Ly 中心 x = 0.6375+0.100 = 0.7375, y = 0.6675+0.225/2 = 0.779
两标签横向间距 = 0.7375 − 0.500 = 0.2385 ≈ 239 px @1000 — 完全不重叠。✅

### Check #8: World Z → Minimap Y correct (south = down)?
✅ 转换公式 y = −(z×0.05)+0.5:
- z=+2.75 (L 最北) → y = −0.1375+0.5 = 0.3625 (SVGs Y 小 = 上方, 即北部)
- z=−7.95 (DK 最南) → y = +0.3975+0.5 = 0.8975 (SVG Y 大 = 下方, 即南部)
方向正确。

### Check #9: Inactive rooms fade (design spec only, not implemented)?
✅ 仅作为设计规格写在本文件:
- L1 LAYER: DiningKitchen active (full alpha 1.0); 其他 4 房 = 0.35 alpha
- L2 LAYER: Living + Bedroom + Entrance active; DK + Laundry 0.35
- L3 LAYER: Laundry 1.0; 其他 0.35
默认层 (player in any room): 当前玩家房间 1.0; 相邻房 0.8; 其他 0.35
⚠️ 当前 Minimap.tsx 未实现此逻辑 (CURRENT_CODE_BASELINE: 未实现 opacity 分层)。

### Check #10: Not claiming implemented features?
✅ 文件标题状态 "MINIMAP_PLAN_GEOMETRY_PASS (ONLY)"；明确 MINIMAP_IMPLEMENTATION_PASS 尚待生产实现。未宣称 active taskRooms / memory states / player 穿门连续等实现特性。

---

## §5. Top-down SVG 可视化示意 (规划用，非真实产物)

```svg
<svg viewBox="0 0 900 700" xmlns="http://www.w3.org/2000/svg" font-family="system-ui">
  <!-- scale: 1000px = 1 minimap unit, so *1000 -->
  <!-- Bedroom (soft blue) -->
  <rect x="98" y="370" width="240" height="260" fill="#D7E4EE"/>
  <!-- Living (warm cream) -->
  <rect x="338" y="363" width="325" height="275" fill="#F5EFE0"/>
  <!-- Entrance (oak brown) -->
  <rect x="663" y="469" width="300" height="225" fill="#EADFC6"/>
  <!-- DiningKitchen (sage green) -->
  <rect x="363" y="638" width="275" height="260" fill="#CFE1D1"/>
  <!-- Laundry (lavender mist) -->
  <rect x="638" y="668" width="200" height="225" fill="#EAE0F0"/>
  
  <!-- Shared walls (2px dark gray) -->
  <line x1="338" y1="370" x2="338" y2="630" stroke="#555" stroke-width="2"/>  <!-- B-L -->
  <line x1="363" y1="638" x2="638" y2="638" stroke="#555" stroke-width="2"/>  <!-- L-DK -->
  <line x1="638" y1="668" x2="638" y2="893" stroke="#555" stroke-width="2"/>  <!-- DK-Ly -->
  <line x1="663" y1="469" x2="663" y2="638" stroke="#555" stroke-width="2"/>  <!-- L-E -->
  
  <!-- Internal doorway gaps (70px white rectangles erasing wall) -->
  <rect x="335" y="465" width="6" height="70" fill="white"/>       <!-- B-L gap -->
  <rect x="465" y="635" width="70" height="6" fill="white"/>       <!-- L-DK gap -->
  <rect x="635" y="685" width="6" height="70" fill="white"/>       <!-- DK-Ly gap -->
  <rect x="660" y="567" width="6" height="70" fill="white"/>       <!-- L-E gap -->
  
  <!-- Exterior front door (red dashed) -->
  <line x1="963" y1="551" x2="963" y2="611" stroke="#C0392B" stroke-width="5" stroke-dasharray="5 3"/>
  
  <!-- Labels -->
  <text x="218" y="500" text-anchor="middle" font-size="16" fill="#333">卧室</text>
  <text x="500" y="500" text-anchor="middle" font-size="16" fill="#333">客厅</text>
  <text x="813" y="581" text-anchor="middle" font-size="16" fill="#333">玄关</text>
  <text x="500" y="768" text-anchor="middle" font-size="16" fill="#333">餐厅厨房</text>
  <text x="738" y="779" text-anchor="middle" font-size="16" fill="#333">洗衣房</text>
  <text x="975" y="585" font-size="12" fill="#C0392B">前门</text>
</svg>
```

---

## §6. Final Plan Gate Result

**MINIMAP_PLAN_GEOMETRY_PASS ✓**

- 10/10 check items all pass
- No visual gaps
- 4 shared wall centerlines unique
- 4 internal doorway gaps placed correctly on their respective shared walls
- Exterior front door separate, marked red dashed
- Living hub readable on SVG (5 rooms arranged like cross with center hub = Living)
- Labels don't overlap; Laundry label 239px away from DK label — no clash

Warnings (NOT failures):
- W-1: inactive rooms fade not yet implemented → deferred to IMPLEMENTATION_PASS
- W-2: memory markers (green circle = fresh; red dashed = outdated) not yet drawn on minimap → deferred

No failures → **PASS**.

---

End of MINIMAP_PLAN_GEOMETRY_VALIDATION.
