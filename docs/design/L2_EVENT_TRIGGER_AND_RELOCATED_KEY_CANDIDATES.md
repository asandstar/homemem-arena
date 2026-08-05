# L2 EVENT TRIGGER AND RELOCATED KEY CANDIDATES (L2 旗舰关 · 猫事件与钥匙新位置)

Document ID: L2_EVENT_TRIGGER_AND_RELOCATED_KEY_CANDIDATES
Date: 2026-08-03
Baseline Commit: c5a2f83
Status: UNTRACKED · PLANNING ONLY · KEY LOCATION TO BE DECIDED DURING LIVING LAYOUT

---

## §0. L2 CAT EVENT 精确触发条件 (源码事实 FACT · 不可修改)

来自 leave-home.ts lines L292-303，猫事件 trigger 为 **OR 双条件**：

```
se-cat-pushes-key TRIGGER = (CONDITION_A) || (CONDITION_B)

CONDITION_A:
  keyFreshSaved = memorySlots 有 obj-key 且 !outdated
  keyFree = key 在 living 且 status='free' (未被拿起)
  leftLiving = currentRoom !== 'living' (玩家已离开客厅)
  → 三者同时满足

CONDITION_B:
  keyFree = key 在 living 且 status='free'
  phoneObtained = (phone held || phone 已放 tray)
  → 二者同时满足 (即使玩家没存 key 记忆直接冲进 B 拿手机，猫也会先扒拉一下钥匙让玩家注意到 save→update 机制)
```

事件效果 (L305-313)：
- type: 'move-entity'
- targetId: 'obj-key'
- targetPosition: **CURRENT_CODE_BASELINE = { room: 'living', x: −3.2, y: 0, z: −3.2 }** (客厅西北角)
- markMemoryOutdated: 'obj-key' (无论玩家何时观察到物理移动，记忆立刻被标记过期)
- toast: 🐱 "钥匙猫扒拉了你的钥匙…客厅西北角（沙发侧）找找？按 E 更新记忆吧。"

---

## §1. L2 合法流程候选 (两个)

### L2-FLOW-A · KEY-FIRST (推荐 · 改动最小 · 最适合新手)

```
1. Spawn in Living at (0, 0, −1.5), face north (茶几在前方)
2. 玩家 walk to coffee table (0, +0.3)，观察 key
3. E 保存 key memory → keyFreshSaved = true ✓ (进入 CONDITION_A 预备)
4. HUD playerObjective: 先拿到手机/雨伞。玩家选择去 Bedroom (最近的门 = west wall door at x=−3.25)
5. 穿过 dw-living-bedroom → currentRoom = 'bedroom' → leftLiving = true ✓
6. CONDITION_A (3/3) = true → **se-cat-pushes-key triggered!**
   → key 物理位置从茶几 → (−3.2, −3.2)
   → 玩家记忆 key slot 立刻 marked outdated
   → cat toast 弹出
   → 此时玩家在 Bedroom，看不见 key 移动 (悬念正确)
7. Bedroom: F 开 nightstand drawer → phone exposed → E 存 phone → F pick phone
8. 返回 Living: 玩家进 L 第一眼看到茶几上 key 位置空了 → "啊? 不见了!" (stale memory 冲击力)
9. minimap 上 key old memory 为灰红虚线圆 (×) 标记在茶几位置 — 但那里已经没了
10. 玩家看 toast 提示: "客厅西北角沙发侧" → 走到 (−3.2,−3.2)
11. 找到 displaced key → E 更新 key memory (memoryUpdateCount +=1, keyFresh = true)
    → stage-key-outdated 完成 → 进入 stage-finalize
12. CARRY_ONE: 此时手里如果是 phone → 必须先临时放回茶几台面 (acceptAny=true)
    → F pick key → 走 L→E dw → 放 key 到 cnt-entrance-tray ✓
13. 回去茶几 pick phone → 放 tray ✓
14. Entrance 内取 umbrella → 存 E → pick → 放 tray ✓
15. 3 items + cat fired + key memory fresh → LEVEL COMPLETE ✓
```

为什么是推荐：
- ✅ **改动最小**: 不需要修改 leave-home.ts 任何 trigger / stage 条件
- ✅ **不会错过事件**: 玩家一定会经过 Bedroom 拿手机，CONDITION_A 一定触发
- ✅ **不会提前触发**: key 在茶几上 (keyFree=true) 但 CONDITION_A 需要 leftLiving (一定要过门)
- ✅ **新手友好**: Briefing L59-66 已经明确写了 "🔑 钥匙 → 客厅茶几；📱 手机 → 卧室床头柜；☂️ 雨伞 → 玄关伞架。💡 靠近物品按 E 保存；猫会扒拉钥匙"

---

### L2-FLOW-B · BRIEFING-GATED (次要备选 · 需修改 briefing 文案)

```
1. Spawn
2. Briefing 弹窗 L59-66 第一行改成红字: "⚠️ 第一步必须先存钥匙位置记忆 (E)！不存的话猫会先偷走…"
3. 强制玩家在 Living 内 E 保存 key (否则 step-count 一直提示)
4. 玩家保存 key → HUD 箭头指示 Bedroom door 方向
5. 穿过 L→B 门洞 → CONDITION_A 触发 (同 FLOW-A steps 5-6)
6. 后续 steps 7-15 同 FLOW-A
```

不推荐理由：
- ❌ 需要改 briefing + 加 HUD 引导箭头
- ❌ 新手容易产生"为什么被强迫先存 key"的抵触感
- ✅ 可以降低 L2 failure-to-trigger (但 FLOW-A 触发概率也很高，因为拿手机一定要去 Bedroom)

结论：**FLOW-A 为正式推荐，不需要改代码。**

---

## §2. L2 旧流程错误 (必须从规划文档中删除的描述)

以下描述与源码矛盾，**从所有设计文档中移除**：

```
❌ 错误描述 #1: "玩家先观察 key、phone、umbrella，然后第一次离开 Living 猫才触发"
   WHY WRONG: phone 在 Bedroom，umbrella 在 Entrance — 不可能都在 Living 观察到。
   CORRECT: 只要存了 key 记忆 + 离开 Living，或拿到手机，猫就触发。

❌ 错误描述 #2: "手机和雨伞也会被猫移动"
   WHY WRONG: se-cat-pushes-key 只移动 obj-key (L306 targetId: 'obj-key')；phone/umbrella 不动。
   CORRECT: 只移动 key，phone 和 umbrella 初始位置就是它们的最终位置。

❌ 错误描述 #3: "钥匙一定被推到沙发下"
   WHY WRONG: CURRENT_CODE_BASELINE 坐标 (−3.2, −3.2) 是"客厅西北角"，具体家具位置需要 Living layout 阶段才能确认是不是"沙发下"
   CORRECT: key 新位置是 TO_BE_DECIDED_DURING_LIVING_LAYOUT，见 §3 候选集。
```

---

## §3. RELOCATED KEY LOCATION 候选集 (三选三，布局阶段最终决定)

⚠️ **冻结规则**: 不得把以下任一候选写成最终事实。最终位置必须在 Asset-Aware Living Layout 阶段由代码与家具真实包络重叠检查共同决定。

| 候选 ID | 房间局部候选 zone (A1.5 Living 局部坐标系) | 与旧茶几 (0, +0.3) 距离 | 返回 Living 时是否直接可见 (spawn 进 L at (0, −1.5) face north) | 猫脚印能否引导 | 是否被家具遮挡 | 是否可达 | 与碰撞重叠风险 | 搜索时长估计 | 夜间辨识度 | Minimap 是否泄题 |
|---------|------------------------------------------|------------------------|----------------------------------------------------------|----------------|----------------|----------|----------------|--------------|------------|------------------|
| **KEY-LOC-A** · 沙发坐垫下 (西北沙发群) | L (−2.5 ~ −1.5, −2.75 ~ −1.75) = 沙发坐面下沿 (SofaModel 通常 L: 2.0 × D: 1.0，放在 L (−2.0, −2.0) 时包络) | √(2.5²+2.95²) ≈ 3.87m | ⚠️ 如果 sofa 靠西墙 + 南墙，进 L at south door (−2.0, −2.0) 在西北角，返回进门在东南 → **不可直接见**，需要向西转身 135° — ✅ 搜索张力存在 | ✅ 猫脚印沿 west wall + south wall 画 3 步，引导到沙发 | ✅ 被沙发主体 (2.0×1.0) 遮挡，玩家要走到沙发旁边低头看 | ✅ 沙发前通常 0.8m 走道，宽到够走 | 🟡 与 SofaModel AABB 重叠 — 需要 Layout 阶段检查 sofa rotationY=0 时的 footprint vs key 放置球 (r=0.15m) | 2~4s (看提示) | 🟡 沙发阴影里可能偏暗，但 key 是金色高亮 | Minimap 只显示旧记忆灰红圆 (×) at (0, +0.3)，**新位置不在 minimap 上泄露** (规划约束) |
| **KEY-LOC-B** · 书架脚后 (东墙书架群) | L (+1.75 ~ +2.75, −2.75 ~ −2.0) = 书架 (0.8×1.8×0.35) 放 east wall 时的底部脚后 0.15m 空隙 | √(2.5²+2.3²) ≈ 3.40m | ❌ 玩家从 E 门进 L (x=+3.25, z=−2.0) → 书架在东墙东南角，第一眼可见 → **直接可见** — 搜索张力不足 | 🟡 猫脚印要跨整个客厅，太多 (~10 步)，容易丢失引导 | ✅ 被书架底部板遮挡一半 | ✅ 书架前沿走道 1.0m 够走 | ✅ 空隙 0.15m + key size 0.2×0.06×0.14 → 刚好塞下 | <1s (太容易) | ✅ 书架旁边通常有落地灯 — 夜间辨识度好 | ❌ 如果 minimap 显示当前 living observed objects 绿点，玩家打开 minimap 会在东墙看到一个新绿点 — **泄题风险** (需 observedObjects 过滤: 只有当玩家接近至 1.5m 内才把 displaced key 加入 observedObjects 列表 — 这个过滤机制在代码中 CURRENTLY NOT FOUND，所以 KEY-LOC-B 有风险) |
| **KEY-LOC-C** · 电视柜与南墙夹缝 (电视柜群) | L (+2.25 ~ +3.25, −2.5 ~ −2.0) = TV cabinet (2.2×0.55) 放 south wall east side 时 TV cab 后沿与 south wall (z = −2.75) 之间 0.25m 夹缝 | √(2.25²+2.8²) ≈ 3.59m | ⚠️ TV 在南墙东侧，返回进门 z=−2.0，x=0 → 转东 ~90°，**斜着看见电视柜底部，但不一定看到夹缝里的 key** — 搜索张力中等 | ✅ 脚印 5~6 步沿 south wall，引导合理 | ✅ 被 TV cabinet 箱体遮挡 | 🟡 夹缝 0.25m，玩家蹲才能看见 (游戏里无蹲功能，所以需要 camera angle 调整，或 key 稍微抬高 0.05m 能看见沿) | ⚠️ 夹缝仅 0.25m，TV cabinet size.z=0.55m，墙 z=−2.75，cabinet placed at z=−2.75+0.55/2=−2.475 → 与 south wall 间隙 = 2.75 − 2.475 − 0.275 = 0m? 实际要放离墙 0.2m → 间隙 0.2m，key 能刚好放 | 2~3s | 🟡 关了灯只有 TV 待机红点，key 金色在暗环境中辨识度 OK | 🟡 同 B：observedObjects 新绿点问题 — 但 TV cabinet 处通常有其他装饰物件 (plant/lamp)，绿点混在里面可能不泄题 |
| **CURRENT_CODE_BASELINE** (代码中硬编码值，非布局最终) | L (−3.2, −3.2) = 客厅西北角，A1.5 Living minX=−3.25 minZ=−2.75 → **⚠️ z=−3.2 < −2.75 = Living 墙外!** | 5.12m 到茶几 (错误! 越墙到外面了) | N/A | N/A | N/A | ❌ **key 会跑到墙外** | ❌ **必须修正!** CURRENT_CODE_BASELINE (−3.2,−3.2) 在 A1.5 里已经越界到 minZ=−2.75 以南 0.45m = 墙外面 — Layout 阶段必须把 targetPosition 的 z 改到 [−2.75, +2.75] 范围内 | N/A | N/A | N/A |

### 3.1 候选淘汰初步排序 (Layout 阶段再确认)

1. 🥇 **KEY-LOC-A (沙发下)** 推荐度最高: 搜索张力充足、引导清晰、越界风险低、Minimap 不泄题
2. 🥈 **KEY-LOC-C (电视柜夹缝)** 次选: 中等搜索张力，但需要 Layout 阶段精确摆 TV cabinet 离墙距离
3. 🥉 **KEY-LOC-B (书架后)** 淘汰候选: 太容易找到 (从 E 门进可见)，且泄题风险高

**最终状态冻结为:**
> 🔑 RELOCATED_KEY_LOCATION: **TO_BE_DECIDED_DURING_LIVING_LAYOUT**
> 必须在 A1.5 Living 家具包络 + 位置全部确定后，才能从 {KEY-LOC-A, KEY-LOC-B, KEY-LOC-C} 中选一个写入代码。
> CURRENT_CODE_BASELINE 存在越界 bug，必须届时同步修正 targetPosition。

---

## §4. L2 stale memory 精确触发 (源码事实)

```
触发时机 = se-cat-pushes-key 的 markMemoryOutdated: 'obj-key' 生效时
         = 与事件 fire 同步 = 与 CONDITION_A 或 CONDITION_B 同一 tick
         ≠ 玩家实际返回 Living 并观察到茶几空了的时间点 (可能晚 10~20 步)
```

**UI 行为:**
- 触发瞬间: memorySlots 中 obj-key 的 outdated = true
- 但 HUD stage-key-outdated 的 entryCondition (leave-home.ts L88-94) 要等 catEventTriggered + 玩家此时 key 记忆要么 outdated、要么已经没有 fresh 的 (可能被玩家手动覆盖了) — 有一个缓冲
- **stale memory 视觉提示 (Minimap 灰红虚线圆)** 立刻出现在 minimap 上，以旧茶几位置为圆心 (memorySlots[i].position 保存的是玩家 save-memory 那一刻 key 的 world-local 坐标，不会被后续 move 自动更新)

---

## §5. L2 cat event 保证触发的 watchdog 兜底

为了防止 CONDITION_A 不触发 (玩家存了 key 但一直不去 B/E，原地在 L 徘徊)，**CONDITION_B 兜底**:

- 玩家 pick key 失败 (L1 教学: 如果 L2 stage-observe-key 期间禁止 pick key，commands.ts L82-111 对 stage-observe-key 阶段禁止 pick，但 L2 当前 stages 中 stage 名是 'stage-observe-fetch'，不是 commands 中硬编码的 'stage-observe-key' — ⚠️ CONFLICT! commands 硬编码的 stage 名和任务实际 stage 名不一致 → 可能玩家在 L2 能先 pick key 而不触发 E save)

CONFLICT 记录：
```
commands.ts L82 hardcodes: before.currentStageId === 'stage-observe-key'
但 leave-home.ts L9 actual: STAGE_ID_OBSERVE_FETCH = 'stage-observe-fetch'
→ 导致 L2 的 key pick 限制条件 NEVER TRIGGERS
→ 玩家可能: spawn → walk → F pick key → held = key → walk → 去 B 拿 phone 失败 (CARRY_ONE)
→ 然后 CONDITION_B: phoneObtained 要先放下 key 才能 pick phone → 绕了一圈仍能触发，但体验差
→ 这个 CONFLICT 留到 G1 代码接入阶段修复；本规划不修改 src。
```

---

End of L2_EVENT_TRIGGER_AND_RELOCATED_KEY_CANDIDATES. Key location FROZEN as TO_BE_DECIDED_DURING_LIVING_LAYOUT.
