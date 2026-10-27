import { createElement, useMemo, type ReactNode } from 'react'
import { parseMarkdown, type MarkdownBlock } from './markdown-parse'

const INLINE_PATTERN = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g

function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = []
  let lastIndex = 0

  for (const match of text.matchAll(INLINE_PATTERN)) {
    const token = match[0]
    const start = match.index
    if (start > lastIndex) {
      nodes.push(text.slice(lastIndex, start))
    }

    if (token.startsWith('**')) {
      nodes.push(<strong key={start}>{token.slice(2, -2)}</strong>)
    } else if (token.startsWith('`')) {
      nodes.push(<code key={start}>{token.slice(1, -1)}</code>)
    } else {
      const link = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
      if (!link) {
        nodes.push(token)
      } else if (/^https?:\/\//.test(link[2]!)) {
        nodes.push(
          <a key={start} href={link[2]} target="_blank" rel="noreferrer">
            {link[1]}
          </a>,
        )
      } else {
        // 仓库内的相对链接在浏览器里无法跳转，渲染成带路径提示的文本。
        nodes.push(
          <span key={start} className="markdown-file-link" title={link[2]}>
            {link[1]}
          </span>,
        )
      }
    }

    lastIndex = start + token.length
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex))
  }

  return nodes
}

function Block({ block }: { block: MarkdownBlock }) {
  switch (block.type) {
    case 'heading': {
      const level = Math.min(block.level, 4)
      return createElement(`h${level}`, null, renderInline(block.text))
    }
    case 'paragraph':
      return <p>{renderInline(block.text)}</p>
    case 'quote':
      return <blockquote>{renderInline(block.text)}</blockquote>
    case 'code':
      return (
        <pre className="markdown-code" data-lang={block.lang}>
          <code>{block.code}</code>
        </pre>
      )
    case 'list': {
      const Tag = block.ordered ? 'ol' : 'ul'
      return (
        <Tag className="markdown-list">
          {block.items.map((item, itemIndex) => (
            <li
              key={itemIndex}
              style={item.depth > 0 ? { marginLeft: `${item.depth * 1.1}rem` } : undefined}
            >
              {renderInline(item.text)}
            </li>
          ))}
        </Tag>
      )
    }
    case 'table':
      return (
        <div className="markdown-table-wrap">
          <table>
            <thead>
              <tr>
                {block.header.map((cell, cellIndex) => (
                  <th key={cellIndex}>{renderInline(cell)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex}>{renderInline(cell)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    case 'hr':
      return <hr />
  }
}

export function Markdown({ source }: { source: string }) {
  const blocks = useMemo(() => parseMarkdown(source), [source])

  return (
    <div className="markdown">
      {blocks.map((block, index) => (
        <Block key={index} block={block} />
      ))}
    </div>
  )
}