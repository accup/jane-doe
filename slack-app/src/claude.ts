import Anthropic from '@anthropic-ai/sdk';
import { MCPClientManager } from './mcp-client.js';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export class ClaudeAgent {
  private anthropic: Anthropic;
  private mcpClient: MCPClientManager;
  private model = 'claude-3-5-sonnet-20241022';

  constructor(apiKey: string, mcpClient: MCPClientManager) {
    this.anthropic = new Anthropic({
      apiKey: apiKey,
    });
    this.mcpClient = mcpClient;
  }

  /**
   * Process a message and generate a response using Claude with MCP tools
   */
  async processMessage(userMessage: string, conversationHistory: Message[] = []): Promise<string> {
    try {
      // Get available MCP tools
      const mcpTools = await this.mcpClient.listTools();

      // Convert MCP tools to Claude tool format
      const tools = mcpTools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        input_schema: tool.input_schema,
      }));

      // Build messages array
      const messages: Anthropic.MessageParam[] = [
        ...conversationHistory.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        {
          role: 'user' as const,
          content: userMessage,
        },
      ];

      // System prompt for the agent
      const systemPrompt = `You are a helpful AI assistant integrated into Slack. You have access to a memory system that allows you to store and retrieve past conversations.

When interacting with users:
1. Use the retrieve_conversations tool to search for relevant past conversations when needed
2. Use the store_conversation tool to save important information from the current conversation
3. Be natural and conversational in your responses
4. Reference past conversations when relevant to provide context

The memory system stores conversations with timestamps, so you can search by keywords, time ranges, and message roles (user or assistant).

Current timestamp: ${new Date().toISOString()}`;

      let response = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: 4096,
        system: systemPrompt,
        messages: messages,
        tools: tools,
      });

      // Handle tool use loop
      let finalResponse = '';
      let iterationCount = 0;
      const maxIterations = 10; // Prevent infinite loops

      while (response.stop_reason === 'tool_use' && iterationCount < maxIterations) {
        iterationCount++;

        // Extract tool uses and text content
        const toolUses = response.content.filter(
          (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
        );
        const textBlocks = response.content.filter(
          (block): block is Anthropic.TextBlock => block.type === 'text'
        );

        // Collect text content
        if (textBlocks.length > 0) {
          finalResponse += textBlocks.map((block) => block.text).join('\n');
        }

        // Execute tools
        const toolResults: Anthropic.MessageParam[] = [];

        for (const toolUse of toolUses) {
          try {
            console.log(`[Claude] Executing tool: ${toolUse.name}`);
            const result = await this.mcpClient.callTool(toolUse.name, toolUse.input);

            toolResults.push({
              role: 'user',
              content: [
                {
                  type: 'tool_result',
                  tool_use_id: toolUse.id,
                  content: JSON.stringify(result),
                },
              ],
            });
          } catch (error) {
            console.error(`[Claude] Tool execution error:`, error);
            toolResults.push({
              role: 'user',
              content: [
                {
                  type: 'tool_result',
                  tool_use_id: toolUse.id,
                  content: JSON.stringify({
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error',
                  }),
                  is_error: true,
                },
              ],
            });
          }
        }

        // Continue conversation with tool results
        messages.push({
          role: 'assistant',
          content: response.content,
        });
        messages.push(...toolResults);

        response = await this.anthropic.messages.create({
          model: this.model,
          max_tokens: 4096,
          system: systemPrompt,
          messages: messages,
          tools: tools,
        });
      }

      // Get final text response
      const finalTextBlocks = response.content.filter(
        (block): block is Anthropic.TextBlock => block.type === 'text'
      );

      if (finalTextBlocks.length > 0) {
        finalResponse += finalTextBlocks.map((block) => block.text).join('\n');
      }

      // Store the conversation
      try {
        const timestamp = new Date().toISOString();

        // Store user message
        await this.mcpClient.callTool('store_conversation', {
          role: 'user',
          content: userMessage,
          timestamp: timestamp,
        });

        // Store assistant response
        await this.mcpClient.callTool('store_conversation', {
          role: 'assistant',
          content: finalResponse,
          timestamp: timestamp,
        });
      } catch (error) {
        console.error('[Claude] Error storing conversation:', error);
        // Don't fail the whole request if storage fails
      }

      return finalResponse.trim() || 'I apologize, but I was unable to generate a response.';
    } catch (error) {
      console.error('[Claude] Error processing message:', error);
      throw error;
    }
  }
}
