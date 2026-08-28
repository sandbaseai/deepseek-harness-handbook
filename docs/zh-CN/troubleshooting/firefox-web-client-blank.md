---
title: 诊断 Firefox 中 Web 客户端空白
locale: zh-CN
content_revision: 1
status: localized
verified_at: 2026-08-28
sources:
  - https://github.com/deepseek-ai/deepseek-harness/discussions/4919
---

# 诊断 Firefox 中 Web 客户端空白

如果 Chrome 能显示历史会话并发起对话，而 Firefox 只显示空白页面，先把它当作**客户端启动或浏览器兼容性边界**来诊断。在确认同一个服务能被其他浏览器访问前，不要重置 Session 目录或轮换模型凭据。

本文基于上游针对 `0.1.1-rc.2` 的 Firefox 报告，报告尚未证明唯一的 Firefox 根因，因此步骤以取证为主。

## 1. 先分类故障

记录以下四项观察结果：

| 现象 | 可能指向 |
|---|---|
| Chrome 能列出历史并开始对话 | 服务、profile 与 Session 数据大概率可访问。 |
| Firefox 在选择工作区前就空白 | 客户端启动、缓存资源或浏览器 API 边界更可疑。 |
| Firefox 能显示外壳但无法新建对话 | 检查首个失败的 API 请求和控制台异常。 |
| 两个浏览器都失败 | 转向服务、profile、provider 或持久化诊断。 |

## 2. 在不改数据的前提下收集 Firefox 证据

刷新前打开 Firefox 开发者工具：

1. 在“控制台”中保留日志并刷新一次，记录第一个异常，而不是最后一串连锁错误。
2. 在“网络”中开启“持久化日志”，刷新后筛选 `fetch`、`WebSocket` 以及返回 `4xx` 或 `5xx` 的请求。
3. 确认文档、JavaScript chunk 和样式请求都返回 `200`。chunk 或 service worker 不匹配可能让页面空白，但服务本身仍然健康。
4. 记录 Firefox 版本、DeepSeek Harness 版本、profile，以及页面使用的是 `http://localhost` 还是远程来源。

不要一开始就清空所有浏览器数据；这会破坏区分旧资源与运行时异常所需的证据。

## 3. 使用干净浏览器状态复测

用 Firefox 隐私窗口或新建 profile，并暂时禁用扩展。如果干净 profile 正常，再逐个启用扩展，观察存储或内容拦截错误。如果仍然空白，就将失败请求和控制台堆栈与 Chrome 对比。

如果页面使用 service worker，只注销该站点的 worker 后刷新。不要删除 Session 目录；浏览器存储和服务端 Session 持久化属于不同层。

## 4. 检查服务边界

确认 Chrome 与 Firefox 使用相同来源和端口，确认 Web UI 进程仍在监听并且直接请求页面或健康检查能成功。远程访问时，还要分别检查来源、代理、证书和 WebSocket 转发；页面能加载并不代表事件通道没有被拦截。

## 5. 用最小复现上报

上游报告至少应包含：DeepSeek Harness 与 Firefox 版本、来源是本地还是远程、profile、隐私窗口是否复现、第一个控制台异常、失败请求及状态、同一服务在 Chrome 中的结果。请隐藏 token、cookie、工作区路径和 Session 内容，并附上上游讨论链接。

## 相关指南

- [从 Client 插件启动失败中恢复](../../en/troubleshooting/web-client-plugin-boot-failure.md)
- [诊断 WebView MutationObserver CPU 循环](../../en/troubleshooting/webview-mutation-observer-loop.md)
- [运行 Web UI](../../en/getting-started/quickstart.md)

## 来源

- [上游 Firefox 报告 #4919](https://github.com/deepseek-ai/deepseek-harness/discussions/4919)
