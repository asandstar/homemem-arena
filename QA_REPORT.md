# QA Report - Echo House: Memory Butler

> **历史快照**：本报告只记录 2026-07-09 当时的自动检查结果，不代表当前产品验收状态。当前标准见 [QA_SMOKE_CHECKLIST.md](QA_SMOKE_CHECKLIST.md) 和 [产品、游戏与研究设计基线](docs/product-research-game-design.md)。

**检查时间**: 2026/7/9 23:36:25

## 总览

| 项目 | 状态 |
|------|------|
| 整体 | ✅ **通过** |
| 构建 | ✅ 通过 |
| 资产检查 | ✅ 通过 |
| 房间检查 | ✅ 通过 |
| 任务检查 | ✅ 通过 |

## 问题统计

| 级别 | 数量 |
|------|------|
| Blocker | 0 |
| Critical | 0 |
| Major | 0 |
| Minor | 9 |

## 失败项列表

| 级别 | 模块 | 检查项 | 描述 |
|------|------|--------|------|
| ⚪ MINOR | assets | glb-exists | key GLB 文件缺失（使用 fallback）: /assets/models/props/key.glb |
| ⚪ MINOR | assets | glb-exists | umbrella GLB 文件缺失（使用 fallback）: /assets/models/props/umbrella.glb |
| ⚪ MINOR | assets | glb-exists | cup GLB 文件缺失（使用 fallback）: /assets/models/props/cup.glb |
| ⚪ MINOR | assets | glb-exists | bowl GLB 文件缺失（使用 fallback）: /assets/models/props/bowl.glb |
| ⚪ MINOR | assets | glb-exists | plate GLB 文件缺失（使用 fallback）: /assets/models/props/plate.glb |
| ⚪ MINOR | assets | glb-exists | cloth_white GLB 文件缺失（使用 fallback）: /assets/models/props/cloth_white.glb |
| ⚪ MINOR | assets | glb-exists | cloth_dark GLB 文件缺失（使用 fallback）: /assets/models/props/cloth_dark.glb |
| ⚪ MINOR | assets | glb-exists | towel GLB 文件缺失（使用 fallback）: /assets/models/props/towel.glb |
| ⚪ MINOR | assets | glb-exists | shoes GLB 文件缺失（使用 fallback）: /assets/models/decor/shoes.glb |

## 建议修复顺序

### ⚪ MINOR

1. **[assets] glb-exists**: key GLB 文件缺失（使用 fallback）: /assets/models/props/key.glb
2. **[assets] glb-exists**: umbrella GLB 文件缺失（使用 fallback）: /assets/models/props/umbrella.glb
3. **[assets] glb-exists**: cup GLB 文件缺失（使用 fallback）: /assets/models/props/cup.glb
4. **[assets] glb-exists**: bowl GLB 文件缺失（使用 fallback）: /assets/models/props/bowl.glb
5. **[assets] glb-exists**: plate GLB 文件缺失（使用 fallback）: /assets/models/props/plate.glb
6. **[assets] glb-exists**: cloth_white GLB 文件缺失（使用 fallback）: /assets/models/props/cloth_white.glb
7. **[assets] glb-exists**: cloth_dark GLB 文件缺失（使用 fallback）: /assets/models/props/cloth_dark.glb
8. **[assets] glb-exists**: towel GLB 文件缺失（使用 fallback）: /assets/models/props/towel.glb
9. **[assets] glb-exists**: shoes GLB 文件缺失（使用 fallback）: /assets/models/decor/shoes.glb

## 资产概览

- 模型总数: 29
- 有 GLB 模型: 20
- 使用 fallback: 9
- 目录: props / furniture / decor

## 房间概览

- 房间总数: 6
- 房间列表: 客厅、卧室、厨房、玄关、洗衣房、餐厅

## 任务概览

- 关卡总数: 4
  - **餐桌混乱** (`task-clean-table`): 5 个目标, 5 个物体, 5 个容器
  - **出门大作战** (`task-leave-home`): 3 个目标, 3 个物体, 4 个容器
  - **洗衣幽灵** (`task-laundry-sort`): 4 个目标, 8 个物体, 3 个容器
  - **早餐时间循环** (`task-breakfast`): 11 个目标, 5 个物体, 8 个容器

---

_本报告由 `npm run qa:report` 自动生成_
