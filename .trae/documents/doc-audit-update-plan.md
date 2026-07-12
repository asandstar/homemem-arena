# 文档更新 + Bug 修复计划（修订版）

## 一、Bug 根因分析与修复方案

### Bug 1：左右移动方向反了 🔴
- **根因**：`crossVectors(up, forward)` 计算的是左手方向，但被当作右方向使用
- **修复**：`FirstPersonControls.tsx` 中改为 `crossVectors(cameraForward, up)`
- **验证**：按 D 应该往右走，按 A 应该往左走

### Bug 2：门方向错误 + 重复渲染 + 打开方向不对 🔴
- **根因有三**：
  1. **旋转反了**：X 墙的门用 `rotY=0`（门板宽沿 X 轴），但应沿 Z 轴 → 应改为 `rotY=π/2`；Z 墙同理反过来
  2. **重复渲染**：每个共享门洞被两个相邻房间各渲染一次
  3. **打开方向**：门应该向连接的房间方向摆开，当前铰链和旋转方向逻辑混乱
- **修复方案**：
  - 重写 Door3D 的坐标计算：根据墙朝向正确定位门板和铰链
  - 去重：只渲染 `spec.id < door.connectsTo` 的门（每个门只渲染一次）
  - 打开方向：门向 connectsTo 房间方向摆开

### Bug 3：第二关初始位置未更新 🟡
- **根因**：`clean-table.ts` 缺少 `spawnPosition`/`spawnRotation`
- **修复**：给 clean-table 添加出生点（餐厅南侧，面朝北）

### Bug 4：启动卡顿 🟡
- **根因**：每扇门每帧 `new THREE.Vector3()` + `useGameStore.getState()`
- **修复**：Door3D 中复用 Vector3 对象；去重后门数量减半

### Bug 5：任务提示与顶部状态栏重叠 🟡
- **根因**：事件 Toast `top-24`(96px) 与状态栏（高~136px）纵向重叠；状态栏固定 400px 宽
- **修复**：Toast 下移到 `top-36`；状态栏宽度自适应 `max-w-[400px]`

### Bug 6：小地图溢出 🟡
- **根因**：Minimap 固定 260×260px，父容器仅 180px/140px
- **修复**：Minimap 容器改为 `width: 100%`

### Bug 7：关卡重启状态未清除 🟡
- **根因**：`resetTask` 不清除 `useSessionStore`
- **修复**：在 `resetTask` 中调用 `useSessionStore.getState().startSession()`

---

## 二、文档更新

| 文档 | 更新内容 |
|------|---------|
| `TECH_DEBT_RESOLUTION_plan.md` | Phase 3/4 → ✅ 完成 |
| `project-completion-report.md` | 测试 258→287，store 1328→~200 行，新增运动平滑/Door3D/方向修复 |
| `BUGFIX_STATUS.md` | 更新已修复列表，新增本次 7 个 bug |
| `README.md` | 统一关卡顺序 |

---

## 三、实施步骤

### Phase 1：修复左右方向（1 行改动）
- `FirstPersonControls.tsx:328`：`crossVectors(up, forward)` → `crossVectors(cameraForward, up)`

### Phase 2：重写 Door3D 组件
- 修正旋转：X 墙 `rotY=π/2`，Z 墙 `rotY=0`
- 去重逻辑：只渲染 `spec.id < door.connectsTo` 的门
- 打开方向：门向 connectsTo 方向摆开
- 性能优化：复用 Vector3

### Phase 3：Room3D 门渲染去重
- 只渲染 `spec.id < door.connectsTo` 的门洞

### Phase 4：修复 UI 重叠
- HUD.tsx：Toast `top-24` → `top-36`；状态栏 `w-[400px]` → `max-w-[400px] w-full`
- Minimap.tsx：`width: 260px` → `width: 100%`

### Phase 5：第二关出生点 + 重启清除
- clean-table.ts：添加 `spawnPosition`/`spawnRotation`
- taskSlice.ts：`resetTask` 中清除 session

### Phase 6：更新 4 份文档

### Phase 7：构建测试 + 提交

---

## 四、验证
1. `npm run build` 通过
2. `npx vitest run` 287 测试通过
3. 按 D 往右、A 往左
4. 每个门洞只有一扇门，方向正确，向新房间打开
5. UI 无重叠
6. 第二关出生点合理
