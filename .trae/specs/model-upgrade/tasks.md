# Echo House: Memory Butler - 3D 模型升级 Implementation Plan

## [ ] Task 1: 建立资产目录结构和基础配置
- **Priority**: high
- **Depends On**: None
- **Description**: 
  - 创建 public/assets/models/ 目录（props、furniture、decor 子目录）
  - 建立 src/components/arena3d/models/ 目录结构
  - 建立 src/components/arena3d/materials/ 目录
  - 检查 package.json 确认 drei 已安装（useGLTF 等）
- **Acceptance Criteria Addressed**: AC-1
- **Test Requirements**:
  - `programmatic` TR-1.1: 目录结构创建完成
  - `programmatic` TR-1.2: drei 依赖可用

## [ ] Task 2: 实现 ModelRegistry 和材质调色板
- **Priority**: high
- **Depends On**: Task 1
- **Description**: 
  - 创建 ModelRegistry.ts，定义所有模型的配置（路径、scale、rotation、fallback、阴影、高亮色）
  - 创建 palette.ts，定义 cozy low-poly 色彩系统
  - 创建 stylizedMaterials.ts，定义不同材质类型的标准配置
- **Acceptance Criteria Addressed**: AC-1, AC-5
- **Test Requirements**:
  - `programmatic` TR-2.1: ModelRegistry 包含至少 25 个模型配置
  - `programmatic` TR-2.2: palette 定义完整的色彩系统
  - `human-judgement` TR-2.3: 色彩搭配符合 cozy low-poly 风格

## [ ] Task 3: 实现 ModelAsset 基础组件
- **Priority**: high
- **Depends On**: Task 2
- **Description**: 
  - 创建 ModelAsset.tsx 核心加载组件
  - 实现 useGLTF 加载逻辑
  - 实现 Suspense 和错误边界（加载失败显示 fallback）
  - 自动遍历 mesh 设置 castShadow / receiveShadow
  - 支持 hover emissive glow 效果
  - 支持 selected / interactable / target 三种视觉状态
- **Acceptance Criteria Addressed**: AC-1, AC-7
- **Test Requirements**:
  - `programmatic` TR-3.1: 加载不存在的 GLB 时自动显示 fallback
  - `programmatic` TR-3.2: 所有 mesh 自动设置阴影
  - `human-judgement` TR-3.3: hover 时有明显发光效果

## [ ] Task 4: 实现 Fallback 模型库（精细化版）
- **Priority**: high
- **Depends On**: Task 2
- **Description**: 
  - 创建 FallbackModels.tsx
  - 重构现有 12 个任务物体 fallback，每个至少 5-12 个几何体组合
  - 确保每个 fallback 有可识别剪影
  - 不允许单个 box 代表关键物体
- **Acceptance Criteria Addressed**: AC-2, AC-4
- **Test Requirements**:
  - `human-judgement` TR-4.1: 钥匙、手机、雨伞、牛奶、麦片、杯子一眼可识别
  - `human-judgement` TR-4.2: 衣物、毛巾、垃圾有可识别形状
  - `programmatic` TR-4.3: 每个 fallback 至少使用 5 个几何体

## [ ] Task 5: 实现 PropModel 组件
- **Priority**: high
- **Depends On**: Task 3, Task 4
- **Description**: 
  - 创建 PropModel.tsx
  - 集成 ModelAsset + 任务物体专属视觉效果
  - 实现轻微浮动动画（可拾取状态）
  - 实现任务物体更高饱和度和醒目的渲染
  - 实现地面光圈和 tooltip
- **Acceptance Criteria Addressed**: AC-2, AC-7
- **Test Requirements**:
  - `human-judgement` TR-5.1: 任务物体比背景装饰更醒目
  - `human-judgement` TR-5.2: hover 时有高亮描边和光圈
  - `programmatic` TR-5.3: 浮动动画流畅不卡顿

## [ ] Task 6: 实现 FurnitureModel 组件
- **Priority**: high
- **Depends On**: Task 3, Task 4
- **Description**: 
  - 创建 FurnitureModel.tsx
  - 实现 10 个家具模型的 fallback（精细化版）
  - 容器保留 open / close 状态表现（门板旋转）
  - 目标容器有柔和目标光圈
  - 确保每个家具有清晰用途识别特征
- **Acceptance Criteria Addressed**: AC-3, AC-7
- **Test Requirements**:
  - `human-judgement` TR-6.1: 冰箱、橱柜、沙发、床、洗衣篮可识别
  - `human-judgement` TR-6.2: 容器开关状态清晰可见
  - `programmatic` TR-6.3: 目标容器有脉冲光圈效果

## [ ] Task 7: 重构 Object3D 使用 PropModel
- **Priority**: high
- **Depends On**: Task 5
- **Description**: 
  - 修改 Object3D.tsx，内部调用 PropModel
  - 根据 entity.category 决定模型
  - 保留 pick、hover、tooltip、held 状态逻辑
  - 保留 shake、successPulse、错误反馈动画
  - 移除旧的 GEOMETRY_COMPONENTS 直接渲染
- **Acceptance Criteria Addressed**: AC-2, AC-8
- **Test Requirements**:
  - `programmatic` TR-7.1: 拾取和放置功能正常
  - `programmatic` TR-7.2: 所有类别物体都有对应模型
  - `human-judgement` TR-7.3: 交互反馈效果保留

## [ ] Task 8: 重构 Container3D 使用 FurnitureModel
- **Priority**: high
- **Depends On**: Task 6
- **Description**: 
  - 修改 Container3D.tsx，内部调用 FurnitureModel
  - 根据 container id / category 决定家具类型
  - 保留 open / close 动画
  - 保留 place、target zone、hover 逻辑
  - 保留内部物体展示
- **Acceptance Criteria Addressed**: AC-3, AC-8
- **Test Requirements**:
  - `programmatic` TR-8.1: 容器开关功能正常
  - `programmatic` TR-8.2: 放置物体功能正常
  - `human-judgement` TR-8.3: 目标容器有光圈提示

## [ ] Task 9: 增强房间装饰和生活感
- **Priority**: medium
- **Depends On**: Task 5, Task 6
- **Description**: 
  - 修改 Room3D.tsx，为每个房间添加更多装饰模型
  - 玄关：门、鞋柜、托盘、伞架、地垫、挂钩
  - 客厅：沙发、茶几、电视柜、地毯、落地灯、靠枕
  - 厨房：冰箱、橱柜、水槽、垃圾桶、洗碗机、台面
  - 卧室：床、床头柜、书桌、衣柜、台灯、散落衣物
  - 洗衣区：洗衣机、三个洗衣篮、毛巾架、洗衣液
  - 餐厅：餐桌、椅子、吊灯、餐具
- **Acceptance Criteria Addressed**: AC-4
- **Test Requirements**:
  - `human-judgement` TR-9.1: 每个房间至少 3 个视觉锚点
  - `human-judgement` TR-9.2: 房间功能可通过视觉区分
  - `programmatic` TR-9.3: 性能保持流畅

## [ ] Task 10: 优化光照和阴影系统
- **Priority**: medium
- **Depends On**: Task 9
- **Description**: 
  - 优化 Scene3D.tsx 中的光照配置
  - 实现环境光 + 主方向光 + 房间点光源三层光照
  - 调整阴影参数（分辨率、偏移）
  - 为不同房间设置不同的灯光色温
  - 确保物体不漂浮
- **Acceptance Criteria Addressed**: AC-5, AC-6
- **Test Requirements**:
  - `human-judgement` TR-10.1: 场景有明显光影层次
  - `human-judgement` TR-10.2: 物体有接触阴影，不漂浮
  - `human-judgement` TR-10.3: 不同房间有不同氛围
  - `programmatic` TR-10.4: 阴影不闪烁

## [ ] Task 11: 第一关验证和其他关卡适配
- **Priority**: high
- **Depends On**: Task 7, Task 8, Task 9
- **Description**: 
  - 验证第一关「出门大作战」完整可玩
  - 确保其他三个关卡可以正常进入
  - 修复任何兼容性问题
  - 确保所有任务物体在各关卡中正确显示
- **Acceptance Criteria Addressed**: AC-8, AC-9
- **Test Requirements**:
  - `programmatic` TR-11.1: 第一关可以正常完成
  - `programmatic` TR-11.2: 其他三关可以进入不崩溃
  - `human-judgement` TR-11.3: 所有物体正确显示

## [ ] Task 12: 构建验证和错误修复
- **Priority**: high
- **Depends On**: Task 11
- **Description**: 
  - 运行 npm run build 验证构建
  - 修复所有 TypeScript 错误
  - 检查控制台无红色严重错误
  - 性能基线测试
- **Acceptance Criteria Addressed**: AC-10, AC-11
- **Test Requirements**:
  - `programmatic` TR-12.1: npm run build 成功
  - `programmatic` TR-12.2: 控制台无红色错误
  - `programmatic` TR-12.3: 无 TypeScript 编译错误
