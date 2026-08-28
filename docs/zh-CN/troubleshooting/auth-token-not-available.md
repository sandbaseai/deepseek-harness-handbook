---
title: 诊断无法获取或输入认证 Token
locale: zh-CN
content_revision: 1
status: localized
verified_at: 2026-08-28
sources:
  - https://github.com/deepseek-ai/deepseek-harness/discussions/4918
---

# 诊断无法获取或输入认证 Token

alpha 版本可能在两个不同位置失败：安全认证流程没有产生 token，或扩展/UI 不接受已经存在的 token。必须把它们当成两个契约来排查。不要把真实凭据粘贴到 issue、截图、Shell 历史或 Session 日志中。

## 区分获取与输入

| 现象 | 首先检查的边界 |
|---|---|
| 安全认证流程没有返回 token | 认证请求、回调、来源或 provider 响应。 |
| token 存在但输入框拒绝 | UI 字段状态、校验、存储或扩展桥接。 |
| 登录成功但下一请求未授权 | token 作用域、所选 provider、过期时间或出站 header 映射。 |
| Web 与扩展结果不一致 | 对比来源以及存储/桥接所有权，不要随意复制密钥。 |

上游针对 `0.1.2-alpha.1` 的报告同时提到“获取”和“输入”，因此仅标记为“认证失败”不足以定位问题。

## 保留脱敏证据

记录版本、profile、来源和失败动作。在开发者工具中查看首个失败请求及状态，但分享前必须删除 `Authorization`、cookie、查询参数凭据和响应体。`401` 只能证明请求被拒绝，不能证明 token 是缺失、过期、作用域错误还是被桥接层剥离。

## 获取失败时

确认认证流程使用预期来源和端口；检查回调或弹窗是否被拦截、重定向或返回非 2xx；对比请求方法、回调 URL 与 provider 路由；用干净 profile 复测以排除旧存储或扩展干扰；在保留状态码、重定向链和首个控制台异常前，不要先轮换凭据。

## 输入失败时

只使用一次已脱敏的占位值判断输入框是否接受内容。如果输入框禁用，立即检查 UI 状态和扩展桥接，不要反复粘贴真实密钥。提交成功但存储失败时，核对所选 profile 与凭据存储权限，同时不要打印已保存的值。

## 相关指南

- [模型 Provider 配置](../../en/getting-started/model-providers.md)
- [避免意外产生 DeepSeek API 费用](../../en/security/prevent-unexpected-deepseek-api-charges.md)
- [Firefox Web 客户端空白](firefox-web-client-blank.md)

## 来源

- [上游 alpha.1 认证报告 #4918](https://github.com/deepseek-ai/deepseek-harness/discussions/4918)
