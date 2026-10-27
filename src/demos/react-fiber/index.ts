import type { Demo } from '../types'
import ReactFiberDemo from './Demo'

export const demo: Demo = {
  id: 'react-fiber',
  title: 'React 核心与 Fiber：可中断的协调',
  summary: '手写 child/sibling/return 工作循环观察分片与恢复；对比同步渲染与 startTransition 的输入响应',
  topic: 'react-fiber',
  Component: ReactFiberDemo,
}
