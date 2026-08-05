# A1.5 L2 CARRY_ONE GOLDEN PATH FLOW-A2 (出门大作战确定流程)

> Doc ID: A1_5_L2_CARRY_ONE_GOLDEN_PATH
> Current Gate Before: L2_CARRY_FLOW_REPAIR_REQUIRED → After = LAYOUT_CANDIDATE_HUMAN_APPROVAL_REQUIRED (§十)
> Frozen Layout: HOUSE-LAYOUT-1 · Gameplay Priority (retained, not modified)
> CARRY_CAPACITY: **CARRY_ONE · strict single-hold** (entitySlice.ts L12+L32 FACT)
> Method: Source-verified 29 steps; F/E per-source-code; distances DESIGN_ESTIMATE.

---

## §0. FROZEN CONTRACT (不得修改)

```
CONTROL:
  E = save memory / update memory
  F = interact (pick / place / open-drawer / close-drawer / toggle container)
CAPACITY:
  CARRY_ONE only (heldEntityId: string | null; pick fails if held != null)
CONTAINERS (src leave-home.ts containers):
  cnt-nightstand    (Bedroom)  = drawer, initialOpen=false, acceptAny, holds obj-phone
  cnt-umbrella-stand (Entrance)= surface, initialOpen=true, holds obj-umbrella (free)
  cnt-entrance-tray (Entrance)= TARGET ZONE, acceptedCategories: ['key','phone','umbrella']
  cnt-coffee-table  (Living)  = acceptAny surface → ALTERNATIVE_RECOVERY (not golden)
CAT TRIGGER:
  OR (keyFreshSaved & keyFree & leftLiving  ,  phoneObtained & keyFree)
KEY-LOC-A:
  KEY_LOCATION_RECOMMENDED_CANDIDATE (Living local -0.4, +2.0) — production frozen? NO
MINIMAP PLAYER CONTRACT:
  relocated KEY-LOC-A / KEY-LOC-B/C / cat final / 9 garments → HIDDEN from player minimap
```

---

## §1. GOLDEN PATH 29 STEPS (FLOW-A2 · PHONE-TO-TRAY-BEFORE-KEY 冻结)

| Step | Room | Action (冻结版 原文 §三) | F / E / Move | heldBefore | heldAfter |
|---:|---|---|:---:|:---:|:---:|
| 1 | Living | Spawn in Living (0, -1.5) | move | null | null |
| 2 | Living | 观察 coffee table 上有 key | move | null | null |
| 3 | Living | **E** 保存 key memory (旧位置) | **E** | null | null |
| 4 | Living | key 保持：room=living, status=free, 不 pick | nop | null | null |
| 5 | Living→Bedroom | 玩家离开 Living → Bedroom dw-living-bedroom 穿越 | move | null | null |
| 6 | Bedroom | Cat trigger Condition-A = keyFreshSaved & keyFree & leftLiving → TRUE | nop | null | null |
| 7 | Bedroom | Cat 异步 relocate key coffee → KEY-LOC-A recommended candidate | nop | null | null |
| 8 | Bedroom | key memory OUTDATED (同 tick markMemoryOutdated) | nop | null | null |
| 9 | Bedroom | **F** open right nightstand drawer (container toggle 抽屉从 closed→open) | **F** | null | null |
|10 | Bedroom | **F** pick phone from (now open) drawer | **F** | null | phone |
|11 | Bedroom→Living | 返回 Living (穿越 dw-living-bedroom, 玩家仍然 carry phone) | move | phone | phone |
|12 | Living | 路过 coffee-table，视线看到：旧 key 位置 = 空 (搜索张力) | move | phone | phone |
|13 | Living | 仍然持有 phone → **CARRY_ONE 禁止 pick key** (entitySlice.ts L32 fails: 手里已经拿着东西了) → 玩家必须先 place phone | nop (guard) | phone | phone |
|14 | Living→Entrance | 继续前往 Entrance (穿越 dw-living-entrance, 仍然 carry phone) | move | phone | phone |
|15 | Entrance | **F** place phone → onto cnt-entrance-tray (target zone; category=phone accepted) | **F** | phone | null |
|16 | Entrance | heldEntityId = null (placeEntity L177 set(null) FACT) | nop | null | null |
|17 | Entrance→Living | 返回 Living 重新搜索 relocated key | move | null | null |
|18 | Living | 跟随 3~4 个 paw-print decals 检查 sofa underside KEY-LOC-A | move | null | null |
|19 | Living | 找到 relocated key (sofa 坐垫下) | move | null | null |
|20 | Living | **E** update key memory (markMemoryUpdateCounter +1; fresh=true) | **E** | null | null |
|21 | Living | **F** pick key (memory now fresh; stage guard allows now) | **F** | null | key |
|22 | Living→Entrance | 持 key → Entrance (carry key) | move | key | key |
|23 | Entrance | **F** place key → onto cnt-entrance-tray (category=key accepted) | **F** | key | null |
|24 | Entrance | heldEntityId = null | nop | null | null |
|25 | Entrance | **F** pick umbrella (from cnt-umbrella-stand, initialOpen=true, no container open req) | **F** | null | umbrella |
|26 | Entrance | **F** place umbrella → onto cnt-entrance-tray (category=umbrella accepted) | **F** | umbrella | null |
|27 | Entrance | 三物体 contained in tray: [phone ✅, key ✅, umbrella ✅] | nop | null | null |
|28 | Entrance | 前往 front-door completion zone (dw-entrance-front 内侧附近) | move | null | null |
|29 | Entrance | L2 complete (checkLevelCompletion fires → completionText) | nop | null | null |

### 明确禁止 (Golden Path 不得):
- ❌ 拿着 phone 时直接 pick key (Step 13 guard = CARRY_ONE violation FAIL)
- ❌ 丢 phone 在地上临时换手 (不雅, 未写入 container 状态机)
- ❌ Coffee table 临时换手 (§三允许作为 ALTERNATIVE_RECOVERY_FLOW, 但不得作为 Golden)

### ALTERNATIVE_RECOVERY_FLOW (coffee-table 临时换手, 非 Golden):
> 玩家如果错误路线: pick key (before phone placed) 手里已有 phone → FAIL (CARRY_ONE). 恢复:
> Step 14 alternative: Living dw→Entrance too long → use coffee-table (acceptAny=true surface)
> Step 14 alt: **F** place phone onto coffee table (acceptAny ✅) → held=null → pick key (F) → F place key tray → return pick phone → place phone tray. 恢复合法但路径较长. = DESIGN_RECOVERY.
> 不写入 Golden Path 推荐 (违反 §三 "最小步骤 + 叙事张力").

---

## §2. F / E 精确计数 (§五 源码核定)

### F_INTERACTION_COUNT_REQUIRED (Golden path only, no recovery)

| Step | Source FACT | F count |
|---|---|---:|
| Step 9 open drawer (closed→open) | commands.ts executeContainerInteraction → executeToggleContainer (wasOpen=false → action='open') L179 FACT | **1 F** |
| Step 10 pick phone | commands.ts executePick L73 → entitySlice.pickEntity L30 FACT | 1 F |
| Step 15 place phone on tray | executePlace L138 → placeEntity L89 FACT | 1 F |
| Step 21 pick key | (memory fresh now, stage allows) executePick | 1 F |
| Step 23 place key | placeEntity | 1 F |
| Step 25 pick umbrella | cnt-umbrella-stand initialOpen=true (no open F needed, 直接 executePick L73 FACT) | 1 F |
| Step 26 place umbrella | placeEntity | 1 F |
| Front door | 无 container open/close (任务完成条件仅 tray 3 obj + catEvent fired → checkLevelCompletion auto → 无 F action on door) | 0 F |
| **Total F_REQUIRED** | Golden path (§七 Python script: F_REQUIRED = 7) | **7 F** |

### F_INTERACTION_COUNT_WITH_OPTIONAL (含恢复/重复)
```
F_REQUIRED                                  = 7
+ optional close drawer (after pick phone)  = +1 F (toggle close)
+ alternative coffee-table place/pick phone = +2 F (place then recover pick)
+ player re-checks drawer (close→open again)= +1 F
+ 1 optional wrong place → retry place     = +2 F (error case)
```
→ **F_INTERACTION_COUNT_WITH_OPTIONAL = 11 ± 3** (脚本写 7+4=11, 合理范围)

### E_SAVE_COUNT
```
E_REQUIRED (hard threshold, §五):
  Step 3:   E save key memory (old position)     → 1 E
  Step 20:  E update relocated key memory        → 1 E
  Total:   **E_SAVE_COUNT_REQUIRED = 2**

E_RECOMMENDED (教学/容错, 不称为门槛):
  + 额外 save 1 次 (player 顺手 E save phone drawer 位置)
  Total:   **E_SAVE_COUNT_RECOMMENDED = 3**
```

对比上一轮错误值 F=12 (含备用动作), E 没明确拆分. 现在精确:
```yaml
F_INTERACTION_COUNT_REQUIRED:   7  (Golden Path)
F_INTERACTION_COUNT_WITH_OPTIONAL:  11 (7 + drawer close + coffee recover 2 + open drawer again)
E_SAVE_COUNT_REQUIRED:   2  (hard minimum)
E_SAVE_COUNT_RECOMMENDED: 3  (soft extra save once)
```

---

## §3. 路线距离重算 (§六 DESIGN_ESTIMATE, 脚本输出 /tmp/a15_layout_mv/l2_carry_summary.json)

方法: 9 segments, 房间之间用 doorway 中点穿越, Euclidean dist (精确). 所有数字 DESIGN_ESTIMATE 标签. 不称为实际 playtime.

| 9 segments (§六编号 1~9) | Route | via doorway | Distance (m) |
|---|---|---|---:|
| 1 | Spawn(0,-1.5) → old key coffee (0,0.8) | Living straight | 2.30 |
| 2 | old key → Bedroom drawer | through dw-living-bedroom (-3.25, 0.0) | 5.53 |
| 3 | drawer → Living old-key (sightline back) | through dw-living-bedroom | 5.53 |
| 4 | Living old-key → Entrance tray | through dw-living-entrance (+3.25,-2.0) | 6.19 |
| 5 | tray → KEY-LOC-A (sofa underside) | through dw-living-entrance | 7.32 |
| 6 | KEY-LOC-A → tray (bring key back) | through dw-living-entrance | 7.32 |
| 7 | tray → umbrella stand (同房间) | Entrance straight | 1.23 |
| 8 | umbrella stand → tray | Entrance straight | 1.23 |
| 9 | tray → front-door completion zone | Entrance straight | 1.21 |

### 5 NAMED DISTANCES (§六要求):

```yaml
# 脚本计算精确值 (round 2 位小数):
AHA_PRE_DISTANCE          = 7.83  m   # = seg1 + seg2 (Aha 观察 key → 去卧室拿 phone 阶段)
PHONE_TO_TRAY_DISTANCE    = 11.72 m   # = seg3 + seg4 (拿 phone → 放回 entrance tray)
KEY_RECOVERY_DISTANCE     = 14.64 m   # = seg5 + seg6 (回 Living 找 key → 拿 key 放 tray)
FINAL_EXIT_DISTANCE       =  3.66 m   # = seg7+8+9 (取伞 → 放伞 → 前 door)
FULL_GOLDEN_PATH_DISTANCE = 37.84 m   # 9 seg 总和
```

标签: **DESIGN_ESTIMATE** (脚本 Euclidean doorway-midpoint path, 不含碰撞/回绕. 真实 play walk 大约 +2~4 m. 若玩家绕走 sofa 西侧则略远.)

### 路线连通性断言 (A9 自动通过):
所有 9 段 doorway graph:
- Living↔Bedroom 通过 dw-living-bedroom (adjacent) ✅
- Living↔Entrance 通过 dw-living-entrance (adjacent) ✅
- 无穿越外墙 / 未定义门 段 ✅
→ **Route fully connected (脚本 A9 PASS)**.

---

## §4. 与旧 FLOW-A 的关键区别 (修复 CARRY_ONE 冲突)

| 项 | 旧 FLOW-A (违反 CARRY_ONE) | 新 FLOW-A2 (冻结, 合法) |
|---|---|---|
| Ordering | pick phone → pick key DIRECTLY (Step 9 pick; Step 13 pick). 中间未 place phone. 严重: held=phone 时 pick → FAIL (entitySlice L32) | **Step 15 place phone → tray; Step 16 held=null; then Step 21 pick key**. 严格合法. |
| 叙事张力 | 跳过 "coffee 空 5 秒" 观察 | Step 12: 路过 coffee 空位置 → 张力保留 ✅ |
| Cat key fresh memory 顺序 | 顺序错乱 (pick key 时 held phone, 根本无法执行后续) | Step 3 E save → cat relocate → Step 12 sight empty → Step 20 E update → Step 21 pick ✅ 记忆教学循环完整 |
| held double 风险 | 100% fail on step 13 pick key | 0 double holds. Script §七 A1 PASS ✅ |
| F/E 计数 | F=12 含备用; E 未拆分 | F=7 / 11 optional; E=2 / 3 recommended ✅ |

→ 本轮唯一核心修复 = **强制 Step 15 place phone on tray 后, 才能 Step 21 pick key** (CARRY_ONE compatible).

---

End of L2 Golden Path FLOW-A2.
