# 全局音效设置修复计划

## 问题分析

### 核心问题：游戏结束后声音无法关闭
- ResultPage 缺少音效开关按钮，玩家在结果页面无法控制音效
- 游戏结束时播放的 `level_complete` 音效未检查全局开关状态
- 全局音效状态需要在所有页面（首页、关卡选择、游戏内、结果页）都能控制

### 开发效率问题
当前代码库处于快速迭代阶段，基础问题反复出现是正常现象。需要：
1. 完善全局音效系统，避免同类问题再次出现
2. 建立统一的音效控制模式，所有页面复用相同逻辑

## 修改方案

### 1. ResultPage.tsx - 添加音效开关
在结果页面底部添加音效控制按钮，与首页和游戏内保持一致的 UI 风格。

### 2. useGameStore.ts - 音效开关检查
在 `setLevelCompleted()` 和其他播放音效的地方，添加全局开关检查。

### 3. TaskSelectPage.tsx - 添加音效开关
在关卡选择页面也添加音效控制按钮，确保全局可访问。

### 4. sfx.ts - 确保音效状态正确传递
确认 `isAudioEnabled()` 返回的值与 `useUiStore` 中的状态一致。

## 文件修改清单

| 文件 | 修改内容 |
|------|----------|
| `src/pages/ResultPage.tsx` | 添加音效开关按钮组件 |
| `src/pages/TaskSelectPage.tsx` | 添加音效开关按钮组件 |
| `src/store/useGameStore.ts` | 在 `setLevelCompleted()` 中添加音效开关检查 |
| `src/audio/sfx.ts` | 确认 `isAudioEnabled()` 逻辑正确 |

## 步骤

1. 修改 ResultPage.tsx，导入 useUiStore 和图标，添加音效开关按钮
2. 修改 TaskSelectPage.tsx，添加音效开关按钮
3. 修改 useGameStore.ts，在播放 level_complete 音效前检查 isAudioEnabled
4. 运行 npm run build 验证构建通过
5. 运行 npx vitest run 验证测试通过

## 风险评估

- 低风险：修改主要是添加 UI 组件和条件检查，不影响核心游戏逻辑
- 需要注意：确保音效开关状态在各页面间保持同步（已通过 zustand persist 实现）

## 预期效果

- 所有页面都有音效开关按钮
- 游戏结束后玩家可以在结果页面关闭音效
- 音效状态持久化到 localStorage，刷新后保持设置
