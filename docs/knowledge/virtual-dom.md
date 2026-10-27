# 虚拟 DOM（Virtual DOM）

> 一句话结论：虚拟 DOM 是用 JS 对象描述 UI 的中间层；状态变化时先算出新的对象树，与旧树做 diff（reconcile），
> 再把最小差异批量提交到真实 DOM。它的价值是「让 UI 声明式、可跨平台、可批处理」，而不是「比原生 DOM 快」。

## 核心原理

### 1. VNode 只是普通对象

```js
h('ul', { className: 'list' }, h('li', { key: 'a' }, 'A'))
// => { type: 'ul', props: { className: 'list' }, children: [ { type: 'li', props: { key: 'a' }, children: ['A'] } ] }
```

因为它不持有真实 DOM 引用，所以可以：存起来做对比、序列化、在别的平台（Native / Canvas / 终端）用另一套
「渲染器」消费同一棵树。

### 2. 一次更新分三步

1. **render**：状态变化 → 生成新的 VNode 树（React 里是 Fiber 树）。
2. **diff / reconcile**：同层比较新旧树，算出「新增 / 删除 / 移动 / 更新属性」。
3. **commit**：一次性把差异写进真实 DOM（React 在 commit 阶段才改 DOM，浏览器只做一次布局/绘制）。

### 3. diff 的取舍：同层比较 + key

完整的两棵树做最小编辑距离是 O(n³)，没法用在 60fps 的场景。React/Vue 的做法是降级成近似算法：

- **只比较同一层**，不跨层移动节点；类型不同直接销毁重建整棵子树。
- **同层用 key 找对应节点**：key 相同 → 复用 DOM 实例、只更新属性/子节点；key 不同 → 卸载旧的、挂载新的。
- 列表重排时，有 key 才能把「移动节点」和「重建节点」区分开，从而用 `insertBefore` 移动而不是重建。

### 4. 为什么说它不一定更快

diff 本身有成本，而且多了一层对象树的内存与 GC。虚拟 DOM 的收益在于：

- 声明式：你描述「UI 应该是什么样」，不用手写增删改。
- 批处理：多次 setState 合并成一次 DOM 提交。
- 可预期：更新路径统一，跨平台渲染器可以复用同一套 diff。
- 对「大范围、频繁、结构复杂」的更新，把开发者从手工 DOM 操作里解放出来；对「单个文本」这种更新，
  直接 `textContent = x` 反而更快。

## 可运行验证

`pnpm dev` 打开侧边栏的 **「虚拟 DOM：diff、key 与节点复用」**（`src/demos/virtual-dom/`）：

1. **实验一**：左侧显示 `h()` 生成的纯对象树，右侧是 `patch()` 渲染出的真实 DOM。点「反转列表顺序」，
   日志显示 `li` 复用数 = 全部，说明 key 命中的节点只是被 `insertBefore` 移动；点「改标题文字」
   只有文本节点变化，`ul/li` 实例保持不变。
2. **实验二**：给每行输入框打点字，然后「把第一行移到最后」，对比 `key=id` 与 `key=index`：
   - `key=id`：节点跟着数据走，输入内容跟着行走。
   - `key=index`：节点按位置复用，输入内容留在位置上，和行数据错位。

手写实现与单测：`src/exercises/vdom/`（`h` / `render` / `patch`，16 个用例覆盖属性更新、事件替换、
key 重排、节点复用与卸载）。

## 常见面试题

### Q: 虚拟 DOM 是什么？它比直接操作真实 DOM 快吗？

**A:** 虚拟 DOM 是用 JS 对象描述的 UI 树。更新时先生成新树，与旧树 diff，再把最小差异提交到真实 DOM。
它不一定更快：diff 和对象树本身有开销。它真正的价值是声明式编程、批量更新、跨平台渲染，
以及把「怎么改 DOM」从业务代码里拿掉。React 官方也强调过「virtual DOM 不是性能银弹」。

### Q: 为什么列表要用 key？用 index 做 key 有什么问题？

**A:** key 是同一层内节点的稳定身份。diff 靠 key 判断「这个位置的新节点能不能复用旧的 DOM/组件实例」。
用 index 当 key 时，插入/删除/排序会让同一个位置对应不同数据，React 只能按位置复用，
导致组件内部状态（输入框内容、动画、未受控组件、`useEffect` 依赖的实例）跟着位置走而不是跟着数据走，
出现状态错位；同时本可以移动的节点会变成逐个更新甚至重建。只有列表纯静态、永不重排时才可用 index。

### Q: key 为什么不能通过 props 传给子组件？

**A:** `key` 是 React 用来做 diff 的保留字段，不会进 `props`。需要把 id 传给子组件，就再传一个普通 prop
（如 `id={item.id}`）。手写实现里也一样：props 里的 `key` 只参与匹配，不写成 DOM 属性。

### Q: React 的 diff 复杂度是多少？为什么不能做到最优？

**A:** React 的协调（reconcile）对同层节点是 O(n)（靠 key 建 map）；跨层移动会被当作「销毁 + 重建」。
理论上的最优树对比是 O(n³)，成本远超渲染收益，所以主流框架都选择「同层 + 类型 + key」的启发式策略。

### Q: 虚拟 DOM 和 Fiber 是一回事吗？

**A:** 不是。虚拟 DOM 是「用对象描述 UI、靠 diff 更新」这套思路；Fiber 是 React 16 起的**协调器实现**：
把渲染工作拆成可中断的单元（fiber 节点带 `return/child/sibling` 指针），支持时间切片、优先级、并发渲染。
Fiber 节点本身也是一种「虚拟 DOM 的承载结构」，但 Fiber ≠ 虚拟 DOM。

## 易错点 / 追问

- **别把 key 当普通 prop**：`props.key` 永远是 `undefined`；用 `<Item key={id} id={id} />`。
- **不要用随机数当 key**：`key={Math.random()}` 每次渲染都不同，等于强制全量重建，比用 index 更糟。
- **key 只要求「同一层内唯一且稳定」**，不需要全局唯一。
- **React 的 state 更新是异步批处理的**：一次事件里多次 `setState` 会合并成一次渲染，
  这也是「虚拟 DOM + diff」能省下大量 DOM 操作的前提之一。
- **不要为了「性能」手动操作 DOM 绕过 React**：React 不知道你改了什么，下次 diff 会用旧 VNode 覆盖你的修改。
- **列表 key 变了但内容没变**，节点依然会被卸载重建 —— key 的稳定性就是身份，身份变了就是新东西。

## 相关

- 手写实现：`src/exercises/vdom/index.ts`（`h` / `render` / `patch`）、`index.test.ts`
- 可运行 demo：`src/demos/virtual-dom/`
