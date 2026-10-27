# 文档说明

这个目录是 React 面试知识库的**理论侧**。

- `knowledge/` —— 每个知识点一个 md：结论、原理、常见面试题、易错点。见 [knowledge/README.md](./knowledge/README.md) 的模板与索引。

理论之外的三种载体：

| 需求 | 位置 | 命令 |
| --- | --- | --- |
| 理论笔记 / 面试问答 | `docs/knowledge/<slug>.md` | — |
| 可运行的原理验证 | `src/demos/<slug>/` | `pnpm dev` |
| 手写练习题（带 vitest） | `src/exercises/<name>/` | `pnpm test` |

约定：知识点 slug 在三处保持一致，方便互相跳转，例如 `event-loop` →
`docs/knowledge/event-loop.md` + `src/demos/event-loop/`。
