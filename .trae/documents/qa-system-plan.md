# Echo House: Memory Butler - QA 检查系统建设计划

**日期**: 2026-07-09  
**状态**: Plan Mode  
**目标**: 建立统一 QA gate，每次修改后自动检查构建、资源、房间、任务、音效和关键可用性

---

## 一、项目现状分析

### 已有基础设施
- **构建**: `tsc -b && vite build` 可用
- **Lint**: `oxlint` 可用
- **测试框架**: `vitest` 已安装（v4.1.10）
- **类型**: TypeScript ~6.0.2，ESM 模块
- **Vite**: v8.1.3（自带 `vite-node` 可运行 TS）

### 数据文件位置
- 模型注册: `src/components/arena3d/models/ModelRegistry.ts`
- 房间配置: `src/data/rooms.ts`（6 个房间）
- 任务配置: `src/data/tasks/*.ts`（4 个关卡）
- 音效系统: `src/audio/sfx.ts`（9 种音效）
- 静态资源: `public/assets/models/`（props/furniture/decor 三个目录）

### 技术选型
- **QA 脚本运行器**: 使用 `vite-node`（Vite 自带，无需新增大依赖）
- **替代方案**: 若 `vite-node` 不可用，则用 Node.js 原生 ESM + 动态 import 编译后的模块
- **Smoke test**: 暂不引入 Playwright，生成手动 checklist + 可扩展的 vitest 单元测试骨架

---

## 二、文件结构

```
scripts/
  qa-shared.ts          # 共享工具函数、类型、分级规则
  qa-assets.ts          # 资产检查
  qa-rooms.ts           # 房间和小地图检查
  qa-tasks.ts           # 任务配置检查（含音效检查）
  qa-report.ts          # 生成 QA_REPORT.md
  qa-audio.ts           # 音效专项检查（可选，合并进 qa-tasks 也可）
```

**新增命令**（package.json）:
```json
{
  "scripts": {
    "qa": "npm run qa:static && npm run qa:assets && npm run qa:rooms && npm run qa:tasks && npm run build",
    "qa:static": "tsc --noEmit -p tsconfig.app.json",
    "qa:assets": "vite-node scripts/qa-assets.ts",
    "qa:rooms": "vite-node scripts/qa-rooms.ts",
    "qa:tasks": "vite-node scripts/qa-tasks.ts",
    "qa:report": "vite-node scripts/qa-report.ts",
    "qa:all": "npm run qa && npm run qa:report"
  }
}
```

---

## 三、各模块详细设计

### 3.1 qa-shared.ts - 共享基础设施

**功能**:
- 定义 QA 结果类型: `QaResult { severity, category, message, file? }`
- 定义严重级别: `blocker | critical | major | minor | info`
- 辅助函数: `pass()`, `fail()`, `warn()`, `formatTable()`
- 汇总函数: `summarize(results)` → 统计各级别数量
- 退出码: 有 blocker/critical/major 时退出码非 0

**Bug 分级规则**:
| 级别 | 定义 | 示例 |
|------|------|------|
| Blocker | 无法进入游戏，白屏，构建失败，第一关无法开始或完成 | 构建错误、任务引用不存在的房间 |
| Critical | 核心玩法断裂 | WASD 反向、门不通、关键物体缺失 |
| Major | 体验严重受损 | HUD 重叠、音效失效、大面积白模 |
| Minor | 文案/细节问题 | 描述不清、动画不流畅 |

---

### 3.2 qa-assets.ts - 资产检查

**检查项**:

| # | 检查内容 | 级别 |
|---|----------|------|
| 1 | `public/assets/models/props` 目录存在 | blocker |
| 2 | `public/assets/models/furniture` 目录存在 | blocker |
| 3 | `public/assets/models/decor` 目录存在 | blocker |
| 4 | MODEL_REGISTRY 中每个模型的 path 格式正确（以 `/assets/models/` 开头） | critical |
| 5 | MODEL_REGISTRY 中每个模型都有 fallback 组件 | critical |
| 6 | 引用的 GLB 文件真实存在于 public/ 下 | major |
| 7 | 路径没有混用 `/models/` 和 `/assets/models/` | major |
| 8 | ASSET_MANIFEST.json 存在 | minor |
| 9 | ASSET_MANIFEST.json 中 status 与本地文件一致 | minor |

**输出**: 模型状态表
```
modelId      path                              exists  hasFallback  status
key          /assets/models/props/key.glb      ❌       ✅           warning
phone        /assets/models/props/phone.glb    ✅       ✅           ok
...
```

**失败条件**（退出码非 0）:
- assets 目录缺失
- 路径格式错误
- 某个模型既没有 GLB 也没有 fallback

---

### 3.3 qa-rooms.ts - 房间和小地图检查

**检查项**:

| # | 检查内容 | 级别 |
|---|----------|------|
| 1 | sharedRooms 中每个 room id 唯一 | blocker |
| 2 | 每个房间 size.x > 0 且 size.z > 0 | blocker |
| 3 | 房间之间不重叠（AABB 检测） | blocker |
| 4 | 每个 doorway 的 connectsTo 指向存在的房间 | blocker |
| 5 | 双向门检查：A→B 则 B 应该也有→A（警告） | minor |
| 6 | 所有 task.rooms 引用的 roomId 都存在 | blocker |
| 7 | 第一关（task-leave-home）包含 living、bedroom、entrance | critical |
| 8 | 第二关（breakfast/clean-table）包含 dining、kitchen | critical |
| 9 | 洗衣关包含 laundry，且 laundry 不与 living 重叠 | major |

**房间重叠检测算法**:
```typescript
// AABB overlap on X-Z plane
function roomsOverlap(a, b) {
  const ax1 = a.center.x - a.size.x/2, ax2 = a.center.x + a.size.x/2
  const az1 = a.center.z - a.size.z/2, az2 = a.center.z + a.size.z/2
  const bx1 = b.center.x - b.size.x/2, bx2 = b.center.x + b.size.x/2
  const bz1 = b.center.z - b.size.z/2, bz2 = b.center.z + b.size.z/2
  return ax1 < bx2 && ax2 > bx1 && az1 < bz2 && az2 > bz1
}
```

**输出**: 房间布局表 + 连接关系图

---

### 3.4 qa-tasks.ts - 任务配置 + 音效检查

**任务检查项**:

| # | 检查内容 | 级别 |
|---|----------|------|
| 1 | 每个 task id 唯一 | blocker |
| 2 | 每个 task 至少有 1 个 goal | blocker |
| 3 | 每个 task 的 timeLimit > 0（如果设置了） | critical |
| 4 | objects 的 id 唯一 | critical |
| 5 | containers 的 id 唯一 | critical |
| 6 | goals 中 predicate 引用的 configId 都存在于 objects | blocker |
| 7 | goals 中 predicate 引用的 placedIn 容器都存在 | blocker |
| 8 | scriptedEvents 的 targetId 都存在 | critical |
| 9 | hiddenInContainer 引用的容器都存在 | critical |
| 10 | 物体 category 在 MODEL_REGISTRY 中有对应 modelId | major |
| 11 | 第一关主目标只有 key、phone、umbrella（不含 power_bank 等） | minor |
| 12 | 第一关有 cat_event 类型的 scriptedEvent | critical |
| 13 | 第一关有 phone_ring 类型的 scriptedEvent | critical |
| 14 | 第一关存在 entrance_tray 目标容器 | critical |

**音效检查项**（合并到 qa-tasks 或单独 qa-audio）:

| # | 检查内容 | 级别 |
|---|----------|------|
| 1 | `src/audio/sfx.ts` 文件存在 | blocker |
| 2 | 9 种音效都已定义（pick、place_success、place_error、memory_save、memory_outdated、cat_event、phone_ring、level_complete、chaos_warning） | critical |
| 3 | 导出了 `playSfx`、`setAudioEnabled`、`isAudioEnabled`、`playChaosWarning` | major |
| 4 | chaos_warning 有限流逻辑（lastChaosWarningTime） | major |
| 5 | playSfx 在 isEnabled=false 时不播放（代码结构检查） | major |
| 6 | AudioContext 初始化在用户交互后（initAudio 函数存在，不是模块顶层立即调用） | critical |

---

### 3.5 qa-report.ts - QA 报告生成

**功能**:
- 读取各 QA 模块的输出（或直接调用各模块的检查函数）
- 生成 `QA_REPORT.md` 到项目根目录
- 内容包含:
  1. 检查时间戳
  2. Git 分支和 commit（`git rev-parse --abbrev-ref HEAD` + `git rev-parse --short HEAD`，失败则忽略）
  3. 构建状态（调用 `npm run build` 的结果）
  4. 各检查模块结果汇总表
  5. 失败项列表（按严重级别排序）
  6. 建议修复顺序（按 Blocker → Critical → Major → Minor）
  7. 统计: 各级别问题数量、通过/失败总数

**调用方式**:
```bash
npm run qa:report
```

---

### 3.6 浏览器 Smoke Test

**当前策略**: 不引入 Playwright 重型依赖，改为:
1. 生成 `QA_SMOKE_CHECKLIST.md` 手动测试清单
2. 预留 `tests/smoke.spec.ts` 骨架（使用 vitest + jsdom 做基础渲染测试，不做 3D 交互）
3. 后续如需 Playwright 再扩展

**手动 checklist 内容**:
- [ ] 首页加载无白屏
- [ ] 点击"开始游戏"进入任务选择
- [ ] 选择第一关进入游戏
- [ ] HUD 显示任务目标
- [ ] 记忆槽显示
- [ ] 混乱值显示
- [ ] 小地图显示
- [ ] 音效开关存在且可点击
- [ ] W 键向前移动
- [ ] S 键向后移动
- [ ] V 键切换视角不报错
- [ ] Console 无 error 级别日志
- [ ] 第一关可以完成（所有物品放托盘）

---

## 四、实施步骤

| 步骤 | 内容 | 预计文件 |
|------|------|----------|
| 1 | 创建 scripts/qa-shared.ts 共享基础库 | scripts/qa-shared.ts |
| 2 | 创建 scripts/qa-assets.ts 资产检查 | scripts/qa-assets.ts |
| 3 | 创建 scripts/qa-rooms.ts 房间检查 | scripts/qa-rooms.ts |
| 4 | 创建 scripts/qa-tasks.ts 任务+音效检查 | scripts/qa-tasks.ts |
| 5 | 创建 scripts/qa-report.ts 报告生成 | scripts/qa-report.ts |
| 6 | 更新 package.json 添加 qa 系列命令 | package.json |
| 7 | 创建 QA_SMOKE_CHECKLIST.md | QA_SMOKE_CHECKLIST.md |
| 8 | 运行 npm run qa 验证 | - |

---

## 五、风险与应对

| 风险 | 影响 | 应对 |
|------|------|------|
| vite-node 在当前 Vite 版本中不可用 | 高 | 备选方案：用 `npx tsx`（轻量），或改写成 .mjs 纯 JS 脚本 |
| 任务文件含函数（predicate/trigger），导入时执行副作用 | 中 | 用动态 import 并捕获异常；或仅做静态文本分析 |
| ASSET_MANIFEST.json 格式未知 | 低 | 做容错解析，格式不对就跳过 |
| Git 命令在某些环境不可用 | 低 | 报告中跳过 git 信息 |

---

## 六、验收标准

1. ✅ `npm run qa` 命令可执行
2. ✅ 至少包含 qa:static、qa:assets、qa:rooms、qa:tasks、build 五个阶段
3. ✅ `npm run qa:report` 生成 QA_REPORT.md
4. ✅ QA_REPORT.md 按 Blocker/Critical/Major/Minor 分级
5. ✅ 资产检查能正确识别缺失模型和 fallback
6. ✅ 房间检查能检测重叠和无效引用
7. ✅ 任务检查能检测断裂引用和关键配置缺失
8. ✅ 音效检查能验证 9 种音效定义
9. ✅ 有手动 smoke checklist
10. ✅ 整个系统不引入新的重型依赖（≤1 个新轻量依赖）
