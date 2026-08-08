# L3 FINAL DESIGN — UPDATE 过期位置记忆

> 状态：CURRENT / AUTHORITATIVE
>
> 对应实现：`src/data/tasks/laundry-sort.ts`
>
> 兼容说明：保留历史 task id，公开玩法已不再是衣物分类。

## 目标

把 L2 的稳定 RECALL 升级为 UPDATE：一条原本正确的麦片位置记忆在现实变化后失效，玩家必须发现冲突、重新观察并更新记忆，才能完成任务。

## 配置

- 任务：`task-laundry-sort` / 过期的早餐记忆
- 房间：`dining`
- 时限：240 秒
- 核心物品：`obj-cereal`
- 分心/收尾物品：`obj-breakfast-bowl`、`obj-breakfast-cup`、`obj-breakfast-spoon`
- 容器：下层橱柜、较高橱柜、早餐餐桌、厨房水槽

## 阶段

| 阶段 | 玩家行为 | 完成条件 |
|---|---|---|
| `stage-encode-cereal` | 打开下层柜，对麦片按 E | 麦片有未过期记忆 |
| `stage-set-table` | 碗、杯、勺摆到餐桌 | 三件餐具均在餐桌 |
| `stage-stale-memory` | 回旧位置核对 | 触发 `se-conflict-detected` |
| `stage-update-memory` | 重新观察，找到麦片并按 E | 麦片记忆恢复有效且 `memoryUpdateCount >= 1` |
| `stage-serve-cereal` | 麦片放到餐桌 | 麦片在早餐餐桌 |
| `stage-breakfast-cleanup` | 碗杯进水槽，勺子留桌上 | 收尾约束全部成立 |

## 环境变化

进入 stale 阶段后，`se-cereal-moved` 把麦片从 `cnt-cabinet-lower` 移到 `cnt-cabinet-upper`，同时把麦片记忆标为 outdated。

玩家回到旧柜附近且麦片已经移动时，`se-conflict-detected` 才成立。系统只说明旧位置为空，不直接说出新位置。

## 信息披露边界

- Briefing 可以说明麦片初始在下层橱柜。
- 移动发生后，HUD、小地图、目标文案和对话不得说出“较高橱柜”这一答案。
- 玩家必须通过观察找到新位置；找到后按 E 更新，而不是只拾取。
- 记忆变红是一条需要核验的信号，不等于自动失败。

## 目标反馈

- `g-encode-cereal-memory`
- `g-set-breakfast-table`
- `g-detect-stale-memory`
- `g-update-cereal-memory`
- `g-serve-cereal`
- `g-clean-breakfast-dishes`

所有目标按上述依赖顺序推进，并在完成时显示横幅和清单勾选。

## 验收

1. 没有麦片旧记忆时不能跳过 ENCODE。
2. 完成摆桌后麦片确实移动，旧记忆确实变红。
3. 未回旧位置核对时不能直接完成冲突阶段。
4. 未更新记忆时不能进入应用新记忆阶段。
5. 完成麦片上桌和碗杯清理后才通关。
