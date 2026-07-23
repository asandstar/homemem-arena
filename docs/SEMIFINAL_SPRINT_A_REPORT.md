# Semifinal Sprint A 报告（Final Correction 版）

> 日期：2026-07-23
> 状态：Finalization Gate 部分完成，阻塞于 real-browser arena-smoke 和人工生产验证
> 提交：否（未 commit，未 push）

---

## 一、最终任务真值源

**唯一真值源**：`taskTemplates` 数组，定义于 `src/data/tasks/index.ts`

```typescript
export const taskTemplates: TaskConfig[] = [
  cleanTableTask,      // 第1关：初次整理
  leaveHomeTask,       // 第2关：出门大作战
  laundrySortTask,     // 第3关：洗衣幽灵
  breakfastTask,       // 第4关：早餐时间循环
  nightPatrolTask,     // 第5关：深夜巡逻
]
```

页面展示数量来自 `taskTemplates.length`，无第二真值源。

---

## 二、五关统一顺序

| 顺序 | 任务 ID | 名称 | 角色 | 预计时长 |
|:---:|:---:|:---|:---:|:---:|
| 1 | `task-clean-table` | 初次整理 | 📖 教学关 | 2 分钟 |
| 2 | `task-leave-home` | 出门大作战 | ⭐ 复赛核心展示关 | 4 分钟 |
| 3 | `task-laundry-sort` | 洗衣幽灵 | 🎯 后续挑战 | 5 分钟 |
| 4 | `task-breakfast` | 早餐时间循环 | 🎯 后续挑战 | 5 分钟 |
| 5 | `task-night-patrol` | 深夜巡逻 | 🎯 后续挑战 | 6 分钟 |

---

## 三、FirstPersonControls 生产改动审查

### 3.1 最终采用方案：保留 `useFrame`

**决策**：生产代码继续使用 React Three Fiber 的 `useFrame`，未替换为 `requestAnimationFrame`。

### 3.2 渲染循环审查结论

| 问题 | 结论 |
|------|------|
| 1. Canvas 是否还存在 R3F 自己的渲染循环 | ✅ 存在。Canvas 无 `frameloop` prop，默认 `"always"`，由 R3F 内部单一驱动。 |
| 2. 新增 requestAnimationFrame 是否形成第二套循环 | ✅ 不存在。生产代码未引入任何 `requestAnimationFrame`。 |
| 3a. 移动速度与渲染帧率不一致 | ✅ 无风险。移动在 useFrame 内，delta 由 R3F 提供，与帧率解耦。 |
| 3b. 组件卸载后循环残留 | ✅ 无风险。useFrame 由 R3F 随组件卸载自动清理。 |
| 3c. StrictMode 重复循环 | ✅ 无风险。R3F 内部保证单例，仅状态 ref 可能短暂 double-run。 |
| 3d. 相机与场景不同步 | ✅ 无风险。useFrame 在 R3F 渲染管线内，场景/相机一起更新。 |
| 3e. CPU 占用增加 | ✅ 无风险。未引入额外循环，useFrame 随 R3F 帧率运行。 |
| 4. 改动是生产修复还是 headless 专用 | **生产防御性修复**（见 3.3）。 |

### 3.3 唯一的生产改动：键盘事件中防御性读取实时 phase

文件：`src/components/arena3d/FirstPersonControls.tsx`

```typescript
// 原实现：从 useEffect 闭包读取 phase，若 React 重排顺序变化，可能读到过期值
// if (phase !== 'playing') return

// 现实现：防御性地从 Zustand store 直接读取当前实时 phase
const currentPhase = useGameStore.getState().phase
if (currentPhase !== 'playing') return
```

**性质**：防御性状态读取修复。

**证据标准**：本 Sprint 未能在真实浏览器中复现 phase=playing 期间键盘被过滤的稳定 bug；`getState()` 是 Zustand 官方推荐的避免过期闭包写法，即使未触发 bug 也不会有负面影响，因此作为防御性修复保留。不得称为"已确认生产 bug"。

### 3.4 E2E 环境改动（不影响生产）

| 文件 | 改动 | 条件生效范围 |
|------|------|------------|
| `playwright.config.ts` | `--use-angle=metal` 仅 `process.platform === 'darwin'`（macOS）启用；Linux 不加 | E2E launch 参数，只影响 Playwright Chromium 启动 |
| `playwright.config.ts` | 拆分 `chromium`（headless，grepInvert @real-browser）与 `real-browser`（headed，grep @real-browser）双项目 | CI 默认只跑 `chromium` |
| `src/components/arena3d/Scene3D.tsx` | 禁用 PixelationPass 条件：`!(MODE === 'e2e' \|\| VITE_E2E === 'true')` | 只在 `npm run dev:e2e` 生效；`npm run dev`（MODE=development）正常启用 PixelationPass |

**CSS filter: pixelate(4px) 结论（已验证无效）**：
- 通过 `CSSStyleDeclaration.filter = 'pixelate(4px)'` 赋值，Chromium 直接丢弃，computed 返回 `"none"`
- 代码中已移除 `filter: 'pixelate(4px)'` inline style
- 真实生产像素化视觉效果由 `<PixelationPass pixelSize={4} />` WebGL 后处理单独承担
- E2E 环境禁用 PixelationPass 后无像素化替代效果；这不影响游戏逻辑，也不在本轮重做像素渲染

### 3.5 E2E MODE 判定统一（MODE === 'e2e' 优先 + VITE_E2E 兼容）

新增导出 `IS_E2E_MODE` 常量（`src/utils/e2eTestApi.ts`）：
```typescript
export const IS_E2E_MODE =
  import.meta.env.DEV &&
  (import.meta.env.MODE === 'e2e' || import.meta.env.VITE_E2E === 'true')
```

统一应用点：
- `installE2eTestApi()` 使用 `IS_E2E_MODE`
- `Scene3D.tsx` PixelationPass 条件：`!(MODE === 'e2e' || VITE_E2E === 'true')`
- `.env.e2e` 保留 `VITE_E2E=true` 作为兼容 fallback（dev:e2e 脚本使用 `--mode e2e`，MODE 才是主判据）

---

## 四、调试代码清理结果

### 4.1 已删除（本轮 Sprint A Final Correction 新增清理）

| 项目 | 位置 | 状态 |
|------|------|------|
| `tests/e2e/diag-smoke.spec.ts` | 临时诊断 | 已删除 |
| `tests/e2e/probe-keyboard.spec.ts` | 临时诊断（前会话遗留） | 已删除 |
| `tests/e2e/verify-pixelate-filter.spec.ts` | 本轮临时验证 | 已删除 |
| `scripts/repro-pixelate-style.mjs` | 临时诊断脚本 | 已删除 |
| `scripts/check-console.mjs` | 临时诊断脚本 | 已删除 |
| `scripts/dom-deep-dive.mjs` | 临时诊断脚本 | 已删除 |
| `scripts/verify-pixelate.mjs` | 临时诊断脚本 | 已删除 |
| `QA_REPORT.md` | 自动生成报告 | 已删除 + 加入 .gitignore |
| `__moveState` / `__moveDirection` / `__cameraDirection` / `__cameraRotation` / `__frameCount` / `__fpc` / `__debugFpc` / `TEMP DEBUG` | 生产代码调试字段 | 已无残留（grep 验证） |

### 4.2 已确认保留（非本轮调试代码）

| 项目 | 位置 | 来源 |
|------|------|------|
| `console.log('SFX: creating chaos ambient')` | `src/audio/sfx.ts:448` | commit `5688c6d`（2026-07-13，Sprint A 前） |
| `console.log('Audio state changed...')` × 2 处 | `tests/e2e/helpers.ts:176,184` | commit `5688c6d`（2026-07-13，Sprint A 前） |

### 4.3 Test API 保护

`src/utils/e2eTestApi.ts` 仅保留只读诊断 + command-backed 方法，受 `IS_E2E_MODE`（DEV + MODE==='e2e'）双重保护。

---

## 五、C 类文件与 Sprint D 拆分

### 5.1 已从当前工作区回退到 HEAD（即移出 Sprint A 范围）

| 文件 | 保存位置 | 说明 |
|------|---------|------|
| `src/data/tasks/clean-table.ts` | `/tmp/sprint-d/sprint-d-tutorial-changes.patch` | 144 行 patch，包含：description 加"注意：猫会捣乱"、新增 3 个 scripted event（se-cat-warning / se-cat-moves-fork / se-cat-moves-tissue，其中 2 个 move-entity + markMemoryOutdated）、原 hint 事件的 step 触发点 6/8/10/12 → 12/14/16/18 |
| `src/dialog/dialogs.ts` | 同上 patch | 包含：dtut-2/dtut-3 文案重写（杯子+餐巾纸+叉子）、新增 dtut-4 节点（记忆槽说明）、新增 ds-tutorial-goal-fork 对话序列、hint 文案更新 |

**已恢复到 HEAD**：当前工作区 `clean-table.ts` 与 `dialogs.ts` 相对 HEAD 无 diff（`git diff HEAD -- src/data/tasks/clean-table.ts src/dialog/dialogs.ts` 输出为空）。

### 5.2 视觉修复独立文件（与玩法解耦，可单独提交）

| 文件 | 说明 | 改产品行为？ |
|------|------|-------------|
| `src/components/arena3d/Object3D.tsx` | 新增 fork 标签 | 否（仅 hover 标签文字） |
| `src/components/arena3d/ObjectGeometries.tsx` | SpoonModel / ForkModel / TissueModel 几何体 | 否（仅视觉） |
| `src/components/arena3d/modelIds.ts` | spoon→spoon（不再 cup）、新增 fork→fork、tissue→tissue（不再 trash） | 否（仅视觉，原映射就存在错误：spoon 显示为杯子、tissue 显示为垃圾桶） |
| `src/components/arena3d/models/FallbackModels.tsx` | SpoonFallback / ForkFallback / TissueFallback | 否（仅视觉） |
| `src/components/arena3d/models/ModelRegistry.ts` | spoon / fork / tissue 注册，仅 fallback | 否（仅视觉） |

**关键事实**：`obj-fork`（category='fork'）、`obj-tissue`（category='tissue'）、`obj-spoon`（category='spoon'）在 Sprint A HEAD 中都已经存在，只是 modelIds 映射缺失或错误。这是 HEAD 中已有的视觉 bug，不依赖 clean-table.ts 玩法变化。

---

## 六、自动产物排除

| 项目 | 处理 |
|------|------|
| `qa-artifacts/e2e/*.png`（6 个） | 仓库明确要求提交（MANUAL_GOLDEN_PATH.md 注释 + `Stabilization Sprint 1A+1B` 即已纳入基线）。本轮未修改，已 `git checkout HEAD` 回退。`.gitignore` 仅忽略未来运行生成的覆盖写入，不影响已基线文件。 |
| `QA_REPORT.md` | 自动生成，已删除 + 加入 `.gitignore`。 |
| `docs/SEMIFINAL_SPRINT_A_REPORT.md` | 人工报告，保留为未跟踪新文件。 |
| `docs/SEMIFINAL_VERTICAL_SLICE_PLAN.md` | 人工文档，保留为未跟踪新文件。 |
| `src/data/tasks/taskConsistency.test.ts` | 新增一致性测试源码，属于 Sprint A，保留。 |

---

## 七、人工生产验证清单（剩余 10 项，需用户亲自在真实浏览器完成）

运行命令：`npm run dev`（**不得使用 E2E mode**）。

| 编号 | 验证项 | 操作方法 | 预期结果 | 状态 |
|:---:|--------|---------|---------|:---:|
| 1 | 教学关连续进入 3 次 | 完成/返回任务页 → 重新进入 ×3 | 每次正常进入，无残留状态/白屏 | ⬜ 待验证 |
| 2 | WASD 每次都能移动 | 按下 W / A / S / D | 机器人位置实际发生变化 | ⬜ 待验证 |
| 3 | 鼠标视角正常 | 拖动/移动鼠标 | 视角跟随转动，无跳跃/漂移 | ⬜ 待验证 |
| 4 | V 切换视角正常 | 按 V | 第一人称 ↔ 俯视切换 | ⬜ 待验证 |
| 5 | 长按 W 10 秒速度稳定 | 按住 W 10s | 匀速前进，无突然加速/卡住 | ⬜ 待验证 |
| 6 | 松开 W 后停止正常 | 释放 W | 立即停止，无滑行过远 | ⬜ 待验证 |
| 7 | 切换标签页再回来 | 切其他页 → 5 秒 → 切回 | 移动循环恢复，不重复不卡死 | ⬜ 待验证 |
| 8 | 返回任务页再进入 | 点「返回任务」→ 重新进入 | 无循环叠加/重复注册监听警告 | ⬜ 待验证 |
| 9 | 连续玩 5 分钟，CPU/风扇 | 持续游玩 5 分钟 | 无明显 CPU 飙升/风扇狂转 | ⬜ 待验证 |
| 10 | 控制台无重复 error/warning | 打开 DevTools Console | 除 React DevTools/HydrateFallback 提示外无重复 error | ⬜ 待验证 |

---

## 八、最终自动门禁结果

### 8.1 单元测试

```
Test Files  13 passed (13)
Tests       301 passed (301)
Duration    1.54s
```

✅ **通过**：0 failed

### 8.2 Lint

```
Found 0 warnings and 0 errors.
Finished in 7ms on 139 files
```

✅ **通过**：0 warning / 0 error

### 8.3 Build

```
✓ built in 367ms
（chunk size 警告非 Sprint A 引入）
```

✅ **通过**

### 8.4 QA（含 qa:static、qa:assets、qa:rooms、qa:tasks、build）

```
0 Blocker / 0 Critical / 0 Major / 0 Minor
```

✅ **通过**

### 8.5 E2E — headless `chromium` 项目（不包含 @real-browser）

**单次**：
```
5 passed (29.7s)
```

**`--repeat-each=3`**：
```
15 passed (1.4m)
```

✅ **全部通过**：包括 navigation-audio × 2、first-level-command-flow × 1 × 3（3 次全通）、其他基础 × 2 × 3

### 8.6 E2E — `real-browser` 项目（headed，可选人工发布验证，不作为 headless CI 门禁）

`arena-smoke.spec.ts` 标记 `@real-browser`：
- 通过 `test.describe('Arena 真实浏览器 Smoke @real-browser', …)` 挂接
- 含代码注释：不得删除测试，不得把 headless 失败写成通过
- 仍在工作区保留；可通过 `npm run e2e -- --project=real-browser` 或 `npm run e2e:headed` 运行，用于发布前人工本地确认

### 8.7 `git diff --check`

```
（空输出，无 whitespace 问题）
```

✅ **通过**

### 8.8 门禁总结

| 门禁 | 状态 | 说明 |
|------|------|------|
| `npm test` | ✅ 通过 | 301/301 |
| `npm run lint` | ✅ 通过 | 0/0 |
| `npm run build` | ✅ 通过 |  |
| `npm run qa` | ✅ 通过 | 0 Blocker / 0 Critical / 0 Major / 0 Minor |
| `npm run e2e -- --project=chromium` | ✅ 通过 | 5/5，first-level-command-flow 3×重复全绿 |
| `npm run e2e -- --project=chromium --repeat-each=3` | ✅ 通过 | 15/15 |
| `arena-smoke @real-browser` | ⚠️ 未纳入 headless CI 门禁 | 仅 headed / 人工发布前运行（未通过不得视为 E2E 全绿，但作为 CI 门禁允许"chromium 项目全绿"即可） |
| `git diff --check` | ✅ 通过 | 无 whitespace |

---

## 九、最终 git diff / 修改范围

### 9.1 `git diff HEAD --stat`

```
 .env.e2e                                         |   2 +
 .github/workflows/deploy.yml                     |  11 ++--
 .gitignore                                       |   6 +-
 README.md                                        |  17 +++---
 playwright.config.ts                             |  42 +++++++++++++-
 scripts/qa-assets.ts                             |   7 ++-
 scripts/qa-models.ts                             |   2 -
 src/components/arena3d/FirstPersonControls.tsx   |   3 +-
 src/components/arena3d/Object3D.tsx              |   1 +
 src/components/arena3d/ObjectGeometries.tsx      |  48 +++++++++++++++
 src/components/arena3d/Scene3D.tsx               |   7 ++-
 src/components/arena3d/modelIds.ts               |   5 +-
 src/components/arena3d/models/FallbackModels.tsx |  69 ++++++++++++++++++++++
 src/components/arena3d/models/ModelRegistry.ts   |  42 ++++++++++++++
 src/components/tasks/TaskCard.tsx                |   3 +-
 src/data/tasks/index.ts                          |  45 ++++++++++++++
 src/dialog/useDialog.ts                          |   2 +-
 src/game/flow.test.ts                            |   2 +-
 src/main.tsx                                     |   2 +-
 src/pages/HomePage.tsx                           |  27 ++++-----
 src/pages/TaskSelectPage.tsx                     |   2 +-
 src/store/useGameStore.test.ts                   |  19 +++---
 src/utils/e2eTestApi.ts                          |  15 +++--
 src/utils/e2eTestApi.types.ts                    |   4 +-
 tests/e2e/arena-smoke.spec.ts                    |  56 ++++++++++++------
 tests/e2e/first-level-command-flow.spec.ts       |  71 +++++++++++++++++++++--
 tests/e2e/helpers.ts                             |   6 +-
 33 files changed, 429 insertions(+), 87 deletions(-)
```

### 9.2 未跟踪新文件（报告/测试/计划文档，提交时纳入相应 commit）

```
docs/SEMIFINAL_SPRINT_A_REPORT.md        ← 本报告
docs/SEMIFINAL_VERTICAL_SLICE_PLAN.md   ← Sprint B 规划（独立文档，可单独 commit 也可放本仓）
src/data/tasks/taskConsistency.test.ts  ← 一致性测试（10 个用例）
```

### 9.3 已备份到工作区外（不在本仓 diff 中）

```
/tmp/sprint-d/sprint-d-tutorial-changes.patch
```

恢复命令（若 Sprint D 需要重放）：
```bash
git apply /tmp/sprint-d/sprint-d-tutorial-changes.patch
```

---

## 十、建议提交结构（4 commits，不实际提交）

以下为 staged 方案，等待用户确认。

### Commit 1: feat: unify semifinal task presentation

**范围**：统一真值源、首页/任务页派生展示、README、CI 门禁、一致性测试、任务卡片 testid

```
.github/workflows/deploy.yml
README.md
src/components/tasks/TaskCard.tsx
src/data/tasks/index.ts
src/data/tasks/taskConsistency.test.ts
src/pages/HomePage.tsx
src/pages/TaskSelectPage.tsx
```

**变更点**：
- `taskTemplates/taskPresentationById` 双向覆盖，新增 `tutorialTaskId / coreTaskId`
- HomePage 从硬编码 4 关改为 `taskTemplates.length` 派生
- 任务页文案统一为「五段记忆挑战」
- deploy.yml 加 lint/test/qa 门禁
- 新增 `taskConsistency.test.ts`（10 个一致性用例）
- TaskCard 增加 `data-testid="task-start-${task.id}"`

### Commit 2: fix(input): read live phase in keyboard controls

**范围**：防御性 phase 状态读取、E2E MODE 判定统一、E2E 环境条件化、lint/test 恢复基线所需修复

```
.env.e2e
.gitignore
playwright.config.ts
scripts/qa-assets.ts
scripts/qa-models.ts
src/components/arena3d/FirstPersonControls.tsx
src/components/arena3d/Scene3D.tsx
src/dialog/useDialog.ts
src/game/flow.test.ts
src/main.tsx
src/store/useGameStore.test.ts
src/utils/e2eTestApi.ts
src/utils/e2eTestApi.types.ts
tests/e2e/arena-smoke.spec.ts
tests/e2e/first-level-command-flow.spec.ts
tests/e2e/helpers.ts
```

**变更点**：
- `FirstPersonControls.handleKeyDown`：`getState().phase` 防御性读取实时 phase（未声称已稳定复现 bug）
- 新增 `IS_E2E_MODE = DEV && (MODE==='e2e' || VITE_E2E==='true')`，统一用于 Test API 安装与 PixelationPass 条件
- Scene3D 删除无效 `filter: pixelate(4px)`，更新注释说明"CSS pixelate 在 Chromium 不生效"
- playwright.config.ts：`--use-angle=metal` 仅 darwin；拆分 chromium / real-browser 双项目；arena-smoke 标 `@real-browser` 仅 headed 运行；其余测试进入 headless CI
- qa-assets：fallback 模型路径格式检查（`assetAvailable:false` 不再报错）
- qa-models / useDialog：lint 原 3 warnings 清理
- useGameStore.test.ts / flow.test.ts：原 5 + 1 硬编码失败修复（动态取 timeLimit / 实体数 / 正确容器 ID）
- arena-smoke 标 `@real-browser`，写明 headless 下 Context Lost 导致的已知限制
- first-level-command-flow：第一关默认解锁用 clean-table、正确按钮定位、进度解锁后针对 task-leave-home 的完整通关流程
- helpers：`navigateToFirstLevelAndStart` 使用新 testid；`getTestApi` 错误文案更新为 MODE/VITE_E2E 双提示

### Commit 3: feat(models): add tableware fallback models

**范围**：spoon / fork / tissue 视觉修复（可单独提交也可并入 Commit 2）

```
src/components/arena3d/Object3D.tsx
src/components/arena3d/ObjectGeometries.tsx
src/components/arena3d/modelIds.ts
src/components/arena3d/models/FallbackModels.tsx
src/components/arena3d/models/ModelRegistry.ts
```

**变更点**：
- 新增 SpoonModel / ForkModel / TissueModel 几何体与 PixelMaterial 风格 Fallback
- modelIds：spoon→spoon（原 cup 错映射）、fork→fork（新增）、tissue→tissue（原 trash 错映射）
- ModelRegistry：spoon / fork / tissue 注册（`assetAvailable: false`，仅走 Fallback）

### Commit 4（Sprint D 重放）: tutorial: cat events + dialogue extension

**不在 Sprint A 提交**，由 patch 保存在：`/tmp/sprint-d/sprint-d-tutorial-changes.patch`。文件：
```
src/data/tasks/clean-table.ts
src/dialog/dialogs.ts
```

**变更点**：cat 移动物体事件、记忆过期标记、提示 step 重排、对话文案与新增 dtut-4/ds-tutorial-goal-fork。

---

## 十一、剩余阻塞与结论

### 11.1 剩余阻塞

| 阻塞项 | 原因 | 解除方式 |
|--------|------|---------|
| E2E real-browser arena-smoke | 依赖完整 WebGL + 键盘焦点，headless 有已知 Context Lost→移动 NaN 的 Chromium 限制 | 本地 `npm run e2e:headed -- --project=real-browser` 人工确认通过，或发布检查前以 `--headed` 运行 |
| 人工生产验证 10 项 | 物理反馈（速度感/手感/风扇/手感）AI 子代理无法完整验证 | 用户在 `npm run dev` 按第七节清单核对 |

### 11.2 当前自动门禁判定

```
✅ npm test        301/301
✅ npm run lint    0/0
✅ npm run build
✅ npm run qa      0 Blocker / 0 Critical / 0 Major / 0 Minor
✅ npm run e2e -- --project=chromium              5/5
✅ npm run e2e -- --project=chromium --repeat-each=3  15/15
✅ git diff --check
⚠️  real-browser arena-smoke      @real-browser（不作为 headless CI 门禁）
⬜  人工验证 10 项                 待用户完成
```

**是否允许进入 Sprint B？**
> **⚠️ 暂不允许**。需用户完成第七节人工生产验证 10 项，并确认 `@real-browser` arena-smoke 运行策略（是 headed 跑通还是降级为纯人工 Gold Path 清单项）。解除后上述 4 个 commit 方案即可提交。

---

## 附录：一致性测试清单

| 测试项 | 状态 |
|--------|------|
| taskTemplates 中 task id 唯一 | ✅ 通过 |
| taskPresentationById 覆盖所有 taskTemplates | ✅ 通过 |
| taskPresentationById 不包含不存在的 task id | ✅ 通过 |
| tutorialTaskId 存在且为 `task-clean-table` | ✅ 通过 |
| coreTaskId 存在且为 `task-leave-home` | ✅ 通过 |
| 关卡总数为 `taskTemplates.length` | ✅ 通过 |
| 每个任务都有有效的 presentation 配置 | ✅ 通过 |
| 只有一个教学关 | ✅ 通过 |
| 只有一个核心展示关 | ✅ 通过 |
| 复赛产品顺序正确（clean-table → leave-home → laundry-sort → breakfast → night-patrol） | ✅ 通过 |
