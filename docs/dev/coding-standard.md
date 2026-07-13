# HomeMem Arena - 编码规范

## 1. 代码风格

### 1.1 TypeScript

- 使用 TypeScript 6，开启严格模式
- 所有函数、变量、接口必须有类型声明
- 使用 `interface` 定义对象类型，`type` 定义联合类型
- 使用 `const` 代替 `let`，除非需要重新赋值
- 避免 `any` 类型，使用 `unknown` 或具体类型

### 1.2 React

- 使用函数组件 + Hooks
- 使用 TypeScript 泛型定义组件 props
- 使用 `React.memo` 优化性能
- 自定义 Hooks 以 `use` 开头
- 避免在循环中使用 Hooks

### 1.3 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 变量 | 驼峰命名 | `playerPosition`, `currentTask` |
| 函数 | 驼峰命名 | `playSfx`, `saveGame` |
| 类/接口 | Pascal命名 | `EntityState`, `ParticleEffect` |
| 常量 | 全大写+下划线 | `MAX_MEMORIES`, `SAVE_INTERVAL` |
| 文件 | 驼峰命名 | `entitySlice.ts`, `ParticleRenderer.tsx` |
| 目录 | 小写+连字符 | `arena3d`, `game-logic` |

## 2. 状态管理

### 2.1 Zustand

- 使用切片式状态管理
- 每个切片负责一个功能模块
- Action 命名使用动词开头：`pickEntity`, `saveMemory`
- 使用 `immer` 进行不可变更新（可选）
- 避免在 Action 中执行副作用，使用中间件

### 2.2 状态切片结构

```typescript
// slice.ts
export const createSlice = (set, get) => ({
  state: initialState,
  action: () => set((state) => { ... }),
  selector: () => get().state,
})
```

## 3. 3D 组件

### 3.1 React Three Fiber

- 使用 `useRef` 存储 Three.js 对象引用
- 使用 `useFrame` 处理帧更新逻辑
- 使用 `useThree` 获取 Three.js 上下文
- 组件命名以 `Renderer` 结尾：`EntityRenderer`, `ParticleRenderer`

### 3.2 性能优化

- 使用 `InstancedMesh` 渲染大量相同物体
- 使用 `useMemo` 缓存几何体和材质
- 使用 `useEffect` 清理 Three.js 对象

## 4. 音频系统

### 4.1 BGM

- 使用 Web Audio API 创建程序化音乐
- 使用多层音轨架构
- 实现淡入淡出效果
- 提供音量控制接口

### 4.2 SFX

- 使用短音频片段
- 使用 `AudioContext` 统一管理
- 支持停止和重置
- 提供音量控制接口

## 5. 游戏逻辑

### 5.1 碰撞检测

- 使用 AABB 碰撞检测
- 实现滑动碰撞避免卡住
- 使用距离检测判断交互范围

### 5.2 脚本事件

- 事件定义为纯函数
- 支持步数触发和条件触发
- 使用消息系统传递事件信息

## 6. 测试规范

### 6.1 单元测试

- 使用 Vitest 编写单元测试
- 测试文件放在 `tests/` 目录
- 测试文件命名：`*.test.ts`
- 覆盖核心逻辑和工具函数

### 6.2 端到端测试

- 使用 Playwright 编写 E2E 测试
- 测试文件放在 `tests/e2e/` 目录
- 测试完整游戏流程

## 7. Git 工作流

### 7.1 分支规范

| 分支类型 | 命名 | 用途 |
|---------|------|------|
| 主分支 | `main` | 生产版本 |
| 开发分支 | `develop` | 开发中版本 |
| 特性分支 | `feature/xxx` | 新功能开发 |
| 修复分支 | `fix/xxx` | Bug修复 |
| 文档分支 | `docs/xxx` | 文档更新 |

### 7.2 Commit 规范

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

| Type | 描述 |
|------|------|
| `feat` | 新功能 |
| `fix` | Bug修复 |
| `docs` | 文档更新 |
| `style` | 代码格式 |
| `refactor` | 重构 |
| `test` | 测试 |
| `chore` | 构建/工具 |

### 7.3 PR 规范

- PR 标题清晰描述变更内容
- PR 描述包含变更说明和测试步骤
- 需要至少一位 reviewer 批准
- 通过 CI 检查后才能合并

## 8. 代码审查标准

| 检查项 | 标准 |
|--------|------|
| 类型安全 | 无 `any`，类型定义完整 |
| 代码质量 | 无未使用变量，无重复代码 |
| 性能优化 | 使用合适的渲染和状态管理策略 |
| 可维护性 | 代码结构清晰，注释充分 |
| 测试覆盖 | 核心逻辑有测试覆盖 |

## 9. 文档规范

### 9.1 文档类型

| 类型 | 目录 | 内容 |
|------|------|------|
| 设计文档 | `docs/design/` | 游戏设计、关卡设计、核心机制 |
| 技术文档 | `docs/tech/` | 架构、状态管理、系统实现 |
| 数据文档 | `docs/data/` | 任务配置、实体定义 |
| 开发指南 | `docs/dev/` | 环境搭建、编码规范 |

### 9.2 文档格式

- 使用 Markdown 格式
- 标题使用 `#` 层级
- 代码使用反引号包裹
- 使用表格展示数据
- 使用 emoji 增强可读性

## 10. 最佳实践

### 10.1 性能

- 使用 React.memo 避免不必要的重渲染
- 使用 useMemo 和 useCallback 缓存计算和回调
- 优化 Three.js 渲染性能

### 10.2 可访问性

- 使用语义化 HTML
- 添加 ARIA 属性
- 支持键盘导航

### 10.3 国际化

- 使用 i18n 方案
- 分离文本和代码
- 支持多种语言

### 10.4 安全性

- 避免 XSS 攻击
- 安全处理用户输入
- 使用 HTTPS

## 11. 工具配置

### 11.1 ESLint

```json
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended"
  ],
  "rules": {
    "no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "error",
    "react/react-in-jsx-scope": "off"
  }
}
```

### 11.2 Prettier

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "printWidth": 100,
  "trailingComma": "es5"
}
```

### 11.3 TypeScript

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictPropertyInitialization": true
  }
}
```
