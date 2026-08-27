---
title: 排查自定义 Provider 与内置 Catalog 的标识冲突
locale: zh-CN
source: docs/en/troubleshooting/custom-provider-catalog-collision.md
source_revision: 1
status: draft
verified_at: 2026-08-27
---

# 自定义 OpenAI 兼容 Provider 为什么会请求 `/messages`

> 本页是机器辅助的简体中文草稿，等待流利读者复核。若中文表述与[英文 canonical 原文](../../en/troubleshooting/custom-provider-catalog-collision.md)存在差异，以英文原文及其链接的上游源码为准。

适用现象：你已经给自定义 Provider 配置了 OpenAI 兼容的 `baseURL` 和模型，但实际请求却是 `POST /v1/messages`，而不是 `POST /v1/chat/completions`，最终返回 404。

官方报告 #4759 使用 `minimax` 作为 Provider ID，省略了 `api`。在固定的 rc.2 源码 `b150a55` 中，这会触发确定性的 Catalog 复用，并不是端点随机回退。

## Provider ID 是可执行配置

`llm-pi-ai` 把 `providers` 字典的 key 当作路由身份。`buildProvider()` 会用同一个 ID 查询已安装的 pi-ai Catalog：

```ts
const catalog = catalogProvider(spec.provider)
if (catalog !== undefined && spec.api === undefined) {
  return reuseCatalogProvider(catalog, spec)
}
```

复用 Catalog 时，模型级 `baseUrl` 可以被覆盖，但 `stream()` 与 `streamSimple()` 仍委托给内置 Catalog Provider。因此，端点与协议必须分开判断：改了 `baseURL`，不等于改了请求协议。

| Provider ID | 是否显式配置 `api` | 构造结果 | 协议归属 |
|---|---|---|---|
| Catalog 中不存在 | 否 | 配置不可服务，拒绝加载 | 无 |
| Catalog 中不存在 | 是 | 新建自定义 Provider | 显式协议 |
| Catalog 中存在 | 否 | 复用 Catalog Provider | 内置 Catalog |
| Catalog 中存在 | 是 | 新建自定义 Provider | 显式协议 |

## 用显式协议恢复

如果目标确实是 OpenAI Chat Completions 接口，应把路由身份、协议和端点都写清楚：

```yaml
llm-pi-ai:
  providers:
    minimax-openai-cn:
      displayName: MiniMax OpenAI CN
      apiKeyEnv: MINIMAX_API_KEY
      api: openai-completions
      baseURL: https://api.minimax.cn/v1
      models:
        - id: MiniMax-M3
```

优先使用应用自有、不会碰撞的 ID，例如 `minimax-openai-cn`。这样 Session、默认模型、凭据引用、日志与回滚都能明确区分。如果必须沿用 Catalog ID，显式写入受支持的 `api` 也会强制走自定义 Provider 构造路径，但必须回归验证被替换的 Catalog 能力。

不要把真实密钥直接写进 YAML。`apiKeyEnv` 是凭据引用；密钥应位于启动进程环境或 Models 凭据流程中。

固定版本支持三个显式协议：`openai-completions`、`openai-responses` 和 `anthropic-messages`。不要根据厂商名称或 URL 猜协议，应验证你获准使用的真实端点契约。

## 在不泄露凭据的情况下证明路由

新建一个 Session，记录以下脱敏证据：

```text
DSH 版本与源码提交：
配置归属与 Provider 字典 key：
模型 ID：
api：显式值或 <省略>：
脱敏后的 baseURL 域名与路径前缀：
HTTP method 与最终 pathname：
首个响应状态与错误类型：
新 Session 结果：
回滚结果：
```

| 实际请求 | 说明 |
|---|---|
| `POST .../chat/completions` | OpenAI Completions 实现负责派发 |
| `POST .../responses` | OpenAI Responses 实现负责派发 |
| `POST .../messages` | Anthropic Messages 或使用该协议的 Catalog Provider 负责派发 |
| 未发请求并报告 `needs an api` | 非 Catalog 自定义路由缺少协议 |
| 未发请求并报告协议不受支持 | `api` 不在当前版本的协议表中 |

`/messages` 上的 404 是协议/路径证据，不是 API Key 证据。只有在路径正确后出现 401/403，才应进入凭据、权限或网关策略分支。

## 不要为修复一次碰撞而关闭全部 Catalog 复用

Catalog 复用用于保留原生认证发现、兼容性差异、实现状态，以及通用配置无法重建的协议。更稳妥的上游验收条件是：

1. Catalog ID 且省略 `api` 时保持向后兼容；
2. 显式受支持的 `api` 必须选择对应协议；
3. Catalog ID、修改后的 `baseURL` 与省略的 `api` 同时出现时，配置界面给出清晰警告；
4. 保存前展示将继承的协议；
5. 测试断言最终请求路径，而不只检查 Provider ID 与模型列表；
6. 新 Session 证明新路由，旧 Session 的持久 Provider/Model 身份不被改写；
7. 所有日志继续隐藏密钥。

不能把所有 `baseURL` 覆盖都静默解释成 OpenAI 兼容接口；同协议网关也可能合法复用 Catalog Provider。

## 安全回滚

1. 保存失败请求的脱敏证据。
2. 在隔离配置副本中停用自定义 Profile。
3. 恢复已知可用的 Catalog-only 路由，或恢复原来的独立自定义 ID。
4. 重载后验证有效 Provider 目录。
5. 新建 Session，证明最终请求路径。
6. 保留旧 Session 供审计，不改写它记录的 Provider 身份。

## 主要证据

- [官方自定义 Provider 冲突报告 #4759](https://github.com/deepseek-ai/deepseek-harness/discussions/4759)
- [rc.2 Provider 构造与 Catalog 复用](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/llm/llm-pi-ai/src/provider.ts)
- [rc.2 Provider Profile 解析](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/packages/llm/llm-pi-ai/src/config.ts)
- [英文 canonical 原文](../../en/troubleshooting/custom-provider-catalog-collision.md)
