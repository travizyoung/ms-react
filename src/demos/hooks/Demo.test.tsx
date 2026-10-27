import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import HooksDemo from './Demo'

async function setup() {
  const user = userEvent.setup()
  render(<HooksDemo />)
  return user
}

describe('hooks demo', () => {
  it('状态与上下文：useReducer 添加待办、useContext 切换主题', async () => {
    const user = await setup()

    await user.type(screen.getByLabelText('待办内容'), '写 hooks 笔记')
    await user.click(screen.getByRole('button', { name: '添加' }))
    expect(screen.getByRole('button', { name: /写 hooks 笔记/ })).toBeInTheDocument()

    expect(screen.getByTestId('theme-value')).toHaveTextContent('light')
    await user.click(screen.getByRole('button', { name: '切换主题' }))
    expect(screen.getByTestId('theme-value')).toHaveTextContent('dark')
  })

  it('副作用：useLayoutEffect 先于 useEffect，卸载时执行清理', async () => {
    const user = await setup()

    await user.click(screen.getByRole('tab', { name: '副作用与顺序' }))
    await user.click(screen.getByRole('button', { name: '清空日志' }))
    await user.click(screen.getByRole('button', { name: '卸载子组件' }))
    await user.click(screen.getByRole('button', { name: '挂载子组件' }))

    const entries = screen.getAllByRole('listitem').map((item) => item.textContent)
    expect(entries.slice(-2)).toEqual([
      'useLayoutEffect：DOM 已更新、浏览器绘制前',
      'useEffect：浏览器绘制后',
    ])
  })

  it('Ref：ref 变化不触发渲染，useImperativeHandle 暴露 focus/clear', async () => {
    const user = await setup()

    await user.click(screen.getByRole('tab', { name: 'Ref 与命令式' }))
    const input = screen.getByLabelText('命令式输入框')

    await user.type(input, 'abc')
    await user.click(screen.getByRole('button', { name: '清空输入框' }))
    expect(input).toHaveValue('')

    await user.click(screen.getByRole('button', { name: '聚焦输入框' }))
    expect(input).toHaveFocus()

    // ref 变了但界面不会更新，页面仍显示上一次渲染时的值
    expect(screen.getByTestId('ref-rendered-count')).toHaveTextContent('0')
    await user.click(screen.getByRole('button', { name: /ref \+1（不会重渲染）/ }))
    expect(screen.getByTestId('ref-rendered-count')).toHaveTextContent('0')

    await user.click(screen.getByRole('button', { name: '读取 ref 并强制渲染' }))
    expect(screen.getByTestId('ref-rendered-count')).toHaveTextContent('1')
  })

  it('其他 hooks：useId 关联 label，useSyncExternalStore 同步多个消费者', async () => {
    const user = await setup()

    await user.click(screen.getByRole('tab', { name: '其他内置 hooks' }))
    const nameInput = screen.getByLabelText('姓名')
    const nameLabel = screen.getByText('姓名')

    expect(nameInput).toHaveAttribute('id', nameLabel.getAttribute('for'))

    await user.click(screen.getByRole('button', { name: '外部 store +1' }))
    expect(screen.getByText('消费者 A：1')).toBeInTheDocument()
    expect(screen.getByText('消费者 B：1')).toBeInTheDocument()
  })

  it('React 19：useActionState 提交结果与 useOptimistic 乐观更新', async () => {
    const user = await setup()

    await user.click(screen.getByRole('tab', { name: 'React 19 新 hooks' }))

    await user.type(screen.getByLabelText('姓名'), '李四')
    await user.click(screen.getByRole('button', { name: '提交' }))
    expect(await screen.findByText(/已提交：李四/)).toBeInTheDocument()

    await user.type(screen.getByLabelText('新待办'), '写文档')
    await user.click(screen.getByRole('button', { name: '添加待办' }))
    expect(await screen.findByText(/写文档（待保存）/)).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText('写文档')).toBeInTheDocument())
  })
})
