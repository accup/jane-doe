# Slack Agent Memory - MCP Server

会話履歴を永続化し、検索機能を提供するMCPサーバー

## 概要

このMCPサーバーは、Slack Agent用の会話記憶機能を提供します。SQLiteデータベースを使用して、ユーザーとアシスタントの会話を保存し、後から検索できるようにします。

## 特徴

- **シンプルなデータモデル**: ユーザー発言、アシスタント応答、タイムスタンプのみを保存
- **フラットな構造**: Slack固有の概念（スレッド、チャンネル）に依存しない汎用的な設計
- **高速検索**: SQLiteインデックスによる効率的なクエリ
- **stdio通信**: MCPプロトコルに準拠したstdio通信

## インストール

```bash
npm install
npm run build
```

## 使用方法

### スタンドアロン実行

```bash
npm start
```

### Claude Desktop から使用

`claude_desktop_config.json` に以下を追加:

```json
{
  "mcpServers": {
    "slack-agent-memory": {
      "command": "node",
      "args": ["/path/to/mcp-server/dist/index.js"]
    }
  }
}
```

## MCPツール

### 1. store_conversation

会話メッセージを保存します。

**パラメータ:**
```json
{
  "role": "user" | "assistant",
  "content": "メッセージ内容",
  "timestamp": "2025-12-10T12:00:00Z"
}
```

**レスポンス:**
```json
{
  "success": true,
  "id": 123,
  "message": "Conversation stored successfully"
}
```

### 2. retrieve_conversations

過去の会話を検索します。すべてのパラメータはオプションです。

**パラメータ:**
```json
{
  "keyword": "エラー",
  "role": "user",
  "start_time": "2025-12-01T00:00:00Z",
  "end_time": "2025-12-10T23:59:59Z",
  "limit": 10
}
```

**レスポンス:**
```json
{
  "success": true,
  "count": 5,
  "conversations": [
    {
      "id": 123,
      "role": "user",
      "content": "エラーが発生しました",
      "timestamp": "2025-12-10T12:00:00Z",
      "created_at": "2025-12-10T12:00:01Z"
    }
  ]
}
```

### 3. get_stats

会話統計情報を取得します。

**パラメータ:** なし

**レスポンス:**
```json
{
  "success": true,
  "stats": {
    "total": 1000,
    "userMessages": 500,
    "assistantMessages": 500,
    "oldestTimestamp": "2025-11-01T00:00:00Z",
    "newestTimestamp": "2025-12-10T12:00:00Z"
  }
}
```

## データベーススキーマ

```sql
CREATE TABLE conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_timestamp ON conversations(timestamp);
CREATE INDEX idx_role ON conversations(role);
CREATE INDEX idx_created_at ON conversations(created_at);
```

## 開発

### ビルド

```bash
npm run build
```

### ウォッチモード

```bash
npm run dev
```

## データベース管理

データベースファイルは `db/conversations.db` に保存されます。

### バックアップ

```bash
cp db/conversations.db db/conversations.backup.db
```

### リセット

```bash
rm db/conversations.db
# 次回起動時に自動的に再作成されます
```

## ライセンス

Apache-2.0
