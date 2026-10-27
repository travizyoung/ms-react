/**
 * 手写浅比较：React.memo / PureComponent 决定「要不要跳过渲染」时用的就是这套逻辑。
 *
 * 规则（和 React 的实现保持一致）：
 * - 先 Object.is 比较，处理基本类型、NaN、+0/-0。
 * - 任一不是对象（或为 null）→ 不相等。
 * - 只比自有可枚举 key：数量相同、key 都存在、每个值 Object.is 相等。
 * - 不做深比较：嵌套对象仍按引用比，这是「memo 被嵌套对象击穿」的根因。
 */

export function shallowEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true

  if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) {
    return false
  }

  const aRecord = a as Record<string, unknown>
  const bRecord = b as Record<string, unknown>
  const aKeys = Object.keys(aRecord)
  const bKeys = Object.keys(bRecord)

  if (aKeys.length !== bKeys.length) return false

  return aKeys.every(
    (key) => Object.prototype.hasOwnProperty.call(bRecord, key) && Object.is(aRecord[key], bRecord[key]),
  )
}
