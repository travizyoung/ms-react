import { describe, expect, it } from 'vitest'
import { extractSection, getAnswerSopDoc, getTopicDoc } from './docs'

describe('docs content', () => {
  it('能读到知识点文档与通用 SOP', () => {
    const doc = getTopicDoc('virtual-dom')
    const sop = getAnswerSopDoc()

    expect(doc).toContain('# 虚拟 DOM（Virtual DOM）')
    expect(sop).toContain('# 面试答题 SOP')
  })

  it('不存在的知识点返回 null', () => {
    expect(getTopicDoc('not-exist')).toBeNull()
  })

  it('extractSection 只取目标二级标题到下一个二级标题之间的内容', () => {
    const markdown = ['# 标题', '## 答题 SOP', '30 秒版内容', '## 常见面试题', '题目内容'].join('\n')

    expect(extractSection(markdown, '答题 SOP')).toBe('30 秒版内容')
    expect(extractSection(markdown, '不存在')).toBeNull()
  })

  it('extractSection 在文档末尾时取到结尾', () => {
    const markdown = ['## 答题 SOP', '内容 A', '内容 B'].join('\n')

    expect(extractSection(markdown, '答题 SOP')).toBe('内容 A\n内容 B')
  })
})
