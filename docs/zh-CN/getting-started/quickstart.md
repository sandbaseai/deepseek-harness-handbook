---
title: DeepSeek Harness 快速开始
locale: zh-CN
source: docs/en/getting-started/quickstart.md
source_revision: 1
status: reviewed
verified_at: 2026-08-14
---

# DeepSeek Harness 快速开始：完成第一次有效 Agent 运行

这条路线会启动官方 Web UI、连接模型、把第一次任务限制在明确的工作区中，并留下可检查的运行证据。

> [!WARNING]
> DeepSeek Harness 仍处于 developer preview。第一次运行请使用可丢弃的测试仓库，不要在对话中粘贴密钥，接受操作前逐项阅读审批请求。

## 1. 启动 Web UI

安装较新的 Node.js，在希望 Agent 检查的仓库目录中运行：

```sh
npx @deepseek-ai/dsh web
```

默认地址为 `http://127.0.0.1:3080`。保持终端运行；浏览器无法连接时，终端日志是第一检查点。

## 2. 配置模型

打开 **Settings → Models**，填写服务商 API Key 并保存。建议使用带额度限制的独立密钥，不要把密钥提交到仓库或放进问题报告。

## 3. 选择工作区

点击 **Choose workspace**，添加并选择启动 `dsh` 时所在的项目目录。新 Web UI 默认不选择工作区，因此选择之前输入框不可用。

## 4. 执行边界清晰的任务

新建会话并发送：

> Inspect this repository without changing files. Summarize its purpose, list its main packages, and cite the files that support each conclusion.

它明确了目标、禁止写入，并要求输出可核验的文件依据。

## 5. 检查成功信号

- 浏览器收到流式响应；
- 回答引用了当前工作区中的真实文件；
- 响应完成后会话仍然可见；
- 没有静默授权写入或命令执行。

常见问题优先按层检查：

| 现象 | 首先检查 |
|---|---|
| 浏览器无法连接 | 终端进程与打印出的地址 |
| 输入框不可用 | 是否选择了工作区 |
| 服务商认证错误 | 模型路由与 API Key |
| 工具被拒绝 | 权限与审批策略 |
| 出现错误文件 | 工作区与启动目录 |

## 查看真实运行组合

```sh
npx @deepseek-ai/dsh --profile web --dump-config
```

这会打印当前机器实际启动的 Cordis 配置树，是排查 Bundle、Plugin、工具和策略层的最快入口。

## 官方来源

- [DeepSeek Harness README](https://github.com/deepseek-ai/deepseek-harness/blob/master/README.md)
- [官方 Web UI 指南](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/guide/index.md)
- [官方模型服务商指南](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/guide/providers.md)
