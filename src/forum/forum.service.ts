/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTopicDto } from './dto/create-topic.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { MentionDto } from './dto/mention.dto';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class ForumService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

  // Topics
  async createTopic(createTopicDto: CreateTopicDto, userId: string) {
    const topic = await this.prisma.forumTopic.create({
      data: {
        ...createTopicDto,
        createdBy: userId,
      },
    });

    // Ajouter l'auteur comme participant
    await this.prisma.topicParticipation.create({
      data: {
        topicId: topic.id,
        userId,
      },
    });

    return topic;
  }

  async findAllTopics(params: {
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.status) {
      where.status = params.status;
    }

    const [topics, total] = await Promise.all([
      this.prisma.forumTopic.findMany({
        where,
        include: {
          auteur: {
            select: {
              id: true,
              nom: true,
              prenom: true,
              role: true,
              photo: true,
            },
          },
          _count: {
            select: { messages: true },
          },
        },
        orderBy: [{ estPinned: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.forumTopic.count({ where }),
    ]);

    return {
      data: topics,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findTopicById(id: string, userId: string) {
    const topic = await this.prisma.forumTopic.findUnique({
      where: { id },
      include: {
        auteur: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            role: true,
            photo: true,
          },
        },
        messages: {
          include: {
            auteur: {
              select: {
                id: true,
                nom: true,
                prenom: true,
                role: true,
                photo: true,
              },
            },
            mentions: {
              include: {
                user: {
                  select: {
                    id: true,
                    nom: true,
                    prenom: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                nom: true,
                prenom: true,
              },
            },
          },
        },
      },
    });

    if (!topic) {
      throw new NotFoundException(`Topic avec l'ID ${id} non trouvé`);
    }

    // Mettre à jour la dernière lecture
    await this.prisma.topicParticipation.upsert({
      where: {
        topicId_userId: {
          topicId: id,
          userId,
        },
      },
      update: {
        lastRead: new Date(),
      },
      create: {
        topicId: id,
        userId,
      },
    });

    return topic;
  }

  async updateTopicStatus(
    id: string,
    status: string,
    userId: string,
    userRole: string,
  ) {
    const topic = await this.prisma.forumTopic.findUnique({
      where: { id },
    });

    if (!topic) {
      throw new NotFoundException(`Topic avec l'ID ${id} non trouvé`);
    }

    if (
      topic.createdBy !== userId &&
      userRole !== 'ADMIN' &&
      userRole !== 'CHEF_DEPARTEMENT'
    ) {
      throw new ForbiddenException(
        "Vous n'êtes pas autorisé à modifier ce topic",
      );
    }

    return this.prisma.forumTopic.update({
      where: { id },
      data: { status: status as any },
    });
  }

  async pinTopic(id: string, userId: string, userRole: string) {
    if (userRole !== 'ADMIN' && userRole !== 'CHEF_DEPARTEMENT') {
      throw new ForbiddenException(
        'Seul un administrateur peut épingler un topic',
      );
    }

    const topic = await this.prisma.forumTopic.findUnique({
      where: { id },
    });

    if (!topic) {
      throw new NotFoundException(`Topic avec l'ID ${id} non trouvé`);
    }

    return this.prisma.forumTopic.update({
      where: { id },
      data: { estPinned: !topic.estPinned },
    });
  }

  // Messages
  async createMessage(
    topicId: string,
    createMessageDto: CreateMessageDto,
    userId: string,
  ) {
    const topic = await this.prisma.forumTopic.findUnique({
      where: { id: topicId },
    });

    if (!topic) {
      throw new NotFoundException(`Topic avec l'ID ${topicId} non trouvé`);
    }

    if (topic.status === 'FERME') {
      throw new ForbiddenException(
        'Ce topic est fermé, vous ne pouvez pas envoyer de message',
      );
    }

    const message = await this.prisma.message.create({
      data: {
        ...createMessageDto,
        topicId,
        userId,
      },
      include: {
        auteur: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            role: true,
            photo: true,
          },
        },
      },
    });

    // Ajouter l'utilisateur comme participant
    await this.prisma.topicParticipation.upsert({
      where: {
        topicId_userId: {
          topicId,
          userId,
        },
      },
      update: {},
      create: {
        topicId,
        userId,
      },
    });

    // Extraire et traiter les mentions
    const mentions = await this.extractMentions(
      message.contenu,
      message.id,
      userId,
    );

    // Envoyer les notifications
    for (const mention of mentions) {
      await this.notificationService.createForumMentionNotification(
        mention.userId,
        message,
        topic,
      );
    }

    return { message, mentions };
  }

  private async extractMentions(
    content: string,
    messageId: string,
    senderId: string,
  ): Promise<MentionDto[]> {
    const mentions: MentionDto[] = [];
    const mentionRegex = /@(\w+(?::\w+)?)/g;
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
      const mentionValue = match[1];

      if (mentionValue === 'tous') {
        // Broadcast à tous les utilisateurs actifs
        const users = await this.prisma.user.findMany({
          where: { estActif: true },
          select: { id: true },
        });

        for (const user of users) {
          if (user.id !== senderId) {
            await this.createMention(messageId, user.id, 'TOUS', 'tous');
            mentions.push({ type: 'TOUS', valeur: 'tous', userId: user.id });
          }
        }
      } else if (mentionValue.startsWith('role:')) {
        const role = mentionValue.split(':')[1].toUpperCase();
        const users = await this.prisma.user.findMany({
          where: { role: role as any, estActif: true },
          select: { id: true },
        });

        for (const user of users) {
          if (user.id !== senderId) {
            await this.createMention(messageId, user.id, 'ROLE', mentionValue);
            mentions.push({
              type: 'ROLE',
              valeur: mentionValue,
              userId: user.id,
            });
          }
        }
      } else if (mentionValue.startsWith('groupe:')) {
        const groupeId = mentionValue.split(':')[1];
        const etudiants = await this.prisma.groupeEtudiant.findMany({
          where: { groupeId },
          include: { user: true },
        });

        for (const eg of etudiants) {
          if (eg.userId !== senderId) {
            await this.createMention(
              messageId,
              eg.userId,
              'GROUPE',
              mentionValue,
            );
            mentions.push({
              type: 'GROUPE',
              valeur: mentionValue,
              userId: eg.userId,
            });
          }
        }
      } else {
        // Mention d'un utilisateur spécifique
        const user = await this.prisma.user.findFirst({
          where: {
            OR: [
              { email: mentionValue },
              { nom: mentionValue },
              { prenom: mentionValue },
            ],
            estActif: true,
          },
        });

        if (user && user.id !== senderId) {
          await this.createMention(messageId, user.id, 'USER', mentionValue);
          mentions.push({
            type: 'USER',
            valeur: mentionValue,
            userId: user.id,
          });
        }
      }
    }

    return mentions;
  }

  private async createMention(
    messageId: string,
    userId: string,
    type: string,
    valeur: string,
  ) {
    return this.prisma.mention.create({
      data: {
        messageId,
        userId,
        type,
        valeur,
      },
    });
  }

  async getMentionsForUser(userId: string) {
    return this.prisma.mention.findMany({
      where: {
        userId,
        lu: false,
      },
      include: {
        message: {
          include: {
            topic: true,
            auteur: {
              select: {
                id: true,
                nom: true,
                prenom: true,
                role: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markMentionAsRead(mentionId: string, userId: string) {
    const mention = await this.prisma.mention.findFirst({
      where: {
        id: mentionId,
        userId,
      },
    });

    if (!mention) {
      throw new NotFoundException('Mention non trouvée');
    }

    return this.prisma.mention.update({
      where: { id: mentionId },
      data: { lu: true },
    });
  }
}
