import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { TelegramService } from './telegram/telegram.service';

async function bootstrap() {
  console.log('Starting NestJS application...');
  const app = await NestFactory.create(AppModule);

  // Enable validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Start the application
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Server is running on port ${port}`);

  // Start the Telegram bot after the server is ready
  console.log('Getting TelegramService...');
  const telegramService = app.get(TelegramService);
  console.log('Starting bot...');

  // Add a small delay to ensure NestJS is fully initialized
  await new Promise((resolve) => setTimeout(resolve, 1000));

  try {
    const startPromise = telegramService.start();
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(
        () => reject(new Error('Bot startup timed out after 10 seconds')),
        10000,
      );
    });

    await Promise.race([startPromise, timeoutPromise]);
    console.log('Bot started successfully');
  } catch (error) {
    console.error('Failed to start bot:', error);
    process.exit(1);
  }
}

bootstrap().catch((error) => {
  console.error('Error starting application:', error);
  process.exit(1);
});
