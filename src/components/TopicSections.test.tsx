import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TopicSections } from './TopicSections'

describe('TopicSections', () => {
  it('展开本题答题 SOP，并提供通用 SOP 与完整笔记的折叠入口', () => {
    render(<TopicSections topic="virtual-dom" />)

    expect(screen.getByRole('heading', { name: '答题 SOP（本题）' })).toBeInTheDocument()
    // 完整笔记里也有同名小节，用 getAllBy* 避免重复匹配
    expect(screen.getAllByRole('heading', { name: '30 秒版' }).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/标准版（60~120 秒）/).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('heading', { name: '追问分支' }).length).toBeGreaterThan(0)

    expect(screen.getByText(/通用答题 SOP/)).toBeInTheDocument()
    expect(screen.getByText(/完整知识点笔记/)).toBeInTheDocument()
  })

  it('没有 topic 或文档不存在时不渲染任何内容', () => {
    const { container, rerender } = render(<TopicSections />)
    expect(container).toBeEmptyDOMElement()

    rerender(<TopicSections topic="not-exist" />)
    expect(container).toBeEmptyDOMElement()
  })
})
