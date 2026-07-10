# 增强游戏机器人研究意味计划（参考 RoboMME，保持游戏性）

## 核心设计理念

**不改变核心玩法，只增强研究氛围和数据支撑**

当前游戏的核心循环是：探索→记忆→操作→应对事件→达成目标。这个循环本身就非常符合 RoboMME 所研究的「记忆增强机器人策略」。我们不需要变成复杂的 manipulation 任务，而是通过：

1. **Scene Graph 数据结构** - 在数据层面构建，作为记忆系统的底层支撑
2. **记忆类型可视化** - 通过 UI 展示四种记忆类型的状态
3. **研究风格包装** - 通过文案、数据报告增强学术氛围
4. **观察阶段** - 模拟机器人的视频初始观察

## RoboMME 概念映射

| RoboMME 概念 | 游戏实现方式 |
|-------------|-------------|
| 四种记忆类型 | 在 UI 中可视化，不改变玩法 |
| Scene Graph | 数据层面构建，支撑记忆系统 |
| 视频初始观察 | 5 秒观察阶段，不能操作但能移动 |
| 记忆诊断 | 结果页面详细分析报告 |
| 记忆表示 | 符号记忆（文字描述）+ 感知记忆（缩略图） |

## 修改方案

### 1. Scene Graph 数据结构（核心）

在 `types` 层构建 Scene Graph 结构，但不改变游戏玩法：
- 节点：物体、容器、房间
- 边：放置关系、包含关系、空间相邻关系
- 用于记忆系统的底层支撑和结果分析

### 2. 记忆类型可视化（UI 增强）

在 HUD 中添加「记忆诊断面板」：
- 显示当前任务涉及的记忆类型（时间/空间/物体/程序）
- 显示每种记忆类型的使用情况
- 记忆槽中显示记忆类型图标

### 3. 观察阶段（游戏流程增强）

在 `briefing` 之后、`playing` 之前添加 `observing` 阶段：
- 5 秒倒计时
- 玩家可以自由移动观察场景
- 不能操作物体（拾取/放置/打开容器）
- 结束时自动进入 playing 阶段

### 4. 研究风格包装

- 更新首页文案，强调「记忆增强机器人」主题
- 修改 HUD 视觉风格，添加科技感元素
- 结果页面添加详细的记忆分析报告
- 添加「记忆类型统计」数据卡片

## 文件修改清单

| 文件 | 修改内容 |
|------|----------|
| `src/types/sceneGraph.ts` | **新建** - Scene Graph 数据结构定义 |
| `src/types/task.ts` | 添加 observationPhase 配置 |
| `src/types/memory.ts` | 扩展记忆类型定义 |
| `src/store/useGameStore.ts` | 添加 observing 阶段状态和观察倒计时 |
| `src/components/arena3d/HUD.tsx` | 添加记忆诊断面板、记忆类型可视化 |
| `src/components/help/helpContent.ts` | 更新帮助文档，解释记忆类型概念 |
| `src/pages/HomePage.tsx` | 更新介绍文案，强调研究主题 |
| `src/pages/ResultPage.tsx` | 添加记忆类型分析报告 |

## 步骤

1. 创建 `src/types/sceneGraph.ts`，定义 Scene Graph 数据结构
2. 修改 `src/types/task.ts`，添加 observationPhase 配置
3. 修改 `src/types/memory.ts`，扩展记忆类型定义
4. 修改 `src/store/useGameStore.ts`，添加 observing 阶段和观察倒计时
5. 修改 `src/components/arena3d/HUD.tsx`，添加记忆诊断面板和记忆类型可视化
6. 更新 `src/components/help/helpContent.ts`，添加记忆类型解释
7. 更新 `src/pages/HomePage.tsx`，强调研究主题
8. 更新 `src/pages/ResultPage.tsx`，添加记忆分析报告
9. 运行 npm run build 验证构建通过
10. 运行 npx vitest run 验证测试通过

## 风险评估

- 低风险：Scene Graph 在数据层面构建，不影响游戏玩法
- 低风险：观察阶段只是增加一个倒计时，不改变核心玩法
- 需要注意：记忆类型可视化要清晰，避免信息过载
- 需要注意：观察阶段时长控制在 5 秒，避免打断游戏节奏

## 预期效果

- 游戏开始前有 5 秒观察期，模拟机器人学习过程
- HUD 显示记忆类型状态和诊断面板，增强研究氛围
- 结果页面有详细的记忆分析报告，展示玩家的记忆使用情况
- 整体视觉风格更具科技感和研究意味
- Scene Graph 为后续功能扩展提供数据基础

## 关键设计决策

1. **观察阶段时长**：5 秒，玩家可以自由移动观察但不能操作物体
2. **记忆类型颜色编码**：
   - 时间记忆：蓝色
   - 空间记忆：绿色
   - 物体记忆：紫色
   - 程序记忆：橙色
3. **Scene Graph 使用方式**：只用于数据支撑和结果分析，不直接展示给玩家
4. **记忆类型可视化**：在记忆槽中显示不同的图标表示记忆类型，在 HUD 中显示记忆诊断面板

## Scene Graph 设计

```typescript
interface SceneGraphNode {
  id: string
  type: 'object' | 'container' | 'room'
  name: string
  properties: Record<string, any>
}

interface SceneGraphEdge {
  source: string
  target: string
  relation: 'placed-in' | 'contains' | 'adjacent' | 'on-surface'
}

interface SceneGraph {
  nodes: SceneGraphNode[]
  edges: SceneGraphEdge[]
}
```

## 记忆类型增强

| 记忆类型 | 当前游戏中的体现 | 增强方式 |
|---------|-----------------|---------|
| 空间记忆 | 记住物体位置 | 在记忆槽中显示位置坐标 |
| 物体记忆 | 记住物体名称和类别 | 在记忆槽中显示物体类别 |
| 时间记忆 | 记住事件顺序 | 添加事件时间线显示 |
| 程序记忆 | 记住操作序列 | 添加操作历史记录 |

## 保持游戏性的关键

1. **不增加操作复杂度**：观察阶段只是不能操作，移动自由
2. **不改变核心玩法**：拾取/放置/记忆系统保持不变
3. **不增加任务难度**：记忆类型可视化是辅助信息，不是强制要求
4. **不增加学习成本**：记忆类型概念通过简单图标和颜色编码传达
