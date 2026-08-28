---
title: DeepSeek Harness Agent 回合与子 Agent 生命周期
locale: zh-CN
source: docs/en/architecture/agent-lifecycle.md
source_revision: 4
status: reviewed
verified_at: 2026-08-28
verified_upstream: b150a551b8d465e31e418e1b2eaf5e79bbb7d28e
---

# 一次 Agent 回合，以及父子生命周期

一个 **step** 是一次模型请求及其产生的工具调用；一个 **turn** 可以包含多个 step，只有运行时不再欠任何工作时才结束。持久化的 `turn/*`、`step/*`、`user/message`、`assistant/*` 和 `tool/*` 事件用于回放；`agent/*` 事件只协调正在运行的 Agent。

```text
用户输入 → inbox → driver → pre-step/上下文 → 模型
       → pre-execute/execute/post-execute → tool 结果
       → step/end → 继续 step 或 turn/end
```

## 先按最后一个持久化事件定位卡住的位置

| 最后事件 | 优先边界 |
|---|---|
| 没有 `turn/start` | inbox 唤醒或 Agent 创建 |
| 有 `turn/start`，没有 `step/start` | pre-step 决策或启动失败 |
| 有 `step/start`，没有 assistant 输出 | Provider / 请求路径 |
| 有 `tool/call`，没有结果 | 审批、策略、Provider 或执行 |
| 有 `step/end`，没有 `turn/end` | 排队输入、continuation 或停止钩子 |

不要用“进程还活着”证明回合仍在推进；先保留最后一个 durable event、运行版本、Session ID 和首个错误。

## 父级销毁必须有独立的生命周期契约

上游架构报告 [#4909](https://github.com/deepseek-ai/deepseek-harness/discussions/4909) 说明：父 Agent 销毁时，continuable 子 Agent 可能仍被 service/factory scope 持有。显式的 `drainChildren()`、永远等待 `whenIdle()` 的子 Agent，以及父级消失后静默返回的结算回调，会形成四个独立缺口：所有权、级联清理、挂起子回收和结算交付。

```text
父级 dispose
  → 子 Agent 决策（级联 | 交接 | 拒绝）
  → 有界 drain / 强制回收
  → 持久化 settlement disposition
```

最小回归夹具应创建父级，启动一个尚未结算的子级，先销毁父级，再分别验证子级正常结算和挂起超时。应证明没有孤儿 activation、结算没有静默丢失，且父 Session 记录了交接/取消/回收结果；不要因为一次工具调用成功就推断生命周期安全。社区参考补丁也不等于主分支已经提供该契约。

## 不要把前沿搜索塞进默认线性驱动器

beam search、分支剪枝和成本预算应由外部 controller 管理候选 Session lineage、评分、宽度/深度/Token/时间预算和最终 disposition。不要把可变 Agent 对象交给第三方评分器；应持久化候选 ID、状态摘要、评分版本、稳定 tie-break 和 selected/pruned/failed/cancelled 结果。涉及工具副作用时，只允许只读或可模拟能力。

## 验证清单

- 父级销毁会级联释放、明确交接，或记录拒绝原因。
- 挂起子级有超时或强制回收，不会永久等待 `whenIdle()`。
- settlement 的 delivered、handoff、cancelled、dropped 状态可追溯。
- Session 回放只读取 durable event，不把 live Agent 状态当历史。
- 工具调用仍经过策略、审批、沙箱和 telemetry 边界。
- 回归测试覆盖父先销毁、子正常完成、子超时和重复 dispose。

## 来源

- [官方 Agent lifecycle（rc.2）](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/docs/agent-lifecycle.md)
- [生命周期交接与孤儿子 Agent 报告 #4909](https://github.com/deepseek-ai/deepseek-harness/discussions/4909)
- [英文 canonical 指南](../../en/architecture/agent-lifecycle.md)
