# PLAYABLE MVP RESET ROUND C1 · THREE LEVEL VISUAL AND GAMEPLAY TRIAGE

> **生成时间**：2026-08-06 (Asia/Shanghai)
> **方法**：代码静态审查 + B3 curl 验证 + B3 截图（无法程序读取内容）
> **约束**：禁止修改代码 / 禁止下载模型 / 禁止生成大型设计文档

## 方法学声明

本轮**未收到用户提供的实际游戏截图**。证据来源：
- **CODE_REVIEW**：源码静态分析（Room3D.tsx、decorFurniture.ts、tasks/*.ts、modelRegistry.ts）
- **BROWSER_OBSERVED**：B3 轮 curl 验证（5 GLB HTTP 200）
- **B3_SCREENSHOT_UNREADABLE**：B3 轮截图存在（01_home.png 等）但 Read 工具不支持 PNG，内容未验证
- **HUMAN_UNVERIFIED**：需人工实机确认

---

## 一、三关审查

### L1 task-clean-table（Dining 餐厨）

| # | 检查项 | 结果 | 证据 |
|---|---|---|---|
| 1 | 第一视角首屏可理解 | **PARTIAL** | CODE_REVIEW：餐桌在房间中央，spawn 应能看到 |
| 2 | 必要物品可辨认 | **RISK** | 脏杯子 size (0.1,0.12,0.1)、餐巾纸 (0.1,0.05,0.08)、叉子 (0.08,0.15,0.03) 极小 |
| 3 | 必要容器可辨认 | **PASS** | 餐桌/洗碗机/垃圾桶/餐具架均为 task container，有交互 ring |
| 4 | 模型尺寸异常 | **P0_RISK** | renderDiningKitchen 有 **6 个 CoffeeTableModel** 作 cabinet（0.8×0.9×0.6），renderDining 有 **1 个**（1.2×0.85×0.5）= 共 7 个深色木箱 |
| 5 | 家具/标签遮挡 | **RISK** | 餐桌上方 4 个装饰杯子 cylinderGeometry (Y=0.92) 可能与 task 物品重叠 |
| 6 | 无关装饰干扰 | **FAIL** | 厨房区有 fridge(2.0m高)、sink、stove、microwave、6 个 cabinet、吊灯、挂画、时钟、植物 — 与 L1 无关 |
| 7 | 无法通行区域 | **RISK** | 6 个 cabinet 沿西墙和北墙排列 + fridge 在东墙，厨房区通道狭窄 |
| 8 | 适合真人完整游玩 | **NO** | 视觉干扰过多，必要物品太小 |

**L1 MVP 必要元素**：餐桌、杯子、纸巾、叉子、洗碗机、垃圾桶、餐具架、两个门洞
**L1 REMOVE_CANDIDATE**：6 个厨房 cabinet、fridge、sink、stove、microwave、吊灯、挂画、时钟、植物、装饰杯子、装饰圆柱

---

### L2 task-leave-home（Living + Bedroom + Entrance）

| # | 检查项 | 结果 | 证据 |
|---|---|---|---|
| 1 | 第一视角首屏可理解 | **PARTIAL** | spawn 面朝 +Z 南，茶几在正前方 1.8m |
| 2 | 必要物品可辨认 | **RISK** | 钥匙 (0.2,0.06,0.14)、手机 (0.18,0.09,0.02) 极小 |
| 3 | 必要容器可辨认 | **PASS** | cnt-coffee-table / cnt-nightstand / cnt-entrance-tray / cnt-umbrella-stand 均为 task container |
| 4 | 模型尺寸异常 | **PASS** | 5 GLB HTTP 200 (B3 BROWSER_OBSERVED)；沙发碰撞盒比视觉盒大 22%（B3 已知） |
| 5 | 家具/标签遮挡 | **RISK** | Living 有 2 个落地灯 (1.6-1.8m) + 3 个植物 (0.8-1.2m) 可能遮挡视线 |
| 6 | 无关装饰干扰 | **FAIL** | Living 2 灯 + 3 植物 + 墙架 + 挂画 + 时钟；Entrance 有装饰托盘与 task 托盘并存 |
| 7 | 无法通行区域 | **RISK** | 沙发碰撞盒偏大，relocated key 在碰撞盒范围内（B3 已知 LAYOUT_COLLISION_BLOCKER 风险） |
| 8 | 适合真人完整游玩 | **NO** | 视觉干扰 + 猫脚印 WEAK + 碰撞盒风险 |

**Entrance 重复所有者问题**：
- `cnt-entrance-tray`（task container）局部位置 (0.2, 0.5, 1.3) 南墙侧
- `EntranceTrayFallback`（renderEntrance 装饰）局部位置 (-0.4, 0, -1.55) 北墙侧
- 两个"托盘"并存，玩家可能混淆哪个可交互

**L2 MVP 必要元素**：茶几、沙发、电视组合、书架(可选)、床头柜、玄关托盘、伞架、钥匙/手机/雨伞、猫脚印
**L2 REMOVE_CANDIDATE**：Living 2 灯、3 植物、墙架；Entrance 装饰托盘 (EntranceTrayFallback)

---

### L3 task-laundry-sort（Laundry 洗衣房）

| # | 检查项 | 结果 | 证据 |
|---|---|---|---|
| 1 | 第一视角首屏可理解 | **FAIL** | 6 个篮子 + 2 洗衣机 + 3 cabinet + 毛巾架 + 地上毛巾，视觉极度拥挤 |
| 2 | 必要物品可辨认 | **RISK** | 衣物 size 0.15-0.6，在地面上可能被篮子遮挡 |
| 3 | 必要容器可辨认 | **FAIL** | **6 个篮子并存**：3 个 task 容器 (cnt-white/dark/towel-basket) + 3 个装饰篮 (LaundryBasketModel) |
| 4 | 模型尺寸异常 | **P0_RISK** | 3 个 CoffeeTableModel 作 cabinet (0.6×0.9×0.5 #6b7280)，可能被误认为"巨大黑色模型" |
| 5 | 家具/标签遮挡 | **FAIL** | 3 个装饰篮 (z=-0.3) 挡在 task 篮 (z=-1.3) 前方 |
| 6 | 无关装饰干扰 | **FAIL** | 毛巾架 + 3 墙毛巾 + 3 地上毛巾 + 植物 + 垃圾桶 + 3 cabinet + 装饰 mesh |
| 7 | 无法通行区域 | **RISK** | 4.0×4.5m 房间内 6 篮 + 2 洗衣机 + 3 cabinet + 毛巾架，通行空间极小 |
| 8 | 适合真人完整游玩 | **NO** | 篮子重复 + 视觉拥挤 + P0_SCALE_OR_RENDERING_DEFECT 风险 |

**L3 P0 问题 — 6 个篮子详细位置**：

| 类型 | ID/标签 | 局部位置 | 可交互 |
|---|---|---|---|
| task | cnt-white-basket | (-1.1, 0.25, -1.3) | ✅ |
| task | cnt-dark-basket | (0, 0.25, -1.3) | ✅ |
| task | cnt-towel-basket | (1.1, 0.25, -1.3) | ✅ |
| decor | LaundryBasketModel #ef4444 | (-1.0, 0.25, -0.3) | ❌ |
| decor | LaundryBasketModel #3b82f6 | (0, 0.25, -0.3) | ❌ |
| decor | LaundryBasketModel #22c55e | (1.0, 0.25, -0.3) | ❌ |

→ 装饰篮在 task 篮前方（z=-0.3 vs z=-1.3），玩家先看到装饰篮，尝试交互失败。

**L3 MVP 必要元素**：洗衣机(视觉)、烘干机(视觉)、白色篮、深色篮、毛巾篮、任务衣物、房门
**L3 REMOVE_CANDIDATE**：3 个装饰篮、3 个 cabinet (CoffeeTableModel)、毛巾架、3 墙毛巾、3 地上毛巾、植物、垃圾桶、装饰 mesh

**P0_SCALE_OR_RENDERING_DEFECT 调查**：
- Laundry 无 GLB 模型，全部程序化几何
- 3 个 CoffeeTableModel (#6b7280 灰色, 0.6×0.9×0.5) 在西墙排列 → 低光下可能呈黑色块
- 2 个 WashingMachineGeometry (#6b7280, 0.6×1.1×0.6) 在北墙 → 灰色大块
- 无法确认截图中的"巨大黑色模型"具体是哪个 → **NEEDS_MORE_EVIDENCE**

---

## 二、特别调查

| # | 调查项 | 结果 | 证据 |
|---|---|---|---|
| 1 | Laundry 巨大黑色模型 | **NEEDS_MORE_EVIDENCE** | 最可能：3 个 CoffeeTableModel (#6b7280) 或 2 个 WashingMachineGeometry (#6b7280)，但无截图无法确认 |
| 2 | Living 浅色沙发状物体 | **loungeSofa.glb** | decor-sofa-main modelAssetId='furniture/loungeSofa'，B3 curl HTTP 200 (9644 bytes) |
| 3 | Dining 悬浮/重叠容器所有者 | **CODE_REVIEW** | renderDining 4 个装饰杯子 cylinderGeometry (Y=0.92) 在餐桌 (cnt-dining-table surfaceHeight=0.9) 上方，与 task 物品 (obj-dirty-cup/obj-tissue/obj-fork) 重叠 |
| 4 | 标签/ring 过大 | **HUMAN_UNVERIFIED** | 需实机观察 interaction ring 和标签渲染 |
| 5 | V 俯视模式误判 | **HUMAN_UNVERIFIED** | 需实机按 V 键观察 |
| 6 | 5 GLB 真实 HTTP 200 | **PASS** | B3 curl 5/5 HTTP 200 (BROWSER_OBSERVED) |

---

## 三、最小修复队列（前 8 项）

| # | 级别 | Level | 问题 | 证据 | 所有者/文件 | 操作 | 预计修改文件 | 需复测 |
|---|---|---|---|---|---|---|---|---|
| 1 | **P0** | L3 | 6 个篮子并存（3 task + 3 decor），玩家无法区分 | CODE_REVIEW: Room3D.tsx:697-713 renderLaundry 3 个 LaundryBasketModel | Room3D.tsx renderLaundry | **remove** 3 个装饰 LaundryBasketModel | Room3D.tsx | ✅ |
| 2 | **P0** | L3 | 3 个 CoffeeTableModel 作 cabinet 可能是"巨大黑色模型" | CODE_REVIEW: Room3D.tsx:673-689 renderLaundry 3 个 CoffeeTableModel #6b7280 | Room3D.tsx renderLaundry | **remove** 3 个 cabinet | Room3D.tsx | ✅ |
| 3 | **P0** | L2 | Entrance 装饰托盘与 task 托盘并存 | CODE_REVIEW: Room3D.tsx:118-122 EntranceTrayFallback vs leave-home.ts cnt-entrance-tray | Room3D.tsx renderEntrance | **remove** EntranceTrayFallback | Room3D.tsx | ✅ |
| 4 | **P1** | L1 | 7 个 CoffeeTableModel 作 cabinet 淹没必要容器 | CODE_REVIEW: Room3D.tsx:379-413 renderDiningKitchen 6 个 + :794-798 renderDining 1 个 | Room3D.tsx renderDiningKitchen + renderDining | **remove** 全部 cabinet | Room3D.tsx | ✅ |
| 5 | **P1** | L1 | 厨房设备 (fridge/sink/stove/microwave) 与 L1 无关 | CODE_REVIEW: Room3D.tsx:415-497 renderDiningKitchen | Room3D.tsx renderDiningKitchen | **remove** 厨房设备 | Room3D.tsx | ✅ |
| 6 | **P1** | L2 | Living 2 灯 + 3 植物遮挡视线 | CODE_REVIEW: Room3D.tsx:335-363 renderLiving LampFallback×2 + PlantFallback×3 | Room3D.tsx renderLiving | **remove** 灯和植物 | Room3D.tsx | ✅ |
| 7 | **P2** | L1 | 餐桌上方 4 装饰杯子与 task 物品重叠 | CODE_REVIEW: Room3D.tsx:806-824 renderDining 4 cylinderGeometry at Y=0.92 | Room3D.tsx renderDining | **remove** 装饰杯子 | Room3D.tsx | ✅ |
| 8 | **P2** | L3 | 毛巾架 + 6 个装饰毛巾干扰 | CODE_REVIEW: Room3D.tsx:715-760 renderLaundry TowelRackModel + TowelFallback×6 | Room3D.tsx renderLaundry | **remove** 毛巾架和装饰毛巾 | Room3D.tsx | ✅ |

---

## 四、每关 MVP 场景清单

### L1 MVP
**保留**：餐桌 (cnt-dining-table)、洗碗机 (cnt-dishwasher)、垃圾桶 (cnt-trash-bin)、餐具架 (cnt-utensil-rack)、脏杯子、餐巾纸、叉子、两个门洞、地毯
**移除**：7 cabinet、fridge、sink、stove、microwave、吊灯、挂画、时钟、植物、装饰杯子、装饰圆柱、椅子

### L2 MVP
**保留**：茶几 (cnt-coffee-table)、沙发 (decor-sofa-main)、电视组合 (decor-tv-stand + decor-tv)、书架 (decor-bookshelf)、床头柜 (cnt-nightstand)、玄关托盘 (cnt-entrance-tray)、伞架 (cnt-umbrella-stand)、钥匙/手机/雨伞、猫脚印、地毯、枕头
**移除**：2 灯、3 植物、墙架 (ShelfFallback)、EntranceTrayFallback、Entrance 装饰 mesh

### L3 MVP
**保留**：2 洗衣机 (WashingMachineGeometry)、白色篮 (cnt-white-basket)、深色篮 (cnt-dark-basket)、毛巾篮 (cnt-towel-basket)、7 件任务衣物、房门
**移除**：3 装饰篮 (LaundryBasketModel)、3 cabinet (CoffeeTableModel)、毛巾架 (TowelRackModel)、6 装饰毛巾 (TowelFallback)、植物、垃圾桶、装饰 mesh

---

## 五、Gate

```
READY_FOR_MVP_FIX
```

**理由**：
- 代码审查发现 3 个 P0 阻断问题（L3 篮子重复、L3 黑色块、L2 托盘重复），修复方向明确
- 5 个 P1/P2 视觉干扰问题均为 REMOVE 操作，不涉及布局重设计
- 5 GLB HTTP 200 已确认 (BROWSER_OBSERVED)
- 所有修复集中在 Room3D.tsx 一个文件的 renderXxx 函数中
- 无需下载新模型、无需修改布局坐标、无需修改状态机

**未验证项（需真人复测）**：
- Laundry "巨大黑色模型"具体实体（NEEDS_MORE_EVIDENCE）
- 标签/ring 尺寸是否过大
- V 俯视模式是否造成误判
- 真人完整通关体验

---

**报告生成完毕。本轮未修改任何代码。**
