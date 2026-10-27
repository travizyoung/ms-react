import { SetDataPanel } from './SetDataPanel'
import { VirtualListPanel } from './VirtualListPanel'

export default function PerformanceDemo() {
  return (
    <div className="demo-body">
      <VirtualListPanel />
      <SetDataPanel />
    </div>
  )
}
