import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { ReactRenderPanel } from './ReactRenderPanel'
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

describe('ReactRenderPanel', () => {
  it('memo 会被不稳定回调击穿，稳定回调后输入不再触发行渲染', async () => {
    const user = userEvent.setup()
    const { container } = render(<ReactRenderPanel />)
    const countOf = (name: string) =>
      Number(
        container.querySelector(`[data-row="${name}"] [data-render-count]`)?.textContent ?? '0',
      )

    expect(countOf('行 1')).toBe(1)

    // 不使用 memo：输入会让所有行重渲染
    await user.type(screen.getByLabelText('搜索关键词'), 'a')
    expect(countOf('行 1')).toBeGreaterThan(1)

    // memo + 稳定回调：输入不触发行渲染（切换模式会重置计数）
    await user.click(screen.getByRole('button', { name: 'memo + 稳定回调' }))
    expect(countOf('行 1')).toBe(1)
    await user.type(screen.getByLabelText('搜索关键词'), 'b')
    expect(countOf('行 1')).toBe(1)

    // memo + 每次新建的回调：浅比较失败，行照旧重渲染
    await user.click(screen.getByRole('button', { name: 'memo（回调每次新建）' }))
    expect(countOf('行 1')).toBe(1)
    await user.type(screen.getByLabelText('搜索关键词'), 'c')
    expect(countOf('行 1')).toBeGreaterThan(1)
  })
})
