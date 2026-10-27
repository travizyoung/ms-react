import { useState } from 'react'
import { createBatchedSetData, type DataPatch } from '@/exercises/set-data-scheduler'

interface SetDataPanelProps {
  /** 商品数量，测试时可以调小 */
  count?: number
  /** 模拟逻辑层 → 渲染层单次通信耗时（ms） */
  latency?: number
}

type Strategy = 'per-item' | 'batched' | 'bulk'

interface Item {
  id: number
  name: string
  price: number
}

interface RunResult {
  messages: number
  chars: number
  fields: number
  ms: number
}

const STRATEGY_LABELS: Record<Strategy, string> = {
  'per-item': '逐条 setData',
  batched: '合并 + 路径更新',
  bulk: '一次 setData 全量 list',
}

const DEFAULT_COUNT = 100
const DEFAULT_LATENCY = 4

function createItems(count: number): Item[] {
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    name: `商品 ${index + 1}`,
    price: 100 + index,
  }))
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

// 计时封装在模块层，避免在组件函数体里直接调用 impure 的 performance.now
const now = () => performance.now()

export function SetDataPanel({
  count = DEFAULT_COUNT,
  latency = DEFAULT_LATENCY,
}: SetDataPanelProps) {
  const [items, setItems] = useState<Item[]>(() => createItems(count))
  const [results, setResults] = useState<Partial<Record<Strategy, RunResult>>>({})
  const [running, setRunning] = useState<Strategy | null>(null)

  const run = async (strategy: Strategy) => {
    if (running !== null) return
    setRunning(strategy)

    const next = items.map((item) => ({ ...item, price: item.price + 1 }))
    const startedAt = now()
    let messages = 0
    let chars = 0
    let fields = 0

    const send = async (patch: DataPatch) => {
      messages += 1
      chars += JSON.stringify(patch).length
      // 模拟小程序逻辑层 → 渲染层的跨线程通信成本
      await sleep(latency)
    }

    if (strategy === 'per-item') {
      for (let index = 0; index < next.length; index += 1) {
        await send({ [`items[${index}].price`]: next[index]!.price })
        fields += 1
      }
    } else if (strategy === 'batched') {
      await new Promise<void>((resolve) => {
        const scheduler = createBatchedSetData({
          onFlush: (payload) => {
            void send(payload).then(resolve)
          },
        })
        next.forEach((item, index) => {
          // 同一 tick 内 100 次 setData，交给调度器合并成 1 次
          scheduler.setData({ [`items[${index}].price`]: item.price })
          fields += 1
        })
      })
    } else {
      await send({ items: next })
      fields = next.length * 3
    }

    setItems(next)
    setResults((previous) => ({
      ...previous,
      [strategy]: { messages, chars, fields, ms: now() - startedAt },
    }))
    setRunning(null)
  }

  const reset = () => {
    setItems(createItems(count))
    setResults({})
  }

  const strategies: Strategy[] = ['per-item', 'batched', 'bulk']

  return (
    <section className="demo-panel">
      <h3>2. 小程序 setData：次数、体积与路径更新</h3>
      <p>
        模拟 {count} 件商品价格 +1。三颗按钮做同一件事，但走不同的 setData 策略；
        「耗时」里包含模拟的跨线程通信（每次消息 {latency}ms）。
      </p>

      <div className="demo-actions">
        {strategies.map((strategy) => (
          <button
            key={strategy}
            type="button"
            disabled={running !== null}
            onClick={() => void run(strategy)}
          >
            {running === strategy ? '执行中…' : STRATEGY_LABELS[strategy]}
          </button>
        ))}
        <button type="button" disabled={running !== null} onClick={reset}>
          重置数据
        </button>
      </div>

      <table className="metric-table">
        <thead>
          <tr>
            <th>策略</th>
            <th>通信次数</th>
            <th>payload（字符）</th>
            <th>传输字段数</th>
            <th>总耗时</th>
          </tr>
        </thead>
        <tbody>
          {strategies.map((strategy) => {
            const result = results[strategy]
            return (
              <tr key={strategy}>
                <td>{STRATEGY_LABELS[strategy]}</td>
                <td>{result ? result.messages : '—'}</td>
                <td>{result ? result.chars.toLocaleString('en-US') : '—'}</td>
                <td>{result ? result.fields : '—'}</td>
                <td>{result ? `${result.ms.toFixed(0)} ms` : '—'}</td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <p className="metric">
        数据预览：
        {items.slice(0, 4).map((item) => `${item.name} ¥${item.price}`).join('，')}……
      </p>

      <p className="hint">
        小程序是双线程模型：逻辑层和渲染层不共享内存，每次 setData 都要序列化、跨线程传输、在渲染层做 diff。
        所以「逐条传 100 次」会把通信成本放大 100 倍；「一次传整个 list」虽然只通信 1 次，但 payload 大；
        「合并 + 路径更新」把两者都压到最小。另外注意：setData 只传 UI 用得到的字段，
        不要把大对象（原始列表、缓存、DOM 无关数据）塞进 data。
      </p>
    </section>
  )
}
