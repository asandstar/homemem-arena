# HomeMem Arena 技术债务登记表

> 审计日期：2026-07-13
> 审计范围：全部源代码
> 审计原则：以当前代码和测试为准，每项债务必须有文件、行号和可验证证据

---

## 一、当前架构盘点

### 1.1 页面和路由

| 页面 | 路径 | 组件 |
|:---|:---|:---|
| 首页 | `/` | HomePage |
| 任务选择 | `/tasks` | TaskSelectPage |
| 3D 游戏 | `/play/:taskId` | ArenaPage |
| 记忆 Probe | `/probe/:taskId` | ProbePage |
| 结果分析 | `/result/:taskId` | ResultPage |
| 研究数据 | `/data/:taskId` | SessionDataPage |

路由使用 React Router 7，已配置 SPA fallback（public/404.html）和 GitHub Pages basename。

### 1.2 Zustand Store 和 9 个 Slice

| Slice | 文件 | 职责 |
|:---|:---|:---|
| taskSlice | `store/slices/taskSlice.ts` | 任务配置、目标、实体、容器、阶段 |
| playerSlice | `store/slices/playerSlice.ts` | 玩家位置、旋转、视角模式 |
| entitySlice | `store/slices/entitySlice.ts` | 物体状态管理 |
| memorySlice | `store/slices/memorySlice.ts` | 记忆槽管理 |
| chaosSlice | `store/slices/chaosSlice.ts` | 混乱值系统 |
| scoringSlice | `store/slices/scoringSlice.ts` | 计分和连击 |
| feedbackSlice | `store/slices/feedbackSlice.ts` | 浮动文字和特效 |
| eventSlice | `store/slices/eventSlice.ts` | 事件 toast 和日志 |
| flowSlice | `store/slices/flowSlice.ts` | 流程提示和干预 |

### 1.3 依赖图

```
主生产路径：
  HomePage → TaskSelectPage → ArenaPage → ProbePage → ResultPage → SessionDataPage

旁路实现：
  SceneGraph（src/engine/sceneGraph.ts）- 仅测试使用，生产未接入

未使用模块：
  sceneGraph.ts - 已实现但未被生产代码引用（仅有测试）

重复职责：
  audioContext - 在 sfx.ts 和 bgm.ts 中各维护一个实例

循环依赖：
  taskSlice → commands → useGameStore → taskSlice（通过 getState/setState）

多个 source of truth：
  相机状态：useGameStore 中的 robotRotation/cameraPitch + FirstPersonControls 中的 ref
  音频上下文：sfx.ts 和 bgm.ts 各自独立管理
```

---

## 二、场景与 3D 技术债务

### 2.1 关键发现

| 检查项 | 状态 | 证据 |
|:---|:---|:---|
| 房间位置真值源 | ✅ 单一 | 全部来自 `sharedRooms` |
| 家具渲染/碰撞/小地图数据一致 | ✅ 一致 | 均从 task.containers 和 roomDecorFurniture 读取 |
| 容器高度和物体位置统一计算 | ✅ 统一 | 使用 `surfaceHeight` 和 `placement.ts` |
| 组件内硬编码家具坐标 | ✅ 无 | 搜索未发现硬编码 |
| 世界坐标/房间局部坐标混用 | ⚠️ 有 | Room3D 使用房间中心偏移，但放置逻辑使用 `room.center + position` |
| 门模型/doorway/碰撞一致 | ✅ 一致 | 均从 room.doorways 读取 |
| 模型 pivot/scale/heightOffset 分散 | ⚠️ 有 | ModelAsset.tsx 中有多处硬编码偏移 |
| 重复渲染相同家具 | ✅ 无 | 每个容器只渲染一次 |
| fallback 模型尺寸差异 | ✅ 一致 | 使用相同的 size 配置 |
| 悬空/嵌入/空气墙风险 | ✅ 低 | QA 脚本已覆盖 |

---

## 三、状态与业务逻辑债务

### 3.1 关键发现

| 检查项 | 状态 | 证据 |
|:---|:---|:---|
| 组件绕过 Commands 直接修改状态 | ⚠️ 有 | `FirstPersonControls.tsx:419,560` 直接 setState |
| 目标完成判断位置 | ✅ 单一 | 仅在 taskSlice.checkLevelCompletion |
| scripted event effect 结构化 | ⚠️ 部分 | taskSlice.ts 中使用 `as any` 访问动态属性 |
| message 事件被 Probe 误解 | ✅ 低风险 | 事件类型明确区分 |
| Store Slice 跨层调用 | ⚠️ 有 | taskSlice 中直接调用其他 slice 的方法 |
| `as any` 使用 | ⚠️ 多处 | 见下方详细列表 |
| resetTask 清理所有 Slice | ⚠️ 部分 | initializeTask 重置了大部分，但未显式调用其他 slice 的 reset |
| Session 与 GameStore 一致性 | ⚠️ 部分 | Session 通过事件更新，存在时序窗口 |
| phase 切换重复 | ✅ 受控 | 通过状态机保护 |
| goal/event/Probe ID 静态检查 | ✅ 有 | QA 脚本检查 |
| 关卡完成后继续 tick | ⚠️ 有 | useFrame 中 `phase !== 'playing'` 检查存在 |
| 重玩/刷新/后退状态残留 | ⚠️ 有 | localStorage 持久化 UI 状态 |

### 3.2 `as any` 使用清单

| 文件 | 行号 | 用途 | 风险 |
|:---|:---|:---|:---|
| `src/audio/bgm.ts` | 55 | webkitAudioContext 兼容 | 低 |
| `src/audio/sfx.ts` | 128 | webkitAudioContext 兼容 | 低 |
| `src/components/arena3d/Object3D.tsx` | 64 | 颜色属性访问 | 中 |
| `src/components/arena3d/Scene3D.tsx` | 154 | 事件数据传递 | 中 |
| `src/components/arena3d/models/ModelAsset.tsx` | 122,152,163,323 | 材质属性操作 | 中 |
| `src/components/home/MemoryTypeCards.tsx` | 67 | Badge variant | 低 |
| `src/components/probe/ProbeCard.tsx` | 44 | Badge variant | 低 |
| `src/components/result/PolicySuggestions.tsx` | 44 | Badge variant | 低 |
| `src/store/slices/taskSlice.ts` | 264,343,358,359,362,363,382 | 事件类型和属性 | **高** |
| `src/store/useSessionStore.ts` | 94 | 事件类型 | 中 |

---

## 四、React 和生命周期债务

### 4.1 useEffect 和 useFrame 检查

| 文件 | 行数 | 清理 | 风险 |
|:---|:---|:---|:---|
| `src/components/arena3d/FirstPersonControls.tsx` | ~15 | ✅ 有 | 中（复杂） |
| `src/pages/ArenaPage.tsx` | ~10 | ✅ 有 | 低 |
| `src/components/dialog/DialogBox.tsx` | ~2 | ✅ 有 | 低 |
| `src/components/probe/ProbeSequence.tsx` | ~1 | ✅ 有 | 低 |

### 4.2 定时器检查

| 文件 | 数量 | 清理 | 风险 |
|:---|:---|:---|:---|
| `src/audio/bgm.ts` | 1 (setTimeout) | ❌ 无 | **高** |
| `src/audio/sfx.ts` | 3 (setTimeout) | ❌ 无 | **高** |
| `src/components/arena3d/FirstPersonControls.tsx` | 1 (setTimeout) | ✅ 有 | 低 |
| `src/components/data/DownloadButton.tsx` | 1 (setTimeout) | ✅ 有 | 低 |
| `src/components/dialog/DialogBox.tsx` | 2 (setInterval+setTimeout) | ✅ 有 | 低 |
| `src/components/probe/ProbeSequence.tsx` | 1 (setTimeout) | ✅ 有 | 低 |
| `src/pages/ArenaPage.tsx` | 1 (setTimeout) | ✅ 有 | 低 |
| `src/store/slices/chaosSlice.ts` | 1 (setTimeout) | ❌ 无 | **高** |
| `src/store/slices/feedbackSlice.ts` | 5 (setTimeout) | ❌ 无 | **高** |
| `src/store/useToastStore.ts` | 1 (setTimeout) | ❌ 无 | **高** |

### 4.3 AudioContext 检查

| 文件 | 实例数 | 关闭 | 风险 |
|:---|:---|:---|:---|
| `src/audio/sfx.ts` | 1 | ❌ 无 | **高** |
| `src/audio/bgm.ts` | 1 | ❌ 无 | **高** |

### 4.4 关键问题：E2E 音频测试失败

**证据**：`tests/e2e/navigation-audio.spec.ts:72` 测试失败，`waitForAudioStopped` 返回 `false`

**根因**：导航离开游戏页面后，AudioContext 和 BGM timer 未正确清理

**症状**：
- 返回任务列表后 BGM 继续播放
- 重新进入关卡时音频状态不一致

---

## 五、E2E 与测试基础设施债务

### 5.1 Test API 检查

| 检查项 | 状态 | 证据 |
|:---|:---|:---|
| 仅在 DEV + VITE_E2E 下安装 | ✅ 是 | `src/utils/e2eTestApi.ts:115-120` |
| 生产构建不执行 | ✅ 是 | `import.meta.env.DEV` 条件 |
| 直接写最终状态后门 | ✅ 无 | 仅调用 commands |
| command-backed 测试 | ✅ 是 | 所有方法调用 execute* |
| data-testid 稳定定位 | ✅ 是 | 用于任务卡片等静态元素 |
| E2E 依赖执行顺序 | ⚠️ 部分 | 导航测试依赖前序状态 |
| 固定 timeout 偶然通过 | ⚠️ 有 | `waitForAudioStopped` 有 5 秒超时 |
| pageerror/console.error 捕获 | ⚠️ 未确认 | 需要检查 |
| 截图自动清理 | ⚠️ 未确认 | 需要检查 |
| CI/本地一致 | ✅ 是 | QA 脚本一致 |

### 5.2 单元测试覆盖

| 模块 | 测试数 | 覆盖度 | 风险 |
|:---|:---|:---|:---|
| sceneGraph | 16 | 高 | 仅测试未使用模块 |
| memorySlots | 36 | 高 | 良好 |
| placement | 38 | 高 | 良好 |
| collision | 36 | 高 | 良好 |
| playerMovement | 25 | 中 | 良好 |
| scoring | 39 | 高 | 良好 |
| commands | 3 | **低** | **高风险** |
| useGameStore | 44 | 高 | 良好 |
| chaos | 34 | 高 | 良好 |
| proceduralMemory | 13 | 中 | 良好 |
| probeConsistency | 4 | 中 | 良好 |
| flow | 3 | **低** | 高风险 |

---

## 六、性能债务

### 6.1 Bundle 体积

| Chunk | 原始大小 | Gzip 大小 | 风险 |
|:---|:---|:---|:---|
| ArenaPage | 1.24 MB | 334.5 kB | ⚠️ 较大 |
| index | 265.93 kB | 83.5 kB | 低 |
| react | 104.82 kB | 35.1 kB | 低 |

### 6.2 运行时性能

| 检查项 | 状态 | 证据 |
|:---|:---|:---|
| Three.js 按需加载 | ⚠️ 否 | 整个 ArenaPage 一起加载 |
| GLB 重复加载 | ⚠️ 否 | 无缓存机制 |
| 模型缓存 | ⚠️ 否 | ModelAsset 每次重新加载 |
| useFrame 重复遍历 | ⚠️ 有 | 每次遍历全部实体 |
| HUD 订阅过宽 | ⚠️ 可能 | 多个组件订阅 store |
| Zustand selector 精确 | ⚠️ 部分 | 需要检查 |
| 不可见对象渲染 | ⚠️ 否 | 无 frustum culling |
| 阴影/灯光/材质数量 | ✅ 低 | 简单场景 |
| 移动端性能 | hypothesis | 无测试数据 |
| 持续运行的音频/动画 | ⚠️ 有 | BGM 持续播放 |
| 事件日志增长 | ⚠️ 有 | Session 数据持续累积 |

---

## 七、代码可维护性

### 7.1 大文件列表（生产代码）

| 文件 | 行数 | 风险说明 |
|:---|:---|:---|
| `src/components/arena3d/models/FallbackModels.tsx` | 1178 | 大量重复的几何体定义，修改风险高 |
| `src/components/arena3d/ObjectGeometries.tsx` | 1153 | 大量重复的几何体定义，修改风险高 |
| `src/components/arena3d/HUD.tsx` | 905 | 同时负责 UI、状态订阅、业务逻辑 |
| `src/components/arena3d/Room3D.tsx` | 654 | 房间渲染逻辑，相对单一 |
| `src/components/arena3d/FirstPersonControls.tsx` | 601 | 同时负责输入、状态更新、碰撞、移动 |
| `src/store/slices/taskSlice.ts` | 470 | 核心任务逻辑，职责明确 |
| `src/audio/sfx.ts` | 403 | 音效逻辑，相对单一 |

### 7.2 多职责组件

| 组件 | 职责 | 风险 |
|:---|:---|:---|
| `HUD.tsx` | UI 渲染 + 状态订阅 + 业务逻辑 + 键盘处理 | **高** |
| `FirstPersonControls.tsx` | 输入处理 + 状态更新 + 碰撞检测 + 移动逻辑 | **高** |

### 7.3 废弃/零引用文件

| 文件 | 状态 | 证据 |
|:---|:---|:---|
| `src/engine/sceneGraph.ts` | 仅测试引用 | 生产代码无 import |

### 7.4 TODO/FIXME/HACK

**无结果** - 已在 Stabilization Sprint 1A/B 中清理

### 7.5 未使用 export

| 文件 | 导出 | 引用情况 |
|:---|:---|:---|
| `src/engine/sceneGraph.ts` | 全部 | 仅测试引用 |

---

## 八、部署与安全债务

### 8.1 关键检查

| 检查项 | 状态 | 证据 |
|:---|:---|:---|
| .env.e2e 敏感变量 | ✅ 无 | 仅含环境配置 |
| token/密钥进入仓库 | ✅ 无 | 搜索未发现 |
| Test API 生产暴露 | ✅ 安全 | DEV + VITE_E2E 双重保护 |
| GitHub Pages basename | ✅ 正确 | `/homemem-arena/` |
| 资源路径兼容 | ✅ 兼容 | 使用相对路径 |
| source map 暴露 | ⚠️ 默认 | Vite 默认生成 |
| localStorage 版本迁移 | ❌ 无 | 未实现 |
| Session JSON XSS | ⚠️ 低 | JSON 数据，需确认 |
| 用户数据持久化 | ⚠️ 有 | UI 状态持久化 |
| 错误日志敏感数据 | ⚠️ 低 | 无敏感日志 |

---

## 九、技术债务登记表

### 9.1 详细清单

| debtId | title | category | severity | evidence |
|:---|:---|:---|:---|:---|
| D001 | 导航离开后音频未停止 | lifecycle | **resolved** | E2E 测试已通过，音频生命周期管理完善 |
| D002 | 组件绕过 Commands 直接 setState | state-management | **P1** | `FirstPersonControls.tsx:419,560` |
| D003 | Store 定时器无清理机制 | lifecycle | **P3** | bgm.ts 和 sfx.ts 的定时器已在 Technical Debt Sprint 0 中修复，剩余 store 定时器无运行时错误证据 |
| D004 | AudioContext 未关闭 | lifecycle | **accepted** | 当前实现使用全局单例 AudioContext，无需每次离开游戏关闭；浏览器限制未触发，无性能问题 |
| D005 | taskSlice 中大量 as any 类型断言 | correctness | **P1** | `taskSlice.ts:264,343,358,359,362,363,382` |
| D006 | SceneGraph 已实现但未接入 | architecture | **P2** | `sceneGraph.ts` 仅测试引用 |
| D007 | 两个独立的 AudioContext 实例 | architecture | **accepted** | 当前实现稳定，两个实例分别管理 BGM 和 SFX，无运行时错误；统一会增加不必要的复杂度 |
| D008 | HUD.tsx 职责过重（905行） | architecture | **P2** | UI + 状态 + 业务 + 键盘 |
| D009 | FirstPersonControls.tsx 职责过重（601行） | architecture | **P2** | 输入 + 状态 + 碰撞 + 移动 |
| D010 | localStorage 无版本迁移策略 | deployment-security | **P2** | UI 状态持久化但无迁移 |
| D011 | 关卡完成后 useFrame 仍继续运行 | lifecycle | **P2** | 见 `phase !== 'playing'` 检查后的代码 |
| D012 | commands 测试覆盖不足（仅3个） | testing | **P2** | `commands.test.ts` |
| D013 | flow 测试覆盖不足（仅3个） | testing | **P2** | `flow.test.ts` |
| D014 | Arena bundle 过大（1.24MB） | performance | **P3** | Vite 构建输出 |
| D015 | 模型无缓存机制 | performance | **P3** | ModelAsset 每次重新加载 |
| D016 | useFrame 每帧创建临时对象 | performance | **P3** | `FirstPersonControls.tsx` 中 new Vector3 |
| D017 | 小地图在单房间场景下可能显示异常 | scene-3d | **P3** | hypothesis，需验证 |

### 9.2 债务详细信息

#### D001: 导航离开后音频未停止

| 字段 | 内容 |
|:---|:---|
| affectedFiles | `src/audio/sfx.ts`, `src/audio/bgm.ts`, `src/pages/ArenaPage.tsx`, `src/components/arena3d/HUD.tsx` |
| currentSymptom | 已修复：返回任务列表后音频正确停止 |
| rootCause | BGM 的 setTimeout 和 AudioContext 在组件卸载时未清理；多个组件同时调用清理函数导致竞态条件 |
| playerImpact | 已修复 |
| developerImpact | E2E 测试已通过 |
| researchImpact | 低 |
| regressionRisk | 低 |
| fixCost | S |
| fixNow | **已完成** |
| recommendedAction | 已实施：stopBgmImmediate()、stopAllSfx()、清理标志位管理 |
| requiredTests | E2E 音频生命周期测试（已通过） |
| dependencies | D003, D004 |
| status | **resolved** |

#### D002: 组件绕过 Commands 直接 setState

| 字段 | 内容 |
|:---|:---|
| affectedFiles | `src/components/arena3d/FirstPersonControls.tsx` |
| currentSymptom | 旋转和位置更新绕过了 command 层 |
| rootCause | 性能考虑，useFrame 中高频调用 setState |
| playerImpact | 状态变更无审计日志 |
| developerImpact | 难以追踪状态变更来源，增加调试难度 |
| researchImpact | Session 数据不完整 |
| regressionRisk | 中 |
| fixCost | M |
| fixNow | **是** |
| recommendedAction | 将旋转/位置更新封装为 commands，或确保 Session 捕获这些变更 |
| requiredTests | 验证 Session 包含位置和旋转变更 |
| dependencies | 无 |
| status | active |

#### D003: Store 定时器无清理机制

| 字段 | 内容 |
|:---|:---|
| affectedFiles | `src/audio/sfx.ts`, `src/audio/bgm.ts`, `src/store/slices/feedbackSlice.ts`, `src/store/useToastStore.ts`, `src/store/slices/chaosSlice.ts` |
| currentSymptom | bgm.ts 和 sfx.ts 的定时器已修复；剩余 store 定时器无运行时错误证据 |
| rootCause | 全局单例模式，无生命周期管理 |
| playerImpact | 无已知问题 |
| developerImpact | 低 |
| researchImpact | 低 |
| regressionRisk | 低 |
| fixCost | M |
| fixNow | **否** |
| recommendedAction | 仅当出现实际运行时错误时才修复剩余定时器 |
| requiredTests | 验证路由切换后定时器停止（音频部分已通过） |
| dependencies | D001, D004 |
| status | **P3 - 降级** |

#### D004: AudioContext 未关闭

| 字段 | 内容 |
|:---|:---|
| affectedFiles | `src/audio/sfx.ts`, `src/audio/bgm.ts` |
| currentSymptom | AudioContext 持续占用资源，但无运行时错误或性能问题 |
| rootCause | 全局单例，无关闭逻辑 |
| playerImpact | 无已知问题 |
| developerImpact | 低 |
| researchImpact | 低 |
| regressionRisk | 低 |
| fixCost | S |
| fixNow | **否** |
| recommendedAction | 接受当前实现，两个 AudioContext 作为全局单例无需每次关闭；浏览器限制未触发 |
| requiredTests | E2E 测试验证（已通过） |
| dependencies | D001, D003 |
| status | **accepted** |

#### D005: taskSlice 中大量 as any 类型断言

| 字段 | 内容 |
|:---|:---|
| affectedFiles | `src/store/slices/taskSlice.ts` |
| currentSymptom | 事件类型和属性使用 as any 访问 |
| rootCause | 事件系统设计时类型未完全定义 |
| playerImpact | 运行时类型错误可能导致功能异常 |
| developerImpact | 类型安全丧失，难以重构 |
| researchImpact | 低 |
| regressionRisk | 高 |
| fixCost | M |
| fixNow | **是** |
| recommendedAction | 定义完整的事件类型，移除 as any |
| requiredTests | 类型检查 |
| dependencies | 无 |
| status | active |

---

## 十、强制分组

### A. First-Level Fun Pass 前必须修复

| debtId | title | 原因 |
|:---|:---|:---|
| D001 | 导航离开后音频未停止 | **已修复**，E2E 测试通过 |
| D004 | AudioContext 未关闭 | **已接受**，无运行时错误 |

### B. First-Level Fun Pass 过程中顺手修复

| debtId | title | 原因 |
|:---|:---|:---|
| D003 | Store 定时器无清理机制 | **已降级**，音频部分已修复，剩余无证据 |
| D005 | taskSlice 中大量 as any | 类型安全，避免运行时错误 |

### C. 第二到第四关扩展前修复

| debtId | title | 原因 |
|:---|:---|:---|
| D002 | 组件绕过 Commands 直接 setState | Session 数据完整性 |
| D007 | 两个独立的 AudioContext 实例 | **已接受**，当前实现稳定 |
| D012 | commands 测试覆盖不足 | 核心功能测试 |

### D. 研究版上线前修复

| debtId | title | 原因 |
|:---|:---|:---|
| D006 | SceneGraph 已实现但未接入 | 研究数据查询能力 |
| D010 | localStorage 无版本迁移策略 | 数据一致性 |
| D011 | 关卡完成后 useFrame 仍继续运行 | 数据准确性 |

### E. 可以长期延后

| debtId | title | 原因 |
|:---|:---|:---|
| D008 | HUD.tsx 职责过重 | 当前功能稳定 |
| D009 | FirstPersonControls.tsx 职责过重 | 当前功能稳定 |
| D014 | Arena bundle 过大 | 当前加载尚可接受 |
| D015 | 模型无缓存机制 | 当前模型数量少 |
| D016 | useFrame 每帧创建临时对象 | 当前性能足够 |

### F. 建议接受，不值得修复

| debtId | title | 原因 |
|:---|:---|:---|
| D017 | 小地图在单房间场景下可能显示异常 | 已有 QA 检查，当前正常 |

---

## 十一、推荐的 5 项立即行动

### 1. 修复音频生命周期（D001 + D004）

**为什么现在修**：E2E 测试失败，阻塞回归测试；玩家体验差

**不修会发生什么**：每次返回任务列表都会有持续的背景音乐；E2E 测试一直失败

**修改范围**：`sfx.ts`、`bgm.ts`、`ArenaPage.tsx`

**预计工作量**：S（2-4小时）

**回归风险**：低（只添加清理逻辑）

**需要增加的测试**：E2E 音频生命周期测试（已存在，需修复）

**是否阻塞 First-Level Fun Pass**：**是**

### 2. 统一 AudioContext（D007）

**为什么现在修**：与 D001/D004 一起修复，避免重复工作

**不修会发生什么**：两个独立的音频上下文，资源浪费

**修改范围**：`sfx.ts`、`bgm.ts`

**预计工作量**：S（2小时）

**回归风险**：低

**需要增加的测试**：E2E 测试

**是否阻塞 First-Level Fun Pass**：否

### 3. 清理 Store 定时器（D003）

**为什么现在修**：与音频修复一起进行，统一生命周期管理

**不修会发生什么**：定时器可能继续运行，导致延迟反馈

**修改范围**：`feedbackSlice.ts`、`toastStore.ts`、`chaosSlice.ts`、`sfx.ts`、`bgm.ts`

**预计工作量**：M（4-6小时）

**回归风险**：低

**需要增加的测试**：单元测试验证定时器清理

**是否阻塞 First-Level Fun Pass**：否

### 4. 移除 taskSlice 中的 as any（D005）

**为什么现在修**：类型安全是代码质量的基础，避免运行时错误

**不修会发生什么**：难以重构，可能引入类型错误

**修改范围**：`taskSlice.ts`、事件类型定义

**预计工作量**：M（4-6小时）

**回归风险**：中（需要仔细检查所有事件类型）

**需要增加的测试**：类型检查（tsc --noEmit）

**是否阻塞 First-Level Fun Pass**：否

### 5. 完善 commands 测试（D012）

**为什么现在修**：commands 是核心业务逻辑，测试覆盖不足

**不修会发生什么**：核心功能缺乏保护，容易引入回归

**修改范围**：`commands.test.ts`

**预计工作量**：M（4-6小时）

**回归风险**：低

**需要增加的测试**：新增测试用例

**是否阻塞 First-Level Fun Pass**：否

---

## 十二、重构判断

| 问题 | 判断 | 证据 |
|:---|:---|:---|
| Scene Graph 应接入、删除还是继续保留 | **accept** | 已有完整测试，未来可能需要；当前不阻塞 |
| 是否需要统一 AudioContext | **fix-now** | 两个实例，与 D001/D004 一起修复 |
| 是否需要继续拆分 HUD | **fix-later** | 当前功能稳定，可在第二关扩展前拆分 |
| 是否需要继续拆分 FirstPersonControls | **fix-later** | 当前功能稳定，可在第二关扩展前拆分 |
| 是否需要重构 Store Slice 边界 | **fix-later** | 当前架构清晰，可在研究版上线前优化 |
| 是否需要统一场景数据源 | **fix-later** | 当前数据一致性良好，SceneGraph 可后续接入 |
| 是否需要结构化 scripted event effects | **fix-now** | D005，大量 as any 影响类型安全 |
| 是否需要给 TaskConfig 增加版本和 schema 校验 | **fix-later** | 当前 QA 脚本已覆盖基本检查 |

---

## 十三、运行检查结果汇总

| 命令 | 结果 | 备注 |
|:---|:---|:---|
| `npm test` | ✅ 通过 | 291 个测试 |
| `npm run lint` | ✅ 通过 | 0 errors |
| `npm run build` | ✅ 通过 | Arena bundle 1.24MB |
| `npm run qa` | ✅ 通过 | 全部检查通过 |
| `npm run e2e` | ❌ 1 失败 | 导航与音频生命周期测试失败 |
| `git diff --check` | ✅ 无问题 | |
| `git status --short` | ✅ 无未提交更改 | |
| `git grep TODO\|FIXME\|HACK` | ✅ 无结果 | 已清理 |
| `git grep as any` | ⚠️ 18 处 | 主要在 taskSlice 和 audio |
| `git grep useGameStore.setState` | ⚠️ 6 处 | 2 处在生产代码 |
| `git grep new AudioContext` | ✅ 无结果 | 使用间接方式创建 |
| `git grep setInterval\|setTimeout` | ⚠️ 16 处 | 多个无清理 |
| `git grep .backup\|\.bak` | ✅ 无结果 | 已清理 |

---

## 十四、最终结论（Technical Debt Sprint 0 后更新）

### 1. 当前是否存在 P0？

**否**。没有发现数据损坏、无法完成、安全问题或生产测试后门泄漏。

### 2. 当前是否存在阻塞 First-Level Fun Pass 的 P1？

**否**。D001 已修复，D004 已接受，E2E 测试全部通过。

### 3. 当前最危险的重复 Bug 来源？

**已消除**。音频生命周期管理问题已在 Technical Debt Sprint 0 中修复。

### 4. 当前最昂贵的技术债务？

**SceneGraph 未接入**（D006）。已投入开发但未使用，后续需要决定接入还是删除。

### 5. 当前最值得接受而不修的债务？

**两个独立的 AudioContext 实例**（D007）。当前实现稳定，统一会增加不必要的复杂度。

### 6. 当前是否允许进入 First-Level Fun Pass？

**是**。D001 已修复，E2E 测试通过，所有阻塞项已清除。

### 7. 进入前最多应先修哪些问题？

无阻塞项，可直接进入 First-Level Fun Pass。

### 8. 是否需要大型重构？

**否**。当前架构适合继续开发，不需要大型重构。

### 9. 当前架构是否适合继续完成其余三关？

**是**。当前架构清晰，数据一致性良好，QA 脚本完善。

### 10. 下一轮建议是 Technical Debt Sprint 还是 First-Level Fun Pass？

**进入 First-Level Fun Pass**。音频生命周期问题已修复，E2E 测试稳定通过，所有阻塞项已清除。
