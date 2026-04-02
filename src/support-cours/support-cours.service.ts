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
import { CreateSupportDto } from './dto/create-support.dto';
import { UpdateSupportDto } from './dto/update-suppot.dto';

@Injectable()
export class SupportCoursService {
  constructor(private prisma: PrismaService) {}

  async create(
    createSupportDto: CreateSupportDto,
    uploadedBy: string,
    fichierUrl: string,
    typeFichier: string,
  ) {
    const cours = await this.prisma.cours.findUnique({
      where: { id: createSupportDto.coursId },
    });

    if (!cours) {
      throw new NotFoundException('Cours non trouvé');
    }

    return this.prisma.supportCours.create({
      data: {
        ...createSupportDto,
        fichierUrl,
        typeFichier,
        uploadedBy,
      },
      include: {
        cours: true,
      },
    });
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async findAll(params: { coursId?: string }) {
    const where: any = {};

    if (params.coursId) {
      where.coursId = params.coursId;
    }

    return this.prisma.supportCours.findMany({
      where,
      include: {
        cours: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const support = await this.prisma.supportCours.findUnique({
      where: { id },
      include: {
        cours: true,
      },
    });

    if (!support) {
      throw new NotFoundException(`Support avec l'ID ${id} non trouvé`);
    }

    return support;
  }

  async update(
    id: string,
    updateSupportDto: UpdateSupportDto,
    userId: string,
    userRole: string,
  ) {
    const support = await this.prisma.supportCours.findUnique({
      where: { id },
    });

    if (!support) {
      throw new NotFoundException(`Support avec l'ID ${id} non trouvé`);
    }

    // Vérifier si l'utilisateur est l'auteur ou un admin
    if (
      support.uploadedBy !== userId &&
      userRole !== 'ADMIN' &&
      userRole !== 'CHEF_DEPARTEMENT'
    ) {
      throw new ForbiddenException(
        "Vous n'êtes pas autorisé à modifier ce support",
      );
    }

    return this.prisma.supportCours.update({
      where: { id },
      data: updateSupportDto,
    });
  }

  async remove(id: string, userId: string, userRole: string) {
    const support = await this.prisma.supportCours.findUnique({
      where: { id },
    });

    if (!support) {
      throw new NotFoundException(`Support avec l'ID ${id} non trouvé`);
    }

    // Vérifier si l'utilisateur est l'auteur ou un admin
    if (
      support.uploadedBy !== userId &&
      userRole !== 'ADMIN' &&
      userRole !== 'CHEF_DEPARTEMENT'
    ) {
      throw new ForbiddenException(
        "Vous n'êtes pas autorisé à supprimer ce support",
      );
    }

    await this.prisma.supportCours.delete({
      where: { id },
    });

    return { message: 'Support supprimé avec succès' };
  }

  async getSupportsForStudent(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        etudiantGroupe: {
          include: {
            groupe: {
              include: {
                emplois: {
                  include: {
                    cours: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    const coursIds = new Set<string>();

    user.etudiantGroupe.forEach((eg) => {
      eg.groupe.emplois.forEach((emploi) => {
        coursIds.add(emploi.coursId);
      });
    });

    const supports = await this.prisma.supportCours.findMany({
      where: {
        coursId: { in: Array.from(coursIds) },
      },
      include: {
        cours: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return supports;
  }

  async getSupportsForTeacher(userId: string) {
    const cours = await this.prisma.cours.findMany({
      where: {
        enseignants: {
          some: {
            userId,
          },
        },
      },
      select: { id: true },
    });

    const coursIds = cours.map((c) => c.id);

    return this.prisma.supportCours.findMany({
      where: {
        coursId: { in: coursIds },
      },
      include: {
        cours: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
