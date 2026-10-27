import { useState } from 'react'

export default function HelloReactDemo() {
  const [count, setCount] = useState(0)

  return (
    <div className="demo-body">
      <p>
        这是一个 demo 模板。每个知识点一个目录，目录里放可运行的验证代码，页面上直接看到结论，
        不要只写注释。
      </p>
      <button type="button" onClick={() => setCount((c) => c + 1)}>
        count: {count}
      </button>
    </div>
  )
}
