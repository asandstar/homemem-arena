# 下载 Low-Poly GLB 模型资产计划

## 摘要
为 Echo House: Memory Butler 游戏从程序化几何体 fallback 模型升级到真实的低多边形 GLB 模型资产。本计划涵盖资产来源调研、网络/工具环境检查、分批下载策略、路径映射更新、构建验证和运行测试。

## 当前状态分析

### 已有基础（无需改动）
- `ModelRegistry.ts` — 29 个模型配置完整（path / fallback / scale / rotation / heightOffset / highlightColor / castShadow / receiveShadow / materialType）
- `ModelAsset.tsx` — GLB 加载 + ErrorBoundary 降级 + 自动阴影/材质 + 视觉状态（hover/selected/interactable/target）
- `PropModel.tsx` / `FurnitureModel.tsx` — 包装层，已集成 ModelAsset
- `FallbackModels.tsx` — 29 个精细化程序化 fallback（每个 5-12 几何体）
- `Object3D.tsx` / `Container3D.tsx` — 已重构为使用 PropModel / FurnitureModel，category→modelId 映射完整
- 房间装饰和光照系统已完成

### 待解决问题
1. **路径不匹配**：ModelRegistry 中路径为 `/models/props/key.glb`，但用户要求保存到 `public/assets/models/props/key.glb`。需要统一为 `/assets/models/...`。
2. **无真实 GLB 文件**：`public/assets/models/` 下只有 `.gitkeep`，所有 29 个模型目前都降级到 fallback。
3. **无资产清单和署名记录**：缺少 ASSET_MANIFEST.json 和 ASSET_CREDITS.md。

## 资产来源调研结果

基于对 CC0 / 自由授权 low-poly 资产生态的了解，以下是可下载的候选来源：

### 首选来源 1：Kenney Assets (CC0)
- **URL**: https://kenney.nl/assets
- **License**: CC0 (Public Domain) — 无需署名，可商用
- **格式**: 提供 .fbx / .obj / .blend，需要自行转换为 .glb
- **特点**: 游戏开发专用 low-poly 资产，风格统一，大量家居/家具/道具包
- **相关资产包**:
  - `furniture-kit` — 沙发、床、桌子、椅子、柜子等
  - `kitchen-kit` — 冰箱、水槽、橱柜、餐具等
  - `home-interior` — 室内装饰品、灯具、植物等
  - `prototyping-kit` — 通用 low-poly 基础形状
- **文件大小**: 每个模型通常 < 100KB（纯几何体，无贴图或简单颜色贴图）
- **是否需要署名**: 否（CC0）
- **备注**: 官方提供 .glb 直接下载的选项较少，多数需要格式转换

### 首选来源 2：Quaternius (CC0)
- **URL**: https://quaternius.com/
- **License**: CC0 (Public Domain) — 无需署名，可商用
- **格式**: 提供 .glb 直接下载
- **特点**: 专做 low-poly 模型，有明确的 "Low Poly" 分类
- **相关资产包**:
  - `Low Poly Furniture Pack` — 家具 low-poly 包
  - `Low Poly Props Pack` — 道具 low-poly 包
  - `Low Poly Room Pack` — 房间场景包
- **文件大小**: 通常 20-200KB 每个模型
- **是否需要署名**: 否（CC0）
- **备注**: 可以直接下载 .glb，是最理想的来源

### 备选来源 3：Khronos Group glTF Sample Models (Apache 2.0)
- **URL**: https://github.com/KhronosGroup/glTF-Sample-Models
- **License**: Apache 2.0 / CC0 混合
- **格式**: .glb / .gltf
- **特点**: 官方 glTF 示例模型，质量高但风格偏写实/技术展示
- **备注**: 不太适合 cozy low-poly 风格，作为备选

### 备选来源 4：Google Poly Archive (CC-BY / 混合)
- **URL**: https://poly.pizza/ (Poly 的归档站点)
- **License**: 混合（需逐条检查）
- **备注**: Google Poly 已关闭，但归档站点可能保存了部分模型。授权混杂，不建议优先使用

### 策略决定
**建议优先从 Quaternius 下载整套 low-poly 资产包**，因为：
1. 提供 .glb 格式，无需转换
2. CC0 授权，完全自由
3. low-poly 风格统一
4. 包含家具和道具，覆盖面广

**如果 Quaternius 缺少某些特定模型**，再从 Kenney 补充。Kenney 的资产需要先下载 .fbx/.obj，然后使用 Blender 或在线转换工具转为 .glb。

## 实施步骤

### Phase A：环境检查（执行前验证）

**Step A1 — 检查网络连通性**
```bash
curl -sI https://quaternius.com/ | head -5
curl -sI https://kenney.nl/ | head -5
```

**Step A2 — 检查本地工具**
```bash
which curl && curl --version | head -1
which wget && wget --version | head -1
which unzip && unzip -v | head -1
which node && node --version
```

**Step A3 — 检查 Vite 静态资源路径**
确认 `public/assets/models/` 下的文件在运行时可通过 `/assets/models/...` 访问。

**Step A4 — 如果 curl/wget 不可用**
备选方案：使用 Node.js 的 `fetch` + `fs` 写下载脚本，或安装工具。

---

### Phase B：资产下载（按优先级分批）

#### P0 — 第一关核心资产（10 个）
| 目标文件名 | 来源建议 | Quaternius 候选 | Kenney 候选 |
|-----------|---------|----------------|------------|
| key.glb | Quaternius/Kenney | 从 Props Pack 找 key | 从 prototyping-kit 组合 |
| phone.glb | Quaternius | 从 Props Pack 找 phone | - |
| umbrella.glb | Quaternius | 从 Props Pack 找 umbrella | - |
| entrance_tray.glb | Quaternius/Kenney | 从 Furniture Pack 找 tray | 从 furniture-kit 找 tray |
| sofa.glb | Quaternius | 从 Furniture Pack 找 sofa/couch | 从 furniture-kit 找 sofa |
| desk.glb | Quaternius | 从 Furniture Pack 找 desk | 从 furniture-kit 找 desk |
| bed.glb | Quaternius | 从 Furniture Pack 找 bed | 从 furniture-kit 找 bed |
| cabinet.glb | Quaternius | 从 Furniture Pack 找 cabinet | 从 furniture-kit 找 cabinet |
| rug.glb | Quaternius | 从 Home Interior 找 rug | 从 home-interior 找 rug |
| door.glb | Quaternius/Kenney | 从 Room Pack 找 door | 从 furniture-kit 找 door |

#### P1 — 通用家具（5 个）
| 目标文件名 | 来源建议 |
|-----------|---------|
| fridge.glb | Quaternius Furniture Pack / Kenney kitchen-kit |
| sink.glb | Quaternius Furniture Pack / Kenney kitchen-kit |
| dishwasher.glb | Quaternius Furniture Pack / Kenney kitchen-kit |
| coffee_table.glb | Quaternius Furniture Pack / Kenney furniture-kit |
| laundry_basket.glb | Quaternius Props Pack / Kenney home-interior |

#### P2 — 其他关卡物体（10 个）
| 目标文件名 | 来源建议 |
|-----------|---------|
| milk_carton.glb | Quaternius Props Pack / Kenney kitchen-kit |
| cereal_box.glb | Quaternius Props Pack |
| cup.glb | Quaternius Props Pack / Kenney kitchen-kit |
| bowl.glb | Quaternius Props Pack / Kenney kitchen-kit |
| plate.glb | Quaternius Props Pack / Kenney kitchen-kit |
| remote.glb | Quaternius Props Pack |
| cloth_white.glb | Quaternius Props Pack / 自行简化 |
| cloth_dark.glb | Quaternius Props Pack / 自行简化 |
| towel.glb | Quaternius Props Pack / Kenney home-interior |
| trash.glb | Quaternius Props Pack |

#### P3 — 装饰（5 个）
| 目标文件名 | 来源建议 |
|-----------|---------|
| lamp.glb | Quaternius Home Interior / Kenney home-interior |
| plant.glb | Quaternius Home Interior / Kenney home-interior |
| pillow.glb | Quaternius Furniture Pack |
| shoes.glb | Quaternius Props Pack |
| hook.glb | Quaternius Props Pack / Kenney furniture-kit |

**下载执行方式**:
1. 从 Quaternius 下载完整的 low-poly asset packs（zip 格式）
2. 解压后从包中挑选最接近的 .glb 模型
3. 重命名为 snake_case 格式
4. 移动到对应的 `public/assets/models/{category}/` 目录
5. 如果某模型在包中找不到，保留 fallback（不白屏）

---

### Phase C：代码修改

#### C1 — 更新 ModelRegistry.ts 路径前缀
将所有 `path: '/models/...'` 改为 `path: '/assets/models/...'`

**涉及文件**: `src/components/arena3d/models/ModelRegistry.ts`
**修改方式**: 全局替换 `/models/` → `/assets/models/`

#### C2 — 更新 ModelAsset.tsx 预加载路径
```typescript
// 修改前
useGLTF.preload(MODEL_REGISTRY.key.path)

// 修改后：预加载所有已配置的模型路径
Object.values(MODEL_REGISTRY).forEach((config) => {
  useGLTF.preload(config.path)
})
```

**涉及文件**: `src/components/arena3d/models/ModelAsset.tsx`

#### C3 — 生成 ASSET_MANIFEST.json
在 `public/assets/models/` 下生成清单文件：
```json
{
  "version": "1.0.0",
  "generatedAt": "2026-07-09",
  "models": {
    "props": ["key", "phone", "umbrella", ...],
    "furniture": ["fridge", "cabinet", ...],
    "decor": ["lamp", "plant", ...]
  },
  "totalModels": 29,
  "downloadedModels": 0,
  "fallbackModels": 29
}
```

#### C4 — 生成 ASSET_CREDITS.md
记录每个模型的来源、授权信息：
```markdown
# Asset Credits

## Quaternius (CC0)
- sofa.glb — https://quaternius.com/... — CC0
- bed.glb — https://quaternius.com/... — CC0
...

## Kenney (CC0)
- cabinet.glb — https://kenney.nl/... — CC0
...

## Fallback Models
所有未找到对应 GLB 的模型使用程序化 fallback，由项目内部生成。
```

---

### Phase D：验证与调优

#### D1 — 构建验证
```bash
npm run build
```
确保 TypeScript 类型检查通过，Vite 打包成功。

#### D2 — 运行时验证
```bash
npm run dev
```
1. 启动后打开浏览器控制台，确认没有 404 错误
2. 进入第一关（出门大作战）
3. 检查钥匙、手机、雨伞、充电宝是否正确显示（先显示 fallback，下载 GLB 后自动切换）
4. 检查容器（fridge、bedside drawer、cabinet）是否正确显示
5. 验证 hover 高亮、selected 状态、target 光圈效果是否正常

#### D3 — 模型加载失败场景验证
手动删除某个 .glb 文件，刷新页面，确认：
1. 控制台出现警告但不崩溃
2. 该位置显示 fallback 模型
3. 游戏仍可正常进行

#### D4 — 路径一致性检查
确认所有路径引用一致：
- ModelRegistry.path 指向 `/assets/models/...`
- 实际文件位于 `public/assets/models/...`
- 运行时可通过 `http://localhost:5173/assets/models/...` 访问

---

## 假设与决策

1. **Quaternius 提供 .glb 格式**：如果 Quaternius 只提供 .fbx/.obj，需要增加格式转换步骤（使用 Blender CLI 或在线转换工具）。
2. **Vite 静态资源服务正常**：`public/` 目录下的文件在开发环境和生产构建中都能通过根路径访问。
3. **网络可达**：终端能访问 quaternius.com 和 kenney.nl。
4. **curl/wget 可用**：如果不可用，使用 Node.js 脚本替代。
5. **资产包内有足够匹配的模型**：如果某个特定模型找不到，保留 fallback，不阻塞进度。
6. **风格统一优先**：优先下载整套资产包，避免从不同来源混用风格不一致的模型。

## 风险与应对

| 风险 | 应对策略 |
|-----|---------|
| Quaternius 无法访问 | 切换到 Kenney，增加格式转换步骤 |
| Kenney 资产为 .fbx 需转换 | 使用 Blender CLI `blender -b -P convert.py` 批量转换，或在线工具 |
| 某些模型在资产包中找不到 | 保留 fallback，在 ASSET_MANIFEST 中标记为 missing |
| 下载的 GLB 尺寸/比例不对 | 在 ModelRegistry 中调整 scale / rotation / heightOffset |
| GLB 包含复杂贴图导致风格不一致 | 在 ModelAsset.tsx 中强制覆盖材质属性（roughness/metalness） |
| 网络被墙或访问受限 | 使用代理或镜像站点；最终备选：保留所有 fallback |

## 验收标准

1. **环境检查通过**：curl/wget 可用，目标网站可达
2. **P0 资产下载完成**：至少 10 个第一关核心模型已下载到正确目录
3. **路径一致性**：ModelRegistry.path 与实际文件路径一致
4. **构建通过**：`npm run build` 无错误
5. **第一关可玩**：进入第一关后，物体和容器可见、可交互、不白屏
6. **降级可用**：删除某个 GLB 文件后，对应位置显示 fallback 模型
7. **清单文件存在**：ASSET_MANIFEST.json 和 ASSET_CREDITS.md 已生成
