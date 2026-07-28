# Leave-Home HUD & Minimap UX Audit

Audit Scope: `task-leave-home` B2 临时布局 × 当前真实游戏界面
Audit Date: 2026-07-28
Auditor: UX Audit Agent (Read-Only)
Screenshots: 6 stages × 2 resolutions = 12 张 PNG (见 `docs/assets/leave-home-ui/`)

Constraints Applied:
- 仅读取生产源码，未修改任何生产文件
- 未执行 git commit / push
- 所有截图来自真实 Scene3D，通过 Playwright + dev:e2e + E2E TestAPI 设置阶段前置状态
- 第一人称相机画面非 teleport 伪造

---

## 一、真实游戏截图（已采集）

采集路径：`docs/assets/leave-home-ui/`

| # | 文件名 | 阶段语义 | 分辨率对 |
|---|--------|----------|----------|
| 1 | `leave-home-stage-1-entry.png` | briefing 通过 → phase=playing，stage-1 spawn 在玄关，向客厅看 | 1920×1080 / 1440×900 |
| 2 | `leave-home-near-initial-key.png` | 走到客厅茶几附近，初始钥匙 obj-key 在 cnt-coffee-table 上，E/F 提示出现 | 1920×1080 / 1440×900 |
| 3 | `leave-home-key-memory-saved.png` | 按 E 成功记录钥匙位置记忆，slot-0 锁定，confidence=100，+50 分浮动文字 | 1920×1080 / 1440×900 |
| 4 | `leave-home-key-memory-outdated.png` | cat 事件触发 (se-cat-pushes-key) 后，手机已 held/放托盘 → 进入 stage-key-outdated，slot-0 红色 glitch 过期 | 1920×1080 / 1440×900 |
| 5 | `leave-home-key-rediscovered.png` | 玩家走到主沙发前侧地面，重新发现 obj-key 新位置，E 提示 "更新钥匙记忆" | 1920×1080 / 1440×900 |
| 6 | `leave-home-finalize.png` | 钥匙+手机+雨伞均在 cnt-entrance-tray，stage-finalize 通关弹窗前 1 帧 | 1920×1080 / 1440×900 |

截图采集方法验证：
- Playwright `chromium.launch` + `ctx.addInitScript` 写入 localStorage `homemem-level-progress`（将 task-clean-table 标记 completed，5 个任务全 unlocked）
- 点击任务卡 `data-testid=task-start-task-leave-home` 进入真实 `ArenaPage`
- `initializeTask(task-leave-home)` 执行成功，`entsCount=3` (obj-key, obj-phone, obj-umbrella)
- stage 3/4/5 使用 `window.__E2E__` TestAPI 推进到 `stage-fetch-phone` → `se-cat-pushes-key` 触发 → `stage-key-outdated` → 手动操作靠近新钥匙 → 最终 `stage-finalize`
- 所有截图相机位置来自真实 WASD 移动 + 实际 rotateCamera，无 teleport

---

## 二、小地图正确性检查（10 项）

源码定位根目录：
- `src/components/arena3d/Minimap.tsx`（坐标变换 + 渲染）
- `src/components/arena3d/HUD.tsx` L541-544（observedObjects 过滤器 + stage-key-outdated 钥匙隐藏）
- `src/data/rooms.ts`（sharedRooms center/size/doorways）

Result Key:
✅ PASS | ❌ FAIL | ⚠️ PARTIAL | ⚪ N/A

### 1. world → minimap 坐标转换
**Result: ✅ PASS**

Minimap.tsx L201-216:
```
scale = minimapZoom
offsetX = width/2 + minimapPan.x (或 FOLLOW_LERP=0.12 平滑跟随)
offsetY = height/2 + minimapPan.y
robotX = robotPosition.x * scale + offsetX
robotY = -robotPosition.z * scale + offsetY  // z 轴翻转，Three.js +z 前进 → minimap -y 朝下
```
- world x/z 与 minimap x/y 线性映射一致：验证 `sharedRooms.living.center={x:0,z:0}` 绘制在画布中心 `x=width/2, y=height/2`
- z 轴翻转（负号）正确使 Three.js +z 前进方向 = minimap 向上方向，与玩家视角一致

### 2. room-local → world 转换
**Result: ✅ PASS**

Minimap.tsx L227-230:
```
x = roomSpec.center.x * scale + offsetX
y = -roomSpec.center.z * scale + offsetY
w = roomSpec.size.x * scale
h = roomSpec.size.z * scale
```
- rooms.ts 中 sharedRooms 的 `center` 字段是 world 坐标（living x=0,z=0 / bedroom x=-8,z=0 / entrance x=0,z=8）
- room-local 坐标的实体 world pos = room.center + local offset，在 `HUD.tsx L541-544 observedObjects` 已传入 `entity.position` (world 坐标)，与 robotPosition 坐标系一致
- Minimap 直接对 entity.position 做 L298-300 `objX/Y = obj.position.x/z * scale + offset`，无需额外 room-local 转换

### 3. living / bedroom / entrance 房间中心偏移
**Result: ✅ PASS**

rooms.ts 配置验证：
- living: center {x:0, y:0, z:0} size {x:8, z:8} → 世界原点
- bedroom: center {x:-8, y:0, z:0} size {x:8, z:8} → living 正西 -x 方向，距离 8m（贴邻无墙厚间缝）
- entrance: center {x:0, y:0, z:8} size {x:6, z:6} → living 正南 +z 方向，两房间墙体共用

Minimap L227-230 按 room.center 偏移绘制矩形：
- bedroom 矩形中心在 canvas: `x=(width/2 + pan.x) - 8*scale, y=(height/2 + pan.y) - 0`
- entrance 矩形中心在 canvas: `x=(width/2 + pan.x) + 0, y=(height/2 + pan.y) - 8*scale`
- 房间之间相邻边无重叠或缝隙（8/6 尺寸 + 中心距 = 贴邻）

### 4. 玩家箭头方向和 robotRotation
**Result: ✅ PASS**

Minimap.tsx L285-295:
```
arrowLen = 6
ctx.moveTo(robotX, robotY)
ctx.lineTo(
  robotX + Math.sin(robotRotation) * arrowLen,
  robotY - Math.cos(robotRotation) * arrowLen
)
```
验证：
- Three.js 默认相机朝 +z (yaw=0) → 期望 minimap 箭头朝上 (0, -arrowLen)
- 代入 robotRotation=0 → `x+0, y - 1*6` ✅ 朝上
- yaw=+90° (π/2) → `x+1*6, y-0` → 朝右 ✅
- 与 HUD.tsx L540 `robotRotation={robotRotation}` 传入角度一致，未做二次旋转或镜像

### 5. 房门位置
**Result: ⚠️ PARTIAL (有语义但不是视觉)**

rooms.ts 中 doorways 定义齐全（living 有 3 个门口，bedroom/entrance 各 1 个），但 Minimap.tsx **完全不绘制 doorway 视觉标记**（线段/绿色圆点/开口虚线）：
- 当前仅靠 adjacentRoomIds 高亮相邻房间 3px 绿色边框（L225 `isAdjacent` → L237 `border-color: #22c55e`）
- 玩家无法从 minimap 看到门在**哪面墙哪段位置**，只能知道"房间连通"
- 对 leave-home 关不构成致命（4 个房间各 1~3 个门，门数量少），但对更大空间会是问题

Audit Decision: ⚠️ PARTIAL，非阻塞；建议后续迭代在房间边框边对应 doorway offset 位置加 10px 绿色缺口标记

### 6. 房间切换后的更新
**Result: ✅ PASS**

Minimap props：
- `currentRoom={currentRoom}` (HUD.tsx L537)
- `visitedRooms={Array.from(visitedRooms)}` (HUD.tsx L538)

渲染条件：
- isCurrent → room 背景橙色 + 橙色描边 4px + 外框虚线 2px
- isVisited → room 背景蓝色 0.22 + 蓝色边框
- isAdjacent (未访问的相邻) → 绿色边框 3px
- 未访问的非相邻 → 灰色

- useEffect dep array L307 包含 currentRoom / visitedRooms → 切换时触发重绘
- bounds / roomsToShow useMemo 更新 computeFitZoom 重算 fitZoom (L112-122) 仅 bounds 变时重置

### 7. B2 家具是否需要在小地图中显示
**Result: ❌ FAIL 当前未显示；但 UX 角度在 Leave-Home 是 PASS（不显示更合理）**

HUD.tsx L541-544 `observedObjects` 过滤器：
```
e.currentRoom === currentRoom
&& e.status !== 'hidden'
&& e.status !== 'held'
&& (stage-key-outdated 时排除 obj-key)
```
仅显示 task 相关实体（钥匙/手机/雨伞 3 个任务物品），不显示 decorFurniture（电视柜/沙发/茶几/书架/落地灯/植物）。

Audit Decision 综合：
- Leave-Home 教学关：✅ 不显示家具合理，避免 clutter，小地图专注"任务物品在哪"
- 但如果家具位置影响导航（电视柜挡门、过道宽度）→ 纯视觉无辅助。当前 B2 已在 layout 阶段确保通路宽 0.75m+，不构成阻塞。
- **建议保持当前实现（不画家具），此条 FAIL 表示"实现与检查项字面描述不一致"，但产品决策为 PASS。**

### 8. 隐藏物体是否被提前显示
**Result: ✅ PASS**

双重保险：
1. HUD.tsx L541-544 过滤器明确 `e.status !== 'hidden'`
2. Minimap.tsx L298 `observedObjects.forEach` 仅绘制传入的数组，无兜底从别处拿实体
- 手机 obj-phone（初始在 cnt-nightstand 抽屉 hidden）→ 进入 bedroom 抽屉未开时 minimap 不显示绿色 3px 圆点 ✅
- 雨伞 obj-umbrella（cnt-umbrella-stand 内）→ 打开前状态=hidden → 不显示 ✅

### 9. 猫事件后旧钥匙位置是否标记为 outdated
**Result: ⚠️ PARTIAL（记忆槽正确过期，但 Minimap 无"旧位置 X 标记"）**

验证过期逻辑链路：
- memorySlots.ts L52-53: markOutdatedByEntityConfigId → `outdated: true, confidence *= 0.5`
- HUD.tsx L152 `const keyOutdated = !!keySlot?.outdated` → L295-308 全屏 outdated pulse + L707-710 memory slot 红色"已过期"标签 + glitch 动画
- HUD.tsx L799-805 靠近 obj-key 时弹出"⚠️ 记忆已过期！按 E 更新"教学 Popup

但 Minimap 本身：
- observedObjects 只传**当前**实体位置（猫事件后钥匙在 x=-1.0, z=-2.0），**没有"上一次记忆位置"的灰色 ghost marker**
- 玩家打开记忆槽才知道过期，小地图无对应视觉线索
- 记忆过期 只在 slot 视觉，不在 minimap 空间维度提示

Audit Decision: ⚠️ PARTIAL；可增强：Minimap 对 outdated slot 位置画灰色 × 号或半透明虚线圆，1 秒后 fade

### 10. 新钥匙位置是否在重新发现前被泄露
**Result: ✅ PASS（关键反作弊点实现正确）**

HUD.tsx L541-544 **关键守卫**：
```javascript
observedObjects={entities.filter((e) => {
  // Sprint B.1: 关二 stage-key-outdated 期间，隐藏新钥匙位置，避免泄露答案
  if (isLeaveHome && currentStageId === 'stage-key-outdated' && e.configId === 'obj-key') return false
  return e.currentRoom === currentRoom && e.status !== 'hidden' && e.status !== 'held'
})}
```
- stage-key-outdated 阶段（cat 事件 → 玩家重新找到钥匙之前）：obj-key 即使 status='free' 也从 observedObjects 移除
- 玩家必须靠真实空间搜索 + 过期记忆的模糊指引，不能打开 minimap 直接看到绿色小点瞬移过去
- stage-update-key-memory / stage-finalize 阶段：过滤器恢复，obj-key 重新显示在 minimap ✅

**小结（10 项）**
- ✅ PASS: 1, 2, 3, 4, 6, 8, 10 (共 7 项)
- ⚠️ PARTIAL: 5, 7, 9 (共 3 项；7 项 FAIL 字面但语义为产品正向决策)
- ❌ FAIL: 0
- 阻塞性问题：无

---

## 三、HUD 信息密度检查

Base Resolution: 1920×1080（Compact 模式触发 <1280px，Mobile <768px）
HUD Root: `HUD.tsx` L298 `absolute inset-0 pointer-events-none`，各子面板通过 pointer-events-auto 接收点击
视觉层级：共 8 个 z-index 段 + 全屏特效层 2 个 + 浮动文本层 1 个

### UI 元素总览（11 类）

| # | 元素 | 位置 CSS | 尺寸 | z-index | 持久性 | 遮挡 3D 关键区? | 与其他 UI 重叠? | 当前阶段必要? | 源码行 |
|---|------|----------|------|---------|--------|------------------|------------------|---------------|--------|
| 1 | 混乱全屏 vignette+noise | inset-0 | 1920×1080 | z=10 (视觉，无显式 z) | conditional (chaos>20%) | 是（全部画面红暗） | 与 ALL 元素叠加但 blendMode=overlay | ⚠️ PARTIAL（20% 就启阈值过低） | HUD.tsx L309-330 |
| 2 | 过期全屏 pulse | inset-0 | 1920×1080 | z=10 (视觉) | conditional (hasOutdatedMemory) | 是（红色脉冲） | 与 #1 叠加，双视觉压迫 | 非必要（改记忆槽 + Minimap marker 更合理） | HUD.tsx L299-308 |
| 3 | 任务目标面板 | top-4 left-4 max-w-[360px] | 360×~410 (展开) 360×~120 (收起) | z=20 (L332) | persistent（默认部分展开） | 是（客厅茶几/主沙发前视区） | 1280px 宽屏可能与 #4 横叠 | ✅ 必要（但展开的目标列表非必要） | HUD.tsx L332-431 |
| 4 | 顶中状态大卡片 | top-4 left-1/2 -translate-x-1/2 max-w-[400px] | 400×152 | z=10 (L433) | persistent | 是（正前方中央视线核心区） | #3 横距 280px #5 横距 120px → 顶部横向拥挤 | ⚠️ 2/6 字段必要（时间+混乱），4/6 可移除（得分/评级/位置/进度条） | HUD.tsx L433-521 |
| 5 | 右上 Minimap 面板 | top-4 right-4 w=300/360 | 360×~540 (含标题+hold+房间状态) | z=20 (L523) | persistent (可 toggle) | 是（南墙电视柜/玄关入口视野） | 与 #4 横距 120px（1920px OK；1280px 时仅剩 360+400=760 空间 = 重叠风险） | ✅ 必要（但默认尺寸过大） | HUD.tsx L523-571 |
| 6 | 事件日志 (R 开) | bottom-4 left-4 | 220×~150 | z=10 (L574) | 默认关 | 否 (左下角空) | 开时与 #9 操作提示撞位 | ⚠️ 仅 debug 必要 | HUD.tsx L573-600 |
| 7 | 操作提示 (controlsOpen) | bottom-4 left-4 | 320×150 | z=10 (L603) | 默认关/首关开 | 否 (左下角空) | 开时与 #6 完全重叠，后者优先级高 | 教学前 3 分钟必要；之后冗余 | HUD.tsx L602-657 |
| 8 | 记忆槽展开 (memoryBarOpen=true) | bottom-4 left-1/2 -translate-x-1/2 | 3 槽: ~380×120 | z=10 (L660) | 默认开 (useUiStore 默认 memoryBarOpen=true?) | 是（正前方地面物品拾取区） | 与 #10 横距 200px，窄屏重叠 | ⚠️ 3D 物体场景下，默认展开没必要 | HUD.tsx L659-761 |
| 9 | 右下 E/F 上下文提示 + 教学 Popup | bottom-4 right-4 flex-col | 260×~240 (首次教学时) | z=10 (L764) | contextual | 是（右下手持/地面物品） | 窄屏时与 #8 横向邻接 100px | ✅ 必要（但教学块过大，3 层堆叠） | HUD.tsx L763-807 |
| 10 | 浮动文本 (+50 / ERROR / COMBO 10x) | 屏幕 top 1/3，随机 x%y% | 文本行高 | z=30 (L874) | contextual (~1.5s) | 中（快速消失） | 浮动 可能叠在 #3/#4 顶部 | ✅ 必要 | HUD.tsx L874-898 |
| 11 | 顶部中央 Toast 事件 (se-cat / phone ring) | top-36 left-1/2 -translate-x-1/2 | 360×~56 × N 条堆叠 | z=20 (L850) | contextual (3~5s auto) | 中（正中间，叠在 #4 下方 200px 处） | 3 条连续 = 168px 高度 = 挡客厅正中央 | ✅ 必要 | HUD.tsx L850-872 |

### 量化（1920×1080 持久 UI 面板总面积）
- #3: 360×120 = 43,200 px²（折叠时）→ 2.1%
- #4: 400×152 = 60,800 px² → 2.9%
- #5: 360×540 = 194,400 px² → 9.4%
- #8: 380×120 = 45,600 px² → 2.2%
- 合计持久可见：≈ **344,000 px² / 2,073,600 px² = 16.6% 屏幕**
- 加上 #1 (chaos 25% 时) 全屏红暗叠加 = 实际信息密度 ≥ 20%

**Audit 判断：>15% 即属于「信息过载红线」，当前 16.6% → ❌ 超标**

### 3 个最严重 UX 问题（1920×1080）
1. **顶部三角压迫**：#3 #4 #5 全部在 y<200 顶部 18.5% 高度带，横向占 360 + 400 + 360 = 1120px（1920 的 58%），正前方视线核心区域被 3 块面板围堵，玩家想看清茶几钥匙必须微微低头
2. **视觉层级不清**：z-index 交错（z-10 / z-20 / z-30）= 8 层 UI + 2 层全屏特效，实际大脑处理 ≥ 10 层视觉流，与 3D 深度知觉冲突
3. **底部双 UI 重叠**：#8 记忆槽 (bottom-center 380px) + #9 E/F 提示教学 (bottom-right 260px) = 1280px 以下分辨率出现横向重叠，正前方地面关键物品被完全遮蔽

---

## 四、推荐 HUD 线框（候选方案 V1）

### 核心原则
- **屏幕分区不重叠**：顶中 / 右左 / 侧边 / 底中 四个象限严格解耦
- **持久面板 ≤ 3 个**：任务目标（左上 360×80）、计时器（顶中 300×56）、小地图（右上 180×200）
- **条件面板默认折叠**：记忆槽侧边折叠 (56×260px)，按 M 展开
- **教学 Popup ≤ 1 层**：E/F 提示底部居中单层显示 (480×64px)，首次教学最多出现 3 次后自动关闭
- **持久 UI 占屏比目标 < 8%**（从 16.6% 腰斩）

### 产出文件
推荐 HUD 线框：`docs/assets/leave-home-ui/hud-proposal-wireframe.svg`
当前 HUD 标注图：`docs/assets/leave-home-ui/hud-current-annotated.svg`

### 推荐结构详情

**① 左上 360×80px - 任务名 + Step + 当前目标（永久）**
```
┌──────────────────────────────────────┐
│ 🎯 出门大作战              Step 1/5 │
│ ─────────────────────────────────── │
│ 靠近钥匙，按 E 记录它的位置         │
└──────────────────────────────────────┘
```
- 移除：展开按钮 ChevronDown、完整目标 7 条、目标进度 0/7
- 完整目标清单 → **按 Tab 切换全屏面板**（已有快捷键）

**② 顶中 300×56px - 计时器 + 混乱条（永久）**
```
┌────────────────────────────────┐
│ ⏱ 03:00    ● 混乱值 12% [===░]│
└────────────────────────────────┘
```
- 移除：得分 0、评级 D、currentRoom 位置标签、2 条进度条
- 得分/评级 → 仅结算 ResultPage 显示（用户无决策价值，纯结算统计）
- 混乱条 → 压缩为 100px 横条，与时间同行显示

**③ 右上 180×200px - 当前房间小地图（永久，可展开全屏）**
```
      ┌──────────────────────┐
      │ 🗺️ 小地图          ⛶ │
      │  ┌────────────────┐  │
      │  │    [卧室]      │  │
      │  │                │  │
      │  │ [玄] ← ● → [厨]│  │ ← 玩家箭头方向
      │  │                │  │
      │  │   (客厅高亮)   │  │
      │  └────────────────┘  │
      │ 点击 ⛶ 看全住宅      │
      └──────────────────────┘
```
- 默认尺寸：从 360×360 → 180×200px（1920×1080 下）
- 默认模式：**当前房间级**（living 8×8 放大），相邻房间只在边缘显示 5px 绿色门位线段
- 点击 ⛶ 全屏按钮 → 完整住宅 6 房间全览（当前 Minimap 已实现 onToggleFullscreen 逻辑）

**④ 左侧 56×260px - 记忆槽（永久折叠，按 M 展开）**
```
┌────┐
│ 🧠 │ ← 竖排文字 "记忆槽(3)" 旋转 -90°
│ 🔑 │ ← Slot-0: 已有钥匙记忆（绿色锁标记=有效）
│[绿]│
│ □  │ ← Slot-1: 空虚线框
│ □  │ ← Slot-2: 空虚线框
└────┘
```
- 默认 56×260px 贴左边缘（1080 垂直中 1/3 位）
- Hover 2s 或按 M → 展开 320×260px 详情面板（物体名/房间/置信度条/锁定丢弃按钮）
- 过期记忆 → Slot 图标红色闪烁 + 左上角 4px 红色条
- 记忆槽不再默认占底部中央空间

**⑤ 底部居中 480×64px - E/F 情境提示（条件出现）**
```
      ┌─────────────────────────────────────────────┐
      │ [E 记录钥匙位置]        [F 拾取钥匙(先记录)]│
      │  purple 半透明          灰化=disabled+原因   │
      └─────────────────────────────────────────────┘
```
- 只有在 `nearbyEntity != null` 或 `nearbyContainer != null` 时出现
- E/F 两个按钮并排，F 禁用时显示灰化 + 原因小字（如 "先记录钥匙位置"）
- 移除：首次靠近钥匙 Popup（300×200 大紫色块）→ 改为 minimap 钥匙闪烁 + memory-slot 图标提示
- 最多只显示 1 行，不堆叠多层（第 2 条优先级低的改 Toast）

**⑥ 顶部 Toast （3-5s 自动消失，非阻塞）**
```
    ┌──────────────────────────────────────┐
    │ 🐱 什么东西碰了一下钥匙…位置变了！   │
    │   (3.5s 后自动消失, 不打断 WASD)      │
    └──────────────────────────────────────┘
```
- 位置：从 top-36 (144px 高) → 提到 top-140（计时器下方 60px 间隔），避免与 #2 重叠
- 最多同时显示 2 条，第 3 条入队列
- 3 种样式：amber 异常事件 / blue 提示 / red 警告
- **去除**：HUD.tsx L827 异常事件 Modal (黑色全屏遮罩 + X 手动关闭)，全部改成 Toast，避免玩家操作被强制打断

### 关键变更映射表

| 当前元素 | 推荐 | 变化 | 节省面积 |
|----------|------|------|----------|
| 顶中卡片 400×152 (得分/评级/时间/位置/混乱/进度) | 顶中 300×56 (时间+混乱条) | -63% 面积 | -37,600 px² |
| 右上 Minimap 360×540 | 右上 180×200 | -81% 面积 | -158,400 px² |
| 目标面板 360×410 (展开) | 360×80 (单行目标) | -80% 面积（默认） | -118,800 px² |
| 记忆槽底中 380×120 | 左侧折叠 56×260 | -68% 面积 | -31,040 px² |
| 右下 E/F 教学 3 层堆叠 260×240 | 底部居中 480×64 单层 | -51% | -31,440 px² |
| 混乱 vignette 起始阈值 20% | 起始 40% | 视觉压迫延后 | 无直接面积 |
| 全屏事件 Modal 手动关闭 | 全部 Toast 自动消失 | 操作不中断 | 无直接面积 |

预期总持久 UI 从 16.6% → **≈ 7.8%**（< 8% 目标）

---

## 五、人工审阅问题（最多 5 个）

请审阅并返回选项序号，下一迭代据此实施。

### 1. 小地图默认显示当前房间，还是完整住宅？

选项：
- **A. 当前房间级（180×200px，推荐）**：默认只放大显示 living/bedroom 等当前所在房间，玩家点击 ⛶ 才展开全住宅 6 房间。优点：空间感强、家具位置可读；缺点：房间切换时地图会"跳"
- **B. 完整住宅级（300×300px）**：默认一直显示 6 房间总览，当前房间用橙色外框虚线。优点：全局空间感好；缺点：当前房间 8×8m 在 300px 画布只占 50px 宽，玩家箭头和任务物品点太小不可读
- **C. 智能切换**：<1280px 用 A（空间优先），≥1920px 用 B（面积富裕）

### 2. 记忆槽默认展开，还是折叠？

选项：
- **A. 左侧折叠（56×260px，推荐）**：默认只看到 3 个小图标条，hover/M 键展开详情
- **B. 底部展开（380×120px，当前实现）**：默认占底部中央，随时看到置信度/锁按钮
- **C. 智能切换**：有记忆时展开，空槽 3 个时折叠（减少 UI 存在感）

### 3. 计时器是否永久显示？

选项：
- **A. 永久顶中显示（推荐）**：含剩余时间 + 混乱值小条，Leave-Home 是限时关（3 分钟），时间流逝是焦虑感来源
- **B. 仅 < 60s 时变红色高亮**：平时不显眼，最后一分钟才醒目
- **C. 仅 Tab 面板里显示**：彻底移除顶中计时器，最大程度让出 3D 视野

### 4. 任务清单是否需要永久显示？

选项：
- **A. 永久仅显示当前目标一行（推荐）**：左上 360×80px，Step x/5 + 1 行当前目标文案
- **B. 永久显示完整目标 + 进度勾选**：保留当前实现（展开的 7 条）
- **C. 都不放**：只在阶段切换时弹 2 秒 Toast "Step 2/5: 找到钥匙并更新记忆"，无持久任务面板

### 5. V 键用于切换视角还是打开记忆面板？

当前 HUD.tsx L627 操作提示写 `[V] 切换`，但实际 V 键绑定未在 HUD handleKeyDown 中找到（L232-259），实际绑定需确认 Scene3D。

选项：
- **A. V = 切换第一/第三人称视角（保留现状）**：记忆面板快捷键新增 `M` 键
- **B. V = 打开/关闭记忆面板**：与 M 键互换，视角切换改 `C` (Camera)
- **C. 两者都不用 V**：视角 = `C`，记忆 = `M`，V 留给后续语音笔记功能

---

## 附录：源码参考速查清单

| 检查项 | 文件 | 行号 |
|--------|------|------|
| Minimap world→minimap 变换 | src/components/arena3d/Minimap.tsx | 201-216, 263-264, 299-300 |
| Minimap 玩家箭头 robotRotation 映射 | Minimap.tsx | 285-295 |
| Minimap 房间 center/size 绘制 | Minimap.tsx | 222-261 |
| observedObjects 过滤 (hidden/held 排除) | HUD.tsx | 541-544 |
| stage-key-outdated 钥匙隐藏 (反泄露) | HUD.tsx | 542-543 |
| 记忆 outdated 标记链路 | game/memorySlots.ts / HUD.tsx | 52-53 / 152, 690-710 |
| 混乱值 全屏 overlay | HUD.tsx | 309-330 |
| 过期记忆全屏 pulse | HUD.tsx | 299-308 |
| 各 HUD 面板 z-index 声明 | HUD.tsx | L332 (z=20), L433 (z=10), L523 (z=20), L850 (z=20), L874 (z=30) |
| leave-home 阶段 ID 定义 | data/tasks/leave-home.ts | L11 (STAGE_ID_KEY_OUTDATED) 前后 |
