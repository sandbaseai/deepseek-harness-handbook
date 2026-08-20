---
title: DeepSeek Harness 开发者手册
locale: zh-CN
source: docs/en/README.md
source_revision: 1
status: reviewed
verified_at: 2026-08-20
---

# 简体中文手册

这是一份从 Agent 视角理解、运行、排查和扩展 DeepSeek Harness 的独立社区手册，由 [SandBase](https://sandbase.ai/) 维护，并非 DeepSeek AI 官方项目。

目前包含 **110 篇英文 canonical 指南**，所有版本敏感结论都标注验证日期和上游源码；简体中文提供经过审核的核心内容与任务导航。英文原文始终是事实来源，中文入口不会假装拥有完整翻译覆盖率。

先从[英文可视化首页](https://sandbaseai.github.io/deepseek-harness-handbook/)选择任务，或直接使用 [Install Doctor](https://sandbaseai.github.io/deepseek-harness-handbook/install-doctor.html) 与 [Failure Router](https://sandbaseai.github.io/deepseek-harness-handbook/diagnose.html)。如果这份手册帮你少走了一次弯路，请为 [deepseek-harness-handbook 点一个 Star](https://github.com/sandbaseai/deepseek-harness-handbook)。这个公开信号能让更多 Agent 开发者找到经过源码验证的答案，而不是继续复制未经验证的命令。

这份手册已被社区维护的 [Awesome DeepSeek Harness](https://github.com/0xsline/awesome-deepseek-harness#ecosystem-services--resources) 收录。如果你遇到尚未覆盖的真实故障，可以在[下一篇指南选题入口](https://github.com/sandbaseai/deepseek-harness-handbook/discussions/99)提交脱敏证据；中文报告同样欢迎。

## 按你的任务开始

| 我现在要做什么 | 最短入口 | 你会得到什么 |
|---|---|---|
| 第一次运行 DeepSeek Harness | [五分钟快速开始](getting-started/quickstart.md) | 一次安全、可观察的 Web UI 任务 |
| 安装失败，不确定先查哪里 | [Install Doctor](https://sandbaseai.github.io/deepseek-harness-handbook/install-doctor.html) | 按系统、安装方式和首个错误生成取证命令 |
| 已经运行，但 Agent 行为异常 | [Failure Router](https://sandbaseai.github.io/deepseek-harness-handbook/diagnose.html) | 从失败表象定位模型、工具、权限、会话或传输边界 |
| 想理解 Agent Runtime | [Agent Runtime 架构地图](architecture/agent-runtime.md) | 模型、工具、权限、沙箱与 Session 的分层关系 |
| 想开发插件 | [第一个插件实验（英文）](../en/plugin-development/first-plugin.md) | 从工具定义、打包到安装验证的完整路径 |
| 想连接 MCP 工具 | [MCP 指南（英文）](../en/integrations/mcp.md) | 组合、发现、连接与隔离故障的排查方法 |
| 担心意外产生 API 费用 | [API Cost Boundary（英文）](../en/security/prevent-unexpected-deepseek-api-charges.md) | 从模型可见性到真实网络出口的逐层证明 |

不知道问题属于哪一层时，先使用 Failure Router；如果命令还没有成功启动，先使用 Install Doctor。这两个工具都在浏览器本地运行，不上传日志、配置或工作区内容。

## 为什么这不是另一份命令清单

- **Agent 视角：** 围绕任务边界、工具效果、权限、Session 和完成条件组织内容。
- **源码验证：** 版本敏感页面链接到 DeepSeek Harness 官方源码、文档或 Discussion。
- **故障可证：** 指南给出最早证据、成功信号、失败分支和不应使用的危险捷径。
- **持续更新：** [Changelog](../../CHANGELOG.md) 和 [Atom Feed](https://sandbaseai.github.io/deepseek-harness-handbook/feed.xml) 记录新增指南与修订。
- **覆盖透明：** 英文是 canonical；中文、日文、韩文和西班牙文明确标注审核状态。

建议先阅读[五分钟快速开始](getting-started/quickstart.md)，完成一次安全、可观察的 Web UI 任务；随后通过 [Agent Runtime 架构地图](architecture/agent-runtime.md)理解模型、工具、权限、沙箱和会话为何必须分层设计。

## 推荐阅读

- [DeepSeek Harness 是什么？](what-is-deepseek-harness.md)
- [五分钟快速开始](getting-started/quickstart.md)
- [Agent Runtime 架构地图](architecture/agent-runtime.md)
- [Python SDK（英文）](../en/getting-started/python-sdk.md)
- [模型 Provider 配置（英文）](../en/getting-started/model-providers.md)
- [Tool Execution Pipeline（英文）](../en/architecture/tool-execution-pipeline.md)
- [Install Doctor（英文交互工具）](https://sandbaseai.github.io/deepseek-harness-handbook/install-doctor.html)
- [Failure Router（英文交互工具）](https://sandbaseai.github.io/deepseek-harness-handbook/diagnose.html)
- [Session 标题与推理预算（英文）](../en/troubleshooting/session-title-reasoning-budget.md)

## 学习路线

- **第一次运行：** Web UI、模型配置、工作区与安全验证。
- **Agent 开发者：** 任务契约、上下文、工具、策略、会话和完成条件。
- **Runtime 工程师：** Cordis 组合、Capability Seam、生命周期与扩展点。
- **运维与排错：** 持久化、取消、沙箱、故障定位与上游变化。

DeepSeek Harness 目前处于 developer preview。请关注每篇文章的验证日期和官方来源。
