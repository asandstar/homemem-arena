# LIVING A6 浏览器可玩性验证报告 · MICRO VERIFY ROUND B3

> **生成时间**：2026-08-06 16:55 (Asia/Shanghai)
> **验证目标**：A6 客厅布局真实浏览器可玩性
> **验证环境**：npm run dev @ http://127.0.0.1:5173/homemem-arena/
> **本轮约束**：禁止修改代码 / 禁止 commit / 禁止 push / 仅验证

## 方法学声明

当前会话**缺少 macOS 桌面 GUI 自动化能力**（screencapture 屏幕录制权限受限、无法注入键盘事件到 Chrome 渲染进程）。因此本报告严格区分三类证据：

- **BROWSER_OBSERVED**：通过 `curl` 实际请求 dev server 得到的真实 HTTP 状态（GLB 200、主页 200）
- **COMMAND_SIMULATED**：基于源码静态分析 + 已通过的单元测试（livingA6.test.ts 18/18、qa-layout 29/29）推断
- **HUMAN_UNVERIFIED**：需要人工打开浏览器实际观察的项（Canvas 渲染、WASD 移动、E/F 交互、截图视角）

## 真实 HTTP 验证（BROWSER_OBSERVED via curl）

| 资源 | URL | HTTP | 字节数 | 证据等级 |
|---|---|---|---|---|
| 主页 | `http://127.0.0.1:5173/homemem-arena/` | **200** | 3439 B | BROWSER_OBSERVED |
| loungeSofa.glb | `/assets/models/kenney/furniture/loungeSofa.glb` | **200** | 9644 B | BROWSER_OBSERVED |
| tableCoffee.glb | `/assets/models/kenney/furniture/tableCoffee.glb` | **200** | 8256 B | BROWSER_OBSERVED |
| cabinetTelevision.glb | `/assets/models/kenney/furniture/cabinetTelevision.glb` | **200** | 10524 B | BROWSER_OBSERVED |
| televisionModern.glb | `/assets/models/kenney/furniture/televisionModern.glb` | **200** | 6368 B | BROWSER_OBSERVED |
| bookcaseOpen.glb | `/assets/models/kenney/furniture/bookcaseOpen.glb` | **200** | 18020 B | BROWSER_OBSERVED |

**结论**：dev server 正常服务，5 个 GLB 全部可访问，HTTP 200 且字节数 >0。排除 `MODEL_LOAD_BLOCKER`。

## 部分浏览器截图（BROWSER_OBSERVED，但内容受限）

以下截图通过 Edge 打开页面 + `screencapture` 获取（无屏幕录制权限时只能截取当前桌面）：

| 截图 | 路径 | 说明 |
|---|---|---|
| 01_home.png | `docs/reports/screenshots/01_home.png` | 浏览器打开主页后的桌面截图（3.1 MB） |
| 02_tasks.png | `docs/reports/screenshots/02_tasks.png` | Tasks 列表页（3.1 MB） |
| 03_play_initial.png | `docs/reports/screenshots/03_play_initial.png` | 游戏初始视角（1.3 MB） |

> 这些截图**未能通过程序读取内容**（Read 工具不支持 PNG），因此 Canvas 是否白屏、家具布局是否符合 A6 仍为 **HUMAN_UNVERIFIED**，需人工目视检查截图。

## 核心检查矩阵

| # | Check | Result | Evidence | Blocker |
|---|---|---|---|---|
| 1 | five GLB load | **PASS** | curl 5/5 HTTP 200，字节数 6.2KB~18KB | - |
| 2 | duplicate coffee table | **PASS** | livingA6.test.ts #11：Room3D renderLiving 无独立 CoffeeTableModel；茶几由 cnt-coffee-table 唯一承担 | - |
| 3 | visual layout — sofa 南墙 | PASS (SIMULATED) | decorFurniture.ts:46 `decor-sofa-main position=(-1.5,0,2.24)`，z=+2.24 为南墙侧（room z_max=2.75）| - |
| 4 | visual layout — TV 北墙西段 | PASS (SIMULATED) | decorFurniture.ts:53 `decor-tv-stand position=(-2.0,0,-2.1)`，z=-2.1 北墙，x=-2.0 西半侧 | - |
| 5 | visual layout — bookshelf 东墙南段 | PASS (SIMULATED) | decorFurniture.ts:68 `decor-bookshelf position=(2.75,0,1.5)`，x=+2.75 东墙，z=+1.5 南段 | - |
| 6 | TV/bookshelf 不遮挡 Entrance doorway | **PASS** | livingA6.test.ts #3：四件 decor 不进入任何 doorway clearance | - |
| 7 | 无旧侧沙发 | **PASS** | livingA6.test.ts #4：decor-sofa-side 不存在于 decorFurniture.living | - |
| 8 | 枕头不悬空 | PASS (SIMULATED) | Room3D.tsx:221-234 枕头 Y=0.45，沙发座面约 0.40-0.50 | - |
| 9 | 墙体三角切面/穿墙 | **HUMAN_UNVERIFIED** | 纯代码无法检测 3D 渲染法线 | - |
| 10 | Canvas 非白屏 | **HUMAN_UNVERIFIED** | 截图已获取但无法程序读取 | - |
| 11 | V 俯视图正确 | **HUMAN_UNVERIFIED** | 需人工按 V 键观察 | - |
| 12 | spawn 第一视角 | **HUMAN_UNVERIFIED** | 截图已获取但无法程序读取 | - |
| 13 | three door routes 可通行 | **PARTIAL** | qa-layout §3 门洞净空 PASS；真实穿越需人工 | - |
| 14 | relocated key 可达性（几何） | **PASS (SIMULATED)** | 见下方几何分析 | - |
| 15 | relocated key 可达性（实际） | **HUMAN_UNVERIFIED** | 需人工 WASD 走过去验证 | LAYOUT_COLLISION_BLOCKER 风险 |
| 16 | E 交互距离够用 | PASS (SIMULATED) | 见下方分析 | - |
| 17 | F 拾取可用 | PASS (SIMULATED) | entitySlice 通用拾取逻辑存在 | - |
| 18 | 3D LOS（line of sight） | **HUMAN_UNVERIFIED** | 无 Raycaster 自动测试 | - |
| 19 | cat prints 视觉 | **CAT_PRINT_VISUAL_WEAK** | 见下方分析 | - |
| 20 | memory outdated 显示 | PASS (SIMULATED) | leave-home.ts:314 `markMemoryOutdated: 'obj-key'` | - |
| 21 | memory update 可用 | PASS (SIMULATED) | g-stage-key-updated milestone 存在 | - |
| 22 | level completion 条件 | **PASS (SIMULATED)** | leave-home.ts:103-108 三物品 + catEvent + keyMemoryOk | - |
| 23 | Probe 4 题 | **PASS (SIMULATED)** | leave-home.ts 配置 p-loc-key-original/moved/phone/umbrella | - |
| 24 | Result 路由 | PASS (SIMULATED) | ArenaPage 路由机制存在 | - |

## Relocated Key 可达性几何分析（COMMAND_SIMULATED）

**关键参数（源码确认）：**
- `PLAYER_RADIUS = 0.3m`（playerControls.ts:10）
- 实体交互 `maxDistance = 2.0m`（interactionTargets.ts:10）
- 容器交互 `maxDistance = 2.5m`（interactionTargets.ts:36）

**Relocated key 位置**：`living` 局部 (x=-2.6, y=0, z=1.9)

**沙发碰撞盒**（decorFurniture.size，玩家实际碰撞）：
- 中心 (-1.5, 0, 2.24)，size (2.4, 0.9, 1.0)
- X 范围：[-2.7, -0.3]
- Z 范围：[1.74, 2.74]

**沙发视觉盒**（GLB effectiveAabb，测试使用）：
- X 范围：[-2.48, -0.52]
- Z 范围：[1.83, 2.65]

**钥匙点 (-2.6, 1.9) 分析：**

| 检查项 | 结果 | 说明 |
|---|---|---|
| 钥匙在沙发碰撞盒 X 范围内？ | ✅ 是 | -2.6 ∈ [-2.7, -0.3] |
| 钥匙在沙发碰撞盒 Z 范围内？ | ✅ 是 | 1.9 ∈ [1.74, 2.74] |
| 钥匙在沙发视觉盒内？ | ❌ 否 | x=-2.6 < -2.48（外侧 0.12m） |
| 玩家可站立点（沙发北侧绕行） | ✅ (-2.6, 1.3) | 距沙发碰撞盒最近点 (-2.6,1.74) 的距离 0.44m > PLAYER_RADIUS 0.3m，可站立 |
| 站立点到钥匙距离 | 0.60m | √(0² + 0.6²) = 0.60m < 2.0m 交互阈值 ✅ |
| 玩家可站立点（西墙边绕行） | ✅ (-2.95, 1.9) | 距西墙(x=-3.25) 0.30m = PLAYER_RADIUS，刚好可走 |
| 站立点到钥匙距离 | 0.35m | √(0.35² + 0²) = 0.35m < 2.0m ✅ |

**结论**：几何上玩家可从沙发北侧或西墙边接近 relocated key 并在交互距离内按 E/F。

**风险标注**：沙发碰撞盒比视觉盒大约 22%（X 方向），玩家可能感觉"还没碰到沙发视觉就被挡住"。若实际测试发现玩家无法在 2.0m 内接近钥匙，分类为 `LAYOUT_COLLISION_BLOCKER`。

## 猫脚印视觉评级

**当前实现**（CatPrintsEffect.tsx）：
- 5 个圆形脚印，起点到终点直线插值
- 每脚印 (±0.15, ±0.15) 随机抖动
- 4 秒淡出
- Y=0.01 贴地，不避障家具/墙体

**两种触发路径：**
- **模式 A（正常）**：`lastMoveAnimation != null`，起点=钥匙推动前位置（茶几附近 z≈0.3），终点=(-2.6, 1.9)
  - 路径从茶几台面冒出（不自然）
  - 终点紧邻沙发西侧（抖动可能轻微侵入沙发视觉盒）
  - 方向明确指向钥匙 ✅
- **模式 B（fallback）**：`lastMoveAnimation == null`，起点=(-1.2,-1.0)，终点=(0.5,-1.5)
  - 完全不指向钥匙 ❌
  - 是猫在北墙前原地走动的轨迹

**评级：`CAT_PRINT_VISUAL_WEAK`**

理由：
- 模式 A 基本可用但起点不自然 + 4 秒淡出偏短
- 模式 B fallback 严重误导玩家
- 直线插值无避障，未来新增家具有穿模风险
- **设计文档中的五段 waypoint 路径未实现**（`CAT_PRINT_PATH_VISUAL_REVIEW_REQUIRED`）

## L2 Golden Path 状态机完整性（COMMAND_SIMULATED）

| # | 步骤 | 配置完整性 | 阻断风险 |
|---|---|---|---|
| 1 | spawn 找茶几钥匙 | ✅ obj-key surfaceContainerId=cnt-coffee-table | spawn 面朝 +Z 南，茶几在正前方 1.8m |
| 2 | E 保存钥匙记忆 | ✅ hasKeySavedAnyMemory 逻辑存在 | - |
| 3 | Living → Bedroom（西门） | ✅ 门洞 (x=-3.25,z=0,w=1.4) 净空 | - |
| 4 | F 开床头柜抽屉 | ✅ cnt-nightstand isDrawer=true | - |
| 5 | F 拾取手机 | ✅ obj-phone hiddenInContainer=cnt-nightstand | - |
| 6 | Bedroom → Living → Entrance（东门） | ✅ 门洞 (x=3.25,z=-1.1) 净空 | - |
| 7 | F 放手机到 tray | ✅ cnt-entrance-tray acceptedCategories 含 phone | - |
| 8 | F 拾取雨伞 + 放 tray | ✅ obj-umbrella + tray acceptedCategories 含 umbrella | - |
| 9 | 猫事件触发 | ✅ se-cat-pushes-key trigger 条件满足 | **关键**：拿到手机即触发，钥匙被搬到 (-2.6,1.9) |
| 10 | 钥匙记忆显示 outdated | ✅ markMemoryOutdated='obj-key' | - |
| 11 | 返回 Living 观察猫脚印 | 见上方评级 | CAT_PRINT_VISUAL_WEAK |
| 12 | 沙发西侧找 relocated key | ✅ 几何可达（见上方分析） | LAYOUT_COLLISION_BLOCKER 风险 |
| 13 | E 更新钥匙记忆 | ✅ memoryUpdateCount 逻辑存在 | - |
| 14 | F 拾取钥匙 | ✅ 通用拾取逻辑 | - |
| 15 | 回 Entrance 放钥匙 | ✅ tray acceptedCategories 含 key | - |
| 16 | level completion | ✅ stages[2] completionCondition 完整 | - |
| 17 | Probe 4 题 | ✅ 配置完整 | - |
| 18 | Result 路由 | ✅ 机制存在 | - |

**首个潜在阻断点**（按可能性）：
1. `INTERACTION_RANGE_BLOCKER`：钥匙(0.2×0.14)、手机(0.18×0.09)极小，需精确靠近
2. `LAYOUT_COLLISION_BLOCKER`：沙发碰撞盒偏大 22%，西侧绕行空间紧
3. `RENDERING_BLOCKER`：历史白屏问题（截图已获取但无法程序确认）

## 已删除的旧家具清单

| decorId | 删除原因 |
|---|---|
| decor-sofa-side | 侵入 Bedroom-Entrance 走廊 |
| decor-side-table | 与 A6 无关的旧落地家具 |
| decor-chair | 与 A6 无关的旧落地家具 |
| decor-floor-lamp-1 | 越界（X 超出 room x_max=3.25） |
| decor-plant-1 | 越界（X 和 Z 均超出房间） |
| decor-plant-2 | 越界（X 超出 room x_min=-3.25） |
| Room3D 第二张 CoffeeTableModel | cnt-coffee-table 唯一视觉所有者 |

## 未验证项（HUMAN_UNVERIFIED）

以下项**必须人工实际跑一遍浏览器**确认，当前无法证明：

1. Canvas 非白屏（截图已获取但无法程序读取内容）
2. V 键俯视图正确显示 A6 布局
3. WASD 移动无不可穿越的空气墙
4. E/F 键交互距离实际可用
5. 猫脚印 toast + 实际渲染对应（模式 A 真被触发而非 fallback B）
6. 钥匙、手机等极小物体视觉可见（不被台面遮挡）
7. 3D LOS（line of sight）无遮挡
8. 墙体无三角切面或相机穿墙
9. 真人 Golden Path 端到端通关
10. Probe 答题准确性

## 失败分类（若人工验证失败的建议归类）

| 阻断类型 | 触发条件 |
|---|---|
| RENDERING_BLOCKER | Canvas 白屏 / 墙体三角切面 / 相机穿墙 |
| MODEL_LOAD_BLOCKER | GLB 实际 404 或 0 字节（curl 已排除） |
| DUPLICATE_OWNER_BLOCKER | 出现两张茶几（测试已排除） |
| DOOR_TRANSITION_BLOCKER | 无法穿越门洞（qa-layout 已排除几何） |
| LAYOUT_COLLISION_BLOCKER | 沙发碰撞盒偏大导致无法接近 relocated key |
| INTERACTION_RANGE_BLOCKER | E/F 实际交互距离 < 2.0m 或需精确对准 |
| L2_STATE_MACHINE_BLOCKER | 猫事件不触发或阶段切换失败 |
| DISCOVERABILITY_BLOCKER | 钥匙/手机视觉不可见 |
| FEEDBACK_BLOCKER | toast/脚印不显示 |
| PROBE_RESULT_BLOCKER | Probe 答题后无法到 Result |

## 最终 Gate

```
LIVING_A6_BROWSER_PARTIAL
```

**理由：**

**已验证 PASS（可证明）：**
- ✅ 5 个 GLB HTTP 200（BROWSER_OBSERVED via curl）
- ✅ dev server 正常服务，主页 HTTP 200
- ✅ 12 项定向测试 livingA6.test.ts 18/18 PASS
- ✅ qa-layout task-leave-home 29/29 PASS（无 blocker/critical/major）
- ✅ A6 布局坐标与设计文档一致（COMMAND_SIMULATED）
- ✅ 茶几唯一视觉所有者（无重复）
- ✅ 旧侧沙发已删除
- ✅ relocated key 几何可达（北/西两侧绕行点距钥匙 ≤0.60m < 2.0m 交互阈值）
- ✅ L2 状态机配置完整（三阶段 + cat event + completion condition）
- ✅ Probe 4 题配置完整

**未验证（HUMAN_UNVERIFIED，不可证明）：**
- ⚠️ Canvas 实际渲染（截图已获取但无法程序读取）
- ⚠️ WASD 移动 + E/F 交互实际体验
- ⚠️ 3D LOS
- ⚠️ 猫脚印实际渲染（评级 WEAK，模式 B fallback 风险）
- ⚠️ 真人端到端通关

**结论**：A6 实现在代码层和静态资源层全部就绪且可访问，但 3D 第一人称游戏的实际可玩性（移动、交互、视觉）必须人工实机验证。当前无法给出 `LIVING_A6_BROWSER_PASS`，也不应给出 `LIVING_A6_BROWSER_FAIL`（无任何已证实的阻断），故为 `LIVING_A6_BROWSER_PARTIAL`。

## 后续建议

1. **人工实机验证**：开发者打开 http://127.0.0.1:5173/homemem-arena/ ，按 Golden Path 走一遍
2. **重点关注**：
   - 沙发西侧 relocated key 是否能走到交互距离内（LAYOUT_COLLISION_BLOCKER 风险）
   - 猫脚印是否走模式 A（指向钥匙）而非模式 B fallback
   - 极小物体（钥匙/手机）视觉可见性
3. **已知技术债**：
   - 猫脚印 waypoint 系统未实现（CAT_PRINT_PATH_VISUAL_REVIEW_REQUIRED）
   - 沙发碰撞盒与视觉盒差异 22%（可能需要后续校准）
   - CatPrintsEffect 模式 B fallback 路径误导

---

**报告生成完毕。本轮未修改任何代码。**
