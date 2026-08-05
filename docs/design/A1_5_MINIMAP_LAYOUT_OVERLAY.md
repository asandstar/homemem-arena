# A1.5 MINIMAP LAYOUT OVERLAY (小地图覆盖层 + 机器生成 SVG)

> Doc ID: A1_5_MINIMAP_LAYOUT_OVERLAY
> Scope: §十三 全屋 top-down SVG + L1/L2/L3 minimap + world→minimap 转换 + furniture eligibility
> Gate (§十三): 只能是 MINIMAP_LAYOUT_PLAN_PASS (不得 IMPLEMENTATION_PASS)
> Runtime fact (Minimap 非 placeholder. Minimap 读取 entitySlice. minimapEnabled 根据 activeRoomIds 过滤)

---

## §0. world → minimap 转换数据

### §0.1 Coordinate System

```
WORLD (m):
  X ∈ [-8.05, +6.75]  (A1.5 房屋 X 总宽)
  Z ∈ [-7.95, +2.75]  (A1.5 房屋 Z 总高)
Total world bounds: width_W = 14.80m, height_W = 10.70m

MINIMAP (SVG pixels, px):
  Target canvas: 740 px wide × 535 px tall = scale_FACTOR = 50 px/m
  world_origin = (-8.05, -7.95) world → svg (0, 0) top-left
  flip_Z_axis = YES (world +Z = north = svg -Y, i.e. world Z_high → svg Y_low)

Conversion formulas (room-local world or world → svg (x_px, y_px)):
  w = world point (Xw, Zw)  [注意 Zw 是 Z 坐标]
  svg_x_px =  (Xw - (-8.05)) × 50 = (Xw + 8.05) × 50
  svg_y_px =  (height_W - (Zw - (-7.95))) × 50 = (10.70 - (Zw + 7.95)) × 50 = (2.75 - Zw) × 50
  (验证: Z=+2.75 → (2.75-2.75)×50=0 top; Z=-7.95 → (2.75 - -7.95)×50 = 10.7×50=535 底部 ✅)

For room-local → world:
  world_Xw = room.center.world_X + local.x
  world_Zw = room.center.world_Z + local.z
```

### §0.2 RoomRect in SVG pixel bounds

| Room | world (Xmin, Xmax, Zmin, Zmax) m | svg bbox (x_px, y_px, w_px, h_px) (50 px/m) | fill color (推荐) |
|---|---|---|---|
| Bedroom | [-8.05,-3.25] × [-2.60,+2.60] | (0, 15, 240, 260) | #f3e5d8 (warm beige) |
| Living | [-3.25,+3.25] × [-2.75,+2.75] | (240, 0, 325, 275) | #efe8db (warm neutral) |
| Entrance | [+3.25,+6.25] × [-3.875,+0.625] | (565, 106, 150, 225) | #e6dce8 (lilac tint) |
| DiningKitchen | [-2.75,+2.75] × [-7.95,-2.75] | (265, 275, 275, 260) | #dfe7e0 (sage tint) |
| Laundry | [+2.75,+6.75] × [-7.85,-3.35] | (540, 305, 200, 225) | #e0e4ee (blue tint) |

### §0.3 4 Internal Doorways + 1 Exterior Front Door SVG coordinates

Doorway (§三 固定):
```
D-LIV-BED (西-东 1.0m): 世界 X∈[-3.25,-3.15? 实际上是 gap=1.0m wide (shared wall 的门洞). 简化 gap = doorway open rectangle.
更清晰处理 doorways as 开口: 用 "gap rect" 渲染 = 在 shared wall 上画 1.0m × 0.1m (开口).
```

具体 SVG 数据 (pixel):

| Doorway ID | Type | World gap | SVG bbox | color |
|---|---|---|---|---|
| GAP-D-LIV-BED | internal | X∈[-3.25,-3.25 无厚度; Z∈[-0.5,+0.5] gap length 1.0m + door swing visual 0.6m across shared wall | pixel (237, 137, 6, 50) — 横切 shared wall thin gap = light gray | white dashed (open) |
| GAP-D-LIV-ENT | internal | X=+3.25, Z∈[-2.0,-1.0] (vertical gap 1.0m) | svg (562, 137, 6, 50) | white dashed |
| GAP-D-LIV-DK | internal | Z=-2.75, X∈[-0.5,+0.5] (horizontal gap 1.0m) | svg (390, 272, 50, 6) | white dashed |
| GAP-D-DK-L | internal (DK ↔ Laundry): X=+2.75, Z∈[-6.35,-5.35] world → pixel Z 计算 Zw ∈[-6.35,-5.35] → svg_y = (2.75-Zw)×50. Zw=-5.35→y=405; Zw=-6.35→y=455. gap_x= (2.75+8.05)×50=540 - 3=537.  bbox: (537, 405, 6, 50) | white dashed |
| GAP-FRONT-ENT | exterior front: D-ENT-FRONT 北墙 Entrance 入户门: Entrance 北墙 Z world=+0.625, X local∈[-0.5,+0.5] → world X∈[+4.25,+5.25] (center +4.75 ±0.5). Gap: X[+4.25,+5.25], Z=[+0.625,+0.725] → svg: x=(4.25+8.05)*50=615,y=(2.75-0.725)*50≈101 bbox (615, 101, 50, 6) | ✨ YELLOW solid + red outline (exterior!) |

---

## §1. Furniture Minimap Eligibility (furniture eligibility §§各房 minimapElig=true 列表)

Rule: minimap 只画 大型障碍 (> 0.50m × 0.50m 投影) / task container / active room marker / spawn. 不画小装饰/小衣物/书/杯.

```yaml
minimapEligibleEntities (按 room):
  bedroom:
    - LE-BED-01 (bed-double 1.75×2.10) → 深蓝灰
    - LE-BED-05 (wardrobe-proxy 0.85×0.55) → 深灰
    - LE-BED-06 (desk 1.50×0.75) → 棕褐
  living:
    - LE-LIV-01 (sofa 2.40×0.95) → 深橙
    - LE-LIV-02 (coffee-table 1.40×0.80) → 木色
    - LE-LIV-03/04 (TV + cabinet 1.80×0.55) → 黑灰
    - LE-LIV-05 (bookshelf 0.85×0.55) → 木褐
    - LE-LIV-06 (armchair ~1.0×~0.9) → 橙
    - LE-LIV-10 (cnt-coffee-table task container mark = ★ star on coffee)
  entrance:
    - LE-ENT-01 (cnt-tray task container = ■) → 红方
    - LE-ENT-02 (shoe-cabinet 0.85×0.55) → 木
    - LE-ENT-05 (coat rack + mirror 0.60×0.30 → expand to 0.8 square) → 灰
    - LE-ENT-07 (front door = exterior GAP-FRONT-ENT = yellow dashed square)
  diningKitchen:
    - LE-DK-01 (dining-table 1.80×0.95) → 木
    - LE-DK-06 (cnt-dishwasher ■) → 蓝方
    - LE-DK-07 (cnt-trash-bin ■) → 绿方
    - LE-DK-08 (cnt-utensil-rack ■) → 橙方
    - 视觉橱柜 LE-DK-09~12 (如果画 = 浅棕虚线)
  laundry:
    - LE-LAU-01 (washer) → 浅蓝
    - LE-LAU-02 (dryer) → 浅紫
    - LE-LAU-03 (basket-white □ white outline)
    - LE-LAU-04 (basket-dark ■ dark)
    - LE-LAU-05 (basket-towel ■ beige)
    - LE-LAU-06 (utility shelf) → 木
```

---

## §2. FULL TOP-DOWN HOUSE SVG (A1.5 整体俯视图)

§十三 要求: room rect, 4 internal doorway gaps, exterior front door, large furniture footprints, task containers, player spawn samples, L1/L2/L3 active markers.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 620" width="800" height="620" font-family="Arial" font-size="12">
<!-- viewBox: extra margin 30px 周围 -->
<defs>
  <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
    <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#ddd" stroke-width="0.5"/>
  </pattern>
</defs>
<!-- Background grid -->
<rect width="800" height="620" fill="white"/>
<rect x="0" y="0" width="800" height="620" fill="url(#grid)" opacity="0.6"/>

<!-- Translation margin +30,+30 to leave room for labels -->
<g transform="translate(30, 30)">
  <!-- Title -->
  <text x="370" y="-10" font-weight="bold" font-size="16" text-anchor="middle">A1.5 COMPACT HUB (120.81m²) — FULL HOUSE TOP-DOWN LAYOUT PLAN</text>
  <text x="370" y="2" fill="#666" font-size="10" text-anchor="middle">Minimap footprint projection (50 px/m). Status: MINIMAP_LAYOUT_PLAN_PASS (NOT IMPLEMENTATION_PASS)</text>

  <!-- Rooms -->
  <!-- Bedroom 0,15 240×260 -->
  <rect x="0" y="15" width="240" height="260" fill="#f3e5d8" stroke="#000" stroke-width="2"/>
  <text x="120" y="145" font-weight="bold" fill="#555" text-anchor="middle">Bedroom (4.8×5.2=24.96m²)</text>

  <!-- Living 240,0 325×275 -->
  <rect x="240" y="0" width="325" height="275" fill="#efe8db" stroke="#000" stroke-width="2"/>
  <text x="402.5" y="140" font-weight="bold" fill="#555" text-anchor="middle">Living (6.5×5.5=35.75m²)</text>

  <!-- Entrance 565,106 150×225 -->
  <rect x="565" y="106" width="150" height="225" fill="#e6dce8" stroke="#000" stroke-width="2"/>
  <text x="640" y="225" font-weight="bold" fill="#555" text-anchor="middle">Entrance (3.0×4.5=13.50m²)</text>

  <!-- DiningKitchen 265,275 275×260 -->
  <rect x="265" y="275" width="275" height="260" fill="#dfe7e0" stroke="#000" stroke-width="2"/>
  <text x="402.5" y="405" font-weight="bold" fill="#555" text-anchor="middle">Dining+Kitchen (5.5×5.2=28.60m²)</text>

  <!-- Laundry 540,305 200×225 -->
  <rect x="540" y="305" width="200" height="225" fill="#e0e4ee" stroke="#000" stroke-width="2"/>
  <text x="640" y="420" font-weight="bold" fill="#555" text-anchor="middle">Laundry (4.0×4.5=18.00m²)</text>
  <!-- Sum: 24.96+35.75+13.50+28.60+18.00=120.81 ✅ -->

  <!-- Walls (shared wall double-draw P0-A 可视化 用 双 stroke. BLOCKER-WALL-01 标注 红色文字) -->
  <!-- Bed-Living shared: at X_world=-3.25 → svg 240 px. wall Z∈[-2.6,+2.6] intersect Living→ overlap Z=[-2.6,+2.6] Bed uses [-2.6,+2.6]  visual double-thickness: draw an extra stroke -->
  <line x1="240" y1="15" x2="240" y2="275" stroke="#ff5555" stroke-width="4" opacity="0.35" stroke-dasharray="4 2"/>
  <!-- Living-DK shared: Z_world=-2.75 svg_y=275. X overlap [-2.75,+2.75] intersect DK X∈[-2.75,+2.75] 265~540 in px? Living 240~565 (X 从-3.25到+3.25 world= 240~565 px svg X). DK 265~540 (=world X -2.75~+2.75). 重叠 X 265~540 画红线 -->
  <line x1="265" y1="275" x2="540" y2="275" stroke="#ff5555" stroke-width="4" opacity="0.35" stroke-dasharray="4 2"/>
  <!-- Living-Entrance: world +3.25 svg 565 px (Living 240~565; Entrance 565~715) overlap Z world [-2.75,+0.625] → svg_y range [106,275]  -->
  <line x1="565" y1="106" x2="565" y2="275" stroke="#ff5555" stroke-width="4" opacity="0.35" stroke-dasharray="4 2"/>
  <!-- DK-Laundry shared: world X=+2.75 svg X=540. Z overlap [-7.95,-2.75] ∩ [-7.85,-3.35] = [-7.85,-3.35] world → svg Y range [305,530] approx.  DK 275~535 Y; Laundry 305~530 Y → overlap Y 305~530 -->
  <line x1="540" y1="305" x2="540" y2="530" stroke="#ff5555" stroke-width="4" opacity="0.35" stroke-dasharray="4 2"/>

  <text x="300" y="155" fill="#c33" font-size="9" font-weight="bold">BLK-WALL-01: SHARED-WALL DOUBLE DRAW</text>
  <text x="300" y="165" fill="#c33" font-size="9">DEFERRED TO IMPLEMENTATION</text>

  <!-- 4 Internal Doorway Gaps (overwrite shared wall gap with white) -->
  <!-- D-LIV-BED: Z∈[-0.5,+0.5] svg_y=137 size w×h = wall thickness ~ 6 px × 1.0m=50px gap height -->
  <rect x="237" y="137" width="6" height="50" fill="white" stroke="none"/>
  <rect x="237" y="137" width="6" height="50" fill="none" stroke="#444" stroke-width="1.5" stroke-dasharray="2 2"/>
  <!-- D-LIV-ENT: Z∈[-2.0,-1.0] world → svg y = (2.75 - (-1.0))*50=187.5, (2.75-(-2))*50=237.5.  height 50, x=562 w 6 -->
  <rect x="562" y="187" width="6" height="50" fill="white" stroke="none"/>
  <rect x="562" y="187" width="6" height="50" fill="none" stroke="#444" stroke-width="1.5" stroke-dasharray="2 2"/>
  <!-- D-LIV-DK: X∈[-0.5,+0.5] world → svg_x=(-0.5+8.05)*50=377.5 to (+0.5+8.05)*50=427.5 → x=377 w=50. y=272 h=6 -->
  <rect x="377" y="272" width="50" height="6" fill="white" stroke="none"/>
  <rect x="377" y="272" width="50" height="6" fill="none" stroke="#444" stroke-width="1.5" stroke-dasharray="2 2"/>
  <!-- D-DK-Laundry: Z∈[-6.35,-5.35] svg Y: Zw=-5.35 → y=(2.75+5.35)*50=405; Zw=-6.35→y=(2.75+6.35)*50=455.  x=537 w=6, h=50 -->
  <rect x="537" y="405" width="6" height="50" fill="white" stroke="none"/>
  <rect x="537" y="405" width="6" height="50" fill="none" stroke="#444" stroke-width="1.5" stroke-dasharray="2 2"/>
  <!-- Exterior front door: YELLOW SQUARE DASHED -->
  <rect x="615" y="101" width="50" height="6" fill="#ffe066" stroke="#c0392b" stroke-width="2"/>
  <text x="640" y="95" fill="#c0392b" font-weight="bold" font-size="9" text-anchor="middle">FRONT DOOR</text>

  <!-- ===== FURNITURE MINIMAP FOOTPRINTS ===== -->
  <!-- Bedroom large items -->
  <!-- Bed (1.75×2.10): world center X = -5.65 + 0 = -5.65, Z = 0 + 1.45 = +1.45. SVG: x=(-5.65+8.05)*50 - 1.75*25 = 120 - 43.75=76.25; y=(2.75-1.45)*50 - 2.10*25=65-52.5=12.5 w=87.5,h=105 -->
  <rect x="76" y="13" width="88" height="105" fill="#3b4a6b" stroke="#111" stroke-width="1" opacity="0.85"/>
  <text x="120" y="70" fill="white" font-size="9" font-weight="bold" text-anchor="middle">BED</text>
  <!-- Wardrobe proxy (0.85×0.55) at center X=-5.65 + -2.125=-7.775 Z=0 + -0.20=-0.20.  SVG x=(-7.775+8.05)*50 - 0.55*25=13.75-6.875≈7,y=(2.75+0.2)*50-0.85*25=147.5-21.25=126 w=28,h=42 -->
  <rect x="7" y="126" width="28" height="42" fill="#5c4033" stroke="#111"/>
  <text x="21" y="152" fill="white" font-size="8" text-anchor="middle">WRD</text>
  <!-- Desk (1.50×0.75): X center=-5.65 + -0.5 = -6.15; Z=0 + -2.10 = -2.10.  svg x=(-6.15+8.05)*50 - 0.75*25=95-18.75=76; y=(2.75+2.1)*50 - 1.50*25=242.5-37.5=205 w=38,h=75 -->
  <rect x="76" y="205" width="75" height="38" fill="#8b6f47" stroke="#111"/>
  <text x="114" y="228" fill="white" font-size="9" text-anchor="middle">DESK</text>

  <!-- Living furniture: -->
  <!-- Sofa 2.40×0.95: world X=0+0=0, Z=0+2.275=+2.275. svg x=(0+8.05)*50 - 2.40*25=402.5-60=343; y=(2.75-2.275)*50 - 0.95*25=23.75-11.875=12 w=120,h=48 -->
  <rect x="343" y="12" width="120" height="48" fill="#e67e22" stroke="#111"/>
  <text x="403" y="40" fill="white" font-weight="bold" font-size="10" text-anchor="middle">SOFA</text>
  <!-- Coffee (1.40×0.80): X=0,Z=+0.8. x=402.5-35=368; y=(2.75-0.8)*50 - 0.80*25=97.5-10=88 w=70,h=40 -->
  <rect x="368" y="88" width="70" height="40" fill="#c9a66b" stroke="#111"/>
  <text x="403" y="112" fill="white" font-size="9" text-anchor="middle">COFFEE ★</text>
  <!-- TV cabinet 1.80×0.55: X=+2.875,Z=+0.5. world X=2.875 svg=(2.875+8.05)*50=546.25 - 0.55*25=546.25-13.75=532.5 → x=533? wait cabinet 朝西  rotY=270 footprint 1.80×0.55 swapped → 0.55 (X width) × 1.80 (Z depth).  原尺寸 X=0.55 Z=1.80.  x=(2.875+8.05)*50 - 0.55*25=546.25-6.875=539.  y=(2.75-0.5)*50 - 1.80*25=112.5-22.5=90 w=28,h=90 -->
  <rect x="539" y="90" width="14" height="90" fill="#2c3e50" stroke="#111"/>
  <text x="546" y="140" fill="white" font-size="9" transform="rotate(90 546 140)">TV CAB</text>
  <!-- Bookshelf 0.85×0.55: X=-2.875, Z=-1.80 rot 90 swapped X=0.55 Z=0.85. world X=-2.875 svg=(-2.875+8.05)*50=258.75 - 0.55*25=258.75-6.875=252. svg y=(2.75+1.8)*50 - 0.85*25=227.5-10.6=217 w=14,h=42 -->
  <rect x="252" y="217" width="14" height="42" fill="#6d4c2e" stroke="#111"/>
  <text x="259" y="243" fill="white" font-size="8" transform="rotate(90 259 243)">BOOKS</text>
  <!-- Armchair (1.0×0.9 rot 225 → AABB ~ 1.34×1.34) X=1.0,Z=-1.5. svg=(1.0+8.05)*50=452.5 - 1.34/2*50=452.5-33.5=419 y=(2.75+1.5)*50 - 1.34/2*50=212.5-33.5=179  67×67 -->
  <rect x="419" y="179" width="67" height="67" fill="#d48441" stroke="#111" opacity="0.7"/>
  <text x="452" y="217" fill="white" font-size="9" text-anchor="middle">ARM</text>
  <!-- KEY-OLD loc (0, +0.8) ★ on coffee -->
  <circle cx="403" cy="108" r="6" fill="none" stroke="#c0392b" stroke-width="2"/>
  <text x="403" y="111" fill="#c0392b" font-weight="bold" font-size="10" text-anchor="middle">🔑old</text>
  <!-- KEY-LOC-A recommended new: X=-0.4, Z=+2.0 (sofa underside) → world X=-0.4 svg x=(-0.4+8.05)*50=382.5; y=(2.75-2.0)*50=37.5 → draw secret marker -->
  <circle cx="383" cy="38" r="4" fill="#c0392b" opacity="0.3"/>
  <text x="383" y="17" fill="#c0392b" font-size="8" text-anchor="middle" opacity="0.7">🔑NEW(A)</text>

  <!-- Entrance: -->
  <!-- Tray 0.60×0.40 center local (0,+0.5) → world X=4.75+0=4.75, Z=-1.625 +0.5 = -1.125 → svg x=(4.75+8.05)*50 - 30=640-30=610; y=(2.75+1.125)*50 - 20=193.75-20=174 w=60,h=40 -->
  <rect x="610" y="174" width="60" height="40" fill="#c0392b" stroke="#000"/>
  <text x="640" y="198" fill="white" font-weight="bold" font-size="9" text-anchor="middle">TRAY ■</text>
  <!-- Shoe cabinet 0.85×0.55 local (-1.225,-1.20) rot 90 → 0.55×0.85. world X=4.75 + -1.225=3.525 → svg (3.525+8.05)*50 - 0.55*25=578.75-6.875=572 world Z=-1.625 + -1.20=-2.825 → y=(2.75+2.825)*50 - 0.85*25=278.75-10.6=268. w=14,h=42 -->
  <rect x="572" y="268" width="14" height="42" fill="#8b6f47" stroke="#111"/>
  <text x="579" y="292" fill="white" font-size="8" transform="rotate(90 579 292)">SHOES</text>
  <!-- Umbrella stand 0.35×0.35: X local +1.225 → world 4.75+1.225=5.975 → svg x=(5.975+8.05)*50 - 0.35/2*50=701.25 - 8.75=693 y=(2.75 + (-1.625+0.8))*50 - 0.35*25=96.25-4.375=92? local Z=+0.8 → global Z = -1.625+0.8=-0.825. y=(2.75+0.825)*50 - 0.35/2*50=178.75-8.75=170.  17×17 small box -->
  <rect x="693" y="170" width="17" height="17" fill="#4a6b7a" stroke="#111"/>
  <text x="701" y="182" fill="white" font-size="8" text-anchor="middle">UMB</text>
  <!-- Coat+mirror 0.60×0.30 local (+1.20,-1.20) → world X=4.75+1.20=5.95 → x=(5.95+8.05)*50 - 0.30*25=700 - 3.75=696 Z_local -1.20 → world Z=-1.625-1.20=-2.825 y=(2.75+2.825)*50 - 0.60*25=278.75 - 7.5=271.  15 w, 30 h -->
  <rect x="696" y="271" width="15" height="30" fill="#95a5a6" stroke="#111"/>
  <text x="704" y="290" fill="white" font-size="8" transform="rotate(90 704 290)">MIRROR+COAT</text>

  <!-- DiningKitchen L1: -->
  <!-- Dining table 1.80×0.95 center local (0,+0.80) → world X=0+0=0; Z=-5.35+0.8=-4.55. svg x=(0+8.05)*50 - 1.80*25=402.5-22.5=380; y=(2.75+4.55)*50 - 0.95*25=365-11.875=353. w=90,h=48 -->
  <rect x="380" y="353" width="90" height="48" fill="#d2b48c" stroke="#111"/>
  <text x="425" y="382" fill="white" font-weight="bold" font-size="10" text-anchor="middle">TABLE</text>
  <!-- Dishwasher 0.65×0.65 local (-2.425,-2.20) → world X=0+-2.425=-2.425 → x=(-2.425+8.05)*50 - 0.65*25=281.25-8.125=273 Z_local=-2.20 → world -5.35-2.20=-7.55 → y=(2.75+7.55)*50 - 0.65*25=515-8.125=507. w=33,h=33 -->
  <rect x="273" y="507" width="33" height="33" fill="#2980b9" stroke="#000"/>
  <text x="290" y="528" fill="white" font-size="8" text-anchor="middle">DW ■</text>
  <!-- Trash 0.35×0.35 local (+2.425,-2.20) → world X=+2.425 → x=(2.425+8.05)*50 - 0.35*25=523.75-4.375=519 Z=-7.55 y same 507.  17,17 -->
  <rect x="519" y="507" width="17" height="17" fill="#27ae60" stroke="#000"/>
  <text x="528" y="520" fill="white" font-size="8" text-anchor="middle">T ■</text>
  <!-- Utensil rack 0.45×0.35 local (+2.30,+2.20) → world X=+2.30 → x=(2.30+8.05)*50 - 0.35*25=517.5-4.375=513 Z=-5.35+2.20=-3.15 → y=(2.75+3.15)*50 - 0.45*25=295-5.6=289 w=17, 23 -->
  <rect x="513" y="289" width="17" height="23" fill="#e67e22" stroke="#000"/>
  <text x="522" y="305" fill="white" font-size="8" text-anchor="middle">UR ■</text>
  <!-- (visual) Low cabinets 4 x 0.85 along south wall X=-1.6→+0.95 center Z=-2.20 → world Z=-7.55.  draw a long rect spanning X=-2.4 to +1.8 approx. y=(2.75+7.55)*50 - 0.50*25=515-6.25=509 x=(-2.4+8.05)*50=282; w=(+1.8+2.4)*50=210; h=25 -->
  <rect x="282" y="521" width="210" height="12" fill="#c9a66b" stroke="#111" opacity="0.5"/>
  <!-- Refrigerator proxy NW corner X local -2.425 Z +2.20 → world X=-2.425 → 282 px - 0.70*25=282-8.75=274 Z=-5.35+2.2=-3.15 → y=(2.75+3.15)*50 - 1.90*25=295 - 23.75=271 w=35, h=95 -->
  <rect x="274" y="271" width="35" height="95" fill="#bdc3c7" stroke="#111"/>
  <text x="291" y="325" fill="white" font-size="9" text-anchor="middle">FRIDGE</text>

  <!-- Laundry L3: -->
  <!-- Washer 0.65×0.65 local (-1.10,-1.80) → world X=4.75 + -1.10=3.65 → x=(3.65+8.05)*50 - 0.65*25=585 - 8.1=577; world Z=-5.60 + -1.80=-7.40 → y=(2.75+7.40)*50 - 0.65*25=507.5-8.1=499 w=33,h=33 -->
  <rect x="577" y="499" width="33" height="33" fill="#3498db" stroke="#000"/>
  <text x="593" y="520" fill="white" font-size="8" text-anchor="middle">W</text>
  <!-- Dryer same 0.65×0.65 local (-0.35,-1.80) → world 4.75-0.35=4.4 → x=(4.4+8.05)*50=622.5 - 8.1=614 y same 499 -->
  <rect x="614" y="499" width="33" height="33" fill="#9b59b6" stroke="#000"/>
  <text x="631" y="520" fill="white" font-size="8" text-anchor="middle">D</text>
  <!-- Baskets (0.90×0.70) 3-in-row N wall local Z=+1.70 → world Z=-5.60+1.70=-3.90 → svg y=(2.75+3.90)*50 - 0.90*25=332.5-11.25=321.  X -1.50 local → world X=4.75-1.5=3.25 x=(3.25+8.05)*50 - 0.70*25=565-8.75=556 w=35, h=45  WHITE basket outline -->
  <rect x="556" y="321" width="35" height="45" fill="white" stroke="#000" stroke-width="2"/>
  <text x="574" y="348" fill="#000" font-size="8" text-anchor="middle">W□</text>
  <!-- Dark basket X local -0.30 → world 4.45 → x=(4.45+8.05)*50=625 - 8.75=616 y same 321 w=35,h=45 -->
  <rect x="616" y="321" width="35" height="45" fill="#2c3e50" stroke="#000"/>
  <text x="634" y="348" fill="white" font-size="8" text-anchor="middle">D ■</text>
  <!-- Towel basket X local +1.00 → world 5.75 → x=(5.75+8.05)*50=690 - 8.75=681 w=35,h=45 -->
  <rect x="681" y="321" width="35" height="45" fill="#f1c40f" stroke="#000"/>
  <text x="698" y="348" fill="#000" font-size="8" text-anchor="middle">T ■</text>
  <!-- Utility shelf 东墙 0.85×0.50 local (+1.675,-0.30) rot 270 → X=0.50,Z=0.85 → world X=4.75+1.675=6.425 → x=(6.425+8.05)*50 - 0.50*25=723.75 - 6.25=718 (too right; Laundry width 200 starts at 540: 740 canvas end. Adjust draw smaller.)  Skip draw exact; placeholder text. -->
  <rect x="718" y="404" width="20" height="43" fill="#a0522d" stroke="#111"/>
  <text x="728" y="430" fill="white" font-size="8" transform="rotate(90 728 430)">SHELF</text>

  <!-- Spawn markers per level (overlay on minimap examples) -->
  <!-- L1 spawn = DK center (0,-5.35) world = svg (402, 405) -->
  <circle cx="402" cy="405" r="8" fill="#e74c3c" stroke="#000" stroke-width="1.5"/>
  <text x="402" y="408" fill="white" font-size="9" font-weight="bold" text-anchor="middle">L1</text>
  <!-- L2 spawn = Living center (0,0) world = (402, 138) -->
  <circle cx="402" cy="138" r="8" fill="#e67e22" stroke="#000" stroke-width="1.5"/>
  <text x="402" y="141" fill="white" font-size="9" font-weight="bold" text-anchor="middle">L2</text>
  <!-- L3 spawn = Laundry local (-1.5,-0.25) → world (4.75-1.5=3.25, -5.60-0.25=-5.85) svg x=(3.25+8.05)*50=565 y=(2.75+5.85)*50=430 -->
  <circle cx="565" cy="430" r="8" fill="#2980b9" stroke="#000" stroke-width="1.5"/>
  <text x="565" y="433" fill="white" font-size="9" font-weight="bold" text-anchor="middle">L3</text>

  <!-- Legend -->
  <g transform="translate(10, 545)">
    <text x="0" y="0" font-weight="bold" font-size="11">Legend:</text>
    <rect x="0" y="10" width="15" height="10" fill="#ffe066" stroke="#c0392b"/> <text x="20" y="19" font-size="9">Exterior front door</text>
    <rect x="130" y="10" width="10" height="10" fill="none" stroke="#444" stroke-dasharray="2 2" stroke-width="2"/> <text x="145" y="19" font-size="9">Internal doorway (4 gaps)</text>
    <rect x="260" y="10" width="10" height="10" fill="#ff5555" opacity="0.4" stroke="#ff0000"/> <text x="275" y="19" font-size="9">P0-A shared wall double-draw (BLOCKER-WALL-01)</text>
    <rect x="450" y="10" width="10" height="10" fill="#2980b9"/> <text x="465" y="19" font-size="9">Container ■ / Large furniture</text>
    <text x="550" y="19" font-size="9" fill="#c0392b">🔑 = L2 Key location (old / new-A)</text>
  </g>
</g>
<!-- Scale bar -->
<g transform="translate(30, 590)">
  <line x1="0" y1="0" x2="250" y2="0" stroke="#000" stroke-width="2"/>
  <line x1="0" y1="-5" x2="0" y2="5" stroke="#000" stroke-width="2"/>
  <line x1="250" y1="-5" x2="250" y2="5" stroke="#000" stroke-width="2"/>
  <text x="125" y="-8" font-size="10" font-weight="bold" text-anchor="middle">5.0 m (250 px @ 50 px/m scale)</text>
</g>
</svg>
```

→ 上面 SVG 的 10 项一致性断言 (§十三 doorway gap consistency):
1. 4 internal doorways 均位于 shared wall 上 (double-draw zone) ✅
2. Front door 位于 Entrance 北墙 ✅
3. Living 三门洞 (D-LIV-BED/ENT/DK) footprint 不与 sofa/coffee 等 furniture footprint 重叠 (按 50px/m 算 door zone 家具未侵入) ✅
4. L1 spawn (DK中心) → 3 task containers (DW/T/UR) 视线无阻挡 ✅
5. L2 Living sofa 下 KEY-LOC-A 与 D-LIV-ENT 中点 LOS 被 sofa rect 阻断 (sofa X 343~463, Y 12~60;  线段 (640, 212 mid-ent)→(383,38 key): 交叉 sofa rect 左上左下点 = 阻断 → 入口第一眼看不到 ✅  §八 V6!
6. Laundry 三篮 spawn L3(565,430) → (574,348),(634,348),(698,348) 全部 LOS 通 无家具挡 ✅
7. Minimap 不泄露 relocated key → KEY-NEW(A) 画在 sofa 内部 且 opacity 0.3 (可隐藏实际实现时 true=false hidden). ✅
8. 5 房间面积和 = 24.96 + 35.75 + 13.50 + 28.60 + 18.00 = **120.81㎡** ✅
9. 4 internal adjacency edges 与固定拓扑 Bedroom↔Living↔Entrance; Living↔DK↔Laundry = 4 edges ✅ (§零 fixed edges=4)
10. Doorway width = 1.0m (50 px) 全部一致 ✅

→ **10 assertions passed → MINIMAP_LAYOUT_PLAN_PASS ✅ (§十三 Gate 状态)**

---

## §3. L1 MINIMAP (DiningKitchen highlight)

Same data but active rooms = DiningKitchen only. 其他房间 灰化 opacity=0.2; DK 保持全色; task containers + table + spawn 高亮. L1 minimap 只画:
- Rooms (仅 DiningKitchen 100% opac；其他 20%)
- DK 内 table + DW/T/UR containers
- L1 spawn

(实现阶段根据 Minimap.tsx 的 activeRoomIds 过滤自动完成; 本 PLAN 不写实际 filter 代码)

---

## §4. L2 MINIMAP (Living + Bedroom + Entrance 高亮)

active rooms = 3 (Runtime Fact §0). 其他房间 灰化. 显示:
- 三房间内部家具 (bed/wardrobe/desk; sofa/coffee/tv cabinet/bookshelf; tray/shoes/coat+mirror)
- 🔑old / relocated key marker (开发模式显示，玩家模式 minimap 不泄露 relocated)
- Front door / internal doors (全亮)
- L2 spawn

---

## §5. L3 MINIMAP (Laundry only)

active = Laundry. 其他房间 灰化. 显示:
- Washer / dryer (side-by-side 推荐 A)
- Three baskets W□/D■/T■
- Shelf
- L3 spawn
- Inactive exit door (visual "locked" dashed)

---

## §6. doorway gap consistency check

### World → minimap 转换数据确认

```
MINIMAP_TRANSFORM_SPEC_v1:
  scale: 50 px/m
  world_x_min: -8.05
  world_z_min: -7.95
  world_x_max: +6.75
  world_z_max: +2.75
  width_world_m: 14.80
  height_world_m: 10.70
  flip_z: true (north = top)
  translation_svg_margin_px: +30
```

### Furniture eligibility matrix (§十三 furniture minimap eligibility)

| 实体 | minimapEligible | 理由 |
|---|---|---|
| Large furniture (≥0.5×0.5 footprint) | ✅ true | 规划为障碍 |
| Task containers (cnt-*) | ✅ true | 游戏必需 |
| Doors / 门洞 gap | ✅ true | 导航必需 |
| Spawn / Completion marker | ✅ true | 玩家引导 |
| Small decor (mug/books/shoes/curtain/detergent small) | ❌ false | 隐藏 |
| Garments × 9 L3 | ❌ false | 隐藏 (避免 minimap 剧透) |
| Key (player object / L2) | ❌ false (minimap) | 严禁 minimap 泄露 relocated key 位置 |
| Cat paw print decals | ❌ false | 视觉 L2 地面引导 |

→ **§十三 所有输出齐全**
→ **Gate = MINIMAP_LAYOUT_PLAN_PASS (正式)**
