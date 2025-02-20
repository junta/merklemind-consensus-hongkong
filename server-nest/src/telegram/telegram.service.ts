import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Telegraf, Context } from 'telegraf';
import axios from 'axios';

interface MyContext extends Context {
  chat: NonNullable<Context['chat']>;
  from: NonNullable<Context['from']>;
}

@Injectable()
export class TelegramService implements OnModuleInit {
  private bot: Telegraf<MyContext>;
  private readonly logger = new Logger(TelegramService.name);

  // Poll data
  private currentPollId: string | null = null;
  private currentPollMessageId: number | null = null;

  // Configuration settings
  private tradeThreshold = 1; // Minimum number of votes to execute a trade
  private recommendedPair: string | null = null;
  private recommendedAction: string | null = null;

  // User deposits and shares
  private userDeposits: { [key: number]: number } = {}; // user_id: USDC_amount

  constructor(private configService: ConfigService) {
    const token = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    if (!token) {
      throw new Error('TELEGRAM_BOT_TOKEN is required');
    }
    try {
      this.logger.log(`Initializing bot with token: ${token.slice(0, 5)}...`);
      this.bot = new Telegraf<MyContext>(token);
      this.setupCommands();
    } catch (error) {
      this.logger.error('Error initializing bot:', error);
      throw error;
    }
  }

  private setupCommands() {
    // Command to get current chat ID
    this.bot.command('getchatid', async (ctx: MyContext) => {
      if (!ctx.chat || !ctx.from) {
        await ctx.reply('This command can only be used in chat contexts');
        return;
      }
      const chatId = ctx.chat.id;
      this.logger.log(`Chat ID: ${chatId}`);
      await ctx.reply(`Chat ID: ${chatId}`);
    });

    // Command to check balance
    this.bot.command('checkbalance', async (ctx: MyContext) => {
      if (!ctx.from) return;

      const userId = ctx.from.id;
      const balance = this.userDeposits[userId] || 0;
      await ctx.reply(`Your balance: ${balance} USDC`);
    });

    // Handle poll answers
    this.bot.on('poll', (ctx) => {
      if (!ctx.poll) return;

      if (ctx.poll.id === this.currentPollId) {
        const yesVotes = ctx.poll.options[0].voter_count;
        if (yesVotes >= this.tradeThreshold) {
          this.executeTrade();
          if (this.currentPollMessageId) {
            this.stopPoll(
              this.configService.get('CHANNEL_ID'),
              this.currentPollMessageId,
            );
          }
        }
      }
    });
  }

  async onModuleInit() {
    // Don't start the bot here, we'll start it after the server is ready
  }

  start() {
    return this.bot
      .launch()
      .then(() => {
        this.logger.log('Bot is running...');
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

  async verifyDeposit(userId: number, amount: number) {
    if (amount <= 0) {
      throw new Error('Invalid deposit amount');
    }

    // Update user deposits and total deposits
    this.userDeposits[userId] = (this.userDeposits[userId] || 0) + amount;
    const totalDeposits = Object.values(this.userDeposits).reduce(
      (sum, value) => sum + value,
      0,
    );

    this.logger.log(
      `User ${userId} deposited ${amount} USDC. Total deposits: ${totalDeposits}`,
    );
    return totalDeposits;
  }

  setTradeThreshold(threshold: number) {
    if (threshold <= 0) {
      throw new Error('Invalid threshold value');
    }
    this.tradeThreshold = threshold;
    this.logger.log(`Trade threshold set to: ${this.tradeThreshold}`);
    return this.tradeThreshold;
  }

  private async executeTrade() {
    if (!this.recommendedPair || !this.recommendedAction) {
      this.logger.error('No recommended pair or action for trade execution');
      return;
    }

    try {
      // This is a placeholder for the actual integration
      const aiAgentUrl = `http://localhost:${process.env.AI_AGENT_PORT || 4000}/execute-trade`;
      const data = {
        pair: this.recommendedPair,
        action: this.recommendedAction,
      };

      const response = await axios.post(aiAgentUrl, data);
      this.logger.log(`Trade executed: ${JSON.stringify(response.data)}`);
      await this.sendMessage(
        this.configService.get('CHANNEL_ID'),
        `Trade executed: ${JSON.stringify(response.data)}`,
      );
    } catch (error) {
      this.logger.error('Error executing trade:', error);
      await this.sendMessage(
        this.configService.get('CHANNEL_ID'),
        `Error executing trade: ${error.message}`,
      );
    }
  }

  async createPoll(
    chatId: string | number,
    question: string,
    options: string[],
  ) {
    return this.bot.telegram.sendPoll(chatId, question, options, {
      is_anonymous: false,
      allows_multiple_answers: false,
    });
  }

  async createTradePoll(pair: string, action: string) {
    const channelId = this.configService.get<string>('CHANNEL_ID');
    if (!channelId) {
      throw new Error('CHANNEL_ID is required');
    }

    // Store the recommended trade
    this.recommendedPair = pair;
    this.recommendedAction = action;

    // Create poll options
    const options = ['Yes', 'No'];
    const question = `Should we ${action} ${pair}?`;

    try {
      const poll = await this.createPoll(channelId, question, options);
      this.currentPollMessageId = poll.message_id;
      return poll;
    } catch (error) {
      this.logger.error('Error creating poll:', error);
      throw error;
    }
  }
}
