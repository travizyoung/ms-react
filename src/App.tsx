import { useState } from 'react'
import { demos } from './demos'

function App() {
  const [activeId, setActiveId] = useState(demos[0]?.id ?? '')
  const active = demos.find((d) => d.id === activeId) ?? demos[0]

  return (
    <div className="layout">
      <aside className="sidebar">
        <header className="brand">
          <h1>React 面试知识库</h1>
          <p>{demos.length} 个 demo</p>
        </header>
        <nav>
          <ul>
            {demos.map((demo) => (
              <li key={demo.id}>
                <button
                  type="button"
                  className={demo.id === active?.id ? 'nav-item active' : 'nav-item'}
                  onClick={() => setActiveId(demo.id)}
                >
                  {demo.title}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      <main className="content">
        {active ? (
          <article>
            <header className="demo-header">
              <h2>{active.title}</h2>
              <p>{active.summary}</p>
              {active.topic ? (
                <p className="topic">
                  知识点文档：<code>docs/knowledge/{active.topic}.md</code>
                </p>
              ) : null}
            </header>
            <active.Component />
          </article>
        ) : (
          <p>还没有 demo，去 src/demos 下新建一个并在 src/demos/index.ts 注册。</p>
        )}
      </main>
    </div>
  )
}

export default App
