---
title: Awesome DeepSeek Harness エコシステム資源マップ
locale: ja
source: docs/en/ecosystem/awesome-resources.md
source_revision: 14
status: reviewed
verified_at: 2026-08-28
---

# 能力別に選ぶ DeepSeek Harness 資源

[Awesome DeepSeek Harness](https://github.com/0xsline/awesome-deepseek-harness) は、DSH のプラグイン、ツール、運用資源を集めた公開カタログです。このページは全件の複製ではなく、Agent の設計・検証に役立つ代表例を能力別に整理したものです。

## Agent ワークフロー向けの代表例

| 分野 | 資源 | 最初に確認すること |
|---|---|---|
| Agent 比較 | [dsh-agent-arena](https://github.com/LeemanCheung/dsh-agent-arena) | worktree の分離と決定的な検証。 |
| マルチ Agent | [dsh-collaboration](https://github.com/Socialist-Sister/dsh-collaboration) | dispatch protocol、モデル roster、権限。 |
| 背景 Agent | [dsh-background-agents](https://github.com/PerryLink/dsh-background-agents) | 子 Session の寿命、scope、停止。 |
| コンテキスト | [dsh-context](https://github.com/bowenliang123/dsh-context) | token 計測と圧縮イベントの証跡。 |
| MCP 検索 | [dsh-mcp-lens](https://github.com/labmimors/dsh-mcp-lens) | lazy 接続、schema、キャッシュ上限。 |
| メモリ統制 | [dsh-memory-gate](https://github.com/GIT121995/dsh-memory-gate) | claim の権限、scope 分離、注入上限。 |
| Web 検索 | [dsh-free-web-search](https://github.com/delef/dsh-free-web-search) | fallback 順序、外部送信、キャッシュ。 |
| 本番ガバナンス | [dsh-security-audit](https://github.com/dsh-external/dsh-security-audit) | provenance、network、redaction、rollback。 |
| Codex 風 Web UI | [dsh-codex-ui](https://github.com/MichengAI/dsh-codex-ui) | 公開 extension point による workspace、Session tree、検索、turn ナビゲーション。 |
| Nested follow-ups | [dsh-nested-followups](https://github.com/sluminositys/dsh-nested-followups) | 隔離された子 Session。祖先、tool scope、枝間書き込みを確認。 |

## 追加のエージェント向けリソース

上流カタログから、モデル比較の [dsh-dual-model-eval](https://github.com/huangdaxianer/dsh-dual-model-eval)、計画の [dsh-plans](https://github.com/Optim-Agent/dsh-plans)、チーム実行の [dsh-agent-team-gui](https://github.com/toolclub/dsh-agent-team-gui)、コンテキスト圧縮の [dsh-context-compressor](https://github.com/qwert702/dsh-context-compressor)、Web 検索の [dsh-web-search-pro](https://github.com/anweat/dsh-web-search-pro)、チェックポイント共有の [task-passport](https://github.com/dongsheng123132/task-passport)、継続改善の [dsh-continual-evolve](https://github.com/ZK-Andy/dsh-continual-evolve)、知識パッケージの [dsh-kb-sieve](https://github.com/omdsh-dev/dsh-kb-sieve)、中英バイリンガルのコミュニティ目录 [fendouai/awesome-deepseek-harness](https://github.com/fendouai/awesome-deepseek-harness) を追加しました。導入前に各リポジトリの権限、互換性、ロールバック手順を確認してください。

## 四つの安全な開始経路

比較は `dsh-agent-arena`、監督付きチームは `dsh-collaboration`、研究と記憶は `dsh-deep-research` + `dsh-memory-gate`、本番統制は `dsh-security-audit` から始めます。最初から全カタログを有効にせず、manifest、ロード済み module、network、token/cost、削除結果を記録してください。

一覧への掲載は安全性・互換性・保守の保証ではありません。実 profile へ入れる前に README、license、manifest、install script、最近の変更を読み、コピーした profile で無害な probe と rollback を行います。

## 注目度の高いコミュニティプロジェクト

以下は公開され、現在コミュニティからの発見シグナルが強いプロジェクトです。人気は安全性や互換性の保証ではないため、権限、インストール契約、リリース履歴を確認してください。

| 分野 | リソース | 最初に確認すること |
|---|---|---|
| プラグイン一覧 | [awesome-dsh-plugin](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin) | 各項目の公開状態と DSH バージョン。 |
| コンテキスト可観測性 | [dsh-context](https://github.com/bowenliang123/dsh-context) | token 計測、圧縮イベント、セッション外データ。 |
| ビジョンブリッジ | [modlens](https://github.com/liustack/modlens) | 画像経路、外部送信、構造化出力。 |
| Agent チーム | [dsh-agent-teams](https://github.com/NanmiCoder/dsh-agent-teams) | 子 Agent の権限、共有 workspace、停止処理。 |
| モバイルアクセス | [dsh-pocket](https://github.com/shaobeichen/dsh-pocket) | LAN/公開アクセスと認証境界。 |
| 実践ガイド | [DeepSeek Harness Orange Book](https://github.com/alchaincyf/deepseek-harness-orange-book) | 固定版の実測と一般的な助言の区別。 |

## 出典

- [Awesome DeepSeek Harness README](https://github.com/0xsline/awesome-deepseek-harness/blob/main/README.md)
- [Awesome DeepSeek Harness catalog](https://github.com/0xsline/awesome-deepseek-harness/blob/main/CATALOG.md)
- [Community plugin audit guide](../../en/security/community-plugin-audit.md)
