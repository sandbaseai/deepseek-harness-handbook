---
title: 通过 DeepSeek Harness 运行 SandBase Harness
locale: zh-CN
source: docs/en/integrations/sandbase-harness-bridge.md
source_revision: 1
status: reviewed
verified_at: 2026-08-31
---

# 通过 DeepSeek Harness 运行 SandBase Harness

SandBase Harness 是本地优先的 Agent Runtime，提供 Session、沙箱、Memory、凭据、审计轨迹和 Console，并提供 DeepSeek Harness stdio MCP Bridge。本指南强调两个 Runtime 的权限边界。

## Runtime 边界

DeepSeek Harness 负责 Agent 回合、profile、审批和工具策略；SandBase Harness 负责 API、持久化 Agent/Session 状态、沙箱与凭据。Bridge 是两者之间的传输层：

```text
DeepSeek Harness profile -> stdio MCP bridge -> MANAGED_AGENTS_URL -> SandBase Harness API
```

Bridge 不会自动让任意 endpoint 可信。URL、凭据和可访问工具都要纳入威胁模型。

## 受控安装

使用带 tag 的源码 checkout 和一次性 DSH profile。SandBase README 当前记录 `v0.3.8`，重复操作前请核对 tag 和 Node 要求。

```bash
git clone --branch v0.3.8 --depth 1 https://github.com/sandbaseai/sandbase-harness.git
cd sandbase-harness && npm ci && npm run build
mkdir ../my-agents && cd ../my-agents
node ../sandbase-harness/dist/index.js init
node ../sandbase-harness/dist/index.js start
export MANAGED_AGENTS_URL=http://127.0.0.1:3000
dsh plugin --profile web add -w ../sandbase-harness
dsh web
```

探测期间保持 loopback；不要替换为未限定范围的包名或没有 DSH bundle 契约的包。

## 探测与证据

1. 列出 `mcp__sandbase__*` 工具并记录 schema。
2. 创建无害测试 Agent 和短 Session，不附带生产凭据。
3. 确认 Console 与 DSH 显示相同 Session ID 和终态。
4. 从 DSH 停止测试 Session，确认下游状态结算。
5. 移除 profile layer，确认基础 profile 仍可启动。

保留 SandBase tag、DSH revision、URL、工具名、审批事件、Session ID 和移除结果。一次成功调用不能证明取消、回放或凭据安全。

## 权限与回滚

- 远程访问完成认证前绑定 `127.0.0.1`。
- 启用写入、凭据、文件或沙箱操作前审阅 Bridge schema。
- 凭据留在 SandBase vault，不要放进 prompt 或提交到 profile。
- 发送文件前确认下游沙箱类型并记录网络目的地。
- 两个仓库固定 revision，升级后重跑无害探针。

回滚时停止 SandBase、移除 out-of-tree profile layer，并使用安装前快照启动基线 profile；不要删除共享 DSH 状态。

## 来源

- [SandBase Harness README 与 DSH Bridge](https://github.com/sandbaseai/sandbase-harness/tree/dea25a2)
- [DeepSeek Harness 插件指南](../../en/plugin-development/first-plugin.md)
- [社区插件审计](../../en/security/community-plugin-audit.md)
