import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ScheduleModule } from './schedule/schedule.module';
import { NewsModule } from './news/news.module';
import { CoursesModule } from './courses/courses.module';
import { ForumModule } from './forum/forum.module';
import { NotificationsModule } from './notifications/notifications.module';
@Module({
  imports: [
    // Charge les variables d'environnement (.env) globalement
    ConfigModule.forRoot({ isGlobal: true }),

    // Sert les fichiers uploadés sur /files/
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/files',
    }),

    PrismaModule, // BDD Prisma (global)
    AuthModule, // Authentification JWT
    UsersModule, // Gestion des utilisateurs
    ScheduleModule, // Emplois du temps
    NewsModule, // Actualités
    CoursesModule, // Supports de cours
    ForumModule, // Forum + @mentions
    NotificationsModule, // Notifications
  ],
})
export class AppModule {}
