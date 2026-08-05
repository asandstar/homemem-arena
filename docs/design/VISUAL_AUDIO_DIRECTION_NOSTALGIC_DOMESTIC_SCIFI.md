# VISUAL & AUDIO DIRECTION: NOSTALGIC DOMESTIC SCI-FI
> 文档编号：`VIZ-AUDIO-DIRECTION-NDS·2026-08-03`
> 中文定位：温暖低模家庭 × 怀旧家庭科幻（Stylized Low-Poly Warm Home × Nostalgic Domestic Sci-Fi）
> 研究模式：RESEARCH MODE ONLY · 不下载、不改代码

---

## §0. 核心问题回答（FACT / RECOMMENDATION）

本节最终回答 §四 要求的 10 个方向问题。

### 1. 家庭感由什么产生？（RECOMMENDATION）
- **密度而非豪华度**：客厅地毯+毛毯+抱枕+小边几+植物+书架零散书本；卧室床上枕头凌乱感；玄关散落鞋。Kenney 低模家具天然提供这些小配件组合。
- **生活痕迹而非展示间**：脏杯留在茶几上（L1 任务点）、钥匙不在原位（L2 记忆过期点）、洗衣篮未分类（L3 初始态）。
- **暖色温材质分层**：木色 × 3 阶 + 布艺 × 2 阶 + 金属 × 1 阶。不使用 PBR 真实贴图而用 PALETTE 定义离散色阶，视觉温暖且可预测。
- **可打开家具微交互**：抽屉拉出、柜门打开，是"这里真的住人"的低成本暗示。

### 2. 科幻感由什么产生？（RECOMMENDATION）
**不是金属家具，不是紫色霓虹，而是 MEM-07 机器人感知层。**
- **三记忆槽 HUD 悬浮视窗**：玩家视角上方三个小窗口，显示每个槽位的缩略场景快照。
- **E 保存记忆时的扫描线覆盖**：全屏 0.25s vertical scan + 轻微 screen-capture vignette。
- **记忆过期时的微故障视觉**：HUD 记忆槽先灰度化 → 边缘 glitch 3 次（每次 <0.1s，不使用全彩 chromatic aberration 以免俗套）。
- **小地图的"感知区域"虚线**：玩家视线 cone 之外的家具/容器在小地图上显示为灰色虚线轮廓，突出"机器人不是全知，只是感知"。
- **头顶 MEM-07 自指示器**：非常 subtle 的头部悬浮三角，不喧宾夺主。

### 3. 怀旧感由什么产生？（RECOMMENDATION）
- **时间锚点物件**：CRT 风格厚重电视（而非超薄 OLED）、带按键的功能手机（不是触屏光滑智能机）、CD 收纳盒、收音机造型。Kenney Furniture Kit 的 TV 模型更接近厚重风格，恰好符合。
- **低分辨率窗外光**：城市灯光是 8~16 个模糊发光点 + 缓慢漂移的低透明度云。不是 HD 城市天际线。
- **胶片感颗粒**：夜间状态叠加一层极淡的全屏 grain（强度 < 3%，只在视频帧回放可见，静止截图几乎不可察觉）。
- **琥珀室内灯的不均匀**：单个点光源在离灯 2m 处衰减至 20%，而不是全局均匀照明。灯下书桌亮、墙角暗——这就是记忆中"深夜写作业"的光。

### 4. 情绪高潮由什么产生？（RECOMMENDATION — 特指 L2）
L2 电影级转折路径：
```
CALM_HOME（L1/L2 共通常态）
  → 玩家在客厅茶几观察 key+phone+umbrella → E 保存 → MEMORY_ENCODE（金色扫描线 ×3）
  → 玩家走去 bedroom / entrance（LEAVE_ROOM：BGM 减一层，留 ambient）
  → 触发猫事件（Cat Disturbance：轻微 SFX + 猫影闪过走廊小地图）
  → 玩家返回客厅 → 看到茶几空 → 记忆槽 OUTDATED 故障闪烁（DISTURBANCE）
  → 玩家 E 重新确认 → HUD 槽位变问号（UNCERTAINTY）
  → 玩家根据证据（猫爪印/翻倒的东西/小地图猫位置）搜索 → 一层层叠音乐（EVIDENCE_SEARCH）
  → 找到床下/书架后钥匙 → 记忆更新瞬间：金色恢复光 2.5s（MEMORY_UPDATE · 情绪顶点）
  → COMPLETION_COOLDOWN：音乐回落，留一层安静 pad
```
高潮 = "安静铺垫 → 扰动抽掉音层 → 逐层搜索 → 找到瞬间金色恢复光"。**不是宏大 BGM 从头轰炸。**

### 5. 哪些视觉效果应该节制？（RECOMMENDATION）
- **禁止**：持续 chromatic aberration（RGB 分离）、全局 Bloom > 0.8、持续镜头晃动、紫色/蓝色霓虹满屋、景深 blur > 轻微、实时光影 > 2 个动态阴影投射器、体积雾、体积云、实时昼夜循环。
- **只在关键时刻 0.5~3s 短暂出现**：scanline、金色恢复光、outline 脉冲。
- **默认关闭**：SSAO（Web 移动端性能杀手）、SSR（反射）。

### 6. 如何避免变成俗套赛博朋克？（RECOMMENDATION）
- **调色板蓝 ≠ 霓虹蓝**：窗外夜间环境色 = HSL(220,25%,10%)，纯深蓝不紫不艳。
- **灯光主色 = 琥珀 2700K，非青色或紫色**：室内主灯 = HSL(30,80%,65%)。
- **没有"全息 UI"漂浮在空气中**：所有 HUD 是平面 2D overlay（或 react-three-fiber <Html> CSS 层）。
- **家具是真实家庭会有的东西**：没有反重力椅、没有全透明玻璃桌（除非户型本身有）。
- **科幻 UI 只出现在 MEM-07 感知流程**：保存/过期/更新记忆三个事件点；平常时间客厅就是普通客厅。

### 7. 如何避免低照度影响任务物体辨识？（RECOMMENDATION）
- **任务物体 fallback 强制 emissive outline（1px）**：在夜间状态（B/C/D）自动开启。白日/教学关（A）关闭。
- **任务物体高亮色经过 W3C AA 对比度检查**：
  - key = 金色（#E6B456 约 75% luminance）
  - phone = 银色带蓝边
  - umbrella = 亮红/亮橙伞顶 1px ring
  - cup = 白瓷 + 深蓝底碟 创造对比
- **深蓝环境光下，暗色任务物体 + 轮廓线方案默认**：任何 L ≥ 40 的物体都附加 1px 白色轮廓（夜间状态）。
- **照明下限**：即便是 Nostalgic Night Home，环境 ambient intensity 最低 = 0.15（而不是 0.02）。保证墙角不至于纯黑。

### 8. 如何保证 L1 教学关仍然明亮清晰？（RECOMMENDATION）
- **L1 强制使用 A. Neutral Daylight 灯光状态**，永不切换到 B/C/D。
- **L1 任务物体 outline 强制关闭**（不依赖轮廓线视觉语言，降低一次教学负担）。
- **L1 环境光强度 = 0.7**，主方向光强度 = 1.2，模拟朝北窗大白天。
- **L1 不叠加 grain / filmic / 深蓝夜**。所有视觉科技元素保留到 L2 首次引入。

### 9. 如何让 L2 产生电影级情绪转折？（RECOMMENDATION）
见 §4 情绪弧。额外技术措施：
- **阶段 1（初始观察）**：BGM 两层（pad + piano arp 慢）。
- **保存记忆后 LEAVE_ROOM**：piano arp mute，只剩 pad + 房间环境音（冰箱 hum/钟 tick）。
- **发现钥匙失踪**：pad 降 8vb 或 变 minor（如果是 scale 可转调则最好，否则低频滤波），加上一声低音 drone <200Hz。
- **搜索阶段**：每进入一个新房间/看一个容器，增加一个音乐 percussive 层（木琴/钟琴单音点缀，不形成节拍）。
- **找到钥匙一瞬间**：
  - 0.0~0.4s：金色屏幕填充 15% opacity
  - 0.4~1.2s：记忆槽 HUD 三次 pulse
  - 0.2~2.5s：BGM 回到大调 + pad 推高 + 一次性"记忆固定"SFX（chime × 3，间隔 0.4s）
  - 2.5~4.0s：缓慢回落
- **完成阶段 3 后 10 秒内**：所有音乐层除 ambient 外全部 fade out。

### 10. 如何让 L3 不因暗光进一步降低衣物辨识度？（RECOMMENDATION）
**L3 默认灯光 = B. Warm Interior Evening（非夜景）**，不是 Nostalgic Night Home。
- Laundry 房间光 = 顶灯冷白（4500K）+ 补充暖点光，类似公寓杂物间照明。
- **衣物颜色编码固定、永不换模型**（白/深/毛巾三色编码是 L3 幽灵移动后识别基础）。FALLBACK 保留，不得用外部模型替代。
- 篮子颜色编码同样固定（白/蓝/红）。
- 若用户在 L2 夜间玩 L3，则 L3 自动保持更亮（ambient intensity ≥ 0.5）。

---

## §一、候选视觉方向完整比较（§五 A/B/C/D）

| 维度 | A. 纯温暖低模家庭 | B. 温暖 × 怀旧家庭科幻 | C. 温馨微缩玩具屋 | D. 干净卡通机器人住宅 |
|---|---|---|---|---|
| 第一印象 | 宜家样板间 + 像素画 3D 版 | "记忆中的家"：夜晚台灯、窗边、猫 | 从上帝视角俯瞰的玩具小屋 | 机器人动画里的明亮实验室家 |
| MEM-07 设定匹配 | 中（家是真的，机器人是玩家，无科幻暗示） | **高（科幻=感知层 HUD，不抢家庭叙事）** | 低（玩具屋不真实，记忆机制失真） | 中（机器人环境自然但不像真实家庭） |
| E 保存记忆机制匹配 | 中（缺少视觉回报语言） | **高（扫描线+编码脉冲形成回报闭环）** | 低 | 中（实验室扫描 UI 过重） |
| L2 旧记忆失效匹配 | 低（失效没有情绪载体） | **高（故障闪烁→金色恢复=戏剧弧）** | 低 | 低（实验室 UI 无温情） |
| 任务物体辨识度 | 高（光照充足） | 中-高（+轮廓线策略补到高） | **极高（微缩物天然清晰）** | 极高（卡通色分离） |
| 家具真实性 | 高（Kenney 风格贴近宜家现实） | **高（同 A + 科幻层不破坏家具）** | 中（比例被故意夸张成玩具） | 中（几何过于简化） |
| 第一人称视角适配 | **高** | **高** | 低（第一人称进玩具屋比例违和） | 高 |
| Web 性能 | **高（纯色+低模）** | 中-高（叠加极轻后处理 ≤ 2 draw calls） | 高 | 高 |
| 灯光需求 | 简单 1 主光 + 1 环境 | 5 状态机（A/B/C/D/E）成本中等 | 柔和等方光（很简单） | 简单明亮方向光 |
| 后处理需求 | 极少 | **少（仅 occasional 事件脉冲）** | 中（浅景深+微色彩饱和，cost 高） | 极少 |
| 免费资产可得性 | **极高（Kenney Furniture Kit CC0 140 files）** | 极高（同 A + 自制 HUD） | 中（微缩家具包少，需大量自制比例夸张） | 高（卡通资产也多） |
| 当前 Fallback 可复用 | **100%** | **100%**（HUD 层叠加独立） | 50%（当前比例夸张不够） | 80%（颜色更饱和即可） |
| 迁移成本 | 低 | 低-中（灯光 5 状态 + HUD 事件层） | 高（摄像机 + 比例系统重写） | 中（色板调整） |
| 比赛截图效果 | 7/10 好看但普通 | **10/10（夜景+琥珀灯=立刻有情绪）** | 8/10 讨巧但不新鲜 | 6/10 容易撞款 |
| 比赛录屏效果 | 6/10 单调 | **9/10（记忆弧的声画变化有剪辑点）** | 7/10 | 5/10 |
| 长时间游玩视觉疲劳 | **低** | 中（D/E 状态切换偶尔但不疲劳） | 中（夸张比例易眼酸） | 低 |
| 综合评分 / 100 | 82 | **94** | 68 | 74 |

**最终唯一推荐：B · 温暖低模家庭 × 怀旧家庭科幻**（唯一同时满足"玩法匹配度高 + 资产可得性高 + 截图录屏有差异化 + 性能可承载"）。

---

## §二、怀旧家庭科幻灯光 5 状态机

### A. Neutral Daylight 中性白日（L1 教学、模型导入检查用）
| 项目 | 参数建议 |
|---|---|
| ambient | color #E8ECF4 (HSL 220 20 88), intensity 0.7 |
| main directional | from top-front, color #FFF4E0, intensity 1.2 |
| indoor warm point | optional: 1 per room at ceiling, color #FFE0B0, 0.2 intensity |
| 适用场景 | L1 clean-table 全流程；L2/L3 调试模式；白日 demo |
| 实现成本 | FACT·已存在类似配置 |
| Web 性能 | 0 额外风险 |

### B. Warm Interior Evening 温暖室内傍晚（L3 默认，L2 前段）
| 项目 | 参数建议 |
|---|---|
| ambient | color #C8CCD6 (cool low 220 10 80), intensity 0.35 |
| main fill | color #E8D0A0, intensity 0.4（窗侧入射） |
| warm ceiling point | 1-2 per room, color #FFBB55 (2700K), intensity 0.8, dist=5m |
| 对比策略 | 灯下物体 70% luminance，墙角 25% luminance |
| 实现成本 | LOW（增加 per-room ceiling point lights 配置层） |
| Web 性能 | LOW RISK（≤ 2 点光/房 = 10 点光总计；shadows 全关） |

### C. Nostalgic Night Home 怀旧夜家（L2 中后段主状态）
| 项目 | 参数建议 |
|---|---|
| ambient | color #0A1228 (HSL 220 60 10), intensity **0.18**（下界保证） |
| outdoor window emissive | 深蓝夜空平面 + 城市光点，独立 emissive 不参与光照 |
| indoor warm point | 1 per 有灯的房间，color #FFAA33 (琥珀 2200K), intensity 1.0, dist=4m |
| 轮廓线 | 所有任务物体 + 关键家具（sofa/bed/doorway）自动启用 1px outline |
| 实现成本 | MEDIUM（outline pass + 窗平面） |
| Web 性能 | MEDIUM RISK（outline 一个额外 pass；不超过总渲染 +20%） |

### D. Memory Disturbance 记忆扰动（钥匙失踪后 → 确认过期）
| 项目 | 参数建议 |
|---|---|
| 基于 B/C 的增量调整 | warm light intensity 减 30%；ambient 稍冷（230 vs 220） |
| 视觉微扰 | HUD 记忆槽 glitch（3 次，每次 0.08s）+ 低音 drone 一下 |
| 注意 | **不闪烁**、不 chromatic aberration、不 shake camera。只在 HUD 层和 sound 层扰动。 |
| 实现成本 | LOW |
| Web 性能 | NO RISK |

### E. Memory Recovery 记忆恢复瞬间（2.0~4.0s）
| 项目 | 参数建议 |
|---|---|
| 金色脉冲 | 全屏金色填充：0→18% opacity (0.4s) → 衰减至 0 (2.0s) |
| 记忆槽 HUD pulse | 3 次 scale 1→1.08，周期 0.25s |
| chime SFX | 3 声，间距 0.4s |
| BGM 一次 lift | 若有 pad 层，音量 0→+3dB(1s) → 回落到原值(2s) |
| 实现成本 | LOW-MEDIUM |
| Web 性能 | NO RISK（一次性事件，不常驻） |

### 禁止高成本灯光（FACT）
- 体积光 / 体积雾 / god rays / 全局实时光阴 / SSAO / SSR / SSR / motion blur / 景深 / heavy bloom
- 每房 > 2 实时点光源（阴影开）

---

## §三、动态音乐状态机（§十四 · 8 状态）

本节定义方向，不下素材。

| 状态 | 情绪 | 音乐层（最多 3 层同时） | 环境声 | 节拍 | 低频 | 旋律 | 进入条件 | 退出条件 | 最大持续 | 循环 | 一次性 SFX |
|---|---|---|---|---|---|---|---|---|---|---|---|
| CALM_HOME | 安全、日常、静 | Pad(C major) + 稀疏钢琴单音（≤ 1 / 4s） | 冰箱 hum / 远处交通（极低） | NO | ≤ 120Hz 仅 root | 仅点缀，不构成歌 | 进入任何关默认状态；COMPLETION_COOLDOWN 结束后回落 | 用户主动触发 Encoding 或 Leave Room | ∞ | YES pad 循环 / piano one-shots 随机 | NO |
| MEMORY_ENCODE | 专注、轻微仪式感 | Pad + 扫描/编码感 synth arp（慢速 8 分） | 房间 ambient 降 40% | 弱（arp 节奏） | root 保留 | 无 | 用户在 E 保存成功 | 编码动画结束 → 回 CALM_HOME 或进入 LEAVE_ROOM | 1.2s × 槽位数 | NO | YES·chime ×1 / E-key-click |
| LEAVE_ROOM | 轻微疏离、准备下一场景 | Pad 单一层（降 3dB），piano mute | 走廊 hum / 门轴 creak / 脚步（如已实现） | NO | 更弱 | 无 | 玩家通过 doorway 切换 room | 进入新房停留 1s → 回 CALM_HOME | 4s / per transition | NO | YES·door_click_sfx |
| DISTURBANCE | 不安、事情不对 | Pad 低频滤波 600Hz cutoff + 单 drone 110Hz | 正常 ambient 降 70%，偶尔猫 meow（L2 专属） | NO | drone 介入 | 无 | L2：返回客厅发现茶几空 + 记忆过期确认 | 玩家开始 E 重新确认/开始移动 | 10s 或玩家行动 | NO（drone 限 ≤ 8s） | YES·low_drone_once + cat_meow_once（visible/resume 后不重放） |
| UNCERTAINTY | 不确定、怀疑记忆 | Pad 变 minor / 或高切 2kHz + 保留 drone | ambient 几乎静音 | NO | 保留 drone | 无 | 玩家 E 重新确认失败 / HUD 显示问号 | 玩家第一次交互容器 | ∞（但单调，所以会自然触发搜索层） | YES·pad loop | NO |
| EVIDENCE_SEARCH | 主动搜索、逐步积累 | 叠加钟琴/木琴 per-container 点缀（单音不成旋律） | ambient 恢复 30%，脚步声可加 | NO | drone 缓慢淡出 | 单音随机选择池，每次 new note | 玩家第一次交互容器 | 找到任务物体或达到目标 | ∞ | NO（单音离散） | YES·note_per_container（per 容器唯一，无 resume 重放） |
| MEMORY_UPDATE | 情绪顶点、释放、释然 | Pad 回大调 + 音量 +3dB 再回落 | ambient 瞬间 boost 20% 再归一 | NO | 短暂 sub-bass 60Hz 一下（≤ 0.3s） | 3 连音 chime | 找到物体 + 更新记忆成功 | 动画结束（2.5~4s）后进入 COMPLETION_COOLDOWN | 4s | NO | YES·memory_fix_chime×3 |
| COMPLETION_COOLDOWN | 放松、完成、余韵 | Pad 极慢 fade out（8s 从 100%→10%） | 房间 ambient 恢复正常 | NO | NO | NO | 一阶段完成或整关完成 | 10s 后若仍在游戏内 → CALM_HOME | 10s 或下一阶段启动 | NO（fade 不循环） | NO |

### L2 必须形成的情绪弧（RECOMMENDATION）
CALM_HOME(30~90s 观察) → ENCODE(×3) → LEAVE_ROOM → (cat) DISTURBANCE → RETURN→EMPTY_TABLE→UNCERTAINTY → EVIDENCE_SEARCH → FOUND_KEY → MEMORY_UPDATE → COMPLETION_COOLDOWN

### 合法音频来源候选（RESEARCH，不下载）
优先来源 + 许可要求（FACT·Kenney 也提供音频 CC0，但未验证覆盖）：
| 来源 | License | Attribution | Commercial | Modification | Redistribution | Loop edit | Public GitHub use |
|---|---|---|---|---|---|---|---|
| Kenney Audio（若有 Music/SFX packs） | CC0（与 3D 同作者政策一致 UNVERIFIED 音乐包存在性） | No | Yes | Yes | Yes | Yes | Yes |
| Freesound.org（per-sound） | CC0 / CC BY（逐件验证） | Varies | Yes | Yes | Yes | Yes（license 允许） | Yes |
| OpenGameArt Audio | CC0 / CC BY / CC BY-SA | Varies | Varies | Varies | Varies | Yes（license 允许） | Yes |
| YouTube Audio Library（Free section） | 多为免费 YouTube 发布专用，GitHub Pages 比赛重新分发授权不明 | UNCLEAR | 仅限 YouTube 视频 | UNCLEAR | NO 比赛分发 | NO | **REJECTED BY DEFAULT（license 不适用于游戏二进制分发）** |

---

## §四、窗外世界方案（§十五）

RECOMMENDATION：**深蓝夜空平面 + 远处模糊城市光点贴片**（低成本 + 低干扰）

| 方案 | 性能成本 | 抢注意力风险 | 与主包一致 | Living | Bedroom | Entrance | L1 避免 | Laundry |
|---|---|---|---|---|---|---|---|---|
| 深蓝夜空平面（2D plane + emissive material） | 1 draw call · 极低 | 低 | 高（无细节不冲突） | ✅ | ✅ | ❌（入户门无窗） | L1 直接纯白天光平面 | 可选（小窗通走廊） |
| 远处模糊城市灯光（8~16 个 Billboard sprite，additive blending） | 8~16 个 draw call · 低 | 极低（模糊不聚焦） | 高（虚化所以不写实） | ✅ | ✅ | ❌ | L1 关闭 | 可选但 Laundry 主灯更亮 |
| 低分辨率 skybox 6-face | 6 draw calls · 中 | 中 | 中（贴图风格可能不匹配低模） | ✅ | ✅ | ❌ | L1 用 day skybox | 不推荐（杂物间不该有天空盒） |
| 缓慢云层贴片（2~3 个半透明大 quad，x-offset 每 30s 循环） | +2~3 draw calls · 低 | 低 | 高 | 可选叠加夜色 | 可选 | ❌ | L1 关闭 | ❌（Laundry 不该有云） |
| 极低速星点（point sprite 20 个） | +1 draw call · 低 | 极低 | 高 | 可选叠加 | 可选 | ❌ | L1 关闭 | ❌ |
| 窗户 emissive 平面（室内看窗户时的玻璃自发光） | per 窗户 +1 draw call · 低 | 中（亮边抢眼） | 高（Kenney Building Kit window 模块天然适合） | ✅ | ✅ | ❌ | L1 白玻璃 | 不推荐 |
| 实时可探索室外地图 / 完整城市 / 天气 / 昼夜循环 | 极高 | 极高抢主玩法 | 低 | ❌ 禁止 | ❌ 禁止 | ❌ 禁止 | ❌ 禁止 | ❌ 禁止 |

窗外策略不影响 collision，只在视觉层。L1 教学关全部切 Neutral Daylight 白日窗白。

---

## §五、核心 Gameplay 机制禁止因资产调整（FACT from §十九 第 14 条）

以下机制**不得因资产导入而删除或弱化**：
1. 三记忆槽系统（3 memory slots，不可改 1/2/4+）
2. E 键保存记忆（包括失败、覆盖、锁定规则）
3. F 键操作（开门/开抽屉/交互）
4. 记忆过期机制（时间 + 事件双重触发）
5. 重新搜索 → 重新确认 → 更新记忆闭环
6. L2 猫事件把钥匙从茶几移走（猫事件的存在性、隐蔽性、必要扰动性）
7. 任务失败恢复路径（过期不是死局，总可以重新找）
8. Session 行为记录（for research）
