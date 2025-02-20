import { Telegraf } from 'telegraf';
import * as dotenv from 'dotenv';

dotenv.config();

const TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
if (!TOKEN) {
  console.error('TELEGRAM_BOT_TOKEN is required');
  process.exit(1);
}

async function getChannelId() {
  const channelUsername = process.argv[2];
  if (!channelUsername) {
    console.error('Please provide the channel username without @ symbol');
    console.error('Example: npm run get:channel-id your_channel_name');
    process.exit(1);
  }

  const bot = new Telegraf(TOKEN);

  try {
    console.log('Sending test message to get channel ID...');
    const message = await bot.telegram.sendMessage(
      '@' + channelUsername,
      'Getting channel ID...',
      { disable_notification: true }
    );

    // Delete the message immediately
    await bot.telegram.deleteMessage(message.chat.id, message.message_id);

    console.log(`Channel ID for @${channelUsername}: ${message.chat.id}`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

getChannelId();
