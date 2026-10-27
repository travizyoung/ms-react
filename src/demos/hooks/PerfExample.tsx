import { useCallback, useDeferredValue, useMemo, useState, useTransition } from 'react'

const ITEMS = Array.from({ length: 5000 }, (_, index) => `条目 ${index}`)

// 用于给对象打「创建序号」，直观看出是否每次渲染都新建
let objectSequence = 0
const nextObjectId = () => {
  objectSequence += 1
  return objectSequence
}

export function PerfExample() {
  const [renders, setRenders] = useState(0)

  const memoObject = useMemo(() => ({ id: nextObjectId() }), [])
  const plainObject = { id: nextObjectId() }
  const stableCallback = useCallback(() => 'same function', [])
  const inlineCallback = () => 'new function every render'
  const [firstStableCallback] = useState(() => stableCallback)
  const [firstInlineCallback] = useState(() => inlineCallback)

  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const deferredList = useMemo(
    () => ITEMS.filter((item) => item.includes(deferredQuery)).slice(0, 12),
    [deferredQuery],
  )

  const [transitionQuery, setTransitionQuery] = useState('')
  const [transitionList, setTransitionList] = useState<string[]>([])
  const [isPending, startTransition] = useTransition()

  const handleTransitionChange = (value: string) => {
    setTransitionQuery(value)
    startTransition(() => {
      setTransitionList(ITEMS.filter((item) => item.includes(value)).slice(0, 12))
    })
  }

  return (
    <section className="demo-panel">
      <h3>useMemo / useCallback / useTransition / useDeferredValue</h3>

      <div className="hook-example">
        <h4>useMemo 与 useCallback：稳定引用</h4>
        <p className="metric">
          无关重渲染次数：{renders}
          <button type="button" className="inline-button" onClick={() => setRenders((value) => value + 1)}>
            触发一次重渲染
          </button>
        </p>
        <ul className="log">
          <li>useMemo 对象 id：{memoObject.id}（空依赖，重渲染后不变）</li>
          <li>普通对象 id：{plainObject.id}（每次渲染都会新建）</li>
          <li>useCallback 引用是否稳定：{String(firstStableCallback === stableCallback)}</li>
          <li>普通函数引用是否稳定：{String(firstInlineCallback === inlineCallback)}</li>
        </ul>
        <p className="hint">
          引用稳定本身不产生性能收益，收益发生在「依赖它的地方」：memo 子组件、effect 依赖、context value。
          普通对象/函数每次渲染都是新引用，会击穿这些优化。
        </p>
      </div>

      <div className="hook-example">
        <h4>useDeferredValue：延迟渲染派生列表</h4>
        <input
          aria-label="延迟值搜索"
          value={query}
          placeholder="输入关键词，观察即时值与延迟值"
          onChange={(event) => setQuery(event.target.value)}
        />
        <p className="metric">
          即时值：「{query}」，延迟值：「{deferredQuery}」
        </p>
        <ul className="log">
          {deferredList.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="hint">
          输入框用即时值保证响应，列表用延迟值渲染；React 会先处理紧急更新，空闲时再补上列表。
        </p>
      </div>

      <div className="hook-example">
        <h4>useTransition：把非紧急更新标记为可打断</h4>
        <input
          aria-label="过渡搜索"
          value={transitionQuery}
          placeholder="输入关键词，观察 pending 状态"
          onChange={(event) => handleTransitionChange(event.target.value)}
        />
        <p className="metric">
          过滤状态：{isPending ? '过渡更新中（可被打断）' : '已完成'}，匹配 {transitionList.length} 条
        </p>
        <ul className="log">
          {transitionList.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="hint">
          区别：`useTransition` 由你决定「哪一次 setState 是低优先级」；`useDeferredValue` 是给「已有的值」生成一个低优先级副本。
          两者都在解决同一件事：别让重计算挡住输入。
        </p>
      </div>
    </section>
  )
}
