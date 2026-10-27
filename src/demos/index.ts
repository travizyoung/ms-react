import type { Demo } from './types'
import { demo as helloReact } from './hello-react'
import { demo as hooks } from './hooks'
import { demo as performance } from './performance'
import { demo as reactFiber } from './react-fiber'
import { demo as virtualDom } from './virtual-dom'

/**
 * 所有可运行 demo 的注册表。新增 demo 后在这里追加一行。
 * 顺序即侧边栏展示顺序。
 */
export const demos: Demo[] = [virtualDom, reactFiber, performance, hooks, helloReact]
