# ASSET TECHNICAL COMPATIBILITY MATRIX
> 文档编号：`ASSET-TECH-COMPAT·2026-08-03`
> 研究模式：RESEARCH MODE ONLY

每行区分 **FACT / INFERENCE / RECOMMENDATION / UNVERIFIED**：
- **FACT**：直接来自源码（ModelAsset.tsx / ModelRegistry.ts / FallbackModels.tsx 等）的可验证事实
- **INFERENCE**：基于源码逻辑的合理推演
- **RECOMMENDATION**：本研究给出的建议
- **UNVERIFIED**：需下一阶段下载资产包后验证

---

## 一、Loader 能力事实（来自 ModelAsset.tsx · FACT）

| 能力 | 状态 | 源码证据位置 |
|---|---|---|
| GLB（binary glTF）加载 | **FACT·SUPPORTED** | 使用 `useGLTF(path)`（@react-three/drei 的 GLTFLoader 封装）；GLTF 标准天然包含 GLB |
| 外部 .bin 引用（分离式 glTF） | **FACT·SUPPORTED**（GLTFLoader 原生，但当前路径模型未测试） | GLTFLoader 默认行为；需下一阶段验证 path resolving 与 GitHub Pages basename 兼容性 |
| 外部纹理贴图（.png / .jpg） | **FACT·CURRENTLY STRIPPED** | ModelAsset.tsx 中：加载后遍历 material 并删除 map/normalMap 等引用，强制统一纯色 MeshStandardMaterial |
| Embedded 纹理 GLB | **FACT·TEXTURE IGNORED**（不报错但贴图被剥离） | 同上，所有纹理属性被清除 |
| Draco 压缩 | **UNVERIFIED** | 当前代码未显式注册 DracoDecoder；如果包内含 .drc 会加载失败。需要下一阶段验证 Kenney 资产是否使用 Draco |
| Meshopt 压缩 | **UNVERIFIED** | 未显式注册 MeshoptDecoder；Kenney 官方包通常不使用 Meshopt |
| KTX2 纹理 | **FACT·NOT SUPPORTED** | 当前 loader 管线未接入 KTX2Loader；Kenney 资产不使用 KTX2 |
| 保留原始材质 | **FACT·NO** | 材质被强制替换为 `new MeshStandardMaterial({ color, flatShading: true/false, metalness, roughness })` |
| 替换为 MeshStandardMaterial | **FACT·YES** | `_rebuildMaterials()` 函数重建所有材质 |
| 强制 flatShading | **FACT·SELECTIVE** | `materialType === 'wood' / 'fabric' / 'plastic' / 'paper'` → flatShading=true；`metal` / `ceramic` / `glass` → false |
| 覆盖颜色 | **FACT·YES** | 用 PALETTE 颜色或 per-model highlightColor 替换 diffuse |
| 删除纹理 | **FACT·YES** | `delete material.map; material.normalMap = null; material.roughnessMap = null;` 等 |
| clone loaded scene | **FACT·YES** | 加载后 `scene.clone()` 避免实例共享几何 |
| 共享 geometry（同模型多实例） | **FACT·YES · via CACHE** | MODEL_TEXTURE_CACHE（FIFO，50 entries）缓存 loaded GLTF；clone 时 geometry/material 引用共享（材质属性在 clone 后 per-instance 覆写） |
| 模型缓存大小 | **FACT·FIFO 50 entries** | `const MODEL_TEXTURE_CACHE = new Map(); ... cleanup LRU 50→30` |
| 失败重试 | **FACT·NO EXPLICIT RETRY**（React Suspense 会重试 re-render，但无指数退避） | 无 retry loop；出错后降级到 fallback component |
| 无限重试风险 | **INFERENCE·LOW** | Suspense fallback 组件一旦渲染不再触发 GLTF 加载；除非父级重挂载 |
| Fallback 行为 | **FACT·YES** | ModelRegistry 每模型配置 `fallback` 组件（FallbackModels.tsx 中程序化几何） |
| Suspense 行为 | **FACT·YES · wraps useGLTF in <Suspense fallback=null>** | 加载中不渲染；父级 ArenaPage/SuspenseBoundary 接管 loading skeleton |
| asset path / Pages basename | **UNVERIFIED FOR NEW ASSETS** | 当前路径 `/assets/models/...`；GitHub Pages deploy 在 subpath 时经 vite base 处理；下一阶段导入需保持路径约定 |
| raw.githubusercontent.com / CDN 风险 | **FACT·NO CURRENT USE** | 所有模型本地 public/models；禁止外部 CDN 引用 |
| Scene3D chunk 风险 | **FACT·MITIGATED**（G0 gate 已通过 3 回合稳定性） | 但大量新资产进入会增加 bundle/chunk 体积；需要懒加载 |

---

## 二、当前管线与 Kenney 资产兼容性预测

### Kenney Furniture Kit + Building Kit（FBX/OBJ 原始格式）

| 兼容性问题 | 严重度 | 说明 | 当前状态 | 推荐处理 |
|---|---|---|---|---|
| 格式：FBX / OBJ → GLB/glTF 转换 | **HIGH** | 当前 Loader 只接受 glTF 管线；Kenney 默认提供 FBX+OBJ+纹理图集 | **UNVERIFIED 是否已有 GLB** | RECOMMENDATION：下载后用 Blender / glTF-Transform 批量导出 GLB（embedded 纹理优先） |
| 纹理被剥离 → 视觉损失 | **MEDIUM** | 当前材质策略把所有纹理替换为纯色；Kenney atlas 色彩会丢失 → 低模感增强但细节丢失 | FACT·当前行为如此 | RECOMMENDATION：Living 试点先保持现有纯色策略；再评估是否为 Kenney 资产增加 `preserveAtlasTexture: true` 模式 |
| 共享纹理 atlas 被单颜色覆盖 → 多家具同色风险 | **HIGH** | 同一张 atlas 不同颜色区域被统一替换为 PALETTE.wood → 视觉单调 | INFERENCE | RECOMMENDATION：试点阶段可接受（低模+纯色是美学方向之一）；后续为大型家具（sofa/bedding）保留纹理或给 sub-mesh 不同颜色 |
| polygon 水平 → draw call 压力 | **LOW** | Kenney 风格天然低模（每件通常 100~3000 tris）；五房合计 tri count 预计 < 200k | INFERENCE | WebGL 可舒适承载 |
| material 数量 | **LOW-MEDIUM** | 当前重建后材质数 = 不同 materialType + color 组合数；预计 < 40 | INFERENCE | 可接受 |
| Pivot 位置 | **MEDIUM** | Kenney 很多模型 pivot 可能不在底部中心 → 放置到 surface 时浮空/埋地 | UNVERIFIED | RECOMMENDATION：Blender 批量修正 + ModelRegistry scale/heightOffset 双层补偿 |
| Scale 标准化（1 世界单位=1 米） | **HIGH** | Kenney 资产可能使用 cm 或无单位 → 默认导入后过大或过小 | UNVERIFIED | RECOMMENDATION：Blender 批量 scale + ModelRegistry 配置层 |
| 动画（开门/关抽屉） | **MEDIUM** | Building Kit 门含动画（FACT·Features=Animation）；当前 FurnitureModel.tsx 对可打开家具用 fallback 打开态而非真实播放 clip | FACT·当前无 clip 播放 | RECOMMENDATION：先不接动画；保持 FallbackOpenable 语义打开态；后续可加 GLTF animations 播放 |
| Draco / Meshopt | **LOW** | Kenney 默认不使用高级压缩（下载包为基础 FBX/OBJ）；我们转 GLB 时也不启用 | INFERENCE | 默认安全 |

### 总体兼容性评级

| 包 | 导入前转换成本 | 导入后材质适配 | Pivot/Scale 修复量 | 与当前 Fallback 系统协同 | 综合评级 |
|---|---|---|---|---|---|
| Kenney Furniture Kit | MEDIUM（转 GLB） | LOW（纯色策略天然兼容 low poly） | MEDIUM（批量修正） | HIGH（Fallback 兜底 + 注册扩展即可） | **A · 直接可用（一次性批处理转换）** |
| Kenney Building Kit | MEDIUM（转 GLB + 拆模块） | LOW | MEDIUM-HIGH（墙段尺寸对齐 doorway） | MEDIUM（墙段需程序化组装） | **B+ · 可用，但需额外结构拼接层** |
| Kenney Prototype Kit (walls) | LOW-MEDIUM | LOW | HIGH（墙厚/墙高需严格对齐当前程序化墙） | MEDIUM | **B · 与程序化墙体混用，替换视觉而非逻辑** |
| Kenney Food Kit | LOW-MEDIUM | LOW | LOW（小物体 scale 范围灵活） | HIGH | **A-** |
| Poly Pizza 单件 | LOW（原生 GLB） | LOW-MEDIUM（可能含 PBR 纹理被剥离） | LOW-MEDIUM | HIGH | **A · 小道具首选格式友好** |

---

## 三、材质策略与"怀旧家庭科幻"灯光交叉影响

| 材质策略 | 深蓝夜色光下表现 | 琥珀室内灯下表现 | 任务物体辨识度风险 | 推荐调整 |
|---|---|---|---|---|
| 当前：全纯色 MeshStandardMaterial（flatShading 按需） | 深色木沙发与深色墙易粘连（LOW CONTRAST） | 暖色灯下整体偏棕（UNIFORM BROWN） | 白色物体 + Bloom 可能过曝；深色物体消失 | RECOMMENDATION：关键家具（sofa/beds/TV stand）保留纹理或加大颜色差；任务物体 fallback 强制 emissive outline |
| 保留 Kenney atlas 纹理（非纯色） | 细节丰富但低模感下降；纹理在低照度下噪点 | 暖色 + 纹理 = 强烈生活感 | 纹理颜色可能干扰高亮色 | RECOMMENDATION：背景家具可选保留纹理，但用 AO 贴图增强轮廓；任务物体仍纯色 |
| 主家具统一 PALETTE 色阶（3 种 wood + 2 种 fabric + 1 metal + 1 陶瓷） | 色阶数有限 → 对比可控 | 暖色灯下不同色阶拉开层次 | 简单清晰、可预测 | **RECOMMENDATION：主推荐** |

---

## 四、Loader 与管线结论

### Loader 分级状态

| 维度 | 结论 |
|---|---|
| **DOWNLOAD_AUDIT_ALLOWED** | **YES** · 尺寸/存在性审计不需要 Loader 修复（离线 Blender 转换 + 目录检查即可） |
| **PRODUCTION_IMPORT_ALLOWED** | **YES WITH LIMITATIONS** · 限制条件如下 |

### 生产接入前需明确的限制项（RECOMMENDATION）

1. **格式前置转换**：所有 Kenney FBX/OBJ 必须在 import 前批量转为 **embedded-texture GLB**（避免 .bin + external PNG 在 Pages subpath 下解析错误）
2. **暂不接入外部纹理**：保持当前"剥离纹理→纯色"策略，避免 atlas 颜色在暗场景下把任务物体淹没在棕色里
3. **暂不播放 GLTF animation clips**：可打开家具（nightstand drawer / cabinet door / wardrobe door）继续使用 `FallbackOpenable` 程序化打开态，与当前 FurnitureModel 逻辑兼容
4. **Draco/Meshopt/KTX2 默认关闭**：转 GLB 时不启用，避免加载阶段爆错
5. **新增 ModelRegistry 字段**：
   - `preserveOriginalTexture?: boolean`（只给背景大沙发/床/窗帘启用，非任务物体）
   - `atlasColorHint?: number`（为纯色策略提供 per-model override）
6. **公共 assets/models 目录约定**：`/assets/models/kenney/furniture/`、`/assets/models/kenney/structural/` 等分作者子目录，不与现有 props/ 混用
7. **GitHub Pages basename 验证**：新 GLB 路径需通过 G0-like E2E 断言 5 URLs 不 404

### Loader Blocker 判定

| 问题 | 是否 BLOCK 下载审计 | 是否 BLOCK 生产接入 |
|---|---|---|
| 缺少 FBX→GLB 转换工具链 | NO | NO（Blender 免费可用） |
| 当前不保留纹理 | NO | NO（反而契合低模+纯色策略） |
| Draco 解码器未注册 | NO | NO（不启用 Draco 即可） |
| 外部 .bin / PNG resolving with basename | NO | NO（统一 embedded GLB 规避） |
| 无 Draco 不影响当前生产，因为我们生产导入不使用 Draco | — | — |

**最终 Loader 状态：LOADER_READY_WITH_LIMITATIONS**

---

## 五、性能预算对应技术指标（与资产筛选挂钩）

这些是筛选预算（§十七），对应到资产层面要检查的技术维度：

| 预算类别 | 筛选阈值 | 对应技术检查项 |
|---|---|---|
| 小道具 (key/phone/fork) | ≤ 300 KB / each | tri count ≤ 2000；material ≤ 2；无 4K 纹理 |
| 中小道具 (umbrella/tissue) | ≤ 500 KB / each | tri ≤ 4000 |
| 普通家具 (chair/table/lamp) | ≤ 800 KB / each | tri ≤ 10000；共享 atlas |
| 大型家具 (sofa/bed/wardrobe) | ≤ 1.5 MB / each；旗舰 ≤ 2 MB | tri ≤ 30000 |
| Living 全房新增 | ≤ 5 MB | total tri ≤ 100k；materials ≤ 20 |
| Bedroom 全房新增 | ≤ 3 MB | total tri ≤ 60k |
| Entrance 全房新增 | ≤ 2 MB | total tri ≤ 40k |
| Dining 全房新增 | ≤ 3 MB | total tri ≤ 50k |
| Laundry 全房新增 | ≤ 3 MB（任务道具 fallback 不计） | 背景家具 tri ≤ 40k |

### draw call 估算（INFERENCE）

- 当前程序化墙地板天花板：10~20 draw calls
- 替换 Kenney 模块化墙 + 家具：预计 100~200 draw calls（共享材质后）
- WebGL mid-tier 手机舒适阈值：约 300~500 draw calls
- **结论：INFERENCE·可行；需共享材质 + 合批实例化（如重复餐椅用 InstancedMesh）**

---

## 六、与当前 Scene3D / Room3D 协同（FACT）

| 系统 | 当前状态 | 与资产导入冲突点 | 建议 |
|---|---|---|---|
| Room3D 程序化墙体（BoxGeometry） | FACT·active | 若直接替换为 Kenney wall 段：collision / roomBounds / doorway 全部依赖程序化坐标，需双轨并行 | RECOMMENDATION：**逻辑墙保留程序化 Box**，视觉墙叠加 Kenney 模块（相同 footprint），初期避免重构 collision 管线 |
| Container3D 表面高度（getContainerSurfaceY） | FACT·依赖 ModelRegistry heightOffset + hardcoded fallback 尺寸 | Kenney 模型实际高度不同 → 放置浮空/埋地 | ModelRegistry.heightOffset 精调 + Blender 统一 scale 1m world |
| Object3D 交互距离（findNearestInteractableEntity） | FACT·基于 world position 中心距离 | 大尺寸家具中心离玩家远但边缘近 → 交互判定偏差 | 下一步 P2.G1 接入 semanticKey footprint 后统一治理；本期先接受近似 |
| collision.ts PLAYER_RADIUS + doorway width | FACT·纯逻辑常量 | 若视觉门变窄但逻辑 doorway 仍 1.6m：视觉不一致但不影响碰撞 | 视觉先对齐，逻辑随 P2.G1 后续治理 |
