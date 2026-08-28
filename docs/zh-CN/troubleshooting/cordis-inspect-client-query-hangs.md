---
title: 修复 Cordis client inspect 查询永久 Pending
locale: zh-CN
source: docs/en/troubleshooting/cordis-inspect-client-query-hangs.md
source_revision: 1
status: reviewed
verified_at: 2026-08-28
---

# 修复 Cordis client inspect 查询永久 Pending

如果 `platform: "client"` 的 `cordis_inspect_query` 已收到浏览器响应却仍然 Pending，不要先把它当成模型慢或 WebSocket 卡住。上游 #4926 在 `0.1.1-rc.2` 中发现：页面返回了明确的 `{ ok: false }` 拒绝，Host 丢弃了拒绝结果，而 `queryClient()` 没有 timeout 或其他终止条件，Agent 回合只能等用户取消。

## 先证明哪条边界坏了

需要分开记录三个契约：工具构造 client 请求；浏览器页面返回成功或拒绝；Host 结算 pending Promise 并发出最终 `tool/result`。页面的 `ok: false` 只证明第二条已完成，不证明第三条完成。

## 上游复现

让模型调用：

```json
{
  "platform": "client",
  "provider": "Service",
  "method": "listService",
  "input": { "service": "agentPresets" }
}
```

`agentPresets` 属于 Host 服务，client catalog 会返回 `no catalogued Service named "agentPresets"` 一类拒绝。报告中的实现会忽略 `ok: false`，留下 pending map 项，并无限等待。重复重试只会产生更多未结算请求。

## 取证与安全处理

保留脱敏的 tool-call id、请求参数、页面 `ok/reason/message`、pending 项前后状态、是否发出 `tool/result`、取消时间和连接页面数量。出现“页面拒绝存在 + Host 没有最终结果 + 没有 timeout”时：先取消一次，保留 Session，不要编辑压缩日志伪造成功结果；Host 服务应改用 Host platform，确需 client 服务时再确认页面已连接且 catalog 中存在目标方法。

## 修复验收矩阵

实现应记住首个拒绝，同时允许其他页面成功回答；`queryClient()` 必须有界等待，并在成功、拒绝结算和 abort 时清理 timer 与 pending 项：

| 场景 | 必须得到的终态 |
|---|---|
| 拒绝后超时 | 返回首个具体拒绝 |
| 拒绝后其他页面成功 | 返回成功结果 |
| 没有页面响应 | 返回明确 timeout |
| 调用方取消 | 返回 cancelled，之后不再补发结果 |
| 页面快速成功 | 立即返回，不等 deadline |

不要把每个拒绝立即当成最终失败，因为其他页面可能成功；也不要吞掉拒绝或取消 timeout。参阅[工具执行管线](../../en/architecture/tool-execution-pipeline.md)和上游 [#4926](https://github.com/deepseek-ai/deepseek-harness/discussions/4926)。
