import { extractSection, getAnswerSopDoc, getTopicDoc } from '@/content/docs'
import { Markdown } from '@/lib/markdown'

interface TopicSectionsProps {
  /** 知识点 slug，对应 docs/knowledge/<slug>.md */
  topic?: string
}

/**
 * 知识点页面上的文档区：本题答题 SOP 直接展开，通用 SOP 与完整笔记折叠。
 * 内容全部来自 md，页面不维护第二份文案。
 */
export function TopicSections({ topic }: TopicSectionsProps) {
  if (!topic) return null

  const doc = getTopicDoc(topic)
  if (!doc) return null

  const sop = extractSection(doc, '答题 SOP')
  const generalSop = getAnswerSopDoc()

  return (
    <div className="topic-sections">
      {sop ? (
        <section className="doc-section" aria-labelledby="sop-heading">
          <h2 id="sop-heading">答题 SOP（本题）</h2>
          <Markdown source={sop} />
        </section>
      ) : null}

      {generalSop ? (
        <details className="doc-details">
          <summary>通用答题 SOP：五段式 / 分题型 / 自查清单</summary>
          <Markdown source={generalSop} />
        </details>
      ) : null}

      <details className="doc-details">
        <summary>
          完整知识点笔记：<code>docs/knowledge/{topic}.md</code>
        </summary>
        <Markdown source={doc} />
      </details>
    </div>
  )
}
