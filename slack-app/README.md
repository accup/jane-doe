# Slack Agent App

Claude AIと記憶機能を統合したSlack Bot

## 概要

このSlack Appは、Claude APIとMCPサーバーを連携させ、過去の会話を記憶しながらユーザーと対話します。

## 特徴

- **記憶機能**: 過去の会話を自動的に保存し、関連するコンテキストを参照
- **自然な対話**: Claude 3.5 Sonnetを使用した高品質な応答
- **Socket Mode**: ファイアウォールやポート設定不要
- **スレッド対応**: Slackスレッド内での会話をサポート

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. Slack Appの作成

1. [Slack API](https://api.slack.com/apps)にアクセス
2. "Create New App" → "From scratch"
3. App名とワークスペースを選択

### 3. Slack Appの設定

#### OAuth & Permissions
以下のBot Token Scopesを追加:
- `app_mentions:read` - メンションの読み取り
- `chat:write` - メッセージの送信
- `im:history` - DMの読み取り
- `im:write` - DMの送信

#### Event Subscriptions
Socket Modeを有効化し、以下のイベントをサブスクライブ:
- `app_mention` - Botへのメンション
- `message.im` - ダイレクトメッセージ
- `app_home_opened` - App Homeの表示

#### Socket Mode
1. Socket Modeを有効化
2. App Tokenを生成（`connections:write`スコープ）

### 4. 環境変数の設定

`.env.example`を`.env`にコピーして編集:

```bash
cp .env.example .env
```

`.env`に以下を設定:

```env
# Slack Configuration
SLACK_BOT_TOKEN=xoxb-your-bot-token-here
SLACK_APP_TOKEN=xapp-your-app-token-here
SLACK_SIGNING_SECRET=your-signing-secret-here

# Anthropic Configuration
ANTHROPIC_API_KEY=sk-ant-your-api-key-here

# MCP Server Configuration (デフォルト値でOK)
MCP_SERVER_PATH=../mcp-server/dist/index.js

# Server Configuration
PORT=3000
```

### 5. MCPサーバーのビルド

```bash
cd ../mcp-server
npm install
npm run build
cd ../slack-app
```

### 6. アプリの起動

```bash
# 開発モード（自動リロード）
npm run dev

# 本番モード
npm run build
npm start
```

## 使い方

### Slackでの対話

1. **メンションで話しかける**
   ```
   @YourBot こんにちは!
   ```

2. **ダイレクトメッセージ**
   - BotにDMを送信すると自動的に応答します

3. **スレッドでの会話**
   - スレッド内でメンションすると、そのスレッド内で応答します

### 記憶機能

Botは以下の情報を自動的に記憶します:
- ユーザーの発言
- Botの応答
- タイムスタンプ

過去の会話を参照して、コンテキストを保持しながら対話します。

## アーキテクチャ

```
Slack Platform
    ↓
Slack App (Socket Mode)
    ↓
Claude Agent (Anthropic API)
    ↓
MCP Client
    ↓
MCP Server (会話履歴管理)
    ↓
SQLite Database
```

## トラブルシューティング

### Botが応答しない

1. 環境変数が正しく設定されているか確認
2. MCPサーバーがビルドされているか確認
3. Slack AppのEvent Subscriptionsが有効か確認
4. ログを確認: `[Slack]`, `[Claude]`, `[MCP]`のタグを探す

### MCPサーバー接続エラー

```bash
# MCPサーバーのビルドを確認
cd ../mcp-server
npm run build

# パスを確認
ls ../mcp-server/dist/index.js
```

### Slackトークンエラー

1. Bot TokenとApp Tokenが正しいか確認
2. Tokenが期限切れになっていないか確認
3. ワークスペースにBotがインストールされているか確認

## 開発

### ディレクトリ構造

```
slack-app/
├── src/
│   ├── index.ts         # エントリーポイント
│   ├── slack.ts         # Slack Bot実装
│   ├── claude.ts        # Claude Agent実装
│   └── mcp-client.ts    # MCPクライアント
├── package.json
├── tsconfig.json
└── .env
```

### ローカル開発

```bash
# 自動リロード付きで起動
npm run dev
```

### デバッグ

ログレベルを調整:

```typescript
// src/slack.ts
logLevel: LogLevel.DEBUG, // INFO → DEBUGに変更
```

## デプロイ

### Docker（オプション）

Dockerfileを作成してコンテナ化することも可能です。

### クラウド

以下のプラットフォームで実行可能:
- Heroku
- Railway
- Fly.io
- AWS (ECS, Lambda)
- Google Cloud Run

Socket Modeを使用しているため、公開URLは不要です。

## ライセンス

Apache-2.0
