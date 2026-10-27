import type { Demo } from '../types'
import PerformanceDemo from './Demo'

export const demo: Demo = {
  id: 'performance',
  title: '性能优化：长列表、setData 与 React 渲染',
  summary: 'H5 长列表验证虚拟滚动对 DOM 数量的影响；模拟小程序双线程通信对比 setData；观察 memo 与稳定 props 对 React 渲染次数的影响',
  topic: 'performance',
  Component: PerformanceDemo,
}
