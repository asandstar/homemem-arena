# ASSET SOURCE LICENSE MATRIX
> 文档编号：`ASSET-LICENSE-MATRIX·2026-08-03`
> 研究模式：RESEARCH MODE ONLY · NO DOWNLOAD · NO MODIFICATION

---

## FACT 许可矩阵说明

每行对应一个候选资产源或单个资产。分类标签：
- **FACT**：来自作者官方页面的明确声明，附有来源 URL
- **INFERENCE**：基于作者公开声明模式的合理推断
- **UNVERIFIED**：信息不足，需下一阶段验证

---

## 一、主家具资产包

| 编号 | Pack Name | Author | Official Page | License Page | Exact License | Attribution | Commercial Use | Modification Allowed | Public GitHub Redist | GLB | glTF | FBX | OBJ | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| P1 | Furniture Kit | Kenney (NL) | https://kenney.nl/assets/furniture-kit | https://creativecommons.org/publicdomain/zero/1.0/ | **CC0 1.0 Universal** | No | Yes | Yes | Yes | UNVERIFIED | UNVERIFIED | FACT·Yes | FACT·Yes | **PRIMARY CANDIDATE** |
| P2 | Building Kit | Kenney (NL) | https://kenney.nl/assets/building-kit | https://creativecommons.org/publicdomain/zero/1.0/ | **CC0 1.0 Universal** | No | Yes | Yes | Yes | UNVERIFIED | UNVERIFIED | FACT·Yes | FACT·Yes | STRUCTURE CANDIDATE |
| P3 | Prototype Kit | Kenney (NL) | https://kenney.nl/assets/prototype-kit | https://creativecommons.org/publicdomain/zero/1.0/ | **CC0 1.0 Universal** | No | Yes | Yes | Yes | UNVERIFIED | UNVERIFIED | FACT·Yes | FACT·Yes | STRUCTURE·WALL CANDIDATE |
| P4 | Food Kit | Kenney (NL) | https://kenney.nl/assets/food-kit | https://creativecommons.org/publicdomain/zero/1.0/ | **CC0 1.0 Universal** | No | Yes | Yes | Yes | UNVERIFIED | UNVERIFIED | FACT·Yes | FACT·Yes | PROPS·Dining SUPPLEMENTARY |
| P5 | Platformer Kit | Kenney (NL) | https://kenney.nl/assets/platformer-kit | https://creativecommons.org/publicdomain/zero/1.0/ | **CC0 1.0 Universal** | No | Yes | Yes | Yes | UNVERIFIED | UNVERIFIED | FACT·Yes | FACT·Yes | REJECTED·style mismatch |
| P6 | Ultimate House Interior Pack | Quaternius | UNVERIFIED·quaternius.com redirects | UNVERIFIED | UNVERIFIED·likely CC0 pattern | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED·needs source proof |
| P7 | Ultimate Furniture Pack | Quaternius | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED |
| P8 | Modular House Pack | Quaternius | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED |

### 格式验证状态说明（FACT vs UNVERIFIED）

FACT：
- Kenney 每个资产页 `Files` 字段明确标注数量（Furniture Kit = 140 files, Building Kit = 80 files, Prototype Kit = 145 files, Food Kit = 200 files）
- Kenney 所有资产页均链接至 `https://creativecommons.org/publicdomain/zero/1.0/`
- Kenney 历史公开下载包格式惯例：FBX + OBJ + 共享 PNG 纹理图集

UNVERIFIED（下一阶段下载包后验证）：
- 各包内是否包含 GLB / glTF
- 是否含 embedded 纹理
- 贴图 atlas 分辨率
- 精确 polygon level

---

## 二、补充资产来源（单件模型源）

| Source | Author Policy | Typical License | Commercial | Modify | Redistribute | GLB/glTF | Notes | Status |
|---|---|---|---|---|---|---|---|---|
| Poly Pizza (poly.pizza) | Per-model license | Mixed CC0 / CC BY | Varies per model | Varies | Varies | FACT·Yes (site advertises GLB ready) | 单件逐件核查许可证 | **SUPPLEMENTARY #1**（仅用于主包缺失的任务道具） |
| OpenGameArt.org | Per-submission | Mixed CC0 / CC BY / CC BY-SA | Varies | Varies | Varies | UNVERIFIED | 单件逐件核查，需记录原作者 | **SUPPLEMENTARY #2**（仅用于 Poly Pizza 未覆盖的道具） |
| itch.io Free 3D Furniture | Per-author | Varies widely | Varies | Varies | Varies | UNVERIFIED | 高噪音，仅作为最后手段 | **REJECTED** for primary sourcing（无法保证风格统一） |
| Sketchfab Free Downloads | Per-author | Varies (many Editorial Only) | Often No | Often No | Often No | Yes | 大量 Editorial Use Only / Personal Use Only | **REJECTED BY DEFAULT**（除非逐件书面授权确认） |
| 不明网盘 / 二次搬运站 | N/A | License Unclear | No | No | No | N/A | 禁止使用 | **REJECTED** |

---

## 三、关键任务道具许可策略（逐件要求）

RECOMMENDATION：所有关键任务道具（key/phone/umbrella/cat/cup/fork/tissue/laundry basket/shirt/socks/towel/nightstand drawer）必须满足：
1. 优先 CC0（无署名负担，比赛提交无归因链风险）
2. 次选 CC BY（可追溯作者 + 作品 + 来源 + 许可）
3. 禁止任何 Personal Use Only / Non-commercial Only / Editorial Only
4. 禁止模型与贴图 license 不一致
5. 禁止禁止修改（No Derivatives / No Modification）

FACT：Kenney CC0 资产天然满足所有比赛和 GitHub Pages 发布要求。

---

## 四、署名方案

### 方案 A：无署名（主包全部 CC0）— RECOMMENDATION
适用：Kenney Furniture Kit + Building Kit + Prototype Kit + Food Kit 全部 CC0
- 许可证页面：可放置一份简短说明：`3D 家具资产部分来自 Kenney (kenney.nl), 基于 CC0 1.0 发布。`
- 非强制但推荐礼貌性感谢

### 方案 B：署名页（补充来源含 CC BY 时）
需在 CREDITS.md 或 About 弹窗中逐项登记：
- 作者名 / 作品名 / 源 URL / 许可证 URL / 修改情况

---

## 五、拒绝清单（许可证安全原因）

| 拒绝原因 | 典型来源 | 严重性 |
|---|---|---|
| Personal Use Only | 大量 Sketchfab Free、某些论坛分享 | FATAL·比赛=公开商业展示 |
| Non-commercial Only | 部分 itch.io 作者默认设置 | HIGH·比赛归属灰色地带 |
| Editorial Use Only | 大量 Sketchfab 免费模型 | FATAL·非社论场景 |
| No Derivatives (ND) | 部分 CC BY-ND 作者 | HIGH·pivot/scale 修复属于 derivative |
| License Unclear / Missing | 二次搬运、网盘、搜索引擎缓存 | FATAL·侵权风险无法评估 |
| Redistribution Prohibited | 部分作者要求"仅限本人使用" | FATAL·GitHub = 公开分发 |

---

## 最终许可证结论（RECOMMENDATION）

**PRIMARY LICENSING STRATEGY：100% CC0 Kenney 基础 + 补充道具严格 CC0/CC BY 双轨验证**

- 主体家具：Kenney Furniture Kit (CC0)
- 结构模块：Kenney Building Kit + Prototype Kit walls (CC0)
- 餐饮小物：Kenney Food Kit (CC0)
- 补充任务道具（key/phone/umbrella/cat/laundry items）：Poly Pizza + OpenGameArt 逐件核验 CC0 优先，CC BY 兜底
- 署名：主包仅推荐性感谢，补充来源登记 CREDITS

此方案满足：比赛提交、GitHub Pages 公开分发、模型修改重导出、无许可证冲突链。
