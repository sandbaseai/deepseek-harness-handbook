---
title: DeepSeek Harness Agent のターンと親子ライフサイクル
locale: ja
source: docs/en/architecture/agent-lifecycle.md
source_revision: 4
status: reviewed
verified_at: 2026-08-28
verified_upstream: b150a551b8d465e31e418e1b2eaf5e79bbb7d28e
---

# 1 回の Agent ターンと親子ライフサイクル

**step** は 1 回のモデルリクエストと、そのリクエストが生成したツール呼び出しです。**turn** は複数の step を含むことがあり、ランタイムが処理すべき仕事を残していないときに終了します。`turn/*`、`step/*`、`user/message`、`assistant/*`、`tool/*` は永続ログであり、`agent/*` は実行中 Agent の制御用イベントです。

```text
入力 → inbox → driver → pre-step/コンテキスト → モデル
    → pre-execute/execute/post-execute → tool 結果
    → step/end → 次の step または turn/end
```

## 最後の永続イベントから切り分ける

| 最後のイベント | まず確認する境界 |
|---|---|
| `turn/start` がない | inbox の wakeup または Agent 作成 |
| `turn/start` はあるが `step/start` がない | pre-step の判定または起動失敗 |
| `step/start` 後に assistant 出力がない | Provider / リクエスト経路 |
| `tool/call` 後に結果がない | 承認、ポリシー、Provider、実行 |
| `step/end` 後に `turn/end` がない | queued input、continuation、停止 hook |

プロセスが生きていることだけでターンの進行を判断せず、最後の durable event、バージョン、Session ID、最初のエラーを保存してください。

## 親の dispose は独立した契約である

上流の [#4909](https://github.com/deepseek-ai/deepseek-harness/discussions/4909) は、親 Agent の dispose 後も continuable な子 Agent が service/factory scope に残る可能性を示しています。明示的な `drainChildren()`、`whenIdle()` を永遠に待つ子、親が消えた後に黙って戻る settlement callback は、所有権、cascade cleanup、hung-child 回収、settlement 配信という 4 つの隙間を作ります。

```text
親 dispose
  → 子の方針（cascade | handoff | reject）
  → 有界 drain / 強制回収
  → durable settlement disposition
```

最小の回帰 fixture は、未完了の子を開始して親を先に dispose し、子の正常終了と timeout の両方を検証します。孤児 activation が残らず、settlement が黙って失われず、親 Session に handoff・cancel・reclaim の結果が記録されることを確認します。コミュニティの参考パッチは、main ブランチがこの契約を実装済みである証拠ではありません。

## 前線探索を線形 driver に混ぜない

beam search、枝刈り、コスト予算は外部 controller が候補 Session lineage、score、幅/深さ/Token/時間予算、最終 disposition を管理します。可変な Agent オブジェクトを第三者の scorer に渡さず、候補 ID、state digest、score の版、安定した tie-break、selected/pruned/failed/cancelled を永続化してください。副作用のあるツールを使う候補は read-only またはシミュレーションに制限します。

## 検証チェックリスト

- 親 dispose が cascade、handoff、または明示的な reject になる。
- hung child に timeout / force-reclaim があり、`whenIdle()` を無限に待たない。
- settlement の delivered、handoff、cancelled、dropped が追跡できる。
- Session replay は durable event を読み、live Agent 状態を履歴にしない。
- ツール呼び出しは policy、approval、sandbox、telemetry の境界を通る。
- 親先 dispose、子の正常終了、timeout、重複 dispose をテストする。

## 出典

- [英語 canonical ガイド](../../en/architecture/agent-lifecycle.md)
- [公式 Agent lifecycle（rc.2）](https://github.com/deepseek-ai/deepseek-harness/blob/b150a551b8d465e31e418e1b2eaf5e79bbb7d28e/docs/agent-lifecycle.md)
- [ライフサイクル handoff と孤児 child の報告 #4909](https://github.com/deepseek-ai/deepseek-harness/discussions/4909)
