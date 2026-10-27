import { useCallback, useState } from 'react'

/**
 * 示例练习：手写 useToggle（React hook）。
 * hook 类练习同样放在 src/exercises/<name>/，
 * 用 @testing-library/react 的 renderHook + act 覆盖状态流转。
 */
export function useToggle(initialValue = false) {
  const [value, setValue] = useState(initialValue)

  const toggle = useCallback((nextValue?: boolean) => {
    setValue((current) => (typeof nextValue === 'boolean' ? nextValue : !current))
  }, [])

  return [value, toggle] as const
}
