import { useState } from 'react'
import { EffectOrderExample } from './EffectOrderExample'
import { OtherHooksExample } from './OtherHooksExample'
import { PerfExample } from './PerfExample'
import { React19Example } from './React19Example'
import { RefExample } from './RefExample'
import { StateContextExample } from './StateContextExample'

const TABS = [
  { id: 'state', label: '状态与上下文', Component: StateContextExample },
  { id: 'effect', label: '副作用与顺序', Component: EffectOrderExample },
  { id: 'ref', label: 'Ref 与命令式', Component: RefExample },
  { id: 'perf', label: '性能与过渡', Component: PerfExample },
  { id: 'other', label: '其他内置 hooks', Component: OtherHooksExample },
  { id: 'react19', label: 'React 19 新 hooks', Component: React19Example },
] as const

type TabId = (typeof TABS)[number]['id']

export default function HooksDemo() {
  const [activeId, setActiveId] = useState<TabId>('state')
  const active = TABS.find((tab) => tab.id === activeId) ?? TABS[0]

  return (
    <div className="demo-body">
      <div role="tablist" aria-label="hooks 分类" className="demo-actions">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={tab.id === activeId}
            disabled={tab.id === activeId}
            onClick={() => setActiveId(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div role="tabpanel">
        <active.Component />
      </div>
    </div>
  )
}
