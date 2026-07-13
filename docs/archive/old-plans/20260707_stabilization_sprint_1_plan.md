# Stabilization Sprint Plan（拆分版）

> 状态：Sprint 1A 执行中
> 基线：Current-State Delta Audit 2026-07-12
> 约束：不新增剧情、不调整游戏数值、不修改第二/第三关玩法、不新增模型、不进行大型架构重写、不提交/推送

---

## Sprint 1A：正确性和生命周期修复

### 1. 修复 breakfast 两个 Probe

- 文件：`src/data/tasks/breakfast.ts`
- `p-object-state-fridge`：问题和答案改为与 `se-fridge-auto-close`（`type: 'message'`）的真实效果一致——"提醒玩家关冰箱门"，不声称"自动关上"
- `p-temporal-penalty`：问题改为"系统在第几步第一次提醒牛奶需要归位"，不声称"扣分"
- 答案保持 15 步（事件确实在 step 15 触发）

### 2. 针对两个 Probe 的明确回归测试

- 文件：`src/game/probeConsistency.test.ts`（新建）
- 只针对这两个 Probe 写明确断言，不使用中文关键词黑名单
- 断言：
  - `p-object-state-fridge` 的 correctAnswer 等于 `'提醒玩家记得关冰箱门'`
  - `se-fridge-auto-close` 的 type 等于 `'message'`
  - `p-temporal-penalty` 的 correctAnswer 等于 `'15 步'`
  - `se-milk-deduct-points` 的 type 等于 `'message'`

### 3. 修复 HUD 和 ArenaPage 卸载后的音频 cleanup

- `HUD.tsx`：BGM useEffect 和房间环境音 useEffect 添加 cleanup
- `ArenaPage.tsx`：卸载时调用 `stopBgm()` + `stopAllSfx()`（含 `stopChaosAmbient` + `stopRoomAmbient`）
- `sfx.ts`：新增 `stopRoomAmbient()` 和 `stopAllSfx()` 导出

### 4. AudioContext 统一问题：deferred

- 本轮不统一 AudioContext
- 先确认两个模块级 Context（`sfx.ts` + `bgm.ts`）是否真的会随路由切换累积实例
- 证据：两处 `initAudioContext` / `initAudio` 均有 `if (!audioContext)` 守卫，懒初始化，不会每次进入关卡创建新实例
- 结论：记录为 deferred，无累积证据

### 5. 修复 3 个 lint warning

- `main.tsx`：提取 `AudioInitializer` 到独立组件文件 + 修复 useEffect 依赖
- `FirstPersonControls.tsx`：`handleTap` 改为在事件回调内用 `useGameStore.getState()` / `useToastStore.getState()` 读取最新值，不捕获闭包变量
- 不使用 disable 注释

### 6. 修正 README

- 关卡顺序统一为：出门→餐桌→洗衣→早餐
- 角色映射：玩家叙事名"小橡"，系统型号"MEM-07"
- 测试和 lint 状态同步

### 7. 删除 .backup 和 .bak

- `src/store/useGameStore.ts.backup`
- `src/components/arena3d/HUD.tsx.bak`

### 8. 删除 WelcomeModal

- 已确认零引用（Grep 仅命中文件自身）
- 删除 `src/components/help/WelcomeModal.tsx`

### 9. 暂不添加 Playwright、test API、E2E

### 10. 验证

- `npm test` / `npm run lint` / `npm run build` / `npm run qa` 全绿

### 11. 输出 Sprint 1A 报告和 git diff

---

## Sprint 1B：浏览器测试基础设施（1A 确认后执行）

### 1. 安装 @playwright/test

### 2. 环境变量

- 使用 `VITE_E2E` 环境变量或 `vite --mode e2e`，不使用 `import.meta.env.MODE === 'test'`

### 3. Test API 设计

- 默认只读
- 可写方法必须调用真实 command 层
- 禁止 `advanceStep`、`setPhase`、`setLevelCompleted`、直接修改实体位置等后门

### 4. 测试分层

- **a. 真实键鼠浏览器 Smoke**：首页、任务选择、Briefing、HUD、WASD、V、E/F 输入、返回、无 console error、音频停止
- **b. command-backed 浏览器集成流程**：真实 command 层完成第一关目标、进入 Probe、进入 Result、重新游玩
- 不得把 command-backed 测试描述成完整空间交互 E2E

### 5. 截图

- 保存到 `qa-artifacts/e2e/`，不放 `test-results/`

### 6. 验证

- `npm test` / `npm run lint` / `npm run build` / `npm run qa` / `npm run e2e` 全绿
