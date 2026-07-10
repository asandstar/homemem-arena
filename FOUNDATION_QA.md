# FOUNDATION_QA.md - Foundation Pass 验证报告

> **历史验证快照**：只说明当次 Foundation Pass 的结果，不代表当前端到端闭环已通过。当前标准见 [QA_SMOKE_CHECKLIST.md](QA_SMOKE_CHECKLIST.md)。

## 构建与测试结果

### 构建状态
✅ `npm run build` 通过（0 错误）

### 单元测试
✅ 248 个测试全部通过

---

## 根因分析与修复记录

### 1. 前后左右反复修不好的根因

**根因**：缺少单一真值来源（single source of truth）
- 移动向量计算在 `playerMovement.ts`
- 鼠标旋转在 `FirstPersonControls.tsx`
- 相机 rotation 在 useFrame 中 lerp
- 小地图箭头方向各自计算
- 每次修复只改一处，符号不一致导致方向混乱

**修复**：
- 新建 `src/game/playerControls.ts` 作为唯一的移动/视角计算来源
- 明确坐标系注释：Three.js 默认 forward = -Z，Y 向上
- 所有移动、视角计算统一使用该模块的函数
- 相机 rotation 和 store 状态不再互相追逐（ref 管理旋转角度，只有变化超过阈值才同步）

---

### 2. 鼠标只能左右看的根因

**根因**：pitch 功能完全缺失
- `FirstPersonControls.tsx` 只实现了 yaw（左右）
- `smoothedCamRot.current.x = 0` 硬编码
- useGameStore 没有 pitch 状态

**修复**：
- useGameStore 新增 `cameraPitch` 状态
- 鼠标上下拖动修改 pitch
- `clampPitch(pitch)` 限制在 -π/3 到 π/3（-60° ~ +60°）
- 相机 rotation 使用 YXZ Euler 顺序
- 禁止 roll（z 轴始终为 0）

---

### 3. 物体悬空反复修不好的根因

**根因**：没有统一的模型高度注册表
- `entity.size.y` 不等于实际视觉高度
- GLB 模型和 fallback 模型的 pivot 不统一
- 容器 surfaceHeight 计算不一致
- 手调 y 坐标被 snap 覆盖

**修复**：
- 新建 `MODEL_HEIGHTS` 注册表，包含 28 种物体和家具的近似高度
- 统一"底部对齐"规则：position.y 代表物体底部的 y 坐标
- 新增函数：`getModelApproxHeight`、`getEntityHalfHeight`、`snapToFloor`、`snapToContainerSurface`
- Room3D.tsx 修复玄关、客厅、厨房、卧室主要家具的位置
- Object3D.tsx 和 Container3D.tsx 使用模型实际高度计算

---

### 4. 穿墙根因

**根因**：离散碰撞检测 + 家具碰撞后不回查边界
- 碰撞是单步检测，不是连续碰撞
- 家具碰撞解析后没有再次检查房间边界
- 家具靠墙边时可能把玩家推出墙外
- 墙厚只有 0.1，玩家半径 0.3，碰撞边界是房间内边界

**修复**：
- 新建 `src/game/collision.ts` 统一碰撞系统
- 家具碰撞后，**再次调用 resolveRoomCollision** 确保不穿墙
- 沿墙滑动：先试 x 方向再试 z 方向
- 门洞作为边界上的通行例外
- 房间切换有冷却时间（800ms），避免门口抖动

---

### 5. HUD 重叠根因

**根因**：事件日志和小地图位置冲突
- 事件日志在 `bottom-4 right-24`
- 小地图在 `bottom-4 right-4`
- 两者在右下角非常接近
- 没有收起机制，没有 compact 模式

**修复**：
- 事件日志移到左下角独立位置
- 新建 `src/store/useUiStore.ts` 管理 UI 状态
- 所有面板支持收起/展开（Tab、R、H 键）
- localStorage 持久化 UI 状态
- isCompact 状态处理 1280px 以下宽度

---

### 6. 小地图看不全根因

**根因**：默认跟随玩家视角
- `followPlayer = true` 初始值
- 打开小地图时以玩家为中心
- 看不到全局房间布局

**修复**：
- `followPlayer` 默认值改为 `false`
- 打开时默认 fit-to-view 当前关卡所有房间
- 新增收起/展开按钮
- reset 按钮改为 fit-to-view

---

## 修改的文件清单

| 文件 | 改动 |
|------|------|
| `src/game/playerControls.ts` | **新建**：统一的移动/视角计算来源 |
| `src/game/collision.ts` | **新建**：统一碰撞系统 |
| `src/store/useUiStore.ts` | **新建**：UI 状态管理 |
| `src/store/useGameStore.ts` | 新增 `cameraPitch` 状态 |
| `src/components/arena3d/FirstPersonControls.tsx` | 重构：pitch 支持、碰撞逻辑、性能优化 |
| `src/components/arena3d/Object3D.tsx` | 使用模型实际高度计算 |
| `src/components/arena3d/Container3D.tsx` | 使用模型实际高度计算 |
| `src/components/arena3d/Room3D.tsx` | 修复家具位置 |
| `src/components/arena3d/Minimap.tsx` | 默认 fit-to-view、收起按钮 |
| `src/game/placement.ts` | 模型高度注册表、snap 函数 |
| `src/game/playerMovement.ts` | 重新导出移动相关函数 |
| `src/game/collision.test.ts` | **新建**：碰撞单元测试 |
| `src/game/placement.test.ts` | 更新测试 |

---

## 下一步试玩验证

1. **启动开发服务器**：
   ```bash
   npm run dev
   ```

2. **打开浏览器**：访问 http://localhost:5173

3. **试玩第一关「出门大作战」**：
   - 测试 WASD 方向
   - 测试鼠标左右拖动转向
   - 测试鼠标上下拖动抬头/低头
   - 测试穿墙（撞墙应沿墙滑动）
   - 测试门洞通行（客厅 ↔ 卧室 ↔ 玄关）
   - 观察钥匙、手机、雨伞是否悬空
   - 测试小地图（拖动、缩放、收起、看全）

4. **试玩第二关「餐桌混乱」**：
   - 测试餐厅 ↔ 厨房移动
   - 观察餐桌上的杯子、盘子、遥控器是否悬空
   - 测试拾取和放置

5. **测试 HUD**：
   - Tab 键切换任务面板
   - R 键切换事件日志
   - H 键隐藏辅助 UI
   - 刷新页面验证 UI 状态保持

---

## 总结

Foundation Pass 已完成全部 6 个任务：

1. ✅ 统一相机与移动控制
2. ✅ 修复穿墙和移动卡顿
3. ✅ 系统性修复物体悬空
4. ✅ HUD 布局和可收起窗口
5. ✅ 小地图增强
6. ✅ 根因分析和验证报告

基础操作、物体摆放、碰撞限位和 UI 布局已建立统一规范，后续功能开发有可靠根基。
