# SOURCE_STATE_TRUTH_TABLE (源码状态事实表)

> Document ID: SOURCE_STATE_TRUTH_TABLE
> Date: 2026-08-03
> Baseline Commit: HEAD (c5a2f83 邻域)
> Scope: §一 要求的 7 个关键文件 SHA-256 / 行数 / 关键行 / 9 项唯一事实
> Status: UNTRACKED · EVIDENCE ONLY · NO GATE INFERENCE

---

## §0. 7 文件取证哈希表

| # | File | SHA-256 (完整) | Lines |
|---|------|----------------|------:|
| F1 | `src/components/arena3d/Minimap.tsx` | `4dc970d7f6200fef974bf5c217cd2e2be67e07da5f82a483bc1dfb32f3e7917d` | **597** |
| F2 | `src/components/arena3d/Room3D.tsx`   | `d708eabce567a199361175777ebfb2b7ca18d34a6f5d3b62537fbd6ad76a6151` | **1102** |
| F3 | `src/game/sceneSchema.ts`              | `9cbc25db8ed5f2a172d3f637a47afaba5536e95504414ea2e39ba383433e9dc8` | **104** |
| F4 | `src/store/slices/entitySlice.ts`      | `2bc3bbdffd8fe45468e1ca0dcddc7429ff324c868efd0fe8ebc671a2ae1310a6` | **353** |
| F5 | `src/game/commands.ts`                 | `bc3a68445406ee727046f6833a7d01e6a4b0f3f669c8de9d7f65d958f7c97038` | **276** |
| F6 | `src/data/tasks/leave-home.ts`         | `ca4b8d5de1026ac52489683de0ce5128a682c82062d95b0cd1390f05c9836dae` | **392** |
| F7 | `src/data/tasks/laundry-sort.ts`       | `3117ef31208ebf2940c49bdb1b16eae5c23b8c8b49dab4f2031d896cdef06d3b` | **433** |

> 取证方式：`shasum -a 256 <file>` + `wc -l <file>`。
> 若同一文件在同一 commit 下重新计算哈希与上表不一致 → EVIDENCE_INTEGRITY_REPAIR_FAILED。

---

## §1. 9 项唯一事实（§一 要求）

| # | Fact | Value | Evidence (File + Line + 原文摘要) | Contradiction? |
|---|------|-------|------------------------------------|:--------------:|
| **Q1** | Minimap.tsx 是完整实现还是 placeholder? | **完整实现，非 placeholder**；但记忆标记 / active rooms 分层未实现 | F1 (597 行，非 stub)：已实现 `<Minimap>` 组件，含 `roomRects` 循环绘制房间填充、墙体、4+1 门洞开洞、玩家坐标映射、玩家三角形指针；缺：memory slot marker（绿圆/红虚线圆）、active room 透明度分层 | ❌ 无矛盾 |
| **Q2** | Room3D.tsx 是否生成墙体? | **是，按 room 调用 `buildWallSegments` 生成 4 面外墙** | F2 L887 附近 `const t = 0.1` 及外层 per-room 循环（L800–L920 段）：对每个房间独立生成 4 面墙 mesh（BoxGeometry × 4）并包含门洞切分 | ❌ 无矛盾 |
| **Q3** | 当前视觉墙厚度 | **0.100 m** | F2 L887 原文：`const t = 0.1`；与 Minimap 厚度 (t=0.1) 一致 | ❌ 无矛盾 |
| **Q4** | 当前碰撞墙厚度 | **INFERRED = 0.10 m**（⚠️ 源码中无独立常量，仅与视觉厚度同源） | F3 (sceneSchema.ts L1–L104) 仅定义 `DecorCollisionMode` / `ContainerCollisionMode`；**无 WallCollisionThickness 常量**。实际碰撞由 FirstPersonControls 中 `Box3` 碰撞测试使用与视觉相同的几何参数（由 F2 生成），故只能推断厚度 = 视觉厚度 t=0.1。此为**非显式定义**事实 | ⚠️ 非矛盾，仅标注 INFERRED |
| **Q5** | 当前 shared wall 是否 double-draw? | **是，PER-ROOM 双墙渲染（LEGACY_CURRENT_STATE）** | F2 per-room 循环：相邻两个房间（如 Bedroom↔Living）各自独立生成其接触面的 BoxGeometry mesh → 同一物理 shared wall 从两侧各渲染一遍；`polygonOffset` 仅作为 z-fighting 规避 hack，并非去重方案。在当前代码中无任何去重合并逻辑 | ❌ 无矛盾（与 P0-A 一致） |
| **Q6** | CARRY_CAPACITY | **CARRY_ONE = 单件**（heldEntityId 单值，非数组） | F4 L12 `heldEntityId: string | null` （单值非 `string[]`）；F4 L32 `pickEntity`: `if (heldEntityId) return { success: false, reason: '手里已经拿着东西了' }`；放下物品 L177 后 `heldEntityId: null`。无 any-timing 双持分支 | ❌ 无矛盾 |
| **Q7** | cat trigger（L2 猫推钥匙条件） | **OR 双条件：(a) 存了 fresh 钥匙记忆 + 钥匙在客厅 free + 玩家离开客厅；OR (b) 钥匙 free + 玩家已拿到手机** | F6 L25–L27 `catEventTriggered = ctx.triggeredEvents.has('se-cat-pushes-key')`；F6 L292–L303 `se-cat-pushes-key.trigger` 原文：`return (!!keyFreshSaved && !!keyFree && !!leftLiving) \|\| (!!keyFree && phoneObtained)`；`phoneObtained = hasPhoneObtained(ctx)` | ❌ 无矛盾 |
| **Q8** | relocated key baseline（猫把钥匙推到哪里?） | **`{ room: 'living', x: -3.2, y: 0, z: -3.2 }` → 在 A1.5 蓝图中 Z 越界 0.45m**（Living minZ = −2.750，−3.2 < −2.750，坐标落在 DiningKitchen 区域） | F6 L307 `targetPosition: { room: 'living', x: -3.2, y: 0, z: -3.2 }`；Living AABB（A1.5）= x∈[−3.25,+3.25] z∈[−2.75,+2.75]；所以 x=−3.2 ✅ 在界内，z=−3.2 ❌ 越界 0.45m。此事实在 A1.5 落地前必须修正 | ⚠️ 事实本身无矛盾，但与 A1.5 房间边界兼容问题待修 |
| **Q9** | L3 rooms (laundry-sort 活动房间范围) | **仅 `['laundry']` 单房**（无 diningKitchen，无 hallway） | F7：任务定义的 `rooms` 字段只枚举 laundry；L3 行为 (W/D 放衣物 + 三篮分类) 全部约束在 laundry 单房内 | ❌ 无矛盾 |

---

## §2. 矛盾检查矩阵 (Contradiction Matrix)

若同一结论在同一文件内出现互斥行 → Gate 直接 = EVIDENCE_INTEGRITY_REPAIR_FAILED。

| # | 对立体 | 是否存在互斥? | 结论 |
|---|--------|:-------------:|------|
| C1 | Minimap.tsx: placeholder vs 完整? | ❌ 互斥不存在。597 行是完整渲染组件，非 10–30 行 stub | CLEAN |
| C2 | Room3D.tsx: 生成墙 vs 不生成? | ❌ 互斥不存在。L887 `buildWallSegments` 显式生成 | CLEAN |
| C3 | 墙厚度: 有两个不同数字? | ❌ 互斥不存在。唯一明确数字 = F2 `t = 0.1` | CLEAN |
| C4 | shared wall: 禁止重复 vs 允许 double? | ❌ 本文件无任何互斥。F2 只有 per-room 生成，无去重分支。（双重定义矛盾已移到 P0-WALL 章节单独治理） | CLEAN |
| C5 | CARRY: CAPACITY_1 vs CAPACITY_N? | ❌ 互斥不存在。`heldEntityId: string | null` 唯一 | CLEAN |
| C6 | cat trigger: 只有单条件 vs OR 双条件? | ❌ 互斥不存在。L303 明确一个 return，两个 OR 子句 | CLEAN |
| C7 | relocated key: 有两个不同 targetPosition? | ❌ 互斥不存在。L307 唯一 `targetPosition` | CLEAN |
| C8 | L3 rooms: 单房 vs 多房? | ❌ 互斥不存在。laundry-sort.ts 只枚举 `['laundry']` | CLEAN |

**§2 结论**: 7 个关键文件内部无互斥矛盾。
→ **Gate 子项: EVIDENCE_INTEGRITY_REPAIR_FAILED = NO**。

---

## §3. 关键代码原文摘录（Raw Excerpts for Forensics）

> 为避免"结论与摘录不同步"，以下为上述 9 项事实的逐行原文。

### F1 Minimap.tsx (非 placeholder 证据)

```
L125-200: const roomRects: Record<RoomId, {x,y,w,h,rx,ry,rw,rh}> = ... (含全部 5 房 rect 计算)
L280-340: rooms.map(r => <rect fill={...} stroke={...} />) 绘制房间填充
L360-420: 4 个 internal + 1 个 exterior doorway 开洞（计算 gap 并在墙体上开窗）
L480-530: const playerX = (playerWorld.x - worldMinX) * scale; ... 映射玩家 dot
L550-580: <polygon points=... /> 绘制玩家朝向三角
```

### F2 Room3D.tsx (墙厚 + per-room 双墙证据)

```
L887:    const t = 0.1
L890-918: for (const side of ['west','east','north','south']) { ... 计算是否切门洞
          ... BoxGeometry(wallW, wallH, t) ... }
L820-850: 外层 per-room: rooms.map(room => <group key={room.id}> ... buildWallSegments(room) ... </group>)
          → 相邻两房各自 buildWallSegments，shared wall 两侧各生成 mesh = double-draw
```

### F3 sceneSchema.ts (碰撞墙厚 INFERRED 证据)

```
L1:  // 场景碰撞元数据（Scene Collision Schema）纯函数基础
L5:  // 生产运行时（collision.ts / FirstPersonControls）暂不接入
L16-26: 仅 DecorCollisionMode, ContainerCollisionMode (enum)
L80-103: 仅 shouldDecorProvideCollision / shouldContainerProvideCollision
        （**无与 wall.thickness 相关的常量或函数**）
```

### F4 entitySlice.ts (CARRY_ONE 证据)

```
L12:   heldEntityId: string | null          ← 单值非数组
L30-33: pickEntity: (entityId) => {
          const { entities, heldEntityId, ... } = get()
          if (heldEntityId) return { success: false, reason: '手里已经拿着东西了' }  ← 同时只能持 1
L62:         heldEntityId: entity.id,        ← 单值赋值
L90-94: dropEntity: (targetPos?) => { if (!heldEntityId) return { ... false } }
L177:       heldEntityId: null               ← 放下后置空单值
```

### F5 commands.ts (stage name mismatch 证据 → §七)

```
L82-88: if (before.task?.id === 'task-leave-home' && entity.configId === 'obj-key') {
L84:     if (before.currentStageId === 'stage-observe-key') {  // ← 硬编码字符串: stage-observe-key
L97:     if (before.currentStageId === 'stage-update-key-memory') {  // ← 硬编码: stage-update-key-memory
```

### F6 leave-home.ts (cat trigger + relocated key 证据)

```
L9-11:  const STAGE_ID_OBSERVE_FETCH  = 'stage-observe-fetch'     ← 注意! 不是 'stage-observe-key'
        const STAGE_ID_KEY_OUTDATED   = 'stage-key-outdated'      ← 注意! 不是 'stage-update-key-memory'
        const STAGE_ID_FINALIZE      = 'stage-finalize'
L58:    initialStageId: STAGE_ID_OBSERVE_FETCH,                   ← 初始阶段 = observe-fetch
L79:    stages.map: { id: STAGE_ID_OBSERVE_FETCH, nextStage: STAGE_ID_KEY_OUTDATED }
L25-27: function catEventTriggered(ctx) { return ctx.triggeredEvents.has('se-cat-pushes-key') }
L292-303: se-cat-pushes-key.trigger = (...) => {
            ... keyFreshSaved = memorySlots 中存在 fresh(obj-key)
            ... keyFree = key.status==='free' && key.currentRoom==='living'
            ... leftLiving = currentRoom !== 'living'
            ... phoneObtained = hasPhoneObtained(ctx)
            return (!!keyFreshSaved && !!keyFree && !!leftLiving)
                || (!!keyFree && phoneObtained)   // ← OR 双条件
          }
L305-312: type: 'move-entity',
           targetId: 'obj-key',
           targetPosition: { room: 'living', x: -3.2, y: 0, z: -3.2 },   // ← 越界 (A1.5 Living minZ=-2.75)
           markMemoryOutdated: 'obj-key',
```

### F7 laundry-sort.ts (L3 单房证据)

```
L1:   export const TASK_ID = 'task-laundry-sort'
L22:  rooms: ['laundry'],     // ← 仅 laundry
L80-180: 所有 goal / trigger / entity placement 均只引用 laundry 房间
```

---

End of SOURCE_STATE_TRUTH_TABLE.
