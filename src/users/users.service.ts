/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  AssignGroupeDto,
  AssignMultipleGroupesDto,
} from './dto/assign-groupe.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: { skip?: number; take?: number; role?: string }) {
    const { skip, take, role } = params;

    const where: any = {};
    if (role) {
      where.role = role;
    }

    const users = await this.prisma.user.findMany({
      skip,
      take,
      where,
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        role: true,
        agentType: true,
        telephone: true,
        photo: true,
        estActif: true,
        createdAt: true,
        etudiantGroupe: {
          include: {
            groupe: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return users;
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        role: true,
        agentType: true,
        telephone: true,
        photo: true,
        estActif: true,
        createdAt: true,
        updatedAt: true,
        etudiantGroupe: {
          include: {
            groupe: true,
          },
        },
        coursEnseignes: {
          include: {
            cours: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`Utilisateur avec l'ID ${id} non trouvé`);
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const userExists = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!userExists) {
      throw new NotFoundException(`Utilisateur avec l'ID ${id} non trouvé`);
    }

    if (updateUserDto.email) {
      const emailExists = await this.prisma.user.findFirst({
        where: {
          email: updateUserDto.email,
          NOT: { id },
        },
      });

      if (emailExists) {
        throw new ConflictException('Cet email est déjà utilisé');
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        role: true,
        agentType: true,
        telephone: true,
        photo: true,
        estActif: true,
      },
    });

    return updatedUser;
  }

  async remove(id: string) {
    const userExists = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!userExists) {
      throw new NotFoundException(`Utilisateur avec l'ID ${id} non trouvé`);
    }

    await this.prisma.user.delete({
      where: { id },
    });

    return { message: 'Utilisateur supprimé avec succès' };
  }

  async assignGroupe(userId: string, assignGroupeDto: AssignGroupeDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`Utilisateur avec l'ID ${userId} non trouvé`);
    }

    if (user.role !== 'ETUDIANT') {
      throw new ConflictException(
        'Seul un étudiant peut être assigné à un groupe',
      );
    }

    const groupe = await this.prisma.groupe.findUnique({
      where: { id: assignGroupeDto.groupeId },
    });

    if (!groupe) {
      throw new NotFoundException(
        `Groupe avec l'ID ${assignGroupeDto.groupeId} non trouvé`,
      );
    }

    const existing = await this.prisma.groupeEtudiant.findUnique({
      where: {
        userId_groupeId: {
          userId,
          groupeId: assignGroupeDto.groupeId,
        },
      },
    });

    if (existing) {
      throw new ConflictException("L'étudiant est déjà dans ce groupe");
    }

    const assignment = await this.prisma.groupeEtudiant.create({
      data: {
        userId,
        groupeId: assignGroupeDto.groupeId,
      },
      include: {
        groupe: true,
      },
    });

    return assignment;
  }

  async removeGroupe(userId: string, groupeId: string) {
    const assignment = await this.prisma.groupeEtudiant.findUnique({
      where: {
        userId_groupeId: {
          userId,
          groupeId,
        },
      },
    });

    if (!assignment) {
      throw new NotFoundException('Assignation non trouvée');
    }

    await this.prisma.groupeEtudiant.delete({
      where: {
        userId_groupeId: {
          userId,
          groupeId,
        },
      },
    });

    return { message: 'Étudiant retiré du groupe avec succès' };
  }

  async getGroupes(userId: string) {
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
      throw new NotFoundException(`Utilisateur avec l'ID ${userId} non trouvé`);
    }

    return user.etudiantGroupe.map((eg) => eg.groupe);
  }

  async updatePassword(
    id: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`Utilisateur avec l'ID ${id} non trouvé`);
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );

    if (!isPasswordValid) {
      throw new ConflictException('Mot de passe actuel incorrect');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    return { message: 'Mot de passe mis à jour avec succès' };
  }

  async toggleActivation(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`Utilisateur avec l'ID ${id} non trouvé`);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { estActif: !user.estActif },
      select: {
        id: true,
        estActif: true,
      },
    });

    return updatedUser;
  }
}
