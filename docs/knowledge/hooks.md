# React Hooks 全景

> 一句话结论：React 内置 hooks 按职责分 6 类（状态、上下文、Ref、副作用、性能、其他 + React 19 新 API）；
> 选哪个由三个问题决定：这份数据要不要触发渲染？副作用什么时候执行？值要不要跨渲染保存？

## 一、一张表看全（React 19）

| 分组 | Hook | 作用 | 典型场景 |
| --- | --- | --- | --- |
| 状态 | `useState` | 声明可触发渲染的局部状态 | 表单输入、开关、计数器 |
| 状态 | `useReducer` | 用 reducer 管理复杂状态迁移 | 多字段表单、列表增删改、状态机 |
| 上下文 | `useContext` | 读取 Provider 提供的值 | 主题、登录用户、i18n、全局配置 |
| Ref | `useRef` | 跨渲染保存可变值，不触发渲染 | DOM 节点、定时器 id、上一次的值 |
| Ref | `useImperativeHandle` | 自定义 ref 暴露的命令式 API | `focus()`、`scrollTo()`、播放器控制 |
| 副作用 | `useEffect` | 绘制后执行副作用，可清理 | 请求、订阅、事件监听、同步外部系统 |
| 副作用 | `useLayoutEffect` | 绘制前同步执行，能读写布局 | 测量元素、滚动定位、避免闪烁 |
| 副作用 | `useInsertionEffect` | DOM 变更前注入样式 | CSS-in-JS 库专用，业务几乎不用 |
| 性能 | `useMemo` | 缓存计算结果 / 稳定引用 | 昂贵计算、稳定的对象/数组引用 |
| 性能 | `useCallback` | 缓存函数引用 | 传给 `memo` 子组件、作为依赖 |
| 性能 | `useTransition` | 把某次更新标记为低优先级 | 大列表过滤、路由切换、非紧急渲染 |
| 性能 | `useDeferredValue` | 给值生成低优先级副本 | 搜索结果延迟渲染 |
| 其他 | `useId` | 生成 SSR 安全的稳定 id | `label`/`input` 关联、组件内唯一 id |
| 其他 | `useSyncExternalStore` | 订阅 React 之外的数据源 | 浏览器 API、状态库、WebSocket |
| 其他 | `useDebugValue` | 在 DevTools 显示自定义 hook 调试信息 | 封装通用逻辑的自定义 hook |
| React 19 | `use` | 在渲染中读取 Promise / Context | 配合 `Suspense` 读异步数据 |
| React 19 | `useActionState` | 表单 action 的状态与 pending | 提交表单、渐进增强 |
| React 19 | `useOptimistic` | 乐观更新，失败自动回滚 | 点赞、发消息、添加待办 |
| React 19 | `useFormStatus` | 读取所在 `<form>` 的提交状态 | 提交按钮的 loading 态 |

## 二、状态类：useState / useReducer

### useState

```tsx
const [value, setValue] = useState(initialValue)
```

使用场景：组件内部、与渲染直接相关的简单状态。

坑：

- **函数式更新**：新值依赖旧值时用 `setCount((c) => c + 1)`，否则同一事件里连续两次 `setCount(count + 1)` 只加 1。
- **对象状态要展开**：`setUser({ ...user, name })`，`setState` 是替换不是合并。
- **惰性初始化**：`useState(() => expensive())`，只算一次。
- **state 不会立即变**：同一轮渲染里读到的还是旧值。

### useReducer

```tsx
const [state, dispatch] = useReducer(reducer, initialState)
```

使用场景：状态字段多、更新逻辑分散在多个 action、下一个状态依赖复杂条件；或者想把状态迁移逻辑抽出来单独测试。
和 `useState` 不是替代关系：简单布尔/数字用 `useState`，复杂对象和状态机用 `useReducer`。

## 三、上下文与 Ref：useContext / useRef / useImperativeHandle

### useContext

读取祖先 `Provider` 的值，避免 props 层层透传。常用于主题、登录态、国际化、全局配置。

坑：

- **value 引用变化会让所有消费者重渲染**：`<Provider value={{ user }}>` 每次渲染新建对象，要用 `useMemo` 稳定。
- **一个 context 别塞所有状态**：按更新频率拆分；高频状态单独放；消费组件用 `memo` 或 selector 订阅。

### useRef

```tsx
const ref = useRef(initialValue) // { current: initialValue }，改 current 不触发渲染
```

使用场景：DOM 节点、定时器 id、上一次的值、WebSocket 实例、任何「不需要参与渲染」的可变数据。

与 `useState` 的区别：`useRef` 改值不重渲染，且在整个生命周期内保持同一个对象；`useState` 改值触发渲染。
需要界面跟着变就用 state，只是"记住"就用 ref。

### useImperativeHandle

配合 `ref` 暴露受控的命令式 API（焦点、滚动、播放）。React 19 起 `ref` 可以直接作为 prop，不再强制 `forwardRef`。

```tsx
function FancyInput({ ref }: { ref?: Ref<{ focus: () => void }> }) {
  const inputRef = useRef<HTMLInputElement>(null)
  useImperativeHandle(ref, () => ({ focus: () => inputRef.current?.focus() }), [])
  return <input ref={inputRef} />
}
```

原则：优先用 props 传数据，命令式 API 只用于「动作」。

## 四、副作用：useEffect / useLayoutEffect / useInsertionEffect

执行顺序：

```
render → useInsertionEffect → DOM 变更 → useLayoutEffect → 浏览器绘制 → useEffect
```

- **useEffect**：绘制后异步执行，不阻塞首屏。适合请求、订阅、日志、同步外部系统。记得返回清理函数。
- **useLayoutEffect**：DOM 更新后、绘制前同步执行。适合测量布局、滚动定位、避免闪烁。会阻塞绘制，SSR 下会警告。
- **useInsertionEffect**：DOM 变更前执行，只给 CSS-in-JS 注入样式；不能读 DOM，业务代码基本不用。

依赖数组三种形态：

| 写法 | 含义 |
| --- | --- |
| `useEffect(fn)` | 每次渲染后都执行（通常不是你想要的） |
| `useEffect(fn, [])` | 只在挂载后执行一次 |
| `useEffect(fn, [a, b])` | `a` 或 `b` 变化时执行 |

坑：

- **闭包陷阱**：effect 里读到的是创建时的变量；漏依赖会拿到旧值，把依赖补全或改用函数式更新。
- **对象/函数依赖**：每次渲染新建的依赖会让 effect 每次都跑，用 `useMemo/useCallback` 稳定或用基础值做依赖。
- **StrictMode 双执行**：开发模式挂载时会「执行 → 清理 → 再执行」，用来暴露没写清理的 effect，不是 bug。
- **不要用 effect 同步派生 state**：能直接算的就在 render 里算，或 `useMemo`。

## 五、性能类：useMemo / useCallback / useTransition / useDeferredValue

- **useMemo**：缓存计算结果或稳定引用。只在「计算昂贵」或「引用要稳定」时用；依赖写错等于没缓存。
- **useCallback**：`useMemo` 的函数版，本质是缓存函数引用。收益发生在依赖它的地方（`memo` 子组件、effect 依赖）。
- **useTransition**：`const [isPending, startTransition] = useTransition()`，把某次 `setState` 标记为低优先级，
  紧急更新（输入）先渲染，过渡更新可被打断。
- **useDeferredValue**：`const deferred = useDeferredValue(value)`，给已有值生成低优先级副本，适合「派生渲染很重」的场景。

`useTransition` vs `useDeferredValue`：前者你控制「哪次更新」降级，后者你控制「哪个值」降级；
数据源不在你手里（比如来自 props 或第三方）时用 `useDeferredValue` 更顺手。

## 六、其他内置 hooks：useId / useSyncExternalStore / useDebugValue

- **useId**：生成在服务端与客户端一致的唯一 id，用于 `label htmlFor`、`aria-describedby`；不要拿它当列表 key。
- **useSyncExternalStore**：订阅 React 之外的 store（浏览器 API、状态库、WebSocket）。它保证快照一致性，
  避免并发渲染下的撕裂（tearing）。签名：`useSyncExternalStore(subscribe, getSnapshot)`。
- **useDebugValue**：只在 React DevTools 中显示自定义 hook 的调试信息，不参与渲染。

## 七、React 19 新 hooks

- **`use(resource)`**：在渲染中读取 Promise 或 Context。它不是 Hook，可以写在条件里；
  读取 Promise 时需要上层 `<Suspense>` 兜底，Promise 必须稳定（别在渲染里新建）。
- **`useActionState(action, initialState)`**：把表单 action 变成 `[state, formAction, isPending]`，
  action 签名 `(prevState, formData) => nextState`，省掉手写 loading/error。
- **`useOptimistic(state, updateFn)`**：先展示乐观结果，action 完成后用真实数据替换，失败自动回滚。
- **`useFormStatus()`**（来自 `react-dom`）：在 `<form>` 的子组件里读取 `pending`，用于提交按钮的 loading 态。

## 可运行验证

`pnpm dev` 打开侧边栏的 **「React Hooks：19 个内置 hooks 与使用场景」**（`src/demos/hooks/`），六个分类页签：

1. **状态与上下文**：`useState` 计数（函数式更新）、`useReducer` 待办、`useContext` 主题切换（含 setter 拆分）。
2. **副作用与顺序**：挂载/卸载日志，验证 `useLayoutEffect` 在 `useEffect` 之前执行、卸载时执行清理。
3. **Ref 与命令式**：`useRef` 改值不触发渲染（需手动强制渲染才更新界面）、`useImperativeHandle` 暴露 `focus/clear`。
4. **性能与过渡**：`useMemo/useCallback` 引用稳定性对比、`useDeferredValue` 的即时值 vs 延迟值、`useTransition` 的 pending。
5. **其他内置 hooks**：`useId` 关联 label、`useSyncExternalStore` 让两个消费者同步更新外部 store。
6. **React 19 新 hooks**：`useActionState` 表单提交、`useOptimistic` 乐观待办、`use(Promise)` + `Suspense`。

手写练习与单测：

- `src/exercises/use-previous/`：保存上一次渲染的值（ref + effect）。
- `src/exercises/use-debounced-value/`：防抖值（delay、连续输入只保留最后一次、清理定时器）。
- `src/exercises/use-toggle/`：布尔切换（引用稳定）。

## 答题 SOP

通用方法见 [../answer-sop.md](../answer-sop.md)，本题按五段式落地如下。

### 30 秒版

> React 内置 hooks 我按职责分六类：状态（useState/useReducer）、上下文（useContext）、
> Ref（useRef/useImperativeHandle）、副作用（useEffect/useLayoutEffect/useInsertionEffect）、
> 性能（useMemo/useCallback/useTransition/useDeferredValue）、其他（useId/useSyncExternalStore/useDebugValue），
> React 19 又加了 use、useActionState、useOptimistic、useFormStatus。
> 日常最常用的是 useState、useEffect、useRef，选择标准是「要不要触发渲染、副作用在什么时机执行、要不要跨渲染保存值」。

### 标准版（60~120 秒）

1. **结论**：先给六个分类，再说「hooks 的本质是把函数组件的状态/副作用按调用顺序挂到 Fiber 上」。
2. **按分类展开场景**
   - 状态：useState 简单状态，useReducer 复杂状态迁移；注意函数式更新。
   - 上下文：跨层共享，value 引用要稳定，否则消费者全量重渲染。
   - Ref：跨渲染保存不参与渲染的值，DOM/定时器/上一次值；useImperativeHandle 暴露命令式 API。
   - 副作用：useEffect 绘制后、useLayoutEffect 绘制前（测量/滚动）、useInsertionEffect 给 CSS-in-JS。
   - 性能：useMemo 缓存计算、useCallback 稳定函数、useTransition 降级更新、useDeferredValue 降级值。
   - 其他：useId SSR 安全 id、useSyncExternalStore 订阅外部 store、useDebugValue 仅 DevTools。
3. **例子**：demo 里 ref 改值不重渲染、layout effect 日志先于 effect、父组件输入在 memo + useCallback 后不再触发行渲染。
4. **边界**：memo/useMemo 不是银弹，引用稳定只是让下游优化生效；useLayoutEffect 阻塞绘制不能滥用；
   hooks 不能条件调用（按调用顺序匹配状态）。
5. **收尾**：「React 19 的表单 hooks（useActionState/useOptimistic）可以继续聊。」

### 追问分支

- **「useEffect 和 useLayoutEffect 区别？」** → 时机：绘制后 vs 绘制前；代价：不阻塞 vs 阻塞；场景：请求/订阅 vs 测量/滚动。
- **「useRef 和 useState 怎么选？」** → 要不要触发渲染；ref 跨渲染保存同一对象，state 变化驱动 UI。
- **「useMemo 和 useCallback 区别？」** → 缓存值和缓存函数；本质都是依赖不变就复用同一引用。
- **「useTransition 和 useDeferredValue 区别？」** → 控制「更新」还是「值」；数据源在别人手里用 deferred。
- **「hooks 为什么不能写在条件/循环里？」** → 没有名字，靠调用顺序匹配 Fiber 上的 state 链表，顺序变了就错位。
- **「useEffect 依赖数组怎么确定？」** → 列出 effect 里用到的所有响应式值；用 lint 兜底，不要靠记忆。
- **「use 和 hooks 有什么区别？」** → `use` 可在条件中调用、读 Promise/Context；普通 hooks 必须在顶层按顺序调用。
- **「自定义 hook 会共享状态吗？」** → 不会。每个组件调用一次就是独立的 state；共享状态要靠 context/store。
- **「useSyncExternalStore 解决什么问题？」** → 订阅外部数据源并保证快照一致，避免并发渲染撕裂。

## 常见面试题

### Q: React Hooks 解决了什么问题？

**A:** 类组件的逻辑复用靠 HOC/render props，嵌套深、this 难懂、生命周期把相关逻辑拆散。
Hooks 让状态和副作用可以按「逻辑」而不是「生命周期」组织，自定义 hook 直接复用有状态逻辑；
本质是把状态挂在 Fiber 节点上，用调用顺序索引。

### Q: 为什么 Hooks 不能写在条件或循环里？

**A:** 函数组件没有 this，React 靠「调用顺序」把每次 `useState/useEffect` 对应到 Fiber 上的状态链表。
条件调用会让顺序错位，第二次渲染拿到的 state 就串了。规则：只在顶层调用，只在 React 函数里调用。

### Q: useEffect 依赖数组应该怎么写？漏写会怎样？

**A:** 把 effect 里读到的所有响应式值（props、state、组件内函数）都列进去；只读的模块常量不用。
漏写会读到旧的闭包值；写多了会重复执行。用 eslint-plugin-react-hooks 兜底，真的只想在挂载时执行就用空数组并确认没有响应式依赖。

### Q: useEffect 和 useLayoutEffect 什么时候用哪个？

**A:** 默认 `useEffect`：请求、订阅、日志、非阻塞的 DOM 同步。需要「绘制前测量/修改布局」时用 `useLayoutEffect`，
例如测量元素宽高、滚动定位、避免首帧闪烁；它同步执行会阻塞绘制，别滥用。SSR 下 `useLayoutEffect` 会警告，用 `useEffect` 或 `useIsomorphicLayoutEffect` 兜底。

### Q: useMemo/useCallback 是必须的吗？什么时候真的有用？

**A:** 不是必须。有用场景：① 计算确实昂贵；② 需要稳定引用传给 `memo` 子组件/effect 依赖（引用变化会让下游失效或重复执行）。
其余情况加了只是多一层依赖比较和内存开销。React 19 Compiler 之后大部分可交给编译器。

### Q: useRef 能存什么？和普通变量有什么区别？

**A:** 跨渲染保存同一个对象，改 `current` 不触发渲染。适合 DOM、定时器、订阅、上一次的值、可变实例。
函数体内的普通变量每次渲染都会重置；`useState` 会触发渲染。需要 UI 更新用 state，只需要记住用 ref。

### Q: useTransition 和 useDeferredValue 区别？

**A:** `useTransition` 标记「这次更新」为低优先级，给到你手写的 setState；`useDeferredValue` 给「一个值」生成低优先级副本，
适合派生渲染很重但数据源不受控的场景。两者都让紧急更新（输入）先完成，降低 INP。

### Q: useSyncExternalStore 的用途？

**A:** 订阅 React 外部数据源（浏览器 API、状态库、WebSocket），保证 `getSnapshot` 在并发渲染下一致，避免撕裂。
它要求 `subscribe` 稳定、`getSnapshot` 返回不可变快照，否则会无限循环。

### Q: React 19 的表单 hooks 解决了什么？

**A:** `useActionState` 把 action 的返回值/pending 纳入状态；`useOptimistic` 先给乐观结果、失败回滚；
`useFormStatus` 让表单子组件读到提交状态。配合 Server Actions 可以做渐进增强，减少手写 loading/error 样板。

### Q: 自定义 hook 的规范？

**A:** 以 `use` 开头（lint 依赖这个前缀检查规则）；内部可以调用其它 hooks；返回 `[value, actions]` 或对象；
不要隐藏副作用依赖、不要在内部做条件调用；一个 hook 只做一件事；能写成纯函数的部分就抽成纯函数，方便测试。

## 易错点 / 追问

- **在条件/循环/嵌套函数里调用 hooks**：顺序错位，直接报错或状态串位。
- **忘了清理副作用**：定时器、订阅、事件监听在卸载后继续执行，造成内存泄漏或重复请求。
- **依赖数组里放每次新建的对象/函数**：effect 每次都跑；用稳定引用或拆成基础值。
- **用 useEffect 同步派生 state**：多一次渲染，还可能循环；直接算或用 `useMemo`。
- **useState 更新后立即读 state**：拿到的还是旧值，需要就用传入的值或 `useEffect`。
- **把 ref 当 state 用**：改了不渲染，界面不更新。
- **context value 内联对象**：所有消费者每次都重渲染。
- **把 useId 当列表 key**：它只保证唯一且稳定，不表达业务身份。
- **`useMemo` 当成语义保证**：React 可以丢弃缓存，不能依赖它做正确性逻辑。
- **StrictMode 双执行当成 bug**：开发期用来暴露副作用不纯，生产不会双执行。
- **useOptimistic 忘了处理失败**：务必在 action 出错时让真实状态回滚（React 会自动丢弃乐观值）。

## 相关

- 通用答题方法：[../answer-sop.md](../answer-sop.md)
- 可运行 demo：`src/demos/hooks/`
- 手写练习：`src/exercises/use-previous/`、`src/exercises/use-debounced-value/`、`src/exercises/use-toggle/`
- 性能相关：`docs/knowledge/performance.md`、`src/exercises/shallow-equal/`
- 虚拟 DOM 与 key：`docs/knowledge/virtual-dom.md`
