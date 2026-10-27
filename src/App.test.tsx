import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('默认展示第一个 demo，并在同一页渲染答题 SOP', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: '虚拟 DOM：diff、key 与节点复用' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '答题 SOP（本题）' })).toBeInTheDocument()
    expect(screen.getByText(/完整知识点笔记/)).toBeInTheDocument()
  })

  it('切换到没有 topic 的 demo 时不渲染文档区', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Demo 目录约定' }))

    expect(screen.queryByRole('heading', { name: '答题 SOP（本题）' })).not.toBeInTheDocument()
  })

  it('切换到性能优化 demo 时渲染对应文档与答题 SOP', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: '性能优化：长列表、setData 与 React 渲染' }))

    expect(
      screen.getByRole('heading', { name: '性能优化：长列表、setData 与 React 渲染' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '答题 SOP（本题）' })).toBeInTheDocument()
    expect(screen.getAllByText(/双线程/).length).toBeGreaterThan(0)
  })

  it('切换到 hooks demo 时渲染对应文档与答题 SOP', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(
      screen.getByRole('button', { name: 'React Hooks：19 个内置 hooks 与使用场景' }),
    )

    expect(
      screen.getByRole('heading', { name: 'React Hooks：19 个内置 hooks 与使用场景' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '答题 SOP（本题）' })).toBeInTheDocument()
    expect(screen.getAllByText(/useSyncExternalStore/).length).toBeGreaterThan(0)
  })

  it('切换到 Fiber demo 时渲染对应文档与答题 SOP', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'React 核心与 Fiber：可中断的协调' }))

    expect(
      screen.getByRole('heading', { name: 'React 核心与 Fiber：可中断的协调' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '答题 SOP（本题）' })).toBeInTheDocument()
    expect(screen.getAllByText(/workInProgress/).length).toBeGreaterThan(0)
  })
})
