# MODULAR HOME ASSET SUPPORT MATRIX
> 文档编号：`MODULAR-HOME-ASSET-MATRIX·2026-08-03`
> 研究模式：RESEARCH MODE ONLY · 不设计最终坐标、不设计最终门洞

---

## 目标

判定候选资产包能否支持后续：
**HOUSE TOPOLOGY（单一数据源） + WALL AND DOORWAY（可参数化） + MINIMAP SINGLE-SOURCE PLAN（轮廓自动生成）**

不是本轮决定最终房屋拓扑，而是评估资产结构的可行性。

---

## 结构资产逐项评估

### A. Kenney Building Kit（80 files, CC0）— FACT

| 结构项 | 是否提供（FACT / UNVERIFIED） | 默认长度 | 默认墙厚 | 默认墙高 | 门洞宽 | 门洞高 | 门框 | 开关门状态 | 含窗户 | 可自由组合 | Blender 拆分量 | Pivot 合理 | 程序化拼接适合 | 无需布尔做门洞 | 三段组合门洞（左墙+上墙+右墙） | Draw call 风险 | 小地图轮廓适合 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Wall straight segment | UNVERIFIED 预览图显示有 | 1~2m (推断) | 0.1~0.15m (推断) | 2.5~3m (推断) | N/A | N/A | N/A | N/A | 可能有窗段 | ✅ | Low | OK (推断) | ✅ | 墙段间留 gap 即可 | 可行（3 个独立 wall segment） | Low（共享材质） | ✅ 直线段简单 footprint |
| Corner piece (90°) | UNVERIFIED | N/A | Same | Same | N/A | N/A | No | No | No | ✅ | Low | OK | ✅ | N/A | N/A | Low | ✅ |
| Floor tile | UNVERIFIED | 1~2m | N/A | N/A | N/A | N/A | N/A | N/A | N/A | ✅ | Low | OK | ✅ | N/A | N/A | Low | ✅ 方形 tile 直接生成 |
| Ceiling tile | UNVERIFIED | 1~2m | N/A | N/A | N/A | N/A | N/A | N/A | N/A | ✅ | Low | OK | ✅ | N/A | N/A | Low | ❌ 小地图不需要 |
| Door module with frame | UNVERIFIED 预览图显示有门 | N/A | Same | Same | 0.9~1.2m (推断) | 2.1~2.2m (推断) | ✅ 左右门框 | ✅ 开关动画（FACT·Features=Animation） | 可能有 | ✅ | Medium（拆出 open / close state） | OK (推断) | 可能需自定义宽度匹配当前门洞 | 自带门洞不依赖布尔 | 若 door module ≤ 当前 sharedRooms.doorway.width 则可嵌入 | Low-Medium | ✅ 矩形门框 footprint 简单 |
| Window module | UNVERIFIED 预览图显示有窗 | N/A | Same | Same | N/A | N/A | ✅ 窗框 | 可能固定 | ✅ 多种尺寸 | ✅ | Medium | OK (推断) | ✅ 嵌入墙段 | 可直接用 window segment 代替墙段 | N/A | Low | ✅ |
| Stairs | UNVERIFIED 可能无 | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A · 近期不用 |
| Skirting / baseboard | UNVERIFIED 大概率无 | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A · 自制简单 Box |
| Columns / pillars | UNVERIFIED | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | ✅ | Low | OK | ✅ | N/A | N/A | Low | ✅ |
| Modular room shell | UNVERIFIED 单房间整屋可能不存在 | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A · 不用整屋 |
| Modular apartment kit | ❌ UNVERIFIED 大概率无（Building Kit 偏向小型建筑） | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A |

### B. Kenney Prototype Kit（145 files, CC0）— 可能含通用 wall 模块

| 结构项 | 是否提供 | 说明 |
|---|---|---|
| Wall block | UNVERIFIED 标签含 wall/building | 可能简单 Box 墙段 |
| 门洞 | UNVERIFIED 可能无 | 不如 Building Kit 专门 |
| 适合场景 | 不如 Building Kit 专门化 | 作为 Building Kit 补充 wall 变体 |

### C. 当前程序化墙体（Room3D.tsx BoxGeometry）— FACT

| 结构项 | 支持度 | 证据 |
|---|---|---|
| 墙段参数化（width/height/thickness/pos） | 10/10 完全支持 | FACT·Room3D 根据 sharedRooms[room].size 动态生成四面墙 Box |
| 门洞参数化（offset/width/height） | 10/10 | FACT·collision.ts isInsideDoorway + 视觉墙段分段绕开门洞 |
| 无需布尔运算 | 10/10 | FACT·墙段本身分段不重叠 |
| 三段组合（左墙+上墙+右墙）稳定门洞 | 10/10 | FACT·已实现 |
| 视觉风格统一度（纯 Box） | 6/10 | 过于朴素但可贴纹理或替换视觉层 |
| Collision 100% 一致 | 10/10 | FACT·逻辑墙=视觉墙，没有 DTS |
| Minimap 轮廓生成 | 10/10 | FACT·墙坐标直接映射到 minimap CSS 矩形 |
| Draw call | 极低（每房 4~8 Box） | FACT |

### D. 自制极简墙体模块（Proposed · RECOMMENDATION）

| 结构项 | 支持度 | 说明 |
|---|---|---|
| 参数化墙段（继承程序化 Box 逻辑） | 10/10 | 与当前相同 footprint，仅视觉替换为 Kenney 墙段纹理或模型 |
| 视觉 vs 逻辑双轨 | 10/10 | 逻辑墙仍为 Box（碰撞用），视觉墙覆盖其上（asset 用） |
| Blender 工作量 | 低（简单 Box + 贴图） | 不做夸张造型 |
| 与家具风格一致性 | 高（用 Kenney atlas 纹理） | 同一张 shared atlas → 视觉不跳戏 |

---

## 方案对比：墙/门/窗 4 选 1

| 方案 | 与主家具包同风格 | 统一单位 | 门洞参数化 | 碰撞一致 | 小地图一致 | 工作量 | 维护复杂度 | Blender 依赖 | 推荐指数 |
|---|---|---|---|---|---|---|---|---|---|
| 1. 主包（Building Kit）完整替换 | **10/10** | UNVERIFIED 大概率 1u=1m | UNVERIFIED（若模块尺寸固定 1m 则门洞可微调） | MEDIUM（需额外 collision 几何体与视觉同步） | MEDIUM（模块→轮廓映射） | HIGH | HIGH（多模块拼接） | HIGH | 73 |
| 2. 补充结构包（另一作者） | LOW（风格跳戏） | LOW | MEDIUM | LOW | LOW | HIGHER | HIGHER | HIGHER | 30 · **REJECTED** |
| 3. 保持当前程序化墙体（Box） | 6/10（视觉朴素但不冲突） | 10/10（我们定义单位） | **10/10** | **10/10** | **10/10** | **LOW（零工作）** | **LOW** | **NONE** | **83** |
| 4. 自制极简墙体模块（逻辑 Box + Kenney 视觉覆盖） | **9/10**（贴 Kenney atlas 纹理） | **10/10** | **10/10** | **10/10** | **10/10** | MEDIUM-LOW | LOW-MEDIUM | LOW（初始一次设置） | **93 · RECOMMENDED** |

### RECOMMENDATION：方案 4（逻辑程序化墙不变 + 视觉层叠加 Kenney Building Kit 风格化纹理/简单模型）

**为什么拒绝方案 1（完整 Building Kit 替换）**：
- Building Kit 门洞模块默认宽（≈0.9~1.2m）可能 ≠ 当前 sharedRooms.doorways[*].width（≈1.6m 满足 PLAYER_RADIUS + 余量）。调整要么切墙段要么改 collision 常量，牵一发动全身。
- 视觉墙模块一旦与 collision footprint 不一致 → 双重真值源 DTS（GLOBAL_SCENE_GOVERNANCE_AUDIT.md 已明确禁止新增 DTS）。
- 小地图轮廓从模块映射比从程序化 Box 映射难 5~10 倍。

**为什么选方案 4**：
- 继承所有当前 collision / minimap / doorway 逻辑的正确性（100% 已通过 G0 和 QA）。
- 视觉上只要在 Box 表面赋予 Kenney 风格的 shared atlas 纹理（或替换为极简 Kenney 墙段 GLB，仅视觉，不参与碰撞），即达到风格统一。
- 未来 P2.G1 拓扑重治理时，逻辑墙的 footprint 仍是权威来源。

---

## 与 P2.G1 Schema Foundation 的衔接（FACT from P2.G1-A 报告）

UNVERIFIED（需后续 P2.G1-B 设计阶段确认）：
- 墙段的 semanticKey 与 visualOwner（当前源码都未迁移，project_memory 已列为源码审计事实 #5、#6）。
- 自制墙体视觉模块的 surfaceHeight / collisionOwner 字段。
- 模块化门洞与 DoorwaySpec 权威类型（src/types/room.ts）的衔接。

RECOMMENDATION：
- 当前研究阶段 → 方案 4（逻辑 Box + 视觉叠加）为唯一通过方案。
- P2.G1-B 后可重新评估是否为视觉模块接入 semanticKey，但不影响本轮资产下载决策。

---

## 最终判定：模块化住宅结构策略

| 问题 | 答案 |
|---|---|
| 主家具包（Kenney Furniture Kit）自带墙/门/窗？ | **NO**（Furniture Kit 只含家具，不含结构） |
| Building Kit（另一 Kenney 包）是否自带结构？ | **YES（预览图显示有墙/门/窗模块，FACT 官网有 page，License CC0）** |
| 是否直接用 Building Kit 替换当前程序化墙？ | **NO（门洞参数化 collision / minimap DTS 风险高）** |
| 应使用：主包模块 / 补充结构包 / 当前程序化 / 自制极简模块？ | **自制极简墙体模块（逻辑 Box 保留 + Kenney 风格视觉覆盖层）**（= 当前程序化 + Building Kit 纹理/简单模块的视觉层） |
| 哪个方案最容易保持 visual / collision / minimap 三者一致？ | 方案 4（逻辑权威 = Box + visual overlay 完全不碰 footprint） |

### 下阶段下载审计需要验证的结构资产清单（UNVERIFIED → FACT）
1. Kenney Building Kit.zip 内实际包含的墙段变体数量、默认每段长度/高度/厚度
2. Door module 开关状态 mesh 是否可独立分离（open state / closed state 两个 GLB 导出）
3. Window module 是否嵌入墙段（单模型 = wall_with_window vs 独立 window frame + wall 两块）
4. Kenney 所有模块 pivot 是否在 world 0,0,0 且 footprint 对齐网格
5. 共享 atlas 是否同时覆盖 Furniture Kit + Building Kit（如是则视觉一致性天然 10/10）

---

## 小地图与拓扑准备度（§十六 MINIMAP_READY 判定）

| 方案 | MINIMAP 评级 | 理由 |
|---|---|---|
| 方案 3（保持程序化 Box） | **MINIMAP_READY** | 当前已经工作，sharedRooms size 直接转 minimap rect |
| 方案 4（逻辑 Box + 视觉叠加） | **MINIMAP_READY** | 逻辑 Box 不变，小地图无任何变化 |
| 方案 1（完整 Building Kit 替换） | **MINIMAP_READY_WITH_CUSTOM_ICONS** | 需每个模块手写 footprint 映射表；复杂且易出错 |
| 方案 2（补充结构包） | **MINIMAP_DIFFICULT** | 双作者风格 + 单位不一致 + footprint 不可预测 |

RECOMMENDATION：MINIMAP_READY（方案 4），不阻碍下一阶段资产审计。
