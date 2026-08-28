---
title: 排查 DeepSeek Harness 长会话 ChatView 内存增长
locale: zh-CN
source: docs/en/troubleshooting/chatview-long-session-memory.md
source_revision: 1
status: reviewed
verified_at: 2026-08-28
---

# 排查长会话 ChatView 内存增长

当 `dsh web` 标签页随着 Session 变长越来越卡，尤其是 Safari/WebKit 的 WebContent RSS 达到 GB 级而 Node Host 保持稳定时，使用本指南。上游报告 [#4900](https://github.com/deepseek-ai/deepseek-harness/discussions/4900) 在 32 GB Mac 上实测 WebContent RSS 4.7–6.6 GB（此前更高）；刷新页面后内存回到基线。

## 先证明是哪一个进程增长

固定间隔记录 DSH 版本/commit、浏览器、Session 事件数、压缩日志大小、Host RSS 和 renderer RSS，并比较新 Session、长 Session 以及一次刷新。渲染进程随历史增长、Host 保持平稳，指向客户端投影层；这不能证明服务端泄漏，也不能证明数据丢失。

```text
Session 事件 / Markdown / 工具卡片
  → ChatView 全量投影
  → 常驻 DOM 与事件对象
  → WebContent RSS 随历史增长
```

不要用压缩 JSONL 大小估算 DOM 成本：10 MB 日志可能展开成数千棵 Markdown 树、代码块、工具卡片、附件节点和保留的 React/事件对象。

## 区分虚拟化与压缩

虚拟化/窗口化只让客户端回收视口外的消息 DOM，同时保留 durable Session；压缩会改变上下文或存储表示，正确性风险不同。刷新后 RSS 下降只证明渲染器被释放，不是压缩修复。不要为降低标签页内存删除或重写 Session 日志。

先保存浏览器 performance trace 和 DOM/node 数，再讨论修复。bundle 中找不到 `virtualization` 或 `windowing` 路径只是线索，不能单独证明完整根因。

## 用户侧安全缓解

1. 保留 Session 日志，记录当前 turn、滚动位置和 renderer PID。
2. 在任务边界收尾或拆分长对话，开新 Session，不要删除历史。
3. UI 仍可用时刷新标签页，记录前后 RSS 以及 Host 是否稳定。
4. 无人值守场景可使用有明确阈值的窄范围守卫，仅重启超阈值的 WebContent；不要触碰 Host 和持久化根，并记录每次重启。
5. 报告最小复现：事件数、block 类型、浏览器、viewport、RSS 时间线；脱敏 prompt、路径、凭据和工具输出。

守卫只是带来滚动位置和内存 UI 状态重置代价的 containment，不是正确性修复。不要向 Host 发送 `SIGKILL`，也不要删除 Session 根来解决内存问题。

## 维护者验收契约

- 长历史仍可回放并滚动定位；
- 视口外消息 DOM 在有界 overscan 窗口内回收；
- Markdown、代码、工具结果、附件、流式更新不会绕过窗口；
- Chat/Trajectory 视图不会各自复制整棵事件树；
- 在受控历史规模序列上测量 node、heap、layout 和 renderer RSS；
- reload、Session 切换、卸载会释放 listener、observer 和事件对象；
- 渲染器熔断不阻塞导航，并指出受影响 Session；
- 性能路径不修改或重编号 durable Session 事件。

至少在 Safari/WebKit 和一个 Chromium 浏览器上测试短、中、数千事件的夹具。应报告回归预算，不要把一次刷新称为“修复泄漏”。

## 来源

- [长会话 ChatView 内存报告 #4900](https://github.com/deepseek-ai/deepseek-harness/discussions/4900)
- [保护 live Session 日志](../../en/troubleshooting/live-session-log-durability.md)
- [不破坏证据地恢复 Session 历史](../../en/troubleshooting/session-history-corruption-triage.md)
- [英文 canonical 指南](../../en/troubleshooting/chatview-long-session-memory.md)
