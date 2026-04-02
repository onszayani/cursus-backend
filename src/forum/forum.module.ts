import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ForumService } from './forum.service';
import { ForumController } from './forum.controller';
import { ForumGateway } from './forum.gateway';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
      }),
    }),
    NotificationModule,
  ],
  controllers: [ForumController],
  providers: [ForumService, ForumGateway],
  exports: [ForumService],
})
export class ForumModule {}
