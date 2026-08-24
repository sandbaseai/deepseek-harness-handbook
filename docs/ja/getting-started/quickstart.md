---
title: DeepSeek Harness クイックスタート
locale: ja
source: docs/en/getting-started/quickstart.md
source_revision: 1
content_revision: 1
status: draft
verified_at: 2026-08-14
---

# DeepSeek Harness クイックスタート：最初の有用な Agent 実行

この手順では公式 Web UI を起動し、モデルを接続し、最初のタスクを既知のワークスペースに制限し、Harness が正常に動作していることを確認するための動作を確認できる証拠を提供します。

> [!WARNING]
> DeepSeek Harness は developer preview です。最初のタスクは使い捨てのリポジトリで実行し、チャットに秘密情報を貼り付けず、承認リクエストを受け入れる前にすべてを確認してください。

## 1. Web UI を起動する

最新の Node.js をインストールし、Agent に検査させたいリポジトリのディレクトリでターミナルを開き、以下を実行します。

```sh
npx @deepseek-ai/dsh web
```

デフォルトのアドレスは `http://127.0.0.1:3080` です。ターミナルは開いたままにしてください。ブラウザが接続できない場合、ログは最初の確認箇所です。

## 2. モデルを設定する

**Settings → Models** を開き、プロバイダの API Key を追加して保存します。DeepSeek が最短ルートです。公式プロバイダガイドには他のプロバイダやカスタム OpenAI 互換エンドポイントも記載されています。

環境固有のキーに支出制限を設定してください。リポジトリにコミットしたり、バグレポートに含めたりしないでください。

## 3. ワークスペースを選択する

**Choose workspace** をクリックし、`dsh` を起動したディレクトリを追加して選択します。新しい UI は意図的にワークスペースを未設定にしています。ワークスペースを選択するまで composer は利用できません。

最初の実行では、小さなテストリポジトリを使用してください。アクティブな設定によっては、Agent はファイルの読み取りと編集、コマンドの実行、作業の委任、計画の維持ができます。

## 4. 境界付きタスクを実行する

セッションを開始し、以下を送信してください。

> Inspect this repository without changing files. Summarize its purpose, list its main packages, and cite the files that support each conclusion.

このプロンプトは Agent に明確な目標、明示的な書き込み禁止の境界、および検証可能な結果を与えます。

## 5. 実行を確認する

正常な最初の実行には、4つの信号がすべて含まれます。

- ブラウザがストリーミングレスポンスを受信していること
- 回答が選択したワークスペース内の実在ファイルを参照していること
- レスポンス完了後もセッションが表示されたままであること
- 書き込みやコマンドの承認が暗黙的に許可されていないこと

UI は読み込まれるがタスクが失敗する場合、変更を加える前にレイヤーを切り分けてください。

| 現象 | 最初に確認 |
|---|---|
| ブラウザが接続できない | ターミナルのプロセスと出力された URL |
| Composer が無効 | 選択したワークスペース |
| 認証 / プロバイダエラー | モデルルートと API Key |
| ツールが拒否された | アクティブな権限と承認ポリシー |
| 誤ったファイルが表示される | 選択したワークスペースと起動ディレクトリ |

## 実際の構成を確認する

Web UI はプロファイルであり、ランタイム全体ではありません。以下を実行して解決された Cordis ツリーを出力してください。

```sh
npx @deepseek-ai/dsh --profile web --dump-config
```

これが、マシンが実際に起動するバンドル、サービス、ツール、ポリシーレイヤーを確認する最速の方法です。

## ソースから実行する

アップストリームへの貢献やパッケージの検査時に使用します。

```sh
git clone https://github.com/deepseek-ai/deepseek-harness.git
cd deepseek-harness
pnpm install
pnpm run build
pnpm dsh web
```

パッケージマネージャのインストールはリポジトリからのコードを実行します。プロジェクトを確認し、使い捨て環境を使用し、再現可能な作業のためにアップストリームのリビジョンを固定してください。

## 次のステップ

- [Agent ランタイムを理解する](../../en/architecture/agent-runtime.md)
- [1回の完全なターンを追う](../../en/architecture/agent-lifecycle.md)
- [症状別トラブルシューティング](../../en/troubleshooting/README.md)

## 公式ソース

- [DeepSeek Harness README](https://github.com/deepseek-ai/deepseek-harness/blob/master/README.md)
- [公式 Web UI ガイド](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/guide/index.md)
- [公式モデルプロバイダガイド](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/guide/providers.md)
