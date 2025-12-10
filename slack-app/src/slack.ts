import { App, LogLevel } from '@slack/bolt';
import { ClaudeAgent } from './claude.js';

export class SlackBot {
  private app: App;
  private claudeAgent: ClaudeAgent;

  constructor(
    botToken: string,
    appToken: string,
    signingSecret: string,
    claudeAgent: ClaudeAgent
  ) {
    this.claudeAgent = claudeAgent;

    this.app = new App({
      token: botToken,
      appToken: appToken,
      signingSecret: signingSecret,
      socketMode: true,
      logLevel: LogLevel.INFO,
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // Handle app mentions
    this.app.event('app_mention', async ({ event, say }) => {
      try {
        console.log('[Slack] Received app_mention:', event);

        // Remove the bot mention from the message
        const userMessage = event.text.replace(/<@[A-Z0-9]+>/g, '').trim();

        if (!userMessage) {
          await say({
            text: 'こんにちは!何かお手伝いできることはありますか?',
            thread_ts: event.thread_ts || event.ts,
          });
          return;
        }

        // Send typing indicator
        await this.app.client.chat.postMessage({
          channel: event.channel,
          text: '考えています...',
          thread_ts: event.thread_ts || event.ts,
        });

        // Process with Claude
        const response = await this.claudeAgent.processMessage(userMessage);

        // Send response
        await say({
          text: response,
          thread_ts: event.thread_ts || event.ts,
        });
      } catch (error) {
        console.error('[Slack] Error handling app_mention:', error);
        await say({
          text: 'すみません、エラーが発生しました。もう一度お試しください。',
          thread_ts: event.thread_ts || event.ts,
        });
      }
    });

    // Handle direct messages
    this.app.event('message', async ({ event, say }) => {
      // Ignore bot messages and threaded messages
      if (
        'subtype' in event ||
        'thread_ts' in event ||
        event.channel_type !== 'im'
      ) {
        return;
      }

      try {
        console.log('[Slack] Received direct message:', event);

        const userMessage = 'text' in event ? event.text : '';

        if (!userMessage) {
          return;
        }

        // Process with Claude
        const response = await this.claudeAgent.processMessage(userMessage);

        // Send response
        await say({
          text: response,
        });
      } catch (error) {
        console.error('[Slack] Error handling message:', error);
        await say({
          text: 'すみません、エラーが発生しました。もう一度お試しください。',
        });
      }
    });

    // Handle app home opened
    this.app.event('app_home_opened', async ({ event, client }) => {
      try {
        await client.views.publish({
          user_id: event.user,
          view: {
            type: 'home',
            blocks: [
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: '*Slack Agent with Memory へようこそ!* :wave:',
                },
              },
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: 'このBotは過去の会話を記憶し、コンテキストを保持しながら対話できます。',
                },
              },
              {
                type: 'divider',
              },
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: '*使い方:*\n• メンションして話しかけてください\n• DMでも使用できます\n• 過去の会話を自動的に参照します',
                },
              },
            ],
          },
        });
      } catch (error) {
        console.error('[Slack] Error publishing home view:', error);
      }
    });

    // Error handling
    this.app.error(async (error) => {
      console.error('[Slack] App error:', error);
    });
  }

  async start(port: number = 3000): Promise<void> {
    await this.app.start(port);
    console.log(`[Slack] ⚡️ Bolt app is running on port ${port}!`);
  }

  async stop(): Promise<void> {
    await this.app.stop();
    console.log('[Slack] App stopped');
  }
}
