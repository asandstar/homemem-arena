# HomeMem Arena v2 - Research Demo Enhancement - Verification Checklist

## 功能验证

### 旗舰任务 - 早餐准备与归位
- [x] 任务包含完整流程（取餐具→取牛奶→取麦片→摆桌→标记完成→归位→关闭容器）
- [x] 脚本事件 roommate_moved_cereal 正常触发
- [x] 脚本事件 milk_left_out_too_long 正常触发
- [x] 脚本事件 fridge_left_open 正常触发
- [x] 脚本事件 wrong_affordance_use 正常触发

### 场景真实度
- [x] 牛奶盒有可识别轮廓（长方体带标签）
- [x] 麦片盒有可识别轮廓（高盒子）
- [x] 杯子有可识别轮廓（圆柱形）
- [x] 碗有可识别轮廓（浅圆盘）
- [x] 冰箱有可识别轮廓（高柜体带门）
- [x] 橱柜有可识别轮廓（带门板）
- [x] 洗碗机有可识别轮廓（带门和把手）
- [x] 容器打开后显示内部物体
- [x] 可交互物体 hover 高亮

### 交互可用性
- [x] Tab 键显示任务目标面板
- [x] M 键打开记忆库
- [x] R 键打开研究数据面板
- [x] V 键切换第一人称/俯视视角
- [x] 小地图显示房间轮廓、机器人位置、已访问房间
- [x] 小地图不显示未观察到的物体
- [x] 只有观察过的物体出现在记忆面板
- [x] 可交互物体靠近时显示 interaction tooltip
- [x] HUD 显示当前持有物体
- [x] 任务目标显示为实时更新的 checklist

### 记忆测试升级
- [x] 四类 probe 题目（spatial、object state、temporal、procedural）各至少一道
- [x] 每个 probe 记录完整元数据（question、correct_answer、user_answer、memory_type、related_object_ids、related_event_ids、response_time、is_correct）

### 科研数据导出
- [x] Session JSON 包含所有要求字段
- [x] Observation 包含所有要求字段
- [x] 预留 screenshot_url/frame_id 字段
- [x] JSON 文件可成功下载

### 结果页升级
- [x] 显示 task completion summary
- [x] 显示四类记忆评分（空间、物体状态、时序、程序）
- [x] 显示指标（总操作数、不必要重访、错放物体、容器错误、遗漏清理步骤）
- [x] Timeline 可视化
- [x] AI 失败诊断
- [x] AI 策略建议
- [x] JSON session 下载按钮

### UI 布局
- [x] 左上角：任务 checklist 和当前目标
- [x] 右上角：时间、步数、当前持有物体、当前房间
- [x] 右侧抽屉：记忆库（默认收起）
- [x] 左下角：操作提示
- [x] 右下角：小地图
- [x] 底部：最近 5 条事件 log（半透明，可折叠）
- [x] 中央：短暂提示（不长期遮挡）

### 其他任务兼容性
- [x] "准备出门"任务可进入、可完成、可记录数据
- [x] "收拾餐桌"任务可进入、可完成、可记录数据
- [x] "洗衣分类"任务可进入、可完成、可记录数据

## 技术验证

- [x] `npm run build` 构建成功
- [x] `npm run lint` 代码检查通过（部分 hooks 警告为已知模式）
- [ ] 浏览器控制台无未捕获异常
- [ ] 3D 场景帧率 > 30fps
- [ ] 页面加载时间 < 5s
