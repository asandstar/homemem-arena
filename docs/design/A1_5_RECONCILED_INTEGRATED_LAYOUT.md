# A1.5 RECONCILED INTEGRATED LAYOUT (综合布局修正版)

> Doc ID: A1_5_RECONCILED_INTEGRATED_LAYOUT_v1
> Final status of HOUSE-LAYOUT-1 (§十 要求): **LAYOUT_CANDIDATE_HUMAN_APPROVAL_REQUIRED**
> Blocker register §十一 RECONCILED (修正文案).
> Note: 本文档为 规划文档; 不得作为生产实现常数写入代码.

---

## §0. 仍然保留推荐组合

```yaml
A1_5_LAYOUT_RECOMMENDED: HOUSE-LAYOUT-1__Gameplay-Priority (retained)
But now with status:  LAYOUT_CANDIDATE_HUMAN_APPROVAL_REQUIRED (NOT → implementation candidate directly)
Need human sign-off before layout → production code work begins.
```

---

## §1. 主观评分 Heuristic 标签 (§十)

所有分数 一律 标注 `DESIGN_TEAM_HEURISTIC`. **不得用作 Gate 证据** (§十 已降级):

```yaml
H1_HOUSE_LAYOUTS:
  HOUSE-LAYOUT-1 Gameplay Priority:      score_subjective = 9.18/10  → TAG: DESIGN_TEAM_HEURISTIC (display only, not gate)
  HOUSE-LAYOUT-2 Domestic Realism:       score_subjective = 8.80/10  → TAG: DESIGN_TEAM_HEURISTIC
  HOUSE-LAYOUT-3 Cinematic Nostalgic:    score_subjective = 8.40/10  → TAG: DESIGN_TEAM_HEURISTIC
  "显著高于" 声明:                        REMOVED from gate evidence (保留为设计讨论文字)
  "无需人类选择" 声明:                    REMOVED entirely → 替换为: §十三 Gate = REQUIRED_HUMAN_APPROVAL

Individual room scores:
  DK-A Compact Triangle L1:              9.5/10 DESIGN_TEAM_HEURISTIC
  Lau-A Side-by-side L3:                 9.4/10 DESIGN_TEAM_HEURISTIC
  Living-A Sofa Focus:                   9.2/10 DESIGN_TEAM_HEURISTIC
```

---

## §2. Blocker Register Reconciled (§十一 修正)

最终修正版 blocker 5 项 (文案/状态与源码实际影响一致):

| ID | Short Title | Severity | 修正文案 (本轮) | Status |
|---|---|---|---|---|
| BLOCKER-L2-01 | FLOW-A stage guard mismatch (commands.ts vs task stage names) | **P0 CRITICAL** | ✅ **新文案 (vs 旧夸大):** `stage guard mismatch 不会阻止所有 cat 触发路径 (OR 双条件中 phoneObtained 仍可触发其它 cat relocate). 但会破坏预期 FLOW-A 教学顺序 (玩家会提前拿起 key, 跳过观察 coffee 记忆保存 → 丢失 5 秒 空位置 张力). L2 核心体验受损, 首个 L2 WP 必修` | ACTIVE — must be WP1 item #1 |
| BLOCKER-L2-02 | KEY_COORDINATE status (replaced OUT_OF_BOUNDS old) | **P1 HIGH** (非 P0 因为推荐位还在候选 未生产) | ✅ **重命名**: KEY_COORDINATE_RECOMMENDED_NOT_FROZEN.  (a) 当前源码 (-3.2,-3.2) 仍越界 (需要替换); (b) 推荐候选 (-0.4,+2.0) 仅在 Sofa GLB 真实碰撞 + 蹲下交互验证通过 后 才能 FROZEN. Production code 直到通过 实机测试 再写常量 | ACTIVE — rename + 保留 |
| BLOCKER-ASSET-01 | Stems / SHA / evidence levels 未 verify + 6 占位 CC0 未下载 | **P1 HIGH** | ✅ **删除自相矛盾句** ("invalid stem=0 且旧文档仍有 invalid") → 清晰陈述: `0 invalid stems (blacklist 全清理); 13 CONFIRMED /7 APPROX /3 PROXY /12 PLACEHOLDER (含 basketLaundry 本轮新 miss). 动作: 13 re-SHA 导入; 7 APPROX scale freeze; 12 PLACEHOLDER CC0 扫包下载` | ACTIVE — fix in WP0 import |
| BLOCKER-SCALE-01 | 冻结 Per-asset effective scale (禁止 全包统一 × 2) | P1 HIGH | 保持 NOT FROZEN. 需要在 WP0 与 BLOCKER-ASSET-01 一起 逐件 冻结 | ACTIVE — WP0 |
| BLOCKER-WALL-01 | LEGACY_SHARED_WALL_DOUBLE_DRAW | P2 MEDIUM | ✅ **保持** DEFERRED (不阻塞 layout 规划; production governance 再治理). 继续 红虚线 在 SVG 标注 提醒 | DEFERRED — not blocking 本轮和下一 layout plan |

→ 与 §十一 要求 1~5 全部一致 ✅

---

## §3. House-Layout-1 Reconciled (最终数值, 3 entity 微调后)

Only 列出 3 变化实体 (其余与上一轮 HOUSE-LAYOUT-1 相同, 全部 room-local, 脚本派生 world):

| Room | Entity | Role | local (lx, lz) 调整后 | 原 lz | 调整原因 |
|---|---|---|---|---|---|
| Entrance | LE-ENT-02 | shoes-cabinet | (-1.225, **-1.800**) | lz -1.200 | A3: dw-living-entrance clearance ≥ 0.12m → 从 +1.15m 到 北 → 南移 0.6m 不碰门 |
| Entrance | LE-ENT-05 | coat+mirror | (+1.150, **-2.100**) | lz -1.200 | A3: dw-entrance-front 净通 ≥ 0.12m → 南移 0.9m + 西微移 0.05m |
| Laundry | G4 | 衣物 dark T-shirt | (-0.800, **-0.200**) | lz -0.600 | A8: 不 overlap 机器前 0.9m operation zone | 北移 0.4m |

其余 45 entities unchanged. HOUSE-LAYOUT-1 Overall Gameplay semantics preserved (sofa focus; tray 优先; 三目标 DK triangle; side-by-side laundry).

---

## §4. E/F 契约 汇总 最终 (§三 reconciled)

| Level | F_INTERACTION_COUNT (交互) | E_SAVE_COUNT_MIN (任务门槛) | E_SAVE_COUNT_RECOMMENDED (教学建议) | 上一轮误写值 (参考) |
|---|---:|---:|---:|---|
| L1 (CARRY_ONE) | **6** (3 pick + 3 place) | 1 | 2 | E=6 / F=0 ❌ |
| L2 (FLOW-A 推荐) | **12** (含 open drawer, 拿起 3 obj + 放入 tray ×3 + open stand 等) | 2 (save old key memory + update new key memory) | 3 (额外 save 中途) | E/F 未拆分 ❌ |
| L3 (9×CARRY_ONE) | **18** (9 pick garment + 9 place 到 baskets) | 2 (save 1 + save 最终) | 3 (save 分类中间 1 次) | 未统计 ❌ |

---

End of Reconciled Integrated Layout. Next step: Human approves HOUSE-LAYOUT-1 in this reconciled form.
