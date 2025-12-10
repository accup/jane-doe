# アーキテクチャ設計

## システム概要

Slack Agent with Memoryは、会話履歴を永続化し、コンテキストを保持しながらSlack上で自然な対話を実現するシステムです。

## 設計原則

### 情報の分類

- **低周波情報**: 変化が少ない重要な情報（開発チャンネルの目的、アーキテクチャ、チーム構成など）
- **高周波情報**: 頻繁に変化する情報（エラーログ、直面している課題、タスク進捗など）

MVPでは両方の情報を同じように扱いますが、将来的には自動分類・要約機能を追加する予定です。

## 三層アーキテクチャ

```
┌─────────────────────────────────────────┐
│           Slack Platform                │
└────────────────┬────────────────────────┘
                 │ Events API
                 ▼
┌─────────────────────────────────────────┐
│         Slack App Layer                 │
│  - Events APIでメッセージ受信           │
│  - スレッド管理                         │
│  - メッセージのフォーマット             │
└────────────────┬────────────────────────┘
                 │ REST API
                 ▼
┌─────────────────────────────────────────┐
│      Main Agent Layer (Claude API)      │
│  - 応答生成                             │
│  - MCPツール呼び出し                    │
│  - コンテキスト統合                     │
└────────────────┬────────────────────────┘
                 │ MCP Protocol
                 ▼
┌─────────────────────────────────────────┐
│         MCP Server Layer                │
│  - 会話履歴の永続化                     │
│  - 会話の検索・取得                     │
│  - SQLiteデータベース管理               │
└─────────────────────────────────────────┘
```

## 各層の責務

### 1. Slack App Layer

**責務:**
- Slack Events APIからメッセージイベントを受信
- スレッドID、チャンネルID、ユーザーIDなどのSlack固有メタデータ管理
- Claude APIセッションの作成と管理
- MCPサーバーとの通信設定
- Slackへの応答送信

**技術スタック:**
- Node.js + TypeScript
- @slack/bolt (Slack App Framework)
- Anthropic SDK

**インターフェース:**
- Input: Slack Events API (Webhook)
- Output: Claude API (REST), MCP Server (stdio)

### 2. Main Agent Layer (Claude API)

**責務:**
- ユーザーメッセージの理解と応答生成
- 必要に応じてMCPツールを呼び出し
- 過去のコンテキストを統合した応答の生成

**MCPツールの使用パターン:**
```typescript
// 1. 過去の関連会話を検索
retrieve_conversations({
  keyword: "エラー",
  time_range: "last_week"
})

// 2. 現在の会話を保存
store_conversation({
  role: "user",
  content: "エラーが発生しました...",
  timestamp: "2025-12-10T12:00:00Z"
})
```

### 3. MCP Server Layer

**責務:**
- 会話データの永続化（SQLite）
- 会話の検索と取得
- Slack固有の概念を持たない汎用的なデータ層

**データスキーマ:**
```sql
CREATE TABLE conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role TEXT NOT NULL,           -- 'user' or 'assistant'
    content TEXT NOT NULL,         -- メッセージ内容
    timestamp TEXT NOT NULL,       -- ISO 8601形式
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_timestamp ON conversations(timestamp);
CREATE INDEX idx_role ON conversations(role);
```

**MCPツール定義:**

1. `store_conversation`
   - Input: `{ role: string, content: string, timestamp: string }`
   - Output: `{ success: boolean, id: number }`
   - 説明: 会話を保存

2. `retrieve_conversations`
   - Input: `{ keyword?: string, role?: string, start_time?: string, end_time?: string, limit?: number }`
   - Output: `{ conversations: Array<{id, role, content, timestamp}> }`
   - 説明: 条件に合う会話を検索

## データフロー

### メッセージ受信から応答まで

1. **Slackからメッセージ受信**
   ```
   Slack Events API → Slack App
   ```

2. **Claude APIセッション開始**
   ```
   Slack App → Claude API (with MCP server configuration)
   ```

3. **過去のコンテキスト取得**
   ```
   Claude (Main Agent) → MCP Server (retrieve_conversations)
   ```

4. **応答生成**
   ```
   Claude API processes context + current message
   ```

5. **会話保存**
   ```
   Claude (Main Agent) → MCP Server (store_conversation)
   ```

6. **Slackに応答**
   ```
   Claude API → Slack App → Slack
   ```

## セキュリティ考慮事項

### 認証・認可
- Slack: App Token、Bot Token使用
- Claude API: API Key使用
- 環境変数での機密情報管理

### データ保護
- SQLiteデータベースファイルのパーミッション設定
- 個人情報の扱いに注意（将来的にGDPR対応も検討）

## パフォーマンス考慮事項

### レイテンシ削減
- SQLiteインデックスの適切な設定
- MCPサーバーのローカル実行（stdio通信）
- 必要最小限のコンテキスト取得

### スケーラビリティ
- 並行処理対応（複数のSlackメッセージを同時処理）
- データベースの定期クリーンアップ（将来的に）

## 将来の拡張

### フェーズ2: 高度な情報管理
- サブエージェントによる情報分類
- 低周波/高周波の自動判別
- ベクトル検索（意味的類似性）

### フェーズ3: Claude Codeタスク委任
- コード生成・実行
- ファイルシステムアクセス
- GitHub連携

### フェーズ4: 最適化
- コンテキスト自動要約
- コスト最適化
- 不要データの自動削除

## 技術選定理由

### TypeScript
- 型安全性による開発効率向上
- Slack/Anthropic SDKの充実したサポート

### SQLite
- シンプルで軽量
- サーバーレス（ファイルベース）
- MVPに最適

### MCP (Model Context Protocol)
- Claude APIとの標準的な拡張方法
- ツール呼び出しの柔軟性
- 将来的な拡張性
