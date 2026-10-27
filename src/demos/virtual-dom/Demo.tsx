import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { h, patch, render, type VNode } from '@/exercises/vdom'

/* ------------------------------------------------------------------ *
 * 实验一：手写 VNode → 真实 DOM，以及 key 控制的节点复用
 * ------------------------------------------------------------------ */

interface TreeSpec {
  title: string
  labels: string[]
}

const INITIAL_SPEC: TreeSpec = { title: 'VNode 渲染结果', labels: ['A', 'B', 'C'] }

function buildTree(spec: TreeSpec): VNode {
  return h(
    'div',
    { className: 'vdom-host-inner' },
    h('h3', {}, spec.title),
    h(
      'ul',
      {},
      ...spec.labels.map((label) => h('li', { key: label }, label)),
    ),
  )
}

function HandWrittenVdom() {
  const [spec, setSpec] = useState<TreeSpec>(INITIAL_SPEC)
  const [log, setLog] = useState<string[]>([])
  const hostRef = useRef<HTMLDivElement>(null)
  const appliedRef = useRef<TreeSpec | null>(null)
  const vnodeRef = useRef<VNode | null>(null)

  const tree = useMemo(() => buildTree(spec), [spec])

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    // StrictMode 下 effect 会执行两次，用引用比较跳过重复应用
    if (appliedRef.current === spec) return
    appliedRef.current = spec

    const next = buildTree(spec)
    const previous = vnodeRef.current

    if (!previous) {
      render(next, host)
      setLog([`render：首次挂载 ${host.querySelectorAll('li').length} 个 li`])
    } else {
      const before = new Set(host.querySelectorAll('li'))
      patch(host, previous, next)
      const after = Array.from(host.querySelectorAll('li'))
      const reused = after.filter((node) => before.has(node)).length
      setLog((entries) =>
        [
          `patch：li 复用 ${reused}/${after.length}，新建 ${after.length - reused}`,
          ...entries,
        ].slice(0, 5),
      )
    }
    vnodeRef.current = next
  }, [spec])

  const reverse = useCallback(() => {
    setSpec((current) => ({ ...current, labels: [...current.labels].reverse() }))
  }, [])

  const rename = useCallback(() => {
    setSpec((current) => ({
      ...current,
      title: current.title === 'VNode 渲染结果' ? 'VNode 渲染结果（已 patch）' : 'VNode 渲染结果',
    }))
  }, [])

  return (
    <section className="demo-panel">
      <h3>1. VNode 是普通对象，patch 只改差异</h3>
      <p>
        下面这棵树由练习 <code>src/exercises/vdom</code> 的 <code>h()</code> 构造，
        左侧是纯 JS 对象，右侧是 <code>patch()</code> 写进真实 DOM 的结果。
      </p>

      <div className="vdom-grid">
        <pre className="code-block">{JSON.stringify(tree, null, 2)}</pre>
        <div className="vdom-host" ref={hostRef} />
      </div>

      <div className="demo-actions">
        <button type="button" onClick={reverse}>
          反转列表顺序
        </button>
        <button type="button" onClick={rename}>
          改标题文字
        </button>
      </div>

      <ul className="log">
        {log.map((entry, index) => (
          <li key={index}>{entry}</li>
        ))}
      </ul>
      <p className="hint">
        带 <code>key</code> 时反转顺序，li 节点全部复用、只做 <code>insertBefore</code> 移动；
        改标题时只更新文本节点，ul/li 实例不变。
      </p>
    </section>
  )
}

/* ------------------------------------------------------------------ *
 * 实验二：React 里 key 用 id 还是 index，DOM 复用与状态错位
 * ------------------------------------------------------------------ */

interface Row {
  id: number
  name: string
}

const INITIAL_ROWS: Row[] = [
  { id: 1, name: 'A' },
  { id: 2, name: 'B' },
  { id: 3, name: 'C' },
]

function KeyReuse() {
  const [rows, setRows] = useState<Row[]>(INITIAL_ROWS)
  const [useIdKey, setUseIdKey] = useState(true)
  const [seed, setSeed] = useState(0)
  const [report, setReport] = useState({ reused: 0, created: 0, total: 0 })
  const [typed, setTyped] = useState<string[]>([])
  const listRef = useRef<HTMLUListElement>(null)
  const previousNodes = useRef<Element[]>([])

  // 只在列表相关状态变化后测量：对比 DOM 实例，统计复用/新建数量
  useLayoutEffect(() => {
    const nodes = Array.from(listRef.current?.children ?? [])
    const previous = previousNodes.current

    if (previous.length > 0) {
      const reused = nodes.filter((node) => previous.includes(node)).length
      setReport((current) =>
        current.reused === reused && current.total === nodes.length
          ? current
          : { reused, created: nodes.length - reused, total: nodes.length },
      )
    }

    previousNodes.current = nodes
  }, [rows, useIdKey, seed])

  const rotate = () => {
    setRows((current) => [...current.slice(1), current[0]])
  }

  const readInputs = () => {
    const items = Array.from(listRef.current?.querySelectorAll('li') ?? [])
    setTyped(
      items.map((li) => {
        const value = li.querySelector('input')?.value ?? ''
        return `${li.dataset.name ?? '?'} 这一行输入框：${value === '' ? '（空）' : value}`
      }),
    )
  }

  const reset = () => {
    setRows(INITIAL_ROWS)
    setUseIdKey(true)
    setSeed((value) => value + 1)
    setTyped([])
    setReport({ reused: 0, created: 0, total: 0 })
    previousNodes.current = []
  }

  return (
    <section className="demo-panel">
      <h3>2. key 用 id 还是 index：看 DOM 复用与输入框里的值</h3>
      <p>
        给每一行的输入框随便打点字，然后点「把第一行移到最后」，再看输入框里的值跟的是行数据还是行位置。
      </p>

      <ul className="key-list" key={seed} ref={listRef}>
        {rows.map((row, index) => (
          <li key={useIdKey ? row.id : index} data-name={row.name}>
            <span className="row-name">{row.name}</span>
            <input aria-label={`${row.name} 的输入框`} placeholder={`给 ${row.name} 输入`} />
          </li>
        ))}
      </ul>

      <div className="demo-actions">
        <button type="button" onClick={rotate}>
          把第一行移到最后
        </button>
        <button type="button" onClick={readInputs}>
          读取输入框内容
        </button>
        <button type="button" onClick={() => setUseIdKey((value) => !value)}>
          当前 key：{useIdKey ? 'id' : 'index'}（点击切换）
        </button>
        <button type="button" onClick={reset}>
          重置
        </button>
      </div>

      <p>
        最近一次重排：复用 DOM 节点 <strong>{report.reused}</strong>/{report.total}，新建{' '}
        <strong>{report.created}</strong>
      </p>

      {typed.length > 0 ? (
        <ul className="log">
          {typed.map((entry) => (
            <li key={entry}>{entry}</li>
          ))}
        </ul>
      ) : null}

      <p className="hint">
        key=id：节点跟着数据走，重排只是移动 DOM，输入框里的字跟着行一起移动。<br />
        key=index：节点按位置复用，React 认为第 1 个位置还是同一个组件，于是输入框里的字留在了位置上、和行数据错位 —— 这就是「不要用 index 当 key」的真实后果。
      </p>
    </section>
  )
}

export default function VirtualDomDemo() {
  return (
    <div className="demo-body">
      <HandWrittenVdom />
      <KeyReuse />
    </div>
  )
}
