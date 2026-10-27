import type { Demo } from '../types'
import VirtualDomDemo from './Demo'

export const demo: Demo = {
  id: 'virtual-dom',
  title: '虚拟 DOM：diff、key 与节点复用',
  summary: '手写 VNode/patch 观察 diff 结果，并用 React 对比 key=id 与 key=index 的 DOM 复用差异',
  topic: 'virtual-dom',
  Component: VirtualDomDemo,
}
