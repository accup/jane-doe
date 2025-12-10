# Slack Agent with Memory

Slack上での自然な対話を実現するための、記憶機能を持つAIエージェントシステム

## 概要

このプロジェクトは、低周波情報（変化が少ない重要な情報）と高周波情報（直面している課題やエラーログなど）を使い分けられる記憶機能を持つSlack Botを提供します。

## アーキテクチャ

三層構造で構成されています：

1. **Slack App層** - Slack Events APIでメッセージを受信し、スレッド管理を行う
2. **メインエージェント層** - Claude APIを使用して応答を生成
3. **MCPサーバー層** - 会話履歴の永続化と検索を担当

詳細は [docs/architecture.md](./docs/architecture.md) を参照してください。

## プロジェクト構成

- `mcp-server/` - 会話履歴管理用のMCPサーバー（SQLiteベース）
- `slack-app/` - Slack App本体（Events API + Claude API連携）
- `docs/` - アーキテクチャと設計ドキュメント

## セットアップ

### 前提条件

- Node.js 18+
- Slack Workspace（管理者権限）
- Anthropic API Key

### MCP サーバーのセットアップ

```bash
cd mcp-server
npm install
npm run build
```

### Slack App のセットアップ

```bash
cd slack-app
npm install
cp .env.example .env
# .envファイルに必要な環境変数を設定
npm run dev
```

詳細なセットアップ手順は各ディレクトリのREADMEを参照してください。

## 機能要件（MVP）

### 基本機能
- Slackメッセージの受信と応答
- Claude APIを使用した新しいセッションの開始
- MCPサーバーと連携した過去の会話履歴の参照

### コンテキスト管理
- 会話情報の永続的保存
- セッション間でのコンテキスト維持
- フラットな構造での会話履歴管理

### データストレージ
- SQLiteを使用した会話データの永続化
- ユーザー発言、Claude応答、タイムスタンプの保存

## ライセンス

Apache-2.0
