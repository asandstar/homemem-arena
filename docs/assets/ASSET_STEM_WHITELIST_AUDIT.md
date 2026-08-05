# ASSET_STEM_WHITELIST_AUDIT (资产 stem 白名单审计)

> Document ID: ASSET_STEM_WHITELIST_AUDIT
> Date: 2026-08-03
> Source of Truth: `docs/assets/ASSET_ACTUAL_CONTENT_INVENTORY.md` (**唯一 stem 白名单**)
> Audit Root: `/Users/azq/asandstar/homemem-arena-asset-audit-2026-08-03/unpacked/`
> Scope: 白名单解析 + 重点 stem INVALID 清除 + 新文档模型名审查
> Status: UNTRACKED · EVIDENCE ONLY · NO FABRICATION

---

## §0. 方法论

1. 唯一白名单 = **`ASSET_ACTUAL_CONTENT_INVENTORY.md`**。
   - **不得**从任意 .mtl / .obj 文件名反向推断 stem（可能有废弃 stem）。
   - **不得**声称某 stem "应该在 furniture-kit 里"除非它在 INVENTORY 行中被列出。
2. 白名单解析规则：
   - INVENTORY 每一行 `| stem | category | ... |` 中的第一列 = valid stem。
   - `furniture-kit/Models/OBJ format/{stem}.obj` 文件存在且 SHA-256 与 INVENTORY 一致才是 CONFIRMED。
3. 所有近期新文档（A1.5 blueprint、layout 规划等）涉及的模型名必须落在白名单内；
   任何不在白名单中的 stem 标记 **INVALID_STEM**，不得写 CONFIRMED / 尺寸 / 来自新 pack 的声明。

---

## §1. 白名单自动解析结果（唯一有效 stem 集合）

从 `ASSET_ACTUAL_CONTENT_INVENTORY.md` 解析（排除表头、分隔行、空行、总计行、不在 `furniture-kit/**/Models/OBJ format/*.obj` 根的行）：

### Group A: furniture-kit 装饰 / 储物 / 家具（16 stubs → 实际白名单 18 核心）

| # | Stem（stub 名） | 存在于白名单? | 物理文件存在? | CONFIRMED |
|---|------------------|:-------------:|:-------------:|:---------:|
| 1  | `loungeSofa`              | ✅ | ✅ OBJ+MTL+GLB | ✅ |
| 2  | `tableCoffee`             | ✅ | ✅ | ✅ |
| 3  | `televisionModern`        | ✅ | ✅ | ✅ |
| 4  | `cabinetTelevision`       | ✅ | ✅ | ✅ |
| 5  | `bookcaseOpen`            | ✅ | ✅ | ✅ |
| 6  | `table`                   | ✅ | ✅ | ✅ |
| 7  | `chair`                   | ✅ | ✅ | ✅ |
| 8  | `sideTable`               | ✅ | ✅ | ✅ |
| 9  | `bookcaseClosedDoors`     | ✅ | ✅ | ✅ |
| 10 | `washer`                  | ✅ | ✅ | ✅ |
| 11 | `dryer`                   | ✅ | ✅ | ✅ |
| 12 | `washerDryerStacked`      | ✅ | ✅ | ✅ |
| 13 | `bedSingle`               | ✅ | ✅ | ✅ |
| 14 | `bedDouble`               | ✅ | ✅ | ✅ |
| 15 | `desk`                    | ✅ | ✅ | ✅ |
| 16 | `officeChair`             | ✅ | ✅ | ✅ |
| 17 | `diningTable`             | ✅ | ✅ | ✅ |
| 18 | `bench`                   | ✅ | ✅ | ✅ |
| 19 | `cabinetLow`              | ✅ | ✅ | ✅ |
| 20 | `cabinetTall`             | ✅ | ✅ | ✅ |
| 21 | `tableBedside`            | ✅ | ✅ | ✅ |
| 22 | `wardrobe` (用户黑名单:需审计) | ⚠️ 见 §3 | ⚠️ | ⚠️ |

### Group B: building-kit 建筑构件

| # | Stem | Valid? | 备注 |
|---|------|:------:|------|
| B1 | `wall`                   | ✅ | 视觉厚度 0.1m (由 Room3D.tsx t=0.1 覆盖，非 stem 文件) |
| B2 | `wall-window-square`     | ✅ | building-kit 唯一窗 stem (与 "window-square-a" 不同) |
| B3 | `door-rotate-square-a`   | ✅ | building-kit 唯一入户门 stem |
| B4 | `stairs`                 | ✅ | A1.5 无楼梯暂不使用 |

### Group C: props / food / 手持物

| # | Stem | Valid? | 备注 |
|---|------|:------:|------|
| C1 | `mug`                    | ✅ | food-kit → 作为 L1 教学目标 (杯子放入柜子) |
| C2 | `plate`                  | ✅ | food-kit → 餐具架目标 |
| C3 | `bookRed` / `bookBlue` / `bookGreen` | ✅ | furniture-kit books → 书架 & 书桌填充 |
| C4 | `shoeBrown` / `shoeBlack`| ✅ | furniture-kit → 玄关鞋柜目标 |
| C5 | `clothesShirt` / `clothesPants` / `clothBathTowel` | ✅ | furniture-kit → Laundry L3 分类目标 (衬衫/裤子/浴巾三分类) |
| C6 | `basketLaundry`          | ✅ | furniture-kit → 三篮容器 |
| C7 | `phoneModern`            | ✅ | furniture-kit → L2 手机目标 (`obj-phone`) |
| C8 | `key`                    | ✅ | building-kit / prop → `obj-key` |

---

## §2. INVALID_STEM 黑名单（用户点名必须清除的 10 项）

**Rule**: 以下 stem 若出现在文档的 CONFIRMED / 尺寸表 / 布局占位中 → **立刻清除**，不得保留。

| # | Blacklisted Stem | 出现在白名单? | 问题 | 应替换为 |
|---|------------------|:-------------:|------|----------|
| X1 | `loveseatSofa`       | ❌ **NOT FOUND** | furniture-kit 无此 stem；loungeSofa 是唯一长沙发 | `loungeSofa` |
| X2 | `nightstand`         | ❌ **NOT FOUND** | 无此 stem；tableBedside = 床头柜 (白名单) | `tableBedside` |
| X3 | `wardrobe`           | ⚠️ WHITELIST 但 **未下载 / unpacked 不存在** | 若 INVENTORY 列出但 unpacked/ 无文件 → 也视为 INVALID（审计目录未 unpack 此 stem）。A1.5 Bedroom 衣物存储请用 **bookcaseClosedDoors + clothBathTowel/clothesShirt/clothesPants inside** 代替，直至 wardrobe 真正存在于 unpacked 目录 | `bookcaseClosedDoors` (替代); 或写 `WARDROBE_NOT_PACKED` 保留缺口 |
| X4 | `dishwasher`         | ❌ **NOT FOUND** | furniture-kit 无洗碗机 stem；L1 三目标是：**washer（或 cabinetLow）+ basketLaundry + cabinetTall**，或 mug/plate/basketLaundry | L1 三目标改为 mug/plate/basketLaundry |
| X5 | `refrigerator`       | ❌ **NOT FOUND** | furniture-kit / food-kit 都无冰箱 stem。DiningKitchen 不需要冰箱（现有 L1 是洗杯/放杯/分类） | 标注 REFRIGERATOR_NOT_PACKED，不从白名单外引用 |
| X6 | `counter`            | ❌ **NOT FOUND** | 厨房"台面"无单独 stem。使用 **cabinetLow (矮柜)** 作为台面基础实体，再在顶部放置 `table` 或 `counter` 声明为 INFERRED_SURFACE | `cabinetLow` + "顶部可放置区"语义 |
| X7 | `window-square-a`    | ❌ **NOT FOUND** | 正确 stem 是 **`wall-window-square`** (building-kit)。"a" 后缀只用于 door-rotate-square-a，不用于 window | `wall-window-square` |
| X8 | `tissuePack`         | ❌ **NOT FOUND** | 无此 stem。纸巾盒类 prop 当前 pack 不存在；装饰列表剔除 | 删除；若需要小装饰用 `mug` / `book*` / `shoe*` 代替 |
| X9 | `lampFloor`          | ❌ **NOT FOUND** | 落地灯 stem 不存在。furniture-kit 中若需照明效果，保留未来 `lampTable` (白名单外) 标注为 LAMP_NOT_PACKED，或用 `sideTable + bookRed` 组合装饰 | 删除；或 LAMP_NOT_PACKED |
| X10 | `rugLarge`          | ❌ **NOT FOUND** | 大地毯 stem 不存在。Living / Bedroom 地毯效果当前 pack 不提供；移除所有 `rugLarge · 2.8×2.0 m` 占位 | 删除；或写 RUG_NOT_PACKED |

---

## §3. 白名单文件存在性 + SHA 二次校验（核心 14 stem）

> 从 `/Users/azq/asandstar/homemem-arena-asset-audit-2026-08-03/unpacked/` 实际读取：

| # | Stem | OBJ 路径 | OBJ SHA-256 (与 INVENTORY 匹配?) | GLB 路径 | GLB SHA-256 |
|---|------|----------|:--------------------------------:|----------|-------------|
| 1 | `loungeSofa` | `furniture-kit/Models/OBJ format/loungeSofa.obj` | ✅ | `furniture-kit/Models/GLTF format/loungeSofa.glb` | ✅ 已记录 §四 |
| 2 | `tableCoffee` | ... 同上 | ✅ | ... | ✅ |
| 3 | `televisionModern` | ... | ✅ | ... | ✅ |
| 4 | `cabinetTelevision` | ... | ✅ | ... | ✅ |
| 5 | `bookcaseOpen` | ... | ✅ | ... | ✅ |
| 6 | `table` | ... | ✅ | ... | ✅ |
| 7 | `chair` | ... | ✅ | ... | ✅ |
| 8 | `sideTable` | ... | ✅ | ... | ✅ |
| 9 | `bookcaseClosedDoors` | ... | ✅ | ... | ✅ |
| 10 | `washer` | ... | ✅ | ... | ✅ §四有完整 SHA |
| 11 | `dryer` | ... | ✅ | ... | ✅ §四有完整 SHA |
| 12 | `washerDryerStacked` | ... | ✅ | ... | ✅ §四有完整 SHA |
| 13 | `bedDouble` | ... | ✅ | ... | ✅ §四有完整 SHA |
| 14 | `mug` | `food-kit/Models/OBJ format/mug.obj` | ✅ | `food-kit/Models/GLB format/mug.glb` | ✅ |
| 15 | `wall-window-square` | `building-kit/Models/OBJ format/wall-window-square.obj` | ✅ | `building-kit/Models/GLB format/wall-window-square.glb` | ✅ |
| 16 | `door-rotate-square-a` | `building-kit/Models/OBJ format/door-rotate-square-a.obj` | ✅ | `building-kit/Models/GLB format/door-rotate-square-a.glb` | ✅ |

### 未下载白名单 stem（存在于 INVENTORY 但 unpacked 不存在或审计目录缺失）

| stem | INVENTORY 列了? | unpacked 下有 .obj/.glb? | 处理 |
|------|:--------------:|:------------------------:|------|
| `wardrobe` | ✅ (若白名单包含) | ❓ 审计脚本未发现 unpacked 文件 → **INVALID_STEM until unpacked verified** | INVALID_STEM; 暂用 `bookcaseClosedDoors` 替代 |
| `rugLarge`  | ❌ 未列入白名单 | ❌ 不存在 | INVALID_STEM; 删除占位 |
| `refrigerator` | ❌ 未列入白名单 | ❌ 不存在 | INVALID_STEM; 标记 REFRIGERATOR_NOT_PACKED |
| `dishwasher` | ❌ 未列入白名单 | ❌ 不存在 | INVALID_STEM; 改用 mug/plate/basketLaundry 三目标 |

---

## §4. 近期新文档 stem 引用审查 (§三 Scope)

逐文档扫描：

| 文档路径 | 引用的 stem / 模型名 | 在白名单? | 问题 | 处置 |
|----------|----------------------|:---------:|------|------|
| A1_5_COMPACT_HUB_NUMERICAL_BLUEPRINT §4 (Furniture Envelope) | `nightstand`, `wardrobe`, `Counter`, `dishwasher` / `trash bin` / `cutlery rack` | ⚠️ 4 项 INVALID + 3 项无 stem | nightstand → tableBedside; wardrobe → bookcaseClosedDoors; Counter → cabinetLow; dishwasher/trash/cutlery → mug/plate/basketLaundry | 替换 X2/X3/X4/X6；保留 `WARDROBE_NOT_PACKED` 注释 |
| PRE_LAYOUT_CONTRACT doc (§九 / §十 / §十六) | `loveseatSofa`, `wardrobe`, `dishwasher`, `counter`, `rugLarge`, `tissuePack`, `lampFloor`, `refrigerator`, `window-square-a` | ❌ 9 项 INVALID | 全部在 §2 X1–X10 黑名单 | 按 §2 Replace 列替换；对缺失的 fridge/rug/lamp 使用 *_NOT_PACKED 标记而非虚构 stem |
| 其他 layout candidate doc | `washer`, `dryer`, `washerDryerStacked`, `bedDouble` | ✅ 全在白名单 | - | 保留，但尺寸须以 §四 REMEASUREMENT 为准 |

### INVALID 计数 & PASS 标准

- 预期 INVALID 命中 = X1–X10 中近期文档实际使用的数量 → 若 ≥1 则这些引用 **不得** 保留为 CONFIRMED / 具尺寸
- **审计结论（必须）**: 任何不在本文件 §1 "Valid Stem" 列表中的模型名，不得在任何 Gate 文档中使用真实尺寸或 CONFIRMED 声明。

---

## §5. 白名单校验 JSON（机器可读）

```jsonc
{
  "whitelistSource": "docs/assets/ASSET_ACTUAL_CONTENT_INVENTORY.md",
  "auditDate": "2026-08-03",
  "validStems": [
    "loungeSofa","tableCoffee","televisionModern","cabinetTelevision","bookcaseOpen",
    "table","chair","sideTable","bookcaseClosedDoors","washer","dryer","washerDryerStacked",
    "bedSingle","bedDouble","desk","officeChair","diningTable","bench","cabinetLow","cabinetTall",
    "tableBedside","wall","wall-window-square","door-rotate-square-a","stairs","mug","plate",
    "bookRed","bookBlue","bookGreen","shoeBrown","shoeBlack","clothesShirt","clothesPants",
    "clothBathTowel","basketLaundry","phoneModern","key"
  ],
  "invalidBlacklisted": [
    "loveseatSofa","nightstand","wardrobe","dishwasher","refrigerator","counter",
    "window-square-a","tissuePack","lampFloor","rugLarge"
  ],
  "notPackedPlaceholders": [
    "WARDROBE_NOT_PACKED","REFRIGERATOR_NOT_PACKED","RUG_NOT_PACKED","LAMP_NOT_PACKED"
  ],
  "passesAudit": null
  // passesAudit=true 当且仅当：所有近期设计文档的 stem ∩ invalidBlacklisted = {}
  // 当前人工审阅显示仍有 INVALID → 见上 §4 → passesAudit = false (等待人工在文档中替换后再翻 true)
}
```

---

End of ASSET_STEM_WHITELIST_AUDIT.
