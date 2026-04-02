import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  // Créer une notification (appelé automatiquement par ForumService)
  create(data: {
    title: string;
    body: string;
    link?: string;
    recipientId: string;
  }) {
    return this.prisma.notification.create({ data });
  }

  // Toutes les notifications d'un utilisateur
  findForUser(recipientId: string) {
    return this.prisma.notification.findMany({
      where: { recipientId },
      orderBy: { createdAt: 'desc' },
      take: 50, // 50 dernières
    });
  }

  // Nombre de notifications non lues
  countUnread(recipientId: string) {
    return this.prisma.notification.count({
      where: { recipientId, isRead: false },
    });
  }

  // Marquer une notification comme lue
  markAsRead(id: string) {
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  // Marquer toutes comme lues
  markAllAsRead(recipientId: string) {
    return this.prisma.notification.updateMany({
      where: { recipientId, isRead: false },
      data: { isRead: true },
    });
  }

  // Supprimer une notification
  delete(id: string) {
    return this.prisma.notification.delete({ where: { id } });
  }
}
