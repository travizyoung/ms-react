import type { ComponentType } from 'react'

/**
 * 一条「可运行知识点验证」的元信息。
 * 新增 demo 时，在 src/demos/<kebab-case-id>/index.tsx 导出 demo 常量，
 * 然后到 src/demos/index.ts 注册。
 */
export interface Demo {
  /** 唯一 id，等于目录名，kebab-case */
  id: string
  /** 侧边栏标题 */
  title: string
  /** 一句话说明这个 demo 验证了什么结论 */
  summary: string
  /** 关联的知识点文档，例如 'event-loop' 对应 docs/knowledge/event-loop.md */
  topic?: string
  Component: ComponentType
}
