import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { SetDataPanel } from './SetDataPanel'
import { VirtualListPanel } from './VirtualListPanel'

function cellsOfRow(label: string): string[] {
  const row = screen.getAllByRole('row').find((candidate) => within(candidate).queryByText(label))
  if (!row) throw new Error(`找不到行：${label}`)
  return within(row)
    .getAllByRole('cell')
    .map((cell) => cell.textContent ?? '')
}

describe('VirtualListPanel', () => {
  it('虚拟滚动只渲染视口附近的行，全量渲染渲染所有行', async () => {
    const user = userEvent.setup()
    const { container } = render(<VirtualListPanel total={200} />)

    expect(container.querySelectorAll('[data-row]')).toHaveLength(15)

    await user.click(screen.getByRole('button', { name: '切换到全量渲染' }))
    expect(container.querySelectorAll('[data-row]')).toHaveLength(200)

    await user.click(screen.getByRole('button', { name: '切换到虚拟滚动' }))
    expect(container.querySelectorAll('[data-row]')).toHaveLength(15)
  })
})

describe('SetDataPanel', () => {
  it('三条策略都能更新价格，但通信次数与传输字段数不同', async () => {
    const user = userEvent.setup()
    render(<SetDataPanel count={5} latency={0} />)

    const run = async (label: string) => {
      await user.click(screen.getByRole('button', { name: label }))
      await waitFor(() => expect(screen.getByRole('button', { name: label })).toBeEnabled())
      return cellsOfRow(label)
    }

    const perItem = await run('逐条 setData')
    expect(perItem[1]).toBe('5') // 5 条消息
    expect(perItem[3]).toBe('5') // 5 个字段

    const batched = await run('合并 + 路径更新')
    expect(batched[1]).toBe('1') // 合并成 1 条消息
    expect(batched[3]).toBe('5') // 仍是 5 个字段

    const bulk = await run('一次 setData 全量 list')
    expect(bulk[1]).toBe('1')
    expect(bulk[3]).toBe('15') // 5 件商品 × 3 个字段

    expect(screen.getByText(/商品 1 ¥103/)).toBeInTheDocument()
  })
})
