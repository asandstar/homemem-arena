# 模型白色根因诊断 + 摆放位置检查计划

## 一、模型白色的根因诊断

### 核心问题
**[Room3D.tsx](file:///Users/azq/asandstar/homemem-arena-web-demo/src/components/arena3d/Room3D.tsx) 中装饰模型的材质设置方式完全错误。**

### 错误写法（大量存在于 Room3D.tsx）
```jsx
<group position={[...]} castShadow receiveShadow>
  <SofaFallback size={{ x: 1.8, y: 0.8, z: 0.9 }} />
  <meshStandardMaterial color="#6b7280" />
</group>
```

### 为什么是错的
在 React Three Fiber 中：
- `<meshStandardMaterial>` **必须是 `<mesh>` 的直接子元素**才能生效
- 放在 `<group>` 里作为 Fallback 组件的兄弟元素，**完全不会影响 Fallback 内部的 mesh**
- 所以这些模型实际上使用的是 Fallback 组件内部默认的材质（很可能是白色默认材质）

### 受影响的模型列表（Room3D.tsx 中约 60+ 处）
| 房间 | 模型 |
|------|------|
| 客厅 | 沙发、茶几、电视柜、台灯、植物、地毯、抱枕 |
| 厨房 | 台面、冰箱、水槽、洗碗机、植物、垃圾桶 |
| 卧室 | 床、床头柜、台灯、衣柜、地毯、枕头 |
| 玄关 | 鞋架、伞架、托盘、挂钩、地毯、鞋子 |
| 洗衣区 | 洗衣机、洗衣篮、毛巾架、毛巾 |
| 餐厅 | 餐桌、椅子、餐具、地毯 |

### 已正确的模型
- **Object3D**（可拾取物体）→ 通过 `PropModel` → `ModelAsset` → `FallbackColorizer`，有颜色 ✓
- **Container3D**（家具容器）→ 通过 `FurnitureModel` → 可开合的用 `FallbackColorizer`，不可开合的用 `ModelAsset`，有颜色 ✓
- **Room3D 中的装饰模型** → 直接写 group + meshStandardMaterial，**无效，显示白色** ✗

---

## 二、摆放位置检查

### 第一关「出门大作战」初始位置
| 物体 | 房间 | 位置 | 合理吗 |
|------|------|------|--------|
| 钥匙 | 客厅 (living) | x: -1.2, y: 0.45, z: -1.0 | ✓ 茶几上 |
| 手机 | 卧室 (bedroom) | x: -7.2, y: 0.55, z: -0.8 | ✓ 床头柜抽屉里 |
| 雨伞 | 玄关 (entrance) | x: -1.2, y: 0.5, z: 4.5 | ✓ 伞架旁 |

### 容器位置
| 容器 | 房间 | 位置 | 合理吗 |
|------|------|------|--------|
| 茶几 | 客厅 | x: -1.2, y: 0.2, z: -1.0 | ✓ |
| 床头柜 | 卧室 | x: -7.2, y: 0.3, z: -0.8 | ✓ |
| 伞架 | 玄关 | x: -1.2, y: 0.3, z: 4.5 | ✓ |
| 玄关托盘 | 玄关 | x: 0.5, y: 0.5, z: 5.5 | ✓ |

### 房间中心坐标（sharedRooms）
- living: center.x = 0, center.z = 0
- bedroom: center.x = -7, center.z = 0
- kitchen: center.x = 0, center.z = -7
- entrance: center.x = 0, center.z = 6
- laundry: center.x = -7, center.z = -7
- dining: center.x = 4, center.z = 0

### 潜在问题
1. **钥匙在 y=0.45**：如果茶几高度是 0.4（y 从 0 到 0.4），钥匙应该在 y=0.42 左右（桌面上方一点），0.45 偏高但还可以
2. **手机在床头柜抽屉里**：`hiddenInContainer: 'cnt-bedside-drawer'`，需要打开抽屉才能看到
3. **雨伞在伞架旁**：位置合理

---

## 三、修复方案

### 修复 1：Room3D 装饰模型全部使用 FallbackColorizer

**文件**：`src/components/arena3d/Room3D.tsx`

**修改内容**：
1. 导入 `FallbackColorizer`
2. 把所有装饰模型用 `FallbackColorizer` 包裹
3. 移除无效的 `<meshStandardMaterial>`（放在 group 里的那些）
4. 或者，更简单的方式：把 Fallback 组件统一替换成 `ModelAsset`，让 ModelAsset 自己处理 fallback + 上色

**推荐方案**：用 `ModelAsset` 替换直接使用的 Fallback 组件
- 优点：代码更简洁，自动处理 GLB/fallback，自动上色
- 需要传 `modelId` 和 `color`

### 修复 2：调整钥匙高度（可选）
- 钥匙 y: 0.45 → 调整为 0.42，更贴近桌面

---

## 四、实施步骤

1. 检查 Room3D.tsx 中所有装饰模型
2. 用 FallbackColorizer 或 ModelAsset 包裹每个装饰模型
3. 移除所有无效的 group 级别 meshStandardMaterial
4. 验证第一关所有模型都有颜色
5. npm run build 验证

---

## 五、验收标准

1. 沙发、桌子、椅子、柜子、床、地毯、植物、灯等都有颜色
2. 不再有大面积白色装饰模型
3. 第一关钥匙、手机、雨伞位置正确
4. 第一关能正常游玩
5. npm run build 通过