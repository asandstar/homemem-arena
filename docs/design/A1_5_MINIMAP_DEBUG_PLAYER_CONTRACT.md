# A1.5 MINIMAP DEBUG vs PLAYER CONTRACT (小地图双模式契约)

> Doc ID: A1_5_MINIMAP_DEBUG_PLAYER_CONTRACT
> Gate name: **MINIMAP_LAYOUT_MACHINE_PASS** (§九 要求. 不得用 MINIMAP_IMPLEMENTATION_PASS)
> Machine validation: A10 / A11 / A12 全部通过 12/12

---

## §1. 双模式 明确分离

```yaml
DEBUG_LAYOUT_OVERLAY_v1:
  Goal:         设计调试 / 规划对账 / 本文件 SVG 输出
  Who sees:     Design team + level architects only (EDITOR ONLY, NEVER 玩家)
  Data source:  machine validation script JSON (所有 entities 全量)
  ALLOWED visibility:
    ✅ 所有 48 entities (big + small + zone markers) 足迹 footprints
    ✅ KEY-OLD marker (coffee 旧位, red circle)
    ✅ KEY-LOC-A / KEY-LOC-B / KEY-LOC-C (orange circle candidates)
    ✅ Overlap / collision debug highlight fill color (red for violation)
    ✅ Doorway clearance 标注 (绿 距离 > 0.12m / 红 < 0.12m)
    ✅ BLOCKER-WALL-01 shared-wall double-draw 红色虚线
    ✅ L1 CARRY_ONE route polyline (red dashed line, cup→tissue→fork)
    ✅ L2 cat paw-print 引导 4 steps marker
    ✅ L3 9 garments (small dots, 可视化分布)
    ✅ ZONE markers (front-swing / machine-op / wardrobe-open / chair-pull)
  FORMAT:       SVG + in-editor gizmos
  Render target: docs / planning / debug UI (NOT ship player)

--------------------------------------------------------------------------------

PLAYER_MINIMAP_v1:
  Goal:         玩家 runtime 导航 (不泄露 search 秘密)
  Who sees:     玩家 (在 HUD / pause screen)
  Data source:  entitySlice.minimapLayer = PLAYER filtered set  (必须严格剔除 deny-list)
  Gate status:  MINIMAP_LAYOUT_MACHINE_PASS

  ALLOWED Items:
    ✅ active rooms fill (淡色):
       L1 → only DiningKitchen
       L2 → Living + Bedroom + Entrance
       L3 → only Laundry
    ✅ player icon (arrow: position + rotation)
    ✅ 5 doorway gaps (white dashed lines).  Exterior front = 黄色方块 in Entrance
    ✅ LARGE furniture (minimapEligible=true AND footprint > 0.50m × 0.50m):
       • sofa, coffee, tv+cab, bookshelf, armchair
       • bed, wardrobe (proxy), desk, shoes-cabinet
       • dining-table, cnt-dw, cnt-trash, cnt-utensil, coat+mirror
       • washer, dryer, 3 baskets (white/dark/towel out), shelf, shoes-cabinet entrance
    ✅ task containers (cnt-*): tray (red C), cnt-dishwasher, cnt-trash, cnt-utensil, baskets
    ✅ stale old-memory marker: L2 返回 Living 时 coffee 上旧 key 位置画 一个 faded "!" 图标. 仅首次显示 10 秒; 然后隐藏
    ✅ spawn markers per level (small dot in player minimap only when first 5 seconds of level)

  FORBIDDEN / DENYLIST (MUST never appear in player minimap — §十三 checklist A12 依赖此):
    ❌ relocated KEY-LOC-A / KEY-LOC-B / KEY-LOC-C candidate markers / circles / info
    ❌ Cat final position / cat spawn / cat paw-print decals / cat icon
    ❌ 9 L3 individual garments dots / positions (player 必须物理搜索; minimap 只画 baskets NOT clothes)
    ❌ Phone content inside drawer (drawer 外部柜体 OK; phone inside hidden)
    ❌ KEY object instance 在 relocation 后位置 hidden even if held? (held OK on player icon carrier 小 tag; on ground hidden until LOS)
    ❌ Debug overlap / clearance / blocker markers → ALL HIDDEN
    ❌ zone swing / operation rectangles → ALL HIDDEN
    ❌ L1 route teaching arrows → hidden (玩家自己走, minimap 不提供导航)
```

---

## §2. Filter 示例 (伪代码)

```ts
// Runtime 时过滤 entities → minimap only 显示 allow
function playerMinimapFilter(entity, activeRoomIds) {
  if (!activeRoomIds.includes(entity.roomId)) return null; // room inactiv
  if (entity.id.startsWith('KEY-LOC-')) return null;        // relocated candidates
  if (entity.role === 'garment') return null;             // 9 件衣服不泄露
  if (entity.role === 'cat' || entity.tags?.has('cat')) return null;
  if (entity.role?.startsWith('ZONE-')) return null;      // 操作区隐藏
  if (entity.flags?.has('debug')) return null;
  if (entity.id === 'OBJ-PHONE' && !entity.state?.taken) return null; // inside drawer hidden
  // allow large furniture / containers / doors
  if (entity.minimapEligible && (entity.env.x > 0.5 && entity.env.z > 0.5) || entity.container) return entity;
  return null;
}
```

---

## §3. Minimap Gate 声明

```yaml
FINAL_MINIMAP_GATE_STATUS:  MINIMAP_LAYOUT_MACHINE_PASS
  A10 viewBox 全部元素 within bounds:            ✅ PASS
  A11 debug/player schemas separated:             ✅ PASS (本文档)
  A12 player minimap NOT contain relocated key:   ✅ PASS (denylist 明确 含 KEY-LOC)
Note:  NOT MINIMAP_IMPLEMENTATION_PASS (只通过了布局契约, 未到 真实渲染实现)
```

End of minimap contract.
