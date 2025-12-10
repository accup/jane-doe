# セットアップガイド

## 前提条件

以下のソフトウェアがインストールされている必要があります:

- Node.js 18以上
- npm または yarn
- Git

以下のアカウントが必要です:

- Slackワークスペース（管理者権限）
- Anthropic API Key

## ステップ1: リポジトリのクローン

```bash
git clone <repository-url>
cd jane-doe
```

## ステップ2: MCPサーバーのセットアップ

```bash
cd mcp-server
npm install
npm run build
cd ..
```

### 動作確認

MCPサーバーが正しくビルドされたか確認:

```bash
ls mcp-server/dist/index.js
```

このファイルが存在すればOKです。

## ステップ3: Slack Appの作成

### 3.1 Slack Appの新規作成

1. https://api.slack.com/apps にアクセス
2. "Create New App"をクリック
3. "From scratch"を選択
4. App名を入力（例: "Memory Agent"）
5. 開発するワークスペースを選択
6. "Create App"をクリック

### 3.2 OAuth & Permissions設定

1. サイドバーから"OAuth & Permissions"を選択
2. "Scopes" > "Bot Token Scopes"セクションまでスクロール
3. 以下のスコープを追加:
   - `app_mentions:read`
   - `chat:write`
   - `im:history`
   - `im:write`

### 3.3 Event Subscriptions設定

1. サイドバーから"Event Subscriptions"を選択
2. "Enable Events"をオンにする
3. "Subscribe to bot events"セクションで以下を追加:
   - `app_mention`
   - `message.im`
   - `app_home_opened`
4. "Save Changes"をクリック

### 3.4 Socket Mode設定

1. サイドバーから"Socket Mode"を選択
2. "Enable Socket Mode"をオンにする
3. App Token名を入力（例: "socket-token"）
4. Scopeは`connections:write`を選択
5. "Generate"をクリック
6. 生成されたトークン（`xapp-...`）をコピー

### 3.5 App Homeの設定（オプション）

1. サイドバーから"App Home"を選択
2. "Show Tabs" > "Home Tab"をオンにする

### 3.6 ワークスペースへのインストール

1. サイドバーから"Install App"を選択
2. "Install to Workspace"をクリック
3. 権限を確認して"Allow"をクリック
4. Bot User OAuth Token（`xoxb-...`）をコピー

### 3.7 Signing Secretの取得

1. サイドバーから"Basic Information"を選択
2. "App Credentials"セクションを探す
3. "Signing Secret"の"Show"をクリック
4. 表示されたシークレットをコピー

## ステップ4: Anthropic API Keyの取得

1. https://console.anthropic.com/ にアクセス
2. ログインまたはサインアップ
3. "API Keys"セクションに移動
4. "Create Key"をクリック
5. 生成されたAPI Key（`sk-ant-...`）をコピー

## ステップ5: Slack Appの環境変数設定

```bash
cd slack-app
cp .env.example .env
```

`.env`ファイルを編集:

```env
# Slack Configuration
SLACK_BOT_TOKEN=xoxb-XXXXXXXXXX-XXXXXXXXXX-XXXXXXXXXXXXXXXXXXXXXXXX
SLACK_APP_TOKEN=xapp-X-XXXXXXXXXXX-XXXXXXXXXXXXX-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
SLACK_SIGNING_SECRET=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Anthropic Configuration
ANTHROPIC_API_KEY=sk-ant-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# MCP Server Configuration
MCP_SERVER_PATH=../mcp-server/dist/index.js

# Server Configuration
PORT=3000
```

各トークンを上記で取得した値に置き換えてください。

## ステップ6: Slack Appの依存関係インストール

```bash
npm install
```

## ステップ7: アプリの起動

```bash
npm run dev
```

以下のようなログが表示されれば成功です:

```
[App] Starting Slack Agent with Memory...
[App] Initializing MCP client...
[MCP] Connecting to MCP server: ../mcp-server/dist/index.js
[MCP] Connected successfully
[App] Available MCP tools: store_conversation, retrieve_conversations, get_stats
[App] Initializing Claude agent...
[App] Initializing Slack bot...
[Slack] ⚡️ Bolt app is running on port 3000!
[App] ✅ All systems running!
```

## ステップ8: 動作確認

### Slackワークスペースでテスト

1. Slackワークスペースを開く
2. 任意のチャンネルにBotを追加:
   - チャンネルの詳細を開く
   - "Integrations"タブ
   - "Add apps"をクリック
   - 作成したAppを追加
3. チャンネルでBotにメンション:
   ```
   @Memory Agent こんにちは!
   ```
4. Botが応答すれば成功!

### ダイレクトメッセージでテスト

1. Botとのダイレクトメッセージを開く
2. メッセージを送信
3. Botが応答すれば成功!

## トラブルシューティング

### "MCP client not connected"エラー

**原因**: MCPサーバーが起動していないか、パスが間違っている

**解決策**:
```bash
cd mcp-server
npm run build
cd ../slack-app

# .envのMCP_SERVER_PATHを確認
cat .env | grep MCP_SERVER_PATH
```

### "Missing required environment variable"エラー

**原因**: 環境変数が設定されていない

**解決策**:
```bash
# .envファイルを確認
cat .env

# すべての必要な変数が設定されているか確認
```

### Botが応答しない

**原因**: Event Subscriptionsが正しく設定されていない

**解決策**:
1. Slack App設定ページの"Event Subscriptions"を確認
2. 必要なイベント(`app_mention`, `message.im`)が追加されているか確認
3. Appを再インストール

### "invalid_auth"エラー

**原因**: トークンが無効または期限切れ

**解決策**:
1. Slack App設定ページでトークンを再生成
2. `.env`ファイルを更新
3. アプリを再起動

## 次のステップ

- [アーキテクチャ設計](./architecture.md)を読む
- [将来の拡張計画](./future-enhancements.md)を確認する
- カスタマイズして独自の機能を追加する

## 本番環境へのデプロイ

開発環境で動作確認ができたら、以下のプラットフォームへのデプロイを検討できます:

- **Heroku**: 簡単なデプロイ、無料枠あり
- **Railway**: モダンなプラットフォーム、良好な開発者体験
- **Fly.io**: グローバル展開が容易
- **AWS**: EC2、ECS、またはLambda
- **Google Cloud**: Cloud Run推奨

Socket Modeを使用しているため、公開URLの設定は不要です。環境変数を適切に設定するだけでデプロイできます。
