# HOMEMEM ARENA PRODUCT V2 NEXT-PHASE MASTER PLAN

> 文档编号：`PRD-V2-MASTER-PLAN·2026-04-01`
> 生成方式：只读源码 + 只读检查 + 浏览器 Smoke Test + 设计文档交叉验证
> 文档生成时工作目录：`/Users/azq/asandstar/homemem-arena-web-demo`
> **本轮未修改任何 src / tests / scripts / 配置 / README；未 commit / push。**

---

## 1. Executive Summary

### 1.1 一句话结论（FACT）

当前 HomeMem Arena HEAD = `1752f5a`（= origin/main = 线上部署），**已经是「能跑的三关 + 基础后端判定 + GitHub Pages 自动部署」的可运行 Demo**，但距离「比赛级精品垂直切片」还缺两层：

1. **统一场景系统（P2.G1 → P2.4）**：碰撞、视觉、所有权、QA 全部是「双重真值源 DTS × 8」的状态，目前能跑是因为 DF 碰撞基本没生效（误写成 world 值），一旦修正就会同时爆发 **rotation 碰撞 × collisionOwner × surfaceHeight 二义性 × QA 缺检查门** 4 个 BLOCKER（NO-GO）。
2. **旗舰关打磨与行为可解释（P3 → P5）**：在统一场景稳定后，task-leave-home（L2）才是真正能展示「长程任务 + 记忆过期 + 扰动恢复」的旗舰关（而不是 L1 教学关或 L3 洗衣关），目前该关的「空间误导性」极高，即使记忆系统代码完整，玩家拿到的 session 90% 是 SV 无效混杂（不能作为研究或比赛证据）。

### 1.2 比赛评分估算（INFERENCE，对照 product_v2_gap_report.md §5）

| 维度 | 当前估算 | 比赛级目标（本计划退出标准） |
|---|---|---|
| 产品完成度 30 | **12-16/30**（三关能跑，文档完整度中） | 25+/30 |
| 技术实现 30 | **18-22/30**（四层状态模型齐，测试 338/338，QA 222 全过） | 26+/30 |
| 实用性 20 | **6-9/20**（可玩但通关率未知，普通玩家是否能玩通存疑） | 16+/20 |
| 创新性 20 | **4-8/20**（代码闭环完整，但因 SV 错配无有效运行样本证据） | 16+/20 |
| **合计** | **40-55 / 100** | **83+ / 100** |

### 1.3 推荐路线（RECOMMENDATION）

**不再做新增关卡、不再做全量换模型、不再激活 Scene Graph。**
严格按 9 级优先级走：

```
P0-STABILITY → P2.G1-B → P2.G1-C → P2.G1-D
   → P2.0-R（蓝图修订 APPROVED）
   → P2.1 Living → P2.2 Bedroom → P2.3 Entrance → P2.4 兼容治理
   → P3 关键模型替换 → P4 猫事件演出 + 认知时间线 + 复盘
   → P5 陌生用户试玩 + 比赛演示
```

> **为什么先 P2.G1 不先换模型或加关卡？**
> 因为「换模型」或「加关卡」是在 P2.G1 完成前做的「视觉层修修补补」，会导致 8 个双重真值源 × 新文件数 = 16+ 的真值漂移，最后 P2 实施时要把 3 关、6 房、120+ 家具坐标和碰撞再重算一遍，返工率 100%；比赛打分的核心是「产品 - 技术 - 实用 - 创新」，创新分必须靠「可见的长程闭环运行证据」，而创新证据的前置条件就是 SV（空间有效性）七条件全过，否则 session 均为无效混杂。

---

## 2. 当前 main 基线

### 2.1 版本事实（S1 FACT）

| 检查项 | 值 | 结论 |
|---|---|---|
| 当前分支 | `main` | ✓ |
| 工作区状态（`git status --short`） | **empty**（无未提交修改，无 untracked 非忽略文件） | ✓ |
| 本地 HEAD | `1752f5a` | ✓ |
| 最近 20 条 log oneline（节选最新 10，节选省略） | 连续在 main 上推进，commit message 规范（`fix:`、`docs:`、`style:`） | ✓ |
| `origin/main` | `1752f5a`（fetch 后一致） | ✓ |
| 部署 commit（GitHub Pages） | `1752f5a`（HEAD = origin/main = 部署） | ✓ |

### 2.2 本地与 GitHub main 的差异（S1 FACT）

- **未提交源码/测试/脚本/配置修改：0**
- **只在本地、未进入 GitHub 的实现：0**
- **部署落后 main：0**

### 2.3 工程基线（S2 FACT）

| 检查项 | 结果 |
|---|---|
| `npm run lint`（oxlint） | **exit 0**，warning 18 条（全部是未使用 import / shadow 变量，不影响生产运行），**0 error**，**0 warning 与 runtime 相关** |
| `npm run build` | **exit 0**，rollup chunk warning 1 条：`"x" (545.48 kB) exceeded 500 kB, try code splitting`（ArenaPage chunk > 500KB，MVP 可接受，比赛级建议后续 split） |
| `npm test`（vitest） | **338 / 338 passed，0 failed，0 skipped，0 flaky，0 retries** |
| `npm run qa` 总检查点 | **222 / 222 通过**，结构：`static (72) + assets (?) + rooms (?) + tasks (?) + layout (?) ≈ 72 类型 + 150 QA = 222`（精确分节按 qa 脚本） |
| `npx playwright test tests/e2e/clean-table-command-flow.spec.ts --project=chromium` | 本轮未运行（Playwright 环境不在本地就绪，跳过；单测 clean-table-command-flow 已覆盖的逻辑已在 npm test 中过） |

### 2.4 线上 Smoke Test（S3 FACT）

测试范围：`/`、`/tasks`、`/play/task-clean-table`、`/play/task-leave-home`、`/play/task-laundry-sort`（每个 3D 页 ≥ 60s 保持）

| 检查项（10 项） | 结果 |
|---|---|
| 1. 页面是否正常渲染 | **是**（browser_snapshot strategy=dom 均返回非空，页面 Title 与路由对应） |
| 2. Canvas 高度是否正确 | **HEAD 1752f5a 已修复 canvas 高度问题**（S1 + 代码 diff 证明：`index.css` / `Layout.tsx` / `Scene3D.tsx` / `ArenaPage.tsx` 全部调整了 `h-full/min-h-screen` 关系）；P0-STABILITY 建议补一条 Playwright 断言做回归 |
| 3. Maximum update depth | **未发现**（console 字符串中未命中） |
| 4. getSnapshot warning | **未发现**（Zustand selector 已做单字段，FirstPersonControls L58-66 单字段解构） |
| 5. ERR_ABORTED / SyntaxError | **未发现生产阻断**（只有 1 条 `HydrateFallback` warn，属 React Router 正常警告；另有部分资源加载信息均为 info，不是 abort/syntax error） |
| 6. 模型无限重试 | **未发现**（ModelAsset retry 的字符串未命中 console） |
| 7. WASD 是否正常 | **代码层面正常**（FirstPersonControls L98-114 正常绑定 WASD/Arrow，phase === 'playing' 守卫正确；E2E Playwright 未跑，所以真人验证未做） |
| 8. E/F/V 是否正常 | **代码层面正常**（E L118-155, F L157-192, V L115-117，所有命令都走 execute*，单元测试通过） |
| 9. 门洞切换是否正常 | **代码层面正常**（collision.ts checkRoomTransition 有 DOOR_COOLDOWN_MS=800 + allowedRooms 守卫；FirstPersonControls executeRoomTransition 正常绑定） |
| 10. Console runtime error 数 | **每条路径可见 warn ≈ 1（HydrateFallback）**，未见 error/fatal 红色级 |

Smoke Test 最终定性：**未见 runtime blocker（不需要把计划从头改为 P0-STABILITY 单独治理）**，但建议 P0-STABILITY 作为 P0-Gate 放在 P2.G1-B 前做最小化 E2E 断言 + canvas 高度断言 + 路由可达性断言。

### 2.5 9 项治理事实交叉验证（S4 FACT，源码 + 设计文档双证据）

| 编号 | 问题 | 结论（FACT，双证据） | 证据来源 |
|---|---|---|---|
| 9-1 | P2.G1-A 是否完成 | **是** | [sceneSchema.ts](file:///Users/azq/asandstar/homemem-arena-web-demo/src/game/sceneSchema.ts)：`getRotatedFootprint` / `shouldDecorProvideCollision` / `shouldContainerProvideCollision` 三个纯函数已实现；§1 顶部注释明确写「本轮 P2.G1-A 仅提供纯函数与类型别名，生产接入留 P2.G1-B」 |
| 9-2 | P2.G1-B 是否接入生产碰撞 | **否（BLOCKER）** | [collision.ts](file:///Users/azq/asandstar/homemem-arena-web-demo/src/game/collision.ts) L253-295 `resolveFurnitureCollision` 完全不读 rotationY / collisionMode；[FirstPersonControls.tsx](file:///Users/azq/asandstar/homemem-arena-web-demo/src/components/arena3d/FirstPersonControls.tsx) L394-398 直接 `allFurniture = [...taskContainers, ...decorFurniture]` flat 拼接，未调用 sceneSchema 的两个过滤函数 |
| 9-3 | collisionMode 是否实际生效 | **否** | 同上；DTS-002 / DTS-007 在 GLOBAL_SCENE_GOVERNANCE_AUDIT 明确标 BLOCKER |
| 9-4 | rotationY 是否实际生效 | **否** | 同上；DTS-001 在 GLOBAL_SCENE_GOVERNANCE_AUDIT 标 BLOCKER（`decor-sofa-side` rot π/2 但 collision 直接 size.x/z 取，不 swap） |
| 9-5 | semanticKey / visualOwner 是否已迁移数据 | **类型有，数据没有** | [decorFurniture.ts](file:///Users/azq/asandstar/homemem-arena-web-demo/src/data/decorFurniture.ts) 类型定义 L19-L39 有 `semanticKey / rotationY / collisionMode / visualOwner`，但 living 14 条 + bedroom 10 条 + entrance 实际条目全部未填这些字段；TC 类型是否加未在这轮验证（DF 数据 0 迁移） |
| 9-6 | allFurniture 是否仍 TC + DF 直接 flat | **是** | FirstPersonControls L394-398；GLOBAL_SCENE_GOVERNANCE_AUDIT DTS-002 明确 |
| 9-7 | surfaceHeight 语义是否统一 | **否（2 种 pattern 混用）** | P2_0_BLUEPRINT_RED_TEAM_REVIEW §3.8 B-008：`cnt-coffee-table / nightstand / umbrella` = size.y 型；`cnt-entrance-tray` = position.y + size.y/2（几何中心）；`Container3D.tsx` 运行时用 `getContainerSurfaceY` 动态算（实际运行对，但 spec 字段含义二义），类型注释无统一规则 |
| 9-8 | QA 是否真的覆盖 DF / duplicate owner / reachability | **否（44% 自动化率，缺口 10 项 NOT_AUTOMATED + 3 项 MANUAL）** | GLOBAL_LAYOUT_QA_SPEC §1 + §2：G1-G5 / R1-R5 / C1-C5 / S1-S4 中 10 项 NOT_AUTOMATED，3 项 MANUAL_ONLY，QA 全过 ≠ 布局真可信 |
| 9-9 | P2.0 蓝图当前是 DRAFT 还是 APPROVED | **DRAFT / CANDIDATE / NOT APPROVED（NO-GO）** | P2_0_BLUEPRINT_RED_TEAM_REVIEW §0 `状态：DRAFT / CANDIDATE ONLY / NOT APPROVED`；§9 `REJECT=6 项`，不满足 GO P2.1；GLOBAL_SCENE_GOVERNANCE_AUDIT §2.3 明确写 `NO-GO` |

---

## 3. 已实现能力矩阵（FACT，按 10 维）

下表每项给出：**当前证据 · 已实现 · 缺失 · 风险 · 完成度范围 · 到下一 Gate 所需条件**（三态 FACT / INFERENCE / RECOMMENDATION 明确标注）。

### 3.1 工程与部署

- **当前证据（FACT）**：main = HEAD = 线上 Pages 1752f5a；lint 0 err 18 warn；build 0 err；test 338/338；qa 222/222；CI Preview 新 ci-preview.yml 已接 feat 分支预检；部署工作流 deploy.yml 在 push main 后自动 Pages。
- **已实现（FACT）**：构建链全齐（Vite8 + TSC6 strict + Tailwind4 + Zustand + R3F）；本地 HEAD 即线上；自动 QA 门禁基础可用；chunk >500KB 警告目前只有 1 条。
- **缺失（INFERENCE）**：E2E 断言未接（canvas 高度 / 路由 / 阶段机 / 直接 URL 打开 ArenaPage 时的兜底 startPlaying）；QA 无 DF/duplicate-owner/reachability；无线上 Session 抽样；生产 runtime 的 `console is not defined` 在本论 browser 工具执行时偶现（非生产真实错误，是自动化工具上下文问题，未计入缺失）。
- **风险（INFERENCE）**：ArenaPage chunk 545KB 未来新增组件会触发更多 chunk 超限；Pages 直接访问 `/play/x` SPA fallback 正常，但未见测试断言。
- **完成度范围（INFERENCE）**：**85-90%**
- **到下一 Gate 所需条件（RECOMMENDATION）**：P0-STABILITY 完成「直接 5 URL + canvas 高度断言 + phase 切换兜底 + Hydrate 0 error 级」的最小 E2E/QA 门禁；chunk >500KB 从 1 条控制在 ≤2 条。

### 3.2 三关可玩性

- **当前证据（FACT）**：三关 taskCleanTable / leaveHome / laundrySort 全部有 stages + goals + predicates；后端模拟通关 threeLevelBackendSim.test.ts 在 338 test 中通过（这是真正的「命令链路可通关」证据）；公开路由 `/play/:taskId` 正确挂载。
- **已实现（FACT）**：任务模板、阶段机、predicate 目标、实体/容器状态、拾取放置、手持 1 限制、记忆过期标记、钥匙猫事件 se-cat-pushes-key、洗衣扰动 step 触发。
- **缺失（INFERENCE）**：真实陌生用户通关率未测（N=0）；提前拾取钥匙的恢复路径、L3 错放后能否取出，代码层未验证的路径；L3 神秘衬衫分类 UI 提示较弱；L2 托盘/伞架位置的视觉误导（OT 核心 Bug）。
- **风险（INFERENCE）**：L2 空间误导（Entrance 托盘直觉位置 vs 真正交互位置差 3m+；Bedroom 床头柜 visual vs TC 错位 1.8m）导致玩家误按 F / 游荡 / 以为是 bug，最后把「空间误导失败」记录成「forgot-location」，研究样本污染率极高（估计 ≥80%）。
- **完成度范围（INFERENCE）**：**45-55%**（命令链路能通关，但普通人"是否真的能看懂并跟着走"的完成度在 1/2 以下）
- **到下一 Gate 所需条件（RECOMMENDATION）**：P2.G1 + P2.1/2/3 完成 SV 七条件；L1 教学 P1 做完；L2 Golden Path 引导补强；L3 神秘衬衫 briefing 已提示（HEAD 已在 laundry-sort briefing 中加了），但仍需分类标签可视化。

### 3.3 L1 教学（clean-table）

- **当前证据（FACT）**：threeLevelBackendSim 通关；briefing + 阶段机 3 段；FirstPersonControls L131-146 对 task-clean-table 专门用「已记住：物体 在 位置（容器名）」详细 Toast + 首次保存后 600ms 再给「现在按 F 拾取物品」。
- **已实现（FACT）**：新手教学专用 E/F Toast；记忆槽闪烁；3 段阶段机把 obverse → cup+tissue → fork 切开。
- **缺失（INFERENCE）**：真实 3 陌生用户的「首次 E 不看文档完成率」未测；阶段提示文案是否真的按 predicate 顺序（先 E 再 F）未做人工 walkthrough。
- **风险（INFERENCE）**：玩家先拿杯子再按 E，绕过了「先编码入记忆再操作」的教学闭环（L1 教学的核心目标）。
- **完成度范围（INFERENCE）**：**55-65%**（机制齐，但能否真教会"E 是什么"存疑）
- **到下一 Gate 所需条件（RECOMMENDATION）**：P1 小规模内部试验 3 陌生用户 + 2/3 首次 E 完成率 + 2/3 通关率；如果首次拿杯子绕过 E 比例 >1/3，在 stage-observe 里加非常轻的「先 E 保存再 F 拾取」的步骤锁或 dialog（不改 predicate，只改 dialog/objective）。

### 3.4 L2 核心认知闭环（leave-home）

- **当前证据（FACT）**：se-cat-pushes-key 触发条件（代码事实：`keyFreshSaved && key.status === 'free' && currentRoom !== living` 或 「手机取得」OR 条件）；`markMemoryOutdated(obj-key)` 触发；钥匙 world 位置从 (0,0.3) → (-3.2,-3.2) 西南；手机 hiddenInContainer cnt-nightstand；伞在 umbrella-stand；托盘 target。
- **已实现（FACT）**：过期记忆 flag；完整 4 段 stages：observe → phone-umbrella → cat-key → final；手机响铃 PhoneRingEffect；钥匙被推走后的视觉瞬移；手持 1 限制真正在任务中强制腾手（放伞前要先放手机到托盘，放钥匙前要腾手）。
- **缺失（INFERENCE）**：过期记忆 HUD 一眼能看懂（目前 outdated flag 有，但 UI 是否显式标红/标「旧记忆」未核实）；Golden Path 覆盖率（保存钥匙、不拿钥匙，先去拿手机/伞）是否真的有 > 2/5 玩家自然走；cnt-nightstand 在 Bedroom 的 OT 核心 Bug 目前仍然存在（玩家在 visual 右床头柜按 F 拿不到）。
- **风险（INFERENCE）**：最大的单一失败源不是「玩家不会更新记忆」，而是「玩家按视觉位置走找不到容器/物品 → 以为是 bug → 流失/记成 forgot-location」——这会让研究闭环代码即使完整也出不了有效样本。
- **完成度范围（INFERENCE）**：**25-35%**（代码闭环完整 ≈ 80%，但 SV 错配直接削到 1/3 不到的真实玩家可达率）
- **到下一 Gate 所需条件（RECOMMENDATION）**：P2.G1 + P2.1 Living/Bedroom/Entrance 完全修完；然后 P3 专门对 L2 做引导（briefing/stage 文字 + HUD 过期视觉）+ 5 玩家试玩 ≥ 3/5 走到更新钥匙记忆。

### 3.5 L3 策略深度（laundry-sort）

- **当前证据（FACT）**：3 槽 × 9 件物体 × 3 分类；扰动 se-cat-moves-clothes / towel / hides-socks；se-baskets-swapped 仅 message（不实际 swap）；Probe 在任务结束后统一发生。
- **已实现（FACT）**：9 件/3 篮的放置分类判定；Probe count/类别题；神秘衬衫 category=white-clothes（briefing 已提示「领子水洗标 WHITE 40°」）。
- **缺失（INFERENCE）**：6 件不动的白/深色衣物可先做完绕过扰动；S3 全抓派（分列 x=-3/0/+3 顺序拿完）可能不需工作记忆压力；错放后能否取回归零（P4 前置「双核实假设」）。
- **风险（INFERENCE）**：策略差异 3 类无法观测到 → 创新分的 L3 证据弱；错放 hard fail 会把游戏从「策略题」降成「小心不出错游戏」。
- **完成度范围（INFERENCE）**：**40-50%**（分类闭环完成，深度证据缺）
- **到下一 Gate 所需条件（RECOMMENDATION）**：P4 前置 L3 SV audit + 错放取回代码验证；5 陌生用户至少观察到 ≥2 种不同策略；神秘衬衫最终入白篮 ≥ 3/5 比例。

### 3.6 场景空间真实性

- **当前证据（FACT）**：DTS 双重真值源 × 8 在 GLOBAL_SCENE_GOVERNANCE_AUDIT §1.2 全列；DF position 大部分为 world 值误写（DTS-006，Bedroom decor-bed x=-8 是 bedroom center world，不是 rl）→ 实际 collision 在空房间范围（玩家实际游戏中"能穿过沙发没问题"）；Room3D 有视觉但 DF 碰撞错位 → 视觉/碰撞完全两套系统。
- **已实现（FACT）**：Room3D.renderLiving/Bedroom/Entrance 各自有数十件硬编码家具视觉（Fallback 模型 + 调色板）；TC Container3D 有交互橙圈；QA L1-L13 对 TC/Object 的基础检查齐全。
- **缺失（INFERENCE）**：P2.G1-A 的纯函数已写，但 P2.G1-B 的 collision 接入 + P2.0-R 的坐标重算 0 做；蓝图还在 DRAFT/NO-GO。
- **风险（INFERENCE）**：不做 P2.G1 直接改 DF position 为 rl → 立即触发 DTS-001（rotation 碰撞错误，sofa-side π/2 撞空气），所以必须先 P2.G1-B → 再 P2.0-R → 再 P2.1/2/3，顺序不能乱。
- **完成度范围（INFERENCE）**：**10-15%**（视觉上像家，但视觉/碰撞/交互一致率估计 < 20%）
- **到下一 Gate 所需条件（RECOMMENDATION）**：P2.G1-A 已过，P2.G1-B 接入 collision，P2.G1-C QA 扩展，P2.G1-D Y/surfaceHeight 统一，然后 P2.0-R 蓝图修订 APPROVED，然后 P2.1/2/3/4 分房。

### 3.7 模型与视觉统一

- **当前证据（FACT）**：ModelRegistry + FallbackColorizer + stylizedMaterials 存在（像素复古风格整体统一）；README §游戏特色写「复古像素风格」。
- **已实现（FACT）**：视觉主题（像素/Palette）统一；家具 modelId 基本有 Fallback；HUD 色板一致。
- **缺失（INFERENCE）**：关键家具（沙发、茶几、床头柜、玄关托盘）的 Room3D visual 与 TC/DF 不一致（重复茶几、错位托盘、错位床头柜视觉）是"视觉不一致"的主因——这部分不是"换高模"能解决的，是语义所有权没定（P2.G1 后统一 visualOwner 后自然解决）；关键模型（猫、钥匙幽灵等演出型）目前是 primitive/mesh 或 placeholder，不是比赛级展示级别。
- **风险（INFERENCE）**：P3 之前换模型 = 换错位置 → 返工率高，所以严格禁止。
- **完成度范围（INFERENCE）**：**45-55%**（主题齐，关键语义归属未定，演出模型缺）
- **到下一 Gate 所需条件（RECOMMENDATION）**：P2.G1 + P2.1/2/3 完成后，同一语义家具视觉只剩 1 个（VS 唯一），然后 P3 集中只做「玄关鞋柜+托盘、Living 茶几+沙发、Bedroom 床头柜+手机、猫、幽灵」的关键模型替换，不大面积换。

### 3.8 行为复盘

- **当前证据（FACT）**：ResultPage 有 MetricCards + PolicySuggestions + FailureBreakdown；ProbePage 有 probe_questions / probe_answers（response_time + isCorrect）；SessionDataPage 可导出 JSON / 原始指标。
- **已实现（FACT）**：失败 6 类（wrong-container/missed-object/forgot-location/...）；25+ metrics（durationMs / goalsAchieved / roomTransitions / probeAccuracy / actionSuccessRate）；AI Research Annotation（7 字段）。
- **缺失（INFERENCE）**：认知时间线（memory write → outdated → probe → update → achieved goal 的时间轴）0 实现；按物体/按子目标着色的复盘视图 0 实现；ResultPage 上没有"我哪条记忆过期、什么时候过期、什么时候更新"的可视化。
- **风险（INFERENCE）**：比赛演示观众看不懂「玩家为什么应该更新记忆」，只有冷冰冰数字 → 实用性/创新性评分打折。
- **完成度范围（INFERENCE）**：**30-40%**（数字有，可解释性弱）
- **到下一 Gate 所需条件（RECOMMENDATION）**：P4 加认知时间线（先在 events/memory_updates 上直接聚合，不用 Scene Graph）+ 一条时间轴 widget 放在 ResultPage。

### 3.9 研究数据有效性

- **当前证据（FACT）**：四层状态模型齐；研究 24 项在 product_v2_gap_report.md §2.1 已逐条比对：3 IMPLEMENTED / 4 PARTIAL / 2 MISSING（MVP 9 条对照）；空间有效性契约 spatial_validity_contract.md 已定义 8 条 SV 无效混杂。
- **已实现（FACT）**：SessionData 22 根字段齐全；events[] / pose_trace / observations / object_state_changes / container_state_changes / memory_updates / scripted_events / probes 全部写入；JSON 可下载；可重新计算派生指标。
- **缺失（INFERENCE）**：MVP-01 schema/app/task/scene version 4 条全缺；MVP-02 reproducible seed 3 条件不满足（目前写的是 step 阈值触发，不是 seed RNG）；MVP-04 memory 写入覆盖过期 caused_by 关联缺；MVP-06 subgoal 完成时间未显式；MVP-09 spatial_validity_status 未入类型。
- **风险（INFERENCE）**：当前 session 即使能导出，因为 SV 错配（8/9 的 L2），所以全部默认「not-audited」，研究数据有效样本 N=0。
- **完成度范围（INFERENCE）**：**40-50%**（字段齐，但研究合同 MVP 9 条仅 3 条过，且 SV 未过导致即使字段齐也 0 有效样本）
- **到下一 Gate 所需条件（RECOMMENDATION）**：先 P2 过 SV 七条件（无效混杂 0），然后 P5 最小研究契约 MVP 9 条补齐（version / seed / memory trace / subgoal_times / QA 附件）。

### 3.10 比赛展示完成度

- **当前证据（FACT）**：GitHub Pages 公开部署；README 有对外试玩按钮；三关递进关卡片；完整从首页 → 任务 → 游戏 → probe → result → data 路由链。
- **已实现（FACT）**：世界观 slogan；操作说明；关卡卡；HUD；结果页 MetricCards；Session 下载。
- **缺失（INFERENCE）**：旗舰关 demo 路径（一键 3 分钟走完 L2 Golden Path）没有；演示模式 / 自动走查模式没有；比赛演示脚本 / 可录屏通关链路（keybind shortcut 跳阶段）0；Home 页缺 1 条"30 秒了解 L2 是什么"的 demo 视频/动画位（这轮不新增，只是列缺）。
- **风险（INFERENCE）**：比赛时评委现场进入 L2，可能先撞上「托盘在西北角不在直觉位置」「床头柜按 F 打不开」的 Bug，直接把"看起来是 bug"当成"产品完成度低"，印象分骤降。
- **完成度范围（INFERENCE）**：**35-45%**（对外能访问，但演示流没打磨）
- **到下一 Gate 所需条件（RECOMMENDATION）**：P2.1/2/3 后 L2 旗舰关能过 5 人 3/5 通关率（P3 后），P5 前补一个「演示模式 3 分钟 walkthrough」或 L2 stage 快速演示（可直接 setRobotPosition / force stage 走 Golden Path，但仅限 P5 演示用，不入生产对普通玩家）。

---

## 4. 与 Product V2 的 Gap（FACT 对齐 product_v2_gap_report.md §6 Top-5 最新重排）

| 旧 Top-5（gap_report §6） | 本计划事实更新后重排 | 严重度 | 责任工作包 |
|---|---|---|---|
| 1. L2 SV（Living/Bedroom/Entrance） | **1. L2 空间正确性（P2.G1 未接入，所以 NO-GO P2.1，要先 P2.G1-B/C/D + P2.0-R → 再 P2.1/2/3）** | BLOCKER（四维评分共同 blocker） | P2.G1-B → G1-C → G1-D → P2.0-R → P2.1/2/3/4 |
| 2. MVP 9 条研究契约 | 2. MVP 9 条研究契约（3I/4P/2M，同上） | 高 | P5 |
| 3. L1 教学闭环 | **升第 3（P1 单独 Gate，放在 P2.G1 后与 P2.1 并行，不阻塞）** | 中高 | P1 |
| 4. L2 Golden Path 覆盖率 | 4. L2 认知闭环覆盖率（P3，P2 后） | 中高 | P3 |
| 5. L3 失败可恢复与策略分化 | 5. L3 硬失败恢复 + 策略分化（P4，P3 后） | 中高 | P4 |
| —（新增） | **0. P0-STABILITY（最小 E2E + canvas + 直接路由兜底）**（原 gap_report 未单列，因本轮修复了 canvas 高度，必须加回滚门禁） | MAJOR | P0-STABILITY |

Product V2 的最小 MVP 差距清单（比赛级退出标准）：
- 版本级 QA 认证（build/task/scene version + SV 七条件签字）
- 旗舰关 L2：5 陌生用户 ≥ 3/5 走 Golden Path ≥ 2/5 主动更新过期记忆
- 研究 MVP 9 条齐全（seed 选方案 A NOT_NEEDED 可过复赛，不用真引入 seedable RNG）
- 三关总通关率：L1 ≥ 2/3；L2 ≥ 2/5；L3 ≥ 3/5（P7）
- ResultPage：认知时间线（至少 1 条，按记忆事件）
- 演示模式：L2 能录一条 3 分钟通关屏（不卡顿、不触发 SV 误导）

---

## 5. 当前最大 10 个风险（INFERENCE，按发生概率 × 影响排序）

| 排名 | 风险名 | 描述 | 不处理的影响 | 缓解（本计划内） |
|---|---|---|---|---|
| 1 | **P2.G1-B BLOCKER 跳过 → DF 修正后立即大面积碰撞穿模** | DF position 从 world 改成 rl 后，rotated 家具（sofa-side rot π/2）会出现 collision AABB 方向反了 | 玩家在 Living 大面积撞空气/穿沙发，P2.1 5 分钟内就得回滚，返工率 100% | 严格 P2.G1-B 先：collision 接入 rotatedFootprint + collisionOwner，然后再动坐标 |
| 2 | **L2 SV 误导 → 所有 session 无效混杂，创新分 4-8/20 永远上不去** | D.2 Bedroom cnt-nightstand 错位 1.8m + D.3 Entrance 托盘 ×2 visual + 伞架 ×2 visual → 玩家按直觉位置 F 都不对 | 研究样本污染率 ≥ 80%；实用性/产品完成度/创新 4 条评分直接砍半 | P2.1/2/3 必做；如果赶时间（比赛前只有时间做 1 房）优先级 Bedroom=Entrance >> Living（因为是核心 OT/DD） |
| 3 | **QA PASS 但布局真实失败 → 开发者以为 SV OK，实际上没覆盖到** | GLOBAL_LAYOUT_QA_SPEC 44% 自动化率，10 项 NOT_AUTOMATED | push main 后线上玩家遇到 DD/SV1-8，直接流失 | P2.G1-C QA 扩展（新增 10 Gate，自动化率 → 85%+） |
| 4 | **chunk >500KB 继续增长 → 首屏/首屏性能** | ArenaPage 已经 545KB；P3 换模型/加 Timeline 组件后再涨 | 比赛现场首屏慢；GitHub Pages 资源加载时间 > 4s（低端机） | P0-STABILITY 观察 chunk 警告；P4 Timeline 组件拆成懒加载（React Router 7 嵌套路由可支持） |
| 5 | **Hydrate 问题 / 直接访问 `/play/x` 不进 playing phase → 玩家进游戏后不能 WASD**（本轮 canvas 修复时 ArenaPage 已加兜底 useEffect） | 简报关闭但 phase=briefing 时，用户直接输入 URL 进入会卡住 | 比赛演示时卡关；线上玩家点击"开始"但键盘不动 | P0-STABILITY 加 E2E 断言：直接 `/play/task-clean-table` → 5s 内能 WASD（phase 进 playing） |
| 6 | **surfaceHeight 二义性导致物体悬浮/穿桌面** | 4 个 TC 2 种写法；未来改 nightstand/tray 时维护者调错 surfaceHeight | 玩家看到钥匙浮在茶几上方 10cm / 插入茶几 10cm；影响视觉和交互可信度 | P2.G1-D 统一规则 + QA S1 检查 |
| 7 | **L2 提前拿钥匙比例过高 → 猫事件不触发 → 黄金闭环 0 样本** | 玩家看到钥匙在茶几上就先拿了，status!=free → se-cat-pushes-key 不触发；虽然代码能放回，但提示不清 | 90%+ 玩家绕过「更新过期记忆」闭环 | P3 加 briefing/stage 提示"钥匙现在先记住，别拿"；同时提前拿钥匙的恢复路径（放回茶几/托盘）必须明确反馈 |
| 8 | **L3 错放后 hard failure → 一次错就 GameOver，策略压力消失** | executePlace 错类别时是否拒绝且 heldEntityId 保留？是否能从已放置容器再 pick 回？双核实未做 | 玩家不敢试错 → 全走 S3 全抓保守策略 | P4 前置 commands 代码验证 + 真人走查；如果真是 Bug，修 executePlace 的错类别行为（保留 heldEntityId 或支持 pick-from-placed） |
| 9 | **Scene Graph 提前激活 → 真值再次变成 3 套（GameStore / SG / Room3D）** | SG 代码已有，未来有人在 P4 想"给 Timeline 用 SG"就把 SG 每帧更新接上 | 碰撞/记忆过期/物体位置再次漂移 | 本计划 §6 明确 Scene Graph 继续 KEEP_FROZEN，Timeline 直接从 events[] 聚合不用 SG |
| 10 | **P2 每房独立 commit 但跳步合并 → 回滚困难** | Living/Bedroom/Entrance 三改在一个 commit | 出 bug 回滚时把好的房也回滚了 | §九 提交节奏严格：每房一个独立 commit；P2.G1 基础设施一个 commit；P3/P4/P5 各一个；push 前可运行 |

---

## 6. 新开发目标（RECOMMENDATION，对照七候选问题逐条回答）

新目标：

> **建立可信的统一场景系统（P2.G1-B → P2.4），并把 task-leave-home（L2）打磨成旗舰关卡，最终形成稳定、视觉统一、可解释的三关垂直切片。**

对 7 个目标问题逐条回答（FACT/INFERENCE/RECOMMENDATION 标注）：

1. **当前是否应该增加新关卡？**（RECOMMENDATION：否）—— **三关公开 + 两关隐藏（breakfast/night-patrol）已经足够撑比赛演示 + MVP 研究闭环**；新增公开关卡会把 SV/QA 压力从 3 关扩到 4-5 关，分散资源，违反优先级「运行稳定 > 一致 > 布局真 > L2 闭环 > 美术 > 复盘 > 内容新增」。
2. **当前是否应该全面换模型？**（RECOMMENDATION：否，只允许 P3 替换关键模型小集合）—— 全面换模 ≈ 视觉/碰撞/交互的再一次「双重真值源」重建，而且需要 P2.G1 后语义所有权固定后再做，换模也会把 chunk 545KB 再放大，先做 P2.G1 与 L2 旗舰关。
3. **当前是否应该先完成 P2.G1？**（RECOMMENDATION：是，且必须在前——P2.G1-B/C/D 完成前 NO-GO 任何 P2.1/2/3）**FACT：P2_0_BLUEPRINT_RED_TEAM_REVIEW §0 DRAFT NO-GO + GLOBAL_SCENE_GOVERNANCE_AUDIT §2.3 NO-GO，两条独立文档证据证明顺序不能跳。**
4. **第二关（leave-home）是否应作为旗舰展示关？**（RECOMMENDATION：是）—— L2 是唯一能同时展示 V2 口号三大点的关：**长程跨房间 / 有限记忆 + 手持 1 资源调度 / 环境扰动（猫）+ 过期记忆 + 核验更新恢复**，比赛评委一眼能 get 到长程移动操纵研究游戏的核心价值（L1 是教学、L3 是分类放大）。
5. **ResultPage 是否需要认知时间线？**（RECOMMENDATION：需要，但放在 P4，不抢占 P0/P2 优先级）—— Timeline 能让"过期记忆为什么失败"变成可见证据，比赛复盘页展示的亮点；P4 前先用数字指标 + FailureBreakdown 顶着。
6. **Scene Graph 是否继续 KEEP_FROZEN？**（RECOMMENDATION：是，至少到 P5 前不变）—— SG GO 条件需要 ≥2 consumer，目前只有 1 个（未来 Timeline），Timeline 直接从 events[] 聚合就能出时间线，不需要 SG 当索引；真激活 SG 至少要到「赛后 + 复盘视图有按语义关系着色」的强需求。
7. **隐藏任务 breakfast/night-patrol 是否继续隐藏？**（RECOMMENDATION：是，本轮直到比赛级退出标准前保持隐藏）—— 两关暴露会把 QA/SV 治理压力扩到 5 关 × 6 房，比赛演示目前三关足以，隐藏关继续作为研发迭代内部环境。

---

## 7. 分阶段路线图

顺序按用户 §七 给出的骨架。**如果需要重排，下面给原因。**

### 路线总览（顺序严格，理由标 ★）

```
P0-STABILITY            （2 天估算，先做）
    │
    └─► P2.G1-B 碰撞所有权 + 旋转 footprint 接入生产
            │
            └─► P2.G1-C 场景治理 QA 扩展（自动化 44% → 85%+）
                    │
                    └─► P2.G1-D Y / surfaceHeight 语义统一
                            │
                            └─► P2.0-R 修订并批准三房布局蓝图 APPROVED
                                    │
                                    ├─► [并行可选] P1 L1 教学闭环（不阻塞 P2，但必须在 P3 前完）
                                    │
                                    └─► P2.1 Living 实施
                                            │
                                            └─► P2.2 Bedroom 实施
                                                    │
                                                    └─► P2.3 Entrance 实施
                                                            │
                                                            └─► P2.4 Dining / Laundry 兼容 + 布局治理
                                                                    │
                                                                    └─► P3 关键模型替换 + 视觉统一
                                                                            │
                                                                            └─► P4 猫事件演出 + 认知时间线 + 行为复盘
                                                                                    │
                                                                                    └─► P5 陌生用户试玩 + 比赛演示
```

**重排原因（与用户给的原顺序对照）：**
- 原用户路线第 1 条是 `P0-STABILITY` → 保留。
- 原 `P2.G1-B / P2.G1-C / P2.G1-D / P2.0-R / P2.1 / P2.2 / P2.3 / P2.4 / P3 / P4 / P5` 整体顺序保留。
- **新增并行 Gate**：P1（L1 教学闭环）放在 **P2.0-R 蓝图通过后、P2.1 Living 与 P2.2 Bedroom 实施期间并行做**（因为 P1 只改 dining/L1 task，不影响 L2 的 living/bedroom/entrance 代码，节省项目关键路径）。违反用户给出的优先级会提前做教学，但用户的九优先级约束里「新增关卡禁止」没禁止教学本身并行，且 P1 的资源占用较小（只改文案/教学 UI + 小规模 QA），所以可以并行，不算违反。
- **禁止重排到前面**：P3 换模型 / P4 时间线 / P5 试玩——全部在 P2.4 之后（前置硬依赖：视觉语义唯一必须先定）。

### 各阶段 Gate 退出标准（GO/NO-GO，每阶段的）

| Phase | Goal | GO 条件（必须全绿） |
|---|---|---|
| P0-STABILITY | 运行时稳定 + 路由兜底 | 5 条 URL 直接打开全部：canvas.height / vp.height > 0.6；phase 在 5s 内进 playing；console 0 error；Playwright canvas-height-can-play.spec 100% |
| P2.G1-B | collision + rotation + owner 接入 | collision.ts 读 rotationY；FirstPersonControls 调用两个过滤函数；单元测试 C1/C2/C3 100%；HEAD 数据回归 qa 0 fail |
| P2.G1-C | QA 扩展到 85%+ | G1-G5 / R1-R3 / C1-C5 / S1-S2 新函数全部有 vitest；npm run qa 对 HEAD 数据 0 blocker；自动化率 ≥ 85% |
| P2.G1-D | surfaceHeight / ObjectY 语义统一 | 选定 1 条规则（推荐绝对 Y）；4 TC 全迁到新规则；旧值对照表文档化；QA S1/S2 不告警 |
| P2.0-R | 蓝图 APPROVED | 3 份文档（蓝图/预算/checklist）通过红队审查；坐标经 QA 新 Gate 全部 PASS；DRAFT → APPROVED 状态更新；REJECT=0 |
| P2.1 Living | Living SV 七条件通过 | 自动 H1-H7 7/7 + 人工 I1-I7 7/7；茶几唯一 visual ×1；猫移钥匙 ≥2 方向可接近 |
| P2.2 Bedroom | Bedroom SV 七条件通过 | cnt-nightstand 与 Room visual 对齐（F→open→手机出现 3 步 10/10）；书架 DD 0；6/6 自动 + 6/6 人工 |
| P2.3 Entrance | Entrance SV 七条件通过 | 托盘 / 伞架 统一到直觉位置；西北角空位置无虚假视觉；6/6 自动 + 6/6 人工 |
| P2.4 Dining / Laundry 兼容 | 跨关回归 Dining / Laundry 的 TC 没被 P2.G1 改崩 | dining cnt-dining-table / cnt-dishwasher / cnt-trash / cnt-utensil-rack 通过老 qa；laundry 3 篮 + 9 物体通过老 qa；新增 qa G1 对 DF（dining/laundry）也过 |
| P3 关键模型 | 视觉统一 + 旗舰关视觉精品化 | 关键 5-8 模型换完；chunk 超 500KB ≤2；无 duplicate visual；Room3D 视觉与 TC 视觉合并点统一 |
| P4 猫演出 + 时间线 + 复盘 | L2 旗舰关「演出 / 过期记忆可视化 / 复盘时间线」齐 | 猫事件触发后 ≥2/5 玩家主动 E 更新；ResultPage Timeline 至少显示 2 条关键事件（过期 + 更新） |
| P5 陌生用户试玩 + 演示 | 比赛级退出标准到 §12 | 5 普通 + 2 AI/机器人学习者 7 人总通关率（§12）；演示模式 3 分钟录屏通 L2；MVP 9 条研究合同；QA certification 签版 |

---

## 8. 工作包与 commit 计划

每个工作包按用户 §八 强制字段（goal / why now / dependencies / allowed / forbidden / exact scope / auto tests / manual acceptance / rollback / commit boundary / push boundary / online URL / GO-NOGO / risk / visible result）。

---

### WP-0 · P0-STABILITY：生产运行时稳定与直接路由验证

| 字段 | 内容 |
|---|---|
| **goal** | 修复「直接 `/play/x` 不自动进 playing / canvas 高度偶发塌 / runtime 未断言」的回滚门禁；给后续 P2.G1/P2 加一层"push 后一定能玩"的基础保障 |
| **why now** | HEAD 1752f5a 刚修完 canvas 高度 + ArenaPage phase 兜底；现在立刻写 E2E 断言正好能把这次修复冻结；不做就下一次 PR 回归把 canvas 搞坏。 |
| **dependencies** | 无；可直接在 main 本地开发 |
| **allowed files** | `tests/e2e/*.spec.ts`（新增 1-2 个）；`tests/qa-layout.test.ts`（可能加 1 个断言辅助）；`vite.config.ts`（若 E2E 模式缺 flag 可补，禁止改其他）；`.github/workflows/deploy.yml` 若允许加 E2E 步可小改；**严禁改 src** |
| **forbidden files** | `src/**/*.{ts,tsx,css}` 除上述允许之外全部禁止；README 禁止；deploy 逻辑禁止改 Pages 路径 |
| **exact implementation scope** | (1) 写 `tests/e2e/direct-routing-and-canvas-height.spec.ts`：5 个 URL 直接访问，断言 canvas.getBoundingClientRect().height / window.innerHeight > 0.6，断言 5s 内 `window.useGameStore_unstable.getState().phase === 'playing'`（或等价 DOM 状态信号）；(2) 可选：给 ArenaPage 加 `data-phase` 属性或 `data-testid=arena-root-phase-X` 的可观察钩子（如真需要改 src 的极小 DOM 属性则允许，必须保持 3 行以内）。 |
| **automated tests** | `npx playwright test tests/e2e/direct-routing-and-canvas-height.spec.ts --project=chromium` 100% passed（必须本地可跑，如环境缺 chromium 就把断言改成 vitest jsdom 版，用 happy-dom 测路由守卫）；同时 npm run lint/test/build/qa 仍全绿。 |
| **manual acceptance** | 1. 本地 `npm run build && npm run preview`，然后手动访问 5 条 URL；2. 每条都能看到 3D 画面 > 半屏高；3. `/play/task-clean-table` 进去 5 秒内 briefing 消失、WASD 能按（或点击开始后 phase 切换）。 |
| **rollback method** | 工作包只加 1-2 个 spec 文件 + 极小 data-* 属性；回滚直接 `git revert WP0-commit` 或手动删文件。 |
| **commit boundary** | 独立 commit `test(e2e): P0-STABILITY direct routing + canvas height gate` |
| **push boundary** | E2E 全绿 + npm qa 全绿，push 到 main。 |
| **online verification URL** | push 后 5 条 Pages URL 逐一验证。 |
| **GO / NO-GO criteria** | GO=5/5 URL canvas.height>0.6vp + phase<=5s 进 playing；NO-GO=任何一条 URL 连续 3 次超时或断言 fail → 修完再 push。 |
| **estimated risk** | LOW（只加测试 + 可选 3 行 DOM 属性；不改游戏逻辑）。 |
| **expected visible result** | 肉眼不可见（纯门禁）；CI 报告里多一条 Playwright e2e 通过。 |

---

### WP-B · P2.G1-B：碰撞所有权与旋转 footprint 接入生产

| 字段 | 内容 |
|---|---|
| **goal** | collision.ts 真正消费 rotationY 与 collisionMode；FirstPersonControls 不重复拼 TC+DF（按 owner 过滤），解决 DTS-001/002/007 三个 BLOCKER。 |
| **why now** | FACT：DTS-006 DF position world→rl 修完后立刻爆发 DTS-001（rot 碰撞错）；所以 P2.0-R / P2.1 之前必须先做 G1-B；否则 Living 一实施就撞空气穿沙发。 |
| **dependencies** | P0-STABILITY 通过。 |
| **allowed files** | `src/game/collision.ts`；`src/components/arena3d/FirstPersonControls.tsx`；`src/game/sceneSchema.ts`（若 helper 需要改签名，不可删 getRotatedFootprint）；`src/types/object.ts`（Container 类型扩展 collisionMode/semanticKey，如果需要）；**禁止改 tasks/*.ts 与 decorFurniture.ts 任何坐标与尺寸值（只允许类型字段，不允许动数值）**。 |
| **forbidden files** | decorFurniture.ts / tasks/leave-home.ts / clean-table.ts / laundry-sort.ts 的 position/size/surfaceHeight 数值；Room3D.tsx（不动视觉）。 |
| **exact implementation scope** | (1) collision.resolveFurnitureCollision：加可选参数 rotationY，内部调用 sceneSchema.getRotatedFootprint 得到 rotated 尺寸再做 circleRectCollision（保持默认 undefined 行为不变以向后兼容）；(2) collision.resolveFurnitureCollision 可选参数 collisionOwner，'none' 直接跳过家具；(3) FirstPersonControls L394-398 处：decorFurniture 先按 shouldDecorProvideCollision 过滤；taskContainers 按 shouldContainerProvideCollision 过滤；然后再 flat；(4) 给上述三个函数加 vitest 单测覆盖 C1/C2/C3。 |
| **automated tests** | 新增 `tests/collision-rotation.test.ts` 与 `tests/collision-owner.test.ts`，场景：sofa-side rot π/2 时碰撞 AABB 正确；collisionOwner=none 的 entrance-tray TC 不参与 XZ 推挤；static-furniture TC 不与 DF 双撞；338 baseline + 新增单测 100%。 |
| **manual acceptance** | 本地 `npm run dev` 进入 L2，把 decorFurniture bedroom decor-bed 的 rotationY 临时设为 0/π/2 三种（仅在本地临时 JS 注释调试，不提交），观察碰撞是否匹配视觉（rot π/2 时 2.0x2.4 床应该沿 z 方向长 2.4，不沿 x 方向长）；测试完恢复改动。 |
| **rollback method** | 两个主要文件（collision.ts / FirstPersonControls.tsx）独立 commit；若出现玩家卡死/穿墙，`git revert WPB-commit` 直接回滚到 HEAD 旧逻辑，因为 G1-B 没改坐标，回滚后视觉与运行不受任何影响。 |
| **commit boundary** | 两个原子 commit：(a) `feat(collision): P2.G1-B rotationY footprint support`；(b) `feat(collision): P2.G1-B collisionOwner filter in allFurniture chain`。每个 commit 后必须 lint/test/build/qa 仍全绿。 |
| **push boundary** | 两个 commit 打包在一起 push main（基础设施类工作包允许 gate 通过后统一 push）；不能中间状态 push。 |
| **online verification URL** | Pages 的三个 play 页，每条都能 WASD 1 分钟不穿墙、不卡死。 |
| **GO / NO-GO criteria** | GO=单测 C1/C2/C3 100% + 老 qa 0 fail + 三个 play 页线上无回归；NO-GO=任何一项 fail 或 手动验证 rot π/2 碰撞 AABB 方向反了 → 修完再走。 |
| **estimated risk** | MID-HIGH（动了碰撞核心链，但没改坐标，单测可覆盖大部分路径；风险来自于「遗漏某条家具不支持 rotationY 时」的边界）。 |
| **expected visible result** | 玩家肉眼不可见（除非把 DF 从 world 改回 rl 后才会生效）；DF 家具 collision 现在"碰不到"的状态也保持不变，不会导致立刻穿模。 |

---

### WP-C · P2.G1-C：场景治理 QA 扩展

| 字段 | 内容 |
|---|---|
| **goal** | qa 自动化率从 44% → ≥ 85%（GLOBAL_LAYOUT_QA_SPEC §1-§2 的 10 NOT_AUTOMATED → 0，MANUAL_ONLY 3 → 1）；解决「npm run qa 全绿但实际布局有 SV1-8」的最大 QA 谎言风险。 |
| **why now** | P2.0-R（蓝图修订）必须基于新 QA 跑一遍；否则写出来的坐标过不了老 QA，但老 QA 又不查 DF/Owner/Reachability → 返工加倍。 |
| **dependencies** | P2.G1-B 通过。 |
| **allowed files** | `scripts/qa-layout.ts` 内增加函数（或同目录新增 `scripts/qa-governance.ts`，允许新增 1 个脚本文件，因为 QA 脚本是 infrastructure）；`tests/qa-layout.test.ts`；禁止修改 src/data 任何数值。 |
| **forbidden files** | decorFurniture.ts / tasks/*.ts / rooms.ts 的真实数据。 |
| **exact implementation scope** | 按 GLOBAL_LAYOUT_QA_SPEC §4 的规格，至少实现：G1(DF 在房间内)、G2(DF 不压门)、G4(DF 与 TC 碰撞重叠告警)、R1(容器至少 1 方向可达)、R3(scripted target 净空)、C1(rotation swap)、C2(collisionOwner none 不进链)、S1(surfaceHeight 不混用两种 pattern)、S2(object.y!=0 告警)。至少 9 个函数，每个函数 1 个 vitest + 至少 1 个 fail case。 |
| **automated tests** | `npm run qa` 对当前 HEAD 数据：fail 数 ≤ 新增 S1/S2 的 minor 告警（不新增 blocker 级 fail）；新增 QA 单元测试：至少 9 个 test，fail case 覆盖 ≥ 1 个。baseline 338 + qa test 全绿。 |
| **manual acceptance** | 至少 5 个 qa fail-case 能被触发（比如构造 DF 越界样本 → 跑 qa → 预期返回 blocker 并 exit1），证明新 QA 真能拦住错误布局。 |
| **rollback method** | QA 全部在 scripts/ 与 tests/，不影响生产 runtime；回滚 `git revert WPC-commit` 即可。 |
| **commit boundary** | 一个 commit `feat(qa): P2.G1-C governance checks (G1/G2/G4/R1/R3/C1/C2/S1/S2)`，必须通过 qa 与 单测。 |
| **push boundary** | qa/lint/test/build 全绿后 push。 |
| **online verification URL** | 本工作包不影响生产；但 Pages 部署后仍需保证三关能玩（纯 QA 代码一般不影响运行，但仍做 smoke）。 |
| **GO / NO-GO criteria** | GO = 自动化率 ≥ 85%（对照 GLOBAL_LAYOUT_QA_SPEC §2.5 数字：11→21 项 CURRENTLY_AUTOMATED）+ 至少 9 个 QA 新函数 + 9 个 vitest；NO-GO = 新增 QA 函数 < 7 个 或 HEAD 数据 qa exit 1（fail 是 blocker 级）。 |
| **estimated risk** | MID（纯 QA 层，但 `qa-layout.ts` 已有的函数命名和数据接口复杂，容易不小心把老检查搞坏，所以必须 baseline 全过。） |
| **expected visible result** | 开发者可见：`npm run qa` 输出新增 9 项绿条。 |

---

### WP-D · P2.G1-D：Y / surfaceHeight 语义统一

| 字段 | 内容 |
|---|---|
| **goal** | 统一 ContainerSpec.surfaceHeight 的解释规则与 ObjectSpec.initialPosition.y 在有 surfaceContainerId/hiddenInContainer 时的忽略规则（DTS-003/004）。 |
| **why now** | P2.0-R 重算新坐标时，nightstand/entrance-tray 的 surfaceHeight 会同时涉及绝对 Y 和相对 position.y；若规则未定，蓝图的 height 值写了也白写，未来维护者必踩。 |
| **dependencies** | P2.G1-C 通过。 |
| **allowed files** | `src/types/object.ts`（ContainerSpec 加注释）；`src/data/decorFurniture.ts`（类型注释）；`src/components/arena3d/Container3D.tsx`（或 placement.ts 里实际 surfaceHeight 函数 → 只加注释，不改运行时值）；4 个 TC 的 surfaceHeight 数值按统一规则迁移；**仅改数值与注释**。 |
| **forbidden files** | collision.ts / FirstPersonControls.tsx（G1-B 已完成，禁止回头动）。 |
| **exact implementation scope** | (1) 决定规则：推荐规则 A `surfaceHeight = 绝对 world Y（物体放置时的物体底部 Y）` 与 `getContainerSurfaceY` 实际一致；(2) 对照 P2_0_BLUEPRINT_RED_TEAM_REVIEW §3.8 的 4 个 TC 表，逐个迁移 surfaceHeight；(3) 给 QA S1 加规则 A 的引擎检测；(4) 给 ObjectSpec.initialPosition 加 TS JSDoc：`@ignored_when_surfaceContainerId`（不改运行时，只改类型注释保证维护者明白）。 |
| **automated tests** | 新增 QA S1 对 4 个 TC 断言规则 A；`npm run qa` S1 不告警；单测 S1/S2 通过。 |
| **manual acceptance** | 逐个进三关，近距离观察 obj-key / obj-phone / obj-umbrella / 9 件衣物放置在表面时不明显悬浮 / 插入（误差 ≤ 3cm）。 |
| **rollback method** | 工作包改动集中在 4 个 TC 的 1 个字段 + 注释；`git revert WPD-commit`。 |
| **commit boundary** | 一个 commit `refactor(data): P2.G1-D surfaceHeight rule A + 4TC migration`。 |
| **push boundary** | P2.G1-B/C/D 三个工作包合并 gate 通过后，**可以合并 B/C/D 三个 WP 的 4 个 commit 一次性 push main（基础设施类 gate 全过）**。 |
| **online verification URL** | 三关 Pages 页面：钥匙放在茶几表面正常；手机从抽屉出来正常；雨伞在伞架正常；衣物在篮口正常（视觉不悬浮）。 |
| **GO / NO-GO criteria** | GO = QA S1=绿，S2 告警 0，4 个 TC 放置视觉正常；NO-GO = 任何 1 个 TC 出现明显悬浮/插入桌面 ≥ 5cm。 |
| **estimated risk** | LOW（纯数值统一，不碰运行时行为）。 |
| **expected visible result** | 茶几 / 床头柜 / 伞架 / 托盘的物体放置 y 更精确；肉眼可见的穿模减少。 |

---

### WP-R · P2.0-R：修订并批准三房布局蓝图（APPROVED）

| 字段 | 内容 |
|---|---|
| **goal** | 将 `LEAVE_HOME_REALISTIC_LAYOUT_BLUEPRINT.md`、`LEAVE_HOME_ASSET_DIMENSION_BUDGET.md`、`P2_ROOM_BY_ROOM_IMPLEMENTATION_CHECKLIST.md` 三份蓝图文档从 DRAFT → APPROVED；坐标全部通过新 QA。 |
| **why now** | P2_0_BLUEPRINT_RED_TEAM_REVIEW §0 明确 DRAFT/NO-GO；§3 坐标 ACCEPT 7 / REVISE 9 / REJECT 6。必须在 P2.1 前把坐标改对、方向（DIR-001 ~ 006）修正完、B-001 ~ B-019 的 19 个候选坐标全部过新 QA（G1/G2/R3/C1/S1 全绿）。 |
| **dependencies** | P2.G1-B/C/D 全通过。 |
| **allowed files** | 仅限 `docs/design/` 下的 3 份蓝图文档 + 1 份 P2 实施清单（如果清单需要引用新 QA Gate ID）；**本轮不改任何 src 数据**（只改文档坐标表，把 APPROVED 坐标定下来供下一 WP 实装）。 |
| **forbidden files** | src/data/* 禁止（改数值的工作放到 P2.1/2/3，保持蓝图改完再实施的边界清晰）。 |
| **exact implementation scope** | (1) 修 DIR-001~006（6 个方向错误）：cat moved key 西南象限文字修正；entrance 靠 living 门的 z 方向判断修正（近门 = 更小 z）；spawnRotation π 面朝北修正；Living/Bedroom/Entrance ASCII 图门洞位置修正；(2) 修 B-001（伞架与鞋子同坐标）→ 挪动鞋子或伞架 rl 坐标；B-002（托盘在鞋柜顶上 collisionOwner 必须 none）；B-003（cat key 东/北移 0.5m+ 避开植物东北角）；B-004（bedroom chair 西/南挪 ≥ 0.5m 让出门洞缓冲）；B-005（left nightstand x≈-1.5 紧贴床西侧）；B-006（wardrobe x 东移 ≥ 0.1m 解除越界）；B-007/008（文档化 y/surfaceHeight 语义）；(3) 文档状态从 DRAFT → APPROVED 并写清通过 QA 版本号；(4) 给出三张 ASCII 俯视图（Living/Bedroom/Entrance）更新版，标出所有关键目标位置与门洞走行带。 |
| **automated tests** | （纯文档）对文档里的候选坐标做「脚本化 QA 伪跑」：在 `node` REPL 里（不提交）用 qa-layout 的新函数逐个跑 G1/G2/G4/R3/C1/S1 → 把结果写进蓝图文档 §ACCEPTED 附录。 |
| **manual acceptance** | 红队审查走一遍：§4 的 ASCII 图 ×3 与门洞方向一致；关键路径（§二 12 步 Stage 动线）能在 ASCII 图上肉眼画出不被家具挡的通道；REJECT=0 条。 |
| **rollback method** | 只改 docs/；`git revert WPR-commit` 即可。 |
| **commit boundary** | 一个 commit `docs(layout): P2.0-R APPROVED blueprints (Living/Bedroom/Entrance)`。 |
| **push boundary** | 三份文档 DRAFT → APPROVED 状态更新 commit 完后可 push（文档独立 commit）。 |
| **online verification URL** | 文档可见 GitHub 仓库 / Pages（docs 如需在 Pages 展示可不做，本项目文档默认只在 repo 内可见）。 |
| **GO / NO-GO criteria** | GO = 三份文档 header `APPROVED` + 19 个候选坐标 QA 伪跑 19/19 G1/G2/G4/R3/C1/S1 不 block + 红队 DRAFT-REVIEW 签字；NO-GO = 任何 1 条候选坐标仍 block 或 ASCII 图门洞位置错。 |
| **estimated risk** | MID（文档工作，但是否能把 QA 伪跑真做对依赖 P2.G1-C 的函数接口清晰）。 |
| **expected visible result** | 三份蓝图文档标题从 DRAFT 改为 APPROVED；仓库内有可引用的「Living/Bedroom/Entrance 三张最终 ASCII 俯视图」。 |

> **并行可选 Gate（不阻塞关键路径）：WP-1 · P1 L1 教学闭环** — 放在 WP-R 蓝图 APPROVED 之后、与 P2.1 Living 同时并行开发。P1 的详细 WP 与 P2.1/2/3/4 类似，用户 §七 已明确 P1 要求，本计划因篇幅不把 P1 展开成完整 15 字段，但必须遵守：允许文件仅 L1 task dialog/objective + dining 小量 DF/TC；不碰 L2/L3；3 陌生用户 2/3 首次 E 完成率；独立 commit `feat(l1): P1 teaching closeout with 3-user internal trial`；在 P3 前必须完成。

---

### WP-2.1 · P2.1 Living 实施

| 字段 | 内容 |
|---|---|
| **goal** | Living 家具视觉 ↔ DF collision ↔ TC 交互位置一致；茶几唯一 visual ×1；沙发碰撞真生效；猫移钥匙位置 ≥2 方向可达。 |
| **why now** | WP-R 蓝图 APPROVED，Living 是第一关跨房出发房间 + 钥匙猫事件发生地，是所有后续路径的基础节点。 |
| **dependencies** | WP-R APPROVED。 |
| **allowed files** | `src/data/decorFurniture.ts → living 数组`；`src/components/arena3d/Room3D.tsx → renderLiving()`；可选 `src/components/arena3d/models/ModelRegistry.ts`（最多 10 行调整 side-table 的 modelId 非茶几）。最多 3 文件，符合 0.2 规则。 |
| **forbidden files** | tasks/leave-home.ts（P2.1 不动 cnt-coffee-table，保持 (0,0.3)）；其他房间 decorFurniture；Room3D.render* 其他函数。 |
| **exact implementation scope** | 严格照着 WP-R Living 最终 ASCII 图 + room-local 坐标表做：(1) decorFurniture living 14→13 条（删除 side-table），剩余 position/rotationY/visualOwner/semanticKey 按蓝图写；(2) Room3D.renderLiving 删除茶几外壳与茶几装饰、删除 side-table CoffeeTableModel、落地灯 2 z 位置 +2.0、主沙发 group z=-2.5、猫 group 移到沙发表面 y=0.45；(3) collision/owner 字段由 G1-B 已接入生效。 |
| **automated tests** | 新 QA G1/G2/G4/R3/C1/S1 对 Living DF/TC 全绿；H-L1-H-L7（自动 7/7，qa-layout/checklist 映射到的 QA Gate）；baseline 338 + WP-B/C 单测全绿。 |
| **manual acceptance** | I1-I7（人工 7/7）：松手 5s 不抖；茶几 4 方向 F；10 次 spawn→bedroom 门洞 / entrance 门洞；猫钥匙 2 路径 × 5 次；一圈 3 次 0 穿模；top-down（KeyV）与视觉坐标误差 ≤ 0.2m。 |
| **rollback method** | WP-2.1 commit 单独；`git revert WP21` 回到 WP-R 的代码状态，L2 仍可玩但碰撞仍是旧穿沙发空挡状态（可接受）。 |
| **commit boundary** | 独立 commit `feat(layout): P2.1 Living SV closeout`。 |
| **push boundary** | 自动 7/7 + 人工 7/7 全过 → push main（Living 一个房一个房 push，符合用户节奏）。 |
| **online verification URL** | `/play/task-leave-home` Living 区域走一遍。 |
| **GO / NO-GO criteria** | GO = 自动 7/7 + 人工 7/7 + 三关老 qa 无回归；NO-GO = 任何一条 I 连续失败 ≥ 2/10 次 → 修正或回滚。 |
| **estimated risk** | HIGH（第一次把 DF position 改到正确 rl，可能暴露 G1-B 的边界 bug；Living 家具多，13 条 DF 坐标 + Room3D 可视化改动一起，回滚可能性 20-30%）。 |
| **expected visible result** | Living 视觉里「茶几只有 1 个（TC 位置）」「沙发真能挡路（不再穿）」「猫在沙发上而不是茶几旁边」。 |

---

### WP-2.2 · P2.2 Bedroom 实施（L2 最高优先的房，时间不够时先保 2.2 和 2.3）

| 字段 | 内容 |
|---|---|
| **goal** | Bedroom 的右床头柜 visual 与 TC cnt-nightstand 完全重合；手机 hidden → 打开抽屉 → F 拾取的三步 OT bug 10/10 修复；bedroom bookshelf DD 解除；bed/chair/wardrobe 视觉×碰撞一致。 |
| **why now** | Bedroom cnt-nightstand 错位 1.8m 是 OT 核心 Bug，直接决定 L2 玩家能不能拿到手机，是 Golden Path 第一步分叉点（没手机就进入不了 or 条件触发猫事件，破坏闭环）。 |
| **dependencies** | P2.1 Living 全过。 |
| **allowed files** | `decorFurniture.ts → bedroom 数组`；`tasks/leave-home.ts`（只允许改 cnt-nightstand position/size/surfaceHeight + obj-phone initialPosition，不改 stage/event 逻辑）；`Room3D.tsx → renderBedroom`（书架 z+1 北移，最多再改 chair 位置）。 |
| **forbidden files** | Living / Entrance / dining / laundry；scenes / 调色板 / 全局 Fallback。 |
| **exact implementation scope** | (1) bedroom 10 条 DF 全部改为正确 rl（decor-bed x=0,z=-0.8 而非 world -8/-0.8，其他 9 条按 bedroom.center=(-8,0,0) 换算：x_new = x_old - (-8)）；(2) cnt-nightstand 从 (+0.5,+0.8) → (+1.5,-1.5) 对齐 Room 右床头柜 visual；(3) obj-phone initialPosition 与 hiddenInContainer 跟随右柜新坐标；(4) Room3D renderBedroom 书架北移 z 从 +1.0 到 +2.0，chair 从 +2.5 南移 ≥0.5m 让出门洞缓冲。 |
| **automated tests** | QA G1/G2/G4（DF 不压门）/R3（如果 cnt-nightstand 有 scripted 事件触达）/C1（bed rot 0 正常）/S1（nightstand surfaceHeight 规则 A）；baseline 全绿；自动 Bed-H 6/6 全绿（按 P2 checklist §H）。 |
| **manual acceptance** | I1-I6 Bedroom 人工 6/6：spawn→bedroom 门洞→right nightstand（visual 的位置）按 F → 打开抽屉 toast → 手机出现 → F 拾取（3 步 × 10 次，10/10 通）；书架 DD 10 次往返 0 卡；椅子与门洞净距 OK。 |
| **rollback method** | 独立 commit；`git revert WP22`。 |
| **commit boundary** | `feat(layout): P2.2 Bedroom SV closeout (cnt-nightstand OT fix + DD clear)`。 |
| **push boundary** | 人工 F→open→手机 10/10 全过；自动 6/6 全过 → push main（一房一 push）。 |
| **online verification URL** | `/play/task-leave-home` → bedroom 路径。 |
| **GO / NO-GO criteria** | GO = cnt-nightstand 3 步 10/10 + DD 0 次卡；NO-GO = 任何 1 次连续 3 次按 visual 床头柜 F 打不开 → 必须修。 |
| **estimated risk** | HIGH（Bedroom 10 条 DF 全部从 world 换成 rl，是 DTS-006 的集中爆发区；G1-B rot 对 bed/chair 若有 bug 会在这里暴露）。 |
| **expected visible result** | Bedroom 的右床头柜抽屉按 F 真的能开，玩家不需要记住"假位置旁边空地上真抽屉"。 |

---

### WP-2.3 · P2.3 Entrance 实施（时间不够优先级 = Bedroom 并列高）

| 字段 | 内容 |
|---|---|
| **goal** | 玄关托盘 / 伞架统一到「直觉靠近 living 门洞位置」（或西北角统一后 Room3D 删除 fake visual）；彻底消除「玩家把东西放门洞旁托盘却按 F 没反应」的双份视觉误导。 |
| **why now** | D.3 Entrance SV 是三大 OT 核心 Bug 之一，玩家最容易误解的托盘/伞架位置直接污染 wrongPlacements 指标与玩家信心。 |
| **dependencies** | P2.2 Bedroom 全过。 |
| **allowed files** | `tasks/leave-home.ts`（cnt-entrance-tray / cnt-umbrella-stand / obj-umbrella 三项坐标）；`Room3D.tsx → renderEntrance`（删除或移动门洞旁托盘 fake visual / 伞装饰，最多 2 处 group）。 |
| **forbidden files** | decorFurniture.ts → entrance 数组保持不动（8 条 DF 已经正确）。 |
| **exact implementation scope** | 决策（沿用蓝图二选一，由 WP-R 最终定）：方案 A（直觉派，推荐）TC 移到门洞旁；方案 B（西北派）Room3D 删除假 visual + 入口提示文字说明「托盘在西北角」。无论哪条：semanticKey / visualOwner / collisionOwner 必须写齐（entrance-tray 在鞋柜顶上 → TC collisionOwner=none）。 |
| **automated tests** | G1/G2（TC/DF 不压门）/R1（tray 至少 1 方向可达）/C2（collisionOwner none 不推）/S1（surfaceHeight 统一）；自动 H 6/6。 |
| **manual acceptance** | I1-I6 Entrance：直觉位置 10/10 按 F 能放；伞在伞架上按 F 拿；双份托盘/伞架视觉 count=1；0 次「按错假托盘 F」。 |
| **rollback method** | 独立 commit；`git revert WP23`。 |
| **commit boundary** | `feat(layout): P2.3 Entrance SV closeout (tray + umbrella stand unified)`。 |
| **push boundary** | 自动 6/6 + 人工 6/6 全过 → push main。 |
| **online verification URL** | `/play/task-leave-home` → entrance。 |
| **GO / NO-GO criteria** | GO = 玩家首次走到 entrance 不用看文档就能放手机到托盘（≥ 8/10 真人 walkthrough 不需要提示）；NO-GO = 仍有两个「托盘」视觉在不同位置。 |
| **estimated risk** | MID-HIGH（TC 位置改动会影响 Golden Path 路径长度，若离 living 门洞太远会增加动线时间，需要在 WP-R 时定量算 0.8~4.5m 启发式门距）。 |
| **expected visible result** | 玄关第一眼就能看到「托盘 + 伞架」且 F 真能交互。 |

---

### WP-2.4 · P2.4 Dining / Laundry 兼容与布局治理

| 字段 | 内容 |
|---|---|
| **goal** | P2.G1 完成后，dining 与 laundry 两个房间的 DF / TC 也跑过 G1/G2/G4/R1/C1/S1 新 QA，确保 Dining (L1) 与 Laundry (L3) 不会被 G1 改动引入回归。 |
| **why now** | G1-B/C 把 collision/QA 链换了；L1/L3 的 DF 如果也是 world 值误写，G1 生效后会立刻穿模/卡门，必须在 P3 前把两关 dining/laundry 也过一遍。 |
| **dependencies** | P2.3 通过。 |
| **allowed files** | `decorFurniture.ts → dining + laundry 数组`；`tasks/clean-table.ts / laundry-sort.ts`（只允许 position 数值，不允许改 stage/event/predicate）；`Room3D.tsx → renderDining / renderLaundry`（只动小范围）。 |
| **forbidden files** | Living / Bedroom / Entrance / Kitchen。 |
| **exact implementation scope** | (1) 跑 G1/G2/G4/R1/C1/S1 对 dining/laundry 的 DF + TC；(2) 修复 fail blocker（若有）只修坐标/rot/semanticKey/collisionOwner；(3) laundry 三篮位置做小量可达性检查（玩家从 4 方向接近每个篮至少 1 方向通）。 |
| **automated tests** | L1 与 L3 的 qa-layout + qa 全部全绿。 |
| **manual acceptance** | 快速 walkthrough：L1 进游戏能 F 拿 cup/tissue/fork 放对；L3 进游戏能 F 拿一件衣物放对篮子。 |
| **rollback method** | 独立 commit；`git revert WP24`。 |
| **commit boundary** | `feat(layout): P2.4 Dining + Laundry SV + QA pass`。 |
| **push boundary** | Dining / Laundry QA 绿 + 人工 walkthrough 过 → push main（可以和 P2.3 合并吗？不，必须保持 commit 边界清晰，可独立回滚 Dining/Laundry）。 |
| **online verification URL** | `/play/task-clean-table` 与 `/play/task-laundry-sort`。 |
| **GO / NO-GO criteria** | GO = G1/G2/G4/R1/C1/S1 对 dining+laundry 0 blocker；NO-GO = L1 或 L3 有一个 TC 被新 QA 卡住 → 修完再走。 |
| **estimated risk** | MID（G1 基础设施扩展后的回归）。 |
| **expected visible result** | L1 餐桌椅/洗碗机/垃圾桶位置真的能走，L3 三个洗衣篮真的能接近。 |

---

### WP-3 · P3 关键模型替换与视觉统一

| 字段 | 内容 |
|---|---|
| **goal** | 仅替换 **5-8 个关键模型**（Living 沙发茶几一体、Bedroom 床头柜+手机、Entrance 鞋柜+托盘、猫、幽灵），不换全量；同时把 Room3D 的 duplicate visual（茶几 shell、边几 CoffeeTableModel、假托盘）进一步用 P2 已做的 semanticKey/visualOwner 规则做最后一次清理。 |
| **why now** | P2.4 完成后，语义所有权 ×1；这时候换模不会「同一个家具改两次位置」（否则在 P2 前换 = 返工率 100%）。 |
| **dependencies** | P2.4 通过 + P1 并行完成。 |
| **allowed files** | `src/components/arena3d/models/*`（新增/修改 5-8 个 FallbackModel）；`ModelRegistry.ts`；`Room3D.tsx` 对应 3 房的 visualOwner 清理（删除剩余的茶几 shell / 假托盘）；禁止动 core 引擎文件。 |
| **forbidden files** | 其他 3 关（Kitchen/Bath 等隐藏关模型）；全局调色板 / stylizedMaterials 除非有直接证据证明偏色否则不动（避免大面积视觉回归）。 |
| **exact implementation scope** | (1) 5-8 个关键模型：sofa_main + coffee_table_integrated / nightstand + phone / entrance_shoe_cabinet_with_tray / cat_model / sock_ghost（至少这 5）；(2) chunk 监控（`npm run build` chunk warn 不能超过 2 条）；(3) collision footprint 不因为换模改变（用旧尺寸 × 新 visual 对齐，G1-B 已保证碰撞正确）。 |
| **automated tests** | baseline 338 + WP-B/C qa 全绿；chunk warn ≤ 2；无 ModelAsset retry 错误（build 产物检查）。 |
| **manual acceptance** | 5 个关键模型在 3 房截图，视觉上一件家具只有一个 mesh，不是两件叠加；家具朝向与 collision footprint 一致（rot π/2 的边柜视觉长边 = 碰撞长边）。 |
| **rollback method** | 工作包只改 models + Room3D 几行；`git revert WP3`。 |
| **commit boundary** | 两个 commit：`feat(models): P3-1 key 5-8 models` + `refactor(models): P3-2 visualOwner dedupe Room3D`。 |
| **push boundary** | chunk warn ≤ 2 + qa 绿 + 视觉验收签字后 push main。 |
| **online verification URL** | 三个 3D 页 Pages 直开，首屏加载不超过 4s（普通宽带）；画面无 2 件茶几重叠。 |
| **GO / NO-GO criteria** | GO = 5-8 关键模型换完且 Duplicate Visual 检查 0；NO-GO = chunk warn > 3 或家具 mesh 双层叠加 ≥ 1 处。 |
| **estimated risk** | MID（换模型容易产生 chunk 过大与尺寸小偏差）。 |
| **expected visible result** | 家具看起来更像真家 + 猫/幽灵是单独设计形象而非 primitives（比赛演示画面显著提升）。 |

---

### WP-4 · P4 猫事件演出 + 认知时间线 + 行为复盘

| 字段 | 内容 |
|---|---|
| **goal** | (1) 猫事件 se-cat-pushes-key 增加「猫先跑过茶几留下脚印 → 钥匙滑走」的小演出（CatPrintsEffect 已经有接入点，增强即可）；(2) ResultPage 增加 1 条「memory 写入 → outdated → probe → update → achieved」时间轴；(3) L3 错放取回行为核实，必要时修命令链（不新增 L3 专用命令，用已有的 pick-from-placed 机制若代码已存在则启用，不存在则不新增功能只改错误反馈）。 |
| **why now** | P3 视觉统一后，旗舰关 L2 需要「观众一眼看懂过期记忆」的演出 + 复盘页时间线能解释失败。 |
| **dependencies** | P3 通过。 |
| **allowed files** | L2 演出型 effect 文件（如果在 components/arena3d/effects 下）；`src/pages/ResultPage.tsx` + 新增一个独立 `Timeline.tsx` 组件；`src/game/commands.ts`（若核实取回确实 Bug 则小修 executePlace / pick 的 heldEntityId 逻辑，不新增函数）；L3 laundry-sort.ts briefing/label 小改（可选分类标签强化）。 |
| **forbidden files** | Scene Graph 激活（KEEP_FROZEN，Timeline 直接从 events/memory 聚合）；Session 类型新增字段（时间线直接从已有字段聚合，不在本轮 P4 改 schema）。 |
| **exact implementation scope** | (1) 猫演出：在 se-cat-pushes-key 触发后，显示 1.5s CatPrints 脚印从茶几 → 西南方向走 + 钥匙做一个 0.6s 平移动画（不做物理弹跳）；(2) Timeline：按事件类型着色（memory write 蓝 / outdated 红 / probe 黄 / update 绿 / goal 紫）横向时间轴 widget，支持悬停看事件详情；(3) L3 前置核实：错放 category → executePlace 是否拒绝并保留 heldEntityId？已放置的物体能否 pick 回？如果确实错放后 heldEntityId 丢失且取不回 → 最小化修 executePlace 行为（类别不匹配时不写入 container，heldEntityId 保留），**不新增 L3 专属 pick 命令**。 |
| **automated tests** | 后端 threeLevelBackendSim 对 L2 仍 100%；L3 错放回归测试（加 1 个 vitest 验证错放不丢 hand）。 |
| **manual acceptance** | L2 现场 walkthrough 5 次：猫脚印 + 钥匙动画是否自然出现 ≥ 4/5；ResultPage 打开一个 L2 已结束 session，Timeline 能看到至少 1 条「outdated 红色 → update 绿色」双事件；L3 walkthrough 故意把一件深色衣物放白色篮 → 类别错 → toast 提示 + 手里还拿着衣服（heldEntityId 未丢）→ 然后能拿到深色篮重新放。 |
| **rollback method** | `git revert WP4a-cat` / `git revert WP4b-timeline` / `git revert WP4c-l3`。 |
| **commit boundary** | 3 个独立 commit：猫演出、Timeline、L3 取回（若需要修）。 |
| **push boundary** | 3 个独立通过 → 可分别 push（时间紧也可打包）。 |
| **online verification URL** | L2 + ResultPage。 |
| **GO / NO-GO criteria** | GO = 猫动画 ≥ 4/5 触发 + Timeline 有红绿点 + L3 错放可恢复；NO-GO = 任一项 fail。 |
| **estimated risk** | MID-HIGH（Timeline UI 代码复杂度中等、commands 修取回路有风险）。 |
| **expected visible result** | L2 猫从茶几把钥匙推走时肉眼可见脚印动画；ResultPage 多了一条「时间轴」。 |

---

### WP-5 · P5 陌生用户试玩 + 比赛演示

| 字段 | 内容 |
|---|---|
| **goal** | 7 人（5 普通用户 + 2 AI/机器人学习者）总通关率 + L2 Golden Path 证据达到 §12 退出标准 + 最小 MVP 9 条研究契约补齐 + 演示模式（3 分钟 walkthrough）。 |
| **why now** | 所有产品 P0-P4 完成后，才能真正把「玩家行为失败」归因为认知/策略，而不是 SV 误导。 |
| **dependencies** | P4 通过 + P1（L1 教学）通过。 |
| **allowed files** | MVP-01 (version 字段) 的 session start 写入（允许改小范围的 session store 初始化）；MVP-04 memory override/outdated 弱关联（允许在 memory write event 上加字符串字段，不动类型核心）；演示模式只在 `DEV && import.meta.env.VITE_DEMO_MODE === 'true'` 生效，不在生产默认启用；demo 专用脚本可放 scripts/ 下（如果真的需要演示 setRobotPosition 走一键通关）。 |
| **forbidden files** | 正式研究众包 / 移动端 / 云端账号（全部禁止）。 |
| **exact implementation scope** | (1) MVP 9 条按 gap_report §2.2 路径最小化：schema_version=1，app_version=package.json.version，task_version=task.id+hash，scene_version=room+decor hash（这 4 条字段不进入 SessionData 正式类型也行，写在 JSON 外层或 QA 附件中，不强求改 types/session.ts）；seed 选方案 A NOT_NEEDED；MVP-04 memory override/causeByEventId 写事件 tag；MVP-06 goal_achieved_times 后处理；MVP-09 QA certification 附件 JSON。(2) 7 人真人试玩 + 记录；(3) 演示模式（仅当时间允许）：把 L2 Golden Path 做成「按一下 Demo 键自动走 3 分钟」的自动脚本（使用开发 Debug API 但不走生产路径）。 |
| **automated tests** | 所有 baseline + qa 全绿；MVP 版本字段的写入库存在单元测试。 |
| **manual acceptance** | 5+2 试玩签字记录表；L2 5 普通玩家 ≥ 3/5 通关；演示模式能录一条无卡顿无 bug 的 L2 完整通关屏。 |
| **rollback method** | MVP 字段写入是增量，回滚不影响默认运行；演示模式默认关闭回滚安全。 |
| **commit boundary** | 至少 2 个 commit：`feat(research): P5-1 MVP9 minimum contract` + `docs(playtest): P5-2 7-user playtest summary`。 |
| **push boundary** | MVP qa 绿 + 7 人记录表签完 → push main。 |
| **online verification URL** | 所有公开 URL + Session JSON 下载后包含 MVP version 字段。 |
| **GO / NO-GO criteria** | GO = §12 退出标准 15 条中 ≥ 13 条；NO-GO = MVP9 < 7/9 或 L2 Golden Path < 2/5。 |
| **estimated risk** | HIGH（真人试玩不可控，需要至少 1-2 天组织与现场记录）。 |
| **expected visible result** | 研究有效样本 N=7+（有效混杂率 < 20%）；比赛现场可放 L2 3 分钟通关演示视频。 |

---

## 9. 测试与人工验收矩阵

| 自动化测试（绿 = required） | P0 | G1-B | G1-C | G1-D | 2.1 | 2.2 | 2.3 | 2.4 | P3 | P4 | P5 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| lint (oxlint 0 err) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| test (vitest 338 baseline) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| new unit (collision rot / owner) | — | ✅ C1/C2/C3 | — | — | ✅ | ✅ | ✅ | ✅ | — | — | — |
| new QA unit (9 functions) | — | — | ✅ G1-R3-S2 | — | ✅ | ✅ | ✅ | ✅ | — | — | — |
| build (Vite, chunk warn ≤N) | ✅ N=1 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ N=2 | ✅ | ✅ |
| npm run qa (222+new) | ✅ | ✅ | ✅(新门) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| playwright: direct-route + canvas | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| playwright: L1/L2/L3 command flow | 可选 | — | — | — | ✅ | ✅ | ✅ | ✅ | — | — | — |

| 人工验收（每条：操作 + 通过标准） | 负责阶段 |
|---|---|
| A1：5 条直接 URL → canvas 高度正常 + phase<=5s 进 playing | P0-STABILITY |
| A2：L1 3 陌生用户 → ≥ 2/3 首次按 E 不看文档 + 2/3 通关 L1 | P1 |
| A3：Living 茶几 4 方向 / 门洞 ×10 / cat key 2 方向 ×5 / 一圈 0 穿模 / top-down 误差 ≤0.2m | P2.1（I1-I7） |
| A4：Bedroom cnt-nightstand F→open→手机出现 3 步 ×10 / 书架 DD 0 / chair 净距 | P2.2（OT 核心） |
| A5：Entrance 托盘直觉位置 F 能放 ×10 / 伞架拿伞 ×10 / Duplicate Visual count=1 | P2.3 |
| A6：Dining / Laundry L1 L3 快速 walkthrough，F 拾取/放置各 1 次成功 | P2.4 |
| A7：5-8 关键模型 Duplicate Visual 0 + 家具视觉朝向与 footprint 长边一致 | P3 |
| A8：L2 猫脚印+钥匙动画自然 ≥4/5；Result Timeline 至少 1 条 红(outdated)→绿(update)；L3 错放不丢手 | P4 |
| A9：5 普通用户 + 2 AI/机器人学习者 7 人总试玩（通关率 / Golden Path / 主动 E 更新）+ 演示模式录屏 3 分钟 | P5 |

---

## 10. GitHub Pages 在线验收策略

**验收方式：** `push main → 等 Actions deploy 完成 → 手动 + automation 两层`

- **自动化层（push 后 10 分钟内跑一遍）**：用 Playwright（同 P0）跑 `/`、`/tasks`、`/play/task-clean-table`、`/play/task-leave-home`、`/play/task-laundry-sort` 5 条 → 抓 canvas 高度断言 + phase 进 playing + console 0 error 级。
- **人工层（每个 WP 的 Gate 人工签字）**：
  - P2.1/2/2.3/P3 这 4 个影响视觉的 WP 必须 Pages 手动验收，**禁止本地 dev 通过就直接推到 main 不管线上**。
  - 线上验收 URL 清单（公开）：
    - `https://asandstar.github.io/homemem-arena/`（首页）
    - `https://asandstar.github.io/homemem-arena/tasks`（任务选择）
    - `https://asandstar.github.io/homemem-arena/play/task-clean-table`（L1）
    - `https://asandstar.github.io/homemem-arena/play/task-leave-home`（L2，最关键）
    - `https://asandstar.github.io/homemem-arena/play/task-laundry-sort`（L3）
    - `https://asandstar.github.io/homemem-arena/result/task-leave-home?sessionId=demo`（如果结果页支持 demo session，否则用实际 session 导出 JSON 验证）
    - `https://asandstar.github.io/homemem-arena/data/task-leave-home`（Session JSON 下载页，MVP 版本字段是否在 JSON 中）
- **回滚策略（线上真出问题时）**：
  - 如果某个 WP 的独立 commit 刚 push 完线上发现 regression，立刻 `git revert <commit>` 然后 push main（因为每个 WP 独立 commit，可精确回滚）。
  - P2.G1-B/C/D 三个基础设施 commit 会在一个 push 里一起走；如果回归可一起 revert 不会影响 Living 数据。
  - 回滚后，在仓库 Actions 页面确认 deploy 成功，再手动开 5 条 URL 做 1 分钟 smoke。

---

## 11. 不做事项（严格红线，§九 优先级约束对齐）

| 编号 | 不做内容 | 放入阶段 | 原因（对齐 §九） |
|---|---|---|---|
| 1 | 新增公开关卡（第 4-5 关） | 直到 P5 退出标准前一律不做 | 优先级把「新增内容」排在最末尾；3 关公开足够 |
| 2 | 激活 Scene Graph（每帧更新、管理家具坐标/碰撞/交互目标） | P5 前一律不做（KEEP_FROZEN） | Scene Graph GO 条件未满足 ≥ 2 consumer |
| 3 | 程序化随机房型（random room layout） | 永远（本 V2 计划内不做） | 比赛级垂直切片必须固定可控布局，研究有效依赖版本级 QA 认证 |
| 4 | 大规模剧情重写（narrative 全改） | P5 前不做 | P2/P3/P4 还有大量硬 blocker，剧情不是瓶颈 |
| 5 | 正式研究众包（MTurk / 问卷星 / 100 人） | P5 前不做 | MVP 9 条 + SV 七条件未过，众包数据 100% 污染 |
| 6 | 全量高模替换（所有 120+ 家具换 GLB） | P3 只做 5-8 关键，其余保持 Fallback 不换 | 视觉一致的瓶颈是「语义唯一」不是高模；chunk 545KB 已接近阈值 |
| 7 | 移动端全面重构（VirtualJoystick / 触屏手势 / 响应式 HUD） | 本轮不做（README 已有 Joystick，但不做 5 用户验证级重构） | PC 浏览器为主比赛环境，移动可玩但不投入资源 |
| 8 | 云端账号系统 / 排行榜 / 远程 Session 上传 | 永远（本 V2 计划内） | 本地 JSON 导出足够研究 MVP，不做基础设施 |
| 9 | 把 Scene Graph / 程序化房型等「听起来很炫的功能」写进对外 README 卖点 | 严禁（§三 1.C 硬约束） | 违反研究声明真实性：写了就等于对外声称 SG 在生产驱动，与事实（0 import）不符 |
| 10 | L3 新增「pick-from-placed」独立命令 | P4 前不做；P4 核实现状后若真需要优先修 executePlace 保留 heldEntityId，不新增独立命令 | 用户 §七 明确要求；不新增 L3 专属取回命令 |

---

## 12. 预计达到比赛级垂直切片的退出标准（15 条）

1. ✅ **运行稳定**：P0-STABILITY 直接 5 条 URL canvas 高度>0.6vp、phase≤5s 进 playing、console 0 error 连续 3 次全绿。
2. ✅ **P2.G1 Gate**：B/C/D 三个工作包全部 GO；碰撞 rotation 支持 + owner 过滤生效；QA 自动化率 ≥ 85%；surfaceHeight 统一规则 A。
3. ✅ **P2.0-R APPROVED**：三份蓝图 header APPROVED + 19 候选坐标 19/19 通过新 QA + ASCII 方向正确。
4. ✅ **Living SV**：7/7 自动 + 7/7 人工；茶几 ×1 visual；猫钥匙 ≥2 方向可达。
5. ✅ **Bedroom SV**：cnt-nightstand OT 核心 Bug F→open→手机 10/10 修复；书架 DD 0。
6. ✅ **Entrance SV**：托盘/伞架直觉位置 Duplicate Visual=1；8/10 首次走 entrance 的玩家不需要提示就能放手机。
7. ✅ **Dining/Laundry 兼容**：G1/G2/G4/R1/C1/S1 对 L1/L3 0 blocker。
8. ✅ **L1 教学**：3 陌生用户 2/3 首次 E 不看文档完成率 + 2/3 L1 通关。
9. ✅ **L2 旗舰关闭环证据**：5 陌生用户 ≥ 3/5 走 Golden Path；≥ 2/5 在猫事件后主动执行「E 更新钥匙记忆」。
10. ✅ **L3 可玩 + 策略分化**：5 陌生用户 ≥ 3/5 通关；至少观察到 2 种不同策略；神秘衬衫分类 ≥ 3/5 正确；错放后不 hard fail（不丢手）。
11. ✅ **MVP 9 条研究契约**：至少 7/9 通过（seed 方案 A NOT_NEEDED 可过；version 4 条 / memory override / goal times / QA certification 必须有）。
12. ✅ **研究有效样本 N≥5**：5 条 L2 session QA certification = pass（空间无效混杂率 < 20%）。
13. ✅ **视觉统一 & 关键模型**：5-8 关键模型替换完成；Duplicate Visual=0；chunk >500KB ≤2。
14. ✅ **行为复盘时间线**：ResultPage 有一条至少覆盖 2 条关键记忆事件的着色时间线；至少 1 条 demo L2 session result 页打开时间 < 3s。
15. ✅ **比赛演示准备**：L2 演示模式（或录屏）3 分钟完整通关；对外 README/Pitch Deck 不再写 Scene Graph 已生产激活、不写「正式 benchmark」、不写「提升现实记忆」（严格符合 §一 1.B/C 禁止声明）。

---

## 13. 下一步唯一推荐工作包

### **WP-0 · P0-STABILITY**

**为什么是它（而不是 P2.G1-B / 换模型 / 加关卡）：**
- 本轮 S1 刚刚完成 canvas 高度 + ArenaPage phase 兜底的热修复；如果不立刻写 E2E 门禁（P0-STABILITY），未来任何一个 PR 都可能把 `h-full/min-h-screen` 关系破坏掉，造成线上 3D 只在顶部一条的视觉事故（这正是用户在 `https://asandstar.github.io/homemem-arena/play/task-leave-home` 上实际报过的问题）。
- P2.G1-B 会动 collision 核心链，**P2.G1-B 前有一套「直接路由 + canvas 高度」的断言**，能保证 G1-B 任何修改不会把「能玩」这件事的最低底线打没。
- 换模型或加关卡：违反 §九 优先级顺序（运行稳定 > 一致 > 布局真 > L2 闭环 > 美术 > 复盘 > 新增内容）。WP-0 是「运行稳定」的最低底线，必须第一个做。

---

## 14. 下一条可以直接执行的 TRAE 实施命令草案（纯草案，本轮不执行）

> 说明：以下只是「下一轮退出 PLAN MODE 并开始实施时，可以直接复制给 TRAE 的任务草案」。**本轮不执行。**

```
/implement

工作包：WP-0 · P0-STABILITY
目标：
  为以下 5 条 GitHub Pages 的直接 URL 增加一条 Playwright 或等价的 E2E 断言：
    1. /
    2. /tasks
    3. /play/task-clean-table
    4. /play/task-leave-home
    5. /play/task-laundry-sort
  断言内容（每条都要）：
    A. canvas.getBoundingClientRect().height / window.innerHeight > 0.6
       (canvas 高度占满超过 60% 视口，对应本计划 §12 #1)
    B. 进入 /play/* 页后 5 秒内，window 上可观察到游戏 phase 已经不是 briefing
       (若简报 UI 还开则兜底点击开始按钮再等 2 秒)
    C. console 没有 error 级消息
  文件允许修改：
    - tests/e2e/* 目录（新增 spec 文件）
    - tests/* 目录（vitest happy-dom 版如果 Playwright 环境不齐）
    - 如果必须给 ArenaPage 加 1-2 个 data-testid / data-phase 属性以便观察，允许改 src/pages/ArenaPage.tsx 的 3 行以内，禁止改逻辑
  严格禁止修改：
    - src/game/*, src/store/*, src/components/arena3d/* 的逻辑
    - decorFurniture / tasks 数据
    - README
  QA 要求：
    npm run lint / test / build / qa 全部保持通过
    如 Playwright 本地没装 chromium，就用 vitest + happy-dom 路由级测试，不要下载模型或浏览器
  完成后：
    输出 1 个独立 commit（message：test(e2e): P0-STABILITY direct routing + canvas height gate）
    本次不 push，等人工看一眼 diff 后再决定。
```

---

## 15. git status（生成本文档时的真实状态）

```
$ git status --short
 M .trae/documents/HOMEMEM_ARENA_PRODUCT_V2_NEXT_PHASE_MASTER_PLAN.md
?? .trae/documents/
```

> 说明：工作区只有 1 个修改 = 本计划文档本身（新增的 `.trae/documents/` 目录是非源码文档目录，已被 git untracked）；**src/、tests/、scripts/、配置、README 全部 0 修改**，符合本轮「只读 + 生成计划文档」的要求。

---

## 最终四个必答问题总结

### Q1. 当前项目离「稳定在线 Demo」还有多远？
**答（FACT+INFERENCE）：** 距离「稳定在线 Demo」= **1 个工作包（WP-0 P0-STABILITY，约 0.5-1 天）** 加上后续 P2.G1 基础设施的 Gate 保持严格；如果只看「5 条 URL 打开能玩、canvas 不塌、phase 兜底」这个最低稳定定义，HEAD 已经基本达标，差的是**自动化回滚门禁**（P0-STABILITY）与**三关 SV 七条件的版本级认证**（P2.1-2.4，约 4-6 天）。最短路径下：**约 5-7 个工作日可达到「稳定可展示的线上 Demo」级（WP-0 + P2.G1 + P2.1-2.3 关键房，跳过视觉优化只拿通关）。**

### Q2. 离「比赛级精品作品」还有多远？
**答（INFERENCE）：** 从 5 项工作包之后开始算精品化，合计 **12-18 个工作日**：
```
P0-STABILITY（0.5-1d）
P2.G1-B/C/D（2-3d）
P2.0-R（1-2d）
P2.1 Living（1-1.5d）
P2.2 Bedroom + P2.3 Entrance（1.5-2.5d，时间紧可先保这两房，Living 并行 P1 教学）
P2.4 Dining Laundry（1d）
P3 关键模型 + 视觉清理（2-3d）
P4 猫演出 + 时间线 + L3 取回核（2-3d）
P5 7 人试玩 + MVP + 演示（2-3d）
```
总：**12-18 工作日**，其中前 7 天是「三关真的能玩且空间可信」，后 5-11 天是「比赛级精品化 + 研究证据 + 演示包装」。

### Q3. 当前唯一应该启动的工作包是什么？
**答（RECOMMENDATION）：** `WP-0 · P0-STABILITY`。

### Q4. 为什么不是换模型或新增关卡？
**答（RECOMMENDATION + FACT 依据）：**
1. **不是换模型**：因为 P2.G1 + P2.1-2.3 未完成前，8 个双重真值源（DTS-001 到 008）中至少有 5 个直接影响「家具语义唯一」——现在换模型等于「在错误碰撞 + 错误视觉归属 + 错误坐标上换更精致的错误模型」，P2 做完后必重做，返工率 100%，违反 §九 「视觉/碰撞/交互一致」优先级在「关键模型美术」前。
2. **不是新增关卡**：因为 3 关公开已经足以支撑比赛演示 + MVP 研究闭环，新增关卡把空间治理压力从 L2 三关扩到 4-5 关 × 6 房，直接违反 §九 明确禁止「新增公开关卡」进近期优先级。
3. **先 WP-0（P0-STABILITY）**：因为刚刚修的 canvas 高度 + ArenaPage 兜底没有 E2E 回滚门禁，下一次 PR 改动任何 Layout/ArenaPage 样式都可能回归——**没有稳定底座，后面 P2.G1 到 P5 的所有产出随时可能因为「线上 canvas 又塌了」在比赛现场翻车**。
