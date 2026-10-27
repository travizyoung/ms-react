/**
 * 极简 Markdown 渲染：只支持仓库文档里实际用到的子集。
 * 不引第三方依赖，是因为我们只需要渲染自己写的 md（标题/段落/列表/代码/引用/表格/行内样式）。
 */
export type MarkdownBlock =
  | { type: 'heading'; level: number; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'quote'; text: string }
  | { type: 'list'; ordered: boolean; items: MarkdownListItem[] }
  | { type: 'code'; lang: string; code: string }
  | { type: 'table'; header: string[]; rows: string[][] }
  | { type: 'hr' }

export interface MarkdownListItem {
  /** 缩进层级，0 为顶层 */
  depth: number
  text: string
}

export function parseMarkdown(source: string): MarkdownBlock[] {
  const lines = source.replace(/\r\n/g, '\n').split('\n')
  const blocks: MarkdownBlock[] = []
  let index = 0

  while (index < lines.length) {
    const line = lines[index]!

    if (line.trim() === '') {
      index += 1
      continue
    }

    const fence = line.match(/^```(\w*)\s*$/)
    if (fence) {
      const lang = fence[1] ?? ''
      const code: string[] = []
      index += 1
      while (index < lines.length && !/^```\s*$/.test(lines[index]!)) {
        code.push(lines[index]!)
        index += 1
      }
      index += 1
      blocks.push({ type: 'code', lang, code: code.join('\n') })
      continue
    }

    const heading = line.match(/^(#{1,6})\s+(.*)$/)
    if (heading) {
      blocks.push({ type: 'heading', level: heading[1]!.length, text: heading[2]!.trim() })
      index += 1
      continue
    }

    if (/^(---|\*\*\*)\s*$/.test(line)) {
      blocks.push({ type: 'hr' })
      index += 1
      continue
    }

    if (isTableRow(line) && isTableSeparator(lines[index + 1] ?? '')) {
      const header = splitTableRow(line)
      const rows: string[][] = []
      index += 2
      while (index < lines.length && isTableRow(lines[index]!)) {
        rows.push(splitTableRow(lines[index]!))
        index += 1
      }
      blocks.push({ type: 'table', header, rows })
      continue
    }

    if (line.startsWith('>')) {
      const quoted: string[] = []
      while (index < lines.length && lines[index]!.startsWith('>')) {
        quoted.push(lines[index]!.replace(/^>\s?/, ''))
        index += 1
      }
      blocks.push({ type: 'quote', text: quoted.join('\n') })
      continue
    }

    const listItem = line.match(/^(\s*)([-*]|\d+\.)\s+(.*)$/)
    if (listItem) {
      const ordered = /^\s*\d+\./.test(line)
      const items: MarkdownListItem[] = []
      while (index < lines.length) {
        const match = lines[index]!.match(/^(\s*)([-*]|\d+\.)\s+(.*)$/)
        if (!match) break
        items.push({ depth: Math.floor(match[1]!.length / 2), text: match[3]!.trim() })
        index += 1
      }
      blocks.push({ type: 'list', ordered, items })
      continue
    }

    const paragraph: string[] = []
    while (index < lines.length && lines[index]!.trim() !== '' && !isBlockStart(lines[index]!)) {
      paragraph.push(lines[index]!.trim())
      index += 1
    }
    blocks.push({ type: 'paragraph', text: paragraph.join('\n') })
  }

  return blocks
}

function isBlockStart(line: string): boolean {
  return (
    /^\s*```/.test(line) ||
    /^#{1,6}\s+/.test(line) ||
    /^(---|\*\*\*)\s*$/.test(line) ||
    line.startsWith('>') ||
    /^\s*([-*]|\d+\.)\s+/.test(line) ||
    isTableRow(line)
  )
}

function isTableRow(line: string): boolean {
  return line.trim().startsWith('|')
}

function isTableSeparator(line: string): boolean {
  return /^\|?[\s:-]+\|[\s:|-]*$/.test(line.trim()) && line.includes('-')
}

function splitTableRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim())
}
