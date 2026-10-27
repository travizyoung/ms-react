import { createContext, useContext, useReducer, useState, type Dispatch, type SetStateAction } from 'react'

type Theme = 'light' | 'dark'

const ThemeContext = createContext<Theme>('light')

interface Todo {
  id: number
  text: string
  done: boolean
}

type TodoAction = { type: 'add'; text: string } | { type: 'toggle'; id: number }

function todoReducer(state: Todo[], action: TodoAction): Todo[] {
  switch (action.type) {
    case 'add':
      return [...state, { id: Date.now(), text: action.text, done: false }]
    case 'toggle':
      return state.map((todo) =>
        todo.id === action.id ? { ...todo, done: !todo.done } : todo,
      )
    default:
      return state
  }
}

function Counter() {
  const [count, setCount] = useState(0)

  return (
    <div className="hook-example">
      <h4>useState</h4>
      <p className="metric">count：{count}</p>
      <div className="demo-actions">
        <button type="button" onClick={() => setCount((value) => value + 1)}>
          +1
        </button>
        <button type="button" onClick={() => setCount((value) => value + 5)}>
          +5（函数式更新）
        </button>
        <button type="button" onClick={() => setCount(0)}>
          重置
        </button>
      </div>
      <p className="hint">连续两次 setCount(c =&gt; c + 1) 会累加，而 setCount(c + 1) 两次只加 1。</p>
    </div>
  )
}

function TodoList() {
  const [todos, dispatch] = useReducer(todoReducer, [])
  const [text, setText] = useState('')

  return (
    <div className="hook-example">
      <h4>useReducer</h4>
      <form
        className="demo-actions"
        onSubmit={(event) => {
          event.preventDefault()
          const value = text.trim()
          if (!value) return
          dispatch({ type: 'add', text: value })
          setText('')
        }}
      >
        <input
          aria-label="待办内容"
          value={text}
          placeholder="输入待办，回车添加"
          onChange={(event) => setText(event.target.value)}
        />
        <button type="submit">添加</button>
      </form>
      <ul className="log">
        {todos.map((todo) => (
          <li key={todo.id}>
            <button
              type="button"
              className={todo.done ? 'todo done' : 'todo'}
              onClick={() => dispatch({ type: 'toggle', id: todo.id })}
            >
              {todo.done ? '✓' : '○'} {todo.text}
            </button>
          </li>
        ))}
      </ul>
      <p className="hint">
        状态更新逻辑复杂、字段多、需要按 action 分支处理时，useReducer 比多个 useState 更清晰，也更容易测试。
      </p>
    </div>
  )
}

function ThemeBadge() {
  const theme = useContext(ThemeContext)

  return (
    <div className="hook-example">
      <h4>useContext</h4>
      <p className="metric">
        当前主题：<strong data-testid="theme-value">{theme}</strong>
      </p>
    </div>
  )
}

const ThemeSetterContext = createContext<Dispatch<SetStateAction<Theme>>>(() => {})

function ThemeToggle() {
  // 只订阅 setter，不订阅主题值：主题变化时这个组件不需要重渲染
  const setTheme = useContext(ThemeSetterContext)

  return (
    <button type="button" onClick={() => setTheme((theme) => (theme === 'light' ? 'dark' : 'light'))}>
      切换主题
    </button>
  )
}

export function StateContextExample() {
  const [theme, setTheme] = useState<Theme>('light')

  return (
    <ThemeContext.Provider value={theme}>
      <ThemeSetterContext.Provider value={setTheme}>
        <section className="demo-panel">
          <h3>useState / useReducer / useContext</h3>
          <ThemeBadge />
          <Counter />
          <TodoList />
          <div className="hook-example">
            <ThemeToggle />
            <span className="hint">（ThemeToggle 只订阅 setter，不订阅主题值）</span>
          </div>
        </section>
      </ThemeSetterContext.Provider>
    </ThemeContext.Provider>
  )
}
