# Fallback 模型材质添加实施计划

## 目标
为 `../../src/components/arena3d/models/FallbackModels.tsx` 中的所有 fallback 模型组件添加 meshStandardMaterial 材质。

## 实施步骤

### 1. 导入 PALETTE
- 从 `../colors.ts` 导入 `PALETTE`

### 2. 任务物体类模型（高饱和度醒目颜色）

#### KeyFallback（钥匙）
- 钥匙环和钥匙主体：`PALETTE.taskObjects.keys`（金色 #f59e0b），金属质感
- 钥匙齿：金色，金属质感

#### PhoneFallback（手机）
- 手机外壳：`PALETTE.taskObjects.phone`（深色 #1f2937），塑料质感
- 屏幕：`PALETTE.taskObjects.phoneScreen`（绿色 #10b981），发光材质
- 摄像头和按钮：深色，金属质感

#### UmbrellaFallback（雨伞）
- 伞面：`PALETTE.taskObjects.umbrella`（红色 #ef4444），布料质感
- 伞骨和伞柄：深色金属
- 伞顶：红色

#### MilkCartonFallback（牛奶盒）
- 牛奶盒主体：`PALETTE.taskObjects.milk`（白色 #ffffff），纸质质感
- 标签：`PALETTE.taskObjects.milkLabel`（蓝色 #4f46e5），纸质质感
- 瓶盖：蓝色

#### CerealBoxFallback（麦片盒）
- 盒子主体：`PALETTE.taskObjects.cereal`（黄色 #fbbf24），纸质质感
- 标签和装饰：白色和深色

#### CupFallback（杯子）
- 杯身：`PALETTE.taskObjects.cup`（红色 #f87171），陶瓷质感
- 杯口和杯底：白色陶瓷
- 把手：红色陶瓷

#### BowlFallback（碗）
- 碗身：`PALETTE.taskObjects.bowl`（灰色 #9ca3af），陶瓷质感
- 碗口和碗底：白色陶瓷

#### PlateFallback（盘子）
- 盘身：`PALETTE.taskObjects.plate`（米黄色 #fef3c7），陶瓷质感
- 盘边和装饰：白色

#### RemoteFallback（遥控器）
- 遥控器主体：`PALETTE.taskObjects.remote`（灰色 #6b7280），塑料质感
- 按钮：深色和彩色按钮
- 显示屏：绿色发光

#### ClothWhiteFallback（白色衣服）
- 衣服主体：`PALETTE.background.wall`（米色 #f5f5dc），布料质感
- 细节：白色和浅色调

#### ClothDarkFallback（深色衣服）
- 衣服主体：`PALETTE.taskObjects.phone`（深色 #1f2937），布料质感
- 细节：深灰色

#### TowelFallback（毛巾）
- 毛巾主体：`PALETTE.taskObjects.towel`（蓝色 #3b82f6），布料质感
- 条纹和细节：白色

#### TrashFallback（垃圾）
- 垃圾主体：`PALETTE.taskObjects.trash`（棕色 #78350f），塑料/纸质质感
- 其他垃圾：混合颜色（灰色、绿色等）

### 3. 家具类模型（低饱和暖色）

#### SofaFallback（沙发）
- 沙发框架和底座：`PALETTE.background.darkWood`（深木色 #654321），木质质感
- 沙发坐垫和靠背：`PALETTE.background.furniture`（家具色 #8b7355），布料质感
- 扶手和靠枕：暖灰色，布料质感
- 沙发腿：深木色

#### CoffeeTableFallback（咖啡桌）
- 桌面：`PALETTE.background.wood`（木色 #8b5a2b），木质质感
- 桌腿：`PALETTE.background.darkWood`（深木色 #654321），木质/金属质感
- 桌面装饰：各种颜色

#### BedFallback（床）
- 床架：`PALETTE.background.darkWood`（深木色 #654321），木质质感
- 床垫：`PALETTE.background.wall`（米色 #f5f5dc），布料质感
- 被子和枕头：`PALETTE.ambient.warm`（暖米色 #ffecd2），布料质感
- 床头板：深木色
- 床腿：深木色

#### DeskFallback（书桌）
- 桌面：`PALETTE.background.wood`（木色 #8b5a2b），木质质感
- 桌腿和侧板：`PALETTE.background.darkWood`（深木色 #654321），木质质感
- 抽屉：木色
- 台灯：金属+暖色发光

#### CabinetFallback（柜子）
- 柜体：`PALETTE.background.furniture`（家具色 #8b7355），木质质感
- 柜门：`PALETTE.background.wood`（木色 #8b5a2b），木质质感
- 搁板：木色
- 把手：金属色

#### FridgeFallback（冰箱）
- 冰箱主体：`PALETTE.background.wall`（米色 #f5f5dc），金属/塑料质感
- 冰箱门：白色/银色
- 搁板：透明/白色
- 把手：金属色

#### SinkFallback（水槽）
- 台面：`PALETTE.background.wood`（木色 #8b5a2b），木质质感
- 水槽：白色/不锈钢色，陶瓷/金属质感
- 水龙头：金属色，金属质感
- 柜子：木色

#### DishwasherFallback（洗碗机）
- 洗碗机主体：`PALETTE.background.furniture`（家具色 #8b7355），金属/塑料质感
- 门：不锈钢色
- 按钮和控制面板：深色+发光
- 内部：金属色

#### LaundryBasketFallback（洗衣篮）
- 洗衣篮主体：`PALETTE.background.furniture`（家具色 #8b7355），塑料/编织质感
- 篮口和篮底：深木色
- 把手：木色
- 内部条纹：浅色

#### EntranceTrayFallback（玄关托盘）
- 托盘主体：`PALETTE.background.wood`（木色 #8b5a2b），木质质感
- 托盘内部：`PALETTE.ambient.warm`（暖米色 #ffecd2）
- 格子分隔：木色
- 装饰物品：各种颜色

#### LampFallback（灯）
- 灯座：`PALETTE.background.darkWood`（深木色 #654321），木质/金属质感
- 灯杆：金属色，金属质感
- 灯罩：`PALETTE.ambient.warm`（暖米色 #ffecd2），布料/纸质质感
- 灯泡：暖色发光

#### PlantFallback（植物）
- 花盆：`PALETTE.background.furniture`（家具色 #8b7355），陶瓷/泥土质感
- 土壤：深棕色
- 花茎：绿色
- 叶子和花朵：各种绿色

#### RugFallback（地毯）
- 地毯主体：`PALETTE.background.floor`（地板色 #d4c5b0），布料质感
- 图案和边框：`PALETTE.background.furniture`（家具色 #8b7355）
- 中心装饰：暖色

#### PillowFallback（枕头）
- 枕头主体：`PALETTE.ambient.soft`（淡粉色 #fce7f3），布料质感
- 装饰：`PALETTE.ambient.warm`（暖米色 #ffecd2）
- 细节：淡粉色

#### ShoesFallback（鞋子）
- 鞋子主体：`PALETTE.background.darkWood`（深木色 #654321），皮革质感
- 鞋底：深色
- 鞋带：棕色
- 鞋头和鞋跟：深棕色

#### HookFallback（挂钩）
- 挂钩主体：`PALETTE.background.wood`（木色 #8b5a2b），木质质感
- 挂钩：金属色，金属质感
- 底座：木色
- 装饰：金属色

### 4. 验证
- 运行 `npx tsc --noEmit` 验证类型正确
- 确保所有 mesh 都有对应的 meshStandardMaterial
- 确保没有语法错误
