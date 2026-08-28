---
title: DeepSeek Harness 开发者手册
locale: zh-CN
source: docs/en/README.md
source_revision: 2
status: reviewed
verified_at: 2026-08-29
---

# 简体中文手册

这是一份从 Agent 视角理解、运行、排查和扩展 DeepSeek Harness 的独立社区手册，由 [SandBase](https://sandbase.ai/) 维护，并非 DeepSeek AI 官方项目。

目前包含 **159 篇英文 canonical 指南和 175 份多语言文档**，所有版本敏感结论都标注验证日期和上游源码；简体中文提供核心内容与任务导航，下面五个最新专题摘要已逐行复核。英文原文始终是事实来源，中文入口不会假装拥有完整翻译覆盖率。

先从[英文可视化首页](https://sandbaseai.github.io/deepseek-harness-handbook/)选择任务，或直接使用 [Install Doctor](https://sandbaseai.github.io/deepseek-harness-handbook/install-doctor.html) 与 [Failure Router](https://sandbaseai.github.io/deepseek-harness-handbook/diagnose.html)。如果这份手册帮你少走了一次弯路，请为 [deepseek-harness-handbook 点一个 Star](https://github.com/sandbaseai/deepseek-harness-handbook)。这个公开信号能让更多 Agent 开发者找到经过源码验证的答案，而不是继续复制未经验证的命令。

最近的英文专题也已同步到主入口：

- [官方项目身份与下载站 provenance](../en/reference/official-project-identity.md)：核对仓库、npm integrity、release commit、安装权限和二进制签名。
- [filesystem 工具与 HTTP(S) URL 边界](../en/troubleshooting/filesystem-url-as-path.md)：拒绝把 URL 当作本地路径，并将网络读取交给 web/fetch 能力。
- [rc.7 baseline 与 alpha.1 Field Status](https://sandbaseai.github.io/deepseek-harness-handbook/field-status.html)：历史现场证据与当前源码边界分开阅读。
- [Continuable Subagents 生命周期（英文）](../en/agent-patterns/subagents.md#bind-child-lifetime-to-the-parent-owner)：把父级所有权、级联销毁、挂起回收和结算交接变成可验证契约。
- [安装期与子 Agent OOM（英文）](../en/agent-patterns/subagents.md#separate-install-time-oom-from-child-run-oom)：先区分依赖安装、Host 启动和子 Agent 执行阶段，再选择安全探针。
- [Firefox Web 客户端空白（英文专题）](../en/troubleshooting/firefox-web-client-blank.md)：对比浏览器、保留首个控制台异常和网络请求，避免在没有证据时重置 Session 或凭据。
- [认证 Token 无法获取或输入（英文专题）](../en/troubleshooting/auth-token-not-available.md)：先区分认证获取、UI 输入、存储和出站授权，避免泄露或盲目轮换密钥。
- [Continuable 子代理工具注册表为空（英文专题）](../en/agent-patterns/continuable-child-empty-tool-registry.md)：区分父子工具视图、组合顺序与 cold resume，避免把模型幻觉当成真实工具调用。
- [Windows 只读 PowerShell stderr 噪声（英文专题）](../en/troubleshooting/windows-readonly-pwsh-stderr.md)：区分命令输出与 ConstrainedLanguage 前置代码诊断，不要为消除噪声而关闭 ACL 沙箱。
- [Agent 回合与父子生命周期](architecture/agent-lifecycle.md)：区分 durable turn/step 事件与 live Agent，并验证父级销毁时的子 Agent 交接、挂起回收和 settlement 记录。

这份手册已被社区维护的 [Awesome DeepSeek Harness](https://github.com/0xsline/awesome-deepseek-harness#ecosystem-services--resources) 收录。中文读者也可以参考社区项目 [DeepSeek Harness 橙皮书](https://github.com/alchaincyf/deepseek-harness-orange-book)，两者均独立维护，均不代表 DeepSeek 官方。如果你遇到尚未覆盖的真实故障，可以在[下一篇指南选题入口](https://github.com/sandbaseai/deepseek-harness-handbook/discussions/99)提交脱敏证据；中文报告同样欢迎。

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

## 最近完成源码验证的专题

以下页面的 canonical 内容仍为英文。这里提供已复核的中文任务说明和验证边界，不把自动翻译冒充为完整中文版本。

| 真实问题 | 英文专题 | 这篇文章证明什么 |
|---|---|---|
| 启动后出现 `HTML did not preload @deepseek-ai/dsh-client-modules/client.js`，是不是 npm 缺包？ | [Client Modules Boot（英文）](../en/troubleshooting/client-modules-html-did-not-preload.md) | 错误证明浏览器 registration queue 缺少 bootstrap factory；需要从同一代 HTML、`/plugins` bytes、script 顺序、代理缓存和启动方式逐层定位。 |
| 模型连续输出 `000000...` 并最终达到输出 token 上限，应该直接加大上限吗？ | [Degenerate Model Output（英文）](../en/troubleshooting/degenerate-model-output.md) | `max-tokens` 是 finish reason，重复退化是独立的内容形态故障；先停止、保留 channel 与 usage 证据，再决定有限重试。 |
| TUI 中所有 registry slash command 都报 `undefined.aborted`，是 `/compact` 坏了吗？ | [TUI Command ABI（英文）](../en/troubleshooting/tui-slash-command-signal-images-slot.md) | 官方调用是 `(agent, line, images, signal)`；必须修复两个 dispatch path，把 `[]` 放在 image slot，而不是把 signal 改成可选。 |
| “重新生成回复”能否直接删除最后答案后重发？ | [Regenerate Reply Contract（英文）](../en/troubleshooting/stuck-turn-stop-and-retry.md#regenerate-reply-means-branch-then-replay) | 应从上一已完成 Turn 分叉，在 child Session 重新准入有序用户输入和图片；分叉不会回滚外部副作用。 |
| GitHub 已有 alpha.1 Release，但 npm 安装 exact version 返回 E404，哪个才是真的？ | [Install Identity（英文）](../en/getting-started/install-deepseek-harness.md) | GitHub Release、tag、源码 manifest、npm artifact、dist-tag 与本地 executable 是不同证据，只有真实发布的 bytes 才能安装。 |

这些结论分别固定到 DeepSeek Harness rc.2 [`b150a551…`](https://github.com/deepseek-ai/deepseek-harness/tree/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e) 或 alpha.1 [`cd5ef814…`](https://github.com/deepseek-ai/deepseek-harness/tree/cd5ef8148158c3a752a658978873241fdf8e2bbc) 的官方源码。文章会明确区分已经发布的行为、社区提案和建议的验收契约。

如果你的实际版本与文章不同，请提交[手册错误报告](https://github.com/sandbaseai/deepseek-harness-handbook/issues/new?template=bug-report.yml)，写明 DSH 版本、操作系统、入口和第一个错误。日志应移除 API Key、Token、签名 URL、私人路径、无关 Prompt 与凭据值。

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
