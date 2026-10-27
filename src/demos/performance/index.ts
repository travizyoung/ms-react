import type { Demo } from '../types'
import PerformanceDemo from './Demo'

export const demo: Demo = {
  id: 'performance',
  title: '性能优化：长列表与 setData',
  summary: 'H5 长列表验证虚拟滚动对 DOM 数量的影响；模拟小程序双线程通信，对比 setData 的次数、体积与耗时',
  topic: 'performance',
  Component: PerformanceDemo,
}
