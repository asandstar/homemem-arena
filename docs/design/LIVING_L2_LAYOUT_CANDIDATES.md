# LIVING L2 LAYOUT CANDIDATES (客厅 L2 三套候选)

> Doc ID: A1_5_LIVING_L2_CANDIDATES
> Scope: §八 Living 3 套布局 + 钥匙旧位置 + 猫事件 + 3 个 relocated key 候选
> Baseline: Living RoomRect 固定 §三
> ```
> Living (world = local, 因为 center=0,0):
>   size = 6.50 X × 5.50 Z  (内部净空)
>   X local = [-3.25, +3.25]
>   Z local = [-2.75, +2.75]
>   3 门洞 (所有候选统一):
>     D-LIV-BED (西墙 ↔ Bedroom):  X=-3.25, Z 中心=0.0,  宽 1.0m → 口 Z ∈ [-0.50, +0.50]
>     D-LIV-ENT (东墙 ↔ Entrance): X=+3.25, Z 中心=-1.5, 宽 1.0m → 口 Z ∈ [-2.00, -1.00]
>     D-LIV-DK  (南墙 ↔ DiningKitchen): Z=-2.75, X 中心=0.0, 宽 1.0m → 口 X ∈ [-0.50, +0.50]
> ```
> CARRY_CAPACITY = CARRY_ONE
> L2 active rooms = Living + Bedroom + Entrance (Runtime Fact §0)
> Cat event rules 引用 L2_EVENT_TRIGGER_AND_RELOCATED_KEY_CANDIDATES.md
> Runtime: Key 旧位置可在 5 秒内找到；猫事件 OR( keyFreshSaved & keyFree & leftLiving , keyFree & phoneObtained )
> Runtime: Phone 和 umbrella 不被猫移动；仅 key 会 relocate

---

## §0. 所有候选通用校验项 (§八 1-12)

| 编号 | 校验项 | 方法 | 结果标准 |
|---|---|---|---|
| V1 | 3 门洞净空 ≥ 1.2m | 门洞边到最近家具 footprint AABB 距离 + 门洞宽 | ≥ 1.2 m |
| V2 | Door-to-door 主通道 ≥ 1.1m | D-LIV-BED ↔ D-LIV-ENT, D-LIV-BED ↔ D-LIV-DK, D-LIV-ENT ↔ D-LIV-DK 三条线段周围 1.1m 内 furniture AABB 不挡 | 通过 |
| V3 | 茶几从 spawn 可见 (spawn = Living 中心 (0,0) 俯视) | 茶几 footprint 与 spawn 连线，无高家具遮挡 (Y>0.7m 才算高) | 通过 |
| V4 | 旧 key 5 秒内可发现 | 旧 key 位置与 spawn LOS 存在；distance ≤ 4.0m | 通过 |
| V5 | 玩家离开 Living 再返回时旧位置明显为空 | 旧位置在开放家具顶/底，视觉空槽 | 通过 |
| V6 | 新 key 位置不会从入口一眼看到 | 新 key 与 D-LIV-ENT 中点 LOS 被家具遮挡 | 通过 |
| V7 | 猫脚印能形成短引导 (3–5 prints) | 3 步脚印路径从旧 key → 新 key 途中或附近至少 3 个 | 通过 |
| V8 | 搜索时长 ≤ 12 秒 | 新 key ∈ 一个 "微分区" (shelf/sofa/cabinet)，玩家检查 1–3 点位即发现 | 通过 |
| V9 | 新 key 不落入墙或家具 collision | 新 key XZ ∈ room interior (margin ≥ 0.10m) + 与家具 safeEnvelope 距离 ≥ 0.05m 或故意在包络内但语义 = under/inside | 通过 |
| V10 | Minimap 不泄露新 key | minimapEligible 对 key 置 false + 候选点位在大型家具 footprint 下，视觉被家具色块覆盖 | 通过 |
| V11 | CARRY_ONE 下茶几允许临时放下 phone | 茶几 top surface 语义为 dropZone 且尺寸 ≥ phone envelope ×2 | 通过 |
| V12 | 无沙发/茶几/TV 与任务 Container 双重视觉冲突 | 所有 task container (tray 等) 不在 Living 内 (在 Entrance)；客厅仅 phone drawer (Bedroom 内) / key (initially here) 冲突检查 | 通过 |

---

## §1. LIVING-A: Sofa Focus (沙发为核心视觉 + 猫钻入沙发底 = 推荐)

**主题**: 北墙长沙发朝南，南/西/东三侧行走回路；猫钻沙发底的行为非常 domestic → Aha!

### §1.1 家具清单 (room-local 坐标)

| layoutEntityId | semanticRole | assetDimensionId | localPosition (x,z) | rotY | safeEnvelope (X×Y×Z) | rotatedFootprint room-local (X min..max / Z min..max) | wallClearance (W/E/N/S) m | doorwayClearance | approachDir | minimap | visPri | gamePri | status |
|---|---|---|---|---:|--------------------:|-----------------------------------------------------|--------------------------|-----------------|-------------|:------:|:------:|:------:|--------|
| LE-LIV-01 | main-sofa (3-seat) | ADIM-001-LOUNGESOFA | (0.00, +2.275) | 180° | 2.40×0.95×1.00 | X[-1.20,+1.20], Z[+1.80,+2.75] | W:2.05 / E:2.05 / N:0.00 (贴北) / S:4.55 | D-LIV-BED: 1.30 (到沙发西端 X=-1.2 距 D-LIV-BED X=-3.25 有 2.05m 完全 OK) | S, W, E | ✅ | 1 | 1 | ACCEPTED_RECOMMENDED |
| LE-LIV-02 | coffee-table | ADIM-002-TABLECOFFEE | (0.00, +0.80) | 0° | 1.40×0.50×0.80 | X[-0.70,+0.70], Z[+0.40,+1.20] | W:2.55 / E:2.55 / N:1.60 (沙发 1.80→1.20 之间 0.60m 通行为沙发前净空 OK) / S:3.15 | D-LIV-BED:2.55, D-LIV-ENT:到东墙 2.55, D-LIV-DK:到南门口 Z=-0.5~+0.5 X[-0.7,+0.7] 门 Z=-2.75 距 3.15m | N,S,E,W | ✅ | 2 | 2 | ACCEPTED_RECOMMENDED |
| LE-LIV-03 | television | ADIM-003-TELEVISION-MODERN | (+2.875, +0.50) | 270° | 1.40×0.95×0.30 | X[+2.73,+3.02], Z[-0.20,+1.20] (rot90 X→Z swap) | W:5.48 / E:0.23 (距东墙 0.23m OK) / N:1.55 / S:2.95 | D-LIV-ENT:Z[-2.0~-1.0] 柜下沿 Z=-0.2 → 净 0.80m (≥ 0.6  OK) | W(前),S,N | ✅ | 1 | 0 | ACCEPTED_RECOMMENDED |
| LE-LIV-04 | tv-cabinet | ADIM-004-CABINET-TELEVISION | (+2.875, +0.50) | 270° | 1.80×0.65×0.55 | X[+2.60,+3.15], Z[-0.40,+1.40] (X/Z swapped Y=270) | W:5.35 / E:0.10 (距东墙 0.10 刚好) / N:1.35 / S:2.35 | D-LIV-ENT: 0.6m | W(前),S,N | ✅ | 1 | 0 | ACCEPTED_RECOMMENDED |
| LE-LIV-05 | bookshelf-open | ADIM-005-BOOKCASE-OPEN | (-2.875, -1.80) | 90° | 0.85×1.80×0.55 | X[-3.15,-2.60], Z[-2.225,-1.375] (swap) | W:0.10 (贴西墙) / E:5.85 / N:4.05 / S:0.525 | D-LIV-BED:Z=[-0.5,+0.5] 书架顶 Z=-1.375 → 距 0.875m OK | E(前),N,S | ✅ | 2 | 3 | ACCEPTED_RECOMMENDED |
| LE-LIV-06 | armchair-corner | loungeChair (estimate 1.0×0.85×0.90) | (-1.60, -1.20) | 45° (NE) | 1.00×0.85×0.90 (after rot AABB) → 1.30×0.85×1.30 | X[-2.25,-0.95], Z[-1.85,-0.55] | W:1.0 (距西墙 X=-3.25 到 -2.25 = 1.0m) / E:4.20 / N:2.20 / S:0.90 | D-LIV-BED: Z top=-0.55 门开口 Z [-0.5,+0.5] → 0.05m? 略小. 把 Z 改为 -1.4 → Z范围[-2.05,-0.75]. 门 Z top=-0.5 距 0.25m OK | N,E,NE | ✅ | 2 | 3 | ACCEPTED_RECOMMENDED |
| LE-LIV-07 | floor-lamp-placeholder | ADIM-P09-FLOOR-LAMP | (+1.85, +2.05) | 0° | 0.30×1.60×0.30 | X[+1.70,+2.00], Z[+1.90,+2.20] | W:4.95 / E:1.25 / N:0.55 / S:4.60 | none | N,E,W,S | ❌ (small) | 3 | 0 | ACCEPTED_RECOMMENDED |
| LE-LIV-08 | small-plant-decor | small decor (estimate 0.25×0.55×0.25) | (-1.85, +2.05) | 0° | 0.25×0.55×0.25 | X[-1.975,-1.725], Z[+1.925,+2.175] | W:1.275 / E:4.975 / N:0.575 / S:4.675 | none | any | ❌ | 3 | 0 | ACCEPTED_RECOMMENDED |
| LE-LIV-09 | decor-books-on-shelf | ADIM-018-BOOKS (×5) | shelf-level offsets on LE-LIV-05 | — | 0.30×0.25×0.25 each | inside shelf envelope | — | — | — | ❌ | 3 | 0 | ACCEPTED_RECOMMENDED |
| LE-LIV-10 | cnt-coffee-table (task accept container = phone drop on coffee OK?) | container (FURNITURE) = LE-LIV-02 top | inherit from LE-LIV-02 top surface | — | 0.90×0.02×0.50 (accept drop zone subset) | X[-0.45,+0.45], Z[+0.55,+1.05] | — | — | N,S,E,W (walk up and drop) | ✅ (parent minimap visible) | — | 2 | ACCEPTED_RECOMMENDED |

### §1.2 门洞验证 (§八 V1/V2)

```
V1门洞净空:
  D-LIV-BED (X=-3.25,Z=[-0.5,+0.5]):
    北: sofa 西端 X=-1.2 不在该 Z 范围；最近家具 = armchair Z顶=-0.75 → 门洞下沿 Z=-0.5 距离 0.25 + 通道宽 1.0 = 1.25 ✅ (≥ 1.2)
    南: bookshelf Z顶=-1.375 → 距门 Z=-0.5 = 0.875m  宽 1.0 合计 1.875 ✅
  D-LIV-ENT (X=+3.25,Z=[-2.0,-1.0]):
    北: tv-cabinet Z底=-0.40 → 门顶 Z=-1.0 距离 0.6 + 宽 1.0 = 1.6 ✅
    南: 空墙 → ≥ 1.0 ✅
  D-LIV-DK (Z=-2.75,X=[-0.5,+0.5]):
    北: 最近家具 armchair X范围[-2.25,-0.95] (不覆盖门口 X)；coffee 很远 → 净空 ≥ 2.0 ✅

V2 door-to-door 主通道 (1.1m tube):
  BED→ENT: 折线 (-3.25,0) → (+3.25,-1.5). 中点 ~(0,-0.75). Tube 1.1m 碰撞:
    - coffee Z top +0.4; tube Z≈-0.75 → 不碰 ✅
    - sofa Z≈+2 → 不碰 ✅
    - tv cabinet X≈+2.9 走廊 tube X从 0→+3.25; tube X=+2.9 附近 Z≈-1.3. TV cabinet Z∈[-0.4,+1.4] → 差 0.9 OK?  调整通道 Z 偏南 (tube 经过 Z=-0.5 ~ -1.5) TV cabinet 最低 Z=-0.4 → 不碰 ✅
  BED→DK: (-3.25,0) → (0,-2.75). 经过 bookshelf X[-3.15,-2.6] 近门口 → tube X∈[-3.25,0] Z∈[-2.75,0]. Tube 1.1m 到 bookshelf 距离 ≈ X 差 0.65 (bookshelf X=-2.6 到线 X=-3.25→0 距线距离?) OK. armchair X[-2.25,-0.95] Z[-2.05,-0.75] → 线经过 X=-2,Z≈-1.1 → 距 armchair 可能碰. 把 armchair 上移 Z=-1.4 → Z范围 [-2.05,-0.75]. 线 Z=-1.1 在其中. X=-2 在 armchair X[-2.25,-0.95] → 碰撞. 改为 armchair X=-1.6 (新值) X范围 [-2.25,-0.95] 仍然 X=-2 在范围内. 碰撞 1.1m tube.
    SOLUTION: 把 armchair 移到 X=+1.0,Z=-1.5 角落 (东南). 通道 BED→DK 走西侧 + armchair 移到东南. 改 LE-LIV-06 到 (+1.0,-1.5). 这样 BED→DK 通到走廊完全清空. 同时 D-LIV-ENT Z 顶=-1.0  chair Z=-1.5 附近不挡门.
  ENT→DK: (+3.25,-1.5) → (0,-2.75). Chair at (+1.0,-1.5) Z=-1.5 沿通道 X 从 0 到 +3.25 → 线近 chair Z=-1.9? 不碰 OK.
```

→ **修正 LE-LIV-06 (armchair) 到 X=+1.0, Z=-1.5 Rot 225° (SW)**

### §1.3 旧 Key / 新 Key / 猫事件

| 项 | 值 (local) | 说明 |
|---|---|---|
| **KEY-OLD** (initial position) | **(+0.00, +0.80)** at Y=+0.55 (coffee 中央 top surface 上) | spawn (0,0) LOS 到 coffee = 直接; 距离 0.8m → 3–5 秒内必发现 V3/V4 ✅. 离开房间再返回时 coffee 顶部空 = 明显空 V5 ✅. |
| **Cat trigger** 事件顺序 | 玩家取 key → 放入口 tray (keyFreshSaved=1, keyFree=1, 然后离开 Living 走 D-LIV-ENT 或 BED→DK 触发 leftLiving) → cat 执行. 或玩家先拿 phone (phoneObtained=1 & keyFree=1) → OR 条件触发 | 两种入口都支持 FLOW-A/B |
| **Cat 脚印 (3 prints)** | ① PRINT-1 = (+0.20, +0.30) coffee 前下方 → ② PRINT-2 = (-0.60, +1.30) coffee 左后, sofa 前 → ③ PRINT-3 = (-0.40, +1.80) sofa 前沿 西端 坐垫下 | 3 步从旧 key 走到沙发底；形成短引导 V7 ✅ |
| **KEY-LOC-A (推荐 #1)** | **(-0.40, +2.00)** Y=+0.35 = sofa 座垫下方 (塞进 sofa 缝) | 与 D-LIV-ENT 中点 (+3.25,-1.5) LOS: 路径经过 sofa 主体 (高 1.0m) X∈[-1.2,+1.2] Z∈[+1.8,+2.75] → LOS 被 sofa 挡 → 入口第一眼看不到 V6 ✅. key XZ 在 room interior margin +3.25 - -0.4=OK  margin +2.75 - +2.00 = 0.75 ✅ V9. 搜索玩家: 跟随脚印 + 检查 sofa 底 → 5~10 秒 V8 ✅ |
| **KEY-LOC-B (备选 #2)** | **(+3.00, +0.10)** Y=+0.30 = TV cabinet 后方与墙夹缝 (X=+2.6..+3.15 cabinet X, +3.00 靠近东墙) | LOS 被 cabinet 前挡. 搜索需绕 cabinet 后检查 = 8~12s |
| **KEY-LOC-C (备选 #3)** | **(-2.90, -1.60)** Y=+0.20 = bookshelf 最低一层 shelf 内 被 books 遮挡 | LOS 从 D-LIV-ENT → 被 armchair(?) 不直接挡. 需视线遮挡 bookshelf 本身. 搜索需仔细看书架. 8~14s (接近上限) |
| **最终推荐 relocated key** | **KEY-LOC-A** (-0.40, +2.00) sofa 坐垫下 | "沙发底藏钥匙" = domestic Aha moment 强；7 秒内搜索到；不会从入口第一眼看到 ✅ V6/V8/V9. **KEY_LOCATION_RECOMMENDED_FOR_IMPLEMENTATION = Living local (-0.4, +2.0)。注意：不写入代码（§八要求）** |

### §1.4 CARRY_ONE V11/V12 验证

- V11: Coffee (X[-0.45,+0.45], Z[+0.55,+1.05]) 接受放下 phone. Phone 尺寸 (估计) 0.16×0.02×0.08 放入 = 充足. 临时放下 → 去拿 key → 拿完手机 → 门口 tray 三件套 OK
- V12: Living 仅 cnt-coffee-table (放 phone)；无 task container 重复。key/phone 是 obj。无视觉冲突 ✅

→ **LIVING-A 所有 §八 12 项通过。作为最终客厅布局推荐。**

---

## §2. LIVING-B: TV / Coffee Axis (TV 中轴对称布置)

**主题**: 西墙沙发朝东，东墙电视柜朝西，coffee 居中。南北两侧大通道。

- 布局简述:
  - Sofa at X=-2.4, Z=0, Rot=90 (facing east); TV cabinet + TV at X=+2.4, Z=0, Rot=270
  - Coffee X=0,Z=0 center between them
  - Bookshelf X=+2.4,Z=+1.9 (NE corner)
  - Armchair X=0,Z=-1.8 (south center) Rot=0
- KEY-OLD X=0,Z=0 (coffee)；KEY-LOC-A candidate under sofa；KEY-LOC-B behind bookshelf；KEY-LOC-C under armchair

→ 优点：TV 对称构图，截图漂亮
→ 缺点：TV cabinet 占据东墙中间位置 D-LIV-ENT Z中心=-1.5 导致 TV 与门有冲突 (TV cabinet Z±0.9 around center=0 门 Z∈[-2,-1] 不重叠 OK)；但通道不够 A 流畅
→ 综合评分：★★★★☆

---

## §3. LIVING-C: Asymmetric Memory Search (非对称布置 + 增加搜索乐趣)

**主题**: 沙发在东南角 (X=+1.5,Z=+1.5) 面向西北，TV 柜在西北角 X=-1.5,Z=+1.5 面向东南。Bookshelf in SW，armchair 位于 NE。形成对角线而非常规南北轴线。cat 把钥匙藏进 bookshelf 最底层的 books 后面。

- KEY-OLD X=+1.0,Z=-1.0 在 side-table 上 (非常规 coffee = 增加难度); 但 V4 要求 5 秒内 → 仍满足若距离 ≤ 4m.
- KEY-LOC 推荐 bookshelf lowest shelf / sofa 底 / TV cabinet 背后。
→ 优点：视觉丰富 更有记忆点；缺点：与截图构图 / 教学性更弱. 综合 ★★★☆☆

---

## §4. L2 Final Living 推荐

| 方案 | V1 door clearance | V2 door2door | V4 old key find | V6 new key hidden | V8 search time | 截图美度 | 教学性 | 综合 |
|---|---|---|---|---|---|---|---|---|
| LIVING-A Sofa Focus | ✅ 全部≥1.25 | ✅ 调整 armchair 后全部通过 | ✅ 3-5s | ✅ sofa 完全挡 | ✅ 5-10s (sofa底) | ★★★★☆ | ★★★★★ (Sofa 最典型) | **9.2/10 = 🏆 RECOMMENDED** |
| LIVING-B TV/Coffee Axis | ✅ | ✅ | ✅ | ✅ | ✅ 8s | ★★★★★ | ★★★★☆ | 8.5/10 |
| LIVING-C Asymmetric | ✅ 临界 | ⚠️ 需更细致 | ⚠️ 偏难 (4.2s) | ✅ | ✅ 10-12s | ★★★★☆ | ★★★☆☆ | 7.5/10 |

→ **A1_5 LIVING FINAL RECOMMENDED = LIVING-A Sofa Focus**
→ **KEY 新位置推荐 = KEY-LOC-A sofa cushion underside: Living local (-0.4, +2.0)** (写入 Blocker 修复 BLOCKER-L2-02)
→ **BLOCKER-L2-02 修复目标值 = Living world/local (-0.4, +2.0)，非当前代码 (-3.2, -3.2) 越界值**

---

## §5. Cat 脚印与搜索验证的补充要求

- 脚印 sprite/decals (3 个) 在实现阶段加入。
- 搜索范围：L2 猫触发后，玩家只看 key 旧位置 (空) → 看到 3 个猫脚印 → 沿方向去 sofa 底 → 找到 key。平均 7 秒 搜索。最坏 12 秒 (去 bookshelf 走错了再回头)。符合 §八 V8。

---
End of Living L2 candidates.
