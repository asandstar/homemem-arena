# Echo House: Memory Butler - 3D 模型升级 Verification Checklist

## 资产管线架构
- [ ] Checkpoint 1: 有完整的资产目录结构（public/assets/models/props/furniture/decor）
- [ ] Checkpoint 2: ModelRegistry 包含所有模型配置（路径、scale、rotation、fallback）
- [ ] Checkpoint 3: ModelAsset 组件支持 GLB 加载 + fallback 降级
- [ ] Checkpoint 4: 加载失败不会白屏，自动显示 fallback

## 任务物体模型
- [ ] Checkpoint 5: 钥匙有可识别的钥匙环、钥匙柄、齿形
- [ ] Checkpoint 6: 手机有机身、屏幕、摄像头
- [ ] Checkpoint 7: 雨伞有长柄、弯钩、伞面
- [ ] Checkpoint 8: 牛奶盒有屋顶形、标签、盖子
- [ ] Checkpoint 9: 麦片盒有高盒体、正面图案
- [ ] Checkpoint 10: 杯子有杯身、把手、杯口
- [ ] Checkpoint 11: 碗有浅碗形状、内外颜色区分
- [ ] Checkpoint 12: 盘子有扁圆盘、边缘凸起
- [ ] Checkpoint 13: 遥控器有细长机身、按钮阵列
- [ ] Checkpoint 14: 衣物有折叠形状、折线感
- [ ] Checkpoint 15: 毛巾有长条布料感、折痕
- [ ] Checkpoint 16: 垃圾有揉皱纸团感

## 家具容器模型
- [ ] Checkpoint 17: 冰箱有柜体、门缝、把手、开门状态、内部层架
- [ ] Checkpoint 18: 橱柜有门板、把手、开关状态
- [ ] Checkpoint 19: 水槽有台面、水槽凹陷、水龙头
- [ ] Checkpoint 20: 洗碗机有门板、把手、状态灯
- [ ] Checkpoint 21: 沙发有底座、靠背、扶手、靠枕
- [ ] Checkpoint 22: 茶几有桌面、桌腿、杂物装饰
- [ ] Checkpoint 23: 床有床架、被子、枕头
- [ ] Checkpoint 24: 书桌有桌面、抽屉、台灯
- [ ] Checkpoint 25: 洗衣篮有篮筐、标签牌、内部空间
- [ ] Checkpoint 26: 玄关托盘有浅托盘、目标区域高亮

## 房间生活感
- [ ] Checkpoint 27: 玄关有门、鞋柜、托盘、伞架、地垫、挂钩
- [ ] Checkpoint 28: 客厅有沙发、茶几、电视柜、地毯、落地灯、靠枕
- [ ] Checkpoint 29: 厨房有冰箱、橱柜、水槽、垃圾桶、洗碗机
- [ ] Checkpoint 30: 卧室有床、床头柜、书桌、衣柜、台灯
- [ ] Checkpoint 31: 洗衣区有洗衣机、三个洗衣篮、毛巾架
- [ ] Checkpoint 32: 餐厅有餐桌、椅子、吊灯、餐具

## 视觉风格统一
- [ ] Checkpoint 33: 整体有统一的 low-poly / cozy home 风格
- [ ] Checkpoint 34: 背景家具低饱和暖色，任务物体更高饱和
- [ ] Checkpoint 35: 记忆相关用蓝紫色 glow
- [ ] Checkpoint 36: 正确交互用绿色 pulse
- [ ] Checkpoint 37: 错误交互用红色 warning
- [ ] Checkpoint 38: 地面和墙面是温暖低饱和色，不纯白/纯灰

## 光照和阴影
- [ ] Checkpoint 39: 有环境光 + 主方向光 + 房间点光源
- [ ] Checkpoint 40: 客厅偏暖，厨房略冷，卧室柔和
- [ ] Checkpoint 41: 物体有阴影或接触阴影，不漂浮
- [ ] Checkpoint 42: 关键物体 hover 时有 rim glow

## 交互反馈
- [ ] Checkpoint 43: hover 时物体有高亮发光
- [ ] Checkpoint 44: 正确放置时有绿色脉冲
- [ ] Checkpoint 45: 错误放置时有红色警告和抖动
- [ ] Checkpoint 46: 保存记忆时有视觉反馈
- [ ] Checkpoint 47: 捣乱事件有特效提示

## 功能验证
- [ ] Checkpoint 48: 第一关「出门大作战」完整可玩
- [ ] Checkpoint 49: 其他三个关卡可以正常进入
- [ ] Checkpoint 50: 拾取和放置功能正常
- [ ] Checkpoint 51: 容器开关功能正常
- [ ] Checkpoint 52: 脚本事件正常触发

## 技术验证
- [ ] Checkpoint 53: npm run build 构建成功
- [ ] Checkpoint 54: 无 TypeScript 编译错误
- [ ] Checkpoint 55: 控制台无红色严重错误
- [ ] Checkpoint 56: 帧率保持流畅（30fps 以上）
