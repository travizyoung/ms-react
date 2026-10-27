# ms-react

React 面试题知识库：理论笔记 + 可运行验证 + 带单测的手写练习。

```bash
pnpm install
pnpm dev          # 打开 demo 站点，逐条验证知识点
pnpm test         # 跑练习单测
pnpm verify       # typecheck + lint + test
```

包管理器固定为 **pnpm**（`packageManager` 锁定版本，锁文件 `pnpm-lock.yaml`），不要用 npm / yarn。

项目结构、开发约定与「改练习必须同步改单测」等硬性规则见 [AGENTS.md](./AGENTS.md)。
