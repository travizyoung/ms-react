# AGENTS.md

本文件是本项目的**项目级 agent 指令**，所有在本仓库工作的 agent 必须遵守。

## 1. 项目定位

这是一个 **React 面试题准备**项目（React 19 + TypeScript + Vite + Vitest），
用三种载体覆盖面试知识：

| 载体 | 位置 | 作用 |
| --- | --- | --- |
| 理论笔记 / 面试问答 | `docs/knowledge/<slug>.md` | 结论、原理、追问、易错点 |
| 可运行验证 | `src/demos/<slug>/` | 用最小代码跑出结论，页面可见 |
| 手写练习 + 单测 | `src/exercises/<name>/` | 非理论知识点（手写实现）的刻意练习 |

**知识点内容由用户提供。** 用户没给出具体知识点时，不要自己臆造大面积知识内容、
不要替他决定学习顺序；先把工程结构和可扩展的骨架搭稳，再按用户给的知识点逐条落地。

原则：**能跑 > 能测 > 写得多**。不要写无法运行、无法验证的「伪代码笔记」。

## 2. 技术栈与命令

- React 19、TypeScript（`tsc -b`，`strict` 默认 + `noUnusedLocals`）、Vite 8、oxlint
- 测试：Vitest 5（`jsdom`、`globals: true`、`@testing-library/react`、`@testing-library/user-event`、`jest-dom`）
- 测试 setup：`src/test/setup.ts`（已注入 jest-dom + 每例 `cleanup()`）
- 路径别名：`@/` → `src/`（`vite.config.ts` + `tsconfig.app.json` 同步维护）
- 测试文件匹配：`src/**/*.{test,spec}.{ts,tsx}`

```bash
npm run dev            # dev server（demo 站点）
npm run build          # tsc -b + vite build
npm run typecheck      # tsc -b
npm run lint           # oxlint
npm test               # vitest run（单次）
npm run test:watch     # vitest watch
npm run verify         # typecheck + lint + test —— 交付前必跑
```

## 3. 目录结构

```
.
├── AGENTS.md                  # 本文件（项目级 agent 指令）
├── docs/
│   ├── README.md              # 三类载体的分工说明
│   └── knowledge/             # 每个知识点一个 md + README.md 索引
├── src/
│   ├── main.tsx               # 入口
│   ├── App.tsx                # demo 站点外壳（侧边栏 + 选中 demo）
│   ├── index.css              # 全局样式
│   ├── demos/
│   │   ├── types.ts           # Demo 元信息接口
│   │   ├── index.ts           # demo 注册表
│   │   └── <slug>/
│   │       ├── Demo.tsx       # demo 组件（默认导出）
│   │       └── index.ts       # 导出 demo 元信息 { id, title, summary, topic?, Component }
│   ├── exercises/
│   │   ├── README.md          # 练习约定（必读）
│   │   └── <name>/
│   │       ├── index.ts(x)    # 实现
│   │       └── index.test.ts(x) # 单测，与实现成对存在
│   └── test/setup.ts          # vitest setup
└── vite.config.ts             # vite + vitest 配置（含 @ 别名）
```

`src/demos/hello-react/`、`src/exercises/curry/`、`src/exercises/use-toggle/`
是**约定模板**，只用于示范写法，不要当成题目本身，也不要无理由删除。

## 4. 硬性规则

### 4.1 练习与单测强绑定（最高优先级）

- `src/exercises/<name>/index.ts(x)` 与 `src/exercises/<name>/index.test.ts(x)` **必须成对存在**。
  新增练习必须同时写单测。
- **任何练习实现的改动（行为、签名、边界、性能优化、重命名）都必须同步更新对应单测**，
  并在同一次改动内完成。不允许「先改实现，测试回头再说」。
- 改完必须实际执行 `npm test`（或 `npm run verify`）并确认通过，不得只声称通过。
- 单测至少覆盖：happy path、边界值（空/0/负数/重复调用）、异常或降级路径；
  至少一个断言能捕获回归（不允许 `expect(true).toBe(true)` 之类占位测试）。
- 禁止用 `toMatchSnapshot()` 作为唯一断言。

### 4.2 知识点落地流程

用户给出一个知识点（如「事件循环」「useEffect 依赖」）时：

1. `docs/knowledge/<slug>.md`：按 `docs/knowledge/README.md` 的模板写，
   开头一句可直接背的结论，然后原理、可运行验证指引、常见面试题、易错点。
2. `src/demos/<slug>/`：写最小可运行验证（`Demo.tsx` + `index.ts` 元信息），
   在 `src/demos/index.ts` 注册；`topic` 填 slug。
3. 若该知识点有「可手写」的部分 → `src/exercises/<name>/` 实现 + 单测。
4. 更新 `docs/knowledge/README.md` 索引表（slug / 标题 / demo / 相关练习）。

没有可手写部分、或没有可运行验证必要的知识点，就不硬凑，不要为了填模板造垃圾代码。

### 4.3 代码风格

- TypeScript 优先，**禁止 `any`**；确实需要时用 `unknown` + 收窄，或泛型/`satisfies`。
- 函数组件 + Hooks；不写 class 组件（除非该知识点本身在讲 class 组件生命周期）。
- demo 要能直接说明结论：页面上展示输入 → 输出、副作用顺序、渲染次数等可观察信息，
  而不是一堆静态文字。
- 命名：文件/目录 kebab-case，组件 PascalCase，hook `useXxx`。
- 组件文件默认导出组件；**元信息对象（如 `demo`）不要和组件写在同一文件**，
  放到 `index.ts` 里，避免触发 `react/only-export-components`（HMR）告警。
- 不新增依赖，除非确实必要，且要在回复里说明理由。
- 注释写「为什么」，不要复述代码；文档和注释用中文，标识符用英文。

### 4.4 测试约定

- 组件用 role/text/label 查询（`getByRole`、`findByText`），避免 `container.querySelector`
  和测试 class 名。
- 交互用 `@testing-library/user-event`；异步用 `findBy*` / `waitFor`。
- 假定时器：`vi.useFakeTimers()` 必须在 `afterEach` 恢复（`vi.useRealTimers()`）。
- hook 用 `renderHook` + `act`；需要验证引用稳定就 `rerender` 后比较。
- 避免测试之间共享可变状态；每个用例自带数据。

### 4.5 不碰的东西

- 不提交 `node_modules/`、`dist/`、`coverage/`。
- 不修改 `src/test/setup.ts` 的清理逻辑，除非有明确理由。
- 不改 `package.json` 里的 `verify` 脚本语义。
- 不为了过 lint/测试而放宽配置或加 `eslint-disable`/`@ts-expect-error` 掩盖问题。

## 5. 交付前自检清单

- [ ] `npm run verify` 通过（typecheck + lint + test 全绿）
- [ ] 动过的练习，单测已同步更新且覆盖新行为
- [ ] 新增 demo 已在 `src/demos/index.ts` 注册，`npm run dev` 能看到
- [ ] 新增知识点文档已加进 `docs/knowledge/README.md` 索引
- [ ] 没有 `any`、没有注释掉的死代码、没有占位测试
