/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGroupeDto } from './dto/create-groupe.dto';
import { UpdateGroupeDto } from './dto/update-groupe.dto';

@Injectable()
export class GroupeService {
  constructor(private prisma: PrismaService) {}

  async create(createGroupeDto: CreateGroupeDto) {
    const existing = await this.prisma.groupe.findUnique({
      where: { nom: createGroupeDto.nom },
    });

    if (existing) {
      throw new ConflictException(
        `Un groupe avec le nom ${createGroupeDto.nom} existe déjà`,
      );
    }

    return this.prisma.groupe.create({
      data: createGroupeDto,
    });
  }

  async findAll(params: {
    specialite?: string;
    niveau?: string;
    anneeScolaire?: string;
  }) {
    const where: any = {};

    if (params.specialite) {
      where.specialite = params.specialite;
    }

    if (params.niveau) {
      where.niveau = params.niveau;
    }

    if (params.anneeScolaire) {
      where.anneeScolaire = params.anneeScolaire;
    }

    return this.prisma.groupe.findMany({
      where,
      include: {
        etudiants: {
          include: {
            user: {
              select: {
                id: true,
                nom: true,
                prenom: true,
                email: true,
              },
            },
          },
        },
        emplois: {
          include: {
            cours: true,
          },
          take: 10,
        },
      },
      orderBy: [{ niveau: 'asc' }, { nom: 'asc' }],
    });
  }

  async findOne(id: string) {
    const groupe = await this.prisma.groupe.findUnique({
      where: { id },
      include: {
        etudiants: {
          include: {
            user: {
              select: {
                id: true,
                nom: true,
                prenom: true,
                email: true,
                telephone: true,
                photo: true,
              },
            },
          },
        },
        emplois: {
          include: {
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
        },
      },
    });

    if (!groupe) {
      throw new NotFoundException(`Groupe avec l'ID ${id} non trouvé`);
    }

    return groupe;
  }

  async update(id: string, updateGroupeDto: UpdateGroupeDto) {
    const groupeExists = await this.prisma.groupe.findUnique({
      where: { id },
    });

    if (!groupeExists) {
      throw new NotFoundException(`Groupe avec l'ID ${id} non trouvé`);
    }

    if (updateGroupeDto.nom) {
      const existing = await this.prisma.groupe.findFirst({
        where: {
          nom: updateGroupeDto.nom,
          NOT: { id },
        },
      });

      if (existing) {
        throw new ConflictException(
          `Un groupe avec le nom ${updateGroupeDto.nom} existe déjà`,
        );
      }
    }

    return this.prisma.groupe.update({
      where: { id },
      data: updateGroupeDto,
    });
  }

  async remove(id: string) {
    const groupeExists = await this.prisma.groupe.findUnique({
      where: { id },
    });

    if (!groupeExists) {
      throw new NotFoundException(`Groupe avec l'ID ${id} non trouvé`);
    }

    await this.prisma.groupe.delete({
      where: { id },
    });

    return { message: 'Groupe supprimé avec succès' };
  }

  async getEtudiants(id: string) {
    const groupe = await this.prisma.groupe.findUnique({
      where: { id },
      include: {
        etudiants: {
          include: {
            user: {
              select: {
                id: true,
                nom: true,
                prenom: true,
                email: true,
                telephone: true,
                photo: true,
              },
            },
          },
        },
      },
    });

    if (!groupe) {
      throw new NotFoundException(`Groupe avec l'ID ${id} non trouvé`);
    }

    return groupe.etudiants.map((eg) => eg.user);
  }
}
