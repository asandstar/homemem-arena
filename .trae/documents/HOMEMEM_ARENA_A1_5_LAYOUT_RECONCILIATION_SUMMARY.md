# HOMEMEM ARENA: A1.5 LAYOUT CONTRACT RECONCILIATION — SUMMARY (Trae Doc)

> Trae doc path: `.trae/documents/HOMEMEM_ARENA_A1_5_LAYOUT_RECONCILIATION_SUMMARY.md`
> Date: 2026-08-04
> Baseline: c5a2f83 HEAD == origin/main, 0 staged, 0 modified tracked
> Final Gate → **LAYOUT_CANDIDATE_HUMAN_APPROVAL_REQUIRED**

---

## 本轮工作完成 (§一~§十三)

- §一 前置状态 ✅ (main branch; HEAD == origin/main; clean)
- §二 读取 8 docs + 源码事实 (所有 只读)
- §三 E/F 控制键契约 **修复** (F=交互/pick/place/open E=save memory. L1 F=6/E=1~2; L2 F=12/E=2~3; L3 F=18/E=2~3)
- §四 权威 Doorway 快照 → AUTHORITATIVE_DOORWAY_SNAPSHOT.md (4 drifted + 1 matched)
- §五 L2-FLOW-A-RECONCILED 15 steps (先 save key memory, 不拿 key 去 bedroom → cat 触发 → 返回 发现空 → 找 key)
- §六 KEY-LOC-A → `KEY_LOCATION_RECOMMENDED_CANDIDATE` (非生产常量)
- §七 资产证据对账 13 CONFIRMED + 7 APPROX + 3 PROXY + 12 PLACEHOLDER + 0 invalid (basketLaundry 新发现 miss → 加入 placeholder)
- §八 仓库外 Python 脚本机器验证 `/tmp/a15_layout_mv/run_validation.py` → 12/12 assertions 通过. 3 furniture 微调 (Entrance shoes/coat + Laundry G4)
- §九 Minimap DEBUG vs PLAYER 双模式 contract. Player deny-list 包含 KEY-LOC / 9 衣物 / cat final → **不泄露 relocated key**. Gate = MINIMAP_LAYOUT_MACHINE_PASS
- §十 所有 主观评分 9.18/9.5/ "无需人类选" → 一律加 DESIGN_TEAM_HEURISTIC 标签 + 从 Gate 证据移除
- §十一 Blocker register 修正:
  - L2-01 严重度下调 (不阻止所有路径, 仅毁教学顺序)
  - L2-02 改名 → KEY_COORDINATE_RECOMMENDED_NOT_FROZEN
  - ASSET-01 删除 "invalid=0 + 旧文档 invalid 自相矛盾"
- §十二 **7 份新 reconciled docs** 全部 untracked 输出 (无覆盖旧)
- §十三 Final Gate = **LAYOUT_CANDIDATE_HUMAN_APPROVAL_REQUIRED** (取消上一轮 错误 GO_TO_IMPLEMENTATION_WITH_BLOCKERS; 符合 §零本轮 Gate 回滚要求)

---

## 7 New docs (untracked)

```
docs/design/
  A1_5_LAYOUT_CONTRACT_RECONCILIATION_REPORT.md   (主报告 18 drifts)
  A1_5_AUTHORITATIVE_DOORWAY_SNAPSHOT.md          (4 drifted fixed, doorwayId only 引用)
  A1_5_LAYOUT_MACHINE_VALIDATION.md               (12 assertions + 3 微调数值)
  A1_5_MINIMAP_DEBUG_PLAYER_CONTRACT.md           (DEBUG/PLAYER 分离, Gate = MACHINE_PASS)
  A1_5_RECONCILED_INTEGRATED_LAYOUT.md            (Heuristic 降级 + Blocker 修正 终稿)
docs/assets/
  A1_5_ASSET_EVIDENCE_RECONCILIATION.md           (13+7+3+12+0 counts, 20 SHA, basketLaundry 新 miss)
.trae/documents/
  HOMEMEM_ARENA_A1_5_LAYOUT_RECONCILIATION_SUMMARY.md (本文件)
```

Total 7 docs (§十二 要求 7 项 ✅). 全部 untracked. 无覆盖任何旧文档 ✅

---

## 最终 Gate (§十三 CHECKLIST 10 conditions)

```
[x] E/F 契约修正 (L1/L2/L3 全部正确 F=交互 E=save)
[x] Doorway Registry 无漂移 (4 DRIFTs fixed; docs only reference doorwayId)
[x] L2 流程逻辑成立 (FLOW-A-RECONCILED 15 steps 张力 保留)
[x] KEY-LOC-A 仍为推荐候选 (非生产常量)
[x] 资产证据 无虚假 VA (降级 7 个 APPROX + basket 改 PLACEHOLDER)
[x] 机器布局验证全部通过 (12/12 assertions + 3 微调)
[x] Player minimap 不泄露新 key (deny-list 包含 KEY-LOC)
[x] 主观评分 not used as Gate. DESIGN_TEAM_HEURISTIC only.
[x] Blocker 文案 & 状态 与源码影响一致 (5 blockers reconciled)
[x] 0 code changes (git status tracked=0)
```

Final Gate = **LAYOUT_CANDIDATE_HUMAN_APPROVAL_REQUIRED** ✅

(Next: 人类批准 HOUSE-LAYOUT-1 本轮 reconciled 数值后 → 启动 WP0 资产导入 + 5 Blockers 修复)
