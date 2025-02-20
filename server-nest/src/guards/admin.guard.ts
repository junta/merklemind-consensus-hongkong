import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AdminGuard implements CanActivate {
  private readonly logger = new Logger(AdminGuard.name);

  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    // const request = context.switchToHttp().getRequest();
    // const userId = request.body.user_id;
    // const adminUserId = this.configService.get<string>('ADMIN_USER_ID');
    //
    // this.logger.debug(`Comparing user_id: ${userId} with ADMIN_USER_ID: ${adminUserId}`);
    //
    // // Convert both to strings for comparison
    // return String(userId) === String(adminUserId);
    return true;
  }
}
