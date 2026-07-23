# 方向 A：游戏体验深度优化实施计划

## 现状分析

现有系统已具备的动画/特效基础：

| 系统 | 状态 | 文件 |
|------|------|------|
| 物体抖动动画（混乱事件） | ✅ 已有 | [Object3D.tsx](../../src/components/arena3d/Object3D.tsx#L115-L132) |
| 物体悬停高亮（光环+文字） | ✅ 已有 | [Object3D.tsx](../../src/components/arena3d/Object3D.tsx#L185-L274) |
| 物体成功脉冲动画 | ✅ 已有 | [Object3D.tsx](../../src/components/arena3d/Object3D.tsx#L122-L131) |
| 物体移动动画（搬家） | ✅ 已有 | [useGameStore.ts](../../src/store/useGameStore.ts#L759-L819) |
| 混乱值全屏红闪 | ✅ 已有 | [ChaosEffect.tsx](../../src/components/arena3d/ChaosEffect.tsx) |
| 猫爪印/猫影/手机震动特效 | ✅ 已有 | feedback/ 目录 |
| 浮动文字提示 | ✅ 已有 | floatingTexts |
| 相机平滑移动 | ✅ 已有 | FirstPersonControls.tsx |

**已有基础很好，主要是增强和补充。**

---

## 任务清单（按优先级排序）

### 任务 1：拾取/放置反馈动画（P0）

**目标**：让物品拾取和放置有明显的动效反馈

**具体实现**：

1. **拾取动画**
   - 物品被拾取时：向上浮动 + 缩放缩小 + 淡出
   - 从地面位置平滑移动到玩家前方位置
   - 轻微旋转效果

2. **放置动画**
   - 物品放置时：从玩家前方位置下落到目标位置
   - 落地时有轻微弹跳（缩放回弹）
   - 落定后有光环扩散效果

3. **持有物品动画**
   - 持有物品时：轻微上下浮动 + 缓慢旋转
   - 让玩家感觉到"拿着东西"

**涉及文件**：
- `src/components/arena3d/Object3D.tsx` — 添加拾取/放置/持有动画状态
- `src/store/useGameStore.ts` — 触发动画事件（已有的 moveAnimations 可以扩展）

**复用现有能力**：
- 已有的 `successPulse` 动画逻辑可以参考
- 已有的 `moveAnimations` 系统可以扩展为通用动画队列

---

### 任务 2：交互高亮提示增强（P0）

**目标**：玩家靠近可交互物体时，有更明显的提示

**具体实现**：

1. **近距离自动高亮**
   - 当前只有鼠标悬停才高亮，改为：距离 < 2m 时自动有微弱发光
   - 距离越近，光效越强（渐变）
   - 鼠标悬停时再叠加更强的高亮

2. **容器交互提示**
   - 靠近可交互的容器（柜子、冰箱、抽屉等）时，有呼吸光效
   - 打开/关闭时有缩放动画

3. **轮廓高亮（可选进阶）**
   - 使用 OutlinePass 或后处理实现物体轮廓发光
   - （如果不想加后处理依赖，用当前的光环+点光方案也可以）

**涉及文件**：
- `src/components/arena3d/Object3D.tsx` — 增强近距高亮
- `src/components/arena3d/Container3D.tsx` — 添加容器高亮和开合动画

**复用现有能力**：
- 已有的 hover 光环和点光效果
- 已有的 distance 计算

---

### 任务 3：混乱值视觉反馈增强（P1）

**目标**：混乱值升高时，游戏氛围逐步变化，给玩家紧迫感

**具体实现**：

1. **分级视觉效果**
   - 混乱值 < 30%：正常状态
   - 混乱值 30-60%：环境光略微偏红，轻微屏幕抖动
   - 混乱值 60-85%：屏幕边缘泛红（Vignette 效果），物体轻微闪烁
   - 混乱值 > 85%：强烈红闪，频繁屏幕抖动，音效变急促

2. **屏幕边缘泛红（Vignette）**
   - 用 2D Canvas 或后处理实现屏幕边缘红色渐变
   - 混乱值越高，红色越深、范围越大

3. **屏幕抖动**
   - 高混乱值时相机轻微随机抖动
   - 混乱事件触发时强烈抖动一下

**涉及文件**：
- `src/components/arena3d/ChaosEffect.tsx` — 增强混乱特效，添加分级逻辑
- `src/components/arena3d/FirstPersonControls.tsx` — 添加相机抖动
- 或新增 `src/components/arena3d/ScreenVignette.tsx`（2D UI 层实现）

**方案选择**：
- 推荐用 2D UI 层（div + CSS radial-gradient）实现 vignette，简单高效，不依赖后处理库
- 相机抖动直接在 FirstPersonControls 的 useFrame 中添加

---

### 任务 4：记忆系统视觉化（P1）

**目标**：保存记忆和遗忘记忆时有明显的视觉特效

**具体实现**：

1. **保存记忆特效**
   - 从物体位置飞出一个"记忆光球"飞向屏幕上方（记忆槽位置）
   - 光球有拖尾效果
   - 记忆槽高亮脉冲一下

2. **遗忘记忆特效**
   - 记忆槽中的图标淡出 + 碎裂效果
   - 或简单的缩小消失 + 光晕消散

3. **记忆过期提示**
   - 快过期的记忆槽会闪烁警告
   - 过期时变红淡出

**涉及文件**：
- `src/components/arena3d/HUD.tsx` — 记忆槽动画
- 新增 `src/components/arena3d/feedback/MemoryOrbEffect.tsx` — 记忆光球特效
- `src/store/useGameStore.ts` — 触发记忆特效事件

**复用现有能力**：
- 已有的 `savingMemorySlotIndex` 和 `flashingSlotIndex` 状态
- 已有的 `triggerMemorySaveEffect` 函数

---

### 任务 5：关卡开场/结束过渡动画（P2）

**目标**：任务开始和结束时有流畅的过渡，而不是突兀的切换

**具体实现**：

1. **任务开场**
   - 黑屏淡入 → 显示任务标题和简介 → 相机从天空俯冲到玩家位置 → 开始游戏
   - 或简单的：3 秒倒计时（3-2-1-Go!）

2. **任务结束**
   - 时间停止效果（慢动作）
   - 屏幕渐白/渐黑
   - 显示结算界面

3. **房间切换过渡**
   - 穿过门洞时有短暂的黑场过渡（0.3s）
   - 或门打开的动画效果

**涉及文件**：
- `src/pages/ArenaPage.tsx` — 开场/结束状态管理
- 新增 `src/components/arena3d/TransitionOverlay.tsx` — 过渡动画组件
- `src/components/arena3d/FirstPersonControls.tsx` — 相机开场动画

**复用现有能力**：
- 已有的任务状态管理
- 已有的相机控制

---

## 实施顺序

**第一阶段（核心体验）**：任务 1 + 任务 2
- 拾取/放置动画 + 交互高亮
- 直接影响核心玩法手感

**第二阶段（氛围增强）**：任务 3 + 任务 4
- 混乱值反馈 + 记忆系统视觉化
- 提升游戏氛围和沉浸感

**第三阶段（ polish）**：任务 5
- 开场/结束过渡
- 锦上添花，提升完整度

---

## 涉及文件总览

### 修改文件
1. `src/components/arena3d/Object3D.tsx` — 拾取/放置/持有动画、近距高亮
2. `src/components/arena3d/Container3D.tsx` — 容器高亮、开合动画
3. `src/components/arena3d/ChaosEffect.tsx` — 分级混乱效果、屏幕抖动
4. `src/components/arena3d/HUD.tsx` — 记忆槽动画
5. `src/components/arena3d/FirstPersonControls.tsx` — 相机抖动
6. `src/store/useGameStore.ts` — 新增动画事件类型

### 新增文件
1. `src/components/arena3d/feedback/MemoryOrbEffect.tsx` — 记忆光球特效
2. `src/components/arena3d/TransitionOverlay.tsx` — 场景过渡动画

---

## 技术方案要点

1. **不引入新依赖**：所有效果用现有 Three.js + CSS 实现，不加后处理库
2. **性能优先**：特效控制在合理数量，粒子效果用简单的 mesh 动画实现
3. **可配置**：特效强度可以通过状态控制，方便后续调整
4. **复用现有动画系统**：扩展已有的 moveAnimations 框架，不重新造轮子

---

## 风险与注意事项

1. **性能风险**：同时播放多个特效可能影响帧率，需要控制同时活跃的特效数量
2. **视觉一致性**：新特效的风格要和现有特效统一（颜色、动画曲线等）
3. **不干扰玩法**：特效不能太抢眼，不能影响玩家判断物体位置
4. **移动端兼容**：如果以后要做移动端，粒子和后处理效果需要降级
