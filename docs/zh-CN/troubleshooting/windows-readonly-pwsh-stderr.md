---
title: 诊断 Windows 只读 PowerShell 的 stderr 噪声
locale: zh-CN
source: docs/en/troubleshooting/windows-readonly-pwsh-stderr.md
source_revision: 1
status: reviewed
verified_at: 2026-08-28
sources:
  - https://github.com/deepseek-ai/deepseek-harness/discussions/4924
---

# 诊断 Windows 只读 PowerShell 的 stderr 噪声

当 DeepSeek Harness 的 Windows 只读模式中命令返回 `exit code 0`，却在 stderr 出现重复的 PowerShell `InvalidOperation` 记录时，使用本指南。这是沙箱启动代码与语言模式不匹配，不代表请求的命令失败。

## 分开记录三个通道

分别记录退出码、stdout、stderr 和沙箱模式。一个成功命令附带两条相同编码错误，与返回非零退出码的命令完全不同。

| 证据 | 含义 |
|---|---|
| `exit code = 0` 且 stdout 正确 | 请求的命令已经完成 |
| stderr 出现 `Cannot create type...` | 受限 PowerShell 前置代码尝试构造被禁止的类型 |
| 同一命令在 `workspace-write` 中 stderr 为空 | 噪声来自语言模式或前置代码，而非命令本身 |
| 子进程报告 `ConstrainedLanguage` | ACL 沙箱限制生效，不等于沙箱损坏 |

不要全局丢弃 stderr；先判断它来自命令还是 runtime 前置代码。

## 用无害探针复现

在 `read-only` 和 `workspace-write` profile 中分别只运行 `node --version` 等确定性命令。捕获确切 argv、退出码、stdout、stderr、PowerShell language mode 和 Harness 版本。不要使用写工作区或打印环境密钥的探针。

报告问题的典型证据形态是：

```text
read-only:        exit 0，stdout=v24.x，stderr=两条编码 InvalidOperation
workspace-write:  exit 0，stdout=v24.x，stderr=空
language mode:    read-only 子进程 = ConstrainedLanguage
```

这个对比能确定边界，但不能据此关闭 ACL 沙箱。

## 前置代码为何产生错误

`@deepseek-ai/dsh-pwsh-local` 会在每条命令前加入编码前置代码。受影响路径无条件构造 `System.Text.UTF8Encoding` 并设置控制台/输出编码。ConstrainedLanguage 只允许核心类型，因此命令开始前这些赋值就会失败，PowerShell 随后把前置代码诊断和命令自身输出放到同一个 stderr 中。

预期的安全属性是受限语言模式；狭窄的缺陷是把仅 FullLanguage 可用的编码操作放进了该模式。

## 安全排查和绕行

1. 将退出码和预期 stdout 视为命令结果，同时保留并分类 stderr。
2. 在干净的只读子进程和 workspace-write 子进程中对比同一个探针。
3. 如果任务把任意 stderr 都视为失败，可在 wrapper 中识别这组精确前置代码特征，但仍必须校验退出码和输出。
4. 不要为了消除噪声而把生产任务切换到 workspace-write。
5. 不要屏蔽全部 stderr 或直接删除前置代码，除非已有回归测试；真实命令错误必须继续可见。

## 修复与验收契约

稳健实现应只在确切的 `FullLanguage` 模式下设置编码。FullLanguage 保留 UTF-8 行为；受限模式保持宿主编码并跳过被禁止的调用。

只有真实 Windows ACL 测试同时证明以下事实，才接受修复：

- 子进程仍处于 `ConstrainedLanguage`；
- 读写能力边界保持原有行为；
- 成功的只读命令 stderr 为空；
- 真正失败的命令仍暴露自己的 stderr 和非零退出码。

还要运行 argv 专项测试和仓库记录的 typecheck/build gate。macOS 或 unrestricted PowerShell 测试不能证明 Windows ACL 契约。

## 来源

- [上游 Windows 只读 PowerShell 报告 #4924](https://github.com/deepseek-ai/deepseek-harness/discussions/4924)
- [参考修复与 Windows 回归测试](https://github.com/ArmyWas/deepseek-harness/commit/caec78de2042bb1afd5b9e5d7a455557a05c0ec3)
