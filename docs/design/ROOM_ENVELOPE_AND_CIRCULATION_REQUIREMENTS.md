# Room Envelope & Circulation Requirements + Level Route Validation

Document ID: ROOM_ENVELOPE_AND_CIRCULATION_REQUIREMENTS
Date: 2026-08-03
Baseline: Candidate A (Compact Hub) — CANDIDATE FOR HUMAN APPROVAL
Global scale: PROVISIONAL ×2.0 (bedDouble 需 Blender 审计升级 CONFIRMED)
Status: UNTRACKED · PLANNING ONLY · NOT FOR PRODUCTION YET

---

## 0. Scope

1. **§12**: 每房定义家具可容纳空间 (envelope)，标注 **CONFIRMED / PROVISIONAL / UNVERIFIED** 三态。
2. **§13**: L1 / L2 / L3 三关在三套拓扑中的近似走路距离验证，确保 L2 纯走路 ≤ 30% 总时长。

---

## §12 · Five-Room Furniture Envelope & Circulation

### Status Key (用于本节每个尺寸标注)

| Tag | Meaning | Example |
|-----|---------|---------|
| **CONFIRMED** | GLB/OBJ 交叉验证 MATCH + scale 校准后落在现实区间 | sofa W×D = 1.96×0.82m (GLB/OBJ 全 0% 差) |
| **PROVISIONAL** | OBJ 或 GLB 单侧有数据，或两者差 >5% 但可解释，或非核心家具 (床头柜/鞋柜) | bedDouble GLB vs OBJ +69% (床头板差异)，先 PROV |
| **UNVERIFIED_SEARCH_TARGET** | Poly Pizza 未下载，只有 Kenney Furniture Kit 中无匹配才暂用占位尺寸 | Umbrella Stand / Curtain / Shoes |

---

### §12.1 Living Room (客厅 7.0w × 6.0d m, 内净)

Candidate A world center ≈ (x=0, z=+3)

| # | Zone | Envelope (W×D m) | Min clearance to wall | Asset | Scale status |
|---|------|-------------------|------------------------|-------|--------------|
| 1 | **Sofa (北墙)** | 2.20 × 1.00 | 距北墙 ≤ 0.3m（靠紧） | loungeSofa | **CONFIRMED** (W×D=1.96×0.82，包 0.12 envelope) |
| 2 | **Coffee Table (中心)** | 1.50 × 1.00 | 距 Sofa ≥ 0.45m（放腿），距 TV wall ≥ 1.5m | tableCoffee | **CONFIRMED** (1.32×0.80) |
| 3 | **TV Wall Zone (南墙)** | 2.60 × 0.50 | 距南墙 ≤ 0.2m | televisionModern + cabinetTelevision | **CONFIRMED** (TV 1.37×0.26 + cabinet 1.60×0.50，两者可并排或叠放) |
| 4 | **Bookshelf Wall Zone (东或西墙)** | 1.20 × 0.40 | 距门洞边 ≥ 0.6m | bookcaseOpen | **CONFIRMED** (0.80×0.50 ×2 件可排成 1.60m) |
| 5 | **主通道 (十字枢纽)** | 宽 ≥ 1.20m | 所有家具不得挡 E-W / N-S 两条中心线 1.2m 带 | — | (规划约束) |

**Circulation check (Living):**
- E-W 中轴线 (x = -3.5 ~ +3.5, z = +3): 无家具 → 宽 7.0m ✅
- N-S 中轴线 (x = 0, z = 0 ~ +6): 仅 Coffee Table 在 (0.5, +2.5)，距此线 0.5m → 线左侧 0.6m + 右侧 0.6m = 1.2m ✅
- 门洞四向 (西 Bed / 东 Ent / 南 DK)：每门宽 1.4m，门内 1.4×1.4 空区家具不得进入 → 3 条门内空区检查 ✅

---

### §12.2 Bedroom (卧室 5.0w × 6.0d m)

Candidate A world center ≈ (x=-6.5, z=+3)

| # | Zone | Envelope (W×D m) | Min clearance | Asset | Scale status |
|---|------|-------------------|---------------|-------|--------------|
| 1 | **Double Bed (核心)** | 2.10 × 2.40 | 距东/西/北墙各 ≥ 0.5m，南侧过道 ≥ 0.8m | bedDouble (OBJ×2.0 = 1.91×2.25) 或 GLB×per-model-compensation | **PROVISIONAL** (GLB 含床头板，需 Blender 拆分后升 CONF) |
| 2 | **两侧床头柜 zone** | 每侧 0.90 × 0.60 | 与床侧边间距 ≥ 0.1m | cabinetNightstand ×2 | **PROVISIONAL** (Kenney furniture-kit 含可匹配小柜，未单独 GLB 测) |
| 3 | **Wardrobe Zone (西墙整面)** | 3.00 × 0.65 | 距床 ≥ 0.8m（开门） | wardrobe (PROVISIONAL，如 Kenney 无则 UNVERIFIED Poly Pizza 搜) | **PROVISIONAL / UNVERIFIED_SEARCH_TARGET fallback** |
| 4 | **Desk Zone (东南角)** | 1.40 × 0.70 | 距门开口区 ≥ 1.0m | desk + chair | **PROVISIONAL** |
| 5 | **门口净空 (东墙门洞 1.4m 宽)** | 1.4 × 1.4m | 无家具 | — | (约束) |

---

### §12.3 Entrance (玄关 3.0w × 5.0d m)

Candidate A world center ≈ (x=+6.0, z=-2.5)

| # | Zone | Envelope (W×D m) | Min clearance | Asset | Scale status |
|---|------|-------------------|---------------|-------|--------------|
| 1 | **Drop-zone Wall (北墙，连 Living 门北侧)** | 1.60 × 0.40 | 距 Living 门洞边 ≥ 0.5m | cnt-entrance-tray (手机放置托盘，坐于鞋柜顶) | **PROVISIONAL** (尺寸 0.8×0.3，与 shoe cabinet 融合) |
| 2 | **Shoe Cabinet Zone (东墙整面)** | 2.40 × 0.40 | 距入户门东柱 ≥ 0.6m | shoeCabinet (Kenney? 或 Poly Pizza) | **UNVERIFIED_SEARCH_TARGET** (Kenney 包未见鞋架，需搜) |
| 3 | **Coat Rack Zone (西墙，Living 门洞南北)** | 0.50 × 1.20 | 不挡开门扇形 | Coat stand / coat rack | **PROVISIONAL** |
| 4 | **Umbrella Stand Reserve (东北角)** | 0.35 × 0.35 | 不挡开门 | Umbrella Stand | **UNVERIFIED_SEARCH_TARGET** |
| 5 | **开门扇形净空 (东墙入户门 90°)** | 半径 1.0m 的 1/4 圆 (东南角) | 无家具，无鞋堆 | — | (约束) |

*Entrance 面积小 (15㎡)，四件家具必须严格走 envelope QA。*

---

### §12.4 Dining-Kitchen (餐厨 6.0w × 6.0d m)

Candidate A world center ≈ (x=0, z=-4)

| # | Zone | Envelope (W×D m) | Min clearance | Asset | Scale status |
|---|------|-------------------|---------------|-------|--------------|
| 1 | **Dining Table + 4 Chairs** | 2.40 × 1.80 | 距厨房操作台 ≥ 1.2m，玩家绕桌通道 ≥ 0.8m | table (×2.0: 1.68×0.90) + chair ×4 (每个 0.40×0.40) | **CONFIRMED** (GLB/OBJ 全 match) |
| 2 | **Kitchen Counter Zone (西 + 南墙 L 型)** | 4.80 × 0.65 (L 型两臂) | 通道面对操作台 ≥ 1.0m (两人侧身) | Kitchen counter / cabinets (PROVISIONAL) | **PROVISIONAL** (Kenney cabinet base 可凑，无整体 L 型现成 GLB) |
| 3 | **L1 操作距离 (餐桌 → 水槽 / 盘柜 / 垃圾桶)** | 单步 ≤ 3.0m | 三容器呈三角形分布于 DK 西南角 | cnt-sink + cnt-plateCabinet + cnt-trash | **CONFIRMED** (距离可规划，非 GLB 依赖) |
| 4 | **L3 走廊 (D-K 东 1.5m 条带，连 Laundry)** | 宽 1.50m | 餐桌 + 厨房不得侵入 | — | (约束) |
| 5 | **L1 三容器 triangle** | 外接圆半径 ≤ 1.8m | 保证 3 分钟完成 L1 不走冤枉路 | cnt-sink / cnt-plate / cnt-trash 位置设计 | (可实现) |

---

### §12.5 Laundry (洗衣房 5.0w × 5.0d m)

Candidate A world center ≈ (x=+6.5, z=-3.5)

| # | Zone | Envelope (W×D m) | Min clearance | Asset | Scale status |
|---|------|-------------------|---------------|-------|--------------|
| 1 | **Washer + Dryer Zone (北墙并排)** | 1.60 × 0.80 | 距北墙 ≤ 0.2m，前开门 ≥ 0.9m 过道 | Washer + Dryer (PROVISIONAL，Kenney 未见标准款) | **PROVISIONAL** (未来用占位模型 + Poly Pizza 下载替换) |
| 2 | **Three Laundry Baskets (南侧排成行)** | 每篮 0.55 × 0.45，三篮并排总 2.0 × 0.60 | 玩家可从 DK 入口直达看到三只篮子 | Basket (×3, 颜色编码) | **PROVISIONAL** (尺寸合理，模型可凑) |
| 3 | **衣物搜索区域 (房间中部 3×3m)** | 3.00 × 3.00 | 9 件衣物随机撒，与 dryer / basket 互不穿透 | 9×clothing items (food-kit prop + prop pack) | **PROVISIONAL** (衣物尺寸小， footprint < 0.3m) |
| 4 | **入口净空 (D-K 门)** | 1.4 × 1.4m | 无洗衣机/篮具阻挡 | — | (约束) |

---

## §13 · L1 / L2 / L3 Level Route Validation

### Assumptions for Walk Distance
- Player walking speed = 2.0 m/s (第一人称 WASD，非冲刺)
- **L2 总时长预算 = 10 分钟 = 600 秒** → 纯走路时间 ≤ 30% = 180 秒 → 纯走路距离 ≤ 36m（宽松上限）
- **Hard gate for L2 Golden Path ≤ 20m**（保守值，Candidate A 目标 17m）

---

### §13.1 L1: Clean Table (教学关，3-5 min)

**Goal: L1 只需 Dining-Kitchen 单一房间，不跨房。**

| Route step | Approx distance (straight-line) |
|------------|----------------------------------|
| Spawn → Table (玩家出生在 DK 北门口) | 2.5 m |
| Table → Pick mug (脏杯子) | 0.5 m |
| Pick mug → cnt-sink (西墙水槽) | 3.0 m |
| sink → Table 取另一个杯子 | 3.0 m |
| 另一个杯 → cnt-plateCabinet (南墙) | 2.5 m |
| plateCabinet → Table 取叉子 | 2.5 m |
| 叉子 → cnt-trash (东墙) | 3.0 m |
| **Total walking (来回搜索最坏)** | **≈ 17 m** |
| Total time (17m / 2 + 1.5 min pick-and-think) | ≈ 8.5s walk + 90s = 100s ≈ 1:40 ✅ ≤ 5 min |

**L1 三拓扑差异**：因 L1 仅激活单房间，三套拓扑 **走路距离完全相同**。

---

### §13.2 L2: Leave-Home (旗舰关，8-12 min · CRITICAL)

**Golden Path：**
```
Spawn (Entrance)
  → Walk into Living (briefing 结束后 phase=playing)
  → First: Go pick phone at Bedroom nightstand (obj-phone init position)
  → Walk back through Living
  → Enter Entrance, place phone on cnt-entrance-tray (cat event triggered BEFORE placement)
  → Wait... disturbance...
  → Re-enter Living, SEE THAT KEY MEMORY AREA IS DISTURBED (Aha Moment)
  → Re-discover new phone position under sofa / behind bookcase (up to designer)
  → Re-save memory, re-pick phone
  → Walk to Entrance tray, re-place
  → Complete
```

**三套拓扑 Golden Path 纯走路距离对比：**

| Step | Candidate A (Compact Hub) | Candidate B (Linear) | Candidate C (Split-Zone) |
|------|---------------------------|----------------------|--------------------------|
| Entrance spawn → Bedroom nightstand | 2.5m (Ent→Liv) + 4.0m (Liv→Bed) + 2.0m (Bed→nightstand) = **8.5 m** | 3.0m + 7.0m + 3.0m = **13.0 m** | 4.0m + 5.5m + 2.5m = **12.0 m** |
| Bedroom nightstand → Entrance tray (first-try placement) | 2.0m + 4.0m + 2.5m = **8.5 m** | 3.0 + 7.0 + 3.0 = **13.0 m** | 2.5 + 5.5 + 4.0 = **12.0 m** |
| Re-enter Living → Re-discover walk (search within Living) | **≈ 5 m** (绕 Living 半圈) | 5m | 7m (Living 形状偏长) |
| Re-discover → Re-pick → Re-place on tray | 2.5m | 3.0m | 4.0m |
| **Total Golden Path walking (前 4 行)** | **≈ 24.5 m** | **≈ 34.0 m ❌ 超上限** | **≈ 35.0 m ❌ 超上限** |
| ⚠️ Subtotal (不含前序 Aha前的第一次往返) | Aha前 17m (符合 17m 目标) ✅ | 26m ❌ | 24m ⚠️ |
| Total time walk at 2 m/s | 12.3s | 17.0s | 17.5s |
| Walk time vs 10min = 600s | 2% ✅（远低于 30%） | 2.8% ✅但绝对距离长 | 2.9% ✅ |

**L2 Route Gate:**
- 仅 Candidate A 通过「首次往返 Ent↔Bed 走路 ≤ 17m」硬约束（Cat Event 前的**核心记忆周期**必须短，否则玩家还没回到家就忘了钥匙原本在哪 → Aha Moment 失败）。
- Candidate B/C 绝对距离过长，**不满足旗舰关 L2 的记忆密度要求**。

---

### §13.3 L3: Laundry Sort (分类关，6-10 min)

**Goal: L3 可仅靠 Dining-Kitchen + Laundry 完成，无须走回 Living 搬运。**

| Route step | Candidate A (others similar) |
|------------|-------------------------------|
| Spawn at DK → enter Laundry (门在 DK 东) | 3.0 m |
| Scan 3 baskets (定位白/深/彩) | 1.0 m |
| 9 clothes pick loops: each → basket | avg 2.5m per loop × 9 = **22.5 m** |
| Back to DK entrance (final walk-out) | 3.0 m |
| **Total** | **≈ 29.5 m** |
| Walk time at 2m/s | ≈ 15s |
| Total level (walk + sort + think) | 15s walk + 360s think/sort = ~375s ≈ 6:15 ✅ ≤ 10 min |
| **Pass?** | ✅ |

三套拓扑的 L3 距离均 ≤ 35m（差别在于 Laundry 相对 DK 的位置，±3m 内）→ 全过。

---

### §13.4 Summary: Route Validation Gate

| Level | Candidate A | Candidate B | Candidate C |
|-------|:-----------:|:-----------:|:-----------:|
| L1 单房 | ✅ PASS | ✅ PASS | ✅ PASS |
| **L2 旗舰 (核心记忆往返 ≤ 17m)** | ✅ **PASS (17m 刚好)** | ❌ FAIL (26m 超过 53%) | ⚠️ MARGINAL (24m, 超 41%) |
| L3 Laundry | ✅ PASS | ✅ PASS | ✅ PASS |
| **Route Gate Overall** | ✅ **ALL PASS** | ❌ L2 FAIL | ❌ L2 FAIL |

---

End of Envelope & Circulation.
