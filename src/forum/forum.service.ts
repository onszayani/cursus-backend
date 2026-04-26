/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
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

  createThread(dto: CreateThreadDto, creatorId: string) {
    return this.prisma.thread.create({
      data: { ...dto, creatorId },
      include: {
        creator: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
      },
    });
  }

  getThreads() {
    return this.prisma.thread.findMany({
      include: {
        creator: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
        _count: { select: { messages: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
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

  deleteThread(id: string) {
    return this.prisma.thread.delete({ where: { id } });
  }

  // ═══════════════════════════════════════════════════════════════════
  // MESSAGES
  // ═══════════════════════════════════════════════════════════════════

  getMessages(threadId: string) {
    return this.prisma.message.findMany({
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
        mentions: true,
        replyTo: {
          include: {
            sender: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  // ── Threads où un user est impliqué (créé OU participé) ─────────
  getThreadsForUser(userId: string) {
    return this.prisma.thread.findMany({
      where: {
        OR: [
          { creatorId: userId },
          { messages: { some: { senderId: userId } } },
        ],
      },
      include: {
        creator: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
        _count: { select: { messages: true } },
        // Dernier message du thread
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async sendMessage(threadId: string, senderId: string, dto: SendMessageDto) {
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

    // 🔥 résolution des mentions
    await this.resolveMentions(dto.content, message.id, senderId, threadId);

    return this.prisma.message.findUnique({
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
        mentions: true,
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  // MENTIONS
  // ═══════════════════════════════════════════════════════════════════

  private async resolveMentions(
    content: string,
    messageId: string,
    senderId: string,
    threadId: string,
  ) {
    const mentionRegex = /@([a-zA-Z0-9_]+)/g;
    const matches = [...content.matchAll(mentionRegex)];
    if (!matches.length)
      throw new ForbiddenException(
        'Le message doit contenir au moins une mention valide (@)',
      );

    const sender = await this.prisma.user.findUnique({
      where: { id: senderId },
      select: { firstName: true, lastName: true },
    });

    if (!sender) throw new Error('Sender not found');

    const senderName = `${sender.firstName} ${sender.lastName}`;

    for (const match of matches) {
      const tag = match[1];

      await this.processSingleMention(
        tag,
        messageId,
        senderId,
        senderName,
        threadId,
        content,
      );
    }
  }

  private async processSingleMention(
    tag: string,
    messageId: string,
    senderId: string,
    senderName: string,
    threadId: string,
    content: string,
  ) {
    let mentionType: MentionType;
    let targetUsers: { id: string }[] = [];

    const tagLower = tag.toLowerCase();

    if (tagLower === 'tous' || tagLower === 'all') {
      mentionType = 'ALL';
      targetUsers = await this.usersService.findAllActive();
    } else if (MAIN_ROLES.includes(tagLower)) {
      mentionType = 'ROLE';
      targetUsers = await this.usersService.findByRole(tagLower);
    } else if (AGENT_SUBTYPES.includes(tagLower)) {
      mentionType = 'ROLE';
      targetUsers = await this.usersService.findByAgentType(tagLower);
    } else if (GROUP_REGEX.test(tagLower)) {
      mentionType = 'GROUP';
      targetUsers = await this.usersService.findByGroup(tagLower.toUpperCase());
    } else {
      const user = await this.usersService.findByUsername(tagLower);

      if (!user) {
        throw new NotFoundException(
          `Aucun utilisateur trouvé pour la mention @${tagLower}`,
        );
      }
      mentionType = 'USER';
      targetUsers = [user];
    }

    // Enregistrer la mention
    await this.prisma.mention.create({
      data: {
        type: mentionType,
        targetValue: tag,
        messageId,
      },
    });

    // 🔥 Notifications optimisées (parallèle)
    await Promise.all(
      targetUsers
        .filter((user) => user.id !== senderId)
        .map((user) =>
          this.notificationsService.create({
            title: `Vous avez été mentionné par ${senderName}`,
            body: this.truncate(content, 120),
            link: `/forum/threads/${threadId}`,
            recipientId: user.id,
          }),
        ),
    );
  }

  private truncate(text: string, max: number) {
    return text.length > max ? text.substring(0, max) + '...' : text;
  }
}
