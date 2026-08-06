# 五关全 Kenney 化重新设计

> 状态：DRAFT · 待用户 review 后进入实现
> 范围：L1-L5 关卡内容重设计 + Kenney 资产映射 + 记忆机制对齐
> 不动：Room3D 渲染层、Model Registry 架构、3D 碰撞/LOS（本轮仅配 task 数据 + modelAssetId）

## 一、五条核心原则（硬约束）

1. **记忆因果必要**：仅看当前画面应存在多个合理答案，玩家必须结合过去观察才能正确行动；按 E 保存记忆不能是形式化步骤。
2. **完整循环**：编码 → 保持间隔 → 遮挡/扰动 → 提取行动 → Probe 复盘；保存与使用记忆之间必须插入其他任务。
3. **单一主记忆能力**：每关只突出一种主要记忆能力，避免位置+类别+顺序+次数同时叠加，否则测到的是操作负担而非记忆。
4. **扰动制造冲突**：旧记忆与现实冲突，玩家经历怀疑 → 重新观察 → 更新记忆。
5. **错误可恢复**：依赖旧记忆失败后，可通过环境线索或再次观察恢复，不软锁。

## 二、全局节奏

`形成判断 → 暂时离开 → 环境变化 → 发现冲突 → 重新侦察 → 恢复任务 → 结果复盘`

科研机制本身是游戏的戏剧性来源。

## 三、Kenney 资产映射

### 可用小物体（可拾取）
| Kit | 模型 | 用途 |
|---|---|---|
| food | mug, plate, utensil-fork, utensil-spoon, bowl, cup, carton, bread, egg, apple, banana | 餐具/食物 |
| furniture | books, pillow, pillowBlue, pillowLong, pillowBlueLong | 书本/枕头/织物代理 |
| furniture | **laptop**, bear, radio | 电子产品/玩具 |
| furniture | cardboardBoxClosed, cardboardBoxOpen | 收纳箱 |

### 容器/家具（已注册 + 可补充）
| 已注册 | 可补充注册 |
|---|---|
| table, tableCoffee, cabinetBedDrawer, cabinetTelevision, televisionModern, bookcaseOpen, loungeSofa, bedDouble, trashcan, washer, dryer, kitchenCabinetDrawer, kitchenSink, pillow, books | **desk**, **lampRoundTable**, **coatRackStanding**, **kitchenFridge**, **kitchenStove**, **bathtub**, **bathroomCabinet**, **bathroomSink**, **toilet**, **sideTableDrawers**, **pillowBlue**, **pillowLong**, **laptop**, **bear**, **carton**, **bread**, **egg**, **bowl** |

### 无 Kenney 模型的物品（需决策）
| 物品 | 现状 | 候选方案 |
|---|---|---|
| 钥匙 | 程序化金块 | 无合适代理，保留程序化 |
| 手机 | 程序化深色扁块 | `laptop` 可代理（但语义偏大） |
| 雨伞 | 程序化蓝杆 | `coatRackStanding` 是架不是伞 |
| 餐巾纸 | 程序化黄块 | `plate` 可代理 |

## 四、逐关设计

---

### L1 · 餐桌整理（教学关）

**定位**：记忆编码与基础交互教学。不承担主要研究结论。
**主记忆能力**：Symbolic Memory（符号记忆：编码 + 提取）
**房间**：dining

#### 物体与容器（全 Kenney）
| 物体 | modelAssetId | 容器 | modelAssetId |
|---|---|---|---|
| 脏杯 obj-dirty-cup | food/mug | 餐桌 cnt-dining-table | furniture/table |
| 脏盘 obj-dirty-plate | food/plate | 水槽 cnt-sink | furniture/kitchenSink |
| 叉 obj-fork | food/utensil-fork | 橱柜 cnt-cabinet | furniture/kitchenCabinetDrawer |
| 勺 obj-spoon | food/utensil-spoon | 垃圾桶 cnt-trash | furniture/trashcan |

#### 完整循环
1. **编码**：玩家靠近餐桌，观察 4 件物品，按 E 保存位置记忆（至少 1 件）。
2. **保持间隔**：玩家离开餐桌去厨房端（走到水槽/橱柜旁，约 3-4 秒移动）。
3. **扰动**：猫跳上餐桌，把勺子拨到地上（move-entity）。桌上面目变化，与记忆冲突。
4. **提取行动**：玩家返回餐桌，依赖记忆判断"少了什么、勺子在哪"，按序归位（杯→水槽，盘→橱柜，叉→橱柜，勺→橱柜）。
5. **Probe**：桌上一开始几件？勺子被猫弄到哪了？

#### 扰动机制
- `se-cat-moves-spoon`：step=6 时，勺子从餐桌移到地上 (0.8, 0.025, 0.6)。
- 玩家若只凭当前画面，不知道勺子原本在桌上还是地上——必须靠记忆。

#### 错误恢复
- 勺子在地上可见，玩家可拾起放回橱柜。不软锁。

#### 研究数据点
- 计数准确率、记忆保存时机、首次返回餐桌是否检查旧位置。

---

### L2 · 出门大作战（旗舰关）

**定位**：空间记忆失效与更新。旗舰展示关。
**主记忆能力**：Spatial Memory（空间记忆：编码 → 失效 → 更新）
**房间**：living + bedroom + entrance

> ⚠️ Kenney 化边界：钥匙/手机/雨伞无 Kenney 模型，保留程序化小件（颜色区分）。家具容器已全 Kenney。用户 review 时可决定是否改"睡前仪式"主题以全 Kenney 化。

#### 物体与容器
| 物体 | modelAssetId | 容器 | modelAssetId |
|---|---|---|---|
| 钥匙 obj-key | （程序化金色） | 茶几 cnt-coffee-table | furniture/tableCoffee |
| 手机 obj-phone | （程序化深色） | 床头柜 cnt-nightstand | furniture/cabinetBedDrawer |
| 雨伞 obj-umbrella | （程序化蓝色） | 伞架 cnt-umbrella-stand | （程序化） |
| | | 玄关托盘 cnt-entrance-tray | （程序化） |

#### 完整循环
1. **编码**：玩家在客厅茶几看到钥匙，按 E 保存钥匙位置记忆。
2. **保持间隔**：玩家去卧室取手机（开床头柜抽屉 → 拿手机）。离开客厅期间插入移动任务。
3. **扰动**：猫把钥匙从茶几推到沙发西侧 (-2.6, 0, 1.9)。原位置记忆标记 outdated。
4. **发现冲突**：玩家返回客厅茶几，发现钥匙不在记忆中的位置。猫脚印指引新位置。
5. **重新观察 + 更新**：玩家到新位置按 E 更新记忆（memoryUpdateCount++）。
6. **提取行动**：将手机、钥匙、雨伞放玄关托盘。
7. **Probe**：钥匙最初在哪？猫推到哪了？

#### 扰动机制（保留现有）
- `se-cat-pushes-key`：钥匙从茶几 (0,0,0.3) 移到 (-2.6,0,1.9)，markMemoryOutdated。
- 触发条件：存了 fresh 钥匙记忆 + 离开客厅，或 已拿到手机。

#### Perceptual Memory 仪式序列（已实现）
- FINALIZE 阶段按 📱→🔑→☂️ 顺序放置（requiredSequence）。
- ⚠️ 若 L2 改"睡前仪式"主题，此序列改为 书→笔记本→枕头→杯→熊。

#### 错误恢复
- 钥匙新位置可见（猫脚印引导），玩家可拾起。旧记忆 outdated 不阻止拾取（只阻止覆盖）。

#### 研究数据点
- 是否检查旧位置、发现冲突时间、是否主动更新记忆、Probe 表现。

---

### L3 · 洗衣分拣（整合关）

**定位**：有限记忆预算与多目标干扰。
**主记忆能力**：整合记忆（记忆容量 + 干扰 + 分类）
**房间**：laundry

#### 物体与容器（全 Kenney，颜色区分）
| 物体 | modelAssetId | 容器 | modelAssetId |
|---|---|---|---|
| 浅色衣物 obj-white-* | furniture/pillow | 白色篮 cnt-white-basket | furniture/trashcan |
| 深色衣物 obj-dark-* | **furniture/pillowBlue** | 深色篮 cnt-dark-basket | furniture/trashcan |
| 毛巾 obj-towel-* | **furniture/pillowLong** | 毛巾篮 cnt-towel-basket | furniture/trashcan |

#### 完整循环
1. **编码**：玩家观察 3 个篮子位置 + 一批衣物，选择保存哪些到有限记忆槽（3 槽）。
2. **保持间隔**：玩家转身处理首批衣物。
3. **扰动**：隐藏篮子标签 / 交换两个篮子位置，玩家不能只靠当前颜色文字判断。
4. **提取行动**：依赖记忆判断"哪个篮子收什么"，完成分类。
5. **Probe**：三个篮子分别收什么类？

#### 扰动机制（需新增）
- `se-baskets-shuffled`