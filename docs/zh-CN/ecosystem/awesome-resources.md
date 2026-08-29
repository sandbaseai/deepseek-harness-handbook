---
title: DeepSeek Harness 生态资源能力地图
locale: zh-CN
source: docs/en/ecosystem/awesome-resources.md
source_revision: 17
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
| 插件组合示例 | [dsh-cordis-rocks（目录快照）](https://github.com/0xsline/awesome-deepseek-harness/blob/c2cc7c971f33340d0fed614341041be52e35f9dc/CATALOG.md) | 上游目录记录了可运行 Cordis 教程；安装前先确认仓库当前是否可见。 |
| 查找插件 | [dsh-find-plugins（目录快照）](https://github.com/0xsline/awesome-deepseek-harness/blob/c2cc7c971f33340d0fed614341041be52e35f9dc/CATALOG.md) | 上游目录记录了发现工具；安装前先确认仓库当前是否可见。 |
| 上下文成本审计 | [dsh-context-doctor](https://github.com/Zhenyu98/dsh-context-doctor) | 量化指令、技能目录和工具 schema 的 token 成本，提示重复与冲突。 |
| 插件清单检查 | [dsh-plugin-check](https://github.com/dsh-external/dsh-plugin-check) | 只读检查插件 manifest、patch 格式、构建陷阱和 hub 收录状态。 |

发现工具只是索引，不是信任或安全证明。被列出不代表安全、活跃、与你的版本兼容或适合生产 profile。

## 记忆、Session 与恢复

| 能力 | 资源 | 用途 |
|---|---|---|
| Session 修复 | [dsh-session-repair-skill（目录快照）](https://github.com/0xsline/awesome-deepseek-harness/blob/c2cc7c971f33340d0fed614341041be52e35f9dc/CATALOG.md) | 目录记录了先读后写的修复流程；安装前先确认仓库当前是否可见。 |
| Session 健康检查 | [dsh-session-health](https://github.com/dsh-external/dsh-session-health) | 扫描多帧 Zstandard Session 文件，发现撕裂、空文件或损坏。 |
| 跨 Session 记忆 | [dsh-memory（目录快照）](https://github.com/0xsline/awesome-deepseek-harness/blob/c2cc7c971f33340d0fed614341041be52e35f9dc/CATALOG.md) | 目录记录了长期记忆插件；先确认仓库可见性并检查 prompt 注入边界。 |
| 跨 Agent 记忆 | [zilliztech/memsearch](https://github.com/zilliztech/memsearch) | 提供 DSH 插件和与其他编码 Agent 共用的记忆层。 |
| Session 分支 | [dsh-rewind](https://github.com/dsh-external/dsh-rewind) | 将 checkpoint 后的探索折叠成报告，同时保留完整日志。 |
| 跨工具 Session 导入 | [dsh-session-hub（目录快照）](https://github.com/0xsline/awesome-deepseek-harness/blob/c2cc7c971f33340d0fed614341041be52e35f9dc/CATALOG.md) | 目录记录了跨工具历史导入；安装前先确认仓库当前是否可见。 |

记忆和修复工具可能读取 prompt、工具输出和凭据。应在 profile 副本上测试，保留证据 digest，并确认命令是否会修改源文件。参阅 [Session 日志存储格式](../reference/session-log-storage-format.md) 了解 packed rows 与版本边界。

## 执行、路由与研究

| 能力 | 资源 | 用途 |
|---|---|---|
| plan/execute 路由 | [dsh-plan-execute（目录快照）](https://github.com/0xsline/awesome-deepseek-harness/blob/c2cc7c971f33340d0fed614341041be52e35f9dc/CATALOG.md) | 目录记录了规划与执行分离；安装前先确认仓库当前是否可见。 |
| 深度研究工作流 | [dsh-deep-research](https://github.com/dsh-external/dsh-deep-research) | 提供自适应研究编排流程。 |
| LLM fallback 策略 | [dsh-llm-fallbacks](https://github.com/dsh-external/dsh-llm-fallbacks) | 提供按角色的重试和备用策略；先核对成本与重试上限。 |
| 子 Agent 路由 | [DSH-Subagent-Model-Router](https://github.com/CypherNaught-0x/DSH-Subagent-Model-Router) | 将委托工作路由到配置模型，并提供等待/汇合行为。 |
| Agent 预算保护 | [dsh-agent-budget](https://github.com/dsh-external/dsh-agent-budget) | 增加 Agent 树 token 预算边界；需确认限制是否覆盖后代和重试。 |
| GitHub 凭据桥 | [dsh-gh-bridge（目录快照）](https://github.com/0xsline/awesome-deepseek-harness/blob/c2cc7c971f33340d0fed614341041be52e35f9dc/CATALOG.md) | 目录记录了 Keychain 桥；必须确认仓库可见性并审计 secret 范围。 |

路由和 fallback 可能放大 Provider 调用。先设定有界预算，记录所选模型与重试次数，并让审批和沙箱策略独立于插件描述。

## UI、文件与外部工具

| 能力 | 资源 | 用途 |
|---|---|---|
| 浏览器面板 | [dsh-browser-panel（目录快照）](https://github.com/0xsline/awesome-deepseek-harness/blob/c2cc7c971f33340d0fed614341041be52e35f9dc/CATALOG.md) | 目录记录了可见浏览器面板；安装前先确认仓库当前是否可见。 |
| Office 文件 | [dsh-office（目录快照）](https://github.com/0xsline/awesome-deepseek-harness/blob/c2cc7c971f33340d0fed614341041be52e35f9dc/CATALOG.md) | 目录记录了 Office 文件工作流；安装前先确认仓库当前是否可见。 |
| 设计工作流 | [dsh-design（目录快照）](https://github.com/0xsline/awesome-deepseek-harness/blob/c2cc7c971f33340d0fed614341041be52e35f9dc/CATALOG.md) | 目录记录了设计 Agent 工作流；安装前先确认仓库当前是否可见。 |
| 跨 Agent 历史 | [dsh-chat-import](https://github.com/Nwflower/dsh-chat-import) | 将多个编码 Agent 历史导入为可恢复的 DSH Session。 |
| 翻译 | [dsh-plugin-translation](https://github.com/863683348/dsh-plugin-translation) | 提供分句翻译、术语抽取、QA 和翻译记忆。 |
| Pi 桥接 | [dsh-pi-adapter（目录快照）](https://github.com/0xsline/awesome-deepseek-harness/blob/c2cc7c971f33340d0fed614341041be52e35f9dc/CATALOG.md) | 目录记录了 Pi 桥；安装前先确认仓库当前是否可见。 |
| 只读安全审计 | [dsh-security-audit](https://github.com/dsh-external/dsh-security-audit) | 将配置、插件来源、Session 和网络暴露面扫描为本地脱敏报告。 |
| 安全结构化工具 | [dsh-tool-schema](https://github.com/dsh-external/dsh-tool-schema) | 在无网络、无动态执行条件下验证和解释 JSON Schema 工具契约。 |

文件和浏览器能力会扩大副作用面。请在 disposable profile 中确认路径白名单、网络目的地、附件处理和人工审批行为，再用于重要工作区。

## 上游目录中的更多资源

上游全量目录覆盖面很广。下面这些项目更适合用来设计 Agent 工作流，而不只是增加一个孤立工具：

| 方向 | 资源 | 首先核对什么 |
|---|---|---|
| Agent 对比 | [dsh-agent-arena](https://github.com/LeemanCheung/dsh-agent-arena) | 隔离 worktree、确定性校验，以及胜出候选如何应用。 |
| 多 Agent 协作 | [dsh-collaboration](https://github.com/Socialist-Sister/dsh-collaboration) | 分发协议、模型队列、中继拓扑和多模态桥接权限。 |
| 后台 Agent | [dsh-background-agents](https://github.com/PerryLink/dsh-background-agents) | 子 Session 生命周期、工具范围、委托深度和中断行为。 |
| GitHub 情报 | [dsh-github-intelligence](https://github.com/zoahdev/dsh-github-intelligence) | 只读边界、覆盖的 Provider、缓存和限流处理。 |
| 上下文可见性 | [dsh-context](https://github.com/bowenliang123/dsh-context) | 单次请求 token 统计，以及压缩/注入事件是否可审计。 |
| MCP 发现 | [dsh-mcp-lens](https://github.com/labmimors/dsh-mcp-lens) | 延迟连接、精确 schema、远程目录信任和缓存上限。 |
| 记忆治理 | [dsh-memory-gate](https://github.com/GIT121995/dsh-memory-gate) | claim 权限规则、作用域隔离、注入上限和本地存储格式。 |
| 跨 Agent 导入 | [dsh-chat-import](https://github.com/Nwflower/dsh-chat-import) | 源会话处理、可恢复性和反向导出行为。 |
| 无 Key 搜索 | [dsh-free-web-search](https://github.com/delef/dsh-free-web-search) | fallback 顺序、页面抽取、缓存，以及哪些引擎会把数据发到外部。 |
| Todo 证据 | [dsh-todo-guard](https://github.com/a903067276-rgb/dsh-todo-guard) | 证据状态、重启恢复，以及 verified 与 claimed 的边界。 |
| 核心工具集 | [dsh-toolkit](https://github.com/dsh-external/dsh-toolkit) | 零依赖工具面和启用宽 profile 前的输入校验。 |
| 插件市场 | [dsh-plugin-hub](https://github.com/Noob-stupid/dsh-plugin-hub) | 索引来源、启停语义、回滚和包验证。 |
| 模型对比 | [dsh-dual-model-eval](https://github.com/huangdaxianer/dsh-dual-model-eval) | 在隔离 worktree 中运行同一编码任务，对比轨迹后再应用候选结果。 |
| 规划纪律 | [dsh-plans](https://github.com/Optim-Agent/dsh-plans) | 将仓库研究转为可追踪计划、批评回合和校验清单。 |
| Agent 团队界面 | [dsh-agent-team-gui](https://github.com/toolclub/dsh-agent-team-gui) | 在可视化控制面管理持久多模型小队和有界 DAG 运行。 |
| 上下文压缩 | [dsh-context-compressor](https://github.com/qwert702/dsh-context-compressor) | 为小模型压缩工具/历史载荷，同时保留可恢复任务流。 |
| Web 搜索路由 | [dsh-web-search-pro](https://github.com/anweat/dsh-web-search-pro) | 通过抽取、缓存和浏览器渲染路由多引擎与平台搜索。 |
| 跨 Agent 检查点 | [task-passport](https://github.com/dongsheng123132/task-passport) | 在多个编码 Agent 运行时之间传递机器可读任务状态。 |
| 持续演进 | [dsh-continual-evolve](https://github.com/ZK-Andy/dsh-continual-evolve) | 对 prompt、记忆、技能和子 Agent 规格进行可版本化、可回滚的改进。 |
| 知识包 | [dsh-kb-sieve](https://github.com/omdsh-dev/dsh-kb-sieve) | 从参考资料和 SQL 组装可审计知识库包。 |
| 社区目录镜像 | [fendouai/awesome-deepseek-harness](https://github.com/fendouai/awesome-deepseek-harness) | 提供中英双语目录、实时链接检查、机器可读注册表和每周趋势刷新。 |

这些条目是进一步阅读的入口，不代表建议全部同时安装。上下文、记忆、路由和后台 Agent 插件叠加后，可能改变 prompt 大小、成本和权限边界，而这些变化往往不会出现在市场描述里。

## 高关注社区项目

上游目录之外，还有一些目前关注度较高且公开可访问的社区项目，适合 Agent 构建者作为起点。热度只代表发现信号；仍需自行检查仓库、发布历史、权限和安装契约。

| 方向 | 资源 | 首先核验 |
|---|---|---|
| 社区插件目录 | [awesome-dsh-plugin](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin) | 条目是否最新、公开，以及是否兼容你的 DSH 版本。 |
| 上下文观测 | [dsh-context](https://github.com/bowenliang123/dsh-context) | token 统计、压缩事件和会话外保存的数据。 |
| 移动端访问 | [dsh-pocket](https://github.com/shaobeichen/dsh-pocket) | 从手机访问 DSH 时的局域网/公网暴露、认证和会话隐私。 |
| 视觉桥 | [modlens](https://github.com/liustack/modlens) | 图片上传路径、外部端点和结构化输出保证。 |
| Agent 团队 | [dsh-agent-teams](https://github.com/NanmiCoder/dsh-agent-teams) | 子 Agent 权限、共享工作区行为和取消语义。 |
| 视觉路由 | [dsh-vision-router](https://github.com/ysr666/dsh-vision-router) | provider 回退、密钥处理和图像回合的可审计性。 |
| 社区实践手册 | [DeepSeek Harness 橙皮书](https://github.com/alchaincyf/deepseek-harness-orange-book) | 哪些是固定版本实测，哪些只是非正式建议。 |
| 工作流组装 | [dsh-equip-engine](https://github.com/wuykjl/dsh-equip-engine) | 按协同、冲突、成本和信任信号选择插件。 |
| Skill 迁移 | [dsh-skill-mover](https://github.com/mjylfz/dsh-skill-mover) | 跨 Agent 发现、去重并可回滚地迁移 Skill。 |
| 研究输入 | [dsh-hacker-news](https://github.com/heartleo/hn-cli/tree/main/plugins/hacker-news) | 在把实时研究上下文加入 Agent 前检查订阅、线程和搜索边界。 |
| 会话回放 | [dsh-replay](https://github.com/zoahdev/dsh-replay) | 用于调试和复核的轨迹回放与差异比较。 |
| 桌面生命周期 | [dsh-tray](https://github.com/liulifu/dsh-tray) | 检查重启、多配置绑定、恢复快照和插件故障隔离。 |
| 本地优先桌面反馈 | [dsh-whale-musume](https://github.com/Sutera-Diffusus/dsh-whale-musume) | 检查 DSH Web 桌面宠物的工作状态反馈和遥测边界。 |
| Codex 风格 Web 界面 | [dsh-codex-ui](https://github.com/MichengAI/dsh-codex-ui) | 基于公开扩展点提供工作区、会话树、搜索和轮次导航。 |
| 嵌套 follow-up | [dsh-nested-followups](https://github.com/sluminositys/dsh-nested-followups) | 隔离侧问题 Session；检查祖先路径、工具 scope 和跨分支写入。 |

## 四条实用起步路径

不要从全量目录拼装 profile，先选择一条可观测、可回滚的小路径：

| 目标 | 从这里开始 | 只有在基线可观测后再加入 |
|---|---|---|
| 在同一编码任务上比较 Agent | [dsh-agent-arena](https://github.com/LeemanCheung/dsh-agent-arena) | [dsh-context](https://github.com/bowenliang123/dsh-context)，观察 token 和压缩证据。 |
| 运行受监督的多 Agent 团队 | [dsh-collaboration](https://github.com/Socialist-Sister/dsh-collaboration) | [dsh-background-agents](https://github.com/PerryLink/dsh-background-agents)，再加预算保护。 |
| 构建研究与记忆工作流 | [dsh-deep-research](https://github.com/dsh-external/dsh-deep-research) | [dsh-memory-gate](https://github.com/GIT121995/dsh-memory-gate) 和 [dsh-free-web-search](https://github.com/delef/dsh-free-web-search)，记录来源与成本。 |
| 运营受治理的生产 profile | [dsh-security-audit](https://github.com/dsh-external/dsh-security-audit) | [dsh-plugin-check](https://github.com/dsh-external/dsh-plugin-check)、[dsh-tool-schema](https://github.com/dsh-external/dsh-tool-schema)，并明确测试回滚。 |

每条路径都应记录 profile manifest、加载模块、网络目的地、token/成本行为和卸载结果。这样才能把目录实验变成可重复的 Agent runbook。

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
