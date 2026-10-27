import { useImperativeHandle, useRef, useState, type Ref } from 'react'

export interface FancyInputHandle {
  focus: () => void
  clear: () => void
}

interface FancyInputProps {
  placeholder?: string
  ref?: Ref<FancyInputHandle>
}

/** React 19 允许 ref 直接作为 prop，不再需要 forwardRef 包一层 */
function FancyInput({ placeholder, ref }: FancyInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useImperativeHandle(
    ref,
    () => ({
      focus: () => inputRef.current?.focus(),
      clear: () => {
        if (inputRef.current) inputRef.current.value = ''
      },
    }),
    [],
  )

  return <input ref={inputRef} aria-label="命令式输入框" placeholder={placeholder} />
}

export function RefExample() {
  const fancyRef = useRef<FancyInputHandle>(null)
  const mutableCountRef = useRef(0)
  const [renderedCount, setRenderedCount] = useState(0)

  return (
    <section className="demo-panel">
      <h3>useRef / useImperativeHandle</h3>

      <div className="hook-example">
        <h4>useRef：可变值不触发渲染</h4>
        <p className="metric">
          界面上次渲染时看到的值：<strong data-testid="ref-rendered-count">{renderedCount}</strong>（ref 的变化不会自动刷新界面）
        </p>
        <div className="demo-actions">
          <button
            type="button"
            onClick={() => {
              mutableCountRef.current += 1
            }}
          >
            ref +1（不会重渲染）
          </button>
          <button type="button" onClick={() => setRenderedCount(mutableCountRef.current)}>
            读取 ref 并强制渲染
          </button>
        </div>
        <p className="hint">
          ref 适合存定时器 id、上一次的值、DOM 节点等「不需要参与渲染」的可变数据；需要界面跟着变就用 state。
        </p>
      </div>

      <div className="hook-example">
        <h4>useImperativeHandle：向父组件暴露受控的命令式 API</h4>
        <FancyInput ref={fancyRef} placeholder="点按钮聚焦或清空" />
        <div className="demo-actions">
          <button type="button" onClick={() => fancyRef.current?.focus()}>
            聚焦输入框
          </button>
          <button type="button" onClick={() => fancyRef.current?.clear()}>
            清空输入框
          </button>
        </div>
        <p className="hint">
          大多数场景优先用 props 传数据；只有焦点、滚动、播放器控制这类「命令」才用 ref 暴露，避免绕过 React 的数据流。
        </p>
      </div>
    </section>
  )
}
