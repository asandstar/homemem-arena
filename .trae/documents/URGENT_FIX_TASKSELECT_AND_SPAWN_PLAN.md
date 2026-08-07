# 紧急修复：关卡解锁、初始化卡死、出生点优化

## 问题诊断

### 1. 关卡锁定显示（最紧急）

**现象**：TaskSelectPage 中第 2、3 关显示锁图标

**根因**：React 首帧 `getSnapshot` 返回 null，`withSafeSnapshot` 包装后，用户的 selector `(s) => s?.isLevelUnlocked` 在首帧返回 `undefined`，导致 fallback 到 `index === 0`（只有第一关解锁）。

**影响**：玩家无法进入第 2、3 关游戏

### 2. 初始化卡死

**现象**：点击"开始任务"后一直卡在"准备中"

**根因**：`withSafeSnapshot` 的静态方法复制虽然已修复，但 `getState()` 返回的 state 可能不完整，导致 `initializeTask` 调用失败。

**影响**：玩家无法开始游戏

### 3. 出生点不友好

**现象**：玩家起始位置不合理，无法看到关键物品

**根因**：spawnPosition 坐标可能不正确，或者没有指向可交互的区域

**影响**：游戏体验差

---

## 修复计划

### Step 1: 修复 TaskSelectPage 关卡解锁判断

**文件**: `src/pages/TaskSelectPage.tsx`

**修改内容**：

```typescript
// 问题代码（L43）：
const isLevelUnlocked = useGameStore((s) => s?.isLevelUnlocked)

// 修复方案：在 useEffect 中用 getState() 获取真实方法
// 新增一个 state 来存储解锁判断结果
const [unlockedMap, setUnlockedMap] = useState<Record<string, boolean>>({})

useEffect(() => {
  // 用 getState() 绕过 React 首帧 null 的问题
  const state = useGameStore.getState()
  const map: Record<string, boolean> = {}
  publicTaskTemplates.forEach((t) => {
    if (typeof state.isLevelUnlocked === 'function') {
      map[t.id] = state.isLevelUnlocked(t.id, unlockOrder)
    } else {
      map[t.id] = true // 默认解锁
    }
  })
  setUnlockedMap(map)
}, [publicTaskTemplates, unlockOrder])

// 渲染时使用 unlockedMap 而非 isLevelUnlocked
const unlocked = unlockedMap[task.id] ?? true
```

**风险**：低。只是改变了数据获取方式，不影响业务逻辑。

### Step 2: 修复初始化卡死问题

**文件**: `src/pages/ArenaPage.tsx`

**修改内容**：在 initializeTask 的 effect 中增加更健壮的重试逻辑

```typescript
useEffect(() => {
  // ... 现有代码 ...
  
  // 增加：检查 getState() 返回的 state 是否完整
  const maxRetries = 5
  let retries = 0
  
  const tryInitialize = () => {
    const state = useGameStore.getState()
    if (typeof state?.initializeTask === 'function') {
      state.initializeTask(taskId)
      return
    }
    if (retries < maxRetries) {
      retries++
      requestAnimationFrame(tryInitialize)
    } else {
      console.error('[ARENA EFFECT #1 FATAL] 多次重试后仍无法 initializeTask')
      // 强制解锁：即使初始化失败，也尝试直接设置 phase
      const s = useGameStore.getState()
      if (s?.setGamePhase) {
        s.setGamePhase('idle')
      }
    }
  }
  
  requestAnimationFrame(tryInitialize)
}, [taskId])
```

**风险**：中。需要确保重试不会导致状态不一致。

### Step 3: 优化出生点坐标

**文件**: `src/data/tasks/clean-table.ts`（第一关）
**文件**: `src/data/tasks/leave-home.ts`（第二关）

**修改内容**：根据房间布局，设置合理的出生点

```typescript
// 第一关（餐桌整理）：从房间中央偏入口处出生
spawnPosition: { x: 0, z: -2.5 },  // 面向餐桌方向

// 第二关（出门大作战）：从客厅中央出生，面向茶几
spawnPosition: { x: -0.5, z: 0.5 },  // 面向茶几和钥匙位置
```

**风险**：低。只是调整坐标，需要测试验证。

---

## 实施步骤

1. **先修 TaskSelectPage**（解决最紧急的"玩不了"问题）
2. **再修 ArenaPage 初始化**（解决"准备中卡死"问题）
3. **最后优化出生点**（提升体验）
4. **运行全部门禁测试**
5. **Push 到 GitHub**

---

## 验收标准

- ✅ TaskSelectPage 中所有关卡显示为解锁状态（无锁图标）
- ✅ 点击"开始任务"后 2 秒内进入游戏场景（不再卡在"准备中"）
- ✅ 玩家出生后能立即看到至少一个可交互的物品
- ✅ 所有 414 单元测试通过
- ✅ 构建成功

---

## 风险处理

- **如果 getState() 仍返回空对象**：
  - 在 `withSafeSnapshot` 中增加 fallback，确保 getState() 至少返回 EMPTY 对象
  - 或者在 TaskSelectPage/ArenaPage 中增加更多的 null 检查

- **如果出生点坐标导致穿墙**：
  - 回退到原始坐标
  - 增加 spawn 位置的碰撞检测