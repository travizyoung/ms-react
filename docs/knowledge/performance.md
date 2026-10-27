# 性能优化（H5 + React + 小程序）

> 一句话结论：先定指标再动手，按「加载 → 渲染 → 运行时」分层；H5 盯 LCP / INP / CLS，小程序额外盯启动、首屏和 setData。
> 优先做收益最大、且能用数据证明的那一项，不要凭感觉优化。

## 一、先度量：没有指标就没有优化

| 场景 | 核心指标 | 工具 |
| --- | --- | --- |
| H5 加载 | LCP ≤ 2.5s、TTFB、FCP、资源体积/请求数 | Lighthouse、Performance 面板、RUM（web-vitals） |
| H5 交互 | INP ≤ 200ms、长任务（>50ms） | Performance 面板、`PerformanceObserver`、React Profiler |
| H5 稳定 | CLS ≤ 0.1 | Layout Shift 事件、Lighthouse |
| 小程序启动 | 启动耗时、首屏渲染耗时、包体积 | 微信开发者工具「体验评分」/ Trace、真机调试 |
| 小程序运行 | setData 次数与耗时、页面渲染耗时、内存 | Trace 面板、`wx.getPerformance`、内存告警 |

流程：**采集基线 → 找瓶颈（瀑布图 / 火焰图 / 长任务）→ 只改瓶颈 → 同口径复测**。
没有前后对比数据的「优化」，面试时等于没做。

## 二、H5 加载性能（网络 → 首屏）

1. **减小体积**
   - 路由级代码分割（`React.lazy` + `Suspense`）、按需引入组件库、tree shaking。
   - 压缩：gzip / brotli、图片 WebP / AVIF、去掉 polyfill 和重复依赖。
2. **缩短关键路径**
   - 首屏关键 CSS 内联，非关键 CSS 异步加载；脚本 `defer` / 动态 `import()`。
   - 字体 `preload` + `font-display: swap`，避免字体阻塞首屏文字。
   - `preconnect` / `dns-prefetch` 提前建连；`prefetch` 预取下一步资源。
3. **缓存与分发**
   - 静态资源「内容哈希 + 强缓存」，HTML 短缓存或不缓存。
   - CDN、HTTP/2、必要时 Service Worker 做离线缓存。
4. **图片与媒体**
   - 按容器尺寸出图（`srcset` / `sizes`）、CDN 裁剪；非首屏图片懒加载。
   - 图片必须写死宽高或用 `aspect-ratio`，否则加载完成会顶动布局，CLS 爆炸。
5. **渲染模式**
   - SSR / SSG / 流式 SSR 改善首屏与 SEO；注意 hydration 成本与水合不一致（服务器与客户端首帧必须一致）。

## 三、H5 渲染与运行时

1. **减少重排（layout）**
   - 读写分离：先批量读（`offsetWidth`），再批量写；避免在循环里 layout thrashing。
   - 动画用 `transform` / `opacity`（走合成层），不要动 `top/left/width/height`。
   - `will-change` 只在动画期间加，用完移除，滥用会吃显存。
2. **拆长任务**
   - 超过 50ms 的任务会阻塞输入，直接拉高 INP；用时间分片、`requestIdleCallback`、Web Worker 拆走纯计算。
   - React 并发特性：`useTransition` / `useDeferredValue` 把非紧急更新降级。
3. **长列表**
   - 虚拟滚动：DOM 数量从 O(总行数) 降到 O(视口行数)；配合分页 / 无限滚动。
   - `content-visibility: auto` 让屏幕外内容跳过渲染（注意高度占位）。
4. **React 渲染**
   - 见下面「四、React 性能优化」单独展开：re-render 边界、memo 浅比较、并发特性、Context、Compiler。
5. **事件与内存**
   - 高频事件（滚动 / 输入 / resize）防抖节流，监听器加 `{ passive: true }`。
   - 组件卸载清理定时器、监听器、订阅；缓存设上限，避免闭包长期持有大对象。

## 四、React 性能优化（H5 项目的主战场）

### 1. 先搞清 re-render 的成本边界

- 触发条件：自身 `state` / 父组件重新渲染 / `props` 变化 / 订阅的 `context` 变化。
- `render` = 执行组件函数、生成新的 VNode；**不等于 DOM 更新**（diff 后只提交变化）。
- 所以目标不是「消灭 render」，而是减少**昂贵的 render**：大子树、重计算、每次渲染新建大对象。
- 开发模式 StrictMode 会双渲染，它不是生产性能问题，别拿它的计数当结论。

### 2. 减少不必要的渲染

- **状态下移 / 拆组件**：把高频变化的 state 放到最小子树，别放在会牵动整页的父组件里。
- **children 透传**：父组件重渲染时，`children` 引用没变，子树可以直接跳过（bailout）。
- **`memo` + 稳定 props**：`memo` 默认做浅比较（key 数量 + `Object.is`）。
  内联对象、内联函数、每次新建的数组都会让浅比较失败——这正是「memo 没生效」的最常见原因。
- **`useCallback` / `useMemo` 只为稳定引用**：它们本身也有成本，不与 `memo` / 依赖数组配合时基本是纯开销。
- **Context 拆分**：按更新频率拆多个 Provider；高频 context 单独放；消费组件用 `memo`，
  或用 `useSyncExternalStore` + selector 订阅所需字段。
- **列表 key 稳定**：key 变了就是新节点，`memo` 也救不回来（见虚拟 DOM 那篇）。
- **不要在 render 里**：`setState`、发请求、创建大对象、做重计算。

### 3. 让重计算与更新可中断（直接影响 INP）

- `useMemo` 缓存昂贵纯计算，依赖写准；依赖里放每次新建的对象等于没缓存。
- `useDeferredValue` / `useTransition`：把搜索过滤、图表重算这类非紧急更新降级，保证输入先响应。
- 超大数组的过滤/排序放到 Web Worker，或先做 debounce。
- 分页/虚拟列表替代「一次渲染全部数据」。

### 4. 代码分割与资源

- `React.lazy` + `Suspense` 按路由/重组件拆包；`Suspense` 的 fallback 就是现成的加载态。
- 非关键模块（弹窗、图表、编辑器）延后加载；hover / 点击时 `import()` 预取。
- 配合图片懒加载、骨架屏，避免「等 JS 再等图片」的串行瀑布。

### 5. 长列表

- 虚拟化：只渲染视口行（`react-window` / `react-virtuoso`，或本项目的 `src/exercises/virtual-list/`）。
- 行组件 `memo` + 稳定 props；行数据用 id 查找而不是整表 props 下传。
- key 稳定，`overscan` 缓冲防白屏。

### 6. 数据获取

- 避免请求瀑布：能并行的请求并行，父级预取。
- 不要在 render 里发请求；`useEffect` 依赖写错会导致重复请求。
- Suspense + 数据缓存（React Query / SWR 思路）：去重、缓存、后台刷新。

### 7. React 19 Compiler

- Compiler 自动 memo 化组件与表达式，能减少手写 `useMemo/useCallback`。
- 它优化的是「重复渲染」，不解决结构问题：状态下移、长列表、包体积、请求瀑布仍要自己处理。
- 别把 Compiler 当银弹，仍然用 Profiler 验证真实收益。

### 8. 度量 React 性能

- **React DevTools Profiler**：Flame chart / Ranked 看谁在渲染、为什么渲染、每次 commit 耗时。
- `<Profiler onRender>`：在关键子树采集 commit 耗时，做回归监控。
- **Performance 面板**：看长任务与输入延迟（INP）。
- 只在生产构建 + 真实设备上得出结论；开发构建的耗时没有参考价值。

## 五、小程序性能

### 1. 先理解架构：双线程 + 通信成本

小程序的逻辑层（AppService，跑 JS）和渲染层（WebView）是**两个独立线程**，不共享内存。
每次 `setData` 都要：逻辑层序列化 → 跨线程传输 → 渲染层 diff → 更新视图。所以：

- **通信次数**和**单次数据量**都是成本，且是主要成本。
- `setData` 不是「设置变量」，而是「向渲染层发消息」。

### 2. setData 优化（最高频考点）

- **减少次数**：同一 tick 的多次更新合并成一次（本项目的 `src/exercises/set-data-scheduler/` 就是这个）。
- **减少体积**：只传变化字段的路径，如 `setData({ 'list[3].price': 9 })`，不要整个 `list` 重传。
- **控制频率**：滚动、输入回调里不要直接 setData，先节流/防抖。
- **精简 data**：`data` 里只放渲染要用的字段，原始数据、缓存、方法结果不要塞进去。
- **避免在循环里 setData**：100 次循环 = 100 次通信。

### 3. 启动与包体

- 主包 ≤ 2MB、总包 ≤ 20MB，超了直接无法上传。
- **分包**（`subpackages`）：按业务/页面拆，首屏只加载主包。
- **独立分包**：不依赖主包，可独立启动（适合广告页、活动页），但拿不到主包的公共资源。
- **分包预下载**（`preloadRule`）：进入某页面时提前下载后续分包。
- **按需注入**（`lazyCodeLoading: "requiredComponents"`）：只注入当前页面用到的组件。
- 图片走 CDN + 合适尺寸；删无用代码、字体、大图。

### 4. 首屏与长列表

- 骨架屏 + 首屏数据并发请求（`Promise.all`）、缓存上次数据先渲染。
- 长列表用虚拟列表 / `recycle-view`，分页加载，禁止把整个长列表一次 setData。
- 频繁交互（手势、滚动）交给 WXS 或 Skyline 的 worklet，减少跨线程通信。

### 5. 排查

- 开发者工具 Trace / 体验评分看启动、setData、渲染耗时。
- 关注内存告警：定时器、`wx.onXxx` 监听、页面栈未释放。

## 可运行验证

`pnpm dev` 打开侧边栏的 **「性能优化：长列表与 setData」**（`src/demos/performance/`）：

1. **H5 长列表**：1 万行数据，切换「全量渲染 / 虚拟滚动」，直接对比 DOM 行数（10000 → 十几行）与同步提交耗时；虚拟滚动模式下滚动列表，DOM 行数不变。
2. **小程序 setData**：模拟 100 件商品价格 +1，对比三种策略的**通信次数 / payload 字符数 / 传输字段数 / 总耗时**：
   - 逐条 setData：100 次通信；
   - 合并 + 路径更新：1 次通信、只传 100 个字段；
   - 一次全量 list：1 次通信，但传 300 个字段、payload 最大。
3. **React 渲染**：50 个行组件，切换「不用 memo / memo（回调每次新建）/ memo + 稳定回调」，
   在输入框打字看每个行的渲染次数：不用 memo 全部重渲染 → memo 被不稳定回调击穿 → 
   回调稳定后输入不再触发行渲染（选中某行时只有相关行更新）。

手写实现与单测：

- `src/exercises/virtual-list/`：可视范围计算（overscan、边界夹紧、空数据、非法行高）。
- `src/exercises/set-data-scheduler/`：setData 合并调度器（同 tick 合并、delay、手动 flush、cancel、快照发送）。
- `src/exercises/shallow-equal/`：`React.memo` 使用的浅比较（`Object.is`、key 数量、嵌套引用、数组/对象边界）。

## 答题 SOP

通用方法见 [../answer-sop.md](../answer-sop.md)，本题按五段式落地如下。

### 30 秒版

> 性能优化我会先定指标再动手：H5 看 LCP、INP、CLS，小程序额外看启动、首屏和 setData。
> 然后按加载（体积、关键路径、缓存）、渲染（重排重绘、长列表、React re-render）、运行时（长任务、内存）分层，
> 挑收益最大的一项做，并用同一口径的数据证明前后差异。React 层重点看两点：是不是该渲染的组件渲染了、
> 昂贵计算有没有被缓存或降级；小程序的特殊点在于双线程，setData 的次数和数据量都是成本，要合并 + 路径更新。

### 标准版（60~120 秒）

1. **结论**：先度量后优化，按「加载 / 渲染 / 运行时」分层；H5 与小程序共用大部分思路，小程序多一层跨线程通信成本。
2. **H5 分层**
   - 加载：代码分割、压缩、关键 CSS、字体、图片格式与懒加载、CDN 与缓存、SSR。
   - 渲染：减少重排、`transform` 动画、虚拟列表、减少 re-render、长任务分片。
   - React：状态下移、`memo` + 稳定 props、`useMemo` 缓存重计算、`useTransition/useDeferredValue` 降级、
     Context 拆分、Profiler 定位热组件。
   - 运行时：防抖节流、事件监听 `passive`、内存清理。
3. **小程序分层**
   - 架构：双线程，setData = 序列化 + 跨线程通信 + 渲染层 diff。
   - setData：合并同 tick 更新、路径更新、只传渲染字段、控制频率。
   - 包体与启动：分包、独立分包、预下载、按需注入、图片 CDN。
   - 长列表：虚拟列表 / recycle-view、分页。
4. **例子**：1 万行列表全量渲染有 1 万个 DOM，虚拟滚动后只剩十几行；React 里 50 个行组件在
   memo + 稳定回调后，父组件输入不再触发任何行渲染；小程序里 100 件商品逐条 setData 是 100 次通信，
   合并 + 路径更新后是 1 次、payload 更小（demo 里有实测数据）。
5. **边界**：虚拟列表适合等高行，动态高度要测量；分包拆太碎会增加请求；不要过早优化，先证明瓶颈。
6. **收尾**：「再往下可以聊 INP 的长任务拆分，或者小程序 Skyline 的渲染优化。」

### 追问分支

- **「首屏怎么优化？」** → 分四块：体积（分割/压缩）、关键路径（CSS/字体/脚本）、网络（缓存/CDN/预连接）、渲染模式（SSR/骨架屏）；用 LCP 验证。
- **「LCP 怎么降？」** → 找 LCP 元素（通常是大图/首屏标题）→ 提前加载（preload、CDN、合适格式）→ 减少阻塞资源。
- **「INP 怎么降？」** → 拆长任务、减少不必要的 re-render、事件处理里别做重计算、用 `useTransition` 降级非紧急更新。
- **「CLS 怎么降？」** → 图片/广告位预留尺寸、字体 `swap` + 尺寸匹配、避免首屏插入内容。
- **「虚拟列表原理？边界？」** → 只渲染视口 + overscan；边界是动态行高、锚点定位、滚动白屏、内容可搜索性。
- **「setData 为什么慢？怎么优化？」** → 双线程序列化 + 通信 + diff；合并、路径更新、控制频率与体积。
- **「memo 为什么没生效？」** → memo 默认浅比较，回调/对象/数组每次新建会让比较失败；
  配合 `useCallback/useMemo` 稳定引用，或用 Compiler。
- **「Context 更新为什么全量渲染？」** → context value 引用变了，所有消费组件都会更新；拆分、memo、selector 订阅。
- **「useMemo 什么时候真的有用？」** → 有可测量的昂贵计算、或需要稳定引用给 memo/依赖数组；否则是纯开销。
- **「分包怎么分？独立分包和预下载区别？」** → 按业务/访问频率拆；独立分包不依赖主包可独立启动，预下载是进入某页前提前拉取。
- **「怎么证明优化有效？」** → 同一设备、同一网络、同一口径的前后指标对比 + 线上 RUM 监控。

## 常见面试题

### Q: 首屏加载怎么优化？

**A:** 分四层：① 体积：路由分割、按需引入、压缩、删无用依赖；② 关键路径：关键 CSS 内联、脚本 `defer` / 动态 import、字体 preload；
③ 网络：CDN、强缓存 + 内容哈希、preconnect；④ 渲染：SSR/SSG、骨架屏、图片懒加载。最后用 LCP/FCP 数据验证，而不是凭感觉。

### Q: 长列表为什么卡？虚拟列表怎么实现？

**A:** 卡在「同时存在的 DOM 数量」和滚动时的持续布局/合成，不是数据量本身。虚拟列表只渲染视口内 + overscan 缓冲的行，
用总高度占位、`translateY` 偏移渲染窗口。边界：动态行高需要测量或估计，快速滚动可能白屏（要缓冲），锚点/搜索要额外处理。

### Q: 小程序 setData 为什么是性能瓶颈？

**A:** 小程序逻辑层和渲染层是两个线程，`setData` 要序列化数据、跨线程传输、渲染层再 diff 更新。
次数多、数据大都会放大成本。优化：合并同一 tick 的更新、用路径更新只传变化字段、控制调用频率、`data` 里只放渲染字段。

### Q: 微任务/宏任务和性能优化有什么关系？

**A:** 微任务（Promise 回调）会在当前任务结束前清空，适合做合并提交（如 setData 合并）；长任务里的微任务堆积一样会阻塞渲染。
把大计算拆成多个任务（`setTimeout` / `scheduler` / Worker）才能让出主线程给输入和渲染。

### Q: 怎么减少重排和重绘？

**A:** 读写分离、批量修改 DOM；动画用 `transform`/`opacity`（合成层）；避免频繁读写布局属性（`offsetTop`、`getBoundingClientRect`）；
`will-change` 按需使用；列表更新保持稳定 key，减少不必要的 DOM 重建。

### Q: React 项目怎么定位和减少 re-render？

**A:** 先用 React DevTools Profiler 找热组件，再对症：状态下移、把大组件拆小、`memo` + 稳定引用、稳定 key、
避免在 render 中创建大对象/做重计算、必要时 `useTransition` / `useDeferredValue`。不要全量 `memo`，收益低还增加维护成本。

### Q: 分包怎么设计？独立分包和分包预下载有什么区别？

**A:** 主包放首屏与公共资源，按业务/访问频率拆分包，低频大模块（活动、设置）放独立分包；独立分包不依赖主包、可独立启动，
但用不到主包公共资源；`preloadRule` 是在进入某页面时提前下载目标分包，用空间换启动速度。注意主包 2MB、总包 20MB 限制。

### Q: 小程序长列表怎么优化？

**A:** 虚拟列表 / `recycle-view` 只渲染可视区域；分页 + 触底加载；避免整表 setData，按路径更新；
频繁交互用 WXS / Skyline worklet 减少跨线程通信；图片懒加载 + CDN 缩放。

### Q: 性能优化怎么证明有效？

**A:** 固定设备/网络/数据的同口径基线对比（Lighthouse、Performance Trace、小程序体验评分），
关键路径加 RUM 监控看真实用户分位数（P75/P95），并观察是否引入回归（CI 里跑性能预算）。

### Q: React.memo 的原理？浅比较到底比什么？

**A:** `memo(Component)` 包一层，父组件渲染时先比新旧 props：`Object.is` 相等直接跳过渲染，否则浅比较——
key 数量相同、每个 key 都存在、每个值 `Object.is` 相等，全部通过才跳过。只比第一层：
嵌套对象、每次新建的函数/数组都会让比较失败。可以传第二个参数自定义比较函数，但同样要保证语义正确。
本仓库 `src/exercises/shallow-equal/` 手写了这套逻辑。

### Q: 父组件渲染，子组件一定会渲染吗？

**A:** 默认会。父组件 render 会生成新的子元素，React 会重新执行子组件函数，除非：
子组件被 `memo` 包裹且 props 浅比较相等、或是同一个 `children` 引用（元素未变化）、
或组件自己实现了 bailout。注意：render 被跳过不等于 DOM 一定没变，反过来 render 执行了也不一定改 DOM。

### Q: useMemo / useCallback 什么时候真的有用？

**A:** 两种情况：① 计算确实昂贵且依赖不常变（大数组排序/过滤、复杂派生数据）；
② 需要稳定引用传给 `memo` 子组件、作为其它 Hook 的依赖、或放进 `useEffect` 依赖数组。
其余情况加了只是多一层依赖判断和内存占用。React Compiler 之后大部分场景可以交给编译器。

### Q: Context 更新导致大面积重渲染怎么办？

**A:** context 的 value 引用变化会通知所有消费者。优化：按更新频率拆成多个 Provider；
把 value 用 `useMemo` 稳定；消费组件 `memo` 化；只让需要变化的组件消费；
或用 `useSyncExternalStore` + selector 做细粒度订阅（状态库里常见方案）。

### Q: React 19 Compiler 之后还需要手动性能优化吗？

**A:** 需要。Compiler 自动做 memo 化，减少重复渲染，但解决不了结构性问题：
状态下移不当导致整页重渲染、长列表一次渲染、包体积、请求瀑布、Context 粒度、长任务。
优化思路仍是「先 Profiler 定位，再改结构」，Compiler 只是少写一些 `useMemo/useCallback`。

## 易错点 / 追问

- **只优化首屏，不管交互**：INP 往往才是真实用户痛点。
- **虚拟列表忽略动态高度**：不等高时按固定行高算会错位，需要测量或估算 + 校正。
- **setData 传整个 data / 大对象**：payload 直接翻倍，渲染层 diff 也更慢。
- **在循环、滚动回调里 setData**：通信次数被放大，必须合并或节流。
- **分包拆得过碎**：请求变多、维护成本上升；主包塞太多又会超限。
- **`will-change` / 合成层滥用**：显存和合成开销上升，反而更卡。
- **图片/广告位不预留尺寸**：首屏抖动，CLS 超标。
- **开发工具与真机差异**：小程序性能以真机为准，iOS/Android 差异明显。
- **优化没有量化**：说不清基线、改动量、结果，等于没做。
- **过早优化**：没有瓶颈证据就上复杂方案，增加 bug 面。
- **全量包 memo / 无脑 useMemo**：轻组件重渲染本来不是瓶颈，包一层反而增加比较和维护成本。
- **只看渲染次数不看耗时**：100 个空组件的重渲染可能比 1 个重组件便宜得多，以 Profiler 耗时为准。
- **依赖数组写错**：漏依赖导致值过期；依赖里放每次新建的对象/函数让 `useMemo` 永远重算。
- **用 `useEffect` 同步派生 state**：能直接算的就在 render 里算或用 `useMemo`，否则多一次渲染。
- **大 context 一把梭**：所有状态塞一个 Provider，任何字段变化都通知所有消费者。
- **index 当 key 又叠加 memo**：key 不稳会重建组件，memo 救不回来。

## 相关

- 通用答题方法：[../answer-sop.md](../answer-sop.md)
- 可运行 demo：`src/demos/performance/`
- 手写练习：`src/exercises/virtual-list/`、`src/exercises/set-data-scheduler/`、`src/exercises/shallow-equal/`
