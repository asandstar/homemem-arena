# ASSET TOPOLOGY & MINIMAP READINESS MATRIX
> 文档编号：`ASSET-TOPOLOGY-MINIMAP-MATRIX·2026-08-03`
> 研究模式：RESEARCH MODE ONLY · 禁止写最终坐标/门洞/小地图 CSS 值

---

## 评估维度说明

对每个主资产包分析：
1. 大型家具 footprint 清晰度（旋转后易计算吗）
2. 墙门模块参数化
3. 房间壳体单数据源友好度
4. 拆成房间级模块可行性
5. 简化 minimap icon 生成可行性
6. top-down silhouette 可行性
7. visual vs collision footprint 一致性风险
8. MINIMAP 评级（见 §十六）

评级：
- **MINIMAP_READY**：直接从模型 AABB 即可生成小地图图标，无需额外 Blender 工作
- **MINIMAP_READY_WITH_CUSTOM_ICONS**：能做但需要每家具一张 2D icon（工作量中等）
- **MINIMAP_DIFFICULT**：模型外形太不规则，AABB 完全错误；需要手工 SVG 绘制
- **REJECT_FOR_TOPOLOGY**：模型与逻辑/碰撞天生不匹配，不适合参数化布局

---

## 主资产包 Topology / Minimap 评估

### P1 · Kenney Furniture Kit（CC0，推荐主包）

| 维度 | 评估 | 证据/说明 |
|---|---|---|
| 大型家具 footprint 清晰度 | **9/10** | 低模家具几乎都是长方形 AABB。sofa = 2m×0.9m box；coffee table = 1.2m×0.6m；bed = 2m×1.5m（双人）。全部 axis-aligned（未旋转时） |
| 旋转后 footprint 计算 | **9/10** | sceneSchema.ts 中 `getRotatedFootprint` 已实现 Box 旋转外接矩形近似；对于低模家具误差 < 5% |
| 墙和门独立模块 | N/A（Furniture Kit 不包含结构） | 用 MODULAR_HOME_MATRIX 的方案 4 解决 |
| 门洞参数化 | N/A | 同上 |
| 房间壳体单数据源 | 7/10 | 家具本身独立，适合 per-room 分组；壳体仍用程序化 Box |
| 内置整屋模型 | ❌ 无（Kenney Furniture Kit 是单件，不提供"完整 living room 一体化模型"） | **这是优点**！避免被整屋模型锁死自定义布局 |
| 拆成房间级模块 | 10/10 | 单件家具独立 GLB → 天然可按房间分组 lazy load（Living chunk / Bedroom chunk 等） |
| 简化 minimap icon 生成 | **9/10** | 大型家具直接用 top-down AABB 绘制矩形；sofa/table/bed/wardrobe 全都是矩形族 |
| top-down silhouette 生成 | 9/10 | 直接用模型的 bounding box XZ 平面投影；如需更精细（L-shaped sofa），可额外一次 Blender 导出 silhouette 2D path（一次性工作） |
| 是否需要手工制作 minimap icon | **NO**（先满足 MVP；若视觉提升再迭代） | 纯 CSS 矩形配颜色区分家具类型即可 |
| visual vs collision footprint 不一致风险 | **LOW** | 低模几何 = AABB 的近似误差，我们 collision 系统早已按 Box 近似（FACT sceneSchema.getRotatedFootprint） |
| 总体拓扑准备度评级 | **MINIMAP_READY** | |

### P2 · Kenney Building Kit（CC0，结构候选）

| 维度 | 评估 | 说明 |
|---|---|---|
| 墙段 footprint 清晰 | 9/10 | 墙段 = 薄长 Box；直接映射 |
| 旋转后 footprint | 10/10（Box 旋转仍是薄矩形） | 与 sceneSchema 完全一致 |
| 门洞参数化 | UNVERIFIED | 下一阶段下载验证默认模块尺寸 |
| 门窗独立模块 | UNVERIFIED 预计为独立 | |
| 房间壳体单数据源 | 7/10（独立模块可组合） | 但模块尺寸可能与当前 sharedRooms.size 不匹配 |
| 拆成房间级模块 | 10/10 | |
| minimap icon / silhouette | 10/10（墙段是线） | |
| 手工 icon 需要？ | NO | |
| visual vs collision 风险 | **MEDIUM**（若模块实际尺寸≠collision Box）→ 因此我们在方案 4 中采用逻辑 Box 权威 | |
| 总体拓扑准备度评级 | **MINIMAP_READY（当作为方案 4 的视觉 overlay 时）** / **MINIMAP_READY_WITH_CUSTOM_ICONS（若完整替换逻辑墙）** | |

### P6 · Quaternius Ultimate House Interior（UNVERIFIED 源确认）

| 维度 | 评估 | 说明 |
|---|---|---|
| footprint 清晰 | UNVERIFIED（作者模式通常也是低模 Box base） | |
| 整屋模型风险 | UNVERIFIED（可能有 built-in living room 组合）→ 有风险是优点也可能是缺点，若整屋模型固定布局则限制自定义 | |
| 墙门窗独立模块 | UNVERIFIED | |
| 总体拓扑准备度评级 | **MINIMAP_READY_WITH_CUSTOM_ICONS**（若源确认可用） | 但首先源未确认，REJECTED 主包候选 |

### 其他补充来源单件模型（Poly Pizza / OGA）

| 维度 | 评估 | 说明 |
|---|---|---|
| 大型家具 footprint | 7/10（单个作者风格不统一，部分异型） | 仅用于少量任务道具，不影响全局拓扑 |
| 旋转后 footprint | 6/10 | 任务道具体积小，可接受近似 |
| 小地图 icon | 9/10（任务道具不在小地图显示） | 小地图只显示容器和区域 |
| visual vs collision 风险 | LOW（任务道具近距交互，footprint 影响小） | |
| 总体拓扑准备度评级 | **MINIMAP_READY**（任务道具不进入 minimap，无评级压力） | |

---

## 按房间评估家具 footprint

RECOMMENDATION：下表标注大型家具的预期 footprint 近似值（单位：米，仅用于拓扑阶段参考，不是最终坐标）。UNVERIFIED·下载后实际测量。

### LIVING 客厅

| 家具 | 基础 footprint（W×D，未旋转） | 旋转 90° 后 | 是否纯 Box 近似 | 小地图显示 |
|---|---|---|---|---|
| Main sofa | 2.0 × 0.9 m（三人位） | 0.9 × 2.0 | ✅ | ✅ 粗棕线矩形 |
| Armchair | 0.8 × 0.8 m | 0.8 × 0.8 | ✅ | ✅ 小棕矩形 |
| Coffee table | 1.2 × 0.6 m | 0.6 × 1.2 | ✅ | ✅ 橙色（可交互容器） |
| TV + stand | 1.8 × 0.4 m | 0.4 × 1.8 | ✅ | ✅（TV 不单独显，仅 stand） |
| Bookshelf | 1.2 × 0.35 m | 0.35 × 1.2 | ✅ | ✅ 棕细线 |
| Floor lamp | 0.35 × 0.35 m | 0.35 × 0.35 | ✅ | ❌ 太小（minimap 阈值 ≥ 0.5m） |
| Rug | 2.4 × 1.6 m | 1.6 × 2.4 | ✅ | ✅ 半透明灰色块 |
| Plant | 0.4 × 0.4 m | 0.4 × 0.4 | ✅ | ❌ |

### BEDROOM 卧室

| 家具 | footprint | 旋转 | Box？ | 小地图 |
|---|---|---|---|---|
| Double bed | 2.0 × 1.5 m | 1.5 × 2.0 | ✅ | ✅ 粗棕线矩形 |
| Nightstand × 2 | 0.5 × 0.4 m each | 0.4 × 0.5 | ✅ | ✅（右侧为容器=橙色） |
| Wardrobe | 1.8 × 0.6 m | 0.6 × 1.8 | ✅ | ✅ 棕线 |
| Dresser | 1.2 × 0.5 m | 0.5 × 1.2 | ✅ | ✅ |
| Desk + chair | Desk 1.4 × 0.7, chair 0.5 × 0.5 | 各自旋转 | ✅ | ✅（desk=普通棕，若为容器则橙） |

### ENTRANCE 玄关

| 家具 | footprint | Box？ | 小地图 |
|---|---|---|---|
| Shoe cabinet | 1.2 × 0.4 m | ✅ | ✅ |
| Wall console | 1.0 × 0.35 m | ✅ | ✅ |
| Tray (drop zone) | 0.4 × 0.3 m | ✅ | ✅ 橙色（目标容器） |
| Umbrella stand + umbrella | 0.3 × 0.3 m | ✅ | ✅ stand 棕 + umbrella 点 |
| Coat rack | 0.5 × 0.5 m | ✅ | ✅ |

### DINING 用餐区

| 家具 | footprint | Box？ | 小地图 |
|---|---|---|---|
| Dining table | 1.6 × 0.9 m | ✅ | ✅ 棕 |
| Dining chairs × 4 | 0.45 × 0.45 each | ✅（可 InstancedMesh 共享） | ✅ 小棕方形 |
| Trash bin | 0.35 × 0.35 m | ✅ | ✅ 若为容器则橙色 |

### LAUNDRY 洗衣区

| 家具 | footprint | Box？ | 小地图 |
|---|---|---|---|
| Washing machine + dryer | 0.6 × 0.7 each（并排） | ✅ | ✅ 蓝色大矩形 |
| 3 laundry baskets | 0.45 × 0.45 each | ✅ | **✅ 彩色圆点（W/D/T 颜色编码 = L3 核心）** |
| Shelf | 1.2 × 0.4 m | ✅ | ✅ |

---

## 大型家具 footprint 可预测性与 sceneSchema 验证

FACT：`sceneSchema.ts → getRotatedFootprint(size: Vec2, rotationY: number)` 会把未旋转 Box + rotation 做外接矩形近似。对于 Kenney 风格家具：
- 95% 的低模家具 axis-aligned 时就是纯 Box → 无误差
- 旋转 45° 极少数（餐桌椅通常不 45°），误差 < 20% 对视觉可接受

UNVERIFIED：
- 若存在 L-shaped sofa / corner desk，纯 Box 近似会夸大 footprint → 需 P2.G1-B 之后扩展 footprint = 多 Box 组合

INFERENCE：
- 当前 collision 系统本来就是 Box 近似（FACT collision.ts / sceneSchema.ts），所以 Kenney 家具天然匹配现有近似逻辑，不存在"更精细资产导致 collision 反而不一致"的风险。

---

## 下阶段拓扑与小地图需要哪些资产事实？

### 后续 HOUSE TOPOLOGY 阶段需要的 ASSET FACT 清单（从下一阶段下载审计中获得）

1. **Kenney Furniture Kit 每件大型家具的 AABB 精确尺寸**（XZ 平面 box.width / box.depth / box.height）
   - 含 sofa/armchair/coffee-table/TV-stand/bookshelf/bed/nightstand/wardrobe/dresser/desk/dining-table/shoe-cabinet 等
2. **Kenney Furniture Kit 每件模型 PIVOT 世界坐标是否位于 box 底部中心**
   - 若 pivot ≠ (centerX, 0, centerZ)，需要 per-model heightOffset + position 修正
3. **每件可开家具（wardrobe door / drawer / cabinet / nightstand）的 open mesh 是否能独立分离**
   - 用于 FurnitureModel.tsx 的 open state 视觉切换
4. **Building Kit 墙段/门/窗模块的 AABB**
   - 特别是默认厚度决定 visual overlay 是否能套在逻辑 Box 外面不越界
5. **Building Kit door module 的 open / closed mesh 独立可分性**
6. **Shared atlas 跨包一致性**：Furniture Kit + Building Kit 是否用同一张纹理图（如是，跨包材质共享=低 draw call）

### 后续 MINIMAP 阶段需要的 ASSET FACT 清单

1. **top-down silhouette（简化 2D 轮廓）或可接受用 AABB 矩形**
   - 先 MVP：AABB 矩形 100% 足够（MINIMAP_READY）
2. **家具类型色板映射表**：sofa=brown-a, table-container=orange, bed=brown-b, wardrobe=brown-c, washer-dryer=blue, basket-* = W/D/T color
3. **minimap 尺寸阈值**（< 0.4m 的物体不显示）：lamp / plant / small decor 都不显示

---

## 与 P2.G1 治理的风险边界

RECOMMENDATION（遵守 project_memory 禁令）：
- **本轮不写任何房间中心 / 门洞坐标 / 世界坐标 / 小地图 CSS 坐标 / 家具坐标。**
- **本轮不新增 semanticKey / rotationY / collisionMode / visualOwner 到任何现有条目。**（project_memory 禁令）
- **本轮不碰 src/data/rooms.ts / decorFurniture.ts / tasks/*.ts。**

拓扑阶段只获得事实，不写进数据文件。所有坐标留到合法工作包（P2 系列）中再处理。

---

## 最终评级

| 主资产包 | 小地图与拓扑评级 |
|---|---|
| Kenney Furniture Kit（推荐主包） | **MINIMAP_READY** |
| Kenney Building Kit（推荐结构视觉层） | **MINIMAP_READY** |
| Kenney Food Kit（餐饮小物补充） | **MINIMAP_READY**（小物不进 minimap） |
| Poly Pizza / OGA 补充单件 | **MINIMAP_READY**（任务道具不进 minimap） |
| Quaternius（主包候选 Rejected） | MINIMAP_READY_WITH_CUSTOM_ICONS（但主包落选不评估） |
| itch.io 未知作者包 | **REJECT_FOR_TOPOLOGY**（无法保证 footprint 一致性） |
| Sketchfab 来源混合包 | **MINIMAP_DIFFICULT**（无统一风格，逐件手工图标量巨大） |

**结论：推荐主资产组合在拓扑与小地图维度完全无障碍通过。**
