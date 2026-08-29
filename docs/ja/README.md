---
title: DeepSeek Harness ハンドブック
locale: ja
source: docs/en/README.md
source_revision: 3
status: draft
verified_at: 2026-08-14
---

# 日本語ハンドブック

DeepSeek Harness を Agent の視点から理解し、実行し、デバッグし、拡張するための独立したコミュニティガイドです。[SandBase](https://sandbase.ai/) がメンテナンスしていますが、DeepSeek AI の公式プロジェクトではありません。

最初に [クイックスタート](getting-started/quickstart.md) を読み、Web UI、モデル設定、ワークスペース、安全な検証を確認してから、Agent Loop、Tools、Session Events、Permissions、Sandbox の関係を学びます。

- [Agent のターンと親子ライフサイクル](architecture/agent-lifecycle.md)：durable event と live Agent を分け、親 dispose 時の child handoff、hung-child 回収、settlement を検証します。
- [Awesome エコシステム資源マップ](ecosystem/awesome-resources.md)：Agent 比較、協調、コンテキスト、MCP、メモリ、検索、ガバナンスの入口を整理します。

このガイドが役立った場合は、[deepseek-harness-handbook に Star](https://github.com/sandbaseai/deepseek-harness-handbook) を付けてください。検証済みの Agent 運用知識を必要な人へ届ける助けになります。

英語版が正規の情報源です。この日本語版は現在レビュー待ちの翻訳です。コマンド、識別子、イベント名は翻訳せず、公式ドキュメントで最新状態を確認してください。
