import { useCallback, useEffect, useLayoutEffect, useState } from 'react'

interface LogPanelProps {
  log: (entry: string) => void
}

function LifecycleChild({ log }: LogPanelProps) {
  const [count, setCount] = useState(0)

  useLayoutEffect(() => {
    log('useLayoutEffect：DOM 已更新、浏览器绘制前')
    return () => log('useLayoutEffect cleanup（移除前）')
  }, [log])

  useEffect(() => {
    log('useEffect：浏览器绘制后')
    return () => log('useEffect cleanup（移除前）')
  }, [log])

  return (
    <button type="button" onClick={() => setCount((value) => value + 1)}>
      子组件 count：{count}
    </button>
  )
}

export function EffectOrderExample() {
  const [mounted, setMounted] = useState(true)
  const [logs, setLogs] = useState<string[]>([])

  const log = useCallback((entry: string) => {
    setLogs((current) => [...current, entry].slice(-10))
  }, [])

  return (
    <section className="demo-panel">
      <h3>useEffect / useLayoutEffect / useInsertionEffect</h3>
      <p>
        切换子组件的挂载，观察两种 effect 的执行顺序：布局 effect 在绘制前同步执行，普通 effect 在绘制后异步执行。
      </p>

      <div className="demo-actions">
        <button type="button" onClick={() => setMounted((value) => !value)}>
          {mounted ? '卸载子组件' : '挂载子组件'}
        </button>
        <button type="button" onClick={() => setLogs([])}>
          清空日志
        </button>
      </div>

      {mounted ? <LifecycleChild log={log} /> : <p className="metric">子组件已卸载</p>}

      <ul className="log">
        {logs.map((entry, index) => (
          <li key={index}>{entry}</li>
        ))}
      </ul>

      <p className="hint">
        使用场景：`useEffect` 做数据请求、订阅、日志等「不阻塞绘制」的事；`useLayoutEffect` 做需要读取/修改布局的事
        （测量元素、滚动定位、避免闪烁），它会阻塞绘制，别滥用；`useInsertionEffect` 只给 CSS-in-JS 库注入样式用，
        业务代码基本不写。<br />
        开发模式下 StrictMode 会让 effect 执行两次（挂载 → 清理 → 再挂载），日志会有重复，这是故意的。
      </p>
    </section>
  )
}
