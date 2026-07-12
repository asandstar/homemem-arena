# Current-State Delta Audit Spec

## Why

项目经过多轮迭代，部分历史文档与当前代码状态存在偏差。需要基于当前代码、测试、配置和 Git 历史进行一次全面审计，生成一份权威的当前状态报告，为后续开发决策提供基线。

## What Changes

- 新增 `docs/CURRENT_STATE_DELTA_AUDIT.md` 单一报告文件
- 运行 `npm test`、`npm run lint`、`npm run build`、`npm run qa` 并记录结果
- 不修改任何业务代码、现有文档、package.json 或 QA 脚本
- 不提交 Git，不推送远程

## Impact

- Affected code: 无（只读审计）
- Affected docs: 新增 `docs/CURRENT_STATE_DELTA_AUDIT.md`

## ADDED Requirements

### Requirement: Current-State Delta Audit Report

系统 SHALL 生成一份 `docs/CURRENT_STATE_DELTA_AUDIT.md` 报告，包含以下 16 个章节：

1. 仓库当前状态摘要
2. 当前真实架构（引用 useGameStore.ts、slices/、sceneGraph.ts、eventBus.ts 等具体文件和行号）
3. 已有文档清单（含 exists/lastUpdated/isOutdated/conflictsWithCode）
4. 已有 QA 和测试能力
5. 文档与代码冲突（逐条列出，附文件和行号）
6. 当前 Blocker
7. 当前 Critical
8. 当前 Major
9. 当前 Minor
10. 第一关是否可对外试玩
11. 四关当前可玩状态
12. 场景、UI、导航和稳定性风险
13. 测试覆盖缺口
14. 下一轮最多应修复的 5 个问题
15. 是否允许新增功能
16. 是否允许进入游戏性调优

#### Scenario: 审计完成
- **WHEN** 审计员完成代码阅读和命令运行
- **THEN** 生成 `docs/CURRENT_STATE_DELTA_AUDIT.md`，所有结论引用具体文件和行号
- **AND** 无法确认的内容标记为 unknown
- **AND** 历史报告中的问题经验证后才列为当前问题

#### Scenario: 命令不存在
- **WHEN** 某条 npm 命令不存在（如 e2e）
- **THEN** 记录为 missing，不临时修改 package.json

## MODIFIED Requirements

无。

## REMOVED Requirements

无。
