---
title: DeepSeek Harness 工具执行管线
locale: zh-CN
source: docs/en/architecture/tool-execution-pipeline.md
source_revision: 3
status: reviewed
verified_at: 2026-08-28
---

# DeepSeek Harness 工具执行管线

模型生成的工具调用不会直接产生副作用。DeepSeek Harness 会记录 `tool/call`，依次经过策略与 hook、审批、单调 guard、工具分发、结果归一化，最后写入一个权威的 `tool/result`。

```text
assistant tool-call
  → durable tool/call
  → tools/pre-execute
  → approval / guards
  → tools/execute → tool body
  → tools/post-execute → finalizeContent
  → immutable tools/result → durable tool/result
```

## 各阶段负责什么

| 阶段 | 用途 |
|---|---|
| `tools/pre-execute` | 可组合 hook、权限决策、沙箱准备 |
| `ctx.approval` | 对 `ask` 决策给出一次性人工回答 |
| registered guard | 后续 hook 不能削弱的单调不变量 |
| `tools/execute` | 超时、重试、metrics 等 dispatch 包装 |
| tool body | 具体能力实现 |
| `tools/post-execute` | 显式转换结果或添加上下文 |
| `finalizeContent` | definition 所有的最终内容不变量 |
| `tools/result` | 观察冻结后的权威结果 |

Permission 表示策略允许、拒绝或询问；Approval 记录人对一次动作的回答；Guard 保持不可重排的拒绝不变量；Sandbox 限制执行环境。审批不会移除沙箱边界，模型提示也不是权限策略的替代品。

## 为什么先记录 tool/call

持久化 `tool/call` 让客户端能显示 pending work，也让 replay 保留模型请求，即使动作最终被拒绝。每个调用应产生一个模型可见的 `tool/result`，其中包含归一化后的失败或拒绝原因。

## 用最后一个可见阶段排查

| 证据 | 优先调查 |
|---|---|
| assistant 消息但没有 `tool/call` | 调用解析/分类 |
| `tool/call` 卡在 pending | pre-execute hook 或审批 |
| 审批已接受但没有 dispatch | monotonic guard |
| dispatch 开始后不结束 | tool body、timeout、Provider、取消 |
| 有结果但内容错误 | post-execute 或 `finalizeContent` |
| UI 与模型历史不一致 | durable event 渲染与 live state |

## Waterfall listener 可以让所有工具失效

`tools/pre-execute` 是 waterfall，不是普通通知。监听器如果不调用 `next()` 就返回，可能阻止内置 decision handler 运行；消费者随后读取 `gate.kind` 就会把所有工具变成模糊的 `Cannot read properties of undefined (reading 'kind')`。上游 [#4906](https://github.com/deepseek-ai/deepseek-harness/discussions/4906) 记录了第三方 marketplace 插件造成的这一模式。

安装一个插件后所有工具都失败时，先用移除插件的最小 profile 做 A/B，不要先换模型或工作区。无关工具必须调用 `next()`，或显式返回 `{ kind: 'allow' | 'deny' | 'ask' }`。对 `undefined` 或非法 gate 应 fail-closed，产出命名清晰的诊断和明确的 deny/blocked 结果；不要让后续属性访问把真正的策略边界隐藏成通用工具错误。保留插件/profile 版本和完整事件顺序，也不要重试每一个工具调用。

## 验收清单

- `tool/call` 在执行前持久化，且拒绝后仍有一个权威 `tool/result`。
- Permission、Approval、Guard、Sandbox 的职责和证据互不混淆。
- waterfall listener 对无关工具调用 `next()`，或返回合法 decision。
- 非法 decision 被 fail-closed，并指出责任 hook/plugin。
- 重试与超时包在 `tools/execute`，不会绕过审批和沙箱。
- post-execute、normalize、render 与模型看到的结果使用同一份冻结结果。
- 回归覆盖最小 profile、插件 profile、allow/deny/ask 和 listener dispose。

## 来源

- [英文 canonical 指南](../../en/architecture/tool-execution-pipeline.md)
- [官方 Tool execution pipeline](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/tool-execution-pipeline.md)
- [Waterfall 短路报告 #4906](https://github.com/deepseek-ai/deepseek-harness/discussions/4906)
