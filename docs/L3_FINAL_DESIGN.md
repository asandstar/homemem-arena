# L3 FINAL DESIGN — UPDATE 过期位置记忆

> 状态：CURRENT / AUTHORITATIVE
>
> 对应实现：`src/data/tasks/laundry-sort.ts`
>
> 兼容说明：保留历史 task id 和两个 legacy container id，公开玩法已不再是衣物分类，也不要求打开柜门。

## 目标与设计边界

把 L2 的稳定 RECALL 升级为 UPDATE：一条原本正确的麦片位置记忆在现实变化后失效，玩家必须核对旧位置、重新观察并更新记忆，才能完成任务。

关卡只使用当前模型与程序可靠支持的能力：

- 可见物品的 `E` 位置记忆；
- 可见物品的 `F` 拾取和桌面放置；
- 静态家具作为承载台面；
- 麦片在两个可见台面之间的脚本移动。

禁止把静态 GLB 当作可开合柜门使用。不得把通关物品藏入没有明确开启动画的家具。

## 配置

- 任务：`task-laundry-sort` / 过期的早餐记忆
- 房间：`dining`
- 时限：600 秒
- 核心物品：`obj-cereal`
- 分心物品：`obj-breakfast-bowl`、`obj-breakfast-cup`
- 已摆好物品：`obj-breakfast-spoon`
- 家具：早餐备餐台、开放置物架、早餐餐桌
- 兼容 ID：备餐台仍使用 `cnt-cabinet-lower`；开放架仍使用 `cnt-cabinet-upper`

## 五阶段流程

| 阶段 | 玩家行为 | 完成条件 |
|---|---|---|
| `stage-encode-cereal` | 观察备餐台上可见的麦片并按 E | 麦片有未过期记忆 |
| `stage-set-table` | 把可见的碗和杯摆上餐桌；勺子已摆好 | 碗杯在餐桌，勺子仍在餐桌 |
| `stage-stale-memory` | 回到原备餐台核对旧位置 | 触发 `se-conflict-detected` |
| `stage-update-memory` | 找到开放置物架上可见的麦片并按 E | 记忆恢复有效且 `memoryUpdateCount >= 1` |
| `stage-serve-cereal` | 拾取麦片并放上餐桌 | 麦片在早餐餐桌，立即通关 |

## 环境变化

进入 stale 阶段后，`se-cereal-moved` 把麦片从备餐台移动到开放置物架，同时把旧记忆标为 outdated。移动后的麦片必须保持可见，不能变成 `hidden`。

玩家回到旧备餐台附近且麦片已经完成移动时，`se-conflict-detected` 才成立。确认冲突前不显示新位置；确认后当前目标会明确引导玩家观察开放置物架，避免把 UPDATE 关异化成困难的隐藏物品搜索。

## 防绕过规则

- 没有麦片旧记忆时不能离开 ENCODE。
- 麦片在 `g-update-cereal-memory` 完成前不能用 F 拾取。
- 碗和杯在 `g-encode-cereal-memory` 完成前不能拾取。
- 未回旧位置核对时不能直接完成冲突阶段。
- 未再次按 E 更新麦片记忆时不能进入最终拾取阶段。

## 目标反馈

- `g-encode-cereal-memory`
- `g-set-breakfast-table`
- `g-detect-stale-memory`
- `g-update-cereal-memory`
- `g-serve-cereal`

所有目标按上述依赖顺序推进，并在完成时显示横幅和清单勾选。取消与核心 UPDATE 无关的餐后清理目标，以缩短评委体验时间。

## 验收

1. 开场麦片、碗、杯和勺全部可见，且没有“打开柜子”文案或操作。
2. 没有麦片旧记忆时不能跳过 ENCODE，也不能提前拿走麦片。
3. 完成摆桌后麦片确实移动到开放置物架，且旧记忆变红。
4. 未回原备餐台核对时不能直接进入 UPDATE。
5. 新位置的麦片始终可见；再次按 E 后才能拾取。
6. 麦片放上餐桌后立即完成第三关。
