import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface Conversation {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  created_at: string;
}

export interface StoreConversationParams {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface RetrieveConversationsParams {
  keyword?: string;
  role?: 'user' | 'assistant';
  start_time?: string;
  end_time?: string;
  limit?: number;
}

export class ConversationDatabase {
  private db: Database.Database;

  constructor(dbPath?: string) {
    const defaultPath = path.join(__dirname, '..', 'db', 'conversations.db');
    this.db = new Database(dbPath || defaultPath);
    this.initialize();
  }

  private initialize(): void {
    // Create conversations table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS conversations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
        content TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes for better query performance
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_timestamp ON conversations(timestamp);
      CREATE INDEX IF NOT EXISTS idx_role ON conversations(role);
      CREATE INDEX IF NOT EXISTS idx_created_at ON conversations(created_at);
    `);
  }

  /**
   * Store a conversation message
   */
  storeConversation(params: StoreConversationParams): { success: boolean; id: number } {
    const stmt = this.db.prepare(`
      INSERT INTO conversations (role, content, timestamp)
      VALUES (?, ?, ?)
    `);

    const result = stmt.run(params.role, params.content, params.timestamp);

    return {
      success: true,
      id: Number(result.lastInsertRowid),
    };
  }

  /**
   * Retrieve conversations based on search criteria
   */
  retrieveConversations(params: RetrieveConversationsParams = {}): Conversation[] {
    let query = 'SELECT * FROM conversations WHERE 1=1';
    const queryParams: any[] = [];

    // Add keyword filter (search in content)
    if (params.keyword) {
      query += ' AND content LIKE ?';
      queryParams.push(`%${params.keyword}%`);
    }

    // Add role filter
    if (params.role) {
      query += ' AND role = ?';
      queryParams.push(params.role);
    }

    // Add time range filters
    if (params.start_time) {
      query += ' AND timestamp >= ?';
      queryParams.push(params.start_time);
    }

    if (params.end_time) {
      query += ' AND timestamp <= ?';
      queryParams.push(params.end_time);
    }

    // Order by timestamp (most recent first)
    query += ' ORDER BY timestamp DESC';

    // Add limit
    if (params.limit && params.limit > 0) {
      query += ' LIMIT ?';
      queryParams.push(params.limit);
    }

    const stmt = this.db.prepare(query);
    return stmt.all(...queryParams) as Conversation[];
  }

  /**
   * Get conversation statistics
   */
  getStats(): {
    total: number;
    userMessages: number;
    assistantMessages: number;
    oldestTimestamp: string | null;
    newestTimestamp: string | null;
  } {
    const total = this.db.prepare('SELECT COUNT(*) as count FROM conversations').get() as { count: number };
    const userMessages = this.db.prepare("SELECT COUNT(*) as count FROM conversations WHERE role = 'user'").get() as { count: number };
    const assistantMessages = this.db.prepare("SELECT COUNT(*) as count FROM conversations WHERE role = 'assistant'").get() as { count: number };
    const oldest = this.db.prepare('SELECT MIN(timestamp) as timestamp FROM conversations').get() as { timestamp: string | null };
    const newest = this.db.prepare('SELECT MAX(timestamp) as timestamp FROM conversations').get() as { timestamp: string | null };

    return {
      total: total.count,
      userMessages: userMessages.count,
      assistantMessages: assistantMessages.count,
      oldestTimestamp: oldest.timestamp,
      newestTimestamp: newest.timestamp,
    };
  }

  /**
   * Close the database connection
   */
  close(): void {
    this.db.close();
  }
}
