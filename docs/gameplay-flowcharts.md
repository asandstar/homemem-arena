# 玩法流程图

本文件用 Mermaid 流程图描述游戏整体循环和每个关卡的玩法编排。
所有流程图均可在 GitHub / VS Code Mermaid 预览中直接渲染。

源码对应关系：
- 关卡定义 → [src/data/tasks/](../src/data/tasks/)
- 阶段引擎 → [src/game/flow.ts](../src/game/flow.ts) (`StageContext` / `StageDef`)
- 暂停/存档 → [src/components/arena3d/PauseMenu.tsx](../src/components/arena3d/PauseMenu.tsx) / [src/save/saveSystem.ts](../src/save/saveSystem.ts)

---

## 1. 游戏主循环

涵盖从任务选择到结果页的完整流程，包含暂停/存档分支。

```mermaid
flowchart TD
    Start([玩家进入]) --> Select[任务选择页]
    Select --> HasSave{有存档?}
    HasSave -->|继续| Restore[restoreSave 恢复]
    HasSave -->|重来/新关| Briefing
    Restore --> SkipBrief[跳过 briefing]
    SkipBrief --> Playing

    Briefing[briefing 简介] --> Playing[playing 游戏中]
    Playing --> Pause{按 ESC}
    Pause -->|暂停| PauseMenu[暂停菜单]
    PauseMenu -->|继续| Playing
    PauseMenu -->|重来| Briefing
    PauseMenu -->|返回选择| Select
    PauseMenu -.->|打开时触发| Autosave[autosaveGame]

    Playing --> Autosave
    Playing --> PhaseEnd{阶段切换}
    PhaseEnd -->|briefing→playing| Playing
    PhaseEnd -->|playing→probing| Probe[探针问答]
    PhaseEnd -->|→result| Result[结果报告]
    PhaseEnd -.->|每次切换| Autosave

    Probe --> Analyzing[AI 分析]
    Analyzing --> Result
    Result --> Select
```

### 暂停/存档交互要点

- **ESC 触发**：playing / briefing 阶段按 ESC → `setPaused(true)` + `exitPointerLock()`
- **暂停时冻结**：3 套 AudioContext suspend + `tickElapsed` 跳过
- **存档触发时机**：60 秒定时器 / 阶段切换 / 暂停菜单打开
- **存档格式**：单槽覆盖，key = `homemem_autosave_<taskId>`，含 `version` + `taskConfigHash` 双校验
- **恢复流程**：`restoreSave` → 校验 version + hash → `loadFromSave` 恢复 game state + session data → 跳过 briefing

---

## 2. 关卡 1：初次整理（task-clean-table）

- **角色**：tutorial 教学关
- **房间**：餐厅
- **物品**：脏杯子、餐巾纸、叉子
- **容器**：餐桌、洗碗机、垃圾桶、餐具架
- **混乱事件**：无（教学关禁用）

```mermaid
flowchart TD
    S1[Stage 1 · 观察餐桌] --> E1[按 E 保存任意物品记忆]
    E1 --> C1{已保存记忆?}
    C1 -->|否| E1
    C1 -->|是| S2[Stage 2 · 分类杯和纸]

    S2 --> Pick1[F 拾取脏杯子]
    Pick1 --> Put1[放入洗碗机]
    Put1 --> Pick2[F 拾取餐巾纸]
    Pick2 --> Put2[扔进垃圾桶]
    Put2 --> C2{杯在洗碗机 且 纸在垃圾桶?}
    C2 -->|否| S2
    C2 -->|是| S3[Stage 3 · 归位叉子]

    S3 --> Pick3[F 拾取叉子]
    Pick3 --> Put3[放回餐具架]
    Put3 --> C3{三件物品全部归位?}
    C3 -->|否| S3
    C3 -->|是| Done([完成 → 探针问答])

    style S1 fill:#f3eeff,stroke:#7c3aed
    style S2 fill:#f3eeff,stroke:#7c3aed
    style S3 fill:#f3eeff,stroke:#7c3aed
    style Done fill:#dcfce7,stroke:#16a34a
```

### 探针题（3 题）

| ID | 类型 | 考察点 |
|----|------|--------|
| p-cup-location | 空间记忆 | 杯子最终位置 |
| p-trash-destination | 物体记忆 | 餐巾纸扔到了哪 |
| p-fork-destination | 程序记忆 | 叉子放回哪 |

---

## 3. 关卡 2：出门大作战（task-leave-home）

- **角色**：semifinal-core 核心关
- **房间**：客厅、卧室、玄关
- **物品**：钥匙、手机、雨伞
- **容器**：茶几、床头柜、伞架、玄关托盘
- **核心机制**：猫咪推钥匙 → 记忆过期 → 必须更新

```mermaid
flowchart TD
    S1[Stage 1 · 寻找三件物品] --> Find1[客厅: 找钥匙]
    S1 --> Find2[卧室: 找手机]
    S1 --> Find3[客厅/玄关: 找雨伞]
    Find1 --> Save1[按 E 保存钥匙记忆]
    Find2 --> Save2[按 E 保存手机记忆]
    Find3 --> Save3[按 E 保存雨伞记忆]
    Save1 --> C1{三件都已保存记忆?}
    Save2 --> C1
    Save3 --> C1
    C1 -->|否| S1
    C1 -->|是| CatEvent[🐱 猫咪推钥匙到地上!]

    CatEvent --> S2[Stage 2 · 钥匙记忆已过期]
    S2 --> FindKey[回到客厅重新找钥匙]
    FindKey --> UpdateKey[按 E 更新钥匙记忆]
    UpdateKey --> C2{记忆已更新且为 fresh?}
    C2 -->|否| FindKey
    C2 -->|是| S3[Stage 3 · 出门准备]

    S3 --> PutKey[钥匙 → 玄关托盘]
    S3 --> PutPhone[手机 → 玄关托盘]
    S3 --> PutUmb[雨伞 → 玄关托盘]
    PutKey --> C3{三件都在托盘上?}
    PutPhone --> C3
    PutUmb --> C3
    C3 -->|否| S3
    C3 -->|是| Done([完成 → 探针问答])

    style S1 fill:#f3eeff,stroke:#7c3aed
    style S2 fill:#fef3c7,stroke:#d97706
    style S3 fill:#f3eeff,stroke:#7c3aed
    style CatEvent fill:#fef3c7,stroke:#d97706
    style Done fill:#dcfce7,stroke:#16a34a
```

### 混乱事件

| 事件 ID | 触发条件 | 效果 |
|---------|---------|------|
| se-cat-pushes-key | step >= 8 且钥匙未归位 | 猫将钥匙推到地上，钥匙记忆过期 |
| se-phone-ringing | step >= 5 | 手机铃声提示位置 |

### 探针题

| ID | 类型 | 考察点 |
|----|------|--------|
| p-key-initial-location | 空间记忆 | 钥匙最初在哪 |
| p-key-outdated-event | 时间记忆 | 记忆何时过期 |
| p-phone-location | 空间记忆 | 手机最终位置 |

---

## 4. 关卡 3：洗衣幽灵（task-laundry-sort）

- **角色**：challenge 挑战关
- **房间**：洗衣房
- **物品**：9 件衣物（白衬衫、白袜子、小白巾、黑T恤、牛仔裤、黑袜子、大浴巾、小方巾、彩色条纹衬衫）
- **容器**：白色篮、深色篮、毛巾篮
- **核心机制**：幽灵交换篮子位置、藏袜子、移动毛巾

```mermaid
flowchart TD
    S1[Stage 1 · 观察衣物] --> Save[按 E 记录白色衣物位置]
    Save --> C1{已保存记忆 或 step >= 3?}
    C1 -->|否| Save
    C1 -->|是| S2[Stage 2 · 白深分类]

    S2 --> SortWhite[白色衣物 → 白色篮]
    S2 --> SortDark[深色衣物 → 深色篮]
    SortWhite --> C2{白色全入篮 且 深色全入篮?}
    SortDark --> C2
    C2 -->|否| S2
    C2 -->|是| Ghost1[👻 幽灵移动毛巾!]

    Ghost1 --> S3[Stage 3 · 更新毛巾位置]
    S3 --> FindTowel[确认毛巾新位置]
    FindTowel --> SortTowel[毛巾 → 毛巾篮]
    SortTowel --> C3{毛巾全部分类?}
    C3 -->|否| FindTowel
    C3 -->|是| S4[Stage 4 · 最终确认]

    S4 --> Mystery[彩色条纹衬衫?]
    Mystery --> Check[查看水洗标: WHITE 40°]
    Check --> SortMystery[归类 → 白色篮]
    S4 --> Verify[确认所有衣物进正确篮子]
    SortMystery --> Verify
    Verify --> C4{4 个目标全达成?}
    C4 -->|否| S4
    C4 -->|是| Done([完成 → 探针问答])

    style S1 fill:#f3eeff,stroke:#7c3aed
    style S2 fill:#f3eeff,stroke:#7c3aed
    style S3 fill:#fef3c7,stroke:#d97706
    style S4 fill:#f3eeff,stroke:#7c3aed
    style Ghost1 fill:#fef3c7,stroke:#d97706
    style Done fill:#dcfce7,stroke:#16a34a
```

### 混乱事件

| 事件 ID | 触发条件 | 效果 |
|---------|---------|------|
| se-cat-moves-clothes | step >= 6 | 猫移动衣物位置 |
| se-cat-moves-towel | step >= 10 | 幽灵移动毛巾到新位置 |
| se-cat-hides-dark-socks | step >= 8 | 猫藏起黑袜子 |
| se-baskets-swapped | step >= 12 | 白篮和深篮位置交换 |
| se-mystery-item-appears | step >= 14 | 彩色条纹衬衫出现 |

### 探针题

| ID | 类型 | 考察点 |
|----|------|--------|
| p-count-white | 计数记忆 | 白色衣物有几件 |
| p-count-towel | 计数记忆 | 毛巾有几件 |
| p-classify-jeans | 程序记忆 | 牛仔裤归类 |
| p-socks-final | 物体记忆 | 袜子最终位置 |

---

## 5. 关卡 4：早餐时间循环（task-breakfast）

- **角色**：challenge 隐藏关
- **房间**：厨房、餐厅
- **物品**：牛奶、麦片、杯子、碗、勺子
- **容器**：冰箱、上层橱柜、下层橱柜、厨房台面、水槽、洗碗机、垃圾桶、餐桌
- **核心机制**：麦片自动跑到上层橱柜、冰箱自动关门、牛奶超时扣分

```mermaid
flowchart TD
    S1[Stage 1 · 取食材] --> OpenFridge[打开冰箱]
    S1 --> OpenCabinet[打开下层橱柜]
    OpenFridge --> GetMilk[取出牛奶]
    OpenCabinet --> GetCereal[取出麦片]
    S1 --> GetCup[取出杯子]
    S1 --> GetBowl[取出碗]
    GetMilk --> C1{四件食材都取出?}
    GetCereal --> C1
    GetCup --> C1
    GetBowl --> C1
    C1 -->|否| S1
    C1 -->|是| S2[Stage 2 · 按序上桌]

    S2 --> Order1[1. 牛奶 → 餐桌]
    Order1 --> Order2[2. 麦片 → 餐桌]
    Order2 --> Order3[3. 碗 → 餐桌]
    Order3 --> Order4[4. 杯子 → 餐桌]
    Order4 --> C2{四件都在餐桌上?}
    C2 -->|否| S2
    C2 -->|是| Cereal[📦 麦片跑到上层橱柜!]

    Cereal --> S3[Stage 3 · 归位食材]
    S3 --> RetMilk[牛奶 → 回冰箱]
    S3 --> FindCereal[去上层橱柜找麦片]
    FindCereal --> RetCereal[麦片 → 回橱柜]
    RetMilk --> C3{牛奶和麦片都归位?}
    RetCereal --> C3
    C3 -->|否| S3
    C3 -->|是| S4[Stage 4 · 收尾厨房]

    S4 --> DishWash[杯碗 → 洗碗机/水槽]
    S4 --> CloseAll[关闭冰箱 + 橱柜]
    DishWash --> C4{杯碗入洗碗机 且 容器全关?}
    CloseAll --> C4
    C4 -->|否| S4
    C4 -->|是| Done([完成 → 探针问答])

    style S1 fill:#f3eeff,stroke:#7c3aed
    style S2 fill:#f3eeff,stroke:#7c3aed
    style S3 fill:#fef3c7,stroke:#d97706
    style S4 fill:#f3eeff,stroke:#7c3aed
    style Cereal fill:#fef3c7,stroke:#d97706
    style Done fill:#dcfce7,stroke:#16a34a
```

### 混乱事件

| 事件 ID | 触发条件 | 效果 |
|---------|---------|------|
| se-cereal-moved-to-cabinet | 四件上桌后 | 麦片自动移到上层橱柜 |
| se-fridge-auto-close | step >= 15 | 冰箱门自动关闭 |
| se-milk-deduct-points | 牛奶在外超时 | 扣分警告 |
| se-milk-deduct-more | 牛奶继续在外 | 扣更多分 |
| se-wrong-affordance-use | 放错容器 | 提示正确容器 |
| se-cat-timer | 猫干扰 | 计时异常提示 |

### 探针题

| ID | 类型 | 考察点 |
|----|------|--------|
| p-spatial-cereal-location | 空间记忆 | 麦片跑到哪了 |
| p-object-state-fridge | 物体记忆 | 冰箱最终状态 |
| p-temporal-order | 时间记忆 | 上桌顺序 |
| p-procedural-missing-step | 程序记忆 | 漏了哪一步 |
| p-spatial-cereal-final | 空间记忆 | 麦片最终位置 |
| p-object-state-milk | 物体记忆 | 牛奶最终状态 |
| p-temporal-penalty | 时间记忆 | 扣分事件 |

---

## 6. 关卡 5：深夜巡逻（task-night-patrol）

- **角色**：challenge 隐藏关
- **房间**：客厅、卧室、厨房、玄关、餐厅
- **物品**：遥控器、手机、碗、雨伞
- **容器**：客厅茶几、卧室床头柜、厨房台面、玄关伞架
- **核心机制**：黑暗视野（只能看清近处）、窗户晃动震飞雨伞

```mermaid
flowchart TD
    S1[Stage 1 · 巡查客厅+卧室] --> Dark[🌙 黑暗中视野受限]
    Dark --> FindRemote[客厅: 找遥控器]
    Dark --> FindPhone[卧室: 找手机]
    FindRemote --> PutRemote[遥控器 → 茶几]
    FindPhone --> PutPhone[手机 → 床头柜]
    PutRemote --> C1{遥控器和手机都归位?}
    PutPhone --> C1
    C1 -->|否| S1
    C1 -->|是| Wind[💨 窗户晃动! 雨伞被震飞!]

    Wind --> S2[Stage 2 · 找雨伞新位置]
    S2 --> SearchUmb[在客厅搜索雨伞]
    SearchUmb --> SaveUmb[按 E 保存雨伞新位置 或 拾取]
    SaveUmb --> C2{雨伞已保存或归位?}
    C2 -->|否| SearchUmb
    C2 -->|是| S3[Stage 3 · 最终确认]

    S3 --> FindBowl[厨房: 找碗]
    FindBowl --> PutBowl[碗 → 厨房台面]
    S3 --> PutUmb[雨伞 → 玄关伞架]
    PutBowl --> C3{4/4 全部归位?}
    PutUmb --> C3
    C3 -->|否| S3
    C3 -->|是| Done([完成 → 探针问答])

    style S1 fill:#f3eeff,stroke:#7c3aed
    style S2 fill:#fef3c7,stroke:#d97706
    style S3 fill:#f3eeff,stroke:#7c3aed
    style Dark fill:#e0e7ff,stroke:#4f46e5
    style Wind fill:#fef3c7,stroke:#d97706
    style Done fill:#dcfce7,stroke:#16a34a
```

### 混乱事件

| 事件 ID | 触发条件 | 效果 |
|---------|---------|------|
| se-darkness-vision | 开局 | 黑暗视野，只能看清近处 |
| se-appliance-hum | step >= 6 | 电器异响提示 |
| se-owner-asleep | 全程 | 主人睡觉，需安静 |
| se-window-rattle | step >= 10 | 窗户晃动震飞雨伞 |
| se-phone-glow | step >= 8 | 手机微光提示位置 |
| se-half-time-check | 时间过半 | 半程检查提示 |
| se-cat-sight | step >= 15 | 猫影闪过 |

### 探针题

| ID | 类型 | 考察点 |
|----|------|--------|
| p-spatial-remote-home | 空间记忆 | 遥控器归属 |
| p-spatial-phone-found | 空间记忆 | 手机在哪找到 |
| p-spatial-umbrella-home | 空间记忆 | 雨伞最终位置 |
| p-temporal-window-event | 时间记忆 | 窗户晃动事件 |

---

## 图例

| 颜色 | 含义 |
|------|------|
| ![紫色](https://img.shields.io/badge/-阶段入口-7c3aed) | Stage 阶段入口 |
| ![黄色](https://img.shields.io/badge/-混乱事件-d97706) | 混乱/意外事件 |
| ![绿色](https://img.shields.io/badge/-完成-16a34a) | 关卡完成 |
| ![靛蓝](https://img.shields.io/badge/-特殊状态-4f46e5) | 环境状态（如黑暗） |
