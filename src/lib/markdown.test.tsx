import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Markdown } from './markdown'
import { parseMarkdown } from './markdown-parse'

describe('parseMarkdown', () => {
  it('解析标题、段落与引用', () => {
    const blocks = parseMarkdown('# 标题\n\n第一行\n第二行\n\n> 引用第一行\n> 引用第二行')

    expect(blocks).toEqual([
      { type: 'heading', level: 1, text: '标题' },
      { type: 'paragraph', text: '第一行\n第二行' },
      { type: 'quote', text: '引用第一行\n引用第二行' },
    ])
  })

  it('代码块保留原始内容，不把 # 当标题', () => {
    const blocks = parseMarkdown('```ts\n// # not heading\nexport const a = 1\n```')

    expect(blocks).toEqual([
      { type: 'code', lang: 'ts', code: '// # not heading\nexport const a = 1' },
    ])
  })

  it('解析列表并记录缩进层级', () => {
    const blocks = parseMarkdown('1. 第一步\n2. 第二步\n   - 子项 A\n   - 子项 B')

    expect(blocks).toEqual([
      {
        type: 'list',
        ordered: true,
        items: [
          { depth: 0, text: '第一步' },
          { depth: 0, text: '第二步' },
          { depth: 1, text: '子项 A' },
          { depth: 1, text: '子项 B' },
        ],
      },
    ])
  })

  it('解析表格', () => {
    const blocks = parseMarkdown('| 段 | 占比 |\n| --- | --- |\n| 结论 | 10% |\n| 原理 | 50% |')

    expect(blocks).toEqual([
      {
        type: 'table',
        header: ['段', '占比'],
        rows: [
          ['结论', '10%'],
          ['原理', '50%'],
        ],
      },
    ])
  })

  it('解析分隔线', () => {
    expect(parseMarkdown('a\n\n---\n\nb').map((block) => block.type)).toEqual([
      'paragraph',
      'hr',
      'paragraph',
    ])
  })
})

describe('Markdown', () => {
  it('渲染加粗、行内代码与链接', () => {
    render(<Markdown source="**结论** 用 `patch` 实现，见 [文档](https://example.com)" />)

    expect(screen.getByText('结论').tagName).toBe('STRONG')
    expect(screen.getByText('patch').tagName).toBe('CODE')
    expect(screen.getByRole('link', { name: '文档' })).toHaveAttribute(
      'href',
      'https://example.com',
    )
  })

  it('渲染标题、代码块与表格', () => {
    render(
      <Markdown
        source={'## 段落标题\n\n```js\nconst a = 1\n```\n\n| 段 | 占比 |\n| --- | --- |\n| 结论 | 10% |'}
      />,
    )

    expect(screen.getByRole('heading', { name: '段落标题', level: 2 })).toBeInTheDocument()
    expect(screen.getByText('const a = 1').tagName).toBe('CODE')
    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: '段' })).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: '10%' })).toBeInTheDocument()
  })

  it('嵌套列表按层级缩进', () => {
    render(<Markdown source={'- 顶层\n  - 子项'} />)

    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(2)
    expect(items[0]).not.toHaveAttribute('style')
    expect(items[1]).toHaveAttribute('style', 'margin-left: 1.1rem;')
  })
})
