---
title: 诊断 Continuable 子代理工具注册表为空
locale: zh-CN
source: docs/en/agent-patterns/continuable-child-empty-tool-registry.md
source_revision: 1
status: reviewed
verified_at: 2026-08-28
sources:
  - https://github.com/deepseek-ai/deepseek-harness/discussions/4921
---

# 诊断 Continuable 子代理工具注册表为空

当 continuable 子代理可以启动，但工具列表只有 `report`（或为空），而父 Agent 能调用文件系统、Shell 或 MCP 工具时，使用本指南。这是组合与所有权边界失败，不是模型忘记了工具名称。

## 区分两个工具视图

父子 Agent 可以拥有不同的工具视图。子视图由全局层、继承的作用域层和子代理自身 setup 组成。`startContinuable()` 成功只证明创建了子 Session，不证明父会话的 standing preset 已组合进子会话。

| 观察结果 | 能证明什么 | 不能证明什么 |
|---|---|---|
| 父会话能枚举 `read`、`grep` 或 MCP 工具 | 父视图可见这些工具 | continuable 子代理继承了同一作用域 |
| 子代理只有 `report` | 子代理本地 reporting setup 已运行 | `composeFrom(parent.ctx)` 成功运行 |
| 普通角色子代理拥有完整工具集 | 当前部署中的工具支持作用域化 | continuable materialization 路径正确 |
| 已配置 `toolFilter` | 请求了过滤器 | 存在可供过滤的注册表 |

上游 rc.2 报告在多个角色中复现了这一差异：普通角色路径能继承工具，continuable 路径却只暴露无条件注册的 reporting 工具。

## 先保留证据，再修改 preset

记录确切的 Harness 版本、安装布局、profile、父 Session、子代理 ID 和完整的启动确认文本。然后分别枚举父子工具，但不要打印凭据或 prompt 内容。建议保留如下证据表：

```text
边界                 可见工具                  setup 证据
父 standing          read, grep, mcp__*        preset mount 已解析
continuable 子代理   report                    子代理 setup 已运行
continuable 子代理   缺少 read/grep            继承组合未知
```

不要在尚未确认所有权边界前，把所有插件直接加入子代理。这种绕行虽然能让工具出现，却可能悄悄改变过滤和沙箱语义。

## 跟踪 continuable 组合路径

请根据运行版本检查 materialization 顺序（不同版本的行号会变化）：

1. 从父描述符创建子上下文。
2. 记录委派策略覆盖和请求的 `toolFilter`。
3. 子组合尝试解析 `agentPresets`，并组合父 standing mount。
4. Continuable setup 注册 `report` 及作用域 MCP 等子代理本地工具。
5. 为首轮执行截取子代理工具视图。

如果第 3 步得到 `undefined`，可选链可能把失败变成空操作：Session 仍然有效，但没有继承工具。如果第 5 步早于 standing mount 绑定，首个 Activation 的工具快照也可能永久不完整。

## 用最小矩阵验证失败模式

准备一个无害的文件工具和一个 MCP 工具，运行以下矩阵：

| 测试 | 预期结果 |
|---|---|
| 父 standing preset + 普通角色子代理 | 子代理看到允许继承的工具 |
| 父 standing preset + continuable 子代理 | 子代理看到同样工具，并受 `toolFilter` 约束 |
| continuable 子代理 + deny filter | 被拒绝的工具消失，允许的工具保留 |
| materialization 时缺失 preset service | 明确诊断指出缺少组合服务 |
| 启动后立即枚举工具 | 组合和 setup 完成后再截取快照 |

每个用例都要进行 cold resume。只在 warm Activation 成功，不能证明持久化的子描述符包含重建工具作用域所需的信息。

## 安全的操作绕行

在运行时明确报告组合失败前，优先使用已确认继承工具视图正常的、有边界的普通角色子代理。如果任务必须使用 continuable 子代理，只在自身 setup 中注册最小所需能力，保留相同的 deny 列表和沙箱模式，并明确这只是插件粒度的 fallback，不是真正的父作用域继承。

如果工具枚举证明没有 `read`，不要告诉子代理“读取文件”。没有对应工具调用事件的“已读取”结果只能视为未经验证的模型陈述。

## 运行时加固清单

- 将可选链静默跳过改为结构化组合错误，并包含父子 ID。
- 分别记录 standing mount 查找、作用域父级绑定、setup 顺序和首个工具快照。
- 让子 ID 与 job ID 外观明显不同；不能把子 ID 交给 `job_output`。
- 增加回归测试：启动 continuable 子代理，断言一个继承文件工具、一个继承 MCP 工具以及正确的 allow/deny 过滤。
- 为 cold resume 持久化足够的 preset 身份和策略元数据，但不要持久化密钥。

## 来源

- [上游报告：Continuable 子代理工具注册表为空（#4921）](https://github.com/deepseek-ai/deepseek-harness/discussions/4921)
