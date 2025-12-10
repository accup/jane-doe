import 'dotenv/config';
import { MCPClientManager } from './mcp-client.js';
import { ClaudeAgent } from './claude.js';
import { SlackBot } from './slack.js';

async function main() {
  // Validate environment variables
  const requiredEnvVars = [
    'SLACK_BOT_TOKEN',
    'SLACK_APP_TOKEN',
    'SLACK_SIGNING_SECRET',
    'ANTHROPIC_API_KEY',
  ];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      console.error(`[Error] Missing required environment variable: ${envVar}`);
      process.exit(1);
    }
  }

  console.log('[App] Starting Slack Agent with Memory...');

  try {
    // Initialize MCP client
    console.log('[App] Initializing MCP client...');
    const mcpClient = new MCPClientManager(process.env.MCP_SERVER_PATH);
    await mcpClient.connect();

    // List available tools
    const tools = await mcpClient.listTools();
    console.log('[App] Available MCP tools:', tools.map((t) => t.name).join(', '));

    // Initialize Claude agent
    console.log('[App] Initializing Claude agent...');
    const claudeAgent = new ClaudeAgent(process.env.ANTHROPIC_API_KEY!, mcpClient);

    // Initialize Slack bot
    console.log('[App] Initializing Slack bot...');
    const slackBot = new SlackBot(
      process.env.SLACK_BOT_TOKEN!,
      process.env.SLACK_APP_TOKEN!,
      process.env.SLACK_SIGNING_SECRET!,
      claudeAgent
    );

    // Start the bot
    const port = parseInt(process.env.PORT || '3000', 10);
    await slackBot.start(port);

    console.log('[App] ✅ All systems running!');

    // Handle graceful shutdown
    const shutdown = async () => {
      console.log('\n[App] Shutting down...');
      try {
        await slackBot.stop();
        await mcpClient.disconnect();
        console.log('[App] Shutdown complete');
        process.exit(0);
      } catch (error) {
        console.error('[App] Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    console.error('[App] Fatal error:', error);
    process.exit(1);
  }
}

main();
