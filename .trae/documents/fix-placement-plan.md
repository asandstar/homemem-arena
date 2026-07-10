# 物体悬空修复计划

## 问题分析

通过分析代码，发现物体悬空的根因是**容器定义与视觉渲染不一致**：

### 餐桌的矛盾
| 位置 | 定义 |
|------|------|
| `clean-table.ts` 容器 | position.y=0.35, size.y=0.7, surfaceHeight=0.72 |
| `Room3D.tsx` 渲染 | position.y=0.45, size.y=0.9 |

容器定义的桌子高度只有 0.7m，但视觉渲染的桌子高度是 0.9m。surfaceHeight 基于错误的容器定义计算，导致物体放在错误的高度。

### 模型高度注册表缺失
`MODEL_HEIGHTS` 中没有 `dining_table` 条目（只在 `CONTAINER_MODEL_HEIGHTS` 中有），而 `getContainerModelId` 把 dining-table 映射到 `coffee_table`（0.5m），进一步加剧了不一致。

### 椅子也悬空
Room3D.tsx 中椅子的 position.y=0.35，但 size.y=0.7，底部应该在 y=0（贴地），实际上 position.y=0.35 + 模型偏移 -0.35 = y=0，这部分是对的。但椅子的模型 ID 用的是 `cabinet`，高度不对。

## 修复方案

### 步骤 1：统一容器定义
修改 `clean-table.ts` 中的容器定义，使其与视觉渲染一致：
- `cnt-dining-table`: position.y=0.45, size.y=0.9, surfaceHeight=0.9（0.45 + 0.9/2 = 0.9）
- 其他容器也需要检查

### 步骤 2：修复模型高度注册表
在 `placement.ts` 的 `MODEL_HEIGHTS` 和 `CONTAINER_MODEL_HEIGHTS` 中添加正确的 `dining_table` 条目（0.9m）

### 步骤 3：修复 Room3D.tsx 中的家具
- 餐厅椅子改用正确的模型 ID 和高度
- 检查所有房间的家具位置和高度

### 步骤 4：验证放置逻辑
确保 `snapEntityToWorld` 和 `getFreeObjectInitialPosition` 使用正确的表面高度

## 修改文件

1. `src/game/placement.ts` - 修复 MODEL_HEIGHTS 和 CONTAINER_MODEL_HEIGHTS
2. `src/data/tasks/clean-table.ts` - 修复容器定义
3. `src/components/arena3d/Room3D.tsx` - 修复餐厅家具位置
4. `src/data/tasks/leave-home.ts` - 检查第一关容器定义
5. `src/data/tasks/breakfast.ts` - 检查第三关容器定义
6. `src/data/tasks/laundry-sort.ts` - 检查第四关容器定义

## 验证标准

- 第二关餐桌上的杯子、盘子、遥控器、垃圾不悬空
- 第一关钥匙、手机、雨伞、玄关托盘物体不悬空
- 家具脚贴地
- `npm run build` 通过