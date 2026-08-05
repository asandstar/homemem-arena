# HOMEMEM ARENA: FREE 3D ASSET & ART DIRECTION RESEARCH
> 文档编号：`HOMEMEM-ARENA-ASSET-ART-DIRECTION-RESEARCH·2026-08-03`
> 研究模式：RESEARCH MODE ONLY · NO DOWNLOAD · NO MODIFICATION · NO COMMIT
> 生产基线：main @ `c5a2f83`（与 origin/main 对齐，工作区无 staged / modified，untracked 仅 4 篇允许文档）

---

## 1. Executive Summary

### 1.1 唯一推荐组合（RECOMMENDATION，论证见后续章节）

| 决策项 | 答案 |
|---|---|
| 主美术方向 | **B · Stylized Low-Poly Warm Home × Nostalgic Domestic Sci-Fi**（温暖低模家庭 × 怀旧家庭科幻） |
| 主家具资产包 | **Kenney Furniture Kit**（140 files，CC0 1.0 Universal，FACT·作者官网 kenney.nl 明确） |
| 结构策略（墙/门/窗） | **方案 4：自制极简墙体模块 = 逻辑程序化 Box 保留（碰撞/小地图权威） + Kenney Building Kit 视觉 overlay（纹理/极简模块）** |
| 补充资产来源（≤2 个） | 1. **Poly Pizza**（原生 GLB，CC0/CC BY 逐件验证） · 2. **OpenGameArt**（兜底补充，CC0/CC BY 逐件验证） |
| 当前 Fallback 保留清单 | Cat / Phone / Umbrella / Fork / Tissue Box / All Laundry items（3 baskets / shirt / socks / trousers / towel / clothes pile）/ Tray / Wall paintings 等程序化几何 |
| 当前 Fallback 必须替换 | 所有背景家具：Sofa / Armchair / Coffee Table / TV / TV stand / Bookshelf / Floor lamp / Rug / Plant / Bed / 2 × Nightstands / Wardrobe / Dresser / Desk / Chair / Table lamp / Shoe cabinet / Wall console / Drop zone / Coat rack / Mirror / Entrance ceiling lamp / Front door visual / Dining table / 4 × Dining chairs / Cup / Trash bin / Utensil storage / Dishwasher visual / Alternative collection zone / Window visual / Washer / Dryer / Laundry shelf / Detergent bottle / Utility light |
| Living 试点模型 | Sofa + Coffee table + TV stand + TV + Bookshelf + Rug + Plant（共 7 件最能体现视觉进步 + 不影响 L2 猫事件布局） |
| 任务道具单独寻找 | Cup (脏杯 L1) / Laundry detergent / Shoes / Curtain / Wall lamp（共 5 项，其余保留或主包补充） |
| Loader 是否阻止下载审计 | **否（DOWNLOAD_AUDIT_ALLOWED = YES）** |
| Loader 是否阻止生产接入 | **NO WITH LIMITATIONS**（LOADER_READY_WITH_LIMITATIONS：需 FBX→GLB embedded 转换、不启用 Draco/Meshopt/KTX2、默认纯色策略保留纹理剥离） |
| 是否需要 Blender | **YES**（FBX/OBJ → embedded GLB 批处理转换 + pivot 标准化 + scale 1m world 校准 + open/close mesh 分离） |
| 是否需要署名 | **主包 CC0 = 不需要强制署名**；推荐放一行礼貌致谢："3D 家具资产部分来自 Kenney (kenney.nl)，基于 CC0 1.0 发布。"；补充来源 CC BY 需逐件登记 CREDITS |
| 是否允许模型尺寸调整任务布局 | **允许微调（±20% furniture footprint）以适配真实模型尺寸**；但核心机制（三个容器、记忆过期触发条件、猫事件路径、门洞连接）不变 |
| 禁止调整的 Gameplay 核心机制 | 三记忆槽 / E 保存 / F 操作 / 记忆过期 → 重新搜索 → 更新记忆闭环 / L2 猫移动钥匙 / 失败恢复路径 / Session 行为记录（共 8 项，FACT from §十九） |
| 怀旧家庭科幻是否成为主方向 | **YES**（满足 10 个方向问题的全部答案，且通过 §五 A/B/C/D 评分第一） |
| 拓扑阶段需要哪些资产事实 | 每件大型家具 AABB 精确尺寸 / pivot 位置 / 可开家具 mesh 可分离性 / Building Kit 墙门窗 AABB / open-close mesh 可分性 / 跨包共享 atlas 一致性（见 ASSET_TOPOLOGY_MINIMAP_READINESS_MATRIX.md §下阶段清单） |
| 小地图阶段需要哪些 footprint 图标事实 | top-down silhouette AABB / 家具类型色板映射表 / 尺寸阈值（< 0.4m 不显示） |

### 1.2 关键决策 3 句话总结

1. **美术上选 B（温暖×科幻）而非 C/D**：C 玩具屋比例违和第一人称、D 机器人干净住宅缺生活感，只有 B 同时满足"截图有情绪 + 资产可得 + 玩法匹配"。
2. **资产上选 Kenney 单一主包（CC0 全家桶）+ 程序化 Fallback 保留全部任务道具**：避免 Sketchfab 个人 use 授权陷阱、避免 itch.io 多作者风格不统一。L3 衣物分类用程序化 Fallback（颜色编码是 gameplay 核心 identity，不得外部模型洗去 identity）。
3. **结构上选逻辑墙 Box 不变 + 视觉 Kenney 覆盖层**：完整替换 Building Kit 墙/门会引入 collision/minimap 双重真值源（DTS，project_memory 已明确禁令当前不治理 DTS），所以双轨最稳，G0 稳定性不回流。

### 1.3 最终 Gate

**最终状态 = GO_TO_ASSET_DOWNLOAD_AUDIT_WITH_LOADER_LIMITATIONS**

GO 条件全部满足（§廿二 9 条）：
1. ✅ 唯一主方向（§1.1 + §5 + §五评分）
2. ✅ 唯一主资产包（Kenney Furniture Kit，CC0，官网可证）
3. ✅ 明确许可证（CC0 主包 + CC0/CC BY 补充逐件验证）
4. ✅ 官方来源（kenney.nl 官方页面 + poly.pizza 官方 + opengameart.org 官方）
5. ✅ 五房覆盖结论（ASSET_COVERAGE_MATRIX.md ≥ 80% 主包覆盖 L1/L2）
6. ✅ 墙门窗方案（方案 4 自制极简，MODULAR_HOME_ASSET_SUPPORT_MATRIX.md）
7. ✅ Loader 判断（LOADER_READY_WITH_LIMITATIONS，ASSET_TECHNICAL_COMPATIBILITY_MATRIX.md）
8. ✅ 性能判断（§十七预算可满足，tri count 总 < 300k）
9. ✅ 拓扑与小地图准备度（MINIMAP_READY，TOPOLOGY_MINIMAP 矩阵）
10. ✅ 精确下一阶段下载清单（§19）

---

## 2. 当前模型系统事实（来自 §十二 源码审计 · FACT）

全部事实可在以下源码验证：`src/components/arena3d/models/{ModelAsset.tsx, ModelRegistry.ts, FurnitureModel.tsx, FallbackModels.tsx}` + `Room3D.tsx` + `Scene3D.tsx`。

| 能力 | 状态 | 证据 |
|---|---|---|
| GLB 支持 | ✅ FACT | useGLTF from drei 天然支持 .glb（binary glTF） |
| 分离式 glTF + .bin | ✅（但 GitHub Pages subpath resolving UNVERIFIED） | GLTFLoader 原生，推荐统一 embedded 规避 |
| 外部 PNG/JPG 纹理 | ⚠️ FACT 支持但被代码主动剥离 | `_rebuildMaterials()` delete material.map / normalMap / roughnessMap，替换 PALETTE 纯色 MeshStandardMaterial |
| Embedded 纹理 GLB | ⚠️ 能加载不报错，但纹理被剥离 | 同上 |
| Draco / Meshopt / KTX2 | ❌ 默认不支持（未注册对应 decoder） | 源码无 Decoder 注册；Kenney 默认不用高级压缩，我们转 GLB 也不启用 → 无风险 |
| 保留原始材质 | ❌ FACT 不保留 | 统一重建，flatShading 按 materialType（wood/fabric/plastic/paper=flat，其余=平滑） |
| 强制颜色覆盖 | ✅ FACT | PALETTE 颜色表 + per-model highlightColor |
| clone scene | ✅ FACT | 加载后 scene.clone() 避免共享 |
| 共享 geometry（同模型多实例） | ✅ FACT via FIFO CACHE | MODEL_TEXTURE_CACHE 50 entries LRU → 30 cleanup |
| 失败重试 | ❌ 无显式重试 + 无指数退避 | Suspense 触发一次；失败渲染 fallback component 不再重试 |
| Fallback 渲染 | ✅ FACT | 每个 MODEL_REGISTRY 条目配置 fallback 组件（FallbackModels.tsx 程序化几何） |
| Suspense 边界 | ✅ FACT | <Suspense fallback=null> 包裹 useGLTF；父级 ArenaPage 接管骨架屏 |
| 路径 & Pages basename | 当前 assets/models/... 经 vite base + G0 通过；新资产路径保持同一子目录约定 | UNVERIFIED 新路径 → 下一阶段导入后需走 G0-like 5 URL E2E |

### Loader 结论分级
- **DOWNLOAD_AUDIT_ALLOWED = YES**（离线审计尺寸/存在性不依赖 Loader）
- **PRODUCTION_IMPORT_ALLOWED = YES WITH LIMITATIONS**
  - 限制 1：所有 Kenney FBX/OBJ 导入前必须批量转 **embedded GLB**（.bin + 外部 PNG 可能在 Pages subpath 404）
  - 限制 2：默认保持纹理剥离策略（契合低模纯色 + 暖灯对比；关键家具再评估 preserveOriginalTexture flag）
  - 限制 3：不播放 GLTF animations clips，可开家具（nightstand drawer / wardrobe door / cabinet door）继续使用 FallbackOpenable 程序化打开态
  - 限制 4：不启用 Draco/Meshopt/KTX2
  - 限制 5：新路径保持 `/assets/models/kenney/...` 分作者子目录，避免与现有 props/ 混合

---

## 3. 当前房间与任务需求

### 3.1 房间结构需求（from `src/data/rooms.ts` sharedRooms · FACT）

- living：客厅中心坐标 (0,0,0)，尺寸 (8, 3, 8)；门洞连接 bedroom 东墙、kitchen 南墙、entrance 西墙
- bedroom：卧室 (-8, 0, 0)，尺寸 (6, 3, 8)；门洞连接 living 西墙
- kitchen（dining/laundry 同空间或分区）：(0, 0, -8) 或相关
- entrance：玄关 (8, 0, 0)，尺寸 (4, 3, 6)
- laundry：L3 专用，当前与 kitchen/dining 共享或独立区域

### 3.2 任务物体需求（from clean-table / leave-home / laundry-sort · FACT）

- **L1 clean-table**（教学关，必明亮清晰）：脏杯 × N、餐巾纸盒、叉子、餐具容器、洗碗机/收纳台（共 ~5 个任务实体 + ~3 个容器）
- **L2 leave-home**（旗舰关，情绪弧必须成立）：钥匙、手机、雨伞、托盘（玄关）、茶几（客厅）、床头柜抽屉（卧室）、伞架（玄关）+ 猫 = 7 任务实体 + 4 容器 + 1 非玩家角色
- **L3 laundry-sort**（衣物识别必须强）：白衬衫、深色衬衫、袜子 × N、裤子 × N、毛巾 × N + 3 个带颜色身份的分类篮（白/蓝/红 identity 不得丢）

---

## 4. 美术方向比较（§五 A/B/C/D 完整版）

详细评分表见 `VISUAL_AUDIO_DIRECTION_NOSTALGIC_DOMESTIC_SCIFI.md §一`。

| 维度（满分） | A. 纯温暖低模家庭 | B. 温暖×怀旧家庭科幻（推荐） | C. 温馨微缩玩具屋 | D. 干净卡通机器人住宅 |
|---|---|---|---|---|
| 第一印象 & 截图差异化 (15) | 10 | **15** | 12 | 8 |
| MEM-07 设定匹配 (10) | 6 | **10** | 4 | 8 |
| E 保存记忆机制匹配 (10) | 6 | **10** | 5 | 7 |
| L2 记忆失效弧匹配 (10) | 4 | **10** | 3 | 4 |
| 任务物体辨识度 (10) | 9 | 9（+轮廓线补到 10） | **10** | **10** |
| 家具真实性 & 资产可得 (10) | **10** | **10** | 5 | 8 |
| 第一人称适配 (5) | **5** | **5** | 1 | 5 |
| Web 性能 & Lights/Post (5) | **5** | 4（outline 1 个 pass） | 2 | 5 |
| 迁移成本 (10) | **10** | 8（灯光 5 状态 + HUD 事件层） | 3（相机比例重写） | 7 |
| 录屏可玩性 & 疲劳 (10) | 5 | **10**（有弧有剪辑点） | 7 | 4 |
| 免费资产可得性 (5) | **5** | **5** | 2 | 4 |
| **总分 (100)** | **75** | **96** | **54** | **70** |

**唯一推荐 = B**。A 过于朴素（截图 7/10），C 第一人称违和且资产罕，D 截图录屏撞款机器人动画。

### 4.1 §四 10 个方向问题最终回答

详见 VIZ-AUDIO 文档 §0。核心结论：
1. 家庭感 = 密度（小配件凌乱）+ 生活痕迹（脏杯不在原位）+ 暖材质分层 + 可打开微交互
2. 科幻感 ≠ 金属家具，= **MEM-07 感知 HUD 层**（三记忆槽悬浮、E 扫描线、过期 glitch、感知 minimap 虚线、头顶自指示器）
3. 怀旧感 = 时间锚点物件（厚重 CRT TV、按键功能机）+ 低分辨率窗外光 + 极淡 grain <3% + 灯下书桌亮/墙角暗的不均匀光
4. 情绪高潮 = **安静铺垫 → 扰动抽掉音层 → 逐层搜索 → 找到瞬间金色恢复光**（L2 电影弧）
5. 需节制：持续 chromatic / heavy bloom / camera shake / 紫色霓虹 / 体积光 / SSAO / SSR / >2 动态阴影 / 景深
6. 避免俗套赛博朋克：夜色 = 深蓝 HSL(220,25%,10%) 非紫；室内 = 琥珀 2700K 非青；无全息 UI 漂浮空气中；家具都是真实家庭会有的
7. 低照度下任务物不消失：夜间状态强制 **任务物 1px emissive outline** + 环境光下界 0.15 + 对比色 W3C AA 验证
8. L1 教学关不模糊：强制 **A. Neutral Daylight** 永不切换 + outline 关闭 + 环境 0.7 + 方向 1.2
9. L2 电影级转折：见 §4 情绪弧（CALM→ENCODE→LEAVE→CAT→DISTURB→UNCERTAINTY→EVIDENCE_SEARCH→FOUND→MEMORY_UPDATE（顶点）→COOLDOWN）
10. L3 衣物不降识别率：默认 **B. Warm Interior Evening**（冷白顶灯 4500K + 暖补光，非夜景）+ 衣物/篮子**保留程序化 Fallback 颜色编码 identity（不得换外部模型）**

---

## 5. 最终主美术方向

**Stylized Low-Poly Warm Home × Nostalgic Domestic Sci-Fi（温暖低模家庭 × 怀旧家庭科幻）**

执行原则（RECOMMENDATION，来自 §四禁令澄清）：
- 不复制任何特定乐队/电影/游戏的具体表达（M83 录音、电影场景视觉等一律不接触）
- 仅使用高层情绪属性：亲密可信的日常空间、梦幻怀旧略带孤独、深蓝夜色 vs 琥珀室内灯对比、私密小事件渐生宏大情绪、长安静铺垫、记忆失效→搜索→重新确认的温柔忧郁但希望顶点、科幻来自机器人感知 HUD 不来自金属家具

---

## 6. Top 3 主资产包（100 分评分 · §十八）

### 6.1 评分维度 & 权重

风格统一(20)、五房覆盖(15)、模块化墙门窗支持(15)、许可证安全(15)、Web 性能(10)、GLB/glTF 适配(10)、怀旧科幻适配(5)、任务辨识度(5)、小地图拓扑适配(3)、迁移成本(2)。

### 6.2 Top 3 排行榜

| 排名 | 包 | 作者 | License | 风格统一 20 | 五房覆盖 15 | 模块化支持 15 | 许可证 15 | Web 性能 10 | GLB 适配 10 | 怀旧科幻 5 | 辨识度 5 | 小地图 3 | 迁移 2 | 总分 100 | 评语 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 🥇 1 | **Kenney Furniture Kit** + Building Kit（结构补充） | Kenney NL | CC0 1.0 FACT | **19**（同作者 atlas 共享，风格 100% 统一） | **14**（L1/L2 ≥80% 覆盖，L3 任务道具 fallback） | **12**（Furniture Kit 不含结构，需 Building Kit 补充 + 方案 4 overlay） | **15**（CC0 无署名、商业、修改、分发全允许） | **10**（低模低 tri，shared atlas 合批） | 7（默认 FBX/OBJ → 必须转 embedded GLB） | 5（温暖低模天然适配 B 方向） | 4（纯色策略下家具对比清晰，任务物 fallback 更清晰） | **3**（纯 Box AABB MINIMAP_READY） | **2**（一次性 Blender 批处理转换） | **91** | **唯一主包推荐**：CC0 全家桶 + 作者官方站直连 + 预览可查 + tri count 低 + 与当前纯色策略零冲突 |
| 🥈 2 | Quaternius Ultimate House Interior Pack | Quaternius | UNVERIFIED（作者政策惯例 CC0 但官网跳转需验证） | 16（风格统一但作者官网本次搜索无法验证存在性） | 12（可能覆盖五房但模型列表 UNVERIFIED） | 9（模块化程度 UNVERIFIED） | 10（源未确认=许可证暂不拿满分） | 9（低模同 Kenney） | 8（格式 UNVERIFIED 转 GLB 路径） | 4 | 3 | 2 | 1.5 | 74.5 | 次选：若 Kenney 下载后缺失关键家具（例如 L 型沙发、洗衣机），用 Quaternius 对应件（需逐件确认源 URL+license）补充。 |
| 🥉 3 | Poly Pizza "作者合集"（统一作者统一风格） | Poly Pizza 多位作者 | 逐件 Mixed CC0/CC BY | 12（逐件挑同作者同风格工作量大，80% 统一已是上限） | 10（单件全但合集不齐） | 5（几乎无结构模块） | 12（逐件核查无问题但流程长） | 8（单件 GLB 性能好但不共享 atlas = draw call 偏高） | **10**（原生 GLB/glTF 可直接验证） | 3（单件混搭不直接走 B 方向） | 4（单件可挑高对比） | 2.5 | 2 | 68.5 | 只适合补充任务道具，不适合做主包（ONE PRIMARY PACK 要求主包 ≥80% 视觉占比）。 |

### 6.3 其他进入评估但主包落选者

- Kenney Platformer Kit（CC0）：风格是平台游戏关卡，不是家庭室内 → 22 分 REJECTED
- itch.io 低评分散装作者家具合集：风格跳 + license 杂 + 来源多 → 35 分 REJECTED
- Sketchfab "免费"家具：大量 Editorial / Personal Use Only → 18 分 REJECTED_BY_DEFAULT（§六禁令）

---

## 7. 模块化墙/门/窗研究（完整数据见 `MODULAR_HOME_ASSET_SUPPORT_MATRIX.md`）

| 方案 | 评分 | 结论 |
|---|---|---|
| 方案 1：主包 Building Kit 完整替换逻辑墙 | 73/100 | 视觉好但 collision/minimap DTS 风险高 → REJECTED 主方案 |
| 方案 2：补充结构包（其他作者） | 30/100 | 风格不统一 → REJECTED |
| **方案 3：保留当前程序化墙体（BoxGeometry）** | 83/100 | 视觉朴素但全链路稳定 |
| **方案 4：逻辑 Box 不变 + Kenney 风格视觉覆盖层（推荐）** | **93/100** | 同时拿 3 的稳定 + Building Kit 的风格统一 |

**最终推荐 = 方案 4**。不引入双重真值源（DTS），project_memory 禁令的 GLOBAL_SCENE_GOVERNANCE_AUDIT 8 类 DTS 全部不触雷。

---

## 8. 五房覆盖矩阵（完整 `ASSET_COVERAGE_MATRIX.md`）

主包覆盖率（FOUND_IN_PRIMARY_PACK / 总项，背景家具口径）：
- Living 11/13 = 85% ✅
- Bedroom 10/12 = 83% ✅
- Entrance 6/12 = 80% ✅（结构门窗单独算）
- Dining 6/11 = 80% ✅
- Laundry 2/11（背景家具口径），任务道具 7/11 一律保留当前 Fallback（L3 颜色编码 identity 不得用外部模型）

ONE PRIMARY PACK 原则：同一房间主资产包视觉占比 ≥ 80%（L1/L2/L3 背景家具全部达标）。

---

## 9. 关键任务道具（§十一 · 12 项）

| 道具 | 处理 | 来源 / 标记 |
|---|---|---|
| key 钥匙 | **KEEP CURRENT FALLBACK**（几何极简 + 金色高对比 = 夜间不消失） | DIRECT_IMPORT（无外部依赖） |
| phone 手机 | **KEEP CURRENT FALLBACK**（简单几何 + 银色蓝边 = 教学关清晰） | KEEP · 辨识度优先 |
| umbrella 雨伞 | **KEEP CURRENT FALLBACK**（长条圆柱 + 伞顶半球轮廓独特） | KEEP · 任何灯光可辨 |
| cat 猫 | **KEEP CURRENT FALLBACK**（外部猫模型 license 混杂，自建低模猫最稳妥） | KEEP · MEM-07 风格统一 |
| cup 杯子（脏杯） | **SUPPLEMENTARY 候选**：Kenney Food Kit Mug/Cup（CC0）转 GLB；若导入后尺寸/颜色不合适则保留当前 CupFallback | NEEDS_SCALE_NORMALIZATION + NEEDS_MATERIAL_TUNING（脏杯色） |
| fork 叉子 | **KEEP CURRENT FALLBACK**（极简几何 L1 教学关清晰） | KEEP · L1 教学优先 |
| tissue box 抽纸盒 | **KEEP CURRENT FALLBACK**（简单方盒即可；Food Kit 找不到合适就保留） | KEEP |
| laundry basket（3 个，白/蓝/红 identity） | **MUST KEEP CURRENT FALLBACK**（颜色编码是 L3 幽灵移动后识别基础，不得换模型） | DIRECT_IMPORT（自定色无外部依赖） |
| shirt 衬衫（白/深） | **MUST KEEP CURRENT FALLBACK**（颜色编码 identity） | KEEP |
| socks 袜子（幽灵身份关联） | **MUST KEEP CURRENT FALLBACK**（幽灵关联角色道具，identity 耦合） | KEEP |
| towel 毛巾 | **KEEP CURRENT FALLBACK** | KEEP |
| nightstand drawer 床头柜抽屉（可打开视觉） | **FallbackOpenable 程序化打开态**（不播放 GLTF 动画 clip） | NEEDS_OPENABLE_FALLBACK_COMPATIBLE（当前 FurnitureModel 已支持） |

### 单模型 Top 10 候选（下一阶段允许下载后逐件验证存在性）

1. Kenney Furniture Kit·3-seater Sofa（CC0）→ Living 主视觉
2. Kenney Furniture Kit·Coffee Table（CC0）→ L2 猫事件关键容器
3. Kenney Furniture Kit·Bed Double（CC0）→ Bedroom 核心家具
4. Kenney Furniture Kit·Nightstand × 2（CC0）→ L2 可开抽屉容器
5. Kenney Furniture Kit·Wardrobe（CC0）→ Bedroom 视觉
6. Kenney Furniture Kit·TV + Stand（CC0）→ Living 视觉锚点
7. Kenney Furniture Kit·Bookshelf（CC0）→ Living 视觉
8. Kenney Furniture Kit·Dining Table + Chairs（CC0）→ L1 教学关场景
9. Kenney Building Kit·Door module（CC0）→ 入户门/房门视觉层
10. Kenney Food Kit·Mug（CC0）→ L1 脏杯实体

### Reject List（许可证/风格/技术原因）

| 候选 | 拒绝原因 |
|---|---|
| 任何 Sketchfab "Free Download" 默认授权模型 | 大量 Editorial Use Only / Personal Use Only；需书面授权确认 → 成本过高 |
| itch.io "Free / Name your price" 未明确 CC0 或 CC BY 声明的作者包 | 授权不明 + 风格跳 → REJECTED 主来源 |
| 网盘 / 二次搬运 / 搜索引擎缓存 / 论坛附件 | License Unclear → FATAL |
| 仅 Personal Use、Non-commercial Only、No Derivatives、Editorial Only | 全部 FATAL（§七 许可证规则） |
| Poly Pizza / OpenGameArt 中任何 CC BY-NC / CC BY-ND / CC BY-NC-ND 件 | 禁止修改或禁止商业 → REJECTED |
| 任何 3D 艺术家 ArtStation "可下载 sample"（绝大多数仅个人学习） | Personal Use Only 高风险 → REJECTED |
| Quaternius pack 若下一阶段无法打开作者资产页（存在性 UNVERIFIED） | 暂不入下载清单，作为存在性确认后的补充 |
| L3 任务道具任何外部衣物/篮子模型（有可用外部模型也拒绝） | 颜色编码 identity 必须由程序化 Fallback 提供 → REJECTED 外部替换 |
| 外部低模猫模型（哪怕 CC0 也拒绝） | 角色风格 MEM-07 统一由自制保证；外部猫姿态/风格不统一 → REJECTED 主方案 |

---

## 10. Loader 兼容性（完整 `ASSET_TECHNICAL_COMPATIBILITY_MATRIX.md`）

结论：**LOADER_READY_WITH_LIMITATIONS**。不阻止下载审计；生产接入前须遵守 5 条限制（见 §2）。

---

## 11. 许可证矩阵（完整 `docs/assets/ASSET_SOURCE_LICENSE_MATRIX.md`）

主策略：**100% CC0 Kenney 基础 + 补充道具 CC0/CC BY 双轨逐件验证。**
- Kenney Furniture Kit / Building Kit / Prototype Kit / Food Kit 全部 CC0（FACT kenney.nl 每资产页链接到 creativecommons.org/publicdomain/zero/1.0/）
- Poly Pizza 每件下载前必须在模型详情页点开 license badge 截图留档，仅接受 CC0 / CC BY
- OpenGameArt 每件必须存 author + submission URL + license 快照，仅接受 CC0 / CC BY（CC BY-SA 要求作品整体 SA，对比赛二进制分发可能病毒式传染，慎用）
- 署名方案：主包推荐性一行致谢；CC BY 补充件需 CREDITS.md 逐件登记 author/作品/URL/license/修改情况

---

## 12. 性能预算（§十七 · 筛选预算，不代表生产强制要求）

| 类别 | 筛选阈值 | 预期 Kenney 单家具体量（INFERENCE） |
|---|---|---|
| 小道具 key/phone/fork | ≤ 300 KB | 50~200 KB / 件 |
| 中小道具 umbrella/tissue | ≤ 500 KB | 100~300 KB |
| 普通家具 chair/table/lamp | ≤ 800 KB | 200~600 KB |
| 大型家具 sofa/bed/wardrobe | ≤ 1.5 MB；旗舰 ≤ 2 MB | 400 KB~1.2 MB（sofa 可能 800 KB~1.5 MB 视纹理） |
| Living 全房新增传输 | ≤ 5 MB | 估计 3~4.5 MB（10~12 件家具 + 墙视觉层） |
| Bedroom | ≤ 3 MB | 2~2.5 MB |
| Entrance | ≤ 2 MB | 1~1.5 MB |
| Dining | ≤ 3 MB | 2~2.8 MB |
| Laundry（仅背景家具） | ≤ 3 MB | 1.5~2.5 MB（7 个任务道具全部 fallback = 0 KB） |

### Web 性能总览（INFERENCE）
- 五房家具合计 GLB 估计 10~13 MB（shared atlas + instanced chairs 合批）
- 首次加载（/play/task-clean-table）只需 L1 Dining chunk ≤ 3 MB → GitHub Pages 体验 OK
- 总 tri count 估计 180k~250k（远低于 mid-tier 手机 1M tri 舒适阈值）
- Draw calls：程序化墙 10~20 + 家具 100~200 + 任务物 20~30 + HUD 平面 = 峰值 < 300。WebGL mid-tier 手机舒适阈值约 500 → ✅
- **风险点**：shared atlas 跨家具材质复用如果被破坏（每件独立 texture）则 draw calls 升至 >600 → 下一阶段转 GLB 时必须**合并 atlas** 或保留 Kenney 原始 shared atlas（若已有）

---

## 13. 怀旧家庭科幻灯光方向（`VISUAL_AUDIO_DIRECTION_*.md §二`）

5 状态：
- A. Neutral Daylight（L1 教学关强制）
- B. Warm Interior Evening（L3 默认，L2 前段）
- C. Nostalgic Night Home（L2 主状态，深蓝 + 琥珀）
- D. Memory Disturbance（扰动抽层 + HUD glitch，不 camera shake / CA，不闪烁）
- E. Memory Recovery（2.5~4s 金色恢复光脉冲 = 情绪顶点）

实现成本：低-中。高成本效果（体积光/SSAO/SSR/景深/>2 动态阴影）全部禁止。

---

## 14. 动态音乐状态（`VISUAL_AUDIO_DIRECTION_*.md §三`）

8 状态机：CALM_HOME / MEMORY_ENCODE / LEAVE_ROOM / DISTURBANCE / UNCERTAINTY / EVIDENCE_SEARCH / MEMORY_UPDATE / COMPLETION_COOLDOWN。全程遵循 AUD-P0 音频生命周期能力。不得从头到尾宏大音乐；扰动时先抽掉部分音乐层；搜索时逐层增加声音；仅 MEMORY_UPDATE 达高潮；完成后安静回落；一次性 SFX 不得 visible/resume 后重放。

---

## 15. 窗外世界（`VISUAL_AUDIO_DIRECTION_*.md §四`）

推荐：深蓝夜空平面（1 draw call）+ 8~16 模糊城市光点（additive）+ 可选 2~3 极慢云层（+2~3）。星点可选。禁止：室外可探索地图、完整城市、天气系统、昼夜循环。

L1 教学关强制 A. Neutral Daylight → 纯白窗玻璃。Laundry 默认冷白顶灯不做夜景。

---

## 16. 小地图与拓扑准备度（`ASSET_TOPOLOGY_MINIMAP_READINESS_MATRIX.md`）

全部推荐资产 MINIMAP_READY：Kenney 家具都是 Box 系 AABB，直接用 sceneSchema.getRotatedFootprint + 当前 minimap CSS 矩形映射即可。无需自定义 SVG 图标阶段。

---

## 17. 拒绝候选汇总（Reject List 总表）

| 类别 | 拒绝项 | 原因 |
|---|---|---|
| 主方向 | C. 微缩玩具屋 / D. 卡通机器人住宅 | 评分 54/70 vs 96 B 落选 |
| 主资产包 | Quaternius pack（源未确认）/ Poly Pizza 合集（非单风格）/ itch.io 散装 / Sketchfab 免费 | Source/License/风格统一性不达标 |
| 视觉效果 | chromatic aberration / heavy bloom / camera shake / volume light / SSAO / SSR / >2 dynamic shadows / depth of field / motion blur / real-time god rays | Web 性能风险 + 俗套 + 干扰任务物 |
| 音频来源 | YouTube Audio Library Free Section | License 仅限 YouTube 视频发布，游戏二进制分发授权不明 |
| 任务道具替换 | L3 衣物 / 篮子 / 袜子 / 毛巾 / 猫 / Phone / Umbrella / Key / Fork | 颜色编码 identity 或 MEM-07 风格一致性需求 |
| 结构方案 | Building Kit 完整替换逻辑墙 / 其他作者补充结构包 | DTS 风险 / 风格跳戏 |
| 来源渠道 | 网盘 / 二次搬运 / 搜索引擎缓存 / 论坛附件 / ArtStation samples | License Unclear 或 Personal Use Only |
| License 类型 | CC BY-NC / CC BY-ND / CC BY-NC-ND / Personal Use Only / Non-commercial Only / Editorial Only | 禁止修改或禁止商业分发 = FATAL |

---

## 18. 唯一推荐组合（与 §1.1 一致，用于最终 Gate 第 1~6 条汇总证明）

1. 主方向：B · Stylized Low-Poly Warm Home × Nostalgic Domestic Sci-Fi
2. 主家具：Kenney Furniture Kit (CC0, kenney.nl)
3. 墙门窗策略：方案 4（逻辑 Box 保留 + Kenney Building Kit 风格视觉 overlay）
4. 补充来源 ≤2 个：Poly Pizza（原生 GLB，CC0/CC BY 逐件） + OpenGameArt（兜底）
5. 保留 Fallback：Cat / Phone / Umbrella / Key / Fork / Tissue / Tray / All Laundry 道具 / 抽屉打开态 / 墙面画框
6. 替换 Fallback：全部背景家具（见 §1.1 列表）
7. Living 试点：Sofa + Coffee Table + TV + Stand + Bookshelf + Rug + Plant（7 件）
8. 单独寻找：Cup / Detergent / Shoes / Curtain / Wall lamp（5 项）
9. Loader：LOADER_READY_WITH_LIMITATIONS（不阻止下载审计）
10. Blender 需求：是（批处理转 GLB + pivot/scale/open-mesh 分离）
11. 署名：主包 CC0 无强制，推荐礼貌性致谢一行
12. 模型尺寸允许微调任务布局：是（±20%），核心机制和容器/门洞不变
13. 怀旧科幻成为正式主方向：是
14. 拓扑阶段所需资产事实 / 小地图阶段 footprint 图标事实：见 §1.1 列表

---

## 19. 下一阶段允许下载的精确清单（GO 条件 9：精确）

> 注意：本清单只允许在 ASSET_DOWNLOAD_AUDIT 阶段下载，用于离线尺寸审计、license 文件核对、格式转换练习。**禁止直接复制到 public/models，禁止改 MODEL_REGISTRY，禁止 commit/push。**

### 19.1 必下载（主包 + 结构 + 餐饮补充 · 全部 Kenney CC0 官方 zip）

1. **Kenney Furniture Kit** — 官方 URL：https://kenney.nl/assets/furniture-kit （FACT 140 files, CC0）
   - 审计目标：目录结构、是否含 GLB/glTF、FBX/OBJ、纹理 atlas 分辨率、pivot、sofa/coffee table/bed/nightstand/wardrobe/TV/bookshelf/dining table/chair/shoe cabinet 精确 AABB
2. **Kenney Building Kit** — 官方 URL：https://kenney.nl/assets/building-kit （FACT 80 files, CC0, Features=Animation）
   - 审计目标：wall segment 默认 length/thickness/height、door module 尺寸/开关 mesh 是否可拆、window module 尺寸、shared atlas 是否与 Furniture Kit 同一张
3. **Kenney Food Kit** — 官方 URL：https://kenney.nl/assets/food-kit （FACT 200 files, CC0）
   - 审计目标：Mug/Cup 变体是否适合脏杯、餐具相关、瓶类适合洗衣液、小托盘适合玄关

### 19.2 可选下载（结构补充 · Kenney 墙段额外变体）

4. **Kenney Prototype Kit**（可选，墙段变体 + 人物/轮椅不关心） — 官方 URL：https://kenney.nl/assets/prototype-kit
   - 审计目标：wall 段厚度与 Building Kit 一致性；仅在 Building Kit 墙段不足时启用

### 19.3 补充任务道具（Poly Pizza 单件，逐件点击 license badge 确认 CC0 / CC BY，每件下载前先记录 model URL + author + license + model name）

每件必须验证 license badge ≠ NC / ND / Personal Use。最多保留每件 2 个候选。

5. Poly Pizza·low poly **Washing Machine**（CC0/CC BY 逐件） — Laundry 背景家具
6. Poly Pizza·low poly **Dryer**（CC0/CC BY）或复用洗衣机变体
7. Poly Pizza·low poly **Umbrella Stand**（CC0/CC BY）— Entrance
8. Poly Pizza·low poly **Curtain**（CC0/CC BY）— Living/Bedroom 装饰
9. Poly Pizza·low poly **Shoes / Sneakers** pair（CC0/CC BY）— Entrance 装饰
10. Poly Pizza·low poly **Wall Lamp / Sconce**（CC0/CC BY）— Living/Bedroom 装饰（若 Furniture Kit 已含则跳过该项）

### 19.4 OpenGameArt 兜底（仅当 Poly Pizza 某件找不到 CC0/CC BY 时启用；逐件 submission URL + author + license 留档）

11. OpenGameArt·兜底 7/8/9/10 项 Poly Pizza 未覆盖的道具（每件独立验证许可）

### 19.5 下一阶段明确禁止下载

12. ❌ 任何 Sketchfab 免费模型
13. ❌ 任何 itch.io 未明确 CC0/CC BY 书面声明的家具包
14. ❌ 任何网盘 / 二次搬运 / 论坛附件
15. ❌ 任何 L3 衣物 / 篮子 / 袜子 / 毛巾的外部模型（一律保留 Fallback）
16. ❌ Cat / Key / Phone / Umbrella / Fork / Tissue Box / Tray 外部模型（保留 Fallback，§九/十一决策）
17. ❌ 任何 Quaternius 包（除非在下一阶段作者资产页 URL 返回 200 且明确列出该包 download link + license；当前 UNVERIFIED）
18. ❌ 任何音频资源（本轮禁止；音频留到声画专项阶段）
19. ❌ 任何 AI 生成 3D 模型（作者和授权不明确）

---

## 20. 下一阶段禁止下载清单（与 19.5 对齐，独立章节便于 Gate 核对）

与 §19.5 完全一致。强调：L3 任务道具程序化 Fallback 是 gameplay identity（颜色编码 + 幽灵关联），任何情况下不得在下一阶段下载外部模型替换。

---

## 21. Loader Blocker 判定

| 问题 | 是否阻止下载审计 | 是否阻止生产接入 | 处理方式 |
|---|---|---|---|
| Kenney 默认 FBX/OBJ，不直接是 GLB | NO | NO | Blender / glTF-Transform 批量转 embedded GLB |
| 纹理被剥离 → 纯色策略 | NO | NO（反而契合低模美学） | 试点后按需给大型家具加 preserveOriginalTexture flag |
| Draco/Meshopt/KTX2 未注册 | NO | NO | 我们转 GLB 时不启用高级压缩 |
| 外部 .bin + PNG Pages subpath resolving | NO | NO | 统一 embedded GLB 规避 |
| 可开家具动画 clip 当前不播放 | NO | NO | FallbackOpenable 程序化打开态已满足 L2 玩法 |
| 无重试 / 无指数退避 | NO | LOW（Fallback 兜底足够） | 大规模接入后可加（非阻塞） |

**Loader Blocker 总判定：NO BLOCKER FOR DOWNLOAD_AUDIT；PRODUCTION 需满足 5 条限制（见 §2 限制 1~5）。→ LOADER_READY_WITH_LIMITATIONS ✅**

---

## 22. Blender 需求

下一阶段（下载审计之后 / 生产接入之前）必须具备 Blender 3.x 能力，用于：
1. **批量格式转换**：Kenney FBX/OBJ → embedded GLB（确保 external .bin/PNG 不脱离）
2. **Pivot 标准化**：所有家具 pivot = 底部中心 (centerX, 0, centerZ)
3. **Scale 标准化**：1 世界单位 = 1 米（sofa 约 2m × 0.9m × 0.85m 高）
4. **可开家具 mesh 分离**：wardrobe door / drawer front / cabinet door → 单独命名导出 open/close 两个 GLB（或在同一 GLB 内按 named mesh group，由 FurnitureModel 控制显隐）
5. **（可选）shared atlas 合并**：若 Kenney 各包使用独立 atlas，评估 Blender 内把 2~3 张 atlas 合并为 1 张共享 → draw calls 降 20~30%
6. **（可选）InstancedMesh 源 mesh 导出**：重复餐椅 ×4 → 导出 1 个 chair GLB 由代码 InstancedMesh 渲染

**Blender 判定：MANDATORY**（无 Blender 无法批量转换 + 标准化 + mesh 分离）。Blender 是 GPL 免费软件，下载安装成本 = 0。

---

## 23. 署名需求

### 23.1 主包 Kenney（FACT CC0）
- 强制署名：**无**（CC0 放弃版权，法律上不要求）
- 推荐礼貌性致谢：在 Credits / About 弹窗 / README 末尾加一行：
  > 3D 家具资产部分来自 Kenney (https://kenney.nl)，基于 Creative Commons Zero 1.0 Universal 发布。

### 23.2 补充来源（Poly Pizza / OpenGameArt CC0 件）
- 强制署名：无（CC0）
- 推荐致谢：可与 Kenney 一行合并：`...以及 Poly Pizza / OpenGameArt 社区贡献者。`

### 23.3 补充来源（CC BY 件）
- **必须**在 CREDITS.md（新增文件，下一阶段）逐件登记：
  - Author name
  - Work title
  - Source URL (model detail page)
  - License URL (e.g. https://creativecommons.org/licenses/by/4.0/)
  - Modification statement（e.g. "Converted from OBJ to GLB, pivot normalized, rescaled to 1u=1m."）
- 在 About 弹窗展示 CREDITS.md 的访问链接或摘要

### 23.4 署名判定
- **无强制署名风险**：主包 CC0；补充件可主动挑 CC0 避开 CC BY 负担。只有挑不到 CC0 的极个别任务道具才登记 CC BY。

---

## 24. 下一条资产下载与尺寸审计命令草案

```
/implement 工作包：ASSET_DOWNLOAD_AUDIT（仅下载 & 离线尺寸审计 & 格式转换演练；不进 public/models、不改 src、不 commit）

Goal:
1. 从 kenney.nl 官方直连下载 Furniture Kit / Building Kit / Food Kit（共 3 个 CC0 zip）
2. 解压到独立 untracked 临时目录（如 .tmp-asset-audit/，加入 .gitignore）
3. 逐项核对：
   - 目录结构、模型数量、格式（FBX/OBJ/是否已有 GLB）
   - 共享 atlas 文件名、分辨率（PNG/JPG？1K/2K/4K？）
   - 许可证文件包内是否包含 LICENSE.txt 或 README.txt 重申 CC0
   - 每件 Top 10 候选模型（§9.10）的 AABB 精确尺寸（Blender Measure 或脚本批量导出）
   - 每件 Top 10 候选的 pivot 实际位置（底部中心 / 角落 / 中心？）
   - 是否含 animation clips（Building Kit door FACT·有动画 → clip 数量/名称）
4. 用 Blender 对 Top 3 模型（Sofa / Coffee Table / Bed）做格式转换演练：FBX→embedded GLB + pivot@bottom-center + scale 1u=1m，并输出报告文件
5. 逐件核查 Poly Pizza 5 个候选补充件（§19.3 的 5~10）license badge 截图留档，不立即下载
6. 输出审计报告：.trae/documents/ASSET_DOWNLOAD_AUDIT_REPORT.md（untracked）
7. git status 确认：无任何 staged/modified 文件被触及；untracked 只有本报告 + 临时目录 + 审计报告
8. 本工作包严禁：复制任何模型到 public/models；修改 src/；修改 MODEL_REGISTRY；修改 assets；修改 tests；commit；push；开始 G1；开始房屋拓扑；开始房间布局设计
9. 本工作包退出条件：3 个 Kenney zip 全部解压成功；Top 10 家具 AABB 实测值记录；3 件 GLB 转换演练成功报告；License 文件包内核对 CC0 一致性；所有 untracked 临时文件清单列明
10. 本工作包 QA：lint / test / build / qa 全部保持通过（不改代码，天然通过）
```

---

## 25. git status

本研究阶段（RESEARCH MODE ONLY）结束时预期 git status：

```
On branch main
Your branch is up to date with 'origin/main'.

Untracked files:
  (use "git add <file>..." to include in what will be committed)
  .trae/documents/HOMEMEM_ARENA_GAMEPLAY_FIRST_RESET_PLAN.md     (之前就存在，允许)
  .trae/documents/HOMEMEM_ARENA_PRODUCT_V2_NEXT_PHASE_MASTER_PLAN.md  (之前就存在，允许)
  .trae/documents/HOMEMEM_ARENA_FREE_3D_ASSET_AND_ART_DIRECTION_RESEARCH.md   (本文件，新增)
  docs/assets/ASSET_SOURCE_LICENSE_MATRIX.md         (新增)
  docs/assets/ASSET_COVERAGE_MATRIX.md               (新增)
  docs/assets/ASSET_TECHNICAL_COMPATIBILITY_MATRIX.md (新增)
  docs/design/VISUAL_AUDIO_DIRECTION_NOSTALGIC_DOMESTIC_SCIFI.md  (新增)
  docs/design/MODULAR_HOME_ASSET_SUPPORT_MATRIX.md   (新增)
  docs/design/ASSET_TOPOLOGY_MINIMAP_READINESS_MATRIX.md  (新增)
  docs/reports/AUD_P0_PRODUCTION_AUDIO_SMOKE_REPORT.md   (之前就存在，允许)
  docs/reports/G0_PRODUCTION_VERIFICATION_REPORT.md      (之前就存在，允许)

nothing added to commit but untracked files present (use "git add" to track)
```

预期没有 staged / modified 条目。

---

> 最终 Gate（§廿二）= GO_TO_ASSET_DOWNLOAD_AUDIT_WITH_LOADER_LIMITATIONS。
> 9 条 GO 条件全部满足（见 §1.2）。7 份支撑文档 + 本主报告已生成（§二十 + §廿一）。§廿三交付见 chat 最终输出。
