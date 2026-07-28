# WORKTREE_HANDOFF_2026-07-28

> 日期：2026-07-28
> 轮次：Audio P0 Final Worktree Handoff
> 性质：**整理当前工作区 + 形成可审阅的提交计划**。本轮未修改产品功能；未执行 `git add / commit / push`；以下仅为建议。

---

## 0. 当前基础验证

```text
npm run build  → 通过
npm run test   → 13 test files / 306 tests passed
npm run qa     → 通过（qa:static / qa:assets / qa:rooms / qa:tasks / qa:layout / build 全绿）
git diff --check → 空（无尾部空白 / 冲突标记问题）
```

---

## 1. 完整分类 git status（H1）

汇总来源：`git status --short`、`git diff --name-only`、`git ls-files --others --exclude-standard`。

### 分类速览

| 类别 | 数量 | 建议提交批次 |
|------|------|--------------|
| A. HUD / Minimap | 10 文件 modified | Commit 1 |
| B. Interaction Outline (visual semantics fix) | 3 文件 modified + 1 目录（docs 证据）untracked | Commit 2 |
| C. Audio P0（生产源码） | 6 文件 modified + 1 文件（audioManager）untracked | Commit 3 |
| D. E2E tests（Playwright helpers + spec） | 3 文件 modified | Commit 4（或随 C 同批） |
| E. 文档报告 | 5 文件（4 untracked 报告 + 本 HANDOFF） | Commit 4 |
| F. QA 截图与二进制产物 | 1 文件 modified（永久回归证据）+ 1 目录（一次性） | 永久保留：F-1；临时：F-2（H3 建议可删） |
| G. 临时脚本 / debug JSON | 6 脚本 + 4 JSON + 1 个 .trae 草稿 | 一次性临时产物（H3 建议可删） |
| H. 无法确定来源 | 0 | - |

### 逐文件分类

#### A. HUD / Minimap（建议 Commit 1：HUD / Minimap）

A 类是 `src/components/arena3d/*` 与 HUD/小地图视觉语义 / 材质颜色 / 轮廓相关的 10 个 modified 文件。它们同属于更早一轮的 "HUD & Minimap Focused UX Implementation" + "Interaction Outline Visual Fix" 产出，因为都改了 `PALETTE.status.info → PALETTE.target.primary` 这类轮廓颜色与 Door3D 门框。

| path | featureOwner | 类型 | 保留/删除/确认 | 建议提交批次 |
|------|--------------|------|----------------|--------------|
| `src/components/arena3d/Container3D.tsx` | HUD / Outline | production（HUD/Minimap 视觉） | 必须保留 | Commit 1 |
| `src/components/arena3d/Door3D.tsx` | HUD / Outline | production（门框渲染） | 必须保留 | Commit 1 |
| `src/components/arena3d/HUD.tsx` | HUD / Audio 共同（Acceptance 中删掉了 HUD 独立 playBgm useEffect，也在本文件） | production（HUD UI 组件 + 一部分 Audio lifecycle） | 必须保留 | Commit 1 **或** Commit 3；见 §4 依赖说明 |
| `src/components/arena3d/Object3D.tsx` | HUD / Outline | production（交互物体轮廓） | 必须保留 | Commit 1 |
| `src/components/arena3d/colors.ts` | HUD / Outline | production（颜色常量表） | 必须保留 | Commit 1 |
| `src/components/arena3d/materials/palette.ts` | HUD / Outline | production（PALETTE 色板） | 必须保留 | Commit 1 |
| `src/components/arena3d/models/FurnitureModel.tsx` | HUD / Outline | production（家具模型 EdgesGeometry 轮廓） | 必须保留 | Commit 1 |
| `src/components/arena3d/models/ModelAsset.tsx` | HUD / Outline | production（模型材质/靠近发光） | 必须保留 | Commit 1 |
| `src/components/arena3d/models/PropModel.tsx` | HUD / Outline | production（小物体 EdgesGeometry） | 必须保留 | Commit 1 |

> A 类共 9 个真正 HUD/Minimap 本体；**HUD.tsx 同时含有 A 类 + Audio Acceptance 一次关键修改（删 playBgm useEffect），建议放 Commit 1（与 HUD 一起），Audio 方只需要在 Acceptance 报告中点名即可**。

#### B. Interaction Outline（建议 Commit 2：Interaction visual semantics）

B 类是更早一轮 `INTERACTION_OUTLINE_VISUAL_FIX` 产出，内容为 Door3D/Container 轮廓色板 + 正式文档证据截图。由于 A 类已经包含了 palette/colors/Door3D/Container 的代码修改，这里 B 类主要是**文档证据**。

| path | featureOwner | 类型 | 保留/删除/确认 | 建议提交批次 |
|------|--------------|------|----------------|--------------|
| `docs/INTERACTION_OUTLINE_VISUAL_FIX_REPORT.md` | Interaction Outline | docs（正式报告） | 必须保留 | Commit 4（随文档报告一起） |
| `docs/assets/outline-visual-fix/*.png` 共 10 张（01…10） | Interaction Outline | docs/assets（正式文档证据，报告引用） | 必须保留（正式文档证据） | Commit 4（随 docs 一起） |

> 注意：B 类没有独立的生产源码修改，生产源码改动都合并到 A 类 Commit 1 了。

#### C. Audio P0 生产源码（建议 Commit 3：Audio lifecycle P0）

Audio P0 本轮（Implementation + Acceptance Closeout）直接产出的 7 个生产文件，其中 6 modified + 1 untracked。**重点：audioManager.ts 虽然 untracked，但被 useUiStore 和 ArenaPage import，绝不能遗漏**。

| path | featureOwner | 类型 | 保留/删除/确认 | 建议提交批次 |
|------|--------------|------|----------------|--------------|
| `src/audio/audioManager.ts`（**untracked，易漏**） | Audio P0 | production（核心：stopAllAudioImmediate / resumeAudioContexts 统一入口） | **必须保留，手动注意 add** | Commit 3 |
| `src/audio/sfx.ts`（modified） | Audio P0 | production（一次性 SFX playSfxInternal + 统一 registry + 幂等 stopAllSfxInstances） | 必须保留 | Commit 3 |
| `src/audio/bgm.ts`（modified） | Audio P0 | production（fadeSeconds 参数 + stopBgmImmediate 幂等 close 修复 + getters / forceRestart） | 必须保留 | Commit 3 |
| `src/audio/ambient.ts`（modified） | Audio P0 | production（fadeSeconds + clearAmbientTimer + forceRestart + getters） | 必须保留 | Commit 3 |
| `src/pages/ArenaPage.tsx`（modified） | Audio P0 | production（Audio lifecycle 唯一所有者：BGM + Ambient useEffect；start 按钮 onClick resume；Result onClick stopAll；initializeTask 前 stopAll；beforeunload；phase probing fade；audioEnabled dep） | 必须保留 | Commit 3 |
| `src/store/useUiStore.ts`（modified） | Audio P0 | production（toggleAudioEnabled / onRehydrateStorage 改走 stopAllAudioImmediate 统一入口） | 必须保留 | Commit 3 |
| `src/utils/e2eTestApi.ts` + `src/utils/e2eTestApi.types.ts`（modified） | Audio P0 | production（附：E2E 只读 debug API，仅 MODE=e2e 生效） | 必须保留（**虽然挂在 E2E 模式，但属于 Audio P0 为了断言新增的生产代码**） | Commit 3 |

> 共 8 个 Audio P0 生产相关文件（含 audioManager.ts + e2eTestApi 的 ts/types 两文件）。

#### D. E2E tests（建议 Commit 4 或与 3 同批）

| path | featureOwner | 类型 | 保留/删除/确认 | 建议提交批次 |
|------|--------------|------|----------------|--------------|
| `tests/e2e/navigation-audio.spec.ts`（modified；7 Audio P0 新用例 + Case7 扩展成五关切换） | Audio P0 | test（Playwright） | 必须保留 | 建议 **Commit 3**（与 Audio 生产源码一起提交最自然；或 Commit 4） |
| `tests/e2e/helpers.ts`（modified；Acceptance Closeout 收紧错误过滤，只留 WebGL 类） | Audio P0 + 所有 E2E | test（Playwright） | 必须保留 | Commit 4（通用 E2E 基础设施） |

> 说明：`tests/e2e/outline-visual-fix.spec.ts`（H3 用户点名检查）**当前 tree 下不存在**（`Glob` 查不到，也不在 untracked/modified 列表中），无需处理。

#### E. 文档报告（统一 Commit 4：Tests and documentation）

| path | featureOwner | 类型 | 保留/删除/确认 | 建议提交批次 |
|------|--------------|------|----------------|--------------|
| `docs/AUDIO_LIFECYCLE_P0_IMPLEMENTATION_REPORT.md`（日期已校正：2026-07-28 + 轮次 AUD-P0） | Audio P0 | docs | 必须保留 | Commit 4 |
| `docs/AUDIO_LIFECYCLE_P0_ACCEPTANCE_REPORT.md` | Audio P0 Acceptance | docs | 必须保留 | Commit 4 |
| `docs/AUDIO_SYSTEM_AUDIT.md` | Audio P0 前置审计 | docs | 必须保留（正式前置审计文档） | Commit 4 |
| `docs/INTERACTION_OUTLINE_VISUAL_FIX_REPORT.md` | Interaction Outline | docs | 必须保留 | Commit 4 |
| `docs/WORKTREE_HANDOFF_2026-07-28.md`（即本文件） | 本轮 Worktree Handoff | docs | 必须保留（提交计划 + 分类台账） | Commit 4 |

#### F. QA 截图与二进制产物

| path | featureOwner | 类型 | 永久回归 / 正式证据 / 一次性临时 | 保留/删除/确认 |
|------|--------------|------|----------------------------------|----------------|
| `qa-artifacts/e2e/level-1-result.png`（modified，PNG 二进制，与老版本 diff 54263→54542 bytes） | first-level-command-flow Playwright 截图 golden | artifact（e2e 截图） | **永久回归测试证据**（Playwright E2E 用例中 `saveScreenshot(page,'level-1-result')` 会更新它；与音频无关，只是本轮恰好一起被跑过） | 必须保留，随 F 类纳入（**建议不要与 Audio 源码同 commit，单独在 F**） |
| `docs/assets/outline-visual-fix/` 10 张 PNG（01…10，untracked） | Interaction Outline 报告插图 | docs/assets（正式文档证据） | **正式文档证据**（报告 INTERACTION_OUTLINE_VISUAL_FIX_REPORT.md 引用） | 必须保留，Commit 4（docs 批量） |
| `qa-artifacts/debug-overlap/` 目录（untracked，20 张 PNG + 4 JSON） | 一次性 Interaction Outline 期间 spawn 8 视角 / green outline 诊断截图与 JSON | artifact（debug 临时） | **一次性临时产物**（_debug* 6 脚本生成，仅用于 INTERACTION_OUTLINE_VISUAL_FIX 轮次"绿色矩形与门框混淆问题"的取证和分析，不作为永久回归证据） | 可删除；先不自行删，记录"待清理"列表 |

#### G. 临时脚本

6 个脚本（全部 `_` 前缀，untracked）+ 1 个 `.trae` 草稿。

| path | featureOwner | 类型 | 永久回归 / 正式证据 / 一次性临时 | 保留/删除/确认 |
|------|--------------|------|----------------------------------|----------------|
| `scripts/_debug_8_views_vision.mjs`（untracked） | Interaction Outline 视觉取证脚本 | script（临时） | **一次性临时**：spawn 8 视角写 vision-summary.json | 可删除；**不纳入任何提交批次** |
| `scripts/_debug_green_outline_vision.mjs`（untracked） | Interaction Outline 视觉取证脚本 | script（临时） | **一次性临时**：DOM + Three.js 探查 outline 来源写 green-outline-diagnosis.json | 可删除；不纳入 |
| `scripts/_debug_green_source.mjs`（untracked） | Interaction Outline 视觉取证脚本 | script（临时） | **一次性临时**：scene graph + AABB overlap 查 decor vs container 写 scene-outline-diagnosis.json | 可删除；不纳入 |
| `scripts/_debug_spawn_view_overlap.mjs`（untracked） | Interaction Outline 视觉取证脚本 | script（临时） | **一次性临时**：8 个 spawn 视角截图（01-spawn-original.png 等） | 可删除；不纳入 |
| `scripts/_probe_dev_status.cjs`（untracked） | 之前某轮 dev server 探针脚本 | script（临时） | **一次性临时**：检查 Playwright 端 dev server 是否就绪；当前 `npm run playwright` 直接用 webServer 配置就够，无正式 CI 依赖 | 可删除；不纳入 |
| `.trae/documents/LEAVE_HOME_SPATIAL_LAYOUT_DATA_CAPTURE_plan.md`（untracked） | 某轮 LEAVE_HOME 空间布局 Data Capture 计划草稿 | docs（Trae 本地草稿） | **需人工确认**：非产品源文件，属于 IDE 中间草稿。**正式提交建议不纳入**。 | 需人工确认；建议不纳入版本库（放在 .trae 私有草稿目录符合工程习惯） |

#### H. 无法确定来源

0 项。所有 19 tracked modified + 13 untracked（docs/scripts/qa-artifacts/.trae/audioManager）都已在 A-G 分档完毕。

---

## 2. Audio P0 完整性检查（H2）

H2 要求必须进入 Audio P0 提交的 11 个文件核对：

| 要求的 11 个文件 | 状态（H1 分档位置） | 是否进入 Audio P0（C 类或 D 类） | 风险与备注 |
|------------------|---------------------|----------------------------------|------------|
| `src/audio/audioManager.ts` | H1 §C | ✅ **C 类，Commit 3 首位**（manual-add 提醒：目前 untracked，最终 git add 时必须带上） | 高风险遗漏：**git status --short 中是 `??`**，若只靠 `git add -u` 会丢掉，此文件被 useUiStore.ts / ArenaPage.tsx 真实 import，丢了会直接 build 失败；**Acceptance 中 Handoff 报告最关键的手动提醒** |
| `src/audio/sfx.ts` | H1 §C modified | ✅ C 类，Commit 3 | OK（modified，git add -u 会包含） |
| `src/audio/bgm.ts` | H1 §C modified | ✅ C 类，Commit 3 | OK（modified，git add -u 会包含） |
| `src/audio/ambient.ts` | H1 §C modified | ✅ C 类，Commit 3 | OK（modified，git add -u 会包含） |
| `src/pages/ArenaPage.tsx` | H1 §C modified | ✅ C 类，Commit 3 | OK（modified，git add -u 会包含） |
| `src/store/useUiStore.ts` | H1 §C modified | ✅ C 类，Commit 3 | OK（modified，git add -u 会包含） |
| `src/components/arena3d/HUD.tsx` | H1 §A modified（含 Audio Acceptance 关键修改：删 HUD playBgm useEffect） | ⚠️ 默认放 **Commit 1（HUD/Minimap 组）**；Audio 方把该修改记录在 Acceptance 报告中 | OK：**因为 Commit 1 必然在 3 之前，Audio 代码不会 build 失败**。删 HUD 的 playBgm 独立 useEffect 是为了"唯一 BGM 所有者 = ArenaPage"，HUD 不再持有 BGM 启动权，不影响编译。 |
| `src/utils/e2eTestApi.ts` | H1 §C modified | ✅ C 类，Commit 3（与 Audio P0 getAudioDebugState 等新增 API 捆绑） | OK |
| `src/utils/e2eTestApi.types.ts` | H1 §C modified | ✅ C 类，Commit 3（types 伴随实现） | OK |
| `tests/e2e/navigation-audio.spec.ts` | H1 §D modified | ✅ D 类；建议 **Commit 3 后或同批**（Audio 断言必须与 Audio 生产源码同批才能过 CI） | OK（modified，git add -u 会包含） |
| `tests/e2e/helpers.ts` | H1 §D modified（错误过滤收紧） | ✅ D 类，Commit 4（通用 E2E 基础设施，不绑定 Audio 源码） | OK（modified，git add -u 会包含） |

### 完整性结论（H2 关键结论）

**11/11 全部纳入批次计划**。**必须手动提醒**：最终执行 `git add` 时一定显式加入 `src/audio/audioManager.ts`，避免 `git add -u` 只加 modified 文件而漏掉 untracked 的 audioManager.ts。

---

## 3. 临时产物判定与清理建议（H3，不自行删除，仅列出分类与建议）

### 3.1 判定表（是否：永久回归测试 / 正式文档证据 / 一次性临时产物）

| 项目 | 类别（H1） | 判定 | 证据 | 建议提交？ | 建议删除？ |
|------|------------|------|------|------------|------------|
| `qa-artifacts/e2e/level-1-result.png`（modified） | F | **永久回归测试证据** | 位于 `qa-artifacts/e2e/` 下；文件名与 first-level-command-flow 用例一致；已有 MANUAL_GOLDEN_PATH.md 同在该目录。 | 建议单另一个"QA artifact 提交批次"或与首次引入该 PNG 的提交一起跟随更新（不建议与 Audio P0 源码同 commit）。 | ❌ 不删 |
| `docs/assets/outline-visual-fix/*.png`（10 张，untracked） | B / E | **正式文档证据**（INTERACTION_OUTLINE_VISUAL_FIX_REPORT.md 插图） | INTERACTION_OUTLINE_VISUAL_FIX_REPORT.md 内章节编号与图一一对应（01…10）；永久引用。 | ✅ Commit 4（Docs 批量）。 | ❌ 不删 |
| `qa-artifacts/debug-overlap/`（20 PNG + 4 JSON，untracked） | F | **一次性临时产物** | 4 个 JSON 的 `file:` 字段都指向 qa-artifacts/debug-overlap；文件名由 `_debug_*_vision.mjs` / `_debug_green_source.mjs` / `_debug_spawn_view_overlap.mjs` 生成；并非任何 Playwright 规范断言的 golden 图。 | ❌ 不提交。 | ✅ 建议清理（如团队需保留证据，可打包至私有 artifacts） |
| `scripts/_debug_8_views_vision.mjs`（untracked） | G | **一次性临时脚本** | 输出到 `qa-artifacts/debug-overlap/vision-summary.json`；不被 package.json scripts / CI 任何脚本引用；无单元测试。 | ❌ 不提交。 | ✅ 建议清理 |
| `scripts/_debug_green_outline_vision.mjs`（untracked） | G | **一次性临时脚本** | 输出 green-outline-diagnosis.json；为 INTERACTION_OUTLINE 轮次查绿色矩形来源的专用脚本。 | ❌ 不提交。 | ✅ 建议清理 |
| `scripts/_debug_green_source.mjs`（untracked） | G | **一次性临时脚本** | 输出 scene-outline-diagnosis.json；同上。 | ❌ 不提交。 | ✅ 建议清理 |
| `scripts/_debug_spawn_view_overlap.mjs`（untracked） | G | **一次性临时脚本** | 生成 01-spawn-original.png ~ 08-door-south-near.png 等 spawn 视角截图；为视觉比对取证。 | ❌ 不提交。 | ✅ 建议清理 |
| `scripts/_probe_dev_status.cjs`（untracked） | G | **一次性临时脚本** | 仅辅助 dev server 探测；CI Playwright webServer:{} 配置无需此脚本。 | ❌ 不提交。 | ✅ 建议清理 |
| `debug JSON`（green-outline-diagnosis.json / scene-outline-diagnosis.json / vision-summary.json / vision2-summary.json，即 qa-artifacts/debug-overlap/*.json） | F | **一次性临时产物**（调试数据） | 未被任何报告或测试引用；仅为 _debug* 脚本的中间输出。 | ❌ 不提交。 | ✅ 建议清理（若归档则随截图一起打包） |
| 其他 Playwright 临时截图（qa-artifacts/e2e/*.png 中未列出的）：home.png / task-select.png / level-1-briefing.png / HUD 两张 | F | **永久回归测试证据**（first-level E2E 全流程 6 张） | 这些文件未出现在本工作区 modified/untracked 列表里，说明 HEAD 已包含、本轮未改。 | HEAD 已存在，本轮不涉及。 | ❌ 本轮不动 |
| `.trae/documents/LEAVE_HOME_SPATIAL_LAYOUT_DATA_CAPTURE_plan.md` | G | **无法确定但倾向需人工确认**（IDE 本地草稿、非团队文档、非工程资源） | 放在 `.trae/` 私有空间；通常团队仓库不把 `./.trae/**` 纳入 version control。 | ❌ 建议不提交；.gitignore 若未覆盖可后续追加 `/.trae/`。 | ⚠️ 需人工确认（作者本人判断是否要移至 docs/assets 或个人笔记） |

### 3.2 本手-off 不自行删除

按 H3 要求，本轮不自行删除临时产物；上表"建议清理"项仅为**建议人工执行的后处理**。

---

## 4. 建议提交拆分（最多 4 个 commit，H4）

提交顺序：1 → 2 → 3 → 4（2 实际是 A 类的代码部分，本工作区 A 类代码已经包含 2 的修改，所以把 2 并入 1 更自然；下面按用户要求的"最多 4 个 commit = HUD/Minimap + Interaction visual semantics + Audio P0 + Tests and docs"展开，并标注哪些因为当前工作区不可分需要合并。）

### Commit 1. HUD / Minimap（与 2 合并，因为当前工作区不可分）

**依赖关系**：无前置依赖。可以独立 build / test。

**可以独立 build & test？** ✅ 是。HUD/Minimap 相关是 UI 常规模组改色板，编译不依赖 Audio P0。

**文件列表**（H1 A 类全部 + 同时包含 B 类 Interaction visual 的代码部分）：

```text
src/components/arena3d/Container3D.tsx
src/components/arena3d/Door3D.tsx
src/components/arena3d/HUD.tsx
src/components/arena3d/Object3D.tsx
src/components/arena3d/colors.ts
src/components/arena3d/materials/palette.ts
src/components/arena3d/models/FurnitureModel.tsx
src/components/arena3d/models/ModelAsset.tsx
src/components/arena3d/models/PropModel.tsx
```

**commit message 建议**：

```text
fix(hud/minimap): 修正轮廓色板与视觉语义，移除 HUD 独立 BGM 启动

  - PALETTE.status.info → PALETTE.target.primary 类轮廓语义修色
  - Door3D / Container3D / Object3D / ModelAsset 靠近发光与轮廓一致化
  - HUD.tsx：删除独立 useEffect([phase,task]) playBgm(task.id)，让 BGM
    生命周期仅由 ArenaPage 一处 useEffect 作为唯一所有者持有
```

### Commit 2. Interaction visual semantics（当前工作区与 Commit 1 共文件，建议仅在有独立分支基线时拆；本 HEAD 建议**与 Commit 1 合并**）

**说明**：Interaction visual semantics fix（绿色矩形 vs Door3D 门框混淆）的代码改动实际上已经体现在上述 9 个 A 类文件中（palette + Doors）。如果项目要按"最多 4 个 commit"的标题保留这一项，建议只把这一项作为"**文档报告证据**"放在 Commit 4，而代码部分直接归 Commit 1。

若团队坚持必须 4 个独立代码提交（这种情况当前 HEAD 下因为共用 Container3D/Door3D/palette 很难干净切开），需要人工以更早 baseline 的方式 cherry-pick；**本 Handoff 报告建议：Commit 2 = 空壳无代码；由 Commit 1 + Commit 4 共同完成对应交付**。

### Commit 3. Audio lifecycle P0（核心）

**依赖关系**：依赖 Commit 1（因为 HUD.tsx 已在 Commit 1 中删了独立 playBgm，Audio 方才能实现"唯一所有者"。如果不先 Commit 1，则 Audio 方提交后的 BGM 启动入口仍为双份——虽然编译通过但语义不对）。

**可以独立 build & test？** ⚠️ 编译可独立通过；但 **Acceptance 的"唯一 BGM 所有者"语义依赖 HUD.tsx 修改先落地**。建议顺序 1→3。vitest / build 与单独跑 first-level-command-flow.spec.ts：**可以独立过**。

**文件列表**（H1 C 类 + D 类中 navigation-audio.spec.ts 建议跟随生产源码一起同批，避免 CI 上断言对应不到新 state）：

```text
src/audio/audioManager.ts            # 必须手动 git add（untracked，关键提醒！）
src/audio/sfx.ts
src/audio/bgm.ts
src/audio/ambient.ts
src/pages/ArenaPage.tsx
src/store/useUiStore.ts
src/utils/e2eTestApi.ts
src/utils/e2eTestApi.types.ts
tests/e2e/navigation-audio.spec.ts   # D 类；建议随 Audio 源码同批提交
```

**commit message 建议**：

```text
fix(audio): AUD-P0 统一生命周期与硬停止

  Unified playSfxInternal + registry + 50ms hard-stop for phone_ring /
  cat_event / time_warning / pick/place/memory/drawer/level_complete SFX.

  Introduce stopAllAudioImmediate() in new src/audio/audioManager.ts to
  replace inconsistent 3/5-piece hand-written stops across:
  toggleAudioEnabled(false), rehydrate off, ArenaPage unmount/beforeunload,
  Result back, initializeTask cleanup, task switching.

  Dual Room Ambient: remove HUD updateRoomAmbient; keep ambient.ts as the
  single production owner. sfx.ts legacy marked @deprecated, diagnostics
  exposed via isLegacyRoomAmbientActive.

  OFF→ON restore: audioEnabled in BGM/Ambient useEffect deps, resumes
  3 AudioContexts via unified resumeAudioContexts(), restores BGM +
  Ambient without replaying one-off events.

  Probing lifecycle: stopChaosAmbient now, BGM 500ms fade, Ambient 300ms fade.
  stopBgm / stopAmbient accept optional fadeSeconds default 2 (backward-compat).

  bgm.stopBgmImmediate: safe idempotent close with null ref snapshot + catch
  to eliminate "Cannot close a closed AudioContext" pageerror.

  E2E-only read-only getAudioDebugState() via MODE=e2e / VITE_E2E, plus
  navigation-audio 11 cases covering: stale back-to-tasks selector fix,
  phone/cat/time→off hard-stop, cat unmount stop, Result all-zero,
  restart_task no-leak no-replay, OFF→ON restore no-duplicate, 10x toggles,
  and five-task (clean-table/leave-home/laundry-sort/breakfast/night-patrol)
  switch non-leak with bgmTaskId/ambientRoomId per-task asserts.
```

### Commit 4. Tests and documentation（及可选 QA artifact 更新）

**依赖关系**：依赖 Commit 3（否则 Acceptance 报告里的导航断言对应不到源码）。

**可以独立 build & test？** 是（文档本身不影响编译；helpers.ts 收紧过滤只是 E2E 基础设施；文档不跑 E2E 也能单独出）。

**文件列表**（H1 E 类 + D 类 helpers.ts + B 类 docs/assets outline 截图 + 可选 F 类永久回归截图）：

```text
tests/e2e/helpers.ts                               # D：错误过滤 WebGL-only
docs/AUDIO_LIFECYCLE_P0_IMPLEMENTATION_REPORT.md   # E：P0 实现
docs/AUDIO_LIFECYCLE_P0_ACCEPTANCE_REPORT.md       # E：P0 收口
docs/AUDIO_SYSTEM_AUDIT.md                         # E：前置审计
docs/INTERACTION_OUTLINE_VISUAL_FIX_REPORT.md      # E（B 类）：Outline 修复
docs/assets/outline-visual-fix/01-spawn-default-view.png  # B 证据
docs/assets/outline-visual-fix/02-tv-front-closeup.png
docs/assets/outline-visual-fix/03-tv-side-45deg.png
docs/assets/outline-visual-fix/04-tv-with-bookshelf.png
docs/assets/outline-visual-fix/05-west-bedroom-door.png
docs/assets/outline-visual-fix/06-east-kitchen-door.png
docs/assets/outline-visual-fix/07-entrance-door.png
docs/assets/outline-visual-fix/08-bookshelf-before-approach.png
docs/assets/outline-visual-fix/09-bookshelf-after-approach.png
docs/assets/outline-visual-fix/10-bookshelf-out-of-range.png
docs/WORKTREE_HANDOFF_2026-07-28.md                 # E：本提交计划

# 可选：跟随 QA artifact 永久回归证据更新（不建议与文档同 commit，建议第 5 个独立小 commit）：
# qa-artifacts/e2e/level-1-result.png
```

**commit message 建议**：

```text
docs(tests): AUD-P0 + Outline 文档交付 + E2E 错误过滤收紧

  - helpers.ts pageerror filter: keep only confirmed headless WebGL
    false-positives (THREE.WebGLRenderer/WebGL/canvas/context lost/
    GL_INVALID/Texture/load model/glTF). Remove overly broad AudioContext
    filters; 17 Playwright cases (11 nav + 6 first-level) pass without
    hiding audio lifecycle errors via filter.

  - Acceptance & Implementation reports for AUD-P0, its pre-work system
    audit, Interaction outline visual fix report with 10 PNG document
    evidences, and this worktree handoff plan.
```

### 本工作区拆分后是否每 commit 都能独立 build/test？

| 顺序 | Commit | 独立 `npm run build`？ | 独立 `npm run test`（vitest）？ | 独立 `npm run qa`？ | Playwright？ |
|------|--------|------------------------|--------------------------------|---------------------|--------------|
| 1 | HUD / Minimap | ✅ 是（A 类纯 UI 常规模组改） | ✅ 是 | ✅ 是 | ✅ first-level 可能过；navigation 断言会缺字段，先不跑 nav spec 即可 |
| 2 | Interaction visual semantics（= 并入 1，无独立文件） | N/A（合 1） | N/A（合 1） | N/A（合 1） | N/A（合 1） |
| 3 | Audio P0（依赖 1 先落地） | ✅ 是 | ✅ 是 | ✅ 是 | ✅ navigation-audio.spec.ts 同此 commit，11 case 应全部通过 |
| 4 | Tests and documentation | ✅ 是（docs 不编译） | ✅ 是 | ✅ 是 | ✅ helpers 过滤收紧后 17 个 playwright 应继续全部通过 |
| 5（可选，未列入 4 个上限内） | `qa-artifacts/e2e/level-1-result.png` 永久回归图更新 | N/A（纯 bin） | N/A | N/A | 若 first-level 保存截图与更新一致：则无 diff；若不一致：说明截图基线已移动，建议独立 commit 说明原因 |

---

## 5. H 类：无法确定来源

0 项。本轮台账全部分档完毕。

---

## 6. 总文件清单（建议最终纳入 version control 的 28 个）

**生产源码（16）**：
```text
Commit 1 (HUD/Minimap 9):
  src/components/arena3d/Container3D.tsx
  src/components/arena3d/Door3D.tsx
  src/components/arena3d/HUD.tsx
  src/components/arena3d/Object3D.tsx
  src/components/arena3d/colors.ts
  src/components/arena3d/materials/palette.ts
  src/components/arena3d/models/FurnitureModel.tsx
  src/components/arena3d/models/ModelAsset.tsx
  src/components/arena3d/models/PropModel.tsx

Commit 3 (Audio P0 7 + 2 E2E-API 共 9):
  src/audio/audioManager.ts    # ⚠️ untracked，必须手动 git add
  src/audio/sfx.ts
  src/audio/bgm.ts
  src/audio/ambient.ts
  src/pages/ArenaPage.tsx
  src/store/useUiStore.ts
  src/utils/e2eTestApi.ts
  src/utils/e2eTestApi.types.ts
  tests/e2e/navigation-audio.spec.ts
```

**测试基础设施（1）**：
```text
Commit 4:
  tests/e2e/helpers.ts
```

**文档 + 证据（16 文档 + 10 张 PNG = 26，其中 PNG 作为 docs/assets）**：
```text
Commit 4 报告 6:
  docs/AUDIO_LIFECYCLE_P0_IMPLEMENTATION_REPORT.md
  docs/AUDIO_LIFECYCLE_P0_ACCEPTANCE_REPORT.md
  docs/AUDIO_SYSTEM_AUDIT.md
  docs/INTERACTION_OUTLINE_VISUAL_FIX_REPORT.md
  docs/WORKTREE_HANDOFF_2026-07-28.md（本文件）

Commit 4 正式文档证据 PNG 10:
  docs/assets/outline-visual-fix/01-spawn-default-view.png
  ... (10 张)
```

**可选：永久回归基线 1（不纳入 4 个 commit 上限内，建议第 5 个独立小 commit）**：
```text
qa-artifacts/e2e/level-1-result.png
```

**建议最终**不**纳入 version control 的（一次性临时产物，人工后续清理）**：
```text
qa-artifacts/debug-overlap/**（20 PNG + 4 JSON）
scripts/_debug_8_views_vision.mjs
scripts/_debug_green_outline_vision.mjs
scripts/_debug_green_source.mjs
scripts/_debug_spawn_view_overlap.mjs
scripts/_probe_dev_status.cjs
.trae/documents/LEAVE_HOME_SPATIAL_LAYOUT_DATA_CAPTURE_plan.md
```

---

完成后停止。未执行 `git add / commit / push`。
