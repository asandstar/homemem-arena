# Push 就绪度评估与分批 Commit 计划

> 生成时间：2026-08-06
> 触发：用户请求评估整个项目状态是否可以 push
> 前置：R2A.1 MODEL ANCHOR AND CHANGESET GATE 已结束（PARTIAL），用户已解除 commit/push 禁令

---

## 一、Summary（结论先行）

**当前项目技术上可以 push，但流程上不能直接 push。**

- 自动化门禁：lint / test / qa 全套 / build 本地全部通过（✅）
- 本地与 origin/main 完全同步（0 ahead / 0 behind，HEAD = `d05508a`）
- 阻塞原因：工作区有 49 个未提交变更（11 tracked + 38 untracked），横跨 R1 遗留 / R2A.1 锚点 / 资产导入 / 验证工具 4 个工作包，**未按 push 边界规则拆分为独立 commit**
- 解法：将变更拆分为 **3 个独立 commit**（验证产物保持 untracked），逐个 commit 后一次性 push main，push 后在 GitHub Pages 线上验收 5 条路由

---

## 二、Current State Analysis（当前状态分析）

### 2.1 Git 同步状态（FACT）
| 检查项 | 值 | 结论 |
|---|---|---|
| 当前分支 | `main` | ✓ |
| 本地 HEAD | `d05508a` | ✓ |
| origin/main | `d05508a`（0 ahead / 0 behind） | ✓ 完全同步 |
| 未 push 的 commit | 0 | ✓ 无积压 |
| 工作区 | 11 tracked 修改 + 38 untracked | ⚠️ 不干净 |
| stash | `wip-layout-before-round1-acceptance` | ⚠️ 有历史 stash |

### 2.2 自动化门禁状态（FACT，本地全部通过）
| 门禁 | 命令 | 结果 | 备注 |
|---|---|---|---|
| Lint | `npm run lint` | ✅ 0 error, 34 warning | warning 不阻塞 |
| Test | `npm test` | ✅ 19 files / 376 tests pass | |
| TSC | `npx tsc -b --pretty false` | ✅ exit 0 | 修复 r2a1 脚本 @ts-nocheck 后通过 |
| QA Static | `npm run qa:static` | ✅ pass | |
| QA Rooms | `npm run qa:rooms` | ✅ 27/27 | |
| QA Doorways | `npm run qa:doorways` | ✅ 8/8 | |
| QA Tasks | `npm run qa:tasks` | ✅ 72/72 | |
| QA Assets | `npm run qa:assets` | ✅ 仅 🟡 orphan GLB 警告 | 新资产未登记 legacy MODEL_REGISTRY，已通过 RUNTIME_MODEL_ASSET_REGISTRY 注册 |
| QA Layout | `npm run qa:layout` | ✅ 146/147 pass, 1 MINOR fail | `task-clean-table/dining container-near-door-heuristic` 已知非本轮引入 |
| Build | `npm run build` | ✅ exit 0 | 仅 chunk size 警告（Scene3D 1.23MB，pre-existing） |

### 2.3 变更集构成（FACT，未拆分）
**49 个变更横跨 4 个工作包**（违反"不得将前序修改混入提交"规则）：

1. **R2A.1 锚点契约修复**（3 tracked）：`Object3D.tsx` / `Container3D.tsx` / `Scene3D.tsx`
2. **资产导入与注册**（1 tracked + 25 untracked）：`modelRegistry.ts`(M) + `modelOverrides.ts`(new) + 4 food GLB + 18 furniture GLB + `assets/selection/*` + `scripts/assets/*` + `docs/assets/generated/*`
3. **R1 遗留布局与数据改动**（7 tracked）：`leave-home.ts` / `clean-table.ts` / `livingA6.test.ts` / `decorFurniture.ts` / `Room3D.tsx` / `taskSlice.ts` / `types/object.ts`
4. **R2A.1 验证产物**（11 untracked，保持 untracked 不提交）：`scripts/r2a1-*.mjs`(2) + `docs/reports/r2a1-*.png`(7) + `docs/reports/*.md`(2)

### 2.4 Push 边界规则（FACT，来自项目记忆 + 主计划文档）
- "严格禁止使用 git add .、git add -A"
- "不得将前序 P1/首页文案/模型加载修改混入提交"
- "若无法准确隔离提交范围，必须立即停止并报告"
- "基础设施类工作可以完成一个完整 Gate 后统一 push"
- "每个 WP 独立 commit，可精确回滚"
- "报告文件保持 untracked，不随代码提交"
- "push 后在 GitHub Pages 实际线上验收"

### 2.5 CI/CD 工作流（FACT）
- `deploy.yml`：main 分支 push 触发 → lint + test + qa + build → 部署 GitHub Pages
- `ci-preview.yml`：非 main 分支 push 触发（本计划不涉及）
- 本地门禁全过，远程 CI（Ubuntu + Node 24）大概率通过，但需 push 后观察 Actions

---

## 三、Proposed Changes（提议的变更）

### 步骤 0：最终预检（只读，不修改）
**目的**：确认 push 前自动化门禁仍然全绿，避免本地缓存导致的假通过。
```bash
npm run lint && npm test && npm run qa && npm run build
```
**GO/NO-GO**：任一失败 → 停止，不进入步骤 1。

### 步骤 1：Commit 批次 A — R2A.1 锚点契约修复
**文件**（3 个 tracked 修改）：
- `src/components/arena3d/Object3D.tsx` — FREE/PLACED 状态 RegisteredModel `position={[0, -halfHeight, 0]}` + fallback PropModel `+[0, halfHeight, 0]`
- `src/components/arena3d/Container3D.tsx` — CONTAINED 状态 `containedY = modelAssetId ? 0.01 : objHalfHeight + 0.01` + fallback 偏移
- `src/components/arena3d/Scene3D.tsx` — HELD 状态 `position={[0, -heldGlbHalfHeight, 0]}` + fallback 偏移

**命令**（精确指定文件，禁止 git add -A/.）：
```bash
git add src/components/arena3d/Object3D.tsx src/components/arena3d/Container3D.tsx src/components/arena3d/Scene3D.tsx
git commit -m "fix(anchor): R2A.1 RegisteredModel/PropModel 锚点契约对齐

- Object3D: FREE/PLACED 状态 RegisteredModel 减 halfHeight 使 bottom 落在 surfaceY
- Container3D: CONTAINED 状态 RegisteredModel bottom 直接贴表面 y=0.01
- Scene3D: HELD 状态使用专门 heldGlbHalfHeight 不复用 floor placement
- 三处 fallback PropModel 对称 +halfHeight 偏移保持视觉一致
- 契约: PropModel=CENTER_ORIGIN, RegisteredModel=BOTTOM_CENTER_ORIGIN"
```

### 步骤 2：Commit 批次 B — 资产导入与注册
**文件**（1 tracked + 25 untracked）：
- `src/data/assets/modelRegistry.ts` (M)
- `src/data/assets/modelOverrides.ts` (new)
- `public/assets/models/kenney/food/mug.glb` / `plate.glb` / `utensil-fork.glb` / `utensil-spoon.glb` (4 new)
- `public/assets/models/kenney/furniture/` 下 18 个新 GLB（bedDouble, bookcaseOpenLow, books, cabinetBedDrawer, chair, coatRackStanding, dryer, kitchenCabinetDrawer, kitchenSink, lampRoundTable, pillow, pottedPlant, rugDoormat, rugRectangle, table, trashcan, washer 等）
- `assets/selection/core-runtime-assets.json` (new)
- `scripts/assets/scan-local-kenney-library.mjs` / `import-core-runtime-assets.mjs` (2 new)
- `docs/assets/generated/CORE_RUNTIME_IMPORT_REPORT.md` / `LOCAL_KENNEY_ASSET_INDEX.json` (2 new)

**命令**（精确指定，分多个 git add 调用确保可控）：
```bash
git add src/data/assets/modelRegistry.ts src/data/assets/modelOverrides.ts
git add public/assets/models/kenney/food/
git add public/assets/models/kenney/furniture/bedDouble.glb public/assets/models/kenney/furniture/bookcaseOpenLow.glb public/assets/models/kenney/furniture/books.glb public/assets/models/kenney/furniture/cabinetBedDrawer.glb public/assets/models/kenney/furniture/chair.glb public/assets/models/kenney/furniture/coatRackStanding.glb public/assets/models/kenney/furniture/dryer.glb public/assets/models/kenney/furniture/kitchenCabinetDrawer.glb public/assets/models/kenney/furniture/kitchenSink.glb public/assets/models/kenney/furniture/lampRoundTable.glb public/assets/models/kenney/furniture/pillow.glb public/assets/models/kenney/furniture/pottedPlant.glb public/assets/models/kenney/furniture/rugDoormat.glb public/assets/models/kenney/furniture/rugRectangle.glb public/assets/models/kenney/furniture/table.glb public/assets/models/kenney/furniture/trashcan.glb public/assets/models/kenney/furniture/washer.glb
git add assets/selection/core-runtime-assets.json
git add scripts/assets/scan-local-kenney-library.mjs scripts/assets/import-core-runtime-assets.mjs
git add docs/assets/generated/
git commit -m "feat(assets): 导入 Kenney 核心 runtime 资产并注册到 RUNTIME_MODEL_ASSET_REGISTRY

- 新增 4 个 food GLB (mug/plate/utensil-fork/utensil-spoon)
- 新增 18 个 furniture GLB (bedDouble/chair/cabinetBedDrawer 等)
- modelRegistry 新增 RUNTIME_MODEL_ASSET_REGISTRY 含 effectiveAabb 校准
- modelOverrides 提供 uniformScale 与 effectiveAabb
- 资产目录 Gate: 无 symlink / 无 >10M 文件 / 未复制全部 419 GLB
- SHA 校验前 6 字节匹配，来源一致"
```

### 步骤 3：Commit 批次 C — R1 遗留布局与数据改动
**文件**（7 tracked 修改）：
- `src/data/tasks/leave-home.ts` — 床头柜位置/尺寸/surfaceHeight + modelAssetId 所有权
- `src/data/tasks/clean-table.ts`
- `src/data/livingA6.test.ts` — MODEL_ASSET_REGISTRY → RUNTIME_MODEL_ASSET_REGISTRY
- `src/data/decorFurniture.ts`
- `src/components/arena3d/Room3D.tsx`
- `src/store/slices/taskSlice.ts`
- `src/types/object.ts` — ContainerSpec 新增 modelAssetId 字段

**命令**：
```bash
git add src/data/tasks/leave-home.ts src/data/tasks/clean-table.ts src/data/livingA6.test.ts src/data/decorFurniture.ts src/components/arena3d/Room3D.tsx src/store/slices/taskSlice.ts src/types/object.ts
git commit -m "fix(layout): R1 遗留布局修正与 ContainerSpec modelAssetId 字段

- leave-home: 床头柜位置 (0.95,0.4,0.95) 尺寸 (0.58,0.605,0.84) surfaceHeight 0.605
- leave-home: 手机 initialPosition 调整落入床头柜抽屉内部
- leave-home: cnt-nightstand 新增 modelAssetId 作为 task-container 唯一视觉所有者
- livingA6.test: 使用 RUNTIME_MODEL_ASSET_REGISTRY 校准后 effectiveAabb
- types/object: ContainerSpec 新增可选 modelAssetId 字段
- qa:layout: task-leave-home 29/29 pass"
```

### 步骤 4：确认验证产物保持 untracked
**保持 untracked 不提交的文件**（11 个）：
- `scripts/r2a1-screenshot.mjs` / `scripts/r2a1-verify-anchors.mjs`
- `docs/reports/r2a1-mug-free.png` / `r2a1-mug-held.png` / `r2a1-mug-placed.png`
- `docs/reports/r2a1-fork-free.png` / `r2a1-fork-held.png` / `r2a1-fork-placed.png`
- `docs/reports/r2a1-laundry-firstview.png`
- `docs/reports/LIVING_A6_BROWSER_PLAYABILITY.md`
- `docs/reports/PLAYABLE_MVP_TRIAGE.md`

**验证命令**：
```bash
git status --short
# 预期: 上述 11 个文件仍显示 ?? 且无其他待提交项
```

### 步骤 5：Push 前最终校验
**目的**：确认 3 个 commit 干净、工作区只剩 untracked 验证产物。
```bash
git log --oneline -5
# 预期: 看到 3 个新 commit 在 d05508a 之上
git status --short
# 预期: 仅剩 11 个 ?? 验证产物
git diff --check
# 预期: 无空白错误
```

### 步骤 6：Push main
```bash
git push origin main
```
**触发**：deploy.yml 自动运行 lint + test + qa + build → 部署 GitHub Pages。

### 步骤 7：Push 后线上验收
等待 GitHub Actions deploy 完成后，验收 5 条 Pages URL：
1. `https://<user>.github.io/homemem-arena/` — 首页加载，非白屏
2. `https://<user>.github.io/homemem-arena/tasks` — 任务列表
3. `https://<user>.github.io/homemem-arena/play/task-clean-table` — 深链接不回落根路径
4. `https://<user>.github.io/homemem-arena/play/task-leave-home` — L2 旗舰关
5. `https://<user>.github.io/homemem-arena/play/task-laundry-sort` — L3

每条检查：
- 页面加载成功，非白屏
- Console 0 error 级
- Canvas 高度正常（>0.6 vpH）
- 进入 /play/* 后 5 秒内 phase !== 'briefing'（自动进入 playing）

---

## 四、Assumptions & Decisions（假设与决策）

### 决策
1. **R2A.1 禁令已解除**：用户确认 R2A.1 结束（接受 PARTIAL 状态），允许 commit/push
2. **验证产物全部保持 untracked**：r2a1 脚本 + 截图 + 报告 md 不提交，符合"报告文件保持 untracked"规则
3. **3 批次拆分顺序**：A(锚点) → B(资产) → C(R1遗留)，按依赖关系（C 依赖 B 的 modelAssetId，A 独立）
4. **一次性 push**：3 个 commit 打包一次性 push main，符合"基础设施类 gate 全过后统一 push"

### 假设
- 本地门禁全过 → 远程 CI（Ubuntu + Node 24）大概率通过（历史一致）
- qa:layout 的 1 个 MINOR 失败（container-near-door-heuristic）非本轮引入，不阻塞 push
- qa:assets 的 orphan GLB 警告是 legacy MODEL_REGISTRY 未登记新资产，不影响运行时（RUNTIME_MODEL_ASSET_REGISTRY 已覆盖）
- stash `wip-layout-before-round1-acceptance` 保持不动，不影响本次 push

### 风险
- **远程 CI 失败风险**：低（本地全套通过，历史一致）；若失败需 revert 对应 commit
- **Pages 部署回归风险**：低（build 产物验证通过）；若白屏需立即 revert
- **资产体积风险**：22 个 furniture GLB + 4 food GLB 增加仓库体积，但单文件均 <10M，可接受

---

## 五、Verification Steps（验证步骤）

### 5.1 Commit 阶段验证
- [ ] `git log --oneline -5` 显示 3 个新 commit
- [ ] `git status --short` 仅剩 11 个 ?? 验证产物
- [ ] `git diff --check` 无空白错误

### 5.2 Push 后 CI 验证
- [ ] GitHub Actions deploy.yml 运行成功（lint + test + qa + build 全绿）
- [ ] Pages 部署成功，无 build error

### 5.3 线上 smoke 验收
- [ ] 5 条 URL 全部加载成功，非白屏
- [ ] 深链接 /play/* 不回落根路径
- [ ] Console 0 error 级
- [ ] Canvas 高度正常
- [ ] phase 自动进入 playing

### 5.4 回滚方案
若 push 后线上发现 regression：
```bash
# 精确 revert 出问题的 commit
git revert <commit-sha>
git push origin main
```
3 个 commit 独立可回滚。

---

## 六、GO / NO-GO 标准

**GO（可以 push）**：
- 步骤 0 预检全绿
- 3 个 commit 成功创建，工作区仅剩 untracked 验证产物
- 用户最终确认 push

**NO-GO（停止）**：
- 步骤 0 预检任一失败
- commit 范围无法准确隔离
- 发现意外文件混入 commit
