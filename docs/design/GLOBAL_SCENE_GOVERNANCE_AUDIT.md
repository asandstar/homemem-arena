# GLOBAL SCENE GOVERNANCE AUDIT（全局场景治理审计）

任务：task-leave-home（出门大作战）
阶段：P2.G0-R GLOBAL SCENE GOVERNANCE AUDIT + P2.0 RED-TEAM REVIEW
日期：2026-08-02
前置文档：
  - P2_0_BLUEPRINT_RED_TEAM_REVIEW.md（红队审查主文档，已判定 NO-GO P2.1）
  - GLOBAL_LAYOUT_QA_SPEC.md（QA 缺口与扩展路线）
状态：DRAFT / CANDIDATE ONLY / NOT APPROVED FOR IMPLEMENTATION

================================================================
§0. 审计目标与范围
================================================================

本审计回答三个问题：
  Q1：当前 HEAD（P1.x 已发布基础版）存在多少个「双重真值源」（同一语义数据在 2+ 处独立定义，不保证一致）？
  Q2：如果直接按 P2.0 蓝图推进 P2.1-P2.3 分房实施，会新增多少双重真值源？会触发哪些系统性风险？
  Q3：推荐的治理迁移路线（P2.G1 → P2.0-R → P2.1+）与门禁是什么？

审计范围：
  - 类型层：src/types/*.ts（DecorFurnitureSpec / ContainerSpec / ObjectSpec 等）
  - 数据层：src/data/rooms.ts / decorFurniture.ts / tasks/leave-home.ts
  - 运行时层：src/components/arena3d/Room3D.tsx（硬编码家具）/ Container3D.tsx / FurnitureModel.tsx / FirstPersonControls.tsx
  - 碰撞层：src/game/collision.ts（resolveFurnitureCollision）
  - QA 层：scripts/qa-*.ts（自动化能力）
  - 文档层：docs/design/ 三份 P2.0 候选蓝图（状态 DRAFT，未批准）

审计结论（一句话）：
  当前 HEAD 有 8 类双重真值源；直接推进 P2.1-P2.3 会新增 5 类 + 触发 collision rotation BLOCKER；
  必须先完成 P2.G1 UNIFIED SCENE SPEC（类型扩展 + 碰撞链升级 + QA 扩展），才能回到 P2.0-R 重算坐标并进入 P2.1。

================================================================
§1. 双重真值源清单（HEAD 现状）
================================================================

§1.1 定义

双重真值源 = 同一个语义家具/容器/物体，其 position / size / rotation / visual / collision 等属性在代码库的 2 个或以上位置独立定义，
且没有单一事实源（SSOT, Single Source of Truth）约束，两处修改会互相漂移 → 玩家体验 bug。

§1.2 HEAD 发现的双重真值源清单（编号 DTS-001 ~ DTS-008）

┌──────────────────────────────────────────────────────────────────┐
│ DTS-001：DecorFurnitureSpec 缺 rotation 字段                      │
├──────────────────────────────────────────────────────────────────┤
│ 语义：沙发侧位、电视柜、床头柜等带 90° 旋转的家具                  │
│                                                                        │
│ 真值源 A（视觉）：Room3D.tsx 中 <FurnitureModel> 的 rotation y=π/2 │
│ 真值源 B（碰撞）：decorFurniture.ts 中 DF 条目无 rotation 字段，     │
│                   collision.ts resolveFurnitureCollision 直接取     │
│                   size.x / size.z（不 swap x/z）                    │
│                                                                        │
│ 表现：视觉沿 Z 方向 1.6m 长，但碰撞沿 X 方向 1.4m 长 → 撞空气/穿模   │
│                                                                        │
│ 严重级：BLOCKER（P2.1 修正 DF position 后立即大面积爆发）            │
│ 修复路径：P2.G1 DecorFurnitureSpec 加 rotation + collision 链 swap  │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ DTS-002：Task Container 与 Decor Furniture 无 collisionOwner 概念   │
├──────────────────────────────────────────────────────────────────┤
│ 语义：cnt-coffee-table 茶几（TC）与 decor-side-table 小边几（DF）   │
│        语义相同（都是茶几，甚至 CoffeeTableModel 相同）              │
│                                                                        │
│ 真值源 A（TC）：task-leave-home.ts containers[] 中定义               │
│ 真值源 B（DF）：decorFurniture.ts living 条目 + Room3D 小边几        │
│ 真值源 C（Room3D）：Room3D 中又渲染了一件 hardcoded 小茶几           │
│                                                                        │
│ 表现：FirstPersonControls 把 TC + DF 都推进 allFurniture，           │
│       同一语义 3 件家具碰撞叠加 → 双重真值                          │
│                                                                        │
│ 严重级：BLOCKER                                                      │
│ 修复路径：P2.G1 ContainerSpec 加 collisionOwner / semanticKey        │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ DTS-003：ContainerSpec.surfaceHeight 语义二义性                     │
├──────────────────────────────────────────────────────────────────┤
│ 语义：容器表面的交互高度（物体放置的 Y）                             │
│                                                                        │
│ 真值源 A：4 个 TC 有 2 种不同 pattern：                               │
│   coffee/night/umbrella：surfaceHeight = size.y（size 高度）         │
│   entrance-tray：surfaceHeight = position.y + size.y/2（几何中心 Y） │
│ 真值源 B：Container3D.tsx getContainerSurfaceY 运行时动态计算        │
│                                                                        │
│ 表现：文档和实现不一致，维护者修改时不知哪种是"对的" → 物体悬浮/穿模   │
│                                                                        │
│ 严重级：MAJOR（不阻塞运行，但 P2.2 改 nightstand 会踩到）             │
│ 修复路径：P2.G1 选统一规则（推荐绝对 Y）+ S1 QA 检查                  │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ DTS-004：ObjectSpec.initialPosition.y 在有 surfaceContainerId 时    │
│          被运行时完全忽略，但类型和文档未标注                        │
├──────────────────────────────────────────────────────────────────┤
│ 语义：物体在容器内/上的初始位置                                      │
│                                                                        │
│ 真值源 A：task-leave-home.ts obj-phone initialPosition.y = 0        │
│ 真值源 B：placement.ts getContainerSurfaceY 动态计算的 Y             │
│                                                                        │
│ 表现：维护者可能精细调整 y，但实际没效果 → 调试时间浪费               │
│                                                                        │
│ 严重级：MINOR（不影响运行）                                          │
│ 修复路径：P2.G1 QA 加 S2（y!=0 告警）+ 类型注释标注忽略              │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ DTS-005：Room3D 硬编码家具视觉，无 semanticKey 与 TC/DF 三方交叉     │
├──────────────────────────────────────────────────────────────────┤
│ 语义：每件家具应该由「单一视觉 owner」渲染                          │
│                                                                        │
│ 真值源 A（Room3D）：hardcoded <FurnitureModel> 数十件（沙发/TV/柜等）│
│ 真值源 B（Container3D）：TC 又渲染一套容器模型                       │
│ 真值源 C（decorFurniture.ts）：DF 有数据但无渲染组件（DF 只供碰撞）  │
│                                                                        │
│ 表现：同一房间有 2~3 套茶几/托盘/伞架同时渲染 → 视觉穿模 + 玩家迷茫   │
│       例如 entrance-tray：Room 有 1 假托盘 + TC 有 1 真托盘 → 叠两件 │
│                                                                        │
│ 严重级：BLOCKER                                                      │
│ 修复路径：P2.G1 定义 visualOwner 字段 + Room3D 删除重复 hardcode     │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ DTS-006：DecorFurniture position 在 HEAD 中多为 world 值误写         │
│          （非 room-local），与 rooms.ts 约定不一致                   │
├──────────────────────────────────────────────────────────────────┤
│ 语义：DF 家具的位置应使用 room-local（如 TC 一样）                   │
│                                                                        │
│ 真值源 A（约定/文档）：room-local，world = room.center + position    │
│ 真值源 B（HEAD decorFurniture.ts）：如 bedroom decor-bed             │
│   position (-8, -0.8)，x=-8 是 bedroom center 的 world 值，          │
│   不是 room-local（room-local x 范围应该 -4~+4，不是 -12~-4）        │
│                                                                        │
│ 表现：当前 collision 计算全部错位，实际玩家在空地上走不会撞家具        │
│       （因为 DF 碰撞 XZ 在另一房间范围）→ 相当于 DF 碰撞不起作用      │
│       这解释了为什么玩家实际游戏中"穿过沙发没问题"                   │
│                                                                        │
│ 严重级：BLOCKER（P2.1 修正为 room-local 后 DTS-001 立即爆发）        │
│ 修复路径：P2.0-R 重新计算所有 DF 坐标为 room-local                    │
│           前提：P2.G1 类型完成，QA G1/G2/C1 支持                     │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ DTS-007：shallow tray / wall decor 无条件参与 XZ 碰撞               │
│          （collisionOwner=none 代码不支持）                         │
├──────────────────────────────────────────────────────────────────┤
│ 语义：柜顶托盘、挂钟、画、墙上挂钩应跳过地面 XZ 碰撞                 │
│                                                                        │
│ 真值源 A（物理直觉）：1.1m 高的托盘在头上，不阻挡走路                │
│ 真值源 B（collision.ts）：纯 XZ 平面，不分高度，所有 TC / DF 全挡住  │
│                                                                        │
│ 表现：cnt-entrance-tray 在鞋柜顶上 1.15m 高，但在地面 0m 处产生       │
│       0.8×0.4 XZ 阻挡 → 玩家"看见鞋柜前面有一堵看不见的墙"           │
│       因为 DF 鞋柜已经挡住了正面，TC 再加一道重复阻挡（DTS-002 叠加）│
│                                                                        │
│ 严重级：MAJOR（配合 DTS-002 成为 BLOCKER）                           │
│ 修复路径：P2.G1 ContainerSpec 加 collisionOwner=none + 过滤链        │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ DTS-008：QA 自动化仅覆盖 TC / Object，不覆盖 DF / Room3D / 语义     │
│          唯一性 / 可达性                                             │
├──────────────────────────────────────────────────────────────────┤
│ 语义：npm run qa 应保证所有布局 Gate 通过                           │
│                                                                        │
│ 真值源 A（开发者预期）：npm run qa 通过 = 布局没问题                 │
│ 真值源 B（实际 QA 能力）：QA 只查 TC/Object，DF 越界/压门/重复碰撞   │
│                         全靠人工，44% 自动化率                       │
│                                                                        │
│ 表现：P2.1-P2.3 实施后即使 npm run qa PASS，仍有 10+ Gate 需人工     │
│       → 遗漏风险极高，返工不可避免                                    │
│                                                                        │
│ 严重级：MAJOR（配合其他 DTS 成为 NO-GO 条件之一）                     │
│ 修复路径：P2.G1 QA 扩展（见 GLOBAL_LAYOUT_QA_SPEC.md §3）             │
└──────────────────────────────────────────────────────────────────┘

§1.3 严重度汇总

| DTS ID | 严重级 | 修复阶段 |
|---|---|---|
| DTS-001 rotation 缺失 | BLOCKER | P2.G1 |
| DTS-002 collisionOwner 缺失 | BLOCKER | P2.G1 |
| DTS-003 surfaceHeight 二义 | MAJOR | P2.G1 |
| DTS-004 object.y 忽略 | MINOR | P2.G1 |
| DTS-005 visualOwner 缺失 | BLOCKER | P2.G1 + P2.0-R |
| DTS-006 DF position world 值误写 | BLOCKER | P2.0-R |
| DTS-007 collisionOwner=none 不支持 | MAJOR | P2.G1 |
| DTS-008 QA 覆盖不足 | MAJOR | P2.G1 |

→ 8 个 DTS：4 BLOCKER / 3 MAJOR / 1 MINOR
→ 所有 BLOCKER 都必须在 P2.G1 或 P2.0-R 阶段修复

================================================================
§2. P2.1-P2.3 直接实施的风险评估（为什么 NO-GO）
================================================================

§2.1 风险链：直接进入 P2.1 Living 会发生什么

阶段 1：P2.1 修改 decorFurniture position 为 room-local（修复 DTS-006）
  → DTS-006 解除了（DF 碰撞从错误房间范围回到正确）
  → 但 DTS-001（rotation 无）立即爆发：
     * sofa-side 等带 rotation 的家具碰撞 AABB 方向与视觉 90° 偏差
     * 玩家在 P2.1 Living 会大面积"撞空气"（视觉空处有墙）或"穿沙发"
  → 回滚 P2.1：因为 DTS-001 BLOCKER，DF position 修了反而更差
  → 或勉强接受：玩家穿沙发通过，但失去碰撞真实性（整个碰撞系统名存实亡）

阶段 2：如果强行跳过 DTS-001 继续改 TC 位置（cnt-coffee-table 等）
  → DTS-002（无 collisionOwner）爆发：
     * TC 新位置 + DF 旧位置 + Room3D hardcode 三处碰撞叠加
     * 例如 coffee-table 在 (0, 0.3)，DF side-table 在 (0.3, -2.2) 附近
       如果两者 XZ 接近 → 双碰撞叠加 → 玩家走不过去
  → DTS-005（视觉重复）爆发：
     * TC 茶几 + Room3D 小茶几 = 房间里有 2 个茶几
     * 玩家保存钥匙记忆时按 E，不确定哪个是目标茶几

阶段 3：P2.3 Entrance 实施时
  → DTS-007（shallow tray 无 collisionOwner=none）爆发：
     * cnt-entrance-tray 在鞋柜顶上
     * XZ 0.8×0.4 + DF 鞋柜 1.2×0.4 = 玩家靠近鞋柜 2.0m 时被鞋柜 AABB 提前挡住
     * 虽然表面上可以交互（距离 2.0-2.5m 在范围内），但玩家想站在托盘正前方做放置时
       被 DF 鞋柜推到 z=-0.3 以北 → 交互位置与视觉错位 → 玩家"放东西到空气里"
  → DTS-008（QA 不足）爆发：
     * 上述所有 bug npm run qa 全部 PASS
     * 只有人工玩才能发现，每次迭代 QA 反馈闭环 30min+

§2.2 风险汇总矩阵

| 风险 | 触发阶段 | 概率 | 影响 | 可回滚 | 是否有临时规避 |
|---|---|---|---|---|---|
| DTS-001 rotation 方向错 | P2.1 DF position 修正后 | 100% | BLOCKER（碰撞系统失效） | 是 | 否（回滚 DF 修正 = 回到碰撞空挡状态） |
| DTS-002 TC-DF 双重碰撞 | P2.1 TC position 更新后 | 80% | MAJOR-BLOCKER（依重叠度） | 是 | 临时删除 DF 条目（但 DF 被设计用于视觉背景，删了 Room3D 也有，视觉仍重复） |
| DTS-005 视觉双重茶几 | P2.1 | 100% | MAJOR | 否（Room3D 需要代码删除，P2.1 白名单不允许改 Room3D） | 否（需改 Room3D = 越出分房实施白名单） |
| DTS-007 tray 重复阻挡 | P2.3 | 100% | MAJOR | 是 | 把 TC 移到鞋柜旁边（但破坏了"托盘在柜顶"的真实玄关布局 = 回到 P2.0 前假布局） |
| DTS-008 QA 漏检 | 全阶段 | 100% | 大量返工 | 部分 | 全靠人工走 M-G3 / M-R2 / M-C1 SOP（每次 15min+，3 个房间 45min+） |

§2.3 结论：为什么不能"先做 Living 再说"

P2_ROOM_BY_ROOM_IMPLEMENTATION_CHECKLIST.md §0.1 分房隔离原则本意是"把 risk 限制在单房间"，
但 DTS-001 / DTS-002 / DTS-005 / DTS-007 是跨房间的系统性问题（类型系统 / 碰撞链），
不是 Living 单房间能隔离的。P2.1 修改 DF position 为 room-local 会触发
DTS-001（系统性 collision.ts 缺陷），这个缺陷同时影响 Bedroom / Entrance，
违背了分房隔离原则 → P2.1 的修改会污染 P2.2 / P2.3 的未实施房间。

因此 P2_ROOM_BY_ROOM_IMPLEMENTATION_CHECKLIST.md §0.1 的前提是
"数据模型能力已就位"，但当前 DTS 证明前提不成立 → NO-GO。

================================================================
§3. 治理迁移路线（P2.G1 → P2.0-R → P2.1+）
================================================================

三阶段与 P2_0_BLUEPRINT_RED_TEAM_REVIEW.md §11 / GLOBAL_LAYOUT_QA_SPEC.md §3 完全对齐。
本节增加「双重真值源去重里程碑」。

§3.1 阶段 1：P2.G1 UNIFIED SCENE SPEC（数据模型 + 碰撞链 + QA 基础）

目标：修复 DTS-001/002/003/004/007/008（6/8 DTS），为 DTS-005/006 打基础

治理项与退出标准：

┌─────────────┬─────────────────────────────────────────────────────┬──────────────────────┐
│ DTS         │ 治理行动                                             │ 退出标准             │
├─────────────┼─────────────────────────────────────────────────────┼──────────────────────┤
│ DTS-001     │ DecorFurnitureSpec 加 rotation 字段                   │ 类型 tsc 无错        │
│             │ collision.ts resolveFurnitureCollision swap x/z       │ rotatedSize helper   │
│             │ 实现 rotatedSize helper（奇数倍 PI/2 时 swap）         │ 单测覆盖 C1 通过     │
├─────────────┼─────────────────────────────────────────────────────┼──────────────────────┤
│ DTS-002     │ ContainerSpec 加 collisionOwner（TC/static-furniture/ │ 类型 tsc 无错        │
│             │ none）+ semanticKey 字段                              │ FirstPersonControls  │
│             │ FirstPersonControls allFurniture 拼接前按 owner 过滤  │ 过滤正确（单测 C2/C3）│
├─────────────┼─────────────────────────────────────────────────────┼──────────────────────┤
│ DTS-003     │ 定 surfaceHeight 统一规则（绝对世界 Y）                │ 类型注释 + S1 QA     │
│             │ 迁移 4 个 TC 的 surfaceHeight 为新模式                 │ 新旧值对照清单       │
├─────────────┼─────────────────────────────────────────────────────┼──────────────────────┤
│ DTS-004     │ ObjectSpec.initialPosition.y 加 @ignored_when_        │ tsc 无警告           │
│             │ surfaceContainerId TS 注释 + S2 QA y!=0 告警           │ S2 QA 通过           │
├─────────────┼─────────────────────────────────────────────────────┼──────────────────────┤
│ DTS-007     │ ContainerSpec.collisionOwner=none 过滤链实现           │ 单测 C2 通过         │
│             │ QA C4 shallow tray 启发式告警                          │ C4/C5 至少告警出现   │
├─────────────┼─────────────────────────────────────────────────────┼──────────────────────┤
│ DTS-008     │ qa-layout 扩展（G1/G2/G3/G4/G5/R1/R3/S1/S2）          │ 见 QA Spec §3        │
│             │ 新增 qa-governance.ts 模块                             │ 自动化率 85%+        │
├─────────────┼─────────────────────────────────────────────────────┼──────────────────────┤
│ 全局门禁    │ P2.G1 结束时 npm run qa 对 HEAD 数据 exit 0           │ 0 blocker / 0 major  │
│             │ （不能因为新 QA 能力引入 HEAD 回归）                    │ vitest 单测覆盖率：  │
│             │                                                       │ 新增函数 ≥80%        │
└─────────────┴─────────────────────────────────────────────────────┴──────────────────────┘

本轮不改代码，以上是 P2.G1 工作包的规格说明。

§3.2 阶段 2：P2.0-R BLUEPRINT REVISION（重算坐标 + 清理 visualOwner）

目标：修复 DTS-005 / DTS-006（剩余 2/8 DTS），根据新类型重算所有坐标

治理项：

DTS-006 修复（DF position world → room-local）：
  1. 以 rooms.ts room.center 为基准：
     bedroom room.center = (-8, 0, 0) → world x=-8 对应 room-local x=0
     所以 bedroom decor-bed 原 position (-8, -0.8)（world 值误写）
     改为 room-local x=0, z=-0.8
  2. 每个 DF 条目对照 Room3D 中对应语义模型的实际渲染位置，
     反推 room-local position（因为 Room3D 目前视觉是"事实视觉"）
  3. G1/G2 QA 检查 DF 在房间内、不压门

DTS-005 修复（视觉 Owner 唯一）：
  规则：对每件语义家具：
    TC：如果有交互（放置 / 开抽屉 / 保存记忆）→ visualOwner = TC，删除 Room3D 对应 hardcode
    DF：如果纯背景装饰 → visualOwner = DF 或 Room3D，保留其一，删除重复
  Leave-home 专项去重清单：
    * coffee_table：保留 TC cnt-coffee-table，删除 Room3D side-table + DF decor-side-table
    * entrance_tray：保留 TC cnt-entrance-tray，删除 Room3D EntranceTrayFallback 假托盘
    * umbrella_stand：保留 TC cnt-umbrella-stand，删除 Room3D 4 处装饰伞（地上 2 大 + 鞋柜上 2 小）
    * nightstand_right：保留 TC cnt-nightstand，Room3D 保持无（因为 Room3D 当前只做了左柜）
    * sofa / TV / bookshelf 等：visualOwner = Room3D（纯背景，无 TC/DF 重复），
      collisionOwner = DF（DF 有对应条目承担碰撞，Room3D 不进 collision list）

P2.0-R 坐标重算原则：
  与 P2_0_BLUEPRINT_RED_TEAM_REVIEW.md §8 修订原则一致：
    Living：沙发/电视朝向对正，cat key 落到沙发前地板自然位置
    Bedroom：双床头柜贴床两侧对称，wardrobe 不越界，chair 离门 ≥ 0.6m
    Entrance：x=-2.4 西侧列，z 从门到内依次伞架(-1.2) → 鞋子(-0.8) → 鞋柜托盘(-0.5)，
              动线一路向北，无折返
  所有 REVISE 项给出精确数值（精确到 0.05m）
  所有 REJECT 项完全替换为新坐标（不再保留 REJECT）

P2.0-R 结束门禁：
  1. 三份 P2.0 候选文档（蓝图 / 预算 / 清单）升级状态为 APPROVED FOR IMPLEMENTATION
  2. P2_0_BLUEPRINT_RED_TEAM_REVIEW.md §H 的 8 条 GO 条件全部满足（复查 0 REJECT / 无重复 owner / 门洞满足 / 语义核实 / QA 支持）
  3. npm run qa 对新数据（TC / DF / Object / Room3D 去重后）exit 0
  4. GLOBAL_LAYOUT_QA_SPEC.md M-* 人工验收全部通过，截图存档

§3.3 阶段 3：P2.1-P2.3 分房实施（NO-GO → GO 之后）

按 P2_ROOM_BY_ROOM_IMPLEMENTATION_CHECKLIST.md 白名单黑名单执行。
本审计补充新增门禁（在 Checklist 原门禁之上叠加）：

每个房间实施完成后必须额外通过：
  GV-1：该房间 semanticKey × 视觉 owner 对照表，视觉唯一（1 semanticKey → 1 渲染源）
  GV-2：该房间 collisionOwner 唯一（1 XZ 区域 → 1 碰撞源，不 TC+DF 叠加）
  GV-3：该房间 DF rotation 与碰撞 footprint 方向一致（抽查 3 件带旋转家具，C1 QA 通过）
  GV-4：关键路径 R2（人工 M-R2 或自动化启发式）在该房间段通过
  GV-5：真实性评级 UNREALISTIC ≤ 1，BLOCKING = 0

================================================================
§4. 全局治理规则（P2.G1 之后强制执行）
================================================================

§4.1 单一事实源（SSOT）四原则

原则 1（语义唯一）：
  每个家具语义必须有且仅有 1 个 semanticKey，在整个代码库中不能重复定义。
  例：「玄关鞋柜上的托盘」= entrance_tray_counter_top，不叫 tray-1 / entrance-small-tray 等别名

原则 2（视觉唯一 Visual SSOT）：
  每个 semanticKey 有且仅有 1 个 visualOwner：Room3D / DF / TC，三选一。
  QA G3 检查：同 semanticKey 不出现 2 个渲染节点

原则 3（碰撞唯一 Collision SSOT）：
  每个 semanticKey 有且仅有 1 个 collisionOwner：DF / TC / none，三选一。
  QA G4 检查：同语义 / 同 XZ 区域不出现 2 个 AABB

原则 4（位置唯一 Position SSOT）：
  每个 semanticKey 的 position/size/rotation 只出现在一个源文件条目（TC / DF / Room3D 中）。
  Room3D 若为 visualOwner，其 FurnitureModel 中的 position 必须从 DF 条目中读（不硬编码数字），
  或干脆移除 Room3D 硬编码，让 TC/DF 承担渲染。

§4.2 修改权限白名单（谁能改什么）

P2.1-P2.3 分房实施期间：

| 文件 | 可改内容 | 禁止改内容 |
|---|---|---|
| src/data/tasks/leave-home.ts | TC 的 position / size / surfaceHeight / semanticKey / collisionOwner | 不能加新 TC（除非 Checklist 明确） |
| src/data/decorFurniture.ts | DF 的 position / size / rotation / semanticKey / collisionOwner / visualOwner | 不能加全新语义条目（新家具走 P2.G2 流程） |
| src/components/arena3d/Room3D.tsx | 删除已转移 visualOwner 的重复 hardcode 家具 | 不能改结构、不能加新渲染组件、不能动房间框架 / 墙 / 门 / 地 |
| src/types/*.ts | 只读，禁止在分房阶段再扩字段（字段扩在 P2.G1 完成） | 任何类型修改 |
| src/game/collision.ts | 只读，分房阶段不再改碰撞链逻辑 | 任何修改（已在 P2.G1 改完） |
| scripts/qa-*.ts | 只读，QA 能力扩完就锁定 | 任何新检查项（加检查项走 P2.G1 或专门 QA 阶段） |

§4.3 回滚与隔离策略

P2.1 实施中如果发现本审计未列出的新 DTS：
  1. 立即标记「BLOCKER，新双重真值源发现」
  2. 暂停 P2.1 继续修改
  3. 回到本审计追加新 DTS 条目 + 评估是否需要 P2.G2（数据模型再扩展）
  4. 不允许「先绕过再修」—— 绕过 = 引入第三重真值源 = 未来返工 3 倍量

================================================================
§5. GO/NO-GO 再确认（结论）
================================================================

对照 P2_0_BLUEPRINT_RED_TEAM_REVIEW.md §H. GO/NO-GO 标准（8 条），结合本审计 DTS 重新确认：

| # | 标准 | 是否满足 | DTS 关联理由 |
|---|---|---|---|
| 1 | 候选坐标中无 REJECT | ❌ NO | P2.0 蓝图有 6 项 REJECT（红队 §B）；需 P2.0-R 重算 |
| 2 | 所有 REVISE 已形成明确新坐标 | ❌ NO | 红队 §8 只给了原则，无精确数值；P2.0-R 定数值 |
| 3 | 无重复 visual owner | ❌ NO | DTS-005 3 组重复视觉（茶几/托盘/伞架）；P2.0-R 去重 |
| 4 | 无重复 collision owner | ❌ NO | DTS-002 TC+DF 双重；DTS-007 tray 重复阻挡；P2.G1 + P2.0-R 修 |
| 5 | 门洞与关键路径满足净空 | ❌ NO | 红队 B-003/004 不满足；P2.0-R 坐标修正后通过 QA R1/R3 |
| 6 | TC position 语义已核实 | ❌ NO | DTS-003 surfaceHeight 二义；DTS-004 y 忽略；P2.G1 定统一规则 |
| 7 | QA 或手动能验收 Blocker | ❌ NO | DTS-008 QA 仅 44%；rotation swap 缺陷无验收流程；P2.G1 补 QA + SOP |
| 8 | 局部实施不造新双重真值 | ❌ NO | §2 风险链分析：P2.1 修 DF position → DTS-001 爆发 → 系统性污染跨房间 |

8/8 不满足。与红队结论一致。

最终 NO-GO 判定：
  ⛔ NO-GO P2.1（分房实施）
  下一步 = P2.G1 UNIFIED SCENE SPEC（数据模型 + 碰撞链 + QA 扩展）

================================================================
§6. 下一步唯一推荐工作包摘要（与红队 §11 对齐）
================================================================

工作包：P2.G1 UNIFIED SCENE SPEC v1.0
目标：修复 6/8 DTS，为 P2.0-R 打数据模型与 QA 基础
范围：不改任何房间坐标数值（不动 Living/Bedroom/Entrance 的 position），
      只扩类型 + 升级碰撞链 + 扩展 QA
交付物（5 项）：
  1) 类型扩展：DecorFurnitureSpec / ContainerSpec 新增 rotation / semanticKey / collisionOwner / visualOwner 字段（DTS-001/002/007）
  2) 碰撞链升级：collision.ts rotatedSize helper + FirstPersonControls collisionOwner 过滤（DTS-001/002/007）
  3) QA 扩展：qa-layout 新增 G1~G5 / R1 / R3 / C1 / S1 / S2 函数 + vitest 单测（DTS-008）
  4) surfaceHeight 统一规则文档 + 4 TC 对照表（DTS-003）+ object.y 注释（DTS-004）
  5) 本审计文档 DTS 对应项标记为「RESOLVED」+ 附修复 commit SHA 引用
退出标准：见 §3.1 表格 + 本审计 §5 GO 条件（P2.G1 不满足 8 条，而是满足 8 条的前置条件；
          P2.0-R 结束时才判定 GO P2.1）

禁止事项（重申）：
  - 本轮（P2.G0-R）不得修改源码、测试、脚本或 README
  - 不得 commit / push
  - 本审计文档为 DRAFT，所有治理规则和门禁均待 P2.G1 完成后升级为 APPROVED

本轮结束。
