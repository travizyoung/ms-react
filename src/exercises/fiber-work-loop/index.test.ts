import { describe, expect, it } from 'vitest'
import { createFiberTree, createWorkLoop, type FiberDescriptor } from '.'

const tree: FiberDescriptor = {
  name: 'App',
  children: [
    { name: 'Header' },
    {
      name: 'Main',
      children: [
        { name: 'List', children: [{ name: 'Item 1' }, { name: 'Item 2' }] },
        { name: 'Sidebar' },
      ],
    },
    { name: 'Footer' },
  ],
}

describe('createFiberTree', () => {
  it('按 child / sibling / return 建立指针', () => {
    const root = createFiberTree(tree)

    expect(root.name).toBe('App')
    expect(root.return).toBeNull()
    expect(root.child?.name).toBe('Header')
    expect(root.child?.sibling?.name).toBe('Main')
    expect(root.child?.sibling?.sibling?.name).toBe('Footer')
    expect(root.child?.sibling?.sibling?.sibling).toBeNull()

    const main = root.child!.sibling!
    expect(main.return).toBe(root)
    expect(main.child?.name).toBe('List')
    expect(main.child?.return).toBe(main)
    expect(main.child?.sibling?.name).toBe('Sidebar')
    expect(main.child?.sibling?.sibling).toBeNull()

    const list = main.child!
    expect(list.child?.name).toBe('Item 1')
    expect(list.child?.sibling?.name).toBe('Item 2')
    expect(list.child?.return).toBe(list)
  })

  it('没有子节点时 child 为 null', () => {
    const root = createFiberTree({ name: 'only' })

    expect(root.child).toBeNull()
    expect(root.sibling).toBeNull()
  })
})

describe('createWorkLoop', () => {
  it('不中断时按深度优先顺序访问完整棵树', () => {
    const loop = createWorkLoop(createFiberTree(tree))

    expect(loop.workUntilYield()).toBe(true)
    expect(loop.visited).toEqual([
      'App',
      'Header',
      'Main',
      'List',
      'Item 1',
      'Item 2',
      'Sidebar',
      'Footer',
    ])
    expect(loop.done).toBe(true)
  })

  it('按 shouldYield 分段执行，恢复后不重复访问节点', () => {
    let allowed = 3
    const loop = createWorkLoop(createFiberTree(tree), () => allowed-- <= 0)

    expect(loop.workUntilYield()).toBe(false)
    expect(loop.visited).toEqual(['App', 'Header', 'Main'])

    // 模拟下一次时间片：继续从 nextUnitOfWork 恢复
    allowed = 100
    expect(loop.workUntilYield()).toBe(true)
    expect(loop.visited).toEqual([
      'App',
      'Header',
      'Main',
      'List',
      'Item 1',
      'Item 2',
      'Sidebar',
      'Footer',
    ])
  })

  it('按固定预算切片执行，累计进度单调递增直到完成', () => {
    let unitsInSlice = 0
    const loop = createWorkLoop(createFiberTree(tree), () => {
      unitsInSlice += 1
      return unitsInSlice > 3
    })
    const slices: number[] = []

    while (!loop.workUntilYield()) {
      slices.push(loop.visited.length)
      unitsInSlice = 0
    }

    expect(slices.length).toBeGreaterThan(1)
    expect(slices).toEqual([...slices].sort((a, b) => a - b))
    expect(new Set(slices).size).toBe(slices.length)
    expect(loop.visited).toHaveLength(8)
    expect(loop.done).toBe(true)
  })

  it('完成之后再调用不会重复访问', () => {
    const loop = createWorkLoop(createFiberTree(tree))

    loop.workUntilYield()
    const visitedCount = loop.visited.length

    expect(loop.workUntilYield()).toBe(true)
    expect(loop.visited).toHaveLength(visitedCount)
  })

  it('单节点树也能正确结束', () => {
    const loop = createWorkLoop(createFiberTree({ name: 'root' }))

    expect(loop.workUntilYield()).toBe(true)
    expect(loop.visited).toEqual(['root'])
  })

  it('深链与多兄弟节点都能正确回溯', () => {
    const loop = createWorkLoop(
      createFiberTree({
        name: 'a',
        children: [
          { name: 'b', children: [{ name: 'c', children: [{ name: 'd' }] }] },
          { name: 'e', children: [{ name: 'f' }] },
        ],
      }),
    )

    loop.workUntilYield()

    expect(loop.visited).toEqual(['a', 'b', 'c', 'd', 'e', 'f'])
  })
})
