# L2 FINAL DESIGN — RECALL 稳定空间记忆

> 状态：CURRENT / AUTHORITATIVE
>
> 对应实现：`src/data/tasks/leave-home.ts`

## 目标

让玩家在稳定环境中建立并使用三条 object-location 记忆。L2 教的是“有效记忆值得相信”，真实位移留到 L3。

## 配置

- 任务：`task-leave-home` / 钥匙猫的稳定记忆考验
- 房间：`living`、`bedroom`、`entrance`
- 时限：150 秒
- 目标容器：`cnt-coffee-table`

| 物品 | 初始房间 | 初始位置 | 最终位置 |
|---|---|---|---|
| `obj-books` 书 | living | 沙发附近 | 客厅茶几 |
| `obj-mug` 马克杯 | bedroom | 床头柜附近 | 客厅茶几 |
| `obj-radio` 收音机 | entrance | 玄关柜附近 | 客厅茶几 |

当前关卡没有玩具熊，也不进入餐厨。

## 阶段与硬门槛

| 阶段 | 玩家目标 | 完成条件 |
|---|---|---|
| `stage-encode-stable-map` | 分别靠近三件物品按 E | 三个 configId 都有未过期记忆 |
| `stage-recall-stable-map` | 根据记忆取回三件物品 | 三件物品都在客厅茶几 |

编码完成前拾取任务物品必须失败。玩家不能通过“看见就立刻搬走”绕过三条记忆。

## 干扰规则

`se-cat-second-prank` 只能播放声音、脚印和提示：

- 不移动任何物体；
- 不调用 `markMemoryOutdated`；
- 明确提示记忆未变红，仍然可信。

## 目标反馈

- `g-encode-stable-map`
- `g-books-table`
- `g-mug-table`
- `g-radio-table`

后三个归位目标依赖编码里程碑。完成文案必须指向下一关的真实升级：现实会变化，正确的旧记忆也可能过期。

## 文案边界

- 可以说明物品分别位于客厅、卧室、玄关，但不在持续 HUD 中泄露精确坐标。
- 不出现“4 件物品”“玩具熊”“90 秒”“猫把物品再次藏起”等旧方案内容。
- 失败提示应鼓励先建立三条记忆，再规划取回路线。

## 验收

1. 少于三条记忆时不能开始搬运。
2. 三条记忆建立后进入 RECALL 阶段。
3. 猫干扰后物品位置和记忆有效性均不变。
4. 三件物品全部回到茶几后通关。
