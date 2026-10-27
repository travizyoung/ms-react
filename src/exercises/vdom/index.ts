/**
 * 手写最小虚拟 DOM：h / render / patch。
 *
 * 设计取舍（也是面试时要能讲清楚的点）：
 * - VNode 只是普通对象，不持有真实 DOM 引用，所以可以跨平台、可以对比。
 * - patch 采用「同层对比 + key 复用」：类型不同就整棵替换，类型相同就只改变化的部分。
 * - 为了教学可读，这里用 O(n) 的 key 映射 + insertBefore 移动节点，不实现双端对比（Vue 那套）。
 */

export type VNodeProps = Record<string, unknown>

export interface VElement {
  type: string
  props: VNodeProps
  children: VNode[]
}

export type VNode = VElement | string | number

export function h(type: string, props: VNodeProps = {}, ...children: VNode[]): VElement {
  return { type, props, children: children.flat() }
}

export function isElement(vnode: VNode): vnode is VElement {
  return typeof vnode === 'object' && vnode !== null
}

/** 把 VNode 转成真实 DOM；首次挂载和替换节点都走这里。 */
export function createNode(vnode: VNode): Node {
  if (!isElement(vnode)) {
    return document.createTextNode(String(vnode))
  }

  const el = document.createElement(vnode.type)
  applyProps(el, {}, vnode.props)
  for (const child of vnode.children) {
    el.appendChild(createNode(child))
  }
  return el
}

/** 首次渲染：清空容器再挂载，返回挂载出来的根节点。 */
export function render(vnode: VNode, container: Element): Node {
  const node = createNode(vnode)
  container.replaceChildren(node)
  return node
}

/** 对比新旧 VNode，把差异写进 parent 的第 index 个子节点。 */
export function patch(parent: Node, oldVnode: VNode, newVnode: VNode, index = 0): void {
  const oldNode = parent.childNodes[index]

  if (!oldNode) {
    parent.appendChild(createNode(newVnode))
    return
  }

  patchNode(oldNode, oldVnode, newVnode)
}

function patchNode(oldNode: Node, oldVnode: VNode, newVnode: VNode): void {
  const oldIsElement = isElement(oldVnode)
  const newIsElement = isElement(newVnode)

  if (!oldIsElement && !newIsElement) {
    const text = String(newVnode)
    if (oldNode.nodeValue !== text) {
      oldNode.nodeValue = text
    }
    return
  }

  // 类型不同（div → span、文本 → 元素）没有复用价值，整棵替换。
  if (!oldIsElement || !newIsElement || oldVnode.type !== newVnode.type) {
    oldNode.parentNode?.replaceChild(createNode(newVnode), oldNode)
    return
  }

  applyProps(oldNode as Element, oldVnode.props, newVnode.props)
  patchChildren(oldNode as Element, oldVnode.children, newVnode.children)
}

function patchChildren(parent: Element, oldChildren: VNode[], newChildren: VNode[]): void {
  // 先对 DOM 拍快照：快照下标与 oldChildren 一一对应，后续移动节点不会打乱映射。
  const oldNodes = Array.from(parent.childNodes)
  const unmatched = new Map<string, { vnode: VNode; node: Node }>()

  oldChildren.forEach((child, index) => {
    unmatched.set(getKey(child, index), { vnode: child, node: oldNodes[index]! })
  })

  newChildren.forEach((child, index) => {
    const key = getKey(child, index)
    const match = unmatched.get(key)
    const reference = parent.childNodes[index] ?? null

    if (!match) {
      parent.insertBefore(createNode(child), reference)
      return
    }

    unmatched.delete(key)
    patchNode(match.node, match.vnode, child)
    // 同 key 的节点可能换了位置：不重建，只 insertBefore 移动。
    if (reference !== match.node) {
      parent.insertBefore(match.node, reference)
    }
  })

  // 新列表里没出现的旧节点直接卸载。
  for (const { node } of unmatched.values()) {
    node.parentNode?.removeChild(node)
  }
}

/** key 优先；没有 key 时退化为下标 —— 这正是「用 index 当 key」的语义。 */
function getKey(vnode: VNode, index: number): string {
  if (isElement(vnode) && vnode.props.key !== undefined) {
    return `key:${String(vnode.props.key)}`
  }
  return `index:${index}`
}

function applyProps(el: Element, oldProps: VNodeProps, newProps: VNodeProps): void {
  for (const name of Object.keys(oldProps)) {
    if (name === 'key') continue
    if (!(name in newProps)) {
      removeProp(el, name, oldProps[name])
    }
  }

  for (const name of Object.keys(newProps)) {
    if (name === 'key') continue
    if (oldProps[name] !== newProps[name]) {
      setProp(el, name, newProps[name], oldProps[name])
    }
  }
}

function setProp(el: Element, name: string, value: unknown, previous: unknown): void {
  if (name === 'style') {
    applyStyle(el as HTMLElement, value)
    return
  }

  if (isEventProp(name, value)) {
    if (isEventProp(name, previous)) {
      el.removeEventListener(eventName(name), previous)
    }
    el.addEventListener(eventName(name), value)
    return
  }

  if (value === false || value === null || value === undefined) {
    el.removeAttribute(attrName(name))
    return
  }

  el.setAttribute(attrName(name), value === true ? '' : String(value))
}

function removeProp(el: Element, name: string, value: unknown): void {
  if (name === 'style') {
    el.removeAttribute('style')
    return
  }

  if (isEventProp(name, value)) {
    el.removeEventListener(eventName(name), value)
    return
  }

  el.removeAttribute(attrName(name))
}

// React 用 className 而不是 class，这里做一次映射，保证手写实现和 React 的写法一致。
function attrName(name: string): string {
  return name === 'className' ? 'class' : name
}

function isEventProp(name: string, value: unknown): value is EventListener {
  return name.startsWith('on') && typeof value === 'function'
}

function eventName(name: string): string {
  return name.slice(2).toLowerCase()
}

function applyStyle(el: HTMLElement, value: unknown): void {
  el.removeAttribute('style')

  if (typeof value === 'string') {
    el.setAttribute('style', value)
    return
  }

  if (value && typeof value === 'object') {
    const style = el.style as unknown as Record<string, string>
    for (const [prop, raw] of Object.entries(value as Record<string, unknown>)) {
      style[prop] = String(raw)
    }
  }
}
