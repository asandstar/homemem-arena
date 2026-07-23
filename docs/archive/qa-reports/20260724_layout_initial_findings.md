# 2026-07-24 五关场景布局初始发现报告

> 生成时间：2026-07-24  
> 数据来源：`scripts/qa-layout.ts` 打磨后首次对基线跑的 114 条 checks（打磨了 surface-height/overlap 误报）

## 1. 坐标语义

从生产代码（[placement.ts](file:///Users/azq/asandstar/homemem-arena-web-demo/src/game/placement.ts#L216-L249)、[sceneGraph.ts](file:///Users/azq/asandstar/homemem-arena-web-demo/src/engine/sceneGraph.ts#L132-L145)、[taskSlice.ts](file:///Users/azq/asandstar/homemem-arena-web-demo/src/store/slices/taskSlice.ts#L183-L187)）推导的「真实坐标语义」：
- ObjectSpec.initialPosition / ContainerSpec.position / ScriptedEvent.targetPosition **都是房间局部坐标**（world.x = `sharedRooms[room].center.x + local.x`）。
- TaskConfig.spawnPosition 是相对 `rooms[0].center` 的局部偏移。
- 本轮发现的 22 个 Blocker，**全部都是把房间 world center 的值错误写成 local**（例如 laundry 房间 world center = x=24，但把 24 当 local 写进去，最后 world = 48 飞出）。

## 2. 初始缺陷清单（L-01~N-03）

| ID | 级别 | 关卡 | 检查 | 描述 |
|----|------|------|------|------|
| L-01 | Blocker | laundry-sort | spawn-inside-room | spawn.x=24 (写 laundry world center 而非 local) |
| L-02 | Blocker × 10 | laundry-sort | object-inside-room | 10 件衣物 local x=21~27 写的是 world x |
| L-03 | Blocker × 3 | laundry-sort | container-inside-room | cnt-white/dark/towel basket x=21/24/26.5 同样 world→local |
| L-04 | Blocker × 3 | laundry-sort | scripted-event-target | se-cat-moves-* 3 个 move-entity target x=26.5/21/22.5 |
| L-05 | Blocker | breakfast | container-inside-room | cnt-kitchen-counter x=3.0, size.x/2=0.75 → xmax=3.75 > 厨房 xmax=3.65（穿右墙 0.1m） |
| L-06 | Blocker × 3 | night-patrol | object-inside-room | obj-remote(bedroom local x=-6.5 应为 x=+1.5), obj-phone(kitchen x=+6 → x=-2), obj-bowl(dining x=+18 → x=+2) |
| L-07 | Blocker × 2 | night-patrol | container-inside-room | cnt-patrol-nightstand x=-6.5 → +1.5；cnt-patrol-kitchen-counter x=+10.5 → +2.5 |
| M-01 | Major | leave-home | object-on-container | obj-phone dx=0.2 / dz=0.3 > cnt-nightstand 顶面安全半宽 0.25 / 半深 0.15 |
| M-02 | Major | breakfast | container-overlap | cnt-kitchen-counter (2.8,-2) 与 cnt-sink (2.5,-2) AABB 重叠 |
| N-01 | Minor | clean-table | container-near-door | dining dishwasher 2.5 & trash-bin -2.5 离 dining 门 target=3.25 距离 0.75m < 0.8 |
| N-02 | Minor | leave-home | container-far-from-door | entrance tray/伞架 z=-2.3，离 living 门 target(z=3.5) 5.97m > 4.5 |
| N-03 | Minor | breakfast | container-near-door | 冰箱 x=2.5 到厨房左门 target=3.25 距离 0.75m < 0.8 |

总计：**22 Blocker / 2 Major / 3 Minor**。

## 3. 已剔除的误报（QA 脚本打磨）

这些最初被 QA 脚本误报，打磨后不再报：

| 检查 | 误报原因 | 打磨规则 |
|------|----------|----------|
| surface-height | surfaceHeight 是显式声明的交互面（冰箱抽屉表面 ≠ pos.y+size.y） | 阈值改为 `\|surfaceHeight - (pos.y + size.y/2)\| ≤ 1.0` |
| container-overlap | upper / lower 挂墙橱柜、水槽在 counter 上的一体化组合 | 跳过 id 匹配 `/wall|shelf|upper|lower|hang|drawer/i`，并跳过 (sink/dishwasher/trash) 与 (counter/table/island) 配对 |
| container-blocks-doorway | 同上，挂墙橱柜不参与落地动线判定 | 与 overlap 用同一跳过正则 |
| process.exit 在 vitest 里杀进程 | 脚本从 test 中被 import 会直接 exit | 加 `process.env.VITEST !== 'true'` 守卫，用 runLayoutCheckMainAndExit() |

## 4. 房间 center 真值（对照 L-01/L-06/L-07）

| room | center.x | size.x | local x 合法（margin 0.35） |
|------|----------|--------|--------------------------------|
| living | 0 | 10 | [-4.65, 4.65] |
| bedroom | -8 | 8 | [-3.65, 3.65] |
| kitchen | +8 | 8 | [-3.65, 3.65] |
| dining | +16 | 8 | [-3.65, 3.65] |
| entrance | 0 | 6 | [-2.65, 2.65] |
| laundry | +24 | 8.5 | [-3.90, 3.90] |
