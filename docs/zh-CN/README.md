---
title: DeepSeek Harness 开发者手册
locale: zh-CN
source: docs/en/README.md
source_revision: 1
status: reviewed
verified_at: 2026-08-14
---

# 简体中文手册

这是一份从 Agent 视角理解、运行、排查和扩展 DeepSeek Harness 的独立社区手册，由 [SandBase](https://sandbase.ai/) 维护，并非 DeepSeek AI 官方项目。

建议先阅读[五分钟快速开始](getting-started/quickstart.md)，完成一次安全、可观察的 Web UI 任务；随后通过 [Agent Runtime 架构地图](architecture/agent-runtime.md)理解模型、工具、权限、沙箱和会话为何必须分层设计。

## 推荐阅读

- [DeepSeek Harness 是什么？](what-is-deepseek-harness.md)
- [五分钟快速开始](getting-started/quickstart.md)
- [Agent Runtime 架构地图](architecture/agent-runtime.md)
- [Python SDK（英文）](../en/getting-started/python-sdk.md)
- [模型 Provider 配置（英文）](../en/getting-started/model-providers.md)
- [Tool Execution Pipeline（英文）](../en/architecture/tool-execution-pipeline.md)

## 学习路线

- **第一次运行：** Web UI、模型配置、工作区与安全验证。
- **Agent 开发者：** 任务契约、上下文、工具、策略、会话和完成条件。
- **Runtime 工程师：** Cordis 组合、Capability Seam、生命周期与扩展点。
- **运维与排错：** 持久化、取消、沙箱、故障定位与上游变化。

DeepSeek Harness 目前处于 developer preview。请关注每篇文章的验证日期和官方来源。
