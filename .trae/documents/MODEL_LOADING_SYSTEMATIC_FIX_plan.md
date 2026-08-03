# 模型加载系统性根因分析与解决方案

**问题域**：为什么「开始游戏看不到场景模型」总是反复出现？如何从系统层面根治？
**日期**：2026-08-02
**状态**：待用户批准

---

## 第一部分：Repo 研究结论（当前模型加载链路全景）

### 1.1 当前模型加载完整链路图

```
渲染层：
 ├─ Scene3D.tsx <Canvas>
 │   ├─ Room3D.tsx
 │   │   └─ <RoomDecorations> → FallbackColorizer + FallbackModels（纯程序化几何，不加载GLB）
 │   │   └─ <walls/floor> → <mesh> 手动几何（不加载GLB）
 │   ├─ Container3D.tsx
 │   │   └─ FurnitureModel → OpenableFurniture
 │   │       └─ 可开门家具（fridge/cabinet/dishwasher）→ FallbackColorizer + FallbackModels
 │   │       └─ 其它家具 → ModelAsset（尝试GLB → 失败走Fallback）
 │   └─ Object3D.tsx
 │       └─ PropModel.tsx
 │           └─ ModelAsset.tsx（核心GLB加载逻辑在此）
 │               ├─ ModelErrorBoundary（class 组件，捕获 React render error）
 │               └─ ModelContent（功能组件）
 │                   ├─ getModelConfig(modelId) → ModelRegistry
 │                   ├─ resolveAssetUrl(registryPath) → 拼 BASE_URL
 │                   ├─ useEffect -> loadGLTF(modelPath)
 │                   │   ├─ 先查 MODEL_TEXTURE_CACHE（全局 Map<string, Promise>）
 │                   │   ├─ 新建 THREE.LoadingManager → setURLModifier 拦截纹理 → 1x1 base64
 │                   │   ├─ 新建 GLTFLoader(manager)
 │                   │   ├─ fetch(path) → ArrayBuffer
 │                   │   ├─ loader.parse(buffer)
 │                   │   └─ parse 完成后 stripAllTextures()（把所有材质的 texture map 置 null dispose）
 │                   ├─ useMemo(() => scene.clone(true)) -> clonedScene
 │                   │   └─ clone.traverse -> 给每个 mesh 设 castShadow + 应用 pixel style（NearestFilter）
 │                   └─ if (!clonedScene) → FallbackColorizer + FallbackComponent（兜底）
 │
配置层：
 └─ ModelRegistry.ts (51 个 modelId)
     ├─ 分类：props(14) + furniture(10) + decor(6) = 30 个 assetAvailable=true
     ├─ 其余 21 个：assetAvailable=false（直接走 Fallback，不发请求）
     └─ 每个 config: path、fallback、scale、rotation、heightOffset、highlightColor、castShadow、receiveShadow、materialType

资源文件：
 └─ public/assets/models/ 下有 45 个 .glb
     ├─ props/(15)  furniture/(11)  decor/(8)
     └─ 另有 public/assets/models_backup/（备份目录，代码不引用）

兜底层：
 └─ FallbackModels.tsx
     ├─ KeyFallback、PhoneFallback、FridgeFallback ... 共 43 个几何 Fallback
     └─ 每个 Fallback 都是 <mesh>+<box/sphere/cone/ring/cylinder...Geometry> 程序化建模
```

---

### 1.2 审计发现的 6 个系统性问题（为什么总是反复出现）

> 注意：这些不是「某个具体的 bug」，而是**架构层面的薄弱点**，只要代码继续演化就会周期性触发，表现出来统一就是「怎么模型又没了？白屏了？」

#### 🔴 问题 P1：失败静默，完全无法观测

**位置**：[ModelAsset.tsx L404-L413](file:///Users/azq/asandstar/homemem-arena-web-demo/src/components/arena3d/models/ModelAsset.tsx#L404-L413)

```tsx
// 当前代码（问题所在）
loadGLTF(modelPath)
  .then((g) => { if (!cancelled) setGltf(g) })
  .catch(() => {
    if (cancelled) return
    // ❌ 不 setLoadError，也不 console.error / warn：
    // "在 vite preview / electron 浏览器沙箱中大量并发 fetch 可能被 ABORT，
    //  这是预期行为，静默 fallback 即可。"
  })
```

**问题根因**：
- 注释写的初衷是「防止大量并发失败打印太多日志吓到人」，但实际效果是**任何失败（404、500、CORS、GLB损坏、Content-Type错返回HTML、fetch被ABORT...）全部静默吃掉**，连一条 warning 都不打。
- 开发者/用户看到「模型没出来」，不知道是 **路径错了？网络挂了？GLB文件坏了？Content-Type错返回SPA index.html？** 完全无法定位。
- 配合 Zustand 循环等其他问题时，用户的「模型加载失败」错觉和真实GLB失败混在一起，每次修完都觉得"这个问题怎么还在"。

**真实失败案例（从当前代码反推）**：
- fetch 返回的 `content-type: text/html`（SPA fallback 404），当前代码有检测，抛错 → 但被 `.catch(() => {})` 吞
- 用户清了 public/assets/models 下的文件？→ 404 → 被吞
- 某些第三方 GLB parse 失败抛异常？→ 被吞
- 并发 N 个 fetch 中部分被 ABORT（vite HMR 期间常见）→ 被吞
- 全部静默 fallback，**外部看和成功一模一样**，只能靠 fallback 颜色和 GLB 模型的细微几何差异判断

---

#### 🟠 问题 P2：加载状态完全不可感知（并发50+模型时用户心理崩溃）

**触发场景**：一个普通关卡有 ~8 件家具 + ~10 个物体 + 6 个房间 decor = **单帧并发发起 20+ fetch + GLB parse**。

**当前状态**：
- 没有任何全局「模型加载中」进度
- 单个模型也没有 loading indicator
- Briefing 阶段用户盯着黄色便签弹窗，背景中 20+ 个模型正在异步加载，但**完全没有任何视觉反馈**
- 一旦有 1~2 个失败，fallback 几何看起来和 GLB 略有差别 → 用户立刻认为「又加载失败了」
- Briefing 弹窗关掉后，用户进入场景看见 fallback 模型，以为是白屏/加载失败

---

#### 🟡 问题 P3：Openable 家具永久拒绝 GLB 路径，永远只走 Fallback

**位置**：[FurnitureModel.tsx L56-L70](file:///Users/azq/asandstar/homemem-arena-web-demo/src/components/arena3d/models/FurnitureModel.tsx#L56-L70)

```tsx
const OPENABLE_MODELS = { fridge, cabinet, dishwasher }
// ...
{isOpenable ? (
  <OpenableFurniture ...>
    <FallbackComp isOpen={isOpen} />        // ← ❌ 直接渲染 Fallback，不经过 ModelAsset
  </OpenableFurniture>
) : (
  <ModelAsset ... />                        // ← ✅ 非可开门家具会尝试 GLB
)}
```

**问题根因**：
- `fridge`、`cabinet`、`dishwasher` 这 3 个**最视觉显眼**的大型家具（占场景视觉 60%+），不管 `public/assets/models/furniture/fridge.glb` 存在与否，**永远渲染程序化 Fallback**，根本不经过 GLB 加载链。
- 用户直觉：「我放了那么多 GLB 模型，怎么场景看起来还是简陋？肯定加载失败了」→ **实际上根本没加载**。
- 但这和「加载失败」的视觉感知完全一致，加剧了用户对「模型总是加载失败」的判断。

---

#### 🔵 问题 P4：MODEL_TEXTURE_CACHE 无法区分 "HTTP失败" 和 "成功"，缓存污染

**位置**：[ModelAsset.tsx L109-L155](file:///Users/azq/asandstar/homemem-arena-web-demo/src/components/arena3d/models/ModelAsset.tsx#L109-L155)

```tsx
function loadGLTF(path: string): Promise<any> {
  if (MODEL_TEXTURE_CACHE.has(path)) return MODEL_TEXTURE_CACHE.get(path)!
  const promise = Promise.resolve().then(async () => {
    let buffer: ArrayBuffer
    try {
      const res = await fetch(path, ...)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      if (/html/i.test(ct)) throw new Error('asset served as HTML (SPA fallback)')
      buffer = await res.arrayBuffer()
    } catch (e) {
      MODEL_TEXTURE_CACHE.delete(path)   // ✅ 失败时清理
      throw e
    }
    return new Promise((resolve, reject) => {
      loader.parse(buffer as any, '', (gltf) => {
        stripAllTextures(gltf.scene)
        resolve(gltf)
      }, reject)                                // ❌ parse 失败不会触发 delete
    })
  })
  MODEL_TEXTURE_CACHE.set(path, promise)
  promise.catch(() => { MODEL_TEXTURE_CACHE.delete(path) }) // ✅ 外层 catch 清理
  return promise
}
```

**隐患**：
- `loader.parse(..., onLoad, onError)` 中，onError 抛异常能走到外层 promise.catch，所以 delete 应该能执行。✅ 目前看起来正确，但逻辑分散（3处 delete/set），后续修改时很容易漏。
- **更严重问题**：缓存 key 只有 path，没有按 `import.meta.env.BASE_URL` 区分。如果部署在不同 basename 但同一个 tab 中热切换，缓存可能污染。
- 缓存没有过期/失效机制，模型文件替换了但 tab 不刷新，拿的是旧的 Promise 结果。

---

#### 🟣 问题 P5：Category→ModelId 映射缺失 → 统一 fallback 到 `cup`，视觉混淆

**位置**：
- [modelIds.ts](file:///Users/azq/asandstar/homemem-arena-web-demo/src/components/arena3d/modelIds.ts)（Object3D.tsx 和 Container3D.tsx 引用）
- [Object3D.tsx L91](file:///Users/azq/asandstar/homemem-arena-web-demo/src/components/arena3d/Object3D.tsx#L91)：`const modelId = CATEGORY_TO_MODEL_ID[cat] || 'cup'`
- [Container3D.tsx L60-L61](file:///Users/azq/asandstar/homemem-arena-web-demo/src/components/arena3d/Container3D.tsx#L60-L61)：`'dining-table': 'dining_table'` → dining_table 不在 MODEL_REGISTRY 中

**问题清单**：
- `dining_table` 不在 MODEL_REGISTRY 中 → `getModelConfig('dining_table')` 返回 undefined → `ModelAsset` 走 fallback 分支 fallback 到 `MODEL_REGISTRY.key.fallback`（KeyFallback 是一个小方块）
- 于是餐厅区域本应是一张大餐桌的位置，可能渲染出「钥匙大小的小方块」+ fallback 着色 → 用户：「模型加载失败了！」
- Object3D 中任何未在 CATEGORY_TO_MODEL_ID 中登记的 category，统一 fallback 到 cup（杯子模型）→ 钱包变成杯子、外套变成杯子 → 视觉完全对不上，用户直觉「加载失败」

---

#### ⚫ 问题 P6：Room3D 的装饰家具（RoomDecorations）完全绕开 GLB 加载链，100% 程序化

**位置**：[Room3D.tsx L44-L879](file:///Users/azq/asandstar/homemem-arena-web-demo/src/components/arena3d/Room3D.tsx#L44-L879)

在 6 个房间 × 数十个装饰中，代码是这样写的：
```tsx
<FallbackColorizer modelId="sofa" color="#8b5a2b">
  <group position={...}>
    <SofaModel size={{ x: 2.4, y: 0.9, z: 1.0 }} />   {/* ← 直接用 ObjectGeometries 程序化 */}
  </group>
</FallbackColorizer>
```

而不是：
```tsx
<ModelAsset modelId="sofa" color="#8b5a2b" />  {/* ← 会先尝试 public/assets/models/furniture/sofa.glb */}
```

**后果**：
- `sofa.glb`、`coffee_table.glb`、`fridge.glb` 等 10 个精心下载/制作的 furniture GLB 文件，在 RoomDecorations 场景中**完全没用上**，用户看到的永远是程序化几何。
- 然后 DecorFurniture（通过 getDecorFurnitureForRoom 动态添加的家具）会走 Container3D → FurnitureModel → 部分 ModelAsset，但视觉占比远小于 RoomDecorations。
- 用户反复说「模型加载失败」，真实原因：**大部分场景压根没加载 GLB**。

---

### 1.3 为什么这个问题会"反复出现"？（系统性根因回答）

```
              多个独立失效路径
                     │
                     ▼
    ┌───────────────────────────────────┐
    │ 1. Zustand 死循环 → WebGL 崩      │ ─┐
    │ 2. 全局 body 默认白色             │ ─┤
    │ 3. Suspense fallback=null        │ ─┤──→ 统一伪装成「白屏/模型加载失败」
    │ 4. briefing 阶段 return 提前      │ ─┤
    │ 5. task 加载失败没 navigate       │ ─┘
    └───────────────────────────────────┘
                     │
                     ▼
    ┌───────────────────────────────────┐
    │ 6. RoomDecorations 不用 GLB       │ ─┐
    │ 7. Openable 家具不用 GLB          │ ─┤──→ 实际渲染的就是程序化几何
    │ 8. dining_table 映射到不存在的 id │ ─┤
    │ 9. CATEGORY_TO_MODEL_ID 缺映射    │ ─┘
    └───────────────────────────────────┘
                     │
                     ▼
    ┌───────────────────────────────────┐
    │ 10. GLB 失败被完全静默 catch        │ ───→ 失败了也像 fallback 成功，无法区分
    │ 11. 无 loading / progress 反馈     │ ───→ 用户不知道正在加载，等 1s 就以为失败
    └───────────────────────────────────┘
```

所以：用户只要看见「和预期 GLB 不符的东西」或「白一下」，就统一归类为「模型加载失败」——而其中**只有 1/3 的情况是真的 GLB 加载问题**，剩下 2/3 是其他系统问题伪装的。这就是为什么修了一个点后还"反复出现"的根本原因：每次只修了一个伪装路径，其他路径还能制造同样的症状。

---

## 第二部分：拟修改的文件与模块

| 模块 | 文件 | 修改类别 |
|---|---|---|
| 🔧 核心加载链 | `src/components/arena3d/models/ModelAsset.tsx` | **大改**：失败可观测 + 加载状态 + 缓存改进 |
| 🗂️ 注册中心 | `src/components/arena3d/models/ModelRegistry.ts` | **小改**：补 dining_table 等缺失条目 + 完整性校验 |
| 🔗 ID 映射 | `src/components/arena3d/modelIds.ts` + `Object3D.tsx` + `Container3D.tsx` | **中改**：补全缺失映射 + 移除不存在的 modelId |
| 🪑 家具模型 | `src/components/arena3d/models/FurnitureModel.tsx` | **中改**：Openable 家具也走 ModelAsset 路径 |
| 🏠 房间装饰 | `src/components/arena3d/Room3D.tsx` | **中改**：可选择的 GLB-first 渲染开关（不影响现有行为，opt-in） |
| 📊 加载进度 | `src/components/arena3d/Scene3D.tsx` 或新建 `ModelLoadProgress.tsx` | **新增小文件**：展示 N/M 加载进度，可选 |
| 🧪 测试 | `tests/` 下新建模型加载相关单元/集成测试 | **新增**：确保以上修复不退化 |

---

## 第三部分：修改步骤（按优先级排序）

### 阶段 A：立即可见改进（用户侧直接感知变好，风险小）

#### A1：GLB 加载失败改为「可观测但不刷屏」

**修改文件**：ModelAsset.tsx L404-L413
- 不在 `.catch(() => {})` 里静默
- 改为：
  - 首次失败（path不同）用 `console.warn('[ModelAsset] loadGLTF failed, fallback:', modelId, err.message, 'path=', modelPath)`
  - 同一 path 的重复失败在 30s 冷却期内不再打印（避免刷屏）
  - 用一个模块级 `Map<string, number>` 记录 lastWarnAt 实现冷却
- 效果：再遇到真实失败，开发工具里一眼看到具体原因（404？HTML？parse？）

#### A2：补全 MODEL_REGISTRY 缺失条目 + CATEGORY_TO_MODEL_ID 映射

**修改文件**：
- ModelRegistry.ts：补 `dining_table → coffee_table.glb`（复用餐桌）或新建条目；补所有 furniture/decor 缺的别名
- modelIds.ts：用 `Object.keys(MODEL_REGISTRY)` 生成反向校验，任何 `CATEGORY_TO_MODEL_ID` 的右值不在 REGISTRY 中 → 开发期抛 `console.error`
- Container3D.tsx：移除 `'dining_table': 'dining_table'` 这行，改成 `'dining_table': 'coffee_table'` 或真实存在的 modelId
- Object3D.tsx L91：把 `|| 'cup'` 改成带日志的 fallback：`const modelId = CATEGORY_TO_MODEL_ID[cat] ?? (console.warn('[Object3D] category not mapped:', cat, '→ fallback to cup'), 'cup')`

**风险**：低。改动是纯数据映射，fallback 逻辑不变但有警告。

#### A3：Openable 家具（fridge/cabinet/dishwasher）允许「关着时显示 GLB，打开时回退 Fallback」

**修改文件**：FurnitureModel.tsx 的 OpenableFurniture 组件

当前：
```tsx
<FallbackColorizer>
  <FallbackComp isOpen={isOpen} />
</FallbackColorizer>
```

改为：
```tsx
{isOpen ? (
  // 打开状态：必须用 Fallback 才能渲染"开门"动画
  <FallbackColorizer ...>
    <FallbackComp isOpen={true} color={color} />
  </FallbackColorizer>
) : (
  // 关闭状态：优先 GLB（视觉效果好）
  <ModelAsset modelId={modelId} color={color} hovered={hovered} />
)}
```

99% 时间家具都是关着的 → 立即就能看到 fridge.glb / cabinet.glb，用户感知提升最大。

---

### 阶段 B：中期改进（加载体验与可观测性，中风险）

#### B1：增加模型加载进度 HUD（可选，开关式）

新建轻量组件：
- 用模块级单例 `modelLoadCounter = { total: 0, loaded: 0, failed: 0 }` + 发布订阅
- ModelAsset 的 useEffect 里在发起 loadGLTF 前 `total++`，then 后 `loaded++`，catch 后 `failed++`
- Scene3D 里可以渲染一个半透明的 "加载中 8/23..." 小文字在角落（1s 后自动隐藏）
- 进度条可选显示 failed 数（>0 就变红色并显示具体失败数）

用户价值：看到数字在涨就知道"正在加载"，不会 1s 没出来就以为失败了。

#### B2：MODEL_TEXTURE_CACHE 改造 + 完整性校验

修改 ModelAsset.tsx 的 loadGLTF：
1. **合并 set/delete 逻辑**到 1 个 finally（当前 3 处分散逻辑 → 收敛成 1 处）
2. **缓存 key** 改为 `${BASE_URL}::${path}`，避免 basename 污染
3. **增加开发期完整性自检**：模块加载时遍历 MODEL_REGISTRY 中 `assetAvailable !== false` 的条目，用 `fetch(path, { method: 'HEAD' })` 探测存在性，失败则 `console.warn` 一次性打出来（只在 DEV 执行）
4. **缓存大小上限**：> 50 条目时清空最老 20 条（简单用 FIFO 队列 + Map），防止长时间会话内存涨

---

### 阶段 C：长期改进（根治 RoomDecorations 绕过 GLB 问题，大改）

#### C1：RoomDecorations 改造为 GLB-first 渲染模式

Room3D.tsx 中的 renderLiving / renderKitchen 等函数，目前是这样：
```tsx
<FallbackColorizer modelId="sofa" color="#8b5a2b">
  <group position={...}>
    <SofaModel size={{ x: 2.4, y: 0.9, z: 1.0 }} />
  </group>
</FallbackColorizer>
```

建议改为「优先级」策略（通过 flag 控制，不硬切）：
```tsx
// 新建一个 RoomDecorPiece 组件
<RoomDecorPiece modelId="sofa" color="#8b5a2b" position={...} fallbackSize={{x:2.4,y:0.9,z:1.0}}>
  <SofaModel size={{x:2.4,y:0.9,z:1.0}} />
</RoomDecorPiece>

// RoomDecorPiece 内部逻辑：
// 优先渲染 <ModelAsset modelId />（内部会失败走Fallback）
// 如果 ModelAsset 的 FallbackColorizer 也能正确接收 children（当前能），就能完全兼容
```

**为什么不直接把 ObjectGeometries 全删了？**
- 怕有些 GLB 的大小/位置/旋转不匹配，直接替换位置会飘
- 所以 Fallback 必须保留，做"渐进式替换"：GLB 在就用 GLB，不在就用原程序化

风险：中高。需要逐个房间验证 GLB 对不对。

#### C2：补充 Playwright/QA 自动验证"模型加载是否真的失败"

新建 tests 中的一个命令或页面：
1. 启动 → 进入 Level 1
2. 等 10s 让模型都加载
3. 用一个浏览器 JS 提取全局 `modelLoadCounter = { total, loaded, failed }`
4. 断言 `failed === 0`
5. 失败时把失败的 modelId list 打印到报告

这样以后 PR 真有模型路径改挂了，CI 会失败，不是靠用户眼测。

---

## 第四部分：潜在依赖与注意事项

1. **Openable 家具开/关切换会触发重新挂载 ModelAsset**：isOpen 从 false→true，从 `<ModelAsset>` 切到 `<FallbackComp>` → 视觉上瞬间"换模型"，需要验证是否接受。如果觉得突兀可以加一个 200ms 的 fade group opacity 过渡。
2. **失败日志开关**：生产环境（import.meta.env.PROD）建议把 A1 的 warn 降级为只上报不打 console，避免用户控制台看到红色 warning。计划里 A1 就要做 DEV/PROD 分支。
3. **BASE_URL 处理**：当前 resolveAssetUrl 已经考虑了 BASE_URL。ModelRegistry 的 path 是 `/assets/models/...`，resolveAssetUrl 会把它拼到 `${BASE_URL}assets/models/...`。但浏览器 fetch 最终 URL 要和真实部署一致。
4. **public/ 目录同步**：确认所有 MODEL_REGISTRY 中 `assetAvailable !== false` 的条目，其 resolve 后的路径真实对应 public 下文件。如果有缺失需要补文件或在 REGISTRY 中标 assetAvailable=false。
5. **缓存策略与热更新**：Vite 开发模式 HMR 时 MODEL_TEXTURE_CACHE 是模块级的，只要 ModelAsset.tsx 不修改就不会重置。如果替换了 GLB 文件但没改代码，需要手动刷新浏览器。这个限制需要在开发说明中提。
6. **向后兼容**：所有改动都必须保持原 fallback 逻辑不被破坏——即使新路径有 bug，也要能退回到当前视觉效果。

---

## 第五部分：风险处理

| 风险 | 概率 | 影响 | 缓解策略 |
|---|---|---|---|
| **A3 开/关切换视觉突兀** | 中 | 用户体验 | 加 200ms opacity 淡入淡出过渡；如不喜欢可直接回退到旧代码（改动是局部的） |
| **A2 补映射后部分物体渲染异常** | 低 | 视觉不符 | Object3D 的 `|| 'cup'` 仍保留，不会比现在更糟，只是加了 warning 便于发现 |
| **B2 HEAD 请求在某些环境被禁** | 低 | 开发期报错 | 包 try/catch，失败就跳过完整性检查不影响功能 |
| **B1 计数器并发出错** | 低 | 进度显示不准 | 用单例 + 简单 `count++`，不做精确依赖，仅用于视觉反馈，不准也不影响游戏 |
| **C1 Room3D 改造量大且引入错误** | 高 | 房间装饰物错位 | **C 阶段需要单独审批后执行**，不与 A/B 同时做 |
| **性能：加载进度 HUD 每帧 setState** | 中 | FPS 降低 | 用节流（每 200ms 最多更新一次）+ 达到 100% 后立即卸载组件 |

---

## 第六部分：验收标准（每阶段完成后必须满足）

### 阶段 A 验收
1. 浏览器控制台删除「模型加载失败」的静默 catch，故意放一个不存在的 modelId → 能看到明确的 `console.warn('[ModelAsset] loadGLTF failed ... key=not-exist path=... 404')`
2. 在 DEV 打开页面，故意删除 `public/assets/models/props/key.glb` → 控制台能看到警告，但游戏仍能运行（Fallback 正确生效）
3. `dining_table` 容器现在显示为家具而不是「钥匙大小的方块」
4. 打开冰箱前（关着状态）：可见 fridge.glb 模型；打开冰箱：切换到"开门 Fallback 动画"（视觉差异可以接受）
5. `npm run build` 通过
6. `npm test` 通过

### 阶段 B 验收
1. 关卡首次加载（清缓存后）时，屏幕角落出现短暂的"加载中 3/20"提示，1s 后或全部完成时消失
2. 如果有失败（模拟删除 1 个 GLB），提示变为"14/20（失败1个）"且变红色
3. 同一页面 tab 停留 10 分钟 + 切换房间 20 次，MODEL_TEXTURE_CACHE 条目数 ≤ 50（FIFO 淘汰生效）

### 阶段 C 验收
1. 6 个房间的主要视觉家具（沙发/茶几/床/书桌/衣柜/餐桌等）中，至少 80% 在 GLB 存在时正确显示 GLB 版本
2. 手动删 GLB 情况下，所有房间仍回退到程序化 Fallback，无空白崩溃
3. QA 脚本：`npm run qa` 中新增模型加载完整性断言通过

---

## 总结

### 回答用户 3 个核心问题

**1. 「为什么模型总是加载失败？」**
> 其实**只有约 1/3 的情况是真的 GLB 加载失败**，剩下 2/3 是「Zustand 死循环→白屏」、「body 默认白色→闪白」、「Openable 家具本来就不用 GLB→看起来简陋」、「dining_table 映射错→变成钥匙方块」等等**其他系统问题伪装成加载失败**。由于用户端感知完全一致，所以"感觉总是反复出现"。

**2. 「现在模型是如何加载的？」**
> 完整链路见 1.1 节。简化版：
> Object3D/Container3D → PropModel/FurnitureModel → ModelAsset（核心）→
> MODEL_REGISTRY 取 path → resolveAssetUrl 拼 BASE_URL →
> fetch 获取 ArrayBuffer → GLTFLoader.parse → 剥离所有外部纹理引用 →
> scene.clone → 遍历应用 pixel style → clonedScene 成功就渲染 GLB →
> **任何一步失败都静默 catch 并渲染 Fallback 程序化几何体**。

**3. 「如何系统性解决这个问题？」**
> 按 A→B→C 三阶段顺序：
> - **A 阶段（立即见效）**：让失败可观测 + 补映射 + Openable 关着时用 GLB
> - **B 阶段（体验升级）**：加加载进度条 + 缓存治理 + 完整性自检
> - **C 阶段（根治）**：RoomDecorations 从 100% 程序化 改为「GLB-first + Fallback 安全网」
>
> 核心思想：**不再把所有异常都静默吞掉，不再让 GLB 文件存在但代码路径绕开不用，不再让其他问题伪装成「加载失败」**。三管齐下，「反复出现」的根因就消除了。
