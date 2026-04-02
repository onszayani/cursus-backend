/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/require-await */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class NotificationService {
  constructor(private prisma: PrismaService) {}

  async create(
    userId: string,
    type: NotificationType,
    titre: string,
    contenu: string,
    data?: any,
  ) {
    return this.prisma.notification.create({
      data: {
        userId,
        type,
        titre,
        contenu,
        data: data || {},
      },
    });
  }

  async createForumMentionNotification(
    userId: string,
    message: any,
    topic: any,
  ) {
    return this.create(
      userId,
      NotificationType.FORUM_MENTION,
      `Vous avez été mentionné dans le forum`,
      `${message.auteur?.prenom} ${message.auteur?.nom} vous a mentionné dans le topic "${topic.titre}"`,
      {
        messageId: message.id,
        topicId: topic.id,
        topicTitle: topic.titre,
      },
    );
  }

  async createForumMessageNotification(
    userId: string,
    message: any,
    topic: any,
  ) {
    return this.create(
      userId,
      NotificationType.FORUM_MESSAGE,
      `Nouveau message dans le forum`,
      `${message.auteur?.prenom} ${message.auteur?.nom} a répondu dans "${topic.titre}"`,
      {
        messageId: message.id,
        topicId: topic.id,
        topicTitle: topic.titre,
      },
    );
  }

  async createCoursNotification(userId: string, cours: any, support: any) {
    return this.create(
      userId,
      NotificationType.COURS_NOUVEAU,
      `Nouveau support de cours disponible`,
      `Un nouveau support "${support.titre}" a été ajouté pour le cours "${cours.titre}"`,
      {
        coursId: cours.id,
        supportId: support.id,
      },
    );
  }

  async createActualiteNotification(userId: string, actualite: any) {
    return this.create(
      userId,
      NotificationType.ACTUALITE,
      `Nouvelle actualité: ${actualite.titre}`,
      actualite.contenu.substring(0, 200),
      {
        actualiteId: actualite.id,
      },
    );
  }

  async createEmploiNotification(userId: string, emploi: any, action: string) {
    return this.create(
      userId,
      NotificationType.EMPLOI_MODIFIE,
      `Modification de l'emploi du temps`,
      `L'emploi du temps a été ${action} pour le cours "${emploi.cours?.titre}"`,
      {
        emploiId: emploi.id,
      },
    );
  }

  async findAllForUser(
    userId: string,
    params: { unreadOnly?: boolean; skip?: number; take?: number },
  ) {
    const where: any = { userId };

    if (params.unreadOnly) {
      where.lu = false;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: params.skip,
        take: params.take,
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({ where: { userId, lu: false } }),
    ]);

    return {
      data: notifications,
      meta: {
        total,
        unreadCount,
        skip: params.skip || 0,
        take: params.take || 20,
      },
    };
  }

  async markAsRead(id: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: {
        id,
        userId,
      },
      data: { lu: true },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: {
        userId,
        lu: false,
      },
      data: { lu: true },
    });
  }

  async delete(id: string, userId: string) {
    return this.prisma.notification.deleteMany({
      where: {
        id,
        userId,
      },
    });
  }

  async deleteAll(userId: string) {
    return this.prisma.notification.deleteMany({
      where: { userId },
    });
  }
}
