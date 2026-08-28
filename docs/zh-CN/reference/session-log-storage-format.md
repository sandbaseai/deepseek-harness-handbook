---
title: DeepSeek Harness Session 日志存储格式
locale: zh-CN
source: docs/en/reference/session-log-storage-format.md
source_revision: 2
status: reviewed
verified_at: 2026-08-28
verified_upstream: 141eb6fef83422698aef7a981029e843e8161534
---

# 读取 Session 日志而不丢失流式输出

DeepSeek Harness 的 Session 日志不是“每行一个 `SessionEvent`”。rc.8 默认会把 JSONL 存成连续、带校验的 Zstandard frame，并把连续的 assistant 增量压缩成 `text-chunks`、`reasoning-chunks` 或 `tool-call-chunks` 行。这些是物理存储记录，不是逻辑 Session 事件。

```text
session.jsonl.zstd
  → 多个 Zstandard frame
  → 换行分隔的 storage record
  → SessionEvent 或 packed chunk row
  → 连续的逻辑事件流
```

读取器必须分层处理：先选择正确编码，逐个解码完整 frame，再区分 header、普通事件和 packed row；最后展开 packed row，验证从零开始连续的 `seq`。只认识事件类型表会静默丢掉大部分文本、推理和工具参数片段。

## Header 与三种 packed row

第一条逻辑记录是 `type: "session"` 的不可变 header，包含格式版本、Session ID、创建时间、委托深度等。它不是事件序号 0；序号校验从 header 之后开始。

默认 `packChunks: true` 时，至少三个连续、同一 block 的 assistant 增量会合并：

| 存储行 | 展开结果 | 片段字段 |
|---|---|---|
| `text-chunks` | `assistant/chunk` 的 `text-delta` | `data.texts[]` |
| `reasoning-chunks` | `assistant/chunk` 的 `reasoning-delta` | `data.texts[]` |
| `tool-call-chunks` | `assistant/chunk` 的 `tool-call-delta` | `data.args[]` 及 call id/name |

每行携带 `seq0`、`time0`、共享的 turn/step/index 和时间间隔 `dt`。第 k 个成员的序号是 `seq0 + k`；不要在重建前合并文本或参数片段。

```json
{"type":"text-chunks","seq0":10,"time0":1787150994000,"data":{"turn":1,"step":1,"index":0,"dt":[21,1],"texts":["He","llo"]}}
```

这代表序号 10 和 11 的两个事件，而不是一个没有 `seq` 的事件。

## 版本拒绝不等于迁移

上游报告 [#4910](https://github.com/deepseek-ai/deepseek-harness/discussions/4910) 盘点了多个会写入版本号、却只硬拒绝非当前版本的持久化层，并没有迁移、混合根回退或双写路径。因此要把 **unsupported format** 与 **corrupt data** 分开：结构完整但版本较旧的 header 不能被原地改写，升级 executable 也不能证明旧 Session 可读。

格式变更前，逐一记录 Session header、persistence backend、subagent descriptor、upload index 和 provider replay 的版本，并明确采用 `migrate`、`read-old/write-new`、`dual-write`、`export-only` 或 `reject-with-preserved-evidence` 哪一种策略。当前 reader 拒绝版本时，保留原始字节和 digest，使用受支持的导出或固定版本读取器；不要修改唯一副本或静默丢弃未知字段。

## 只读检查流程

1. 停止或静默 writer，或使用官方导出路径；不要读取正在变化的文件并称其为一致快照。
2. 复制原始 artifact，记录路径、大小、mtime 和 hash。
3. 先读取 header，遇到不支持的格式版本立即停止写入。
4. `.jsonl.zstd` 必须按顺序解码每个完整 frame；末尾不完整 frame 是崩溃边界，不能掩盖更早的损坏。
5. 解析逻辑行，把 header 之后每行交给 `decodeStorageRecord`。
6. 展开三种 packed row，验证事件序号连续，并分别报告物理行数和解码后的事件数。

临时诊断可在新的隔离根使用 `compression: none` 和 `packChunks: false`，但这只是新的写入布局，不是迁移命令，也不会重写既有根。

## 读取器验收清单

- 同时读取 `.jsonl` 与连续 `.jsonl.zstd` frame。
- 验证 header、格式版本、packed row 类型和序号连续性。
- 保留文本与工具参数的片段边界，精确重建 `seq`、`time`（包括负间隔）。
- packed、unpacked、mixed 布局读取结果一致；已知坏 packed row 要显式失败。
- 区分可恢复的末尾不完整 frame 与已提交区域的损坏。
- 迁移使用原始副本、原子目标、可重试步骤和 source digest，不修改唯一 live log。

## 来源

- [英文 canonical 指南](../../en/reference/session-log-storage-format.md)
- [官方 rc.8 JSONL persistence README](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/session/session-persistence-jsonl/README.md)
- [官方 packed-row codec](https://github.com/deepseek-ai/deepseek-harness/blob/141eb6fef83422698aef7a981029e843e8161534/packages/core/session/src/chunk-rows.ts)
- [持久化格式演进缺口报告 #4910](https://github.com/deepseek-ai/deepseek-harness/discussions/4910)
