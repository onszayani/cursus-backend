import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { EmploiDuTempsModule } from './emploi-du-temps/emploi-du-temps.module';
import { SupportCoursModule } from './support-cours/support-cours.module';
import { ActualiteModule } from './actualite/actualite.module';
import { GroupeModule } from './groupe/groupe.module';
import { ForumModule } from './forum/forum.module';
import { NotificationModule } from './notification/notification.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    EmploiDuTempsModule,
    SupportCoursModule,
    ActualiteModule,
    GroupeModule,
    ForumModule,
    NotificationModule,
  ],
})
export class AppModule {}
