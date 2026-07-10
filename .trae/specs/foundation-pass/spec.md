# Foundation Pass - Product Requirement Document

## Overview
- **Summary**: 对游戏的基础操作、物体摆放、碰撞限位和 UI 布局进行系统性修复和统一。建立统一的坐标系规范、移动控制、碰撞系统、物体放置规则和 HUD 布局体系，解决反复出现的方向反向、穿墙、悬空、UI 重叠等问题。
- **Purpose**: 终结零散补丁式修复，建立稳定的基础层，让后续功能开发有可靠的根基。
- **Target Users**: 所有游戏玩家，特别是第一关和第二关的玩家。

## Goals
- 建立唯一的坐标系和移动控制规范，方向不再反复
- 实现完整的鼠标视角控制（yaw + pitch）
- 修复穿墙问题，玩家稳定在房间内移动
- 系统性解决物体悬空，所有物体贴合表面
- HUD 面板支持收起，不同分辨率下不重叠
- 小地图支持拖动、缩放、收起，能看全当前关卡所有房间
- 第一关和第二关能稳定试玩

## Non-Goals (Out of Scope)
- 不新增剧情、配音、关卡机制
- 不下载新的 GLB 模型
- 不引入大型依赖
- 不重写整个项目
- 不做移动端适配（本轮只做桌面端）
- 不做家具精细碰撞（只保证墙体碰撞）

## Background & Context
当前游戏存在多个反复出现的基础问题：
1. WASD 方向多次修反复，根因是缺少单一真值来源
2. 鼠标只能左右转不能上下看，pitch 功能完全缺失
3. 玩家能穿墙，碰撞是离散检测且家具碰撞后不回查边界
4. 物体悬空反复修不好，根因是模型高度和 pivot 不统一
5. HUD 面板在小屏幕下重叠，缺少收起机制
6. 小地图默认跟随玩家，看不到全局

已完成审计文档：`FOUNDATION_AUDIT.md`

## Functional Requirements

### FR-1: 统一坐标系与移动控制
- 建立 `playerControls.ts` 作为唯一的移动计算来源
- 明确 Three.js 默认 forward = -Z
- 相机 yaw（rotation.y）与 robotRotation 统一
- 支持 pitch（rotation.x），限制在 -60° ~ +60°
- 禁止 roll（rotation.z = 0）
- 第一人称相机高度固定 1.6m
- 移动速度单位为 m/s，乘以 deltaTime
- 视角切换（V 键）后移动方向仍然正确
- Pointer lock 状态不影响 WASD 移动逻辑

### FR-2: 碰撞与房间切换
- 建立 `collision.ts` 统一碰撞系统
- 玩家碰撞半径 0.3m
- 房间墙体不可穿越
- 门洞是边界上的通行例外
- 撞墙时沿墙滑动，不直接卡死
- 房间切换有冷却时间，避免门口抖动
- 家具碰撞后回查房间边界，防止推出墙外
- 门模型不挡路（视觉装饰）

### FR-3: 物体放置与表面贴合
- 建立统一的模型高度注册表
- 每个模型定义 approximateHeight / boundingHeight
- GLB 和 fallback 模型统一底部贴地
- 物体 y = surfaceY + objectHalfHeight + zFightOffset
- 容器定义 surfaceHeight 或 topY
- 装饰物、任务物品、家具都不能肉眼悬空
- 小物体 0.01-0.03 防 z-fighting 偏移

### FR-4: HUD 布局与可收起窗口
- 所有 HUD 面板支持收起/展开
- 任务面板：Tab 键切换，默认展开
- 事件日志：R 键切换，默认收起
- 小地图：可收起、可拖动、可缩放
- 操作提示：可收起，H 键隐藏全部辅助 UI
- 记忆槽：常驻底部，不遮挡中央
- 音效开关留在得分面板内
- UI 状态保存到 localStorage
- 1440px 宽度下不重叠
- 1280px 宽度下仍然可用
- 小屏幕自动进入 compact 模式

### FR-5: 小地图增强
- 支持拖动 pan
- 支持滚轮缩放
- 支持 + / - 按钮缩放
- 支持 reset view（fit-to-view）
- 默认 fit-to-view 当前关卡所有房间
- 只显示当前关卡可到达房间
- 当前房间高亮，相邻房间高亮
- 房间名中文显示
- 小地图内部 pointer events 不冒泡
- 小地图不被其他 UI 挡住

## Non-Functional Requirements

- **NFR-1**: 连续移动 30 秒无明显卡顿
- **NFR-2**: 画面不抖（无 camera/rotation 互相追逐）
- **NFR-3**: 控制台无严重红色错误
- **NFR-4**: `npm run build` 通过
- **NFR-5**: 第一关和第二关可稳定试玩

## Constraints

- **Technical**: React + TypeScript + Three.js + R3F + Zustand
- **Business**: 不新增剧情/配音/关卡/模型
- **Dependencies**: 不引入大型新依赖

## Assumptions

- 地板顶面 y ≈ 0.05（地板厚度 0.1，中心在 y=0），但视觉上物体从 y=0 开始放置即可
- 玩家身高 1.6m 是合理的第一人称视角高度
- 玩家碰撞半径 0.3m 是合理的
- pitch 限制 -60° ~ +60° 足够游戏使用

## Acceptance Criteria

### AC-1: WASD 方向正确
- **Given**: 玩家在第一人称视角下
- **When**: 按 W 键
- **Then**: 玩家向屏幕前方移动
- **Verification**: `human-judgment`

### AC-2: 鼠标视角完整
- **Given**: 玩家在游戏中按住鼠标左键拖动
- **When**: 上下左右移动鼠标
- **Then**: 视角对应上下左右旋转，pitch 在 -60°~+60° 范围内
- **Verification**: `human-judgment`

### AC-3: 不穿墙
- **Given**: 玩家在房间内
- **When**: 朝墙体方向移动
- **Then**: 玩家被墙体阻挡，可沿墙滑动，不会穿到外面
- **Verification**: `human-judgment`

### AC-4: 门洞通行正常
- **Given**: 玩家靠近门洞
- **When**: 朝门洞方向移动
- **Then**: 玩家自然通过门洞进入相邻房间，无抖动或反复切换
- **Verification**: `human-judgment`

### AC-5: 物体不悬空
- **Given**: 第二关餐桌上的物体
- **When**: 观察杯子、盘子、遥控器等
- **Then**: 物体底部贴合桌面，无肉眼可见悬空
- **Verification**: `human-judgment`

### AC-6: HUD 不重叠且可收起
- **Given**: 1440px 宽度屏幕
- **When**: 查看所有 HUD 面板
- **Then**: 面板之间不重叠，任务面板和事件日志可分别收起
- **Verification**: `human-judgment`

### AC-7: 小地图功能完整
- **Given**: 第一关游戏中
- **When**: 操作小地图
- **Then**: 可以拖动、缩放、重置，能看到当前关卡所有房间
- **Verification**: `human-judgment`

### AC-8: 构建通过
- **Given**: 代码修改完成
- **When**: 执行 `npm run build`
- **Then**: 构建成功，无 TypeScript 错误
- **Verification**: `programmatic`

### AC-9: 两关可玩
- **Given**: 第一关和第二关
- **When**: 正常试玩
- **Then**: 可以完成基本移动、拾取、放置操作，无阻断性 bug
- **Verification**: `human-judgment`

## Open Questions

- 无（需求已明确）
