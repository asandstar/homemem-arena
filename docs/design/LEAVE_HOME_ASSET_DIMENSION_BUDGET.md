# LEAVE_HOME 关键家具资产尺寸与预算规范

任务：task-leave-home（出门大作战）
阶段：P2.0 ASSET BUDGET（仅文档，0 源码修改，不下载模型）
日期：2026-08-02
基线约束：
  - 空间有效性契约 §SV7：不得把外部模型 mesh bounds 直接作为玩家碰撞真值
  - 碰撞系统：纯 XZ 圆-矩检测（src/game/collision.ts），不读 size.y，AABB 尺寸只取 x/z 平面
  - 所有家具尺寸单位：米（m），与 rooms.ts / decorFurniture.ts 保持一致
  - 本预算仅描述「语义定义」和「模型预算目标」，不承诺采购任何外部 GLB

============================================================
0. 预算原则
============================================================

0.1 三维度分层（视觉 / 碰撞分离 — SV7 合规）

每个家具语义分三层：
  1. DESIRED VISUAL DIMENSIONS：玩家**视觉感知**应达到的空间体量（从真实生活家具参考，含软包、装饰外沿）
  2. LOGICAL COLLISION DIMENSIONS：**玩家碰撞 AABB 真值**（取视觉内缩 + 四舍五入到 0.05m 网格，保证玩家不被视觉突出物卡死）
  3. FALLBACK DIMENSIONS：当前 FallbackModel / ModelRegistry 中占位模型**实际 visual 尺寸**（不强制改碰撞，但必须标注「视觉/碰撞差」）

0.2 GLB 预算（Web 性能基线，不下载模型时仅作未来采购上限）

| 预算等级 | 单 GLB 最大尺寸 | 三角形预算（tri）| 适用对象 |
|---|---|---|---|
| L（大型家具）| ≤ 2.0 MB | ≤ 15,000 tri | sofa / bed / entrance_console |
| M（中型家具）| ≤ 1.0 MB | ≤ 8,000 tri | coffee_table / nightstand |
| S（小型容器/道具）| ≤ 0.5 MB | ≤ 3,000 tri | entrance_tray / umbrella_stand / cat |

0.3 Pivot 约定
  - 家具 pivot = "底面几何中心"（x=中心, y=地面, z=中心），与 decorFurniture.position / ContainerSpec.position 的 room-local 中心对齐
  - 特殊：cat pivot = "四足支撑面中心（x=身体几何中心，y=脚掌底面，z=身体中心）" 以便放沙发表面

0.4 Orientation（模型默认朝向）
  - 所有家具默认朝向 = "背靠墙方向为 -Z"（即家具正面朝向 +Z，靠近房间中心），与 y-rotation=0 对齐
  - 特殊：umbrella_stand 无朝向要求，entrance_tray 无朝向要求

0.5 Fallback 要求（若 GLB 加载失败或尚未接入）
  - Fallback 尺寸 ≤ Logical Collision Dimensions × 1.05（不突破碰撞 AABB 的 5% 外扩，避免视觉/碰撞严重穿模）
  - Fallback modelId 必须在 ModelRegistry 中注册（见 src/components/arena3d/models/ModelRegistry.ts）
  - Fallback 颜色必须符合 L1/L2/L3 家具调色（中性暖色调）

============================================================
1. 家具语义表（8 项逐项预算）
============================================================

------------------------------------------------------------
1.1 sofa（客厅三人沙发 + L 型侧沙发）
------------------------------------------------------------

语义：
  - 主位（三人位）：客厅靠南墙，坐北朝南，猫可放表面
  - 侧位（L 翼）：主位西侧连接，西翼西朝东
  - 表面可放置任务视觉（猫站主沙发靠背上 / 坐垫上）

| 字段 | 主沙发（三人位）| 侧沙发（L 翼）|
|---|---|---|
| **Desired Visual Dimensions (x × y × z)** | 2.40 × 0.90 × 1.00 | 1.60 × 0.85 × 0.90 |
| 说明 | 三人位宽 2.4m（含扶手外沿），坐高 0.45m，靠背总高 0.90m，进深（前后）1.00m | L 型西翼，长 1.60m（沿 +Z 方向），坐高 0.42m，进深 0.90m（沿 +X 方向）|
| **Logical Collision Dimensions (x × y × z)** | 2.40 × 0.90 × 1.00 | 1.60 × 0.85 × 0.90 |
| 说明 | 碰撞取视觉满尺寸，因沙发靠墙，玩家无需进入靠背后方；碰撞 AABB 顶面 y=0.90，猫视觉底面 y=0.45 直接放坐垫 surface | 同上，西翼碰撞 1.60 × 0.90（旋转 y=π/2 后沿 Z 轴展开）|
| **Maximum GLB size** | ≤ 2.0 MB（等级 L）| ≤ 1.5 MB（等级 L）|
| **Triangle budget** | ≤ 15,000 tri（软包褶皱可略）| ≤ 12,000 tri |
| **Preferred Pivot** | 底面几何中心（x=0,y=0,z=0，坐深中心对齐房间中心）| 底面几何中心（与主位连接点对齐 0,0,0）|
| **Preferred Orientation** | 默认 y=0 → 正面 +Z（面向房间中心/茶几）| 默认 y=π/2 → 正面 +X（面向主沙发/茶几方向）|
| **Fallback Requirements** | ModelRegistry: "sofa" → Fallback 几何：3 个座垫长方体 + 2 扶手 + 靠背；Fallback 尺寸 2.4×0.9×1.0，误差 ≤ 5% | ModelRegistry: "sofa" 同一 modelId，group.rotation.y = Math.PI/2；Fallback 尺寸 1.6×0.85×0.9，误差 ≤ 5% |
| **SV7 合规检查** | 碰撞 = 逻辑尺寸（非 GLB mesh bounds）| 碰撞 = 逻辑尺寸（非 GLB mesh bounds）|

参考现实数据：宜家 KIVIK 三人沙发 228×95×83cm → 本蓝图放大 1.05 倍适配宽敞客厅 8×8m

------------------------------------------------------------
1.2 coffee_table（客厅唯一茶几真值 — cnt-coffee-table）
------------------------------------------------------------

语义：
  - 客厅任务唯一茶几（obj-key 初始位置 + 玩家保存钥匙记忆 E 位置）
  - 禁止 Room3D 出现第二份茶几语义视觉（含 CoffeeTableModel 画的任何边几）

| 字段 | 值 |
|---|---|
| **Desired Visual Dimensions (x × y × z)** | 1.40 × 0.45 × 0.70 |
| 说明 | 长方形茶几：长 1.40m（沿 X 东西方向），高 0.45m（桌面离地），深 0.70m（沿 Z 南北方向），4 条腿 |
| **Logical Collision Dimensions (x × y × z)** | 1.40 × 0.45 × 0.70（取视觉满尺寸）|
| 说明 | 碰撞 AABB 顶 y=0.45 = surfaceHeight，obj-key 放在 y=0.45 表面（ContainerSpec surfaceHeight = 0.45）|
| **Maximum GLB size** | ≤ 1.0 MB（等级 M）|
| **Triangle budget** | ≤ 8,000 tri |
| **Preferred Pivot** | 底面几何中心（桌面投影中心 x=0,y=0,z=0，与 ContainerSpec.position 中心对齐）|
| **Preferred Orientation** | 默认 y=0 → 长边东西，短边南北，与 cnt-coffee-table 当前 rot=0 对齐 |
| **Fallback Requirements** | ModelRegistry: "coffee_table" → Fallback 几何：长方形桌面 + 4 腿；尺寸严格 1.4×0.45×0.7；误差 ≤ 2%（TC 唯一真值，Fallback 必须与 ContainerSpec.size 一致）|
| **SV7 合规检查** | ContainerSpec.size = 1.4 × 0.45 × 0.7，碰撞 = ContainerSpec size（非 GLB bounds）|
| **重复视觉禁令** | Room3D.renderLiving 中任何 CoffeeTableModel 调用（无论大小/位置）均属「重复茶几语义」，必须删除或改为 "chair"/"shelf" 等非茶几 modelId |

参考现实：宜家 LISABO 茶几 140×70×45cm → 与蓝图 1:1

------------------------------------------------------------
1.3 bed（卧室大床，靠南墙/西南区域）
------------------------------------------------------------

语义：
  - 2.0m 宽双人床（X 东西方向）
  - 西南区域摆放；床两侧各有一个床头柜（西侧装饰用，东侧 = cnt-nightstand）
  - 玩家不允许穿床（必须完整碰撞）

| 字段 | 值 |
|---|---|
| **Desired Visual Dimensions (x × y × z)** | 2.00 × 1.00 × 2.40 |
| 说明 | 双人床：床架宽 2.00m（东西 X），床腿+床垫总高 1.00m（含软包床头 1.00m），长 2.40m（南北 Z，含床头 + 床尾）|
| **Logical Collision Dimensions (x × y × z)** | 2.00 × 1.00 × 2.40（床架满尺寸）|
| 说明 | 床头高度 = 总高 1.00m，床尾 0.50m，碰撞用顶面 max（不细切）；保证玩家 Z 方向不穿床，X 方向两端无卡死 |
| **Maximum GLB size** | ≤ 2.0 MB（等级 L）|
| **Triangle budget** | ≤ 15,000 tri（含床头软包、床垫纹理）|
| **Preferred Pivot** | 底面几何中心（床架投影 x=0, y=0（地面）, z=0（南北方向中心）与 decor-bed.position 对齐 |
| **Preferred Orientation** | 默认 y=0 → 床头朝 +Z（北），床尾朝 -Z（南），长边沿 Z |
| **Fallback Requirements** | ModelRegistry: "bed" → Fallback 几何：床板 + 床垫 + 床头板 + 2×枕；尺寸 2.0×1.0×2.4 误差 ≤ 5% |
| **SV7 合规检查** | decor-bed.size = 2.0 × 1.0 × 2.4 碰撞 = 逻辑值（非 mesh bounds）|

参考现实：宜家 HEMNES 双人床架 207×200cm → 近似 2.0×2.4（本蓝图加长加厚含床头）

------------------------------------------------------------
1.4 nightstand（右床头柜 = cnt-nightstand 唯一真值）
------------------------------------------------------------

语义：
  - 卧室东侧床头柜（床右侧，玩家视角站床尾向东看）
  - 唯一「任务容器抽屉」：obj-phone hiddenInContainer: cnt-nightstand
  - 西侧左床头柜为纯装饰（无任务容器、抽屉不可打开）

| 字段 | 右床头柜 cnt-nightstand（任务真值）| 左床头柜 decor-nightstand-left（纯装饰）|
|---|---|---|
| **Desired Visual Dimensions (x × y × z)** | 0.55 × 0.55 × 0.45 | 0.55 × 0.55 × 0.45（对称，相同）|
| 说明 | 标准床头柜：宽 0.55m（X 东西），总高 0.55m（桌面离地 0.55m，柜身 + 抽屉高），进深 0.45m（Z 南北）。正面至少 1 个抽屉视觉 | 同上 |
| **Logical Collision Dimensions (x × y × z)** | 0.55 × 0.55 × 0.45（ContainerSpec.size = 视觉满尺寸）| 0.55 × 0.55 × 0.45（纯装饰 DF 碰撞）|
| 说明 | TC 碰撞 AABB = ContainerSpec.size；surfaceHeight = 0.55（桌面高）| DF 碰撞同左 |
| **Maximum GLB size** | ≤ 1.0 MB（等级 M）| ≤ 0.5 MB（等级 S，可复用同一 GLB + y 镜像）|
| **Triangle budget** | ≤ 8,000 tri（抽屉把手、木纹细节 ≤ 2k tri）| ≤ 3,000 tri（纯装饰可减少）|
| **Preferred Pivot** | 底面几何中心（桌面投影中心 x=0,y=0,z=0 与 ContainerSpec.position 对齐 | 底面几何中心 |
| **Preferred Orientation** | 默认 y=0 → 正面朝 -X（西），抽屉朝向床方向（打开方向向床外侧）| 默认 y=π → 正面朝 +X（东），对称 |
| **Fallback Requirements** | ModelRegistry: "nightstand" → Fallback 几何：柜身 + 1 抽屉面板 + 1 把手；尺寸 0.55×0.55×0.45 误差 ≤ 3%（TC 唯一真值，偏差要小）| 复用同一 "nightstand" modelId + group.rotation.y=Math.PI；误差 ≤ 5% |
| **SV7 合规检查** | ContainerSpec.size = 0.55×0.55×0.45 = 逻辑尺寸，非 GLB 尺寸 | DF.size = 0.55×0.55×0.45 = 逻辑尺寸 |
| **手机抽屉说明** | obj-phone initialPosition 位于柜身前部 1/3 处（抽屉内），距前表面 ≥ 0.1m，不可视觉伸出 | 左柜无此需求 |

参考现实：宜家 BRIMNES 床头柜 40×41×53cm → 放大到 55×45×55（适配本蓝图 0.55m 高 surfaceHeight）

------------------------------------------------------------
1.5 entrance_console（玄关桌 — 由 decor-shoe-cabinet 承担语义）
------------------------------------------------------------

语义：
  - 玄关西侧靠墙鞋柜 = 玄关桌（entrance console），承担 cnt-entrance-tray 承托面角色
  - 视觉：鞋柜（多层收纳 + 门面 + 顶部平面）
  - 顶层平面 = 玄关托盘承托面（y=1.1m，托盘放其上方 0.05m，总 surfaceHeight=1.15）

| 字段 | 值 |
|---|---|
| **Desired Visual Dimensions (x × y × z)** | 1.20 × 1.10 × 0.40 |
| 说明 | 立式鞋柜：宽 1.20m（X 东西，沿西墙展开），总高 1.10m（含 2 层抽屉 + 鞋架 + 顶部平面），进深 0.40m（Z 南北，突出西墙）|
| **Logical Collision Dimensions (x × y × z)** | 1.20 × 1.10 × 0.40（DF decor-shoe-cabinet.size 满尺寸）|
| 说明 | 碰撞顶 y=1.10，即顶层台面；TC cnt-entrance-tray y.position = 1.10 + 0.05 = 1.15（贴台面）|
| **Maximum GLB size** | ≤ 2.0 MB（等级 L）|
| **Triangle budget** | ≤ 15,000 tri（柜面木纹 + 把手 + 分层细节）|
| **Preferred Pivot** | 底面几何中心（x=0,y=0,z=0 与 decor-shoe-cabinet.position = rl (-2.4,-0.5) 中心对齐 |
| **Preferred Orientation** | 默认 y=0 → 正面朝 +X（东，向房间中央开门），背板靠西墙 |
| **Fallback Requirements** | ModelRegistry: "cabinet"（鞋柜 Fallback 模型 ShoeCabinetModel → 已在 Room3D.renderEntrance 使用 → 尺寸 1.2×1.1×0.4，误差 ≤ 3% |
| **SV7 合规检查** | DF.size = 1.2×1.1×0.4 碰撞取逻辑值，非 GLB 尺寸 |
| **承托要求** | 顶部视觉平面 ≥ 0.8×0.4（cnt-entrance-tray 投影面积），承托区域不能有把手/装饰凸起超过 y=1.12 |

参考现实：宜家 HEMNES 鞋柜 107×101×22cm → 放大到 120×110×40（加深加厚适配空间）

------------------------------------------------------------
1.6 entrance_tray（玄关托盘 = cnt-entrance-tray 唯一真值）
------------------------------------------------------------

语义：
  - 唯一「目标区放置托盘」，用于：放手机、放雨伞、放钥匙（3 件任务物体最终位置）
  - 必须位于 entrance_console（鞋柜）顶层表面，视觉可辨
  - 禁止 Room3D.renderEntrance 再画第二份托盘（无论位置）

| 字段 | 值 |
|---|---|
| **Desired Visual Dimensions (x × y × z)** | 0.80 × 0.10 × 0.40 |
| 说明 | 长椭圆形/圆角长方形托盘：长 0.80m（X 东西），边缘总高 0.10m（含凸起边缘 0.05 + 底 0.05），深 0.40m（Z 南北）|
| **Logical Collision Dimensions (x × y × z)** | 0.80 × 0.10 × 0.40 → **但 Container3D 碰撞不阻止玩家上表面（碰撞只做 XZ 阻挡，玩家可进入 2.5m 交互圈）** |
| 说明 | ContainerSpec.size = 0.8×0.1×0.4；表面高 y=1.15（鞋柜顶 1.10 + 托盘底 0.05）。放置物体落位 y = 1.15 |
| **Maximum GLB size** | ≤ 0.5 MB（等级 S）|
| **Triangle budget** | ≤ 3,000 tri（托盘边缘光滑）|
| **Preferred Pivot** | 底面几何中心（x=0,y=0,z=0 与 ContainerSpec.position 中心对齐）|
| **Preferred Orientation** | 默认 y=0 → 长边沿 X（东西），与鞋柜长度方向一致 |
| **Fallback Requirements** | ModelRegistry: "entrance_tray"（Container3D 当前用 entrance_tray → Fallback 几何：长方体托盘；尺寸严格 0.8×0.1×0.4 误差 ≤ 2%（唯一真值，偏差要小）|
| **SV7 合规检查** | ContainerSpec.size = 0.8×0.1×0.4 碰撞 = 逻辑值，非 GLB 尺寸 |
| **重复视觉禁令** | Room3D.renderEntrance 中任何托盘视觉（含 EntranceTrayFallback 调用 + L80-93 装饰小物必须删除）违者 = SV2/SV4 无效数据 |

参考现实：宜家 SMÄLLSTEN 托盘 52×32cm → 放大到 80×40（适配 3 件物体同时摆放）

------------------------------------------------------------
1.7 umbrella_stand（伞架 = cnt-umbrella-stand 唯一真值）
------------------------------------------------------------

语义：
  - 玄关唯一伞架：位于玄关桌（鞋柜）靠 living 门一侧（南侧地面）
  - 承载 obj-umbrella 初始位置
  - 禁止 Room3D.renderEntrance 画任何装饰伞视觉（无论红伞/蓝伞/小伞，共 3 处全部删除）

| 字段 | 值 |
|---|---|
| **Desired Visual Dimensions (x × y × z)** | 0.30 × 0.80 × 0.30 |
| 说明 | 圆柱形/方柱形伞桶：直径/边长 0.30m，总高 0.80m（底部接水盘 0.05m + 桶身 0.75m）|
| **Logical Collision Dimensions (x × y × z)** | 0.30 × 0.80 × 0.30（ContainerSpec.size 满尺寸）|
| 说明 | 碰撞 AABB = ContainerSpec.size；surfaceHeight = 0.80（桶顶插入伞的位置，obj-umbrella 插入 y = 0.80 - 0.40 = 0.40（伞柄 0.4m 插入桶内）|
| **Maximum GLB size** | ≤ 0.5 MB（等级 S）|
| **Triangle budget** | ≤ 3,000 tri（圆柱桶面简化）|
| **Preferred Pivot** | 底面几何中心（x=0, y=0, z=0 与 ContainerSpec.position rl (-2.4, +0.3) 对齐 |
| **Preferred Orientation** | 无所谓（轴对称）|
| **Fallback Requirements** | ModelRegistry: "umbrella_stand"（当前 Container3D 可能用 "cabinet"，P2.3 切换到专属 Fallback；Fallback 几何：圆柱桶 + 底部接水盘；尺寸 0.3×0.8×0.3 误差 ≤ 5% |
| **SV7 合规检查** | ContainerSpec.size = 0.3×0.8×0.3 碰撞 = 逻辑值，非 GLB 尺寸 |
| **重复视觉禁令** | Room3D.renderEntrance 中所有 UmbrellaFallback 调用（鞋柜上小伞 2 处 + 地面大装饰伞 2 处）必须全部删除，违者 = 重复视觉 = 无效数据 |

参考现实：宜家 TJENA 伞架 32×50cm → 加高到 0.80m（长伞可立）

------------------------------------------------------------
1.8 cat（钥匙猫视觉，无碰撞，仅视觉）
------------------------------------------------------------

语义：
  - Living 主沙发表面视觉：坐/卧于沙发靠背上或坐垫上（位置由 Room3D 猫 group 控制）
  - 仅视觉，无碰撞（不进 decorFurniture，不参与玩家碰撞）
  - 触发 cat event 前后造型可能略有差异（看钥匙 vs 已扒拉过钥匙）

| 字段 | 值 |
|---|---|
| **Desired Visual Dimensions (x × y × z)** | 0.40 × 0.25 × 0.22（坐姿）/ 0.45 × 0.18 × 0.20（趴姿）|
| 说明 | 家猫体型：体长 0.40-0.45m（含头不含尾），坐姿总高 0.25m / 趴姿 0.18m，身宽 0.20-0.22m |
| **Logical Collision Dimensions (x × y × z)** | **无碰撞**（不参与 XZ 圆矩检测，不写入任何 DF，player 可穿过猫视觉）|
| 说明 | SV7：猫无碰撞真值，collision chain 中不出现；玩家穿过猫视觉属允许（为了找被猫扒拉的钥匙）|
| **Maximum GLB size** | ≤ 0.5 MB（等级 S）|
| **Triangle budget** | ≤ 3,000 tri（猫身体造型 + 面部分段优化）|
| **Preferred Pivot** | 四足支撑面几何中心（x=身体中心，y=脚掌底面（与沙发表面 y=0.45 对齐），z=身体中心）|
| **Preferred Orientation** | 默认 y=π（面向 -Z，即面向沙发前方/南墙/电视反方向）|
| **Fallback Requirements** | ModelRegistry: "cat" → 当前 Room3D.renderLiving 用手绘猫 group（CatFallback）→ Fallback 几何 = 椭圆身体 + 头 + 2 耳朵 + 4 腿；尺寸 0.4×0.25×0.22，误差 ≤ 10% |
| **SV7 合规检查** | 无碰撞 = 无 mesh bounds 误用风险 ✓ |
| **表面放置说明** | 猫 y.position = 沙发表面高 0.45（坐垫顶面）或 0.70（靠背顶面），需保证不穿沙发 visual（沙发 Fallback 顶部 y=0.90）|

参考现实：成年家猫体长 46cm，坐高 23cm → 近似蓝图尺寸

============================================================
2. 汇总对比表（跨家具快速索引）
============================================================

| 语义 | Desired Visual (x,y,z) | Logical Collision (x,y,z) | Max GLB | Max Tri | Pivot | Fallback ModelId |
|---|---|---|---|---|---|---|
| 1.1 sofa (3-seat) | 2.40 × 0.90 × 1.00 | 2.40 × 0.90 × 1.00 | 2.0 MB | 15k | 底中心 | sofa |
| 1.1 sofa (L-wing) | 1.60 × 0.85 × 0.90 | 1.60 × 0.85 × 0.90 | 1.5 MB | 12k | 底中心 | sofa (rot π/2) |
| 1.2 coffee_table | 1.40 × 0.45 × 0.70 | 1.40 × 0.45 × 0.70 | 1.0 MB | 8k | 底中心 | coffee_table |
| 1.3 bed | 2.00 × 1.00 × 2.40 | 2.00 × 1.00 × 2.40 | 2.0 MB | 15k | 底中心 | bed |
| 1.4 nightstand (R, TC) | 0.55 × 0.55 × 0.45 | 0.55 × 0.55 × 0.45 | 1.0 MB | 8k | 底中心 | nightstand |
| 1.4 nightstand (L, 装饰) | 0.55 × 0.55 × 0.45 | 0.55 × 0.55 × 0.45 | 0.5 MB | 3k | 底中心 | nightstand (rot π) |
| 1.5 entrance_console | 1.20 × 1.10 × 0.40 | 1.20 × 1.10 × 0.40 | 2.0 MB | 15k | 底中心 | cabinet |
| 1.6 entrance_tray | 0.80 × 0.10 × 0.40 | 0.80 × 0.10 × 0.40 | 0.5 MB | 3k | 底中心 | entrance_tray |
| 1.7 umbrella_stand | 0.30 × 0.80 × 0.30 | 0.30 × 0.80 × 0.30 | 0.5 MB | 3k | 底中心 | umbrella_stand |
| 1.8 cat | 0.40 × 0.25 × 0.22 | —（无碰撞）| 0.5 MB | 3k | 脚掌底中心 | cat |

============================================================
3. SV7 合规总检查（杜绝 mesh bounds 直接当碰撞）
============================================================

| # | 检查项 | 是否合规 | 备注 |
|---|---|---|---|
| SV7-A | 所有家具 collision source 明确写为 DF.size / TC.size（逻辑值）| ✓ | 本文档 1-8 项均指定 Logical Collision Dimensions = 源码 size 值 |
| SV7-B | 没有任何条目写「collision = GLB mesh bounds」或暗示从模型读取 | ✓ | 全文未出现 mesh bounds 作为碰撞源 |
| SV7-C | Fallback 尺寸 ≤ Logical Collision × 1.05（默认误差上限）| ✓ | 逐项 Fallback Requirements 要求误差 ≤ 2%-10% |
| SV7-D | 无碰撞语义（cat）明确写「无碰撞」不读 GLB | ✓ | 1.8 项写无碰撞 ✓ |
| SV7-E | 「唯一真值 TC」条目误差要求更严（≤ 3%）| ✓ | coffee_table / nightstand / entrance_tray / umbrella_stand 误差 ≤ 2-3% |

============================================================
4. 停止说明
============================================================

本预算文档到此结束。下阶段 P2.4 模型接入流程：
  1) 按本 8 项预算采购/生成 GLB（也可以先继续用 Fallback，P4 再换）
  2) ModelRegistry 中注册 modelId + Fallback
  3) 测试 Container3D / Room3D 加载成功后验证 SV7
  4) 验证：源码 size 值（逻辑）vs 模型实际 bounds（视觉）差 ≤ 5%

本轮不改源码、不下载模型、不修改任务逻辑、不 commit、不 push。
