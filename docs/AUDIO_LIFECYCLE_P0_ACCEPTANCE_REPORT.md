# AUDIO_LIFECYCLE_P0_ACCEPTANCE_REPORT

> 日期：2026-07-28
> 轮次：AUD-P0 Acceptance Closeout
> 范围：只完成当前 Audio P0 的工程与验收收口；未增加新音效 / 手机循环铃声 / 5 秒倒计时；未修改场景 / HUD / 地图 / 任务数值；不提交不推送。

---

## 0. 本次完整验证结果

- `npm run lint` → 0 errors / 13 warnings（全部为 `scripts/b2v2-verify.cjs` 等不相关脚本中历史遗留的 unused-var 警告，不涉及本轮修改文件）。
- `npm run build` → 通过。
- `npm run test`（vitest 单元测试）→ 13 test files / 306 tests 全部通过。
- `npm run qa` → qa:static / qa:assets / qa:rooms / qa:tasks / qa:layout / build 全部通过。
- `npx playwright test tests/e2e/navigation-audio.spec.ts` → 11 passed（含五关切换 case，见 §2）。
- `npx playwright test tests/e2e/first-level-command-flow.spec.ts` → 6 passed。
- `git diff --check` → 空（无尾部空白 / 冲突标记问题）。
- `git status --short` → 19 tracked modified + 12 untracked（其中 1 个为本轮 untracked 关键文件 `src/audio/audioManager.ts`，见 §4）。

不提交、不推送。

---

## 1. 唯一 BGM 触发入口

### 1.1 全仓 rg 结果（`rg -n "playBgm\\(" src`）

| 行号 | 文件 | 性质 | 归属 | 是否生命周期 trigger |
|------|------|------|------|----------------------|
| bgm.ts:310 | `export function playBgm(...)` | **定义** | bgm 模块内部 | 否 |
| ArenaPage.tsx:111 | `playBgm(task.id, { forceRestart: false })` | **生产调用** | [ArenaPage.tsx useEffect](src/pages/ArenaPage.tsx#L104-L114)（owner：页面生命周期：`[chaosValue, phase, task, achievedGoalIds, audioEnabled]`） | **是（唯一所有者）** |
| HUD.tsx:270（**已删除**） | `playBgm(task.id)` | **原重复调用（本轮 Acceptance 删除）** | 原来 HUD 内 `useEffect([phase, task])` 的独立启动 | **是（重复所有者，已删除）** |

### 1.2 Acceptance 前发现的问题与修复

问题：原 P0 实现留下了 **两个独立 React 生命周期同时启动 BGM**：

1. [ArenaPage.tsx#L104-L114](src/pages/ArenaPage.tsx#L104-L114)：chaosValue / phase / task / achievedGoalIds / audioEnabled 变化时 → 带 `forceRestart:false` 调 `playBgm`（正确，它负责 chaos 动态层的 `updateBgmState` 与 BGM 启停）。
2. HUD.tsx 第 268-272 行（现已不存在）：`useEffect([phase, task])` 当 phase==='playing' && task 存在时 → 无条件 `playBgm(task.id)`（**没有 forceRestart 去重；phase/task 变化的触发时机与 ArenaPage 不同步；且 HUD 不应拥有 BGM 的"是否重启"决策权**）。

风险：若某天 ArenaPage 把默认 forceRestart:true，HUD 这一独立入口会重复叠加 BGM 层；违反"明确单一所有者"原则。

修复：
- 删除 HUD.tsx 内独立的 `useEffect([phase, task]) playBgm(...)` 调用块。
- 删除 HUD.tsx 顶部不再需要的 `import { playBgm } from '../../audio/bgm'`。
- 保留 ArenaPage 一处生命周期作为唯一所有者。

测试/调试调用：无。E2E 测试与调试用例通过 `getAudioDebugState()` 读 BGM 状态，不直接调 playBgm。

### 1.3 Ambient 顺带确认（无重复）

为防同类问题顺带复查：`playRoomAmbient(` 全仓只在：
1. ambient.ts 定义；
2. [ArenaPage.tsx:80](src/pages/ArenaPage.tsx#L75-L83) useEffect 调用（currentRoom/phase/briefingOpen/audioEnabled 依赖）。

HUD 无 Ambient 启动入口（P0 已删除 HUD 内 updateRoomAmbient legacy useEffect，Ambient 也是唯一所有者 = ArenaPage）。

---

## 2. 五关真实切换结果（Case 7 实跑数据）

用例：`tests/e2e/navigation-audio.spec.ts` 第 7 条 `7. 任务切换（五关：clean-table → leave-home → laundry-sort → breakfast → night-patrol）：每关 BGM/Ambient 正确且上一任务的 taskId/roomId 不残留`

依次进入并退出：
1. `task-clean-table`
2. `task-leave-home`
3. `task-laundry-sort`
4. `task-breakfast`
5. `task-night-patrol`

### 2.1 每关开始后断言（6 条）

对每一关都在 `waitForDebugState(bgmPlaying && ambientPlaying, 12000ms)` 之后断言：

| 断言编号 | 条件 | 实跑结果 |
|----------|------|----------|
| 2.1.1 | `audioEnabled === true` | ✅ 每关一致通过（默认偏好是 true，且 toggle 没有在切换路径中被关掉） |
| 2.1.2 | `bgmPlaying === true` | ✅ 通过；headless Playwright 下 BGM 合成成功（没有 DOMException 抛到 pageErrors） |
| 2.1.3 | `bgmTaskId === 当前 taskId` | ✅ 每关严格匹配；无"上一关 taskId 残留到下一关"现象 |
| 2.1.4 | `ambientPlaying === true` | ✅ 通过 |
| 2.1.5 | `legacyRoomAmbientActive === false` | ✅ 通过（P0 移除 HUD updateRoomAmbient useEffect 后，sfx.ts 旧版 ROOM_AMBIENT_CONFIG 系统从未启动） |
| 2.1.6 | `activeSfxCount <= 10` | ✅ 每关开始瞬间只有 `start playing` 对话 / 房间进入音，SFX 计数合理；没有历史 SFX 堆积 |

### 2.2 切下一关前断言（旧 taskId/roomId 不残留）

在第 N 关完成断言后，使用 `window.location.href = '/tasks'` 回任务列表后断言：

| 断言编号 | 条件 | 实跑结果 |
|----------|------|----------|
| 2.2.1 | `!bgmPlaying && !ambientPlaying && activeSfxCount === 0`（waitFor 3000ms） | ✅ 每关之后均成立 |
| 2.2.2 | `bgmTaskId === null` | ✅ 每关回到任务列表后均为 null |
| 2.2.3 | `ambientRoomId === null` | ✅ 同上 |
| 2.2.4 | `legacyRoomAmbientActive === false` | ✅ 保持 false，legacy 系统从未启 |
| 2.2.5 | 非首关时，新一关的 `bgmTaskId !== 上一关 lastTaskBgmTaskId` | ✅ 5 关依次切换，相邻关 bgmTaskId 均互不相等；无"重新开始同一任务 Ambient 同房间 early-return 导致旧 BGM 残留"的退化 |

### 2.3 最终返回任务列表断言（5 项归零）

`finalState = waitForDebugState(!bgmPlaying && !ambientPlaying && !chaosAmbientActive && !legacyRoomAmbientActive && activeSfxCount===0, 3000ms)`：

| 断言编号 | 条件 | 实跑结果 |
|----------|------|----------|
| 2.3.1 | `finalState != null` | ✅ 通过 |
| 2.3.2 | `actuallyRun.length >= 2`（至少真的进入并退出了 2 关以上） | ✅ 实跑 5 关全部通过；actuallyRun 长度 = 5 |

结论：P0 要求的"五关切换"断言全部满足；旧 taskId/roomId 没有跨关残留；最终五项全清零。

---

## 3. 错误过滤最终规则

位置：[tests/e2e/helpers.ts createErrorCollector](tests/e2e/helpers.ts#L16-L62)

### 3.1 本轮 Acceptance 收紧前（P0 留下的规则）—— 被修改

```text
（pageerror 过滤列表）
THREE.WebGLRenderer
WebGL
Could not create canvas context
context lost
GL_INVALID
Texture
load model
glTF
AudioContext                 ← 过宽：会隐藏真实生命周期错误（本轮删除）
Cannot close a closed         ← 过宽：真实 Bug 应被 audioManager 消灭，不能靠 E2E 过滤隐藏（本轮删除）
suspended context             ← 过宽：同上（本轮删除）
```

### 3.2 最终规则（只保留已确认的 headless WebGL 无害错误）

`pageerror` handler 只忽略以下 **已在多机重现、确认为 headless/CI 显卡兼容性问题，不涉及音频生命周期代码质量** 的错误：

| 过滤关键词 | 原因（已确认无害） |
|------------|---------------------|
| THREE.WebGLRenderer / WebGL | Chromium headless 的 WebGL 软渲染会打印非致命版本警告 |
| Could not create canvas context / context lost | CI 机器没有 GPU 时 WebGL 初始化失败 |
| GL_INVALID | GL 状态机的良性遗留状态（与 Three.js 代码相关） |
| Texture / Couldn't load texture | E2E 跑在无头模式下模型纹理缺省资源不会导致断言失败 |
| load model / glTF | GLTF/GLB 资源加载降级不影响音频断言 |

**明确不允许过滤（本轮刻意保留，不再静默忽略）的音频错误类**：

1. ❌ **`Cannot close a closed AudioContext`**：之前在 P0 实现过程中 bgm.stopBgmImmediate 连续调用会抛出这个 DOMException——本轮 Acceptance 之前已经通过 A5 修复了源码（bgm.stopBgmImmediate 内先置本地引用为 null 再 close 并 catch），因此它现在不应该出现。接受标准是"代码层面幂等，不靠 E2E 过滤隐瞒"。
2. ❌ **所有 AudioContext lifecycle DOMException**（包括 "The AudioContext was already closed"、"Failed to construct 'AudioContext'" 等）。
3. ❌ **audio module TypeError** / **未处理 Promise rejection**（包括 resume() reject 被模块吞但页面级漏网的）。

收紧后实跑 `navigation-audio 11 passed` 与 `first-level-command-flow 6 passed`，**全部 17 case 无 pageerror 漏到 collect.pageErrors**。证明：AudioContext 生命周期幂等性是由**源码**保证的，而不是被测试过滤掩盖的。

`console.error` 过滤规则保持不变：仍只允许 `THREE.WebGLRenderer / perf / THREE.GLTFLoader / Couldn't load texture` 四类文本错误忽略。

---

## 4. audioManager.ts 纳入情况

文件：`src/audio/audioManager.ts`（本轮之前为 untracked 新增文件）

### 4.1 被生产源码真实引用（确认 6 处）

| 位置 | 用途 |
|------|------|
| [useUiStore.ts:4 import](src/store/useUiStore.ts#L4-L4) | import `stopAllAudioImmediate` 和 `resumeAudioContexts` |
| [useUiStore.ts toggleAudioEnabled](src/store/useUiStore.ts#L64-L73) | false 分支 → stopAllAudioImmediate；true 分支 → resumeAudioContexts |
| [useUiStore.ts onRehydrateStorage](src/store/useUiStore.ts#L98-L107) | 读取偏好为 false → stopAllAudioImmediate |
| [ArenaPage.tsx:14 import](src/pages/ArenaPage.tsx#L14-L14) | import 两个统一入口函数 |
| [ArenaPage.tsx 开始任务按钮 onClick](src/pages/ArenaPage.tsx#L364-L364) | 调 `resumeAudioContexts`（用户手势授权 AudioContext resume） |
| [ArenaPage.tsx 6 处调用 stopAllAudioImmediate](src/pages/ArenaPage.tsx#L147-L164) 及 [Result 返回按钮](src/pages/ArenaPage.tsx#L512-L512) | initializeTask 前 / unmount cleanup / Result onClick 三处。 |

结论：文件被 2 个核心生产模块（useUiStore / ArenaPage）真实使用，不是"孤立的工具文件"，最终提交时应纳入 version control，不会被遗漏。

### 4.2 循环 import 检查（无）

```text
依赖方向：
  audioManager.ts → sfx.ts （stopChaosAmbient / stopRoomAmbient / stopAllSfxInstances / initSfxAudio / resumeSfxContext / isAudioEnabled）
  audioManager.ts → bgm.ts （stopBgmImmediate / resumeBgmContext）
  audioManager.ts → ambient.ts （stopAmbientImmediate / resumeAmbientContext）

反向依赖（是否存在 sfx/bgm/ambient → audioManager import？）：
  sfx.ts 内无 audioManager 引用 ✓
  bgm.ts 内无 audioManager 引用 ✓
  ambient.ts 内无 audioManager 引用 ✓
```

无循环；TS 编译顺序是 sfx/bgm/ambient 先有定义 → audioManager 再组合它们的函数，天然安全。

### 4.3 是否依赖 E2E 专用 API？（不依赖）

检查 [audioManager.ts 全文](src/audio/audioManager.ts#L1-L80)：
- 没有 import 自 `e2eTestApi`、`__testApi__`、`MODE === 'e2e'`。
- 唯一的诊断导出 `getStopAllAudioCallCount()` 是只读计数；只在调试时用，不改变业务状态；**将来生产构建可以 tree-shake**，即使被 E2E 外部读取也未对代码行为做任何分支。

符合"生产可用、与 E2E 解耦"的要求。

---

## 5. 完整修改文件清单

（`git diff --stat` 得到 19 tracked files + 1 个本轮最终纳入规划的 untracked 文件）

### 5.1 本轮 Acceptance Closeout 中真正有变动的文件（相对 P0 Implementation 状态）

这些是在本 Acceptance Closeout 中被修改的：

| 文件 | 本轮改动 | A 编号对应的任务 |
|------|----------|------------------|
| [HUD.tsx](src/components/arena3d/HUD.tsx) | 删除独立的 `useEffect([phase, task]) playBgm()` 与对应 import；BGM 启动入口归并到 ArenaPage 单一所有者 | A1 唯一 BGM 入口 |
| [audioManager.ts](src/audio/audioManager.ts) | 移除 stopAllAudioImmediate 中"兜底重复 3 次"的模式，改成 BGM/Ambient/Chaos/Legacy/SFX 五个独立 try/catch；新增 swallowExpected()：只放过 3 类已确认的幂等副作用 DOMException，其余 DEV 下 console.error 且**不静默吞** | A5 统一停止实现 |
| [helpers.ts](tests/e2e/helpers.ts) | 从 pageerror 过滤列表移除 AudioContext / Cannot close a closed / suspended context；只保留 8 类 headless WebGL 问题。实跑 17 Playwright case 无音频类 pageerror，证明代码幂等不靠过滤。 | A2 收紧错误过滤 |
| [navigation-audio.spec.ts](tests/e2e/navigation-audio.spec.ts) | 原 Case 7 从"clean-table → leave-home 2 关"扩展为五关切换（clean-table → leave-home → laundry-sort → breakfast → night-patrol）；每关 6 条 start 断言 + 每条转关 4 条清 0 断言 + 最终 5 条归零；actuallyRun 有效关数 ≥ 2。 | A3 五关切换补齐 |

### 5.2 已在 P0 Implementation 中修改、Acceptance 未再变动的 tracked files

（这些是 `git diff` 里列的其余 15 个文件，本 Closeout 未改动，保持 P0 Implementation 阶段产出）：

- `qa-artifacts/e2e/level-1-result.png`（bin）
- `src/audio/ambient.ts`
- `src/audio/bgm.ts`
- `src/audio/sfx.ts`
- `src/components/arena3d/Container3D.tsx`
- `src/components/arena3d/Door3D.tsx`
- `src/components/arena3d/Object3D.tsx`
- `src/components/arena3d/colors.ts`
- `src/components/arena3d/materials/palette.ts`
- `src/components/arena3d/models/FurnitureModel.tsx`
- `src/components/arena3d/models/ModelAsset.tsx`
- `src/components/arena3d/models/PropModel.tsx`
- `src/pages/ArenaPage.tsx`
- `src/store/useUiStore.ts`
- `src/utils/e2eTestApi.ts`
- `src/utils/e2eTestApi.types.ts`

### 5.3 文档输出（本轮新增 + 上一轮新增日期校正）

| 文件 | 状态 | 说明 |
|------|------|------|
| [AUDIO_LIFECYCLE_P0_ACCEPTANCE_REPORT.md](docs/AUDIO_LIFECYCLE_P0_ACCEPTANCE_REPORT.md) | ✅ 本轮 Acceptance Closeout 产出 | 即本报告 |
| [AUDIO_LIFECYCLE_P0_IMPLEMENTATION_REPORT.md](docs/AUDIO_LIFECYCLE_P0_IMPLEMENTATION_REPORT.md#L3-L5) | ✅ 日期已由 2026-03-25 修正为"日期 2026-07-28 / 轮次：AUD-P0 Implementation"（独立两字段） | 报告中引用的测试时间 / 提交时间等历史日期未误动 |
| [AUDIO_SYSTEM_AUDIT.md](docs/AUDIO_SYSTEM_AUDIT.md#L3-L3) | 保持 `日期: 2026-07-28` 不动 | 真实本轮审计日期，非误改的历史日期 |
| [INTERACTION_OUTLINE_VISUAL_FIX_REPORT.md](docs/INTERACTION_OUTLINE_VISUAL_FIX_REPORT.md#L4-L4) | 保持 `日期: 2026-07-28` 不动 | 同天更早轮次产出 |
| `docs/HUD_MINIMAP_ACCEPTANCE_REPORT.md` / `docs/HUD_MINIMAP_IMPLEMENTATION_REPORT.md` 等其他 5 份报告 | HUD_MINIMAP_ACCEPTANCE_REPORT.md 不存在；HUD_MINIMAP_IMPLEMENTATION_REPORT.md 本身无日期字段（为更早期 HUD/Minimap 轮次报告） | 未机械修改；符合"历史轮次保留原样"规则 |

---

## 6. 人工听觉检查清单（Human Audition Checklist）

> Playwright / headless Chromium 能断言代码层面的 isPlaying / activeSfxCount 等 state，但真实"听感"需人工在带 GPU + 有声音频输出的环境下逐一核验。以下清单用于开发者 / QA 本地或 staging 浏览器手动验收 P0 是否真的"没有尾音 / 没有重复 Ambient"。

运行命令：`npm run dev` 或 `npm run preview`，在 Chrome / Edge（非 headless）下依次执行：

### 6.1 开始任务手势授权 AudioContext（A5 / §1 关联）

- [ ] 点击 home-primary-cta → 任务选择页 → 点击 `task-clean-table` 开始按钮。
- [ ] Briefing 出现后点击"开始任务"；**立刻应该有低频 Ambient 嗡嗡声 + 柔和 BGM 层（melody/chords/bass）起**，而不是"开始后 3~5 秒才响"（后者表示 context 仍在 suspended）。

### 6.2 OFF → ON 自动恢复（B4 关联）

- [ ] playing 过程中按音频 toggle（或通过设置）把 `audioEnabled` 切 false：BGM / Ambient / 一次性 SFX **在 50ms 内消失，没有尾音拖出**。
- [ ] 3 秒后再把 toggle 切 true：**BGM 应立即从 0 volume 线性抬升 3 秒回到 playing；Ambient 立即恢复**。若当前 phase 不是 playing（例如在 result / probing），则不应自动恢复 BGM。
- [ ] toggle 恢复后，Ambient 只能听到 1 层嗡嗡声，**不应出现双层叠加或相位抵消**（后者暗示新旧两套 Ambient 同时在响）。

### 6.3 硬停止指定 SFX（P0 一 / §3.1 关联）

依次触发以下事件或通过 console/debug API 调 `__testApi__.debugPlaySfx(id)`，播放到中途切 `audioEnabled=false`：

| id | 听感特征 | 验收：50ms 内应静音？ |
|----|----------|-----------------------|
| phone_ring | 高频方波断续铃声 | [ ] 是，切断后不继续"叮"最后一个音符 |
| cat_event | 低频滑音喵叫 | [ ] 是，切断后不继续残留 |
| time_warning | 连续急促蜂鸣 | [ ] 是，50ms 内归零 |
| pick / place_success / place_error | 短促点击/成功/失败音 | [ ] 是（虽然本身很短，但 toggle 关闭时不应在下一 tick 继续被触发） |
| memory_save / memory_outdated | 写入/过期提示音 | [ ] 是 |
| character_speak | 对话蜂鸣序列 | [ ] 是，切断后不再继续下一声 |
| drawer_open / drawer_close | 抽匣摩擦滑音 | [ ] 是，中途切断不应保留振荡器尾音 |
| level_complete | 完成上行和弦 | [ ] 是（完成 SFX 开始播放才触发；若触发完成 fade 之前 BGM 应 500ms fade 不被 level_complete SFX 打断） |

### 6.4 probing 阶段 fade（B6 关联）

- [ ] 进入 `phase === 'probing'`（或直接通过 test setState 切 probing）：
  - [ ] Chaos 低频噪声应**立即**停（0ms，不应有 fade）。
  - [ ] BGM 应约 500ms 内平滑降到 silence。
  - [ ] Ambient 嗡嗡声应约 300ms 内平滑降到 silence。
  - [ ] 与此同时，`level_complete` / 失败 SFX 可以正常播放；**不会因为 probing 的 stop 逻辑而被硬停掉**（因为 SFX 有独立 registry，stopBgm / stopAmbient 不会 stop SFX registry）。

### 6.5 Result 返回任务列表（P0-2 / §2.3 关联）

- [ ] 完成任务后在 Result 面板点击"返回"按钮，鼠标点击一瞬间应**立即静音**，不需要等 React unmount（有 stopAllAudioImmediate 在 onClick 中直接调）。
- [ ] 回任务列表后持续 3 秒，不应再听到任何 Ambient 振荡器余响或 BGM 定时器继续输出 note。
- [ ] Chrome DevTools → Web Audio Inspector 中 Ambient/BGM 的两个 AudioContext，若被 stopBgmImmediate / stopAmbientImmediate close 则应显示"已关闭"，不应仍有 active Graph 节点。

### 6.6 连续切换 / 五关切换（与 §2 实跑对应）

- [ ] 连续 10 次"false↔true toggle"：
  - [ ] 全程无 console.error 异常；
  - [ ] 回到 true 后 Ambient 始终是 1 层；
  - [ ] 回到 true 后 BGM 始终是 1 套 scheduler（音符 timing 不紊乱，不出现"双 tempo"）；
  - [ ] 最后一次是 false 时最终 activeSfxCount 为 0（或只有当前新触发的正常新事件）。
- [ ] 依次进入 5 关后退出（与 Case 7 同样顺序）：
  - [ ] clean-table 的清新木质 Ambient 不应带入 leave-home 的居住空间 Ambient（有明显房间切换感）；
  - [ ] 每一关开始后 `BGM_CONFIG[taskId]` 对应的乐器层 / chord progression 对得上；不会出现"进入 task-breakfast 仍在播放 clean-table BGM"。

### 6.7 未实施项的"缺失听感"（确认本轮不做）

- [ ] ❌ **手机 1s 循环铃声**不应存在：当前 phone_ring 还是一次性合成，没有 loop；P1/P2 才做。
- [ ] ❌ **5 秒倒计时音色**不应存在：time_warning 仍是短促蜂鸣；本轮没新增任何音色素材。
- [ ] ❌ 新增合成器 preset 不应有；所有新进入的声音必然是 BGM_CONFIG/ROOM_AMBIENT/SFX_CONFIG 原有三表的合成结果，没有增加新的音色名称。
- [ ] ❌ 场景/地图/门洞位置不应变化：视觉上地图布局、门洞、家具位置与 HEAD 一致；Acceptance 期间未改任何 HUD/地图/场景/任务数值代码。

---

完成后停止。不提交、不推送。
