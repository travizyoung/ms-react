/**
 * 文档内容入口：直接以 ?raw 方式读取 docs/ 下的 md，页面与文档共用同一份事实来源。
 * 新增知识点时只需要写 md，页面会自动渲染「答题 SOP + 完整笔记」。
 */
const rawDocs = import.meta.glob('../../docs/**/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

function readDoc(suffix: string): string | null {
  const key = Object.keys(rawDocs).find((path) => path.endsWith(suffix))
  return key ? rawDocs[key]! : null
}

/** 读取 docs/knowledge/<slug>.md */
export function getTopicDoc(topic: string): string | null {
  return readDoc(`/knowledge/${topic}.md`)
}

/** 读取 docs/answer-sop.md（通用答题 SOP） */
export function getAnswerSopDoc(): string | null {
  return readDoc('/answer-sop.md')
}

/** 取出某个二级标题下的正文（到下一个二级标题为止），用于单独展示「答题 SOP」 */
export function extractSection(markdown: string, heading: string): string | null {
  const lines = markdown.split(/\r?\n/)
  const start = lines.findIndex((line) => line.trim() === `## ${heading}`)
  if (start === -1) return null

  const rest = lines.slice(start + 1)
  const end = rest.findIndex((line) => /^##\s+/.test(line))
  return (end === -1 ? rest : rest.slice(0, end)).join('\n').trim()
}
