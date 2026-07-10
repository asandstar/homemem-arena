# HomeMem Arena 实现计划

## 项目分析总结

### 项目概述
HomeMem Arena 是一个面向家务机器人长程任务与记忆能力研究的浏览器端 Demo，基于 **React 18 + TypeScript + Vite + Tailwind CSS 4 + Zustand** 构建。

### 已完成功能

| 模块 | 状态 | 说明 |
|------|------|------|
| 页面路由 | ✅ 完成 | 6个页面：首页、任务选择、游戏页、记忆测试、结果分析、研究数据 |
| MVP 任务 | ✅ 完成 | 收拾餐桌、准备出门、洗衣分类 |
| 游戏逻辑 | ✅ 完成 | 机器人移动、拾取/放置、容器开合 |
| 数据采集 | ✅ 完成 | 事件流、Session、AI Mock 函数 |
| 状态管理 | ✅ 完成 | Zustand store |

### 待实现内容（基于 design-polish-spec.md）

**P0（必须先做）**：
1. 统一 Design Token 到 Tailwind 配置
2. 重构基础组件（Button、Card、Badge、Toast）
3. Arena 页面布局优化
4. 事件日志样式与类型标签颜色
5. 结果页指标卡与 AI 建议展示

**P1（重要）**：
6. 首页 Hero 与记忆类型卡片优化
7. 任务选择页卡片视觉升级
8. 记忆测试页进度条与反馈
9. 研究数据页 JSON 语法高亮
10. 全局 Toast 反馈系统

**P2（加分项）**：
11. 交互动效
12. 响应式细节打磨

---

## 实现步骤

### 阶段一：基础层重构（P0）

#### 任务 1.1：统一 Design Token
**文件**：`src/index.css`

**修改内容**：
- 扩展 Tailwind theme 配置，添加完整的设计系统颜色变量
- 统一字体配置
- 添加间距与圆角变量

**参考规格**：设计规格第 2 节

---

#### 任务 1.2：封装基础组件
**文件**：`src/components/ui/`（新建目录）

**新建文件**：
- `Button.tsx`：Primary/Secondary/Ghost/Danger 类型按钮
- `Card.tsx`：卡片容器组件
- `Badge.tsx`：标签组件（用于记忆类型、事件类型）
- `Toast.tsx`：全局反馈组件

**参考规格**：设计规格第 3 节

---

### 阶段二：Arena 页面优化（P0）

#### 任务 2.1：Arena 布局优化
**文件**：`src/pages/ArenaPage.tsx`

**修改内容**：
- 调整为三列布局：左侧 FloorPlan + 事件日志，右侧记忆面板 + 控制区
- 优化移动端响应式布局

**参考规格**：设计规格第 4.3 节

---

#### 任务 2.2：FloorPlan 视觉优化
**文件**：`src/components/arena/FloorPlan.tsx`

**修改内容**：
- 当前房间：实线边框 3px，主色调
- 相邻房间：虚线边框，半透明填充
- 非相邻房间：更淡，不可点击
- 物体按类别着色
- 目标区暖黄色
- 记忆依赖效果：离开房间后物体隐藏

**参考规格**：设计规格第 4.3.1 节

---

#### 任务 2.3：事件日志样式升级
**文件**：`src/components/arena/EventLog.tsx`

**修改内容**：
- 添加事件类型标签（observation/action/memory_update/task_progress/scripted_event）
- 每种类型使用不同颜色
- 日志自动滚动到底部
- 显示事件总数

**参考规格**：设计规格第 4.3.4 节

---

### 阶段三：结果页优化（P0）

#### 任务 3.1：指标卡组件
**文件**：`src/components/result/MetricCards.tsx`

**修改内容**：
- 4张横向卡片：总耗时、操作步数、重复搜索次数、记忆测试准确率
- 添加状态头（完成/失败大图标）

**参考规格**：设计规格第 4.5 节

---

#### 任务 3.2：失败原因与策略建议
**文件**：`src/components/result/FailureBreakdown.tsx`、`src/components/result/PolicySuggestions.tsx`

**修改内容**：
- 失败原因分类标签（错放容器/遗漏物体/忘记位置/顺序错误/超时）
- AI 策略建议卡片列表

**参考规格**：设计规格第 4.5 节

---

### 阶段四：首页与任务选择页优化（P1）

#### 任务 4.1：首页 Hero 优化
**文件**：`src/pages/HomePage.tsx`

**修改内容**：
- 全宽浅色渐变背景
- 左侧大标题 + 副标题
- 记忆类型卡片优化

**参考规格**：设计规格第 4.1 节

---

#### 任务 4.2：任务选择页卡片升级
**文件**：`src/components/tasks/TaskCard.tsx`

**修改内容**：
- 任务图标、名称、难度标签、记忆类型标签
- 记忆类型颜色区分：temporal(紫)/spatial(蓝)/object(青)/procedural(绿)
- 悬停效果：上移 + 阴影加深

**参考规格**：设计规格第 4.2 节

---

### 阶段五：记忆测试与研究数据页（P1）

#### 任务 5.1：记忆测试页进度条
**文件**：`src/components/probe/ProbeSequence.tsx`、`src/components/probe/ProbeCard.tsx`

**修改内容**：
- 进度条显示"第 N / M 题"
- 提交后即时反馈对错
- "下一题"/"查看结果"导航按钮

**参考规格**：设计规格第 4.4 节

---

#### 任务 5.2：JSON 语法高亮
**文件**：`src/components/data/JsonPreview.tsx`

**修改内容**：
- 深色代码块背景
- 语法高亮（关键字、字符串、数字、布尔值）
- 最大高度 500px，可滚动

**参考规格**：设计规格第 4.6 节

---

#### 任务 5.3：全局 Toast 系统
**文件**：`src/components/ui/Toast.tsx`、`src/store/useToastStore.ts`（新建）

**修改内容**：
- 操作成功：绿色 toast，显示 2s
- 操作失败：红色 toast，显示 3s，带原因
- 位置：顶部居中，z-index: 50

**参考规格**：设计规格第 3.4 节

---

### 阶段六：交互动效（P2）

#### 任务 6.1：核心动效实现
**文件**：`src/components/arena/FloorPlan.tsx`、`src/index.css`

**修改内容**：
- 机器人移动：平滑过渡，300ms
- 物体 pick：缩小飞向机器人
- 物体 place：放大落入容器，250ms
- 目标完成：绿色描边动画
- 事件新增：从底部滑入

**参考规格**：设计规格第 5 节

---

## 文件变更清单

| 文件路径 | 操作 | 说明 |
|----------|------|------|
| `src/index.css` | 修改 | 统一 Design Token |
| `src/components/ui/Button.tsx` | 新建 | 按钮组件 |
| `src/components/ui/Card.tsx` | 新建 | 卡片组件 |
| `src/components/ui/Badge.tsx` | 新建 | 标签组件 |
| `src/components/ui/Toast.tsx` | 新建 | Toast 组件 |
| `src/store/useToastStore.ts` | 新建 | Toast 状态管理 |
| `src/pages/ArenaPage.tsx` | 修改 | Arena 布局优化 |
| `src/components/arena/FloorPlan.tsx` | 修改 | 视觉优化 + 动效 |
| `src/components/arena/EventLog.tsx` | 修改 | 样式升级 |
| `src/components/result/MetricCards.tsx` | 修改 | 指标卡展示 |
| `src/components/result/FailureBreakdown.tsx` | 修改 | 失败原因标签 |
| `src/components/result/PolicySuggestions.tsx` | 修改 | 策略建议卡片 |
| `src/pages/HomePage.tsx` | 修改 | Hero 优化 |
| `src/components/tasks/TaskCard.tsx` | 修改 | 卡片视觉升级 |
| `src/components/probe/ProbeSequence.tsx` | 修改 | 进度条 |
| `src/components/probe/ProbeCard.tsx` | 修改 | 反馈效果 |
| `src/components/data/JsonPreview.tsx` | 修改 | JSON 高亮 |

---

## 依赖与风险

### 新增依赖
- 无需新增外部依赖，使用 Tailwind CSS 4 内置动画

### 风险点
1. **记忆依赖效果**：离开房间后物体隐藏的逻辑需要仔细处理，确保不影响游戏功能
2. **动效性能**：SVG 动画可能影响性能，需控制动画复杂度
3. **状态同步**：Toast 状态需与游戏操作正确同步

### 验证方式
- `npm run build`：确保构建成功
- `npm run lint`：确保代码质量
- 端到端流程测试：首页 → 任务选择 → 游戏 → 记忆测试 → 结果 → 数据

---

## 执行顺序建议

1. **阶段一**（基础层）：先建立设计系统和基础组件，为后续优化奠定基础
2. **阶段二**（Arena）：核心交互页，优先级最高
3. **阶段三**（结果页）：展示研究成果的关键页面
4. **阶段四**（首页/任务选择）：入口页面，影响第一印象
5. **阶段五**（记忆测试/数据页）：完善用户体验
6. **阶段六**（动效）：最后优化视觉体验