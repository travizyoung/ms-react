# 练习目录约定

这里放**非理论**知识点的手写练习（手写防抖、手写 Promise、手写 diff、手写 hooks 等）。
每个练习一个目录，实现与单测同目录、同名。

```
src/exercises/
├── curry/
│   ├── index.ts        # 实现
│   └── index.test.ts   # vitest 单测（与实现一一对应）
└── use-toggle/
    ├── index.ts        # React hook 实现（需要 JSX 时用 index.tsx）
    └── index.test.ts
```

## 硬性规则

1. **练习与单测必须成对出现**：新增练习必须同时新增 `index.test.ts(x)`。
2. **改动实现必须同步改动单测**：只要修改了 `index.ts(x)` 的行为、签名、边界处理，
   同一次改动里就要更新/补充对应单测，不允许只改实现不跑测试。
3. 提交/完成前跑 `npm run verify`（typecheck + lint + test），必须全绿。
4. 单测要覆盖：正常路径、边界情况（空值 / 0 / 负数 / 重复调用）、异常路径。
   不要只写一个 happy path，也不要用 `toMatchSnapshot()` 代替断言。
5. 测行为不测实现细节：断言对外可观察的结果，不要断言内部私有变量或调用次数以外的实现结构
   （确实需要验证「有没有调用原函数」时用 `vi.fn()` 是允许的）。

## 写法要点

- 纯函数练习：直接 import 实现，用 `describe` 按行为分组。
- React hook：`renderHook` + `act`，用 `rerender` 验证引用稳定性。
- 组件练习：`render` + `@testing-library/user-event`，用 role/text 查询，避免 `container.querySelector`。
- 异步逻辑：优先 `await screen.findBy*` / `waitFor`，需要控制时间时用 `vi.useFakeTimers()`，
  并在 `afterEach` 里 `vi.useRealTimers()`。
- 别名 `@/` 指向 `src/`，跨目录引用用它，同目录用 `./`。

## 命名

- 目录名 kebab-case，描述练习本身：`debounce`、`deep-clone`、`use-debounce`、`virtual-list`。
- 一个练习只做一件事；变体（如 `debounce` 的立即执行版）作为同一文件的可选参数或同目录第二个导出，
  不要拆成难懂的目录名。

## 示例

- `curry/`：纯 TS 手写练习 + 单测模板。
- `use-toggle/`：React hook 练习 + `renderHook` 单测模板。
