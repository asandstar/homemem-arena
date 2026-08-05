# A1.5 L2 CARRY STATE MACHINE VALIDATION (手持状态机 + 10 assertions)

> Doc ID: A1_5_L2_CARRY_STATE_MACHINE_VALIDATION
> Script: `/tmp/a15_layout_mv/run_l2_carry_validation.py` (仓库外, §七 要求)
> JSON summary: `/tmp/a15_layout_mv/l2_carry_summary.json`
> Machine Output: **L2_CARRY_STATE_MACHINE_PASS**

---

## §1. heldEntityId Step Table (§四要求 12 列 × 29 steps)

列说明:
- **step**: 1-29 FLOW-A2
- **room**: 当前房间 (living/bedroom/entrance/crossing)
- **action**: action short
- **F/E/MOVE/NOP**: 动作类型
- **heldBefore**: 执行动作前持有的物体 config ID (string) or null
- **heldAfter**: 动作后持有 (CARRY_ONE, 必须 null 或 1 值)
- **key status**: free → relocated → held → in-tray
- **phone status**: hidden in drawer → open drawer → held → in tray
- **umb status**: stand → held → in tray
- **cat**: True 表示触发 (step 6+ 之后 True)
- **keyMemoryState**: NONE → FRESH (E save) → OUTDATED (cat relocate) → REFRESHED (E update)
- **validity**: PASS/FAIL

|stp|room|type|action|heldB|heldA|key status|phone status|umb status|cat?|keyMemory|valid|
|---:|---|:---:|---|:---:|:---:|---|---|---|:---:|---|:---:|
| 1| L |M|Spawn| - | - | free on coffee | hidden drawer closed | on stand | 0 | NONE | ✅ |
| 2| L |M|Observe coffee key| - | - | free on coffee | hidden drawer closed | on stand | 0 | NONE | ✅ |
| 3| L |E|E save old key mem| - | - | free on coffee | hidden drawer closed | on stand | 0 | **FRESH** | ✅ |
| 4| L |N|key stays free| - | - | free on coffee | hidden drawer closed | on stand | 0 | FRESH | ✅ |
| 5| L→B|M|Leave→Bedroom| - | - | free on coffee | hidden drawer closed | on stand | 0 | FRESH | ✅ |
| 6| B |N|Cat trigger A fires| - | - | free (still coffee) | hidden drawer closed | on stand | **1** | FRESH | ✅ |
| 7| B |N|Cat reloc → KEY-LOC-A| - | - | **relocated (KEY-LOC-A recom cand)** | hidden drawer closed | on stand | 1 | FRESH→OUTDATED | ✅ |
| 8| B |N|Memory OUTDATED tick| - | - | relocated | hidden drawer closed | on stand | 1 | **OUTDATED** | ✅ |
| 9| B |F|F open drawer| - | - | relocated | hidden → open drawer | on stand | 1 | OUTDATED | ✅ |
|10| B |F|F pick phone| - | **phone** | relocated | **held(phone)** | on stand | 1 | OUTDATED | ✅ |
|11| B→L|M|Return to Living|phone|phone| relocated | held(phone) | on stand | 1 | OUTDATED | ✅ |
|12| L |M|Sight coffee empty (tension)|phone|phone| relocated | held(phone) | on stand | 1 | OUTDATED | ✅ |
|13| L |N|GUARD: held=phone → CANNOT pick key|phone|phone| relocated (still sofa) | held(phone) | on stand | 1 | OUTDATED | ✅ |
|14| L→E|M|→Entrance carry phone|phone|phone| relocated | held(phone) | on stand | 1 | OUTDATED | ✅ |
|15| E |F|F place phone tray|**phone**| **-** | relocated | **in tray phone** | on stand | 1 | OUTDATED | ✅ |
|16| E |N|held=null place done| - | - | relocated | in tray phone | on stand | 1 | OUTDATED | ✅ |
|17| E→L|M|→Living search key| - | - | relocated | in tray phone | on stand | 1 | OUTDATED | ✅ |
|18| L |M|Follow paw prints→sofa| - | - | relocated | in tray phone | on stand | 1 | OUTDATED | ✅ |
|19| L |M|Found relocated key| - | - | relocated | in tray phone | on stand | 1 | OUTDATED | ✅ |
|20| L |E|E update memory| - | - | relocated | in tray phone | on stand | 1 | **REFRESHED** | ✅ |
|21| L |F|F pick key (fresh now)| - | **key** | **held(key)** | in tray phone | on stand | 1 | REFRESHED | ✅ |
|22| L→E|M|→Entrance carry key|key|key| held(key) | in tray phone | on stand | 1 | REFRESHED | ✅ |
|23| E |F|F place key tray|**key**| - | **in tray key** | in tray phone | on stand | 1 | REFRESHED | ✅ |
|24| E |N|held=null| - | - | in tray key | in tray phone | on stand | 1 | REFRESHED | ✅ |
|25| E |F|F pick umbrella| - | **umb** | in tray key | in tray phone | **held(umb)** | 1 | REFRESHED | ✅ |
|26| E |F|F place umbrella tray|**umb**| - | in tray key | in tray phone | **in tray umb** | 1 | REFRESHED | ✅ |
|27| E |N|All 3 in tray check| - | - | in tray key | in tray phone | in tray umb | 1 | REFRESHED | ✅ |
|28| E |M|→front door zone| - | - | in tray key | in tray phone | in tray umb | 1 | REFRESHED | ✅ |
|29| E |N|LEVEL COMPLETE| - | - | in tray key | in tray phone | in tray umb | 1 | REFRESHED | ✅ |

---

## §2. 8 Automatic Assertions + 2 额外断言 = 10 assertions (§七)

脚本自动断言全部通过:

```
§四 MACHINE ASSERTIONS (10 total):
  A1  NO DOUBLE HOLD:
        每一步 heldBefore/heldAfter 均为单值或 null.
        0 次列出 >1 object. Place 后 heldAfter 一律 null (Step 15,23,26 checked).
        → PASS

  A2  NO PICK WHILE HOLDING:
        所有 F pick 动作 Step 10 (phone) 21 (key) 25 (umb) → heldBefore=null.
        Step 13 显式 guard (cannot pick 时为 NOP, not F action).
        → PASS

  A3  CORRECT PLACEMENT (heldBefore = placed object category):
        Step 15 place phone: heldBefore=phone ✅
        Step 23 place key:   heldBefore=key   ✅
        Step 26 place umb:   heldBefore=umb   ✅
        3/3 PASS

  A4  CAT TRIGGER FIRES ONLY WHILE key status contains 'free':
        Step 6 fires cat (catEventTriggered 0→1) → key status pre-firing = "free (still coffee)"
        → PASS (keyFree=true matches trigger cond A)

  A5  OUTDATED MEMORY before E update:
        区间 Step 8..Step 19 inclusive (post-cat, pre-E-update) → keyMemoryState = OUTDATED 始终
        Step 20 executes E update → transitions to REFRESHED (no gap)
        → PASS

  A6  PHONE PLACED IN TRAY BEFORE KEY PICK (§三 CARRY_ONE 修复核心):
        Phone placed in tray Step 15.  Next key pick = Step 21.
        Steps 16..20: held=null, phone status="in tray phone" → true.
        Step 21 key pick PRECONDITION holds (hasPhoneObtained ctx = true because phone in tray now)
        also triggers cat (phoneObtained & keyFree would fire backup if not already fired).
        → PASS (the core blocker fix)

  A7  KEY PLACED IN TRAY BEFORE UMBRELLA PICK (顺序):
        Key Step 23 placed. Next umbrella Step 25 pick. Interval holds.
        → PASS (no umbrella out-of-order before key)

  A8  FINAL ALL THREE objects contained in tray (三物体 tray):
        After Step 27:
          key status     = "in tray key"     ✅
          phone status   = "in tray phone"   ✅
          umbrella status= "in tray umb"     ✅
        3/3 match leave-home.ts STAGE_ID_FINALIZE completionCondition.
        → PASS

  A9  FULL ROUTE CONNECTED (doorway graph valid):
        9 线段: (L→B via dw-living-bedroom (exists) ; B→L same; L→E via dw-living-entrance (exists); E→L same; 同房间 4 段 trivial). 0 段跨外墙。
        → PASS

  A10 PLAYER MINIMAP NOT LEAK RELOCATED KEY:
        PLAYER_MINIMABLOCKS (from §九 contract):
          ❌ KEY-LOC-A / KEY-LOC-B / KEY-LOC-C → relocated candidate positions
          ❌ cat final position
          ❌ hidden phone drawer contents
        本轮 29 step 中 relocated key at KEY-LOC-A = listed in blocklist
        → PASS (no data leak 给 player minimap)
```

---

## §3. Final Machine Status

Script output (console + JSON):

```
STATUS: L2_CARRY_STATE_MACHINE_PASS
assertionsPassed: 10
assertionsFailed: 0
F_REQUIRED: 7
F_WITH_OPTIONAL: 11
E_REQUIRED: 2
E_RECOMMENDED: 3
distances_m (DESIGN_ESTIMATE):
  AHA_PRE_DISTANCE          7.83 m
  PHONE_TO_TRAY_DISTANCE   11.72 m
  KEY_RECOVERY_DISTANCE    14.64 m
  FINAL_EXIT_DISTANCE       3.66 m
  FULL_GOLDEN_PATH_DISTANCE 37.84 m
KEY_LOC_A_STATUS: KEY_LOCATION_RECOMMENDED_CANDIDATE (not frozen production)
minimap_gate: MINIMAP_LAYOUT_MACHINE_PASS (§九 reconciled)
```

---

## §4. 与旧流程 CARRY_ONE 冲突的自动检测证明

若仍用旧 FLOW-A (Step 13 pick key while held=phone), 脚本立刻 FAIL:

```
Hypothetical OLD-FLOW test case run:
  Step 13 alt: F pick key (heldBefore=phone)
    → A2 FAIL: pick while holding=phone
    → A6 FAIL: phone not in tray yet
    → STATUS: L2_CARRY_STATE_MACHINE_FAIL
    → Final Gate: L2_CARRY_FLOW_REPAIR_FAILED
```

→ 新 FLOW-A2: **L2_CARRY_STATE_MACHINE_PASS** (10 assertions 0 fail) 解决此唯一阻断。

End of L2 carry state machine validation.
