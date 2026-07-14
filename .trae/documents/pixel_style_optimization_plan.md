# 🎮 像素风格模型升级 + 性能优化计划

## 一、项目调研结论

### 当前模型状态
- 项目使用 GLB 3D 模型文件（30+ 个），存放在 `public/assets/models/`
- 同时有程序化 fallback 模型（`FallbackModels.tsx`），使用基础几何体构建
- 当前风格：简约几何风，纯色材质，缺乏像素化效果

### 限制条件
- 无法直接编程下载 itch.io 模型包（需要交互式点击）
- itch.io 包只有 30 个小型道具，无法覆盖全部家具需求

### 解决方案
采用混合方案：**增强现有模型的视觉效果 + 添加全局像素化后处理**

---

## 二、文件修改清单

### 1. 模型视觉升级

| 文件 | 修改内容 |
|------|----------|
| `src/components/arena3d/models/ModelAsset.tsx` | 添加 NearestFilter 纹理过滤、关闭 mipmap、flat shading |
| `src/components/arena3d/models/FallbackModels.tsx` | 优化几何体形状、复古配色、添加像素化细节 |
| `src/components/arena3d/materials/palette.ts` | 新增复古像素配色方案 |
| `src/components/arena3d/Scene3D.tsx` | 添加像素化后处理效果（像素化滤镜） |

### 2. 性能优化

| 文件 | 修改内容 |
|------|----------|
| `src/pages/ArenaPage.tsx` | 使用 React.lazy 动态导入 Scene3D 等重组件 |
| `src/components/arena3d/models/ModelAsset.tsx` | 使用 useGLTF preload 优化模型加载 |
| `src/components/arena3d/Room3D.tsx` | 降低阴影贴图分辨率 |
| `src/components/arena3d/Object3D.tsx` | 合并相似几何体使用 InstancedMesh |

---

## 三、实施步骤

### 阶段一：模型备份（步骤 1）
```bash
cp -r public/assets/models public/assets/models_backup
```

### 阶段二：像素化材质升级（步骤 2-4）

**步骤 2**：修改 `ModelAsset.tsx`
- 为所有材质添加 `texture.minFilter = THREE.NearestFilter`
- 设置 `texture.generateMipmaps = false`
- 使用 flat shading（关闭平滑着色）

**步骤 3**：修改 `FallbackModels.tsx`
- 使用更圆润的几何体形状（roundedBox）
- 添加复古像素配色
- 添加简单的装饰细节（如眼睛、表情）

**步骤 4**：修改 `palette.ts`
- 新增复古配色方案（16色像素风格）
- 暖色调、对比度高的颜色

### 阶段三：全局像素化后处理（步骤 5）

**步骤 5**：修改 `Scene3D.tsx`
- 添加像素化 shader 后处理
- 使用 EffectComposer 实现像素化效果
- 可调节像素大小参数

### 阶段四：性能优化（步骤 6-9）

**步骤 6**：动态导入拆分
- 将 Scene3D、HUD、Minimap 等组件改为动态导入
- 使用 React.Suspense 处理加载状态

**步骤 7**：模型预加载
- 使用 useGLTF 的 preload 功能
- 在任务开始前预加载所需模型

**步骤 8**：阴影优化
- 降低阴影贴图分辨率（从 2048 降到 1024）
- 减少阴影距离

**步骤 9**：实例化渲染
- 对相同类型的重复物体使用 InstancedMesh
- 如：多个杯子、多个盘子等

---

## 四、潜在依赖与考虑

### 依赖
- `@react-three/postprocessing`：用于后处理效果（如果尚未安装）
- 需要确认 Three.js 版本支持的后处理 API

### 风险
- 像素化效果可能影响 UI 文字清晰度
- 需要在 Scene3D 和 UI 之间做隔离
- 性能优化可能引入兼容性问题

---

## 五、验证步骤

1. **视觉验证**：运行游戏查看像素化效果
2. **功能验证**：确保所有交互功能正常（拾取、放置、记忆）
3. **性能验证**：使用 Chrome DevTools 检查 FPS 和内存使用
4. **构建验证**：确保 `npm run build` 成功

---

## 六、提交计划

所有改动完成后：
```bash
git add .
git commit -m "feat: pixel art style upgrade + performance optimization"
git push
```
