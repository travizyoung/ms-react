import { useEffect, useState } from 'react'

/**
 * 防抖值：输入变化后等 delay 毫秒才更新返回值。
 * 典型场景：搜索框联想、表单校验、用输入值作为请求依赖时避免每个字符都发请求。
 * 注意：它只延迟「值」，不取消已经发出的请求；请求竞态要额外处理。
 */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}
