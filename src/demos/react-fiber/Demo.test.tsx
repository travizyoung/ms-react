import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { TimeSlicePanel } from './TimeSlicePanel'
import { WorkLoopPanel } from './WorkLoopPanel'

describe('WorkLoopPanel', () => {
  it('每个时间片最多处理 5 个节点，连续运行可完成整棵树', async () => {
    const user = userEvent.setup()
    render(<WorkLoopPanel />)

    await user.click(screen.getByRole('button', { name: /运行一个时间片/ }))

    expect(screen.getByText(/进度：/)).toHaveTextContent('进度：5 / 12 个节点')
    expect(screen.getByText(/已访问顺序：App → Header → Main → List → Item 1/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '连续运行到完成' }))

    await waitFor(() => {
      expect(screen.getByText(/进度：/)).toHaveTextContent('（已完成）')
    })
    expect(screen.getByRole('button', { name: /运行一个时间片/ })).toBeDisabled()
  })
})

describe('TimeSlicePanel', () => {
  it('同步与可中断两种模式都会更新列表', async () => {
    const user = userEvent.setup()
    render(<TimeSlicePanel count={20} work={1} />)

    const input = screen.getByLabelText('时间切片输入')

    await user.type(input, 'a')
    expect(screen.getByText(/列表条数：20，首行：含「a」/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '可中断渲染（startTransition）' }))
    await user.type(input, 'b')

    await waitFor(() => {
      expect(screen.getByText(/列表条数：20，首行：含「ab」/)).toBeInTheDocument()
    })
  })
})
