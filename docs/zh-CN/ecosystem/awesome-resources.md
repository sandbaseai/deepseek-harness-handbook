---
title: DeepSeek Harness 生态资源能力地图
locale: zh-CN
source: docs/en/ecosystem/awesome-resources.md
source_revision: 1
status: reviewed
verified_at: 2026-08-28
---

# 按能力选择 DeepSeek Harness 生态资源

[Awesome DeepSeek Harness](https://github.com/0xsline/awesome-deepseek-harness) 从 DSH external hub 和 `dsh-plugin` topic 汇集了大型公开索引。本页不是复制全量列表，而是按 Agent 实际问题挑选代表性资源，并把安装、兼容性和安全判断留给上游项目与使用者。

源项目采用 CC0。下面的描述是简短的编辑摘要，不是背书或安全审计。安装到真实 profile 前，仍要核对仓库的 `package.json`、`dsh.bundle`、权限、发布活动、源码和目标 DSH 版本。

## 发现与开发

| 能力 | 资源 | 用途 |
|---|---|---|
| 插件开发 | [dsh-plugin-dev](https://github.com/dsh-external/dsh-plugin-dev) | Cordis 组合、TypeScript 配置、Windows junction 和持久化陷阱的实测笔记与技能。 |
| 插件作者技能 | [dsh-plugin-skills](https://github.com/dsh-external/dsh-plugin-skills) | 构建和测试 DeepSeek Harness 插件的 Agent skills。 |
| 插件组合示例 | [dsh-cordis-rocks](https://github.com/dsh-external/dsh-cordis-rocks) | 覆盖生命周期、工具、技能、工作流和运行时扩展的可运行 Cordis 教程。 |
| 查找插件 | [dsh-find-plugins](https://github.com/dsh-external/dsh-find-plugins) | 从 hub 目录找候选、给出安装路径，并要求验证结果。 |
| 上下文成本审计 | [dsh-context-doctor](https://github.com/Zhenyu98/dsh-context-doctor) | 量化指令、技能目录和工具 schema 的 token 成本，提示重复与冲突。 |
| 插件清单检查 | [dsh-plugin-check](https://github.com/dsh-external/dsh-plugin-check) | 只读检查插件 manifest、patch 格式、构建陷阱和 hub 收录状态。 |

发现工具只是索引，不是信任或安全证明。被列出不代表安全、活跃、与你的版本兼容或适合生产 profile。

## 记忆、Session 与恢复

| 能力 | 资源 | 用途 |
|---|---|---|
| Session 修复 | [dsh-session-repair-skill](https://github.com/dsh-external/dsh-session-repair-skill) | 以先读后写的流程检测并修复损坏的会话历史。 |
| Session 健康检查 | [dsh-session-health](https://github.com/dsh-external/dsh-session-health) | 扫描多帧 Zstandard Session 文件，发现撕裂、空文件或损坏。 |
| 跨 Session 记忆 | [dsh-memory](https://github.com/dsh-external/dsh-memory) | 提供跨 Session 的长期记忆；先检查存储和 prompt 注入边界。 |
| 跨 Agent 记忆 | [zilliztech/memsearch](https://github.com/zilliztech/memsearch) | 提供 DSH 插件和与其他编码 Agent 共用的记忆层。 |
| Session 分支 | [dsh-rewind](https://github.com/dsh-external/dsh-rewind) | 将 checkpoint 后的探索折叠成报告，同时保留完整日志。 |
| 跨工具 Session 导入 | [dsh-session-hub](https://github.com/dsh-external/dsh-session-hub) | 展示 opencode、Claude Code 和 Antigravity 历史，并幂等导入为原生 Session。 |

记忆和修复工具可能读取 prompt、工具输出和凭据。应在 profile 副本上测试，保留证据 digest，并确认命令是否会修改源文件。参阅 [Session 日志存储格式](../reference/session-log-storage-format.md) 了解 packed rows 与版本边界。

## 执行、路由与研究

| 能力 | 资源 | 用途 |
|---|---|---|
| plan/execute 路由 | [dsh-plan-execute](https://github.com/dsh-external/dsh-plan-execute) | 将规划和执行交给不同模型，并保留审批边界。 |
| 深度研究工作流 | [dsh-deep-research](https://github.com/dsh-external/dsh-deep-research) | 提供自适应研究编排流程。 |
| LLM fallback 策略 | [dsh-llm-fallbacks](https://github.com/dsh-external/dsh-llm-fallbacks) | 提供按角色的重试和备用策略；先核对成本与重试上限。 |
| 子 Agent 路由 | [DSH-Subagent-Model-Router](https://github.com/CypherNaught-0x/DSH-Subagent-Model-Router) | 将委托工作路由到配置模型，并提供等待/汇合行为。 |
| Agent 预算保护 | [dsh-agent-budget](https://github.com/dsh-external/dsh-agent-budget) | 增加 Agent 树 token 预算边界；需确认限制是否覆盖后代和重试。 |
| GitHub 凭据桥 | [dsh-gh-bridge](https://github.com/dsh-external/dsh-gh-bridge) | 将 macOS Keychain 中的 GitHub token 桥接到 `gh` 配置；必须审计 secret 范围。 |

路由和 fallback 可能放大 Provider 调用。先设定有界预算，记录所选模型与重试次数，并让审批和沙箱策略独立于插件描述。

## UI、文件与外部工具

| 能力 | 资源 | 用途 |
|---|---|---|
| 浏览器面板 | [dsh-browser-panel](https://github.com/dsh-external/dsh-browser-panel) | 在 Web UI 内嵌可见浏览器，逐步观察模型动作。 |
| Office 文件 | [dsh-office](https://github.com/dsh-external/dsh-office) | 提供 Office 文件工作流和文档预览。 |
| 设计工作流 | [dsh-design](https://github.com/dsh-external/dsh-design) | 提供设计 Agent 工作流、视觉验证和 hash 绑定交付。 |
| 跨 Agent 历史 | [dsh-chat-import](https://github.com/Nwflower/dsh-chat-import) | 将多个编码 Agent 历史导入为可恢复的 DSH Session。 |
| 翻译 | [dsh-plugin-translation](https://github.com/863683348/dsh-plugin-translation) | 提供分句翻译、术语抽取、QA 和翻译记忆。 |
| Pi 桥接 | [dsh-pi-adapter](https://github.com/dsh-external/dsh-pi-adapter) | 将 Pi coding-agent 扩展桥接进 Cordis 插件。 |
| 只读安全审计 | [dsh-security-audit](https://github.com/dsh-external/dsh-security-audit) | 将配置、插件来源、Session 和网络暴露面扫描为本地脱敏报告。 |
| 安全结构化工具 | [dsh-tool-schema](https://github.com/dsh-external/dsh-tool-schema) | 在无网络、无动态执行条件下验证和解释 JSON Schema 工具契约。 |

文件和浏览器能力会扩大副作用面。请在 disposable profile 中确认路径白名单、网络目的地、附件处理和人工审批行为，再用于重要工作区。

## 安全选择流程

1. 从 [Awesome 全量目录](https://github.com/0xsline/awesome-deepseek-harness/blob/main/CATALOG.md) 开始，按能力而不是热度筛选。
2. 阅读候选仓库 README、许可证、manifest、安装脚本和近期提交。
3. 对照 [社区插件审计指南](../../en/security/community-plugin-audit.md) 检查 DSH 版本与 profile。
4. 安装到 profile 副本，记录命令、包 bytes、权限和加载的 client modules。
5. 运行无害探针，验证成功信号，并测试卸载或回滚。
6. 将结果写入项目笔记；目录条目不是兼容性保证。

上游索引会频繁变化。本页是带日期的能力地图，当前全量列表以源项目为准。

## 来源与边界

- [Awesome DeepSeek Harness README](https://github.com/0xsline/awesome-deepseek-harness/blob/main/README.md)
- [Awesome DeepSeek Harness 全量目录](https://github.com/0xsline/awesome-deepseek-harness/blob/main/CATALOG.md)
- [社区插件审计指南](../../en/security/community-plugin-audit.md)
- [工具执行管线](../architecture/tool-execution-pipeline.md)
