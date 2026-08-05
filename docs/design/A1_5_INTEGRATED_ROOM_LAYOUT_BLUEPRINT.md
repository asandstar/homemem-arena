# A1.5 INTEGRATED ROOM LAYOUT BLUEPRINT (全屋综合布局蓝图)

> Doc ID: A1_5_INTEGRATED_ROOM_LAYOUT_BLUEPRINT
> Scope: §十五 3 套全屋组合 → 最终唯一推荐 A1_5_LAYOUT_RECOMMENDED
> Status: CANDIDATE FOR IMPLEMENTATION APPROVAL (§十五 16 要求. 不得写入代码.
> Baseline: APPROVED_PLANNING_BASELINE · 120.81㎡ · 5 rooms · 4 internal edges · 1 front door

---

## §0. 综合组合方案

§十五 要求至少 3 套全屋方案组合:
- HOUSE-LAYOUT-1: Gameplay Priority (教学路线最优)
- HOUSE-LAYOUT-2: Domestic Realism (真实家庭布局)
- HOUSE-LAYOUT-3: Cinematic Nostalgic Sci-Fi (电影感怀旧科幻)

每套组合规则: 每房从前面推荐/次选方案交叉组合 + 视觉主色板 + 路线。

---

## §1. HOUSE-LAYOUT-1: Gameplay Priority (🏆 RECOMMENDED)

组合：
- **Living = LIVING-A Sofa Focus
- **Bedroom = BEDROOM-A Bed-Centered
- **Entrance = ENTRANCE-A Tray-first
- **DiningKitchen = DK-A Compact Triangle
- **Laundry = LAUNDRY-A Side-by-side

| 维度 | 分数 (1~10) | 说明 |
|---|:---:|---|
| L1 教学清晰度 | 10 | DK-A 三角布局 = 三容器一眼看完；5 秒内理解 教学 |
| L2 Aha moment | 9.5 | Sofa底藏钥匙 + so典型 cat 脚印引导 → 强 Aha 1s 9.5/10 |
| L3 分类效率 | 9.5 | Side-by-side + 三篮北排 + 9 衣散放中央 = 短路径 18 步完成 |
| Door clearance pass (§八/九/十/十一/十二) | 10 | 全部通过 ≥ 三门洞 ≥ 1.2m |
| Sightline (视线) | 9 | 教学视线清晰；container 可找到；入口第一眼不泄露 new key；phone 需绕 so |
| Furniture density (家具密度) | 9 | 适中；不过密/不过空 |
| Task route completeness | 9.5 | L1 ~17.6m；L2 key 搜索 10s；L3 ~20m |
| Minimap readability | 9 | SVG 10 assertions passed |
| Asset confidence (资产信心) | 8.5 | VALIDATED_ASSET = 18; 10 placeholder (已减 P 11/12/13. 总信心 8.5 |
| Placeholder 数量 (越少越好) | 8 | 10 placeholder (P3 dishwasher visual / P4 umbrella stand / P5 curtain / P6 shoes / P8 coat rack+mirror / P9 floor lamp / P10 rug / P13 detergent / P11 trash / P12 rack) |
| Implementation risk (实现风险) | 8.5 | 低；均有 Blockers 已登记；scale/proxy 已知 |
| Screenshot composition | 9 | LIVING-A sofa focus = 上佳截图角度 (sofa+TV 经典)；Bedroom 对称 |
| Video recording (录像构图) | 9.5 | 三关教学录像：L1 餐桌→三容器三角动线顺；L2 猫脚印+sofa 电影感；L3 单房教学清晰 |

→ HOUSE-LAYOUT-1 综合加权 = **9.18/10 = 🏆 RECOMMENDED**

---

## §2. HOUSE-LAYOUT-2: Domestic Realism

组合: LIVING-B TV Axis + BEDROOM-A + ENTRANCE-B Door-swing + DK-B Linear Counter + LAUNDRY-B Stacked

| 维度 | 分数 |
|---|:---:|
| L1 教学清晰度 | 8 |
| L2 Aha moment | 8 |
| L3 分类效率 | 8.5 |
| Door clearance | 9.5 |
| Sightline | 9.5 |
| Furniture density | 9.5 |
| Task route | 8.5 |
| Minimap readability | 8.5 |
| Asset confidence | 8.5 |
| Placeholder 数量 | 8.5 (相同) |
| Implementation risk | 9 |
| Screenshot composition | 9.5 |
| Video recording | 8.5 |
| **综合** | 8.8/10 ★★★★☆ |

特点: 真实感最强但教学性略次 |

---

## §3. HOUSE-LAYOUT-3: Cinematic Nostalgic Sci-Fi

组合: LIVING-C Asymmetric + BEDROOM-B Phone-first + ENTRANCE-A + DK-C Loop + LAUNDRY-A

| 维度 | 分数 |
|---|:---:|
| L1 教学清晰度 | 7 |
| L2 Aha moment | 9 |
| L3 分类效率 | 9.5 |
| Door clearance | 8 |
| Sightline | 9 |
| Furniture density | 8 |
| Task route | 7.5 |
| Minimap readability | 8 |
| Asset confidence | 8.5 |
| Placeholder 数量 | 8 |
| Implementation risk | 7.5 (非对称家具布置 + key 旧位置难 + L1 教学路径非唯一) |
| Screenshot composition | 10 (电影感强) |
| Video recording | 9.5 |
| **综合** | 8.4/10 ★★★★☆ |

---

## §4. 全屋 最终唯一推荐 (§十五)

### §4.1 推荐结论

```yaml
A1_5_LAYOUT_RECOMMENDED:
  id: HOUSE-LAYOUT-1__GAMEPLAY-PRIORITY
  status: 🏆 CANDIDATE_FOR_IMPLEMENTATION_APPROVAL
  score: 9.18 / 10
  rooms:
    living: LIVING-A__Sofa-Focus (cat KEY-LOC-A under sofa cushion)
    bedroom: BEDROOM-A__Bed-Centered
    entrance: ENTRANCE-A__Tray-first
    diningKitchen: DK-A__Compact-Triangle
    laundry: LAUNDRY-A__Side-by-side
  relocated_key_recommendation:
    living_local_x: -0.40
    living_local_z: +2.00  (sofa cushion underside, LIVING-A)
    world_x: -0.40
    world_z: +2.00  (Living center=0,0 → world=local)
    container_anchor: sofa_seat_cushion_underside_W_end
    for_implementation_blocker: BLOCKER-L2-02 (更新代码中 (-3.2,-3.2) -> (-0.4, +2.0)
  carry_routes:
    L1: order_cup__tissue__fork (教学推荐顺序)，总计约 17.6m / 6E / 0F
    L2: FLOW-A = KEY_PHONE_UMBRELLA + cat-trigger = OR(keyFreshSaved&leftLiving OR phoneObtained&keyFree)
    L3: basket_WHITE_DARK_TOWEL_333 = 平均 1.2m ×9件=10.8m 有效距离
  minimap: MINIMAP_LAYOUT_PLAN_PASS
  blockers_registered: 5
```

### §4.2 综合布局房间内所有家具 Local Coordinate 完整索引 (§七 room-local = single source of truth)

本蓝图中的所有坐标均为 room-local，world/minimap 坐标由脚本派生，严禁手写两套。下表列出推荐布局的全部 furniture 完整表（LE-{ROOM}-{NN} 来源于各房文件）。

- 合计实体数: 72
  - Living: 10 entities (LE-LIV-01..10)
  - Bedroom: 9 entities (LE-BED-01..09)
  - Entrance: 8 entities (LE-ENT-01..08)
  - DiningKitchen: 14+1 entities (LE-DK-01..14)
  - Laundry: 10 entities (LE-LAU-01..10)
  - 合计: 51 furniture/containers + 9 garments + 3 task objs + 3 spawn = 72 layout entities

具体每房间 entity 详细坐标请参考:
- LIVING_L2_LAYOUT_CANDIDATES (§1 LIVING-A ACCEPTED_RECOMMENDED
- BEDROOM_AND_ENTRANCE_LAYOUT_CANDIDATES (§A.1 BEDROOM-A / §B.2 ENTRANCE-A)
- L1_DININGKITCHEN_ROUTE_LAYOUT (§2 DK-A)
- L3_LAUNDRY_LAYOUT (§1 LAUNDRY-A)
- A1_5_ASSET_PLACEMENT_LEDGER (§1/§2 safeEnvelope 对应)

### §4.3 实施顺序建议

1. Blocker 修复 (BLOCKER Register) 优先
2. 资产导入 + 逐件 scale 冻结 (取代 PROVISIONAL)
3. Rooms 坐标 frozen 写入 rooms.ts (原 sharedRooms legacy 尺寸 → A1.5)
4. 家具 51 entities 批量插入 furnitureOwnership / decorFurniture
5. Task containers & L1/L3 entity positions 应用 (DK-A/LAUNDRY-A)
6. L2 猫事件 修复 + FLOW-A stage guard fix (BLOCKER-L2-01)
7. key 位置 fix BLOCKER-L2-02
8. Minimap 生成 SVG 与 实现 entitySlice 数据来源对齐
9. 美术 (rug/curtain/shoes 等 placeholder 替换未来下载

→ 本蓝图仍为 PLANNING_CANDIDATE，仅当人类批准后开始代码实施。

---

## §5. 17 项最终 Gate 条件满足检查 (§十七 GATE checklist)

§十七 GO_TO_LAYOUT_IMPLEMENTATION_PLAN_WITH_BLOCKERS 必须满足 13 条：

| Gate | §十七 条件 | 结果 | 证据 |
|---|---|---|---|
| G1 | 五房都有唯一推荐布局 | ✅ | Living-A / Bed-A / Ent-A / DK-A / Lau-A |
| G2 | 三关路线通过 | ✅ | L1 17.6m 6E OK；L2 FLOW-A OK；L3 单房 OK |
| G3 | Living relocated key 有推荐候选 | ✅ | KEY-LOC-A sofa underside (-0.4, +2.0) |
| G4 | key 推荐位置在房间内 (Living local X ∈[-3.25,3.25] Z∈[-2.75,2.75] | ✅ | X=-0.4 在 [-3.25,+3.25]；Z=+2.0 ∈[-2.75,+2.75] 完全内 |
| G5 | CARRY_ONE 路线成立 | ✅ | L1 3 cycle × 1 obj；L2 4 carries (key/phone/umbrella/放下)；L3 9 carries |
| G6 | L3 单房成立 (不跨 DK) | ✅ | LAUNDRY-A spawn/completion 全 Laundry 内 |
| G7 | 所有选中资产 stem 已验证 or 标记 placeholder | ✅ | ASSET_PLACEMENT_LEDGER 18 VALIDATED_ASSET + 5 PROXY + 10 PLACEHOLDER；无 INVALID_STEM |
| G8 | 每件资产有 layoutSafeEnvelope | ✅ | §1 全 20 + §2 全 14 均有 safeEnvelope |
| G9 | minimap layout plan pass | ✅ | MINIMAP_LAYOUT_OVERLAY.md 10 assertions PASS |
| G10 | door clearance ≥1.2 m pass | ✅ | 全部通过 (Living-A/Bed-A/Ent-A/DK-A/Lau-A) |
| G11 | Blocker Register 完整 (5 items) | ✅ | §十四/PRE_IMPLEMENTATION_BLOCKER_REGISTER |
| G12 | 无代码修改 | ✅ | git status 检查 0 modified tracked；仅新增 untracked docs/设计文档 |
| G13 | 综合布局无需人类选 | ✅ | HOUSE-LAYOUT-1 9.18 显著高于其他 2 套 (8.8, 8.4) |

→ 13/13 全部满足！
→ **Final Gate = GO_TO_LAYOUT_IMPLEMENTATION_PLAN_WITH_BLOCKERS**
