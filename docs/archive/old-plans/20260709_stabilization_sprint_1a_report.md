# Stabilization Sprint 1A Report

> 执行时间：2026-07-12
> 基线：Current-State Delta Audit 2026-07-12
> 范围：正确性和生命周期修复
> 约束：不新增剧情、不调整游戏数值、不修改第二/第三关玩法、不新增模型、不进行大型架构重写、不提交/推送

---

## 1. 修改文件清单

### 新增文件

| 文件 | 用途 |
|---|---|
| `src/components/AudioInitializer.tsx` | 从 main.tsx 提取的音频初始化组件，修复 only-export-components 警告 |
| `src/game/probeConsistency.test.ts` | breakfast Probe 与脚本事件一致性回归测试（4 用例） |

### 修改文件

| 文件 | 修改内容 |
|---|---|
| `src/data/tasks/breakfast.ts` | 修正 2 个 Probe 问题和答案（p-object-state-fridge + p-temporal-penalty） |
| `src/audio/sfx.ts` | 新增 `stopAllSfx()` 导出（停止混乱环境音 + 房间环境音） |
| `src/components/arena3d/HUD.tsx` | BGM 和房间环境音 useEffect 添加 cleanup return |
| `src/pages/ArenaPage.tsx` | 新增卸载时 cleanup useEffect，调用 stopBgm + stopAllSfx |
| `src/main.tsx` | 提取 AudioInitializer 到独立文件，修复 only-export-components + exhaustive-deps |
| `src/components/arena3d/FirstPersonControls.tsx` | 用 tapHandlerRef 模式替代闭包捕获，修复 exhaustive-deps |
| `README.md` | 关卡顺序统一、角色映射明确、Scene Graph 标记 experimental |
| `HOMEMEM_ARENA_DESIGN.md` | 测试数量 258→287 |

### 删除文件

| 文件 | 原因 |
|---|---|
| `src/store/useGameStore.ts.backup` | 旧单体 store 备份，1331 行死代码 |
| `src/components/arena3d/HUD.tsx.bak` | 旧 HUD 备份，441 行死代码 |
| `src/components/help/WelcomeModal.tsx` | 死代码，Grep 确认零引用（仅命中文件自身） |

---

## 2. breakfast Probe 修复方式

### 问题

| Probe ID | 原问题 | 原答案 | 对应事件 | 事件类型 | 冲突 |
|---|---|---|---|---|---|
| `p-object-state-fridge` | "早餐闹钟会对冰箱做什么？" | "自动关上冰箱门" | `se-fridge-auto-close` | `message` | 答案声称自动关门，但事件仅显示提醒 |
| `p-temporal-penalty` | "牛奶离开冰箱多久会第一次被扣分？" | "15 步" | `se-milk-deduct-points` | `message` | 问题声称扣分，但事件仅显示催促 |

### 修复

采用"改 Probe 文案匹配实际事件"方案，不新增事件逻辑：

**p-object-state-fridge**（[breakfast.ts#L426-L435](../../../src/data/tasks/breakfast.ts#L426-L435)）：
- 问题改为："🔒 早餐闹钟对冰箱门有什么反应？"
- 选项改为：`['提醒玩家记得关冰箱门', '自动关上冰箱门', '把牛奶拿出来', '把冰箱搬走']`
- 正确答案改为：`'提醒玩家记得关冰箱门'`

**p-temporal-penalty**（[breakfast.ts#L480-L489](../../../src/data/tasks/breakfast.ts#L480-L489)）：
- 问题改为："⏰ 系统在第几步第一次提醒牛奶需要归位？"
- 选项不变：`['10 步', '15 步', '20 步', '25 步']`
- 正确答案保持：`'15 步'`（事件确实在 step 15 触发）

---

## 3. 音频生命周期修复方式

### 问题

1. `HUD.tsx` 第 211-217 行 BGM useEffect 无 cleanup，页面卸载时 BGM 不停止
2. `HUD.tsx` 第 219-223 行房间环境音 useEffect 无 cleanup
3. `ArenaPage.tsx` 无卸载时音频释放逻辑
4. 浏览器后退到任务选择页后音频继续播放

### 修复

**HUD.tsx**（[HUD.tsx#L211-L229](../../../src/components/arena3d/HUD.tsx#L211-L229)）：
- BGM useEffect 添加 `return () => { stopBgm() }`
- 房间环境音 useEffect 添加 `return () => { stopRoomAmbient() }`
- import 新增 `stopRoomAmbient`

**ArenaPage.tsx**（[ArenaPage.tsx#L70-L76](../../../src/pages/ArenaPage.tsx#L70-L76)）：
- 新增空依赖 useEffect，返回 cleanup 函数
- cleanup 中调用 `stopBgm()` + `stopAllSfx()`
- import 新增 `stopAllSfx` 和 `stopBgm`

**sfx.ts**（[sfx.ts#L371-L378](../../../src/audio/sfx.ts#L371-L378)）：
- 新增 `stopAllSfx()` 导出，内部调用 `stopChaosAmbient()` + `stopRoomAmbient()`
- `stopRoomAmbient()` 已存在（第 351-369 行），无需新增

### AudioContext 统一问题：deferred

确认两个模块级 AudioContext（`sfx.ts` + `bgm.ts`）不会随路由切换累积实例：
- `sfx.ts` 第 126-130 行 `initAudio()` 有 `if (!audioContext)` 守卫
- `bgm.ts` 第 53-60 行 `initAudioContext()` 有 `if (!audioContext)` 守卫
- 两处均为懒初始化单例，不会每次进入关卡创建新实例

**结论**：无累积证据，AudioContext 统一 deferred 到后续 Sprint。

---

## 4. lint 结果

| 指标 | 修复前 | 修复后 |
|---|---|---|
| warnings | 3 | 0 |
| errors | 0 | 0 |

### 修复的 3 个 warning

1. **`src/main.tsx` react(only-export-components)**：提取 `AudioInitializer` 到独立文件 [AudioInitializer.tsx](../../../src/components/AudioInitializer.tsx)
2. **`src/main.tsx` react-hooks(exhaustive-deps)**：useEffect 依赖数组从 `[]` 改为 `[audioEnabled]`
3. **`src/components/arena3d/FirstPersonControls.tsx` react-hooks(exhaustive-deps)**：用 `tapHandlerRef` 模式替代闭包捕获，handleTap 在事件回调内用 `useGameStore.getState()` / `useToastStore.getState()` 读取最新值，useEffect 依赖保持 `[gl]`

未使用任何 `eslint-disable` / `oxlint-disable` 注释。

---

## 5. 文档同步内容

### README.md

- 第 10-12 行：角色映射明确——"家政机器人，主人昵称你为'小橡'"，"系统型号为 MEM-07"，删除"家政小精灵"非正式称呼
- 第 51-56 行：关卡顺序统一为 出门→餐桌→洗衣→早餐（与第 28-33 行叙事顺序一致）
- 第 170 行：Scene Graph 标记为 "experimental / currently unused，待后续接入或清理"

### HOMEMEM_ARENA_DESIGN.md

- 第 333 行：测试数量 258→287

---

## 6. E2E 覆盖步骤

**不适用**。Sprint 1A 不包含 E2E 测试，E2E 推迟到 Sprint 1B。

---

## 7. E2E 未覆盖步骤

**全部未覆盖**。Sprint 1A 无 E2E 基线，所有浏览器级行为（Golden Path、导航、音频停止）仍需人工验证。这是 Sprint 1B 的目标。

---

## 8. console error 结果

**不适用**。Sprint 1A 无浏览器 E2E，无法自动检查 console error。需在 Sprint 1B 中通过 Playwright 覆盖。

---

## 9. 截图路径

**不适用**。Sprint 1A 无截图基线，推迟到 Sprint 1B。

---

## 10. 当前 Blocker / Critical / Major

### Blocker

**无**。

### Critical

**无**。原 C1（breakfast Probe 答案与事件不符）已修复，且有 4 个回归测试保护。

### Major

| ID | 描述 | 状态 | 证据 |
|---|---|---|---|
| M1 | Scene Graph 384 行死代码 | deferred | 本轮标记为 experimental，不接入也不删除，待后续决策 |
| M2 | HUD 音频 useEffect 无 cleanup | **已修复** | [HUD.tsx#L211-L229](../../../src/components/arena3d/HUD.tsx#L211-L229) |
| M3 | 两个 AudioContext 永不关闭 | deferred | 确认懒初始化单例无累积，统一 Context 推迟 |

### Minor

| ID | 描述 | 状态 |
|---|---|---|
| m1 | HOMEMEM_ARENA_DESIGN.md 测试数量过时 | **已修复** |
| m2 | README lint warning 数量不符 | **已修复**（lint 现在 0 warning） |
| m3 | README 关卡顺序第二处表格错误 | **已修复** |
| m4 | WelcomeModal 死代码 | **已删除** |
| m5 | useGameStore.ts.backup 残留 | **已删除** |
| m6 | HUD.tsx.bak 残留 | **已删除** |

---

## 11. 是否允许进入第一关游戏性调优

**判定：暂不允许**。

理由：
- 第一关 Golden Path 仍无浏览器级回归保护（Sprint 1B 目标）
- 音频 cleanup 修复已合入，但无 E2E 验证浏览器后退场景
- 建议完成 Sprint 1B 的浏览器 Smoke + command-backed 流程后，再进入游戏性调优

---

## 12. 是否允许新增功能

**判定：不允许**。

理由：
- 当前无 E2E 回归保护，新增功能风险高
- project_memory 约束："Pause new gameplay feature development to prioritize building a unified QA inspection system"
- 应先完成 Sprint 1B 建立浏览器测试基础设施

---

## 13. 验证结果

| 命令 | 结果 | 时间 |
|---|---|---|
| `npm test` | 291 passed (12 files) | 2.37s |
| `npm run lint` | 0 warnings, 0 errors | 26ms |
| `npm run build` | success | 583ms |
| `npm run qa` | success | 531ms |
| `npm run e2e` | 不适用（Sprint 1B） | — |

### 测试增量

- 新增 1 个测试文件：`src/game/probeConsistency.test.ts`
- 新增 4 个测试用例
- 总测试数：287 → 291
- 总测试文件数：11 → 12

---

## 14. 通过标准检查

| 标准 | 状态 |
|---|---|
| `npm test` 全绿 | ✅ 291 passed |
| `npm run lint` 0 warning | ✅ 0 warnings, 0 errors |
| `npm run build` 通过 | ✅ success |
| `npm run qa` 通过 | ✅ success |
| `npm run e2e` 通过 | ⏸ 推迟到 Sprint 1B |
| breakfast Probe 与真实事件一致 | ✅ 有 4 个回归测试保护 |
| 离开游戏页面后音频停止 | ✅ 代码层已修复，E2E 验证推迟到 Sprint 1B |
| 第一关 Golden Path 有浏览器级回归保护 | ⏸ 推迟到 Sprint 1B |
| 无 Blocker 和 Critical | ✅ |
| 没有新增无关功能 | ✅ |

---

## 15. 后续步骤

等待用户确认 Sprint 1A diff 后，进入 Sprint 1B：
1. 安装 @playwright/test
2. 使用 VITE_E2E 环境变量
3. Test API 默认只读，可写方法调用真实 command 层
4. 测试分层：真实键鼠 Smoke + command-backed 集成流程
5. 截图保存到 qa-artifacts/e2e/
6. 运行 npm run e2e 验证
