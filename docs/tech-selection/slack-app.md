# Slack App 実装の技術選定

## 背景と目的

Jane Doe プロジェクトの Phase 1 では、Slack 上で Claude と対話できる最小構成のシステムを構築します。このドキュメントでは、Slack App 実装に使用する技術スタックを選定します。

## 選定基準

1. **統合の容易性**: Claude API および MCP サーバーとの統合が容易であること
2. **公式サポート**: Slack が公式にサポートするフレームワークであること
3. **学習コスト**: ドキュメントが充実しており、学習コストが低いこと
4. **実績**: 実際のプロダクションでの使用実績があること
5. **保守性**: 長期的に保守しやすい技術であること
6. **言語統一**: MCP サーバーと同じ言語で実装できること

## 候補技術の比較

### フレームワーク

#### Slack Bolt
- **対応言語**: JavaScript/TypeScript, Python, Java
- **公式サポート**: Slack 公式フレームワーク
- **特徴**:
  - Slack API の複雑な部分を抽象化
  - イベントハンドリングが直感的
  - 日本語ドキュメントが充実
  - 2024-2025年も活発に使用されている

#### Slack SDK（低レベル API）
- **対応言語**: 多数
- **特徴**:
  - より細かい制御が可能
  - 学習コストが高い
  - 定型的なコードが増える

### 実装言語

#### TypeScript/Node.js
- **メリット**:
  - MCP の公式 TypeScript SDK が存在
  - Slack Bolt for JavaScript が成熟している
  - 型安全性による開発効率の向上
  - Slack App と MCP サーバーを同じ言語で実装可能
- **デメリット**:
  - ランタイム環境の管理が必要

#### Python
- **メリット**:
  - MCP の公式 Python SDK が存在
  - Slack Bolt for Python が利用可能
  - AI/ML 関連ライブラリが豊富
- **デメリット**:
  - Slack App と MCP サーバーで言語が異なる可能性

## 選定結果

### 採用技術
- **フレームワーク**: Slack Bolt for JavaScript
- **言語**: TypeScript
- **ランタイム**: Node.js (LTS版)

## 採用理由

### 1. エコシステムの統一
TypeScript/Node.js を採用することで、以下のコンポーネントを同じ言語で実装できます：
- Slack App (Bolt for JavaScript)
- MCP サーバー (TypeScript SDK)
- Claude API 統合

これにより、開発環境の統一、コードの再利用、開発者の認知負荷軽減が実現できます。

### 2. MCP との親和性
MCP の公式 TypeScript SDK は以下の特徴があります：
- 型安全な開発体験
- 完全な仕様実装
- リソース、プロンプト、ツールの登録が容易

参考: [TypeScript SDK - Model Context Protocol](https://github.com/modelcontextprotocol/typescript-sdk)

### 3. Slack Bolt の成熟度
Slack Bolt for JavaScript は：
- Slack 公式の推奨フレームワーク
- 日本語ドキュメントが充実
- 2024-2025年も活発に使用されている実績

参考: [Bolt フレームワークを使って Slack Bot を作ろう | Slack](https://api.slack.com/lang/ja-jp/hello-world-bolt)

### 4. 実装事例の存在
Slack × Claude × MCP の統合事例が複数存在し、実装の参考にできます（参考資料セクション参照）

### 5. 型安全性による品質確保
TypeScript の型システムにより：
- コンパイル時のエラー検出
- IDE による強力な補完機能
- リファクタリングの安全性向上

これらは「確信を持った前進」という CLAUDE.md の原則に合致します。

## 次のステップ

1. Node.js 開発環境のセットアップ
2. Slack Bolt for JavaScript のプロジェクト初期化
3. 基本的な Slack App の動作確認
4. MCP サーバーとの統合テスト

## 参考資料

### 公式ドキュメント

技術選定と実装の第一情報源として参照。

#### Slack
- [Bolt フレームワークを使って Slack Bot を作ろう | Slack](https://api.slack.com/lang/ja-jp/hello-world-bolt) - 公式の入門ガイド（日本語）
- [Bolt for JavaScript interface and configuration reference | Slack Developer Docs](https://docs.slack.dev/tools/bolt-js/reference/) - API リファレンス

#### Model Context Protocol (MCP)
- [Model Context Protocol - Build an MCP server](https://modelcontextprotocol.io/docs/develop/build-server) - MCP サーバー開発の公式ガイド
- [TypeScript SDK - Model Context Protocol](https://github.com/modelcontextprotocol/typescript-sdk) - 公式 TypeScript SDK のリポジトリ

### チュートリアル・ガイド

公式ドキュメントを補完する学習リソース。

- [How to Build a Custom MCP Server with TypeScript – freeCodeCamp](https://www.freecodecamp.org/news/how-to-build-a-custom-mcp-server-with-typescript-a-handbook-for-developers/) - TypeScript での MCP サーバー構築の詳細なチュートリアル

### 実装事例

実際のプロダクション環境での実装例とベストプラクティス。

- [リモートMCPサーバーで実現するSlack×AI連携 - RAKSUL TechBlog](https://techblog.raksul.com/entry/2025/05/16/174604) - 企業での実装事例と設計判断

---

作成日: 2025-12-12
