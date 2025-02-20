import {Telegraf, Context} from 'telegraf';
import express from 'express';
import bodyParser from 'body-parser';
import axios from 'axios';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Get bot token from environment variables
const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!TOKEN || TOKEN === 'YOUR_TELEGRAM_BOT_TOKEN') {
  console.error('ERROR: TELEGRAM_BOT_TOKEN is not set in .env file');
  process.exit(1);
}

// Replace 'YOUR_CHANNEL_ID' with your channel's chat ID
const CHANNEL_ID = process.env.CHANNEL_ID || 'YOUR_CHANNEL_ID';

// Replace 'ADMIN_USER_ID' with the user ID of the admin
const ADMIN_USER_ID = process.env.ADMIN_USER_ID || 'YOUR_ADMIN_USER_ID';

// Store poll data
let currentPollId: string | null = null;
let currentPollMessageId: number | null = null;

// Configuration settings
let tradeThreshold = 1; // Minimum number of votes to execute a trade
let recommendedPair: string | null = null;
let recommendedAction: string | null = null;

// User deposits and shares
const userDeposits: { [key: number]: number } = {}; // user_id: USDC_amount

interface MyContext extends Context {
  chat: NonNullable<Context['chat']>;
  from: NonNullable<Context['from']>;
}

// Logger
const logger = {
  info: (message: string) => console.log(`INFO: ${message}`),
  error: (message: string, error: any) => console.error(`ERROR: ${message}`, error)
};

class TelegramBot {
  private bot: Telegraf<MyContext>;
  private logger: any;

  constructor(token: string, logger: any) {
    try {
      this.logger = logger;
      this.logger.info('Initializing bot with token:', token.slice(0, 5) + '...');
      this.bot = new Telegraf<MyContext>(token);
    } catch (error) {
      this.logger.error('Error initializing bot:', error);
      throw error;
    }
  }

  registerCommand(command: string, handler: (ctx: MyContext) => void | Promise<void>) {
    this.bot.command(command, handler as any);
  }

  registerPollHandler(handler: (ctx: Context) => void) {
    this.bot.on('poll', handler);
  }

  async getChannelId(channelUsername: string) {
    try {
      // Try to send a message to the channel
      const message = await this.bot.telegram.sendMessage(
        '@' + channelUsername,
        'Getting channel ID...',
        { disable_notification: true }
      );
      // Delete the message immediately
      await this.bot.telegram.deleteMessage(message.chat.id, message.message_id);
      return message.chat.id;
    } catch (error) {
      this.logger.error('Error getting channel ID:', error);
      throw error;
    }
  }

  setupCommands() {
    // Command to get current chat ID
    this.registerCommand('getchatid', async (ctx: MyContext) => {
      if (!ctx.chat || !ctx.from) {
        await ctx.reply('This command can only be used in chat contexts');
        return;
      }

      const chatId = ctx.chat.id;
      this.logger.info(`Chat ID: ${chatId}`);
      ctx.reply(`Chat ID: ${chatId}`);
    });

    this.registerCommand('checkbalance', async (ctx: MyContext) => {
      if (!ctx.chat) {
        return;
      }
      const chatId = ctx.chat.id;
      const userId = ctx.from?.id;

      if (userId === parseInt(ADMIN_USER_ID, 10)) {
        await ctx.reply(`Current USDC balance: 0`);
      } else {
        await ctx.reply('You are not authorized to check the balance.');
      }
    });

    this.registerCommand('deposit', async (ctx: MyContext) => {
      if (!ctx.chat) {
        return;
      }

      const chatId = ctx.chat.id;
      const userId = ctx.from?.id;

      if (userId) {
        // TODO deposit into ai agent and store this info
        await ctx.reply('Deposit functionality coming soon...');
      } else {
        await ctx.reply('Unable to determine user ID.');
      }
    });

    this.registerPollHandler((ctx: Context) => {
      const poll = ctx.poll;
      if (poll && currentPollId && poll.id === currentPollId) {
        const yesVotes = poll.options[0].voter_count || 0;
        const noVotes = poll.options[1].voter_count || 0;

        this.logger.info(`Poll ${currentPollId} has ${yesVotes} yes votes and ${noVotes} no votes.`);

        if (yesVotes + noVotes >= tradeThreshold) {
          this.stopPoll(CHANNEL_ID, currentPollMessageId!).then(() => {
            if (yesVotes > noVotes) {
              executeTrade();
            } else {
              this.sendMessage(CHANNEL_ID, "Trade not executed. More 'No' votes.");
            }
          }).catch((error) => {
            this.logger.error('Error stopping poll:', error);
          });
        }
      }
    });

    process.once('SIGINT', () => this.bot.stop('SIGINT'));
    process.once('SIGTERM', () => this.bot.stop('SIGTERM'));
  }

  start() {
    return this.bot.launch()
      .then(() => {
        this.logger.info('Bot is running...');
      })
      .catch((error) => {
        this.logger.error('Error launching bot:', error);
        throw error;
      });
  }

  async sendMessage(chatId: string | number, message: string) {
    return this.bot.telegram.sendMessage(chatId, message);
  }

  async stopPoll(chatId: string | number, messageId: number) {
    return this.bot.telegram.stopPoll(chatId, messageId);
  }

  async createPoll(chatId: string | number, question: string, options: string[]) {
    return this.bot.telegram.sendPoll(chatId, question, options, {
      is_anonymous: true, // Always make polls anonymous
      allows_multiple_answers: false
    });
  }
}

const telegramBot = new TelegramBot(TOKEN, logger);
telegramBot.setupCommands();

// Create an Express app
const app = express();
app.use(bodyParser.json());

// Middleware to check if the request is from the admin
function isAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  next();
  // const userId = req.body.user_id;
  // if (userId === parseInt(ADMIN_USER_ID, 10)) {
  //   next();
  // } else {
  //   res.status(403).send('Forbidden');
  // }
}

// API endpoint to create a poll (only accessible by admin)
app.post('/create-poll', isAdmin, (req, res) => {
  const pair = req.body.pair;
  const action = req.body.action;

  if (!pair || !action) {
    res.status(400).send('Missing pair or action');
    return;
  }

  recommendedPair = pair;
  recommendedAction = action;

  const question = `Should we ${action} ${pair} for the day?`;
  const options = ["Yes", "No"];

  telegramBot.createPoll(CHANNEL_ID, question, options)
    .then((pollMessage) => {
      currentPollId = pollMessage.poll.id;
      currentPollMessageId = pollMessage.message_id;
      logger.info(`Poll created with ID: ${currentPollId} and message ID: ${currentPollMessageId}`);
      res.status(200).send('Poll created');
    })
    .catch((error) => {
      logger.error('Error creating poll:', error);
      res.status(500).send('Error creating poll');
    });
});

// API endpoint to configure trade threshold (only accessible by admin)
app.post('/configure', isAdmin, (req, res) => {
  const newThreshold = req.body.threshold;
  if (typeof newThreshold === 'number' && newThreshold > 0) {
    tradeThreshold = newThreshold;
    logger.info(`Trade threshold set to: ${tradeThreshold}`);
    res.status(200).send(`Trade threshold set to: ${tradeThreshold}`);
  } else {
    res.status(400).send('Invalid threshold value');
  }
});

// API endpoint to verify deposit and update user shares
app.post('/verify-deposit', (req, res) => {
  const userId = req.body.user_id;
  const amount = req.body.amount;

  if (typeof userId !== 'number' || typeof amount !== 'number' || amount <= 0) {
    res.status(400).send('Invalid request. User ID and amount are required.');
    return;
  }

  // Update user deposits and total deposits
  userDeposits[userId] = (userDeposits[userId] || 0) + amount;
  const totalDeposits = Object.values(userDeposits).reduce((sum, value) => sum + value, 0);

  logger.info(`User ${userId} deposited ${amount} USDC. Total deposits: ${totalDeposits}`);
  res.status(200).send(`Deposit verified. Total deposits: ${totalDeposits}`);
});

// Function to execute trade (this is a placeholder)
async function executeTrade() {
  if (!recommendedPair || !recommendedAction) {
    logger.error('No recommended pair or action to execute trade.', null);
    await telegramBot.sendMessage(CHANNEL_ID, 'No recommended pair or action to execute trade.');
    return;
  }

  await telegramBot.sendMessage(CHANNEL_ID, `Executing ${recommendedAction} trade on ${recommendedPair} based on poll results...`);

  // Here you would integrate with the AI agent to execute the trade
  // For example, you can send a notification to the AI agent
  // This is a placeholder for the actual integration
  const aiAgentUrl = `http://localhost:${process.env.AI_AGENT_PORT || 4000}/execute-trade`; // Replace with the actual AI agent URL
  const data = {
    pair: recommendedPair,
    action: recommendedAction
  };

  axios.post(aiAgentUrl, data)
    .then((order) => {
      logger.info(`Trade executed: ${order}`);
      telegramBot.sendMessage(CHANNEL_ID, `Trade executed: ${JSON.stringify(order)}`)
        .catch((error) => {
          logger.error('Error sending message:', error);
        });
    })
    .catch((error) => {
      logger.error('Error executing trade:', error);
      telegramBot.sendMessage(CHANNEL_ID, `Error executing trade: ${error.message}`)
        .catch((error) => {
          logger.error('Error sending message:', error);
        });
    });
}

// Start the Express server and bot
const PORT = process.env.PORT || 3000;

// Start both the server and bot
app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});

telegramBot.start()
  .catch(err => {
    logger.error('Error starting bot:', err);
    process.exit(1);
  });
