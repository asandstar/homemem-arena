# P0-B 三关公开范围收缩报告

THREE-LEVEL RESCUE — P0-B PUBLIC SCOPE

分支：semifinal/three-level-rescue
基准提交：ec170aa chore(p0-a): asset visibility fix + precondition commit for P0-B

## 1. 修改前所有五关入口

以下是审计发现的所有在修改前可能向普通用户暴露五关（含 breakfast / night-patrol）的入口位置：

### 1.1 首页（src/pages/HomePage.tsx）

- L92 核心数据卡片：`{taskTemplates.length}` 动态输出关卡设计数（= 5）
- L106-117 `关卡一览`区块：`taskTemplates.map()` 遍历全部 5 关渲染卡片
- 文案上，L56 背景介绍提到"准备早餐"（保留为背景叙事，不计入入口）

### 1.2 任务列表页（src/pages/TaskSelectPage.tsx）

- L10-16 `timeSlots` 时间轴数组：5 个时间段对应五关
- L107 副标题文案："从清晨到深夜，五段记忆挑战在等你~"
- L114 进度统计：`X / {taskTemplates.length} 已完成`（分母 = 5）
- L46-54 `getNextUnlockedTaskIndex()`：基于 5 关数组遍历找下一关
- L56 `completedCount`：`taskTemplates.filter(...)` 统计 5 关范围的完成数
- L26 `initializeProgress(taskTemplates.map(t => t.id))`：向 store 注入全部 5 关的解锁种子
- L123-182 时间轴卡片渲染：`taskTemplates.map()` 渲染 5 张卡片 + 连接线

### 1.3 下一关解锁链（src/store/slices/taskSlice.ts）

- L316 硬编码五关 ID 数组：
  ```
  ['task-clean-table', 'task-leave-home', 'task-laundry-sort',
   'task-breakfast', 'task-night-patrol']
  ```
- 任意公开关卡完成后会向第四关推进解锁

### 1.4 解锁逻辑（src/store/slices/progressSlice.ts）

- `isLevelUnlocked(taskId, allTasks)` 依赖调用方传入的 `allTasks`；TaskSelectPage 曾传入 `taskTemplates.map(t => t.id)` = 5 关，第三关完成后会计算出第四关为"即将解锁"

### 1.5 结果页（src/pages/ResultPage.tsx）

- 修改前无"下一关"按钮 / "全部完成"文案；默认三个按钮不指向第四关，但也没有阻止第三关后出现别的入口
- 缺少生产环境保护（隐藏关卡的 result 页面可直接进入）

### 1.6 路由（src/routes.tsx）

- `/play/:taskId`、`/probe/:taskId?`、`/result/:taskId`、`/data/:taskId` 四条路由无任务 ID 守卫；生产环境用户可直接访问隐藏关卡 URL

### 1.7 任务卡片（src/components/tasks/TaskCard.tsx）

- L237 锁定按钮文案："完成前一关解锁"（仅锁定态使用，不算主动暴露，但如果第四五关出现在 UI 中就会被看到）

### 1.8 任务元数据（src/data/tasks/index.ts）

- `taskTemplates: TaskConfig[]` 5 关数据是唯一来源；修改前没有"公开 vs 隐藏"的声明式区分

### 1.9 E2E / 测试（tests 目录）

- `navigation-audio.spec.ts:331` 用例标题："任务切换（五关：clean-table → ... → night-patrol）"
- `breakfast-command-flow.spec.ts` / `night-patrol-command-flow.spec.ts`：直接进入隐藏关卡
- 多个 E2E localStorage mock 包含第四五关进度

（测试源码不在禁止删除列表之外，按要求保留）

## 2. 公开关卡单一来源的位置

文件：`src/data/tasks/index.ts`（新增）

```
export const PUBLIC_LEVEL_ORDER = [
  'task-clean-table',
  'task-leave-home',
  'task-laundry-sort',
] as const

export const HIDDEN_TASK_IDS = ['task-breakfast', 'task-night-patrol'] as const
```

辅助函数（同样位于 src/data/tasks/index.ts）：

- `isPublicTaskId(id)` — 类型守卫，判断三公开关
- `isHiddenTaskId(id)` — 类型守卫，判断隐藏关（路由保护用）
- `getNextPublicTaskId(currentTaskId)` — 基于 `PUBLIC_LEVEL_ORDER` 计算下一关；第三关返回 `null`；隐藏关和未知关也返回 `null`

**所有业务代码必须直接或间接引用 `PUBLIC_LEVEL_ORDER`，不得在多处硬编码不同的三关数组。**当前使用点：

| 模块 | 使用方式 |
|---|---|
| TaskSelectPage.tsx | 初始化进度、完成计数、卡片渲染、时间槽、解锁判断、下一索引 |
| HomePage.tsx | 核心数据"递进关卡"计数、关卡一览卡片渲染 |
| ResultPage.tsx | 下一关按钮渲染 / 第三关完成文案显示 |
| taskSlice.ts | 完成关卡后解锁下一公开关的解锁链 |
| publicLevelScope.test.ts | 全部断言基于此单一来源 |

隐藏关卡 `task-breakfast` 与 `task-night-patrol` 仍保留在 `taskTemplates` 数组和独立的 task 数据文件中（`breakfast.ts / night-patrol.ts`），只通过 UI/路由/解锁链隐藏。

## 3. 修改文件列表

### 3.1 修改（8 个文件）

1. `src/data/tasks/index.ts`
   - 新增 `PUBLIC_LEVEL_ORDER` / `HIDDEN_TASK_IDS` 常量
   - 新增 `isPublicTaskId` / `isHiddenTaskId` / `getNextPublicTaskId` 辅助函数

2. `src/pages/HomePage.tsx`
   - `taskTemplates.length` → `PUBLIC_LEVEL_ORDER.length`
   - 关卡一览从 `taskTemplates.map()` 改为按 `PUBLIC_LEVEL_ORDER` 取前三关
   - 卡片列从 2 列改为 3 列（三关美观）

3. `src/pages/TaskSelectPage.tsx`
   - `timeSlots` 从 5 段缩为 3 段
   - 副标题："五段记忆挑战在等你~" → "从基础教学到进阶挑战，一步步锻炼记忆能力~"
   - 标题："小橡的一天" → "三个递进关卡"
   - 进度分母：`taskTemplates.length` → `PUBLIC_LEVEL_ORDER.length`
   - `initializeProgress` 调用改为仅传入 3 公开关 ID
   - `getNextUnlockedTaskIndex` / `completedCount` 改为遍历公开关
   - 卡片渲染改为基于 `PUBLIC_LEVEL_ORDER`
   - 新增 `PUBLIC_LEVEL_CAPTION`，把三关 description 替换为指定能力递进文案
     - 餐桌整理：基础教学 · 保存与使用记忆
     - 出门大作战：核心挑战 · 识别并更新过期记忆
     - 洗衣幽灵：进阶挑战 · 有限记忆与多目标管理

4. `src/pages/ResultPage.tsx`
   - 新增下一关按钮（基于 `getNextPublicTaskId`）
   - 第三关完成时显示"已完成当前版本的全部挑战"徽章
   - 生产环境隐藏关卡访问：直接 redirect 回 `/tasks`

5. `src/pages/ArenaPage.tsx`
   - 生产环境：`taskId` 命中 `isHiddenTaskId` → `navigate('/tasks', { replace: true })`

6. `src/pages/ProbePage.tsx`
   - 生产环境：隐藏关卡任务 ID → redirect 回 `/tasks`

7. `src/pages/SessionDataPage.tsx`
   - 解构 `taskId`
   - 生产环境：隐藏关卡任务 ID → redirect 回 `/tasks`

8. `src/store/slices/taskSlice.ts`
   - 解锁链硬编码五关数组替换为 `PUBLIC_LEVEL_ORDER.findIndex`
   - 第三关完成后不会再解锁第四关

### 3.2 新增（1 个文件）

9. `src/data/tasks/publicLevelScope.test.ts`
   - 覆盖全部 P0-B 测试要求的纯函数测试（见第 7 节）

### 3.3 未修改（明确遵守禁令）

- ❌ 未碰任何关卡阶段条件（stages / stage gates）
- ❌ 未碰任务物品和容器（object spec / container spec）
- ❌ 未碰教学文案（dialog.ts 教学对话文本未改）
- ❌ 未碰家具坐标 / Room3D / Door3D / FirstPersonControls / 碰撞系统 / 模型加载
- ❌ 未删除第四关、第五关源码（`breakfast.ts`、`night-patrol.ts`、对应的测试、E2E、dialog 条目保留）
- ❌ 未开始第一关或第二关玩法修复
- ❌ 未 commit、未 push

## 4. 首页和任务页修改

### 4.1 首页

核心数据卡片：
- 原：`5 关卡设计`
- 新：`3 递进关卡`

关卡一览区块：
- 原：2 列网格，遍历 `taskTemplates` 显示 5 张卡片（含 早餐时间循环、深夜巡逻）
- 新：3 列网格，按 `PUBLIC_LEVEL_ORDER` 显示 3 张卡片
  - 🍽️ 餐桌整理 / 出门大作战 / 👕 洗衣幽灵
  - 无第四、第五关卡片
  - 无灰色锁定卡片

### 4.2 任务页

- 时间表情 emoji 从 5 个缩成 3 个（🌅 ☕ 🌆）
- 进度：`已完成公开关卡数 / 3`
- 卡片 3 张，时间轴仅渲染 3 个节点 + 2 段连接线
- 卡片描述替换为能力递进文案（不是原 task.description）：
  - 关卡 1：基础教学 · 保存与使用记忆
  - 关卡 2：核心挑战 · 识别并更新过期记忆
  - 关卡 3：进阶挑战 · 有限记忆与多目标管理
- 顺序解锁保持：关 2、关 3 仍显示"完成前一关解锁"（仅两张灰卡），没有大片灰色锁定卡片
- 不出现"第四关"、"第五关"、"实验关卡"、"即将开放"等字样

## 5. 下一关逻辑

实现基于 `getNextPublicTaskId(currentTaskId)`，返回 `PublicTaskId | null`：

| 当前关卡 | 返回值 | 结果页表现 |
|---|---|---|
| task-clean-table（餐桌整理） | `'task-leave-home'` | 显示"进入下一关：出门大作战"按钮 |
| task-leave-home（出门大作战） | `'task-laundry-sort'` | 显示"进入下一关：洗衣幽灵"按钮 |
| task-laundry-sort（洗衣幽灵） | `null` | 显示"✅ 已完成当前版本的全部挑战"徽章 |
| task-breakfast（隐藏） | `null` | 不下一关按钮，公共按钮不变 |
| task-night-patrol（隐藏） | `null` | 不下一关按钮，公共按钮不变 |
| 未知 taskId | `null` | - |

解锁链（taskSlice 完成关卡后）：
- 只在 `PUBLIC_LEVEL_ORDER` 范围内推进；第三关完成后不会再解锁 task-breakfast
- 同时隐藏关卡即使被外部在 localStorage 中写入 completed 也不会在公开进度里计数

## 6. 路由保护

四个任务相关页面都加了生产环境守卫。守卫条件一致：

```
if (taskId && import.meta.env.PROD && isHiddenTaskId(taskId)) {
  navigate('/tasks', { replace: true })
}
```

覆盖的路由：

| 路由 | 页面 | 效果 |
|---|---|---|
| `/play/:taskId` | ArenaPage（游戏场景） | 生产环境 task-breakfast / night-patrol 直接回到任务列表页，不会加载游戏 |
| `/probe/:taskId?` | ProbePage（记忆测试） | 同上，防止记忆测试页白屏 |
| `/result/:taskId` | ResultPage（结果页） | 同上 |
| `/data/:taskId` | SessionDataPage（研究 JSON） | 同上 |

- 开发环境（`import.meta.env.DEV === true`）：**不拦截**，内部测试仍可通过 URL 直接进入任意隐藏关卡（DEV-only 行为，不在普通 UI 上显示）
- 路由保护不区分是否登录，也不使用 flag，仅依赖 `import.meta.env.PROD` 这一 Vite 内置环境变量
- 结果：**生产环境不会白屏、不会进入游戏场景**

## 7. 测试结果

### 7.1 新增测试

文件：`src/data/tasks/publicLevelScope.test.ts`
套件：`P0-B 公开关卡范围（三个递进关卡）`
用例数：15 个，全部 PASS。断言与需求映射：

| 需求项 | 对应测试用例 |
|---|---|
| 1. 任务页只显示三个公开关卡 | `PUBLIC_LEVEL_ORDER 长度为 3` + `公开进度分母恒为 3` |
| 2. 页面不存在早餐时间循环 | `PUBLIC_LEVEL_ORDER 中不包含 task-breakfast` |
| 3. 页面不存在深夜巡逻 | `PUBLIC_LEVEL_ORDER 中不包含 task-night-patrol` |
| 4. 第一关下一关是第二关 | `getNextPublicTaskId(clean-table) = leave-home` |
| 5. 第二关下一关是第三关 | `getNextPublicTaskId(leave-home) = laundry-sort` |
| 6. 第三关没有下一关 | `getNextPublicTaskId(laundry-sort) = null` |
| 7. 公开进度分母为 3 | `PUBLIC_LEVEL_ORDER 长度为 3` + `与 taskTemplates 总数无关` |
| 8. production 模式隐藏关卡被拦截 | `isHiddenTaskId 正确识别 4/5 关`（路由守卫基于此函数） |
| 9. 三个公开关卡仍可正常进入 | `三个公开关卡 taskTemplates 中存在且 goals>0` + `隐藏关卡数据保留` |

附加保障用例：
- 隐藏关卡 `getNextPublicTaskId` 返回 null（不会在结果页给出下一关）
- 未知 taskId 返回 null
- `isPublicTaskId` 三关 true、四五关 false
- `HIDDEN_TASK_IDS` 明确定义了两个隐藏关 ID
- 三关顺序为 clean-table → leave-home → laundry-sort

### 7.2 运行命令

```
npm run lint    → 0 errors, 12 warnings（全部在 tests/scripts 已有存量，无新增）
npm run build   → tsc -b && vite build ✓
npm test        → 14 files, 321 tests passed（新增 15 全部通过）
```

完整测试套件列表全部通过：
- memorySlots (36), placement (38), scoring (39), collision (36), playerMovement (25)
- **taskConsistency (15)**, **publicLevelScope (15)** ✅
- commands (3), useGameStore (44), chaos (34), flow (3), probeConsistency (4)
- sceneGraph (16), proceduralMemory (13)

## 8. 人工检查结果

检查路径：浏览器真实访问
```
首页 (/) → 任务列表 (/tasks) → 第一关卡片 → /play/task-clean-table
```

工具：integrated_browser + `browser_evaluate` DOM 文本扫描

### 8.1 首页

- 核心数据 `递进关卡` 显示 3 ✓
- 关卡一览卡片：初次整理、出门大作战、洗衣幽灵（3 张）✓
- 无"早餐时间循环" ✓
- 无"深夜巡逻" ✓
- 无"五关 / 五段"字样 ✓
- 关卡一览卡片 3 列布局，无大片灰/锁卡 ✓

### 8.2 任务列表页

提取结果：
```
taskCardCount:       3
taskCardNames:       [初次整理, 出门大作战, 洗衣幽灵]
hasBreakfast:        false
hasNightPatrol:      false
hasFive (五关/五段):  false
progressDenominator: 3
```

Snapshot 进一步验证：
- 标题：`三个递进关卡`
- 副标题：`从基础教学到进阶挑战，一步步锻炼记忆能力~`
- 三张卡片的能力说明 heading：
  - `基础教学 · 保存与使用记忆`
  - `核心挑战 · 识别并更新过期记忆`
  - `进阶挑战 · 有限记忆与多目标管理`
- 按钮状态：1 张"开始挑战" + 2 张"完成前一关解锁"（顺序解锁，没有第四、第五个锁卡）

### 8.3 三关进入性

- 第一关卡片按钮可点击 → URL 变更为 `/play/task-clean-table` ✓
- 进入后加载到任务 briefing 界面：heading "初次整理"、操作提示列表、"开始任务"按钮正常显示，无白屏 / 无 404 ✓

### 8.4 第四/第五关 UI 可达性

- 首页、任务列表页、结果页均未渲染 task-breakfast 或 task-night-patrol 的入口点
- 需在浏览器地址栏手敲 URL 才能访问（生产环境会被上述守卫 redirect 回 /tasks）
- 普通 UI 路径不可达 ✓

## 9. 最终 git diff --stat

```
 src/data/tasks/index.ts       | 26 ++++++++++++++++++++++
 src/pages/ArenaPage.tsx       |  8 ++++++-
 src/pages/HomePage.tsx        | 16 +++++++++-----
 src/pages/ProbePage.tsx       |  6 +++++-
 src/pages/ResultPage.tsx      | 36 +++++++++++++++++++++++++++++--
 src/pages/SessionDataPage.tsx |  9 ++++++--
 src/pages/TaskSelectPage.tsx  | 50 +++++++++++++++++++++++++++----------------
 src/store/slices/taskSlice.ts |  9 ++++----
 8 files changed, 125 insertions(+), 35 deletions(-)
```

新增未跟踪文件：
```
src/data/tasks/publicLevelScope.test.ts  (+60 lines, 15 tests)
```

## 10. 最终 git status

```
On branch semifinal/three-level-rescue
Changes not staged for commit:
  (use "git add <file>..." to update what will be contributed)
  (use "git restore <file>..." to discard changes in working directory)
        modified:   src/data/tasks/index.ts
        modified:   src/pages/ArenaPage.tsx
        modified:   src/pages/HomePage.tsx
        modified:   src/pages/ProbePage.tsx
        modified:   src/pages/ResultPage.tsx
        modified:   src/pages/SessionDataPage.tsx
        modified:   src/pages/TaskSelectPage.tsx
        modified:   src/store/slices/taskSlice.ts

Untracked files:
        src/data/tasks/publicLevelScope.test.ts

no changes added to commit (use "git add" and/or "git commit -a")
```

- 未 commit ✓
- 未 push ✓
- 未从 rescue/local-wip-20260729 merge 或 cherry-pick ✓
- 隐藏关卡源码 / 任务数据 / E2E 测试保留，未删除 ✓
