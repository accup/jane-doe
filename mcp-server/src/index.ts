#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { ConversationDatabase } from './database.js';
import { TOOLS, ToolHandlers } from './tools.js';

class ConversationMCPServer {
  private server: Server;
  private db: ConversationDatabase;
  private toolHandlers: ToolHandlers;

  constructor() {
    // Initialize database
    this.db = new ConversationDatabase();
    this.toolHandlers = new ToolHandlers(this.db);

    // Initialize MCP server
    this.server = new Server(
      {
        name: 'slack-agent-memory-mcp-server',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
    this.setupErrorHandling();
  }

  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: Object.values(TOOLS),
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        const result = await this.toolHandlers.handleToolCall(name, args);

        return {
          content: [
            {
              type: 'text',
              text: result,
            },
          ],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: errorMessage,
              }),
            },
          ],
          isError: true,
        };
      }
    });
  }

  private setupErrorHandling(): void {
    // Handle server errors
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    // Handle process errors
    process.on('SIGINT', async () => {
      await this.cleanup();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await this.cleanup();
      process.exit(0);
    });
  }

  private async cleanup(): Promise<void> {
    console.error('[MCP] Shutting down...');
    this.db.close();
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('[MCP] Slack Agent Memory MCP Server running on stdio');
  }
}

// Start the server
const server = new ConversationMCPServer();
server.run().catch((error) => {
  console.error('[MCP] Fatal error:', error);
  process.exit(1);
});
