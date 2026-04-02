/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/require-await */
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateActualiteDto } from './dto/create-actualite.dto';
import { UpdateActualiteDto } from './dto/update-actualite.dto';

@Injectable()
export class ActualiteService {
  constructor(private prisma: PrismaService) {}

  async create(createActualiteDto: CreateActualiteDto, publiePar: string) {
    return this.prisma.actualite.create({
      data: {
        ...createActualiteDto,
        publiePar,
        dateExpiration: createActualiteDto.dateExpiration
          ? new Date(createActualiteDto.dateExpiration)
          : null,
      },
    });
  }

  async findAll(params: {
    cible?: string;
    userRole?: string;
    userId?: string;
    userGroupes?: string[];
  }) {
    const now = new Date();

    let where: {
      OR: Array<{ dateExpiration: null | { gt: Date } } | { cible: string }>;
    } = {
      OR: [{ dateExpiration: null }, { dateExpiration: { gt: now } }],
    };

    // Si l'utilisateur n'est pas admin, filtrer les actualités selon sa cible
    if (params.userRole !== 'ADMIN' && params.userRole !== 'CHEF_DEPARTEMENT') {
      const cibleConditions: any[] = [];

      // Actualités pour tous
      cibleConditions.push({ cible: null });
      cibleConditions.push({ cible: 'tous' });

      // Actualités pour le rôle de l'utilisateur
      if (params.userRole) {
        cibleConditions.push({ cible: `role:${params.userRole}` });
      }

      // Actualités pour les groupes de l'utilisateur
      if (params.userGroupes && params.userGroupes.length > 0) {
        params.userGroupes.forEach((groupeId) => {
          cibleConditions.push({ cible: `groupe:${groupeId}` });
        });
      }

      // Actualités pour l'utilisateur spécifique
      if (params.userId) {
        cibleConditions.push({ cible: `user:${params.userId}` });
      }

      where.OR = [
        ...where.OR,
        ...(cibleConditions as Array<{ cible: string }>),
      ];
    }

    const actualites: Awaited<ReturnType<typeof this.prisma.actualite.findMany>> = await this.prisma.actualite.findMany({
      where,
      orderBy: { datePublication: 'desc' },
    });

    return actualites;
  }

  async findOne(id: string) {
    const actualite = await this.prisma.actualite.findUnique({
      where: { id },
    });

    if (!actualite) {
      throw new NotFoundException(`Actualité avec l'ID ${id} non trouvée`);
    }

    return actualite;
  }

  async update(
    id: string,
    updateActualiteDto: UpdateActualiteDto,
    userId: string,
    userRole: string,
  ) {
    const actualite = await this.prisma.actualite.findUnique({
      where: { id },
    });

    if (!actualite) {
      throw new NotFoundException(`Actualité avec l'ID ${id} non trouvée`);
    }

    if (
      actualite.publiePar !== userId &&
      userRole !== 'ADMIN' &&
      userRole !== 'CHEF_DEPARTEMENT'
    ) {
      throw new ForbiddenException(
        "Vous n'êtes pas autorisé à modifier cette actualité",
      );
    }

    return this.prisma.actualite.update({
      where: { id },
      data: {
        ...updateActualiteDto,
        dateExpiration: updateActualiteDto.dateExpiration
          ? new Date(updateActualiteDto.dateExpiration)
          : null,
      },
    });
  }

  async remove(id: string, userId: string, userRole: string) {
    const actualite = await this.prisma.actualite.findUnique({
      where: { id },
    });

    if (!actualite) {
      throw new NotFoundException(`Actualité avec l'ID ${id} non trouvée`);
    }

    if (
      actualite.publiePar !== userId &&
      userRole !== 'ADMIN' &&
      userRole !== 'CHEF_DEPARTEMENT'
    ) {
      throw new ForbiddenException(
        "Vous n'êtes pas autorisé à supprimer cette actualité",
      );
    }

    await this.prisma.actualite.delete({
      where: { id },
    });

    return { message: 'Actualité supprimée avec succès' };
  }

  async getActualitesForUser(userId: string, userRole: string) {
    // Récupérer les groupes de l'utilisateur si c'est un étudiant
    let userGroupes: string[] = [];

    if (userRole === 'ETUDIANT') {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          etudiantGroupe: {
            include: {
              groupe: true,
            },
          },
        },
      });

      userGroupes = user?.etudiantGroupe.map((eg) => eg.groupeId) || [];
    }

    return this.findAll({
      userRole,
      userId,
      userGroupes,
    });
  }
}
