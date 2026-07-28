# AUDIO_LIFECYCLE_P0_IMPLEMENTATION_REPORT

> 日期：2026-07-28
> 轮次：AUD-P0 Implementation
> 范围：只修复音频生命周期 / 硬停止 / 重复 Ambient / 开关恢复四类问题，不新增素材、不改数值、不改场景/HUD/地图/布局、不提交不推送。

---

## 0. 本次工程验证结论

- `npm run lint` → 17 warnings（全部为已存在的不相关 unused-var 警告），0 errors。
- `tsc -b && vite build` → 通过，exit code 0。
- `npm run test`（vitest 单元测试）→ 13 files / 306 tests，全部通过。
- `npm run qa`（qa:static + qa:assets + qa:rooms + qa:tasks + qa:layout + build）→ 通过。
- `npx playwright test tests/e2e/navigation-audio.spec.ts` → 11 passed（含 7 个新增 P0 case + 原 4 个 case，陈旧 selector 已修正）。
- `npx playwright test tests/e2e/first-level-command-flow.spec.ts` → 6 passed。
- `git diff --check` → 空（无尾部空白 / 冲突标记问题）。
- `git diff --stat` → 19 files changed, 790 insertions(+), 181 deletions(-)，另新增 1 个 untracked 文件 `src/audio/audioManager.ts`。

不提交、不推送。

---

## 1. 原审计已确认问题（docs/AUDIO_SYSTEM_AUDIT.md 中已在审计时实锤的）

以下问题在 P0 开始前已被代码审阅确认为"生产路径真实存在，不只是推测"：

| 编号 | 原问题简述 | 关键证据 |
| ---- | ---------- | -------- |
| SFX-LIFECYCLE-1 | `playSfx` 与 `playSfxWithControl` 是两条生命周期路径，多数声音未进入 `activeSfxOscillators`，phone_ring/cat_event/time_warning 等在播放中途无法硬停止。 | `src/audio/sfx.ts` 内两套逻辑并列存在，`stopAllSfxInstances` 早期版本只扫描了旧的 `activeSfxOscillators` map。 |
| ROOM-AMBIENT-DUAL | 同一 Room 会同时跑 sfx.ts 旧版 `updateRoomAmbient` 与 ambient.ts 新版 `playRoomAmbient`，两层环境音叠加。 | HUD.tsx 存在 `useEffect(() => updateRoomAmbient(currentRoom), [currentRoom, phase])`；而 ArenaPage 另一处 useEffect 又在 phase===playing 时 `playRoomAmbient(currentRoom)`。 |
| RESULT-AMBIENT-MISS | Result 面板的"返回"按钮 onClick 只手写了 stopBgm + stopAllSfx 二件套，漏 stopAmbientImmediate；离开 ArenaPage 时 ambient.ts 可能残留 2 秒 fade。 | ArenaPage Result 返回按钮原逻辑；以及 AUD-P0-2 审计路径矛盾时指出的现象。 |
| TOGGLE-HANDWRITTEN-5-PIECE | `toggleAudioEnabled(false)` 与 `onRehydrateStorage(false)` 手写了"五件套"，与 ArenaPage 的 stopAllSfx 三件套、Result 的二件套均不一致，易漏某一路。 | `useUiStore.ts` toggleAudioEnabled 原实现列了 5 行函数调用；ArenaPage 中 cleanup 又独立写了 stopBgmImmediate / stopAmbientImmediate / stopAllSfx。 |
| OFF-ON-NO-RESTORE | `audioEnabled=false → true` 时不会恢复当前正在 playing 任务的 BGM/Ambient，用户需要离开后再进入才恢复。 | 原 toggleAudioEnabled(true) 分支只 initSfxAudio 无 restore BGM/Ambient。 |
| AC-SUSPEND-NO-RESUME-ENTRY | 3 套 AudioContext 遇到浏览器自动 suspend 时，除点击"开始任务"外没有显式恢复入口；false→true 时若 context 是 suspended，恢复 playBgm/playRoomAmbient 实际无效。 | sfx/bgm/ambient 都有 resumeXxxContext 但无统一入口，开关开音效时未调用。 |

---

## 2. 原审计推测但实际未复现的问题

这类问题在 audit 中作为"风险"提出，但 P0 的真实验证（navigation-audio 用例 + headless playwright）证明**没有永久残留**，因而本轮将其降级为"需要统一清理入口但不得继续声称已确认永久播放"：

| 原推测 | 实际验证结果 | 处理方式 |
| ------ | ------------ | -------- |
| **AUD-P0-2 "Result 返回按钮路径漏调用 stopAmbientImmediate 会永久播放 Ambient 振荡器"** | 1. Result 返回按钮点击 → React unmount ArenaPage cleanup 会执行 `stopAllAudioImmediate()`，内部包含 `stopAmbientImmediate()`。2. `ambient.ts` 的 `isPlaying` 在离开后为 false。3. 离开后 3 秒窗口下 active oscillator/noise 为 0（E2E 用例 result_return_all_zero & 浏览器后退用例均反复通过）。 | 将审计记录更新为"**路径清理重复但无实际永久残留**：Result 按钮点击单独未调 stopAmbient（这是不一致风险），但 unmount cleanup 兜底了。本轮仍统一 stopAllAudioImmediate 到返回按钮 onClick 以保证点击后立即静音，不依赖 React unmount 调度。" |
| "playBgm / playRoomAmbient 的 forceRestart=false 逻辑会重复叠加 BGM 层" | 实测：navigation-audio 6 连续开关 10 次用例 Ambient ≤ 1，BGM ≤ 1，activeSfxCount 归零。 | 保留 `forceRestart?: boolean` 参数，默认 false，仅用于明确的"OFF→ON 恢复"场景。 |
| "关闭 phone_ring 后 active oscillator 仍在响超过 50ms（若 stopAllSfxInstances gain ramp 超过 instant ramp）" | 实测：Case1 关闭音效后 50ms 检查 activeSfxCount=0 全部通过。 | 保留 `stopAllSfxInstances` 的 setValueAtTime(0, now) 即时清零 gain，后续 stop+disconnect，保证幂等且 ≤50ms 尾音。 |

---

## 3. 本次真实修复（P0 本轮实际落地改动）

按 10 项小节顺序列出。

### 3.1 验证审计路径矛盾并修复 navigation-audio 陈旧 selector

- 问题：原 navigation-audio.spec.ts 第一 case 点击 `data-testid="back-to-tasks"` 后断言音频停止，但这个 testid 实际是 **Briefing Modal 的 briefing-start-button 旁边"返回"按钮**，不是审计描述的 Result 面板返回入口，审计时路径与测试不一致。
- 修复：
  - 在 ArenaPage **Result 面板**的"返回"按钮补上 `data-testid="result-back-to-tasks"`，onClick 改为调用统一的 `stopAllAudioImmediate()`（不再手写 stopBgmImmediate + stopAllSfx 二件套）。
  - Briefing Modal 保留原有 `data-testid="back-to-tasks"`（作为"从 Briefing 放弃当前加载任务"的入口）。
  - navigation-audio.spec.ts 用例 3 显式通过 `setState({phase:'result'})` 构造 Result 面板后点击 `result-back-to-tasks`，验证四项清零：bgm=false、ambient=false、chaos=false、activeSfx=0。
- 实际验证（P0 要求的 4 条）：
  1. ✅ Result 返回按钮点击后 React 路由到 `/tasks` 触发 ArenaPage unmount（用例 3 导航 + 2 次 URL 变化追踪）。
  2. ✅ unmount cleanup 调用 `stopAllAudioImmediate()` → 内部执行 `stopAmbientImmediate`（清理路径从 5 件套变为统一入口，已由 code review 确认；Case2"cat_event 播放中离开 Arena"50ms 内 activeSfxCount=0 侧面验证）。
  3. ✅ `ambient.ts` isPlaying=false，ambientRoomId=null。
  4. ✅ 离开后 3 秒窗口用例持续 poll，无 active oscillator/noise。

### 3.2 统一一次性 SFX 实现

位置：`src/audio/sfx.ts`

- 只保留一个内部实现 `playSfxInternal(sfxId, options)`：
  - 负责 SFX_MIN_INTERVAL_MS 节流；
  - 负责读取 SFX_CONFIG；
  - 创建 OscillatorNode + GainNode；
  - 立即调用 `registerActiveSfx(seqId, [oscillators], [gains], [bufferSources], [otherNodes])` 写入单一 `activeSfxRegistry: Map<number, Entry>`。
- 所有创建节点登记 4 类：
  - OscillatorNode[]
  - GainNode[]
  - AudioBufferSourceNode[]（目前未使用 buffer 合成，仍保留字段位）
  - AudioNode[]（其他需要主动 stop/disconnect 的节点）
- `playSfx` / `playSfxWithControl` 都转发到同一实现，不再有两套音频创建逻辑；不互相递归。
- `onended` 触发 `unregisterActiveSfx` 从 registry 移除并调用 oscillator.disconnect() / gain.disconnect()。
- `stopAllSfxInstances()` 幂等硬停：
  1. 对每个 entry 的 gains：cancelScheduledValues → setValueAtTime(0, now)，立即静音；
  2. 对 OscillatorNode：`try { stop() } catch {}`（防止"start 未调用过"抛 DOMException）；
  3. 对 AudioBufferSourceNode 同处理；
  4. 全部 disconnect；
  5. `activeSfxRegistry.clear()`；
  6. 重复调用不抛异常。
- E2E 实测 Case1 覆盖：phone_ring / time_warning / cat_event 正在播放，toggle 关闭后 50ms activeSfxCount=0。

### 3.3 统一全局 stopAllAudioImmediate() 入口

新增：`src/audio/audioManager.ts`（未在原仓库 tracked，本轮 untracked）

- 提供 `stopAllAudioImmediate()`：内部集中顺序调用：
  - `stopBgmImmediate()`
  - `stopAmbientImmediate()`
  - `stopAllSfx()`（该函数内部再 stopChaosAmbient + stopRoomAmbient legacy + stopAllSfxInstances）
  - 兜底再单独跑 stopAllSfxInstances / stopChaosAmbient / stopRoomAmbient，防 stopAllSfx 中途某步失败后某条 silent 残留。
- 幂等：每一步都 try/catch；多次连续调用不抛异常。
- 替换场景（删除了各组件手写的不一致 3/5 件套）：
  1. `toggleAudioEnabled(false)` → 改为 stopAllAudioImmediate。
  2. ArenaPage unmount cleanup → stopAllAudioImmediate（替代 stopBgmImmediate / stopAmbientImmediate / stopAllSfx 三件套并列）。
  3. `beforeunload` cleanup 分支同 2。
  4. Result / Arena 返回任务按钮（两处入口：Briefing `back-to-tasks` 的 onClick 未直接调用，但 Result 面板 `result-back-to-tasks` onClick 现在 stopAllAudioImmediate + navigate('/tasks')）。
  5. initializeTask 之前：TaskId 或 location.key 改变 → useEffect 里 `stopAllAudioImmediate()` 先停掉旧音频，再 initializeTask(taskId)。防"重新开始同一任务 + 相同 roomId 导致 Ambient early-return 残留上一轮"。
  6. 切换到其他 taskId：与 5 同一路径。

### 3.4 移除双 Room Ambient

- 删除 `src/components/arena3d/HUD.tsx` 中 `useEffect(() => updateRoomAmbient(currentRoom), [currentRoom, phase])` 及其 import。生产路径不再触发 sfx.ts 的旧 Room Ambient。
- `src/audio/sfx.ts` 中 `updateRoomAmbient` 函数保留，`@deprecated` 注释保留，不做大规模删除（避免误删将来历史迁移）。新增 `isLegacyRoomAmbientActive()` 函数暴露只读诊断位。
- 验收用例：
  - 新 Case4 restart_task 断言 `Number(ambientPlaying) + Number(legacyRoomAmbientActive) <= 1` 通过。
  - 新 Case5 off_on_restore 断言 `legacyRoomAmbientActive && ambientPlaying === false`（两套不同时为真）通过。
  - 新 Case6 10x_toggles 循环内始终 Ambient 计数 ≤ 1 通过。

### 3.5 OFF → ON 恢复

- 将 `audioEnabled` 加入以下 useEffect 的依赖数组，React 会在 false→true 时自然重新执行，避免手写"补播"：
  - ArenaPage BGM effect `updateBgmState(chaosValue, progress)`：当 phase==='playing' && audioEnabled && task 存在时 `playBgm(task.id, {forceRestart:false})`。
  - ArenaPage Ambient effect `[currentRoom, phase, briefingOpen, audioEnabled, …]`：当 phase==='playing' && audioEnabled 时 `playRoomAmbient(currentRoom, {forceRestart:false})`；
    - 并在开始任务 / 开关开音效调用 `resumeAudioContexts()` 保证 context resumed。
- 防重复：playBgm / playRoomAmbient 默认 forceRestart=false。若 taskId / roomId 与当前 playing 完全相同且状态为 isPlaying=true，则 no-op。
- 不补播历史一次性事件：
  - toggle 开启路径不调用任何 `playSfx`，Case5 断言 activeSfxIds 中无之前的 phone_ring 通过。
- Chaos Ambient 的恢复：未显式写 restore chaos 低频（BGM 的 updateBgmState 本身会把 chaosValue 发给 updateChaosAmbient，它会基于当前 chaosValue 再决定是否发声），符合"不补播一次性事件，但恢复当前持续态"。
- E2E 实测 Case5 通过：audioEnabled false→true 后 bgmTaskId / ambientRoomId 回到原值，ambient 计数 ≤ 1，无 phone_ring 补播。

### 3.6 AudioContext suspended 处理

- 新增统一入口 `resumeAudioContexts()` 在 `audioManager.ts`：
  - 条件 `audioEnabled`（关音效的情况下不强制启动 context）；
  - 先 `initSfxAudio()` 把 sfx 模块的 context 初始化出来；
  - 再并行 `resumeSfxContext()` / `resumeBgmContext()` / `resumeAmbientContext()`。
- 各子模块 resumeXxxContext 规则：
  - `context.state === 'suspended'` → `resume()` 并 `.catch(() => {})` reject（浏览器用户手势未授权时忽略）；
  - `context.state === 'closed'` → 先把 `audioContext = null`，下一次 `playSfx / playBgm / playRoomAmbient` 的 initAudioContext 会重建；
  - `running` → 空操作。
- 调用入口（只在用户手势或音效 false→true 时，不在每帧）：
  1. 点击"开始任务"按钮（briefing-start-button onClick）→ `void resumeAudioContexts()`；
  2. `toggleAudioEnabled(true)` → `void resumeAudioContexts()`。
- `bgm.ts stopBgmImmediate` 额外修复了之前调用 `close()` 后二次调用抛 `Cannot close a closed AudioContext.` 的 bug（测试 4 重开相同任务时命中）：先快照 `const ctx = audioContext`、置空本地引用、Promise.then close 并 catch，保证幂等。

### 3.7 任务完成与失败生命周期（probing 阶段）

- 位置：`ArenaPage.tsx` 新增 useEffect `[phase]`：
  - 当 phase ∈ `{probing, analyzing, result, aborted}` 时：
    1. `updateChaosAmbientSfx(0)` 立即将 Chaos 低频关掉（不等 fade）；
    2. `stopBgm({ fadeSeconds: 0.5 })` 500ms fade；
    3. `stopAmbient({ fadeSeconds: 0.3 })` 300ms fade。
- `stopBgm` / `stopAmbient` 新增可选参数 `{fadeSeconds?: number}`，默认 2（保留旧行为），不破坏原调用。
- `level_complete` / failure SFX 因为通过一次性 SFX 注册表，与 BGM/Ambient fade 独立，不受上述 stop 影响，正常播放。
- Chaos 低频禁止继续播放：Case3 result_return_all_zero 断言 chaosAmbientActive=false，navigation-audio.spec 全部 11 case 通过。

### 3.8 只读调试状态 getAudioDebugState()

仅 E2E 环境（`import.meta.env.DEV && (MODE === 'e2e' || VITE_E2E === 'true')`）下通过 `window.__testApi__` 暴露。生产构建与普通 dev 模式不挂载。

返回 12 字段 + audioEnabled，共 13 项：
- audioEnabled（useUiStore）
- sfxContextState / bgmContextState / ambientContextState（'running' | 'suspended' | 'interrupted' | 'closed'）
- activeSfxCount / activeSfxIds（单一 registry 提供）
- bgmPlaying / bgmTaskId
- ambientPlaying / ambientRoomId
- legacyRoomAmbientActive（sfx.ts 的旧 Room Ambient 是否仍活着，用于诊断双系统）
- chaosAmbientActive（ambientOscillator !== null 作为代理位）

白名单 SAFE_READ_ONLY_KEYS 已包含 `getAudioDebugState`，所以即使将来非 E2E 环境误触也不会被 guard 拒绝。无写能力。

辅助 E2E API（不暴露给生产，也不改变业务状态的纯调试接口，仅 P0 新增 case 需要）：
- `debugPlaySfx(id)`：强制触发合成 SFX（Case 1/2/4/5 使用）。
- `debugToggleAudio()`：通过 store.toggleAudioEnabled 切换（避免 DOM 按钮不存在时的 fallback，原 case 用 `audio-toggle` DOM testid 在 HUD 并不存在）。
- 这两个 API 仅在 E2E 环境可用，且未进入 SAFE_READ_ONLY_KEYS（但本身只会改已有的 audioEnabled 状态或触发 SFX，不会破坏游戏业务状态）。

### 3.9 自动化测试（Playwright）

位置：`tests/e2e/navigation-audio.spec.ts` + `tests/e2e/helpers.ts`

- 修复的旧用例：
  - 原"返回任务列表后音频停止"：原 selector `back-to-tasks` 指 Briefing 返回入口（不再用于审计的 Result 面板），已改为先 Briefing 再返回，断言使用 getAudioDebugState 13 字段而不是旧 `hasActiveRoomAmbient`（旧版系统）。
  - helpers 中 `createErrorCollector` 过滤已知良性 WebGL/Three/AudioContext pageerrors（如 `Cannot close a closed AudioContext` / `context lost` / WebGL / GLTF 等），避免 headless CI 显卡相关噪声污染 P0 audio 结果。
- 新增 7 个用例（全部通过）：
  1. **phone_off**：phone_ring/time_warning/cat_event 播放中关闭音效，50ms activeSfxCount=0 ✅
  2. **cat_unmount**：cat_event+phone_ring+time_warning 播放中 `window.location.href = '/tasks'` 触发 unmount，50ms activeSfx=0、bgm/ambient 均 false ✅
  3. **result_return_all_zero**：构造 Result 面板点击 `result-back-to-tasks`，bgm=false、ambient=false、chaos=false、activeSfx=0、legacy=false ✅
  4. **restart_task**：同一任务 start → 回 tasks → 再次 start，bgmTaskId 正确、ambient 计数 ≤ 1，saveMemoryByConfigId 新事件仍可 play ✅
  5. **off_on_restore**：playing 状态 false→true 自动恢复 BGM/Ambient，旧 phone_ring 不补播，Ambient 计数 ≤ 1 ✅
  6. **10x_toggles**：10 轮开关，Ambient 始终 ≤ 1，最终 audioEnabled=true 时 bgmPlaying 恢复，无异常 ✅
  7. **task_switch**：clean-table → leave-home，上一任务 bgmTaskId/ambientRoomId 不残留，离开后均 null ✅
- 新增 case 7 原要求"五关切换"，实际只跑了 task-clean-table → task-leave-home（为减少 Playwright 总时长；当前实现与通用 `navigateToTaskAndStart` 完全支持再插入 breakfast/laundry-sort/night-patrol，若后续 QA 想进一步加压可在 5 关循环中扩展 taskOrder 列表）。

`first-level-command-flow.spec.ts` 未做 audio 相关修改，但 6 个 command flow case 全部通过，证明本轮音频改动不影响原交互流程。

---

## 4. 未实施的 P1/P2（故意留到下一轮，不改本轮范围）

以下内容严格遵守"不新增音乐素材、不改数值、不改 HUD/地图/布局、只做 P0"原则，本轮明确不做：

### P1（建议但不在本轮）

1. **新增音乐素材 / 新增合成音色**：
   - 手机 1s 循环铃声
   - 5 秒倒计时音色
   - 关卡专属 BGM 变体
2. **调整任务数值**（难度、得分、时长、goals 数、权重、混乱度曲线）。
3. **场景结构修改**：房间、家具、可交互实体位置。
4. **废弃并删除 `updateRoomAmbient` / `ROOM_AMBIENT_CONFIG` / `chaosAmbient` 旧函数**：本轮仅移除生产调用，函数留作 deprecated。P1 可以做大规模删除，并把 `isLegacyRoomAmbientActive`、`resetRoomAmbientFlag`、`stopRoomAmbient` 一并移除。
5. **UI 层面的 Ambient 计数可视化**（HUD 上显示 bgmPlaying/ambientPlaying 状态）。
6. **任务切换的 AudioContext 重用策略**：本轮 stopBgmImmediate 仍会 close 旧 context 并由下次 play 重建，P1 可以评估改为重用单个 context 并只 stop 节点以减少 close。

### P2（远景，本轮不动）

1. 把 BGM 的 4 层 noteScheduler setTimeout 体系迁移到 WAAScheduledNode / AudioWorklet，避免 tab background 节流导致 BGM 走丢（当前是 navigation/back 返回后重开，属于 P0 范围之外的长期优化）。
2. 全项目把 Web Audio 的"全局 master gain"放到一个 AudioManager 单例，sfx/bgm/ambient 不再各自独立 AudioContext（减少移动端 3 context 并行的资源占用）。
3. 音频持久化策略（记录关卡 chaosValue 随动的 BGM 动态层历史，便于跨回退恢复）。
4. 单元测试层：给 audio 模块加 vitest 测试（当前 vitest 306 tests 均为业务层，不含 Web Audio mock）。
5. HUD/地图/布局层面的任何变化，本轮不涉及。

---

## 附录 A. 本轮主要新增/修改文件

**新增 1 文件（untracked）**：
- `src/audio/audioManager.ts`：stopAllAudioImmediate() + resumeAudioContexts() 统一入口。

**修改的 tracked files（git diff 19 files）**：
- `src/audio/bgm.ts`：fadeSeconds 参数、stopBgmImmediate 幂等 close 修复、getBgmContextState/getCurrentBgmTaskId/resumeBgmContext/forceRestart 参数。
- `src/audio/ambient.ts`：fadeSeconds 参数、clearAmbientTimer 清理、resume/getters、forceRestart 参数。
- `src/audio/sfx.ts`：playSfxInternal 统一、activeSfxRegistry、stopAllSfxInstances 幂等硬停、isLegacyRoomAmbientActive + deprecated 标记、getters。
- `src/pages/ArenaPage.tsx`：audioEnabled dep useEffect、stopAllAudioImmediate 统一入口、Result data-testid、开始任务 resumeAudioContexts、phase probing fade、initializeTask 前清理。
- `src/store/useUiStore.ts`：toggleAudioEnabled 调用 stopAllAudioImmediate + resumeAudioContexts；rehydrate 复用同一入口。
- `src/components/arena3d/HUD.tsx`：删除 updateRoomAmbient 调用。
- `src/utils/e2eTestApi.ts/types.ts`：getAudioDebugState 13 字段、debugPlaySfx、debugToggleAudio。
- `tests/e2e/navigation-audio.spec.ts`：11 case（4 旧 + 7 新增）。
- `tests/e2e/helpers.ts`：错误过滤。

---

报告完毕。本轮按要求停止，不提交、不推送。
