/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmploiDto } from './dto/create-emploi.dto';
import { UpdateEmploiDto } from './dto/update-emploi.dto';

@Injectable()
export class EmploiDuTempsService {
  constructor(private prisma: PrismaService) {}

  async create(createEmploiDto: CreateEmploiDto) {
    // Vérifier si le groupe existe
    const groupe = await this.prisma.groupe.findUnique({
      where: { id: createEmploiDto.groupeId },
    });

    if (!groupe) {
      throw new NotFoundException('Groupe non trouvé');
    }

    // Vérifier si le cours existe
    const cours = await this.prisma.cours.findUnique({
      where: { id: createEmploiDto.coursId },
    });

    if (!cours) {
      throw new NotFoundException('Cours non trouvé');
    }

    // Vérifier les conflits d'horaires
    const conflicts = await this.prisma.emploiDuTemps.findFirst({
      where: {
        groupeId: createEmploiDto.groupeId,
        jour: createEmploiDto.jour,
        semaine: createEmploiDto.semaine,
        OR: [
          {
            AND: [
              { heureDebut: { lte: createEmploiDto.heureDebut } },
              { heureFin: { gt: createEmploiDto.heureDebut } },
            ],
          },
          {
            AND: [
              { heureDebut: { lt: createEmploiDto.heureFin } },
              { heureFin: { gte: createEmploiDto.heureFin } },
            ],
          },
        ],
      },
    });

    if (conflicts) {
      throw new Error("Conflit d'horaire détecté pour ce groupe");
    }

    return this.prisma.emploiDuTemps.create({
      data: createEmploiDto,
      include: {
        groupe: true,
        cours: {
          include: {
            enseignants: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });
  }

  async findAll(params: {
    groupeId?: string;
    enseignantId?: string;
    semaine?: number;
  }) {
    const where: any = {};

    if (params.groupeId) {
      where.groupeId = params.groupeId;
    }

    if (params.semaine) {
      where.semaine = params.semaine;
    }

    if (params.enseignantId) {
      where.cours = {
        enseignants: {
          some: {
            userId: params.enseignantId,
          },
        },
      };
    }

    const emplois = await this.prisma.emploiDuTemps.findMany({
      where,
      include: {
        groupe: true,
        cours: {
          include: {
            enseignants: {
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
        },
      },
      orderBy: [{ semaine: 'asc' }, { jour: 'asc' }, { heureDebut: 'asc' }],
    });

    return emplois;
  }

  async findOne(id: string) {
    const emploi = await this.prisma.emploiDuTemps.findUnique({
      where: { id },
      include: {
        groupe: true,
        cours: {
          include: {
            enseignants: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!emploi) {
      throw new NotFoundException(`Emploi du temps avec l'ID ${id} non trouvé`);
    }

    return emploi;
  }

  async update(id: string, updateEmploiDto: UpdateEmploiDto) {
    const emploiExists = await this.prisma.emploiDuTemps.findUnique({
      where: { id },
    });

    if (!emploiExists) {
      throw new NotFoundException(`Emploi du temps avec l'ID ${id} non trouvé`);
    }

    if (
      updateEmploiDto.groupeId ||
      updateEmploiDto.jour ||
      updateEmploiDto.heureDebut ||
      updateEmploiDto.heureFin ||
      updateEmploiDto.semaine
    ) {
      const groupeId = updateEmploiDto.groupeId || emploiExists.groupeId;
      const jour = updateEmploiDto.jour || emploiExists.jour;
      const semaine = updateEmploiDto.semaine || emploiExists.semaine;
      const heureDebut = updateEmploiDto.heureDebut || emploiExists.heureDebut;
      const heureFin = updateEmploiDto.heureFin || emploiExists.heureFin;

      const conflicts = await this.prisma.emploiDuTemps.findFirst({
        where: {
          id: { not: id },
          groupeId,
          jour,
          semaine,
          OR: [
            {
              AND: [
                { heureDebut: { lte: heureDebut } },
                { heureFin: { gt: heureDebut } },
              ],
            },
            {
              AND: [
                { heureDebut: { lt: heureFin } },
                { heureFin: { gte: heureFin } },
              ],
            },
          ],
        },
      });

      if (conflicts) {
        throw new Error("Conflit d'horaire détecté pour ce groupe");
      }
    }

    return this.prisma.emploiDuTemps.update({
      where: { id },
      data: updateEmploiDto,
      include: {
        groupe: true,
        cours: true,
      },
    });
  }

  async remove(id: string) {
    const emploiExists = await this.prisma.emploiDuTemps.findUnique({
      where: { id },
    });

    if (!emploiExists) {
      throw new NotFoundException(`Emploi du temps avec l'ID ${id} non trouvé`);
    }

    await this.prisma.emploiDuTemps.delete({
      where: { id },
    });

    return { message: 'Emploi du temps supprimé avec succès' };
  }

  async getEmploiForStudent(userId: string, semaine?: number) {
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

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    const groupeIds = user.etudiantGroupe.map((eg) => eg.groupeId);

    const where: any = {
      groupeId: { in: groupeIds },
    };

    if (semaine) {
      where.semaine = semaine;
    }

    return this.prisma.emploiDuTemps.findMany({
      where,
      include: {
        groupe: true,
        cours: {
          include: {
            enseignants: {
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
        },
      },
      orderBy: [{ semaine: 'asc' }, { jour: 'asc' }, { heureDebut: 'asc' }],
    });
  }

  async getEmploiForTeacher(userId: string, semaine?: number) {
    const where: any = {
      cours: {
        enseignants: {
          some: {
            userId,
          },
        },
      },
    };

    if (semaine) {
      where.semaine = semaine;
    }

    return this.prisma.emploiDuTemps.findMany({
      where,
      include: {
        groupe: true,
        cours: {
          include: {
            enseignants: {
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
        },
      },
      orderBy: [{ semaine: 'asc' }, { jour: 'asc' }, { heureDebut: 'asc' }],
    });
  }
}
