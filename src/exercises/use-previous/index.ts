import { useEffect, useRef } from 'react'

/**
 * 保存上一次渲染的值。
 * 关键点：用 ref 存值不会触发重渲染；写入放在 effect 里，保证读到的是「上一次提交」的值。
 * 常见场景：对比 props 变化、只在值变化时执行某些逻辑、动画/滚动方向判断。
 */
export function usePrevious<T>(value: T): T | undefined {
  const previousRef = useRef<T | undefined>(undefined)

  useEffect(() => {
    previousRef.current = value
  }, [value])

  // oxlint-disable-next-line react/refs -- usePrevious 的契约就是渲染时返回「上一次提交」的 ref 值
  return previousRef.current
}
