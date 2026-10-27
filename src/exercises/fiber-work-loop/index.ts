/**
 * 手写 Fiber 工作循环的最小骨架。
 *
 * 真实 Fiber 节点有三根关键指针：
 * - child：第一个子节点
 * - sibling：下一个兄弟节点
 * - return：父节点（回溯用）
 * 三者配合可以用「循环 + 回溯」完成深度优先遍历，从而随时保存 nextUnitOfWork、让出主线程、下次继续。
 *
 * 这里省略了 completeWork、effectTag、lane 等，只保留「可中断的遍历」这一核心。
 */

export interface FiberDescriptor {
  name: string
  children?: FiberDescriptor[]
}

export interface FiberUnit {
  name: string
  child: FiberUnit | null
  sibling: FiberUnit | null
  return: FiberUnit | null
}

export interface WorkLoop {
  /** 继续执行，直到 shouldYield 返回 true 或整棵树处理完；返回是否已经完成 */
  workUntilYield: () => boolean
  /** 已经「工作」过的节点（按访问顺序） */
  readonly visited: readonly string[]
  readonly done: boolean
}

/** 把嵌套描述转成带 child/sibling/return 指针的 Fiber 树 */
export function createFiberTree(descriptor: FiberDescriptor): FiberUnit {
  const build = (node: FiberDescriptor, parent: FiberUnit | null): FiberUnit => {
    const unit: FiberUnit = { name: node.name, child: null, sibling: null, return: parent }
    let previousSibling: FiberUnit | null = null

    for (const child of node.children ?? []) {
      const childUnit = build(child, unit)
      if (previousSibling) {
        previousSibling.sibling = childUnit
      } else {
        unit.child = childUnit
      }
      previousSibling = childUnit
    }

    return unit
  }

  return build(descriptor, null)
}

/** 完成一个工作单元后，下一个该处理谁 */
function nextUnitOfWork(node: FiberUnit): FiberUnit | null {
  if (node.child) return node.child

  let current: FiberUnit | null = node
  while (current) {
    if (current.sibling) return current.sibling
    current = current.return
  }
  return null
}

export function createWorkLoop(
  root: FiberUnit,
  shouldYield: () => boolean = () => false,
): WorkLoop {
  let next: FiberUnit | null = root
  const visited: string[] = []

  const workUntilYield = (): boolean => {
    while (next && !shouldYield()) {
      visited.push(next.name)
      next = nextUnitOfWork(next)
    }
    return next === null
  }

  return {
    workUntilYield,
    get visited() {
      return visited
    },
    get done() {
      return next === null
    },
  }
}
