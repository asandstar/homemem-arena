# 方案：修复类似的 Vite 预编译缓存损坏 / 端口双栈 / 构建残留 SyntaxError 等问题

任务：task-leave-home（出门大作战）相关工程化加固
关联现象：之前 trae-preview 里出现的 `ERR_ABORTED node_modules/.vite/deps/lucide-react.js` / `ERR_ABORTED src/store/useToastStore.ts` / `SyntaxError: Unexpected identifier 'as'`
日期：2026-08-02
计划模式：Plan Mode（本文件是计划，等用户批后执行）

==================================================
一、Repo Research 结论 — 已发现的类似问题
==================================================

§1.1 已定位的直接问题（已用 rm -rf node_modules/.vite 临时解决过）
  - `node_modules/.vite/deps/` 预编译缓存有 2026-07-30 时间戳的 39 个 .js / .js.map / _metadata.json，旧哈希 v=77064ff1。
  - 升级 Vite v8.1.x 后旧 esbuild 预编译产物未被自动失效 → 部分文件半写入 → 浏览器加载残留 TS 语法 → 抛出 `Unexpected identifier 'as'` → 连锁 ABORT 上游模块。

§1.2 仍然存在的相似风险（本次需要系统性修复）
  风险 A：dev 默认双栈（IPv4/IPv6）不一致，127.0.0.1 可能连不上
    · `vite.config.ts` 未显式 `server.host: true` / `server.strictPort`；手动 `npm run dev:e2e` 时实际监听 `[::1]:5173`，
      但 BrowserUse / trae-preview / Playwright `baseURL: http://127.0.0.1:4173` / 各种代理配置都用 IPv4 `127.0.0.1`，
      结果 127.0.0.1:5177/5173 偶尔 `502 Bad Gateway` 或 `ERR_CONNECTION_REFUSED`，
      很容易被误判为 "ABORTED/SyntaxError" 的同类 bug（实际是网络层）。
  风险 B：TS "erasableSyntaxOnly + verbatimModuleSyntax" 但 .cjs/.mjs 脚本缺少 lint/typecheck 闭环
    · 现有 `scripts/b2-generate.cjs`、`scripts/b2-verify.cjs`、`scripts/b2v2-generate.cjs`、`scripts/b2v2-verify.cjs`、`scripts/_audit_hud_screenshots.mjs`、`scripts/_hud_minimap_impl_screenshots.mjs`
      这些 .cjs/.mjs 在 `tsconfig.app.json` 的 `"include": ["src"]` 之外，
      也没被 `qa:static`（tsconfig.app.json）覆盖，里面若有人未来写错 `const x = {} as Foo` 这类 TS 语法，
      会被 Vite 按 JS file 直接 serve → 浏览器端抛 `Unexpected identifier 'as'`，
      这是与刚刚"lucide-react.js as 片段"现象完全相同的一类问题（SyntaxError 从缓存残留变成脚本源文件）。
  风险 C：`.gitignore` 没把 `node_modules/.vite*` / `node_modules/.tmp` 显式忽略
    · 当前 gitignore 只有 `node_modules` 目录，但 `node_modules/.tmp/*.tsbuildinfo` 也会被 tsc 写入，
      虽然 node_modules 默认整体忽略，但万一将来有人把 `!node_modules/*.json` 反忽略，会把 Vite/TS 的中间产物意外污染到提交里。
  风险 D：Playwright `baseURL: 127.0.0.1:4173` vs dev:e2e 实际随机端口
    · playwright.config.ts baseURL 写死 4173，但 webServer 实际端口如果不是显式 `server.port: 4173`，
      改到 5173/5177 就会跑 E2E 时 "看起来像缓存/Syntax 问题"，其实是端口漂移（再次被误判为同类 bug）。
  风险 E：缺少"一键清理 + 启动前缓存完整性自检"脚本与文档
    · 目前只有用户手动执行 rm -rf node_modules/.vite 才能根治；没有 npm scripts 入口。
      当下次 Vite 升级 / 切换分支时，会再出现完全相同的 ABORTED/SyntaxError as 问题（可预测的重复陷阱）。
  风险 F：dev / dev:e2e 没有显式严格端口 / host
    · 如果两个进程同时启动（CI 里 playwright webServer + 本地手工 dev 并行），
      端口自动 +1 漂移到 5174 → 各种 trae-preview / BrowserUse 代理层 502 → 被误判为缓存损坏。
  风险 G：`tsconfig.app.json` / `tsconfig.node.json` 对 scripts/ 目录完全漏检
    · 前述 .cjs/.mjs 脚本没进 typecheck；未来 scripts 里写错 TS 语法（例如 `require(foo as string)`）
      会直接在浏览器端抛 `Unexpected identifier 'as'`，与 风险 B 同源。

==================================================
二、目标 / 修复范围
==================================================

§2.1 目标
  从配置和脚本层面系统性消除 7 类可预测的相似问题，确保：
    1) 未来 Vite 升级 / 切换分支后，不再出现 "半写入缓存导致浏览器 SyntaxError 'as'"；
    2) 127.0.0.1（IPv4）与 [::1]（IPv6）都能访问 dev / preview / dev:e2e；
    3) scripts/*.cjs/mjs 若引入 TS 语法可被 lint / typecheck 尽早发现；
    4) Playwright E2E 端口稳定对齐 baseURL，无 "表面像缓存、实际是端口漂移"；
    5) 给开发者提供两条命令：npm run vite:clean / npm run dev:clean（缓存 + 预编译一次性重建）；
    6) 未改动业务逻辑 / 任务数据 / 房间坐标 / 3D 渲染。

§2.2 不做范围（防止越界）
  - 不改 Vite/rolldown 打包策略（Scene3D 1.2MB chunk warn 保持既有）；
  - 不删 scripts/* 的任何逻辑，只加 typecheck / lint 覆盖；
  - 不加 pre-commit / husky 类 hooks；
  - 不升级 vite/tsc/esbuild 版本；
  - 不改 src/ 下的业务逻辑 / FirstPersonControls / HUD / clean-table 任务（这些仍由 PRE-P2.G1-B / P2.G1-B 阶段管理）。

==================================================
三、文件与模块改动清单
==================================================

| # | 文件 | 改动方向 | 具体内容 |
|---|---|---|---|
| 1 | [package.json](file:///Users/azq/asandstar/homemem-arena-web-demo/package.json) | 修改 scripts / 新增 3 条清理 + 3 条带 host:port 的 dev 脚本 | §四 3.1 |
| 2 | [vite.config.ts](file:///Users/azq/asandstar/homemem-arena-web-demo/vite.config.ts) | 增加 server host/port/hmr/preview/optimizeDeps 明确化 | §四 3.2 |
| 3 | [playwright.config.ts](file:///Users/azq/asandstar/homemem-arena-web-demo/playwright.config.ts) | webServer 显式 4173 + 端口冲突 fail fast | §四 3.3 |
| 4 | [tsconfig.json](file:///Users/azq/asandstar/homemem-arena-web-demo/tsconfig.json) | 新增 references 覆盖 scripts/ | §四 3.4 |
| 5 | 新文件 `tsconfig.scripts.json`（同目录） | 新增 | 用 JS checkJs=true 的宽松 TS 工程，把 scripts/*.cjs/*.mjs/*.ts 纳入 typecheck 入口；禁止 TS 语法侵入 .cjs/.mjs | §四 3.4 |
| 6 | [.gitignore](file:///Users/azq/asandstar/homemem-arena-web-demo/.gitignore) | 明确追加 Vite/TS 中间产物忽略条目 | §四 3.5 |
| 7 | 新文件 `scripts/vite-check-cache.cjs`（同目录） | 新增 | dev:clean / vite:clean 前可选择性自检；不做破坏性操作，只输出 node_modules/.vite/deps/_metadata.json 是否存在、哈希是否对应当前 lockfile（可后续补） | 暂时做轻量版：仅记录 clean 建议的提示脚本，暂不碰 lockfile 解析 |
| 8 | 新增（可选）一条 npm 脚本 `qa:static:scripts` — `tsc -p tsconfig.scripts.json --noEmit` | §四 3.4 |

==================================================
四、修改步骤
==================================================

§4.1 package.json scripts 新增
  新增条目（与既有 scripts 风格 camelCase/kebab 混合保持一致）：
    "vite:clean": "node -e \"require('fs').rmSync(require('path').join(process.cwd(), 'node_modules/.vite'), { recursive: true, force: true })\"",
    "tsbuildinfo:clean": "node -e \"require('fs').rmSync(require('path').join(process.cwd(), 'node_modules/.tmp'), { recursive: true, force: true })\"",
    "cache:clean": "npm run vite:clean && npm run tsbuildinfo:clean",
    "dev:clean": "npm run cache:clean && vite",
    "dev:e2e:clean": "npm run cache:clean && vite --mode e2e --host 127.0.0.1 --strictPort --port 4173",
    "dev:stable": "vite --host 127.0.0.1 --strictPort --port 5173",
    "dev:e2e:stable": "vite --mode e2e --host 127.0.0.1 --strictPort --port 4173",
    "qa:static:scripts": "tsc -p tsconfig.scripts.json --noEmit"

  qa 命令末尾追加一次 qa:static:scripts 吗？
    → 本阶段不直接把 qa:static:scripts 塞进 npm run qa（怕影响已有 qa 基线），
       仅新增独立命令，作为"可手工调用"的防御性 typecheck；
       如果未来想自动纳入 qa 流水线，可在下一阶段单独提案。

§4.2 vite.config.ts 修改（不改 base/plugins/test，只加 server / preview / optimizeDeps）
  在 defineConfig 返回对象中新增：
    server: {
      host: '127.0.0.1',       // 消除 IPv4/IPv6 双栈不定性；与 playwright/preview baseURL 一致
      port: 5173,
      strictPort: true,        // 端口被占用时 fail fast，不漂移
      hmr: { host: '127.0.0.1', port: 5173 }, // HMR 不回落到随机端口
    },
    preview: {
      host: '127.0.0.1',
      port: 4173,              // 与 playwright.config.ts baseURL=4173 一致
      strictPort: true,
    },
    optimizeDeps: {
      // 预编译入口显式声明：@react-three/* 系列如果未在这里声明，
      // 很容易在首次进入 3D 页时"中途预编译 + 切页打断"造成半写缓存。
      include: [
        'react',
        'react-dom',
        'react-dom/client',
        'react-router-dom',
        'zustand',
        'zustand/middleware',
        'three',
        'three/examples/jsm/loaders/GLTFLoader.js',
        '@react-three/fiber',
        '@react-three/drei',
        'lucide-react',
      ],
      // Vite 升级时强制让 optimizeDeps 哈希依赖 vite 补丁版本，
      // 避免 7.1 → 8.1 升级后仍复用旧 v=77064ff1 产物。
      // Vite 提供的官方字段：optimizeDeps.force 不建议默认 true；用 esbuildOptions 保持稳定：
      esbuildOptions: {
        target: 'es2022',
        tsconfigRaw: '{"compilerOptions":{"target":"es2022","module":"esnext","moduleResolution":"bundler","jsx":"react-jsx"}}',
      },
    },

  说明：
    - `host: '127.0.0.1'` 会改变您平时用 `localhost` 访问吗？
      → 不会。`localhost` DNS 解析优先拿 A 记录（127.0.0.1）；`http://localhost:5173` 照旧可用，
         只是明确 Vite 只绑定 IPv4，不会落到 IPv6-only 监听导致 127.0.0.1 拒绝连接。
    - strictPort=true：如果 5173 已占用，会报错 `Port 5173 is in use` 而不是默默升到 5174
      → 这正好让端口漂移问题"显式暴露"而非"静默伪装成缓存损坏"。

§4.3 playwright.config.ts 端口对齐
  在 config 顶层（export default defineConfig({...}) 中）加：
    webServer: {
      command: 'npm run dev:e2e:stable',  // 与 package.json 新增脚本同名，走 127.0.0.1:4173 strictPort
      url: 'http://127.0.0.1:4173',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },

  说明：
    - 与 `use.baseURL = http://127.0.0.1:4173` 完全对齐 → E2E 不会再 "看起来像缓存错误实际只是跑到 5177/5173"；
    - reuseExistingServer 在本地 true：如果您已起了 dev:e2e:stable，Playwright 不再重复启动；
      CI=false：每次都自己启，确保洁净。

§4.4 tsconfig.scripts.json 与 typecheck 入口
  文件：tsconfig.scripts.json（同级）
    {
      "compilerOptions": {
        "target": "es2022",
        "module": "nodenext",
        "moduleResolution": "nodenext",
        "allowJs": true,
        "checkJs": true,        // scripts/*.cjs/*.mjs 走语义检查；发现 `x as T` / `import type Foo` / `<T>` 这类 TS 语法会立刻报错
        "resolveJsonModule": true,
        "esModuleInterop": true,
        "forceConsistentCasingInFileNames": true,
        "skipLibCheck": true,
        "noEmit": true,
        "strict": false,        // scripts 不强制严格类型（避免历史脚本被 block），但 TS 语法侵入一定报错
        "types": ["node"]
      },
      "include": [
        "scripts/**/*.cjs",
        "scripts/**/*.mjs",
        "scripts/**/*.ts",
        "playwright.config.ts"   // playwright.config 目前在 tsconfig.node 的 include 之外，顺手补上
      ]
    }

  并在 tsconfig.json 的 references 数组追加：
    { "path": "./tsconfig.scripts.json" }
    （tsc -b 时会一起纳入 build matrix，但 noEmit=true 不生成产物，仅做检查）

  说明：
    - 关键是 allowJs + checkJs=true 对 .cjs/.mjs 文件做"词法级" JS 语义解析；
      任何 `as Foo` / `import type {}` / `<T>x` 等 TS 语法一出现就会在 `npm run qa:static:scripts` 时报错，
      而不是等到浏览器端 SyntaxError 'as' 才发现（这就是把 §1.2 风险 B/G 从运行时前移到静态检查）。

§4.5 .gitignore 追加显式忽略条目
  在现有的 "dist / dist-ssr / node_modules" 基础上追加：
    # Vite 预编译缓存 & TypeScript build info
    node_modules/.vite/
    node_modules/.vite-temp/
    node_modules/.tmp/
    *.tsbuildinfo

  （虽然 node_modules 已经整体忽略，但这里把常见中间缓存 dir 显式列出，
    防止未来出现 `!node_modules/xyz.json` 反忽略写法意外放行。）

§4.6 （轻量）scripts/vite-check-cache.cjs
  一个不做破坏性动作的诊断脚本，执行时输出：
    · node_modules/.vite 是否存在；
    · _metadata.json 是否存在；
    · 建议如果"升级 vite/换分支/换 node 版本"则先运行 npm run cache:clean。
  它不会 rm，仅打印；用于以后出现奇怪 ABORTED 时辅助 triage。

==================================================
五、新增代码的依赖与注意事项
==================================================

§5.1 依赖
  - 不新增 npm deps；全部使用 Node.js 内置 fs/path + Vite/Playwright 已提供的配置字段。

§5.2 注意事项
  - vite.config.ts 的 `server.port=5173 strictPort=true`：
      若本地已有进程占用 5173（例如旧 vite 没关掉），dev 会启动失败并提示端口占用；
      这是"有意为之"：把模糊的端口漂移问题变为显式故障，用户能一眼识别。
  - playwright.config.ts 加 webServer：
      如果您手工已经跑了 dev:e2e:stable （reuseExistingServer=true），Playwright 会复用，不会重复起两个进程；
      如果未来 CI 环境跑 npx playwright test，会自己走 `npm run dev:e2e:stable` 起 4173。
  - tsconfig.scripts.json 的 strict=false：
      故意不严格，只做"TS 语法侵入 .cjs/.mjs 一定报错"的守门人；
      若要把 scripts 全部 TS 化，可在下一阶段单独提案，不混在本方案里。

==================================================
六、验证计划（用户批后执行时的动作）
==================================================

§6.1 命令验证
  1. `npm run vite:clean`
     预期：node_modules/.vite 被删（不报错，如果原本不存在也不报错）。
  2. `npm run tsbuildinfo:clean`
     预期：node_modules/.tmp 被删。
  3. `npm run cache:clean && npm run dev:stable`
     预期：Vite 监听 `http://127.0.0.1:5173`；浏览器访问 127.0.0.1:5173 → 200 OK；
           Vite 控制台有预编译 lucide-react / react-router-dom / @react-three/drei 等明确日志。
  4. `npm run dev:e2e:stable`
     预期：Vite 监听 127.0.0.1:4173；lsof -iTCP:4173 -sTCP:LISTEN 能看到 vite。
  5. `npm run preview`
     预期：vite preview 监听 127.0.0.1:4173 strictPort。
  6. `npm run qa:static:scripts`
     预期：tsc -p tsconfig.scripts.json --noEmit 0 errors；scripts/*.cjs/*.mjs 没有 TS 语法侵入。
  7. `npm run lint`
     预期：14 warnings 0 errors 基线不变。
  8. `npm run build`
     预期：tsc -b 0 errors；vite build 成功（Scene3D chunk warn 既有）。
  9. `BASEURL=http://127.0.0.1:4173 npx playwright test tests/e2e/clean-table-command-flow.spec.ts --project=chromium --reporter=list`
     预期：11 passed，retries=0，skipped=0，flaky=0。
  10. BrowserUse 进入 L1 关卡再次抓 console
      预期：net::ERR_ABORTED 条数 = 0；hasUnexpectedAs=false；hasToastStoreAbort=false。

§6.2 回归边界
  - 不改业务代码，预期 335/335 tests 通过；150/150 QA 通过。
  - 不改 git status 中除以上文件外的任何源码。

==================================================
七、风险与处理
==================================================

风险 1：strictPort=true 导致本地老进程占端口 → dev 直接起不来
  处理：给用户报错提示（让用户 `lsof -iTCP:5173 / pkill -f vite`）；
        另提供 `dev:stable` / `dev:e2e:stable` 两种明确端口脚本，用户可按需改端口（但本方案默认严格）。

风险 2：optimizeDeps.include 列表以后漏了新的重型 3D 库
  处理：include 列表是"建议"，不是硬限制；Vite 仍可按需懒编绎，
        只是首次进页预编译更稳定，真漏了可在下一次小改里补。

风险 3：tsconfig.scripts.json checkJs=true 导致 scripts 历史代码出现巨量 warn/error
  处理：strict=false + 只做 `qa:static:scripts` 独立命令，不挂入 npm run qa；
        如果历史 scripts 有 1000 个 warn，也不会影响现有 qa 基线。

风险 4：Playwright webServer 命令与已有 workflows/.github 不一致
  处理：本方案不改 deploy.yml；.github 如果用了不同端口，不在本方案范围内。
        只确保 playwright.config.ts 内部的 baseURL 与 webServer url 一致。

==================================================
八、最终交付物
==================================================

  - package.json 新增 8 条 npm scripts；
  - vite.config.ts 新增 server/preview/optimizeDeps 配置块；
  - playwright.config.ts 新增 webServer 配置块；
  - 新增 tsconfig.scripts.json；tsconfig.json references 追加 1 条；
  - .gitignore 追加中间缓存显式忽略；
  - 新增 scripts/vite-check-cache.cjs（诊断脚本，只读不删）。

交付后，您能：
  · 再遇到类似 `ERR_ABORTED lucide-react` / `Unexpected identifier 'as'`，
    直接一条 `npm run dev:clean` 即复位（不必手工 rm node_modules/.vite）。
  · 端口漂移 / IPv4 IPv6 双栈不一致 → 变成显式报错，不再伪装成缓存错误。
  · scripts/*.cjs/*.mjs 里写 TS 语法 → npm run qa:static:scripts 立刻发现。
