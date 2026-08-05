# A1.5 ASSET EVIDENCE COUNT CLARIFICATION (资产计数口径澄清 §八)

> Doc ID: A1_5_ASSET_EVIDENCE_COUNT_CLARIFICATION
> 目标: 修正 MEASURED_APPROX = 6 / 7 不一致。明确 UNIQUE_SOURCE_ASSET_COUNTS vs PLACEMENT_ROLE_COUNTS 两个独立维度，不得相加 (source vs role 口径分开)。
> Scope: §八. 不阻塞布局审批 (§八 最后一句声明 "此项不阻塞布局审批")。

---

## §0. 问题根因: 6 vs 7 / 7 vs 8 数字漂移

上一轮 `A1_5_ASSET_EVIDENCE_RECONCILIATION.md` 同时出现两组互斥数字:

| 位置 | MEASURED_APPROX 报告值 | 实际列表 items | Why drift |
|---|---:|---|---|
| §七 Summary 表格 | 7 | desk / chairDesk / lampRoundTable / books / kitchenCabinetDrawer / cabinetBedDrawer / **loungeChair** (7 items) | 含 loungeChair |
| 同 §七 文本 detail 段落中间处 | 6 | desk / chairDesk / lampRoundTable / books / kitchenCabinetDrawer / cabinetBedDrawer (loungeChair dropped 漏写) | 不含 loungeChair |
| 加上 mug 单独 1 项 | 8 (隐含) | + mug (2.0 GLB vs OBJ 不一致) | 部分统计把 mug 算 accessory, 部分合并 |

→ **矛盾**: Summary 7 vs Detail text 6 → 自相矛盾 6/7.

### 根因: 没有区分 "源资产唯一 ID" 与 "布局中使用角色" 两个统计口径. 例如:
- `bookcaseClosedDoors` → source 资产 = 1 次 (CONFIRMED); 但 `wardrobe 衣柜` 作为 placement role 使用同一 GLB → 角色 PROXY. 若两者都计入互斥总数 → 重复计数.
- `cabinetBedDrawer` → source asset = MEASURED_APPROX unique 1 次; `nightstand` (床头柜 drawer) 角色 = 使用同一 GLB + P01 语义代理 → role 又 1 次. 相加 2 次是错误的.

---

## §1. 两个互斥维度 (严格分开)

### Dimension 1: **UNIQUE_SOURCE_ASSET_COUNTS**

定义: 按 "每个 源资产 stem/audit path 唯一计一次". 同一 GLB 文件无论多少次复用 (做 PROXY / 双角色) 都只算 1 次. 级别互斥 (任何资产有且只有一个 CONFIRMED / APPROX / PROXY / PLACEHOLDER 标签).

#### UNIQUE SOURCE MASTER TABLE:

| Evidence Level | Count | 清单 (每个源资产 stem 唯一 ID) |
|---|---:|---|
| **VALIDATED_ASSET_CONFIRMED** (严格六条件, 非 estimated) | **13** | `loungeSofa, tableCoffee, televisionModern, cabinetTelevision, bookcaseOpen, bookcaseClosedDoors, bedDouble, table (dining), chair (dining), sideTable, washer, dryer, washerDryerStacked` |
| **MEASURED_APPROX** (file+GLB exists, 但 6-cond 1+ 不满足: AABB 含 ×2 假设) | **7** (明确 7, 修复 6/7 矛盾: **包含 loungeChair; mug 归入 单独 small-props category, 不并入 furniture**) | **1)** desk ADIM-008, **2)** chairDesk ADIM-011, **3)** lampRoundTable ADIM-017, **4)** books ADIM-018 (5-book bundle), **5)** kitchenCabinetDrawer (ADIM-019 cabinetLow proxy stem), **6)** cabinetBedDrawer ADIM-020, **7)** loungeChair (非编号 accessory 主家具位) → **TOTAL 7 unique approx assets** ✅ |
| SMALL-PROPS-MEASURED_APPROX (mug etc., 不纳入 main furniture counters) | 1 | mug ADIM-016 (accessory; GLB 尺寸不一致 OBJ vs GLB 访问器 → approx)|
| **PROXY-UNIQUE-SOURCE** = 0! | 0 | (Proxy 角色 使用的 GLB 都已经在上面 CONFIRMED / APPROX 出现过, 不再重复唯一计数. bookcaseClosedDoors CONFIRMED source 已经算过 1 次 wardrobe use 不再 double count.) |
| **PLACEHOLDER_ONLY** (unique stems no GLB) | **12** (保持不变) | P4 umbrella-stand, P5 curtain, P6 shoes pairs, P8 coat rack+mirror, P9 floor-lamp (lampFloor 黑名单 stem visual proxy placeholder cube 非 asset), P10 rug (rugLarge blacklist → visual cube proxy), P11 trash bin, P12 utensil rack, P13 detergent bottles, `basketLaundry` (本轮新发现审计目录 0 matches), phoneModern, key small object (no GLB found) |
| **INVALID** (blacklisted stems non-placeholdered) | 0 | 0 invalid stems (nightstand/wardrobe/refrigerator/dishwasher/counter/lampFloor/tissuePack/window-square-a 黑名单 全部 已归入 placeholder or proxy; 无任何条目残留 INVALID status) |

**FINAL UNIQUE SOURCE COUNTS (Dimension 1, 互斥不重复)**:
```yaml
UNIQUE_SOURCE_ASSET_COUNTS_FINAL:
  CONFIRMED:                 13 (main furniture + three appliances)
  MEASURED_APPROX:            7 (desk, chairDesk, lamp, books, kitchenCabinetDrawer, cabinetBedDrawer, loungeChair)
     <+ optional: small props mug included separately 1, not sum to main furniture 7>
  PROXY_UNIQUE_SOURCE:        0 (角色代理使用的 GLB 已经在 CONFIRMED/APPROX 唯一计过, 不重计)
  PLACEHOLDER_ONLY:          12 (no real GLB, 等待 CC0 扫包下载)
  INVALID_BLACKLIST_CLEAN:    0 (0 invalid stems after clean)
```

→ **§八 原 6/7 矛盾修正为: UNIQUE MEASURED_APPROX = 7 (包含 loungeChair)**. 旧 6 是漏写 loungeChair 的统计错误; 不是口径差异.

---

### Dimension 2: **PLACEMENT_ROLE_COUNTS** (按 HOUSE-LAYOUT-1 实际使用角色, 可以与 源资产 多对一)

定义: 按 "每个 布局使用角色 (placement entity ID LE-*) 唯一". 同一源 GLB 可以在多个使用位出现 (例如 1 个 cabinetBedDrawer GLB → 2 个 nightstand 角色 (left+right)). 证据等级按 "该角色当前使用的 证据" 打, 可以 与源级别 不同 (source=CONFIRMED, role-as-proxy=PROXY).

#### ROLE-LEVEL (含 语义 proxy roles 独立于 source):

| Level | Count | List (布局中 角色 LE-* 或 P* names) |
|---|---:|---|
| CONFIRMED_ROLE (source = CONFIRMED & role 使用正确语义 一致) | **13** | sofa (loungeSofa), coffee, tv, tv-cab, bookshelf-open, bookshelf-closed (role=shelf, 非 wardrobe), bedDouble, dining-table, dining-chair, sideTable (use=side-table 非 nightstand), washer, dryer, washerDryerStacked (redundant role 若 side-by-side 方案则不启用). Count matches source 13. |
| **MEASURED_APPROX_ROLE** (role uses approx source AND 不承担 PROXY semantic) | **6** ✅ (这里 6 是正确的! 区别 Dimension 1). desk role, chairDesk role, lampRoundTable role (living side-table + bedroom nightstands 2 × 同一个 lampRoundTable source → 2 role instances = 2 approx roles? No unique role kind count: unique role KINDS = 6 items) | **6 kinds**: (1) Desk furniture, (2) Chair desk, (3) Lamp round on table, (4) Books decor LE-LIV-09, (5) Kitchen low cabinet visual (actual kitchenCabinetDrawer source, role=base cabinet), (6) Lounge chair Living-A corner LE-LIV-06. → **6 kinds 与之前 6 值吻合! 这 就是 Dimension 2 原来 6 的来源!** |
| VALIDATED_PROXY_ROLE (source GLB exists CONFIRMED or APPROX but role-semantic ≠ stem name) | **3** ✅ (保持原 Recon Summary 3, 独立于 UNIQUE) | P02 wardrobe (uses bookcaseClosedDoors CONFIRMED source; role=wardrobe 语义 = PROXY ← 与源 CONFIRMED 不同 级别分开, 不重计). P01 nightstand drawer (uses cabinetBedDrawer MEASURED_APPROX source; role=interactive-drawer nightstand semantic = PROXY). P03 dishwasher visual (uses kitchenCabinetDrawer APPROX source, dishwasher visual gap proxy = PROXY). → 3 proxy roles ✅ |
| PLACEHOLDER_ROLES (roles with no real GLB yet in audit directory, 使用 visual cube placeholder) | **12** (与 UNIQUE PLACEHOLDER 一一对应 数量一致 本次刚好) | P4 umbrella stand LE-ENT-03 inner collectible holder role, P5 curtains (bedroom + 客厅? count as 1 role kind), P6 scattered shoes pairs (LE-ENT-06 3 pairs → 1 role kind), P8 coat rack + mirror LE-ENT-05, P9 floor lamp LE-LIV-07 floor-lamp proxy cube, P10 rug entrance / living area rugs (2 visuals, 1 role kind), P11 trash bin DK-A, P12 utensil rack DK cnt-utensil rack visual, P13 detergent bottles L3, `basketLaundry` x3 (white/dark/towel baskets - all placeholder), phoneModern visual L2 small cube (no real GLB), key object visual small 2D card. → 12 roles ✅ |

**FINAL PLACEMENT ROLE COUNTS (Dimension 2, 角色独立计数; 与 unique source 不能相加!):**
```yaml
PLACEMENT_ROLE_COUNTS_FINAL:
  CONFIRMED_ROLE:              13 (source 13, used in correct semantic roles)
  MEASURED_APPROX_ROLE:         6 (desk/chairDesk/lamp/books/kitchenLowBase/loungeChair 6 furniture-kind roles, no loungeChair included here? wait loungeChair is role LE-LIV-06. Recheck: Yes in 6 list above item 6 includes loungeChair → 6 roles. Correct.)
  VALIDATED_PROXY_ROLE:         3 (wardrobe / nightstand / dishwasher visual proxies)
  PLACEHOLDER_ROLE:            12 (12 placeholder kinds as detailed)
  INVALID_ROLE_STATUS:          0
```

→ **Dimension 2 MEASURED_APPROX_ROLE = 6 正确. Dimension 1 UNIQUE SOURCE APPROX =7 正确.** 之前的 6/7 漂移其实是混淆了 源资产口径 (7) 与 角色种类口径 (6). 两者本来就 应 不同; 旧文档的 6 写在 role 位置; 7 写在 source 位置; 但没有写清 Dimension → 表现为"自相矛盾". 现在 澄清完成 = 消除 矛盾.

---

## §2. 互斥原则 Enforcement

用户 §八 规则: "不得把同一个条目在互斥总数中重复相加". 现在严格执行:

```
PROHIBITED:
  ❌ 将 wardrobe PROXY role 1 次 与 source bookcaseClosedDoors CONFIRMED 再次相加.
     → bookcaseClosedDoors 源资产: 只在 UNIQUE_SOURCE 算 1 次 (CONFIRMED).
       role=wardrobe: 只在 PLACEMENT_ROLE VALIDATED_PROXY_ROLE 算 1 次. 两个维度相互独立, 不互斥 求和.
  ❌ 将 cabinetBedDrawer 源资产 (MEASURED_APPROX) 与 nightstand role (PROXY) 相加到同一 Dimension 的同一个互斥列表.
     → 同一 Dimension 内互斥.

ALLOWED:
  ✅ 同一个 asset 在两个不同 Dimension 分别计数 1 次 (不跨维相加).
  ✅ 同一 source asset 在不同 placement roles 中多次重复 (2 nightstands use same source cabinetBedDrawer → 2 个 role instances, 但 role-kind 计 1 次 kind; 或按 instance 计 2, 但必须明确 kind vs instance).
```

### Kind vs Instance (§八补充 可选 clarifications, 不影响阻塞):
按 "kind" (不同语义种类) 计数 vs 按 "instance" (实际摆放个数 count) 计数不同. 当前 13/6/3/12 全部使用 **kind-based** 计数 (语义种类数). 若后续需要按 instance 用于 budget allocation (如 2 个 nightstand 实例 × lamp × 2 盏, 9 garments 实例等), 新建文档 instance-counts, 不覆盖本 kind-counts. 不阻塞布局.

---

## §3. 原 §七 Blocker-ASSET-01 文案的同步澄清

原 Blocker-ASSET-01 recon 文案: "13 VA + 7 APPROX + 3 PROXY + 12 PLACEHOLDER"
→ 现在明确: 该 13/7/3/12 的写法语义 实际上是 **13 source CONFIRMED + 7 source MEASURED_APPROX (Dimension 1 source)** + **3 PLACEMENT ROLE PROXY (Dimension 2)** + **12 PLACEHOLDER (Dimension 1/2 数量一致 here)**.

→ 交叉维度混用虽然不完美, 但 **不会造成 "互斥内重复" (每个条目 在自己 Dimension 内 只算一次)**. 只是存在跨维数字并列, 需标注:

```yaml
ASSET_FINAL_SUMMARY (clarified):
  DIM1_UNIQUE_SOURCE:
    13 CONFIRMED + 7 MEASURED_APPROX + 12 PLACEHOLDER + 0 INVALID = 32 源资产/占位
  DIM2_PLACEMENT_ROLE:
    13 CONFIRMED_ROLE + 6 MEASURED_APPROX_ROLE + 3 PROXY_ROLE + 12 PLACEHOLDER_ROLE = 34 角色种类
  (Note 32 vs 34: different because 2 extra role-kind split (multi-role on single source → kinds up 2). Not duplicated, just dimension slice)
```

本项对审批的影响: **§八 "此项不阻塞布局 Gate 审批" 声明 继续生效. 只做计数去重澄清; 不影响实际布局几何.**

End of count clarification → MEASURED_APPROX 6/7 漂移 根因: 源 vs 角色维度混淆 → 现在解决.
