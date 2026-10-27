import { useState } from 'react'
import {
  createFiberTree,
  createWorkLoop,
  type FiberDescriptor,
  type WorkLoop,
} from '@/exercises/fiber-work-loop'

const TREE: FiberDescriptor = {
  name: 'App',
  children: [
    { name: 'Header' },
    {
      name: 'Main',
      children: [
        {
          name: 'List',
          children: Array.from({ length: 6 }, (_, index) => ({ name: `Item ${index + 1}` })),
        },
        { name: 'Sidebar' },
      ],
    },
    { name: 'Footer' },
  ],
}

/** 每个时间片最多处理多少个工作单元（用来模拟 5ms 的时间片预算） */
const UNITS_PER_SLICE = 5

function countUnits(descriptor: FiberDescriptor): number {
  return 1 + (descriptor.children ?? []).reduce((total, child) => total + countUnits(child), 0)
}

interface Runner {
  loop: WorkLoop
  resetBudget: () => void
}

function makeRunner(): Runner {
  let spent = 0
  const loop = createWorkLoop(createFiberTree(TREE), () => {
    spent += 1
    return spent > UNITS_PER_SLICE
  })

  return {
    loop,
    resetBudget: () => {
      spent = 0
    },
  }
}

const TOTAL_UNITS = countUnits(TREE)

export function WorkLoopPanel() {
  const [runner, setRunner] = useState<Runner>(makeRunner)
  const [visited, setVisited] = useState<string[]>([])
  const [slices, setSlices] = useState<string[]>([])
  const [done, setDone] = useState(false)
  const [running, setRunning] = useState(false)

  const runSlice = () => {
    runner.resetBudget()
    const before = runner.loop.visited.length
    const finished = runner.loop.workUntilYield()
    const newlyVisited = runner.loop.visited.slice(before)

    setVisited([...runner.loop.visited])
    setDone(finished)
    setSlices((previous) =>
      [
        `时间片 ${previous.length + 1}：访问 ${newlyVisited.length} 个节点（${newlyVisited.join(' → ')}）`,
        ...previous,
      ].slice(0, 6),
    )
  }

  const runToCompletion = async () => {
    setRunning(true)
    while (!runner.loop.done) {
      runSlice()
      // 每个时间片之间让出事件循环，模拟浏览器有机会处理输入/绘制
      await new Promise((resolve) => {
        setTimeout(resolve, 80)
      })
    }
    setRunning(false)
  }

  const reset = () => {
    setRunner(makeRunner())
    setVisited([])
    setSlices([])
    setDone(false)
    setRunning(false)
  }

  return (
    <section className="demo-panel">
      <h3>1. Fiber 工作循环：child → sibling → return 与可中断恢复</h3>
      <p>
        这棵树的遍历用的是练习 <code>src/exercises/fiber-work-loop</code> 的实现：每个节点处理完先看 child，
        没有 child 就看 sibling，都没有就沿 return 回溯。每处理 {UNITS_PER_SLICE} 个节点就「让出主线程」，
        下次从 <code>nextUnitOfWork</code> 继续。
      </p>

      <div className="demo-actions">
        <button type="button" disabled={done || running} onClick={runSlice}>
          运行一个时间片（最多 {UNITS_PER_SLICE} 个节点）
        </button>
        <button type="button" disabled={done || running} onClick={() => void runToCompletion()}>
          {running ? '运行中…' : '连续运行到完成'}
        </button>
        <button type="button" disabled={running} onClick={reset}>
          重置
        </button>
      </div>

      <p className="metric">
        进度：<strong>{visited.length}</strong> / {TOTAL_UNITS} 个节点{done ? '（已完成）' : ''}
      </p>

      <ul className="log">
        {slices.map((entry, index) => (
          <li key={index}>{entry}</li>
        ))}
      </ul>

      <p className="metric">
        已访问顺序：{visited.length > 0 ? visited.join(' → ') : '—'}
      </p>

      <p className="hint">
        真实 React 在这一步还会做 beginWork（生成子 Fiber、diff 新旧 props/children）和 completeWork（向上收集变更），
        并在时间片到期时调用 shouldYield 让出主线程。整个 render 阶段都可以暂停、丢弃、重来；只有 commit 阶段是同步不可中断的。
      </p>
    </section>
  )
}
