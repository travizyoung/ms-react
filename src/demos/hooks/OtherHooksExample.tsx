import { useId, useSyncExternalStore } from 'react'

function createCounterStore(initialValue: number) {
  let value = initialValue
  const listeners = new Set<() => void>()

  return {
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    getSnapshot() {
      return value
    },
    increment() {
      value += 1
      for (const listener of listeners) listener()
    },
  }
}

const externalStore = createCounterStore(0)

function StoreConsumer({ label }: { label: string }) {
  const value = useSyncExternalStore(externalStore.subscribe, externalStore.getSnapshot)

  return (
    <span className="metric">
      {label}：{value}
    </span>
  )
}

export function OtherHooksExample() {
  const nameId = useId()
  const emailId = useId()

  return (
    <section className="demo-panel">
      <h3>useId / useSyncExternalStore / useDebugValue</h3>

      <div className="hook-example">
        <h4>useId：生成 SSR 安全的稳定 id</h4>
        <p>
          <label htmlFor={nameId}>姓名</label>
          <input id={nameId} aria-label="姓名" placeholder="label 的 htmlFor 与 input 的 id 用同一个 useId" />
        </p>
        <p>
          <label htmlFor={emailId}>邮箱</label>
          <input id={emailId} aria-label="邮箱" placeholder="每个组件实例的 useId 互不相同" />
        </p>
        <p className="hint">
          生成的 id 形如 <code>{nameId}</code>：服务端和客户端一致，不会 hydration 不匹配；不要用它当列表 key。
        </p>
      </div>

      <div className="hook-example">
        <h4>useSyncExternalStore：订阅 React 之外的数据源</h4>
        <div className="demo-actions">
          <StoreConsumer label="消费者 A" />
          <StoreConsumer label="消费者 B" />
          <button type="button" onClick={() => externalStore.increment()}>
            外部 store +1
          </button>
        </div>
        <p className="hint">
          两个消费者订阅同一个 store，store 变化时都会同步更新；适合浏览器 API、状态库、WebSocket 这类外部数据源，
          能避免在 effect 里订阅导致的撕裂（tearing）问题。
        </p>
      </div>

      <div className="hook-example">
        <h4>useDebugValue（仅 DevTools 可见）</h4>
        <p className="hint">
          自定义 hook 里调用 <code>useDebugValue(value)</code>，可以在 React DevTools 的 Hooks 面板里显示调试信息；
          它不影响页面渲染，所以这里没有可视化演示。本项目练习 <code>src/exercises/use-previous</code> 就属于适合加它的场景。
        </p>
      </div>
    </section>
  )
}
