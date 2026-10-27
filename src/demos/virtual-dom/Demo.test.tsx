import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import VirtualDomDemo from './Demo'

async function setup() {
  const user = userEvent.setup()
  render(<VirtualDomDemo />)
  return user
}

describe('virtual-dom demo', () => {
  it('手写 patch：key 命中时 li 全部复用，改标题只更新文本', async () => {
    const user = await setup()

    await user.click(screen.getByRole('button', { name: '反转列表顺序' }))
    expect(screen.getByText(/patch：li 复用 3\/3，新建 0/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '改标题文字' }))
    expect(screen.getByText('VNode 渲染结果（已 patch）')).toBeInTheDocument()
  })

  it('key=id 时输入内容跟着行走', async () => {
    const user = await setup()

    await user.type(screen.getByLabelText('A 的输入框'), 'hello')
    await user.click(screen.getByRole('button', { name: '把第一行移到最后' }))
    await user.click(screen.getByRole('button', { name: '读取输入框内容' }))

    expect(screen.getByText('A 这一行输入框：hello')).toBeInTheDocument()
  })

  it('key=index 时输入内容留在位置上，与行数据错位', async () => {
    const user = await setup()

    await user.click(screen.getByRole('button', { name: /当前 key：id/ }))
    await user.type(screen.getByLabelText('B 的输入框'), 'world')
    await user.click(screen.getByRole('button', { name: '把第一行移到最后' }))
    await user.click(screen.getByRole('button', { name: '读取输入框内容' }))

    // 原本属于 B 的输入内容留在了第一行，而第一行现在是 C
    expect(screen.getByText('C 这一行输入框：world')).toBeInTheDocument()
    expect(screen.queryByText('B 这一行输入框：world')).not.toBeInTheDocument()
  })
})
