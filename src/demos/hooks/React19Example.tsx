import { Suspense, use, useActionState, useOptimistic, useState } from 'react'
import { useFormStatus } from 'react-dom'

async function submitName(_previous: string | null, formData: FormData): Promise<string> {
  const name = String(formData.get('name') ?? '').trim()
  await new Promise((resolve) => setTimeout(resolve, 300))
  return name ? `已提交：${name}` : '请输入姓名'
}

/** useFormStatus 必须在 <form> 的子组件里调用，才能读到所在表单的 pending */
function SubmitButton({ label = '提交' }: { label?: string }) {
  const { pending } = useFormStatus()

  return (
    <button type="submit" disabled={pending}>
      {pending ? '提交中…' : label}
    </button>
  )
}

function AsyncMessage({ promise }: { promise: Promise<string> }) {
  // use() 会「读取」Promise/Context：Promise 未完成时挂起当前组件，由上层 Suspense 接管
  const message = use(promise)
  return <p role="status">{message}</p>
}

function OptimisticTodos() {
  const [todos, setTodos] = useState<string[]>([])
  const [optimisticTodos, addOptimisticTodo] = useOptimistic(
    todos,
    (current: string[], text: string) => [...current, `${text}（待保存）`],
  )

  async function addTodo(formData: FormData) {
    const text = String(formData.get('todo') ?? '').trim()
    if (!text) return

    addOptimisticTodo(text)
    await new Promise((resolve) => setTimeout(resolve, 400))
    setTodos((current) => [...current, text])
  }

  return (
    <div className="hook-example">
      <h4>useOptimistic：先给用户结果，再等服务端</h4>
      <form className="demo-actions" action={addTodo}>
        <input name="todo" aria-label="新待办" placeholder="输入后提交，先显示乐观结果" />
        <SubmitButton label="添加待办" />
      </form>
      <ul className="log">
        {optimisticTodos.map((todo, index) => (
          <li key={`${todo}-${index}`}>{todo}</li>
        ))}
      </ul>
      <p className="hint">
        提交后立刻出现「（待保存）」版本，请求成功后替换为真实数据；失败时 React 会自动回滚到 `todos`。
      </p>
    </div>
  )
}

export function React19Example() {
  const [message, formAction, isPending] = useActionState(submitName, null)
  const [promise, setPromise] = useState<Promise<string> | null>(null)

  return (
    <section className="demo-panel">
      <h3>React 19：use / useActionState / useOptimistic / useFormStatus</h3>

      <div className="hook-example">
        <h4>useActionState：把表单提交变成带状态的一等操作</h4>
        <form className="demo-actions" action={formAction}>
          <input name="name" aria-label="姓名" placeholder="输入姓名后提交" />
          <SubmitButton />
        </form>
        <p className="metric">
          提交状态：{isPending ? '请求中…' : '空闲'}
          {message ? <span role="status">，结果：{message}</span> : null}
        </p>
        <p className="hint">
          action 函数 `(prevState, formData) =&gt; nextState` 会拿到上一次的结果，省掉手写 loading/error state 的组合。
        </p>
      </div>

      <OptimisticTodos />

      <div className="hook-example">
        <h4>use(Promise)：在渲染中读取异步数据</h4>
        <div className="demo-actions">
          <button
            type="button"
            onClick={() =>
              setPromise(
                new Promise((resolve) => {
                  setTimeout(() => resolve('use() 读取到的异步数据'), 500)
                }),
              )
            }
          >
            加载异步数据
          </button>
        </div>
        <Suspense fallback={<p className="metric">读取中…（Suspense fallback）</p>}>
          {promise ? <AsyncMessage promise={promise} /> : null}
        </Suspense>
        <p className="hint">
          `use` 也可以读 Context（`use(ThemeContext)`）；它不是 Hook，可以写在条件分支里，但仍要遵守「渲染期间数据稳定」的原则。
        </p>
      </div>
    </section>
  )
}
