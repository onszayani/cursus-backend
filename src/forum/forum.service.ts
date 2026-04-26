/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateThreadDto } from './dto/create-thread.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { MentionType } from '@prisma/client';

// Types de rôles principaux reconnus dans les @mentions
const MAIN_ROLES = ['student', 'teacher', 'agent', 'admin'];

// Sous-types d'agents reconnus dans les @mentions
const AGENT_SUBTYPES = [
  'technicien',
  'agent_administratif',
  'responsable_labo',
  'bibliothecaire',
  'securite',
  'autre',
];

// Regex pour détecter un groupe (ex: ING_A1_G1)
const GROUP_REGEX = /^[A-Z]{2,}_[A-Z0-9]+_G\d+$/i;

@Injectable()
export class ForumService {
  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
    private notificationsService: NotificationsService,
  ) {}

  // ═══════════════════════════════════════════════════════════════════
  // THREADS
  // ═══════════════════════════════════════════════════════════════════

  async createOrGetThread(dto: CreateThreadDto, creatorId: string) {
    // Valider que le destinataire existe
    await this.validateReceiver(dto.receiverType, dto.receiverValue);

    // Vérifier si un thread existe déjà
    const existingThread = await this.prisma.thread.findFirst({
      where: {
        creatorId,
        receiverType: dto.receiverType,
        receiverValue: dto.receiverValue,
      },
    });

    if (existingThread) {
      return existingThread;
    }

    // Pour les threads USER, on peut stocker l'ID du destinataire
    let receiverId: string | null = null;
    if (dto.receiverType === 'USER') {
      const user = await this.usersService.findByUsername(dto.receiverValue);
      if (user) receiverId = user.id;
    }

    // Créer un nouveau thread
    return this.prisma.thread.create({
      data: {
        title: dto.title,
        creatorId,
        receiverType: dto.receiverType,
        receiverValue: dto.receiverValue,
        receiverId,
        isPrivate: dto.isPrivate || false,
      },
      include: {
        creator: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
      },
    });
  }

  private async validateReceiver(type: MentionType, value: string) {
    const valueLower = value.toLowerCase();

    switch (type) {
      case 'ALL':
        if (valueLower !== 'tous' && valueLower !== 'all') {
          throw new BadRequestException('Pour ALL, utilisez "tous"');
        }
        break;

      case 'ROLE':
        if (
          !MAIN_ROLES.includes(valueLower) &&
          !AGENT_SUBTYPES.includes(valueLower)
        ) {
          throw new BadRequestException(`Rôle invalide: ${value}`);
        }
        const roleUsers =
          valueLower === 'technicien' || AGENT_SUBTYPES.includes(valueLower)
            ? await this.usersService.findByAgentType(valueLower)
            : await this.usersService.findByRole(valueLower);

        if (roleUsers.length === 0) {
          throw new BadRequestException(
            `Aucun utilisateur trouvé avec le rôle ${value}`,
          );
        }
        break;

      case 'GROUP':
        if (!GROUP_REGEX.test(valueLower)) {
          throw new BadRequestException(`Format de groupe invalide: ${value}`);
        }
        const groupUsers = await this.usersService.findByGroup(
          value.toUpperCase(),
        );
        if (groupUsers.length === 0) {
          throw new BadRequestException(
            `Aucun utilisateur trouvé dans le groupe ${value}`,
          );
        }
        break;

      case 'USER':
        const user = await this.usersService.findByUsername(valueLower);
        if (!user) {
          throw new BadRequestException(`Utilisateur non trouvé: ${value}`);
        }
        break;
    }
  }

  async getUserThreads(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: true,
        agentType: true,
        studentGroup: true,
        username: true,
      },
    });

    if (!user) throw new NotFoundException('Utilisateur non trouvé');

    const threads = await this.prisma.thread.findMany({
      where: {
        OR: [
          { creatorId: userId },
          { receiverType: 'USER', receiverId: userId },
          { receiverType: 'ALL' },
          {
            receiverType: 'ROLE',
            receiverValue: {
              in: this.getUserRoleValues(user),
            },
          },
          {
            receiverType: 'GROUP',
            receiverValue: user.studentGroup || 'none',
          },
        ],
      },
      include: {
        creator: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
        _count: { select: { messages: true } },
        // Récupérer TOUS les messages, pas seulement le dernier
        messages: {
          orderBy: { createdAt: 'asc' }, // Tri ascendant pour l'ordre chronologique
          include: {
            sender: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true,
                username: true,
              },
            },
            replyTo: {
              include: {
                sender: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
            readBy: {
              include: {
                user: {
                  select: { id: true, firstName: true, lastName: true },
                },
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Ajouter les métadonnées pour chaque thread
    const threadsWithMeta = await Promise.all(
      threads.map(async (thread) => ({
        id: thread.id,
        title: thread.title,
        isPrivate: thread.isPrivate,
        creatorId: thread.creatorId,
        creator: thread.creator,
        receiverType: thread.receiverType,
        receiverValue: thread.receiverValue,
        receiverId: thread.receiverId,
        createdAt: thread.createdAt,
        updatedAt: thread.updatedAt,
        _count: thread._count,
        // Tous les messages du thread
        messages: thread.messages,
        unreadCount: await this.countUnreadMessages(thread.id, userId),
        receiverDisplay: this.formatReceiverDisplay(
          thread.receiverType,
          thread.receiverValue,
        ),
      })),
    );

    return threadsWithMeta;
  }

  private getUserRoleValues(user: any): string[] {
    const roles = [user.role];
    if (user.agentType) roles.push(user.agentType);
    if (user.role === 'teacher') roles.push('enseignant');
    return roles;
  }

  private formatReceiverDisplay(type: MentionType, value: string): string {
    switch (type) {
      case 'ALL':
        return 'Tout le monde';
      case 'ROLE':
        return `@${value}`;
      case 'GROUP':
        return `Groupe ${value}`;
      case 'USER':
        return value;
      default:
        return value;
    }
  }

  private async countUnreadMessages(
    threadId: string,
    userId: string,
  ): Promise<number> {
    const unreadMessages = await this.prisma.message.findMany({
      where: {
        threadId,
        senderId: { not: userId },
        readBy: {
          none: {
            userId,
          },
        },
      },
    });
    return unreadMessages.length;
  }

  async getThreadById(id: string) {
    const thread = await this.prisma.thread.findUnique({
      where: { id },
      include: {
        creator: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
      },
    });
    if (!thread) throw new NotFoundException('Thread non trouvé');
    return thread;
  }

  async deleteThread(id: string, userId: string) {
    const thread = await this.getThreadById(id);
    if (!thread) throw new NotFoundException('Thread non trouvé');
    if (thread.creatorId !== userId) {
      throw new ForbiddenException(
        'Vous ne pouvez supprimer que vos propres threads',
      );
    }
    return this.prisma.thread.delete({ where: { id } });
  }

  // ═══════════════════════════════════════════════════════════════════
  // MESSAGES
  // ═══════════════════════════════════════════════════════════════════

  async getMessages(threadId: string, userId: string) {
    await this.checkThreadAccess(threadId, userId);

    const messages = await this.prisma.message.findMany({
      where: { threadId },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            agentType: true,
          },
        },
        replyTo: {
          include: {
            sender: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        readBy: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Marquer les messages comme lus en arrière-plan
    this.markMessagesAsRead(threadId, userId).catch(console.error);

    return messages;
  }

  // Méthode publique pour le gateway
  async checkThreadAccess(threadId: string, userId: string): Promise<void> {
    const thread = await this.prisma.thread.findUnique({
      where: { id: threadId },
      include: {
        creator: { select: { id: true } },
      },
    });

    if (!thread) throw new NotFoundException('Thread non trouvé');

    if (thread.creatorId === userId) return;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: true,
        agentType: true,
        studentGroup: true,
        username: true,
      },
    });

    if (!user) throw new NotFoundException('Utilisateur non trouvé');

    let hasAccess = false;

    switch (thread.receiverType) {
      case 'ALL':
        hasAccess = true;
        break;
      case 'USER':
        hasAccess = thread.receiverId === userId;
        break;
      case 'ROLE':
        const userRoles = this.getUserRoleValues(user);
        hasAccess = userRoles.includes(thread.receiverValue);
        break;
      case 'GROUP':
        hasAccess = user.studentGroup === thread.receiverValue;
        break;
    }

    if (!hasAccess) {
      throw new ForbiddenException(
        "Vous n'avez pas accès à cette conversation",
      );
    }
  }

  private async markMessagesAsRead(threadId: string, userId: string) {
    const messages = await this.prisma.message.findMany({
      where: {
        threadId,
        senderId: { not: userId },
        readBy: {
          none: {
            userId,
          },
        },
      },
      select: { id: true },
    });

    if (messages.length === 0) return;

    await this.prisma.readReceipt.createMany({
      data: messages.map((msg) => ({
        messageId: msg.id,
        userId,
      })),
      skipDuplicates: true,
    });
  }

  async markMessagesAsReadByIds(messageIds: string[], userId: string) {
    const receipts = messageIds.map((messageId) => ({
      messageId,
      userId,
    }));

    await this.prisma.readReceipt.createMany({
      data: receipts,
      skipDuplicates: true,
    });
  }

  async sendMessage(threadId: string, senderId: string, dto: SendMessageDto) {
    await this.checkThreadAccess(threadId, senderId);

    const thread = await this.prisma.thread.findUnique({
      where: { id: threadId },
    });

    if (!thread) throw new NotFoundException('Thread non trouvé');

    const message = await this.prisma.message.create({
      data: {
        content: dto.content,
        attachmentUrl: dto.attachmentUrl,
        senderId,
        threadId,
        replyToId: dto.replyToId ?? null,
      },
    });

    await this.prisma.thread.update({
      where: { id: threadId },
      data: { updatedAt: new Date() },
    });

    const fullMessage = await this.prisma.message.findUnique({
      where: { id: message.id },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            agentType: true,
          },
        },
      },
    });

    // Envoyer les notifications aux destinataires du thread
    if (fullMessage) {
      await this.notifyThreadRecipients(
        thread,
        senderId,
        dto.content,
        fullMessage,
      );
    }

    return fullMessage;
  }

  // Méthode publique pour le gateway
  async getThreadRecipients(thread: any): Promise<string[]> {
    switch (thread.receiverType) {
      case 'ALL':
        const allUsers = await this.usersService.findAllActive();
        return allUsers.map((u) => u.id);

      case 'ROLE':
        if (AGENT_SUBTYPES.includes(thread.receiverValue)) {
          const agentUsers = await this.usersService.findByAgentType(
            thread.receiverValue,
          );
          return agentUsers.map((u) => u.id);
        }
        const roleUsers = await this.usersService.findByRole(
          thread.receiverValue,
        );
        return roleUsers.map((u) => u.id);

      case 'GROUP':
        const groupUsers = await this.usersService.findByGroup(
          thread.receiverValue,
        );
        return groupUsers.map((u) => u.id);

      case 'USER':
        if (thread.receiverId) return [thread.receiverId];
        const user = await this.usersService.findByUsername(
          thread.receiverValue,
        );
        return user ? [user.id] : [];

      default:
        return [];
    }
  }

  private async notifyThreadRecipients(
    thread: any,
    senderId: string,
    content: string,
    message: any,
  ) {
    const recipients = await this.getThreadRecipients(thread);

    const sender = await this.prisma.user.findUnique({
      where: { id: senderId },
      select: { firstName: true, lastName: true },
    });

    const senderName = sender
      ? `${sender.firstName} ${sender.lastName}`
      : "Quelqu'un";

    await Promise.all(
      recipients
        .filter((recipientId) => recipientId !== senderId)
        .map((recipientId) =>
          this.notificationsService.create({
            title: `Nouveau message de ${senderName}`,
            body: this.truncate(content, 120),
            link: `/forum/threads/${thread.id}`,
            recipientId,
          }),
        ),
    );
  }

  private truncate(text: string, max: number) {
    return text.length > max ? text.substring(0, max) + '...' : text;
  }
}
