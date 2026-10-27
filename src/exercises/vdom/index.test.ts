import { beforeEach, describe, expect, it, vi } from 'vitest'
import { h, patch, render, type VNode } from '.'

function container(): HTMLDivElement {
  return document.createElement('div')
}

let root: HTMLDivElement

beforeEach(() => {
  root = container()
  document.body.append(root)
})

describe('h', () => {
  it('把类型、props、children 组装成普通对象', () => {
    const vnode = h('div', { className: 'box', id: 'root' }, h('span', {}, 'hi'), 'text')

    expect(vnode).toEqual({
      type: 'div',
      props: { className: 'box', id: 'root' },
      children: [{ type: 'span', props: {}, children: ['hi'] }, 'text'],
    })
  })

  it('props 省略时为空对象，children 会被摊平一层', () => {
    const vnode = h('ul', {}, ...[h('li', {}, 'a')], h('li', {}, 'b'))

    expect(vnode.props).toEqual({})
    expect(vnode.children).toHaveLength(2)
  })

  it('VNode 是纯数据，不持有真实 DOM 引用', () => {
    const vnode = h('p', {}, 'hello')
    const json = JSON.stringify(vnode)

    expect(json).toBe('{"type":"p","props":{},"children":["hello"]}')
    expect('el' in vnode).toBe(false)
  })
})

describe('render / createNode', () => {
  it('渲染嵌套元素、文本、属性与 className', () => {
    const node = render(
      h('section', { className: 'card', 'data-role': 'demo' }, h('h1', {}, '标题'), '正文'),
      root,
    )

    expect(node).toBe(root.firstChild)
    const section = root.querySelector('section')!
    expect(section.className).toBe('card')
    expect(section.getAttribute('data-role')).toBe('demo')
    expect(section.querySelector('h1')?.textContent).toBe('标题')
    expect(section.textContent).toBe('标题正文')
  })

  it('style 对象与布尔属性按预期落到真实 DOM 上', () => {
    render(h('input', { style: { color: 'red', fontSize: '14px' }, disabled: true }), root)

    const input = root.querySelector('input')!
    expect(input.style.color).toBe('red')
    expect(input.style.fontSize).toBe('14px')
    expect(input.disabled).toBe(true)
  })

  it('绑定事件，且 key 不会被写成 DOM 属性', () => {
    const onClick = vi.fn()
    render(h('button', { key: 'btn', onClick }, 'click'), root)

    root.querySelector('button')!.click()

    expect(onClick).toHaveBeenCalledTimes(1)
    expect(root.querySelector('button')!.hasAttribute('key')).toBe(false)
  })

  it('重复 render 会清空容器，只保留最新结果', () => {
    render(h('p', {}, 'first'), root)
    render(h('p', {}, 'second'), root)

    expect(root.childNodes).toHaveLength(1)
    expect(root.textContent).toBe('second')
  })
})

describe('patch', () => {
  it('类型相同时复用节点，只更新变化的文本', () => {
    const oldVnode = h('p', {}, 'old')
    const first = render(oldVnode, root)

    patch(root, oldVnode, h('p', {}, 'new'))

    expect(root.firstChild).toBe(first)
    expect(root.textContent).toBe('new')
  })

  it('类型不同时整棵替换', () => {
    const oldVnode = h('p', {}, 'text')
    render(oldVnode, root)

    patch(root, oldVnode, h('section', {}, 'text'))

    expect(root.firstElementChild?.tagName).toBe('SECTION')
    expect(root.childNodes).toHaveLength(1)
  })

  it('属性增删改都会同步，事件处理器会被替换而不是叠加', () => {
    const first = vi.fn()
    const second = vi.fn()
    const oldVnode = h('button', { className: 'a', title: 'old', onClick: first }, 'go')
    render(oldVnode, root)

    patch(root, oldVnode, h('button', { className: 'b', onClick: second }, 'go'))

    const button = root.querySelector('button')!
    expect(button.className).toBe('b')
    expect(button.hasAttribute('title')).toBe(false)

    button.click()
    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledTimes(1)
  })

  it('style 会被整体替换，不残留旧样式', () => {
    const oldVnode = h('div', { style: { color: 'red', width: '10px' } })
    render(oldVnode, root)

    patch(root, oldVnode, h('div', { style: { color: 'blue' } }))

    const div = root.querySelector('div')!
    expect(div.style.color).toBe('blue')
    expect(div.style.width).toBe('')
  })

  it('追加、删除子节点', () => {
    const oldVnode = h('ul', {}, h('li', {}, 'a'))
    render(oldVnode, root)

    patch(root, oldVnode, h('ul', {}, h('li', {}, 'a'), h('li', {}, 'b')))
    expect(root.querySelectorAll('li')).toHaveLength(2)
    expect(root.textContent).toBe('ab')

    patch(
      root,
      h('ul', {}, h('li', {}, 'a'), h('li', {}, 'b')),
      h('ul', {}, h('li', {}, 'b')),
    )
    expect(root.querySelectorAll('li')).toHaveLength(1)
    expect(root.textContent).toBe('b')
  })
})

describe('key 与节点复用', () => {
  function list(labels: string[], keyed: boolean): VNode {
    return h(
      'ul',
      {},
      ...labels.map((label) => h('li', keyed ? { key: label, 'data-label': label } : {}, label)),
    )
  }

  it('有 key 时重排只移动 DOM 节点，不重建', () => {
    const oldVnode = list(['A', 'B', 'C'], true)
    render(oldVnode, root)
    const before = Array.from(root.querySelectorAll('li'))
    const byLabel = new Map(before.map((node) => [node.textContent, node]))

    patch(root, oldVnode, list(['C', 'A', 'B'], true))

    const after = Array.from(root.querySelectorAll('li'))
    expect(after.map((node) => node.textContent)).toEqual(['C', 'A', 'B'])
    after.forEach((node) => {
      // 同一个 DOM 实例被移动，而不是被重新创建
      expect(byLabel.get(node.textContent)).toBe(node)
    })
  })

  it('没有 key 时按下标复用：节点原地不动、只改文本（index key 的坑）', () => {
    const oldVnode = h('ul', {}, h('li', {}, 'A'), h('li', {}, 'B'))
    render(oldVnode, root)
    const before = Array.from(root.querySelectorAll('li'))

    patch(root, oldVnode, h('ul', {}, h('li', {}, 'B'), h('li', {}, 'A')))

    const after = Array.from(root.querySelectorAll('li'))
    expect(after.map((node) => node.textContent)).toEqual(['B', 'A'])
    expect(after[0]).toBe(before[0])
    expect(after[1]).toBe(before[1])
  })

  it('key 变化会被识别为新节点，旧的卸载', () => {
    const oldVnode = h('ul', {}, h('li', { key: 'a' }, 'A'))
    render(oldVnode, root)
    const before = root.querySelector('li')

    patch(root, oldVnode, h('ul', {}, h('li', { key: 'b' }, 'A')))

    expect(root.querySelector('li')).not.toBe(before)
    expect(root.querySelectorAll('li')).toHaveLength(1)
  })

  it('未受影响的兄弟节点保持原实例', () => {
    const oldVnode = h('div', {}, h('p', {}, 'stay'), h('span', {}, 'change'))
    render(oldVnode, root)
    const p = root.querySelector('p')

    patch(root, oldVnode, h('div', {}, h('p', {}, 'stay'), h('span', {}, 'changed')))

    expect(root.querySelector('p')).toBe(p)
    expect(root.querySelector('span')?.textContent).toBe('changed')
  })
})
