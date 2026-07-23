# 创建游戏逻辑模块文件 - 实施计划

## 任务概述
在 `../../src` 目录下创建四个游戏逻辑模块文件。

## 待创建文件

### 1. src/data/levelBalance.ts
- **路径**: `../../src/data/levelBalance.ts`
- **内容**: 关卡数值配置接口和默认配置
- **导出**: `LevelBalanceConfig` 接口、`DEFAULT_LEVEL_BALANCE` 常量

### 2. src/game/scoring.ts
- **路径**: `../../src/game/scoring.ts`
- **内容**: 得分计算工具函数
- **依赖**: `../data/levelBalance`
- **导出**: `calcComboMultiplier`、`calcCorrectPlaceScore`、`calcPickScore`、`calcTimeBonus`、`getRank`、`getTitle`

### 3. src/game/chaos.ts
- **路径**: `../../src/game/chaos.ts`
- **内容**: 混乱值计算工具函数
- **依赖**: `../data/levelBalance`
- **导出**: `calcChaosGrowth`、`isGlitchActive`、`isEventBoosted`、`getChaosLevel`、`getChaosColor`

### 4. src/game/memorySlots.ts
- **路径**: `../../src/game/memorySlots.ts`
- **内容**: 记忆槽工具函数和类型
- **导出**: `MemorySlotData` 接口、`MemorySlot` 类型、`findSlotByEntityConfigId`、`findEmptySlot`、`findUnlockedSlot`、`markOutdatedByEntityConfigId`、`updateMemoryConfidence`、`calcMemoryEffectiveRate`

## 注意事项
1. 所有文件使用 TypeScript，类型正确
2. 文件路径完全按照指定
3. 不添加注释
4. 导出所有函数和类型

## 目录检查
- `src/data/` 目录已存在
- `src/game/` 目录需要创建
