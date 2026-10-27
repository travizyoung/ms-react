import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// 每个用例结束后卸载 React 树，避免 DOM 泄漏到下一个用例。
afterEach(() => {
  cleanup()
})
