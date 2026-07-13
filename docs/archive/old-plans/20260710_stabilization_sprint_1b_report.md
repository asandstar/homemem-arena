# Stabilization Sprint 1B 报告

> 日期：2026-07-12
> 目标：建立第一关浏览器 Smoke、Command-backed 集成流程、导航与音频生命周期 E2E，并保存 UI 截图基线。
> 约束：不修改玩法数值、不新增剧情、不新增模型、不重构 Scene Graph、不提交、不推送。

---

## 1. 修改文件清单

### Sprint 1B 新增文件（12 个）

| 文件 | 说明 |
|------|------|
| `.env.e2e` | E2E 环境变量（`VITE_E2E=true`） |
| `playwright.config.ts` | Playwright 配置 |
| `src/utils/e2eTestApi.types.ts` | Test API 类型声明 |
| `src/utils/e2eTestApi.ts` | Test API 实现（只读 + Command-backed） |
| `tests/e2e/helpers.ts` | E2E 测试辅助函数 |
| `tests/e2e/arena-smoke.spec.ts` | 真实浏览器 Smoke 测试 |
| `tests/e2e/first-level-command-flow.spec.ts` | Command-backed 第一关流程测试 |
| `tests/e2e/navigation-audio.spec.ts` | 导航与音频生命周期测试 |
| `qa-artifacts/e2e/home.png` | 首页截图 |
| `qa-artifacts/e2e/task-select.png` | 任务选择页截图 |
| `qa-artifacts/e2e/level-1-briefing.png` | 第一关 Briefing 截图 |
| `qa-artifacts/e2e/level-1-hud-1280x720.png` | 第一关 HUD（1280×720） |
| `qa-artifacts/e2e/level-1-hud-1440x900.png` | 第一关 HUD（1440×900） |
| `qa-artifacts/e2e/level-1-result.png` | 第一关结果页截图 |
| `qa-artifacts/e2e/MANUAL_GOLDEN_PATH.md` | 人工 Golden Path 清单 |

### Sprint 1B 修改文件（8 个）

| 文件 | 修改内容 |
|------|---------|
| `package.json` | 新增 `@playwright/test` 依赖；新增 `dev:e2e`、`e2e`、`e2e:headed`、`e2e:debug` 脚本 |
| `package-lock.json` | 依赖锁文件更新 |
| `vite.config.ts` | 新增 E2E 模式条件 base URL（`mode === 'e2e' ? '/' : '/homemem-arena/'`） |
| `src/main.tsx` | 安装 E2E Test API（仅 `DEV && VITE_E2E === 'true'`） |
| `src/pages/ArenaPage.tsx` | 新增 `briefingOpen` 守卫防止 DialogBox 拦截 briefing 按钮；新增 data-testid |
| `src/pages/HomePage.tsx` | 新增 `home-primary-cta` data-testid |
| `src/pages/TaskSelectPage.tsx` | 新增 `task-card-task-leave-home` data-testid |
| `src/pages/ProbePage.tsx` | 新增 `probe-page` data-testid |
| `src/pages/ResultPage.tsx` | 新增 `result-page`、`replay-button` data-testid |
| `src/components/arena3d/HUD.tsx` | 新增 `arena-hud`、`memory-slots`、`chaos-meter`、`minimap`、`task-panel`、`view-mode-indicator` data-testid |
| `README.md` | 测试徽章更新为 291 |
| `HOMEMEM_ARENA_DESIGN.md` | 移除精确测试数量，改为引用 QA_REPORT.md 和 npm test 输出 |

### Sprint 1A 已存在的修改（非 1B 新增）

以下文件的修改属于 Sprint 1A 范围，1B 期间未做改动：

| 文件 | 1A 修改内容 |
|------|------------|
| `src/data/tasks/breakfast.ts` | 修复 Probe 答案与 scripted event 类型不匹配 |
| `src/data/tasks/clean-table.ts` | 剧情文案调整 |
| `src/data/tasks/laundry-sort.ts` | 剧情文案调整 |
| `src/data/tasks/leave-home.ts` | 剧情文案调整 |
| `src/audio/sfx.ts` | 新增 `stopAllSfx`、`hasActiveRoomAmbient`、`getActiveContinuousSfxCount` |
| `src/components/arena3d/HUD.tsx` | 音频 useEffect cleanup 修复 |
| `src/components/arena3d/Door3D.tsx` | 1A 期间修改 |
| `src/components/arena3d/FirstPersonControls.tsx` | 1A 期间修改 |
| `src/components/arena3d/HUD.tsx.bak` | 已删除（1A 清理） |
| `src/components/help/WelcomeModal.tsx` | 已删除（1A 清理） |
| `src/store/useGameStore.ts.backup` | 已删除（1A 清理） |

---

## 2. Playwright 配置

配置文件：`playwright.config.ts`

| 项 | 值 |
|----|----|
| testDir | `./tests/e2e` |
| 浏览器 | Chromium 仅运行 |
| baseURL | `http://127.0.0.1:4173` |
| webServer command | `npm run dev:e2e -- --host 127.0.0.1 --port 4173` |
| 测试超时 | 60s |
| expect 超时 | 10s |
| action 超时 | 10s |
| trace | `retain-on-failure` |
| screenshot | `only-on-failure` |
| video | `retain-on-failure` |
| retries | CI=1，本地=0 |
| workers | 1（串行执行） |

E2E 模式使用独立 Vite base URL（`/`），避免 GitHub Pages 子路径影响路由测试。

---

## 3. 真实浏览器 Smoke 覆盖项

测试文件：`tests/e2e/arena-smoke.spec.ts`

覆盖内容：

1. ✅ 首页正常加载
2. ✅ 全程收集 `pageerror`、`console.error`、`failed request`
3. ✅ 点击首页主入口进入任务选择
4. ✅ 点击第一关卡片进入 `/play/task-leave-home`
5. ✅ Briefing 模态可见
6. ✅ Briefing 期间 phase 为 `briefing`，`elapsedMs` 不增长，`chaosValue` 不增长
7. ✅ 点击开始任务
8. ✅ HUD、记忆槽、混乱值、小地图、任务面板可见
9. ✅ 点击 Canvas 获得焦点
10. ✅ **真实键盘 W 输入**：验证 `robotPosition` 发生变化
11. ✅ **真实键盘 V 输入**：验证 `viewMode` 发生变化
12. ✅ 按 Tab、R、H，验证对应面板响应且无报错
13. ✅ 返回任务选择页
14. ✅ 最终断言：无 `pageerror`、无 `console.error`、无意外 `failed request`

**关键验证点**：WASD 和 V 使用真实浏览器键盘输入，不使用 Test API 替代。

---

## 4. Command-backed 流程覆盖项

测试文件：`tests/e2e/first-level-command-flow.spec.ts`

> **声明**：本测试是 **Command-backed 浏览器集成测试**，验证 command→store→UI 流程。
> 它不等于真实空间寻路、门洞和碰撞 E2E。

覆盖内容：

1. ✅ 从首页进入第一关，点击开始任务
2. ✅ `saveMemoryByConfigId('obj-key')` 保存钥匙记忆
3. ✅ 验证记忆槽中存在钥匙记录
4. ✅ 通过合法 command 交互触发猫事件（不直接 advanceStep）
5. ✅ 验证：钥匙位置变化、对应记忆变为 outdated、事件只触发一次
6. ✅ `toggleContainer` 打开床头柜
7. ✅ `pickByConfigId` 拾取手机、钥匙、雨伞
8. ✅ `placeIntoContainer` 将三件物品分别放入玄关托盘
9. ✅ 验证 phase 进入 `probing`，页面跳转到 Probe
10. ✅ 通过真实 UI 点击完成 Probe
11. ✅ 进入 Result 页，验证结果页、评级区域、重玩按钮
12. ✅ 点击重新游玩
13. ✅ 验证重新进入正确第一关，状态初始化

---

## 5. 导航与音频覆盖项

测试文件：`tests/e2e/navigation-audio.spec.ts`

覆盖内容：

1. ✅ 进入第一关并开始游戏
2. ✅ 验证 BGM 或环境音进入活动状态
3. ✅ 点击返回任务列表
4. ✅ 等待 cleanup 完成
5. ✅ 验证：`isBgmPlaying()` 为 false，`hasActiveRoomAmbient()` 为 false，`getActiveContinuousSfxCount()` 为 0
6. ✅ 再次进入第一关，音频可重新启动
7. ✅ 浏览器 `goBack` 后音频停止
8. ✅ 访问无效 taskId 跳回 `/tasks`
9. ✅ 游戏中产生状态后返回再进入：`stepCount` 为 0，`memorySlots` 清空，`heldEntityId` 为空，`chaosValue` 为 0
10. ✅ 全程无 `console.error` 和 `pageerror`

**注意**：
- 当前没有共享 AudioContext，不测试 `isAudioSuspended`
- 本轮验证的是可听音源和定时器停止
- 不为了测试而强行统一 AudioContext
- 音频启停使用轮询等待（最多 5 秒），避免固定等待导致 flaky

---

## 6. console.error、pageerror、failed request 结果

| 测试文件 | console.error | pageerror | failed request |
|---------|--------------|-----------|---------------|
| `arena-smoke.spec.ts` | 0 | 0 | 0（预期资源除外） |
| `first-level-command-flow.spec.ts` | 0 | 0 | 0 |
| `navigation-audio.spec.ts` | 0 | 0 | 0 |

三项测试均通过错误收集器断言，无任何未预期的错误。

---

## 7. 截图路径

截图目录：`qa-artifacts/e2e/`

| 截图 | 分辨率 | 用途 |
|------|--------|------|
| `home.png` | 默认 | 首页视觉审查 |
| `task-select.png` | 默认 | 任务选择页视觉审查 |
| `level-1-briefing.png` | 默认 | Briefing 模态视觉审查 |
| `level-1-hud-1280x720.png` | 1280×720 | HUD 布局审查（小屏） |
| `level-1-hud-1440x900.png` | 1440×900 | HUD 布局审查（大屏） |
| `level-1-result.png` | 默认 | 结果页视觉审查 |

截图用于人工审查，不做像素级断言。

**人工审查项**：
- HUD 重叠
- 小地图裁切
- 记忆槽遮挡
- 任务面板尺寸
- Toast 位置
- 返回按钮可见性

---

## 8. 人工 Golden Path 尚未验证的项目

完整清单：`qa-artifacts/e2e/MANUAL_GOLDEN_PATH.md`

### 未验证（需人工）

| 类别 | 项目 |
|------|------|
| 空间移动 | WASD 从客厅走到卧室（经过门洞） |
| 空间移动 | 门洞双向可通过 |
| 空间移动 | 不撞空气墙 |
| 空间移动 | 不穿视觉墙 |
| 空间移动 | 鼠标拖动转视角 |
| 记忆系统 | 实际靠近钥匙按 E 保存记忆 |
| 记忆系统 | 记忆 outdated 视觉/音效反馈 |
| 拾取放置 | 实际靠近物品按 F 拾取 |
| 拾取放置 | 实际打开床头柜取得手机 |
| 拾取放置 | 容器打开/关闭动画 |
| 拾取放置 | 物品放置后在托盘中可见，不悬空不嵌入 |
| 脚本事件 | 猫事件自然触发（非 command 触发） |
| 脚本事件 | 手机铃声事件自然触发 |
| 完成流程 | 连续完整通关 5 次 |

**自动 E2E 不得把上述人工项标记为已验证。**

---

## 9. 当前 Blocker / Critical / Major

来源：`QA_REPORT.md` + 本次 E2E 测试结果

| 级别 | 数量 | 说明 |
|------|------|------|
| Blocker | 0 | 无 |
| Critical | 0 | 无 |
| Major | 0 | 无 |
| Minor | 9 | 同 QA_REPORT.md，未新增 |

**Sprint 1B 期间未新增任何 Blocker / Critical / Major 问题。**

---

## 10. 是否允许进入 First-Level Fun Pass

**✅ 允许（条件满足）**

理由：
- 第一关可进入、可游玩、可完成（Command-backed 测试验证）
- 无 Blocker / Critical 问题
- 真实浏览器 Smoke 测试通过（WASD + V 有效）
- 音频生命周期正确（离开页面后停止）
- 导航正常（无效 taskId 跳转、状态重置）
- 构建与 QA 全部通过

**剩余风险**：空间寻路、门洞穿越、碰撞等 3D 物理行为未经过人工验证，可能存在视觉或交互问题。

---

## 11. 是否允许新增功能

**✅ 允许，但需谨慎**

前提条件：
1. 新增功能必须有对应的 E2E 或单元测试
2. 不得引入新的 Blocker / Critical
3. 所有验证管道必须保持全绿

建议优先方向：
- 第一关游戏性调优（紧张感、反馈、节奏）
- 第二关可玩化（非完整功能，先打通流程）
- 人工 Golden Path 验证后再考虑大规模新功能

---

## 12. Sprint 1A 遗留修改与 Sprint 1B 修改的区分

### Sprint 1A 范围（正确性和生命周期修复）
- breakfast Probe 答案修复
- 音频生命周期修复（HUD useEffect cleanup、ArenaPage 卸载 cleanup）
- lint warning 修复（3 个）
- 死文件清理（.backup、.bak、WelcomeModal）
- 文档计数漂移修正（部分）
- Door3D / FirstPersonControls 修改

### Sprint 1B 范围（浏览器测试基础设施）
- Playwright 安装与配置
- E2E 环境守卫（`VITE_E2E`）
- 受控 Test API（只读 + Command-backed）
- data-testid DOM 定位标识
- 3 个 E2E 测试文件
- 截图基线
- 人工 Golden Path 清单
- vite.config.ts E2E 模式条件 base URL
- ArenaPage briefingOpen 守卫（E2E 重入关卡时发现的问题）

### 跨 Sprint 文件
- `src/pages/ArenaPage.tsx`：1A 添加了卸载 cleanup，1B 添加了 briefingOpen 守卫和 data-testid
- `src/components/arena3d/HUD.tsx`：1A 修复了音频 useEffect cleanup，1B 添加了 data-testid
- `README.md`：1A 更新了徽章数字，1B 确认徽章为 291

---

## 13. git diff 摘要

```
24 files changed, 397 insertions(+), 2060 deletions(-)
```

主要删除来自 Sprint 1A 期间清理的死文件：
- `src/components/arena3d/HUD.tsx.bak`（441 行删除）
- `src/components/help/WelcomeModal.tsx`（90 行删除）
- `src/store/useGameStore.ts.backup`（1331 行删除）

Sprint 1B 净新增约 700 行（测试代码 + 配置 + Test API）。

---

## 通过标准核查

| 标准 | 状态 |
|------|------|
| `npm test` 全绿 | ✅ 291 passed (12 files) |
| `npm run lint` 0 warning | ✅ 0 warnings, 0 errors |
| `npm run build` 通过 | ✅ 638ms, 2415 modules |
| `npm run qa` 通过 | ✅ 62/62 passed |
| `npm run e2e` 通过 | ✅ 6/6 passed |
| 真实键盘 W 和 V 有效 | ✅ Smoke 测试验证 |
| Command-backed 第一关流程通过 | ✅ 完整流程验证 |
| 离开游戏页后持续音频停止 | ✅ 导航音频测试验证 |
| 无 console.error 和 pageerror | ✅ 三项测试均为 0 |
| 截图已生成 | ✅ 6 张截图 |
| 没有新增 Blocker 或 Critical | ✅ 0 Blocker / 0 Critical |
| 没有直接修改最终状态的测试后门 | ✅ Test API 全部走 command 层 |

**全部 12 项通过标准均已满足。**
