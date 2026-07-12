# Bug 修复 + 场景检查 + 可玩性评估计划

## 概述

提交本地未推送的代码，修复场景中发现的 5 类问题，并给出可玩性评估报告。

## 一、提交代码（先做）

本地有 1 个未推送提交 `fd003c4`（三大提升点），需要推送到 GitHub。

**操作**：`git push origin main`（可能需要用户手动执行，因 AI 环境无 GitHub 凭据）

---

## 二、发现的问题与修复方案

### 问题 1：渲染家具与碰撞家具位置完全错位（严重）

**现状**：`Room3D.tsx` 中硬编码的家具渲染位置与 `decorFurniture.ts` 中的碰撞盒位置完全不同。

客厅对比：

| 家具 | Room3D 渲染位置 | decorFurniture 碰撞位置 | 差距 |
|---|---|---|---|
| sofa | (0, 0, -0.8) | (-2.0, 0, 2.0) | 约 4.5m |
| coffee_table | (0, 0, 0.6) | (-2.0, 0, 1.0) | 约 2.1m |
| tv_stand | (0, 0, 2.4) | (2.0, 0, -2.4) | 约 5.6m |

**影响**：玩家撞到看不见的家具，也能穿过看得见的家具，严重破坏体验。

**修复方案**：以 `Room3D.tsx` 的渲染位置为准，更新 `decorFurniture.ts` 中的碰撞盒坐标使其匹配。注意 decorFurniture 的 position 是**房间局部坐标**（不含房间中心），而 Room3D 的渲染位置使用 `center.x + offset` 模式。

需要更新的文件：[decorFurniture.ts](file:///Users/azq/asandstar/homemem-arena-web-demo/src/data/decorFurniture.ts)

逐房间对齐：
- **living**：sofa (0,-0.8) / coffee_table (0,0.6) / tv_stand (0,2.4) → 注意 Room3D 中枕头位置使用了绝对 x 坐标而非 center.x，也需修正
- **bedroom**：bed (0,-0.5) / nightstand-right (1.3,-1.3) / nightstand-left (-1.8,-1.3) / desk (1.4,0.8) / wardrobe (-2.2,0.8)
- **kitchen**：counter-left (-2.5,-2.2) / counter-right (2.5,-2.2) / counter-back (0,2.4) / trash (2.4,0.5)
- **entrance**：shoe-cabinet (-1.5,-0.3)
- **laundry**：washer-left (-0.5,-1.8) / washer-right (0.5,-1.8) / basket-red (-1.0,-0.3) / basket-blue (0,-0.3) / basket-green (1.0,-0.3) / towel-rack (2.6,0)
- **dining**：dining-table (0,0) / chair-1 (-1.0,-0.5) / chair-2 (1.0,-0.5) / chair-3 (-1.0,0.5) / chair-4 (1.0,0.5)

### 问题 2：餐厅餐桌双重渲染（严重）

**现状**：`Room3D.tsx` 第 376-380 行渲染了一个 `TableGeometry`（dining_table 模型），同时 `Scene3D.tsx` 第 210-222 行又渲染了 `Container3D`（其中 `FurnitureModel` 再渲染一次餐桌模型）。

**影响**：同一位置两个餐桌模型 z-fighting 闪烁。

**修复方案**：在 `Room3D.tsx` 的 `renderDining()` 中删除餐桌和椅子的硬编码渲染，只保留 `Container3D` 渲染的版本。同样检查客厅茶几是否也有此问题。

需要更新的文件：[Room3D.tsx](file:///Users/azq/asandstar/homemem-arena-web-demo/src/components/arena3d/Room3D.tsx)

### 问题 3：Container3D 的 dining-table 模型 ID 映射错误（中等）

**现状**：[Container3D.tsx](file:///Users/azq/asandstar/homemem-arena-web-demo/src/components/arena3d/Container3D.tsx) 第 60-61 行将 `dining-table` / `dining_table` 映射为 `coffee_table` 模型，但实际应该用 `dining_table` 模型。

**影响**：Container3D 渲染的餐桌外观和高度与实际不符（coffee_table 高 0.5 vs dining_table 高 0.9）。

**修复方案**：
```ts
'dining-table': 'dining_table',
'dining_table': 'dining_table',
```

### 问题 4：移动端小地图工具按钮溢出（中等）

**现状**：Minimap 有 5 个 `w-6 h-6`（24px）按钮 + 4 个 gap-1（4px）= 136px 总宽度，但移动端容器仅 100px（减去 padding 约 84px 可用）。

**修复方案**：移动端只显示 3 个按钮（放大、缩小、收起），隐藏重置和跟随按钮（或改为长按重置）。

需要更新的文件：[Minimap.tsx](file:///Users/azq/asandstar/homemem-arena-web-demo/src/components/arena3d/Minimap.tsx)

### 问题 5：客厅枕头使用绝对坐标而非 center.x（轻微）

**现状**：[Room3D.tsx](file:///Users/azq/asandstar/homemem-arena-web-demo/src/components/arena3d/Room3D.tsx) 第 106-118 行，三个枕头使用 `position={[-0.8, ...]}` 而非 `position={[center.x - 0.8, ...]}`。

**影响**：由于客厅中心恰好是 (0,0,0)，目前无影响。但若房间中心变更，枕头会留在原位。

**修复方案**：改为 `center.x - 0.8` / `center.x` / `center.x + 0.8`。

---

## 三、关卡起始点检查结果

| 关卡 | firstRoom | 世界坐标起始点 | spawnRotation | 朝向 | 评估 |
|---|---|---|---|---|---|
| task-leave-home | living | (0, 0, -1.5) | π | 朝北(+Z) | 正常，面向客厅内部 |
| task-clean-table | dining | (12, 0, -1.5) | π | 朝北(+Z) | 正常，面向餐桌 |
| task-laundry-sort | laundry | (18, 0, 0) | 0(默认) | 朝南(-Z) | **缺失 spawnPosition**，在房间中心，建议添加 |
| task-breakfast | kitchen | (6, 0, 0) | 0(默认) | 朝南(-Z) | **缺失 spawnPosition**，在厨房中心，建议添加 |

**修复**：为 laundry-sort 和 breakfast 添加 spawnPosition 和 spawnRotation。

---

## 四、场景图（Scene Graph）检查结果

**结论**：场景图系统 `engine/sceneGraph.ts` 功能完整，18 个查询 API 正常工作，包括 BFS 房间路径、最近实体查找等。节点和边类型设计合理。

**唯一小问题**：第 144 行 `y: roomSpec.center.y + container.position.y` 多加了 `roomSpec.center.y`（=0），目前无影响但写法不严谨。不在本次修复范围。

---

## 五、可玩性评估

### 游戏是否好玩？

**整体评价**：设计框架扎实，但当前存在影响体验的技术问题和玩法设计缺陷，尚处于"有潜力但未充分发挥"的状态。

### 影响好玩性的关键问题（按优先级排序）

#### 1. 碰撞与视觉错位（技术层，致命）
玩家撞到看不见的家具 + 穿过看得见的家具，直接破坏沉浸感和操作体验。这是当前最严重的问题。

#### 2. 假事件破坏信任（设计层，严重）
- `se-baskets-swapped`：声称交换篮子但实际未交换
- `se-milk-deduct-points` / `se-milk-deduct-more`：声称扣分但实际无效果
- `se-fridge-auto-close`：声称关门但实际未关
玩家看到"扣分！"但不扣分，会认为游戏有 bug，破坏信任。

#### 3. 对话内容严重缺失（叙事层，严重）
4 个关卡中只有 leave-home 有对话，其余 3 关完全无角色对话，沉浸感大打折扣。

#### 4. 难度曲线倒挂（平衡层，中等）
L1 (easy) 时长 75 秒最短，L2 (medium) 时长 180 秒最长。L1 对新手反而更紧张。

#### 5. 程序记忆约束太弱（机制层，中等）
L4 早餐即使顺序全错也能完成目标（只要最终 4 物体都在餐桌），`requiredSequence` 形同虚设。

#### 6. 记忆槽固定 3 个（平衡层，轻微）
L4 有 5 个物体 + 4 容器 + 顺序约束，3 槽位过于紧张。

#### 7. 拾取/放置距离不一致（操作层，轻微）
拾取距离 2.0m，放置距离 2.5m，可能让玩家"能拾但不能放"。

### 亮点
1. 多维度记忆系统（spatial/object/temporal/procedural）设计精巧
2. 混乱值驱动的动态难度形成正反馈压力
3. 多模态反馈完整（分数浮字、combo、错误闪光、实体抖动、音效、相机抖动）
4. 防卡关 flow hint 系统（20s/45s 两级提示）
5. 4 关按"清晨→深夜"叙事时间线串联，记忆类型递进

---

## 六、实施步骤

### Step 1：修复 decorFurniture.ts 碰撞位置对齐
逐房间更新碰撞盒坐标，使其与 Room3D.tsx 的渲染位置一致。

### Step 2：修复 Room3D.tsx 餐桌/椅子双重渲染
在 `renderDining()` 中删除被 Container3D 覆盖的家具渲染。

### Step 3：修复 Container3D.tsx 模型 ID 映射
将 `dining-table` 的映射从 `coffee_table` 改为 `dining_table`。

### Step 4：修复 Minimap.tsx 移动端按钮溢出
移动端隐藏重置和跟随按钮。

### Step 5：修复 Room3D.tsx 枕头绝对坐标
改为 `center.x ± offset`。

### Step 6：补充 laundry-sort 和 breakfast 的 spawnPosition
为后两关添加合理的起始位置和朝向。

### Step 7：修复假事件
- `se-baskets-swapped`：改为 `move-entity` 类型或删除该事件
- `se-milk-deduct-points` / `se-milk-deduct-more`：添加实际扣分逻辑或改为纯提示
- `se-fridge-auto-close`：添加实际关闭容器逻辑或改为纯提示

### Step 8：构建测试
`npm run build && npm test`

### Step 9：提交并推送
提交所有修复，推送到 GitHub。

---

## 七、假设与决策

1. **碰撞位置以渲染位置为准**：渲染位置是用户看到的，碰撞应跟随视觉，而非反过来。
2. **双重渲染以 Container3D 为准**：Container3D 带有交互逻辑（点击打开/关闭），Room3D 的装饰渲染应避让。
3. **假事件修复策略**：对于有明确文案承诺的事件（如"扣分"），添加实际效果；对于无明确承诺的（如"冰箱门关上"），修改文案为提示性质。
4. **spawnPosition 补充**：laundry-sort 起始点设为洗衣房前方偏南，breakfast 设为厨房靠近餐厅方向。
5. **不改动游戏核心数值**：难度曲线、记忆槽数量等平衡问题记录但不在本次修改，需要 playtest 数据支撑。
