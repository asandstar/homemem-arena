# Fallback 模型材质颜色添加计划

## 目标
为 `../../src/components/arena3d/models/FallbackModels.tsx` 中的所有 29 个 fallback 模型的 mesh 添加 `meshStandardMaterial` 材质颜色。

## 修改内容

### 1. 添加导入
在文件顶部添加：
```tsx
import { PALETTE } from '../colors'
```

### 2. 颜色方案概览

#### 家具类（低饱和暖色）：
- 木材/框架：`PALETTE.background.wood` ('#8b5a2b'), `PALETTE.background.furniture` ('#8b7355'), `PALETTE.background.darkWood` ('#654321')
- 布料/软包：`'#a8a29e'`, `'#d6d3d1'`, `'#fef3c7'`, `'#fde68a'`
- 金属：`'#94a3b8'`, `'#64748b'`, `'#d4d4d4'`
- 塑料：`'#6b7280'`, `'#9ca3af'`
- 陶瓷：`'#fef3c7'`, `'#fce7f3'`, `'#dbeafe'`

#### 任务物体类（高饱和度醒目颜色）：
- 使用 `PALETTE.taskObjects` 中定义的鲜艳颜色

### 3. 29 个模型的详细颜色分配

#### 任务物体类（13个）：

##### 1. KeyFallback（钥匙）
- 钥匙环：`PALETTE.taskObjects.keys` ('#f59e0b') - 金色金属
- 钥匙柄：`'#d97706'` - 深金色
- 钥匙齿：`'#fbbf24'` - 浅金色

##### 2. PhoneFallback（手机）
- 机身：`PALETTE.taskObjects.phone` ('#1f2937') - 深灰色
- 屏幕：`PALETTE.taskObjects.phoneScreen` ('#10b981') - 绿色发光
- 背面：`'#374151'` - 中灰色
- 摄像头：`'#111827'` - 黑色
- 按键：`'#4b5563'` - 灰色

##### 3. UmbrellaFallback（雨伞）
- 伞面：`PALETTE.taskObjects.umbrella` ('#ef4444') - 红色
- 伞骨：`'#64748b'` - 金属灰
- 伞柄：`'#1f2937'` - 黑色
- 伞尖：`'#fbbf24'` - 金色

##### 4. MilkCartonFallback（牛奶盒）
- 盒身：`PALETTE.taskObjects.milk` ('#ffffff') - 白色
- 标签：`PALETTE.taskObjects.milkLabel` ('#4f46e5') - 蓝色
- 瓶盖：`'#fbbf24'` - 黄色
- 顶部折痕：`'#e5e7eb'` - 浅灰色

##### 5. CerealBoxFallback（麦片盒）
- 盒身：`PALETTE.taskObjects.cereal` ('#fbbf24') - 黄色
- 标签：`'#dc2626'` - 红色标签
- 顶部封口：`'#92400e'` - 棕色
- 侧面：`'#f59e0b'` - 深黄色

##### 6. CupFallback（杯子）
- 杯身：`PALETTE.taskObjects.cup` ('#f87171') - 红色陶瓷
- 杯口：`'#fecaca'` - 浅红色
- 杯内：`'#fef2f2'` - 很浅的红色
- 杯柄：`'#f87171'` - 红色
- 杯底：`'#dc2626'` - 深红色

##### 7. BowlFallback（碗）
- 碗身：`PALETTE.taskObjects.bowl` ('#9ca3af') - 灰色陶瓷
- 碗口：`'#d1d5db'` - 浅灰色
- 碗内：`'#f3f4f6'` - 很浅的灰色
- 碗底：`'#6b7280'` - 深灰色

##### 8. PlateFallback（盘子）
- 盘身：`PALETTE.taskObjects.plate` ('#fef3c7') - 米白色陶瓷
- 盘边：`'#fde68a'` - 浅黄色
- 盘内：`'#fffbeb'` - 极浅黄色
- 盘底：`'#d97706'` - 金色装饰环

##### 9. RemoteFallback（遥控器）
- 机身：`PALETTE.taskObjects.remote` ('#6b7280') - 深灰色塑料
- 正面面板：`'#4b5563'` - 更深灰色
- 显示屏：`'#10b981'` - 绿色
- 按钮：`'#9ca3af'` - 浅灰色按钮
- 顶部发射器：`'#ef4444'` - 红色红外灯

##### 10. ClothWhiteFallback（白布）
- 主体布料：`'#fef3c7'` - 米白色（不是纯白，避免发白）
- 折叠阴影：`'#fde68a'` - 浅米黄色
- 细节：`'#fbbf24'` - 浅金色装饰

##### 11. ClothDarkFallback（深色布）
- 主体布料：`PALETTE.taskObjects.cloth` ('#ec4899') - 粉红色
- 折叠阴影：`'#db2777'` - 深粉红色
- 细节：`'#fbcfe8'` - 浅粉色

##### 12. TowelFallback（毛巾）
- 主体：`PALETTE.taskObjects.towel` ('#3b82f6') - 蓝色
- 条纹：`'#60a5fa'` - 浅蓝色
- 边缘：`'#1d4ed8'` - 深蓝色
- 标签：`'#fbbf24'` - 黄色标签

##### 13. TrashFallback（垃圾）
- 废纸团：`PALETTE.taskObjects.trash` ('#78350f') - 棕色
- 塑料：`'#6b7280'` - 灰色塑料
- 金属：`'#9ca3af'` - 银色金属
- 食物残渣：`'#84cc16'` - 绿色

#### 家具类（16个）：

##### 14. FridgeFallback（冰箱）
- 主体：`'#e5e7eb'` - 银灰色金属
- 门框：`'#d1d5db'` - 浅灰色
- 门面板：`'#f3f4f6'` - 很浅的灰色
- 把手：`'#9ca3af'` - 中灰色金属
- 搁板：`'#dbeafe'` - 淡蓝色玻璃
- 储物盒：`'#bfdbfe'` - 浅蓝色塑料
- 顶部装饰：`'#6b7280'` - 深灰色

##### 15. CabinetFallback（柜子）
- 主体框架：`PALETTE.background.wood` ('#8b5a2b') - 木色
- 门板：`PALETTE.background.furniture` ('#8b7355') - 浅木色
- 搁板：`PALETTE.background.darkWood` ('#654321') - 深木色
- 把手：`'#d4d4d4'` - 银色金属
- 底座：`'#654321'` - 深木色
- 内部侧板：`'#78350f'` - 更深木色

##### 16. SinkFallback（水槽）
- 台面：`'#f3f4f6'` - 浅灰色石英
- 柜体：`PALETTE.background.furniture` ('#8b7355') - 木色
- 水槽盆：`'#e5e7eb'` - 银色金属
- 水龙头：`'#94a3b8'` - 铬色金属
- 下水口：`'#64748b'` - 深灰色金属
- 皂液器：`'#fef3c7'` - 米白色陶瓷

##### 17. DishwasherFallback（洗碗机）
- 主体：`'#d1d5db'` - 银灰色金属
- 门板：`'#e5e7eb'` - 浅灰色
- 控制面板：`'#4b5563'` - 深灰色
- 按钮：`'#9ca3af'` - 浅灰色
- 把手：`'#6b7280'` - 深灰色
- 内部搁架：`'#94a3b8'` - 金属色
- 喷淋臂：`'#60a5fa'` - 蓝色塑料

##### 18. SofaFallback（沙发）
- 底座框架：`PALETTE.background.darkWood` ('#654321') - 深木色
- 靠背框架：`PALETTE.background.wood` ('#8b5a2b') - 木色
- 扶手：`'#a8a29e'` - 灰色布料
- 坐垫：`'#d6d3d1'` - 浅灰色布料（三个坐垫）
- 座面前沿：`'#a8a29e'` - 深灰色
- 沙发腿：`'#1f2937'` - 深色金属腿

##### 19. CoffeeTableFallback（茶几）
- 桌面：`PALETTE.background.wood` ('#8b5a2b') - 木色
- 桌腿：`'#94a3b8'` - 金属灰色
- 下层搁板：`PALETTE.background.furniture` ('#8b7355') - 浅木色
- 桌面装饰书：`'#ef4444'` - 红色书
- 桌面装饰杯：`'#60a5fa'` - 蓝色杯
- 桌面装饰花瓶：`'#fef3c7'` - 米白色花瓶
- 桌面装饰球：`'#10b981'` - 绿色球
- 桌面边缘：`'#78350f'` - 深木色边缘

##### 20. BedFallback（床）
- 床架底座：`PALETTE.background.wood` ('#8b5a2b') - 木色
- 床垫：`'#fef3c7'` - 米白色
- 床单：`'#fce7f3'` - 淡粉色
- 被子：`'#dbeafe'` - 淡蓝色
- 床头板：`PALETTE.background.darkWood` ('#654321') - 深木色
- 枕头（2个）：`'#fef3c7'` - 米白色枕头
- 第三个枕头：`'#fbcfe8'` - 粉色装饰枕
- 床沿装饰：`'#d6d3d1'` - 浅灰色
- 床腿：`'#1f2937'` - 深色腿

##### 21. DeskFallback（书桌）
- 桌面：`PALETTE.background.wood` ('#8b5a2b') - 木色
- 桌腿：`PALETTE.background.darkWood` ('#654321') - 深木色
- 后背板：`PALETTE.background.furniture` ('#8b7355') - 浅木色
- 抽屉把手：`'#d4d4d4'` - 银色金属
- 抽屉面板装饰线：`'#78350f'` - 深木色
- 台灯底座：`'#6b7280'` - 深灰色
- 台灯杆：`'#9ca3af'` - 银色金属
- 台灯罩：`'#fef3c7'` - 米白色灯罩
- 台灯灯泡：`'#fbbf24'` - 暖黄色发光
- 桌面边缘：`'#78350f'` - 深木色边缘
- 书本装饰：`'#ef4444'` - 红色书

##### 22. LaundryBasketFallback（洗衣篮）
- 篮身：`PALETTE.background.furniture` ('#8b7355') - 藤编色
- 篮口边缘：`PALETTE.background.wood` ('#8b5a2b') - 深藤色
- 内部：`'#d6d3d1'` - 浅灰色内衬
- 底座：`'#654321'` - 深木色底座
- 标签：`'#3b82f6'` - 蓝色标签
- 镂空条纹：`'#a8a29e'` - 灰色镂空
- 底部：`'#78350f'` - 深棕色底部

##### 23. EntranceTrayFallback（玄关托盘）
- 托盘主体：`PALETTE.background.wood` ('#8b5a2b') - 木色
- 内部凹陷：`PALETTE.background.furniture` ('#8b7355') - 浅木色
- 底部边缘：`PALETTE.background.darkWood` ('#654321') - 深木色
- 分格条：`'#a8a29e'` - 金属分格
- 中心装饰：`'#d4d4d4'` - 银色装饰
- 钥匙装饰：`'#f59e0b'` - 金色钥匙
- 硬币装饰：`'#9ca3af'` - 银色硬币
- 珠子装饰：`'#ec4899'` - 粉色珠子

##### 24. LampFallback（灯）
- 底座：`'#64748b'` - 深灰色金属
- 灯杆：`'#94a3b8'` - 银色金属
- 灯头连接：`'#6b7280'` - 灰色金属
- 灯罩：`'#fef3c7'` - 米白色布艺灯罩
- 灯罩顶部：`'#fde68a'` - 浅黄色顶部
- 灯座内部：`'#1f2937'` - 黑色灯座
- 灯泡：`'#fbbf24'` - 暖黄色灯泡

##### 25. PlantFallback（植物）
- 花盆：`PALETTE.background.furniture` ('#8b7355') - 陶土色
- 花盆边缘：`PALETTE.background.wood` ('#8b5a2b') - 深陶土色
- 土壤：`'#44403c'` - 深棕色土壤
- 花茎：`'#16a34a'` - 深绿色
- 叶子/花球：`'#22c55e'` - 绿色（多个球体）
- 叶子深浅变化：`'#15803d'` 和 `'#4ade80'` - 不同深浅的绿色

##### 26. RugFallback（地毯）
- 地毯主体：`'#d6d3d1'` - 浅灰色
- 中心图案：`'#a8a29e'` - 深灰色
- 条纹图案：`'#fef3c7'` - 米黄色条纹
- 边缘：`'#78716c'` - 深灰色边缘
- 中心装饰：`'#fbbf24'` - 金色装饰
- 菱形装饰：`'#f87171'` - 红色菱形
- 底部（厚度）：`'#57534e'` - 更深灰色

##### 27. PillowFallback（枕头）
- 枕头主体：`'#fef3c7'` - 米白色
- 枕套边缘：`'#fde68a'` - 浅黄色
- 褶皱/阴影：`'#fcd34d'` - 深一点的黄色
- 装饰边：`'#f87171'` - 红色装饰边
- 装饰球：`'#ec4899'` - 粉色装饰球
- 顶部褶皱：`'#fbbf24'` - 金色顶部

##### 28. ShoesFallback（鞋子）
- 鞋面（两只鞋）：`'#3b82f6'` - 蓝色（左右脚各一只）
- 鞋底：`'#1f2937'` - 深灰色鞋底
- 鞋头：`'#1d4ed8'` - 深蓝色鞋头
- 鞋后跟：`'#1e40af'` - 更深蓝色
- 鞋带：`'#f3f4f6'` - 白色鞋带
- 鞋侧面：`'#60a5fa'` - 浅蓝色侧面
- 鞋口内里：`'#1e3a8a'` - 深蓝色内里

##### 29. HookFallback（挂钩）
- 底座主体：`PALETTE.background.wood` ('#8b5a2b') - 木色
- 底座面板：`PALETTE.background.furniture` ('#8b7355') - 浅木色
- 挂钩杆：`'#94a3b8'` - 银色金属
- 挂钩钩：`'#64748b'` - 深灰色金属
- 挂钩球头：`'#d4d4d4'` - 亮银色
- 下层搁板：`'#a8a29e'` - 灰色搁板
- 侧面装饰：`'#78350f'` - 深木色侧面

## 实施步骤

1. **添加导入语句**：在文件顶部添加 `import { PALETTE } from '../colors'`

2. **逐个修改 29 个组件**：为每个组件的每个 `<mesh>` 元素添加 `<meshStandardMaterial>` 子元素
   - 保持几何体结构不变
   - 只在 `<mesh>` 和 `</mesh>` 之间添加材质
   - 使用 `color` 属性设置颜色

3. **运行类型检查**：执行 `cd ../.. && npx tsc --noEmit` 验证类型

## 注意事项

- 所有材质都使用 `<meshStandardMaterial>` 组件
- 颜色属性使用 `color` prop
- 不改变任何几何体（boxGeometry, sphereGeometry 等）的结构
- 不改变 mesh 的 position, rotation 等属性
- 同一个模型的不同部分用不同颜色区分
- 家具类使用低饱和暖色
- 任务物体类使用高饱和度醒目颜色
- 确保 29 个模型全部修改，无遗漏
