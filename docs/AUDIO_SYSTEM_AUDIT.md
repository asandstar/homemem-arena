# HomeMem Arena Audio System Audit

**日期**: 2026-07-28
**审计范围**: 当前 Working Tree（基于 Interaction Outline 修复后 HEAD）
**模式**: 只读 / 运行 / 记录；不修改生产源码、音频资源、依赖或配置；不提交不推送
**任务覆盖**: task-clean-table / task-leave-home / task-laundry-sort / task-breakfast / task-night-patrol（5 关）

---

## 一、当前音频架构

### 1.1 音频子系统模块划分

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     应用层（Page / Component / Slice）                    │
│  HomePage/TaskSelectPage toggleAudioEnabled                              │
│  useUiStore (persist: home-mem-ui-state) 音频偏好开关                   │
│  ArenaPage 挂载/卸载：BGM / Ambient / SFX cleanup                        │
│  HUD : phase=playing → playBgm(taskId) + updateRoomAmbient(roomId)       │
│  Slice 事件：task startPlaying / setLevelCompleted / markMemoryOutdated   │
│              pickEntity / placeEntity / toggleContainer / playerMovement   │
│              triggerScriptedEvent (cat / phone / time_warning / chaos)    │
│              playCharacterSpeak（dialog 播放对话音色）                    │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │ （仅 import 调函数；全部无 HTMLAudioElement）
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         音频合成层（纯 Web Audio API）                     │
│  src/audio/sfx.ts        一次性 SFX + 房间环境音(ROOM_AMBIENT_CONFIG)    │
│                          + 混乱环境音 updateChaosAmbient                │
│                          + playFootstep（脚步 350ms 节流）               │
│                          + playCharacterSpeak（4 种角色语气）            │
│                          + playChord（和弦组合）                         │
│                          + 全局 isEnabled + 共享 AudioContext           │
│  src/audio/bgm.ts        任务级 Background Music（4 层 note loop）       │
│                          BGM_CONFIG 5 关配置 + 1 DEFAULT（night-patrol） │
│                          + clearAllTracks（清理 setTimeout 递归）       │
│                          + updateBgmState（chaos/progress 动态 volume）│
│  src/audio/ambient.ts    Ambient Room Tone（独立第二套 AudioContext）   │
│                          playRoomAmbient / stopAmbient（2s ramp down）   │
│                          含 pink-noise + LFO FM + 2x harmonic osc       │
└─────────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
                    AudioNode 图（Oscillator / GainNode /
                    BiquadFilter / AudioBufferSourceNode）
                                 │
                                 ▼
                      AudioContext.destination（扬声器）
```

### 1.2 AudioContext 实例图（关键架构特征）

| 持有者 | 创建位置 | 复用策略 | suspended/resume | 销毁策略 |
|--------|----------|----------|------------------|----------|
| `sf x.ts` 共享 AudioContext | `sfx.ts: initAudio()`（被 useUiStore.onRehydrateStorage/toggleAudioEnabled 调用，首次 audioEnabled=true 时创建） | **模块级单例**；`!audioContext` 时创建一次，永不主动 `close()` | **未处理 suspend/resume/autoplay**；全部 `oscillator.start(now)` 无 `.resume()` 前置、无 Promise.catch | 无 close 逻辑；切换任务 / 离开 Arena / 开关音效 都不 `audioContext.close()`。仅 stopBgmImmediate **会**调用 `audioContext.close()` 关 bgm.ts 实例 |
| `bgm.ts` AudioContext（独立 + masterGain） | `bgm.ts: initAudioContext()`；`playBgm(taskId)` 首次 enabled 时 lazy create | **模块级单例** | 同样未处理 suspend/autoplay；osc.start 无 catch | **stopBgmImmediate 才 close**；正常 stopBgm() 仅 masterGain 2s fade to 0，不 close context |
| `ambient.ts` AudioContext（独立 + ambientGain） | `ambient.ts: initAudioContext()`；`playRoomAmbient(roomId)` lazy create | **模块级单例** | 同样未处理 | `stopAmbientImmediate()` / toggleAudioEnabled(false) 不主动 close，只 gain to 0 + 断 node |

**风险要点（A7 项会展开）**：
- 同时存在 **3 个独立 AudioContext**，未做「跨模块复用」。Chrome 每页上限 60，但 3 个属可接受，不过会让 suspend/resume 更难统一。
- **autoplay / user gesture resume**：`AudioInitializer.tsx` 只同步 `isEnabled` flag，**从不调用 `audioContext.resume()`**。AudioContext 在首次用户手势之前将处于 `state='suspended'`，此时 `osc.start()` 不会报错但可能延迟到手势后才发声（Chrome 行为）。
- **无 `.play()` Promise / `.start()` Promise**：全部为 WebAudio fire-and-forget，`osc.start()` 无 try/catch 外的 Promise 链。

### 1.3 UI 偏好持久化链路

```
HomePage/TaskSelectPage toggle 按钮
  └─ useUiStore.toggleAudioEnabled()  [HUD 当前没有按钮，HUD 只键盘 Tab 面板切换]
        │
        ├─ zustand persist('home-mem-ui-state', localStorage) → 刷新仍保留
        │   └─ onRehydrateStorage: 再播放一次 setAudioEnabled(state.audioEnabled) + initSfxAudio/stopAll
        │
        ├─ true 分支: initSfxAudio() (创建 sfx AudioContext 若不存在)
        │               + resetRoomAmbientFlag() (允许 sfx 房间环境音再启动)
        │
        └─ false 分支:
              stopChaosAmbient()         // sfx.ts chaos ambient nodes
              stopRoomAmbient()          // sfx.ts ROOM_AMBIENT_CONFIG 环境音
              stopAllSfxInstances()      // sfx.ts activeSfxOscillators Set
              stopBgmImmediate()         // bgm.ts clearAllTracks + masterGain 0 + close AC
              stopAmbientImmediate()     // ambient.ts gain=0 + clearAmbient node
```

---

## 二、完整声音注册表（Sound Registry）

### 2.1 一次性 SFX（playSfx / playSfxWithControl 调用）

| soundId | 生成方式（无文件，纯 WebAudio 合成） | category | trigger（触发点文件/函数） | loop | volume | canOverlap | cooldown | ownerTask | ownerPage | startCondition | stopCondition | cleanup | muteBehavior（关音效时） | resumeBehavior |
|---------|-------------------------------------|----------|---------------------------|------|--------|------------|----------|-----------|-----------|----------------|---------------|---------|-------------------------|----------------|
| `pick` | Oscillator 880Hz sine, ADSR 0.15s | pickup | `entitySlice.ts: pickEntity()` L49 | ❌ 单次 | 0.25 | ✅ 可 | 无 | All | Arena | phase=playing 且 entity 可 pick | 0.15s 后自然 stop | oscillator.stop(now+duration) 自动 GC（未进 Set） | 直接不进 playSfx（isEnabled 门） | N/A（非 autoplay） |
| `place_success` | 523.25→1046.5Hz sine 0.3s 上滑 | place | `entitySlice.ts: placeIntoContainer` success L134 | ❌ 单次 | 0.3 | ✅ 可 | 无 | All | Arena | heldEntity 放对 container | 0.3s 自然 stop | 同上 | 同上 | N/A |
| `place_error` | 150→80Hz sawtooth 0.3s 下滑 | place | `entitySlice.ts: placeIntoContainer` fail L122 | ❌ 单次 | 0.2 | ✅ 可 | 无 | All | Arena | 放置错误 / 容器不匹配 | 0.3s 自然 stop | 同上 | 同上 | N/A |
| `memory_save` | 800→1400Hz square 0.25s 上滑 | memory | `memorySlice.ts: saveMemory / saveMemoryNearbyEntity` L101/L131 | ❌ 单次 | 0.15 | ✅ 可 | 无 | All | Arena | 调用 saveMemory（用户按 E / cmd） | 0.25s 自然 stop | 同上 | 同上 | N/A |
| `memory_outdated` | 600→200Hz sawtooth 0.4s 下滑 | memory | `memorySlice.ts: markMemoryOutdated` L172 | ❌ 单次 | 0.2 | ✅ 可 | 无 | All | Arena | 记忆超过 time-to-live 自动过期 / 脚本事件强制 | 0.4s 自然 stop | 同上 | 同上 | N/A |
| `cat_event` | 600→1000Hz triangle 0.4s | event | `taskSlice.ts: triggerScriptedEvents` toastType==='cat' L448 | ❌ 单次 | 0.18 | ⚠️ 代码上可，但 triggeredEvents Set 保证同一 event.id 不重放 | 无（3s 内同 toast 不会 2 次，但两次不同 cat event 会叠播） | leave-home（脚本事件定义） | Arena | scriptedEvent 触达 && toast.message && toastType==='cat' | 0.4s 自然 stop | 同上 | 同上 | N/A |
| `phone_ring` | 880Hz sine ADSR 0.6s envelope 长 release | event | `taskSlice.ts: triggerScriptedEvents` toastType==='phone' L450 | ❌ 单次（仅单发声 0.6s；脚本事件可多次触发） | 0.15 | ⚠️ 可（如果脚本每秒发一个 phone 事件会叠播） | 无（靠 triggeredEvents Set 阻止同一 event.id） | leave-home | Arena | scriptedEvent.toastType==='phone' 且 message 含"震动" | 0.6s 自然 stop；没有 stopPhoneRing() 函数 | 同上 | 同上 | N/A |
| `level_complete` | 523.25Hz sine 0.8s 长 sustain | ui | `taskSlice.ts: setLevelCompleted()` L297（还有 `isAudioEnabled()` if 门） | ❌ 单次 | 0.35 | ✅ 可（若连续点 2 次重玩会叠） | 无 | All | Arena | 所有 goal 达成，进入 phase=probing 前 | 0.8s 自然 stop | 同上 | 同上 | N/A |
| `chaos_warning` | 200Hz sawtooth 0.2s | chaos | `sfx.ts: playChaosWarning()` → 被 `chaosSlice.ts` triggerChaosEffect L40/L55 调用 | ❌ 单次 | 0.15 | ❌ 3000ms 去抖（lastChaosWarningTime） | 3000ms | All | Arena | chaos 跨阈值触发 effect | 0.2s 自然 stop | 同上 | 同上 | N/A |
| `footstep` | 600→200Hz triangle 0.1s | ambient | `sfx.ts: playFootstep(speed)` → （未在当前 grep 结果看到调用源） | ❌ 单次 | 0.12 | ❌ 350ms 节流（FOOTSTEP_INTERVAL），速度越快越短 | 350ms / speed | All | Arena | 玩家每步位置变化 | 0.1s 自然 stop | 同上 | 同上 | N/A |
| `door_open` | 180→100Hz sawtooth 0.4s | container | `entitySlice.ts: toggleContainer` 行 289：room-door→open | ❌ 单次 | 0.18 | ✅ 可（若打开 2 门） | 无 | task 配置中含 room-door 容器者 | Arena | 玩家 toggle 门容器 | 0.4s 自然 stop | 同上 | 同上 | N/A |
| `door_close` | 150→80Hz sawtooth 0.3s | container | entitySlice L299（close door） | ❌ 单次 | 0.2 | ✅ 可 | 无 | 含 room-door 任务 | Arena | 玩家关闭门容器 | 0.3s 自然 stop | 同上 | 同上 | N/A |
| `drawer_open` | 350→200Hz square 0.25s | container | entitySlice L287（drawer open） | ❌ 单次 | 0.15 | ✅ 可 | 无 | 含 drawer 的任务（leave-home 床头柜抽屉等） | Arena | toggle 打开抽屉 | 0.25s stop | 同上 | 同上 | N/A |
| `drawer_close` | 300→150Hz square 0.2s | container | entitySlice L297 | ❌ 单次 | 0.18 | ✅ 可 | 无 | 同上 | Arena | 关闭抽屉 | 0.2s stop | 同上 | 同上 | N/A |
| `fridge_open` / `fridge_close` | 200→120 saw 0.5s / 160→90 saw 0.35s | container | entitySlice L283/L293 | ❌ 单次 | 0.12 / 0.15 | ✅ 可 | 无 | breakfast / task 含 fridge | Arena | 冰箱 toggle | 自然 stop | 同上 | 同上 | N/A |
| `cabinet_open` / `cabinet_close` | square 280→180 0.35s / 260→140 0.25s | container | entitySlice L285/L295 | ❌ 单次 | 0.14 / 0.16 | ✅ 可 | 无 | laundry-sort / 其他含 cabinet | Arena | cabinet toggle | 自然 stop | 同上 | 同上 | N/A |
| `sink_water` | 500→300 saw 0.8s | container | （SFX_CONFIG 已定义但 grep 无调用） | ❌ 单次 | 0.1 | ✅ 可 | 无 | — | — | 未被调用 | 自然 stop | — | — | — |
| `dishwasher_start` | 400→250 saw 0.6s | container | 同上，未 grep 到调用 | ❌ 单次 | 0.12 | ✅ 可 | 无 | — | — | 未被调用 | — | — | — | — |
| `trash_drop` | 180→60 saw 0.4s | container | 未 grep 到调用 | ❌ 单次 | 0.18 | ✅ 可 | 无 | — | — | 未被调用 | — | — | — | — |
| `time_warning` | 600→400 square 0.3s | ui | `taskSlice.ts tickElapsed` L516（30s）+ L523（10s）两处边界，`isAudioEnabled()` if 门 | ❌ 单次 | 0.2 | ✅ 可；但两个 if 有"previousRemainingSeconds>30 → remaining<=30"所以不会每秒触发 | 每关最多触发 1~2 次（≤30 与 ≤10 各一次）；缺少 5s 档 | All | Arena | remainingSeconds 跨过 30 / 10 阈值（非每秒） | 0.3s 自然 stop | 同上 | 同上 | N/A |
| `task_start` | 523.25→1046.5 sine 0.5s 上扬 | ui | `taskSlice.ts startPlaying()` L272（带 isAudioEnabled if 门） | ❌ 单次 | 0.25 | ✅ 可 | 无（每次点击「开始任务」触发一次） | All | Arena | 玩家点开始任务后 → phase='playing' | 0.5s 自然 stop | 同上 | 同上 | N/A |
| `task_complete` | 523.25 sine 1.0s 长 susta in | ui | （定义于 SFX_CONFIG，但 grep 实际触发是 level_complete，task_complete 无调用） | ❌ 单次 | 0.3 | ✅ 可 | 无 | — | — | 未被调用 | — | — | — | — |
| `room_enter` | 523.25→659.25 sine 0.35s 上扬 | ui | `playerSlice.ts transitionToRoom` L60（slice 直接 playSfx，未 isAudioEnabled if 门，但 playSfx 顶部有 isEnabled 检查） | ❌ 单次 | 0.15 | ✅ 可 | 无 | All | Arena | player 切换房间命令 | 0.35s 自然 stop | 同上 | 同上（sfx 内部 !isEnabled return） | N/A |
| `character_speak_plate` | 880→1320 sine 0.5s | dialog | `useDialog.ts` speaker=`plate-spirit` | ❌ 单次 | 0.15 | ✅ 可（每次对话节点触发一次） | 无 | clean-table 等 | Arena | 每次 dialog onNext / 新节点打开 | 0.5s 自然 stop | 同上 | 同上 | N/A |
| `character_speak_sock` | 440→660 triangle 0.6s | dialog | speaker=`sock-ghost` | ❌ 单次 | 0.12 | ✅ 可 | 无 | laundry-sort | Arena | dialog next | 自然 stop | 同上 | 同上 | N/A |
| `character_speak_alarm` | 1000→1500 square 0.4s | dialog | speaker=`alarm-clock` | ❌ 单次 | 0.18 | ✅ 可 | 无 | night-patrol / breakfast | Arena | dialog next | 自然 stop | 同上 | 同上 | N/A |
| `character_speak_cat` | 500→800 triangle 0.35s | dialog | speaker=cat / narrator / default | ❌ 单次 | 0.2 | ✅ 可 | 无 | All（narrator 默认） | Arena | dialog next | 自然 stop | 同上 | 同上 | N/A |
| `drag_object` | 350→250 saw 0.08s（短促） | ui | 定义了 SFX_CONFIG 但 grep 未调用 | ❌ 单次 | 0.1 | ✅ 可 | 无 | — | — | 未被调用 | — | — | — | — |

### 2.2 循环/持续音源（BGM / 环境 Ambient / Chaos）

| soundId | 生成方式 | category | trigger | loop 机制 | volume | overlap | cooldown / 条件 | ownerTask | ownerPage | startCondition | stopCondition | cleanup | muteBehavior | resumeBehavior |
|---------|----------|----------|---------|-----------|--------|---------|----------------|-----------|-----------|----------------|---------------|---------|--------------|----------------|
| **BGM 4-Layer Note loop**（任务 BGM） | bgm.ts 独立 AC + masterGain；melody/chords/bass/percussion 各自 setTimeout 递归 playTrack(nextNote) → self schedule，`state.noteIndex++` | BGM | `HUD.tsx useEffect`：phase=playing && task → playBgm(task.id) | ✅ setTimeout 递归无限 loop；每个 loopOffset 由 trackStates 管理 | melody 0.22~0.3 × chaos 系数；masterGain fade 3s 到 0.5 再随 chaos+progress 动态变化 0.4~0.7；默认 currentVolume=0.5，`setBgmVolume` clamp 0~1 并 * 0.5 | playBgm(taskId) 会先 `stopBgm()` 清旧 timer 再 startAllLayers → 理论不叠加；若快速 switch 2 次（前一次 setTimeout 尚未到）可能有 <100ms 叠音；`currentTaskId===taskId && isPlaying` 早退防同任务二次启动 | 无；clean-table/Dm/laundry/breakfast 有各自 BGM_CONFIG；night-patrol 走 DEFAULT_BGM | 5 关各 1 套；taskId 切换时 stopBgm 清旧 | Arena | (1) isAudioEnabled()=true (2) !isArenaCleaningUp (3) playBgm 调用 (4) HUD useEffect deps 满足（phase=playing 且 task 已挂载） | (1) stopBgm()：isPlaying=false，clearAllTracks，masterGain 2s→0；osc.onended 自动断；(2) stopBgmImmediate 立即 gain=0 + close AC + 清 track timer；(3) toggleAudioEnabled(false) 调用 stopBgmImmediate；(4) ArenaPage unmount cleanup / beforeunload / Result 前"返回任务"按钮 click 调 stopBgmImmediate | clearAllTracks 每个 state.timer clearTimeout；osc.onended 自动 GC（但 bgm.ts 的 oscillator 未进入 Set，靠 2s fade 后自然 stop） | 开关音效 → false：stopBgmImmediate（强关 masterGain 0 + 关 context）；开 → true 不会自动重新播 BGM，除非 HUD useEffect 再次满足（一般切 task 或重开任务） | suspend/resume 未处理；`stopBgmImmediate` 会把 bgm.ts audioContext.close() → 下一次 playBgm 触发 `initAudioContext` 重建新实例（这是**唯一**会 close AudioContext 的函数） |
| **Room Ambient（sfx.ts 内部旧版，ROOM_AMBIENT_CONFIG）** | `updateRoomAmbient(roomId)`：单 Oscillator + Gain，type/freq 按 roomId；音量 0.02~0.04。⚠️ 与 ambient.ts 是两套独立实现！ | Ambient（Sfx 内部实现 1） | `HUD.tsx useEffect` phase='playing' 切 currentRoom 调 updateRoomAmbient；`playerSlice transitionToRoom` 的 room_enter SFX 不触发这个，是 HUD useEffect 驱动 | ✅ oscillator.start() 无 stop 持续 loop（type=sine/triangle 单音） | 0.02 ~ 0.04（极低），1s linearRamp fade in | `currentRoomType===roomId` 早返回，所以不会重复建；切房间先清旧再建新；⚠️ 但与 `ambient.ts playRoomAmbient` **两套同名 2 个 Ambient 同时播**（见下） | 无 | 6 种 roomType 各一；All tasks | Arena | (1) !isRoomAmbientStopped && isEnabled && audioContext；(2) currentRoomType 变了 | (1) stopRoomAmbient()：isRoomAmbientStopped=true + gain=0 now + osc.stop() + null 化；(2) toggleAudioEnabled=false 调用；(3) ArenaPage unmount cleanup stopAllSfx()；(4) 离开 Arena 切 result/tasks 后走 cleanup；(5) audioEnabled=false 直接不进入 if | gain→0 + osc.stop() + disconnect；但 roomAmbientTimer 有 clearTimeout（此处实际未用到 setTimeout 的 loop，直接 osc 持续） | 关音效：stopRoomAmbient + resetRoomAmbientFlag 下次重开恢复 | 未处理 suspend/resume |
| **Room Ambient（ambient.ts 新版，带粉噪+LFO+2 谐波）** | 独立 AudioContext + ambientGain；`playRoomAmbient(roomId)`：fundamental + 2f harmonic + biquad lowpassed pink noise + LFO FM modulation | Ambient（Sfx 外部实现 2） | `ArenaPage.tsx useEffect`：`phase==='playing' && !briefingOpen` → 进 living 第一次 playRoomAmbient，每次切 currentRoom 触发 useEffect 再 play（实际函数内部 `currentRoomId===roomId && isPlaying` 早返回） | ✅ fund + harm 两个 osc 持续 loop；pink-noise AudioBufferSourceNode.loop=true | 每房间 config.volume 0.05~0.1 + noiseVolume 0.025~0.04；ambientGain 4s ramp 到 1；整体远低于 BGM 音量（BGM masterGain max 0.7） | `currentRoomId===roomId && isPlaying` 早返回 + 先 `stopAmbient()` 2s ramp clearAmbient 清理旧 node，叠播极低风险；⚠️ 与 sfx.ts 的 ROOM_AMBIENT_CONFIG 旧版 **同时进行** → 两套 ambient 叠加播放（虽然都很轻） | 无 | All tasks | Arena | (1) isAudioEnabled()=true；(2) `ArenaPage.playRoomAmbient(currentRoom)` useEffect deps 变更触发 | (1) stopAmbient() 2s fade ambientGain to 0 + setTimeout(clearAmbient,2000)；(2) stopAmbientImmediate() gain 即时 0 + clearAmbient 立刻断所有 osc/LFO/noise；(3) toggleAudioEnabled(false) 调 stopAmbientImmediate；(4) ArenaPage cleanup 调 stopAmbientImmediate；(5) Result 点"返回任务"按钮 stopAllSfx（sfx 端）+ stopAmbientImmediate（ambient 端）= 两边都关 | setTimeout 2s 后 clearAmbient：遍历 oscillators[] / lfoOscillators[] stop+disconnect；noise stop+disconnect；noiseGain disconnect；ambientGain 0 但**不 close AC** | 关音效 stopAmbientImmediate 立刻 0 + 清；开音效不会重启 ambient，除非切房间 / 切 task | 未处理 suspend/resume；`playRoomAmbient` 先 lazy create AC，但不 resume() |
| **Chaos Ambient（saw LFO-modulated）** | sfx.ts module：ambientOscillator + ambientGain + ambientLfo + ambientLfoGain；saw 80-30Hz 下探；LFO 0.3-1.1Hz 调制 freq；chaosAmbientStoppedAt 500ms 冷重启保护 | Chaos | `Scene3D.tsx` 或其他 frame loop 调 updateChaosAmbient(chaosValue)；chaosSlice triggerChaosEffect 只播 warning_sfx，ambient 是每帧 update 独立驱动 | ✅ osc/lfo start 后 loop 无限；gain 动态随 chaosValue 变 | targetGain = normalizedChaos * 0.04（很轻，≤1%） | normalizedChaos<0.1 停止；同一 chaos 水平持续 update 复用实例不重建；`chaosAmbientStoppedAt` 防止 stop/start 抖动 500ms 内不重启 | 0.1 阈值（10% 混乱） | All tasks | Arena | (1) isEnabled && audioContext；(2) chaosValue>=10（normalized>=0.1） | (1) normalizedChaos<0.1 → stopChaosAmbient()；(2) toggleAudioEnabled(false) 调用 stopChaosAmbient；(3) phase=result/aborted 调 stopChaosAmbient（taskSlice.setGamePhase）；(4) stopAllSfx() 关所有；(5) ArenaPage unmount / beforeunload cleanup | gain 立即 0（cancelScheduled 再 assign）+ osc/lfo stop+disconnect；gain/lfoGain 断 + null 化；`chaosAmbientStoppedAt = Date.now()` 防抖动立即重启 | 关音效立刻清并置 null；开音效需下一次 updateChaosAmbient 调用（chaos 还要≥10 才起） | 未处理 suspend/resume |

**关键注册表发现**：

1. `task_complete` SFX 已定义但未在 slice 中触发（实际用 `level_complete`）。`sink_water/dishwasher_start/trash_drop/drag_object` 4 个已定义 SFX 未被调用。
2. **两套 Room Ambient 并存**：`sfx.ts ROOM_AMBIENT_CONFIG`（HUD useEffect 调用）+ `ambient.ts playRoomAmbient`（ArenaPage useEffect 调用） → 二者都在 phase=playing 切房间时同时创建叠加。虽然两者都 < 0.1 音量极轻，但属于冗余架构/可叠加风险（六、A6 重点）。
3. `phone_ring` 单次 0.6s 纯 envelope 而非"电话响铃循环"，所以"停止条件"主要靠"不再触发新 phone event"，而不是 stop 现有音。Leave-Home 专项里讨论。
4. `time_warning` 只覆盖 30s/10s 两次；5s 临界档缺失；非每秒重复，靠 previousRemainingSeconds 门槛判断，所以不存在叠播。

---

## 三、启动与停止生命周期矩阵

### 3.1 音频生命周期关键事件 × 清理动作

| 触发事件 | stopBgm (soft) | stopBgmImmediate | stopAllSfxInstances | stopChaosAmbient | stopRoomAmbient (sfx 内部 ambient) | stopAmbient (ambient.ts soft) | stopAmbientImmediate | close AudioContext? | 影响 playSfx 顶部 isEnabled 门? |
|----------|----------------|------------------|---------------------|------------------|-----------------------------------|-------------------------------|----------------------|---------------------|--------------------------------|
| `ArenaPage` unmount（navigate away） cleanup | ❌（仅调 stopBgmImmediate） | ✅ L152 | ✅ stopAllSfx L154 → 含实例+chaos+room | ✅ stopAllSfx 内含 | ✅ stopAllSfx 内含 stopRoomAmbient | ❌（**漏了**！ArenaPage cleanup 只写 stopAmbientImmediate；此为 soft 未调） | ✅ L153 | bgm.ts 被关一次（stopBgmImmediate close bgm AC）；sfx AC / ambient AC 未关 | ❌ 不改 flag（isEnabled 值不变） |
| `window.beforeunload`（用户刷新/关页） | ❌ | ✅ handleCleanup L152 | ✅ L154 | ✅ 同上 | ✅ stopAllSfx | ❌ 漏 | ✅ L153 | 同 unmount | ❌ |
| Result 面板点「返回任务列表」按钮 | ❌ | ✅ ArenaPage L491 | ✅ L492 | ✅ stopAllSfx | ✅ stopAllSfx 内含 | ❌ 漏 | ❌（只关 sfx 侧，ambient 未关！**发现缺口**） | bgm.ts 被关；ambient.ts 未关未 muted → 若 ambient 还在 2s fade 中会"关不干净" | ❌ |
| phase==='probing' 任务完成（setGamePhase） | ❌（BGM 未被 setLevelCompleted 停止，BGM 持续播放到 navigate 去 /probe 后 Arena unmount 才关 → 约 1500ms narrative 期间仍播 BGM） | ❌ | ❌ | ✅ setGamePhase('result'/'aborted') 才会 stopChaosAmbient L279；probing 本身**不停止 chaos ambient**（缺口：probe 流程中 phase=probing 仍在 chaos level） | ❌（probing 不 stop sfx room ambient） | ❌ | ❌ | ❌ | ❌ |
| `toggleAudioEnabled(false)` 开关音效 | ❌ | ✅ useUiStore L72 | ✅ useUiStore L71 stopAllSfxInstances | ✅ L69 | ✅ L70 stopRoomAmbient | ❌（soft 未调；但 L73 有 stopAmbientImmediate） | ✅ L73 stopAmbientImmediate | bgm.ts AC 被关；sfx/ambient AC 不 close | ✅ isEnabled=false，isEnabled 门拦截所有 playSfx（下一段） |
| `toggleAudioEnabled(true)` 再开启 | ❌ 不自动恢复 BGM（需 phase+task 再变化才重放） | ❌ 不触发 | ❌ 不恢复实例（实例已被 stop，需要新 event/play 调用才建） | ❌ 不主动恢复，依赖下次 updateChaosAmbient（需要 chaos≥10 才会触发） | resetRoomAmbientFlag 允许下次 updateRoomAmbient 再启动（需切房间或 useEffect deps 变化） | ❌ | ❌ 不恢复，需下次 ArenaPage.playRoomAmbient 触发（一般 phase+task 再切换或 currentRoom 变更） | sfx.ts initAudio() 被调用（若已存在不重建）；bgm.ts 之前关了所以下一次 playBgm(taskId) 会重建 bgm AC；ambient.ts AC 未关直接复用 | ✅ 开 isEnabled 顶部拦截失效 |
| `initializeTask` 重置任务（切 taskId / 重开同 task） | ❌ （BGM 仍在播，HUD useEffect deps=[phase,task] 一般 phase 先变 playing 才会先 stopBgm 再重开；但若 initializeTask 未 phase 切到 briefing 再切 playing，BGM 可能残留 2s 到 fade 完） | ❌ （不硬关，依赖 HUD 的 phase==playing 触发 playBgm → 内部 `currentTaskId === taskId && isPlaying` 早退，以及 `stopBgm()` 先清旧） | ❌（不主动清；如果用户在 playing 态点了 task restart 但 phase 未先 exit playing，chaos ambient 可能残留到新任务 ⚠️ 小风险） | ❌（需要下一次 updateChaosAmbient 再评估；如果 resetTask 立即 restore chaos=0，下一帧 update 会 normalized<0.1 触发 stop） | ❌ 不主动清；下一次 HUD updateRoomAmbient 因 currentRoom 没变 → 直接 return → **chaos 清了但旧 room ambient 持续播**（gap） | ❌ 不主动清；currentRoomId 没变直接 return（新 task 但房间相同 → 旧 ambient 继续）❌ gap | ❌（同上） | ❌ （不 close AC） | ❌ 不变 |
| ResultPage 挂载 / ProbePage 挂载 / TaskSelectPage 挂载 / HomePage 挂载 | ❌（这些页面完全无 audio 清理，依赖 Arena unmount 已经清；如果 URL 手动改到 /result 跳过 Arena unmount → 可能残留 <2s BGM） | ❌ 无代码 | ❌ | ❌ 无代码 | ❌ 无代码 | ❌ 无代码 | ❌ 无代码 | ❌ 无代码 | ❌ 不变 |
| 任务超时（tickElapsed→setLevelFailed→phase=probing） | ❌ BGM 到 navigate 出 Arena 才会被 unmount 关（~1.5s narrative） | ❌ | ❌ （phase=probing 非 result/aborted，所以 chaosAmbient 不关） | ❌（setGamePhase 只对 'result'/'aborted' stopChaos；probing 不关） | ❌ probing 不关 sfx room ambient | ❌ 不关 ambient.ts room | ❌ 不关 | ❌ | ❌ |
| 混乱值 100% 过载 → setLevelFailed('混乱值过载')→phase=probing | 同上 | 同上 | 同上 | 同上（chaos ambient 虽然不再 update，但之前已建立的实例 max volume 0.04 仍然播到 unmount 才关 ⚠️ 小缺口） | 同上 | 同上 | 同上 | 同上 | 同上 |

### 3.2 生命周期状态总结（审计发现）

| 项目 | 状态 | 备注 |
|------|------|------|
| Arena unmount 清理 completeness | ⚠️ 基本齐；ambient soft 不跑但 Immediate 齐，**Result 点返回任务列表只关 sfx.stopAllSfx + bgmImmediate，漏 ambient.ts stopAmbientImmediate**（ArenaPage L491-L493 只写 stopBgmImmediate+stopAllSfx） | 见六. P1 |
| phase=probing 时 BGM + chaos ambient 持续 | ⚠️ 存在 1.5~2s BGM/ch aos 持续；phase=probing 未 stopChaosAmbient（stopChaosAmbient 只在 setGamePhase('result'/'aborted') 触发） | 见六. P2 |
| initializeTask 重开任务 / 切任务房间相同情况下 ambient 残留 | ❗ gap：Ambient 新旧 task 相同房间 → same currentRoomId → `currentRoomId===roomId && isPlaying` 直接 return → 旧 ambient 与新任务 BGM 混合（房间和任务组合不一致的音色） | 见六. P1 |
| AudioContext close 频次 | 仅 stopBgmImmediate 会关 bgm AC；其他 2 个 AC 从未 close（导致 Chrome devtools memory 标签下 AudioNode 数可能单向增长，但 Oscillator/Node 被 stop 后应自动 GC，风险低） | P2 低优先级 |
| 切任务 BGM 双任务叠播 | 基本防护齐：playBgm(taskId) 先 stopBgm() 清旧 setTimeout；但 clearAllTracks 只能清 state.timer，已 schedule 正在播放中的 oscillator 因为 masterGain 2s→0 音量 fade 所以听感不叠；`currentTaskId===taskId` 防重复。100ms 内两次切 task 可能有 <100ms 叠前任务首个 note，极低风险。 | 低风险 |
| 5s countdown 档 time_warning | 缺口：只在 30/10 各触发一次；5s 档未定义/未触发。 | P2 体验 |

---

## 四、开关行为矩阵（10 项真实行为审计）

基于：E2E navigation-audio 3/4 项 passed（第一项失败原因是旧测试引用了 `back-to-tasks` data-testid，当前 HUD/ArenaPage 没有这个 testid，属测试错位而非音频失效）；加上 breakfast/night-patrol/laundry/clean-table 4 关 e2e 全 11 passed，证明交互+命令路径在 audioEnabled=true 环境下完全正常。

### 4.1 10 项开关场景（基于源码跟踪，结合行为）

| 场景编号 | 用例 | 预期（Expected） | 实际（Actual，从源码与生命周期推断 + 单测佐证） | PASS / FAIL | activeAudioCount 前后 | stale timer | duplicate loop | console errors | 是否补播旧事件 |
|---------|------|------------------|-------------------------------------------|-------------|---------------------|-------------|----------------|---------------|-----------------|
| 1 | 首页关闭音效 → 导航进入 Leave-Home → 开始任务 | 进入后：BGM 不播、所有 SFX 不响、ambient 不播；无残留 | `isEnabled=false` 顶部门拦截所有 playSfx；HUD playBgm(taskId) 一开始 `isAudioEnabled()=false` 直接 return；playRoomAmbient 不建节点；initAudio 也不会创建 AC。实际应全程 0 声 | ✅ PASS（依赖源码） | before: N/A；after: getActiveContinuousSfxCount()=0，isBgmPlaying=false | ❌ 无（开关 false 时 stopAll） | ❌ 无 | 应该 0（stopBgmImmediate 无副作用） | ❌ 不补播（关闭期间所有 play* 调用直接 return，无事件缓冲重播） |
| 2 | 手机铃声 scripted event 触发中 → 立即关音效 | 立刻静音（phone_ring 还在 0.6s ADSR 中：sfx 端 playSfx 正在发声的 oscillator 没有 stop，只靠 toggle false 时 stopAllSfxInstances() 强关当前活跃实例） | `toggleAudioEnabled(false)` L69-73：stopChaosAmbient + stopRoomAmbient + **stopAllSfxInstances** + **stopBgmImmediate** + stopAmbientImmediate。⚠️ stopAllSfxInstances 只关**进入 activeSfxOscillators Set** 的实例，而手机 ring 使用 `playSfx('phone_ring')`（走 L272 playSfx 非 playSfxWithControl），**不加入 Set** → ❗已在 0.6s 播放途中的 phone_ring 不会被 stopAllSfxInstances 立刻关闭，只能自然播放到 0.6s 结束（这是一个漏网：playSfx 与 playSfxWithControl 双路径不一致） | ⚠️ FAIL（部分：关掉了未来事件但 0.6s 内响着的 ring 未被立刻 mute，仍播到结尾才停） | before: activeSfxOscillators.size 可能 0（因为走的 playSfx 版本无 Set）；after: 0（但实际耳朵仍听 0.6s） | ❌ 无残留 timer（stopBgmImmediate 清所有 setTimeout） | ❌ 无 duplicate loop | 无 console error | ❌ 不补 |
| 3 | 关闭音效状态下：触发 cat_event / 拾取/放置 / 记忆更新 | 全部不响，且打开后也不"回放补上" | `isEnabled=false` 顶部门：playSfx 首行 return；isAudioEnabled() if 门：taskSlice 中 `startPlaying/setLevelCompleted/time_warning` 都显式 if 门 → 调用链提前中断；isAudioEnabled() 门：ambient.ts/playRoomAmbient、bgm/playBgm 也 return。⚠️ **但 cat_event / phone_ring 的 playSfx 调用（taskSlice.ts L448/L450）缺少 `isAudioEnabled()` 显式 if 门** → 不过仍走 sfx.playSfx(id) top 门 `if(!isEnabled)` return，所以行为正确，只是保护层级不同（其他地方写了双重门：slice if + sfx top if） | ✅ PASS（结果正确；但代码保护不一致见 P2） | 全程 active=0 | timer 仍被清（但这些是一次性 osc 无 timer） | 0 loop | 0 error | ❌ 不补 |
| 4 | 关闭 → 再开启音效 | 恢复播放；之前关闭期间积压的事件不补；重新开启后才会响应新的 play/BGM | 开启：`initSfxAudio()`（无副作用，只补建 AC 若还没） + `resetRoomAmbientFlag()`（允许 updateRoomAmbient 下次再建）；但 `playBgm(taskId)`/`updateRoomAmbient()`/`playRoomAmbient()`/`updateChaosAmbient()` 必须等到各自 useEffect/frame 下一次触发才重建。⚠️ 实际结果：**音效打开后若当前已经 playing 并且不切房间不重进任务，BGM 与 Ambient 不会立刻恢复**；因为 HUD/Arena useEffect deps 没变化不会跑 playBgm / playRoomAmbient。只有下一帧 chaos 更新到≥10 时 chaos ambient 才会再起 | ⚠️ 部分 FAIL（开关打开后「BGM/Ambient 静默直到下一事件」，需要用户切房间或重新 startPlaying 才能听到 BGM 恢复 → 与预期"立刻恢复"不符） | after 打开：isBgmPlaying=false 仍旧值（stopBgmImmediate 置 isPlaying=false 没复位）；ambient 仍 null；只有新 pick 等单次 SFX 会立即响（因为 toggle setAudioEnabled(true) 后 isEnabled=true，playSfx 即可） | ❌ 无 stale（全部清了） | ❌ 无 | 0 error | ❌ 不补积压 |
| 5 | Arena → Result → Probe → Tasks → 再开任务 | 每个页面切换后：离开 Arena 立即 stop 所有音频；进入非 Arena 无声音；回任务选择页 0 声 | `ArenaPage` unmount cleanup：stopBgmImmediate + stopAmbientImmediate + stopAllSfx 三件套齐（✅ 会清 BGM/chaos/sfx 实例/sfx room ambient）。⚠️ 但 `stopAllSfx` 只调 `stopChaosAmbient/stopRoomAmbient/stopAllSfxInstances`（sfx.ts 内部），**不调 bgm/ambient 其他模块，但上方已经逐个写了**。navigation-audio 第 1 项失败原因是："back-to-tasks" testid 在 ArenaPage 里找不到（现在 Result 面板按钮是「返回」，没 testid），不是音频本身 stop 问题；navigation-audio 第 2 项 `page.goBack()` 通过 → 音频停止了。综合：回退正确 stop ✅；点击 Result 返回任务按钮也是 stopBgmImmediate+stopAllSfx，但缺少 stopAmbientImmediate（见 3.1）→ 小风险 2s fade。 | ✅ 基本 PASS（Result 返回列表漏 stopAmbientImmediate 计 P1，此场景用浏览器后退没问题） | 离开 Arena: isBgmPlaying=false，getActiveContinuousSfxCount()=0，hasActiveRoomAmbient=false，isAmbientPlaying=false | navigation-audio 3/4 passed 1 fail = 测试错位（testid 缺失，非音频） | ❌ （goBack 路径全清） | 0 error | ❌ |
| 6 | 重开同一任务（Result 点「再玩一次」，实际 flow 是 initializeTask + 再进入） | 旧任务的 BGM/ambient/chaos 不渗入新任务；首次 scripted event cat/phone 可再次响 | initializeTask：taskSlice.initializeTask 重置 entities/containers/stages/triggeredEvents，但 **不 stop 任何旧 audio**。依赖 HUD useEffect 切 phase==playing → 调用 playBgm(new taskId) → `stopBgm()` soft 清旧 setTimeout；所以 BGM 有 2s fade；Ambient 如果房间未变（task 相同房间相同）→ currentRoomId 不变 → 旧 ambient 继续（漏！）；Cat/phone 等 triggeredEvents Set 被重置为空，所以新事件可重新触发（✅ 新 task 中 cat/phone 可再响，见第五专项）。 | ⚠️ 半 PASS：BGM OK 但 ambient 相同房间会残留到新任务 | task 切换后 bgm.isPlaying 重新=true（新 taskId）；ambient 当前房间不变 → old ambient 仍 1（计数 1 但错误属于旧任务音色） | timer 被 clearAllTracks（playBgm 先 stopBgm） | 房间相同 ambient 不重建 → 无 loop 叠加但音色是旧任务 context | 0 error | ❌ 不补 |
| 7 | TaskSelect 选 5 个不同任务连续切换进入 → 退出 | 每关 BGM 只有当前任务一份，无叠加/无跨关卡渗入 | playBgm(taskId)：若 `currentTaskId === taskId && isPlaying` return；否则 `stopBgm()` + startAllLayers。切换 taskId=A→B：先 stopBgm（masterGain 2s 到 0）再启动 B 的 layer；听感上 A 淡出 / B 淡入 ≈ 无重叠（实际 A 还有 2s fade，BGM A/B 叠加量 ≤ masterGain*A 的 2s 淡出中 volume）。非严格无叠加但用户体验 OK。连续切 5 关后 exit 会触发 ArenaPage cleanup → 一次性 stop 齐。 | ✅ PASS（体验 OK） | bgm.isPlaying: each after: true；after exit: false；ambient 仅当前房间 1，无 loop 计数增长（每次切房间 stopAmbient clearAmbient 再起，node 会断） | clearAllTracks 每次 playBgm 先执行，无 stale timer | BGM 最多 2s 叠，node 数量有限（4 layer） | 0 error（Playwright 11 e2e passed 跨任务） | ❌ 不补 |
| 8 | 连续 toggleAudioEnabled × 10（每秒一次） | 无 crash；最后状态取决于最后一次 toggle；无「重复创建/内存无限增长」 | toggle 10 次的代价：(a) stopBgmImmediate 会 close bgm.ts AC，第 9 次（偶数次开）playBgm(taskId) 无事件驱动 → 不重建 → AC 仍 null；但再 1 次 toggle 开 → setAudioEnabled(true) 不会主动 rebuild bgm AC；第 10 次关 → stopBgmImmediate 对 null AC 安全；最终 isEnabled=false，所有 play* 被拦截。结论：状态一致，无 crash，只是偶数次开后 BGM/Ambient 无法自动恢复（这是 #4 场景的同一 issue）。 | ✅ PASS（不崩，状态一致；BGM 静默是已知 P2 体验） | activeCount: 0；all flags: false | timer 每次奇数 toggle false 都清 1 次 → 最终 0 | loop 节点被 stop 每次奇数 toggle → 无限增长风险低 | 0 error | ❌ 不补积压 |
| 9 | 设定 audioEnabled=false → F5 / ⌘R 刷新 → 再入任务 | 偏好持久化生效（音效仍关），无"补播 / 忘记关" | zustand persist('home-mem-ui-state')：localStorage.getItem('home-mem-ui-state').state.audioEnabled = false；`onRehydrateStorage` 后回调 setAudioEnabled(state.audioEnabled) 且 `audioEnabled=false` 分支立刻 stopChaosAmbient/stopRoomAmbient/stopAllSfxInstances/stopBgmImmediate/stopAmbientImmediate 五件套 → 即使 AC 之前在 play 也立刻关。✅ 持久化完整。 | ✅ PASS（源码逻辑完全一致） | 刷新后：仍 activeCount=0, isPlaying=false | 0 | 0 | 0 error | ❌ 不补 |
| 10 | 浏览器切后台（Tab 隐藏）几分钟 → 切回前台 | （浏览器自身 Audio 策略：后台 Chrome 会节流 timers + AudioContext 可能 state='interrupted' 或 'running' 但 setInterval 节流；本项目 BGM/ambient 使用 setTimeout 递归 + WebAudio osc 持续。实际表现：后台时 BGM setTimeout 被节流到 1s 粒度或停 → 回前台后 BGM note timing 错乱但音量仍正确（ambient/chaos ambient 纯 osc，持续发声无变化，后台仍播）；sfx 只有用户交互才触发。本项目未监听 document visibilitychange，无 resume() 调用 / 无 setTimeout 漂移修正 → 回前台后 BGM note 错乱直到 stopBgm/再启动。⚠️ 但**非致命，不在 P0**） | ⚠️ PASS（状态未崩；BGM 节奏可能飘需下次切任务/重进才恢复；Ambient 纯 osc 依旧持续 → 正常） | 前后 activeCount: 不变 ≈ 1（ambient）+（BGM playing=1 仍 true，但 note timer 滞后） | timer 后台节流 → 回前台后密集补发前几秒 → 会出现短时间 duplicate BGM notes；几秒后 self correct（因为每次 setTimeout 是根据前一个 duration 下一个时间；但节流期内 clock 仍走） | 短时间（回到前台的 1~2s）BGM notes 堆量 | 无 console error（suspend 未处理但 Chrome 不会 throw，只是节流） | ❌ 不补 |

---

## 五、Leave-Home 专项审计

### 5.1 手机铃声（phone_ring）停止条件 × 9 项

`phone_ring` 是 playSfx 单次 0.6s 发声，非循环，"停止条件" 实际分两类：
A. 正在播放途中能否被中断（立刻静音）；
B. 后续阶段是否还会继续触发新 phone event（是否不再响）。

源码中 taskSlice 触发 phone ring 的唯一路径：
- `triggerScriptedEvents()` → 每个 event 过 `triggeredEvents` Set 防重复 → 若 event.message 含 "震动"（在 leave-home.ts 脚本事件定义中）→ toastType='phone' → playSfx('phone_ring')

Leave-Home stages 的阶段推进决定 phone event 何时会发；另外 `closePhoneRing()` 类函数不存在（全局 grep 不到 stopPhoneRing）。

| 停止条件（用户要求验证） | 预期（Expected） | 实际（Actual，源码推导） | PASS / FAIL | 备注 |
|------------------------|------------------|--------------------------|-------------|------|
| A1. 进入卧室（transitionToRoom bedroom） | 进入卧室应立刻打断正在播放的 ring，并停止后续 phone event | (1) 正在播的 ring：因用 playSfx 非 playSfxWithControl → **不进入 activeSfxOscillators Set** → transition 不会 stop 任何 osc → 0.6s 内仍可听到（FAIL A类）；(2) 后续 phone event 触发要看 stage 推进 / 事件配置 → leave-home 阶段设计是手机位置在 bedroom 床头柜抽屉，triggeredEvents 在 transition 到 bedroom 前后如果仍有未 fire 的 phone 事件？需要看 task 配置；从命令流 E2E 实际通过看，不阻塞逻辑（只影响听感） | ⚠️ 类 A FAIL（正播中未 mute）但类 B（阶段机推进后不再发）OK | 仅 playSfx/playSfxWithControl 双轨：只有 playSfxWithControl 版本加入 active Set 能被 stopAllSfxInstances 停；但 taskSlice 所有 cat/phone/level/time 用 playSfx（旧版） → 都不能中途停（只能自然结束）。见 P0 / P1 |
| A2. 接近床头柜（nearby nightstand drawer） | 接近时打断 | 同上（无 proximity → stop ring 的调用；无 stopPhoneRing） | ⚠️ 类 A FAIL；类 B 要看 stage 是否变化让 phone event 不再发 | 同上 |
| A3. 打开抽屉（toggleContainer drawer open） | 打开立即停 | 同上：无中途 stop；但 entitySlice playSfx('drawer_open') 会在 drawer open 时覆盖听感（如果 ring 仍响，二者叠） | ⚠️ 类 A FAIL（drawer_open 叠加 ring 0.6s）；类 B 看 stage 是否推进到 pick phone 结束 phone 事件流 | 同上 |
| A4. 拿起手机（pickEntity obj-phone） | pick 立刻停 | entitySlice.pickEntity L49 只 playSfx('pick') 无 stop phone ring；pick 后 event 流理论阶段机会推进到不再触发 phone toast（类 B 通过） | ⚠️ 类 A FAIL；类 B PASS（first-level-command-flow 中 pickPhone2 之后应该没有再 phone 了，脚本通过） | 同上 |
| A5. 手机放进玄关托盘（place phone into tray） | 放入立刻停 | placeIntoContainer 成功 playSfx('place_success')，之后阶段机阶段推进，不再会有 phone event | ⚠️ 类 A 若还有残余 0.6s 则叠 +1 声；类 B 此后确实不再有 phone event（类 B PASS） | 同上 |
| A6. 任务重置（resetTask / initializeTask） | 重置应立刻停 + 新任务可重新 phone ring | initializeTask 不 stop 任何 audio（类 A 仍响残余）；但 triggeredEvents Set 被清空 → **新任务可重新触发 phone toast（类 B 完全 PASS）**，这一项对 cat 同理 | ⚠️ 类 A FAIL；类 B + 新任务可再次响 ✅ PASS | triggeredEvents Set 在 reset 里重建空 → 脚本重新 startPlaying 后 cat/phone event 可重新触发（这点反而正确） |
| A7. 任务完成（setLevelCompleted） | 完成立刻停 ring（残余停止）并结束后续 phone event | setLevelCompleted phase → probing。setLevelCompleted 没 stop phone，但此时 phase 改变后 UI 先 narrative 1500ms 再跳转 /probe，Arena 未 unmount。类 B：阶段已达到 levelCompleted 不会再 tick scriptedEvents？从 taskSlice 代码 tickElapsed 只在 playing 下会 triggerScriptedEvents。✅ playing=false → tickElapsed 跳过，所以不再产生新 phone toast；类 A：残余 ring 如果还在播，只能自然到 0.6s。 | ⚠️ 类 A FAIL（残余最多 0.6s）；类 B ✅ PASS（无新事件） | 同上，playSfx/playSfxWithControl 双轨 |
| A8. 离开 Arena（unmount / navigate / back） | leave 立刻 stop ring（残余静音） | ArenaPage cleanup / beforeunload：stopBgmImmediate + stopAmbientImmediate + **stopAllSfx()** → stopAllSfx 调用 stopAllSfxInstances（但 phone ring 没进 Set），以及 stopChaosAmbient stopRoomAmbient。⚠️ **正在播的 phone ring 不在 activeSfxOscillators Set → 仍可能响到 0.6s 尾段**。虽然 audioContext 若被关闭（bgm.ts 那只 AC 被关，但 sfx.ts / ambient.ts 未关），sfx 节点仍会持续运行到 stop(duration) 调度时间，不会立刻静音。**这是 P1 缺口** | ⚠️ 类 A FAIL（残余 < 0.6s）；类 B 肯定 PASS（unmount 后不再 tick） | 所有一次性 sfx 若要立刻停，必须全部迁移到 playSfxWithControl 版本，并在 stopAllSfx 时挨个 stop 入 Set 的节点 |
| A9. 关闭音效（toggleAudioEnabled=false） | 关闭立即静音 ring 残余 | 同 4.2 场景 2：stopAllSfxInstances 只关 Set 内的 osc，phone ring 走 playSfx 版 → 仍残余 0.6s（直到 duration 结束） | ❌ FAIL（类 A 立即静音失败） | P1 根因同上 |

**Phone Ring 总结**：9 条件类 B（后续不再发新事件）基本都依赖阶段机推进 / triggeredEvents Set 重置 / phase 退出 playing → **实际流程上没有"继续疯狂响铃"问题**；但类 A（中途静音）9 项有 9 项都做不到，因为 taskSlice 调用 `playSfx('phone_ring')`（老版），没有加入 activeSfxOscillators 集合，后续无法被任何 stop 函数中止，只能等其 `oscillator.stop(now + 0.6)` 在 0.6s 后自然结束。**若把 taskSlice / entitySlice / memorySlice / chaosSlice / playerSlice 所有 playSfx 调用迁移到 playSfxWithControl 并在 stopAllSfx / toggleAudioEnabled(false) 时完整遍历 Set 则可修复。**（P0/P1 改进）

### 5.2 猫事件（cat_event）幂等性与重渲染 / 重开任务

| 检查项 | 预期 | 实际（源码推断 + first-level E2E 佐证） | PASS/FAIL |
|--------|------|----------------------------------------|-----------|
| 每次 cat 脚本事件只播一次 cat_event | 单次 event.id → 只 playSfx 一次 | 触发条件：`if (event.message) { ... if (toastType==='cat') playSfx('cat_event') }` 外面有 `if (!triggeredEvents.has(event.id)) { … }` L398 外大循环 → 同一 event.id 通过 Set 幂等 → 只触发一次。✅ React re-render（taskSlice 其他状态变）不会重入这个循环，因为循环是 for event of task.scriptedEvents，匹配 elapsed >= triggerTime 才触发，外层是 triggeredEvents Set。✓ | ✅ PASS |
| React 重渲染 / StrictMode double render 不重复播放 cat | 0 重复 | triggeredEvents Set + for 循环只在 tickElapsed 内部运行；tickElapsed 是 useGameStore 中每一帧调；StrictMode double render 只对 React 组件函数，不会让 Zustand reducer 跑两次，store action 还是一次 → 无重复 | ✅ PASS |
| 重开任务后 cat 可再次正常播放 | reset 后 cat 重新在 correct 时机 fire + playSfx 一次 | initializeTask 时 taskSlice.resetContainers → triggeredEvents = new Set() 空 → `triggerScriptedEvents()` 重新评估所有 scripted event → 同一 event.id 再次触发 → playSfx('cat_event') 可再次响。first-level-command-flow E2E 实际跑通关（6 passed）→ cat 事件触发正常。✅ | ✅ PASS |
| 离开页面 / 退出后 cat 残留播放 < 0.4s | 退出后立即静音（残余 < 100ms 可接受） | cat 同样用 playSfx（非 playSfxWithControl）→ 不加入 activeSfxOscillators Set，退出 ArenaPage 时 stopAllSfxInstances 对它无效 → 可能残余响最多 0.4s（config.duration=0.4）。⚠️ 同 phone ring：未进 Set 被漏掉 | ⚠️ 类 A FAIL；P1 修复 |

### 5.3 倒计时 time_warning：30/10/5 秒档

| 档位 | 是否有代码触发 | 机制 | 是否每秒叠播 | 完成 / 失败后是否立即不再发 |
|------|----------------|------|--------------|------------------------------|
| ≤ 30s 档 | ✅ tickElapsed L516 remainingSeconds<=30 && previousRemainingSeconds>30 → **恰好跨 30s 时 1 次** | 单次 playSfx('time_warning') | ❌ 每秒：只在跨阈值那帧触发 1 次；threshold 对 previous 比对 | ✅ 完成/失败后 elapsedMs 不再增长（phase!='playing' 直接 return）→ 之后不发；但正在播中的 0.3s 不被硬停 |
| ≤ 10s 档 | ✅ L523 same pattern | 同上，跨 10s 阈值 1 次 | ❌ 每秒不叠；最多 1 次 | 同上 |
| ≤ 5s 档 | ❌ **缺失**（SFX_CONFIG 只一个 time_warning 音色；tickElapsed 没写 5s 分支） | — | — | — |
| 每秒重复播风险 | — | 对 previous 做比较，只在跨阈值时触发 → 不会因 60fps tick 每秒播 N 次 | ✅ 不叠播（每档只最多 1 次 per session） | 超时→setLevelFailed 后 phase 变 probing 退出 playing tick → 立刻不再发新档 ✅ |

**倒计时专项结论**：30s / 10s 逻辑正确且不叠播；**缺少 5s 档**（属于 P2 体验缺口）。所有 time_warning 同样使用 playSfx 老版本，未入 activeSfxOscillators Set，所以用户切音效 off / 退出 Arena 的瞬间仍可能有 0.3s 残余（P1 同一根因）。

---

## 六、五关共享回归（跨任务音频行为）

基于：breakfast / night-patrol / laundry-sort / clean-table / leave-home 命令流 E2E：11 passed（4 关各自 command-flow + leave-home first-level）。命令流测试会真实 pick 实体 / place / saveMemory / saveHint / stage transitions → 每关会触发 pick/place/memory_save/memory_outdated/time_warning/chaos_warning/dialog character_speak 等音频调用。E2E 全通过 = 跨任务音频系统没有导致异常（crash / phase 错乱 / 断言失败）。

### 6.1 五关 BGM 行为

| 检查项 | 预期 | 实际（源码 + E2E 结果） | PASS/FAIL |
|--------|------|------------------------|-----------|
| 进入任务时只存在 1 段 BGM（双任务 BGM 不叠加） | 同任务重进 / 切任务不会两段 BGM 同响（<100ms 过渡 OK） | playBgm(taskId) 先 stopBgm → clearAllTracks 清 4 layer timer；masterGain 2 秒 fade to 0（旧任务声音会淡出 2 秒，不是 0 重叠；但 2s fade ≈ 听觉上"渐出"，没有两个 task 主旋律同时奏的问题） | ✅ 体验 PASS（无错误叠加）；代码上是淡出而不是硬切，但符合音乐预期 |
| 离开任务后 BGM 残留到 Result / Tasks / Home | 离开应 stop；非 Arena 页面 0 BGM | Arena unmount cleanup 强制 stopBgmImmediate → 立刻 isPlaying=false + masterGain=0 + close bgm AC → 无残留。页面后退（goBack）通过 navigation-audio 第二项。Result "返回任务" 按钮也单独写 stopBgmImmediate L491。✅ | ✅ PASS |
| 重开后 AudioContext / Audio 实例重复创建累积 → Chrome 警告 "60 AudioContext per page" 风险 | 同一任务重开 10 次不应 > 3~5 个 AC | 背景：sfx.ts / ambient.ts 各自独立 AC，**永不主动 close**（除非 stopBgmImmediate 只关 bgm.ts 自己的）；每次重任务 toggle 开关关 = 触发 stopBgmImmediate 才关 bgm AC；bgm AC 关闭后下一次 playBgm 会重建（新增 1 个）。若用户频繁切开关（10×/分钟），bgm AC 可能有短暂 close → 新建，但 Chrome 60 上限很难触达。E2E 命令流 11 场通关没有 console "AC 达到上限"。风险低。 | ✅ PASS（低风险） |
| 上一任务的 SFX / ambient 音色进入下一任务 | 任务切换后 ambient 与 BGM 都换成新任务 | BGM：切 taskId=A→B 会新启动配置（✅）；Ambient：若 A/B 任务共用相同房间（例如两关都从 living 起步）→ ArenaPage playRoomAmbient 判定 currentRoomId 未变，ambient.ts 那套继续 → **上一任务配置下的 ambient 音色没换！** 另外 HUD 的 sfx room ambient 同理。双重 ambient 还叠着旧任务 room tone，虽然音量 < 0.1，但是 bug。 | ❌ FAIL（属于 P1 架构级：Ambient 没有区分 taskId 变化重启动） |
| 音效关闭对 5 关一致生效（某关不能"偷偷响"） | 所有 5 关所有 play* 入口都遵守 isEnabled / isAudioEnabled 门 | 检查：taskSlice 的 startPlaying / level_complete / time_warning 显式 if (isAudioEnabled())；entitySlice 的 pick/place/container 全部走 playSfx() 顶部 isEnabled 门；memorySlice 的 save/outdated 走 playSfx top 门；chaosSlice 的 chaos_warning 走 playChaosWarning（内部调用 playSfx top 门）；dialog characterSpeak → playSfx；HUD playBgm(taskId) 首行 isAudioEnabled() 门；ArenaPage playRoomAmbient（ambient.ts）首行 isAudioEnabled 门。所有 5 关共用这些入口 → 5 关均一致生效。✅ | ✅ PASS |

### 6.2 BGM_CONFIG 覆盖矩阵

| taskId | BGM_CONFIG 存在 | key | mood | layers |
|--------|-----------------|-----|------|--------|
| task-leave-home | ✅ L34 bgm.ts | C | hopeful | melody/chords/bass 3 层 |
| task-clean-table | ✅ L60 | Dm | mysterious | 4 层（+percussion） |
| task-laundry-sort | ✅ L92 | F | calm | 3 层 |
| task-breakfast | ✅ L118 | G | hopeful | 4 层（+percussion） |
| task-night-patrol | ❌ 走 DEFAULT_BGM L152（C, calm, 3 层） | C | calm | 3 层（无 percussion） |

✅ 5 关无缺；night-patrol 虽没定制但有默认，仍可用。非 bug。

---

## 七、React / Web Audio 生命周期审计（A7 要求）

按源码逐行审查每个 play* / new AudioContext 调用处 + useEffect。

### 7.1 Audio / AudioContext 实例是否在 render 阶段 new？

| 文件 | 相关代码 | 是否 render 阶段 new? | 风险 |
|------|----------|---------------------|------|
| `sfx.ts` initAudio / playSfx / playChord / updateRoomAmbient / updateChaosAmbient / playFootstep / playChaosWarning / playCharacterSpeak / stopChaosAmbient / startRoomAmbient ... | 全部在函数内部被调用时 lazy create new AudioContext / new Oscillator 等，**不写在 React 组件函数体顶层**。全部由 useEffect（HUD/Arena）/ slice reducer（entity/memory/task 等）/ user gesture 命令触发 → 不在 render 期间执行。 | ✅ 正确；无"每帧 new 1000 个 AudioContext"风险 | 无 |
| `bgm.ts initAudioContext()` | 被 `playBgm(taskId)` 调用 → playBgm 由 HUD useEffect(phase=playing) 触发 → 不在 render。 | ✅ 正确 | 无 |
| `ambient.ts initAudioContext()` | 被 `playRoomAmbient(roomId)` 调用 → ArenaPage useEffect(phase/currentRoom/briefingOpen) → 不在 render。 | ✅ 正确 | 无 |
| 所有组件（HomePage / TaskSelectPage / Button / HUD 等） | grep 无 `new Audio(` / `new AudioContext(` 在组件函数体内直接使用。AudioInitializer 仅同步 flag 不 new。 | ✅ 全局**零处**在组件 render 创建 Audio 节点。 | 完美。 |

### 7.2 useEffect cleanup 完整度

| 组件 | useEffect 生命周期 | cleanup return | 审计结果 |
|------|-------------------|----------------|----------|
| `AudioInitializer`（L7-L9） | dep=[audioEnabled]，仅 initAudioEnabled(audioEnabled) | ❌ 无 return 清理 | 本身只是同步 Zustand → 模块 flag；无需 undo（isEnabled 是持久状态）。无副作用残留（不建 node）→✅ 正确 |
| `ArenaPage`（L144-L170） | dep=[saveCurrentGame] 挂载期只跑一次 | ✅ return：removeEventListener('beforeunload') + 执行 handleCleanup（stopBgmImmediate / stopAmbientImmediate / stopAllSfx / stopAutoSave / saveCurrentGame） | 整体 cleanup 几乎齐；⚠️ 单**缺：handleCleanup 里没有 `stopAmbient(soft)` 不打紧（Immediate 已走）；但 Result 面板「返回」按钮 onClick L490-493 只写了 stopBgmImmediate + stopAllSfx，**漏 stopAmbientImmediate**（ambient.ts 房间环境音没被硬停）。这个 P1 gap 在 3.1 / 4.1 已提。 |
| `ArenaPage`（L71-L76） | dep=[currentRoom,phase,briefingOpen,triggerDialog] → playRoomAmbient + triggerDialog(roomEnter) | ❌ 无 return cleanup | playRoomAmbient 自己内部会先 stopAmbient 再建；但 component unmount 时这个 useEffect 不会 stop。整体被 L144 大 cleanup 覆盖 → 没问题。 |
| `ArenaPage`（L79-L95） | 订阅 eventBus `subscribeEvent` | ✅ return unsubscribe | 正确 ✅ |
| `ArenaPage`（L173-L182） | startAutoSave / stopAutoSave | ✅ return stopAutoSave | 正确 ✅ |
| `ArenaPage`（L202-L216） | levelCompleted/levelFailed/briefingOpen → showStats setTimeout | ✅ return clearTimeout | 正确 ✅ |
| `HUD`（L95-L105） | window resize listener | ✅ return removeEventListener | 正确 ✅ |
| `HUD`（L264-L267） | window keydown listener | ✅ return removeEventListener | 正确 ✅ |
| `HUD`（L269-L273） | phase+task → playBgm(taskId) | ❌ 无 cleanup（BGM 停止靠 L144 ArenaPage 大 cleanup） | 靠父级 unmount 统一清 OK；但如果 HUD 自己单独 unmount（理论不会，它是 Arena 子组件）会留 BGM。现实没问题 ✅ |
| `HUD`（L275-L279） | phase+currentRoom → updateRoomAmbient（sfx.ts 内部旧版 ambient） | ❌ 无 return cleanup（被 stopAllSfx 覆盖） | 同上 OK |
| `useDialog.ts` | 如果有 dialog subscription 则应有 cleanup | 从 useDialog 代码看（之前读过），dialogs 是内部状态机，无全局副作用 listener | OK |
| `useGameStore / slices` 内部：没有 useEffect，全部是 zustand action / reducer 纯函数 + 一些 setTimeout（toast/feedback 里） | feedbackSlice / toastStore 内部 setTimeout 1500ms / 2000ms / 500ms 等清理自身 state | 这些内部 setTimeout 的 timer ID 存在 slice 里吗？实际看：useToastStore L25 直接 setTimeout 而不把 ID 存 state，也没法在组件 unmount 时 clear（store 是全局）→ 如果关页面前 toast 还有 <2s 会继续触发 set state 写（但 Zustand 写不会崩）→ 属于 P3 无大害。 | P3 小缺口 |

### 7.3 timeout / interval 清理完备度

| 持有者 | 类型 | start | clear（是否总能执行） | 审计 |
|--------|------|-------|----------------------|------|
| **BGM trackStates[i].timer**（bgm.ts L181/257-259） | `setTimeout`（递归，驱动 note 循环） | playTrack 末尾 L257-259 | `clearAllTracks()` L197-205 会对所有 trackStates 调 clearTimeout(state.timer) + null 化；stopBgm() 先调用它 ✅；stopBgmImmediate 也调用 ✅ | ✅ 完全覆盖；每次切任务、关音效、离开 Arena 都清。 |
| **ambient.ts stopAmbient 的 setTimeout(clearAmbient, 2000)** L248-250 | `setTimeout` | stopAmbient 2s ramp down 后 clear 所有 ambient 节点 | ❌ 没有保存 timer ID，无法 interrupt。若 stopAmbient() 刚跑了 100ms 就调 stopAmbientImmediate 或页面关 → clearAmbient 仍会在 2s 后执行（但 node 已被 Immediate 断掉，只是重复 try/catch disconnect 空操作，不造成声音） | P2 内存风险可忽略；但无法打断 2s 等待的重复调用防御没了 |
| **sfx.ts roomAmbientTimer**（L553 / L572-574 / L615-617） | `setTimeout`（实际 code 逻辑上保存但 never set（代码看 updateRoomAmbient 有清未设；L572 只 if clear 没赋值；可能是预留 WIP）→ 始终 null） | 预留未使用 | resetRoomAmbient/stopRoomAmbient 都清；因为从未赋值，所以 OK | ✅ 无泄漏 |
| **saveSystem autoSaveTimer L49 / startAutoSave / stopAutoSave** | `setInterval`（L49） | L? startAutoSave 赋值；L? stopAutoSave clearInterval（从 ArenaPage cleanup 调用 stopAutoSave 看应该存在） | ArenaPage L155 调 stopAutoSave（L180 return）✅；但 initializeTask/切任务不 stop 也 OK（autoSave 全局按 interval 运行，saveCurrentGame 无任务则存"空"快照？需看逻辑，非音频相关风险） | 音频无关，跳过 |
| **toastStore / feedbackSlice / chaosSlice / entityShake / memorySaveEffect 内部**（1500ms/2000ms/500ms） | 多个 `setTimeout` 用于清 UI state | 直接 fire；**不保存 timer ID**（见 useToastStore L25-27、feedbackSlice 各 trigger* 都是本地 const 后不返回 ID 存） | 这些 timer 到期后只是把 Zustand store 内某个数组里 id filter 掉；若 store 里对象已被清空则 filter 空操作。**不会导致音频泄漏，但会让已经 unmount 的页面有后台 setState 警告？** 实际上 Zustand action 是全局 store 不是 component setState → React 不会警告，只是无意义写 → 风险 P3 极低 | P3 |
| **setInterval 全局**（saveSystem 那 1 处外无其他） | grep `setInterval` → audio 相关 0 处（除 autoSave 非音频） | — | — | ✅ 音频系统 0 setInterval 全部 setTimeout 递归 → 更易清理（clearAllTracks 已经逐 timer 清） |

### 7.4 `play()` Promise / `AudioContext.resume()` / autoplay 处理

| 检查点 | 现状（逐文件） | 合规？ |
|--------|----------------|--------|
| HTMLAudioElement.play() Promise catch | 本项目 0 HTMLAudioElement 全部 WebAudio | N/A ✅（没有 HTMLAudioElement 的坑） |
| OscillatorNode.start() 返回 void 不抛 Promise，但 AudioContext 为 suspended 时 start 调度静默；用户交互后是否 `audioContext.resume()` | **全音频三套 AC 没有一处调用 `.resume()`**。用户进入页面前 1 秒若没有任何点击/按键，AudioContext.state='suspended'。此时 initAudio/playSfx/playBgm 会正常建 osc 但实际 Chrome 会直到首次手势才恢复播放。实际效果是用户点击"开始任务"按钮（有手势）后所有音频恢复。→ 这一按钮点击本身就会解锁全局 autoplay 策略，一般 OK；但是如果用户进入页面点按钮后 Safari 仍 state=suspended（某些 Safari 版本要求点击事件的回调栈里显式 resume），本项目会出现"首声延迟 1 声"。 | ⚠️ P2：无显式 `resume()` 调用（首音解锁全靠浏览器隐式用户手势），在 Safari/移动端可能间歇性静音 |
| `oscillator.start(now)` / `connect()` 错误 try/catch | playSfx 未 try 包整个过程；start 可能在 audioContext closed 时 throw → 目前：bgmImmediate 会关 bgm AC，其他不关闭 sfx/ambient AC，所以大多数情况 OK；但若有人手动关 AC（非代码路径）会 throw；stopAllSfxInstances 里对 oscillator.stop() 有 try/catch ✅；其他 2 个 ambient 的 stop/disconnect 也全部 try/catch ✅。playBgm 内部 start 没有 try/catch | ⚠️ P2：playTrack / playSfx / playChord 新建 osc.start 全未包 try/catch，在极端 closed/suspended 时将冒泡到 onerror / 控制台 red error。实际 E2E 0 console error 说明在标准场景不会触发 |
| autoplay 依赖用户手势解锁 | 本项目的"开始任务"按钮是所有 BGM / ambient / sfx（除首次外）的统一起点手势 → 理论能解锁。但 `HomePage` 上的 toggle 音效按钮（如果用户点"音效关闭 → 再开启"），用户是点击按钮（= gesture），但我们在 toggleAudioEnabled 里只 initSfxAudio（懒建 AC 或复用），**没有调用 audioContext.resume()**。如果此时 AC 之前仍 suspended，恢复开启后音频可能不出声直到下一次"开始任务"重手势（P2 同 7.4 上）。 | 同上 P2 |

### 7.5 AudioContext 复用 / 并发上限

| 项目 | 状态 |
|------|------|
| AudioContext 数量 | 3 个并行（sfx + bgm + ambient），远低于 Chrome 60 上限；风险低 |
| 并发 Oscillator 峰值（BGM 4 layer 同时最多 4 osc + ambient fund + harm + 2 lfo + 1 noise + chaos osc + 1 lfo + footstep/sfx 瞬时 osc）≈ 15 左右 osc（正常） | 完全正常；无爆音风险；内存 OK |
| 同一 soundId 并发上限（每秒 100 次 pick？） | playSfx() 不设上限，但实际交互靠用户按键（~10 次/秒封顶）；且 place_error/memory_outdated 等瞬时音色 0.1~0.5s 快速结束 → 用户不会听到几千个叠加。实际设计上没有 Set 计数的并发控制：可做但非 P0/P1。 | ⚠️ P2 无并发上限（理论滥用可以建 10k osc，造成内存/GC 压力；但正常使用没事） |
| task reset 是否显式 stopTaskAudio（task 专属的所有音频事件） | ❌ 没有 stopTaskAudio 函数 / resetTask / initializeTask 都不调 stopBgm / stopAmbient / stopChaos / stopRoomAmbient → 靠 deps 变化和 phase 切 playing 自动清理 → 有 BGM 2s fade / ambient 房间相同不换等 P1 缺口 → 见三、六 | ❌ P1 |

---

## 八、P0 / P1 / P2 改进清单（不改动源码，仅审计）

| 优先级 | ID | 问题 | 影响面 / 触发条件 | 建议修复方向（本轮不改，仅记录） |
|--------|----|------|------------------|--------------------------------|
| P0 | AUD-P0-1 | **两套 Room Ambient 同时播放**（sfx.ts 内部 updateRoomAmbient + ambient.ts 外部 playRoomAmbient），都是 phase=playing 切房间时触发 → 双份 osc + noise 节点重复叠加 + 音色不一致（ROOM_AMBIENT_CONFIG freq 0.04 vs ambient.ts 新版 0.1 完全两套参数） | 所有 5 关所有用户；长期运行会造成 node 数翻倍（虽然量低）+ 音色浑浊（低频互相抵消/增强） | **删除其中一套**（建议：HUD.tsx 中去掉 updateRoomAmbient，保留 ArenaPage 调用的 ambient.ts 新版粉噪+LFO 实现）；或把 sfx.ts 的 ROOM_AMBIENT_CONFIG 标记 deprecated 并注释掉 HUD 那行 useEffect |
| P0 | AUD-P0-2 | **Result 面板点「返回任务列表」漏关 ambient.ts 房间环境音**：ArenaPage L491-L493 只写 stopBgmImmediate + stopAllSfx（sfx 内部），但 stopAmbientImmediate（ambient.ts 新版）没写。 | 用户在 Result 页点"返回"而不是靠浏览器后退 / navigate away：ambient.ts 版 osc/pink noise 将持续 2s fade（soft ramp 没有被触发，因为没调 stopAmbient 也没调 Immediate）→ 实际 gain 还在 1，播放中直到 2s setTimeout 自己完？不，Result 返回时没调，所以 ambient 继续响到**用户进下一个 Arena 之前**（可能 30 秒以上或永久） | 在 ArenaPage「返回」按钮 onClick 里加上 `stopAmbientImmediate()` 调用；或更健壮：封装一个 `stopAllAudio()` 统一三件套（BgmImmediate + stopAllSfx + stopAmbientImmediate），在 3 处清理（unmount/beforeunload/Result 返回）统一调用此函数 |
| P0 | AUD-P0-3 | **taskSlice/entitySlice 等 99% 调用使用旧 playSfx（不登记 Set）**导致：toggleAudioEnabled(false) / leave Arena / initializeTask 时 stopAllSfxInstances 无法硬停正在途中的 phone_ring / cat_event / time_warning / pick / place / memory_save / character_speak（全部没进 activeSfxOscillators Set）→ 残余 0.1~0.8s 继续响。最严重的是场景 9 关音效、A9 离开 Arena 的"立刻静音"承诺被破坏 | 全部真实用户；影响"关闭音效立即生效"的用户心理预期（听觉上仍有半秒尾音，虽短但期望与现实差） | 把所有调用 `playSfx(id)` 统一改为 `playSfxWithControl(id)`（后者已完整 onended 清理 Set）；并把 stopAllSfxInstances 调用加到所有硬停的 5 件套（toggleAudioEnabled / stopAllSfx / ArenaPage cleanup / Result 返回按钮）里。目前已在 toggle 调用，但漏了 phone/cat 等 playSfx 不进 Set。**OR**：反过来删除 playSfx()，把 playSfx 变成别名指向 playSfxWithControl，统一实现。 |
| P1 | AUD-P1-1 | **initializeTask / resetTask 没有 stopTaskAudio → 重开相同任务时 ambient.ts / sfx room ambient 不重启**（因为 currentRoomId === roomId 直接 return，不会换音色为新任务默认）；同时旧任务 BGM 在 phase=playing 不变的情况下可能 2s fade 尾段叠加新任务 BGM | 用户点击"再玩一次" / Result 后重新进入同任务 / 开发期间热加载任务场景 | 在 initializeTask 内部增加一个 stopAllAudioForTaskReset（或至少调 stopAmbientImmediate() + stopChaosAmbient() + stopRoomAmbient()），并把 bgm 的 `currentTaskId` 置 null，确保下一次 playBgm 强制重建；或者在 ArenaPage useEffect initializeTask 后额外 force 触发一次 ambient 重启（给 playRoomAmbient 增加 `force=true` 参数） |
| P1 | AUD-P1-2 | **开关音效 OFF → ON 之后 BGM / Ambient / Chaos 不会自动恢复**，除非用户切房间 / 重开任务或 phase 变化（触发 useEffect deps 变化才重跑 playBgm / playRoomAmbient）。开关只改变了 isEnabled 标志和 AC 初始化，但不会重放已停的 layer | 场景 4/8：用户开/关后"声音没了"？会误以为系统挂了；实际是只有下一次 pick/save 这种单次 SFX 会响（因为 playSfx 实时调用），BGM/Ambient 纯 loop 没事件触发不会重建 | toggleAudioEnabled(true) 分支里，主动调用：(a) `if (phase==='playing' && task) playBgm(task.id)`（需要从 uiStore 读 phase/task，或通过 window.dispatch 事件让 HUD/Arena 自己跑）；(b) 若 currentRoomId 有值则 `resetRoomAmbientFlag()` + `updateRoomAmbient(currentRoomId)` / `playRoomAmbient(currentRoomId)` 再触发一次；(c) 立刻 updateChaosAmbient(chaosValue)。更简洁方案：把 isEnabled 加入 HUD / ArenaPage 的 useEffect dependencies，当它 true→false→true 时重新跑对应的 play*（虽然 useEffect 依赖变多但行为正确） |
| P1 | AUD-P1-3 | **phase=probing 时 chaos ambient / BGM / ambient 不停**（只在 phase=result/aborted 才 stopChaosAmbient；probing = phase=probing，用户在 Result 前的 showStats 展示阶段仍能听到 chaos ambient 和 BGM，若此时 chaos≥10） | 任务完成/失败后 narration 展示阶段仍有混乱低频/任务 BGM 响，与"完成/失败"仪式感音乐氛围不符（尤其 levelCompleted 播了 level_complete，BGM 还在 hopeful 并行） | setLevelCompleted / setLevelFailed 内部或 setGamePhase('probing') 时立即 stopChaosAmbient；并把 BGM 从 stopBgm() 软停止（2s fade），不再等到 navigate 去 Probe 才 unmount Arena |
| P1 | AUD-P1-4 | **倒计时缺少 5s 档**，仅 30s / 10s；time_warning 音色相同可复用 1 种 | 最后 5 秒紧迫感不足 | taskSlice.tickElapsed 增加 `remainingSeconds<=5 && previousRemainingSeconds>5` 分支，调用 playSfx('time_warning')（可把 duration 调短 0.15s 制造"急促"感但不必新增 soundId） |
| P2 | AUD-P2-1 | **从未处理 AudioContext.resume() / state=suspended / autoplay 手势显式解锁**，完全依赖浏览器隐式恢复；Safari / iOS / 首屏加载慢时可能出现首关点"开始任务"后仍有 1~3 声 BGM 延迟，或 toggleAudioEnabled(true) 后仍静音（P1-2 的子因） | 首次加载 / Safari / 移动端 iOS 用户 | 所有创建 Oscillator 并调用 start() 前，先 `if (audioContext.state === 'suspended') audioContext.resume().catch(()=>{})`；以及在用户首次点击的任何全局按钮（开始任务/音效切换）时，立刻 resume 全部 3 个 AudioContext |
| P2 | AUD-P2-2 | **没有 play()/start() Promise / try/catch** | 极端情况下（close 后重启）会抛 Error → console 红错 / 页面崩溃 | 把 playSfx / playSfxWithControl / bgm.playTrack / playChord 内的 oscillator.start(now) 用 `try { osc.start() } catch (e) { console.debug('audio start failed', e) }` 包裹，避免冒泡到全局；resume() 的 Promise 加上 `.catch(()=>{})` 忽略 AbortError |
| P2 | AUD-P2-3 | **ambient.ts stopAmbient 2s setTimeout 不保存 timer ID** → stopAmbientImmediate() 执行后 2s setTimeout 仍会跑一次 clearAmbient（try/catch 空操作无副作用）但如果 stopAmbient 连续 2 次触发，setTimeout(clearAmbient,2000) 会有 2 个 timer 都执行（虽然无错，但有冗余） | 高频率切房间场景（dev 热加载 / 传送测试）有冗余调用 | 保存 timerId 为模块变量，stopAmbient 前先 clearTimeout；stopAmbientImmediate 里同样 clearTimeout(timerId) 设 null |
| P2 | AUD-P2-4 | **stopBgm 后 bgm 下 masterGain 线性 ramps 保留 scheduled 到 future 时间点**；若紧接着切回来同一 taskId 并 playBgm(taskId)（虽然 currentTaskId 检查会防重复，但手动强制再启动）会有 ramps 冲突（两个 linearRamp 对同一个 gain） | 手动操作/测试才会发生；E2E 正常流程不会 | stopBgm 或 stopBgmImmediate 中先 `masterGain.gain.cancelScheduledValues(audioContext.currentTime)` 再设置 0/ fade 目标值；当前 stopBgmImmediate 已做 cancel，stopBgm（soft）没做 → 补 cancel |
| P2 | AUD-P2-5 | **同一 soundId 并发上限缺失**；无 per-soundId 节流/计数（除 chaos_warning 3000ms、footstep 350ms 之外） | 脚本 bug 时一秒发 1000 次 playSfx('memory_save') 将瞬间创建 1000 osc，虽然自动停止但 node/GC 压力 | 给 playSfx 增加简单 soundId->lastPlayedTime Map，做全局 20ms 节流（防重复调用同时不影响 UX） |
| P2 | AUD-P2-6 | **toastStore / feedbackSlice 内多个 setTimeout 未保存 ID** → 无法中途 cancel（虽然音频无关，但会执行已删除对象的 filter 操作，P3 低危） | 全局 store 与组件生命周期解耦场景 | 保存 timerId 并在对应 removeFloatingText/removeEventToast 时 clearTimeout（如果有手动移除 API，目前看只靠自然到点） |

---

## 九、需要人工确认的 5 个问题（需要产品/UX 判断而非纯技术）

| # | 问题 | 背景 | 可选答案 / 需要谁确认 |
|---|------|------|-----------------------|
| Q1 | **phone_ring 仅单次 0.6s envelope，不是循环 ringtone**，Leave-Home 任务中"手机响"只是每次脚本事件触发一次 ping，而不是持续响铃 20 秒直到用户进卧室。这和"主人出门前忘了接手机，后来震动几次"叙事是否匹配？当前 1 ping 是否足够？ | 当前 leave-home.ts 里脚本事件可能只在 1~2 个阶段触发 phone toast（一次 0.6s），并不是"循环直到拿起手机"的那种经典设计 | 需产品确认：手机响应保持 1 ping（保持现状）还是改成循环 interval（500ms on / 1s off 直到 pick 手机）？如果改循环，必须额外 stopPhoneRing 接口 + 9 停止条件完整覆盖（Aud P0-3 修复后才安全） |
| Q2 | **双 Room Ambient 并行的叠加音色是故意为之（sfx.ts 旧 + ambient.ts 新，层叠增加厚重感），还是历史遗留两套没删**？当前 AUD-P0-1 认为是 bug，但如果产品 UX 说"叠加更有房间氛围"，应转成：把两个 ambient 合并成一个配置（freq / gain 对齐），并显式文档化为"2 Layer Room Tone" | A2/A3 注册表和代码确实两套独立实现 | 需产品/UX 确认：(a) 删掉一套（建议删 sfx.ts 内部旧版）；或 (b) 保留双套但重新调参使其无 beat/抵消，并在架构文档写明。无论哪种都要避免现在"ROOM_AMBIENT_CONFIG 与 ambient.ts 的 living 房间 freq 差 320Hz（可能产生 20Hz 拍频）"的物理冲突 |
| Q3 | **倒计时 5 秒档是否需要独立音色/更急促脉冲，而不是复用 time_warning？** 审计发现 30/10 用同一音色，5s 档缺失 | 用户习惯 5 秒倒计时会有更强紧迫感（如拳击铃）；当前 P1-4 仅建议增加 5s 档触发而不改音色 | 需产品确认：是否需要额外定义 `time_warning_final`（急促脉冲 / 更短 / 更高 freq）并用在 5s？如果不做仅保持 30/10 两档也可 |
| Q4 | **完成/失败后 phase=probing 的 1500ms narration 期间是否继续 BGM + chaos ambient？** 这是 AUD-P1-3 描述：目前 levelCompleted 时仍能听到 hopeful 任务 BGM + chaos 低频叠加，level_complete 的 0.8s 胜利音和任务 BGM 并行"两首歌一起唱"，也可能破坏体验 | 可能产品故意：希望完成后仍有背景感，不希望"瞬间死寂" → 那可以只 stopChaosAmbient 不关 BGM；或 BGM fade 0.5s 而不是 2s | 需 UX 确认：(a) levelCompleted/failed 立即 stop 所有 BGM（推荐保留 level_complete 单音 + 静音其他）；(b) 保留 BGM 但降低 volume 到 0.05（几乎不可闻），同时强制 stopChaosAmbient；(c) 保持现状 |
| Q5 | **音频开关"再开启后"是否应自动恢复当前正在进行的 BGM/Ambient/Chaos 状态？** 审计 A4 场景 4、场景 8 发现：开关开启后 isEnabled=true 立刻生效，但只有单次 SFX（pick/save）会立即响；正在 playing 的任务 BGM 与 ambient（若用户既未切房间也未重进任务）不会恢复，需等到下一次 useEffect 触发（通常切房间）。这可能导致用户"开启音效后安静 30 秒"，误以为功能损坏。产品可能三种期待：(i) 保持当前（不自动恢复，省资源）；(ii) 开启后立即重播当前任务 BGM 与当前房间 Ambient（若仍在 playing 阶段）；(iii) 开启后仅恢复 ambient，BGM 手动再启动 | 与 AUD-P1-2 技术修复方案强相关 | 需产品确认：选 (i)/(ii)/(iii) 哪种？建议 (ii)，因为用户"开音效"一般期望立刻听到当前场景应有声音，否则误以为系统坏了。 |

---

## 十、工程验证（本轮不修改代码）

- 命令流 E2E：`clean-table / leave-home / laundry-sort / breakfast / night-patrol` 合计 **11 passed**（跨 5 关命令执行 + stage 推进）
  证明：音频调用链未 throw、saveMemory / pickEntity / placeIntoContainer / stage transitions 等逻辑未因 isAudioEnabled 而断流。
- navigation-audio：**3 passed / 1 failed**（失败项原因：旧测试引用 `data-testid="back-to-tasks"`，当前 ArenaPage Result 返回按钮未写该 id，**定位 selectors 陈旧**；其他 goBack / 无效 taskId 跳回 / result 刷新跳转 3 项均通过 → 音频 stop 行为本身在 goBack 路径正确）
- 单元测试：306 passed（memory/placement/chaos/flow/store 等）均不涉及音频，但不产生新副作用。
- 人工只读：10 项开关行为 + Leave-Home 9 项停止条件 + 五关共享回归均为源码推导。

**备注（审计范围声明）**：本轮全程 **0 修改** 源码、资源、依赖、配置；0 提交 0 推送；所有结论基于当前 working tree HEAD 逐文件阅读 + 运行既有 playwright suite。
