import { ConversationDatabase, StoreConversationParams, RetrieveConversationsParams } from './database.js';

export const TOOLS = {
  store_conversation: {
    name: 'store_conversation',
    description: 'Store a conversation message (user or assistant) with timestamp',
    inputSchema: {
      type: 'object',
      properties: {
        role: {
          type: 'string',
          enum: ['user', 'assistant'],
          description: 'The role of the message sender',
        },
        content: {
          type: 'string',
          description: 'The content of the message',
        },
        timestamp: {
          type: 'string',
          description: 'ISO 8601 timestamp of when the message was created',
        },
      },
      required: ['role', 'content', 'timestamp'],
    },
  },
  retrieve_conversations: {
    name: 'retrieve_conversations',
    description: 'Retrieve past conversations based on search criteria. All parameters are optional.',
    inputSchema: {
      type: 'object',
      properties: {
        keyword: {
          type: 'string',
          description: 'Search for messages containing this keyword',
        },
        role: {
          type: 'string',
          enum: ['user', 'assistant'],
          description: 'Filter by message role',
        },
        start_time: {
          type: 'string',
          description: 'ISO 8601 timestamp - only return messages after this time',
        },
        end_time: {
          type: 'string',
          description: 'ISO 8601 timestamp - only return messages before this time',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of messages to return (default: no limit)',
          minimum: 1,
        },
      },
    },
  },
  get_stats: {
    name: 'get_stats',
    description: 'Get statistics about stored conversations',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
} as const;

export class ToolHandlers {
  constructor(private db: ConversationDatabase) {}

  async handleStoreConversation(args: unknown): Promise<string> {
    try {
      const params = args as StoreConversationParams;

      // Validate required fields
      if (!params.role || !params.content || !params.timestamp) {
        throw new Error('Missing required fields: role, content, and timestamp are required');
      }

      // Validate role
      if (params.role !== 'user' && params.role !== 'assistant') {
        throw new Error('Invalid role. Must be either "user" or "assistant"');
      }

      // Validate timestamp format
      const timestamp = new Date(params.timestamp);
      if (isNaN(timestamp.getTime())) {
        throw new Error('Invalid timestamp format. Must be ISO 8601 format');
      }

      const result = this.db.storeConversation(params);

      return JSON.stringify({
        success: result.success,
        id: result.id,
        message: 'Conversation stored successfully',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return JSON.stringify({
        success: false,
        error: errorMessage,
      });
    }
  }

  async handleRetrieveConversations(args: unknown): Promise<string> {
    try {
      const params = (args || {}) as RetrieveConversationsParams;

      // Validate timestamp formats if provided
      if (params.start_time) {
        const startTime = new Date(params.start_time);
        if (isNaN(startTime.getTime())) {
          throw new Error('Invalid start_time format. Must be ISO 8601 format');
        }
      }

      if (params.end_time) {
        const endTime = new Date(params.end_time);
        if (isNaN(endTime.getTime())) {
          throw new Error('Invalid end_time format. Must be ISO 8601 format');
        }
      }

      const conversations = this.db.retrieveConversations(params);

      return JSON.stringify({
        success: true,
        count: conversations.length,
        conversations: conversations,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return JSON.stringify({
        success: false,
        error: errorMessage,
      });
    }
  }

  async handleGetStats(): Promise<string> {
    try {
      const stats = this.db.getStats();

      return JSON.stringify({
        success: true,
        stats: stats,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return JSON.stringify({
        success: false,
        error: errorMessage,
      });
    }
  }

  async handleToolCall(toolName: string, args: unknown): Promise<string> {
    switch (toolName) {
      case 'store_conversation':
        return this.handleStoreConversation(args);
      case 'retrieve_conversations':
        return this.handleRetrieveConversations(args);
      case 'get_stats':
        return this.handleGetStats();
      default:
        return JSON.stringify({
          success: false,
          error: `Unknown tool: ${toolName}`,
        });
    }
  }
}
