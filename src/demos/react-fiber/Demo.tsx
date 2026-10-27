import { TimeSlicePanel } from './TimeSlicePanel'
import { WorkLoopPanel } from './WorkLoopPanel'

export default function ReactFiberDemo() {
  return (
    <div className="demo-body">
      <WorkLoopPanel />
      <TimeSlicePanel />
    </div>
  )
}
