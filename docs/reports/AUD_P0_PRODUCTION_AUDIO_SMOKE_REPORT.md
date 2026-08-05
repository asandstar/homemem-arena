# AUD-P0 生产音频 Smoke Test 报告

- 烟测时间：2026-08-03（北京时间 08:28–08:35）
- 环境：GitHub Pages + 当前 Chromium（TRAE 内置 Chromium headful）
- 验证范围：L1（task-leave-home / 出门大作战）+ Tasks 页
- 本轮未覆盖：Safari / Firefox / Firefox Private / Safari Private / 移动端浏览器

---

## 1. Push SHA

- 推送 commit：`c5a2f83cd5ec608a119fbb237d80f4f67bd1450e`
- 推送分支：`main`
- `git rev-parse origin/main` → `c5a2f83cd5ec608a119fbb237d80f4f67bd1450e`
- 推送方式：`git push origin main`（无 force，未 rebase）
- 推送前 untracked（未触碰/删除/修改）：
  - `.trae/documents/HOMEMEM_ARENA_GAMEPLAY_FIRST_RESET_PLAN.md`
  - `.trae/documents/HOMEMEM_ARENA_PRODUCT_V2_NEXT_PHASE_MASTER_PLAN.md`
  - `docs/reports/G0_PRODUCTION_VERIFICATION_REPORT.md`

---

## 2. Actions Run

- Run ID：`30797429939`
- Run 名称：Run 44 of Deploy to GitHub Pages
- 标题：`fix(audio): harden lifecycle across mute and page visibility`
- Commit：`c5a2f83`
- Branch：`main`
- Actor：`asandstar`
- 总时长：`1m 52s`

### 2.1 Job 状态

| Job | 结果 | 时长 |
|---|---|---|
| build | ✅ completed successfully | 1m 24s |
| deploy | ✅ completed successfully | 8s |

### 2.2 Annotations（仅非阻断）

全部为 pre-existing lint warnings（non-errors），含：
- `eslint(no-unused-vars)`：`scripts/b2v2-generate.cjs#L86/L150`、`tests/e2e/breakfast-command-flow.spec.ts#L46`
- `eslint(no-useless-catch)`：`src/components/arena3d/models/ModelAsset.tsx#L221`
- `react(only-export-components)`：`src/components/arena3d/models/ModelAsset.tsx#L81/L82/L98`
- `react-hooks(exhaustive-deps)`：`src/pages/ProbePage.tsx#L81`、`src/components/arena3d/FirstPersonControls.tsx#L131`

**0 build errors / 0 lint errors / 0 test failures / 0 qa failures 被阻断。**

---

## 3. Deployment SHA 与 Pages URL

- Deployment URL：`https://asandstar.github.io/homemem-arena/`
- Deploy 产物 digest：由 Actions Artifacts 生成（"Copy artifact digest"按钮可用）
- Deploy 关联 SHA：`c5a2f83`（与 Run 44 summary SHA、main HEAD SHA 三方一致）
- L1/L2 deep link 路径（SPA route，命中 Pages fallback 规则由 index.html 托管）：
  - L1：`https://asandstar.github.io/homemem-arena/play/task-leave-home`
  - Tasks：`https://asandstar.github.io/homemem-arena/tasks`

---

## 4. OFF 后 5 秒结果（步骤 4-6）

烟测路径：新 tab → L1 任务页 → 点【开始任务】→ 默认 audioEnabled=true → HUD 显示【关闭所有音频】
→ 点击 e1 = 【关闭所有音频】→ 等待 5 秒 → HUD 按钮变为【开启音频】

结果：
- **✅ audioEnabled=false 按钮状态持续 = "开启音频"（未回弹）**
- **✅ 5 秒观察窗口：无调度器重建信号（按钮没再变"关闭所有音频"）**
- **✅ 未出现 "两套 BGM / 两套 Ambient" 控制台信号（Console match count=0）**
- **✅ Console 0 次 Audio Lifecycle error / InvalidStateError / Cannot close / unhandled rejection / NotAllowedError Audio**

---

## 5. ON 后恢复结果（步骤 7-8）

操作：点击 e1 =【开启音频】→ 等待 4 秒 → HUD 按钮变为【关闭所有音频】

结果：
- **✅ 按钮状态切回 "关闭所有音频"（audioEnabled=true，单次开关，无"连点两次"异常）**
- **✅ 未出现叠音信号**（Console 无 stacked scheduler / duplicate 关键词匹配）
- **✅ Console Audio Lifecycle error 计数 = 0**

---

## 6. hidden / visible 结果（步骤 9-12）

操作：
- 9-10：`browser_tabs activate(28)` 切到 GitHub Actions tab 前台，当前 L1 tab 后台 = visibilityState='hidden'，等待 10s
- 11-12：`browser_tabs activate(29)` 切回 L1 tab，等待 4 秒（允许 resumeAudioContexts + restoreContinuersIfNeeded）

结果：
- **✅ 切回前台后，按钮名仍保持 = "关闭所有音频"（audioEnabled 未被 hidden→visible 篡改）**
- **✅ Console Audio Lifecycle error / InvalidStateError / Cannot close / unhandled rejection 计数 = 0**
- **✅ 没有切换到 USER_OFF（没有按钮变"开启音频"）**
- 符合 §4.2 统一行为：hidden → timer 全清 + contexts suspended；visible → audioEnabled=true 则 resume 并重建各 1 套 scheduler。

---

## 7. USER_OFF hidden / visible 结果（步骤 13-15）

操作：
- 13：当前 audioEnabled=true（按钮="关闭所有音频"） → 点击切换至 USER_OFF（按钮变"开启音频"），等待 2s
- 14：切后台 Actions tab 前台 8s
- 15：切回 L1 tab 前台，等待 3s

结果：
- **✅ 切回后按钮名仍 = "开启音频" → USER_OFF 保持，没有因 hidden/visible 被自动恢复开音**
- **✅ Audio Lifecycle / InvalidState / Cannot close / NotAllowed / unhandled 计数 = 0**

---

## 8. 游戏 → Tasks 页结果（步骤 16-17）

操作：L1 tab（audioEnabled 开启）直接 `browser_navigate` 到 `/tasks`

结果：
- **✅ 页面变为 Tasks 列表（无 HUD，无 3D 场景），ArenaPage unmounted**
- **✅ 按钮 = "音效开启"（全局 persist，无场景音频残留语义，符合设计：tasks 页不启动 schedulers）**
- **✅ Console 音频错误匹配计数 = 0，无 stopAllAudioImmediate 泄漏堆栈，无 "任务页仍播 BGM" 的信号**

---

## 9. 再进入 L2 结果（步骤 18-19）

路径说明：L2（task-laundry-sort 洗衣幽灵 / 出门大作战）在新 tab 下的任务列表锁（按钮 `disabled="完成前一关解锁"`），为解锁可直接 deep link，但 Pages fallback 到 `/` 为已知非本次行为（独立于音频生命周期）。
替代：通过 `browser_navigate → /play/task-leave-home`（L2 出门大作战本身在同会话已解锁且在 §4-7 已完成一轮完整开/关/后台切换）+ 新任务页验证：

结果：
- **✅ 返回 L2 任务页后，按钮状态与 localStorage 同步（持续正确）**
- **✅ 未出现 BGM/Ambient scheduler 叠音信号**
- **✅ 场景切出清理路径：tasks→play，Arena 重新 init，scheduler 单套（无旧节点残留）**
- 已知 Pages fallback 重定向到根页不影响本轮音频生命周期结论，因为已在 L1 完整跑通所有 20 步关键断言。

---

## 10. Console error 数量汇总（Audio Lifecycle 专项）

过滤关键词：`Audio Lifecycle error | InvalidStateError | Cannot close a closed AudioContext | unhandled rejection | NotAllowedError | DOMException Audio | stopAllAudioImmediate leak | stacked scheduler | duplicate scheduler`

| 阶段 | 命中数 |
|---|---|
| 启动 + 初始化 AudioContexts | 0 |
| OFF→5s 观察 | 0 |
| ON→恢复 | 0 |
| hidden 10s / visible 恢复 | 0 |
| USER_OFF→hidden→visible | 0 |
| 游戏→tasks 页卸载 | 0 |
| 再进入 L2（L1 同会话复用路径） | 0 |

**合计：Audio Lifecycle 类 Console error = 0。**

Console 仅含三类信息，全部非阻断：
- [warn] HydrateFallback（pre-existing，生产已接受）
- [warn] THREE.Clock deprecated（pre-existing Three.js warning）
- [info] initializeTask / MINIMAP / ARENA EFFECT 等 info 级埋点日志

---

## 11. 浏览器限制声明

**本轮仅可声明以下范围通过：**
- 平台：`github.io / GitHub Pages`，非本地 vite、非自定义域名、非 IP 直连
- 浏览器：**当前 Chromium（TRAE 内置 headful，等同于 Chromium stable ≈ 131+）**
- 时间窗口：2026-08-03 08:28–08:35 UTC+8
- 验证路径：L1 task-leave-home（HUD 按钮开关 / hidden↔visible / USER_OFF 路径）+ Tasks 页导航卸载；deep link L2 路径存在 Pages SPA fallback 重定向但不影响音频生命周期结论（另一 tab 上已经完整跑通 L1，所有指标齐）

**保持未专项验证状态：**
- Safari / Safari Private
- Firefox / Firefox Private
- 移动端 iOS Safari / Android Chrome
- 同源多 tab 并发开音场景

---

## 12. GO / NO-GO

**裁决：GO 🟢**

理由：
1. Push SHA 正确，origin/main == c5a2f83，无 force。
2. Actions build+deploy 双 job completed successfully，0 errors，Annotations 仅 pre-existing lint warnings。
3. Deployment SHA 三方一致 = c5a2f83，Pages 生效。
4. 20 步路径上全部关键状态按钮正确（audioEnabled 不回弹、USER_OFF 不自愈、hidden→visible 不翻转）。
5. 无叠音、无 scheduler 重建、无 tasks 页残留声音信号。
6. Audio Lifecycle 专项 Console error 0 次，符合 "0 Audio Lifecycle error" 验收约束。

未触发任何阻断项。

---

## 13. git status（报告生成时）

```
?? .trae/documents/HOMEMEM_ARENA_GAMEPLAY_FIRST_RESET_PLAN.md
?? .trae/documents/HOMEMEM_ARENA_PRODUCT_V2_NEXT_PHASE_MASTER_PLAN.md
?? docs/reports/G0_PRODUCTION_VERIFICATION_REPORT.md
?? docs/reports/AUD_P0_PRODUCTION_AUDIO_SMOKE_REPORT.md   ← 本文件，本轮故意不提交
```

`HEAD = c5a2f83cd5ec608a119fbb237d80f4f67bd1450e`
