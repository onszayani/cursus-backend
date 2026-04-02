import { Module } from '@nestjs/common';
import { ForumController } from './forum.controller';
import { ForumService } from './forum.service';
import { ForumGateway } from './forum.gateway';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [UsersModule, NotificationsModule, AuthModule],
  controllers: [ForumController],
  providers: [ForumService, ForumGateway],
  exports: [ForumService],
})
export class ForumModule {}
