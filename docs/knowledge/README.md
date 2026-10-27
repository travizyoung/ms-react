# 知识点文档

`docs/knowledge/<slug>.md` 保存面试知识点的理论笔记与问答。slug 用 kebab-case，
与 `src/demos/<slug>/` 的目录名、`Demo.topic` 字段保持一致，实现「文档 ↔ 可运行验证」双向对应。

通用答题方法见 [../answer-sop.md](../answer-sop.md)；每篇文档必须有「## 答题 SOP」一节，
把它具体化到本题（30 秒版 / 标准版分层 / 追问分支）。

## 文件模板

```md
# 标题（知识点名）

> 一句话结论：面试时先说出这句。

## 核心原理

## 可运行验证

见 `src/demos/<slug>/`（`pnpm dev` 打开对应条目）。

## 答题 SOP

### 30 秒版

结论 + 一句原理 + 一句价值/取舍。

### 标准版（60~120 秒）

按 [答案 SOP](../answer-sop.md) 的五段式展开，写清每段要说什么。

### 追问分支

- 问「为什么」→ ...
- 问「换个场景」→ ...

## 常见面试题

### Q: ...
**A:** ...

## 易错点 / 追问

## 相关

- [其他文档](./other.md)
```

## 索引

| slug | 标题 | demo | 相关练习 |
| --- | --- | --- | --- |
| `virtual-dom` | 虚拟 DOM（VNode / diff / key） | `src/demos/virtual-dom/` | `src/exercises/vdom/` |
| `performance` | 性能优化（H5 + React + 小程序） | `src/demos/performance/` | `src/exercises/virtual-list/`、`src/exercises/set-data-scheduler/`、`src/exercises/shallow-equal/` |
| `hooks` | React Hooks 全景与使用场景 | `src/demos/hooks/` | `src/exercises/use-previous/`、`src/exercises/use-debounced-value/`、`src/exercises/use-toggle/` |
| `react-fiber` | React 的核心与 Fiber | `src/demos/react-fiber/` | `src/exercises/fiber-work-loop/` |
| `hello-react` | Demo 目录约定（示例） | `src/demos/hello-react/` | — |
