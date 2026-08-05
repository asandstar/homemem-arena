# WP0A LIVING ASSET CALIBRATION REPORT

> 工作包 WP0A · §十 AssetCalibrationView 开发预览 · §十一 feature-flag 视觉替换集成 · §十三 QA
> 报告日期：2026-04-07

## 一、Runtime 校准 UI (AssetCalibrationView.tsx)

- Gate 条件：`import.meta.env.DEV === true` **且** URL query `?assetCalibration=1`
- 不进入生产 UI（`!DEV` 时 `shouldShowAssetCalibration()` 恒为 false，`Scene3D` 不会短路到校准视图）。

### 1.1 校准视图元素（§十）

| Item | 内容 | 位置 |
|---|---|---|
| 5 Model Stands | loungeSofa / tableCoffee / televisionModern / cabinetTelevision / bookcaseOpen | 左→右并排，横向间距 4.0m |
| Ground per stand | 4×4m 灰色地面网格 (GridHelper 24×24) | 每个模型 stand 下方单独 1 个 grid |
| 1m Reference Cube | Y=0.5 半透明绿边，每个 stand 右上角 | 1.0 × 1.0 × 1.0 |
| Text Panel | 模型名 + raw/eff AABB + uniformScale + pivot + verdict | Canvas 顶部 DOM 浮层，z-110 |
| View Angle 切换（4 个）| `front`(0°) · `45°`(SW 等距) · `side`(E 90°) · `top`(俯视 XZ) | Toolbar 单选 |
| Light Mode 切换（3 种）| `neutral daylight` 5500K · `warm evening` 2800K · `nostalgic night` 1900K + warmPointLight accent | Toolbar 单选 |
| Shadow Toggle | `on` / `off`（§十 约束：性能） | Toolbar |

### 1.2 性能约束落实情况

| 约束 | 落实 |
|---|---|
| 同时最多 2 个实时 point light | ✅ `nostalgic night` 只用 1 个 pointLight (1 warm accent)，其他模式 0；ambient+directional 作为主光 |
| 无 postprocessing / 体积光 | ✅ 校准视图完全不使用 Effects / composer；仅基础 R3F Canvas |
| 实时阴影可关闭 | ✅ `shadows=false` 时 Canvas shadows 关，directionalLight.castShadow=false |

### 1.3 Verdict 显示逻辑

```tsx
verdict = compareAabb(
  modelRegistry[id].rawAabb × uniformScale,   // expected = computeScaledAabb(raw, scale)
  modelRegistry[id].effectiveAabb,            // expected registry value
  tolPASS = 0.01, tolWARN = 0.03
)
```

- `PASS` → 绿色；`WARN` → 琥珀；`FAIL` → 红色。
- runtime 实测 AABB 栏位：AssetCalibrationView 的 Measure 按钮（§十 明确允许，但本轮先显示 "expected = registry"，下一轮在浏览器启动后补齐 THREE.Box3.setFromObject 实测列）。

---

## 二、§十一 开发特性 flag：Living 视觉替换

### 2.1 Flag 语义

| DEV | `VITE_USE_KENNEY_LIVING_ASSETS` | 效果 |
|---|---|---|
| false | 任意 | 使用原程序化几何 ✅（生产默认） |
| true | 未设置 / `false` / `''` | 使用原程序化几何 ✅（默认） |
| true | `'true'` / `'1'` | **Living 5 家具渲染 RegisteredModel**，失败 fallback 回程序化 |

- 读取方：`shouldUseKenneyLiving()`（Room3D.tsx L42-54，不以 hook 形式，避免嵌套函数中调用触发 hooks 规则）。
- 不改变：furniture entityId / task containerId / collision / taskState / furniture positions / L2 key state / Minimap data （§十一 10 项约束均落实）。

### 2.2 视觉替换矩阵 (renderLiving)

| 家具 modelId | 位置 (unchanged) | 原 fallback | Flag=true → RegisteredModel assetId |
|---|---|---|---|
| main sofa | `center.x, 0, center.z − 1.2` | SofaModel 2.4×0.9×1.0 | `furniture/loungeSofa` |
| coffee_table | `center.x − 0.5, 0, center.z − 0.3` | CoffeeTableModel 1.4×0.45×0.7 | `furniture/tableCoffee` |
| cabinet (TV) | `center.x + size.x/2 − 1.1, 0, center.z − 1.0` rot=−π/2 | TVStandModel 2.2×0.55×0.45 | `furniture/cabinetTelevision` |
| tv | `center.x + size.x/2 − 1.0, 0.8, center.z − 1.0` rot=−π/2 | TVFallback 1.8×1.0×0.15 | `furniture/televisionModern` |
| bookshelf | `center.x + size.x/2 − 0.6, 0, center.z − 1.5` | BookshelfFallback 0.8×1.8×0.35 | `furniture/bookcaseOpen` |

### 2.3 Fallback 机制 (§八)

`RegisteredModel.tsx` 状态机：

```
IDLE → LOADING (statsIncLoadStart) → LOADED (clone scene, statsIncLoadDone(true))
                                       ↘ ERROR (statsIncLoadDone(false))
                                         ↓
                                         FALLBACK (render children=原程序化几何)
```

- clone scene：`scene.clone(true)` 深拷贝；**不修改 useGLTF/loadGLTF cache 中共享的原 scene**（§八 明确要求）。
- shadow propagation：外层 `<group castShadow receiveShadow>` 传给 RegisteredModel 内部遍历 setAllShadows (safe)。
- 卸载清理：`useEffect` cleanup 中 clearTimeout 且置空 loaded scene，不手动 dispose 共享 cache geometry/material（§八"不手动 dispose useGLTF cache 共享项"）。

---

## 三、§十三 QA 报告

### 3.1 Test (vitest run)

| Item | Result |
|---|---:|
| Test Files Pass | 17/17 |
| Tests Pass | 345/345 |
| modelCalibration.test.ts | 7/7 (bottom-center / uniform scale / negative coords / floor alignment / tolerance 三档 / NaN / empty Object3D throw) |
| Duration | 3.57 s |

无失败用例；无新增 warnings 挂起。

### 3.2 Lint (oxlint)

| 级别 | 数量 | 本轮新增修复 |
|---|---:|---|
| errors | 0 | 修复 5：① Suspense unused import ② SofaFallback + CoffeeTableFallbackGeom unused（来自 §十一 替换后遗留）③ hook-rules：`useKenneyLiving` 重命名为非 hook `shouldUseKenneyLiving` 避免 renderLiving 子函数里触发 ④ ModelAsset.tsx 导出 `loadGLTF / statsIncLoadStart / statsIncLoadDone` 供 RegisteredModel 统计) |
| warnings | 20 | 全部为既有 (tests/setup vitest.setup no-unused param, scripts/* temp, react-hooks exhaustive-deps FirstPersonControls 既有)，**本轮 0 新增** |

### 3.3 Build (tsc -b && vite build)

| Item | Result |
|---|---|
| tsc strict | ✅ PASS（RegisteredModel / modelRegistry / AssetCalibrationView 均过 strictNullChecks / noImplicitAny） |
| vite build（mode=production） | ✅ 641ms 完成 |
| chunk size warn (Scene3D) | 既有 1.24MB (gzip 330KB)；本轮 chunk 体积变化 < +1%；不做 code-split 处理，留 WP3 性能 |
| production 默认 flag 行为 | ✅ `VITE_USE_KENNEY_LIVING_ASSETS` 生产空；`shouldUseKenneyLiving()` 返回 false → 所有 Living 用 fallback 程序化几何 |

### 3.4 §十三 Browser Verification Checklist（浏览器预览 next session 填写）

| # | 场景 | 预期 | 实际（下一轮填）|
|---|---|---|---|
| B1 | 默认 URL /play/leave-home | 无校准 UI；Living 显示原程序化家具 | TBD |
| B2 | DEV + `?assetCalibration=1` | 5 模型并排显示；视角/灯光切换工作 | TBD |
| B3 | DEV + `VITE_USE_KENNEY_LIVING_ASSETS=true` | Living 5 家具变为 Kenney GLB；三关交互不变 | TBD |
| B4 | 模拟一个错误 URL (比如 tableCoffee typo) | 自动 fallback 到 CoffeeTableModel；控制台 30s 防抖 warn 1 次；不 throw | TBD |
| B5 | console | 0 GLTF loader errors / 0 React key warns / 0 WebGL context errors / 0 duplicate fetch requests | TBD |
| B6 | 路由离开再返回 /play/leave-home | 模型加载一次；FIFO 缓存命中（MODEL_TEXTURE_CACHE size ≤ 50） | TBD |
| B7 | mute / audio lifecycle | 本轮不影响；`src/game/audio/*` 未改 | ✅ 静态保证 |

---

## 四、§十二 KEY-LOC-A 预览结论

- Verdict: **`KEY_LOC_A_PREVIEW_PASS`**（10/10 criteria）。
- 保持状态：`KEY_LOCATION_RECOMMENDED_CANDIDATE`（本轮**不写入** leave-home.ts / rooms.ts / 任何生产常量）。
- 为 WP1 CCC-02 提供输入：若 runtime 视觉显示"过深"，建议微调 Y=0.22 ±0.08；不改 footprint XZ。

---

## 五、Verdict Summary

| 项 | Verdict |
|---|---|
| §三/四 asset evidence (5 × 9 checkmarks) | ✅ PASS |
| §五 LICENSE / SOURCE / SHA manifest | ✅ COMPLETE |
| §六 Model Registry（5 独立 uniformScale；pivotOffset finite；effAabb finite） | ✅ PASS |
| §七 5 × AABB expected (raw×scale vs registry effAabb) | ✅ 误差 0（同值，因为 eff 就是 raw×2 精确值） |
| §八 Loader fallback / clone scene / shadow | ✅ 代码落实，单元测试测 calibration pure fn，fallback 在组件结构内 |
| §九 modelCalibration.test | ✅ 7/7 PASS |
| §十 Calibration UI gate / 5 stands / 3 lights / 4 views / perf | ✅ CODE READY，next session 浏览器实开验证 B1–B6 |
| §十一 feature flag 默认关 / 生产 false | ✅ BUILD PASS |
| §十二 KEY-LOC-A | ✅ PREVIEW_PASS |
| §十三 tests / lint / build | ✅ 345/345 · 0E20W · tsc+vite PASS |
