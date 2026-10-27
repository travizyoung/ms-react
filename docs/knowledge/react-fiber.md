# React 的核心与 Fiber

> 一句话结论：React 的核心是「用状态描述 UI」——声明式 + 组件化 + 单向数据流，落地机制是**协调（reconciliation）**：
> 生成新的元素树、与旧树对比、提交最小 DOM 变更。**Fiber 是 React 16 起协调器的实现**，
> 把渲染工作拆成可中断、可恢复、带优先级的单元；它不是虚拟 DOM 的同义词，也不是多线程。

## 一、React 的核心是什么

拆成四层来看：

### 1. 声明式：UI = f(state)

你描述「界面在某个状态下应该是什么样」，而不是手动 `appendChild/removeChild`。
状态变化后框架负责重新计算 UI 并更新 DOM。这让「状态 → 视图」的关系可推导、可测试。

### 2. 组件化与组合

组件是 UI 与逻辑的最小复用单位；通过 `props` / `children` 组合，而不是继承。
Hooks 让「有状态的逻辑」也能复用（自定义 hook）。

### 3. 单向数据流

数据通过 props 自上而下流动，子组件通过回调向上通知；状态集中在拥有它的组件里，
「谁改状态、谁受影响」是明确的。配合不可变更新，让变化可追踪。

### 4. 协调：把「描述」变成「最小 DOM 操作」

React 每次渲染生成新的元素树（React Element → Fiber），与上一次的树对比（diff + key），
算出新增/删除/移动/属性更新，再提交到 DOM。没有协调，声明式就无从落地。

> 现代 React 还要加一条：**调度**。什么时候渲染、渲染多久、能不能被打断，由 scheduler 决定。
> 这正是 Fiber 带来的能力，也是并发特性（Transition/Suspense）的基础。

## 二、为什么需要 Fiber

React 15 的协调器（stack reconciler）是**递归 + 同步**的：一次更新从头调到尾，中间不能停。
组件树大时，这一次递归可能占用主线程几十上百毫秒，期间浏览器无法响应输入、无法绘制 → 掉帧、输入卡顿。

React 16 把协调器重写成 Fiber：

- 把「一次大递归」拆成「很多个小工作单元」（每个组件一个 fiber 节点）；
- 每处理完一个单元检查时间片，用完就**让出主线程**；
- 保存「下一个要处理的单元」，恢复时继续；
- 高优先级更新可以**打断并丢弃**正在进行的低优先级渲染；
- 为 Suspense、错误边界、并发渲染提供结构基础。

## 三、Fiber 是什么

### 1. 一种数据结构

每个 fiber 节点对应一个组件（或 DOM 节点），关键字段：

| 字段 | 含义 |
| --- | --- |
| `tag` / `type` / `key` | 节点类型、对应的组件或 DOM 标签、diff 用的 key |
| `stateNode` | 对应的真实 DOM 节点或类组件实例 |
| `return` / `child` / `sibling` | 父节点 / 第一个子节点 / 下一个兄弟节点（遍历三指针） |
| `alternate` | 另一棵树（current ↔ workInProgress）上的对应节点 |
| `memoizedProps` / `memoizedState` | 上一次渲染的 props / hooks 链表 |
| `updateQueue` | 待处理的更新队列（setState 产生的 lane 更新） |
| `flags`（旧称 effectTag） | 本节点要做的副作用：插入、更新、删除、ref 等 |
| `lanes` | 优先级（React 18+ 的 lane 位运算模型） |

`return/child/sibling` 把树变成链表结构，深度优先遍历不需要递归栈，随时可以停在某个节点。

### 2. 双缓存：current 树与 workInProgress 树

- `current`：当前屏幕上生效的 Fiber 树。
- `workInProgress`：正在构建的新树，两个树通过 `alternate` 互相指向。
- 新树构建完成后，在 commit 阶段把 `root.current` 切到新树。

好处：构建过程中界面保持可用（旧的 current 树仍然在屏幕上）；渲染中途被打断可以直接丢弃新树。

### 3. 工作循环（work loop）

```js
function workLoopConcurrent() {
  while (workInProgress !== null && !shouldYield()) {
    performUnitOfWork(workInProgress)
  }
}

function performUnitOfWork(fiber) {
  const next = beginWork(fiber) // 处理当前节点，返回第一个子节点
  if (next) return next
  // 没有子节点：completeWork 自己，然后找 sibling / 沿 return 回溯
  completeWork(fiber)
}
```

- `beginWork`：根据 props/state 计算子节点，做 diff，创建子 fiber。
- `completeWork`：创建/更新 DOM（在内存里）、收集 flags，向上回溯。
- 时间片用完（`shouldYield()` 为 true）就退出循环，保存 `workInProgress`，等下一次调度继续。

### 4. 两个阶段：render 与 commit

| 阶段 | 做什么 | 能否中断 |
| --- | --- | --- |
| Render（beginWork / completeWork） | 构建新 Fiber 树、diff、收集副作用 | ✅ 可打断、可丢弃、可重做 |
| Commit（beforeMutation / mutation / layout） | 执行 DOM 变更、ref 赋值、`useLayoutEffect`、生命周期 | ❌ 同步执行，不可中断 |

因为 render 阶段可能被执行多次/被丢弃，**render 阶段必须是纯的**：不能有副作用、不能读写 DOM。

### 5. 优先级与调度

- **lane 模型**：用位运算表示多个优先级（同步、用户输入、默认、过渡、空闲等），一个 root 可以同时挂多个 lane。
- **Scheduler**：用宏任务（`MessageChannel`）把工作切成约 5ms 的时间片；`shouldYield()` 判断是否让出主线程。
- **饥饿问题**：低优先级任务长期被高优先级插队，需要过期/提升机制兜底。
- 对外的入口：`startTransition`、`useDeferredValue`、`Suspense`、`useTransition` 的 pending 状态，都建立在「可中断渲染」之上。

### 6. Hooks 为什么依赖 Fiber

Hooks 的状态挂在 `fiber.memoizedState` 上，是一条按调用顺序排列的链表。
每次渲染按**调用顺序**依次对应——所以 hooks 不能写在条件/循环里（顺序错位 → 状态串位）。

### 7. Fiber ≠ 虚拟 DOM ≠ 多线程

- **虚拟 DOM** 是「用对象描述 UI」的思路；Fiber 是协调器的实现（对象结构 + 工作循环 + 调度）。
- Fiber 依然是**单线程**，只是把同步长任务改造成可中断的小任务，不会并行执行你的组件代码。
- Fiber 是并发渲染的**基础**；并发渲染、时间切片、Suspense 是它之上暴露出来的能力。

## 四、可运行验证

`pnpm dev` 打开侧边栏的 **「React 核心与 Fiber：可中断的协调」**（`src/demos/react-fiber/`）：

1. **工作循环**：用练习里的 `createWorkLoop` 遍历一棵 12 个节点的树，每个时间片最多处理 5 个节点，
   日志展示每个时间片访问了哪些节点、下次如何从 `nextUnitOfWork` 继续。可以单步或连续运行。
2. **时间切片**：每次输入都重算 2000 行数据。对比「同步渲染（flushSync）」与「可中断渲染（startTransition）」：
   前者输入处理会阻塞主线程，后者先响应输入、重活分片执行并显示 pending。

手写实现与单测：

- `src/exercises/fiber-work-loop/`：`createFiberTree`（child/sibling/return 三指针）+ `createWorkLoop`
  （按 `shouldYield` 中断与恢复）。8 个用例覆盖 DFS 顺序、任意切片、恢复后不重复、完成后再调用等。

## 答题 SOP

通用方法见 [../answer-sop.md](../answer-sop.md)，本题按五段式落地如下。

### 30 秒版

> React 的核心是「用状态声明 UI」：声明式 + 组件化 + 单向数据流，落地靠协调算法把新元素树和旧树对比出最小更新。
> Fiber 是 React 16 重写的协调器：把每个组件变成一个 fiber 节点，用 child/sibling/return 组成可中断的遍历，
> 配合双缓存和优先级调度，让渲染可以暂停、恢复、丢弃，从而保证输入响应，也是并发特性的基础。

### 标准版（60~120 秒）

1. **结论**：核心 = 声明式 + 组件化 + 单向数据流 + 协调；Fiber = 可中断的协调器实现。
2. **核心展开**：UI = f(state)；组件组合；props down / events up；协调（diff + key）把描述变成最小 DOM 操作；
   调度决定什么时候渲染、渲染多久。
3. **Fiber 四要点**
   - 数据结构：fiber 节点带 return/child/sibling、alternate、memoizedState、flags、lanes。
   - 双缓存：current 与 workInProgress 通过 alternate 对应，commit 时切换 root.current。
   - 工作循环：performUnitOfWork（beginWork/completeWork），时间片到期即让出，保存 nextUnitOfWork。
   - 两阶段：render 可中断可丢弃（必须纯），commit 同步不可中断。
4. **例子**：demo 里 12 个节点每片处理 5 个、可暂停恢复；同步渲染阻塞输入 vs startTransition 先响应输入。
5. **边界**：Fiber 仍单线程、commit 不可中断；Fiber ≠ 虚拟 DOM；时间切片不等于性能一定更好，收益取决于任务是否可拆。
6. **收尾**：「再往下可以聊 lane 优先级模型、Suspense 怎么利用可中断渲染。」

### 追问分支

- **「为什么放弃栈调和？」** → 递归同步不可中断，长任务阻塞主线程，无法做优先级和并发。
- **「双缓存解决什么？」** → 构建新树时旧树继续显示；中断可丢弃新树，不污染当前 UI。
- **「render 和 commit 区别？」** → render 计算变更、可中断、必须无副作用；commit 应用变更、同步不可中断。
- **「优先级怎么实现？」** → lane 位运算 + Scheduler 时间片 + 过期/饥饿兜底；高优先级可打断低优先级渲染。
- **「Hooks 为什么不能条件调用？」** → 状态是按调用顺序挂在 fiber 上的链表。
- **「Fiber 和虚拟 DOM 什么关系？」** → 思路 vs 实现；Fiber 节点承载 diff 和调度信息，虚拟 DOM 只是「对象描述 UI」。
- **「Fiber 是多线程吗？」** → 不是，单线程 + 可中断；Worker 才是并行，但那是另一套机制。
- **「Suspense 怎么工作的？」** → 组件抛 Promise，React 捕获后渲染 fallback，数据就绪后重新调度渲染。
- **「React 19 之后 Fiber 还有意义吗？」** → 有，Compiler 优化重复渲染，但协调、调度、可中断 commit 前的构建仍由 Fiber 承担。

## 常见面试题

### Q: React 的核心是什么？

**A:** 三件事：① 声明式 UI（UI = f(state)，你描述结果，框架负责更新）；② 组件化 + 单向数据流（props 向下、回调向上）；
③ 协调（reconciliation）把新元素树和旧树对比出最小 DOM 变更。加上调度器后，React 还能决定渲染的时机与可中断性。

### Q: 什么是 Fiber？为什么要有它？

**A:** Fiber 是 React 16 重写的协调器实现：数据结构上是带 return/child/sibling 的节点树，机制上是一个可中断的工作循环。
旧栈调和是递归同步的，长任务会阻塞主线程；Fiber 把渲染拆成小单元，用时间片和优先级调度，可以暂停、恢复、丢弃，
从而保证输入响应，并为并发特性提供基础。

### Q: Fiber 的双缓存是什么？

**A:** 内存里同时存在 current 树（屏幕上生效的）和 workInProgress 树（正在构建的），节点通过 alternate 互相对应。
commit 完成后把 root.current 指向新树。这样构建期间用户仍看到旧 UI，渲染中断也能直接丢弃新树。

### Q: render 阶段和 commit 阶段分别做什么？为什么 render 必须纯？

**A:** render 阶段（beginWork/completeWork）构建 Fiber 树、diff、收集 flags，可能被中断、丢弃、重做，
所以不能有副作用；commit 阶段（beforeMutation/mutation/layout）同步执行 DOM 更新、ref、useLayoutEffect 和生命周期，不可中断。

### Q: React 的优先级是怎么实现的？

**A:** React 18+ 用 lane 位运算表示优先级，root 上记录待处理的 lanes；调度时先做高优先级，
低优先级任务可能被高优先级打断、也可能因长期得不到执行而需要过期/提升。Scheduler 用 MessageChannel 把工作切成约 5ms 的时间片。

### Q: Hooks 和 Fiber 有什么关系？

**A:** 每个函数组件对应一个 fiber 节点，hooks 的 state 存在 `fiber.memoizedState` 的链表里，按调用顺序匹配。
这就是 hooks 规则（只能在顶层调用）的底层原因。

### Q: Fiber 让 React 变快了吗？

**A:** 不是简单「更快」。Fiber 增加了节点和调度开销，收益在于**可中断与优先级**：长渲染不再一次性霸占主线程，
输入能先被处理，过渡更新可以被打断；实际性能仍取决于任务是否可拆分、组件是否渲染过多。

### Q: Fiber 和并发渲染、Suspense 的关系？

**A:** Fiber 提供了可中断的协调能力，并发渲染（Transition、时间切片）和 Suspense 都建立在它之上：
Suspense 通过组件抛 Promise 让 React 暂停子树、渲染 fallback，数据就绪后再重新调度。

## 易错点 / 追问

- **把 Fiber 等同于虚拟 DOM**：Fiber 是协调器的实现，虚拟 DOM 是「对象描述 UI」的思路。
- **以为 Fiber 是多线程/并行渲染**：仍是单线程，只是任务可中断。
- **以为 render 阶段可以写 DOM/发请求**：render 可能执行多次或被丢弃，副作用必须放 effect/commit。
- **以为 commit 能中断**：commit 同步执行，必须一次做完，否则用户会看到半更新状态。
- **认为 useLayoutEffect 在 render 阶段执行**：它在 commit 的 layout 阶段、绘制前同步执行。
- **忽略调度开销**：小任务上并发特性未必更快，可能多一次渲染或更长的总耗时。
- **只背字段名不理解作用**：答题时能说出 return/child/sibling、alternate、memoizedState、flags、lanes 各自解决什么问题才算真的懂。
- **混淆「协调」和「渲染」**：协调 = 算差异；渲染/commit = 写 DOM。

## 相关

- 通用答题方法：[../answer-sop.md](../answer-sop.md)
- 可运行 demo：`src/demos/react-fiber/`
- 手写练习：`src/exercises/fiber-work-loop/`
- 虚拟 DOM 与 diff：`docs/knowledge/virtual-dom.md`
- Hooks 与 Fiber 的关系：`docs/knowledge/hooks.md`
- React 性能：`docs/knowledge/performance.md`
