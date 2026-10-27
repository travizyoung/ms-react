/**
 * 示例练习：手写 curry（纯 TS，不涉及 React）。
 * 这类「非理论知识点」练习都放在 src/exercises/<name>/ 下，
 * 实现与单测同目录，改实现必须同步改单测。
 */
export function curry<Args extends unknown[], R>(
  fn: (...args: Args) => R,
  arity: number = fn.length,
) {
  return function curried(...args: unknown[]): unknown {
    if (args.length >= arity) {
      return fn(...(args as Args))
    }
    return (...rest: unknown[]) => curried(...args, ...rest)
  }
}
