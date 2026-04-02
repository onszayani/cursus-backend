import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNewsDto } from './dto/create-news.dto';

@Injectable()
export class NewsService {
  constructor(private prisma: PrismaService) {}

  // Actualités pour un utilisateur (filtrées par groupe si étudiant)
  findForUser(userGroup?: string) {
    return this.prisma.news.findMany({
      where: userGroup
        ? { OR: [{ targetGroup: null }, { targetGroup: userGroup }] }
        : {},
      include: {
        author: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
    });
  }

  findById(id: string) {
    return this.prisma.news.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  create(dto: CreateNewsDto, authorId: string) {
    return this.prisma.news.create({
      data: { ...dto, authorId },
      include: {
        author: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async update(
    id: string,
    dto: Partial<CreateNewsDto>,
    userId: string,
    userRole: string,
  ) {
    const news = await this.prisma.news.findUnique({ where: { id } });
    if (!news) throw new NotFoundException('Actualité non trouvée');
    if (news.authorId !== userId && userRole !== 'admin') {
      throw new ForbiddenException(
        'Vous ne pouvez modifier que vos propres actualités',
      );
    }
    return this.prisma.news.update({ where: { id }, data: dto });
  }

  async remove(id: string, userId: string, userRole: string) {
    const news = await this.prisma.news.findUnique({ where: { id } });
    if (!news) throw new NotFoundException('Actualité non trouvée');
    if (news.authorId !== userId && userRole !== 'admin') {
      throw new ForbiddenException('Accès interdit');
    }
    return this.prisma.news.delete({ where: { id } });
  }
}
