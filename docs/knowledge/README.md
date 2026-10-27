# 知识点文档

`docs/knowledge/<slug>.md` 保存面试知识点的理论笔记与问答。slug 用 kebab-case，
与 `src/demos/<slug>/` 的目录名、`Demo.topic` 字段保持一致，实现「文档 ↔ 可运行验证」双向对应。

## 文件模板

```md
# 标题（知识点名）

> 一句话结论：面试时先说出这句。

## 核心原理

## 可运行验证

见 `src/demos/<slug>/`（`pnpm dev` 打开对应条目）。

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
| `hello-react` | Demo 目录约定（示例） | `src/demos/hello-react/` | — |
