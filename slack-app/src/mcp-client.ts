import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface MCPTool {
  name: string;
  description: string;
  input_schema: any;
}

export class MCPClientManager {
  private client: Client | null = null;
  private transport: StdioClientTransport | null = null;
  private serverPath: string;
  private isConnected = false;

  constructor(serverPath?: string) {
    const defaultPath = path.join(__dirname, '../../mcp-server/dist/index.js');
    this.serverPath = serverPath || process.env.MCP_SERVER_PATH || defaultPath;
  }

  async connect(): Promise<void> {
    if (this.isConnected) {
      console.log('[MCP] Already connected');
      return;
    }

    try {
      console.log('[MCP] Connecting to MCP server:', this.serverPath);

      // Create transport
      this.transport = new StdioClientTransport({
        command: 'node',
        args: [this.serverPath],
      });

      // Create client
      this.client = new Client(
        {
          name: 'slack-agent-app',
          version: '0.1.0',
        },
        {
          capabilities: {},
        }
      );

      // Connect
      await this.client.connect(this.transport);
      this.isConnected = true;

      console.log('[MCP] Connected successfully');
    } catch (error) {
      console.error('[MCP] Connection error:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      if (this.client) {
        await this.client.close();
      }
      this.isConnected = false;
      console.log('[MCP] Disconnected');
    } catch (error) {
      console.error('[MCP] Disconnect error:', error);
    }
  }

  async listTools(): Promise<MCPTool[]> {
    if (!this.client || !this.isConnected) {
      throw new Error('MCP client not connected');
    }

    try {
      const response = await this.client.listTools();

      return response.tools.map((tool) => ({
        name: tool.name,
        description: tool.description || '',
        input_schema: tool.inputSchema,
      }));
    } catch (error) {
      console.error('[MCP] Error listing tools:', error);
      throw error;
    }
  }

  async callTool(name: string, args: any): Promise<any> {
    if (!this.client || !this.isConnected) {
      throw new Error('MCP client not connected');
    }

    try {
      console.log(`[MCP] Calling tool: ${name}`, args);

      const response = await this.client.callTool({
        name,
        arguments: args,
      });

      // Parse the response content
      if (response.content && response.content.length > 0) {
        const textContent = response.content.find((c) => c.type === 'text');
        if (textContent && 'text' in textContent) {
          return JSON.parse(textContent.text);
        }
      }

      return { success: false, error: 'No response from tool' };
    } catch (error) {
      console.error(`[MCP] Error calling tool ${name}:`, error);
      throw error;
    }
  }

  isReady(): boolean {
    return this.isConnected && this.client !== null;
  }
}
