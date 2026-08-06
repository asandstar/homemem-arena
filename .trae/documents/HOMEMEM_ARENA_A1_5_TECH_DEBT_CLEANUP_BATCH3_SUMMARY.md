# A1.5 重构技术债务清理 · 第 3 批总结报告

> 生成时间：2026-08-06
> 对应提交：`e2264fd refactor: A1.5 紧凑中心枢纽布局重构 + 技术债务清理 D1-D14`
> 报告范围：D10 ~ D14（第 3 批），含第 2 批残留修复

## 一、清理批次概览

| 批次 | 范围 | 状态 |
|------|------|------|
| 第 1 批 | D1 + D2 + D3 | 已完成 |
| 第 2 批 | D4 ~ D9 | 已完成 |
| 第 3 批 | D10 ~ D14 | 本次完成 |

第 3 批聚焦于**调试变量封装**、**环境变量统一**和**循环依赖排查**三类可维护性债务。

## 二、修复项明细

### D12 — Minimap/UiStore 循环依赖排查

**问题定位**

非模块级循环导入，而是 **render-time 写回循环**：

- [Minimap.tsx#L114-L125](../../src/components/arena3d/Minimap.tsx) 的 fit effect 在 `dimensions`/`currentRoom` 变化时调用 `setMinimapZoom`/`setMinimapPan` 写回 UiStore
- briefing 阶段容器尺寸未稳定（多次 `setDimensions`），每次变更级联 effect → UiStore update → re-render
- 叠加其他 briefing 订阅可能触发 "Maximum update depth exceeded" 或 WebGL Context Lost

**修复措施**

- fit effect 增加 `dimensions.width > 0 && dimensions.height > 0` 有效性守卫，减轻级联
- [ArenaPage.tsx#L457-L467](../../src/pages/ArenaPage.tsx) TODO 注释记录完整调查结论，供后续完全修复参考

**影响范围**

- [Minimap.tsx](../../src/components/arena3d/Minimap.tsx)：fit effect 行为变化（尺寸无效时不写回 store）
- [ArenaPage.tsx](../../src/pages/ArenaPage.tsx)：注释更新，无逻辑变化

### D13 — 环境变量统一封装（env.ts）

**问题**

多处使用 `(import.meta as any)?.env` 类型不安全模式，且重复 try/catch 守卫。

**修复措施**

- [env.ts](../../src/utils/env.ts) 补充 `BASE_URL` 导出（之前仅有 IS_DEV / IS_PROD / MODE / IS_E2E）
- [ModelAsset.tsx](../../src/components/arena3d/models/ModelAsset.tsx) 的 `CACHE_KEY_PREFIX` 改用 `BASE_URL` 导入，移除残留的 `(import.meta as any).env?.BASE_URL`

**影响范围**

- [env.ts](../../src/utils/env.ts)：新增导出
- [ModelAsset.tsx](../../src/components/arena3d/models/ModelAsset.tsx)：缓存 key 计算逻辑简化

### D14 — 全局调试变量封装（renderDebug.ts）

**问题**

`window.__HOMEMEM_RENDER_READY__` 和 `window.__HOMEMEM_MODEL_STATS_SNAP__` 直接操作，类型不安全且分散。

**修复措施**

- [renderDebug.ts](../../src/utils/renderDebug.ts) 集中管理，提供 `getRenderReady` / `setRenderReady` / `patchRenderReady` / `getModelStatsSnap` / `setModelStatsSnap` / `defineModelStatsGetter` 类型安全方法
- [Scene3D.tsx#L25-L31](../../src/components/arena3d/Scene3D.tsx) 改用封装方法，移除本地 `HommemRenderReady` 接口定义
- [ModelAsset.tsx#L9-L10](../../src/components/arena3d/models/ModelAsset.tsx) 修复重复 `IS_DEV` 声明（import 与本地 let 冲突），改用 `defineModelStatsGetter`/`setModelStatsSnap`

**影响范围**

- [renderDebug.ts](../../src/utils/renderDebug.ts)：新建文件
- [Scene3D.tsx](../../src/components/arena3d/Scene3D.tsx)：全局变量访问迁移
- [ModelAsset.tsx](../../src/components/arena3d/models/ModelAsset.tsx)：全局变量访问迁移 + 重复声明修复

### 附带修复 — 第 2 批残留清理

**问题**

第 2 批删除 `updateRoomAmbient` / `getEntityVisualHeight` 后，部分声明和导入未同步清理，导致 `tsc --noEmit` 在 build/qa 阶段报错。

**修复措施**

- [sfx.ts#L655-L691](../../src/audio/sfx.ts) 移除 `startRoomAmbient`、`ROOM_AMBIENT_CONFIG`、`currentRoomType`、`isRoomAmbientStopped` 等孤儿声明；`resetRoomAmbientFlag` 保留为空实现（外部调用方无需改动）
- [placement.test.ts#L2-L4](../../src/game/placement.test.ts) 移除已删除的 `getEntityVisualHeight` 导入

**影响范围**

- [sfx.ts](../../src/audio/sfx.ts)：移除 4 个无用声明 + 1 个无用函数
- [placement.test.ts](../../src/game/placement.test.ts)：移除 1 个过期导入

## 三、验证结果

| 门禁 | 结果 |
|------|------|
| `npm run lint` | 0 errors（30 warnings，较修复前减少 4 个） |
| `npx tsc --noEmit` | 0 errors |
| `npm test` | 355/355 passed |
| `npm run build` | success |
| `npm run qa` | success（static + assets + rooms + tasks + layout + build 全过） |

## 四、后续优化建议

### P1 — D12 完全修复（Minimap fit 改为 lazy/derived）

**当前状态**：仅加 dimensions 守卫减轻级联，未根治。

**建议方案**：将 fit 计算改为 derived state（useMemo 基于 dimensions + currentRoom 计算），不写回 UiStore；用户手动 zoom/pan 时才持久化到 store。完成后可将 [ArenaPage.tsx#L468](../../src/pages/ArenaPage.tsx) 的 HUD 渲染条件从 `task && !briefingOpen` 放宽为 `phase !== 'ended' && task`。

### P2 — D13/D14 扩展迁移

**当前状态**：env.ts 和 renderDebug.ts 已建立，但仅迁移了核心消费者（Scene3D、ModelAsset）。

**剩余工作**：17 处 `(import.meta as any)?.env` 散落在以下文件：

- `src/routes.tsx`
- `src/audio/audioManager.ts`
- `src/pages/ResultPage.tsx`
- `src/components/GlobalErrorBoundary.tsx`
- `src/pages/SessionDataPage.tsx`
- `src/pages/ArenaPage.tsx`
- `src/data/tasks/index.ts`
- `src/pages/ProbePage.tsx`
- `src/utils/e2eTestApi.ts`
- `src/App.tsx`（3 处）
- `src/components/arena3d/RegisteredModel.tsx`
- `src/components/arena3d/models/resolveAssetUrl.ts`
- `src/components/arena3d/models/ModelRegistry.ts`
- `src/components/arena3d/HUD.tsx`

建议按文件批次迁移，每批独立 commit。

### P2 — sfx.ts 进一步瘦身

**当前状态**：`stopRoomAmbient` / `resetRoomAmbientFlag` / `isLegacyRoomAmbientActive` 保留为兼容空壳。

**建议方案**：评估外部调用方（useUiStore、ArenaPage、audioManager、e2eTestApi）是否可移除调用，若可则删除这 3 个函数及关联的 `roomAmbientOscillator` / `roomAmbientGain` / `roomAmbientTimer` 状态变量。

### P3 — 缓存 key 治理

**当前状态**：`CACHE_KEY_PREFIX` 已使用 `BASE_URL`，但 FIFO 缓存策略的 50 条上限和 20 条清理数仍是硬编码。

**建议方案**：若未来模型数量增长，考虑将缓存配置提取为常量模块，便于统一调优。

## 五、提交说明

本次清理涉及 32 个文件，由于改动相互依赖（Scene3D.tsx/ModelAsset.tsx 已导入 env.ts/renderDebug.ts，rooms.ts 移除 kitchen 后 Scene3D.tsx 必须同步更新），无法安全拆分为独立可验证的 commit，合并为 1 个 commit 提交：

- **commit**: `e2264fd`
- **message**: `refactor: A1.5 紧凑中心枢纽布局重构 + 技术债务清理 D1-D14`
- **变更**: 32 files changed, 748 insertions(+), 632 deletions(-)
- **push 状态**: 未 push（遵循项目约束，push 需单独确认）

## 六、关联文档

- [HOMEMEM_ARENA_A1_5_FINAL_LAYOUT_APPROVAL_REPORT.md](./HOMEMEM_ARENA_A1_5_FINAL_LAYOUT_APPROVAL_REPORT.md) — A1.5 布局最终批准报告
- [HOMEMEM_ARENA_A1_5_LAYOUT_RECONCILIATION_SUMMARY.md](./HOMEMEM_ARENA_A1_5_LAYOUT_RECONCILIATION_SUMMARY.md) — A1.5 布局对账总结
- [TECH_DEBT_RESOLUTION_plan.md](./TECH_DEBT_RESOLUTION_plan.md) — 技术债务解决计划
