import type { Demo } from '../types'
import HelloReactDemo from './Demo'

export const demo: Demo = {
  id: 'hello-react',
  title: 'Demo 目录约定',
  summary: '演示 src/demos 的写法：一个知识点一个目录，导出 Demo 元信息与组件',
  Component: HelloReactDemo,
}
